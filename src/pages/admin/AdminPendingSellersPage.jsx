import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, Store, Phone, Mail, RefreshCw, FileText, ExternalLink } from 'lucide-react';
import { useSocket } from '../../hooks/useSocket';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { userAPI } from '../../api';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

export default function AdminPendingSellersPage() {
  const [sellers, setSellers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const { data } = await userAPI.pendingSellers();
      setSellers(data.data);
    } catch {
      toast({ title: 'Failed to load pending sellers', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const socket = useSocket();

  useEffect(() => { fetchPending(); }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = (seller) => setSellers((prev) => [{ ...seller, createdAt: new Date().toISOString() }, ...prev]);
    socket.on('newPendingSeller', handler);
    return () => socket.off('newPendingSeller', handler);
  }, [socket]);

  const handleAction = async (id, approve) => {
    setActionId(id);
    try {
      const { data } = await userAPI.approveSeller(id, approve);
      toast({ title: data.message });
      setSellers((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Action failed', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Pending Seller Approvals</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? 'Loading...' : `${sellers.length} seller${sellers.length !== 1 ? 's' : ''} awaiting approval`}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={fetchPending} disabled={isLoading} title="Refresh">
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-5 space-y-3">
              <div className="flex justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2 mt-2">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : sellers.length === 0 ? (
        <div className="text-center py-24">
          <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <h2 className="text-lg font-semibold mb-1">All caught up!</h2>
          <p className="text-muted-foreground">No pending seller applications at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sellers.map((seller) => (
            <Card key={seller.id}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="h-12 w-12 rounded-full bg-rosewood-100 flex items-center justify-center flex-shrink-0">
                      <Store className="h-6 w-6 text-rosewood-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold">{seller.fullName}</p>
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      </div>
                      {seller.storeName && (
                        <p className="text-sm text-rosewood-600 font-medium">{seller.storeName}</p>
                      )}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />{seller.email}
                        </span>
                        {seller.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />{seller.phone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Applied {formatDate(seller.createdAt)}
                      </p>
                      {seller.proofDocument ? (
                        <a
                          href={seller.proofDocument}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs text-rosewood-600 hover:underline font-medium"
                        >
                          <FileText className="h-3 w-3" />
                          View Proof of Residency
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="text-xs text-amber-600 mt-2 font-medium">No document submitted</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      disabled={actionId === seller.id}
                      onClick={() => handleAction(seller.id, true)}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-600 hover:bg-red-50"
                      disabled={actionId === seller.id}
                      onClick={() => handleAction(seller.id, false)}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import { refundAPI } from '../../api';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { formatDate, formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

const FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'];

export default function SellerRefundsPage() {
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [processing, setProcessing] = useState(null); // refund id being processed
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  const fetchRefunds = async () => {
    try {
      const res = await refundAPI.seller();
      setRefunds(res?.data?.data ?? []);
    } catch {
      toast({ title: 'Failed to load refund requests', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRefunds(); }, []);

  const handleApprove = async (orderId) => {
    setProcessing(orderId);
    try {
      await refundAPI.process(orderId, { approved: true });
      toast({ title: 'Refund approved', description: 'Order has been marked as refunded.' });
      await fetchRefunds();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to approve refund', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (orderId) => {
    if (!rejectNotes.trim()) {
      toast({ title: 'Please provide a reason for rejection', variant: 'destructive' });
      return;
    }
    setProcessing(orderId);
    try {
      await refundAPI.process(orderId, { approved: false, notes: rejectNotes.trim() });
      toast({ title: 'Refund rejected' });
      setRejectingId(null);
      setRejectNotes('');
      await fetchRefunds();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to reject refund', variant: 'destructive' });
    } finally {
      setProcessing(null);
    }
  };

  const filtered = filter === 'ALL' ? refunds : refunds.filter((r) => r.status === filter);
  const pendingCount = refunds.filter((r) => r.status === 'PENDING').length;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <RotateCcw className="h-6 w-6" />
          Refund Requests
          {pendingCount > 0 && (
            <span className="ml-1 inline-flex items-center justify-center rounded-full bg-yellow-500 text-white text-xs font-bold h-5 min-w-5 px-1">
              {pendingCount}
            </span>
          )}
        </h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              filter === f
                ? 'bg-rosewood-600 text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f === 'ALL' ? `All (${refunds.length})` : `${f} (${refunds.filter((r) => r.status === f).length})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <RotateCcw className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No {filter !== 'ALL' ? filter.toLowerCase() : ''} refund requests.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((refund) => {
            const order = refund.order;
            const buyer = order?.buyer;
            const isRejecting = rejectingId === refund.id;
            const isProcessing = processing === order?.id;

            return (
              <Card key={refund.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        to={`/seller/orders/${order?.id}`}
                        className="font-semibold text-rosewood-600 hover:underline"
                      >
                        Order #{order?.orderNumber}
                      </Link>
                      {buyer && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {buyer.fullName} · {buyer.email}
                        </p>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[refund.status]}`}>
                      {refund.status}
                    </span>
                  </div>

                  {/* Order amount */}
                  {order?.totalAmount && (
                    <p className="text-sm font-medium">
                      Order total: <span className="text-rosewood-600">{formatCurrency(parseFloat(order.totalAmount))}</span>
                    </p>
                  )}

                  {/* Reason */}
                  <div className="bg-muted/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-muted-foreground mb-1">Buyer's reason</p>
                    <p className="text-sm">{refund.reason}</p>
                  </div>

                  {/* Seller notes (if already processed) */}
                  {refund.notes && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-xs font-medium text-orange-700 mb-1">Your note</p>
                      <p className="text-sm text-orange-800">{refund.notes}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">{formatDate(refund.createdAt)}</p>

                  {/* Actions for PENDING */}
                  {refund.status === 'PENDING' && (
                    <div className="pt-1 space-y-2">
                      {!isRejecting ? (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700 text-white flex-1"
                            disabled={isProcessing}
                            onClick={() => handleApprove(order?.id)}
                          >
                            {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                            Approve Refund
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 text-destructive border-destructive hover:bg-destructive/10"
                            disabled={isProcessing}
                            onClick={() => { setRejectingId(refund.id); setRejectNotes(''); }}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <textarea
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={2}
                            placeholder="Reason for rejection (required)"
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={() => { setRejectingId(null); setRejectNotes(''); }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="flex-1"
                              disabled={isProcessing}
                              onClick={() => handleReject(order?.id)}
                            >
                              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                              Confirm Reject
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

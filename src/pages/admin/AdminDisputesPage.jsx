import { useState, useEffect } from 'react';
import { Loader2, AlertTriangle, ChevronDown, ChevronUp, X } from 'lucide-react';
import { disputeAPI } from '../../api';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [modalDispute, setModalDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await disputeAPI.admin();
      setDisputes(res.data.data.disputes || []);
    } catch (err) {
      toast({ title: 'Failed to load disputes', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const openModal = (dispute) => {
    setModalDispute(dispute);
    setResolution('');
  };

  const closeModal = () => {
    setModalDispute(null);
    setResolution('');
  };

  const handleSubmit = async () => {
    if (!resolution.trim()) {
      toast({ title: 'Resolution is required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      await disputeAPI.resolve(modalDispute.orderId, { resolution });
      closeModal();
      await fetchDisputes();
      toast({ title: 'Dispute resolved' });
    } catch (err) {
      toast({ title: 'Failed to resolve dispute', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Dispute Management</h1>

      {disputes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertTriangle className="h-12 w-12 text-muted-foreground" />
          <p>No disputes.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map((dispute) => {
            const isExpanded = expandedId === dispute.id;
            return (
              <Card key={dispute.id}>
                <CardContent className="p-4">
                  <div
                    className="flex items-center justify-between gap-4 cursor-pointer"
                    onClick={() => toggleExpand(dispute.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold">
                          {dispute.order?.orderNumber}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            dispute.status === 'RESOLVED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {dispute.order?.buyer?.fullName}
                      </span>
                      <span className="text-sm">{dispute.reason}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(dispute.createdAt)}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 shrink-0" />
                    ) : (
                      <ChevronDown className="h-5 w-5 shrink-0" />
                    )}
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t space-y-3">
                      <p className="text-sm">{dispute.description}</p>
                      {dispute.resolution && (
                        <p className="text-sm text-muted-foreground">
                          Resolution: {dispute.resolution}
                        </p>
                      )}
                      {dispute.status !== 'RESOLVED' && (
                        <Button onClick={() => openModal(dispute)}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {modalDispute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl w-full max-w-md shadow-2xl p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Resolve Dispute</h2>
              <button onClick={closeModal} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <textarea
              className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Enter resolution details..."
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
            />
            <div className="flex justify-end mt-4">
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Submit
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, RotateCcw, ArrowLeft } from 'lucide-react';
import { refundAPI } from '../../api';
import { Card, CardContent } from '../../components/ui/card';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import { Pagination, PaginationInfo } from '../../components/ui/Pagination';

const PAGE_SIZE = 10;

const STATUS_STYLES = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
};

export default function RefundsPage() {
  const navigate = useNavigate();
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    refundAPI.my()
      .then((res) => { if (active) setRefunds(res?.data?.data ?? []); })
      .catch(() => toast({ title: 'Failed to load refund requests', variant: 'destructive' }))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return (
    <div className="container mx-auto px-4 py-8 max-w-3xl flex justify-center py-12">
      <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
    </div>
  );

  const totalPages = Math.max(1, Math.ceil(refunds.length / PAGE_SIZE));
  const paginated = refunds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">My Refunds</h1>

      {refunds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <RotateCcw className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No refund requests yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginated.map((refund) => {
              const order = refund.order ?? null;
              const orderNumber = order?.orderNumber ?? refund.orderNumber ?? '—';
              const orderId = order?.id ?? null;
              const statusColor = STATUS_STYLES[refund.status] ?? 'bg-gray-100 text-gray-800';
              return (
                <Card key={refund.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        {orderId
                          ? <Link to={`/orders/${orderId}`} className="text-rosewood-600 hover:underline font-medium">{orderNumber}</Link>
                          : <span className="font-medium">{orderNumber}</span>}
                      </div>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold flex-shrink-0 whitespace-nowrap ${statusColor}`}>
                        {refund.status}
                      </span>
                    </div>
                    <p className="mt-2 text-sm">{refund.reason}</p>
                    {refund.notes && <p className="mt-1 text-sm text-muted-foreground">Seller note: {refund.notes}</p>}
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(refund.createdAt)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4 space-y-2">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            <PaginationInfo page={page} pageSize={PAGE_SIZE} total={refunds.length} />
          </div>
        </>
      )}
    </div>
  );
}

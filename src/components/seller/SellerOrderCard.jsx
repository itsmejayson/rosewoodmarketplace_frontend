import { useNavigate } from 'react-router-dom';
import { Banknote, Smartphone, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../lib/utils';

export default function SellerOrderCard({ order }) {
  const navigate = useNavigate();
  const tx = order.transaction;
  const needsAction =
    (tx?.paymentMethod === 'GCASH' && tx?.paymentStatus === 'PENDING_VERIFICATION') ||
    (tx?.paymentMethod === 'CASH' && tx?.paymentStatus === 'PENDING');

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:shadow-md ${needsAction ? 'border-amber-500 bg-amber-100 shadow-amber-200 shadow-md ring-1 ring-amber-400' : ''}`}
      onClick={() => navigate(`/seller/orders/${order.id}`)}
    >
      {needsAction && (
        <div className="bg-amber-400 px-4 py-1.5 flex items-center gap-2">
          <span className="animate-pulse text-sm">⚡</span>
          <span className="text-xs font-bold text-amber-900 tracking-wide uppercase">Action Required</span>
        </div>
      )}
      <CardContent className="p-4">
        <div className="flex flex-wrap items-start gap-4 justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold">#{order.orderNumber}</p>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              {tx && (
                <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold border ${
                  tx.paymentStatus === 'APPROVED'              ? 'border-green-300 bg-green-50 text-green-700' :
                  tx.paymentStatus === 'PENDING_VERIFICATION'  ? 'border-blue-300 bg-blue-50 text-blue-700' :
                  tx.paymentStatus === 'REJECTED'              ? 'border-red-300 bg-red-50 text-red-700' :
                  'border-border text-muted-foreground'
                }`}>
                  {tx.paymentMethod === 'GCASH' ? <Smartphone className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                  {tx.paymentStatus}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{formatDate(order.createdAt)}</p>
            <p className="text-sm mt-0.5">
              <span className="text-muted-foreground">Buyer: </span>
              <span className="font-medium">{order.buyer?.fullName}</span>
              {order.buyer?.phone && <span className="text-muted-foreground"> · {order.buyer.phone}</span>}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">{order.orderItems?.length} item(s)</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-xl font-bold text-rosewood-600">{formatCurrency(order.totalAmount)}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

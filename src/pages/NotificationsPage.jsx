import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ShoppingBag, CreditCard, AlertTriangle, ChevronRight, RotateCcw, ArrowLeft } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import useNotificationStore from '../store/notificationStore';
import { formatDate } from '../lib/utils';
import { Pagination, PaginationInfo } from '../components/ui/Pagination';

const PAGE_SIZE = 10;

const TYPE_CONFIG = {
  ORDER_PLACED:         { color: 'bg-blue-100 text-blue-600',    Icon: ShoppingBag,    label: 'Order' },
  ORDER_STATUS_UPDATE:  { color: 'bg-purple-100 text-purple-600', Icon: ShoppingBag,   label: 'Order Update' },
  PAYMENT_SUCCESS:      { color: 'bg-green-100 text-green-600',   Icon: CreditCard,    label: 'Payment' },
  PAYMENT_FAILED:       { color: 'bg-red-100 text-red-600',       Icon: CreditCard,    label: 'Payment' },
  PAYMENT_VERIFICATION: { color: 'bg-amber-100 text-amber-600',   Icon: CreditCard,    label: 'Verify Payment' },
  LOW_STOCK:            { color: 'bg-orange-100 text-orange-600', Icon: AlertTriangle, label: 'Stock Alert' },
  REFUND_REQUESTED:     { color: 'bg-orange-100 text-orange-600', Icon: RotateCcw,     label: 'Refund' },
  REFUND_APPROVED:      { color: 'bg-green-100 text-green-600',   Icon: RotateCcw,     label: 'Refund' },
  REFUND_REJECTED:      { color: 'bg-red-100 text-red-600',       Icon: RotateCcw,     label: 'Refund' },
  SYSTEM:               { color: 'bg-gray-100 text-gray-600',     Icon: Bell,          label: 'System' },
};

function getUrl(notification) {
  const data = notification.data || {};
  if (data.actionUrl) return data.actionUrl;
  switch (notification.type) {
    case 'ORDER_PLACED':        return data.orderId ? `/seller/orders/${data.orderId}` : null;
    case 'ORDER_STATUS_UPDATE': return data.orderId ? `/orders/${data.orderId}` : null;
    case 'PAYMENT_SUCCESS':
    case 'PAYMENT_FAILED':      return data.orderId ? `/orders/${data.orderId}` : null;
    case 'PAYMENT_VERIFICATION':return data.orderId ? `/seller/orders/${data.orderId}` : null;
    case 'LOW_STOCK':           return data.productId ? `/seller/products/${data.productId}/edit` : '/seller/products';
    case 'REFUND_REQUESTED':    return data.orderId ? `/seller/orders/${data.orderId}` : '/seller/refunds';
    case 'REFUND_APPROVED':
    case 'REFUND_REJECTED':     return data.orderId ? `/orders/${data.orderId}` : '/refunds';
    case 'SYSTEM':
      if (notification.title === 'New Seller Registration') return '/admin/pending-sellers';
      if (notification.title === 'Account Approved!') return '/seller/dashboard';
      return null;
    default: return null;
  }
}

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, fetch, markRead, markAllRead } = useNotificationStore();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  useEffect(() => { fetch(); }, []);

  const handleClick = async (n) => {
    if (!n.isRead) await markRead(n.id);
    const url = getUrl(n);
    if (url) navigate(url);
  };

  const totalPages = Math.max(1, Math.ceil(notifications.length / PAGE_SIZE));
  const paginated = notifications.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && <p className="text-sm text-muted-foreground">{unreadCount} unread</p>}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            <CheckCheck className="h-4 w-4 mr-1" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-3 w-1/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No notifications yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((n) => {
              const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.SYSTEM;
              const url = getUrl(n);
              const clickable = !!url;
              return (
                <Card
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={[
                    'transition-all',
                    clickable ? 'cursor-pointer hover:shadow-md hover:border-rosewood-200' : '',
                    !n.isRead ? 'border-l-4 border-l-rosewood-600 border-rosewood-300 bg-rosewood-100' : '',
                  ].join(' ')}
                >
                  <CardContent className="p-4">
                    <div className="flex gap-3 items-start">
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                        <cfg.Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p className={`text-sm font-semibold leading-snug ${!n.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{n.title}</p>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-snug">{n.message}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          <span className="text-xs text-muted-foreground">{formatDate(n.createdAt)}</span>
                          {clickable && (
                            <span className="inline-flex items-center gap-0.5 text-xs font-medium text-rosewood-600">
                              View action <ChevronRight className="h-3 w-3" />
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {!n.isRead && <div className="h-2.5 w-2.5 rounded-full bg-rosewood-500 mt-1 ring-2 ring-rosewood-200" />}
                        {clickable && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-4 space-y-2">
            <Pagination page={page} totalPages={totalPages} onPage={setPage} />
            <PaginationInfo page={page} pageSize={PAGE_SIZE} total={notifications.length} />
          </div>
        </>
      )}
    </div>
  );
}

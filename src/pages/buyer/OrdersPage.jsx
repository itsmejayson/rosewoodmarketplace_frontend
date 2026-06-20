import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { orderAPI, cartAPI } from '../../api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [reorderingId, setReorderingId] = useState(null);
  const navigate = useNavigate();

  const handleReorder = async (order) => {
    setReorderingId(order.id);
    try {
      for (const item of order.orderItems || []) {
        await cartAPI.addItem({
          productId: item.productId,
          quantity: 1,
          ...(item.selectedOptions ? { selectedOptions: item.selectedOptions } : {}),
        });
      }
      toast({ title: 'Items added to cart' });
      navigate('/cart');
    } catch (err) {
      toast({ title: 'Reorder failed', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setReorderingId(null);
    }
  };

  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await orderAPI.myOrders(params);
      setOrders(data.data || []);
      setMeta({ total: data.meta?.total || 0, pages: data.meta?.pages || 1, page });
    } catch {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['ALL','PENDING','AWAITING_PAYMENT','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map((s) => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Orders' : (ORDER_STATUS_LABELS[s] || s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-500" /></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No orders found.</p>
          <Link to="/marketplace"><Button className="mt-4 bg-rosewood-600 hover:bg-rosewood-700">Start Shopping</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Card
              key={order.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">#{order.orderNumber}</p>
                    <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
                    <p className="text-sm mt-1 text-muted-foreground">
                      {order.orderItems?.length} item{order.orderItems?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${ORDER_STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                      <p className="font-bold text-rosewood-600 mt-1">{formatCurrency(order.totalAmount)}</p>
                    </div>
                    {['DELIVERED', 'CANCELLED'].includes(order.status) && (
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        title="Reorder"
                        disabled={reorderingId === order.id}
                        onClick={(e) => { e.stopPropagation(); handleReorder(order); }}
                      >
                        {reorderingId === order.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                      </Button>
                    )}
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {meta.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchOrders(meta.page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">Page {meta.page} of {meta.pages}</span>
          <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => fetchOrders(meta.page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

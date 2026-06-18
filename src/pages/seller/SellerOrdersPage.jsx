import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { orderAPI } from '../../api';
import { formatDate, ORDER_STATUS_COLORS } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import SellerOrderCard from '../../components/seller/SellerOrderCard';

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = { page, limit: 10 };
      if (statusFilter !== 'ALL') params.status = statusFilter;
      const { data } = await orderAPI.sellerOrders(params);
      setOrders(data.data);
      setMeta(data.meta);
    } catch {
      toast({ title: 'Failed to load orders', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Orders</h1>
          <p className="text-muted-foreground text-sm">{meta.total} total orders</p>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {['ALL','PENDING','PAID','PROCESSING','SHIPPED','DELIVERED','CANCELLED'].map((s) => (
              <SelectItem key={s} value={s}>{s === 'ALL' ? 'All Orders' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-3 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <SellerOrderCard key={order.id} order={order} />
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

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Package, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { orderAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('order_id');
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      orderAPI.getOrder(orderId)
        .then(({ data }) => setOrder(data.data))
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [orderId]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-500" /></div>;

  return (
    <div className="container mx-auto px-4 py-16 max-w-lg text-center">
      <div className="flex justify-center mb-4">
        <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-green-600" />
        </div>
      </div>
      <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
      <p className="text-muted-foreground mb-6">
        Thank you for your order. We'll notify you when it's being processed.
      </p>

      {order && (
        <Card className="text-left mb-6">
          <CardContent className="p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Number</span>
              <span className="font-semibold">#{order.orderNumber}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Date</span>
              <span>{formatDate(order.createdAt)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total</span>
              <span className="font-bold text-rosewood-600">{formatCurrency(order.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Items</span>
              <span>{order.orderItems?.length} item(s)</span>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex gap-3">
        <Link to="/orders" className="flex-1">
          <Button variant="outline" className="w-full">
            <Package className="h-4 w-4 mr-2" /> View Orders
          </Button>
        </Link>
        <Link to="/marketplace" className="flex-1">
          <Button className="w-full bg-rosewood-600 hover:bg-rosewood-700">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Banknote, Smartphone, ShoppingBag, CheckCircle, Truck, Store } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import useCartStore from '../../store/cartStore';
import { orderAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

const deliverySchema = z.object({
  shippingName: z.string().min(2, 'Name is required'),
  shippingPhone: z.string().min(7, 'Contact number is required'),
  shippingAddress: z.string().min(2, 'Street is required'),
  shippingCity: z.string().min(2, 'Subdivision is required'),
  shippingState: z.string().min(2, 'Phase is required'),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  notes: z.string().optional(),
});

const pickupSchema = z.object({
  shippingName: z.string().optional(),
  shippingPhone: z.string().optional(),
  shippingAddress: z.string().optional(),
  shippingCity: z.string().optional(),
  shippingState: z.string().optional(),
  shippingZip: z.string().optional(),
  shippingCountry: z.string().optional(),
  notes: z.string().optional(),
});

const ALL_PAYMENT_METHODS = [
  { id: 'GCASH', label: 'GCash', description: 'Upload your GCash receipt after the order is confirmed.', icon: Smartphone },
  { id: 'CASH', label: 'Cash', description: 'Pay in cash upon pickup.', icon: Banknote },
];

const FULFILLMENT_TYPES = [
  {
    id: 'DELIVERY',
    label: 'Delivery',
    description: 'Seller delivers to your address. A delivery fee may be added by the seller before you pay.',
    icon: Truck,
  },
  {
    id: 'PICKUP',
    label: 'Pick Up',
    description: 'You pick up from the seller\'s store. Pay right away — no waiting for confirmation.',
    icon: Store,
  },
];

export default function CheckoutPage() {
  const { cart, fetchCart, clearCart } = useCartStore();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('GCASH');
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY');

  const availablePaymentMethods = fulfillmentType === 'DELIVERY'
    ? ALL_PAYMENT_METHODS.filter((m) => m.id === 'GCASH')
    : ALL_PAYMENT_METHODS;

  const handleFulfillmentChange = (type) => {
    setFulfillmentType(type);
    if (type === 'DELIVERY') setPaymentMethod('GCASH');
  };
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPickup = fulfillmentType === 'PICKUP';

  useEffect(() => { fetchCart(); }, []);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(isPickup ? pickupSchema : deliverySchema),
  });

  const total = cart?.subtotal || 0;

  const onSubmit = async (data) => {
    if (!cart?.cartItems?.length) {
      toast({ title: 'Your cart is empty', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const { data: res } = await orderAPI.checkout({ ...data, paymentMethod, fulfillmentType });
      const { order } = res.data;
      toast({
        title: 'Order placed!',
        description: isPickup
          ? `Order #${order.orderNumber} — you can pay now.`
          : `Order #${order.orderNumber} — waiting for seller to confirm.`,
      });
      await clearCart();
      navigate(`/orders/${order.id}`, { state: { justPlaced: true } });
    } catch (err) {
      toast({
        title: 'Checkout failed',
        description: err.response?.data?.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!cart?.cartItems?.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Your cart is empty.</p>
        <Button onClick={() => navigate('/marketplace')}>Browse Marketplace</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">

            {/* Fulfillment Type */}
            <Card>
              <CardHeader><CardTitle className="text-base">Fulfillment</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {FULFILLMENT_TYPES.map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleFulfillmentChange(id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                      fulfillmentType === id
                        ? 'border-rosewood-500 bg-rosewood-50'
                        : 'border-border hover:border-rosewood-300'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      fulfillmentType === id ? 'bg-rosewood-100' : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${fulfillmentType === id ? 'text-rosewood-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{label}</p>
                        {fulfillmentType === id && <CheckCircle className="h-4 w-4 text-rosewood-600" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Payment Method */}
            <Card>
              <CardHeader><CardTitle className="text-base">Payment Method</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {fulfillmentType === 'DELIVERY' && (
                  <p className="text-xs text-muted-foreground bg-blue-50 text-blue-700 rounded-md px-3 py-2">
                    GCash only — delivery orders require online payment.
                  </p>
                )}
                {availablePaymentMethods.map(({ id, label, description, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setPaymentMethod(id)}
                    className={`w-full flex items-start gap-3 p-3 rounded-lg border-2 text-left transition-colors ${
                      paymentMethod === id
                        ? 'border-rosewood-500 bg-rosewood-50'
                        : 'border-border hover:border-rosewood-300'
                    }`}
                  >
                    <div className={`h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      paymentMethod === id ? 'bg-rosewood-100' : 'bg-muted'
                    }`}>
                      <Icon className={`h-5 w-5 ${paymentMethod === id ? 'text-rosewood-600' : 'text-muted-foreground'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{label}</p>
                        {paymentMethod === id && <CheckCircle className="h-4 w-4 text-rosewood-600" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Shipping Info — only for DELIVERY */}
            {!isPickup && (
              <Card>
                <CardHeader><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: 'shippingName', label: 'Full Name', placeholder: 'Juan dela Cruz' },
                    { id: 'shippingPhone', label: 'Contact Number', placeholder: '09XX-XXX-XXXX' },
                    { id: 'shippingState', label: 'Phase', placeholder: 'e.g. Phase 1' },
                    { id: 'shippingAddress', label: 'Street', placeholder: 'e.g. Rizal St' },
                    { id: 'shippingCity', label: 'Subdivision', placeholder: 'e.g. Villa Verde Subdivision' },
                  ].map(({ id, label, placeholder }) => (
                    <div key={id} className="space-y-1">
                      <Label htmlFor={id}>{label}</Label>
                      <Input id={id} placeholder={placeholder} {...register(id)} />
                      {errors[id] && <p className="text-xs text-destructive">{errors[id].message}</p>}
                    </div>
                  ))}
                  <div className="space-y-1">
                    <Label htmlFor="notes">Order Notes (optional)</Label>
                    <Input id="notes" placeholder="Special instructions..." {...register('notes')} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pickup notes */}
            {isPickup && (
              <Card>
                <CardHeader><CardTitle className="text-base">Pickup Notes (optional)</CardTitle></CardHeader>
                <CardContent>
                  <Input placeholder="e.g. preferred pickup time..." {...register('notes')} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-20">
              <CardHeader><CardTitle className="text-base">Order Summary</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
                  {cart.cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground line-clamp-1 flex-1 mr-2">
                        {item.product.name} × {item.quantity}
                      </span>
                      <span className="font-medium flex-shrink-0">
                        ₱{(parseFloat(item.product.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between font-bold text-base">
                    <span>Subtotal</span>
                    <span className="text-rosewood-600">₱{total.toFixed(2)}</span>
                  </div>
                  {fulfillmentType === 'DELIVERY' && (
                    <p className="text-xs text-muted-foreground">+ Delivery fee (set by seller after order)</p>
                  )}
                </div>

                <div className={`mt-4 rounded-lg p-3 text-xs ${isPickup ? 'bg-green-50 text-green-700' : paymentMethod === 'GCASH' ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
                  {isPickup
                    ? <p>🏪 You'll be able to pay <strong>immediately</strong> after placing your order — no waiting required.</p>
                    : paymentMethod === 'GCASH'
                      ? <p>📱 The seller will confirm your order and may add a delivery fee. Once confirmed, upload your GCash receipt to pay.</p>
                      : <p>💵 The seller will confirm your order and may add a delivery fee. Pay in cash once confirmed.</p>
                  }
                </div>

                <Button
                  type="submit"
                  className="w-full mt-4 bg-rosewood-600 hover:bg-rosewood-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order...</>
                    : 'Place Order'
                  }
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}

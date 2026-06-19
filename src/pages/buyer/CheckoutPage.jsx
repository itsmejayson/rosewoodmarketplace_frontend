import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Banknote, Smartphone, ShoppingBag, CheckCircle, Truck, Store, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import useCartStore from '../../store/cartStore';
import { orderAPI, addressAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';
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
  { id: 'CASH', label: 'Cash', description: 'Pay in cash upon pickup or delivery.', icon: Banknote },
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

  const availablePaymentMethods = ALL_PAYMENT_METHODS;

  const handleFulfillmentChange = (type) => {
    setFulfillmentType(type);
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const isPickup = fulfillmentType === 'PICKUP';
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => { fetchCart(); }, []);
  useEffect(() => {
    addressAPI.list()
      .then(({ data }) => setSavedAddresses(data.data || []))
      .catch(() => {});
  }, []);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(isPickup ? pickupSchema : deliverySchema),
  });

  const applySavedAddress = (id) => {
    const a = savedAddresses.find((x) => String(x.id) === String(id));
    if (!a) return;
    setValue('shippingName', a.fullName || '');
    setValue('shippingPhone', a.phone || '');
    setValue('shippingAddress', a.address || '');
    setValue('shippingCity', a.city || '');
    setValue('shippingState', a.state || '');
    setValue('shippingZip', a.zip || '');
    setValue('shippingCountry', a.country || '');
  };

  const total = cart?.subtotal || 0;

  const onSubmit = (data) => {
    if (!cart?.cartItems?.length) {
      toast({ title: 'Your cart is empty', variant: 'destructive' });
      return;
    }
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const { data: res } = await orderAPI.checkout({ ...pendingData, paymentMethod, fulfillmentType });
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

  const FulfillIcon = fulfillmentType === 'PICKUP' ? Store : Truck;
  const PayIcon = paymentMethod === 'GCASH' ? Smartphone : Banknote;

  return (
    <>
    {/* Order Confirmation Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-base">Confirm Your Order</h3>
            <button onClick={() => setShowConfirm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {/* Items */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-2">
                {cart.cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between items-start text-sm">
                    <div className="flex-1 mr-2">
                      <p className="font-medium line-clamp-1">{item.product.name}</p>
                      {item.selectedOptions?.variants?.length > 0 && (
                        <p className="text-xs text-muted-foreground">{item.selectedOptions.variants.map(v => v.optionName).join(', ')}</p>
                      )}
                      {item.selectedOptions?.addons?.length > 0 && (
                        <p className="text-xs text-muted-foreground">+ {item.selectedOptions.addons.map(a => a.name).join(', ')}</p>
                      )}
                      <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                    </div>
                    <span className="font-medium text-rosewood-600 flex-shrink-0">{formatCurrency((item.selectedOptions?.unitPrice ?? parseFloat(item.product.price)) * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Fulfillment & Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Fulfillment</p>
                <div className="flex items-center gap-1.5">
                  <FulfillIcon className="h-4 w-4 text-rosewood-600" />
                  <span className="text-sm font-medium">{fulfillmentType === 'PICKUP' ? 'Pick Up' : 'Delivery'}</span>
                </div>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Payment</p>
                <div className="flex items-center gap-1.5">
                  <PayIcon className="h-4 w-4 text-rosewood-600" />
                  <span className="text-sm font-medium">{paymentMethod}</span>
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-3 flex justify-between items-center">
              <span className="font-semibold">Subtotal</span>
              <span className="text-xl font-bold text-rosewood-600">{formatCurrency(total)}</span>
            </div>
            {fulfillmentType === 'DELIVERY' && (
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> Delivery fee will be added by the seller after confirmation.
              </p>
            )}
          </div>

          <div className="p-4 border-t flex gap-3">
            <button
              onClick={() => setShowConfirm(false)}
              className="flex-1 py-2 rounded-lg border text-sm font-medium hover:bg-muted transition-colors"
            >
              Go Back & Edit
            </button>
            <Button
              onClick={handleConfirmOrder}
              className="flex-1 bg-rosewood-600 hover:bg-rosewood-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm Order
            </Button>
          </div>
        </div>
      </div>
    )}

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
                  {savedAddresses.length > 0 && (
                    <div className="space-y-1">
                      <Label htmlFor="savedAddress">Use a saved address</Label>
                      <select
                        id="savedAddress"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        defaultValue=""
                        onChange={(e) => applySavedAddress(e.target.value)}
                      >
                        <option value="">— Select a saved address —</option>
                        {savedAddresses.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.label ? `${a.label} — ` : ''}{a.fullName}, {a.address}, {a.city}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  {[
                    { id: 'shippingName', label: 'Full Name', placeholder: 'Juan dela Cruz' },
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
                    <Label htmlFor="shippingPhone">Contact Number</Label>
                    <Input
                      id="shippingPhone"
                      type="tel"
                      inputMode="tel"
                      placeholder="09XX-XXX-XXXX"
                      {...register('shippingPhone')}
                      onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9+\-()\s]/g, ''); }}
                    />
                    {errors.shippingPhone && <p className="text-xs text-destructive">{errors.shippingPhone.message}</p>}
                  </div>
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
                        {formatCurrency((item.selectedOptions?.unitPrice ?? parseFloat(item.product.price)) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 space-y-2 text-sm">
                  <div className="flex justify-between font-bold text-base">
                    <span>Subtotal</span>
                    <span className="text-rosewood-600">{formatCurrency(total)}</span>
                  </div>
                  {fulfillmentType === 'DELIVERY' && (
                    <p className="text-xs text-muted-foreground">+ Delivery fee (set by seller after order)</p>
                  )}
                </div>

                <div className={`mt-4 rounded-lg p-3 text-xs ${isPickup ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {isPickup
                    ? <p>🏪 You'll be able to pay <strong>immediately</strong> after placing your order — no waiting required.</p>
                    : paymentMethod === 'GCASH'
                      ? <p>📱 The seller will confirm your order and may add a delivery fee. Once confirmed, upload your GCash receipt to pay.</p>
                      : <p>💵 The seller will confirm your order and may add a delivery fee. Pay cash upon delivery.</p>
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
    </>
  );
}

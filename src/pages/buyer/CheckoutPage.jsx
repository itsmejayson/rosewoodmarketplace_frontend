import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Banknote, Smartphone, ShoppingBag, CheckCircle, Truck, Store, X, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import useCartStore from '../../store/cartStore';
import { orderAPI, addressAPI, storeAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

const deliverySchema = z.object({
  shippingName: z.string().min(2, 'Name is required'),
  shippingPhone: z.string().min(7, 'Contact number is required'),
  shippingState: z.string().min(1, 'Phase is required'),
  shippingAddress: z.string().min(1, 'Lot is required'),
  shippingCity: z.string().min(1, 'Block is required'),
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
    description: 'Seller delivers to your address.',
    icon: Truck,
  },
  {
    id: 'PICKUP',
    label: 'Pick Up',
    description: "You pick up from the seller's store. Pay right away — no waiting for confirmation.",
    icon: Store,
  },
];

function resolveUnitPrice(item) {
  return item.selectedOptions?.unitPrice != null
    ? parseFloat(item.selectedOptions.unitPrice)
    : parseFloat(item.product.price);
}

export default function CheckoutPage() {
  const { cart, fetchCart } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();

  const sellerIds = location.state?.sellerIds
    ?? (location.state?.sellerId ? [location.state.sellerId] : []);
  const itemIds = location.state?.itemIds ?? null; // null means "all items from those sellers"

  const [paymentMethod, setPaymentMethod] = useState('GCASH');
  const [fulfillmentType, setFulfillmentType] = useState('DELIVERY');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  // Map of sellerId -> { defaultDeliveryFee, freeDeliveryThreshold, storeName }
  const [sellerInfoMap, setSellerInfoMap] = useState({});

  const isPickup = fulfillmentType === 'PICKUP';

  useEffect(() => { fetchCart(); }, []);
  useEffect(() => {
    addressAPI.list()
      .then(({ data }) => setSavedAddresses(data.data || []))
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!sellerIds.length) return;
    Promise.all(
      sellerIds.map((sid) =>
        storeAPI.get(sid)
          .then(({ data }) => {
            const s = data.data?.seller;
            return [sid, {
              storeName: s?.storeName || s?.fullName || 'Unknown Store',
              defaultDeliveryFee: parseFloat(s?.defaultDeliveryFee || 0),
              freeDeliveryThreshold: s?.freeDeliveryThreshold ? parseFloat(s.freeDeliveryThreshold) : null,
            }];
          })
          .catch(() => [sid, { storeName: 'Unknown Store', defaultDeliveryFee: 0, freeDeliveryThreshold: null }])
      )
    ).then((entries) => setSellerInfoMap(Object.fromEntries(entries)));
  }, [sellerIds.join(',')]);

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

  // Filter to exactly the items the buyer selected in the cart
  const checkoutItems = (cart?.cartItems ?? []).filter((i) =>
    itemIds ? itemIds.includes(i.id) : sellerIds.includes(i.product.seller?.id)
  );

  // Per-store groups for display
  const storeGroups = sellerIds.map((sid) => {
    const items = checkoutItems.filter((i) => i.product.seller?.id === sid);
    const info = sellerInfoMap[sid] ?? { storeName: 'Unknown Store', defaultDeliveryFee: 0, freeDeliveryThreshold: null };
    const subtotal = items.reduce((s, i) => s + resolveUnitPrice(i) * i.quantity, 0);
    const deliveryFee = isPickup ? 0 : (
      info.freeDeliveryThreshold !== null && subtotal >= info.freeDeliveryThreshold
        ? 0
        : info.defaultDeliveryFee
    );
    const isFreeDelivery = !isPickup && info.freeDeliveryThreshold !== null && subtotal >= info.freeDeliveryThreshold;
    return { sellerId: sid, items, info, subtotal, deliveryFee, isFreeDelivery };
  }).filter((g) => g.items.length > 0);

  const grandSubtotal = storeGroups.reduce((s, g) => s + g.subtotal, 0);
  const grandDeliveryFee = storeGroups.reduce((s, g) => s + g.deliveryFee, 0);
  const grandTotal = grandSubtotal + (isPickup ? 0 : grandDeliveryFee);
  const totalItemCount = checkoutItems.reduce((s, i) => s + i.quantity, 0);

  const onSubmit = (data) => {
    if (!checkoutItems.length) {
      toast({ title: 'No items to checkout', variant: 'destructive' });
      return;
    }
    setPendingData(data);
    setShowConfirm(true);
  };

  const handleConfirmOrder = async () => {
    setShowConfirm(false);
    setIsSubmitting(true);
    try {
      const results = [];
      for (const group of storeGroups) {
        const { data: res } = await orderAPI.checkout({
          ...pendingData,
          paymentMethod,
          fulfillmentType,
          sellerId: group.sellerId,
        });
        results.push(res.data.order);
      }
      toast({
        title: results.length > 1 ? `${results.length} orders placed!` : 'Order placed!',
        description: results.length > 1
          ? `Order numbers: ${results.map((o) => o.orderNumber).join(', ')}`
          : `Order #${results[0].orderNumber}`,
      });
      await fetchCart();
      // Navigate to orders list when multiple orders, detail when single
      if (results.length === 1) {
        navigate(`/orders/${results[0].id}`, { state: { justPlaced: true } });
      } else {
        navigate('/orders', { state: { justPlaced: true } });
      }
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

  if (!checkoutItems.length) {
    return (
      <div className="container mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">No items to checkout.</p>
        <Button onClick={() => navigate('/cart')}>Back to Cart</Button>
      </div>
    );
  }

  const FulfillIcon = isPickup ? Store : Truck;
  const PayIcon = paymentMethod === 'GCASH' ? Smartphone : Banknote;

  return (
    <>
    {/* Confirmation Modal */}
    {showConfirm && (
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
        <div className="bg-background rounded-xl w-full max-w-md shadow-2xl flex flex-col max-h-[90vh]">
          <div className="flex items-center justify-between p-4 border-b">
            <h3 className="font-semibold text-base">Confirm Your Order{storeGroups.length > 1 ? 's' : ''}</h3>
            <button onClick={() => setShowConfirm(false)} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-4 space-y-4">
            {storeGroups.length > 1 && (
              <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-800">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>{storeGroups.length} separate orders will be created — one per store.</span>
              </div>
            )}

            {storeGroups.map((group) => (
              <div key={group.sellerId} className="space-y-2">
                <div className="flex items-center gap-1.5 text-sm font-semibold text-rosewood-700">
                  <Store className="h-4 w-4" /> {group.info.storeName}
                </div>
                <div className="space-y-1 pl-5">
                  {group.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-sm">
                      <div className="flex-1 mr-2">
                        <p className="font-medium line-clamp-1">{item.product.name}</p>
                        {item.selectedOptions?.variants?.length > 0 && (
                          <p className="text-xs text-muted-foreground">{item.selectedOptions.variants.map((v) => v.optionName).join(', ')}</p>
                        )}
                        <p className="text-xs text-muted-foreground">× {item.quantity}</p>
                      </div>
                      <span className="font-medium text-rosewood-600 flex-shrink-0">
                        {formatCurrency(resolveUnitPrice(item) * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pl-5 space-y-0.5 text-xs text-muted-foreground">
                  <div className="flex justify-between">
                    <span>Subtotal</span><span>{formatCurrency(group.subtotal)}</span>
                  </div>
                  {!isPickup && (
                    <div className="flex justify-between">
                      <span>Delivery fee</span>
                      {group.isFreeDelivery
                        ? <span className="text-green-600 font-medium">Free</span>
                        : <span>{group.deliveryFee > 0 ? formatCurrency(group.deliveryFee) : '—'}</span>
                      }
                    </div>
                  )}
                </div>
                {storeGroups.length > 1 && <div className="border-t" />}
              </div>
            ))}

            {/* Fulfillment & Payment */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Fulfillment</p>
                <div className="flex items-center gap-1.5">
                  <FulfillIcon className="h-4 w-4 text-rosewood-600" />
                  <span className="text-sm font-medium">{isPickup ? 'Pick Up' : 'Delivery'}</span>
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

            {/* Grand Total */}
            <div className="border-t pt-3 space-y-1.5 text-sm">
              {storeGroups.length > 1 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Combined subtotal</span>
                  <span>{formatCurrency(grandSubtotal)}</span>
                </div>
              )}
              {!isPickup && grandDeliveryFee >= 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Total delivery fees</span>
                  <span>{grandDeliveryFee > 0 ? formatCurrency(grandDeliveryFee) : 'Free'}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1 border-t">
                <span className="font-semibold">Grand Total</span>
                <span className="text-xl font-bold text-rosewood-600">{formatCurrency(grandTotal)}</span>
              </div>
            </div>
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
              Confirm {storeGroups.length > 1 ? `${storeGroups.length} Orders` : 'Order'}
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
                    onClick={() => setFulfillmentType(id)}
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
                {ALL_PAYMENT_METHODS.map(({ id, label, description, icon: Icon }) => (
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

            {/* Delivery Address */}
            {!isPickup && (
              <Card>
                <CardHeader><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="shippingName">Full Name *</Label>
                    <Input id="shippingName" placeholder="Juan dela Cruz" {...register('shippingName')} />
                    {errors.shippingName && <p className="text-xs text-destructive">{errors.shippingName.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="shippingState">Phase *</Label>
                    <Input id="shippingState" placeholder="e.g. Phase 1" {...register('shippingState')} />
                    {errors.shippingState && <p className="text-xs text-destructive">{errors.shippingState.message}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="shippingAddress">Lot *</Label>
                      <Input id="shippingAddress" placeholder="e.g. Lot 12" {...register('shippingAddress')} />
                      {errors.shippingAddress && <p className="text-xs text-destructive">{errors.shippingAddress.message}</p>}
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="shippingCity">Block *</Label>
                      <Input id="shippingCity" placeholder="e.g. Block 3" {...register('shippingCity')} />
                      {errors.shippingCity && <p className="text-xs text-destructive">{errors.shippingCity.message}</p>}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="shippingPhone">Contact Number *</Label>
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
              <CardHeader>
                <CardTitle className="text-base">
                  Order Summary
                  {storeGroups.length > 1 && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">({storeGroups.length} stores)</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Per-store breakdown */}
                {storeGroups.map((group, idx) => (
                  <div key={group.sellerId} className={idx > 0 ? 'pt-3 border-t' : ''}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <Store className="h-3.5 w-3.5 text-rosewood-600 flex-shrink-0" />
                      <span className="text-sm font-semibold truncate">{group.info.storeName}</span>
                    </div>
                    <div className="space-y-1 mb-2">
                      {group.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-muted-foreground">
                          <span className="line-clamp-1 flex-1 mr-2">{item.product.name} × {item.quantity}</span>
                          <span className="flex-shrink-0">{formatCurrency(resolveUnitPrice(item) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-0.5 text-xs">
                      <div className="flex justify-between text-muted-foreground">
                        <span>Subtotal</span><span>{formatCurrency(group.subtotal)}</span>
                      </div>
                      {!isPickup && (
                        <div className="flex justify-between text-muted-foreground">
                          <span>Delivery fee</span>
                          {group.isFreeDelivery
                            ? <span className="text-green-600 font-medium">Free</span>
                            : <span>{group.deliveryFee > 0 ? formatCurrency(group.deliveryFee) : '—'}</span>
                          }
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Grand total */}
                <div className="border-t pt-3 space-y-1 text-sm">
                  {storeGroups.length > 1 && !isPickup && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Total delivery fees</span>
                      <span>{grandDeliveryFee > 0 ? formatCurrency(grandDeliveryFee) : 'Free'}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base">
                    <span>Total ({totalItemCount} item{totalItemCount !== 1 ? 's' : ''})</span>
                    <span className="text-rosewood-600">{formatCurrency(grandTotal)}</span>
                  </div>
                  {storeGroups.length > 1 && (
                    <p className="text-xs text-muted-foreground">
                      {storeGroups.length} separate orders will be created — one per store.
                    </p>
                  )}
                </div>

                <div className={`rounded-lg p-3 text-xs ${isPickup ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                  {isPickup
                    ? <p>🏪 You'll be able to pay <strong>immediately</strong> after placing your order.</p>
                    : paymentMethod === 'GCASH'
                      ? <p>📱 After placing, upload your GCash receipt. You have <strong>5 minutes</strong> to submit.</p>
                      : <p>💵 Pay cash upon delivery.</p>
                  }
                </div>

                <Button
                  type="submit"
                  className="w-full bg-rosewood-600 hover:bg-rosewood-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting
                    ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Placing Order{storeGroups.length > 1 ? 's' : ''}...</>
                    : `Place Order${storeGroups.length > 1 ? 's' : ''}`
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

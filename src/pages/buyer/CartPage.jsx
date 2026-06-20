import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import useCartStore from '../../store/cartStore';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import { useState } from 'react';

export default function CartPage() {
  const { cart, fetchCart, updateItem, removeItem, isLoading } = useCartStore();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => { fetchCart(); }, []);

  const handleUpdate = async (itemId, productId, qty) => {
    if (qty < 1) return;
    setUpdatingId(itemId);
    try {
      await updateItem(productId, qty, itemId);
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Update failed', variant: 'destructive' });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRemove = async (itemId, productId) => {
    try {
      await removeItem(productId, itemId);
      toast({ title: 'Item removed from cart' });
    } catch {
      toast({ title: 'Failed to remove item', variant: 'destructive' });
    }
  };

  const total = cart?.subtotal || 0;

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
    </div>
  );

  if (!cart?.cartItems?.length) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <ShoppingBag className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
      <p className="text-muted-foreground mb-6">Browse our marketplace and add items to your cart.</p>
      <Link to="/marketplace"><Button className="bg-rosewood-600 hover:bg-rosewood-700">Browse Marketplace</Button></Link>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({cart.itemCount} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cart.cartItems.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-md overflow-hidden border flex-shrink-0 bg-muted">
                    <img
                      src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/products/${item.product.slug}`} className="font-semibold hover:text-rosewood-600 line-clamp-1">
                      {item.product.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{item.product.seller?.fullName}</p>
                    {item.selectedOptions?.variants?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedOptions.variants.map((v, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-rosewood-50 text-rosewood-700 border border-rosewood-200">
                            {v.optionName}
                          </span>
                        ))}
                      </div>
                    )}
                    {item.selectedOptions?.addons?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {item.selectedOptions.addons.map((a, i) => (
                          <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-muted text-muted-foreground border">
                            {a.name} +{formatCurrency(a.price)}
                          </span>
                        ))}
                      </div>
                    )}
                    <p className="text-rosewood-600 font-bold mt-1">
                      {formatCurrency(item.selectedOptions?.unitPrice ?? item.product.price)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button onClick={() => handleRemove(item.id, item.productId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <div className="flex items-center border rounded-md">
                      <button
                        className="p-1 hover:bg-muted"
                        onClick={() => handleUpdate(item.id, item.productId, item.quantity - 1)}
                        disabled={updatingId === item.id || item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                        {updatingId === item.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
                      </span>
                      <button
                        className="p-1 hover:bg-muted"
                        onClick={() => handleUpdate(item.id, item.productId, item.quantity + 1)}
                        disabled={updatingId === item.id || item.quantity >= item.product.stockQty}
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-sm font-medium">
                      {formatCurrency((item.selectedOptions?.unitPrice ?? parseFloat(item.product.price)) * item.quantity)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div>
          <Card className="lg:sticky lg:top-20">
            <CardHeader><CardTitle>Order Summary</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal ({cart.itemCount} items)</span>
                <span>{formatCurrency(cart.subtotal)}</span>
              </div>
              <div className="border-t pt-3 flex justify-between font-bold">
                <span>Total</span>
                <span className="text-rosewood-600">{formatCurrency(total)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full bg-rosewood-600 hover:bg-rosewood-700"
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

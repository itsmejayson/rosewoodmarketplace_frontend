import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, Store } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import useCartStore from '../../store/cartStore';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

function resolveUnitPrice(item) {
  return item.selectedOptions?.unitPrice != null
    ? parseFloat(item.selectedOptions.unitPrice)
    : parseFloat(item.product.price);
}

function groupBySeller(cartItems) {
  const map = new Map();
  for (const item of cartItems) {
    const seller = item.product.seller;
    const key = seller?.id ?? 'unknown';
    if (!map.has(key)) {
      map.set(key, {
        sellerId: key,
        storeName: seller?.storeName || seller?.fullName || 'Unknown Store',
        items: [],
      });
    }
    map.get(key).items.push(item);
  }
  return Array.from(map.values());
}

export default function CartPage() {
  const { cart, fetchCart, updateItem, removeItem, isLoading } = useCartStore();
  const navigate = useNavigate();
  const [updatingId, setUpdatingId] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchCart(); }, []);

  useEffect(() => {
    if (!cart?.cartItems) { setSelected(new Set()); return; }
    const validIds = new Set(cart.cartItems.map((i) => i.id));
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => validIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [cart?.cartItems]);

  const allIds = cart?.cartItems?.map((i) => i.id) ?? [];
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.has(id));
  const someSelected = selected.size > 0;

  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(allIds));

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (!someSelected) return;
    setDeleting(true);
    try {
      const toDelete = cart.cartItems.filter((i) => selected.has(i.id));
      await Promise.all(toDelete.map((i) => removeItem(i.productId, i.id)));
      setSelected(new Set());
      toast({ title: `${toDelete.length} item${toDelete.length !== 1 ? 's' : ''} removed` });
    } catch {
      toast({ title: 'Failed to remove some items', variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

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

  const groups = groupBySeller(cart.cartItems);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <h1 className="text-2xl font-bold mb-4">Shopping Cart ({cart.itemCount} items)</h1>

      {/* Select-all toolbar */}
      <div className="flex items-center gap-3 mb-4 px-1">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-rosewood-600 cursor-pointer"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span className="text-sm font-medium">
            {allSelected ? 'Deselect all' : 'Select all'} ({allIds.length})
          </span>
        </label>
        {someSelected && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="ml-auto"
          >
            {deleting
              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
              : <Trash2 className="h-4 w-4 mr-1" />
            }
            Remove selected ({selected.size})
          </Button>
        )}
      </div>

      {/* One row per store: items on left, order summary on right */}
      <div className="space-y-8">
        {groups.map((group) => {
          const groupTotal = group.items.reduce(
            (sum, item) => sum + resolveUnitPrice(item) * item.quantity,
            0
          );
          const groupItemCount = group.items.reduce((s, i) => s + i.quantity, 0);
          const groupAllSelected = group.items.every((i) => selected.has(i.id));

          const toggleGroup = () => {
            setSelected((prev) => {
              const next = new Set(prev);
              if (groupAllSelected) {
                group.items.forEach((i) => next.delete(i.id));
              } else {
                group.items.forEach((i) => next.add(i.id));
              }
              return next;
            });
          };

          return (
            <div key={group.sellerId} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Items card */}
              <div className="lg:col-span-2 border rounded-xl overflow-hidden">
                {/* Store header */}
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-rosewood-600 cursor-pointer flex-shrink-0"
                    checked={groupAllSelected}
                    onChange={toggleGroup}
                  />
                  <Store className="h-4 w-4 text-rosewood-600 flex-shrink-0" />
                  <Link
                    to={`/store/${group.sellerId}`}
                    className="font-semibold text-sm hover:text-rosewood-600 truncate"
                  >
                    {group.storeName}
                  </Link>
                  <span className="ml-auto text-xs text-muted-foreground whitespace-nowrap">
                    {groupItemCount} item{groupItemCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y">
                  {group.items.map((item) => (
                    <div key={item.id} className={`p-4 transition-colors ${selected.has(item.id) ? 'bg-rosewood-50/40' : ''}`}>
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-rosewood-600 cursor-pointer flex-shrink-0 mt-1"
                          checked={selected.has(item.id)}
                          onChange={() => toggleOne(item.id)}
                        />
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
                            {formatCurrency(resolveUnitPrice(item))}
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
                            {formatCurrency(resolveUnitPrice(item) * item.quantity)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Per-store Order Summary */}
              <div>
                <Card className="lg:sticky lg:top-20">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">Order Summary</CardTitle>
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Store className="h-3 w-3" /> {group.storeName}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {group.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className="text-muted-foreground truncate mr-2 flex-1">
                          {item.product.name}
                          {item.quantity > 1 && <span className="ml-1">×{item.quantity}</span>}
                        </span>
                        <span className="whitespace-nowrap">{formatCurrency(resolveUnitPrice(item) * item.quantity)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 flex justify-between font-bold text-sm">
                      <span>Subtotal ({groupItemCount} item{groupItemCount !== 1 ? 's' : ''})</span>
                      <span className="text-rosewood-600">{formatCurrency(groupTotal)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full bg-rosewood-600 hover:bg-rosewood-700"
                      onClick={() => navigate('/checkout', { state: { sellerId: group.sellerId } })}
                    >
                      Checkout <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
}

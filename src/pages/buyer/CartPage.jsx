import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Loader2, Store } from 'lucide-react';
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

  // Prune stale selections when cart updates
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
    <div className="bg-gray-50 min-h-screen flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
    </div>
  );

  if (!cart?.cartItems?.length) return (
    <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center px-4 py-20 text-center">
      <div className="h-24 w-24 rounded-full bg-rosewood-50 flex items-center justify-center mb-5">
        <ShoppingBag className="h-12 w-12 text-rosewood-300" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
      <p className="text-gray-500 mb-6 text-sm">Browse the marketplace and add items to get started.</p>
      <Link to="/marketplace"><Button className="bg-rosewood-600 hover:bg-rosewood-700 rounded-full px-6">Browse Marketplace</Button></Link>
    </div>
  );

  const groups = groupBySeller(cart.cartItems);

  // Order summary: only selected items
  const selectedItems = cart.cartItems.filter((i) => selected.has(i.id));
  const selectedGroups = groupBySeller(selectedItems);
  const grandTotal = selectedItems.reduce((sum, i) => sum + resolveUnitPrice(i) * i.quantity, 0);
  const selectedCount = selectedItems.reduce((s, i) => s + i.quantity, 0);
  const selectedSellerIds = [...new Set(selectedItems.map((i) => i.product.seller?.id).filter(Boolean))];
  const selectedItemIds = selectedItems.map((i) => i.id);

  return (
    <div className="bg-gray-50 min-h-screen">
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <h1 className="text-xl font-bold mb-4 text-gray-900">My Cart <span className="text-base font-normal text-gray-400">({cart.itemCount} items)</span></h1>

      {/* Select-all toolbar */}
      <div className="flex items-center gap-3 mb-4 bg-white rounded-xl px-4 py-3 shadow-sm">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 accent-rosewood-600 cursor-pointer"
            checked={allSelected}
            onChange={toggleAll}
          />
          <span className="text-sm font-medium text-gray-700">
            {allSelected ? 'Deselect all' : 'Select all'} ({allIds.length})
          </span>
        </label>
        {someSelected && (
          <button
            onClick={handleDeleteSelected}
            disabled={deleting}
            className="ml-auto flex items-center gap-1 text-xs font-medium text-red-500 hover:text-red-600 disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
            Remove ({selected.size})
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Cart items grouped by store */}
        <div className="lg:col-span-2 space-y-6">
          {groups.map((group) => {
            const groupAllSelected = group.items.every((i) => selected.has(i.id));
            const groupItemCount = group.items.reduce((s, i) => s + i.quantity, 0);

            const toggleGroup = () => {
              setSelected((prev) => {
                const next = new Set(prev);
                if (groupAllSelected) group.items.forEach((i) => next.delete(i.id));
                else group.items.forEach((i) => next.add(i.id));
                return next;
              });
            };

            return (
              <div key={group.sellerId} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                {/* Store header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-rosewood-600 cursor-pointer flex-shrink-0"
                    checked={groupAllSelected}
                    onChange={toggleGroup}
                  />
                  <Store className="h-4 w-4 text-rosewood-600 flex-shrink-0" />
                  <Link to={`/store/${group.sellerId}`} className="font-semibold text-sm hover:text-rosewood-600 truncate">
                    {group.storeName}
                  </Link>
                  <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">
                    {groupItemCount} item{groupItemCount !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Items */}
                <div className="divide-y divide-gray-50">
                  {group.items.map((item) => (
                    <div key={item.id} className={`p-4 transition-colors ${selected.has(item.id) ? 'bg-rosewood-50/30' : 'bg-white'}`}>
                      <div className="flex gap-3">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-rosewood-600 cursor-pointer flex-shrink-0 mt-1"
                          checked={selected.has(item.id)}
                          onChange={() => toggleOne(item.id)}
                        />
                        <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                          <img
                            src={item.product.images?.[0]?.url || '/placeholder-product.jpg'}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={`/products/${item.product.slug}`} className="font-semibold text-sm text-gray-900 hover:text-rosewood-600 line-clamp-1">
                            {item.product.name}
                          </Link>
                          {item.selectedOptions?.variants?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedOptions.variants.map((v, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-rosewood-50 text-rosewood-700 font-medium">
                                  {v.optionName}
                                </span>
                              ))}
                            </div>
                          )}
                          {item.selectedOptions?.addons?.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.selectedOptions.addons.map((a, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] bg-gray-100 text-gray-600">
                                  +{a.name}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-rosewood-600 font-bold text-sm mt-1.5">{formatCurrency(resolveUnitPrice(item))}</p>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button onClick={() => handleRemove(item.id, item.productId)} className="text-gray-300 hover:text-red-500 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                          <div className="flex items-center bg-gray-100 rounded-full">
                            <button
                              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors disabled:opacity-40"
                              onClick={() => handleUpdate(item.id, item.productId, item.quantity - 1)}
                              disabled={updatingId === item.id || item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-sm font-bold text-center">
                              {updatingId === item.id ? <Loader2 className="h-3 w-3 animate-spin mx-auto" /> : item.quantity}
                            </span>
                            <button
                              className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors disabled:opacity-40"
                              onClick={() => handleUpdate(item.id, item.productId, item.quantity + 1)}
                              disabled={updatingId === item.id || item.quantity >= item.product.stockQty}
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <p className="text-xs font-semibold text-gray-700">{formatCurrency(resolveUnitPrice(item) * item.quantity)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unified Order Summary */}
        <div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden lg:sticky lg:top-20">
            <div className="px-4 pt-4 pb-3 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Order Summary</h2>
              {selectedCount === 0 && (
                <p className="text-xs text-gray-400 mt-1">Select items to see your summary.</p>
              )}
            </div>

            {selectedCount > 0 && (
              <div className="px-4 py-4 space-y-4">
                {selectedGroups.map((group) => {
                  const groupSubtotal = group.items.reduce((sum, i) => sum + resolveUnitPrice(i) * i.quantity, 0);
                  return (
                    <div key={group.sellerId} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <Store className="h-3.5 w-3.5 text-rosewood-600 flex-shrink-0" />
                        <span className="text-sm font-semibold text-gray-800 truncate">{group.storeName}</span>
                      </div>
                      {group.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-xs text-gray-400 pl-5">
                          <span className="truncate mr-2 flex-1">
                            {item.product.name}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                          </span>
                          <span className="whitespace-nowrap">{formatCurrency(resolveUnitPrice(item) * item.quantity)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between text-sm pl-5 font-medium text-gray-700">
                        <span>Subtotal</span>
                        <span>{formatCurrency(groupSubtotal)}</span>
                      </div>
                    </div>
                  );
                })}

                <div className="border-t border-gray-100 pt-3 space-y-1">
                  <div className="flex justify-between font-bold text-gray-900">
                    <span>Total ({selectedCount} item{selectedCount !== 1 ? 's' : ''})</span>
                    <span className="text-rosewood-600">{formatCurrency(grandTotal)}</span>
                  </div>
                  {selectedSellerIds.length > 1 && (
                    <p className="text-xs text-gray-400">
                      {selectedSellerIds.length} separate orders — one per store.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="px-4 pb-4">
              <button
                className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${
                  selectedCount === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-rosewood-600 hover:bg-rosewood-700 text-white'
                }`}
                disabled={selectedCount === 0}
                onClick={() => navigate('/checkout', { state: { sellerIds: selectedSellerIds, itemIds: selectedItemIds } })}
              >
                Proceed to Checkout
                {selectedCount > 0 && <ArrowRight className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
    </div>
  );
}

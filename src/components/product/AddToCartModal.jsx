import { useState } from 'react';
import { X, ShoppingCart, Loader2, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from '../ui/toast';
import { formatCurrency } from '../../lib/utils';

let _idCounter = 0;
const uid = () => `item-${++_idCounter}`;

// Pre-select the option with the lowest priceModifier in each single-select group
function getDefaultVariants(groups) {
  const result = {};
  for (const group of (groups || [])) {
    if (group.maxSelect === 1 && group.options.length > 0) {
      const sorted = [...group.options].sort(
        (a, b) => parseFloat(a.priceModifier) - parseFloat(b.priceModifier)
      );
      result[group.id] = sorted[0].id;
    }
  }
  return result;
}

function makeItem(product) {
  return {
    id: uid(),
    selectedVariants: getDefaultVariants(product.variantGroups),
    selectedAddons: new Set(),
  };
}

// Pricing rules:
// - Single-select groups: the selected option's priceModifier IS the price (not added to base).
//   Base product price is ignored when at least one single-select group has a selection.
// - Multi-select groups: modifiers are added on top (they represent extra costs).
// - Add-ons: added on top.
// - If no single-select groups exist: use base product price + multi-select + add-ons.
function calcRowPrice(product, selectedVariants, selectedAddons) {
  const singleGroups = (product.variantGroups || []).filter(g => g.maxSelect === 1);
  const multiGroups  = (product.variantGroups || []).filter(g => g.maxSelect !== 1);

  let price = 0;

  if (singleGroups.length > 0) {
    // Each single-select group contributes its selected option's price directly
    for (const g of singleGroups) {
      const selId = selectedVariants[g.id];
      if (selId) {
        const opt = g.options.find(o => o.id === selId);
        price += parseFloat(opt?.priceModifier) || 0;
      } else {
        // Nothing chosen yet — use the lowest option as placeholder
        const lowest = Math.min(...g.options.map(o => parseFloat(o.priceModifier) || 0));
        price += lowest;
      }
    }
  } else {
    price = parseFloat(product.price);
  }

  // Multi-select group modifiers add on top
  for (const g of multiGroups) {
    const sel = selectedVariants[g.id];
    if (!sel) continue;
    const ids = sel instanceof Set ? [...sel] : [sel];
    for (const id of ids) {
      const opt = g.options.find(o => o.id === id);
      price += parseFloat(opt?.priceModifier) || 0;
    }
  }

  // Add-ons add on top
  for (const id of selectedAddons) {
    const a = (product.addons || []).find(a => a.id === id);
    price += parseFloat(a?.price) || 0;
  }

  return price;
}

// The lowest priceModifier across a single-select group's options
function groupMin(group) {
  return Math.min(...group.options.map(o => parseFloat(o.priceModifier) || 0));
}

function ItemRow({ index, item, product, onUpdate, onRemove, canRemove }) {
  const hasVariants = product.variantGroups?.length > 0;
  const hasAddons = product.addons?.length > 0;

  const handleVariantChange = (group, optionId) => {
    if (group.maxSelect === 1) {
      onUpdate({ selectedVariants: { ...item.selectedVariants, [group.id]: optionId } });
    } else {
      const current = new Set(item.selectedVariants[group.id] || []);
      if (current.has(optionId)) current.delete(optionId);
      else if (current.size < group.maxSelect) current.add(optionId);
      onUpdate({ selectedVariants: { ...item.selectedVariants, [group.id]: current } });
    }
  };

  const toggleAddon = (id) => {
    const n = new Set(item.selectedAddons);
    n.has(id) ? n.delete(id) : n.add(id);
    onUpdate({ selectedAddons: n });
  };

  const rowPrice = calcRowPrice(product, item.selectedVariants, item.selectedAddons);
  const hasSingleGroups = (product.variantGroups || []).some(g => g.maxSelect === 1);

  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-2.5">
      {/* Row header */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Item {index + 1}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-rosewood-600">{formatCurrency(rowPrice)}</span>
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Variant Groups */}
      {hasVariants && product.variantGroups.map(group => (
        <div key={group.id}>
          <label className="block text-xs font-medium mb-1 text-foreground/80">
            {group.name}
            {group.required && <span className="text-red-500 ml-0.5">*</span>}
            {group.maxSelect > 1 && <span className="text-muted-foreground ml-1">(up to {group.maxSelect})</span>}
          </label>

          {group.maxSelect === 1 ? (
            // Single-select → dropdown showing the option's price directly
            <select
              value={item.selectedVariants[group.id] || ''}
              onChange={e => handleVariantChange(group, e.target.value)}
              className="w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Choose {group.name} —</option>
              {group.options.map(opt => {
                const price = parseFloat(opt.priceModifier) || 0;
                return (
                  <option key={opt.id} value={opt.id}>
                    {opt.name}{price > 0 ? ` — ${formatCurrency(price)}` : ''}
                  </option>
                );
              })}
            </select>
          ) : (
            // Multi-select → chip toggles showing price as upcharge
            <div className="flex flex-wrap gap-1">
              {group.options.map(opt => {
                const sel = item.selectedVariants[group.id];
                const isSelected = sel instanceof Set && sel.has(opt.id);
                const mod = parseFloat(opt.priceModifier) || 0;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleVariantChange(group, opt.id)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors ${
                      isSelected
                        ? 'bg-rosewood-600 text-white border-rosewood-600'
                        : 'border-border hover:border-rosewood-400'
                    }`}
                  >
                    {opt.name}{mod > 0 ? ` +${formatCurrency(mod)}` : ''}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Add-ons */}
      {hasAddons && (
        <div>
          <p className="text-xs font-medium mb-1 text-foreground/80">
            Add-ons <span className="text-muted-foreground font-normal">(optional)</span>
          </p>
          <div className="space-y-1">
            {product.addons.map(addon => (
              <label key={addon.id} className="flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={item.selectedAddons.has(addon.id)}
                    onChange={() => toggleAddon(addon.id)}
                    className="rounded border-input accent-rosewood-600"
                  />
                  <span className="text-xs">{addon.name}</span>
                </div>
                <span className="text-xs text-rosewood-600 font-medium">+{formatCurrency(addon.price)}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddToCartModal({ product, onClose, onConfirm, isLoading }) {
  const hasOptions = product.variantGroups?.length > 0 || product.addons?.length > 0;
  const [items, setItems] = useState([makeItem(product)]);

  const updateItem = (index, patch) => {
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it));
  };

  const addRow = () => {
    if (items.length >= product.stockQty) return;
    setItems(prev => [...prev, makeItem(product)]);
  };

  const removeRow = (index) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const grandTotal = items.reduce(
    (sum, item) => sum + calcRowPrice(product, item.selectedVariants, item.selectedAddons),
    0
  );

  const handleConfirm = () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      for (const group of (product.variantGroups || [])) {
        const sel = item.selectedVariants[group.id];
        const hasSelection = sel instanceof Set ? sel.size > 0 : !!sel;
        if (group.required && !hasSelection) {
          toast({ title: `Item ${i + 1}: Please select "${group.name}"`, variant: 'destructive' });
          return;
        }
      }
    }

    const result = items.map(item => {
      const variants = (product.variantGroups || []).flatMap(g => {
        const sel = item.selectedVariants[g.id];
        const ids = sel instanceof Set ? [...sel] : sel ? [sel] : [];
        return ids.map(id => {
          const opt = g.options.find(o => o.id === id);
          return {
            groupId: g.id,
            groupName: g.name,
            optionId: id,
            optionName: opt?.name,
            priceModifier: parseFloat(opt?.priceModifier) || 0,
          };
        });
      });
      const addons = [...item.selectedAddons].map(id => {
        const a = (product.addons || []).find(a => a.id === id);
        return { addonId: id, name: a?.name, price: parseFloat(a?.price) || 0 };
      });
      const unitPrice = calcRowPrice(product, item.selectedVariants, item.selectedAddons);
      return { selectedOptions: { variants, addons, unitPrice } };
    });

    onConfirm(result);
  };

  // Header subtitle: show "from ₱X" if product has single-select variants, else base price
  const hasSingleGroups = (product.variantGroups || []).some(g => g.maxSelect === 1);
  const lowestPrice = hasSingleGroups
    ? Math.min(
        ...(product.variantGroups || [])
          .filter(g => g.maxSelect === 1)
          .flatMap(g => g.options.map(o => parseFloat(o.priceModifier) || 0))
      )
    : parseFloat(product.price);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl w-full max-w-sm shadow-2xl flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b gap-3">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-snug line-clamp-2">{product.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {hasSingleGroups ? `from ${formatCurrency(lowestPrice)}` : `${formatCurrency(product.price)} base price`}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground flex-shrink-0 mt-0.5">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {hasOptions ? (
            <>
              {items.map((item, index) => (
                <ItemRow
                  key={item.id}
                  index={index}
                  item={item}
                  product={product}
                  onUpdate={(patch) => updateItem(index, patch)}
                  onRemove={() => removeRow(index)}
                  canRemove={items.length > 1}
                />
              ))}

              {items.length < product.stockQty && (
                <button
                  type="button"
                  onClick={addRow}
                  className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg border border-dashed border-rosewood-300 text-rosewood-600 text-xs font-medium hover:bg-rosewood-50 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" /> Add another item
                </button>
              )}
            </>
          ) : (
            /* No options — simple quantity stepper */
            <div className="flex items-center justify-between py-2">
              <span className="text-sm font-medium">Quantity</span>
              <div className="flex items-center border rounded-lg overflow-hidden">
                <button
                  type="button"
                  className="px-3 py-1.5 hover:bg-muted text-base font-medium disabled:opacity-40"
                  onClick={() => setItems(prev => prev.length > 1 ? prev.slice(0, -1) : prev)}
                  disabled={items.length <= 1}
                >−</button>
                <span className="px-3 py-1.5 text-sm font-semibold min-w-[2rem] text-center">{items.length}</span>
                <button
                  type="button"
                  className="px-3 py-1.5 hover:bg-muted text-base font-medium disabled:opacity-40"
                  onClick={addRow}
                  disabled={items.length >= product.stockQty}
                >+</button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">{items.length} item{items.length !== 1 ? 's' : ''}</span>
            <span className="font-bold text-rosewood-600 text-base">{formatCurrency(grandTotal)}</span>
          </div>
          <Button
            className="w-full bg-rosewood-600 hover:bg-rosewood-700"
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading
              ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
              : <ShoppingCart className="h-4 w-4 mr-2" />
            }
            Add to Cart · {formatCurrency(grandTotal)}
          </Button>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, Package, ToggleLeft, ToggleRight, Search, X, CheckSquare } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { productAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [isBulkActing, setIsBulkActing] = useState(false);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data } = await productAPI.myProducts({ page, limit: 10 });
      setProducts(data.data);
      setMeta(data.meta);
      setSelectedIds([]);
    } catch {
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => p.name?.toLowerCase().includes(q));
  }, [products, search]);

  const allSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.includes(p.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      const filteredIds = new Set(filteredProducts.map((p) => p.id));
      setSelectedIds((prev) => prev.filter((id) => !filteredIds.has(id)));
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredProducts.map((p) => p.id)])));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await productAPI.delete(id);
      toast({ title: `"${name}" deleted` });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    } catch (err) {
      toast({ title: 'Failed to delete product', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      await productAPI.update(product.id, { isAvailable: !product.isAvailable });
      setProducts((prev) => prev.map((p) => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p));
      toast({ title: `Product ${product.isAvailable ? 'hidden' : 'made available'}` });
    } catch {
      toast({ title: 'Update failed', variant: 'destructive' });
    }
  };

  const handleBulkSetAvailability = async (isAvailable) => {
    const ids = [...selectedIds];
    setIsBulkActing(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await productAPI.update(id, { isAvailable });
        setProducts((prev) => prev.map((p) => p.id === id ? { ...p, isAvailable } : p));
        ok += 1;
      } catch {
        // continue with remaining
      }
    }
    setIsBulkActing(false);
    setSelectedIds([]);
    toast({
      title: `${ok} product${ok === 1 ? '' : 's'} ${isAvailable ? 'enabled' : 'disabled'}`,
      variant: ok === ids.length ? undefined : 'destructive',
    });
  };

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (!confirm(`Delete ${ids.length} selected product${ids.length === 1 ? '' : 's'}? This cannot be undone.`)) return;
    setIsBulkActing(true);
    let ok = 0;
    for (const id of ids) {
      try {
        await productAPI.delete(id);
        setProducts((prev) => prev.filter((p) => p.id !== id));
        ok += 1;
      } catch {
        // continue with remaining
      }
    }
    setIsBulkActing(false);
    setSelectedIds([]);
    toast({
      title: `${ok} product${ok === 1 ? '' : 's'} deleted`,
      variant: ok === ids.length ? undefined : 'destructive',
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Products</h1>
          <p className="text-muted-foreground">{meta.total} products</p>
        </div>
        <Link to="/seller/products/new">
          <Button className="bg-rosewood-600 hover:bg-rosewood-700"><Plus className="h-4 w-4 mr-1" />New Product</Button>
        </Link>
      </div>

      {!isLoading && products.length > 0 && (
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer select-none" title="Select all">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-rosewood-600"
              checked={allSelected}
              onChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground hidden sm:inline">Select all</span>
          </label>
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search products by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-9"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {selectedIds.length >= 1 && (
        <div className="sticky top-16 z-10 bg-background border rounded-lg p-3 mb-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-rosewood-600" />
            {selectedIds.length} selected
          </span>
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <Button variant="outline" size="sm" disabled={isBulkActing} onClick={() => handleBulkSetAvailability(true)}>
              {isBulkActing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ToggleRight className="h-3 w-3 mr-1" />}Enable Selected
            </Button>
            <Button variant="outline" size="sm" disabled={isBulkActing} onClick={() => handleBulkSetAvailability(false)}>
              {isBulkActing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <ToggleLeft className="h-3 w-3 mr-1" />}Disable Selected
            </Button>
            <Button variant="destructive" size="sm" disabled={isBulkActing} onClick={handleBulkDelete}>
              {isBulkActing ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}Delete Selected
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 flex gap-4">
              <Skeleton className="w-16 h-16 rounded flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/4" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-8 w-8 rounded" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">No products yet. Add your first product!</p>
          <Link to="/seller/products/new"><Button className="bg-rosewood-600 hover:bg-rosewood-700">Add Product</Button></Link>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No products match "{search}".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const soldOut = product.stockQty === 0 || product.isAvailable === false;
            return (
            <Card key={product.id} className={!product.isAvailable ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="flex items-start pt-1 flex-shrink-0">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input accent-rosewood-600"
                      checked={selectedIds.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </div>
                  <div className="w-16 h-16 rounded border bg-muted flex-shrink-0 overflow-hidden">
                    <img src={product.images?.[0]?.url || '/placeholder-product.jpg'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold line-clamp-1">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category?.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <Badge variant={product.productType === 'FOOD' ? 'success' : 'secondary'} className="text-xs">
                            {product.productType}
                          </Badge>
                          <Badge variant={product.isAvailable ? 'default' : 'outline'} className="text-xs">
                            {product.isAvailable ? 'Available' : 'Hidden'}
                          </Badge>
                          {soldOut && (
                            <Badge variant="destructive" className="text-xs">Sold Out</Badge>
                          )}
                          {product.stockQty <= 10 && (
                            <Badge variant="destructive" className="text-xs">Low Stock: {product.stockQty}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-rosewood-600">{formatCurrency(product.price)}</p>
                        <p className="text-xs text-muted-foreground">{product.stockQty} in stock</p>
                        <p className="text-xs text-muted-foreground">{product.salesCount} sold</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    <Link to={`/seller/products/${product.id}/edit`}>
                      <Button variant="outline" size="sm"><Edit className="h-3 w-3" /></Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleAvailability(product)}
                      title={product.isAvailable ? 'Hide product' : 'Make available'}
                    >
                      {product.isAvailable ? <ToggleRight className="h-4 w-4 text-green-600" /> : <ToggleLeft className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={deletingId === product.id}
                    >
                      {deletingId === product.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}

      {meta.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={meta.page <= 1} onClick={() => fetchProducts(meta.page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">Page {meta.page} of {meta.pages}</span>
          <Button variant="outline" size="sm" disabled={meta.page >= meta.pages} onClick={() => fetchProducts(meta.page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

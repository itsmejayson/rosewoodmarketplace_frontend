import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ShoppingCart, AlertCircle, X, Heart } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { productAPI, favoriteAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/toast';
import AddToCartModal from '../../components/product/AddToCartModal';

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [modalProduct, setModalProduct] = useState(null);
  const [fetchingProduct, setFetchingProduct] = useState(null);
  const [adding, setAdding] = useState(false);

  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const debounceRef = useRef(null);

  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const params = {
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    productType: searchParams.get('productType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    sortOrder: searchParams.get('sortOrder') || '',
    page: parseInt(searchParams.get('page') || '1'),
  };

  // Count of active filters (excluding default sort/page)
  const activeFilterCount = ['search', 'categoryId', 'productType', 'minPrice', 'maxPrice']
    .filter((k) => params[k]).length + (params.sortBy && params.sortBy !== 'newest' ? 1 : 0);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiParams = { ...params, limit: 10 };
      // Translate sort dropdown into backend sortBy/sortOrder
      if (params.sortBy === 'priceLow') { apiParams.sortBy = 'price'; apiParams.sortOrder = 'asc'; }
      else if (params.sortBy === 'priceHigh') { apiParams.sortBy = 'price'; apiParams.sortOrder = 'desc'; }
      else if (params.sortBy === 'popularity') { apiParams.sortBy = 'popularity'; }
      else { apiParams.sortBy = 'newest'; }
      const { data } = await productAPI.list(apiParams);
      setProducts(data.data);
      setMeta(data.meta);
    } catch {
      toast({ title: 'Error', description: 'Failed to load products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => {
    productAPI.getCategories().then(({ data }) => setCategories(data.data));
  }, []);

  // Load which products are favorited (buyers only)
  useEffect(() => {
    if (user?.role !== 'BUYER') return;
    favoriteAPI.list()
      .then(({ data }) => {
        const ids = (data.data || []).map((f) => (f.product || f).id);
        setFavoriteIds(new Set(ids));
      })
      .catch(() => {});
  }, [user?.id]);

  // Debounced search (300ms) -> URL param
  useEffect(() => {
    if (searchInput === (searchParams.get('search') || '')) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => updateParam('search', searchInput), 300);
    return () => clearTimeout(debounceRef.current);
  }, [searchInput]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearchParams(new URLSearchParams());
  };

  const toggleFavorite = async (productId) => {
    if (!user || user.role !== 'BUYER') {
      toast({ title: 'Please log in as a buyer to save favorites', variant: 'destructive' });
      return;
    }
    const isFav = favoriteIds.has(productId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      isFav ? next.delete(productId) : next.add(productId);
      return next;
    });
    try {
      await favoriteAPI.toggle(productId);
    } catch {
      // revert on failure
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(productId) : next.delete(productId);
        return next;
      });
      toast({ title: 'Failed to update favorite', variant: 'destructive' });
    }
  };

  const handleAddToCartClick = async (product) => {
    if (!user) { toast({ title: 'Please log in to add items to cart', variant: 'destructive' }); return; }
    if (user.role !== 'BUYER') return;
    setFetchingProduct(product.id);
    try {
      const { data } = await productAPI.getBySlug(product.slug);
      setModalProduct(data.data);
    } catch {
      toast({ title: 'Failed to load product', variant: 'destructive' });
    } finally {
      setFetchingProduct(null);
    }
  };

  const handleConfirmAdd = async (items) => {
    setAdding(true);
    try {
      for (const item of items) {
        const hasOptions = item.selectedOptions.variants?.length || item.selectedOptions.addons?.length;
        await addItem(modalProduct.id, 1, hasOptions ? item.selectedOptions : null);
      }
      toast({ title: `${items.length}× ${modalProduct.name} added to cart!` });
      setModalProduct(null);
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  return (
    <>
    {modalProduct && (
      <AddToCartModal
        product={modalProduct}
        onClose={() => setModalProduct(null)}
        onConfirm={handleConfirmAdd}
        isLoading={adding}
      />
    )}
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Browse fresh food and quality materials</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <Select value={params.productType || 'ALL'} onValueChange={(v) => updateParam('productType', v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="FOOD">Food</SelectItem>
            <SelectItem value="MATERIAL">Materials</SelectItem>
          </SelectContent>
        </Select>
        <Select value={params.categoryId || 'ALL'} onValueChange={(v) => updateParam('categoryId', v === 'ALL' ? '' : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Categories</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={params.sortBy} onValueChange={(v) => updateParam('sortBy', v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="priceLow">Price: Low-High</SelectItem>
            <SelectItem value="priceHigh">Price: High-Low</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Price range + active filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Input
            key={`min-${params.minPrice}`}
            type="number"
            min="0"
            placeholder="Min ₱"
            className="w-[110px]"
            defaultValue={params.minPrice}
            onBlur={(e) => updateParam('minPrice', e.target.value)}
          />
          <span className="text-muted-foreground">–</span>
          <Input
            key={`max-${params.maxPrice}`}
            type="number"
            min="0"
            placeholder="Max ₱"
            className="w-[110px]"
            defaultValue={params.maxPrice}
            onBlur={(e) => updateParam('maxPrice', e.target.value)}
          />
        </div>
        {activeFilterCount > 0 && (
          <>
            <Badge variant="secondary">{activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</Badge>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" /> Clear filters
            </Button>
          </>
        )}
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {meta.total} product{meta.total !== 1 ? 's' : ''} found
      </p>

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-lg overflow-hidden border bg-card">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-8 w-full mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No products found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
              {/* Image */}
              <div className="relative overflow-hidden bg-muted h-48 flex-shrink-0">
                <img
                  src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                />
                <Badge
                  className="absolute top-2 left-2 text-xs"
                  variant={product.productType === 'FOOD' ? 'success' : 'secondary'}
                >
                  {product.productType}
                </Badge>
                {user?.role === 'BUYER' && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(product.id); }}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 hover:bg-white shadow flex items-center justify-center z-10"
                    title={favoriteIds.has(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart className={`h-4 w-4 ${favoriteIds.has(product.id) ? 'fill-rosewood-500 text-rosewood-500' : 'text-muted-foreground'}`} />
                  </button>
                )}
                {product.stockQty === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Out of Stock</span>
                  </div>
                )}
              </div>

              {/* Content — flex-col so button is pushed to bottom */}
              <CardContent className="p-4 flex flex-col flex-1">
                {/* Top info */}
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-xs text-muted-foreground">{product.category?.name}</p>
                    {product.seller?.storeName && (
                      <Link
                        to={`/store/${product.seller.id}`}
                        className="text-xs text-rosewood-600 hover:underline font-medium truncate max-w-[100px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.seller.storeName}
                      </Link>
                    )}
                  </div>
                  <Link to={`/products/${product.slug}`} className="font-semibold text-sm hover:text-rosewood-600 line-clamp-2 block mt-0.5">
                    {product.name}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{product.description}</p>
                </div>

                {/* Price + stock — always at the same vertical position */}
                <div className="flex items-center justify-between mt-3">
                  <span className="font-bold text-rosewood-600">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-muted-foreground">{product.stockQty} left</span>
                </div>

                {/* Button — always pinned at bottom */}
                {user?.role === 'BUYER' && (
                  <Button
                    size="sm"
                    className="w-full mt-2 bg-rosewood-600 hover:bg-rosewood-700"
                    disabled={product.stockQty === 0 || fetchingProduct === product.id}
                    onClick={() => handleAddToCartClick(product)}
                  >
                    {fetchingProduct === product.id
                      ? <><span className="h-4 w-4 mr-1 animate-spin border-2 border-white border-t-transparent rounded-full inline-block" /> Loading...</>
                      : <><ShoppingCart className="h-4 w-4 mr-1" />{product.stockQty === 0 ? 'Out of Stock' : 'Add to Cart'}</>
                    }
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {meta.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={params.page <= 1}
            onClick={() => updateParam('page', String(params.page - 1))}
          >
            Previous
          </Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">
            Page {params.page} of {meta.pages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={params.page >= meta.pages}
            onClick={() => updateParam('page', String(params.page + 1))}
          >
            Next
          </Button>
        </div>
      )}
    </div>
    </>
  );
}

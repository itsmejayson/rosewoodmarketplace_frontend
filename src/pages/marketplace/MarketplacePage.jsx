import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, SlidersHorizontal, Loader2, ShoppingCart, AlertCircle } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { productAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/toast';

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);

  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const params = {
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    productType: searchParams.get('productType') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  };

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await productAPI.list({ ...params, limit: 10 });
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

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  const handleAddToCart = async (productId) => {
    if (!user) { toast({ title: 'Please log in to add items to cart', variant: 'destructive' }); return; }
    if (user.role !== 'BUYER') { toast({ title: 'Only buyers can add to cart', variant: 'destructive' }); return; }
    setAddingId(productId);
    try {
      await addItem(productId, 1);
      toast({ title: 'Added to cart!' });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to add item', variant: 'destructive' });
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">Browse fresh food and quality materials</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            className="pl-9"
            defaultValue={params.search}
            onChange={(e) => updateParam('search', e.target.value)}
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
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest</SelectItem>
            <SelectItem value="price">Price: Low-High</SelectItem>
            <SelectItem value="popularity">Most Popular</SelectItem>
          </SelectContent>
        </Select>
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
            <Card key={product.id} className="overflow-hidden hover:shadow-md transition-shadow group">
              <div className="relative overflow-hidden bg-muted h-48">
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
                {product.stockQty === 0 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">Out of Stock</span>
                  </div>
                )}
              </div>
              <CardContent className="p-4">
                <div className="mb-1">
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
                  <Link to={`/products/${product.slug}`} className="font-semibold text-sm hover:text-rosewood-600 line-clamp-2">
                    {product.name}
                  </Link>
                </div>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-rosewood-600">{formatCurrency(product.price)}</span>
                  <span className="text-xs text-muted-foreground">{product.stockQty} left</span>
                </div>
                {user?.role === 'BUYER' && (
                  <Button
                    size="sm"
                    className="w-full mt-3 bg-rosewood-600 hover:bg-rosewood-700"
                    disabled={product.stockQty === 0 || addingId === product.id}
                    onClick={() => handleAddToCart(product.id)}
                  >
                    {addingId === product.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <><ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart</>
                    )}
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
  );
}

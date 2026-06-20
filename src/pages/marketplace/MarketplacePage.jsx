import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Search, AlertCircle, X, Heart, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { productAPI, favoriteAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/toast';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'priceLow', label: 'Price: Low–High' },
  { value: 'priceHigh', label: 'Price: High–Low' },
  { value: 'popularity', label: 'Most Popular' },
];

const TYPE_FILTERS = [
  { value: '', label: 'All' },
  { value: 'FOOD', label: '🍱 Food' },
  { value: 'MATERIAL', label: '🛠️ Materials' },
];

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef(null);
  const searchRef = useRef(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  const params = {
    search: searchParams.get('search') || '',
    categoryId: searchParams.get('categoryId') || '',
    productType: searchParams.get('productType') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
    page: parseInt(searchParams.get('page') || '1'),
  };

  const activeFilterCount = ['search', 'categoryId', 'productType', 'minPrice', 'maxPrice']
    .filter((k) => params[k]).length + (params.sortBy && params.sortBy !== 'newest' ? 1 : 0);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const apiParams = { ...params, limit: 12 };
      if (params.sortBy === 'priceLow') { apiParams.sortBy = 'price'; apiParams.sortOrder = 'asc'; }
      else if (params.sortBy === 'priceHigh') { apiParams.sortBy = 'price'; apiParams.sortOrder = 'desc'; }
      else if (params.sortBy === 'popularity') { apiParams.sortBy = 'popularity'; }
      else { apiParams.sortBy = 'newest'; }
      const { data } = await productAPI.list(apiParams);
      setProducts(data.data);
      setMeta(data.meta);
    } catch {
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [searchParams.toString()]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { productAPI.getCategories().then(({ data }) => setCategories(data.data)); }, []);

  useEffect(() => {
    if (user?.role !== 'BUYER') return;
    favoriteAPI.list()
      .then(({ data }) => {
        const ids = (data.data || []).map((f) => (f.product || f).id);
        setFavoriteIds(new Set(ids));
      })
      .catch(() => {});
  }, [user?.id]);

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
      toast({ title: 'Log in as a buyer to save favorites', variant: 'destructive' });
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
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        isFav ? next.add(productId) : next.delete(productId);
        return next;
      });
      toast({ title: 'Failed to update favorite', variant: 'destructive' });
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Hero search bar */}
      <div className="bg-rosewood-600 px-4 pt-5 pb-8">
        <p className="text-rosewood-100 text-sm mb-1 font-medium">Rosewood Marketplace</p>
        <h1 className="text-white text-2xl font-bold mb-4">What are you looking for?</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            ref={searchRef}
            type="search"
            placeholder="Search products, stores..."
            className="w-full pl-9 pr-10 py-3 rounded-xl text-sm bg-white shadow-sm border-0 outline-none focus:ring-2 focus:ring-rosewood-300"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              onClick={() => setSearchInput('')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills — pulled up to overlap hero */}
      <div className="px-4 -mt-4">
        <div
          className="flex gap-2 overflow-x-auto pb-2"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {TYPE_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('productType', value)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-colors whitespace-nowrap ${
                params.productType === value
                  ? 'bg-rosewood-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => updateParam('categoryId', params.categoryId === c.id ? '' : c.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium shadow-sm transition-colors whitespace-nowrap ${
                params.categoryId === c.id
                  ? 'bg-rosewood-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Filter & sort bar */}
      <div className="px-4 mt-3 flex items-center gap-2">
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
            showFilters || activeFilterCount > 0
              ? 'bg-rosewood-50 border-rosewood-300 text-rosewood-700'
              : 'bg-white border-gray-200 text-gray-600'
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="h-4 w-4 rounded-full bg-rosewood-500 text-white text-[9px] flex items-center justify-center font-bold">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>

        {/* Sort pills */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {SORT_OPTIONS.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => updateParam('sortBy', value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                params.sortBy === value
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeFilterCount > 0 && (
          <button onClick={clearFilters} className="ml-auto flex-shrink-0 text-xs text-rosewood-600 font-medium">
            Clear
          </button>
        )}
      </div>

      {/* Expanded filter panel */}
      {showFilters && (
        <div className="mx-4 mt-2 p-4 bg-white rounded-xl shadow-sm border border-gray-100 space-y-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Price Range</p>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Min ₱</label>
              <input
                key={`min-${params.minPrice}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="0"
                defaultValue={params.minPrice}
                onBlur={(e) => updateParam('minPrice', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rosewood-300"
              />
            </div>
            <span className="text-gray-400 mt-4">–</span>
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">Max ₱</label>
              <input
                key={`max-${params.maxPrice}`}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                placeholder="Any"
                defaultValue={params.maxPrice}
                onBlur={(e) => updateParam('maxPrice', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-rosewood-300"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="px-4 mt-4">
        <p className="text-xs text-gray-500 mb-3">
          {isLoading ? 'Loading…' : `${meta.total} product${meta.total !== 1 ? 's' : ''} found`}
        </p>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="h-40 w-full rounded-none" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-3 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-7 w-full mt-1" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500 font-medium">No products found</p>
            <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            {activeFilterCount > 0 && (
              <button onClick={clearFilters} className="mt-4 text-sm text-rosewood-600 font-medium underline">
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                onClick={() => navigate(`/products/${product.slug}`)}
              >
                {/* Image */}
                <div className="relative h-40 bg-gray-100 overflow-hidden">
                  <img
                    src={product.images?.[0]?.url || '/placeholder-product.jpg'}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                  />
                  {/* Favorite button */}
                  {user?.role === 'BUYER' && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(product.id); }}
                      className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white shadow-md flex items-center justify-center z-10 hover:scale-110 transition-transform"
                    >
                      <Heart className={`h-3.5 w-3.5 ${favoriteIds.has(product.id) ? 'fill-rosewood-500 text-rosewood-500' : 'text-gray-400'}`} />
                    </button>
                  )}
                  {/* Type badge */}
                  <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    product.productType === 'FOOD' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {product.productType === 'FOOD' ? '🍱 Food' : '🛠️ Material'}
                  </div>
                  {/* Out of stock overlay */}
                  {product.stockQty === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-semibold text-xs bg-black/60 px-2 py-1 rounded-full">Out of Stock</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-3">
                  {product.seller?.storeName && (
                    <p className="text-[10px] text-gray-400 truncate mb-0.5">{product.seller.storeName}</p>
                  )}
                  <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{product.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-bold text-rosewood-600">{formatCurrency(product.price)}</span>
                    {product.stockQty > 0 && (
                      <span className={`text-[10px] font-medium ${product.stockQty <= 5 ? 'text-red-500' : product.stockQty <= 20 ? 'text-orange-500' : 'text-gray-400'}`}>
                        {product.stockQty} left
                      </span>
                    )}
                  </div>
                  {product.stockQty > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/products/${product.slug}`); }}
                      className="w-full mt-2.5 py-2 rounded-xl bg-rosewood-600 hover:bg-rosewood-700 text-white text-xs font-semibold transition-colors"
                    >
                      Buy Now
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8 mb-4">
            <Button
              variant="outline"
              size="sm"
              disabled={params.page <= 1}
              onClick={() => updateParam('page', String(params.page - 1))}
              className="rounded-full"
            >
              Previous
            </Button>
            <span className="flex items-center text-sm text-gray-500 px-2">
              {params.page} / {meta.pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={params.page >= meta.pages}
              onClick={() => updateParam('page', String(params.page + 1))}
              className="rounded-full"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

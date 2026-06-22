import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Store, Search, Package, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { storeAPI } from '../api';
import useAppConfigStore from '../store/appConfigStore';

export default function StoresPage() {
  const navigate = useNavigate();
  const appName = useAppConfigStore((s) => s.appName);
  const [stores, setStores] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [page, setPage] = useState(1);

  const fetchStores = async (q = '', p = 1) => {
    setIsLoading(true);
    try {
      const { data } = await storeAPI.list({ search: q, limit: 10, page: p });
      setStores(data.data);
      setMeta(data.meta ?? { total: data.data.length, pages: 1, page: 1 });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchStores('', 1); }, []);

  useEffect(() => {
    setPage(1);
    const t = setTimeout(() => fetchStores(search, 1), 400);
    return () => clearTimeout(t);
  }, [search]);

  const goToPage = (p) => {
    setPage(p);
    fetchStores(search, p);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-1">Stores</h1>
        <p className="text-muted-foreground">Browse all stores on {appName}</p>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search stores..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <>
          {/* Mobile skeleton */}
          <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-64 rounded-lg border bg-card p-5 flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
          {/* Desktop skeleton */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg border bg-card p-5 flex items-center gap-4">
                <Skeleton className="h-14 w-14 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : stores.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Store className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No stores found.</p>
        </div>
      ) : (
        <>
          {/* Mobile: horizontal swipe carousel */}
          <div className="sm:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            {stores.map((store) => (
              <Link key={store.id} to={`/store/${store.id}`} className="snap-start flex-shrink-0 w-64">
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    {store.profileImage ? (
                      <img src={store.profileImage} alt={store.storeName} className="h-14 w-14 rounded-full object-cover flex-shrink-0 border" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-rosewood-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-7 w-7 text-rosewood-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{store.storeName}</p>
                      <p className="text-sm text-muted-foreground truncate">{store.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Package className="h-3 w-3" /> {store._count?.products ?? 0} products
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>

          {/* Desktop: grid */}
          <div className="hidden sm:grid grid-cols-2 md:grid-cols-3 gap-4">
            {stores.map((store) => (
              <Link key={store.id} to={`/store/${store.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardContent className="p-5 flex items-center gap-4">
                    {store.profileImage ? (
                      <img src={store.profileImage} alt={store.storeName} className="h-14 w-14 rounded-full object-cover flex-shrink-0 border" />
                    ) : (
                      <div className="h-14 w-14 rounded-full bg-rosewood-100 flex items-center justify-center flex-shrink-0">
                        <Store className="h-7 w-7 text-rosewood-600" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{store.storeName}</p>
                      <p className="text-sm text-muted-foreground truncate">{store.fullName}</p>
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Package className="h-3 w-3" /> {store._count?.products ?? 0} products
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}

      {meta.pages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>Previous</Button>
          <span className="flex items-center text-sm text-muted-foreground px-2">Page {page} of {meta.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= meta.pages} onClick={() => goToPage(page + 1)}>Next</Button>
        </div>
      )}
    </div>
  );
}

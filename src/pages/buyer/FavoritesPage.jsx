import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';
import { favoriteAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { toast } from '../../components/ui/toast';
import { Pagination, PaginationInfo } from '../../components/ui/Pagination';

const PAGE_SIZE = 12;

export default function FavoritesPage() {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let mounted = true;

    async function loadFavorites() {
      try {
        const res = await favoriteAPI.list();
        const items = res?.data?.data || [];
        if (mounted) {
          setFavorites(items);
        }
      } catch (err) {
        if (mounted) {
          setFavorites([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadFavorites();

    return () => {
      mounted = false;
    };
  }, []);

  async function handleUnfavorite(productId) {
    setFavorites((prev) =>
      prev.filter((fav) => {
        const product = fav.product || fav;
        return product.id !== productId;
      })
    );

    try {
      await favoriteAPI.toggle(productId);
      toast({ title: 'Removed from favorites' });
    } catch (err) {
      // Optimistic removal already applied.
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
        </div>
      </div>
    );
  }

  if (favorites.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 mb-6 text-muted-foreground">No favorites yet.</p>
          <Link to="/marketplace">
            <Button className="bg-rosewood-600 hover:bg-rosewood-700">
              Browse Marketplace
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalPages = Math.max(1, Math.ceil(favorites.length / PAGE_SIZE));
  const paginated = favorites.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold mb-6">My Favorites</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {paginated.map((fav) => {
          const product = fav.product || fav;
          const imageUrl = product.images?.[0]?.url || '/placeholder-product.jpg';

          return (
            <Card key={product.id} className="overflow-hidden">
              <div className="relative">
                <Link to={`/products/${product.slug}`}>
                  <img
                    src={imageUrl}
                    alt={product.name}
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-product.jpg';
                    }}
                    className="h-48 w-full object-cover"
                  />
                </Link>
                <button
                  type="button"
                  onClick={() => handleUnfavorite(product.id)}
                  aria-label="Remove from favorites"
                  className="absolute right-2 top-2 rounded-full bg-white/80 p-2 shadow hover:bg-white"
                >
                  <Heart className="h-5 w-5 fill-rosewood-500 text-rosewood-500" />
                </button>
              </div>
              <CardContent className="p-4">
                <Link
                  to={`/products/${product.slug}`}
                  className="font-medium hover:underline line-clamp-2"
                >
                  {product.name}
                </Link>
                {product.category?.name && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {product.category.name}
                  </p>
                )}
                <p className="mt-2 font-semibold">{formatCurrency(product.price)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      <div className="mt-6 space-y-2">
        <Pagination page={page} totalPages={totalPages} onPage={setPage} />
        <PaginationInfo page={page} pageSize={PAGE_SIZE} total={favorites.length} />
      </div>
    </div>
  );
}

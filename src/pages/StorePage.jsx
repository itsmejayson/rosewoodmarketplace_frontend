import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Store, Loader2, ShoppingCart, Star, MapPin } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { storeAPI, productAPI } from '../api';
import useCartStore from '../store/cartStore';
import useAuthStore from '../store/authStore';
import { formatCurrency } from '../lib/utils';
import { toast } from '../components/ui/toast';
import AddToCartModal from '../components/product/AddToCartModal';

export default function StorePage() {
  const { sellerId } = useParams();
  const navigate = useNavigate();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchingId, setFetchingId] = useState(null);
  const [modalProduct, setModalProduct] = useState(null);
  const [adding, setAdding] = useState(false);
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    storeAPI.get(sellerId)
      .then(({ data }) => {
        setStore(data.data.seller);
        setProducts(data.data.products);
      })
      .catch(() => { toast({ title: 'Store not found', variant: 'destructive' }); navigate('/stores'); })
      .finally(() => setIsLoading(false));
  }, [sellerId]);

  const handleAddToCartClick = async (product) => {
    if (!user) { toast({ title: 'Please log in to add items to cart', variant: 'destructive' }); return; }
    if (user.role !== 'BUYER') { toast({ title: 'Only buyers can add to cart', variant: 'destructive' }); return; }
    setFetchingId(product.id);
    try {
      const { data } = await productAPI.getBySlug(product.slug);
      setModalProduct(data.data);
    } catch {
      toast({ title: 'Failed to load product', variant: 'destructive' });
    } finally {
      setFetchingId(null);
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

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!store) return null;

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
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link to="/stores" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> All Stores
      </Link>

      {/* Store header */}
      <div className="flex items-start gap-5 mb-8 p-6 rounded-xl border bg-white shadow-sm">
        {store.profileImage ? (
          <img src={store.profileImage} alt={store.storeName} className="h-20 w-20 rounded-full object-cover border-2 border-rosewood-200 flex-shrink-0" />
        ) : (
          <div className="h-20 w-20 rounded-full bg-rosewood-100 flex items-center justify-center flex-shrink-0">
            <Store className="h-10 w-10 text-rosewood-600" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{store.storeName}</h1>
          <p className="text-muted-foreground text-sm">by {store.fullName}</p>
          {store.avgRating != null && (
            <div className="flex items-center gap-1 mt-1">
              {[0, 1, 2, 3, 4].map((i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(store.avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`}
                />
              ))}
              <span className="text-sm text-muted-foreground ml-1">{store.avgRating.toFixed(1)} ({store.reviewCount || 0} reviews)</span>
            </div>
          )}
          {store.storeDescription && (
            <p className="text-sm text-muted-foreground mt-2">{store.storeDescription}</p>
          )}
          {store.storeAddress && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{store.storeAddress}</span>
            </div>
          )}
          {store.defaultDeliveryFee != null && parseFloat(store.defaultDeliveryFee) > 0 && (
            <p className="text-sm text-muted-foreground mt-1">Delivery fee: {formatCurrency(store.defaultDeliveryFee)}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">Member since {new Date(store.createdAt).toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Products */}
      <h2 className="text-lg font-semibold mb-4">Products ({products.length})</h2>
      {products.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No products available yet.</div>
      ) : (
        <>
          {/* Mobile: horizontal swipe carousel */}
          <div
            className="sm:hidden flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory -mx-4 px-4"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {products.map((product) => {
              const image = product.images?.[0]?.url;
              const outOfStock = product.stockQty === 0;
              return (
                <div key={product.id} className="snap-start flex-shrink-0 w-44">
                  <Card className={`overflow-hidden hover:shadow-md transition-shadow group h-full ${outOfStock ? 'opacity-70' : ''}`}>
                    <Link to={`/products/${product.slug}`}>
                      <div className="relative aspect-square bg-muted overflow-hidden">
                        {image ? (
                          <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                        )}
                        {outOfStock && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold text-xs">Out of Stock</span>
                          </div>
                        )}
                      </div>
                    </Link>
                    <CardContent className="p-3">
                      <Link to={`/products/${product.slug}`}>
                        <p className="text-sm font-medium line-clamp-2 hover:text-rosewood-600">{product.name}</p>
                      </Link>
                      <p className="text-rosewood-600 font-bold mt-1">{formatCurrency(product.price)}</p>
                      {user?.role === 'BUYER' && (
                        <Button
                          size="sm"
                          className="w-full mt-2 bg-rosewood-600 hover:bg-rosewood-700 text-xs h-8"
                          onClick={() => handleAddToCartClick(product)}
                          disabled={fetchingId === product.id || outOfStock}
                        >
                          {fetchingId === product.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : outOfStock
                              ? 'Out of Stock'
                              : <><ShoppingCart className="h-3 w-3 mr-1" />Add to Cart</>
                          }
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>

          {/* Desktop: grid */}
          <div className="hidden sm:grid grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => {
              const image = product.images?.[0]?.url;
              const outOfStock = product.stockQty === 0;
              return (
                <Card key={product.id} className={`overflow-hidden hover:shadow-md transition-shadow group ${outOfStock ? 'opacity-70' : ''}`}>
                  <Link to={`/products/${product.slug}`}>
                    <div className="relative aspect-square bg-muted overflow-hidden">
                      {image ? (
                        <img src={image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No image</div>
                      )}
                      {outOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">Out of Stock</span>
                        </div>
                      )}
                    </div>
                  </Link>
                  <CardContent className="p-3">
                    <Link to={`/products/${product.slug}`}>
                      <p className="text-sm font-medium line-clamp-2 hover:text-rosewood-600">{product.name}</p>
                    </Link>
                    <p className="text-rosewood-600 font-bold mt-1">{formatCurrency(product.price)}</p>
                    {user?.role === 'BUYER' && (
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-rosewood-600 hover:bg-rosewood-700 text-xs h-8"
                        onClick={() => handleAddToCartClick(product)}
                        disabled={fetchingId === product.id || outOfStock}
                      >
                        {fetchingId === product.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : outOfStock
                            ? 'Out of Stock'
                            : <><ShoppingCart className="h-3 w-3 mr-1" />Add to Cart</>
                        }
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}
    </div>
    </>
  );
}

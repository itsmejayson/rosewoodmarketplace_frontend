import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Loader2, ArrowLeft, Package, Thermometer, Calendar, Tag, Heart, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { productAPI, favoriteAPI, reviewAPI, orderAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/toast';
import AddToCartModal from '../../components/product/AddToCartModal';

// Simple star rating display
function Stars({ value, className = 'h-4 w-4' }) {
  const v = Math.round(value || 0);
  return (
    <span className="inline-flex items-center">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`${className} ${n <= v ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
      ))}
    </span>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Favorites
  const [isFavorite, setIsFavorite] = useState(false);
  // Similar products
  const [similar, setSimilar] = useState([]);
  const [addingSimilarId, setAddingSimilarId] = useState(null);
  // Reviews
  const [reviewData, setReviewData] = useState({ reviews: [], avgRating: 0, reviewCount: 0 });
  const [reviewableOrderId, setReviewableOrderId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const carouselRef = useRef(null);

  const handleCarouselScroll = useCallback(() => {
    if (!carouselRef.current) return;
    const idx = Math.round(carouselRef.current.scrollLeft / carouselRef.current.offsetWidth);
    setSelectedImage(idx);
  }, []);

  const scrollToImage = (idx) => {
    setSelectedImage(idx);
    carouselRef.current?.scrollTo({ left: idx * carouselRef.current.offsetWidth, behavior: 'smooth' });
  };

  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    setIsLoading(true);
    productAPI.getBySlug(slug)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast({ title: 'Product not found', variant: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, [slug]);

  // Once product loaded, fetch favorites status, similar products, reviews
  useEffect(() => {
    if (!product?.id) return;

    // Favorite status (buyers only)
    if (user?.role === 'BUYER') {
      favoriteAPI.check(product.id)
        .then(({ data }) => setIsFavorite(data.data?.isFavorite ?? data.isFavorite ?? false))
        .catch(() => {});
    }

    // Similar products
    if (product.categoryId || product.category?.id) {
      productAPI.list({ categoryId: product.categoryId || product.category?.id, limit: 4 })
        .then(({ data }) => setSimilar((data.data || []).filter((p) => p.id !== product.id).slice(0, 4)))
        .catch(() => {});
    }

    // Reviews
    reviewAPI.forProduct(product.id)
      .then(({ data }) => {
        const d = data.data || data;
        setReviewData({ reviews: d.reviews || [], avgRating: d.avgRating || 0, reviewCount: d.reviewCount || 0 });
      })
      .catch(() => {});

    // Determine if the buyer has a DELIVERED order with this product and hasn't reviewed
    if (user?.role === 'BUYER') {
      orderAPI.myOrders({ status: 'DELIVERED', limit: 50 })
        .then(({ data }) => {
          const orders = data.data || [];
          const match = orders.find((o) => (o.orderItems || []).some((it) => it.productId === product.id));
          if (match) setReviewableOrderId(match.id);
        })
        .catch(() => {});
    }
  }, [product?.id, user?.id]);

  const toggleFavorite = async () => {
    if (!user || user.role !== 'BUYER') {
      toast({ title: 'Please log in as a buyer to save favorites', variant: 'destructive' });
      return;
    }
    const prev = isFavorite;
    setIsFavorite(!prev);
    try {
      await favoriteAPI.toggle(product.id);
    } catch {
      setIsFavorite(prev);
      toast({ title: 'Failed to update favorite', variant: 'destructive' });
    }
  };

  const addSimilarToCart = async (p) => {
    if (!user || user.role !== 'BUYER') { toast({ title: 'Please log in to add items to cart', variant: 'destructive' }); return; }
    setAddingSimilarId(p.id);
    try {
      await addItem(p.id, 1);
      toast({ title: `${p.name} added to cart!` });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setAddingSimilarId(null);
    }
  };

  const submitReview = async () => {
    if (!reviewableOrderId) return;
    setSubmittingReview(true);
    try {
      await reviewAPI.create({ productId: product.id, orderId: reviewableOrderId, rating: reviewRating, comment: reviewComment });
      toast({ title: 'Review submitted. Thank you!' });
      setShowReviewForm(false);
      setReviewableOrderId(null);
      setReviewComment('');
      // refresh reviews
      const { data } = await reviewAPI.forProduct(product.id);
      const d = data.data || data;
      setReviewData({ reviews: d.reviews || [], avgRating: d.avgRating || 0, reviewCount: d.reviewCount || 0 });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message || 'Failed to submit review', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasOptions = product && (product.variantGroups?.length > 0 || product.addons?.length > 0);

  const handleAddToCartClick = () => {
    if (!user) { toast({ title: 'Please log in', variant: 'destructive' }); return; }
    setShowModal(true);
  };

  const doAddToCart = async (items) => {
    setAdding(true);
    setShowModal(false);
    try {
      for (const item of items) {
        const hasOpts = item.selectedOptions.variants?.length || item.selectedOptions.addons?.length;
        await addItem(product.id, 1, hasOpts ? item.selectedOptions : null);
      }
      toast({ title: `${items.length}× ${product.name} added to cart!` });
    } catch (err) {
      toast({ title: 'Error', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  if (isLoading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
    </div>
  );

  if (!product) return (
    <div className="container mx-auto px-4 py-20 text-center">
      <p className="text-muted-foreground">Product not found.</p>
      <Link to="/marketplace"><Button variant="outline" className="mt-4">Back to Marketplace</Button></Link>
    </div>
  );

  return (
    <>
      {showModal && (
        <AddToCartModal
          product={product}
          onClose={() => setShowModal(false)}
          onConfirm={doAddToCart}
          isLoading={adding}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        <Link to="/marketplace" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Marketplace
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Images */}
          <div>
            {/* Mobile: swipe carousel */}
            <div className="md:hidden">
              <div
                ref={carouselRef}
                onScroll={handleCarouselScroll}
                className="flex overflow-x-auto snap-x snap-mandatory rounded-lg border bg-muted mb-2 scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {(product.images?.length ? product.images : [null]).map((img, idx) => (
                  <div key={img?.id ?? idx} className="snap-center flex-shrink-0 w-full aspect-square">
                    <img
                      src={img?.url || '/placeholder-product.jpg'}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                    />
                  </div>
                ))}
              </div>
              {product.images?.length > 1 && (
                <div className="flex justify-center gap-1.5 mb-3">
                  {product.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToImage(idx)}
                      className={`rounded-full transition-all ${selectedImage === idx ? 'w-4 h-2 bg-rosewood-600' : 'w-2 h-2 bg-gray-300'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Desktop: main image + thumbnails */}
            <div className="hidden md:block">
              <div className="aspect-square rounded-lg overflow-hidden border bg-muted mb-3">
                <img
                  src={product.images?.[selectedImage]?.url || '/placeholder-product.jpg'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                />
              </div>
              {product.images?.length > 1 && (
                <div className="flex gap-2 overflow-x-auto">
                  {product.images.map((img, idx) => (
                    <button
                      key={img.id}
                      onClick={() => setSelectedImage(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded border-2 overflow-hidden ${selectedImage === idx ? 'border-rosewood-500' : 'border-transparent'}`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant={product.productType === 'FOOD' ? 'success' : 'secondary'}>
                {product.productType}
              </Badge>
              <span className="text-sm text-muted-foreground">{product.category?.name}</span>
            </div>
            <div className="flex items-start justify-between gap-3 mb-2">
              <h1 className="text-3xl font-bold">{product.name}</h1>
              {user?.role === 'BUYER' && (
                <button
                  type="button"
                  onClick={toggleFavorite}
                  className="h-10 w-10 rounded-full border flex items-center justify-center flex-shrink-0 hover:bg-muted"
                  title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Heart className={`h-5 w-5 ${isFavorite ? 'fill-rosewood-500 text-rosewood-500' : 'text-muted-foreground'}`} />
                </button>
              )}
            </div>
            {reviewData.reviewCount > 0 && (
              <div className="flex items-center gap-2 mb-2">
                <Stars value={reviewData.avgRating} />
                <span className="text-sm text-muted-foreground">
                  {Number(reviewData.avgRating).toFixed(1)} ({reviewData.reviewCount} review{reviewData.reviewCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}
            <p className="text-2xl font-bold text-rosewood-600 mb-1">{formatCurrency(product.price)}</p>
            {hasOptions && (
              <p className="text-xs text-muted-foreground mb-3">Base price — final price depends on your selections</p>
            )}
            <p className="text-muted-foreground mb-4">{product.description}</p>

            <Card className="mb-4">
              <CardContent className="p-4 space-y-2">
                {product.productType === 'FOOD' && (
                  <>
                    {product.expirationDate && (
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Expires: {formatDate(product.expirationDate)}</span>
                      </div>
                    )}
                    {product.storageInstructions && (
                      <div className="flex items-center gap-2 text-sm">
                        <Thermometer className="h-4 w-4 text-muted-foreground" />
                        <span>{product.storageInstructions}</span>
                      </div>
                    )}
                    {product.isPerishable && <Badge variant="warning" className="text-xs">Perishable</Badge>}
                  </>
                )}
                {product.productType === 'MATERIAL' && (
                  <>
                    {product.materialType && (
                      <div className="flex items-center gap-2 text-sm">
                        <Tag className="h-4 w-4 text-muted-foreground" />
                        <span>Material: {product.materialType}</span>
                      </div>
                    )}
                    {product.unit && (
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>Unit: {product.unit}</span>
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className={product.stockQty <= 10 ? 'text-orange-600 font-medium' : ''}>
                    {product.stockQty > 0 ? `${product.stockQty} in stock` : 'Out of stock'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Options preview */}
            {hasOptions && (
              <div className="mb-4 space-y-1.5">
                {product.variantGroups?.map(g => (
                  <div key={g.id} className="text-sm">
                    <span className="font-medium">{g.name}:</span>{' '}
                    <span className="text-muted-foreground">
                      {g.options.map(o => o.name + (parseFloat(o.priceModifier) > 0 ? ` +${formatCurrency(o.priceModifier)}` : '')).join(' · ')}
                    </span>
                  </div>
                ))}
                {product.addons?.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Add-ons:</span>{' '}
                    <span className="text-muted-foreground">
                      {product.addons.map(a => `${a.name} +${formatCurrency(a.price)}`).join(' · ')}
                    </span>
                  </div>
                )}
              </div>
            )}

            <p className="text-sm text-muted-foreground mb-4">
              Sold by <span className="font-medium text-foreground">{product.seller?.storeName || product.seller?.fullName}</span>
            </p>

            {user?.role === 'BUYER' && product.stockQty > 0 && (
              <Button
                className="w-full bg-rosewood-600 hover:bg-rosewood-700"
                onClick={handleAddToCartClick}
                disabled={adding}
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                {hasOptions ? 'Customize & Add to Cart' : 'Add to Cart'}
              </Button>
            )}
            {user?.role === 'BUYER' && product.stockQty === 0 && (
              <Button className="w-full" disabled>Out of Stock</Button>
            )}
            {!user && (
              <Link to="/login">
                <Button className="w-full bg-rosewood-600 hover:bg-rosewood-700">Login to Purchase</Button>
              </Link>
            )}
          </div>
        </div>

        {/* You might also like */}
        {similar.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-4">You might also like</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {similar.map((p) => (
                <Card key={p.id} className="overflow-hidden flex-shrink-0 w-48 flex flex-col">
                  <Link to={`/products/${p.slug}`} className="block">
                    <div className="h-36 bg-muted overflow-hidden">
                      <img
                        src={p.images?.[0]?.url || '/placeholder-product.jpg'}
                        alt={p.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = '/placeholder-product.jpg'; }}
                      />
                    </div>
                  </Link>
                  <CardContent className="p-3 flex flex-col flex-1">
                    <Link to={`/products/${p.slug}`} className="font-medium text-sm line-clamp-2 hover:text-rosewood-600">
                      {p.name}
                    </Link>
                    <p className="font-bold text-rosewood-600 mt-1">{formatCurrency(p.price)}</p>
                    {user?.role === 'BUYER' && (
                      <Button
                        size="sm"
                        className="w-full mt-2 bg-rosewood-600 hover:bg-rosewood-700 text-xs h-8"
                        disabled={p.stockQty === 0 || addingSimilarId === p.id}
                        onClick={() => addSimilarToCart(p)}
                      >
                        {addingSimilarId === p.id
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <><ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart</>}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">Reviews</h2>
            {reviewableOrderId && !showReviewForm && (
              <Button variant="outline" size="sm" onClick={() => setShowReviewForm(true)}>
                Write a Review
              </Button>
            )}
          </div>

          {reviewData.reviewCount > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <Stars value={reviewData.avgRating} className="h-5 w-5" />
              <span className="text-lg font-bold">{Number(reviewData.avgRating).toFixed(1)}</span>
              <span className="text-sm text-muted-foreground">based on {reviewData.reviewCount} review{reviewData.reviewCount !== 1 ? 's' : ''}</span>
            </div>
          )}

          {/* Write review form */}
          {showReviewForm && reviewableOrderId && (
            <Card className="mb-4">
              <CardContent className="p-4 space-y-3">
                <p className="text-sm font-medium">Your rating</p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" onClick={() => setReviewRating(n)}>
                      <Star className={`h-6 w-6 ${n <= reviewRating ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                    </button>
                  ))}
                </div>
                <textarea
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  placeholder="Share your thoughts (optional)…"
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button className="bg-rosewood-600 hover:bg-rosewood-700" onClick={submitReview} disabled={submittingReview}>
                    {submittingReview ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                    Submit Review
                  </Button>
                  <Button variant="ghost" onClick={() => setShowReviewForm(false)}>Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {reviewData.reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviewData.reviews.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{r.buyer?.fullName || r.buyerName || 'Anonymous'}</span>
                      <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} />
                    {r.comment && <p className="text-sm text-muted-foreground mt-2">{r.comment}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, Star, MessageSquare, ArrowLeft } from 'lucide-react';
import { reviewAPI } from '../../api';
import { Card, CardContent } from '../../components/ui/card';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import { Pagination, PaginationInfo } from '../../components/ui/Pagination';

const PAGE_SIZE = 10;

const FILTERS = ['ALL', '5', '4', '3', '2', '1'];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'}`}
        />
      ))}
    </div>
  );
}

export default function SellerReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  useEffect(() => {
    reviewAPI.seller()
      .then((res) => setReviews(res.data.data ?? []))
      .catch(() => toast({ title: 'Failed to load reviews', variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'ALL' ? reviews : reviews.filter((r) => String(r.rating) === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-rosewood-500" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-2">
        <Star className="h-6 w-6" />
        Product Reviews
      </h1>

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl font-bold text-yellow-500">{avgRating}</span>
          <div>
            <StarRating rating={Math.round(avgRating)} />
            <p className="text-xs text-muted-foreground mt-0.5">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {FILTERS.map((f) => {
          const count = f === 'ALL' ? reviews.length : reviews.filter((r) => String(r.rating) === f).length;
          // reset page on filter change (handled via key)

          return (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === f ? 'bg-rosewood-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {f !== 'ALL' && <Star className="h-3 w-3" />}
              {f === 'ALL' ? `All (${count})` : `${f} (${count})`}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filter === 'ALL' ? 'No reviews yet.' : `No ${filter}-star reviews.`}
          </p>
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {paginated.map((review) => {
            const product = review.product;
            const buyer = review.buyer;
            const img = product?.images?.[0]?.url;

            return (
              <Card key={review.id}>
                <CardContent className="p-4 space-y-3">
                  {/* Product + rating row */}
                  <div className="flex items-start gap-3">
                    {img ? (
                      <img src={img} alt={product.name} className="h-12 w-12 rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      {product && (
                        <Link
                          to={`/products/${product.slug}`}
                          className="font-medium text-sm hover:text-rosewood-600 hover:underline line-clamp-1"
                        >
                          {product.name}
                        </Link>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <StarRating rating={review.rating} />
                        <span className="text-xs font-semibold text-yellow-600">{review.rating}/5</span>
                      </div>
                    </div>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-foreground">{review.comment}</p>
                  )}

                  {/* Buyer + date */}
                  <div className="flex items-center justify-between gap-2 flex-wrap text-xs text-muted-foreground">
                    <span>By {buyer?.fullName ?? 'Anonymous'}</span>
                    <span className="flex-shrink-0">{formatDate(review.createdAt)}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        <div className="mt-4 space-y-2">
          <Pagination page={page} totalPages={totalPages} onPage={setPage} />
          <PaginationInfo page={page} pageSize={PAGE_SIZE} total={filtered.length} />
        </div>
        </>
      )}
    </div>
  );
}

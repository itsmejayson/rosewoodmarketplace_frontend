import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Loader2, ArrowLeft, Package, Thermometer, Calendar, Tag } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { productAPI } from '../../api';
import { formatCurrency, formatDate } from '../../lib/utils';
import useCartStore from '../../store/cartStore';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/toast';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);

  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  useEffect(() => {
    productAPI.getBySlug(slug)
      .then(({ data }) => setProduct(data.data))
      .catch(() => toast({ title: 'Product not found', variant: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, [slug]);

  const handleAddToCart = async () => {
    if (!user) { toast({ title: 'Please log in', variant: 'destructive' }); return; }
    setAdding(true);
    try {
      await addItem(product.id, quantity);
      toast({ title: `${quantity}x ${product.name} added to cart!` });
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
    <div className="container mx-auto px-4 py-8">
      <Link to="/marketplace" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Marketplace
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Images */}
        <div>
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

        {/* Details */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant={product.productType === 'FOOD' ? 'success' : 'secondary'}>
              {product.productType}
            </Badge>
            <span className="text-sm text-muted-foreground">{product.category?.name}</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
          <p className="text-2xl font-bold text-rosewood-600 mb-4">{formatCurrency(product.price)}</p>
          <p className="text-muted-foreground mb-4">{product.description}</p>

          {/* Type-specific info */}
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
                  {product.isPerishable && (
                    <Badge variant="warning" className="text-xs">Perishable</Badge>
                  )}
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

          {/* Sold by */}
          <p className="text-sm text-muted-foreground mb-4">
            Sold by <span className="font-medium text-foreground">{product.seller?.fullName}</span>
          </p>

          {/* Add to cart */}
          {user?.role === 'BUYER' && product.stockQty > 0 && (
            <div className="flex items-center gap-3">
              <div className="flex items-center border rounded-md">
                <button
                  className="px-3 py-2 hover:bg-muted text-lg"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >−</button>
                <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                <button
                  className="px-3 py-2 hover:bg-muted text-lg"
                  onClick={() => setQuantity(Math.min(product.stockQty, quantity + 1))}
                >+</button>
              </div>
              <Button
                className="flex-1 bg-rosewood-600 hover:bg-rosewood-700"
                onClick={handleAddToCart}
                disabled={adding}
              >
                {adding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ShoppingCart className="h-4 w-4 mr-2" />}
                Add to Cart · {formatCurrency(product.price * quantity)}
              </Button>
            </div>
          )}
          {!user && (
            <Link to="/login">
              <Button className="w-full bg-rosewood-600 hover:bg-rosewood-700">
                Login to Purchase
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

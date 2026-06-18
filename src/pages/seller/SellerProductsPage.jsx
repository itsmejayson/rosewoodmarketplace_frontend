import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit, Trash2, Loader2, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Card, CardContent } from '../../components/ui/card';
import { productAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

export default function SellerProductsPage() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, pages: 1, page: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = async (page = 1) => {
    setIsLoading(true);
    try {
      const { data } = await productAPI.myProducts({ page, limit: 10 });
      setProducts(data.data);
      setMeta(data.meta);
    } catch {
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await productAPI.delete(id);
      toast({ title: `"${name}" deleted` });
      setProducts((prev) => prev.filter((p) => p.id !== id));
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
      ) : (
        <div className="space-y-3">
          {products.map((product) => (
            <Card key={product.id} className={!product.isAvailable ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded border bg-muted flex-shrink-0 overflow-hidden">
                    <img src={product.images?.[0]?.url || '/placeholder-product.jpg'} alt={product.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold line-clamp-1">{product.name}</p>
                        <p className="text-sm text-muted-foreground">{product.category?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={product.productType === 'FOOD' ? 'success' : 'secondary'} className="text-xs">
                            {product.productType}
                          </Badge>
                          <Badge variant={product.isAvailable ? 'default' : 'outline'} className="text-xs">
                            {product.isAvailable ? 'Available' : 'Hidden'}
                          </Badge>
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
          ))}
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

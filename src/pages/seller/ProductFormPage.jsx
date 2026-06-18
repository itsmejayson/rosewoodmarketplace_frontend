import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, Upload, X, Star } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { productAPI } from '../../api';
import { toast } from '../../components/ui/toast';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  description: z.string().optional(),
  price: z.coerce.number().positive('Price must be positive'),
  stockQty: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  productType: z.enum(['FOOD', 'MATERIAL']),
  categoryId: z.string().min(1, 'Category is required'),
  isAvailable: z.coerce.boolean().optional(),
  expirationDate: z.string().optional(),
  storageInstructions: z.string().optional(),
  isPerishable: z.coerce.boolean().optional(),
  materialType: z.string().optional(),
  unit: z.string().optional(),
});

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [productType, setProductType] = useState('FOOD');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [imageFiles, setImageFiles] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [createdProductId, setCreatedProductId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [existingImages, setExistingImages] = useState([]);
  const [deletingImageId, setDeletingImageId] = useState(null);

  const { register, handleSubmit, setValue, watch, formState: { errors }, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { productType: 'FOOD', isAvailable: true, stockQty: 0 },
  });

  const watchedType = watch('productType');

  useEffect(() => {
    productAPI.getCategories().then(({ data }) => setCategories(data.data));
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    setIsFetching(true);
    productAPI.getById(id)
      .then(({ data }) => {
        const p = data.data;
        const type = p.productType || 'FOOD';
        setProductType(type);
        const expDate = p.expirationDate
          ? new Date(p.expirationDate).toISOString().slice(0, 16)
          : '';
        reset({
          name: p.name || '',
          description: p.description || '',
          price: p.price ?? 0,
          stockQty: p.stockQty ?? 0,
          productType: type,
          categoryId: p.categoryId || '',
          isAvailable: p.isAvailable ?? true,
          expirationDate: expDate,
          storageInstructions: p.storageInstructions || '',
          isPerishable: p.isPerishable ?? false,
          materialType: p.materialType || '',
          unit: p.unit || '',
        });
        setSelectedCategoryId(p.categoryId || '');
        setExistingImages(p.images || []);
      })
      .catch(() => toast({ title: 'Failed to load product', variant: 'destructive' }))
      .finally(() => setIsFetching(false));
  }, [id]);

  const handleDeleteImage = async (imageId) => {
    setDeletingImageId(imageId);
    try {
      await productAPI.deleteImage(id, imageId);
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
      toast({ title: 'Image removed' });
    } catch {
      toast({ title: 'Failed to remove image', variant: 'destructive' });
    } finally {
      setDeletingImageId(null);
    }
  };

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      let productId = id;
      if (isEdit) {
        await productAPI.update(id, data);
        if (imageFiles.length > 0) {
          setUploadingImages(true);
          try {
            await productAPI.uploadImages(id, imageFiles);
            toast({ title: `${imageFiles.length} image(s) uploaded` });
          } catch {
            toast({ title: 'Product updated but image upload failed', variant: 'destructive' });
          } finally {
            setUploadingImages(false);
          }
        } else {
          toast({ title: 'Product updated successfully' });
        }
      } else {
        const { data: res } = await productAPI.create(data);
        productId = res.data.id;
        setCreatedProductId(productId);
        toast({ title: 'Product created successfully' });

        if (imageFiles.length > 0) {
          setUploadingImages(true);
          try {
            await productAPI.uploadImages(productId, imageFiles);
            toast({ title: `${imageFiles.length} image(s) uploaded` });
          } catch {
            toast({ title: 'Product created but image upload failed', variant: 'destructive' });
          } finally {
            setUploadingImages(false);
          }
        }
      }
      navigate('/seller/products');
    } catch (err) {
      toast({ title: 'Failed to save product', description: err.response?.data?.message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link to="/seller/products" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="h-4 w-4" /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Basic Information</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>Product Type</Label>
              <div className="grid grid-cols-2 gap-2">
                {['FOOD', 'MATERIAL'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setProductType(t); setValue('productType', t); }}
                    className={`py-2 rounded-md border text-sm font-medium ${watchedType === t ? 'bg-rosewood-600 text-white border-rosewood-600' : 'bg-white hover:bg-muted'}`}
                  >
                    {t === 'FOOD' ? '🥗 Food Product' : '🔩 Material'}
                  </button>
                ))}
              </div>
              {errors.productType && <p className="text-xs text-destructive">{errors.productType.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Product Name</Label>
              <Input placeholder="e.g. Organic Strawberries" {...register('name')} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1">
              <Label>Description (optional)</Label>
              <textarea
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="Describe your product..."
                {...register('description')}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Price (₱)</Label>
                <Input type="number" step="0.01" min="0" placeholder="0.00" {...register('price')} />
                {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
              </div>
              <div className="space-y-1">
                <Label>Stock Quantity</Label>
                <Input type="number" min="0" placeholder="0" {...register('stockQty')} />
                {errors.stockQty && <p className="text-xs text-destructive">{errors.stockQty.message}</p>}
              </div>
            </div>

            <div className="space-y-1">
              <Label>Category</Label>
              <Select
                value={selectedCategoryId}
                onValueChange={(v) => { setSelectedCategoryId(v); setValue('categoryId', v); }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.categoryId && <p className="text-xs text-destructive">{errors.categoryId.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Type-specific fields */}
        {watchedType === 'FOOD' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Food Product Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Expiration Date</Label>
                <Input type="datetime-local" {...register('expirationDate')} />
              </div>
              <div className="space-y-1">
                <Label>Storage Instructions</Label>
                <Input placeholder="e.g. Keep refrigerated" {...register('storageInstructions')} />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" {...register('isPerishable')} className="rounded" />
                <span className="text-sm">This is a perishable item</span>
              </label>
            </CardContent>
          </Card>
        )}

        {watchedType === 'MATERIAL' && (
          <Card>
            <CardHeader><CardTitle className="text-base">Material Details</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <Label>Material Type</Label>
                <Input placeholder="e.g. Steel, Cement, Plastic" {...register('materialType')} />
              </div>
              <div className="space-y-1">
                <Label>Unit / Measurement</Label>
                <Input placeholder="e.g. kg, piece, bag, bundle" {...register('unit')} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Images */}
        <Card>
          <CardHeader><CardTitle className="text-base">Product Images</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {/* Existing images (edit mode) */}
            {isEdit && existingImages.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-2">Current images — click × to remove</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {existingImages.map((img) => (
                    <div key={img.id} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                      <img src={img.url} alt="product" className="w-full h-full object-cover" />
                      {img.isPrimary && (
                        <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1 rounded flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5" /> Primary
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={deletingImageId === img.id}
                        onClick={() => handleDeleteImage(img.id)}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
                      >
                        {deletingImageId === img.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload new images */}
            <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-md p-6 cursor-pointer hover:bg-muted/50 transition-colors">
              <Upload className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                {isEdit ? 'Add more images' : 'Click to upload images'} (max 5)
              </p>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => setImageFiles(Array.from(e.target.files).slice(0, 5))}
              />
            </label>
            {imageFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{imageFiles.length} new file(s) selected:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {imageFiles.map((f, i) => (
                    <div key={i} className="relative aspect-square rounded-lg overflow-hidden border bg-muted">
                      <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImageFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/seller/products')} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" className="flex-1 bg-rosewood-600 hover:bg-rosewood-700" disabled={isLoading || uploadingImages}>
            {(isLoading || uploadingImages) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {uploadingImages ? 'Uploading images...' : isEdit ? 'Update Product' : 'Create Product'}
          </Button>
        </div>
      </form>
    </div>
  );
}

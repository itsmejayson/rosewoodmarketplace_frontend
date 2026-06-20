import { useState, useEffect } from 'react';
import { storeSettingsAPI, userAPI } from '../../api';
import useAuthStore from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/toast';
import { Loader2, Store, Save, Truck, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function StoreSettingsPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeName: '',
    storeDescription: '',
    storeAddress: '',
    defaultDeliveryFee: 0,
    freeDeliveryThreshold: '',
  });

  useEffect(() => {
    setForm({
      storeName: user?.storeName || '',
      storeDescription: user?.storeDescription || '',
      storeAddress: user?.storeAddress || '',
      defaultDeliveryFee: user?.defaultDeliveryFee || 0,
      freeDeliveryThreshold: user?.freeDeliveryThreshold || '',
    });
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const threshold = form.freeDeliveryThreshold === '' ? null : parseFloat(form.freeDeliveryThreshold);

      await storeSettingsAPI.update({
        storeDescription: form.storeDescription,
        storeAddress: form.storeAddress,
        defaultDeliveryFee: parseFloat(form.defaultDeliveryFee) || 0,
        freeDeliveryThreshold: threshold,
      });

      if (form.storeName !== user?.storeName) {
        await userAPI.updateProfile({ storeName: form.storeName });
      }

      updateUser({
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        storeAddress: form.storeAddress,
        defaultDeliveryFee: parseFloat(form.defaultDeliveryFee) || 0,
        freeDeliveryThreshold: threshold,
      });

      toast({ title: 'Store settings saved' });
    } catch (err) {
      toast({
        variant: 'destructive',
        title: err.response?.data?.message || 'Failed to save store settings',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-2xl font-bold flex items-center gap-2 mb-6">
        <Store className="h-6 w-6" />
        Store Settings
      </h1>

      <Card>
        <CardHeader>
          <CardTitle>Store Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="storeName">Store Name</Label>
            <Input
              id="storeName"
              value={form.storeName}
              onChange={handleChange('storeName')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeDescription">Store Description</Label>
            <textarea
              id="storeDescription"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={form.storeDescription}
              onChange={handleChange('storeDescription')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="storeAddress">Store Address</Label>
            <Input
              id="storeAddress"
              value={form.storeAddress}
              onChange={handleChange('storeAddress')}
            />
          </div>

          <div className="border-t pt-4 mt-2">
            <p className="flex items-center gap-2 text-sm font-semibold mb-3">
              <Truck className="h-4 w-4 text-rosewood-600" /> Delivery Settings
            </p>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="defaultDeliveryFee">Default Delivery Fee</Label>
                <p className="text-xs text-muted-foreground">Automatically added to every delivery order.</p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">₱</span>
                  <Input
                    id="defaultDeliveryFee"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    value={form.defaultDeliveryFee}
                    onChange={handleChange('defaultDeliveryFee')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="freeDeliveryThreshold">Free Delivery Threshold (optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Orders at or above this amount get free delivery. Leave blank to never offer free delivery.
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">₱</span>
                  <Input
                    id="freeDeliveryThreshold"
                    type="number"
                    min="0"
                    step="0.01"
                    inputMode="decimal"
                    placeholder="e.g. 500"
                    value={form.freeDeliveryThreshold}
                    onChange={handleChange('freeDeliveryThreshold')}
                  />
                </div>
                {form.defaultDeliveryFee > 0 && form.freeDeliveryThreshold > 0 && (
                  <p className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                    Orders ₱{parseFloat(form.freeDeliveryThreshold).toFixed(2)}+ get free delivery. Below that: ₱{parseFloat(form.defaultDeliveryFee).toFixed(2)} fee.
                  </p>
                )}
              </div>
            </div>
          </div>

          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-rosewood-600 hover:bg-rosewood-700"
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

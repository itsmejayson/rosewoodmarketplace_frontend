import { useState, useEffect } from 'react';
import { storeSettingsAPI, userAPI } from '../../api';
import useAuthStore from '../../store/authStore';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/toast';
import { Loader2, Store, Save } from 'lucide-react';

export default function StoreSettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    storeName: '',
    storeDescription: '',
    storeAddress: '',
    defaultDeliveryFee: 0,
  });

  useEffect(() => {
    setForm({
      storeName: user?.storeName || '',
      storeDescription: user?.storeDescription || '',
      storeAddress: user?.storeAddress || '',
      defaultDeliveryFee: user?.defaultDeliveryFee || 0,
    });
  }, [user]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await storeSettingsAPI.update({
        storeDescription: form.storeDescription,
        storeAddress: form.storeAddress,
        defaultDeliveryFee: parseFloat(form.defaultDeliveryFee) || 0,
      });

      if (form.storeName !== user?.storeName) {
        await userAPI.updateProfile({ storeName: form.storeName });
      }

      // Update local auth store directly so the form stays populated
      updateUser({
        storeName: form.storeName,
        storeDescription: form.storeDescription,
        storeAddress: form.storeAddress,
        defaultDeliveryFee: parseFloat(form.defaultDeliveryFee) || 0,
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

          <div className="space-y-2">
            <Label htmlFor="defaultDeliveryFee">Default Delivery Fee</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">₱</span>
              <Input
                id="defaultDeliveryFee"
                type="number"
                value={form.defaultDeliveryFee}
                onChange={handleChange('defaultDeliveryFee')}
              />
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

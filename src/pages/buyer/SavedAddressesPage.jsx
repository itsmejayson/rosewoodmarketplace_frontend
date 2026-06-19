import { useEffect, useState } from 'react';
import { addressAPI } from '../../api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { toast } from '../../components/ui/toast';
import { Loader2, MapPin, Plus, Pencil, Trash2, Star, X } from 'lucide-react';

const emptyForm = {
  label: '',
  fullName: '',
  phone: '',
  address: '',
  city: '',
  state: '',
  zip: '',
  country: '',
};

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressAPI.list();
      setAddresses(res.data.data || []);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load addresses.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEditModal = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || '',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      address: addr.address || '',
      city: addr.city || '',
      state: addr.state || '',
      zip: addr.zip || '',
      country: addr.country || '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const handleChange = (field) => (e) => {
    let value = e.target.value;
    if (field === 'phone') value = value.replace(/[^0-9+\-()\s]/g, '');
    if (field === 'zip') value = value.replace(/\D/g, '');
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id) => {
    try {
      await addressAPI.delete(id);
      toast({ title: 'Address deleted' });
      await fetchAddresses();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete address.',
        variant: 'destructive',
      });
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      toast({ title: 'Default address updated' });
      await fetchAddresses();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to set default address.',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const required = ['label', 'fullName', 'phone', 'address', 'city'];
    const missing = required.some((field) => !form[field].trim());
    if (missing) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in label, full name, phone, address, and city.',
        variant: 'destructive',
      });
      return;
    }

    setSubmitting(true);
    try {
      if (editingId) {
        await addressAPI.update(editingId, form);
      } else {
        await addressAPI.create(form);
      }
      closeModal();
      await fetchAddresses();
      toast({
        title: editingId ? 'Address updated' : 'Address added',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save address.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Saved Addresses</h1>
        <Button onClick={openAddModal}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Address
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No saved addresses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card key={addr.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span>{addr.label}</span>
                  {addr.isDefault && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      <Star className="h-3 w-3" />
                      Default
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{addr.fullName}</p>
                  <p className="text-muted-foreground">{addr.phone}</p>
                  <p>{addr.address}</p>
                  <p>
                    {addr.city}
                    {addr.state ? `, ${addr.state}` : ''} {addr.zip}
                  </p>
                  <p>{addr.country}</p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(addr)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(addr.id)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                  {!addr.isDefault && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(addr.id)}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set as default
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Edit Address' : 'Add New Address'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="text-muted-foreground hover:text-foreground"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-4">
              <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
                <div className="space-y-2">
                  <Label htmlFor="label">Label</Label>
                  <Input
                    id="label"
                    value={form.label}
                    onChange={handleChange('label')}
                    placeholder="Home, Work, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={form.fullName}
                    onChange={handleChange('fullName')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={form.phone}
                    onChange={handleChange('phone')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={form.address}
                    onChange={handleChange('address')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={form.city}
                    onChange={handleChange('city')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={form.state}
                    onChange={handleChange('state')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    inputMode="numeric"
                    placeholder="e.g. 4000"
                    value={form.zip}
                    onChange={handleChange('zip')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={form.country}
                    onChange={handleChange('country')}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Address'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

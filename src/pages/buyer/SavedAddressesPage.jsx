import { useEffect, useState } from 'react';
import { addressAPI } from '../../api';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { toast } from '../../components/ui/toast';
import { Loader2, MapPin, Plus, Pencil, Trash2, Star, X, Check } from 'lucide-react';

const emptyForm = { label: '', fullName: '', phone: '', state: '', address: '', city: '', isDefault: false };

function formatAddress(addr) {
  const parts = [
    addr.state && `Phase ${addr.state}`,
    addr.address && `Lot ${addr.address}`,
    addr.city && `Block ${addr.city}`,
  ].filter(Boolean);
  return parts.join(', ');
}

export default function SavedAddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await addressAPI.list();
      setAddresses(res.data.data || []);
    } catch {
      toast({ title: 'Failed to load addresses', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openAdd = () => {
    setEditingId(null);
    // Auto-default if this will be the first address
    setForm({ ...emptyForm, isDefault: addresses.length === 0 });
    setModalOpen(true);
  };

  const openEdit = (addr) => {
    setEditingId(addr.id);
    setForm({
      label: addr.label || '',
      fullName: addr.fullName || '',
      phone: addr.phone || '',
      state: addr.state || '',
      address: addr.address || '',
      city: addr.city || '',
      isDefault: addr.isDefault || false,
    });
    setModalOpen(true);
  };

  const closeModal = () => { setModalOpen(false); setEditingId(null); setForm(emptyForm); };

  const handleChange = (field) => (e) => {
    const value = field === 'phone' ? e.target.value.replace(/[^0-9+\-()\s]/g, '') : e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleDelete = async (id) => {
    try {
      await addressAPI.delete(id);
      toast({ title: 'Address deleted' });
      setDeleteId(null);
      fetchAddresses();
    } catch {
      toast({ title: 'Failed to delete address', variant: 'destructive' });
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      toast({ title: 'Default address updated' });
      fetchAddresses();
    } catch {
      toast({ title: 'Failed to set default address', variant: 'destructive' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.fullName.trim() || !form.phone.trim() || !form.state.trim() || !form.address.trim() || !form.city.trim()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await addressAPI.update(editingId, form);
        if (form.isDefault) await addressAPI.setDefault(editingId);
      } else {
        const res = await addressAPI.create(form);
        if (form.isDefault && res.data?.data?.id) await addressAPI.setDefault(res.data.data.id);
      }
      closeModal();
      fetchAddresses();
      toast({ title: editingId ? 'Address updated' : 'Address saved' });
    } catch {
      toast({ title: 'Failed to save address', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">Saved Addresses</h1>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rosewood-600 hover:bg-rosewood-700 text-white text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" /> Add Address
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-400" /></div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <MapPin className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="font-medium text-gray-700">No saved addresses yet</p>
            <p className="text-sm text-gray-400 mt-1">Add an address to speed up checkout.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((addr) => (
              <div key={addr.id} className={`bg-white rounded-2xl p-4 shadow-sm border-2 transition-colors ${addr.isDefault ? 'border-rosewood-300' : 'border-transparent'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {addr.label && <span className="text-xs font-semibold text-rosewood-700 bg-rosewood-50 px-2 py-0.5 rounded-full">{addr.label}</span>}
                      {addr.isDefault && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                          <Star className="h-3 w-3 fill-amber-500 text-amber-500" /> Default
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm">{addr.fullName}</p>
                    <p className="text-sm text-gray-500">{addr.phone}</p>
                    <p className="text-sm text-gray-600 mt-0.5">{formatAddress(addr)}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => openEdit(addr)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteId(addr.id)} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                {!addr.isDefault && (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-rosewood-600 transition-colors"
                  >
                    <Star className="h-3.5 w-3.5" /> Set as default
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">{editingId ? 'Edit Address' : 'New Address'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-1">
                <Label htmlFor="label">Nickname (optional)</Label>
                <Input id="label" placeholder="e.g. Home, Work" value={form.label} onChange={handleChange('label')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input id="fullName" placeholder="Juan dela Cruz" value={form.fullName} onChange={handleChange('fullName')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="phone">Contact Number *</Label>
                <Input id="phone" type="tel" inputMode="tel" placeholder="09XX-XXX-XXXX" value={form.phone} onChange={handleChange('phone')} />
              </div>
              <div className="space-y-1">
                <Label htmlFor="state">Phase *</Label>
                <Input id="state" placeholder="e.g. Phase 1" value={form.state} onChange={handleChange('state')} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="address">Lot *</Label>
                  <Input id="address" placeholder="e.g. Lot 12" value={form.address} onChange={handleChange('address')} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="city">Block *</Label>
                  <Input id="city" placeholder="e.g. Block 3" value={form.city} onChange={handleChange('city')} />
                </div>
              </div>

              {/* Set as default toggle */}
              <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:border-rosewood-300 transition-colors">
                <div className={`h-5 w-5 rounded flex items-center justify-center border-2 transition-colors flex-shrink-0 ${form.isDefault ? 'bg-rosewood-600 border-rosewood-600' : 'border-gray-300'}`}>
                  {form.isDefault && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
                <input type="checkbox" className="sr-only" checked={form.isDefault} onChange={(e) => setForm((p) => ({ ...p, isDefault: e.target.checked }))} />
                <div>
                  <p className="text-sm font-medium text-gray-800">Set as default address</p>
                  <p className="text-xs text-gray-400">Auto-filled on checkout</p>
                </div>
              </label>

              <div className="flex gap-2 pt-1">
                <button type="button" onClick={closeModal} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-xl bg-rosewood-600 hover:bg-rosewood-700 text-white text-sm font-medium disabled:opacity-60 flex items-center justify-center gap-2">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Save Changes' : 'Add Address'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <Trash2 className="h-10 w-10 text-red-400 mx-auto mb-3" />
            <p className="font-bold text-gray-900 mb-1">Delete this address?</p>
            <p className="text-sm text-gray-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

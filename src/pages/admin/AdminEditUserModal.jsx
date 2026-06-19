import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2 } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { userAPI } from '../../api';
import { toast } from '../../components/ui/toast';

const schema = z.object({
  fullName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(7, 'Contact number is required'),
  address: z.string().optional(),
  storeName: z.string().optional(),
  password: z.string().optional().refine((v) => !v || v.length >= 8, { message: 'Min 8 characters' }),
});

export default function AdminEditUserModal({ user, onClose, onUpdated }) {
  const [role, setRole] = useState(user.role);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user.fullName || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      storeName: user.storeName || '',
      password: '',
    },
  });

  const onSubmit = async (data) => {
    const payload = { ...data, role };
    if (!payload.password) delete payload.password;
    try {
      const { data: res } = await userAPI.updateUser(user.id, payload);
      toast({ title: 'User updated successfully' });
      onUpdated(res.data);
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Update failed', variant: 'destructive' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 bg-white">
          <h2 className="font-semibold text-lg">Edit User</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Role selector */}
          <div className="space-y-1">
            <Label>Role</Label>
            <div className="grid grid-cols-3 gap-2">
              {['BUYER', 'SELLER', 'ADMIN'].map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 rounded-md border text-sm font-medium transition-colors ${role === r ? 'bg-rosewood-600 text-white border-rosewood-600' : 'bg-white hover:bg-muted'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <Label>Full Name</Label>
            <Input {...register('fullName')} />
            {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Contact Number</Label>
            <Input
              type="tel"
              inputMode="tel"
              placeholder="+63 9XX XXX XXXX"
              {...register('phone')}
              onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9+\-()\s]/g, ''); }}
            />
            {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
          </div>

          <div className="space-y-1">
            <Label>Address</Label>
            <Input placeholder="Street, City, Province" {...register('address')} />
          </div>

          {role === 'SELLER' && (
            <div className="space-y-1">
              <Label>Store Name</Label>
              <Input placeholder="e.g. Juan's Fresh Market" {...register('storeName')} />
              {errors.storeName && <p className="text-xs text-destructive">{errors.storeName.message}</p>}
            </div>
          )}

          <div className="space-y-1">
            <Label>New Password <span className="text-muted-foreground text-xs">(leave blank to keep current)</span></Label>
            <Input type="password" placeholder="Min. 8 characters" {...register('password')} />
            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" className="flex-1 bg-rosewood-600 hover:bg-rosewood-700" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

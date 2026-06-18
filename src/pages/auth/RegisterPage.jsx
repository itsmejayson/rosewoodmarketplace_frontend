import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Store, Loader2, ShoppingCart, Package } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import useAuthStore from '../../store/authStore';
import { toast } from '../../components/ui/toast';
import { useState } from 'react';

const schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(7, 'Contact number is required'),
  role: z.enum(['BUYER', 'SELLER']),
  storeName: z.string().optional(),
}).refine((d) => d.role !== 'SELLER' || (d.storeName && d.storeName.trim().length >= 2), {
  message: 'Store name is required for sellers (min. 2 characters)',
  path: ['storeName'],
});

const ROLE_OPTIONS = [
  { value: 'BUYER', label: 'Buy Products', icon: ShoppingCart },
  { value: 'SELLER', label: 'Sell Products', icon: Package },
];

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'SELLER' ? 'SELLER' : 'BUYER';
  const [role, setRole] = useState(defaultRole);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const onSubmit = async (data) => {
    const result = await registerUser(data);
    if (result.success) {
      toast({ title: 'Account created!', description: 'Welcome to Rosewood Marketplace.' });
      navigate('/');
    } else {
      toast({ title: 'Registration failed', description: result.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rosewood-50 to-rosewood-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="h-12 w-12 rounded-full bg-rosewood-100 flex items-center justify-center">
              <Store className="h-6 w-6 text-rosewood-600" />
            </div>
          </div>
          <CardTitle className="text-2xl">Create account</CardTitle>
          <CardDescription>Join RP Market today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>I want to</Label>
              <div className="grid grid-cols-2 gap-2">
                {ROLE_OPTIONS.map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setRole(value); setValue('role', value); }}
                    className={`py-2 px-3 rounded-md border text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                      role === value
                        ? 'bg-rosewood-600 text-white border-rosewood-600'
                        : 'bg-white hover:bg-muted'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="fullName">Full Name</Label>
              <Input id="fullName" placeholder="John Doe" {...register('fullName')} />
              {errors.fullName && <p className="text-xs text-destructive">{errors.fullName.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Min. 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            {role === 'SELLER' && (
              <div className="space-y-1">
                <Label htmlFor="storeName">Store Name</Label>
                <Input id="storeName" placeholder="e.g. Juan's Fresh Market" {...register('storeName')} />
                {errors.storeName && <p className="text-xs text-destructive">{errors.storeName.message}</p>}
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="phone">Contact Number</Label>
              <Input id="phone" type="tel" placeholder="+63-9XX-XXX-XXXX" {...register('phone')} />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            <Button type="submit" className="w-full bg-rosewood-600 hover:bg-rosewood-700" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center text-sm">
          <p className="text-muted-foreground w-full">
            Already have an account?{' '}
            <Link to="/login" className="text-rosewood-600 hover:underline font-medium">Sign in</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

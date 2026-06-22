import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Store, Loader2, ShoppingCart, Package, Eye, EyeOff, Upload, FileText, X } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import useAuthStore from '../../store/authStore';
import useAppConfigStore from '../../store/appConfigStore';
import { toast } from '../../components/ui/toast';
import { useState, useRef } from 'react';

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

const ACCEPTED_TYPES = '.pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/gif';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function RegisterPage() {
  const { register: registerUser, isLoading } = useAuthStore();
  const appName = useAppConfigStore((s) => s.appName);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'SELLER' ? 'SELLER' : 'BUYER';
  const [role, setRole] = useState(defaultRole);
  const [showPassword, setShowPassword] = useState(false);
  const [proofFile, setProofFile] = useState(null);
  const [proofError, setProofError] = useState('');
  const fileInputRef = useRef(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole },
  });

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      setProofError('File must be under 10 MB');
      setProofFile(null);
      return;
    }
    setProofFile(file);
    setProofError('');
  };

  const removeFile = () => {
    setProofFile(null);
    setProofError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data) => {
    if (data.role === 'SELLER' && !proofFile) {
      setProofError('Proof of residency document is required');
      return;
    }

    // Send as FormData so the file can be included
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('password', data.password);
    formData.append('phone', data.phone);
    formData.append('role', data.role);
    if (data.storeName) formData.append('storeName', data.storeName);
    if (proofFile) formData.append('proofDocument', proofFile);

    const result = await registerUser(formData);
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
          <CardDescription>Join {appName} today</CardDescription>
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
                    onClick={() => { setRole(value); setValue('role', value); setProofError(''); }}
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
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Min. 8 characters" {...register('password')} className="pr-10" />
                <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                placeholder="+63-9XX-XXX-XXXX"
                {...register('phone')}
                onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9+\-()\s]/g, ''); }}
              />
              {errors.phone && <p className="text-xs text-destructive">{errors.phone.message}</p>}
            </div>

            {role === 'SELLER' && (
              <div className="space-y-1">
                <Label>
                  Proof of Residency <span className="text-destructive">*</span>
                </Label>
                <p className="text-xs text-muted-foreground">
                  Upload a proof of residency document (e.g. barangay certificate of residency, utility bill, or any official document showing your current address). Accepted: PDF, DOC, DOCX, or image (max 10 MB).
                </p>

                {proofFile ? (
                  <div className="flex items-center gap-2 p-3 rounded-md border bg-muted/50">
                    <FileText className="h-5 w-5 text-rosewood-600 flex-shrink-0" />
                    <span className="text-sm truncate flex-1">{proofFile.name}</span>
                    <button type="button" onClick={removeFile} className="text-muted-foreground hover:text-destructive flex-shrink-0">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex flex-col items-center gap-2 p-4 rounded-md border-2 border-dashed border-muted-foreground/30 hover:border-rosewood-400 hover:bg-rosewood-50 transition-colors text-muted-foreground hover:text-rosewood-600"
                  >
                    <Upload className="h-6 w-6" />
                    <span className="text-sm font-medium">Click to upload document</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_TYPES}
                  className="hidden"
                  onChange={handleFileChange}
                />
                {proofError && <p className="text-xs text-destructive">{proofError}</p>}
              </div>
            )}

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

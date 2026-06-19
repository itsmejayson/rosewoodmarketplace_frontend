import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Lock, Camera, Loader2, Store, Bell, Eye, EyeOff } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import useAuthStore from '../store/authStore';
import { userAPI } from '../api';
import { getInitials } from '../lib/utils';

const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  address: z.string().optional(),
  storeName: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [profileMsg, setProfileMsg] = useState(null);
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { permission, isSubscribed, isLoading: pushLoading, requestPermissionAndSubscribe, unsubscribe } = usePushNotifications();

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || '',
      phone: user?.phone || '',
      address: user?.address || '',
      storeName: user?.storeName || '',
    },
  });

  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  const onProfileSubmit = async (values) => {
    try {
      const { data } = await userAPI.updateProfile(values);
      updateUser(data.data);
      profileForm.reset(values); // keep form populated with saved values
      setProfileMsg({ type: 'success', text: 'Profile updated successfully' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Update failed' });
    }
  };

  const onPasswordSubmit = async (values) => {
    try {
      await userAPI.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset();
      setPasswordMsg({ type: 'success', text: 'Password changed successfully' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password' });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarLoading(true);
    try {
      const { data } = await userAPI.uploadProfileImage(file);
      updateUser({ profileImage: data.data.profileImage });
    } catch (err) {
      setProfileMsg({ type: 'error', text: 'Image upload failed' });
    } finally {
      setAvatarLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6 flex items-center gap-6">
          <div className="relative">
            {user?.profileImage ? (
              <img src={user.profileImage} alt={user.fullName} className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-2xl font-bold">
                {getInitials(user?.fullName)}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-background border rounded-full p-1 cursor-pointer hover:bg-muted">
              {avatarLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </label>
          </div>
          <div>
            <p className="font-semibold text-lg">{user?.fullName}</p>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{user?.role}</span>
              {user?.storeName && (
                <span className="text-xs text-rosewood-600 font-medium flex items-center gap-1">
                  <Store className="w-3 h-3" /> {user.storeName}
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><User className="w-4 h-4" /> Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Full Name</Label>
              <Input {...profileForm.register('fullName')} />
              {profileForm.formState.errors.fullName && (
                <p className="text-xs text-destructive">{profileForm.formState.errors.fullName.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                {...profileForm.register('phone')}
                type="tel"
                inputMode="tel"
                placeholder="+63 9XX XXX XXXX"
                onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9+\-()\s]/g, ''); }}
              />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input {...profileForm.register('address')} placeholder="Street, City, Province" />
            </div>

            {user?.role === 'SELLER' && (
              <div className="space-y-1 border-t pt-4">
                <Label className="flex items-center gap-1"><Store className="w-4 h-4" /> Store Name</Label>
                <Input {...profileForm.register('storeName')} placeholder="e.g. Juan's Fresh Market" />
                {profileForm.formState.errors.storeName && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.storeName.message}</p>
                )}
                <p className="text-xs text-muted-foreground">This is the name buyers see on your store page.</p>
              </div>
            )}

            {profileMsg && (
              <p className={`text-sm ${profileMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {profileMsg.text}
              </p>
            )}
            <Button type="submit" disabled={profileForm.formState.isSubmitting}>
              {profileForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Bell className="h-4 w-4" /> Push Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {permission === 'denied' ? (
            <p className="text-sm text-muted-foreground">Push notifications are blocked in your browser settings. Enable them in your browser site settings to receive notifications.</p>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{isSubscribed ? 'Notifications enabled' : 'Notifications disabled'}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Receive order updates, payment confirmations, and messages.</p>
              </div>
              <button
                onClick={isSubscribed ? unsubscribe : requestPermissionAndSubscribe}
                disabled={pushLoading}
                className={`text-sm px-4 py-1.5 rounded-md font-medium disabled:opacity-50 ${isSubscribed ? 'border hover:bg-muted' : 'bg-rosewood-600 text-white hover:bg-rosewood-700'}`}
              >
                {pushLoading ? '…' : isSubscribed ? 'Disable' : 'Enable'}
              </button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Lock className="w-4 h-4" /> Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label>Current Password</Label>
              <div className="relative">
                <Input type={showCurrent ? 'text' : 'password'} {...passwordForm.register('currentPassword')} className="pr-10" />
                <button type="button" onClick={() => setShowCurrent(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>New Password</Label>
              <div className="relative">
                <Input type={showNew ? 'text' : 'password'} {...passwordForm.register('newPassword')} className="pr-10" />
                <button type="button" onClick={() => setShowNew(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label>Confirm New Password</Label>
              <div className="relative">
                <Input type={showConfirm ? 'text' : 'password'} {...passwordForm.register('confirmPassword')} className="pr-10" />
                <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            {passwordMsg && (
              <p className={`text-sm ${passwordMsg.type === 'success' ? 'text-green-600' : 'text-destructive'}`}>
                {passwordMsg.text}
              </p>
            )}
            <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
              {passwordForm.formState.isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

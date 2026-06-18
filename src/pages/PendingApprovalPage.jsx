import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, CheckCircle2, Bell, Store } from 'lucide-react';
import { Button } from '../components/ui/button';
import useAuthStore from '../store/authStore';
import { useSocket } from '../hooks/useSocket';
import { toast } from '../components/ui/toast';

export default function PendingApprovalPage() {
  const { user, fetchMe, logout } = useAuthStore();
  const navigate = useNavigate();
  const socket = useSocket();

  useEffect(() => {
    if (!socket) return;

    const onApproved = async () => {
      // Refresh user data so isApproved flips to true
      await fetchMe();
      toast({ title: 'Account Approved!', description: 'Welcome to Rosewood Marketplace. You can now access your seller dashboard.' });
      navigate('/seller/dashboard', { replace: true });
    };

    const onRejected = () => {
      toast({ title: 'Account Not Approved', description: 'Your seller application was not approved. Please contact support.', variant: 'destructive' });
      logout();
      navigate('/login', { replace: true });
    };

    socket.on('sellerApproved', onApproved);
    socket.on('sellerRejected', onRejected);
    return () => {
      socket.off('sellerApproved', onApproved);
      socket.off('sellerRejected', onRejected);
    };
  }, [socket]);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-rosewood-50 to-rosewood-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Top banner */}
          <div className="bg-rosewood-600 px-8 py-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Store className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl">Rosewood Marketplace</h1>
              <p className="text-rosewood-200 text-sm">Seller Application</p>
            </div>
          </div>

          {/* Body */}
          <div className="px-8 py-8 text-center">
            <div className="flex justify-center mb-5">
              <div className="h-20 w-20 rounded-full bg-amber-50 border-4 border-amber-100 flex items-center justify-center">
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pending Admin Approval</h2>
            <p className="text-muted-foreground mb-1">
              Hi <span className="font-semibold text-gray-800">{user?.fullName}</span>!
            </p>
            <p className="text-muted-foreground mb-6">
              Your seller account is currently under review. An admin will approve it shortly.
              This page will update automatically once a decision is made.
            </p>

            {/* Steps */}
            <div className="text-left space-y-3 mb-8">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-100">
                <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-800">Registration complete</p>
                  <p className="text-xs text-green-600">Your account has been created successfully</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-100">
                <Clock className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Admin review in progress</p>
                  <p className="text-xs text-amber-600">Typically reviewed within 24 hours</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                <Bell className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-500">You'll be notified here</p>
                  <p className="text-xs text-gray-400">This page updates automatically — no need to refresh</p>
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

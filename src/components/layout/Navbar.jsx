import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Bell, User, LogOut, Store, LayoutDashboard, Package, ShoppingBag, Home, Users, Heart, MapPin, RotateCcw, Settings, Star, CreditCard, HelpCircle, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useNotificationStore from '../../store/notificationStore';
import useSellerOrderStore from '../../store/sellerOrderStore';
import { useState, useEffect } from 'react';
import { getInitials } from '../../lib/utils';
import { CheckCircle } from 'lucide-react';

function RpLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <ellipse cx="18" cy="13" rx="5" ry="7" fill="#C84B6E" opacity="0.9" transform="rotate(-20 18 13)" />
      <ellipse cx="18" cy="13" rx="5" ry="7" fill="#C84B6E" opacity="0.75" transform="rotate(20 18 13)" />
      <ellipse cx="18" cy="13" rx="4" ry="6" fill="#A33558" opacity="0.85" transform="rotate(0 18 13)" />
      <circle cx="18" cy="13" r="3" fill="#8A2C4A" />
      <path d="M18 19 Q17 25 16 28" stroke="#5C4133" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 23 Q13 20 12 17 Q15 17 17 23Z" fill="#78B832" />
    </svg>
  );
}

function LogoutOverlay({ visible }) {
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-opacity duration-300 ${visible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className={`flex flex-col items-center gap-4 transition-transform duration-300 ${visible ? 'scale-100' : 'scale-90'}`}>
        <div className="h-20 w-20 rounded-full bg-rosewood-100 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-rosewood-600" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <p className="text-xl font-semibold">You've been logged out</p>
          <p className="text-sm text-muted-foreground mt-1">See you next time!</p>
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const { cart } = useCartStore();
  const { unreadCount } = useNotificationStore();
  const { pendingCount, pendingRefundCount, fetchPendingCount } = useSellerOrderStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loggingOut, setLoggingOut] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close sheet on navigation
  useEffect(() => { setSheetOpen(false); }, [location.pathname]);

  useEffect(() => {
    if (user?.role === 'SELLER') {
      fetchPendingCount();
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.id]);

  const handleLogout = () => {
    setLoggingOut(true);
    setTimeout(() => {
      logout();
      navigate('/login');
      setLoggingOut(false);
    }, 1800);
  };

  const itemCount = cart?.itemCount ?? 0;
  const isActive = (to) => location.pathname === to || location.pathname.startsWith(to + '/');

  const desktopNavLinks = user?.role === 'SELLER'
    ? [
        { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seller/products', label: 'Products', icon: Package },
        { to: '/seller/orders', label: 'Orders', icon: ShoppingBag, badge: pendingCount },
        { to: '/seller/refunds', label: 'Refunds', icon: RotateCcw, badge: pendingRefundCount },
        { to: '/seller/reviews', label: 'Reviews', icon: Star },
        { to: '/seller/transactions', label: 'Transactions', icon: CreditCard },
        { to: '/seller/settings', label: 'Settings', icon: Settings },
      ]
    : user?.role === 'BUYER'
    ? [
        { to: '/marketplace', label: 'Shop', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
        { to: '/orders', label: 'My Orders', icon: ShoppingBag },
        { to: '/favorites', label: 'Favorites', icon: Heart },
      ]
    : user?.role === 'ADMIN'
    ? [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/marketplace', label: 'Marketplace', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
      ]
    : [
        { to: '/marketplace', label: 'Shop', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
        { to: '/faq', label: 'FAQ', icon: HelpCircle },
      ];

  return (
    <>
      <LogoutOverlay visible={loggingOut} />
      <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 shadow-sm">
        <div className="flex h-14 items-center justify-between px-4 max-w-6xl mx-auto">

          {/* Logo */}
          <Link to={user?.role === 'SELLER' ? '/seller/dashboard' : user?.role === 'ADMIN' ? '/admin' : '/marketplace'} className="flex items-center gap-2 select-none flex-shrink-0">
            <RpLogo className="h-8 w-8" />
            <span className="font-bold text-base text-rosewood-700" style={{ fontFamily: 'Georgia, serif' }}>
              Rosewood
            </span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {desktopNavLinks.map(({ to, label, badge }) => (
              <Link
                key={to}
                to={to}
                className={`relative px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  isActive(to)
                    ? 'bg-rosewood-50 text-rosewood-600'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {label}
                {badge > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-blue-500 text-white text-[10px] flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-1">
            {user ? (
              <>
                {/* Notifications */}
                <Link to="/notifications">
                  <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                    <Bell className="h-5 w-5 text-gray-600" />
                    {unreadCount > 0 && (
                      <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-rosewood-500 text-white text-[9px] flex items-center justify-center font-bold">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </Button>
                </Link>

                {/* Cart (buyer only, desktop) */}
                {user.role === 'BUYER' && (
                  <Link to="/cart" className="hidden md:flex">
                    <Button variant="ghost" size="icon" className="relative rounded-full h-9 w-9">
                      <ShoppingCart className="h-5 w-5 text-gray-600" />
                      {itemCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-rosewood-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {itemCount > 9 ? '9+' : itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Cart (buyer, mobile top bar) */}
                {user.role === 'BUYER' && (
                  <Link to="/cart" className="md:hidden relative">
                    <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                      <ShoppingCart className="h-5 w-5 text-gray-600" />
                      {itemCount > 0 && (
                        <span className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-rosewood-500 text-white text-[9px] flex items-center justify-center font-bold">
                          {itemCount > 9 ? '9+' : itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Avatar — desktop: hover dropdown, mobile: tap to open bottom sheet */}
                <div className="relative group hidden md:block ml-1">
                  <button className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full hover:bg-gray-50 transition-colors">
                    <div className="h-7 w-7 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center text-xs font-bold">
                      {getInitials(user.fullName)}
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                  </button>
                  <div className="absolute right-0 mt-1 w-52 rounded-xl border border-gray-100 bg-white shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                      <p className="text-sm font-semibold truncate">{user.fullName}</p>
                      <p className="text-xs text-gray-500 capitalize mt-0.5">{user.role.toLowerCase()}</p>
                    </div>
                    <Link to="/profile" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <User className="h-4 w-4 text-gray-400" /> Profile
                    </Link>
                    {user.role === 'BUYER' && (
                      <>
                        <Link to="/addresses" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <MapPin className="h-4 w-4 text-gray-400" /> Saved Addresses
                        </Link>
                        <Link to="/transactions" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                          <CreditCard className="h-4 w-4 text-gray-400" /> Transactions
                        </Link>
                      </>
                    )}
                    <Link to="/faq" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <HelpCircle className="h-4 w-4 text-gray-400" /> Help & FAQ
                    </Link>
                    <div className="border-t border-gray-100">
                      <button onClick={handleLogout} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors">
                        <LogOut className="h-4 w-4" /> Sign out
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mobile avatar button */}
                <button
                  onClick={() => setSheetOpen(true)}
                  className="md:hidden flex items-center gap-1 pl-1 pr-1.5 py-1 rounded-full hover:bg-gray-50 transition-colors"
                >
                  <div className="h-7 w-7 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center text-xs font-bold">
                    {getInitials(user.fullName)}
                  </div>
                  <ChevronDown className="h-3 w-3 text-gray-400" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="text-sm rounded-full">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm" className="bg-rosewood-600 hover:bg-rosewood-700 rounded-full text-sm px-4">Register</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile account bottom sheet */}
      {sheetOpen && user && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl shadow-2xl overflow-hidden">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-gray-200" />
            </div>
            {/* User info */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="h-11 w-11 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center text-sm font-bold flex-shrink-0">
                {getInitials(user.fullName)}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400 capitalize">{user.role.toLowerCase()}</p>
              </div>
            </div>
            {/* Menu items */}
            <nav className="py-2">
              <Link to="/profile" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                <User className="h-5 w-5 text-gray-400" /> Profile
              </Link>
              {user.role === 'BUYER' && (
                <>
                  <Link to="/addresses" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    <MapPin className="h-5 w-5 text-gray-400" /> Saved Addresses
                  </Link>
                  <Link to="/refunds" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    <RotateCcw className="h-5 w-5 text-gray-400" /> Refunds
                  </Link>
                  <Link to="/transactions" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    <CreditCard className="h-5 w-5 text-gray-400" /> Transactions
                  </Link>
                </>
              )}
              {user.role === 'SELLER' && (
                <>
                  <Link to="/seller/settings" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    <Settings className="h-5 w-5 text-gray-400" /> Store Settings
                  </Link>
                  <Link to="/seller/transactions" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                    <CreditCard className="h-5 w-5 text-gray-400" /> Transactions
                  </Link>
                </>
              )}
              <Link to="/faq" className="flex items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 active:bg-gray-100">
                <HelpCircle className="h-5 w-5 text-gray-400" /> Help & FAQ
              </Link>
              <div className="border-t border-gray-100 mt-1">
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-sm text-red-500 hover:bg-red-50 active:bg-red-100"
                >
                  <LogOut className="h-5 w-5" /> Sign out
                </button>
              </div>
            </nav>
            {/* Safe area spacer for phones with home indicator */}
            <div className="pb-safe h-4" />
          </div>
        </div>
      )}
    </>
  );
}

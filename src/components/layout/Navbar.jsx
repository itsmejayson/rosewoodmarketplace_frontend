import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, Bell, User, LogOut, Store, Menu, X, LayoutDashboard, Package, ShoppingBag, Home, Users, Heart, MapPin, RotateCcw, Settings, AlertTriangle } from 'lucide-react';

function RpLogo({ className = '' }) {
  return (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      {/* Rose petals */}
      <ellipse cx="18" cy="13" rx="5" ry="7" fill="#C84B6E" opacity="0.9" transform="rotate(-20 18 13)" />
      <ellipse cx="18" cy="13" rx="5" ry="7" fill="#C84B6E" opacity="0.75" transform="rotate(20 18 13)" />
      <ellipse cx="18" cy="13" rx="4" ry="6" fill="#A33558" opacity="0.85" transform="rotate(0 18 13)" />
      {/* Rose center */}
      <circle cx="18" cy="13" r="3" fill="#8A2C4A" />
      {/* Stem */}
      <path d="M18 19 Q17 25 16 28" stroke="#5C4133" strokeWidth="1.5" strokeLinecap="round" />
      {/* Leaf */}
      <path d="M17 23 Q13 20 12 17 Q15 17 17 23Z" fill="#78B832" />
    </svg>
  );
}
import { Button } from '../ui/button';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useNotificationStore from '../../store/notificationStore';
import useSellerOrderStore from '../../store/sellerOrderStore';
import { useState, useEffect } from 'react';
import { getInitials } from '../../lib/utils';
import { CheckCircle } from 'lucide-react';

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
  const { pendingCount, fetchPendingCount } = useSellerOrderStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

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

  const navLinks = user?.role === 'SELLER'
    ? [
        { to: '/marketplace', label: 'Marketplace', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
        { to: '/seller/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/seller/products', label: 'Products', icon: Package },
        { to: '/seller/orders', label: 'Orders', icon: ShoppingBag, badge: pendingCount },
        { to: '/seller/settings', label: 'Store Settings', icon: Settings },
      ]
    : user?.role === 'BUYER'
    ? [
        { to: '/marketplace', label: 'Marketplace', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
        { to: '/orders', label: 'My Orders', icon: ShoppingBag },
        { to: '/favorites', label: 'Favorites', icon: Heart },
        { to: '/addresses', label: 'Saved Addresses', icon: MapPin },
        { to: '/refunds', label: 'Refunds', icon: RotateCcw },
      ]
    : user?.role === 'ADMIN'
    ? [
        { to: '/admin', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/admin/users', label: 'Users', icon: Users },
        { to: '/admin/disputes', label: 'Disputes', icon: AlertTriangle },
        { to: '/marketplace', label: 'Marketplace', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
      ]
    : [
        { to: '/marketplace', label: 'Marketplace', icon: Home },
        { to: '/stores', label: 'Stores', icon: Store },
      ];

  return (
    <>
    <LogoutOverlay visible={loggingOut} />
    <header className="sticky top-0 z-50 w-full border-b border-rosewood-100 bg-white/98 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 select-none">
          <RpLogo className="h-9 w-9" />
          <div className="flex flex-col leading-tight">
            <span className="font-bold text-lg text-wood-700 tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Rosewood
            </span>
            <span className="text-[10px] font-semibold tracking-[0.2em] text-leaf-600 uppercase -mt-1">
              RP Market
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          {navLinks.map(({ to, label, badge }) => (
            <Link key={to} to={to} className="relative text-muted-foreground hover:text-foreground transition-colors">
              {label}
              {badge > 0 && (
                <span className="absolute -top-2 -right-4 h-4 w-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {badge > 9 ? '9+' : badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-1">
          {user ? (
            <>
              {user.role === 'BUYER' && (
                <Link to="/cart">
                  <Button variant="ghost" size="icon" className="relative">
                    <ShoppingCart className="h-5 w-5" />
                    {itemCount > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rosewood-500 text-white text-xs flex items-center justify-center">
                        {itemCount > 9 ? '9+' : itemCount}
                      </span>
                    )}
                  </Button>
                </Link>
              )}
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rosewood-500 text-white text-xs flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Button>
              </Link>

              {/* Desktop avatar dropdown */}
              <div className="relative group hidden md:block">
                <Button variant="ghost" size="icon" className="rounded-full">
                  <div className="h-8 w-8 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center text-sm font-semibold">
                    {getInitials(user.fullName)}
                  </div>
                </Button>
                <div className="absolute right-0 mt-1 w-48 rounded-md border bg-white shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium truncate">{user.fullName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                  </div>
                  <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-muted">
                    <User className="h-4 w-4" /> Profile
                  </Link>
                  <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </div>
              </div>

              {/* Mobile hamburger */}
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          ) : (
            <>
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login"><Button variant="ghost" size="sm">Login</Button></Link>
                <Link to="/register"><Button size="sm" className="bg-rosewood-600 hover:bg-rosewood-700">Register</Button></Link>
              </div>
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
                {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu drawer */}
      {menuOpen && (
        <div className="md:hidden border-t bg-white shadow-lg">
          <nav className="flex flex-col px-4 py-3 gap-1">
            {navLinks.map(({ to, label, icon: Icon, badge }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center justify-between py-3 px-3 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  {label}
                </span>
                {badge > 0 && (
                  <span className="h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </Link>
            ))}

            <div className="border-t mt-2 pt-2 space-y-1">
              {user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <div className="h-8 w-8 rounded-full bg-rosewood-100 text-rosewood-700 flex items-center justify-center text-sm font-semibold flex-shrink-0">
                      {getInitials(user.fullName)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user.role.toLowerCase()}</p>
                    </div>
                  </div>
                  <Link to="/profile" className="flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    <User className="h-4 w-4 text-muted-foreground" /> Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="flex items-center gap-3 py-3 px-3 rounded-lg text-sm font-medium hover:bg-muted transition-colors">
                    Login
                  </Link>
                  <Link to="/register" className="flex items-center justify-center py-3 px-3 rounded-lg text-sm font-medium bg-rosewood-600 text-white hover:bg-rosewood-700 transition-colors">
                    Register
                  </Link>
                </>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
    </>
  );
}




import { Link, useLocation } from 'react-router-dom';
import { Home, ShoppingCart, ShoppingBag, LayoutDashboard, Package, User, Store, Users } from 'lucide-react';
import useAuthStore from '../../store/authStore';
import useCartStore from '../../store/cartStore';
import useSellerOrderStore from '../../store/sellerOrderStore';

export default function BottomNav() {
  const { user } = useAuthStore();
  const { cart } = useCartStore();
  const { pendingCount } = useSellerOrderStore();
  const location = useLocation();

  const itemCount = cart?.itemCount ?? 0;
  const path = location.pathname;

  const isActive = (to) => path === to || path.startsWith(to + '/');

  if (!user) {
    // Guest: minimal bottom nav
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex">
          {[
            { to: '/marketplace', icon: Home, label: 'Shop' },
            { to: '/stores', icon: Store, label: 'Stores' },
            { to: '/login', icon: User, label: 'Login' },
          ].map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium transition-colors ${isActive(to) ? 'text-rosewood-600' : 'text-gray-400'}`}>
              <Icon className={`h-5 w-5 ${isActive(to) ? 'text-rosewood-600' : 'text-gray-400'}`} strokeWidth={isActive(to) ? 2.5 : 1.8} />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  if (user.role === 'BUYER') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex">
          <Link to="/marketplace" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/marketplace') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Home className={`h-5 w-5`} strokeWidth={isActive('/marketplace') ? 2.5 : 1.8} />
            Home
          </Link>
          <Link to="/stores" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/stores') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Store className="h-5 w-5" strokeWidth={isActive('/stores') ? 2.5 : 1.8} />
            Stores
          </Link>
          <Link to="/cart" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium relative ${isActive('/cart') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <div className="relative">
              <ShoppingCart className="h-5 w-5" strokeWidth={isActive('/cart') ? 2.5 : 1.8} />
              {itemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rosewood-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </div>
            Cart
          </Link>
          <Link to="/orders" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/orders') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <ShoppingBag className="h-5 w-5" strokeWidth={isActive('/orders') ? 2.5 : 1.8} />
            Orders
          </Link>
          <Link to="/profile" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/profile') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <User className="h-5 w-5" strokeWidth={isActive('/profile') ? 2.5 : 1.8} />
            Me
          </Link>
        </div>
      </nav>
    );
  }

  if (user.role === 'SELLER') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex">
          <Link to="/seller/dashboard" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/seller/dashboard') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <LayoutDashboard className="h-5 w-5" strokeWidth={isActive('/seller/dashboard') ? 2.5 : 1.8} />
            Dashboard
          </Link>
          <Link to="/marketplace" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/marketplace') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Home className="h-5 w-5" strokeWidth={isActive('/marketplace') ? 2.5 : 1.8} />
            Shop
          </Link>
          <Link to="/seller/orders" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium relative ${isActive('/seller/orders') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <div className="relative">
              <ShoppingBag className="h-5 w-5" strokeWidth={isActive('/seller/orders') ? 2.5 : 1.8} />
              {pendingCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-blue-500 text-white text-[9px] flex items-center justify-center font-bold leading-none">
                  {pendingCount > 9 ? '9+' : pendingCount}
                </span>
              )}
            </div>
            Orders
          </Link>
          <Link to="/seller/products" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/seller/products') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Package className="h-5 w-5" strokeWidth={isActive('/seller/products') ? 2.5 : 1.8} />
            Products
          </Link>
          <Link to="/profile" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/profile') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <User className="h-5 w-5" strokeWidth={isActive('/profile') ? 2.5 : 1.8} />
            Me
          </Link>
        </div>
      </nav>
    );
  }

  if (user.role === 'ADMIN') {
    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100 shadow-lg safe-area-pb">
        <div className="flex">
          <Link to="/admin" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/admin') && path === '/admin' ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <LayoutDashboard className="h-5 w-5" strokeWidth={isActive('/admin') && path === '/admin' ? 2.5 : 1.8} />
            Dashboard
          </Link>
          <Link to="/marketplace" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/marketplace') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Home className="h-5 w-5" strokeWidth={isActive('/marketplace') ? 2.5 : 1.8} />
            Shop
          </Link>
          <Link to="/admin/users" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/admin/users') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Users className="h-5 w-5" strokeWidth={isActive('/admin/users') ? 2.5 : 1.8} />
            Users
          </Link>
          <Link to="/stores" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/stores') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <Store className="h-5 w-5" strokeWidth={isActive('/stores') ? 2.5 : 1.8} />
            Stores
          </Link>
          <Link to="/profile" className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-medium ${isActive('/profile') ? 'text-rosewood-600' : 'text-gray-400'}`}>
            <User className="h-5 w-5" strokeWidth={isActive('/profile') ? 2.5 : 1.8} />
            Me
          </Link>
        </div>
      </nav>
    );
  }

  return null;
}

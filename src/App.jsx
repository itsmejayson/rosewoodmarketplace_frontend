import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import MainLayout from './components/layout/MainLayout';
import useAuthStore from './store/authStore';
import useCartStore from './store/cartStore';
import useNotificationStore from './store/notificationStore';
import useAppConfigStore from './store/appConfigStore';
import safeStorage from './lib/safeStorage';
import ServerStartingPage from './pages/ServerStartingPage';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import MarketplacePage from './pages/marketplace/MarketplacePage';
import ProductDetailPage from './pages/marketplace/ProductDetailPage';
import CartPage from './pages/buyer/CartPage';
import CheckoutPage from './pages/buyer/CheckoutPage';
import OrdersPage from './pages/buyer/OrdersPage';
import OrderDetailPage from './pages/buyer/OrderDetailPage';
import FavoritesPage from './pages/buyer/FavoritesPage';
import SavedAddressesPage from './pages/buyer/SavedAddressesPage';
import RefundsPage from './pages/buyer/RefundsPage';
import SellerDashboardPage from './pages/seller/SellerDashboardPage';
import StoreSettingsPage from './pages/seller/StoreSettingsPage';
import SellerProductsPage from './pages/seller/SellerProductsPage';
import ProductFormPage from './pages/seller/ProductFormPage';
import SellerOrdersPage from './pages/seller/SellerOrdersPage';
import SellerOrderDetailPage from './pages/seller/SellerOrderDetailPage';
import SellerRefundsPage from './pages/seller/SellerRefundsPage';
import SellerReviewsPage from './pages/seller/SellerReviewsPage';
import SellerTransactionsPage from './pages/seller/SellerTransactionsPage';
import TransactionsPage from './pages/buyer/TransactionsPage';
import NotificationsPage from './pages/NotificationsPage';
import ProfilePage from './pages/ProfilePage';
import StoresPage from './pages/StoresPage';
import StorePage from './pages/StorePage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminUserDetailPage from './pages/admin/AdminUserDetailPage';
import AdminOnlinePage from './pages/admin/AdminOnlinePage';
import AdminTransactionsPage from './pages/admin/AdminTransactionsPage';
import AdminPendingSellersPage from './pages/admin/AdminPendingSellersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminStoreManagePage from './pages/admin/AdminStoreManagePage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminFaqPage from './pages/admin/AdminFaqPage';
import ReportIssuePage from './pages/ReportIssuePage';
import PendingApprovalPage from './pages/PendingApprovalPage';
import FAQPage from './pages/FAQPage';

function PrivateRoute({ children, roles }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  // Unapproved sellers can only see the pending page
  if (user.role === 'SELLER' && !user.isApproved) return <Navigate to="/pending-approval" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function PublicOnlyRoute({ children }) {
  const { user } = useAuthStore();
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user, fetchMe } = useAuthStore();
  const { fetchCart } = useCartStore();
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const fetchAppConfig = useAppConfigStore((s) => s.fetch);
  const appName = useAppConfigStore((s) => s.appName);
  const [serverStatus, setServerStatus] = useState('checking'); // 'checking' | 'online'

  const handleServerReady = useCallback(() => {
    setServerStatus('online');
    fetchAppConfig();
  }, [fetchAppConfig]);

  useEffect(() => {
    // Quick initial health check — if it fails, ServerStartingPage takes over polling
    fetch('/health', { signal: AbortSignal.timeout(4000) })
      .then((r) => { if (r.ok) handleServerReady(); else setServerStatus('starting'); })
      .catch(() => setServerStatus('starting'));
  }, []);

  // Keep browser tab title in sync with app name
  useEffect(() => {
    document.title = `${appName} | Marketplace`;
  }, [appName]);

  useEffect(() => {
    const token = safeStorage.getItem('accessToken');
    if (token && !user) fetchMe();
  }, []);

  useEffect(() => {
    if (user) {
      if (user.role === 'BUYER') fetchCart();
      fetchNotifications();
    }
  }, [user?.id]);

  if (serverStatus !== 'online') {
    return <ServerStartingPage onReady={handleServerReady} />;
  }

  return (
    <Routes>
      <Route element={<MainLayout />}>
        {/* Public */}
        <Route path="/" element={<HomePage />} />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/stores" element={<StoresPage />} />
        <Route path="/faq" element={<FAQPage />} />
        <Route path="/store/:sellerId" element={<StorePage />} />

        {/* Auth */}
        <Route path="/login" element={<PublicOnlyRoute><LoginPage /></PublicOnlyRoute>} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/pending-approval" element={<PendingApprovalPage />} />

        {/* Buyer */}
        <Route path="/cart" element={<PrivateRoute roles={['BUYER']}><CartPage /></PrivateRoute>} />
        <Route path="/checkout" element={<PrivateRoute roles={['BUYER']}><CheckoutPage /></PrivateRoute>} />
        <Route path="/orders" element={<PrivateRoute roles={['BUYER']}><OrdersPage /></PrivateRoute>} />
        <Route path="/orders/:id" element={<PrivateRoute roles={['BUYER', 'ADMIN']}><OrderDetailPage /></PrivateRoute>} />
        <Route path="/favorites" element={<PrivateRoute roles={['BUYER']}><FavoritesPage /></PrivateRoute>} />
        <Route path="/addresses" element={<PrivateRoute roles={['BUYER']}><SavedAddressesPage /></PrivateRoute>} />
        <Route path="/refunds" element={<PrivateRoute roles={['BUYER']}><RefundsPage /></PrivateRoute>} />
        <Route path="/transactions" element={<PrivateRoute roles={['BUYER']}><TransactionsPage /></PrivateRoute>} />

        {/* Seller */}
        <Route path="/seller/dashboard" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerDashboardPage /></PrivateRoute>} />
        <Route path="/seller/settings" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><StoreSettingsPage /></PrivateRoute>} />
        <Route path="/seller/products" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerProductsPage /></PrivateRoute>} />
        <Route path="/seller/products/new" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><ProductFormPage /></PrivateRoute>} />
        <Route path="/seller/products/:id/edit" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><ProductFormPage /></PrivateRoute>} />
        <Route path="/seller/orders" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerOrdersPage /></PrivateRoute>} />
        <Route path="/seller/orders/:id" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerOrderDetailPage /></PrivateRoute>} />
        <Route path="/seller/refunds" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerRefundsPage /></PrivateRoute>} />
        <Route path="/seller/reviews" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerReviewsPage /></PrivateRoute>} />
        <Route path="/seller/transactions" element={<PrivateRoute roles={['SELLER', 'ADMIN']}><SellerTransactionsPage /></PrivateRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<PrivateRoute roles={['ADMIN']}><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/users" element={<PrivateRoute roles={['ADMIN']}><AdminUsersPage /></PrivateRoute>} />
        <Route path="/admin/users/:id" element={<PrivateRoute roles={['ADMIN']}><AdminUserDetailPage /></PrivateRoute>} />
        <Route path="/admin/online" element={<PrivateRoute roles={['ADMIN']}><AdminOnlinePage /></PrivateRoute>} />
        <Route path="/admin/transactions" element={<PrivateRoute roles={['ADMIN']}><AdminTransactionsPage /></PrivateRoute>} />
        <Route path="/admin/pending-sellers" element={<PrivateRoute roles={['ADMIN']}><AdminPendingSellersPage /></PrivateRoute>} />
        <Route path="/admin/settings" element={<PrivateRoute roles={['ADMIN']}><AdminSettingsPage /></PrivateRoute>} />
        <Route path="/admin/stores" element={<PrivateRoute roles={['ADMIN']}><AdminStoreManagePage /></PrivateRoute>} />
        <Route path="/admin/reports" element={<PrivateRoute roles={['ADMIN']}><AdminReportsPage /></PrivateRoute>} />
        <Route path="/admin/categories" element={<PrivateRoute roles={['ADMIN']}><AdminCategoriesPage /></PrivateRoute>} />
        <Route path="/admin/faqs" element={<PrivateRoute roles={['ADMIN']}><AdminFaqPage /></PrivateRoute>} />
        {/* Shared */}
        <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
        <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
        <Route path="/report-issue" element={<PrivateRoute><ReportIssuePage /></PrivateRoute>} />

        <Route path="*" element={
          <div className="container mx-auto px-4 py-20 text-center">
            <h1 className="text-4xl font-bold mb-2">404</h1>
            <p className="text-muted-foreground">Page not found.</p>
          </div>
        } />
      </Route>
    </Routes>
  );
}

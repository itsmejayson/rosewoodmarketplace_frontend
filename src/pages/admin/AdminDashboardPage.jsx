import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { Users, Store, ShoppingBag, Package, TrendingUp, Loader2, Wifi, CreditCard, Clock, Settings, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { userAPI } from '../../api';
import { formatCurrency, formatDate, ORDER_STATUS_COLORS, ORDER_STATUS_LABELS } from '../../lib/utils';

const StatCard = ({ icon: Icon, label, value, color, bg }) => (
  <Card className="flex-1">
    <CardContent className="p-5">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${bg} mb-3`}>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className="text-2xl font-bold leading-tight">{value}</p>
      <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
    </CardContent>
  </Card>
);

const QuickCard = ({ icon: Icon, iconColor, iconBg, title, subtitle, to, badge }) => (
  <Link to={to} className="block h-full">
    <Card className="h-full hover:shadow-md hover:border-rosewood-200 transition-all cursor-pointer">
      <CardContent className="p-5 flex flex-col items-center text-center gap-3 h-full justify-center">
        <div className={`relative inline-flex h-12 w-12 items-center justify-center rounded-xl ${iconBg}`}>
          <Icon className={`h-6 w-6 ${iconColor}`} />
          {badge > 0 && (
            <span className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold border-2 border-white">
              {badge > 9 ? '9+' : badge}
            </span>
          )}
        </div>
        <div>
          <p className="font-semibold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  </Link>
);

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const socket = useSocket();

  useEffect(() => {
    Promise.all([
      userAPI.adminStats().then(({ data }) => setStats(data.data)),
      userAPI.pendingSellers().then(({ data }) => setPendingCount(data.data.length)),
    ]).finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!socket) return;
    const handler = () => setPendingCount((n) => n + 1);
    socket.on('newPendingSeller', handler);
    return () => socket.off('newPendingSeller', handler);
  }, [socket]);

  if (isLoading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
  if (!stats) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and quick access</p>
      </div>

      {/* Stat cards — 3 cols on md, 6 on lg */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard icon={Users}     label="Total Users"  value={stats.totalUsers}             color="text-blue-600"     bg="bg-blue-50" />
          <StatCard icon={Store}     label="Sellers"      value={stats.totalSellers}           color="text-rosewood-600" bg="bg-rosewood-50" />
          <StatCard icon={Users}     label="Buyers"       value={stats.totalBuyers}            color="text-green-600"    bg="bg-green-50" />
          <StatCard icon={Package}   label="Products"     value={stats.totalProducts}          color="text-purple-600"   bg="bg-purple-50" />
          <StatCard icon={ShoppingBag} label="Orders"     value={stats.totalOrders}            color="text-amber-600"    bg="bg-amber-50" />
          <StatCard icon={TrendingUp} label="Revenue"     value={formatCurrency(stats.revenue)} color="text-emerald-600" bg="bg-emerald-50" />
        </div>
      </div>

      {/* Quick links — always 2 cols on sm, 3 on md, 5 on xl */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Quick Access</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <QuickCard
            to="/admin/users?role=SELLER"
            icon={Store}
            iconColor="text-rosewood-600"
            iconBg="bg-rosewood-50"
            title="Manage Sellers"
            subtitle={`${stats.totalSellers} sellers`}
          />
          <QuickCard
            to="/admin/users?role=BUYER"
            icon={Users}
            iconColor="text-green-600"
            iconBg="bg-green-50"
            title="Manage Buyers"
            subtitle={`${stats.totalBuyers} buyers`}
          />
          <QuickCard
            to="/admin/online"
            icon={Wifi}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            title="Online Users"
            subtitle="See who's active"
          />
          <QuickCard
            to="/admin/transactions"
            icon={CreditCard}
            iconColor="text-blue-600"
            iconBg="bg-blue-50"
            title="Transactions"
            subtitle="All payments"
          />
          <QuickCard
            to="/admin/pending-sellers"
            icon={Clock}
            iconColor="text-amber-600"
            iconBg="bg-amber-50"
            title="Pending Sellers"
            subtitle={pendingCount > 0 ? `${pendingCount} awaiting` : 'No pending'}
            badge={pendingCount}
          />
          <QuickCard
            to="/admin/stores"
            icon={Store}
            iconColor="text-purple-600"
            iconBg="bg-purple-50"
            title="Store Management"
            subtitle="Products & cleanup"
          />
          <QuickCard
            to="/admin/settings"
            icon={Settings}
            iconColor="text-gray-600"
            iconBg="bg-gray-100"
            title="System Settings"
            subtitle="AI assistant & more"
          />
          <QuickCard
            to="/admin/reports"
            icon={Flag}
            iconColor="text-red-600"
            iconBg="bg-red-50"
            title="Issue Reports"
            subtitle="User-reported bugs"
          />
        </div>
      </div>

      {/* Recent orders */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Orders</h2>
        <Card>
          <CardContent className="p-0">
            {stats.recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">No orders yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Order</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden sm:table-cell">Buyer</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Amount</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">Status</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide hidden md:table-cell">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stats.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/40 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-rosewood-700">#{order.orderNumber}</td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden sm:table-cell">{order.buyer?.fullName}</td>
                      <td className="px-5 py-3.5 text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`inline-block text-xs px-2.5 py-0.5 rounded-full font-medium ${ORDER_STATUS_COLORS[order.status] || 'bg-amber-100 text-amber-800'}`}>
                          {ORDER_STATUS_LABELS[order.status] || order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right text-muted-foreground text-xs hidden md:table-cell">{formatDate(order.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

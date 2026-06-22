import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, ShoppingBag, Clock, CheckCircle, XCircle, TrendingUp, Package, Loader2, RefreshCw, BarChart3, Settings, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { productAPI, transactionAPI } from '../../api';
import { formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import { useSocket } from '../../hooks/useSocket';
import useNotificationStore from '../../store/notificationStore';

export default function SellerDashboardPage() {
  const [stats, setStats] = useState(null);
  const [report, setReport] = useState(null);
  const [dailyReport, setDailyReport] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const { fetch: fetchNotifs } = useNotificationStore();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);
    try {
      const [statsRes, reportRes, dailyRes] = await Promise.all([
        productAPI.stats(),
        transactionAPI.salesReport({ period: 'monthly' }),
        transactionAPI.salesReport({ period: '30d' }),
      ]);
      setStats(statsRes.data.data);
      setReport(reportRes.data.data);
      setDailyReport(dailyRes.data.data);
      setLastUpdated(new Date());
    } catch {
      if (!silent) toast({ title: 'Failed to load dashboard', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
    fetchNotifs();
  }, []);

  // Re-fetch on socket events
  const socket = useSocket();
  useEffect(() => {
    if (!socket) return;
    const REFRESH_EVENTS = ['newOrder', 'receiptSubmitted', 'paymentApproved', 'paymentRejected', 'orderCancelled'];
    let timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fetchData(true), 800);
    };
    REFRESH_EVENTS.forEach((ev) => socket.on(ev, handler));
    return () => {
      clearTimeout(timeout);
      REFRESH_EVENTS.forEach((ev) => socket.off(ev, handler));
    };
  }, [socket, fetchData]);

  // Polling fallback every 30s in case socket events are missed
  useEffect(() => {
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-500" /></div>;

  const statCards = [
    { title: 'Total Revenue', value: formatCurrency(stats?.totalRevenue || 0), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Total Orders', value: stats?.totalOrders || 0, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Pending Orders', value: stats?.pendingOrders || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { title: 'Completed Orders', value: stats?.completedOrders || 0, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { title: 'Cancelled Orders', value: stats?.cancelledOrders || 0, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
    { title: 'Monthly Revenue', value: formatCurrency(report?.totalRevenue || 0), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // ---- This-month summary (defensive) ----
  const monthRevenue = report?.summary?.totalRevenue ?? report?.totalRevenue ?? 0;
  const monthOrders = report?.summary?.orderCount ?? report?.orderCount ?? 0;
  const monthAvg = report?.summary?.avgOrderValue ?? report?.avgOrderValue ?? 0;
  const monthCards = [
    { title: 'Total Revenue (This Month)', value: formatCurrency(monthRevenue), icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50' },
    { title: 'Orders (This Month)', value: monthOrders, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { title: 'Average Order Value', value: formatCurrency(monthAvg), icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  // ---- Build per-day revenue for last 30 days ----
  const dayBuckets = [];
  const bucketIndex = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    bucketIndex[key] = dayBuckets.length;
    dayBuckets.push({ date: d, key, revenue: 0 });
  }
  const dailyTxns = dailyReport?.transactions ?? [];
  dailyTxns.forEach((t) => {
    if (!t?.createdAt) return;
    const td = new Date(t.createdAt);
    if (isNaN(td)) return;
    td.setHours(0, 0, 0, 0);
    const key = td.toISOString().slice(0, 10);
    const idx = bucketIndex[key];
    if (idx !== undefined) {
      dayBuckets[idx].revenue += parseFloat(t.amount || t.totalAmount || 0) || 0;
    }
  });
  const maxRevenue = dayBuckets.reduce((m, b) => Math.max(m, b.revenue), 0);
  const totalDaily = dailyReport?.summary?.totalRevenue ?? dayBuckets.reduce((s, b) => s + b.revenue, 0);

  // Chart geometry
  const CHART_W = 600;
  const CHART_H = 200;
  const BASELINE = 190;
  const TOP_PAD = 10;
  const slot = CHART_W / 30;
  const gap = slot * 0.2;
  const barW = slot - gap;
  const usableH = BASELINE - TOP_PAD;

  // ---- Top products: top 5 by salesCount desc ----
  const topProducts = [...(stats?.topProducts ?? [])]
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0))
    .slice(0, 5);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Seller Dashboard</h1>
          <p className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
            Monitor your sales and manage your business
            {lastUpdated && (
              <span className="text-xs text-muted-foreground/70">
                · updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            {isRefreshing && <Loader2 className="h-3 w-3 animate-spin" />}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => fetchData(true)} disabled={isRefreshing} title="Refresh">
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Link to="/seller/products/new">
            <Button className="bg-rosewood-600 hover:bg-rosewood-700 text-sm">+ New Product</Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-8">
        {statCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{title}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* This Month Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {monthCards.map(({ title, value, icon: Icon, color, bg }) => (
          <Card key={title}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{title}</p>
                  <p className="text-xl font-bold">{value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Bar Chart (Last 30 Days) */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-rosewood-600" />
            Revenue (Last 30 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <svg viewBox="0 0 600 200" className="w-full min-w-[400px] h-auto" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Daily revenue for the last 30 days">
            <g className="text-rosewood-500" fill="currentColor">
              {dayBuckets.map((b, i) => {
                const h = maxRevenue > 0 ? (b.revenue / maxRevenue) * usableH : 0;
                const x = i * slot + gap / 2;
                const y = BASELINE - h;
                return (
                  <rect key={b.key} x={x} y={y} width={barW} height={h}>
                    <title>{`${b.key}: ${formatCurrency(b.revenue)}`}</title>
                  </rect>
                );
              })}
            </g>
            <line x1="0" y1={BASELINE} x2={CHART_W} y2={BASELINE} stroke="#E5E7EB" strokeWidth="1" />
          </svg>
          </div>
          <div className="mt-3 flex items-center justify-between flex-wrap gap-1">
            <p className="text-sm font-medium">
              Total: <span className="text-rosewood-600 font-bold">{formatCurrency(totalDaily)}</span>
            </p>
            <p className="text-xs text-muted-foreground">Daily revenue over the past 30 days</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Top Selling Products</CardTitle>
            <Link to="/seller/products"><Button variant="ghost" size="sm">View all</Button></Link>
          </CardHeader>
          <CardContent>
            {topProducts.length > 0 ? (
              <div className="space-y-3">
                {topProducts.map((p, idx) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="text-sm font-bold text-muted-foreground w-5">{idx + 1}</span>
                    <div className="w-8 h-8 rounded border bg-muted flex-shrink-0 overflow-hidden">
                      <img src={p.images?.[0]?.url || '/placeholder-product.jpg'} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-1">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.salesCount || 0} sold</p>
                    </div>
                    <span className="text-sm font-bold text-rosewood-600">
                      {formatCurrency((p.salesCount || 0) * parseFloat(p.price || 0))}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No sales data yet</p>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader><CardTitle className="text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {[
              { label: 'Manage Products', href: '/seller/products', icon: Package },
              { label: 'View Orders', href: '/seller/orders', icon: ShoppingBag },
              { label: 'Transactions', href: '/seller/transactions', icon: DollarSign },
              { label: 'Add Product', href: '/seller/products/new', icon: TrendingUp },
              { label: 'Store Settings', href: '/seller/settings', icon: Settings },
              { label: 'Reviews', href: '/seller/reviews', icon: Star },
            ].map(({ label, href, icon: Icon }) => (
              <Link key={href} to={href}>
                <Card className="hover:border-rosewood-300 transition-colors cursor-pointer h-full">
                  <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                    <Icon className="h-6 w-6 text-rosewood-600" />
                    <p className="text-sm font-medium">{label}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

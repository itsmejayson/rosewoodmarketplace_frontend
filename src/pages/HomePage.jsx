import { Link } from 'react-router-dom';
import { useState } from 'react';
import { Store, ShoppingCart, BarChart2, Shield, Zap, Star, Salad, Wrench, Users, Wifi, CreditCard, UserCog, UserPlus } from 'lucide-react';
import useAuthStore from '../store/authStore';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import AdminCreateUserModal from './admin/AdminCreateUserModal';

const ADMIN_TOOLS = [
  { to: '/admin', icon: BarChart2, label: 'Dashboard', desc: 'System overview — orders, revenue, and key metrics.', color: 'bg-rosewood-50 text-rosewood-600' },
  { to: '/admin/users', icon: Users, label: 'Manage Users', desc: 'View, edit, activate or deactivate buyers and sellers.', color: 'bg-blue-50 text-blue-600' },
  { to: '/admin/online', icon: Wifi, label: 'Online Users', desc: 'See who is currently active on the platform in real time.', color: 'bg-emerald-50 text-emerald-600' },
  { to: '/admin/transactions', icon: CreditCard, label: 'Transactions', desc: 'Monitor all payments across every order on the platform.', color: 'bg-purple-50 text-purple-600' },
  { to: '/admin/users?role=SELLER', icon: Store, label: 'Sellers', desc: 'Filter and manage seller accounts and their stores.', color: 'bg-amber-50 text-amber-600' },
  { to: '/admin/users?role=BUYER', icon: UserCog, label: 'Buyers', desc: 'Filter and manage buyer accounts across the platform.', color: 'bg-green-50 text-green-600' },
];

export default function HomePage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const isSeller = user?.role === 'SELLER';
  const [showCreateUser, setShowCreateUser] = useState(false);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-rosewood-600 to-rosewood-800 text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Store className="h-8 w-8" />
            </div>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4">RP Market</h1>
          <p className="text-xl text-rosewood-100 mb-8 max-w-2xl mx-auto">
            Your trusted marketplace for fresh food products and quality construction materials.
            Buy and sell with confidence.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            {isAdmin ? (
              <>
                <Link to="/admin">
                  <Button size="lg" className="bg-white text-rosewood-700 hover:bg-rosewood-50 font-semibold">
                    <BarChart2 className="h-5 w-5 mr-2" /> Go to Dashboard
                  </Button>
                </Link>
                <Link to="/admin/users">
                  <Button size="lg" className="bg-rosewood-700 text-white hover:bg-rosewood-800 border border-white/40 font-semibold">
                    <Users className="h-5 w-5 mr-2" /> Manage Users
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/marketplace">
                  <Button size="lg" className="bg-white text-rosewood-700 hover:bg-rosewood-50 font-semibold">
                    <ShoppingCart className="h-5 w-5 mr-2" /> Browse Products
                  </Button>
                </Link>
                {!user && (
                  <Link to="/register">
                    <Button size="lg" className="bg-rosewood-700 text-white hover:bg-rosewood-800 border border-white/40 font-semibold">
                      Start Selling Today
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">Why RP Market?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Shield,
                title: 'Secure Payments',
                desc: 'Pay with confidence using Stripe\'s industry-leading payment security.',
                color: 'text-blue-600 bg-blue-50',
              },
              {
                icon: Zap,
                title: 'Real-Time Updates',
                desc: 'Get instant notifications about your orders and deliveries via WebSockets.',
                color: 'text-yellow-600 bg-yellow-50',
              },
              {
                icon: Star,
                title: 'Quality Products',
                desc: 'Browse fresh food products and quality materials from verified sellers.',
                color: 'text-rosewood-600 bg-rosewood-50',
              },
            ].map(({ icon: Icon, title, desc, color }) => (
              <Card key={title} className="text-center">
                <CardContent className="p-6">
                  <div className={`h-12 w-12 rounded-xl ${color} flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-10">What We Offer</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <Link to="/marketplace?productType=FOOD">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-32 bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
                    <Salad className="h-14 w-14 text-white" strokeWidth={1.5} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg group-hover:text-rosewood-600 transition-colors">Food Products</h3>
                    <p className="text-sm text-muted-foreground">Fresh produce, dairy, bakery goods & more</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
            <Link to="/marketplace?productType=MATERIAL">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer group overflow-hidden">
                <CardContent className="p-0">
                  <div className={'h-32 bg-gradient-to-br from-orange-400 to-amber-600 flex items-center justify-center'}>
                    <Wrench className={'h-14 w-14 text-white'} strokeWidth={1.5} />
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg group-hover:text-rosewood-600 transition-colors">Materials</h3>
                    <p className="text-sm text-muted-foreground">Building materials, hardware, packaging & more</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA / Admin Tools */}
      <section className="py-16 bg-muted/40">
        <div className="container mx-auto px-4">
          {isAdmin ? (
            <div className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <Shield className="h-12 w-12 text-rosewood-600 mx-auto mb-4" />
                <h2 className="text-3xl font-bold mb-2">Admin Control Panel</h2>
                <p className="text-muted-foreground">Quick access to all platform management tools.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {ADMIN_TOOLS.map(({ to, icon: Icon, label, desc, color }) => (
                  <Link key={to} to={to}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
                      <CardContent className="p-5 flex items-start gap-4">
                        <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold group-hover:text-rosewood-600 transition-colors">{label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
                {/* Create User — opens modal directly */}
                <button type="button" onClick={() => setShowCreateUser(true)} className="text-left w-full">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group border-dashed border-2">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-gray-50 text-gray-500 group-hover:scale-110 transition-transform">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold group-hover:text-rosewood-600 transition-colors">Create User</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Add a new buyer, seller, or admin account directly.</p>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center max-w-2xl mx-auto">
              {isSeller ? (
                <>
                  <Users className="h-12 w-12 text-rosewood-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4">Invite a Buyer</h2>
                  <p className="text-muted-foreground mb-6">
                    Know someone who wants to shop at Rosewood Place? Have them create a buyer account and start ordering from your store.
                  </p>
                  <Link to="/register?role=BUYER">
                    <Button size="lg" className="bg-rosewood-600 hover:bg-rosewood-700">
                      Create Buyer Account
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <BarChart2 className="h-12 w-12 text-rosewood-600 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4">Start Selling Today</h2>
                  <p className="text-muted-foreground mb-6">
                    Reach thousands of buyers. Manage your products, track orders, and grow your business with our powerful seller dashboard.
                  </p>
                  <Link to="/register?role=SELLER">
                    <Button size="lg" className="bg-rosewood-600 hover:bg-rosewood-700">
                      Create Seller Account
                    </Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </section>
    {showCreateUser && (
      <AdminCreateUserModal
        onClose={() => setShowCreateUser(false)}
        onCreated={() => setShowCreateUser(false)}
      />
    )}
    </>
  );
}


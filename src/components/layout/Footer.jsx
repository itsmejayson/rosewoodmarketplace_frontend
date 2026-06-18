import { Link } from 'react-router-dom';
import { Store } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Footer() {
  const { user } = useAuthStore();
  return (
    <footer className="border-t bg-muted/40 mt-auto">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-rosewood-600 mb-2">
              <Store className="h-5 w-5" />
              <span>RP Market</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              Your trusted marketplace for fresh food products and quality materials. Connecting buyers and sellers seamlessly.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Marketplace</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/marketplace" className="hover:text-foreground">Browse Products</Link></li>
              <li><Link to="/marketplace?productType=FOOD" className="hover:text-foreground">Food Products</Link></li>
              <li><Link to="/marketplace?productType=MATERIAL" className="hover:text-foreground">Materials</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {!user && <li><Link to="/login" className="hover:text-foreground">Login</Link></li>}
              {!user && <li><Link to="/register" className="hover:text-foreground">Register</Link></li>}
              {user && <li><Link to="/profile" className="hover:text-foreground">Profile</Link></li>}
              {user && <li><Link to="/notifications" className="hover:text-foreground">Notifications</Link></li>}
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-4 text-center text-xs text-muted-foreground">
          Â© {new Date().getFullYear()} RP Market. All rights reserved.
        </div>
      </div>
    </footer>
  );
}


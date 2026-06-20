import { useState, useEffect } from 'react';
import { Wifi, Store, ShoppingBag, Shield, RefreshCw, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { userAPI } from '../../api';
import { formatDate } from '../../lib/utils';
import { getSocket } from '../../hooks/useSocket';

const ROLE_ICON = { SELLER: Store, BUYER: ShoppingBag, ADMIN: Shield };
const ROLE_COLOR = {
  SELLER: 'bg-rosewood-100 text-rosewood-700',
  BUYER: 'bg-green-100 text-green-700',
  ADMIN: 'bg-purple-100 text-purple-700',
};

export default function AdminOnlinePage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchOnline = async () => {
    try {
      const { data } = await userAPI.onlineUsers();
      setUsers(data.data);
      setLastUpdated(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOnline();

    // Subscribe to live updates via socket
    const socket = getSocket();
    if (socket) {
      socket.on('onlineUsers', (list) => {
        setUsers(list);
        setLastUpdated(new Date());
      });
    }

    return () => {
      const s = getSocket();
      if (s) s.off('onlineUsers');
    };
  }, []);

  const byRole = (role) => users.filter((u) => u.role === role);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wifi className="h-6 w-6 text-green-500" />
            Online Users
          </h1>
          <p className="text-sm text-muted-foreground">
            {users.length} user{users.length !== 1 ? 's' : ''} currently online
            {lastUpdated && ` · updated ${lastUpdated.toLocaleTimeString()}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchOnline}>
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-3 flex-wrap">
        {['BUYER', 'SELLER', 'ADMIN'].map((role) => {
          const count = byRole(role).length;
          const Icon = ROLE_ICON[role];
          return (
            <div key={role} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${ROLE_COLOR[role]}`}>
              <Icon className="h-4 w-4" />
              {count} {role.charAt(0) + role.slice(1).toLowerCase()}{count !== 1 ? 's' : ''}
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4 space-y-2 animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-5 bg-muted rounded-full w-16" />
            </div>
          ))}
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Wifi className="h-12 w-12 mx-auto mb-3 opacity-20" />
          <p>No users online right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {users.map((u) => {
            const Icon = ROLE_ICON[u.role] || ShoppingBag;
            return (
              <Card key={u.id} className="border-green-200">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="relative">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${ROLE_COLOR[u.role]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{u.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLOR[u.role]}`}>
                          {u.role}
                        </span>
                      </div>
                      {u.connectedAt && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Since {new Date(u.connectedAt).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

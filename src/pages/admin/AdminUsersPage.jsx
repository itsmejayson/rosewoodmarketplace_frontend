import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, Plus, Loader2, Eye, ToggleLeft, ToggleRight, Store, ShoppingBag, CheckCircle, XCircle, Clock, UserX, Trash2, Users, Shield } from 'lucide-react';
import { Skeleton } from '../../components/ui/skeleton';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent } from '../../components/ui/card';
import { userAPI } from '../../api';
import { Badge } from '../../components/ui/badge';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import AdminCreateUserModal from './AdminCreateUserModal';

export default function AdminUsersPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const role = searchParams.get('role') || 'ALL';
  const isPendingTab = role === 'PENDING';
  const isInactiveTab = role === 'INACTIVE';
  const isDeletedTab = role === 'DELETED';

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [togglingId, setTogglingId] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [meta, setMeta] = useState({ total: 0, pages: 1 });
  const [page, setPage] = useState(1);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const params = isPendingTab
        ? { pending: 'true', search, page, limit: 10 }
        : isInactiveTab
        ? { status: 'inactive', search, page, limit: 10 }
        : isDeletedTab
        ? { status: 'deleted', search, page, limit: 10 }
        : { role: role === 'ALL' ? '' : role, search, page, limit: 10 };
      const { data } = await userAPI.listUsers(params);
      setUsers(data.data.users);
      setMeta({ total: data.data.total, pages: data.data.pages });
    } finally {
      setIsLoading(false);
    }
  };

  // Keep pending count badge on the tab fresh
  const fetchPendingCount = async () => {
    try {
      const { data } = await userAPI.pendingSellers();
      setPendingCount(data.data.length);
    } catch (_) {}
  };

  useEffect(() => { setPage(1); }, [role, search]);
  useEffect(() => { fetchUsers(); }, [role, search, page]);
  useEffect(() => { fetchPendingCount(); }, []);

  const handleToggle = async (user) => {
    setTogglingId(user.id);
    try {
      const { data } = await userAPI.toggleActive(user.id);
      toast({ title: data.message });
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: data.data.isActive } : u));
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleApprove = async (userId, approve) => {
    setActionId(userId);
    try {
      const { data } = await userAPI.approveSeller(userId, approve);
      toast({ title: data.message });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setPendingCount((n) => Math.max(0, n - 1));
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Action failed', variant: 'destructive' });
    } finally {
      setActionId(null);
    }
  };

  const ROLE_TABS = [
    { key: 'ALL',      label: 'All Users',        Icon: Users },
    { key: 'BUYER',    label: 'Buyers',            Icon: ShoppingBag },
    { key: 'SELLER',   label: 'Sellers',           Icon: Store },
    { key: 'ADMIN',    label: 'Admins',            Icon: Shield },
    { key: 'PENDING',  label: 'Pending Approval',  Icon: Clock },
    { key: 'INACTIVE', label: 'Inactive',          Icon: UserX },
    { key: 'DELETED',  label: 'Deleted',           Icon: Trash2 },
  ];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Users</h1>
          <p className="text-muted-foreground text-sm">{meta.total} total</p>
        </div>
        <Button className="bg-rosewood-600 hover:bg-rosewood-700" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add User
        </Button>
      </div>

      {/* Filter — dropdown on mobile, tabs on md+ */}
      <div className="mb-4">
        {/* Mobile dropdown */}
        <div className="block md:hidden">
          <select
            value={role}
            onChange={(e) => setSearchParams(e.target.value === 'ALL' ? {} : { role: e.target.value })}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {ROLE_TABS.map(({ key, label }) => (
              <option key={key} value={key}>
                {label}{key === 'PENDING' && pendingCount > 0 ? ` (${pendingCount})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Desktop tabs */}
        <div className="hidden md:flex gap-1 border-b overflow-x-auto">
        {ROLE_TABS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => setSearchParams(key === 'ALL' ? {} : { role: key })}
            className={`relative px-4 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              role === key ? 'border-rosewood-600 text-rosewood-600' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
            {key === 'PENDING' && pendingCount > 0 && (
              <span className="inline-flex items-center justify-center h-4 min-w-[1rem] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Search name, email, store..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <Card>
          <div className="divide-y">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-4 py-3">
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-56" />
                </div>
                <Skeleton className="h-5 w-16 rounded-full hidden sm:block" />
                <Skeleton className="h-5 w-20 rounded-full hidden md:block" />
                <Skeleton className="h-5 w-14 rounded-full" />
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-8 rounded" />
                  <Skeleton className="h-8 w-8 rounded" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">User</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Role</th>
                  <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Store / Info</th>
                  <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Joined</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground">No users found.</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium">{user.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {isDeletedTab
                          ? user.email.replace(/^deleted_\d+_/, '')
                          : user.email}
                      </p>
                      {isDeletedTab && (
                        <p className="text-[10px] text-muted-foreground/60 italic">deleted account</p>
                      )}
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${
                        user.role === 'SELLER' ? 'bg-rosewood-100 text-rosewood-700' :
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {user.role === 'SELLER' ? <Store className="h-3 w-3" /> : <ShoppingBag className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell text-muted-foreground text-xs">
                      {user.storeName || user.phone || '—'}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell text-muted-foreground text-xs">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      {isDeletedTab ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                          <Trash2 className="h-3 w-3" /> Deleted
                        </span>
                      ) : user.role === 'SELLER' && !user.isApproved ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          <Clock className="h-3 w-3" /> Pending
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {!isDeletedTab && (
                          <Link to={`/admin/users/${user.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        {isPendingTab ? (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50"
                              title="Approve"
                              disabled={actionId === user.id}
                              onClick={() => handleApprove(user.id, true)}
                            >
                              {actionId === user.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                              title="Reject"
                              disabled={actionId === user.id}
                              onClick={() => handleApprove(user.id, false)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </>
                        ) : isDeletedTab ? (
                          <span className="text-xs text-muted-foreground italic">No actions</span>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-8 w-8 p-0 ${user.isActive ? 'text-red-500 hover:text-red-600' : 'text-green-600 hover:text-green-700'}`}
                            onClick={() => handleToggle(user)}
                            disabled={togglingId === user.id}
                          >
                            {togglingId === user.id
                              ? <Loader2 className="h-4 w-4 animate-spin" />
                              : user.isActive ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />
                            }
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta.pages > 1 && (
            <div className="flex justify-center gap-2 p-4 border-t">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</Button>
              <span className="text-sm text-muted-foreground self-center">Page {page} of {meta.pages}</span>
              <Button variant="outline" size="sm" disabled={page === meta.pages} onClick={() => setPage(p => p + 1)}>Next</Button>
            </div>
          )}
        </Card>
      )}

      {showCreate && <AdminCreateUserModal onClose={() => setShowCreate(false)} onCreated={(u) => { setUsers(prev => [u, ...prev]); setShowCreate(false); }} />}
    </div>
  );
}

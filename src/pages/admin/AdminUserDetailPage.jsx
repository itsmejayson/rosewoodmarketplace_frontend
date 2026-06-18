import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Store, ShoppingBag, Package, Mail, Phone, MapPin, ToggleLeft, ToggleRight, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { userAPI } from '../../api';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import { getInitials } from '../../lib/utils';
import AdminEditUserModal from './AdminEditUserModal';

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    userAPI.getUser(id)
      .then(({ data }) => setUser(data.data))
      .catch(() => toast({ title: 'User not found', variant: 'destructive' }))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const { data } = await userAPI.toggleActive(id);
      setUser((prev) => ({ ...prev, isActive: data.data.isActive }));
      toast({ title: data.message });
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed', variant: 'destructive' });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await userAPI.deleteUser(id);
      toast({ title: 'User deleted successfully' });
      navigate('/admin/users');
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Delete failed', variant: 'destructive' });
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Link to="/admin/users" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to Users
      </Link>

      {/* Header card */}
      <Card>
        <CardContent className="p-6 flex flex-wrap items-center gap-5">
          <div className="h-20 w-20 rounded-full bg-rosewood-100 flex items-center justify-center text-rosewood-700 text-2xl font-bold flex-shrink-0 overflow-hidden">
            {user.profileImage
              ? <img src={user.profileImage} alt={user.fullName} className="w-full h-full object-cover" />
              : getInitials(user.fullName)
            }
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <p className="text-muted-foreground text-sm">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.role === 'SELLER' ? 'bg-rosewood-100 text-rosewood-700' :
                user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>{user.role}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(true)}>
              <Pencil className="h-4 w-4 mr-2" /> Edit
            </Button>
            <Button
              variant="outline"
              className={user.isActive ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-600 hover:bg-green-50'}
              onClick={handleToggle}
              disabled={isToggling}
            >
              {isToggling
                ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                : user.isActive
                  ? <ToggleRight className="h-4 w-4 mr-2" />
                  : <ToggleLeft className="h-4 w-4 mr-2" />
              }
              {user.isActive ? 'Deactivate' : 'Activate'}
            </Button>
            <Button
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Contact Info</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4 flex-shrink-0" />
              <span>{user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4 flex-shrink-0" />
              <span>{user.phone || '—'}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <span>{user.address || '—'}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Account Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            {user.storeName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Store className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">{user.storeName}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Package className="h-4 w-4 flex-shrink-0" />
              <span>{user._count?.products ?? 0} products listed</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ShoppingBag className="h-4 w-4 flex-shrink-0" />
              <span>{user._count?.orders ?? 0} orders placed</span>
            </div>
            <div className="text-muted-foreground">
              Member since {formatDate(user.createdAt)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <AdminEditUserModal
          user={user}
          onClose={() => setShowEditModal(false)}
          onUpdated={(updated) => {
            setUser((prev) => ({ ...prev, ...updated }));
            setShowEditModal(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h2 className="font-semibold text-lg">Delete User?</h2>
            <p className="text-sm text-muted-foreground">
              This will permanently deactivate <span className="font-medium text-foreground">{user.fullName}</span>'s account. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button className="flex-1 bg-red-600 hover:bg-red-700 text-white" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

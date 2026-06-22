import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Store, Package, Trash2, Search, Loader2, AlertTriangle, ChevronRight,
  ShoppingBag, RefreshCw, Eye, ArrowLeft,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { adminAPI, userAPI } from '../../api';
import { formatDate, formatCurrency } from '../../lib/utils';
import { toast } from '../../components/ui/toast';
import { Pagination, PaginationInfo } from '../../components/ui/Pagination';

const PAGE_SIZE = 10;

// ── Sub-page: Products for a specific seller ───────────────────────────────────
function SellerProductList({ seller, onBack }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [confirmCleanup, setConfirmCleanup] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.listProducts({ sellerId: seller.id, limit: 100 });
      setProducts(data.data);
    } catch {
      toast({ title: 'Failed to load products', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [seller.id]);

  useEffect(() => { load(); }, [load]);

  const deleteProduct = async (id) => {
    setDeletingId(id);
    try {
      await adminAPI.deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
      toast({ title: 'Product deleted' });
    } catch {
      toast({ title: 'Failed to delete product', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const cleanupStore = async () => {
    setCleaningUp(true);
    try {
      await adminAPI.cleanupStore(seller.id);
      toast({ title: 'Store data cleaned up' });
      setConfirmCleanup(false);
      setProducts([]);
      onBack();
    } catch {
      toast({ title: 'Failed to cleanup store', variant: 'destructive' });
    } finally {
      setCleaningUp(false);
    }
  };

  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  const productPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedProducts = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-rosewood-600 font-medium mb-4">
        ← Back to Stores
      </button>

      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{seller.storeName || seller.fullName}</h2>
          <p className="text-sm text-gray-500">{seller.email} · {seller._count?.products ?? products.length} products</p>
        </div>
        <button
          onClick={() => setConfirmCleanup(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold transition-colors flex-shrink-0"
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete All Store Data
        </button>
      </div>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-rosewood-400" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
          <Package className="h-10 w-10 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500 text-sm">No products found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {paginatedProducts.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-3 shadow-sm flex items-center gap-3">
              {p.images?.[0]?.url
                ? <img src={p.images[0].url} alt={p.name} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
                : <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Package className="h-5 w-5 text-gray-400" /></div>}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
                <p className="text-xs text-gray-500">{formatCurrency(p.price)} · {p._count?.orderItems ?? 0} orders · Stock: {p.stockQty}</p>
              </div>
              <button
                onClick={() => deleteProduct(p.id)}
                disabled={deletingId === p.id}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
              >
                {deletingId === p.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </button>
            </div>
          ))}
          <div className="pt-2 space-y-2">
            <Pagination page={page} totalPages={productPages} onPage={setPage} />
            <PaginationInfo page={page} pageSize={PAGE_SIZE} total={filtered.length} />
          </div>
        </div>
      )}

      {/* Cleanup confirm modal */}
      {confirmCleanup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <p className="font-bold text-gray-900 mb-1">Delete All Store Data?</p>
            <p className="text-sm text-gray-500 mb-1">This will permanently delete all products, transactions, and messages for <strong>{seller.storeName || seller.fullName}</strong>.</p>
            <p className="text-xs text-red-500 mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmCleanup(false)} disabled={cleaningUp} className="flex-1 py-2.5 rounded-xl border text-sm font-medium hover:bg-gray-50">Cancel</button>
              <button onClick={cleanupStore} disabled={cleaningUp} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center justify-center gap-2">
                {cleaningUp && <Loader2 className="h-4 w-4 animate-spin" />} Delete All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main: list all stores ──────────────────────────────────────────────────────
export default function AdminStoreManagePage() {
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);

  const loadSellers = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.listSellers();
      setSellers(data.data);
    } catch {
      toast({ title: 'Failed to load sellers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSellers(); }, []);

  if (selected) {
    return (
      <div className="bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-6 max-w-2xl">
          <SellerProductList seller={selected} onBack={() => { setSelected(null); loadSellers(); }} />
        </div>
      </div>
    );
  }

  const filtered = sellers.filter((s) =>
    (s.storeName || s.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );
  const sellerPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginatedSellers = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-900">Store Management</h1>
          <button onClick={loadSellers} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search stores…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <Store className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No stores found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginatedSellers.map((s) => (
              <button
                key={s.id}
                onClick={() => setSelected(s)}
                className="w-full bg-white rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:shadow-md transition-shadow text-left"
              >
                <div className="h-11 w-11 rounded-xl bg-rosewood-50 flex items-center justify-center flex-shrink-0">
                  <Store className="h-5 w-5 text-rosewood-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-gray-900 text-sm truncate">{s.storeName || s.fullName}</p>
                    {!s.isActive && <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-full">Inactive</span>}
                    {!s.isApproved && <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-full">Pending</span>}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{s.email}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">{s._count?.products ?? 0} products</span>
                    <span className="text-xs text-gray-400">{s._count?.sellerTxns ?? 0} transactions</span>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
              </button>
            ))}
            <div className="pt-2 space-y-2">
              <Pagination page={page} totalPages={sellerPages} onPage={(p) => { setPage(p); }} />
              <PaginationInfo page={page} pageSize={PAGE_SIZE} total={filtered.length} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

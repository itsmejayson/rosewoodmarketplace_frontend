import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Pencil, Trash2, Eye, EyeOff, Loader2, Check, X, GripVertical, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAPI } from '../../api';
import { toast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

const COMMON_EMOJIS = ['🍱','🥬','🥩','🥚','🧀','🍞','🥦','🛠️','🏗️','🔧','📦','🪟','🪣','💡','🪴','🧴','🎁','🧹'];

function CategoryRow({ cat, onEdit, onToggle, onDelete }) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-colors ${cat.isActive ? 'bg-white border-gray-100' : 'bg-gray-50 border-gray-100 opacity-60'}`}>
      <GripVertical className="h-4 w-4 text-gray-300 flex-shrink-0" />
      <span className="text-xl w-7 text-center flex-shrink-0">{cat.icon || '📦'}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm text-gray-900 truncate">{cat.name}</p>
        {cat.description && <p className="text-xs text-gray-400 truncate">{cat.description}</p>}
      </div>
      {!cat.isActive && (
        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500 flex-shrink-0">Hidden</span>
      )}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onEdit(cat)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title="Edit"
        >
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onToggle(cat)}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
          title={cat.isActive ? 'Hide' : 'Show'}
        >
          {cat.isActive ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button
          onClick={() => onDelete(cat)}
          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CategoryForm({ initial, onSave, onCancel, saving }) {
  const [name, setName]         = useState(initial?.name || '');
  const [icon, setIcon]         = useState(initial?.icon || '');
  const [description, setDesc]  = useState(initial?.description || '');
  const [sortOrder, setSort]    = useState(initial?.sortOrder ?? 0);

  const handleEmoji = (emoji) => setIcon((prev) => prev === emoji ? '' : emoji);

  return (
    <div className="bg-rosewood-50 border border-rosewood-200 rounded-xl p-4 space-y-3">
      <p className="font-semibold text-sm text-rosewood-800">{initial ? 'Edit Category' : 'New Category'}</p>

      {/* Emoji picker */}
      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1.5">Icon (emoji)</label>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {COMMON_EMOJIS.map((e) => (
            <button
              key={e}
              type="button"
              onClick={() => handleEmoji(e)}
              className={`h-8 w-8 text-lg rounded-lg border-2 flex items-center justify-center transition-colors ${icon === e ? 'border-rosewood-500 bg-rosewood-100' : 'border-transparent hover:border-gray-300 bg-white'}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xl w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg">{icon || '?'}</span>
          <input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            placeholder="Or type any emoji"
            maxLength={4}
            className="w-36 px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dairy & Eggs"
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-gray-600 block mb-1">Sort Order</label>
          <input
            type="number"
            value={sortOrder}
            onChange={(e) => setSort(parseInt(e.target.value) || 0)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
          />
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-gray-600 block mb-1">Description (optional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Short description shown to buyers"
          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onSave({ name, icon, description, sortOrder })}
          disabled={saving || !name.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-rosewood-600 text-white hover:bg-rosewood-700 disabled:opacity-50 transition-colors"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>
    </div>
  );
}

export default function AdminCategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [saving, setSaving]         = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminAPI.listCategories();
      setCategories(data.data);
    } catch {
      toast({ title: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSave = async ({ name, icon, description, sortOrder }) => {
    setSaving(true);
    try {
      if (editTarget) {
        await adminAPI.updateCategory(editTarget.id, { name, icon, description, sortOrder });
        toast({ title: 'Category updated' });
      } else {
        await adminAPI.createCategory({ name, icon, description, sortOrder });
        toast({ title: 'Category created' });
      }
      setShowForm(false);
      setEditTarget(null);
      await load();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to save category', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (cat) => {
    try {
      await adminAPI.updateCategory(cat.id, { isActive: !cat.isActive });
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, isActive: !c.isActive } : c));
    } catch {
      toast({ title: 'Failed to update category', variant: 'destructive' });
    }
  };

  const handleDelete = (cat) => setDeleteTarget(cat);

  const confirmDelete = async () => {
    const cat = deleteTarget;
    setDeleteTarget(null);
    try {
      const { data } = await adminAPI.deleteCategory(cat.id);
      toast({ title: data.message || 'Category removed' });
      await load();
    } catch (err) {
      toast({ title: err.response?.data?.message || 'Failed to delete', variant: 'destructive' });
    }
  };

  const startEdit = (cat) => {
    setEditTarget(cat);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditTarget(null);
  };

  const active   = categories.filter((c) => c.isActive);
  const inactive = categories.filter((c) => !c.isActive);

  return (
    <div className="bg-gray-50 min-h-screen">
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.name}"?`}
        message="This cannot be undone. Categories with products assigned will be hidden instead."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="h-5 w-5 text-rosewood-500" /> Categories
          </h1>
          {!showForm && (
            <button
              onClick={() => { setEditTarget(null); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-lg bg-rosewood-600 text-white hover:bg-rosewood-700 transition-colors"
            >
              <Plus className="h-4 w-4" /> Add Category
            </button>
          )}
        </div>

        {showForm && (
          <div className="mb-4">
            <CategoryForm
              initial={editTarget}
              onSave={handleSave}
              onCancel={cancelForm}
              saving={saving}
            />
          </div>
        )}

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base text-gray-700">
              Visible ({active.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 pt-0">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-rosewood-400" />
              </div>
            ) : active.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No active categories</p>
            ) : (
              active.map((c) => (
                <CategoryRow key={c.id} cat={c} onEdit={startEdit} onToggle={handleToggle} onDelete={handleDelete} />
              ))
            )}
          </CardContent>
        </Card>

        {inactive.length > 0 && (
          <Card className="mt-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-gray-400">Hidden ({inactive.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {inactive.map((c) => (
                <CategoryRow key={c.id} cat={c} onEdit={startEdit} onToggle={handleToggle} onDelete={handleDelete} />
              ))}
            </CardContent>
          </Card>
        )}

        <p className="text-xs text-gray-400 text-center mt-4">
          Categories with products assigned will be hidden instead of deleted to preserve data.
        </p>
      </div>
    </div>
  );
}

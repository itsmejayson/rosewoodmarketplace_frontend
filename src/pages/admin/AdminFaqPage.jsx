import { useState, useEffect } from 'react';
import { Loader2, Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronDown, ChevronUp, HelpCircle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { faqAPI } from '../../api';
import { toast } from '../../components/ui/toast';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { Pagination, PaginationInfo } from '../../components/ui/Pagination';

const PAGE_SIZE = 10;

const SECTION_SUGGESTIONS = [
  'General', 'Buyer', 'Seller', 'Orders & Payments',
  'Products & Reviews', 'Notifications', 'Account & Profile', 'Issues & Reports',
];

const EMPTY_FORM = { section: '', question: '', answer: '', sortOrder: 0, isActive: true };

function FaqForm({ initial = EMPTY_FORM, onSave, onCancel, loading }) {
  const [form, setForm] = useState(initial);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="space-y-3 bg-muted/30 rounded-lg p-4 border">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Section *</Label>
          <Input
            value={form.section}
            onChange={(e) => set('section', e.target.value)}
            placeholder="e.g. Buyer, General…"
            list="section-suggestions"
          />
          <datalist id="section-suggestions">
            {SECTION_SUGGESTIONS.map((s) => <option key={s} value={s} />)}
          </datalist>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sort Order</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => set('sortOrder', parseInt(e.target.value) || 0)}
            min={0}
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Question *</Label>
        <Input
          value={form.question}
          onChange={(e) => set('question', e.target.value)}
          placeholder="What is…?"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Answer *</Label>
        <Textarea
          value={form.answer}
          onChange={(e) => set('answer', e.target.value)}
          rows={4}
          placeholder="Explain clearly…"
        />
      </div>
      <div className="flex items-center justify-between pt-1">
        <label className="flex items-center gap-2 cursor-pointer text-sm">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => set('isActive', e.target.checked)}
            className="rounded"
          />
          Active (visible to users)
        </label>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={loading}>Cancel</Button>
          <Button size="sm" onClick={() => onSave(form)} disabled={loading}>
            {loading && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function FaqRow({ faq, onEdit, onDelete, onToggle }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className={`border rounded-lg px-4 py-3 space-y-1 ${!faq.isActive ? 'opacity-50' : ''}`}>
      <div className="flex items-start gap-2">
        <button className="mt-0.5 flex-shrink-0" onClick={() => setExpanded((v) => !v)}>
          {expanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm leading-snug">{faq.question}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <span className="bg-muted rounded px-1.5 py-0.5">{faq.section}</span>
            <span className="ml-2">#{faq.sortOrder}</span>
            {!faq.isActive && <span className="ml-2 text-amber-600">Hidden</span>}
          </p>
          {expanded && <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{faq.answer}</p>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onToggle(faq)}>
            {faq.isActive
              ? <ToggleRight className="h-4 w-4 text-green-600" />
              : <ToggleLeft className="h-4 w-4 text-muted-foreground" />}
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(faq)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDelete(faq.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}


export default function AdminFaqPage() {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [mode, setMode] = useState(null);
  const [editTarget, setEditTarget] = useState(null);
  const [filterSection, setFilterSection] = useState('All');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmSeed, setConfirmSeed] = useState(false);

  const load = async () => {
    try {
      const { data } = await faqAPI.adminList();
      setFaqs(data.data || []);
    } catch {
      toast({ title: 'Failed to load FAQs', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Reset to page 1 when filter changes
  useEffect(() => { setPage(1); }, [filterSection]);

  const sections = ['All', ...Array.from(new Set(faqs.map((f) => f.section))).sort()];
  const filtered = filterSection === 'All' ? faqs : faqs.filter((f) => f.section === filterSection);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAdd = async (form) => {
    setSaving(true);
    try {
      await faqAPI.create(form);
      toast({ title: 'FAQ created' });
      setMode(null);
      load();
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Failed to create', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleUpdate = async (form) => {
    setSaving(true);
    try {
      await faqAPI.update(editTarget.id, form);
      toast({ title: 'FAQ updated' });
      setMode(null);
      setEditTarget(null);
      load();
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Failed to update', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = (id) => setConfirmDelete(id);

  const doDelete = async () => {
    const id = confirmDelete;
    setConfirmDelete(null);
    try {
      await faqAPI.remove(id);
      toast({ title: 'FAQ deleted' });
      load();
    } catch {
      toast({ title: 'Failed to delete', variant: 'destructive' });
    }
  };

  const handleToggle = async (faq) => {
    try {
      await faqAPI.update(faq.id, { isActive: !faq.isActive });
      load();
    } catch {
      toast({ title: 'Failed to update', variant: 'destructive' });
    }
  };

  const handleEdit = (faq) => {
    setEditTarget(faq);
    setMode('edit');
  };

  const handleSeed = () => setConfirmSeed(true);

  const doSeed = async () => {
    setConfirmSeed(false);
    setSeeding(true);
    try {
      const { data } = await faqAPI.seed();
      toast({ title: data.message || 'Default FAQs loaded' });
      load();
    } catch (e) {
      toast({ title: e?.response?.data?.message || 'Seed failed', variant: 'destructive' });
    } finally { setSeeding(false); }
  };

  const handlePage = (p) => {
    setPage(p);
    // Close any open edit form when changing page
    setMode(null);
    setEditTarget(null);
  };

  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
      <ConfirmDialog
        open={!!confirmDelete}
        title="Delete this FAQ?"
        message="This entry will be permanently removed and no longer shown to users."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={doDelete}
        onCancel={() => setConfirmDelete(null)}
      />
      <ConfirmDialog
        open={confirmSeed}
        title="Load default FAQs?"
        message="This will insert the built-in FAQ content. It only works if the table is currently empty."
        confirmLabel="Load Defaults"
        variant="info"
        onConfirm={doSeed}
        onCancel={() => setConfirmSeed(false)}
      />

      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-rosewood-600" /> FAQ Management
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {filtered.length} {filterSection !== 'All' ? `in "${filterSection}"` : `total`} · page {page} of {totalPages}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleSeed} disabled={seeding}>
            {seeding ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Download className="h-4 w-4 mr-1" />}
            Load Defaults
          </Button>
          <Button size="sm" onClick={() => { setMode('add'); setEditTarget(null); }}>
            <Plus className="h-4 w-4 mr-1" /> Add FAQ
          </Button>
        </div>
      </div>

      {/* Add form */}
      {mode === 'add' && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">New FAQ</CardTitle></CardHeader>
          <CardContent>
            <FaqForm onSave={handleAdd} onCancel={() => setMode(null)} loading={saving} />
          </CardContent>
        </Card>
      )}

      {/* Section filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sections.map((s) => (
          <button
            key={s}
            onClick={() => setFilterSection(s)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filterSection === s ? 'bg-rosewood-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {s}
            {s !== 'All' && (
              <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                filterSection === s ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
              }`}>
                {faqs.filter((f) => f.section === s).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-16 text-sm">
          {faqs.length === 0
            ? 'No FAQs yet. Click "Load Defaults" to seed the initial content, or add one manually.'
            : 'No FAQs in this section.'}
        </p>
      ) : (
        <>
          <div className="space-y-2">
            {paginated.map((faq) => (
              mode === 'edit' && editTarget?.id === faq.id ? (
                <Card key={faq.id}>
                  <CardContent className="pt-4">
                    <FaqForm
                      initial={editTarget}
                      onSave={handleUpdate}
                      onCancel={() => { setMode(null); setEditTarget(null); }}
                      loading={saving}
                    />
                  </CardContent>
                </Card>
              ) : (
                <FaqRow key={faq.id} faq={faq} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
              )
            ))}
          </div>

          {/* Pagination */}
          <div className="pt-2 space-y-2">
            <Pagination page={page} totalPages={totalPages} onPage={handlePage} />
            <PaginationInfo page={page} pageSize={PAGE_SIZE} total={filtered.length} />
          </div>
        </>
      )}
    </div>
  );
}

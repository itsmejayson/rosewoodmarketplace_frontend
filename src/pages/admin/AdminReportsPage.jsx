import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, RefreshCw, Loader2, AlertTriangle, CheckCircle, Clock,
  ChevronDown, ImageIcon, X, Send,
} from 'lucide-react';
import { Card, CardContent } from '../../components/ui/card';
import { adminAPI } from '../../api';
import { formatDate } from '../../lib/utils';
import { toast } from '../../components/ui/toast';

const STATUS_OPTIONS = ['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED'];

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        color: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-500' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700',  dot: 'bg-amber-500' },
  RESOLVED:    { label: 'Resolved',    color: 'bg-green-100 text-green-700',  dot: 'bg-green-500' },
  DISMISSED:   { label: 'Dismissed',   color: 'bg-gray-100 text-gray-500',    dot: 'bg-gray-400' },
};

const ROLE_COLOR = { BUYER: 'text-blue-600', SELLER: 'text-rosewood-600', ADMIN: 'text-gray-600' };

function ReportCard({ report, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const [adminNotes, setAdminNotes] = useState(report.adminNotes || '');
  const [saving, setSaving] = useState(null);

  const update = async (status) => {
    setSaving(status);
    try {
      const { data } = await adminAPI.updateReport(report.id, { status, adminNotes });
      onUpdate(data.data);
      toast({ title: `Report marked as ${STATUS_CONFIG[status]?.label}` });
    } catch {
      toast({ title: 'Failed to update report', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const saveNotes = async () => {
    setSaving('notes');
    try {
      const { data } = await adminAPI.updateReport(report.id, { adminNotes });
      onUpdate(data.data);
      toast({ title: 'Notes saved' });
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  const cfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.OPEN;

  return (
    <Card className={report.status === 'OPEN' ? 'border-l-4 border-l-blue-500' : ''}>
      <CardContent className="p-4">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`h-2.5 w-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-gray-900 truncate">{report.subject}</p>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
            </div>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className={`text-xs font-medium ${ROLE_COLOR[report.user?.role] || 'text-gray-500'}`}>
                {report.user?.fullName}
              </span>
              <span className="text-xs text-gray-400">{report.user?.email}</span>
              <span className="text-xs text-gray-400">·</span>
              <span className="text-xs text-gray-400">{formatDate(report.createdAt)}</span>
            </div>
          </div>
          <button
            onClick={() => setExpanded((v) => !v)}
            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Collapsed preview */}
        {!expanded && (
          <p className="text-xs text-gray-500 mt-2 line-clamp-2 pl-5">{report.description}</p>
        )}

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-3 pl-5 space-y-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{report.description}</p>

            {report.screenshotUrl && (
              <a href={report.screenshotUrl} target="_blank" rel="noopener noreferrer" className="inline-block">
                <img
                  src={report.screenshotUrl}
                  alt="screenshot"
                  className="rounded-xl border border-gray-200 max-h-64 object-contain bg-gray-50"
                />
                <p className="text-xs text-rosewood-600 mt-1">View full screenshot ↗</p>
              </a>
            )}

            {/* Admin notes */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-gray-600">Admin Notes / Response</p>
              <textarea
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rosewood-400 min-h-[80px]"
                placeholder="Add notes or a response for the user…"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
              />
              <button
                onClick={saveNotes}
                disabled={saving === 'notes'}
                className="flex items-center gap-1.5 text-xs font-semibold text-rosewood-600 hover:text-rosewood-700 disabled:opacity-50"
              >
                {saving === 'notes' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                Save Notes
              </button>
            </div>

            {/* Status actions */}
            <div className="flex flex-wrap gap-2 pt-1">
              {report.status !== 'IN_PROGRESS' && (
                <button
                  onClick={() => update('IN_PROGRESS')}
                  disabled={!!saving}
                  className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving === 'IN_PROGRESS' ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  Mark In Progress
                </button>
              )}
              {report.status !== 'RESOLVED' && (
                <button
                  onClick={() => update('RESOLVED')}
                  disabled={!!saving}
                  className="px-3 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving === 'RESOLVED' ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  Mark Resolved
                </button>
              )}
              {report.status !== 'DISMISSED' && (
                <button
                  onClick={() => update('DISMISSED')}
                  disabled={!!saving}
                  className="px-3 py-1.5 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  {saving === 'DISMISSED' ? <Loader2 className="h-3 w-3 animate-spin inline mr-1" /> : null}
                  Dismiss
                </button>
              )}
              {report.status !== 'OPEN' && (
                <button
                  onClick={() => update('OPEN')}
                  disabled={!!saving}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold disabled:opacity-50 transition-colors"
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const load = useCallback(async (status = statusFilter) => {
    setLoading(true);
    try {
      const params = status !== 'ALL' ? { status } : {};
      const { data } = await adminAPI.listReports(params);
      setReports(data.data.reports);
      setTotal(data.data.total);
    } catch {
      toast({ title: 'Failed to load reports', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { load(); }, [load]);

  const changeFilter = (s) => {
    setStatusFilter(s);
    load(s);
  };

  const handleUpdate = (updated) => {
    setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const openCount = reports.filter((r) => r.status === 'OPEN').length;

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
          <div>
            <h1 className="text-xl font-bold text-gray-900">Issue Reports</h1>
            {openCount > 0 && (
              <p className="text-sm text-blue-600 font-medium">{openCount} open report{openCount !== 1 ? 's' : ''} need attention</p>
            )}
          </div>
          <button onClick={() => load()} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Status filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
          {STATUS_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => changeFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                statusFilter === s
                  ? 'bg-rosewood-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-rosewood-300'
              }`}
            >
              {s === 'ALL' ? `All (${total})` : STATUS_CONFIG[s]?.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-rosewood-400" /></div>
        ) : reports.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
            <CheckCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No reports found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => (
              <ReportCard key={r.id} report={r} onUpdate={handleUpdate} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

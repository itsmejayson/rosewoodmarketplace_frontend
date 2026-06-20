import { useState, useEffect } from 'react';
import { Bot, ToggleLeft, ToggleRight, Loader2, AlertTriangle, CheckCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAPI } from '../../api';
import { toast } from '../../components/ui/toast';

function ToggleRow({ icon: Icon, iconBg, iconColor, title, subtitle, enabled, loading, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{title}</p>
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onChange}
        disabled={loading}
        className="flex-shrink-0 transition-opacity disabled:opacity-50"
        aria-label={enabled ? 'Disable' : 'Enable'}
      >
        {loading
          ? <Loader2 className="h-7 w-7 animate-spin text-gray-400" />
          : enabled
          ? <ToggleRight className="h-8 w-8 text-rosewood-600" />
          : <ToggleLeft className="h-8 w-8 text-gray-400" />}
      </button>
    </div>
  );
}

export default function AdminSettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(null); // key of the setting being saved

  useEffect(() => {
    adminAPI.getSettings()
      .then(({ data }) => setSettings(data.data))
      .catch(() => toast({ title: 'Failed to load settings', variant: 'destructive' }));
  }, []);

  const toggle = async (key) => {
    if (!settings || saving) return;
    setSaving(key);
    const newVal = !settings[key];
    try {
      const { data } = await adminAPI.updateSettings({ [key]: newVal });
      setSettings(data.data);
      toast({ title: `${newVal ? 'Enabled' : 'Disabled'} successfully` });
    } catch {
      toast({ title: 'Failed to update setting', variant: 'destructive' });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-6">System Settings</h1>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Features</CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            {!settings ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-7 w-7 animate-spin text-rosewood-400" />
              </div>
            ) : (
              <ToggleRow
                icon={Bot}
                iconBg="bg-blue-50"
                iconColor="text-blue-600"
                title="Market Assistant (AI Chat)"
                subtitle="Show the AI chat widget to all users on the marketplace"
                enabled={settings.aiAssistantEnabled}
                loading={saving === 'aiAssistantEnabled'}
                onChange={() => toggle('aiAssistantEnabled')}
              />
            )}
          </CardContent>
        </Card>

        <div className="mt-4 p-4 rounded-xl bg-amber-50 border border-amber-200 flex gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-800">
            Changes apply immediately for all users. The AI assistant toggle hides or shows the chat bubble across the entire platform.
          </p>
        </div>
      </div>
    </div>
  );
}

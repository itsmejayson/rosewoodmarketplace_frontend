import { useState, useEffect, useRef } from 'react';
import {
  Bot, ToggleLeft, ToggleRight, Loader2, AlertTriangle,
  ArrowLeft, Store, Save, CheckCircle, Palette, ImagePlus, Trash2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { adminAPI } from '../../api';
import { toast } from '../../components/ui/toast';
import useAppConfigStore from '../../store/appConfigStore';
import { applyBrandColor } from '../../utils/colorUtils';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// ── Preset brand palettes ─────────────────────────────────────────────────────
const PRESETS = [
  { label: 'Rosewood',  color: '#C84B6E' },
  { label: 'Ocean',     color: '#2563EB' },
  { label: 'Emerald',   color: '#059669' },
  { label: 'Amber',     color: '#D97706' },
  { label: 'Violet',    color: '#7C3AED' },
  { label: 'Slate',     color: '#475569' },
  { label: 'Rose',      color: '#E11D48' },
  { label: 'Teal',      color: '#0D9488' },
];

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
  const colorInputRef = useRef(null);
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(null);

  const { appName: storeAppName, appTagline: storeAppTagline, brandColor: storeBrandColor, logoUrl: storeLogoUrl, update: updateAppConfig } = useAppConfigStore();

  // Branding fields
  const [appName, setAppName]       = useState('');
  const [appTagline, setAppTagline] = useState('');
  const [brandColor, setBrandColor] = useState('#C84B6E');
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingSaved,  setBrandingSaved]  = useState(false);

  // Logo fields
  const logoInputRef = useRef(null);
  const [logoUrl, setLogoUrl]           = useState(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoRemoving,  setLogoRemoving]  = useState(false);
  const [confirmRemoveLogo, setConfirmRemoveLogo] = useState(false);

  useEffect(() => {
    adminAPI.getSettings()
      .then(({ data }) => {
        const s = data.data;
        setSettings(s);
        setAppName(s.appName || '');
        setAppTagline(s.appTagline || '');
        setBrandColor(s.brandColor || '#C84B6E');
        setLogoUrl(s.logoUrl || null);
      })
      .catch(() => toast({ title: 'Failed to load settings', variant: 'destructive' }));
  }, []);

  // Live preview while user drags the color picker (no save yet)
  const handleColorChange = (hex) => {
    setBrandColor(hex);
    applyBrandColor(hex);
  };

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

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUploading(true);
    try {
      const form = new FormData();
      form.append('logo', file);
      const { data } = await adminAPI.uploadLogo(form);
      setLogoUrl(data.data.logoUrl);
      updateAppConfig({ logoUrl: data.data.logoUrl });
      toast({ title: 'Logo updated' });
    } catch {
      toast({ title: 'Failed to upload logo', variant: 'destructive' });
    } finally {
      setLogoUploading(false);
      e.target.value = '';
    }
  };

  const removeLogo = async () => {
    setConfirmRemoveLogo(false);
    setLogoRemoving(true);
    try {
      await adminAPI.removeLogo();
      setLogoUrl(null);
      updateAppConfig({ logoUrl: null });
      toast({ title: 'Logo removed' });
    } catch {
      toast({ title: 'Failed to remove logo', variant: 'destructive' });
    } finally {
      setLogoRemoving(false);
    }
  };

  const saveBranding = async () => {
    if (!appName.trim()) {
      toast({ title: 'App name cannot be empty', variant: 'destructive' });
      return;
    }
    setBrandingSaving(true);
    try {
      const payload = { appName: appName.trim(), appTagline: appTagline.trim(), brandColor };
      const { data } = await adminAPI.updateSettings(payload);
      setSettings(data.data);
      updateAppConfig(payload);
      setBrandingSaved(true);
      setTimeout(() => setBrandingSaved(false), 2500);
      toast({ title: 'Branding saved' });
    } catch {
      toast({ title: 'Failed to save branding', variant: 'destructive' });
    } finally {
      setBrandingSaving(false);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <ConfirmDialog
        open={confirmRemoveLogo}
        title="Remove custom logo?"
        message="This will revert to the default SVG logo."
        confirmLabel="Remove"
        variant="warning"
        onConfirm={removeLogo}
        onCancel={() => setConfirmRemoveLogo(false)}
      />
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-4 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <h1 className="text-xl font-bold text-gray-900 mb-6">System Settings</h1>

        {/* ── Branding ─────────────────────────────────────────────────────── */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-4 w-4 text-rosewood-500" /> Branding
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {!settings ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-7 w-7 animate-spin text-rosewood-400" />
              </div>
            ) : (
              <>
                {/* App Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">App Name</label>
                  <input
                    type="text"
                    value={appName}
                    onChange={(e) => setAppName(e.target.value)}
                    placeholder="e.g. Rosewood"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown in the navbar and browser tab</p>
                </div>

                {/* Tagline */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={appTagline}
                    onChange={(e) => setAppTagline(e.target.value)}
                    placeholder="e.g. Fresh food & quality materials"
                    className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
                  />
                  <p className="text-xs text-gray-400 mt-1">Shown on the landing and login pages</p>
                </div>

                {/* Brand Color */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Brand Color
                  </label>

                  {/* Preset swatches */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {PRESETS.map(({ label, color }) => (
                      <button
                        key={color}
                        title={label}
                        onClick={() => handleColorChange(color)}
                        className="group relative h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
                        style={{
                          backgroundColor: color,
                          borderColor: brandColor === color ? '#111' : 'transparent',
                        }}
                      >
                        {brandColor === color && (
                          <span className="absolute inset-0 flex items-center justify-center">
                            <CheckCircle className="h-3.5 w-3.5 text-white drop-shadow" />
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom color picker */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => colorInputRef.current?.click()}
                      className="h-10 w-10 rounded-lg border-2 border-gray-200 cursor-pointer overflow-hidden hover:border-gray-400 transition-colors flex-shrink-0"
                      style={{ backgroundColor: brandColor }}
                      title="Pick custom color"
                    />
                    <input
                      ref={colorInputRef}
                      type="color"
                      value={brandColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="sr-only"
                    />
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-gray-500 font-mono">{brandColor.toUpperCase()}</span>
                      <input
                        type="text"
                        value={brandColor}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9a-fA-F]{0,6}$/.test(v)) {
                            setBrandColor(v);
                            if (v.length === 7) applyBrandColor(v);
                          }
                        }}
                        maxLength={7}
                        className="flex-1 px-2 py-1.5 text-xs font-mono border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-rosewood-400 bg-white"
                        placeholder="#C84B6E"
                      />
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Changes the button, badge, and accent colors across the entire app. Preview updates live.
                  </p>
                </div>

                {/* Live preview strip */}
                <div className="rounded-xl overflow-hidden border border-gray-100">
                  <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100">
                    <div className="h-5 w-5 rounded-full" style={{ backgroundColor: brandColor }} />
                    <span className="text-sm font-semibold" style={{ color: brandColor }}>{appName || 'App Name'}</span>
                  </div>
                  <div className="bg-gray-50 px-4 py-3 flex items-center gap-2 flex-wrap">
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                      style={{ backgroundColor: brandColor }}
                    >Primary Button</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold border"
                      style={{ color: brandColor, borderColor: brandColor }}
                    >Outline Button</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{ backgroundColor: `${brandColor}20`, color: brandColor }}
                    >Badge</span>
                  </div>
                </div>

                {/* Save button */}
                <button
                  onClick={saveBranding}
                  disabled={brandingSaving}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-rosewood-600 text-white hover:bg-rosewood-700 disabled:opacity-60 transition-colors"
                >
                  {brandingSaving
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : brandingSaved
                    ? <CheckCircle className="h-4 w-4" />
                    : <Save className="h-4 w-4" />}
                  {brandingSaving ? 'Saving…' : brandingSaved ? 'Saved!' : 'Save Branding'}
                </button>
              </>
            )}
          </CardContent>
        </Card>

        {/* ── Logo ─────────────────────────────────────────────────────────── */}
        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-rosewood-500" /> Logo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-16 w-16 object-contain rounded-xl border border-gray-100 bg-gray-50" />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-rosewood-50 border border-rosewood-100 flex items-center justify-center text-xs text-rosewood-400 font-medium text-center leading-tight px-1">
                  Default SVG
                </div>
              )}
              <div className="space-y-2">
                <button
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  {logoUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                  {logoUploading ? 'Uploading…' : logoUrl ? 'Replace Logo' : 'Upload Logo'}
                </button>
                {logoUrl && (
                  <button
                    onClick={() => setConfirmRemoveLogo(true)}
                    disabled={logoRemoving}
                    className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-50 transition-colors"
                  >
                    {logoRemoving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    Remove Logo
                  </button>
                )}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" onChange={uploadLogo} className="sr-only" />
            </div>
            <p className="text-xs text-gray-400">
              Recommended: square image, min 64×64px, max 5 MB. Displayed in the navbar next to the app name.
            </p>
          </CardContent>
        </Card>

        {/* ── Features ─────────────────────────────────────────────────────── */}
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
            Branding changes (name, color) apply instantly for all users. Color changes persist across server restarts.
          </p>
        </div>
      </div>
    </div>
  );
}

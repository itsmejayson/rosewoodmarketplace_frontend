import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, ImageIcon, Send, Loader2, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from '../components/ui/toast';
import { reportAPI } from '../api';
import { formatDate } from '../lib/utils';

const STATUS_CONFIG = {
  OPEN:        { label: 'Open',        color: 'bg-blue-100 text-blue-700' },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-amber-100 text-amber-700' },
  RESOLVED:    { label: 'Resolved',    color: 'bg-green-100 text-green-700' },
  DISMISSED:   { label: 'Dismissed',   color: 'bg-gray-100 text-gray-600' },
};

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [tab, setTab] = useState('new'); // 'new' | 'history'
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [preview, setPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [myReports, setMyReports] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Only image files are allowed', variant: 'destructive' });
      return;
    }
    setScreenshot(file);
    setPreview(URL.createObjectURL(file));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  const removeScreenshot = () => {
    setScreenshot(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast({ title: 'Subject and description are required', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const form = new FormData();
      form.append('subject', subject.trim());
      form.append('description', description.trim());
      if (screenshot) form.append('screenshot', screenshot);
      await reportAPI.submit(form);
      setSubmitted(true);
      setSubject('');
      setDescription('');
      removeScreenshot();
    } catch {
      toast({ title: 'Failed to submit report. Please try again.', variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data } = await reportAPI.my();
      setMyReports(data.data);
    } catch {
      toast({ title: 'Failed to load your reports', variant: 'destructive' });
    } finally {
      setLoadingHistory(false);
    }
  };

  const switchTab = (t) => {
    setTab(t);
    if (t === 'history' && myReports === null) loadHistory();
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

        <h1 className="text-xl font-bold text-gray-900 mb-1">Report an Issue</h1>
        <p className="text-sm text-gray-500 mb-5">Found a bug or having trouble? Let us know and we'll look into it.</p>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-200 rounded-xl p-1 mb-5">
          {['new', 'history'].map((t) => (
            <button
              key={t}
              onClick={() => switchTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'new' ? 'New Report' : 'My Reports'}
            </button>
          ))}
        </div>

        {tab === 'new' && (
          submitted ? (
            <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
              <CheckCircle className="h-14 w-14 text-green-500 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-gray-900 mb-1">Report Submitted!</h2>
              <p className="text-sm text-gray-500 mb-5">Our admin team will review your report and get back to you.</p>
              <div className="flex gap-3 justify-center">
                <Button variant="outline" onClick={() => { setSubmitted(false); }}>Submit Another</Button>
                <Button onClick={() => switchTab('history')} className="bg-rosewood-600 hover:bg-rosewood-700 text-white">
                  View My Reports
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Card>
                <CardContent className="pt-5 space-y-4">
                  <div className="space-y-1">
                    <Label>Subject <span className="text-red-500">*</span></Label>
                    <Input
                      placeholder="Brief description of the issue"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={120}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>Description <span className="text-red-500">*</span></Label>
                    <textarea
                      className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-rosewood-400 min-h-[120px]"
                      placeholder="Describe what happened, what you expected, and any steps to reproduce..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      maxLength={2000}
                    />
                    <p className="text-xs text-gray-400 text-right">{description.length}/2000</p>
                  </div>

                  {/* Screenshot upload */}
                  <div className="space-y-1">
                    <Label>Screenshot <span className="text-gray-400 font-normal">(optional)</span></Label>
                    {preview ? (
                      <div className="relative w-full rounded-xl overflow-hidden border border-gray-200">
                        <img src={preview} alt="screenshot" className="w-full max-h-56 object-contain bg-gray-50" />
                        <button
                          type="button"
                          onClick={removeScreenshot}
                          className="absolute top-2 right-2 h-7 w-7 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => fileRef.current?.click()}
                        className="border-2 border-dashed border-gray-300 hover:border-rosewood-400 rounded-xl p-6 flex flex-col items-center gap-2 cursor-pointer transition-colors"
                      >
                        <ImageIcon className="h-8 w-8 text-gray-300" />
                        <p className="text-sm text-gray-500">Click or drag & drop an image here</p>
                        <p className="text-xs text-gray-400">PNG, JPG, GIF, WebP — max 5 MB</p>
                      </div>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFile(e.target.files[0])}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-rosewood-600 hover:bg-rosewood-700 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {submitting ? 'Submitting…' : 'Submit Report'}
              </Button>
            </form>
          )
        )}

        {tab === 'history' && (
          <div>
            {loadingHistory ? (
              <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-rosewood-400" /></div>
            ) : !myReports || myReports.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
                <Clock className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">You haven't submitted any reports yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myReports.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.OPEN;
                  return (
                    <Card key={r.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm text-gray-900 truncate">{r.subject}</p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{r.description}</p>
                            {r.adminNotes && (
                              <div className="mt-2 p-2 rounded-lg bg-green-50 border border-green-200">
                                <p className="text-xs font-semibold text-green-700">Admin response:</p>
                                <p className="text-xs text-green-800 mt-0.5">{r.adminNotes}</p>
                              </div>
                            )}
                            <p className="text-xs text-gray-400 mt-2">{formatDate(r.createdAt)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2 flex-shrink-0">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>
                              {cfg.label}
                            </span>
                            {r.screenshotUrl && (
                              <a href={r.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                <img src={r.screenshotUrl} alt="screenshot" className="h-12 w-16 rounded-lg object-cover border border-gray-200" />
                              </a>
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
        )}
      </div>
    </div>
  );
}

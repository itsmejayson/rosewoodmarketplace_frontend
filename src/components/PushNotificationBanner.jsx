import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';

export default function PushNotificationBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { permission, isSubscribed, isLoading, requestPermissionAndSubscribe } = usePushNotifications();

  // Don't show if: already granted, already denied, dismissed this session, or not supported
  if (typeof Notification === 'undefined') return null;
  if (permission === 'granted' && isSubscribed) return null;
  if (permission === 'denied') return null;
  if (dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm mx-auto px-4">
      <div className="bg-white border border-border rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="flex-shrink-0 w-9 h-9 rounded-full bg-rosewood-100 flex items-center justify-center">
          <Bell className="h-5 w-5 text-rosewood-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">Stay updated</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Enable push notifications to get order updates, payment confirmations, and messages instantly.
          </p>
          <div className="flex gap-2 mt-3">
            <button
              onClick={requestPermissionAndSubscribe}
              disabled={isLoading}
              className="flex-1 text-xs px-3 py-1.5 rounded-md bg-rosewood-600 text-white hover:bg-rosewood-700 disabled:opacity-50 font-medium"
            >
              {isLoading ? 'Enabling…' : 'Enable Notifications'}
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="text-xs px-3 py-1.5 rounded-md border hover:bg-muted font-medium"
            >
              Not now
            </button>
          </div>
        </div>
        <button onClick={() => setDismissed(true)} className="flex-shrink-0 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

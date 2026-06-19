import { useState, useEffect } from 'react';
import api from '../api/axios';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// Push notifications are not supported in all browsers (Messenger, Safari < 16.4, etc.)
const isPushSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications() {
  const [permission, setPermission] = useState(
    isPushSupported ? Notification.permission : 'denied'
  );
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isPushSupported) return;
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    if (!isPushSupported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {}
  };

  const subscribe = async () => {
    if (!isPushSupported || !VAPID_PUBLIC_KEY) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await api.post('/push/subscribe', sub.toJSON());
      setIsSubscribed(true);
      setPermission('granted');
    } catch (err) {
      console.error('Push subscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribe = async () => {
    if (!isPushSupported) return;
    setIsLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await api.delete('/push/unsubscribe', { data: { endpoint: sub.endpoint } });
        await sub.unsubscribe();
      }
      setIsSubscribed(false);
    } catch (err) {
      console.error('Push unsubscribe error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissionAndSubscribe = async () => {
    if (!isPushSupported) return;
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') await subscribe();
    } catch {}
  };

  return { permission, isSubscribed, isLoading, isPushSupported, subscribe, unsubscribe, requestPermissionAndSubscribe };
}

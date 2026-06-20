self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Rosewood Marketplace', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Rosewood Marketplace';
  const options = {
    body: data.body || '',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.actionUrl || '/';
  const fullUrl = self.location.origin + (url.startsWith('/') ? url : '/' + url);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to find an existing window to reuse
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          // navigate() is not available in all browsers — use postMessage as fallback
          if ('navigate' in client) {
            return client.navigate(fullUrl);
          } else {
            client.postMessage({ type: 'NAVIGATE', url: fullUrl });
            return;
          }
        }
      }
      // No existing window — open a new one
      if (self.clients.openWindow) return self.clients.openWindow(fullUrl);
    })
  );
});

const CACHE = 'citapro-v2';
const OFFLINE_URL = '/offline.html';
const STATIC_EXTS = ['.js', '.css', '.woff2', '.woff', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.add(OFFLINE_URL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;

  // Skip API requests — always fresh from server
  if (url.pathname.startsWith('/api/')) return;

  // Navigation requests — SSR handles these normally, but fall back to the
  // offline page when there's no network at all.
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  const isStaticAsset =
    STATIC_EXTS.some(ext => url.pathname.endsWith(ext)) ||
    url.hostname === 'fonts.gstatic.com' ||
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'unpkg.com';

  if (!isStaticAsset) return;

  // Cache-first for static assets
  e.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE).then(c => c.put(request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});

// ── Web Push (scaffolding) ──────────────────────────────────────────────────
// No VAPID key / subscription endpoint exists on the backend yet, so nothing
// subscribes today — these listeners just make the app ready to receive
// pushes once that lands.
self.addEventListener('push', (e) => {
  let payload = {};
  try { payload = e.data ? e.data.json() : {}; } catch (err) { /* non-JSON payload */ }

  const title = payload.title ?? 'Cita.Pro';
  const options = {
    body: payload.body ?? '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: payload.data ?? {},
  };

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const targetUrl = e.notification.data?.url ?? '/';

  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => c.url.includes(targetUrl));
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

const CACHE = 'citapro-v1';
const STATIC_EXTS = ['.js', '.css', '.woff2', '.woff', '.ttf', '.otf', '.png', '.jpg', '.jpeg', '.svg', '.ico', '.webp', '.webmanifest'];

self.addEventListener('install', () => self.skipWaiting());

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

  // Skip navigation requests — SSR handles these
  if (request.mode === 'navigate') return;

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

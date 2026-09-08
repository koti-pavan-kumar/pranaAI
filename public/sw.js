/**
 * PranaAI Service Worker — Offline-first PWA
 * Network-first for all JS/CSS, cache-first for static assets only
 */

const CACHE_NAME = 'pranaai-v5';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/models/sentiment-small.onnx',
  '/models/vocab-small.txt',
];

// Install — cache only stable assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // Don't block install if some assets fail
        console.log('[SW] Some assets failed to cache, continuing...');
      });
    })
  );
  self.skipWaiting();
});

// Activate — delete ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Immediately take control of all pages
  self.clients.claim();
});

// Fetch strategy — network-first for everything to prevent stale cache
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  const url = new URL(event.request.url);

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return;

  // Strategy: Network-first for JS/CSS chunks (prevents stale cache errors)
  const isJSChunk = url.pathname.includes('/assets/') && url.pathname.endsWith('.js');
  const isCSSChunk = url.pathname.includes('/assets/') && url.pathname.endsWith('.css');

  if (isJSChunk || isCSSChunk) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
    return;
  }

  // Strategy: Cache-first for static assets (models, fonts)
  const isStaticAsset = STATIC_ASSETS.some(a => url.pathname === a || url.pathname === a + '/');
  if (isStaticAsset) {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        });
      })
    );
    return;
  }

  // Strategy: Network-first for everything else (HTML, images, etc.)
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Fallback for HTML pages
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match('/index.html');
          }
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Listen for skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

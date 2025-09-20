const CACHE_NAME = 'gbuddy-cache-v1';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg',
  '/offline',
];
const RUNTIME_CACHE = 'gbuddy-runtime-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => {
      if (![CACHE_NAME, RUNTIME_CACHE].includes(k)) return caches.delete(k);
    }))).then(() => self.clients.claim())
  );
});

// Helper: detect navigation requests
const isNavigation = (request) => request.mode === 'navigate';

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Navigation requests: try network, fall back to cache, then offline page
  if (isNavigation(request)) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          return cached || caches.match('/offline');
        })
    );
    return;
  }

  const url = new URL(request.url);

  // Cache-first for our static assets
  const isStatic = url.origin === self.location.origin && (
    url.pathname.startsWith('/_next') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.svg')
  );

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return res;
      }))
    );
    return;
  }

  // Network-first for JSON data
  if (url.pathname.endsWith('.json')) {
    event.respondWith(
      fetch(request).then((res) => {
        const copy = res.clone();
        caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, copy));
        return res;
      }).catch(() => caches.match(request))
    );
    return;
  }
});


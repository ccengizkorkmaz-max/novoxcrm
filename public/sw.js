const CACHE_NAME = 'novo-cache-v3';
const STATIC_ASSETS = [
    '/manifest.json',
    '/icon-512.png',
];

// Install: only cache truly static assets (icons, manifest)
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    // Activate immediately, don't wait for old tabs to close
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            );
        })
    );
    // Take control of all clients immediately
    self.clients.claim();
});

// Fetch: Network-first for everything, cache only static assets as fallback
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Never cache navigation requests (HTML pages) — always go to network
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => {
                // Offline fallback: could return a cached offline page
                return new Response('Çevrimdışısınız. Lütfen internet bağlantınızı kontrol edin.', {
                    status: 503,
                    headers: { 'Content-Type': 'text/html; charset=utf-8' }
                });
            })
        );
        return;
    }

    // For API calls, always use network
    if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
        event.respondWith(fetch(event.request));
        return;
    }

    // For static assets (images, fonts, JS, CSS): network-first with cache fallback
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                // Cache successful responses for static assets only
                if (response.ok && (
                    url.pathname.startsWith('/_next/static/') ||
                    url.pathname.endsWith('.png') ||
                    url.pathname.endsWith('.ico') ||
                    url.pathname.endsWith('.svg') ||
                    url.pathname === '/manifest.json'
                )) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseClone);
                    });
                }
                return response;
            })
            .catch(() => {
                // Offline: try cache
                return caches.match(event.request).then((cached) => {
                    return cached || new Response('', { status: 503 });
                });
            })
    );
});

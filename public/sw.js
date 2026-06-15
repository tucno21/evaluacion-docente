const CACHE_NAME = 'evaldocente-cache-v2';
const APP_SHELL_URLS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-192x192.png',
    '/icons/icon-maskable-512x512.png',
    '/vite.svg',
    '/cover.png',
    '/assets/index.js',
    '/assets/index.css',
];

// Instalación: precachea el app shell.
// Se cachea cada recurso por separado para que un único 404
// (p. ej. un icono que no exista) NO rompa toda la instalación.
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(async (cache) => {
            await Promise.all(
                APP_SHELL_URLS.map((url) =>
                    cache.add(url).catch((err) => {
                        console.warn('[SW] No se pudo precachear:', url, err);
                    })
                )
            );
            return self.skipWaiting();
        })
    );
});

// Activación: limpia caches antiguos y toma el control de inmediato.
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys()
            .then((cacheNames) =>
                Promise.all(
                    cacheNames.map((cacheName) => {
                        if (!cacheWhitelist.includes(cacheName)) {
                            return caches.delete(cacheName);
                        }
                    })
                )
            )
            .then(() => self.clients.claim())
    );
});

// Fetch: cache-first con cache en runtime y fallback offline.
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;

    const isSameOrigin = event.request.url.startsWith(self.location.origin);

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                return cachedResponse;
            }

            return fetch(event.request)
                .then((response) => {
                    // Cachear respuestas válidas del mismo origen (runtime cache).
                    if (
                        response &&
                        response.status === 200 &&
                        response.type === 'basic' &&
                        isSameOrigin
                    ) {
                        const responseToCache = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }
                    return response;
                })
                .catch(() => {
                    // Offline: para navegaciones (SPA), devolver el index.html cacheado.
                    if (event.request.mode === 'navigate') {
                        return caches.match('/index.html');
                    }
                    return new Response('', { status: 504, statusText: 'Offline' });
                });
        })
    );
});

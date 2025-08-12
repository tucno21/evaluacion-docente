const CACHE_NAME = 'evaldocente-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/icons/icon-maskable-192x192.png',
    '/icons/icon-maskable-512x512.png',
    '/vite.svg',
    '/cover.png',
    '/src/index.css',
    '/assets/index.js', // Ahora con nombres de archivo predecibles gracias a vite.config.ts
    '/assets/index.css', // Ahora con nombres de archivo predecibles gracias a vite.config.ts
    '/src/main.tsx', // Mantener si se usa directamente o si es un punto de entrada
    '/src/App.tsx', // Mantener si se usa directamente o si es un punto de entrada
    '/src/assets/react.svg',
    // Agregue otros activos que deban ser cacheados, por ejemplo, otros componentes, páginas, etc.
    // Para una PWA de producción, considere generar esta lista dinámicamente durante el proceso de build.
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});

self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

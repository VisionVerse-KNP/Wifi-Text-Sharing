// Minimal app-shell service worker for WiFi Text Share.
// Caches static shell assets so the app can install and open offline;
// real-time features still require a live connection to the backend.

const CACHE_NAME = 'wifi-text-share-v2';
const APP_SHELL = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-32.png',
  '/favicon-16.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept Socket.IO / API traffic — always go to the network.
  if (request.url.includes('/socket.io/') || request.url.includes('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html').then((r) => r || caches.match('/')))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => cached))
  );
});

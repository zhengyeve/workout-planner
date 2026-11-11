// Bump this version whenever a precached file changes, including new modules.
const CACHE_PREFIX = 'routine-planner-shell-';
const CACHE_NAME = `${CACHE_PREFIX}v5`;
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.mjs',
  './bank.mjs',
  './engine.mjs',
  './dates.mjs',
  './load.mjs',
  './history.mjs',
  './validation.mjs',
  './recommendation.mjs',
  './storage.mjs',
  './entries.mjs',
  './messages.mjs',
  './dom.mjs',
  './views.mjs',
  './editor.mjs',
  './backup.mjs',
  './plans-view.mjs',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
];
const assetURLs = new Set(ASSETS.map((path) => new URL(path, self.registration.scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
});
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || !assetURLs.has(event.request.url)) return;
  event.respondWith(
    caches
      .open(CACHE_NAME)
      .then(async (cache) => (await cache.match(event.request)) || fetch(event.request)),
  );
});

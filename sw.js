// Ouverture toujours en local (aucune attente réseau). Les mises à jour sont cherchées
// par le bouton « Rechercher une mise à jour » ou automatiquement toutes les 6 h (en fond).
const VERSION = 'v1.2.1';
const CACHE = 'journees-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  e.respondWith(caches.open(CACHE).then(async c => {
    const hit = (await c.match(e.request, { ignoreSearch: true })) || (page ? await c.match('./index.html') : null);
    if (hit) return hit;
    return fetch(e.request).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; });
  }));
});

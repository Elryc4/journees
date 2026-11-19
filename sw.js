// Copie hors connexion de l'appli. Changer VERSION à chaque mise à jour.
const VERSION = 'v1.0.5';
const CACHE = 'journees-' + VERSION;
const FILES = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // cache:'reload' = on ignore le cache du navigateur pour récupérer les vrais nouveaux fichiers
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return; // API externes : réseau direct
  const page = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  e.respondWith(caches.open(CACHE).then(async c => {
    if (page) {
      // Page : réseau d'abord (1 s max) pour avoir tout de suite la dernière version, sinon la copie
      try {
        const r = await Promise.race([fetch(e.request, { cache: 'no-cache' }), new Promise((_, rej) => setTimeout(() => rej(0), 1000))]);
        if (r && r.ok) { c.put(e.request, r.clone()); return r; }
      } catch (x) {}
      return (await c.match(e.request, { ignoreSearch: true })) || (await c.match('./index.html')) || fetch(e.request);
    }
    const hit = await c.match(e.request, { ignoreSearch: true });
    const net = fetch(e.request, { cache: 'no-cache' }).then(r => { if (r && r.ok) c.put(e.request, r.clone()); return r; }).catch(() => null);
    return hit || (await net);
  }));
});

// Offline cache for the PWA. The version and the asset list are stamped on every build
// (scripts/sw-version.mjs).
const CACHE = 'marc-__BUILD__';
const CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png'];
// Every built asset, lazy chunks included, so the Escobar chunk works offline after the first visit (ST-04).
const ASSETS = /*__ASSETS__*/[];
const INDEX = new URL('./index.html', self.location).href;
// Module scripts carry an Origin header; a server's `Vary: Origin` must not hide the installed copy.
const MATCH = { ignoreVary: true };

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll([...CORE, ...ASSETS])).then(() => self.skipWaiting()));
});

// ST-20: an old tab still asks for its own hashed chunks, so /assets/ entries move into the new cache
// before the old caches go. QA-R5b-3: only the previous build's own files move, marked as carried;
// a carried file is not carried again, so the cache holds at most two builds.
const CARRIED = 'x-marc-carried';
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const next = await caches.open(CACHE);
    for (const key of await caches.keys()) {
      if (key === CACHE) continue;
      const old = await caches.open(key);
      for (const req of await old.keys()) {
        if (new URL(req.url).pathname.includes('/assets/') && !(await next.match(req, MATCH))) {
          const res = await old.match(req);
          if (res && !res.headers.has(CARRIED)) {
            const headers = new Headers(res.headers);
            headers.set(CARRIED, '1');
            await next.put(req, new Response(await res.blob(), { status: res.status, statusText: res.statusText, headers }));
          }
        }
      }
      await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith(self.location.origin)) return;
  // ST-03: navigations go to the network first so a new build is seen; the cached index is the fallback.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      if (res.ok) { const a = res.clone(), b = res.clone(); caches.open(CACHE).then(c => Promise.all([c.put(req, a), c.put(INDEX, b)])); return res; }
      // A transient server failure (5xx) still has a working app cached; a permanent client error (4xx) does not.
      if (res.status >= 500) return caches.match(req, MATCH).then(hit => hit || caches.match(INDEX, MATCH)).then(hit => hit || res);
      return res;
    }).catch(async () => (await caches.match(req, MATCH)) || (await caches.match(INDEX, MATCH)) || Response.error()));
    return;
  }
  // Other same-origin GETs: cache first; only good same-origin answers are kept; a failure is an error, never HTML.
  e.respondWith(caches.match(req, MATCH).then(hit => hit || fetch(req).then(res => {
    if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  }).catch(() => Response.error())));
});

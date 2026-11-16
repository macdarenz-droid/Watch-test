import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { pageIsCurrent } from '@/app/swUpdate';

/** A Map-backed Cache Storage, enough for sw.js's activate and fetch steps. */
function fakeCaches() {
  const stores = new Map<string, Map<string, Response>>();
  const lookup = (m: Map<string, Response>, req: Request | string) => { const r = m.get(typeof req === 'string' ? req : req.url); return r ? r.clone() : undefined; };
  const cache = (m: Map<string, Response>) => ({
    keys: async () => [...m.keys()].map(url => new Request(url)),
    match: async (req: Request | string) => lookup(m, req),
    put: async (req: Request | string, res: Response) => { m.set(typeof req === 'string' ? req : req.url, res); },
  });
  return {
    stores,
    api: {
      keys: async () => [...stores.keys()],
      open: async (k: string) => { if (!stores.has(k)) stores.set(k, new Map()); return cache(stores.get(k)!) as unknown as Cache; },
      delete: async (k: string) => stores.delete(k),
      // Real CacheStorage.match searches every cache; sw.js's fetch handler relies on that.
      match: async (req: Request | string) => { for (const m of stores.values()) { const hit = lookup(m, req); if (hit) return hit; } return undefined; },
    },
  };
}

const ORIGIN = 'https://marc.example/';
const INDEX = `${ORIGIN}index.html`;
async function deploy(src: string, build: string, caches: ReturnType<typeof fakeCaches>, files: string[]) {
  const listeners: Record<string, (e: { waitUntil: (p: Promise<unknown>) => void }) => void> = {};
  const self = { location: new URL(ORIGIN), addEventListener: (t: string, fn: never) => { listeners[t] = fn; }, skipWaiting: () => {}, clients: { claim: async () => {} } };
  new Function('self', 'caches', src.replace('__BUILD__', build))(self, caches.api);
  const c = await caches.api.open(`marc-${build}`);
  for (const f of files) await c.put(new Request(`${ORIGIN}assets/${f}`), new Response(f));
  let done: Promise<unknown> = Promise.resolve();
  listeners.activate!({ waitUntil: p => { done = p; } });
  await done;
}

describe('service worker cache (QA-R5b-3)', () => {
  it('holds at most the current and the previous build after many deploys', async () => {
    const src = readFileSync('public/sw.js', 'utf8');
    const caches = fakeCaches();
    for (let b = 0; b < 10; b++) await deploy(src, `b${b}`, caches, [0, 1, 2, 3].map(k => `index-b${b}-${k}.js`));
    expect([...caches.stores.keys()]).toEqual(['marc-b9']);
    const urls = [...caches.stores.get('marc-b9')!.keys()];
    expect(urls).toHaveLength(8);
    expect(urls.some(u => u.includes('-b8-'))).toBe(true);
    expect(urls.some(u => u.includes('-b0-'))).toBe(false);
  });
});

describe('"App updated" only for a page that is out of date (QA-R5b-4)', () => {
  it('a page running the new build is current; one whose entry was only carried over is not', async () => {
    const src = readFileSync('public/sw.js', 'utf8');
    const caches = fakeCaches();
    await deploy(src, 'b1', caches, ['index-old.js']);
    await deploy(src, 'b2', caches, ['index-new.js']);
    expect(await pageIsCurrent(`${ORIGIN}assets/index-new.js`, caches.api)).toBe(true);
    expect(await pageIsCurrent(`${ORIGIN}assets/index-old.js`, caches.api)).toBe(false);
  });
});

/** Loads sw.js and fires its 'fetch' listener for a navigation, returning the respondWith() result. */
async function navigate(caches: ReturnType<typeof fakeCaches>, build: string, fetchImpl: () => Promise<Response>): Promise<Response> {
  const src = readFileSync('public/sw.js', 'utf8').replace('__BUILD__', build);
  const listeners: Record<string, (e: { request: unknown; respondWith: (p: Promise<Response>) => void }) => void> = {};
  const self = { location: new URL(ORIGIN), addEventListener: (t: string, fn: never) => { listeners[t] = fn; }, skipWaiting: () => {}, clients: { claim: async () => {} } };
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl as typeof fetch;
  try {
    new Function('self', 'caches', src)(self, caches.api);
    let result: Promise<Response> | undefined;
    listeners.fetch!({ request: { method: 'GET', url: `${ORIGIN}dashboard`, mode: 'navigate' }, respondWith: p => { result = p; } });
    return await result!;
  } finally { globalThis.fetch = originalFetch; }
}

describe('REL-01: a 5xx navigation response falls back to the cached app shell', () => {
  it('serves the cached index on a 503', async () => {
    const caches = fakeCaches();
    const c = await caches.api.open('marc-b1');
    await c.put(INDEX, new Response('<html>cached index</html>'));
    const res = await navigate(caches, 'b1', async () => new Response('server unavailable', { status: 503 }));
    expect(res.status).not.toBe(503);
    expect(await res.text()).toBe('<html>cached index</html>');
  });
  it('serves the cached index on a 500', async () => {
    const caches = fakeCaches();
    const c = await caches.api.open('marc-b1');
    await c.put(INDEX, new Response('<html>cached index</html>'));
    const res = await navigate(caches, 'b1', async () => new Response('internal error', { status: 500 }));
    expect(await res.text()).toBe('<html>cached index</html>');
  });
  it('a rejected fetch still serves the cached index', async () => {
    const caches = fakeCaches();
    const c = await caches.api.open('marc-b1');
    await c.put(INDEX, new Response('<html>cached index</html>'));
    const res = await navigate(caches, 'b1', async () => { throw new TypeError('network error'); });
    expect(await res.text()).toBe('<html>cached index</html>');
  });
  it('passes the 5xx through when there is no cached index', async () => {
    const caches = fakeCaches();
    const res = await navigate(caches, 'b1', async () => new Response('server unavailable', { status: 503 }));
    expect(res.status).toBe(503);
    expect(await res.text()).toBe('server unavailable');
  });
});

describe('web app identity (QA-R5b-2, QA-R5b-5)', () => {
  it('the manifest id is the start URL, the identity existing installs already have', () => {
    const m = JSON.parse(readFileSync('public/manifest.webmanifest', 'utf8')) as { id: string; start_url: string };
    const base = 'https://marc.example/app/manifest.webmanifest';
    expect(new URL(m.id, base).href).toBe(new URL(m.start_url, base).href);
  });
});

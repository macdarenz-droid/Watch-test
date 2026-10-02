/**
 * QA-R5b-4: whether this page already runs the build the new service worker installed. The
 * navigation is network-first, so after a deploy the first launch is usually current already;
 * only a page whose own entry script is not one of the new build's files is out of date. Files
 * the worker carried over from the previous build for old tabs are marked (public/sw.js).
 */
export function ownEntry(doc: Pick<Document, 'querySelector'> | undefined = typeof document === 'undefined' ? undefined : document): string | null {
  const s = doc?.querySelector('script[type="module"][src]') as HTMLScriptElement | null | undefined;
  return s?.src || null;
}

export async function pageIsCurrent(entry: string | null = ownEntry(), cachesApi: Pick<CacheStorage, 'keys' | 'open'> | undefined = globalThis.caches): Promise<boolean> {
  if (!entry || !cachesApi) return false;
  try {
    for (const k of await cachesApi.keys()) {
      if (!k.startsWith('marc-')) continue;
      const hit = await (await cachesApi.open(k)).match(entry, { ignoreVary: true });
      if (hit && !hit.headers.has('x-marc-carried')) return true;
    }
  } catch { /* no cache access: fall back to offering the reload */ }
  return false;
}

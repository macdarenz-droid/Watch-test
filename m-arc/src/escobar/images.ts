/**
 * Photos for Escobar (§6.2): never in localStorage. Kept in memory for the session and in
 * IndexedDB (`marc-escobar-img`) best-effort, so a reopened conversation can still show them.
 */
const memory = new Map<string, { mediaType: string; data: string }>();
const DB = 'marc-escobar-img';
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase | null> | null = null;

/** One connection for the app's life (ES-28); a failure clears it so the next call tries again. */
function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise<IDBDatabase | null>(resolve => {
    try {
      if (typeof indexedDB === 'undefined') { resolve(null); return; }
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => { const db = req.result; db.onclose = () => { dbPromise = null; }; resolve(db); };
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  }).then(db => { if (!db) dbPromise = null; return db; });
  return dbPromise;
}

/** Drops sent photos' base64 from memory; `loadImage` brings a thumbnail back from IndexedDB. */
export function evictImages(ids: string[]): void {
  for (const id of ids) memory.delete(id);
}

export function putImage(id: string, img: { mediaType: string; data: string }): void {
  memory.set(id, img);
  void openDb().then(db => {
    if (!db) return;
    try { db.transaction(STORE, 'readwrite').objectStore(STORE).put(img, id); } catch { /* best-effort */ }
  });
}

export function imageData(id: string): { mediaType: string; data: string } | null {
  return memory.get(id) ?? null;
}

/** A stored photo for a thumbnail: memory first, else IndexedDB (not put back into memory, so sent photos stay evicted). */
export async function loadImage(id: string): Promise<{ mediaType: string; data: string } | null> {
  const hit = memory.get(id);
  if (hit) return hit;
  const db = await openDb();
  if (!db) return null;
  return new Promise(resolve => {
    try {
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).get(id);
      req.onsuccess = () => { const v = req.result as { mediaType: string; data: string } | undefined; resolve(v ?? null); };
      req.onerror = () => resolve(null);
    } catch { resolve(null); }
  });
}

export function clearImages(): void {
  memory.clear();
  void openDb().then(db => { try { db?.transaction(STORE, 'readwrite').objectStore(STORE).clear(); } catch { /* best-effort */ } });
}

/** OBS-PHOTOS (AUD-4): photos whose messages were pruned leave memory and IndexedDB. */
export function deleteImages(ids: string[]): void {
  if (!ids.length) return;
  for (const id of ids) memory.delete(id);
  void openDb().then(db => {
    if (!db) return;
    try { const store = db.transaction(STORE, 'readwrite').objectStore(STORE); for (const id of ids) store.delete(id); } catch { /* best-effort */ }
  });
}

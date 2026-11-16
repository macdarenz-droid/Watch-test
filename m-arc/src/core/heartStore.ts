/**
 * Heart-rate series, separate from the main state key (6.3): a 60-minute
 * session at 1 Hz is ~40 KB, and the main state already holds hundreds of
 * sessions, so the raw series live here instead. Written once per session,
 * at finish, from the already-downsampled 5-second series.
 */
const KEY = 'marc.heart.v1';
const MAX_SESSIONS = 60;

export type HeartSeriesStore = Record<string, Array<[number, number]>>;

const isPlainObject = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isPoint = (p: unknown): p is [number, number] => Array.isArray(p) && p.length === 2 && typeof p[0] === 'number' && typeof p[1] === 'number' && Number.isFinite(p[0]) && Number.isFinite(p[1]);

function read(storage: Pick<Storage, 'getItem'> = localStorage): HeartSeriesStore {
  try {
    const raw = storage.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : {};
    return isPlainObject(v) ? (v as HeartSeriesStore) : {};
  } catch { return {}; }
}

/** Keeps only series that are lists of [time, bpm] number pairs (UI-14). */
function sanitize(v: unknown): HeartSeriesStore {
  if (!isPlainObject(v)) return {};
  const out: HeartSeriesStore = {};
  for (const [id, series] of Object.entries(v)) if (Array.isArray(series)) out[id] = series.filter(isPoint);
  return out;
}

function write(v: HeartSeriesStore, storage: Pick<Storage, 'setItem'> = localStorage): void {
  try { storage.setItem(KEY, JSON.stringify(v)); } catch { /* storage full or unavailable; the series is best-effort */ }
}

export function getSeries(sessionId: string): Array<[number, number]> {
  return read()[sessionId] ?? [];
}

/** Stores a session's series once. Evicts the oldest beyond the cap, oldest by insertion order (LRU). */
export function storeSeries(sessionId: string, series: Array<[number, number]>): void {
  const all = read();
  delete all[sessionId];
  all[sessionId] = series;
  const ids = Object.keys(all);
  if (ids.length > MAX_SESSIONS) for (const id of ids.slice(0, ids.length - MAX_SESSIONS)) delete all[id];
  write(all);
}

export function deleteSeries(sessionId: string): void {
  const all = read();
  if (!(sessionId in all)) return;
  delete all[sessionId];
  write(all);
}

export function exportHeart(): HeartSeriesStore { return read(); }

export function restoreHeart(data: unknown): void {
  if (data === undefined || data === null) return;
  write(sanitize(data));
}

export function clearHeart(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try { storage.removeItem(KEY); } catch { /* nothing stored */ }
}

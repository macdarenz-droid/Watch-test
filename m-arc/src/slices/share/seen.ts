/**
 * Poster comparisons already shared, oldest first, so the next card says something new
 * (`marc.share.seen`). A trace of app use, not a device display setting, so Reset everything
 * clears it (BUG-29) the same way it clears the rest of the app's data.
 */
import { WEIGHT_THINGS } from '@/data/weights';

const SEEN_KEY = 'marc.share.seen';
type Storagelike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export const readSeen = (storage: Pick<Storage, 'getItem'> = localStorage): string[] => {
  try {
    const v: unknown = JSON.parse(storage.getItem(SEEN_KEY) ?? '[]');
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
  } catch { return []; }
};

export const markSeen = (id: string, storage: Storagelike = localStorage): void => {
  try { storage.setItem(SEEN_KEY, JSON.stringify([...readSeen(storage).filter(x => x !== id), id].slice(-WEIGHT_THINGS.length))); } catch { /* repeats just become possible */ }
};

export function clearShareSeen(storage: Pick<Storage, 'removeItem'> = localStorage): void {
  try { storage.removeItem(SEEN_KEY); } catch { /* nothing to delete */ }
}

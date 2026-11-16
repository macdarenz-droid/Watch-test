import { describe, it, expect } from 'vitest';
import { clearShareSeen, markSeen, readSeen } from '@/slices/share/seen';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  } as Storage;
}

describe('share seen (BUG-29)', () => {
  it('clears the seen-comparisons list', () => {
    const st = memoryStorage();
    markSeen('w-25kg', st);
    expect(readSeen(st)).toEqual(['w-25kg']);
    clearShareSeen(st);
    expect(readSeen(st)).toEqual([]);
    expect(st.getItem('marc.share.seen')).toBeNull();
  });
});

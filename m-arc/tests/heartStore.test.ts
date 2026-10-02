import { describe, it, expect, beforeEach } from 'vitest';
import { storeSeries, getSeries, deleteSeries, exportHeart, restoreHeart } from '@/core/heartStore';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
    key: () => null,
    get length() { return map.size; },
  } as Storage;
}

// heartStore reads/writes the real `localStorage` global by default; stub it per test.
beforeEach(() => { (globalThis as { localStorage?: Storage }).localStorage = memoryStorage(); });

describe('heartStore', () => {
  it('round-trips a session series', () => {
    storeSeries('s1', [[0, 120], [5, 130]]);
    expect(getSeries('s1')).toEqual([[0, 120], [5, 130]]);
  });
  it('is empty for an unknown session', () => {
    expect(getSeries('unknown')).toEqual([]);
  });
  it('deletes a series', () => {
    storeSeries('s1', [[0, 120]]);
    deleteSeries('s1');
    expect(getSeries('s1')).toEqual([]);
  });
  it('evicts the oldest session beyond the 60-session cap', () => {
    for (let i = 0; i < 61; i++) storeSeries(`s${i}`, [[0, 100 + i]]);
    expect(Object.keys(exportHeart())).toHaveLength(60);
    expect(getSeries('s0')).toEqual([]);
    expect(getSeries('s60')).toEqual([[0, 160]]);
  });
  it('exports and restores a round trip', () => {
    storeSeries('s1', [[0, 140]]);
    const dump = exportHeart();
    (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
    expect(getSeries('s1')).toEqual([]);
    restoreHeart(dump);
    expect(getSeries('s1')).toEqual([[0, 140]]);
  });
});

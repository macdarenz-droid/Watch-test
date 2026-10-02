import { describe, expect, it } from 'vitest';
import { setLabel } from '@/slices/history/History';
import type { LoggedSet } from '@/core/models';

describe('setLabel (UI-04): a carry/sled set shows distance, time and load together', () => {
  it('a carry with load, distance and time shows all three', () => {
    const st: LoggedSet = { kg: 32, distanceM: 40, durationSec: 35, effort: 'ideal' };
    expect(setLabel(st, 'kg', 'conditioning')).toBe('40 m · 35s @ 32 kg');
  });

  it('a distance-only carry (no load) shows just the distance', () => {
    const st: LoggedSet = { distanceM: 40 };
    expect(setLabel(st, 'kg', 'conditioning')).toBe('40 m');
  });

  it('a timed carry with no distance shows just the time', () => {
    const st: LoggedSet = { kg: 32, durationSec: 35 };
    expect(setLabel(st, 'kg', 'conditioning')).toBe('35s @ 32 kg');
  });

  it('a rep-based conditioning set (burpees) keeps the ordinary load × reps label', () => {
    const st: LoggedSet = { reps: 12, effort: 'ideal' };
    expect(setLabel(st, 'kg', 'conditioning')).toBe('bw × 12 I');
  });

  it('a true hold (duration mode) is unaffected: just its seconds', () => {
    const st: LoggedSet = { durationSec: 45, effort: 'ideal' };
    expect(setLabel(st, 'kg', 'duration')).toBe('45s');
  });

  it('a weighted set is unaffected', () => {
    const st: LoggedSet = { kg: 60, reps: 5, effort: 'ideal' };
    expect(setLabel(st, 'kg', 'weighted')).toBe('60 kg × 5 I');
  });
});

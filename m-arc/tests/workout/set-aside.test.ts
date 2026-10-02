import { describe, it, expect } from 'vitest';
import { setAsideRows } from '@/slices/workout/Train';
import { suggestNext } from '@/brain/progression';
import type { LoggedSet } from '@/core/models';
import { session, sets } from '../helpers';

// BUG-15 (PROGRESSION-F6): the lighter week's and a red day's set cuts reach the Train rows.
describe('Train set rows follow the set cut (BUG-15)', () => {
  const ex = 'lib_barbell_bench_press';
  const pre = [session('2026-09-11', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }])];
  const week = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 0.6, loadFactor: 0.9 };
  const blank = (n: number): LoggedSet[] => Array.from({ length: n }, () => ({}) as LoggedSet);

  it('A4: a lighter week sets the third planned row aside', () => {
    const next = suggestNext(pre, ex, 'lean', '2026-09-15', 3, [], { deload: week });
    expect(setAsideRows(next, blank(3))).toEqual([false, false, true]);
  });
  it('A4: a red day sets the last planned row aside', () => {
    const next = suggestNext(pre, ex, 'lean', '2026-09-15', 3, [], { readiness: { loadAdvice: 'reduce' } });
    expect(setAsideRows(next, blank(3))).toEqual([false, false, true]);
  });
  it('A4: warm-ups sit in front and are never set aside; a filled row counts as usual', () => {
    const next = suggestNext(pre, ex, 'lean', '2026-09-15', 3, [], { deload: week });
    const rows = [{ kind: 'warmup', kg: 40, reps: 8 }, {}, {}, { kg: 65, reps: 8 }] as LoggedSet[];
    expect(setAsideRows(next, rows)).toEqual([false, false, false, false]);
    expect(setAsideRows(next, [{ kind: 'warmup' } as LoggedSet, ...blank(3)])).toEqual([false, false, false, true]);
  });
  it('A4: a normal day keeps every planned row', () => {
    const next = suggestNext(pre, ex, 'lean', '2026-09-15', 3, []);
    expect(setAsideRows(next, blank(3))).toEqual([false, false, false]);
  });
});

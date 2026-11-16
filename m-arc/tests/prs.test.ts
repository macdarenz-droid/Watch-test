import { describe, it, expect } from 'vitest';
import { allRecords, isLiveRecord, recordsInWeek } from '@/brain/prs';
import { session, sets } from './helpers';

const ex = 'lib_barbell_bench_press';
describe('personal records', () => {
  it('first session is a baseline, later heavier load is a record', () => {
    const a = session('2026-09-01', [{ id: ex, sets: sets(60, 8) }]);
    const b = session('2026-09-04', [{ id: ex, sets: sets(62.5, 8) }]);
    expect(allRecords([a])).toHaveLength(0);
    const recs = allRecords([a, b]);
    expect(recs.map(r => r.kind)).toContain('heaviest');
    expect(recs.map(r => r.kind)).toContain('strength');
  });
  it('more reps at the same load is a record, fewer is not', () => {
    const a = session('2026-09-01', [{ id: ex, sets: sets(60, 8) }]);
    const b = session('2026-09-04', [{ id: ex, sets: sets(60, 9) }]);
    const c = session('2026-09-07', [{ id: ex, sets: sets(60, 7) }]);
    const recs = allRecords([a, b, c]);
    expect(recs.filter(r => r.day === '2026-09-04').map(r => r.kind)).toContain('reps_at_load');
    expect(recs.filter(r => r.day === '2026-09-07')).toHaveLength(0);
  });
  it('live check and week filter', () => {
    const a = session('2026-09-14', [{ id: ex, sets: sets(60, 8) }]);
    expect(isLiveRecord([a], ex, { kg: 65, reps: 5 })).toBe(true);
    expect(isLiveRecord([a], ex, { kg: 55, reps: 5 })).toBe(false);
    const b = session('2026-09-16', [{ id: ex, sets: sets(65, 8) }]);
    expect(recordsInWeek([a, b], '2026-09-18')).not.toHaveLength(0);
    expect(recordsInWeek([a, b], '2026-09-25')).toHaveLength(0);
  });
  it('bodyweight exercises record reps', () => {
    const a = session('2026-09-01', [{ id: 'lib_pull_up', sets: sets(0, 6) }]);
    const b = session('2026-09-04', [{ id: 'lib_pull_up', sets: sets(0, 8) }]);
    expect(allRecords([a, b]).map(r => r.kind)).toEqual(['best_reps']);
  });
});

describe('records in the display unit (BR-28)', () => {
  it('an lb user sees the load as typed', async () => {
    const { allRecords } = await import('@/brain/prs');
    const { session } = await import('./helpers');
    const b = 'lib_barbell_bench_press';
    const s = [
      session('2026-09-01', [{ id: b, sets: [{ kg: 92.986, entered: { value: 205, unit: 'lb' }, reps: 5, effort: 'ideal' }] }]),
      session('2026-09-05', [{ id: b, sets: [{ kg: 95.254, entered: { value: 210, unit: 'lb' }, reps: 5, effort: 'ideal' }] }]),
    ];
    const heaviest = allRecords(s, [], 'lb').find(r => r.kind === 'heaviest')!;
    expect(heaviest.detail).toBe('210 lb × 5');
    expect(allRecords(s).find(r => r.kind === 'heaviest')!.detail).toBe('95.25 kg × 5');
  });
});

describe('records and set kinds (F2)', () => {
  it('a heavier warm-up or drop set never sets a record', () => {
    const a = session('2026-09-01', [{ id: ex, sets: sets(60, 8) }]);
    const b = session('2026-09-08', [{ id: ex, sets: [{ kg: 70, reps: 3, kind: 'warmup' }, { kg: 50, reps: 20, kind: 'drop' }, ...sets(60, 8)] }]);
    expect(allRecords([a, b])).toEqual([]);
    expect(isLiveRecord([a], ex, { kg: 70, reps: 8, kind: 'drop' })).toBe(false);
    expect(isLiveRecord([a], ex, { kg: 70, reps: 8 })).toBe(true);
  });
});

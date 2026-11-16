import { describe, expect, it } from 'vitest';
import { deloadTrigger } from '@/brain/deload';
import { session, sets } from './helpers';

const today = '2026-09-18';

describe('deloadTrigger (F3.3)', () => {
  it('does not suggest a deload with no history and clean readiness', () => {
    expect(deloadTrigger([], today, [], []).suggest).toBe(false);
  });

  it('suggests a deload when two or more main lifts have plateaued or declined', () => {
    const days = ['2026-08-20', '2026-08-24', '2026-08-27', '2026-08-31', '2026-09-03', '2026-09-07', '2026-09-10', '2026-09-14', '2026-09-17'];
    const s = days.flatMap((d, i) => [
      session(d, [{ id: 'lib_barbell_bench_press', sets: sets(70 - i * 2.5, 9, 'ideal') }]),
      session(d, [{ id: 'lib_barbell_back_squat', sets: sets(100 - i * 2.5, 9, 'ideal') }], 'split_legs'),
    ]);
    // BUG-14 (COACHRULES-F23, D-A1 point 6): an experienced lifter (24 months); a beginner is skipped.
    const r = deloadTrigger(s, today, [], [], 24);
    expect(r.suggest).toBe(true);
    expect(r.reason).toMatch(/plateaued or slipped/);
  });

  it('suggests a deload when readiness has read red on 3 of the last 5 days', () => {
    // BUG-14 (COACHRULES-F23, D-A1 point 6): the offer needs 4 weeks of logged training first.
    const month = ['2026-08-20', '2026-09-17'].map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal') }]));
    const r = deloadTrigger(month, today, [], ['red', 'green', 'red', 'amber', 'red']);
    expect(r.suggest).toBe(true);
    expect(r.reason).toMatch(/red on three or more/);
  });

  it('does not suggest a deload for readiness red on only 2 of the last 5 days', () => {
    const r = deloadTrigger([], today, [], ['red', 'green', 'red', 'amber', 'green']);
    expect(r.suggest).toBe(false);
  });
});

describe('deloadTrigger over-band rule (D9)', () => {
  it('two weeks above the band alone is not a reason for a lighter week', () => {
    const s = ['2026-09-08', '2026-09-10', '2026-09-14', '2026-09-16'].map((d, i) => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(60 + i * 2.5, 8, 'ideal', 6) }]));
    expect(deloadTrigger(s, today, [], []).suggest).toBe(false);
  });
});

// BUG-15 (PROGRESSION-F4, F26, COACHRULES-F8): the lighter week's own sessions never bring the
// offer back, and the volume triggers read completed weeks only.
describe('deloadTrigger after a lighter week (BUG-15)', () => {
  const bench = 'lib_barbell_bench_press';
  const squat = 'lib_barbell_back_squat';
  const week = { startDay: '2026-09-08', endDay: '2026-09-14', reason: 'test', setFactor: 0.6, loadFactor: 0.9 };
  // Eight weeks of slow real progress (about 2.5 %), then the lighter week at 0.9 × the loads.
  const days = ['2026-07-14', '2026-07-21', '2026-07-28', '2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25', '2026-09-01'];
  const b = [80, 80, 80.5, 81, 81, 81.5, 82, 82];
  const q = [120, 120, 121, 121, 122, 122, 123, 123];
  const normal = days.flatMap((d, i) => [
    session(d, [{ id: bench, sets: sets(b[i]!, 8, 'ideal') }]),
    session(d, [{ id: squat, sets: sets(q[i]!, 8, 'ideal') }], 'split_legs'),
  ]);
  const lighter = ['2026-09-09', '2026-09-12'].flatMap(d => [
    session(d, [{ id: bench, sets: sets(74, 8, 'easy', 2) }]),
    session(d, [{ id: squat, sets: sets(110.5, 8, 'easy', 2) }], 'split_legs'),
  ]);

  it('A3: no new offer the day after the week ends', () => {
    const r = deloadTrigger([...normal, ...lighter], '2026-09-15', [], [], 24, week);
    expect(r.suggest).toBe(false);
  });

  it('A3: red readiness 3 of 5 days still offers one, as a safety signal', () => {
    const r = deloadTrigger([...normal, ...lighter], '2026-09-15', [], ['red', 'red', 'red', 'green', 'green'], 24, week);
    expect(r.suggest).toBe(true);
    expect(r.reason).toMatch(/red on three or more/);
  });

  it('A6: trigger (b) ignores the unfinished current week', () => {
    // Effort drifting harder on two progressing lifts; the completed weeks are flat and only this
    // week's Monday session makes volume look like it is climbing.
    const mondays = ['2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'];
    const hist = mondays.flatMap((d, i) => {
      const effort = i < 2 ? 'easy' : 'max';
      const n = i === 3 ? 8 : 3;
      return [
        session(d, [{ id: bench, sets: sets(80 + i * 2.5, 8, effort, n) }]),
        session(addDays(d, 2), [{ id: bench, sets: sets(81 + i * 2.5, 8, effort, 3) }]),
        session(d, [{ id: squat, sets: sets(100 + i * 5, 8, effort, n) }], 'split_legs'),
        session(addDays(d, 2), [{ id: squat, sets: sets(102 + i * 5, 8, effort, 3) }], 'split_legs'),
      ];
    }).filter(s => s.day <= '2026-09-07');
    const r = deloadTrigger([session('2026-07-01', [{ id: bench, sets: sets(60, 8, 'ideal') }]), ...hist], '2026-09-07', [], [], 24);
    expect(r.reason).toBe('');
    expect(r.suggest).toBe(false);
  });
});

function addDays(day: string, n: number): string {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// BUG-15 review item 4: trigger (c) reads completed weeks only.
describe('deloadTrigger (c) ignores the unfinished current week (BUG-15)', () => {
  it('last week and the unfinished week over the band, with a stalled main lift: no offer', () => {
    const bench = 'lib_barbell_bench_press';
    const squat = 'lib_barbell_back_squat';
    // A flat (stalled) bench, squat progressing, low weekly volume; then last week and this
    // unfinished week pile chest sets well above the band. Only last week is a completed week
    // over the band, so (c)'s "two weeks straight" is not met.
    const weekly = ['2026-07-06', '2026-07-13', '2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'];
    const hist = weekly.flatMap((d, i) => [
      session(d, [{ id: bench, sets: sets(80, 8, 'ideal', 3) }]),
      session(d, [{ id: squat, sets: sets(100 + i * 5, 8, 'ideal', 3) }], 'split_legs'),
    ]);
    const heavy = ['2026-09-08', '2026-09-10', '2026-09-14', '2026-09-16'].map(d => session(d, [{ id: bench, sets: sets(80, 8, 'ideal', 20) }]));
    const r = deloadTrigger([...hist, ...heavy], '2026-09-16', [], [], 24);
    expect(r.reason).toBe('');
  });
});

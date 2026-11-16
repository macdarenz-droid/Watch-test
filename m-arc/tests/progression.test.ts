import { describe, it, expect } from 'vitest';
import { suggestNext } from '@/brain/progression';
import { session, sets } from './helpers';

const ex = 'lib_barbell_bench_press';
const today = '2026-09-18';
describe('progression', () => {
  it('starts light with no history', () => {
    const s = suggestNext([], ex, 'lean', today);
    expect(s.mode).toBe('start');
    expect(s.kg).toBe(20);
  });
  it('bodyweight start has no load', () => {
    expect(suggestNext([], 'lib_push_up', 'lean', today).kg).toBeNull();
  });
  it('adds a rep when under the top of the range', () => {
    const s = suggestNext([session('2026-09-15', [{ id: ex, sets: sets(60, 8) }])], ex, 'lean', today);
    expect(s.mode).toBe('hold');
    expect(s.reps).toEqual([9, 9]);
  });
  it('confirms once at the top, then increases (two for two)', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 12) }]);
    expect(suggestNext([a], ex, 'lean', today).mode).toBe('confirm');
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 12) }]);
    const s = suggestNext([a, b], ex, 'lean', today);
    expect(s.mode).toBe('increase');
    expect(s.kg).toBe(62.5);
  });
  it('never increases on max effort', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 12, 'max') }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 12, 'max') }]);
    expect(suggestNext([a, b], ex, 'lean', today).mode).toBe('hold');
  });
  it('reduces after two under-range max sessions', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 4, 'max') }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 4, 'max') }]);
    const s = suggestNext([a, b], ex, 'lean', today);
    expect(s.mode).toBe('reduce');
    expect(s.kg).toBe(57.5);
  });
  it('asks for effort when ratings are missing', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 8, null) }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 8, null) }]);
    expect(suggestNext([a, b], ex, 'lean', today).mode).toBe('confirm_effort');
  });
  it('re-entry after a long gap', () => {
    const a = session('2026-07-01', [{ id: ex, sets: sets(60, 12) }]);
    const s = suggestNext([a], ex, 'lean', today);
    expect(s.mode).toBe('reentry');
    // ADAPT-3 (A-4): 79 days is past 8 weeks, so the return is 10% lighter (was 60, the harm A-4 names).
    expect(s.kg).toBe(54);
  });
  it('a clearly declining lift gets an easier week at the same load', () => {
    const days = ['2026-08-20', '2026-08-24', '2026-08-27', '2026-08-31', '2026-09-03', '2026-09-07', '2026-09-10', '2026-09-14', '2026-09-17'];
    const s = days.map((d, i) => session(d, [{ id: ex, sets: sets(70 - i * 2.5, 9, i === 8 ? 'max' : 'ideal') }]));
    const r = suggestNext(s, ex, 'lean', today);
    expect(r.mode).toBe('plateau');
    expect(r.kg).toBe(50);
    expect(r.reason).toMatch(/slipped/);
  });
  it('duration exercises add time', () => {
    const a = session('2026-09-15', [{ id: 'lib_plank', sets: [{ durationSec: 40, effort: 'ideal' }] }]);
    const s = suggestNext([a], 'lib_plank', 'lean', today);
    expect(s.mode).toBe('duration');
    expect(s.sets[0]!.durationSec).toBe(45);
  });

  describe('readiness context (F2.1)', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 12) }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 12) }]);
    it('red readiness holds the load and drops a set instead of increasing', () => {
      const s = suggestNext([a, b], ex, 'lean', today, 3, [], { readiness: { loadAdvice: 'reduce', reason: 'Readiness is red today.' } });
      expect(s.mode).toBe('hold');
      expect(s.sets.length).toBe(2);
      expect(s.reason).toBe('Readiness is red today.');
    });
    it('amber (no_increase) holds at confirm instead of increasing', () => {
      const s = suggestNext([a, b], ex, 'lean', today, 3, [], { readiness: { loadAdvice: 'no_increase' } });
      expect(s.mode).toBe('confirm');
    });
    it('low muscle recovery also blocks the increase', () => {
      const s = suggestNext([a, b], ex, 'lean', today, 3, [], { recoveryPct: 40 });
      expect(s.mode).toBe('confirm');
    });
    it('normal readiness does not interfere with a genuine increase', () => {
      const s = suggestNext([a, b], ex, 'lean', today, 3, [], { readiness: { loadAdvice: 'normal' }, recoveryPct: 90 });
      expect(s.mode).toBe('increase');
    });
  });

  describe('deload context (F3.3)', () => {
    const a = session('2026-09-12', [{ id: ex, sets: sets(60, 12, 'ideal', 3) }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(60, 12, 'ideal', 3) }]);
    const deload = { startDay: '2026-09-16', endDay: '2026-09-22', reason: 'test', setFactor: 0.6, loadFactor: 0.9 };
    it('cuts sets and load and names the day of the week', () => {
      const s = suggestNext([a, b], ex, 'lean', today, 3, [], { deload });
      expect(s.mode).toBe('deload');
      expect(s.kg).toBe(54);
      expect(s.sets.length).toBe(2);
      expect(s.reason).toBe('Lighter week, day 3 of 7.');
    });
    it('takes priority over a genuine increase', () => {
      const s = suggestNext([a, b], ex, 'lean', today, 3, [], { deload, readiness: { loadAdvice: 'normal' }, recoveryPct: 90 });
      expect(s.mode).toBe('deload');
    });
  });
});

describe('carries progress by distance or time (QA-R6-5)', () => {
  const id = 'lib_farmer_s_carry';
  it('a carry logged as 32 kg × 40 m aims 5 m further at the same load, never "1 reps"', () => {
    const h = [session('2026-09-10', [{ id, sets: [{ kg: 32, distanceM: 40, effort: 'ideal' }, { kg: 32, distanceM: 35, effort: 'ideal' }] }])];
    const n = suggestNext(h, id, 'lean', '2026-09-14');
    expect(n.target).toBe('32 kg · 45 m');
    expect(n.target).not.toMatch(/reps/);
    expect(n.mode).toBe('distance');
  });
  it('a max-effort carry repeats its distance; a timed one adds five seconds', () => {
    const max = [session('2026-09-10', [{ id, sets: [{ kg: 32, distanceM: 40, effort: 'max' }] }])];
    expect(suggestNext(max, id, 'lean', '2026-09-14').target).toBe('32 kg · 40 m');
    const timed = [session('2026-09-10', [{ id, sets: [{ kg: 24, durationSec: 60, effort: 'ideal' }] }])];
    expect(suggestNext(timed, id, 'lean', '2026-09-14').target).toBe('24 kg · 65s');
  });
  it('QA3-12: a timed carry or sled logged with reps still gets a duration goal, never a rep one', () => {
    const carry = [session('2026-09-10', [{ id, sets: [{ kg: 24, durationSec: 60, reps: 8, effort: 'ideal' }] }])];
    const cn = suggestNext(carry, id, 'lean', '2026-09-14');
    expect(cn.mode).toBe('duration');
    expect(cn.target).toBe('24 kg · 65s');
    const sled = [session('2026-09-10', [{ id: 'lib_sled_push', sets: [{ kg: 40, distanceM: 20, reps: 10, effort: 'ideal' }] }])];
    const sn = suggestNext(sled, 'lib_sled_push', 'lean', '2026-09-14');
    expect(sn.mode).toBe('distance');
    expect(sn.target).toBe('40 kg · 25 m');
  });
});

describe('carries in lb and timed rep moves (QA2-FE-2, QA2-FE-7, QA2-FE-8)', () => {
  it('a carry done with 70 lb dumbbells targets 70 lb, not 31.751 kg', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 31.751, entered: { value: 70, unit: 'lb' }, distanceM: 40, effort: 'ideal' }] }])];
    expect(suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb') }).target).toBe('70 lb · 45 m');
    expect(suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14').target).not.toMatch(/31\.751/);
  });
  it('burpees logged with reps and seconds keep a rep goal', () => {
    const h = [session('2026-09-10', [{ id: 'lib_burpee', sets: [{ reps: 15, durationSec: 45, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_burpee', 'lean', '2026-09-14');
    expect(n.target).toBe('16 reps');
  });
});

describe('QA3-3, QA3-11: a conditioning load never snaps across the ladder', () => {
  it('a trap-bar carry heavier than the dumbbell rack keeps its logged load, not capped at 60 kg', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 100, distanceM: 40, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg') });
    expect(n.target).toBe('100 kg · 45 m');
    expect(n.kg).toBe(100);
  });
  it('a lighter-week carry snaps down, never up towards last time\'s load', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 32, distanceM: 40, effort: 'ideal' }] }])];
    const deload = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 1, loadFactor: 0.9 };
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg'), deload });
    // half(32 * 0.9) = 29 kg, unreachable on the 2.5 kg-step ladder; 'nearest' rounds up to 30, 'down' picks 27.5.
    expect(n.kg).toBe(27.5);
  });
});

describe('QA3-3b: above the rack, an lb user still sees their own clean number', () => {
  it('a 225 lb trap-bar carry reads as 225 lb, not a rounded-kg conversion', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 102.058, entered: { value: 225, unit: 'lb' }, distanceM: 40, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb') });
    expect(n.target).toBe('225 lb · 45 m');
    expect(n.value).toBe(225);
    expect(n.unit).toBe('lb');
  });
});

describe('QA3-11b: carries snap down only for a genuine reduction, never in a normal week', () => {
  it('a 75 lb carry on the lb ladder stays 75', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 34.019, entered: { value: 75, unit: 'lb' }, distanceM: 40, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb') });
    expect(n.value).toBe(75);
  });
  // BUG-11 (owner, 2026-09-27): a load already logged for the exercise stays loadable for every
  // activity, carries included, so a logged 32 kg carry is no longer moved to a rung at all.
  it('a normal-week 32 kg carry keeps the 32 kg the person really carried, not forced down to 30', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 32, distanceM: 40, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg') });
    expect(n.kg).toBe(32);
  });
  it('a normal-week carry target of 32 kg that was never logged rounds to its nearest rung (32.5), not forced down to 30', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 30, distanceM: 40, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg'), loadFactor: 32 / 30 });
    expect(n.kg).toBe(32.5);
  });
  it('an Escobar ×1.05 increase on a 30 kg carry is not lost to a forced-down snap', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 30, distanceM: 40, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg'), loadFactor: 1.05 });
    expect(n.kg).toBe(32.5);
  });
  it('an Escobar ×0.95 cut on a 25 kg DB bench is not rounded back up', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_dumbbell_bench_press', sets: [{ kg: 25, reps: 8, effort: 'ideal' }] }])];
    const n = suggestNext(h, 'lib_dumbbell_bench_press', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg'), loadFactor: 0.95 });
    expect(n.kg).toBe(22.5);
  });
  it('a lighter-week 32 kg carry still snaps down to 27.5 (QA3-11)', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 32, distanceM: 40, effort: 'ideal' }] }])];
    const deload = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 1, loadFactor: 0.9 };
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'kg'), deload });
    expect(n.kg).toBe(27.5);
  });
});

describe('QA3-12b: a custom or non-listed conditioning move still gets its own distance/time goal', () => {
  it('a custom carry (no library id) progresses by distance, then time, even logged with reps too', async () => {
    const { makeCustomExercise } = await import('@/core/exercises');
    const yoke = makeCustomExercise({ id: 'custom_yoke_walk', name: 'Yoke Walk', equipment: 'Other', primary: ['quads'], mode: 'conditioning' });
    const byDistance = [session('2026-09-10', [{ id: yoke.id, sets: [{ kg: 100, distanceM: 20, effort: 'ideal' }] }])];
    expect(suggestNext(byDistance, yoke.id, 'lean', '2026-09-14', 3, [yoke]).target).toBe('100 kg · 25 m');
    const byTime = [session('2026-09-10', [{ id: yoke.id, sets: [{ kg: 100, durationSec: 30, effort: 'ideal' }] }])];
    expect(suggestNext(byTime, yoke.id, 'lean', '2026-09-14', 3, [yoke]).target).toBe('100 kg · 35s');
    const withReps = [session('2026-09-10', [{ id: yoke.id, sets: [{ kg: 100, durationSec: 30, reps: 8, effort: 'ideal' }] }])];
    expect(suggestNext(withReps, yoke.id, 'lean', '2026-09-14', 3, [yoke]).mode).toBe('duration');
  });
  it('library conditioning moves outside CARRY_OR_SLED_IDS still get a distance/time goal when logged that way', () => {
    const ropes = [session('2026-09-10', [{ id: 'lib_battle_ropes', sets: [{ durationSec: 30, effort: 'ideal' }] }])];
    expect(suggestNext(ropes, 'lib_battle_ropes', 'lean', '2026-09-14').target).toBe('35s');
    const crawl = [session('2026-09-10', [{ id: 'lib_bear_crawl', sets: [{ distanceM: 20, effort: 'ideal' }] }])];
    expect(suggestNext(crawl, 'lib_bear_crawl', 'lean', '2026-09-14').target).toBe('25 m');
  });
});

describe('QA3-3c: above the rack, a scaled lb carry still lands on a clean number', () => {
  const h = [session('2026-09-10', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 102.058, entered: { value: 225, unit: 'lb' }, distanceM: 40, effort: 'ideal' }] }])];
  it('a lighter week (0.9) reads as 200 lb, not a rounded-kg conversion', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const deload = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 1, loadFactor: 0.9 };
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb'), deload });
    expect(n.target).toBe('200 lb · 40 m');
  });
  it('an Escobar ×0.95 cut reads as 210 lb', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb'), loadFactor: 0.95 });
    expect(n.target).toBe('210 lb · 45 m');
  });
  it('an Escobar ×1.05 increase reads as 235 lb', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext(h, 'lib_farmer_s_carry', 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb'), loadFactor: 1.05 });
    expect(n.target).toBe('235 lb · 45 m');
  });
});

describe('F13 Part B: a carry logged as kg × reps shows its weight in the target', () => {
  const id = 'lib_farmer_s_carry';

  it('adds a rep at the same load', () => {
    const h = [session('2026-09-10', [{ id, sets: [{ kg: 32, reps: 2, effort: 'ideal' }] }])];
    const n = suggestNext(h, id, 'lean', '2026-09-14');
    expect(n.target).toBe('32 kg · 3 reps');
    expect(n.kg).toBe(32);
    expect(n.mode).toBe('reps');
  });

  it('re-entry after 44 days repeats the load, with a rep range', () => {
    const h = [session('2026-08-01', [{ id, sets: [{ kg: 32, reps: 2, effort: 'ideal' }] }])];
    const n = suggestNext(h, id, 'lean', '2026-09-14');
    expect(n.target).toMatch(/^32 kg · \d+–\d+ reps$/);
    expect(n.kg).toBe(32);
  });

  it('a deload week scales the kg down, no equipment', () => {
    const h = [session('2026-09-10', [{ id, sets: [{ kg: 32, reps: 2, effort: 'ideal' }] }])];
    const deload = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 1, loadFactor: 0.9 };
    const n = suggestNext(h, id, 'lean', '2026-09-15', 3, [], { deload });
    expect(n.target).toBe('29 kg · 2 reps · easy');
    expect(n.kg).toBe(29);
  });

  it('a lb-equipment carry snaps its target to the ladder', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-10', [{ id, sets: [{ kg: 31.751, entered: { value: 70, unit: 'lb' }, reps: 2, effort: 'ideal' }] }])];
    const n = suggestNext(h, id, 'lean', '2026-09-14', 3, [], { equipment: defaultProfile('Dumbbells', 'lb') });
    expect(n.target).toBe('70 lb · 3 reps');
  });

  it('bodyweight and assisted moves, and a carry with no kg logged, are unaffected pins', () => {
    const sled = suggestNext([session('2026-09-10', [{ id: 'lib_sled_push', sets: [{ reps: 10, effort: 'ideal' }] }])], 'lib_sled_push', 'lean', '2026-09-14');
    expect(sled.target).toBe('11 reps');
    expect(sled.kg).toBeNull();
    const pushup = suggestNext([session('2026-09-10', [{ id: 'lib_push_up', sets: sets(0, 10) }])], 'lib_push_up', 'lean', '2026-09-14');
    expect(pushup.target).toBe('11 reps');
    expect(pushup.kg).toBeNull();
  });
});

describe('BUG-11: a load the user really lifted is never snapped away', () => {
  const lat = 'lib_dumbbell_lateral_raise';
  const last = [{ kg: 7, reps: 13, effort: 'ideal' as const }, { kg: 7, reps: 13, effort: 'ideal' as const }, { kg: 7, reps: 12, effort: 'max' as const }];

  it('A1: no dumbbell profile saved, last 7x13 with a max set → 7 kg x 14, not 6 kg', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext([session('2026-09-15', [{ id: lat, sets: last }])], lat, 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'kg') });
    expect(n.mode).toBe('hold');
    expect(n.kg).toBe(7);
    expect(n.value).toBe(7);
    expect(n.target).toBe('7 kg · 14 reps');
    expect(n.sets.every(x => x.kg === 7)).toBe(true);
    expect(n.snappedFromKg).toBeUndefined();
  });

  it('A1: the logged lb value is kept when the gym profile is in lb', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const lbSet = { kg: 7.711, entered: { value: 17, unit: 'lb' as const }, reps: 12, effort: 'max' as const };
    const n = suggestNext([session('2026-09-15', [{ id: lat, sets: [lbSet, lbSet] }])], lat, 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'lb') });
    expect(n.target).toBe('17 lb · 13 reps');
  });

  it('A2: an increase from a logged off-ladder load still snaps up to the rack', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const top = sets(7, 15, 'ideal');
    const n = suggestNext([session('2026-09-12', [{ id: lat, sets: top }]), session('2026-09-15', [{ id: lat, sets: top }])], lat, 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'kg') });
    expect(n.mode).toBe('increase');
    expect(n.kg).toBe(8);
    expect(n.snappedFromKg).toBeUndefined();
  });

  it('A3: a first-time off-ladder start still snaps to the rack, and says so', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext([], lat, 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'kg') });
    expect(n.mode).toBe('start');
    expect(n.kg).toBe(2);
    expect(n.snappedFromKg).toBe(2.5);
    expect(n.reason).toMatch(/nearest weight your equipment has/);
  });

  it('a load logged in another unit is not treated as loadable on this profile', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext([session('2026-09-15', [{ id: lat, sets: last }])], lat, 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'lb') });
    expect(n.unit).toBe('lb');
    expect(n.value).toBe(15);
    expect(n.snappedFromKg).toBe(7);
    expect(n.reason).toMatch(/Moved to 15 lb, the nearest weight your equipment has/);
  });
});

describe('BUG-11: every equipment kind and unit keeps a load already logged for that exercise', () => {
  const kinds: Array<[string, string, number, 'kg' | 'lb']> = [
    ['kettlebell', 'lib_kettlebell_swing', 16, 'kg'],
    ['dumbbell / kettlebell', 'lib_goblet_squat', 16, 'kg'],
    ['machine stack', 'lib_machine_chest_press', 42, 'kg'],
    ['cable', 'lib_cable_fly', 17, 'kg'],
    ['barbell and plates', 'lib_barbell_bench_press', 61, 'kg'],
    ['smith machine', 'lib_smith_machine_bench_press', 61, 'kg'],
    ['bodyweight + added load (dip belt)', 'lib_weighted_dip', 11, 'kg'],
    ['barbell and plates, lb', 'lib_barbell_bench_press', 137, 'lb'],
    ['machine stack, lb', 'lib_machine_chest_press', 72, 'lb'],
    ['kettlebell, lb', 'lib_kettlebell_swing', 53, 'lb'],
    ['cable, lb', 'lib_cable_fly', 17, 'lb'],
  ];
  it.each(kinds)('%s: a hold at the logged %s load stays there', async (_kind, id, value, unit) => {
    const { defaultProfile, loadableValues } = await import('@/brain/units');
    const { findExercise } = await import('@/core/exercises');
    const { displayToKg } = await import('@/core/units');
    const profile = defaultProfile(findExercise(id)!.equipment, unit);
    // The load really is off this equipment's built-in steps, so the old snap would have moved it.
    expect(loadableValues(profile)).not.toContain(value);
    const kg = unit === 'kg' ? value : displayToKg(value, 'lb');
    const set = { kg, ...(unit === 'lb' ? { entered: { value, unit } } : {}), reps: 8, effort: 'max' as const };
    const n = suggestNext([session('2026-09-15', [{ id, sets: [set, set, set] }])], id, 'lean', today, 3, [], { equipment: profile });
    expect(n.mode).toBe('hold');
    expect(n.kg).toBe(kg);
    expect(n.value).toBe(value);
    expect(n.target.startsWith(`${value} ${unit} · `)).toBe(true);
    expect(n.sets.every(x => x.kg === kg)).toBe(true);
    expect(n.snappedFromKg).toBeUndefined();
  });

  it('a loaded carry keeps its logged 16 kg (conditioning)', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext([session('2026-09-15', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 16, distanceM: 40, effort: 'ideal' }] }])], 'lib_farmer_s_carry', 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'kg') });
    expect(n.target).toBe('16 kg · 45 m');
  });

  it('a bodyweight move with added load has no load target to snap (reps progress)', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const n = suggestNext([session('2026-09-15', [{ id: 'lib_pull_up', sets: sets(7, 6) }])], 'lib_pull_up', 'lean', today, 3, [], { equipment: defaultProfile('Bodyweight', 'kg') });
    expect(n.kg).toBeNull();
    expect(n.target).toBe('7 reps');
  });

  it.each([
    ['machine stack', 'lib_machine_chest_press', 42, 45],
    ['barbell and plates', 'lib_barbell_bench_press', 61, 65],
    ['kettlebell', 'lib_kettlebell_swing', 16, 17.5],
  ] as Array<[string, string, number, number]>)('%s: an increase from a logged %s kg still snaps up to the rack, to %s kg', async (_kind, id, logged, up) => {
    const { defaultProfile } = await import('@/brain/units');
    const { findExercise } = await import('@/core/exercises');
    const top = sets(logged, 15, 'ideal');
    const n = suggestNext([session('2026-09-12', [{ id, sets: top }]), session('2026-09-15', [{ id, sets: top }])], id, 'lean', today, 3, [], { equipment: defaultProfile(findExercise(id)!.equipment, 'kg') });
    expect(n.mode).toBe('increase');
    expect(n.kg).toBe(up);
  });

  it('a hold-type target exactly between two rungs goes up to the heavier one, never a step back', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const lat = 'lib_dumbbell_lateral_raise';
    // Logged 6 kg; an Escobar ×7/6 adjustment makes 7 kg, which was never logged and sits between 6 and 8.
    const n = suggestNext([session('2026-09-15', [{ id: lat, sets: sets(6, 10, 'max') }])], lat, 'lean', today, 3, [], { equipment: defaultProfile('Dumbbells', 'kg'), loadFactor: 7 / 6 });
    expect(n.kg).toBe(8);
    expect(n.snappedFromKg).toBe(7);
    expect(n.reason).toMatch(/Moved to 8 kg, the nearest weight your equipment has, so the reps may need to change/);
  });
});

// BUG-15 (PROGRESSION-F1/F4/F5/F6, COACHRULES-F7): the lighter week cuts from a fixed pre-week
// base, ends in a hold at the pre-week level, and its sessions are never later evidence.
describe('lighter week: in-week and post-week histories (BUG-15)', () => {
  const week = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 0.6, loadFactor: 0.9 };
  const pre = [
    session('2026-09-08', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]),
    session('2026-09-11', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]),
  ];
  // What the old rule told the lifter to do: each session cut the one before.
  const inWeek = [
    session('2026-09-14', [{ id: ex, sets: sets(65.5, 8, 'easy', 2) }]),
    session('2026-09-16', [{ id: ex, sets: sets(59, 8, 'easy', 1) }]),
  ];

  it('A1: every in-week session targets 0.9 × and 0.6 × the pre-week level, with no compounding', () => {
    for (const [today, hist] of [['2026-09-14', pre], ['2026-09-16', [...pre, inWeek[0]!]], ['2026-09-18', [...pre, ...inWeek]]] as const) {
      const s = suggestNext([...hist], ex, 'lean', today, 3, [], { deload: week, lastDeload: week });
      expect(s.mode).toBe('deload');
      expect(s.kg).toBe(65.5); // half(72.5 × 0.9)
      expect(s.sets.length).toBe(2); // round(3 × 0.6)
      expect(s.sets.every(x => x.kg === 65.5)).toBe(true);
    }
  });

  it('A1: with a barbell profile every in-week session snaps down to the same loadable 65 kg', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const equipment = defaultProfile('Barbell', 'kg');
    const a = suggestNext([...pre, inWeek[0]!], ex, 'lean', '2026-09-16', 3, [], { deload: week, equipment });
    const b = suggestNext([...pre, ...inWeek], ex, 'lean', '2026-09-18', 3, [], { deload: week, equipment });
    expect([a.kg, b.kg]).toEqual([65, 65]);
    expect([a.sets.length, b.sets.length]).toEqual([2, 2]);
  });

  it('A1: a lift first logged inside the week repeats that load, never cuts it again', () => {
    const only = [session('2026-09-14', [{ id: ex, sets: sets(60, 8, 'easy', 2) }])];
    const s = suggestNext(only, ex, 'lean', '2026-09-16', 3, [], { deload: week });
    expect(s.kg).toBe(60);
    expect(s.sets.length).toBe(2);
  });

  it('A2: the first session after the week holds the pre-week level, not the lighter loads', () => {
    const s = suggestNext([...pre, ...inWeek], ex, 'lean', '2026-09-21', 3, [], { lastDeload: week });
    expect(s.mode).toBe('hold');
    expect(s.kg).toBe(72.5);
    expect(s.reps).toEqual([8, 8]);
    expect(s.sets.length).toBe(3);
    expect(s.reason).toMatch(/lighter week is over/);
    // After that first session, progress resumes from the pre-week sessions plus the new one.
    const back = session('2026-09-22', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]);
    const n = suggestNext([...pre, ...inWeek, back], ex, 'lean', '2026-09-24', 3, [], { lastDeload: week });
    expect([n.mode, n.kg, n.reps]).toEqual(['hold', 72.5, [9, 9]]);
  });

  it('A3: lighter sessions are not decline evidence: two clean tops after the week earn the increase', () => {
    const d = { startDay: '2026-09-07', endDay: '2026-09-13', reason: 'test', setFactor: 0.6, loadFactor: 0.9 };
    const days = ['2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'];
    const hist = [
      ...days.map(day => session(day, [{ id: ex, sets: sets(100, 12, 'max', 3) }])),
      session('2026-09-08', [{ id: ex, sets: sets(90, 8, 'easy', 2) }]),
      session('2026-09-11', [{ id: ex, sets: sets(90, 8, 'easy', 2) }]),
      session('2026-09-15', [{ id: ex, sets: sets(100, 12, 'ideal', 3) }]),
      session('2026-09-18', [{ id: ex, sets: sets(100, 12, 'ideal', 3) }]),
    ];
    const s = suggestNext(hist, ex, 'lean', '2026-09-21', 3, [], { lastDeload: d });
    expect(s.mode).toBe('increase');
    expect(s.kg).toBe(102.5);
  });

  it('A4: a lighter week and a red day mark their set list as a cut', () => {
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { deload: week }).cutSets).toBe(true);
    const red = suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { readiness: { loadAdvice: 'reduce' } });
    expect(red.cutSets).toBe(true);
    expect(red.sets.length).toBe(2);
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, []).cutSets).toBeUndefined();
  });

  it('A5: a lighter week, an amber or red day and a cut factor hold the load for live advice', () => {
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { deload: week }).holdLoad).toBe(true);
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { readiness: { loadAdvice: 'no_increase' } }).holdLoad).toBe(true);
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { readiness: { loadAdvice: 'reduce' } }).holdLoad).toBe(true);
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { loadFactor: 0.9 }).holdLoad).toBe(true);
    expect(suggestNext(pre, ex, 'lean', '2026-09-14', 3, [], { readiness: { loadAdvice: 'normal' } }).holdLoad).toBeUndefined();
  });
});

// BUG-15 review items 1 and 3.
describe('lighter week: chained weeks and the set factor (BUG-15 review)', () => {
  const week1 = { startDay: '2026-09-14', endDay: '2026-09-20', reason: 'test', setFactor: 0.6, loadFactor: 0.9 };
  const pre = [
    session('2026-09-08', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]),
    session('2026-09-11', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]),
  ];
  const inWeek1 = ['2026-09-14', '2026-09-16', '2026-09-18'].map(d => session(d, [{ id: ex, sets: sets(65.5, 8, 'easy', 2) }]));

  it('item 1: a second week straight after the first keeps the original pre-week base', async () => {
    const { chainedStartDay } = await import('@/brain/deload');
    const week2 = { ...week1, startDay: chainedStartDay(week1, [...pre, ...inWeek1], '2026-09-21'), endDay: '2026-09-27' };
    expect(week2.startDay).toBe('2026-09-14');
    const inWeek2 = [...pre, ...inWeek1, session('2026-09-21', [{ id: ex, sets: sets(65.5, 8, 'easy', 2) }])];
    const s = suggestNext(inWeek2, ex, 'lean', '2026-09-22', 3, [], { deload: week2, lastDeload: week2 });
    expect([s.kg, s.sets.length, s.reason]).toEqual([65.5, 2, 'Lighter week, day 2 of 7.']);
    // The week after holds the original pre-week level, not week 1's lighter one.
    const after = suggestNext(inWeek2, ex, 'lean', '2026-09-28', 3, [], { lastDeload: week2 });
    expect([after.mode, after.kg, after.sets.length]).toEqual(['hold', 72.5, 3]);
  });

  it('item 1: a session after the first week re-establishes the level, so the next week starts fresh', async () => {
    const { chainedStartDay } = await import('@/brain/deload');
    const back = session('2026-09-22', [{ id: ex, sets: sets(72.5, 8, 'ideal', 3) }]);
    expect(chainedStartDay(week1, [...pre, ...inWeek1, back], '2026-09-24')).toBe('2026-09-24');
    expect(chainedStartDay(null, pre, '2026-09-24')).toBe('2026-09-24');
  });

  it('item 3: the 0.6 set factor: five pre-week sets give 3 (0.8 gives 4), six give 4 (0.5 gives 3)', () => {
    // round(5 × 0.5) is also 3 (2.5 rounds up), so the six-set case is what tells 0.5 from 0.6.
    const n = (count: number) => suggestNext([session('2026-09-11', [{ id: ex, sets: sets(72.5, 8, 'ideal', count) }])], ex, 'lean', '2026-09-15', count, [], { deload: week1 }).sets.length;
    expect([n(5), n(6)]).toEqual([3, 4]);
  });
});

describe('LT-2: increases and step-downs choose a rung and re-solve the reps', () => {
  const db = 'lib_dumbbell_bench_press';
  const rack = { unit: 'kg' as const, ladder: [25, 30, 32.5, 35], source: 'user' as const, updatedAt: '' };
  const twice = (id: string, kg: number, reps: number) => [session('2026-09-12', [{ id, sets: sets(kg, reps) }]), session('2026-09-15', [{ id, sets: sets(kg, reps) }])];

  it('A2 lean: 25 kg × 12 twice on 25/30/32.5/35 → keep 25 kg and earn 13 reps (mode earn)', () => {
    const n = suggestNext(twice(db, 25, 12), db, 'lean', today, 3, [], { equipment: rack });
    expect(n).toMatchObject({ mode: 'earn', kg: 25, value: 25, reps: [13, 13], repWindow: [13, 13], target: '25 kg · 13 reps' });
    expect(n.reason).toBe('No smaller step here. Keep 25 kg and work up to 13 reps; then 30 kg for 6 is ready.');
    expect(n.sets.every(x => x.kg === 25 && x.reps === 13)).toBe(true);
  });

  it('A2 growth: 25 kg × 15 twice → 30 kg for about 8, close to max', () => {
    const n = suggestNext(twice(db, 25, 15), db, 'growth', today, 3, [], { equipment: rack });
    expect(n).toMatchObject({ mode: 'increase', kg: 30, value: 30, repWindow: [7, 9], reps: [7, 9], target: '30 kg · 7–9 reps' });
    expect(n.reason).toMatch(/No smaller step here: use 30 kg for about 8, close to max\.$/);
    expect(n.sets.every(x => x.kg === 30 && x.reps === 8)).toBe(true);
  });

  it('the anchor is the median working set, not the best one: growth 25 kg × 15/17/20 twice → 30 kg for about 9 to 10', () => {
    const mixed = [{ kg: 25, reps: 15, effort: 'ideal' as const }, { kg: 25, reps: 17, effort: 'ideal' as const }, { kg: 25, reps: 20, effort: 'ideal' as const }];
    const h = [session('2026-09-12', [{ id: db, sets: mixed }]), session('2026-09-15', [{ id: db, sets: mixed }])];
    const n = suggestNext(h, db, 'growth', today, 3, [], { equipment: rack });
    // Median 17: r*(30, 1) = 25 × (1 + 19/30) − 31 = 9.83 → 9 to 10, widened to [8, 11] (anchor over 10 reps). The best set (20) would give 12 to 13.
    expect(n).toMatchObject({ mode: 'increase', kg: 30, repWindow: [8, 11] });
    expect(n.reason).toBe('Top of the range two sessions running without max effort. Add one step. No smaller step here: use 30 kg for about 9 to 10, close to max.');
  });

  it('a drop set at the working load is not part of the anchor when straight sets exist', () => {
    const withDrop = [{ kg: 25, reps: 15, effort: 'ideal' as const }, { kg: 25, reps: 16, effort: 'ideal' as const }, { kg: 25, reps: 30, effort: 'ideal' as const, kind: 'drop' as const }];
    const h = [session('2026-09-12', [{ id: db, sets: withDrop }]), session('2026-09-15', [{ id: db, sets: withDrop }])];
    const n = suggestNext(h, db, 'growth', today, 3, [], { equipment: rack });
    // Straight sets 15 and 16 → anchor 15 (lower median): 30 kg for about 8. Counting the drop set would make it 16 → about 9.
    expect(n.reason).toMatch(/use 30 kg for about 8, close to max\.$/);
  });

  it('A3: at the top of the ladder the load holds with one more set, never the same rung as an increase', () => {
    const n = suggestNext(twice(db, 35, 12), db, 'lean', today, 3, [], { equipment: rack });
    expect(n).toMatchObject({ mode: 'hold', kg: 35, reps: [12, 12] });
    expect(n.reason).toBe('Nothing heavier here: add a set, or a harder variation.');
    expect(n.sets).toHaveLength(4);
  });

  it('the menu\'s confidence rides on the suggestion when the caller passes LT-1\'s menu', () => {
    const menu = { profile: rack, rungsKg: rack.ladder, unit: 'kg' as const, confidence: 'assumed' as const, source: 'default' as const };
    expect(suggestNext(twice(db, 25, 12), db, 'lean', today, 3, [], { equipment: rack, menu }).menuConfidence).toBe('assumed');
  });

  it('A6: step-down from 120 kg on a 5 kg stack is 110 (115 is only 4.2 %)', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const id = 'lib_machine_chest_press';
    const h = [session('2026-09-09', [{ id, sets: sets(120, 8, 'max') }]), session('2026-09-12', [{ id, sets: sets(120, 5, 'max') }]), session('2026-09-15', [{ id, sets: sets(120, 3, 'max') }])];
    const n = suggestNext(h, id, 'strength', today, 3, [], { equipment: defaultProfile('Machine', 'kg') });
    expect(n).toMatchObject({ mode: 'reduce', kg: 110 });
  });

  it('A6: step-down from 60 kg with 1.25 kg plates is 55 (57.5 is only 4.2 %)', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-09', [{ id: ex, sets: sets(60, 8, 'max') }]), session('2026-09-12', [{ id: ex, sets: sets(60, 5, 'max') }]), session('2026-09-15', [{ id: ex, sets: sets(60, 3, 'max') }])];
    const n = suggestNext(h, ex, 'strength', today, 3, [], { equipment: defaultProfile('Barbell', 'kg') });
    expect(n).toMatchObject({ mode: 'reduce', kg: 55, repWindow: [4, 4] });
  });

  it('A6: the step-down never goes under the load planned before the failed increase', async () => {
    const { defaultProfile } = await import('@/brain/units');
    const h = [session('2026-09-09', [{ id: ex, sets: sets(60, 12) }]), session('2026-09-12', [{ id: ex, sets: sets(62.5, 5, 'max') }]), session('2026-09-15', [{ id: ex, sets: sets(62.5, 5, 'max') }])];
    expect(suggestNext(h, ex, 'lean', today, 3, [], { equipment: defaultProfile('Barbell', 'kg') }).kg).toBe(60);
  });
});

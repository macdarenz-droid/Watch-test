import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { findExercise, searchExercises, makeCustomExercise } from '@/core/exercises';
import { exerciseHistory } from '@/brain/history';
import { workingTotals, sessionTotals, weekSummary, weeklyVolumeHistory } from '@/brain/weekly';
import { suggestNext } from '@/brain/progression';
import { allRecords } from '@/brain/prs';
import {
  BODYWEIGHT_SHARE,
  bodyweightShare,
  effectiveLoadKg,
  bodyWeightOn,
  bodyWeightResolver,
  modeLoadText,
  loadColumnLabel,
  loadAriaLabel,
  bodyweightHint,
  lastTopStats,
  statHasReps,
  statLoadLabel,
  statReadout,
  NO_BODY_WEIGHT_HINT,
} from '@/brain/bodyweight';
import { session, sets } from './helpers';

const TODAY = '2026-09-23';
const bw80 = bodyWeightResolver({ weightLog: [{ day: '2026-09-01', kg: 80 }], profile: { name: 'T' } })!;
const PU = 'lib_pull_up';

describe('BODYWEIGHT_SHARE table', () => {
  it('every id resolves, is bodyweight/assisted mode, and share is in (0,1]', () => {
    for (const [id, v] of Object.entries(BODYWEIGHT_SHARE)) {
      const ex = findExercise(id);
      expect(ex?.id).toBe(id);
      expect(ex?.mode === 'bodyweight' || ex?.mode === 'assisted').toBe(true);
      expect(v).toBeGreaterThan(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it('the 11 core ids are exactly the non-custom bodyweight/assisted ids missing from the table', () => {
    const all = searchExercises('', [], 10000);
    const missing = all
      .filter(e => !e.custom && (e.mode === 'bodyweight' || e.mode === 'assisted') && !(e.id in BODYWEIGHT_SHARE))
      .map(e => e.id)
      .sort();
    const expected = [
      'lib_ab_wheel_rollout',
      'lib_bicycle_crunch',
      'lib_bird_dog',
      'lib_crunch',
      'lib_dead_bug',
      'lib_flutter_kicks',
      'lib_hanging_knee_raise',
      'lib_hanging_leg_raise',
      'lib_reverse_crunch',
      'lib_superman',
      'lib_v_up',
    ].sort();
    expect(missing).toEqual(expected);
  });
});

describe('bodyweightShare', () => {
  it('returns the table share for library bodyweight/assisted moves', () => {
    expect(bodyweightShare(findExercise('lib_push_up'))).toBe(0.64);
    expect(bodyweightShare(findExercise('lib_assisted_pull_up'))).toBe(1);
  });

  it('returns null for moves without a share, and for undefined', () => {
    expect(bodyweightShare(findExercise('lib_crunch'))).toBeNull();
    expect(bodyweightShare(findExercise('lib_barbell_bench_press'))).toBeNull();
    expect(bodyweightShare(findExercise('lib_weighted_dip'))).toBeNull();
    expect(bodyweightShare(findExercise('lib_farmer_s_carry'))).toBeNull();
    expect(bodyweightShare(undefined)).toBeNull();
  });

  it('returns null for a custom exercise', () => {
    const custom = makeCustomExercise({ name: 'Ring Push-Up', equipment: 'Bodyweight', primary: ['chest'] });
    expect(bodyweightShare(custom)).toBeNull();
  });
});

describe('effectiveLoadKg', () => {
  it('bodyweight, no added load', () => expect(effectiveLoadKg(undefined, 'bodyweight', 1, 80)).toBe(80));
  it('bodyweight, weighted pull-up', () => expect(effectiveLoadKg(10, 'bodyweight', 1, 80)).toBe(90));
  it('bodyweight with a share', () => expect(effectiveLoadKg(0, 'bodyweight', 0.64, 80)).toBe(51.2));
  it('assisted, some help', () => expect(effectiveLoadKg(20, 'assisted', 1, 80)).toBe(60));
  it('assisted floor', () => expect(effectiveLoadKg(90, 'assisted', 1, 80)).toBe(0));
  it('negative added kg clamps to 0', () => expect(effectiveLoadKg(-5, 'bodyweight', 1, 80)).toBe(80));
  it('no share -> null', () => expect(effectiveLoadKg(10, 'bodyweight', null, 80)).toBeNull());
  it('no body weight -> null', () => expect(effectiveLoadKg(10, 'bodyweight', 1, null)).toBeNull());
  it('weighted mode -> null', () => expect(effectiveLoadKg(10, 'weighted', 1, 80)).toBeNull());
});

describe('bodyWeightOn', () => {
  const log = [
    { day: '2026-09-21', kg: 70 },
    { day: '2026-09-01', kg: 80 },
  ];

  it('nearest entry either side', () => {
    expect(bodyWeightOn('2026-09-05', log)).toBe(80);
    expect(bodyWeightOn('2026-09-15', log)).toBe(70);
  });

  it('tie: the earlier entry wins', () => {
    expect(bodyWeightOn('2026-09-11', log)).toBe(80);
  });

  it('far outside the log still picks the nearest', () => {
    expect(bodyWeightOn('2026-08-01', log)).toBe(80);
    expect(bodyWeightOn('2026-12-01', log)).toBe(70);
  });

  it('bad entries are ignored', () => {
    const bad = [
      { day: 'x', kg: 90 },
      { day: '2026-09-11', kg: 0 },
      { day: '2026-09-11', kg: NaN },
      { day: '2026-09-11', kg: 800 },
      { day: '2026-09-11', kg: 12 },
      { day: '2026-09-11', kg: '80' as unknown as number },
    ];
    expect(bodyWeightOn('2026-09-11', [...log, ...bad])).toBe(80);
  });

  it('fallback and empty log', () => {
    expect(bodyWeightOn('2026-01-01', [], 82)).toBe(82);
    expect(bodyWeightOn('2026-01-01', [], undefined)).toBeNull();
    expect(bodyWeightOn('2026-01-01', [], 0)).toBeNull();
    expect(bodyWeightOn('2026-01-01', [], 12)).toBeNull();
    expect(bodyWeightOn('2026-01-01', [], 800)).toBeNull();
    expect(bodyWeightOn('2026-01-01', log, 99)).toBe(80);
  });

  it('future-dated entries count (R3)', () => {
    expect(bodyWeightOn('2026-09-22', [{ day: '2026-09-01', kg: 80 }, { day: '2027-01-01', kg: 95 }])).toBe(80);
    expect(bodyWeightOn('2026-09-22', [{ day: '2027-01-01', kg: 95 }])).toBe(95);
    expect(bodyWeightOn('2026-09-22', [{ day: '2026-09-21', kg: 80 }, { day: '2026-09-23', kg: 82 }])).toBe(80);
  });
});

describe('bodyWeightResolver', () => {
  it('no log, no profile weight -> undefined', () => {
    expect(bodyWeightResolver({ weightLog: [], profile: { name: 'T' } })).toBeUndefined();
  });

  it('no log, profile weight -> resolver returns it', () => {
    const r = bodyWeightResolver({ weightLog: [], profile: { name: 'T', bodyWeightKg: 82 } })!;
    expect(r('2026-01-01')).toBe(82);
  });

  it('typo guard: out-of-range log and profile both count as missing', () => {
    expect(
      bodyWeightResolver({ weightLog: [{ day: '2026-09-01', kg: 800 }], profile: { name: 'T', bodyWeightKg: 800 } }),
    ).toBeUndefined();
  });
});

describe('No body weight: same as today', () => {
  const F = session(TODAY, [
    { id: PU, sets: sets(10, 5) },
    { id: 'lib_assisted_pull_up', sets: sets(40, 10) },
    { id: 'lib_barbell_bench_press', sets: sets(60, 5) },
    { id: 'lib_push_up', sets: sets(0, 10) },
  ]).exercises;

  it('workingTotals with no bw matches today\'s numbers', () => {
    expect(workingTotals(F)).toEqual(workingTotals(F, [], null));
    expect(workingTotals(F)).toEqual({ sets: 12, volumeKg: 1050 });
  });

  it('sessionTotals with no resolver matches workingTotals', () => {
    const s = session(TODAY, [{ id: PU, sets: sets(10, 5) }]);
    expect(sessionTotals([s], [], undefined)).toEqual(workingTotals(s.exercises));
  });
});

describe('With body weight 80', () => {
  it('bodyweight pull-up, no added load', () => {
    const F = session(TODAY, [{ id: PU, sets: sets(0, 8) }]).exercises;
    expect(workingTotals(F, [], 80)).toEqual({ sets: 3, volumeKg: 1920 });
  });

  it('weighted pull-up', () => {
    const F = session(TODAY, [{ id: PU, sets: sets(10, 5) }]).exercises;
    expect(workingTotals(F, [], 80).volumeKg).toBe(1350);
  });

  it('assisted', () => {
    const F1 = session(TODAY, [{ id: 'lib_assisted_pull_up', sets: sets(40, 10) }]).exercises;
    expect(workingTotals(F1, [], 80).volumeKg).toBe(1200);
    const F2 = session(TODAY, [{ id: 'lib_assisted_pull_up', sets: [{ kg: 90, reps: 5 }] }]).exercises;
    expect(workingTotals(F2, [], 80).volumeKg).toBe(0);
  });

  it('push-up', () => {
    const F = session(TODAY, [{ id: 'lib_push_up', sets: sets(0, 10) }]).exercises;
    expect(workingTotals(F, [], 80).volumeKg).toBe(1536);
  });

  it('a move with no share stays 0; weighted stays unchanged', () => {
    const crunch = session(TODAY, [{ id: 'lib_crunch', sets: sets(0, 15) }]).exercises;
    expect(workingTotals(crunch, [], 80)).toEqual({ sets: 3, volumeKg: 0 });
    const bench = session(TODAY, [{ id: 'lib_barbell_bench_press', sets: sets(60, 5) }]).exercises;
    expect(workingTotals(bench, [], 80).volumeKg).toBe(900);
  });

  it('warm-up sets never count', () => {
    const F = session(TODAY, [{ id: PU, sets: [{ kind: 'warmup', reps: 10 } as any, { reps: 8, kg: 0, effort: 'ideal' }] }]).exercises;
    expect(workingTotals(F, [], 80).volumeKg).toBe(640);
  });

  it('weekSummary volume uses the resolver', () => {
    const s = session('2026-09-22', [{ id: PU, sets: sets(0, 8) }]);
    expect(weekSummary([s], TODAY, [], 3, bw80).volumeKg).toBe(1920);
    expect(weekSummary([s], TODAY, [], 3).volumeKg).toBe(0);
  });
});

describe('Weigh-in changes over time', () => {
  const log = [
    { day: '2026-09-01', kg: 80 },
    { day: '2026-09-21', kg: 70 },
  ];
  const a = session('2026-09-02', [{ id: PU, sets: sets(0, 8) }]);
  const b = session('2026-09-22', [{ id: PU, sets: sets(0, 8) }]);

  it('sessionTotals sums per-session weigh-ins', () => {
    const r = bodyWeightResolver({ weightLog: log, profile: { name: 'T' } })!;
    expect(sessionTotals([a, b], [], r).volumeKg).toBe(3600);
  });

  it('weeklyVolumeHistory buckets by each session\'s own weigh-in', () => {
    const r = bodyWeightResolver({ weightLog: log, profile: { name: 'T' } })!;
    const h = weeklyVolumeHistory([a, b], TODAY, 4, [], r);
    expect(h[0]).toEqual(expect.objectContaining({ week: '2026-09-21', volumeKg: 1680 }));
    expect(h[3]).toEqual(expect.objectContaining({ week: '2026-08-31', volumeKg: 1920 }));
  });

  it('adding a weigh-in changes only the session it is nearest to', () => {
    const r2 = bodyWeightResolver({ weightLog: [...log, { day: '2026-09-02', kg: 90 }], profile: { name: 'T' } })!;
    expect(sessionTotals([a, b], [], r2).volumeKg).toBe(3840);
  });
});

describe('Labels', () => {
  it('modeLoadText', () => {
    expect(modeLoadText({}, 'bodyweight', 'kg')).toBe('BW');
    expect(modeLoadText({ kg: 10 }, 'bodyweight', 'kg')).toBe('BW+10 kg');
    expect(modeLoadText({ kg: 9.072, entered: { value: 20, unit: 'lb' } }, 'bodyweight', 'lb')).toBe('BW+20 lb');
    expect(modeLoadText({ kg: 20 }, 'assisted', 'kg')).toBe('20 kg assist');
    expect(modeLoadText({}, 'assisted', 'kg')).toBe('BW');
    expect(modeLoadText({ kg: 60 }, 'weighted', 'kg')).toBe('60 kg');
    expect(modeLoadText({}, 'weighted', 'kg')).toBe('—');
  });

  it('loadColumnLabel', () => {
    expect(loadColumnLabel('bodyweight', 'kg')).toBe('+kg');
    expect(loadColumnLabel('bodyweight', 'lb')).toBe('+lb');
    expect(loadColumnLabel('assisted', 'kg')).toBe('kg');
    expect(loadColumnLabel('weighted', 'kg')).toBe('kg');
  });

  it('loadAriaLabel', () => {
    expect(loadAriaLabel('bodyweight', 'kg')).toBe('Added load in kg');
    expect(loadAriaLabel('assisted', 'kg')).toBe('Assistance in kg');
    expect(loadAriaLabel('weighted', 'kg')).toBe('Load in kg');
  });
});

describe('bodyweightHint', () => {
  it('push-up with body weight', () => {
    expect(bodyweightHint(findExercise('lib_push_up'), 80, 'kg')).toBe('Body-weight load ≈ 51 kg');
  });

  it('assisted pull-up with body weight', () => {
    expect(bodyweightHint(findExercise('lib_assisted_pull_up'), 80, 'kg')).toBe('Body-weight load ≈ 80 kg');
  });

  it('no body weight -> the hint text', () => {
    expect(bodyweightHint(findExercise('lib_push_up'), null, 'kg')).toBe(NO_BODY_WEIGHT_HINT);
    expect(NO_BODY_WEIGHT_HINT).toBe('Body weight not set');
  });

  it('no share -> null', () => {
    expect(bodyweightHint(findExercise('lib_crunch'), 80, 'kg')).toBeNull();
    expect(bodyweightHint(findExercise('lib_barbell_bench_press'), null, 'kg')).toBeNull();
  });

  it('lb display', () => {
    expect(bodyweightHint(findExercise('lib_push_up'), 79.832, 'lb')).toContain('≈ 113 lb');
    expect(bodyweightHint(findExercise(PU), 79.832, 'lb')).toContain('≈ 176 lb');
  });
});

describe('Stats lastTopStats', () => {
  it('pull-up, no added load', () => {
    const h = exerciseHistory([session('2026-09-22', [{ id: PU, sets: sets(0, 8) }])], PU)[0]!;
    expect(lastTopStats(h, findExercise(PU), bw80, 'kg')).toEqual({ load: '≈ 80 kg', reps: 8 });
    const rLb = bodyWeightResolver({ weightLog: [{ day: '2026-09-01', kg: 79.832 }], profile: { name: 'T' } })!;
    expect(lastTopStats(h, findExercise(PU), rLb, 'lb').load).toBe('≈ 176 lb');
    expect(lastTopStats(h, findExercise(PU), undefined, 'kg')).toEqual({ load: 'BW', reps: 8 });
  });

  it('weighted pull-up', () => {
    const h = exerciseHistory([session('2026-09-22', [{ id: PU, sets: sets(10, 5) }])], PU)[0]!;
    expect(lastTopStats(h, findExercise(PU), bw80, 'kg').load).toBe('≈ 90 kg');
    expect(lastTopStats(h, findExercise(PU), undefined, 'kg').load).toBe('BW+10 kg');

    const h2 = exerciseHistory(
      [session('2026-09-22', [{ id: PU, sets: [{ kg: 10, reps: 5, effort: 'ideal' }, { kg: 5, reps: 8, effort: 'ideal' }] }])],
      PU,
    )[0]!;
    expect(lastTopStats(h2, findExercise(PU), bw80, 'kg')).toEqual({ load: '≈ 90 kg', reps: 5 });
  });

  it('assisted', () => {
    const AP = 'lib_assisted_pull_up';
    const h = exerciseHistory(
      [session('2026-09-22', [{ id: AP, sets: [{ kg: 40, reps: 10, effort: 'ideal' }, { kg: 30, reps: 8, effort: 'ideal' }] }])],
      AP,
    )[0]!;
    expect(lastTopStats(h, findExercise(AP), bw80, 'kg')).toEqual({ load: '≈ 50 kg', reps: 8 });
    expect(lastTopStats(h, findExercise(AP), undefined, 'kg')).toEqual({ load: '40 kg assist', reps: 10 });

    const h2 = exerciseHistory(
      [session('2026-09-22', [{ id: AP, sets: [{ kg: 90, reps: 6, effort: 'ideal' }, { kg: 85, reps: 7, effort: 'ideal' }] }])],
      AP,
    )[0]!;
    expect(lastTopStats(h2, findExercise(AP), bw80, 'kg')).toEqual({ load: '90 kg assist', reps: 6 });
  });

  it('weighted and no-share moves', () => {
    const bench = exerciseHistory([session('2026-09-22', [{ id: 'lib_barbell_bench_press', sets: sets(60, 5) }])], 'lib_barbell_bench_press')[0]!;
    expect(lastTopStats(bench, findExercise('lib_barbell_bench_press'), bw80, 'kg')).toEqual({ load: '60 kg', reps: 5 });

    const crunch = exerciseHistory([session('2026-09-22', [{ id: 'lib_crunch', sets: sets(0, 15) }])], 'lib_crunch')[0]!;
    expect(lastTopStats(crunch, findExercise('lib_crunch'), bw80, 'kg')).toEqual({ load: 'BW', reps: 15 });
  });

  it('UI-11: a hold shows its longest time, not "0 kg" and "0" reps', () => {
    const plank = exerciseHistory([session('2026-09-22', [{ id: 'lib_plank', sets: [{ durationSec: 45, effort: 'ideal' }] }])], 'lib_plank')[0]!;
    expect(lastTopStats(plank, findExercise('lib_plank'), bw80, 'kg')).toEqual({ load: '45s', reps: 0 });
  });

  it('UI-11: a distance-logged carry shows its farthest distance, not "32 kg" and "0" reps', () => {
    const carry = exerciseHistory([session('2026-09-22', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 32, distanceM: 40, effort: 'ideal' }] }])], 'lib_farmer_s_carry')[0]!;
    expect(lastTopStats(carry, findExercise('lib_farmer_s_carry'), bw80, 'kg')).toEqual({ load: '40 m', reps: 0 });
  });

  it('a rep-based conditioning move (no distance) keeps the ordinary load/reps stat', () => {
    const burpee = exerciseHistory([session('2026-09-22', [{ id: 'lib_burpee', sets: [{ reps: 12, effort: 'ideal' }] }])], 'lib_burpee')[0]!;
    expect(lastTopStats(burpee, findExercise('lib_burpee'), bw80, 'kg').reps).toBe(12);
  });

  it('UI-11 (review, 08e13b2): a timed-only carry (no distance) shows its time, not "32 kg" and "0" reps', () => {
    const carry = exerciseHistory([session('2026-09-22', [{ id: 'lib_farmer_s_carry', sets: [{ kg: 32, durationSec: 35, effort: 'ideal' }] }])], 'lib_farmer_s_carry')[0]!;
    expect(lastTopStats(carry, findExercise('lib_farmer_s_carry'), bw80, 'kg')).toEqual({ load: '35s', reps: 0 });
  });
});

describe('statHasReps / statLoadLabel / statReadout (UI-11)', () => {
  it('a hold has no reps tile and reads "longest hold"', () => {
    expect(statHasReps('duration', 0)).toBe(false);
    expect(statLoadLabel('duration', 0)).toBe('longest hold');
    expect(statReadout({ load: '45s', reps: 0 }, 'duration', 0)).toBe('45s');
  });

  it('a distance-logged carry has no reps tile and reads "farthest distance"', () => {
    expect(statHasReps('conditioning', 40)).toBe(false);
    expect(statLoadLabel('conditioning', 40)).toBe('farthest distance');
    expect(statReadout({ load: '40 m', reps: 0 }, 'conditioning', 40)).toBe('40 m');
  });

  it('a timed-only carry (no distance) has no reps tile and reads "longest time"', () => {
    expect(statHasReps('conditioning', 0, 35, 0)).toBe(false);
    expect(statLoadLabel('conditioning', 0, 35, 0)).toBe('longest time');
    expect(statReadout({ load: '35s', reps: 0 }, 'conditioning', 0, 35, 0)).toBe('35s');
  });

  it('a rep-based conditioning move and every other mode keep the reps tile and the × reps readout', () => {
    expect(statHasReps('conditioning', 0)).toBe(true);
    expect(statLoadLabel('conditioning', 0)).toBe('last top load');
    expect(statHasReps('conditioning', 0, 0, 12)).toBe(true);
    expect(statHasReps('weighted', 0)).toBe(true);
    expect(statLoadLabel('weighted', 0)).toBe('last top load');
    expect(statReadout({ load: '60 kg', reps: 8 }, 'weighted', 0)).toBe('60 kg × 8');
  });
});

describe('Progression and records ignore body weight (pins)', () => {
  it('bodyweight pull-up suggestion is unchanged', () => {
    const next = suggestNext([session('2026-09-10', [{ id: PU, sets: sets(0, 8) }])], PU, 'lean', '2026-09-14');
    expect(next.target).toBe('9 reps');
    expect(next.kg).toBeNull();
    expect(next.mode).toBe('reps');
  });

  it('assisted pull-up suggestion is unchanged', () => {
    const next = suggestNext([session('2026-09-10', [{ id: 'lib_assisted_pull_up', sets: sets(40, 8) }])], 'lib_assisted_pull_up', 'lean', '2026-09-14');
    expect(next.target).toBe('9 reps');
    expect(next.kg).toBeNull();
    expect(next.mode).toBe('reps');
  });

  it('records stay best_reps only', () => {
    const records = allRecords([
      session('2026-09-10', [{ id: PU, sets: sets(0, 8) }]),
      session('2026-09-14', [{ id: PU, sets: sets(0, 9) }]),
    ]);
    expect(records.length).toBeGreaterThan(0);
    for (const r of records) expect(r.kind).toBe('best_reps');
  });

  it('source guard: bodyweight.ts is never imported by progression/records/trend code', () => {
    const guarded = ['progression', 'prs', 'trend', 'history', 'deload', 'e1rm'].map(f => `src/brain/${f}.ts`);
    guarded.push('src/slices/history/progressTrend.ts');
    const re = /from ['"](?:\.\/|@\/brain\/)bodyweight['"]/;
    for (const f of guarded) expect(re.test(readFileSync(f, 'utf8'))).toBe(false);
    expect(re.test(readFileSync('src/brain/weekly.ts', 'utf8'))).toBe(true);
  });
});

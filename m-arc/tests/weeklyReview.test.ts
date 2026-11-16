import { describe, it, expect } from 'vitest';
import {
  hardSetsThisWeek, volumeBand, frequencyThisWeek, failureShare, isStale, adherenceRate,
  weightTrendPctPerWeek, repMixShares, weekHasEnoughData, weeklyReviewInsights,
} from '@/brain/coach/weeklyReview';
import { emptySchedule, type Profile } from '@/core/models';
import { exerciseHistory } from '@/brain/history';
import { session, sets } from './helpers';

const bench = 'lib_barbell_bench_press';
const lateral = 'lib_dumbbell_lateral_raise';

describe('hardSetsThisWeek and volumeBand', () => {
  it('easy sets are not hard sets; ideal/max count full (BR-16: easy used to count half)', () => {
    const s = session('2026-09-15', [{ id: bench, sets: [...sets(60, 8, 'easy', 2), ...sets(60, 8, 'ideal', 1)] }]); // Tue
    const out = hardSetsThisWeek([s], '2026-09-18', []);
    expect(out.chest).toBeCloseTo(1, 5);
  });
  it('bands match the plan thresholds', () => {
    expect(volumeBand(3)).toBe('low');
    expect(volumeBand(8)).toBe('maintenance');
    expect(volumeBand(15)).toBe('productive');
    expect(volumeBand(25)).toBe('high');
  });
});

describe('frequencyThisWeek', () => {
  it('counts sessions with 2+ primary sets for the muscle', () => {
    const a = session('2026-09-14', [{ id: bench, sets: sets(60, 8, 'ideal', 3) }]); // Mon
    expect(frequencyThisWeek([a], '2026-09-18', 'chest')).toBe(1);
  });
});

describe('failureShare', () => {
  it('is the share of working sets rated max', () => {
    const a = session('2026-09-14', [{ id: bench, sets: [...sets(60, 8, 'max', 2), ...sets(60, 8, 'ideal', 2)] }]);
    expect(failureShare([a])).toBe(0.5);
  });
});

describe('isStale', () => {
  it('flags 6 sessions at the same load with no e1RM movement', () => {
    const days = ['2026-08-03', '2026-08-06', '2026-08-10', '2026-08-13', '2026-08-17', '2026-08-20'];
    const hist = days.map(d => session(d, [{ id: bench, sets: sets(60, 8, 'ideal', 3) }]));
    expect(isStale(exerciseHistory(hist, bench), '2026-08-21')).toBe(true);
  });
  it('only looks at the last six weeks, and needs six sessions in them (BR-04)', () => {
    const days = ['2026-08-03', '2026-08-06', '2026-08-10', '2026-08-13', '2026-08-17', '2026-08-20'];
    const hist = exerciseHistory(days.map(d => session(d, [{ id: bench, sets: sets(60, 8, 'ideal', 3) }])), bench);
    expect(isStale(hist, '2026-09-20')).toBe(false);
  });
  it('does not flag a lift with too little history', () => {
    const hist = exerciseHistory([session('2026-09-01', [{ id: bench, sets: sets(60, 8) }])], bench);
    expect(isStale(hist, '2026-09-02')).toBe(false);
  });
});

describe('adherenceRate', () => {
  it('is planned days done over planned days passed', () => {
    const schedule = { ...emptySchedule(), mon: 'split_push', wed: 'split_pull' };
    const a = session('2026-09-14', [{ id: bench, sets: sets(60, 8) }]); // Mon, done
    // Wed 09-16 missed
    expect(adherenceRate([a], schedule, '2026-09-18', 7)).toBeCloseTo(0.5, 5);
  });
});

describe('weightTrendPctPerWeek', () => {
  it('needs at least 7 entries spanning 14+ days', () => {
    expect(weightTrendPctPerWeek([{ day: '2026-09-01', kg: 80 }])).toBeNull();
  });
  it('reports a downward trend as negative pct/week', () => {
    const log = Array.from({ length: 15 }, (_, i) => ({ day: `2026-09-${String(i + 1).padStart(2, '0')}`, kg: 80 - i * 0.1 }));
    const r = weightTrendPctPerWeek(log)!;
    expect(r.pctPerWeek).toBeLessThan(0);
  });
});

describe('repMixShares', () => {
  it('splits main-lift working sets into low/mid/high rep bands', () => {
    const s = session('2026-09-14', [{ id: bench, sets: [...sets(100, 3, 'max', 2), ...sets(60, 8, 'ideal', 2)] }]);
    const mix = repMixShares([s], '2026-09-18');
    expect(mix.low).toBeCloseTo(0.5, 5);
    expect(mix.mid).toBeCloseTo(0.5, 5);
  });
  it('excludes accessory exercises', () => {
    const s = session('2026-09-14', [{ id: lateral, sets: sets(10, 15, 'ideal', 3) }]);
    expect(repMixShares([s], '2026-09-18').n).toBe(0);
  });
});

describe('weekHasEnoughData', () => {
  // ADAPT-4: the approved COACHING-PLAN §7 P2-C change replaced "5+ logged days" with the planned sessions (3 when nothing is set).
  it('needs the planned sessions (3 when nothing is set) in this week or the week just ended', () => {
    const days = ['2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'];
    const s = days.map(d => session(d, [{ id: bench, sets: sets(60, 8) }]));
    expect(weekHasEnoughData(s, '2026-09-18')).toBe(true);
    expect(weekHasEnoughData(s.slice(0, 2), '2026-09-18')).toBe(false);
  });
});

describe('weeklyReviewInsights', () => {
  it('produces at least one insight for a week with low chest volume', () => {
    // Two light chest sessions plus a third (legs) session so the week has 3+ sessions but chest stays under band.
    // ADAPT-5 (V3, C-4): the review uses Body's band, where 'under' needs two full weeks, so the week before repeats it.
    const sessions = [
      ...['2026-09-07', '2026-09-09'].map(d => session(d, [{ id: bench, sets: sets(60, 8, 'ideal', 1) }])),
      session('2026-09-11', [{ id: 'lib_leg_press', sets: sets(100, 8, 'ideal', 3) }]),
      session('2026-09-14', [{ id: bench, sets: sets(60, 8, 'ideal', 1) }]),
      session('2026-09-16', [{ id: bench, sets: sets(60, 8, 'ideal', 1) }]),
      session('2026-09-18', [{ id: 'lib_leg_press', sets: sets(100, 8, 'ideal', 3) }]),
    ];
    const profile: Profile = { name: 'Test' };
    const out = weeklyReviewInsights({
      sessions, today: '2026-09-18', custom: [], schedule: emptySchedule(), goal: 'lean', profile,
      weightLog: [], trainingAgeMonths: 24, exerciseIds: [{ id: bench, name: 'Barbell Bench Press' }],
    });
    expect(out.length).toBeGreaterThan(0);
    expect(out.some(i => i.id.startsWith('weekly:volume'))).toBe(true);
    for (const i of out) expect(i.evidence).toBeDefined();
  });
});

describe('weight trend and week grade (BR-14, BR-22)', () => {
  it('a steady loss of 0.5 kg a week reads as that rate', async () => {
    const { weightTrendPctPerWeek } = await import('@/brain/coach/weeklyReview');
    const { addDays } = await import('@/core/dates');
    const log = Array.from({ length: 10 }, (_, i) => ({ day: addDays('2026-08-25', i * 3), kg: 80 - (0.5 / 7) * i * 3 }));
    const t = weightTrendPctPerWeek(log as never)!;
    expect(t.pctPerWeek).toBeCloseTo((-0.5 / (80 - (0.5 / 7) * 13.5)) * 100, 1);
    expect(weightTrendPctPerWeek(log.slice(0, 5) as never)).toBeNull();
  });
  it('the week grade uses the planned days as the target', async () => {
    const { weekSummary } = await import('@/brain/weekly');
    const two = [session('2026-09-14', [{ id: bench, sets: sets(60, 8) }]), session('2026-09-16', [{ id: bench, sets: sets(60, 8) }])];
    expect(weekSummary(two, '2026-09-18', [], 2).grade.title).toBe('Strong week');
    expect(weekSummary(two, '2026-09-18', [], null).grade.title).toBe('Building momentum'); // QA-R6-10: no schedule is null; 0 now means every planned day was taken off
  });
});

describe('weekly e1RM review after a break (QA2-FC-2)', () => {
  const profile: Profile = { name: 'Test' };
  const review = (sessions: ReturnType<typeof session>[], today: string) => weeklyReviewInsights({
    sessions, today, custom: [], schedule: emptySchedule(), goal: 'lean', profile,
    weightLog: [], trainingAgeMonths: 24, exerciseIds: [{ id: bench, name: 'Barbell Bench Press' }],
  }, 50).filter(i => i.id.startsWith('weekly:e1rm'));
  it('sessions before a break do not make a comeback read as flat', () => {
    const before = ['2026-07-29', '2026-07-31', '2026-08-03', '2026-08-05'].map(d => session(d, [{ id: bench, sets: sets(100, 5, 'ideal', 3) }]));
    const after = ['2026-09-14', '2026-09-16', '2026-09-18'].map(d => session(d, [{ id: bench, sets: sets(100, 5, 'ideal', 3) }]));
    expect(review([...before, ...after], '2026-09-19')).toEqual([]);
  });
  it('a rebuild after the break is judged on its own sessions: rising, not falling', async () => {
    const { addDays } = await import('@/core/dates');
    const before = ['2026-07-27', '2026-07-29', '2026-07-31', '2026-08-03', '2026-08-05', '2026-08-07'].map(d => session(d, [{ id: bench, sets: sets(100, 5, 'ideal', 3) }]));
    const after = Array.from({ length: 10 }, (_, i) => session(addDays('2026-09-14', Math.round(i * 11 / 9)), [{ id: bench, sets: sets(85 + i, 5, 'ideal', 3) }]));
    const e1rm = review([...before, ...after], '2026-09-26');
    expect(e1rm.length).toBeGreaterThan(0);
    expect(e1rm[0]!.title).not.toMatch(/falling/i);
    expect(e1rm[0]!.title).toMatch(/rising/i);
  });
});

// BUG-15 review item 2: the lighter week's sessions do not make the weekly review say "falling".
describe('weekly e1RM review after a lighter week (BUG-15)', () => {
  const profile: Profile = { name: 'Test' };
  const days = ['2026-07-20', '2026-07-27', '2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31'];
  const sessions = [
    ...days.map(d => session(d, [{ id: bench, sets: sets(100, 8, 'ideal', 3) }])),
    ...['2026-09-08', '2026-09-11'].map(d => session(d, [{ id: bench, sets: sets(90, 8, 'easy', 2) }])),
  ];
  it('seven weeks at 100 × 8, then 90 kg lighter sessions: flat, not falling', () => {
    const out = weeklyReviewInsights({
      sessions, today: '2026-09-14', custom: [], schedule: emptySchedule(), goal: 'lean', profile,
      weightLog: [], trainingAgeMonths: 24, exerciseIds: [{ id: bench, name: 'Barbell Bench Press' }],
      deload: { startDay: '2026-09-08', endDay: '2026-09-14', reason: 'x', setFactor: 0.6, loadFactor: 0.9 },
    }, 50).filter(i => i.id.startsWith('weekly:e1rm'));
    expect(out.map(i => i.title)).toEqual(['Barbell Bench Press: flat']);
  });
});

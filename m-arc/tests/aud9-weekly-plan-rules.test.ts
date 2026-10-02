import { describe, it, expect } from 'vitest';
import { evaluatePlan, type PlanDraft } from '@/brain/plan';
import { effectiveSetsByMuscle } from '@/brain/exposure';
import { failureShare, weeklyReviewInsights, type WeeklyReviewInput } from '@/brain/coach/weeklyReview';
import { effortMixInsight } from '@/brain/coach/post';
import { effortDrift } from '@/brain/effort';
import { exerciseHistory } from '@/brain/history';
import { emptySchedule, type LoggedSet, type WeightEntry } from '@/core/models';
import { addDays } from '@/core/dates';
import { session, sets, establishedProfile } from './helpers';

const bench = 'lib_barbell_bench_press';
const row = 'lib_barbell_row';
const squat = 'lib_barbell_back_squat';

const draft = (exercises: Array<{ exerciseId: string; sets: number }>): PlanDraft => ({
  splits: [{ ref: 'a', name: 'A', exercises }],
  schedule: { sun: null, mon: 'a', tue: null, wed: 'a', thu: null, fri: 'a', sat: null },
});
const planCtx = { goal: 'lean' as const, custom: [], sessions: [], today: '2026-09-18' };

describe('AUD-9 SCI-09: the plan counts weekly sets as the logged week does', () => {
  it('3 × 6 bench sets give the same triceps and front-delt sets planned and logged', () => {
    const plan = evaluatePlan(draft([{ exerciseId: bench, sets: 6 }]), planCtx).weeklySets;
    const logged = ['2026-09-14', '2026-09-16', '2026-09-18'].map(d => session(d, [{ id: bench, sets: sets(60, 8, 'ideal', 6) }]));
    const done = effectiveSetsByMuscle(logged, '2026-09-14', '2026-09-21');
    for (const m of ['chest', 'triceps', 'front_delts'] as const) expect(plan[m]?.sets, m).toBe(done[m]);
    expect(plan.triceps?.sets).toBe(9);
  });
  it('push/pull balance counts each exercise set once, by its primary muscles (BR-17)', () => {
    const e = evaluatePlan(draft([{ exerciseId: bench, sets: 6 }, { exerciseId: row, sets: 4 }]), planCtx);
    expect(e.balance.pushPull).toBe(1.5);
  });
  it('a set whose primary muscles span push and pull counts half to each', () => {
    const e = evaluatePlan(draft([{ exerciseId: bench, sets: 3 }, { exerciseId: 'lib_dumbbell_pullover', sets: 6 }]), planCtx);
    expect(e.balance.pushPull).toBe(2);
    expect(e.balance.flags).toContain('push_heavy');
  });
  it('upper/lower flags use trainingBalance ratio and its upper scaling', () => {
    // 9 upper against 18 lower sets: 6 against 18 once upper is scaled by UPPER_PER_LOWER, a 3:1 lean.
    const e = evaluatePlan(draft([{ exerciseId: bench, sets: 3 }, { exerciseId: squat, sets: 6 }]), planCtx);
    expect(e.balance.upperLower).toBe(0.5);
    expect(e.balance.flags).toContain('lower_heavy');
  });
});

const failureSet = (n: number): LoggedSet[] => Array.from({ length: n }, () => ({ kg: 60, reps: 8, kind: 'failure' as const }));
const reviewInput = (over: Partial<WeeklyReviewInput>): WeeklyReviewInput => ({
  sessions: [], today: '2026-09-18', custom: [], schedule: emptySchedule(), goal: 'lean', profile: establishedProfile,
  weightLog: [], trainingAgeMonths: 24, exerciseIds: [], ...over,
});

describe('AUD-9 OBS-EFFORTLABEL: a failure set with no effort counts as max', () => {
  it('a 12-set week of failure sets gives a failure share above 0 and the weekly tip', () => {
    const week = [session('2026-09-14', [{ id: bench, sets: failureSet(6) }]), session('2026-09-16', [{ id: bench, sets: failureSet(6) }])];
    expect(failureShare(week)).toBe(1);
    expect(weeklyReviewInsights(reviewInput({ sessions: week }), 50).some(i => i.id === 'weekly:failure-share')).toBe(true);
  });
  it('the session effort mix rates failure sets as max', () => {
    const s = session('2026-09-14', [{ id: bench, sets: failureSet(4) }]);
    expect(effortMixInsight(s)?.noticed).toMatch(/100% of rated sets were max/);
  });
});

describe('AUD-9 OBS-THRESH: weekly limits come from the goal policy', () => {
  // 12 working sets, 5 of them max (42 %): over strength's 30 % cap, under lean's 50 %.
  const week = [session('2026-09-14', [{ id: bench, sets: [...sets(100, 3, 'max', 5), ...sets(100, 3, 'ideal', 1)] }]), session('2026-09-16', [{ id: bench, sets: sets(100, 3, 'ideal', 6) }])];
  const failureTip = (goal: WeeklyReviewInput['goal']) => weeklyReviewInsights(reviewInput({ sessions: week, goal }), 50).some(i => i.id === 'weekly:failure-share');
  it('the failure-share tip uses failureShareCap', () => {
    expect(failureTip('strength')).toBe(true);
    expect(failureTip('lean')).toBe(false);
  });
  // 10 main-lift sets, 3 of them at 5 reps or fewer (30 %).
  const mix = [session('2026-09-14', [{ id: squat, sets: [...sets(100, 5, 'ideal', 3), ...sets(80, 8, 'ideal', 7)] }])];
  const mixTip = (goal: WeeklyReviewInput['goal']) => weeklyReviewInsights(reviewInput({ sessions: mix, goal }), 50).some(i => i.id === 'weekly:rep-mix');
  it('the rep-mix tip uses heavyShareMin', () => {
    expect(mixTip('strength')).toBe(true); // 30 % < 40 %
    expect(mixTip('strength_muscle')).toBe(false); // 30 % ≥ 25 %
  });
  it('strength and muscle under its 25 % gets the tip too', () => {
    const light = [session('2026-09-14', [{ id: squat, sets: [...sets(100, 5, 'ideal', 2), ...sets(80, 8, 'ideal', 8)] }])];
    expect(weeklyReviewInsights(reviewInput({ sessions: light, goal: 'strength_muscle' }), 50).some(i => i.id === 'weekly:rep-mix')).toBe(true);
  });
});

describe('AUD-9 OBS-DRIFT: effort drift only reads the same work', () => {
  const days = ['2026-08-31', '2026-09-03', '2026-09-07', '2026-09-10', '2026-09-14', '2026-09-17'];
  const hist = (kg: (i: number) => number, reps: (i: number) => number = () => 8, easier = false) =>
    exerciseHistory(days.map((d, i) => session(d, [{ id: bench, sets: sets(kg(i), reps(i), (i < 3) !== easier ? 'ideal' : 'max', 3) }])), bench);
  it('harder ratings at a rising load are neither harder nor stable', () => {
    expect(effortDrift(hist(i => (i < 3 ? 60 : 70))).status).toBe('unknown');
  });
  it('harder ratings after a rep step at the same load are not drift either', () => {
    expect(effortDrift(hist(() => 60, i => (i < 3 ? 8 : 10))).status).toBe('unknown');
  });
  it('harder ratings while reps fall at the same load still read harder (review fix)', () => {
    expect(effortDrift(hist(() => 60, i => (i < 3 ? 8 : 7))).status).toBe('harder');
  });
  it('harder ratings at a lower load still read harder (review fix)', () => {
    expect(effortDrift(hist(i => (i < 3 ? 60 : 55))).status).toBe('harder');
  });
  it('easier ratings at a higher load still read easier; at a lower load they are not drift', () => {
    expect(effortDrift(hist(i => (i < 3 ? 60 : 70), undefined, true)).status).toBe('easier');
    expect(effortDrift(hist(i => (i < 3 ? 60 : 55), undefined, true)).status).toBe('unknown');
  });
  it('harder ratings at the same load still read harder', () => {
    expect(effortDrift(hist(() => 60)).status).toBe('harder');
  });
});

describe('AUD-9 OBS-WEIGHT: an old weight log gives no trend tip', () => {
  const log = (lastDay: string): WeightEntry[] => Array.from({ length: 10 }, (_, i) => ({ day: addDays(lastDay, -2 * (9 - i)), kg: 80 - i * 0.3 }));
  const tip = (lastDay: string) => weeklyReviewInsights(reviewInput({ weightLog: log(lastDay) }), 50).some(i => i.id === 'weekly:weight-trend');
  it('a log whose last entry is more than 28 days before today gives none', () => {
    expect(tip('2026-08-20')).toBe(false);
  });
  it('a current log still gives one', () => {
    expect(tip('2026-09-17')).toBe(true);
  });
});

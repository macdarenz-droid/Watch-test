/**
 * ADAPT-5: volume that fits the lifter and one band everywhere (docs/ADAPTIVE-COACH.md, V1-V9).
 * Each block names its criterion; the finding IDs are C-2, A-10, C-4, E-1..E-4 and F-2.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { emptySchedule, type LoggedSet, type Profile, type Session } from '@/core/models';
import { addDays } from '@/core/dates';
import { trainingLevels, levelSeedIndex } from '@/brain/exposure';
import { muscleVolumeStatus } from '@/brain/volume';
import { evaluatePlan } from '@/brain/plan';
import { weeklyReviewInsights } from '@/brain/coach/weeklyReview';
import { coachInsights, deloadOffer, type CoachContext } from '@/brain/coach/rules';
import { postSessionInsights } from '@/brain/coach/post';
import { buildBrief } from '@/escobar/context/brief';
import * as R from '@/escobar/tools/read';
import { MUSCLE_IDS } from '@/data/muscles';
import type { GoalId } from '@/data/goals';
import { PPL6 } from './fixtures/plans';
import { ctxOf, emptyState } from './escobar/fixtures';
import { baseCoachExtras, session, sets } from './helpers';

const bench = 'lib_barbell_bench_press';
const squat = 'lib_barbell_back_squat';
const dip = 'lib_weighted_dip';
const today = '2026-09-22';

describe('V1/V2 (C-2): the level is seeded from trainingSince', () => {
  it('V1: 36 months of training, no sessions → at least Established everywhere; stock PPL ×2 has no volume_far_over', () => {
    const levels = trainingLevels([], [], { trainingSince: '2023-09', today });
    for (const m of MUSCLE_IDS) expect(levels[m].levelIndex, m).toBeGreaterThanOrEqual(3);
    const e = evaluatePlan(PPL6, { goal: 'lean', custom: [], sessions: [], today, trainingSince: '2023-09' });
    expect(e.issues.filter(i => i.code === 'volume_far_over')).toEqual([]);
  });
  it('V1: 12-36 months → Developing; the seed is capped at Established', () => {
    expect(levelSeedIndex({ trainingSince: '2025-06', today })).toBe(2);
    expect(levelSeedIndex({ trainingSince: '2005-01', today })).toBe(3);
    expect(trainingLevels([], [], { trainingSince: '2005-01', today }).chest.level).toBe('Established');
  });
  it('V2 (failure path): trainingSince unset, "I\'m new" or under 12 months → the lifetime level, as today', () => {
    for (const trainingSince of [undefined, '2026-09', '2025-10']) {
      expect(trainingLevels([], [], { trainingSince, today }).chest.levelIndex).toBe(0);
    }
    const e = evaluatePlan(PPL6, { goal: 'lean', custom: [], sessions: [], today });
    expect(e.issues.some(i => i.code === 'volume_far_over')).toBe(true);
  });
  it('V2: a lifetime level above the seed is kept', () => {
    const heavy = Array.from({ length: 60 }, (_, i) => session(addDays('2026-03-02', i * 3), [{ id: bench, sets: sets(60, 8, 'ideal', 4) }]));
    expect(trainingLevels(heavy, [], { trainingSince: '2023-09', today }).chest.levelIndex).toBeGreaterThan(3);
  });
});

describe('V3 (C-4): the weekly review and Body use the same band', () => {
  const monday = '2026-09-28';
  const profile: Profile = { name: 'New' };
  const week = (start: string, chestSets: number) => [
    session(start, [{ id: bench, sets: sets(40, 10, 'ideal', chestSets) }]),
    session(addDays(start, 2), [{ id: 'lib_leg_press', sets: sets(80, 10, 'ideal', 2) }]),
    session(addDays(start, 4), [{ id: 'lib_lat_pulldown', sets: sets(40, 10, 'ideal', 2) }]),
  ];
  const review = (sessions: Session[]) => weeklyReviewInsights({
    sessions, today: monday, custom: [], schedule: emptySchedule(), goal: 'lean', profile,
    weightLog: [], trainingAgeMonths: null, exerciseIds: [{ id: bench, name: 'Bench' }],
  }, 50);
  const body = (sessions: Session[]) => muscleVolumeStatus(sessions, monday, [], { schedule: emptySchedule(), daysOff: [], plannedDays: undefined }).find(r => r.muscle === 'chest')!.status;
  it('V3: a New user with 3 chest sets in one 3-session week → Body "in", and the review does not call chest under', () => {
    const one = week('2026-09-21', 3);
    expect(body(one)).toBe('in');
    expect(review(one).some(i => i.id === 'weekly:volume:chest')).toBe(false);
  });
  it('V3: two full weeks under the band → both say under', () => {
    const two = [...week('2026-09-14', 3), ...week('2026-09-21', 3)];
    expect(body(two)).toBe('under');
    const row = review(two).find(i => i.id === 'weekly:volume:chest');
    expect(row?.title).toBe('Chest is under its usual range');
    expect(row?.noticed).toContain('range 4–8');
  });
  it('V3: the review reads the seeded band: an Established user at 9 chest sets is not over', () => {
    const nine = week('2026-09-21', 9);
    expect(review(nine).find(i => i.id === 'weekly:volume:chest')?.title).toBe('Chest is over its usual range');
    const seeded = weeklyReviewInsights({
      sessions: nine, today: monday, custom: [], schedule: emptySchedule(), goal: 'lean', profile: { name: 'Old', trainingSince: '2020-01' },
      weightLog: [], trainingAgeMonths: 80, exerciseIds: [{ id: bench, name: 'Bench' }],
    }, 50);
    expect(seeded.some(i => i.id === 'weekly:volume:chest')).toBe(false);
  });
});

/** A plateaued main lift: the same load and reps twice a week on the given weeks (Mondays). */
function flatWeeks(mondays: string[], exerciseSets: () => LoggedSet[], id = bench): Session[] {
  return mondays.flatMap(m => [session(m, [{ id, sets: exerciseSets() }]), session(addDays(m, 3), [{ id, sets: exerciseSets() }])]);
}
const eightWeeks = ['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07', '2026-09-14'];
const coachCtx = (sessions: Session[], extra: Partial<CoachContext> = {}): CoachContext => ({
  sessions, splits: [], schedule: emptySchedule(), custom: [], today: '2026-09-29', now: Date.parse('2026-09-29T12:00:00Z'),
  ...baseCoachExtras, profile: { name: 'T', trainingSince: '2024-06' }, ...extra,
});
const lever = (ctx: CoachContext) => coachInsights(ctx, 50).find(i => i.id === `plateau-lever:${bench}`);

describe('V4 (E-1): the plateau lever reads the usual trained week, not last week alone', () => {
  it('V4: last week missed, usual week 8 chest sets in band → the lever does not say low volume', () => {
    const l = lever(coachCtx(flatWeeks(eightWeeks, () => sets(80, 8, 'ideal', 4))));
    expect(l).toBeDefined();
    expect(l!.means).not.toMatch(/low side/);
  });
  it('V4: two missed weeks in the last four are skipped, not counted as 0', () => {
    // Last four weeks: missed, 12, missed, 12 chest sets. Skipped: median 12 (fallback line 10, not low).
    // Counted as 0: median of [0, 0, 12, 12] = 6, under the Developing band's 8 → "low" (the bug).
    const l = lever(coachCtx(flatWeeks(['2026-08-03', '2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-14'], () => sets(80, 8, 'ideal', 6))));
    expect(l).toBeDefined();
    expect(l!.means).not.toMatch(/low side/);
  });
  it('V4 (failure path): a usual week under the band → the volume lever still fires, with the range', () => {
    const l = lever(coachCtx(flatWeeks(eightWeeks, () => sets(80, 8, 'ideal', 2))));
    expect(l!.means).toMatch(/about 4 hard sets in a usual week; your range is 8–14/);
  });
  it('V4: strength goal, chest in band but 2 sets of the lift a week → the goal\'s direct sets for the lift decide', () => {
    const s = eightWeeks.flatMap(m => [
      session(m, [{ id: bench, sets: sets(80, 5, 'ideal', 1) }, { id: 'lib_dumbbell_bench_press', sets: sets(30, 8, 'ideal', 4) }]),
      session(addDays(m, 3), [{ id: bench, sets: sets(80, 5, 'ideal', 1) }, { id: 'lib_cable_fly', sets: sets(15, 12, 'ideal', 4) }]),
    ]);
    expect(lever(coachCtx(s, { goal: 'lean' }))?.means ?? '').not.toMatch(/low side|goal aims/);
    const l = lever(coachCtx(s, { goal: 'strength' }));
    expect(l!.means).toMatch(/goal aims for 3–10/);
  });
});

describe('V5 (E-2): the failure-share lever uses the goal cap', () => {
  const s = () => flatWeeks(eightWeeks, () => [...sets(80, 5, 'max', 2), ...sets(80, 5, 'ideal', 3)]);
  it('V5: strength goal, 40% max sets on a stalled lift → the effort lever', () => {
    const l = lever(coachCtx(s(), { goal: 'strength' }));
    expect(l!.means).toMatch(/About 40% of recent sets were max effort, above the 30% your goal allows/);
    expect(l!.action).toMatch(/Pull most sets back to ideal/);
  });
  it('V5 (failure path): lean goal (cap 50%) at 40% → not the effort lever', () => {
    const l = lever(coachCtx(s(), { goal: 'lean' }));
    expect(l?.means ?? '').not.toMatch(/max effort/);
  });
});

/** A main lift whose reps fall 8 → 5 with the given rest before every set. */
const fading = (restSec: number): LoggedSet[] => [8, 8, 6, 5].map(reps => ({ kg: 100, reps, effort: 'ideal' as const, restSec }));

describe('V6 (E-4): the rest tip uses the goal\'s rest and names the timer', () => {
  const s = session('2026-09-22', [{ id: bench, sets: fading(100) }]);
  const rest = (goal: GoalId, restSettingSec?: number) => postSessionInsights({ session: s, priorSessions: [], custom: [], goal, restSettingSec }).find(i => i.id.startsWith('post:rest'));
  it('V6: strength_muscle, median rest 100 s, reps 8→5 → the tip fires (Train\'s inputs)', () => {
    const tip = rest('strength_muscle', 90);
    expect(tip?.means).toContain('120 seconds or more');
    expect(tip?.action).toBe('Your rest timer is set to 90s; try 120s before heavy sets.');
    expect(rest('strength_muscle')?.action).toBe('Take a little longer before the next heavy set.');
  });
  it('V6: the same note reaches Escobar through get_session', () => {
    const st = { ...emptyState(), goal: 'strength_muscle' as const, sessions: [s] };
    st.preferences = { ...st.preferences, autoRest: true, restDefaultSec: 90 };
    const notes = (R.getSession({ sessionId: s.id }, ctxOf(st)) as { notes: Array<{ title: string; action: string }> }).notes;
    expect(notes.find(n => n.title === 'Median rest 100s')?.action).toContain('set to 90s');
  });
  it('V6 (failure path): lean (90 s) at 100 s → no tip; strength (150 s) at 130 s → tip', () => {
    expect(rest('lean')).toBeUndefined();
    expect(postSessionInsights({ session: session('2026-09-22', [{ id: bench, sets: fading(130) }]), priorSessions: [], custom: [], goal: 'strength' }).some(i => i.id.startsWith('post:rest'))).toBe(true);
  });
  it('V6: Train and Escobar pass the goal and the rest setting, not the old strength flag', () => {
    for (const f of ['src/slices/workout/Train.tsx', 'src/escobar/tools/read.ts']) {
      const call = readFileSync(f, 'utf8').split('\n').find(l => l.includes('postSessionInsights({'))!;
      expect(call, f).toContain('goal: s.goal');
      expect(call, f).toContain('restSettingSec: s.preferences.autoRest ? s.preferences.restDefaultSec : undefined');
      expect(call, f).not.toContain('isStrengthGoal');
    }
  });
});

describe('V7 (E-3): the effort-mix tip needs the split\'s previous session to repeat it', () => {
  const mix = (day: string, max: number, ideal: number) => session(day, [{ id: bench, sets: [...sets(60, 8, 'max', max), ...sets(60, 8, 'ideal', ideal)] }]);
  const tip = (current: Session, prior: Session[], goal: GoalId = 'lean') => postSessionInsights({ session: current, priorSessions: prior, custom: [], goal }, 10).find(i => i.id.startsWith('post:effort-mix') && i.kind === 'tip');
  it('V7: one session at 75% max → no tip', () => {
    expect(tip(mix('2026-09-22', 3, 1), [])).toBeUndefined();
    expect(tip(mix('2026-09-22', 3, 1), [mix('2026-09-18', 1, 3)])).toBeUndefined();
  });
  it('V7: the previous session of the split repeats it → the tip fires', () => {
    const t = tip(mix('2026-09-22', 3, 1), [mix('2026-09-15', 1, 3), mix('2026-09-18', 3, 1)]);
    expect(t?.title).toBe('Effort mix: 75% max effort');
    expect(t?.evidence?.window).toBe('this session and your last Push');
  });
  it('V7: another split\'s session does not count as the previous one', () => {
    const other = { ...mix('2026-09-20', 3, 1), splitId: 'split_legs' };
    expect(tip(mix('2026-09-22', 3, 1), [mix('2026-09-15', 1, 3), other])).toBeUndefined();
  });
  it('V7: the goal cap: 40% max twice is a tip for strength (30%), a healthy spread for lean (50%)', () => {
    const prior = [mix('2026-09-18', 2, 3)];
    expect(tip(mix('2026-09-22', 2, 3), prior, 'strength')?.noticed).toContain('your goal keeps it under 30%');
    expect(tip(mix('2026-09-22', 2, 3), prior, 'lean')).toBeUndefined();
  });
});

describe('V8 (F-2): the brief says when the goal is the default nobody chose', () => {
  const brief = (st: ReturnType<typeof emptyState>) => buildBrief({ ctx: ctxOf(st), mode: 'chat', turnIndex: 0, ledger: [] }).text;
  it('V8: default goal, no goal row → "goal: default, not chosen"', () => {
    expect(brief(emptyState())).toMatch(/^goal: default, not chosen$/m);
    const migrated = { ...emptyState(), profileHistory: [{ at: '2026-09-01T00:00:00Z', field: 'goal' as const, from: undefined, to: 'lean', source: 'migration' as const }] };
    expect(brief(migrated)).toMatch(/^goal: default, not chosen$/m);
  });
  it('V8 (failure path): a goal the person picked → no line', () => {
    const picked = { ...emptyState(), profileHistory: [{ at: '2026-09-01T00:00:00Z', field: 'goal' as const, from: 'growth', to: 'lean', source: 'user' as const }] };
    expect(brief(picked)).not.toMatch(/^goal:/m);
    expect(brief({ ...emptyState(), goal: 'strength' })).not.toMatch(/^goal:/m);
  });
});

describe('V9 (A-10): the over-band lighter week reads the seeded band', () => {
  // Squat stalls for seven weeks (one stalled main lift); the last two completed weeks add 9 dip sets a week.
  const squats = flatWeeks(eightWeeks, () => sets(100, 5, 'ideal', 3), squat);
  const dips = ['2026-09-14', '2026-09-16', '2026-09-18', '2026-09-21', '2026-09-23', '2026-09-25'].map(d => session(d, [{ id: dip, sets: sets(20, 8, 'ideal', 3) }]));
  const ctx = (profile: Profile) => coachCtx([...squats, ...dips], { profile });
  it('V9: trainingSince 36 months ago → no over-band offer', () => {
    const offer = deloadOffer(ctx({ name: 'T', trainingSince: '2023-09' }));
    expect(offer.reason ?? '').not.toMatch(/above its usual weekly range/);
  });
  it('V9 (failure path): 8 months of training (no seed) → the offer still comes on the lifetime band', () => {
    const offer = deloadOffer(ctx({ name: 'T', trainingSince: '2026-01' }));
    expect(offer.reason).toMatch(/above its usual weekly range/);
  });
});

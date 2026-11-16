// ADAPT-4: the user's own week (C-3, C-5, C-8, F-1, E-6, E-9). W1-W7 of the card.
import { describe, it, expect } from 'vitest';
import { muscleVolumeStatus } from '@/brain/volume';
import { weekSummary, plannedSessions } from '@/brain/weekly';
import { weekHasEnoughData, weeklyReviewInsights } from '@/brain/coach/weeklyReview';
import { coachInsights } from '@/brain/coach/rules';
import { addDays } from '@/core/dates';
import { emptySchedule, type Profile, type Session, type Split } from '@/core/models';
import { baseCoachExtras, session, sets } from './helpers';

const curl = 'lib_seated_leg_curl';
const bench = 'lib_barbell_bench_press';
const monday = '2026-09-28';
const legs: Split = { id: 'split_legs', name: 'Legs', exercises: [{ exerciseId: curl, sets: 2 }] } as Split;
const ctx = (today: string, sessions: Session[], extra: object = {}) =>
  ({ sessions, splits: [legs], schedule: emptySchedule(), custom: [], today, now: Date.parse(`${today}T12:00:00Z`), ...baseCoachExtras, ...extra });

/** Mon and Thu: 8 earlier weeks at 4 sets a session (a Beginner band, 6-10), then the three weeks before `monday` at 2 (4 a week). */
const twiceAWeek = (): Session[] => [77, 70, 63, 56, 49, 42, 35, 28, 21, 14, 7].flatMap(back => {
  const wk = addDays(monday, -back);
  return [wk, addDays(wk, 3)].map(d => session(d, [{ id: curl, sets: sets(40, 10, 'ideal', back > 21 ? 4 : 2) }]));
});

describe('W1 (C-3): a twice-a-week lifter who is under-training is told so', () => {
  it('plannedDays 2, two sessions a week, 4 hamstring sets a week for 3 weeks → under', () => {
    const row = muscleVolumeStatus(twiceAWeek(), monday, [], { plannedDays: 2 }).find(r => r.muscle === 'hamstrings')!;
    expect(row.lastWeekSets).toBe(4);
    expect(row.band[0]).toBeGreaterThan(4);
    expect(row.status).toBe('under');
  });
  it('the coach says it', () => {
    const note = coachInsights(ctx(monday, twiceAWeek(), { plannedDays: 2 }), 20).find(i => i.muscle === 'hamstrings');
    expect(note?.title).toMatch(/under/i);
  });
});

describe('W2 (C-8): the week target is the planned days when nothing is scheduled', () => {
  it('no schedule, plannedDays 2, 2 sessions this week → Strong week', () => {
    const two = [session('2026-09-28', [{ id: bench, sets: sets(60, 8) }]), session('2026-09-30', [{ id: bench, sets: sets(60, 8) }])];
    const planned = plannedSessions({ schedule: emptySchedule(), daysOff: [], plannedDays: 2 }, '2026-10-01');
    expect(weekSummary(two, '2026-10-01', [], planned).grade.title).toBe('Strong week');
  });
  it('a schedule still wins over plannedDays', () => {
    expect(plannedSessions({ schedule: { ...emptySchedule(), mon: 'a', wed: 'b', fri: 'c', sat: 'd' }, daysOff: [], plannedDays: 2 }, monday)).toBe(4);
  });
});

describe('W3/W4 (C-5): the weekly review covers the week just ended', () => {
  const profile: Profile = { name: 'T', plannedDays: 3 };
  const lastWeek = ['2026-09-21', '2026-09-23', '2026-09-25'].map(d => session(d, [{ id: bench, sets: sets(60, 8, 'ideal', 1) }, { id: 'lib_leg_press', sets: sets(100, 8, 'ideal', 3) }]));
  const review = (sessions: Session[]) => weeklyReviewInsights({
    sessions, today: monday, custom: [], schedule: emptySchedule(), goal: 'lean', profile,
    weightLog: [], trainingAgeMonths: 24, exerciseIds: [{ id: bench, name: 'Bench' }],
  }, 50);
  it('W3: 3 sessions in the week just ended, planned 3 → available on Monday, about last week', () => {
    expect(weekHasEnoughData(lastWeek, monday, { plannedDays: 3 })).toBe(true);
    expect(weekHasEnoughData(lastWeek, monday)).toBe(true); // nothing set: 3
    const vol = review(lastWeek).find(i => i.id.startsWith('weekly:volume'));
    expect(vol?.noticed).toMatch(/last week/);
    expect(vol?.evidence?.window).toBe('last week');
  });
  it('W4: 1 session in a 3-planned week → no review, and that week is not judged under', () => {
    const one = [session('2026-09-23', [{ id: curl, sets: sets(40, 10, 'ideal', 1) }])];
    expect(weekHasEnoughData(one, monday, { plannedDays: 3 })).toBe(false);
    expect(review(one).some(i => i.id.startsWith('weekly:volume'))).toBe(false);
    const thin = [...twiceAWeek().filter(s => s.day < '2026-09-21'), ...one];
    expect(muscleVolumeStatus(thin, monday, [], { plannedDays: 3 }).find(r => r.muscle === 'hamstrings')!.status).not.toBe('under');
  });
  it('a 2-planned lifter gets the review after 2 sessions; floor 2 for a 1-day plan', () => {
    expect(weekHasEnoughData(lastWeek.slice(0, 2), monday, { plannedDays: 2 })).toBe(true);
    expect(weekHasEnoughData(lastWeek.slice(0, 1), monday, { plannedDays: 1 })).toBe(false);
  });
});

describe('W5 (E-6): days off are not a gap', () => {
  const before = ['2026-09-07', '2026-09-09', '2026-09-11', '2026-09-14'].map(d => session(d, [{ id: bench, sets: sets(60, 8) }]));
  const holiday = Array.from({ length: 10 }, (_, i) => addDays('2026-09-15', i));
  const day7 = '2026-09-21';
  it('a 10-day marked holiday → no "days since your last session" note on day 7', () => {
    expect(coachInsights(ctx(day7, before, { daysOff: holiday }), 20).some(i => i.id === 'gap')).toBe(false);
  });
  it('the same gap without the holiday marked still gets the note', () => {
    expect(coachInsights(ctx(day7, before), 20).find(i => i.id === 'gap')?.title).toBe('7 days since your last session');
  });
  it('a once-a-week lifter is not nagged on day 7; the line waits for twice the usual gap', () => {
    const weekly = ['2026-08-10', '2026-08-17', '2026-08-24', '2026-08-31', '2026-09-07'].map(d => session(d, [{ id: bench, sets: sets(60, 8) }]));
    expect(coachInsights(ctx('2026-09-14', weekly), 20).some(i => i.id === 'gap')).toBe(false);
    expect(coachInsights(ctx('2026-09-21', weekly), 20).some(i => i.id === 'gap')).toBe(true);
  });
});

describe('W6 (E-9): the green-readiness note shows on the first scheduled day', () => {
  const schedule = { ...emptySchedule(), tue: 'a', thu: 'b', sat: 'c' };
  const green = (d: string) => coachInsights(ctx(d, [], { schedule, checkIns: [{ day: d, sleepQuality: 4, mood: 4 }] }), 20).find(i => i.id === 'readiness-today')?.title;
  it('Tue/Thu/Sat → green note on Tuesday, not Monday', () => {
    expect(green('2026-09-22')).toBe('Readiness: green');
    expect(green('2026-09-21')).toBeUndefined();
  });
  it('Tuesday taken off → the note moves to Thursday', () => {
    const d = '2026-09-24';
    const note = coachInsights(ctx(d, [], { schedule, daysOff: ['2026-09-22'], checkIns: [{ day: d, sleepQuality: 4, mood: 4 }] }), 20).find(i => i.id === 'readiness-today');
    expect(note?.title).toBe('Readiness: green');
  });
});

describe('W7: nothing set keeps today\'s behaviour (fallback 3)', () => {
  it('no plan: two sessions a week are not full weeks, so 4 sets stay "in"', () => {
    expect(muscleVolumeStatus(twiceAWeek(), monday, []).find(r => r.muscle === 'hamstrings')!.status).toBe('in');
    expect(muscleVolumeStatus(twiceAWeek(), monday, [], {}).find(r => r.muscle === 'hamstrings')!.status).toBe('in');
  });
  it('no plan: target 3, green note on Monday, gap note at 7 days', () => {
    expect(plannedSessions({ schedule: emptySchedule(), daysOff: [] }, monday)).toBeNull();
    const two = [session('2026-09-28', [{ id: bench, sets: sets(60, 8) }]), session('2026-09-30', [{ id: bench, sets: sets(60, 8) }])];
    expect(weekSummary(two, '2026-10-01', [], null).grade.title).toBe('Building momentum');
    expect(weekHasEnoughData(two.slice(0, 2), '2026-10-01')).toBe(false);
    const m = '2026-09-21';
    expect(coachInsights(ctx(m, [], { checkIns: [{ day: m, sleepQuality: 4, mood: 4 }] }), 20).find(i => i.id === 'readiness-today')?.title).toBe('Readiness: green');
  });
});

describe('W2 wiring: the Today week card and the coach read Profile.plannedDays', () => {
  it('selectors: no schedule, plannedDays 2, 2 sessions → Strong week', async () => {
    const { vi } = await import('vitest');
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 9, 1, 12, 0));
    vi.resetModules();
    try {
      const { replaceState } = await import('@/core/store');
      const { freshState } = await import('@/core/models');
      const S = await import('@/app/selectors');
      const two = [session('2026-09-28', [{ id: bench, sets: sets(60, 8) }]), session('2026-09-30', [{ id: bench, sets: sets(60, 8) }])];
      const base = freshState();
      replaceState({ ...base, sessions: two, profile: { ...base.profile, plannedDays: 2 } });
      expect(S.week.value.grade.title).toBe('Strong week');
    } finally { vi.useRealTimers(); }
  });
});

describe('Escobar wiring: coachCtx carries the plan', () => {
  it('passes plannedDays and daysOff into CoachContext', async () => {
    const { coachCtx } = await import('@/escobar/tools/context');
    const { freshState } = await import('@/core/models');
    const base = freshState();
    const c = coachCtx({ state: { ...base, daysOff: ['2026-09-29'], profile: { ...base.profile, plannedDays: 2 } }, now: Date.parse('2026-09-28T12:00:00Z'), today: monday });
    expect([c.plannedDays, c.daysOff]).toEqual([2, ['2026-09-29']]);
  });
});

describe('Coach card wiring (supervisor scope extension 2026-09-29): the card uses the plan', () => {
  const base = { schedule: emptySchedule(), daysOff: [] as string[] };
  const two = ['2026-09-22', '2026-09-24'].map(d => session(d, [{ id: bench, sets: sets(60, 8) }]));
  it('plannedDays 2, no schedule, trained twice last week → the card shows on Monday, about last week', async () => {
    const { weeklyReviewCardLine } = await import('@/slices/coach/Coach');
    expect(weeklyReviewCardLine({ ...base, sessions: two, profile: { name: 'T', plannedDays: 2 } }, monday, 2)).toBe('2 things worth knowing about last week.');
    expect(weeklyReviewCardLine({ ...base, sessions: two, profile: { name: 'T', plannedDays: 2 } }, monday, 0)).toBe('Steady last week — nothing stands out either way.');
  });
  it('a 6-day schedule: 3 sessions do not show the card; nothing set with 2 sessions does not either', async () => {
    const { weeklyReviewCardLine } = await import('@/slices/coach/Coach');
    const six = { ...emptySchedule(), mon: 'a', tue: 'b', wed: 'c', thu: 'd', fri: 'e', sat: 'f' };
    const three = ['2026-09-22', '2026-09-23', '2026-09-24'].map(d => session(d, [{ id: bench, sets: sets(60, 8) }]));
    expect(weeklyReviewCardLine({ schedule: six, daysOff: [], sessions: three, profile: { name: 'T' } }, monday, 1)).toBeNull();
    expect(weeklyReviewCardLine({ ...base, sessions: two, profile: { name: 'T' } }, monday, 1)).toBeNull();
  });
  it('this week reached the plan → "this week"', async () => {
    const { weeklyReviewCardLine } = await import('@/slices/coach/Coach');
    const thisWeek = ['2026-09-28', '2026-09-30'].map(d => session(d, [{ id: bench, sets: sets(60, 8) }]));
    expect(weeklyReviewCardLine({ ...base, sessions: thisWeek, profile: { name: 'T', plannedDays: 2 } }, '2026-10-01', 1)).toBe('1 thing worth knowing about this week.');
  });
});

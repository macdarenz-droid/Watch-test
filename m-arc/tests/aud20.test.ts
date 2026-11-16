/**
 * AUD-20 (SCI-10, SCI-11, OBS-KNOW): calories are a plain estimate with no band; recovery,
 * readiness and coach text state plain facts, never causes the app cannot show; confidence labels
 * name how much data there is; knowledge sources stay data and the broad statements are narrowed.
 */
import { describe, it, expect } from 'vitest';
import { sessionEnergy, energyFromHealthConnect } from '@/brain/energy';
import { RULES, coachInsights } from '@/brain/coach/rules';
import { weeklyReviewInsights } from '@/brain/coach/weeklyReview';
import { readiness, sleepDriver } from '@/brain/readiness';
import { redactDrivers } from '@/escobar/tools/context';
import { DATA_LABEL } from '@/brain/trend';
import { BALANCE } from '@/brain/balance';
import { CARD_BY_ID, lookupKnowledge } from '@/escobar/knowledge/cards';
import { addDays } from '@/core/dates';
import { emptySchedule, type Profile, type Session } from '@/core/models';
import type { MuscleRecovery } from '@/brain/recovery';
import { baseCoachExtras, session, sets } from './helpers';

const today = '2026-09-26';
const now = new Date('2026-09-26T12:00:00Z').getTime();
const full: Profile = { name: 'T', bodyWeightKg: 80, heightCm: 180, sex: 'male', birthYear: 1990 };
const bench = 'lib_barbell_bench_press';

/** Every user-facing string of an insight. */
const textOf = (i: { title: string; noticed: string; means: string; action: string }) => `${i.title} ${i.noticed} ${i.means} ${i.action}`;
/** The causal and false-precision wording AUD-20 removed. */
const OVERCLAIM = /history shows|works? against|stimulus|scheduling problem|willpower|doing most of the work|joints happy|±/i;

const rule = (id: string) => RULES.find(r => r.id === id)!;
const rec = (over: Partial<MuscleRecovery>): MuscleRecovery => ({
  muscle: 'chest', pct: 45, hoursLeft: 20, windowHours: 48, lastTrainedAt: '2026-09-25T18:00:00Z', lastDay: '2026-09-25',
  personalized: true, recovering: true, ready: false, readyInHours: [17, 23], fullInHours: 30, confidence: 'medium',
  drivers: [], systemicFactor: 1, ...over,
} as MuscleRecovery);
const ctxBase = { sessions: [] as Session[], splits: [], schedule: emptySchedule(), custom: [], today, now, ...baseCoachExtras };

/** Twice a week (Mon/Thu) for `weeks` weeks ending just before today. */
function twiceWeekly(weeks: number, kg: (week: number) => number, n = 3): Session[] {
  const start = addDays(today, -weeks * 7);
  return Array.from({ length: weeks * 2 }, (_, i) => {
    const w = Math.floor(i / 2);
    return session(addDays(start, w * 7 + (i % 2 ? 3 : 0)), [{ id: bench, sets: sets(kg(w), 5, 'ideal', n) }]);
  });
}
const review = (sessions: Session[], schedule = emptySchedule()) => weeklyReviewInsights({
  sessions, today, custom: [], schedule, goal: 'lean', profile: { name: 'T' },
  weightLog: [], trainingAgeMonths: 24, exerciseIds: [{ id: bench, name: 'Bench' }],
}, 50);

describe('AUD-20 SCI-10: calories are a plain estimate', () => {
  const series: Array<[number, number]> = Array.from({ length: 60 }, (_, i) => [i * 5, 130]);
  it('a heart-rate estimate carries no low/high band', () => {
    const r = sessionEnergy({ series, profile: full, today, quality: 1 })!;
    expect(r.activeKcal).toBeGreaterThan(0);
    expect(r).not.toHaveProperty('low');
    expect(r).not.toHaveProperty('high');
  });
  it('a Health Connect value passes through with no band', () => {
    const r = energyFromHealthConnect(300, 60, full, today)!;
    expect(r.activeKcal).toBe(300);
    expect(r).not.toHaveProperty('low');
    expect(r).not.toHaveProperty('high');
  });
});

describe('AUD-20 SCI-11: recovery and readiness copy states facts', () => {
  it('still recovering: the model is fitted to the user, no claim their history proves harm', () => {
    const [i] = rule('recovery.still-recovering').run(ctxBase as never, { recovery: [rec({})] } as never);
    expect(i!.means).toBe('Its ready time is fitted to your own sessions.');
    expect(textOf(i!)).not.toMatch(OVERCLAIM);
  });

  const split = { id: 'split_push', name: 'Push', focus: [], exercises: [{ exerciseId: bench, sets: 3 }] };
  const conflict = (pct: number) => rule('recovery.scheduled-conflict').run(
    { ...ctxBase, splits: [split], schedule: { ...emptySchedule(), sat: 'split_push' }, sessions: [] } as never,
    { recovery: [rec({ pct, lastDay: '2026-09-24', personalized: false })] } as never,
  )[0]!;
  it('scheduled conflict under 60%: the line the coach acts on, not "works against the muscle"', () => {
    const i = conflict(45);
    expect(i.means).toBe('Below 60%, the coach suggests moving the hard sets.');
    expect(textOf(i)).not.toMatch(OVERCLAIM);
  });
  it('scheduled conflict from 60%: the ready line, not a prediction about the sets', () => {
    const i = conflict(70);
    expect(i.means).toBe('That is short of the 90% ready line.');
    expect(i.means).not.toMatch(/productively|at their best/);
  });

  it('readiness red: the score, not "would work against you"', () => {
    const r = { score: 25, band: 'red', confidence: 'medium', loadAdvice: 'reduce', drivers: ['how you feel today (soreness, sleep quality or mood)'], calibrating: false };
    const [i] = rule('readiness.today').run({ ...ctxBase } as never, { readiness: r, readinessInputs: ['checkIn'], readinessLow: ['checkIn'], recovery: [] } as never);
    expect(i!.means).toBe('Today\'s score is 25 of 100.');
    expect(textOf(i!)).not.toMatch(OVERCLAIM);
  });

  it('sleep driver: the hours against the usual, never "sleep lowered readiness"', () => {
    expect(sleepDriver(310, [310, 480, 470], 450)).toBe('Sleep: 5h 10m last night (below your usual 7h 30m)');
    expect(sleepDriver(null, [300, 330], 450)).toBe('Sleep: 5h 15m a night over the last 2 nights (below your usual 7h 30m)');
    // COPY-2: one older night without last night's data is not "last night"; with last night present and short, it is.
    expect(sleepDriver(null, [300], 450)).toBe('Sleep: 5h on your last logged night (below your usual 7h 30m)');
    expect(sleepDriver(300, [300], 450)).toBe('Sleep: 5h last night (below your usual 7h 30m)');
    expect(sleepDriver(480, [480, 200, 200], 450)).toBe('Sleep: 4h 53m a night over the last 3 nights (below your usual 7h 30m)');
    // AUD-1's 7 h floor: habitual short sleep is named against the floor, not as "your usual".
    expect(sleepDriver(240, [240, 240, 240], 240)).toBe('Sleep: 4h last night (under 7h)');
    expect(sleepDriver(null, [360, 360], 360)).toBe('Sleep: 6h a night over the last 2 nights (under 7h)');
  });
  it('readiness emits the sleep driver from real health days, and ES-12 still hides it', () => {
    const healthDays = Array.from({ length: 14 }, (_, i) => ({ day: addDays(today, -i), sleepMinutes: i < 3 ? 180 : 450, source: 'health_connect' as const, syncedAt: '2026-09-26T08:00:00Z' }));
    const r = readiness({ today, now, sessions: [], custom: [], recovery: [], checkInHistory: [], healthDays })!;
    const sleep = r.drivers.find(d => d.startsWith('Sleep:'));
    expect(sleep).toBe('Sleep: 3h last night (below your usual 7h 30m)');
    expect(r.drivers.some(d => /short|lowered|because/i.test(d))).toBe(false);
    expect(redactDrivers(r.drivers, false)).not.toContain(sleep);
    expect(redactDrivers(['how you feel today (soreness, sleep quality or mood)'], false)).toHaveLength(1);
  });

  it('confidence labels name how much data there is', () => {
    expect(DATA_LABEL).toEqual({ high: 'Plenty of data', medium: 'Some data', low: 'Little data' });
    for (const v of Object.values(DATA_LABEL)) expect(v).not.toMatch(/confiden|accura|guess|good/i);
  });
});

describe('AUD-20 SCI-11: coach progress and consistency copy states facts', () => {
  const flat = twiceWeekly(9, () => 100);
  it('plateau: the coach\'s policy, not "the stimulus stopped changing"', () => {
    const [i] = rule('progress.plateau').run({ ...ctxBase, sessions: flat } as never, { activeIds: [{ id: bench, name: 'Bench' }] } as never);
    expect(i!.means).toBe('That is the point where the coach suggests a change.');
    expect(textOf(i!)).not.toMatch(OVERCLAIM);
  });
  it('plateau lever on a same-load lift: the load fact, not "nowhere to come from"', () => {
    const heavy = twiceWeekly(9, () => 100, 8);
    const [i] = rule('progress.plateau-lever').run({ ...ctxBase, sessions: heavy, profile: { name: 'T', trainingSince: '2020-01' } } as never, { activeIds: [{ id: bench, name: 'Bench' }] } as never);
    expect(i!.means).toBe('The top load has stayed the same for the last six weeks.');
    expect(textOf(i!)).not.toMatch(OVERCLAIM);
  });
  it('weekly flat lift and same-load lift: facts, no stimulus claim', () => {
    const out = review(flat);
    const e1 = out.find(x => x.id === `weekly:e1rm:${bench}`)!;
    expect(e1.title).toBe('Bench: flat');
    expect(e1.means).toBe('That is the point where the coach suggests a change.');
    const stale = out.find(x => x.id === `weekly:stale:${bench}`)!;
    expect(stale.means).toBe('Its estimated 1RM has stayed flat with it.');
    for (const i of out) expect(textOf(i)).not.toMatch(OVERCLAIM);
  });
  it('pace: the app\'s reference range, not a biological standard', () => {
    const out = review(twiceWeekly(9, w => 100 + 2.5 * w));
    const i = out.find(x => x.id === `weekly:pace:${bench}`)!;
    expect(i.means).toBe('The app\'s reference for your training age is about 0.5 to 1% a month.');
  });
  it('adherence: facts and the coach\'s line, no cause for missed sessions', () => {
    const schedule = { ...emptySchedule(), mon: 'split_push', wed: 'split_push', fri: 'split_push' };
    const low = review([session(addDays(today, -2), [{ id: bench, sets: sets(60, 8) }])], schedule).find(x => x.id === 'weekly:adherence')!;
    expect(low.means).toBe('Below 60%, the coach suggests a schedule change.');
    expect(textOf(low)).not.toMatch(OVERCLAIM);
    const days = Array.from({ length: 28 }, (_, i) => addDays(today, -i)).filter(d => ['1', '3', '5'].includes(String(new Date(`${d}T12:00:00`).getDay())));
    const good = review(days.map(d => session(d, [{ id: bench, sets: sets(60, 8) }])), schedule).find(x => x.id === 'weekly:adherence-good')!;
    expect(good.means).toBe('That is 85% or more of the plan.');
  });
});

describe('AUD-20 OBS-KNOW: balance, session length and pain statements are narrowed', () => {
  it('balance: the rule\'s own evidence, no joint claim', () => {
    const push = 'lib_barbell_bench_press';
    const sessions = [0, 2, 4, 7, 9, 11, 14, 16, 18].map(d => session(addDays(today, -d - 1), [{ id: push, sets: sets(60, 8, 'ideal', 4) }]));
    const i = coachInsights({ ...ctxBase, sessions } as never, 50).find(x => x.id.startsWith('balance:'))!;
    expect(i.means).toMatch(new RegExp(`^The gap showed in [23] of the last ${BALANCE.weeks} weeks\\.$`));
    expect(textOf(i)).not.toMatch(/joint/i);
  });
  it('session length says what the cited guidance sets: sets, loads and rest, not minutes', () => {
    const c = CARD_BY_ID.session_length!;
    expect(c.statement).toBe('Session length follows how many sets you do and how long you rest between them. Guidance for strength and muscle gain is given as sets, loads and rest, not as minutes per session; heavy sets get the longest rests.');
    expect(c.statement).not.toMatch(/rarely costs|drive progress/);
  });
  it('pain red flags drop the unsourced 48 h line and keep the stop-and-see advice', () => {
    const c = CARD_BY_ID.pain_red_flags!;
    expect(c.statement).toBe('Stop the movement and see a physio or doctor for pain that is sharp, spreading, numb or tingling, wakes you at night, or comes with swelling.');
    expect(c.numbers).toEqual([]);
  });
  it('verified identifiers are data only: never a URL, never in what the model sees', () => {
    expect(CARD_BY_ID.pain_red_flags!.sources[0]).toMatchObject({ pmid: '32438853', doi: '10.2519/jospt.2020.9971' });
    expect(CARD_BY_ID.session_length!.sources[0]).toMatchObject({ pmid: '19204579', doi: '10.1249/MSS.0b013e3181915670' });
    const seen = JSON.stringify(lookupKnowledge({ ids: ['pain_red_flags', 'session_length'] }));
    expect(seen).not.toMatch(/32438853|19204579|10\.\d{4}|pmid|doi|https?:/i);
  });
});

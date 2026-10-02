import { describe, it, expect } from 'vitest';
import { readiness, readinessWithInputs, LOAD_DRIVER, type ReadinessInput } from '@/brain/readiness';
import { acuteChronicRatio, type MuscleRecovery } from '@/brain/recovery';
import { suggestNext } from '@/brain/progression';
import { coachInsights, deloadOffer } from '@/brain/coach/rules';
import { emptySchedule, type CheckIn, type DailyHealth, type Split } from '@/core/models';
import { baseCoachExtras, session, sets } from './helpers';

// BUG-16: readiness is never red or amber from acute load alone; chronic load divides by the days covered.
const today = '2026-09-22';
const day = (offset: number) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - offset); return d.toISOString().slice(0, 10); };
const squat = 'lib_barbell_back_squat';
const bench = 'lib_barbell_bench_press';
const train = (offsets: number[], id = squat) => offsets.map(o => session(day(o), [{ id, sets: sets(100, 8, 'max', 5) }]));
/** Every 4 days for 28 days, then every day of the last week (none today, so today's split still counts): a ratio well above 1.5. */
const spike = () => train([1, 2, 3, 4, 5, 6, 8, 12, 16, 20, 24, 27]);

const mr = (muscle: MuscleRecovery['muscle'], pct: number): MuscleRecovery => ({
  muscle, pct, hoursLeft: 0, windowHours: 24, lastTrainedAt: null, lastDay: null, personalized: false,
  recovering: pct < 90, ready: pct >= 90, readyInHours: null, fullInHours: null, confidence: 'medium', drivers: [], systemicFactor: 1,
});
const push: Split = { id: 'push', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: bench, sets: 3 }] };
const base: ReadinessInput = { today, now: Date.parse(`${today}T12:00:00Z`), healthDays: [], checkIn: undefined, checkInHistory: [], recovery: [], scheduledSplit: undefined, custom: [], sessions: [] };

describe('A3: chronic load divides by the days covered, at most 28 (RECOVERY-F2)', () => {
  it('steady training every 2 days reads near 1 on days 14 to 27 of an account', () => {
    for (const span of [14, 16, 20, 24, 27]) {
      const offsets = Array.from({ length: Math.floor(span / 2) + 1 }, (_, i) => i * 2).filter(o => o <= span);
      const ratio = acuteChronicRatio(train(offsets), today)!;
      expect(ratio, `span ${span}`).toBeGreaterThan(0.85);
      expect(ratio, `span ${span}`).toBeLessThan(1.2);
    }
    // Once training spans the whole window it divides by 28, and older sessions never widen it.
    const offsets = Array.from({ length: 30 }, (_, i) => i * 2); // 60 days of steady training
    expect(acuteChronicRatio(train(offsets), today)).toBeCloseTo((4 / 7) / (14 / 28), 5);
  });
});

describe('A4: the load score starts penalising at ratio 1.3 (RECOVERY-F8)', () => {
  it('a ratio of about 1.2 alone scores full, not amber', () => {
    // Every 3 days for 28 days: 3 of 10 sessions fall in the last week, ratio 1.2.
    const s = train([0, 3, 6, 9, 12, 15, 18, 21, 24, 27]);
    const ratio = acuteChronicRatio(s, today)!;
    expect(ratio).toBeGreaterThan(1.1);
    expect(ratio).toBeLessThan(1.3);
    const r = readiness({ ...base, sessions: s })!;
    expect(r.score).toBe(100);
    expect(r.band).toBe('green');
  });
  it('a ratio of 1.2 next to a mid recovery does not drag the band down', () => {
    const s = train([1, 3, 6, 9, 12, 15, 18, 21, 24, 27]);
    const withLoad = readiness({ ...base, sessions: s, scheduledSplit: push, recovery: [mr('chest', 70), mr('triceps', 70)] })!;
    expect(withLoad.score).toBeGreaterThanOrEqual(70);
  });
});

describe('A1: acute load alone is never red or amber, never holds a load, never counts toward the lighter week', () => {
  it('a load spike with nothing else logged is green, normal, low confidence, with a load note', () => {
    const s = spike();
    expect(acuteChronicRatio(s, today)!).toBeGreaterThan(1.5);
    const { result: r, inputs } = readinessWithInputs({ ...base, sessions: s });
    expect(inputs).toEqual(['load']);
    expect(r!.band).toBe('green');
    expect(r!.loadAdvice).toBe('normal');
    expect(r!.confidence).toBe('low');
    expect(r!.drivers).toEqual([LOAD_DRIVER]);
  });
  it('the Train target is not held and no set is cut', () => {
    const r = readiness({ ...base, sessions: spike() })!;
    const ex = bench;
    const a = session(day(4), [{ id: bench, sets: sets(60, 12, 'ideal', 3) }]);
    const b = session(day(2), [{ id: bench, sets: sets(60, 12, 'ideal', 3) }]);
    const s = suggestNext([a, b], ex, 'lean', today, 3, [], { readiness: { loadAdvice: r.loadAdvice }, recoveryPct: 95 });
    expect(s.mode).toBe('increase');
    expect(s.sets).toHaveLength(3);
  });
  it('the coach gives a low-confidence note, not a red alert, and no lighter week', () => {
    // Bench rising 2.5 kg a session, trained every 4 days for 6 weeks, then daily this week.
    const offsets = [...new Set([0, 1, 2, 3, 4, 5, 6, 8, 12, 16, 20, 24, 28, 32, 36, 40])].sort((x, y) => y - x);
    const sessions = offsets.map((o, i) => session(day(o), [{ id: bench, sets: sets(60 + 2.5 * i, 8, 'ideal', 3) }]));
    const ctx = { sessions, splits: [], schedule: emptySchedule(), custom: [], today, now: Date.parse(`${today}T12:00:00Z`), ...baseCoachExtras };
    const note = coachInsights(ctx, 20).find(i => i.id === 'readiness-today');
    expect(note?.title).toBe('Training load is up');
    expect(note?.kind).toBe('data');
    expect(note?.evidence?.confidence).toBe('low');
    expect(deloadOffer(ctx).suggest).toBe(false);
  });
});

// A1 + A5 across input combinations: none / acute only / check-in only / health only / mixed.
describe('A1 + A5: input combinations', () => {
  const badHealth: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: i < 7 ? 72 : 55, sleepMinutes: i < 3 ? 200 : 450, source: 'health_connect' as const, syncedAt: today }));
  const rhrOnly: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: i < 7 ? 72 : 55, source: 'health_connect' as const, syncedAt: today }));
  const badCheckIn: CheckIn = { day: today, sleepQuality: 1, mood: 1 };
  const okCheckIn: CheckIn = { day: today, sleepQuality: 4, mood: 4 };
  const lowRecovery = { scheduledSplit: push, recovery: [mr('chest', 20), mr('triceps', 20)] };
  const cases: Array<[string, Partial<ReadinessInput>, { null?: true; band?: string; advice?: string; noReduce?: true }]> = [
    ['none', {}, { null: true }],
    ['acute only (spike)', { sessions: spike() }, { band: 'green', advice: 'normal' }],
    ['check-in only, bad', { checkIn: badCheckIn }, { band: 'red', advice: 'reduce' }],
    ['check-in only, fine', { checkIn: okCheckIn }, { band: 'green', advice: 'normal' }],
    ['resting HR only, bad', { healthDays: rhrOnly }, { noReduce: true }],
    ['recovery only, bad', lowRecovery, { noReduce: true }],
    ['health only (sleep + RHR), bad', { healthDays: badHealth }, { band: 'red', advice: 'reduce' }],
    ['acute spike + fine check-in', { sessions: spike(), checkIn: okCheckIn }, { band: 'green', advice: 'normal' }],
    ['acute spike + low recovery', { sessions: spike(), ...lowRecovery }, { band: 'red', advice: 'reduce' }],
    ['acute spike + bad check-in', { sessions: spike(), checkIn: badCheckIn }, { band: 'red', advice: 'reduce' }],
  ];
  for (const [name, input, want] of cases) {
    it(name, () => {
      const { result: r, inputs } = readinessWithInputs({ ...base, ...input });
      if (want.null) { expect(r).toBeNull(); return; }
      if (want.band) expect(r!.band).toBe(want.band);
      if (want.advice) expect(r!.loadAdvice).toBe(want.advice);
      if (want.noReduce) expect(r!.loadAdvice).not.toBe('reduce');
      // A5 as an invariant: "reduce" only with today's check-in or 2+ inputs past their driver lines.
      if (r!.loadAdvice === 'reduce') expect(!!input.checkIn || r!.drivers.length >= 2).toBe(true);
      // A1 as an invariant: load as the only input is always green and normal.
      if (inputs.length === 1 && inputs[0] === 'load') expect([r!.band, r!.loadAdvice]).toEqual(['green', 'normal']);
    });
  }
  it('one health or recovery input alone blocks the increase at most, never "reduce"', () => {
    const rhr = readiness({ ...base, healthDays: rhrOnly })!;
    expect(rhr.band).toBe('red');
    expect(rhr.loadAdvice).toBe('no_increase');
    expect(readiness({ ...base, ...lowRecovery })!.loadAdvice).toBe('no_increase');
  });
  it('fuzz: over random mixes, reduce always has a check-in or 2+ drivers, and load alone is always green', () => {
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2 ** 31; return seed / 2 ** 31; };
    for (let n = 0; n < 300; n++) {
      const input: ReadinessInput = { ...base };
      if (rnd() < 0.5) input.sessions = train(Array.from({ length: 28 }, (_, i) => i).filter(o => rnd() < (o < 7 ? rnd() : 0.3)).concat([20, 27]));
      if (rnd() < 0.4) input.checkIn = { day: today, sleepQuality: (1 + Math.floor(rnd() * 5)) as 1, mood: (1 + Math.floor(rnd() * 5)) as 1 };
      if (rnd() < 0.4) { const hi = 55 + Math.floor(rnd() * 20); input.healthDays = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: i < 7 ? hi : 55, source: 'health_connect' as const, syncedAt: today })); }
      if (rnd() < 0.4) { const pct = Math.floor(rnd() * 100); input.scheduledSplit = push; input.recovery = [mr('chest', pct), mr('triceps', pct)]; }
      const { result: r, inputs } = readinessWithInputs(input);
      if (!r) continue;
      if (r.loadAdvice === 'reduce') expect(!!input.checkIn || r.drivers.length >= 2).toBe(true);
      if (inputs.length === 1 && inputs[0] === 'load') expect([r.band, r.loadAdvice]).toEqual(['green', 'normal']);
    }
  });
});

describe('A2: readiness copy names only the inputs that exist', () => {
  const monday = '2026-09-21';
  const ctxOn = (d: string, extra: object) => ({ sessions: [], splits: [], schedule: emptySchedule(), custom: [], today: d, now: Date.parse(`${d}T12:00:00Z`), ...baseCoachExtras, ...extra });
  it('a green Monday from a check-in alone names the check-in, not sleep or resting heart rate', () => {
    const note = coachInsights(ctxOn(monday, { checkIns: [{ day: monday, sleepQuality: 4, mood: 4 }] }), 20).find(i => i.id === 'readiness-today');
    expect(note?.title).toBe('Readiness: green');
    expect(note?.noticed).toBe('Your check-in is lining up this week.');
    expect(note?.noticed).not.toMatch(/sleep|heart/i);
    expect(note?.gated).toBeUndefined();
  });
  it('a green Monday with health data names it and is kept off the coach when health sharing is off', () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => { const d = new Date(`${monday}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - i); return { day: d.toISOString().slice(0, 10), restingHr: 55, sleepMinutes: 450, source: 'health_connect' as const, syncedAt: monday }; });
    const note = coachInsights(ctxOn(monday, { healthDays }), 20).find(i => i.id === 'readiness-today');
    expect(note?.noticed).toBe('Sleep and resting heart rate are lining up this week.');
    expect(note?.gated).toBe('health');
    // Three inputs read "are all".
    const three = coachInsights(ctxOn(monday, { healthDays, checkIns: [{ day: monday, sleepQuality: 4, mood: 4 }] }), 20).find(i => i.id === 'readiness-today');
    expect(three?.noticed).toBe('Your check-in, sleep and resting heart rate are all lining up this week.');
  });
  it('a Monday load spike with normal sleep gives the load note, never "training load is lining up"', () => {
    const mon = (o: number) => { const d = new Date(`${monday}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - o); return d.toISOString().slice(0, 10); };
    const sessions = [1, 2, 3, 4, 5, 6, 8, 12, 16, 20, 24, 27].map(o => session(mon(o), [{ id: squat, sets: sets(100, 8, 'max', 5) }]));
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: mon(i), sleepMinutes: 450, source: 'health_connect' as const, syncedAt: monday }));
    const all = coachInsights(ctxOn(monday, { sessions, healthDays }), 20).filter(i => i.id === 'readiness-today');
    expect(all).toHaveLength(1);
    expect(all[0]!.title).toBe('Training load is up');
    expect(all.some(i => /lining up/.test(i.noticed))).toBe(false);
  });
  it('an amber day from one input without a driver names that input, not "a mixed picture"', () => {
    // A first check-in rated 2 and 3 scores 63 (amber) with no driver, and it is the only input.
    // (ADAPT-2: a 3 and 3 now reads normal, 75 green, so the amber case rates sleep 2.)
    const note = coachInsights(ctxOn(today, { checkIns: [{ day: today, sleepQuality: 2, mood: 3 }] }), 20).find(i => i.id === 'readiness-today');
    expect(note?.title).toBe('Readiness: amber');
    expect(note?.noticed).toBe('Your check-in reads middling today.');
  });
  it('a red band from one health input says keep the loads, not drop a set', () => {
    const note = coachInsights(ctxOn(today, { healthDays: Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: i < 7 ? 75 : 55, source: 'health_connect' as const, syncedAt: today })) }), 20).find(i => i.id === 'readiness-today');
    expect(note?.title).toBe('Readiness: red');
    expect(note?.action).not.toContain('drop a set');
  });
});

describe('A6: the amber reason does not blame muscle recovery when recovery is fine (PROGRESSION-F12)', () => {
  const ex = bench;
  const a = session(day(4), [{ id: bench, sets: sets(60, 12, 'ideal', 3) }]);
  const b = session(day(2), [{ id: bench, sets: sets(60, 12, 'ideal', 3) }]);
  it('amber with recovery at 95 names readiness; recovery under 60 still names recovery', () => {
    const s = suggestNext([a, b], ex, 'lean', today, 3, [], { readiness: { loadAdvice: 'no_increase' }, recoveryPct: 95 });
    expect(s.mode).toBe('confirm');
    expect(s.reason).not.toContain('Recovery is under 60%');
    expect(s.reason).toContain('Readiness');
    // Recovery under 60 still names recovery.
    expect(suggestNext([a, b], ex, 'lean', today, 3, [], { recoveryPct: 40 }).reason).toContain('Recovery is under 60%');
  });
});

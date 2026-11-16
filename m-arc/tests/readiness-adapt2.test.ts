import { describe, it, expect } from 'vitest';
import { readiness, readinessBaselines, LOAD_DRIVER, type ReadinessInput } from '@/brain/readiness';
import { acuteChronicRatio, systemicFactor, type MuscleRecovery } from '@/brain/recovery';
import type { CheckIn, DailyHealth, Split } from '@/core/models';
import { session, sessionAt, sets } from './helpers';

// ADAPT-2: readiness judges "normal" against the user (B-1 step 1, B-3, B-9).
const today = '2026-09-22';
const now = Date.parse(`${today}T12:00:00Z`);
const day = (offset: number) => { const d = new Date(`${today}T00:00:00Z`); d.setUTCDate(d.getUTCDate() - offset); return d.toISOString().slice(0, 10); };
const bench = 'lib_barbell_bench_press';
const push: Split = { id: 'push', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: bench, sets: 3 }] };
const mr = (muscle: MuscleRecovery['muscle'], pct: number): MuscleRecovery => ({
  muscle, pct, hoursLeft: 0, windowHours: 24, lastTrainedAt: null, lastDay: null, personalized: false,
  recovering: pct < 90, ready: pct >= 90, readyInHours: null, fullInHours: null, confidence: 'medium', drivers: [], systemicFactor: 1,
});
/** 3 sessions a week, same work, for the 4 weeks before today: an acute:chronic ratio of 1. */
const fourWeeks = () => [2, 4, 6, 9, 11, 13, 16, 18, 20, 23, 25, 27].map(o => session(day(o), [{ id: bench, sets: sets(100, 8, 'ideal', 5) }]));
const usual = (d: string): CheckIn => ({ day: d, sleepQuality: 3, mood: 3, soreness: { chest: 2, triceps: 2 } });
const base: ReadinessInput = {
  today, now, healthDays: [], checkIn: usual(today), checkInHistory: [], recovery: [mr('chest', 90), mr('triceps', 90)],
  scheduledSplit: push, custom: [], sessions: fourWeeks(),
};

describe('ADAPT-2 B-1: an ordinary check-in reads normal from the first check-ins', () => {
  it('R1: 20 usual check-in days, today the same, 4 weeks of sessions, 90 % recovered → green, normal', () => {
    const r = readiness({ ...base, checkInHistory: Array.from({ length: 20 }, (_, i) => usual(day(i + 1))) })!;
    expect(acuteChronicRatio(base.sessions, today)).toBeCloseTo(1, 5);
    expect(r.band).toBe('green');
    expect(r.loadAdvice).toBe('normal');
    expect(r.drivers).toEqual([]);
  });

  it('R2: the same with no sessions in the last 28 days and 100 % recovered → green', () => {
    const r = readiness({ ...base, sessions: [], recovery: [mr('chest', 100), mr('triceps', 100)], checkInHistory: Array.from({ length: 20 }, (_, i) => usual(day(i + 1))) })!;
    expect(r.band).toBe('green');
    expect(r.score).toBeGreaterThan(65);
  });

  it('R3 (the typical user): 10 check-in days in the last 30, no watch, an average day → green, not amber from the check-in alone', () => {
    const history = Array.from({ length: 10 }, (_, i) => usual(day(1 + i * 3))); // days 1, 4, …, 28: 2-3 a week
    expect(new Set(history.map(c => c.day)).size).toBe(10);
    const r = readiness({ ...base, checkInHistory: history })!;
    expect(r.band).toBe('green');
    expect(r.loadAdvice).toBe('normal');
    expect(r.calibrating).toBe(true);
  });

  it('R4: a first-ever 3/3/3 check-in with 4 weeks of sessions and 90 % recovered → green', () => {
    const r = readiness({ ...base, checkIn: { day: today, sleepQuality: 3, mood: 3, soreness: { chest: 3, triceps: 3 } }, checkInHistory: [] })!;
    // Each part reads 0.75: (0.35 × 0.75 + 0.15 × 0.9 + 0.05 × 1) / 0.55 = 81.
    expect(r.score).toBe(81);
    expect(r.band).toBe('green');
    expect(r.loadAdvice).toBe('normal');
  });

  it('R5 (failure path): today 2 SD worse than the user\'s own mean on sleep and soreness → amber or red, never an increase', () => {
    // Sleep 3/4/5 (mean 4, SD 0.82), soreness 1/2/3 (mean 2, SD 0.82), mood 4.
    const history: CheckIn[] = Array.from({ length: 21 }, (_, i) => ({ day: day(i + 1), sleepQuality: (3 + (i % 3)) as 3 | 4 | 5, mood: 4, soreness: { chest: (1 + (i % 3)) as 1 | 2 | 3, triceps: (1 + (i % 3)) as 1 | 2 | 3 } }));
    const bad = readiness({ ...base, checkInHistory: history, checkIn: { day: today, sleepQuality: 2, mood: 4, soreness: { chest: 4, triceps: 4 } } })!;
    expect(bad.band).not.toBe('green');
    expect(bad.loadAdvice).not.toBe('normal');
    expect(bad.drivers).toContain('how you feel today (soreness, sleep quality or mood)');
    // The user's own usual day on the same history is green.
    const ok = readiness({ ...base, checkInHistory: history, checkIn: { day: today, sleepQuality: 4, mood: 4, soreness: { chest: 2, triceps: 2 } } })!;
    expect(ok.band).toBe('green');
  });
});

describe('ADAPT-2 B-3: resting HR is read against the user\'s own spread', () => {
  const RHR_DRIVER = 'resting heart rate is up over your usual';
  /**
   * 21 days before the last week around 55 with exactly this SD (10 low, 10 high, one at 55), then 7 days
   * at the level that puts the 7-day mean `rise` bpm over the 28-day mean.
   */
  const rhr = (sd: number, rise: number): DailyHealth[] => {
    const a = sd * Math.sqrt(21 / 20);
    const recent = 55 + rise * 28 / 21;
    return Array.from({ length: 28 }, (_, i) => ({
      day: day(i), restingHr: i < 7 ? recent : i === 7 ? 55 : 55 + (i % 2 ? a : -a), source: 'health_connect' as const, syncedAt: today,
    }));
  };
  const only = (healthDays: DailyHealth[]) => readiness({ ...base, healthDays, checkIn: undefined, scheduledSplit: undefined, recovery: [], sessions: [] })!;

  it('R6: +4 bpm with a personal SD of 1 → "resting heart rate is up"', () => {
    const h = rhr(1, 4);
    expect(only(h).drivers).toContain(RHR_DRIVER);
    const b = readinessBaselines(h, today);
    expect(b.restingHr7d! - b.restingHr28d!).toBeCloseTo(4, 6);
    expect(b.restingHrBaselineSd).toBeCloseTo(1, 6);
  });

  it('R6: +6 bpm with a personal SD of 5 → no driver', () => {
    const h = rhr(5, 6);
    const r = only(h);
    expect(r.drivers).not.toContain(RHR_DRIVER);
    expect(r.band).not.toBe('red');
    const b = readinessBaselines(h, today);
    expect(b.restingHr7d! - b.restingHr28d!).toBeCloseTo(6, 6);
    expect(b.restingHrBaselineSd).toBeCloseTo(5, 6);
  });

  it('the spread is the user\'s usual days, not the raised week: a clean +6 bpm week over a flat baseline reads its full size', () => {
    const h = rhr(0, 6);
    expect(readinessBaselines(h, today).restingHrBaselineSd).toBe(0);
    const r = only(h);
    expect(r.score).toBe(0); // z = 6 / 1.5 = 4
    expect(r.band).toBe('red');
  });

  it('R6 (fallback): under 14 days of resting HR the fixed 10 bpm scale still applies', () => {
    const few = rhr(1, 4).slice(0, 13); // the last 7 days and 6 before them
    expect(readinessBaselines(few, today).restingHr28dCount).toBe(13);
    const d = readinessBaselines(few, today);
    expect(only(few).score).toBe(Math.round(100 * (1 - (d.restingHr7d! - d.restingHr28d!) / 10)));
  });
});

describe('ADAPT-2 B-9: coming back after missed weeks is not a load spike', () => {
  /** 3 sessions a week of the same work in the given weeks back (0 = the last 7 days); `minutes` for this week's sessions. */
  const weeks = (trained: number[], minutes = 60) => trained.flatMap(w => [1, 3, 5].map(o => {
    const d = day(7 * w + o);
    const len = w === 0 ? minutes : 60;
    return sessionAt(`${d}T17:00:00.000Z`, new Date(Date.parse(`${d}T17:00:00.000Z`) + len * 60_000).toISOString(), [{ id: bench, sets: sets(100, 8, 'ideal', 5) }]);
  }));
  const loadOnly = (s: ReturnType<typeof weeks>) => readiness({ ...base, sessions: s, checkIn: undefined, scheduledSplit: undefined, recovery: [] })!;

  it('R7: two missed weeks, then an ordinary week → no load driver and no whole-body slowdown', () => {
    const s = weeks([0, 3, 4, 5, 6, 7]);
    expect(acuteChronicRatio(s, today)).toBeCloseTo(1, 5);
    expect(loadOnly(s).drivers).not.toContain(LOAD_DRIVER);
    expect(systemicFactor([], s, now)).toBe(1);
  });

  it('R8 (failure path): a return week at 1.6 × the usual trained week → the load driver still fires', () => {
    const s = weeks([0, 3, 4, 5, 6, 7], 96);
    expect(acuteChronicRatio(s, today)).toBeCloseTo(1.6, 5);
    expect(loadOnly(s).drivers).toContain(LOAD_DRIVER);
    expect(systemicFactor([], s, now)).toBeGreaterThan(1);
  });

  it('under 3 trained weeks in the 8 before this one, the ratio is today\'s 7-day over 28-day', () => {
    const s = weeks([0, 3]);
    expect(acuteChronicRatio(s, today)).toBeCloseTo((3 / 7) / (6 / 27), 5); // training covers 27 days
  });

  it('steady training reads the same as before', () => {
    expect(acuteChronicRatio(weeks([0, 1, 2, 3, 4, 5, 6, 7]), today)).toBeCloseTo(1, 5);
  });
});

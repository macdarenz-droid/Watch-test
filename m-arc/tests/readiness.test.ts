import { describe, it, expect } from 'vitest';
import { readinessBaselines, readiness, readinessSummaryText, type ReadinessInput } from '@/brain/readiness';
import type { CheckIn, DailyHealth, Split } from '@/core/models';
import type { MuscleRecovery } from '@/brain/recovery';
import { session, sets } from './helpers';

const today = '2026-09-22';
const day = (offset: number) => { const d = new Date(today); d.setDate(d.getDate() - offset); return d.toISOString().slice(0, 10); };

const mr = (muscle: MuscleRecovery['muscle'], pct: number): MuscleRecovery => ({
  muscle, pct, hoursLeft: 0, windowHours: 24, lastTrainedAt: null, lastDay: null, personalized: false,
  recovering: pct < 90, ready: pct >= 90, readyInHours: null, fullInHours: null, confidence: 'medium', drivers: [], systemicFactor: 1,
});

const baseInput: ReadinessInput = {
  today, now: Date.parse(`${today}T12:00:00Z`), healthDays: [], checkIn: undefined, checkInHistory: [], recovery: [], scheduledSplit: undefined, custom: [], sessions: [],
};

describe('readinessBaselines', () => {
  it('computes 7d/28d resting HR and 14d sleep median with gaps', () => {
    const healthDays: DailyHealth[] = [
      { day: day(0), restingHr: 60, sleepMinutes: 420, source: 'health_connect', syncedAt: today },
      { day: day(1), restingHr: 62, source: 'health_connect', syncedAt: today },
      { day: day(10), restingHr: 58, sleepMinutes: 400, source: 'health_connect', syncedAt: today },
    ];
    const b = readinessBaselines(healthDays, today);
    expect(b.restingHr7d).toBeCloseTo(61, 0);
    expect(b.restingHr28d).toBeCloseTo(60, 0);
    expect(b.sleep14dMedian).not.toBeNull();
  });
  it('is all-null with no data', () => {
    const b = readinessBaselines([], today);
    expect(b.restingHr7d).toBeNull();
    expect(b.sleep14dMedian).toBeNull();
    expect(b.cv).toBeNull();
  });
});

describe('readiness', () => {
  it('returns null with zero inputs', () => {
    expect(readiness(baseInput)).toBeNull();
  });
  it('gives a low-confidence tier from a check-in alone, no watch', () => {
    const checkInHistory: CheckIn[] = Array.from({ length: 5 }, (_, i) => ({ day: day(i + 1), sleepQuality: 3, mood: 3 }));
    const r = readiness({ ...baseInput, checkIn: { day: today, sleepQuality: 3, mood: 3 }, checkInHistory });
    expect(r).not.toBeNull();
    expect(r!.confidence).toBe('low');
  });
  it('still scores a first-ever check-in with zero prior history, via the raw-rating fallback', () => {
    const r = readiness({ ...baseInput, checkIn: { day: today, sleepQuality: 2, mood: 2 }, checkInHistory: [] });
    expect(r).not.toBeNull();
    // ADAPT-2: a 2 and 2 is half a point under the re-centred 3 (0.75) on each part: 50, below normal.
    expect(r!.score).toBe(50);
    expect(r!.band).toBe('amber');
    expect(r!.loadAdvice).toBe('no_increase');
  });
  it('is red with reduce advice when recovery and resting HR are both poor', () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: i < 7 ? 70 : 55, source: 'health_connect' as const, syncedAt: today }));
    // BUG-16: the recovery part counts only for a scheduled split's muscles; without one this case
    // had resting HR as its only input, and one input alone no longer says "reduce".
    const scheduledSplit: Split = { id: 'push', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 3 }] };
    const r = readiness({ ...baseInput, healthDays, recovery: [mr('chest', 20), mr('triceps', 25)], scheduledSplit });
    expect(r).not.toBeNull();
    expect(r!.band).toBe('red');
    expect(r!.loadAdvice).toBe('reduce');
  });
  it('is green with normal advice when everything is favourable', () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: 55, source: 'health_connect' as const, syncedAt: today }));
    const r = readiness({ ...baseInput, healthDays, recovery: [mr('chest', 100), mr('triceps', 100)] });
    expect(r).not.toBeNull();
    expect(r!.band).toBe('green');
    expect(r!.loadAdvice).toBe('normal');
  });
  it('is calibrating until 14 days of check-ins or sleep exist', () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: 55, source: 'health_connect' as const, syncedAt: today }));
    const r = readiness({ ...baseInput, healthDays, recovery: [mr('chest', 100)] });
    expect(r!.calibrating).toBe(true);
  });
  it('is no longer calibrating once 14 days of sleep data exist', () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: 55, sleepMinutes: 420, source: 'health_connect' as const, syncedAt: today }));
    const r = readiness({ ...baseInput, healthDays, recovery: [mr('chest', 100)] });
    expect(r!.calibrating).toBe(false);
  });
  it('gives higher confidence with more present inputs', () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: 55, sleepMinutes: 420, source: 'health_connect' as const, syncedAt: today }));
    const checkInHistory: CheckIn[] = Array.from({ length: 5 }, (_, i) => ({ day: day(i + 1), sleepQuality: 4, mood: 4 }));
    const sessions = [session(day(1), [{ id: 'bench', sets: sets(60, 8, 'ideal', 3) }])];
    const r = readiness({ ...baseInput, healthDays, checkIn: { day: today, sleepQuality: 4, mood: 4 }, checkInHistory, recovery: [mr('chest', 90)], sessions });
    expect(r!.confidence).not.toBe('low');
  });
});

describe('readinessSummaryText (F3.8)', () => {
  it('names the band and score, with advice only when it is not normal', () => {
    expect(readinessSummaryText({ score: 80, band: 'green', confidence: 'high', loadAdvice: 'normal', drivers: [], calibrating: false })).toBe('Readiness: green (80).');
    expect(readinessSummaryText({ score: 20, band: 'red', confidence: 'high', loadAdvice: 'reduce', drivers: [], calibrating: false })).toBe('Readiness: red (20). Ease off today.');
  });
});

describe('readiness windows (BR-03, BR-19)', () => {
  const ci = (d: string, mood: 1 | 2 | 3 | 4 | 5): CheckIn => ({ day: d, mood, sleepQuality: 3 });
  it('only the 30 days before today count as check-in history', () => {
    const recent = [1, 2, 3, 4].map(o => ci(day(o), 3));
    const stale = [40, 41, 42, 43, 44].map(o => ci(day(o), 5));
    const withStale = readiness({ ...baseInput, checkIn: ci(today, 4), checkInHistory: [...recent, ...stale, ci(today, 1)] })!;
    const clean = readiness({ ...baseInput, checkIn: ci(today, 4), checkInHistory: recent })!;
    expect(withStale.score).toBe(clean.score);
  });
  it('the load part stays out until training spans 14 of the last 28 days', () => {
    const young = [1, 3, 5].map(o => session(day(o), [{ id: 'lib_barbell_back_squat', sets: sets(100, 8, 'max', 5) }]));
    expect(readiness({ ...baseInput, sessions: young })).toBeNull();
    const spanned = [1, 3, 5, 20].map(o => session(day(o), [{ id: 'lib_barbell_back_squat', sets: sets(100, 8, 'max', 5) }]));
    expect(readiness({ ...baseInput, sessions: spanned })).not.toBeNull();
  });
});

describe('readiness after training is done for the day (QA8-2)', () => {
  const splitUpper: Split = { id: 'upper', name: 'Upper', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 3 }] };
  const redInputs = () => {
    const healthDays: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: day(i), restingHr: i < 7 ? 70 : 55, source: 'health_connect' as const, syncedAt: today }));
    return { healthDays, recovery: [mr('chest', 20), mr('triceps', 25)] };
  };

  it('a session today with a red band points the driver and advice at the next split, not today', () => {
    const sessions = [session(today, [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'ideal', 3) }])];
    const r = readiness({ ...baseInput, ...redInputs(), sessions, next: { split: splitUpper, weekday: 'mon' } });
    expect(r).not.toBeNull();
    expect(r!.band).toBe('red'); // QA8-2: the colour band itself is unchanged
    expect(r!.drivers.some(d => d.includes('for Upper on Mon'))).toBe(true);
    expect(r!.drivers.every(d => !d.includes('you would train today'))).toBe(true);
    expect(r!.postSessionAdvice).toBe("Today's session is done. Recover well; Upper is next on Mon.");
  });

  it('without a session today, the result is byte-identical to before this fix (no postSessionAdvice, old driver wording)', () => {
    const r = readiness({ ...baseInput, ...redInputs(), scheduledSplit: splitUpper, next: { split: splitUpper, weekday: 'mon' } });
    expect(r).not.toBeNull();
    expect(r!.postSessionAdvice).toBeUndefined();
    expect(r!.drivers).toContain('the muscles you would train today are not fully recovered');
    expect(JSON.stringify(r)).toBe(JSON.stringify({ score: r!.score, band: r!.band, confidence: r!.confidence, loadAdvice: r!.loadAdvice, drivers: r!.drivers, calibrating: r!.calibrating }));
  });

  it('readinessSummaryText prefers postSessionAdvice once today is done', () => {
    expect(readinessSummaryText({ score: 20, band: 'red', confidence: 'high', loadAdvice: 'reduce', drivers: [], calibrating: false, postSessionAdvice: "Today's session is done. Recover well; Upper is next on Mon." }))
      .toBe("Readiness: red (20). Today's session is done. Recover well; Upper is next on Mon.");
  });
});

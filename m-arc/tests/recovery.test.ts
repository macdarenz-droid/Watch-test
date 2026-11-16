import { describe, it, expect } from 'vitest';
import { dayKey } from '@/core/dates';
import { calibrateTauScale, recoveryStatus, recoveryTier, systemicFactor } from '@/brain/recovery';
import { sessionAt, sets, establishedProfile, noCheckIns, noFreshMarks, freshRecoveryModel } from './helpers';
import type { CheckIn, DailyHealth, FreshMark, Session } from '@/core/models';

const QUADS_EX = 'lib_barbell_back_squat'; // squat -> role main, primary quads, muscleFactor 1.0
const HOUR = 3_600_000;
const DAY = 24 * HOUR;

/** `n` identical sessions, 10 days apart (past the 7-day stacking window, short of the 28-day layoff/novelty window). */
function steadyStateSessions(kg: number, reps: number, effort: 'easy' | 'ideal' | 'max', n: number, endsAt: number): Session[] {
  const out: Session[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const end = endsAt - i * 10 * DAY;
    out.push(sessionAt(new Date(end - HOUR).toISOString(), new Date(end).toISOString(), [{ id: QUADS_EX, sets: sets(kg, reps, effort, 3) }]));
  }
  return out;
}

function statusFor(sessions: Session[], now: number, extra: { healthDays?: DailyHealth[]; checkIns?: CheckIn[]; freshMarks?: FreshMark[] } = {}) {
  return recoveryStatus({
    sessions, custom: [], now, profile: establishedProfile,
    healthDays: extra.healthDays ?? [], checkIns: extra.checkIns ?? noCheckIns, freshMarks: extra.freshMarks ?? noFreshMarks,
    recoveryModel: freshRecoveryModel,
  }).find(r => r.muscle === 'quads')!;
}

describe('recovery model v2 (impulse-response)', () => {
  it('ready-time orders easy < ideal < max, in the ballpark the plan illustrates (~24/34/47h)', () => {
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    const easy = statusFor(steadyStateSessions(100, 8, 'easy', 9, end), end);
    const ideal = statusFor(steadyStateSessions(100, 8, 'ideal', 9, end), end);
    const max = statusFor(steadyStateSessions(100, 8, 'max', 9, end), end);
    expect(easy.windowHours).toBeLessThan(ideal.windowHours);
    expect(ideal.windowHours).toBeLessThan(max.windowHours);
    expect(easy.windowHours).toBeGreaterThan(12);
    expect(easy.windowHours).toBeLessThan(30);
    expect(ideal.windowHours).toBeGreaterThan(26);
    expect(ideal.windowHours).toBeLessThan(42);
    expect(max.windowHours).toBeGreaterThan(38);
    expect(max.windowHours).toBeLessThan(58);
  });

  it('full recovery takes longer than ready, for both ideal and max (plan: ~55h / ~77h)', () => {
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    const ideal = statusFor(steadyStateSessions(100, 8, 'ideal', 9, end), end);
    const max = statusFor(steadyStateSessions(100, 8, 'max', 9, end), end);
    expect(ideal.fullInHours).not.toBeNull();
    expect(ideal.fullInHours!).toBeGreaterThan(ideal.windowHours);
    expect(max.fullInHours!).toBeGreaterThan(max.windowHours);
  });

  it('ready and full times count down from now, not from the session (BR-02)', () => {
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    const sessions = steadyStateSessions(100, 8, 'max', 9, end);
    const atEnd = statusFor(sessions, end);
    const later = statusFor(sessions, end + 24 * HOUR);
    expect(later.fullInHours!).toBeCloseTo(atEnd.fullInHours! - 24, 0);
    expect(later.readyInHours![1]).toBeLessThan(atEnd.readyInHours![1]);
    const ready = statusFor(sessions, end + 6 * DAY);
    expect(ready.readyInHours).toBeNull();
  });

  it('eight max-effort sets take noticeably longer to be ready than three (plan: ~75h for eight)', () => {
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    const threeSets = statusFor(steadyStateSessions(100, 8, 'max', 9, end), end);
    const eightSets = statusFor(
      (() => {
        const out: Session[] = [];
        for (let i = 8; i >= 0; i--) {
          const e = end - i * 10 * DAY;
          out.push(sessionAt(new Date(e - HOUR).toISOString(), new Date(e).toISOString(), [{ id: QUADS_EX, sets: sets(100, 8, 'max', 8) }]));
        }
        return out;
      })(),
      end,
    );
    expect(eightSets.windowHours).toBeGreaterThan(threeSets.windowHours);
    expect(eightSets.windowHours).toBeGreaterThan(60);
    expect(eightSets.windowHours).toBeLessThan(95);
  });

  it('a muscle never touched by any session is 100% recovered', () => {
    const s = sessionAt('2026-09-17T17:00:00.000Z', '2026-09-17T18:00:00.000Z', [{ id: QUADS_EX, sets: sets(100, 8, 'ideal') }]);
    const untouched = recoveryStatus({ sessions: [s], custom: [], now: Date.parse('2026-09-18T18:00:00.000Z'), profile: establishedProfile, healthDays: [], checkIns: [], freshMarks: [], recoveryModel: freshRecoveryModel }).find(r => r.muscle === 'biceps')!;
    expect(untouched.pct).toBe(100);
    expect(untouched.lastTrainedAt).toBeNull();
  });

  it('F_ref keeps a single light session from showing 0%: a light one-off does not read as "destroyed"', () => {
    const s = sessionAt('2026-09-17T17:00:00.000Z', '2026-09-17T18:00:00.000Z', [{ id: QUADS_EX, sets: sets(100, 8, 'easy', 1) }]);
    const r = statusFor([s], Date.parse('2026-09-17T18:00:00.000Z'));
    expect(r.pct).toBeGreaterThan(0);
  });

  it('the 7-day floor forces 100% even if the decay math has not fully reached it', () => {
    const s = sessionAt('2026-09-01T17:00:00.000Z', '2026-09-01T18:00:00.000Z', [{ id: QUADS_EX, sets: sets(100, 8, 'max', 8) }]);
    const now = Date.parse('2026-09-01T18:00:00.000Z') + 7 * DAY;
    const r = statusFor([s], now);
    expect(r.pct).toBe(100);
  });

  it('time-to-ready is capped at 120h even after heavy stacking', () => {
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    const sessions: Session[] = [];
    for (let i = 0; i < 5; i++) {
      const e = end - (4 - i) * 12 * HOUR; // five max sessions, 12h apart, all within the 7-day window
      sessions.push(sessionAt(new Date(e - HOUR).toISOString(), new Date(e).toISOString(), [{ id: QUADS_EX, sets: sets(100, 8, 'max', 8) }]));
    }
    const r = statusFor(sessions, end);
    expect(r.windowHours).toBeLessThanOrEqual(120);
    if (r.readyInHours) expect(r.readyInHours[1]).toBeLessThanOrEqual(120);
  });

  it('stacking: a session 36h after another leaves more fatigue than the second session alone', () => {
    const secondEnd = Date.parse('2026-09-10T18:00:00.000Z');
    const firstEnd = secondEnd - 36 * HOUR;
    const first = sessionAt(new Date(firstEnd - HOUR).toISOString(), new Date(firstEnd).toISOString(), [{ id: QUADS_EX, sets: sets(100, 8, 'ideal', 3) }]);
    const second = sessionAt(new Date(secondEnd - HOUR).toISOString(), new Date(secondEnd).toISOString(), [{ id: QUADS_EX, sets: sets(100, 8, 'ideal', 3) }]);
    const evalAt = secondEnd + 20 * HOUR;
    const stacked = statusFor([first, second], evalAt);
    const alone = statusFor([second], evalAt);
    expect(stacked.windowHours).toBeGreaterThan(alone.windowHours);
  });

  it('unrated sets count as ideal and lower confidence, never as easy or max', () => {
    const rated = statusFor(steadyStateSessions(100, 8, 'ideal', 3, Date.parse('2026-09-10T18:00:00.000Z')), Date.parse('2026-09-10T18:00:00.000Z'));
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    const unratedSessions: Session[] = [];
    for (let i = 2; i >= 0; i--) {
      const e = end - i * 10 * DAY;
      unratedSessions.push(sessionAt(new Date(e - HOUR).toISOString(), new Date(e).toISOString(), [{ id: QUADS_EX, sets: sets(100, 8, null, 3) }]));
    }
    const unrated = statusFor(unratedSessions, end);
    expect(unrated.windowHours).toBeCloseTo(rated.windowHours, 0);
    expect(unrated.confidence).toBe('low');
  });

  it('soreness of 4 or 5 caps the percentage at 60%, never raises it', () => {
    const s = sessionAt('2026-09-01T17:00:00.000Z', '2026-09-01T18:00:00.000Z', [{ id: QUADS_EX, sets: sets(100, 8, 'easy', 1) }]);
    const now = Date.parse('2026-09-01T18:00:00.000Z') + 6 * DAY; // would otherwise be near 100%
    const today = dayKey(now);
    const capped = statusFor([s], now, { checkIns: [{ day: today, soreness: { quads: 5 } }] });
    expect(capped.pct).toBeLessThanOrEqual(60);
    // QA-R3a-9: past the model's ready time, the soreness decides: no 'ready in under 1h'.
    expect(capped.recovering).toBe(true);
    expect(capped.readyInHours).toBeNull();
    expect(capped.soreToday).toBe(true);
    expect(capped.fullInHours).toBeNull(); // QA2-FC-5
  });

  it('"Mark as fresh" overrides the model to 100%', () => {
    const s = sessionAt('2026-09-10T17:00:00.000Z', '2026-09-10T18:00:00.000Z', [{ id: QUADS_EX, sets: sets(100, 8, 'max', 8) }]);
    const now = Date.parse('2026-09-10T19:00:00.000Z');
    const notFresh = statusFor([s], now);
    expect(notFresh.pct).toBeLessThan(100);
    const marked = statusFor([s], now, { freshMarks: [{ muscle: 'quads', at: '2026-09-10T18:30:00.000Z' }] });
    expect(marked.pct).toBe(100);
  });

  it('recoveryTier maps the same thresholds as before', () => {
    expect(recoveryTier(100)).toBe('ready');
    expect(recoveryTier(95)).toBe('ready');
    expect(recoveryTier(80)).toBe('high');
    expect(recoveryTier(50)).toBe('mid');
    expect(recoveryTier(10)).toBe('low');
  });
});

describe('systemicFactor', () => {
  const at = Date.parse('2026-09-18T12:00:00.000Z');
  it('is neutral with no health data', () => {
    expect(systemicFactor([], [], at)).toBe(1);
  });
  it('slows recovery when the 7-day mean sleep is under 6.5h', () => {
    const days: DailyHealth[] = Array.from({ length: 7 }, (_, i) => ({ day: new Date(at - i * DAY).toISOString().slice(0, 10), sleepMinutes: 5 * 60, source: 'health_connect' as const, syncedAt: '2026-09-18T06:00:00.000Z' }));
    expect(systemicFactor(days, [], at)).toBeGreaterThan(1);
  });
  it('never exceeds the 1.25 cap', () => {
    const days: DailyHealth[] = Array.from({ length: 28 }, (_, i) => ({ day: new Date(at - i * DAY).toISOString().slice(0, 10), sleepMinutes: 4 * 60, restingHr: 75, source: 'health_connect' as const, syncedAt: '2026-09-18T06:00:00.000Z' }));
    const days28: DailyHealth[] = days.map((d, i) => (i < 7 ? d : { ...d, restingHr: 55 }));
    expect(systemicFactor(days28, [], at)).toBeLessThanOrEqual(1.25);
  });
});

describe('calibrateTauScale', () => {
  it('scales up when performance dropped after a high predicted recovery', () => {
    expect(calibrateTauScale(1.0, 90, -8)).toBeCloseTo(1.1, 5);
  });
  it('scales down when performance held despite a low predicted recovery', () => {
    expect(calibrateTauScale(1.0, 60, 2)).toBeCloseTo(0.92, 5);
  });
  it('does nothing in the dead zone between 65 and 85', () => {
    expect(calibrateTauScale(1.0, 75, -8)).toBe(1.0);
  });
  it('does nothing without a performance comparison', () => {
    expect(calibrateTauScale(1.0, 90, null)).toBe(1.0);
  });
  it('is bounded to 0.7-1.6', () => {
    expect(calibrateTauScale(1.59, 90, -20)).toBeLessThanOrEqual(1.6);
    expect(calibrateTauScale(0.71, 60, 5)).toBeGreaterThanOrEqual(0.7);
  });
});

describe('recovery top driver (BR-31)', () => {
  it('names the heaviest-dose exercise with its own set count', () => {
    const end = Date.parse('2026-09-10T18:00:00.000Z');
    // Earlier sessions so neither exercise is new or back from a layoff.
    const prior = steadyStateSessions(140, 5, 'ideal', 3, end - 4 * DAY).map(x => ({ ...x, exercises: [...x.exercises, { exerciseId: 'lib_leg_extension', name: 'Leg extension', sets: sets(30, 15, 'easy', 2) }] }));
    const s = sessionAt(new Date(end - HOUR).toISOString(), new Date(end).toISOString(), [
      { id: QUADS_EX, sets: sets(140, 5, 'ideal', 4) },
      { id: 'lib_leg_extension', sets: sets(30, 15, 'easy', 2) },
    ]);
    const q = statusFor([...prior, s], end);
    expect(q.drivers[0]!.text).toMatch(/: 4 sets$/);
  });
});

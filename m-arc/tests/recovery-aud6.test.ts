import { describe, it, expect } from 'vitest';
import { dayKey, dayOrToday } from '@/core/dates';
import { recoveryStatus, systemicFactor } from '@/brain/recovery';
import { READY_PCT } from '@/data/recovery';
import { muscleFullText } from '@/slices/body/Body';
import { sessionAt, sets, establishedProfile, noFreshMarks, freshRecoveryModel } from './helpers';
import type { CheckIn, DailyHealth, FreshMark, Session } from '@/core/models';

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const now = Date.parse('2026-09-20T12:00:00.000Z');
const today = dayKey(new Date(now));
const BENCH = 'lib_barbell_bench_press';
const SQUAT = 'lib_barbell_back_squat';

function status(sessions: Session[], at: number, muscle: string, checkIns: CheckIn[] = [], freshMarks: FreshMark[] = noFreshMarks) {
  return recoveryStatus({ sessions, custom: [], now: at, profile: establishedProfile, healthDays: [], checkIns, freshMarks, recoveryModel: freshRecoveryModel }).find(r => r.muscle === muscle)!;
}
const sore = (rating: 1 | 2 | 3 | 4 | 5): CheckIn[] => [{ day: today, soreness: { chest: rating } }];
const benchAt = (end: number): Session => sessionAt(new Date(end - HOUR).toISOString(), new Date(end).toISOString(), [{ id: BENCH, sets: sets(80, 8, 'ideal', 3) }]);

describe('AUD-6 SCI-03: today\'s soreness counts without a log or after a fresh mark', () => {
  it('no history and chest soreness 5: chest is below ready and not ready', () => {
    const r = status([], now, 'chest', sore(5));
    expect(r.pct).toBeLessThan(READY_PCT);
    expect(r.ready).toBe(false);
    expect(r.recovering).toBe(true);
    expect(r.soreToday).toBe(true);
    expect(r.readyInHours).toBeNull();
    expect(r.fullInHours).toBeNull();
  });
  it('unrelated history (squats only): chest soreness 5 still holds chest back', () => {
    const squat = sessionAt(new Date(now - 30 * HOUR).toISOString(), new Date(now - 29 * HOUR).toISOString(), [{ id: SQUAT, sets: sets(100, 8, 'ideal', 3) }]);
    expect(status([squat], now, 'chest', sore(5)).ready).toBe(false);
  });
  it('a fresh mark older than today\'s check-in does not override the soreness', () => {
    const marks: FreshMark[] = [{ muscle: 'chest', at: new Date(now - DAY).toISOString() }];
    const withLog = status([benchAt(now - 2 * DAY)], now, 'chest', sore(5), marks);
    expect(withLog.pct).toBeLessThan(READY_PCT);
    expect(withLog.ready).toBe(false);
    expect(status([], now, 'chest', sore(5), marks).ready).toBe(false);
  });
  it('a fresh mark made today outranks today\'s soreness (D-AUD6-1)', () => {
    const marks: FreshMark[] = [{ muscle: 'chest', at: new Date(now - HOUR).toISOString() }];
    const r = status([benchAt(now - 2 * DAY)], now, 'chest', sore(5), marks);
    expect(r.pct).toBe(100);
    expect(r.ready).toBe(true);
  });
  it('soreness under the cap rating and no check-in leave an unlogged muscle at 100', () => {
    expect(status([], now, 'chest', sore(3)).pct).toBe(100);
    expect(status([], now, 'chest').ready).toBe(true);
  });
});

describe('AUD-6 SCI-06: only a rise in resting HR slows recovery', () => {
  const days = (recent: number, base: number): DailyHealth[] => Array.from({ length: 28 }, (_, i) => ({
    day: dayKey(new Date(now - i * DAY)), restingHr: i < 7 ? recent : base, source: 'health_connect' as const, syncedAt: '2026-09-20T06:00:00.000Z',
  }));
  it('21 days at 60 bpm then 7 at 50 bpm gives 1.0', () => {
    expect(systemicFactor(days(50, 60), [], now)).toBe(1);
  });
  it('the mirror case (60 then 70) still gives 1.1', () => {
    expect(systemicFactor(days(70, 60), [], now)).toBeCloseTo(1.1, 10);
  });
});

describe('AUD-6 UI-07: a ready muscle short of full shows its day, not "Now"', () => {
  it('pct 90 with fullInHours > 0 shows a day', () => {
    const r = { recovering: false, fullInHours: 31.8 };
    expect(muscleFullText(now, r)).not.toBe('Now');
    expect(muscleFullText(now, r)).toBe(dayOrToday(now, 31.8));
  });
  it('the model\'s own ready-not-full state shows a day', () => {
    const end = now - 60 * HOUR;
    let at = end;
    let r = status([benchAt(end)], at, 'chest');
    while (r.pct < READY_PCT && at < end + 10 * DAY) { at += HOUR; r = status([benchAt(end)], at, 'chest'); }
    expect(r.ready).toBe(true);
    expect(r.recovering).toBe(false);
    expect(r.fullInHours).toBeGreaterThan(0);
    expect(muscleFullText(at, r)).not.toBe('Now');
  });
  it('full, unlogged and recovering cases keep their text', () => {
    expect(muscleFullText(now, { recovering: false, fullInHours: 0 })).toBe('Now');
    expect(muscleFullText(now, { recovering: false, fullInHours: null })).toBe('Now');
    expect(muscleFullText(now, { recovering: true, fullInHours: 40 })).toBe(dayOrToday(now, 40));
    expect(muscleFullText(now, { recovering: true, fullInHours: null, beyondCap: true })).toBe('5+ days');
    expect(muscleFullText(now, { recovering: true, fullInHours: null })).toBe('When soreness eases');
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import { calibrateAfterSession, calibrateTauScale, lastSummaryAlone, recoveryStatus, type MuscleRecovery } from '@/brain/recovery';
import { readiness, type ReadinessInput } from '@/brain/readiness';
import { coachInsights } from '@/brain/coach/rules';
import { formatHoursLeft, readyGroupFor, weekdayOf, addDays } from '@/core/dates';
import { emptySchedule, freshState, type CheckIn, type Profile, type RecoveryModel, type Session, type Split } from '@/core/models';
import { replaceState, state } from '@/core/store';
import { saveCheckIn, checkInDraft } from '@/slices/readiness/checkIn';
import { rebuildRecoveryModel, sortByStart } from '@/slices/workout/session';
import { baseCoachExtras, sessionAt, sets, establishedProfile, freshRecoveryModel } from './helpers';

// BUG-17: recovery model states (RECOVERY-F1, F3, F4, F5, F6, F7, F11).
const SQUAT = 'lib_barbell_back_squat';
const HOUR = 3_600_000, DAY = 24 * HOUR;
const iso = (ms: number) => new Date(ms).toISOString();
const at = (ms: number, exs: Array<{ id: string; sets: ReturnType<typeof sets> }>, splitId?: string): Session => sessionAt(iso(ms), iso(ms + HOUR), exs, splitId);
const novice: Profile = { name: 'N' };
const quadsOf = (sessions: Session[], now: number, extra: Partial<Parameters<typeof recoveryStatus>[0]> = {}): MuscleRecovery =>
  recoveryStatus({ sessions, custom: [], now, profile: novice, healthDays: [], checkIns: [], freshMarks: [], recoveryModel: freshRecoveryModel, ...extra }).find(r => r.muscle === 'quads')!;

describe('A1: a muscle still under 90 % at the 120 h cap reads "5+ days" (RECOVERY-F1)', () => {
  const t0 = Date.parse('2026-09-20T17:00:00Z');
  const hard = [0, 1, 2].map(d => at(t0 + d * DAY, [{ id: SQUAT, sets: sets(100, 12, 'max', 10) }], 'legs'));
  const now = t0 + 2 * DAY + 2 * HOUR;

  it('the model flags it past the cap, never "0 hours left"', () => {
    const r = quadsOf(hard, now);
    expect(r.recovering).toBe(true);
    expect(r.beyondCap).toBe(true);
    expect(r.hoursLeft).toBeGreaterThanOrEqual(120);
    expect(r.readyInHours).toBeNull();
  });

  it('Today, Body and the muscle panel all say 5+ days', () => {
    const r = quadsOf(hard, now);
    expect(formatHoursLeft(r)).toBe('5+ days');
    const g = readyGroupFor(now, r);
    expect(g.tileText).toBe('5+ days');
    expect(g.detailText).toBe('Ready in 5+ days');
    expect(g.group).toBe('later');
    // A muscle that reaches ready within the cap keeps its hours.
    const light = quadsOf([at(t0, [{ id: SQUAT, sets: sets(100, 8, 'ideal', 3) }])], t0 + 2 * HOUR, { profile: establishedProfile });
    expect(light.beyondCap).toBeFalsy();
    expect(formatHoursLeft(light)).not.toBe('5+ days');
  });

  it('past 120 h since training it solves to the model\'s 7-day floor instead of the cap', () => {
    const r = quadsOf(hard, t0 + 2 * DAY + HOUR + 122 * HOUR); // 122 h after the last session ended
    expect(r.recovering).toBe(true);
    expect(r.beyondCap).toBeFalsy();
    expect(r.hoursLeft).toBeGreaterThan(0);
    expect(r.readyInHours).not.toBeNull();
  });

  it('110 h after training it gives the real time left, not "5+ days" (review of 82c4625)', () => {
    const r = quadsOf(hard, t0 + 2 * DAY + HOUR + 110 * HOUR);
    expect(r.recovering).toBe(true);
    expect(r.beyondCap).toBeFalsy();
    expect(r.hoursLeft).toBeGreaterThan(0);
    expect(r.hoursLeft).toBeLessThan(48);
    expect(r.readyInHours).not.toBeNull();
    expect(formatHoursLeft(r)).not.toBe('5+ days');
  });

  it('the coach does not warn about a session scheduled after the real ready time', () => {
    const now110 = t0 + 2 * DAY + HOUR + 110 * HOUR;
    const today = iso(now110).slice(0, 10);
    const legs: Split = { id: 'legs', name: 'Legs', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: SQUAT, sets: 3 }] };
    // Legs today (done, as arms only) and again in 2 days, past quads' real ready time.
    const schedule = { ...emptySchedule(), [weekdayOf(today)]: 'legs', [weekdayOf(addDays(today, 2))]: 'legs' };
    const doneToday = at(now110 - HOUR, [{ id: 'lib_dumbbell_biceps_curl', sets: sets(15, 10, 'ideal', 3) }], 'legs');
    const notes = coachInsights({ ...baseCoachExtras, profile: novice, sessions: [...hard, doneToday], splits: [legs], schedule, custom: [], today, now: now110 }, 20);
    const done = notes.find(i => i.id === 'recovery.done-today:legs');
    expect(done).toBeDefined();
    expect(done!.means).not.toContain('Quads should be ready');
  });

  it('the coach warns that the next scheduled session hits a not-ready muscle', () => {
    const today = iso(now).slice(0, 10);
    const legs: Split = { id: 'legs', name: 'Legs', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: SQUAT, sets: 3 }] };
    const schedule = { ...emptySchedule(), [weekdayOf(today)]: 'legs', [weekdayOf(addDays(today, 1))]: 'legs' };
    const notes = coachInsights({ ...baseCoachExtras, profile: novice, sessions: hard, splits: [legs], schedule, custom: [], today, now }, 20);
    const done = notes.find(i => i.id === 'recovery.done-today:legs');
    expect(done?.means).toContain('Quads should be ready in more than 5 days');
  });
});

describe('A2: doses at or before a fresh mark never stack again (RECOVERY-F3)', () => {
  it('one easy set after a mark reads at least as fresh as that set alone', () => {
    const t0 = Date.parse('2026-09-10T17:00:00Z');
    const heavy = [0, 1].map(d => at(t0 + d * DAY, [{ id: SQUAT, sets: sets(120, 8, 'max', 6) }]));
    const markAt = t0 + 2 * DAY;
    const easy = at(t0 + 2 * DAY + 2 * HOUR, [{ id: SQUAT, sets: sets(60, 8, 'easy', 1) }]);
    const now = t0 + 2 * DAY + 5 * HOUR;
    const freshMarks = [{ muscle: 'quads' as const, at: iso(markAt) }];
    expect(quadsOf(heavy, markAt + HOUR, { profile: establishedProfile, freshMarks }).pct).toBe(100);
    const after = quadsOf([...heavy, easy], now, { profile: establishedProfile, freshMarks });
    const alone = quadsOf([easy], now, { profile: establishedProfile });
    expect(after.pct).toBeGreaterThanOrEqual(alone.pct);
    // A mark in the future (coach projections) does not count yet.
    const future = quadsOf(heavy, markAt - 3 * HOUR, { profile: establishedProfile, freshMarks });
    expect(future.pct).toBeLessThan(100);
  });
});

describe('A3: tauScale moves only beyond noise and decays toward 1.0 (RECOVERY-F4)', () => {
  it('a drop inside two typical errors (8 %) changes nothing', () => {
    expect(calibrateTauScale(1.0, 90, -6)).toBe(1.0);
    expect(calibrateTauScale(1.0, 90, -7.9)).toBe(1.0);
    expect(calibrateTauScale(1.0, 90, -8)).toBeCloseTo(1.1, 5);
  });

  it('a session with no evidence pulls a learned tauScale slowly back toward 1.0', () => {
    const s = at(Date.parse('2026-09-10T17:00:00Z'), [{ id: SQUAT, sets: sets(100, 8, 'ideal', 3) }]);
    const up = calibrateAfterSession([], s, [], establishedProfile, [], { tauScale: { quads: 1.5 }, observations: { quads: 3 } });
    expect(up.tauScale.quads).toBeLessThan(1.5);
    expect(up.tauScale.quads).toBeGreaterThan(1.45);
    expect(up.observations.quads).toBe(3);
    const down = calibrateAfterSession([], s, [], establishedProfile, [], { tauScale: { quads: 0.8 }, observations: {} });
    expect(down.tauScale.quads).toBeGreaterThan(0.8);
    expect(down.tauScale.quads).toBeLessThan(0.82);
    // Untrained muscles keep what was learned.
    const chest = calibrateAfterSession([], s, [], establishedProfile, [], { tauScale: { chest: 1.3 }, observations: {} });
    expect(chest.tauScale.chest).toBe(1.3);
  });

  it('evidence held back by the clamp never decays (review of 82c4625)', () => {
    const t0 = Date.parse('2026-08-01T17:00:00Z');
    const prior = at(t0, [{ id: SQUAT, sets: sets(140, 5, 'max', 3) }]);
    const drop = at(t0 + 3 * DAY, [{ id: SQUAT, sets: sets(120, 5, 'max', 3) }]);
    const r = calibrateAfterSession([prior], drop, [], establishedProfile, [], { tauScale: { quads: 1.6 }, observations: { quads: 5 } });
    expect(r.tauScale.quads).toBe(1.6);
  });

  it('a year of flat strength with ±3 % day-to-day noise does not ratchet tauScale up', () => {
    const noise = [0, -3, 3, -2, 2, -3, 1, 3, -3, 0, 2, -2];
    const t0 = Date.parse('2025-09-01T17:00:00Z');
    const list = Array.from({ length: 104 }, (_, i) => at(t0 + i * 3.5 * DAY, [{ id: SQUAT, sets: sets(100 * (1 + noise[i % noise.length]! / 100), 5, 'max', 3) }]));
    const scale = rebuildRecoveryModel({ sessions: list, customExercises: [], profile: establishedProfile, healthDays: [] }).tauScale.quads ?? 1;
    expect(scale).toBeLessThan(1.05);
    expect(scale).toBeGreaterThan(0.95);
  });
});

describe('A4: a second check-in merges, never wipes (RECOVERY-F5)', () => {
  beforeEach(() => { replaceState(freshState()); });
  const day = '2026-09-28';
  it('undefined answers keep the earlier ones and soreness merges per muscle', () => {
    saveCheckIn(day, { sleepQuality: 4, mood: 5, soreness: { chest: 2 } });
    saveCheckIn(day, { sleepQuality: undefined, mood: undefined, soreness: { quads: 4 } });
    expect(state.value.checkIns).toEqual([{ day, sleepQuality: 4, mood: 5, soreness: { chest: 2, quads: 4 } }]);
    saveCheckIn(day, { mood: 2, soreness: { chest: 3 } });
    expect(state.value.checkIns).toEqual([{ day, sleepQuality: 4, mood: 2, soreness: { chest: 3, quads: 4 } }]);
  });
  it('the reopened sheet starts from today\'s answers', () => {
    const existing: CheckIn = { day, sleepQuality: 3, mood: 4, soreness: { quads: 5 } };
    expect(checkInDraft(existing)).toEqual({ sleepQuality: 3, mood: 4, soreness: { quads: 5 } });
    expect(checkInDraft(undefined)).toEqual({ sleepQuality: undefined, mood: undefined, soreness: {} });
  });
});

describe('A5: calibration skips a comparison across a layoff (RECOVERY-F6)', () => {
  const t0 = Date.parse('2026-08-01T17:00:00Z');
  const max = (ms: number, kg: number) => at(ms, [{ id: SQUAT, sets: sets(kg, 5, 'max', 3) }]);
  it('squat to max at 140, then 120 after 35 days off: no step, no observation', () => {
    const r = calibrateAfterSession([max(t0, 140)], max(t0 + 35 * DAY, 120), [], establishedProfile, [], freshRecoveryModel);
    expect(r.tauScale.quads ?? 1).toBe(1);
    expect(r.observations.quads ?? 0).toBe(0);
  });
  it('a comparison 7 or more days old says nothing about hours of recovery', () => {
    const r = calibrateAfterSession([max(t0, 140)], max(t0 + 8 * DAY, 120), [], establishedProfile, [], freshRecoveryModel);
    expect(r.observations.quads ?? 0).toBe(0);
  });
  it('a real drop 3 days apart still calibrates', () => {
    const r = calibrateAfterSession([max(t0, 140)], max(t0 + 3 * DAY, 120), [], establishedProfile, [], freshRecoveryModel);
    expect(r.observations.quads).toBe(1);
  });
});

describe('A6: a rebuild learns exactly what finish stored (RECOVERY-F7)', () => {
  const replayFinish = (list: Session[], profile: Profile): RecoveryModel => {
    // What finishSession stores, session by session: full prior history, and the exercise's last
    // session summarised on its own (BUG-18: lastSummaryAlone, as the rebuild sees it).
    let model: RecoveryModel = { tauScale: {}, observations: {} };
    const sorted = sortByStart(list);
    sorted.forEach((s, i) => {
      const prior = sorted.slice(0, i);
      model = calibrateAfterSession(prior, s, [], profile, [], model, id => lastSummaryAlone(prior, id, []));
    });
    return model;
  };

  it('no training start set: the rebuild dates training age from the first session, as finish did', () => {
    // Weekly bench from 31 March, then squat pairs in September: finish counts under 6 months (novice),
    // the old rebuild counted from 1 March (intermediate), so it saw a faster recovery and stepped up.
    const list: Session[] = [];
    for (let t = Date.parse('2026-03-31T07:00:00Z'); t < Date.parse('2026-09-10T07:00:00Z'); t += 7 * DAY) list.push(at(t, [{ id: 'lib_barbell_bench_press', sets: sets(80, 8, 'ideal', 3) }]));
    const a = Date.parse('2026-09-18T07:00:00Z');
    list.push(at(a - 3 * DAY, [{ id: SQUAT, sets: sets(100, 5, 'ideal', 3) }]));
    list.push(at(a, [{ id: SQUAT, sets: sets(100, 5, 'max', 5) }]));
    list.push(at(a + 72 * HOUR, [{ id: SQUAT, sets: sets(90, 5, 'max', 3) }]));
    expect(rebuildRecoveryModel({ sessions: list, customExercises: [], profile: novice, healthDays: [] })).toEqual(replayFinish(list, novice));
  });

  it('replaying finish over a varied half-year gives the same model as rebuildRecoveryModel', () => {
    let seed = 7;
    const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
    const EX = [SQUAT, 'lib_barbell_bench_press', 'lib_barbell_row', 'lib_leg_extension', 'lib_barbell_overhead_press', 'lib_romanian_deadlift'];
    const efforts = ['easy', 'ideal', 'max'] as const;
    const list: Session[] = [];
    let t = Date.parse('2026-03-02T07:00:00Z');
    for (let i = 0; i < 90; i++) {
      const exs = EX.filter(() => rnd() < 0.5).map(id => ({ id, sets: sets(Math.round(60 + rnd() * 60), 3 + Math.floor(rnd() * 8), efforts[Math.floor(rnd() * 3)]!, 1 + Math.floor(rnd() * 5)) }));
      if (exs.length) list.push(at(t, exs));
      t += rnd() < 0.15 ? 9 * HOUR : Math.round((1 + rnd() * 4) * DAY); // some same-day doubles, some long gaps
      if (i === 40) t += 30 * DAY;
    }
    const model = replayFinish(list, novice);
    expect(Object.keys(model.observations).length).toBeGreaterThan(0);
    expect(rebuildRecoveryModel({ sessions: list, customExercises: [], profile: novice, healthDays: [] })).toEqual(model);
  });
});

describe('F7: a dose never depends on a later session (whole-body factor)', () => {
  it('a heavy second session later the same day leaves the first one\'s recovery time as it was', () => {
    // Four weeks of hour-long easy sessions, a short squat session in the morning (load ratio about
    // 0.65 alone) and a very long max session in the afternoon (ratio near 3, factor 1.25 for the day).
    const day0 = Date.parse('2026-09-01T07:00:00Z');
    const history = [0, 7, 14, 21].map(d => at(day0 + d * DAY, [{ id: 'lib_barbell_row', sets: sets(60, 8, 'easy', 2) }]));
    const morning = sessionAt(iso(day0 + 28 * DAY), iso(day0 + 28 * DAY + 20 * 60_000), [{ id: SQUAT, sets: sets(100, 8, 'ideal', 3) }]);
    const afternoon = sessionAt(iso(day0 + 28 * DAY + 8 * HOUR), iso(day0 + 28 * DAY + 11 * HOUR), [{ id: 'lib_barbell_bench_press', sets: sets(80, 8, 'max', 12) }]);
    const evalAt = day0 + 28 * DAY + 12 * HOUR;
    const without = quadsOf([...history, morning], evalAt, { profile: establishedProfile });
    const withLater = quadsOf([...history, morning, afternoon], evalAt, { profile: establishedProfile });
    expect(withLater.windowHours).toBe(without.windowHours);
    expect(withLater.pct).toBe(without.pct);
  });
});

describe('F11: a flat check-in history still counts a bad day', () => {
  it('mood 1 against a history of all 3s scores below mood 3', () => {
    const today = '2026-09-22';
    const history: CheckIn[] = Array.from({ length: 10 }, (_, i) => ({ day: addDays(today, -(i + 1)), mood: 3, sleepQuality: 3 }));
    const base: ReadinessInput = { today, now: Date.parse(`${today}T12:00:00Z`), healthDays: [], checkIn: undefined, checkInHistory: history, recovery: [], scheduledSplit: undefined, custom: [], sessions: [] };
    const bad = readiness({ ...base, checkIn: { day: today, mood: 1 } })!;
    const usual = readiness({ ...base, checkIn: { day: today, mood: 3 } })!;
    expect(usual.score).toBe(75); // ADAPT-2: the usual answer reads normal (0.75), was 50
    expect(bad.score).toBeLessThan(usual.score);
  });
});

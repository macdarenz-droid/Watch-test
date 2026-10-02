import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const remindersMock = vi.hoisted(() => ({ resyncReminders: vi.fn(async () => undefined) }));
vi.mock('@/slices/settings/reminders', () => remindersMock);

import { replaceState, state } from '@/core/store';
import { freshState, type Split } from '@/core/models';
import { addSet, commitSet, finishSession, logWarmups, pauseSession, resumeSession, setSet, startSession } from '@/slices/workout/session';
import * as session from '@/slices/workout/session';
import { burstShare, liveSessionLogging } from '@/brain/fidelity';
import { latestMeasurement } from '@/native/watch';
import { startHeartCapture } from '@/slices/workout/heart';

// BUG-19: live session end time, paused time and rest seconds (DATES-F1, F2, F3, F5, F11).
const split: Split = { id: 'sp', name: 'Push', color: '#fff', focus: [], createdAt: '', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 1 }, { exerciseId: 'lib_cable_fly', sets: 1 }] };
const T0 = Date.parse('2026-09-22T10:00:00.000Z');
const MIN = 60_000;

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(T0);
  replaceState({ ...freshState(), splits: [split], preferences: { ...freshState().preferences, autoRest: false } });
});
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

const a = () => state.value.active!;
const at = (ms: number) => vi.setSystemTime(T0 + ms);
/** Fill and commit set `index` of `entry` at `ms` after the start, adding sets as needed. */
function logSet(entry: number, index: number, ms: number, reps = 8): void {
  while (a().entries[entry]!.sets.length <= index) addSet(entry);
  at(ms);
  setSet(entry, index, { kg: 60, reps });
  commitSet(entry, index);
}

describe('BUG-19 A1: a forgotten Finish (DATES-F1)', () => {
  it('Finish 12 h after the last set ends the session 5 min after that set, not 12 h later', () => {
    startSession(split);
    logSet(0, 0, 1 * MIN); logSet(0, 1, 5 * MIN); logSet(0, 2, 10 * MIN);
    at(10 * MIN + 12 * 60 * MIN);
    const { session: s } = finishSession(false)!;
    expect(s.endedAt).toBe(new Date(T0 + 15 * MIN).toISOString());
    expect(s.logging.trainedEndAt).toBe(s.endedAt);
    expect(s.durationSec).toBe(15 * 60);
    expect(s.logging.loggedAt).toBe(new Date(Date.now()).toISOString());
    expect(s.logging.timingTrusted && s.durationSec > 3600).toBe(false);
  });
  it('the common path is unchanged: Finish 2 min after the last set ends it now, with the full time', () => {
    startSession(split);
    logSet(0, 0, 1 * MIN); logSet(0, 1, 5 * MIN); logSet(0, 2, 10 * MIN);
    at(12 * MIN);
    expect(session.finishTiming(a())).toEqual({ endedAtMs: T0 + 12 * MIN, durationSec: 12 * 60, trimmed: false });
    const { session: s } = finishSession(false)!;
    expect(s.endedAt).toBe(new Date(T0 + 12 * MIN).toISOString());
    expect(s.durationSec).toBe(12 * 60);
    expect(s.logging).toMatchObject({ mode: 'live', timingTrusted: true, loggedAt: s.endedAt });
  });
  it('the finish sheet reads the same trimmed time that is saved, and a pause before the last set stays out', () => {
    startSession(split);
    logSet(0, 0, 1 * MIN);
    at(2 * MIN); pauseSession(); at(12 * MIN); resumeSession();
    logSet(0, 1, 14 * MIN);
    at(14 * MIN + 3 * 60 * MIN);
    const sheet = session.finishTiming(a());
    expect(sheet).toEqual({ endedAtMs: T0 + 19 * MIN, durationSec: (14 - 10 + 5) * 60, trimmed: true });
    expect(finishSession(false)!.session.durationSec).toBe(sheet.durationSec);
  });
});

describe('BUG-19 A2: saved duration leaves out paused time (DATES-F2)', () => {
  it('a 60-min session with a 30-min pause saves 30 min, what the finish sheet showed', () => {
    startSession(split);
    logSet(0, 0, 5 * MIN);
    at(20 * MIN); pauseSession(); at(50 * MIN); resumeSession();
    logSet(0, 1, 55 * MIN);
    at(60 * MIN);
    expect(session.elapsedSec(a())).toBe(30 * 60);
    expect(finishSession(false)!.session.durationSec).toBe(30 * 60);
  });
});

describe('BUG-19 A3: pre-filled warm-ups are not live sets (DATES-F3)', () => {
  it('4 never-committed warm-ups do not turn 4 caught-up bench sets into trusted timing', () => {
    startSession(split);
    logSet(1, 0, 1 * MIN, 12); logSet(1, 1, 3 * MIN, 12); logSet(1, 2, 5 * MIN, 12);
    logWarmups(0, [{ kg: 20, reps: 10 }, { kg: 40, reps: 5 }, { kg: 50, reps: 3 }, { kg: 55, reps: 2 }]);
    for (let i = 0; i < 4; i++) logSet(0, 4 + i, 7 * MIN + i * 3000);
    at(8 * MIN + 20_000);
    const { session: s } = finishSession(false)!;
    expect(s.exercises[0]!.sets.filter(x => x.kind === 'warmup')).toHaveLength(4); // still saved
    expect(s.logging.liveShare).toBeCloseTo(4 / 7, 5);
    expect(s.logging.timingTrusted).toBe(false);
  });
});

describe('BUG-19 A4: rest leaves out the set itself and any pause (DATES-F5)', () => {
  it('a real 105 s rest before a 7-rep set reads 105 s, not the 126 s commit gap', () => {
    startSession(split);
    logSet(0, 0, 1 * MIN);
    logSet(0, 1, 1 * MIN + 126_000, 7);
    expect(a().entries[0]!.sets[1]!.restSec).toBe(105);
  });
  it('a timed set takes its own duration off the gap', () => {
    startSession(split);
    logSet(0, 0, 1 * MIN);
    at(3 * MIN);
    addSet(0);
    setSet(0, 1, { kg: 32, durationSec: 40 });
    commitSet(0, 1);
    expect(a().entries[0]!.sets[1]!.restSec).toBe(120 - 40);
  });
  it('a 10-min pause between sets is neither rest nor a late log', () => {
    startSession(split);
    logSet(0, 0, 1 * MIN);
    at(2 * MIN); pauseSession(); at(12 * MIN); resumeSession();
    logSet(0, 1, 13 * MIN + 24_000);
    const s = a().entries[0]!.sets[1]!;
    expect(s.fidelity).toBe('live');
    expect(s.restSec).toBe(2 * 60 + 24 - 8 * 3);
  });
  it('after an app restart a gap in a paused session is unknown: delayed, and no rest (plan scenario 6)', async () => {
    startSession(split);
    logSet(0, 0, 1 * MIN);
    at(2 * MIN); pauseSession(); at(12 * MIN); resumeSession();
    const saved = structuredClone(state.value);
    vi.resetModules();
    const store = await import('@/core/store');
    const fresh = await import('@/slices/workout/session');
    store.replaceState(saved);
    fresh.addSet(0);
    at(13 * MIN);
    fresh.setSet(0, 1, { kg: 60, reps: 8 });
    fresh.commitSet(0, 1);
    const s = store.state.value.active!.entries[0]!.sets[1]!;
    expect(s.fidelity).toBe('delayed');
    expect(s.restSec).toBeUndefined();
  });
  it('a session that never paused needs no memory: a restart keeps the gap known', async () => {
    startSession(split);
    logSet(0, 0, 1 * MIN);
    const saved = structuredClone(state.value);
    vi.resetModules();
    const store = await import('@/core/store');
    const fresh = await import('@/slices/workout/session');
    store.replaceState(saved);
    fresh.addSet(0);
    at(3 * MIN);
    fresh.setSet(0, 1, { kg: 60, reps: 8 });
    fresh.commitSet(0, 1);
    expect(store.state.value.active!.entries[0]!.sets[1]).toMatchObject({ fidelity: 'live', restSec: 120 - 24 });
  });
});

describe('BUG-19 A5: burst share counts only bursts (DATES-F11)', () => {
  const base = { startedAt: '2026-09-18T17:00:00.000Z', endedAt: '2026-09-18T18:00:00.000Z', loggedDurationSec: 3600, workingSetCount: 10 };
  const spaced = (n: number, from = 0) => Array.from({ length: n }, (_, i) => Date.parse(base.startedAt) + from + i * 150_000);
  it('burstShare counts every member of a 3-in-15 s run and nothing else', () => {
    expect(burstShare([0, 5_000, 10_000, 200_000])).toBe(3 / 4);
    expect(burstShare([0, 10_000, 200_000, 400_000])).toBe(0);
    expect(burstShare([0, 5_000, 16_000, 21_000])).toBe(0);
  });
  it('3 sets delayed by long gaps are not a burst: 7 live + 3 late stays live and trusted', () => {
    const l = liveSessionLogging({ ...base, setFidelities: [...Array(7).fill('live'), ...Array(3).fill('delayed')], commitMs: spaced(10) });
    expect(l.flags).not.toContain('burst');
    expect(l).toMatchObject({ mode: 'live', timingTrusted: true });
  });
  it('4 live + 6 late (no burst) is not compressed', () => {
    const l = liveSessionLogging({ ...base, setFidelities: [...Array(4).fill('live'), ...Array(6).fill('delayed')], commitMs: spaced(10) });
    expect(l.flags).not.toContain('compressed');
    expect(l.mode).toBe('mixed');
  });
  it('7 live + a 3-set burst is flagged burst and not trusted (plan :803)', () => {
    const commits = [...spaced(7), Date.parse(base.startedAt) + 1_900_000, Date.parse(base.startedAt) + 1_905_000, Date.parse(base.startedAt) + 1_910_000];
    const l = liveSessionLogging({ ...base, setFidelities: [...Array(7).fill('live'), ...Array(3).fill('delayed')], commitMs: commits });
    expect(l.flags).toContain('burst');
    expect(l.mode).toBe('live');
    expect(l.timingTrusted).toBe(false);
  });
});

describe('BUG-19: the heart summary ends where the session ends (review finding 1)', () => {
  it('a forgotten Finish 12 h later keeps zones, energy and coverage to the first 15 min', () => {
    // heartStore writes the series to localStorage; a map stands in for it here.
    const mem = new Map<string, string>();
    vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => { mem.set(k, v); }, removeItem: (k: string) => { mem.delete(k); }, clear: () => mem.clear(), key: (i: number) => [...mem.keys()][i] ?? null, get length() { return mem.size; } });
    replaceState({ ...state.value, profile: { name: 'T', bodyWeightKg: 80, heightCm: 180, sex: 'male', birthYear: 1990, restingHrOverride: 60 } });
    startHeartCapture();
    latestMeasurement.value = null;
    startSession(split);
    const beat = (sec: number, bpm: number) => { latestMeasurement.value = { bpm, contact: true, rrMs: [], energyKj: null, receivedAtEpochMs: T0 + sec * 1000, receivedAtElapsedMs: sec * 1000 }; };
    // Training: 150 bpm every 10 s for the first 15 min (half coverage). Then the watch stays on for
    // 12 h at 130 bpm, which is inside zone 1, every 5 s.
    for (let t = 0; t <= 15 * 60; t += 10) beat(t, 150);
    logSet(0, 0, 1 * MIN); logSet(0, 1, 5 * MIN); logSet(0, 2, 10 * MIN);
    for (let t = 15 * 60 + 5; t <= 12 * 3600; t += 5) beat(t, 130);
    at(12 * 3600 * 1000);
    const { session: s } = finishSession(false)!;
    expect(s.durationSec).toBe(15 * 60);
    const h = s.heart!;
    expect(h.zoneSec.reduce((x, y) => x + y, 0)).toBeLessThanOrEqual(15 * 60 + 5);
    expect(h.minBpm).toBe(150);
    expect(h.samples).toBeLessThanOrEqual(15 * 60 / 10 + 1);
    expect(h.coverage).toBeCloseTo(0.5, 1);
    expect(h.energy).toBeDefined();
    expect(h.energy!.minutes).toBeLessThanOrEqual(16);
  });
});

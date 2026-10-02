/**
 * AUD-7: heart and Health Connect inputs (SCI-07, NAT-01, NAT-02, NAT-03).
 * Each block fails on main d5ebc77 and passes with the fix.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { observedHrMaxFromSeries, sessionDrift, DRIFT } from '@/brain/heart';
import { sessionEnergy } from '@/brain/energy';
import { replaceState, state } from '@/core/store';
import { freshState, type Profile, type Session } from '@/core/models';
import { latestMeasurement, watchStatus, onNativeStatus, onNativeMeasurement, tickFreshness, agedFreshness, type WatchMeasurement, type WatchStatus } from '@/native/watch';
import { recentLiveBpms, resetHeartCapture, startHeartCapture, finishHeartCapture } from '@/slices/workout/heart';
import { mapHealthSummary, mainSleep } from '@/native/health';

describe('SCI-07: max HR needs a contiguous run of readings', () => {
  it('five readings 10 minutes apart are not a plateau', () => {
    expect(observedHrMaxFromSeries([[0, 200], [600, 201], [1200, 200], [1800, 201], [2400, 200]])).toBeNull();
  });

  it('the same values 5 s apart, after a ramp, give 200', () => {
    expect(observedHrMaxFromSeries([[0, 180], [5, 190], [10, 200], [15, 201], [20, 200], [25, 201], [30, 200]])).toBe(200);
  });

  it('a gap-free noisy plateau keeps main\'s value (lead-in below the plateau max, not its min)', () => {
    const at5 = (bpms: number[]) => bpms.map((b, i) => [i * 5, b] as [number, number]);
    // Main d5ebc77 gives 182 and 184 for these; a lead-in below the plateau's min gives 183 for the second.
    expect(observedHrMaxFromSeries(at5([160, 180, 182, 181, 180, 182, 181, 183, 182, 183, 183]))).toBe(182);
    expect(observedHrMaxFromSeries(at5([160, 180, 181, 182, 183, 183, 184, 184, 183, 184, 183]))).toBe(184);
  });

  it('a plateau with no lead-in, or with a gap inside it, is not a max', () => {
    expect(observedHrMaxFromSeries([[0, 200], [5, 201], [10, 200], [15, 201], [20, 200]])).toBeNull();
    expect(observedHrMaxFromSeries([[0, 180], [5, 200], [10, 201], [15, 200], [100, 201], [105, 200]])).toBeNull();
  });

  it('a ramp reading separated from the plateau by a disconnect is not a ramp', () => {
    expect(observedHrMaxFromSeries([[0, 150], [300, 200], [305, 201], [310, 200], [315, 201], [320, 200]])).toBeNull();
  });

  it('the drift ready run needs three adjacent 5-second points', () => {
    // Six sets 200 s apart. After each set four low points arrive, but 40 s apart: readings across gaps.
    const at = [200, 400, 600, 800, 1000, 1200];
    const series: Array<[number, number]> = [];
    for (const t of at) {
      for (const k of [15, 10, 5]) series.push([t - k, 100]); // pre-set window
      series.push([t + 5, 160], [t + 45, 80], [t + 85, 80], [t + 125, 80], [t + 165, 80]);
    }
    series.sort((a, b) => a[0] - b[0]);
    const d = sessionDrift({ series, sessionSec: DRIFT.minSessionSec, setAtSec: at, restingHrBpm: 60, hrMaxBpm: 190 });
    expect(d).not.toBeNull();
    expect(d!.readySlopeSecPerSet).toBeNull();
  });
});

const START = Date.parse('2026-09-22T09:00:00Z');
const meas = (sec: number, bpm: number): WatchMeasurement => ({ bpm, contact: true, rrMs: [], energyKj: null, receivedAtEpochMs: START + sec * 1000, receivedAtElapsedMs: sec * 1000 });
const profile: Profile = { name: '', bodyWeightKg: 80, heightCm: 180, sex: 'male', birthYear: 1990 };

describe('NAT-02: paused time adds no heart samples, energy or zones', () => {
  beforeEach(() => {
    // heartStore writes the real `localStorage` global; a memory one per test (as in heartStore.test.ts).
    const map = new Map<string, string>();
    (globalThis as { localStorage?: Storage }).localStorage = { getItem: (k: string) => map.get(k) ?? null, setItem: (k: string, v: string) => { map.set(k, v); }, removeItem: (k: string) => { map.delete(k); }, clear: () => map.clear(), key: () => null, get length() { return map.size; } } as Storage;
    replaceState({ ...freshState(), profile, active: { id: 's1', splitId: 'x', startedAt: new Date(START).toISOString(), pausedMs: 0, entries: [] } });
    resetHeartCapture();
    latestMeasurement.value = null;
    startHeartCapture();
  });

  it('the audit script: 09:00-10:00 with a 50-minute pause saves about 10 minutes, not 60', () => {
    const setPaused = (p: number | undefined) => replaceState({ ...state.value, active: { ...state.value.active!, pausedAt: p } });
    for (let sec = 0; sec < 3600; sec += 5) {
      // Pause 09:05-09:55.
      if (sec === 300) setPaused(START + 300_000);
      if (sec === 3300) setPaused(undefined);
      latestMeasurement.value = meas(sec, 140);
    }
    const session = { id: 's1', splitId: 'x', splitName: 'X', day: '2026-09-22', startedAt: new Date(START).toISOString(), endedAt: new Date(START + 3600_000).toISOString(), durationSec: 600, exercises: [] } as unknown as Session;
    const out = finishHeartCapture(session);
    expect(out.heart).toBeTruthy();
    expect(out.heart!.samples).toBe(120);
    expect(out.heart!.zoneSec.reduce((a, b) => a + b, 0)).toBeLessThanOrEqual(600);
    expect(out.heart!.energy?.minutes).toBe(10);
  });

  it('energy minutes are capped at the training time when the series spans a pause', () => {
    const series: Array<[number, number]> = [];
    for (let t = 0; t < 300; t += 5) series.push([t, 140]);
    for (let t = 3300; t < 3600; t += 5) series.push([t, 140]);
    const paused = sessionEnergy({ series, profile, today: '2026-09-22', quality: 1, activeSec: 600 })!;
    const wall = sessionEnergy({ series, profile, today: '2026-09-22', quality: 1 })!;
    expect(paused.minutes).toBe(10);
    expect(wall.minutes).toBe(60);
    expect(paused.grossKcal).toBeLessThan(wall.grossKcal);
  });
});

describe('NAT-01: a silent watch leaves LIVE, and old readings never end a rest', () => {
  const live: WatchStatus = { state: 'connected', freshness: 'LIVE', deviceName: 'GT6', message: 'Live' };

  it('after 120 s with no events, status leaves LIVE', () => {
    const t0 = 1_000_000;
    onNativeStatus(live, t0);
    onNativeMeasurement(meas(0, 90), t0);
    expect(watchStatus.value.freshness).toBe('LIVE');
    tickFreshness(t0 + 10_000);
    expect(watchStatus.value.freshness).toBe('DELAYED');
    tickFreshness(t0 + 120_000);
    expect(watchStatus.value.freshness).toBe('STALE');
    // A new reading brings it back.
    onNativeMeasurement(meas(120, 95), t0 + 121_000);
    expect(watchStatus.value.freshness).toBe('LIVE');
  });

  it('only LIVE and DELAYED age; other states pass through', () => {
    expect(agedFreshness('CHECK_FIT', 0, 999_999)).toBe('CHECK_FIT');
    expect(agedFreshness('DISCONNECTED', 0, 999_999)).toBe('DISCONNECTED');
    expect(agedFreshness('LIVE', 0, 4_000)).toBe('LIVE');
    expect(agedFreshness('DELAYED', 0, 16_000)).toBe('STALE');
  });

  it('recentLiveBpms ignores samples from before the current rest', () => {
    replaceState({ ...freshState(), active: { id: 's1', splitId: 'x', startedAt: new Date(START).toISOString(), pausedMs: 0, entries: [] } });
    resetHeartCapture();
    latestMeasurement.value = null;
    startHeartCapture();
    for (const s of [10, 15, 20]) latestMeasurement.value = meas(s, 70); // old low readings
    const setAt = new Date(START + 100_000).toISOString();
    replaceState({ ...state.value, active: { ...state.value.active!, entries: [{ exerciseId: 'bench', name: 'Bench', done: false, skipped: false, sets: [{ kg: 60, reps: 8, at: setAt } as never] }], rest: { endsAt: START + 190_000, totalSec: 90 } } });
    expect(recentLiveBpms(3)).toEqual([]);
    latestMeasurement.value = meas(105, 120);
    expect(recentLiveBpms(3)).toEqual([120]);
  });
});

describe('NAT-03: sleep and resting HR keep their measurement window', () => {
  const day = '2026-09-22';
  const at = '2026-09-22T14:40:00';
  const night = { start: '2026-09-21T23:00:00', end: '2026-09-22T06:00:00' };
  const nap = { start: '2026-09-22T14:00:00', end: '2026-09-22T14:30:00' };

  it('night 23:00-06:00 plus a nap 14:00-14:30 gives the night', () => {
    const d = mapHealthSummary({ needsPermission: false, sleepMinutes: 30, sleepEndTime: new Date(nap.end).toISOString(), sleepSessions: [night, nap] }, day, at);
    expect(d?.sleepMinutes).toBe(420);
    expect(d?.sleepEndAt).toBe(new Date(night.end).toISOString());
  });

  it('awake stages are taken out, and a broken or doubly written night counts once', () => {
    expect(mainSleep([{ ...night, awake: [['2026-09-22T03:00:00', '2026-09-22T03:30:00']] }], day)?.minutes).toBe(390);
    expect(mainSleep([{ start: '2026-09-21T23:00:00', end: '2026-09-22T02:00:00' }, { start: '2026-09-22T02:30:00', end: '2026-09-22T06:00:00' }], day)?.minutes).toBe(390);
    expect(mainSleep([night, { start: '2026-09-21T23:30:00', end: '2026-09-22T06:00:00' }], day)?.minutes).toBe(420);
  });

  it('a sleep that ended on an earlier day is not today\'s', () => {
    expect(mainSleep([{ start: '2026-09-20T23:00:00', end: '2026-09-21T06:00:00' }], day)).toBeNull();
  });

  it('the same resting-HR record synced on two mornings is not counted as a new day', () => {
    const raw = { needsPermission: false, restingHR: 55, restingHRTime: new Date('2026-09-22T05:00:00').toISOString() };
    const first = mapHealthSummary(raw, '2026-09-22', '2026-09-22T07:00:00Z');
    const second = mapHealthSummary(raw, '2026-09-23', '2026-09-23T07:00:00Z');
    expect(first?.restingHr).toBe(55);
    expect(first?.restingHrAt).toBe(raw.restingHRTime);
    expect(second?.restingHr).toBeUndefined();
  });
});

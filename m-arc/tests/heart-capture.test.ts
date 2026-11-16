import { describe, it, expect, beforeEach } from 'vitest';
import { replaceState, state } from '@/core/store';
import { freshState } from '@/core/models';
import { latestMeasurement, type WatchMeasurement } from '@/native/watch';
import { recentLiveBpms, resetHeartCapture, startHeartCapture, heartForSet } from '@/slices/workout/heart';

const START = Date.parse('2026-09-22T18:00:00Z');
const m = (sec: number, bpm: number): WatchMeasurement => ({ bpm, contact: true, rrMs: [], energyKj: null, receivedAtEpochMs: START + sec * 1000, receivedAtElapsedMs: sec * 1000 });

describe('live heart capture (UI-21)', () => {
  beforeEach(() => {
    replaceState({ ...freshState(), active: { id: 's1', splitId: 'x', startedAt: new Date(START).toISOString(), pausedMs: 0, entries: [] } });
    resetHeartCapture();
    latestMeasurement.value = null;
    startHeartCapture();
  });

  it('records each measurement once, even when it is delivered again', () => {
    latestMeasurement.value = m(10, 100);
    latestMeasurement.value = { ...m(10, 100) };
    latestMeasurement.value = m(15, 110);
    expect(recentLiveBpms(10)).toEqual([100, 110]);
  });

  it('a state change without a new measurement records nothing', () => {
    latestMeasurement.value = m(10, 100);
    replaceState({ ...state.value, active: { ...state.value.active!, pausedMs: 5 } });
    expect(recentLiveBpms(10)).toEqual([100]);
  });

  it('after a restart the time base is still the session start', () => {
    // A restart loses the ring, not the clock: samples land at their real offset into the session.
    resetHeartCapture();
    for (let s = 600; s <= 660; s += 5) latestMeasurement.value = m(s, 130);
    expect(heartForSet(600, 660)).toBeTruthy();
    expect(heartForSet(0, 60)).toBeUndefined();
  });

  it('nothing is recorded without an active session', () => {
    replaceState({ ...state.value, active: null });
    latestMeasurement.value = m(20, 120);
    expect(recentLiveBpms(10)).toEqual([]);
  });
});

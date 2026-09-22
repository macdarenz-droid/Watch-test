import { describe, expect, it } from 'vitest';
import { prepareHeartRateRestore } from '../src/heart-rate/backup';
import { tracePoints } from '../src/heart-rate/chart';
import type { Session } from '../src/core/models';
import type { HeartRateSample, HeartRateTrace } from '../src/heart-rate/types';

const sample = (time: number, contactDetected = true): HeartRateSample => ({
  bpm: 120, receivedAtEpochMs: time, receivedAtElapsedMs: time, contactDetected, source: 'ble-heart-rate',
});
const session: Session = { id: 'one', splitId: 'push', splitName: 'Push', day: '1970-01-01',
  startedAt: new Date(0).toISOString(), endedAt: new Date(60_000).toISOString(), durationSec: 60, exercises: [] };
const trace: HeartRateTrace = { sessionId: 'one', version: 1, samples: [sample(20_000), sample(25_000)], summary: { sampleCount: 2, gapCount: 0 } };

describe('heart-rate restore', () => {
  it('restores sparse raw data against workout boundaries, not first and last samples', () => {
    const result = prepareHeartRateRestore([session], { version: 1, traces: [trace] });
    expect(result.sessions[0]?.heartRate).toMatchObject({ metricsVersion: 2, durationMs: 60_000, capturedMs: 10_000, coveragePct: 17 });
    expect(result.payload.traces[0]).toMatchObject({ startedAtEpochMs: 0, endedAtEpochMs: 60_000 });
    expect(trace).not.toHaveProperty('startedAtEpochMs');
  });
  it('drops orphan traces and requests transactional replacement', () => {
    const result = prepareHeartRateRestore([session], { version: 1, traces: [{ ...trace, sessionId: 'deleted' }] });
    expect(result.payload).toEqual({ version: 1, traces: [], replace: true });
  });
  it('rejects duplicate traces and invalid data before a native write', () => {
    expect(() => prepareHeartRateRestore([session], { version: 1, traces: [trace, trace] })).toThrow();
    expect(() => prepareHeartRateRestore([session], { version: 1, traces: [{ ...trace, samples: [{ ...sample(0), bpm: NaN }] }] })).toThrow();
  });
  it('keeps summary-only backups usable without inventing trace data', () => {
    const s = { ...session, heartRate: trace.summary };
    expect(prepareHeartRateRestore([s]).sessions).toEqual([s]);
  });
  it('preserves an unfinished workout trace without inventing a finish time', () => {
    const active = { id: 'one', splitId: 'push', startedAt: session.startedAt, pausedMs: 0, entries: [] };
    const result = prepareHeartRateRestore([], { version: 1, traces: [trace] }, active);
    expect(result.payload.traces[0]?.samples).toHaveLength(2);
    expect(result.payload.traces[0]?.startedAtEpochMs).toBe(0);
    expect(result.payload.traces[0]?.endedAtEpochMs).toBeUndefined();
    expect(result.sessions).toEqual([]);
  });
});

describe('trace chart honesty', () => {
  it('breaks at poor contact even within a five second interval', () => {
    expect(tracePoints([sample(0), sample(1000), sample(2000, false), sample(3000)], 0, 5000).map(p => p.startsSegment)).toEqual([true, false, true]);
  });
  it('breaks missing signal, excludes outside readings and applies the last duplicate', () => {
    const points = tracePoints([sample(500), sample(1000), sample(2000), sample(2000, false), sample(3000), sample(20_000), sample(25_000)], 1000, 25_000);
    expect(points.map(p => p.receivedAtEpochMs)).toEqual([1000, 3000, 20_000]);
    expect(points.map(p => p.startsSegment)).toEqual([true, true, true]);
  });
});

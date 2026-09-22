import { describe, expect, it } from 'vitest';
import { freshness, summarize, twoMinuteWindow, validSample } from '@/heart-rate/metrics';
import type { HeartRateSample } from '@/heart-rate/types';

const sample = (bpm: number, receivedAtEpochMs: number): HeartRateSample => ({ bpm, receivedAtEpochMs, receivedAtElapsedMs: receivedAtEpochMs, source: 'ble-heart-rate' });

describe('heart-rate contracts', () => {
  it('rejects implausible bpm and accepts a valid packet', () => {
    expect(validSample(sample(72, 1))).toBe(true);
    expect(validSample(sample(10, 1))).toBe(false);
    expect(validSample(sample(300, 1))).toBe(false);
    expect(validSample(sample(72.5, 1))).toBe(false);
    expect(validSample(sample(72, Number.POSITIVE_INFINITY))).toBe(false);
    expect(validSample({ ...sample(72, 1), receivedAtElapsedMs: -1 })).toBe(false);
    expect(validSample({ ...sample(72, 1), contactDetected: false })).toBe(false);
    expect(validSample({ ...sample(72, 1), contactDetected: true })).toBe(true);
  });

  it('uses explicit live, delayed, and lost boundaries', () => {
    expect(freshness(sample(72, 1_000), 6_000)).toBe('live');
    expect(freshness(sample(72, 1_000), 6_001)).toBe('delayed');
    expect(freshness(sample(72, 1_000), 16_001)).toBe('lost');
  });

  it('uses duration-weighted readings and clips the final interval to workout end', () => {
    expect(summarize([sample(100, 0), sample(200, 1_000)], 0, 6_000)).toMatchObject({ metricsVersion: 2, sampleCount: 2, averageBpm: 183, recordedPeakBpm: 200, coveragePct: 100, capturedMs: 6_000, durationMs: 6_000 });
  });

  it('gives a regular five-second stream full coverage, regardless of packet density', () => {
    const sparse = Array.from({ length: 6 }, (_, i) => sample(100, i * 5_000));
    const dense = Array.from({ length: 30 }, (_, i) => sample(100, i * 1_000));
    expect(summarize(sparse, 0, 30_000)).toMatchObject({ capturedMs: 30_000, coveragePct: 100, averageBpm: 100 });
    expect(summarize(dense, 0, 30_000)).toMatchObject({ capturedMs: 30_000, coveragePct: 100, averageBpm: 100 });
  });

  it('leaves missing time uncovered and counts gaps only after the lost-signal threshold', () => {
    expect(summarize([sample(100, 0), sample(100, 5_000), sample(100, 30_000)], 0, 35_000)).toMatchObject({ capturedMs: 15_000, coveragePct: 43, gapCount: 1 });
    expect(summarize([sample(100, 0), sample(100, 10_000)], 0, 15_000)).toMatchObject({ capturedMs: 10_000, coveragePct: 67, gapCount: 0 });
  });

  it('stops coverage as soon as the sensor reports poor contact', () => {
    expect(summarize([sample(100, 0), { ...sample(250, 1_000), contactDetected: false }, sample(150, 3_000)], 0, 5_000)).toMatchObject({ sampleCount: 2, recordedPeakBpm: 150, averageBpm: 133, capturedMs: 3_000, coveragePct: 60 });
  });

  it('ignores out-of-workout readings for count, average, peak and coverage', () => {
    expect(summarize([sample(250, 0), sample(100, 1_000), sample(260, 2_000)], 1_000, 2_000)).toMatchObject({ sampleCount: 1, recordedPeakBpm: 100, averageBpm: 100, capturedMs: 1_000, coveragePct: 100 });
    expect(summarize([sample(120, 5_000)], 0, 10_000)).toMatchObject({ capturedMs: 5_000, coveragePct: 50 });
  });

  it('deduplicates timestamps deterministically without inflating captured time', () => {
    expect(summarize([sample(100, 0), sample(150, 0), sample(200, 5_000)], 0, 10_000)).toMatchObject({ sampleCount: 2, capturedMs: 10_000, averageBpm: 175 });
    expect(summarize([sample(100, 0), { ...sample(100, 0), contactDetected: false }], 0, 5_000)).toMatchObject({ sampleCount: 0, capturedMs: 0, coveragePct: 0 });
  });

  it('handles unordered packets, invalid readings, empty sessions and missing legacy bounds', () => {
    expect(summarize([sample(140, 5_000), sample(400, 1_000), sample(100, 0)], 0, 10_000)).toMatchObject({ sampleCount: 2, averageBpm: 133, capturedMs: 6_000, coveragePct: 60 });
    expect(summarize([], 0, 10_000)).toEqual({ metricsVersion: 2, sampleCount: 0, durationMs: 10_000, capturedMs: 0, coveragePct: 0, gapCount: 0 });
    expect(summarize([sample(100, 0)], Number.NaN, 10_000)).toEqual({ sampleCount: 0, gapCount: 0 });
    expect(summarize([sample(100, 0)], 10_000, 0)).toEqual({ sampleCount: 0, gapCount: 0 });
    expect(summarize([sample(100, 0)], 0, 0).coveragePct).toBeUndefined();
  });

  it('keeps the chart buffer bounded by time', () => {
    expect(twoMinuteWindow([sample(70, 0), sample(80, 60_000), sample(90, 181_000)], 181_000).map(x => x.bpm)).toEqual([90]);
  });
});

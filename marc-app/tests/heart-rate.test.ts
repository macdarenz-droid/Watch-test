import { describe, expect, it } from 'vitest';
import { freshness, summarize, twoMinuteWindow, validSample } from '@/heart-rate/metrics';
import type { HeartRateSample } from '@/heart-rate/types';

const sample = (bpm: number, receivedAtEpochMs: number): HeartRateSample => ({ bpm, receivedAtEpochMs, receivedAtElapsedMs: receivedAtEpochMs, source: 'ble-heart-rate' });

describe('heart-rate contracts', () => {
  it('rejects implausible bpm and accepts a valid packet', () => {
    expect(validSample(sample(72, 1))).toBe(true);
    expect(validSample(sample(10, 1))).toBe(false);
    expect(validSample(sample(300, 1))).toBe(false);
  });

  it('uses explicit live, delayed, and lost boundaries', () => {
    expect(freshness(sample(72, 1_000), 6_000)).toBe('live');
    expect(freshness(sample(72, 1_000), 6_001)).toBe('delayed');
    expect(freshness(sample(72, 1_000), 16_001)).toBe('lost');
  });

  it('measures coverage against the whole workout', () => {
    expect(summarize([sample(70, 0), sample(80, 1_000), sample(90, 2_000)], 0, 4_000)).toMatchObject({ sampleCount: 3, averageBpm: 80, recordedPeakBpm: 90, coveragePct: 75 });
  });

  it('keeps the chart buffer bounded by time', () => {
    expect(twoMinuteWindow([sample(70, 0), sample(80, 60_000), sample(90, 181_000)], 181_000).map(x => x.bpm)).toEqual([90]);
  });
});

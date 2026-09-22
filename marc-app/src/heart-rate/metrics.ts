import type { HeartRateSummary } from '@/core/models';
import type { HeartRateFreshness, HeartRateSample } from './types';

export const LIVE_MAX_MS = 5_000;
export const DELAYED_MAX_MS = 15_000;

export function validSample(value: HeartRateSample): boolean {
  return Number.isInteger(value.bpm) && value.bpm >= 20 && value.bpm <= 260 &&
    Number.isFinite(value.receivedAtEpochMs) && Number.isFinite(value.receivedAtElapsedMs);
}

export function freshness(sample: HeartRateSample | null, nowEpochMs = Date.now()): HeartRateFreshness {
  if (!sample) return 'lost';
  const age = Math.max(0, nowEpochMs - sample.receivedAtEpochMs);
  if (age <= LIVE_MAX_MS) return 'live';
  if (age <= DELAYED_MAX_MS) return 'delayed';
  return 'lost';
}

export function summarize(samples: HeartRateSample[], startedAt: number, endedAt: number, gapCount = 0): HeartRateSummary {
  const accepted = samples.filter(validSample).sort((a, b) => a.receivedAtEpochMs - b.receivedAtEpochMs);
  if (!accepted.length) return { sampleCount: 0, gapCount };
  const eligibleSeconds = Math.max(0, Math.ceil((endedAt - startedAt) / 1000));
  const coveredSeconds = new Set(accepted
    .filter(x => x.receivedAtEpochMs >= startedAt && x.receivedAtEpochMs <= endedAt)
    .map(x => Math.floor((x.receivedAtEpochMs - startedAt) / 1000))).size;
  return {
    sampleCount: accepted.length,
    averageBpm: Math.round(accepted.reduce((sum, x) => sum + x.bpm, 0) / accepted.length),
    recordedPeakBpm: Math.max(...accepted.map(x => x.bpm)),
    coveragePct: eligibleSeconds ? Math.min(100, Math.round(coveredSeconds / eligibleSeconds * 100)) : undefined,
    firstSampleAt: new Date(accepted[0]!.receivedAtEpochMs).toISOString(),
    lastSampleAt: new Date(accepted[accepted.length - 1]!.receivedAtEpochMs).toISOString(),
    gapCount,
  };
}

export function twoMinuteWindow(samples: HeartRateSample[], now = Date.now()): HeartRateSample[] {
  const start = now - 120_000;
  return samples.filter(x => x.receivedAtEpochMs >= start && x.receivedAtEpochMs <= now);
}

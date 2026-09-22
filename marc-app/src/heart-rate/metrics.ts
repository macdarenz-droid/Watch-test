import type { HeartRateSummary } from '@/core/models';
import type { HeartRateFreshness, HeartRateSample } from './types';

export const LIVE_MAX_MS = 5_000;
export const DELAYED_MAX_MS = 15_000;

const validTimestamp = (value: number): boolean => Number.isSafeInteger(value) && value >= 0 && value <= 8_640_000_000_000_000;

export function validSample(value: HeartRateSample): boolean {
  return Number.isInteger(value.bpm) && value.bpm >= 20 && value.bpm <= 260 &&
    validTimestamp(value.receivedAtEpochMs) && Number.isSafeInteger(value.receivedAtElapsedMs) && value.receivedAtElapsedMs >= 0 &&
    value.contactDetected !== false && value.source === 'ble-heart-rate';
}

export function freshness(sample: HeartRateSample | null, nowEpochMs = Date.now()): HeartRateFreshness {
  if (!sample) return 'lost';
  const age = Math.max(0, nowEpochMs - sample.receivedAtEpochMs);
  if (age <= LIVE_MAX_MS) return 'live';
  if (age <= DELAYED_MAX_MS) return 'delayed';
  return 'lost';
}

export function summarize(samples: HeartRateSample[], startedAt: number, endedAt: number, gapCount = 0): HeartRateSummary {
  const explicitGaps = Number.isSafeInteger(gapCount) && gapCount >= 0 ? gapCount : 0;
  if (!validTimestamp(startedAt) || !validTimestamp(endedAt) || endedAt < startedAt) return { sampleCount: 0, gapCount: explicitGaps };
  // Retain bad-contact packets as interval boundaries. A failed reading must
  // immediately stop the preceding good reading from covering more time.
  const byTimestamp = new Map<number, HeartRateSample>();
  for (const value of samples) {
    if (validTimestamp(value.receivedAtEpochMs) && value.receivedAtEpochMs >= startedAt && value.receivedAtEpochMs < endedAt) byTimestamp.set(value.receivedAtEpochMs, value);
  }
  const ordered = [...byTimestamp.values()].sort((a, b) => a.receivedAtEpochMs - b.receivedAtEpochMs);
  const accepted: HeartRateSample[] = [];
  let capturedMs = 0, weightedBpm = 0, peak = 0, gaps = explicitGaps;
  for (let i = 0; i < ordered.length; i++) {
    const value = ordered[i]!;
    if (!validSample(value)) continue;
    const previous = accepted[accepted.length - 1];
    // Coverage stops after 5 s; gapCount describes lost-signal gaps (>15 s).
    if (previous && value.receivedAtEpochMs - previous.receivedAtEpochMs > DELAYED_MAX_MS) gaps++;
    const nextAt = ordered[i + 1]?.receivedAtEpochMs ?? endedAt;
    const intervalMs = Math.min(LIVE_MAX_MS, nextAt - value.receivedAtEpochMs, endedAt - value.receivedAtEpochMs);
    capturedMs += intervalMs;
    weightedBpm += value.bpm * intervalMs;
    peak = Math.max(peak, value.bpm);
    accepted.push(value);
  }
  const durationMs = endedAt - startedAt;
  const base: HeartRateSummary = {
    metricsVersion: 2, sampleCount: accepted.length, capturedMs, durationMs,
    coveragePct: durationMs > 0 ? Math.round(capturedMs / durationMs * 100) : undefined, gapCount: gaps,
  };
  if (!accepted.length) return base;
  return {
    ...base,
    averageBpm: Math.round(weightedBpm / capturedMs),
    recordedPeakBpm: peak,
    firstSampleAt: new Date(accepted[0]!.receivedAtEpochMs).toISOString(),
    lastSampleAt: new Date(accepted[accepted.length - 1]!.receivedAtEpochMs).toISOString(),
  };
}

export function twoMinuteWindow(samples: HeartRateSample[], now = Date.now()): HeartRateSample[] {
  const start = now - 120_000;
  return samples.filter(x => x.receivedAtEpochMs >= start && x.receivedAtEpochMs <= now);
}

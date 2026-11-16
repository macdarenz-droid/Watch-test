import { validSample } from './metrics';
import type { HeartRateSample } from './types';

export type TracePoint = HeartRateSample & { startsSegment: boolean };
/** Keep missing-contact events as breaks even between otherwise adjacent good readings. */
export function tracePoints(samples: HeartRateSample[], start: number, end: number): TracePoint[] {
  const unique = new Map<number, HeartRateSample>();
  for (const sample of samples) {
    if (Number.isSafeInteger(sample.receivedAtEpochMs) && sample.receivedAtEpochMs >= start && sample.receivedAtEpochMs < end) unique.set(sample.receivedAtEpochMs, sample);
  }
  const ordered = [...unique.values()].sort((a, b) => a.receivedAtEpochMs - b.receivedAtEpochMs);
  const points: TracePoint[] = [];
  let broken = true;
  for (const sample of ordered) {
    if (!validSample(sample)) { broken = true; continue; }
    const previous = points.at(-1);
    points.push({ ...sample, startsSegment: broken || !previous || sample.receivedAtEpochMs - previous.receivedAtEpochMs > 5_000 });
    broken = false;
  }
  return points;
}

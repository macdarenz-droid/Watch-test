/** Recency-weighted trend and plateau detection over an exercise's history. */
import type { ExerciseSessionSummary } from './history';

export type Direction = 'up' | 'flat' | 'down' | 'unknown';
export type Confidence = 'low' | 'medium' | 'high';

export interface Trend {
  direction: Direction;
  /** Relative change per week as a fraction, e.g. 0.02 = 2% per week. */
  slopePerWeek: number;
  confidence: Confidence;
  points: number;
}

export function trend(points: Array<{ day: string; value: number }>): Trend {
  const usable = points.filter(p => Number.isFinite(p.value) && p.value > 0);
  if (usable.length < 4) return { direction: 'unknown', slopePerWeek: 0, confidence: 'low', points: usable.length };
  const t0 = new Date(usable[0]!.day).getTime();
  const xs = usable.map(p => (new Date(p.day).getTime() - t0) / (7 * 86_400_000));
  const ys = usable.map(p => p.value);
  const n = usable.length;
  const ws = usable.map((_, i) => 0.5 + (i / Math.max(1, n - 1)));
  const sw = ws.reduce((a, b) => a + b, 0);
  const mx = xs.reduce((a, x, i) => a + x * ws[i]!, 0) / sw;
  const my = ys.reduce((a, y, i) => a + y * ws[i]!, 0) / sw;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += ws[i]! * (xs[i]! - mx) * (ys[i]! - my); den += ws[i]! * (xs[i]! - mx) ** 2; }
  const slope = den ? num / den : 0;
  const rel = my ? slope / my : 0;
  const direction: Direction = Math.abs(rel) < 0.01 ? 'flat' : rel > 0 ? 'up' : 'down';
  const confidence: Confidence = n >= 12 ? 'high' : n > 6 ? 'medium' : 'low';
  return { direction, slopePerWeek: rel, confidence, points: n };
}

export type PlateauStatus = 'progressing' | 'plateaued' | 'declining' | 'unknown';

/** Looks at the last 8 sessions. Needs at least 7 to say anything. */
export function plateauStatus(history: ExerciseSessionSummary[]): { status: PlateauStatus; confidence: Confidence } {
  const recent = history.slice(-8);
  if (recent.length < 7) return { status: 'unknown', confidence: 'low' };
  const weight = trend(recent.map(r => ({ day: r.day, value: r.topKg })));
  const volume = trend(recent.map(r => ({ day: r.day, value: r.volume })));
  const conf = weight.confidence === 'low' ? volume.confidence : weight.confidence;
  if (weight.direction === 'unknown') {
    if (volume.direction === 'up') return { status: 'progressing', confidence: conf };
    if (volume.direction === 'down') return { status: 'declining', confidence: conf };
    return { status: 'plateaued', confidence: conf };
  }
  if (weight.direction === 'up') return { status: 'progressing', confidence: conf };
  if (weight.direction === 'flat' && volume.direction === 'up') return { status: 'progressing', confidence: conf };
  if (weight.direction === 'flat') return { status: 'plateaued', confidence: conf };
  return { status: 'declining', confidence: conf };
}

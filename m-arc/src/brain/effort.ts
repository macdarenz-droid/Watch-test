/** Is the user's logged effort on an exercise drifting harder or easier? */
import type { ExerciseSessionSummary } from './history';
import { EFFORT_MULT, effortLabel } from './exposure';
import type { Confidence } from './trend';

export interface EffortDrift {
  status: 'harder' | 'easier' | 'stable' | 'unknown';
  delta: number;
  confidence: Confidence;
}

/** AUD-9 OBS-DRIFT: work rose or fell when the halves' mean working load moved over 1 %, or mean working reps by one rep or more. */
export const SAME_WORK = { loadShare: 0.01, reps: 1 } as const;

export function effortDrift(history: ExerciseSessionSummary[]): EffortDrift {
  const recent = history.slice(-6);
  const obs = recent.flatMap((r, i) => r.sets.map(effortLabel).filter(e => e != null).map(e => ({ i, v: EFFORT_MULT[e] })));
  const sessionsWithEffort = new Set(obs.map(o => o.i)).size;
  if (sessionsWithEffort < 4 || obs.length < 8) return { status: 'unknown', delta: 0, confidence: 'low' };
  const mid = Math.floor(recent.length / 2);
  const older = obs.filter(o => o.i < mid), newer = obs.filter(o => o.i >= mid);
  if (older.length < 3 || newer.length < 3) return { status: 'unknown', delta: 0, confidence: 'low' };
  // Effort says something about recovery only at the same work: a planned load or rep step is not drift.
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const halves = (pick: (r: ExerciseSessionSummary) => number) => [avg(recent.slice(0, mid).map(pick)), avg(recent.slice(mid).map(pick))] as const;
  const [kgA, kgB] = halves(r => r.workKg), [repsA, repsB] = halves(r => r.workReps);
  // The guard follows the drift's direction: harder after more work, or easier after less, is the step
  // itself; harder at the same or less work (or easier at the same or more) still reads as drift.
  const loadTol = SAME_WORK.loadShare * Math.max(kgA, kgB);
  const workUp = kgB - kgA > loadTol || repsB - repsA >= SAME_WORK.reps;
  const workDown = kgA - kgB > loadTol || repsA - repsB >= SAME_WORK.reps;
  const mean = (xs: { v: number }[]) => xs.reduce((a, b) => a + b.v, 0) / xs.length;
  const delta = mean(newer) - mean(older);
  const confidence: Confidence = sessionsWithEffort >= 6 && obs.length >= 18 ? 'high' : sessionsWithEffort < 5 || obs.length < 10 ? 'low' : 'medium';
  const status = Math.abs(delta) < 0.025 ? 'stable' : delta > 0 ? 'harder' : 'easier';
  if ((status === 'harder' && workUp) || (status === 'easier' && workDown) || (status === 'stable' && (workUp || workDown))) return { status: 'unknown', delta: 0, confidence: 'low' };
  return { status, delta, confidence };
}

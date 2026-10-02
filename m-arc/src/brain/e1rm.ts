/**
 * Effort-aware one-rep-max estimate (6.13 foundations). Epley, but reps in
 * reserve come from the effort label, not just the rep count, so a max-effort
 * set of 5 and an easy set of 5 no longer produce the same estimate.
 */
import type { Effort } from '@/core/models';

export const RIR_BY_EFFORT: Record<Effort, number> = { easy: 3, ideal: 2, max: 0 };

export const EPLEY_DIVISOR = 30;
/** Sets above this many reps give no estimate. */
export const E1RM_MAX_REPS = 10;

/** Epley with effectiveReps = reps + RIR(effort). Null for sets outside 1-10 reps or with no load. */
export function effectiveOneRm(kg: number, reps: number, effort?: Effort, rirBias = 0): number | null {
  if (!(kg > 0) || !(reps > 0) || reps > E1RM_MAX_REPS) return null;
  const rir = Math.max(0, RIR_BY_EFFORT[effort ?? 'ideal'] + rirBias);
  return kg * (1 + (reps + rir) / EPLEY_DIVISOR);
}


export function roundToStep(kg: number, step = 2.5): number {
  return Math.round(kg / step) * step;
}


/** Epley solved for load at a target rep count, from a trend e1RM. Used for load targets and warm-ups. */
export function loadForReps(e1rm: number, reps: number): number {
  return e1rm / (1 + reps / 30);
}

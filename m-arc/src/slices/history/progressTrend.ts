/**
 * The Exercise progress card's trend (QA2-FC-1). Assisted, bodyweight and hold lifts are judged by
 * their mode, as Escobar judges them (less assistance is up). Weighted lifts keep the strength
 * score, with volume for sessions of sets over 10 reps.
 */
import type { ResistanceMode } from '@/core/models';
import type { ExerciseSessionSummary } from '@/brain/history';
import { liftTrend, trend, type Trend } from '@/brain/trend';

export function progressTrend(hist: ExerciseSessionSummary[], mode: ResistanceMode): Trend {
  if (mode === 'assisted' || mode === 'bodyweight' || mode === 'duration') return liftTrend(hist, mode);
  // UI-11: a carry or sled logs distance, not kg × reps, so an unloaded one has no e1RM or volume
  // to plot (a flat line at 0) — fall back to the farthest distance that session, when there is one.
  if (mode === 'conditioning') return trend(hist.map(h => ({ day: h.day, value: h.bestDistanceM || h.bestE1rm || h.volume })));
  return trend(hist.map(h => ({ day: h.day, value: h.bestE1rm || h.volume })));
}

/**
 * The value the card's sparkline draws, in the same direction as the trend: up is progress. Assisted
 * lifts plot the assistance negated (less help is higher), bodyweight lifts their best reps, holds
 * their longest time. Weighted and conditioning keep the strength score (QA2-FC-1 follow-up).
 */
export function progressValue(h: ExerciseSessionSummary, mode: ResistanceMode): number {
  if (mode === 'assisted') return -h.topKg;
  if (mode === 'bodyweight') return h.bestReps;
  if (mode === 'duration') return h.bestDurationSec;
  if (mode === 'conditioning') return h.bestDistanceM || h.bestE1rm || h.topKg || h.bestReps;
  return h.bestE1rm || h.topKg || h.bestReps;
}

/** The caption under the card: what the trend line plots for this mode (COPY-1: a caption, no explanation). */
export function progressHint(mode: ResistanceMode): string {
  if (mode === 'assisted') return 'Less assistance, then more reps';
  if (mode === 'bodyweight') return 'Best reps';
  if (mode === 'duration') return 'Longest hold';
  if (mode === 'conditioning') return 'Farthest distance';
  return 'Estimated one-rep max';
}

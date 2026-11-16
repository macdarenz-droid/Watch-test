/**
 * Reps-in-reserve bias (6.13 "RIR bias" foundation, "Effort calibration"
 * insight). When a max-effort set and a non-max set at the same load happen
 * within 14 days of each other, the gap between their reps is what the
 * non-max set's reps in reserve actually were — often more than the label
 * assumes, especially for newer lifters.
 */
import type { ExerciseSessionSummary } from './history';
import { daysBetween } from '@/core/dates';

export const BIAS_MIN_OBSERVATIONS = 3;
export const BIAS_CAP_REPS = 3;
const ASSUMED_RIR: Record<'easy' | 'ideal', number> = { easy: 3, ideal: 2 };

export interface RirObservation {
  day: string;
  kg: number;
  otherEffort: 'easy' | 'ideal';
  impliedRir: number;
}

/** Every same-load max/non-max pair within 14 days, across a chronological exercise history. */
export function rirObservations(hist: ExerciseSessionSummary[]): RirObservation[] {
  const out: RirObservation[] = [];
  // Best reps per (load, effort) in one session: several identical sets are one piece of evidence.
  const best = (sets: ExerciseSessionSummary['sets']) => {
    const m = new Map<string, number>();
    for (const s of sets) {
      if (!s.kg || !s.effort) continue;
      const k = `${s.kg}|${s.effort}`;
      m.set(k, Math.max(m.get(k) ?? 0, s.reps ?? 0));
    }
    return m;
  };
  const bests = hist.map(h => best(h.sets));
  // BR-11: per session pair and load, at most one observation per label.
  const add = (seen: Set<string>, key: string, o: RirObservation) => { if (!seen.has(key)) { seen.add(key); out.push(o); } };
  for (let i = 0; i < hist.length; i++) {
    for (let j = i + 1; j < hist.length; j++) {
      if (daysBetween(hist[i]!.day, hist[j]!.day) > 14) break; // hist is day-ascending
      const seen = new Set<string>();
      const [A, B] = [bests[i]!, bests[j]!];
      for (const [k, maxReps] of A) {
        const [kgStr, effort] = k.split('|');
        if (effort !== 'max') continue;
        for (const label of ['easy', 'ideal'] as const) {
          const other = B.get(`${kgStr}|${label}`);
          if (other != null) add(seen, `${kgStr}|${label}`, { day: hist[j]!.day, kg: Number(kgStr), otherEffort: label, impliedRir: maxReps - other });
        }
      }
      for (const [k, maxReps] of B) {
        const [kgStr, effort] = k.split('|');
        if (effort !== 'max') continue;
        for (const label of ['easy', 'ideal'] as const) {
          const other = A.get(`${kgStr}|${label}`);
          if (other != null) add(seen, `${kgStr}|${label}`, { day: hist[i]!.day, kg: Number(kgStr), otherEffort: label, impliedRir: maxReps - other });
        }
      }
    }
  }
  return out;
}

export interface EffortBias { effort: 'easy' | 'ideal'; bias: number; n: number }

/** Mean bias per effort label, only once 3+ observations exist, capped ±3 reps. */
export function effortBiasByLabel(observations: RirObservation[]): EffortBias[] {
  const groups = new Map<'easy' | 'ideal', number[]>();
  for (const o of observations) {
    const arr = groups.get(o.otherEffort) ?? [];
    arr.push(o.impliedRir);
    groups.set(o.otherEffort, arr);
  }
  const out: EffortBias[] = [];
  for (const [effort, vals] of groups) {
    if (vals.length < BIAS_MIN_OBSERVATIONS) continue;
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const bias = Math.max(-BIAS_CAP_REPS, Math.min(BIAS_CAP_REPS, mean - ASSUMED_RIR[effort]));
    out.push({ effort, bias, n: vals.length });
  }
  return out;
}

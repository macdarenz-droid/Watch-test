/**
 * Pre-session brief (6.13, cadence 'pre'): shown as a sheet when a session
 * starts. Each function is one catalogue row; preSessionInsights()
 * assembles the ones with enough evidence for the exercises in the split.
 */
import type { Exercise, Profile, Split } from '@/core/models';
import { findExercise } from '@/core/exercises';
import { exerciseHistory } from '../history';
import { e1rmTrend } from './weeklyReview';
import { loadForReps, roundToStep } from '../e1rm';
import { loadableNear } from '../units';
import { kgToDisplay } from '@/core/units';
import type { EquipmentProfile, LoadUnit } from '@/core/models';
import type { Insight } from './rules';

export interface PreSessionInput {
  sessions: import('@/core/models').Session[];
  custom: Exercise[];
  today: string;
  split: Split;
  profile: Profile;
  age: number | null;
  /**
   * BR-08: the same target Train shows on the set rows (readiness, deload, equipment). When it
   * has a load, the brief quotes it instead of recomputing one, and warm-ups ramp to it.
   */
  targetFor?: (exerciseId: string) => { kg: number | null; target: string; equipment?: EquipmentProfile } | null;
  /** QA-R3b-2: loads in the person's unit. */
  unit?: LoadUnit;
}

/** `load = e1RM_trend / (1 + (targetReps + 2) / 30)`, the ideal-effort assumption, ± 2.5%. */
export function workingLoadTarget(hist: ReturnType<typeof exerciseHistory>, exerciseId: string, exerciseName: string, targetReps: number, unit: LoadUnit = 'kg'): Insight | null {
  const withE1rm = hist.filter(h => h.bestE1rm > 0);
  if (withE1rm.length < 3) return null;
  const t = e1rmTrend(hist);
  if (t.direction === 'unknown') return null;
  const last = withE1rm[withE1rm.length - 1]!.bestE1rm;
  const load = roundToStep(loadForReps(last, targetReps + 2));
  const band = Math.round(load * 0.025 * 2) / 2;
  return {
    id: `pre:load-target:${exerciseId}`, category: 'progress', priority: 260, cadence: 'pre', kind: 'plan', exerciseId,
    title: `${exerciseName}: today's target load`,
    noticed: `${exerciseName} e1RM trending toward about ${Math.round(kgToDisplay(last, unit))} ${unit}.`,
    means: `For ${targetReps} at ideal effort, ${kgToDisplay(load - band, unit)} to ${kgToDisplay(load + band, unit)} ${unit} should land right.`,
    action: `Start around ${kgToDisplay(load, unit)} ${unit}.`,
    evidence: { n: withE1rm.length, window: `${withE1rm.length} sessions`, confidence: withE1rm.length >= 6 ? 'medium' : 'low' },
  };
}

export const WARMUP_PCTS = [0.5, 0.7, 0.85];
export const WARMUP_REPS = [8, 5, 2];

/**
 * F3.4 / D10 (BR-09): 50% x 8, 70% x 5, 85% x 2 of the **first working set**, snapped to the
 * equipment's loads. A step that snaps to the working load or above is dropped, so the last
 * warm-up is never heavier than the work. Shared by the brief, Train and Escobar.
 */
/** QA-R3b-4: the warm-up Train offers, or null when there is none (an empty-bar working set). */
export function warmupOffer(workingKg: number | null | undefined, equipment?: EquipmentProfile): Array<{ kg: number; reps: number }> | null {
  const w = workingKg != null && workingKg > 0 ? warmupSets(workingKg, equipment) : [];
  return w.length ? w : null;
}

export function warmupSets(workingKg: number, equipment?: EquipmentProfile): Array<{ kg: number; reps: number }> {
  if (!(workingKg > 0)) return [];
  return WARMUP_PCTS
    .map((p, i) => ({ kg: equipment ? loadableNear(workingKg * p, equipment, 'nearest').kg : roundToStep(workingKg * p), reps: WARMUP_REPS[i]! }))
    .filter(w => w.kg > 0 && w.kg < workingKg - 1e-9);
}

export function warmupRamp(workingKg: number | null | undefined, exerciseId: string, exerciseName: string, equipment?: EquipmentProfile): Insight | null {
  if (workingKg == null || !(workingKg > 0)) return null;
  const steps = warmupSets(workingKg, equipment);
  if (!steps.length) return null;
  const unit = equipment?.unit ?? 'kg';
  const show = (kg: number) => `${kgToDisplay(kg, unit)}${unit === 'lb' ? ' lb' : ''}`;
  return {
    id: `pre:warmup:${exerciseId}`, category: 'progress', priority: 120, cadence: 'pre', kind: 'tip', exerciseId,
    title: `${exerciseName}: warm-up ramp`,
    noticed: '',
    means: '',
    action: `${steps.map(w => `${show(w.kg)} x ${w.reps}`).join(', ')}, then your working sets.`,
    evidence: { n: 1, window: 'today', confidence: 'high' },
  };
}

/** Fixed copy for a 60+ profile, shown once per session start. */
export function mastersDefaults(age: number | null): Insight | null {
  if (age == null || age < 60) return null;
  return {
    id: 'pre:masters', category: 'data', priority: 110, cadence: 'pre', kind: 'data',
    title: 'Lifters 60+',
    noticed: 'Guidelines for lifters 60 and over.',
    means: '2 to 3 sessions a week, 2 to 3 sets per muscle group, about 2 minutes rest, load steps of 5% or less.',
    action: 'About 1.0 to 1.2 g protein per kg a day, 1.6 if building muscle.',
    evidence: { n: 1, window: 'profile', confidence: 'high' },
  };
}

export function preSessionInsights(input: PreSessionInput, limit = 3): Insight[] {
  const { sessions, custom, split, profile, age } = input;
  const out: Insight[] = [];
  const masters = mastersDefaults(age ?? (profile.birthYear ? new Date().getFullYear() - profile.birthYear : null));
  if (masters) out.push(masters);

  let warmupShown = false;
  for (const se of split.exercises) {
    const meta = findExercise(se.exerciseId, custom);
    if (!meta || meta.mode !== 'weighted') continue;
    const hist = exerciseHistory(sessions, se.exerciseId, custom);
    if (!hist.length) continue;
    if (meta.role === 'main') {
      const t = input.targetFor?.(se.exerciseId) ?? null;
      if (t && t.kg != null) {
        out.push({
          id: `pre:load-target:${se.exerciseId}`, category: 'progress', priority: 260, cadence: 'pre', kind: 'plan', exerciseId: se.exerciseId,
          title: `${meta.name}: today's target load`,
          noticed: '',
          means: '',
          action: `Start around ${t.target}.`,
          evidence: { n: hist.length, window: `${hist.length} sessions`, confidence: hist.length >= 6 ? 'medium' : 'low' },
        });
      } else {
        const target = workingLoadTarget(hist, se.exerciseId, meta.name, 8, input.unit);
        if (target) out.push(target);
      }
      if (!warmupShown) {
        const warmup = warmupRamp(t?.kg, se.exerciseId, meta.name, t?.equipment);
        if (warmup) { out.push(warmup); warmupShown = true; }
      }
    }
  }
  return out.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

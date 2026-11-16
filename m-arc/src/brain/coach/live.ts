/**
 * In-session autoregulation (6.13, cadence 'live'): one line under the open
 * exercise after its first working set, adjusting the remaining sets from
 * how that one actually went. Only reacts to a live commit — a retro or
 * edited set says nothing about "right now".
 */
import type { EquipmentProfile, LoggedSet } from '@/core/models';
import { roundToStep } from '../e1rm';
import { loadableNear } from '../units';
import { kgToDisplay } from '@/core/units';
import type { LiveRetarget } from '../retarget';
import type { Insight } from './rules';

export interface AutoregulationInput {
  exerciseId: string;
  exerciseName: string;
  firstSet: LoggedSet;
  targetKg: number;
  targetReps: number;
  /** Prior sessions for this exercise: >=3 uses a 2.5% step, else a flat 2.5 kg. */
  historyCount: number;
  /** When known, the next load snaps to what the equipment has and is stated in its unit (§25.4). */
  equipment?: EquipmentProfile;
  /** BUG-15 (COACHRULES-F7): a lighter week, an amber or red day or a cut factor (Suggestion.holdLoad); never "add load". */
  holdLoad?: boolean;
  /** LT-3 (§4): the live retarget for sets 2..n. When given, the line is derived from it, so the numbers have one source. */
  retarget?: LiveRetarget | null;
}

export function autoregulationSuggestion(input: AutoregulationInput): Insight | null {
  const { exerciseId, exerciseName, firstSet, targetKg, targetReps, historyCount } = input;
  if (firstSet.fidelity !== 'live') return null;
  if (firstSet.kg == null || firstSet.reps == null || !firstSet.effort) return null;
  if (!(targetKg > 0) || !(targetReps > 0)) return null;
  if (input.retarget !== undefined) return fromRetarget(input, input.retarget);
  // LT-3 (COACHRULES-F5): the step comes from the load lifted, not the planned one.
  const base = firstSet.kg;
  const step = historyCount >= 3 ? base * 0.025 : 2.5;
  const equipment = input.equipment;
  const snap = (kg: number, dir: 'up' | 'down'): string => {
    if (!equipment) {
      // BR-18, QA-R3b-1: on the 2.5 kg grid, strictly past the target in the asked direction
      // (a 44.9 kg target never "drops" to 45, a 64 kg target never stays at 64).
      const g = 2.5, eps = 0.01;
      const v = dir === 'up'
        ? Math.max(Math.ceil((kg - eps) / g) * g, Math.ceil((base + eps) / g) * g)
        : Math.min(Math.floor((kg + eps) / g) * g, Math.floor((base - eps) / g) * g);
      return `${Math.max(0, roundToStep(v, 0.5))} kg`;
    }
    const l = loadableNear(kg, equipment, dir);
    // Never "add load" to the same load: step to the next rung.
    const same = Math.abs(l.kg - base) < 0.01;
    const moved = same ? loadableNear(dir === 'up' ? l.kg + 0.02 : l.kg - 0.02, equipment, dir) : l;
    return `${moved.value} ${moved.unit}`;
  };
  /** QA2-FC-6: whether the equipment has any load lighter than the target (not at the empty bar). */
  const canGoLighter = !equipment || loadableNear(base - 0.02, equipment, 'down').kg < base - 0.01;

  // Plan 6.13: never an increase on a back-off day, where easy sets are the point.
  if (firstSet.effort === 'easy' && firstSet.reps >= targetReps) {
    // LT-3 (§4): never "add load" once set 1 is above the plan.
    if (base > targetKg + 0.01) return keepAbove(input, base, equipment?.unit ?? 'kg');
    if (input.holdLoad) {
      // The target already comes snapped to the equipment; restate it, never move it.
      const here = equipment ? { value: kgToDisplay(targetKg, equipment.unit), unit: equipment.unit } : { value: targetKg, unit: 'kg' };
      return {
        id: `live:autoreg:${exerciseId}`, category: 'progress', priority: 170, cadence: 'live', kind: 'tip', exerciseId,
        title: `${exerciseName}: keep this load`,
        noticed: `That felt easy at ${firstSet.kg} kg for ${firstSet.reps}.`,
        means: 'Today holds the load, so easy sets are the point.',
        action: `Keep ${here.value} ${here.unit} for the next set.`,
        evidence: { n: 1, window: 'this set', confidence: 'high' },
      };
    }
    const next = snap(base + step, 'up');
    return {
      id: `live:autoreg:${exerciseId}`, category: 'progress', priority: 170, cadence: 'live', kind: 'tip', exerciseId,
      title: `${exerciseName}: room to add load`,
      noticed: `That felt easy at ${firstSet.kg} kg for ${firstSet.reps}.`,
      means: 'Easy at or above target reps means there is room to add load right now.',
      action: `Try ${next} for the next set.`,
      evidence: { n: 1, window: 'this set', confidence: 'high' },
    };
  }
  if (firstSet.effort === 'max' && firstSet.reps < targetReps - 1) {
    if (!canGoLighter) {
      const here = loadableNear(base, equipment!, 'nearest');
      return {
        id: `live:autoreg:${exerciseId}`, category: 'progress', priority: 170, cadence: 'live', kind: 'tip', exerciseId,
        title: `${exerciseName}: ease off`,
        noticed: `Missed target at max effort: ${firstSet.reps} of ${targetReps}.`,
        means: 'There is no lighter load than this one, so the reps and the rest are what can change today.',
        action: `Stay at ${here.value} ${here.unit}, rest a little longer, and stop each set a rep short of max.`,
        evidence: { n: 1, window: 'this set', confidence: 'high' },
      };
    }
    const next = snap(base - step, 'down');
    return {
      id: `live:autoreg:${exerciseId}`, category: 'progress', priority: 170, cadence: 'live', kind: 'tip', exerciseId,
      title: `${exerciseName}: ease off`,
      noticed: `Missed target at max effort: ${firstSet.reps} of ${targetReps}.`,
      means: 'A big miss at max effort means the load is too heavy for today.',
      action: `Drop to ${next} and keep the rest at ideal effort.`,
      evidence: { n: 1, window: 'this set', confidence: 'high' },
    };
  }
  return null;
}

const ev = { n: 1, window: 'this set', confidence: 'high' } as const;

function keepAbove(input: AutoregulationInput, kg: number, unit: 'kg' | 'lb'): Insight {
  const { exerciseId, exerciseName, firstSet } = input;
  return {
    id: `live:autoreg:${exerciseId}`, category: 'progress', priority: 170, cadence: 'live', kind: 'tip', exerciseId,
    title: `${exerciseName}: keep this load`,
    noticed: `${firstSet.kg} kg for ${firstSet.reps} is above today's plan.`,
    means: 'The rest of the sets stay at the load you lifted, never more.',
    action: `Keep ${kgToDisplay(kg, unit)} ${unit} for the rest.`,
    evidence: ev,
  };
}

/** LT-3: the line for a live retarget; a change of reps alone needs none. */
function fromRetarget(input: AutoregulationInput, rt: LiveRetarget | null): Insight | null {
  if (!rt || !rt.text) return null;
  const { exerciseId, exerciseName, firstSet, targetReps } = input;
  const head = { id: `live:autoreg:${exerciseId}`, category: 'progress', priority: 170, cadence: 'live', kind: 'tip', exerciseId, action: rt.text, evidence: ev } as const;
  switch (rt.kind) {
    case 'keep':
      return { ...head, title: `${exerciseName}: keep this load`, noticed: `${firstSet.kg} kg for ${firstSet.reps} is above today's plan.`, means: 'The rest of the sets stay at the load you lifted, never more.' };
    case 'above':
      return { ...head, title: `${exerciseName}: above the plan`, noticed: `${firstSet.kg} kg for ${firstSet.reps} is above today's plan.`, means: 'At this load the next sets have few clean reps left.' };
    case 'up':
      return { ...head, title: `${exerciseName}: room to add load`, noticed: `That felt easy at ${firstSet.kg} kg for ${firstSet.reps}.`, means: 'Easy at or above target reps under the plan means there is room to add load right now.' };
    case 'stay':
      return { ...head, title: `${exerciseName}: ease off`, noticed: `Missed target at max effort: ${firstSet.reps} of ${targetReps}.`, means: 'There is no lighter load than this one, so the reps and the rest are what can change today.' };
    case 'drop':
      return { ...head, title: `${exerciseName}: ease off`, noticed: `Missed target at max effort: ${firstSet.reps} of ${targetReps}.`, means: 'A big miss at max effort means the load is too heavy for today.' };
    case 'reps':
      return { ...head, title: `${exerciseName}: ${input.holdLoad ? 'keep this load' : 'add a rep'}`, noticed: `That felt easy at ${firstSet.kg} kg for ${firstSet.reps}.`, means: input.holdLoad ? 'Today holds the load, so easy sets are the point.' : 'Easy at the planned load: more reps now, more load next time.' };
    default:
      return null;
  }
}

/** F3.7: exercise substitutes, for when a muscle is recovering or an insight suggests balance work. */
import type { Exercise } from '@/core/models';
import { LIBRARY } from '@/core/exercises';
import { equipmentGroup } from './coach/cues';
import { formatLoadable, type Loadable, type LoadMenu } from './units';
import { EPLEY_DIVISOR } from './e1rm';
import { kgToDisplay } from '@/core/units';
import { substitutionRatio } from '@/data/substitutionRatios';

/** Same primary muscle as `exercise`, ranked by matching movement pattern then equipment group. */
export function substitutesFor(exercise: Exercise, custom: Exercise[] = []): Exercise[] {
  const group = equipmentGroup(exercise.equipment);
  const score = (e: Exercise): number => (e.pattern === exercise.pattern ? 2 : 0) + (equipmentGroup(e.equipment) === group ? 1 : 0);
  return [...LIBRARY, ...custom]
    .filter(e => e.id !== exercise.id && e.primary.some(m => exercise.primary.includes(m)))
    .sort((a, b) => score(b) - score(a));
}

export interface CarryOverStart {
  /** Canonical kg, snapped to a real rung on the substitute's menu. */
  kg: number;
  reps: number;
  confidence: 'low';
  text: string;
}

/**
 * LT-5 (docs/LOAD-AWARE-TARGETS.md §5): a starting estimate for a substitute exercise, carried over
 * from the replaced lift's estimated one-rep max (canonical kg) through a sourced pattern ratio
 * (`src/data/substitutionRatios.ts`), then placed on the substitute's own load menu.
 * AUD-8 (SCI-08): the ratio maps one max to another, so the input is an e1RM, never a working load;
 * the load is solved for the requested reps and reps in reserve, then placed on `menu.rungsKg`.
 * Null with no sourced ratio for this pair, or nothing to place it on - the caller keeps today's
 * `startingLoadKg` behaviour (A3).
 */
export function carryOverStart(replaced: Pick<Exercise, 'pattern' | 'equipment'>, substitute: Pick<Exercise, 'pattern' | 'equipment'>, replacedE1rmKg: number, menu: Pick<LoadMenu, 'profile' | 'rungsKg'>, goal: { reps: number; rir: number }): CarryOverStart | null {
  if (!(replacedE1rmKg > 0) || !menu.rungsKg.length) return null;
  if (replaced.pattern !== substitute.pattern) return null;
  const ratio = substitutionRatio(replaced.pattern, equipmentGroup(replaced.equipment), equipmentGroup(substitute.equipment));
  if (!ratio) return null;
  const estimateKg = replacedE1rmKg * ratio.ratio;
  const rung = chooseStartRung(estimateKg / (1 + (goal.reps + goal.rir) / EPLEY_DIVISOR), menu);
  const reps = Math.max(1, Math.min(20, Math.floor(EPLEY_DIVISOR * (estimateKg / rung.kg - 1) - goal.rir)));
  return { kg: rung.kg, reps, confidence: 'low', text: `Start around ${formatLoadable(rung)} for ${reps}` };
}

/**
 * Where the carry-over load lands on the substitute's menu: the heaviest rung at or below it, so the
 * first session is achievable, or the lightest rung when even that is heavier. AUD-8 (SCI-08):
 * the menu's rungs include learned loads, which the profile's ladder alone would miss.
 */
function chooseStartRung(loadKg: number, menu: Pick<LoadMenu, 'profile' | 'rungsKg'>): Loadable {
  const rungs = [...menu.rungsKg].sort((a, b) => a - b);
  const kg = rungs.filter(k => k <= loadKg + 1e-6).at(-1) ?? rungs[0]!;
  return { kg, value: kgToDisplay(kg, menu.profile.unit), unit: menu.profile.unit };
}

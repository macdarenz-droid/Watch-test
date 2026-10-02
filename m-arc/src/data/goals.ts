/**
 * Training goals. Each goal is a small policy object: it sets rep ranges for
 * main lifts and accessories, the effort target, a rest suggestion, and
 * which starter templates to offer. `role` on an exercise (main vs
 * accessory), not a pattern guess, decides which rep range applies.
 */
import type { SplitTemplateKey } from './templates';

export type GoalId = 'lean' | 'growth' | 'strength_muscle' | 'strength';

export interface Goal {
  id: GoalId;
  name: string;
  tagline: string;
  bestFor: string;
  /** Rep range for main lifts. */
  mainReps: [number, number];
  /** Rep range for accessories. */
  accessoryReps: [number, number];
  /** Reps in reserve the coach aims for. */
  rir: [number, number];
  /** Suggested rest, offered as a one-tap action on goal change, never applied silently. */
  restDefaultSec: number;
  /** Minimum share of main-lift working sets at 5 reps or fewer, for the weekly rep-mix rule. */
  heavyShareMin?: number;
  /** Maximum share of main-lift working sets rated max effort, for the failure-share rule. */
  failureShareCap: number;
  /** Direct hard sets per main lift per week, for the volume-band rule. */
  mainLiftWeeklySets?: [number, number];
  /** Target weekly body-weight change as a percent of body weight, for the weight-trend rule. */
  weightRatePctPerWeek?: [number, number];
  /** Starter split templates offered on goal change. */
  templates: SplitTemplateKey[];
}

export const GOALS: Goal[] = [
  {
    id: 'lean', name: 'Lean muscle', tagline: 'Defined, athletic, balanced', bestFor: 'Muscle, definition and strength together.',
    mainReps: [6, 12], accessoryReps: [8, 15], rir: [1, 3], restDefaultSec: 90,
    failureShareCap: 0.5, weightRatePctPerWeek: [-1.0, -0.5], templates: ['push', 'pull', 'legs'],
  },
  {
    id: 'growth', name: 'Muscle growth', tagline: 'Size and volume', bestFor: 'Growing overall muscle size.',
    mainReps: [6, 15], accessoryReps: [8, 20], rir: [0, 2], restDefaultSec: 90,
    failureShareCap: 0.5, weightRatePctPerWeek: [0.25, 0.5], templates: ['push', 'pull', 'legs'],
  },
  {
    id: 'strength_muscle', name: 'Strength and muscle', tagline: 'Powerful and muscular', bestFor: 'Strength gains with muscle development.',
    mainReps: [4, 8], accessoryReps: [8, 12], rir: [1, 3], restDefaultSec: 120,
    heavyShareMin: 0.25, failureShareCap: 0.4, weightRatePctPerWeek: [0, 0.25], templates: ['upper', 'lower'],
  },
  {
    id: 'strength', name: 'Strength focus', tagline: 'Max strength and power', bestFor: 'Maximum strength and power output.',
    mainReps: [1, 5], accessoryReps: [6, 12], rir: [1, 3], restDefaultSec: 150,
    heavyShareMin: 0.4, failureShareCap: 0.3, mainLiftWeeklySets: [3, 10], weightRatePctPerWeek: [-0.25, 0.25], templates: ['full_a', 'full_b'],
  },
];

export const GOAL_BY_ID = Object.fromEntries(GOALS.map(g => [g.id, g])) as Record<GoalId, Goal>;
export const DEFAULT_GOAL: GoalId = 'lean';
export function isGoalId(v: unknown): v is GoalId {
  return typeof v === 'string' && v in GOAL_BY_ID;
}

/** Training goals. The goal only changes rep targets and the effort window. */
export type GoalId = 'lean' | 'growth' | 'strength_muscle' | 'strength';

export interface Goal {
  id: GoalId;
  name: string;
  tagline: string;
  /** Rep range for main lifts. */
  reps: [number, number];
  /** Rep range for accessories when it differs. */
  accessoryReps?: [number, number];
  /** Reps in reserve the coach aims for. */
  rir: [number, number];
  bestFor: string;
}

export const GOALS: Goal[] = [
  { id: 'lean', name: 'Lean muscle', tagline: 'Defined, athletic, balanced', reps: [6, 12], rir: [1, 3], bestFor: 'Muscle, definition and strength together.' },
  { id: 'growth', name: 'Muscle growth', tagline: 'Size and volume', reps: [6, 15], rir: [0, 2], bestFor: 'Growing overall muscle size.' },
  { id: 'strength_muscle', name: 'Strength and muscle', tagline: 'Powerful and muscular', reps: [4, 8], accessoryReps: [8, 12], rir: [1, 3], bestFor: 'Strength gains with muscle development.' },
  { id: 'strength', name: 'Strength focus', tagline: 'Max strength and power', reps: [1, 5], rir: [1, 3], bestFor: 'Maximum strength and power output.' },
];

export const GOAL_BY_ID = Object.fromEntries(GOALS.map(g => [g.id, g])) as Record<GoalId, Goal>;
export const DEFAULT_GOAL: GoalId = 'lean';
export function isGoalId(v: unknown): v is GoalId {
  return typeof v === 'string' && v in GOAL_BY_ID;
}

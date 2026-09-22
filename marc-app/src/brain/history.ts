/** Per-exercise history, derived once from sessions and reused by every engine. */
import type { Effort, Exercise, LoggedSet, ResistanceMode, Session } from '@/core/models';
import { findExercise } from '@/core/exercises';
import { estimatedOneRm } from '@/core/units';
import { daysBetween } from '@/core/dates';
import { isWorkingSet, EFFORT_MULT } from './exposure';

export interface ExerciseSessionSummary {
  sessionId: string;
  day: string;
  sets: LoggedSet[];
  /** Heaviest load used for a working set. */
  topKg: number;
  /** Reps done at the heaviest load (best set). */
  topReps: number;
  bestReps: number;
  bestDurationSec: number;
  bestDistanceM: number;
  volume: number;
  /** Best estimated 1RM using sets of 10 reps or fewer. */
  bestE1rm: number;
  /** 0–1 share of working sets that have an effort recorded. */
  effortCoverage: number;
  avgEffort: number;
  hasMax: boolean;
  allEasy: boolean;
}

export function summarizeSets(sessionId: string, day: string, sets: LoggedSet[]): ExerciseSessionSummary {
  const working = sets.filter(isWorkingSet);
  const topKg = Math.max(0, ...working.map(s => s.kg ?? 0));
  const topSets = working.filter(s => (s.kg ?? 0) === topKg);
  const topReps = Math.max(0, ...topSets.map(s => s.reps ?? 0));
  const withEffort = working.filter(s => s.effort);
  const efforts = withEffort.map(s => EFFORT_MULT[s.effort as Effort]);
  return {
    sessionId,
    day,
    sets: working,
    topKg,
    topReps,
    bestReps: Math.max(0, ...working.map(s => s.reps ?? 0)),
    bestDurationSec: Math.max(0, ...working.map(s => s.durationSec ?? 0)),
    bestDistanceM: Math.max(0, ...working.map(s => s.distanceM ?? 0)),
    volume: working.reduce((a, s) => a + ((s.kg ?? 0) > 0 ? (s.kg ?? 0) * (s.reps ?? 0) : (s.reps ?? 0)), 0),
    bestE1rm: Math.max(0, ...working.filter(s => (s.kg ?? 0) > 0 && (s.reps ?? 0) > 0 && (s.reps ?? 0) <= 10).map(s => estimatedOneRm(s.kg!, s.reps!))),
    effortCoverage: working.length ? withEffort.length / working.length : 0,
    avgEffort: efforts.length ? efforts.reduce((a, b) => a + b, 0) / efforts.length : 1,
    hasMax: withEffort.some(s => s.effort === 'max'),
    allEasy: withEffort.length > 0 && withEffort.length === working.length && withEffort.every(s => s.effort === 'easy'),
  };
}

/** All sessions where this exercise was logged, oldest first. */
export function exerciseHistory(sessions: Session[], exerciseId: string, custom: Exercise[] = []): ExerciseSessionSummary[] {
  const meta = findExercise(exerciseId, custom);
  const ids = new Set([exerciseId, meta?.id].filter(Boolean) as string[]);
  const out: ExerciseSessionSummary[] = [];
  for (const s of sessions) {
    const sets = s.exercises.filter(e => ids.has(e.exerciseId) || (meta && findExercise(e.name, custom)?.id === meta.id)).flatMap(e => e.sets);
    if (!sets.some(isWorkingSet)) continue;
    out.push(summarizeSets(s.id, s.day, sets));
  }
  return out.sort((a, b) => a.day.localeCompare(b.day));
}

export function modeOf(exerciseId: string, custom: Exercise[] = []): ResistanceMode {
  return findExercise(exerciseId, custom)?.mode ?? 'weighted';
}

export function daysSinceLast(history: ExerciseSessionSummary[], today: string): number | null {
  const last = history[history.length - 1];
  return last ? daysBetween(last.day, today) : null;
}

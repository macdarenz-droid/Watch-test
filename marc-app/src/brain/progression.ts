/**
 * What to do next session for one exercise. Every answer has a plain-words
 * reason. The rules, in order:
 *  1. Nothing logged yet            → start light.
 *  2. More than 28 days away        → return at the last load, no increase.
 *  3. Effort missing on most sets   → repeat and log effort before changing.
 *  4. Two sessions in a row under the range at max effort → take one step down.
 *  5. Top of the range, no max effort, twice in a row → add one step.
 *  6. Top of the range once          → confirm it once more.
 *  7. Trend clearly down             → keep the load, easier week, then rebuild.
 *  8. Otherwise                      → add a rep.
 */
import type { Exercise, LoggedSet, ResistanceMode, Session } from '@/core/models';
import { GOAL_BY_ID, type GoalId } from '@/data/goals';
import { findExercise, startingLoadKg } from '@/core/exercises';
import { daysSinceLast, exerciseHistory, modeOf, type ExerciseSessionSummary } from './history';
import { plateauStatus } from './trend';

export type Mode = 'start' | 'reentry' | 'confirm_effort' | 'reduce' | 'increase' | 'confirm' | 'reps' | 'hold' | 'duration' | 'plateau';

export interface Suggestion {
  mode: Mode;
  /** The headline target, e.g. "62.5 kg · 6–8 reps". */
  target: string;
  kg: number | null;
  reps: [number, number] | null;
  reason: string;
  confidence: 'low' | 'medium' | 'high';
  /** Set-by-set targets for the next session. */
  sets: Array<{ kg: number | null; reps: number | null; durationSec: number | null; note: string }>;
}

export function loadStep(kg: number): number {
  if (kg <= 10) return 1;
  if (kg <= 30) return 2;
  return 2.5;
}

const half = (v: number) => Math.round(v * 2) / 2;

export function repRange(exercise: Exercise | undefined, goal: GoalId): [number, number] {
  const g = GOAL_BY_ID[goal];
  const isMain = !!exercise && /squat|hinge|horizontal_push|vertical_push|vertical_pull|horizontal_pull/.test(exercise.pattern);
  return !isMain && g.accessoryReps ? g.accessoryReps : g.reps;
}

function fmtRange(r: [number, number]): string {
  return `${r[0]}–${r[1]} reps`;
}

function confidenceFrom(n: number): Suggestion['confidence'] {
  return n >= 7 ? 'high' : n >= 4 ? 'medium' : 'low';
}

function setPlan(count: number, kg: number | null, reps: number | null, durationSec: number | null, note: string): Suggestion['sets'] {
  return Array.from({ length: Math.max(1, Math.min(6, count)) }, () => ({ kg, reps, durationSec, note }));
}

export function suggestNext(sessions: Session[], exerciseId: string, goal: GoalId, today: string, plannedSets = 3, custom: Exercise[] = []): Suggestion {
  const meta = findExercise(exerciseId, custom);
  const mode: ResistanceMode = modeOf(exerciseId, custom);
  const range = repRange(meta, goal);
  const hist = exerciseHistory(sessions, exerciseId, custom);
  const last = hist[hist.length - 1];
  const setCount = last?.sets.length || plannedSets;

  if (!last) {
    const start = startingLoadKg(meta?.equipment ?? '');
    if (mode === 'duration') return { mode: 'start', target: 'Hold 20–30s', kg: null, reps: null, reason: 'First time. Hold for a comfortable 20 to 30 seconds and note how it felt.', confidence: 'low', sets: setPlan(setCount, null, null, 30, 'Start here') };
    if (mode === 'bodyweight' || start.kg == null) return { mode: 'start', target: `Start light · ${fmtRange(range)}`, kg: null, reps: range, reason: start.note, confidence: 'low', sets: setPlan(setCount, null, range[0], null, 'Start here') };
    return { mode: 'start', target: `${start.kg} kg · ${fmtRange(range)}`, kg: start.kg, reps: range, reason: start.note, confidence: 'low', sets: setPlan(setCount, start.kg, range[0], null, 'Start here') };
  }

  const conf = confidenceFrom(hist.length);
  const gap = daysSinceLast(hist, today) ?? 0;

  if (mode === 'duration') {
    const best = last.bestDurationSec || 20;
    const next = last.hasMax ? best : best + 5;
    return { mode: 'duration', target: `Hold ${next}s`, kg: null, reps: null, reason: last.hasMax ? 'Last hold was max effort. Repeat it before adding time.' : 'Add five seconds to your best hold.', confidence: conf, sets: setPlan(setCount, null, null, next, last.hasMax ? 'Repeat' : 'Add 5s') };
  }

  if (gap > 28) {
    return { mode: 'reentry', target: mode === 'weighted' ? `${last.topKg} kg · ${fmtRange(range)}` : `${fmtRange(range)}`, kg: last.topKg || null, reps: range, reason: `It has been ${gap} days. Repeat your last load once before adding anything.`, confidence: 'low', sets: setPlan(setCount, last.topKg || null, range[0], null, 'Return session') };
  }

  const recent = hist.slice(-3);
  const coverage = recent.reduce((a, r) => a + r.effortCoverage, 0) / recent.length;

  if (mode === 'bodyweight' || mode === 'assisted' || mode === 'conditioning') {
    const reps = last.bestReps;
    const nextReps = last.hasMax ? reps : reps + 1;
    return { mode: 'reps', target: `${nextReps} reps`, kg: null, reps: [nextReps, nextReps], reason: last.hasMax ? 'Last set was max effort. Match it before adding a rep.' : 'Add one rep to your best set.', confidence: conf, sets: setPlan(setCount, null, nextReps, null, last.hasMax ? 'Match it' : 'Add a rep') };
  }

  const topKg = last.topKg;
  const holdSets = (note: string, reps = Math.min(range[1], Math.max(range[0], last.topReps + 1))) => setPlan(setCount, topKg, reps, null, note);
  const holdTarget = `${topKg} kg · ${fmtRange(range)}`;

  if (coverage < 0.5 && hist.length >= 2) {
    return { mode: 'confirm_effort', target: holdTarget, kg: topKg, reps: range, reason: 'Most recent sets have no effort rating. Keep the load and rate each set so the coach can judge the next step.', confidence: 'low', sets: holdSets('Log effort') };
  }

  const prev = hist[hist.length - 2];
  const belowAtMax = (r: ExerciseSessionSummary) => r.hasMax && r.topReps < range[0];
  if (prev && belowAtMax(last) && belowAtMax(prev)) {
    const down = Math.max(0, half(topKg - loadStep(topKg)));
    return { mode: 'reduce', target: `${down} kg · ${fmtRange(range)}`, kg: down, reps: range, reason: 'Two sessions in a row under the rep range at max effort. Take one step down and rebuild reps.', confidence: conf, sets: setPlan(setCount, down, range[0], null, 'Ease one step') };
  }

  const plateau = plateauStatus(hist);
  if (plateau.status === 'declining' && plateau.confidence !== 'low') {
    return { mode: 'plateau', target: `${topKg} kg · ${range[0]}–${range[0] + 2} reps`, kg: topKg, reps: [range[0], range[0] + 2], reason: 'Progress has slipped over recent sessions. Keep this load, stop short of max effort for a week, then build back up.', confidence: plateau.confidence, sets: holdSets('Lighter week', range[0]) };
  }
  const cleanTop = (r: ExerciseSessionSummary) => r.topReps >= range[1] && !r.hasMax && r.effortCoverage > 0;
  if (cleanTop(last)) {
    const twoForTwo = !!prev && cleanTop(prev) && prev.topKg === topKg;
    const fastTrack = last.allEasy && hist.length >= 4;
    if ((twoForTwo || fastTrack) && plateau.status !== 'declining') {
      const step = loadStep(topKg);
      const capped = topKg >= 10 ? Math.min(step, topKg * 0.1) : step;
      const up = half(topKg + Math.max(0.5, capped));
      return { mode: 'increase', target: `${up} kg · ${fmtRange(range)}`, kg: up, reps: range, reason: twoForTwo ? 'Top of the range two sessions running without max effort. Add one step.' : 'All sets felt easy at the top of the range. Add one step.', confidence: conf, sets: setPlan(setCount, up, range[0], null, 'Small load increase') };
    }
    return { mode: 'confirm', target: holdTarget, kg: topKg, reps: [range[1], range[1]], reason: 'You reached the top of the range once. Do it again at this load and the next step unlocks.', confidence: conf, sets: holdSets('Confirm', range[1]) };
  }

  if (plateau.status === 'plateaued' && plateau.confidence !== 'low') {
    return { mode: 'plateau', target: holdTarget, kg: topKg, reps: range, reason: 'This lift has not moved for a while. Try a different rep range or one lighter week, then rebuild.', confidence: plateau.confidence, sets: holdSets('Change it up') };
  }

  const nextReps = Math.min(range[1], Math.max(range[0], last.topReps + 1));
  return { mode: 'hold', target: `${topKg} kg · ${nextReps} reps`, kg: topKg, reps: [nextReps, nextReps], reason: last.hasMax ? 'Last set was max effort. Keep the load and aim for one more clean rep.' : 'Keep the load and add a rep. Reps first, then load.', confidence: conf, sets: holdSets('Build reps', nextReps) };
}

/** The previous set at the same position, for the "last time" hint while logging. */
export function previousSet(sessions: Session[], exerciseId: string, setIndex: number, custom: Exercise[] = []): LoggedSet | null {
  const hist = exerciseHistory(sessions, exerciseId, custom);
  const last = hist[hist.length - 1];
  if (!last) return null;
  return last.sets[Math.min(setIndex, last.sets.length - 1)] ?? null;
}

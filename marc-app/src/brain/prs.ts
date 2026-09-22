/**
 * Personal records. The first session of an exercise is a baseline, never a
 * record. Records are about performance (heavier, stronger, more reps at a
 * load, longer hold, more distance), never about total volume.
 */
import type { Exercise, ResistanceMode, Session } from '@/core/models';
import { exerciseHistory, modeOf, summarizeSets, type ExerciseSessionSummary } from './history';
import { weekStart, addDays } from '@/core/dates';
import { isWorkingSet } from './exposure';

export type PrKind = 'heaviest' | 'strength' | 'reps_at_load' | 'best_reps' | 'best_duration' | 'best_distance';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  day: string;
  kind: PrKind;
  /** Plain words, e.g. "60 kg × 8". */
  detail: string;
  value: number;
  previous: number;
}

export const PR_LABEL: Record<PrKind, string> = {
  heaviest: 'Heaviest load',
  strength: 'Strength estimate',
  reps_at_load: 'More reps at a load',
  best_reps: 'Most reps',
  best_duration: 'Longest hold',
  best_distance: 'Furthest carry',
};

function repsAtLoadMap(rows: ExerciseSessionSummary[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of rows) for (const s of r.sets) {
    if ((s.kg ?? 0) > 0 && (s.reps ?? 0) > 0) m.set(s.kg!, Math.max(m.get(s.kg!) ?? 0, s.reps!));
  }
  return m;
}

/** Records set in `current`, given all `prior` sessions of the same exercise. */
export function recordsFor(current: ExerciseSessionSummary, prior: ExerciseSessionSummary[], mode: ResistanceMode, exerciseId: string, exerciseName: string): PersonalRecord[] {
  if (!prior.length) return [];
  const out: PersonalRecord[] = [];
  const base = { exerciseId, exerciseName, day: current.day };
  if (mode === 'weighted' || mode === 'conditioning') {
    const prevTop = Math.max(0, ...prior.map(p => p.topKg));
    if (current.topKg > prevTop && prevTop > 0) out.push({ ...base, kind: 'heaviest', detail: `${current.topKg} kg × ${current.topReps}`, value: current.topKg, previous: prevTop });
    const prevE = Math.max(0, ...prior.map(p => p.bestE1rm));
    if (prevE > 0 && current.bestE1rm > prevE * 1.01) out.push({ ...base, kind: 'strength', detail: `about ${Math.round(current.bestE1rm)} kg one-rep estimate`, value: current.bestE1rm, previous: prevE });
    const atLoad = repsAtLoadMap(prior);
    for (const s of current.sets) {
      const prevReps = atLoad.get(s.kg ?? -1);
      if (prevReps != null && (s.reps ?? 0) > prevReps && !out.some(o => o.kind === 'reps_at_load')) {
        out.push({ ...base, kind: 'reps_at_load', detail: `${s.reps} reps at ${s.kg} kg`, value: s.reps!, previous: prevReps });
      }
    }
  }
  if (mode === 'bodyweight' || mode === 'assisted') {
    const prev = Math.max(0, ...prior.map(p => p.bestReps));
    if (current.bestReps > prev && prev > 0) out.push({ ...base, kind: 'best_reps', detail: `${current.bestReps} reps`, value: current.bestReps, previous: prev });
  }
  if (mode === 'duration' || mode === 'conditioning') {
    const prev = Math.max(0, ...prior.map(p => p.bestDurationSec));
    if (current.bestDurationSec > prev && prev > 0) out.push({ ...base, kind: 'best_duration', detail: `${current.bestDurationSec}s`, value: current.bestDurationSec, previous: prev });
  }
  if (mode === 'conditioning') {
    const prev = Math.max(0, ...prior.map(p => p.bestDistanceM));
    if (current.bestDistanceM > prev && prev > 0) out.push({ ...base, kind: 'best_distance', detail: `${current.bestDistanceM} m`, value: current.bestDistanceM, previous: prev });
  }
  return out;
}

/** Every record across all sessions, newest first. */
export function allRecords(sessions: Session[], custom: Exercise[] = []): PersonalRecord[] {
  const names = new Map<string, string>();
  for (const s of sessions) for (const e of s.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, e.name);
  const out: PersonalRecord[] = [];
  for (const [id, name] of names) {
    const hist = exerciseHistory(sessions, id, custom);
    const mode = modeOf(id, custom);
    hist.forEach((row, i) => out.push(...recordsFor(row, hist.slice(0, i), mode, id, name)));
  }
  return out.sort((a, b) => b.day.localeCompare(a.day));
}

export function recordsInWeek(sessions: Session[], today: string, custom: Exercise[] = []): PersonalRecord[] {
  const start = weekStart(today);
  const end = addDays(start, 7);
  return allRecords(sessions, custom).filter(r => r.day >= start && r.day < end);
}

/** Live check while logging: would this set be a record right now? */
export function isLiveRecord(sessions: Session[], exerciseId: string, set: { kg?: number; reps?: number }, custom: Exercise[] = []): boolean {
  if (!isWorkingSet(set)) return false;
  const hist = exerciseHistory(sessions, exerciseId, custom);
  if (!hist.length) return false;
  const mode = modeOf(exerciseId, custom);
  const current = summarizeSets('live', '9999-12-31', [set]);
  return recordsFor(current, hist, mode, exerciseId, '').length > 0;
}

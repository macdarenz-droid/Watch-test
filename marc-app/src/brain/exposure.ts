/**
 * How much each muscle was worked. One vocabulary for the session summary,
 * the weekly view, the muscle map and the recovery model.
 */
import type { Effort, Exercise, LoggedExercise, LoggedSet, Session } from '@/core/models';
import { MUSCLE_IDS, type MuscleId } from '@/data/muscles';
import { findExercise } from '@/core/exercises';
import { weekStart, addDays } from '@/core/dates';

export const ROLE_WEIGHT = { primary: 1, secondary: 0.55, stabilizer: 0.25 } as const;
export const EFFORT_MULT: Record<Effort, number> = { easy: 0.9, ideal: 1, max: 1.1 };
/** Weekly "effective sets": direct work counts fully, secondary work as half. */
export const SET_WEIGHT = { primary: 1, secondary: 0.5, stabilizer: 0 } as const;

export type Role = 'primary' | 'secondary' | 'stabilizer';

export function rolesFor(exercise: Exercise): Array<{ muscle: MuscleId; role: Role }> {
  const seen = new Set<MuscleId>();
  const out: Array<{ muscle: MuscleId; role: Role }> = [];
  const add = (list: MuscleId[], role: Role) => {
    for (const m of list) if (!seen.has(m)) { seen.add(m); out.push({ muscle: m, role }); }
  };
  add(exercise.primary, 'primary');
  add(exercise.secondary, 'secondary');
  add(exercise.stabilizers, 'stabilizer');
  return out;
}

export function isWorkingSet(s: LoggedSet): boolean {
  return (s.reps ?? 0) > 0 || (s.durationSec ?? 0) > 0 || (s.distanceM ?? 0) > 0;
}

export function effortOf(s: LoggedSet): number {
  return s.effort ? EFFORT_MULT[s.effort] : 1;
}

export type MuscleScore = Partial<Record<MuscleId, number>>;

/** Relative emphasis of one workout: role weight × effort per set, split across muscles of that role. */
export function sessionEmphasis(exercises: LoggedExercise[], custom: Exercise[] = []): { scores: MuscleScore; percents: MuscleScore } {
  const scores: MuscleScore = {};
  for (const ex of exercises) {
    const meta = findExercise(ex.exerciseId, custom) ?? findExercise(ex.name, custom);
    if (!meta) continue;
    const roles = rolesFor(meta);
    const count = { primary: 0, secondary: 0, stabilizer: 0 };
    for (const r of roles) count[r.role]++;
    for (const set of ex.sets) {
      if (!isWorkingSet(set)) continue;
      const e = effortOf(set);
      for (const r of roles) {
        const share = (ROLE_WEIGHT[r.role] * e) / count[r.role];
        scores[r.muscle] = (scores[r.muscle] ?? 0) + share;
      }
    }
  }
  return { scores, percents: toPercents(scores) };
}

/** Largest-remainder rounding so the percentages add up to 100. */
export function toPercents(scores: MuscleScore): MuscleScore {
  const entries = Object.entries(scores).filter(([, v]) => (v ?? 0) > 0) as Array<[MuscleId, number]>;
  const total = entries.reduce((a, [, v]) => a + v, 0);
  if (!total) return {};
  const raw = entries.map(([m, v]) => ({ m, exact: (v / total) * 100 }));
  const floored = raw.map(r => ({ ...r, val: Math.floor(r.exact) }));
  let remainder = 100 - floored.reduce((a, r) => a + r.val, 0);
  floored.sort((a, b) => (b.exact - b.val) - (a.exact - a.val));
  for (const r of floored) { if (remainder <= 0) break; r.val++; remainder--; }
  const out: MuscleScore = {};
  for (const r of floored) out[r.m] = r.val;
  return out;
}

export interface WeeklyMuscleSets {
  week: string;
  sets: Partial<Record<MuscleId, number>>;
}

/** Effective sets per muscle for each of the last `weeks` weeks (index 0 = current). */
export function weeklyMuscleSets(sessions: Session[], today: string, weeks = 4, custom: Exercise[] = []): WeeklyMuscleSets[] {
  const start = weekStart(today);
  const rows: WeeklyMuscleSets[] = Array.from({ length: weeks }, (_, i) => ({ week: addDays(start, -7 * i), sets: {} }));
  for (const s of sessions) {
    const ws = weekStart(s.day);
    const idx = rows.findIndex(r => r.week === ws);
    if (idx < 0) continue;
    const row = rows[idx]!;
    for (const ex of s.exercises) {
      const meta = findExercise(ex.exerciseId, custom) ?? findExercise(ex.name, custom);
      if (!meta) continue;
      const working = ex.sets.filter(isWorkingSet).length;
      if (!working) continue;
      for (const r of rolesFor(meta)) {
        const w = SET_WEIGHT[r.role];
        if (!w) continue;
        row.sets[r.muscle] = (row.sets[r.muscle] ?? 0) + working * w;
      }
    }
  }
  return rows;
}

/** Cumulative all-time training score per muscle, and a friendly level label. */
export const LEVELS: Array<{ min: number; name: string }> = [
  { min: 0, name: 'New' }, { min: 15, name: 'Beginner' }, { min: 40, name: 'Developing' },
  { min: 90, name: 'Established' }, { min: 180, name: 'Advanced' }, { min: 320, name: 'Elite' }, { min: 520, name: 'Master' },
];

export function trainingLevels(sessions: Session[], custom: Exercise[] = []): Record<MuscleId, { score: number; level: string; levelIndex: number }> {
  const score: MuscleScore = {};
  for (const s of sessions) {
    const emphasis = sessionEmphasis(s.exercises, custom).scores;
    for (const [m, v] of Object.entries(emphasis) as Array<[MuscleId, number]>) score[m] = (score[m] ?? 0) + v;
  }
  const out = {} as Record<MuscleId, { score: number; level: string; levelIndex: number }>;
  for (const m of MUSCLE_IDS) {
    const v = score[m] ?? 0;
    let idx = 0;
    LEVELS.forEach((l, i) => { if (v >= l.min) idx = i; });
    out[m] = { score: Math.round(v * 10) / 10, level: LEVELS[idx]!.name, levelIndex: idx };
  }
  return out;
}

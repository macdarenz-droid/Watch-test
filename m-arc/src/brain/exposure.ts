/**
 * How much each muscle was worked. One vocabulary for the session summary,
 * the weekly view, the muscle map and the recovery model.
 */
import type { Effort, Exercise, LoggedExercise, LoggedSet, Session } from '@/core/models';
import { MUSCLE_IDS, type MuscleId } from '@/data/muscles';
import { findExercise } from '@/core/exercises';
import { weekStart, addDays, daysBetween } from '@/core/dates';

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

/** F2: the set is filled in (reps, time or distance). Decides what is kept and committed. */
export function hasEntry(s: Pick<LoggedSet, 'reps' | 'durationSec' | 'distanceM'>): boolean {
  return (s.reps ?? 0) > 0 || (s.durationSec ?? 0) > 0 || (s.distanceM ?? 0) > 0;
}

/** A set that counts (exposure, volume, recovery, e1RM, records, progression): filled in and not a warm-up. */
export function isWorkingSet(s: Pick<LoggedSet, 'reps' | 'durationSec' | 'distanceM' | 'kind'>): boolean {
  return hasEntry(s) && s.kind !== 'warmup';
}

/** QA-R6-3: the set autoregulation and targets start from: the first one that is not a warm-up. */
/** A session with at least one working set; a warm-up-only one has nothing to share (QA4-8). */
export const hasWorkingSets = (s: Pick<Session, 'exercises'>): boolean => s.exercises.some(e => e.sets.some(isWorkingSet));

export const firstWorkingSet = <T extends Pick<LoggedSet, 'kind'>>(sets: T[]): T | undefined => sets.find(x => x.kind !== 'warmup');
/** QA-R6-8: a row's place among the working sets (history holds working sets only); null for a warm-up. */
export const workingIndex = (sets: Array<Pick<LoggedSet, 'kind'>>, j: number): number | null =>
  sets[j]?.kind === 'warmup' ? null : j - sets.slice(0, j).filter(x => x.kind === 'warmup').length;

/** The effort a set stands for: a set taken to failure is max effort. */
export function effortLabel(s: Pick<LoggedSet, 'effort' | 'kind'>): LoggedSet['effort'] {
  return s.kind === 'failure' ? 'max' : s.effort;
}

export function effortOf(s: LoggedSet): number {
  const e = effortLabel(s);
  return e ? EFFORT_MULT[e] : 1;
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
/**
 * The one weekly set count (BR-16): effective sets per muscle for sessions with `from <= day < to`.
 * Direct work counts 1, secondary 0.5, stabilisers 0 (SET_WEIGHT). `countEasy: false` leaves out
 * sets rated easy, for "hard sets".
 */
export function effectiveSetsByMuscle(sessions: Session[], from: string, to: string, custom: Exercise[] = [], opts: { countEasy?: boolean } = {}): Partial<Record<MuscleId, number>> {
  const countEasy = opts.countEasy ?? true;
  const out: Partial<Record<MuscleId, number>> = {};
  for (const s of sessions) {
    if (s.day < from || s.day >= to) continue;
    for (const ex of s.exercises) {
      const meta = findExercise(ex.exerciseId, custom) ?? findExercise(ex.name, custom);
      if (!meta) continue;
      const working = ex.sets.filter(set => isWorkingSet(set) && (countEasy || effortLabel(set) !== 'easy')).length;
      if (!working) continue;
      for (const r of rolesFor(meta)) {
        const w = SET_WEIGHT[r.role];
        if (!w) continue;
        out[r.muscle] = (out[r.muscle] ?? 0) + working * w;
      }
    }
  }
  return out;
}

export function weeklyMuscleSets(sessions: Session[], today: string, weeks = 4, custom: Exercise[] = [], opts: { countEasy?: boolean } = {}): WeeklyMuscleSets[] {
  const start = weekStart(today);
  return Array.from({ length: weeks }, (_, i) => {
    const week = addDays(start, -7 * i);
    return { week, sets: effectiveSetsByMuscle(sessions, week, addDays(week, 7), custom, opts) };
  });
}

/** Cumulative all-time training score per muscle, and a friendly level label. */
export const LEVELS: Array<{ min: number; name: string }> = [
  { min: 0, name: 'New' }, { min: 15, name: 'Beginner' }, { min: 40, name: 'Developing' },
  { min: 90, name: 'Established' }, { min: 180, name: 'Advanced' }, { min: 320, name: 'Elite' }, { min: 520, name: 'Master' },
];

/**
 * ADAPT-5 (C-2): the level a stated training age vouches for, as a LEVELS index: 12-36 months →
 * Developing, 36+ → Established (the cap), else 0 (no seed). Only `Profile.trainingSince` counts,
 * never the first logged session. `seed` is that month ('YYYY-MM') and today.
 */
export interface LevelSeed { trainingSince?: string; today: string }
export const LEVEL_SEED = [{ months: 36, levelIndex: 3 }, { months: 12, levelIndex: 2 }] as const;
export function levelSeedIndex(seed?: LevelSeed): number {
  if (!seed?.trainingSince || !/^\d{4}-\d{2}$/.test(seed.trainingSince)) return 0;
  const months = daysBetween(`${seed.trainingSince}-01`, seed.today) / 30.44;
  return LEVEL_SEED.find(x => months >= x.months)?.levelIndex ?? 0;
}

/** Per muscle: the lifetime score's level, raised to the seed's level when the person stated a training age (ADAPT-5). */
export function trainingLevels(sessions: Session[], custom: Exercise[] = [], seed?: LevelSeed): Record<MuscleId, { score: number; level: string; levelIndex: number }> {
  const floor = levelSeedIndex(seed);
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
    idx = Math.max(idx, floor);
    out[m] = { score: Math.round(v * 10) / 10, level: LEVELS[idx]!.name, levelIndex: idx };
  }
  return out;
}

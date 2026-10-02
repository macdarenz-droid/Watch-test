/** Per-exercise history, derived once from sessions and reused by every engine. */
import type { Effort, Exercise, LoggedSet, PlannedTarget, ResistanceMode, Session } from '@/core/models';
import { findExercise } from '@/core/exercises';
import { effectiveOneRm, RIR_BY_EFFORT } from './e1rm';
import { repsAt } from './retarget';
import { daysBetween } from '@/core/dates';
import { isWorkingSet, EFFORT_MULT } from './exposure';
import { confirmsFlagged, isImplausibleSet } from './fidelity';

export interface ExerciseSessionSummary {
  sessionId: string;
  day: string;
  /** Every working set, held ones included (content always counts: set counts, the "last time" hint). */
  sets: LoggedSet[];
  /**
   * BUG-18 (COACHRULES-F3): working sets the plausibility check flags that no other set has
   * repeated yet. Every number below leaves them out, so a typo never feeds e1RM, trends,
   * records or targets until the load is lifted again.
   */
  held: LoggedSet[];
  /** Heaviest load used for a working set. */
  topKg: number;
  /** Reps done at the heaviest load (best set). */
  topReps: number;
  /**
   * BUG-18 (PROGRESSION-F3): the straight working load, the load most working sets used (drop
   * sets aside); a tie goes to the heavier load. Targets build on this, not on one heavy single.
   */
  workKg: number;
  /** Best reps at the working load. */
  workReps: number;
  /** Fewest reps at the working load: every working set reached this (PROGRESSION-F23). */
  workMinReps: number;
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
  /** LT-3 (D-A4 a): set 1's planned target in that session, when it was stored at commit. */
  target?: PlannedTarget;
}

/** The straight working load of `sets` (BUG-18): most sets, then the heavier load; drop sets only when nothing else is loaded. */
function straightLoad(sets: LoggedSet[]): { kg: number; sets: LoggedSet[] } {
  const loaded = sets.filter(s => (s.kg ?? 0) > 0);
  const pool = loaded.some(s => s.kind !== 'drop') ? loaded.filter(s => s.kind !== 'drop') : loaded;
  const count = new Map<number, number>();
  for (const s of pool) count.set(s.kg!, (count.get(s.kg!) ?? 0) + 1);
  let kg = 0, n = 0;
  for (const [k, c] of count) if (c > n || (c === n && k > kg)) { kg = k; n = c; }
  return { kg, sets: pool.filter(s => s.kg === kg) };
}

/** `isHeld` marks sets to leave out of every number (BUG-18); they stay in `sets` and `held`. */
export function summarizeSets(sessionId: string, day: string, sets: LoggedSet[], isHeld: (s: LoggedSet) => boolean = () => false): ExerciseSessionSummary {
  // F2: warm-ups never count; a set to failure stands for max effort everywhere downstream.
  const all = sets.filter(isWorkingSet).map(s => ({ s, held: isHeld(s), w: s.kind === 'failure' && s.effort !== 'max' ? { ...s, effort: 'max' as const } : s }));
  const working = all.filter(x => !x.held).map(x => x.w);
  const { kg: workKg, sets: workSets } = straightLoad(working);
  const topKg = Math.max(0, ...working.map(s => s.kg ?? 0));
  const topSets = working.filter(s => (s.kg ?? 0) === topKg);
  const topReps = Math.max(0, ...topSets.map(s => s.reps ?? 0));
  const withEffort = working.filter(s => s.effort);
  const efforts = withEffort.map(s => EFFORT_MULT[s.effort as Effort]);
  return {
    sessionId,
    day,
    sets: all.map(x => x.w),
    held: all.filter(x => x.held).map(x => x.w),
    topKg,
    topReps,
    workKg,
    workReps: Math.max(0, ...workSets.map(s => s.reps ?? 0)),
    workMinReps: workSets.length ? Math.min(...workSets.map(s => s.reps ?? 0)) : 0,
    bestReps: Math.max(0, ...working.map(s => s.reps ?? 0)),
    bestDurationSec: Math.max(0, ...working.map(s => s.durationSec ?? 0)),
    bestDistanceM: Math.max(0, ...working.map(s => s.distanceM ?? 0)),
    volume: working.reduce((a, s) => a + ((s.kg ?? 0) > 0 ? (s.kg ?? 0) * (s.reps ?? 0) : (s.reps ?? 0)), 0),
    bestE1rm: Math.max(0, ...working.map(s => effectiveOneRm(s.kg ?? 0, s.reps ?? 0, s.effort) ?? 0)),
    effortCoverage: working.length ? withEffort.length / working.length : 0,
    avgEffort: efforts.length ? efforts.reduce((a, b) => a + b, 0) / efforts.length : 1,
    hasMax: withEffort.some(s => s.effort === 'max'),
    allEasy: withEffort.length > 0 && withEffort.length === working.length && withEffort.every(s => s.effort === 'easy'),
  };
}

const NO_CUSTOM: Exercise[] = [];

/** A lift counts as active while it was trained in the last six weeks (BR-05). */
export const ACTIVE_LIFT_DAYS = 42;
export function isActive(hist: ExerciseSessionSummary[], today: string): boolean {
  const last = hist[hist.length - 1];
  return !!last && daysBetween(last.day, today) <= ACTIVE_LIFT_DAYS;
}
/**
 * Results per sessions array and custom list (UI-10): state updates replace the arrays, so an
 * identity hit is always current. Callers get a copy, so sorting or reversing it is safe.
 */
const historyCache = new WeakMap<Session[], WeakMap<Exercise[], Map<string, ExerciseSessionSummary[]>>>();

/** All sessions where this exercise was logged, oldest first. */
export function exerciseHistory(sessions: Session[], exerciseId: string, custom: Exercise[] = NO_CUSTOM): ExerciseSessionSummary[] {
  let byCustom = historyCache.get(sessions);
  if (!byCustom) { byCustom = new WeakMap(); historyCache.set(sessions, byCustom); }
  let byId = byCustom.get(custom);
  if (!byId) { byId = new Map(); byCustom.set(custom, byId); }
  let hit = byId.get(exerciseId);
  if (!hit) { hit = computeExerciseHistory(sessions, exerciseId, custom); byId.set(exerciseId, hit); }
  return [...hit];
}

function computeExerciseHistory(sessions: Session[], exerciseId: string, custom: Exercise[]): ExerciseSessionSummary[] {
  const meta = findExercise(exerciseId, custom);
  const ids = new Set([exerciseId, meta?.id].filter(Boolean) as string[]);
  const rows: Array<{ s: Session; sets: LoggedSet[]; target?: PlannedTarget }> = [];
  for (const s of sessions) {
    const mine = s.exercises.filter(e => ids.has(e.exerciseId) || (meta && findExercise(e.name, custom)?.id === meta.id));
    const sets = mine.flatMap(e => e.sets);
    if (!sets.some(isWorkingSet)) continue;
    const target = mine.find(e => e.target)?.target;
    rows.push({ s, sets, ...(target ? { target } : {}) });
  }
  rows.sort((a, b) => a.s.day.localeCompare(b.s.day));
  const checkLoad = loadIsChecked(exerciseId, custom);
  const out: ExerciseSessionSummary[] = [];
  rows.forEach(({ s, sets, target }, i) => {
    const ref = plausibilityRef(out, meta?.role === 'main');
    const later = rows.slice(i + 1).flatMap(r => r.sets.filter(isWorkingSet));
    const sum = summarizeSets(s.id, s.day, sets, heldIn(sets, later, ref, checkLoad));
    out.push(target ? { ...sum, target } : sum);
  });
  return out;
}

/** BUG-18: kg is checked for implausible jumps only where it is the lifted load. */
export function loadIsChecked(exerciseId: string, custom: Exercise[] = NO_CUSTOM): boolean {
  const mode = modeOf(exerciseId, custom);
  return mode === 'weighted' || mode === 'conditioning';
}

export interface PlausibilityRef {
  /** The best trusted load so far: the reference a jump is measured from. */
  bestKg: number | null;
  /** Whether a set is a main lift above 70 % of the best trusted e1RM (the 30-rep limit applies). */
  heavy: (s: Pick<LoggedSet, 'kg'>) => boolean;
}

/** BUG-18: what a new set is checked against, from the trusted sessions before it. */
export function plausibilityRef(prior: ExerciseSessionSummary[], isMain: boolean): PlausibilityRef {
  const bestKg = Math.max(0, ...prior.map(p => p.topKg));
  const bestE1rm = Math.max(0, ...prior.map(p => p.bestE1rm));
  return { bestKg: bestKg > 0 ? bestKg : null, heavy: s => isMain && bestE1rm > 0 && (s.kg ?? 0) > bestE1rm * 0.7 };
}

/**
 * BUG-18 (plan 6.17.4): the sets of one session held as implausible, those flagged against `ref`
 * that no other working set (this session or a later one, `later`) repeats.
 */
export function heldIn(sets: LoggedSet[], later: LoggedSet[], ref: PlausibilityRef, checkLoad: boolean): (s: LoggedSet) => boolean {
  const working = sets.filter(isWorkingSet);
  const held = new Set(working.filter(set => {
    if (set.kind === 'drop' || !isImplausibleSet(set, ref.bestKg, ref.heavy(set), checkLoad)) return false;
    return ![...working.filter(o => o !== set), ...later].some(o => confirmsFlagged(set, o, ref.bestKg, ref.heavy(set), checkLoad));
  }));
  return s => held.has(s);
}

export function modeOf(exerciseId: string, custom: Exercise[] = []): ResistanceMode {
  return findExercise(exerciseId, custom)?.mode ?? 'weighted';
}

export function daysSinceLast(history: ExerciseSessionSummary[], today: string): number | null {
  const last = history[history.length - 1];
  return last ? daysBetween(last.day, today) : null;
}

/** LT-3: the next target restated on the planned line, with the reason the coach gives. */
export interface Restated { kg: number; repWindow: [number, number]; reason: string }

const OFF_EPS = 0.011;
const REP_EPS = 0.01;
const off = (h: ExerciseSessionSummary): boolean => !!h.target && h.workKg > 0 && Math.abs(h.workKg - h.target.kg) > OFF_EPS;
/** The median working set at the working load (unrated = RIR 2), as LT-2's anchor. */
function anchor(h: ExerciseSessionSummary): { R: number; rirObs: number } {
  const at = h.sets.filter(x => x.kg === h.workKg && !h.held.includes(x));
  const pool = (at.some(x => x.kind !== 'drop') ? at.filter(x => x.kind !== 'drop') : at).slice().sort((a, b) => (a.reps ?? 0) - (b.reps ?? 0));
  const mid = pool[Math.floor((pool.length - 1) / 2)];
  return { R: mid?.reps ?? h.workReps, rirObs: RIR_BY_EFFORT[mid?.effort ?? 'ideal'] };
}

/**
 * LT-3 (§4 "Next session", option a, D-A4): the last session was lifted off its planned load, so its load is not the
 * base. The target is restated on the rung nearest the planned load whose re-solved reps fall inside `[lo, hi]`
 * (32 × 5 at max against a 27.5 plan → 27.5 kg for 8 to 9). A load chosen in the last two sessions becomes the base
 * (null here) only when its own re-solved reps fall inside the window; otherwise the plan holds and the reason says so.
 * Null when there is nothing to restate: no stored target (older sessions), or the load matched the plan.
 */
export function restateOffPlan(hist: ExerciseSessionSummary[], range: [number, number], rir: number, rungsKg: number[] = []): Restated | null {
  const last = hist[hist.length - 1];
  if (!last || !off(last)) return null;
  const t = last.target!;
  const [lo, hi] = range;
  const { R, rirObs } = anchor(last);
  const at = (kg: number) => repsAt(last.workKg, R, rirObs, kg, rir);
  const prev = hist[hist.length - 2];
  const twice = !!prev && off(prev) && Math.abs(prev.workKg - last.workKg) <= OFF_EPS;
  const own = Math.floor(at(last.workKg) + REP_EPS);
  if (twice && own >= lo && own <= hi) return null;
  const inside = (kg: number) => { const f = Math.floor(at(kg) + REP_EPS); return f >= lo && f <= hi; };
  const kg = [t.kg, ...rungsKg.filter(x => x > 0)].sort((a, b) => Math.abs(a - t.kg) - Math.abs(b - t.kg) || a - b).find(inside);
  if (kg == null) return null;
  const r = at(kg);
  const f = Math.floor(r + REP_EPS);
  // As LT-2's window: within a quarter rep above a whole number, one number.
  const b = Math.max(f, Math.min(hi, r - f < 0.25 ? f : Math.ceil(r - REP_EPS)));
  const repWindow: [number, number] = [Math.max(lo, f), b];
  const label = repWindow[0] === repWindow[1] ? `${repWindow[0]}` : `${repWindow[0]} to ${repWindow[1]}`;
  const reason = twice
    ? `${last.workKg} kg twice now, but it is good for about ${Math.max(0, own)} reps, outside your ${lo}–${hi} range. The plan stays: ${kg} kg for ${label}.`
    : `Last time was ${last.workKg} kg against a ${t.kg} kg plan. Back on the plan: ${kg} kg for ${label}.`;
  return { kg, repWindow, reason };
}

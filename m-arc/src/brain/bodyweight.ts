/**
 * F13: body weight as load for bodyweight and assisted moves (docs/F13-BODYWEIGHT-LOAD.md).
 * Read-time only: stored sets keep the added kg (bodyweight) or the help (assisted).
 * Progression, records, trends and plate maths never import this file.
 */
import type { AppState, Exercise, LoadUnit, LoggedSet, ResistanceMode, WeightEntry } from '@/core/models';
import { daysBetween } from '@/core/dates';
import { formatLoad, formatSetLoad, kgToDisplay } from '@/core/units';
import { isWorkingSet } from './exposure';
import type { ExerciseSessionSummary } from './history';

/** Body weight in kg on a day, or null. */
export type BodyWeightAt = (day: string) => number | null;

/** Share of body weight moved per rep, by library id. Sources: docs/F13-BODYWEIGHT-LOAD.md §2 R2. */
export const BODYWEIGHT_SHARE: Readonly<Record<string, number>> = {
  lib_push_up: 0.64, lib_diamond_push_up: 0.64, lib_incline_push_up: 0.5, lib_pike_push_up: 0.6, lib_bench_dip: 0.7,
  lib_pull_up: 1, lib_chin_up: 1, lib_assisted_pull_up: 1, lib_inverted_row: 0.65,
  lib_bodyweight_squat: 0.88, lib_bodyweight_lunge: 0.88, lib_bodyweight_split_squat: 0.88, lib_pistol_squat: 0.94,
  lib_bodyweight_calf_raise: 0.97,
};

/** The share for a library bodyweight/assisted move; null for everything else (custom, core, other modes). */
export function bodyweightShare(ex: Exercise | undefined): number | null {
  if (!ex || ex.custom || (ex.mode !== 'bodyweight' && ex.mode !== 'assisted')) return null;
  return BODYWEIGHT_SHARE[ex.id] ?? null;
}

const DAY = /^\d{4}-\d{2}-\d{2}$/;
/** A usable body weight: the 30–300 kg bound Escobar already enforces (escobar/tools/actions.ts:219). Outside it = missing (R3). */
export const BODY_WEIGHT_RANGE_KG: readonly [number, number] = [30, 300];
const validKg = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= BODY_WEIGHT_RANGE_KG[0] && v <= BODY_WEIGHT_RANGE_KG[1];
const validEntry = (w: WeightEntry | null | undefined): w is WeightEntry => !!w && typeof w.day === 'string' && DAY.test(w.day) && validKg(w.kg);

/** The weigh-in nearest `day` (tie: the earlier one); none: `fallbackKg`; none: null. Never assumes the log is sorted. */
export function bodyWeightOn(day: string, log: WeightEntry[], fallbackKg?: number): number | null {
  let best: WeightEntry | null = null;
  let bestGap = Infinity;
  for (const w of log) {
    if (!validEntry(w)) continue;
    const gap = Math.abs(daysBetween(w.day, day));
    if (gap < bestGap || (gap === bestGap && best != null && w.day < best.day)) { best = w; bestGap = gap; }
  }
  if (best) return best.kg;
  return validKg(fallbackKg) ? fallbackKg : null;
}

/** undefined when there is no weigh-in and no profile weight: every caller then behaves exactly as before F13. */
export function bodyWeightResolver(s: Pick<AppState, 'weightLog' | 'profile'>): BodyWeightAt | undefined {
  const log = s.weightLog ?? [];
  const fallback = s.profile?.bodyWeightKg;
  if (!log.some(validEntry) && !validKg(fallback)) return undefined;
  const memo = new Map<string, number | null>();
  return day => {
    if (!memo.has(day)) memo.set(day, bodyWeightOn(day, log, fallback));
    return memo.get(day)!;
  };
}

/** THE rule (F13 R1). null = no share or no body weight: the caller keeps its pre-F13 rule. */
export function effectiveLoadKg(addedKg: number | undefined, mode: ResistanceMode, share: number | null, bwKg: number | null): number | null {
  if (share == null || bwKg == null || !(bwKg > 0)) return null;
  const extra = Math.max(0, addedKg ?? 0);
  if (mode === 'bodyweight') return bwKg * share + extra;
  if (mode === 'assisted') return Math.max(0, bwKg * share - extra);
  return null;
}

/** Heaviest effective load among working sets, and the most reps done at it (as history.ts:32-34 does for topKg/topReps). null when effectiveLoadKg is null. */
export function topEffective(sets: LoggedSet[], mode: ResistanceMode, share: number | null, bwKg: number | null): { kg: number; reps: number } | null {
  let top: { kg: number; reps: number } | null = null;
  for (const s of sets) {
    if (!isWorkingSet(s)) continue;
    const v = effectiveLoadKg(s.kg, mode, share, bwKg);
    if (v == null) continue;
    const reps = s.reps ?? 0;
    if (!top || v > top.kg) top = { kg: v, reps };
    else if (v === top.kg && reps > top.reps) top = { kg: v, reps };
  }
  return top;
}

/** "≈ 51 kg": whole units, because the share is an estimate (R6). */
export const approxLoadText = (kg: number, unit: LoadUnit): string => `≈ ${Math.round(kgToDisplay(kg, unit))} ${unit}`;

/** A set's load by mode: "BW", "BW+10 kg", "20 kg assist". Other modes: exactly formatSetLoad (unchanged text). */
export function modeLoadText(set: Pick<LoggedSet, 'kg' | 'entered'>, mode: ResistanceMode, unit: LoadUnit): string {
  const loaded = (set.kg ?? 0) > 0;
  if (mode === 'bodyweight') return loaded ? `BW+${formatSetLoad(set, unit)}` : 'BW';
  if (mode === 'assisted') return loaded ? `${formatSetLoad(set, unit)} assist` : 'BW';
  return formatSetLoad(set, unit);
}

/**
 * Stats "last top load" and "reps at top", taken from the same set. For assisted work the heaviest
 * effective set is the one with the LEAST help, while topKg/topReps describe the MOST help, so the
 * reps must come from here too. Weighted and other modes: formatLoad(topKg) and topReps, unchanged.
 * An effective top of 0 (help >= body weight) falls back to today's text.
 */
/** UI-11: a carry/sled logged by distance or time, not reps (a loaded carry, e.g. burpees, still
 * logs reps and keeps the ordinary load/reps stat). */
function isTimedOrDistanceCarry(mode: ResistanceMode, bestDistanceM: number, bestDurationSec: number, bestReps: number): boolean {
  return mode === 'conditioning' && bestReps === 0 && (bestDistanceM > 0 || bestDurationSec > 0);
}

export function lastTopStats(h: Pick<ExerciseSessionSummary, 'day' | 'sets' | 'topKg' | 'topReps' | 'bestDurationSec' | 'bestDistanceM' | 'bestReps'>, ex: Exercise | undefined, bw: BodyWeightAt | undefined, unit: LoadUnit): { load: string; reps: number } {
  const mode = ex?.mode ?? 'weighted';
  // UI-11: a hold has no load or reps; its own stat is the longest time held that session.
  if (mode === 'duration') return { load: `${h.bestDurationSec}s`, reps: 0 };
  // UI-11: a carry/sled logged by distance or time has no reps either; distance wins when both are logged.
  if (isTimedOrDistanceCarry(mode, h.bestDistanceM, h.bestDurationSec, h.bestReps)) {
    return { load: h.bestDistanceM > 0 ? `${h.bestDistanceM} m` : `${h.bestDurationSec}s`, reps: 0 };
  }
  if (mode !== 'bodyweight' && mode !== 'assisted') return { load: formatLoad(h.topKg, unit), reps: h.topReps };
  const top = topEffective(h.sets, mode, bodyweightShare(ex), bw?.(h.day) ?? null);
  return top && top.kg > 0 ? { load: approxLoadText(top.kg, unit), reps: top.reps } : { load: modeLoadText({ kg: h.topKg }, mode, unit), reps: h.topReps };
}

/** UI-11: whether the Stats "reps at top" tile (and the sparkline readout's "× reps") applies —
 * false for a hold (no reps at all) and for a carry/sled once it has a distance or time logged
 * instead of reps (a rep-based conditioning move, e.g. burpees, keeps the reps tile). */
export function statHasReps(mode: ResistanceMode, bestDistanceM: number, bestDurationSec = 0, bestReps = 0): boolean {
  return mode !== 'duration' && !isTimedOrDistanceCarry(mode, bestDistanceM, bestDurationSec, bestReps);
}

/** UI-11: the sparkline's scrub readout — a hold or a distance/time-logged carry shows only its
 * own number ("45s", "40 m"), everything else keeps the "<load> × <reps>" form. */
export function statReadout(stats: { load: string; reps: number }, mode: ResistanceMode, bestDistanceM: number, bestDurationSec = 0, bestReps = 0): string {
  return statHasReps(mode, bestDistanceM, bestDurationSec, bestReps) ? `${stats.load} × ${stats.reps}` : stats.load;
}

/** UI-11: the Stats "last top load" tile's label, picked by what that mode's value actually is. */
export function statLoadLabel(mode: ResistanceMode, bestDistanceM: number, bestDurationSec = 0, bestReps = 0): string {
  if (mode === 'duration') return 'longest hold';
  if (isTimedOrDistanceCarry(mode, bestDistanceM, bestDurationSec, bestReps)) return bestDistanceM > 0 ? 'farthest distance' : 'longest time';
  return 'last top load';
}

/** The kg column header / placeholder: "+kg" for bodyweight moves, else the unit. */
export const loadColumnLabel = (mode: ResistanceMode, unit: LoadUnit): string => (mode === 'bodyweight' ? `+${unit}` : unit);

/** WeightInput aria-label; "Load in kg" (today's text) for every other mode. */
export const loadAriaLabel = (mode: ResistanceMode, unit: LoadUnit): string =>
  mode === 'bodyweight' ? `Added load in ${unit}` : mode === 'assisted' ? `Assistance in ${unit}` : `Load in ${unit}`;

// COPY-1: data only (the counted load or its absence), no instructions.
export const NO_BODY_WEIGHT_HINT = 'Body weight not set';

/** The one Train line for a move with a share; null for moves without one. */
export function bodyweightHint(ex: Exercise | undefined, bwKg: number | null, unit: LoadUnit): string | null {
  const share = bodyweightShare(ex);
  if (share == null || !ex) return null;
  const base = effectiveLoadKg(undefined, ex.mode, share, bwKg);
  if (base == null) return NO_BODY_WEIGHT_HINT;
  return `Body-weight load ${approxLoadText(base, unit)}`;
}

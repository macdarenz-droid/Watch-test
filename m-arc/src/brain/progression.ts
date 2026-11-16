/**
 * What to do next session for one exercise. Every answer has a plain-words
 * reason. The rules, in order:
 *  1. Nothing logged yet            → start light.
 *  2. 14+ days away                 → return at the last load, no increase;
 *     beyond 8 weeks, 10% lighter (ADAPT-3, A-4).
 *  3. Two sessions in a row under the range at max effort, or with the last set
 *     unrated (ADAPT-3, A-9) → take one step down.
 *  4. Effort missing on most sets and the reps don't tell (ADAPT-3, A-1)
 *                                    → repeat and log effort before changing.
 *  5. Top of the range, no max effort, twice in a row → add one step.
 *  6. Top of the range once          → confirm it once more.
 *  7. Trend clearly down             → keep the load, easier week, then rebuild.
 *  8. Otherwise                      → add a rep.
 */
import type { Deload, EquipmentProfile, Exercise, LoadUnit, LoggedSet, ResistanceMode, Session } from '@/core/models';
import { loadableNear, loadableTopKg, loadableValues, type Loadable, type LoadMenu } from './units';
import { chooseRung, rirMid, type RungChoice, type RungInput, type RungMenu } from './retarget';
import { E1RM_MAX_REPS, effectiveOneRm, RIR_BY_EFFORT } from './e1rm';
import { KG_PER_LB, kgToDisplay } from '@/core/units';
import { GOAL_BY_ID, type GoalId } from '@/data/goals';
import { CARRY_OR_SLED_IDS, findExercise, startingLoadKg } from '@/core/exercises';
import { daysSinceLast, exerciseHistory, modeOf, restateOffPlan, type ExerciseSessionSummary } from './history';
import { carryOverStart } from './substitute';
import { plateauStatus } from './trend';
import { inLighterWeek, lighterWeekDay } from './deload';

export { inLighterWeek };

export type Mode = 'start' | 'reentry' | 'confirm_effort' | 'reduce' | 'increase' | 'confirm' | 'reps' | 'hold' | 'duration' | 'distance' | 'plateau' | 'deload' | 'earn';

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
  /** With an equipment profile (§25.4): the target in the equipment's own unit, e.g. 55 lb. */
  unit?: LoadUnit;
  value?: number;
  /** BUG-11: the kg before the equipment snap, set only when the snap moved the headline load. */
  snappedFromKg?: number;
  /** BUG-15: `sets` is a deliberate cut (lighter week or red readiness), so Train sets the planned rows past it aside. */
  cutSets?: true;
  /** BUG-15 (COACHRULES-F7): a lighter week, an amber or red day or a cut factor; live advice never adds load. */
  holdLoad?: true;
  /** LT-2: the reps re-solved for the chosen rung; for mode `earn` it may sit above the goal's range. */
  repWindow?: [number, number];
  /** LT-2: how sure the coach is of the gym's load menu (LT-1's loadMenu), when the caller passed one. */
  menuConfidence?: LoadMenu['confidence'];
  /** ADAPT-3 (A-4): a return after a long break cut the load, so the equipment snap goes down, never back up. */
  returnCut?: true;
}

const BACK_REASON = 'The lighter week is over. This is your level from before it.';

/** More than this many days away (14 or more): repeat the last load once, no increase (ADAPT-3, A-4). */
export const REENTRY_DAYS = 13;
/** ADAPT-3 (A-4): more than this many days away (8 weeks) returns lighter. */
export const RETURN_CUT_DAYS = 56;
/** ADAPT-3 (A-4): the return cut beyond 8 weeks, a design value inside the 70-100% bound (COACHING-DECISIONS.md). */
export const RETURN_CUT = 0.1;
/** Primary-muscle recovery under this % holds the load. */
export const RECOVERY_HOLD_PCT = 60;
/** A load step never adds more than this share of the current load (from 10 kg up). */
export const MAX_INCREASE_SHARE = 0.1;

export function loadStep(kg: number): number {
  if (kg <= 10) return 1;
  if (kg <= 30) return 2;
  return 2.5;
}

const half = (v: number) => Math.round(v * 2) / 2;

export function repRange(exercise: Exercise | undefined, goal: GoalId): [number, number] {
  const g = GOAL_BY_ID[goal];
  return exercise?.role === 'main' ? g.mainReps : g.accessoryReps;
}

/** True when the max-effort e1RM dropped 5% or more from the prior session at max effort too. */
function e1rmDownAtMax(cur: ExerciseSessionSummary, prior: ExerciseSessionSummary): boolean {
  return cur.hasMax && prior.hasMax && prior.bestE1rm > 0 && cur.bestE1rm > 0 && cur.bestE1rm <= prior.bestE1rm * 0.95;
}

/** ADAPT-3: the straight working sets in logged order, held ones left out. */
function straightSets(r: ExerciseSessionSummary): LoggedSet[] {
  return r.sets.filter(x => !r.held.includes(x) && (x.kg ?? 0) === r.workKg && (x.reps ?? 0) > 0);
}

/** ADAPT-3 (A-1): at most one rep lost from the first straight set to the last. */
function flatReps(r: ExerciseSessionSummary): boolean {
  const w = straightSets(r);
  return w.length > 0 && (w[0]!.reps ?? 0) - (w[w.length - 1]!.reps ?? 0) <= 1;
}

/**
 * ADAPT-3 (A-1, E-8): every straight set at or above the range top with flat reps and no max
 * effort, on the last two sessions at one load. The reps alone then earn one step, so missing
 * effort ratings need not hold the load, and the coach's "rate your sets" note leaves the lift out.
 */
export function repsEarnIncrease(hist: ExerciseSessionSummary[], range: [number, number]): boolean {
  const last = hist[hist.length - 1];
  const prev = hist[hist.length - 2];
  const top = (r: ExerciseSessionSummary) => r.workMinReps >= range[1] && !r.hasMax && flatReps(r);
  return !!last && !!prev && last.workKg > 0 && prev.workKg === last.workKg && top(last) && top(prev);
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

export interface ProgressionContext {
  /** From brain/readiness.ts's readiness(). Red skips increases and drops a set; amber only blocks the increase. */
  readiness?: { loadAdvice: 'normal' | 'no_increase' | 'reduce'; reason?: string } | null;
  /** From brain/recovery.ts's recoveryStatus() for the exercise's primary muscle, 0-100. */
  recoveryPct?: number;
  /** Active lighter week (F3.3). Takes priority over readiness and recovery: it's a whole-week call, not a single day's. */
  deload?: Deload | null;
  /**
   * BUG-15: the saved lighter week, active or ended (`AppState.deload`). Its sessions never become
   * the base for later targets, and the first session after it holds the pre-week level.
   */
  lastDeload?: Deload | null;
  /** What the equipment really loads (§25.4). Targets snap to it: up for increases, down for reductions and deloads. */
  equipment?: EquipmentProfile;
  /** Today's load change from an applied Escobar adjustment (§10.4), applied like a deload's loadFactor. */
  loadFactor?: number;
  /** LT-2: the gym's load menu (LT-1's loadMenu). Without it, increases and step-downs choose from `equipment`'s loads. */
  menu?: LoadMenu;
  /** LT-6 (§5): the exerciseId this slot was substituted from (`ActiveSession.entries[].plannedId`), when it differs from `exerciseId`. */
  replacedExerciseId?: string;
}

/**
 * LT-2: what suggestRaw knew when it chose an increase or a step-down, for the rung choice once the menu is known.
 * Kept beside the suggestion, not on it, so no caller ever sees it.
 */
type RungSeed = Pick<RungInput, 'topKg' | 'R' | 'rirObs' | 'rawKg' | 'role' | 'direction' | 'priorPlannedKg'>;
const SEEDS = new WeakMap<Suggestion, RungSeed>();
/** AUD-8 (SCI-08): a carry-over start already placed on the menu's rungs, which the profile snap would undo. */
const ON_MENU = new WeakSet<Suggestion>();

/** LT-2 (§3): the anchor is the median working set at the working load, not the single best one; unrated = RIR 2. */
function anchorOf(last: ExerciseSessionSummary): { R: number; rirObs: number } {
  const at = last.sets.filter(x => x.kg === last.workKg && !last.held.includes(x));
  const pool = (at.some(x => x.kind !== 'drop') ? at.filter(x => x.kind !== 'drop') : at).slice().sort((a, b) => (a.reps ?? 0) - (b.reps ?? 0));
  const mid = pool[Math.floor((pool.length - 1) / 2)];
  return { R: mid?.reps ?? last.workReps, rirObs: RIR_BY_EFFORT[mid?.effort ?? 'ideal'] };
}

/** The menu from a bare equipment profile: its own loads, nothing learned. */
function menuFromProfile(profile: EquipmentProfile): RungMenu {
  const f = profile.unit === 'lb' ? KG_PER_LB : 1;
  return { profile, unit: profile.unit, rungsKg: loadableValues(profile).map(v => Math.round(v * f * 1000) / 1000) };
}

const fmtWindow = (w: [number, number]): string => (w[0] === w[1] ? `${w[0]} reps` : fmtRange(w));

/**
 * LT-2: restates an increase or a step-down on the rung chooseRung picks, with the reps re-solved for it.
 * A rung keeps the mode; an earn keeps the load with mode `earn`; a lever keeps the load and plans one more set.
 */
function applyRung(s: Suggestion, seed: RungSeed, menu: RungMenu, goal: GoalId, confidence: LoadMenu['confidence'] | undefined, logged: LoggedLoad[]): Suggestion {
  const c: RungChoice = chooseRung({ ...seed, menu, goal });
  const unit = menu.unit;
  const valueOf = (kg: number) => loggedAt(kg, logged)?.value ?? kgToDisplay(kg, unit);
  const count = s.sets.length;
  const conf = confidence ? { menuConfidence: confidence } : {};
  const base = { ...s, unit, repWindow: c.repWindow, ...conf };
  if (c.kind === 'earn' || c.kind === 'lever') {
    const kg = seed.topKg;
    const n = c.repWindow[0];
    const earn = c.kind === 'earn';
    return {
      ...base, mode: earn ? 'earn' : 'hold', kg, value: valueOf(kg), reps: [n, n], target: `${valueOf(kg)} ${unit} · ${n} reps`, reason: c.text,
      sets: setPlan(count + (c.extraSet ? 1 : 0), kg, n, null, earn ? 'Earn the next weight' : 'Add a set'),
    };
  }
  const moved = Math.abs(c.kg - (s.kg ?? c.kg)) > 0.011;
  return {
    ...base, kg: c.kg, value: valueOf(c.kg), reps: c.repWindow, target: `${valueOf(c.kg)} ${unit} · ${fmtWindow(c.repWindow)}`,
    reason: c.text ? `${s.reason} ${c.text}` : s.reason,
    sets: setPlan(count, c.kg, c.setReps ?? c.repWindow[0], null, s.sets[0]?.note ?? ''),
    ...(moved && s.kg != null ? { snappedFromKg: s.kg } : {}),
  };
}

const SNAP_DIRECTION: Partial<Record<Mode, 'up' | 'down'>> = { increase: 'up', reduce: 'down', deload: 'down' };

/** A load the user already logged for this exercise, in canonical kg and as entered. */
interface LoggedLoad { kg: number; value: number; unit: LoadUnit }

/**
 * BUG-11: the loads the user really lifted on this exercise, in the profile's unit. A 7 kg
 * dumbbell the user logged exists in their gym even when the built-in ladder (2, 4, 6, 8, 10,
 * 12.5 …) has no 7, so a hold at 7 must not be snapped to 6. Only loads entered in the
 * profile's own unit count: a kg entry says nothing about an lb rack. BUG-24: a set BUG-18 holds
 * as implausible was not really lifted (yet), so its load is not one the gym has.
 */
function loggedLoads(sessions: Session[], exerciseId: string, custom: Exercise[], unit: LoadUnit): LoggedLoad[] {
  const out: LoggedLoad[] = [];
  for (const h of exerciseHistory(sessions, exerciseId, custom)) {
    for (const x of h.sets) {
      if (!(x.kg != null && x.kg > 0) || h.held.includes(x)) continue;
      const u = x.entered?.unit ?? 'kg';
      if (u !== unit) continue;
      out.push({ kg: x.kg, value: x.entered?.value ?? kgToDisplay(x.kg, unit), unit });
    }
  }
  return out;
}

const loggedAt = (kg: number, logged: LoggedLoad[]): LoggedLoad | undefined => logged.find(l => Math.abs(l.kg - kg) <= 0.011);

/**
 * Restates a suggestion's loads as loads the equipment can make, in its own unit.
 * QA3-11b: `force` overrides the mode-based direction. A carry/sled (mode 'distance'/'duration')
 * has no direction of its own in SNAP_DIRECTION, so without a genuine reduction in effect it snaps
 * 'nearest' like anything else - blanket 'down' rounded a normal-week 32 kg carry down to 30 for no
 * reason, and swallowed an Escobar increase entirely.
 */
function snapToEquipment(s: Suggestion, profile: EquipmentProfile, conditioning = false, force?: 'up' | 'down', scaled = false, logged: LoggedLoad[] = []): Suggestion {
  if (s.kg == null) return s;
  // QA3-3: a conditioning load above the ladder's range keeps the logged weight. A heavier
  // trap-bar carry must not be capped down to the dumbbell rack's top just because the equipment
  // field groups them together.
  // QA3-3b: still restated in the profile's own unit, or an lb user sees a rounded-kg conversion
  // (225 lb read back as "224.9 lb") instead of their own clean number.
  if (conditioning && s.kg > loadableTopKg(profile) + 0.01) {
    // QA3-3c: a lighter week or an Escobar factor already rounded the kg to the nearest half kg,
    // which does not land on a clean lb number. Re-snap to a virtual 5 lb ladder instead of just
    // converting that half-kg value.
    if (scaled && profile.unit === 'lb') {
      const p = loadableNear(s.kg, { unit: 'lb', step: 5, source: 'default', updatedAt: '' }, force ?? 'nearest');
      const oldLabel = `${s.kg} kg`;
      return { ...s, kg: p.kg, unit: p.unit, value: p.value, target: s.target.replace(oldLabel, `${p.value} lb`), sets: s.sets.map(x => (x.kg == null ? x : { ...x, kg: p.kg })) };
    }
    const value = kgToDisplay(s.kg, profile.unit);
    const oldLabel = `${s.kg} kg`;
    return { ...s, unit: profile.unit, value, target: s.target.includes(oldLabel) ? s.target.replace(oldLabel, `${value} ${profile.unit}`) : s.target };
  }
  const dir = force ?? SNAP_DIRECTION[s.mode] ?? 'nearest';
  // BUG-11: with no direction of its own (hold, confirm, plateau, re-entry…), a load already
  // logged for this exercise is loadable as it is. Increases, reductions and deloads still snap.
  const keep = (kg: number): Loadable | undefined => {
    const l = dir === 'nearest' ? loggedAt(kg, logged) : undefined;
    return l && { kg: l.kg, value: l.value, unit: l.unit };
  };
  // BUG-11: a hold-type target exactly between two rungs goes to the heavier one (the load the
  // person is working at, not a step back); a first-time start keeps the plain nearest rung.
  const near = (kg: number): Loadable => {
    if (dir !== 'nearest' || s.mode === 'start') return loadableNear(kg, profile, dir);
    const down = loadableNear(kg, profile, 'down');
    const up = loadableNear(kg, profile, 'up');
    return Math.abs(up.kg - kg) <= Math.abs(kg - down.kg) + 1e-6 ? up : down;
  };
  const snap = keep(s.kg) ?? near(s.kg);
  const oldLabel = `${s.kg} kg`;
  const moved = Math.abs(snap.kg - s.kg) > 0.011;
  // BUG-11: say when the snap moved a load with no direction of its own, so the reps are read
  // against the new load and the coach can name the equipment, not recovery, as the reason.
  const flag = moved && dir === 'nearest' ? ` Moved to ${snap.value} ${snap.unit}, the nearest weight your equipment has, so the reps may need to change.` : '';
  return {
    ...s,
    kg: snap.kg,
    unit: snap.unit,
    value: snap.value,
    target: s.target.includes(oldLabel) ? s.target.replace(oldLabel, `${snap.value} ${snap.unit}`) : s.target,
    reason: s.reason + flag,
    sets: s.sets.map(x => (x.kg == null ? x : { ...x, kg: (keep(x.kg) ?? near(x.kg)).kg })),
    ...(moved ? { snappedFromKg: s.kg } : {}),
  };
}

/** Scales a suggestion's loads by today's adjustment factor (§10.4), rounding down like a deload. */
function applyLoadFactor(s: Suggestion, f: number): Suggestion {
  if (s.kg == null || !(f > 0) || f === 1) return s;
  const down = half(s.kg * f);
  const oldLabel = `${s.kg} kg`;
  return { ...s, kg: down, target: s.target.replace(oldLabel, `${down} kg`), reason: `${s.reason} Adjusted for today.`, sets: s.sets.map(x => (x.kg == null ? x : { ...x, kg: half(x.kg * f) })) };
}

export function suggestNext(sessions: Session[], exerciseId: string, goal: GoalId, today: string, plannedSets = 3, custom: Exercise[] = [], ctx?: ProgressionContext): Suggestion {
  let s = suggestRaw(sessions, exerciseId, goal, today, plannedSets, custom, ctx);
  const rawKg = ON_MENU.has(s) ? s.kg : undefined;
  // BUG-15 (COACHRULES-F7): plan 6.13, never an increase on a back-off day.
  const cutFactor = ctx?.loadFactor != null && ctx.loadFactor > 0 && ctx.loadFactor < 1;
  if (ctx?.deload || (ctx?.readiness && ctx.readiness.loadAdvice !== 'normal') || cutFactor) s = { ...s, holdLoad: true };
  if (ctx?.loadFactor != null) s = applyLoadFactor(s, ctx.loadFactor);
  // QA2-FE-2, QA2-FE-7: a loaded carry's target snaps to the gym's equipment too (70 lb, not 31.751 kg).
  const mode = modeOf(exerciseId, custom);
  if (ctx?.equipment && !(rawKg != null && s.kg === rawKg) && (mode === 'weighted' || (mode === 'conditioning' && s.kg != null))) {
    // QA3-11b: force the snap down only for a genuine reduction (a lighter week, or an Escobar
    // cut factor below 1) - never up, and never at all in a normal week.
    const force = ctx.deload || (ctx.loadFactor != null && ctx.loadFactor > 0 && ctx.loadFactor < 1) || s.returnCut ? 'down' : undefined;
    // QA3-3c: a lighter week or any Escobar load factor scales the kg with half(), losing the
    // precision an above-the-rack lb restatement needs to land on a clean number.
    const scaled = !!ctx.deload || (ctx.loadFactor != null && ctx.loadFactor > 0 && ctx.loadFactor !== 1);
    // BUG-11: a lift or a loaded carry keeps the loads already logged for it.
    const logged = loggedLoads(sessions, exerciseId, custom, ctx.menu?.unit ?? ctx.equipment.unit);
    // LT-2: an increase or a step-down on a lift picks its rung from the menu, unless today's load is scaled.
    const seed = SEEDS.get(s);
    const menu = ctx.menu ?? menuFromProfile(ctx.equipment);
    s = seed && mode === 'weighted' && !force && !scaled && menu.rungsKg.length
      ? applyRung(s, seed, menu, goal, ctx.menu?.confidence, logged)
      : snapToEquipment(s, ctx.equipment, mode === 'conditioning', force, scaled, logged);
  }
  return s;
}

/**
 * AUD-8 (SCI-08): the replaced lift's strength as an estimated max. A session whose sets all ran past
 * the e1RM rep limit is read at that limit, which understates it: a first substitute session errs light.
 */
function replacedE1rm(last: ExerciseSessionSummary): number {
  if (last.bestE1rm > 0) return last.bestE1rm;
  return effectiveOneRm(last.workKg, Math.min(last.workReps, E1RM_MAX_REPS), straightSets(last).at(-1)?.effort) ?? 0;
}

function suggestRaw(sessions: Session[], exerciseId: string, goal: GoalId, today: string, plannedSets = 3, custom: Exercise[] = [], ctx?: ProgressionContext): Suggestion {
  const meta = findExercise(exerciseId, custom);
  const mode: ResistanceMode = modeOf(exerciseId, custom);
  const range = repRange(meta, goal);
  // BUG-18: a session whose only sets are held as implausible has nothing to build a target on.
  const all = exerciseHistory(sessions, exerciseId, custom).filter(h => h.held.length < h.sets.length);
  // BUG-15 (PROGRESSION-F1/F5): lighter-week sessions are never the base or the evidence for a
  // target. Timed holds skip the lighter week (D-A1 point 1), so theirs are ordinary sessions.
  const week = ctx?.deload ?? ctx?.lastDeload ?? null;
  const outside = mode === 'duration' || !week ? all : all.filter(h => !inLighterWeek(h.day, week));
  // A lift first logged inside the week has nothing else to go on.
  const hist = outside.length ? outside : all;
  const last = hist[hist.length - 1];
  const setCount = last?.sets.length || plannedSets;
  // BUG-15: that lift's lighter-week session is already light, so the week repeats it, never cuts it again.
  const weekFactor = outside.length ? (ctx?.deload?.loadFactor ?? 1) : 1;
  const weekSets = outside.length ? (ctx?.deload?.setFactor ?? 1) : 1;
  // BUG-15 (A2): the first session after an ended lighter week, for a lift trained during it.
  const firstBack = !ctx?.deload && !!week && today > week.endDay && outside.length > 0 && outside.length < all.length && !all.some(h => h.day > week.endDay);

  if (!last) {
    // LT-6 (docs/LOAD-AWARE-TARGETS.md §5): a substitute with no history of its own carries over an
    // estimate from the lift it replaced, through a sourced pattern ratio, onto its own menu.
    if (mode === 'weighted' && meta && ctx?.replacedExerciseId && ctx.replacedExerciseId !== exerciseId) {
      const replacedMeta = findExercise(ctx.replacedExerciseId, custom);
      const replacedHist = exerciseHistory(sessions, ctx.replacedExerciseId, custom).filter(h => h.held.length < h.sets.length);
      const replacedLast = replacedHist[replacedHist.length - 1];
      const carryMenu = ctx.menu ?? (ctx.equipment ? { profile: ctx.equipment, rungsKg: menuFromProfile(ctx.equipment).rungsKg } : undefined);
      // AUD-8 (SCI-08): the ratio maps maxes, so the replaced lift gives its e1RM, not its working load.
      const co = replacedMeta && replacedLast && carryMenu ? carryOverStart(replacedMeta, meta, replacedE1rm(replacedLast), carryMenu, { reps: range[0], rir: rirMid(goal) }) : null;
      if (co) {
        const unit = carryMenu!.profile.unit;
        const value = kgToDisplay(co.kg, unit);
        const out: Suggestion = { mode: 'start', target: `${value} ${unit} · ${co.reps} reps`, kg: co.kg, unit, value, reps: [co.reps, co.reps], reason: `${co.text}.`, confidence: co.confidence, sets: setPlan(setCount, co.kg, co.reps, null, 'Start here') };
        ON_MENU.add(out);
        return out;
      }
    }
    const start = startingLoadKg(meta?.equipment ?? '');
    if (mode === 'duration') return { mode: 'start', target: 'Hold 20–30s', kg: null, reps: null, reason: 'First time. Hold for a comfortable 20 to 30 seconds and note how it felt.', confidence: 'low', sets: setPlan(setCount, null, null, 30, 'Start here') };
    if (mode === 'bodyweight' || start.kg == null) return { mode: 'start', target: `Start light · ${fmtRange(range)}`, kg: null, reps: range, reason: start.note, confidence: 'low', sets: setPlan(setCount, null, range[0], null, 'Start here') };
    return { mode: 'start', target: `${start.kg} kg · ${fmtRange(range)}`, kg: start.kg, reps: range, reason: start.note, confidence: 'low', sets: setPlan(setCount, start.kg, range[0], null, 'Start here') };
  }

  const conf = confidenceFrom(hist.length);
  // The time away counts every session, the lighter ones too.
  const gap = daysSinceLast(all, today) ?? 0;
  // AUD-8 (SCI-04): a red-readiness day cuts a set and adds nothing in every mode, as it does for a
  // lift. A long break and a lighter week come first, in the same order as the weighted path; timed
  // holds skip the lighter week (D-A1), so readiness still applies to them during it.
  const away = gap > REENTRY_DAYS;
  const reduceDay = ctx?.readiness?.loadAdvice === 'reduce' && !away && !(ctx?.deload && mode !== 'duration');
  const reduceReason = ctx?.readiness?.reason ?? 'Readiness is low today. Keep the load and drop a set.';
  const reduceSets = Math.max(1, setCount - 1);

  if (mode === 'duration') {
    const best = last.bestDurationSec || 20;
    // AUD-8 (SCI-04): a timed hold after a long break repeats its time too.
    if (away || reduceDay) {
      const reason = away ? `It has been ${gap} days. Repeat your last time once before adding anything.` : reduceReason;
      return { mode: 'duration', target: `Hold ${best}s`, kg: null, reps: null, reason, confidence: away ? 'low' : conf, sets: setPlan(reduceDay ? reduceSets : setCount, null, null, best, reduceDay ? 'Readiness: one fewer set' : 'Match it'), ...(reduceDay ? { cutSets: true as const } : {}) };
    }
    const next = last.hasMax ? best : best + 5;
    return { mode: 'duration', target: `Hold ${next}s`, kg: null, reps: null, reason: last.hasMax ? 'Last hold was max effort. Repeat it before adding time.' : 'Add five seconds to your best hold.', confidence: conf, sets: setPlan(setCount, null, null, next, last.hasMax ? 'Repeat' : 'Add 5s') };
  }

  // QA-R6-5: a carry or sled logged by distance or time progresses by distance or time, never "1 reps".
  // QA2-FE-8: only a carry or sled; a rep-based conditioning move (a burpee) logged with a time keeps its rep goal.
  // QA3-12: decided by which exercise this is (CARRY_OR_SLED_IDS), not by which fields were filled -
  // a timed carry or sled logged with reps too still gets its distance/time goal, never a rep one.
  // QA3-12b: CARRY_OR_SLED_IDS only lists three library ids. A custom conditioning exercise (no
  // library id to match) and other library conditioning moves logged by distance or time alone
  // (battle ropes, bear crawl, ...) still need a goal; they keep the original fields-based rule,
  // which already gives a rep goal only when reps were actually logged (QA2-FE-8).
  const carryOrSled = CARRY_OR_SLED_IDS.has(exerciseId) || (!!meta?.custom && mode === 'conditioning');
  // Part B (F13): a carry/sled or custom conditioning move logged as kg × reps shows its weight in the target too.
  const carryLoad = carryOrSled && last.workKg > 0;
  if (mode === 'conditioning' && (carryOrSled ? last.bestDistanceM > 0 || last.bestDurationSec > 0 : last.bestDistanceM > 0 || (last.bestDurationSec > 0 && !(last.bestReps > 0)))) {
    const byDistance = last.bestDistanceM > 0;
    const best = byDistance ? last.bestDistanceM : last.bestDurationSec;
    // QA3-3b: with an equipment profile to restate against later, keep the raw kg so an lb entry
    // (already stored to 3 decimals) round-trips to its own clean number instead of a half-kg one.
    const kg = last.workKg > 0 ? (ctx?.deload ? half(last.workKg * weekFactor) : ctx?.equipment ? last.workKg : half(last.workKg)) : null;
    const load = kg != null ? `${kg} kg · ` : '';
    const u = byDistance ? ' m' : 's';
    const step = byDistance ? (best >= 100 ? 10 : 5) : 5;
    const repeat = !!ctx?.deload || firstBack || gap > REENTRY_DAYS || last.hasMax || reduceDay;
    const next = repeat ? best : best + step;
    const reason = ctx?.deload ? 'Lighter week: the same distance at a lighter load, kept easy.'
      : gap > REENTRY_DAYS ? `It has been ${gap} days. Repeat your last ${byDistance ? 'distance' : 'time'} once before adding anything.`
      : reduceDay ? reduceReason
      : firstBack ? `${BACK_REASON} Match it before going ${byDistance ? 'further' : 'longer'}.`
      : last.hasMax ? `Last one was max effort. Match it before going ${byDistance ? 'further' : 'longer'}.`
      : byDistance ? `Go ${step} m further at the same load.` : 'Add five seconds at the same load.';
    const note = repeat ? (ctx?.deload ? 'Deload' : reduceDay ? 'Readiness: one fewer set' : 'Match it') : `+${step}${u}`;
    return { mode: byDistance ? 'distance' : 'duration', target: `${load}${next}${u}`, kg, reps: null, reason, confidence: gap > REENTRY_DAYS ? 'low' : conf, sets: setPlan(reduceDay ? reduceSets : setCount, kg, null, byDistance ? null : next, note), ...(reduceDay ? { cutSets: true as const } : {}) };
  }

  if (gap > REENTRY_DAYS) {
    // ADAPT-3 (A-4): beyond 8 weeks the return load is cut, bounded to 70-100% of the last working load.
    const cut = gap > RETURN_CUT_DAYS && last.workKg > 0 && (mode === 'weighted' || carryLoad);
    const kg = cut ? Math.max(half(last.workKg * 0.7), half(last.workKg * (1 - RETURN_CUT))) : last.workKg || null;
    const reason = cut ? `It has been ${gap} days. Start ${Math.round(RETURN_CUT * 100)}% lighter and build back up.` : `It has been ${gap} days. Repeat your last load once before adding anything.`;
    return { mode: 'reentry', target: mode === 'weighted' || carryLoad ? `${kg} kg · ${fmtRange(range)}` : `${fmtRange(range)}`, kg, reps: range, reason, confidence: 'low', sets: setPlan(setCount, kg, range[0], null, 'Return session'), ...(cut ? { returnCut: true as const } : {}) };
  }

  if (ctx?.deload) {
    const d = ctx.deload;
    const reason = `Lighter week, day ${lighterWeekDay(d, today)} of 7.`;
    // BUG-15 (A1): every day of the week cuts from the pre-week level, never from a lighter session.
    const deloadSets = Math.max(1, Math.round(setCount * weekSets));
    const cut = { cutSets: true as const };
    if (mode === 'bodyweight' || mode === 'assisted' || mode === 'conditioning') {
      const reps = last.bestReps;
      if (carryLoad) { const down = half(last.workKg * weekFactor); return { mode: 'deload', target: `${down} kg · ${reps} reps · easy`, kg: down, reps: [reps, reps], reason, confidence: conf, sets: setPlan(deloadSets, down, reps, null, 'Deload'), ...cut }; }
      return { mode: 'deload', target: `${reps} reps · easy`, kg: null, reps: [reps, reps], reason, confidence: conf, sets: setPlan(deloadSets, null, reps, null, 'Deload'), ...cut };
    }
    const down = half(last.workKg * weekFactor);
    return { mode: 'deload', target: `${down} kg · ${fmtRange(range)}`, kg: down, reps: range, reason, confidence: conf, sets: setPlan(deloadSets, down, range[0], null, 'Deload'), ...cut };
  }

  const recent = hist.slice(-3);
  const coverage = recent.reduce((a, r) => a + r.effortCoverage, 0) / recent.length;

  if (mode === 'bodyweight' || mode === 'assisted' || mode === 'conditioning') {
    const reps = last.bestReps;
    const match = last.hasMax || firstBack || reduceDay;
    const nextReps = match ? reps : reps + 1;
    const why = reduceDay ? reduceReason : firstBack ? `${BACK_REASON} Match it before adding a rep.` : last.hasMax ? 'Last set was max effort. Match it before adding a rep.' : 'Add one rep to your best set.';
    const n = reduceDay ? reduceSets : setCount;
    const note = reduceDay ? 'Readiness: one fewer set' : match ? 'Match it' : 'Add a rep';
    const cut = reduceDay ? { cutSets: true as const } : {};
    if (carryLoad) {
      const kg = ctx?.equipment ? last.workKg : half(last.workKg);
      return { mode: 'reps', target: `${kg} kg · ${nextReps} reps`, kg, reps: [nextReps, nextReps], reason: why, confidence: conf, sets: setPlan(n, kg, nextReps, null, note), ...cut };
    }
    return { mode: 'reps', target: `${nextReps} reps`, kg: null, reps: [nextReps, nextReps], reason: why, confidence: conf, sets: setPlan(n, null, nextReps, null, note), ...cut };
  }

  // BUG-18 (PROGRESSION-F3): targets build on the straight working sets, not one heavy single.
  const topKg = last.workKg;
  const holdSets = (note: string, reps = Math.min(range[1], Math.max(range[0], last.workReps + 1))) => setPlan(setCount, topKg, reps, null, note);
  const holdTarget = `${topKg} kg · ${fmtRange(range)}`;

  if (ctx?.readiness?.loadAdvice === 'reduce') {
    const fewer = Math.max(1, setCount - 1);
    return { mode: 'hold', target: holdTarget, kg: topKg, reps: range, reason: ctx.readiness.reason ?? 'Readiness is low today. Keep the load and drop a set.', confidence: conf, sets: setPlan(fewer, topKg, range[0], null, 'Readiness: one fewer set'), cutSets: true };
  }

  if (firstBack) {
    const reps = Math.min(range[1], Math.max(range[0], last.workReps));
    return { mode: 'hold', target: `${topKg} kg · ${reps} reps`, kg: topKg, reps: [reps, reps], reason: `${BACK_REASON} Match it before adding more.`, confidence: conf, sets: holdSets('Back to your level', reps) };
  }

  // LT-3 (§4 a, D-A4): a session lifted off its planned load is restated on the plan's line, not taken as the base.
  const restated = restateOffPlan(hist, range, rirMid(goal), ctx?.menu?.rungsKg ?? (ctx?.equipment ? menuFromProfile(ctx.equipment).rungsKg : []));
  // Fix round 1: a restatement up to the plan is an increase, so a hold day (amber, or the muscle under 60 %) skips it.
  const holdDay = ctx?.readiness?.loadAdvice === 'no_increase' || (ctx?.recoveryPct != null && ctx.recoveryPct < RECOVERY_HOLD_PCT);
  if (restated && !(holdDay && restated.kg > last.workKg)) {
    const w = restated.repWindow;
    return { mode: 'hold', target: `${restated.kg} kg · ${fmtWindow(w)}`, kg: restated.kg, reps: w, repWindow: w, reason: restated.reason, confidence: conf, sets: setPlan(setCount, restated.kg, w[0], null, 'Back on plan') };
  }

  const prev = hist[hist.length - 2];
  const prev2 = hist[hist.length - 3];
  // A range starting at 1-2 reps can never see "reps under the range" at max effort, so a
  // falling e1RM over two consecutive max-effort sessions is the step-down signal instead.
  // ADAPT-3 (A-9): under the range with the last set unrated counts too; an "easy" set never does.
  const lastSet = (r: ExerciseSessionSummary) => straightSets(r).at(-1);
  const belowRange = (r: ExerciseSessionSummary) => r.workReps < range[0]
    && (r.hasMax || (!lastSet(r)?.effort && !straightSets(r).some(x => x.effort === 'easy')));
  const stepDown = range[0] <= 2
    ? !!prev && !!prev2 && e1rmDownAtMax(last, prev) && e1rmDownAtMax(prev, prev2)
    : !!prev && belowRange(last) && belowRange(prev);
  // ADAPT-3 (A-9): runs before the effort gate, so a user who rates few sets still gets a lighter target.
  if (stepDown) {
    const down = Math.max(0, half(topKg - loadStep(topKg)));
    const reason = range[0] <= 2
      ? 'Your estimated one-rep max has dropped at max effort for two sessions running. Take one step down and rebuild.'
      : last.hasMax && prev?.hasMax
        ? 'Two sessions in a row under the rep range at max effort. Take one step down and rebuild reps.'
        : 'Two sessions in a row under the rep range. Take one step down and rebuild reps.';
    const out: Suggestion = { mode: 'reduce', target: `${down} kg · ${fmtRange(range)}`, kg: down, reps: range, reason, confidence: conf, sets: setPlan(setCount, down, range[0], null, 'Ease one step') };
    // LT-2 (§3 step 7): with a menu, the step is sized from performance and never under the load before the failed increase.
    let i = hist.length - 1;
    while (i >= 0 && hist[i]!.workKg === topKg) i--;
    const before = i >= 0 ? hist[i]!.workKg : 0;
    SEEDS.set(out, { topKg, ...anchorOf(last), rawKg: down, role: meta?.role ?? 'accessory', direction: 'down', ...(before > 0 && before < topKg ? { priorPlannedKg: before } : {}) });
    return out;
  }

  // ADAPT-3 (A-1): few ratings hold the load unless the reps alone earn the step.
  const lowCoverage = coverage < 0.5 && hist.length >= 2;
  if (lowCoverage && !repsEarnIncrease(hist, range)) {
    return { mode: 'confirm_effort', target: holdTarget, kg: topKg, reps: range, reason: 'Most recent sets have no effort rating. Keep the load and rate each set so the coach can judge the next step.', confidence: 'low', sets: holdSets('Log effort') };
  }

  // BUG-14: the one plateau rule (BR-04), over the eight weeks up to today.
  const plateau = plateauStatus(hist, 'weighted', today);
  if (plateau.status === 'declining' && plateau.confidence !== 'low') {
    return { mode: 'plateau', target: `${topKg} kg · ${range[0]}–${range[0] + 2} reps`, kg: topKg, reps: [range[0], range[0] + 2], reason: 'Progress has slipped over recent sessions. Keep this load, stop short of max effort for a week, then build back up.', confidence: plateau.confidence, sets: holdSets('Lighter week', range[0]) };
  }
  // BUG-18 (PROGRESSION-F23): every working set at the top of the range, not just the best one.
  // ADAPT-3 (A-1): an unrated session counts when its reps held flat.
  const cleanTop = (r: ExerciseSessionSummary) => r.workMinReps >= range[1] && !r.hasMax && (r.effortCoverage > 0 || flatReps(r));
  if (cleanTop(last)) {
    const twoForTwo = !!prev && cleanTop(prev) && prev.workKg === topKg;
    const fastTrack = last.allEasy && hist.length >= 4;
    const readinessBlocksIncrease = ctx?.readiness?.loadAdvice === 'no_increase' || (ctx?.recoveryPct != null && ctx.recoveryPct < RECOVERY_HOLD_PCT);
    if ((twoForTwo || fastTrack) && plateau.status !== 'declining' && !readinessBlocksIncrease) {
      const step = loadStep(topKg);
      const capped = topKg >= 10 ? Math.min(step, topKg * MAX_INCREASE_SHARE) : step;
      const up = half(topKg + Math.max(0.5, capped));
      const out: Suggestion = { mode: 'increase', target: `${up} kg · ${fmtRange(range)}`, kg: up, reps: range, reason: twoForTwo ? 'Top of the range two sessions running without max effort. Add one step.' : 'All sets felt easy at the top of the range. Add one step.', confidence: conf, sets: setPlan(setCount, up, range[0], null, 'Small load increase') };
      SEEDS.set(out, { topKg, ...anchorOf(last), rawKg: up, role: meta?.role ?? 'accessory' });
      return out;
    }
    if ((twoForTwo || fastTrack) && plateau.status !== 'declining' && readinessBlocksIncrease) {
      return { mode: 'confirm', target: holdTarget, kg: topKg, reps: [range[1], range[1]], reason: ctx?.readiness?.reason ?? (ctx?.recoveryPct != null && ctx.recoveryPct < RECOVERY_HOLD_PCT
        ? 'Recovery is under 60% for this muscle, so the load holds for now.'
        // BUG-16 (PROGRESSION-F12): amber readiness with the muscle recovered names readiness, not recovery.
        : 'Readiness is middling today, so the load holds for now.'), confidence: conf, sets: holdSets('Hold for now', range[1]) };
    }
    return { mode: 'confirm', target: holdTarget, kg: topKg, reps: [range[1], range[1]], reason: 'You reached the top of the range once. Do it again at this load and the next step unlocks.', confidence: conf, sets: holdSets('Confirm', range[1]) };
  }

  if (plateau.status === 'plateaued' && plateau.confidence !== 'low') {
    return { mode: 'plateau', target: holdTarget, kg: topKg, reps: range, reason: 'This lift has not moved for a while. Try a different rep range or one lighter week, then rebuild.', confidence: plateau.confidence, sets: holdSets('Change it up') };
  }

  const nextReps = Math.min(range[1], Math.max(range[0], last.workReps + 1));
  return { mode: 'hold', target: `${topKg} kg · ${nextReps} reps`, kg: topKg, reps: [nextReps, nextReps], reason: last.hasMax ? 'Last set was max effort. Keep the load and aim for one more clean rep.' : 'Keep the load and add a rep. Reps first, then load.', confidence: conf, sets: holdSets('Build reps', nextReps) };
}

/** The previous set at the same position, for the "last time" hint while logging. */
export function previousSet(sessions: Session[], exerciseId: string, setIndex: number, custom: Exercise[] = []): LoggedSet | null {
  const hist = exerciseHistory(sessions, exerciseId, custom);
  const last = hist[hist.length - 1];
  if (!last) return null;
  return last.sets[Math.min(setIndex, last.sets.length - 1)] ?? null;
}

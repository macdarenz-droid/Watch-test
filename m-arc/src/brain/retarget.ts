/**
 * LT-2 (docs/LOAD-AWARE-TARGETS.md §3, §5b): which rung of the gym's load menu to use next, and how many
 * reps it is good for. Pure: the rung is chosen from the menu, the reps are re-solved for that rung at the
 * same estimated strength and effort, and the goal sets the jump cap, the effort and the fallback.
 */
import type { Effort, EquipmentProfile, LoadUnit } from '@/core/models';
import { RIR_BY_EFFORT } from './e1rm';
import { kgToDisplay } from '@/core/units';
import { GOAL_BY_ID, type GoalId } from '@/data/goals';

/** The part of a LoadMenu (units.ts) the rung choice needs. */
export interface RungMenu {
  rungsKg: number[];
  unit: LoadUnit;
  profile?: EquipmentProfile;
}

export interface RungInput {
  /** The working load of the anchor session, in kg. */
  topKg: number;
  /** Reps of the anchor set (the median working set at topKg). */
  R: number;
  /** Reps in reserve of the anchor set (RIR_BY_EFFORT; 2 when unrated). */
  rirObs: number;
  /** The ideal next load before any snap (loadStep with the 10 % cap), or the step-down base with no menu. */
  rawKg: number;
  menu: RungMenu | null;
  goal: GoalId;
  role: 'main' | 'accessory';
  /** 'up' for an increase (default), 'down' for the step-down after two sessions under the range at max. */
  direction?: 'up' | 'down';
  /** Step-down only: the load planned before the failed increase; the step never goes under it. */
  priorPlannedKg?: number;
}

export interface RungChoice {
  kind: 'rung' | 'earn' | 'lever' | 'down';
  kg: number;
  repWindow: [number, number];
  /** The coach's line for this choice (§3 step 8); empty when there is no menu to choose from. */
  text: string;
  /** The rep label used in `text`, e.g. "about 8" or "6 to 7". */
  repsLabel?: string;
  /** The reps for each planned set: the centre of the window before an over-10-rep anchor widens it. */
  setReps?: number;
  /** A lever: keep the load and plan one more set. */
  extraSet?: true;
}

const EPS = 1e-6;
/** Rungs are stored to the gram (lb loads to 3 decimals), so a re-solved rep count is read to a hundredth. */
const REP_EPS = 0.01;
const KG_EPS = 0.011;
const CAP: Record<GoalId, number> = { strength: 0.1, strength_muscle: 0.125, lean: 0.15, growth: 0.2 };
/** How far past `hi` an earn target may go (§3 step 6). */
const EARN_ALLOWANCE: Record<GoalId, number> = { lean: 3, growth: 3, strength_muscle: 2, strength: 1 };

/** The largest jump a rung may be, as a share of the current load. */
export const jumpCap = (goal: GoalId): number => CAP[goal];
/** Acceptance and earn are checked one rep short of failure at least (growth too, never RIR 0). */
export const rirCheck = (goal: GoalId): number => Math.max(1, GOAL_BY_ID[goal].rir[0]);
/** The effort the shown window is solved at: the middle of the goal's RIR range (2 / 1 / 2 / 2). */
export const rirMid = (goal: GoalId): number => (GOAL_BY_ID[goal].rir[0] + GOAL_BY_ID[goal].rir[1]) / 2;
/** The fewest reps a rung may ask for on set 1: the range floor, and never under 3 for strength. */
export const repFloor = (goal: GoalId, lo: number): number => (goal === 'strength' ? Math.max(lo, 3) : lo);

/**
 * Reps at `loadKg` and `rir` for someone who did `R` reps at `topKg` with `rirObs` in reserve. The ratio form of
 * the Epley re-solve: the estimated max cancels, so sets over 10 reps may be used (D-A4 c) and no max is shown.
 */
export function repsAt(topKg: number, R: number, rirObs: number, loadKg: number, rir: number): number {
  return 30 * (topKg / loadKg) * (1 + (R + rirObs) / 30) - 30 - rir;
}

/** Reps at `topKg` that put `nextKg` on `lo` reps at `rirCheck`, at the same effort as the anchor. */
export function repsToEarn(topKg: number, _R: number, rirObs: number, nextKg: number, lo: number, check: number): number {
  return Math.ceil(30 * ((nextKg * (1 + (lo + check) / 30)) / topKg - 1) - rirObs - REP_EPS);
}

/** The nearest rung at or above (`up`) or at or below (`down`) `kg`, clamped to the menu's ends like loadableNear. */
function nearRung(kg: number, rungs: number[], dir: 'up' | 'down'): number {
  if (dir === 'up') return rungs.find(v => v >= kg - KG_EPS) ?? rungs[rungs.length - 1]!;
  return [...rungs].reverse().find(v => v <= kg + KG_EPS) ?? rungs[0]!;
}

const loadLabel = (kg: number, unit: LoadUnit): string => `${kgToDisplay(kg, unit)} ${unit}`;

/** The window shown for `kg`, and its words: "8", "6 to 7", or "about 9 to 10" from an anchor over 10 reps. */
function window(input: RungInput, kg: number, lo: number, hi: number): { repWindow: [number, number]; label: string; setReps: number } {
  const r = repsAt(input.topKg, input.R, input.rirObs, kg, rirMid(input.goal));
  const f = Math.floor(r + REP_EPS);
  // D-LT2: within a quarter rep above a whole number, the extra fraction is under the formula's error.
  const single = r - f < 0.25;
  const a = Math.min(hi, Math.max(lo, f));
  const b = Math.max(a, Math.min(hi, single ? f : Math.ceil(r - REP_EPS)));
  const about = input.R > 10;
  const label = `${about ? 'about ' : ''}${a === b ? a : `${a} to ${b}`}`;
  // §3 step 1: an anchor over 10 reps is rough (±15–20 %), so the window widens by a rep each way, inside [lo, hi].
  const repWindow: [number, number] = about ? [Math.max(lo, a - 1), Math.min(hi, b + 1)] : [a, b];
  return { repWindow, label, setReps: a };
}

/** The second lever per goal (§5b), as a noun ("…, or a harder variation") and as an action ("…, or try …"). */
function lever(input: RungInput): { noun: string; verb: string } {
  if (input.goal === 'strength') {
    return input.menu?.profile?.ladder?.length
      ? { noun: 'moving this lift to the barbell', verb: 'move this lift to the barbell' }
      : { noun: 'pause or tempo reps', verb: 'try pause or tempo reps' };
  }
  if (input.goal === 'strength_muscle') return { noun: 'pause reps', verb: 'try pause reps' };
  return { noun: 'a harder variation', verb: 'try a harder variation' };
}

export function chooseRung(input: RungInput): RungChoice {
  const g = GOAL_BY_ID[input.goal];
  const [lo, hi] = input.role === 'main' ? g.mainReps : g.accessoryReps;
  const rungs = input.menu?.rungsKg ?? [];
  const unit = input.menu?.unit ?? 'kg';
  const at = (kg: number) => loadLabel(kg, unit);
  const keepReps = Math.min(hi, Math.max(lo, input.R));
  // No menu: the raw load as today, the reps unchanged.
  if (!rungs.length) return { kind: input.direction === 'down' ? 'down' : 'rung', kg: input.rawKg, repWindow: [lo, hi], text: '' };

  if (input.direction === 'down') return stepDown(input, rungs, lo, hi, at);

  const floorReps = repFloor(input.goal, lo);
  const check = rirCheck(input.goal);
  const { noun, verb } = lever(input);
  // §3 step 3: nothing above the current load on this menu → a lever, never "earn" a rung that does not exist.
  const above = nearRung(input.topKg + 0.02, rungs, 'up');
  if (above <= input.topKg + KG_EPS) {
    return { kind: 'lever', kg: input.topKg, repWindow: [keepReps, keepReps], text: `Nothing heavier here: add a set, or ${noun}.`, extraSet: true };
  }
  const accepts = (kg: number) => (kg - input.topKg) / input.topKg <= jumpCap(input.goal) + EPS
    && Math.floor(repsAt(input.topKg, input.R, input.rirObs, kg, check) + REP_EPS) >= floorReps;
  const up = Math.max(above, nearRung(input.rawKg, rungs, 'up'));
  // A smaller real rung between the current load and the ideal step, tried when the ideal snap is too big.
  const down = nearRung(input.rawKg, rungs, 'down');
  const pick = accepts(up) ? up : down > input.topKg + KG_EPS && down < up && accepts(down) ? down : null;
  // D-LT2: "No smaller step here" only when the rung overshoots the ideal step by more than the step itself.
  const coarse = (kg: number) => kg - input.rawKg > input.rawKg - input.topKg + KG_EPS;
  if (pick != null) {
    const w = window(input, pick, lo, hi);
    const effort = rirMid(input.goal) <= 1 ? ', close to max' : '';
    const text = coarse(pick) ? `No smaller step here: use ${at(pick)} for ${w.label}${effort}.` : `${at(pick)} for ${w.label}${effort}.`;
    return { kind: 'rung', kg: pick, repWindow: w.repWindow, text, repsLabel: w.label, setReps: w.setReps };
  }
  // §3 step 6: keep the load and earn the rung, within the goal's allowance past `hi`.
  const earn = Math.max(input.R + 1, repsToEarn(input.topKg, input.R, input.rirObs, up, floorReps, check));
  if (earn <= hi + EARN_ALLOWANCE[input.goal]) {
    const text = `${coarse(up) ? 'No smaller step here. ' : ''}Keep ${at(input.topKg)} and work up to ${earn} reps; then ${at(up)} for ${floorReps} is ready.`;
    return { kind: 'earn', kg: input.topKg, repWindow: [earn, earn], text, repsLabel: String(earn) };
  }
  const r = Math.floor(repsAt(input.topKg, input.R, input.rirObs, up, rirMid(input.goal)) + REP_EPS);
  const text = `${at(up)} is too big a jump${r >= 1 ? ` for now (about ${r} reps)` : ''}. Keep ${at(input.topKg)} and add a set, or ${verb}.`;
  return { kind: 'lever', kg: input.topKg, repWindow: [keepReps, keepReps], text, extraSet: true };
}

/**
 * §3 step 7: the step-down is sized from performance, L = E / (1 + (lo + rirMid) / 30), snapped down on the menu,
 * at least 5 % under the current load, never under the load planned before the failed increase.
 */
function stepDown(input: RungInput, rungs: number[], lo: number, hi: number, at: (kg: number) => string): RungChoice {
  const e = input.topKg * (1 + (input.R + input.rirObs) / 30);
  const sized = Math.min(e / (1 + (lo + rirMid(input.goal)) / 30), input.topKg * 0.95);
  let kg = nearRung(sized, rungs, 'down');
  const prior = input.priorPlannedKg;
  if (prior != null && prior > 0 && prior < input.topKg - KG_EPS && kg < prior - KG_EPS) kg = nearRung(prior, rungs, 'down');
  // Nothing under the current load on this menu: keep it and rebuild from the bottom of the range.
  if (kg >= input.topKg - KG_EPS) return { kind: 'down', kg: input.topKg, repWindow: [lo, lo], text: `Nothing lighter here: ${at(input.topKg)} for ${lo}.`, repsLabel: String(lo) };
  const w = window(input, kg, lo, hi);
  return { kind: 'down', kg, repWindow: w.repWindow, text: `${at(kg)} for ${w.label}.`, repsLabel: w.label, setReps: w.setReps };
}

/** LT-3 (§4): what the rest of the sets become after set 1. */
export type LiveKind = 'keep' | 'above' | 'reps' | 'drop' | 'stay' | 'up';
export interface LiveRetarget {
  kind: LiveKind;
  /** The load for sets 2..n, in kg. */
  kg: number;
  /** The reps for sets 2..n. */
  reps: number;
  /** The autoregulation action line; null when only the reps change or no prompt is allowed here. */
  text: string | null;
  /** Above the plan: the planned rung to go back to. */
  back?: { kg: number; reps: number };
}
export interface LiveOptions {
  /** Prior sessions of this exercise: 3 or more steps 2.5 % of the lifted load, else a flat 2.5 kg (plan 6.13). */
  historyCount?: number;
  /** A lighter week, an amber or red day or a cut factor (BUG-15): never a heavier load, easy sets keep the plan. */
  holdLoad?: boolean;
  /** Plan 6.13: prompts only where allowed (not isolation, not timed). Without them no line and no load the user did not lift (D-LT3). */
  prompts?: boolean;
}

/**
 * LT-3 (§4 "Live adaptation"): the placeholders for sets 2..n from set 1 as lifted, and the one line that explains them.
 * Pure. Set 1's own load, reps and effort are the anchor (unrated = RIR 2); `target` is set 1's planned load and reps.
 */
export function liveRetarget(
  sets: Array<{ kg?: number; reps?: number; effort?: Effort }>,
  target: { kg: number; reps: number },
  goal: GoalId,
  role: 'main' | 'accessory',
  menu: RungMenu | null,
  opts: LiveOptions = {},
): LiveRetarget | null {
  const s1 = sets[0];
  const kg = s1?.kg ?? 0, R = s1?.reps ?? 0;
  if (!(kg > 0) || !(R > 0) || !(target.kg > 0) || !(target.reps > 0)) return null;
  const g = GOAL_BY_ID[goal];
  const [lo, hi] = role === 'main' ? g.mainReps : g.accessoryReps;
  const unit = menu?.unit ?? 'kg';
  const v = (x: number) => kgToDisplay(x, unit);
  const at = (x: number) => `${v(x)} ${unit}`;
  const rirObs = RIR_BY_EFFORT[s1!.effort ?? 'ideal'];
  const prompts = opts.prompts !== false;
  const above = kg > target.kg + KG_EPS;
  const atPlan = !above && kg >= target.kg - KG_EPS;
  // §4: ideal keeps the reps, max drops one, easy adds one, inside the goal's top; a held day keeps the plan's reps.
  const repsRule = (): number => {
    if (s1!.effort === 'max') return Math.max(1, R - 1);
    if (s1!.effort === 'easy') return opts.holdLoad ? (atPlan ? target.reps : Math.min(hi, R)) : Math.min(hi, R + 1);
    return Math.max(1, Math.min(hi, R));
  };
  const reps = (): LiveRetarget => {
    const n = repsRule();
    // An easy set at the plan's load gets a reps line, never a load line: reps first, then load (§4, D-LT3).
    const easyAtPlan = prompts && atPlan && s1!.effort === 'easy' && R >= target.reps;
    const text = !easyAtPlan ? null : opts.holdLoad ? `Keep ${at(kg)} for the next set.` : `Keep ${at(kg)} and do ${n} reps for the next set: reps first, then load.`;
    return { kind: 'reps', kg, reps: n, text };
  };

  if (above) {
    // The reps left at the lifted load, at the goal's shown effort. Never "add load" above the plan.
    const f = Math.floor(R + rirObs - rirMid(goal) + REP_EPS);
    if (f >= lo) {
      const n = Math.min(hi, f);
      return { kind: 'keep', kg, reps: n, text: prompts ? `Keep ${at(kg)} for the rest: ${n} reps a set.` : null };
    }
    const back = { kg: target.kg, reps: target.reps };
    if (f >= 1) {
      return { kind: 'above', kg, reps: f, back, text: prompts ? `${at(kg)} is above today's plan: about ${f} clean reps. Back to ${v(target.kg)} for ${target.reps}, or stay at ${v(kg)} for ${f}.` : null };
    }
    // D-LT3: nothing clean is left at the lifted load, so the only way on is the planned rung.
    if (!prompts) return reps();
    return { kind: 'above', kg: target.kg, reps: target.reps, back, text: `Back to ${v(target.kg)} for ${target.reps}.` };
  }

  const step = (opts.historyCount ?? 0) >= 3 ? kg * 0.025 : 2.5;
  const rungs = menu?.rungsKg ?? [];
  // Plan 6.13, max and reps under target − 1: step down from the lifted load, never to the same rung (COACHRULES-F5).
  if (s1!.effort === 'max' && R < target.reps - 1) {
    if (!prompts) return reps();
    const down = rungs.length
      ? [...rungs].reverse().find(x => x <= kg - step + KG_EPS && x < kg - KG_EPS) ?? [...rungs].reverse().find(x => x < kg - KG_EPS)
      : ((x: number) => (x > 0 ? x : undefined))(Math.min(Math.floor((kg - step + 0.01) / 2.5) * 2.5, Math.floor((kg - 0.01) / 2.5) * 2.5));
    if (down == null) {
      return { kind: 'stay', kg, reps: Math.max(1, R - 1), text: `Stay at ${at(kg)}, rest a little longer, and stop each set a rep short of max.` };
    }
    const n = Math.max(1, Math.min(hi, Math.floor(repsAt(kg, R, rirObs, down, rirMid(goal)) + REP_EPS)));
    return { kind: 'drop', kg: down, reps: n, text: `Drop to ${at(down)} and keep the rest at ideal effort.` };
  }
  // Below the plan and easy at the planned reps: step up from the lifted load, never past the planned rung.
  // At the plan's load an easy set adds reps instead: reps first, load next session (§4).
  if (!atPlan && s1!.effort === 'easy' && R >= target.reps && prompts && !opts.holdLoad) {
    const upRaw = rungs.length
      ? rungs.find(x => x >= kg + step - KG_EPS && x > kg + KG_EPS) ?? rungs.find(x => x > kg + KG_EPS)
      : Math.max(Math.ceil((kg + step - 0.01) / 2.5) * 2.5, Math.ceil((kg + 0.01) / 2.5) * 2.5);
    if (upRaw != null) {
      const up = Math.min(upRaw, target.kg);
      const n = Math.max(1, Math.min(hi, Math.floor(repsAt(kg, R, rirObs, up, rirMid(goal)) + REP_EPS)));
      return { kind: 'up', kg: up, reps: n, text: `Try ${at(up)} for the next set.` };
    }
  }
  return reps();
}

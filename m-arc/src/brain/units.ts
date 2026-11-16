/**
 * Plate Sense (§25.4): what a piece of equipment can really load, in its own unit.
 * Canonical kg stays the number every other brain module uses; this only turns
 * a target into something you can put on the bar, pin or pick off the rack.
 */
import type { EquipmentProfile, Exercise, Gym, LoadUnit, LoggedSet, Session, UnitsState } from '@/core/models';
import { DEFAULT_GYM_ID } from '@/core/models';
import { KG_PER_LB } from '@/core/units';
import { equipmentGroup } from './coach/cues';
import { exerciseHistory } from './history';

const factor = (u: LoadUnit): number => (u === 'lb' ? KG_PER_LB : 1);
const r = (v: number, places = 2): number => { const f = 10 ** places; return Math.round(v * f) / f; };

export const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
export const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
export const LB_BAR_KG = r(45 * KG_PER_LB, 3);

function dumbbellLadder(unit: LoadUnit): number[] {
  const out: number[] = [];
  if (unit === 'lb') {
    for (let v = 5; v < 25; v += 2.5) out.push(v);
    for (let v = 25; v <= 150; v += 5) out.push(v);
  } else {
    for (let v = 2; v <= 10; v += 2) out.push(v);
    for (let v = 12.5; v <= 60; v += 2.5) out.push(v);
  }
  return out;
}

/** The built-in profile for an equipment group in a gym's default unit. */
export function defaultProfile(equipment: string, unit: LoadUnit): EquipmentProfile {
  const group = equipmentGroup(equipment);
  const base = { unit, source: 'default' as const, updatedAt: '' };
  if (group === 'Barbell' || group === 'Smith Machine') return { ...base, barKg: unit === 'lb' ? LB_BAR_KG : 20, plates: unit === 'lb' ? LB_PLATES : KG_PLATES };
  if (group === 'Dumbbells') return { ...base, ladder: dumbbellLadder(unit) };
  if (group === 'Machine' || group === 'Cable') return { ...base, step: 5 };
  return { ...base, step: unit === 'lb' ? 5 : 2.5 };
}

/**
 * The profile for one exercise at one gym, in this order: the exercise at this gym →
 * the exercise at any gym (most recently updated) → its equipment group at this gym →
 * the gym's default unit with the built-in ladders.
 */
export function resolveProfile(exerciseId: string, gymId: string, units: UnitsState, exercise: Pick<Exercise, 'equipment'> | undefined): EquipmentProfile {
  const here = units.byExercise[gymId]?.[exerciseId];
  if (here) return here;
  const elsewhere = Object.entries(units.byExercise)
    .map(([, m]) => m[exerciseId])
    .filter((p): p is EquipmentProfile => !!p)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  if (elsewhere) return elsewhere;
  const equipment = exercise?.equipment ?? '';
  const group = units.byEquipment[gymId]?.[equipmentGroup(equipment)];
  if (group) return group;
  const gym = units.gyms.find(g => g.id === gymId) ?? units.gyms[0];
  return defaultProfile(equipment, gym?.defaultUnit ?? 'kg');
}

/** One logged load for loadMenu (LT-1): the set's own numbers plus the session it came from. */
export interface LoggedLoad {
  sessionId: string;
  /** The session's gym; absent before Plate Sense (counts for the default gym only). */
  gymId?: string;
  kg: number;
  entered?: LoggedSet['entered'];
  flags?: LoggedSet['flags'];
  /** BUG-18: held as implausible at read time (flagged against earlier sessions, never repeated). */
  held?: boolean;
}

/**
 * Every loaded, non-skipped set of `exerciseId` in `sessions`, warm-ups and drop sets included: a load someone
 * lifted exists. `held` comes from BUG-18's read-time rule, the same one targets and records use.
 */
export function loggedLoads(sessions: Session[], exerciseId: string, custom?: Exercise[]): LoggedLoad[] {
  const heldBySession = new Map<string, LoggedSet[]>();
  for (const h of exerciseHistory(sessions, exerciseId, custom)) if (h.held.length) heldBySession.set(h.sessionId, h.held);
  // A held set is the logged object itself, or a copy for a set to failure (summarizeSets rates it max).
  const isHeld = (held: LoggedSet[] | undefined, set: LoggedSet) => !!held?.some(h => h === set || (set.kind === 'failure' && h.kind === 'failure' && h.kg === set.kg && h.reps === set.reps && h.at === set.at));
  const out: LoggedLoad[] = [];
  for (const s of sessions) for (const e of s.exercises) {
    if (e.exerciseId !== exerciseId) continue;
    for (const set of e.sets) {
      if (!((set.kg ?? 0) > 0) || set.status === 'skipped') continue;
      const held = isHeld(heldBySession.get(s.id), set);
      out.push({ sessionId: s.id, gymId: s.gymId, kg: set.kg!, entered: set.entered, flags: set.flags, ...(held ? { held } : {}) });
    }
  }
  return out;
}

/**
 * LT-1: whether a logged load is flagged and so never a rung. The one place the flag rule lives: BUG-18's held
 * sets (a stored `implausible_load` is not enough, since a repeat confirms the load), and a stored kg/lb suspicion.
 */
export function isFlaggedLoad(l: Pick<LoggedLoad, 'flags' | 'held'>): boolean {
  return !!l.held || !!l.flags?.includes('unit_suspect');
}

export type MenuConfidence = 'known' | 'learned' | 'assumed';
/** Which precedence rank chose the menu: `other_gym` means the default ladder in another gym's unit for this exercise. */
export type MenuSource = 'exercise' | 'group' | 'default' | 'other_gym';

export interface LoadMenu {
  profile: EquipmentProfile;
  /** Every load in canonical kg, ascending: the profile's loads plus the learned ones (ranks 3 and 4 only). */
  rungsKg: number[];
  unit: LoadUnit;
  confidence: MenuConfidence;
  source: MenuSource;
}

const KNOWN_SOURCES: ReadonlySet<EquipmentProfile['source']> = new Set(['user', 'suspect_fix', 'escobar_scan', 'escobar_chat']);

/** The gym that owns sessions without a gymId: the built-in one, or the first gym when it was deleted (as resolveProfile falls back). */
const defaultGymId = (units: UnitsState): string | undefined => (units.gyms.some(g => g.id === DEFAULT_GYM_ID) ? DEFAULT_GYM_ID : units.gyms[0]?.id);

/**
 * LT-1 (docs/LOAD-AWARE-TARGETS.md §2): what the user can load for one exercise at one gym, and how sure we are.
 * 1. the exercise's profile here with a real source → known; 2. its group's profile here with a real source → known;
 * 3. the built-in default united with loads logged in two sessions at this gym, unflagged, in the menu's unit →
 * learned with two such loads, else assumed; 4. the exercise's profile at another gym gives the unit only.
 */
export function loadMenu(exerciseId: string, gymId: string, units: UnitsState, exercise: Pick<Exercise, 'equipment'> | undefined, loggedKg: LoggedLoad[]): LoadMenu {
  const toKg = (values: number[], unit: LoadUnit) => values.map(v => r(v * factor(unit), 3));
  const equipment = exercise?.equipment ?? '';
  const here = units.byExercise[gymId]?.[exerciseId];
  if (here && KNOWN_SOURCES.has(here.source)) return { profile: here, rungsKg: toKg(loadableValues(here), here.unit), unit: here.unit, confidence: 'known', source: 'exercise' };
  const group = units.byEquipment[gymId]?.[equipmentGroup(equipment)];
  if (group && KNOWN_SOURCES.has(group.source)) return { profile: group, rungsKg: toKg(loadableValues(group), group.unit), unit: group.unit, confidence: 'known', source: 'group' };
  const elsewhere = Object.entries(units.byExercise)
    .filter(([id]) => id !== gymId)
    .map(([, m]) => m[exerciseId])
    .filter((p): p is EquipmentProfile => !!p)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  const gym = units.gyms.find(g => g.id === gymId) ?? units.gyms[0];
  const unit = here?.unit ?? group?.unit ?? elsewhere?.unit ?? gym?.defaultUnit ?? 'kg';
  const profile = defaultProfile(equipment, unit);
  const ownsUndated = gymId === defaultGymId(units);
  const sessionsByValue = new Map<number, Set<string>>();
  for (const l of loggedKg) {
    if (!(l.gymId ? l.gymId === gymId : ownsUndated)) continue;
    if (isFlaggedLoad(l) || (l.entered?.unit ?? 'kg') !== unit) continue;
    const value = r(l.entered?.value ?? l.kg);
    if (!(value > 0)) continue;
    const seen = sessionsByValue.get(value) ?? new Set<string>();
    seen.add(l.sessionId);
    sessionsByValue.set(value, seen);
  }
  const learned = [...sessionsByValue].filter(([, s]) => s.size >= 2).map(([v]) => v);
  const values = [...new Set([...loadableValues(profile), ...learned])].sort((a, b) => a - b);
  return {
    profile,
    rungsKg: toKg(values, unit),
    unit,
    confidence: learned.length >= 2 ? 'learned' : 'assumed',
    source: !here && !group && elsewhere ? 'other_gym' : 'default',
  };
}

/** LT-1: the size of a jump in percent of `fromKg` (negative for a step down); Infinity from nothing to a load. */
export function jumpPct(fromKg: number, toKg: number): number {
  if (!(fromKg > 0)) return toKg > 0 ? Infinity : 0;
  return ((toKg - fromKg) / fromKg) * 100;
}

/** Every per-side plate total reachable with unlimited pairs of each plate, up to `maxPerSide`, in hundredths. */
function plateSums(plates: number[], maxPerSide: number): number[] {
  const cents = plates.map(p => Math.round(p * 100)).filter(p => p > 0);
  const max = Math.round(maxPerSide * 100);
  const reach = new Uint8Array(max + 1);
  reach[0] = 1;
  for (const p of cents) for (let v = p; v <= max; v++) if (reach[v - p]) reach[v] = 1;
  const out: number[] = [];
  for (let v = 0; v <= max; v++) if (reach[v]) out.push(v / 100);
  return out;
}

function withAddOns(values: number[], addOns: number[] | undefined): number[] {
  if (!addOns?.length) return values;
  const combos = [0];
  for (const a of addOns) for (const c of [...combos]) combos.push(c + a);
  const set = new Set<number>();
  for (const v of values) for (const c of combos) set.add(r(v + c));
  return [...set];
}

const cache = new Map<string, number[]>();

/** Every load this equipment can make, in its own unit, ascending. */
export function loadableValues(profile: EquipmentProfile): number[] {
  const key = JSON.stringify([profile.unit, profile.step, profile.ladder, profile.addOns, profile.barKg, profile.plates]);
  const hit = cache.get(key);
  if (hit) return hit;
  let values: number[];
  if (profile.ladder?.length) values = profile.ladder;
  else if (profile.plates?.length || profile.barKg) {
    const plates = profile.plates?.length ? profile.plates : profile.unit === 'lb' ? LB_PLATES : KG_PLATES;
    const bar = (profile.barKg ?? (profile.unit === 'lb' ? LB_BAR_KG : 20)) / factor(profile.unit);
    values = plateSums(plates, profile.unit === 'lb' ? 400 : 180).map(s => r(bar + 2 * s));
  } else {
    const step = profile.step && profile.step > 0 ? profile.step : profile.unit === 'lb' ? 5 : 2.5;
    const top = profile.unit === 'lb' ? 1000 : 500;
    values = [];
    for (let i = 1; i * step <= top; i++) values.push(r(i * step));
  }
  const out = [...new Set(withAddOns(values, profile.addOns))].sort((a, b) => a - b);
  if (cache.size > 64) cache.clear();
  cache.set(key, out);
  return out;
}

/** The heaviest load this equipment can make, in canonical kg. Infinity when the profile has no real ceiling. */
export function loadableTopKg(profile: EquipmentProfile): number {
  const values = loadableValues(profile);
  return values.length ? r(values[values.length - 1]! * factor(profile.unit), 3) : Infinity;
}

export interface Loadable { kg: number; value: number; unit: LoadUnit }

/** Snaps a canonical kg target to the nearest load the equipment really has. `up` for increases, `down` for reductions. */
export function loadableNear(kg: number, profile: EquipmentProfile, direction: 'nearest' | 'up' | 'down' = 'nearest'): Loadable {
  const f = factor(profile.unit);
  const t = kg / f;
  const values = loadableValues(profile);
  const eps = 0.011;
  let pick: number | undefined;
  if (!values.length) pick = r(t);
  else if (direction === 'up') pick = values.find(v => v >= t - eps) ?? values[values.length - 1];
  else if (direction === 'down') pick = [...values].reverse().find(v => v <= t + eps) ?? values[0];
  else {
    let best = values[0]!;
    for (const v of values) if (Math.abs(v - t) < Math.abs(best - t) - 1e-9) best = v;
    pick = best;
  }
  const value = r(pick!);
  return { kg: r(value * f, 3), value, unit: profile.unit };
}

export interface PlateBreakdown {
  perSide: Array<{ value: number; unit: LoadUnit; count: number }>;
  barKg: number;
  /** What the bar plus these plates really weighs. */
  exactTotalKg: number;
  /** Asked-for total minus what loads (positive = could not reach it). */
  remainderKg: number;
}

/**
 * Plates per side for a barbell total (BR-24): the largest per-side sum the plates can make at or
 * under the target, with the fewest plates. A DP over cents in the plate unit, like plateSums;
 * greedy failed on sets like 25/20/15 (35 = 20 + 15, not 25 + nothing). Works for a kg bar with
 * lb plates too.
 */
export function plateBreakdown(totalKg: number, profile: EquipmentProfile): PlateBreakdown {
  const f = factor(profile.unit);
  const barKg = profile.barKg ?? (profile.unit === 'lb' ? LB_BAR_KG : 20);
  const plates = (profile.plates?.length ? profile.plates : profile.unit === 'lb' ? LB_PLATES : KG_PLATES).slice().sort((a, b) => b - a);
  const target = Math.floor((Math.max(0, (totalKg - barKg) / 2 / f) + 0.02) * 100);
  const cents = plates.map(p => Math.round(p * 100)).filter(p => p > 0);
  const count = new Int32Array(target + 1).fill(-1);
  const via = new Int32Array(target + 1).fill(-1);
  count[0] = 0;
  for (let v = 1; v <= target; v++) {
    for (let i = 0; i < cents.length; i++) {
      const c = cents[i]!;
      if (c > v || count[v - c]! < 0) continue;
      if (count[v]! < 0 || count[v - c]! + 1 < count[v]!) { count[v] = count[v - c]! + 1; via[v] = i; }
    }
  }
  let v = target;
  while (v > 0 && count[v]! < 0) v--;
  const used = new Map<number, number>();
  while (v > 0) { const i = via[v]!; used.set(i, (used.get(i) ?? 0) + 1); v -= cents[i]!; }
  const perSide: PlateBreakdown['perSide'] = [...used].sort((a, b) => a[0] - b[0]).map(([i, n]) => ({ value: plates[i]!, unit: profile.unit, count: n }));
  const sideKg = perSide.reduce((a, x) => a + x.value * x.count, 0) * f;
  const exactTotalKg = r(barKg + 2 * sideKg, 3);
  return { perSide, barKg, exactTotalKg, remainderKg: r(totalKg - exactTotalKg, 3) };
}

/** "45 + 10 + 2.5 lb" for one side. */
export function formatPerSide(b: PlateBreakdown): string {
  if (!b.perSide.length) return 'Just the bar';
  const unit = b.perSide[0]!.unit;
  return `${b.perSide.flatMap(p => Array.from({ length: p.count }, () => String(p.value))).join(' + ')} ${unit}`;
}

/** Formats a snapped load in the equipment's unit: "55 lb". */
export const formatLoadable = (l: Loadable): string => `${l.value} ${l.unit}`;

/**
 * The gym used most on this weekday within ±2 h of now's time of day over the last
 * 8 weeks, or null. Ties go to the most recent session.
 */
export function inferGym(sessions: Session[], gyms: Gym[], now: Date): string | null {
  const ids = new Set(gyms.map(g => g.id));
  const since = now.getTime() - 56 * 86_400_000;
  const minutes = (d: Date) => d.getHours() * 60 + d.getMinutes();
  const nowMin = minutes(now);
  const tally = new Map<string, { n: number; last: number }>();
  for (const s of sessions) {
    if (!s.gymId || !ids.has(s.gymId)) continue;
    const at = new Date(s.logging?.trainedAt ?? s.startedAt);
    const t = at.getTime();
    if (!(t >= since && t <= now.getTime())) continue;
    if (at.getDay() !== now.getDay()) continue;
    const diff = Math.abs(minutes(at) - nowMin);
    if (Math.min(diff, 1440 - diff) > 120) continue;
    const cur = tally.get(s.gymId) ?? { n: 0, last: 0 };
    tally.set(s.gymId, { n: cur.n + 1, last: Math.max(cur.last, t) });
  }
  let best: string | null = null;
  let bestV = { n: 0, last: 0 };
  for (const [id, v] of tally) if (v.n > bestV.n || (v.n === bestV.n && v.last > bestV.last)) { best = id; bestV = v; }
  return best;
}

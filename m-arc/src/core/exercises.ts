import rawLibrary from '@/data/exercises.json';
import type { Exercise, ResistanceMode } from './models';
import { classifyMuscleText, isMuscleId, type MuscleId } from '@/data/muscles';
import { DAMAGE_DEFAULT, DAMAGE_HEAVY_MAIN, DAMAGE_HIGH, DAMAGE_LOW } from '@/data/recovery';

const DURATION_NAMES = new Set(['lib_plank', 'lib_side_plank', 'lib_wall_sit', 'lib_hollow_body_hold']);
const CONDITIONING_NAMES = new Set([
  'lib_sled_push', 'lib_sled_pull', 'lib_farmer_s_carry',
  'lib_burpee', 'lib_mountain_climbers', 'lib_jumping_jacks', 'lib_high_knees', 'lib_jump_rope',
  'lib_box_jump', 'lib_battle_ropes', 'lib_medicine_ball_slam', 'lib_wall_ball', 'lib_bear_crawl', 'lib_jump_squat',
]);
/**
 * QA3-12: the conditioning moves that always progress by distance or time, never reps - a carry
 * or sled, unlike rep-based conditioning (burpees, jump rope, ...). Decided by which exercise it
 * is, not by which fields happen to be filled on its last set.
 */
export const CARRY_OR_SLED_IDS = new Set(['lib_sled_push', 'lib_sled_pull', 'lib_farmer_s_carry']);
const ASSISTED_HINT = /assisted/i;

function inferMode(id: string, equipment: string, name: string): ResistanceMode {
  if (DURATION_NAMES.has(id)) return 'duration';
  if (CONDITIONING_NAMES.has(id)) return 'conditioning';
  if (ASSISTED_HINT.test(name)) return 'assisted';
  if (/^bodyweight$/i.test(equipment) || /ab wheel/i.test(equipment)) return 'bodyweight';
  return 'weighted';
}

interface RawExercise {
  id: string; name: string; equipment: string; primary: string[]; secondary: string[];
  stabilizers: string[]; aliases: string[]; pattern: string; defaultSets: number;
}

const onlyMuscles = (list: string[]): MuscleId[] => list.filter(isMuscleId);

/** Patterns whose exercises get the goal's main rep range. Everything else is an accessory. */
const MAIN_PATTERNS = new Set(['squat', 'single_leg_squat', 'lunge', 'hip_hinge', 'horizontal_push', 'incline_push', 'vertical_push', 'vertical_pull', 'horizontal_pull']);
/** hip_extension is a main pattern only for the barbell/machine hip thrust; glute bridges and kickbacks stay accessories. */
const MAIN_IDS = new Set(['lib_hip_thrust']);

export function roleOf(pattern: string, id: string): 'main' | 'accessory' {
  return MAIN_PATTERNS.has(pattern) || MAIN_IDS.has(id) ? 'main' : 'accessory';
}

/** Eccentric-emphasis or lengthened-position movements (recovery.ts 6.11's damage factor 1.3). */
const HIGH_DAMAGE_IDS = new Set([
  'lib_romanian_deadlift', 'lib_dumbbell_romanian_deadlift', 'lib_single_leg_romanian_deadlift',
  'lib_bulgarian_split_squat', 'lib_walking_lunge', 'lib_reverse_lunge', 'lib_forward_lunge',
  'lib_incline_dumbbell_curl', 'lib_preacher_curl',
  'lib_pec_fly', 'lib_cable_fly', 'lib_low_to_high_cable_fly', 'lib_high_to_low_cable_fly', 'lib_dumbbell_fly',
  'lib_rear_delt_fly', 'lib_cable_rear_delt_fly', 'lib_bent_over_dumbbell_rear_delt_fly',
  'lib_machine_pullover', 'lib_dumbbell_pullover',
]);
/** Short-range machine or concentric-dominant work (damage factor 0.8). */
const LOW_DAMAGE_IDS = new Set([
  'lib_leg_extension', 'lib_sled_push', 'lib_sled_pull',
  'lib_seated_calf_raise', 'lib_standing_calf_raise', 'lib_leg_press_calf_raise',
]);
const TEMPO_OR_PAUSE = /\b(tempo|pause)\b/i;

/** Static per-exercise damage factor, before the dynamic "heavy main lift" bump below. */
export function exerciseDamage(exercise: { id: string; name: string }): number {
  if (HIGH_DAMAGE_IDS.has(exercise.id) || TEMPO_OR_PAUSE.test(exercise.name)) return DAMAGE_HIGH;
  if (LOW_DAMAGE_IDS.has(exercise.id)) return DAMAGE_LOW;
  return DAMAGE_DEFAULT;
}

/** The set's actual damage factor: the static value, bumped to at least DAMAGE_HEAVY_MAIN for a heavy main lift (QA-R7-2, QA-R7-3). */
export function setDamage(exercise: { id: string; name: string; role: 'main' | 'accessory' }, reps: number): number {
  const base = exerciseDamage(exercise);
  return exercise.role === 'main' && reps > 0 && reps <= 5 ? Math.max(base, DAMAGE_HEAVY_MAIN) : base;
}

/** The built-in library, typed and with a resistance mode attached. */
export const LIBRARY: Exercise[] = (rawLibrary as RawExercise[]).map(e => ({
  id: e.id,
  name: e.name,
  equipment: e.equipment,
  primary: onlyMuscles(e.primary),
  secondary: onlyMuscles(e.secondary),
  stabilizers: onlyMuscles(e.stabilizers),
  aliases: e.aliases,
  pattern: e.pattern,
  defaultSets: e.defaultSets,
  mode: inferMode(e.id, e.equipment, e.name),
  role: roleOf(e.pattern, e.id),
}));

const byId = new Map(LIBRARY.map(e => [e.id, e]));

/** Name lookups run inside tight brain loops; the same few hundred strings recur, so remember them. */
const normalized = new Map<string, string>();

export function normalizeName(s: string): string {
  const hit = normalized.get(s);
  if (hit !== undefined) return hit;
  const out = normalizeUncached(s);
  if (normalized.size > 4000) normalized.clear();
  normalized.set(s, out);
  return out;
}

function normalizeUncached(s: string): string {
  return s
    .toLowerCase()
    .replace(/dumbell/g, 'dumbbell')
    .replace(/\bdbs?\b/g, 'dumbbell')
    .replace(/\btricep\b/g, 'triceps')
    .replace(/\bbicep\b/g, 'biceps')
    .replace(/pull ?down/g, 'pulldown')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Name → exercise answers per custom list (by identity), so repeated name lookups are O(1). */
const byName = new WeakMap<Exercise[], Map<string, Exercise | undefined>>();
const NO_CUSTOM: Exercise[] = [];

/** Resolve an exercise by id, then by exact name or alias, across library and custom list. */
export function findExercise(idOrName: string, custom: Exercise[] = NO_CUSTOM): Exercise | undefined {
  const direct = byId.get(idOrName) ?? custom.find(c => c.id === idOrName);
  if (direct) return direct;
  let memo = byName.get(custom);
  if (!memo) { memo = new Map(); byName.set(custom, memo); }
  if (memo.has(idOrName)) return memo.get(idOrName);
  const found = findByName(idOrName, custom);
  memo.set(idOrName, found);
  return found;
}

function findByExactName(idOrName: string, custom: Exercise[]): Exercise | undefined {
  const q = normalizeName(idOrName);
  if (!q) return undefined;
  const singular = q.replace(/s\b/g, '');
  const same = (a: string) => { const n = normalizeName(a); return n === q || n.replace(/s\b/g, '') === singular; };
  return [...custom, ...LIBRARY].find(e => same(e.name) || e.aliases.some(same));
}

/**
 * ST-13: the substring step answers only when exactly one exercise matches, so "Press" no longer
 * resolves to whichever press happens to come first.
 */
function findByName(idOrName: string, custom: Exercise[]): Exercise | undefined {
  const exact = findByExactName(idOrName, custom);
  if (exact) return exact;
  const q = normalizeName(idOrName);
  if (q.length < 4) return undefined;
  const hits = [...custom, ...LIBRARY].filter(e => normalizeName(e.name).includes(q) || containsOnly(q, normalizeName(e.name)));
  return hits.length === 1 ? hits[0] : undefined;
}

/**
 * QA3-2: a fixed list, not every word that appears in some exercise's equipment field. Multi-word
 * equipment ("Leg Press", "Dip Station", "Jump Rope", "Medicine Ball", "Resistance Band") must not
 * strip real movement words ("leg", "press", "dip", "jump", "rope", "ball", "band") out of
 * `movementWords`, or "Leg Press Hack Squat" resolves to Hack Squat (QA-R3b-3 again).
 */
const GEAR_WORDS = new Set(['barbell', 'dumbbell', 'cable', 'machine', 'ez', 'bar', 'kettlebell', 'smith', 'trap']);

/** A word's gear identity, ignoring singular/plural ("dumbbell"/"dumbbells") and abbreviations already folded by normalizeName. */
function gearWordsIn(text: string): string[] {
  return normalizeName(text).split(' ').map(w => w.replace(/s\b/g, '')).filter(w => GEAR_WORDS.has(w));
}

/**
 * QA3-2: a name's gear word ("Dumbbell Skull Crusher") must agree with the matched exercise's own
 * equipment, or it is a different exercise (an EZ-bar Skull Crusher done with a dumbbell isn't the
 * same lift). No gear word in the name means nothing to disagree with.
 */
function gearAgrees(name: string, equipment: string): boolean {
  const named = gearWordsIn(name);
  if (!named.length) return true;
  const has = new Set(gearWordsIn(equipment));
  return named.every(w => has.has(w));
}

let movementWords: Set<string> | null = null;
/**
 * QA-R3b-3: a longer name that contains a library name ("Hack Squat Calf Raise") is that exercise
 * only when the extra words name no other movement. A word that appears in any library name
 * ("calf", "raise") means it is a different exercise; words like "heavy" or "paused" do not.
 */
function containsOnly(q: string, name: string): boolean {
  if (!name || !q.includes(name)) return false;
  // QA2-FC-7: equipment words ("machine", "cable", "barbell") say how, not which movement, so
  // "Leg Press Machine" is still Leg Press.
  if (!movementWords) {
    movementWords = new Set(LIBRARY.flatMap(e => normalizeName(e.name).split(' ')).filter(w => w.length > 2 && !GEAR_WORDS.has(w.replace(/s\b/g, ''))));
  }
  const own = new Set(name.split(' '));
  return !q.replace(name, ' ').split(' ').some(w => w && !own.has(w) && movementWords!.has(w));
}

/**
 * For imports that know the equipment ("Chest Press", Machine): the usual lookup, then, when the
 * name alone is ambiguous, the one partial match whose equipment agrees (ST-13 kept this path).
 */
export function findExerciseWithEquipment(name: string, equipment: string | undefined, custom: Exercise[] = NO_CUSTOM): Exercise | undefined {
  const found = findExercise(name, custom);
  // QA3-2: a gear word in the name that disagrees with the match's own equipment means a
  // different exercise, not a merge; the caller (the old-app importer) makes a custom one instead.
  // QA3-2b: only for a fuzzy/substring match. An exact id, name or alias match (library or
  // custom) is never rejected on gear alone - "bar pushdown" is still Straight-Bar Triceps
  // Pushdown even though "bar" also disagrees with its Cable equipment.
  if (found) return findExerciseExact(name, custom) === found || gearAgrees(name, found.equipment) ? found : undefined;
  if (!equipment) return undefined;
  const q = normalizeName(name);
  if (q.length < 4) return undefined;
  const eq = normalizeName(equipment).replace(/s\b/g, '');
  const hits = [...custom, ...LIBRARY].filter(e => (normalizeName(e.name).includes(q) || containsOnly(q, normalizeName(e.name))) && normalizeName(e.equipment).replace(/s\b/g, '') === eq);
  return hits.length === 1 ? hits[0] : undefined;
}

/** Id, custom id, or exact name/alias; never a substring guess. For writes that must not land on the wrong exercise. */
export function findExerciseExact(nameOrId: string, custom: Exercise[] = NO_CUSTOM): Exercise | undefined {
  return byId.get(nameOrId) ?? custom.find(c => c.id === nameOrId) ?? findByExactName(nameOrId, custom);
}

export function searchExercises(query: string, custom: Exercise[] = [], limit = 12): Exercise[] {
  const q = normalizeName(query);
  const all = [...custom, ...LIBRARY];
  if (!q) return all.slice(0, limit);
  const scored = all
    .map(e => {
      const name = normalizeName(e.name);
      let score = 0;
      if (name === q) score = 150;
      else if (e.aliases.some(a => normalizeName(a) === q)) score = 130;
      else if (name.startsWith(q)) score = 70;
      else if (name.includes(q)) score = 50;
      else if (e.aliases.some(a => normalizeName(a).includes(q))) score = 40;
      else {
        const words = q.split(' ');
        if (words.every(w => name.includes(w))) score = 30;
      }
      return { e, score: score - name.length / 100 };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(x => x.e);
}

/** Build a custom exercise from plain form fields. Unknown muscle text is classified, never dropped silently. */
export function makeCustomExercise(input: {
  id?: string; name: string; equipment: string; primary: string[]; secondary?: string[]; mode?: ResistanceMode; role?: 'main' | 'accessory';
}): Exercise {
  const toIds = (list: string[] | undefined) =>
    (list ?? []).map(v => (isMuscleId(v) ? v : classifyMuscleText(v))).filter((v): v is MuscleId => v != null);
  return {
    id: input.id ?? `custom_${Date.now().toString(36)}`,
    name: input.name.trim().slice(0, 60),
    equipment: input.equipment.trim() || 'Other',
    primary: toIds(input.primary),
    secondary: toIds(input.secondary),
    stabilizers: [],
    aliases: [],
    pattern: 'other',
    defaultSets: 3,
    mode: input.mode ?? inferMode('', input.equipment, input.name),
    role: input.role ?? 'accessory',
    custom: true,
  };
}

/** Starting-load guidance for the first log of an exercise, by equipment. */
export function startingLoadKg(equipment: string): { kg: number | null; note: string } {
  const eq = equipment.toLowerCase();
  if (eq.includes('/')) return { kg: null, note: 'Start with the lightest comfortable setup.' };
  if (/barbell|trap bar/.test(eq)) return { kg: 20, note: 'An empty bar is a good first set.' };
  if (/ez bar|landmine/.test(eq)) return { kg: 10, note: 'Start light and find a comfortable first set.' };
  if (/kettlebell/.test(eq)) return { kg: 4, note: 'Start light and find a comfortable first set.' };
  if (/dumbbell/.test(eq)) return { kg: 2.5, note: 'Start light and find a comfortable first set.' };
  if (/bodyweight|ab wheel|dip station/.test(eq)) return { kg: null, note: 'Start with bodyweight. Add load only if it feels comfortable.' };
  return { kg: null, note: `Start with the lightest comfortable ${equipment} setting.` };
}

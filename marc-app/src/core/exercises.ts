import rawLibrary from '@/data/exercises.json';
import type { Exercise, ResistanceMode } from './models';
import { classifyMuscleText, isMuscleId, type MuscleId } from '@/data/muscles';

const DURATION_NAMES = new Set(['lib_plank', 'lib_side_plank']);
const CONDITIONING_NAMES = new Set(['lib_sled_push', 'lib_sled_pull', 'lib_farmer_s_carry']);
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
}));

const byId = new Map(LIBRARY.map(e => [e.id, e]));

export function normalizeName(s: string): string {
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

/** Resolve an exercise by id, then by exact name or alias, across library and custom list. */
export function findExercise(idOrName: string, custom: Exercise[] = []): Exercise | undefined {
  const direct = byId.get(idOrName) ?? custom.find(c => c.id === idOrName);
  if (direct) return direct;
  const q = normalizeName(idOrName);
  if (!q) return undefined;
  const all = [...custom, ...LIBRARY];
  const singular = q.replace(/s\b/g, '');
  const same = (a: string) => { const n = normalizeName(a); return n === q || n.replace(/s\b/g, '') === singular; };
  return all.find(e => same(e.name) || e.aliases.some(same))
    ?? all.find(e => q.length >= 4 && (normalizeName(e.name).includes(q) || q.includes(normalizeName(e.name))));
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
  id?: string; name: string; equipment: string; primary: string[]; secondary?: string[]; mode?: ResistanceMode;
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

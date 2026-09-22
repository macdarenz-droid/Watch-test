/**
 * Short coaching cues and "did you know" notes, matched to an exercise by
 * id, movement pattern, muscle or equipment, and rotated so the same one is
 * not shown twice in a row.
 */
import raw from '@/data/coachCues.json';
import type { Exercise } from '@/core/models';

export interface Cue {
  id: string;
  kind: 'coach' | 'learn' | 'mindset';
  title: string;
  text: string;
  exerciseIds?: string[];
  patterns?: string[];
  muscles?: string[];
  equipment?: string[];
  reasons?: string[];
}

export const CUES: Cue[] = raw as Cue[];

export function equipmentGroup(equipment: string): string {
  const e = equipment.toLowerCase();
  if (e.includes('cable')) return 'Cable';
  if (e.includes('smith')) return 'Smith Machine';
  if (e.includes('machine') || e.includes('leg press') || e.includes('plate')) return 'Machine';
  if (e.includes('dumbbell') || e.includes('kettlebell')) return 'Dumbbells';
  if (e.includes('barbell') || e.includes('ez') || e.includes('trap') || e.includes('landmine')) return 'Barbell';
  if (e.includes('bodyweight') || e.includes('dip') || e.includes('ab wheel')) return 'Bodyweight';
  if (e.includes('sled')) return 'Sled';
  return 'General';
}

function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h;
}

/** Rank: exercise-specific first, then movement, muscle, equipment, general. */
function lane(c: Cue, ex: Exercise): number {
  if (c.exerciseIds?.includes(ex.id)) return 0;
  if (c.patterns?.includes(ex.pattern)) return 1;
  if (c.muscles?.some(m => ex.primary.includes(m as never))) return 2;
  if (c.equipment?.includes(equipmentGroup(ex.equipment))) return 3;
  if (c.reasons?.includes('all')) return 4;
  if (c.muscles?.some(m => ex.secondary.includes(m as never))) return 5;
  if (!c.exerciseIds && !c.patterns && !c.muscles && !c.equipment && !c.reasons) return 6;
  return -1;
}

export function pickCue(exercise: Exercise, kind: Cue['kind'], seed: string, recent: string[] = []): Cue | null {
  const ranked = CUES.filter(c => c.kind === kind).map(c => ({ c, lane: lane(c, exercise) })).filter(x => x.lane >= 0);
  if (!ranked.length) return null;
  const best = Math.min(...ranked.map(x => x.lane));
  let pool = ranked.filter(x => x.lane === best && !recent.includes(x.c.id));
  if (!pool.length) pool = ranked.filter(x => x.lane <= best + 1 && !recent.includes(x.c.id));
  if (!pool.length) pool = ranked.filter(x => x.lane === best);
  return pool[fnv(`${exercise.id}|${seed}`) % pool.length]!.c;
}

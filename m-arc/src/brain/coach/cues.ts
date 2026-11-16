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

/** Rank: exercise-specific first, then movement, muscle, equipment, general. -1 when the cue never applies. */
export function lane(c: Cue, ex: Exercise): number {
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

/**
 * ST-17: the reason cues ("why this target") match the kind of suggestion on the set rows, not
 * an exercise, so pickCue never reached them. Which reason a suggestion is:
 */
export function reasonKeyFor(mode: string, confidence: string, exerciseMode?: string, setNote?: string): string | null {
  if (mode === 'start') return 'start_zero_history';
  if (exerciseMode === 'conditioning') return 'conditioning_baseline';
  if (mode === 'confirm_effort') return 'missing_effort';
  if (confidence === 'low' && ['confirm', 'hold', 'increase', 'reps', 'duration'].includes(mode)) return 'insufficient_history';
  // QA-R3b-8: a plateau keeps the load, so its "why" is repeatability, never "lower it".
  // QA2-FC-9: the 'change it up' plateau (a new rep range or a lighter week) is not a repeat-it cue.
  if (mode === 'plateau' && setNote === 'Change it up') return 'reduce';
  if (mode === 'confirm' || mode === 'hold' || mode === 'plateau') return 'confirm';
  if (mode === 'increase') return 'increase';
  if (mode === 'reduce') return 'reduce';
  if (mode === 'reentry') return 'reentry';
  if (mode === 'reps') return 'build_reps';
  // LT-3: an earn keeps the load and works the reps up to the next rung.
  if (mode === 'earn') return 'build_reps';
  return null;
}

/** A short "why" note for the next-set reason, rotated by seed. */
export function pickReasonCue(reason: string | null, seed: string): Cue | null {
  if (!reason) return null;
  const pool = CUES.filter(c => c.kind !== 'mindset' && c.reasons?.includes(reason));
  return pool.length ? pool[fnv(`${reason}|${seed}`) % pool.length]! : null;
}

/** The mindset notes, rotated through Today's quote slot on odd days of the year. */
export const MINDSET_CUES: Cue[] = CUES.filter(c => c.kind === 'mindset');
export function mindsetForDay(dayOfYear: number): Cue | null {
  if (dayOfYear % 2 === 0 || !MINDSET_CUES.length) return null;
  return MINDSET_CUES[Math.floor(dayOfYear / 2) % MINDSET_CUES.length]!;
}

/**
 * QA-R3b-7: the quote shown on the other (even) days. Counting only those days, one step per
 * quote day, so every quote comes round; days since 1970 would share their parity with the
 * day of the year and show only half of them.
 */
export function sparkIndexForDay(dayOfYear: number, year: number, count: number): number {
  if (count <= 0) return 0;
  return (Math.floor(dayOfYear / 2) + year * 7) % count;
}

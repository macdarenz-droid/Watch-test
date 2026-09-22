import type { LoggedSet, Session } from '@/core/models';
import { newId } from '@/core/models';

export function session(day: string, exercises: Array<{ id: string; name?: string; sets: LoggedSet[] }>, splitId = 'split_push'): Session {
  return {
    id: newId('s'),
    splitId,
    splitName: 'Push',
    day,
    startedAt: `${day}T17:00:00.000Z`,
    endedAt: `${day}T18:00:00.000Z`,
    durationSec: 3600,
    exercises: exercises.map(e => ({ exerciseId: e.id, name: e.name ?? e.id, sets: e.sets })),
  };
}

/** Pass `null` for effort to leave it unrated. */
export const sets = (kg: number, reps: number, effort: LoggedSet['effort'] | null = 'ideal', n = 3): LoggedSet[] =>
  Array.from({ length: n }, () => (effort ? { kg, reps, effort } : { kg, reps }));

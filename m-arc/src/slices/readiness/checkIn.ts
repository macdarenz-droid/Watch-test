import { update } from '@/core/store';
import type { CheckIn } from '@/core/models';

type Draft = Pick<CheckIn, 'sleepQuality' | 'mood'> & { soreness: NonNullable<CheckIn['soreness']> };

/** BUG-17 (RECOVERY-F5): the check-in sheet opens on today's answers, so a second visit edits instead of starting blank. */
export function checkInDraft(existing: CheckIn | undefined): Draft {
  return { sleepQuality: existing?.sleepQuality, mood: existing?.mood, soreness: { ...existing?.soreness } };
}

const defined = <T extends object>(o: T): Partial<T> => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined)) as Partial<T>;

/**
 * F2.2: one merged row per day, newest last, capped at 180 (matches AppState.checkIns' own cap).
 * BUG-17 (RECOVERY-F5): an unanswered field keeps today's earlier answer, and soreness merges per muscle.
 */
export function saveCheckIn(day: string, patch: Partial<Omit<CheckIn, 'day'>>): void {
  update(s => {
    const existing = s.checkIns.find(c => c.day === day);
    const soreness = patch.soreness ? { ...existing?.soreness, ...defined(patch.soreness) } : existing?.soreness;
    const merged: CheckIn = { ...existing, ...defined(patch), ...(soreness ? { soreness } : {}), day };
    const checkIns = [...s.checkIns.filter(c => c.day !== day), merged].sort((a, b) => a.day.localeCompare(b.day)).slice(-180);
    return { ...s, checkIns };
  });
}

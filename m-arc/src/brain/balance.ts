/**
 * Training balance over the last three weeks: push against pull, and upper
 * body against lower body. Only speaks up with enough evidence.
 */
import type { Exercise, Session } from '@/core/models';
import { MUSCLE_BY_ID, type MuscleId } from '@/data/muscles';
import { isWorkingSet } from './exposure';
import { findExercise } from '@/core/exercises';
import { addDays, weekStart } from '@/core/dates';

export interface Imbalance {
  pair: 'push_pull' | 'upper_lower';
  strong: string;
  weak: string;
  ratio: number;
  ratioLabel: string;
  severity: number;
  weeks: number;
  /** QA2-FC-8: what balanced looks like for this pair, when the plain ratio alone would mislead. */
  context?: string;
}

const LABEL = { push: 'Push', pull: 'Pull', upper: 'Upper body', lower: 'Lower body' } as const;

/** Imbalance rule thresholds. */
export const BALANCE = { weeks: 3, minTotalSets: 12, ratio: 2, persistWeeks: 2 } as const;

/**
 * QA-R3a-3/4: upper body is push plus pull (plan row 9), two regions against one, so a balanced
 * programme carries more upper sets: a full-body week (one push, one pull, one leg exercise)
 * reads 2:1 and an even upper/lower split 1:1. Upper is divided by this before comparing.
 */
export const UPPER_PER_LOWER = 1.5;

export function trainingBalance(sessions: Session[], today: string, custom: Exercise[] = [], intentionalFocus: MuscleId[] = []): Imbalance | null {
  // Per exercise set, not per muscle touched (BR-17): a bench set is one push set, however many
  // muscles it hits. Its set is split evenly across the buckets of its primary muscles.
  const start = weekStart(today);
  const bucketWeeks = Array.from({ length: BALANCE.weeks }, (_, i) => {
    const from = addDays(start, -7 * i), to = addDays(from, 7);
    const b = { push: 0, pull: 0, upper: 0, lower: 0 };
    for (const s of sessions) {
      if (s.day < from || s.day >= to) continue;
      for (const ex of s.exercises) {
        const meta = findExercise(ex.exerciseId, custom) ?? findExercise(ex.name, custom);
        if (!meta) continue;
        const working = ex.sets.filter(isWorkingSet).length;
        if (!working) continue;
        const buckets = [...new Set(meta.primary.map(m => MUSCLE_BY_ID[m].bucket))].filter((x): x is 'push' | 'pull' | 'lower' => x === 'push' || x === 'pull' || x === 'lower');
        if (!buckets.length) continue;
        const share = working / buckets.length;
        for (const k of buckets) {
          b[k] += share;
          if (k !== 'lower') b.upper += share;
        }
      }
    }
    return b;
  });
  const evaluate = (a: 'push' | 'upper', b: 'pull' | 'lower', pair: Imbalance['pair']): Imbalance | null => {
    // Sets as compared: upper is scaled to what a balanced programme carries per lower set.
    const weight = (k: 'push' | 'pull' | 'upper' | 'lower') => (k === 'upper' ? 1 / UPPER_PER_LOWER : 1);
    const totalA = bucketWeeks.reduce((s, w) => s + w[a], 0);
    const totalB = bucketWeeks.reduce((s, w) => s + w[b], 0);
    const total = totalA + totalB;
    const active = bucketWeeks.filter(w => w[a] + w[b] >= 4).length;
    if (total < BALANCE.minTotalSets || active < 2) return null;
    const [strongKey, weakKey] = totalA * weight(a) >= totalB * weight(b) ? [a, b] : [b, a];
    const strong = bucketWeeks.reduce((s, w) => s + w[strongKey], 0) * weight(strongKey);
    const weak = bucketWeeks.reduce((s, w) => s + w[weakKey], 0) * weight(weakKey);
    const ratio = weak === 0 ? (strong >= 8 ? 99 : 0) : strong / weak;
    if (ratio < BALANCE.ratio) return null;
    const persist = bucketWeeks.filter(w => {
      const s = w[strongKey] * weight(strongKey), k = w[weakKey] * weight(weakKey);
      return k === 0 ? s >= 4 : s / k >= 1.5;
    }).length;
    if (persist < BALANCE.persistWeeks) return null;
    let severity = Math.min(6, ratio) * Math.min(1.5, total / 24) * (persist / 3);
    const focusBuckets = new Set(intentionalFocus.map(m => MUSCLE_BY_ID[m].bucket));
    if (focusBuckets.has(strongKey === 'upper' ? 'push' : strongKey) || (strongKey === 'upper' && (focusBuckets.has('push') || focusBuckets.has('pull')))) severity *= 0.6;
    // The label states the plain set ratio the person can check; the decision used the scaled one.
    const rawStrong = strong / weight(strongKey), rawWeak = weak / weight(weakKey);
    const shown = rawWeak === 0 ? 99 : rawStrong / rawWeak;
    return { pair, strong: LABEL[strongKey], weak: LABEL[weakKey], ratio, ratioLabel: shown >= 4 ? '4×+' : `${Math.round(shown * 10) / 10}×`, severity, weeks: persist,
      ...(pair === 'upper_lower' ? { context: `A balanced week has about ${UPPER_PER_LOWER}× as much upper body work as lower body work, since upper covers both push and pull.` } : {}) };
  };
  const candidates = [evaluate('push', 'pull', 'push_pull'), evaluate('upper', 'lower', 'upper_lower')].filter((x): x is Imbalance => x != null);
  candidates.sort((x, y) => y.severity - x.severity);
  return candidates[0] ?? null;
}

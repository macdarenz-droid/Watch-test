/**
 * Training balance over the last three weeks: push against pull, and upper
 * body against lower body. Only speaks up with enough evidence.
 */
import type { Exercise, Session } from '@/core/models';
import { MUSCLE_BY_ID, type MuscleId } from '@/data/muscles';
import { weeklyMuscleSets } from './exposure';

export interface Imbalance {
  pair: 'push_pull' | 'upper_lower';
  strong: string;
  weak: string;
  ratio: number;
  ratioLabel: string;
  severity: number;
  weeks: number;
}

const LABEL = { push: 'Push', pull: 'Pull', upper: 'Upper body', lower: 'Lower body' } as const;

export function trainingBalance(sessions: Session[], today: string, custom: Exercise[] = [], intentionalFocus: MuscleId[] = []): Imbalance | null {
  const weeks = weeklyMuscleSets(sessions, today, 3, custom);
  const bucketWeeks = weeks.map(w => {
    const b = { push: 0, pull: 0, upper: 0, lower: 0 };
    for (const [m, v] of Object.entries(w.sets) as Array<[MuscleId, number]>) {
      const info = MUSCLE_BY_ID[m];
      if (info.bucket === 'push') { b.push += v; b.upper += v; }
      else if (info.bucket === 'pull') { b.pull += v; b.upper += v; }
      else if (info.bucket === 'lower') b.lower += v;
    }
    return b;
  });
  const evaluate = (a: 'push' | 'upper', b: 'pull' | 'lower', pair: Imbalance['pair']): Imbalance | null => {
    const totalA = bucketWeeks.reduce((s, w) => s + w[a], 0);
    const totalB = bucketWeeks.reduce((s, w) => s + w[b], 0);
    const total = totalA + totalB;
    const active = bucketWeeks.filter(w => w[a] + w[b] >= 4).length;
    if (total < 12 || active < 2) return null;
    const [strongKey, weakKey, strong, weak] = totalA >= totalB ? [a, b, totalA, totalB] : [b, a, totalB, totalA];
    const ratio = weak === 0 ? (strong >= 8 ? 99 : 0) : strong / weak;
    if (ratio < 2) return null;
    const persist = bucketWeeks.filter(w => {
      const s = w[strongKey], k = w[weakKey];
      return k === 0 ? s >= 4 : s / k >= 1.5;
    }).length;
    if (persist < 2) return null;
    let severity = Math.min(6, ratio) * Math.min(1.5, total / 24) * (persist / 3);
    const focusBuckets = new Set(intentionalFocus.map(m => MUSCLE_BY_ID[m].bucket));
    if (focusBuckets.has(strongKey === 'upper' ? 'push' : strongKey) || (strongKey === 'upper' && (focusBuckets.has('push') || focusBuckets.has('pull')))) severity *= 0.6;
    return { pair, strong: LABEL[strongKey], weak: LABEL[weakKey], ratio, ratioLabel: ratio >= 4 ? '4×+' : `${Math.round(ratio * 10) / 10}×`, severity, weeks: persist };
  };
  const candidates = [evaluate('push', 'pull', 'push_pull'), evaluate('upper', 'lower', 'upper_lower')].filter((x): x is Imbalance => x != null);
  candidates.sort((x, y) => y.severity - x.severity);
  return candidates[0] ?? null;
}

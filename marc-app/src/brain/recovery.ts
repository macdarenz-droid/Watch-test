/**
 * Muscle recovery. Each muscle gets a recovery window that depends on how
 * hard it was last trained: 24 h after easy work, 48 h after ideal, 72 h
 * after max effort. The window only ever widens with evidence, never shrinks.
 */
import type { Exercise, Session } from '@/core/models';
import { MUSCLE_IDS, type MuscleId } from '@/data/muscles';
import { findExercise } from '@/core/exercises';
import { ROLE_WEIGHT, effortOf, isWorkingSet, rolesFor } from './exposure';

export interface MuscleRecovery {
  muscle: MuscleId;
  /** 0–100. 100 means fully recovered. */
  pct: number;
  hoursLeft: number;
  windowHours: number;
  lastTrainedAt: string | null;
  lastDay: string | null;
  /** True when the window was widened from the user's own history. */
  personalized: boolean;
  recovering: boolean;
}

export function baseWindowHours(effortMult: number): number {
  const t = Math.min(1, Math.max(0, (effortMult - 0.9) / 0.2));
  return Math.round((24 + t * 48) * 100) / 100;
}

interface Touch { at: number; day: string; effortMult: number; weight: number; sets: number; volume: number }

/** Every time a muscle was worked, with role-weighted effort. */
export function muscleTouches(sessions: Session[], custom: Exercise[] = []): Record<MuscleId, Touch[]> {
  const out = Object.fromEntries(MUSCLE_IDS.map(m => [m, [] as Touch[]])) as Record<MuscleId, Touch[]>;
  for (const s of sessions) {
    const at = new Date(s.endedAt || s.startedAt).getTime();
    const perMuscle = new Map<MuscleId, { e: number; w: number; sets: number; volume: number }>();
    for (const ex of s.exercises) {
      const meta = findExercise(ex.exerciseId, custom) ?? findExercise(ex.name, custom);
      if (!meta) continue;
      const working = ex.sets.filter(isWorkingSet);
      if (!working.length) continue;
      const effort = working.reduce((a, x) => a + effortOf(x), 0) / working.length;
      const volume = working.reduce((a, x) => a + ((x.kg ?? 0) > 0 ? (x.kg ?? 0) * (x.reps ?? 0) : (x.reps ?? x.durationSec ?? 0)), 0);
      for (const r of rolesFor(meta)) {
        const w = ROLE_WEIGHT[r.role];
        const cur = perMuscle.get(r.muscle) ?? { e: 0, w: 0, sets: 0, volume: 0 };
        cur.e += effort * w; cur.w += w; cur.sets += working.length * w; cur.volume += volume * w;
        perMuscle.set(r.muscle, cur);
      }
    }
    for (const [m, v] of perMuscle) {
      out[m].push({ at, day: s.day, effortMult: v.w ? v.e / v.w : 1, weight: v.w, sets: v.sets, volume: v.volume });
    }
  }
  for (const m of MUSCLE_IDS) out[m].sort((a, b) => a.at - b.at);
  return out;
}

/**
 * Personal widening. If the user's performance on short-rest sessions was
 * clearly worse than after full rest, widen that muscle's window (up to 1.4×).
 * Needs 5 sessions in each group. Returns a multiplier of 1 when unsure.
 */
export function personalWiden(touches: Touch[]): number {
  if (touches.length < 11) return 1;
  const shortRest: number[] = [], fullRest: number[] = [];
  for (let i = 1; i < touches.length; i++) {
    const prev = touches[i - 1]!, cur = touches[i]!;
    const priors = touches.slice(Math.max(0, i - 5), i).map(t => t.volume).filter(v => v > 0);
    if (priors.length < 2 || cur.volume <= 0) continue;
    const median = [...priors].sort((a, b) => a - b)[Math.floor(priors.length / 2)]!;
    const rel = cur.volume / median;
    const gapH = (cur.at - prev.at) / 3_600_000;
    (gapH < baseWindowHours(prev.effortMult) ? shortRest : fullRest).push(rel);
  }
  if (shortRest.length < 5 || fullRest.length < 5) return 1;
  const med = (xs: number[]) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)]!;
  const ratio = med(shortRest) / med(fullRest);
  if (ratio >= 0.94) return 1;
  const severity = Math.min(1, (0.94 - ratio) / 0.94);
  return 1 + severity * 0.4;
}

export function recoveryStatus(sessions: Session[], custom: Exercise[] = [], now = Date.now()): MuscleRecovery[] {
  const touches = muscleTouches(sessions, custom);
  return MUSCLE_IDS.map(muscle => {
    const list = touches[muscle];
    const last = list[list.length - 1];
    if (!last) {
      return { muscle, pct: 100, hoursLeft: 0, windowHours: 0, lastTrainedAt: null, lastDay: null, personalized: false, recovering: false };
    }
    // Merge all touches on the most recent day (a split may hit a muscle twice).
    const sameDay = list.filter(t => t.day === last.day);
    const w = sameDay.reduce((a, t) => a + t.weight, 0);
    const effortMult = w ? sameDay.reduce((a, t) => a + t.effortMult * t.weight, 0) / w : 1;
    const widen = personalWiden(list);
    const windowHours = Math.round(baseWindowHours(effortMult) * widen);
    const elapsed = (now - last.at) / 3_600_000;
    const pct = Math.max(0, Math.min(100, Math.round((elapsed / windowHours) * 100)));
    return {
      muscle,
      pct,
      hoursLeft: Math.max(0, windowHours - elapsed),
      windowHours,
      lastTrainedAt: new Date(last.at).toISOString(),
      lastDay: last.day,
      personalized: widen > 1,
      recovering: pct < 100,
    };
  });
}

export function recoveryTier(pct: number): 'low' | 'mid' | 'high' | 'ready' {
  if (pct >= 100) return 'ready';
  if (pct >= 75) return 'high';
  if (pct >= 40) return 'mid';
  return 'low';
}

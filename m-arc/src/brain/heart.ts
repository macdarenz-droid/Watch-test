/**
 * Heart-rate aggregates (F1.1, F1.6). Pure: takes the downsampled 5-second
 * series from heartStore (6.3) and plain profile/set data, returns plain
 * numbers. The live in-memory ring, freshness state machine and storage
 * live in slices/workout/heart.ts and core/heartStore.ts, not here.
 */
import type { Effort, Profile, SessionHeart, SetHeart, SessionEnergy } from '@/core/models';
import { addDays } from '@/core/dates';

export type HrMaxSource = 'override' | 'observed' | 'tanaka' | 'default';
export interface HrMaxResult { bpm: number; source: HrMaxSource }

/** A point earlier than 12 months keeps counting as observed, but decays 25% of the way back toward Tanaka. */
const OBSERVED_MAX_STALE_MONTHS = 12;

/**
 * `observedMax`, when given, is the best plateau found by `observedHrMaxFromSeries`
 * across the user's sessions, with the timestamp it was recorded at.
 * hrMaxOverride > observed max (decayed toward Tanaka past 12 months) > Tanaka > 190 default.
 */
export function hrMax(profile: Profile, observedMax?: { bpm: number; atMs: number } | null, nowMs = Date.now()): HrMaxResult {
  if (profile.hrMaxOverride) return { bpm: Math.round(profile.hrMaxOverride), source: 'override' };
  const age = profile.birthYear ? new Date(nowMs).getFullYear() - profile.birthYear : null;
  const tanaka = age != null ? TANAKA.intercept - TANAKA.perYear * age : null;
  if (observedMax && observedMax.bpm >= 150) {
    const monthsOld = (nowMs - observedMax.atMs) / (30.44 * 86_400_000);
    // A session rarely reaches a true max, so a fresh observation never lowers the age estimate (BR-12).
    if (monthsOld <= OBSERVED_MAX_STALE_MONTHS) return { bpm: Math.round(Math.max(observedMax.bpm, tanaka ?? 0)), source: 'observed' };
    // QA-R3b-6: an old observation never lowers the age estimate either.
    if (tanaka != null) return { bpm: Math.round(Math.max(tanaka, observedMax.bpm + (tanaka - observedMax.bpm) * 0.25)), source: 'observed' };
    return { bpm: Math.round(observedMax.bpm), source: 'observed' };
  }
  if (tanaka != null) return { bpm: Math.round(tanaka), source: 'tanaka' };
  return { bpm: 190, source: 'default' };
}

/** Downsamples raw per-sample readings into 5-second buckets: the median bpm of each bucket, contact=true only. */
export function downsampleToBuckets(samples: Array<{ tSec: number; bpm: number; contact?: boolean | null }>, bucketSec = 5): Array<[number, number]> {
  const buckets = new Map<number, number[]>();
  for (const s of samples) {
    if (s.contact === false || !(s.bpm > 0)) continue;
    const b = Math.floor(s.tSec / bucketSec) * bucketSec;
    const list = buckets.get(b);
    if (list) list.push(s.bpm); else buckets.set(b, [s.bpm]);
  }
  return [...buckets.entries()].sort((a, b) => a[0] - b[0]).map(([t, bpms]) => {
    const sorted = [...bpms].sort((a, b) => a - b);
    return [t, sorted[Math.floor(sorted.length / 2)]!] as [number, number];
  });
}

/** Two 5-second points with no bucket missing between them (SCI-07). */
const adjacent = (a: [number, number], b: [number, number]): boolean => b[0] - a[0] <= 5;

/**
 * A validated max within one session's series: 5+ consecutive 5-second points within 3 bpm
 * of each other (a plateau), reached by an ascending run into it (a ramp), value <= 220.
 * SCI-07: consecutive means no missing bucket, and the ramp is the adjacent point just before the
 * plateau, below its highest point (as before); a plateau at the very start has no ramp. Anything else (a lone spike, readings scattered across a
 * disconnect, a plateau with no lead-in or one reached by a drop) is rejected as noise.
 */
export function observedHrMaxFromSeries(series: Array<[number, number]>): number | null {
  // BR-12: the highest qualifying plateau, not the first one (usually the warm-up).
  let best: number | null = null;
  for (let i = 1; i + 4 < series.length; i++) {
    const run = series.slice(i - 1, i + 5);
    if (!run.every((p, k) => k === 0 || adjacent(run[k - 1]!, p))) continue;
    const window = run.slice(1).map(p => p[1]);
    const plateauMax = Math.max(...window);
    if (plateauMax - Math.min(...window) > 3 || plateauMax > 220) continue;
    if (!(run[0]![1] < plateauMax)) continue;
    const mean = Math.round(window.reduce((a, b) => a + b, 0) / window.length);
    if (best == null || mean > best) best = mean;
  }
  return best;
}

/** 7-day median of healthDays' restingHr, or the manual override. Never inferred from a session. */
export function restingHr(healthDays: Array<{ day: string; restingHr?: number }>, profile: Profile, today: string): number | null {
  if (profile.restingHrOverride) return Math.round(profile.restingHrOverride);
  const sinceKey = addDays(today, -6);
  const values = healthDays.filter(d => d.day >= sinceKey && d.day <= today && d.restingHr != null).map(d => d.restingHr!).sort((a, b) => a - b);
  if (!values.length) return null;
  return Math.round(values[Math.floor(values.length / 2)]!);
}

/** Karvonen heart-rate-reserve boundaries at 50/60/70/80/90%, the lower edge of zones 1-5. Below b[0] is outside any zone. */
/** Zone floors as shares of heart-rate reserve (Karvonen). */
export const ZONE_RESERVE_PCTS = [0.5, 0.6, 0.7, 0.8, 0.9] as const;
/** Tanaka: 208 − 0.7 × age. */
export const TANAKA = { intercept: 208, perYear: 0.7 } as const;

export function zones(hrMaxBpm: number, restingHrBpm: number): [number, number, number, number, number] {
  const reserve = Math.max(1, hrMaxBpm - restingHrBpm);
  const at = (pct: number) => Math.round(restingHrBpm + pct * reserve);
  const [z1, z2, z3, z4, z5] = ZONE_RESERVE_PCTS;
  return [at(z1), at(z2), at(z3), at(z4), at(z5)];
}

/** -1 when below zone 1 (not counted in any zone), else 0-4 for zones 1-5. */
function zoneIndex(bpm: number, b: [number, number, number, number, number]): number {
  if (bpm < b[0]) return -1;
  return bpm < b[1] ? 0 : bpm < b[2] ? 1 : bpm < b[3] ? 2 : bpm < b[4] ? 3 : 4;
}

/** Share of the session's 5-second buckets that actually have a stored (live) sample. */
export function signalQuality(series: Array<[number, number]>, sessionSec: number): number {
  if (sessionSec <= 0) return 0;
  const expectedBuckets = Math.ceil(sessionSec / 5);
  if (expectedBuckets <= 0) return 0;
  return Math.min(1, series.length / expectedBuckets);
}

/** Peak/end/rest-start bpm for one set, from the stored series between its start and end (seconds into the session). */
export function setHeartFromWindow(series: Array<[number, number]>, setStartSec: number, setEndSec: number): SetHeart | null {
  const during = series.filter(([t]) => t >= setStartSec && t <= setEndSec);
  if (!during.length) return null;
  const peakBpm = Math.max(...during.map(([, bpm]) => bpm));
  const endBpm = during[during.length - 1]![1];
  const restStart = series.filter(([t]) => t >= setEndSec && t <= setEndSec + 10);
  const restStartBpm = restStart[0]?.[1];
  const after60 = series.filter(([t]) => t >= setEndSec + 55 && t <= setEndSec + 65);
  let hrr60: number | undefined;
  if (after60.length) {
    const sorted = after60.map(([, bpm]) => bpm).sort((a, b) => a - b);
    hrr60 = Math.round(endBpm - sorted[Math.floor(sorted.length / 2)]!);
  }
  return { peakBpm, endBpm, restStartBpm, hrr60 };
}

export interface SessionHeartInput {
  series: Array<[number, number]>;
  sessionSec: number;
  hrMaxBpm: number;
  /** Null when no source exists yet (no override, no 7-day Health Connect history). Zones are skipped, not guessed. */
  restingHrBpm: number | null;
  sets: Array<{ heart?: SetHeart }>;
  energy?: SessionEnergy;
}

/** avg/max/min, zone seconds, coverage, HRR60 median from sets that have one. Null when nothing valid was recorded. */
export function sessionHeartSummary(input: SessionHeartInput): Omit<SessionHeart, 'source' | 'deviceName'> | null {
  const { series, sessionSec, hrMaxBpm, restingHrBpm, sets, energy } = input;
  if (!series.length) return null;
  const bpms = series.map(([, bpm]) => bpm);
  const zoneSec: [number, number, number, number, number] = [0, 0, 0, 0, 0];
  if (restingHrBpm != null) {
    const boundaries = zones(hrMaxBpm, restingHrBpm);
    for (const bpm of bpms) { const z = zoneIndex(bpm, boundaries); if (z >= 0) zoneSec[z] = (zoneSec[z] ?? 0) + 5; }
  }
  const hrr60s = sets.map(s => s.heart?.hrr60).filter((x): x is number => x != null).sort((a, b) => a - b);
  const hrr60Median = hrr60s.length ? hrr60s[Math.floor(hrr60s.length / 2)] : undefined;
  return {
    samples: series.length,
    avgBpm: Math.round(bpms.reduce((a, b) => a + b, 0) / bpms.length),
    maxBpm: Math.max(...bpms),
    minBpm: Math.min(...bpms),
    hrr60Median,
    zoneSec,
    energy,
    coverage: signalQuality(series, sessionSec),
  };
}

/** The best validated observed max across stored session series, with when it was recorded, for hrMax(). */
export function bestObservedHrMax(sessions: Array<{ id: string; endedAt: string }>, seriesById: Record<string, Array<[number, number]>>): { bpm: number; atMs: number } | null {
  let best: { bpm: number; atMs: number } | null = null;
  for (const s of sessions) {
    const series = seriesById[s.id];
    if (!series?.length) continue;
    const observed = observedHrMaxFromSeries(series);
    if (observed != null && (!best || observed > best.bpm)) best = { bpm: observed, atMs: new Date(s.endedAt).getTime() };
  }
  return best;
}

/** 60s easy, 90s ideal, 120s max (6.4). Unrated counts as ideal, same as the recovery model. */
export const MIN_REST_SEC = { easy: 60, ideal: 90, max: 120 } as const;
export function minRestSec(effort: Effort | undefined): number {
  return MIN_REST_SEC[effort ?? 'ideal'];
}
/** Rest is done enough at the lower of pre-set bpm + REST_RISE_BPM and resting + REST_RESERVE_PCT of reserve. */
export const REST_RISE_BPM = 12;
export const REST_RESERVE_PCT = 0.35;

/**
 * `min(preSetBpm + 12, restingHr + 0.35 * reserve)` (6.4) — the bpm rest is "done enough" at.
 * BUG-21: with no pre-set bpm (too little signal before the set) only the reserve term is known,
 * and it is used alone; the end-of-set bpm is never a stand-in (RECOVERY-F18).
 */
export function restReadyBpm(preSetBpm: number | undefined, restingHrBpm: number, hrMaxBpm: number): number {
  const reserveTerm = restingHrBpm + REST_RESERVE_PCT * (hrMaxBpm - restingHrBpm);
  return Math.round(preSetBpm == null ? reserveTerm : Math.min(preSetBpm + REST_RISE_BPM, reserveTerm));
}

export interface RestTargetInput {
  /** Chronological, contact=true LIVE samples only; the caller drops anything else before calling. */
  recentBpms: number[];
  preSetBpm: number | undefined;
  restingHrBpm: number;
  hrMaxBpm: number;
  effort: Effort | undefined;
  elapsedSec: number;
}

export interface RestTargetResult {
  readyBpm: number;
  /** True once 3 consecutive valid samples are at or below readyBpm and elapsedSec >= the effort's minimum, or the 300s hard cap is reached. */
  ready: boolean;
}

/** HR-guided rest (F1.2). The timer stays the ceiling: callers still cap at their own totalSec. */
export function restTarget(input: RestTargetInput): RestTargetResult {
  const { recentBpms, preSetBpm, restingHrBpm, hrMaxBpm, effort, elapsedSec } = input;
  const target = restReadyBpm(preSetBpm, restingHrBpm, hrMaxBpm);
  if (elapsedSec >= 300) return { readyBpm: target, ready: true };
  const lastThree = recentBpms.slice(-3);
  const settled = lastThree.length === 3 && lastThree.every(b => b <= target);
  return { readyBpm: target, ready: settled && elapsedSec >= minRestSec(effort) };
}

export interface EffortMismatchResult {
  /** Sets rated easy whose peak was within 10% of the same exercise's hardest rated set. */
  mismatched: number;
  rated: number;
  examplePct: number;
}

const EFFORT_RANK: Record<Effort, number> = { easy: 0, ideal: 1, max: 2 };

/**
 * F1.3 (D-A1 point 5, decision P2): after 5+ rated sets with heart data in the session, an "easy"
 * set whose peak reached 90%+ of the peak of the same exercise's hardest rated set is probably
 * under-rated. Only within one exercise (App A.11): a big-muscle lift runs higher than curls at
 * the same effort. The hardest rated set is the one rated hardest (max, then ideal); its highest
 * peak is the reference. An exercise rated only easy has nothing to compare against.
 */
export function effortMismatch(exercises: Array<{ sets: Array<{ effort?: Effort; heart?: SetHeart }> }>): EffortMismatchResult | null {
  const byExercise = exercises.map(e => e.sets.filter(s => s.effort && s.heart?.peakBpm != null));
  const rated = byExercise.reduce((n, sets) => n + sets.length, 0);
  if (rated < 5) return null;
  let mismatched = 0;
  let examplePct = 0;
  for (const sets of byExercise) {
    const hardest = Math.max(-1, ...sets.map(s => EFFORT_RANK[s.effort!]));
    if (hardest <= EFFORT_RANK.easy) continue;
    const refPeak = Math.max(...sets.filter(s => EFFORT_RANK[s.effort!] === hardest).map(s => s.heart!.peakBpm));
    if (!(refPeak > 0)) continue;
    for (const s of sets) {
      if (s.effort !== 'easy' || s.heart!.peakBpm < refPeak * 0.9) continue;
      mismatched++;
      examplePct = Math.max(examplePct, Math.round(s.heart!.peakBpm / refPeak * 100));
    }
  }
  return mismatched ? { mismatched, rated, examplePct } : null;
}

/**
 * RECOVERY-F18: the heart rate just before a set began, from the series between the previous
 * commit (or the session start) and this set's commit. Rest ends at the trough and wrist HR lags
 * the set's start (App A.1), so this is the lowest 15-second median in that window. Null with
 * fewer than three 5-second points: too little signal to call it.
 */
export function preSetBpmFromWindow(series: Array<[number, number]>, fromSec: number, toSec: number): number | null {
  const bpms = series.filter(([t]) => t >= fromSec && t <= toSec).map(([, bpm]) => bpm);
  if (bpms.length < 3) return null;
  let low = Infinity;
  for (let i = 0; i + 2 < bpms.length; i++) low = Math.min(low, [...bpms.slice(i, i + 3)].sort((a, b) => a - b)[1]!);
  return low;
}

/** Appendix B "Drift and fatigue". */
export const DRIFT = { minSessionSec: 20 * 60, minSets: 6, pctAbove: 8, readySlopeAboveSec: 10, readyCapSec: 300 } as const;

export interface DriftInput {
  series: Array<[number, number]>;
  sessionSec: number;
  /** Commit time of each live working set, seconds since the session started. */
  setAtSec: number[];
  /** Needed for timeToReady only; null leaves that half out. */
  restingHrBpm: number | null;
  hrMaxBpm: number;
}

export interface DriftResult {
  drifting: boolean;
  /** 100 × (mean pre-set HR of the last 3 sets − the first 3) / the first 3. */
  driftPct: number;
  /** Least-squares slope of timeToReady in seconds per set; null with fewer than 3 known rests. */
  readySlopeSecPerSet: number | null;
  sets: number;
}

/** Least-squares slope of y over x. */
function slope(points: Array<[number, number]>): number {
  const n = points.length;
  const mx = points.reduce((a, [x]) => a + x, 0) / n;
  const my = points.reduce((a, [, y]) => a + y, 0) / n;
  const sxx = points.reduce((a, [x]) => a + (x - mx) ** 2, 0);
  return sxx ? points.reduce((a, [x, y]) => a + (x - mx) * (y - my), 0) / sxx : 0;
}

/**
 * Appendix B drift (D-A1 point 7): the pre-set HR of the last 3 sets against the first 3, only in
 * a session of 20+ min with 6+ sets that have a pre-set HR. Flags above 8%, or when timeToReady
 * (seconds after a set until 3 consecutive points sit at or below its rest-ready bpm, within the
 * 300 s cap and before the next commit) rises more than 10 s per set.
 */
export function sessionDrift(input: DriftInput): DriftResult | null {
  const { series, sessionSec, setAtSec, restingHrBpm, hrMaxBpm } = input;
  if (sessionSec < DRIFT.minSessionSec || !series.length) return null;
  const at = setAtSec.filter(t => Number.isFinite(t) && t >= 0).sort((a, b) => a - b);
  const sets = at.map((t, i) => ({ i, t, pre: preSetBpmFromWindow(series, i ? at[i - 1]! : 0, t) }));
  const known = sets.filter((s): s is { i: number; t: number; pre: number } => s.pre != null);
  if (known.length < DRIFT.minSets) return null;
  const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const first = mean(known.slice(0, 3).map(s => s.pre));
  const last = mean(known.slice(-3).map(s => s.pre));
  const driftPct = Math.round((100 * (last - first) / first) * 10) / 10;
  const ready: Array<[number, number]> = [];
  if (restingHrBpm != null) {
    for (const s of known) {
      const readyBpm = restReadyBpm(s.pre, restingHrBpm, hrMaxBpm);
      // The series runs on wall-clock seconds; sessionSec (training time, pauses out, BUG-19) is only the 20-min gate.
      const end = Math.min(s.t + DRIFT.readyCapSec, at[s.i + 1] ?? Infinity);
      const after = series.filter(([t]) => t > s.t && t <= end);
      // SCI-07: three consecutive points means three adjacent 5-second buckets, not three readings across a gap.
      const j = after.findIndex((_, k) => k + 2 < after.length && adjacent(after[k]!, after[k + 1]!) && adjacent(after[k + 1]!, after[k + 2]!) && after.slice(k, k + 3).every(([, bpm]) => bpm <= readyBpm));
      if (j >= 0) ready.push([s.i, after[j + 2]![0] - s.t]);
    }
  }
  const readySlopeSecPerSet = ready.length >= 3 ? Math.round(slope(ready) * 10) / 10 : null;
  const drifting = driftPct > DRIFT.pctAbove || (readySlopeSecPerSet != null && readySlopeSecPerSet > DRIFT.readySlopeAboveSec);
  return { drifting, driftPct, readySlopeSecPerSet, sets: known.length };
}

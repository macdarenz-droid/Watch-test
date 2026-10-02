/** Recency-weighted trend and plateau detection over an exercise's history. */
import type { ExerciseSessionSummary } from './history';
import type { ResistanceMode } from '@/core/models';
import { daysBetween } from '@/core/dates';

export type Direction = 'up' | 'flat' | 'down' | 'unknown';
export type Confidence = 'low' | 'medium' | 'high';
/** AUD-20 (SCI-11): confidence here counts data points, so its label names how much data there is, never accuracy. */
export const DATA_LABEL: Record<Confidence, string> = { high: 'Plenty of data', medium: 'Some data', low: 'Little data' };

export interface Trend {
  direction: Direction;
  /** Relative change per week as a fraction, e.g. 0.02 = 2% per week. */
  slopePerWeek: number;
  confidence: Confidence;
  points: number;
}

/** `zeroOk`: zero is a real reading (AUD-8: an assisted set with no assistance), not a missing one. */
export function trend(points: Array<{ day: string; value: number }>, zeroOk = false): Trend {
  const usable = points.filter(p => Number.isFinite(p.value) && (zeroOk ? p.value >= 0 : p.value > 0));
  if (usable.length < 4) return { direction: 'unknown', slopePerWeek: 0, confidence: 'low', points: usable.length };
  const t0 = new Date(usable[0]!.day).getTime();
  const xs = usable.map(p => (new Date(p.day).getTime() - t0) / (7 * 86_400_000));
  const ys = usable.map(p => p.value);
  const n = usable.length;
  const ws = usable.map((_, i) => 0.5 + (i / Math.max(1, n - 1)));
  const sw = ws.reduce((a, b) => a + b, 0);
  const mx = xs.reduce((a, x, i) => a + x * ws[i]!, 0) / sw;
  const my = ys.reduce((a, y, i) => a + y * ws[i]!, 0) / sw;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += ws[i]! * (xs[i]! - mx) * (ys[i]! - my); den += ws[i]! * (xs[i]! - mx) ** 2; }
  const slope = den ? num / den : 0;
  const rel = my ? slope / my : 0;
  const direction: Direction = Math.abs(rel) < 0.01 ? 'flat' : rel > 0 ? 'up' : 'down';
  const confidence: Confidence = n >= 12 ? 'high' : n > 6 ? 'medium' : 'low';
  return { direction, slopePerWeek: rel, confidence, points: n };
}

/**
 * AUD-8 (SCI-05): an assisted session's progress is its least-assisted working set, the hardest one,
 * not its most-assisted back-off. A set logged with no assistance reads as zero.
 */
export function leastHelpKg(h: ExerciseSessionSummary): number {
  const done = h.sets.filter(s => !h.held.includes(s) && (s.reps ?? 0) > 0);
  return done.length ? Math.min(...done.map(s => s.kg ?? 0)) : h.topKg;
}

/**
 * QA-R3a-2: the trend of what counts as progress for the lift's mode. Weighted: the strength
 * estimate (or top load). Bodyweight: best reps. Duration: longest hold. Assisted: the assistance
 * load, with the direction inverted (less help is up); with it flat, the best reps, as in plateauStatus.
 */
export function liftTrend(history: ExerciseSessionSummary[], mode: ResistanceMode = 'weighted'): Trend {
  const recent = history.slice(-12);
  if (mode === 'bodyweight') return trend(recent.map(h => ({ day: h.day, value: h.bestReps })));
  if (mode === 'duration') return trend(recent.map(h => ({ day: h.day, value: h.bestDurationSec })));
  if (mode === 'assisted') {
    // QA2-FC-4: not the e1RM of the assistance, which rises with more reps and would read as down.
    const help = trend(recent.map(h => ({ day: h.day, value: leastHelpKg(h) })), true);
    if (help.direction === 'up' || help.direction === 'down') return { ...help, direction: help.direction === 'up' ? 'down' : 'up', slopePerWeek: -help.slopePerWeek };
    const reps = trend(recent.map(h => ({ day: h.day, value: h.bestReps })));
    return reps.direction === 'unknown' && help.direction === 'flat' ? help : reps;
  }
  return trend(recent.map(h => ({ day: h.day, value: h.bestE1rm || h.topKg })));
}

export type PlateauStatus = 'progressing' | 'plateaued' | 'declining' | 'unknown';

/**
 * BR-04, the one plateau rule (BUG-14): a lift is plateaued only when its progress measure moved
 * less than PLATEAU_FLAT_TOTAL in total (weekly slope x weeks spanned) over the last
 * PLATEAU_WINDOW_DAYS, from PLATEAU_MIN_SESSIONS+ sessions spanning PLATEAU_MIN_SPAN_DAYS+.
 * The stalled note, the plateau lever, the weekly review, the lighter-week trigger and the
 * target's plateau mode all read plateauStatus below.
 */
export const PLATEAU_WINDOW_DAYS = 56;
export const PLATEAU_MIN_SPAN_DAYS = 42;
export const PLATEAU_MIN_SESSIONS = 6;
export const PLATEAU_FLAT_TOTAL = 0.015;
/** Below the BR-04 span, only a clear direction (never "plateaued") from the last PLATEAU_WINDOW sessions, 7+ needed. */
export const PLATEAU_WINDOW = 8;
const SHORT_MIN_SESSIONS = 7;
/** Judged sessions in the BR-04 window from which the verdict is high confidence (else medium). */
export const PLATEAU_HIGH_SESSIONS = 12;
/** Weighted lifts are judged on e1RM when at least this many sessions in the window have one. */
export const E1RM_MIN_SESSIONS = 4;

/** A break longer than this starts the lift's history over for plateau and trend (QA-R3a-6). */
export const COMEBACK_GAP_DAYS = 28;

/** The sessions since the last break longer than COMEBACK_GAP_DAYS: a comeback is not judged on months-old sessions. */
export function sinceLastBreak<T extends { day: string }>(history: T[]): T[] {
  for (let i = history.length - 1; i > 0; i--) {
    if (daysBetween(history[i - 1]!.day, history[i]!.day) > COMEBACK_GAP_DAYS) return history.slice(i);
  }
  return history;
}

type Series = Array<{ day: string; value: number }>;

/** BR-04's total change: the fitted weekly slope times the weeks the points span. Null when the trend is unknown. */
export function totalChange(points: Series, zeroOk = false): number | null {
  const t = trend(points, zeroOk);
  if (t.direction === 'unknown') return null;
  const usable = points.filter(p => Number.isFinite(p.value) && (zeroOk ? p.value >= 0 : p.value > 0));
  return t.slopePerWeek * (daysBetween(usable[0]!.day, usable[usable.length - 1]!.day) / 7);
}

/** Flat under BR-04: a known trend that moved under PLATEAU_FLAT_TOTAL in total. */
export function isFlatTotal(points: Series): boolean {
  const c = totalChange(points);
  return c != null && Math.abs(c) < PLATEAU_FLAT_TOTAL;
}

/** The BR-04 window: sessions since the last break, within PLATEAU_WINDOW_DAYS of `today` (or of the last session). */
export function plateauWindow<T extends { day: string }>(history: T[], today?: string): T[] {
  const since = sinceLastBreak(history);
  const ref = today ?? since[since.length - 1]?.day;
  return ref ? since.filter(h => daysBetween(h.day, ref) <= PLATEAU_WINDOW_DAYS) : [];
}

const bySign = (c: number): PlateauStatus => (Math.abs(c) < PLATEAU_FLAT_TOTAL ? 'plateaued' : c > 0 ? 'progressing' : 'declining');

/**
 * Whether a lift is progressing, plateaued or declining, judged by the lift's own measure.
 * Weighted: e1RM from the sessions that have one (top load, with volume as the tie-breaker, only
 * when fewer than 4 have one). Bodyweight: best reps. Duration: longest hold. Assisted (BR-06): less assistance is
 * progress, and with it flat the best reps decide. Conditioning has no measure here: unknown (VOLUME-F2).
 * "Plateaued" needs the BR-04 window (6+ sessions over 42+ days, flat under 1.5% in total); on a
 * shorter span only a clear direction over the last 8 sessions (7+) is reported, else unknown.
 */
type PlateauRow = ExerciseSessionSummary;
type PlateauPick = { rows: PlateauRow[]; main: (r: PlateauRow) => number; tie: (r: PlateauRow) => number };

/**
 * The series BR-04 judges and the path it took: 'rule' (6+ judged sessions over 42+ days in the
 * 56-day window), 'short' (the last 8 sessions since the break, 7+ needed) or 'none'.
 */
function plateauJudged(history: ExerciseSessionSummary[], mode: ResistanceMode, today?: string): { path: 'rule' | 'short' | 'none' } & PlateauPick {
  const empty = { path: 'none' as const, rows: [], main: () => 0, tie: () => 0 };
  if (mode === 'conditioning') return empty;
  // Weighted: e1RM from the sessions that have one, never mixed with top load (a 12-rep light
  // day has no e1RM); top load for all sessions, with volume as the tie-breaker, only when fewer
  // than E1RM_MIN_SESSIONS have an e1RM. A flat e1RM is flat whatever the volume (BR-04).
  const pick = (rs: PlateauRow[]): PlateauPick => {
    if (mode === 'bodyweight') return { rows: rs, main: r => r.bestReps, tie: () => 0 };
    if (mode === 'duration') return { rows: rs, main: r => r.bestDurationSec, tie: () => 0 };
    if (mode === 'assisted') return { rows: rs, main: leastHelpKg, tie: r => r.bestReps };
    const e = rs.filter(r => r.bestE1rm > 0);
    return e.length >= E1RM_MIN_SESSIONS ? { rows: e, main: r => r.bestE1rm, tie: () => 0 } : { rows: rs, main: r => r.topKg, tie: r => r.volume };
  };
  // BR-04's count, span and confidence apply to the series actually judged (e.g. only the
  // e1RM sessions), not to every session in the window.
  const judged = pick(plateauWindow(history, today));
  const jr = judged.rows;
  const span = jr.length ? daysBetween(jr[0]!.day, jr[jr.length - 1]!.day) : 0;
  if (jr.length >= PLATEAU_MIN_SESSIONS && span >= PLATEAU_MIN_SPAN_DAYS) return { path: 'rule', ...judged };
  // Too short a span for BR-04: never a plateau, only a clear direction (VOLUME-F1).
  const recent = sinceLastBreak(history).slice(-PLATEAU_WINDOW);
  if (recent.length < SHORT_MIN_SESSIONS) return empty;
  return { path: 'short', ...pick(recent) };
}

/** The sessions plateauStatus judged, on whichever path it took (empty when it had none). */
export function plateauSeries(history: ExerciseSessionSummary[], mode: ResistanceMode = 'weighted', today?: string): ExerciseSessionSummary[] {
  return plateauJudged(history, mode, today).rows;
}

/**
 * Whether a lift is progressing, plateaued or declining, judged by the lift's own measure.
 * Weighted: e1RM from the sessions that have one (top load, with volume as the tie-breaker, only
 * when fewer than 4 have one). Bodyweight: best reps. Duration: longest hold. Assisted (BR-06): less assistance is
 * progress, and with it flat the best reps decide. Conditioning has no measure here: unknown (VOLUME-F2).
 * "Plateaued" needs the BR-04 window (6+ sessions over 42+ days, flat under 1.5% in total); on a
 * shorter span only a clear direction over the last 8 sessions (7+) is reported, else unknown.
 */
export function plateauStatus(history: ExerciseSessionSummary[], mode: ResistanceMode = 'weighted', today?: string): { status: PlateauStatus; confidence: Confidence } {
  const none = { status: 'unknown' as const, confidence: 'low' as const };
  const { path, rows, main, tie } = plateauJudged(history, mode, today);
  if (path === 'none') return none;
  // Less assistance is progress (BR-06).
  const flip = mode === 'assisted' ? -1 : 1;
  const series = (f: (r: ExerciseSessionSummary) => number): Series => rows.map(r => ({ day: r.day, value: f(r) }));

  if (path === 'rule') {
    const m = totalChange(series(main), mode === 'assisted');
    const t = totalChange(series(tie));
    // Six sessions over six weeks is BR-04's evidence bar, so it is never low confidence.
    const confidence: Confidence = rows.length >= PLATEAU_HIGH_SESSIONS ? 'high' : 'medium';
    if (m != null && Math.abs(m) >= PLATEAU_FLAT_TOTAL) return { status: bySign(flip * m), confidence };
    if (t != null && (t >= PLATEAU_FLAT_TOTAL || (mode === 'assisted' && t <= -PLATEAU_FLAT_TOTAL))) return { status: bySign(t), confidence };
    if (m != null || (mode === 'assisted' && t != null)) return { status: 'plateaued', confidence };
    return none;
  }

  const m = trend(series(main), mode === 'assisted');
  const t = trend(series(tie));
  const confidence = m.confidence === 'low' ? t.confidence : m.confidence;
  if (m.direction === 'up' || m.direction === 'down') return { status: (m.direction === 'up') === (flip === 1) ? 'progressing' : 'declining', confidence };
  if (t.direction === 'up') return { status: 'progressing', confidence };
  if (mode === 'assisted' && t.direction === 'down') return { status: 'declining', confidence };
  return none;
}

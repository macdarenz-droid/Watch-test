/**
 * Personal records. The first session of an exercise is a baseline, never a
 * record. Records are about performance (heavier, stronger, more reps at a
 * load, longer hold, more distance), never about total volume.
 */
import type { Exercise, LoadUnit, LoggedSet, ResistanceMode, Session } from '@/core/models';
import { formatSetLoad, kgToDisplay } from '@/core/units';
import { exerciseHistory, heldIn, modeOf, plausibilityRef, summarizeSets, type ExerciseSessionSummary } from './history';
import { weekStart, addDays } from '@/core/dates';
import { isWorkingSet } from './exposure';
import { effectiveOneRm } from './e1rm';
import { findExercise } from '@/core/exercises';

export type PrKind = 'heaviest' | 'strength' | 'reps_at_load' | 'best_reps' | 'best_duration' | 'best_distance';

export interface PersonalRecord {
  /** The session that set it: a day can hold two sessions (QA4-7). */
  sessionId: string;
  exerciseId: string;
  exerciseName: string;
  day: string;
  kind: PrKind;
  /** Plain words, e.g. "60 kg × 8". */
  detail: string;
  value: number;
  previous: number;
  /** BUG-18 (plan 6.17.4): set by an implausible set nobody has repeated yet; only returned on request. */
  unconfirmed?: true;
}

/** A record's number in words, loads in `unit` (QA-R3b-2). */
export function formatRecordValue(kind: PrKind, v: number, unit: LoadUnit = 'kg'): string {
  if (kind === 'heaviest' || kind === 'strength') return `${kgToDisplay(v, unit)} ${unit}`;
  if (kind === 'best_duration') return `${v}s`;
  if (kind === 'best_distance') return `${v} m`;
  return `${v} reps`;
}

export const PR_LABEL: Record<PrKind, string> = {
  heaviest: 'Heaviest load',
  strength: 'Strength estimate',
  reps_at_load: 'More reps at a load',
  best_reps: 'Most reps',
  best_duration: 'Longest hold',
  best_distance: 'Furthest carry',
};

/** BUG-18: the sets a summary's numbers come from (held sets left out). */
const trusted = (r: ExerciseSessionSummary): LoggedSet[] => r.sets.filter(s => !r.held.includes(s));

function repsAtLoadMap(rows: ExerciseSessionSummary[]): Map<number, number> {
  const m = new Map<number, number>();
  for (const r of rows) for (const s of trusted(r)) {
    if ((s.kg ?? 0) > 0 && (s.reps ?? 0) > 0) m.set(s.kg!, Math.max(m.get(s.kg!) ?? 0, s.reps!));
  }
  return m;
}

/** Records set in `current`, given all `prior` sessions of the same exercise. */
/** BR-28: details read in `unit`, and a set typed in that unit reads exactly as typed. */
/** F2: drop sets count for volume but never set or hold a record. */
function withoutDrops(r: ExerciseSessionSummary): ExerciseSessionSummary {
  return r.sets.some(s => s.kind === 'drop') ? summarizeSets(r.sessionId, r.day, r.sets.filter(s => s.kind !== 'drop'), s => r.held.includes(s)) : r;
}

/**
 * BUG-18 (plan 6.13 records row; PROGRESSION-F14, COACHRULES-F19): the e1RM a strength record can
 * come from. Only sets of 10 reps or fewer at ideal or max (unrated reads as ideal, as in e1rm.ts),
 * never an easy-rated set, and never a load and rep count already done before: a new effort label
 * on the same lift is not a stronger lift.
 */
function recordE1rm(current: ExerciseSessionSummary, prior: ExerciseSessionSummary[]): number {
  const done = prior.flatMap(trusted);
  const fresh = trusted(current).filter(s => s.effort !== 'easy' && !done.some(p => (p.kg ?? 0) >= (s.kg ?? 0) && (p.reps ?? 0) >= (s.reps ?? 0)));
  return Math.max(0, ...fresh.map(s => effectiveOneRm(s.kg ?? 0, s.reps ?? 0, s.effort) ?? 0));
}

export interface RecordOpts {
  /** Also return, marked `unconfirmed`, the records only a held set would set. */
  unconfirmed?: boolean;
  /** Working sets logged after `current`: one that repeats a flagged load confirms it. */
  later?: LoggedSet[];
  /** Main lift (the 30-rep line); defaults to the library's role for `exerciseId`. */
  isMain?: boolean;
}

/**
 * `opts.unconfirmed` also returns, marked `unconfirmed`, the records only a held set would set
 * (BUG-18). Everything that celebrates or counts records leaves it off.
 */
export function recordsFor(currentIn: ExerciseSessionSummary, priorIn: ExerciseSessionSummary[], mode: ResistanceMode, exerciseId: string, exerciseName: string, unit: LoadUnit = 'kg', opts: RecordOpts = {}): PersonalRecord[] {
  // BUG-18: which of `current`'s sets are held is judged here, against `prior`, so a caller that
  // summarised the session on its own (the post-session debrief) cannot celebrate a typo.
  const ref = plausibilityRef(priorIn, opts.isMain ?? findExercise(exerciseId)?.role === 'main');
  const isHeld = heldIn(currentIn.sets, opts.later ?? [], ref, mode === 'weighted' || mode === 'conditioning');
  const current = summarizeSets(currentIn.sessionId, currentIn.day, currentIn.sets, isHeld);
  const confirmed = confirmedRecords(current, priorIn, mode, exerciseId, exerciseName, unit);
  if (!opts.unconfirmed || !current.held.length) return confirmed;
  const asIf = summarizeSets(currentIn.sessionId, currentIn.day, currentIn.sets);
  const extra = confirmedRecords(asIf, priorIn, mode, exerciseId, exerciseName, unit).filter(r => !confirmed.some(c => c.kind === r.kind));
  return [...confirmed, ...extra.map(r => ({ ...r, unconfirmed: true as const }))];
}

function confirmedRecords(currentIn: ExerciseSessionSummary, priorIn: ExerciseSessionSummary[], mode: ResistanceMode, exerciseId: string, exerciseName: string, unit: LoadUnit): PersonalRecord[] {
  if (!priorIn.length) return [];
  const current = withoutDrops(currentIn);
  const prior = priorIn.map(withoutDrops);
  const out: PersonalRecord[] = [];
  const base = { sessionId: current.sessionId, exerciseId, exerciseName, day: current.day };
  if (mode === 'weighted' || mode === 'conditioning') {
    const prevTop = Math.max(0, ...prior.map(p => p.topKg));
    const topSet = trusted(current).find(s => s.kg === current.topKg) ?? { kg: current.topKg };
    if (current.topKg > prevTop && prevTop > 0) out.push({ ...base, kind: 'heaviest', detail: `${formatSetLoad(topSet, unit)} × ${current.topReps}`, value: current.topKg, previous: prevTop });
    const prevE = Math.max(0, ...prior.map(p => p.bestE1rm));
    const e1 = recordE1rm(current, prior);
    if (prevE > 0 && e1 > prevE * 1.025) out.push({ ...base, kind: 'strength', detail: `about ${Math.round(kgToDisplay(e1, unit))} ${unit} one-rep estimate`, value: Math.round(e1 * 10) / 10, previous: Math.round(prevE * 10) / 10 });
    const atLoad = repsAtLoadMap(prior);
    for (const s of trusted(current)) {
      const prevReps = atLoad.get(s.kg ?? -1);
      if (prevReps != null && (s.reps ?? 0) > prevReps && !out.some(o => o.kind === 'reps_at_load')) {
        out.push({ ...base, kind: 'reps_at_load', detail: `${s.reps} reps at ${formatSetLoad(s, unit)}`, value: s.reps!, previous: prevReps });
      }
    }
  }
  if (mode === 'bodyweight' || mode === 'assisted') {
    // AUD-8 (SCI-05): a rep record beats the prior sets done with as much help or as little added
    // load, never an easier set's reps against a harder one. No load logged reads as zero.
    const done = prior.flatMap(trusted);
    const asEasy = (p: LoggedSet, s: LoggedSet) => (mode === 'assisted' ? (p.kg ?? 0) >= (s.kg ?? 0) : (p.kg ?? 0) <= (s.kg ?? 0));
    let best: { reps: number; prev: number } | null = null;
    for (const s of trusted(current)) {
      const reps = s.reps ?? 0;
      const prev = Math.max(0, ...done.filter(p => asEasy(p, s)).map(p => p.reps ?? 0));
      if (prev > 0 && reps > prev && (!best || reps > best.reps)) best = { reps, prev };
    }
    if (best) out.push({ ...base, kind: 'best_reps', detail: `${best.reps} reps`, value: best.reps, previous: best.prev });
  }
  if (mode === 'duration' || mode === 'conditioning') {
    const prev = Math.max(0, ...prior.map(p => p.bestDurationSec));
    if (current.bestDurationSec > prev && prev > 0) out.push({ ...base, kind: 'best_duration', detail: `${current.bestDurationSec}s`, value: current.bestDurationSec, previous: prev });
  }
  if (mode === 'conditioning') {
    const prev = Math.max(0, ...prior.map(p => p.bestDistanceM));
    if (current.bestDistanceM > prev && prev > 0) out.push({ ...base, kind: 'best_distance', detail: `${current.bestDistanceM} m`, value: current.bestDistanceM, previous: prev });
  }
  return out;
}

/** Every record across all sessions, newest first. */
export function allRecords(sessions: Session[], custom: Exercise[] = [], unit: LoadUnit = 'kg'): PersonalRecord[] {
  const names = new Map<string, string>();
  for (const s of sessions) for (const e of s.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, e.name);
  const out: PersonalRecord[] = [];
  for (const [id, name] of names) {
    const hist = exerciseHistory(sessions, id, custom);
    const mode = modeOf(id, custom);
    const isMain = findExercise(id, custom)?.role === 'main';
    hist.forEach((row, i) => out.push(...recordsFor(row, hist.slice(0, i), mode, id, name, unit, { isMain, later: hist.slice(i + 1).flatMap(h => h.sets) })));
  }
  return out.sort((a, b) => b.day.localeCompare(a.day));
}

export function recordsInWeek(sessions: Session[], today: string, custom: Exercise[] = [], unit: LoadUnit = 'kg'): PersonalRecord[] {
  const start = weekStart(today);
  const end = addDays(start, 7);
  return allRecords(sessions, custom, unit).filter(r => r.day >= start && r.day < end);
}

export type LiveRecordStatus = 'none' | 'record' | 'unconfirmed';

/**
 * Live check while logging: would this set be a record right now? BUG-18: a set the plausibility
 * check flags reads 'unconfirmed' until another set in `sessionSets` (today's sets of this
 * exercise) repeats its load.
 */
export function liveRecordStatus(sessions: Session[], exerciseId: string, set: LoggedSet, custom: Exercise[] = [], sessionSets: LoggedSet[] = []): LiveRecordStatus {
  if (!isWorkingSet(set) || set.kind === 'drop') return 'none';
  const hist = exerciseHistory(sessions, exerciseId, custom);
  if (!hist.length) return 'none';
  const mode = modeOf(exerciseId, custom);
  const current = summarizeSets('live', '9999-12-31', [set]);
  const recs = recordsFor(current, hist, mode, exerciseId, '', 'kg', { unconfirmed: true, isMain: findExercise(exerciseId, custom)?.role === 'main', later: sessionSets.filter(o => o !== set && isWorkingSet(o)) });
  return !recs.length ? 'none' : recs.some(r => !r.unconfirmed) ? 'record' : 'unconfirmed';
}

export function isLiveRecord(sessions: Session[], exerciseId: string, set: LoggedSet, custom: Exercise[] = []): boolean {
  return liveRecordStatus(sessions, exerciseId, set, custom) === 'record';
}

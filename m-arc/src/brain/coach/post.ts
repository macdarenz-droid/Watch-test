/**
 * Post-session debrief (6.13, cadence 'post'): computed once when a session
 * finishes and stored with it (Session.debrief), so later renders show the
 * same numbers rather than drifting as history grows.
 */
import type { Exercise, LoadUnit, Session } from '@/core/models';
import { kgToDisplay } from '@/core/units';
import { exerciseHistory, modeOf, type ExerciseSessionSummary } from '../history';
import { formatRecordValue, recordsFor } from '../prs';
import { findExercise } from '@/core/exercises';
import { effortLabel, firstWorkingSet, isWorkingSet } from '../exposure';
import { RIR_BY_EFFORT } from '../e1rm';
import { rirMid } from '../retarget';
import type { Insight } from './rules';
import { DEFAULT_GOAL, GOAL_BY_ID, type GoalId } from '@/data/goals';

/** Records set in this session, tiered by kind, only from sets logged live (timing-independent content is fine at any fidelity). */
export function recordsInsight(session: Session, priorSessions: Session[], custom: Exercise[] = [], unit: LoadUnit = 'kg'): Insight[] {
  const out: Insight[] = [];
  for (const ex of session.exercises) {
    const meta = findExercise(ex.exerciseId, custom);
    const hist = exerciseHistory(priorSessions, ex.exerciseId, custom);
    const current: ExerciseSessionSummary = exerciseHistory([session], ex.exerciseId, custom)[0]!;
    if (!current) continue;
    const mode = modeOf(ex.exerciseId, custom);
    const records = recordsFor(current, hist, mode, ex.exerciseId, meta?.name ?? ex.name, unit);
    for (const r of records) {
      out.push({
        id: `post:record:${session.id}:${r.exerciseId}:${r.kind}`, category: 'progress', priority: 310, cadence: 'post', kind: 'praise',
        exerciseId: r.exerciseId,
        title: `${r.exerciseName}: new record`,
        noticed: r.kind === 'strength' ? `${r.detail}, up from about ${Math.round(kgToDisplay(r.previous, unit))} ${unit}.` : `${r.detail}, up from ${formatRecordValue(r.kind, r.previous, unit)}.`,
        means: 'That is a genuine personal best, not just a bigger number from more sets.',
        action: 'Nothing to do. Keep logging honestly and it will keep tracking.',
        evidence: { n: hist.length, window: `${hist.length} prior sessions`, confidence: hist.length >= 5 ? 'high' : 'medium' },
      });
    }
  }
  return out;
}

/** Effort shares of a session's rated working sets (a failure set is max); null under 4 rated sets. */
function effortMix(session: Session): { n: number; easy: number; ideal: number; max: number } | null {
  const rated = session.exercises.flatMap(e => e.sets).filter(isWorkingSet).filter(s => effortLabel(s));
  if (rated.length < 4) return null;
  const share = (e: 'easy' | 'ideal' | 'max') => rated.filter(s => effortLabel(s) === e).length / rated.length;
  return { n: rated.length, easy: share('easy'), ideal: share('ideal'), max: share('max') };
}

/** Over 60 % easy sets reads as mostly easy (COACHING-PLAN 6.13 "Effort mix"). */
export const EASY_SHARE_FLAG = 0.6;
type MixFlag = 'max' | 'easy' | null;
const mixFlag = (m: { easy: number; max: number }, cap: number): MixFlag => (m.max > cap ? 'max' : m.easy > EASY_SHARE_FLAG ? 'easy' : null);

/**
 * Shares of easy/ideal/max for the session, flagged if heavily skewed either way.
 * ADAPT-5 (E-3): the max-effort line is the goal's `failureShareCap`. When `opts.previous` is given
 * (the debrief always gives it; null for none), a flag fires only when the previous session of the
 * split had the same flag: one noisy session is not a pattern (plan 6.13: two sessions of a split).
 */
export function effortMixInsight(session: Session, opts?: { goal?: GoalId; previous?: Session | null }): Insight | null {
  const m = effortMix(session);
  if (!m) return null;
  const g = GOAL_BY_ID[opts?.goal ?? DEFAULT_GOAL];
  const { easy, ideal, max } = m;
  const pct = (v: number) => Math.round(v * 100);
  const flag = mixFlag(m, g.failureShareCap);
  if (!flag) {
    return {
      id: `post:effort-mix:${session.id}`, category: 'progress', priority: 150, cadence: 'post', kind: 'data',
      title: `Effort mix: ${pct(easy)}% easy, ${pct(ideal)}% ideal, ${pct(max)}% max`,
      noticed: `Effort mix: ${pct(easy)}% easy, ${pct(ideal)}% ideal, ${pct(max)}% max.`,
      means: 'A healthy spread for most goals: stopping a couple of reps short of failure grows muscle nearly as well, with less fatigue.',
      action: 'No change needed.',
      evidence: { n: m.n, window: 'this session', confidence: 'high' },
    };
  }
  let window = 'this session';
  if (opts && 'previous' in opts) {
    const prev = opts.previous ? effortMix(opts.previous) : null;
    if (!prev || mixFlag(prev, g.failureShareCap) !== flag) return null;
    window = `this session and your last ${session.splitName}`;
  }
  if (flag === 'max') {
    return {
      id: `post:effort-mix:${session.id}`, category: 'progress', priority: 200, cadence: 'post', kind: 'tip',
      title: `Effort mix: ${pct(max)}% max effort`,
      noticed: `${pct(max)}% of rated sets were max effort${window === 'this session' ? '' : `, as last ${session.splitName}`}; your goal keeps it under ${pct(g.failureShareCap)}%.`,
      means: 'Frequent failure adds fatigue without much extra growth or strength.',
      action: 'Save max effort for the last set of an exercise.',
      evidence: { n: m.n, window, confidence: 'high' },
    };
  }
  return {
    id: `post:effort-mix:${session.id}`, category: 'progress', priority: 150, cadence: 'post', kind: 'tip',
    title: `Effort mix: ${pct(easy)}% easy`,
    noticed: `${pct(easy)}% of rated sets were easy${window === 'this session' ? '' : `, as last ${session.splitName}`}.`,
    means: 'Mostly-easy sets leave growth on the table over time.',
    action: `Push a couple of sets closer to ideal effort next time: ${g.rir[0]}–${g.rir[1]} reps in reserve for your goal.`,
    evidence: { n: m.n, window, confidence: 'high' },
  };
}

/** Median rest before compound sets, and whether reps fell off across the session. */
/**
 * BR-20: judged per main exercise with 3+ working sets, never across different lifts. Reps fell
 * when an exercise's last set has 25% fewer reps than its first. The rest median leaves out each
 * exercise's first set (its "rest" is the changeover from the last exercise).
 */
/**
 * ADAPT-5 (E-4): the rest line is the goal's `restDefaultSec` (a boolean is the old strength flag:
 * true = 'strength'). `restSettingSec` is the user's timer when auto-rest is on; below the line, the
 * action names it.
 */
export function restAndDensityInsight(session: Session, goal: GoalId | boolean, custom: Exercise[] = [], restSettingSec?: number): Insight | null {
  const mains = session.exercises
    .filter(e => findExercise(e.exerciseId, custom)?.role === 'main')
    .map(e => e.sets.filter(isWorkingSet))
    .filter(sets => sets.length >= 3);
  const rests = mains.flatMap(sets => sets.slice(1)).map(s => s.restSec).filter((r): r is number => r != null).sort((a, b) => a - b);
  if (rests.length < 3) return null;
  const medianRest = rests[Math.floor(rests.length / 2)]!;
  const fell = mains.map(sets => ({ first: sets[0]!.reps ?? 0, last: sets[sets.length - 1]!.reps ?? 0 })).filter(x => x.first > 0 && (x.first - x.last) / x.first >= 0.25);
  const threshold = GOAL_BY_ID[typeof goal === 'boolean' ? (goal ? 'strength' : DEFAULT_GOAL) : goal].restDefaultSec;
  if (medianRest >= threshold || !fell.length) return null;
  const firstReps = fell[0]!.first, lastReps = fell[0]!.last;
  const compoundSets = mains.flat();
  return {
    id: `post:rest:${session.id}`, category: 'progress', priority: 180, cadence: 'post', kind: 'tip',
    title: `Median rest ${medianRest}s`,
    noticed: `Median rest before sets was ${medianRest}s, and reps on a main lift fell from ${firstReps} on the first set to ${lastReps} on the last.`,
    means: `On heavy sets, ${threshold} seconds or more keeps reps up.`,
    action: restSettingSec != null && restSettingSec < threshold ? `Your rest timer is set to ${restSettingSec}s; try ${threshold}s before heavy sets.` : 'Take a little longer before the next heavy set.',
    evidence: { n: compoundSets.length, window: 'this session', confidence: 'medium' },
  };
}

/** |Delta duration| vs the median of the split's last 5 sessions. */
export function durationDriftInsight(session: Session, priorSameSplit: Session[]): Insight | null {
  if (priorSameSplit.length < 5) return null;
  const durations = [...priorSameSplit].sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(-5).map(s => s.durationSec).sort((a, b) => a - b);
  const median = durations[Math.floor(durations.length / 2)]!;
  if (median <= 0) return null;
  const delta = (session.durationSec - median) / median;
  if (Math.abs(delta) < 0.2) return null;
  const minutes = (sec: number) => Math.round(sec / 60);
  return {
    id: `post:duration:${session.id}`, category: 'data', priority: 130, cadence: 'post', kind: 'data',
    title: `${minutes(session.durationSec)} min, ${delta > 0 ? 'longer' : 'shorter'} than usual`,
    noticed: `Ran ${minutes(session.durationSec)} min, your usual for ${session.splitName} is about ${minutes(median)} min.`,
    means: delta > 0 ? 'Idle time between sets is the most common cause.' : 'A tighter session, or fewer sets than usual.',
    action: delta > 0 ? 'Short on time next time? Superset the last couple of accessories.' : 'No change needed if everything got logged.',
    evidence: { n: priorSameSplit.length, window: `${priorSameSplit.length} sessions`, confidence: 'medium' },
  };
}

/**
 * LT-3 (§4): set 1 against the target stored at its commit, one line per lift that went off plan. The plan is read
 * at the goal's shown effort (RIR 2 without a goal), the set at its own; the ratio form never shows a max (D-A4 c).
 * Records are untouched (prs.ts).
 */
export function planVerdictInsights(session: Session, goal?: GoalId, unit: LoadUnit = 'kg'): Insight[] {
  const out: Insight[] = [];
  const rir = goal ? rirMid(goal) : 2;
  for (const ex of session.exercises) {
    const t = ex.target;
    const s1 = firstWorkingSet(ex.sets.filter(isWorkingSet));
    if (!t || !s1 || !(s1.kg! > 0) || !(s1.reps! > 0)) continue;
    if (Math.abs(s1.kg! - t.kg) < 0.011 && s1.reps === t.reps) continue;
    const did = s1.kg! * (1 + (s1.reps! + RIR_BY_EFFORT[effortLabel(s1) ?? 'ideal']) / 30);
    const plan = t.kg * (1 + (t.reps + rir) / 30);
    const pct = Math.round((did / plan - 1) * 100);
    const v = (kg: number) => kgToDisplay(kg, unit);
    const head = `Planned ${v(t.kg)} × ${t.reps}, did ${v(s1.kg!)} × ${s1.reps}`;
    const line = pct >= 1 ? `${head}: estimated strength up about ${pct} %.` : pct <= -1 ? `${head}: below plan, the next target holds.` : `${head}: on plan in estimated strength.`;
    out.push({
      id: `post:verdict:${session.id}:${ex.exerciseId}`, category: 'progress', priority: 190, cadence: 'post', kind: 'data', exerciseId: ex.exerciseId,
      title: `${ex.name}: plan vs done`,
      noticed: line,
      means: pct <= -1 ? 'One set under the plan does not move the target.' : 'The next target is set from the plan and what you lifted.',
      action: 'Nothing to do. The next session shows the new target.',
      evidence: { n: 1, window: 'this session', confidence: 'medium' },
    });
  }
  return out;
}

export interface PostSessionInput {
  session: Session;
  priorSessions: Session[];
  custom: Exercise[];
  /** ADAPT-5: the current goal (rest line, effort cap); LT-3: the plan-vs-done line's effort. */
  goal?: GoalId;
  /** Old flag, read only when `goal` is left out: true = 'strength', false = DEFAULT_GOAL. */
  isStrengthGoal?: boolean;
  /** ADAPT-5 (E-4): the rest timer setting, given only when auto-rest is on. */
  restSettingSec?: number;
  /** The display unit for record text (BR-28). */
  unit?: LoadUnit;
}

export function postSessionInsights(input: PostSessionInput, limit = 4): Insight[] {
  const { session, priorSessions, custom } = input;
  const goal: GoalId = input.goal ?? (input.isStrengthGoal ? 'strength' : DEFAULT_GOAL);
  const priorSameSplit = priorSessions.filter(s => s.splitId === session.splitId);
  const previous = priorSameSplit.filter(s => s.startedAt < session.startedAt).sort((a, b) => a.startedAt.localeCompare(b.startedAt)).at(-1) ?? null;
  // Rest, density and duration drift need a session whose timing can be trusted (6.17.4); content-only
  // rows (records, effort mix) accept every logging fidelity.
  const timingTrusted = session.logging?.timingTrusted ?? true;
  const out: Insight[] = [
    ...recordsInsight(session, priorSessions, custom, input.unit ?? 'kg'),
    ...planVerdictInsights(session, input.goal, input.unit ?? 'kg'),
    effortMixInsight(session, { goal, previous }),
    timingTrusted ? restAndDensityInsight(session, goal, custom, input.restSettingSec) : null,
    timingTrusted ? durationDriftInsight(session, priorSameSplit) : null,
  ].filter((i): i is Insight => !!i);
  return out.sort((a, b) => b.priority - a.priority).slice(0, limit);
}

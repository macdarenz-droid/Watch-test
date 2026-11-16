/**
 * Weekly review (6.13 "weekly review" cadence): generated on the first app
 * open of a new week, once the week reached the user's planned sessions (ADAPT-4).
 * Each function below is one catalogue row; weeklyReviewInsights() assembles
 * the ones with enough evidence into Insight v2 objects.
 */
import type { Deload, Exercise, LoadUnit, Profile, Session, WeightEntry } from '@/core/models';
import { inLighterWeek } from '../deload';
import { kgToDisplay } from '@/core/units';
import type { GoalId } from '@/data/goals';
import { GOAL_BY_ID } from '@/data/goals';
import { MUSCLE_IDS, muscleLabel, type MuscleId } from '@/data/muscles';
import { findExercise } from '@/core/exercises';
import { effectiveSetsByMuscle, effortLabel, isWorkingSet, ROLE_WEIGHT, rolesFor } from '../exposure';
import { exerciseHistory, isActive, modeOf, type ExerciseSessionSummary } from '../history';
import { isFlatTotal, plateauSeries, plateauStatus, sinceLastBreak, trend } from '../trend';
import { weekStart, addDays, daysBetween, weekdayOf } from '@/core/dates';
import { withoutGated, type Insight, type Sharing } from './rules';
import { fullWeekSessions, type WeekPlan } from '../weekly';
import { muscleVolumeStatus } from '../volume';

/** Hard sets per muscle for the calendar week containing `today`: the shared count without easy sets (BR-16). */
export function hardSetsThisWeek(sessions: Session[], today: string, custom: Exercise[] = []): Partial<Record<MuscleId, number>> {
  const start = weekStart(today);
  return effectiveSetsByMuscle(sessions, start, addDays(start, 7), custom, { countEasy: false });
}

export type VolumeBand = 'low' | 'maintenance' | 'productive' | 'high';
export function volumeBand(hardSets: number): VolumeBand {
  if (hardSets < 4) return 'low';
  if (hardSets < 10) return 'maintenance';
  if (hardSets <= 20) return 'productive';
  return 'high';
}

/** Sessions with 2+ primary working sets for a muscle, within the calendar week. */
export function frequencyThisWeek(sessions: Session[], today: string, muscle: MuscleId, custom: Exercise[] = []): number {
  const start = weekStart(today);
  const end = addDays(start, 7);
  let count = 0;
  for (const s of sessions) {
    if (s.day < start || s.day >= end) continue;
    let primarySets = 0;
    for (const ex of s.exercises) {
      const meta = findExercise(ex.exerciseId, custom);
      if (!meta?.primary.includes(muscle)) continue;
      primarySets += ex.sets.filter(isWorkingSet).length;
    }
    if (primarySets >= 2) count++;
  }
  return count;
}

/** Share of working sets rated max (a failure set is max), over the given sessions. */
export function failureShare(sessions: Session[]): number {
  const sets = sessions.flatMap(s => s.exercises.flatMap(e => e.sets)).filter(isWorkingSet);
  if (!sets.length) return 0;
  return sets.filter(s => effortLabel(s) === 'max').length / sets.length;
}

/** e1RM trend for one exercise, reusing the shared recency-weighted regression. */
export function e1rmTrend(hist: ExerciseSessionSummary[]) {
  return trend(hist.filter(h => h.bestE1rm > 0).map(h => ({ day: h.day, value: h.bestE1rm })));
}

/** Reference monthly progress rate by training age, from Appendix D. */
export function expectedMonthlyRatePct(trainingAgeMonths: number | null): [number, number] {
  if (trainingAgeMonths == null || trainingAgeMonths < 12) return [1, 4];
  if (trainingAgeMonths < 36) return [0.5, 1];
  return [0.2, 0.5];
}

/**
 * Flat means the e1RM moved less than 1.5% in total over the window (BR-04): the fitted
 * weekly slope times the weeks the window spans, not the weekly slope alone. The same test
 * plateauStatus uses (BUG-14).
 */
export function flatOver(recent: ExerciseSessionSummary[]): boolean {
  return isFlatTotal(recent.filter(h => h.bestE1rm > 0).map(h => ({ day: h.day, value: h.bestE1rm })));
}

/** True once a lift's load, effort and e1RM have not moved over the last `weeks` weeks, with a session in most of them. */
export function isStale(hist: ExerciseSessionSummary[], today: string, weeks = 6): boolean {
  const recent = hist.filter(h => daysBetween(h.day, today) <= weeks * 7);
  if (recent.length < weeks) return false;
  const sameLoad = new Set(recent.map(r => r.topKg)).size <= 1;
  const effortOk = recent.every(r => r.hasMax || r.effortCoverage > 0);
  return sameLoad && effortOk && flatOver(recent);
}

/** Rolling adherence over the last `days` days: planned days done / planned days that have passed. */
export function adherenceRate(sessions: Session[], schedule: Record<string, string | null>, today: string, days = 28, daysOff: string[] = []): number | null {
  const doneDays = new Set(sessions.map(s => s.day));
  const off = new Set(daysOff);
  let planned = 0, done = 0;
  // Today only counts once it has a session: an unfinished planned day is not a miss yet (BR-15).
  for (let i = doneDays.has(today) ? 0 : 1; i < days; i++) {
    const day = addDays(today, -i);
    const weekday = weekdayOf(day);
    if (!schedule[weekday] || off.has(day)) continue;
    planned++;
    if (doneDays.has(day)) done++;
  }
  return planned > 0 ? done / planned : null;
}

/** Exponentially weighted moving average of a weight log, and its weekly rate as % of body weight. */
/**
 * The weigh-in trend (BR-14): a least-squares line through the last 28 days (7+ entries spanning
 * 14+ days), as % of the mean weight per week. `trendKg` is the line's value on the last day.
 * The old EWMA started at the first entry and lagged, so a real loss read as half of it.
 * Given `today`, the 28 days end today, so an old log gives no current trend (AUD-9 OBS-WEIGHT).
 */
export function weightTrendPctPerWeek(log: WeightEntry[], today?: string): { trendKg: number; pctPerWeek: number } | null {
  const sorted = [...log].filter(e => today == null || e.day <= today).sort((a, b) => a.day.localeCompare(b.day));
  if (!sorted.length) return null;
  const lastDay = today ?? sorted[sorted.length - 1]!.day;
  const recent = sorted.filter(e => daysBetween(e.day, lastDay) < 28);
  if (recent.length < 7) return null;
  const xs = recent.map(e => daysBetween(recent[0]!.day, e.day));
  if (xs[xs.length - 1]! < 14) return null;
  const ys = recent.map(e => e.kg);
  const n = xs.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i]! - mx) * (ys[i]! - my); den += (xs[i]! - mx) ** 2; }
  if (!den || !my) return null;
  const slopePerDay = num / den;
  const trendKg = my + slopePerDay * (xs[n - 1]! - mx);
  const pctPerWeek = (slopePerDay * 7 / my) * 100;
  return { trendKg: Math.round(trendKg * 10) / 10, pctPerWeek: Math.round(pctPerWeek * 100) / 100 };
}

/** Share of main-lift working sets in each rep band, for the week. */
export function repMixShares(sessions: Session[], today: string, custom: Exercise[] = []): { low: number; mid: number; high: number; n: number; easyHighShare: number } {
  const start = weekStart(today);
  const end = addDays(start, 7);
  const sets = sessions
    .filter(s => s.day >= start && s.day < end)
    .flatMap(s => s.exercises.flatMap(e => (findExercise(e.exerciseId, custom)?.role === 'main' ? e.sets : [])))
    .filter(isWorkingSet)
    .filter(s => isWorkingSet(s) && (s.reps ?? 0) > 0);
  const n = sets.length;
  if (!n) return { low: 0, mid: 0, high: 0, n: 0, easyHighShare: 0 };
  const low = sets.filter(s => s.reps! <= 5).length / n;
  const mid = sets.filter(s => s.reps! >= 6 && s.reps! <= 12).length / n;
  const high = sets.filter(s => s.reps! >= 13).length / n;
  const easyHigh = sets.filter(s => s.reps! >= 13 && effortLabel(s) === 'easy').length;
  return { low, mid, high, n, easyHighShare: easyHigh / n };
}

export interface WeeklyReviewInput {
  sessions: Session[];
  today: string;
  custom: Exercise[];
  schedule: Record<string, string | null>;
  goal: GoalId;
  profile: Profile;
  weightLog: WeightEntry[];
  trainingAgeMonths: number | null;
  exerciseIds: Array<{ id: string; name: string }>;
  /** RG-19: days taken off count as unscheduled. */
  daysOff?: string[];
  /** QA-R3b-5: body weight in the person's unit. */
  unit?: LoadUnit;
  /** BUG-20: when given (the coach), a gated insight is left out unless its data is shared. */
  sharing?: Sharing;
  /** BUG-15: the saved lighter week; its sessions are not trend or decline evidence. */
  deload?: Deload | null;
}

/**
 * ADAPT-4 (C-5): the week the review covers, as its Monday: this week once it reached the planned
 * sessions, else the week just ended when that one did, else null (no review yet).
 * Planned = the schedule minus days off, else Profile.plannedDays, else 3; never below 2.
 */
export function reviewWeek(sessions: Session[], today: string, plan?: WeekPlan): string | null {
  const count = (start: string) => sessions.filter(s => s.day >= start && s.day < addDays(start, 7)).length;
  const thisWeek = weekStart(today);
  const lastWeek = addDays(thisWeek, -7);
  if (count(thisWeek) >= fullWeekSessions(plan, thisWeek)) return thisWeek;
  if (count(lastWeek) >= fullWeekSessions(plan, lastWeek)) return lastWeek;
  return null;
}

/** True once this week or the week just ended reached the planned sessions (ADAPT-4, was 5 logged days). */
export function weekHasEnoughData(sessions: Session[], today: string, plan?: WeekPlan): boolean {
  return reviewWeek(sessions, today, plan) != null;
}

export function weeklyReviewInsights(input: WeeklyReviewInput, limit = 6): Insight[] {
  const { sessions, today, custom, schedule, goal, weightLog, trainingAgeMonths, exerciseIds } = input;
  const out: Insight[] = [];
  // ADAPT-4: the week-bound rows read the reviewed week (this week, or the week just ended).
  const plan: WeekPlan = { schedule: schedule as WeekPlan['schedule'], daysOff: input.daysOff ?? [], plannedDays: input.profile.plannedDays };
  const start = reviewWeek(sessions, today, plan) ?? weekStart(today);
  const week = start === weekStart(today) ? 'this week' : 'last week';
  const weekSessions = sessions.filter(s => s.day >= start && s.day < addDays(start, 7));
  const g = GOAL_BY_ID[goal];

  // Sets per muscle vs band
  const hardSets = hardSetsThisWeek(sessions, start, custom);
  const trained = MUSCLE_IDS.filter(m => (hardSets[m] ?? 0) > 0).sort((a, b) => (hardSets[b] ?? 0) - (hardSets[a] ?? 0));
  if (trained.length && weekSessions.length >= fullWeekSessions(plan, start)) {
    // ADAPT-5 (C-4): one band everywhere. The reviewed week is judged by muscleVolumeStatus, as Body
    // and the coach judge it (level band, seeded by training age; 'under' only after two full weeks).
    const status = new Map(muscleVolumeStatus(sessions, addDays(start, 7), custom, plan, input.profile.trainingSince).map(r => [r.muscle, r]));
    const flagged = trained.filter(m => status.get(m)?.status === 'under');
    const over = trained.filter(m => status.get(m)?.status === 'over');
    const m = flagged[0] ?? over[0];
    if (m) {
      const row = status.get(m)!;
      const under = row.status === 'under';
      out.push({
        id: `weekly:volume:${m}`, category: 'consistency', priority: 220, cadence: 'weekly', kind: 'plan',
        title: `${muscleLabel(m)} is ${under ? 'under' : 'over'} its usual range`,
        noticed: `${trained.map(x => `${muscleLabel(x)} ${Math.round(hardSets[x]!)}`).join(', ')} hard sets ${week}; ${muscleLabel(m).toLowerCase()} range ${row.band[0]}–${row.band[1]}.`,
        means: under ? `${muscleLabel(m)} has sat under your range for two full weeks, which can slow progress on it.` : 'Above your usual range: more sets now bring smaller gains and cost more recovery.',
        action: under ? `Add one more hard set for ${muscleLabel(m).toLowerCase()} on your next session that trains it.` : `Trim a set or two for ${muscleLabel(m).toLowerCase()} next week.`,
        muscle: m,
        evidence: { n: weekSessions.length, window: week, confidence: weekSessions.length >= 4 ? 'medium' : 'low' },
      });
    }
  }

  // Frequency per muscle (strength goal: goal lift with high weekly sets but freq 1)
  for (const m of trained) {
    const freq = frequencyThisWeek(sessions, start, m, custom);
    const sets = hardSets[m] ?? 0;
    const threshold = g.id === 'strength' ? 8 : 12;
    if (freq === 1 && sets >= threshold) {
      out.push({
        id: `weekly:frequency:${m}`, category: 'consistency', priority: 180, cadence: 'weekly', kind: 'tip',
        title: `${muscleLabel(m)} all landed on one day`,
        noticed: `All ${Math.round(sets)} ${muscleLabel(m).toLowerCase()} sets ${week} were in a single session.`,
        means: 'Splitting the same volume across two sessions usually keeps set quality higher late in the session.',
        action: `Move some ${muscleLabel(m).toLowerCase()} work to a second day next week.`,
        muscle: m,
        evidence: { n: 1, window: week, confidence: 'low' },
      });
      break;
    }
  }

  // Failure share
  const fShare = failureShare(weekSessions);
  const workingCount = weekSessions.flatMap(s => s.exercises.flatMap(e => e.sets)).filter(isWorkingSet).length;
  if (workingCount >= 12 && fShare > g.failureShareCap) {
    out.push({
      id: 'weekly:failure-share', category: 'progress', priority: 170, cadence: 'weekly', kind: 'tip',
      title: `About ${Math.round(fShare * 100)}% of sets were max effort`,
      noticed: `${Math.round(fShare * 100)}% of your working sets ${week} were rated max; your goal keeps it under ${Math.round(g.failureShareCap * 100)}%.`,
      means: 'Training to failure adds at most a little extra growth and no extra strength, for a lot more fatigue.',
      action: 'Save max effort for the last set of an exercise, not every set.',
      evidence: { n: workingCount, window: week, confidence: 'medium' },
    });
  }

  // e1RM trend and progress vs training age, and staleness, per exercise the user actually does
  for (const { id, name } of exerciseIds) {
    // QA2-FC-2: a comeback is judged only on the sessions since the break, as in plateauStatus.
    // BUG-15: without the lighter week's sessions, which are not trend or decline evidence.
    const hist = sinceLastBreak(exerciseHistory(sessions, id, custom).filter(h => !inLighterWeek(h.day, input.deload)));
    if (hist.length < 4 || !isActive(hist, today)) continue;
    // e1RM says nothing for assisted, body-weight or timed work (BR-06).
    if (modeOf(id, custom) !== 'weighted') continue;
    const t = e1rmTrend(hist);
    if (t.direction === 'unknown') continue;
    const meta = findExercise(id, custom);
    if (meta?.role !== 'main') continue;

    // BUG-14: rising, falling or flat come from the one plateau rule (BR-04), not the weekly slope alone.
    const p = plateauStatus(hist, 'weighted', today);
    if (p.status !== 'unknown') {
      const dir = p.status === 'progressing' ? 'up' : p.status === 'declining' ? 'down' : 'flat';
      const pctPerWeek = Math.round(t.slopePerWeek * 1000) / 10;
      // The note's rate comes from the rows plateauStatus judged (8-week rule or short path), and is
      // left out when that trend is unknown or its sign disagrees with the direction.
      const judged = e1rmTrend(plateauSeries(hist, 'weighted', today));
      const judgedPct = Math.round(judged.slopePerWeek * 1000) / 10;
      const agrees = Math.sign(judgedPct) === (dir === 'up' ? 1 : -1);
      const rate = judged.direction === 'unknown' || !agrees ? '' : ` at about ${Math.abs(judgedPct)}% a week`;
      out.push({
        id: `weekly:e1rm:${id}`, category: 'progress', priority: 200, cadence: 'weekly', kind: 'progress', exerciseId: id,
        title: `${name}: ${dir === 'up' ? 'rising' : dir === 'down' ? 'falling' : 'flat'}`,
        noticed: dir === 'flat' ? `${name} has not moved in recent sessions.` : `${name} is trending ${dir}${rate}.`,
        means: dir === 'up' ? 'Keep doing what you are doing.' : dir === 'down' ? 'Worth a lighter week before pushing again.' : 'That is the point where the coach suggests a change.',
        action: dir === 'up' ? 'No change needed.' : dir === 'down' ? 'Ease off max effort for a week, then rebuild.' : 'Add a set, add load, or change the rep range for two weeks.',
        evidence: { n: hist.length, window: `${hist.length} sessions`, confidence: p.confidence },
      });

      const [lo, hi] = expectedMonthlyRatePct(trainingAgeMonths);
      const pctPerMonth = pctPerWeek * 4.33;
      // BR-13: a pace comparison only makes sense for a lift that is actually rising.
      if (dir === 'up' && t.slopePerWeek > 0 && t.confidence === 'high' && hist.length >= 6) {
        const pace = pctPerMonth > hi ? 'faster than typical' : pctPerMonth < lo && pctPerMonth >= 0 ? 'slower than typical' : 'a typical pace';
        out.push({
          id: `weekly:pace:${id}`, category: 'progress', priority: 190, cadence: 'weekly', kind: 'data', exerciseId: id,
          title: `${name}: ${pace} for your training age`,
          noticed: `${name} e1RM is moving about ${Math.abs(pctPerMonth).toFixed(1)}% a month.`,
          // AUD-20 (SCI-11): the reference range is the app's policy, not a biological standard.
          means: `The app's reference for your training age is about ${lo} to ${hi}% a month.`,
          action: pace === 'a typical pace' ? 'Keep the current approach.' : 'No change needed either way; expect the rate to settle over time.',
          evidence: { n: hist.length, window: `${hist.length} sessions`, confidence: 'medium' },
        });
      }
    }

    if (isStale(hist, today)) {
      out.push({
        id: `weekly:stale:${id}`, category: 'progress', priority: 160, cadence: 'weekly', kind: 'tip', exerciseId: id,
        title: `${name}: same load for weeks`,
        noticed: `${name} has used the same load for 6 sessions running.`,
        means: 'Its estimated 1RM has stayed flat with it.',
        action: 'Add a rep, add load, or swap in a similar exercise for a block.',
        evidence: { n: 6, window: '6 sessions', confidence: 'medium' },
      });
    }
  }

  // Adherence
  const adherence = adherenceRate(sessions, schedule, today, 28, input.daysOff ?? []);
  if (adherence != null) {
    if (adherence < 0.6) {
      out.push({
        id: 'weekly:adherence', category: 'consistency', priority: 210, cadence: 'weekly', kind: 'plan',
        title: 'Fewer planned sessions than usual',
        noticed: `${Math.round(adherence * 100)}% of planned sessions over the last 4 weeks.`,
        // AUD-20 (SCI-11): facts and the coach's line, no claim about why sessions were missed.
        means: 'Below 60%, the coach suggests a schedule change.',
        action: 'Worth moving the hardest day to a slot that keeps working, even if it means fewer days.',
        evidence: { n: 28, window: 'last 4 weeks', confidence: 'medium' },
      });
    } else if (adherence >= 0.85) {
      out.push({
        id: 'weekly:adherence-good', category: 'consistency', priority: 140, cadence: 'weekly', kind: 'praise',
        title: 'Sticking to the plan',
        noticed: `${Math.round(adherence * 100)}% of planned sessions over the last 4 weeks.`,
        means: 'That is 85% or more of the plan.',
        action: 'Keep going.',
        evidence: { n: 28, window: 'last 4 weeks', confidence: 'medium' },
      });
    }
  }

  // Rep-range mix vs goal
  const mix = repMixShares(sessions, start, custom);
  if (mix.n >= 8) {
    if (g.heavyShareMin != null && mix.low < g.heavyShareMin) {
      out.push({
        id: 'weekly:rep-mix', category: 'progress', priority: 150, cadence: 'weekly', kind: 'tip',
        title: `Few heavy sets ${week}`,
        noticed: `Only ${Math.round(mix.low * 100)}% of main-lift sets were 1 to 5 reps; your goal aims for at least ${Math.round(g.heavyShareMin * 100)}%.`,
        means: 'Heavy sets are what drives 1RM most directly for a strength goal.',
        action: 'Add one 3 to 5 rep top set on each main lift.',
        evidence: { n: mix.n, window: week, confidence: 'medium' },
      });
    } else if (g.id !== 'strength' && g.id !== 'strength_muscle' && mix.high > 0.7 && mix.easyHighShare / Math.max(mix.high, 0.001) > 0.5) {
      out.push({
        id: 'weekly:rep-mix', category: 'progress', priority: 150, cadence: 'weekly', kind: 'tip',
        title: `Mostly high-rep, easy sets ${week}`,
        noticed: `${Math.round(mix.high * 100)}% of main-lift sets were 13+ reps, and most of those were rated easy.`,
        means: 'High reps work fine for growth, but sets need to be closer to effort to count fully.',
        action: 'Push the last set or two of each main lift closer to ideal or max effort.',
        evidence: { n: mix.n, window: week, confidence: 'medium' },
      });
    }
  }

  // Body-weight trend vs goal
  const wt = weightTrendPctPerWeek(weightLog, today);
  if (wt) {
    const [lo, hi] = g.weightRatePctPerWeek ?? [-1, 1];
    const dir = wt.pctPerWeek < 0 ? 'down' : wt.pctPerWeek > 0 ? 'up' : 'flat';
    const inRange = wt.pctPerWeek >= Math.min(lo, hi) && wt.pctPerWeek <= Math.max(lo, hi);
    out.push({
      id: 'weekly:weight-trend', category: 'data', priority: 130, cadence: 'weekly', kind: inRange ? 'praise' : 'tip', gated: 'body',
      title: `Trend weight ${Math.round(kgToDisplay(wt.trendKg, input.unit ?? 'kg') * 10) / 10} ${input.unit ?? 'kg'}, ${dir} ${Math.abs(wt.pctPerWeek)}% a week`,
      noticed: `Weight trend is ${dir} about ${Math.abs(wt.pctPerWeek)}% a week.`,
      means: inRange ? `That is inside the range that fits a ${g.name.toLowerCase()} goal.` : `That is outside the usual range for a ${g.name.toLowerCase()} goal (${lo} to ${hi}% a week).`,
      action: inRange ? 'No change needed.' : 'Worth a small adjustment to food if this keeps up for a few more weeks.',
      evidence: { n: weightLog.length, window: 'recent weigh-ins', confidence: weightLog.length >= 14 ? 'medium' : 'low' },
    });
  }

  return (input.sharing ? withoutGated(out, input.sharing) : out).sort((a, b) => b.priority - a.priority).slice(0, limit);
}

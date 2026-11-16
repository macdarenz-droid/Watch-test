/** This week at a glance, the training streak, and the week grade. */
import type { Exercise, LoggedExercise, Session, Weekday } from '@/core/models';
import { WEEKDAYS } from '@/core/models';
import { addDays, daysBetween, weekStart, weekdayOf, trainedToday } from '@/core/dates';
import { isWorkingSet, weeklyMuscleSets } from './exposure';
import { recordsInWeek, type PersonalRecord } from './prs';
import { modeOf } from './history';
import type { MuscleId } from '@/data/muscles';
import { findExercise } from '@/core/exercises';
import { bodyweightShare, effectiveLoadKg, type BodyWeightAt } from './bodyweight';

/**
 * Working sets and volume (kg × reps of loaded working sets), unrounded. The one volume sum for weeks and share cards (F12).
 * QA4-1: an assisted exercise's kg is the machine's help, not weight lifted; with body weight (F13) an assisted set counts bw × share − help.
 */
export function workingTotals(exercises: LoggedExercise[], custom: Exercise[] = [], bwKg: number | null = null): { sets: number; volumeKg: number } {
  let sets = 0, volumeKg = 0;
  for (const e of exercises) {
    const mode = modeOf(e.exerciseId, custom);
    const share = bwKg != null ? bodyweightShare(findExercise(e.exerciseId, custom)) : null;
    for (const x of e.sets) {
      if (!isWorkingSet(x)) continue;
      sets++;
      const eff = effectiveLoadKg(x.kg, mode, share, bwKg);
      if (eff != null) volumeKg += eff * (x.reps ?? 0);
      else if (mode !== 'assisted' && (x.kg ?? 0) > 0) volumeKg += (x.kg ?? 0) * (x.reps ?? 0);
    }
  }
  return { sets, volumeKg };
}

/** F13: workingTotals with each session's own body weight. No resolver: exactly the pre-F13 flat sum. */
export function sessionTotals(sessions: Session[], custom: Exercise[] = [], bw?: BodyWeightAt): { sets: number; volumeKg: number } {
  if (!bw) return workingTotals(sessions.flatMap(s => s.exercises), custom);
  let sets = 0, volumeKg = 0;
  for (const s of sessions) { const t = workingTotals(s.exercises, custom, bw(s.day)); sets += t.sets; volumeKg += t.volumeKg; }
  return { sets, volumeKg };
}

export interface WeekSummary {
  start: string;
  end: string;
  workouts: number;
  activeDays: string[];
  sets: number;
  volumeKg: number;
  records: PersonalRecord[];
  muscleSets: Partial<Record<MuscleId, number>>;
  previousMuscleSets: Partial<Record<MuscleId, number>>;
  grade: { title: string; note: string };
}

export function weekSummary(sessions: Session[], today: string, custom: Exercise[] = [], plannedPerWeek: number | null = 3, bw?: BodyWeightAt): WeekSummary {
  const start = weekStart(today);
  const end = addDays(start, 6);
  const inWeek = sessions.filter(s => s.day >= start && s.day <= end);
  const activeDays = [...new Set(inWeek.map(s => s.day))].sort();
  const { sets, volumeKg } = sessionTotals(inWeek, custom, bw);
  const weeks = weeklyMuscleSets(sessions, today, 2, custom);
  const workouts = inWeek.length;
  // BR-22: the planned count is the target; 3 only when there is no schedule at all (null).
  // QA-R6-4/10: a week whose planned days were all taken off has a target of 0, not 3.
  const target = plannedPerWeek ?? DEFAULT_WEEK_SESSIONS;
  const grade = target === 0 && workouts === 0 ? { title: 'Rest week', note: 'Every planned day this week is a day off.' }
    : workouts >= target ? { title: 'Strong week', note: 'You hit your planned sessions. Keep the standard.' }
    : workouts >= 2 ? { title: 'Building momentum', note: 'One or two more sessions makes this a full week.' }
    : workouts === 1 ? { title: 'Started', note: 'One session down. The next one is the one that counts.' }
    : { title: 'Start the week', note: 'Nothing logged yet. A short session still counts.' };
  return {
    start, end, workouts, activeDays, sets, volumeKg: Math.round(volumeKg),
    records: recordsInWeek(sessions, today, custom),
    muscleSets: weeks[0]?.sets ?? {},
    previousMuscleSets: weeks[1]?.sets ?? {},
    grade,
  };
}

/**
 * Streak that respects the schedule: rest days never break it, a missed
 * scheduled day in the past does, and today's unfinished session does not.
 * Without a schedule it falls back to consecutive training days.
 */
/**
 * RG-19: scheduled days this week (Mon–Sun) that were not taken off; the weekSummary target.
 * Null when nothing is scheduled on any weekday (QA-R6-10), so "all taken off" (0) is not "no plan".
 */
export function plannedThisWeek(schedule: Record<Weekday, string | null>, daysOff: string[], today: string): number | null {
  if (!Object.values(schedule).some(Boolean)) return null;
  const start = weekStart(today);
  const off = new Set(daysOff);
  let n = 0;
  for (let i = 0; i < 7; i++) { const d = addDays(start, i); if (schedule[weekdayOf(d)] && !off.has(d)) n++; }
  return n;
}

/** ADAPT-4: what the user planned; every field optional, so callers without a plan keep the default. */
export interface WeekPlan {
  schedule?: Record<Weekday, string | null>;
  daysOff?: string[];
  /** Profile.plannedDays: used when no weekday is scheduled (F-1). */
  plannedDays?: number;
}

/** A full week when nothing is planned (COACHING-PLAN volume row). */
export const DEFAULT_WEEK_SESSIONS = 3;

/**
 * ADAPT-4 (C-8): sessions planned for the week containing `day`: the schedule minus days off,
 * else Profile.plannedDays, else null (nothing set).
 */
export function plannedSessions(plan: WeekPlan | undefined, day: string): number | null {
  const scheduled = plan?.schedule ? plannedThisWeek(plan.schedule, plan.daysOff ?? [], day) : null;
  return scheduled ?? plan?.plannedDays ?? null;
}

/**
 * ADAPT-4 (C-3, C-5): sessions that make the week containing `day` a full week: the planned count,
 * 3 when nothing is set, never below 2 (a 1-day plan would make every week "full").
 */
export function fullWeekSessions(plan: WeekPlan | undefined, day: string): number {
  return Math.max(2, plannedSessions(plan, day) ?? DEFAULT_WEEK_SESSIONS);
}

export function trainingStreak(sessions: Session[], schedule: Record<Weekday, string | null>, today: string, daysOff: string[] = []): number {
  const trained = new Set(sessions.filter(s => s.exercises.some(e => e.sets.some(isWorkingSet))).map(s => s.day));
  const off = new Set(daysOff);
  const hasSchedule = WEEKDAYS.some(d => schedule[d]);
  let streak = 0;
  let day = today;
  for (let i = 0; i < 730; i++) {
    // A day taken off is unscheduled: it neither breaks nor extends the streak.
    const scheduled = off.has(day) ? false : hasSchedule ? !!schedule[weekdayOf(day)] : true;
    if (trained.has(day)) streak++;
    else if (scheduled && day !== today) break;
    else if (!hasSchedule && day !== today) break;
    day = addDays(day, -1);
  }
  return streak;
}

/** Days since the last logged session, or null when there is none. */
export function daysSinceLastSession(sessions: Session[], today: string, now?: number): number | null {
  // QA8-5: a session that ended today within the last 6h (started before midnight) counts as
  // today even though its stored day is still yesterday's.
  if (now != null && trainedToday(sessions, today, now)) return 0;
  // The latest day, whatever the list order (BR-29).
  const lastDay = sessions.reduce((m, s) => (s.day > m ? s.day : m), '');
  return lastDay ? daysBetween(lastDay, today) : null;
}

export interface WeekVolume {
  /** Monday of the week. */
  week: string;
  sessions: number;
  sets: number;
  volumeKg: number;
  muscleSets: Partial<Record<MuscleId, number>>;
}

/** Per-week totals for the last `weeks` weeks, index 0 = this week (EV2, for compare_periods and get_volume). */
export function weeklyVolumeHistory(sessions: Session[], today: string, weeks = 8, custom: Exercise[] = [], bw?: BodyWeightAt): WeekVolume[] {
  const muscle = weeklyMuscleSets(sessions, today, weeks, custom);
  return muscle.map(m => {
    const end = addDays(m.week, 6);
    const inWeek = sessions.filter(s => s.day >= m.week && s.day <= end);
    const { sets, volumeKg } = sessionTotals(inWeek, custom, bw);
    const muscleSets: Partial<Record<MuscleId, number>> = {};
    for (const [k, v] of Object.entries(m.sets) as Array<[MuscleId, number]>) muscleSets[k] = Math.round(v * 10) / 10;
    return { week: m.week, sessions: inWeek.length, sets, volumeKg: Math.round(volumeKg), muscleSets };
  });
}

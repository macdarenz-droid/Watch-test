/** This week at a glance, the training streak, and the week grade. */
import type { Exercise, Session, Weekday } from '@/core/models';
import { WEEKDAYS } from '@/core/models';
import { addDays, daysBetween, weekStart, weekdayOf } from '@/core/dates';
import { isWorkingSet, weeklyMuscleSets } from './exposure';
import { recordsInWeek, type PersonalRecord } from './prs';
import type { MuscleId } from '@/data/muscles';

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

export function weekSummary(sessions: Session[], today: string, custom: Exercise[] = [], plannedPerWeek = 3): WeekSummary {
  const start = weekStart(today);
  const end = addDays(start, 6);
  const inWeek = sessions.filter(s => s.day >= start && s.day <= end);
  const activeDays = [...new Set(inWeek.map(s => s.day))].sort();
  let sets = 0, volumeKg = 0;
  for (const s of inWeek) for (const e of s.exercises) for (const x of e.sets) {
    if (!isWorkingSet(x)) continue;
    sets++;
    if ((x.kg ?? 0) > 0) volumeKg += (x.kg ?? 0) * (x.reps ?? 0);
  }
  const weeks = weeklyMuscleSets(sessions, today, 2, custom);
  const workouts = inWeek.length;
  const grade = workouts >= Math.max(3, plannedPerWeek) ? { title: 'Strong week', note: 'You hit your planned sessions. Keep the standard.' }
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
export function trainingStreak(sessions: Session[], schedule: Record<Weekday, string | null>, today: string): number {
  const trained = new Set(sessions.filter(s => s.exercises.some(e => e.sets.some(isWorkingSet))).map(s => s.day));
  const hasSchedule = WEEKDAYS.some(d => schedule[d]);
  let streak = 0;
  let day = today;
  for (let i = 0; i < 730; i++) {
    const scheduled = hasSchedule ? !!schedule[weekdayOf(day)] : true;
    if (trained.has(day)) streak++;
    else if (scheduled && day !== today) break;
    else if (!hasSchedule && day !== today) break;
    day = addDays(day, -1);
  }
  return streak;
}

/** Days since the last logged session, or null when there is none. */
export function daysSinceLastSession(sessions: Session[], today: string): number | null {
  const last = sessions[sessions.length - 1];
  return last ? daysBetween(last.day, today) : null;
}

/**
 * F3.3: when the coach should offer a lighter week, reactive only. Any one of:
 *  (a) two or more main lifts plateaued or declining,
 *  (b) effort drifting harder on two or more lifts while weekly volume keeps rising,
 *  (c) a muscle's weekly sets have run above its band for two weeks straight, together with a
 *      plateaued or declining active main lift (D9),
 *  (d) readiness has read red on three or more of the last five days.
 * `readinessHistory` is the band for each of the last 5 days (index 0 = today), as scored by
 * derive() in coach/rules.ts — this module only counts them, it doesn't compute readiness itself.
 * BUG-14: a lift counts as stalled only under the one plateau rule (BR-04, trend.ts) and not at
 * low confidence; timed holds and conditioning never count (VOLUME-F2, D-A1 point 1). D-A1 point 6:
 * no offer before 4 weeks of logged training, and none for someone under 3 months of training
 * unless readiness read red on 3 of the last 5 days.
 * BUG-15: `lighterWeek` is the saved lighter week, active or ended. Its sessions are never stall
 * evidence (PROGRESSION-F4, COACHRULES-F8), the lift-based triggers wait `cooldownDays` after it
 * ends, and (b) and (c) read only completed weeks (PROGRESSION-F26).
 */
import type { Deload, Exercise, Session } from '@/core/models';
import { addDays, daysBetween } from '@/core/dates';
import { findExercise } from '@/core/exercises';
import { exerciseHistory, isActive, modeOf } from './history';
import { effortDrift } from './effort';
import { plateauStatus } from './trend';
import { weeklyMuscleSets } from './exposure';
import { volumeBands } from './volume';
import { trainingLevels } from './exposure';
import { MUSCLE_IDS } from '@/data/muscles';
import type { ReadinessBand } from './readiness';

export interface DeloadSuggestion {
  suggest: boolean;
  reason: string;
}

function mainLiftIds(sessions: Session[], custom: Exercise[]): string[] {
  const ids = new Set<string>();
  for (const s of sessions) for (const e of s.exercises) ids.add(e.exerciseId);
  return [...ids].filter(id => findExercise(id, custom)?.role === 'main');
}

/** The thresholds behind deloadTrigger, shared with explain_method. `readinessWindowDays` is what callers pass. */
export const DELOAD_TRIGGER = { stalledLifts: 2, driftLifts: 2, overBandWeeks: 2, readinessRedDays: 3, readinessWindowDays: 5, minHistoryDays: 28, beginnerMonths: 3, cooldownDays: 28 } as const;

/**
 * BUG-15: the day a new lighter week's window starts. When the previous week ended with no session
 * logged since, the pre-week level was never re-established, so the window reaches back to the
 * previous week's start and the base stays the original pre-week level (no compounding). A session
 * already logged on the new start day counts as re-established. Only the
 * latest week is saved, so this keeps the chain in `startDay` without a new field.
 */
export function chainedStartDay(prev: Deload | null | undefined, sessions: Session[], startDay: string): string {
  if (!prev || prev.startDay >= startDay) return startDay;
  const since = prev.endDay < startDay ? prev.endDay : addDays(startDay, -1);
  return sessions.some(s => s.day > since && s.day <= startDay) ? startDay : prev.startDay;
}

/** BUG-15: whether a day falls inside a lighter week's window. */
export function inLighterWeek(day: string, d: Deload | null | undefined): boolean {
  return !!d && day >= d.startDay && day <= d.endDay;
}

/** BUG-15: the day of the current lighter week, 1-7; a chained window counts from its last seven days. */
export function lighterWeekDay(d: Deload, today: string): number {
  const weekStart = addDays(d.endDay, -6) > d.startDay ? addDays(d.endDay, -6) : d.startDay;
  return Math.min(7, Math.max(1, daysBetween(weekStart, today) + 1));
}

const NONE: DeloadSuggestion = { suggest: false, reason: '' };
const RED_REASON = 'Readiness has read red on three or more of the last five days.';

/**
 * `trainingAgeMonths` is the person's training age (profile.trainingSince, else the first session);
 * when left out, it is counted from the first logged session. `trainingSince` (Profile) seeds the
 * level for the over-band check (ADAPT-5, A-10).
 */
export function deloadTrigger(sessions: Session[], today: string, custom: Exercise[] = [], readinessHistory: Array<ReadinessBand | null> = [], trainingAgeMonths?: number | null, lighterWeek?: Deload | null, trainingSince?: string): DeloadSuggestion {
  // D-A1 (6): 4 weeks of logged training before any lighter week.
  const firstDay = sessions.reduce<string | null>((a, s) => (a == null || s.day < a ? s.day : a), null);
  const historyDays = firstDay ? daysBetween(firstDay, today) : 0;
  if (historyDays < DELOAD_TRIGGER.minHistoryDays) return NONE;
  const months = trainingAgeMonths === undefined ? historyDays / 30.44 : trainingAgeMonths;
  const beginner = months == null || months < DELOAD_TRIGGER.beginnerMonths;

  const readinessRed = readinessHistory.filter(b => b === 'red').length >= DELOAD_TRIGGER.readinessRedDays;
  // A beginner on linear progress never gets one from the lift-based triggers (plan 6.13, D-A1 (6)).
  if (beginner) return readinessRed ? { suggest: true, reason: RED_REASON } : NONE;
  // BUG-15: a lighter week resets the lift-based evidence; the next offer waits (BELL23: every 4-6 weeks).
  if (lighterWeek && daysBetween(lighterWeek.endDay, today) < DELOAD_TRIGGER.cooldownDays) return readinessRed ? { suggest: true, reason: RED_REASON } : NONE;
  const evidence = sessions.filter(s => !inLighterWeek(s.day, lighterWeek));

  const mainIds = mainLiftIds(evidence, custom);
  // Only lifts trained in the last six weeks count (BR-05); timed holds and conditioning never do (A4).
  const lifts = mainIds
    .filter(id => { const m = modeOf(id, custom); return m !== 'duration' && m !== 'conditioning'; })
    .map(id => ({ id, h: exerciseHistory(evidence, id, custom) })).filter(x => isActive(x.h, today));
  const histories = lifts.map(x => x.h);

  const stalled = lifts.filter(({ id, h }) => {
    const p = plateauStatus(h, modeOf(id, custom), today);
    return (p.status === 'plateaued' || p.status === 'declining') && p.confidence !== 'low';
  });
  const plateauedOrDeclining = stalled.length;
  if (plateauedOrDeclining >= DELOAD_TRIGGER.stalledLifts) {
    return { suggest: true, reason: 'Two or more main lifts have plateaued or slipped over recent sessions.' };
  }

  // PROGRESSION-F26: completed weeks only; week 0 (this one) is still being trained.
  const totalsByWeek = weeklyMuscleSets(sessions, today, 4, custom).slice(1).map(w => Object.values(w.sets).reduce((a, v) => a + (v ?? 0), 0));
  const volumeRising = totalsByWeek.length === 3 && totalsByWeek[0]! >= totalsByWeek[1]! && totalsByWeek[1]! >= totalsByWeek[2]! && totalsByWeek[0]! > totalsByWeek[2]!;
  const harderCount = histories.filter(h => effortDrift(h).status === 'harder').length;
  if (harderCount >= DELOAD_TRIGGER.driftLifts && volumeRising) {
    return { suggest: true, reason: 'Effort has been drifting harder on two or more lifts while weekly volume keeps climbing.' };
  }

  const levels = trainingLevels(sessions, custom, { trainingSince, today });
  const weekly = weeklyMuscleSets(sessions, today, DELOAD_TRIGGER.overBandWeeks + 1, custom).slice(1);
  const overBandTwoWeeks = MUSCLE_IDS.some(m => {
    const [, hi] = volumeBands(levels[m].levelIndex, m);
    return (weekly[0]?.sets[m] ?? 0) > hi && (weekly[1]?.sets[m] ?? 0) > hi;
  });
  // D9: volume above the band has diminishing returns but no harm threshold, so on its own it
  // is not a reason to back off; only together with a stalled active main lift.
  if (overBandTwoWeeks && plateauedOrDeclining >= 1) {
    return { suggest: true, reason: 'A muscle has run above its usual weekly range for two weeks while a main lift has stalled.' };
  }

  if (readinessRed) return { suggest: true, reason: RED_REASON };

  return NONE;
}

/** Derived, memoised views over the store that several screens share. */
import { computed } from '@preact/signals';
import { state } from '@/core/store';
import { getSeries } from '@/core/heartStore';
import { weekdayOf, daysBetween, trainedTodaySessions, nextScheduled } from '@/core/dates';
import { recoveryStatus } from '@/brain/recovery';
import { readiness } from '@/brain/readiness';
import { deloadOffer, hiddenBackOnBoard, hiddenInsightIds, rankInsights, runInsightRules, type CoachContext } from '@/brain/coach/rules';
import { plannedSessions, trainingStreak, weekSummary } from '@/brain/weekly';
import { shouldShowOnboarding } from '@/brain/onboarding';
import { watchStatus } from '@/native/watch';
import { bodyWeightResolver } from '@/brain/bodyweight';

import { minuteNow, today } from './clock';

export { today, nowMs, minuteNow, acquireTicker, refreshClock } from './clock';

export const unit = computed(() => state.value.preferences.weightUnit);
export const splitById = (id: string) => state.value.splits.find(s => s.id === id);
export const scheduledSplitId = computed(() => state.value.schedule[weekdayOf(today.value)]);
export const scheduledSplit = computed(() => { const id = scheduledSplitId.value; return id ? splitById(id) : undefined; });
/** QA8-2: the next scheduled split after today, resolved to the actual Split. */
export const nextScheduledSplit = computed(() => {
  const n = nextScheduled(state.value.schedule, today.value);
  if (!n) return null;
  const split = splitById(n.splitId);
  return split ? { split, weekday: n.weekday } : null;
});

/**
 * QA-R2d-1: one computed per state field. A computed only notifies when its value changes
 * identity, so typing into a live set (a new `active`) no longer re-runs recovery and readiness.
 */
const field = <K extends keyof typeof state.value>(k: K) => computed(() => state.value[k]);
const sessions = field('sessions'), customExercises = field('customExercises'), profile = field('profile'), healthDays = field('healthDays');
const checkIns = field('checkIns'), freshMarks = field('freshMarks'), recoveryModel = field('recoveryModel');
const weightLog = field('weightLog');
export const bodyWeightAt = computed(() => bodyWeightResolver({ weightLog: weightLog.value, profile: profile.value }));

export const recovery = computed(() => recoveryStatus({ sessions: sessions.value, custom: customExercises.value, now: minuteNow.value, profile: profile.value, healthDays: healthDays.value, checkIns: checkIns.value, freshMarks: freshMarks.value, recoveryModel: recoveryModel.value }));
export const todayCheckIn = computed(() => checkIns.value.find(c => c.day === today.value));
export const todayReadiness = computed(() => readiness({
  today: today.value,
  now: minuteNow.value,
  healthDays: healthDays.value,
  checkIn: todayCheckIn.value,
  checkInHistory: checkIns.value.filter(c => c.day !== today.value && daysBetween(c.day, today.value) <= 30),
  recovery: recovery.value,
  scheduledSplit: scheduledSplit.value,
  next: nextScheduledSplit.value,
  custom: customExercises.value,
  sessions: sessions.value,
}));
export const week = computed(() => weekSummary(state.value.sessions, today.value, state.value.customExercises, plannedSessions({ schedule: state.value.schedule, daysOff: state.value.daysOff, plannedDays: state.value.profile.plannedDays }, today.value)));
export const streak = computed(() => trainingStreak(state.value.sessions, state.value.schedule, today.value, state.value.daysOff));
const coachContext = computed((): CoachContext => ({
  sessions: state.value.sessions, splits: state.value.splits, schedule: state.value.schedule, custom: state.value.customExercises,
  today: today.value, now: minuteNow.value, profileHistory: state.value.profileHistory, profile: state.value.profile,
  healthDays: state.value.healthDays, checkIns: state.value.checkIns, freshMarks: state.value.freshMarks,
  recoveryModel: state.value.recoveryModel, deload: state.value.deload, feedback: state.value.insightFeedback,
  unit: state.value.preferences.weightUnit, heartSeries: getSeries, daysOff: state.value.daysOff, plannedDays: state.value.profile.plannedDays,
  goal: state.value.goal,
}));
/** COACH-FB: the rules run once; the board and the hidden-notes list both rank from this one list. */
const rawInsights = computed(() => runInsightRules(coachContext.value));
const hiddenById = computed(() => hiddenInsightIds(state.value.insightFeedback, today.value));
export const insights = computed(() => rankInsights(rawInsights.value, hiddenById.value, 3));
/** COACH-FB: hidden notes that "Show again" would put back on the board, with why each is hidden. */
export const hiddenInsights = computed(() => (hiddenById.value.size ? hiddenBackOnBoard(rawInsights.value, hiddenById.value, 3) : []));
/** null once its endDay passes — F3.3 "closes itself" is read-time gating, no mutation needed. */
export const activeDeload = computed(() => { const d = state.value.deload; return d && d.endDay >= today.value ? d : null; });
export const deloadSuggestion = computed(() => deloadOffer(coachContext.value));
/** QA8-4: also counts a session that started before midnight and ended today, within the last 6 hours. */
export const sessionsToday = computed(() => trainedTodaySessions(state.value.sessions, today.value, minuteNow.value));
export const onboardingTrigger = computed(() => {
  const justConnectedWatch = watchStatus.value.state === 'connected' && !state.value.onboarding.watchPromptedAt;
  return shouldShowOnboarding(state.value.profile, state.value.onboarding, today.value, justConnectedWatch);
});

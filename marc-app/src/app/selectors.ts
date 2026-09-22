/** Derived, memoised views over the store that several screens share. */
import { computed, signal } from '@preact/signals';
import { state } from '@/core/store';
import { todayKey, weekdayOf } from '@/core/dates';
import { recoveryStatus } from '@/brain/recovery';
import { coachInsights } from '@/brain/coach/rules';
import { trainingStreak, weekSummary } from '@/brain/weekly';
import { WEEKDAYS } from '@/core/models';

/** The current day key. Re-evaluated every minute so midnight rolls over. */
export const today = signal(todayKey());
setInterval(() => { const k = todayKey(); if (k !== today.value) today.value = k; }, 60_000);

/** A clock that ticks every second while something needs it (session, rest). */
export const nowMs = signal(Date.now());
let ticker: ReturnType<typeof setInterval> | null = null;
export function setTicking(on: boolean): void {
  if (on && !ticker) ticker = setInterval(() => { nowMs.value = Date.now(); }, 1000);
  if (!on && ticker) { clearInterval(ticker); ticker = null; }
}

export const unit = computed(() => state.value.preferences.weightUnit);
export const splitById = (id: string) => state.value.splits.find(s => s.id === id);
export const scheduledSplitId = computed(() => state.value.schedule[weekdayOf(today.value)]);
export const scheduledSplit = computed(() => { const id = scheduledSplitId.value; return id ? splitById(id) : undefined; });
export const plannedPerWeek = computed(() => WEEKDAYS.filter(d => state.value.schedule[d]).length);

export const recovery = computed(() => recoveryStatus(state.value.sessions, state.value.customExercises, nowMs.value - (nowMs.value % 60_000)));
export const week = computed(() => weekSummary(state.value.sessions, today.value, state.value.customExercises, plannedPerWeek.value || 3));
export const streak = computed(() => trainingStreak(state.value.sessions, state.value.schedule, today.value));
export const insights = computed(() => coachInsights({ sessions: state.value.sessions, splits: state.value.splits, schedule: state.value.schedule, custom: state.value.customExercises, today: today.value, now: Date.now() }, 3));
export const sessionsToday = computed(() => state.value.sessions.filter(s => s.day === today.value));

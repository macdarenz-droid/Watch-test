/** Profile field edits: every change is recorded so the dashboard can show "updated when" and the coach can react. */
import { state, update } from '@/core/store';
import { todayKey } from '@/core/dates';
import { showToast } from '@/app/toast';
import type { ProfileChange, ProfileField } from '@/core/models';
import { GOAL_BY_ID, type GoalId } from '@/data/goals';
import { addTemplates } from '@/slices/workout/splits';

type Source = ProfileChange['source'];

function recordChange(field: ProfileField, from: unknown, to: unknown, source: Source): void {
  if (from === to || to == null) return;
  update(s => ({ ...s, profileHistory: [...s.profileHistory, { at: new Date().toISOString(), field, from, to, source }].slice(-500) }));
}

export function setBirthYear(year: number | undefined, source: Source = 'user'): void {
  const from = state.value.profile.birthYear;
  update(s => ({ ...s, profile: { ...s.profile, birthYear: year } }));
  recordChange('birthYear', from, year, source);
}

export function setHeight(cm: number | undefined, source: Source = 'user'): void {
  const from = state.value.profile.heightCm;
  update(s => ({ ...s, profile: { ...s.profile, heightCm: cm } }));
  recordChange('heightCm', from, cm, source);
}

export function setSex(sex: 'male' | 'female', source: Source = 'user'): void {
  const from = state.value.profile.sex;
  update(s => ({ ...s, profile: { ...s.profile, sex } }));
  recordChange('sex', from, sex, source);
}

export function setTrainingSince(month: string | undefined, source: Source = 'user'): void {
  const from = state.value.profile.trainingSince;
  update(s => ({ ...s, profile: { ...s.profile, trainingSince: month } }));
  recordChange('trainingSince', from, month, source);
}

export function setPlannedDays(n: number | undefined, source: Source = 'user'): void {
  const from = state.value.profile.plannedDays;
  update(s => ({ ...s, profile: { ...s.profile, plannedDays: n } }));
  recordChange('plannedDays', from, n, source);
}

/** Sets today's weigh-in, updates the current weight, and logs the change. */
export function logWeight(kg: number, source: Source = 'user'): void {
  const from = state.value.profile.bodyWeightKg;
  const day = todayKey();
  update(s => ({
    ...s,
    profile: { ...s.profile, bodyWeightKg: kg },
    weightLog: [...s.weightLog.filter(w => w.day !== day), { day, kg }].sort((a, b) => a.day.localeCompare(b.day)).slice(-400),
  }));
  recordChange('bodyWeightKg', from, kg, source);
}

/** Changes the goal and records it. The rest suggestion and templates are separate one-tap offers (never applied silently). */
export function changeGoal(goal: GoalId, source: Source = 'user'): void {
  const from = state.value.goal;
  if (from === goal) return;
  update(s => ({ ...s, goal }));
  recordChange('goal', from, goal, source);
}

/** Applies a goal's suggested rest. Only ever called from an explicit one-tap action. */
export function applyGoalRest(goal: GoalId): void {
  const restDefaultSec = GOAL_BY_ID[goal].restDefaultSec;
  update(s => ({ ...s, preferences: { ...s.preferences, restDefaultSec } }));
  showToast(`Rest set to ${restDefaultSec}s`);
}

/** Offers the goal's starter templates. Skips any whose name already exists. */
export function addGoalTemplates(goal: GoalId): void {
  addTemplates(GOAL_BY_ID[goal].templates);
  showToast('Templates added');
}

export function lastChangeAt(history: ProfileChange[], field: ProfileField): string | undefined {
  for (let i = history.length - 1; i >= 0; i--) if (history[i]!.field === field) return history[i]!.at;
  return undefined;
}

export function dismissOnboarding(): void {
  update(s => ({ ...s, onboarding: { ...s.onboarding, dismissedAt: [...s.onboarding.dismissedAt, new Date().toISOString()].slice(-10) } }));
}

export function completeOnboarding(): void {
  const now = new Date().toISOString();
  update(s => ({ ...s, onboarding: { ...s.onboarding, completedAt: now, lastReviewAt: now } }));
}

export function reviewOnboarding(): void {
  update(s => ({ ...s, onboarding: { ...s.onboarding, lastReviewAt: new Date().toISOString() } }));
}

/** The watch-connect onboarding prompt (6.10) only ever shows once per profile. */
export function markWatchPrompted(): void {
  update(s => ({ ...s, onboarding: { ...s.onboarding, watchPromptedAt: new Date().toISOString() } }));
}

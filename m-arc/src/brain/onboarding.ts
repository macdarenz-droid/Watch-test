/**
 * When to show the "help the coach know you" sheet, and the completeness
 * bar the profile dashboard displays. Pure: takes the profile and the
 * onboarding record, decides nothing about how the sheet renders.
 */
import type { Onboarding, Profile } from '@/core/models';
import { daysBetween } from '@/core/dates';

export interface ProfileCompleteness {
  weight: boolean;
  height: boolean;
  age: boolean;
  sex: boolean;
  done: number;
  of: number;
  complete: boolean;
}

export function profileCompleteness(profile: Profile): ProfileCompleteness {
  const weight = profile.bodyWeightKg != null;
  const height = profile.heightCm != null;
  const age = profile.birthYear != null;
  const sex = profile.sex != null;
  const done = [weight, height, age, sex].filter(Boolean).length;
  return { weight, height, age, sex, done, of: 4, complete: done === 4 };
}

/** BUG-8: the name of each profile field as the Coach row lists it. */
const PROFILE_FIELD_LABEL: Record<'age' | 'sex' | 'height' | 'weight', string> = {
  age: 'birth year',
  sex: 'sex',
  height: 'height',
  weight: 'weight',
};

/** BUG-8: names what's missing; "All 4 details" once complete. COPY-1: the missing fields only (data), no "to unlock …". */
export function missingProfileSummary(c: ProfileCompleteness): string {
  if (c.complete) return 'All 4 details';
  const missing = (['age', 'sex', 'height', 'weight'] as const).filter(k => !c[k]);
  return `Missing: ${missing.map(k => PROFILE_FIELD_LABEL[k]).join(', ')}`;
}

export type OnboardingTrigger = 'first' | 'partial' | 'review' | 'watch';

const DISMISS_SUPPRESS_DAYS = 14;
const MAX_DISMISSALS = 3;
const REVIEW_DAYS = 90;

/**
 * Which sheet, if any, should show right now. `todayIso` may be a full timestamp or a day key.
 * `justConnectedWatch`: a watch is connected and this profile has never been prompted for it
 * before (6.10) — overrides the normal dismissal cooldown, once, the first time it happens.
 */
export function shouldShowOnboarding(profile: Profile, onboarding: Onboarding, todayIso: string, justConnectedWatch = false): OnboardingTrigger | null {
  const today = todayIso.slice(0, 10);
  const c = profileCompleteness(profile);
  if (justConnectedWatch && !onboarding.watchPromptedAt && !c.complete) return 'watch';
  if (c.complete) {
    if (!onboarding.lastReviewAt) return null;
    return daysBetween(onboarding.lastReviewAt.slice(0, 10), today) >= REVIEW_DAYS ? 'review' : null;
  }
  if (onboarding.completedAt) return null;
  if (onboarding.dismissedAt.length === 0) return 'first';
  if (onboarding.dismissedAt.length >= MAX_DISMISSALS) return null;
  const last = onboarding.dismissedAt[onboarding.dismissedAt.length - 1]!;
  return daysBetween(last.slice(0, 10), today) >= DISMISS_SUPPRESS_DAYS ? 'partial' : null;
}

/** A new weight more than 10% off the last logged entry is probably a typo, not real change. */
export function isWeightTypo(newKg: number, lastKg: number | undefined): boolean {
  if (lastKg == null || lastKg <= 0) return false;
  return Math.abs(newKg - lastKg) / lastKg > 0.1;
}

import { describe, it, expect } from 'vitest';
import { isWeightTypo, profileCompleteness, shouldShowOnboarding } from '@/brain/onboarding';

const complete = { name: 'Marc', bodyWeightKg: 78, heightCm: 180, sex: 'male' as const, birthYear: 1990 };
const partial = { name: 'Marc', bodyWeightKg: 78 };
const fresh = { dismissedAt: [] as string[] };

describe('profileCompleteness', () => {
  it('counts the four coach-facing fields', () => {
    expect(profileCompleteness(complete)).toMatchObject({ done: 4, of: 4, complete: true });
    expect(profileCompleteness(partial)).toMatchObject({ weight: true, height: false, age: false, sex: false, done: 1, complete: false });
  });
});

describe('shouldShowOnboarding', () => {
  it('shows "first" on a fresh, incomplete profile that has never been dismissed', () => {
    expect(shouldShowOnboarding(partial, fresh, '2026-09-22')).toBe('first');
  });
  it('shows nothing once the sheet has been completed, even if fields are still missing', () => {
    expect(shouldShowOnboarding(partial, { dismissedAt: [], completedAt: '2026-01-01' }, '2026-09-22')).toBeNull();
  });
  it('suppresses "partial" for 14 days after a dismissal', () => {
    const onboarding = { dismissedAt: ['2026-09-10'] };
    expect(shouldShowOnboarding(partial, onboarding, '2026-09-15')).toBeNull(); // 5 days
    expect(shouldShowOnboarding(partial, onboarding, '2026-09-25')).toBe('partial'); // 15 days
  });
  it('stops asking after 3 dismissals', () => {
    const onboarding = { dismissedAt: ['2026-01-01', '2026-02-01', '2026-03-01'] };
    expect(shouldShowOnboarding(partial, onboarding, '2027-01-01')).toBeNull();
  });
  it('reviews a complete profile after 90 days', () => {
    expect(shouldShowOnboarding(complete, { dismissedAt: [], lastReviewAt: '2026-06-01' }, '2026-08-01')).toBeNull(); // ~61 days
    expect(shouldShowOnboarding(complete, { dismissedAt: [], lastReviewAt: '2026-06-01' }, '2026-09-05')).toBe('review'); // ~96 days
  });
  it('a complete profile with no review date set is quiet, not stuck reviewing', () => {
    expect(shouldShowOnboarding(complete, fresh, '2026-09-22')).toBeNull();
  });
  it('a watch connecting shows the sheet once, even inside the normal dismiss cooldown', () => {
    const justDismissed = { dismissedAt: ['2026-09-21T00:00:00.000Z'] };
    expect(shouldShowOnboarding(partial, justDismissed, '2026-09-22')).toBeNull();
    expect(shouldShowOnboarding(partial, justDismissed, '2026-09-22', true)).toBe('watch');
  });
  it('does not re-trigger once this profile has already been prompted for a watch', () => {
    // Falls through to the normal logic instead of forcing 'watch' again.
    expect(shouldShowOnboarding(partial, { dismissedAt: ['2026-09-21T00:00:00.000Z'], watchPromptedAt: '2026-09-01T00:00:00.000Z' }, '2026-09-22', true)).toBeNull();
  });
  it('a watch connecting never interrupts an already-complete profile', () => {
    expect(shouldShowOnboarding(complete, fresh, '2026-09-22', true)).toBeNull();
  });
});

describe('isWeightTypo', () => {
  it('flags a jump of more than 10%', () => {
    expect(isWeightTypo(90, 78)).toBe(true);
    expect(isWeightTypo(80, 78)).toBe(false);
  });
  it('never flags the first entry', () => {
    expect(isWeightTypo(78, undefined)).toBe(false);
  });
});

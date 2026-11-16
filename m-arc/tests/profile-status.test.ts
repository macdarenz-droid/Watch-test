// BUG-8: sex reads as chosen when it was never saved, and saved height/weight read "Not set"
// because they have no profileHistory entry. Also: the Escobar tab's Profile row names what's
// actually missing instead of a generic list.
import { describe, it, expect, vi } from 'vitest';
import type { VNode } from 'preact';
import { Segmented } from '@/ui/primitives';
import { missingProfileSummary, profileCompleteness } from '@/brain/onboarding';
import { setSex, lastChangeAt } from '@/slices/profile/profile';
import { replaceState, state } from '@/core/store';
import { freshState } from '@/core/models';

// Profile() calls useState (for goalOpen) and usePalaceFocus (a useEffect) at its top level;
// neither has a component context when the function is called directly rather than through
// Preact's diff, so both are stubbed to inspect the plain VNode tree it returns.
vi.mock('preact/hooks', () => ({ useState: (init: unknown) => [init, () => {}] }));
vi.mock('@/escobar/palace/focus', () => ({ usePalaceFocus: () => {} }));
const { statusHint, Profile } = await import('@/slices/profile/Profile');

function findByType(node: unknown, type: unknown): VNode | undefined {
  if (node == null || typeof node !== 'object') return undefined;
  const v = node as VNode<{ children?: unknown }>;
  if (v.type === type) return v;
  const children = v.props?.children;
  for (const c of Array.isArray(children) ? children : [children]) {
    const found = findByType(c, type);
    if (found) return found;
  }
  return undefined;
}

describe('BUG-8 A: the Profile sheet wires Sex straight from profile.sex', () => {
  it('presses no Sex option when profile.sex was never saved', () => {
    replaceState(freshState());
    const seg = findByType(Profile({ onClose: () => {} }), Segmented) as VNode<{ value?: string }> | undefined;
    expect(seg?.props.value).toBeUndefined();
  });

  it('still shows the saved option once sex is set (other Segmented callers unchanged)', () => {
    replaceState({ ...freshState(), profile: { ...freshState().profile, sex: 'female' } });
    const seg = findByType(Profile({ onClose: () => {} }), Segmented) as VNode<{ value?: string }> | undefined;
    expect(seg?.props.value).toBe('female');
  });
});

describe('BUG-8 B: setSex saves and records history from unset', () => {
  it('tapping Male sets profile.sex, records a history entry, and the hint reads "Updated …"', () => {
    replaceState(freshState());
    expect(state.value.profile.sex).toBeUndefined();
    setSex('male');
    expect(state.value.profile.sex).toBe('male');
    const at = lastChangeAt(state.value.profileHistory, 'sex');
    expect(at).toBeDefined();
    expect(statusHint(state.value.profile.sex, at)).toMatch(/^Updated /);
  });
});

describe('BUG-8 C: statusHint', () => {
  it('a saved value with no history reads "Saved"', () => {
    expect(statusHint(164, undefined)).toBe('Saved');
  });
  it('no value reads "Not set"', () => {
    expect(statusHint(undefined, undefined)).toBe('Not set');
  });
  it('a saved value with a history timestamp reads "Updated …"', () => {
    expect(statusHint(164, '2026-09-25T10:00:00.000Z')).toMatch(/^Updated /);
  });
});

describe('BUG-8 D: the Coach "What the coach can see" Profile row', () => {
  it('names the missing field when incomplete', () => {
    const c = profileCompleteness({ name: '', bodyWeightKg: 70, heightCm: 164, birthYear: 1998 });
    expect(missingProfileSummary(c)).toBe('Missing: sex');
    // COPY-1: two missing fields are listed as data, with no "to unlock …" explanation.
    expect(missingProfileSummary(profileCompleteness({ name: '', bodyWeightKg: 70, heightCm: 164 }))).toBe('Missing: birth year, sex');
  });
  it('reads complete once all 4 details are set', () => {
    const c = profileCompleteness({ name: '', bodyWeightKg: 70, heightCm: 164, birthYear: 1998, sex: 'male' });
    expect(c).toMatchObject({ done: 4, of: 4 });
    expect(missingProfileSummary(c)).toBe('All 4 details');
  });
});

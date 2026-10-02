import { describe, it, expect } from 'vitest';
import { askCandidates, shouldAskWeight } from '@/slices/workout/Train';
import { mergeAskAnswer } from '@/slices/workout/units';
import type { EquipmentProfile } from '@/core/models';

const LADDER: Pick<EquipmentProfile, 'ladder' | 'step'> = { ladder: [16, 20, 24, 28, 32, 36, 40] };
const STACK: Pick<EquipmentProfile, 'ladder' | 'step'> = { step: 5 };
const BARBELL: Pick<EquipmentProfile, 'ladder' | 'step'> = {}; // plates/barKg, no ladder, no step

describe('LT-4 §2: the ask-weight chip fires only when the menu is unknown and the cap broke', () => {
  it('fires on an assumed menu that earned a rung, on a ladder', () => {
    expect(shouldAskWeight({ mode: 'earn', menuConfidence: 'assumed', reason: 'Keep 25 kg and work up to 13 reps; then 30 kg for 6 is ready.' }, LADDER)).toBe(true);
  });
  it('fires on an assumed menu whose jump was too big for a lever, on a stack', () => {
    expect(shouldAskWeight({ mode: 'hold', menuConfidence: 'assumed', reason: '35 kg is too big a jump. Keep 30 kg and add a set, or try pause reps.' }, STACK)).toBe(true);
  });
  it('never fires on a known or learned menu', () => {
    expect(shouldAskWeight({ mode: 'earn', menuConfidence: 'known', reason: 'Keep 25 kg and work up to 13 reps; then 30 kg for 6 is ready.' }, LADDER)).toBe(false);
    expect(shouldAskWeight({ mode: 'earn', menuConfidence: 'learned', reason: 'x' }, LADDER)).toBe(false);
  });
  it('never fires on the top-of-ladder lever (not a broken cap)', () => {
    expect(shouldAskWeight({ mode: 'hold', menuConfidence: 'assumed', reason: 'Nothing heavier here: add a set, or a harder variation.' }, LADDER)).toBe(false);
  });
  it('never fires on an ordinary hold unrelated to the menu', () => {
    expect(shouldAskWeight({ mode: 'hold', menuConfidence: 'assumed', reason: 'Lighter week: 25 kg, 2 sets, easy.' }, LADDER)).toBe(false);
  });
  it('never fires on a plain rung or other modes', () => {
    expect(shouldAskWeight({ mode: 'rung' as never, menuConfidence: 'assumed', reason: '30 kg for 6 to 7.' }, LADDER)).toBe(false);
    expect(shouldAskWeight({ mode: 'increase', menuConfidence: 'assumed', reason: '30 kg for 6 to 7.' }, LADDER)).toBe(false);
  });
  it('never fires on a barbell/Smith-machine profile (plates/barKg, no ladder, no step) — §2 has no merge rule for it', () => {
    const earnCase = { mode: 'earn' as const, menuConfidence: 'assumed' as const, reason: 'Keep 60 kg and work up to 8 reps; then 65 kg for 4 is ready.' };
    expect(shouldAskWeight(earnCase, BARBELL)).toBe(false);
    expect(shouldAskWeight(earnCase, LADDER)).toBe(true); // same suggestion, a ladder profile: still fires
  });
});

describe('LT-4 §2: ask-chip candidates come from the menu, above the current load', () => {
  const menu = { rungsKg: [20, 22.5, 25, 27.5, 30], unit: 'kg' as const };
  it('offers the next two rungs above the current load', () => {
    expect(askCandidates(menu, 25)).toEqual([27.5, 30]);
  });
  it('offers fewer than two at the top of the menu', () => {
    expect(askCandidates(menu, 27.5)).toEqual([30]);
    expect(askCandidates(menu, 30)).toEqual([]);
  });
  it('converts to the menu\'s display unit', () => {
    const lb = { rungsKg: [11.34, 13.61], unit: 'lb' as const }; // 25 lb, 30 lb in kg
    expect(askCandidates(lb, 10)).toEqual([25, 30]);
  });
});

describe('LT-4 §2: the merge rule for a stack and a ladder', () => {
  const stack: EquipmentProfile = { unit: 'kg', step: 5, source: 'default', updatedAt: '' };
  it('a stack (step profile) becomes step = answer minus current', () => {
    const out = mergeAskAnswer(stack, 40, 42.5);
    expect(out.step).toBe(2.5);
    expect(out.source).toBe('user');
  });
  const ladder: EquipmentProfile = { unit: 'kg', ladder: [16, 20, 24, 28, 32, 36, 40], source: 'default', updatedAt: '' };
  it('a ladder drops the rungs strictly between current and the answer, adds the answer, keeps the rest', () => {
    const out = mergeAskAnswer(ladder, 20, 28);
    expect(out.ladder).toEqual([16, 20, 28, 32, 36, 40]);
    expect(out.source).toBe('user');
  });
  it('an answer with nothing strictly between it and current just gets inserted', () => {
    const out = mergeAskAnswer(ladder, 20, 22.5);
    expect(out.ladder).toEqual([16, 20, 22.5, 24, 28, 32, 36, 40]);
  });
  it('never leaves a two-rung ladder: when the drop would leave only two, nothing is dropped', () => {
    const short: EquipmentProfile = { unit: 'kg', ladder: [20, 25, 30], source: 'default', updatedAt: '' };
    // Naively: drop rungs strictly between 20 and 30 (25) then add 30 (already an end) -> [20, 30], a two-rung ladder.
    const out = mergeAskAnswer(short, 20, 30);
    expect(out.ladder).toEqual([20, 25, 30]);
  });
  it('an answer already on the ladder changes nothing but the source', () => {
    const out = mergeAskAnswer(ladder, 20, 24);
    expect(out.ladder).toEqual([16, 20, 24, 28, 32, 36, 40]);
  });
  it('review r1: an answer at or below current is rejected — the profile comes back unchanged', () => {
    expect(mergeAskAnswer(stack, 40, 40)).toBe(stack); // ==
    expect(mergeAskAnswer(stack, 40, 35)).toBe(stack); // <
    expect(mergeAskAnswer(ladder, 20, 20)).toBe(ladder);
    expect(mergeAskAnswer(ladder, 20, 16)).toBe(ladder);
  });
});

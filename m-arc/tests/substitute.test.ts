import { describe, expect, it } from 'vitest';
import { substitutesFor, carryOverStart } from '@/brain/substitute';
import { findExercise } from '@/core/exercises';
import { defaultProfile, loadableValues, type LoadMenu } from '@/brain/units';
import { SUBSTITUTION_RATIOS, substitutionRatio } from '@/data/substitutionRatios';

describe('substitutesFor (F3.7)', () => {
  it('only offers exercises sharing a primary muscle', () => {
    const bench = findExercise('lib_barbell_bench_press')!;
    const subs = substitutesFor(bench);
    expect(subs.length).toBeGreaterThan(0);
    expect(subs.every(e => e.primary.some(m => bench.primary.includes(m)))).toBe(true);
    expect(subs.some(e => e.id === bench.id)).toBe(false);
  });
  it('ranks a same-pattern, same-equipment-group substitute above a different-pattern one', () => {
    const bench = findExercise('lib_barbell_bench_press')!;
    const subs = substitutesFor(bench);
    const declineBench = subs.find(e => e.id === 'lib_decline_bench_press'); // same pattern, same equipment group (Barbell)
    const pecFly = subs.find(e => e.id === 'lib_pec_fly'); // different pattern, different equipment group
    expect(declineBench).toBeDefined();
    expect(pecFly).toBeDefined();
    expect(subs.indexOf(declineBench!)).toBeLessThan(subs.indexOf(pecFly!));
  });
});

// LT-5 (docs/LOAD-AWARE-TARGETS.md §5): substitution carry-over estimate.
describe('SUBSTITUTION_RATIOS (LT-5 A1)', () => {
  it('every ratio cites a real, non-empty source and url', () => {
    expect(SUBSTITUTION_RATIOS.length).toBeGreaterThan(0);
    for (const r of SUBSTITUTION_RATIOS) {
      expect(r.source.length).toBeGreaterThan(30);
      expect(r.url).toMatch(/^https:\/\/doi\.org\//);
      expect(r.ratio).toBeGreaterThan(0);
      expect(r.ratio).toBeLessThan(1);
    }
  });
  it('is the inverse in the opposite direction, and null with no sourced pair or same group', () => {
    const fwd = substitutionRatio('horizontal_push', 'Barbell', 'Dumbbells')!;
    const back = substitutionRatio('horizontal_push', 'Dumbbells', 'Barbell')!;
    expect(back.ratio).toBeCloseTo(1 / fwd.ratio, 9);
    expect(substitutionRatio('squat', 'Barbell', 'Dumbbells')).toBeNull();
    expect(substitutionRatio('horizontal_push', 'Barbell', 'Barbell')).toBeNull();
  });
});

describe('carryOverStart (LT-5)', () => {
  const dbMenu: LoadMenu = { profile: defaultProfile('Dumbbells', 'kg'), rungsKg: loadableValues(defaultProfile('Dumbbells', 'kg')), unit: 'kg', confidence: 'assumed', source: 'default' };
  const barbellMenu: LoadMenu = { profile: defaultProfile('Barbell', 'kg'), rungsKg: loadableValues(defaultProfile('Barbell', 'kg')), unit: 'kg', confidence: 'assumed', source: 'default' };
  // AUD-8 (SCI-08): the estimate is an e1RM, and the start is solved for 8 reps at 2 in reserve.
  const goal = { reps: 8, rir: 2 };
  const barbellBench = { pattern: 'horizontal_push', equipment: 'Barbell' };
  const dumbbellBench = { pattern: 'horizontal_push', equipment: 'Dumbbells' };
  const barbellOhp = { pattern: 'vertical_push', equipment: 'Barbell' };
  const dumbbellOhp = { pattern: 'vertical_push', equipment: 'Dumbbells' };
  const barbellSquat = { pattern: 'squat', equipment: 'Barbell' };
  const dumbbellSquat = { pattern: 'squat', equipment: 'Dumbbells' };

  it('A2: lands on a real rung of the substitute\'s menu, confidence low, "Start around X for N"', () => {
    const out = carryOverStart(barbellBench, dumbbellBench, 60, dbMenu, goal);
    expect(out).toEqual({ kg: 17.5, reps: 10, confidence: 'low', text: 'Start around 17.5 kg for 10' });
    expect(dbMenu.rungsKg).toContain(out!.kg);
  });
  it('A2: a second sourced pattern (vertical_push) also lands on a rung', () => {
    const out = carryOverStart(barbellOhp, dumbbellOhp, 50, dbMenu, goal);
    expect(out).toEqual({ kg: 17.5, reps: 8, confidence: 'low', text: 'Start around 17.5 kg for 8' });
  });
  it('the inverse direction (dumbbell replaced by barbell) also resolves', () => {
    const out = carryOverStart(dumbbellBench, barbellBench, 22.5, barbellMenu, goal);
    expect(out).not.toBeNull();
    expect(barbellMenu.rungsKg).toContain(out!.kg);
  });
  it('A3: no ratio for this pattern behaves as today (null, caller falls back to startingLoadKg)', () => {
    expect(carryOverStart(barbellSquat, dumbbellSquat, 100, dbMenu, goal)).toBeNull();
  });
  it('A3: a pattern change (not a real substitute pair) is never given a carry-over estimate', () => {
    expect(carryOverStart(barbellBench, { pattern: 'squat', equipment: 'Dumbbells' }, 60, dbMenu, goal)).toBeNull();
  });
  it('null with no strength estimate or an empty menu', () => {
    expect(carryOverStart(barbellBench, dumbbellBench, 0, dbMenu, goal)).toBeNull();
    expect(carryOverStart(barbellBench, dumbbellBench, 60, { ...dbMenu, rungsKg: [] }, goal)).toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import type { EquipmentProfile, LoadUnit } from '@/core/models';
import { chooseRung, jumpCap, repsAt, repsToEarn, type RungMenu } from '@/brain/retarget';
import { defaultProfile, loadableValues } from '@/brain/units';
import { KG_PER_LB } from '@/core/units';

const menuOf = (profile: EquipmentProfile): RungMenu => ({
  profile,
  unit: profile.unit,
  rungsKg: loadableValues(profile).map(v => Math.round(v * (profile.unit === 'lb' ? KG_PER_LB : 1) * 1000) / 1000),
});
const ladder = (values: number[], unit: LoadUnit = 'kg'): RungMenu => menuOf({ unit, ladder: values, source: 'user', updatedAt: '' });
const stack = (step: number): RungMenu => menuOf({ unit: 'kg', step, source: 'user', updatedAt: '' });
const lb50 = 50 * KG_PER_LB;

describe('LT-2 re-solve maths (§7)', () => {
  it('repsAt(25, 12, 2, 30, 2) = 4.67 (ratio form)', () => expect(repsAt(25, 12, 2, 30, 2)).toBeCloseTo(4.667, 2));
  it('repsToEarn(25, 12, 2, 30, 6, 1) = 13', () => expect(repsToEarn(25, 12, 2, 30, 6, 1)).toBe(13));
  it('caps per goal: 10 / 12.5 / 15 / 20 %', () => {
    expect([jumpCap('strength'), jumpCap('strength_muscle'), jumpCap('lean'), jumpCap('growth')]).toEqual([0.1, 0.125, 0.15, 0.2]);
  });
  it('for R ≤ 10 the ratio form equals the Epley re-solve', () => {
    const e = 60 * (1 + (8 + 2) / 30);
    expect(repsAt(60, 8, 2, 62.5, 2)).toBeCloseTo(30 * (e / 62.5 - 1) - 2, 9);
  });
});

describe('LT-2 A1: the worked rows of §3', () => {
  it('row 1: DB 25 × 12, lean main, 25/30/32.5/35 → earn 13', () => {
    const c = chooseRung({ topKg: 25, R: 12, rirObs: 2, rawKg: 27, menu: ladder([25, 30, 32.5, 35]), goal: 'lean', role: 'main' });
    expect(c).toMatchObject({ kind: 'earn', kg: 25, repWindow: [13, 13] });
    expect(c.text).toBe('No smaller step here. Keep 25 kg and work up to 13 reps; then 30 kg for 6 is ready.');
  });
  it('row 2: same rack, growth main at 25 × 15 → 30 for about 8, close to max', () => {
    const c = chooseRung({ topKg: 25, R: 15, rirObs: 2, rawKg: 27, menu: ladder([25, 30, 32.5, 35]), goal: 'growth', role: 'main' });
    expect(c).toMatchObject({ kind: 'rung', kg: 30, repWindow: [7, 9] });
    expect(c.text).toBe('No smaller step here: use 30 kg for about 8, close to max.');
  });
  it('row 3: barbell 60 × 8, strength_muscle main, 1.25 kg plates → 62.5 for 6 to 7; without them 65 for 4 to 5', () => {
    const withSmall = chooseRung({ topKg: 60, R: 8, rirObs: 2, rawKg: 62.5, menu: menuOf(defaultProfile('Barbell', 'kg')), goal: 'strength_muscle', role: 'main' });
    expect(withSmall).toMatchObject({ kind: 'rung', kg: 62.5, repWindow: [6, 7] });
    expect(withSmall.text).toBe('62.5 kg for 6 to 7.');
    const noSmall = chooseRung({ topKg: 60, R: 8, rirObs: 2, rawKg: 62.5, menu: menuOf({ ...defaultProfile('Barbell', 'kg'), plates: [25, 20, 15, 10, 5, 2.5] }), goal: 'strength_muscle', role: 'main' });
    expect(noSmall).toMatchObject({ kind: 'rung', kg: 65, repWindow: [4, 5] });
    expect(noSmall.text).toBe('65 kg for 4 to 5.');
  });
  it('row 4: stack 40 × 15, lean accessory, step 5 → 45 for about 9 to 10', () => {
    const c = chooseRung({ topKg: 40, R: 15, rirObs: 2, rawKg: 42.5, menu: stack(5), goal: 'lean', role: 'accessory' });
    expect(c).toMatchObject({ kind: 'rung', kg: 45, repWindow: [8, 11] });
    expect(c.text).toBe('45 kg for about 9 to 10.');
  });
  it('row 5: kettlebell 16 × 12, lean main, 16/20/24 → earn 15 = hi + 3 (the table\'s 16 is an arithmetic slip, D-LT2)', () => {
    const c = chooseRung({ topKg: 16, R: 12, rirObs: 2, rawKg: 17.5, menu: ladder([16, 20, 24]), goal: 'lean', role: 'main' });
    expect(c).toMatchObject({ kind: 'earn', kg: 16, repWindow: [15, 15] });
    expect(c.text).toBe('No smaller step here. Keep 16 kg and work up to 15 reps; then 20 kg for 6 is ready.');
  });
  it('row 5 with a 20.5 kg next bell: §3 step 6 earn = ceil(15.4) = 16 > hi + 3 → lever with the table\'s wording', () => {
    const c = chooseRung({ topKg: 16, R: 12, rirObs: 2, rawKg: 17.5, menu: ladder([16, 20.5, 24]), goal: 'lean', role: 'main' });
    expect(c).toMatchObject({ kind: 'lever', kg: 16, extraSet: true });
    expect(c.text).toBe('20.5 kg is too big a jump for now (about 2 reps). Keep 16 kg and add a set, or try a harder variation.');
  });
  it('row 6: DB 50 lb × 12, lean main, 5 lb steps → 55 lb (24.948 kg) for about 8', () => {
    const c = chooseRung({ topKg: lb50, R: 12, rirObs: 2, rawKg: 24.5, menu: menuOf(defaultProfile('Dumbbells', 'lb')), goal: 'lean', role: 'main' });
    expect(c.kind).toBe('rung');
    expect(c.kg).toBeCloseTo(24.948, 3);
    expect(c.repWindow).toEqual([7, 9]);
    expect(c.text).toBe('55 lb for about 8.');
  });
  it('row 7: DB 30 × 5, strength main, 5 kg jumps → lever, move the lift to the barbell', () => {
    const c = chooseRung({ topKg: 30, R: 5, rirObs: 2, rawKg: 32, menu: ladder([20, 25, 30, 35, 40]), goal: 'strength', role: 'main' });
    expect(c).toMatchObject({ kind: 'lever', kg: 30, extraSet: true });
    expect(c.text).toBe('35 kg is too big a jump. Keep 30 kg and add a set, or move this lift to the barbell.');
  });
  it('row 8 (A3): top of the ladder → lever, never the same rung', () => {
    const c = chooseRung({ topKg: 35, R: 12, rirObs: 2, rawKg: 37.5, menu: ladder([25, 30, 32.5, 35]), goal: 'lean', role: 'main' });
    expect(c).toMatchObject({ kind: 'lever', kg: 35, extraSet: true });
    expect(c.text).toBe('Nothing heavier here: add a set, or a harder variation.');
  });
});

describe('LT-2 A4: no menu or one rung', () => {
  it('an empty menu keeps the raw kg and the reps unchanged', () => {
    const c = chooseRung({ topKg: 25, R: 12, rirObs: 2, rawKg: 27, menu: { rungsKg: [], unit: 'kg' }, goal: 'lean', role: 'main' });
    expect(c).toMatchObject({ kind: 'rung', kg: 27, repWindow: [6, 12], text: '' });
    expect(chooseRung({ topKg: 25, R: 12, rirObs: 2, rawKg: 27, menu: null, goal: 'lean', role: 'main' }).kg).toBe(27);
  });
  it('one rung holds at that rung, no increase', () => {
    const c = chooseRung({ topKg: 25, R: 12, rirObs: 2, rawKg: 27, menu: ladder([25]), goal: 'lean', role: 'main' });
    expect(c).toMatchObject({ kind: 'lever', kg: 25, repWindow: [12, 12] });
  });
});

describe('LT-2 A5: effort and the strength floor', () => {
  it('growth accepts at RIR 1, never RIR 0: 30 kg is 6 reps at RIR 0 but 5 at RIR 1 → earn, not the rung', () => {
    expect(Math.floor(repsAt(25, 12, 2, 30, 0))).toBe(6);
    const c = chooseRung({ topKg: 25, R: 12, rirObs: 2, rawKg: 27, menu: ladder([25, 30, 35]), goal: 'growth', role: 'main' });
    expect(c).toMatchObject({ kind: 'earn', kg: 25, repWindow: [13, 13] });
  });
  it('strength never goes under 3 reps: 110 kg is 2 reps at RIR 1 → earn toward 3, not the rung', () => {
    const c = chooseRung({ topKg: 100, R: 5, rirObs: 2, rawKg: 102.5, menu: ladder([100, 110, 120]), goal: 'strength', role: 'main' });
    expect(c).toMatchObject({ kind: 'earn', kg: 100, repWindow: [6, 6] });
    expect(c.text).toBe('No smaller step here. Keep 100 kg and work up to 6 reps; then 110 kg for 3 is ready.');
  });
  it('strength takes a rung that leaves 3 or more reps', () => {
    const c = chooseRung({ topKg: 100, R: 5, rirObs: 2, rawKg: 102.5, menu: ladder([100, 105, 110]), goal: 'strength', role: 'main' });
    expect(c).toMatchObject({ kind: 'rung', kg: 105, repWindow: [3, 3] });
  });
});

describe('LT-2 A6: the step-down is sized from performance', () => {
  it('120 kg on a 5 kg stack → 110 (115 is only 4.2 %)', () => {
    const c = chooseRung({ topKg: 120, R: 3, rirObs: 0, rawKg: 117.5, menu: stack(5), goal: 'strength', role: 'main', direction: 'down' });
    expect(c).toMatchObject({ kind: 'down', kg: 110 });
  });
  it('60 kg with 1.25 kg plates → 55 (57.5 is only 4.2 %)', () => {
    const c = chooseRung({ topKg: 60, R: 3, rirObs: 0, rawKg: 57.5, menu: menuOf(defaultProfile('Barbell', 'kg')), goal: 'strength', role: 'main', direction: 'down' });
    expect(c).toMatchObject({ kind: 'down', kg: 55 });
  });
  it('never under the load planned before the failed increase', () => {
    const args = { topKg: 62.5, R: 5, rirObs: 0, rawKg: 60, menu: menuOf(defaultProfile('Barbell', 'kg')), goal: 'lean' as const, role: 'main' as const, direction: 'down' as const };
    expect(chooseRung(args).kg).toBe(57.5);
    expect(chooseRung({ ...args, priorPlannedKg: 60 }).kg).toBe(60);
  });
  it('the reps are re-solved for the new rung', () => {
    const c = chooseRung({ topKg: 120, R: 3, rirObs: 0, rawKg: 117.5, menu: stack(5), goal: 'strength', role: 'main', direction: 'down' });
    // 120 × 3 at max: 30 × 132 / 110 − 30 − 2 = 4 reps at RIR 2 on 110 kg.
    expect(c.repWindow).toEqual([4, 4]);
    expect(c.text).toBe('110 kg for 4.');
  });
});

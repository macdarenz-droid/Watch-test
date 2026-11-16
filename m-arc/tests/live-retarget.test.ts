import { describe, it, expect } from 'vitest';
import { liveRetarget } from '@/brain/retarget';
import { autoregulationSuggestion } from '@/brain/coach/live';
import { pickReasonCue, reasonKeyFor } from '@/brain/coach/cues';
import type { Effort, LoggedSet } from '@/core/models';

// LT-3 (docs/LOAD-AWARE-TARGETS.md §4): the live retarget owns the placeholders for sets 2..n.
const menu = { rungsKg: [20, 22.5, 25, 27.5, 30, 32, 32.5, 35], unit: 'kg' as const };
const plan = { kg: 27.5, reps: 8 };
const one = (kg: number, reps: number, effort?: Effort) => [{ kg, reps, ...(effort ? { effort } : {}) }];
const live = (p: Partial<LoggedSet>): LoggedSet => ({ fidelity: 'live', ...p });

describe('LT3-A1: a different load on set 1 (the §4 trace)', () => {
  it('32 kg against a 27.5 plan, 5 at Max: sets 2..n get 32 × 3 and the exact line', () => {
    const r = liveRetarget(one(32, 5, 'max'), plan, 'lean', 'main', menu)!;
    expect(r.kind).toBe('above');
    expect(r.kg).toBe(32);
    expect(r.reps).toBe(3);
    expect(r.back).toEqual({ kg: 27.5, reps: 8 });
    expect(r.text).toBe("32 kg is above today's plan: about 3 clean reps. Back to 27.5 for 8, or stay at 32 for 3.");
  });
  it('the autoregulation line is derived from it, word for word', () => {
    const rt = liveRetarget(one(32, 5, 'max'), plan, 'lean', 'main', menu);
    const a = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'DB Bench', firstSet: live({ kg: 32, reps: 5, effort: 'max' }), targetKg: 27.5, targetReps: 8, historyCount: 5, retarget: rt })!;
    expect(a.action).toBe(rt!.text);
    expect(a.title).toBe('DB Bench: above the plan');
  });
  it('above the plan inside the window keeps the lifted load: 32 × 8 ideal → 32 × 8', () => {
    const r = liveRetarget(one(32, 8, 'ideal'), plan, 'lean', 'main', menu)!;
    expect([r.kind, r.kg, r.reps, r.text]).toEqual(['keep', 32, 8, 'Keep 32 kg for the rest: 8 reps a set.']);
  });
  it('nothing clean left at the lifted load: only "Back to 27.5 for 8." (D-LT3)', () => {
    const r = liveRetarget(one(32, 2, 'max'), plan, 'lean', 'main', menu)!;
    expect([r.kind, r.kg, r.reps, r.text]).toEqual(['above', 27.5, 8, 'Back to 27.5 for 8.']);
  });
  it('without set 1 or a plan there is nothing to retarget', () => {
    expect(liveRetarget([], plan, 'lean', 'main', menu)).toBeNull();
    expect(liveRetarget([{ reps: 5 }], plan, 'lean', 'main', menu)).toBeNull();
    expect(liveRetarget(one(32, 5), { kg: 0, reps: 8 }, 'lean', 'main', menu)).toBeNull();
  });
});

describe('LT3-A2: different reps at the target load', () => {
  const at = (reps: number, effort?: Effort) => liveRetarget(one(27.5, reps, effort), plan, 'lean', 'main', menu)!;
  it('ideal keeps the reps done, inside the top of the range', () => {
    expect([at(7, 'ideal').kind, at(7, 'ideal').kg, at(7, 'ideal').reps]).toEqual(['reps', 27.5, 7]);
    expect(at(14, 'ideal').reps).toBe(12);
    expect(at(7).reps).toBe(7);
  });
  it('max takes one off (a miss of one stays at the load)', () => {
    expect([at(7, 'max').kg, at(7, 'max').reps]).toEqual([27.5, 6]);
    expect(at(8, 'max').reps).toBe(7);
  });
  it('easy adds one, clamped to hi, and no load line: reps first, load next session', () => {
    expect([at(8, 'easy').kind, at(8, 'easy').kg, at(8, 'easy').reps]).toEqual(['reps', 27.5, 9]);
    expect(at(8, 'easy').text).toBe('Keep 27.5 kg and do 9 reps for the next set: reps first, then load.');
    expect(at(12, 'easy').reps).toBe(12);
    const rt = at(8, 'easy');
    const a = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: live({ kg: 27.5, reps: 8, effort: 'easy' }), targetKg: 27.5, targetReps: 8, historyCount: 5, retarget: rt })!;
    expect(a.action).not.toMatch(/Try/);
    expect(a.title).not.toMatch(/add load/);
    // Ideal and a one-rep miss at max change the reps alone, with no line.
    expect(at(7, 'ideal').text).toBeNull();
    expect(at(7, 'max').text).toBeNull();
  });
  it('a held day keeps the plan on an easy set', () => {
    const r = liveRetarget(one(27.5, 10, 'easy'), plan, 'lean', 'main', menu, { holdLoad: true })!;
    expect([r.kg, r.reps, r.text]).toEqual([27.5, 8, 'Keep 27.5 kg for the next set.']);
  });
});

describe('LT3-A3: never "add load" once set 1 is above the plan', () => {
  it('no effort or rep count above the plan gives a heavier load or a "Try" line', () => {
    for (const effort of ['easy', 'ideal', 'max', undefined] as const) {
      for (let reps = 1; reps <= 20; reps++) {
        const r = liveRetarget(one(32, reps, effort), plan, 'lean', 'main', menu, { historyCount: 5 })!;
        expect(r.kg).toBeLessThanOrEqual(32);
        expect(r.kind === 'up').toBe(false);
        expect(r.text ?? '').not.toMatch(/Try|add load/);
      }
    }
  });
  it('without a retarget, the easy branch keeps the lifted load instead of "Try 34"', () => {
    const a = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: live({ kg: 32, reps: 10, effort: 'easy' }), targetKg: 27.5, targetReps: 8, historyCount: 5 })!;
    expect(a.action).toBe('Keep 32 kg for the rest.');
    expect(a.title).not.toMatch(/add load/);
  });
});

describe('LT3-A4: autoregulation steps from the lifted load, snapped, never the same rung', () => {
  const noMenu = null;
  it('the step up comes from the load lifted (90 → 92.5), not the plan (100 → 102.5)', () => {
    const r = liveRetarget(one(90, 10, 'easy'), { kg: 100, reps: 8 }, 'lean', 'main', noMenu, { historyCount: 5 })!;
    expect([r.kind, r.kg, r.text]).toEqual(['up', 92.5, 'Try 92.5 kg for the next set.']);
    const a = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: live({ kg: 90, reps: 10, effort: 'easy' }), targetKg: 100, targetReps: 8, historyCount: 5 })!;
    expect(a.action).toBe('Try 92.5 kg for the next set.');
  });
  it('the step down comes from the load lifted (90 → 87.5), not the plan (100 → 97.5)', () => {
    const r = liveRetarget(one(90, 4, 'max'), { kg: 100, reps: 8 }, 'lean', 'main', noMenu, { historyCount: 5 })!;
    expect([r.kind, r.kg]).toEqual(['drop', 87.5]);
    const a = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: live({ kg: 90, reps: 4, effort: 'max' }), targetKg: 100, targetReps: 8, historyCount: 5 })!;
    expect(a.action).toMatch(/^Drop to 87.5 kg/);
  });
  it('snapped on the menu and never the same rung', () => {
    const m = { rungsKg: [80, 85, 90, 95], unit: 'kg' as const };
    expect(liveRetarget(one(90, 4, 'max'), { kg: 90, reps: 8 }, 'lean', 'main', m, { historyCount: 5 })!.kg).toBe(85);
    const tight = { rungsKg: [89, 90, 91], unit: 'kg' as const };
    expect(liveRetarget(one(90, 4, 'max'), { kg: 90, reps: 8 }, 'lean', 'main', tight)!.kg).toBe(89);
    expect(liveRetarget(one(90, 10, 'easy'), { kg: 95, reps: 8 }, 'lean', 'main', m, { historyCount: 5 })!.kg).toBe(95);
    // The drop's reps are re-solved for the new rung: 90 × 4 at max → 85 for 4 at RIR 2 (30 × 90/85 × 34/30 − 32 = 4.0).
    expect(liveRetarget(one(90, 4, 'max'), { kg: 90, reps: 8 }, 'lean', 'main', m, { historyCount: 5 })!.reps).toBe(4);
  });
  it('nothing lighter on the menu: stay, one rep fewer', () => {
    const r = liveRetarget(one(20, 2, 'max'), { kg: 20, reps: 6 }, 'lean', 'main', { rungsKg: [20, 22.5], unit: 'kg' })!;
    expect([r.kind, r.kg, r.reps]).toEqual(['stay', 20, 1]);
  });
  it('a step up never passes the planned rung', () => {
    const r = liveRetarget(one(26, 10, 'easy'), { kg: 27.5, reps: 8 }, 'lean', 'main', { rungsKg: [26, 30], unit: 'kg' })!;
    expect(r.kg).toBe(27.5);
  });
  it('above the plan, the step-down base is the planned rung', () => {
    expect(liveRetarget(one(32, 4, 'max'), plan, 'lean', 'main', menu, { historyCount: 5 })!.back!.kg).toBe(27.5);
  });
  it('on isolation (no prompts) a would-be drop or step up stays at the lifted load, with no line (D-LT3)', () => {
    const d = liveRetarget(one(90, 4, 'max'), { kg: 90, reps: 8 }, 'lean', 'accessory', null, { historyCount: 5, prompts: false })!;
    expect([d.kind, d.kg, d.reps, d.text]).toEqual(['reps', 90, 3, null]);
    const u = liveRetarget(one(25, 10, 'easy'), { kg: 27.5, reps: 8 }, 'lean', 'accessory', null, { prompts: false })!;
    expect([u.kind, u.kg, u.text]).toEqual(['reps', 25, null]);
    const above = liveRetarget(one(32, 5, 'max'), plan, 'lean', 'main', menu, { prompts: false })!;
    expect([above.kg, above.reps, above.text]).toEqual([32, 3, null]);
  });
});

describe('LT3-A7: mode earn has a reason cue', () => {
  it('earn maps to build_reps, which has cues', () => {
    expect(reasonKeyFor('earn', 'medium')).toBe('build_reps');
    expect(pickReasonCue(reasonKeyFor('earn', 'high'), 'seed')).not.toBeNull();
  });
});

import { describe, it, expect } from 'vitest';
import { autoregulationSuggestion } from '@/brain/coach/live';
import type { LoggedSet } from '@/core/models';

const set = (patch: Partial<LoggedSet>): LoggedSet => ({ fidelity: 'live', ...patch });

describe('autoregulationSuggestion', () => {
  it('suggests more load when easy at or above target reps', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: set({ kg: 80, reps: 10, effort: 'easy' }),
      targetKg: 80, targetReps: 8, historyCount: 5,
    });
    expect(r?.action).toContain('82');
  });

  it('uses a flat 2.5 kg step below 3 sessions of history', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: set({ kg: 80, reps: 10, effort: 'easy' }),
      targetKg: 80, targetReps: 8, historyCount: 2,
    });
    expect(r?.action).toContain('82.5');
  });

  it('uses a 2.5% step at 3 or more sessions of history', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: set({ kg: 100, reps: 10, effort: 'easy' }),
      targetKg: 100, targetReps: 8, historyCount: 3,
    });
    expect(r?.action).toContain('102.5');
  });

  it('suggests less load when missed by two or more at max effort', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: set({ kg: 80, reps: 6, effort: 'max' }),
      targetKg: 80, targetReps: 8, historyCount: 5,
    });
    expect(r?.title).toContain('ease off');
    expect(r?.action).toContain('77.5');
  });

  it('stays quiet when missed by only one at max effort', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: set({ kg: 80, reps: 7, effort: 'max' }),
      targetKg: 80, targetReps: 8, historyCount: 5,
    });
    expect(r).toBeNull();
  });

  it('stays quiet at ideal effort', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: set({ kg: 80, reps: 8, effort: 'ideal' }),
      targetKg: 80, targetReps: 8, historyCount: 5,
    });
    expect(r).toBeNull();
  });

  it('stays quiet on a non-live commit', () => {
    const r = autoregulationSuggestion({
      exerciseId: 'bench', exerciseName: 'Bench Press',
      firstSet: { fidelity: 'retro', kg: 80, reps: 10, effort: 'easy' },
      targetKg: 80, targetReps: 8, historyCount: 5,
    });
    expect(r).toBeNull();
  });

  it('stays quiet without effort, kg, reps or a target', () => {
    expect(autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: set({ kg: 80, reps: 10 }), targetKg: 80, targetReps: 8, historyCount: 5 })).toBeNull();
    expect(autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: set({ effort: 'easy', reps: 10 }), targetKg: 80, targetReps: 8, historyCount: 5 })).toBeNull();
    expect(autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: set({ kg: 80, effort: 'easy' }), targetKg: 80, targetReps: 8, historyCount: 5 })).toBeNull();
    expect(autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: set({ kg: 80, reps: 10, effort: 'easy' }), targetKg: 0, targetReps: 8, historyCount: 5 })).toBeNull();
  });
});

describe('autoregulation without equipment never repeats the load (BR-18)', () => {
  it('a step that rounds back to the target moves a full 2.5 kg', async () => {
    const { autoregulationSuggestion } = await import('@/brain/coach/live');
    const up = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: { kg: 40, reps: 10, effort: 'easy', fidelity: 'live' }, targetKg: 40, targetReps: 8, historyCount: 5 })!;
    expect(up.action).toBe('Try 42.5 kg for the next set.');
    const down = autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: { kg: 40, reps: 4, effort: 'max', fidelity: 'live' }, targetKg: 40, targetReps: 8, historyCount: 5 })!;
    expect(down.action).toMatch(/^Drop to 37.5 kg/);
  });
  it('a drop is always lighter and an increase always heavier, off-grid targets too (QA-R3b-1)', async () => {
    const { autoregulationSuggestion } = await import('@/brain/coach/live');
    const drop = (t: number) => autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: { kg: t, reps: 4, effort: 'max', fidelity: 'live' }, targetKg: t, targetReps: 8, historyCount: 5 })!.action;
    const add = (t: number) => autoregulationSuggestion({ exerciseId: 'x', exerciseName: 'X', firstSet: { kg: t, reps: 10, effort: 'easy', fidelity: 'live' }, targetKg: t, targetReps: 8, historyCount: 5 })!.action;
    for (const t of [44.9, 45.359, 64, 101.3]) {
      expect(Number(/Drop to ([\d.]+) kg/.exec(drop(t))![1])).toBeLessThan(t);
      expect(Number(/Try ([\d.]+) kg/.exec(add(t))![1])).toBeGreaterThan(t);
    }
  });
});

describe('a missed set on the empty bar (QA2-FC-6)', () => {
  it('never says to drop to the same bar; it keeps the load and changes the reps and rest', async () => {
    const { autoregulationSuggestion } = await import('@/brain/coach/live');
    const { defaultProfile, LB_BAR_KG } = await import('@/brain/units');
    for (const [kg, eq] of [[20, defaultProfile('Barbell', 'kg')], [LB_BAR_KG, defaultProfile('Barbell', 'lb')]] as const) {
      const a = autoregulationSuggestion({ exerciseId: 'lib_barbell_bench_press', exerciseName: 'Bench', firstSet: { kg, reps: 2, effort: 'max', fidelity: 'live' }, targetKg: kg, targetReps: 6, historyCount: 0, equipment: eq })!;
      expect(a.action).not.toMatch(/^Drop to/);
      expect(a.action).toMatch(/^Stay at (20 kg|45 lb)/);
    }
    // Above the bar it still drops.
    const heavier = autoregulationSuggestion({ exerciseId: 'lib_barbell_bench_press', exerciseName: 'Bench', firstSet: { kg: 60, reps: 2, effort: 'max', fidelity: 'live' }, targetKg: 60, targetReps: 6, historyCount: 5, equipment: defaultProfile('Barbell', 'kg') })!;
    expect(heavier.action).toMatch(/^Drop to/);
  });
});

// BUG-15 (COACHRULES-F7): plan 6.13, never an increase on a back-off day.
describe('autoregulation on a lighter week, amber or red day (BUG-15)', () => {
  const set = (p: Partial<LoggedSet>): LoggedSet => ({ fidelity: 'live', ...p }) as LoggedSet;
  it('A5: an easy first set brings no "add load" when the load is held; a missed one still eases off', () => {
    const r = autoregulationSuggestion({ exerciseId: 'bench', exerciseName: 'Bench Press', firstSet: set({ kg: 60, reps: 8, effort: 'easy' }), targetKg: 60, targetReps: 8, historyCount: 5, holdLoad: true });
    expect(r?.title).not.toMatch(/add load/);
    expect(r?.action).toBe('Keep 60 kg for the next set.');
    const miss = autoregulationSuggestion({ exerciseId: 'bench', exerciseName: 'Bench Press', firstSet: set({ kg: 60, reps: 4, effort: 'max' }), targetKg: 60, targetReps: 8, historyCount: 5, holdLoad: true });
    expect(miss?.title).toMatch(/Bench Press/);
    expect(miss?.title).not.toMatch(/add load/);
  });
});

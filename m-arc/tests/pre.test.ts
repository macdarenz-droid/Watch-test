import { describe, it, expect } from 'vitest';
import { mastersDefaults, preSessionInsights, warmupRamp, warmupSets, workingLoadTarget } from '@/brain/coach/pre';
import { exerciseHistory } from '@/brain/history';
import { session, sets } from './helpers';
import type { Split } from '@/core/models';

const bench = 'lib_barbell_bench_press';

describe('workingLoadTarget', () => {
  it('needs 3+ sessions with e1RM before it fires', () => {
    const a = session('2026-09-01', [{ id: bench, sets: sets(60, 8) }]);
    expect(workingLoadTarget(exerciseHistory([a], bench), bench, 'Bench', 8)).toBeNull();
  });
  it('gives a load target once there is enough history', () => {
    const days = ['2026-09-01', '2026-09-05', '2026-09-09', '2026-09-13'];
    const s = days.map((d, i) => session(d, [{ id: bench, sets: sets(60 + i, 8, 'ideal') }]));
    const t = workingLoadTarget(exerciseHistory(s, bench), bench, 'Bench', 8);
    expect(t).not.toBeNull();
    expect(t!.action).toMatch(/kg/);
  });
});

describe('warmupRamp (BR-09: ramps to the first working set, not e1RM)', () => {
  it('gives three ramp steps at 50/70/85% of the working load', () => {
    const w = warmupRamp(100, bench, 'Bench')!;
    expect(w.action).toBe('50 x 8, 70 x 5, 85 x 2, then your working sets.');
  });
  it('null without a working load', () => {
    expect(warmupRamp(null, bench, 'Bench')).toBeNull();
  });
  it('prints loads in the equipment unit', () => {
    const w = warmupRamp(102.058, bench, 'Bench', { unit: 'lb', step: 5 } as never)!;
    expect(w.action).toMatch(/lb x 8/);
  });
});

describe('warmupSets (F3.4, D10)', () => {
  it('rounds 50/70/85% of the working load to the load step, at 8/5/2 reps', () => {
    expect(warmupSets(100)).toEqual([{ kg: 50, reps: 8 }, { kg: 70, reps: 5 }, { kg: 85, reps: 2 }]);
  });
  it('never gives a warm-up at or above the working load', () => {
    expect(warmupSets(20, { unit: 'kg', step: 10 } as never).every(w => w.kg < 20)).toBe(true);
    expect(warmupSets(0)).toEqual([]);
  });
});

describe('mastersDefaults', () => {
  it('only fires at 60+', () => {
    expect(mastersDefaults(45)).toBeNull();
    expect(mastersDefaults(61)).not.toBeNull();
    expect(mastersDefaults(null)).toBeNull();
  });
});

describe('preSessionInsights', () => {
  it('assembles insights for the exercises in the split', () => {
    const days = ['2026-09-01', '2026-09-05', '2026-09-09', '2026-09-13'];
    const s = days.map((d, i) => session(d, [{ id: bench, sets: sets(60 + i, 8, 'ideal') }]));
    const split: Split = { id: 'split_push', name: 'Push', color: '#fff', exercises: [{ exerciseId: bench, sets: 3 }], focus: [], createdAt: '2026-01-01' };
    const out = preSessionInsights({ sessions: s, custom: [], today: '2026-09-18', split, profile: { name: 'Test' }, age: null });
    expect(out.length).toBeGreaterThan(0);
    expect(out.every(i => i.cadence === 'pre')).toBe(true);
  });
  it('quotes the set rows\' target when given one (BR-08)', () => {
    const days = ['2026-09-01', '2026-09-05', '2026-09-09', '2026-09-13'];
    const s = days.map((d, i) => session(d, [{ id: bench, sets: sets(60 + i, 8, 'ideal') }]));
    const split: Split = { id: 'split_push', name: 'Push', color: '#fff', exercises: [{ exerciseId: bench, sets: 3 }], focus: [], createdAt: '2026-01-01' };
    const out = preSessionInsights({ sessions: s, custom: [], today: '2026-09-18', split, profile: { name: 'Test' }, age: null, targetFor: () => ({ kg: 62.5, target: '62.5 kg × 8' }) });
    expect(out.find(i => i.id === `pre:load-target:${bench}`)!.action).toBe('Start around 62.5 kg × 8.');
    expect(out.find(i => i.id === `pre:warmup:${bench}`)!.action).toMatch(/^32.5 x 8, 45 x 5, 52.5 x 2/);
  });
});

describe('no warm-up toggle for an empty-bar working set (QA-R3b-4)', () => {
  it('offers nothing when every step would be the bar', async () => {
    const { warmupOffer } = await import('@/brain/coach/pre');
    const { defaultProfile } = await import('@/brain/units');
    expect(warmupOffer(20, defaultProfile('Barbell', 'kg'))).toBeNull();
    expect(warmupOffer(100, defaultProfile('Barbell', 'kg'))!.length).toBeGreaterThan(0);
    expect(warmupOffer(null)).toBeNull();
  });
});

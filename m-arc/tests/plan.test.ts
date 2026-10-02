import { describe, it, expect } from 'vitest';
import { evaluatePlan, hasBlockingIssues, type PlanDraft } from '@/brain/plan';
import { weeklyVolumeHistory } from '@/brain/weekly';
import { recoveryPctFor } from '@/brain/recovery';
import { readinessSeries } from '@/brain/coach/rules';
import { suggestNext } from '@/brain/progression';
import { PPL6, FULL2, LEGS_BACK_TO_BACK, PUSH, advancedHistory } from './fixtures/plans';
import { session, sets, baseCoachExtras } from './helpers';

const ctx = { goal: 'lean' as const, custom: [], sessions: advancedHistory(), today: '2026-09-22' };

describe('evaluatePlan', () => {
  it('a 6-day PPL for an advanced lifter lands major muscles in band with no blocking issues', () => {
    const e = evaluatePlan(PPL6, ctx);
    expect(hasBlockingIssues(e)).toBe(false);
    for (const m of ['chest', 'lats', 'quads', 'glutes', 'side_delts', 'hamstrings'] as const) expect(e.weeklySets[m]?.status, m).toBe('in');
    expect(e.recoveryConflicts).toEqual([]);
    expect(e.sessionMinutes.every(s => s.minutes < 90)).toBe(true);
    expect(e.score).toBeGreaterThan(60);
  });
  it('a 2-day full body is under band for the big muscles', () => {
    const e = evaluatePlan(FULL2, ctx);
    expect(hasBlockingIssues(e)).toBe(false);
    for (const m of ['chest', 'lats', 'quads'] as const) expect(e.weeklySets[m]?.status, m).toBe('under');
    expect(e.issues.some(i => i.code === 'volume_under')).toBe(true);
    expect(e.issues.some(i => i.code === 'muscles_untrained')).toBe(true);
  });
  it('leg day back to back is a recovery conflict', () => {
    const e = evaluatePlan(LEGS_BACK_TO_BACK, ctx);
    const quads = e.recoveryConflicts.find(c => c.muscle === 'quads');
    expect(quads).toEqual({ muscle: 'quads', days: ['mon', 'tue'], hoursBetween: 24 });
    expect(e.issues.some(i => i.code === 'recovery_conflict')).toBe(true);
  });
  it('wraps the week: Saturday then Sunday is back to back', () => {
    const draft: PlanDraft = { splits: [PUSH], schedule: { sun: 'push', mon: null, tue: null, wed: null, thu: null, fri: null, sat: 'push' } };
    expect(evaluatePlan(draft, ctx).recoveryConflicts.some(c => c.days[0] === 'sat' && c.days[1] === 'sun')).toBe(true);
  });
  it('an unknown exercise blocks', () => {
    const draft: PlanDraft = { ...FULL2, splits: [{ ...FULL2.splits[0]!, exercises: [...FULL2.splits[0]!.exercises, { exerciseId: 'lib_made_up', sets: 3 }] }] };
    const e = evaluatePlan(draft, ctx);
    expect(hasBlockingIssues(e)).toBe(true);
    expect(e.issues.find(i => i.severity === 'block')!.code).toBe('unknown_exercise');
  });
  it('0 sets, unknown refs, no days, too long and far over band all block', () => {
    const zero: PlanDraft = { splits: [{ ref: 'a', name: 'A', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 0 }] }], schedule: { sun: null, mon: 'a', tue: null, wed: null, thu: null, fri: null, sat: null } };
    expect(evaluatePlan(zero, ctx).issues.map(i => i.code)).toContain('zero_sets');
    const ref: PlanDraft = { ...FULL2, schedule: { ...FULL2.schedule, fri: 'ghost' } };
    expect(evaluatePlan(ref, ctx).issues.map(i => i.code)).toContain('unknown_split_ref');
    const none: PlanDraft = { ...FULL2, schedule: { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null } };
    expect(evaluatePlan(none, ctx).issues.map(i => i.code)).toContain('no_training_days');
    const long: PlanDraft = { splits: [{ ref: 'l', name: 'Long', exercises: Array.from({ length: 12 }, (_, i) => ({ exerciseId: ['lib_barbell_bench_press', 'lib_lat_pulldown', 'lib_leg_extension', 'lib_seated_leg_curl'][i % 4]!, sets: 5 })) }], schedule: { sun: null, mon: 'l', tue: null, wed: null, thu: null, fri: null, sat: null } };
    expect(evaluatePlan(long, ctx).issues.map(i => i.code)).toContain('session_too_long');
    const huge: PlanDraft = { splits: [{ ref: 'c', name: 'Chest', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 6 }, { exerciseId: 'lib_pec_fly', sets: 6 }, { exerciseId: 'lib_cable_fly', sets: 6 }] }], schedule: { sun: 'c', mon: null, tue: 'c', wed: null, thu: 'c', fri: null, sat: null } };
    expect(evaluatePlan(huge, ctx).issues.map(i => i.code)).toContain('volume_far_over');
  });
  it('flags a push-heavy plan', () => {
    const draft: PlanDraft = { splits: [PUSH], schedule: { sun: null, mon: 'push', tue: null, wed: 'push', thu: null, fri: null, sat: null } };
    expect(evaluatePlan(draft, ctx).balance.flags).toContain('push_heavy');
  });
  it('gives goal rep ranges per exercise and is deterministic', () => {
    const a = evaluatePlan(PPL6, { ...ctx, goal: 'strength' });
    const bench = a.repRanges.find(r => r.exerciseId === 'lib_barbell_bench_press')!;
    expect(bench.range).toEqual(bench.role === 'main' ? [1, 5] : [6, 12]);
    expect(evaluatePlan(PPL6, ctx)).toEqual(evaluatePlan(PPL6, ctx));
  });
});

describe('weeklyVolumeHistory', () => {
  it('sums sessions, sets, volume and muscle sets per week, newest first', () => {
    const hist = [
      session('2026-09-21', [{ id: 'lib_barbell_bench_press', sets: sets(100, 5, 'ideal', 3) }]),
      session('2026-09-22', [{ id: 'lib_lat_pulldown', sets: sets(50, 10, 'ideal', 2) }]),
      session('2026-09-15', [{ id: 'lib_barbell_bench_press', sets: sets(90, 5, 'ideal', 4) }]),
    ];
    const w = weeklyVolumeHistory(hist, '2026-09-22', 3);
    expect(w).toHaveLength(3);
    expect(w[0]).toMatchObject({ week: '2026-09-21', sessions: 2, sets: 5, volumeKg: 2500 });
    expect(w[0]!.muscleSets.chest).toBe(3);
    expect(w[1]).toMatchObject({ week: '2026-09-14', sessions: 1, sets: 4, volumeKg: 1800 });
    expect(w[2]!.sessions).toBe(0);
  });
});

describe('moved and new brain helpers', () => {
  it('recoveryPctFor takes the lowest primary muscle', () => {
    expect(recoveryPctFor('lib_leg_press', [], [{ muscle: 'quads', pct: 70 }, { muscle: 'glutes', pct: 55 }])).toBe(55);
    expect(recoveryPctFor('nope', [], [])).toBeUndefined();
  });
  it('readinessSeries returns one entry per day, null without inputs', () => {
    const series = readinessSeries({ ...baseCoachExtras, sessions: [], splits: [], schedule: { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null }, custom: [], today: '2026-09-22', now: Date.parse('2026-09-22T12:00:00Z') }, 7);
    expect(series).toHaveLength(7);
    expect(series.every(r => r === null)).toBe(true);
  });
  it('loadFactor scales a target down like a deload', () => {
    const hist = ['2026-09-15', '2026-09-18'].map(d => session(d, [{ id: 'lib_barbell_bench_press', sets: sets(100, 8, 'ideal') }]));
    const plain = suggestNext(hist, 'lib_barbell_bench_press', 'lean', '2026-09-22');
    const light = suggestNext(hist, 'lib_barbell_bench_press', 'lean', '2026-09-22', 3, [], { loadFactor: 0.8 });
    expect(light.kg).toBe(Math.round(plain.kg! * 0.8 * 2) / 2);
    expect(light.reason).toContain('Adjusted for today');
  });
});

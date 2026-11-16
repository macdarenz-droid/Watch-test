import { describe, it, expect } from 'vitest';
import { buildProposal, buildAction, fingerprint } from '@/escobar/tools/actions';
import { ctxOf, twoWeeksState, sixMonthsState } from './fixtures';
import { PPL6 } from '../fixtures/plans';

const ctx = ctxOf(twoWeeksState());
const err = (name: string, input: unknown, c = ctx) => { try { buildAction(name, input, c); return ''; } catch (e) { return (e as Error).message; } };

describe('proposal validation (§10.2)', () => {
  it('create split: valid, unknown exercise, sets range, too many, cap', () => {
    const p = buildProposal('propose_split', { action: 'create', name: 'Arms', exercises: [{ exerciseId: 'lib_barbell_curl', sets: 3 }] }, ctx, 'p1');
    expect(p).toMatchObject({ id: 'p1', kind: 'propose_split', title: 'Create split: Arms' });
    expect(p.preview[0]).toEqual({ label: 'Barbell Curl', after: '3 sets' });
    expect(err('propose_split', { action: 'create', name: 'X', exercises: [{ exerciseId: 'lib_nope', sets: 3 }] })).toMatch(/unknown exerciseId/);
    expect(err('propose_split', { action: 'create', name: 'X', exercises: [{ exerciseId: 'lib_barbell_curl', sets: 9 }] })).toMatch(/1–6/);
    expect(err('propose_split', { action: 'create', name: 'X'.repeat(40), exercises: [] })).toMatch(/28/);
    const full = twoWeeksState();
    full.splits = Array.from({ length: 7 }, (_, i) => ({ ...full.splits[0]!, id: `s${i}` }));
    expect(err('propose_split', { action: 'create', name: 'X', exercises: [{ exerciseId: 'lib_barbell_curl', sets: 3 }] }, ctxOf(full))).toMatch(/already 7/);
  });
  it('modify split diffs sets and rejects a no-op; delete needs a real split', () => {
    const p = buildAction('propose_split', { action: 'modify', splitId: 'sp_push', name: 'Push', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 4 }, { exerciseId: 'lib_triceps_pushdown', sets: 3 }] }, ctx);
    expect(p.preview).toEqual(expect.arrayContaining([{ label: 'Barbell Bench Press', before: '3 sets', after: '4 sets' }, { label: 'Dumbbell Shoulder Press', before: '3 sets', after: 'removed' }]));
    expect(err('propose_split', { action: 'modify', splitId: 'sp_push', name: 'Push', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 3 }, { exerciseId: 'lib_dumbbell_shoulder_press', sets: 3 }, { exerciseId: 'lib_triceps_pushdown', sets: 3 }] })).toMatch(/nothing to change/);
    expect(err('propose_split', { action: 'delete', splitId: 'nope', name: 'x', exercises: [] })).toMatch(/unknown splitId/);
  });
  it('program must pass evaluate_plan and fit the split cap', () => {
    const c = ctxOf(sixMonthsState());
    expect(buildAction('propose_program', { draft: PPL6, replaceExisting: true }, c).title).toContain('Push');
    const five = sixMonthsState();
    five.splits = [...five.splits, { ...five.splits[0]!, id: 'x1' }, { ...five.splits[0]!, id: 'x2' }];
    expect(err('propose_program', { draft: PPL6, replaceExisting: false }, ctxOf(five))).toMatch(/more than 7 splits/);
    const bad = { ...PPL6, schedule: { ...PPL6.schedule, sun: 'ghost' } };
    expect(err('propose_program', { draft: bad, replaceExisting: true }, c)).toMatch(/blocking issues/);
  });
  it('schedule needs all 7 days and known splits', () => {
    const week = { sun: null, mon: 'sp_legs', tue: 'sp_pull', wed: 'sp_legs', thu: 'sp_push', fri: 'sp_pull', sat: 'sp_legs' };
    expect(buildAction('propose_schedule', { week }, ctx).preview).toEqual([{ label: 'Mon', before: 'Push', after: 'Legs' }]);
    expect(err('propose_schedule', { week: { ...week, fri: 'nope' } })).toMatch(/unknown split id/);
    const { sat: _s, ...six } = week;
    expect(err('propose_schedule', { week: six })).toMatch(/sat is missing/);
  });
  it('goal must change', () => {
    expect(buildAction('propose_goal', { goal: 'strength' }, ctx).preview[0]).toEqual({ label: 'Goal', before: 'Lean muscle', after: 'Strength focus' });
    expect(err('propose_goal', { goal: 'lean' })).toMatch(/already/);
    expect(err('propose_goal', { goal: 'bulk' })).toMatch(/unknown goal/);
  });
  it('today changes must reference the split and a load factor in 0.5–1.1', () => {
    const ok = buildAction('propose_today', { splitId: 'sp_push', reason: 'Shoulder is cranky', changes: [{ kind: 'swap', from: 'lib_dumbbell_shoulder_press', to: 'lib_cable_lateral_raise' }, { kind: 'load', exerciseId: 'lib_barbell_bench_press', factor: 0.8 }] }, ctx);
    expect(ok.preview[1]).toEqual({ label: 'Barbell Bench Press', before: 'planned load', after: '80% of the target' });
    expect(err('propose_today', { splitId: 'sp_push', reason: 'x', changes: [{ kind: 'remove', exerciseId: 'lib_lat_pulldown' }] })).toMatch(/not in Push/);
    expect(err('propose_today', { splitId: 'sp_push', reason: 'x', changes: [{ kind: 'load', exerciseId: 'lib_barbell_bench_press', factor: 0.3 }] })).toMatch(/0.5–1.1/);
    expect(err('propose_today', { splitId: 'sp_push', reason: 'x', changes: [] })).toMatch(/at least one/);
  });
  it('start session refuses while one is running', () => {
    const s = twoWeeksState();
    s.active = { splitId: 'sp_push', startedAt: '2026-09-22T17:00:00Z', pausedMs: 0, entries: [] };
    expect(err('propose_start_session', { splitId: 'sp_push' }, ctxOf(s))).toMatch(/already running/);
    expect(buildAction('propose_start_session', { splitId: 'sp_pull' }, ctx).title).toBe('Start Pull');
  });
  it('check-in, profile, custom exercise, reminder, setting, gym', () => {
    expect(buildAction('propose_checkin', { sleepQuality: '2', soreness: [{ muscle: 'quads', level: '4' }] }, ctx).preview).toEqual([{ label: 'Sleep quality', after: '2 of 5' }, { label: 'Quads soreness', after: '4 of 5' }]);
    expect(err('propose_checkin', {})).toMatch(/at least one/);
    expect(buildAction('propose_profile', { field: 'bodyWeightKg', value: 95 }, ctx).preview[0]!.after).toMatch(/big jump/);
    expect(err('propose_profile', { field: 'heightCm', value: 300 })).toMatch(/120–230/);
    expect(err('propose_custom_exercise', { name: 'Barbell Curl', equipment: 'Barbell', primary: ['biceps'], secondary: [], mode: 'weighted', role: 'accessory' })).toMatch(/already exists/);
    expect(buildAction('propose_custom_exercise', { name: 'Zottman Curl', equipment: 'Dumbbells', primary: ['biceps'], secondary: ['forearms'], mode: 'weighted', role: 'accessory' }, ctx).title).toBe('Add exercise: Zottman Curl');
    expect(buildAction('propose_reminder', { enabled: true, time: '07:15' }, ctx).preview.map(r => r.label)).toEqual(['Reminders', 'Time']);
    expect(err('propose_reminder', { enabled: true, time: '7pm' })).toMatch(/HH:MM/);
    expect(buildAction('propose_setting', { setting: { key: 'restDefaultSec', value: 120 } }, ctx).preview[0]).toEqual({ label: 'Rest length', before: '90 s', after: '120 s' });
    expect(err('propose_setting', { setting: { key: 'restDefaultSec', value: 100 } })).toMatch(/invalid value/);
    expect(err('propose_setting', { setting: { key: 'haptics', value: true } })).toMatch(/already/);
    expect(buildAction('propose_gym', { name: 'Work gym', defaultUnit: 'lb' }, ctx).title).toBe('Add gym: Work gym');
    expect(err('propose_gym', { name: 'My gym', defaultUnit: 'kg' })).toMatch(/already exists/);
  });
  it('equipment profile validation (§25.6)', () => {
    const ok = buildAction('propose_equipment_profile', { scope: 'equipment', equipmentGroup: 'Dumbbells', profile: { unit: 'lb', ladder: [5, 10, 15, 20] } }, ctx);
    expect(ok.title).toContain('All Dumbbells at My gym');
    expect(err('propose_equipment_profile', { scope: 'equipment', equipmentGroup: 'Dumbbells', profile: { unit: 'lb', ladder: [10, 5] } })).toMatch(/ascending/);
    expect(err('propose_equipment_profile', { scope: 'exercise', exerciseId: 'lib_barbell_bench_press', profile: { unit: 'kg', barKg: 50 } })).toMatch(/5–30/);
    expect(err('propose_equipment_profile', { scope: 'exercise', exerciseId: 'lib_barbell_bench_press', profile: { unit: 'kg', step: 0 } })).toMatch(/above 0/);
    expect(err('propose_equipment_profile', { scope: 'equipment', equipmentGroup: 'Dumbbells', profile: { unit: 'stone' } })).toMatch(/kg or lb/);
    expect(err('propose_equipment_profile', { scope: 'equipment', equipmentGroup: 'Dumbbells', profile: { unit: 'lb', ladder: Array.from({ length: 81 }, (_, i) => i + 1) } })).toMatch(/80/);
  });
  it('pin card checks the component and the pin cap', () => {
    expect(buildAction('pin_card', { component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press' }, title: 'Bench trend', days: 14 }, ctx).preview[0]!.after).toBe('pinned for 14 days');
    expect(err('pin_card', { component: 'nope', params: {}, title: 'x' })).toMatch(/unknown component/);
  });
  it('fingerprint changes when the touched state changes, not otherwise', () => {
    const s = twoWeeksState();
    const input = { action: 'modify', splitId: 'sp_push' };
    const a = fingerprint('propose_split', input, s);
    expect(fingerprint('propose_split', input, { ...s, goal: 'strength' })).toBe(a);
    expect(fingerprint('propose_split', input, { ...s, splits: s.splits.map(x => (x.id === 'sp_push' ? { ...x, name: 'Push A' } : x)) })).not.toBe(a);
  });
});

describe('today swaps (QA2-FD-9)', () => {
  it('a swap of an exercise to itself is refused', async () => {
    const { buildAction } = await import('@/escobar/tools/actions');
    const { ctxOf, twoWeeksState } = await import('./fixtures');
    const s = twoWeeksState();
    const sp = s.splits[0]!;
    const id = sp.exercises[0]!.exerciseId;
    expect(() => buildAction('propose_today', { splitId: sp.id, reason: 'x', changes: [{ kind: 'swap', from: id, to: id }] }, ctxOf(s))).toThrow(/different exercise/);
  });
});

import { describe, it, expect } from 'vitest';
import { executeTool, statusLabel, genericLabel } from '@/escobar/tools/executor';
import { ctxOf, sixMonthsState, twoWeeksState } from './fixtures';
import type { Fact } from '@/escobar/types';

const env = (s = sixMonthsState(), ledger: Fact[] = []) => ({ ctx: ctxOf(s), ledger, turn: 0, proposalCount: 0 });
const run = (name: string, input: unknown, e = env()) => executeTool({ id: 'tu_1', name, input }, e);
const parse = (c: string) => JSON.parse(c) as { data?: Record<string, unknown>; facts?: Record<string, string>; error?: string };

describe('executor', () => {
  it('wraps read results as {data, facts} and registers facts', () => {
    const o = run('get_overview', {});
    expect(o.isError).toBe(false);
    const c = parse(o.content);
    expect(c.data!.today).toBe('2026-09-22');
    expect(Object.keys(c.facts!).length).toBe(o.facts.length);
    expect(o.facts[0]!.id).toBe('f1');
  });
  it('fact ids continue the conversation ledger', () => {
    const first = run('get_recovery', { muscles: ['chest'] });
    const second = run('get_recovery', { muscles: ['quads'] }, env(sixMonthsState(), first.facts));
    expect(second.facts[0]!.id).toBe(`f${first.facts.length + 1}`);
  });
  it('errors are is_error with a reason naming the fix', () => {
    const o = run('get_exercise_history', { exerciseId: 'nope' });
    expect(o.isError).toBe(true);
    expect(parse(o.content).error).toMatch(/search_exercises/);
    expect(run('get_sessions', { limit: 99 }).content).toMatch(/limit must be between 1 and 20/);
    expect(run('no_such_tool', {}).isError).toBe(true);
  });
  it('gates health and body tools when sharing is off (§8.6)', () => {
    const s = sixMonthsState();
    s.escobar.sharing = { health: false, body: false };
    const h = parse(run('get_health', {}, env(s)).content);
    expect(h.data).toEqual({ denied: 'health_sharing_off', how: 'Settings → Escobar → Share health data' });
    expect(parse(run('get_body', {}, env(s)).content).data!.denied).toBe('body_sharing_off');
    expect(parse(run('show', { component: 'body_trend', params: {} }, env(s)).content).data!.denied).toBe('body_sharing_off');
    expect(parse(run('get_health', {}).content).data!.days).toBeTruthy();
  });
  it('show returns the drawn summary and a render instruction', () => {
    const o = run('show', { component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press', weeks: 8 }, caption: 'Bench' });
    expect(o.show!.component).toBe('lift_trend');
    expect((o.show!.summary.points as unknown[]).length).toBeGreaterThan(0);
    expect(o.facts.length).toBeGreaterThan(0);
    expect(run('show', { component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press', weeks: 99 } }).isError).toBe(true);
  });
  it('navigate validates the palace target', () => {
    const o = run('navigate', { target: 'body.recovering', auto: true });
    expect(o.navigate).toMatchObject({ target: 'body.recovering', auto: true, title: 'Recovering muscles' });
    expect(run('navigate', { target: 'nowhere' }).isError).toBe(true);
    // R1.2: only known keys pass, and a made-up muscle is an error that lists the real ones.
    const kept = run('navigate', { target: 'body.recovering', params: [{ key: 'muscle', value: 'quads' }, { key: 'evil', value: 'x' }] });
    expect(kept.navigate!.params).toEqual({ muscle: 'quads' });
    const bad = run('navigate', { target: 'body.recovering', params: [{ key: 'muscle', value: 'wings' }] });
    expect(bad.isError).toBe(true);
    expect(parse(bad.content).error).toMatch(/muscle must be one of .*chest/);
  });
  it('actions return awaiting_user with a proposal and deterministic ids', () => {
    const e = { ...env(twoWeeksState()), proposalCount: 4 };
    const o = run('propose_goal', { goal: 'strength' }, e);
    expect(o.proposal!.id).toBe('p5');
    expect(parse(o.content).data).toMatchObject({ proposalId: 'p5', status: 'awaiting_user' });
    expect(run('propose_goal', { goal: 'lean' }, env(twoWeeksState())).isError).toBe(true);
  });
  it('escalate renders the fixed card; snooze applies at once as an effect', () => {
    expect(run('escalate', { kind: 'pain' }).escalation).toEqual({ kind: 'pain' });
    expect(run('escalate', { kind: 'boredom' }).isError).toBe(true);
    expect(run('snooze_insight', { insightId: 'readiness-today', verdict: 'snoozed' }).effect).toEqual({ type: 'snooze', insightId: 'readiness-today', verdict: 'snoozed' });
  });
  it('remember writes with dedupe, injury expiry, and the memory toggle', () => {
    const r = run('remember', { kind: 'injury', text: 'Right knee aches on lunges' });
    expect(r.effect!.type).toBe('remember');
    const item = (r.effect as { item: { expiresOn: string; source: string } }).item;
    expect(item.expiresOn).toBe('2026-11-03');
    expect(item.source).toBe('user_said');
    expect(parse(run('remember', { kind: 'equipment', text: 'home gym has dumbbells up to 30 kg!' }).content).data!.alreadyKnown).toBe(true);
    expect(run('remember', { kind: 'episode', text: 'x' }).isError).toBe(true);
    expect(run('remember', { kind: 'fact', text: 'x'.repeat(201) }).isError).toBe(true);
    const off = sixMonthsState(); off.escobar.memoryEnabled = false;
    expect(parse(run('remember', { kind: 'fact', text: 'Works nights' }, env(off)).content).data!.denied).toBe('memory_off');
  });
  it('forget and recall', () => {
    expect(run('forget', { memoryId: 'm2' }).effect).toEqual({ type: 'forget', id: 'm2' });
    expect(run('forget', { memoryId: 'zzz' }).isError).toBe(true);
    const items = parse(run('recall', { kind: 'injury' }).content).data!.items as Array<{ memoryId: string }>;
    expect(items.map(i => i.memoryId)).toEqual(['m1']);
  });
  it('knowledge facts carry the card id so ⟦k:…⟧ can ground them', () => {
    const o = run('lookup_knowledge', { ids: ['protein_intake'] });
    expect(o.facts.every(f => f.label.startsWith('k:protein_intake'))).toBe(true);
    expect(o.facts.map(f => f.value)).toEqual([1.6, 2.2]);
  });
  it('explain_method and evaluate_plan', () => {
    expect(parse(run('explain_method', { topic: 'recovery' }).content).data!.topic).toBe('recovery');
    expect(run('explain_method', { topic: 'astrology' }).isError).toBe(true);
    const ev = parse(run('evaluate_plan', { draft: { splits: [{ ref: 'a', name: 'A', exercises: [{ exerciseId: 'lib_nope', sets: 3 }] }], schedule: { sun: null, mon: 'a', tue: null, wed: null, thu: null, fri: null, sat: null } } }).content);
    expect((ev.data!.issues as Array<{ code: string }>).some(i => i.code === 'unknown_exercise')).toBe(true);
  });
  it('status labels resolve exercise names; generic labels by kind', () => {
    const ctx = ctxOf(sixMonthsState());
    expect(statusLabel('get_exercise_history', { exerciseId: 'lib_barbell_bench_press' }, ctx)).toBe('Reading your Barbell Bench Press history…');
    expect(statusLabel('get_recovery', {}, ctx)).toBe('Checking recovery…');
    expect(statusLabel('evaluate_plan', {}, ctx)).toBe('Checking the plan against your volume and recovery…');
    expect(genericLabel('propose_split')).toBe('Preparing a change…');
    expect(genericLabel('get_overview')).toBe('Looking into it…');
  });
});

describe("recall dates (QA2-FD-5)", () => {
  it("a memory's 'since' is the phone's day, as on the memory screen", async () => {
    const { dayKey } = await import('@/core/dates');
    const s = twoWeeksState();
    const createdAt = '2026-09-22T22:30:00.000Z';
    const st = { ...s, escobar: { ...s.escobar, memory: [{ id: 'm1', kind: 'injury' as const, text: 'Left shoulder', createdAt, source: 'user' }] } };
    const e = { ctx: ctxOf(st as never), ledger: [] as Fact[], turn: 0, proposalCount: 0 };
    const items = JSON.parse(executeTool({ id: 'tu_9', name: 'recall', input: { kind: 'injury' } }, e).content).data.items as Array<{ since: string }>;
    expect(items[0]!.since).toBe(dayKey(new Date(createdAt)));
  });
});

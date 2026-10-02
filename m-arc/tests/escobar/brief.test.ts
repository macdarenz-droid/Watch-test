import { describe, it, expect } from 'vitest';
import { buildBrief, memoryForBrief, BRIEF_CAP } from '@/escobar/context/brief';
import { buildManifest } from '@/escobar/context/manifest';
import { MODE_ADDENDUM } from '@/escobar/context/modes';
import { ctxOf, sixMonthsState, emptyState, twoWeeksState } from './fixtures';
import type { MemoryItem } from '@/core/models';

describe('situation brief (§11.2)', () => {
  it('is at most 6,000 (and within its 3,000 cap) on six months of data', () => {
    const b = buildBrief({ ctx: ctxOf(sixMonthsState(), { focus: { id: 'history.exercise-stats', details: { exerciseId: 'lib_barbell_bench_press' } } }), mode: 'chat', turnIndex: 0, ledger: [] });
    expect(b.text.length).toBeLessThanOrEqual(6000);
    expect(b.text.length).toBeLessThanOrEqual(BRIEF_CAP);
    expect(b.full).toBe(true);
    for (const k of ['now', 'screen', 'today', 'recovery', 'week', 'top_insights', 'profile', 'gym', 'memory', 'sharing', 'tone', 'mode', 'pending', 'decisions']) expect(b.text).toMatch(new RegExp(`^${k}: `, 'm'));
    expect(b.text).toContain('screen: history.exercise-stats exerciseId=lib_barbell_bench_press');
  });
  it('carries fact ids inline, registered from the ledger length', () => {
    const b = buildBrief({ ctx: ctxOf(sixMonthsState()), mode: 'chat', turnIndex: 0, ledger: [{ id: 'f1', value: 1, label: 'x', source: { tool: 't' }, turn: 0 }] });
    expect(b.facts[0]!.id).toBe('f2');
    const recovery = b.text.split('\n').find(l => l.startsWith('recovery:'))!;
    expect(recovery).toMatch(/\d+% \[f\d+\]/);
    for (const f of b.facts) expect(b.text).toContain(`[${f.id}]`);
    const ids = b.facts.map(f => Number(f.id.slice(1)));
    expect(ids).toEqual(ids.map((_, i) => i + 2));
  });
  it('sends only changed lines between full briefs, plus the always-present ones', () => {
    const ctx = ctxOf(sixMonthsState());
    const first = buildBrief({ ctx, mode: 'chat', turnIndex: 0, ledger: [] });
    const second = buildBrief({ ctx, mode: 'plan', turnIndex: 1, ledger: first.facts, previous: first.lines });
    expect(second.full).toBe(false);
    const keys = second.text.split('\n').slice(1).map(l => l.split(':')[0]);
    expect(keys).toEqual(expect.arrayContaining(['now', 'screen', 'mode', 'pending', 'decisions']));
    expect(keys).not.toContain('profile');
    expect(second.text).toContain(`mode: plan: ${MODE_ADDENDUM.plan}`);
    const fifth = buildBrief({ ctx, mode: 'chat', turnIndex: 5, ledger: [], previous: first.lines });
    expect(fifth.full).toBe(true);
  });
  it('reports pending proposals and decisions', () => {
    const b = buildBrief({ ctx: ctxOf(twoWeeksState()), mode: 'chat', turnIndex: 1, ledger: [], previous: {}, pending: [{ id: 'p2', title: 'Switch goal' }], decisions: [{ proposalId: 'p1', title: 'Create split: Arms', decision: 'applied' }] });
    expect(b.text).toContain('pending: p2 "Switch goal"');
    expect(b.text).toContain('decisions: proposal p1 "Create split: Arms" → applied');
  });
  it('drops gated details when sharing is off and flags a minor', () => {
    const s = sixMonthsState();
    s.escobar.sharing = { health: false, body: false };
    s.profile.birthYear = 2010;
    const b = buildBrief({ ctx: ctxOf(s), mode: 'chat', turnIndex: 0, ledger: [] });
    expect(b.text).not.toMatch(/weight \d/);
    expect(b.text).toContain('sharing: health and body sharing off');
    expect(b.text).toContain('minor: true');
  });
  it('works on an empty state', () => {
    const b = buildBrief({ ctx: ctxOf(emptyState()), mode: 'chat', turnIndex: 0, ledger: [] });
    expect(b.text).toContain('recovery: nothing logged');
    expect(b.text).toContain('now: tue 2026-09-22');
  });
  it('memory puts injuries, equipment and agreements first, 12 at most', () => {
    const m = (i: number, kind: MemoryItem['kind'], updatedAt: string): MemoryItem => ({ id: `m${i}`, kind, text: `t${i}`, source: 'user_said', createdAt: updatedAt, updatedAt });
    const list = [m(1, 'preference', '2026-09-20'), m(2, 'injury', '2026-01-01'), ...Array.from({ length: 15 }, (_, i) => m(10 + i, 'fact', `2026-09-${String(i + 1).padStart(2, '0')}`))];
    const out = memoryForBrief(list, '2026-09-22');
    expect(out).toHaveLength(12);
    expect(out[0]!.id).toBe('m2');
    expect(out[1]!.id).toBe('m1');
  });
});

describe('palace manifest (§7.3)', () => {
  it('is byte-stable across builds and changes with the version', () => {
    const a = buildManifest('37.0.0'), b = buildManifest('37.0.0');
    expect(a.hash).toBe(b.hash);
    expect(JSON.stringify(a.body)).toBe(JSON.stringify(b.body));
    expect(buildManifest('37.0.1').hash).not.toBe(a.hash);
  });
  it('is 6–40 KB and lists every entry, method and component', () => {
    const m = buildManifest('37.0.0');
    const size = JSON.stringify(m.body).length;
    expect(size).toBeGreaterThan(6000);
    expect(size).toBeLessThan(40_000);
    expect(m.body.entries.length).toBeGreaterThanOrEqual(65);
    expect(Object.keys(m.body.methods)).toHaveLength(16);
    expect(m.body.components).toHaveLength(14);
  });
});

describe('the brief lists a midnight-crossing session as done today (QA8-6)', () => {
  it('a session from 23:30 to 00:40, briefed at 01:00, lines up as done today', async () => {
    const { freshState } = await import('@/core/models');
    const { makeCtx } = await import('@/escobar/tools/context');
    const { sessionAt } = await import('../helpers');
    const { dayKey } = await import('@/core/dates');
    const started = new Date(2026, 8, 25, 23, 30);
    const finishedLate = { ...sessionAt(started.toISOString(), new Date(2026, 8, 26, 0, 40).toISOString(), []), splitId: 'split_lower', splitName: 'SPLIT 2 - LOWER AND CORE', day: dayKey(started) };
    const state = { ...freshState(), sessions: [finishedLate] };
    const ctx = makeCtx(state, new Date(2026, 8, 26, 1, 0).getTime());
    const b = buildBrief({ ctx, mode: 'chat', turnIndex: 0, ledger: [] });
    const today = b.text.split('\n').find(l => l.startsWith('today:'))!;
    expect(today).toContain('done today: SPLIT 2 - LOWER AND CORE');
  });
});

describe('the brief without a session today is byte-identical to before QA8-6', () => {
  it('the "now" and "today" lines match the plain day-based reading', () => {
    const ctx = ctxOf(sixMonthsState());
    const b = buildBrief({ ctx, mode: 'chat', turnIndex: 0, ledger: [] });
    const plainDoneToday = ctx.state.sessions.filter(x => x.day === ctx.today);
    const nowLine = b.text.split('\n').find(l => l.startsWith('now:'))!;
    const todayLine = b.text.split('\n').find(l => l.startsWith('today:'))!;
    expect(todayLine.includes('done today:')).toBe(plainDoneToday.length > 0);
    if (plainDoneToday.length) expect(todayLine).toContain(`done today: ${plainDoneToday.map(x => x.splitName).join(', ')}`);
    // the pre-QA8-5 formula: the latest session day, whatever the list order (BR-29)
    const lastDay = ctx.state.sessions.reduce((m, s) => (s.day > m ? s.day : m), '');
    const plainSince = lastDay ? Math.round((Date.parse(ctx.today) - Date.parse(lastDay)) / 86_400_000) : null;
    expect(nowLine.includes('trained today')).toBe(plainSince === 0);
    expect(nowLine.includes('no sessions logged yet')).toBe(plainSince == null);
  });
});

describe('BUG-33 the "now" line names the unit of the days since the last session', () => {
  // Local clock times, so `npm run test:tz` pins the same line in New York and Manila.
  const briefAt = async (lastDay: number) => {
    const { freshState } = await import('@/core/models');
    const { makeCtx } = await import('@/escobar/tools/context');
    const { sessionAt } = await import('../helpers');
    const { dayKey } = await import('@/core/dates');
    const started = new Date(2026, 8, lastDay, 18, 0);
    const session = { ...sessionAt(started.toISOString(), new Date(2026, 8, lastDay, 19, 0).toISOString(), []), day: dayKey(started) };
    return buildBrief({ ctx: makeCtx({ ...freshState(), sessions: [session] }, new Date(2026, 8, 26, 4, 51).getTime()), mode: 'chat', turnIndex: 0, ledger: [] });
  };
  it('one day ago, at a 04:51 local clock', async () => {
    const b = await briefAt(25);
    expect(b.text.split('\n')[0]).toBe('now: sat 2026-09-26, night 04:51; last session 1 [f1] day ago');
    expect(b.lines.now).toBe('sat 2026-09-26, night 04:51; last session 1 day ago');
    expect(b.facts[0]).toMatchObject({ id: 'f1', value: 1, label: 'days since last session', unit: 'days' });
  });
  it('three days ago', async () => {
    const b = await briefAt(23);
    expect(b.text.split('\n')[0]).toBe('now: sat 2026-09-26, night 04:51; last session 3 [f1] days ago');
  });
});

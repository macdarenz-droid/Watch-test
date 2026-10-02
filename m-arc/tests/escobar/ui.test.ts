import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { replaceState, state } from '@/core/store';
import { NOW, twoWeeksState, emptyState, ctxOf } from './fixtures';
import { turnsOf } from '@/escobar/ui/Message';
import { starterChips, dockPromptFor, contextRefFor } from '@/escobar/ui/prompts';
import { decide, canApply } from '@/escobar/apply';
import { buildProposal } from '@/escobar/tools/actions';
import { newConversation } from '@/escobar/store';
import { GOALS } from '@/data/goals';
import type { Conversation, StoredMessage } from '@/escobar/types';

describe('turnsOf', () => {
  it('groups tool steps, repairs and results into one Escobar turn per user message', () => {
    const m: StoredMessage[] = [
      { role: 'user', content: [{ type: 'text', text: 'hi' }] },
      { role: 'system', content: 'brief' },
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'get_overview', input: {} }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '{}' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'first' }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'text', text: '[app] verification check' }], meta: { repair: true } },
      { role: 'assistant', content: [{ type: 'text', text: 'fixed' }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'text', text: 'next' }] },
    ];
    const t = turnsOf(m);
    expect(t.map(x => x.kind)).toEqual(['user', 'escobar', 'user']);
    expect(t[1]).toEqual({ kind: 'escobar', indexes: [2, 3, 4, 5, 6] });
  });
});

describe('prompts', () => {
  it('offers six distinct starter chips, naming the last lift when there is one', () => {
    const s = twoWeeksState();
    const chips = starterChips(s, null);
    expect(chips).toHaveLength(6);
    expect(new Set(chips).size).toBe(6);
    expect(chips.some(c => /^Show my .+ trend$/.test(c))).toBe(true);
    expect(starterChips(emptyState(), null)).toContain('Build me a 4-day programme');
  });
  it('follows the screen for the dock line and the context chip', () => {
    const s = twoWeeksState();
    const ex = s.sessions.at(-1)!.exercises[0]!.exerciseId;
    expect(dockPromptFor({ id: 'history.exercise-stats', details: { exerciseId: ex } }, s, null)).toMatch(/^How is my .+ going\?$/);
    expect(dockPromptFor({ id: 'body.muscle', details: { muscle: 'chest' } }, s, null)).toMatch(/recovered\?$/);
    expect(dockPromptFor(null, s, { band: 'amber' } as never)).toBe('Why is my readiness amber?');
    expect(contextRefFor({ id: 'body.muscle', details: { muscle: 'chest' } }, s)).toMatchObject({ kind: 'muscle', id: 'chest' });
    expect(contextRefFor({ id: 'today.header' }, s)?.kind).toBe('readiness');
    expect(contextRefFor({ id: 'settings.theme' }, s)).toBeNull();
  });
});

describe('apply (EV5 slice)', () => {
  beforeEach(() => { vi.useFakeTimers({ now: NOW, toFake: ['Date'] }); replaceState(twoWeeksState()); });
  afterEach(() => { vi.useRealTimers(); });

  const withGoalProposal = (): Conversation => {
    const other = GOALS.find(g => g.id !== state.value.goal)!.id;
    const p = buildProposal('propose_goal', { goal: other }, ctxOf(state.value), 'p1');
    return { ...newConversation('test', 'chat'), proposals: [{ ...p, status: 'awaiting', messageIndex: 2 }] };
  };

  it('applies a goal change, records the decision, and undoes it', () => {
    const before = state.value.goal;
    const c = withGoalProposal();
    expect(canApply('propose_goal')).toBe(true);
    const a = decide(c, 'p1', 'apply');
    expect(a.result.status).toBe('applied');
    expect(state.value.goal).not.toBe(before);
    expect(a.conversation.pendingDecisions?.[0]).toMatchObject({ proposalId: 'p1', decision: 'applied' });
    const u = decide(a.conversation, 'p1', 'undo', a.result.undo);
    expect(u.result.status).toBe('undone');
    expect(state.value.goal).toBe(before);
  });

  it('refuses a stale proposal when the goal changed since', () => {
    const c = withGoalProposal();
    const third = GOALS.find(g => g.id !== state.value.goal && g.id !== (c.proposals![0]!.input.goal as string))!.id;
    replaceState({ ...state.value, goal: third });
    const r = decide(c, 'p1', 'apply');
    expect(r.result.status).toBe('stale');
    expect(state.value.goal).toBe(third);
  });

  it('dismisses without touching state', () => {
    const before = state.value.goal;
    const r = decide(withGoalProposal(), 'p1', 'dismiss');
    expect(r.result.status).toBe('dismissed');
    expect(r.conversation.proposals?.[0]?.status).toBe('dismissed');
    expect(state.value.goal).toBe(before);
  });
});

import { pastTense, splitCitations } from '@/escobar/ui/present';
describe('plain-words presentation', () => {
  it('turns activity labels into past tense', () => {
    expect(pastTense('Reading your Lat Pulldown history…')).toBe('Read your Lat Pulldown history');
    expect(pastTense('Counting your weekly sets…')).toBe('Counted your weekly sets');
    expect(pastTense('Drawing lift trend…')).toBe('Drew lift trend');
    expect(pastTense('Something else')).toBe('Something else');
  });
  it('gathers a sentence’s fact citations into one list and drops card citations (LR-23)', () => {
    const r = splitCitations('You held 67 kg ⟦f4⟧ then dropped to 47 kg ⟦f5⟧⟦f6⟧, protein ⟦k:protein_intake⟧ helps ⟦f4,f7⟧.');
    expect(r.ids).toEqual(['f4', 'f5', 'f6', 'f7']);
    expect(r.text).toBe('You held 67 kg then dropped to 47 kg, protein helps.');
  });
});

import { PPL6 } from '../fixtures/plans';
describe('apply every proposal kind (round trip)', () => {
  beforeEach(() => { vi.useFakeTimers({ now: NOW, toFake: ['Date'] }); replaceState(twoWeeksState()); });
  afterEach(() => { vi.useRealTimers(); });
  const run = (name: string, input: Record<string, unknown>) => {
    const p = buildProposal(name, input, ctxOf(state.value), 'p1');
    const c = { ...newConversation('test', 'chat'), proposals: [{ ...p, status: 'awaiting' as const, messageIndex: 1 }] };
    expect(canApply(name), name).toBe(true);
    const a = decide(c, 'p1', 'apply');
    expect(a.result.status, `${name}: ${a.result.message}`).toBe('applied');
    return () => decide(a.conversation, 'p1', 'undo', a.result.undo);
  };
  it('creates a split and undoes it', () => {
    const n = state.value.splits.length;
    const undo = run('propose_split', { action: 'create', name: 'Upper Calisthenics', exercises: [{ exerciseId: 'lib_lat_pulldown', sets: 4 }, { exerciseId: 'lib_barbell_bench_press', sets: 3 }] });
    expect(state.value.splits).toHaveLength(n + 1);
    expect(state.value.splits.at(-1)).toMatchObject({ name: 'Upper Calisthenics', exercises: [{ exerciseId: 'lib_lat_pulldown', sets: 4 }, { exerciseId: 'lib_barbell_bench_press', sets: 3 }] });
    undo();
    expect(state.value.splits).toHaveLength(n);
  });
  it('saves a whole programme with its schedule', () => {
    run('propose_program', { draft: { ...PPL6, schedule: { sun: null, mon: 'push', tue: null, wed: 'pull', thu: null, fri: 'legs', sat: null } }, replaceExisting: true });
    expect(state.value.splits.map(s => s.name)).toEqual(['Push', 'Pull', 'Legs']);
    const mon = state.value.splits.find(s => s.id === state.value.schedule.mon);
    expect(mon?.name).toBe('Push');
  });
  it('changes a setting, the schedule, a check-in and adds a gym', () => {
    run('propose_setting', { setting: { key: 'restDefaultSec', value: 150 } });
    expect(state.value.preferences.restDefaultSec).toBe(150);
    const id = state.value.splits[0]!.id;
    run('propose_schedule', { week: { sun: id, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null } });
    expect(state.value.schedule.sun).toBe(id);
    run('propose_checkin', { sleepQuality: 4, mood: 3 });
    expect(state.value.checkIns.at(-1)).toMatchObject({ sleepQuality: 4, mood: 3 });
    const undoGym = run('propose_gym', { name: 'Home', defaultUnit: 'lb' });
    expect(state.value.units.gyms.some(g => g.name === 'Home')).toBe(true);
    undoGym();
    expect(state.value.units.gyms.some(g => g.name === 'Home')).toBe(false);
  });
});

import { currentTurn, isPlanWork } from '@/escobar/ui/PlanBoard';
describe('plan whiteboard detection', () => {
  const msgs: StoredMessage[] = [
    { role: 'user', content: [{ type: 'text', text: 'old' }] },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'x', name: 'search_exercises', input: { pattern: 'hinge' } }], meta: { rendered: {} } },
    { role: 'user', content: [{ type: 'text', text: 'Create a 3-day full body split' }] },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'a', name: 'search_exercises', input: { pattern: 'squat' } }, { type: 'tool_use', id: 'b', name: 'search_exercises', input: { pattern: 'hinge' } }], meta: { rendered: {} } },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'a', content: JSON.stringify({ data: { exercises: [{ name: 'Back Squat' }] }, facts: {} }) }] },
  ];
  it('reads only the turn in progress', () => {
    const t = currentTurn(msgs);
    expect(t.uses.map(u => u.id)).toEqual(['a', 'b']);
    expect(t.results.get('a')?.data).toEqual({ exercises: [{ name: 'Back Squat' }] });
  });
  it('switches on for two searches or any plan tool, not for one lookup', () => {
    expect(isPlanWork(currentTurn(msgs).uses, [])).toBe(true);
    expect(isPlanWork([{ id: 'q', name: 'search_exercises', input: {} }], [])).toBe(false);
    expect(isPlanWork([], [{ id: 'e', name: 'evaluate_plan', label: '', done: false }])).toBe(true);
  });
});

describe('What Escobar knows: saved day (QA-R4b-8)', () => {
  it("is the phone's local day", async () => {
    const { savedDay } = await import('@/escobar/ui/MemoryScreen');
    const { dayKey } = await import('@/core/dates');
    const iso = '2026-09-22T22:30:00.000Z';
    expect(savedDay(iso)).toBe(dayKey(new Date(iso)));
  });
});

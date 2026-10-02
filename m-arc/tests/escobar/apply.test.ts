import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { replaceState, state } from '@/core/store';
import { addDays } from '@/core/dates';
import { decide, hasUndo, onProposal, undoOpen, UNDO_WINDOW_MS } from '@/escobar/apply';
import { buildAction, buildProposal } from '@/escobar/tools/actions';
import { memoryStorage, newConversation, setEscobarStorage } from '@/escobar/store';
import { activeConversation } from '@/escobar/session';
import { commitSet, setSet } from '@/slices/workout/session';
import { logWeight } from '@/slices/profile/profile';
import { GOALS } from '@/data/goals';
import { FULL2, PPL6 } from '../fixtures/plans';
import type { Conversation } from '@/escobar/types';
import { NOW, TODAY, ctxOf, twoWeeksState } from './fixtures';

const proposal = (name: string, input: Record<string, unknown>, id = 'p1'): Conversation => {
  const p = buildProposal(name, input, ctxOf(state.value), id);
  return { ...newConversation('test', 'chat'), proposals: [{ ...p, status: 'awaiting', messageIndex: 1 }] };
};
const otherGoal = () => GOALS.find(g => g.id !== state.value.goal)!.id;

beforeEach(() => { vi.useFakeTimers({ now: NOW, toFake: ['Date'] }); replaceState(twoWeeksState()); setEscobarStorage(memoryStorage()); });
afterEach(() => { vi.useRealTimers(); activeConversation.value = null; });

describe('undo inverses (ES-02)', () => {
  it('start session → a set logged → undo leaves the session alone', () => {
    const splitId = state.value.splits[0]!.id;
    const a = decide(proposal('propose_start_session', { splitId }), 'p1', 'apply');
    expect(a.result.status).toBe('applied');
    const started = state.value.active!;
    setSet(0, 0, { kg: 60, reps: 8 });
    commitSet(0, 0);
    const u = decide(a.conversation, 'p1', 'undo', a.result.undo);
    expect(u.result).toMatchObject({ ok: false, message: 'Undo is no longer available.' });
    expect(state.value.active?.id).toBe(started.id);
    expect(u.conversation).toBe(a.conversation);
  });

  it('QA-R4a-11: skip-today → the session starts → undo is no longer available', () => {
    const split = state.value.splits[0]!;
    const skip = split.exercises.at(-1)!.exerciseId;
    const t = decide(proposal('propose_today', { splitId: split.id, reason: 'sore', changes: [{ kind: 'remove', exerciseId: skip }] }, 'p1'), 'p1', 'apply');
    expect(t.result.status).toBe('applied');
    const s2 = decide({ ...t.conversation, proposals: [...(t.conversation.proposals ?? []), { ...buildProposal('propose_start_session', { splitId: split.id }, ctxOf(state.value), 'p2'), status: 'awaiting', messageIndex: 1 }] }, 'p2', 'apply');
    expect(s2.result.status).toBe('applied');
    expect(state.value.active!.entries.some(e => e.exerciseId === skip)).toBe(false);
    const u = decide(s2.conversation, 'p1', 'undo', t.result.undo);
    expect(u.result).toMatchObject({ ok: false, message: 'Undo is no longer available.' });
    expect(state.value.escobar.todayOverride).not.toBeNull();
  });

  it('start session → untouched → undo discards it', () => {
    const a = decide(proposal('propose_start_session', { splitId: state.value.splits[0]!.id }), 'p1', 'apply');
    expect(state.value.active).toBeTruthy();
    expect(decide(a.conversation, 'p1', 'undo', a.result.undo).result.status).toBe('undone');
    expect(state.value.active).toBeNull();
  });

  it('profile undo keeps a later weigh-in', () => {
    const a = decide(proposal('propose_profile', { field: 'bodyWeightKg', value: 82 }), 'p1', 'apply');
    expect(a.result.status).toBe('applied');
    vi.setSystemTime(NOW + 86_400_000);
    logWeight(81);
    decide(a.conversation, 'p1', 'undo', a.result.undo);
    const tomorrow = addDays(TODAY, 1);
    expect(state.value.weightLog.find(w => w.day === tomorrow)?.kg).toBe(81);
    expect(state.value.weightLog.some(w => w.day === TODAY && w.kg === 82)).toBe(false);
  });
});

describe('undo window (ES-03, ES-04)', () => {
  it('after 8 s Undo is no longer offered or honoured', async () => {
    const before = state.value.goal;
    activeConversation.value = proposal('propose_goal', { goal: otherGoal() });
    const c = activeConversation.value;
    expect((await onProposal('p1', 'apply')).status).toBe('applied');
    const p = () => activeConversation.value!.proposals!.find(x => x.id === 'p1')!;
    expect(undoOpen(c.id, p())).toBe(true);
    vi.setSystemTime(NOW + UNDO_WINDOW_MS + 1);
    expect(undoOpen(c.id, p())).toBe(false);
    const r = await onProposal('p1', 'undo');
    expect(r).toMatchObject({ ok: false, message: 'Undo is no longer available.' });
    expect(state.value.goal).not.toBe(before);
  });

  it('after a reload (no inverse held) undo is no longer available and records nothing', () => {
    const a = decide(proposal('propose_goal', { goal: otherGoal() }), 'p1', 'apply');
    const u = decide(a.conversation, 'p1', 'undo');
    expect(u.result.message).toBe('Undo is no longer available.');
    expect(u.conversation.pendingDecisions).toHaveLength(1);
  });

  it('p1 in two conversations keeps separate inverses', async () => {
    const before = state.value.goal;
    const one = proposal('propose_goal', { goal: otherGoal() });
    const two = { ...proposal('propose_goal', { goal: otherGoal() }), id: 'c_other' };
    activeConversation.value = one;
    await onProposal('p1', 'apply');
    const applied = activeConversation.value!;
    expect(hasUndo(one.id, 'p1')).toBe(true);
    expect(hasUndo(two.id, 'p1')).toBe(false);
    activeConversation.value = two;
    expect((await onProposal('p1', 'undo')).message).toBe('Undo is no longer available.');
    expect(state.value.goal).not.toBe(before);
    activeConversation.value = applied;
    expect((await onProposal('p1', 'undo')).status).toBe('undone');
    expect(state.value.goal).toBe(before);
  });
});

describe('programme during a session', () => {
  it('is refused while a session runs', () => {
    decide(proposal('propose_start_session', { splitId: state.value.splits[0]!.id }), 'p1', 'apply');
    expect(() => buildAction('propose_program', { draft: PPL6, replaceExisting: true }, ctxOf(state.value))).toThrow(/session is running/);
  });
});

describe('split delete undo mid-workout (QA-R2b-2, QA-R2b-4)', () => {
  it('undo keeps sets logged since, and the split being trained cannot be deleted', () => {
    const [trained, other] = state.value.splits;
    decide(proposal('propose_start_session', { splitId: trained!.id }), 'p1', 'apply');
    const del = decide(proposal('propose_split', { action: 'delete', splitId: other!.id, name: other!.name, exercises: [] }, 'p2'), 'p2', 'apply');
    expect(del.result.status).toBe('applied');
    for (let j = 0; j < 2; j++) { setSet(0, j, { kg: 60, reps: 8 }); commitSet(0, j); }
    const before = JSON.stringify(state.value.active);
    decide(del.conversation, 'p2', 'undo', del.result.undo);
    expect(state.value.splits.some(s => s.id === other!.id)).toBe(true);
    expect(JSON.stringify(state.value.active)).toBe(before);
    expect(() => buildAction('propose_split', { action: 'delete', splitId: trained!.id, name: trained!.name, exercises: [] }, ctxOf(state.value))).toThrow(/trained right now/);
  });
});

describe('undo after a workout started on what was applied (QA-R4b-6)', () => {
  it('a created split being trained stays', () => {
    const ex = state.value.splits[0]!.exercises.slice(0, 2);
    const a = decide(proposal('propose_split', { action: 'create', name: 'Arms day', exercises: ex, focus: [] }), 'p1', 'apply');
    expect(a.result.status).toBe('applied');
    const sp = state.value.splits.find(x => x.name === 'Arms day')!;
    const s2 = decide({ ...a.conversation, proposals: [...(a.conversation.proposals ?? []), { ...buildProposal('propose_start_session', { splitId: sp.id }, ctxOf(state.value), 'p2'), status: 'awaiting', messageIndex: 1 }] }, 'p2', 'apply');
    expect(s2.result.status).toBe('applied');
    const u = decide(s2.conversation, 'p1', 'undo', a.result.undo);
    expect(u.result).toMatchObject({ ok: false, message: 'Undo is no longer available.' });
    expect(state.value.splits.some(x => x.id === sp.id)).toBe(true);
  });
  it('a programme whose split is being trained stays', () => {
    const a = decide(proposal('propose_program', { draft: FULL2, replaceExisting: true }), 'p1', 'apply');
    expect(a.result.status).toBe('applied');
    const sp = state.value.splits.find(x => x.name === 'Full body')!;
    const s2 = decide({ ...a.conversation, proposals: [...(a.conversation.proposals ?? []), { ...buildProposal('propose_start_session', { splitId: sp.id }, ctxOf(state.value), 'p2'), status: 'awaiting', messageIndex: 1 }] }, 'p2', 'apply');
    expect(s2.result.status).toBe('applied');
    const u = decide(s2.conversation, 'p1', 'undo', a.result.undo);
    expect(u.result).toMatchObject({ ok: false, message: 'Undo is no longer available.' });
    expect(state.value.splits.some(x => x.id === sp.id)).toBe(true);
  });
});

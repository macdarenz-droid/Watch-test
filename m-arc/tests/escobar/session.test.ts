import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { loadStore, memoryStorage, setEscobarStorage } from '@/escobar/store';
import { activeConversation, resetConversations, send, setTransport, startNewConversation, stop } from '@/escobar/session';
import { escobarUi } from '@/escobar/state';
import { update as updateApp } from '@/core/store';
import type { StreamEvent, Transport } from '@/escobar/transport';

const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, { t: 'final', content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 }, model: 'm' }];

/** A transport whose turns wait for `release()` (or their abort signal) before answering. */
function gated() {
  let calls = 0;
  const waiting: Array<() => void> = [];
  const aborted: boolean[] = [];
  const t: Transport = {
    async *turn(_body, signal) {
      const n = calls++;
      aborted[n] = false;
      await new Promise<void>(resolve => { waiting.push(resolve); signal.addEventListener('abort', () => { aborted[n] = true; resolve(); }, { once: true }); });
      if (signal.aborted) return;
      for (const e of answer(`answer ${n}`)) yield e;
    },
  };
  return { t, calls: () => calls, aborted, release: () => { for (const r of waiting.splice(0)) r(); } };
}
const tick = () => new Promise(r => setTimeout(r, 0));

// AUD-2: a turn only reaches the transport while the online coach is on.
beforeEach(() => { updateApp(s => ({ ...s, escobar: { ...s.escobar, enabled: true } })); setEscobarStorage(memoryStorage()); resetConversations(); escobarUi.value = { ...escobarUi.value, mode: 'chat', draft: '' }; });
afterEach(() => { vi.useRealTimers(); setTransport(null); });

describe('Escobar session ownership (ES-05, ES-06, ES-07)', () => {
  it('a new conversation started mid-turn stays active', async () => {
    const g = gated();
    setTransport(g.t);
    const first = send({ text: 'first question' });
    await tick();
    startNewConversation();
    const fresh = activeConversation.value!.id;
    g.release();
    await first;
    expect(activeConversation.value?.id).toBe(fresh);
    expect(loadStore().activeId).toBe(fresh);
  });

  it('a reset mid-turn leaves nothing stored', async () => {
    const g = gated();
    setTransport(g.t);
    const first = send({ text: 'first question' });
    await tick();
    resetConversations();
    g.release();
    await first;
    expect(loadStore().conversations).toHaveLength(0);
  });
});

describe('Escobar session flow (ES-09, ES-10)', () => {
  it('after a network error, a send 61 s later reaches the transport again', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    let calls = 0;
    setTransport({ async *turn() { calls++; if (calls === 1) { yield { t: 'error', code: 'network', message: 'offline' } as StreamEvent; return; } for (const e of answer('back')) yield e; } });
    expect((await send({ text: 'one' })).error?.code).toBe('network');
    const soon = await send({ text: 'two' });
    expect(soon.outcome).toBe('offline');
    expect(calls).toBe(1);
    vi.setSystemTime(Date.now() + 61_000);
    expect((await send({ text: 'three' })).outcome).toBe('done');
    expect(calls).toBe(2);
  });

  it('two sends, then Stop, aborts the second', async () => {
    const g = gated();
    setTransport(g.t);
    const one = send({ text: 'one' });
    await tick();
    g.release();
    expect((await one).outcome).toBe('done');
    const two = send({ text: 'two' });
    await tick();
    stop();
    expect((await two).outcome).toBe('aborted');
    expect(g.aborted).toEqual([false, true]);
  });

  it('a send while answering is refused and the text stays in the composer', async () => {
    const g = gated();
    setTransport(g.t);
    const one = send({ text: 'one' });
    await tick();
    const busy = await send({ text: 'second thought' });
    expect(busy.error).toMatchObject({ code: 'invalid', message: 'Escobar is still answering.' });
    expect(escobarUi.value.draft).toBe('second thought');
    expect(g.calls()).toBe(1);
    g.release();
    expect((await one).outcome).toBe('done');
  });
});

import { loopView } from '@/escobar/state';
import { pendingUser, selectConversation } from '@/escobar/session';
describe('switching mid-answer clears the turn (QA-R4a-1, QA-R4a-3, QA-R4a-8)', () => {
  it('picking a past conversation or resetting mid-answer leaves Escobar idle, and a new send works', async () => {
    setTransport({ async *turn() { for (const e of answer('Old.')) yield e; } });
    await send({ text: 'an older question' });
    const older = activeConversation.value!.id;
    startNewConversation();
    for (const action of [() => selectConversation(older), () => resetConversations()]) {
      const g = gated();
      setTransport(g.t);
      const pending = send({ text: 'mid-answer' });
      await tick();
      expect(loopView.value.status).not.toBe('idle');
      action();
      expect(loopView.value.status).toBe('idle');
      expect(pendingUser.value).toBeNull();
      g.release();
      await pending;
      expect(loopView.value.status).toBe('idle');
      setTransport({ async *turn() { for (const e of answer('Fine.')) yield e; } });
      expect((await send({ text: 'after' })).outcome).toBe('done');
    }
  });
  it('a new conversation mid-turn does not show the old question', async () => {
    const g = gated();
    setTransport(g.t);
    const pending = send({ text: 'first question' });
    await tick();
    startNewConversation();
    expect(pendingUser.value).toBeNull();
    g.release();
    await pending;
    expect(pendingUser.value).toBeNull();
  });
});

describe('plan mode sticks for follow-ups (QA-R4a-2)', () => {
  it('after a programme request, the next message is still in plan mode and the conversation stays plan', async () => {
    const modes: string[] = [];
    setTransport({ async *turn(body) { modes.push((body as { mode: string }).mode); for (const e of answer('Ok.')) yield e; } });
    await send({ text: 'hi there' });
    await send({ text: 'Build me a 4-day programme' });
    await send({ text: 'Looks good, swap bench for dips' });
    expect(modes).toEqual(['chat', 'plan', 'plan']);
    expect(loadStore().conversations.find(c => c.id === loadStore().activeId)?.mode).toBe('plan');
  });
});

import { replaceState, state as appState } from '@/core/store';
import { freshState } from '@/core/models';
import { prepare, setEscobarEnabled } from '@/escobar/session';
describe('old coach chat carry-over (QA-R4b-1)', () => {
  const withThread = (enabled: boolean, legacyImported = false) => {
    const s = freshState();
    replaceState({ ...s, escobar: { ...s.escobar, enabled, legacyImported }, coach: { askThread: [{ role: 'user', text: 'old question' }, { role: 'assistant', text: 'old answer' }] } } as never);
  };
  const earlier = () => loadStore().conversations.filter(c => c.title === 'Earlier conversation');
  it('imports once for someone who already had Escobar on, and never twice', () => {
    withThread(true);
    prepare();
    expect(earlier()).toHaveLength(1);
    expect(appState.value.escobar.legacyImported).toBe(true);
    prepare();
    setEscobarEnabled(true);
    expect(earlier()).toHaveLength(1);
  });
  it('does nothing once imported', () => {
    withThread(true, true);
    prepare();
    expect(earlier()).toHaveLength(0);
  });
});

describe('the old coach chat import (QA-R4b-6, RG-03)', () => {
  it('runs once on enable, marks it done, and a second enable adds nothing', async () => {
    const { replaceState, state } = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    const { setEscobarEnabled } = await import('@/escobar/session');
    setEscobarStorage(memoryStorage());
    const base = freshState();
    replaceState({ ...base, escobar: { ...base.escobar, enabled: false, legacyImported: false }, coach: { askThread: [{ role: 'user', text: 'old question' }, { role: 'assistant', text: 'old answer' }] } } as never);
    setEscobarEnabled(true);
    expect(state.value.escobar.legacyImported).toBe(true);
    const earlier = () => loadStore().conversations.filter(c => c.title === 'Earlier conversation');
    expect(earlier()).toHaveLength(1);
    setEscobarEnabled(false);
    setEscobarEnabled(true);
    expect(earlier()).toHaveLength(1);
  });
});

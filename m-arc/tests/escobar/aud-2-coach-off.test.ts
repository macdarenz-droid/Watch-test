/**
 * AUD-2 (audit SEC-03): switching the online coach off stops the running turn. No new request
 * starts once `escobar.enabled` is false: not the next tool round trip, not the retry after a
 * back-off, and not while the sheet is hidden.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { EscobarLoop, type LoopDeps } from '@/escobar/loop';
import type { StreamEvent, Transport } from '@/escobar/transport';
import { memoryStorage, newConversation, setEscobarStorage } from '@/escobar/store';
import { buildManifest } from '@/escobar/context/manifest';
import { lastTurn, resetConversations, send, setEscobarEnabled, setTransport } from '@/escobar/session';
import { escobarUi, loopView } from '@/escobar/state';
import { state as appState, update } from '@/core/store';
import { toast } from '@/app/toast';
import type { AppState } from '@/core/models';
import { sixMonthsState, NOW } from './fixtures';

const final = (content: unknown[], stop_reason = 'end_turn'): StreamEvent => ({ t: 'final', content, stop_reason, usage: { input_tokens: 10, output_tokens: 5 }, model: 'm' });
const overviewCall: StreamEvent[] = [{ t: 'tool', id: 't1', name: 'get_overview' }, final([{ type: 'tool_use', id: 't1', name: 'get_overview', input: {} }], 'tool_use')];
const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, final([{ type: 'text', text }])];
const tick = () => new Promise(r => setTimeout(r, 0));

/** The real loop over a scripted transport that records `enabled` at every request. */
function loopWith(steps: StreamEvent[][], extra: Partial<LoopDeps> = {}) {
  let s: AppState = sixMonthsState();
  const enabledAtCall: boolean[] = [];
  const transport: Transport = {
    async *turn(_body, signal) {
      enabledAtCall.push(s.escobar.enabled);
      for (const e of steps[enabledAtCall.length - 1] ?? answer('extra')) { if (signal.aborted) return; await Promise.resolve(); yield e; }
    },
  };
  const off = () => { s = { ...s, escobar: { ...s.escobar, enabled: false } }; };
  const deps: LoopDeps = { transport, getState: () => s, now: () => NOW, appVersion: '37.0.0', manifest: () => buildManifest('37.0.0'), sleep: async () => {}, ...extra };
  const loop = new EscobarLoop({ ...newConversation('37.0.0', 'chat', new Date(NOW)), id: 'c1' }, deps);
  return { loop, enabledAtCall, off, deps };
}

describe('the loop checks the switch before every request (AUD-2)', () => {
  it('audit repro: off before the tool result is handled, so no second request', async () => {
    let offNow = () => {};
    const t = loopWith([overviewCall, answer('Done.')], { onUpdate: v => { if (v.status === 'tools') offNow(); } });
    offNow = t.off;
    const r = await t.loop.send({ text: 'how am I doing' });
    expect(t.enabledAtCall).toEqual([true]);
    expect(r.outcome).toBe('aborted');
    // The local tool ran and its result closes the tool call, so the stored history stays valid.
    const last = t.loop.conversation.messages.at(-1)!;
    expect(last.role).toBe('user');
    expect(JSON.stringify(last.content)).toContain('"tool_use_id":"t1"');
  });

  it('off during the retry back-off: the retry is not sent', async () => {
    let offNow = () => {};
    const t = loopWith([[{ t: 'error', code: 'upstream_busy', message: 'busy' }], answer('Done.')], { sleep: async () => { offNow(); } });
    offNow = t.off;
    const r = await t.loop.send({ text: 'hello' });
    expect(t.enabledAtCall).toEqual([true]);
    expect(r.outcome).toBe('aborted');
    expect(r.notSent).toBe(true);
  });

  it('a turn started while off sends nothing', async () => {
    const t = loopWith([answer('Done.')]);
    t.off();
    const r = await t.loop.send({ text: 'hello' });
    expect(t.enabledAtCall).toEqual([]);
    expect(r.outcome).toBe('aborted');
  });
});

/** A transport whose turns wait for `release()` (or their abort signal); records `enabled` at each call. */
function gated(steps: StreamEvent[][]) {
  const enabledAtCall: boolean[] = [];
  const aborted: boolean[] = [];
  const waiting: Array<() => void> = [];
  const t: Transport = {
    async *turn(_body, signal) {
      const n = enabledAtCall.length;
      enabledAtCall.push(appState.value.escobar.enabled);
      aborted[n] = false;
      yield { t: 'text', d: 'Lo' } as StreamEvent;
      await new Promise<void>(resolve => { waiting.push(resolve); signal.addEventListener('abort', () => { aborted[n] = true; resolve(); }, { once: true }); });
      if (signal.aborted) return;
      for (const e of steps[n] ?? answer('extra')) yield e;
    },
  };
  return { t, enabledAtCall, aborted, release: () => { for (const r of waiting.splice(0)) r(); } };
}

const turnOffInSettings = () => update(s => ({ ...s, escobar: { ...s.escobar, enabled: false } }));

describe('switching the coach off stops the running turn (AUD-2)', () => {
  beforeEach(() => {
    update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    setEscobarStorage(memoryStorage());
    resetConversations();
    escobarUi.value = { ...escobarUi.value, open: true, mode: 'chat', draft: '' };
    toast.value = null;
  });
  afterEach(() => { setTransport(null); });

  it('off mid-stream aborts the request and the turn ends as "Stopped", with no toast', async () => {
    const g = gated([answer('Lots to say.')]);
    setTransport(g.t);
    const turn = send({ text: 'hello' });
    await tick();
    expect(loopView.value.status).toBe('streaming');
    turnOffInSettings();
    const r = await turn;
    expect(g.aborted[0]).toBe(true);
    expect(g.enabledAtCall).toEqual([true]);
    expect(r.outcome).toBe('aborted');
    expect(lastTurn.value?.outcome).toBe('aborted');
    expect(loopView.value.status).toBe('idle');
    expect(toast.value).toBeNull();
  });

  it('off during a tool round trip with the sheet hidden: no second request', async () => {
    const g = gated([overviewCall, answer('Done.')]);
    setTransport(g.t);
    const turn = send({ text: 'how am I doing' });
    await tick();
    escobarUi.value = { ...escobarUi.value, open: false };
    g.release();
    // The first step's tool call has arrived; the second request is waiting on the gate.
    for (let i = 0; i < 20 && g.enabledAtCall.length < 2; i++) await tick();
    expect(g.enabledAtCall).toEqual([true, true]);
    turnOffInSettings();
    const r = await turn;
    expect(g.aborted[1]).toBe(true);
    expect(r.outcome).toBe('aborted');
    expect(g.enabledAtCall).toHaveLength(2);
    expect(toast.value).toBeNull();
  });

  it('setEscobarEnabled(false) takes the same path', async () => {
    const g = gated([answer('Lots to say.')]);
    setTransport(g.t);
    const turn = send({ text: 'hello' });
    await tick();
    setEscobarEnabled(false);
    const r = await turn;
    expect(g.aborted[0]).toBe(true);
    expect(r.outcome).toBe('aborted');
    expect(lastTurn.value?.outcome).toBe('aborted');
  });

  it('a send while off never reaches the transport', async () => {
    const g = gated([answer('Hi.')]);
    setTransport(g.t);
    turnOffInSettings();
    const r = await send({ text: 'hello' });
    expect(g.enabledAtCall).toEqual([]);
    expect(r.outcome).toBe('aborted');
  });
});

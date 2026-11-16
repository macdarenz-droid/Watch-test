import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { QuotaCounter, RESERVATION_TTL_MS, type Limits } from '../src/quotaDO';
import { handle, CUT_SHORT_TOKENS_PER_SEC } from '../src/handler';
import { admitQuota, recordStep, resetInSec, ENFORCEMENT_RETRY_SEC } from '../src/quota';
import { UpstreamRelay } from '../src/upstreamRelay';
import type { ClientLike, Env } from '../src/anthropic';
import { baseEnv, deps, eventsFor, finalMessage, mockClient, post, sse, turn, DEVICE } from './helpers';

/** In-memory Durable Object storage: `kv` is synchronous like SyncKvStorage; the alarm calls yield. */
function fakeState(alarmDelayMs = 0) {
  const data = new Map<string, unknown>();
  let alarm: number | null = null;
  const tick = () => new Promise(r => setTimeout(r, alarmDelayMs));
  return {
    data,
    get alarm() { return alarm; },
    storage: {
      kv: {
        get: (k: string) => (data.has(k) ? structuredClone(data.get(k)) : undefined),
        put: (k: string, v: unknown) => { data.set(k, structuredClone(v)); },
        delete: (k: string) => data.delete(k),
        list: (o: { prefix?: string } = {}) => [...data.entries()].filter(([k]) => k.startsWith(o.prefix ?? '')),
      },
      getAlarm: async () => { await tick(); return alarm; },
      setAlarm: async (t: number) => { await tick(); alarm = t; },
      deleteAll: async () => { data.clear(); alarm = null; },
    },
  };
}

/** A QUOTA_DO namespace whose stubs are the objects themselves, one per name (one per UTC day). */
function fakeNamespace() {
  const objects = new Map<string, { counter: QuotaCounter; state: ReturnType<typeof fakeState> }>();
  const ns = {
    objects,
    idFromName: (name: string) => name,
    get: (id: string) => {
      if (!objects.has(id)) { const state = fakeState(); objects.set(id, { counter: new QuotaCounter(state as never, {} as never), state }); }
      return objects.get(id)!.counter;
    },
  };
  return ns;
}

const LIM: Limits = { device: { turns: 80, steps: 400, out: 400_000 }, ip: { turns: 300, steps: 1500 }, global: { steps: 20_000, out: 3_000_000 } };
const KEYS = { device: DEVICE, ip: '203.0.113.7' };
const TEXT = [{ type: 'text', text: 'ok' }];

beforeEach(() => { vi.spyOn(console, 'log').mockImplementation(() => {}); });

describe('QuotaCounter Durable Object (PL-01, PL-07)', () => {
  it('five concurrent adds sum exactly', async () => {
    const state = fakeState(5);
    const c = new QuotaCounter(state as never, {} as never);
    await Promise.all(Array.from({ length: 5 }, () => c.add(KEYS, { steps: 1, out: 40, turns: 1 })));
    expect(state.data.get(`d:${DEVICE}`)).toEqual({ turns: 5, steps: 5, out: 200 });
    expect(state.data.get('i:203.0.113.7')).toEqual({ turns: 5, steps: 5 });
    expect(state.data.get('g')).toEqual({ steps: 5, out: 200 });
  });
  it('sets one cleanup alarm three days out and clears everything when it fires', async () => {
    const state = fakeState();
    const c = new QuotaCounter(state as never, {} as never);
    const before = Date.now();
    await c.add(KEYS, { steps: 1, out: 1, turns: 1 });
    expect(state.alarm).toBeGreaterThanOrEqual(before + 3 * 86_400_000);
    await c.alarm();
    expect(state.data.size).toBe(0);
  });
  it('reports which scope is over its cap', async () => {
    const c = new QuotaCounter(fakeState() as never, {} as never);
    expect(await c.admit(KEYS, LIM, 'a', 10, 0)).toEqual({ ok: true });
    await c.reconcile('a', { steps: 1, out: 10, turns: 1 });
    expect(await c.admit(KEYS, { ...LIM, device: { ...LIM.device, turns: 1 } }, 'b', 10, 0)).toEqual({ ok: false, scope: 'device' });
    expect(await c.admit({ device: 'dev_other000000000000000000', ip: KEYS.ip }, { ...LIM, ip: { turns: 1, steps: 1500 } }, 'c', 10, 0)).toEqual({ ok: false, scope: 'ip' });
    expect(await c.admit({ device: 'dev_other000000000000000000', ip: '198.51.100.1' }, { ...LIM, global: { steps: 1_000, out: 10 } }, 'd', 10, 0)).toEqual({ ok: false, scope: 'global' });
  });
});

describe('quota backends', () => {
  it('the Durable Object comes first and maps scopes to the existing messages', async () => {
    const ns = fakeNamespace();
    const env = baseEnv({ QUOTA_DO: ns as never, MAX_TURNS_PER_IP: '1', MAX_OUTPUT_TOTAL: '50' });
    const now = Date.parse('2026-09-22T12:00:00Z');
    await recordStep(env, KEYS, now, { turnEnded: true, outputTokens: 40, turnSteps: 1 });
    expect(ns.objects.has('2026-09-22')).toBe(true);
    const ip = await admitQuota(env, { device: 'dev_aaaaaaaaaaaaaaaaaaaaaaaa', ip: KEYS.ip }, now, 100);
    expect(ip).toMatchObject({ ok: false, message: expect.stringMatching(/coaching limit/) });
    await recordStep(env, { device: 'dev_bbbbbbbbbbbbbbbbbbbbbbbb', ip: '198.51.100.1' }, now, { turnEnded: false, outputTokens: 20, turnSteps: 1 });
    const g = await admitQuota(env, { device: 'dev_cccccccccccccccccccccccc', ip: '198.51.100.2' }, now, 100);
    expect(g).toMatchObject({ ok: false, message: 'Escobar is resting for today. Your notes still update.' });
    expect(await admitQuota(env, KEYS, Date.parse('2026-09-23T00:00:01Z'), 100)).toMatchObject({ ok: true });
  });
  it('without any binding every check passes', async () => {
    expect(await admitQuota(baseEnv(), KEYS, 0, 100)).toEqual({ ok: true });
  });
});

describe('handler with QUOTA_DO', () => {
  const env = (extra: Partial<Env> = {}) => { const ns = fakeNamespace(); return { ns, env: baseEnv({ QUOTA_DO: ns as never, ...extra }) }; };
  const counters = (ns: ReturnType<typeof fakeNamespace>) => ns.objects.get('2026-09-22')!.state.data;

  it('health reports quotas:true when the Durable Object is bound', async () => {
    const r = await handle(new Request('https://x/health'), env().env, deps(mockClient([])));
    expect(((await r.json()) as { quotas: boolean }).quotas).toBe(true);
  });
  it('a tool_use step is recorded as steps 1 / turns 0, and a turn end adds exactly one more step', async () => {
    const { ns, env: e } = env();
    const toolStep = [{ type: 'tool_use', id: 't', name: 'get_overview', input: {} }];
    await sse(await handle(post(turn()), e, deps(mockClient([{ events: eventsFor(toolStep), final: finalMessage(toolStep, 'tool_use') }]))));
    expect(counters(ns).get(`d:${DEVICE}`)).toEqual({ turns: 0, steps: 1, out: 40 });
    const next = turn({ messages: [{ role: 'user', content: 'go' }, { role: 'assistant', content: toolStep }, { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't', content: '{}' }] }] });
    await sse(await handle(post(next), e, deps(mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]))));
    expect(counters(ns).get(`d:${DEVICE}`)).toEqual({ turns: 1, steps: 2, out: 80 });
    expect(counters(ns).get('i:unknown')).toEqual({ turns: 1, steps: 2 });
  });
  it('rotating device ids from one IP hit 429 from RATE_IP', async () => {
    const seen = new Map<string, number>();
    const RATE_IP = { limit: async ({ key }: { key: string }) => { const n = (seen.get(key) ?? 0) + 1; seen.set(key, n); return { success: n <= 5 }; } };
    const { env: e } = env({ RATE: { limit: async () => ({ success: true }) }, RATE_IP });
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) {
      const device = `dev_${i.toString(16).padStart(24, '0')}`;
      const r = await handle(post(turn(), { 'x-escobar-device': device, 'cf-connecting-ip': '203.0.113.7' }), e, deps(mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }])));
      statuses.push(r.status);
      if (r.status === 200) await sse(r); else expect(((await r.json()) as { code: string }).code).toBe('rate');
    }
    expect(statuses).toEqual([200, 200, 200, 200, 200, 429, 429, 429, 429, 429]);
    expect([...seen.keys()]).toEqual(['203.0.113.7']);
  });
  it('the per-IP daily turn cap refuses new device ids from that IP', async () => {
    const { env: e } = env({ MAX_TURNS_PER_IP: '2' });
    const send = (i: number) => handle(post(turn(), { 'x-escobar-device': `dev_${i.toString(16).padStart(24, '0')}`, 'cf-connecting-ip': '203.0.113.9' }), e, deps(mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }])));
    await sse(await send(1));
    await sse(await send(2));
    const r = await send(3);
    expect(r.status).toBe(429);
    expect(((await r.json()) as { code: string }).code).toBe('quota');
  });
  it('logs one structured line per step with no device id and no content', async () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    await sse(await handle(post(turn()), env().env, deps(mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]))));
    expect(log).toHaveBeenCalledTimes(1);
    const line = String(log.mock.calls[0]![0]);
    expect(JSON.parse(line)).toEqual({ requestId: 'req_1', colo: null, mode: 'chat', model: 'claude-opus-5', stop_reason: 'end_turn', in: 100, out: 40, cacheRead: 80, cacheWrite: 0, steps: 1, ms: 0 });
    expect(line).not.toContain(DEVICE);
    expect(line).not.toContain('readiness');
  });
});

describe('billed steps are counted however they end (QA-R0-1, QA-R0-2, QA-R0-3)', () => {
  const setup = (extra: Partial<Env> = {}) => { const ns = fakeNamespace(); return { ns, env: baseEnv({ QUOTA_DO: ns as never, ...extra }) }; };
  const rows = (ns: ReturnType<typeof fakeNamespace>) => ns.objects.get('2026-09-22')?.state.data ?? new Map();
  /** Runs a turn to the end of its background work, reading only the first chunk when `hangUp`. */
  async function run(env: Env, script: Parameters<typeof mockClient>[0][number], hangUp = false, headers: Record<string, string> = {}) {
    const pending: Promise<unknown>[] = [];
    const r = await handle(post(turn(), headers), env, deps(mockClient([script]), { waitUntil: p => { pending.push(p); } }));
    if (r.status !== 200) return r.status;
    if (hangUp) { const reader = r.body!.getReader(); await reader.read(); await reader.read(); await reader.cancel(); } else await sse(r);
    await Promise.all(pending);
    return r.status;
  }
  const LONG = [{ type: 'text', text: 'x'.repeat(300) }];

  it('a caller who hangs up mid-answer is counted, so the daily cap still trips', async () => {
    const { ns, env } = setup({ MAX_TURNS_PER_DEVICE: '2' });
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push(await run(env, { events: eventsFor(LONG), final: finalMessage(LONG), hang: true }, true));
    expect(statuses).toEqual([200, 200, 429, 429]);
    const d = rows(ns).get(`d:${DEVICE}`) as { turns: number; steps: number; out: number };
    expect(d.turns).toBe(2);
    expect(d.steps).toBe(2);
    expect(d.out).toBeGreaterThan(0);
  });
  it('a refusal and a mid-stream error are counted too', async () => {
    const { ns, env } = setup();
    const refused = finalMessage([], 'refusal', { usage: { input_tokens: 10, output_tokens: 12 } });
    await run(env, { events: eventsFor(TEXT), final: refused });
    expect(rows(ns).get(`d:${DEVICE}`)).toEqual({ turns: 1, steps: 1, out: 12 });
    await run(env, { events: eventsFor(LONG), throwAt: 4, error: new Error('overloaded mid-stream') });
    expect((rows(ns).get(`d:${DEVICE}`) as { steps: number }).steps).toBe(2);
  });
  it('an error before any output is not counted (nothing was billed)', async () => {
    const { ns, env } = setup();
    await run(env, { events: eventsFor(TEXT), throwAt: 0, error: new Error('refused at the door') });
    expect(rows(ns).get(`d:${DEVICE}`)).toBeUndefined();
  });
  it('the per-IP cap counts steps, so endless tool-call turns from rotating devices stop', async () => {
    const { env } = setup({ MAX_STEPS_PER_IP: '2' });
    const toolStep = [{ type: 'tool_use', id: 't', name: 'get_overview', input: {} }];
    const statuses: number[] = [];
    for (let i = 0; i < 4; i++) statuses.push(await run(env, { events: eventsFor(toolStep), final: finalMessage(toolStep, 'tool_use') }, false, { 'x-escobar-device': `dev_${String(i).padStart(24, '0')}`, 'cf-connecting-ip': '203.0.113.9' }));
    expect(statuses).toEqual([200, 200, 429, 429]);
  });
});

describe('thinking the caller never sees is counted when a step is cut short (QA2-FA-1..4)', () => {
  const originalRelayClient = UpstreamRelay.makeClient;
  afterEach(() => { UpstreamRelay.makeClient = originalRelayClient; });
  const setup = (extra: Partial<Env> = {}) => { const ns = fakeNamespace(); return { ns, env: baseEnv({ QUOTA_DO: ns as never, ...extra }) }; };
  const row = (ns: ReturnType<typeof fakeNamespace>) => ns.objects.get('2026-09-22')?.state.data.get(`d:${DEVICE}`);
  const clock = () => ({ t: Date.parse('2026-09-22T12:00:00Z') });
  const untilAbort = (signal?: AbortSignal) => new Promise((_, rej) => {
    if (signal?.aborted) rej(new Anthropic.APIUserAbortError());
    signal?.addEventListener('abort', () => rej(new Anthropic.APIUserAbortError()));
  });
  /**
   * One step as the API streams it by default (thinking display "omitted"): the thinking block carries no
   * text, `thinkMs` passes on the clock while the model thinks, then a short answer (or `fail`, or it keeps
   * thinking until the caller goes away when `stopIn` is 'thinking').
   */
  function thinkingClient(c: { t: number }, o: { thinkMs: number; fail?: unknown; stopIn?: 'thinking' }): ClientLike {
    return { beta: { messages: { stream(_p, opts) {
      return {
        async *[Symbol.asyncIterator]() {
          yield { type: 'message_start', message: finalMessage([]) } as never;
          yield { type: 'content_block_start', index: 0, content_block: { type: 'thinking', thinking: '', signature: '' } } as never;
          yield { type: 'content_block_delta', index: 0, delta: { type: 'thinking_delta', thinking: '' } } as never;
          c.t += o.thinkMs;
          if (o.fail) throw o.fail;
          if (o.stopIn === 'thinking') await untilAbort(opts?.signal);
          yield { type: 'content_block_delta', index: 0, delta: { type: 'signature_delta', signature: 'sig' } } as never;
          yield { type: 'content_block_stop', index: 0 } as never;
          yield { type: 'content_block_start', index: 1, content_block: { type: 'text', text: '' } } as never;
          yield { type: 'content_block_delta', index: 1, delta: { type: 'text_delta', text: 'Here is your plan.' } } as never;
          await untilAbort(opts?.signal);
        },
        finalMessage: () => new Promise(() => {}),
        abort() {},
      };
    } } } };
  }
  /** A UPSTREAM namespace backed by one real UpstreamRelay running `client`. */
  function relayNs(client: ClientLike) {
    UpstreamRelay.makeClient = () => client;
    const relay = new UpstreamRelay({ waitUntil: () => {} } as never, {} as never);
    return { idFromName: (n: string) => n, get: () => ({ fetch: (url: string, init: RequestInit) => relay.fetch(new Request(url, init)) }) };
  }
  /** Sends one turn and hangs up as soon as `marker` has arrived; resolves once the step is recorded. */
  async function hangUpAfter(env: Env, client: ClientLike, c: { t: number }, mode: string, marker: string) {
    const pending: Promise<unknown>[] = [];
    const r = await handle(post(turn({ mode })), env, { ...deps(client), now: () => c.t, waitUntil: p => { pending.push(p); } });
    if (r.status !== 200) return r.status;
    const reader = r.body!.getReader();
    const dec = new TextDecoder();
    let seen = '';
    while (!seen.includes(marker)) { const { value, done } = await reader.read(); if (done) break; seen += dec.decode(value, { stream: true }); }
    await reader.cancel();
    await Promise.all(pending);
    return r.status;
  }

  it('a hang-up right after the answer starts counts the minute of hidden thinking, so the output cap trips', async () => {
    const c = clock();
    const { ns, env } = setup({ MAX_OUTPUT_PER_DEVICE: '1000' });
    const client = thinkingClient(c, { thinkMs: 60_000 });
    expect(await hangUpAfter(env, client, c, 'plan', '"t":"text"')).toBe(200);
    expect(row(ns)).toEqual({ turns: 1, steps: 1, out: 60 * CUT_SHORT_TOKENS_PER_SEC });
    expect(await hangUpAfter(env, client, c, 'plan', '"t":"text"')).toBe(429);
  });
  it('the same through the US relay', async () => {
    const c = clock();
    const client = thinkingClient(c, { thinkMs: 60_000 });
    const { ns, env } = setup({ MAX_OUTPUT_PER_DEVICE: '1000', UPSTREAM: relayNs(client) as never });
    expect(await hangUpAfter(env, mockClient([]), c, 'plan', '"t":"text"')).toBe(200);
    expect(row(ns)).toEqual({ turns: 1, steps: 1, out: 60 * CUT_SHORT_TOKENS_PER_SEC });
    expect(await hangUpAfter(env, mockClient([]), c, 'plan', '"t":"text"')).toBe(429);
  });
  it('a hang-up while the model is still thinking is counted by how long it thought', async () => {
    const c = clock();
    const { ns, env } = setup();
    expect(await hangUpAfter(env, thinkingClient(c, { thinkMs: 45_000, stopIn: 'thinking' }), c, 'chat', '"t":"thinking"')).toBe(200);
    expect(row(ns)).toEqual({ turns: 1, steps: 1, out: 45 * CUT_SHORT_TOKENS_PER_SEC });
  });
  it("the estimate never passes the step's max_tokens", async () => {
    const c = clock();
    const { ns, env } = setup();
    expect(await hangUpAfter(env, thinkingClient(c, { thinkMs: 600_000 }), c, 'live', '"t":"text"')).toBe(200);
    expect(row(ns)).toEqual({ turns: 1, steps: 1, out: 4000 });
  });
  it('an API error after a thinking-only phase is counted too (QA2-FA-3)', async () => {
    const c = clock();
    const { ns, env } = setup();
    const boom = new Anthropic.InternalServerError(500, { type: 'error', error: { type: 'api_error', message: 'boom' } }, 'boom', new Headers());
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const ev = await sse(await handle(post(turn()), env, { ...deps(thinkingClient(c, { thinkMs: 30_000, fail: boom })), now: () => c.t }));
    expect(ev.map(e => e.t)).toEqual(['start', 'thinking', 'error']);
    expect(row(ns)).toEqual({ turns: 1, steps: 1, out: 30 * CUT_SHORT_TOKENS_PER_SEC });
  });
});

describe('a stall or cancel before any output is not a used turn (QA2-FA-6)', () => {
  it('two stalled requests do not use up the day', async () => {
    const ns = fakeNamespace();
    const env = baseEnv({ QUOTA_DO: ns as never, MAX_TURNS_PER_DEVICE: '2' });
    const statuses: number[] = [];
    for (let i = 0; i < 3; i++) {
      const pending: Promise<unknown>[] = [];
      const r = await handle(post(turn()), env, { ...deps(mockClient([{ events: [], hang: true }]), { idleMs: 10 }), waitUntil: p => { pending.push(p); } });
      statuses.push(r.status);
      await sse(r);
      await Promise.all(pending);
    }
    expect(statuses).toEqual([200, 200, 200]);
    expect(ns.objects.get('2026-09-22')?.state.data.get(`d:${DEVICE}`)).toBeUndefined();
  });
});

describe('AUD-3: admission reserves before the paid call and fails closed', () => {
  const ONE: Limits = { device: { turns: 1, steps: 1, out: 1_000_000 }, ip: { turns: 1, steps: 1 }, global: { steps: 1, out: 1_000_000 } };
  const ONE_ENV = { MAX_TURNS_PER_DEVICE: '1', MAX_STEPS_PER_DEVICE: '1', MAX_TURNS_PER_IP: '1', MAX_STEPS_PER_IP: '1', MAX_STEPS_TOTAL: '1' };
  const live = (data: Map<string, unknown>) => [...data.keys()].filter(k => k.startsWith('r:'));

  it('ten parallel admissions with every limit at 1 let exactly one through', async () => {
    const c = new QuotaCounter(fakeState(5) as never, {} as never);
    const r = await Promise.all(Array.from({ length: 10 }, (_, n) => c.admit(KEYS, ONE, `id${n}`, 100, 0)));
    expect(r.filter(x => x.ok)).toHaveLength(1);
  });
  it('ten parallel turns through the handler, limits at 1: one reaches the model, nine get the quota error', async () => {
    const ns = fakeNamespace();
    const env = baseEnv({ QUOTA_DO: ns as never, ...ONE_ENV });
    const client = mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    const pending: Promise<unknown>[] = [];
    const res = await Promise.all(Array.from({ length: 10 }, () => handle(post(turn()), env, deps(client, { waitUntil: p => { pending.push(p); } }))));
    expect(res.map(r => r.status).sort()).toEqual([200, ...Array(9).fill(429)]);
    for (const r of res) if (r.status === 200) await sse(r); else expect(((await r.json()) as { code: string }).code).toBe('quota');
    await Promise.all(pending);
    expect(client.calls).toHaveLength(1);
  });
  it('the global daily cap holds against parallel turns from different devices and IPs', async () => {
    const ns = fakeNamespace();
    const env = baseEnv({ QUOTA_DO: ns as never, MAX_STEPS_TOTAL: '1' });
    const client = mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    const res = await Promise.all(Array.from({ length: 10 }, (_, n) => handle(post(turn(), { 'x-escobar-device': `dev_${n.toString(16).padStart(24, '0')}`, 'cf-connecting-ip': `198.51.100.${n}` }), env, deps(client))));
    expect(res.filter(r => r.status === 200)).toHaveLength(1);
    await Promise.all(res.filter(r => r.status === 200).map(sse));
  });
  it('reconcile swaps the hold for the real usage, once', async () => {
    const state = fakeState();
    const c = new QuotaCounter(state as never, {} as never);
    await c.admit(KEYS, LIM, 'a', 32_000, 0);
    await c.reconcile('a', { steps: 1, out: 40, turns: 0 });
    await c.reconcile('a', { steps: 1, out: 40, turns: 0 });
    c.release('a');
    expect(state.data.get(`d:${DEVICE}`)).toEqual({ turns: 0, steps: 1, out: 40 });
    expect(state.data.get('g')).toEqual({ steps: 1, out: 40 });
    expect(live(state.data)).toEqual([]);
  });
  it('release frees the hold without charging it, and is idempotent', async () => {
    const state = fakeState();
    const c = new QuotaCounter(state as never, {} as never);
    expect(await c.admit(KEYS, ONE, 'a', 100, 0)).toEqual({ ok: true });
    expect(await c.admit(KEYS, ONE, 'b', 100, 0)).toEqual({ ok: false, scope: 'device' });
    c.release('a');
    c.release('a');
    await c.reconcile('a', { steps: 1, out: 40, turns: 1 });
    expect(state.data.get(`d:${DEVICE}`)).toBeUndefined();
    expect(await c.admit(KEYS, ONE, 'c', 100, 0)).toEqual({ ok: true });
  });
  it('an orphaned hold expires: it is charged in full, stops holding, and a late reconcile is ignored', async () => {
    const state = fakeState();
    const c = new QuotaCounter(state as never, {} as never);
    const lim = { ...LIM, device: { ...LIM.device, steps: 3 } };
    await c.admit(KEYS, lim, 'a', 4000, 0);
    await c.admit(KEYS, lim, 'b', 4000, 0);
    expect(await c.admit(KEYS, lim, 'c', 4000, RESERVATION_TTL_MS - 1)).toEqual({ ok: true });
    c.release('c');
    expect(await c.admit(KEYS, lim, 'd', 4000, RESERVATION_TTL_MS)).toEqual({ ok: true });
    expect(state.data.get(`d:${DEVICE}`)).toEqual({ turns: 2, steps: 2, out: 8000 });
    expect(live(state.data)).toEqual(['r:d']);
    await c.reconcile('a', { steps: 1, out: 1, turns: 0 });
    expect(state.data.get(`d:${DEVICE}`)).toEqual({ turns: 2, steps: 2, out: 8000 });
  });
  it('a finished turn and a turn that fails before output both leave no hold', async () => {
    const ns = fakeNamespace();
    const env = baseEnv({ QUOTA_DO: ns as never });
    const run = async (s: Parameters<typeof mockClient>[0][number]) => { const p: Promise<unknown>[] = []; await sse(await handle(post(turn()), env, deps(mockClient([s]), { waitUntil: x => { p.push(x); } }))); await Promise.all(p); };
    await run({ events: eventsFor(TEXT), final: finalMessage(TEXT) });
    await run({ events: eventsFor(TEXT), throwAt: 0, error: new Error('refused at the door') });
    const data = ns.objects.get('2026-09-22')!.state.data;
    expect(live(data)).toEqual([]);
    expect(data.get(`d:${DEVICE}`)).toEqual({ turns: 1, steps: 1, out: 40 });
  });
  it('a Durable Object that throws refuses the paid call with the quota error', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const env = baseEnv({ QUOTA_DO: { idFromName: (n: string) => n, get: () => ({ admit: async () => { throw new Error('DO down'); }, release: async () => {} }) } as never });
    const client = mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    const r = await handle(post(turn()), env, deps(client));
    expect(r.status).toBe(429);
    expect(r.headers.get('retry-after')).toBe('60');
    expect(await r.json()).toMatchObject({ code: 'quota', retryAfter: ENFORCEMENT_RETRY_SEC });
    expect(client.calls).toHaveLength(0);
  });
  it('a used-up day still asks for a retry after midnight UTC', async () => {
    const env = baseEnv({ QUOTA_DO: fakeNamespace() as never, MAX_TURNS_PER_DEVICE: '1' });
    const now = Date.parse('2026-09-22T12:00:00Z');
    const first = await admitQuota(env, KEYS, now, 100);
    expect(first).toMatchObject({ ok: true });
    const r = await admitQuota(env, KEYS, now, 100);
    expect(r).toEqual({ ok: false, message: expect.stringMatching(/coaching limit/), retryAfter: resetInSec(now) });
    expect(resetInSec(now)).toBe(12 * 3600);
  });
  it('a release that arrives before a late admit still blocks the hold', async () => {
    const state = fakeState();
    const c = new QuotaCounter(state as never, {} as never);
    c.release('late');
    expect(await c.admit(KEYS, LIM, 'late', 100, 0)).toEqual({ ok: false, scope: 'device' });
    expect(live(state.data)).toEqual([]);
    expect(await c.admit(KEYS, LIM, 'next', 100, 0)).toEqual({ ok: true });
  });
  it('a Durable Object that never answers is refused after the timeout, and its late hold is released', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const released: string[] = [];
    const env = baseEnv({ QUOTA_DO: { idFromName: (n: string) => n, get: () => ({ admit: () => new Promise(() => {}), release: async (id: string) => { released.push(id); } }) } as never });
    expect(await admitQuota(env, KEYS, 0, 100, 10)).toEqual({ ok: false, message: 'The coach is unavailable right now.', retryAfter: 60 });
    await new Promise(r => setTimeout(r, 0));
    expect(released).toHaveLength(1);
  });
});

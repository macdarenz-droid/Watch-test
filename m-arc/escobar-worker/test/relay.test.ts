import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { handle } from '../src/handler';
import { UpstreamRelay } from '../src/upstreamRelay';
import { mapError, REGION_MESSAGE, type ClientLike } from '../src/anthropic';
import { baseEnv, deps, eventsFor, finalMessage, mockClient, post, sse, turn, DEVICE } from './helpers';
import { relayShard } from '../src/upstream';

const TEXT = [{ type: 'text', text: 'Answered from the US.' }];
const original = UpstreamRelay.makeClient;

/** A UPSTREAM namespace backed by one real UpstreamRelay, recording how it was reached. */
function relayNamespace(client: ClientLike) {
  UpstreamRelay.makeClient = () => client;
  const waits: Promise<unknown>[] = [];
  const relay = new UpstreamRelay({ waitUntil: (p: Promise<unknown>) => waits.push(p) } as never, {} as never);
  const calls: Array<{ name: string; hint?: string }> = [];
  return {
    calls,
    idFromName: (name: string) => name,
    get: (id: string, opts?: { locationHint?: string }) => { calls.push({ name: id, hint: opts?.locationHint }); return { fetch: (url: string, init: RequestInit) => relay.fetch(new Request(url, init)) }; },
  };
}

beforeEach(() => { vi.spyOn(console, 'log').mockImplementation(() => {}); vi.spyOn(console, 'error').mockImplementation(() => {}); });
afterEach(() => { UpstreamRelay.makeClient = original; });

describe('UpstreamRelay (PL-20)', () => {
  it('the model call goes through the relay pinned to eastern North America', async () => {
    const client = mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    const ns = relayNamespace(client);
    const edge = vi.fn();
    const r = await handle(post(turn()), baseEnv({ UPSTREAM: ns as never }), { ...deps(mockClient([])), makeClient: edge });
    const ev = await sse(r);
    // QA-R0-5: one of RELAY_SHARDS objects, chosen by device, all pinned to eastern North America.
    expect(ns.calls).toEqual([{ name: `us-${relayShard(DEVICE)}`, hint: 'enam' }]);
    expect(edge).not.toHaveBeenCalled();
    expect(client.calls).toHaveLength(1);
    expect(ev.filter(e => e.t === 'text').map(e => e.d).join('')).toBe('Answered from the US.');
    expect(ev.at(-1)).toMatchObject({ t: 'final', stop_reason: 'end_turn' });
    expect(ev.some(e => e.t === '_step')).toBe(false);
  });
  it('health reports the relay', async () => {
    const r = await handle(new Request('https://x/health'), baseEnv({ UPSTREAM: relayNamespace(mockClient([])) as never }), deps(mockClient([])));
    expect(((await r.json()) as { relay: boolean }).relay).toBe(true);
  });
  it('a 403 through the relay reaches the app as upstream_region with the API detail', async () => {
    const denied = new Anthropic.PermissionDeniedError(403, { type: 'error', error: { type: 'permission_error', message: 'Request not allowed from this region' } }, undefined, new Headers());
    const ns = relayNamespace(mockClient([{ events: [], throwAt: 0, error: denied }]));
    const req = post(turn());
    Object.defineProperty(req, 'cf', { value: { colo: 'HKG' } });
    const ev = await sse(await handle(req, baseEnv({ UPSTREAM: ns as never }), deps(mockClient([]))));
    expect(ev.at(-1)).toEqual({ t: 'error', code: 'upstream_region', message: REGION_MESSAGE, detail: 'Request not allowed from this region' });
    const logged = (console.error as unknown as { mock: { calls: unknown[][] } }).mock.calls.map(c => String(c[0])).find(l => l.includes('upstream_region'))!;
    expect(JSON.parse(logged)).toMatchObject({ code: 'upstream_region', colo: 'HKG', detail: 'Request not allowed from this region' });
  });
});

describe('mapError splits 401 from 403 (PL-20)', () => {
  it('401 stays upstream_auth, 403 is upstream_region; both keep the detail', () => {
    const auth = mapError(new Anthropic.AuthenticationError(401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }, undefined, new Headers()));
    expect(auth).toEqual({ code: 'upstream_auth', message: 'The coach is not set up correctly.', detail: 'invalid x-api-key' });
    const region = mapError(new Anthropic.PermissionDeniedError(403, { type: 'error', error: { type: 'permission_error', message: 'nope' } }, undefined, new Headers()));
    expect(region).toEqual({ code: 'upstream_region', message: REGION_MESSAGE, detail: 'nope' });
  });
});

describe('disconnects reach the relay (PL-05 with PL-20)', () => {
  it('a cancelled response aborts the model stream inside the relay within 50 ms', async () => {
    let signal: AbortSignal | undefined;
    const client: ClientLike = {
      beta: { messages: { stream(_p, opts) {
        signal = opts?.signal;
        return {
          async *[Symbol.asyncIterator]() { yield eventsFor([])[0] as never; await new Promise((_, rej) => signal?.addEventListener('abort', () => rej(new Anthropic.APIUserAbortError()))); },
          finalMessage: () => new Promise(() => {}), abort() {},
        };
      } } },
    };
    const r = await handle(post(turn()), baseEnv({ UPSTREAM: relayNamespace(client) as never }), deps(mockClient([])));
    const reader = r.body!.getReader();
    await reader.read();
    await vi.waitFor(() => { expect(signal).toBeDefined(); }, { timeout: 200 });
    await reader.cancel();
    await vi.waitFor(() => { expect(signal!.aborted).toBe(true); }, { timeout: 50, interval: 2 });
  });
});

describe('relay shard choice (QA2-FA-5)', () => {
  it('a caller cannot pick a shard from its device id: the same id lands on different shards under different instance seeds', () => {
    const seen = new Set<number>();
    for (let seed = 0; seed < 64; seed++) seen.add(relayShard(DEVICE, seed));
    expect(seen.size).toBe(8);
    // Two ids that share a shard under one seed do not keep sharing it under the others.
    const a = 'dev_000000000000000000000001', b = 'dev_000000000000000000000009';
    let together = 0;
    for (let seed = 0; seed < 64; seed++) if (relayShard(a, seed) === relayShard(b, seed)) together++;
    expect(together).toBeLessThan(32);
  });
});

describe('Worker global scope (deploy error 10021)', () => {
  it('loading the Worker makes no random values; the shard seed is made on first use', async () => {
    vi.resetModules();
    const spy = vi.spyOn(crypto, 'getRandomValues');
    const mod = await import('../src/upstream');
    await import('../src/index');
    expect(spy).not.toHaveBeenCalled();
    mod.relayShard('dev_000000000000000000000001');
    expect(spy).toHaveBeenCalledTimes(1);
    mod.relayShard('dev_000000000000000000000002');
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });
});

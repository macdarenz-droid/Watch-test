import { describe, it, expect, vi, beforeEach } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { handle, corsHeaders } from '../src/handler';
import { noSystemRole } from '../src/anthropic';
import type { ClientLike, StreamLike } from '../src/anthropic';
import { baseEnv, deps, eventsFor, finalMessage, memoryKv, mockClient, post, sse, turn, DEVICE } from './helpers';

beforeEach(() => { vi.spyOn(console, 'log').mockImplementation(() => {}); });

const TEXT = [{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'text', text: 'Short sleep pulled you to amber ⟦f3⟧.' }];

describe('routes, CORS and device', () => {
  it('health answers protocol 2', async () => {
    const r = await handle(new Request('https://x/health'), baseEnv(), deps(mockClient([])));
    expect(await r.json()).toEqual({ ok: true, protocol: 2, model: 'claude-opus-5', models: { chat: 'claude-opus-5', plan: 'claude-opus-5', live: 'claude-opus-5', brief: 'claude-opus-5', moment: 'claude-opus-5', summarize: 'claude-opus-5' }, modes: ['chat', 'plan', 'live', 'brief', 'moment', 'summarize'], quotas: false, relay: false, key: true, ignoredModels: [] }); // F7: /health lists each mode's model
  });
  it('health names the modes whose model override was ignored (QA2-F7-3), without echoing the value', async () => {
    const r = await handle(new Request('https://x/health'), baseEnv({ MODEL_LIVE: 'claude-haiku-4-5', MODEL_BRIEF: 'claude-sonnet-5' }), deps(mockClient([])));
    const body = (await r.json()) as { models: Record<string, string>; ignoredModels: string[] };
    expect(body.ignoredModels).toEqual(['live']);
    expect(body.models).toMatchObject({ live: 'claude-opus-5', brief: 'claude-sonnet-5' });
    expect(JSON.stringify(body)).not.toContain('haiku');
  });
  it('allows the app origins and configured web origins, refuses others', async () => {
    expect(corsHeaders('capacitor://localhost', baseEnv())['Access-Control-Allow-Origin']).toBe('capacitor://localhost');
    expect(corsHeaders('http://localhost:5173', baseEnv())['Access-Control-Allow-Origin']).toBe('http://localhost:5173');
    expect(corsHeaders('https://pwa.example', baseEnv({ ALLOWED_ORIGINS: 'https://pwa.example' }))['Access-Control-Allow-Origin']).toBe('https://pwa.example');
    const r = await handle(post(turn(), { origin: 'https://evil.example' }), baseEnv(), deps(mockClient([])));
    expect(r.status).toBe(403);
    const pre = await handle(new Request('https://x/v2/turn', { method: 'OPTIONS', headers: { origin: 'capacitor://localhost' } }), baseEnv(), deps(mockClient([])));
    expect(pre.status).toBe(204);
    expect(pre.headers.get('access-control-allow-headers')).toContain('x-escobar-device');
  });
  it('requires a well-formed device id', async () => {
    const r = await handle(post(turn(), { 'x-escobar-device': 'dev_short' }), baseEnv(), deps(mockClient([])));
    expect(r.status).toBe(400);
    expect(await r.json()).toMatchObject({ t: 'error', code: 'invalid' });
  });
  it('invalid bodies and too many steps are plain 400s before the stream', async () => {
    const r = await handle(post({ ...turn(), profile: {} }), baseEnv(), deps(mockClient([])));
    expect(r.status).toBe(400);
    const chain: unknown[] = [{ role: 'user', content: 'go' }];
    for (let i = 0; i < 15; i++) { chain.push({ role: 'assistant', content: [{ type: 'tool_use', id: `t${i}`, name: 'get_overview', input: {} }] }); chain.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: `t${i}`, content: '{}' }] }); }
    const s = await handle(post(turn({ messages: chain })), baseEnv(), deps(mockClient([])));
    expect(s.status).toBe(400);
    expect(((await s.json()) as { code: string }).code).toBe('too_many_steps');
  });
  it('a missing key is upstream_auth 503', async () => {
    const r = await handle(post(turn()), baseEnv({ ANTHROPIC_API_KEY: undefined }), deps(mockClient([])));
    expect(r.status).toBe(503);
  });
});

describe('SSE relay (§12.4)', () => {
  it('streams start, thinking, text deltas and final with verbatim content', async () => {
    const client = mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    const r = await handle(post(turn()), baseEnv(), deps(client));
    expect(r.headers.get('content-type')).toBe('text/event-stream');
    const ev = await sse(r);
    expect(ev[0]).toEqual({ t: 'start', requestId: 'req_1' });
    expect(ev[1]).toEqual({ t: 'thinking' });
    expect(ev.filter(e => e.t === 'text').map(e => e.d).join('')).toBe('Short sleep pulled you to amber ⟦f3⟧.');
    const final = ev.at(-1)!;
    expect(final).toMatchObject({ t: 'final', stop_reason: 'end_turn', model: 'claude-opus-5' });
    expect((final.content as Array<{ signature?: string }>)[0]!.signature).toBe('sig');
  });
  it('announces tool calls early and their inputs at block stop', async () => {
    const content = [{ type: 'tool_use', id: 'tu_1', name: 'get_exercise_history', input: { exerciseId: 'lib_barbell_bench_press', weeks: 12 } }, { type: 'tool_use', id: 'tu_2', name: 'get_recovery', input: {} }];
    const r = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: eventsFor(content), final: finalMessage(content, 'tool_use') }])));
    const ev = await sse(r);
    expect(ev.filter(e => e.t === 'tool')).toEqual([{ t: 'tool', id: 'tu_1', name: 'get_exercise_history' }, { t: 'tool', id: 'tu_2', name: 'get_recovery' }]);
    expect(ev.find(e => e.t === 'tool_input' && e.id === 'tu_1')).toEqual({ t: 'tool_input', id: 'tu_1', input: { exerciseId: 'lib_barbell_bench_press', weeks: 12 } });
    expect(ev.at(-1)!.stop_reason).toBe('tool_use');
  });
  it('relays a refusal instead of a final', async () => {
    const r = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: eventsFor([]), final: finalMessage([], 'refusal', { stop_details: { type: 'refusal', category: 'cyber' } }) }])));
    const ev = await sse(r);
    expect(ev.at(-1)).toEqual({ t: 'refusal', category: 'cyber' });
    expect(ev.some(e => e.t === 'final')).toBe(false);
  });
  it('prunes pre-fallback blocks in final', async () => {
    const content = [{ type: 'tool_use', id: 'x', name: 'get_overview', input: {} }, { type: 'fallback', from: { model: 'claude-opus-5' }, to: { model: 'claude-opus-4-8' } }, { type: 'text', text: 'ok' }];
    const r = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: eventsFor(content.slice(2)), final: finalMessage(content) }])));
    expect(((await sse(r)).at(-1)!.content as Array<{ type: string }>).map(b => b.type)).toEqual(['fallback', 'text']);
  });
  it('maps upstream errors to typed error events', async () => {
    const err = new Anthropic.RateLimitError(429, {}, 'rate', new Headers({ 'retry-after': '3' }));
    const r = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: eventsFor(TEXT), throwAt: 0, error: err }])));
    expect((await sse(r)).at(-1)).toEqual({ t: 'error', code: 'upstream_busy', message: 'The coach is busy. Try again in a moment.', retryAfter: 3 });
    const auth = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: [], throwAt: 0, error: new Anthropic.AuthenticationError(401, {}, 'no', new Headers()) }])));
    expect((await sse(auth)).at(-1)!.code).toBe('upstream_auth');
  });
  it('retries once with <situation> blocks when the model rejects system messages, and remembers', async () => {
    const reject = new Anthropic.BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: "messages.1: role 'system' is not supported on this model" } }, undefined, new Headers());
    const client = mockClient([{ events: [], throwAt: 0, error: reject }, { events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    const r = await handle(post(turn()), baseEnv({ MODEL: 'claude-opus-5-5' }), deps(client));
    const ev = await sse(r);
    expect(ev.at(-1)!.t).toBe('final');
    expect(client.calls).toHaveLength(2);
    const second = client.calls[1] as { messages: Array<{ role: string }> };
    expect(second.messages.every(m => m.role !== 'system')).toBe(true);
    expect(noSystemRole.has('claude-opus-5-5')).toBe(true);
    noSystemRole.clear();
  });
  it('enforces the idle timeout itself (the heartbeat defeats client timers)', async () => {
    const r = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: eventsFor([{ type: 'text', text: 'hi' }]), hang: true }]), { idleMs: 30 }));
    expect((await sse(r)).at(-1)).toEqual({ t: 'error', code: 'timeout', message: 'The coach took too long to answer.' });
  });
  it('sends heartbeat comments while waiting', async () => {
    const r = await handle(post(turn()), baseEnv(), deps(mockClient([{ events: eventsFor([{ type: 'text', text: 'hi' }]), hang: true }]), { idleMs: 60, heartbeatMs: 10 }));
    expect(await r.text()).toContain(': ping\n\n');
  });
});

describe('quotas and rate (§12.5)', () => {
  it('rate limit binding refusal is a 429 rate error', async () => {
    const r = await handle(post(turn()), baseEnv({ RATE: { limit: async () => ({ success: false }) } }), deps(mockClient([])));
    expect(r.status).toBe(429);
    expect(((await r.json()) as { code: string }).code).toBe('rate');
  });
  it('writes counters once per finished turn and refuses over the cap with the reset time', async () => {
    const kv = memoryKv();
    const env = baseEnv({ QUOTA: kv, MAX_TURNS_PER_DEVICE: '2' });
    const ok = () => mockClient([{ events: eventsFor(TEXT), final: finalMessage(TEXT) }]);
    await sse(await handle(post(turn()), env, deps(ok())));
    const toolStep = [{ type: 'tool_use', id: 't', name: 'get_overview', input: {} }];
    await sse(await handle(post(turn()), env, deps(mockClient([{ events: eventsFor(toolStep), final: finalMessage(toolStep, 'tool_use') }]))));
    expect(JSON.parse(kv.data.get(`d:2026-09-22:${DEVICE}`)!)).toEqual({ turns: 1, steps: 1, out: 40 });
    await sse(await handle(post(turn()), env, deps(ok())));
    const r = await handle(post(turn()), env, deps(ok()));
    expect(r.status).toBe(429);
    const j = (await r.json()) as { code: string; retryAfter: number };
    expect(j.code).toBe('quota');
    expect(j.retryAfter).toBe(12 * 3600);
  });
});

describe('input hardening and disconnects (PL-14, PL-05)', () => {
  it('a declared content-length over 3 MB is 413 before the body is read or the client is made', async () => {
    const makeClient = vi.fn();
    const req = new Request('https://x/v2/turn', { method: 'POST', body: 'x', headers: { 'x-escobar-device': DEVICE, 'content-length': '3000001' } });
    const text = vi.spyOn(req, 'text');
    const r = await handle(req, baseEnv(), { ...deps(mockClient([])), makeClient });
    expect(r.status).toBe(413);
    expect(((await r.json()) as { code: string }).code).toBe('invalid');
    expect(text).not.toHaveBeenCalled();
    expect(makeClient).not.toHaveBeenCalled();
  });
  it('measures the body in UTF-8 bytes, not UTF-16 units', async () => {
    const body = JSON.stringify(turn({ messages: [{ role: 'user', content: 'é'.repeat(1_500_001) }] }));
    expect(body.length).toBeLessThan(3_000_000);
    const makeClient = vi.fn();
    const r = await handle(new Request('https://x/v2/turn', { method: 'POST', body, headers: { 'x-escobar-device': DEVICE } }), baseEnv(), { ...deps(mockClient([])), makeClient });
    expect(r.status).toBe(413);
    expect(makeClient).not.toHaveBeenCalled();
  });
  it('a cancelled response body aborts the model stream within 50 ms', async () => {
    let signal: AbortSignal | undefined;
    let abortedAt = 0;
    const client: ClientLike = {
      beta: {
        messages: {
          stream(_params, opts) {
            signal = opts?.signal;
            signal?.addEventListener('abort', () => { abortedAt = Date.now(); });
            const it: StreamLike = {
              async *[Symbol.asyncIterator]() {
                yield eventsFor([])[0] as never;
                await new Promise((_, rej) => signal?.addEventListener('abort', () => rej(new Anthropic.APIUserAbortError())));
              },
              finalMessage: () => new Promise(() => {}),
              abort() {},
            };
            return it;
          },
        },
      },
    };
    const r = await handle(post(turn()), baseEnv(), deps(client));
    const reader = r.body!.getReader();
    await reader.read();
    const cancelledAt = Date.now();
    await reader.cancel();
    await vi.waitFor(() => { expect(signal?.aborted).toBe(true); }, { timeout: 50, interval: 2 });
    expect(abortedAt - cancelledAt).toBeLessThan(50);
  });
});

import { ipBucket, readCapped } from '../src/handler';
describe('IP keys and body caps (QA-R0-1, QA-R0-4)', () => {
  it('keys IPv6 callers by their /64 and leaves IPv4 alone', () => {
    expect(ipBucket('2001:db8:abcd:12:1::5')).toBe('2001:db8:abcd:12::/64');
    expect(ipBucket('2001:0db8:abcd:0012:ffff:ffff:ffff:ffff')).toBe('2001:db8:abcd:12::/64');
    expect(ipBucket('2001:db8::1')).toBe('2001:db8:0:0::/64');
    expect(ipBucket('203.0.113.7')).toBe('203.0.113.7');
  });
  it('two addresses in one /64 share the per-IP rate limit', async () => {
    const seen = new Map<string, number>();
    const RATE_IP = { limit: async ({ key }: { key: string }) => { seen.set(key, (seen.get(key) ?? 0) + 1); return { success: true }; } };
    for (const ip of ['2001:db8:1:2::a', '2001:db8:1:2:ffff::b']) {
      const r = await handle(post(turn(), { 'cf-connecting-ip': ip }), baseEnv({ RATE_IP } as never), deps(mockClient([{ events: eventsFor([{ type: 'text', text: 'ok' }]), final: finalMessage([{ type: 'text', text: 'ok' }]) }])));
      await sse(r);
    }
    expect([...seen.entries()]).toEqual([['2001:db8:1:2::/64', 2]]);
  });
  it('a streamed body with no content-length is refused before it is read in full', async () => {
    let pulled = 0;
    const MB = new Uint8Array(1_000_000).fill(32);
    const body = new ReadableStream<Uint8Array>({ pull(c) { pulled++; if (pulled > 5) c.close(); else c.enqueue(MB); } });
    const req = new Request('https://marc-coach.example/v2/turn', { method: 'POST', body, headers: { 'x-escobar-device': DEVICE }, duplex: 'half' } as RequestInit);
    const r = await handle(req, baseEnv(), deps(mockClient([])));
    expect(r.status).toBe(413);
    expect(pulled).toBeLessThanOrEqual(4);
    expect(await readCapped(new Request('https://x', { method: 'POST', body: 'hé' }), 10)).toEqual({ text: 'hé', bytes: 3 });
  });
});

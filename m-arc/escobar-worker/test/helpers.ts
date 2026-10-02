import type { ClientLike, Env, StreamLike } from '../src/anthropic';
import type { Deps } from '../src/handler';

export const DEVICE = 'dev_0123456789abcdef01234567';
export const MANIFEST = { hash: 'abc12345', body: { appVersion: '37.0.0', entries: [{ id: 'body.map', title: 'Muscle map' }] } };

export function turn(overrides: Record<string, unknown> = {}) {
  return { protocol: 2, mode: 'chat', appVersion: '37.0.0', manifest: MANIFEST, messages: [{ role: 'user', content: [{ type: 'text', text: 'Why is my readiness amber?' }] }, { role: 'system', content: 'now: tue 2026-09-22' }], unit: 'kg', tone: 'warm', ...overrides };
}

export type Script = { events: unknown[]; final?: Record<string, unknown>; throwAt?: number; error?: unknown; hang?: boolean };

export function finalMessage(content: unknown[], stop_reason = 'end_turn', extra: Record<string, unknown> = {}) {
  return { id: 'msg_1', type: 'message', role: 'assistant', model: 'claude-opus-5', content, stop_reason, stop_sequence: null, usage: { input_tokens: 100, output_tokens: 40, cache_read_input_tokens: 80 }, ...extra };
}

/** Standard events for a final message: text deltas and tool_use input deltas. */
export function eventsFor(content: Array<Record<string, unknown>>): unknown[] {
  const ev: unknown[] = [{ type: 'message_start', message: finalMessage([], 'end_turn') }];
  content.forEach((b, index) => {
    if (b.type === 'text') {
      ev.push({ type: 'content_block_start', index, content_block: { type: 'text', text: '' } });
      const t = String(b.text);
      for (let i = 0; i < t.length; i += 7) ev.push({ type: 'content_block_delta', index, delta: { type: 'text_delta', text: t.slice(i, i + 7) } });
    } else if (b.type === 'tool_use') {
      ev.push({ type: 'content_block_start', index, content_block: { type: 'tool_use', id: b.id, name: b.name, input: {} } });
      const j = JSON.stringify(b.input);
      for (let i = 0; i < j.length; i += 5) ev.push({ type: 'content_block_delta', index, delta: { type: 'input_json_delta', partial_json: j.slice(i, i + 5) } });
    } else {
      ev.push({ type: 'content_block_start', index, content_block: { ...b } });
    }
    ev.push({ type: 'content_block_stop', index });
  });
  ev.push({ type: 'message_stop' });
  return ev;
}

export function mockClient(scripts: Script[]): ClientLike & { calls: unknown[] } {
  const calls: unknown[] = [];
  return {
    calls,
    beta: {
      messages: {
        stream(params, opts) {
          calls.push(params);
          const s = scripts[Math.min(calls.length - 1, scripts.length - 1)]!;
          let finalResolve: (m: unknown) => void;
          const done = new Promise(r => { finalResolve = r; });
          const it: StreamLike = {
            async *[Symbol.asyncIterator]() {
              for (let i = 0; i < s.events.length; i++) {
                if (s.throwAt === i) throw s.error;
                if (opts?.signal?.aborted) throw new Error('aborted');
                yield s.events[i] as never;
              }
              if (s.throwAt === s.events.length) throw s.error;
              if (s.hang) await new Promise((_, rej) => opts?.signal?.addEventListener('abort', () => rej(new Error('aborted'))));
              finalResolve(s.final);
            },
            finalMessage: () => done as never,
            abort() {},
          };
          return it;
        },
      },
    },
  };
}

export function memoryKv(): KVNamespace & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    async get(key: string, type?: string) { const v = data.get(key); return v == null ? null : type === 'json' ? JSON.parse(v) : v; },
    async put(key: string, value: string) { data.set(key, value); },
  } as never;
}

export const baseEnv = (extra: Partial<Env> = {}): Env => ({ ANTHROPIC_API_KEY: 'sk-test', MODEL: 'claude-opus-5', ...extra });

export function deps(client: ClientLike, extra: Partial<Deps> = {}): Deps {
  return { makeClient: () => client, now: () => Date.parse('2026-09-22T12:00:00Z'), requestId: () => 'req_1', heartbeatMs: 1_000_000, ...extra };
}

export function post(body: unknown, headers: Record<string, string> = {}, path = '/v2/turn') {
  return new Request(`https://marc-coach.example${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-escobar-device': DEVICE, ...headers } });
}

export async function sse(res: Response): Promise<Array<Record<string, unknown>>> {
  const text = await res.text();
  return text.split('\n\n').filter(l => l.startsWith('data: ')).map(l => JSON.parse(l.slice(6)));
}

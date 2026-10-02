/**
 * Transport (§12.4, §13): POST /v2/turn and read server-sent events over fetch. Keeps
 * CapacitorHttp out of the path (it buffers responses and would kill streaming).
 */
import { reportError } from '@/errors';

export type ErrorCode = 'quota' | 'rate' | 'too_many_steps' | 'invalid' | 'upstream_busy' | 'upstream_auth' | 'upstream_region' | 'upstream' | 'timeout' | 'network' | 'offline';

export type StreamEvent =
  | { t: 'start'; requestId: string }
  | { t: 'text'; d: string }
  | { t: 'thinking' }
  | { t: 'tool'; id: string; name: string }
  | { t: 'tool_input'; id: string; input: unknown }
  | { t: 'final'; content: unknown[]; stop_reason: string | null; usage?: Record<string, unknown>; model?: string }
  | { t: 'refusal'; category: string | null }
  | { t: 'error'; code: ErrorCode; message: string; retryAfter?: number };

export interface Transport {
  turn(body: unknown, signal: AbortSignal): AsyncIterable<StreamEvent>;
}

const KNOWN = new Set(['start', 'text', 'thinking', 'tool', 'tool_input', 'final', 'refusal', 'error']);

/**
 * Parses an SSE byte stream already decoded to text chunks. Chunks may split anywhere,
 * including inside a JSON line or a multi-byte directive; events are only emitted once
 * their blank-line terminator has arrived. Comment lines (`: ping`) are ignored.
 */
export async function* parseSse(chunks: AsyncIterable<string>): AsyncIterable<StreamEvent> {
  let buf = '';
  const drain = function* (final: boolean): Generator<StreamEvent> {
    for (;;) {
      const sep = buf.indexOf('\n\n');
      if (sep < 0) {
        if (!final || !buf.trim()) return;
        const rest = buf; buf = '';
        yield* frame(rest);
        return;
      }
      const block = buf.slice(0, sep);
      buf = buf.slice(sep + 2);
      yield* frame(block);
    }
  };
  for await (const chunk of chunks) {
    buf += chunk.replace(/\r\n/g, '\n');
    yield* drain(false);
  }
  yield* drain(true);
}

function* frame(block: string): Generator<StreamEvent> {
  const data = block.split('\n').filter(l => l.startsWith('data:')).map(l => l.slice(5).replace(/^ /, '')).join('\n');
  if (!data) return;
  try {
    const ev = JSON.parse(data) as StreamEvent;
    if (ev && typeof ev === 'object' && KNOWN.has((ev as { t: string }).t)) yield ev;
  } catch { /* a malformed frame is dropped */ }
}

async function* textChunks(body: ReadableStream<Uint8Array>): AsyncIterable<string> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      yield dec.decode(value, { stream: true });
    }
    const tail = dec.decode();
    if (tail) yield tail;
  } finally {
    reader.releaseLock();
  }
}

export function httpTransport(opts: { url: () => string; device: () => string; fetchImpl?: typeof fetch }): Transport {
  return {
    async *turn(body, signal) {
      const f = opts.fetchImpl ?? fetch;
      let res: Response;
      try {
        res = await f(`${opts.url().replace(/\/$/, '')}/v2/turn`, { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'x-escobar-device': opts.device() }, signal });
      } catch {
        if (signal.aborted) return;
        reportError('escobar-transport', 'network', 'fetch failed');
        yield { t: 'error', code: 'network', message: 'Could not reach the coach.' };
        return;
      }
      if (!res.ok || !res.body) {
        let e: StreamEvent = { t: 'error', code: res.status === 429 ? 'rate' : 'upstream', message: 'The coach is unavailable right now.' };
        try {
          const j = (await res.json()) as { t?: string; code?: ErrorCode; message?: string; retryAfter?: number };
          if (j?.t === 'error' && j.code) e = { t: 'error', code: j.code, message: j.message ?? '', ...(j.retryAfter ? { retryAfter: j.retryAfter } : {}) };
        } catch { /* not JSON */ }
        // Never the upstream message content — just that the request failed, and with what status.
        reportError('escobar-transport', 'upstream', `status ${res.status}`);
        yield e;
        return;
      }
      try {
        yield* parseSse(textChunks(res.body));
      } catch {
        if (!signal.aborted) { reportError('escobar-transport', 'stream', 'stream dropped'); yield { t: 'error', code: 'network', message: 'The connection dropped.' }; }
      }
    },
  };
}

/** The proxy counts as online only when /health answers protocol 2 (§12.9). */
/** Online only when the Worker answers protocol 2 with its key present (ES-08). */
export async function checkHealth(url: string, fetchImpl: typeof fetch = fetch, timeoutMs = 5000): Promise<{ ok: boolean; model?: string; message?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetchImpl(`${url.replace(/\/$/, '')}/health`, { signal: ctrl.signal });
    if (!r.ok) return { ok: false };
    const j = (await r.json()) as { protocol?: number; model?: string; key?: boolean };
    if (j?.protocol !== 2) return { ok: false };
    if (j.key !== true) return { ok: false, message: "Escobar isn't set up yet." };
    return { ok: true, model: j.model };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

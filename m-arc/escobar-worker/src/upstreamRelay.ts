/**
 * UpstreamRelay (PL-20): a Durable Object placed in eastern North America (locationHint 'enam'),
 * so every Anthropic call leaves from the US wherever the person's network lands. Anthropic
 * refuses some locations (a Philippine ISP routed to Hong Kong got 403s). It runs one model step
 * and streams the same SSE events back, ending with an internal result event. Validation, quotas
 * and the app-facing stream stay in the handler.
 */
import { DurableObject } from 'cloudflare:workers';
import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsStreaming } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import type { ClientLike, Env, SseEvent } from './anthropic';
import { localStep, RESULT_EVENT } from './upstream';

export class UpstreamRelay extends DurableObject<Env> {
  /** Tests swap the SDK client; production builds it from the ANTHROPIC_API_KEY secret. */
  static makeClient = (env: Env): ClientLike => new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 }) as unknown as ClientLike;

  override async fetch(req: Request): Promise<Response> {
    const { params, idleMs } = (await req.json()) as { params: MessageCreateParamsStreaming; idleMs?: number };
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
    const writer = writable.getWriter();
    const enc = new TextEncoder();
    const upstream = new AbortController();
    let closed = false;
    const gone = () => { closed = true; upstream.abort(); };
    req.signal?.addEventListener('abort', gone);
    writer.closed.catch(gone);
    const write = (s: string) => { if (!closed) void writer.write(enc.encode(s)).catch(gone); };
    const emit = (e: SseEvent | { t: typeof RESULT_EVENT; result: unknown }) => write(`data: ${JSON.stringify(e)}\n\n`);
    const work = (async () => {
      const result = await localStep(UpstreamRelay.makeClient(this.env), params, emit, { idleMs, signal: upstream.signal });
      emit({ t: RESULT_EVENT, result });
    })().catch(err => { console.error('relay step failed:', String(err)); }).finally(() => { closed = true; void writer.close().catch(() => {}); });
    this.ctx.waitUntil(work);
    return new Response(readable, { headers: { 'content-type': 'text/event-stream' } });
  }
}

import { describe, it, expect } from 'vitest';
import { parseSse, httpTransport, checkHealth, type StreamEvent } from '@/escobar/transport';

async function collect(chunks: string[]): Promise<StreamEvent[]> {
  async function* gen() { for (const c of chunks) yield c; }
  const out: StreamEvent[] = [];
  for await (const e of parseSse(gen())) out.push(e);
  return out;
}
const frame = (e: unknown) => `data: ${JSON.stringify(e)}\n\n`;

describe('SSE parser', () => {
  it('parses whole frames and ignores comments', async () => {
    expect(await collect([frame({ t: 'start', requestId: 'r' }) + ': ping\n\n' + frame({ t: 'text', d: 'hi' })])).toEqual([{ t: 'start', requestId: 'r' }, { t: 'text', d: 'hi' }]);
  });
  it('survives chunk splits inside JSON lines and directives', async () => {
    const all = frame({ t: 'text', d: 'Bench is up 5% ⟦f1' }) + frame({ t: 'text', d: '2⟧ this block.' }) + frame({ t: 'final', content: [{ type: 'text', text: 'x' }], stop_reason: 'end_turn' });
    for (const size of [1, 2, 3, 7, 13]) {
      const chunks: string[] = [];
      for (let i = 0; i < all.length; i += size) chunks.push(all.slice(i, i + size));
      const ev = await collect(chunks);
      expect(ev.map(e => e.t)).toEqual(['text', 'text', 'final']);
      expect(ev.filter(e => e.t === 'text').map(e => (e as { d: string }).d).join('')).toBe('Bench is up 5% ⟦f12⟧ this block.');
    }
  });
  it('handles CRLF, a trailing frame without a blank line, unknown and malformed frames', async () => {
    expect(await collect(['data: {"t":"thinking"}\r\n\r\n', 'data: {"t":"mystery"}\n\n', 'data: {bad\n\n', 'data: {"t":"text","d":"end"}'])).toEqual([{ t: 'thinking' }, { t: 'text', d: 'end' }]);
  });
});

function streamResponse(text: string, status = 200): Response {
  const enc = new TextEncoder();
  return new Response(new ReadableStream({ start(c) { for (let i = 0; i < text.length; i += 5) c.enqueue(enc.encode(text.slice(i, i + 5))); c.close(); } }), { status, headers: { 'content-type': 'text/event-stream' } });
}

describe('http transport', () => {
  it('posts to /v2/turn with the device header and yields events', async () => {
    const calls: Array<{ url: string; init: RequestInit }> = [];
    const t = httpTransport({ url: () => 'https://w.example/', device: () => 'dev_0123456789abcdef01234567', fetchImpl: (async (url: string, init: RequestInit) => { calls.push({ url, init }); return streamResponse(frame({ t: 'text', d: 'ok' })); }) as never });
    const out: StreamEvent[] = [];
    for await (const e of t.turn({ a: 1 }, new AbortController().signal)) out.push(e);
    expect(out).toEqual([{ t: 'text', d: 'ok' }]);
    expect(calls[0]!.url).toBe('https://w.example/v2/turn');
    expect((calls[0]!.init.headers as Record<string, string>)['x-escobar-device']).toBe('dev_0123456789abcdef01234567');
  });
  it('turns a pre-stream 429 JSON into a typed error event', async () => {
    const t = httpTransport({ url: () => 'https://w', device: () => 'd', fetchImpl: (async () => new Response(JSON.stringify({ t: 'error', code: 'quota', message: 'resting', retryAfter: 600 }), { status: 429 })) as never });
    const out: StreamEvent[] = [];
    for await (const e of t.turn({}, new AbortController().signal)) out.push(e);
    expect(out).toEqual([{ t: 'error', code: 'quota', message: 'resting', retryAfter: 600 }]);
  });
  it('a network failure is a network error event', async () => {
    const t = httpTransport({ url: () => 'https://w', device: () => 'd', fetchImpl: (async () => { throw new TypeError('offline'); }) as never });
    const out: StreamEvent[] = [];
    for await (const e of t.turn({}, new AbortController().signal)) out.push(e);
    expect(out[0]).toMatchObject({ t: 'error', code: 'network' });
  });
  it('health needs protocol 2', async () => {
    expect((await checkHealth('https://w', (async () => new Response(JSON.stringify({ ok: true, protocol: 2, model: 'm', key: true }))) as never)).ok).toBe(true);
    // ES-08: a Worker without its key is not "online".
    expect(await checkHealth('https://w', (async () => new Response(JSON.stringify({ ok: true, protocol: 2, model: 'm', key: false }))) as never)).toEqual({ ok: false, message: "Escobar isn't set up yet." });
    expect((await checkHealth('https://w', (async () => new Response(JSON.stringify({ ok: true }))) as never)).ok).toBe(false);
    expect((await checkHealth('https://w', (async () => { throw new Error('x'); }) as never)).ok).toBe(false);
  });
});

describe('region refusal (PL-20)', () => {
  it('passes upstream_region through with its message', async () => {
    const msg = "Escobar isn't available on this network right now. Try mobile data.";
    expect(await collect([frame({ t: 'error', code: 'upstream_region', message: msg, detail: 'region' })])).toEqual([{ t: 'error', code: 'upstream_region', message: msg, detail: 'region' }]);
  });
});

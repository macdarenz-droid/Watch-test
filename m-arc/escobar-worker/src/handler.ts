/**
 * Routes, CORS, device id, validation, rate limit and quotas, then one streamed model step
 * relayed as server-sent events (§12.2, §12.4–12.6). Pure over injected deps so tests can
 * drive it with a scripted SDK stream.
 */
import { buildParams, modelFor, MODE_CONFIG, ignoredModelOverrides, noSystemRole, DEFAULT_MODEL, type ClientLike, type Env, type SseEvent, type ErrorCode } from './anthropic';
import { localStep, relayStep, type StepResult } from './upstream';
import { validateTurn, stepsSinceUser, MAX_BODY_BYTES } from './validate';
import { admitQuota, recordStep, releaseQuota } from './quota';
import { MODES } from './prompt/modes';

export const PROTOCOL = 2;
export const DEVICE_ID = /^dev_[a-f0-9]{24}$/;
export const HEARTBEAT_MS = 10_000;
const ALWAYS_ALLOWED = new Set(['capacitor://localhost', 'http://localhost', 'https://localhost', 'ionic://localhost']);

export interface Deps {
  makeClient(env: Env): ClientLike;
  now(): number;
  requestId(): string;
  waitUntil?(p: Promise<unknown>): void;
  heartbeatMs?: number;
  idleMs?: number;
}

export function corsHeaders(origin: string | null, env: Env): Record<string, string> {
  const extra = (env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = !origin || ALWAYS_ALLOWED.has(origin) || extra.includes(origin) || /^https?:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/(127\.0\.0\.1|\[::1\])(:\d+)?$/.test(origin);
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-escobar-device',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (ok) h['Access-Control-Allow-Origin'] = origin ?? '*';
  return h;
}

const json = (status: number, body: unknown, cors: Record<string, string>, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors, ...extra } });
const fail = (status: number, code: ErrorCode, message: string, cors: Record<string, string>, retryAfter?: number) =>
  json(status, { t: 'error', code, message, ...(retryAfter ? { retryAfter } : {}) }, cors, retryAfter ? { 'retry-after': String(retryAfter) } : {});

/**
 * Whether the API billed this step: it finished, refused or produced output. QA2-FA-6: a step that
 * stalled or was cancelled before any output (thinking included, see modelOutput) is not counted.
 */
export const billed = (r: StepResult): boolean => !!r.final || !!r.refused || r.emittedAny;

/**
 * QA2-FA-1..4: output tokens per second a step is taken to produce while it runs, for a step cut
 * short before the API reported its usage. Thinking is billed as output but never streamed (display
 * "omitted" is the default, so a thinking block arrives empty), so how long the step ran is the only
 * measure of it. Set above the output speed of every model a mode can use, so the estimate does not
 * fall below the bill; it never passes the step's max_tokens.
 */
export const CUT_SHORT_TOKENS_PER_SEC = 200;

/**
 * QA-R0-1: rate and daily limits key an IPv6 caller by its /64, the block one subscriber usually
 * controls, so rotating addresses inside it gains nothing. IPv4 stays as is.
 */
export function ipBucket(ip: string): string {
  if (!ip.includes(':')) return ip;
  const [head, tail = ''] = ip.toLowerCase().split('::');
  const h = head ? head.split(':') : [];
  const t = tail ? tail.split(':') : [];
  const groups = ip.includes('::') ? [...h, ...Array(Math.max(0, 8 - h.length - t.length)).fill('0'), ...t] : h;
  return `${groups.slice(0, 4).map(g => (g || '0').replace(/^0+(?=.)/, '')).join(':')}::/64`;
}

/** The request body, read in chunks and stopped at `max` bytes (null when over). */
export async function readCapped(req: Request, max: number): Promise<{ text: string; bytes: number } | null> {
  if (!req.body) return { text: '', bytes: 0 };
  const reader = req.body.getReader();
  const parts: Uint8Array[] = [];
  let bytes = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    bytes += value.byteLength;
    if (bytes > max) { void reader.cancel().catch(() => {}); return null; }
    parts.push(value);
  }
  const all = new Uint8Array(bytes);
  let at = 0;
  for (const p of parts) { all.set(p, at); at += p.byteLength; }
  return { text: new TextDecoder().decode(all), bytes };
}

export async function handle(req: Request, env: Env, deps: Deps): Promise<Response> {
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin, env);
  if (origin && !('Access-Control-Allow-Origin' in cors)) return new Response('forbidden origin', { status: 403 });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (url.pathname === '/health' && req.method === 'GET') {
    return json(200, { ok: true, protocol: PROTOCOL, model: env.MODEL || DEFAULT_MODEL, models: Object.fromEntries(MODES.map(m => [m, modelFor(m, env)])), modes: MODES, quotas: !!(env.QUOTA_DO || env.QUOTA), relay: !!env.UPSTREAM, key: !!env.ANTHROPIC_API_KEY, ignoredModels: ignoredModelOverrides(env) }, cors);
  }
  if (url.pathname !== '/v2/turn') return json(404, { t: 'error', code: 'invalid', message: 'not found' }, cors);
  if (req.method !== 'POST') return fail(405, 'invalid', 'use POST', cors);
  const device = req.headers.get('x-escobar-device') ?? '';
  if (!DEVICE_ID.test(device)) return fail(400, 'invalid', 'missing or malformed x-escobar-device', cors);
  if (!env.ANTHROPIC_API_KEY) return fail(503, 'upstream_auth', 'The coach is not set up correctly.', cors);

  const declared = Number(req.headers.get('content-length') ?? 'NaN');
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) return fail(413, 'invalid', 'body over 3 MB', cors);
  // QA-R0-4: a body without content-length is read chunk by chunk and refused as soon as it passes the cap.
  const read = await readCapped(req, MAX_BODY_BYTES);
  if (!read) return fail(413, 'invalid', 'body over 3 MB', cors);
  const { text, bytes } = read;
  let raw: unknown;
  try { raw = JSON.parse(text); } catch { return fail(400, 'invalid', 'body is not JSON', cors); }
  const v = validateTurn(raw, bytes);
  if (!v.ok) return fail(400, v.code, v.message, cors);
  const body = v.body;

  if (env.RATE) {
    try { const r = await env.RATE.limit({ key: device }); if (!r.success) return fail(429, 'rate', 'Slow down a little: too many requests this minute.', cors, 60); } catch { /* binding unavailable: allow */ }
  }
  const ip = ipBucket(req.headers.get('cf-connecting-ip') ?? 'unknown');
  // The Cloudflare location serving this request (e.g. HKG): the first thing to check for PL-20.
  const colo = (req as Request & { cf?: { colo?: string } }).cf?.colo ?? null;
  if (env.RATE_IP) {
    try { const r = await env.RATE_IP.limit({ key: ip }); if (!r.success) return fail(429, 'rate', 'Slow down a little: too many requests this minute.', cors, 60); } catch { /* binding unavailable: allow */ }
  }
  const keys = { device, ip };
  const now = deps.now();
  // AUD-3: reserve one step and the mode's max output before the paid call; reconciled or released below.
  const q = await admitQuota(env, keys, now, MODE_CONFIG[body.mode].maxTokens);
  if (!q.ok) return fail(429, 'quota', q.message, cors, q.retryAfter);
  let settled = false;

  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const enc = new TextEncoder();
  let closed = false;
  // Stop the model (and its billing) as soon as the app goes away (PL-05).
  const upstream = new AbortController();
  req.signal?.addEventListener('abort', () => upstream.abort());
  const gone = () => { closed = true; upstream.abort(); };
  writer.closed.catch(gone);
  const write = (s: string) => { if (!closed) void writer.write(enc.encode(s)).catch(gone); };
  // Characters of model output sent so far, and whether the model began its answer (thinking
  // included): with the step's running time, the billed-output estimate when it has no final message.
  let outChars = 0;
  let modelOutput = false;
  const emit = (e: SseEvent) => {
    if (e.t === 'thinking' || e.t === 'text' || e.t === 'tool') modelOutput = true;
    if (e.t === 'text') outChars += e.d.length;
    else if (e.t === 'tool_input') outChars += JSON.stringify(e.input ?? '').length;
    write(`data: ${JSON.stringify(e)}\n\n`);
  };
  const heartbeat = setInterval(() => write(': ping\n\n'), deps.heartbeatMs ?? HEARTBEAT_MS);

  const work = (async () => {
    const requestId = deps.requestId();
    emit({ t: 'start', requestId });
    const model = modelFor(body.mode, env);
    const turnSteps = stepsSinceUser(body.messages) + 1;
    let stepStart = now;
    // PL-20: with the relay bound, the Anthropic call leaves from the US, not from this edge.
    const step = (p: ReturnType<typeof buildParams>): Promise<StepResult> => {
      stepStart = deps.now();
      return env.UPSTREAM
        ? relayStep(env, p, emit, { idleMs: deps.idleMs, signal: upstream.signal, shardKey: device })
        : localStep(deps.makeClient(env), p, emit, { idleMs: deps.idleMs, signal: upstream.signal });
    };
    let params = buildParams(body, env);
    let res = await step(params);
    if (res.systemRole && !res.emittedAny) {
      noSystemRole.add(model);
      params = buildParams(body, env, { foldSystem: true });
      res = await step(params);
    }
    if (res.error && !upstream.signal.aborted) {
      const { detail, ...shown } = res.error;
      if (detail || res.error.code.startsWith('upstream')) console.error(JSON.stringify({ requestId, code: res.error.code, detail: detail ?? null, colo }));
      emit({ t: 'error', ...shown, ...(detail ? { detail } : {}) });
    }
    const usage = (res.final?.usage ?? {}) as { input_tokens?: number; output_tokens?: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null };
    console.log(JSON.stringify({ requestId, colo, mode: body.mode, model: res.final?.model ?? model, stop_reason: res.final?.stop_reason ?? null, in: usage.input_tokens ?? 0, out: usage.output_tokens ?? 0, cacheRead: usage.cache_read_input_tokens ?? 0, cacheWrite: usage.cache_creation_input_tokens ?? 0, steps: turnSteps, ms: deps.now() - now }));
    // QA-R0-1/2/3: every step the API bills is counted: a finished one, a refusal, and one cut short by
    // a hang-up, a timeout or a mid-stream error. Only an error before any output (nothing billed) is not.
    if (billed(res) || modelOutput) {
      // QA2-FA-1..4: a cut-short step is charged for the time it ran, which covers thinking the stream never shows.
      const ranSec = Math.max(0, deps.now() - stepStart) / 1000;
      const cutShort = Math.min(params.max_tokens, Math.max(Math.ceil(outChars / 3), Math.ceil(ranSec * CUT_SHORT_TOKENS_PER_SEC)));
      const outputTokens = res.final?.usage?.output_tokens ?? res.outputTokens ?? cutShort;
      settled = true;
      const p = recordStep(env, keys, now, { turnEnded: res.final ? res.final.stop_reason !== 'tool_use' : true, outputTokens, turnSteps }, q.id);
      if (deps.waitUntil) deps.waitUntil(p); else await p;
    }
  })().catch(() => emit({ t: 'error', code: 'upstream', message: 'The coach is unavailable right now.' })).finally(async () => {
    clearInterval(heartbeat);
    closed = true;
    void writer.close().catch(() => {});
    if (!settled) await releaseQuota(env, now, q.id);
  });
  if (deps.waitUntil) deps.waitUntil(work);

  return new Response(readable, { status: 200, headers: { 'content-type': 'text/event-stream', 'cache-control': 'no-store', 'x-accel-buffering': 'no', ...cors } });
}

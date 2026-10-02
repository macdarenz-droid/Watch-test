/**
 * POST /errors, GET /errors/summary (docs/ERROR-REPORTS.md "Server") and POST /reports (ESC-REPORT-W). Reuses the Escobar
 * Worker's CORS rules (src/handler.ts): only the Capacitor origin and the allowed web origin,
 * never a wildcard with credentials (no Access-Control-Allow-Credentials header is ever sent).
 * Nothing from a request (body, IP, install id) is ever logged; storage errors answer 503 without detail.
 */
import { corsHeaders, ipBucket } from './handler';
import type { Env } from './anthropic';
import { validateBatch, cleanReport, validateContentReport, MAX_ERRORS_BODY_BYTES, MAX_REPORT_BODY_BYTES } from './errorsValidate';
import { countReport, countRequest, ensureSchema, storeContentReport, storeReports, summarize } from './errorsStore';

export interface ErrorsDeps { now(): number }

const HOUR_MS = 3_600_000;

const json = (status: number, body: unknown, cors: Record<string, string>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...cors } });

/** The request body, read in chunks and stopped at `max` bytes (null when over). */
async function readCapped(req: Request, max: number): Promise<{ text: string; bytes: number } | null> {
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

/** Constant-time string comparison for the summary token. */
function sameText(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function handleErrors(req: Request, env: Env, deps: ErrorsDeps): Promise<Response> {
  const url = new URL(req.url);
  const origin = req.headers.get('origin');
  const cors = corsHeaders(origin, env);
  if (origin && !('Access-Control-Allow-Origin' in cors)) return new Response('forbidden origin', { status: 403 });
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

  if (url.pathname === '/errors/summary' && req.method === 'GET') {
    const token = env.ERRORS_SUMMARY_TOKEN;
    if (!token || !sameText(req.headers.get('authorization') ?? '', `Bearer ${token}`)) return json(401, { error: 'unauthorized' }, cors);
    if (!env.ERRORS_DB) return json(503, { error: 'not configured' }, cors);
    try {
      await ensureSchema(env.ERRORS_DB);
      return json(200, await summarize(env.ERRORS_DB, deps.now()), cors);
    } catch { return json(503, { error: 'storage unavailable' }, cors); }
  }

  if (url.pathname === '/errors' && req.method === 'POST') {
    // The secret keys the IP hash (errorsStore.ts `ipKey`), so without it nothing is accepted.
    if (!env.ERRORS_DB || !env.ERRORS_SUMMARY_TOKEN) return json(503, { error: 'not configured' }, cors);
    const declared = Number(req.headers.get('content-length') ?? 'NaN');
    if (Number.isFinite(declared) && declared > MAX_ERRORS_BODY_BYTES) return json(413, { error: 'body over 8 KB' }, cors);
    const read = await readCapped(req, MAX_ERRORS_BODY_BYTES);
    if (!read) return json(413, { error: 'body over 8 KB' }, cors);
    let raw: unknown;
    try { raw = JSON.parse(read.text); } catch { return json(400, { error: 'body is not JSON' }, cors); }
    const v = validateBatch(raw);
    if (!v.ok) return json(400, { error: v.message }, cors);
    const reports = v.body.reports.map(cleanReport);
    const ip = req.headers.get('cf-connecting-ip') ?? 'unknown';
    const now = deps.now();
    try {
      await ensureSchema(env.ERRORS_DB);
      const rate = await countRequest(env.ERRORS_DB, env.ERRORS_SUMMARY_TOKEN, [...new Set(reports.map(r => r.installId))], ip, now);
      if (!rate.ok) return json(429, { error: 'rate limited' }, cors);
      await storeReports(env.ERRORS_DB, reports, now);
    } catch { return json(503, { error: 'storage unavailable' }, cors); }
    return new Response(null, { status: 204, headers: cors });
  }

  if (url.pathname === '/reports' && req.method === 'POST') {
    // Same rule as /errors: the secret keys the network hash, so without it nothing is accepted.
    if (!env.ERRORS_DB || !env.ERRORS_SUMMARY_TOKEN) return json(503, { error: 'not configured' }, cors);
    const declared = Number(req.headers.get('content-length') ?? 'NaN');
    if (Number.isFinite(declared) && declared > MAX_REPORT_BODY_BYTES) return json(413, { error: 'body over 24 KB' }, cors);
    const read = await readCapped(req, MAX_REPORT_BODY_BYTES);
    if (!read) return json(413, { error: 'body over 24 KB' }, cors);
    let raw: unknown;
    try { raw = JSON.parse(read.text); } catch { return json(400, { error: 'body is not JSON' }, cors); }
    const v = validateContentReport(raw);
    if (!v.ok) return json(400, { error: v.message }, cors);
    const now = deps.now();
    try {
      await ensureSchema(env.ERRORS_DB);
      if (!(await countReport(env.ERRORS_DB, env.ERRORS_SUMMARY_TOKEN, ipBucket(req.headers.get('cf-connecting-ip') ?? 'unknown'), now))) {
        const retry = Math.ceil((HOUR_MS - (now % HOUR_MS)) / 1000);
        return new Response(JSON.stringify({ error: 'rate limited' }), { status: 429, headers: { 'content-type': 'application/json', 'retry-after': String(retry), ...cors } });
      }
      await storeContentReport(env.ERRORS_DB, v.body, now);
    } catch { return json(503, { error: 'storage unavailable' }, cors); }
    return new Response(null, { status: 204, headers: cors });
  }

  return json(404, { error: 'not found' }, cors);
}

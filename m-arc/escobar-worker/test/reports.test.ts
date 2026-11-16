/** ESC-REPORT-W: POST /reports (docs/escobar/ESC-REPORT-CARDS.md, card ESC-REPORT-W, WR1-WR9). */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleErrors } from '../src/errorsHandler';
import { ipKey, RETENTION_MS } from '../src/errorsStore';
import worker from '../src/index';
import type { Env } from '../src/anthropic';
import { sqliteD1 } from './d1-sqlite';

const NOW = Date.parse('2026-09-30T12:34:56Z');
const deps = { now: () => NOW };
const IP = '203.0.113.7';
const SECRET = 'test-secret-token';
const TEXT = 'Squat 3 x 5 at 102.5 kg on 2026-09-30, then rest 90 s.';

const report = (overrides: Record<string, unknown> = {}) => ({ v: 1, reason: 'wrong', text: TEXT, app: '1.4.0', ...overrides });

function post(body: unknown, headers: Record<string, string> = {}, raw?: string, path = '/reports') {
  return new Request(`https://marc-coach.example${path}`, { method: 'POST', body: raw ?? JSON.stringify(body), headers: { 'content-type': 'application/json', 'cf-connecting-ip': IP, ...headers } });
}

function testEnv(extra: Partial<Env> = {}) {
  const db = sqliteD1();
  return { db, env: { ERRORS_DB: db.d1, ERRORS_SUMMARY_TOKEN: SECRET, ...extra } as Env };
}

type DB = ReturnType<typeof sqliteD1>;
type Row = Record<string, unknown>;
const tables = (db: DB): string[] => db.raw.prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'`).all().map(r => String(r.name));
const rows = (db: DB, table: string): Row[] => (tables(db).includes(table) ? db.raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all() : []);
const sha256 = async (s: string) => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
const send = (env: Env, body: unknown = report(), headers: Record<string, string> = {}, now = NOW) => handleErrors(post(body, headers), env, { now: () => now });

afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); });

describe('WR1 a valid report', () => {
  it('answers 204 and stores the text exactly, digits kept, with its SHA-256, n = 1 and the injected time', async () => {
    const { db, env } = testEnv();
    const res = await send(env);
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
    const [row, ...more] = rows(db, 'content_reports');
    expect(more).toEqual([]);
    expect(row).toEqual({ id: 1, stored_at: NOW, reason: 'wrong', app: '1.4.0', text: TEXT, text_sha: await sha256(TEXT), n: 1 });
  });
});

describe('WR2 validation', () => {
  const cases: [string, unknown][] = [
    ['an unknown key', report({ extra: 1 })],
    ['missing v', (({ v: _, ...r }) => r)(report())],
    ['missing reason', (({ reason: _, ...r }) => r)(report())],
    ['missing text', (({ text: _, ...r }) => r)(report())],
    ['missing app', (({ app: _, ...r }) => r)(report())],
    ['v: 2', report({ v: 2 })],
    ['reason spam', report({ reason: 'spam' })],
    ['text not a string', report({ text: 42 })],
    ['whitespace-only text', report({ text: '  \n' })],
    ['a 4001-unit text', report({ text: 'a'.repeat(4001) })],
    ['a bell character', report({ text: 'ok \u0007 ok' })],
    ['a carriage return', report({ text: 'ok \r ok' })],
    ['a NEL (C1) character', report({ text: 'ok \u0085 ok' })],
    ["app 'x y'", report({ app: 'x y' })],
    ['an array', [report()]],
  ];
  for (const [name, body] of cases) {
    it(`400 for ${name}, with an error and nothing stored`, async () => {
      const { db, env } = testEnv();
      const res = await send(env, body);
      expect(res.status).toBe(400);
      expect(typeof ((await res.json()) as { error: unknown }).error).toBe('string');
      expect(rows(db, 'content_reports')).toEqual([]);
    });
  }

  it('400 for a body that is not JSON', async () => {
    const { env } = testEnv();
    const res = await handleErrors(post(null, {}, '{"v":1,'), env, deps);
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'body is not JSON' });
  });

  it('204 for a 4000-unit text holding \\t and \\n', async () => {
    const { db, env } = testEnv();
    const text = ('line\tone\n' + 'x'.repeat(91)).repeat(40);
    expect(text).toHaveLength(4000);
    expect((await send(env, report({ text }))).status).toBe(204);
    expect(rows(db, 'content_reports')[0]!.text).toBe(text);
  });
});

describe('WR3 body size (24,576 bytes)', () => {
  it('413 on a declared size over the cap, and on a longer streamed body with a false content-length', async () => {
    const { db, env } = testEnv();
    expect((await handleErrors(post(report(), { 'content-length': '24577' }), env, deps)).status).toBe(413);
    const big = JSON.stringify(report()) + ' '.repeat(24_577 - new TextEncoder().encode(JSON.stringify(report())).length);
    expect(new TextEncoder().encode(big).length).toBe(24_577);
    const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(big)); c.close(); } });
    const streamed = new Request('https://marc-coach.example/reports', { method: 'POST', body: stream, duplex: 'half', headers: { 'content-length': '100', 'cf-connecting-ip': IP } } as RequestInit);
    expect(streamed.headers.get('content-length')).toBe('100');
    expect((await handleErrors(streamed, env, deps)).status).toBe(413);
    expect(rows(db, 'content_reports')).toEqual([]);
  });

  it('204 for 4000 × € as UTF-8, and for the same text sent as \\u20ac escapes', async () => {
    const { db, env } = testEnv();
    const text = '€'.repeat(4000);
    expect((await send(env, report({ text }))).status).toBe(204);
    const escaped = JSON.stringify(report({ text })).replace(/€/g, '\\u20ac');
    const bytes = new TextEncoder().encode(escaped).length;
    expect(bytes).toBeGreaterThan(24_000);
    expect(bytes).toBeLessThanOrEqual(24_576);
    expect((await handleErrors(post(null, {}, escaped), env, deps)).status).toBe(204);
    const stored = rows(db, 'content_reports');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ text, n: 2 });
  });
});

describe('WR4 de-duplication', () => {
  it('the same text and reason is one row with n = 2 and the first date; another reason is a second row', async () => {
    const { db, env } = testEnv();
    expect((await send(env, report(), {}, NOW)).status).toBe(204);
    expect((await send(env, report({ app: '1.5.0' }), {}, NOW + 60_000)).status).toBe(204);
    expect((await send(env, report({ reason: 'harmful' }), {}, NOW + 120_000)).status).toBe(204);
    const stored = rows(db, 'content_reports');
    expect(stored).toHaveLength(2);
    expect(stored[0]).toMatchObject({ reason: 'wrong', n: 2, stored_at: NOW, app: '1.4.0' });
    expect(stored[1]).toMatchObject({ reason: 'harmful', n: 1, stored_at: NOW + 120_000 });
  });
});

describe('WR5 rate limits', () => {
  it('(a) the 11th report from one network in an hour is 429 with retry-after to the next UTC hour', async () => {
    const { env } = testEnv();
    for (let i = 0; i < 10; i++) expect((await send(env)).status).toBe(204);
    const res = await send(env);
    expect(res.status).toBe(429);
    expect(res.headers.get('retry-after')).toBe('1504');
    expect(await res.json()).toEqual({ error: 'rate limited' });
  });

  it('(b) two addresses in one IPv6 /64 share a counter', async () => {
    const { env } = testEnv();
    for (let i = 0; i < 10; i++) expect((await send(env, report(), { 'cf-connecting-ip': i % 2 ? '2001:db8:1:2::a' : '2001:db8:1:2::b' })).status).toBe(204);
    expect((await send(env, report(), { 'cf-connecting-ip': '2001:db8:1:2::b' })).status).toBe(429);
    expect((await send(env, report(), { 'cf-connecting-ip': '2001:db8:1:3::a' })).status).toBe(204);
  });

  it('(c) /reports and /errors keep separate per-IP counters', async () => {
    const errBody = { v: 1, reports: [{ installId: '11111111-1111-4111-8111-000000000000', ts: '2026-09-30T12:00:00.000Z', app: '1.4.0', platform: 'android', route: 'coach', kind: 'boundary', name: 'TypeError', message: 'x', frames: [], sig: '0a', count: 1 }] };
    const a = testEnv();
    for (let i = 0; i < 40; i++) await send(a.env);
    expect((await send(a.env)).status).toBe(429);
    expect((await handleErrors(post(errBody, {}, undefined, '/errors'), a.env, deps)).status).toBe(204);
    const b = testEnv();
    const errs: number[] = [];
    for (let i = 0; i < 31; i++) errs.push((await handleErrors(post(errBody, {}, undefined, '/errors'), b.env, deps)).status);
    expect(errs.slice(0, 30).every(s => s === 204)).toBe(true);
    expect(errs[30]).toBe(429);
    expect((await send(b.env)).status).toBe(204);
  });

  it('(d) the /errors IP key is unchanged', async () => {
    expect(await ipKey('test-secret-token', '2026-09-30T12', '203.0.113.7')).toBe('de4c2abe5614874bc55c48c779e5ea14423552146db4854829f5805052a0dbbd');
  });

  it('(e) the 201st report in an hour is 429, even from a new network', async () => {
    const { env } = testEnv();
    for (let net = 0; net < 20; net++) for (let i = 0; i < 10; i++) expect((await send(env, report(), { 'cf-connecting-ip': `198.51.100.${net}` })).status).toBe(204);
    expect((await send(env, report(), { 'cf-connecting-ip': '198.51.100.20' })).status).toBe(429);
  });

  it('(f) a network over its limit does not use up the hourly total', async () => {
    const { db, env } = testEnv();
    const statuses: number[] = [];
    for (let i = 0; i < 200; i++) statuses.push((await send(env, report(), { 'cf-connecting-ip': '198.51.100.1' })).status);
    expect(statuses.filter(s => s === 204)).toHaveLength(10);
    expect(statuses.filter(s => s === 429)).toHaveLength(190);
    expect((await send(env, report(), { 'cf-connecting-ip': '198.51.100.2' })).status).toBe(204);
    expect(rows(db, 'error_rate').find(r => r.k === 'r:all:2026-09-30T12')!.n).toBe(11);
  });

  it('(g) the report key is its own HMAC domain under the r:p: prefix', async () => {
    const key = '20685af34c208d8affa2f8c32071b274f5e7e28451f059ef1cb1264b2685d90b';
    expect(await ipKey('test-secret-token', '2026-09-30T12', '203.0.113.7', 'reports-ip')).toBe(key);
    const { db, env } = testEnv();
    expect((await send(env)).status).toBe(204);
    expect(rows(db, 'error_rate').map(r => r.k).sort()).toEqual(['r:all:2026-09-30T12', `r:p:${key}`]);
  });
});

describe('WR6 nothing identifying kept or logged', () => {
  it('logs nothing on the 204, 400, 413, 429 and 503 paths', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(m => vi.spyOn(console, m).mockImplementation(() => {}));
    const { env } = testEnv();
    const seen: number[] = [];
    seen.push((await send(env)).status);
    seen.push((await send(env, report({ reason: 'spam' }))).status);
    seen.push((await handleErrors(post(report(), { 'content-length': '30000' }), env, deps)).status);
    for (let i = 0; i < 10; i++) await send(env);
    seen.push((await send(env)).status);
    seen.push((await send({} as Env)).status);
    const broken = { ...env, ERRORS_DB: { prepare() { throw new Error(`db down ${TEXT} ${IP} ${SECRET}`); }, batch() { throw new Error('db down'); } } as unknown as D1Database };
    seen.push((await send(broken)).status);
    expect(seen).toEqual([204, 400, 413, 429, 503, 503]);
    const logged = JSON.stringify(spies.flatMap(s => s.mock.calls));
    for (const secret of [TEXT, IP, SECRET]) expect(logged).not.toContain(secret);
    expect(spies.flatMap(s => s.mock.calls)).toEqual([]);
  });

  it('stores only the named columns, never the raw IP, and HMAC keys only in error_rate', async () => {
    const { db, env } = testEnv();
    await send(env);
    await send(env, report({ reason: 'offensive' }), { 'cf-connecting-ip': '2001:db8:1:2::a' });
    expect(db.raw.prepare('PRAGMA table_info(content_reports)').all().map(r => r.name)).toEqual(['id', 'stored_at', 'reason', 'app', 'text', 'text_sha', 'n']);
    const cells = (t: string) => rows(db, t).flatMap(r => Object.values(r).map(String));
    const all = tables(db).flatMap(cells);
    for (const ip of [IP, '2001:db8:1:2::a', '2001:db8:1:2::']) expect(all.some(c => c.includes(ip))).toBe(false);
    const keys = cells('error_rate').filter(c => c.startsWith('r:p:'));
    expect(keys).toHaveLength(2);
    for (const k of keys) expect(k).toMatch(/^r:p:[0-9a-f]{64}$/);
    const hmacs = keys.map(k => k.slice(4));
    for (const t of tables(db).filter(t => t !== 'error_rate')) expect(cells(t).some(c => hmacs.some(h => c.includes(h)))).toBe(false);
  });
});

describe('WR7 failure paths and routing', () => {
  it('503 without ERRORS_DB or without ERRORS_SUMMARY_TOKEN, storing nothing', async () => {
    expect((await send({ ERRORS_SUMMARY_TOKEN: SECRET } as Env)).status).toBe(503);
    const { db, env } = testEnv({ ERRORS_SUMMARY_TOKEN: undefined });
    const res = await send(env);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'not configured' });
    expect(tables(db)).toEqual([]);
  });

  it('OPTIONS from the app origin is 204 with CORS; a foreign origin is 403; GET is 404', async () => {
    const { env } = testEnv();
    const opt = await handleErrors(new Request('https://marc-coach.example/reports', { method: 'OPTIONS', headers: { origin: 'https://localhost' } }), env, deps);
    expect(opt.status).toBe(204);
    expect(opt.headers.get('access-control-allow-origin')).toBe('https://localhost');
    expect(opt.headers.get('access-control-allow-methods')).toContain('POST');
    expect((await send(env, report(), { origin: 'https://evil.example' })).status).toBe(403);
    expect((await handleErrors(new Request('https://marc-coach.example/reports'), env, deps)).status).toBe(404);
  });

  it('a D1 that throws gives 503 storage unavailable', async () => {
    const { env } = testEnv();
    const broken = { ...env, ERRORS_DB: { prepare() { throw new Error('down'); }, batch() { throw new Error('down'); } } as unknown as D1Database };
    const res = await send(broken);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: 'storage unavailable' });
  });

  it('through worker.fetch, POST /reports {} is 400 with an error', async () => {
    const { env } = testEnv();
    const res = await worker.fetch(post({}), env, { waitUntil() {} } as unknown as ExecutionContext);
    expect(res.status).toBe(400);
    expect(typeof ((await res.json()) as { error: unknown }).error).toBe('string');
  });
});

describe('WR8 retention', () => {
  it('the scheduled purge deletes a report 90 days + 1 ms old and keeps one 90 days - 1 ms old', async () => {
    const { db, env } = testEnv();
    const PURGE = NOW + RETENTION_MS;
    expect((await send(env, report({ text: 'old' }), {}, PURGE - RETENTION_MS - 1)).status).toBe(204);
    expect((await send(env, report({ text: 'kept' }), {}, PURGE - RETENTION_MS + 1)).status).toBe(204);
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(PURGE);
    const waits: Promise<unknown>[] = [];
    await worker.scheduled({} as ScheduledController, env, { waitUntil: (p: Promise<unknown>) => waits.push(p) } as unknown as ExecutionContext);
    await Promise.all(waits);
    expect(rows(db, 'content_reports').map(r => r.text)).toEqual(['kept']);
  });
});

describe('WR9 the owner SQL (copied byte for byte from "Owner steps")', () => {
  const OWNER_SQL_LATEST = `SELECT id, datetime(stored_at / 1000, 'unixepoch') AS first_reported_utc, reason, n AS times, app, text FROM content_reports ORDER BY stored_at DESC, id DESC LIMIT 20;`;
  const OWNER_SQL_BY_REASON = `SELECT reason, COUNT(*) AS replies, SUM(n) AS reports FROM content_reports WHERE stored_at >= (CAST(strftime('%s', 'now') AS INTEGER) - 7 * 86400) * 1000 GROUP BY reason ORDER BY reports DESC;`;
  const utc = (t: number) => new Date(Math.floor(t / 1000) * 1000).toISOString().slice(0, 19).replace('T', ' ');

  it('query 1 lists every row newest first; query 2 counts the last 7 days by reason', async () => {
    const { db, env } = testEnv();
    const day = Date.now() - 86_400_000;
    const week = Date.now() - 8 * 86_400_000;
    await send(env, report({ text: 'week old', reason: 'offensive' }), {}, week);
    await send(env, report({ reason: 'wrong' }), {}, day);
    await send(env, report({ reason: 'wrong' }), {}, day);
    await send(env, report({ reason: 'harmful' }), {}, day);
    const latest = db.raw.prepare(OWNER_SQL_LATEST).all().map(r => ({ ...r }));
    // The duplicate's upsert uses up id 3 (SQLite AUTOINCREMENT), so the next row is 4.
    expect(latest).toEqual([
      { id: 4, first_reported_utc: utc(day), reason: 'harmful', times: 1, app: '1.4.0', text: TEXT },
      { id: 2, first_reported_utc: utc(day), reason: 'wrong', times: 2, app: '1.4.0', text: TEXT },
      { id: 1, first_reported_utc: utc(week), reason: 'offensive', times: 1, app: '1.4.0', text: 'week old' },
    ]);
    const byReason = db.raw.prepare(OWNER_SQL_BY_REASON).all().map(r => ({ ...r }));
    expect(byReason).toEqual([
      { reason: 'wrong', replies: 1, reports: 2 },
      { reason: 'harmful', replies: 1, reports: 1 },
    ]);
  });
});

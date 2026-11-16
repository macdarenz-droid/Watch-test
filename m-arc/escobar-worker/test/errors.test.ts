import { describe, it, expect, vi, afterEach } from 'vitest';
import { handleErrors } from '../src/errorsHandler';
import { dailyPurge, HOURLY_LIMIT, RETENTION_MS } from '../src/errorsStore';
import { bundlePath, cleanReport, scrubMessage, type Report } from '../src/errorsValidate';
import worker from '../src/index';
import type { Env } from '../src/anthropic';
import { sqliteD1 } from './d1-sqlite';

const NOW = Date.parse('2026-09-27T12:00:00Z');
const HOUR = 3_600_000;
const deps = { now: () => NOW };
const uuidFor = (i: number): string => `11111111-1111-4111-8111-${i.toString(16).padStart(12, '0')}`;
const INSTALL = uuidFor(0);
const IP = '203.0.113.5';
const SECRET = 'test-secret-token';

/** A report as the app builds it (src/errors/scrub.ts `buildReport` on PR #35). */
function report(overrides: Record<string, unknown> = {}) {
  return {
    installId: INSTALL, ts: '2026-09-27T12:00:00.000Z', app: '1.4.0', platform: 'android',
    route: 'exercise-stats', kind: 'boundary', name: 'TypeError', message: 'x is undefined',
    frames: [{ file: 'https://localhost/assets/index-AbCd1234.js', line: 1, col: 2 }], sig: '0a1b2c3d', count: 1, ...overrides,
  };
}
const batch = (reports: unknown[] = [report()]) => ({ v: 1, reports });

function post(body: unknown, headers: Record<string, string> = {}, raw?: string) {
  return new Request('https://marc-coach.example/errors', { method: 'POST', body: raw ?? JSON.stringify(body), headers: { 'content-type': 'application/json', 'cf-connecting-ip': IP, ...headers } });
}

function testEnv(extra: Partial<Env> = {}) {
  const db = sqliteD1();
  return { db, env: { ERRORS_DB: db.d1, ERRORS_SUMMARY_TOKEN: SECRET, ...extra } as Env };
}

type Row = Record<string, unknown>;
const tables = (db: ReturnType<typeof sqliteD1>): string[] => db.raw.prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`).all().map(r => String(r.name));
/** A table's rows; none when the table was never created (a rejected request never reaches storage). */
const rows = (db: ReturnType<typeof sqliteD1>, table: string): Row[] => (tables(db).includes(table) ? db.raw.prepare(`SELECT * FROM ${table}`).all() : []);
/** Every value in every table, to prove what is and is not stored. */
const everything = (db: ReturnType<typeof sqliteD1>): string =>
  ['error_reports', 'error_rate'].flatMap(t => rows(db, t)).map(r => JSON.stringify(r)).join('\n');
/** The report text columns only (no hashes, ids or timestamps, whose digits could match by chance). */
const reportText = (db: ReturnType<typeof sqliteD1>): string =>
  rows(db, 'error_reports').map(r => [r.app, r.os, r.device, r.route, r.name, r.message, r.frames].join('|')).join('\n');

afterEach(() => vi.restoreAllMocks());

describe('POST /errors: shape and size (W1-W3)', () => {
  it('W1 a batch the app builds returns 204 and is stored as sent', async () => {
    const { db, env } = testEnv();
    const r = await handleErrors(post(batch()), env, deps);
    expect(r.status).toBe(204);
    const stored = rows(db, 'error_reports');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({
      stored_at: NOW, install_id: INSTALL, ts: '2026-09-27T12:00:00.000Z', app: '1.4.0', platform: 'android', os: null, device: null,
      route: 'exercise-stats', kind: 'boundary', name: 'TypeError', message: 'x is undefined', sig: '0a1b2c3d', count: 1,
    });
    expect(JSON.parse(stored[0]!.frames as string)).toEqual([{ file: '/assets/index-AbCd1234.js', line: 1, col: 2 }]);
  });

  it('W1 accepts a full batch of 20 and every documented kind', async () => {
    const { db, env } = testEnv();
    const kinds = ['boundary', 'onerror', 'unhandledrejection', 'store-save', 'boot', 'backup', 'escobar-transport'];
    const reports = Array.from({ length: 20 }, (_, i) => report({ kind: kinds[i % kinds.length], sig: i.toString(16) }));
    expect((await handleErrors(post(batch(reports)), env, deps)).status).toBe(204);
    expect(rows(db, 'error_reports')).toHaveLength(20);
  });

  it('W2 rejects with 400, and stores nothing: unknown fields, wrong types, over-limit values, empty or 21-report batches, bad kind or sig', async () => {
    const { db, env } = testEnv();
    const sixteenFrames = Array.from({ length: 16 }, () => ({ file: 'a.js', line: 1, col: 1 }));
    const cases: Array<[string, unknown]> = [
      ['unknown report field', batch([{ ...report(), weightKg: 80 }])],
      ['unknown top-level field', { ...batch(), notes: 'x' }],
      ['unknown frame field', batch([report({ frames: [{ file: 'a.js', line: 1, col: 1, source: 'x' }] })])],
      ['wrong type', batch([report({ count: 'one' })])],
      ['missing field', batch([(({ route: _r, ...rest }) => rest)(report())])],
      ['message over 300', batch([report({ message: 'x'.repeat(301) })])],
      ['name over 80', batch([report({ name: 'E'.repeat(81) })])],
      ['route over 80', batch([report({ route: 'r'.repeat(81) })])],
      ['16 frames', batch([report({ frames: sixteenFrames })])],
      ['21 reports', batch(Array.from({ length: 21 }, (_, i) => report({ installId: uuidFor(i) })))],
      ['0 reports', batch([])],
      ['bad kind', batch([report({ kind: 'workout' })])],
      ['bad sig', batch([report({ sig: 'bench 100kg' })])],
      ['bad install id', batch([report({ installId: 'me@example.com' })])],
      ['bad ts', batch([report({ ts: 'yesterday' })])],
      ['bad platform', batch([report({ platform: 'ios' })])],
      ['v not 1', { v: 2, reports: [report()] }],
      ['not an object', [report()]],
    ];
    for (const [label, body] of cases) expect([label, (await handleErrors(post(body), env, deps)).status]).toEqual([label, 400]);
    expect((await handleErrors(post(null, {}, '{not json'), env, deps)).status).toBe(400);
    expect(rows(db, 'error_reports')).toHaveLength(0);
  });

  it('W3 the 8 KB (8192-byte) limit: exactly 8192 bytes is accepted, 8193 is 413, with or without content-length', async () => {
    const { db, env } = testEnv();
    const base = JSON.stringify(batch());
    const at = (n: number) => base + ' '.repeat(n - new TextEncoder().encode(base).length);
    expect((await handleErrors(post(null, {}, at(8192)), env, deps)).status).toBe(204);
    expect((await handleErrors(post(null, {}, at(8193)), env, deps)).status).toBe(413);
    // No content-length: a streamed body is cut off while reading.
    const stream = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode(at(9000))); c.close(); } });
    const streamed = new Request('https://marc-coach.example/errors', { method: 'POST', body: stream, duplex: 'half', headers: { 'cf-connecting-ip': IP } } as RequestInit);
    expect(streamed.headers.get('content-length')).toBeNull();
    expect((await handleErrors(streamed, env, deps)).status).toBe(413);
    expect(rows(db, 'error_reports')).toHaveLength(1);
  });
});

describe('POST /errors: server-side allowlist (W4)', () => {
  it('W4 re-cleans values: message digits and quotes, non-bundle frames, odd route, name, app, os and device', async () => {
    const { db, env } = testEnv();
    const hostile = report({
      message: 'Squat 140kg for "Anna" at 07:30',
      route: 'user anna@example.com',
      name: 'Error for Anna 555',
      app: '1.4.0 <script>',
      os: 'Android 15',
      device: 'Pixel 9; call 555-0100 ✓',
      frames: [
        { file: 'https://localhost/assets/index-AbCd1234.js?user=anna#x', line: 10, col: 5 },
        { file: 'chrome-extension://abc/inject.js', line: 1, col: 1 },
        { file: 'Anna Smith 140kg', line: 1, col: 1 },
        { file: '../../etc/passwd.js', line: 1, col: 1 },
        { file: 'assets/web-aB3dE5fG.js', line: 3, col: 4 },
      ],
    });
    expect((await handleErrors(post(batch([hostile])), env, deps)).status).toBe(204);
    const [row] = rows(db, 'error_reports');
    expect(row).toMatchObject({ message: 'Squat ###kg for "…" at ##:##', route: 'unknown', name: 'Error', app: 'unknown', os: 'Android 15', device: null });
    expect(JSON.parse(row!.frames as string)).toEqual([
      { file: '/assets/index-AbCd1234.js', line: 10, col: 5 },
      { file: '/assets/web-aB3dE5fG.js', line: 3, col: 4 },
    ]);
    const all = reportText(db);
    for (const personal of ['Anna', '140', '07:30', 'anna@example.com', '555', 'chrome-extension', 'passwd', 'user=anna']) expect(all).not.toContain(personal);
  });

  it('W4 keeps only the real bundle files, never a path that could carry personal text (review of 06efaba, finding 1)', () => {
    const leaks = [
      'https://localhost/Jane-Doe-bench-100kg',
      'https://localhost/notes/I-hurt-my-knee',
      'https://localhost/notes/Jane-Doe-100kg.js',
      'https://localhost/assets/Jane-Doe-bench-100kg.js',
      'https://localhost/assets/sub/index-AbCd1234.js',
      'file:///storage/emulated/0/Jane/index-AbCd1234.js',
      'blob:https://localhost/6f1c-2a',
      'data:text/javascript,alert(1)',
      'Error: failed at https://localhost/Jane-Doe-bench-100kg',
    ];
    for (const f of leaks) expect([f, bundlePath(f)]).toEqual([f, null]);
    const kept: Array<[string, string]> = [
      ['https://localhost/assets/index-AbCd1234.js', '/assets/index-AbCd1234.js'],
      ['https://mrcdrnzz.netlify.app/assets/EscobarSheet-Xy12_w-4.js?v=1#x', '/assets/EscobarSheet-Xy12_w-4.js'],
      ['capacitor://localhost/assets/web-aB3dE5fG.js', '/assets/web-aB3dE5fG.js'],
      ['https://localhost/sw.js', '/sw.js'],
      ['assets/web-aB3dE5fG.js', '/assets/web-aB3dE5fG.js'],
    ];
    for (const [f, want] of kept) expect([f, bundlePath(f)]).toEqual([f, want]);
  });

  it('W4 matches the app cleaning, and cleaning twice changes nothing', () => {
    expect(scrubMessage(`Cannot read "12" of 'abc' at \`y\` 3`)).toBe('Cannot read "…" of "…" at "…" #');
    const once = cleanReport(report({ message: scrubMessage('weight 82.5 "notes"') }) as Report);
    expect(cleanReport(once)).toEqual(once);
  });

  it('W4 nested, unclosed and curly quotes never leak (review of 06efaba, finding 2)', () => {
    const cases: Array<[string, string, string[]]> = [
      [`Unexpected token 'h', "hello "Dave Smith"... is not valid JSON`, 'Unexpected token "…", "…"... is not valid JSON', ['Dave', 'Smith', 'hello']],
      [`Cannot read properties of undefined (reading 'O'Brien bench')`, 'Cannot read properties of undefined (reading "…")', ['Brien', 'bench']],
      ['weight \u201C100 kg\u201D Jane', 'weight "…" Jane', ['100', 'kg']],
      ['note \u2018my knee hurts\u2019 today', 'note "…" today', ['knee']],
      ['bad input "Jane Doe squats', 'bad input "…"', ['Jane', 'squats']],
      [`it's Jane's log`, 'it"…"s log', ['Jane']],
      ['"a" and "b" and "c"', '"…"', ['a', 'b', 'c']],
    ];
    for (const [raw, want, gone] of cases) {
      const got = scrubMessage(raw);
      expect([raw, got]).toEqual([raw, want]);
      for (const g of gone) expect([raw, got.includes(g)]).toEqual([raw, false]);
      expect(scrubMessage(got)).toBe(got);
    }
    // Cut at 300 in the middle of "…": cleaning again still changes nothing.
    const edge = scrubMessage('x'.repeat(298) + '"secret');
    expect(edge).toHaveLength(300);
    expect(scrubMessage(edge)).toBe(edge);
  });

  it('W4 keeps the error names the app sends (save-failed, load-recovered) and code names, and drops free text', async () => {
    const { db, env } = testEnv();
    const names = ['save-failed', 'load-recovered', 'TypeError', 'QuotaExceededError', 'DOMException', 'Jane Doe', '100kg', 'a<b'];
    await handleErrors(post(batch(names.map((name, i) => report({ name, sig: i.toString(16) })))), env, deps);
    expect(rows(db, 'error_reports').map(r => r.name)).toEqual(['save-failed', 'load-recovered', 'TypeError', 'QuotaExceededError', 'DOMException', 'Error', 'Error', 'Error']);
  });
});

describe('POST /errors: rate limits (W5)', () => {
  const send = (env: Env, body: unknown, ip = IP, now = NOW) => handleErrors(post(body, { 'cf-connecting-ip': ip }), env, { now: () => now });

  it(`W5 the ${HOURLY_LIMIT + 1}st request in an hour from one install id returns 429 (IP changes each time)`, async () => {
    const { env } = testEnv();
    const statuses: number[] = [];
    for (let i = 0; i <= HOURLY_LIMIT; i++) statuses.push((await send(env, batch(), `198.51.100.${i}`)).status);
    expect(statuses.slice(0, HOURLY_LIMIT)).toEqual(Array(HOURLY_LIMIT).fill(204));
    expect(statuses[HOURLY_LIMIT]).toBe(429);
  });

  it(`W5 the ${HOURLY_LIMIT + 1}st request in an hour from one IP returns 429 (install id changes each time)`, async () => {
    const { env } = testEnv();
    const statuses: number[] = [];
    for (let i = 0; i <= HOURLY_LIMIT; i++) statuses.push((await send(env, batch([report({ installId: uuidFor(i) })]))).status);
    expect(statuses.slice(0, HOURLY_LIMIT)).toEqual(Array(HOURLY_LIMIT).fill(204));
    expect(statuses[HOURLY_LIMIT]).toBe(429);
  });

  it('W5 a rejected request stores nothing, and the next hour starts fresh', async () => {
    const { db, env } = testEnv();
    for (let i = 0; i < HOURLY_LIMIT; i++) await send(env, batch());
    expect((await send(env, batch([report({ sig: 'ff' })]))).status).toBe(429);
    expect(rows(db, 'error_reports').some(r => r.sig === 'ff')).toBe(false);
    expect((await send(env, batch(), IP, NOW + HOUR)).status).toBe(204);
    // Counters from the earlier hour are gone once the new hour's first request runs.
    expect(rows(db, 'error_rate').every(r => r.hour === '2026-09-27T13')).toBe(true);
  });

  it('W5 concurrent requests cannot race past the limit', async () => {
    const { env } = testEnv();
    const statuses = await Promise.all(Array.from({ length: 45 }, () => send(env, batch()).then(r => r.status)));
    expect(statuses.filter(s => s === 204)).toHaveLength(HOURLY_LIMIT);
    expect(statuses.filter(s => s === 429)).toHaveLength(45 - HOURLY_LIMIT);
  });
});

describe('POST /errors: no personal data stored or logged (W6)', () => {
  it('W6 the IP is never stored: only a keyed hash, which changes with the secret', async () => {
    const a = testEnv();
    await handleErrors(post(batch()), a.env, deps);
    expect(everything(a.db)).not.toContain(IP);
    const ipRows = rows(a.db, 'error_rate').filter(r => String(r.k).startsWith('p:'));
    expect(ipRows).toHaveLength(1);
    expect(String(ipRows[0]!.k)).toMatch(/^p:[0-9a-f]{64}$/);
    const b = testEnv({ ERRORS_SUMMARY_TOKEN: 'another-secret' });
    await handleErrors(post(batch()), b.env, deps);
    expect(rows(b.db, 'error_rate').find(r => String(r.k).startsWith('p:'))!.k).not.toBe(ipRows[0]!.k);
  });

  it('W6 nothing from the request is logged, on success, on rejection or on a storage failure', async () => {
    const spies = (['log', 'info', 'warn', 'error', 'debug'] as const).map(m => vi.spyOn(console, m).mockImplementation(() => {}));
    const { env } = testEnv();
    const secret = report({ message: 'super-secret-message-xyz' });
    await handleErrors(post(batch([secret])), env, deps);
    await handleErrors(post(batch([{ ...secret, extra: 'super-secret-message-xyz' }])), env, deps);
    const broken = { ...env, ERRORS_DB: { prepare() { throw new Error(`db down super-secret-message-xyz ${IP}`); }, batch() { throw new Error('db down'); } } as unknown as D1Database };
    expect((await handleErrors(post(batch([secret])), broken, deps)).status).toBe(503);
    expect(spies.flatMap(s => s.mock.calls)).toEqual([]);
  });
});

describe('storage setup and retention (W7-W8)', () => {
  it('W7 answers 503 until the D1 binding and the secret are both set, and stores nothing', async () => {
    expect((await handleErrors(post(batch()), {} as Env, deps)).status).toBe(503);
    const { db, env } = testEnv({ ERRORS_SUMMARY_TOKEN: undefined });
    expect((await handleErrors(post(batch()), env, deps)).status).toBe(503);
    expect(tables(db)).toEqual([]);
  });

  it('W8 the daily cron deletes reports older than 90 days and keeps newer ones', async () => {
    const { db, env } = testEnv();
    const later = NOW + RETENTION_MS;
    await handleErrors(post(batch([report({ sig: 'a1' })])), env, deps);
    await handleErrors(post(batch([report({ sig: 'b2' })])), env, { now: () => NOW + 2 * HOUR });
    await dailyPurge(env.ERRORS_DB, later + HOUR);
    expect(rows(db, 'error_reports').map(r => r.sig)).toEqual(['b2']);
    expect(rows(db, 'error_rate')).toHaveLength(0);
  });

  it('W8 the scheduled handler runs the purge, and does nothing without the binding', async () => {
    const { db, env } = testEnv();
    await handleErrors(post(batch()), env, deps);
    const waits: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p) } as unknown as ExecutionContext;
    vi.spyOn(Date, 'now').mockReturnValue(NOW + RETENTION_MS + HOUR);
    await worker.scheduled({} as ScheduledController, env, ctx);
    await Promise.all(waits);
    expect(rows(db, 'error_reports')).toHaveLength(0);
    await worker.scheduled({} as ScheduledController, {} as Env, ctx);
    await expect(Promise.all(waits)).resolves.toBeDefined();
  });
});

describe('GET /errors/summary (W9)', () => {
  const get = (headers: Record<string, string> = {}) => new Request('https://marc-coach.example/errors/summary', { headers });

  it('W9 returns 401 without the right token, and new signatures, counts and affected installs with it', async () => {
    const { env } = testEnv();
    // Seen two days ago: not new.
    await handleErrors(post(batch([report({ sig: 'c0', installId: uuidFor(9) })])), env, { now: () => NOW - 48 * HOUR });
    await handleErrors(post(batch([report({ sig: 'c0', count: 4, installId: uuidFor(3) })])), env, deps);
    await handleErrors(post(batch([report({ sig: 'a0', count: 2, installId: uuidFor(1) })])), env, deps);
    await handleErrors(post(batch([report({ sig: 'a0', count: 3, installId: uuidFor(2) })])), env, deps);
    await handleErrors(post(batch([report({ sig: 'a0', count: 1, installId: uuidFor(1) })])), env, deps);
    await handleErrors(post(batch([report({ sig: 'b0', count: 1, installId: uuidFor(1) })])), env, deps);

    expect((await handleErrors(get(), env, deps)).status).toBe(401);
    expect((await handleErrors(get({ authorization: 'Bearer wrong' }), env, deps)).status).toBe(401);
    expect((await handleErrors(get({ authorization: `Bearer ${SECRET}` }), { ...env, ERRORS_SUMMARY_TOKEN: undefined }, deps)).status).toBe(401);

    const r = await handleErrors(get({ authorization: `Bearer ${SECRET}` }), env, deps);
    expect(r.status).toBe(200);
    const body = (await r.json()) as { signatures: Array<{ sig: string; count: number; installs: number; new: boolean }> };
    const bySig = Object.fromEntries(body.signatures.map(s => [s.sig, s]));
    expect(bySig['a0']).toMatchObject({ count: 6, installs: 2, new: true });
    expect(bySig['b0']).toMatchObject({ count: 1, installs: 1, new: true });
    expect(bySig['c0']).toMatchObject({ count: 4, installs: 1, new: false });
    expect(body.signatures).toHaveLength(3);
  });
});

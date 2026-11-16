import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildReport, cleanName, framesFromStack, isAppFrame, scrubMessage, signatureOf } from '@/errors/scrub';
import { clearQueue, enqueue, loadQueueState, MAX_COUNT, MAX_QUEUE, removeByIds, setBackoff, BASE_BACKOFF_MS, MAX_BACKOFF_MS } from '@/errors/queue';
import { MAX_BATCH, MAX_BODY_BYTES, packBatch, trySend } from '@/errors/sender';
import { getInstallId, resetInstallId } from '@/errors/installId';
import { shouldAskErrorReports } from '@/errors/ask';
import { clearErrorReportQueue, describeError, initErrorReporting, reportCaught, reportError, resetErrorReporting, sendingAllowed } from '@/errors';
import { bootRecovered, saveError, state } from '@/core/store';
import { freshState } from '@/core/models';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { httpTransport } from '@/escobar/transport';
import type { Report } from '@/errors/types';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  } as Storage;
}

const PERSONAL = { exercise: 'Bulgarian Split Squat', split: 'Push Day A', note: 'left knee still tender', bodyWeight: 82.4, weight: 62.5, reps: 8, coach: 'You crushed leg day, Alex!' };

describe('scrubMessage (A1)', () => {
  it('turns every digit into # and every quoted string into "…", then cuts to 300 chars', () => {
    const raw = `Cannot log set for "${PERSONAL.exercise}" ("${PERSONAL.split}"): ${PERSONAL.reps} reps at ${PERSONAL.weight}kg, body weight ${PERSONAL.bodyWeight}, coach said "${PERSONAL.coach}"`;
    const out = scrubMessage(raw);
    for (const v of Object.values(PERSONAL)) expect(out).not.toContain(String(v));
    expect(out).not.toMatch(/\d/);
    expect(out).toContain('"…"');
    expect(scrubMessage('x'.repeat(500)).length).toBe(300);
  });

  it('scrubs settings values and long free text the same way', () => {
    const raw = 'weightUnit="lb" restDefaultSec=90 note="Feeling great today, PR incoming!"';
    const out = scrubMessage(raw);
    expect(out).not.toContain('lb');
    expect(out).not.toContain('90');
    expect(out).not.toContain('Feeling great today');
  });
});

describe('review probes on 09500d3 (PR #35 findings 1–3)', () => {
  const origin = 'https://localhost';
  it('1: the message line is never parsed, and only bundle files are frames', () => {
    const stack = [
      `Error: failed at ${origin}/Jane-Doe-bench-100kg:1:2`,
      `    at ${origin}/notes/I-hurt-my-knee:3:4`,
      `    at logSet (${origin}/assets/index-AbCd1234.js:10:5)`,
      `Error: at ${origin}/assets/index-AbCd1234.js:99:9`,
    ].join('\n');
    expect(framesFromStack(stack, origin)).toEqual([{ file: '/assets/index-AbCd1234.js', line: 10, col: 5 }]);
  });
  it('2: nested, unclosed and curly quotes never leak', () => {
    const cases = [
      ['Unexpected token \'h\', "hello "Dave Smith"... is not valid JSON', 'Dave'],
      ["Cannot read properties of undefined (reading 'O'Brien bench')", 'Brien'],
      ['weight \u201C100 kg\u201D Jane', 'kg'],
      ['note "left knee still tender', 'knee'],
      ['\u2018Alex\u2019s bench\u2019 failed', 'Alex'],
    ] as const;
    for (const [raw, secret] of cases) {
      const out = scrubMessage(raw);
      expect(out, raw).not.toContain(secret);
      expect(out, raw).not.toMatch(/\d/);
    }
    expect(scrubMessage('weight \u201C100 kg\u201D Jane')).toBe('weight "\u2026" Jane');
    expect(scrubMessage('note "left knee')).toBe('note "\u2026"');
    // Cleaning twice changes nothing (the Worker cleans again).
    const once = scrubMessage('a "b" c \'d\' 12');
    expect(scrubMessage(once)).toBe(once);
  });
  it('3: the app\'s own error names pass the Worker\'s name rule unchanged', () => {
    const WORKER_ERROR_NAME = /^[A-Za-z_$][\w$.-]{0,79}$/;
    for (const n of ['SaveFailed', 'LoadRecovered', 'NonError', 'network', 'upstream', 'stream']) {
      expect(cleanName(n)).toBe(n);
      expect(WORKER_ERROR_NAME.test(n), n).toBe(true);
      expect(n).not.toContain('-');
    }
  });
});

describe('framesFromStack / isAppFrame (A1)', () => {
  const origin = 'https://app.example';
  it('keeps only same-origin (app-bundle) frames, and caps at 15', () => {
    const lines = ['Error: boom'];
    for (let i = 0; i < 10; i++) lines.push(`    at fn (${origin}/assets/index-AbCd1234.js:${i}:${i})`);
    for (let i = 0; i < 10; i++) lines.push(`    at fn (https://cdn.other.com/lib.js:${i}:${i})`);
    for (let i = 0; i < 10; i++) lines.push(`    at fn (${origin}/assets/index-AbCd1234.js:${100 + i}:1)`);
    const frames = framesFromStack(lines.join('\n'), origin);
    expect(frames.length).toBe(15);
    expect(frames.every(f => f.file === '/assets/index-AbCd1234.js')).toBe(true);
  });

  it('isAppFrame rejects other hosts and browser extensions', () => {
    expect(isAppFrame(`${origin}/assets/index-AbCd1234.js`, origin)).toBe(true);
    expect(isAppFrame(`${origin}/sw.js`, origin)).toBe(true);
    expect(isAppFrame(`${origin}/assets/a.js`, origin)).toBe(false);
    expect(isAppFrame('https://evil.example/assets/index-AbCd1234.js', origin)).toBe(false);
    expect(isAppFrame('chrome-extension://abc/a.js', origin)).toBe(false);
    expect(isAppFrame('<anonymous>', origin)).toBe(false);
    // A bare path can carry a user's folder name.
    expect(isAppFrame('/home/alex/app/index.js', origin)).toBe(false);
    expect(isAppFrame('index.js', origin)).toBe(false);
    // A data: or blob: "file" can carry content; another origin that merely starts the same way is not ours.
    expect(isAppFrame('data:text/javascript,alert(1)', origin)).toBe(false);
    expect(isAppFrame(`blob:${origin}/1234`, origin)).toBe(false);
    expect(isAppFrame(`${origin}.evil.example/assets/index-AbCd1234.js`, origin)).toBe(false);
  });

  it('keeps only the url of a Firefox "fn@url" frame, and drops query and hash', () => {
    const stack = `renderBulgarianSplitSquat@${origin}/assets/index-AbCd1234.js?note=knee#x:12:34\n@data:text/javascript,secret:1:1`;
    const frames = framesFromStack(stack, origin);
    expect(frames).toEqual([{ file: '/assets/index-AbCd1234.js', line: 12, col: 34 }]);
  });
});

describe('buildReport (A1: allowlist-only)', () => {
  it('only ever has the allowlisted keys, and unknown input fields cannot leak through', () => {
    const evil = { installId: 'i', app: 'v', platform: 'web' as const, route: 'today', kind: 'boundary' as const, name: 'TypeError', rawMessage: 'x', extraSecret: 'should not appear', stack: undefined };
    const r = buildReport(evil);
    const keys = Object.keys(r).sort();
    expect(keys).toEqual(['app', 'count', 'frames', 'installId', 'kind', 'message', 'name', 'platform', 'route', 'sig', 'ts'].sort());
    expect(JSON.stringify(r)).not.toContain('extraSecret');
  });

  it('an over-long or free-text name becomes "Error"; a code name is kept; count starts at 1', () => {
    const r = buildReport({ installId: 'i', app: 'v', platform: 'web', route: 'today', kind: 'onerror', name: 'x'.repeat(100), rawMessage: 'boom' });
    expect(r.name).toBe('Error');
    expect(r.count).toBe(1);
    expect(cleanName('x'.repeat(80))).toBe('x'.repeat(80));
    expect(cleanName(`${PERSONAL.exercise} failed`)).toBe('Error');
    expect(cleanName('QuotaExceededError')).toBe('QuotaExceededError');
    expect(cleanName('SaveFailed')).toBe('SaveFailed');
  });
});

describe('signatureOf', () => {
  it('is stable for the same kind/name/top frames and differs otherwise', () => {
    const frames = [{ file: 'a.js', line: 1, col: 2 }];
    const s1 = signatureOf('boundary', 'TypeError', frames);
    const s2 = signatureOf('boundary', 'TypeError', frames);
    expect(s1).toBe(s2);
    expect(signatureOf('boot', 'TypeError', frames)).not.toBe(s1);
  });
});

describe('the local queue (A3)', () => {
  let storage: Storage;
  beforeEach(() => { storage = memoryStorage(); });

  const report = (over: Partial<Report> = {}): Report => ({
    installId: 'i', ts: '2026-09-27T10:00:00.000Z', app: '1.0.0', platform: 'web', route: 'today',
    kind: 'boundary', name: 'TypeError', message: 'boom', frames: [], sig: 'sig1', count: 1, ...over,
  });

  it('caps at 20, dropping the oldest', () => {
    for (let i = 0; i < 25; i++) enqueue(report({ sig: `sig${i}`, ts: `2026-09-27T10:${String(i).padStart(2, '0')}:00.000Z` }), storage);
    const { reports } = loadQueueState(storage);
    expect(reports.length).toBe(MAX_QUEUE);
    expect(reports[0]!.sig).toBe('sig5');
    expect(reports[reports.length - 1]!.sig).toBe('sig24');
  });

  it('the same sig on the same UTC day is folded into one entry with a growing count', () => {
    enqueue(report({ ts: '2026-09-27T01:00:00.000Z' }), storage);
    enqueue(report({ ts: '2026-09-27T23:00:00.000Z' }), storage);
    let { reports } = loadQueueState(storage);
    expect(reports.length).toBe(1);
    expect(reports[0]!.count).toBe(2);

    enqueue(report({ ts: '2026-09-28T00:00:01.000Z' }), storage);
    reports = loadQueueState(storage).reports;
    expect(reports.length).toBe(2);
  });

  it('100,001 enqueues of one signature give count 100,000, the Worker\'s cap (round-2 review)', () => {
    expect(MAX_COUNT).toBe(100_000);
    const mem = new Map<string, string>();
    let cached: string | null = null;
    const fast = { getItem: (k: string) => (k === 'marc.errors.queue' ? cached : mem.get(k) ?? null), setItem: (k: string, v: string) => { if (k === 'marc.errors.queue') cached = v; else mem.set(k, v); }, removeItem: (k: string) => { if (k === 'marc.errors.queue') cached = null; else mem.delete(k); } };
    for (let i = 0; i < 100_001; i++) enqueue(report(), fast);
    expect(loadQueueState(fast).reports[0]!.count).toBe(100_000);
  }, 120_000);

  it('survives a reload (a fresh load from the same storage sees it)', () => {
    enqueue(report(), storage);
    const reloaded = loadQueueState(storage);
    expect(reloaded.reports.length).toBe(1);
  });

  it('removeByIds and clearQueue', () => {
    const s = enqueue(report(), storage);
    removeByIds([s.reports[0]!.id], storage);
    expect(loadQueueState(storage).reports.length).toBe(0);
    enqueue(report(), storage);
    clearQueue(storage);
    expect(loadQueueState(storage).reports.length).toBe(0);
  });
});

describe('the install id', () => {
  it('is generated once and persists; "delete everything" resets it (A6)', () => {
    const storage = memoryStorage();
    const id1 = getInstallId(storage);
    const id2 = getInstallId(storage);
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    resetInstallId(storage);
    expect(getInstallId(storage)).not.toBe(id1);
  });
});

describe('the sender (A4: response handling, fake timers + mocked fetch)', () => {
  let storage: Storage;
  const report = (sig: string, ts: string): Report => ({
    installId: 'i', ts, app: '1.0.0', platform: 'web', route: 'today', kind: 'boundary', name: 'TypeError', message: 'boom', frames: [], sig, count: 1,
  });

  beforeEach(() => { storage = memoryStorage(); vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-27T00:00:00.000Z')); });
  afterEach(() => { vi.useRealTimers(); });

  it('204 removes the sent reports from the queue', async () => {
    enqueue(report('a', '2026-09-27T00:00:00.000Z'), storage);
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    await trySend({ workerBase: 'https://worker.example', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe('https://worker.example/errors');
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.v).toBe(1);
    expect(body.reports[0].sig).toBe('a');
    expect(loadQueueState(storage).reports.length).toBe(0);
  });

  it('400 or 413 drops the batch and never retries the same payload', async () => {
    enqueue(report('a', '2026-09-27T00:00:00.000Z'), storage);
    const fetchImpl = vi.fn().mockResolvedValue({ status: 400 });
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(loadQueueState(storage).reports.length).toBe(0);
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).toHaveBeenCalledTimes(1); // nothing left to send, so no second attempt
  });

  it('429/5xx keeps the queue and backs off, doubling and capped at 6h', async () => {
    enqueue(report('a', '2026-09-27T00:00:00.000Z'), storage);
    const fetchImpl = vi.fn().mockResolvedValue({ status: 500 });
    let now = Date.now();
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now });
    expect(loadQueueState(storage).reports.length).toBe(1);
    let s = loadQueueState(storage);
    expect(s.nextAttemptAt - now).toBe(BASE_BACKOFF_MS);

    // Too soon: no new attempt.
    now += 1000;
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    // Backoff elapsed: retries and doubles the wait.
    now = s.nextAttemptAt;
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    s = loadQueueState(storage);
    expect(s.nextAttemptAt - now).toBe(BASE_BACKOFF_MS * 2);

    // Drive the backoff up until it caps at 6h.
    for (let i = 0; i < 12; i++) {
      now = s.nextAttemptAt;
      await trySend({ workerBase: 'https://w', storage, fetchImpl, now });
      s = loadQueueState(storage);
    }
    expect(s.backoffMs).toBe(MAX_BACKOFF_MS);
  });

  it('a thrown fetch (offline) keeps the queue and backs off the same way', async () => {
    enqueue(report('a', '2026-09-27T00:00:00.000Z'), storage);
    const fetchImpl = vi.fn().mockRejectedValue(new Error('offline'));
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    const s = loadQueueState(storage);
    expect(s.reports.length).toBe(1);
    expect(s.nextAttemptAt - Date.now()).toBe(BASE_BACKOFF_MS);
  });

  it('does nothing when the queue is empty or still inside its backoff window', async () => {
    const fetchImpl = vi.fn();
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).not.toHaveBeenCalled();

    enqueue(report('a', '2026-09-27T00:00:00.000Z'), storage);
    setBackoff(Date.now() + 60_000, BASE_BACKOFF_MS, storage);
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('packs at most ~8KB per request, sending the rest as further requests', async () => {
    for (let i = 0; i < 20; i++) enqueue(report(`sig${i}`, `2026-09-27T00:${String(i).padStart(2, '0')}:00.000Z`), storage);
    // Bloat every queued report's message so 20 of them cannot fit in one 8KB request.
    const s = loadQueueState(storage);
    s.reports.forEach(r => { r.message = 'm'.repeat(700); });
    (storage as unknown as { setItem: (k: string, v: string) => void }).setItem('marc.errors.queue', JSON.stringify(s));
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl.mock.calls.length).toBeGreaterThan(1); // one 8KB request could not hold all 20
    for (const [, init] of fetchImpl.mock.calls) {
      expect(Buffer.byteLength((init as RequestInit).body as string, 'utf8')).toBeLessThanOrEqual(8192);
    }
    expect(loadQueueState(storage).reports.length).toBe(0); // the whole queue drained across those requests
  });
});

describe('the one-time ask (A7)', () => {
  it('shows only after a finished workout, never live, only once, and never on the very boot that just imported it', () => {
    expect(shouldAskErrorReports(undefined, 0, false, true)).toBe(false);
    expect(shouldAskErrorReports(undefined, 1, false, true)).toBe(true);
    expect(shouldAskErrorReports(undefined, 1, true, true)).toBe(false);
    expect(shouldAskErrorReports(true, 1, false, true)).toBe(false);
    expect(shouldAskErrorReports(false, 1, false, true)).toBe(true);
    // A fresh install or a same-session legacy/backup import: wait for the next ordinary open.
    expect(shouldAskErrorReports(undefined, 1, false, false)).toBe(false);
  });
});

describe('consent gating end to end (A2)', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
    // reportError fires a real (fire-and-forget) send attempt; never let that reach the network in a test.
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
  });
  afterEach(() => {
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: undefined } };
    delete (globalThis as { localStorage?: Storage }).localStorage;
    vi.unstubAllGlobals();
  });

  it('off by default: nothing is queued or sent', () => {
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: undefined } };
    reportError('boundary', 'TypeError', 'boom');
    expect(loadQueueState().reports.length).toBe(0);
  });

  it('once consent is on, an error is queued; switching it off clears the queue', () => {
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: true } };
    reportError('boundary', 'TypeError', 'boom');
    expect(loadQueueState().reports.length).toBe(1);
    clearErrorReportQueue();
    expect(loadQueueState().reports.length).toBe(0);
  });

  it('reportCaught extracts name/message/stack from an arbitrary thrown value', () => {
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: true } };
    reportCaught('onerror', new TypeError('bad thing'));
    const [r] = loadQueueState().reports;
    expect(r!.name).toBe('TypeError');
  });

  it('"delete everything" resets the install id and clears the queue (A6)', () => {
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: true } };
    const before = getInstallId();
    reportError('boundary', 'TypeError', 'boom');
    expect(loadQueueState().reports.length).toBe(1);
    resetErrorReporting();
    expect(loadQueueState().reports.length).toBe(0);
    expect(getInstallId()).not.toBe(before);
  });
});

describe('trigger sites produce the right kind (A5)', () => {
  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('no network in tests')));
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: true } };
  });
  afterEach(() => {
    state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: undefined } };
    delete (globalThis as { localStorage?: Storage }).localStorage;
    vi.unstubAllGlobals();
  });

  it('a thrown render error reports kind "boundary"', () => {
    const b = new ErrorBoundary({});
    b.componentDidCatch(new TypeError('render blew up'));
    const [r] = loadQueueState().reports;
    expect(r!.kind).toBe('boundary');
  });

  it('a failed Escobar fetch reports kind "escobar-transport", never the message content', async () => {
    const t = httpTransport({ url: () => 'https://coach.example', device: () => 'd1', fetchImpl: vi.fn().mockRejectedValue(new Error('super secret upstream detail')) });
    const events = [];
    for await (const ev of t.turn({}, new AbortController().signal)) events.push(ev);
    expect(events[0]).toMatchObject({ t: 'error', code: 'network' });
    const [r] = loadQueueState().reports;
    expect(r!.kind).toBe('escobar-transport');
    expect(JSON.stringify(r)).not.toContain('super secret upstream detail');
  });
});

describe('7.5 requirements (D-C75)', () => {
  const report = (sig: string, ts = '2026-09-27T00:00:00.000Z', message = 'boom'): Report => ({
    installId: '6f1c2a4e-1b2c-4d3e-8f00-123456789abc', ts, app: '1.0.0', platform: 'web', route: 'today', kind: 'boundary', name: 'TypeError', message, frames: [], sig, count: 1,
  });

  it('R1 consent is off by default: a fresh state has it unset, and nothing leaves', () => {
    expect(freshState().preferences.errorReports).not.toBe(true);
    state.value = freshState();
    expect(sendingAllowed()).toBe(false);
  });

  it('R4 a batch never holds more than 20 reports or 8 KB (8,192 bytes)', () => {
    const q = Array.from({ length: 25 }, (_, i) => ({ ...report(`s${i}`), id: `q${i}` }));
    expect(packBatch(q)).toHaveLength(MAX_BATCH);
    expect(MAX_BATCH).toBe(20);
    expect(MAX_BODY_BYTES).toBe(8 * 1024);
    const fat = q.map(r => ({ ...r, message: 'm'.repeat(300), frames: Array.from({ length: 15 }, () => ({ file: `https://localhost/assets/${'x'.repeat(180)}.js`, line: 1, col: 1 })) }));
    const b = packBatch(fat);
    expect(b.length).toBeGreaterThan(0);
    expect(Buffer.byteLength(JSON.stringify({ v: 1, reports: b.map(({ id: _id, ...r }) => r) }), 'utf8')).toBeLessThanOrEqual(MAX_BODY_BYTES);
  });

  it('R4 a single report too big for any request is dropped, never sent', async () => {
    const storage = memoryStorage();
    enqueue(report('big'), storage);
    const s = loadQueueState(storage);
    s.reports[0]!.message = 'm'.repeat(9000);
    storage.setItem('marc.errors.queue', JSON.stringify(s));
    enqueue(report('small'), storage);
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const body = JSON.parse((fetchImpl.mock.calls[0]![1] as RequestInit).body as string);
    expect(body.reports.map((r: Report) => r.sig)).toEqual(['small']);
    expect(loadQueueState(storage).reports).toHaveLength(0);
  });

  it('R5 nothing is sent while offline; it waits in the queue', async () => {
    const storage = memoryStorage();
    enqueue(report('a'), storage);
    vi.stubGlobal('navigator', { onLine: false });
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).not.toHaveBeenCalled();
    expect(loadQueueState(storage).reports).toHaveLength(1);
    vi.stubGlobal('navigator', { onLine: true });
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    vi.unstubAllGlobals();
  });

  it('R5 the same signature is sent once a day: after a 204 it stays quiet until the next UTC day', async () => {
    const storage = memoryStorage();
    enqueue(report('a', '2026-09-27T01:00:00.000Z'), storage);
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    await trySend({ workerBase: 'https://w', storage, fetchImpl, now: Date.now() });
    enqueue(report('a', '2026-09-27T20:00:00.000Z'), storage);
    expect(loadQueueState(storage).reports).toHaveLength(0);
    enqueue(report('a', '2026-09-28T00:00:01.000Z'), storage);
    expect(loadQueueState(storage).reports).toHaveLength(1);
  });

  describe('R5/R6 the one door out', () => {
    afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); state.value = freshState(); });

    it('R6 never in a test run, even with consent on', () => {
      state.value = { ...freshState(), preferences: { ...freshState().preferences, errorReports: true } };
      expect(sendingAllowed()).toBe(false);
    });

    it('R6 never under an automated browser (the gate); allowed only with consent in a real app', () => {
      vi.stubEnv('MODE', 'production');
      vi.stubGlobal('navigator', { onLine: true, webdriver: false });
      state.value = { ...freshState(), preferences: { ...freshState().preferences, errorReports: true } };
      expect(sendingAllowed()).toBe(true);
      vi.stubGlobal('navigator', { onLine: true, webdriver: true });
      expect(sendingAllowed()).toBe(false);
      vi.stubGlobal('navigator', { onLine: true, webdriver: false });
      state.value = { ...state.value, preferences: { ...state.value.preferences, errorReports: false } };
      expect(sendingAllowed()).toBe(false);
    });

    it('R6 with consent on in a test run, reporting an error never calls fetch', () => {
      (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
      const fetchSpy = vi.fn().mockResolvedValue({ status: 204 });
      vi.stubGlobal('fetch', fetchSpy);
      state.value = { ...freshState(), preferences: { ...freshState().preferences, errorReports: true } };
      reportError('boundary', 'TypeError', 'boom');
      expect(loadQueueState().reports).toHaveLength(1);
      expect(fetchSpy).not.toHaveBeenCalled();
      delete (globalThis as { localStorage?: Storage }).localStorage;
    });
  });

  it('initErrorReporting twice still reports one save failure once (no second listener)', () => {
    vi.useFakeTimers();
    (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
    state.value = { ...freshState(), preferences: { ...freshState().preferences, errorReports: true } };
    initErrorReporting();
    initErrorReporting();
    saveError.value = 'Could not save.';
    saveError.value = null;
    expect(loadQueueState().reports.find(r => r.kind === 'store-save')?.count).toBe(1);
    state.value = freshState();
    delete (globalThis as { localStorage?: Storage }).localStorage;
    vi.clearAllTimers(); vi.useRealTimers();
  });

  it('R2 a load failure on boot (quarantined or restored from backup) is reported as kind "boot"', () => {
    vi.useFakeTimers();
    (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
    state.value = { ...freshState(), preferences: { ...freshState().preferences, errorReports: true } };
    bootRecovered.value = true;
    initErrorReporting();
    const [r] = loadQueueState().reports;
    expect(r).toMatchObject({ kind: 'boot', name: 'LoadRecovered' });
    bootRecovered.value = false;
    state.value = freshState();
    delete (globalThis as { localStorage?: Storage }).localStorage;
    vi.clearAllTimers(); vi.useRealTimers();
  });
});

describe('R3 privacy: planted personal data never leaves', () => {
  const SECRETS = ['/home/', 'Bulgarian Split Squat', 'Push Day A', 'left knee still tender', 'Alex', 'crushed leg day', 'lateral raise', 'resting HR', '82.4', '62.5', '147', 'lb'];
  const planted = { exercise: 'Bulgarian Split Squat', split: 'Push Day A', note: 'left knee still tender', weight: 62.5, reps: 8, bodyWeight: 82.4, heart: 'resting HR 147', coach: 'You crushed leg day, Alex!', memory: 'Alex hates lateral raise', unit: 'lb' };

  beforeEach(() => {
    (globalThis as { localStorage?: Storage }).localStorage = memoryStorage();
    state.value = { ...freshState(), preferences: { ...freshState().preferences, errorReports: true, weightUnit: 'lb' } };
  });
  afterEach(() => {
    state.value = freshState();
    delete (globalThis as { localStorage?: Storage }).localStorage;
    vi.unstubAllGlobals();
  });

  it('every trigger shape, seeded with personal strings and numbers, sends none of them', async () => {
    // Errors whose messages quote personal data, as a browser or app code would.
    const e1 = new TypeError(`Cannot read properties of undefined (reading '${planted.exercise}') at ${planted.weight}kg x${planted.reps}`);
    e1.stack = `TypeError: x\n    at logSet (https://localhost/assets/index.js:10:5)\n    at ${planted.split} (data:text/javascript,${planted.note}:1:1)`;
    reportCaught('boundary', e1);
    reportCaught('onerror', new Error(`save "${planted.note}" failed for body weight ${planted.bodyWeight}`));
    // Non-Error values thrown or rejected carry arbitrary content: only their type is kept.
    reportCaught('unhandledrejection', `${planted.coach} ${planted.memory}`);
    reportCaught('unhandledrejection', { session: { exercise: planted.exercise, note: planted.note, weight: planted.weight }, heart: planted.heart });
    reportCaught('backup', planted);
    // A custom error whose name is free text.
    const e2 = new Error('x'); e2.name = `${planted.exercise} ${planted.unit}`;
    reportCaught('boot', e2);
    vi.useFakeTimers();
    initErrorReporting();
    saveError.value = `quota exceeded saving ${planted.heart}`;
    saveError.value = null;
    vi.clearAllTimers(); vi.useRealTimers();
    expect(loadQueueState().reports.find(r => r.kind === 'store-save')?.name).toBe('SaveFailed');

    const reports = loadQueueState().reports;
    expect(reports.length).toBeGreaterThanOrEqual(5);
    const fetchImpl = vi.fn().mockResolvedValue({ status: 204 });
    await trySend({ workerBase: 'https://w', fetchImpl, now: Date.now() });
    expect(fetchImpl).toHaveBeenCalled();
    // installId, ts and sig are generated here, never taken from input: a random uuid, the clock
    // and a hash. Each is pinned to its exact shape (which cannot hold a planted word), then left
    // out of the text check, so a random '147' in a uuid can't fail it. Every other byte of every
    // body (message, frames, route, name, app, platform, kind, count, the keys) is checked.
    const wire = fetchImpl.mock.calls.map(c => {
      const body = JSON.parse((c[1] as RequestInit).body as string) as { v: number; reports: Record<string, unknown>[] };
      for (const r of body.reports) {
        expect(r.installId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
        expect(r.ts).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        expect(r.sig).toMatch(/^[0-9a-f]{8}$/);
      }
      return JSON.stringify({ ...body, reports: body.reports.map(({ installId: _i, ts: _t, sig: _s, ...rest }) => rest) });
    }).join('\n');
    expect(wire).toContain('"message"');
    for (const secret of SECRETS) expect(wire, secret).not.toContain(secret);
    expect(wire).not.toContain('data:');
    // Only allowlisted keys on the wire.
    for (const call of fetchImpl.mock.calls) {
      const body = JSON.parse((call[1] as RequestInit).body as string);
      expect(Object.keys(body).sort()).toEqual(['reports', 'v']);
      for (const r of body.reports) for (const k of Object.keys(r)) expect(['installId', 'ts', 'app', 'platform', 'os', 'device', 'route', 'kind', 'name', 'message', 'frames', 'sig', 'count']).toContain(k);
    }
  });

  it('describeError reads only an Error\'s own name, message and stack', () => {
    expect(describeError('Alex: left knee')).toEqual({ name: 'NonError', message: 'non-Error string thrown' });
    expect(describeError({ note: 'x' })).toEqual({ name: 'NonError', message: 'non-Error object thrown' });
    expect(describeError(null)).toEqual({ name: 'NonError', message: 'non-Error null thrown' });
  });
});

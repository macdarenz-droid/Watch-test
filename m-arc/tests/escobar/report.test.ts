// ESC-REPORT (owner, 2026-09-30: "Sure. Go for it. If its required by playstore"): every finished
// coach reply can be reported. R1-R7.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { VNode } from 'preact';
import { state } from '@/core/store';
import { APP_VERSION } from '@/core/version';
import { newConversation, sanitizeStore, trimOldest } from '@/escobar/store';
import { ESCOBAR_PROXY_URL } from '@/escobar/state';
import {
  CONTROL_RE, MAX_TEXT, REASONS, initialState, postReport, reduce, reportBody, reportKey, reportLabelId,
  reportText, reported, submitReport,
} from '@/escobar/report';
import type { ReportEvent, ReportState } from '@/escobar/report';
import { ReportAnswer, ReportControl, ReportView, REPORT_COPY } from '@/escobar/ui/Report';
import { EscobarTurnView, turnsOf } from '@/escobar/ui/Message';
import type { Conversation, ProposalRecord, StoredMessage } from '@/escobar/types';
import { CONTACT_RE, SOURCE_RE, SOURCE_CS_RE, SAFETY_LINE_RE } from '../guards/no-contacts';

type Node = VNode<Record<string, unknown> & { children?: unknown }>;
function walk(node: unknown, visit: (v: Node) => void): void {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const c of node) walk(c, visit); return; }
  const v = node as Node;
  visit(v);
  walk(v.props?.children, visit);
}
const all = (node: unknown, pred: (v: Node) => boolean): Node[] => { const out: Node[] = []; walk(node, v => { if (pred(v)) out.push(v); }); return out; };
function textOf(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf((node as Node).props?.children);
}
const buttons = (n: unknown) => all(n, v => v.type === 'button');

const proposal = (messageIndex: number): ProposalRecord => ({ id: 'p1', kind: 'set_split', input: {}, title: 'Move to 4 days [f3]', preview: [], fingerprint: 'fp', createdAt: '2026-09-30T00:00:00.000Z', expiresOn: '2026-10-07', status: 'awaiting', messageIndex });

/** One Escobar turn with all six parts: answer, preamble, a show caption, a proposal, a revised draft, chips. */
function turnMessages(finalText = 'Final answer ⟦f1⟧ [f7].', chips = ['Chip one', 'Chip two']): StoredMessage[] {
  return [
    { role: 'user', content: [{ type: 'text', text: 'How is my chest press?' }] },
    { role: 'assistant', content: [
      { type: 'tool_use', id: 'tu_show', name: 'show', input: { component: 'lift_trend', caption: 'Chest press trend [f4, f5]', params: {} } },
      { type: 'tool_use', id: 'tu_bad', name: 'show', input: { component: 'lift_trend', caption: 'Hidden caption', params: {} } },
    ], meta: { rendered: { preamble: ['Looking at your lifts [f2].'] } } },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_show', content: '{}' }, { type: 'tool_result', tool_use_id: 'tu_bad', content: 'no', is_error: true }] },
    { role: 'assistant', content: [{ type: 'text', text: 'First draft [f6].' }], meta: { rendered: { revised: true } } },
    { role: 'assistant', content: [{ type: 'text', text: finalText }], meta: { rendered: { chips } } },
  ];
}
function convWith(messages: StoredMessage[], proposalIndex: number | null = 1): Conversation {
  return { ...newConversation('test', 'chat'), messages, proposals: proposalIndex == null ? [] : [proposal(proposalIndex)] };
}
const lastTurn = (c: Conversation) => { const t = turnsOf(c.messages).filter(x => x.kind === 'escobar').at(-1); if (t?.kind !== 'escobar') throw new Error('no turn'); return t.indexes; };
const EXPECTED = 'Final answer.\n\nLooking at your lifts.\n\nChest press trend\n\nMove to 4 days\n\nFirst draft.\n\nChip one\nChip two';

const res = (status: number) => new Response(status === 204 ? null : '{}', { status });
const quiet = { online: () => true, devMode: () => false, automated: () => false };
let n = 0;
const freshKey = () => `c_test:${++n}`;

const saved = state.value;
afterEach(() => { state.value = saved; vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('ESC-REPORT R1: the report text and body', () => {
  it('gives all six parts in the stated order, as shown: no ⟦ markers or [fN] tags (BUG-31), no failed caption', () => {
    const c = convWith(turnMessages());
    const text = reportText(c, lastTurn(c));
    expect(text).toBe(EXPECTED);
    expect(text).not.toContain('⟦');
    expect(text).not.toMatch(/\[\s*f\d/);
    expect(text).not.toContain('Hidden caption');
  });
  it('uses the rendered answer when there is one', () => {
    const m = turnMessages();
    m[4] = { role: 'assistant', content: [{ type: 'text', text: 'raw' }], meta: { rendered: { answer: 'Rendered ⟦f2⟧.' } } };
    const c = convWith(m, null);
    expect(reportText(c, lastTurn(c)).split('\n\n')[0]).toBe('Rendered.');
  });
  it('strips \\u0007, \\r and \\u0085 and keeps \\n and \\t', () => {
    const c = convWith(turnMessages('A\u0007B\rC\u0085D\tE\nF', []), null);
    expect(reportText(c, lastTurn(c)).split('\n\n')[0]).toBe('ABCD\tE\nF');
    expect('\u0000\u0008\u000B\u001F\u007F\u009F'.replace(CONTROL_RE, '')).toBe('');
    expect('\t\n'.replace(CONTROL_RE, '')).toBe('\t\n');
  });
  it('cuts 5000 units to 4000, and drops a surrogate pair split by the cut whole', () => {
    const long = convWith([turnMessages()[0]!, { role: 'assistant', content: [{ type: 'text', text: 'a'.repeat(5000) }], meta: { rendered: {} } }], null);
    expect(reportText(long, lastTurn(long))).toHaveLength(MAX_TEXT);
    const split = convWith([turnMessages()[0]!, { role: 'assistant', content: [{ type: 'text', text: `${'a'.repeat(3999)}😀${'b'.repeat(1000)}` }], meta: { rendered: {} } }], null);
    const t = reportText(split, lastTurn(split));
    expect(t).toHaveLength(3999);
    expect(t).toBe('a'.repeat(3999));
  });
  it('the body is exactly {v, reason, text, app}, with v 1 and the app version, and carries no ids', () => {
    const c = convWith(turnMessages());
    const body = reportBody('harmful', reportText(c, lastTurn(c)));
    expect(Object.keys(body).sort()).toEqual(['app', 'reason', 'text', 'v']);
    expect(body.v).toBe(1);
    expect(body.app).toBe(APP_VERSION);
    expect(body.app).toMatch(/^[0-9A-Za-z.+-]{1,40}$/);
    const json = JSON.stringify(body);
    expect(json).not.toContain('c_');
    expect(json).not.toContain('dev_');
    expect(REASONS).toEqual(['offensive', 'harmful', 'wrong']);
  });
});

describe('ESC-REPORT R2: the transport', () => {
  const body = reportBody('wrong', 'Some reply.');
  it('POSTs to the built-in /reports with only content-type and no credentials', async () => {
    const f = vi.fn(async () => res(204));
    expect(await postReport(body, { fetchImpl: f })).toBe('sent');
    expect(f).toHaveBeenCalledTimes(1);
    const [url, init] = f.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://marc-coach.mmarcdarenz.workers.dev/reports');
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'content-type': 'application/json' });
    expect(init.credentials).toBe('omit');
    expect(Object.keys(JSON.parse(init.body as string)).sort()).toEqual(['app', 'reason', 'text', 'v']);
  });
  it('204 is sent, 429 is limited, and 400, 404, 500, 503 or a throw is failed', async () => {
    expect(await postReport(body, { fetchImpl: async () => res(429) })).toBe('limited');
    for (const s of [400, 404, 500, 503]) expect(await postReport(body, { fetchImpl: async () => res(s) }), String(s)).toBe('failed');
    expect(await postReport(body, { fetchImpl: async () => { throw new TypeError('network'); } })).toBe('failed');
  });
  it('gives up after 15 seconds', async () => {
    vi.useFakeTimers();
    const f = (_u: string | URL | Request, init?: RequestInit) => new Promise<Response>((_, reject) => init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError'))));
    let out: string | null = null;
    void postReport(body, { fetchImpl: f as typeof fetch }).then(r => { out = r; });
    await vi.advanceTimersByTimeAsync(14_999);
    expect(out).toBeNull();
    await vi.advanceTimersByTimeAsync(1);
    expect(out).toBe('failed');
  });
  it('still sends to the built-in server when a custom coach server is set', async () => {
    state.value = { ...state.value, escobar: { ...state.value.escobar, proxyUrl: 'https://my-own-coach.example.com' } };
    const f = vi.fn(async () => res(204));
    expect(await submitReport(freshKey(), body, { ...quiet, fetchImpl: f })).toBe('sent');
    expect(f).toHaveBeenCalledTimes(1);
    expect((f.mock.calls[0] as unknown as [string])[0]).toBe(`${ESCOBAR_PROXY_URL}/reports`);
    expect((f.mock.calls[0] as unknown as [string])[0]).toBe('https://marc-coach.mmarcdarenz.workers.dev/reports');
  });
});

describe('ESC-REPORT R3: the guards', () => {
  const body = reportBody('offensive', 'x');
  it('offline, dev mode and automated each make no fetch and give failed, sent and failed', async () => {
    const f = vi.fn(async () => res(204));
    expect(await submitReport(freshKey(), body, { ...quiet, online: () => false, fetchImpl: f })).toBe('failed');
    expect(await submitReport(freshKey(), body, { ...quiet, devMode: () => true, fetchImpl: f })).toBe('sent');
    expect(await submitReport(freshKey(), body, { ...quiet, automated: () => true, fetchImpl: f })).toBe('failed');
    expect(f).not.toHaveBeenCalled();
  });
  it('offline wins over dev mode', async () => {
    const f = vi.fn(async () => res(204));
    expect(await submitReport(freshKey(), body, { ...quiet, online: () => false, devMode: () => true, fetchImpl: f })).toBe('failed');
    expect(f).not.toHaveBeenCalled();
  });
  it('the real automated() check holds in a test run', async () => {
    const f = vi.fn(async () => res(204));
    expect(await submitReport(freshKey(), body, { online: () => true, devMode: () => false, fetchImpl: f })).toBe('failed');
    expect(f).not.toHaveBeenCalled();
  });
  it('report.ts reads ./session lazily, never with a static import', () => {
    const src = readFileSync('src/escobar/report.ts', 'utf8');
    expect(src).not.toMatch(/^\s*import\b[^;]*?from\s*['"]\.\/session['"]/m);
    expect(src).not.toMatch(/^\s*import\s*['"]\.\/session['"]/m);
    expect(src).toContain("import('./session')");
  });
});

describe('ESC-REPORT R4: nothing is saved', () => {
  let setItem: ReturnType<typeof vi.fn>;
  beforeEach(async () => {
    await import('@/escobar/session');
    setItem = vi.fn();
    const mem = new Map<string, string>([['marc.dev', '1']]);
    vi.stubGlobal('localStorage', { getItem: (k: string) => mem.get(k) ?? null, setItem, removeItem: vi.fn(), clear: vi.fn(), key: () => null, length: mem.size });
  });
  it('a full report (dev mode, then the network path) writes nothing and leaves the stored conversation as it was', async () => {
    const c = convWith(turnMessages());
    const store = { version: 1, activeId: c.id, conversations: [c] };
    const before = sanitizeStore(structuredClone(store));
    const raw = JSON.stringify(c);
    const text = reportText(c, lastTurn(c));
    const key = reportKey(c, text);
    expect(await submitReport(key, reportBody('harmful', text), { online: () => true })).toBe('sent');
    expect(await submitReport(freshKey(), reportBody('wrong', text), { ...quiet, fetchImpl: async () => res(204) })).toBe('sent');
    expect(setItem).not.toHaveBeenCalled();
    expect(sanitizeStore(structuredClone(store))).toEqual(before);
    expect(JSON.stringify(c)).toBe(raw);
    expect(initialState(key)).toBe('sent');
    const other = convWith(turnMessages());
    expect(initialState(reportKey(other, reportText(other, lastTurn(other))))).toBe('idle');
  });
  it('the key survives trimOldest (it follows the text, not the message index)', () => {
    const c = convWith([
      { role: 'user', content: [{ type: 'text', text: 'hi' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'Hello.' }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'text', text: 'more' }] },
      { role: 'assistant', content: [{ type: 'text', text: 'More.' }], meta: { rendered: {} } },
      ...turnMessages(),
    ], 5);
    const t = trimOldest(c);
    if (!t) throw new Error('nothing trimmed');
    const a = lastTurn(c), b = lastTurn(t);
    expect(a).not.toEqual(b);
    expect(reportKey(t, reportText(t, b))).toBe(reportKey(c, reportText(c, a)));
    expect((ReportAnswer({ conv: t, indexes: b }) as Node).key).toBe((ReportAnswer({ conv: c, indexes: a }) as Node).key);
  });
});

describe('ESC-REPORT R5: the UI logic', () => {
  const c = convWith(turnMessages());
  const idx = lastTurn(c);
  const reportAnswers = (n: unknown) => all(n, v => v.type === ReportAnswer);
  it('a finished turn has exactly one Report control and a live one has none, even with a custom coach server', () => {
    for (const proxyUrl of [null, 'https://my-own-coach.example.com']) {
      state.value = { ...state.value, escobar: { ...state.value.escobar, proxyUrl } };
      expect(reportAnswers(EscobarTurnView({ conv: c, indexes: idx })), String(proxyUrl)).toHaveLength(1);
      expect(reportAnswers(EscobarTurnView({ conv: c, indexes: idx, last: true })), String(proxyUrl)).toHaveLength(1);
      expect(reportAnswers(EscobarTurnView({ conv: c, indexes: idx, live: true })), String(proxyUrl)).toHaveLength(0);
      expect((ReportAnswer({ conv: c, indexes: idx }) as Node).type, String(proxyUrl)).toBe(ReportControl);
    }
  });
  it('shows nothing for empty, whitespace-only or control-only text', () => {
    for (const t of ['', '  \n\t ', '\u0007\u0001\u0085']) {
      const e = convWith([turnMessages()[0]!, { role: 'assistant', content: [{ type: 'text', text: t }], meta: { rendered: {} } }], null);
      expect(ReportAnswer({ conv: e, indexes: lastTurn(e) }), JSON.stringify(t)).toBeNull();
    }
  });
  it('the reducer covers every transition', () => {
    const states: ReportState[] = ['idle', 'open', 'sending', 'sent', 'failed', 'limited'];
    const events: [string, ReportEvent][] = [['open', { type: 'open' }], ['cancel', { type: 'cancel' }], ['pick', { type: 'pick' }], ['sent', { type: 'result', result: 'sent' }], ['failed', { type: 'result', result: 'failed' }], ['limited', { type: 'result', result: 'limited' }]];
    const table: Record<ReportState, string[]> = {
      idle: ['open', 'idle', 'idle', 'idle', 'idle', 'idle'],
      open: ['open', 'idle', 'sending', 'open', 'open', 'open'],
      sending: ['sending', 'sending', 'sending', 'sent', 'failed', 'limited'],
      sent: ['sent', 'sent', 'sent', 'sent', 'sent', 'sent'],
      failed: ['failed', 'idle', 'sending', 'failed', 'failed', 'failed'],
      limited: ['limited', 'idle', 'sending', 'limited', 'limited', 'limited'],
    };
    for (const s of states) events.forEach(([name, e], i) => expect(reduce(s, e), `${s} + ${name}`).toBe(table[s][i]));
  });
  it('ReportView draws each state with its labels and aria, and no explaining line (owner copy rule, 2026-10-01)', () => {
    const id = 'esc-report-q-x-1';
    const view = (s: ReportState) => ReportView({ state: s, labelId: id });
    const reportBtn = (n: unknown) => buttons(n).filter(b => b.props.class === 'esc-report-btn small');
    const reasons = (n: unknown) => buttons(n).filter(b => b.props.class === 'chip chip-btn');

    const idle = view('idle');
    expect(reportBtn(idle)).toHaveLength(1);
    expect(reportBtn(idle)[0]!.props).toMatchObject({ type: 'button', 'aria-label': 'Report this reply', 'aria-expanded': 'false' });
    expect(textOf(reportBtn(idle)[0])).toBe('Report');
    expect(all(idle, v => v.props?.role === 'group')).toHaveLength(0);

    for (const s of ['open', 'sending', 'failed', 'limited'] as const) {
      const v = view(s);
      expect(reportBtn(v)[0]!.props['aria-expanded'], s).toBe('true');
      const group = all(v, x => x.props?.role === 'group');
      expect(group, s).toHaveLength(1);
      expect(group[0]!.props['aria-labelledby'], s).toBe(id);
      const q = all(v, x => x.props?.id === id);
      expect(q, s).toHaveLength(1);
      expect(textOf(q[0]), s).toBe('Reason');
      expect(reasons(v).map(textOf), s).toEqual(['Offensive', 'Harmful', 'Wrong']);
      expect(reasons(v).every(b => !!b.props.disabled === (s === 'sending')), s).toBe(true);
      expect(buttons(v).filter(b => textOf(b) === 'Cancel'), s).toHaveLength(1);
      expect(all(v, x => x.type === 'p' && x.props.class === 'hint' && !x.props.role), s).toHaveLength(0);
    }
    expect(textOf(all(view('sending'), x => x.props?.role === 'status'))).toBe('Sending…');
    expect(textOf(all(view('failed'), x => x.props?.role === 'alert'))).toBe('Couldn’t send. Check your connection and try again.');
    expect(textOf(all(view('limited'), x => x.props?.role === 'alert'))).toBe('Too many reports from this network. Try again in an hour.');
    for (const s of ['open', 'failed', 'limited'] as const) expect(all(view(s), x => x.props?.role === 'status'), s).toHaveLength(0);

    const sent = view('sent');
    expect(buttons(sent)).toHaveLength(0);
    const st = all(sent, x => x.props?.role === 'status');
    expect(st).toHaveLength(1);
    expect(st[0]!.props.tabIndex).toBe(-1);
    expect(textOf(st[0])).toBe('Reported. Thank you.');
    expect(all(sent, x => x.props?.role === 'alert')).toHaveLength(0);
    expect(REPORT_COPY.sent).toBe('Reported. Thank you.');
  });
  it('gives each turn of a conversation its own label id', () => {
    const two = convWith([...turnMessages(), ...turnMessages()]);
    const turns = turnsOf(two.messages).filter(t => t.kind === 'escobar');
    expect(turns).toHaveLength(2);
    const ids = turns.map(t => (t.kind === 'escobar' ? reportLabelId(two, t.indexes) : ''));
    expect(ids[0]).not.toBe(ids[1]);
    expect(reportLabelId(c, idx)).not.toBe(reportLabelId(convWith(turnMessages()), idx));
  });
  it('two sends for one key make one fetch; another key is not blocked', async () => {
    let release!: () => void;
    const gate = new Promise<void>(r => { release = r; });
    const f = vi.fn(async () => { await gate; return res(204); });
    const k = freshKey(), other = freshKey();
    const body = reportBody('wrong', 'x');
    const a = submitReport(k, body, { ...quiet, fetchImpl: f });
    const b = submitReport(k, body, { ...quiet, fetchImpl: f });
    const d = submitReport(other, body, { ...quiet, fetchImpl: f });
    await vi.waitFor(() => expect(f).toHaveBeenCalledTimes(2));
    release();
    expect(await b).toBe('busy');
    expect(await a).toBe('sent');
    expect(await d).toBe('sent');
    expect(f).toHaveBeenCalledTimes(2);
    expect(reported.value.has(k)).toBe(true);
  });
});

describe('ESC-REPORT R6: every visible string passes the four LR-23 patterns', () => {
  it('in every ReportView state, including the aria-label', () => {
    const seen = new Set<string>();
    for (const st of ['idle', 'open', 'sending', 'sent', 'failed', 'limited'] as const) {
      walk(ReportView({ state: st, labelId: 'esc-report-q-x-1' }), v => {
        if (typeof v.props?.['aria-label'] === 'string') seen.add(v.props['aria-label'] as string);
        const kids = v.props?.children;
        for (const k of Array.isArray(kids) ? kids : [kids]) if (typeof k === 'string' && k.trim()) seen.add(k);
      });
    }
    for (const s of Object.values(REPORT_COPY)) expect(seen, s).toContain(s);
    expect([...seen].sort()).toEqual([...new Set([...Object.values(REPORT_COPY), 'Offensive', 'Harmful', 'Wrong'])].sort());
    for (const s of seen) expect({ s, contact: CONTACT_RE.test(s), source: SOURCE_RE.test(s), sourceCs: SOURCE_CS_RE.test(s), safetyLine: SAFETY_LINE_RE.test(s) }).toEqual({ s, contact: false, source: false, sourceCs: false, safetyLine: false });
  });
});

describe('ESC-REPORT R7: the owner SQL in the docs is the SQL the Worker tests run', () => {
  it('both blocks under "Content reports" appear byte for byte in escobar-worker/test/reports.test.ts', () => {
    const doc = readFileSync('docs/ERROR-REPORTS.md', 'utf8');
    const section = doc.slice(doc.indexOf('## Content reports'));
    const blocks = [...section.matchAll(/```sql\n([\s\S]*?)\n```/g)].map(m => m[1]!);
    expect(blocks).toHaveLength(2);
    const worker = readFileSync('escobar-worker/test/reports.test.ts', 'utf8');
    for (const [name, sql] of [['OWNER_SQL_LATEST', blocks[0]!], ['OWNER_SQL_BY_REASON', blocks[1]!]] as const) {
      expect(worker, name).toContain(`const ${name} = \`${sql}\`;`);
    }
  });
});

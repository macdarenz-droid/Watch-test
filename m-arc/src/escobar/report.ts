/**
 * ESC-REPORT: report a finished coach reply (Google Play asks that AI output can be reported in
 * the app). A report is exactly {v:1, reason, text, app} and always goes to the built-in server's
 * /reports, whatever coach server is set. Nothing new is saved: "Reported" lives in memory only.
 * No hooks and no JSX here; `./session` is read lazily so this file stays out of its chunk.
 */
import { signal } from '@preact/signals';
import { automated } from '@/errors';
import { APP_VERSION } from '@/core/version';
import { ESCOBAR_PROXY_URL } from './state';
import { parseDirectives } from './verify';
import { fnv } from './hash';
import { stripCitationTags } from './ui/present';
import type { Conversation, StoredMessage } from './types';

export const REASONS = ['offensive', 'harmful', 'wrong'] as const;
export type Reason = typeof REASONS[number];
export const REASON_LABEL: Record<Reason, string> = { offensive: 'Offensive', harmful: 'Harmful', wrong: 'Wrong' };

/** The Worker's REPORT_CONTROL_RE class: every C0/C1 control except \t and \n. */
export const CONTROL_RE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/g;
export const MAX_TEXT = 4000;

export interface ReportBody { v: 1; reason: Reason; text: string; app: string }

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
type Assistant = Extract<StoredMessage, { role: 'assistant' }>;
type ToolUse = { id: string; name: string; input: Record<string, unknown> };
const usesOf = (content: unknown[]): ToolUse[] => content.filter((b): b is ToolUse => isObj(b) && b.type === 'tool_use' && typeof b.id === 'string').map(b => ({ ...b, input: isObj(b.input) ? b.input : {} }));
const textOf = (content: unknown[]) => content.filter((b): b is { type: 'text'; text: string } => isObj(b) && b.type === 'text' && typeof b.text === 'string').map(b => b.text).join('');

/**
 * The reply as the turn shows it (the same parts EscobarTurnView draws): final answer, preamble
 * lines, show captions, proposal titles, revised drafts, then the chips one per line (always,
 * drawn or not, so the text and its key never change).
 */
export function reportText(conv: Conversation, indexes: number[]): string {
  const msgs = conv.messages;
  const failed = new Set<string>(), done = new Set<string>();
  for (const i of indexes) {
    const m = msgs[i];
    if (m?.role !== 'user') continue;
    for (const b of m.content) if (b.type === 'tool_result') (b.is_error ? failed : done).add(b.tool_use_id);
  }
  const assistant = indexes.map(i => msgs[i]).filter((m): m is Assistant => m?.role === 'assistant');
  const answers = assistant.filter(m => !usesOf(m.content).length);
  const final = answers[answers.length - 1];
  const r = final?.meta.rendered;
  // As shown: no ⟦…⟧ marker and no brief-form [fN] tag (BUG-31), in every part but the chips, which show raw.
  const clean = (s: string) => stripCitationTags(parseDirectives(s).plain).trim();
  const chip = (s: string) => parseDirectives(s).plain.trim();
  const parts: string[] = [
    clean(r?.answer ?? (final ? parseDirectives(textOf(final.content)).text : '')),
    ...assistant.filter(m => usesOf(m.content).length).flatMap(m => (m.meta.rendered.preamble ?? []).map(clean)),
    ...assistant.flatMap(m => usesOf(m.content)).filter(u => u.name === 'show' && typeof u.input.component === 'string' && done.has(u.id) && !failed.has(u.id) && typeof u.input.caption === 'string').map(u => clean(u.input.caption as string)),
    ...(conv.proposals ?? []).filter(p => p.messageIndex != null && indexes.includes(p.messageIndex)).map(p => clean(p.title)),
    ...answers.slice(0, -1).filter(m => m.meta.rendered.revised).map(m => clean(textOf(m.content))),
    (r?.chips ?? []).map(chip).filter(Boolean).join('\n'),
  ];
  let text = parts.filter(Boolean).join('\n\n').replace(CONTROL_RE, '').slice(0, MAX_TEXT);
  const last = text.charCodeAt(text.length - 1);
  if (last >= 0xd800 && last <= 0xdbff) text = text.slice(0, -1);
  return text;
}

/** Keyed by the text, not by message indexes, so trimming old messages never changes it. */
export const reportKey = (conv: Conversation, text: string): string => `${conv.id}:${fnv(text)}`;
export const reportLabelId = (conv: Conversation, indexes: number[]): string => `esc-report-q-${conv.id}-${indexes[0]}`;

/** Keys reported in this app run. Memory only: it resets on restart, and the server de-duplicates. */
export const reported = signal<ReadonlySet<string>>(new Set());

export type ReportState = 'idle' | 'open' | 'sending' | 'sent' | 'failed' | 'limited';
export type ReportResult = 'sent' | 'failed' | 'limited';
export type ReportEvent = { type: 'open' } | { type: 'cancel' } | { type: 'pick' } | { type: 'result'; result: ReportResult };

export const initialState = (key: string): ReportState => (reported.value.has(key) ? 'sent' : 'idle');

/** Sent is final. Failed and limited keep the reasons, so picking one again is the retry. */
export function reduce(s: ReportState, e: ReportEvent): ReportState {
  switch (e.type) {
    case 'open': return s === 'idle' ? 'open' : s;
    case 'cancel': return s === 'open' || s === 'failed' || s === 'limited' ? 'idle' : s;
    case 'pick': return s === 'open' || s === 'failed' || s === 'limited' ? 'sending' : s;
    case 'result': return s === 'sending' ? e.result : s;
  }
}

export interface PostDeps { fetchImpl?: typeof fetch; timeoutMs?: number }

/** 204 is sent, 429 is limited; anything else, a throw or the timeout is failed. */
export async function postReport(body: ReportBody, { fetchImpl = fetch, timeoutMs = 15000 }: PostDeps = {}): Promise<ReportResult> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${ESCOBAR_PROXY_URL}/reports`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), credentials: 'omit', signal: ctl.signal });
    return res.status === 204 ? 'sent' : res.status === 429 ? 'limited' : 'failed';
  } catch { return 'failed'; } finally { clearTimeout(timer); }
}

export interface SubmitDeps extends PostDeps {
  online?: () => boolean;
  devMode?: () => boolean | Promise<boolean>;
  automated?: () => boolean;
}

const inFlight = new Set<string>();

/** One send per key at a time ('busy' for a second call). Offline, then dev mode, then automated. */
export async function submitReport(key: string, body: ReportBody, deps: SubmitDeps = {}): Promise<ReportResult | 'busy'> {
  if (inFlight.has(key)) return 'busy';
  inFlight.add(key);
  try {
    const online = deps.online ?? (() => typeof navigator === 'undefined' || navigator.onLine !== false);
    const isDev = deps.devMode ?? (async () => (await import('./session')).devMode());
    let result: ReportResult;
    if (!online()) result = 'failed';
    else if (await isDev()) { await new Promise(r => setTimeout(r, 0)); result = 'sent'; }
    else if ((deps.automated ?? automated)()) result = 'failed';
    else result = await postReport(body, deps);
    if (result === 'sent') reported.value = new Set([...reported.value, key]);
    return result;
  } finally { inFlight.delete(key); }
}

export const reportBody = (reason: Reason, text: string): ReportBody => ({ v: 1, reason, text, app: APP_VERSION });

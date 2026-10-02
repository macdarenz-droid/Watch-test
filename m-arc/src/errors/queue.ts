/** 7.5: the local error-report queue. At most MAX reports, oldest dropped first; the same
 * signature on the same UTC day is folded into one entry with a growing count, and once that
 * entry is sent the signature stays quiet for the rest of that UTC day (sent once a day). */
import type { Report } from './types';

export const MAX_QUEUE = 20;
/** The Worker's `MAX_COUNT` (escobar-worker/src/errorsValidate.ts): a count above it gets a 400,
 * which would drop the whole batch, so a folded count stops here. */
export const MAX_COUNT = 100_000;
export const BASE_BACKOFF_MS = 60_000;
export const MAX_BACKOFF_MS = 6 * 60 * 60_000;

export interface QueuedReport extends Report { id: string }

export interface QueueState {
  reports: QueuedReport[];
  nextAttemptAt: number;
  backoffMs: number;
  /** sig → the UTC day it was last sent. Only today's entries are kept. */
  sent: Record<string, string>;
}

const KEY = 'marc.errors.queue';

function defaultState(): QueueState {
  return { reports: [], nextAttemptAt: 0, backoffMs: BASE_BACKOFF_MS, sent: {} };
}

type Storagelike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function isQueuedReport(v: unknown): v is QueuedReport {
  return !!v && typeof v === 'object' && typeof (v as QueuedReport).id === 'string' && typeof (v as QueuedReport).sig === 'string';
}

export function loadQueueState(storage: Storagelike = localStorage): QueueState {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as Partial<QueueState>;
    const reports = Array.isArray(parsed.reports) ? parsed.reports.filter(isQueuedReport) : [];
    return {
      reports,
      nextAttemptAt: typeof parsed.nextAttemptAt === 'number' ? parsed.nextAttemptAt : 0,
      backoffMs: typeof parsed.backoffMs === 'number' ? parsed.backoffMs : BASE_BACKOFF_MS,
      sent: parsed.sent && typeof parsed.sent === 'object' && !Array.isArray(parsed.sent) ? Object.fromEntries(Object.entries(parsed.sent).filter(([, d]) => typeof d === 'string')) as Record<string, string> : {},
    };
  } catch {
    return defaultState();
  }
}

export function saveQueueState(state: QueueState, storage: Storagelike = localStorage): void {
  try { storage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}

let idSeq = 0;
function nextId(): string { idSeq += 1; return `q${Date.now().toString(36)}${idSeq}`; }

/** Folds a new report into the queue: same sig + same UTC day bumps count instead of adding a row. */
export function enqueue(report: Report, storage: Storagelike = localStorage): QueueState {
  const state = loadQueueState(storage);
  const day = report.ts.slice(0, 10);
  if (state.sent[report.sig] === day) return state;
  const existing = state.reports.find(r => r.sig === report.sig && r.ts.slice(0, 10) === day);
  if (existing) {
    existing.count = Math.min(MAX_COUNT, existing.count + report.count);
  } else {
    state.reports.push({ ...report, id: nextId() });
    if (state.reports.length > MAX_QUEUE) state.reports.splice(0, state.reports.length - MAX_QUEUE);
  }
  saveQueueState(state, storage);
  return state;
}

export function removeByIds(ids: readonly string[], storage: Storagelike = localStorage): QueueState {
  const state = loadQueueState(storage);
  const drop = new Set(ids);
  state.reports = state.reports.filter(r => !drop.has(r.id));
  saveQueueState(state, storage);
  return state;
}

/** A 204 for these: drop them and remember each signature as sent on its day. */
export function markSent(sentReports: readonly QueuedReport[], storage: Storagelike = localStorage): QueueState {
  const state = loadQueueState(storage);
  const drop = new Set(sentReports.map(r => r.id));
  state.reports = state.reports.filter(r => !drop.has(r.id));
  const today = new Date().toISOString().slice(0, 10);
  const sent: Record<string, string> = {};
  for (const [sig, d] of Object.entries(state.sent)) if (d >= today) sent[sig] = d;
  for (const r of sentReports) sent[r.sig] = r.ts.slice(0, 10);
  state.sent = sent;
  saveQueueState(state, storage);
  return state;
}

export function setBackoff(nextAttemptAt: number, backoffMs: number, storage: Storagelike = localStorage): void {
  const state = loadQueueState(storage);
  state.nextAttemptAt = nextAttemptAt;
  state.backoffMs = backoffMs;
  saveQueueState(state, storage);
}

/** Connectivity just changed: worth trying now, whatever backoff a previous failure set. */
export function clearNextAttempt(storage: Storagelike = localStorage): void {
  const state = loadQueueState(storage);
  state.nextAttemptAt = 0;
  saveQueueState(state, storage);
}

export function clearQueue(storage: Storagelike = localStorage): void {
  try { storage.removeItem(KEY); } catch { /* storage unavailable */ }
}

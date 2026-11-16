/**
 * Request validation for POST /errors (docs/ERROR-REPORTS.md "Server"). Two layers:
 * 1. `validateBatch`: strict shape check. An unknown field, a wrong type, or a value over a
 *    documented limit is rejected with 400.
 * 2. `cleanReport`: the allowlist applied again to the values, server-side, so a changed or
 *    hostile client cannot store what the app would never send. It builds a new object from
 *    named fields only (nothing is spread from the request), re-cleans the message the same way
 *    the app does, keeps only app-bundle file paths, and replaces anything else with a neutral value.
 * Body size (8 KB) is checked by the caller before this runs.
 */
export const MAX_ERRORS_BODY_BYTES = 8 * 1024;
export const MIN_REPORTS = 1;
export const MAX_REPORTS = 20;
export const MAX_NAME = 80;
export const MAX_MESSAGE = 300;
export const MAX_FRAMES = 15;
export const MAX_SHORT = 80;
export const MAX_COUNT = 100_000;

export const KINDS = new Set(['boundary', 'onerror', 'unhandledrejection', 'store-save', 'boot', 'backup', 'escobar-transport']);

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/;
const SIG = /^[0-9a-f]{1,64}$/i;

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const only = (o: Record<string, unknown>, keys: string[]): string | null => Object.keys(o).find(k => !keys.includes(k)) ?? null;
const shortStr = (v: unknown): v is string => typeof v === 'string' && v.length <= MAX_SHORT;

export interface Frame { file: string; line: number; col: number }
export interface Report {
  installId: string;
  ts: string;
  app: string;
  platform: 'android' | 'web';
  os?: string;
  device?: string;
  route: string;
  kind: string;
  name: string;
  message: string;
  frames: Frame[];
  sig: string;
  count: number;
}
export interface ErrorBatch { v: 1; reports: Report[] }
export type Validation = { ok: true; body: ErrorBatch } | { ok: false; message: string };

const bad = (message: string): Validation => ({ ok: false, message });
const REPORT_KEYS = ['installId', 'ts', 'app', 'platform', 'os', 'device', 'route', 'kind', 'name', 'message', 'frames', 'sig', 'count'];
const REQUIRED_KEYS = ['installId', 'ts', 'app', 'platform', 'route', 'kind', 'name', 'message', 'frames', 'sig', 'count'];

function frameError(f: unknown, where: string): string | null {
  if (!isObj(f)) return `${where} must be an object`;
  const extra = only(f, ['file', 'line', 'col']);
  if (extra) return `${where}: unknown key ${extra}`;
  if (typeof f.file !== 'string' || f.file.length > 300) return `${where}.file must be a string of at most 300 characters`;
  if (!Number.isInteger(f.line) || (f.line as number) < 0) return `${where}.line must be a non-negative integer`;
  if (!Number.isInteger(f.col) || (f.col as number) < 0) return `${where}.col must be a non-negative integer`;
  return null;
}

function reportError(r: unknown, where: string): string | null {
  if (!isObj(r)) return `${where} must be an object`;
  const extra = only(r, REPORT_KEYS);
  if (extra) return `${where}: unknown key ${extra}`;
  const missing = REQUIRED_KEYS.find(k => !(k in r));
  if (missing) return `${where}: missing ${missing}`;
  if (typeof r.installId !== 'string' || !UUID_V4.test(r.installId)) return `${where}.installId must be a uuid v4`;
  if (typeof r.ts !== 'string' || !ISO_UTC.test(r.ts) || Number.isNaN(Date.parse(r.ts))) return `${where}.ts must be an ISO-8601 UTC timestamp`;
  if (!shortStr(r.app)) return `${where}.app must be a string of at most ${MAX_SHORT} characters`;
  if (r.platform !== 'android' && r.platform !== 'web') return `${where}.platform must be android or web`;
  if (r.os !== undefined && !shortStr(r.os)) return `${where}.os must be a string of at most ${MAX_SHORT} characters`;
  if (r.device !== undefined && !shortStr(r.device)) return `${where}.device must be a string of at most ${MAX_SHORT} characters`;
  if (!shortStr(r.route)) return `${where}.route must be a string of at most ${MAX_SHORT} characters`;
  if (typeof r.kind !== 'string' || !KINDS.has(r.kind)) return `${where}.kind is not a known kind`;
  if (typeof r.name !== 'string' || r.name.length > MAX_NAME) return `${where}.name must be at most ${MAX_NAME} characters`;
  if (typeof r.message !== 'string' || r.message.length > MAX_MESSAGE) return `${where}.message must be at most ${MAX_MESSAGE} characters`;
  if (!Array.isArray(r.frames) || r.frames.length > MAX_FRAMES) return `${where}.frames must be at most ${MAX_FRAMES} frames`;
  for (let i = 0; i < r.frames.length; i++) { const err = frameError(r.frames[i], `${where}.frames[${i}]`); if (err) return err; }
  if (typeof r.sig !== 'string' || !SIG.test(r.sig)) return `${where}.sig must be 1 to 64 hex characters`;
  if (!Number.isInteger(r.count) || (r.count as number) < 1 || (r.count as number) > MAX_COUNT) return `${where}.count must be an integer from 1 to ${MAX_COUNT}`;
  return null;
}

export function validateBatch(raw: unknown): Validation {
  if (!isObj(raw)) return bad('body must be a JSON object');
  const extra = only(raw, ['v', 'reports']);
  if (extra) return bad(`unknown key ${extra}`);
  if (raw.v !== 1) return bad('v must be 1');
  if (!Array.isArray(raw.reports) || raw.reports.length < MIN_REPORTS || raw.reports.length > MAX_REPORTS) return bad(`reports must have between ${MIN_REPORTS} and ${MAX_REPORTS} items`);
  for (let i = 0; i < raw.reports.length; i++) {
    const err = reportError(raw.reports[i], `reports[${i}]`);
    if (err) return bad(err);
  }
  return { ok: true, body: raw as unknown as ErrorBatch };
}

const QUOTE_CLASS: Record<string, string> = { '"': 'd', '\u201C': 'd', '\u201D': 'd', "'": 's', '\u2018': 's', '\u2019': 's', '`': 'b' };
const MARK = '"\u2026"';

/** Message cleaning (docs/ERROR-REPORTS.md): quoted text becomes "…", every digit becomes #, cut
 * to 300 characters. A quote (straight, curly or backtick) runs to the LAST quote of its kind in
 * the message, so nested quotes and apostrophes inside a quote (`"hello "Dave"`, `'O'Brien'`)
 * are covered; an opening quote with no closing one removes the rest of the message. An existing
 * "…" is kept as is, so cleaning twice changes nothing. */
export function scrubMessage(raw: string): string {
  let out = '';
  let i = 0;
  while (i < raw.length) {
    if (raw.startsWith(MARK, i)) { out += MARK; i += MARK.length; continue; }
    const c = raw[i]!;
    const cls = QUOTE_CLASS[c];
    if (!cls) { out += c; i++; continue; }
    let end = -1;
    for (let j = raw.length - 1; j > i; j--) if (QUOTE_CLASS[raw[j]!] === cls) { end = j; break; }
    out += MARK;
    if (end < 0) break;
    i = end + 1;
  }
  return out.replace(/\d/g, '#').slice(0, MAX_MESSAGE);
}

const ROUTE = /^[a-z][a-z0-9-]{0,39}$/;
/** Same rule as the app's `cleanName` (PR #35): a code identifier such as TypeError or SaveFailed. */
const ERROR_NAME = /^[A-Za-z_$][\w$.-]{0,79}$/;
const VERSION = /^[0-9A-Za-z.+-]{1,40}$/;
const LABEL = /^[\w .,()+-]{1,60}$/;
/** The app's built files only (`vite build` into www/): `assets/<Name>-<8-character hash>.js`, and
 * the service worker `sw.js`. A path with any other shape (a folder, a name with extra words or
 * digits outside the hash) could carry personal text, so it is never stored. */
const BUNDLE_PATH = /^\/(assets\/[A-Za-z][A-Za-z0-9_]*-[A-Za-z0-9_-]{8}\.js|sw\.js)$/;

/** A frame's file as an app-bundle path (web or app scheme and host, query and hash removed), or
 * null to drop the frame. Any other scheme (file:, blob:, data:, an extension) keeps its ':' and fails the test. */
export function bundlePath(file: string): string | null {
  const path = file.replace(/^(https?|capacitor):\/\/[^/]*/i, '').replace(/[?#].*$/, '');
  const rooted = path.startsWith('/') ? path : `/${path}`;
  return BUNDLE_PATH.test(rooted) ? rooted : null;
}

/** The report the Worker stores: allowlisted fields only, each value cleaned again. */
export function cleanReport(r: Report): Report {
  const frames: Frame[] = [];
  for (const f of r.frames) {
    const file = bundlePath(f.file);
    if (file) frames.push({ file, line: f.line, col: f.col });
  }
  const out: Report = {
    installId: r.installId.toLowerCase(),
    ts: r.ts,
    app: VERSION.test(r.app) ? r.app : 'unknown',
    platform: r.platform,
    route: ROUTE.test(r.route) ? r.route : 'unknown',
    kind: r.kind,
    name: ERROR_NAME.test(r.name) ? r.name : 'Error',
    message: scrubMessage(r.message),
    frames,
    sig: r.sig.toLowerCase(),
    count: r.count,
  };
  if (r.os !== undefined && LABEL.test(r.os)) out.os = r.os;
  if (r.device !== undefined && LABEL.test(r.device)) out.device = r.device;
  return out;
}

/**
 * POST /reports (ESC-REPORT-W): one coach reply the user reported. Strict shape, like `validateBatch`.
 * The text is kept as sent (digits too, no `scrubMessage`), so the owner sees the reply that was flagged.
 * Body size (24 KB) is checked by the caller before this runs.
 */
export const MAX_REPORT_BODY_BYTES = 24_576;
export const MAX_REPORT_TEXT = 4000;
export const REPORT_REASONS = new Set(['offensive', 'harmful', 'wrong']);
/** Control characters, the same class the app strips; `\t` and `\n` are allowed. */
export const REPORT_CONTROL_RE = /[\u0000-\u0008\u000B-\u001F\u007F-\u009F]/;

export interface ContentReport { reason: string; text: string; app: string }
export type ReportValidation = { ok: true; body: ContentReport } | { ok: false; message: string };

export function validateContentReport(raw: unknown): ReportValidation {
  const no = (message: string): ReportValidation => ({ ok: false, message });
  if (!isObj(raw)) return no('body must be a JSON object');
  const keys = ['v', 'reason', 'text', 'app'];
  const extra = only(raw, keys);
  if (extra) return no(`unknown key ${extra}`);
  const missing = keys.find(k => !(k in raw));
  if (missing) return no(`missing key ${missing}`);
  if (raw.v !== 1) return no('v must be 1');
  if (typeof raw.reason !== 'string' || !REPORT_REASONS.has(raw.reason)) return no('reason must be offensive, harmful or wrong');
  const text = raw.text;
  if (typeof text !== 'string' || !text.trim()) return no('text must be a non-empty string');
  if (text.length > MAX_REPORT_TEXT) return no(`text over ${MAX_REPORT_TEXT} characters`);
  if (REPORT_CONTROL_RE.test(text)) return no('text has a control character');
  if (typeof raw.app !== 'string' || !VERSION.test(raw.app)) return no('app must be a version');
  return { ok: true, body: { reason: raw.reason, text, app: raw.app } };
}

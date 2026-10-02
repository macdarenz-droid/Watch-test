/**
 * 7.5: turns an arbitrary thrown error into the allowlisted, scrubbed Report shape.
 * Privacy is the point: nothing here copies a field it wasn't told to build, and the message
 * cleaning is mechanical (digits, quoted strings), not a guess at what looks personal.
 */
import type { Frame, Report, ReportKind } from './types';

const MAX_MESSAGE_LEN = 300;
const MAX_FRAMES = 15;
const MAX_NAME_LEN = 80;

const QUOTE_CLASS: Record<string, string> = { '"': 'd', '\u201C': 'd', '\u201D': 'd', "'": 's', '\u2018': 's', '\u2019': 's', '`': 'b' };
const MARK = '"\u2026"';

/** The same rule as the Worker's `scrubMessage` (escobar-worker/src/errorsValidate.ts, PR #34):
 * quoted text becomes "\u2026", every digit becomes #, cut to 300 characters. A quote (straight, curly
 * or backtick) runs to the LAST quote of its kind in the message, so nested quotes and
 * apostrophes inside a quote (`"hello "Dave"`, `'O'Brien'`) are covered; an opening quote with no
 * closing one removes the rest of the message. An existing "\u2026" is kept, so cleaning twice
 * changes nothing. */
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
  return out.replace(/\d/g, '#').slice(0, MAX_MESSAGE_LEN);
}

/** The app's built files only, the Worker's `BUNDLE_PATH` rule: `/assets/<Name>-<8-char hash>.js`
 * or `/sw.js`. Any other path (a folder, extra words or digits) could carry personal text. */
const BUNDLE_PATH = /^\/(assets\/[A-Za-z][A-Za-z0-9_]*-[A-Za-z0-9_-]{8}\.js|sw\.js)$/;

/** A frame's file as a bundle path (`/assets/index-AbCd1234.js`), or null to drop the frame. It
 * must come from this page's own origin: another host, an extension, data:, blob: or a bare path
 * never goes. Query and hash are removed. */
export function bundleFile(file: string, origin: string): string | null {
  if (!file || !origin || !file.startsWith(`${origin}/`)) return null;
  const path = file.slice(origin.length).replace(/[?#].*$/, '');
  return BUNDLE_PATH.test(path) ? path : null;
}

export function isAppFrame(file: string, origin: string): boolean {
  return bundleFile(file, origin) !== null;
}

/** A real frame line only: V8's "    at …" or Firefox/Safari's "fn@url". The message line(s) at
 * the top of a V8 stack are never parsed, whatever they contain. */
const V8_FRAME = /^\s*at\s+(?:.*?\()?(\S+?):(\d+):(\d+)\)?\s*$/;
const GECKO_FRAME = /^[^\s@]*@(\S+?):(\d+):(\d+)\s*$/;

/** Parses Error.stack into frames, app-bundle only, at most MAX_FRAMES. */
export function framesFromStack(stack: string | undefined, origin = safeOrigin()): Frame[] {
  if (!stack) return [];
  const frames: Frame[] = [];
  for (const line of stack.split('\n')) {
    const m = V8_FRAME.exec(line) ?? GECKO_FRAME.exec(line);
    if (!m) continue;
    const file = bundleFile(m[1] ?? '', origin);
    if (!file) continue;
    frames.push({ file, line: Number(m[2]), col: Number(m[3]) });
    if (frames.length >= MAX_FRAMES) break;
  }
  return frames;
}

function safeOrigin(): string {
  try { return typeof location !== 'undefined' ? location.origin : ''; } catch { return ''; }
}

/** The Worker's `ERROR_NAME` rule: an error name is code (TypeError, QuotaExceededError,
 * SaveFailed), never free text; anything else becomes 'Error'. The app's own names carry no '-'
 * so they pass either side's rule unchanged. */
const ERROR_NAME = new RegExp(`^[A-Za-z_$][\\w$.-]{0,${MAX_NAME_LEN - 1}}$`);
export function cleanName(raw: string): string {
  return ERROR_NAME.test(raw) ? raw : 'Error';
}

/** A short, stable, non-cryptographic hash — good enough to dedupe by, not to authenticate. */
function hash32(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function signatureOf(kind: ReportKind, name: string, frames: Frame[]): string {
  const top = frames.slice(0, 3).map(f => `${f.file}:${f.line}`).join(',');
  return hash32(`${kind}|${name}|${top}`);
}

export interface BuildReportInput {
  installId: string;
  app: string;
  platform: 'android' | 'web';
  route: string;
  kind: ReportKind;
  name: string;
  rawMessage: string;
  stack?: string;
  os?: string;
  device?: string;
  now?: Date;
}

/** Builds a Report from an explicit allowlist of inputs only — an arbitrary Error or event object
 * is never spread into it, so an unknown field can't reach the wire. */
export function buildReport(input: BuildReportInput): Report {
  const frames = framesFromStack(input.stack);
  const name = cleanName(input.name);
  const message = scrubMessage(input.rawMessage);
  return {
    installId: input.installId,
    ts: (input.now ?? new Date()).toISOString(),
    app: input.app,
    platform: input.platform,
    ...(input.os ? { os: input.os } : {}),
    ...(input.device ? { device: input.device } : {}),
    route: input.route,
    kind: input.kind,
    name,
    message,
    frames,
    sig: signatureOf(input.kind, name, frames),
    count: 1,
  };
}

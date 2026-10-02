/**
 * Request validation for POST /v2/turn (§12.2). Strict at the top level and inside
 * user-authored blocks; assistant blocks are checked by type only and passed through
 * byte-for-byte, because SDK output carries extra fields (thinking signatures, citations).
 */
import generated from './tools.generated.json';
import { MODES, type Mode } from './prompt/modes';

export const MAX_BODY_BYTES = 3_000_000;
export const MAX_TEXT_BYTES = 400_000;
export const MAX_MANIFEST_BYTES = 40_000;
export const MAX_MESSAGES = 600;
export const MAX_IMAGES = 2;
export const MAX_IMAGE_BYTES = 1_200_000;
/** Twice the app's largest brief would still fit many times over: BRIEF_CAP is 3000 characters (PL-06). */
export const MAX_SYSTEM_BYTES = 48_000;
export const MAX_STEPS = 15;
export const REPAIR_MARKER = '[app] verification check';
const TOP_KEYS = ['protocol', 'mode', 'appVersion', 'manifest', 'messages', 'unit', 'tone'];
const BLOCKED_KEYS = ['profile', 'name', 'email', 'sessions'];
const ASSISTANT_TYPES = new Set(['text', 'tool_use', 'thinking', 'redacted_thinking', 'fallback']);
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
export const TOOL_NAMES = new Set((generated.tools as Array<{ name: string }>).map(t => t.name));

export interface TurnBody {
  protocol: 2;
  mode: Mode;
  appVersion: string;
  manifest: { hash: string; body: Record<string, unknown> };
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: unknown }>;
  unit: 'kg' | 'lb';
  tone: 'warm' | 'direct';
}

export type Validation = { ok: true; body: TurnBody } | { ok: false; code: 'invalid' | 'too_many_steps'; message: string };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const only = (o: Record<string, unknown>, keys: string[]): string | null => Object.keys(o).find(k => !keys.includes(k)) ?? null;
const bad = (message: string): Validation => ({ ok: false, code: 'invalid', message });

function userBlock(b: unknown, where: string, seenToolUses: Set<string>, counters: { images: number; imageBytes: number }): string | null {
  if (!isObj(b)) return `${where} must be an object`;
  switch (b.type) {
    case 'text': {
      const extra = only(b, ['type', 'text']);
      if (extra) return `${where}: unknown key ${extra}`;
      return typeof b.text === 'string' ? null : `${where}.text must be a string`;
    }
    case 'image': {
      const extra = only(b, ['type', 'source']);
      if (extra) return `${where}: unknown key ${extra}`;
      const s = b.source;
      if (!isObj(s) || s.type !== 'base64' || typeof s.data !== 'string' || !IMAGE_TYPES.has(String(s.media_type))) return `${where}: images must be base64 jpeg, png or webp`;
      if (only(s, ['type', 'media_type', 'data'])) return `${where}.source: unknown key`;
      if (s.data.length > MAX_IMAGE_BYTES) return `${where}: image over 1.2 MB`;
      counters.images++;
      counters.imageBytes += s.data.length;
      return null;
    }
    case 'tool_result': {
      const extra = only(b, ['type', 'tool_use_id', 'content', 'is_error']);
      if (extra) return `${where}: unknown key ${extra}`;
      if (typeof b.tool_use_id !== 'string' || !seenToolUses.has(b.tool_use_id)) return `${where}: tool_result for an unknown tool_use_id`;
      if (b.is_error !== undefined && typeof b.is_error !== 'boolean') return `${where}.is_error must be boolean`;
      const c = b.content;
      const okContent = typeof c === 'string' || (Array.isArray(c) && c.every(x => isObj(x) && x.type === 'text' && typeof x.text === 'string' && !only(x, ['type', 'text'])));
      return okContent ? null : `${where}.content must be text`;
    }
    default:
      return `${where}: block type ${String(b.type)} is not allowed from the app`;
  }
}

/** Assistant messages since the last genuine user message (not tool results, not a repair). */
export function stepsSinceUser(messages: TurnBody['messages']): number {
  let steps = 0;
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]!;
    if (m.role === 'assistant') { steps++; continue; }
    if (m.role !== 'user') continue;
    const blocks = Array.isArray(m.content) ? m.content : [{ type: 'text', text: m.content }];
    const isToolResult = blocks.some(b => isObj(b) && b.type === 'tool_result');
    const isRepair = blocks.some(b => isObj(b) && b.type === 'text' && typeof b.text === 'string' && b.text.startsWith(REPAIR_MARKER));
    if (!isToolResult && !isRepair) break;
  }
  return steps;
}

export function validateTurn(raw: unknown, rawBytes: number): Validation {
  if (rawBytes > MAX_BODY_BYTES) return bad('body over 3 MB');
  if (!isObj(raw)) return bad('body must be a JSON object');
  const blocked = BLOCKED_KEYS.find(k => k in raw);
  if (blocked) return bad(`${blocked} is not accepted here`);
  const extra = only(raw, TOP_KEYS);
  if (extra) return bad(`unknown key ${extra}`);
  if (raw.protocol !== 2) return bad('protocol must be 2');
  if (!MODES.includes(raw.mode as Mode)) return bad('unknown mode');
  if (typeof raw.appVersion !== 'string' || raw.appVersion.length > 32) return bad('appVersion must be a short string');
  if (raw.unit !== 'kg' && raw.unit !== 'lb') return bad('unit must be kg or lb');
  if (raw.tone !== 'warm' && raw.tone !== 'direct') return bad('tone must be warm or direct');
  const m = raw.manifest;
  if (!isObj(m) || typeof m.hash !== 'string' || !isObj(m.body) || only(m, ['hash', 'body'])) return bad('manifest must be {hash, body}');
  if (JSON.stringify(m.body).length > MAX_MANIFEST_BYTES) return bad('manifest over 40 KB');
  if (!Array.isArray(raw.messages) || !raw.messages.length) return bad('messages must be a non-empty list');
  if (raw.messages.length > MAX_MESSAGES) return bad(`at most ${MAX_MESSAGES} messages`);

  const seenToolUses = new Set<string>();
  const counters = { images: 0, imageBytes: 0 };
  const messages = raw.messages as unknown[];
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const where = `messages[${i}]`;
    if (!isObj(msg)) return bad(`${where} must be an object`);
    if (i === 0 && msg.role !== 'user') return bad('the first message must be from the user');
    if (msg.role === 'user') {
      const x = only(msg, ['role', 'content']);
      if (x) return bad(`${where}: unknown key ${x}`);
      if (typeof msg.content === 'string') continue;
      if (!Array.isArray(msg.content) || !msg.content.length) return bad(`${where}.content must be text or blocks`);
      for (let j = 0; j < msg.content.length; j++) {
        const err = userBlock(msg.content[j], `${where}.content[${j}]`, seenToolUses, counters);
        if (err) return bad(err);
      }
    } else if (msg.role === 'assistant') {
      if (only(msg, ['role', 'content'])) return bad(`${where}: unknown key`);
      if (!Array.isArray(msg.content)) return bad(`${where}.content must be blocks`);
      for (const b of msg.content) {
        if (!isObj(b) || !ASSISTANT_TYPES.has(String(b.type))) return bad(`${where}: assistant block type ${isObj(b) ? String(b.type) : '?'} is not allowed`);
        if (b.type === 'tool_use') {
          if (typeof b.id !== 'string' || !TOOL_NAMES.has(String(b.name))) return bad(`${where}: unknown tool ${String(b.name)}`);
          seenToolUses.add(b.id);
        }
      }
    } else if (msg.role === 'system') {
      if ('output_config' in msg) return bad('effort-only system messages are not accepted');
      if (only(msg, ['role', 'content'])) return bad(`${where}: unknown key`);
      if (i === 0) return bad('a system message cannot come first');
      if (typeof msg.content !== 'string') return bad(`${where}: system content must be text`);
      if (new TextEncoder().encode(msg.content).byteLength > MAX_SYSTEM_BYTES) return bad(`${where}: system text over 48 KB`);
      const prev = messages[i - 1];
      if (!isObj(prev) || prev.role !== 'user') return bad(`${where}: a system message must follow a user message`);
      const next = messages[i + 1];
      if (next !== undefined && (!isObj(next) || next.role !== 'assistant')) return bad(`${where}: a system message must be last or followed by an assistant message`);
    } else {
      return bad(`${where}: unknown role`);
    }
  }
  if (counters.images > MAX_IMAGES) return bad(`at most ${MAX_IMAGES} images per request`);
  if (rawBytes - counters.imageBytes > MAX_TEXT_BYTES) return bad('text over 400 KB');
  const body = raw as unknown as TurnBody;
  if (stepsSinceUser(body.messages) >= MAX_STEPS) return { ok: false, code: 'too_many_steps', message: `more than ${MAX_STEPS - 1} steps since the last message` };
  return { ok: true, body };
}

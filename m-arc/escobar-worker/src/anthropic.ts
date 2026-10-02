/**
 * One model step (§12.3): assemble the request (cached policy + manifest + tools, the
 * conversation, per-mode effort and output format), stream it, relay events, and return
 * the final assistant content verbatim (after fallback pruning).
 */
import Anthropic from '@anthropic-ai/sdk';
import type { MessageCreateParamsStreaming, BetaMessageParam, BetaRawMessageStreamEvent, BetaMessage } from '@anthropic-ai/sdk/resources/beta/messages/messages';
import generated from './tools.generated.json';
import { WORKER_POLICY } from './prompt/policy';
import { renderManifest } from './prompt/manifest';
import { MODES, type Mode } from './prompt/modes';
import type { TurnBody } from './validate';
import type { QuotaCounter } from './quotaDO';
import type { UpstreamRelay } from './upstreamRelay';

export interface RateLimiter { limit(opts: { key: string }): Promise<{ success: boolean }> }

export interface Env {
  ANTHROPIC_API_KEY?: string;
  MODEL?: string;
  /** F7 (D12): per-mode model overrides; each falls back to MODEL. */
  MODEL_CHAT?: string; MODEL_PLAN?: string; MODEL_LIVE?: string; MODEL_BRIEF?: string; MODEL_MOMENT?: string; MODEL_SUMMARIZE?: string;
  EFFORT_CHAT?: string; EFFORT_PLAN?: string; EFFORT_LIVE?: string; EFFORT_BRIEF?: string; EFFORT_MOMENT?: string; EFFORT_SUMMARIZE?: string;
  ALLOWED_ORIGINS?: string;
  MAX_TURNS_PER_DEVICE?: string; MAX_STEPS_PER_DEVICE?: string; MAX_OUTPUT_PER_DEVICE?: string; MAX_STEPS_TOTAL?: string;
  MAX_TURNS_PER_IP?: string; MAX_STEPS_PER_IP?: string; MAX_OUTPUT_TOTAL?: string;
  QUOTA_DO?: DurableObjectNamespace<QuotaCounter>;
  /** Makes every Anthropic call from a US location (PL-20). Without it the call leaves from the edge. */
  UPSTREAM?: DurableObjectNamespace<UpstreamRelay>;
  QUOTA?: KVNamespace;
  RATE?: RateLimiter;
  RATE_IP?: RateLimiter;
  /** Anonymous error reports (docs/ERROR-REPORTS.md): D1 storage and rate counters (src/errorsStore.ts). */
  ERRORS_DB?: D1Database;
  /** Secret: the bearer token for GET /errors/summary and the key of the IP hash; the owner sets it before deploy. */
  ERRORS_SUMMARY_TOKEN?: string;
}

export const DEFAULT_MODEL = 'claude-opus-5';
type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';
const EFFORTS: Effort[] = ['low', 'medium', 'high', 'xhigh', 'max'];

export const MODE_CONFIG: Record<Mode, { maxTokens: number; effort: Effort; conversational: boolean }> = {
  chat: { maxTokens: 16000, effort: 'medium', conversational: true },
  plan: { maxTokens: 32000, effort: 'high', conversational: true },
  live: { maxTokens: 4000, effort: 'low', conversational: true },
  brief: { maxTokens: 3000, effort: 'low', conversational: false },
  moment: { maxTokens: 3000, effort: 'low', conversational: false },
  summarize: { maxTokens: 4000, effort: 'low', conversational: false },
};

const ENV_EFFORT: Record<Mode, keyof Env> = { chat: 'EFFORT_CHAT', plan: 'EFFORT_PLAN', live: 'EFFORT_LIVE', brief: 'EFFORT_BRIEF', moment: 'EFFORT_MOMENT', summarize: 'EFFORT_SUMMARIZE' };
export function effortFor(mode: Mode, env: Env): Effort {
  const v = env[ENV_EFFORT[mode]];
  return typeof v === 'string' && (EFFORTS as string[]).includes(v) ? (v as Effort) : MODE_CONFIG[mode].effort;
}

type ApiTool = { name: string; description: string; input_schema: Record<string, unknown>; strict?: boolean };
export const TOOLS = generated.tools as ApiTool[];
const READ_TOOL_NAMES = new Set(['get_overview', 'get_sessions', 'get_session', 'get_exercise_history', 'get_next_target', 'get_recovery', 'get_readiness', 'get_volume', 'get_records', 'get_insights', 'get_plan', 'get_body', 'get_health', 'get_heart_session', 'get_live_session', 'search_exercises', 'get_exercise', 'get_equipment', 'find_in_app', 'explain_method', 'lookup_knowledge', 'calculate', 'evaluate_plan']);
export const READ_TOOLS = TOOLS.filter(t => READ_TOOL_NAMES.has(t.name));

/** Structured outputs for the one-shot modes (§17.3, §18). No length keywords: the app checks lengths. */
const obj = (properties: Record<string, unknown>, required: string[]) => ({ type: 'object', properties, required, additionalProperties: false });
export const FORMATS: Partial<Record<Mode, Record<string, unknown>>> = {
  brief: obj({ headline: { type: 'string', description: 'At most 90 characters.' }, priorities: { type: 'array', description: 'Up to 3.', items: obj({ insightId: { type: 'string' }, line: { type: 'string', description: 'At most 140 characters.' } }, ['insightId', 'line']) } }, ['headline', 'priorities']),
  moment: obj({ line: { type: 'string', description: 'At most 140 characters.' }, chips: { type: 'array', description: 'Up to 2.', items: { type: 'string' } } }, ['line', 'chips']),
  summarize: obj({ title: { type: 'string', description: 'At most 40 characters.' }, episode: { type: 'string', description: 'At most 200 characters.' }, facts: { type: 'array', description: 'Up to 3.', items: obj({ kind: { type: 'string', enum: ['fact', 'injury', 'equipment', 'preference', 'goal', 'agreement'] }, text: { type: 'string' } }, ['kind', 'text']) } }, ['title', 'episode', 'facts']),
};

/** Models known to accept mid-conversation `role: "system"` messages; others get the <situation> conversion. */
const SYSTEM_MESSAGE_MODELS = new Set(['claude-opus-5', 'claude-opus-5-5', 'claude-opus-4-8', 'claude-fable-5', 'claude-fable-5-1', 'claude-mythos-5', 'claude-mythos-5-1']);
/** Learned at runtime from a 400: models that rejected system messages (per Worker instance). */
export const noSystemRole = new Set<string>();
export const supportsSystemMessages = (model: string): boolean => !noSystemRole.has(model) && SYSTEM_MESSAGE_MODELS.has(model);
/** Models whose thinking blocks are bound to the conversation prefix (§12.3). */
const PRESERVED_THINKING = new Set(['claude-opus-5-5', 'claude-fable-5-1', 'claude-mythos-5-1']);

/**
 * For models without mid-conversation system messages: fold each system message into a
 * <situation> text block on the preceding user message.
 */
export function foldSystemMessages(messages: TurnBody['messages']): TurnBody['messages'] {
  const out: TurnBody['messages'] = [];
  for (const m of messages) {
    if (m.role !== 'system') { out.push(m); continue; }
    const prev = out[out.length - 1];
    if (!prev || prev.role !== 'user') continue;
    const blocks = typeof prev.content === 'string' ? [{ type: 'text', text: prev.content }] : [...(prev.content as unknown[])];
    blocks.push({ type: 'text', text: `<situation>\n${m.content as string}\n</situation>` });
    out[out.length - 1] = { ...prev, content: blocks };
  }
  return out;
}

/**
 * QA2-F7-3: the models a mode may be switched to. Each takes the request buildParams sends (adaptive
 * thinking and output_config.effort from low to max). Anything else, a typo or a model such as Haiku
 * 4.5 that rejects adaptive thinking, would fail every turn in that mode, so it is ignored. These ids
 * have no dated snapshots, so an id with a date suffix is ignored like any other unknown id.
 */
const MODE_MODELS = new Set(['claude-opus-5-5', 'claude-opus-5', 'claude-opus-4-8', 'claude-opus-4-7', 'claude-sonnet-5', 'claude-fable-5-1', 'claude-fable-5', 'claude-mythos-5-1', 'claude-mythos-5']);
const overrideFor = (mode: TurnBody['mode'], env: Env): string | undefined => {
  const v = (env as Record<string, unknown>)[`MODEL_${mode.toUpperCase()}`];
  return typeof v === 'string' && v.trim() ? v.trim() : undefined;
};
const usableOverride = (v: string): boolean => MODE_MODELS.has(v);
/** F7: the model for one mode: MODEL_<MODE> when set to a model the Worker can drive, else MODEL, else the default. */
export function modelFor(mode: TurnBody['mode'], env: Env): string {
  const v = overrideFor(mode, env);
  if (v && usableOverride(v)) return v;
  return env.MODEL || DEFAULT_MODEL;
}
/** QA2-F7-3: the modes whose MODEL_<MODE> is set but ignored, for /health and the deploy check. */
export function ignoredModelOverrides(env: Env): Mode[] {
  return MODES.filter(m => { const v = overrideFor(m, env); return !!v && !usableOverride(v); });
}

export function buildParams(body: TurnBody, env: Env, opts: { foldSystem?: boolean } = {}): MessageCreateParamsStreaming {
  const model = modelFor(body.mode, env);
  const cfg = MODE_CONFIG[body.mode];
  const fold = opts.foldSystem ?? !supportsSystemMessages(model);
  const messages = (fold ? foldSystemMessages(body.messages) : body.messages) as BetaMessageParam[];
  const tools = body.mode === 'brief' ? READ_TOOLS : cfg.conversational ? TOOLS : null;
  const format = FORMATS[body.mode];
  const betas = ['server-side-fallback-2026-07-01'];
  const preserved = PRESERVED_THINKING.has(model);
  if (preserved) betas.push('thinking-binding-controls-2026-08-01');
  const params = {
    model,
    max_tokens: cfg.maxTokens,
    stream: true,
    thinking: preserved ? { type: 'adaptive', block_binding: { prefix_mismatch_behavior: 'drop_block' } } : { type: 'adaptive' },
    output_config: { effort: effortFor(body.mode, env), ...(format ? { format: { type: 'json_schema', schema: format } } : {}) },
    system: [
      { type: 'text', text: WORKER_POLICY },
      { type: 'text', text: renderManifest(body.manifest), ...(cfg.conversational ? { cache_control: { type: 'ephemeral', ttl: '1h' } } : {}) },
    ],
    ...(tools ? { tools } : {}),
    messages,
    cache_control: { type: 'ephemeral' },
    betas,
    fallbacks: 'default',
  };
  return params as unknown as MessageCreateParamsStreaming;
}

/**
 * Before relaying `final`: a fallback adds a `fallback` block at each switch point. Drop every
 * thinking, redacted_thinking and tool_use block before the last fallback block (they belong to
 * the model that declined), keep the fallback block itself (§12.3).
 */
export function pruneFallback(content: unknown[]): unknown[] {
  let last = -1;
  content.forEach((b, i) => { if ((b as { type?: string })?.type === 'fallback') last = i; });
  if (last < 0) return content;
  const drop = new Set(['thinking', 'redacted_thinking', 'tool_use']);
  return content.filter((b, i) => i >= last || !drop.has((b as { type?: string }).type ?? ''));
}

export type SseEvent =
  | { t: 'start'; requestId: string }
  | { t: 'text'; d: string }
  | { t: 'thinking' }
  | { t: 'tool'; id: string; name: string }
  | { t: 'tool_input'; id: string; input: unknown }
  | { t: 'final'; content: unknown[]; stop_reason: string | null; usage: unknown; model: string }
  | { t: 'refusal'; category: string | null }
  | { t: 'error'; code: ErrorCode; message: string; retryAfter?: number; detail?: string };

export type ErrorCode = 'quota' | 'rate' | 'too_many_steps' | 'invalid' | 'upstream_busy' | 'upstream_auth' | 'upstream_region' | 'upstream' | 'timeout';

export const REGION_MESSAGE = "Escobar isn't available on this network right now. Try mobile data.";

/** Maps SDK errors by type, never by message text (the one exception is the system-role probe below). */
/** The API's own error text for a rejected request (no secrets in it), so a 400 can be diagnosed from the app or `wrangler tail`. */
export function errorDetail(err: unknown): string | undefined {
  if (!(err instanceof Anthropic.APIError)) return undefined;
  const e = err.error as { error?: { message?: unknown } } | undefined;
  const m = typeof e?.error?.message === 'string' ? e.error.message : err.message;
  return m ? String(m).slice(0, 300) : undefined;
}

export function mapError(err: unknown): { code: ErrorCode; message: string; retryAfter?: number; detail?: string } {
  if (err instanceof Anthropic.APIConnectionTimeoutError) return { code: 'timeout', message: 'The coach took too long to answer.' };
  if (err instanceof Anthropic.RateLimitError) {
    const ra = Number(err.headers?.get?.('retry-after'));
    return { code: 'upstream_busy', message: 'The coach is busy. Try again in a moment.', ...(Number.isFinite(ra) && ra > 0 ? { retryAfter: ra } : {}) };
  }
  // PL-20: Anthropic answers 403 by the caller's location; 401 is a bad key. Both keep the API's text.
  if (err instanceof Anthropic.PermissionDeniedError) { const detail = errorDetail(err); return { code: 'upstream_region', message: REGION_MESSAGE, ...(detail ? { detail } : {}) }; }
  if (err instanceof Anthropic.AuthenticationError) { const detail = errorDetail(err); return { code: 'upstream_auth', message: 'The coach is not set up correctly.', ...(detail ? { detail } : {}) }; }
  if (err instanceof Anthropic.BadRequestError || err instanceof Anthropic.UnprocessableEntityError || err instanceof Anthropic.NotFoundError) { const detail = errorDetail(err); return { code: 'invalid', message: 'The request was not accepted.', ...(detail ? { detail } : {}) }; }
  if (err instanceof Anthropic.APIError && err.status === 529) return { code: 'upstream_busy', message: 'The coach is busy. Try again in a moment.' };
  if (err instanceof Anthropic.InternalServerError || err instanceof Anthropic.APIConnectionError || err instanceof Anthropic.APIError) return { code: 'upstream', message: 'The coach is unavailable right now.' };
  return { code: 'upstream', message: 'The coach is unavailable right now.' };
}

/** A 400 that says this model doesn't take mid-conversation system messages. */
export function isSystemRoleRejection(err: unknown): boolean {
  if (!(err instanceof Anthropic.BadRequestError)) return false;
  const detail = `${err.message} ${JSON.stringify(err.error ?? '')}`;
  return /role 'system' is not supported/.test(detail);
}

/** The subset of the SDK the relay uses, so tests can inject a scripted stream. */
export interface StreamLike extends AsyncIterable<BetaRawMessageStreamEvent> {
  finalMessage(): Promise<BetaMessage>;
  abort(): void;
}
export interface ClientLike { beta: { messages: { stream(params: MessageCreateParamsStreaming, opts?: { signal?: AbortSignal }): StreamLike } } }

export const IDLE_TIMEOUT_MS = 60_000;

/**
 * Streams one step and relays it through `emit`. Resolves with the final message, or null
 * when an error or refusal was emitted instead. `emittedAny` tells the caller whether a
 * retry is still safe.
 */
export async function runStep(client: ClientLike, params: MessageCreateParamsStreaming, emit: (e: SseEvent) => void, opts: { idleMs?: number; signal?: AbortSignal } = {}): Promise<{ final: BetaMessage | null; emittedAny: boolean; error?: unknown; timedOut?: boolean; refused?: boolean; outputTokens?: number }> {
  const idleMs = opts.idleMs ?? IDLE_TIMEOUT_MS;
  const controller = new AbortController();
  opts.signal?.addEventListener('abort', () => controller.abort());
  let emittedAny = false;
  let timedOut = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const arm = () => { if (timer) clearTimeout(timer); timer = setTimeout(() => { timedOut = true; controller.abort(); }, idleMs); };
  const toolInputs = new Map<number, { id: string; json: string }>();
  let sawThinking = false;
  const send = (e: SseEvent) => { if (e.t === 'text' || e.t === 'tool') emittedAny = true; emit(e); };
  try {
    arm();
    const stream = client.beta.messages.stream(params, { signal: controller.signal });
    for await (const ev of stream) {
      arm();
      if (ev.type === 'content_block_start') {
        const b = ev.content_block as { type: string; id?: string; name?: string };
        if ((b.type === 'thinking' || b.type === 'redacted_thinking') && !sawThinking) { sawThinking = true; send({ t: 'thinking' }); }
        if (b.type === 'tool_use' && b.id && b.name) { toolInputs.set(ev.index, { id: b.id, json: '' }); send({ t: 'tool', id: b.id, name: b.name }); }
      } else if (ev.type === 'content_block_delta') {
        const d = ev.delta as { type: string; text?: string; partial_json?: string };
        if (d.type === 'text_delta' && d.text) send({ t: 'text', d: d.text });
        else if (d.type === 'input_json_delta') { const t = toolInputs.get(ev.index); if (t) t.json += d.partial_json ?? ''; }
      } else if (ev.type === 'content_block_stop') {
        const t = toolInputs.get(ev.index);
        if (t) {
          let input: unknown = {};
          try { input = t.json ? JSON.parse(t.json) : {}; } catch { input = {}; }
          send({ t: 'tool_input', id: t.id, input });
          toolInputs.delete(ev.index);
        }
      }
    }
    const final = await stream.finalMessage();
    if (timer) clearTimeout(timer);
    if (final.stop_reason === 'refusal') {
      const cat = (final as unknown as { stop_details?: { category?: string | null } | null }).stop_details?.category ?? null;
      emit({ t: 'refusal', category: cat });
      // A refusal is still billed (QA-R0-3): report its output so the handler can count it.
      return { final: null, emittedAny, refused: true, outputTokens: final.usage?.output_tokens ?? 0 };
    }
    const content = pruneFallback(final.content as unknown[]);
    emit({ t: 'final', content, stop_reason: final.stop_reason, usage: final.usage, model: final.model });
    return { final: { ...final, content } as BetaMessage, emittedAny };
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (timedOut) { emit({ t: 'error', code: 'timeout', message: 'The coach took too long to answer.' }); return { final: null, emittedAny, error: err, timedOut: true }; }
    return { final: null, emittedAny, error: err };
  }
}

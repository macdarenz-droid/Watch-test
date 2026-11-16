/**
 * The client agent loop (§13): one user turn = staged user message + brief, then model
 * steps until the answer. Tools run locally between steps; all results for a step go back
 * in one user message. History stays valid on every exit path: staged messages only enter
 * history with the first final, and orphaned tool_use blocks are closed with is_error
 * results. Pure over injected deps (transport, state, clock) so it runs under test.
 */
import type { AppState } from '@/core/models';
import { buildBrief } from './context/brief';
import type { EscobarMode } from './context/modes';
import { executeTool, genericLabel, statusLabel, type MemoryEffect, type ToolOutcome } from './tools/executor';
import { makeCtx, redactDrivers, type ToolCtx } from './tools/context';
import { DirectiveBuffer, checkGrounding, normalizeCitations, parseDirectives, repairInstruction, safetySignals, type ParsedAnswer, type SafetySignal } from './verify';
import { findInApp, type PalaceEntry } from './palace/registry';
import type { StreamEvent, Transport, ErrorCode } from './transport';
import type { ContextRef, Conversation, Fact, ImageBlockRef, ProposalRecord, RenderedTurn, StoredMessage, UserBlock, Usage } from './types';
import { titleFrom } from './store';
import { flatten } from './ledger';
import { estimateCost } from './state';

export const STEP_BUDGET: Record<EscobarMode, number> = { chat: 8, live: 8, plan: 12, brief: 3, moment: 1, summarize: 1 };
export const REPAIR_BUDGET = 3;
export const WALL_CLOCK_MS = 150_000;
export const RETRY_BACKOFF_MS = 2000;
export const HISTORY_TOKEN_LIMIT = 60_000;
export const HISTORY_ENTRY_LIMIT = 400;
export const REPAIR_TEXT = '[app] verification check';

export interface Activity { id: string; name: string; label: string; done: boolean; isError?: boolean }

/** What the UI shows while a turn runs, and after it. */
export interface LiveView {
  status: 'thinking' | 'streaming' | 'tools' | 'verifying' | 'idle';
  /** Visible streamed text for the current step (directives completed only). */
  text: string;
  preamble: string[];
  activity: Activity[];
  outcomes: ToolOutcome[];
}

export type TurnOutcome = 'done' | 'error' | 'refusal' | 'aborted' | 'step_limit' | 'cut_off' | 'stale' | 'offline' | 'timeout' | 'backgrounded';

export interface TurnResult {
  outcome: TurnOutcome;
  answer?: ParsedAnswer;
  unverified?: string[];
  revised?: boolean;
  error?: { code: ErrorCode; message: string; retryAfter?: number };
  refusal?: { category: string | null };
  outcomes: ToolOutcome[];
  signals: SafetySignal[];
  /** Offline: palace entries that answer a navigation-style question locally. */
  local?: { text: string; entries: PalaceEntry[] };
  /** The user message was not committed (error before the first reply): show it as "Not sent · Retry". */
  notSent?: boolean;
}

export interface SendInput {
  text: string;
  images?: ImageBlockRef[];
  contextRefs?: ContextRef[];
}

export interface LoopDeps {
  transport: Transport;
  getState(): AppState;
  now(): number;
  appVersion: string;
  manifest(): { hash: string; body: unknown };
  focus?(): ToolCtx['focus'];
  online?(): boolean;
  /** Base64 of a photo kept in IndexedDB or memory. */
  imageData?(id: string): { mediaType: string; data: string } | null;
  /** Photos the model now has; their base64 can leave memory (IndexedDB keeps the thumbnail). */
  imagesSent?(ids: string[]): void;
  applyEffect?(e: MemoryEffect): void;
  /** `costUsd`: each step priced by the model that answered it (F7: modes can use different models). */
  recordUsage?(u: { turns: number; inputTokens: number; outputTokens: number; cacheReadTokens: number; costUsd?: number }): void;
  persist?(c: Conversation): void;
  onUpdate?(v: LiveView): void;
  onSafety?(s: SafetySignal): void;
  sleep?(ms: number): Promise<void>;
  wallClockMs?: number;
  heartSeries?: ToolCtx['heartSeries'];
  watch?: () => ToolCtx['watch'];
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const blocksOf = (m: StoredMessage): unknown[] => (Array.isArray(m.content) ? m.content : []);
const toolUses = (content: unknown[]) => content.filter((b): b is { type: 'tool_use'; id: string; name: string; input: unknown } => isObj(b) && b.type === 'tool_use');
const textOf = (content: unknown[]) => content.filter((b): b is { type: 'text'; text: string } => isObj(b) && b.type === 'text').map(b => b.text).join('');
/**
 * QA2-FD-1: proposals issued so far, for the next card's id. A trim drops the oldest cards, so
 * the number of cards kept can be lower than the highest id kept, and a new id would repeat it.
 */
const proposalsIssued = (proposals: ProposalRecord[]): number =>
  proposals.reduce((n, p) => Math.max(n, Number(/^p(\d+)$/.exec(p.id)?.[1] ?? 0)), proposals.length);

/** At most this many photos travel inline in one request (D3, ES-13); older ones go as stubs. */
export const MAX_INLINE_IMAGES = 2;

/**
 * ES-12: results of health or body tools recorded while sharing was on are replayed as denied
 * once that sharing is off, so switching it off also covers what was said before.
 */
function deniedFor(use: { name: string; input: unknown } | undefined, sharing: { health: boolean; body: boolean }): string | null {
  if (!use) return null;
  const component = isObj(use.input) ? use.input.component : undefined;
  if (!sharing.health && (use.name === 'get_health' || use.name === 'get_heart_session' || (use.name === 'show' && component === 'heart_session'))) return 'health_sharing_off';
  if (!sharing.body && (use.name === 'get_body' || (use.name === 'show' && component === 'body_trend'))) return 'body_sharing_off';
  return null;
}

/**
 * QA-R4b-2: other results recorded while sharing was on keep their training data but lose the
 * health or body parts (heart numbers, resting-HR baselines, sleep, HR drivers; body weight and
 * body fat), in both `data` and the `facts` map. Briefs lose their drivers and weight.
 */
// QA2-FD-4: plus the explain_method personal keys (knowledge/methods.ts drops the same ones live).
const HEALTH_KEYS = new Set(['baselines', 'heart', 'watch', 'avgBpm', 'maxBpm', 'activeKcal', 'restingHr', 'restingHr7d', 'restingHr28d', 'hrv', 'sleep', 'sleepMinutes', 'sleep14dMedianMin', 'restingHrBaseline', 'healthDaysLogged']);
const BODY_KEYS = new Set(['bodyWeightKg', 'weight', 'weightKg', 'bodyFatPct', 'bodyFat', 'restingKcalPerDay', 'withBodyweightKg', 'effectiveKg', 'effective', 'effectiveDelta', 'effectiveDeltaPct']);
const HEALTH_KEY = (k: string) => HEALTH_KEYS.has(k) || /^zone\d+FromBpm$/.test(k);
const HEALTH_FACT = /\b(baselines|heart|watch|avgBpm|maxBpm|activeKcal|restingHr\w*|hrv|sleep\w*|drivers|healthDaysLogged|zone\d+FromBpm)\b/i;
const BODY_FACT = /\b(bodyWeightKg|weight|weightKg|bodyFatPct|bodyFat|restingKcalPerDay|withBodyweightKg|effectiveKg|effective)\b|effectiveDelta\w*/;
// QA3-9: a fact literally saying "hrMax" (explain_method's ledger label), dropped like the field
// itself unless it is the age-based (Tanaka) estimate.
const HRMAX_FACT = /\bhrMax\b/i;
/** Whether an hrMax anywhere in this value is the age-based (Tanaka) one, not a personal reading. */
function hrMaxIsAgeSourced(v: unknown): boolean {
  if (Array.isArray(v)) return v.some(hrMaxIsAgeSourced);
  if (!isObj(v)) return false;
  return v.hrMaxSource === 'tanaka' || Object.values(v).some(hrMaxIsAgeSourced);
}
// BUG-20: insight ids built from gated data (rules.ts / weeklyReview.ts tag them `gated`); a stored
// get_insights result or brief replayed with that sharing off loses them whole, text included.
const BODY_INSIGHT_ID = /^(profile-changed:weight:|weekly:weight-trend$)/;
const HEALTH_INSIGHT_ID = /^(heart-mismatch:|heart-drift:)/;
function gatedInsightId(id: unknown, sharing: { health: boolean; body: boolean }): boolean {
  return typeof id === 'string' && ((!sharing.body && BODY_INSIGHT_ID.test(id)) || (!sharing.health && HEALTH_INSIGHT_ID.test(id)));
}
/** A gated insight dropped from a stored result, with the key it sat under (its facts are labelled by that key). */
type Dropped = { key: string; obj: unknown };
function scrub(v: unknown, sharing: { health: boolean; body: boolean }, dropped?: Dropped[], key = ''): unknown {
  if (Array.isArray(v)) return v.filter(x => {
    const gone = isObj(x) && gatedInsightId(x.id, sharing);
    if (gone) dropped?.push({ key, obj: x });
    return !gone;
  }).map(x => scrub(x, sharing, dropped, key));
  if (!isObj(v)) return v;
  const out: Record<string, unknown> = {};
  for (const [k, x] of Object.entries(v)) {
    if (!sharing.health && HEALTH_KEY(k)) continue;
    // QA3-9: hrMax is personal unless it's the age-based (Tanaka) estimate, mirroring methods.ts's live rule.
    if (!sharing.health && k === 'hrMax' && v.hrMaxSource !== 'tanaka') continue;
    // QA13-1: a stored lift_trend effort[] is per-day body-weight-derived kg once sharing.body is
    // off, same as any other BODY_KEYS field — Array.isArray keeps session_summary's unrelated
    // effort count object (not an array) untouched.
    if (!sharing.body && (BODY_KEYS.has(k) || (k === 'effort' && Array.isArray(x)))) continue;
    out[k] = !sharing.health && k === 'drivers' && Array.isArray(x) ? redactDrivers(x.filter((d): d is string => typeof d === 'string'), false) : scrub(x, sharing, dropped, k);
  }
  return out;
}
/** BUG-20: the fact lines a dropped insight registered (the labels and number format captureFacts built), so they go with it. */
function factsOf(dropped: Dropped[]): Set<string> {
  const out = new Set<string>();
  const fmt = (n: number): string => String(Math.round(n * 1000) / 1000); // same as ledger.ts's fmt
  for (const d of dropped) for (const l of flatten({ [d.key]: [d.obj] })) out.add(`${l.label} = ${fmt(l.value)}${l.unit ? ` ${l.unit}` : ''}`);
  return out;
}
function redactResult(content: string, sharing: { health: boolean; body: boolean }): string {
  let parsed: unknown;
  try { parsed = JSON.parse(content); } catch { return content; }
  if (!isObj(parsed) || !('data' in parsed)) return content;
  const keepHrMax = hrMaxIsAgeSourced(parsed.data);
  const dropped: Dropped[] = [];
  const data = scrub(parsed.data, sharing, dropped);
  const gone = factsOf(dropped);
  const facts = isObj(parsed.facts) ? Object.fromEntries(Object.entries(parsed.facts).filter(([, t]) => {
    if (typeof t !== 'string') return true;
    if (gone.has(t)) return false;
    if (!sharing.health && HRMAX_FACT.test(t) && !keepHrMax) return false;
    return !((!sharing.health && HEALTH_FACT.test(t)) || (!sharing.body && BODY_FACT.test(t)));
  })) : parsed.facts;
  return JSON.stringify({ ...parsed, data, facts });
}
/**
 * QA2-FD-8, QA2-FD-11, QA2-FD-12: the readiness drivers after "advice X" are dropped whole, by
 * matching brackets, since the check-in driver has brackets of its own. The live brief drops all of
 * them when health sharing is off, so the replay does the same.
 */
function dropDrivers(line: string): string {
  let out = '', i = 0;
  const re = /advice [\w-]+ \(/g;
  for (let m = re.exec(line); m; m = re.exec(line)) {
    let depth = 1, j = m.index + m[0].length;
    for (; j < line.length && depth > 0; j++) { if (line[j] === '(') depth++; else if (line[j] === ')') depth--; }
    out += line.slice(i, m.index + m[0].length - 2);
    i = j;
    re.lastIndex = j;
  }
  return out + line.slice(i);
}
function redactBrief(text: string, sharing: { health: boolean; body: boolean }): string {
  let t = text;
  if (!sharing.health) t = t.split('\n').map(dropDrivers).join('\n');
  // QA2-FD-4: a real brief tags the number with its fact id ("weight 80.5 [f13] kg").
  if (!sharing.body) t = t.replace(/, weight [\d.]+(?: \[f\d+\])? kg/g, '');
  // BUG-20: the top_insights line lists `id "title"` entries; gated ones go, whole.
  t = t.split('\n').map(line => {
    if (!line.startsWith('top_insights: ')) return line;
    const kept = line.slice('top_insights: '.length).split('; ').filter(e => !gatedInsightId(e.split(' ')[0], sharing));
    return `top_insights: ${kept.length ? kept.join('; ') : 'none'}`;
  }).join('\n');
  return t;
}

/** The app-only parts (meta, image refs, sent flags) never reach the Worker (§12.2). */
export function toRequestMessages(messages: StoredMessage[], imageData?: LoopDeps['imageData'], sharing?: { health: boolean; body: boolean }): unknown[] {
  const uses = new Map<string, { name: string; input: unknown }>();
  if (sharing && !(sharing.health && sharing.body)) for (const m of messages) if (m.role === 'assistant') for (const u of toolUses(m.content)) uses.set(u.id, { name: u.name, input: u.input });
  // The newest unsent photos are inlined, up to the cap.
  const inline = new Set<string>();
  if (imageData) for (let i = messages.length - 1; i >= 0 && inline.size < MAX_INLINE_IMAGES; i--) {
    const m = messages[i]!;
    if (m.role !== 'user') continue;
    for (let j = m.content.length - 1; j >= 0 && inline.size < MAX_INLINE_IMAGES; j--) { const b = m.content[j]!; if (b.type === 'image_ref' && !b.sent) inline.add(b.id); }
  }
  const partial = !!sharing && !(sharing.health && sharing.body);
  return messages.map(m => {
    if (m.role === 'system') return { role: 'system', content: partial ? redactBrief(m.content, sharing!) : m.content };
    if (m.role === 'assistant') return { role: 'assistant', content: m.content };
    const content = m.content.map((b: UserBlock) => {
      if (b.type === 'text') return { type: 'text', text: b.text };
      if (b.type === 'tool_result') {
        const denied = sharing ? deniedFor(uses.get(b.tool_use_id), sharing) : null;
        if (denied) return { type: 'tool_result', tool_use_id: b.tool_use_id, content: JSON.stringify({ data: { denied }, facts: {} }) };
        const content = partial && typeof b.content === 'string' ? redactResult(b.content, sharing!) : b.content;
        return { type: 'tool_result', tool_use_id: b.tool_use_id, content, ...(b.is_error ? { is_error: true } : {}) };
      }
      const img = !b.sent && imageData && inline.has(b.id) ? imageData(b.id) : null;
      if (img) return { type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.data } };
      return { type: 'text', text: `[photo shared earlier${b.description ? `: ${b.description}` : ''}]` };
    });
    return { role: 'user', content };
  });
}

const isPlainUser = (m: StoredMessage | undefined): boolean => !!m && m.role === 'user' && !m.meta?.repair && !m.content.some(b => b.type === 'tool_result');

/**
 * The history window (§11.4): beyond ~60 k tokens or 400 entries, the oldest part is replaced
 * in the request (never in the store) by the rolling summary, or trimmed at a clean user turn.
 */
export function windowMessages(conv: Conversation, messages: StoredMessage[]): StoredMessage[] {
  // ES-16: estimate on what is actually sent (no meta, photos as stubs, not inline base64).
  // QA-R4b-9: each message is serialised once; a slice's length is the sum of its parts plus the
  // commas and brackets, exactly what JSON.stringify of the slice would give.
  const lens = toRequestMessages(messages).map(m => JSON.stringify(m).length);
  const tail = new Array<number>(lens.length + 1).fill(0);
  for (let i = lens.length - 1; i >= 0; i--) tail[i] = tail[i + 1]! + lens[i]!;
  const fitsFrom = (cut: number) => {
    const n = messages.length - cut;
    const chars = n ? tail[cut]! + (n - 1) + 2 : 2;
    return Math.ceil(chars / 4) <= HISTORY_TOKEN_LIMIT && n <= Math.min(HISTORY_ENTRY_LIMIT, 600);
  };
  if (fitsFrom(0)) return messages;
  const summary = conv.rollingSummary;
  let cut = summary && summary.upTo < messages.length && isPlainUser(messages[summary.upTo]) ? summary.upTo : -1;
  if (cut < 0) {
    cut = Math.floor(messages.length / 2);
    while (cut < messages.length && !isPlainUser(messages[cut])) cut++;
    if (cut >= messages.length) return messages;
  }
  // Still too big after the first cut: move on to later clean user turns until it fits.
  while (!fitsFrom(cut)) {
    let next = cut + 1;
    while (next < messages.length && !isPlainUser(messages[next])) next++;
    if (next >= messages.length) break;
    cut = next;
  }
  const head: StoredMessage = { role: 'user', content: [{ type: 'text', text: summary && cut === summary.upTo ? `[summary of earlier conversation] ${summary.text}` : summary && cut > summary.upTo ? `[summary of earlier conversation] ${summary.text} [later messages trimmed]` : '[earlier conversation trimmed]' }] };
  const rest = messages.slice(cut);
  // Two user messages in a row are merged by the API; keep the shape simple.
  return [head, ...rest];
}

/** Offline, answer "where is…/how do I…" from the palace (§13, §23 EV5). */
export function offlineReply(text: string): { text: string; entries: PalaceEntry[] } {
  const entries = findInApp(text, 3);
  if (!entries.length) return { text: 'Escobar is offline. Your notes below still update.', entries: [] };
  const top = entries[0]!;
  return { text: `Escobar is offline, but here's where to look: ${top.title} is at ${top.where}. ${top.what}`, entries };
}

let genCounter = 0;

export class EscobarLoop {
  conversation: Conversation;
  private deps: LoopDeps;
  private generation = 0;
  /** The generation of the most recent send: only it may set the view idle (ES-09). */
  private latestSend = 0;
  private controller: AbortController | null = null;
  private abortReason: TurnOutcome | null = null;
  /** QA-R4b-3: a step of this turn sent a trimmed window, so the next brief must be full. */
  private trimmedThisTurn = false;
  view: LiveView = { status: 'idle', text: '', preamble: [], activity: [], outcomes: [] };

  constructor(conversation: Conversation, deps: LoopDeps) {
    this.conversation = conversation;
    this.deps = deps;
  }

  get busy(): boolean { return this.view.status !== 'idle'; }

  private update(patch: Partial<LiveView>): void {
    this.view = { ...this.view, ...patch };
    this.deps.onUpdate?.(this.view);
  }

  private commit(messages: StoredMessage[], extra: Partial<Conversation> = {}): void {
    const c = this.conversation;
    this.conversation = { ...c, ...extra, title: c.title || titleFrom(messages), messages: [...c.messages, ...messages], updatedAt: new Date(this.deps.now()).toISOString() };
  }

  private save(): void { this.deps.persist?.(this.conversation); }

  /** Adds is_error results for any tool_use left without a result (§13). */
  closeOrphans(reason: string): void {
    const msgs = this.conversation.messages;
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== 'assistant') return;
    const uses = toolUses(blocksOf(last));
    if (!uses.length) return;
    this.commit([{ role: 'user', content: uses.map(u => ({ type: 'tool_result' as const, tool_use_id: u.id, content: `not run: ${reason}`, is_error: true })) }]);
    this.save();
  }

  /** The Stop button. */
  stop(): void { this.abort('aborted'); }
  /** The app went to the background mid-stream (§13). */
  background(): void { if (this.busy) this.abort('backgrounded'); }

  private abort(reason: TurnOutcome): void {
    this.abortReason = reason;
    this.generation = ++genCounter;
    this.controller?.abort();
  }

  private ctx(): ToolCtx {
    return makeCtx(this.deps.getState(), this.deps.now(), { focus: this.deps.focus?.() ?? null, heartSeries: this.deps.heartSeries, watch: this.deps.watch?.() });
  }

  private userMessage(input: SendInput): StoredMessage {
    const refs = input.contextRefs ?? [];
    const prefix = refs.map(r => `[about: ${r.kind} ${r.id} "${r.label.replace(/"/g, "'")}"]`).join(' ');
    const text = prefix ? `${prefix} ${input.text}` : input.text;
    const content: UserBlock[] = [...(input.images ?? []), { type: 'text', text }];
    return { role: 'user', content, ...(refs.length ? { meta: { contextRefs: refs } } : {}) };
  }

  private briefMessage(mode: EscobarMode, signals: SafetySignal[]): { msg: StoredMessage; facts: Fact[]; lines: Record<string, string> } {
    const c = this.conversation;
    const b = buildBrief({
      ctx: this.ctx(), mode, turnIndex: c.userTurns ?? 0, previous: c.briefLines ?? null, ledger: c.ledger,
      // ES-32: an expired suggestion is no longer pending.
      pending: (c.proposals ?? []).filter(p => p.status === 'awaiting' && p.expiresOn >= this.ctx().today).map(p => ({ id: p.id, title: p.title })),
      decisions: (c.pendingDecisions ?? []).map(d => ({ proposalId: d.proposalId, title: d.title, decision: d.decision })),
      signals,
    });
    return { msg: { role: 'system', content: b.text }, facts: b.facts, lines: b.lines };
  }

  /** Streams one step. Retries once for busy/timeout when nothing reached the screen yet. */
  private async step(messages: StoredMessage[], mode: EscobarMode, signal: AbortSignal, gen: number): Promise<{ final?: Extract<StreamEvent, { t: 'final' }>; error?: TurnResult['error']; refusal?: { category: string | null }; stale?: boolean }> {
    const s = this.deps.getState();
    const windowed = windowMessages(this.conversation, messages);
    // After a trim the next brief is sent in full: the diff it would build on may be cut off.
    if (windowed !== messages) {
      this.trimmedThisTurn = true;
      if (this.conversation.briefLines) this.conversation = { ...this.conversation, briefLines: undefined };
    }
    const body = {
      protocol: 2, mode, appVersion: this.deps.appVersion, manifest: this.deps.manifest(),
      messages: toRequestMessages(windowed, this.deps.imageData, s.escobar.sharing),
      unit: s.preferences.weightUnit, tone: s.escobar.tone,
    };
    for (let attempt = 0; ; attempt++) {
      // AUD-2: no new request once the online coach is off, including the retry after a back-off.
      if (!this.deps.getState().escobar.enabled) { this.abort('aborted'); return { stale: true }; }
      let shown = false;
      let text = '';
      const activity: Activity[] = [...this.view.activity];
      const buffer = new DirectiveBuffer();
      try {
        for await (const ev of this.deps.transport.turn(body, signal)) {
          if (gen !== this.generation) return { stale: true };
          switch (ev.t) {
            case 'thinking': this.update({ status: 'thinking' }); break;
            case 'text': {
              shown = true;
              text = buffer.push(ev.d);
              this.update({ status: 'streaming', text });
              break;
            }
            case 'tool':
              shown = true;
              activity.push({ id: ev.id, name: ev.name, label: genericLabel(ev.name), done: false });
              this.update({ status: 'tools', activity: [...activity] });
              break;
            case 'tool_input': {
              const a = activity.find(x => x.id === ev.id);
              if (a) a.label = statusLabel(a.name, ev.input, this.ctx());
              this.update({ activity: [...activity] });
              break;
            }
            case 'final': return { final: ev };
            case 'refusal': return { refusal: { category: ev.category } };
            case 'error': {
              if (!shown && attempt === 0 && (ev.code === 'upstream_busy' || ev.code === 'timeout')) throw Object.assign(new Error('retry'), { retryable: ev });
              return { error: { code: ev.code, message: ev.message, ...(ev.retryAfter ? { retryAfter: ev.retryAfter } : {}) } };
            }
            default: break;
          }
        }
        if (signal.aborted) return { stale: true };
        return { error: { code: 'network', message: 'The connection closed before the answer finished.' } };
      } catch (err) {
        const retryable = (err as { retryable?: StreamEvent }).retryable;
        if (retryable && attempt === 0) { await (this.deps.sleep ?? (ms => new Promise(r => setTimeout(r, ms))))(RETRY_BACKOFF_MS); continue; }
        if (signal.aborted) return { stale: true };
        return { error: { code: 'network', message: 'Could not reach the coach.' } };
      }
    }
  }

  async send(input: SendInput, mode: EscobarMode = 'chat'): Promise<TurnResult> {
    const signals = safetySignals(input.text);
    for (const s of signals) if (s === 'crisis' || s === 'medical') this.deps.onSafety?.(s);
    const outcomes: ToolOutcome[] = [];
    if (this.deps.online && !this.deps.online()) return { outcome: 'offline', local: offlineReply(input.text), outcomes, signals, notSent: true };
    // ES-09: a new send supersedes one still running.
    if (this.busy) this.abort('stale');

    const gen = this.generation = ++genCounter;
    this.latestSend = gen;
    this.abortReason = null;
    this.trimmedThisTurn = false;
    const controller = this.controller = new AbortController();
    const timer = setTimeout(() => this.abort('timeout'), this.deps.wallClockMs ?? WALL_CLOCK_MS);
    this.update({ status: 'thinking', text: '', preamble: [], activity: [], outcomes: [] });

    const brief = this.briefMessage(mode, signals);
    let staged: StoredMessage[] | null = [this.userMessage(input), brief.msg];
    // ES-20: the brief reported these decisions; any recorded while this turn runs stay queued.
    const decisionKey = (d: { proposalId: string; decision: string; at: string }) => `${d.proposalId}|${d.decision}|${d.at}`;
    const reported = new Set((this.conversation.pendingDecisions ?? []).map(decisionKey));
    let stagedExtra: Partial<Conversation> = { ledger: [...this.conversation.ledger, ...brief.facts], briefLines: brief.lines, userTurns: (this.conversation.userTurns ?? 0) + 1 };
    let userCommitted = false;
    let firstAnswer: { parsed: ReturnType<typeof parseDirectives>; unverified: string[] } | null = null;
    const usage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, costUsd: 0 };
    let steps = 0;
    let budget = STEP_BUDGET[mode];
    let repaired = false;
    let firstAnswerIndex = -1;
    let result: TurnResult | null = null;

    const finish = (r: TurnResult): TurnResult => {
      clearTimeout(timer);
      if (usage.outputTokens || usage.inputTokens) this.deps.recordUsage?.({ turns: 1, ...usage });
      // ES-11: a repair that did not finish still shows the first answer, with its unchecked numbers marked.
      if (r.outcome !== 'done' && firstAnswer && firstAnswerIndex >= 0) this.setRendered(firstAnswerIndex, { answer: firstAnswer.parsed.text, chips: firstAnswer.parsed.chips, unverified: firstAnswer.unverified });
      if (this.latestSend === gen) this.update({ status: 'idle' });
      if (userCommitted) this.markImagesSent(); else this.save();
      return r;
    };
    const exitAborted = (): TurnResult => {
      const reason = this.abortReason ?? 'stale';
      this.closeOrphans(reason === 'aborted' ? 'aborted' : reason === 'backgrounded' ? 'backgrounded' : reason === 'timeout' ? 'timeout' : 'stale');
      return finish({ outcome: reason, outcomes, signals, notSent: !userCommitted });
    };

    try {
      for (;;) {
        if (steps >= budget) {
          this.closeOrphans('step_limit');
          result = finish({ outcome: 'step_limit', outcomes, signals });
          break;
        }
        steps++;
        const pending = staged ? [...this.conversation.messages, ...staged] : this.conversation.messages;
        const r = await this.step(pending, mode, controller.signal, gen);
        if (r.stale || gen !== this.generation) { result = exitAborted(); break; }
        if (r.error) { result = finish({ outcome: 'error', error: r.error, outcomes, signals, notSent: !userCommitted }); break; }
        if (r.refusal) { this.update({ text: '' }); result = finish({ outcome: 'refusal', refusal: r.refusal, outcomes, signals, notSent: !userCommitted }); break; }
        const final = r.final!;
        const u = final.usage as Partial<Usage> & { iterations?: Array<Partial<Usage> & { model?: string | null }> } | undefined;
        const its: Array<Partial<Usage> & { model?: string | null }> = u?.iterations?.length ? u.iterations : u ? [u] : [];
        for (const [i, it] of its.entries()) {
          // QA2-F7-1: a fallback attempt that declined before any output is reported but not billed.
          if (i < its.length - 1 && !it.output_tokens) continue;
          // QA2-F7-4: cache writes by TTL; a write without the breakdown is priced at the 5-minute rate.
          const cacheWrite1hTokens = it.cache_creation?.ephemeral_1h_input_tokens ?? 0;
          const cacheWrite5mTokens = Math.max(it.cache_creation?.ephemeral_5m_input_tokens ?? 0, (it.cache_creation_input_tokens ?? 0) - cacheWrite1hTokens);
          const step = { inputTokens: it.input_tokens ?? 0, outputTokens: it.output_tokens ?? 0, cacheReadTokens: it.cache_read_input_tokens ?? 0, cacheWrite5mTokens, cacheWrite1hTokens };
          usage.inputTokens += step.inputTokens; usage.outputTokens += step.outputTokens; usage.cacheReadTokens += step.cacheReadTokens;
          // QA2-F7-1: each attempt at the rates of the model that ran it (a fallback turn mixes models).
          const model = typeof it.model === 'string' ? it.model : typeof final.model === 'string' ? final.model : undefined;
          usage.costUsd += estimateCost(step, model);
        }
        if (staged) {
          const extra: Partial<Conversation> = userCommitted ? stagedExtra : { ...stagedExtra, pendingDecisions: (this.conversation.pendingDecisions ?? []).filter(d => !reported.has(decisionKey(d))) };
          // QA-R4b-3: the first commit carries this turn's brief lines; after a trim they must not come back.
          if (this.trimmedThisTurn) extra.briefLines = undefined;
          this.commit(staged, extra);
          staged = null; stagedExtra = {}; userCommitted = true;
        }
        const content = final.content;
        const uses = toolUses(content);
        // BUG-31: brief-form tags ("38 [f41]") of known facts become canonical citations before parsing.
        const preamble = uses.length ? normalizeCitations(textOf(content), this.conversation.ledger).trim() : '';
        const rendered: RenderedTurn = { activity: this.view.activity.map(a => ({ id: a.id, name: a.name, label: a.label })), ...(preamble ? { preamble: [preamble] } : {}) };
        this.commit([{ role: 'assistant', content, meta: { rendered, ...(final.usage ? { usage: final.usage as unknown as Usage } : {}), ...(final.model ? { model: final.model } : {}) } }]);
        if (preamble) this.update({ preamble: [...this.view.preamble, preamble], text: '' });
        this.save();

        if (final.stop_reason === 'max_tokens' && uses.length) {
          this.closeOrphans('cut_off');
          result = finish({ outcome: 'cut_off', outcomes, signals });
          break;
        }
        if (!uses.length) {
          const raw = normalizeCitations(textOf(content), this.conversation.ledger);
          const parsed = parseDirectives(raw);
          const grounding = checkGrounding({ answer: raw, ledger: this.conversation.ledger, userTexts: this.userTexts() });
          const idx = this.conversation.messages.length - 1;
          if (firstAnswerIndex < 0) { firstAnswerIndex = idx; firstAnswer = { parsed, unverified: grounding.ok ? [] : grounding.sentences }; }
          if (!grounding.ok && !repaired) {
            repaired = true;
            budget = steps + REPAIR_BUDGET;
            this.update({ status: 'verifying' });
            staged = [{ role: 'user', content: [{ type: 'text', text: REPAIR_TEXT }], meta: { repair: true } }, { role: 'system', content: repairInstruction(grounding.ungrounded) }];
            continue;
          }
          firstAnswer = null;
          const revised = firstAnswerIndex !== idx;
          this.setRendered(idx, { answer: parsed.text, chips: parsed.chips, ...(grounding.ok ? {} : { unverified: grounding.sentences }) });
          if (revised) this.setRendered(firstAnswerIndex, { revised: true });
          result = finish({ outcome: 'done', answer: parsed, ...(grounding.ok ? {} : { unverified: grounding.sentences }), revised, outcomes, signals });
          break;
        }

        // Run the tools locally, in block order (read tools are local and synchronous, so
        // "parallel" costs nothing and keeps fact ids deterministic).
        this.update({ status: 'tools' });
        const results: UserBlock[] = [];
        let ledger = this.conversation.ledger;
        let proposals = this.conversation.proposals ?? [];
        const assistantIndex = this.conversation.messages.length - 1;
        for (const use of uses) {
          if (gen !== this.generation) break;
          const o = executeTool(use, { ctx: this.ctx(), ledger, turn: this.conversation.userTurns ?? 0, proposalCount: proposalsIssued(proposals) });
          ledger = [...ledger, ...o.facts];
          if (o.proposal) proposals = [...proposals, { ...o.proposal, status: 'awaiting', messageIndex: assistantIndex } as ProposalRecord];
          if (o.effect) this.deps.applyEffect?.(o.effect);
          outcomes.push(o);
          results.push({ type: 'tool_result', tool_use_id: use.id, content: o.content, ...(o.isError ? { is_error: true } : {}) });
          const a = this.view.activity.find(x => x.id === use.id);
          if (a) { a.label = o.label; a.done = true; a.isError = o.isError; }
        }
        if (gen !== this.generation) { result = exitAborted(); break; }
        this.commit([{ role: 'user', content: results }], { ledger, proposals });
        this.update({ outcomes: [...outcomes], activity: [...this.view.activity] });
        this.save();
      }
    } catch {
      if (gen !== this.generation) result = exitAborted();
      else { this.closeOrphans('error'); result = finish({ outcome: 'error', error: { code: 'network', message: 'Something went wrong.' }, outcomes, signals, notSent: !userCommitted }); }
    }
    if (this.controller === controller) this.controller = null;
    return result!;
  }

  private setRendered(index: number, patch: Partial<RenderedTurn>): void {
    const msgs = [...this.conversation.messages];
    const m = msgs[index];
    if (!m || m.role !== 'assistant') return;
    msgs[index] = { ...m, meta: { ...m.meta, rendered: { ...m.meta.rendered, ...patch } } };
    this.conversation = { ...this.conversation, messages: msgs };
  }

  private userTexts(): string[] {
    return this.conversation.messages.filter((m): m is Extract<StoredMessage, { role: 'user' }> => m.role === 'user' && !m.meta?.repair)
      .flatMap(m => m.content.filter(b => b.type === 'text').map(b => (b as { text: string }).text));
  }

  /** Marks every photo in finished turns as sent, so later requests carry a stub (§6.2). */
  markImagesSent(): void {
    const ids = this.conversation.messages.flatMap(m => (m.role === 'user' ? m.content.flatMap(b => (b.type === 'image_ref' && !b.sent ? [b.id] : [])) : []));
    if (ids.length) this.deps.imagesSent?.(ids);
    const msgs = this.conversation.messages.map(m => (m.role === 'user' && m.content.some(b => b.type === 'image_ref' && !b.sent) ? { ...m, content: m.content.map(b => (b.type === 'image_ref' ? { ...b, sent: true } : b)) } : m));
    this.conversation = { ...this.conversation, messages: msgs };
    this.save();
  }
}

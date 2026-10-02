/**
 * Runs one tool call locally (§8, §13): permission gates, input ranges, the activity
 * label, and ledger capture. Pure: it returns what happened (a tool result for the
 * model, plus a proposal, a component, a navigation or a memory effect for the app to
 * render or apply). Tool results are JSON text `{data, facts}` (§14.1).
 */
import type { MemoryItem, MemoryKind } from '@/core/models';
import { MAX_MEMORY_ITEMS, MAX_MEMORY_TEXT, MEMORY_KINDS } from '@/core/models';

/** Memory kinds that are never evicted to make room (ES-31). */
export const PROTECTED_MEMORY = new Set<MemoryKind>(['injury', 'equipment', 'agreement']);
import { addDays, dayKey } from '@/core/dates';
import { findExercise } from '@/core/exercises';
import { isMuscleId, MUSCLE_IDS } from '@/data/muscles';
import { captureFacts } from '../ledger';
import type { Fact } from '../types';
import { PALACE_BY_ID } from '../palace/registry';
import { explainMethod } from '../knowledge/methods';
import { METHOD_IDS, type MethodId } from '../knowledge/methodIds';
import { lookupKnowledge } from '../knowledge/cards';
import { TOOL_BY_NAME, type ToolDef } from './schema';
import * as R from './read';
import { calculate } from './calc';
import { buildProposal, type Proposal } from './actions';
import { evaluatePlanTool } from './plan';
import { summarize, COMPONENT_GATE } from './show';
import { exerciseName, type ToolCtx } from './context';

/** The only params a navigate call may carry (R1.2). */
const NAV_KEYS = new Set(['view', 'seg', 'muscle', 'exerciseId', 'sessionId']);

export interface ToolUse { id: string; name: string; input: unknown }

export type MemoryEffect =
  | { type: 'remember'; item: MemoryItem }
  | { type: 'forget'; id: string }
  | { type: 'snooze'; insightId: string; verdict: 'snoozed' | 'helpful' };

export interface ToolOutcome {
  toolUseId: string;
  name: string;
  kind: ToolDef['kind'] | 'unknown';
  label: string;
  /** JSON text for the tool_result block. */
  content: string;
  isError: boolean;
  facts: Fact[];
  proposal?: Proposal;
  show?: { component: string; params: Record<string, unknown>; caption?: string; summary: Record<string, unknown> };
  navigate?: { target: string; params?: Record<string, string>; auto: boolean; title: string; where: string };
  escalation?: { kind: 'pain' | 'medical' | 'crisis' | 'disordered_eating'; note?: string };
  effect?: MemoryEffect;
}

export interface ExecEnv {
  ctx: ToolCtx;
  /** The conversation's ledger so far (new fact ids continue from it). */
  ledger: Fact[];
  turn: number;
  /** Proposals issued so far in the conversation, for deterministic ids. */
  proposalCount: number;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const normText = (s: string): string => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

/** The present-tense activity line (§8.7). Exercise names resolve locally. */
export function statusLabel(name: string, input: unknown, ctx: ToolCtx): string {
  const t = TOOL_BY_NAME[name];
  if (!t) return 'Working…';
  const i = isObj(input) ? input : {};
  let label = t.status;
  if (label.includes('{exercise}')) {
    const id = typeof i.exerciseId === 'string' ? i.exerciseId : '';
    label = label.replace('{exercise}', id && findExercise(id, ctx.state.customExercises) ? exerciseName(ctx, id) : 'exercise');
  }
  if (name === 'show' && typeof i.component === 'string') label = `Drawing ${i.component.replace(/_/g, ' ')}…`;
  if (name === 'explain_method' && typeof i.topic === 'string') label = `Looking at how ${i.topic.replace(/_/g, ' ')} is worked out…`;
  return label;
}

/** Generic label shown the moment a tool starts, before its input arrives. */
export const genericLabel = (name: string): string => (TOOL_BY_NAME[name]?.kind === 'act' ? 'Preparing a change…' : TOOL_BY_NAME[name]?.kind === 'show' ? 'Drawing that…' : 'Looking into it…');

const DENIED = {
  health: { denied: 'health_sharing_off', how: 'Settings → Escobar → Share health data' },
  body: { denied: 'body_sharing_off', how: 'Settings → Escobar → Share body data' },
};

function read(name: string, input: Record<string, unknown>, ctx: ToolCtx): unknown {
  switch (name) {
    case 'get_overview': return R.getOverview(input, ctx);
    case 'get_sessions': return R.getSessions(input, ctx);
    case 'get_session': return R.getSession(input, ctx);
    case 'get_exercise_history': return R.getExerciseHistory(input, ctx);
    case 'get_next_target': return R.getNextTarget(input, ctx);
    case 'get_recovery': return R.getRecovery(input as { muscles?: string[]; at?: string }, ctx);
    case 'get_readiness': return R.getReadiness(input, ctx);
    case 'get_volume': return R.getVolume(input as { weeks?: number; muscles?: string[] }, ctx);
    case 'get_records': return R.getRecords(input, ctx);
    case 'get_insights': return R.getInsights(input, ctx);
    case 'get_plan': return R.getPlan(input, ctx);
    case 'get_body': return R.getBody(input, ctx);
    case 'get_health': return R.getHealth(input, ctx);
    case 'get_heart_session': return R.getHeartSession(input, ctx);
    case 'get_live_session': return R.getLiveSession(input, ctx);
    case 'search_exercises': return R.searchExercisesTool(input, ctx);
    case 'get_exercise': return R.getExercise(input, ctx);
    case 'get_equipment': return R.getEquipment(input, ctx);
    case 'find_in_app': return R.findInAppTool(input);
    case 'explain_method': {
      if (!METHOD_IDS.includes(input.topic as MethodId)) throw new R.ToolError(`topic must be one of ${METHOD_IDS.join(', ')}`);
      return explainMethod(input.topic as MethodId, ctx);
    }
    case 'lookup_knowledge': return lookupKnowledge({ query: typeof input.query === 'string' ? input.query : undefined, ids: Array.isArray(input.ids) ? input.ids.filter((x): x is string => typeof x === 'string') : undefined });
    case 'calculate': return calculate(input as { op?: string; args?: Record<string, unknown> }, ctx);
    case 'evaluate_plan': return evaluatePlanTool(input, ctx);
    case 'recall': {
      const kind = typeof input.kind === 'string' ? input.kind : undefined;
      const q = typeof input.query === 'string' ? normText(input.query) : '';
      const items = ctx.state.escobar.memory.filter(m => (!kind || m.kind === kind) && (!q || normText(m.text).includes(q) || q.split(' ').some(w => w.length > 3 && normText(m.text).includes(w))));
      return { items: items.slice(-20).map(m => ({ memoryId: m.id, kind: m.kind, text: m.text, since: dayKey(new Date(m.createdAt)), /* QA2-FD-5: the phone's day */ ...(m.expiresOn ? { expiresOn: m.expiresOn } : {}) })) };
    }
    default: throw new R.ToolError(`unknown tool ${name}`);
  }
}

function ok(out: ToolOutcome, data: unknown, env: ExecEnv, labelPrefix = ''): ToolOutcome {
  const { facts, map } = captureFacts(env.ledger, out.name, undefined, data, env.turn, labelPrefix);
  return { ...out, facts, content: JSON.stringify({ data, facts: map }) };
}

export function executeTool(use: ToolUse, env: ExecEnv): ToolOutcome {
  const { ctx } = env;
  const def = TOOL_BY_NAME[use.name];
  const base: ToolOutcome = { toolUseId: use.id, name: use.name, kind: def?.kind ?? 'unknown', label: statusLabel(use.name, use.input, ctx), content: '', isError: false, facts: [] };
  const fail = (msg: string): ToolOutcome => ({ ...base, isError: true, content: JSON.stringify({ error: msg }) });
  if (!def) return fail(`unknown tool ${use.name}`);
  const input = isObj(use.input) ? use.input : {};
  const sharing = ctx.state.escobar.sharing;
  const gate = def.gate ?? ((use.name === 'show' || use.name === 'pin_card') ? COMPONENT_GATE[input.component as keyof typeof COMPONENT_GATE] : undefined);
  if (gate && !sharing[gate]) return { ...base, content: JSON.stringify({ data: DENIED[gate], facts: {} }) };

  try {
    switch (def.kind) {
      case 'read':
      case 'meta': {
        const data = read(use.name, input, ctx);
        if (use.name === 'lookup_knowledge') {
          // Card numbers are labelled with the card id so a ⟦k:id⟧ citation grounds them.
          const cards = (data as { cards: Array<{ id: string }> }).cards;
          let ledger = env.ledger;
          const facts: Fact[] = [];
          const map: Record<string, string> = {};
          for (const c of cards) {
            const r = captureFacts(ledger, use.name, input, { numbers: (c as unknown as { numbers: unknown }).numbers }, env.turn, `k:${c.id}`);
            facts.push(...r.facts); Object.assign(map, r.map); ledger = [...ledger, ...r.facts];
          }
          return { ...base, facts, content: JSON.stringify({ data, facts: map }) };
        }
        return ok(base, data, env);
      }
      case 'show': {
        if (use.name === 'show') {
          const component = String(input.component ?? '');
          const params = isObj(input.params) ? input.params : {};
          const summary = summarize(component, params, ctx);
          const caption = typeof input.caption === 'string' ? input.caption.slice(0, 120) : undefined;
          return { ...ok(base, summary, env), show: { component, params, ...(caption ? { caption } : {}), summary } };
        }
        if (use.name === 'navigate') {
          const entry = PALACE_BY_ID[String(input.target ?? '')];
          if (!entry) throw new R.ToolError('unknown target; use a palace id from the manifest or find_in_app');
          const params: Record<string, string> = {};
          if (Array.isArray(input.params)) for (const p of input.params) if (isObj(p) && typeof p.key === 'string' && typeof p.value === 'string' && NAV_KEYS.has(p.key)) params[p.key] = p.value;
          if (params.muscle !== undefined && !isMuscleId(params.muscle)) throw new R.ToolError(`muscle must be one of ${MUSCLE_IDS.join(', ')}`);
          const nav = { target: entry.id, ...(Object.keys(params).length ? { params } : {}), auto: input.auto === true, title: entry.title, where: entry.where };
          return { ...base, navigate: nav, content: JSON.stringify({ data: { shown: true, title: entry.title, where: entry.where }, facts: {} }) };
        }
        // pin_card: a proposal the person taps.
        const component = String(input.component ?? '');
        summarize(component, isObj(input.params) ? input.params : {}, ctx);
        const proposal = buildProposal(use.name, input, ctx, `p${env.proposalCount + 1}`);
        return { ...ok(base, { proposalId: proposal.id, status: 'awaiting_user', preview: proposal.preview }, env), proposal };
      }
      case 'act': {
        if (use.name === 'escalate') {
          const kind = input.kind;
          if (kind !== 'pain' && kind !== 'medical' && kind !== 'crisis' && kind !== 'disordered_eating') throw new R.ToolError('kind must be pain, medical, crisis or disordered_eating');
          return { ...base, escalation: { kind, ...(typeof input.note === 'string' ? { note: input.note.slice(0, 140) } : {}) }, content: JSON.stringify({ data: { shown: true, kind }, facts: {} }) };
        }
        if (use.name === 'snooze_insight') {
          const id = typeof input.insightId === 'string' ? input.insightId : '';
          if (!id) throw new R.ToolError('insightId is required; use get_insights');
          const verdict = input.verdict === 'helpful' ? 'helpful' : input.verdict === 'snoozed' ? 'snoozed' : null;
          if (!verdict) throw new R.ToolError('verdict must be snoozed or helpful');
          return { ...base, effect: { type: 'snooze', insightId: id, verdict }, content: JSON.stringify({ data: { applied: true, insightId: id, verdict, undo: 'available' }, facts: {} }) };
        }
        const proposal = buildProposal(use.name, input, ctx, `p${env.proposalCount + 1}`);
        return { ...ok(base, { proposalId: proposal.id, status: 'awaiting_user', preview: proposal.preview }, env), proposal };
      }
      case 'memory': {
        const e = ctx.state.escobar;
        if (use.name === 'recall') return ok(base, read('recall', input, ctx), env);
        if (use.name === 'forget') {
          const id = typeof input.memoryId === 'string' ? input.memoryId : '';
          if (!e.memory.some(m => m.id === id)) throw new R.ToolError('unknown memoryId; the brief lists them as [id]');
          return { ...base, effect: { type: 'forget', id }, content: JSON.stringify({ data: { forgotten: true, memoryId: id, undo: 'available' }, facts: {} }) };
        }
        // remember
        if (!e.memoryEnabled) return { ...base, content: JSON.stringify({ data: { denied: 'memory_off', how: 'Memory → "Escobar may remember things I tell him"' }, facts: {} }) };
        const kind = input.kind as MemoryKind;
        if (!MEMORY_KINDS.includes(kind) || kind === 'episode') throw new R.ToolError('kind must be fact, injury, equipment, preference, goal or agreement');
        const text = typeof input.text === 'string' ? input.text.replace(/\s+/g, ' ').trim() : '';
        if (!text) throw new R.ToolError('text is required');
        if (text.length > MAX_MEMORY_TEXT) throw new R.ToolError(`text must be at most ${MAX_MEMORY_TEXT} characters`);
        const dup = e.memory.find(m => normText(m.text) === normText(text));
        if (dup) return { ...base, content: JSON.stringify({ data: { alreadyKnown: true, memoryId: dup.id }, facts: {} }) };
        const days = input.expiresInDays == null ? (kind === 'injury' ? 42 : undefined) : Number(input.expiresInDays);
        if (days != null && (!Number.isInteger(days) || days < 1 || days > 365)) throw new R.ToolError('expiresInDays must be 1–365');
        // ES-31: at the cap only facts, preferences, goals and episodes make room; injuries, equipment and agreements never do.
        if (e.memory.length >= MAX_MEMORY_ITEMS && !e.memory.some(m => !PROTECTED_MEMORY.has(m.kind))) throw new R.ToolError('memory is full; ask the person to forget something first');
        const iso = new Date(ctx.now).toISOString();
        const item: MemoryItem = { id: `m${ctx.now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, kind, text, source: 'user_said', createdAt: iso, updatedAt: iso, ...(days ? { expiresOn: addDays(ctx.today, days) } : {}) };
        return { ...base, effect: { type: 'remember', item }, content: JSON.stringify({ data: { remembered: true, memoryId: item.id, ...(item.expiresOn ? { reviewOn: item.expiresOn } : {}) }, facts: {} }) };
      }
    }
  } catch (err) {
    if (err instanceof R.ToolError) return fail(err.message);
    return fail('that tool failed on this data; try different input');
  }
  return fail('unhandled tool');
}

/**
 * The situation brief (§11.2): plain `key: value` lines sent as a mid-conversation system
 * message after each user message. Full on the first turn and every 5th; otherwise only
 * lines that changed plus the always-present ones. Numbers carry fact ids inline so the
 * model can cite them. Health and body details only appear when shared.
 */
import type { MemoryItem } from '@/core/models';
import { daysBetween, weekdayOf, trainedTodaySessions } from '@/core/dates';
import { muscleLabel } from '@/data/muscles';
import { DEFAULT_GOAL, GOAL_BY_ID } from '@/data/goals';
import { trainingAgeMonths, ageOf, possiblyMinor } from '@/brain/recovery';
import { coachInsights } from '@/brain/coach/rules';
import { plannedThisWeek, weekSummary, daysSinceLastSession } from '@/brain/weekly';
import { resolveProfile } from '@/brain/units';
import { lighterWeekDay } from '@/brain/deload';
import { activeDeloadOf, coachCtx, exerciseName, exerciseOf, readinessToday, recoveryAt, scheduledSplitFor, todayOverrideOf, type ToolCtx } from '../tools/context';
import { MODE_ADDENDUM, type EscobarMode } from './modes';
import { addFact } from '../ledger';
import type { Fact } from '../types';

export const BRIEF_CAP = 3000;
export const FULL_BRIEF_EVERY = 5;
export const MEMORY_IN_BRIEF = 12;
const ALWAYS = ['now', 'screen', 'mode', 'pending', 'decisions', 'signals'];
const ORDER = ['now', 'screen', 'today', 'recovery', 'week', 'top_insights', 'profile', 'goal', 'gym', 'memory', 'sharing', 'tone', 'minor', 'signals', 'mode', 'pending', 'decisions'];

export interface BriefInput {
  ctx: ToolCtx;
  mode: EscobarMode;
  /** 0-based index of this user turn in the conversation. */
  turnIndex: number;
  /** The previous brief's lines (without fact ids), for diffing. */
  previous?: Record<string, string> | null;
  /** Existing ledger; new facts continue its numbering. */
  ledger: Fact[];
  pending?: Array<{ id: string; title: string }>;
  decisions?: Array<{ proposalId: string; title: string; decision: string }>;
  signals?: string[];
}

export interface BriefOutput {
  text: string;
  /** All lines as built this turn (no fact ids), to diff against next turn. */
  lines: Record<string, string>;
  facts: Fact[];
  full: boolean;
}

type Num = (value: number, label: string, unit?: string) => string;

const TIME_OF_DAY = (h: number): string => (h < 5 ? 'night' : h < 12 ? 'morning' : h < 17 ? 'afternoon' : h < 22 ? 'evening' : 'night');

export function memoryForBrief(memory: MemoryItem[], today: string): MemoryItem[] {
  // An expired injury stays in, flagged for review; other expired items drop out.
  const live = memory.filter(m => !m.expiresOn || m.expiresOn >= today || m.kind === 'injury');
  const first = live.filter(m => m.kind === 'injury' || m.kind === 'equipment' || m.kind === 'agreement');
  const rest = live.filter(m => !first.includes(m)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return [...first.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), ...rest].slice(0, MEMORY_IN_BRIEF);
}

/**
 * ES-23: anything the person named (splits, gyms, reasons, memories) goes into the brief on one
 * line, without directive brackets and at most 140 characters, so it cannot pose as a brief line.
 */
export const one = (v: string | undefined | null): string => String(v ?? '').replace(/[\r\n]+/g, ' ').replace(/[⟦⟧]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);

function buildLines(inp: BriefInput, num: Num): Record<string, string> {
  const { ctx } = inp;
  const s = ctx.state;
  const e = s.escobar;
  const L: Record<string, string> = {};
  const d = new Date(ctx.now);
  const since = daysSinceLastSession(s.sessions, ctx.today, ctx.now);
  L.now = `${weekdayOf(ctx.today)} ${ctx.today}, ${TIME_OF_DAY(d.getHours())} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}; ${since == null ? 'no sessions logged yet' : since === 0 ? 'trained today' : `last session ${num(since, 'days since last session', 'days')} ${since === 1 ? 'day' : 'days'} ago`}`; // BUG-33: the unit was dropped
  const f = ctx.focus;
  L.screen = f ? `${f.id}${f.details ? ' ' + Object.entries(f.details).map(([k, v]) => `${k}=${v}`).join(' ') : ''}` : 'unknown';

  const split = scheduledSplitFor(ctx);
  const r = readinessToday(ctx);
  const parts: string[] = [];
  parts.push(split ? `scheduled ${one(split.name)} (splitId ${split.id})` : 'rest day');
  if (r) parts.push(`readiness ${r.band} ${num(r.score, 'readiness score today')}${r.calibrating ? ' calibrating' : ''}, advice ${r.loadAdvice}${r.postSessionAdvice ? ` (${one(r.postSessionAdvice)})` : ''}${e.sharing.health && r.drivers.length ? ` (${r.drivers.join('; ')})` : ''}`);
  else parts.push('readiness none (no check-in or health data)');
  const deload = activeDeloadOf(ctx);
  if (deload) parts.push(`lighter week day ${num(lighterWeekDay(deload, ctx.today), 'lighter week day')} of 7`);
  const o = todayOverrideOf(ctx);
  if (o) parts.push(`today adjusted: ${one(o.reason)}`);
  if (s.active) parts.push(`live session: ${one(s.splits.find(x => x.id === s.active!.splitId)?.name ?? 'workout')}`);
  const doneToday = trainedTodaySessions(s.sessions, ctx.today, ctx.now);
  if (doneToday.length) parts.push(`done today: ${doneToday.map(x => one(x.splitName)).join(', ')}`);
  L.today = parts.join('; ');

  const least = recoveryAt(ctx).filter(x => x.lastTrainedAt).sort((a, b) => a.pct - b.pct).slice(0, 3);
  L.recovery = least.length ? least.map(x => `${muscleLabel(x.muscle).toLowerCase()} ${num(x.pct, `${muscleLabel(x.muscle)} recovery`, '%')}`).join(', ') : 'nothing logged';

  // RG-19: days taken off this week are not planned.
  const planned = plannedThisWeek(s.schedule, s.daysOff, ctx.today) ?? 0;
  const w = weekSummary(s.sessions, ctx.today, s.customExercises, planned);
  L.week = `${num(w.workouts, 'sessions this week')} of ${num(planned, 'planned sessions this week')} planned sessions, ${num(w.sets, 'sets this week')} sets, ${num(w.records.length, 'records this week')} records`;

  // BUG-20: insights built from unshared body or health data stay on the phone.
  const top = coachInsights(coachCtx(ctx), 5, e.sharing);
  L.top_insights = top.length ? top.map(i => `${i.id} "${one(i.title)}"`).join('; ') : 'none';

  const g = GOAL_BY_ID[s.goal];
  const months = trainingAgeMonths(s.profile, s.sessions, ctx.now);
  const age = ageOf(s.profile, ctx.now);
  const prof = [`goal ${g.name} (main ${g.mainReps[0]}–${g.mainReps[1]} reps)`];
  if (months != null) prof.push(`training ${num(Math.round(months), 'training age', 'months')} months`);
  if (s.profile.plannedDays) prof.push(`plans ${num(s.profile.plannedDays, 'planned days per week')} days/week`);
  if (s.profile.sex) prof.push(s.profile.sex);
  if (age != null) prof.push(`age ${num(age, 'age', 'years')}`);
  if (e.sharing.body && s.profile.bodyWeightKg) prof.push(`weight ${num(s.profile.bodyWeightKg, 'body weight', 'kg')} kg`);
  L.profile = prof.join(', ');
  // ADAPT-5 (F-2): derived from profileHistory (already stored): the default goal nobody picked.
  if (s.goal === DEFAULT_GOAL && !s.profileHistory.some(c => c.field === 'goal' && (c.source === 'user' || c.source === 'onboarding'))) L.goal = 'default, not chosen';

  const gym = s.units.gyms.find(x => x.id === s.units.activeGymId);
  const entryUnits = (split?.exercises ?? []).map(x => {
    const ex = exerciseOf(ctx, x.exerciseId);
    const p = resolveProfile(x.exerciseId, s.units.activeGymId, s.units, ex);
    return p.unit !== gym?.defaultUnit ? `${one(exerciseName(ctx, x.exerciseId))} ${p.unit}` : null;
  }).filter(Boolean);
  const groups = Object.entries(s.units.byEquipment[s.units.activeGymId] ?? {}).map(([k, p]) => `${k} ${p?.unit}`);
  L.gym = `${one(gym?.name ?? 'My gym')}, default ${gym?.defaultUnit ?? 'kg'}; display ${s.preferences.weightUnit}${entryUnits.length || groups.length ? `; entry units: ${[...groups, ...entryUnits].join(', ')}` : ''}`;

  const mem = memoryForBrief(e.memory, ctx.today);
  L.memory = mem.length ? mem.map(m => `[${m.id}] ${m.kind}: ${one(m.text)}${m.expiresOn && m.expiresOn < ctx.today ? ' (review: past its date)' : ''}`).join(' | ') : e.memoryEnabled ? 'none' : 'off (the person turned memory off)';
  const off = [!e.sharing.health && 'health', !e.sharing.body && 'body'].filter(Boolean);
  L.sharing = off.length ? `${off.join(' and ')} sharing off` : 'health and body shared';
  L.tone = e.tone;
  if (possiblyMinor(s.profile, ctx.now)) L.minor = 'true';
  if (inp.signals?.length) L.signals = inp.signals.join(', ');
  L.mode = `${inp.mode}: ${MODE_ADDENDUM[inp.mode]}`;
  L.pending = inp.pending?.length ? inp.pending.map(p => `${p.id} "${one(p.title)}"`).join('; ') : 'none';
  L.decisions = inp.decisions?.length ? inp.decisions.map(x => `proposal ${x.proposalId} "${one(x.title)}" → ${x.decision}`).join('; ') : 'none';
  return L;
}

export function buildBrief(inp: BriefInput): BriefOutput {
  const plain = buildLines(inp, v => String(v));
  const full = !inp.previous || inp.turnIndex % FULL_BRIEF_EVERY === 0;
  const keys = ORDER.filter(k => plain[k] != null && (full || ALWAYS.includes(k) || plain[k] !== inp.previous?.[k]));
  const facts: Fact[] = [];
  const registry = [...inp.ledger];
  const num: Num = (value, label, unit) => {
    const fct = addFact(registry, value, label, 'brief', inp.turnIndex, unit);
    registry.push(fct);
    facts.push(fct);
    return `${value}${unit === '%' ? '%' : ''} [${fct.id}]`;
  };
  const withIds = buildLines(inp, num);
  // Only keep facts whose line is sent.
  const sent = keys.map(k => `${k}: ${withIds[k]}`);
  let text = (full ? '' : '(changes since the last brief)\n') + sent.join('\n');
  if (text.length > BRIEF_CAP) {
    // Trim the long, low-priority lines first.
    for (const k of ['memory', 'top_insights', 'gym', 'today']) {
      if (text.length <= BRIEF_CAP) break;
      const i = keys.indexOf(k);
      if (i < 0) continue;
      const over = text.length - BRIEF_CAP;
      const line = sent[i]!;
      sent[i] = line.slice(0, Math.max(k.length + 10, line.length - over - 1)) + '…';
      text = (full ? '' : '(changes since the last brief)\n') + sent.join('\n');
    }
  }
  const keptFacts = facts.filter(fc => text.includes(`[${fc.id}]`));
  // Renumber to stay sequential after dropped facts.
  const renum = new Map<string, string>();
  keptFacts.forEach((fc, i) => renum.set(fc.id, `f${inp.ledger.length + i + 1}`));
  text = text.replace(/\[(f\d+)\]/g, (m, id: string) => (renum.has(id) ? `[${renum.get(id)}]` : m));
  return { text, lines: plain, facts: keptFacts.map(fc => ({ ...fc, id: renum.get(fc.id)! })), full };
}

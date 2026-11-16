/**
 * Applying a proposal (§10): re-check the fingerprint, write through the slice mutations,
 * record the decision for the next brief, and offer Undo. EV5 carries the goal change and
 * Not now, and every other `propose_*` kind (pulled forward from EV6 on the owner's report).
 */
import { state, update } from '@/core/store';
import { showToast } from '@/app/toast';
import { go } from '@/app/router';
import { emptySchedule, newId, MAX_PINS, WEEKDAYS, type AppState, type CheckIn, type Split, type EquipmentProfile, type Exercise, type LoadUnit, type PinnedCard, type TodayChange } from '@/core/models';
import { addDays, todayKey } from '@/core/dates';
import type { MuscleId } from '@/data/muscles';
import type { PlanDraft } from '@/brain/plan';
import { applyGoalRest, changeGoal, logWeight, setBirthYear, setHeight, setPlannedDays, setSex, setTrainingSince } from '@/slices/profile/profile';
import { createSplit, deleteSplit, saveCustomExercise, setFocus } from '@/slices/workout/splits';
import { discardSession, startSession } from '@/slices/workout/session';
import { addGym, saveProfile, setActiveGym } from '@/slices/workout/units';
import { acceptDeload } from '@/slices/coach/coach';
import { resyncReminders } from '@/slices/settings/reminders';
import type { GoalId } from '@/data/goals';
import { fingerprint } from './tools/actions';
import type { Conversation, DecisionEvent, ProposalRecord } from './types';
import { withPendingDecision } from './store';

export interface ApplyResult { ok: boolean; status: ProposalRecord['status']; message: string; undo?: () => void }

type Applier = (input: Record<string, unknown>) => { message: string; undo: () => void };
/** Undo is offered this long after Apply (ES-03). */
export const UNDO_WINDOW_MS = 8000;

/**
 * ES-03: each kind's Undo is a targeted inverse of what it changed. Anything done since (a
 * session started, a later weigh-in) stays. The live session (`active`) is never restored.
 */
const syncReminders = () => { void resyncReminders(); };
type Ex = { exerciseId: string; sets: number };
const restoreSplit = (saved: Split) => update(s => ({ ...s, splits: s.splits.map(sp => (sp.id === saved.id ? saved : sp)) }));

const APPLIERS: Record<string, Applier> = {
  propose_goal: input => {
    const before = state.value.goal;
    const restBefore = state.value.preferences.restDefaultSec;
    const restChanged = input.applyGoalRest === true;
    changeGoal(input.goal as GoalId, 'escobar');
    if (restChanged) applyGoalRest(input.goal as GoalId);
    return { message: 'Goal changed', undo: () => {
      changeGoal(before, 'escobar');
      if (restChanged) update(s => ({ ...s, preferences: { ...s.preferences, restDefaultSec: restBefore } }));
    } };
  },
  propose_split: input => {
    const exercises = (input.exercises as Ex[]) ?? [];
    if (input.action === 'create') {
      const sp = createSplit(String(input.name), exercises.map(e => ({ ...e })));
      if (!sp) throw new Error('split limit');
      setFocus(sp.id, (input.focus as MuscleId[]) ?? []);
      return { message: `Split ${sp.name} created`, undo: () => {
        if (state.value.active?.splitId === sp.id) throw new UndoUnavailable();
        deleteSplit(sp.id);
      } };
    }
    const saved = state.value.splits.find(x => x.id === input.splitId);
    if (!saved) throw new Error('unknown split');
    if (input.action === 'delete') {
      if (state.value.active?.splitId === saved.id) throw new Error('split in use');
      const index = state.value.splits.findIndex(x => x.id === saved.id);
      const days = WEEKDAYS.filter(d => state.value.schedule[d] === saved.id);
      deleteSplit(saved.id);
      return { message: 'Split deleted', undo: () => update(s => {
        const splits = [...s.splits];
        splits.splice(Math.min(index, splits.length), 0, saved);
        const schedule = { ...s.schedule };
        for (const d of days) if (schedule[d] == null) schedule[d] = saved.id;
        return { ...s, splits, schedule };
      }) };
    }
    update(s => ({ ...s, splits: s.splits.map(sp => (sp.id === input.splitId ? { ...sp, name: String(input.name).slice(0, 28), focus: ((input.focus as MuscleId[]) ?? []).slice(0, 2), exercises: exercises.map(e => ({ ...e })) } : sp)) }));
    return { message: 'Split updated', undo: () => restoreSplit(saved) };
  },
  propose_program: input => {
    // ES-05: a programme never replaces splits under a running session.
    if (state.value.active) throw new Error('session running');
    const savedSplits = state.value.splits;
    const savedSchedule = state.value.schedule;
    const draft = input.draft as PlanDraft;
    if (input.replaceExisting === true) update(s => ({ ...s, splits: [], schedule: emptySchedule() }));
    const idByRef: Record<string, string> = {};
    for (const d of draft.splits) {
      const sp = createSplit(d.name, d.exercises.map(e => ({ ...e })));
      if (!sp) throw new Error('split limit');
      idByRef[d.ref] = sp.id;
    }
    const created = new Set(Object.values(idByRef));
    update(s => ({ ...s, schedule: Object.fromEntries(WEEKDAYS.map(w => [w, draft.schedule[w] ? idByRef[draft.schedule[w]!] ?? null : null])) as AppState['schedule'] }));
    syncReminders();
    return { message: 'Programme saved', undo: () => {
      if (state.value.active && created.has(state.value.active.splitId)) throw new UndoUnavailable();
      update(s => {
        const kept = s.splits.filter(sp => !created.has(sp.id));
        const restored = savedSplits.filter(sp => !kept.some(k => k.id === sp.id));
        return { ...s, splits: [...restored, ...kept], schedule: savedSchedule };
      });
      syncReminders();
    } };
  },
  propose_schedule: input => {
    const before = state.value.schedule;
    update(s => ({ ...s, schedule: { ...(input.week as AppState['schedule']) } }));
    syncReminders();
    return { message: 'Schedule changed', undo: () => { update(s => ({ ...s, schedule: before })); syncReminders(); } };
  },
  propose_today: input => {
    const before = state.value.escobar.todayOverride;
    const splitId = String(input.splitId);
    const appliedAt = Date.now();
    update(s => ({ ...s, escobar: { ...s.escobar, todayOverride: { day: todayKey(), splitId, reason: String(input.reason ?? ''), changes: input.changes as TodayChange[] } } }));
    return { message: 'Today’s session adjusted', undo: () => {
      // QA-R4a-11: once a session of this split started with the change, undo cannot reach it.
      const used = (x: { splitId: string | null; startedAt: string } | null | undefined) => !!x && x.splitId === splitId && Date.parse(x.startedAt) >= appliedAt;
      if (used(state.value.active) || state.value.sessions.some(used)) throw new UndoUnavailable();
      update(s => ({ ...s, escobar: { ...s.escobar, todayOverride: before } }));
    } };
  },
  propose_deload: input => {
    const before = state.value.deload;
    acceptDeload(String(input.reason ?? 'A lighter week to recover.'));
    return { message: 'Lighter week started', undo: () => update(s => ({ ...s, deload: before })) };
  },
  propose_start_session: input => {
    const split = state.value.splits.find(x => x.id === input.splitId);
    if (!split || state.value.active) throw new Error('cannot start');
    startSession(split);
    const startedId = (state.value.active as AppState['active'])?.id;
    go('train');
    return { message: `${split.name} started`, undo: () => {
      const a = state.value.active;
      // Only an untouched session is undone; once a set is logged, the session is the person's.
      if (!a || a.id !== startedId || a.entries.some(e => e.sets.some(x => x.at))) throw new UndoUnavailable();
      discardSession();
    } };
  },
  propose_checkin: input => {
    const day = todayKey();
    const before = state.value.checkIns.find(c => c.day === day);
    update(s => {
      const cur = s.checkIns.find(c => c.day === day) ?? { day };
      const soreness = { ...(cur.soreness ?? {}), ...((input.soreness as CheckIn['soreness']) ?? {}) };
      const next: CheckIn = { ...cur, ...(input.sleepQuality != null ? { sleepQuality: input.sleepQuality as CheckIn['sleepQuality'] } : {}), ...(input.mood != null ? { mood: input.mood as CheckIn['mood'] } : {}), ...(Object.keys(soreness).length ? { soreness } : {}) };
      return { ...s, checkIns: [...s.checkIns.filter(c => c.day !== day), next].slice(-180) };
    });
    return { message: 'Check-in saved', undo: () => update(s => ({ ...s, checkIns: [...s.checkIns.filter(c => c.day !== day), ...(before ? [before] : [])].sort((a, b) => a.day.localeCompare(b.day)) })) };
  },
  propose_profile: input => {
    const field = String(input.field) as keyof AppState['profile'];
    const before = state.value.profile[field];
    const v = input.value;
    const day = todayKey();
    const logBefore = state.value.weightLog.find(w => w.day === day);
    switch (field) {
      case 'bodyWeightKg': logWeight(Number(v), 'escobar'); break;
      case 'heightCm': setHeight(Number(v), 'escobar'); break;
      case 'birthYear': setBirthYear(Number(v), 'escobar'); break;
      case 'sex': setSex(v as 'male' | 'female', 'escobar'); break;
      case 'trainingSince': setTrainingSince(String(v), 'escobar'); break;
      case 'plannedDays': setPlannedDays(Number(v), 'escobar'); break;
      default: throw new Error('unknown field');
    }
    const added = field === 'bodyWeightKg' ? { day, kg: Number(v) } : null;
    return { message: 'Profile updated', undo: () => update(s => ({
      ...s,
      profile: { ...s.profile, [field]: before },
      // Only the entry this change wrote: a later weigh-in stays.
      weightLog: added ? [...s.weightLog.filter(w => !(w.day === added.day && w.kg === added.kg)), ...(logBefore ? [logBefore] : [])].sort((a, b) => a.day.localeCompare(b.day)) : s.weightLog,
    })) };
  },
  propose_custom_exercise: input => {
    const primary = input.primary as MuscleId[];
    const ex: Exercise = { id: newId('custom'), name: String(input.name), equipment: String(input.equipment), primary, secondary: (input.secondary as MuscleId[]) ?? [], stabilizers: [], aliases: [], pattern: 'custom', defaultSets: 3, mode: input.mode as Exercise['mode'], role: input.role as Exercise['role'], custom: true };
    saveCustomExercise(ex);
    return { message: `${ex.name} added`, undo: () => update(s => ({ ...s, customExercises: s.customExercises.filter(e => e.id !== ex.id) })) };
  },
  propose_reminder: input => {
    const before = state.value.preferences.reminders;
    update(s => ({ ...s, preferences: { ...s.preferences, reminders: { ...s.preferences.reminders, enabled: input.enabled === true, time: String(input.time), style: input.style as AppState['preferences']['reminders']['style'], readinessSummary: input.readinessSummary === true } } }));
    // QA2-FB-2: Apply is the person's own tap, like the Settings reminder toggle, so it may ask for notification permission.
    void resyncReminders({ prompt: true });
    return { message: 'Reminders updated', undo: () => { update(s => ({ ...s, preferences: { ...s.preferences, reminders: before } })); syncReminders(); } };
  },
  propose_setting: input => {
    const { key, value } = input.setting as { key: string; value: unknown };
    const p = state.value.preferences as unknown as Record<string, unknown>;
    const before = key === 'rest.mode' ? state.value.preferences.rest.mode : p[key];
    const put = (v: unknown) => update(s => ({ ...s, preferences: key === 'rest.mode' ? { ...s.preferences, rest: { ...s.preferences.rest, mode: v as 'time' | 'heart' } } : { ...s.preferences, [key]: v } }));
    put(value);
    return { message: 'Setting changed', undo: () => put(before) };
  },
  propose_equipment_profile: input => {
    const scope = input.scope as 'exercise' | 'equipment';
    const key = String(input.key);
    const gymId = String(input.gymId);
    const table = scope === 'exercise' ? 'byExercise' : 'byEquipment';
    const before = (state.value.units[table] as Record<string, Record<string, EquipmentProfile>>)[gymId]?.[key];
    saveProfile(scope, key, input.profile as EquipmentProfile, gymId);
    return { message: 'Equipment saved', undo: () => update(s => {
      const byGym = { ...((s.units[table] as Record<string, Record<string, EquipmentProfile>>)[gymId] ?? {}) };
      if (before) byGym[key] = before; else delete byGym[key];
      return { ...s, units: { ...s.units, [table]: { ...s.units[table], [gymId]: byGym } } };
    }) };
  },
  propose_gym: input => {
    const activeBefore = state.value.units.activeGymId;
    const id = addGym(String(input.name), input.defaultUnit as LoadUnit);
    if (!id) throw new Error('gym limit');
    setActiveGym(id);
    return { message: `${String(input.name)} added`, undo: () => update(s => ({ ...s, units: { ...s.units, gyms: s.units.gyms.filter(g => g.id !== id), activeGymId: s.units.activeGymId === id ? activeBefore : s.units.activeGymId } })) };
  },
  pin_card: input => {
    const now = new Date();
    const days = typeof input.days === 'number' ? input.days : undefined;
    const pin: PinnedCard = { id: newId('pin'), component: input.component as PinnedCard['component'], params: (input.params as Record<string, unknown>) ?? {}, title: String(input.title), pinnedAt: now.toISOString(), ...(days ? { until: addDays(todayKey(), days) } : {}) };
    update(s => ({ ...s, escobar: { ...s.escobar, pins: [...s.escobar.pins, pin].slice(-MAX_PINS) } }));
    return { message: 'Pinned to Today', undo: () => update(s => ({ ...s, escobar: { ...s.escobar, pins: s.escobar.pins.filter(x => x.id !== pin.id) } })) };
  },
};

/** Thrown by an inverse that can no longer apply safely (the session has moved on). */
export class UndoUnavailable extends Error {}

export const canApply = (kind: string): boolean => kind in APPLIERS;

function withDecision(c: Conversation, p: ProposalRecord, decision: DecisionEvent['decision'], result?: string): Conversation {
  const at = new Date().toISOString();
  const marked = { ...c, proposals: (c.proposals ?? []).map(x => (x.id === p.id ? { ...x, status: decision, ...(decision === 'applied' ? { appliedAt: at } : {}) } : x)) };
  return withPendingDecision(marked, { proposalId: p.id, decision, at, title: p.title, ...(result ? { result } : {}) });
}

/** Pure decision step: returns the updated conversation and what happened. */
export function decide(c: Conversation, proposalId: string, choice: 'apply' | 'dismiss' | 'undo', undoFn?: () => void): { conversation: Conversation; result: ApplyResult } {
  const p = (c.proposals ?? []).find(x => x.id === proposalId);
  if (!p) return { conversation: c, result: { ok: false, status: 'failed', message: 'That suggestion is gone.' } };
  if (choice === 'dismiss') return { conversation: withDecision(c, p, 'dismissed'), result: { ok: true, status: 'dismissed', message: 'Dismissed' } };
  if (choice === 'undo') {
    // ES-03: no inverse (reloaded, expired, other conversation) means no undo, and nothing is recorded.
    const gone = { conversation: c, result: { ok: false, status: 'applied' as const, message: 'Undo is no longer available.' } };
    if (!undoFn) return gone;
    try { undoFn(); } catch (e) { if (e instanceof UndoUnavailable) return gone; throw e; }
    return { conversation: withDecision(c, p, 'undone'), result: { ok: true, status: 'undone', message: 'Undone' } };
  }
  const today = todayKey();
  if (p.expiresOn < today || fingerprint(p.kind, p.input, state.value) !== p.fingerprint) {
    return { conversation: withDecision(c, p, 'stale'), result: { ok: false, status: 'stale', message: 'Things changed since this was suggested. Ask again for a fresh one.' } };
  }
  const run = APPLIERS[p.kind];
  if (!run) return { conversation: withDecision(c, p, 'failed', 'not supported yet'), result: { ok: false, status: 'failed', message: 'This kind of change can’t be applied yet.' } };
  try {
    const r = run(p.input);
    return { conversation: withDecision(c, p, 'applied', r.message), result: { ok: true, status: 'applied', message: r.message, undo: r.undo } };
  } catch {
    return { conversation: withDecision(c, p, 'failed'), result: { ok: false, status: 'failed', message: 'That didn’t work. Nothing was changed.' } };
  }
}

/** Inverses by `${conversationId}:${proposalId}` (ES-04: ids repeat across conversations). Lost on reload. */
const undos = new Map<string, () => void>();
const undoKey = (conversationId: string, proposalId: string) => `${conversationId}:${proposalId}`;
export const hasUndo = (conversationId: string, proposalId: string): boolean => undos.has(undoKey(conversationId, proposalId));
/** Whether the card should still offer Undo. */
export const undoOpen = (conversationId: string, p: Pick<ProposalRecord, 'id' | 'appliedAt'>, now = Date.now()): boolean =>
  !!p.appliedAt && now - Date.parse(p.appliedAt) < UNDO_WINDOW_MS && hasUndo(conversationId, p.id);

/** UI entry: decide, persist through the session, toast with Undo. */
export async function onProposal(proposalId: string, choice: 'apply' | 'dismiss' | 'undo'): Promise<ApplyResult> {
  const session = await import('./session');
  const c = session.activeConversation.value;
  if (!c) return { ok: false, status: 'failed', message: 'No conversation.' };
  const key = undoKey(c.id, proposalId);
  let fn = undos.get(key);
  if (choice === 'undo') {
    const p = (c.proposals ?? []).find(x => x.id === proposalId);
    if (!p?.appliedAt || Date.now() - Date.parse(p.appliedAt) >= UNDO_WINDOW_MS) { undos.delete(key); fn = undefined; }
  }
  const { conversation, result } = decide(c, proposalId, choice, fn);
  if (conversation !== c) session.updateConversation(conversation);
  if (choice === 'apply' && result.ok && result.undo) {
    undos.set(key, result.undo);
    showToast(result.message, 'Undo', () => { void onProposal(proposalId, 'undo'); });
  } else if (choice === 'undo') { undos.delete(key); if (!result.ok) showToast(result.message); }
  else if (!result.ok) showToast(result.message);
  return result;
}

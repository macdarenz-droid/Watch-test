/**
 * Action proposals (§8.4, §10): validate what the model proposed against the current
 * state, and build the card the person sees (a title and before → after rows). Nothing
 * here writes state; `apply.ts` does that on Apply, after re-checking the fingerprint.
 */
import type { AppState, EquipmentProfile, TodayChange, Weekday } from '@/core/models';
import { WEEKDAYS, MAX_GYMS, MAX_PINS, SHOW_COMPONENT_IDS } from '@/core/models';
import { findExercise, findExerciseExact } from '@/core/exercises';
import { MUSCLE_IDS, muscleLabel, type MuscleId } from '@/data/muscles';
import { GOAL_BY_ID, isGoalId } from '@/data/goals';
import { WEEKDAY_LABEL, addDays } from '@/core/dates';
import { isWeightTypo } from '@/brain/onboarding';
import { evaluatePlan, hasBlockingIssues, type PlanDraft } from '@/brain/plan';
import { ToolError } from './read';
import { exerciseName, scheduledSplitFor, type ToolCtx } from './context';
import { fnv } from '../hash';

export const MAX_SPLITS = 7;
export const MAX_SPLIT_NAME = 28;
export const MAX_SPLIT_EXERCISES = 14;

export interface DiffRow { label: string; before?: string; after: string }

export interface Proposal {
  id: string;
  kind: string;
  input: Record<string, unknown>;
  title: string;
  preview: DiffRow[];
  /** Hash of the state this proposal touches; Apply refuses if it changed (§10.1). */
  fingerprint: string;
  createdAt: string;
  expiresOn: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isInt = (v: unknown, lo: number, hi: number): v is number => typeof v === 'number' && Number.isInteger(v) && v >= lo && v <= hi;

function exerciseId(ctx: ToolCtx, v: unknown, where: string): string {
  // ST-13: exact ids and names only; a proposal must never land on a guessed exercise.
  const ex = typeof v === 'string' ? findExerciseExact(v, ctx.state.customExercises) : undefined;
  if (!ex) throw new ToolError(`${where}: unknown exerciseId ${String(v)}; use search_exercises`);
  return ex.id;
}

function exerciseList(ctx: ToolCtx, v: unknown): Array<{ exerciseId: string; sets: number }> {
  if (!Array.isArray(v)) throw new ToolError('exercises must be a list');
  if (v.length > MAX_SPLIT_EXERCISES) throw new ToolError(`at most ${MAX_SPLIT_EXERCISES} exercises per split`);
  return v.map((e, i) => {
    if (!isObj(e)) throw new ToolError(`exercises[${i}] must be an object`);
    if (!isInt(e.sets, 1, 6)) throw new ToolError(`exercises[${i}].sets must be 1–6`);
    return { exerciseId: exerciseId(ctx, e.exerciseId, `exercises[${i}]`), sets: e.sets };
  });
}

function splitName(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) throw new ToolError('name is required');
  if (v.trim().length > MAX_SPLIT_NAME) throw new ToolError(`name must be at most ${MAX_SPLIT_NAME} characters`);
  return v.trim();
}

export function planDraftArg(v: unknown, ctx: ToolCtx): PlanDraft {
  if (!isObj(v) || !Array.isArray(v.splits) || !isObj(v.schedule)) throw new ToolError('draft needs splits and schedule');
  const refs = new Set<string>();
  const splits = v.splits.map((sp, i) => {
    if (!isObj(sp) || typeof sp.ref !== 'string' || !sp.ref) throw new ToolError(`splits[${i}] needs a ref`);
    if (refs.has(sp.ref)) throw new ToolError(`duplicate ref ${sp.ref}`);
    refs.add(sp.ref);
    if (!Array.isArray(sp.exercises)) throw new ToolError(`splits[${i}].exercises must be a list`);
    if (sp.exercises.length > MAX_SPLIT_EXERCISES) throw new ToolError(`splits[${i}] has more than ${MAX_SPLIT_EXERCISES} exercises`);
    // Unknown exercises and 0 sets are reported by evaluatePlan as blocking issues, so keep them.
    return { ref: sp.ref, name: splitName(sp.name), exercises: sp.exercises.map((e, j) => {
      if (!isObj(e) || typeof e.exerciseId !== 'string') throw new ToolError(`splits[${i}].exercises[${j}] needs an exerciseId`);
      const found = findExercise(e.exerciseId, ctx.state.customExercises);
      return { exerciseId: found?.id ?? e.exerciseId, sets: typeof e.sets === 'number' ? Math.round(e.sets) : 0 };
    }) };
  });
  const schedule = Object.fromEntries(WEEKDAYS.map(d => {
    const x = (v.schedule as Record<string, unknown>)[d];
    if (x !== null && typeof x !== 'string') throw new ToolError(`schedule.${d} must be a split ref or null`);
    return [d, x ?? null];
  })) as Record<Weekday, string | null>;
  return { splits, schedule };
}

// ---------- Fingerprints: the state each proposal touches ----------

export function touchedState(kind: string, input: Record<string, unknown>, s: AppState): unknown {
  switch (kind) {
    case 'propose_split': return input.action === 'create' ? s.splits.length : [s.splits.find(x => x.id === input.splitId) ?? null, s.active?.splitId ?? null];
    case 'propose_program': return [s.splits, s.schedule, !!s.active];
    case 'propose_schedule': return [s.schedule, s.splits.map(x => x.id)];
    case 'propose_goal': return s.goal;
    case 'propose_today': return [s.escobar.todayOverride, s.splits.find(x => x.id === input.splitId)?.exercises ?? null, !!s.active];
    case 'propose_deload': return s.deload;
    case 'propose_start_session': return [!!s.active, s.splits.find(x => x.id === input.splitId)?.exercises ?? null];
    case 'propose_checkin': return null;
    case 'propose_profile': return (s.profile as unknown as Record<string, unknown>)[String(input.field)] ?? null;
    case 'propose_custom_exercise': return s.customExercises.map(e => e.name.toLowerCase());
    case 'propose_reminder': return s.preferences.reminders;
    case 'propose_setting': return [s.preferences.rest.mode, s.preferences.autoRest, s.preferences.restDefaultSec, s.preferences.weightUnit, s.preferences.showSpark, s.preferences.haptics];
    case 'propose_equipment_profile': return [s.units.byExercise, s.units.byEquipment];
    case 'propose_gym': return s.units.gyms.map(g => g.name.toLowerCase());
    case 'pin_card': return s.escobar.pins.length;
    default: return null;
  }
}
export const fingerprint = (kind: string, input: Record<string, unknown>, s: AppState): string => fnv(JSON.stringify(touchedState(kind, input, s) ?? null));

// ---------- Validation and previews ----------

const exLabel = (ctx: ToolCtx, e: { exerciseId: string; sets: number }) => `${exerciseName(ctx, e.exerciseId)} × ${e.sets}`;

type Built = { title: string; preview: DiffRow[]; input: Record<string, unknown> };

function validateSplit(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const s = ctx.state;
  const action = i.action;
  if (action !== 'create' && action !== 'modify' && action !== 'delete') throw new ToolError('action must be create, modify or delete');
  const name = splitName(i.name);
  const focus = Array.isArray(i.focus) ? i.focus : [];
  if (focus.length > 2 || focus.some(m => !MUSCLE_IDS.includes(m as MuscleId))) throw new ToolError('focus must be up to 2 muscle ids');
  if (action === 'create') {
    if (s.splits.length >= MAX_SPLITS) throw new ToolError(`already ${MAX_SPLITS} splits; delete or modify one instead`);
    const exercises = exerciseList(ctx, i.exercises);
    if (!exercises.length) throw new ToolError('a new split needs at least one exercise');
    return { title: `Create split: ${name}`, input: { action, name, focus, exercises }, preview: exercises.map(e => ({ label: exerciseName(ctx, e.exerciseId), after: `${e.sets} sets` })) };
  }
  const split = s.splits.find(x => x.id === i.splitId);
  if (!split) throw new ToolError(`unknown splitId; current splits: ${s.splits.map(x => `${x.id} (${x.name})`).join(', ') || 'none'}`);
  // ES-05: never delete the split someone is training right now.
  if (action === 'delete' && s.active?.splitId === split.id) throw new ToolError('that split is being trained right now');
  if (action === 'delete') return { title: `Delete split: ${split.name}`, input: { action, splitId: split.id, name: split.name, exercises: [] }, preview: [{ label: split.name, before: `${split.exercises.length} exercises`, after: 'deleted' }] };
  const exercises = exerciseList(ctx, i.exercises);
  if (!exercises.length) throw new ToolError('a split needs at least one exercise');
  const rows: DiffRow[] = [];
  if (name !== split.name) rows.push({ label: 'Name', before: split.name, after: name });
  const before = new Map(split.exercises.map(e => [e.exerciseId, e.sets]));
  const after = new Map(exercises.map(e => [e.exerciseId, e.sets]));
  for (const [id, sets] of after) if (before.get(id) !== sets) rows.push({ label: exerciseName(ctx, id), ...(before.has(id) ? { before: `${before.get(id)} sets` } : { before: '—' }), after: `${sets} sets` });
  for (const [id, sets] of before) if (!after.has(id)) rows.push({ label: exerciseName(ctx, id), before: `${sets} sets`, after: 'removed' });
  if (JSON.stringify(focus) !== JSON.stringify(split.focus)) rows.push({ label: 'Focus', before: split.focus.map(muscleLabel).join(', ') || 'none', after: (focus as string[]).map(muscleLabel).join(', ') || 'none' });
  if (!rows.length) throw new ToolError('that is the split as it already is; nothing to change');
  return { title: `Change split: ${split.name}`, input: { action, splitId: split.id, name, focus, exercises }, preview: rows };
}

function validateProgram(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const draft = planDraftArg(i.draft, ctx);
  const replace = i.replaceExisting === true;
  const s = ctx.state;
  if (replace && s.active) throw new ToolError('a session is running; finish it before replacing the programme');
  if ((replace ? 0 : s.splits.length) + draft.splits.length > MAX_SPLITS) throw new ToolError(`that makes more than ${MAX_SPLITS} splits; set replaceExisting or use fewer`);
  const ev = evaluatePlan(draft, { goal: s.goal, custom: s.customExercises, sessions: s.sessions, today: ctx.today, trainingSince: s.profile.trainingSince });
  if (hasBlockingIssues(ev)) throw new ToolError(`evaluate_plan finds blocking issues; revise and try again: ${ev.issues.filter(x => x.severity === 'block').map(x => x.text).join(' ')}`);
  const preview: DiffRow[] = [
    ...draft.splits.map(sp => ({ label: sp.name, after: sp.exercises.map(e => exLabel(ctx, e)).join(', ') })),
    ...WEEKDAYS.map(d => ({ label: WEEKDAY_LABEL[d], before: s.splits.find(x => x.id === s.schedule[d])?.name ?? 'Rest', after: draft.splits.find(x => x.ref === draft.schedule[d])?.name ?? 'Rest' })),
  ];
  if (replace && s.splits.length) preview.unshift({ label: 'Current splits', before: s.splits.map(x => x.name).join(', '), after: 'replaced' });
  return { title: `New programme: ${draft.splits.map(x => x.name).join(' / ')}`, input: { draft, replaceExisting: replace }, preview };
}

function validateSchedule(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const s = ctx.state;
  if (!isObj(i.week)) throw new ToolError('week must have all 7 days');
  const week = {} as Record<Weekday, string | null>;
  for (const d of WEEKDAYS) {
    const v = (i.week as Record<string, unknown>)[d];
    if (v === undefined) throw new ToolError(`week.${d} is missing; give all 7 days`);
    if (v !== null && !s.splits.some(x => x.id === v)) throw new ToolError(`week.${d}: unknown split id ${String(v)}; use get_plan`);
    week[d] = (v as string | null);
  }
  const preview = WEEKDAYS.filter(d => week[d] !== s.schedule[d]).map(d => ({ label: WEEKDAY_LABEL[d], before: s.splits.find(x => x.id === s.schedule[d])?.name ?? 'Rest', after: s.splits.find(x => x.id === week[d])?.name ?? 'Rest' }));
  if (!preview.length) throw new ToolError('that is the current schedule; nothing to change');
  return { title: 'Change the weekly schedule', input: { week }, preview };
}

function validateToday(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const s = ctx.state;
  if (s.active) throw new ToolError('a session is already running; today’s changes apply when a session starts');
  const split = s.splits.find(x => x.id === i.splitId);
  if (!split) throw new ToolError('unknown splitId; use get_plan');
  const scheduled = scheduledSplitFor(ctx);
  if (scheduled && scheduled.id !== split.id && i.explicit === false) throw new ToolError(`today's scheduled split is ${scheduled.name}`);
  if (!Array.isArray(i.changes) || !i.changes.length) throw new ToolError('changes must list at least one change');
  const inSplit = new Set(split.exercises.map(e => e.exerciseId));
  const changes: TodayChange[] = i.changes.map((c, n) => {
    if (!isObj(c)) throw new ToolError(`changes[${n}] must be an object`);
    const need = (v: unknown) => { const id = exerciseId(ctx, v, `changes[${n}]`); if (!inSplit.has(id)) throw new ToolError(`changes[${n}]: ${exerciseName(ctx, id)} is not in ${split.name}`); return id; };
    switch (c.kind) {
      case 'swap': { const from = need(c.from), to = exerciseId(ctx, c.to, `changes[${n}].to`); if (to === from) throw new ToolError(`changes[${n}]: a swap needs a different exercise`); return { kind: 'swap', from, to }; } // QA2-FD-9
      case 'remove': return { kind: 'remove', exerciseId: need(c.exerciseId) };
      case 'add': if (!isInt(c.sets, 1, 6)) throw new ToolError(`changes[${n}].sets must be 1–6`); return { kind: 'add', exerciseId: exerciseId(ctx, c.exerciseId, `changes[${n}]`), sets: c.sets };
      case 'sets': if (!isInt(c.sets, 1, 6)) throw new ToolError(`changes[${n}].sets must be 1–6`); return { kind: 'sets', exerciseId: need(c.exerciseId), sets: c.sets };
      case 'load': if (typeof c.factor !== 'number' || c.factor < 0.5 || c.factor > 1.1) throw new ToolError(`changes[${n}].factor must be 0.5–1.1`); return { kind: 'load', exerciseId: need(c.exerciseId), factor: Math.round(c.factor * 100) / 100 };
      default: throw new ToolError(`changes[${n}].kind must be swap, remove, add, sets or load`);
    }
  });
  const reason = typeof i.reason === 'string' && i.reason.trim() ? i.reason.replace(/[\r\n]+/g, ' ').trim().slice(0, 140) : 'Adjusted for today';
  const preview = changes.map((c): DiffRow => {
    switch (c.kind) {
      case 'swap': return { label: exerciseName(ctx, c.from), before: 'planned', after: `swap for ${exerciseName(ctx, c.to)}` };
      case 'remove': return { label: exerciseName(ctx, c.exerciseId), before: 'planned', after: 'skip today' };
      case 'add': return { label: exerciseName(ctx, c.exerciseId), before: '—', after: `add ${c.sets} sets` };
      case 'sets': return { label: exerciseName(ctx, c.exerciseId), before: `${split.exercises.find(e => e.exerciseId === c.exerciseId)?.sets} sets`, after: `${c.sets} sets` };
      case 'load': return { label: exerciseName(ctx, c.exerciseId), before: 'planned load', after: `${Math.round(c.factor * 100)}% of the target` };
    }
  });
  return { title: `Today's ${split.name}: ${reason}`, input: { splitId: split.id, changes, reason }, preview };
}

function validateProfile(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const p = ctx.state.profile;
  const field = i.field;
  const v = i.value;
  const numV = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  switch (field) {
    case 'bodyWeightKg': {
      if (!(numV >= 30 && numV <= 300)) throw new ToolError('bodyWeightKg must be 30–300');
      const warn = isWeightTypo(numV, p.bodyWeightKg);
      return { title: 'Log body weight', input: { field, value: Math.round(numV * 10) / 10 }, preview: [{ label: 'Body weight', before: p.bodyWeightKg != null ? `${p.bodyWeightKg} kg` : '—', after: `${Math.round(numV * 10) / 10} kg${warn ? ' (a big jump: check it)' : ''}` }] };
    }
    case 'heightCm': if (!(numV >= 120 && numV <= 230)) throw new ToolError('heightCm must be 120–230'); return { title: 'Update height', input: { field, value: Math.round(numV) }, preview: [{ label: 'Height', before: p.heightCm != null ? `${p.heightCm} cm` : '—', after: `${Math.round(numV)} cm` }] };
    case 'birthYear': { const y = new Date(ctx.now).getFullYear(); if (!(Number.isInteger(numV) && numV >= y - 100 && numV <= y - 10)) throw new ToolError(`birthYear must be ${y - 100}–${y - 10}`); return { title: 'Update birth year', input: { field, value: numV }, preview: [{ label: 'Birth year', before: p.birthYear != null ? String(p.birthYear) : '—', after: String(numV) }] }; }
    case 'sex': if (v !== 'male' && v !== 'female') throw new ToolError('sex must be male or female'); return { title: 'Update sex', input: { field, value: v }, preview: [{ label: 'Sex', before: p.sex ?? '—', after: v }] };
    case 'trainingSince': if (typeof v !== 'string' || !/^\d{4}-\d{2}$/.test(v)) throw new ToolError('trainingSince must be YYYY-MM'); return { title: 'Update training since', input: { field, value: v }, preview: [{ label: 'Training since', before: p.trainingSince ?? '—', after: v }] };
    case 'plannedDays': if (!(Number.isInteger(numV) && numV >= 1 && numV <= 7)) throw new ToolError('plannedDays must be 1–7'); return { title: 'Update planned days', input: { field, value: numV }, preview: [{ label: 'Planned days a week', before: p.plannedDays != null ? String(p.plannedDays) : '—', after: String(numV) }] };
    default: throw new ToolError('field must be bodyWeightKg, heightCm, birthYear, sex, trainingSince or plannedDays');
  }
}

const SETTING_KEYS = ['rest.mode', 'autoRest', 'restDefaultSec', 'weightUnit', 'showSpark', 'haptics'];

function validateSetting(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const p = ctx.state.preferences;
  const st = isObj(i.setting) ? i.setting : i;
  const key = st.key, value = st.value;
  if (!SETTING_KEYS.includes(String(key))) throw new ToolError(`setting key must be one of ${SETTING_KEYS.join(', ')}`);
  const labels: Record<string, string> = { 'rest.mode': 'Rest ends by', autoRest: 'Start rest after each set', restDefaultSec: 'Rest length', weightUnit: 'Show weights in', showSpark: 'Daily quote', haptics: 'Haptic feedback' };
  const before: Record<string, unknown> = { 'rest.mode': p.rest.mode, autoRest: p.autoRest, restDefaultSec: p.restDefaultSec, weightUnit: p.weightUnit, showSpark: p.showSpark, haptics: p.haptics };
  const ok = key === 'rest.mode' ? value === 'time' || value === 'heart'
    : key === 'weightUnit' ? value === 'kg' || value === 'lb'
    : key === 'restDefaultSec' ? isInt(value, 15, 600) && value % 15 === 0
    : typeof value === 'boolean';
  if (!ok) throw new ToolError(`invalid value for ${String(key)}`);
  if (before[String(key)] === value) throw new ToolError(`${String(key)} is already ${String(value)}`);
  const show = (x: unknown) => (typeof x === 'boolean' ? (x ? 'on' : 'off') : key === 'restDefaultSec' ? `${x} s` : key === 'rest.mode' ? (x === 'heart' ? 'heart rate' : 'timer') : String(x));
  return { title: `Change setting: ${labels[String(key)]}`, input: { setting: { key, value } }, preview: [{ label: labels[String(key)]!, before: show(before[String(key)]), after: show(value) }] };
}

function validateEquipmentProfile(i: Record<string, unknown>, ctx: ToolCtx): Built {
  const u = ctx.state.units;
  const gymId = typeof i.gymId === 'string' ? i.gymId : u.activeGymId;
  const gym = u.gyms.find(g => g.id === gymId);
  if (!gym) throw new ToolError(`unknown gymId; gyms: ${u.gyms.map(g => `${g.id} (${g.name})`).join(', ')}`);
  const scope = i.scope;
  let key: string;
  let what: string;
  if (scope === 'exercise') { key = exerciseId(ctx, i.exerciseId, 'exerciseId'); what = exerciseName(ctx, key); }
  else if (scope === 'equipment') {
    const groups = ['Barbell', 'Dumbbells', 'Machine', 'Cable', 'Smith Machine', 'Bodyweight', 'Sled', 'General'];
    if (typeof i.equipmentGroup !== 'string' || !groups.includes(i.equipmentGroup)) throw new ToolError(`equipmentGroup must be one of ${groups.join(', ')}`);
    key = i.equipmentGroup; what = `All ${key}`;
  } else throw new ToolError('scope must be exercise or equipment');
  const p = isObj(i.profile) ? i.profile : {};
  if (p.unit !== 'kg' && p.unit !== 'lb') throw new ToolError('profile.unit must be kg or lb');
  const profile: EquipmentProfile = { unit: p.unit, source: 'escobar_chat', updatedAt: new Date(ctx.now).toISOString() };
  if (p.step != null) { if (!(typeof p.step === 'number' && p.step > 0 && p.step <= 50)) throw new ToolError('step must be above 0 (and at most 50)'); profile.step = p.step; }
  if (p.ladder != null) {
    if (!Array.isArray(p.ladder) || !p.ladder.every(x => typeof x === 'number' && x > 0)) throw new ToolError('ladder must be positive numbers');
    if (p.ladder.length > 80) throw new ToolError('ladder can hold at most 80 values');
    for (let k = 1; k < p.ladder.length; k++) if ((p.ladder[k] as number) <= (p.ladder[k - 1] as number)) throw new ToolError('ladder must be ascending');
    if (p.ladder.length) profile.ladder = p.ladder as number[];
  }
  if (p.addOns != null) { if (!Array.isArray(p.addOns) || p.addOns.length > 6 || !p.addOns.every(x => typeof x === 'number' && x > 0)) throw new ToolError('addOns must be up to 6 positive numbers'); if (p.addOns.length) profile.addOns = p.addOns as number[]; }
  if (p.barKg != null) { if (!(typeof p.barKg === 'number' && p.barKg >= 5 && p.barKg <= 30)) throw new ToolError('barKg must be 5–30'); profile.barKg = p.barKg; }
  if (p.plates != null) { if (!Array.isArray(p.plates) || p.plates.length > 12 || !p.plates.every(x => typeof x === 'number' && x > 0)) throw new ToolError('plates must be up to 12 positive numbers'); if (p.plates.length) profile.plates = [...(p.plates as number[])].sort((a, b) => b - a); }
  const parts = [profile.unit, profile.step ? `${profile.step} ${profile.unit} steps` : '', profile.ladder ? `${profile.ladder[0]}–${profile.ladder[profile.ladder.length - 1]} ${profile.unit}` : '', profile.addOns ? `add-on ${profile.addOns.join(', ')} ${profile.unit}` : '', profile.barKg ? `bar ${profile.barKg} kg` : '', profile.plates ? `plates ${profile.plates.join(', ')}` : ''].filter(Boolean);
  const current = scope === 'exercise' ? u.byExercise[gymId]?.[key] : u.byEquipment[gymId]?.[key];
  if (i.fromPhoto === true) profile.source = 'escobar_scan';
  return { title: `${what} at ${gym.name}: ${parts.join(', ')}`, input: { scope, key, gymId, profile, ...(scope === 'exercise' ? { exerciseId: key } : { equipmentGroup: key }) }, preview: [{ label: what, before: current ? current.unit : gym.defaultUnit + ' (gym default)', after: parts.join(' · ') }] };
}

/** Validates an action tool's input and builds its card. Throws ToolError with a fix-it message. */
export function buildAction(name: string, raw: unknown, ctx: ToolCtx): Built {
  const i = isObj(raw) ? raw : {};
  const s = ctx.state;
  switch (name) {
    case 'propose_split': return validateSplit(i, ctx);
    case 'propose_program': return validateProgram(i, ctx);
    case 'propose_schedule': return validateSchedule(i, ctx);
    case 'propose_goal': {
      if (!isGoalId(i.goal)) throw new ToolError('unknown goal');
      if (i.goal === s.goal) throw new ToolError(`the goal is already ${GOAL_BY_ID[i.goal].name}`);
      const g = GOAL_BY_ID[i.goal], cur = GOAL_BY_ID[s.goal];
      return { title: `Switch goal to ${g.name}`, input: { goal: i.goal, applyGoalRest: i.applyGoalRest === true }, preview: [{ label: 'Goal', before: cur.name, after: g.name }, { label: 'Main lifts', before: `${cur.mainReps[0]}–${cur.mainReps[1]} reps`, after: `${g.mainReps[0]}–${g.mainReps[1]} reps` }, ...(i.applyGoalRest === true ? [{ label: 'Rest', before: `${s.preferences.restDefaultSec} s`, after: `${g.restDefaultSec} s` }] : [])] };
    }
    case 'propose_today': return validateToday(i, ctx);
    case 'propose_deload': {
      if (s.deload && s.deload.endDay >= ctx.today) throw new ToolError('a lighter week is already running');
      const reason = typeof i.reason === 'string' && i.reason.trim() ? i.reason.replace(/[\r\n]+/g, ' ').trim().slice(0, 140) : 'A lighter week to recover.';
      return { title: 'Take a lighter week', input: { reason }, preview: [{ label: 'Next 7 days', before: 'normal', after: 'fewer sets, lighter loads' }, { label: 'Ends', after: addDays(ctx.today, 6) }] };
    }
    case 'propose_start_session': {
      if (s.active) throw new ToolError('a session is already running');
      const split = s.splits.find(x => x.id === i.splitId);
      if (!split) throw new ToolError('unknown splitId; use get_plan');
      if (!split.exercises.length) throw new ToolError(`${split.name} has no exercises`);
      return { title: `Start ${split.name}`, input: { splitId: split.id }, preview: [{ label: split.name, after: `${split.exercises.length} exercises` }] };
    }
    case 'propose_checkin': {
      const rate = (v: unknown, name2: string): number | undefined => { if (v == null) return undefined; const n = Number(v); if (!isInt(n, 1, 5)) throw new ToolError(`${name2} must be 1–5`); return n; };
      const sleepQuality = rate(i.sleepQuality, 'sleepQuality'), mood = rate(i.mood, 'mood');
      const soreness: Partial<Record<MuscleId, number>> = {};
      if (i.soreness != null) {
        if (!Array.isArray(i.soreness)) throw new ToolError('soreness must be a list of {muscle, level}');
        for (const x of i.soreness) {
          if (!isObj(x) || !MUSCLE_IDS.includes(x.muscle as MuscleId)) throw new ToolError('soreness needs muscle ids');
          soreness[x.muscle as MuscleId] = rate(x.level, 'soreness level');
        }
      }
      if (sleepQuality == null && mood == null && !Object.keys(soreness).length) throw new ToolError('give at least one of sleepQuality, mood or soreness');
      const rows: DiffRow[] = [];
      if (sleepQuality != null) rows.push({ label: 'Sleep quality', after: `${sleepQuality} of 5` });
      if (mood != null) rows.push({ label: 'Mood', after: `${mood} of 5` });
      for (const [m, l] of Object.entries(soreness)) rows.push({ label: `${muscleLabel(m)} soreness`, after: `${l} of 5` });
      return { title: "Save today's check-in", input: { sleepQuality, mood, soreness }, preview: rows };
    }
    case 'propose_profile': return validateProfile(i, ctx);
    case 'propose_custom_exercise': {
      const nm = typeof i.name === 'string' ? i.name.trim() : '';
      if (!nm || nm.length > 60) throw new ToolError('name must be 1–60 characters');
      if (findExerciseExact(nm, s.customExercises)) throw new ToolError(`${nm} already exists; use search_exercises`);
      const primary = Array.isArray(i.primary) ? i.primary : [];
      if (primary.length < 1 || primary.length > 2 || primary.some(m => !MUSCLE_IDS.includes(m as MuscleId))) throw new ToolError('primary must be 1–2 muscle ids');
      const secondary = Array.isArray(i.secondary) ? i.secondary : [];
      if (secondary.some(m => !MUSCLE_IDS.includes(m as MuscleId))) throw new ToolError('secondary must be muscle ids');
      const modes = ['weighted', 'bodyweight', 'assisted', 'duration', 'conditioning'];
      if (!modes.includes(String(i.mode))) throw new ToolError(`mode must be one of ${modes.join(', ')}`);
      if (i.role !== 'main' && i.role !== 'accessory') throw new ToolError('role must be main or accessory');
      const equipment = typeof i.equipment === 'string' && i.equipment.trim() ? i.equipment.trim() : 'Other';
      return { title: `Add exercise: ${nm}`, input: { name: nm, equipment, primary, secondary, mode: i.mode, role: i.role }, preview: [{ label: nm, after: `${equipment} · ${(primary as string[]).map(muscleLabel).join(', ')}` }] };
    }
    case 'propose_reminder': {
      const r = s.preferences.reminders;
      if (typeof i.enabled !== 'boolean') throw new ToolError('enabled is required');
      if (i.time != null && (typeof i.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(i.time))) throw new ToolError('time must be HH:MM');
      if (i.style != null && !['silent', 'vibrate', 'alert'].includes(String(i.style))) throw new ToolError('style must be silent, vibrate or alert');
      const next = { enabled: i.enabled, time: (i.time as string) ?? r.time, style: (i.style as string) ?? r.style, readinessSummary: typeof i.readinessSummary === 'boolean' ? i.readinessSummary : !!r.readinessSummary };
      const rows: DiffRow[] = [];
      if (next.enabled !== r.enabled) rows.push({ label: 'Reminders', before: r.enabled ? 'on' : 'off', after: next.enabled ? 'on' : 'off' });
      if (next.time !== r.time) rows.push({ label: 'Time', before: r.time, after: next.time });
      if (next.style !== r.style) rows.push({ label: 'Style', before: r.style, after: next.style });
      if (next.readinessSummary !== !!r.readinessSummary) rows.push({ label: 'Readiness summary', before: r.readinessSummary ? 'on' : 'off', after: next.readinessSummary ? 'on' : 'off' });
      if (!rows.length) throw new ToolError('those are the current reminder settings');
      return { title: 'Change training reminders', input: next, preview: rows };
    }
    case 'propose_setting': return validateSetting(i, ctx);
    case 'propose_equipment_profile': return validateEquipmentProfile(i, ctx);
    case 'propose_gym': {
      const nm = typeof i.name === 'string' ? i.name.trim() : '';
      if (!nm || nm.length > 28) throw new ToolError('name must be 1–28 characters');
      if (i.defaultUnit !== 'kg' && i.defaultUnit !== 'lb') throw new ToolError('defaultUnit must be kg or lb');
      if (s.units.gyms.length >= MAX_GYMS) throw new ToolError(`already ${MAX_GYMS} gyms`);
      if (s.units.gyms.some(g => g.name.toLowerCase() === nm.toLowerCase())) throw new ToolError(`a gym called ${nm} already exists`);
      return { title: `Add gym: ${nm}`, input: { name: nm, defaultUnit: i.defaultUnit }, preview: [{ label: nm, after: `mostly ${i.defaultUnit}, active now` }] };
    }
    case 'pin_card': {
      if (!SHOW_COMPONENT_IDS.includes(i.component as never)) throw new ToolError('unknown component');
      if (s.escobar.pins.length >= MAX_PINS) throw new ToolError(`Today already has ${MAX_PINS} pinned cards; unpin one first`);
      const title = typeof i.title === 'string' && i.title.trim() ? i.title.trim().slice(0, 60) : 'Pinned card';
      const days = i.days == null ? undefined : Number(i.days);
      if (days != null && !isInt(days, 1, 42)) throw new ToolError('days must be 1–42');
      return { title: `Pin to Today: ${title}`, input: { component: i.component, params: isObj(i.params) ? i.params : {}, title, ...(days ? { days } : {}) }, preview: [{ label: title, after: days ? `pinned for ${days} days` : 'pinned until you unpin it' }] };
    }
    default: throw new ToolError(`unknown action ${name}`);
  }
}

let seq = 0;
export function buildProposal(name: string, raw: unknown, ctx: ToolCtx, idHint?: string): Proposal {
  const b = buildAction(name, raw, ctx);
  return {
    id: idHint ?? `p${++seq}`,
    kind: name,
    input: b.input,
    title: b.title,
    preview: b.preview,
    fingerprint: fingerprint(name, b.input, ctx.state),
    createdAt: new Date(ctx.now).toISOString(),
    expiresOn: addDays(ctx.today, 1),
  };
}



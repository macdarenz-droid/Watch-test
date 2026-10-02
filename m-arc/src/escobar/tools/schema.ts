/**
 * The single source of truth for Escobar's tools (§8). `scripts/escobar-tools.mjs` writes
 * the API-facing subset (name, description, input_schema, strict) to the Worker; a test
 * fails when the two drift. Schemas avoid every keyword the API rejects (no minimum,
 * maximum, lengths, patterns or item counts): ranges live in descriptions and are
 * enforced by the executor.
 */
import { MUSCLE_IDS } from '@/data/muscles';
import { GOALS } from '@/data/goals';
import { SHOW_COMPONENT_IDS, WEEKDAYS, MEMORY_KINDS } from '@/core/models';
import { METHOD_IDS } from '../knowledge/methodIds';

export type ToolKind = 'read' | 'show' | 'act' | 'memory' | 'meta';
type Json = Record<string, unknown>;

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Json;
  strict?: boolean;
  kind: ToolKind;
  /** The activity line template while it runs; `{exercise}` resolves from `exerciseId`. */
  status: string;
  gate?: 'health' | 'body';
}

const str = (description?: string): Json => (description ? { type: 'string', description } : { type: 'string' });
const int = (description: string): Json => ({ type: 'integer', description });
const num = (description: string): Json => ({ type: 'number', description });
const bool = (description: string): Json => ({ type: 'boolean', description });
const en = (values: readonly string[], description?: string): Json => ({ type: 'string', enum: [...values], ...(description ? { description } : {}) });
const arr = (items: Json, description?: string): Json => ({ type: 'array', items, ...(description ? { description } : {}) });
const obj = (properties: Record<string, Json>, required: string[] = []): Json => ({ type: 'object', properties, required, additionalProperties: false });

const MUSCLE = en(MUSCLE_IDS);
const DAY = str('A date, YYYY-MM-DD.');
const EXERCISE_ID = str('An exercise id from search_exercises or get_plan, e.g. lib_barbell_bench_press.');
const RATING = en(['1', '2', '3', '4', '5']);

const PLAN_DRAFT = obj({
  splits: arr(obj({
    ref: str('A short id for this split inside the draft, e.g. "push".'),
    name: str('Split name, at most 28 characters.'),
    exercises: arr(obj({ exerciseId: EXERCISE_ID, sets: int('Sets per session, 1–6.') }, ['exerciseId', 'sets']), 'At most 14 exercises.'),
  }, ['ref', 'name', 'exercises']), 'At most 7 splits.'),
  schedule: obj(Object.fromEntries(WEEKDAYS.map(d => [d, { type: ['string', 'null'], description: 'A split ref from this draft, or null for rest.' }])), [...WEEKDAYS]),
}, ['splits', 'schedule']);

const PERIOD = obj({ from: DAY, to: DAY }, ['from', 'to']);

/** One params object per show component (§4.4). */
export const COMPONENT_PARAMS: Record<string, Json> = {
  lift_trend: obj({ exerciseId: EXERCISE_ID, weeks: int('4–52, default 12.'), metric: en(['e1rm', 'top_set', 'volume'], 'Default e1rm.') }, ['exerciseId']),
  recovery_map: obj({ at: str('Optional ISO time up to 7 days ahead, to project recovery.') }),
  volume_bars: obj({ weeks: int('1–12, default 1.'), muscles: arr(MUSCLE) }),
  readiness_gauge: obj({ day: DAY }),
  readiness_history: obj({ days: int('7–30, default 14.') }),
  week_summary: obj({ offsetWeeks: int('0 = this week, up to 8 weeks back.') }),
  session_summary: obj({ sessionId: str('From get_sessions.') }, ['sessionId']),
  records_list: obj({ exerciseId: EXERCISE_ID, limit: int('1–10, default 5.') }),
  plan_week: obj({ draft: PLAN_DRAFT }),
  plan_evaluation: obj({ draft: PLAN_DRAFT }, ['draft']),
  exercise_card: obj({ exerciseId: EXERCISE_ID }, ['exerciseId']),
  heart_session: obj({ sessionId: str('From get_sessions.') }, ['sessionId']),
  compare_periods: obj({ metric: en(['sets', 'volume', 'sessions', 'e1rm']), exerciseId: EXERCISE_ID, a: PERIOD, b: PERIOD }, ['metric', 'a', 'b']),
  body_trend: obj({ weeks: int('4–52, default 12.') }),
};
const COMPONENT_ANY = { anyOf: SHOW_COMPONENT_IDS.map(id => COMPONENT_PARAMS[id]!) };

const CALC_ARGS: Record<string, Json> = {
  bmi: obj({ kg: num('Body weight in kg.'), cm: num('Height in cm.') }, ['kg', 'cm']),
  weight_for_bmi: obj({ bmi: num('Target BMI.'), cm: num('Height in cm.') }, ['bmi', 'cm']),
  e1rm: obj({ kg: num('Load in kg.'), reps: int('1–10.'), effort: en(['easy', 'ideal', 'max']) }, ['kg', 'reps']),
  load_for_reps: obj({ e1rm: num('Estimated one-rep max in kg.'), reps: int('1–15.') }, ['e1rm', 'reps']),
  percent_change: obj({ from: num('Start value.'), to: num('End value.') }, ['from', 'to']),
  convert_load: obj({ value: num('The load.'), from: en(['kg', 'lb']), to: en(['kg', 'lb']) }, ['value', 'from', 'to']),
  plate_breakdown: obj({ kg: num('Total bar load in kg.'), barKg: num('Bar weight in kg; default from the gym.'), exerciseId: EXERCISE_ID }, ['kg']),
  weekly_rate: obj({ fromKg: num('Start weight in kg.'), toKg: num('End weight in kg.'), weeks: num('Weeks between them.') }, ['fromKg', 'toKg', 'weeks']),
  protein_range: obj({ kg: num('Body weight in kg.'), gPerKgLow: num('Low end g/kg, e.g. 1.6.'), gPerKgHigh: num('High end g/kg, e.g. 2.2.') }, ['kg', 'gPerKgLow', 'gPerKgHigh']),
  days_between: obj({ from: DAY, to: DAY }, ['from', 'to']),
};
export const CALC_OPS = Object.keys(CALC_ARGS);

const SETTING = {
  anyOf: [
    obj({ key: en(['rest.mode']), value: en(['time', 'heart']) }, ['key', 'value']),
    obj({ key: en(['autoRest']), value: { type: 'boolean' } }, ['key', 'value']),
    obj({ key: en(['restDefaultSec']), value: int('15–600 seconds, in steps of 15.') }, ['key', 'value']),
    obj({ key: en(['weightUnit']), value: en(['kg', 'lb']) }, ['key', 'value']),
    obj({ key: en(['showSpark']), value: { type: 'boolean' } }, ['key', 'value']),
    obj({ key: en(['haptics']), value: { type: 'boolean' } }, ['key', 'value']),
  ],
};

const EQUIPMENT_PROFILE = obj({
  unit: en(['kg', 'lb']),
  step: num('Smallest jump in the unit, above 0.'),
  ladder: arr({ type: 'number' }, 'Available loads in the unit, ascending, at most 80.'),
  addOns: arr({ type: 'number' }, 'Stack add-on weights in the unit.'),
  barKg: num('Bar weight in kg, 5–30.'),
  plates: arr({ type: 'number' }, 'Plate sizes per side, in the unit.'),
}, ['unit']);

const TODAY_CHANGE = {
  anyOf: [
    obj({ kind: en(['swap']), from: EXERCISE_ID, to: EXERCISE_ID }, ['kind', 'from', 'to']),
    obj({ kind: en(['remove']), exerciseId: EXERCISE_ID }, ['kind', 'exerciseId']),
    obj({ kind: en(['add']), exerciseId: EXERCISE_ID, sets: int('1–6.') }, ['kind', 'exerciseId', 'sets']),
    obj({ kind: en(['sets']), exerciseId: EXERCISE_ID, sets: int('1–6.') }, ['kind', 'exerciseId', 'sets']),
    obj({ kind: en(['load']), exerciseId: EXERCISE_ID, factor: num('0.5–1.1 times the planned load.') }, ['kind', 'exerciseId', 'factor']),
  ],
};

/**
 * Strict (grammar-constrained) inputs only for small, flat tools. The API compiles every strict
 * schema of a request into one grammar and rejects it past a size limit (and past 16 union-typed
 * parameters); the larger action tools are validated by the app (`actions.ts`) instead.
 */
export const STRICT_TOOLS = new Set(['propose_goal', 'propose_deload', 'propose_start_session', 'propose_gym', 'snooze_insight', 'escalate', 'remember', 'forget']);
const T = (d: ToolDef): ToolDef => {
  const { strict: _ignored, ...rest } = d;
  return STRICT_TOOLS.has(d.name) ? { ...rest, strict: true } : rest;
};

export const TOOLS: ToolDef[] = [
  // Read tools
  T({ name: 'get_overview', kind: 'read', status: 'Looking at today…', description: "Today at a glance: scheduled split, readiness, the least-recovered muscles, this week's counts, streak, an active lighter week or today's adjustment, days since the last session. Call it first when a question is about today or 'how am I doing'.", input_schema: obj({}) }),
  T({ name: 'get_sessions', kind: 'read', status: 'Reading your sessions…', description: 'List logged sessions (newest first) with day, split, duration, set count and top lifts. Use it to find a session id or to see what was trained when.', input_schema: obj({ from: DAY, to: DAY, splitId: str('Only this split.'), limit: int('1–20, default 10.') }) }),
  T({ name: 'get_session', kind: 'read', status: 'Opening that session…', description: 'Every set of one session (load, reps, effort, flags), its post-session notes, and a heart summary when health sharing is on. Use after get_sessions.', input_schema: obj({ sessionId: str('From get_sessions.') }, ['sessionId']) }),
  T({ name: 'get_exercise_history', kind: 'read', status: 'Reading your {exercise} history…', description: 'Per-session history of one exercise, newest session first: top set, strength estimate (e1RM), effort mix; plus plateau status, trend, records and effort drift. Call it for any question about progress, stalls or a specific lift.', input_schema: obj({ exerciseId: EXERCISE_ID, weeks: int('1–52, default 12.') }, ['exerciseId']) }),
  T({ name: 'get_next_target', kind: 'read', status: 'Working out the next {exercise} target…', description: "The app's next-session target for an exercise (load, reps, reason, confidence), snapped to the equipment's loads, with a warm-up ramp and the primary muscles' recovery. Use for 'what should I lift'.", input_schema: obj({ exerciseId: EXERCISE_ID, plannedSets: int('1–6.') }, ['exerciseId']) }),
  T({ name: 'get_recovery', kind: 'read', status: 'Checking recovery…', description: "Recovery per muscle: percent, hours until ready, when fully recovered, top drivers and confidence. Pass `at` (ISO, up to 7 days ahead) to project. `soreToday` marks a muscle that today's soreness rating alone is holding back, past what the model's clock would otherwise say; hoursLeft and fullInHours are null there rather than a misleading 0. Use for soreness, readiness to train a muscle, or scheduling.", input_schema: obj({ muscles: arr(MUSCLE), at: str('Optional ISO time, up to 7 days ahead.') }) }),
  T({ name: 'get_readiness', kind: 'read', status: 'Checking readiness…', description: "Today's (or a past day's) readiness: score, band, drivers, load advice, confidence, the baselines it compares against, and optionally the band for recent days. Use for 'why am I amber/red' or 'should I train hard'.", input_schema: obj({ day: DAY, historyDays: int('0–30, default 0.') }) }),
  T({ name: 'get_volume', kind: 'read', status: 'Counting your weekly sets…', description: "Weekly effective sets per muscle against the person's volume band, with the 4-week median, plus weekly totals. Use for volume, balance or 'am I doing enough'.", input_schema: obj({ weeks: int('1–12, default 4.'), muscles: arr(MUSCLE) }) }),
  T({ name: 'get_records', kind: 'read', status: 'Looking up your records…', description: 'Personal records, newest first, optionally for one exercise.', input_schema: obj({ exerciseId: EXERCISE_ID, limit: int('1–20, default 10.') }) }),
  T({ name: 'get_insights', kind: 'read', status: "Reading the coach's notes…", description: "Every current coach insight (not just the top three) with id, category, priority, title, what was noticed, what it means, the action and its numbers; the weekly review; and whether a lighter week is due. Prefer this over guessing what matters.", input_schema: obj({ includeSnoozed: bool('Include insights the person snoozed.') }) }),
  T({ name: 'get_plan', kind: 'read', status: 'Reading your plan…', description: 'The goal (rep ranges, effort target, rest), every split with exercises and sets, the weekly schedule, reminders, rest mode, an active lighter week and today’s adjustment. Call before proposing any change to splits or the schedule.', input_schema: obj({}) }),
  T({ name: 'get_body', kind: 'read', gate: 'body', status: 'Reading your body data…', description: 'Weight trend (kg/week and % per week), latest weight, body-fat readings and BMI. Needs body sharing.', input_schema: obj({ weeks: int('4–52, default 12.') }) }),
  T({ name: 'get_health', kind: 'read', gate: 'health', status: 'Reading your health data…', description: 'Daily sleep, resting heart rate, steps and active calories from Health Connect. Needs health sharing.', input_schema: obj({ days: int('1–30, default 7.') }) }),
  T({ name: 'get_heart_session', kind: 'read', gate: 'health', status: 'Reading the heart data for that session…', description: "One session's heart data: time in zones, per-set peaks, rest recovery, drift and effort mismatch. Needs health sharing.", input_schema: obj({ sessionId: str('From get_sessions.') }, ['sessionId']) }),
  T({ name: 'get_live_session', kind: 'read', status: 'Checking the session in progress…', description: 'The session in progress: split, elapsed time, current exercise, sets done vs planned, rest timer, the in-session adjustment, and live heart-rate freshness. Call first in live mode.', input_schema: obj({}) }),
  T({ name: 'search_exercises', kind: 'read', status: 'Searching exercises…', description: 'Find exercises by name, muscle, equipment or movement pattern. Use to get exercise ids before proposing splits or swaps.', input_schema: obj({ query: str('Name or alias.'), muscle: MUSCLE, equipment: str('e.g. Dumbbells, Cable, Barbell, Machine.'), pattern: str('e.g. horizontal_push, squat, hinge.'), limit: int('1–12, default 8.') }) }),
  T({ name: 'get_exercise', kind: 'read', status: 'Looking up {exercise}…', description: 'Full details of one exercise: muscles, equipment, pattern, type, role, up to 6 substitutes and a coaching cue.', input_schema: obj({ exerciseId: EXERCISE_ID }, ['exerciseId']) }),
  T({ name: 'get_equipment', kind: 'read', status: 'Checking the equipment…', description: "The equipment profile for an exercise at a gym (entry unit, steps, dumbbell ladder, bar, plates), the active gym, and loadable neighbours of the current target. Use before talking about loads in lb or kg, plates or dumbbell jumps.", input_schema: obj({ exerciseId: EXERCISE_ID, gymId: str('Default: the active gym.') }) }),
  T({ name: 'find_in_app', kind: 'read', status: 'Finding that in the app…', description: 'Search the app itself: returns the 5 best screens, panels or actions with where they are and how to use them. Use when unsure where something lives.', input_schema: obj({ query: str('What the person wants to find or do.') }, ['query']) }),
  T({ name: 'explain_method', kind: 'read', status: 'Looking at how the app works that out…', description: "How the app computes a number (recovery, readiness, progression, volume bands and more), its constants and this person's own calibration values. Use for any 'how is X calculated' or 'why does the app say'.", input_schema: obj({ topic: en(METHOD_IDS) }, ['topic']) }),
  T({ name: 'lookup_knowledge', kind: 'read', status: 'Checking the evidence…', description: 'Evidence cards on training, recovery, sleep and nutrition basics, with key numbers. Required before stating any general number; cite the card as ⟦k:id⟧.', input_schema: obj({ query: str('Topic words.'), ids: arr(str(), 'Card ids, if known.') }) }),
  T({ name: 'calculate', kind: 'read', status: 'Calculating…', description: 'Arithmetic on the person’s numbers. Never compute in your head: use this for BMI, e1RM, loads for reps, percent change, unit conversion, plates, weekly rate, protein range and days between dates.', input_schema: obj({ op: en(CALC_OPS), args: { anyOf: CALC_OPS.map(o => CALC_ARGS[o]!) } }, ['op', 'args']) }),
  T({ name: 'evaluate_plan', kind: 'read', status: 'Checking the plan against your volume and recovery…', description: 'Grade a programme draft: weekly sets per muscle against this person’s bands, balance, back-to-back hard days, rep ranges and session length, with blocking issues. Call before propose_program and revise until no issue has severity "block".', input_schema: obj({ draft: PLAN_DRAFT }, ['draft']) }),

  // Show and navigation
  T({ name: 'show', kind: 'show', status: 'Drawing that…', description: 'Draw a chart or card inline from the app’s own data. The result is the exact data drawn: talk about those numbers. Use when a picture is clearer than numbers.', input_schema: obj({ component: en(SHOW_COMPONENT_IDS), params: COMPONENT_ANY, caption: str('One short line, optional.') }, ['component', 'params']) }),
  T({ name: 'navigate', kind: 'show', status: 'Finding the way there…', description: 'Offer a "Take me there" card for a place in the app (a palace id from the manifest). Set auto only when the person literally asked to be taken there.', input_schema: obj({ target: str('A palace entry id from the manifest.'), params: arr(obj({ key: str(), value: str() }, ['key', 'value'])), auto: bool('Go there right after the answer.') }, ['target']) }),
  T({ name: 'pin_card', kind: 'show', status: 'Preparing a card for Today…', description: 'Propose pinning a component to the Today screen (the person taps to pin). Use when they want to keep an eye on something.', input_schema: obj({ component: en(SHOW_COMPONENT_IDS), params: COMPONENT_ANY, title: str('At most 60 characters.'), days: int('1–42; default until unpinned.') }, ['component', 'params', 'title']) }),

  // Actions (proposals the person applies with a tap)
  T({ name: 'propose_split', kind: 'act', status: 'Drafting the split…', description: 'Propose creating, changing or deleting one split. The person sees a card with the changes and taps Apply. Use exercise ids from search_exercises.', input_schema: obj({ action: en(['create', 'modify', 'delete']), splitId: str('Required for modify and delete.'), name: str('At most 28 characters.'), focus: arr(MUSCLE, 'Up to 2 muscles to bring up.'), exercises: arr(obj({ exerciseId: EXERCISE_ID, sets: int('1–6.') }, ['exerciseId', 'sets']), 'At most 14.') }, ['action', 'name', 'exercises']) }),
  T({ name: 'propose_program', kind: 'act', status: 'Drafting the programme…', description: 'Propose a whole programme (splits plus weekly schedule). Only after evaluate_plan shows no blocking issues. replaceExisting swaps out the current splits.', input_schema: obj({ draft: PLAN_DRAFT, replaceExisting: { type: 'boolean' } }, ['draft', 'replaceExisting']) }),
  T({ name: 'propose_schedule', kind: 'act', status: 'Drafting the schedule…', description: 'Propose a new weekly schedule: a split id or null (rest) for each day.', input_schema: obj({ week: obj(Object.fromEntries(WEEKDAYS.map(d => [d, { type: ['string', 'null'] }])), [...WEEKDAYS]) }, ['week']) }),
  T({ name: 'propose_goal', kind: 'act', status: 'Preparing the goal change…', description: 'Propose switching the training goal. Changes rep ranges, not exercises.', input_schema: obj({ goal: en(GOALS.map(g => g.id)), applyGoalRest: bool('Also set the goal’s default rest.') }, ['goal']) }),
  T({ name: 'propose_today', kind: 'act', status: "Adjusting today's session…", description: "Propose changes to today's session only (swap, remove, add, sets, or a load factor), e.g. around soreness or time. Never changes the saved split.", input_schema: obj({ splitId: str('Today’s scheduled split, or the one they will train.'), changes: arr(TODAY_CHANGE), reason: str('One line the person will see.') }, ['splitId', 'changes', 'reason']) }),
  T({ name: 'propose_deload', kind: 'act', status: 'Preparing a lighter week…', description: 'Propose a 7-day lighter week (fewer sets, lighter loads).', input_schema: obj({ reason: str('One line.') }, ['reason']) }),
  T({ name: 'propose_start_session', kind: 'act', status: 'Getting the session ready…', description: 'Offer to start a session with a split now.', input_schema: obj({ splitId: str() }, ['splitId']) }),
  T({ name: 'propose_checkin', kind: 'act', status: 'Preparing a check-in…', description: "Propose saving today's check-in from what the person told you (sleep quality, mood, soreness 1–5).", input_schema: obj({ sleepQuality: RATING, mood: RATING, soreness: arr(obj({ muscle: MUSCLE, level: RATING }, ['muscle', 'level'])) }) }),
  T({ name: 'propose_profile', kind: 'act', status: 'Preparing a profile update…', description: 'Propose updating one profile field the person stated (weight in kg, height in cm, birth year, sex, training since YYYY-MM, planned days per week).', input_schema: obj({ field: en(['bodyWeightKg', 'heightCm', 'birthYear', 'sex', 'trainingSince', 'plannedDays']), value: { type: ['string', 'number'] } }, ['field', 'value']) }),
  T({ name: 'propose_custom_exercise', kind: 'act', status: 'Drafting a custom exercise…', description: 'Propose adding an exercise that is not in the library.', input_schema: obj({ name: str('At most 60 characters.'), equipment: str(), primary: arr(MUSCLE, '1–2 muscles.'), secondary: arr(MUSCLE), mode: en(['weighted', 'bodyweight', 'assisted', 'duration', 'conditioning']), role: en(['main', 'accessory']) }, ['name', 'equipment', 'primary', 'secondary', 'mode', 'role']) }),
  T({ name: 'propose_reminder', kind: 'act', status: 'Preparing reminder settings…', description: 'Propose training-day reminder settings (on/off, time, style, readiness summary) when the person asks for reminders.', input_schema: obj({ enabled: { type: 'boolean' }, time: str('HH:MM, 24-hour.'), style: en(['silent', 'vibrate', 'alert']), readinessSummary: { type: 'boolean' } }, ['enabled']) }),
  T({ name: 'propose_setting', kind: 'act', status: 'Preparing a settings change…', description: 'Propose changing one app setting: rest mode, automatic rest, rest length, display unit, the daily quote or haptics.', input_schema: obj({ setting: SETTING }, ['setting']) }),
  T({ name: 'snooze_insight', kind: 'act', status: 'Noting that…', description: "Mark an insight helpful or snooze it for 7 days, when the person says so. Applied at once with Undo.", input_schema: obj({ insightId: str('From get_insights.'), verdict: en(['snoozed', 'helpful']) }, ['insightId', 'verdict']) }),
  T({ name: 'propose_equipment_profile', kind: 'act', status: 'Preparing the equipment profile…', description: 'Propose how a piece of equipment loads at a gym (unit, steps, dumbbell ladder, bar, plates), e.g. from a rack photo or "the dumbbells here are in pounds". If unsure of the unit, ask one question first.', input_schema: obj({ scope: en(['exercise', 'equipment']), exerciseId: EXERCISE_ID, equipmentGroup: en(['Barbell', 'Dumbbells', 'Machine', 'Cable', 'Smith Machine', 'Bodyweight', 'Sled', 'General']), gymId: str('Default: the active gym.'), profile: EQUIPMENT_PROFILE }, ['scope', 'profile']) }),
  T({ name: 'propose_gym', kind: 'act', status: 'Preparing a new gym…', description: 'Propose adding a gym and making it the active one.', input_schema: obj({ name: str('At most 28 characters.'), defaultUnit: en(['kg', 'lb']) }, ['name', 'defaultUnit']) }),
  T({ name: 'escalate', kind: 'act', status: 'Adding something important…', description: 'Show the app’s fixed safety card: pain (sharp, spreading, numb, or lasting past 48 h), medical (chest pain, fainting, dizziness), crisis, or disordered eating. Always use it in those situations.', input_schema: obj({ kind: en(['pain', 'medical', 'crisis', 'disordered_eating']), note: str('Optional, one line.') }, ['kind']) }),

  // Memory
  T({ name: 'remember', kind: 'memory', status: 'Remembering that…', description: 'Remember a durable fact the person stated (injury, equipment, preference, goal in their words, agreement). Written at once with Undo. Not for feelings or one-offs.', input_schema: obj({ kind: en(MEMORY_KINDS.filter(k => k !== 'episode')), text: str('At most 200 characters, plain words.'), expiresInDays: int('Injuries default to 42.') }, ['kind', 'text']) }),
  T({ name: 'forget', kind: 'memory', status: 'Forgetting that…', description: 'Forget one memory item when the person asks.', input_schema: obj({ memoryId: str() }, ['memoryId']) }),
  T({ name: 'recall', kind: 'memory', status: 'Checking what I know…', description: 'Look up remembered items beyond the 12 in the brief.', input_schema: obj({ kind: en(MEMORY_KINDS), query: str() }) }),
];

export const TOOL_BY_NAME: Record<string, ToolDef> = Object.fromEntries(TOOLS.map(t => [t.name, t]));

/** Read tools the daily brief may use (§12.3). */
export const READ_TOOL_NAMES = TOOLS.filter(t => t.kind === 'read').map(t => t.name);

/** What the Worker sends to the API: no app-only metadata. */
export function apiTools(): Array<{ name: string; description: string; input_schema: Json; strict?: boolean }> {
  return TOOLS.map(t => ({ name: t.name, description: t.description, input_schema: t.input_schema, ...(t.strict ? { strict: true } : {}) }));
}

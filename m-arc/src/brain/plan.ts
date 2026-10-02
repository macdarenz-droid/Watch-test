/**
 * The plan evaluator (§8.3): grades a whole programme draft before Escobar proposes it.
 * Weekly sets per muscle against the person's own volume bands, push/pull and
 * upper/lower balance, back-to-back hard days for the same muscle, goal rep ranges
 * and session length. Blocking issues make Escobar revise the draft.
 */
import type { Exercise, Session, Weekday } from '@/core/models';
import { WEEKDAYS } from '@/core/models';
import { findExercise } from '@/core/exercises';
import { MUSCLE_BY_ID, type MuscleId } from '@/data/muscles';
import { GOAL_BY_ID, type GoalId } from '@/data/goals';
import { SET_WEIGHT, rolesFor, trainingLevels } from './exposure';
import { BALANCE, UPPER_PER_LOWER } from './balance';
import { volumeBands } from './volume';
import { repRange } from './progression';

export interface PlanDraft {
  splits: Array<{ ref: string; name: string; exercises: Array<{ exerciseId: string; sets: number }> }>;
  /** Split ref per weekday, or null for rest. */
  schedule: Record<Weekday, string | null>;
}

export type PlanIssueSeverity = 'block' | 'warn' | 'info';

export interface PlanEvaluation {
  weeklySets: Partial<Record<MuscleId, { sets: number; band: [number, number]; status: 'under' | 'in' | 'over' }>>;
  balance: { pushPull: number; upperLower: number; flags: string[] };
  recoveryConflicts: Array<{ muscle: MuscleId; days: [Weekday, Weekday]; hoursBetween: number }>;
  repRanges: Array<{ exerciseId: string; range: [number, number]; role: 'main' | 'accessory' }>;
  sessionMinutes: Array<{ ref: string; minutes: number }>;
  issues: Array<{ severity: PlanIssueSeverity; code: string; text: string }>;
  /** 0–100, deterministic from issues. Never shown to the person as a score. */
  score: number;
}

/** Seconds of work per set on top of the rest, for session length (§8.3). */
export const WORK_SEC_PER_SET = 45;
export const MAX_SESSION_MIN = 120;
export const LONG_SESSION_MIN = 90;
/** Over this multiple of a band's top, a muscle's weekly sets block the plan. */
export const OVERSHOOT_BLOCK = 1.5;
/** Direct sets in one session that make a day "hard" for that muscle. */
export const HARD_DAY_SETS = 3;
export const MIN_RECOVERY_HOURS = 48;
const MAX_PLAN_SPLITS = 7;
const MAX_SETS_PER_EXERCISE = 6;
const MAJOR: MuscleId[] = ['chest', 'lats', 'quads', 'hamstrings', 'glutes', 'side_delts'];

const r1 = (v: number): number => Math.round(v * 10) / 10;

export function evaluatePlan(draft: PlanDraft, ctx: { goal: GoalId; custom: Exercise[]; sessions: Session[]; today: string; trainingSince?: string }): PlanEvaluation {
  const issues: PlanEvaluation['issues'] = [];
  const goal = GOAL_BY_ID[ctx.goal] ?? GOAL_BY_ID.lean;
  const splitByRef = new Map(draft.splits.map(s => [s.ref, s]));
  const meta = new Map<string, Exercise>();

  if (draft.splits.length > MAX_PLAN_SPLITS) issues.push({ severity: 'block', code: 'too_many_splits', text: `${draft.splits.length} splits; the app holds at most ${MAX_PLAN_SPLITS}.` });
  for (const sp of draft.splits) {
    if (!sp.exercises.length) issues.push({ severity: 'block', code: 'empty_split', text: `${sp.name} has no exercises.` });
    for (const ex of sp.exercises) {
      const m = findExercise(ex.exerciseId, ctx.custom);
      if (!m) issues.push({ severity: 'block', code: 'unknown_exercise', text: `${ex.exerciseId} in ${sp.name} is not in the exercise library.` });
      else meta.set(ex.exerciseId, m);
      if (!(ex.sets > 0)) issues.push({ severity: 'block', code: 'zero_sets', text: `${m?.name ?? ex.exerciseId} in ${sp.name} has 0 sets.` });
      else if (ex.sets > MAX_SETS_PER_EXERCISE) issues.push({ severity: 'warn', code: 'many_sets', text: `${m?.name ?? ex.exerciseId} in ${sp.name} has ${ex.sets} sets; 6 is the most one exercise usually needs.` });
    }
  }
  for (const d of WEEKDAYS) {
    const ref = draft.schedule[d];
    if (ref != null && !splitByRef.has(ref)) issues.push({ severity: 'block', code: 'unknown_split_ref', text: `${d} points at "${ref}", which is not a split in this plan.` });
  }
  const trainingDays = WEEKDAYS.filter(d => draft.schedule[d] && splitByRef.has(draft.schedule[d]!));
  if (!trainingDays.length) issues.push({ severity: 'block', code: 'no_training_days', text: 'No day of the week has a split.' });
  for (const sp of draft.splits) if (!WEEKDAYS.some(d => draft.schedule[d] === sp.ref)) issues.push({ severity: 'info', code: 'unscheduled_split', text: `${sp.name} is not on any day.` });

  // Weekly sets per muscle, counted as the logged week counts them (SET_WEIGHT, AUD-9 SCI-09).
  const weekly: Partial<Record<MuscleId, number>> = {};
  // Balance per exercise set, split evenly across the buckets of its primary muscles (BR-17, as trainingBalance).
  const buckets = { push: 0, pull: 0, lower: 0 };
  const perDayDirect: Record<Weekday, Partial<Record<MuscleId, number>>> = Object.fromEntries(WEEKDAYS.map(d => [d, {}])) as Record<Weekday, Partial<Record<MuscleId, number>>>;
  for (const d of trainingDays) {
    const sp = splitByRef.get(draft.schedule[d]!)!;
    for (const ex of sp.exercises) {
      const m = meta.get(ex.exerciseId);
      if (!m || !(ex.sets > 0)) continue;
      const bs = [...new Set(m.primary.map(p => MUSCLE_BY_ID[p].bucket))].filter((x): x is 'push' | 'pull' | 'lower' => x === 'push' || x === 'pull' || x === 'lower');
      for (const b of bs) buckets[b] += ex.sets / bs.length;
      for (const r of rolesFor(m)) {
        const w = SET_WEIGHT[r.role];
        if (!w) continue;
        weekly[r.muscle] = (weekly[r.muscle] ?? 0) + ex.sets * w;
        if (r.role === 'primary') perDayDirect[d][r.muscle] = (perDayDirect[d][r.muscle] ?? 0) + ex.sets;
      }
    }
  }

  const trainedDirectly = new Set<MuscleId>([...meta.values()].flatMap(m => m.primary));
  const levels = trainingLevels(ctx.sessions, ctx.custom, { trainingSince: ctx.trainingSince, today: ctx.today });
  const weeklySets: PlanEvaluation['weeklySets'] = {};
  for (const [muscle, raw] of Object.entries(weekly) as Array<[MuscleId, number]>) {
    const sets = r1(raw);
    const band = volumeBands(levels[muscle].levelIndex, muscle);
    const status = sets < band[0] ? 'under' : sets > band[1] ? 'over' : 'in';
    weeklySets[muscle] = { sets, band, status };
    const label = MUSCLE_BY_ID[muscle].label;
    if (sets > band[1] * OVERSHOOT_BLOCK) issues.push({ severity: 'block', code: 'volume_far_over', text: `${label}: ${sets} sets a week, over 1.5× the top of its ${band[0]}–${band[1]} band.` });
    else if (status === 'over') issues.push({ severity: 'warn', code: 'volume_over', text: `${label}: ${sets} sets a week, above its ${band[0]}–${band[1]} band.` });
    // Under-band only matters for muscles the plan means to train (a primary target) or the big ones.
    else if (status === 'under' && (trainedDirectly.has(muscle) || MAJOR.includes(muscle))) issues.push({ severity: 'warn', code: 'volume_under', text: `${label}: ${sets} sets a week, below its ${band[0]}–${band[1]} band.` });
  }
  const missing = MAJOR.filter(m => !weekly[m]);
  if (trainingDays.length && missing.length) issues.push({ severity: 'info', code: 'muscles_untrained', text: `Not trained directly: ${missing.map(m => MUSCLE_BY_ID[m].label).join(', ')}.` });

  // Balance: push vs pull and upper vs lower weekly sets, on trainingBalance's ratio (upper scaled by UPPER_PER_LOWER).
  const { push, pull, lower } = buckets;
  const ratio = (a: number, b: number): number => (b > 0 ? r1(a / b) : a > 0 ? 99 : 1);
  const pushPull = ratio(push, pull);
  const upperLower = ratio(push + pull, lower);
  const flags: string[] = [];
  if (push + pull >= 8) {
    if (pushPull >= BALANCE.ratio) flags.push('push_heavy'); else if (pushPull <= 1 / BALANCE.ratio) flags.push('pull_heavy');
  }
  if (push + pull + lower >= 12) {
    if (upperLower >= BALANCE.ratio * UPPER_PER_LOWER) flags.push('upper_heavy'); else if (upperLower <= UPPER_PER_LOWER / BALANCE.ratio) flags.push('lower_heavy');
  }
  const FLAG_TEXT: Record<string, string> = {
    push_heavy: `About ${pushPull}× as much pushing as pulling.`, pull_heavy: 'Far more pulling than pushing.',
    upper_heavy: `About ${upperLower}× as much upper-body work as lower.`, lower_heavy: 'Far more lower-body work than upper.',
  };
  for (const f of flags) issues.push({ severity: 'warn', code: `balance_${f}`, text: FLAG_TEXT[f]! });

  // Back-to-back hard days for the same primary muscle (week wraps Saturday → Sunday).
  const recoveryConflicts: PlanEvaluation['recoveryConflicts'] = [];
  for (let i = 0; i < WEEKDAYS.length; i++) {
    const a = WEEKDAYS[i]!, b = WEEKDAYS[(i + 1) % WEEKDAYS.length]!;
    if (!draft.schedule[a] || !draft.schedule[b]) continue;
    for (const [m, sets] of Object.entries(perDayDirect[a]) as Array<[MuscleId, number]>) {
      if (sets >= HARD_DAY_SETS && (perDayDirect[b][m] ?? 0) >= HARD_DAY_SETS) recoveryConflicts.push({ muscle: m, days: [a, b], hoursBetween: 24 });
    }
  }
  for (const c of recoveryConflicts) issues.push({ severity: 'warn', code: 'recovery_conflict', text: `${MUSCLE_BY_ID[c.muscle].label} is trained hard on ${c.days[0]} and ${c.days[1]}, 24 h apart (48 h is the usual minimum).` });

  const repRanges: PlanEvaluation['repRanges'] = [...meta.values()].map(m => ({ exerciseId: m.id, range: repRange(m, ctx.goal), role: m.role }));

  const sessionMinutes = draft.splits.map(sp => {
    const sets = sp.exercises.reduce((a, e) => a + Math.max(0, e.sets), 0);
    return { ref: sp.ref, minutes: Math.round((sets * (goal.restDefaultSec + WORK_SEC_PER_SET)) / 60) };
  });
  for (const sm of sessionMinutes) {
    const name = splitByRef.get(sm.ref)?.name ?? sm.ref;
    if (sm.minutes > MAX_SESSION_MIN) issues.push({ severity: 'block', code: 'session_too_long', text: `${name} runs about ${sm.minutes} min; keep sessions under ${MAX_SESSION_MIN}.` });
    else if (sm.minutes > LONG_SESSION_MIN) issues.push({ severity: 'warn', code: 'session_long', text: `${name} runs about ${sm.minutes} min.` });
  }

  const weight = { block: 30, warn: 8, info: 2 } as const;
  const score = Math.max(0, Math.min(100, 100 - issues.reduce((a, i) => a + weight[i.severity], 0)));
  return { weeklySets, balance: { pushPull, upperLower, flags }, recoveryConflicts, repRanges, sessionMinutes, issues, score };
}

export const hasBlockingIssues = (e: PlanEvaluation): boolean => e.issues.some(i => i.severity === 'block');

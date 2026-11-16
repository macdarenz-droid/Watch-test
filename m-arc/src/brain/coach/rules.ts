/**
 * The coach's rules, as data. Each rule looks at the same context and either
 * returns an insight or nothing. Priority decides what is shown first.
 * Copy is plain words: what we noticed, what it means, what to do.
 *
 * To add a rule: append one object. To change the words: edit the strings.
 */
import type { LoadUnit } from '@/core/models';
import { kgToDisplay } from '@/core/units';
import type { CheckIn, DailyHealth, Deload, Exercise, FreshMark, InsightFeedback, Profile, ProfileChange, RecoveryModel, Session, Split, Weekday } from '@/core/models';
import { muscleLabel, type MuscleId } from '@/data/muscles';
import { DEFAULT_GOAL, GOAL_BY_ID, GOALS, type GoalId } from '@/data/goals';
import { formatHours, weekdayOf, daysBetween, addDays, weekStart, trainedTodaySessions, nextScheduled, WEEKDAY_LABEL } from '@/core/dates';
import { muscleDoses, recoveryAt, recoveryStatus, trainingAgeMonths, type MuscleRecovery } from '../recovery';
import { exerciseHistory, isActive, modeOf } from '../history';
import { PLATEAU_MIN_SPAN_DAYS, plateauStatus, plateauWindow } from '../trend';
import { effortDrift } from '../effort';
import { BALANCE, trainingBalance } from '../balance';
import { READY_PCT } from '@/data/recovery';
import { weekSummary, daysSinceLastSession, type WeekPlan } from '../weekly';
import { effectiveSetsByMuscle, effortLabel, isWorkingSet, trainingLevels, weeklyMuscleSets } from '../exposure';
import { muscleVolumeStatus, volumeBands } from '../volume';
import { findExercise } from '@/core/exercises';
import { e1rmTrend, failureShare, isStale } from './weeklyReview';
import { effortBiasByLabel, rirObservations } from '../effortBias';
import { DRIFT, effortMismatch, hrMax, restingHr, sessionDrift } from '../heart';
import { readiness, readinessWithInputs, READINESS_INPUT_LABEL, LOAD_DRIVER, type ReadinessBand, type ReadinessInputKey, type ReadinessResult } from '../readiness';
import { DELOAD_TRIGGER, deloadTrigger, type DeloadSuggestion } from '../deload';
import { inLighterWeek, repRange, repsEarnIncrease } from '../progression';

/** BR-04's one span constant, now in trend.ts (BUG-14): a plateau needs six of the eight weeks (spec: never at 3 weeks). */
export { PLATEAU_MIN_SPAN_DAYS };

export type Category = 'recovery' | 'progress' | 'readiness' | 'balance' | 'focus' | 'consistency' | 'data';

export interface Insight {
  id: string;
  category: Category;
  priority: number;
  title: string;
  noticed: string;
  means: string;
  action: string;
  /** Optional link to an exercise or muscle for the UI. */
  exerciseId?: string;
  muscle?: MuscleId;
  /** 6.12.4: drives colour and where an insight may appear. Rules built before this stayed 'tip'/'now' implicitly; only new rules populate it. */
  kind?: 'alert' | 'progress' | 'plan' | 'praise' | 'tip' | 'data';
  cadence?: 'now' | 'pre' | 'live' | 'post' | 'weekly';
  evidence?: { n: number; window: string; confidence: 'low' | 'medium' | 'high' };
  numbers?: Array<{ label: string; value: string }>;
  drivers?: string[];
  unlocks?: string;
  validUntil?: string;
  /**
   * BUG-20: the shared data this insight is built from. Set where the insight is made; the coach
   * brief, get_insights and session notes leave a tagged insight out when that sharing is off.
   * In memory only, never stored.
   */
  gated?: GatedData;
}

/** BUG-20: a kind of data the person can keep off the coach (§24.15). */
export type GatedData = 'body' | 'health';
export type Sharing = { health: boolean; body: boolean };

/** BUG-20: the insights allowed out under these sharing flags: a tagged one only while its data is shared. */
export function withoutGated<T extends { gated?: GatedData }>(list: T[], sharing: Sharing): T[] {
  return list.filter(i => !i.gated || sharing[i.gated]);
}

export interface CoachContext {
  sessions: Session[];
  splits: Split[];
  schedule: Record<Weekday, string | null>;
  custom: Exercise[];
  today: string;
  now: number;
  profileHistory: ProfileChange[];
  profile: Profile;
  /** ADAPT-3 (E-8): the training goal, for each lift's rep range; unset reads every goal's range. ADAPT-5 wires it
   * (AppState.goal) and its plateau lever reads DEFAULT_GOAL when unset (E-2). */
  goal?: GoalId;
  healthDays: DailyHealth[];
  checkIns: CheckIn[];
  freshMarks: FreshMark[];
  recoveryModel: RecoveryModel;
  deload: Deload | null;
  feedback: InsightFeedback[];
  /** The display unit for loads and body weight in note text (QA-R3b-2, QA-R3b-5). */
  unit?: LoadUnit;
  /** A stored session's 5-second heart series (heartStore), for heart.drift. Absent: that rule stays quiet. */
  heartSeries?: (sessionId: string) => Array<[number, number]>;
  /** ADAPT-4: days the user marked off; the gap and green-day rules skip them. */
  daysOff?: string[];
  /** ADAPT-4 (F-1): Profile.plannedDays, the week target when nothing is scheduled. */
  plannedDays?: number;
}

/**
 * ADAPT-5 (E-1): the plateau lever's usual week. The median over the last `weeks` completed weeks that
 * had a session (a missed week is not "low volume"), judged against the muscle's band with at least
 * `minTrainedWeeks` of them, else against `fallbackSets`. The threshold stays inside `bounds`.
 */
export const PLATEAU_VOLUME = { weeks: 4, minTrainedWeeks: 3, fallbackSets: 10, bounds: [4, 20] } as const;

function medianOf(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** ADAPT-5 (E-1): a main lift's usual weekly hard sets, for its primary muscle and for the lift itself. */
function usualWeekVolume(ctx: CoachContext, muscle: MuscleId, exerciseId: string): { muscleSets: number; liftSets: number; trainedWeeks: number } {
  const start = weekStart(ctx.today);
  const muscleSets: number[] = [], liftSets: number[] = [];
  for (let i = 1; i <= PLATEAU_VOLUME.weeks; i++) {
    const from = addDays(start, -7 * i), to = addDays(from, 7);
    const week = ctx.sessions.filter(s => s.day >= from && s.day < to);
    if (!week.length) continue;
    muscleSets.push(effectiveSetsByMuscle(week, from, to, ctx.custom, { countEasy: false })[muscle] ?? 0);
    liftSets.push(week.flatMap(s => s.exercises.filter(e => e.exerciseId === exerciseId).flatMap(e => e.sets)).filter(x => isWorkingSet(x) && effortLabel(x) !== 'easy').length);
  }
  return { muscleSets: medianOf(muscleSets), liftSets: medianOf(liftSets), trainedWeeks: muscleSets.length };
}

/** ADAPT-4: the user's own week, for the volume rule (C-3). */
const planOf = (ctx: CoachContext): WeekPlan => ({ schedule: ctx.schedule, daysOff: ctx.daysOff ?? [], plannedDays: ctx.plannedDays });

/**
 * ADAPT-4 (E-6): the user's usual days between sessions: the median gap between training days in the
 * eight weeks before `today`, null with fewer than three gaps.
 */
function usualGapDays(sessions: Session[], today: string): number | null {
  const from = addDays(today, -56);
  const days = [...new Set(sessions.filter(s => s.day >= from && s.day <= today).map(s => s.day))].sort();
  const gaps = days.slice(1).map((d, i) => daysBetween(days[i]!, d));
  if (gaps.length < 3) return null;
  return [...gaps].sort((a, b) => a - b)[Math.floor(gaps.length / 2)]!;
}

/** ADAPT-4 (E-9): the first scheduled day of this week not taken off; Monday with no schedule. */
function firstTrainingDayOfWeek(ctx: CoachContext): string {
  const start = weekStart(ctx.today);
  if (!Object.values(ctx.schedule).some(Boolean)) return start;
  const off = new Set(ctx.daysOff ?? []);
  for (let i = 0; i < 7; i++) { const d = addDays(start, i); if (ctx.schedule[weekdayOf(d)] && !off.has(d)) return d; }
  return start;
}

interface Derived {
  recovery: MuscleRecovery[];
  exerciseIds: Array<{ id: string; name: string }>;
  /** Lifts trained in the last six weeks (BR-05): progress and effort rules skip the rest. */
  activeIds: Array<{ id: string; name: string }>;
  readiness: ReadinessResult | null;
  /** BUG-16: the inputs that fed today's readiness, so its copy names only those, and the ones past their driver line. */
  readinessInputs: ReadinessInputKey[];
  readinessLow: ReadinessInputKey[];
}

/** "a", "a and b", "a, b and c". */
function listJoin(xs: string[]): string {
  return xs.length <= 1 ? (xs[0] ?? '') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`;
}

/** QA8-2: the next scheduled split (and its weekday) after `day`, resolved to the actual Split. */
function nextScheduledSplitOf(splits: Split[], schedule: Record<Weekday, string | null>, day: string): { split: Split; weekday: Weekday } | null {
  const n = nextScheduled(schedule, day);
  if (!n) return null;
  const split = splits.find(s => s.id === n.splitId);
  return split ? { split, weekday: n.weekday } : null;
}

function derive(ctx: CoachContext): Derived {
  const names = new Map<string, string>();
  for (const s of [...ctx.sessions].reverse()) for (const e of s.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, e.name);
  const recovery = recoveryStatus({ sessions: ctx.sessions, custom: ctx.custom, now: ctx.now, profile: ctx.profile, healthDays: ctx.healthDays, checkIns: ctx.checkIns, freshMarks: ctx.freshMarks, recoveryModel: ctx.recoveryModel });
  const scheduledSplit = ctx.splits.find(s => s.id === ctx.schedule[weekdayOf(ctx.today)]);
  const exerciseIds = [...names].map(([id, name]) => ({ id, name }));
  const today = readinessWithInputs({
    today: ctx.today, now: ctx.now, healthDays: ctx.healthDays, checkIn: ctx.checkIns.find(c => c.day === ctx.today),
    checkInHistory: ctx.checkIns.filter(c => c.day !== ctx.today), recovery, scheduledSplit,
    next: nextScheduledSplitOf(ctx.splits, ctx.schedule, ctx.today), custom: ctx.custom, sessions: ctx.sessions,
  });
  return {
    recovery,
    exerciseIds,
    activeIds: exerciseIds.filter(({ id }) => isActive(exerciseHistory(ctx.sessions, id, ctx.custom), ctx.today)),
    readiness: today.result,
    readinessInputs: today.inputs,
    readinessLow: today.low,
  };
}

export const CATEGORY_LABEL: Record<Category, string> = {
  recovery: 'Recovery',
  progress: 'Progress',
  readiness: 'Readiness',
  balance: 'Training balance',
  focus: 'Focus muscle',
  consistency: 'Consistency',
  data: 'Training data',
};

type Rule = { id: string; run: (ctx: CoachContext, d: Derived) => Insight[] };

export const RULES: Rule[] = [
  {
    id: 'recovery.still-recovering',
    run: (ctx, d) => {
      return d.recovery
        .filter(r => r.recovering && r.pct < 60 && r.personalized)
        .slice(0, 1)
        .map(r => ({
          id: `recovery:${r.muscle}`,
          category: 'recovery',
          priority: 400,
          title: `${muscleLabel(r.muscle)} still recovering`,
          noticed: `Your ${muscleLabel(r.muscle).toLowerCase()} is about ${r.pct}% recovered, ${r.beyondCap ? 'more than 5 days' : `about ${formatHours(r.hoursLeft)}`} to go.`,
          // AUD-20 (SCI-11): a fact about the model, never a claim that the user's history proves harm.
          means: 'Its ready time is fitted to your own sessions.',
          action: 'Give it more time, or train something that is fully recovered today.',
          muscle: r.muscle,
        }));
    },
  },
  {
    id: 'recovery.scheduled-conflict',
    run: (ctx, d) => {
      const split = ctx.splits.find(s => s.id === ctx.schedule[weekdayOf(ctx.today)]);
      if (!split) return [];
      const primaryMuscles = new Set<MuscleId>();
      for (const se of split.exercises) findExercise(se.exerciseId, ctx.custom)?.primary.forEach(m => primaryMuscles.add(m));
      const worst = d.recovery.filter(r => primaryMuscles.has(r.muscle) && !r.ready).sort((a, b) => a.pct - b.pct)[0];
      if (!worst) return [];
      // QA8-1: the split that caused this fatigue is already done today (or ended today within the
      // last 6h, per QA8-4) — re-warning about it just re-reports the fatigue it just caused.
      const doneToday = trainedTodaySessions(ctx.sessions, ctx.today, ctx.now);
      if (doneToday.some(s => s.splitId === split.id) || worst.lastDay === ctx.today) {
        const next = nextScheduled(ctx.schedule, ctx.today);
        let body = 'Rest and recover.';
        if (next) {
          const nextSplit = ctx.splits.find(s => s.id === next.splitId);
          const label = nextSplit?.name ?? 'your next session';
          let warn = '';
          if (nextSplit) {
            const nextPrimary = new Set<MuscleId>();
            for (const se of nextSplit.exercises) findExercise(se.exerciseId, ctx.custom)?.primary.forEach(m => nextPrimary.add(m));
            const hoursAhead = daysBetween(ctx.today, next.day) * 24;
            const notReady = d.recovery.filter(r => nextPrimary.has(r.muscle) && r.hoursLeft > hoursAhead).sort((a, b) => b.hoursLeft - a.hoursLeft)[0];
            if (notReady) {
              const window = notReady.readyInHours ? `in ${formatHours(notReady.readyInHours[0])}–${formatHours(notReady.readyInHours[1])}` : notReady.beyondCap ? 'in more than 5 days' : `in about ${formatHours(notReady.hoursLeft)}`;
              warn = ` ${muscleLabel(notReady.muscle)} should be ready ${window}.`;
            }
          }
          body = `Next: ${label} on ${WEEKDAY_LABEL[next.weekday]}.${warn}`;
        }
        return [{
          id: `recovery.done-today:${split.id}`,
          category: 'recovery', priority: 335,
          title: `Done today: ${split.name}`,
          noticed: `${split.name} is done for today.`,
          means: body,
          action: 'Recover well before the next one.',
        }];
      }
      const firm = worst.pct < 60;
      return [{
        id: `scheduled-conflict:${split.id}:${worst.muscle}`,
        category: 'recovery', priority: firm ? 380 : 340,
        title: `${split.name} today, but ${muscleLabel(worst.muscle).toLowerCase()} is only ${worst.pct}% recovered`,
        noticed: `${split.name} is scheduled today and works ${muscleLabel(worst.muscle).toLowerCase()} directly. It is about ${worst.pct}% recovered.`,
        // AUD-20 (SCI-11): the line the coach acts on, not a cause it cannot show.
        means: firm ? 'Below 60%, the coach suggests moving the hard sets.' : `That is short of the ${READY_PCT}% ready line.`,
        action: firm ? `Swap to another split today, or keep ${split.name} light and put the hard sets elsewhere.` : `Reorder ${split.name} so this muscle comes later, or go a little lighter on it today.`,
        muscle: worst.muscle,
      }];
    },
  },
  {
    id: 'progress.declining',
    run: (ctx, d) =>
      d.activeIds.flatMap(({ id, name }) => {
        // BUG-15 (COACHRULES-F8): lighter-week sessions are not stall or decline evidence.
        const hist = exerciseHistory(evidenceSessions(ctx), id, ctx.custom);
        const p = plateauStatus(hist, modeOf(id, ctx.custom), ctx.today);
        if (p.status !== 'declining' || p.confidence === 'low') return [];
        return [{
          id: `decline:${id}`, category: 'progress' as const, priority: 320,
          title: `${name}: progress has slipped`,
          noticed: `Your recent ${name} sessions trend downward.`,
          means: 'A short easier stretch usually helps more than pushing through.',
          action: 'Keep the load, stop short of max effort for a week, then build back up.',
          exerciseId: id,
        }];
      }),
  },
  {
    id: 'progress.plateau',
    run: (ctx, d) =>
      d.activeIds.flatMap(({ id, name }) => {
        // BUG-15 (COACHRULES-F8): lighter-week sessions are not stall or decline evidence.
        const hist = exerciseHistory(evidenceSessions(ctx), id, ctx.custom);
        const p = plateauStatus(hist, modeOf(id, ctx.custom), ctx.today);
        if (p.status !== 'plateaued' || p.confidence === 'low') return [];
        return [{
          id: `plateau:${id}`, category: 'progress' as const, priority: 300,
          title: `${name}: progress has stalled`,
          noticed: `${name} has barely moved over the last six weeks or more.`,
          means: 'That is the point where the coach suggests a change.',
          action: 'Try a different rep range for two weeks, or one lighter week, then return.',
          exerciseId: id,
        }];
      }),
  },
  {
    id: 'balance.imbalance',
    run: ctx => {
      const focus = ctx.splits.flatMap(s => s.focus);
      const b = trainingBalance(ctx.sessions, ctx.today, ctx.custom, focus);
      if (!b) return [];
      return [{
        id: `balance:${b.pair}`, category: 'balance', priority: 200 + Math.min(20, b.severity * 3),
        title: `${b.weak} work is trailing`,
        noticed: `${b.strong} work has been ${b.ratioLabel} your ${b.weak.toLowerCase()} work over the last three weeks.${b.context ? ` ${b.context}` : ''}`,
        // AUD-20 (OBS-KNOW): the rule's own evidence, no claim about joints.
        means: `The gap showed in ${b.weeks} of the last ${BALANCE.weeks} weeks.`,
        action: `Add one or two ${b.weak.toLowerCase()} exercises to your next sessions.`,
      }];
    },
  },
  {
    id: 'readiness.effort-drift',
    run: (ctx, d) =>
      d.activeIds.flatMap(({ id, name }) => {
        const drift = effortDrift(exerciseHistory(ctx.sessions, id, ctx.custom));
        if (drift.confidence !== 'high' || drift.status === 'stable' || drift.status === 'unknown') return [];
        return drift.status === 'harder'
          ? [{ id: `effort:${id}`, category: 'readiness' as const, priority: 100, title: `${name}: you have been pushing harder`, noticed: `Your effort ratings on ${name} have climbed recently.`, means: 'Harder sets at the same load can be a sign you need more recovery.', action: 'Keep the load, watch sleep and rest, and rate honestly.', exerciseId: id }]
          : [{ id: `effort:${id}`, category: 'readiness' as const, priority: 105, title: `${name}: effort is trending lower`, noticed: `Your effort ratings on ${name} have eased recently.`, means: 'The same work is getting easier. That is progress.', action: 'You may be ready to add a rep or a small step of load.', exerciseId: id }];
      }),
  },
  {
    id: 'focus.specialization',
    run: ctx => {
      const weeks = weeklyMuscleSets(ctx.sessions, ctx.today, 5, ctx.custom);
      const out: Insight[] = [];
      for (const split of ctx.splits) for (const m of split.focus) {
        const prior = weeks.slice(1).map(w => w.sets[m] ?? 0).filter(v => v > 0);
        if (prior.length < 3) continue;
        const baseline = [...prior].sort((a, b) => a - b)[Math.floor(prior.length / 2)]!;
        const step = Math.min(3, Math.max(1, baseline * 0.15));
        const target = Math.round(Math.min(baseline * 1.2, baseline + step) * 2) / 2;
        const current = weeks[0]?.sets[m] ?? 0;
        if (current >= target) continue;
        out.push({
          id: `focus:${m}`, category: 'focus', priority: 150,
          title: `${muscleLabel(m)} focus: ${current} of ${target} sets this week`,
          noticed: `You chose ${muscleLabel(m).toLowerCase()} as a focus. Your usual week is about ${baseline} effective sets.`,
          means: 'A small bump over your own baseline is enough. Big jumps do not help.',
          action: `Aim for about ${target} effective sets this week.`,
          muscle: m,
        });
      }
      return out;
    },
  },
  {
    id: 'programming.volume',
    run: ctx => {
      const trainedMuscles = new Set(ctx.splits.flatMap(s => s.exercises.flatMap(se => findExercise(se.exerciseId, ctx.custom)?.primary ?? [])));
      const out: Insight[] = [];
      for (const row of muscleVolumeStatus(ctx.sessions, ctx.today, ctx.custom, planOf(ctx), ctx.profile.trainingSince)) {
        if ((row.status !== 'under' && row.status !== 'over') || !trainedMuscles.has(row.muscle)) continue;
        const label = muscleLabel(row.muscle);
        const under = row.status === 'under';
        out.push({
          id: `volume:${row.muscle}`, category: 'focus', priority: 140,
          title: `${label}: ${under ? 'under' : 'over'} your usual range`,
          noticed: under || row.lastWeekSets >= row.thisWeekSets
            ? `${label} got ${row.lastWeekSets} effective sets last week; your range is ${row.band[0]}–${row.band[1]}.`
            : `${label} has ${row.thisWeekSets} effective sets this week already; your range is ${row.band[0]}–${row.band[1]}.`,
          // D9: diminishing returns above the band, not a harm threshold.
          means: under ? 'Too little direct work for a while can slow progress on this muscle.' : 'Above your usual range: more sets now bring smaller gains and cost more recovery.',
          action: under ? `Add one or two direct sets for ${label.toLowerCase()} this week.` : `Trim a set or two for ${label.toLowerCase()} next week.`,
          muscle: row.muscle,
        });
      }
      return out;
    },
  },
  {
    id: 'consistency.gap',
    run: ctx => {
      const gap = daysSinceLastSession(ctx.sessions, ctx.today);
      if (gap == null || gap < 7) return [];
      // ADAPT-4 (E-6): days marked off do not count, and the line waits for twice the user's usual gap.
      const last = addDays(ctx.today, -gap);
      const offDays = new Set(ctx.daysOff ?? []);
      let counted = 0;
      for (let i = 1; i <= gap; i++) if (!offDays.has(addDays(last, i))) counted++;
      const usual = usualGapDays(ctx.sessions, ctx.today);
      if (counted < Math.max(7, usual == null ? 0 : 2 * usual)) return [];
      return [{
        id: 'gap', category: 'consistency', priority: 250,
        title: gap >= 28 ? 'Welcome back' : `${gap} days since your last session`,
        noticed: gap >= 28 ? `Your last session was ${gap} days ago.` : 'A week without training.',
        means: gap >= 28 ? 'Strength comes back fast, but the first session should be easy.' : 'Reduced training still keeps most of your progress. Zero does not.',
        action: gap >= 28 ? 'Repeat your last loads once, no increases, then build.' : 'Do one short session this week, even half your usual.',
      }];
    },
  },
  {
    id: 'data.effort-missing',
    run: ctx => {
      const recent = [...ctx.sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(-3);
      // ADAPT-3 (E-8): a lift whose reps alone earn the next step needs no ratings. With no goal
      // known, only a lift that earns it under every goal's range is left out.
      const goals = ctx.goal ? [ctx.goal] : GOALS.map(g => g.id);
      const decided = new Map<string, boolean>();
      const byReps = (id: string) => {
        if (!decided.has(id)) {
          const hist = exerciseHistory(ctx.sessions, id, ctx.custom).filter(h => h.held.length < h.sets.length);
          const meta = findExercise(id, ctx.custom);
          decided.set(id, modeOf(id, ctx.custom) === 'weighted' && goals.every(g => repsEarnIncrease(hist, repRange(meta, g))));
        }
        return decided.get(id)!;
      };
      const sets = recent.flatMap(s => s.exercises.filter(e => !byReps(e.exerciseId)).flatMap(e => e.sets)).filter(s => isWorkingSet(s) && (s.reps ?? 0) > 0);
      if (sets.length < 8) return [];
      const rated = sets.filter(s => s.effort).length / sets.length;
      if (rated >= 0.5) return [];
      return [{
        id: 'effort-missing', category: 'data', priority: 90,
        title: 'Rate your sets',
        noticed: `Only ${Math.round(rated * 100)}% of your recent sets have an effort rating.`,
        means: 'Without effort the coach cannot tell a hard set from an easy one, so it stays cautious.',
        action: 'Tap Easy, Ideal or Max after each set. One tap is enough.',
      }];
    },
  },
  {
    id: 'profile.changed',
    run: ctx => {
      const cutoff = ctx.now - 7 * 86_400_000;
      const recent = ctx.profileHistory.filter(c => (c.field === 'bodyWeightKg' || c.field === 'goal') && new Date(c.at).getTime() >= cutoff);
      const latest = new Map<ProfileChange['field'], ProfileChange>();
      for (const c of recent) latest.set(c.field, c); // profileHistory is chronological; later entries win
      return [...latest.values()].map((c): Insight => {
        if (c.field === 'goal') {
          const g = GOAL_BY_ID[c.to as GoalId];
          return {
            id: `profile-changed:goal:${c.at}`, category: 'data', priority: 260,
            title: `Goal changed to ${g.name}`,
            noticed: `You changed your training goal to ${g.name}.`,
            means: `Main lifts now target ${g.mainReps[0]}–${g.mainReps[1]} reps, accessories ${g.accessoryReps[0]}–${g.accessoryReps[1]}. Your splits keep their exercises.`,
            action: `Suggested rest for this goal is ${g.restDefaultSec}s. Apply it from the goal sheet if you'd like.`,
          };
        }
        const u = ctx.unit ?? 'kg';
        const w = (kg: number) => Math.round(kgToDisplay(kg, u) * 10) / 10;
        const to = w(c.to as number);
        const from = typeof c.from === 'number' ? w(c.from) : null;
        const delta = from != null ? Math.round((to - from) * 10) / 10 : null;
        return {
          id: `profile-changed:weight:${c.at}`, category: 'data', priority: 260, gated: 'body',
          title: `Weight updated to ${to} ${u}`,
          noticed: delta != null && delta !== 0 ? `You updated your weight to ${to} ${u}, ${delta < 0 ? 'down' : 'up'} ${Math.abs(delta)} ${u} since your last entry.` : `You updated your weight to ${to} ${u}.`,
          means: 'Saved to your weight log.',
          action: 'Nothing to do here. Keep weighing in for a trend, not just a jump.',
        };
      });
    },
  },
  {
    id: 'consistency.week-grade',
    run: ctx => {
      // No sessions at all means an empty week too; no need to summarise it (BR-32).
      if (ctx.sessions.length === 0) {
        return [{ id: 'first-session', category: 'consistency', priority: 50, title: 'Start with one session', noticed: 'Nothing logged yet.', means: 'The coach learns from what you log. The first sessions are the baseline.', action: 'Pick a split, log a few sets, and rate the effort.' }];
      }
      return [];
    },
  },
  {
    id: 'progress.plateau-lever',
    run: (ctx, d) =>
      d.activeIds.flatMap(({ id, name }) => {
        const meta = findExercise(id, ctx.custom);
        if (meta?.role !== 'main' || modeOf(id, ctx.custom) !== 'weighted') return [];
        const hist = exerciseHistory(evidenceSessions(ctx), id, ctx.custom);
        // BR-04 (BUG-14): the one plateau rule. The last 8 weeks since any long break (QA2-FC-2/3),
        // 6+ sessions spanning 42+ days (QA-R3a-7), and under 1.5% total change over them.
        if (plateauStatus(hist, 'weighted', ctx.today).status !== 'plateaued') return [];
        const recent = plateauWindow(hist, ctx.today);
        const t = e1rmTrend(recent);
        const recentSessions = evidenceSessions(ctx).filter(s => s.exercises.some(e => e.exerciseId === id)).sort((a, b) => a.startedAt.localeCompare(b.startedAt)).slice(-6);
        if (recentSessions.length < 6) return [];

        const primaryMuscle = meta.primary[0];
        const goal = GOAL_BY_ID[ctx.goal ?? DEFAULT_GOAL];
        // ADAPT-5 (E-1): completed weeks only (BR-07), the usual trained week, not last week alone.
        const usual = primaryMuscle ? usualWeekVolume(ctx, primaryMuscle, id) : { muscleSets: 0, liftSets: 0, trainedWeeks: 0 };
        const weekSets = usual.muscleSets;
        let band: [number, number] | null = null;
        let volumeLow: boolean, liftLow = false;
        if (primaryMuscle && usual.trainedWeeks >= PLATEAU_VOLUME.minTrainedWeeks) {
          band = volumeBands(trainingLevels(ctx.sessions, ctx.custom, { trainingSince: ctx.profile.trainingSince, today: ctx.today })[primaryMuscle].levelIndex, primaryMuscle);
          const [lo, hi] = PLATEAU_VOLUME.bounds;
          // The goal's direct sets per main lift (strength: 3–10) count too.
          liftLow = goal.mainLiftWeeklySets ? usual.liftSets < goal.mainLiftWeeklySets[0] : false;
          volumeLow = weekSets < Math.min(hi, Math.max(lo, band[0])) || liftLow;
        } else volumeLow = weekSets < PLATEAU_VOLUME.fallbackSets;
        const fShare = failureShare(recentSessions);
        const stale = isStale(hist, ctx.today);

        let lever: { means: string; action: string } | null = null;
        if (volumeLow && liftLow && goal.mainLiftWeeklySets) lever = { means: `${name} gets about ${Math.round(usual.liftSets)} hard sets in a usual week; your goal aims for ${goal.mainLiftWeeklySets[0]}–${goal.mainLiftWeeklySets[1]}.`, action: 'Add 3 to 4 sets at ideal effort across two sessions.' };
        else if (volumeLow) lever = { means: `Weekly volume for ${muscleLabel(primaryMuscle!).toLowerCase()} is on the low side (about ${Math.round(weekSets)} hard sets in a usual week${band ? `; your range is ${band[0]}–${band[1]}` : ''}).`, action: 'Add 3 to 4 sets at ideal effort across two sessions.' };
        // ADAPT-5 (E-2): the goal's own failure-share cap, not a fixed 0.5.
        else if (fShare > goal.failureShareCap && recentSessions.length >= 6) lever = { means: `About ${Math.round(fShare * 100)}% of recent sets were max effort, above the ${Math.round(goal.failureShareCap * 100)}% your goal allows; that adds fatigue without much extra progress.`, action: 'Pull most sets back to ideal effort and save max for the last set.' };
        else if (stale) lever = { means: 'The top load has stayed the same for the last six weeks.', action: 'Change the rep range for two weeks, or swap in a similar exercise for a block.' };
        if (!lever) return [];

        return [{
          id: `plateau-lever:${id}`, category: 'progress', priority: 305, cadence: 'now', kind: 'plan', exerciseId: id,
          title: `${name}: flat for a while, most likely lever`,
          noticed: `${name} has not moved over recent sessions.`,
          means: lever.means,
          action: lever.action,
          evidence: { n: recent.length, window: `${recent.length} sessions`, confidence: t.confidence },
        }];
      }),
  },
  {
    id: 'readiness.effort-calibration',
    run: (ctx, d) =>
      d.activeIds.flatMap(({ id, name }) => {
        const hist = exerciseHistory(ctx.sessions, id, ctx.custom);
        if (hist.length < 2) return [];
        const obs = rirObservations(hist);
        const biases = effortBiasByLabel(obs).filter(b => b.bias >= 2);
        if (!biases.length) return [];
        const b = biases[0]!;
        const sample = obs.find(o => o.otherEffort === b.effort);
        return [{
          id: `effort-calibration:${id}`, category: 'readiness', priority: 95, cadence: 'now', kind: 'data', exerciseId: id,
          title: `${name}: you had more in reserve than rated`,
          noticed: sample ? `You rated ${b.effort} at ${kgToDisplay(sample.kg, ctx.unit ?? 'kg')} ${ctx.unit ?? 'kg'}, then a later max set at the same load beat it by ${sample.impliedRir} reps.` : `Your ${b.effort} sets on ${name} usually have more reps in reserve than the label assumes.`,
          means: 'That is normal, especially early on. Lifters usually underestimate how many reps they have left.',
          // D11: copy only; the bias is not applied to e1RM.
          action: 'Rate by how many reps you had left: Ideal is about 2, Easy 3 or more.',
          evidence: { n: b.n, window: `${b.n} matched pairs`, confidence: b.n >= 5 ? 'medium' : 'low' },
        }];
      }),
  },
  {
    id: 'readiness.today',
    run: (ctx, d) => {
      const r = d.readiness;
      if (!r) return [];
      // BUG-16: copy names only the inputs that fed the score, and says "several" only when there are.
      const inputs = d.readinessInputs;
      const named = listJoin(inputs.map(k => READINESS_INPUT_LABEL[k]));
      const Named = named.charAt(0).toUpperCase() + named.slice(1);
      if (r.band === 'red') {
        return [{
          id: 'readiness-today', category: 'readiness', priority: 450, cadence: 'now', kind: 'alert',
          title: 'Readiness: red', noticed: r.drivers.length ? `${r.drivers.join('. ')}.` : inputs.length > 1 ? 'Several signals point the same way today.' : `${Named} reads low today.`, drivers: r.drivers,
          means: `Today's score is ${r.score} of 100.`,
          // QA8-2: once today's session is already done, "keep loads where they are" no longer applies.
          // BUG-16: "drop a set" only when the advice is to reduce (a check-in or 2+ agreeing inputs).
          action: r.postSessionAdvice ?? (r.loadAdvice === 'reduce' ? 'Keep loads where they are, or drop a set on the hardest lifts.' : 'Keep today’s loads where they are.'),
          evidence: { n: 1, window: 'today', confidence: r.confidence },
        }];
      }
      if (r.band === 'amber') {
        return [{
          id: 'readiness-today', category: 'readiness', priority: 380, cadence: 'now', kind: 'data',
          title: 'Readiness: amber', noticed: r.drivers.length ? `${r.drivers.join('. ')}.` : inputs.length > 1 ? 'A mixed picture today.' : `${Named} reads middling today.`, drivers: r.drivers,
          means: 'Not a reason to skip, just not a day to chase a new best.',
          action: r.postSessionAdvice ?? 'Keep today’s loads where they are.',
          evidence: { n: 1, window: 'today', confidence: r.confidence },
        }];
      }
      // BUG-16: acute load high on a green day is a low-confidence note, never an alert or a load change.
      if (r.drivers.includes(LOAD_DRIVER)) {
        return [{
          id: 'readiness-today', category: 'readiness', priority: 90, cadence: 'now', kind: 'data',
          title: 'Training load is up', noticed: 'You have trained more this week than in your recent weeks.',
          means: 'On its own that is not a reason to back off. A check-in tells the coach how you actually feel.',
          action: 'Log a quick check-in before you train.',
          evidence: { n: 1, window: 'today', confidence: 'low' },
        }];
      }
      if (ctx.today !== firstTrainingDayOfWeek(ctx)) return [];
      // Only inputs that read well are "lining up"; one past its driver line is left out.
      const good = inputs.filter(k => !d.readinessLow.includes(k));
      if (!good.length) return [];
      const lining = listJoin(good.map(k => READINESS_INPUT_LABEL[k]));
      // Sleep, resting HR and HRV come from health data: the note is kept off the coach when that sharing is off (BUG-20).
      const goodHealth = good.some(k => k === 'sleep' || k === 'rhr' || k === 'hrv') ? { gated: 'health' as const } : {};
      return [{
        id: 'readiness-today', category: 'readiness', priority: 120, cadence: 'now', kind: 'praise', ...goodHealth,
        title: 'Readiness: green', noticed: `${lining.charAt(0).toUpperCase()}${lining.slice(1)} ${good.length === 1 ? 'is' : good.length === 2 ? 'are' : 'are all'} lining up this week.`,
        means: 'A good week to push the lifts that have room to grow.',
        action: 'No change needed.',
        evidence: { n: 1, window: 'today', confidence: r.confidence },
      }];
    },
  },
  {
    id: 'heart.effort-mismatch',
    run: ctx => {
      const last = ctx.sessions[ctx.sessions.length - 1];
      // BR-26: a post-session note belongs to the day of the session and the day after.
      if (!last || daysBetween(last.day, ctx.today) > 1) return [];
      if (!last) return [];
      const m = effortMismatch(last.exercises);
      if (!m) return [];
      return [{
        id: `heart-mismatch:${last.id}`, category: 'readiness', priority: 110, cadence: 'post', kind: 'data', gated: 'health',
        title: 'Effort rating: worth a second look',
        noticed: `You rated a set Easy that ${m.examplePct >= 100 ? 'reached' : `hit ${m.examplePct}% of`} the peak heart rate of your hardest-rated set of the same exercise.`,
        means: 'Easy sets are not usually that close to your hardest effort on the same lift.',
        action: 'No change needed — just something to notice next time you rate that set.',
        evidence: { n: m.rated, window: 'this session', confidence: 'medium' },
      }];
    },
  },
  {
    id: 'heart.drift',
    run: ctx => {
      const last = ctx.sessions[ctx.sessions.length - 1];
      // BR-26: a post-session note belongs to the day of the session and the day after.
      if (!last || daysBetween(last.day, ctx.today) > 1) return [];
      if (!last) return [];
      // Plan 6.17.4: per-set heart data only from live sets whose times are real.
      if (last.logging?.timingTrusted === false || !ctx.heartSeries) return [];
      const startMs = Date.parse(last.startedAt);
      const setAtSec = last.exercises.flatMap(e => e.sets)
        .filter(s => s.kind !== 'warmup' && (s.fidelity ?? 'live') === 'live' && !!s.at)
        .map(s => (Date.parse(s.at!) - startMs) / 1000);
      const d = sessionDrift({ series: ctx.heartSeries(last.id), sessionSec: last.durationSec, setAtSec, restingHrBpm: restingHr(ctx.healthDays, ctx.profile, last.day), hrMaxBpm: hrMax(ctx.profile).bpm });
      if (!d?.drifting) return [];
      const rose = d.driftPct > DRIFT.pctAbove;
      // Appendix B: the advice is water and longer rests, never a load cut (D-A1 point 7).
      return [{
        id: `heart-drift:${last.id}`, category: 'readiness', priority: 130, cadence: 'post', kind: 'alert', gated: 'health',
        title: 'Heart rate crept up through the session',
        noticed: rose
          ? `Your heart rate before your last 3 sets was about ${Math.round(d.driftPct)}% higher than before your first 3.`
          : `Your heart rate took about ${Math.round(d.readySlopeSecPerSet!)} s longer to settle after each set.`,
        means: 'This is usually heat, too little water or short rests catching up, not weaker muscles.',
        action: 'Drink some water and rest a little longer between sets next time. Your loads can stay the same.',
        evidence: { n: d.sets, window: 'this session', confidence: 'medium' },
      }];
    },
  },
];

/** COACH-FB: why a note is hidden today. */
export interface InsightHide { verdict: InsightFeedback['verdict']; day: string }

/** COACH-FB: "Not now" hides a note for 7 days from its day (the F3.6 rule, unchanged); "Helpful" hides it for the rest of that day. */
export function feedbackHides(f: InsightFeedback, today: string): boolean {
  return f.verdict === 'snoozed' ? daysBetween(f.day, today) < 7 : f.day === today;
}

/** COACH-FB: every note id hidden today and why. A snooze outranks a helpful; among snoozes the latest day wins. Duplicate records collapse. */
export function hiddenInsightIds(feedback: InsightFeedback[], today: string): Map<string, InsightHide> {
  const out = new Map<string, InsightHide>();
  for (const f of feedback) {
    if (!feedbackHides(f, today)) continue;
    const cur = out.get(f.id);
    if (!cur || (f.verdict === 'snoozed' && (cur.verdict === 'helpful' || f.day > cur.day))) out.set(f.id, { verdict: f.verdict, day: f.day });
  }
  return out;
}

/** COACH-FB: every rule's insights, minus lift insights a recovering muscle already explains. Feedback is not applied here. */
export function runInsightRules(ctx: CoachContext): Insight[] {
  const d = derive(ctx);
  const all = RULES.flatMap(r => {
    try { return r.run(ctx, d); } catch { return []; }
  });
  // A recovery insight about a muscle explains plateau/readiness on lifts that target it.
  const recovering = new Set(all.filter(i => i.category === 'recovery').map(i => i.muscle));
  return all.filter(i => {
    if (!i.exerciseId || recovering.size === 0) return true;
    const meta = findExercise(i.exerciseId, ctx.custom);
    return !meta?.primary.some(m => recovering.has(m));
  });
}

/** Run every rule, drop duplicates per target, keep the most important. */
export function coachInsights(ctx: CoachContext, limit = 3, sharing?: Sharing): Insight[] {
  // BUG-20: for the coach, a gated insight is left out before ranking so it never takes a slot.
  const all = sharing ? withoutGated(runInsightRules(ctx), sharing) : runInsightRules(ctx);
  return rankInsights(all, hiddenInsightIds(ctx.feedback, ctx.today), limit);
}

/** COACH-FB: hidden notes that would be back in the top `limit` if shown again (each checked on its own), highest priority first. */
export function hiddenBackOnBoard(list: Insight[], hidden: ReadonlyMap<string, InsightHide>, limit = 3): Array<{ insight: Insight } & InsightHide> {
  const out: Array<{ insight: Insight } & InsightHide> = [];
  for (const [id, why] of hidden) {
    const others = new Map(hidden);
    others.delete(id);
    const back = rankInsights(list, others, limit).find(i => i.id === id);
    if (back) out.push({ insight: back, ...why });
  }
  return out.sort((a, b) => b.insight.priority - a.insight.priority);
}

/** COACH-FB: drop hidden ids, then rank. Never sorts `list` in place (selectors share it). */
export function rankInsights(list: Insight[], hidden: ReadonlyMap<string, unknown>, limit = 3): Insight[] {
  const seen = new Set<string>();
  // BR-27: one progress insight per lift, the highest-priority one.
  const progressFor = new Set<string>();
  return list
    .filter(i => !hidden.has(i.id))
    .sort((a, b) => b.priority - a.priority)
    .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .filter(i => {
      if (i.category !== 'progress' || !i.exerciseId) return true;
      if (progressFor.has(i.exerciseId)) return false;
      progressFor.add(i.exerciseId);
      return true;
    })
    .slice(0, limit);
}

/**
 * Readiness for each of the last `days` days (index 0 = today), null where there was nothing
 * to score. Recomputes recovery/readiness as of each day rather than storing history. Used by
 * deloadTrigger's readiness-red condition and Escobar's readiness history.
 */
export function readinessSeries(ctx: CoachContext, days = 5): Array<ReadinessResult | null> {
  const out: Array<ReadinessResult | null> = [];
  const base = { sessions: ctx.sessions, custom: ctx.custom, profile: ctx.profile, healthDays: ctx.healthDays, checkIns: ctx.checkIns, freshMarks: ctx.freshMarks, recoveryModel: ctx.recoveryModel };
  // Doses depend on the sessions, not on the day asked about: build them once (BR-23).
  const doses = muscleDoses(base);
  for (let i = 0; i < days; i++) {
    const day = addDays(ctx.today, -i);
    const now = new Date(`${day}T23:59:59`).getTime();
    const recovery = recoveryAt(doses, { ...base, now });
    const scheduledSplit = ctx.splits.find(s => s.id === ctx.schedule[weekdayOf(day)]);
    out.push(readiness({
      today: day, now, healthDays: ctx.healthDays, checkIn: ctx.checkIns.find(c => c.day === day),
      checkInHistory: ctx.checkIns.filter(c => c.day !== day), recovery, scheduledSplit,
      next: nextScheduledSplitOf(ctx.splits, ctx.schedule, day), custom: ctx.custom, sessions: ctx.sessions,
    }));
  }
  return out;
}

function readinessHistory(ctx: CoachContext, days = 5): Array<ReadinessBand | null> {
  return readinessSeries(ctx, days).map(r => r?.band ?? null);
}

/** F3.3: whether the coach should offer a lighter week right now. Never suggests one while a deload is already active. */
export function deloadOffer(ctx: CoachContext): DeloadSuggestion {
  if (ctx.deload && ctx.deload.endDay >= ctx.today) return { suggest: false, reason: '' };
  return deloadTrigger(ctx.sessions, ctx.today, ctx.custom, readinessHistory(ctx, DELOAD_TRIGGER.readinessWindowDays), trainingAgeMonths(ctx.profile, ctx.sessions, ctx.now), ctx.deload, ctx.profile.trainingSince);
}

/** BUG-15: the sessions that count as progress evidence, without the saved lighter week's. */
function evidenceSessions(ctx: CoachContext): Session[] {
  return ctx.deload ? ctx.sessions.filter(s => !inLighterWeek(s.day, ctx.deload)) : ctx.sessions;
}

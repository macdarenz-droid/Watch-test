/**
 * The coach's rules, as data. Each rule looks at the same context and either
 * returns an insight or nothing. Priority decides what is shown first.
 * Copy is plain words: what we noticed, what it means, what to do.
 *
 * To add a rule: append one object. To change the words: edit the strings.
 */
import type { Exercise, Session, Split, Weekday } from '@/core/models';
import { muscleLabel, type MuscleId } from '@/data/muscles';
import { formatHours } from '@/core/dates';
import { recoveryStatus, type MuscleRecovery } from '../recovery';
import { exerciseHistory } from '../history';
import { plateauStatus } from '../trend';
import { effortDrift } from '../effort';
import { trainingBalance } from '../balance';
import { weekSummary, daysSinceLastSession } from '../weekly';
import { weeklyMuscleSets } from '../exposure';
import { findExercise } from '@/core/exercises';
import { heartRateCoachInsights } from '../heart-rate';

export type Category = 'recovery' | 'progress' | 'readiness' | 'balance' | 'focus' | 'consistency' | 'data' | 'heart-rate';

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
  sessionId?: string;
  muscle?: MuscleId;
}

export interface CoachContext {
  sessions: Session[];
  splits: Split[];
  schedule: Record<Weekday, string | null>;
  custom: Exercise[];
  today: string;
  now: number;
}

interface Derived {
  recovery: MuscleRecovery[];
  exerciseIds: Array<{ id: string; name: string }>;
}

function derive(ctx: CoachContext): Derived {
  const names = new Map<string, string>();
  for (const s of [...ctx.sessions].reverse()) for (const e of s.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, e.name);
  return {
    recovery: recoveryStatus(ctx.sessions, ctx.custom, ctx.now),
    exerciseIds: [...names].map(([id, name]) => ({ id, name })),
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
  'heart-rate': 'Watch insights',
};

type Rule = { id: string; run: (ctx: CoachContext, d: Derived) => Insight[] };

export const RULES: Rule[] = [
  { id: 'heart-rate.context', run: ctx => heartRateCoachInsights(ctx.sessions, ctx.now) },
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
          noticed: `Your ${muscleLabel(r.muscle).toLowerCase()} is about ${r.pct}% recovered, about ${formatHours(r.hoursLeft)} to go.`,
          means: 'Your own history shows you perform worse when you train this muscle again too soon.',
          action: 'Give it more time, or train something that is fully recovered today.',
          muscle: r.muscle,
        }));
    },
  },
  {
    id: 'progress.declining',
    run: (ctx, d) =>
      d.exerciseIds.flatMap(({ id, name }) => {
        const hist = exerciseHistory(ctx.sessions, id, ctx.custom);
        const p = plateauStatus(hist);
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
      d.exerciseIds.flatMap(({ id, name }) => {
        const hist = exerciseHistory(ctx.sessions, id, ctx.custom);
        const p = plateauStatus(hist);
        if (p.status !== 'plateaued' || p.confidence === 'low') return [];
        return [{
          id: `plateau:${id}`, category: 'progress' as const, priority: 300,
          title: `${name}: progress has stalled`,
          noticed: `${name} has not moved over your last eight sessions.`,
          means: 'The same load and reps for weeks means the stimulus stopped changing.',
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
        noticed: `${b.strong} work has been ${b.ratioLabel} your ${b.weak.toLowerCase()} work over the last three weeks.`,
        means: 'Lopsided weeks add up. Balanced work keeps joints happy and progress even.',
        action: `Add one or two ${b.weak.toLowerCase()} exercises to your next sessions.`,
      }];
    },
  },
  {
    id: 'readiness.effort-drift',
    run: (ctx, d) =>
      d.exerciseIds.flatMap(({ id, name }) => {
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
    id: 'consistency.gap',
    run: ctx => {
      const gap = daysSinceLastSession(ctx.sessions, ctx.today);
      if (gap == null || gap < 7) return [];
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
      const recent = ctx.sessions.slice(-3);
      const sets = recent.flatMap(s => s.exercises.flatMap(e => e.sets)).filter(s => (s.reps ?? 0) > 0);
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
    id: 'consistency.week-grade',
    run: ctx => {
      const week = weekSummary(ctx.sessions, ctx.today, ctx.custom);
      if (week.workouts === 0 && ctx.sessions.length === 0) {
        return [{ id: 'first-session', category: 'consistency', priority: 50, title: 'Start with one session', noticed: 'Nothing logged yet.', means: 'The coach learns from what you log. The first sessions are the baseline.', action: 'Pick a split, log a few sets, and rate the effort.' }];
      }
      return [];
    },
  },
];

/** Run every rule, drop duplicates per target, keep the most important. */
export function coachInsights(ctx: CoachContext, limit = 3): Insight[] {
  const d = derive(ctx);
  const all = RULES.flatMap(r => {
    try { return r.run(ctx, d); } catch { return []; }
  });
  // A recovery insight about a muscle explains plateau/readiness on lifts that target it.
  const recovering = new Set(all.filter(i => i.category === 'recovery').map(i => i.muscle));
  const filtered = all.filter(i => {
    if (!i.exerciseId || recovering.size === 0) return true;
    const meta = findExercise(i.exerciseId, ctx.custom);
    return !meta?.primary.some(m => recovering.has(m));
  });
  const seen = new Set<string>();
  return filtered
    .sort((a, b) => b.priority - a.priority)
    .filter(i => { if (seen.has(i.id)) return false; seen.add(i.id); return true; })
    .slice(0, limit);
}

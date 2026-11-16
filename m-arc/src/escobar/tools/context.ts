/**
 * What every tool reads from: the app state and "now", plus a few derived views
 * computed the same way the screens compute them (app/selectors.ts), but without
 * signals, so tools stay pure and testable.
 */
import type { AppState, Exercise } from '@/core/models';
import { daysBetween, dayKey, weekdayOf, nextScheduled } from '@/core/dates';
import { findExercise } from '@/core/exercises';
import { recoveryPctFor, recoveryStatus, type MuscleRecovery } from '@/brain/recovery';
import { resolveProfile } from '@/brain/units';
import { readiness, type ReadinessResult } from '@/brain/readiness';
import type { CoachContext } from '@/brain/coach/rules';

export interface ToolCtx {
  state: AppState;
  /** ms since epoch. */
  now: number;
  /** Local day key for `now`. */
  today: string;
  /** Heart-rate series by session id (heartStore); absent in tests and when not needed. */
  heartSeries?: (sessionId: string) => Array<[number, number]>;
  /** Live watch freshness, when a watch is connected. */
  watch?: { state: string; freshness: string; bpm?: number };
  /** Current screen, for the brief. */
  focus?: { id: string; details?: Record<string, string | number> } | null;
}

export function makeCtx(state: AppState, now = Date.now(), extra: Partial<ToolCtx> = {}): ToolCtx {
  return { state, now, today: dayKey(new Date(now)), ...extra };
}

const cache = new WeakMap<ToolCtx, { recovery?: MuscleRecovery[]; readiness?: ReadinessResult | null; coach?: CoachContext }>();
const memo = (ctx: ToolCtx) => { let m = cache.get(ctx); if (!m) { m = {}; cache.set(ctx, m); } return m; };

export function recoveryAt(ctx: ToolCtx, atMs = ctx.now): MuscleRecovery[] {
  const s = ctx.state;
  const run = () => recoveryStatus({ sessions: s.sessions, custom: s.customExercises, now: atMs, profile: s.profile, healthDays: s.healthDays, checkIns: s.checkIns, freshMarks: s.freshMarks, recoveryModel: s.recoveryModel });
  if (atMs !== ctx.now) return run();
  const m = memo(ctx);
  return (m.recovery ??= run());
}

/**
 * QA3-5: hoursLeft is 0 whenever the model's own clock has nothing left to say, which is also
 * true once soreness alone is holding a muscle back past that clock (soreToday, recovery.ts's
 * soreOnly). A bare 0 there reads as "ready very soon"; null says the clock has no opinion.
 */
export function hoursLeftOut(r: MuscleRecovery): number | null {
  return r.soreToday && r.hoursLeft === 0 ? null : Math.round(r.hoursLeft);
}

export function scheduledSplitFor(ctx: ToolCtx, day = ctx.today) {
  const id = ctx.state.schedule[weekdayOf(day)];
  return id ? ctx.state.splits.find(sp => sp.id === id) : undefined;
}

/** QA8-2: the next scheduled split after `day`, resolved to the actual Split. */
export function nextScheduledSplitFor(ctx: ToolCtx, day = ctx.today) {
  const n = nextScheduled(ctx.state.schedule, day);
  if (!n) return null;
  const split = ctx.state.splits.find(sp => sp.id === n.splitId);
  return split ? { split, weekday: n.weekday } : null;
}

export function readinessToday(ctx: ToolCtx): ReadinessResult | null {
  const m = memo(ctx);
  if (m.readiness !== undefined) return m.readiness;
  const s = ctx.state;
  m.readiness = readiness({
    today: ctx.today, now: ctx.now, healthDays: s.healthDays, checkIn: s.checkIns.find(c => c.day === ctx.today),
    checkInHistory: s.checkIns.filter(c => c.day !== ctx.today && daysBetween(c.day, ctx.today) <= 30),
    recovery: recoveryAt(ctx), scheduledSplit: scheduledSplitFor(ctx), next: nextScheduledSplitFor(ctx),
    custom: s.customExercises, sessions: s.sessions,
  });
  return m.readiness;
}

export function coachCtx(ctx: ToolCtx): CoachContext {
  const m = memo(ctx);
  const s = ctx.state;
  return (m.coach ??= {
    sessions: s.sessions, splits: s.splits, schedule: s.schedule, custom: s.customExercises, today: ctx.today, now: ctx.now - (ctx.now % 60_000),
    profileHistory: s.profileHistory, profile: s.profile, healthDays: s.healthDays, checkIns: s.checkIns, freshMarks: s.freshMarks,
    recoveryModel: s.recoveryModel, deload: s.deload, feedback: s.insightFeedback, unit: s.preferences.weightUnit,
    heartSeries: ctx.heartSeries,
    daysOff: s.daysOff, plannedDays: s.profile.plannedDays,
    goal: s.goal,
  });
}

/** Readiness drivers that come from health data (ES-12); check-in drivers stay. */
const HEALTH_DRIVER = /resting heart rate|HRV|^Sleep:/i;
export const redactDrivers = (drivers: string[], health: boolean): string[] => (health ? drivers : drivers.filter(d => !HEALTH_DRIVER.test(d)));

/**
 * Everything suggestNext needs to agree with the Train screen (ES-21): readiness, the
 * exercise's recovery, an active deload, the gym's equipment and today's load override.
 */
export function progressionCtxFor(ctx: ToolCtx, exerciseId: string, gymId?: string) {
  const s = ctx.state;
  const equipment = resolveProfile(exerciseId, gymId ?? s.active?.gymId ?? s.units.activeGymId, s.units, exerciseOf(ctx, exerciseId));
  const change = todayOverrideOf(ctx)?.changes.find(c => c.kind === 'load' && c.exerciseId === exerciseId);
  return {
    readiness: readinessToday(ctx),
    recoveryPct: recoveryPctFor(exerciseId, s.customExercises, recoveryAt(ctx)),
    deload: activeDeloadOf(ctx),
    // BUG-15: the saved lighter week, so an ended one is not the base for later targets.
    lastDeload: s.deload,
    equipment,
    ...(change && change.kind === 'load' ? { loadFactor: change.factor } : {}),
  };
}

export const activeDeloadOf = (ctx: ToolCtx) => { const d = ctx.state.deload; return d && d.endDay >= ctx.today ? d : null; };
export const todayOverrideOf = (ctx: ToolCtx) => { const o = ctx.state.escobar.todayOverride; return o && o.day === ctx.today ? o : null; };
export const exerciseOf = (ctx: ToolCtx, id: string): Exercise | undefined => findExercise(id, ctx.state.customExercises);
export const exerciseName = (ctx: ToolCtx, id: string): string => exerciseOf(ctx, id)?.name ?? id;

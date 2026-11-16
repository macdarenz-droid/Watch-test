/**
 * Read tools (§8.1): pure functions over (state, now) returning compact, capped JSON.
 * Dates are YYYY-MM-DD; loads are canonical kg plus the entry unit and value where the
 * equipment speaks another unit; session ids only appear where the tool is about sessions.
 */
import type { LoggedSet, Session } from '@/core/models';
import { WEEKDAYS } from '@/core/models';
import { addDays, dayKey, daysBetween, weekdayOf, trainedTodaySessions } from '@/core/dates';
import { LIBRARY, searchExercises } from '@/core/exercises';
import { MUSCLE_BY_ID, MUSCLE_IDS, muscleLabel, type MuscleId } from '@/data/muscles';
import { GOAL_BY_ID } from '@/data/goals';
import { modeOf, exerciseHistory } from '@/brain/history';
import { liftTrend, plateauStatus } from '@/brain/trend';
import { effortDrift } from '@/brain/effort';
import { allRecords, PR_LABEL, type PrKind } from '@/brain/prs';
import { kgToDisplay } from '@/core/units';
import { suggestNext } from '@/brain/progression';
import { inLighterWeek, lighterWeekDay } from '@/brain/deload';
import { warmupSets } from '@/brain/coach/pre';
import { trainingAgeMonths } from '@/brain/recovery';
import { readinessBaselines } from '@/brain/readiness';
import { coachInsights, deloadOffer, readinessSeries, withoutGated, CATEGORY_LABEL, type Insight, type Sharing } from '@/brain/coach/rules';
import { weeklyReviewInsights, weightTrendPctPerWeek } from '@/brain/coach/weeklyReview';
import { postSessionInsights } from '@/brain/coach/post';
import { muscleVolumeStatus } from '@/brain/volume';
import { daysSinceLastSession, plannedThisWeek, trainingStreak, weekSummary, weeklyVolumeHistory } from '@/brain/weekly';
import { bodyWeightResolver } from '@/brain/bodyweight';
import { restingHr, hrMax, zones, effortMismatch, sessionDrift } from '@/brain/heart';
import { substitutesFor } from '@/brain/substitute';
import { pickCue, equipmentGroup } from '@/brain/coach/cues';
import { flagsForSet } from '@/brain/fidelity';
import { autoregulationSuggestion } from '@/brain/coach/live';
import { loadableNear, loadableValues, loadMenu, loggedLoads, resolveProfile } from '@/brain/units';
import { findInApp } from '../palace/registry';
import { firstWorkingSet, isWorkingSet } from '@/brain/exposure';
import { one } from '../context/brief';
import {
  progressionCtxFor, activeDeloadOf, coachCtx, exerciseName, exerciseOf, hoursLeftOut, readinessToday, recoveryAt, redactDrivers, scheduledSplitFor, todayOverrideOf, type ToolCtx,
} from './context';

export class ToolError extends Error {}

const r1 = (v: number): number => Math.round(v * 10) / 10;
const r2 = (v: number): number => Math.round(v * 100) / 100;

/** Trims the longest arrays in a result until its JSON fits `maxBytes`. */
/**
 * Trims the longest arrays until the JSON fits. Arrays must be ordered most-important-first: the
 * default drops from the end; `dropFrom: 'start'` is for chronological arrays whose newest rows
 * are at the end (ES-01).
 */
export function capJson<T>(data: T, maxBytes: number, { dropFrom = 'end' }: { dropFrom?: 'start' | 'end' } = {}): T {
  let json = JSON.stringify(data);
  if (json.length <= maxBytes) return data;
  const copy = JSON.parse(json) as unknown;
  const arrays: unknown[][] = [];
  const walk = (v: unknown): void => {
    if (Array.isArray(v)) { arrays.push(v); v.forEach(walk); } else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(copy);
  const budget = maxBytes - 20; // room for the truncated marker
  for (let guard = 0; guard < 500 && json.length > budget; guard++) {
    const longest = arrays.filter(a => a.length > 1).sort((a, b) => JSON.stringify(b).length - JSON.stringify(a).length)[0];
    if (!longest) break;
    if (dropFrom === 'start') longest.shift(); else longest.pop();
    json = JSON.stringify(copy);
  }
  if (copy && typeof copy === 'object' && !Array.isArray(copy)) (copy as Record<string, unknown>).truncated = true;
  return copy as T;
}

/** A load in canonical kg plus the equipment's own reading. */
export function loadOf(ctx: ToolCtx, exerciseId: string, kg: number): { kg: number; unit: 'kg' | 'lb'; value: number } {
  const profile = resolveProfile(exerciseId, ctx.state.units.activeGymId, ctx.state.units, exerciseOf(ctx, exerciseId));
  // QA2-FE-5: the app's own conversion, so quarter-pound loads (26.25 lb) read as on screen.
  const value = kgToDisplay(kg, profile.unit);
  return { kg: r2(kg), unit: profile.unit, value };
}

function setOut(ctx: ToolCtx, exerciseId: string, s: LoggedSet) {
  const o: Record<string, unknown> = {};
  if (s.kg != null && s.kg > 0) Object.assign(o, s.entered ? { kg: r2(s.kg), unit: s.entered.unit, value: s.entered.value } : loadOf(ctx, exerciseId, s.kg));
  if (s.reps != null) o.reps = s.reps;
  if (s.effort) o.effort = s.effort;
  if (s.durationSec) o.durationSec = s.durationSec;
  if (s.distanceM) o.distanceM = s.distanceM;
  if (s.flags?.length) o.flags = s.flags;
  if (s.kind) o.kind = s.kind; // QA2-FE-3: a warm-up or drop set says so
  return o;
}

const int = (v: unknown, lo: number, hi: number, def: number, name = 'value'): number => {
  if (v == null) return def;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < lo || n > hi) throw new ToolError(`${name} must be between ${lo} and ${hi}`);
  return n;
};
const dayArg = (v: unknown, name: string): string | undefined => {
  if (v == null) return undefined;
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new ToolError(`${name} must be YYYY-MM-DD`);
  return v;
};
const exerciseArg = (ctx: ToolCtx, v: unknown): string => {
  if (typeof v !== 'string' || !exerciseOf(ctx, v)) throw new ToolError(`unknown exerciseId ${String(v)}; use search_exercises to find the id`);
  return exerciseOf(ctx, v)!.id;
};
const musclesArg = (v: unknown): MuscleId[] | undefined => {
  if (v == null) return undefined;
  if (!Array.isArray(v)) throw new ToolError('muscles must be a list of muscle ids');
  const bad = v.filter(m => !MUSCLE_IDS.includes(m as MuscleId));
  if (bad.length) throw new ToolError(`unknown muscles: ${bad.join(', ')}`);
  return v as MuscleId[];
};

function least(ctx: ToolCtx, n = 3, atMs = ctx.now) {
  // QA3-5: a sore flag and a nulled hoursLeft, like get_recovery already does.
  return recoveryAt(ctx, atMs).filter(r => r.lastTrainedAt).sort((a, b) => a.pct - b.pct).slice(0, n).map(r => ({
    muscle: r.muscle, pct: r.pct, hoursLeft: hoursLeftOut(r), ...(r.soreToday ? { soreToday: true } : {}),
  }));
}

export function getOverview(_: unknown, ctx: ToolCtx) {
  const s = ctx.state;
  const split = scheduledSplitFor(ctx);
  const r = readinessToday(ctx);
  const planned = plannedThisWeek(s.schedule, s.daysOff, ctx.today);
  const w = weekSummary(s.sessions, ctx.today, s.customExercises, planned);
  const deload = activeDeloadOf(ctx);
  const override = todayOverrideOf(ctx);
  return capJson({
    today: ctx.today,
    weekday: weekdayOf(ctx.today),
    scheduled: split ? { splitId: split.id, split: split.name, exercises: split.exercises.length } : null,
    trainedToday: trainedTodaySessions(s.sessions, ctx.today, ctx.now).map(x => x.splitName),
    live: s.active ? { split: s.splits.find(x => x.id === s.active!.splitId)?.name ?? 'Workout' } : null,
    readiness: r ? { band: r.band, score: r.score, loadAdvice: r.loadAdvice, calibrating: r.calibrating } : null,
    leastRecovered: least(ctx),
    week: { workouts: w.workouts, sets: w.sets, records: w.records.length, planned: planned ?? 0 }, // QA-R6-12: days off are not planned
    streak: trainingStreak(s.sessions, s.schedule, ctx.today, s.daysOff),
    lighterWeek: deload ? { day: lighterWeekDay(deload, ctx.today), endDay: deload.endDay } : null,
    todayAdjusted: override ? { reason: override.reason, changes: override.changes.length } : null,
    daysSinceLastSession: daysSinceLastSession(s.sessions, ctx.today, ctx.now),
  }, 1200);
}

function topLifts(ctx: ToolCtx, x: Session) {
  return x.exercises.map(e => {
    const best = e.sets.filter(st => (st.kg ?? 0) > 0).sort((a, b) => (b.kg ?? 0) - (a.kg ?? 0))[0];
    return best ? { exercise: e.name, ...setOut(ctx, e.exerciseId, best) } : { exercise: e.name, reps: Math.max(0, ...e.sets.map(st => st.reps ?? 0)) };
  }).slice(0, 4);
}

export function getSessions(input: { from?: string; to?: string; splitId?: string; limit?: number }, ctx: ToolCtx) {
  const from = dayArg(input.from, 'from'), to = dayArg(input.to, 'to');
  const limit = int(input.limit, 1, 20, 10, 'limit');
  const list = [...ctx.state.sessions].reverse()
    .filter(x => (!from || x.day >= from) && (!to || x.day <= to) && (!input.splitId || x.splitId === input.splitId))
    .slice(0, limit);
  return capJson({
    count: list.length,
    sessions: list.map(x => ({
      sessionId: x.id, day: x.day, split: x.splitName, durationMin: Math.round(x.durationSec / 60),
      sets: x.exercises.reduce((a, e) => a + e.sets.filter(isWorkingSet).length, 0), topLifts: topLifts(ctx, x), fidelity: x.logging?.mode ?? 'legacy',
    })),
  }, 5000);
}

export function getSession(input: { sessionId?: string }, ctx: ToolCtx) {
  const s = ctx.state;
  const x = s.sessions.find(y => y.id === input.sessionId);
  if (!x) throw new ToolError('unknown sessionId; use get_sessions');
  const prior = s.sessions.filter(y => y.startedAt < x.startedAt);
  // BUG-20: a note built from unshared body or health data stays on the phone.
  const notes = withoutGated(postSessionInsights({ session: x, priorSessions: prior, custom: s.customExercises, goal: s.goal, restSettingSec: s.preferences.autoRest ? s.preferences.restDefaultSec : undefined, unit: s.preferences.weightUnit }), s.escobar.sharing).map(i => ({ title: i.title, noticed: i.noticed, action: i.action }));
  const heart = s.escobar.sharing.health && x.heart ? { avgBpm: x.heart.avgBpm, maxBpm: x.heart.maxBpm, activeKcal: x.heart.energy?.activeKcal ?? null } : undefined;
  return capJson({
    sessionId: x.id, day: x.day, split: x.splitName, durationMin: Math.round(x.durationSec / 60), fidelity: x.logging?.mode,
    exercises: x.exercises.map(e => {
      const best = exerciseHistory(prior, e.exerciseId, s.customExercises).at(-1)?.topKg ?? null;
      return { exerciseId: e.exerciseId, exercise: e.name, sets: e.sets.map(st => ({ ...setOut(ctx, e.exerciseId, st), ...(flagsForSet(st, best, false, ctx.now).length ? { flags: flagsForSet(st, best, false, ctx.now) } : {}) })) };
    }),
    notes,
    ...(heart ? { heart } : {}),
  }, 6000);
}

export function getExerciseHistory(input: { exerciseId?: string; weeks?: number }, ctx: ToolCtx) {
  const id = exerciseArg(ctx, input.exerciseId);
  const weeks = int(input.weeks, 1, 52, 12, 'weeks');
  const s = ctx.state;
  const all = exerciseHistory(s.sessions, id, s.customExercises);
  const since = addDays(ctx.today, -weeks * 7);
  const hist = all.filter(h => h.day >= since);
  // QA-R3a-2: judged by the lift's mode (less assistance is progress).
  const liftMode = modeOf(id, s.customExercises);
  // BUG-15: the lighter week's sessions are not decline evidence.
  const evidence = all.filter(h => !inLighterWeek(h.day, s.deload));
  const p = plateauStatus(evidence, liftMode);
  const t = liftTrend(evidence, liftMode);
  const records = allRecords(s.sessions, s.customExercises, s.preferences.weightUnit).filter(r => r.exerciseId === id).slice(0, 5).map(r => ({ day: r.day, kind: PR_LABEL[r.kind], detail: r.detail }));
  const effortMix = (sets: LoggedSet[]) => ({ easy: sets.filter(x => x.effort === 'easy').length, ideal: sets.filter(x => x.effort === 'ideal').length, max: sets.filter(x => x.effort === 'max').length });
  return capJson({
    exercise: exerciseName(ctx, id), exerciseId: id, weeks,
    // F1: the person's own setup note (not health data).
    ...(s.exerciseNotes[id] ? { setupNote: one(s.exerciseNotes[id]) } : {}),
    // Newest first, so capping drops the oldest sessions (ES-01).
    sessions: [...hist].reverse().map(h => ({ day: h.day, top: { ...(h.topKg > 0 ? loadOf(ctx, id, h.topKg) : {}), reps: h.topKg > 0 ? h.topReps : h.bestReps }, e1rm: h.bestE1rm > 0 ? r1(h.bestE1rm) : null, sets: h.sets.length, effortMix: effortMix(h.sets) })),
    plateau: { status: p.status, confidence: p.confidence },
    trend: { direction: t.direction, pctPerWeek: r2(t.slopePerWeek * 100), confidence: t.confidence },
    records,
    effortDrift: effortDrift(all).status,
    totalSessions: all.length,
  }, 6000);
}

/** LT-4: the gym's load menu (LT-1), so a rung choice sees the loads really learned there and the
 * tool JSON can say how sure the coach is of it (`get_next_target`'s `repWindow`/`menuConfidence`, `get_equipment`'s `confidence`). */
function menuFor(ctx: ToolCtx, id: string, gymId: string) {
  return loadMenu(id, gymId, ctx.state.units, exerciseOf(ctx, id), loggedLoads(ctx.state.sessions, id, ctx.state.customExercises));
}

export function getNextTarget(input: { exerciseId?: string; plannedSets?: number }, ctx: ToolCtx) {
  const id = exerciseArg(ctx, input.exerciseId);
  const s = ctx.state;
  const planned = int(input.plannedSets, 1, 6, 3, 'plannedSets');
  const gymId = s.active?.gymId ?? s.units.activeGymId;
  const pctx = progressionCtxFor(ctx, id);
  const profile = pctx.equipment;
  const menu = menuFor(ctx, id, gymId);
  const sug = suggestNext(s.sessions, id, s.goal, ctx.today, planned, s.customExercises, { ...pctx, menu });
  const ex = exerciseOf(ctx, id)!;
  return capJson({
    exercise: ex.name, exerciseId: id,
    target: sug.target, mode: sug.mode, kg: sug.kg, ...(sug.unit ? { unit: sug.unit, value: sug.value } : {}), reps: sug.reps, reason: sug.reason, confidence: sug.confidence,
    ...(sug.repWindow ? { repWindow: sug.repWindow } : {}), ...(sug.menuConfidence ? { menuConfidence: sug.menuConfidence } : {}),
    sets: sug.sets.map(x => ({ kg: x.kg, reps: x.reps, durationSec: x.durationSec, note: x.note })),
    warmup: ex.role === 'main' && (sug.sets[0]?.kg ?? 0) > 0 ? warmupSets(sug.sets[0]!.kg!, profile).map(w => ({ ...loadOf(ctx, id, w.kg), reps: w.reps })) : [],
    recovery: ex.primary.map(m => ({ muscle: m, pct: recoveryAt(ctx).find(x => x.muscle === m)?.pct ?? 100 })),
    // BUG-11 A4: an off-ladder load was moved by the equipment, not by recovery; say so.
    ...(sug.snappedFromKg != null && sug.unit ? { equipmentSnap: { fromKg: sug.snappedFromKg, to: `${sug.value} ${sug.unit}`, why: 'The load was moved to the nearest weight this equipment has, not for recovery or readiness. Call get_equipment before explaining this target.' } } : {}),
  }, 3000);
}

export function getRecovery(input: { muscles?: string[]; at?: string }, ctx: ToolCtx) {
  const muscles = musclesArg(input.muscles);
  let atMs = ctx.now;
  if (input.at != null) {
    const t = Date.parse(String(input.at));
    if (!Number.isFinite(t)) throw new ToolError('at must be an ISO time');
    if (t > ctx.now + 7 * 86_400_000 + 60_000) throw new ToolError('at can be at most 7 days ahead');
    atMs = t;
  }
  const list = recoveryAt(ctx, atMs).filter(r => (muscles ? muscles.includes(r.muscle) : !!r.lastTrainedAt));
  return capJson({
    at: new Date(atMs).toISOString().slice(0, 16),
    muscles: list.sort((a, b) => a.pct - b.pct).map(r => ({
      muscle: r.muscle, label: muscleLabel(r.muscle), pct: r.pct, hoursLeft: hoursLeftOut(r),
      readyInHours: r.readyInHours ? r.readyInHours.map(Math.round) : null, fullInHours: r.fullInHours != null ? Math.round(r.fullInHours) : null,
      drivers: r.drivers.slice(0, 2).map(d => d.text), personalized: r.personalized, confidence: r.confidence, lastDay: r.lastDay,
      // QA2-FC-5: held back by today's soreness rating, so the hours say nothing.
      ...(r.soreToday ? { soreToday: true } : {}),
    })),
  }, 5000);
}

export function getReadiness(input: { day?: string; historyDays?: number }, ctx: ToolCtx) {
  const day = dayArg(input.day, 'day');
  const historyDays = int(input.historyDays, 0, 30, 0, 'historyDays');
  const s = ctx.state;
  const offset = day ? daysBetween(day, ctx.today) : 0;
  if (offset < 0) throw new ToolError('day cannot be in the future');
  if (offset > 30) throw new ToolError('day can be at most 30 days back');
  const series = readinessSeries(coachCtx(ctx), Math.max(historyDays, offset + 1));
  const r = offset === 0 ? readinessToday(ctx) : series[offset] ?? null;
  const b = readinessBaselines(s.healthDays, day ?? ctx.today);
  const health = s.escobar.sharing.health;
  return capJson({
    day: day ?? ctx.today,
    readiness: r ? { score: r.score, band: r.band, loadAdvice: r.loadAdvice, confidence: r.confidence, calibrating: r.calibrating, drivers: redactDrivers(r.drivers, health) } : null,
    ...(health ? { baselines: { restingHr7d: b.restingHr7d != null ? r1(b.restingHr7d) : null, restingHr28d: b.restingHr28d != null ? r1(b.restingHr28d) : null, sleep14dMedianMin: b.sleep14dMedian } } : {}),
    checkInToday: !!s.checkIns.find(c => c.day === ctx.today),
    ...(historyDays ? { history: series.slice(0, historyDays).map((x, i) => ({ day: addDays(ctx.today, -i), band: x?.band ?? null, score: x?.score ?? null })) } : {}),
  }, 3000);
}

export function getVolume(input: { weeks?: number; muscles?: string[] }, ctx: ToolCtx) {
  const weeks = int(input.weeks, 1, 12, 4, 'weeks');
  const muscles = musclesArg(input.muscles);
  const s = ctx.state;
  const status = muscleVolumeStatus(s.sessions, ctx.today, s.customExercises, { schedule: s.schedule, daysOff: s.daysOff, plannedDays: s.profile.plannedDays }, s.profile.trainingSince).filter(m => (muscles ? muscles.includes(m.muscle) : m.status !== 'unknown'));
  const history = weeklyVolumeHistory(s.sessions, ctx.today, weeks, s.customExercises);
  // F13b: with body-weight sharing on, effectiveKg matches Stats' weekly volume (docs/F13-BODYWEIGHT-LOAD.md §10).
  const bw = s.escobar.sharing.body ? bodyWeightResolver(s) : undefined;
  const withBw = bw ? weeklyVolumeHistory(s.sessions, ctx.today, weeks, s.customExercises, bw) : null;
  return capJson({
    // QA-R3a-8: status is judged on completed weeks, so the week it was judged on goes with it.
    muscles: status.map(m => ({ muscle: m.muscle, thisWeekSets: m.thisWeekSets, lastWeekSets: m.lastWeekSets, medianSets: m.medianSets, band: m.band, status: m.status })),
    statusJudgedOn: 'the last completed week (over also when this week is already above the band)',
    weeks: history.map((w, i) => ({ week: w.week, sessions: w.sessions, sets: w.sets, volumeKg: w.volumeKg, ...(withBw ? { effectiveKg: withBw[i]!.volumeKg } : {}) })),
  }, 5000);
}

export function getRecords(input: { exerciseId?: string; limit?: number }, ctx: ToolCtx) {
  const limit = int(input.limit, 1, 20, 10, 'limit');
  const id = input.exerciseId != null ? exerciseArg(ctx, input.exerciseId) : undefined;
  const unit = ctx.state.preferences.weightUnit;
  const list = allRecords(ctx.state.sessions, ctx.state.customExercises, unit).filter(r => !id || r.exerciseId === id).slice(0, limit);
  // QA-R3b-2: a load record's numbers in the person's unit, like its detail.
  const shown = (kind: PrKind, v: number) => (kind === 'heaviest' || kind === 'strength' ? kgToDisplay(v, unit) : r2(v));
  return capJson({ records: list.map(r => ({ exercise: r.exerciseName, exerciseId: r.exerciseId, day: r.day, kind: PR_LABEL[r.kind], detail: r.detail, value: shown(r.kind, r.value), previous: shown(r.kind, r.previous), ...(r.kind === 'heaviest' || r.kind === 'strength' ? { unit } : {}) })) }, 4000);
}

// BUG-20: an insight that lists readiness drivers (readiness-today) loses the health ones with health off, like get_readiness.
const insightOut = (i: Insight, sharing: Sharing) => ({
  id: i.id, category: CATEGORY_LABEL[i.category], priority: i.priority, title: i.title, noticed: i.drivers && !sharing.health ? (redactDrivers(i.drivers, false).join('. ') || (i.kind === 'alert' ? 'Several signals point the same way today' : 'A mixed picture today')) + '.' : i.noticed, means: i.means, action: i.action,
  ...(i.numbers?.length ? { numbers: i.numbers } : {}), ...(i.evidence ? { evidence: i.evidence } : {}), ...(i.exerciseId ? { exerciseId: i.exerciseId } : {}), ...(i.muscle ? { muscle: i.muscle } : {}),
});

export function getInsights(input: { includeSnoozed?: boolean }, ctx: ToolCtx) {
  const s = ctx.state;
  const c = coachCtx(ctx);
  // BUG-20: insights built from unshared body or health data stay on the phone.
  const list = coachInsights(input.includeSnoozed ? { ...c, feedback: [] } : c, 50, s.escobar.sharing);
  const names = new Map<string, string>();
  for (const x of [...s.sessions].reverse()) for (const e of x.exercises) if (!names.has(e.exerciseId)) names.set(e.exerciseId, e.name);
  const weekly = weeklyReviewInsights({ sessions: s.sessions, today: ctx.today, custom: s.customExercises, schedule: s.schedule, goal: s.goal, profile: s.profile, weightLog: s.weightLog, trainingAgeMonths: trainingAgeMonths(s.profile, s.sessions, ctx.now), exerciseIds: [...names].map(([id, name]) => ({ id, name })), daysOff: s.daysOff, unit: s.preferences.weightUnit, sharing: s.escobar.sharing, deload: s.deload }, 6);
  const offer = deloadOffer(c);
  const out = (i: Insight) => insightOut(i, s.escobar.sharing);
  return capJson({ insights: list.map(out), weeklyReview: weekly.map(out), lighterWeek: offer.suggest ? { suggest: true, reason: offer.reason } : { suggest: false } }, 9000);
}

export function getPlan(_: unknown, ctx: ToolCtx) {
  const s = ctx.state;
  const g = GOAL_BY_ID[s.goal];
  const d = activeDeloadOf(ctx);
  const o = todayOverrideOf(ctx);
  return capJson({
    goal: { id: g.id, name: g.name, tagline: g.tagline, mainReps: g.mainReps, accessoryReps: g.accessoryReps, rir: g.rir, restDefaultSec: g.restDefaultSec },
    splits: s.splits.map(sp => ({ splitId: sp.id, name: sp.name, focus: sp.focus, exercises: sp.exercises.map(e => ({ exerciseId: e.exerciseId, exercise: exerciseName(ctx, e.exerciseId), sets: e.sets })) })),
    schedule: Object.fromEntries(WEEKDAYS.map(day => [day, s.schedule[day] ? s.splits.find(x => x.id === s.schedule[day])?.name ?? null : null])),
    scheduleIds: s.schedule,
    reminders: { enabled: s.preferences.reminders.enabled, time: s.preferences.reminders.time },
    rest: { mode: s.preferences.rest.mode, defaultSec: s.preferences.restDefaultSec, auto: s.preferences.autoRest },
    lighterWeek: d ? { startDay: d.startDay, endDay: d.endDay, reason: d.reason } : null,
    todayAdjusted: o,
  }, 6000);
}

export function getBody(input: { weeks?: number }, ctx: ToolCtx) {
  const weeks = int(input.weeks, 4, 52, 12, 'weeks');
  const s = ctx.state;
  const since = addDays(ctx.today, -weeks * 7);
  const log = s.weightLog.filter(w => w.day >= since);
  const trendInfo = weightTrendPctPerWeek(s.weightLog.filter(w => w.day >= since));
  const latest = s.weightLog.at(-1);
  const bmi = latest && s.profile.heightCm ? r1(latest.kg / (s.profile.heightCm / 100) ** 2) : null;
  return capJson({
    latest: latest ? { day: latest.day, kg: latest.kg } : null,
    trend: trendInfo ? { trendKg: trendInfo.trendKg, pctPerWeek: trendInfo.pctPerWeek, kgPerWeek: r2(trendInfo.trendKg * trendInfo.pctPerWeek / 100) } : null,
    weighIns: log.length,
    points: log.slice(-12).map(w => ({ day: w.day, kg: w.kg })),
    bodyFat: s.body.slice(-6).map(b => ({ day: b.day, pct: b.bodyFatPct })),
    bmi, heightCm: s.profile.heightCm ?? null,
  }, 3000, { dropFrom: 'start' });
}

const asOf = (syncedAt: string, day: string): string => {
  const t = new Date(syncedAt);
  return dayKey(t) === day ? t.toTimeString().slice(0, 5) : 'end of day';
};

export function getHealth(input: { days?: number }, ctx: ToolCtx) {
  const days = int(input.days, 1, 30, 7, 'days');
  const since = addDays(ctx.today, -days + 1);
  const list = ctx.state.healthDays.filter(d => d.day >= since).sort((a, b) => b.day.localeCompare(a.day));
  return capJson({
    // QA-R5a-4: a day's steps and calories are what the last sync that day read, not a full total.
    days: list.map(d => ({ day: d.day, sleepMin: d.sleepMinutes ?? null, restingHr: d.restingHr ?? null, steps: d.steps ?? null, activeKcal: d.activeCalories ?? null, ...(d.syncedAt && (d.steps != null || d.activeCalories != null) ? { totalsAsOf: asOf(d.totalsSyncedAt ?? d.syncedAt, d.day) } : {}) /* QA2-FE-1 */ })),
    note: 'steps and activeKcal are totals as of the last sync that day (totalsAsOf), so a past day can be lower than its real total.',
    restingHr7d: restingHr(ctx.state.healthDays, ctx.state.profile, ctx.today),
    hrvAvailable: list.some(d => d.lnRmssd != null),
  }, 4000);
}

export function getHeartSession(input: { sessionId?: string }, ctx: ToolCtx) {
  const s = ctx.state;
  const x = s.sessions.find(y => y.id === input.sessionId);
  if (!x) throw new ToolError('unknown sessionId; use get_sessions');
  if (!x.heart) return { sessionId: x.id, heart: null, note: 'No heart data was recorded for this session.' };
  const rest = restingHr(s.healthDays, s.profile, x.day);
  const max = hrMax(s.profile, null, ctx.now);
  // BUG-21: the same drift and effort-mismatch the coach notes use (Appendix B, D-A1).
  const startMs = Date.parse(x.startedAt);
  const setAtSec = x.logging?.timingTrusted === false ? [] : x.exercises.flatMap(e => e.sets)
    .filter(st => st.kind !== 'warmup' && (st.fidelity ?? 'live') === 'live' && !!st.at).map(st => (Date.parse(st.at!) - startMs) / 1000);
  const drift = sessionDrift({ series: ctx.heartSeries?.(x.id) ?? [], sessionSec: x.durationSec, setAtSec, restingHrBpm: rest, hrMaxBpm: max.bpm });
  const mismatch = effortMismatch(x.exercises);
  return capJson({
    sessionId: x.id, day: x.day, split: x.splitName,
    avgBpm: x.heart.avgBpm, maxBpm: x.heart.maxBpm, minBpm: x.heart.minBpm, coverage: r2(x.heart.coverage),
    zoneMin: x.heart.zoneSec.map(sec => r1(sec / 60)),
    zones: rest != null ? zones(max.bpm, rest) : null, hrMax: max.bpm, hrMaxSource: max.source,
    hrr60Median: x.heart.hrr60Median ?? null,
    perSet: x.exercises.flatMap(e => e.sets.filter(st => st.heart).map((st, i) => ({ exercise: e.name, set: i + 1, peakBpm: st.heart!.peakBpm, hrr60: st.heart!.hrr60 ?? null }))).slice(0, 24),
    drift: drift ?? null, effortMismatch: mismatch ?? null,
    activeKcal: x.heart.energy?.activeKcal ?? null,
  }, 5000);
}

export function getLiveSession(_: unknown, ctx: ToolCtx) {
  const s = ctx.state;
  const a = s.active;
  if (!a) return { active: false };
  const openIdx = a.entries.findIndex(e => !e.done && !e.skipped);
  const cur = a.entries[openIdx];
  const elapsedMin = Math.max(0, Math.round((ctx.now - Date.parse(a.startedAt) - a.pausedMs) / 60_000));
  let autoreg: string | null = null;
  if (cur) {
    const ex = exerciseOf(ctx, cur.exerciseId);
    const pctx = progressionCtxFor(ctx, cur.exerciseId, a.gymId);
    // QA-R6-3/11: warm-ups are neither planned working sets nor the first set autoregulation reads.
    const working = cur.sets.filter(x => x.kind !== 'warmup');
    const sug = suggestNext(s.sessions, cur.exerciseId, s.goal, ctx.today, Math.max(1, working.length), s.customExercises, pctx);
    const first = firstWorkingSet(cur.sets);
    const tgt = sug.sets[0];
    // QA-R4b-5: like Train, weighted main lifts only; on an assisted lift more kg means more help.
    if (ex?.role === 'main' && ex.mode === 'weighted' && first && tgt?.kg != null && tgt.reps != null) autoreg = autoregulationSuggestion({ exerciseId: cur.exerciseId, exerciseName: cur.name, firstSet: first, targetKg: tgt.kg, targetReps: tgt.reps, historyCount: exerciseHistory(s.sessions, cur.exerciseId, s.customExercises).length, equipment: pctx.equipment, holdLoad: !!sug.holdLoad })?.action ?? null;
  }
  return capJson({
    active: true,
    split: s.splits.find(x => x.id === a.splitId)?.name ?? 'Workout', splitId: a.splitId, elapsedMin, paused: !!a.pausedAt,
    current: cur ? { exerciseId: cur.exerciseId, exercise: cur.name, setsDone: cur.sets.filter(isWorkingSet).length, setsPlanned: cur.sets.filter(x => x.kind !== 'warmup').length, sets: cur.sets.filter(x => x.at).map(x => setOut(ctx, cur.exerciseId, x)) } : null,
    entries: a.entries.map(e => ({ exerciseId: e.exerciseId, exercise: e.name, done: e.done, skipped: e.skipped, sets: e.sets.length })),
    restSecLeft: a.rest ? Math.max(0, Math.round((a.rest.endsAt - ctx.now) / 1000)) : null,
    adjustment: autoreg,
    ...(s.escobar.sharing.health && ctx.watch ? { watch: ctx.watch } : {}),
  }, 3000);
}

export function searchExercisesTool(input: { query?: string; muscle?: string; equipment?: string; pattern?: string; limit?: number }, ctx: ToolCtx) {
  const limit = int(input.limit, 1, 12, 8, 'limit');
  const custom = ctx.state.customExercises;
  let list = input.query ? searchExercises(input.query, custom, 200) : [...custom, ...LIBRARY];
  if (input.muscle) {
    if (!MUSCLE_IDS.includes(input.muscle as MuscleId)) throw new ToolError(`unknown muscle ${input.muscle}`);
    list = list.filter(e => e.primary.includes(input.muscle as MuscleId));
  }
  if (input.equipment) { const q = input.equipment.toLowerCase(); list = list.filter(e => e.equipment.toLowerCase().includes(q) || equipmentGroup(e.equipment).toLowerCase() === q); }
  if (input.pattern) { const q = input.pattern.toLowerCase(); list = list.filter(e => e.pattern.toLowerCase().includes(q)); }
  return { exercises: list.slice(0, limit).map(e => ({ exerciseId: e.id, name: e.name, primary: e.primary, equipment: e.equipment, pattern: e.pattern, mode: e.mode, role: e.role })) };
}

export function getExercise(input: { exerciseId?: string }, ctx: ToolCtx) {
  const id = exerciseArg(ctx, input.exerciseId);
  const e = exerciseOf(ctx, id)!;
  const cue = pickCue(e, 'coach', `${ctx.today}|${e.id}`);
  return {
    exerciseId: e.id, name: e.name, equipment: e.equipment, pattern: e.pattern, mode: e.mode, role: e.role, custom: !!e.custom,
    primary: e.primary.map(m => ({ muscle: m, label: MUSCLE_BY_ID[m].label })), secondary: e.secondary.map(m => ({ muscle: m, label: MUSCLE_BY_ID[m].label })),
    substitutes: substitutesFor(e, ctx.state.customExercises).slice(0, 6).map(x => ({ exerciseId: x.id, name: x.name, equipment: x.equipment })),
    cue: cue ? { title: cue.title, text: cue.text } : null,
  };
}

export function getEquipment(input: { exerciseId?: string; gymId?: string }, ctx: ToolCtx) {
  const u = ctx.state.units;
  const gymId = input.gymId ?? u.activeGymId;
  const gym = u.gyms.find(g => g.id === gymId);
  if (!gym) throw new ToolError(`unknown gymId; gyms: ${u.gyms.map(g => `${g.id} (${g.name})`).join(', ')}`);
  const base = { activeGym: { gymId: u.activeGymId, name: u.gyms.find(g => g.id === u.activeGymId)?.name }, gym: { gymId: gym.id, name: gym.name, defaultUnit: gym.defaultUnit }, gyms: u.gyms.map(g => ({ gymId: g.id, name: g.name, defaultUnit: g.defaultUnit })) };
  if (!input.exerciseId) return base;
  const id = exerciseArg(ctx, input.exerciseId);
  const ex = exerciseOf(ctx, id)!;
  const pctx = progressionCtxFor(ctx, id, gymId);
  const p = pctx.equipment;
  const menu = menuFor(ctx, id, gymId);
  const sug = suggestNext(ctx.state.sessions, id, ctx.state.goal, ctx.today, 3, ctx.state.customExercises, { ...pctx, menu });
  const values = loadableValues(p);
  let near: number[] = [];
  if (sug.kg != null) {
    const at = loadableNear(sug.kg, p);
    const i = values.indexOf(at.value);
    near = values.slice(Math.max(0, i - 2), i + 3);
  }
  return capJson({
    ...base, exercise: ex.name, exerciseId: id, equipmentGroup: equipmentGroup(ex.equipment), confidence: menu.confidence,
    profile: { unit: p.unit, step: p.step ?? null, ladder: p.ladder ?? null, addOns: p.addOns ?? null, barKg: p.barKg ?? null, plates: p.plates ?? null, source: p.source },
    currentTarget: sug.kg != null ? { kg: sug.kg, unit: p.unit, value: sug.value ?? null } : null,
    loadableNear: near.map(v => ({ value: v, unit: p.unit })),
  }, 3000);
}

export function findInAppTool(input: { query?: string }) {
  if (typeof input.query !== 'string' || !input.query.trim()) throw new ToolError('query is required');
  return { results: findInApp(input.query, 5).map(p => ({ id: p.id, title: p.title, where: p.where, what: p.what, ...(p.how ? { how: p.how } : {}) })) };
}


/**
 * What each `show` component draws (§4.4, §9), as pure data. The component renders this,
 * and the same object goes back to the model as the tool result, so the prose about a
 * chart is grounded in exactly the numbers drawn. At most 12 points per series.
 */
import type { ShowComponentId } from '@/core/models';
import { SHOW_COMPONENT_IDS, WEEKDAYS } from '@/core/models';
import { addDays, weekStart } from '@/core/dates';
import { MUSCLE_IDS, muscleLabel, type MuscleId } from '@/data/muscles';
import { modeOf, exerciseHistory } from '@/brain/history';
import { liftTrend, plateauStatus } from '@/brain/trend';
import { muscleVolumeStatus } from '@/brain/volume';
import { readinessSeries } from '@/brain/coach/rules';
import { plannedThisWeek, weekSummary, workingTotals } from '@/brain/weekly';
import { bodyWeightResolver, bodyweightShare, effectiveLoadKg } from '@/brain/bodyweight';
import { effortSplit, effortUsesSets } from '@/ui/EffortBars';
import { allRecords, PR_LABEL } from '@/brain/prs';
import { evaluatePlan } from '@/brain/plan';
import { suggestNext } from '@/brain/progression';
import { inLighterWeek } from '@/brain/deload';
import { warmupSets } from '@/brain/coach/pre';
import { pickCue } from '@/brain/coach/cues';
import { substitutesFor } from '@/brain/substitute';
import { weightTrendPctPerWeek } from '@/brain/coach/weeklyReview';
import { ToolError, getHeartSession, loadOf } from './read';
import { planDraftArg } from './actions';
import { coachCtx, exerciseName, exerciseOf, hoursLeftOut, progressionCtxFor, readinessToday, recoveryAt, redactDrivers, type ToolCtx } from './context';
import { isWorkingSet } from '@/brain/exposure';

type P = Record<string, unknown>;
const r1 = (v: number): number => Math.round(v * 10) / 10;
const lastN = <T>(xs: T[], n = 12): T[] => (xs.length > n ? xs.slice(-n) : xs);
/** n items spread evenly, always keeping the first and the last. */
export const sampleEvenly = <T>(xs: T[], n: number): T[] => (xs.length <= n ? xs : Array.from({ length: n }, (_, i) => xs[Math.round((i * (xs.length - 1)) / (n - 1))]!));
const intIn = (v: unknown, lo: number, hi: number, def: number, name: string): number => {
  if (v == null) return def;
  const n = Math.round(Number(v));
  if (!Number.isFinite(n) || n < lo || n > hi) throw new ToolError(`${name} must be ${lo}–${hi}`);
  return n;
};
const exId = (ctx: ToolCtx, v: unknown): string => {
  if (typeof v !== 'string' || !exerciseOf(ctx, v)) throw new ToolError(`unknown exerciseId ${String(v)}; use search_exercises`);
  return exerciseOf(ctx, v)!.id;
};
const period = (v: unknown, name: string): { from: string; to: string } => {
  const o = v as { from?: unknown; to?: unknown } | null;
  const ok = (d: unknown) => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d);
  if (!o || !ok(o.from) || !ok(o.to) || String(o.from) > String(o.to)) throw new ToolError(`${name} needs from ≤ to, as YYYY-MM-DD`);
  return { from: String(o.from), to: String(o.to) };
};

/** Components that need a sharing toggle. */
export const COMPONENT_GATE: Partial<Record<ShowComponentId, 'health' | 'body'>> = { heart_session: 'health', body_trend: 'body' };

export function summarize(component: string, params: P, ctx: ToolCtx): Record<string, unknown> {
  if (!SHOW_COMPONENT_IDS.includes(component as ShowComponentId)) throw new ToolError(`unknown component ${component}`);
  const s = ctx.state;
  switch (component as ShowComponentId) {
    case 'lift_trend': {
      const id = exId(ctx, params.exerciseId);
      const weeks = intIn(params.weeks, 4, 52, 12, 'weeks');
      const metric = params.metric === 'top_set' || params.metric === 'volume' ? params.metric : 'e1rm';
      const all = exerciseHistory(s.sessions, id, s.customExercises);
      const since = addDays(ctx.today, -weeks * 7);
      // ES-15: first/last/best over the whole window; the drawn points are 12 spread evenly across it.
      const inWindow = all.filter(h => h.day >= since);
      // QA-R3a-2: judged by the lift's mode (less assistance is progress).
      const liftMode = modeOf(id, s.customExercises);
      // QA4-1b: an assisted lift's "volume" is its reps; the kg is the machine's help.
      const assistedVolume = metric === 'volume' && liftMode === 'assisted';
      const val = (h: typeof inWindow[number]) => (metric === 'e1rm' ? r1(h.bestE1rm || h.topKg) : metric === 'top_set' ? h.topKg
        : assistedVolume ? h.sets.reduce((a, x) => a + (x.reps ?? 0), 0) : Math.round(h.volume));
      const hist = sampleEvenly(inWindow, 12);
      const points = hist.map(h => ({ day: h.day, value: val(h) }));
      const values = inWindow.map(val).filter(v => v > 0);
      // BUG-15: the lighter week's sessions are not decline evidence.
      const evidence = all.filter(h => !inLighterWeek(h.day, s.deload));
      const p = plateauStatus(evidence, liftMode);
      const t = liftTrend(evidence, liftMode);
      // O4: the per-session effort split. A bodyweight/assisted load only reaches Escobar with
      // sharing.body on (BODY_KEYS/BODY_FACT in loop.ts scrub by key name, not by value, so the
      // numbers themselves must never be body-weight-derived when sharing is off).
      const bw = s.escobar.sharing.body ? bodyWeightResolver(s) : undefined;
      const share = bodyweightShare(exerciseOf(ctx, id));
      const bwAt = (day: string, addedKg: number) => (bw ? effectiveLoadKg(addedKg, liftMode, share, bw(day)) : null);
      const effort = effortSplit(hist, liftMode, bwAt).map(e => ({ day: e.day, easy: r1(e.easy), ideal: r1(e.ideal), max: r1(e.max), unrated: r1(e.unrated) }));
      const effortUnit = effortUsesSets(hist, liftMode) ? 'sets' : 'kg';
      return {
        exercise: exerciseName(ctx, id), exerciseId: id, metric, unit: assistedVolume ? 'reps' : 'kg', weeks, points, effort, effortUnit,
        first: values[0] ?? null, last: values.at(-1) ?? null, best: values.length ? Math.max(...values) : null,
        plateau: p.status, trend: t.direction,
        empty: !points.length ? `No ${exerciseName(ctx, id)} sessions in the last ${weeks} weeks.` : undefined,
      };
    }
    case 'recovery_map': {
      let at = ctx.now;
      if (params.at != null) {
        const t = Date.parse(String(params.at));
        if (!Number.isFinite(t) || t > ctx.now + 7 * 86_400_000 + 60_000) throw new ToolError('at must be an ISO time at most 7 days ahead');
        at = t;
      }
      const rec = recoveryAt(ctx, at).filter(r => r.lastTrainedAt);
      const least = [...rec].sort((a, b) => a.pct - b.pct).slice(0, 3);
      return {
        at: new Date(at).toISOString().slice(0, 16),
        muscles: Object.fromEntries(rec.map(r => [r.muscle, r.pct])),
        // QA3-5: a sore flag and a nulled hoursLeft, like get_recovery already does.
        least: least.map(r => ({ muscle: r.muscle, label: muscleLabel(r.muscle), pct: r.pct, hoursLeft: hoursLeftOut(r), ...(r.soreToday ? { soreToday: true } : {}) })),
        empty: rec.length ? undefined : 'Nothing logged yet.',
      };
    }
    case 'volume_bars': {
      const muscles = Array.isArray(params.muscles) ? (params.muscles as string[]).filter(m => MUSCLE_IDS.includes(m as MuscleId)) as MuscleId[] : undefined;
      intIn(params.weeks, 1, 12, 1, 'weeks');
      const rows = muscleVolumeStatus(s.sessions, ctx.today, s.customExercises, { schedule: s.schedule, daysOff: s.daysOff, plannedDays: s.profile.plannedDays }, s.profile.trainingSince).filter(r => (muscles?.length ? muscles.includes(r.muscle) : r.status !== 'unknown')).sort((a, b) => b.thisWeekSets - a.thisWeekSets).slice(0, 12);
      return { bars: rows.map(r => ({ muscle: r.muscle, label: muscleLabel(r.muscle), sets: r.thisWeekSets, lastWeekSets: r.lastWeekSets, band: r.band, status: r.status })), empty: rows.length ? undefined : 'No sets logged this week yet.' };
    }
    case 'readiness_gauge': {
      const r = readinessToday(ctx);
      return r ? { score: r.score, band: r.band, confidence: r.confidence, calibrating: r.calibrating, drivers: redactDrivers(r.drivers, s.escobar.sharing.health), loadAdvice: r.loadAdvice } : { score: null, empty: 'No readiness yet: add a check-in or connect health data.' };
    }
    case 'readiness_history': {
      const days = intIn(params.days, 7, 30, 14, 'days');
      const series = readinessSeries(coachCtx(ctx), days).map((r, i) => ({ day: addDays(ctx.today, -i), band: r?.band ?? null, score: r?.score ?? null })).reverse();
      const scored = series.filter(x => x.score != null);
      return { days, points: lastN(series, 30), green: series.filter(x => x.band === 'green').length, amber: series.filter(x => x.band === 'amber').length, red: series.filter(x => x.band === 'red').length, empty: scored.length ? undefined : 'No readiness history yet.' };
    }
    case 'week_summary': {
      const off = intIn(params.offsetWeeks, 0, 8, 0, 'offsetWeeks');
      const day = addDays(weekStart(ctx.today), -7 * off + (off ? 6 : 0));
      const target = off ? day : ctx.today;
      const planned = plannedThisWeek(s.schedule, s.daysOff, target);
      const w = weekSummary(s.sessions, target, s.customExercises, planned);
      // F13b: with body-weight sharing on, the coach's volume matches Stats (docs/F13-BODYWEIGHT-LOAD.md §10).
      const bw = s.escobar.sharing.body ? bodyWeightResolver(s) : undefined;
      const withBw = bw ? weekSummary(s.sessions, target, s.customExercises, planned, bw) : null;
      // QA6-1: withBodyweightKg goes right after volumeKg so it lands inside the Generic card's first 6 rows.
      return { week: w.start, workouts: w.workouts, sets: w.sets, volumeKg: w.volumeKg, ...(withBw ? { withBodyweightKg: withBw.volumeKg } : {}), records: w.records.length, grade: w.grade.title };
    }
    case 'session_summary': {
      const x = s.sessions.find(y => y.id === params.sessionId);
      if (!x) throw new ToolError('unknown sessionId; use get_sessions');
      // QA3-10: a warm-up is not a working set, in the count or the effort tally - workingTotals
      // is the one sum for "how many working sets", shared with compare_periods.
      const e = x.exercises.map(ex => {
        const top = ex.sets.filter(st => (st.kg ?? 0) > 0).sort((a, b) => (b.kg ?? 0) - (a.kg ?? 0))[0];
        return { exercise: ex.name, sets: workingTotals([ex], s.customExercises).sets, ...(top ? { top: { ...loadOf(ctx, ex.exerciseId, top.kg!), reps: top.reps ?? 0 } } : {}) };
      });
      const all = x.exercises.flatMap(ex => ex.sets.filter(isWorkingSet));
      return {
        sessionId: x.id, day: x.day, split: x.splitName, durationMin: Math.round(x.durationSec / 60), exercises: e.slice(0, 12),
        effort: { easy: all.filter(z => z.effort === 'easy').length, ideal: all.filter(z => z.effort === 'ideal').length, max: all.filter(z => z.effort === 'max').length },
        ...(s.escobar.sharing.health && x.heart ? { heart: { avgBpm: x.heart.avgBpm, maxBpm: x.heart.maxBpm } } : {}),
      };
    }
    case 'records_list': {
      const id = params.exerciseId != null ? exId(ctx, params.exerciseId) : undefined;
      const limit = intIn(params.limit, 1, 10, 5, 'limit');
      const rows = allRecords(s.sessions, s.customExercises, s.preferences.weightUnit).filter(r => !id || r.exerciseId === id).slice(0, limit);
      return { records: rows.map(r => ({ exercise: r.exerciseName, day: r.day, kind: PR_LABEL[r.kind], detail: r.detail })), empty: rows.length ? undefined : 'No records yet.' };
    }
    case 'plan_week': {
      if (params.draft != null) {
        const d = planDraftArg(params.draft, ctx);
        const ev = evaluatePlan(d, { goal: s.goal, custom: s.customExercises, sessions: s.sessions, today: ctx.today, trainingSince: s.profile.trainingSince });
        return { source: 'draft', days: WEEKDAYS.map(day => { const sp = d.splits.find(x => x.ref === d.schedule[day]); return { day, split: sp?.name ?? null, sets: sp ? sp.exercises.reduce((a, e) => a + e.sets, 0) : 0, muscles: sp ? [...new Set(sp.exercises.flatMap(e => exerciseOf(ctx, e.exerciseId)?.primary ?? []))].slice(0, 4) : [] }; }), sessionMinutes: ev.sessionMinutes };
      }
      return { source: 'current', days: WEEKDAYS.map(day => { const sp = s.splits.find(x => x.id === s.schedule[day]); return { day, split: sp?.name ?? null, sets: sp ? sp.exercises.reduce((a, e) => a + e.sets, 0) : 0, muscles: sp ? [...new Set(sp.exercises.flatMap(e => exerciseOf(ctx, e.exerciseId)?.primary ?? []))].slice(0, 4) : [] }; }) };
    }
    case 'plan_evaluation': {
      const d = planDraftArg(params.draft, ctx);
      const ev = evaluatePlan(d, { goal: s.goal, custom: s.customExercises, sessions: s.sessions, today: ctx.today, trainingSince: s.profile.trainingSince });
      const rows = (Object.entries(ev.weeklySets) as Array<[MuscleId, { sets: number; band: [number, number]; status: string }]>).sort((a, b) => b[1].sets - a[1].sets).slice(0, 12);
      return { muscles: rows.map(([m, v]) => ({ muscle: m, label: muscleLabel(m), sets: v.sets, band: v.band, status: v.status })), balance: ev.balance, conflicts: ev.recoveryConflicts, issues: ev.issues.slice(0, 8), sessionMinutes: ev.sessionMinutes };
    }
    case 'exercise_card': {
      const id = exId(ctx, params.exerciseId);
      const e = exerciseOf(ctx, id)!;
      const pctx = progressionCtxFor(ctx, id);
      const profile = pctx.equipment;
      const next = suggestNext(s.sessions, id, s.goal, ctx.today, e.defaultSets, s.customExercises, pctx);
      const cue = pickCue(e, 'coach', `${ctx.today}|${id}`);
      return {
        exercise: e.name, exerciseId: id, equipment: e.equipment, primary: e.primary, secondary: e.secondary,
        next: { target: next.target, reason: next.reason },
        warmup: e.role === 'main' && (next.sets[0]?.kg ?? 0) > 0 ? warmupSets(next.sets[0]!.kg!, profile).map(w => ({ ...loadOf(ctx, id, w.kg), reps: w.reps })) : [],
        cue: cue?.text ?? null, substitutes: substitutesFor(e, s.customExercises).slice(0, 3).map(x => x.name),
      };
    }
    case 'heart_session': return getHeartSession({ sessionId: String(params.sessionId ?? '') }, ctx) as Record<string, unknown>;
    case 'compare_periods': {
      const metric = params.metric;
      if (!['sets', 'volume', 'sessions', 'e1rm'].includes(String(metric))) throw new ToolError('metric must be sets, volume, sessions or e1rm');
      const a = period(params.a, 'a'), b = period(params.b, 'b');
      const exercise = params.exerciseId != null ? exId(ctx, params.exerciseId) : undefined;
      if (metric === 'e1rm' && !exercise) throw new ToolError('e1rm needs an exerciseId');
      // F13b: with body-weight sharing on, "effective" volume matches Stats (docs/F13-BODYWEIGHT-LOAD.md §10).
      const bw = s.escobar.sharing.body ? bodyWeightResolver(s) : undefined;
      const calc = (p: { from: string; to: string }, withBw?: typeof bw): number => {
        const inP = s.sessions.filter(x => x.day >= p.from && x.day <= p.to);
        if (metric === 'sessions') return inP.length;
        if (metric === 'e1rm') return r1(Math.max(0, ...exerciseHistory(inP, exercise!, s.customExercises).map(h => h.bestE1rm)));
        // QA4-1b: the one volume sum, so assistance is never counted as weight lifted.
        if (withBw) {
          let sets = 0, vol = 0;
          for (const x of inP) { const t = workingTotals(x.exercises.filter(e => !exercise || e.exerciseId === exercise), s.customExercises, withBw(x.day)); sets += t.sets; vol += t.volumeKg; }
          return metric === 'sets' ? sets : Math.round(vol);
        }
        const { sets, volumeKg: vol } = workingTotals(inP.flatMap(x => x.exercises).filter(e => !exercise || e.exerciseId === exercise), s.customExercises);
        return metric === 'sets' ? sets : Math.round(vol);
      };
      const va = calc(a), vb = calc(b);
      const effA = bw && metric === 'volume' ? calc(a, bw) : null;
      const effB = bw && metric === 'volume' ? calc(b, bw) : null;
      return {
        metric, ...(exercise ? { exercise: exerciseName(ctx, exercise) } : {}),
        a: { ...a, value: va, ...(effA != null ? { effective: effA } : {}) },
        b: { ...b, value: vb, ...(effB != null ? { effective: effB } : {}) },
        delta: r1(vb - va), deltaPct: va ? r1(((vb - va) / va) * 100) : null,
        // QA6-3: the coach's own delta, so it never points the opposite way to Stats' effective totals.
        ...(effA != null && effB != null ? { effectiveDelta: r1(effB - effA), effectiveDeltaPct: effA ? r1(((effB - effA) / effA) * 100) : null } : {}),
      };
    }
    case 'body_trend': {
      const weeks = intIn(params.weeks, 4, 52, 12, 'weeks');
      const since = addDays(ctx.today, -weeks * 7);
      const log = s.weightLog.filter(w => w.day >= since);
      const t = weightTrendPctPerWeek(log);
      return { weeks, points: lastN(log).map(w => ({ day: w.day, kg: w.kg })), trendKg: t?.trendKg ?? null, pctPerWeek: t?.pctPerWeek ?? null, bodyFat: s.body.filter(b => b.day >= since).slice(-6).map(b => ({ day: b.day, pct: b.bodyFatPct })), empty: log.length ? undefined : `No weigh-ins in the last ${weeks} weeks.` };
    }
  }
}


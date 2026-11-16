import { describe, it, expect } from 'vitest';
import * as R from '@/escobar/tools/read';
import { FIXTURES, ctxOf, sixMonthsState, twoWeeksState, emptyState, NOW, TODAY } from './fixtures';
import { addDays as addDaysLocal } from '@/core/dates';
import { session, sets } from '../helpers';

const bytes = (v: unknown) => JSON.stringify(v).length;
const CASES: Array<[string, (ctx: ReturnType<typeof ctxOf>) => unknown, number]> = [
  ['get_overview', c => R.getOverview({}, c), 1200],
  ['get_sessions', c => R.getSessions({ limit: 20 }, c), 5200],
  ['get_exercise_history', c => R.getExerciseHistory({ exerciseId: 'lib_barbell_bench_press', weeks: 52 }, c), 6200],
  ['get_next_target', c => R.getNextTarget({ exerciseId: 'lib_barbell_bench_press' }, c), 3200],
  ['get_recovery', c => R.getRecovery({}, c), 5200],
  ['get_readiness', c => R.getReadiness({ historyDays: 30 }, c), 3200],
  ['get_volume', c => R.getVolume({ weeks: 12 }, c), 5200],
  ['get_records', c => R.getRecords({ limit: 20 }, c), 4200],
  ['get_insights', c => R.getInsights({}, c), 9200],
  ['get_plan', c => R.getPlan({}, c), 6200],
  ['get_body', c => R.getBody({ weeks: 52 }, c), 3200],
  ['get_health', c => R.getHealth({ days: 30 }, c), 4200],
  ['get_live_session', c => R.getLiveSession({}, c), 3200],
  ['search_exercises', c => R.searchExercisesTool({ query: 'press', limit: 12 }, c), 4000],
  ['get_exercise', c => R.getExercise({ exerciseId: 'lib_barbell_bench_press' }, c), 3000],
  ['get_equipment', c => R.getEquipment({ exerciseId: 'lib_dumbbell_shoulder_press' }, c), 3200],
  ['find_in_app', () => R.findInAppTool({ query: 'where is my recovery' }), 3000],
];

describe.each(FIXTURES)('read tools on the %s fixture', (_name, make) => {
  const ctx = ctxOf(make());
  it.each(CASES)('%s runs and stays under its byte cap', (_tool, run, cap) => {
    const out = run(ctx);
    expect(out).toBeTruthy();
    expect(bytes(out)).toBeLessThanOrEqual(cap);
  });
});

describe('read tool details', () => {
  const six = ctxOf(sixMonthsState());
  it('overview names the scheduled split and the least recovered muscles', () => {
    const o = R.getOverview({}, six);
    expect(o.scheduled?.split).toBe('Pull');
    expect(o.leastRecovered.length).toBe(3);
    expect(o.readiness).not.toBeNull();
  });
  it('sessions filter by day and split, newest first, with limit', () => {
    const all = R.getSessions({ limit: 20 }, six);
    expect(all.sessions[0]!.day >= all.sessions[1]!.day).toBe(true);
    const pull = R.getSessions({ splitId: 'sp_pull', limit: 5 }, six);
    expect(pull.sessions.every(s => s.split === 'Pull')).toBe(true);
    const range = R.getSessions({ from: '2026-09-14', to: '2026-09-20' }, six);
    expect(range.sessions.every(s => s.day >= '2026-09-14' && s.day <= '2026-09-20')).toBe(true);
    expect(() => R.getSessions({ limit: 50 }, six)).toThrow(/between 1 and 20/);
    expect(() => R.getSessions({ from: 'yesterday' }, six)).toThrow(/YYYY-MM-DD/);
  });
  it('QA3-10: a session\'s set count leaves out warm-ups', async () => {
    const { session } = await import('../helpers');
    const s = session('2026-09-10', [{ id: 'lib_barbell_bench_press', sets: [
      { kg: 40, reps: 10, kind: 'warmup', effort: 'easy' },
      { kg: 60, reps: 8, effort: 'ideal' },
      { kg: 60, reps: 8, effort: 'ideal' },
    ] }]);
    const ctx = ctxOf({ ...six.state, sessions: [...six.state.sessions, s] });
    const row = R.getSessions({ limit: 1 }, ctx).sessions.find((r: { sessionId: string }) => r.sessionId === s.id) as { sets: number };
    expect(row.sets).toBe(2);
  });
  it('one session has every set and no heart without sharing', () => {
    const id = R.getSessions({ limit: 1 }, six).sessions[0]!.sessionId;
    const s = R.getSession({ sessionId: id }, six);
    expect(s.exercises.length).toBe(3);
    expect(s.exercises[0]!.sets.length).toBe(3);
    expect(() => R.getSession({ sessionId: 'nope' }, six)).toThrow(/unknown sessionId/);
  });
  it('exercise history reports plateau, trend and loads with a unit', () => {
    const h = R.getExerciseHistory({ exerciseId: 'lib_barbell_bench_press', weeks: 12 }, six);
    expect(h.sessions.length).toBeGreaterThan(10);
    expect(h.sessions[0]!.top.unit).toBe('kg');
    expect(['progressing', 'plateaued', 'declining', 'unknown']).toContain(h.plateau.status);
    expect(() => R.getExerciseHistory({ exerciseId: 'lib_nope' }, six)).toThrow(/search_exercises/);
    expect(() => R.getExerciseHistory({ exerciseId: 'lib_barbell_bench_press', weeks: 60 }, six)).toThrow(/between 1 and 52/);
  });
  it('exercise history is newest first, and capping drops the oldest (ES-01)', () => {
    const full = R.getExerciseHistory({ exerciseId: 'lib_barbell_bench_press', weeks: 12 }, six);
    const days = full.sessions.map(x => x.day);
    expect(days).toEqual([...days].sort().reverse());
    const long = R.getExerciseHistory({ exerciseId: 'lib_barbell_bench_press', weeks: 52 }, six);
    const newest = sixMonthsState().sessions.filter(x => x.exercises.some(e => e.exerciseId === 'lib_barbell_bench_press')).at(-1)!.day;
    expect(long.sessions[0]!.day).toBe(newest);
    expect(JSON.stringify(long).length).toBeLessThanOrEqual(6200);
  });
  it('capJson drops from the chosen end', () => {
    const data = { rows: Array.from({ length: 200 }, (_, i) => ({ i, pad: 'x'.repeat(20) })) };
    const end = R.capJson(data, 1000);
    const start = R.capJson(data, 1000, { dropFrom: 'start' });
    expect(end.rows[0]!.i).toBe(0);
    expect(start.rows.at(-1)!.i).toBe(199);
    expect(start.rows[0]!.i).toBeGreaterThan(0);
  });
  it('next target includes a warm-up for main lifts and the equipment unit', () => {
    const lb = sixMonthsState();
    lb.units.byExercise.gym_default = { lib_barbell_bench_press: { unit: 'lb', barKg: 20.412, plates: [45, 35, 25, 10, 5, 2.5], source: 'user', updatedAt: '' } };
    const t = R.getNextTarget({ exerciseId: 'lib_barbell_bench_press' }, ctxOf(lb));
    expect(t.unit).toBe('lb');
    expect(t.target).toContain('lb');
    expect(t.warmup.length).toBe(3);
  });
  it('recovery projects forward and refuses more than 7 days', () => {
    const now = R.getRecovery({ muscles: ['chest'] }, six);
    const later = R.getRecovery({ muscles: ['chest'], at: new Date(NOW + 48 * 3600e3).toISOString() }, six);
    expect(later.muscles[0]!.pct).toBeGreaterThanOrEqual(now.muscles[0]!.pct);
    expect(() => R.getRecovery({ at: new Date(NOW + 9 * 86400e3).toISOString() }, six)).toThrow(/7 days/);
    expect(() => R.getRecovery({ muscles: ['wings'] }, six)).toThrow(/unknown muscles/);
  });
  it('readiness hides health drivers and baselines without health sharing', () => {
    const s = sixMonthsState();
    s.escobar.sharing.health = false;
    const r = R.getReadiness({}, ctxOf(s));
    expect('baselines' in r).toBe(false);
    const shared = R.getReadiness({ historyDays: 7 }, six);
    expect(shared.baselines).toBeTruthy();
    expect(shared.history).toHaveLength(7);
  });
  it('insights include every rule, not just the top three', () => {
    const i = R.getInsights({}, six);
    expect(i.insights.length).toBeGreaterThan(3);
    expect(i.insights.every(x => x.id && x.title && x.action)).toBe(true);
  });
  it('plan lists splits with exercise names and the schedule by name', () => {
    const p = R.getPlan({}, six);
    expect(p.splits).toHaveLength(3);
    expect(p.schedule.mon).toBe('Push');
    expect(p.goal.mainReps).toEqual([6, 12]);
  });
  it('body gives the trend and BMI', () => {
    const b = R.getBody({ weeks: 52 }, six);
    expect(b.bmi).toBeCloseTo(80.5 / 1.8 ** 2, 0);
    expect(b.bodyFat).toHaveLength(2);
  });
  it('live session is empty without one', () => {
    expect(R.getLiveSession({}, six)).toEqual({ active: false });
    const s = twoWeeksState();
    s.active = { splitId: 'sp_push', startedAt: new Date(NOW - 20 * 60e3).toISOString(), pausedMs: 0, entries: [{ exerciseId: 'lib_barbell_bench_press', name: 'Bench', sets: [{ kg: 60, reps: 10, effort: 'easy', fidelity: 'live', at: new Date(NOW).toISOString() }, {}, {}], done: false, skipped: false }] };
    const l = R.getLiveSession({}, ctxOf(s));
    expect(l).toMatchObject({ active: true, split: 'Push', elapsedMin: 20 });
  });
  it('search filters by muscle and equipment', () => {
    const r = R.searchExercisesTool({ muscle: 'chest', equipment: 'Dumbbells' }, six);
    expect(r.exercises.length).toBeGreaterThan(0);
    expect(r.exercises.every(e => e.primary.includes('chest'))).toBe(true);
    expect(() => R.searchExercisesTool({ muscle: 'wings' }, six)).toThrow();
  });
  it('equipment reports the gym and loadable neighbours', () => {
    const e = R.getEquipment({ exerciseId: 'lib_dumbbell_shoulder_press' }, six) as unknown as { profile: { unit: string; ladder: number[] }; loadableNear: unknown[] };
    expect(e.profile.unit).toBe('kg');
    expect(e.profile.ladder.length).toBeGreaterThan(5);
    expect(e.loadableNear.length).toBeGreaterThan(0);
    expect(() => R.getEquipment({ gymId: 'nope' }, six)).toThrow(/unknown gymId/);
  });
  // LT-4: get_equipment's confidence and get_next_target's repWindow/menuConfidence (LT-1's loadMenu, LT-2's chooseRung).
  it('LT-4 equipment names how sure the coach is of the gym\'s load menu', () => {
    const e = R.getEquipment({ exerciseId: 'lib_dumbbell_shoulder_press' }, six) as unknown as { confidence: string };
    expect(['known', 'learned', 'assumed']).toContain(e.confidence);
    // No profile and no history anywhere: the built-in default, unconfirmed.
    expect((R.getEquipment({ exerciseId: 'lib_dumbbell_shoulder_press' }, ctxOf(emptyState())) as unknown as { confidence: string }).confidence).toBe('assumed');
  });
  it('LT-4 a start suggestion (no history) never re-solves a rung: no repWindow, no menuConfidence', () => {
    const t = R.getNextTarget({ exerciseId: 'lib_dumbbell_shoulder_press' }, ctxOf(emptyState())) as unknown as { repWindow?: [number, number]; menuConfidence?: string };
    expect(t.repWindow).toBeUndefined();
    expect(t.menuConfidence).toBeUndefined();
  });
  it('LT-4 an increase on an assumed menu carries the re-solved repWindow and menuConfidence', () => {
    const ex = 'lib_dumbbell_lateral_raise';
    const a = session('2026-09-12', [{ id: ex, sets: sets(4, 15) }]);
    const b = session('2026-09-15', [{ id: ex, sets: sets(4, 15) }]);
    const t = R.getNextTarget({ exerciseId: ex }, ctxOf({ ...emptyState(), sessions: [a, b] })) as unknown as { mode: string; repWindow?: [number, number]; menuConfidence?: string };
    expect(t.menuConfidence).toBe('assumed');
    expect(t.repWindow).toBeDefined();
    expect(t.repWindow![1]).toBeGreaterThanOrEqual(t.repWindow![0]);
  });
  it('find_in_app returns palace entries', () => {
    expect(R.findInAppTool({ query: 'export a backup' }).results[0]!.id).toBe('settings.data');
    expect(() => R.findInAppTool({ query: '' })).toThrow();
  });
  it('capJson trims arrays and marks truncation', () => {
    const big = { rows: Array.from({ length: 500 }, (_, i) => ({ i, pad: 'x'.repeat(20) })) };
    const out = R.capJson(big, 1000) as typeof big & { truncated?: boolean };
    expect(JSON.stringify(out).length).toBeLessThanOrEqual(1000);
    expect(out.truncated).toBe(true);
    expect(R.capJson({ a: 1 }, 100)).toEqual({ a: 1 });
  });
  it('empty state answers without throwing', () => {
    const e = ctxOf(emptyState());
    expect(R.getOverview({}, e).scheduled).toBeNull();
    expect(R.getRecovery({}, e).muscles).toEqual([]);
    expect(R.getInsights({}, e).insights).toBeDefined();
  });
});

describe('QA3-5: soreness-held-back muscles carry a sore flag, not a bare hoursLeft:0', () => {
  it('get_overview leastRecovered and recovery_map both flag it and null the hours', async () => {
    const { freshState } = await import('@/core/models');
    const { makeCtx } = await import('@/escobar/tools/context');
    const { sessionAt, sets } = await import('../helpers');
    const { summarize } = await import('@/escobar/tools/show');
    const soreState = {
      ...freshState(),
      sessions: [sessionAt('2026-09-01T17:00:00.000Z', '2026-09-01T18:00:00.000Z', [{ id: 'lib_barbell_bench_press', sets: sets(60, 8, 'easy', 1) }])],
      checkIns: [{ day: '2026-09-22', soreness: { chest: 5 as const } }],
    };
    const ctx = makeCtx(soreState, Date.parse('2026-09-22T18:00:00'));
    const chest = R.getOverview({}, ctx).leastRecovered.find((m: { muscle: string }) => m.muscle === 'chest') as { pct: number; hoursLeft: number | null; soreToday?: boolean };
    expect(chest.pct).toBeLessThanOrEqual(60);
    expect(chest.soreToday).toBe(true);
    expect(chest.hoursLeft).toBeNull();
    const map = summarize('recovery_map', {}, ctx) as { least: Array<{ muscle: string; hoursLeft: number | null; soreToday?: boolean }> };
    const chestMap = map.least.find(m => m.muscle === 'chest')!;
    expect(chestMap.soreToday).toBe(true);
    expect(chestMap.hoursLeft).toBeNull();
    // get_recovery already flagged soreToday (QA2-FC-5); its hoursLeft gets the same null for consistency.
    const rec = R.getRecovery({}, ctx).muscles.find((m: { muscle: string }) => m.muscle === 'chest') as { hoursLeft: number | null; soreToday?: boolean };
    expect(rec.soreToday).toBe(true);
    expect(rec.hoursLeft).toBeNull();
  });
});

describe('volume status carries the week it was judged on (QA-R3a-1, QA-R3a-8)', () => {
  it('get_volume and volume_bars include last week next to this week', async () => {
    const six = ctxOf(sixMonthsState());
    const v = R.getVolume({}, six) as { muscles: Array<{ lastWeekSets?: number; thisWeekSets: number }>; statusJudgedOn: string };
    expect(v.muscles.every(m => typeof m.lastWeekSets === 'number')).toBe(true);
    expect(v.statusJudgedOn).toMatch(/last completed week/);
    const { summarize } = await import('@/escobar/tools/show');
    const bars = summarize('volume_bars', {}, six) as { bars: Array<{ lastWeekSets?: number }> };
    expect(bars.bars.every(b => typeof b.lastWeekSets === 'number')).toBe(true);
  });
});

describe('assisted lifts in Escobar (QA-R3a-2)', () => {
  it('less assistance over time reads as progress in get_exercise_history and lift_trend', async () => {
    const s = sixMonthsState();
    const id = 'lib_assisted_pull_up';
    const sessions = Array.from({ length: 8 }, (_, i) => {
      const day = new Date(Date.UTC(2026, 6, 28 + i * 7)).toISOString().slice(0, 10);
      return { id: `ap${i}`, splitId: 'x', splitName: 'Pull', day, startedAt: `${day}T10:00:00.000Z`, endedAt: `${day}T11:00:00.000Z`, durationSec: 3600, exercises: [{ exerciseId: id, name: 'Assisted Pull-Up', sets: [{ kg: 40 - i * 4, reps: 8, effort: 'ideal' as const }] }], logging: { mode: 'live', flags: [] } as never };
    });
    const c = ctxOf({ ...s, sessions: [...s.sessions, ...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)) });
    const h = R.getExerciseHistory({ exerciseId: id, weeks: 12 }, c) as { plateau: { status: string }; trend: { direction: string } };
    expect(h.plateau.status).toBe('progressing');
    expect(h.trend.direction).toBe('up');
    const { summarize } = await import('@/escobar/tools/show');
    expect((summarize('lift_trend', { exerciseId: id, weeks: 12 }, c) as { plateau: string }).plateau).toBe('progressing');
  });
  it('more reps at the same assistance reads as up, not down (QA2-FC-4)', async () => {
    const s = sixMonthsState();
    const id = 'lib_assisted_pull_up';
    const reps = [3, 3, 4, 4, 5, 5, 6, 6];
    const sessions = reps.map((r, i) => {
      const day = new Date(Date.UTC(2026, 6, 28 + i * 7)).toISOString().slice(0, 10);
      return { id: `ar${i}`, splitId: 'x', splitName: 'Pull', day, startedAt: `${day}T10:00:00.000Z`, endedAt: `${day}T11:00:00.000Z`, durationSec: 3600, exercises: [{ exerciseId: id, name: 'Assisted Pull-Up', sets: [{ kg: 20, reps: r, effort: 'ideal' as const }] }], logging: { mode: 'live', flags: [] } as never };
    });
    const c = ctxOf({ ...s, sessions: [...s.sessions, ...sessions].sort((a, b) => a.startedAt.localeCompare(b.startedAt)) });
    const h = R.getExerciseHistory({ exerciseId: id, weeks: 12 }, c) as { plateau: { status: string }; trend: { direction: string } };
    expect(h.plateau.status).toBe('progressing');
    expect(h.trend.direction).toBe('up');
    const { summarize } = await import('@/escobar/tools/show');
    expect((summarize('lift_trend', { exerciseId: id, weeks: 12 }, c) as { trend: string }).trend).toBe('up');
  });
});

describe('warm-ups in the live view (QA-R6-3, QA-R6-11)', () => {
  it('autoregulation reads the first working set, and warm-ups are not planned sets', () => {
    // ADAPT-2: the fixture's usual check-in now reads green, so today's is set below the user's usual to keep it amber.
    const s0 = sixMonthsState();
    const s = { ...s0, checkIns: s0.checkIns.map((c, i) => (i === 0 ? { ...c, sleepQuality: 2 as const, mood: 3 as const } : c)) };
    const bench = 'lib_barbell_bench_press';
    const warm = [{ id: 'w1', kg: 40, reps: 8, kind: 'warmup' as const, effort: 'easy' as const, at: new Date(NOW - 300_000).toISOString(), fidelity: 'live' as const }, { id: 'w2', kg: 55, reps: 5, kind: 'warmup' as const }];
    const live = (first: Record<string, unknown>) => ({ ...s, active: { id: 'a', splitId: s.splits[0]!.id, startedAt: new Date(NOW - 600_000).toISOString(), pausedMs: 0, gymId: s.units.activeGymId, entries: [{ id: 'e', exerciseId: bench, name: 'Bench', done: false, skipped: false, sets: [...warm, { id: 's1', ...first }, { id: 's2' }, { id: 's3' }] }] } });
    const target = R.getNextTarget({ exerciseId: bench, plannedSets: 3 }, ctxOf(s)) as { sets: Array<{ kg: number; reps: number }> };
    const t = target.sets[0]!;
    const easy = R.getLiveSession({}, ctxOf(live({ kg: t.kg, reps: t.reps + 2, effort: 'easy', fidelity: 'live', at: new Date(NOW - 60_000).toISOString() }) as never)) as { adjustment: string | null; current: { setsPlanned: number } };
    // BUG-15 (COACHRULES-F7): this fixture's readiness reads amber, so an easy set never brings "add load".
    expect(easy.adjustment).toBe(`Keep ${t.kg} kg for the next set.`);
    expect(easy.current.setsPlanned).toBe(3);
    // The easy warm-up in front is not read: a missed first working set still brings its advice.
    const missed = R.getLiveSession({}, ctxOf(live({ kg: t.kg, reps: Math.max(1, t.reps - 3), effort: 'max', fidelity: 'live', at: new Date(NOW - 60_000).toISOString() }) as never)) as { adjustment: string | null };
    expect(missed.adjustment).toMatch(/\S/);
    const unrated = R.getLiveSession({}, ctxOf(live({}) as never)) as { adjustment: string | null };
    expect(unrated.adjustment).toBeNull();
  });
});

describe('assisted lifts in the live view (QA-R4b-5)', () => {
  it('get no load advice, like Train', async () => {
    const { sessionAt } = await import('../helpers');
    const s = sixMonthsState();
    const id = 'lib_assisted_pull_up';
    const past = sessionAt(new Date(NOW - 49 * 86_400_000).toISOString(), new Date(NOW - 49 * 86_400_000 + 3_600_000).toISOString(), [{ id, sets: [{ kg: 20, reps: 8, effort: 'ideal' }] }]);
    const state = { ...s, sessions: [...s.sessions, past].sort((a, b) => a.startedAt.localeCompare(b.startedAt)), active: { id: 'a', splitId: s.splits[0]!.id, startedAt: new Date(NOW - 600_000).toISOString(), pausedMs: 0, gymId: s.units.activeGymId, entries: [{ id: 'e', exerciseId: id, name: 'Assisted Pull-up', done: false, skipped: false, sets: [{ id: 's1', kg: 20, reps: 12, effort: 'easy', fidelity: 'live', at: new Date(NOW - 60_000).toISOString() }, { id: 's2' }] }] } };
    const l = R.getLiveSession({}, ctxOf(state as never)) as { adjustment: string | null };
    expect(l.adjustment).toBeNull();
  });
});

describe('get_health totals (QA-R5a-4)', () => {
  it("say a day's steps are as of its last sync", () => {
    const s = sixMonthsState();
    const day = addDaysLocal(TODAY, -1);
    const synced = new Date(`${day}T18:00:00`).toISOString();
    const st = { ...s, healthDays: [{ day, steps: 6000, activeCalories: 300, source: 'health_connect', syncedAt: synced }] };
    const h = R.getHealth({ days: 7 }, ctxOf(st as never)) as { days: Array<{ day: string; totalsAsOf?: string }>; note: string };
    expect(h.days.find(d => d.day === day)!.totalsAsOf).toBe('18:00');
    expect(h.note).toMatch(/last sync/);
  });
});

describe('Escobar loads and set kinds (QA2-FE-3, QA2-FE-5)', () => {
  it('a quarter-pound load reads as on screen, and a warm-up says it is one', async () => {
    const { displayToKg } = await import('@/core/units');
    const s = sixMonthsState();
    const gym = s.units.activeGymId;
    const st = { ...s, units: { ...s.units, gyms: s.units.gyms.map(g => (g.id === gym ? { ...g, defaultUnit: 'lb' as const } : g)) } };
    const c = ctxOf(st as never);
    expect(R.loadOf(c, 'lib_dumbbell_biceps_curl', displayToKg(26.25, 'lb')).value).toBe(26.25);
    const day = s.sessions.at(-1)!;
    const withWarm = { ...day, id: 'warmx', exercises: [{ ...day.exercises[0]!, sets: [{ kg: 20, reps: 8, kind: 'warmup' as const }, ...day.exercises[0]!.sets] }] };
    const c2 = ctxOf({ ...s, sessions: [...s.sessions.slice(0, -1), withWarm] } as never);
    const got = R.getSession({ sessionId: 'warmx' }, c2) as { exercises: Array<{ sets: Array<{ kind?: string }> }> };
    expect(got.exercises[0]!.sets[0]!.kind).toBe('warmup');
  });
});

describe('get_health totals time (QA2-FE-1)', () => {
  it('names when the steps were read, not a later sync that failed them', () => {
    const s = sixMonthsState();
    const day = addDaysLocal(TODAY, -1);
    const st = { ...s, healthDays: [{ day, steps: 6000, source: 'health_connect', syncedAt: new Date(`${day}T20:00:00`).toISOString(), totalsSyncedAt: new Date(`${day}T12:00:00`).toISOString() }] };
    const h = R.getHealth({ days: 7 }, ctxOf(st as never)) as { days: Array<{ day: string; totalsAsOf?: string }> };
    expect(h.days.find(d => d.day === day)!.totalsAsOf).toBe('12:00');
  });
});

describe('get_overview counts a midnight-crossing session as trained today (QA8-5)', () => {
  it('a session from 23:30 to 00:40, read at 01:00, is trainedToday with daysSinceLastSession 0', async () => {
    const { freshState } = await import('@/core/models');
    const { makeCtx } = await import('@/escobar/tools/context');
    const { sessionAt } = await import('../helpers');
    const { dayKey } = await import('@/core/dates');
    const started = new Date(2026, 8, 25, 23, 30);
    const finishedLate = { ...sessionAt(started.toISOString(), new Date(2026, 8, 26, 0, 40).toISOString(), []), splitId: 'split_lower', splitName: 'SPLIT 2 - LOWER AND CORE', day: dayKey(started) };
    const state = { ...freshState(), sessions: [finishedLate] };
    const ctx = makeCtx(state, new Date(2026, 8, 26, 1, 0).getTime());
    const o = R.getOverview({}, ctx) as { trainedToday: string[]; daysSinceLastSession: number | null };
    expect(o.trainedToday).toEqual(['SPLIT 2 - LOWER AND CORE']);
    expect(o.daysSinceLastSession).toBe(0);
  });
});

describe('get_overview without a session today is byte-identical to before QA8-5', () => {
  it('trainedToday and daysSinceLastSession match the plain day-based reading', () => {
    const six = ctxOf(sixMonthsState());
    const o = R.getOverview({}, six) as { trainedToday: string[]; daysSinceLastSession: number | null };
    expect(o.trainedToday).toEqual(six.state.sessions.filter(x => x.day === six.today).map(x => x.splitName));
    const lastDay = six.state.sessions.reduce((m, s) => (s.day > m ? s.day : m), '');
    expect(o.daysSinceLastSession).toBe(lastDay ? Math.round((Date.parse(six.today) - Date.parse(lastDay)) / 86_400_000) : null);
  });
});

describe('BUG-11 A4: an off-ladder target names the equipment snap', () => {
  it('get_next_target says the load was snapped to the equipment and points at get_equipment', () => {
    const t = R.getNextTarget({ exerciseId: 'lib_dumbbell_lateral_raise' }, ctxOf(emptyState())) as unknown as { kg: number; reason: string; equipmentSnap?: { fromKg: number; to: string; why: string } };
    expect(t.kg).toBe(2);
    expect(t.equipmentSnap).toEqual({ fromKg: 2.5, to: '2 kg', why: expect.stringMatching(/nearest weight this equipment has.*not.*recovery.*get_equipment/i) });
  });
  it('no snap, no equipmentSnap field', () => {
    const t = R.getNextTarget({ exerciseId: 'lib_barbell_bench_press' }, ctxOf(emptyState())) as unknown as { equipmentSnap?: unknown };
    expect(t.equipmentSnap).toBeUndefined();
  });
});

// BUG-15 review item 2: the lighter week's sessions are not decline evidence for Escobar either.
describe('lift history after a lighter week (BUG-15)', () => {
  const bench = 'lib_barbell_bench_press';
  const at = (day: string, kg: number, effort: 'ideal' | 'easy', n: number, i: number) => ({ id: `lw${i}`, splitId: 'x', splitName: 'Push', day, startedAt: `${day}T10:00:00.000Z`, endedAt: `${day}T11:00:00.000Z`, durationSec: 3600, exercises: [{ exerciseId: bench, name: 'Bench', sets: Array.from({ length: n }, () => ({ kg, reps: 8, effort })) }], logging: { mode: 'live', flags: [] } as never });
  // Seven weeks at 100 × 8, then the lighter week at 90 kg; TODAY is the day after it ends.
  const weeks = [0, 1, 2, 3, 4, 5, 6].map(i => at(addDaysLocal(TODAY, -56 + i * 7), 100, 'ideal', 3, i));
  const lighter = [-7, -4].map((o, i) => at(addDaysLocal(TODAY, o), 90, 'easy', 2, 10 + i));
  const state = () => ({ ...emptyState(), sessions: [...weeks, ...lighter], deload: { startDay: addDaysLocal(TODAY, -7), endDay: addDaysLocal(TODAY, -1), reason: 'x', setFactor: 0.6, loadFactor: 0.9 } });
  it('get_exercise_history reads plateaued, not declining', () => {
    const h = R.getExerciseHistory({ exerciseId: bench, weeks: 12 }, ctxOf(state())) as { plateau: { status: string } };
    expect(h.plateau.status).toBe('plateaued');
  });
  it('the lift_trend card reads plateaued, not declining', async () => {
    const { summarize } = await import('@/escobar/tools/show');
    expect((summarize('lift_trend', { exerciseId: bench, weeks: 12 }, ctxOf(state())) as { plateau: string }).plateau).toBe('plateaued');
  });
});

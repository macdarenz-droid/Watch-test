/**
 * App-state fixtures for Escobar's tools: empty, two weeks, and six months of PPL with
 * health data, check-ins and weigh-ins. Deterministic: a fixed "now".
 */
import { freshState, type AppState, type Session, type LoggedSet, type Split } from '@/core/models';
import { makeCtx, type ToolCtx } from '@/escobar/tools/context';
import { liveLogging } from '../helpers';

export const NOW = Date.parse('2026-09-22T18:00:00');
export const TODAY = '2026-09-22';

const day = (offset: number): string => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - offset);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

export const SPLITS: Split[] = [
  { id: 'sp_push', name: 'Push', color: '#4d9dff', focus: [], createdAt: '2026-01-01T00:00:00Z', exercises: [{ exerciseId: 'lib_barbell_bench_press', sets: 3 }, { exerciseId: 'lib_dumbbell_shoulder_press', sets: 3 }, { exerciseId: 'lib_triceps_pushdown', sets: 3 }] },
  { id: 'sp_pull', name: 'Pull', color: '#7fc44b', focus: [], createdAt: '2026-01-01T00:00:00Z', exercises: [{ exerciseId: 'lib_lat_pulldown', sets: 3 }, { exerciseId: 'lib_seated_cable_row', sets: 3 }, { exerciseId: 'lib_dumbbell_biceps_curl', sets: 3 }] },
  { id: 'sp_legs', name: 'Legs', color: '#ffc845', focus: [], createdAt: '2026-01-01T00:00:00Z', exercises: [{ exerciseId: 'lib_barbell_back_squat', sets: 3 }, { exerciseId: 'lib_romanian_deadlift', sets: 3 }, { exerciseId: 'lib_standing_calf_raise', sets: 3 }] },
];

const BASE: Record<string, number> = { lib_barbell_bench_press: 60, lib_dumbbell_shoulder_press: 16, lib_triceps_pushdown: 25, lib_lat_pulldown: 50, lib_seated_cable_row: 50, lib_dumbbell_biceps_curl: 10, lib_barbell_back_squat: 80, lib_romanian_deadlift: 70, lib_standing_calf_raise: 40 };

function sessionOn(offset: number, split: Split, week: number, n: number): Session {
  const d = day(offset);
  const start = `${d}T17:00:00.000Z`, end = `${d}T18:05:00.000Z`;
  return {
    id: `s_${d}_${split.id}`, splitId: split.id, splitName: split.name, day: d, startedAt: start, endedAt: end, durationSec: 3900,
    gymId: 'gym_default',
    exercises: split.exercises.map(e => {
      const kg = Math.round((BASE[e.exerciseId]! + week * 1.25) * 2) / 2;
      const sets: LoggedSet[] = Array.from({ length: e.sets }, (_, k) => ({ kg, reps: 8 + ((n + k) % 3), effort: k === e.sets - 1 ? 'max' : 'ideal', at: start, fidelity: 'live' }));
      return { exerciseId: e.exerciseId, name: e.exerciseId.replace('lib_', '').replace(/_/g, ' '), sets };
    }),
    logging: liveLogging(start, end),
  };
}

function history(days: number): Session[] {
  const out: Session[] = [];
  let n = 0;
  for (let off = days; off >= 1; off--) {
    const wd = new Date(NOW - off * 86_400_000).getDay();
    const split = wd === 1 || wd === 4 ? SPLITS[0]! : wd === 2 || wd === 5 ? SPLITS[1]! : wd === 3 || wd === 6 ? SPLITS[2]! : null;
    if (!split) continue;
    out.push(sessionOn(off, split, Math.floor((days - off) / 7), n++));
  }
  return out;
}

const schedule = { sun: null, mon: 'sp_push', tue: 'sp_pull', wed: 'sp_legs', thu: 'sp_push', fri: 'sp_pull', sat: 'sp_legs' } as AppState['schedule'];

export function emptyState(): AppState {
  return freshState(new Date(NOW));
}

export function twoWeeksState(): AppState {
  const s = freshState(new Date(NOW));
  return { ...s, splits: SPLITS, schedule, sessions: history(14), profile: { name: 'Test', birthYear: 1990, heightCm: 180, sex: 'male', bodyWeightKg: 80, trainingSince: '2024-01' }, goal: 'lean' };
}

export function sixMonthsState(): AppState {
  const s = freshState(new Date(NOW));
  const healthDays = Array.from({ length: 60 }, (_, i) => ({ day: day(i), restingHr: 56 + (i < 3 ? 6 : i % 3), sleepMinutes: 420 - (i < 2 ? 90 : 0) + (i % 5) * 5, steps: 8000 + i * 10, activeCalories: 500, source: 'health_connect' as const, syncedAt: new Date(NOW).toISOString() }));
  const checkIns = Array.from({ length: 20 }, (_, i) => ({ day: day(i), sleepQuality: (3 + (i % 3)) as 3 | 4 | 5, mood: 4 as const, soreness: { chest: (i % 4 + 1) as 1 | 2 | 3 | 4 } }));
  const weightLog = Array.from({ length: 30 }, (_, i) => ({ day: day(180 - i * 6), kg: 84 - i * 0.12 }));
  return {
    ...s, splits: SPLITS, schedule, sessions: history(182), healthDays, checkIns, weightLog,
    body: [{ day: day(90), neckCm: 38, waistCm: 86, bodyFatPct: 17.2 }, { day: day(10), neckCm: 38, waistCm: 84, bodyFatPct: 16.1 }],
    profile: { name: 'Test', birthYear: 1988, heightCm: 180, sex: 'male', bodyWeightKg: 80.5, trainingSince: '2021-03', plannedDays: 6 },
    goal: 'lean',
    escobar: { ...s.escobar, enabled: true, sharing: { health: true, body: true }, memory: [
      { id: 'm1', kind: 'injury', text: 'Left shoulder twinges on overhead pressing', source: 'user_said', createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z', expiresOn: '2026-10-13' },
      { id: 'm2', kind: 'equipment', text: 'Home gym has dumbbells up to 30 kg', source: 'user_said', createdAt: '2026-08-01T10:00:00.000Z', updatedAt: '2026-08-01T10:00:00.000Z' },
      { id: 'm3', kind: 'preference', text: 'Prefers morning sessions', source: 'user_said', createdAt: '2026-09-10T10:00:00.000Z', updatedAt: '2026-09-10T10:00:00.000Z' },
    ] },
  };
}

export const FIXTURES: Array<[string, () => AppState]> = [['empty', emptyState], ['two weeks', twoWeeksState], ['six months', sixMonthsState]];

export const ctxOf = (s: AppState, extra: Partial<ToolCtx> = {}): ToolCtx => makeCtx(s, NOW, extra);

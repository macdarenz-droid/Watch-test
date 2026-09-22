import { describe, it, expect } from 'vitest';
import { asLegacyRoot, convertLegacy } from '@/core/migrate';
import { loadState, STATE_KEY } from '@/core/store';

const legacy = {
  workouts: {
    completedExercises: [
      { id: 'a', day: 'push', dayKey: '2026-09-10', name: 'Chest Press', type: 'Machine', muscle: 'Chest', sets: [{ kg: '47', reps: '8', effort: 'ideal' }, { kg: 54, reps: 6, effort: 'max' }], finalizedAt: '2026-09-10T08:10:00.000Z' },
      { id: 'b', day: 'push', dayKey: '2026-09-10', name: 'Weird Custom Move', type: 'Cable', muscle: 'Rear delts', sets: [{ kg: 10, reps: 12 }], finalizedAt: '2026-09-10T08:20:00.000Z' },
      { id: 'demo|x', day: 'push', dayKey: '2026-09-11', name: 'Chest Press', sets: [{ kg: 1, reps: 1 }] },
    ],
    sessions: [
      { day: 'pull', date: '2026-09-08T09:00:00.000Z', snapshot: [{ name: 'Lat Pulldown', type: 'Cable', muscle: 'Lats', sets: [{ kg: 50, reps: 10, effort: 'easy' }] }] },
    ],
    timedSessions: [{ id: 't1', day: 'push', dayKey: '2026-09-10', startedAt: '2026-09-10T07:30:00.000Z', endedAt: '2026-09-10T08:25:00.000Z', durationMs: 3300000 }],
    customSplits: [{ key: 'split_abc', name: 'Arms', color: '#a061ff', createdAt: '2026-08-01T00:00:00.000Z', focusMuscles: ['biceps', 'triceps', 'chest'] }],
    custom: { split_abc: [{ id: 'ex_1', name: 'Hammer Curl', type: 'Dumbbells', muscle: 'Biceps', sets: 4 }] },
    dayNames: { push: 'Push A' },
    hiddenBaseSplits: ['legs'],
    trainingProgram: 'growth',
  },
  trainingSchedule: { days: { mon: 'push', wed: 'pull', fri: 'split_abc', sat: 'legs' } },
  notifications: { trainingEnabled: true, trainingTime: '06:30', trainingStyle: 'vibrate' },
  preferences: { units: { weight: 'lb' } },
  user: { profile: { displayName: 'Marc', bodyWeightKg: 80 } },
};

describe('legacy migration', () => {
  const state = convertLegacy(legacy as never, new Date('2026-09-18T00:00:00.000Z'));
  it('imports sessions, skips demo rows and maps the library', () => {
    expect(state.sessions).toHaveLength(2);
    const push = state.sessions.find(s => s.day === '2026-09-10')!;
    expect(push.splitName).toBe('Push A');
    expect(push.durationSec).toBe(3300);
    expect(push.exercises[0]!.exerciseId).toBe('lib_machine_chest_press');
    expect(push.exercises[0]!.sets[0]).toEqual({ kg: 47, reps: 8, effort: 'ideal' });
    expect(push.exercises[1]!.exerciseId.startsWith('custom_')).toBe(true);
    expect(state.customExercises[0]!.primary).toEqual(['rear_delts']);
  });
  it('rebuilds splits, focus, schedule and preferences', () => {
    expect(state.splits.map(s => s.name)).toEqual(['Push A', 'Pull', 'Arms']);
    const arms = state.splits.find(s => s.name === 'Arms')!;
    expect(arms.focus).toEqual(['biceps', 'triceps']);
    expect(arms.exercises[0]!.exerciseId).toBe('lib_hammer_curl');
    expect(state.schedule.mon).toBe('split_push');
    expect(state.schedule.sat).toBeNull();
    expect(state.goal).toBe('growth');
    expect(state.preferences.weightUnit).toBe('lb');
    expect(state.preferences.reminders).toEqual({ enabled: true, time: '06:30', style: 'vibrate' });
    expect(state.profile.name).toBe('Marc');
    expect(state.profile.bodyWeightKg).toBe(80);
    expect(state.legacyImportedAt).toBeTruthy();
  });
  it('loadState prefers saved state, then legacy, without touching the old key', () => {
    const store = new Map<string, string>();
    const storage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    store.set('dailyTrackerPremium', JSON.stringify(legacy));
    expect(loadState(storage).source).toBe('legacy');
    store.set(STATE_KEY, JSON.stringify(state));
    expect(loadState(storage).source).toBe('saved');
    expect(store.get('dailyTrackerPremium')).toBe(JSON.stringify(legacy));
  });
});

describe('legacy full backup file', () => {
  const backup = {
    type: 'marc-full-backup', version: 1, app: 'M/ARC',
    state: {
      workouts: {
        completedExercises: [
          { id: 'a', day: 'pull', dayKey: '2026-08-23', exerciseKey: 'custom:ex_1', name: 'Lat Pulldown', type: 'Cable / Machine', muscle: 'Lats', sets: [{ kg: 47, reps: '10', effort: 'easy' }], finalizedAt: '2026-08-22T15:02:32.441Z' },
          { id: 'backfill-1', day: 'pull', dayKey: '2026-08-22', exerciseKey: 'custom:ex_1', name: 'Lat Pulldown', type: 'Cable / Machine', muscle: 'Lats', sets: [{ kg: 47, reps: '10', effort: 'easy' }], finalizedAt: '2026-08-22T15:02:32.441Z', source: 'session-snapshot-backfill' },
          { id: 'b', day: 'pull', dayKey: '2026-08-23', exerciseKey: 'lib_assisted_pull_up', name: 'Assisted Pull-Up', type: 'Machine', muscle: 'Lats', sets: [{ kg: 26, reps: '10', effort: 'ideal' }], finalizedAt: '2026-08-22T15:10:00.000Z' },
          { id: 'c', day: 'pull', dayKey: '2026-08-23', name: 'DB Shrugs', type: 'Dumbbells', muscle: 'Upper Traps', sets: [{ kg: 20, reps: 12 }], finalizedAt: '2026-08-22T15:20:00.000Z' },
        ],
        sessions: [{ summaryId: '2026-08-23|pull', day: 'pull', date: '2026-08-22T16:31:35.804Z', snapshot: [{ name: 'Lat Pulldown', sets: [{ kg: 47, reps: '10' }] }] }],
        timedSessions: [{ id: 't', day: 'pull', dayKey: '2026-08-23', startedAt: '2026-08-22T14:42:27.849Z', endedAt: '2026-08-22T16:31:35.804Z', durationMs: 6539334 }],
        custom: { pull: [{ id: 'ex_1', name: 'Lat Pulldown', type: 'Cable / Machine', muscle: 'Lats', sets: 3, libraryId: 'lib_lat_pulldown' }, { id: 'ex_2', name: 'Hammer Curl', type: 'Dumbbells', muscle: 'Biceps', sets: 3, libraryId: 'lib_hammer_curl' }] },
        removed: { pull: ['Lat Pulldown|Wide Grip'] },
        hidden: { pull: ['Hammer Curl|Dumbbells'] },
        activityOrder: { pull: ['lib_assisted_pull_up', 'lib_lat_pulldown'] },
        sessionSettings: { restDefaultSec: 120, autoRest: true },
        customSplits: [], dayNames: {},
      },
      trainingSchedule: { days: { sun: 'pull' } },
    },
  };
  const root = asLegacyRoot(backup)!;
  it('is recognised through the backup wrapper', () => {
    expect(root).toBeTruthy();
    expect(asLegacyRoot({ foo: 1 })).toBeNull();
  });
  const state = convertLegacy(root, new Date('2026-09-18T00:00:00.000Z'));
  it('drops backfilled duplicates and keeps one session on the local day', () => {
    expect(state.sessions).toHaveLength(1);
    const s = state.sessions[0]!;
    expect(s.day).toBe('2026-08-23');
    expect(s.durationSec).toBe(6539);
    expect(s.exercises.map(e => e.exerciseId)).toEqual(['lib_lat_pulldown', 'lib_assisted_pull_up', 'lib_dumbbell_shrug']);
    expect(s.exercises[0]!.sets[0]).toEqual({ kg: 47, reps: 10, effort: 'easy' });
  });
  it('builds the split from the old lists, minus hidden ones, in the saved order', () => {
    const pull = state.splits.find(x => x.name === 'Pull')!;
    expect(pull.exercises.map(e => e.exerciseId)).toEqual(['lib_assisted_pull_up', 'lib_lat_pulldown', 'lib_dumbbell_shrug']);
    expect(state.preferences.restDefaultSec).toBe(120);
    expect(state.customExercises).toHaveLength(0);
  });
});

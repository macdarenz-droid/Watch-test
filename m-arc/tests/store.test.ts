import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { freshState, type AppState } from '@/core/models';
import { formatSetLoad } from '@/core/units';

type Mem = Storage & { map: Map<string, string>; writes: string[] };
function memoryStorage(hooks: { onSet?: (k: string, v: string, map: Map<string, string>) => void } = {}): Mem {
  const map = new Map<string, string>();
  const writes: string[] = [];
  return {
    map, writes,
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { hooks.onSet?.(k, v, map); writes.push(k); map.set(k, v); },
    removeItem: (k: string) => { map.delete(k); },
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() { return map.size; },
  } as Mem;
}

const quota = () => Object.assign(new Error('full'), { name: 'QuotaExceededError', code: 22 });
async function fresh() {
  vi.resetModules();
  return import('@/core/store');
}
const withSession = (s: AppState, id: string, startedAt: string, kg = 100): AppState => ({
  ...s,
  sessions: [...s.sessions, { id, splitId: 'x', splitName: 'Push', day: startedAt.slice(0, 10), startedAt, endedAt: startedAt, durationSec: 60, exercises: [{ exerciseId: 'lib_barbell_bench_press', name: 'Bench', sets: [{ kg, reps: 5 }] }], logging: { mode: 'live' } as never }],
});

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-09-22T10:00:00')); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe('quarantine (ST-01)', () => {
  it('keeps unreadable main data aside, flags the boot, and the copy survives later edits', async () => {
    const st = memoryStorage();
    const good = withSession(freshState(), 's1', '2026-09-20T10:00:00.000Z');
    st.map.set('marc.state.v1', '{not json');
    st.map.set('marc.state.v1.backup', JSON.stringify(good));
    const S = await fresh();
    S.initStore(st);
    expect(S.bootSource.value).toBe('backup');
    expect(S.bootRecovered.value).toBe(true);
    expect(st.map.get('marc.state.v1.corrupt')).toBe('{not json');
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'A' } })); S.flushSave();
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'B' } })); S.flushSave();
    expect(st.map.get('marc.state.v1.corrupt')).toBe('{not json');
    expect(S.rescueRaw(st)).toBe('{not json');
    S.deleteRescueCopy(st);
    expect(st.map.has('marc.state.v1.corrupt')).toBe(false);
  });
  it('keeps an unreadable backup aside when boot starts fresh', async () => {
    const st = memoryStorage();
    st.map.set('marc.state.v1.backup', '[1,2');
    const S = await fresh();
    S.initStore(st);
    expect(S.bootSource.value).toBe('fresh');
    expect(st.map.get('marc.state.v1.backup.corrupt')).toBe('[1,2');
  });
  it('a clean boot keeps nothing aside', async () => {
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify(freshState()));
    const S = await fresh();
    S.initStore(st);
    expect(S.bootRecovered.value).toBe(false);
    expect([...st.map.keys()].some(k => k.endsWith('.corrupt'))).toBe(false);
  });
});

describe('saving (ST-10)', () => {
  it('a backup write that throws leaves saveError null', async () => {
    const st = memoryStorage({ onSet: k => { if (k === 'marc.state.v1.backup') throw quota(); } });
    st.map.set('marc.state.v1', JSON.stringify(freshState()));
    const S = await fresh();
    S.initStore(st);
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'X' } }));
    expect(S.persistNow()).toBe(true);
    expect(S.saveError.value).toBeNull();
    expect(JSON.parse(st.map.get('marc.state.v1')!).profile.name).toBe('X');
  });
  it('a quota error on the main write drops the backup copy and retries once', async () => {
    const st = memoryStorage({ onSet: (k, _v, map) => { if (k === 'marc.state.v1' && map.has('marc.state.v1.backup')) throw quota(); } });
    st.map.set('marc.state.v1', JSON.stringify(freshState()));
    st.map.set('marc.state.v1.backup', JSON.stringify(freshState()));
    st.map.set('marc.state.v1.backupDay', '2026-09-22');
    const S = await fresh();
    S.initStore(st);
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'Y' } }));
    expect(S.persistNow()).toBe(true);
    expect(S.saveError.value).toBeNull();
    expect(st.map.has('marc.state.v1.backup')).toBe(false);
    expect(JSON.parse(st.map.get('marc.state.v1')!).profile.name).toBe('Y');
  });
  it('a second quota error is reported', async () => {
    const st = memoryStorage({ onSet: k => { if (k === 'marc.state.v1') throw quota(); } });
    const S = await fresh();
    S.initStore(st);
    expect(S.persistNow()).toBe(false);
    expect(S.saveError.value).toMatch(/Could not save/);
  });
  it('the backup is the state from before the first save of each day', async () => {
    const st = memoryStorage();
    const day0 = JSON.stringify({ ...freshState(), profile: { name: 'day0' } });
    st.map.set('marc.state.v1', day0);
    const S = await fresh();
    S.initStore(st);
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'a' } })); S.flushSave();
    expect(st.map.get('marc.state.v1.backup')).toBe(day0);
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'b' } })); S.flushSave();
    expect(st.map.get('marc.state.v1.backup')).toBe(day0);
    vi.setSystemTime(new Date('2026-09-23T09:00:00'));
    const lastOfYesterday = st.map.get('marc.state.v1');
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'c' } })); S.flushSave();
    expect(st.map.get('marc.state.v1.backup')).toBe(lastOfYesterday);
    expect(st.map.get('marc.state.v1.backupDay')).toBe('2026-09-23');
  });
});

describe('deep repair (ST-11)', () => {
  const load = async (raw: unknown) => {
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify(raw));
    const S = await fresh();
    return { S, loaded: S.loadState(st) };
  };
  it('repairs sessions, splits, lists and schedule instead of dropping the state', async () => {
    const raw = {
      ...freshState(),
      goal: 'bulk',
      preferences: { ...freshState().preferences, weightUnit: 'stone' },
      splits: [{ id: 'sp1', color: '#fff', exercises: [null, { exerciseId: 'x', sets: 3 }], createdAt: '' }, { name: 'no id' }, 7],
      schedule: { mon: 'sp1', tue: 'ghost', wed: null },
      sessions: [
        { splitId: 'sp1', splitName: 'P', day: '2026-09-21', startedAt: '2026-09-21T10:00:00.000Z', endedAt: '2026-09-21T11:00:00.000Z', durationSec: 1 },
        'junk',
        { id: 'early', splitId: 'sp1', splitName: 'P', day: '2026-09-01', startedAt: '2026-09-01T10:00:00.000Z', endedAt: '2026-09-01T11:00:00.000Z', durationSec: 1, exercises: [{ exerciseId: 'a', name: 'A', sets: [null, { kg: 10, reps: 5 }] }, 3] },
      ],
      body: [null], healthDays: [1], weightLog: ['x'], checkIns: [null], freshMarks: [false], customExercises: [0],
    };
    const { S, loaded } = await load(raw);
    const s = loaded.state;
    expect(loaded.source).toBe('saved');
    expect(s.goal).toBe('lean');
    expect(s.preferences.weightUnit).toBe('kg');
    expect(s.splits.map(x => x.id)).toEqual(['sp1']);
    expect(s.splits[0]!.name).toBe('Workout');
    expect(s.splits[0]!.exercises).toHaveLength(1);
    expect(s.schedule.mon).toBe('sp1');
    expect(s.schedule.tue).toBeNull();
    expect(s.sessions.map(x => x.id)[0]).toBe('early');
    expect(typeof s.sessions[1]!.id).toBe('string');
    expect(s.sessions[1]!.exercises).toEqual([]);
    expect(s.sessions[0]!.exercises).toHaveLength(1);
    expect(s.sessions[0]!.exercises[0]!.sets).toEqual([{ kg: 10, reps: 5 }]);
    for (const k of ['body', 'healthDays', 'weightLog', 'checkIns', 'freshMarks', 'customExercises'] as const) expect(s[k]).toEqual([]);
    // splits: 7, the split without an id, a null split exercise; sessions: 'junk', a non-object exercise, a null set; six lists.
    expect(S.repairState(raw as never).dropped).toBe(3 + 3 + 6);
  });
});

describe('other tabs (ST-19)', () => {
  it('a storage event takes the other tab\'s state without writing', async () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify(freshState()));
    const S = await fresh();
    S.initStore(st);
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'stale' } }));
    const incoming = withSession(freshState(), 'other', '2026-09-22T09:00:00.000Z');
    const writesBefore = st.writes.length;
    target.dispatchEvent(Object.assign(new Event('storage'), { key: 'marc.state.v1', newValue: JSON.stringify(incoming) }));
    vi.advanceTimersByTime(1000);
    expect(S.state.value.sessions.map(x => x.id)).toEqual(['other']);
    expect(S.state.value.profile.name).toBe('');
    expect(st.writes.length).toBe(writesBefore);
  });
  it('a live session here that differs from the incoming one shows a toast', async () => {
    const target = new EventTarget();
    vi.stubGlobal('window', target);
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify({ ...freshState(), active: { splitId: 'x', startedAt: '2026-09-22T09:30:00.000Z', pausedMs: 0, entries: [] } }));
    const S = await fresh();
    const T = await import('@/app/toast');
    S.initStore(st);
    target.dispatchEvent(Object.assign(new Event('storage'), { key: 'marc.state.v1', newValue: JSON.stringify(freshState()) }));
    expect(S.state.value.active).toBeNull();
    expect(T.toast.value?.message).toBe('Updated from another tab');
  });
});

describe('lb history backfill (RG-02)', () => {
  const lbState = (extra: Record<string, unknown> = {}) => {
    const s = withSession(freshState(), 's1', '2026-09-20T10:00:00.000Z', 102.0) as unknown as Record<string, unknown>;
    delete s.units;
    return { ...s, preferences: { ...freshState().preferences, weightUnit: 'lb' }, ...extra };
  };
  it('225 lb stored as 102.0 kg shows 225 lb again', async () => {
    const S = await fresh();
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify(lbState()));
    const set = S.loadState(st).state.sessions[0]!.exercises[0]!.sets[0]!;
    expect(set.kg).toBe(102.0);
    expect(set.entered).toEqual({ value: 225, unit: 'lb' });
    expect(formatSetLoad(set, 'lb')).toBe('225 lb');
  });
  it('kg users and states that already have units are unchanged', async () => {
    const S = await fresh();
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify(lbState({ preferences: { ...freshState().preferences, weightUnit: 'kg' } })));
    expect(S.loadState(st).state.sessions[0]!.exercises[0]!.sets[0]!.entered).toBeUndefined();
    st.map.set('marc.state.v1', JSON.stringify({ ...lbState(), units: freshState().units }));
    expect(S.loadState(st).state.sessions[0]!.exercises[0]!.sets[0]!.entered).toBeUndefined();
  });
  it('a kg value that was never a half-pound entry is left alone', async () => {
    const S = await fresh();
    const st = memoryStorage();
    const s = lbState() as unknown as AppState;
    s.sessions[0]!.exercises[0]!.sets[0]!.kg = 101.3;
    st.map.set('marc.state.v1', JSON.stringify(s));
    expect(S.loadState(st).state.sessions[0]!.exercises[0]!.sets[0]!.entered).toBeUndefined();
  });
});

describe('quarantine with storage nearly full (QA-R1-1)', () => {
  it('moves the unreadable data aside instead of losing it, and flags the boot', async () => {
    const bad = JSON.stringify({ version: 2, sessions: [{ id: 'old1' }] });
    // Room for the two copies already stored and nothing more.
    const cap = bad.length * 2 + 10;
    const st = memoryStorage({ onSet: (k, v, map) => {
      const used = [...map.entries()].reduce((n, [key, val]) => n + (key === k ? 0 : val.length), 0);
      if (used + v.length > cap) throw quota();
    } });
    st.map.set('marc.state.v1', bad);
    st.map.set('marc.state.v1.backup', bad);
    const S = await fresh();
    S.initStore(st);
    expect(S.bootRecovered.value).toBe(true);
    const kept = [...st.map.entries()].filter(([k]) => k.endsWith('.corrupt')).map(([, v]) => v);
    expect(kept).toContain(bad);
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'A' } })); S.flushSave();
    expect([...st.map.values()].some(v => v.includes('old1'))).toBe(true);
  });
});

describe('rescue file with both copies kept (QA-R1-5)', () => {
  it('holds the main and the backup copy', async () => {
    const st = memoryStorage();
    const keep = JSON.stringify({ version: 2, sessions: [{ id: 'keep1' }] });
    st.map.set('marc.state.v1', '{truncated');
    st.map.set('marc.state.v1.backup', keep);
    const S = await fresh();
    S.initStore(st);
    const raw = S.rescueRaw(st)!;
    expect(raw).toContain('keep1');
    expect(raw).toContain('{truncated');
  });
});

describe('reset everything (QA-R1-7)', () => {
  it('leaves no old history in the daily restore point', async () => {
    const st = memoryStorage();
    st.map.set('marc.state.v1', JSON.stringify(withSession(freshState(), 'old1', '2026-09-20T10:00:00.000Z')));
    st.map.set('marc.state.v1.backupDay', '2026-09-21');
    const S = await fresh();
    S.initStore(st);
    S.resetState(freshState());
    S.update(s => ({ ...s, profile: { ...s.profile, name: 'A' } })); S.flushSave();
    expect(st.map.get('marc.state.v1.backup') ?? '').not.toContain('old1');
    expect(st.map.get('marc.state.v1') ?? '').not.toContain('old1');
  });

  it('removes the legacy import key too (BUG-29)', async () => {
    const st = memoryStorage();
    st.map.set('dailyTrackerPremium', JSON.stringify({ workouts: {} }));
    const S = await fresh();
    S.initStore(st);
    S.resetState(freshState());
    expect(st.map.has('dailyTrackerPremium')).toBe(false);
  });
});

describe('a live set copied by the old + Set (QA-R2d-4)', () => {
  it('keeps the typed values and drops the copied commit time, rest and heart', async () => {
    const st = memoryStorage();
    const set1 = { id: 'set_a', status: 'committed', kg: 60, reps: 8, at: '2026-09-22T10:05:00.000Z', restSec: 90, heart: { peak: 150 } };
    const active = { id: 's_live', splitId: null, startedAt: '2026-09-22T09:50:00.000Z', entries: [{ id: 'e1', exerciseId: 'lib_barbell_bench_press', name: 'Bench', sets: [set1, { ...set1, effort: undefined }] }] };
    st.map.set('marc.state.v1', JSON.stringify({ ...freshState(), active }));
    const S = await fresh();
    S.initStore(st);
    const sets = S.state.value.active!.entries[0]!.sets;
    expect(sets[0]!.at).toBe(set1.at);
    expect(sets[1]!.kg).toBe(60);
    expect(sets[1]!.at).toBeUndefined();
    expect(sets[1]!.heart).toBeUndefined();
    expect(sets[1]!.id).not.toBe('set_a');
  });
});

describe('body-fat readings from before the cm formula (QA-R3a-10)', () => {
  it('are recomputed once from their tape numbers; new ones are left alone', async () => {
    const st = memoryStorage();
    const base = freshState();
    st.map.set('marc.state.v1', JSON.stringify({ ...base, profile: { ...base.profile, sex: 'male', heightCm: 180 }, body: [
      { day: '2026-01-01', neckCm: 38, waistCm: 85, bodyFatPct: 9.8 },
      { day: '2026-09-01', neckCm: 38, waistCm: 85, bodyFatPct: 16.1, formula: 'navy-cm' },
    ] }));
    const S = await fresh();
    S.initStore(st);
    const [old, cur] = S.state.value.body;
    expect(old!.bodyFatPct).toBeCloseTo(16.1, 0);
    expect(old!.formula).toBe('navy-cm');
    expect(cur!.bodyFatPct).toBe(16.1);
  });
});

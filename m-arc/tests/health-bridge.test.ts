import { describe, it, expect } from 'vitest';
import { mapHealthSummary } from '@/native/health';

describe('mapHealthSummary', () => {
  it('maps a full summary to a daily record', () => {
    const d = mapHealthSummary({ needsPermission: false, steps: 5092, sleepMinutes: 410, restingHR: 58, workoutHR: 132, activeCalories: 310, heartRateTime: '2026-09-22T06:00:00Z', sleepEndTime: '2026-09-22T06:30:00Z' }, '2026-09-22', '2026-09-22T12:00:00Z');
    expect(d).toEqual({
      day: '2026-09-22',
      restingHr: 58,
      latestHr: 132,
      latestHrAt: '2026-09-22T06:00:00Z',
      sleepMinutes: 410,
      sleepEndAt: '2026-09-22T06:30:00Z',
      steps: 5092,
      activeCalories: 310,
      source: 'health_connect',
      syncedAt: '2026-09-22T12:00:00Z',
      totalsSyncedAt: '2026-09-22T12:00:00Z', // QA2-FE-1: when the day totals were read
    });
  });

  it('returns null when permission is missing', () => {
    expect(mapHealthSummary({ needsPermission: true, steps: 0, sleepMinutes: 0, restingHR: 0, workoutHR: 0, activeCalories: 0 }, '2026-09-22', '2026-09-22T12:00:00Z')).toBeNull();
  });

  it('reads zero readings as absent, not zero', () => {
    const d = mapHealthSummary({ needsPermission: false, steps: 0, sleepMinutes: 0, restingHR: 0, workoutHR: 0, activeCalories: 0 }, '2026-09-22', '2026-09-22T12:00:00Z');
    expect(d?.steps).toBeUndefined();
    expect(d?.restingHr).toBeUndefined();
    expect(d?.latestHr).toBeUndefined();
    expect(d?.sleepMinutes).toBeUndefined();
    expect(d?.activeCalories).toBeUndefined();
    expect(d?.source).toBe('health_connect');
  });
});

import { afterEach, vi } from 'vitest';
import { kcalGuard, lastHealthError, syncHealth } from '@/native/health';
import * as health from '@/native/health';

describe('health bridge (R5.1)', () => {
  const day = '2026-09-22', at = '2026-09-22T12:00:00Z';
  afterEach(() => { delete (globalThis as { Capacitor?: unknown }).Capacitor; });
  const install = (p: Record<string, unknown>) => { (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { HealthConnectNative: p } }; };

  it('heals small calories to kcal (VX-01)', () => {
    expect(kcalGuard(312_000)).toBe(312);
    expect(kcalGuard(450)).toBe(450);
    expect(kcalGuard(undefined)).toBeUndefined();
    expect(mapHealthSummary({ needsPermission: false, activeCalories: 480_400 }, day, at)?.activeCalories).toBe(480);
  });

  it('every granted type failing is nothing read, not a day of zeros', () => {
    const failed = ['StepsRecord: X', 'SleepSessionRecord: X', 'HeartRateRecord: X'];
    expect(mapHealthSummary({ needsPermission: false, missing: ['READ_ACTIVE_CALORIES_BURNED', 'READ_RESTING_HEART_RATE'], failed }, day, at)).toBeNull();
    expect(mapHealthSummary({ needsPermission: false, missing: ['READ_ACTIVE_CALORIES_BURNED', 'READ_RESTING_HEART_RATE'], failed: failed.slice(1), steps: 10 }, day, at)?.steps).toBe(10);
  });

  it('a background sync never asks for permission; a Settings sync does', async () => {
    const requestPermissions = vi.fn(async () => ({ granted: false }));
    install({ readSummary: async () => ({ needsPermission: true }), requestPermissions });
    expect(await syncHealth()).toBeNull();
    expect(await syncHealth({ prompt: false })).toBeNull();
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(health.lastHealthError?.needsPermission).toBe(true);
    await syncHealth({ prompt: true });
    expect(requestPermissions).toHaveBeenCalledTimes(1);
  });

  it('a newly added permission is not requested in the background either', async () => {
    const requestPermissions = vi.fn(async () => ({ granted: true }));
    install({ readSummary: async () => ({ needsPermission: false, missing: ['READ_RESTING_HEART_RATE'], steps: 100 }), requestPermissions });
    expect((await syncHealth())?.steps).toBe(100);
    expect(requestPermissions).not.toHaveBeenCalled();
    expect(lastHealthError).toBeNull();
  });
});

import { repairState } from '@/core/store';
import { freshState } from '@/core/models';
it('a saved state with small-calorie days loads healed', () => {
  const s = { ...freshState(), healthDays: [{ day: '2026-09-21', activeCalories: 512_000, source: 'health_connect' as const, syncedAt: '' }, { day: '2026-09-22', activeCalories: 480, source: 'health_connect' as const, syncedAt: '' }], health: { connected: true, activeCalories: 512_000 } };
  const out = repairState(s).state;
  expect(out.healthDays.map(d => d.activeCalories)).toEqual([512, 480]);
  expect(out.health.activeCalories).toBe(512);
});

import { replaceState, state as appState } from '@/core/store';
describe('a later partial sync keeps what the morning sync had (QA-R5a-1)', () => {
  afterEach(() => { delete (globalThis as { Capacitor?: unknown }).Capacitor; });
  it('sleep and resting HR survive a sync where those reads failed, and the failure is reported', async () => {
    const { syncAndStoreHealth } = await import('@/slices/settings/health');
    replaceState({ ...freshState(), health: { connected: true } });
    let r: HealthSummaryRawLike = { needsPermission: false, sleepMinutes: 420, restingHR: 55, steps: 1200, activeCalories: 40 };
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { HealthConnectNative: { readSummary: async () => r } } };
    expect(await syncAndStoreHealth()).toBe(true);
    r = { needsPermission: false, workoutHR: 72, steps: 3500, activeCalories: 130, failed: ['SleepSessionRecord: Timeout', 'RestingHeartRateRecord: Timeout'] };
    expect(await syncAndStoreHealth()).toBe(false);
    const d = appState.value.healthDays.at(-1)!;
    expect(d).toMatchObject({ sleepMinutes: 420, restingHr: 55, steps: 3500, latestHr: 72, activeCalories: 130 });
    expect(health.lastHealthError?.failed).toHaveLength(2);
  });
});
type HealthSummaryRawLike = import('@/native/health').HealthSummaryRaw;

describe('a sync across midnight (QA-R5a-3)', () => {
  afterEach(() => { delete (globalThis as { Capacitor?: unknown }).Capacitor; vi.useRealTimers(); });
  it("does not store the ended day's totals under the new day", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 23, 23, 59, 59, 500));
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { HealthConnectNative: { readSummary: async () => { vi.setSystemTime(new Date(2026, 8, 24, 0, 0, 0, 400)); return { needsPermission: false, steps: 12000, activeCalories: 600, sleepMinutes: 420 }; } } } };
    const d = await syncHealth();
    expect(d?.day).toBe('2026-09-24');
    expect(d?.steps).toBeUndefined();
    expect(d?.activeCalories).toBeUndefined();
    expect(d?.sleepMinutes).toBe(420);
  });
});

describe('partial syncs (QA2-FE-1, QA2-FE-6)', () => {
  afterEach(() => { delete (globalThis as { Capacitor?: unknown }).Capacitor; });
  it('a sync that read only some data is titled partial, not failed', async () => {
    (globalThis as { Capacitor?: unknown }).Capacitor = { isNativePlatform: () => true, Plugins: { HealthConnectNative: { readSummary: async () => ({ needsPermission: false, steps: 5000, failed: ['SleepSessionRecord: X'] }) } } };
    const H = await import('@/native/health');
    expect(await H.syncHealth()).toBeTruthy();
    expect(H.healthSyncTitle(H.lastHealthError)).toBe('Last Health Connect sync was partial');
    expect(H.healthSyncTitle({ needsPermission: false, missing: [], failed: [], message: 'x' })).toBe('Last Health Connect sync failed');
  });
  it('a later sync that failed the steps keeps the time the steps were read', () => {
    const later = mapHealthSummary({ needsPermission: false, sleepMinutes: 400, failed: ['StepsRecord: X'] }, '2026-09-22', '2026-09-22T20:00:00Z');
    expect(later?.totalsSyncedAt).toBeUndefined();
    const merged = { ...{ day: '2026-09-22', steps: 6000, syncedAt: '2026-09-22T12:00:00Z', totalsSyncedAt: '2026-09-22T12:00:00Z', source: 'health_connect' as const }, ...Object.fromEntries(Object.entries(later!).filter(([, v]) => v !== undefined)) };
    expect(merged.totalsSyncedAt).toBe('2026-09-22T12:00:00Z');
  });
});

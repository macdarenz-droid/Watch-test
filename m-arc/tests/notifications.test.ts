import { describe, it, expect, vi, beforeEach } from 'vitest';

const plugin = {
  schedule: vi.fn(async () => ({ notifications: [] })),
  cancel: vi.fn(async () => undefined),
  getPending: vi.fn(async () => ({ notifications: [] as Array<{ id: number }> })),
  createChannel: vi.fn(async () => undefined),
  checkPermissions: vi.fn(async () => ({ display: 'granted' })),
  requestPermissions: vi.fn(async () => ({ display: 'granted' })),
  checkExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'denied' })),
  changeExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'granted' })),
  addListener: vi.fn(),
};
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));
vi.mock('@/native/capacitor', () => ({ isNative: () => true }));

beforeEach(() => { vi.clearAllMocks(); });

type Scheduled = { notifications: Array<{ isExactNotification?: boolean; extra?: { type: string } }> };
const lastSchedule = () => (plugin.schedule.mock.calls.at(-1) as unknown as [Scheduled])[0];

describe('notifications (UI-02, PL-09)', () => {
  it('training reminders are never exact', async () => {
    const N = await import('@/native/notifications');
    await N.syncTrainingReminders({ enabled: true, time: '23:59', style: 'silent' }, { sun: 'a', mon: 'a', tue: 'a', wed: 'a', thu: 'a', fri: 'a', sat: 'a' }, () => 'Push', new Set());
    const list = lastSchedule().notifications;
    expect(list.length).toBeGreaterThan(0);
    expect(list.every(n => n.isExactNotification === false)).toBe(true);
    expect(plugin.changeExactNotificationSetting).not.toHaveBeenCalled();
  });
  it('the rest alert uses the cached exact-alarm permission', async () => {
    const N = await import('@/native/notifications');
    await N.refreshExactAlarm();
    await N.scheduleRestDone(Date.now() + 60_000);
    expect(lastSchedule().notifications[0]!.isExactNotification).toBe(false);
    plugin.checkExactNotificationSetting.mockResolvedValueOnce({ exact_alarm: 'granted' });
    await N.refreshExactAlarm();
    await N.scheduleRestDone(Date.now() + 60_000);
    expect(lastSchedule().notifications[0]!.isExactNotification).toBe(true);
    expect(plugin.changeExactNotificationSetting).not.toHaveBeenCalled();
  });
  it('only an explicit request opens the system setting', async () => {
    const N = await import('@/native/notifications');
    plugin.checkExactNotificationSetting.mockResolvedValueOnce({ exact_alarm: 'granted' });
    expect(await N.requestExactAlarm()).toBe(true);
    expect(plugin.changeExactNotificationSetting).toHaveBeenCalledTimes(1);
  });
});

describe('permission is only asked from a tap (QA-R2a-2, QA-R6-13)', () => {
  const week = { sun: 'a', mon: 'a', tue: 'a', wed: 'a', thu: 'a', fri: 'a', sat: 'a' } as const;
  it('launch and resume only check; a Settings tap may ask', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    plugin.requestPermissions.mockResolvedValue({ display: 'denied' });
    const N = await import('@/native/notifications');
    for (let i = 0; i < 3; i++) await N.syncTrainingReminders({ enabled: true, time: '23:59', style: 'silent' }, week, () => 'Push', new Set());
    await N.syncBackupReminder(true);
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    await N.syncTrainingReminders({ enabled: true, time: '23:59', style: 'silent' }, week, () => 'Push', new Set(), null, { prompt: true });
    await N.syncBackupReminder(true, { prompt: true });
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(2);
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    plugin.requestPermissions.mockResolvedValue({ display: 'granted' });
  });
});

describe('weekly backup reminder (QA-R6-1)', () => {
  it('is one inexact Sunday 19:00 note outside the training-reminder ids, and taps report its type', async () => {
    const N = await import('@/native/notifications');
    await N.syncBackupReminder(true);
    const n = lastSchedule().notifications[0] as unknown as { id: number; schedule: { on: { weekday: number; hour: number; minute: number } }; isExactNotification: boolean; extra: { type: string } };
    expect(n.id).toBe(N.BACKUP_REMINDER_ID);
    expect(n.id < 730000 || n.id >= 820000).toBe(true);
    expect(n.schedule.on).toEqual({ weekday: 1, hour: 19, minute: 0 });
    expect(n.isExactNotification).toBe(false);
    expect(n.extra.type).toBe('backup');
    plugin.schedule.mockClear();
    await N.syncBackupReminder(false);
    expect(plugin.cancel).toHaveBeenCalledWith({ notifications: [{ id: N.BACKUP_REMINDER_ID }] });
    expect(plugin.schedule).not.toHaveBeenCalled();
    const seen: Array<string | undefined> = [];
    N.onNotificationTap(t => seen.push(t));
    const cb = (plugin.addListener.mock.calls.at(-1) as unknown as [string, (a: unknown) => void])[1];
    cb({ notification: { extra: { type: 'backup' } } });
    cb({ notification: { extra: { type: 'training' } } });
    expect(seen).toEqual(['backup', 'training']);
  });
});

describe('Test rest alert (QA-R2c-1, QA-R2c-4)', () => {
  it('uses its own id, so the live rest alert stays scheduled', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    const N = await import('@/native/notifications');
    await N.scheduleRestDone(Date.now() + 120_000);
    const live = (plugin.schedule.mock.calls.at(-1) as unknown as [{ notifications: Array<{ id: number }> }])[0].notifications[0]!.id;
    plugin.cancel.mockClear();
    expect(await N.testRestAlert()).toBe(true);
    const test = (plugin.schedule.mock.calls.at(-1) as unknown as [{ notifications: Array<{ id: number }> }])[0].notifications[0]!.id;
    expect(test).not.toBe(live);
    expect(plugin.cancel).not.toHaveBeenCalled();
  });
  it('reports a refusal instead of promising an alert', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    plugin.requestPermissions.mockResolvedValue({ display: 'denied' });
    const N = await import('@/native/notifications');
    expect(await N.testRestAlert()).toBe(false);
    expect(plugin.schedule).not.toHaveBeenCalled();
  });
});

describe('backup reminder and rest alert permission (QA2-FB-3, QA2-FB-4, QA2-FB-6)', () => {
  it('the backup reminder reports when it could not be set, so Settings can say so', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    plugin.requestPermissions.mockResolvedValue({ display: 'granted' });
    const N = await import('@/native/notifications');
    expect(await N.syncBackupReminder(true)).toBe(false);
    expect(N.backupReminderScheduled.value).toBe(false);
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(await N.syncBackupReminder(true, { prompt: true })).toBe(true);
    expect(N.backupReminderScheduled.value).toBe(true);
  });
  it('starting a rest never makes the plugin ask for permission', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    const N = await import('@/native/notifications');
    await N.scheduleRestDone(Date.now() + 90_000);
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
  });
});

describe('QA3-1: a never-asked user still gets rest alerts', () => {
  it('a "prompt" state still schedules, letting the plugin ask on its own', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'prompt' });
    const N = await import('@/native/notifications');
    await N.scheduleRestDone(Date.now() + 90_000);
    expect(plugin.schedule).toHaveBeenCalled();
    expect(plugin.requestPermissions).not.toHaveBeenCalled();
    expect(N.restAlertsDenied.value).toBe(false);
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
  });
  it('only a firm "denied" skips scheduling and flags the hint', async () => {
    plugin.checkPermissions.mockResolvedValue({ display: 'denied' });
    const N = await import('@/native/notifications');
    await N.scheduleRestDone(Date.now() + 90_000);
    expect(plugin.schedule).not.toHaveBeenCalled();
    expect(N.restAlertsDenied.value).toBe(true);
    plugin.checkPermissions.mockResolvedValue({ display: 'granted' });
    await N.refreshRestPermission();
    expect(N.restAlertsDenied.value).toBe(false);
  });
});

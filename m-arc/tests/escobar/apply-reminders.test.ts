import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const plugin = vi.hoisted(() => {
  let pending: Array<{ id: number }> = [];
  return {
    schedule: vi.fn(async ({ notifications }: { notifications: Array<{ id: number }> }) => { pending = notifications.map(n => ({ id: n.id })); return { notifications: [] }; }),
    cancel: vi.fn(async () => { pending = []; }),
    getPending: vi.fn(async () => ({ notifications: pending })),
    createChannel: vi.fn(async () => undefined),
    checkPermissions: vi.fn(async () => ({ display: 'prompt' })),
    requestPermissions: vi.fn(async () => ({ display: 'granted' })),
    checkExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'denied' })),
    changeExactNotificationSetting: vi.fn(async () => ({ exact_alarm: 'granted' })),
    addListener: vi.fn(),
  };
});
vi.mock('@capacitor/local-notifications', () => ({ LocalNotifications: plugin }));
vi.mock('@/native/capacitor', () => ({ isNative: () => true }));

import { replaceState, state } from '@/core/store';
import { decide } from '@/escobar/apply';
import { buildProposal } from '@/escobar/tools/actions';
import { memoryStorage, newConversation, setEscobarStorage } from '@/escobar/store';
import { reminderHealth } from '@/slices/settings/reminders';
import type { Conversation } from '@/escobar/types';
import { NOW, ctxOf, twoWeeksState } from './fixtures';

const proposal = (name: string, input: Record<string, unknown>, id = 'p1'): Conversation => {
  const p = buildProposal(name, input, ctxOf(state.value), id);
  return { ...newConversation('test', 'chat'), proposals: [{ ...p, status: 'awaiting', messageIndex: 1 }] };
};

beforeEach(() => { vi.clearAllMocks(); vi.useFakeTimers({ now: NOW, toFake: ['Date'] }); replaceState(twoWeeksState()); setEscobarStorage(memoryStorage()); });
afterEach(() => { vi.useRealTimers(); });

describe('reminders turned on through Escobar (QA2-FB-2)', () => {
  it('Apply is the person\'s tap: it asks for notification permission and schedules the reminders', async () => {
    expect(state.value.preferences.reminders.enabled).toBe(false);
    const a = decide(proposal('propose_reminder', { enabled: true, time: '23:59' }), 'p1', 'apply');
    expect(a.result).toMatchObject({ ok: true, status: 'applied', message: 'Reminders updated' });
    expect(state.value.preferences.reminders.enabled).toBe(true);
    await vi.waitFor(() => expect(reminderHealth.value.queued).toBeGreaterThan(0));
    expect(plugin.requestPermissions).toHaveBeenCalledTimes(1);
    expect(plugin.schedule).toHaveBeenCalledTimes(1);
    expect(reminderHealth.value.ok).toBe(true);
  });
});

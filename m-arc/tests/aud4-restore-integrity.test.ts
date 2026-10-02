/**
 * AUD-4: restore, reset and coach-storage integrity (DATA-01, DATA-02, OBS-PHOTOS, OBS-LB, OBS-ENDPOINT).
 */
import { describe, it, expect, vi, afterEach } from 'vitest';
import { freshEscobar, freshState, type AppState } from '@/core/models';
import { convertLegacy } from '@/core/migrate';
import { formatSetLoad } from '@/core/units';
import type { Conversation, ConversationStore } from '@/escobar/types';
import type { StreamEvent, Transport } from '@/escobar/transport';
import { ctxOf } from './escobar/fixtures';

type Ev = { key: string | null; newValue: string | null };
type Storagelike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

function mapStorage(): Storagelike & { map: Map<string, string> } {
  const map = new Map<string, string>();
  return { map, getItem: k => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); }, removeItem: k => { map.delete(k); } };
}

/** A `window` that only collects `storage` listeners, so a test can play the other tab. */
function stubWindow(): Array<(e: Ev) => void> {
  const listeners: Array<(e: Ev) => void> = [];
  vi.stubGlobal('window', { addEventListener: (t: string, fn: (e: Ev) => void) => { if (t === 'storage') listeners.push(fn); }, removeEventListener: () => {} });
  return listeners;
}

const NOW = Date.parse('2026-09-22T12:00:00.000Z');
const session = (id: string, startedAt: string) => ({ id, splitId: 'x', splitName: 'Push', day: startedAt.slice(0, 10), startedAt, endedAt: startedAt, durationSec: 60, exercises: [{ exerciseId: 'a', name: 'A', sets: [{ kg: 50, reps: 5 }] }], logging: { mode: 'live' } });
const withSessions = (): AppState => ({ ...freshState(new Date(NOW)), sessions: [session('s1', '2026-09-20T10:00:00.000Z')] as never });
const file = (patch: Record<string, unknown>) => JSON.stringify({ app: 'M/ARC', schema: 2, exportedAt: new Date(NOW).toISOString(), state: { ...withSessions(), ...patch } });

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('DATA-01: a restored backup can never crash a reader', () => {
  it('insightFeedback:{} is repaired, and Home selectors run on it, restored and after a reload', async () => {
    const { parseBackup } = await import('@/slices/settings/backup');
    const store = await import('@/core/store');
    const sel = await import('@/app/selectors');
    const b = parseBackup(file({ insightFeedback: {} }), NOW);
    if (!('kind' in b) || b.kind !== 'v37') throw new Error('rejected');
    expect(b.state.insightFeedback).toEqual([]);
    store.state.value = b.state;
    expect(() => [sel.insights.value, sel.hiddenInsights.value, sel.recovery.value, sel.week.value, sel.todayReadiness.value, sel.deloadSuggestion.value]).not.toThrow();
    // Saved as the main state and read back at boot.
    const disk = mapStorage();
    disk.setItem(store.STATE_KEY, JSON.stringify({ ...withSessions(), insightFeedback: {} }));
    store.initStore(disk);
    expect(store.bootSource.value).toBe('saved');
    expect(() => sel.insights.value).not.toThrow();
  });

  it('profileHistory:{} is repaired, and the Escobar brief runs on it', async () => {
    const { parseBackup } = await import('@/slices/settings/backup');
    const { buildBrief } = await import('@/escobar/context/brief');
    const b = parseBackup(file({ profileHistory: {} }), NOW);
    if (!('kind' in b) || b.kind !== 'v37') throw new Error('rejected');
    expect(b.state.profileHistory).toEqual([]);
    expect(() => buildBrief({ ctx: ctxOf(b.state), mode: 'chat', turnIndex: 0, ledger: [] })).not.toThrow();
  });

  it('other malformed lists and objects are repaired with an accurate count', async () => {
    const { parseBackup } = await import('@/slices/settings/backup');
    const b = parseBackup(file({
      insightFeedback: [{ id: 'x', day: '2026-09-20', verdict: 'helpful' }, { id: 'y', day: '2026-09-20', verdict: 'maybe' }],
      weightLog: [{ day: '2026-09-20', kg: 80 }, { day: '2026-09-21', kg: 'heavy' }],
      onboarding: { dismissedAt: {} },
      recoveryModel: { tauScale: [], observations: 'x' },
      deload: { startDay: 5 },
    }), NOW);
    if (!('kind' in b) || b.kind !== 'v37') throw new Error('rejected');
    expect(b.dropped).toBe(2);
    expect(b.state.insightFeedback.map(f => f.id)).toEqual(['x']);
    expect(b.state.weightLog).toEqual([{ day: '2026-09-20', kg: 80 }]);
    expect(b.state.onboarding.dismissedAt).toEqual([]);
    expect(b.state.recoveryModel).toEqual({ tauScale: {}, observations: {} });
    expect(b.state.deload).toBeNull();
  });

  it('active.entries:[null] does not throw: bad entries (null, no exercise) are dropped and counted', async () => {
    const { parseBackup } = await import('@/slices/settings/backup');
    const active = { splitId: 'x', startedAt: new Date(NOW - 3_600_000).toISOString(), pausedMs: 0, entries: [null, {}, { exerciseId: 'a', name: 'A', sets: [null, { kg: 40, reps: 8 }], done: false, skipped: false }] };
    const b = parseBackup(file({ active }), NOW);
    if (!('kind' in b) || b.kind !== 'v37') throw new Error(JSON.stringify(b));
    expect(b.dropped).toBe(3);
    expect(b.state.active?.entries.map(e => e.exerciseId)).toEqual(['a']);
    expect(b.state.active?.entries[0]!.sets.map(s => s.kg)).toEqual([40]);
  });

  it('a file that still fails to read gives the normal invalid-file answer instead of throwing', async () => {
    const { parseBackup } = await import('@/slices/settings/backup');
    for (const legacy of [{ workouts: { completedExercises: [null] } }, { workouts: { completedExercises: {} } }]) {
      expect(parseBackup(JSON.stringify(legacy), NOW)).toEqual({ error: 'That file is not an M/ARC backup' });
    }
  });
});

describe('DATA-02: a reset in another tab is not written back', () => {
  it('a cleared storage ({key:null}) then flushSave does not bring the old profile back', async () => {
    const listeners = stubWindow();
    const store = await import('@/core/store');
    const disk = mapStorage();
    disk.setItem(store.STATE_KEY, JSON.stringify({ ...withSessions(), profile: { ...freshState().profile, name: 'Synthetic old profile' } }));
    store.initStore(disk);
    expect(store.state.value.profile.name).toBe('Synthetic old profile');
    store.update(s => ({ ...s, profile: { ...s.profile, heightCm: 181 } })); // a save is pending
    // The other tab's crash reset: localStorage.clear().
    disk.map.clear();
    for (const fn of listeners) fn({ key: null, newValue: null });
    store.flushSave();
    expect(disk.getItem(store.STATE_KEY) ?? '').not.toContain('Synthetic old profile');
    expect(disk.getItem(store.BACKUP_KEY) ?? '').not.toContain('Synthetic old profile');
    expect(store.state.value.profile.name).not.toBe('Synthetic old profile');
  });

  it('a removed state key counts too', async () => {
    const listeners = stubWindow();
    const store = await import('@/core/store');
    const disk = mapStorage();
    disk.setItem(store.STATE_KEY, JSON.stringify({ ...withSessions(), profile: { ...freshState().profile, name: 'Synthetic old profile' } }));
    store.initStore(disk);
    disk.removeItem(store.STATE_KEY);
    for (const fn of listeners) fn({ key: store.STATE_KEY, newValue: null });
    store.flushSave();
    expect(disk.getItem(store.STATE_KEY) ?? '').not.toContain('Synthetic old profile');
  });

  it('"Delete conversations" notifies the other tab, and its next save keeps the old ones gone', async () => {
    const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, { t: 'final', content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 }, model: 'claude-opus-5' }];
    const transport: Transport = { async *turn() { for (const e of answer('Noted.')) { await Promise.resolve(); yield e; } } };
    const listeners = stubWindow();
    const shared = mapStorage();
    // Tab B holds a conversation.
    const storeB = await import('@/escobar/store');
    const sessionB = await import('@/escobar/session');
    storeB.setEscobarStorage(shared);
    sessionB.setTransport(transport);
    // AUD-2: turns run only while the coach is on.
    (await import('@/core/store')).update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    await sessionB.send({ text: 'zebra-one' });
    const tabB = listeners.slice();
    // Tab A (its own modules) deletes conversations; record what it writes to the shared storage.
    vi.resetModules();
    const storeA = await import('@/escobar/store');
    const sessionA = await import('@/escobar/session');
    const events: Ev[] = [];
    storeA.setEscobarStorage({
      getItem: k => shared.getItem(k),
      setItem: (k, v) => { shared.setItem(k, v); events.push({ key: k, newValue: v }); },
      removeItem: k => { shared.removeItem(k); events.push({ key: k, newValue: null }); },
    });
    sessionA.resetConversations();
    expect(shared.getItem(storeB.ESCOBAR_KEY) ?? '').not.toContain('zebra-one');
    // The browser tells tab B.
    for (const e of events) for (const fn of tabB) fn(e);
    await sessionB.send({ text: 'zebra-two' });
    const saved = shared.getItem(storeB.ESCOBAR_KEY) ?? '';
    expect(saved).toContain('zebra-two');
    expect(saved).not.toContain('zebra-one');
  });
});

/** A small in-memory IndexedDB: enough for images.ts (open, put, get, delete, clear). */
function fakeIndexedDb() {
  const data = new Map<string, unknown>();
  const req = <T>(result: T) => { const r: { result: T; onsuccess?: () => void } = { result }; queueMicrotask(() => r.onsuccess?.()); return r; };
  const os = { put: (v: unknown, k: string) => { data.set(k, v); return req(undefined); }, get: (k: string) => req(data.get(k)), delete: (k: string) => { data.delete(k); return req(undefined); }, clear: () => { data.clear(); return req(undefined); } };
  const db = { transaction: () => ({ objectStore: () => os }), createObjectStore: () => os, onclose: null };
  const idb = { open: () => { const r: { result: typeof db; onupgradeneeded?: () => void; onsuccess?: () => void } = { result: db }; queueMicrotask(() => { r.onupgradeneeded?.(); r.onsuccess?.(); }); return r; } };
  return { idb, data };
}

describe('OBS-PHOTOS: pruning a conversation deletes its photos', () => {
  const conv = (i: number, imageId?: string): Conversation => ({
    id: `c${i}`, createdAt: `2026-09-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`, updatedAt: `2026-09-${String(i + 1).padStart(2, '0')}T10:00:00.000Z`, title: '', mode: 'chat', ledger: [], appVersion: 't', protocol: 2,
    messages: [{ role: 'user', content: imageId ? [{ type: 'image_ref', id: imageId, mediaType: 'image/jpeg' }, { type: 'text', text: 'look' }] : [{ type: 'text', text: 'hi' }] }],
  });

  it('a conversation pushed out by the 20-conversation cap takes its photo from IndexedDB; kept ones stay', async () => {
    const { idb, data } = fakeIndexedDb();
    vi.stubGlobal('indexedDB', idb);
    const store = await import('@/escobar/store');
    const images = await import('@/escobar/images');
    store.setEscobarStorage(mapStorage());
    images.putImage('img_old', { mediaType: 'image/jpeg', data: 'AAA' });
    images.putImage('img_kept', { mediaType: 'image/jpeg', data: 'BBB' });
    await vi.waitFor(() => expect(data.size).toBe(2));
    const full: ConversationStore = { version: 1, activeId: null, conversations: Array.from({ length: 20 }, (_, i) => conv(i, i === 0 ? 'img_old' : i === 5 ? 'img_kept' : undefined)) };
    store.saveStore(full);
    store.saveStore(store.upsertConversation(full, conv(20)));
    expect(store.loadStore().conversations.some(c => c.id === 'c0')).toBe(false);
    await vi.waitFor(() => expect(data.has('img_old')).toBe(false));
    expect(images.imageData('img_old')).toBeNull();
    expect(data.has('img_kept')).toBe(true);
  });
});

describe('OBS-PHOTOS: a restore and its Undo', () => {
  const conv = (id: string, imageId?: string): Conversation => ({
    id, createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z', title: '', mode: 'chat', ledger: [], appVersion: 't', protocol: 2,
    messages: [{ role: 'user', content: imageId ? [{ type: 'image_ref', id: imageId, mediaType: 'image/jpeg' }, { type: 'text', text: 'look' }] : [{ type: 'text', text: 'hi' }] }],
  });
  async function setup() {
    const { idb, data } = fakeIndexedDb();
    vi.stubGlobal('indexedDB', idb);
    const store = await import('@/escobar/store');
    const images = await import('@/escobar/images');
    store.setEscobarStorage(mapStorage());
    images.putImage('img_mine', { mediaType: 'image/jpeg', data: 'AAA' });
    await vi.waitFor(() => expect(data.has('img_mine')).toBe(true));
    const mine: ConversationStore = { version: 1, activeId: null, conversations: [conv('c_mine', 'img_mine')] };
    store.saveStore(mine);
    const restored: ConversationStore = { version: 1, activeId: null, conversations: [conv('c_file')] };
    return { store, data, mine, restored };
  }
  const settle = async () => { for (let i = 0; i < 5; i++) await new Promise(r => setTimeout(r, 0)); };

  it('Undo brings the replaced conversation back with its photo', async () => {
    const { store, data, mine, restored } = await setup();
    store.restoreEscobar(restored);
    store.restoreEscobar(mine); // Undo
    await settle();
    expect(data.has('img_mine')).toBe(true);
    store.saveStore(store.upsertConversation(store.loadStore(), conv('c_new'), false));
    await settle();
    expect(data.has('img_mine')).toBe(true);
  });

  it('a kept restore deletes the replaced conversations\' photos at the next save', async () => {
    const { store, data, restored } = await setup();
    store.restoreEscobar(restored);
    await settle();
    expect(data.has('img_mine')).toBe(true);
    store.saveStore(store.upsertConversation(store.loadStore(), conv('c_new'), false));
    await vi.waitFor(() => expect(data.has('img_mine')).toBe(false));
  });
});

describe('OBS-LB: a legacy lb import displays as typed', () => {
  it('102 kg from an lb user shows 225 lb', () => {
    const legacy = { workouts: { completedExercises: [{ id: 'a', day: 'push', dayKey: '2026-09-10', name: 'Chest Press', type: 'Machine', muscle: 'Chest', sets: [{ kg: 102, reps: 5 }], finalizedAt: '2026-09-10T08:10:00.000Z' }] }, preferences: { units: { weight: 'lb' } } };
    const s = convertLegacy(legacy as never, new Date(NOW));
    const set = s.sessions[0]!.exercises[0]!.sets[0]!;
    expect(set.kg).toBe(102);
    expect(formatSetLoad(set, 'lb')).toBe('225 lb');
  });
});

describe('OBS-ENDPOINT: a restore keeps this phone\'s coach settings', () => {
  it('a backup with another server, the coach on and both sharing flags restores the data, not those settings', async () => {
    const { parseBackup, restoredState } = await import('@/slices/settings/backup');
    const store = await import('@/core/store');
    store.initStore(mapStorage());
    const mine = { ...freshEscobar(), enabled: false, proxyUrl: 'https://mine.example', deviceId: `dev_${'a'.repeat(24)}`, sharing: { health: false, body: false } };
    store.replaceState({ ...freshState(new Date(NOW)), escobar: mine });
    const b = parseBackup(file({ escobar: { ...freshEscobar(), enabled: true, proxyUrl: 'https://audit.invalid', deviceId: `dev_${'b'.repeat(24)}`, sharing: { health: true, body: true }, tone: 'direct' } }), NOW);
    if (!('kind' in b) || b.kind !== 'v37') throw new Error('rejected');
    store.replaceState(restoredState(b.state, store.state.value));
    const e = store.state.value.escobar;
    expect(store.state.value.sessions.map(x => x.id)).toEqual(['s1']);
    expect({ enabled: e.enabled, proxyUrl: e.proxyUrl, deviceId: e.deviceId, sharing: e.sharing }).toEqual({ enabled: false, proxyUrl: 'https://mine.example', deviceId: mine.deviceId, sharing: { health: false, body: false } });
    expect(e.tone).toBe('direct');
    expect(store.state.value.health.connected).toBe(false);
  });
});

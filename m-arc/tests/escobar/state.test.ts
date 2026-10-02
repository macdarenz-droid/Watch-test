import { describe, it, expect } from 'vitest';
import { freshState, freshEscobar, MAX_MEMORY_ITEMS, MAX_PINS } from '@/core/models';
import { loadState, STATE_KEY } from '@/core/store';
import { normalizeEscobar } from '@/core/escobarState';

function storageWith(value: unknown): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> {
  const map = new Map<string, string>([[STATE_KEY, JSON.stringify(value)]]);
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); }, removeItem: k => { map.delete(k); } };
}

const mem = (i: number, kind = 'fact') => ({ id: `m${i}`, kind, text: `item ${i}`, source: 'user_said', createdAt: '2026-09-01T10:00:00.000Z', updatedAt: '2026-09-01T10:00:00.000Z' });

describe('EscobarState defaults', () => {
  it('freshState carries an off, private-by-default coach', () => {
    const e = freshState().escobar;
    expect(e.enabled).toBe(false);
    expect(e.proxyUrl).toBeNull();
    expect(e.sharing).toEqual({ health: false, body: false });
    expect(e.tone).toBe('warm');
    expect(e.memory).toEqual([]);
    expect(e.todayOverride).toBeNull();
    expect(e.legacyImported).toBe(false);
  });
  it('a state saved before Escobar existed loads with the defaults', () => {
    const old = freshState() as unknown as Record<string, unknown>;
    delete old.escobar;
    const { state } = loadState(storageWith(old));
    expect(state.escobar).toEqual(freshEscobar());
    expect(state.version).toBe(1);
  });
});

describe('normalizeEscobar', () => {
  it('returns defaults for garbage', () => {
    expect(normalizeEscobar(null)).toEqual(freshEscobar());
    expect(normalizeEscobar('x')).toEqual(freshEscobar());
    expect(normalizeEscobar([1, 2])).toEqual(freshEscobar());
  });
  it('keeps valid fields', () => {
    const e = normalizeEscobar({ enabled: true, tone: 'direct', sharing: { health: true, body: false }, deviceId: 'dev_0123456789abcdef01234567', proxyUrl: 'https://x.example' });
    expect(e.enabled).toBe(true);
    expect(e.tone).toBe('direct');
    expect(e.sharing).toEqual({ health: true, body: false });
    expect(e.deviceId).toBe('dev_0123456789abcdef01234567');
    expect(e.proxyUrl).toBe('https://x.example');
  });
  it('drops a malformed device id and proxy url', () => {
    const e = normalizeEscobar({ deviceId: 'dev_XYZ', proxyUrl: 'javascript:alert(1)' });
    expect(e.deviceId).toBe('');
    expect(e.proxyUrl).toBeNull();
  });
  it('drops malformed memory items and caps the list at 60, newest kept', () => {
    const items = [...Array.from({ length: 70 }, (_, i) => mem(i)), { id: 'bad', kind: 'nope', text: 'x', createdAt: 'x' }, { kind: 'fact' }, mem(99, 'fact')];
    const e = normalizeEscobar({ memory: items });
    expect(e.memory).toHaveLength(MAX_MEMORY_ITEMS);
    expect(e.memory.at(-1)!.id).toBe('m99');
    expect(e.memory.some(m => m.id === 'bad')).toBe(false);
    expect(e.memory[0]!.id).toBe('m11');
  });
  it('trims memory text to 200 characters and drops empty text', () => {
    const e = normalizeEscobar({ memory: [{ ...mem(1), text: 'a'.repeat(300) }, { ...mem(2), text: '   ' }] });
    expect(e.memory).toHaveLength(1);
    expect(e.memory[0]!.text).toHaveLength(200);
  });
  it('drops pins with unknown components and caps pins at 4', () => {
    const pin = (i: number, component = 'lift_trend') => ({ id: `p${i}`, component, params: { exerciseId: 'x' }, title: 't', pinnedAt: '2026-09-01' });
    const e = normalizeEscobar({ pins: [pin(1, 'hack'), pin(2), pin(3), pin(4), pin(5), pin(6)] });
    expect(e.pins).toHaveLength(MAX_PINS);
    expect(e.pins.every(p => p.component === 'lift_trend')).toBe(true);
  });
  it('keeps valid today-override changes and drops bad ones', () => {
    const e = normalizeEscobar({ todayOverride: { day: '2026-09-22', splitId: 's1', reason: 'knee', changes: [{ kind: 'swap', from: 'a', to: 'b' }, { kind: 'load', exerciseId: 'a' }, { kind: 'weird' }, { kind: 'sets', exerciseId: 'c', sets: 2 }] } });
    expect(e.todayOverride!.changes).toEqual([{ kind: 'swap', from: 'a', to: 'b' }, { kind: 'sets', exerciseId: 'c', sets: 2 }]);
    expect(normalizeEscobar({ todayOverride: { day: 'today', splitId: 's1', changes: [] } }).todayOverride).toBeNull();
  });
  it('repairs proactive, usage and brief', () => {
    const e = normalizeEscobar({ proactive: { enabled: false, shown: { morning: '2026-09-20', bad: 3 }, count: -2 }, usage: { turns: 'x', inputTokens: 10 }, brief: { day: '2026-09-22', headline: 'h', generatedAt: 'g', priorities: [{ insightId: 'a', line: 'l' }, { x: 1 }, { insightId: 'b', line: 'l' }, { insightId: 'c', line: 'l' }, { insightId: 'd', line: 'l' }] } });
    expect(e.proactive).toEqual({ enabled: false, shown: { morning: '2026-09-20' }, day: '', count: 0 });
    expect(e.usage.turns).toBe(0);
    expect(e.usage.inputTokens).toBe(10);
    expect(e.brief!.priorities.map(p => p.insightId)).toEqual(['a', 'b', 'c']);
    expect(e.brief!.source).toBe('brain');
  });
});

describe('old Escobar thread', () => {
  it('coach.askThread from the old line survives load for the one-time import', () => {
    const old = { ...freshState(), coach: { deviceId: 'dev_0123456789abcdef01234567', askThread: [{ role: 'user', text: 'hi' }, { role: 'assistant', text: 'hello' }] } } as unknown as Record<string, unknown>;
    delete old.escobar;
    const { state } = loadState(storageWith(old));
    const coach = (state as unknown as { coach: { askThread: unknown[] } }).coach;
    expect(coach.askThread).toHaveLength(2);
    expect(state.escobar.legacyImported).toBe(false);
  });
});

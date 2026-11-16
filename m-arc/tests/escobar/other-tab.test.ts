import { describe, it, expect, vi, afterEach } from 'vitest';
import type { StreamEvent, Transport } from '@/escobar/transport';

const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, { t: 'final', content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 }, model: 'claude-opus-5' }];
const transport: Transport = { async *turn() { for (const e of answer('Noted.')) { await Promise.resolve(); yield e; } } };

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

describe('another tab resets Escobar (QA-R1-9)', () => {
  it('this tab drops the old conversations instead of writing them back', async () => {
    const listeners: Array<(e: { key: string | null; newValue: string | null }) => void> = [];
    vi.stubGlobal('window', { addEventListener: (t: string, fn: (e: { key: string | null; newValue: string | null }) => void) => { if (t === 'storage') listeners.push(fn); } });
    vi.resetModules();
    const store = await import('@/escobar/store');
    const session = await import('@/escobar/session');
    // AUD-2: a turn only reaches the transport while the online coach is on.
    (await import('@/core/store')).update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    const shared = store.memoryStorage();
    store.setEscobarStorage(shared);
    session.setTransport(transport);
    await session.send({ text: 'zebra-one' });
    expect(store.loadStore().conversations).toHaveLength(1);
    // Tab A: Reset everything. Only the shared storage changes; tab A's own listeners are in tab A.
    shared.removeItem(store.ESCOBAR_KEY);
    shared.setItem("marc.escobar.v1.replaced", '1');
    for (const fn of listeners) fn({ key: "marc.escobar.v1.replaced", newValue: '1' });
    await session.send({ text: 'zebra-two' });
    const texts = JSON.stringify(store.loadStore().conversations);
    expect(texts).toContain('zebra-two');
    expect(texts).not.toContain('zebra-one');
  });
});

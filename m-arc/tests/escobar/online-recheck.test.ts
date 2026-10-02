import { describe, it, expect, vi, afterEach } from 'vitest';
import type { Transport } from '@/escobar/transport';

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); vi.resetModules(); });

describe('after a dropped answer (QA-R4a-6)', () => {
  it('Escobar checks again when the back-off ends, without the sheet being reopened', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ protocol: 2, key: true }), { status: 200, headers: { 'content-type': 'application/json' } })));
    const store = await import('@/escobar/store');
    const session = await import('@/escobar/session');
    // AUD-2: a turn only reaches the transport while the online coach is on.
    (await import('@/core/store')).update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    const { online } = await import('@/escobar/state');
    store.setEscobarStorage(store.memoryStorage());
    const broken: Transport = { async *turn() { await Promise.resolve(); throw new TypeError('Failed to fetch'); } };
    session.setTransport(broken);
    const r = await session.send({ text: 'hello' });
    expect(r.error?.code).toBe('network');
    expect(online.value).toBe(false);
    await vi.advanceTimersByTimeAsync(61_000);
    expect(online.value).toBe(true);
  });
});

describe('still unreachable at the first re-check (QA2-FD-3)', () => {
  it('keeps checking while Escobar is on, and comes back online when the Worker does', async () => {
    vi.useFakeTimers();
    let up = false;
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ protocol: 2, key: up }), { status: 200 })));
    const session = await import('@/escobar/session');
    // AUD-2: a turn only reaches the transport while the online coach is on.
    (await import('@/core/store')).update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    const { online } = await import('@/escobar/state');
    const { update } = await import('@/core/store');
    update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    session.checkOnline();
    await vi.advanceTimersByTimeAsync(10);
    expect(online.value).toBe(false);
    await vi.advanceTimersByTimeAsync(61_000); // the first re-check: still down
    expect(online.value).toBe(false);
    up = true;
    await vi.advanceTimersByTimeAsync(61_000);
    expect(online.value).toBe(true);
  });
});

describe('the offline reason after an answer (QA2-FD-6, QA2-FD-10)', () => {
  it('an answer that arrives, or a dropped one, clears the old health-check reason', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ protocol: 2, key: true }), { status: 200 })));
    const store = await import('@/escobar/store');
    const session = await import('@/escobar/session');
    // AUD-2: a turn only reaches the transport while the online coach is on.
    (await import('@/core/store')).update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    const { offlineReason } = await import('@/escobar/state');
    store.setEscobarStorage(store.memoryStorage());
    const ok: Transport = { async *turn() { await Promise.resolve(); yield { t: 'text', d: 'Hi.' }; yield { t: 'final', content: [{ type: 'text', text: 'Hi.' }], stop_reason: 'end_turn', usage: { input_tokens: 1, output_tokens: 1 }, model: 'claude-opus-5' }; } };
    session.setTransport(ok);
    offlineReason.value = "Escobar isn't set up yet.";
    await session.send({ text: 'hello' });
    expect(offlineReason.value).toBeNull();
    session.setTransport({ async *turn() { await Promise.resolve(); throw new TypeError('Failed to fetch'); } });
    offlineReason.value = "Escobar isn't set up yet.";
    const r = await session.send({ text: 'again' });
    expect(r.error?.code).toBe('network');
    expect(offlineReason.value).toBeNull();
  });
});

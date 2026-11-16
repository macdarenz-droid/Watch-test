import { describe, it, expect } from 'vitest';
import { clearStore, loadStore, memoryStorage, setEscobarStorage } from '@/escobar/store';
import { send, setTransport } from '@/escobar/session';
import { update } from '@/core/store';
import type { StreamEvent, Transport } from '@/escobar/transport';

const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, { t: 'final', content: [{ type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 10, output_tokens: 5 }, model: 'claude-opus-5' }];
const transport: Transport = { async *turn() { for (const e of answer('Noted.')) { await Promise.resolve(); yield e; } } };

describe('Escobar store replaced (ES-07)', () => {
  it('send → reset conversations store → send leaves exactly one stored conversation', async () => {
    setEscobarStorage(memoryStorage());
    // AUD-2: a turn only reaches the transport while the online coach is on.
    update(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
    setTransport(transport);
    await send({ text: 'zebra-one' });
    expect(loadStore().conversations).toHaveLength(1);
    clearStore();
    await send({ text: 'zebra-two' });
    const store = loadStore();
    expect(store.conversations).toHaveLength(1);
    const texts = JSON.stringify(store.conversations[0]!.messages);
    expect(texts).toContain('zebra-two');
    expect(texts).not.toContain('zebra-one');
  });
});

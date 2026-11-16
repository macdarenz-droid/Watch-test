// BUG-32 (B3): the pre-screen card sits right under the message that raised it (not at the top of
// the thread), shows before and without the reply (offline too), and shows once when the reply
// draws the same card. The thread is called as a plain function and its children read in order.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Fragment, type VNode } from 'preact';
import { memoryStorage, newConversation, setEscobarStorage } from '@/escobar/store';
import { activeConversation, lastTurn, resetConversations, safetyCards, send, setTransport } from '@/escobar/session';
import { escobarUi } from '@/escobar/state';
import { update as updateApp } from '@/core/store';
import { Thread } from '@/escobar/ui/EscobarSheet';
import { EscobarTurnView, UserBubble } from '@/escobar/ui/Message';
import { Escalation } from '@/escobar/ui/Escalation';
import type { StreamEvent, Transport } from '@/escobar/transport';
import type { StoredMessage } from '@/escobar/types';

type Node = VNode<Record<string, unknown> & { children?: unknown }>;
const usage = { input_tokens: 10, output_tokens: 5 };
const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, { t: 'final', content: [{ type: 'text', text }], stop_reason: 'end_turn', usage, model: 'm' }];
const escalate = (id: string, kind: string): StreamEvent[] => [
  { t: 'tool', id, name: 'escalate' }, { t: 'tool_input', id, input: { kind } },
  { t: 'final', content: [{ type: 'tool_use', id, name: 'escalate', input: { kind } }], stop_reason: 'tool_use', usage, model: 'm' },
];

/** Plays queued steps in order, then plain answers; a step can wait for `release()`. */
function scripted() {
  const steps: StreamEvent[][] = [];
  let hold: Promise<void> | null = null;
  let open: (() => void) | null = null;
  const t: Transport = {
    async *turn() {
      if (hold) await hold;
      for (const e of steps.shift() ?? answer('Noted.')) yield e;
    },
  };
  return {
    t,
    queue: (...s: StreamEvent[][]) => { steps.push(...s); },
    holdNext: () => { hold = new Promise<void>(r => { open = r; }); },
    release: () => { const o = open; hold = null; open = null; o?.(); },
  };
}
const tick = () => new Promise(r => setTimeout(r, 0));

/** The thread's children in screen order, arrays and fragments flattened. */
function rows(): Node[] {
  const out: Node[] = [];
  const add = (n: unknown): void => {
    if (n == null || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(add); return; }
    const v = n as Node;
    if (v.type === Fragment) { add(v.props.children); return; }
    out.push(v);
  };
  add((Thread({ onChip: () => {} }) as Node).props.children);
  return out;
}
const bubbleText = (v: Node): string | null => {
  if (v.type !== UserBubble) return null;
  const msg = v.props.msg as { content: Array<{ type: string; text?: string }> };
  return msg.content.filter(b => b.type === 'text').map(b => b.text).join('');
};
const isCard = (v: Node | undefined, kind = 'crisis') => !!v && v.type === Escalation && v.props.kind === kind;
const cardCount = (list: Node[]) => list.filter(v => v.type === Escalation).length;
const at = (list: Node[], text: string) => list.findIndex(v => bubbleText(v) === text);
/** The cards an Escobar turn draws itself (escalate tool calls). */
function cardsInReply(v: Node): Node[] {
  const found: Node[] = [];
  const walk = (n: unknown): void => {
    if (n == null || typeof n !== 'object') return;
    if (Array.isArray(n)) { n.forEach(walk); return; }
    const x = n as Node;
    if (x.type === Escalation) found.push(x);
    walk(x.props?.children);
  };
  walk(EscobarTurnView(v.props as unknown as Parameters<typeof EscobarTurnView>[0]));
  return found;
}

let s: ReturnType<typeof scripted>;
beforeEach(() => {
  // AUD-2: a turn only reaches the transport while the online coach is on.
  updateApp(s => ({ ...s, escobar: { ...s.escobar, enabled: true } }));
  setEscobarStorage(memoryStorage());
  resetConversations();
  escobarUi.value = { ...escobarUi.value, mode: 'chat', draft: '' };
  s = scripted();
  setTransport(s.t);
});
afterEach(() => { vi.unstubAllGlobals(); setTransport(null); });

async function longConversation(n = 8): Promise<void> {
  for (let i = 1; i <= n; i++) await send({ text: `question ${i}` });
}

describe('BUG-32 the pre-screen card sits under the message that raised it', () => {
  it('in a long conversation the card shows right after the crisis bubble, before the reply, not at the top', async () => {
    await longConversation();
    s.holdNext();
    const turn = send({ text: 'i wanna die' });
    await tick();
    // Before the reply: the message is still on its way; its card follows it straight away.
    let list = rows();
    const bubble = at(list, 'i wanna die');
    expect(bubble).toBeGreaterThan(at(list, 'question 8'));
    expect(isCard(list[bubble + 1])).toBe(true);
    expect(cardCount(list)).toBe(1);
    expect(list.slice(0, bubble).some(v => v.type === Escalation)).toBe(false);
    s.release();
    expect((await turn).outcome).toBe('done');
    // After the reply: still right under the (now saved) bubble, and the reply follows the card.
    list = rows();
    const saved = at(list, 'i wanna die');
    expect(isCard(list[saved + 1])).toBe(true);
    expect(list[saved + 2]?.type).toBe(EscobarTurnView);
    expect(cardCount(list)).toBe(1);
    expect(list.slice(0, saved).some(v => v.type === Escalation)).toBe(false);
  });

  it('a second crisis message later gets its own card under it', async () => {
    await send({ text: 'i wish i was dead' });
    await longConversation(4);
    await send({ text: 'life isn’t worth living' });
    const list = rows();
    expect(isCard(list[at(list, 'i wish i was dead') + 1])).toBe(true);
    expect(isCard(list[at(list, 'life isn’t worth living') + 1])).toBe(true);
    expect(cardCount(list)).toBe(2);
  });

  it('a reply that draws the same card shows one card, not two', async () => {
    await longConversation(3);
    s.queue(escalate('tu_esc1', 'crisis'), answer('I hear you.'));
    expect((await send({ text: 'i want to unalive myself' })).outcome).toBe('done');
    expect(safetyCards.value.map(c => c.kind)).toEqual(['crisis']);
    const list = rows();
    const bubble = at(list, 'i want to unalive myself');
    const reply = list[bubble + 1]!;
    expect(reply.type).toBe(EscobarTurnView);
    expect(cardCount(list)).toBe(0);
    const drawn = cardsInReply(reply);
    expect(drawn).toHaveLength(1);
    expect(isCard(drawn[0])).toBe(true);
  });

  it('a reply that draws a different card keeps the pre-screen card', async () => {
    s.queue(escalate('tu_esc2', 'medical'), answer('Stop for now.'));
    await send({ text: 'i keep cutting myself' });
    const list = rows();
    const bubble = at(list, 'i keep cutting myself');
    expect(isCard(list[bubble + 1])).toBe(true);
    expect(list[bubble + 2]?.type).toBe(EscobarTurnView);
    expect(cardsInReply(list[bubble + 2]!).map(v => v.props.kind)).toEqual(['medical']);
  });

  it('an escalate the reply could not draw (an error result) leaves the pre-screen card', () => {
    const messages: StoredMessage[] = [
      { role: 'user', content: [{ type: 'text', text: 'i want to cut myself' }] },
      { role: 'assistant', content: [{ type: 'tool_use', id: 'tu_bad', name: 'escalate', input: { kind: 'crisis' } }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_bad', content: 'not run: aborted', is_error: true }] },
      { role: 'assistant', content: [{ type: 'text', text: 'I am here.' }], meta: { rendered: { answer: 'I am here.' } } },
    ];
    activeConversation.value = { ...newConversation('test', 'chat'), messages };
    safetyCards.value = [{ kind: 'crisis', at: 0 }];
    const list = rows();
    expect(isCard(list[at(list, 'i want to cut myself') + 1])).toBe(true);
    expect(cardsInReply(list[2]!)).toHaveLength(0);
    expect(cardCount(list)).toBe(1);
  });

  it('offline: the card shows under the unsent message, with no reply', async () => {
    await longConversation(3);
    vi.stubGlobal('navigator', { onLine: false });
    const r = await send({ text: 'dont wanna be here' });
    expect(r.outcome).toBe('offline');
    const list = rows();
    const bubble = at(list, 'dont wanna be here');
    expect(bubble).toBeGreaterThan(at(list, 'question 3'));
    expect(isCard(list[bubble + 1])).toBe(true);
    expect(cardCount(list)).toBe(1);
    expect(list.slice(bubble).some(v => v.type === EscobarTurnView)).toBe(false);
  });

  it('Retry of the unsent message keeps one card, under it', async () => {
    vi.stubGlobal('navigator', { onLine: false });
    await send({ text: 'i wanna kms' });
    vi.unstubAllGlobals();
    expect((await send(lastTurn.value!.input)).outcome).toBe('done');
    const list = rows();
    expect(isCard(list[at(list, 'i wanna kms') + 1])).toBe(true);
    expect(cardCount(list)).toBe(1);
  });

  it('a new message after an unsent one does not take its card; the card keeps its place', async () => {
    await longConversation(2);
    vi.stubGlobal('navigator', { onLine: false });
    await send({ text: 'nobody would miss me if i was gone' });
    vi.unstubAllGlobals();
    await send({ text: 'what should I train today?' });
    const list = rows();
    const next = at(list, 'what should I train today?');
    expect(isCard(list[next - 1])).toBe(true);
    expect(list[next - 2]?.type).toBe(EscobarTurnView);
    expect(list[next + 1]?.type).toBe(EscobarTurnView);
    expect(cardCount(list)).toBe(1);
  });

  it('keeps cards in memory only and clears them with the conversation', async () => {
    await send({ text: 'i wanna die' });
    expect(safetyCards.value.map(c => [c.kind, c.at])).toEqual([['crisis', 0]]);
    expect(JSON.stringify(activeConversation.value)).not.toMatch(/orphan|safetyCard/);
    resetConversations();
    expect(safetyCards.value).toEqual([]);
  });
});

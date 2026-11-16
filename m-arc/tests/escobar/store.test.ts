import { describe, it, expect, beforeEach } from 'vitest';
import {
  ESCOBAR_KEY, MAX_CONVERSATIONS, appendMessages, emptyStore, exportAllEscobar, fitToBudget, legacyConversation, loadStore, memoryStorage, trimOldest,
  newConversation, recordDecision, restoreEscobar, sanitizeStore, saveStore, setEscobarStorage, upsertConversation, clearStore,
} from '@/escobar/store';
import type { Conversation, ConversationStore, StoredMessage } from '@/escobar/types';

let storage: ReturnType<typeof memoryStorage>;
beforeEach(() => { storage = memoryStorage(); setEscobarStorage(storage); });

const user = (text: string): StoredMessage => ({ role: 'user', content: [{ type: 'text', text }] });
const assistant = (text: string): StoredMessage => ({ role: 'assistant', content: [{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'text', text }], meta: { rendered: { answer: text } } });

function conv(i: number, extra: Partial<Conversation> = {}): Conversation {
  const c = newConversation('37.0.0', 'chat', new Date(Date.UTC(2026, 8, 1, 0, i)));
  return { ...c, id: `c${i}`, ...extra };
}

describe('conversation store', () => {
  it('round-trips a conversation, thinking blocks included', () => {
    let s = upsertConversation(emptyStore(), conv(1));
    s = appendMessages(s, 'c1', [user('Why is my readiness amber?'), { role: 'system', content: 'now: Tue' }, assistant('Sleep was short.')]);
    saveStore(s);
    const loaded = loadStore();
    expect(loaded.activeId).toBe('c1');
    expect(loaded.conversations[0]!.messages).toHaveLength(3);
    expect(loaded.conversations[0]!.title).toBe('Why is my readiness amber?');
    expect((loaded.conversations[0]!.messages[2]!.content as Array<{ signature?: string }>)[0]!.signature).toBe('sig');
  });
  it('appending never edits earlier messages', () => {
    let s = upsertConversation(emptyStore(), conv(1));
    s = appendMessages(s, 'c1', [user('one')]);
    const first = s.conversations[0]!.messages[0];
    s = appendMessages(s, 'c1', [assistant('two')]);
    expect(s.conversations[0]!.messages[0]).toBe(first);
  });
  it('titles from the first user line, without the context ref, 40 chars', () => {
    let s = upsertConversation(emptyStore(), conv(1));
    s = appendMessages(s, 'c1', [user('[about: exercise lib_bench "Bench press"] ' + 'x'.repeat(60))]);
    expect(s.conversations[0]!.title).toBe('x'.repeat(40));
  });
  it('returns an empty store for missing or corrupt data', () => {
    expect(loadStore()).toEqual(emptyStore());
    storage.setItem(ESCOBAR_KEY, '{nope');
    expect(loadStore()).toEqual(emptyStore());
    storage.setItem(ESCOBAR_KEY, JSON.stringify({ version: 2, conversations: [] }));
    expect(loadStore()).toEqual(emptyStore());
  });
  it('drops malformed conversations and an unknown active id', () => {
    const s = sanitizeStore({ version: 1, activeId: 'zzz', conversations: [conv(1), { id: 3 }, 'x'] });
    expect(s.conversations.map(c => c.id)).toEqual(['c1']);
    expect(s.activeId).toBeNull();
  });
  it('caps at 20 conversations, summarised ones leaving first, never the active one', () => {
    let s = emptyStore();
    for (let i = 0; i < MAX_CONVERSATIONS; i++) s = upsertConversation(s, conv(i, i === 5 ? { summarisedAt: 'x' } : {}), false);
    s = { ...s, activeId: 'c0' };
    s = upsertConversation(s, conv(30), false);
    expect(s.conversations).toHaveLength(MAX_CONVERSATIONS);
    expect(s.conversations.some(c => c.id === 'c5')).toBe(false);
    s = upsertConversation(s, conv(31), false);
    expect(s.conversations.some(c => c.id === 'c0')).toBe(true);
    expect(s.conversations.some(c => c.id === 'c1')).toBe(false);
  });
  it('size guard prunes the oldest until under 1 MB', () => {
    let s: ConversationStore = emptyStore();
    const big = 'y'.repeat(60_000);
    for (let i = 0; i < 12; i++) s = appendMessages(upsertConversation(s, conv(i), false), `c${i}`, [user(big)]);
    const { store, raw } = fitToBudget(s, 0);
    expect(raw.length * 2).toBeLessThanOrEqual(1_000_000);
    expect(store.conversations.length).toBeLessThan(12);
    expect(store.conversations.at(-1)!.id).toBe('c11');
  });
  it('size guard never drops the active conversation; it trims its oldest turns (ES-18)', () => {
    let s: ConversationStore = emptyStore();
    s = upsertConversation(s, conv(1), false);
    s = appendMessages(s, 'c1', [user('small')]);
    const msgs: StoredMessage[] = [];
    for (let i = 0; i < 20; i++) msgs.push(user(`q${i} ${'w'.repeat(60_000)}`), assistant(`a${i}`));
    s = appendMessages(upsertConversation(s, conv(2), true), 'c2', msgs);
    const { store, raw } = fitToBudget(s, 0);
    expect(raw.length * 2).toBeLessThanOrEqual(1_000_000);
    expect(store.activeId).toBe('c2');
    const active = store.conversations.find(c => c.id === 'c2')!;
    expect(active.trimmed).toBe(true);
    expect(active.messages[0]!.role).toBe('user');
    expect(JSON.stringify(active.messages.at(-1))).toContain('a19');
    expect(store.conversations.some(c => c.id === 'c1')).toBe(false);
  });
  it('keeps the active conversation when the training data alone fills the total budget (QA-R4b-4)', () => {
    let s: ConversationStore = emptyStore();
    s = appendMessages(upsertConversation(s, conv(1), false), 'c1', [user('old chat')]);
    const msgs: StoredMessage[] = [];
    for (let i = 0; i < 20; i++) msgs.push(user(`q${i} ${'w'.repeat(6_000)}`), assistant(`a${i}`));
    s = appendMessages(upsertConversation(s, conv(2), true), 'c2', msgs);
    const { store, raw } = fitToBudget(s, 4_000_000);
    expect(store.activeId).toBe('c2');
    expect(JSON.stringify(store.conversations.find(c => c.id === 'c2')!.messages.at(-1))).toContain('a19');
    expect(raw.length * 2).toBeLessThanOrEqual(250_000);
  });
  it('trimOldest cuts at a plain user message after the midpoint and shifts the summary', () => {
    const c = conv(3, { messages: [user('a'), assistant('b'), user('c'), assistant('d'), user('e'), assistant('f')], rollingSummary: { text: 'sum', upTo: 4 } });
    const t = trimOldest(c)!;
    expect(t.messages.map(m => (m.role === 'user' ? (m.content[0] as { text: string }).text : 'x'))).toEqual(['e', 'x']);
    expect(t.rollingSummary).toEqual({ text: 'sum', upTo: 0 });
    expect(trimOldest(conv(4, { messages: [user('only')] }))).toBeNull();
  });
  it('trimOldest moves proposal cards with their messages (QA-R4b-7)', () => {
    const p = (id: string, messageIndex: number) => ({ id, name: 'propose_goal', input: {}, title: id, status: 'awaiting', messageIndex }) as never;
    const c = conv(5, { messages: [user('a'), assistant('b'), user('c'), assistant('d'), user('e'), assistant('f')], proposals: [p('old', 1), p('kept', 5)] });
    const t = trimOldest(c)!;
    expect(t.proposals!.map(x => [x.id, x.messageIndex])).toEqual([['kept', 1]]);
  });
  it('the old coach chat becomes a text-only "Earlier conversation" (RG-03)', () => {
    const c = legacyConversation([{ role: 'assistant', text: 'welcome' }, { role: 'user', text: 'hi' }, { role: 'user', text: 'again' }, { role: 'assistant', text: 'hello' }, { role: 'system', text: 'x' }, { role: 'user', text: '' }], 'test')!;
    expect(c.title).toBe('Earlier conversation');
    expect(c.messages.map(m => m.role)).toEqual(['user', 'assistant']);
    expect(c.messages[0]!.content).toEqual([{ type: 'text', text: 'hi\n\nagain' }]);
    expect(legacyConversation('nope', 'test')).toBeNull();
    expect(legacyConversation([{ role: 'assistant', text: 'only me' }], 'test')).toBeNull();
  });
  it('size guard counts the main state and heart store against 4 MB', () => {
    let s: ConversationStore = emptyStore();
    for (let i = 0; i < 4; i++) s = appendMessages(upsertConversation(s, conv(i), false), `c${i}`, [user('z'.repeat(50_000))]); // QA-R4b-4: above the 250 KB room Escobar always keeps
    expect(fitToBudget(s, 0).store.conversations).toHaveLength(4);
    expect(fitToBudget(s, 3_900_000).store.conversations.length).toBeLessThan(4);
  });
  it('never stores photo bytes: base64 image blocks become stubs, refs lose their data', () => {
    let s = upsertConversation(emptyStore(), conv(1));
    const withImage = { role: 'user', content: [{ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: 'AAAA'.repeat(1000) } }, { type: 'image_ref', id: 'img1', mediaType: 'image/jpeg', data: 'BBBB' }, { type: 'text', text: 'rack' }] } as unknown as StoredMessage;
    s = appendMessages(s, 'c1', [withImage]);
    saveStore(s);
    const raw = storage.getItem(ESCOBAR_KEY)!;
    expect(raw).not.toContain('AAAA');
    expect(raw).not.toContain('BBBB');
    const blocks = loadStore().conversations[0]!.messages[0]!.content as Array<{ type: string; id?: string }>;
    expect(blocks[0]).toEqual({ type: 'text', text: '[photo shared earlier]' });
    expect(blocks[1]).toEqual({ type: 'image_ref', id: 'img1', mediaType: 'image/jpeg' });
  });
  it('queues decisions without touching messages', () => {
    let s = appendMessages(upsertConversation(emptyStore(), conv(1)), 'c1', [user('hi')]);
    const before = s.conversations[0]!.messages;
    s = recordDecision(s, 'c1', { proposalId: 'p1', decision: 'applied', at: 'now', title: 'Create split: Arms' });
    expect(s.conversations[0]!.messages).toBe(before);
    expect(s.conversations[0]!.pendingDecisions).toHaveLength(1);
  });
  it('a failed write never throws', () => {
    setEscobarStorage({ getItem: () => null, setItem: () => { throw new Error('quota'); }, removeItem: () => {} });
    expect(saveStore(upsertConversation(emptyStore(), conv(1)))).toBeNull();
  });
  it('backup export and restore round trip; garbage restore is ignored', () => {
    saveStore(appendMessages(upsertConversation(emptyStore(), conv(1)), 'c1', [user('hello')]));
    const dump = JSON.parse(JSON.stringify(exportAllEscobar()));
    clearStore();
    expect(loadStore().conversations).toHaveLength(0);
    restoreEscobar(dump);
    expect(loadStore().conversations[0]!.title).toBe('hello');
    restoreEscobar(undefined);
    expect(loadStore().conversations).toHaveLength(1);
    restoreEscobar({ nonsense: true });
    expect(loadStore().conversations).toHaveLength(0);
  });
});

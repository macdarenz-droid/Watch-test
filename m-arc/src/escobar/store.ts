import type { Conversation, ConversationMode, ConversationStore, DecisionEvent, StoredMessage, UserBlock } from './types';

/**
 * The conversation store (§6.2): its own localStorage key, like heartStore, so a
 * long chat history never slows or endangers the main state save. Written only when
 * a message is committed or a decision recorded, never per streamed delta. A failed
 * write is swallowed: Escobar's history is best-effort, the training log is not.
 */

export const ESCOBAR_KEY = 'marc.escobar.v1';
export const MAX_CONVERSATIONS = 20;
/** `marc.escobar.v1` on its own. */
export const MAX_STORE_BYTES = 1_000_000;
/** `marc.escobar.v1` + 2 × `marc.state.v1` (state and its backup) + `marc.heart.v1`. */
export const MAX_TOTAL_BYTES = 4_000_000;
/** The room Escobar keeps even when the main state and heart store use the whole total budget. */
export const MIN_STORE_ROOM_BYTES = 250_000;
const STATE_KEY = 'marc.state.v1';
const HEART_KEY = 'marc.heart.v1';

type Storagelike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

/** null = the real localStorage. The gate's mock swaps in a memory store so it never touches the saved key. */
let storageOverride: Storagelike | null = null;
export function setEscobarStorage(s: Storagelike | null): void { storageOverride = s; }
function storage(): Storagelike | null {
  if (storageOverride) return storageOverride;
  try { return typeof localStorage === 'undefined' ? null : localStorage; } catch { return null; }
}

export function memoryStorage(): Storagelike {
  const map = new Map<string, string>();
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); }, removeItem: k => { map.delete(k); } };
}

export function emptyStore(): ConversationStore { return { version: 1, activeId: null, conversations: [] }; }

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function validConversation(v: unknown): v is Conversation {
  return isObj(v) && typeof v.id === 'string' && typeof v.createdAt === 'string' && Array.isArray(v.messages) && Array.isArray(v.ledger);
}

export function loadStore(): ConversationStore {
  const s = storage();
  if (!s) return emptyStore();
  try {
    const raw = s.getItem(ESCOBAR_KEY);
    if (!raw) return emptyStore();
    return sanitizeStore(JSON.parse(raw));
  } catch { return emptyStore(); }
}

/** Repairs a parsed store: drops malformed conversations, strips any inline photo bytes, caps the count. */
export function sanitizeStore(v: unknown): ConversationStore {
  if (!isObj(v) || v.version !== 1 || !Array.isArray(v.conversations)) return emptyStore();
  const conversations = v.conversations.filter(validConversation).map(c => ({
    ...c,
    title: typeof c.title === 'string' ? c.title : '',
    mode: (['chat', 'plan', 'live'] as const).includes(c.mode) ? c.mode : 'chat',
    updatedAt: typeof c.updatedAt === 'string' ? c.updatedAt : c.createdAt,
    messages: c.messages.map(pruneImages),
    protocol: 2 as const,
  }));
  const activeId = typeof v.activeId === 'string' && conversations.some(c => c.id === v.activeId) ? v.activeId : null;
  return capCount({ version: 1, activeId, conversations });
}

/**
 * Photos never go into localStorage (§6.2). A base64 `image` block that slipped
 * into a stored message becomes a text stub; an `image_ref` keeps only its id.
 */
export function pruneImages(m: StoredMessage): StoredMessage {
  if (m.role !== 'user' || !Array.isArray(m.content)) return m;
  let changed = false;
  const content = m.content.map((b): UserBlock => {
    const blk = b as unknown as Record<string, unknown>;
    if (blk.type === 'image') { changed = true; return { type: 'text', text: '[photo shared earlier]' }; }
    if (blk.type === 'image_ref' && ('data' in blk || 'dataUrl' in blk)) {
      changed = true;
      const { data: _d, dataUrl: _u, ...rest } = blk;
      return rest as unknown as UserBlock;
    }
    return b;
  });
  return changed ? { ...m, content } : m;
}

/** Keeps at most 20 conversations: summarised ones leave first, then the oldest. Never the active one. */
function capCount(store: ConversationStore): ConversationStore {
  let conversations = store.conversations;
  while (conversations.length > MAX_CONVERSATIONS) {
    const victim = pickVictim(conversations, store.activeId);
    if (!victim) break;
    conversations = conversations.filter(c => c !== victim);
  }
  return conversations === store.conversations ? store : { ...store, conversations };
}

function pickVictim(conversations: Conversation[], activeId: string | null): Conversation | null {
  const candidates = conversations.filter(c => c.id !== activeId);
  if (!candidates.length) return null;
  const byAge = [...candidates].sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  return byAge.find(c => c.summarisedAt) ?? byAge[0] ?? null;
}

const bytes = (s: string | null): number => (s ? s.length * 2 : 0);

/**
 * Trims the store until it fits both size guards (§6.2), dropping summarised
 * conversations first, then the oldest; the active conversation goes last.
 * `others` is the size already taken by the main state (twice) and the heart store.
 */
export function fitToBudget(store: ConversationStore, others: number): { store: ConversationStore; raw: string } {
  let cur = store;
  let raw = JSON.stringify(cur);
  // QA-R4b-4: a long training history can fill the total budget by itself; Escobar still keeps
  // a small room, so the active conversation (trimmed) survives a restart.
  const room = Math.max(MAX_TOTAL_BYTES - others, MIN_STORE_ROOM_BYTES);
  const fits = (r: string): boolean => bytes(r) <= MAX_STORE_BYTES && bytes(r) <= room;
  while (!fits(raw) && cur.conversations.length) {
    const victim = pickVictim(cur.conversations, cur.activeId);
    if (!victim) {
      // ES-18: the active conversation is never dropped; its oldest half goes instead.
      const active = cur.conversations.find(c => c.id === cur.activeId);
      const shorter = active && trimOldest(active);
      if (!shorter) { cur = { ...cur, conversations: cur.conversations.filter(c => c !== (active ?? cur.conversations[0])), activeId: null }; raw = JSON.stringify(cur); continue; }
      cur = { ...cur, conversations: cur.conversations.map(c => (c === active ? shorter : c)) };
      raw = JSON.stringify(cur);
      continue;
    }
    const conversations = cur.conversations.filter(c => c !== victim);
    cur = { ...cur, conversations, activeId: conversations.some(c => c.id === cur.activeId) ? cur.activeId : null };
    raw = JSON.stringify(cur);
  }
  return { store: cur, raw };
}

const isPlainUser = (m: StoredMessage | undefined): boolean => !!m && m.role === 'user' && !m.meta?.repair && !m.content.some(b => b.type === 'tool_result');

/** Drops messages up to the first plain user message after the midpoint; null when nothing can go. */
export function trimOldest(c: Conversation): Conversation | null {
  let cut = Math.max(1, Math.floor(c.messages.length / 2));
  while (cut < c.messages.length && !isPlainUser(c.messages[cut])) cut++;
  if (cut >= c.messages.length) return null;
  const rs = c.rollingSummary;
  return {
    ...c, messages: c.messages.slice(cut), trimmed: true,
    // The summary still describes what came before; it now starts at the first kept message.
    ...(rs ? { rollingSummary: { text: rs.text, upTo: Math.max(0, rs.upTo - cut) } } : {}),
    // QA-R4b-7: cards follow their message; a card whose message was cut goes with it.
    ...(c.proposals ? { proposals: c.proposals.filter(p => p.messageIndex == null || p.messageIndex >= cut).map(p => (p.messageIndex == null ? p : { ...p, messageIndex: p.messageIndex - cut })) } : {}),
  };
}

/** The photo ids a store's messages point at. */
export function imageIds(store: ConversationStore): Set<string> {
  const ids = new Set<string>();
  for (const c of store.conversations) for (const m of c.messages) {
    if (m.role === 'user' && Array.isArray(m.content)) for (const b of m.content) if (b.type === 'image_ref' && typeof b.id === 'string') ids.add(b.id);
  }
  return ids;
}

/** OBS-PHOTOS (AUD-4): the ids the saved store pointed at that the new one no longer does. */
function prunedImageIds(previousRaw: string | null, next: ConversationStore): string[] {
  if (!previousRaw || !previousRaw.includes('"image_ref"')) return [];
  let before: Set<string>;
  try { before = imageIds(sanitizeStore(JSON.parse(previousRaw))); } catch { return []; }
  const kept = imageIds(next);
  return [...before].filter(id => !kept.has(id));
}

/**
 * Photos of conversations a restore replaced (in memory only, no saved key). A restore keeps them so
 * its Undo can bring them back; the next ordinary save deletes those still unreferenced.
 */
const replacedImages = new Set<string>();

/**
 * Writes the store. Returns the store as actually written (it may have been pruned), or null on failure.
 * Photos of pruned conversations and messages are deleted with them, unless `keepImages` (a restore,
 * whose Undo puts the old conversations back).
 */
export function saveStore(store: ConversationStore, keepImages = false): ConversationStore | null {
  const s = storage();
  if (!s) return null;
  try {
    const clean = capCount({ ...store, conversations: store.conversations.map(c => ({ ...c, messages: c.messages.map(pruneImages) })) });
    const others = storageOverride ? 0 : 2 * bytes(s.getItem(STATE_KEY)) + bytes(s.getItem(HEART_KEY));
    const { store: fitted, raw } = fitToBudget(clean, others);
    const previousRaw = s.getItem(ESCOBAR_KEY);
    const kept = imageIds(fitted);
    let pruned: string[] = [];
    if (keepImages) {
      for (const id of prunedImageIds(previousRaw, fitted)) replacedImages.add(id);
      for (const id of kept) replacedImages.delete(id);
    } else {
      pruned = [...new Set([...prunedImageIds(previousRaw, fitted), ...[...replacedImages].filter(id => !kept.has(id))])];
    }
    s.setItem(ESCOBAR_KEY, raw);
    if (!keepImages) replacedImages.clear();
    if (pruned.length) void import('./images').then(m => m.deleteImages(pruned)).catch(() => {});
    return fitted;
  } catch {
    return null;
  }
}

const replacedListeners = new Set<() => void>();
/** Called after the whole store is cleared or restored, so the session drops what it holds (ES-07). */
export function onStoreReplaced(fn: () => void): () => void {
  replacedListeners.add(fn);
  return () => replacedListeners.delete(fn);
}
function notifyReplaced(): void { for (const fn of replacedListeners) { try { fn(); } catch (e) { console.error(e); } } }

/**
 * QA-R1-9: a reset or restore in another tab. Its tab bumps this key; this tab drops what it
 * holds, so its next save cannot write the old conversations back. A cleared localStorage
 * (the crash screen's reset) or a removed store count too.
 */
export const REPLACED_KEY = 'marc.escobar.v1.replaced';
function markReplaced(): void {
  try { storage()?.setItem(REPLACED_KEY, `${Date.now()}.${Math.random().toString(36).slice(2, 8)}`); } catch { /* best-effort */ }
}
if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
  window.addEventListener('storage', (e: StorageEvent) => {
    if (e.key === null || e.key === REPLACED_KEY || (e.key === ESCOBAR_KEY && e.newValue === null)) notifyReplaced();
  });
}

export function clearStore(): void {
  try { storage()?.removeItem(ESCOBAR_KEY); } catch { /* best-effort */ }
  markReplaced();
  notifyReplaced();
}

export function newConversation(appVersion: string, mode: ConversationMode = 'chat', now = new Date()): Conversation {
  const iso = now.toISOString();
  const rand = Math.random().toString(16).slice(2, 8);
  return { id: `c_${now.getTime().toString(36)}_${rand}`, createdAt: iso, updatedAt: iso, title: '', mode, messages: [], ledger: [], appVersion, protocol: 2 };
}

/**
 * RG-03 (D6): the old single-thread chat (`coach.askThread`) as a text-only conversation.
 * Leading assistant turns go, consecutive same-role turns merge. Null when nothing is usable.
 */
export function legacyConversation(askThread: unknown, appVersion: string, now = new Date()): Conversation | null {
  if (!Array.isArray(askThread)) return null;
  const turns: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  for (const t of askThread as unknown[]) {
    if (!t || typeof t !== 'object') continue;
    const { role, text, content } = t as { role?: unknown; text?: unknown; content?: unknown };
    const body = (typeof text === 'string' ? text : typeof content === 'string' ? content : '').trim();
    if ((role !== 'user' && role !== 'assistant') || !body) continue;
    if (!turns.length && role === 'assistant') continue;
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.text += `\n\n${body}`;
    else turns.push({ role, text: body });
  }
  if (!turns.length) return null;
  const messages: StoredMessage[] = turns.map(t => (t.role === 'user'
    ? { role: 'user', content: [{ type: 'text', text: t.text }] }
    : { role: 'assistant', content: [{ type: 'text', text: t.text }], meta: { rendered: { answer: t.text } } }));
  return { ...newConversation(appVersion, 'chat', now), title: 'Earlier conversation', messages };
}

/** A conversation's title: its first plain user line, without the context tag, 40 characters. */
export function titleFrom(messages: StoredMessage[]): string {
  const u = messages.find(m => m.role === 'user' && !m.meta?.repair && m.content.some(b => b.type === 'text'));
  const t = u && u.role === 'user' ? u.content.find(b => b.type === 'text') : undefined;
  return t && t.type === 'text' ? t.text.replace(/^\[about:[^\]]*\]\s*/, '').replace(/\s+/g, ' ').trim().slice(0, 40) : '';
}

/** Appends messages to one conversation (append-only, §2.8), titling it from the first user line. */
export function appendMessages(store: ConversationStore, conversationId: string, messages: StoredMessage[], now = new Date()): ConversationStore {
  return {
    ...store,
    conversations: store.conversations.map(c => {
      if (c.id !== conversationId) return c;
      return { ...c, title: c.title || titleFrom(messages), messages: [...c.messages, ...messages], updatedAt: now.toISOString() };
    }),
  };
}

export function upsertConversation(store: ConversationStore, c: Conversation, makeActive = true): ConversationStore {
  const exists = store.conversations.some(x => x.id === c.id);
  const conversations = exists ? store.conversations.map(x => (x.id === c.id ? c : x)) : [...store.conversations, c];
  return capCount({ ...store, conversations, activeId: makeActive ? c.id : store.activeId });
}

/** Queues a decision for the next brief (§10.3); the conversation's messages are untouched. */
export function recordDecision(store: ConversationStore, conversationId: string, d: DecisionEvent & { title: string }): ConversationStore {
  return { ...store, conversations: store.conversations.map(c => (c.id === conversationId ? withPendingDecision(c, d) : c)) };
}

/** One conversation with a decision queued for its next brief. */
export function withPendingDecision(c: Conversation, d: DecisionEvent & { title: string }): Conversation {
  return { ...c, pendingDecisions: [...(c.pendingDecisions ?? []), d] };
}

/** The whole store for the Settings backup. */
export function exportAllEscobar(): ConversationStore { return loadStore(); }

/** Restores the store from a backup. Anything malformed is dropped rather than failing the restore. */
export function restoreEscobar(data: unknown): void {
  if (data === undefined || data === null) return;
  saveStore(sanitizeStore(data), true);
  markReplaced();
  notifyReplaced();
}

/**
 * Shapes shared by the Escobar client: stored conversation messages (API-shaped,
 * append-only, §2.8), fact ledger entries (§14) and proposal decisions (§10).
 */

export interface TextBlock { type: 'text'; text: string }

/** A photo kept out of localStorage (§6.2): the bytes live in IndexedDB or memory, keyed by `id`. */
export interface ImageBlockRef {
  type: 'image_ref';
  id: string;
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp';
  /** The model's one-line description, used for the stub once the photo has been sent. */
  description?: string;
  /** Set once the turn carrying the photo has finished; from then on it is always sent as a text stub. */
  sent?: boolean;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  /** JSON text: `{data, facts}` (§14.1) or an error reason. */
  content: string;
  is_error?: boolean;
}

export type UserBlock = TextBlock | ImageBlockRef | ToolResultBlock;

export type ContextRefKind = 'insight' | 'exercise' | 'session' | 'muscle' | 'readiness' | 'week' | 'chart';
export interface ContextRef { kind: ContextRefKind; id: string; label: string }

export interface DecisionEvent {
  proposalId: string;
  decision: 'applied' | 'dismissed' | 'undone' | 'stale' | 'failed';
  at: string;
  result?: string;
}

export interface Usage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number;
  cache_creation_input_tokens?: number;
  /** The cache writes split by TTL (QA2-F7-4: priced at 1.25x or 2x input). */
  cache_creation?: { ephemeral_5m_input_tokens?: number; ephemeral_1h_input_tokens?: number } | null;
}

export interface Fact {
  id: string;
  value: number;
  label: string;
  unit?: string;
  source: { tool: string; input?: unknown };
  turn: number;
}

/** What the app rendered for an assistant step, so reopening a conversation redraws it without replaying tools. */
export interface RenderedTurn {
  /** The verified answer text shown to the person (directives kept). */
  answer?: string;
  /** Muted preamble lines (text before a tool call). */
  preamble?: string[];
  /** Tool activity lines shown while it ran. */
  activity?: Array<{ id: string; name: string; label: string }>;
  /** Offending sentences after a failed repair (§14.3). */
  unverified?: string[];
  /** The answer was replaced by a repaired one. */
  revised?: boolean;
  chips?: string[];
}

export type StoredMessage =
  | { role: 'user'; content: UserBlock[]; meta?: { contextRefs?: ContextRef[]; decision?: DecisionEvent; repair?: boolean } }
  | { role: 'assistant'; content: unknown[]; meta: { usage?: Usage; rendered: RenderedTurn; model?: string } }
  | { role: 'system'; content: string };

export type ConversationMode = 'chat' | 'plan' | 'live';

export interface Conversation {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** The first user line, 40 characters. */
  title: string;
  mode: ConversationMode;
  messages: StoredMessage[];
  ledger: Fact[];
  /** Set when an episode memory was written for it (§17.3). */
  summarisedAt?: string;
  /** Request-side compaction of the oldest half (§11.4). History itself is never edited. */
  rollingSummary?: { text: string; upTo: number };
  /** Proposal decisions not yet reported to the model in a brief (§10.3). */
  pendingDecisions?: Array<DecisionEvent & { title: string }>;
  /** Every proposal made in this conversation and where it stands. */
  proposals?: ProposalRecord[];
  /** The last brief's lines (without fact ids), to send only what changed next turn (§11.2). */
  briefLines?: Record<string, string>;
  /** User turns so far (the brief is sent in full on the first and every 5th). */
  userTurns?: number;
  /** Set when storage limits dropped this conversation's oldest messages (ES-18). */
  trimmed?: boolean;
  appVersion: string;
  protocol: 2;
}

export interface ConversationStore { version: 1; activeId: string | null; conversations: Conversation[] }

export interface ProposalRecord {
  id: string;
  kind: string;
  input: Record<string, unknown>;
  title: string;
  preview: Array<{ label: string; before?: string; after: string }>;
  fingerprint: string;
  createdAt: string;
  expiresOn: string;
  status: 'awaiting' | 'applied' | 'dismissed' | 'stale' | 'undone' | 'failed';
  /** When it was applied: Undo is offered for UNDO_WINDOW_MS after this (ES-03). */
  appliedAt?: string;
  /** The assistant message index that proposed it, so the card renders in its turn. */
  messageIndex?: number;
}

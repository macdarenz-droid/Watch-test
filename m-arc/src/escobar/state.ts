/**
 * Escobar's UI signals (§5): the sheet, the loop's live view, online/quota status, and the
 * built-in proxy URL. The persisted parts live in AppState.escobar and the conversation store.
 */
import { signal } from '@preact/signals';
import type { ContextRef } from './types';
import type { EscobarMode } from './context/modes';
import type { LiveView } from './loop';

/** The owner's marc-coach Worker (§12.9). A Settings edit stores an override in escobar.proxyUrl. */
export const ESCOBAR_PROXY_URL = 'https://marc-coach.mmarcdarenz.workers.dev';

export interface EscobarUi {
  open: boolean;
  detent: 'half' | 'full';
  mode: EscobarMode;
  /** A pending "Ask about this" reference for the next message. */
  contextRef: ContextRef | null;
  /** Prefilled composer text (from a chip or a dock prompt). */
  draft: string;
}
export const escobarUi = signal<EscobarUi>({ open: false, detent: 'half', mode: 'chat', contextRef: null, draft: '' });

/** I19: true from the moment the sheet is asked to open until its lazy chunk has actually
 * loaded — the Dock button uses this to show a spinner instead of vanishing into a blank gap. */
export const escobarLoading = signal(false);

/**
 * I7: the sheet's exit animation (slide + scrim fade) lives inside EscobarSheet.tsx, a lazy chunk
 * fetched only once Escobar first opens — but native/back.ts (the hardware Back button) is always
 * loaded, so it needs a way to reach that animation without pulling the whole chunk into the main
 * bundle. EscobarSheet registers itself here on mount; every close path (X, backdrop, menu,
 * onCancel, Back) calls requestEscobarClose() instead of writing `open: false` directly. Never
 * unregistered (not needed: `open` is only ever true while it's registered, in real use), but
 * defensively falls back to an instant close so a caller with no mounted sheet can't get stuck.
 */
let escobarCloseRequest: (() => void) | null = null;
export function registerEscobarClose(fn: () => void): void { escobarCloseRequest = fn; }
export function unregisterEscobarClose(): void { escobarCloseRequest = null; }
export function requestEscobarClose(): void {
  if (escobarCloseRequest) escobarCloseRequest();
  else escobarUi.value = { ...escobarUi.value, open: false, contextRef: null };
}

export const loopView = signal<LiveView>({ status: 'idle', text: '', preamble: [], activity: [], outcomes: [] });
/** null = not checked yet. False for 60 s after a transport failure (§13). */
export const online = signal<boolean | null>(null);
/** QA-R4a-7: why the last health check failed ("Escobar isn't set up yet."), shown with the offline notice. */
export const offlineReason = signal<string | null>(null);
export const quotaResetAt = signal<number | null>(null);

/**
 * Per-model prices, $ per million tokens, for the rough cost estimate in Settings (§21). Cache
 * writes cost 1.25x input (5-minute) or 2x input (1-hour) on every model.
 */
export const PRICES: Record<string, { input: number; output: number; cacheRead: number }> = {
  'claude-opus-5': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-opus-5-5': { input: 4, output: 20, cacheRead: 0.2 },
  'claude-opus-4-8': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-sonnet-5': { input: 2, output: 10, cacheRead: 0.2 },
  'claude-fable-5-1': { input: 10, output: 50, cacheRead: 0.25 },
  'claude-fable-5': { input: 10, output: 50, cacheRead: 1 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheRead: 0.1 },
  // QA2-F7-1: the rest of the models the API serves.
  'claude-mythos-5-1': { input: 10, output: 50, cacheRead: 0.25 },
  'claude-mythos-5': { input: 10, output: 50, cacheRead: 1 },
  'claude-opus-4-7': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-opus-4-6': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-opus-4-5': { input: 5, output: 25, cacheRead: 0.5 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheRead: 0.3 },
  'claude-sonnet-4-5': { input: 3, output: 15, cacheRead: 0.3 },
};
// F7: checked against platform.claude.com/docs/en/about-claude/pricing on 2026-09-23 (QA2-F7-1 additions: 2026-09-24).
/** QA2-F7-1: an id missing from the table is priced at the dearest rates, so the estimate never reads below the bill. */
const UNKNOWN_PRICE = { input: 10, output: 50, cacheRead: 1 };

/**
 * An exact id, or a dated id (alias-YYYYMMDD, e.g. claude-haiku-4-5-20251001), uses that alias's price.
 * Any other id is unknown, so a newer minor version (claude-sonnet-5-5) is never priced as its prefix.
 */
function priceFor(model: string): { input: number; output: number; cacheRead: number } {
  const key = Object.keys(PRICES).find(k => model === k || (model.startsWith(`${k}-`) && /^\d{8}$/.test(model.slice(k.length + 1))));
  return key ? PRICES[key]! : UNKNOWN_PRICE;
}

/** QA2-F7-4: `cacheWrite5mTokens` / `cacheWrite1hTokens` are the step's prompt-cache writes by TTL. */
export function estimateCost(u: { inputTokens: number; outputTokens: number; cacheReadTokens: number; cacheWrite5mTokens?: number; cacheWrite1hTokens?: number }, model = 'claude-opus-5'): number {
  const p = priceFor(model);
  const writes = (u.cacheWrite5mTokens ?? 0) * p.input * 1.25 + (u.cacheWrite1hTokens ?? 0) * p.input * 2;
  return (u.inputTokens * p.input + u.outputTokens * p.output + u.cacheReadTokens * p.cacheRead + writes) / 1_000_000;
}

export function proxyUrlOf(proxyUrl: string | null): string { return proxyUrl || ESCOBAR_PROXY_URL; }

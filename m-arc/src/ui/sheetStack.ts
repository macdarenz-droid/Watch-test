/**
 * Open sheets, top last (R5.3). The Android back button and the browser's back both close the
 * top one. On the web each sheet also owns a history entry, so Back closes it instead of
 * leaving the app; closing it from the UI takes that entry back off.
 */
import { computed, signal } from '@preact/signals';
import { isNative } from '@/native/capacitor';

interface Entry { id: string; close: () => void; requestClose: () => void; pushed: boolean; popped: boolean; closing: boolean }
export const sheetStack = signal<Entry[]>([]);
export const openSheetCount = computed(() => sheetStack.value.length);

const hasHistory = (): boolean => typeof history !== 'undefined' && typeof window !== 'undefined' && !isNative();
const stateSheet = (): string | undefined => { try { return (history.state as { sheet?: string } | null)?.sheet; } catch { return undefined; } };

/** popstate events we caused ourselves (history.back / go(-n)) and are not a user's Back. */
let ignorePops = 0;
let afterUnwind: (() => void) | null = null;

/**
 * `close` unmounts instantly (used by closeAllSheets, a programmatic close-everything from
 * router navigation). `requestClose` runs the sheet's own exit animation first (I6); it defaults
 * to `close` for a caller that has none. Real Back presses (closeTopSheet) always go through it.
 */
export function registerSheet(id: string, close: () => void, requestClose: () => void = close): void {
  const e: Entry = { id, close, requestClose, pushed: false, popped: false, closing: false };
  if (hasHistory()) { try { history.pushState({ sheet: id }, ''); e.pushed = true; } catch { /* sandboxed */ } }
  sheetStack.value = [...sheetStack.value, e];
}

/** I6: marks a sheet as mid-exit so closeTopSheet (a second Back during its animation) reaches
 * the sheet below instead of re-triggering this one's own close. */
export function markClosing(id: string): void {
  const e = sheetStack.value.find(x => x.id === id);
  if (e) e.closing = true;
}

export function unregisterSheet(id: string): void {
  const e = sheetStack.value.find(x => x.id === id);
  if (!e) return;
  sheetStack.value = sheetStack.value.filter(x => x !== e);
  // Closed from the UI: take its history entry back off, but only if it is still on top.
  if (e.pushed && !e.popped && stateSheet() === id) { ignorePops++; try { history.back(); } catch { ignorePops--; } }
}

/** Closes the top (not already exiting) sheet. True when there was one. */
export function closeTopSheet(fromPop = false): boolean {
  const stack = sheetStack.value;
  let top: Entry | undefined;
  for (let i = stack.length - 1; i >= 0; i--) { if (!stack[i]!.closing) { top = stack[i]; break; } }
  if (!top) return false;
  if (fromPop) top.popped = true;
  top.requestClose();
  return true;
}

/** Closes every sheet and removes their history entries, then runs `then` (router `go`). */
export function closeAllSheets(then: () => void): void {
  const all = [...sheetStack.value].reverse();
  const pushed = all.filter(e => e.pushed && !e.popped).length;
  for (const e of all) { e.popped = true; e.close(); }
  // QA11-1: history.go(-n) is one navigation, and real Chromium/WebView fires exactly one
  // popstate for it regardless of n — not one per entry it traverses. ignorePops must only ever
  // count "one navigation we caused", or it overcounts, never reaches 0, and afterUnwind (and
  // anything awaiting this, like goTo()) hangs forever; the next real Back is then swallowed too.
  if (pushed > 0 && hasHistory() && stateSheet()) { ignorePops += 1; afterUnwind = then; try { history.go(-pushed); return; } catch { ignorePops -= 1; afterUnwind = null; } }
  then();
}

if (typeof window !== 'undefined') {
  window.addEventListener('popstate', () => {
    if (ignorePops > 0) {
      ignorePops--;
      if (ignorePops === 0 && afterUnwind) { const f = afterUnwind; afterUnwind = null; f(); }
      return;
    }
    closeTopSheet(true);
  });
}

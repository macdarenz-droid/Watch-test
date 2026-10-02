import { signal } from '@preact/signals';
import { state } from '@/core/store';
import { findExercise } from '@/core/exercises';
import { isMuscleId } from '@/data/muscles';
import { closeAllSheets, sheetStack } from '@/ui/sheetStack';
import { reduced } from '@/ui/motion';

export type Tab = 'today' | 'train' | 'history' | 'body' | 'coach';
export const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'train', label: 'Train' },
  { id: 'history', label: 'History' },
  { id: 'body', label: 'Body' },
  { id: 'coach', label: 'Escobar' },
];

function initial(): Tab {
  const h = typeof location === 'undefined' ? '' : location.hash.replace('#', '');
  return TABS.some(t => t.id === h) ? (h as Tab) : 'today';
}

export const tab = signal<Tab>(initial());

/**
 * Sheets that Escobar (and anything else) can open by id (§7.2). Local sheet state was
 * lifted here so a palace target can open, e.g., the muscle sheet for quads.
 */
export type PanelId =
  | 'settings' | 'profile' | 'watch' | 'goal' | 'schedule' | 'checkin' | 'muscle'
  | 'exercise-stats' | 'session' | 'weekly-review' | 'memory';
export const PANEL_IDS: PanelId[] = ['settings', 'profile', 'watch', 'goal', 'schedule', 'checkin', 'muscle', 'exercise-stats', 'session', 'weekly-review', 'memory'];
export interface OpenPanel { id: PanelId; params?: Record<string, string> }
export const openPanel = signal<OpenPanel | null>(null);

export const BODY_VIEWS = ['recovery', 'levels', 'week'] as const;
export const HISTORY_SEGS = ['log', 'stats'] as const;
/** The param each panel cannot open without. */
const REQUIRED: Partial<Record<PanelId, string>> = { muscle: 'muscle', session: 'sessionId', 'exercise-stats': 'exerciseId' };

/** Drops panel params that point at nothing (a made-up muscle, a deleted session), so no sheet renders from them. */
export function validatePanelParams(_panel: PanelId, params: Record<string, string> | undefined): Record<string, string> | undefined {
  if (!params) return params;
  const s = state.value;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (typeof v !== 'string') continue;
    if (k === 'muscle' && !isMuscleId(v)) continue;
    if (k === 'sessionId' && !s.sessions.some(x => x.id === v)) continue;
    // QA-R1-6: an id that is in the person's history counts even if the library no longer has it.
    if (k === 'exerciseId' && findExercise(v, s.customExercises)?.id !== v && !s.sessions.some(x => x.exercises.some(e => e.exerciseId === v))) continue;
    if (k === 'view' && !(BODY_VIEWS as readonly string[]).includes(v)) continue;
    if (k === 'seg' && !(HISTORY_SEGS as readonly string[]).includes(v)) continue;
    out[k] = v;
  }
  return out;
}

export function showPanel(id: PanelId, params?: Record<string, string>): void {
  const valid = validatePanelParams(id, params);
  const need = REQUIRED[id];
  if (need && !valid?.[need]) return;
  openPanel.value = valid && Object.keys(valid).length ? { id, params: valid } : { id };
}
export function closePanel(id?: PanelId): void {
  if (!id || openPanel.value?.id === id) openPanel.value = null;
}

/** A read/write alias onto `openPanel`, so older callers keep `settingsOpen.value = true`. */
function panelFlag(id: PanelId) {
  return {
    get value(): boolean { return openPanel.value?.id === id; },
    set value(v: boolean) { if (v) showPanel(id); else closePanel(id); },
  };
}
export const settingsOpen = panelFlag('settings');
export const profileOpen = panelFlag('profile');

/** Per-tab view choices a palace target can set (Body's map view, History's segment). */
export type BodyView = 'recovery' | 'levels' | 'week';
export const bodyView = signal<BodyView>('recovery');
export const historySeg = signal<'log' | 'stats'>('log');

/** I9: each tab keeps its own scroll position, restored when you switch back to it. */
const scrollMemo = new Map<Tab, number>();

/** Pure decision for a nav tap, split out so it can be unit-tested without a DOM: the current tab
 * re-tapped scrolls to top; any other tab remembers where you left off and restores it. */
export function navTapTarget(current: Tab, t: Tab, scrollY: number): { top: boolean; y: number } {
  if (t === current) return { top: true, y: 0 };
  scrollMemo.set(current, scrollY);
  return { top: false, y: scrollMemo.get(t) ?? 0 };
}

/** The bottom nav's own tap handler (App.tsx) — everything else still calls `go()` directly and
 * always lands at the top (palace navigation, a notification tap, Back, Today's own links). */
export function navTap(t: Tab): void {
  const hasWindow = typeof window !== 'undefined';
  const { top, y } = navTapTarget(tab.value, t, hasWindow ? window.scrollY : 0);
  if (top) {
    if (hasWindow) window.scrollTo({ top: 0, behavior: reduced() ? 'auto' : 'smooth' });
    return;
  }
  go(t);
  if (hasWindow) requestAnimationFrame(() => window.scrollTo(0, y));
}

export function go(t: Tab): void {
  // R5.3: a sheet owns the current history entry; unwind those first so replaceState below
  // does not overwrite one.
  if (sheetStack.peek().length && (() => { try { return !!(history.state as { sheet?: string } | null)?.sheet; } catch { return false; } })()) {
    closeAllSheets(() => go(t));
    return;
  }
  if (tab.value !== t) openPanel.value = null;
  tab.value = t;
  try { history.replaceState(null, '', `#${t}`); } catch { /* ignore */ }
  try { window.scrollTo({ top: 0 }); } catch { /* ignore */ }
}

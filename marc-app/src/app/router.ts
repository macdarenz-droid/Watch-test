import { signal } from '@preact/signals';

export type Tab = 'today' | 'train' | 'history' | 'body' | 'coach';
export const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'train', label: 'Train' },
  { id: 'history', label: 'History' },
  { id: 'body', label: 'Body' },
  { id: 'coach', label: 'Coach' },
];

function initial(): Tab {
  const h = location.hash.replace('#', '');
  return TABS.some(t => t.id === h) ? (h as Tab) : 'today';
}

export const tab = signal<Tab>(initial());
export const settingsOpen = signal(false);

export function go(t: Tab): void {
  tab.value = t;
  try { history.replaceState(null, '', `#${t}`); } catch { /* ignore */ }
  window.scrollTo({ top: 0 });
}

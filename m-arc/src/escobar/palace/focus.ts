/**
 * Screen awareness (§7.4): each screen and panel says what it is while it's shown,
 * so "why is this dropping?" resolves to what the person is looking at.
 */
import { computed, signal } from '@preact/signals';
import { useEffect } from 'preact/hooks';

export interface Focus { id: string; details?: Record<string, string | number> }

const stack = signal<Array<Focus & { key: number }>>([]);
let seq = 0;

/** The top of the focus stack: the innermost screen or panel on show. */
export const currentFocus = computed<Focus | null>(() => {
  const top = stack.value[stack.value.length - 1];
  return top ? { id: top.id, ...(top.details ? { details: top.details } : {}) } : null;
});

export function pushFocus(f: Focus): () => void {
  const key = ++seq;
  stack.value = [...stack.value, { ...f, key }];
  return () => { stack.value = stack.value.filter(x => x.key !== key); };
}

export function usePalaceFocus(id: string, details?: Record<string, string | number>): void {
  const dep = details ? JSON.stringify(details) : '';
  useEffect(() => pushFocus({ id, ...(details ? { details } : {}) }), [id, dep]);
}

/** 7.5: when to show the one-time "Send anonymous error reports?" ask. */
import { computed } from '@preact/signals';
import { bootSource, state } from '@/core/store';

/** `bootedFromSave`: true once this boot loaded a normal previously-saved state, as opposed to
 * a brand-new install or a same-session legacy import — so a fresh import (this app's install,
 * or the previous single-file app's) never shows the ask before the user has even seen Today;
 * it waits for the next ordinary open, which is also "after the update" for an existing user. */
export function shouldAskErrorReports(asked: boolean | undefined, sessionCount: number, hasActiveSession: boolean, bootedFromSave: boolean): boolean {
  if (asked) return false;
  if (hasActiveSession) return false;
  if (!bootedFromSave) return false;
  return sessionCount > 0;
}

export const errorReportsAskTrigger = computed(() => shouldAskErrorReports(state.value.preferences.errorReportsAsked, state.value.sessions.length, !!state.value.active, bootSource.value === 'saved'));

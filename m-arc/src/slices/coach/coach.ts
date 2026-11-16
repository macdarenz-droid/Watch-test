import { state, update } from '@/core/store';
import { todayKey, addDays } from '@/core/dates';
import type { InsightFeedback } from '@/core/models';
import { showToast } from '@/app/toast';
import { feedbackHides } from '@/brain/coach/rules';
import { refreshClock } from '@/app/clock';
import { chainedStartDay } from '@/brain/deload';
import { DELOAD_DAYS, DELOAD_LOAD_FACTOR, DELOAD_SET_FACTOR } from '@/data/deload';

/** COACH-FB: keep the last record per (id, day), in their original order. Clears duplicates older builds saved. */
function oncePerDay(list: InsightFeedback[]): InsightFeedback[] {
  const last = new Map<string, number>();
  list.forEach((f, i) => last.set(`${f.id}|${f.day}`, i));
  return list.filter((f, i) => last.get(`${f.id}|${f.day}`) === i);
}

/** F3.6 + COACH-FB: one record per (insight id, day); a second tap replaces the first (the new verdict wins) and moves it to the end. "Helpful" hides the note for the rest of today, "snoozed" for 7 days (coachInsights filters both). Newest last, capped at 200 (matches AppState.insightFeedback's own cap). */
export function saveInsightFeedback(id: string, verdict: InsightFeedback['verdict']): void {
  refreshClock(); // (review) the board filters on the `today` signal, which can lag todayKey() by up to 60 s after midnight
  const day = todayKey();
  update(s => ({ ...s, insightFeedback: [...oncePerDay(s.insightFeedback).filter(f => !(f.id === id && f.day === day)), { id, day, verdict }].slice(-200) }));
}

/** COACH-FB: the one path for Helpful / Not now, from the Escobar tab and from chat (snooze_insight). Saves, then toasts with an Undo that puts back only this (id, day) record as it was, so later taps survive. */
export function giveInsightFeedback(id: string, verdict: InsightFeedback['verdict']): void {
  const day = todayKey();
  const prev = [...state.value.insightFeedback].reverse().find(f => f.id === id && f.day === day) ?? null;
  saveInsightFeedback(id, verdict);
  showToast(verdict === 'snoozed' ? 'Snoozed for 7 days' : 'Marked helpful', 'Undo', () => update(s => ({
    ...s, insightFeedback: [...s.insightFeedback.filter(f => !(f.id === id && f.day === day)), ...(prev ? [prev] : [])],
  })));
}

/** COACH-FB: a second card tap within this window is ignored, so a quick double tap cannot hide the next card that slides into the same spot. */
export const FEEDBACK_TAP_GAP_MS = 500;
let lastTapAt = -Infinity;
/** COACH-FB: a card button tap. Returns false when ignored as a double tap. */
export function feedbackTap(id: string, verdict: InsightFeedback['verdict'], now = Date.now()): boolean {
  if (now - lastTapAt < FEEDBACK_TAP_GAP_MS) return false;
  lastTapAt = now;
  giveInsightFeedback(id, verdict);
  return true;
}

/** COACH-FB: "Show again" on a hidden note: remove only the records that hide it today. */
export function restoreInsight(id: string): void {
  refreshClock();
  const day = todayKey();
  update(s => ({ ...s, insightFeedback: s.insightFeedback.filter(f => !(f.id === id && feedbackHides(f, day))) }));
}

/** F3.3: accept the coach's "take a lighter week" offer. Reads as active for 7 days from today; closes itself once endDay passes (deloadOffer/suggestNext both gate on it, no separate cleanup needed). */
export function acceptDeload(reason: string): void {
  const day = todayKey();
  // BUG-15: back-to-back lighter weeks keep the original pre-week base (chainedStartDay).
  update(s => ({ ...s, deload: { startDay: chainedStartDay(s.deload, s.sessions, day), endDay: addDays(day, DELOAD_DAYS - 1), reason, setFactor: DELOAD_SET_FACTOR, loadFactor: DELOAD_LOAD_FACTOR } }));
}

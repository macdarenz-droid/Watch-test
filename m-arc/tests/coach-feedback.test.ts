// COACH-FB: Helpful / Not now hide a note at once, one record per (id, day), a toast with a
// targeted Undo on both the card and the chat path, and a hidden-notes list instead of the raw log.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as rules from '@/brain/coach/rules';
import { coachInsights, type Insight } from '@/brain/coach/rules';
import { emptySchedule, type InsightFeedback } from '@/core/models';
import { baseCoachExtras } from './helpers';

const baseCtx = { sessions: [], splits: [], schedule: emptySchedule(), custom: [], today: '2026-09-18', now: new Date('2026-09-18T12:00:00Z').getTime(), ...baseCoachExtras };
const profileHistory = [{ at: '2026-09-17T08:00:00Z', field: 'bodyWeightKg' as const, from: 80, to: 78, source: 'user' as const }];
const note = (id: string, priority: number, extra: Partial<Insight> = {}): Insight => ({ id, category: 'focus', priority, title: `T ${id}`, noticed: '', means: '', action: '', ...extra });

describe('COACH-FB: Helpful hides a note for the rest of the day (pure rules)', () => {
  it('CFB-1 an insight marked helpful today is hidden today and back tomorrow', () => {
    const insight = coachInsights({ ...baseCtx, profileHistory })[0]!;
    const fb: InsightFeedback[] = [{ id: insight.id, day: '2026-09-18', verdict: 'helpful' }];
    expect(coachInsights({ ...baseCtx, profileHistory, feedback: fb }).some(i => i.id === insight.id)).toBe(false);
    const tomorrow = { ...baseCtx, today: '2026-09-19', now: new Date('2026-09-19T12:00:00Z').getTime() };
    expect(coachInsights({ ...tomorrow, profileHistory }).some(i => i.id === insight.id)).toBe(true);
    expect(coachInsights({ ...tomorrow, profileHistory, feedback: fb }).some(i => i.id === insight.id)).toBe(true);
  });

  it('CFB-2 hiddenInsightIds: snooze 7 days, helpful same day only, snooze outranks helpful, duplicates collapse', () => {
    const fb: InsightFeedback[] = [
      { id: 'a', day: '2026-09-18', verdict: 'helpful' },
      { id: 'a', day: '2026-09-18', verdict: 'helpful' },
      { id: 'b', day: '2026-09-17', verdict: 'helpful' },
      { id: 'c', day: '2026-09-12', verdict: 'snoozed' },
      { id: 'd', day: '2026-09-11', verdict: 'snoozed' },
      { id: 'e', day: '2026-09-15', verdict: 'snoozed' },
      { id: 'e', day: '2026-09-18', verdict: 'helpful' },
    ];
    const m = rules.hiddenInsightIds(fb, '2026-09-18');
    expect([...m.keys()].sort()).toEqual(['a', 'c', 'e']);
    expect(m.get('a')).toEqual({ verdict: 'helpful', day: '2026-09-18' });
    expect(m.get('c')).toEqual({ verdict: 'snoozed', day: '2026-09-12' });
    expect(m.get('e')).toEqual({ verdict: 'snoozed', day: '2026-09-15' });
  });

  it('CFB-3 hiddenBackOnBoard lists only hidden notes that would be back in the top 3 (not ones that stopped firing), and never mutates the shared list', () => {
    const list = [note('n10', 10), note('n50', 50), note('n40', 40), note('n30', 30), note('n20', 20)];
    const order = list.map(i => i.id);
    const hidden = new Map([['n50', { verdict: 'snoozed' as const, day: '2026-09-18' }], ['n10', { verdict: 'helpful' as const, day: '2026-09-18' }], ['gone', { verdict: 'snoozed' as const, day: '2026-09-18' }]]);
    expect(rules.rankInsights(list, hidden, 3).map(i => i.id)).toEqual(['n40', 'n30', 'n20']);
    expect(rules.hiddenBackOnBoard(list, hidden, 3).map(h => [h.insight.id, h.verdict])).toEqual([['n50', 'snoozed']]);
    expect(list.map(i => i.id)).toEqual(order);
  });
});

describe('COACH-FB: store paths', () => {
  const local = (y: number, m: number, d: number, h: number, mi: number): Date => new Date(y, m - 1, d, h, mi);
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(local(2026, 9, 18, 12, 0)); vi.resetModules(); });
  afterEach(() => { vi.useRealTimers(); });

  async function boot(insightFeedback: InsightFeedback[] = []) {
    const store = await import('@/core/store');
    const { freshState } = await import('@/core/models');
    store.replaceState({ ...freshState(), profileHistory, insightFeedback });
    return { store, coach: await import('@/slices/coach/coach'), toast: await import('@/app/toast'), sel: await import('@/app/selectors') };
  }

  it('CFB-4 saveInsightFeedback keeps one record per (id, day); a changed verdict wins; old duplicates are compacted', async () => {
    const { store, coach } = await boot([
      { id: 'old', day: '2026-09-10', verdict: 'helpful' },
      { id: 'old', day: '2026-09-10', verdict: 'helpful' },
      { id: 'old', day: '2026-09-10', verdict: 'helpful' },
    ]);
    coach.saveInsightFeedback('x', 'helpful');
    coach.saveInsightFeedback('x', 'helpful');
    coach.saveInsightFeedback('x', 'snoozed');
    coach.saveInsightFeedback('y', 'helpful');
    expect(store.state.value.insightFeedback).toEqual([
      { id: 'old', day: '2026-09-10', verdict: 'helpful' },
      { id: 'x', day: '2026-09-18', verdict: 'snoozed' },
      { id: 'y', day: '2026-09-18', verdict: 'helpful' },
    ]);
  });

  it('CFB-5 giveInsightFeedback toasts like the chat path and its Undo puts back only what that tap changed', async () => {
    const { store, coach, toast } = await boot([{ id: 'a', day: '2026-09-18', verdict: 'helpful' }]);
    coach.giveInsightFeedback('a', 'snoozed');
    expect(toast.toast.value?.message).toBe('Snoozed for 7 days');
    expect(toast.toast.value?.action).toBe('Undo');
    const undo = toast.toast.value!.onAction!;
    coach.saveInsightFeedback('b', 'helpful');
    undo();
    expect(store.state.value.insightFeedback).toEqual([
      { id: 'b', day: '2026-09-18', verdict: 'helpful' },
      { id: 'a', day: '2026-09-18', verdict: 'helpful' },
    ]);
    coach.giveInsightFeedback('c', 'helpful');
    expect(toast.toast.value?.message).toBe('Marked helpful');
    toast.toast.value!.onAction!();
    expect(store.state.value.insightFeedback.some(f => f.id === 'c')).toBe(false);
  });

  it('CFB-6 the chat snooze_insight effect uses the same helper (targeted Undo)', async () => {
    const { store, coach, toast } = await boot();
    const session = await import('@/escobar/session');
    session.applyEffect({ type: 'snooze', insightId: 'a', verdict: 'snoozed' });
    expect(toast.toast.value?.message).toBe('Snoozed for 7 days');
    const undo = toast.toast.value!.onAction!;
    coach.saveInsightFeedback('b', 'snoozed');
    undo();
    expect(store.state.value.insightFeedback).toEqual([{ id: 'b', day: '2026-09-18', verdict: 'snoozed' }]);
  });

  it('CFB-7 feedbackTap ignores a second tap within 500 ms, then accepts again', async () => {
    const { store, coach } = await boot();
    const t0 = Date.now();
    expect(coach.feedbackTap('a', 'snoozed', t0)).toBe(true);
    expect(coach.feedbackTap('b', 'snoozed', t0 + 150)).toBe(false);
    expect(coach.feedbackTap('b', 'snoozed', t0 + 600)).toBe(true);
    expect(store.state.value.insightFeedback.map(f => f.id)).toEqual(['a', 'b']);
  });

  it('CFB-8 restoreInsight removes only the records hiding that note today', async () => {
    const { store, coach } = await boot([
      { id: 'a', day: '2026-09-01', verdict: 'snoozed' },
      { id: 'a', day: '2026-09-15', verdict: 'snoozed' },
      { id: 'b', day: '2026-09-18', verdict: 'helpful' },
    ]);
    coach.restoreInsight('a');
    expect(store.state.value.insightFeedback).toEqual([
      { id: 'a', day: '2026-09-01', verdict: 'snoozed' },
      { id: 'b', day: '2026-09-18', verdict: 'helpful' },
    ]);
  });

  it('CFB-9 insights and hiddenInsights update in the same tick as the tap, and Show again brings the note back', async () => {
    const { coach, sel } = await boot();
    const first = sel.insights.value[0]!;
    coach.giveInsightFeedback(first.id, 'helpful');
    expect(sel.insights.value.some(i => i.id === first.id)).toBe(false);
    expect(sel.hiddenInsights.value.map(h => [h.insight.title, h.verdict])).toEqual([[first.title, 'helpful']]);
    coach.restoreInsight(first.id);
    expect(sel.insights.value.some(i => i.id === first.id)).toBe(true);
    expect(sel.hiddenInsights.value).toEqual([]);
  });

  it('CFB-10 a tap just after midnight, before the minute timer runs, still hides the note (the board and the record use the same day)', async () => {
    vi.setSystemTime(local(2026, 9, 18, 23, 59));
    const { store, coach, sel } = await boot();
    const first = sel.insights.value[0]!;
    vi.setSystemTime(local(2026, 9, 19, 0, 0));
    coach.giveInsightFeedback(first.id, 'helpful');
    expect(store.state.value.insightFeedback).toEqual([{ id: first.id, day: '2026-09-19', verdict: 'helpful' }]);
    expect(sel.insights.value.some(i => i.id === first.id)).toBe(false);
    expect(sel.hiddenInsights.value.map(h => h.insight.id)).toEqual([first.id]);
  });
});

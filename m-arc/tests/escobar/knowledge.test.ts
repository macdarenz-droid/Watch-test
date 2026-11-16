import { describe, it, expect } from 'vitest';
import { KNOWLEDGE, searchCards, lookupKnowledge, CARD_BY_ID } from '@/escobar/knowledge/cards';
import { explainMethod, METHOD_INDEX } from '@/escobar/knowledge/methods';
import { METHOD_IDS } from '@/escobar/knowledge/methodIds';
import { PALACE } from '@/escobar/palace/registry';
import { ctxOf, sixMonthsState, emptyState } from './fixtures';
import { READINESS_CALIBRATING_DAYS, READINESS_GREEN_AT, READINESS_RED_AT, READINESS_WEIGHTS } from '@/brain/readiness';
import { E1RM_MAX_REPS, EPLEY_DIVISOR, RIR_BY_EFFORT, effectiveOneRm } from '@/brain/e1rm';
import { BIAS_CAP_REPS, BIAS_MIN_OBSERVATIONS } from '@/brain/effortBias';
import { DELOAD_TRIGGER } from '@/brain/deload';
import { MAX_INCREASE_SHARE, RECOVERY_HOLD_PCT, REENTRY_DAYS } from '@/brain/progression';
import { WARMUP_PCTS } from '@/brain/coach/pre';
import { E1RM_MIN_SESSIONS, PLATEAU_FLAT_TOTAL, PLATEAU_HIGH_SESSIONS, PLATEAU_MIN_SESSIONS, PLATEAU_MIN_SPAN_DAYS, PLATEAU_WINDOW, PLATEAU_WINDOW_DAYS } from '@/brain/trend';

describe('knowledge cards (§16.1)', () => {
  it('has at least 45 well-formed cards with sources', () => {
    expect(KNOWLEDGE.length).toBeGreaterThanOrEqual(45);
    expect(new Set(KNOWLEDGE.map(c => c.id)).size).toBe(KNOWLEDGE.length);
    for (const c of KNOWLEDGE) {
      expect(c.statement.length, c.id).toBeLessThanOrEqual(300);
      expect(c.sources.length, c.id).toBeGreaterThan(0);
      expect(c.sources.every(s => s.year > 1980 && s.year <= 2026), c.id).toBe(true);
      expect(['strong', 'moderate', 'emerging', 'debated']).toContain(c.rating);
      expect(c.tags.length, c.id).toBeGreaterThan(0);
      for (const n of c.numbers) expect(Number.isFinite(n.value), c.id).toBe(true);
    }
  });
  it('covers the §16.1 seed topics, including units_and_plates', () => {
    for (const id of ['progressive_overload', 'protein_intake', 'sleep_duration', 'creatine', 'pain_red_flags', 'menstrual_cycle', 'units_and_plates', 'bmi_limits', 'hr_zones', 'youth_training']) expect(CARD_BY_ID[id], id).toBeTruthy();
    expect(CARD_BY_ID.menstrual_cycle!.rating).toBe('debated');
  });
  it('card numbers appear in their statements', () => {
    for (const c of KNOWLEDGE) for (const n of c.numbers) expect(c.statement.replace(/,(\d{3})/g, '$1'), `${c.id} ${n.label}`).toContain(String(n.value));
  });
  it('search ranks the obvious card first', () => {
    expect(searchCards('how much protein should I eat')[0]!.id).toBe('protein_intake');
    expect(searchCards('how many hours of sleep')[0]!.id).toBe('sleep_duration');
    // ES-31: tags match whole words ('cut' is not in 'cutlery', 'age' not in 'garages').
    expect(searchCards('cutlery garages')).toEqual([]);
    expect(searchCards('is creatine worth it')[0]!.id).toBe('creatine');
    expect(searchCards('plates on the bar in pounds')[0]!.id).toBe('units_and_plates');
    expect(searchCards('')).toEqual([]);
  });
  it('lookup by id wins over the query and returns at most 4 without tags', () => {
    const r = lookupKnowledge({ ids: ['creatine'], query: 'protein' });
    expect(r.cards.map(c => c.id)).toEqual(['creatine']);
    expect('tags' in r.cards[0]!).toBe(false);
    expect(lookupKnowledge({ query: 'recovery sleep protein training' }).cards.length).toBeLessThanOrEqual(4);
  });
});

describe('explain_method (§16.2)', () => {
  const six = ctxOf(sixMonthsState());
  it.each(METHOD_IDS)('%s has a summary under 600 chars, inputs, constants and personal values', topic => {
    const m = explainMethod(topic, six);
    expect(m.summary.length).toBeGreaterThan(40);
    expect(m.summary.length).toBeLessThanOrEqual(700);
    expect(m.inputs.length).toBeGreaterThan(0);
    expect(typeof m.personal).toBe('object');
    if (topic !== 'energy') expect(Object.keys(m.constants).length, topic).toBeGreaterThan(0);
    for (const v of Object.values(m.constants)) expect(Number.isFinite(v)).toBe(true);
  });
  it('every method is referenced by a palace entry and indexed', () => {
    for (const id of METHOD_IDS) {
      expect(PALACE.some(p => p.methods?.includes(id)), id).toBe(true);
      expect(METHOD_INDEX[id].length).toBeGreaterThan(0);
    }
  });
  it('personal values come from the person', () => {
    expect(explainMethod('hr_zones', six).personal.hrMaxSource).toBe('tanaka');
    expect(explainMethod('progression', six).personal.goal).toBe('Lean muscle');
    expect(explainMethod('recovery', ctxOf(emptyState())).personal.trainingAgeMonths).toBe('unknown');
  });
  it('states the same constants the brain runs on (ES-32)', () => {
    const c = (t: Parameters<typeof explainMethod>[0]) => explainMethod(t, six).constants;
    expect(c('readiness')).toMatchObject({ greenAt: READINESS_GREEN_AT, redAt: READINESS_RED_AT, calibratingDays: READINESS_CALIBRATING_DAYS, weight_checkIn: READINESS_WEIGHTS.checkIn, weight_load: READINESS_WEIGHTS.load });
    expect(c('e1rm')).toEqual({ epleyDivisor: EPLEY_DIVISOR, rirEasy: RIR_BY_EFFORT.easy, rirIdeal: RIR_BY_EFFORT.ideal, rirMax: RIR_BY_EFFORT.max, maxReps: E1RM_MAX_REPS });
    expect(c('effort_calibration')).toMatchObject({ observationsNeeded: BIAS_MIN_OBSERVATIONS, biasCap: BIAS_CAP_REPS });
    expect(c('deload_trigger')).toMatchObject({ plateauedLifts: DELOAD_TRIGGER.stalledLifts, readinessRedDays: DELOAD_TRIGGER.readinessRedDays, readinessWindowDays: DELOAD_TRIGGER.readinessWindowDays, overBandWeeks: DELOAD_TRIGGER.overBandWeeks });
    expect(c('progression')).toMatchObject({ reentryDays: REENTRY_DAYS, recoveryHoldPct: RECOVERY_HOLD_PCT, maxIncreaseShare: MAX_INCREASE_SHARE });
    expect(c('warmup').set1Pct).toBe(WARMUP_PCTS[0]);
    // The numbers are the ones the brain uses, not just labels: the cut-off really is where e1RM stops.
    expect(effectiveOneRm(100, E1RM_MAX_REPS, 'max')).not.toBeNull();
    expect(effectiveOneRm(100, E1RM_MAX_REPS + 1, 'max')).toBeNull();
  });
});

describe('BUG-14: the plateau and lighter-week explanations match the one plateau rule (BR-04)', () => {
  const six = ctxOf(sixMonthsState());
  it('plateau: states the BR-04 numbers the brain runs on', () => {
    const m = explainMethod('plateau', six);
    expect(m.constants).toEqual({ windowDays: PLATEAU_WINDOW_DAYS, flatTotalPct: PLATEAU_FLAT_TOTAL * 100, sessionsNeeded: PLATEAU_MIN_SESSIONS, minSpanDays: PLATEAU_MIN_SPAN_DAYS, e1rmSessionsNeeded: E1RM_MIN_SESSIONS, shortPathSessions: PLATEAU_WINDOW, highConfidenceSessions: PLATEAU_HIGH_SESSIONS });
    // BR-04 as written: under 1.5% over 8 weeks, from 6+ judged sessions spanning 42+ days.
    expect([PLATEAU_FLAT_TOTAL * 100, PLATEAU_WINDOW_DAYS / 7, PLATEAU_MIN_SESSIONS, PLATEAU_MIN_SPAN_DAYS]).toEqual([1.5, 8, 6, 42]);
    expect(m.summary).toContain(`less than ${PLATEAU_FLAT_TOTAL * 100}% over those ${PLATEAU_WINDOW_DAYS / 7} weeks`);
    expect(m.summary).toContain(`from ${PLATEAU_MIN_SESSIONS} or more judged sessions spanning ${PLATEAU_MIN_SPAN_DAYS} days or more`);
    expect(m.summary).toContain(`fewer than ${E1RM_MIN_SESSIONS} do`);
    expect(m.summary).toContain(`last ${PLATEAU_WINDOW} sessions, never a plateau`);
    expect(m.summary).toContain(`high from ${PLATEAU_HIGH_SESSIONS} judged sessions`);
    // The old rule's wording must not come back.
    expect(m.summary).not.toMatch(/needs at least|top load trends up/);
  });
  it('deload_trigger: states the 4-week minimum and the beginner rule', () => {
    const m = explainMethod('deload_trigger', six);
    expect(m.constants).toMatchObject({ minHistoryDays: DELOAD_TRIGGER.minHistoryDays, beginnerMonths: DELOAD_TRIGGER.beginnerMonths });
    expect([DELOAD_TRIGGER.minHistoryDays / 7, DELOAD_TRIGGER.beginnerMonths, DELOAD_TRIGGER.readinessRedDays, DELOAD_TRIGGER.readinessWindowDays]).toEqual([4, 3, 3, 5]);
    expect(m.summary).toContain(`never offered before ${DELOAD_TRIGGER.minHistoryDays / 7} weeks of logged training`);
    expect(m.summary).toContain(`under ${DELOAD_TRIGGER.beginnerMonths} months of training gets it only when readiness was red on ${DELOAD_TRIGGER.readinessRedDays} of the last ${DELOAD_TRIGGER.readinessWindowDays} days`);
    expect(m.summary).toContain('timed holds and conditioning never count');
  });
});

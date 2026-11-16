import { describe, it, expect } from 'vitest';
import { summarize } from '@/escobar/tools/show';
import { explainMethod } from '@/escobar/knowledge/methods';
import { toRequestMessages } from '@/escobar/loop';
import { daysBetween } from '@/core/dates';
import type { AppState } from '@/core/models';
import type { StoredMessage } from '@/escobar/types';
import { TODAY, ctxOf, sixMonthsState } from './fixtures';

const HEALTH = /resting heart rate|HRV|^Sleep:/i;
const withSharing = (health: boolean, body = true): AppState => {
  const s = sixMonthsState();
  // A week of resting HR well over the usual, so a health driver exists to be hidden.
  const healthDays = s.healthDays.map(d => (daysBetween(d.day, TODAY) < 7 ? { ...d, restingHr: 75 } : d));
  return { ...s, healthDays, escobar: { ...s.escobar, sharing: { health, body } } };
};

describe('privacy when health sharing is off (ES-12)', () => {
  it('readiness_gauge drops health drivers and keeps the rest', () => {
    const on = summarize('readiness_gauge', {}, ctxOf(withSharing(true))).drivers as string[];
    const off = summarize('readiness_gauge', {}, ctxOf(withSharing(false))).drivers as string[];
    expect(on.some(d => HEALTH.test(d))).toBe(true);
    expect(off.some(d => HEALTH.test(d))).toBe(false);
    expect(off).toEqual(on.filter(d => !HEALTH.test(d)));
  });

  it('explain_method hr_zones leaves out resting HR', () => {
    expect(explainMethod('hr_zones', ctxOf(withSharing(true))).personal).toHaveProperty('restingHr');
    expect(explainMethod('hr_zones', ctxOf(withSharing(false))).personal).not.toHaveProperty('restingHr');
  });

  it('a get_health result from before is replayed as denied', () => {
    const msgs: StoredMessage[] = [
      { role: 'user', content: [{ type: 'text', text: 'How did I sleep?' }] },
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'get_health', input: {} }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '{"data":{"restingHr":62}}' }] },
    ];
    const replay = (health: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health, body: true }));
    expect(replay(true)).toContain('restingHr');
    expect(replay(false)).not.toContain('restingHr');
    expect(replay(false)).toContain('health_sharing_off');
  });

  it("QA3-9: a past explain_method result's personal hrMax is dropped from replay, in data and facts", () => {
    const msgs: StoredMessage[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'explain_method', input: { topic: 'hr_zones' } }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: JSON.stringify({ data: { personal: { hrMax: 185, hrMaxSource: 'observed' } }, facts: { f1: 'personal hrMax = 185 bpm' } }) }] },
    ];
    const replay = (health: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health, body: true }));
    expect(replay(true)).toContain('185');
    expect(replay(false)).not.toContain('185');
    expect(replay(false)).not.toMatch(/personal hrMax/i);
  });

  it('QA3-9: an age-based (Tanaka) hrMax is not personal, so it survives replay with health off', () => {
    const msgs: StoredMessage[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'explain_method', input: { topic: 'hr_zones' } }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: JSON.stringify({ data: { personal: { hrMax: 190, hrMaxSource: 'tanaka' } }, facts: { f1: 'personal hrMax = 190 bpm' } }) }] },
    ];
    const replay = (health: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health, body: true }));
    expect(replay(false)).toContain('190');
    expect(replay(false)).toMatch(/personal hrMax/i);
  });

  it('QA13-1: a stored lift_trend effort[] loses its body-weight-derived kg once body sharing is off', () => {
    const msgs: StoredMessage[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'show', input: { component: 'lift_trend', params: { exerciseId: 'lib_pull_up' } } }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: JSON.stringify({ data: { effort: [{ day: '2026-09-01', easy: 0, ideal: 450, max: 0, unrated: 0 }] } }) }] },
    ];
    const replay = (body: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health: true, body }));
    expect(replay(true)).toContain('450');
    expect(replay(false)).not.toContain('450');
  });

  it("QA13-1: session_summary's own (non-array) effort tally is untouched by the same key name", () => {
    const msgs: StoredMessage[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'session_summary', input: { sessionId: 's1' } }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: JSON.stringify({ data: { effort: { easy: 1, ideal: 2, max: 0 } } }) }] },
    ];
    const replay = (body: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health: true, body }));
    expect(replay(false)).toContain('ideal\\":2');
  });
});

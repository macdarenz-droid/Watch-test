/** F13b: Escobar's week_summary, get_volume and compare_periods match Stats' body-weight volume, but only when sharing.body is on (docs/F13-BODYWEIGHT-LOAD.md §9/§10). */
import { describe, it, expect } from 'vitest';
import type { AppState } from '@/core/models';
import type { StoredMessage } from '@/escobar/types';
import { summarize } from '@/escobar/tools/show';
import { getVolume } from '@/escobar/tools/read';
import { toRequestMessages } from '@/escobar/loop';
import { ctxOf, emptyState, TODAY } from './fixtures';
import { session, sets } from '../helpers';

const PU = 'lib_pull_up';

const stateWith = (bodySharing: boolean): AppState => {
  const s = emptyState();
  return {
    ...s,
    sessions: [session(TODAY, [{ id: PU, sets: sets(0, 8) }])],
    weightLog: [{ day: '2026-09-01', kg: 80 }],
    escobar: { ...s.escobar, sharing: { health: false, body: bodySharing } },
  };
};

describe('F13b: week_summary', () => {
  it('volumeKg is unchanged; withBodyweightKg appears only when sharing.body is on', () => {
    const off = summarize('week_summary', {}, ctxOf(stateWith(false)));
    expect(off.volumeKg).toBe(0);
    expect(off).not.toHaveProperty('withBodyweightKg');

    const on = summarize('week_summary', {}, ctxOf(stateWith(true)));
    expect(on.volumeKg).toBe(0);
    expect(on.withBodyweightKg).toBe(1920);
  });

  it("QA6-1: withBodyweightKg lands in the Generic card's first 6 scalar rows", () => {
    const on = summarize('week_summary', {}, ctxOf(stateWith(true)));
    const scalarKeys = Object.entries(on).filter(([, v]) => typeof v === 'number' || typeof v === 'string').slice(0, 6).map(([k]) => k);
    expect(scalarKeys).toContain('withBodyweightKg');
  });
});

describe('F13b: get_volume', () => {
  it('effectiveKg appears per week only when sharing.body is on', () => {
    const off = getVolume({ weeks: 1 }, ctxOf(stateWith(false))) as { weeks: Array<{ volumeKg: number; effectiveKg?: number }> };
    expect(off.weeks[0]!.volumeKg).toBe(0);
    expect(off.weeks[0]).not.toHaveProperty('effectiveKg');

    const on = getVolume({ weeks: 1 }, ctxOf(stateWith(true))) as { weeks: Array<{ volumeKg: number; effectiveKg?: number }> };
    expect(on.weeks[0]!.volumeKg).toBe(0);
    expect(on.weeks[0]!.effectiveKg).toBe(1920);
  });
});

describe('F13b: compare_periods', () => {
  const params = { metric: 'volume', a: { from: '2026-09-21', to: '2026-09-22' }, b: { from: '2026-08-01', to: '2026-08-02' } };

  it('value is unchanged; effective appears only when sharing.body is on', () => {
    const off = summarize('compare_periods', params, ctxOf(stateWith(false))) as { a: { value: number; effective?: number } };
    expect(off.a.value).toBe(0);
    expect(off.a).not.toHaveProperty('effective');

    const on = summarize('compare_periods', params, ctxOf(stateWith(true))) as { a: { value: number; effective?: number } };
    expect(on.a.value).toBe(0);
    expect(on.a.effective).toBe(1920);
  });

  it('a sets/sessions comparison never gets an effective key', () => {
    const on = summarize('compare_periods', { ...params, metric: 'sets' }, ctxOf(stateWith(true))) as { a: { value: number; effective?: number } };
    expect(on.a).not.toHaveProperty('effective');
  });
});

describe('F13b: compare_periods effectiveDelta (QA6-3)', () => {
  const dayA = '2026-09-10', dayB = '2026-09-15';
  const stateFor = (bodySharing: boolean): AppState => {
    const base = emptyState();
    return {
      ...base,
      sessions: [session(dayA, [{ id: PU, sets: sets(0, 8) }]), session(dayB, [{ id: PU, sets: sets(10, 5) }])],
      weightLog: [{ day: '2026-09-01', kg: 80 }],
      escobar: { ...base.escobar, sharing: { health: false, body: bodySharing } },
    };
  };
  const params = { metric: 'volume', a: { from: dayA, to: dayA }, b: { from: dayB, to: dayB } };

  it('effectiveDelta is -570 with sharing on; absent with sharing off', () => {
    const off = summarize('compare_periods', params, ctxOf(stateFor(false))) as { delta: number; effectiveDelta?: number; effectiveDeltaPct?: number };
    expect(off.delta).toBe(150);
    expect(off).not.toHaveProperty('effectiveDelta');
    expect(off).not.toHaveProperty('effectiveDeltaPct');

    const on = summarize('compare_periods', params, ctxOf(stateFor(true))) as { delta: number; effectiveDelta?: number; effectiveDeltaPct?: number };
    expect(on.delta).toBe(150);
    expect(on.effectiveDelta).toBe(-570);
    expect(on.effectiveDeltaPct).toBeCloseTo(-29.7, 1);
  });

  it('effectiveDelta is removed on replay once sharing is off', () => {
    const msgs: StoredMessage[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'compare_periods', input: params }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '{"data":{"delta":150,"effectiveDelta":-570,"effectiveDeltaPct":-29.7}}' }] },
    ];
    const replay = (body: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health: true, body }));
    expect(replay(true)).toContain('-570');
    expect(replay(false)).not.toContain('-570');
    expect(replay(false)).toContain('150');
    expect(replay(false)).not.toContain('effectiveDelta');
  });
});

describe('F13b: withBodyweightKg is redacted from replay once body sharing is off (ES-12)', () => {
  it('a past week_summary result loses withBodyweightKg but keeps volumeKg', () => {
    const msgs: StoredMessage[] = [
      { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'week_summary', input: {} }], meta: { rendered: {} } },
      { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: '{"data":{"volumeKg":0,"withBodyweightKg":1920}}' }] },
    ];
    const replay = (body: boolean) => JSON.stringify(toRequestMessages(msgs, undefined, { health: true, body }));
    expect(replay(true)).toContain('1920');
    expect(replay(false)).not.toContain('1920');
    expect(replay(false)).toContain('volumeKg');
  });
});

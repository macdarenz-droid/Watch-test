import { describe, it, expect } from 'vitest';
import { captureFacts, extractNumbers, flatten, addFact, factText } from '@/escobar/ledger';

describe('ledger', () => {
  it('extractNumbers handles thousands and decimal commas', () => {
    expect(extractNumbers('1,500 steps and 11,9 kg, then -2.5')).toEqual([1500, 11.9, -2.5]);
  });
  it('flattens numbers with readable labels and units', () => {
    const leaves = flatten({ exercise: 'Bench press', sessions: [{ day: '2026-09-17', e1rm: 102.5, top: { kg: 90, reps: 6 } }] });
    const e = leaves.find(l => l.value === 102.5)!;
    expect(e.label).toContain('Bench press');
    expect(e.label).toContain('2026-09-17');
    expect(leaves.find(l => l.value === 90)!.unit).toBe('kg');
  });
  it('skips ids and date strings but reads numbers in prose', () => {
    const leaves = flatten({ sessionId: 's_12', day: '2026-09-17', noticed: 'Up 3 sessions in a row at 80 kg' });
    expect(leaves.map(l => l.value)).toEqual([3, 80]);
  });
  it('fact ids continue from the ledger and are deterministic', () => {
    const a = captureFacts([], 'get_recovery', {}, { pct: 62 }, 0);
    expect(a.facts[0]!.id).toBe('f1');
    const b = captureFacts(a.facts, 'get_recovery', {}, { pct: 70, hoursLeft: 12 }, 1);
    expect(b.facts.map(f => f.id)).toEqual(['f2', 'f3']);
    expect(b.map.f3).toBe('hoursLeft = 12 h');
    expect(captureFacts([], 't', {}, { pct: 62 }, 0)).toEqual(captureFacts([], 't', {}, { pct: 62 }, 0));
  });
  it('caps facts per result', () => {
    const r = captureFacts([], 't', {}, { xs: Array.from({ length: 200 }, (_, i) => i) }, 0);
    expect(r.facts.length).toBe(60);
  });
  it('addFact and factText', () => {
    const f = addFact([], 62, 'quads recovery', 'brief', 0, '%');
    expect(f.id).toBe('f1');
    expect(factText(f)).toBe('quads recovery = 62 %');
  });
});

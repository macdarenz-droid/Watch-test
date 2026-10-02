/**
 * BUG-20 (ESCOBAR-F1, F2): with body sharing off no weight number or trend leaves through the
 * brief, get_insights or session notes; with health sharing off no heart number or heart insight
 * leaves; with both on they still go out unchanged; and a birth year of (this year - 18) is a
 * possible minor. Every check reads the outbound request bodies the loop itself builds.
 */
import { describe, it, expect } from 'vitest';
import { EscobarLoop, toRequestMessages, type LoopDeps } from '@/escobar/loop';
import type { StreamEvent, Transport } from '@/escobar/transport';
import { newConversation } from '@/escobar/store';
import { buildManifest } from '@/escobar/context/manifest';
import type { AppState, LoggedSet } from '@/core/models';
import type { StoredMessage } from '@/escobar/types';
import { sixMonthsState, NOW } from './fixtures';

const final = (content: unknown[], stop_reason = 'end_turn'): StreamEvent => ({ t: 'final', content, stop_reason, usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 0 }, model: 'claude-opus-5' });
const tool = (id: string, name: string, input: unknown): StreamEvent[] => [{ t: 'tool', id, name }, { t: 'tool_input', id, input }, final([{ type: 'tool_use', id, name, input }], 'tool_use')];
const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text }, final([{ type: 'text', text }])];

function scripted(steps: StreamEvent[][]): Transport & { bodies: Array<{ messages: Array<{ role: string; content: unknown }> }> } {
  const bodies: Array<{ messages: Array<{ role: string; content: unknown }> }> = [];
  return {
    bodies,
    async *turn(body) {
      bodies.push(JSON.parse(JSON.stringify(body)));
      for (const e of steps[bodies.length - 1] ?? []) { await Promise.resolve(); yield e; }
    },
  };
}

/** BUG-21: set k is committed at SET_AT_SEC[k]; before it the heart rate rests at 90 + 4k bpm, then climbs to 150 in the set. */
const SET_AT_SEC = [120, 360, 600, 840, 1080, 1320];
const SERIES: Array<[number, number]> = Array.from({ length: 3900 / 5 }, (_, i): [number, number] => {
  const t = i * 5;
  const k = SET_AT_SEC.findIndex(at => t <= at);
  return [t, k < 0 ? 100 : SET_AT_SEC[k]! - t <= 30 ? 150 : 90 + 4 * k];
});

/** Six months of data plus everything the gated insights need: a fresh weigh-in, daily weigh-ins and heart data on yesterday's sets. */
function state(sharing: { health: boolean; body: boolean }, birthYear = 1988): AppState {
  const s = sixMonthsState();
  const day = (offset: number) => { const d = new Date(NOW - offset * 86_400_000); return d.toISOString().slice(0, 10); };
  const last = s.sessions.at(-1)!;
  // Six rated live sets with a peak, 4 min apart: the third is rated Easy above the same exercise's
  // hardest-rated (ideal) set (effort mismatch); the heart series below gives them a rising pre-set HR (drift, BUG-21).
  const ex = last.exercises[0]!;
  const peaks = [150, 160, 170];
  const base = ex.sets[0]!;
  ex.sets = [
    ...peaks.map((p, k): LoggedSet => ({ ...base, kg: 60, effort: k === 2 ? 'easy' : 'ideal', heart: { peakBpm: p, endBpm: p - 5, hrr60: 30 - k * 5 } })),
    ...peaks.map((): LoggedSet => ({ ...base, kg: 50, effort: 'ideal', heart: { peakBpm: 140, endBpm: 130 } })),
  ].map((x, k) => ({ ...x, fidelity: 'live', at: new Date(Date.parse(last.startedAt) + SET_AT_SEC[k]! * 1000).toISOString() }));
  s.profileHistory = [{ at: new Date(NOW - 3_600_000).toISOString(), field: 'bodyWeightKg', from: 82.4, to: 91.3, source: 'user' }];
  s.profile.bodyWeightKg = 91.3;
  s.profile.birthYear = birthYear;
  s.weightLog = Array.from({ length: 21 }, (_, i) => ({ day: day(i), kg: 91.3 + i * 0.1 }));
  // Keep the weekly review to one exercise so the (lower-priority) weight trend fits its six slots.
  for (const x of s.sessions) x.exercises = x.exercises.filter(e => e.exerciseId === 'lib_barbell_bench_press');
  s.escobar.sharing = sharing;
  return s;
}

function run(s: AppState) {
  const sessionId = s.sessions.at(-1)!.id;
  const transport = scripted([tool('t1', 'get_insights', {}), tool('t2', 'get_session', { sessionId }), answer('Noted.')]);
  const deps: LoopDeps = {
    transport, getState: () => s, now: () => NOW, appVersion: '37.0.0', manifest: () => buildManifest('37.0.0'),
    applyEffect: () => {}, recordUsage: () => {}, persist: () => {}, sleep: async () => {}, heartSeries: () => SERIES,
  };
  return { transport, loop: new EscobarLoop({ ...newConversation('37.0.0', 'chat', new Date(NOW)), id: 'c1' }, deps) };
}

/** Everything the Worker would see over the whole turn: the brief, the tool results and the rest. */
async function outbound(s: AppState): Promise<{ brief: string; insights: string; session: string; all: string }> {
  const { loop, transport } = run(s);
  const r = await loop.send({ text: 'how am I doing?' });
  expect(r.outcome).toBe('done');
  expect(transport.bodies).toHaveLength(3);
  const brief = (transport.bodies[0]!.messages.find(m => m.role === 'system')!.content as string);
  const resultOf = (i: number) => (transport.bodies[i]!.messages.at(-1)!.content as Array<{ type: string; content?: string }>).find(b => b.type === 'tool_result')!.content!;
  return { brief, insights: resultOf(1), session: resultOf(2), all: JSON.stringify(transport.bodies) };
}

const WEIGHT = /Weight updated|Trend weight|91\.3|profile-changed:weight|weekly:weight-trend/;
const HEART = /heart-mismatch|heart-drift|hardest-rated set|before your last 3 sets|avgBpm|maxBpm/;

describe('BUG-20 Escobar privacy: gated insights and the minor flag', () => {
  it('A3: with both on, the weight and heart insights go out unchanged', async () => {
    const o = await outbound(state({ health: true, body: true }));
    expect(o.brief).toMatch(/top_insights: .*profile-changed:weight:\S+ "Weight updated to 91\.3 kg"/);
    expect(o.brief).toContain('weight 91.3');
    expect(o.insights).toContain('"title":"Weight updated to 91.3 kg"');
    expect(o.insights).toContain('"id":"weekly:weight-trend"');
    expect(o.insights).toContain('hardest-rated set');
    expect(o.insights).toContain('before your last 3 sets');
    expect(o.session).toContain('"notes"');
  });

  it('A1: with body sharing off, no weight number or weight trend leaves the phone', async () => {
    const o = await outbound(state({ health: true, body: false }));
    expect(o.brief).not.toMatch(WEIGHT);
    expect(o.insights).not.toMatch(WEIGHT);
    expect(o.session).not.toMatch(WEIGHT);
    expect(o.all).not.toMatch(WEIGHT);
    // The heart insights are untouched.
    expect(o.insights).toContain('hardest-rated set');
  });

  it('A2: with health sharing off, no heart number or heart insight leaves the phone', async () => {
    const o = await outbound(state({ health: false, body: true }));
    expect(o.brief).not.toMatch(HEART);
    expect(o.insights).not.toMatch(HEART);
    expect(o.session).not.toMatch(HEART);
    expect(o.all).not.toMatch(HEART);
    // The weight insight is untouched.
    expect(o.insights).toContain('"title":"Weight updated to 91.3 kg"');
  });

  it('A2: readiness insight drops its health drivers with health off, keeps the check-in ones', async () => {
    // A week of resting HR well above the 28-day usual makes it a readiness driver.
    // ADAPT-2: today's check-in is set below the user's usual, so it stays a check-in driver now that a usual one reads normal.
    const raised = (s: AppState) => { s.healthDays = s.healthDays.map((d, i) => (i < 7 ? { ...d, restingHr: 75 } : d)); s.checkIns = s.checkIns.map((c, i) => (i === 0 ? { ...c, sleepQuality: 2 as const, mood: 3 as const } : c)); return s; };
    const on = await outbound(raised(state({ health: true, body: true })));
    expect(on.insights).toMatch(/"id":"readiness-today"[^}]*resting heart rate is up over your usual/);
    const off = await outbound(raised(state({ health: false, body: true })));
    expect(off.insights).toMatch(/"id":"readiness-today"[^}]*how you feel today/);
    expect(off.insights).not.toMatch(/resting heart rate|HRV/i);
  });

  it('A1/A2: a get_insights result stored while sharing was on loses the gated insights on replay', () => {
    const on = state({ health: true, body: true });
    const { transport, loop } = run(on);
    return loop.send({ text: 'x' }).then(() => {
      const stored: StoredMessage[] = [
        { role: 'user', content: [{ type: 'text', text: 'x' }] },
        { role: 'system', content: transport.bodies[0]!.messages.find(m => m.role === 'system')!.content as string },
        { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'get_insights', input: {} }] } as StoredMessage,
        { role: 'user', content: [{ type: 'tool_result', tool_use_id: 't1', content: (transport.bodies[1]!.messages.at(-1)!.content as Array<{ type: string; content?: string }>)[0]!.content! }] },
      ];
      const off = JSON.stringify(toRequestMessages(stored, undefined, { health: false, body: false }));
      expect(off).not.toMatch(WEIGHT);
      expect(off).not.toMatch(HEART);
      expect(off).toContain('top_insights: ');
      const still = JSON.stringify(toRequestMessages(stored, undefined, { health: true, body: true }));
      expect(still).toMatch(WEIGHT);
      expect(still).toMatch(HEART);
    });
  });

  it('A4: born (this year - 18) is a possible minor; (this year - 19) is not; fixed clock', async () => {
    const year = new Date(NOW).getFullYear();
    expect(year).toBe(2026);
    const minor = await outbound(state({ health: true, body: true }, year - 18));
    expect(minor.brief).toMatch(/^minor: true$/m);
    const adult = await outbound(state({ health: true, body: true }, year - 19));
    expect(adult.brief).not.toMatch(/^minor:/m);
  });
});

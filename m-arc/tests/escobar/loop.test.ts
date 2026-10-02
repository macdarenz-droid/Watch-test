import { describe, it, expect } from 'vitest';
import { EscobarLoop, toRequestMessages, windowMessages, offlineReply, STEP_BUDGET, type LoopDeps } from '@/escobar/loop';
import type { StreamEvent, Transport } from '@/escobar/transport';
import { newConversation, trimOldest } from '@/escobar/store';
import { decide } from '@/escobar/apply';
import type { Conversation, Fact, StoredMessage } from '@/escobar/types';
import type { MemoryEffect } from '@/escobar/tools/executor';
import { sixMonthsState, NOW } from './fixtures';
import { buildManifest } from '@/escobar/context/manifest';
import { checkGrounding } from '@/escobar/verify';

type Step = StreamEvent[] | ((body: { messages: unknown[] }) => StreamEvent[]);
const final = (content: unknown[], stop_reason = 'end_turn'): StreamEvent => ({ t: 'final', content, stop_reason, usage: { input_tokens: 1000, output_tokens: 50, cache_read_input_tokens: 800 }, model: 'claude-opus-5' });
const tools = (...uses: Array<[string, string, unknown]>): StreamEvent[] => [
  { t: 'thinking' },
  ...uses.flatMap(([id, name, input]): StreamEvent[] => [{ t: 'tool', id, name }, { t: 'tool_input', id, input }]),
  final([{ type: 'thinking', thinking: '', signature: 's' }, ...uses.map(([id, name, input]) => ({ type: 'tool_use', id, name, input }))], 'tool_use'),
];
const answer = (text: string): StreamEvent[] => [{ t: 'text', d: text.slice(0, 5) }, { t: 'text', d: text.slice(5) }, final([{ type: 'thinking', thinking: '', signature: 's' }, { type: 'text', text }])];

function scripted(steps: Step[]): Transport & { bodies: Array<{ messages: unknown[]; mode: string }> } {
  const bodies: Array<{ messages: unknown[]; mode: string }> = [];
  return {
    bodies,
    async *turn(body, signal) {
      const b = JSON.parse(JSON.stringify(body));
      bodies.push(b);
      const s = steps[bodies.length - 1];
      if (!s) throw new Error('no more scripted steps');
      for (const e of typeof s === 'function' ? s(b) : s) {
        if (signal.aborted) return;
        await Promise.resolve();
        yield e;
      }
    },
  };
}

function setup(steps: Step[], extra: Partial<LoopDeps> = {}) {
  const transport = scripted(steps);
  const effects: MemoryEffect[] = [];
  const usage: unknown[] = [];
  const saved: Conversation[] = [];
  const state = sixMonthsState();
  const deps: LoopDeps = {
    transport, getState: () => state, now: () => NOW, appVersion: '37.0.0', manifest: () => buildManifest('37.0.0'),
    applyEffect: e => effects.push(e), recordUsage: u => usage.push(u), persist: c => saved.push(c), sleep: async () => {}, ...extra,
  };
  const loop = new EscobarLoop({ ...newConversation('37.0.0', 'chat', new Date(NOW)), id: 'c1' }, deps);
  return { loop, transport, effects, usage, saved };
}

/** Every request must be a valid API history: roles, system placement, tool pairing. */
function assertValidHistory(messages: StoredMessage[]) {
  expect(messages[0]!.role).toBe('user');
  const open = new Set<string>();
  messages.forEach((m, i) => {
    if (m.role === 'system') {
      expect(messages[i - 1]!.role).toBe('user');
      if (i < messages.length - 1) expect(messages[i + 1]!.role).toBe('assistant');
    }
    if (m.role === 'assistant') for (const b of m.content as Array<{ type: string; id: string }>) if (b.type === 'tool_use') open.add(b.id);
    if (m.role === 'user') for (const b of m.content) if (b.type === 'tool_result') { expect(open.has(b.tool_use_id)).toBe(true); open.delete(b.tool_use_id); }
    if (m.role === 'user' && i > 0 && open.size) expect(m.content.every(b => b.type === 'tool_result')).toBe(true);
  });
  expect(open.size).toBe(0);
}

describe('agent loop (§13)', () => {
  it('runs a full 6-step conversation: parallel reads, a chart, a proposal, a memory write and a repair round', async () => {
    const { loop, transport, effects, usage } = setup([
      tools(['t1', 'get_overview', {}], ['t2', 'get_readiness', { historyDays: 7 }]),
      tools(['t3', 'show', { component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press', weeks: 12 } }]),
      tools(['t4', 'propose_goal', { goal: 'strength' }]),
      tools(['t5', 'remember', { kind: 'preference', text: 'Likes short sessions' }]),
      answer('Readiness is amber today. Your bench could reach 187.5 kg by spring.'),
      answer('Readiness is amber today, so keep loads steady. ⟦chips: Why amber? | Plan tomorrow⟧'),
    ]);
    const r = await loop.send({ text: 'How am I doing, and should I change my goal?' });
    expect(r.outcome).toBe('done');
    expect(transport.bodies).toHaveLength(6);
    const c = loop.conversation;
    assertValidHistory(c.messages);
    // user, brief, then (assistant, tool results) × 4, then a repaired answer
    expect(c.messages.map(m => m.role).slice(0, 4)).toEqual(['user', 'system', 'assistant', 'user']);
    const firstResults = c.messages[3] as Extract<StoredMessage, { role: 'user' }>;
    expect(firstResults.content.map(b => (b as { tool_use_id: string }).tool_use_id)).toEqual(['t1', 't2']);
    expect(c.proposals!.map(p => [p.id, p.kind, p.status])).toEqual([['p1', 'propose_goal', 'awaiting']]);
    expect(effects.map(e => e.type)).toEqual(['remember']);
    expect(r.outcomes.find(o => o.show)!.show!.component).toBe('lift_trend');
    // the repair round
    const repair = c.messages.find(m => m.role === 'user' && m.meta?.repair);
    expect(repair).toBeTruthy();
    const sys = c.messages.filter(m => m.role === 'system').map(m => m.content as string);
    expect(sys.at(-1)).toContain('187.5');
    expect(r.revised).toBe(true);
    expect(r.answer!.chips).toEqual(['Why amber?', 'Plan tomorrow']);
    const answers = c.messages.filter(m => m.role === 'assistant' && m.meta.rendered.answer);
    expect(answers).toHaveLength(1);
    expect(c.messages.filter(m => m.role === 'assistant' && m.meta.rendered.revised)).toHaveLength(1);
    expect(c.userTurns).toBe(1);
    expect(c.ledger.length).toBeGreaterThan(10);
    expect(usage).toEqual([{ turns: 1, inputTokens: 6000, outputTokens: 300, cacheReadTokens: 4800, costUsd: expect.closeTo(0.0399, 6) }]); // F7: priced per step (claude-opus-5)
    expect(c.title).toBe('How am I doing, and should I change my goal?'.slice(0, 40));
  });

  it('never sends app-only fields and puts the brief right after the user message', async () => {
    const { loop, transport } = setup([answer('Hi.')]);
    await loop.send({ text: 'hello', contextRefs: [{ kind: 'exercise', id: 'lib_barbell_bench_press', label: 'Bench press' }] });
    const msgs = transport.bodies[0]!.messages as Array<{ role: string; content: unknown; meta?: unknown }>;
    expect(msgs.map(m => m.role)).toEqual(['user', 'system']);
    expect(msgs.some(m => 'meta' in m)).toBe(false);
    expect(JSON.stringify(msgs[0])).toContain('[about: exercise lib_barbell_bench_press \\"Bench press\\"] hello');
    expect(String(msgs[1]!.content)).toMatch(/^now: /m);
  });

  it('stops at the step budget and closes orphaned tool calls', async () => {
    const steps = Array.from({ length: STEP_BUDGET.chat }, (_, i) => tools([`t${i}`, 'get_overview', {}]));
    const { loop } = setup(steps);
    const r = await loop.send({ text: 'loop forever' });
    expect(r.outcome).toBe('step_limit');
    assertValidHistory(loop.conversation.messages);
  });

  it('never runs tools from a max_tokens cut-off; closes them as not run', async () => {
    const cut: StreamEvent[] = [{ t: 'tool', id: 'x', name: 'propose_goal' }, final([{ type: 'tool_use', id: 'x', name: 'propose_goal', input: { goal: 'strength' } }], 'max_tokens')];
    const { loop } = setup([cut]);
    const r = await loop.send({ text: 'switch goal' });
    expect(r.outcome).toBe('cut_off');
    expect(loop.conversation.proposals ?? []).toEqual([]);
    const last = loop.conversation.messages.at(-1) as Extract<StoredMessage, { role: 'user' }>;
    expect(last.content[0]).toMatchObject({ type: 'tool_result', tool_use_id: 'x', is_error: true, content: 'not run: cut_off' });
    assertValidHistory(loop.conversation.messages);
  });

  it('a refusal or a quota error before any reply leaves history untouched (Not sent · Retry)', async () => {
    const a = setup([[{ t: 'text', d: 'Hmm' }, { t: 'refusal', category: 'cyber' }]]);
    const r = await a.loop.send({ text: 'x' });
    expect(r).toMatchObject({ outcome: 'refusal', notSent: true, refusal: { category: 'cyber' } });
    expect(a.loop.conversation.messages).toEqual([]);
    expect(a.loop.view.text).toBe('');
    const b = setup([[{ t: 'error', code: 'quota', message: 'resting', retryAfter: 60 }]]);
    const q = await b.loop.send({ text: 'x' });
    expect(q).toMatchObject({ outcome: 'error', notSent: true, error: { code: 'quota' } });
    expect(b.loop.conversation.messages).toEqual([]);
  });

  it('retries once on a busy upstream before anything was shown, never on invalid', async () => {
    const a = setup([[{ t: 'error', code: 'upstream_busy', message: 'busy' }], answer('Done.')]);
    expect((await a.loop.send({ text: 'x' })).outcome).toBe('done');
    expect(a.transport.bodies).toHaveLength(2);
    const b = setup([[{ t: 'error', code: 'invalid', message: 'bad' }], answer('Done.')]);
    expect((await b.loop.send({ text: 'x' })).outcome).toBe('error');
    expect(b.transport.bodies).toHaveLength(1);
  });

  it('Stop during a later step drops the stream and closes orphans; a stale generation is ignored', async () => {
    let loopRef: EscobarLoop | null = null;
    const { loop } = setup([
      tools(['t1', 'get_overview', {}]),
      () => { loopRef!.stop(); return answer('late text'); },
    ]);
    loopRef = loop;
    const r = await loop.send({ text: 'x' });
    expect(r.outcome).toBe('aborted');
    assertValidHistory(loop.conversation.messages);
    expect(loop.conversation.messages.some(m => m.role === 'assistant' && JSON.stringify(m.content).includes('late text'))).toBe(false);
  });

  it('keeps unverified sentences muted when the repair still has invented numbers', async () => {
    const { loop } = setup([answer('Add 12.5 kg next week.'), answer('Add 12.5 kg next week, trust me.')]);
    const r = await loop.send({ text: 'x' });
    expect(r.outcome).toBe('done');
    expect(r.unverified).toEqual(['Add 12.5 kg next week, trust me.']);
    const rendered = loop.conversation.messages.filter(m => m.role === 'assistant').at(-1)!;
    expect(rendered.role === 'assistant' && rendered.meta.rendered.unverified).toEqual(['Add 12.5 kg next week, trust me.']);
  });

  it('offline answers navigation questions from the palace without sending', async () => {
    const { loop, transport } = setup([], { online: () => false });
    const r = await loop.send({ text: 'where is my recovery?' });
    expect(r.outcome).toBe('offline');
    expect(r.local!.entries.length).toBeGreaterThan(0);
    expect(transport.bodies).toHaveLength(0);
    expect(offlineReply('zzqx').entries).toEqual([]);
  });

  it('flags crisis at once, even before the network', async () => {
    const seen: string[] = [];
    const { loop } = setup([], { online: () => false, onSafety: s => seen.push(s) });
    await loop.send({ text: 'I want to kill myself' });
    expect(seen).toEqual(['crisis']);
  });

  it('decisions reach the next brief once, then clear', async () => {
    const { loop, transport } = setup([answer('Noted.'), answer('Ok.')]);
    await loop.send({ text: 'hi' });
    loop.conversation = { ...loop.conversation, pendingDecisions: [{ proposalId: 'p1', decision: 'applied', at: 'now', title: 'Switch goal' }] };
    await loop.send({ text: 'thanks' });
    const secondBrief = (transport.bodies[1]!.messages as Array<{ role: string; content: string }>).filter(m => m.role === 'system').at(-1)!.content;
    expect(secondBrief).toContain('decisions: proposal p1 "Switch goal" → applied');
    expect(loop.conversation.pendingDecisions).toEqual([]);
  });

  it('QA-R4a-7 (ES-11): an error during the repair keeps the first answer, marked, and the message counts as sent', async () => {
    const { loop } = setup([answer('Your bench went up to 987 kg last week.')]);
    const r = await loop.send({ text: 'how is my bench' });
    expect(r.outcome).toBe('error');
    expect(r.notSent).toBe(false);
    const last = loop.conversation.messages.filter(m => m.role === 'assistant').at(-1)!;
    expect(JSON.stringify(last)).toContain('987');
    expect(JSON.stringify(last.meta ?? {})).toContain('987');
  });

  it('QA-R4a-7 (ES-20): a decision recorded while a turn runs stays queued for the next brief', async () => {
    let loopRef: EscobarLoop | null = null;
    const { loop, transport } = setup([
      () => { loopRef!.conversation = { ...loopRef!.conversation, pendingDecisions: [{ proposalId: 'p9', decision: 'applied', at: 'mid', title: 'Lighter bench' }] }; return answer('Noted.'); },
      answer('Ok.'),
    ]);
    loopRef = loop;
    await loop.send({ text: 'hi' });
    expect(loop.conversation.pendingDecisions?.map(d => d.proposalId)).toEqual(['p9']);
    await loop.send({ text: 'thanks' });
    const brief = (transport.bodies[1]!.messages as Array<{ role: string; content: string }>).filter(m => m.role === 'system').at(-1)!.content;
    expect(brief).toContain('proposal p9 "Lighter bench" → applied');
  });

  it('QA-R4b-3: after a trimmed window, the next brief is full, even for a turn without tools', async () => {
    const { loop, transport } = setup([answer('Noted.'), answer('Ok.'), answer('Sure.')]);
    await loop.send({ text: 'hi' });
    const long: StoredMessage[] = [];
    for (let i = 0; i < 30; i++) long.push({ role: 'user', content: [{ type: 'text', text: `q${i} ${'z'.repeat(10_000)}` }] }, { role: 'assistant', content: [{ type: 'text', text: `a${i}` }] } as StoredMessage);
    loop.conversation = { ...loop.conversation, messages: [...long, ...loop.conversation.messages], userTurns: 6 };
    await loop.send({ text: 'again' });
    await loop.send({ text: 'and again' });
    const third = (transport.bodies[2]!.messages as Array<{ role: string; content: string }>).filter(m => m.role === 'system').at(-1)!.content;
    expect(third.startsWith('(changes since the last brief)')).toBe(false);
  });

  it('photos are sent once, then as a stub', async () => {
    const evicted: string[] = [];
    const { loop, transport } = setup([answer('A rack.'), answer('Ok.')], { imageData: id => (id === 'img1' ? { mediaType: 'image/jpeg', data: 'QUJD' } : null), imagesSent: ids => evicted.push(...ids) });
    await loop.send({ text: 'what is this', images: [{ type: 'image_ref', id: 'img1', mediaType: 'image/jpeg', description: 'dumbbell rack' }] });
    await loop.send({ text: 'and now?' });
    expect(JSON.stringify(transport.bodies[0]!.messages)).toContain('"type":"image"');
    expect(JSON.stringify(transport.bodies[1]!.messages)).not.toContain('"type":"image"');
    expect(JSON.stringify(transport.bodies[1]!.messages)).toContain('[photo shared earlier: dumbbell rack]');
    // ES-28: once sent, the photo's bytes leave memory.
    expect(evicted).toEqual(['img1']);
  });
});

describe('suggestion ids after a trim (QA2-FD-1)', () => {
  it('a new card never takes the id of a card that survived the trim, so Apply or Dismiss acts on the card tapped', async () => {
    const { loop } = setup([
      tools(['a1', 'propose_goal', { goal: 'strength' }]), answer('Done.'),
      tools(['a2', 'propose_goal', { goal: 'strength' }], ['a3', 'propose_deload', { reason: 'Tired' }]), answer('Done.'),
      tools(['a4', 'propose_deload', { reason: 'Take a lighter week' }]), answer('Done.'),
    ]);
    await loop.send({ text: 'Switch my goal?' });
    await loop.send({ text: 'Goal again, and a lighter week?' });
    expect(loop.conversation.proposals!.map(p => p.id)).toEqual(['p1', 'p2', 'p3']);
    // A long chat is stored (and reloaded) with its oldest half cut: p1 goes, p2 and p3 stay.
    loop.conversation = trimOldest(loop.conversation)!;
    expect(loop.conversation.proposals!.map(p => p.id)).toEqual(['p2', 'p3']);
    await loop.send({ text: 'Just the lighter week then.' });
    expect(loop.conversation.proposals!.map(p => p.id)).toEqual(['p2', 'p3', 'p4']);
    const fresh = loop.conversation.proposals!.at(-1)!;
    expect(fresh.input).toEqual({ reason: 'Take a lighter week' });
    const { conversation } = decide(loop.conversation, fresh.id, 'dismiss');
    expect(conversation.proposals!.map(p => p.status)).toEqual(['awaiting', 'awaiting', 'dismissed']);
    expect(conversation.pendingDecisions!.at(-1)).toMatchObject({ proposalId: fresh.id, title: fresh.title });
  });
});

describe('history window (§11.4)', () => {
  it('replaces the oldest half with the rolling summary in the request only', () => {
    const conv = newConversation('37.0.0');
    // ES-16: the window now checks the size again after the cut, so the data leaves the kept half under the limit.
    const big = 'x'.repeat(4500);
    const msgs: StoredMessage[] = [];
    for (let i = 0; i < 60; i++) { msgs.push({ role: 'user', content: [{ type: 'text', text: `${i} ${big}` }] }); msgs.push({ role: 'assistant', content: [{ type: 'text', text: 'ok' }], meta: { rendered: {} } }); }
    const trimmed = windowMessages(conv, msgs);
    expect(trimmed.length).toBeLessThan(msgs.length);
    expect(JSON.stringify(trimmed[0])).toContain('[earlier conversation trimmed]');
    const withSummary = windowMessages({ ...conv, rollingSummary: { text: 'We planned a PPL.', upTo: 40 } }, msgs);
    expect(JSON.stringify(withSummary[0])).toContain('[summary of earlier conversation] We planned a PPL.');
    expect(withSummary.length).toBe(msgs.length - 40 + 1);
    expect(toRequestMessages(withSummary).length).toBe(withSummary.length);
  });
  it('keeps trimming at clean user turns until the request fits (ES-16)', () => {
    const conv = newConversation('37.0.0');
    const big = 'x'.repeat(9000);
    const msgs: StoredMessage[] = [];
    for (let i = 0; i < 60; i++) { msgs.push({ role: 'user', content: [{ type: 'text', text: `${i} ${big}` }] }); msgs.push({ role: 'assistant', content: [{ type: 'text', text: 'ok' }], meta: { rendered: {} } }); }
    const w = windowMessages({ ...conv, rollingSummary: { text: 'Earlier.', upTo: 40 } }, msgs);
    expect(Math.ceil(JSON.stringify(toRequestMessages(w)).length / 4)).toBeLessThanOrEqual(60_000);
    expect(JSON.stringify(w[0])).toContain('[later messages trimmed]');
    expect((w[1] as { role: string }).role).toBe('user');
  });
});

describe('replayed health and body details once sharing is off (QA-R4b-2)', () => {
  const brief: StoredMessage = { role: 'system', content: 'readiness amber 55, advice hold (resting heart rate up 6 bpm; sleep has been short)\nprofile: goal Strength, male, weight 80.5 kg' };
  const uses: StoredMessage = { role: 'assistant', content: [{ type: 'tool_use', id: 't1', name: 'get_readiness', input: {} }, { type: 'tool_use', id: 't2', name: 'get_session', input: {} }] } as StoredMessage;
  const results: StoredMessage = { role: 'user', content: [
    { type: 'tool_result', tool_use_id: 't1', content: JSON.stringify({ data: { readiness: { score: 55, drivers: ['resting heart rate up 6 bpm', 'legs trained yesterday'] }, baselines: { restingHr7d: 58 } }, facts: { f1: 'readiness score = 55', f2: 'baselines restingHr7d = 58' } }) },
    { type: 'tool_result', tool_use_id: 't2', content: JSON.stringify({ data: { sets: 12, heart: { avgBpm: 131, maxBpm: 170 } }, facts: { f3: 'sets = 12', f4: 'heart avgBpm = 131' } }) },
  ] } as StoredMessage;
  const msgs = [{ role: 'user', content: [{ type: 'text', text: 'hi' }] } as StoredMessage, brief, uses, results];
  it('health off: no heart numbers, baselines or HR drivers; training data stays', () => {
    const out = JSON.stringify(toRequestMessages(msgs, undefined, { health: false, body: true }));
    for (const gone of ['restingHr7d', '58', 'avgBpm', '131', 'resting heart rate', 'sleep has been short']) expect(out).not.toContain(gone);
    for (const kept of ['legs trained yesterday', 'sets = 12', 'readiness score = 55', 'weight 80.5 kg']) expect(out).toContain(kept);
  });
  it('body off: the brief loses the body weight', () => {
    const out = JSON.stringify(toRequestMessages(msgs, undefined, { health: true, body: false }));
    expect(out).not.toContain('80.5');
    expect(out).toContain('avgBpm');
  });
});

describe('cost by the model that answered (F7)', () => {
  it('each step is priced with its own model', async () => {
    const got: Array<{ costUsd?: number }> = [];
    const sonnet: StreamEvent[] = [{ t: 'text', d: 'Ok.' }, { t: 'final', content: [{ type: 'text', text: 'Ok.' }], stop_reason: 'end_turn', usage: { input_tokens: 1_000_000, output_tokens: 0 }, model: 'claude-sonnet-5' }];
    const { loop } = setup([sonnet], { recordUsage: u => got.push(u) });
    await loop.send({ text: 'hi' });
    expect(got[0]!.costUsd).toBeCloseTo(2, 5);
  });
  it('a dated model id uses its alias price', async () => {
    const { estimateCost } = await import('@/escobar/state');
    expect(estimateCost({ inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 0 }, 'claude-opus-5-5-20260901')).toBe(4);
    expect(estimateCost({ inputTokens: 0, outputTokens: 1_000_000, cacheReadTokens: 0 }, 'claude-haiku-4-5')).toBe(5);
  });

  const oneStep = (usage: Record<string, unknown>, model: string): StreamEvent[] => [{ t: 'text', d: 'Ok.' }, { t: 'final', content: [{ type: 'text', text: 'Ok.' }], stop_reason: 'end_turn', usage, model }];
  const recorded = async (steps: StreamEvent[]) => {
    const got: Array<{ inputTokens: number; costUsd?: number }> = [];
    const { loop } = setup([steps], { recordUsage: u => got.push(u) });
    await loop.send({ text: 'hi' });
    return got[0]!;
  };

  it('QA2-F7-4: cache writes are priced at the 1-hour and 5-minute write rates', async () => {
    // Opus 5: $5 in, $25 out, 1h write $10, 5m write $6.25 per MTok.
    const h1 = await recorded(oneStep({ input_tokens: 50, output_tokens: 300, cache_creation_input_tokens: 20_000, cache_creation: { ephemeral_5m_input_tokens: 0, ephemeral_1h_input_tokens: 20_000 } }, 'claude-opus-5'));
    expect(h1.costUsd).toBeCloseTo(0.20775, 8);
    const m5 = await recorded(oneStep({ input_tokens: 50, output_tokens: 300, cache_creation_input_tokens: 20_000, cache_creation: { ephemeral_5m_input_tokens: 20_000, ephemeral_1h_input_tokens: 0 } }, 'claude-opus-5'));
    expect(m5.costUsd).toBeCloseTo(0.13275, 8);
    // No TTL breakdown: the write is priced at the default 5-minute rate, never dropped.
    const bare = await recorded(oneStep({ input_tokens: 50, output_tokens: 300, cache_creation_input_tokens: 20_000 }, 'claude-opus-5'));
    expect(bare.costUsd).toBeCloseTo(0.13275, 8);
  });

  it('QA2-F7-1: a fallback turn prices each attempt by its own model and skips the unbilled declined attempt', async () => {
    const it2 = (first: { input: number; output: number }) => ({ input_tokens: 412, output_tokens: 264, cache_read_input_tokens: 0, cache_creation_input_tokens: 0, iterations: [
      { type: 'message', model: 'claude-opus-5-5', input_tokens: first.input, output_tokens: first.output, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      { type: 'fallback_message', model: 'claude-opus-4-8', input_tokens: 412, output_tokens: 264, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    ] });
    // Declined before any output: reported, not billed. Opus 4.8 serves 412 in / 264 out at $5/$25.
    const pre = await recorded(oneStep(it2({ input: 535, output: 0 }), 'claude-opus-4-8'));
    expect(pre.inputTokens).toBe(412);
    expect(pre.costUsd).toBeCloseTo(0.00866, 8);
    // Declined mid-output: billed at Opus 5.5's own rates ($4/$20), then the Opus 4.8 attempt.
    const mid = await recorded(oneStep(it2({ input: 535, output: 40 }), 'claude-opus-4-8'));
    expect(mid.inputTokens).toBe(947);
    expect(mid.costUsd).toBeCloseTo(0.00294 + 0.00866, 8);
  });

  it('QA2-F7-1: every model the API serves has its own price; an unknown id is never priced below the dearest one', async () => {
    const { estimateCost } = await import('@/escobar/state');
    const perMTok = (model: string) => [estimateCost({ inputTokens: 1_000_000, outputTokens: 0, cacheReadTokens: 0 }, model), estimateCost({ inputTokens: 0, outputTokens: 1_000_000, cacheReadTokens: 0 }, model)];
    expect(perMTok('claude-mythos-5-1')).toEqual([10, 50]);
    expect(perMTok('claude-mythos-5')).toEqual([10, 50]);
    expect(perMTok('claude-sonnet-4-6')).toEqual([3, 15]);
    expect(perMTok('claude-sonnet-4-5-20250929')).toEqual([3, 15]);
    expect(perMTok('claude-opus-4-7')).toEqual([5, 25]);
    expect(perMTok('claude-opus-4-6')).toEqual([5, 25]);
    expect(perMTok('claude-opus-4-5-20251101')).toEqual([5, 25]);
    expect(perMTok('claude-something-9')).toEqual([10, 50]);
    // A newer minor version is unknown, not its prefix's price (QA2-F7-1 follow-up).
    expect(perMTok('claude-sonnet-5-5')).toEqual([10, 50]);
    expect(perMTok('claude-opus-5-6')).toEqual([10, 50]);
    expect(perMTok('claude-haiku-4-5-20251001')).toEqual([1, 5]);
    // Cache reads per MTok: 0.025x on Fable/Mythos 5.1, 0.05x on Opus 5.5, 0.1x elsewhere.
    expect(estimateCost({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 }, 'claude-mythos-5-1')).toBe(0.25);
    expect(estimateCost({ inputTokens: 0, outputTokens: 0, cacheReadTokens: 1_000_000 }, 'claude-sonnet-4-6')).toBeCloseTo(0.3, 10);
  });
});

describe('replay redaction with real brief text (QA2-FD-4, QA2-FD-8, QA2-FD-11, QA2-FD-12)', () => {
  const brief: StoredMessage = { role: 'system', content: 'readiness amber 55 [f3], advice no_increase (how you feel today (soreness, sleep quality or mood); sleep has been short recently; resting heart rate is up over your usual)\nprofile: goal Strength, male, weight 80.5 [f13] kg, age 36' };
  const use: StoredMessage = { role: 'assistant', content: [{ type: 'tool_use', id: 'm1', name: 'explain_method', input: { method: 'hr_zones' } }] } as StoredMessage;
  const result: StoredMessage = { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'm1', content: JSON.stringify({ data: { personal: { hrMax: 184, restingHrBaseline: 58, healthDaysLogged: 60, zone1FromBpm: 120, zone5FromBpm: 169, restingKcalPerDay: 1745 } }, facts: { f1: 'personal zone1FromBpm = 120', f2: 'personal restingKcalPerDay = 1745', f3: 'personal restingHrBaseline = 58' } }) }] } as StoredMessage;
  const msgs = [{ role: 'user', content: [{ type: 'text', text: 'hi' }] } as StoredMessage, brief, use, result];
  it('health off: no drivers survive, no stray bracket, and no zone or resting-HR numbers', () => {
    const out = JSON.stringify(toRequestMessages(msgs, undefined, { health: false, body: true }));
    for (const gone of ['sleep has been short', 'resting heart rate', 'no_increase)', 'zone1FromBpm', '169', 'restingHrBaseline', 'healthDaysLogged']) expect(out).not.toContain(gone);
    expect(out).toContain('advice no_increase\\nprofile');
    expect(out).toContain('restingKcalPerDay');
  });
  it('body off: the tagged weight and resting calories are gone', () => {
    const out = JSON.stringify(toRequestMessages(msgs, undefined, { health: true, body: false }));
    for (const gone of ['80.5', 'restingKcalPerDay', '1745']) expect(out).not.toContain(gone);
    expect(out).toContain('age 36');
  });
});

describe('BUG-31 brief-form fact tags in the loop', () => {
  // A conversation past f10: the ids the answer cites are already in the ledger, with these values.
  const VALUES: Record<string, number> = { f33: 67, f34: 45, f36: 52, f40: 2, f41: 38, f42: 6, f43: 3 };
  const prefilled = (): Fact[] => Array.from({ length: 45 }, (_, i) => ({ id: `f${i + 1}`, value: VALUES[`f${i + 1}`] ?? 0.25, label: `fact ${i + 1}`, source: { tool: 'brief' }, turn: 0 }));
  const SCREENSHOT = "You've done 2 [f40] of 3 [f43] planned sessions this week, 38 [f41] sets, 6 [f42] records. Readiness is green 67 [f33], advice normal. Biceps are at 45% [f34] and triceps 52% [f36], so your last sessions were real work.";
  const assistants = (c: Conversation) => c.messages.filter((m): m is Extract<StoredMessage, { role: 'assistant' }> => m.role === 'assistant');

  it('A1: an answer in the brief form finishes with no repair round and no unverified sentence', async () => {
    const { loop, transport } = setup([answer(SCREENSHOT)]);
    loop.conversation = { ...loop.conversation, ledger: prefilled() };
    const r = await loop.send({ text: 'How was my week?' });
    expect(r.outcome).toBe('done');
    expect(transport.bodies).toHaveLength(1);
    expect(loop.conversation.messages.some(m => m.role === 'user' && m.meta?.repair)).toBe(false);
    expect(r.unverified).toBeUndefined();
    expect(r.revised).toBe(false);
    const rendered = assistants(loop.conversation).at(-1)!.meta.rendered;
    expect(rendered.unverified).toBeUndefined();
    expect(rendered.answer).toContain('2 ⟦f40⟧ of 3 ⟦f43⟧ planned sessions');
    expect(rendered.answer).not.toMatch(/\[f\d+/);
    expect(r.answer!.citations).toEqual(['f40', 'f43', 'f41', 'f42', 'f33', 'f34', 'f36']);
  });

  it('A1: a preamble in the brief form is stored canonical; an unknown id stays as written', async () => {
    const pre = 'Counting your 38 [f41] sets and 67 [f999].';
    const withPreamble: StreamEvent[] = [{ t: 'text', d: pre }, { t: 'tool', id: 't1', name: 'get_overview' }, { t: 'tool_input', id: 't1', input: {} }, final([{ type: 'text', text: pre }, { type: 'tool_use', id: 't1', name: 'get_overview', input: {} }], 'tool_use')];
    const { loop } = setup([withPreamble, answer('Steady week.')]);
    loop.conversation = { ...loop.conversation, ledger: prefilled() };
    await loop.send({ text: 'How was my week?' });
    expect(assistants(loop.conversation)[0]!.meta.rendered.preamble).toEqual(['Counting your 38 ⟦f41⟧ sets and 67 [f999].']);
  });

  it('A1: an invented number next to a real id is the only number sent back', async () => {
    const { loop } = setup([answer('You did 55 [f41] sets this week.'), answer('You did 38 [f41] sets this week.')]);
    loop.conversation = { ...loop.conversation, ledger: prefilled() };
    const r = await loop.send({ text: 'How many sets?' });
    const sys = loop.conversation.messages.filter(m => m.role === 'system').map(m => m.content as string);
    expect(sys.at(-1)).toMatch(/^These numbers are not from your tools, cards or the brief: 55\. /);
    expect(r.outcome).toBe('done');
    expect(r.unverified).toBeUndefined();
    expect(r.revised).toBe(true);
  });

  it('A5: the gate’s mock scenario repairs only its invented number, then ends on a clean brief-form answer', async () => {
    const { mockTransport, BRIEF_TAGS_QUESTION } = await import('@/escobar/mock/transport');
    const state = sixMonthsState();
    const loop = new EscobarLoop({ ...newConversation('37.0.0', 'chat', new Date(NOW)), id: 'c1' }, { transport: mockTransport(() => state, 0), getState: () => state, now: () => NOW, appVersion: '37.0.0', manifest: () => buildManifest('37.0.0'), sleep: async () => {} });
    const r = await loop.send({ text: BRIEF_TAGS_QUESTION });
    expect(r.outcome).toBe('done');
    expect(r.revised).toBe(true);
    expect(r.unverified).toBeUndefined();
    expect(loop.conversation.messages.filter(m => m.role === 'system').map(m => m.content as string).at(-1)).toMatch(/^These numbers are not from your tools, cards or the brief: 999\.5\. /);
    expect(assistants(loop.conversation)[0]!.meta.rendered.preamble).toEqual([expect.stringMatching(/^Checking your week: \d+ ⟦f\d+⟧ sets so far\.$/)]);
    const m = /^Your latest strength estimate is [\d.]+ kg ⟦f(\d+),f(\d+)⟧, and you've done \d+ ⟦f\d+⟧ sets this week\.$/.exec(r.answer!.text);
    expect(m, r.answer!.text).toBeTruthy();
    // The second id is past f10 and no fact value covers its digits: read as a number, it is flagged.
    expect(Number(m![2])).toBeGreaterThan(10);
    expect(checkGrounding({ answer: `About ${m![2]}.`, ledger: loop.conversation.ledger }).ok).toBe(false);
  });

  it('A3: the repair system message asks for the whole answer again, with no mention of the check', async () => {
    const { loop, transport } = setup([answer('Your bench went up to 987 kg last week.'), answer('Your bench went up last week.')]);
    await loop.send({ text: 'How is my bench?' });
    const want = 'These numbers are not from your tools, cards or the brief: 987. Recompute them with tools or remove them. Then write your whole answer again as your reply to the person. Do not mention this check or that anything was re-checked.';
    expect(loop.conversation.messages.filter(m => m.role === 'system').map(m => m.content).at(-1)).toBe(want);
    const sent = (transport.bodies[1]!.messages as Array<{ role: string; content: unknown }>).filter(m => m.role === 'system').at(-1)!;
    expect(sent.content).toBe(want);
  });
});

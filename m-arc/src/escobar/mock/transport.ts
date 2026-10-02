/**
 * The gate's mock Worker (§23 EV5): loaded by dynamic import only when `marc.dev === '1'`,
 * never touches the network. It plays a fixed conversation shape (a preamble, two reads, a
 * lift_trend chart, a proposal with a crisis safety card, then an answer citing a real fact and
 * a knowledge card, with chips) whose tool calls run through the real executor, so citations and
 * cards are genuine. ESC-NC: the markers and the crisis card let the gate prove that no chip,
 * marker, link or contact reaches the screen (owner, LR-23).
 */
import type { AppState } from '@/core/models';
import { GOALS } from '@/data/goals';
import type { StreamEvent, Transport } from '../transport';

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

function latestExercise(s: AppState): string {
  for (const sess of [...s.sessions].reverse()) for (const e of sess.exercises) if (e.sets.some(x => (x.kg ?? 0) > 0)) return e.exerciseId;
  return 'lib_barbell_bench_press';
}

interface Msg { role: string; content: unknown }

/** BUG-31: the gate's question for the brief-form citation scenario below. */
export const BRIEF_TAGS_QUESTION = 'Gate check: brief tags';

type ToolStep = (preamble: string, uses: Array<{ id: string; name: string; input: unknown }>) => StreamEvent[];

interface SeenFact { id: string; value: string; text: string }

/** The facts the app sent: the brief's inline "value [fN]" tags and each tool result's facts map. */
function factsSent(messages: Msg[]): SeenFact[] {
  const out: SeenFact[] = [];
  for (const m of messages) {
    if (m.role === 'system' && typeof m.content === 'string') {
      for (const t of m.content.matchAll(/(-?\d+(?:\.\d+)?)%? \[(f\d+)\]/g)) out.push({ id: t[2]!, value: t[1]!, text: t[0] });
    }
    if (m.role !== 'user' || !Array.isArray(m.content)) continue;
    for (const blk of m.content as Array<{ type: string; content?: string }>) {
      if (blk.type !== 'tool_result' || !blk.content) continue;
      try {
        const facts = (JSON.parse(blk.content) as { facts?: Record<string, string> }).facts ?? {};
        for (const [id, text] of Object.entries(facts)) out.push({ id, value: text.split(' = ')[1]?.split(' ')[0] ?? '', text });
      } catch { /* not JSON */ }
    }
  }
  return out;
}

/**
 * The highest fact id above f10 whose digits no fact value covers (as-is, rounded, or as the lb of
 * a kg value), so a check that read "[fN]" as a number would flag it for sure.
 */
function uncoveredId(facts: SeenFact[]): string | null {
  const values = facts.map(f => Math.abs(Number(f.value))).filter(Number.isFinite);
  const covered = (n: number) => values.some(v => n === v || n === Math.round(v) || n === Math.round(v * 10) / 10 || Math.abs(n - v / 0.45359237) <= 1);
  const ids = facts.map(f => Number(f.id.slice(1))).filter(n => n > 10 && !covered(n));
  return ids.length ? `f${Math.max(...ids)}` : null;
}

/**
 * BUG-31: the model copies the brief's "38 [f41]" form. This scenario cites that way on every surface
 * the gate reads: a preamble and a chart caption citing the brief's sets fact, a first draft whose
 * invented number draws a repair round (shown as the earlier draft), then an answer in the brief form
 * that must pass the number check. The strength estimate cites "[fE, fN]", fN an id no fact value
 * covers, so reading a tag's digits as a number is always caught. The answer streams in small
 * pieces, so tags arrive split.
 */
function briefTagSteps(step: number, messages: Msg[], ex: string, toolStep: ToolStep): StreamEvent[] {
  const briefs = messages.filter(m => m.role === 'system' && typeof m.content === 'string').map(m => m.content as string);
  const week = briefs.map(t => /^week: .*?(\d+(?:\.\d+)?) \[(f\d+)\] sets\b/m.exec(t)).filter(Boolean).at(-1);
  const sets = week ? `${week[1]} [${week[2]}]` : null;
  if (step === 0) {
    return toolStep(sets ? `Checking your week: ${sets} sets so far.` : 'Checking your week.', [
      { id: `m_${Date.now()}_b1`, name: 'get_exercise_history', input: { exerciseId: ex, weeks: 12 } },
      { id: `m_${Date.now()}_b2`, name: 'show', input: { component: 'lift_trend', params: { exerciseId: ex, weeks: 12, metric: 'e1rm' }, caption: sets ? `Sets this week: ${sets}` : 'Sets this week' } },
    ]);
  }
  const facts = factsSent(messages);
  const e = facts.filter(f => / e1rm = /.test(f.text)).at(-1);
  const other = uncoveredId(facts);
  const best = e ? `Your latest strength estimate is ${e.value} kg [${e.id}${other && other !== e.id ? `, ${other}` : ''}]` : 'Your sessions look steady';
  const text = step === 1 ? `${best}, so 999.5 kg [${e?.id ?? 'f1'}] is next.` : `${best}, and you've done ${sets ?? 'some'} sets this week.`;
  const events: StreamEvent[] = [];
  for (let i = 0; i < text.length; i += 7) events.push({ t: 'text', d: text.slice(i, i + 7) });
  events.push({ t: 'final', content: [{ type: 'thinking', thinking: '', signature: 'mock' }, { type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 1500, output_tokens: 90, cache_read_input_tokens: 9000 }, model: 'claude-opus-5' });
  return events;
}

export function mockTransport(getState: () => AppState, delayMs = 25): Transport {
  return {
    async *turn(body, signal) {
      const b = body as { messages: Msg[]; mode: string };
      // Steps since the last real user message decide what comes next.
      let step = 0;
      let asked = '';
      for (let i = b.messages.length - 1; i >= 0; i--) {
        const m = b.messages[i]!;
        if (m.role === 'assistant') step++;
        if (m.role === 'user' && Array.isArray(m.content) && !m.content.some(x => (x as { type: string }).type === 'tool_result') && !JSON.stringify(m.content).includes('[app] verification check')) { asked = JSON.stringify(m.content); break; }
      }
      const s = getState();
      const ex = latestExercise(s);
      const events: StreamEvent[] = [{ t: 'start', requestId: `mock_${Date.now()}` }, { t: 'thinking' }];
      const toolStep = (preamble: string, uses: Array<{ id: string; name: string; input: unknown }>): StreamEvent[] => [
        ...(preamble ? [{ t: 'text' as const, d: preamble }] : []),
        ...uses.flatMap((u): StreamEvent[] => [{ t: 'tool', id: u.id, name: u.name }, { t: 'tool_input', id: u.id, input: u.input }]),
        { t: 'final', content: [{ type: 'thinking', thinking: '', signature: 'mock' }, ...(preamble ? [{ type: 'text', text: preamble }] : []), ...uses.map(u => ({ type: 'tool_use', ...u }))], stop_reason: 'tool_use', usage: { input_tokens: 1200, output_tokens: 60, cache_read_input_tokens: 9000 }, model: 'claude-opus-5' },
      ];
      if (asked.includes(BRIEF_TAGS_QUESTION)) {
        events.push(...briefTagSteps(step, b.messages, ex, toolStep));
      } else if (step === 0) {
        events.push(...toolStep('Let me look at your recent lifting.', [
          { id: `m_${Date.now()}_1`, name: 'get_exercise_history', input: { exerciseId: ex, weeks: 12 } },
          { id: `m_${Date.now()}_2`, name: 'show', input: { component: 'lift_trend', params: { exerciseId: ex, weeks: 12, metric: 'e1rm' }, caption: 'Strength estimate, last 12 weeks' } },
        ]));
      } else if (step === 1) {
        const goal = GOALS.find(g => g.id !== s.goal)!.id;
        events.push(...toolStep('', [
          { id: `m_${Date.now()}_3`, name: 'propose_goal', input: { goal } },
          { id: `m_${Date.now()}_4`, name: 'escalate', input: { kind: 'crisis', note: 'Gate check: this note never shows.' } },
        ]));
      } else {
        // Cite the best e1RM fact from the history tool result.
        let cite = '';
        for (const m of b.messages) {
          if (m.role !== 'user' || !Array.isArray(m.content)) continue;
          for (const blk of m.content as Array<{ type: string; content?: string }>) {
            if (blk.type !== 'tool_result' || !blk.content) continue;
            try {
              const facts = (JSON.parse(blk.content) as { facts?: Record<string, string> }).facts ?? {};
              const hit = Object.entries(facts).reverse().find(([, v]) => / e1rm = /.test(v));
              if (hit) { const value = hit[1].split(' = ')[1]!.split(' ')[0]!; cite = `Your latest strength estimate is ${value} kg ⟦${hit[0]}⟧, and the line above shows where it came from.`; }
            } catch { /* not JSON */ }
          }
        }
        const text = `${cite || 'Your recent sessions look steady.'} Keep adding a rep before adding load, and enough protein helps you recover ⟦k:protein_intake⟧. Tap Apply if you want the goal change. ⟦chips: Why is my readiness amber? | Plan tomorrow | Show my records⟧`;
        for (let i = 0; i < text.length; i += 18) events.push({ t: 'text', d: text.slice(i, i + 18) });
        events.push({ t: 'final', content: [{ type: 'thinking', thinking: '', signature: 'mock' }, { type: 'text', text }], stop_reason: 'end_turn', usage: { input_tokens: 1500, output_tokens: 90, cache_read_input_tokens: 9000 }, model: 'claude-opus-5' });
      }
      for (const e of events) {
        if (signal.aborted) return;
        await wait(delayMs);
        yield e;
      }
    },
  };
}

// BUG-31 (A2): the brief writes facts as "38 [f41]" and the model copies that form. Whatever tag is
// left over, known id or not, never reaches the screen: the answer, the preamble, the earlier draft,
// a show caption, a pinned card's title and its proposal card, conversations stored before the fix
// included (the strip runs at render time).
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VNode } from 'preact';
import { replaceState, state } from '@/core/store';
import { newConversation } from '@/escobar/store';
import { DirectiveBuffer, checkGrounding, normalizeCitations, parseDirectives } from '@/escobar/verify';
import { splitCitations, stripCitationTags } from '@/escobar/ui/present';
import type { Conversation, Fact, ProposalRecord } from '@/escobar/types';
import { twoWeeksState, NOW } from './fixtures';

// Components are called as plain functions (no jsdom): hooks are stubs, useMemo runs its factory.
vi.mock('preact/hooks', () => ({ useState: (init: unknown) => [init, () => {}], useEffect: () => {}, useRef: (v: unknown) => ({ current: v }), useMemo: (f: () => unknown) => f() }));
const { AnswerText, EscobarTurnView, ProposalCard } = await import('@/escobar/ui/Message');
const { ShowComponent } = await import('@/escobar/ui/components');
const { PinnedCards } = await import('@/escobar/ui/PinnedCards');
const { PlansAndAgreements } = await import('@/escobar/ui/Hall');

type Node = VNode<Record<string, unknown> & { children?: unknown }>;
function walk(node: unknown, visit: (v: Node) => void): void {
  if (node == null || typeof node !== 'object') return;
  if (Array.isArray(node)) { for (const c of node) walk(c, visit); return; }
  const v = node as Node;
  visit(v);
  walk(v.props?.children, visit);
}
function textOf(node: unknown): string {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  return textOf((node as Node).props?.children);
}
/** The tree's text plus that of every ShowComponent in it, drawn (its caption is only a prop until then). */
function shownText(tree: unknown): string {
  let out = textOf(tree);
  walk(tree, v => { if (v.type === ShowComponent) out += ' ' + textOf(ShowComponent(v.props as unknown as Parameters<typeof ShowComponent>[0])); });
  return out;
}
const TAG = /\[\s*f\d+/;
const fact = (id: string, value: number, label: string): Fact => ({ id, value, label, source: { tool: 'brief' }, turn: 0 });

beforeEach(() => { vi.useFakeTimers({ now: NOW, toFake: ['Date'] }); replaceState(twoWeeksState()); });

describe('BUG-31 A2 splitCitations and stripCitationTags', () => {
  it('splitCitations strips brief-form tags, known or not, and gathers their ids in reading order', () => {
    const r = splitCitations('You did 2 ⟦f40⟧ of 3 [f43] sessions, 38 [f41] sets, 6 [ f42 , f44 ] records and 67 [f999].');
    expect(r.text).toBe('You did 2 of 3 sessions, 38 sets, 6 records and 67.');
    expect(r.ids).toEqual(['f40', 'f43', 'f41', 'f42', 'f44', 'f999']);
  });
  it('splitCitations leaves brackets that are not fact tags', () => {
    expect(splitCitations('See [1] and [note] and [f] here.').text).toBe('See [1] and [note] and [f] here.');
  });
  it('stripCitationTags removes every marker and tag with the spaces before it, and nothing else', () => {
    expect(stripCitationTags('Counting your 38 [f41] sets ⟦f2⟧, protein ⟦k:protein_intake⟧ [f3, f4].')).toBe('Counting your 38 sets, protein.');
    expect(stripCitationTags('[f12] Strength — last 12 weeks [1]')).toBe('Strength — last 12 weeks [1]');
    expect(stripCitationTags('Cut off here ⟦f1')).toBe('Cut off here');
  });
});

describe('BUG-31 A2 the stream buffer holds back a partial fact tag', () => {
  it('holds "[", "[f", "[f12", "[f12," and "[f12, f4" until the tag closes', () => {
    const b = new DirectiveBuffer();
    expect(b.push('You did 38 ')).toBe('You did 38');
    for (const d of ['[', 'f', '12', ',', ' f', '4']) expect(b.push(d), d).toBe('You did 38');
    expect(b.push('] sets')).toBe('You did 38 [f12, f4] sets');
  });
  it('releases the held text unchanged once it is not a fact tag', () => {
    const one = new DirectiveBuffer();
    expect(one.push('See [')).toBe('See');
    expect(one.push('1')).toBe('See [1');
    expect(one.push(']')).toBe('See [1]');
    const note = new DirectiveBuffer();
    expect(note.push('Read [')).toBe('Read');
    expect(note.push('note] here')).toBe('Read [note] here');
    const fx = new DirectiveBuffer();
    expect(fx.push('Read [f')).toBe('Read');
    expect(fx.push('x')).toBe('Read [fx');
  });
});

/**
 * A conversation stored before the fix: tags in the preamble, the show caption, the earlier draft
 * (revised) and the rendered answer, one of them with an id the ledger never had.
 */
function storedConversation(): Conversation {
  const c = newConversation('test', 'chat');
  c.ledger = [fact('f40', 2, 'sessions this week'), fact('f41', 38, 'sets this week'), fact('f43', 3, 'planned sessions this week')];
  c.messages = [
    { role: 'user', content: [{ type: 'text', text: 'How was my week?' }] },
    { role: 'system', content: 'week: 2 [f40] of 3 [f43] planned sessions, 38 [f41] sets' },
    { role: 'assistant', content: [{ type: 'text', text: 'Counting your 38 [f41] sets.' }, { type: 'tool_use', id: 'tu_s', name: 'show', input: { component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press', weeks: 12 }, caption: 'Sets this week 38 [f41]' } }], meta: { rendered: { preamble: ['Counting your 38 [f41] sets.'] } } },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_s', content: JSON.stringify({ data: { shown: true }, facts: {} }) }] },
    { role: 'assistant', content: [{ type: 'text', text: 'You did 38 [f41] sets, so 999 [f41, f999] is next.' }], meta: { rendered: { revised: true } } },
    { role: 'user', content: [{ type: 'text', text: '[app] verification check' }], meta: { repair: true } },
    { role: 'system', content: 'These numbers are not from your tools, cards or the brief: 999.' },
    { role: 'assistant', content: [{ type: 'text', text: "You've done 2 [f40] of 3 [f43] planned sessions this week, 38 [f41] sets. Readiness is 67 [f999]." }], meta: { rendered: { answer: "You've done 2 [f40] of 3 [f43] planned sessions this week, 38 [f41] sets. Readiness is 67 [f999]." } } },
  ] as Conversation['messages'];
  return c;
}

describe('BUG-31 A2 every surface of a stored conversation shows no tag', () => {
  const view = () => EscobarTurnView({ conv: storedConversation(), indexes: [2, 3, 4, 5, 6, 7] });
  it('the answer, known ids and an unknown one', () => {
    let answer: Node | undefined;
    walk(view(), v => { if (v.type === AnswerText) answer = v; });
    expect(answer).toBeTruthy();
    const t = textOf(AnswerText(answer!.props as unknown as Parameters<typeof AnswerText>[0]));
    expect(t).toContain("You've done 2 of 3 planned sessions this week, 38 sets.");
    expect(t).toContain('Readiness is 67.');
    expect(t).not.toMatch(TAG);
  });
  it('the preamble', () => {
    const pre: string[] = [];
    walk(view(), v => { if (v.props?.class === 'esc-preamble') pre.push(textOf(v)); });
    expect(pre).toEqual(['Counting your 38 sets.']);
  });
  it('the earlier draft (revised)', () => {
    const drafts: string[] = [];
    walk(view(), v => { if (String(v.props?.class ?? '').includes('esc-revised')) drafts.push(textOf(v)); });
    expect(drafts).toEqual(['Earlier draft (revised)You did 38 sets, so 999 is next.']);
  });
  it('the show caption', () => {
    const t = shownText(view());
    expect(t).toContain('Sets this week 38');
    expect(t).not.toMatch(TAG);
  });
  it('"Unverified number" marks only the sentence with the invented number, not the tagged real ones', () => {
    const ledger = storedConversation().ledger;
    const raw = normalizeCitations('You did 38 [f41] sets. Next week 55 [f41] sets.', ledger);
    const { sentences } = checkGrounding({ answer: raw, ledger });
    const marked: string[] = [];
    const tree = AnswerText({ text: parseDirectives(raw).text, ledger, unverified: sentences });
    walk(tree, v => { if (v.props?.class === 'esc-unverified') marked.push(textOf(v)); });
    expect(marked).toEqual(['Next week 55 sets. Unverified number ']);
    expect(textOf(tree)).not.toMatch(TAG);
  });
  it('the streaming answer', () => {
    expect(textOf(AnswerText({ text: 'You did 38 [f41] sets, 6 [f42, f43] records', ledger: [], streaming: true }))).toBe('You did 38 sets, 6 records ');
  });
});

describe('BUG-31 A2 pinned card titles', () => {
  it('the card on Today and its Unpin label', () => {
    replaceState({ ...state.value, escobar: { ...state.value.escobar, pins: [{ id: 'pin1', component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press', weeks: 12 }, title: 'Bench 102.5 kg [f12]', pinnedAt: new Date(NOW).toISOString() }] } });
    const tree = PinnedCards();
    const t = shownText(tree);
    expect(t).toContain('Bench 102.5 kg');
    expect(t).not.toMatch(TAG);
    const labels: string[] = [];
    walk(tree, v => { const a = (v.props?.action as Node | undefined)?.props?.['aria-label']; if (typeof a === 'string') labels.push(a); });
    expect(labels).toEqual(['Unpin Bench 102.5 kg']);
  });
  it('the pin proposal card', () => {
    const p: ProposalRecord = { id: 'p1', kind: 'pin_card', input: {}, title: 'Pin to Today: Bench 102.5 kg [f12]', preview: [{ label: 'Bench 102.5 kg [f12]', after: 'pinned until you unpin it' }], fingerprint: 'x', createdAt: new Date(NOW).toISOString(), expiresOn: '2099-01-01', status: 'awaiting' };
    const t = textOf(ProposalCard({ p, conversationId: 'c1' }));
    expect(t).toContain('Pin to Today: Bench 102.5 kg');
    expect(t).toContain('Bench 102.5 kg');
    expect(t).not.toMatch(TAG);
  });
});

describe('BUG-31 review fixes', () => {
  it('the streaming hold-back runs in linear time on a long run of empty commas', () => {
    const b = new DirectiveBuffer();
    const t = performance.now();
    b.push('Sure [f1' + ' , '.repeat(16) + ' x');
    expect(performance.now() - t).toBeLessThan(50);
  });
  it('the hold-back still holds partial tags and releases non-tags', () => {
    const held = (s: string) => !new DirectiveBuffer().push(s).includes(s.slice(s.lastIndexOf('[')));
    for (const s of ['a [', 'a [f', 'a [f12', 'a [f12,', 'a [f12, f3', 'a [f12 , f3 ,']) expect(held(s), s).toBe(true);
    for (const s of ['a [1]', 'a [note]', 'a [f1 x']) expect(held(s), s).toBe(false);
  });
  it('Coach > Plans and agreements shows a pinned title without its tag', () => {
    replaceState({ ...state.value, escobar: { ...state.value.escobar, pins: [{ id: 'pin2', component: 'lift_trend', params: { exerciseId: 'lib_barbell_bench_press', weeks: 12 }, title: 'Bench 38 [f41]', pinnedAt: new Date(NOW).toISOString() }] } });
    const t = shownText(PlansAndAgreements());
    expect(t).toContain('Bench 38');
    expect(t).not.toMatch(TAG);
  });
  it('a cut-off tag at the end and an upper-case tag are stripped from the screen', () => {
    expect(stripCitationTags('Bench trend [f4')).toBe('Bench trend');
    expect(stripCitationTags('Bench trend [f12, f')).toBe('Bench trend');
    expect(stripCitationTags('Bench 38 [F41] sets')).toBe('Bench 38 sets');
    const t = performance.now();
    stripCitationTags('x [f1' + ' , '.repeat(5000) + ' y');
    expect(performance.now() - t).toBeLessThan(50);
  });
});

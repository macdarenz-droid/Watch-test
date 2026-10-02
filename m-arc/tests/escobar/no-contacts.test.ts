// ESC-NC (owner decision LR-23, 2026-09-30): the shipped coach shows no contact, link, source,
// citation chip or evidence label. "Dont put any emergency or whatever contacts. Even the source
// remove it in app ui." The safety cards still appear through both routes, with the new copy.
import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { VNode } from 'preact';
import { CONTACT_RE, SOURCE_RE, SOURCE_CS_RE, SAFETY_LINE_RE } from '../guards/no-contacts';
import { KNOWLEDGE, lookupKnowledge } from '@/escobar/knowledge/cards';
import { safetySignals } from '@/escobar/verify';
import { newConversation } from '@/escobar/store';
import type { Conversation, Fact } from '@/escobar/types';

// The drawer keeps its open state in useState; called as a plain function (no jsdom, no diff),
// it gets a stub that opens it and expands the tool use whose id is in `h.show`.
const h = vi.hoisted(() => ({ show: 'tu_k' }));
vi.mock('preact/hooks', () => ({ useState: (init: unknown) => [init === false ? true : init === null ? h.show : init, () => {}], useEffect: () => {}, useRef: (v: unknown) => ({ current: v }) }));
const { ESCALATION_COPY, Escalation } = await import('@/escobar/ui/Escalation');
const { AnswerText, EscobarTurnView } = await import('@/escobar/ui/Message');

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
const typeName = (v: Node): string => (typeof v.type === 'function' ? v.type.name : String(v.type));
const allPatterns = (s: string) => ({ contact: CONTACT_RE.test(s), source: SOURCE_RE.test(s), sourceCs: SOURCE_CS_RE.test(s), safetyLine: SAFETY_LINE_RE.test(s) });
const clean = { contact: false, source: false, sourceCs: false, safetyLine: false };

const NEW_COPY = {
  medical: 'Chest pain, fainting, or dizziness during exercise needs medical attention. Stop the session and get emergency help now.',
  crisis: 'If things feel like too much, you don’t have to carry it alone. Talk to someone you trust, or a doctor. If you feel you might harm yourself, get emergency help now.',
  disordered_eating: 'This is worth talking through with someone who can help properly, like a doctor.',
} as const;

describe('ESC-NC (a) the safety cards carry the owner-approved copy and no contact or source', () => {
  it('uses the D-LR23-1 copy for medical, crisis and disordered eating', () => {
    for (const [k, v] of Object.entries(NEW_COPY)) expect(ESCALATION_COPY[k as keyof typeof NEW_COPY], k).toBe(v);
  });
  it('D-LR23-9: the pain card still names its time limit (symptom → how long → what to do)', () => {
    expect(ESCALATION_COPY.pain).toContain('lasting more than two days');
    expect(ESCALATION_COPY.pain).toContain('see a physio or doctor');
  });
  it('every card passes CONTACT_RE, SOURCE_RE, SOURCE_CS_RE and SAFETY_LINE_RE', () => {
    for (const [k, v] of Object.entries(ESCALATION_COPY)) expect(allPatterns(v), `${k}: ${v}`).toEqual(clean);
  });
  it('the patterns bite on the old copy and on the D-LR23-1 fixtures, and pass "Get emergency help now."', () => {
    expect(CONTACT_RE.test('If it’s happening now, call emergency services.')).toBe(true);
    expect(CONTACT_RE.test('findahelpline.com lists options by country. https://findahelpline.com')).toBe(true);
    expect(CONTACT_RE.test('text HOME to 741741')).toBe(true);
    expect(SAFETY_LINE_RE.test('ring 13 11 14')).toBe(true);
    expect(CONTACT_RE.test('Go to A&E.')).toBe(true);
    expect(SOURCE_CS_RE.test('Weiss 1995')).toBe(true);
    expect(SOURCE_CS_RE.test('NSCA teaches')).toBe(true);
    expect(allPatterns('Get emergency help now.')).toEqual(clean);
  });
});

describe('ESC-NC (b) the safety cards hold no link', () => {
  it('Escalation.tsx has no <a and no href=', () => {
    const src = readFileSync('src/escobar/ui/Escalation.tsx', 'utf8');
    expect(src).not.toMatch(/<a[\s>]/);
    expect(src).not.toMatch(/href=/);
  });
  it('no rendered card has an <a>, an href or a link-looking text', () => {
    for (const kind of ['pain', 'pain_mentioned', 'medical', 'crisis', 'disordered_eating'] as const) {
      const tree = Escalation({ kind });
      walk(tree, v => { expect(v.type, kind).not.toBe('a'); expect(v.props?.href, kind).toBeUndefined(); });
      expect(allPatterns(textOf(tree)).contact, kind).toBe(false);
    }
  });
});

const f1: Fact = { id: 'f1', value: 100, label: 'best set kg', unit: 'kg', source: { tool: 'get_exercise_history' }, turn: 1 };

describe('ESC-NC (c) answers show no citation chip, evidence label or marker', () => {
  const tree = AnswerText({ text: 'You lifted 100 kg ⟦f1⟧. Protein helps ⟦k:protein_intake⟧.', ledger: [f1] });
  it('has no esc-cite class, no Citation or CardCitation and no ⟦', () => {
    walk(tree, v => {
      expect(String(v.props?.class ?? '')).not.toMatch(/esc-cite|esc-pop/);
      expect(typeName(v)).not.toMatch(/Citation/);
    });
    expect(textOf(tree)).not.toContain('⟦');
  });
  it('leaves no stray space before punctuation where a marker was removed', () => {
    const t = textOf(tree);
    expect(t).toContain('You lifted 100 kg.');
    expect(t).toContain('Protein helps.');
    expect(t).not.toMatch(/ [.,]/);
  });
  it('shows no evidence rating or source title from the card', () => {
    expect(allPatterns(textOf(tree)).source).toBe(false);
    expect(textOf(tree)).not.toMatch(/Evidence|strong|moderate/);
  });
});

describe('ESC-NC (d) lookup_knowledge sends no source titles', () => {
  it('has no sources key, by id and by query; the model still gets the rating', () => {
    for (const out of [lookupKnowledge({ ids: ['protein_intake', 'progressive_overload'] }), lookupKnowledge({ query: 'protein' })]) {
      expect(out.cards.length).toBeGreaterThan(0);
      for (const c of out.cards) { expect(c).not.toHaveProperty('sources'); expect(c).toHaveProperty('rating'); }
    }
  });
});

describe('ESC-NC (e) knowledge statements name no source', () => {
  it('no statement names an organisation, et al or an (Author Year)', () => {
    for (const c of KNOWLEDGE) expect(c.statement, c.id).not.toMatch(/\b(?:ACSM|NSCA|ISSN|WHO|et al)\b|\([A-Za-z][^()]* (?:19|20)\d{2}\)/);
  });
  it('progressive_overload says the guideline in plain words', () => {
    expect(KNOWLEDGE.find(c => c.id === 'progressive_overload')!.statement).toContain('A common guideline is a 2–10% load increase once you beat the target reps by 1–2.');
  });
});

// A stored conversation from before LR-23: its lookup_knowledge result still carries sources and rating.
function oldConversation(): Conversation {
  const c = newConversation('test', 'chat');
  const oldResult = JSON.stringify({ data: { cards: [{ id: 'protein_intake', title: 'Protein intake', statement: 'Protein helps.', numbers: [], rating: 'strong', sources: [{ title: 'Morton et al. meta-analysis', year: 2018 }] }] }, facts: {} });
  c.messages = [
    { role: 'user', content: [{ type: 'text', text: 'I don’t want to be here anymore' }] },
    { role: 'assistant', content: [{ type: 'tool_use', id: 'tu_k', name: 'lookup_knowledge', input: { query: 'protein' } }, { type: 'tool_use', id: 'tu_e', name: 'escalate', input: { kind: 'crisis', note: 'Mentions not wanting to be here; see Samaritans' } }], meta: { rendered: {} } },
    { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu_k', content: oldResult }, { type: 'tool_result', tool_use_id: 'tu_e', content: JSON.stringify({ data: { shown: true, kind: 'crisis' }, facts: {} }) }] },
    { role: 'assistant', content: [{ type: 'text', text: 'I’m here with you.' }], meta: { rendered: { answer: 'I’m here with you.' } } },
  ] as Conversation['messages'];
  return c;
}

describe('ESC-NC D-LR23-3 the drawer hides sources, rating and escalate notes, even from stored old results', () => {
  const view = EscobarTurnView({ conv: oldConversation(), indexes: [1, 2, 3] });
  let drawer: Node | undefined;
  walk(view, v => { if (typeName(v) === 'Drawer') drawer = v; });
  it('still shows the drawer', () => { expect(drawer).toBeTruthy(); });
  const open = (id: string) => { h.show = id; return drawer ? (drawer.type as (p: unknown) => unknown)(drawer.props) : null; };
  it('keeps the statement the model saw, drops sources and rating', () => {
    const t = textOf(open('tu_k'));
    expect(t).toContain('Protein helps.');
    expect(t).not.toMatch(/sources|Morton|meta-analysis|rating|strong/);
  });
  it('does not show the escalate note', () => {
    const t = textOf(open('tu_e'));
    expect(t).toContain('kind crisis');
    expect(t).not.toMatch(/Samaritans|note/);
  });
});

describe('ESC-NC A3 the crisis and medical cards still appear through both routes, with the new copy', () => {
  it('the app’s own word check raises them for the owner’s two phone-check lines', () => {
    expect(safetySignals("I don't want to be here anymore")).toContain('crisis');
    expect(safetySignals('chest pain during my set')).toContain('medical');
  });
  it('the model’s escalate call draws the card', () => {
    const cards: Node[] = [];
    walk(EscobarTurnView({ conv: oldConversation(), indexes: [1, 2, 3] }), v => { if (v.type === Escalation) cards.push(v); });
    expect(cards.map(c => c.props.kind)).toEqual(['crisis']);
  });
  it('both kinds render the new copy', () => {
    for (const kind of ['crisis', 'medical'] as const) expect(textOf(Escalation({ kind }))).toContain(NEW_COPY[kind]);
  });
});

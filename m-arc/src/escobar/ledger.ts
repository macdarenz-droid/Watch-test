/**
 * The fact ledger (§14.1). Every tool result is flattened into numbered facts so the
 * model can cite them (⟦f12⟧) and the verifier can check every number it writes.
 * Ids are sequential per conversation and deterministic, so replays reproduce them.
 */
import type { Fact } from './types';

/** "1,500" is a thousands group, "11,9" a decimal comma (ported from the old grounding.ts). */
export function extractNumbers(text: string): number[] {
  return (text.match(/-?\d+(?:[.,]\d+)?/g) ?? []).map(raw => {
    const grouped = /^(-?\d+),(\d{3})$/.exec(raw);
    return parseFloat(grouped ? raw.replace(',', '') : raw.replace(',', '.'));
  }).filter(n => Number.isFinite(n));
}

const DATE_LIKE = /^\d{4}-\d{2}(-\d{2})?([T ][\d:.]+Z?)?$/;
const ID_KEY = /(^id$|Id$|_id$|^ref$|^component$|^unit$|^kind$|^code$|^mode$|^status$|^band$|^source$|^severity$|^category$)/;
const CONTEXT_KEYS = ['exercise', 'name', 'muscle', 'label', 'title', 'day', 'week', 'metric', 'split', 'kind', 'op'];
/** Facts from one tool result, at most. The rest of the data still reaches the model. */
export const MAX_FACTS_PER_RESULT = 60;

function unitFor(key: string, parentUnit?: string): string | undefined {
  const k = key.toLowerCase();
  if (/kg$|kg[A-Z_]|^kg/.test(key) || k.endsWith('kg')) return 'kg';
  if (k === 'value' && parentUnit) return parentUnit;
  if (/pct|percent/.test(k)) return '%';
  if (/hours|inhours|^h$/.test(k)) return 'h';
  if (/bpm|hr$|restinghr/.test(k)) return 'bpm';
  if (/minutes|min$/.test(k)) return 'min';
  if (/sec$|seconds/.test(k)) return 's';
  if (/kcal|calories/.test(k)) return 'kcal';
  if (/cm$/.test(k)) return 'cm';
  if (/days?$/.test(k) && !/^day$/.test(k)) return 'days';
  return undefined;
}

function contextOf(obj: Record<string, unknown>): string {
  const bits: string[] = [];
  for (const k of CONTEXT_KEYS) {
    const v = obj[k];
    if (typeof v === 'string' && v.length <= 48 && !bits.includes(v)) bits.push(v);
  }
  return bits.join(' ');
}

interface Leaf { label: string; value: number; unit?: string }

/** Every number in a JSON value, with a readable label built from its path and nearby names/days. */
export function flatten(data: unknown, prefix = ''): Leaf[] {
  const out: Leaf[] = [];
  const visit = (v: unknown, path: string[], ctx: string, parentUnit?: string): void => {
    if (out.length >= MAX_FACTS_PER_RESULT) return;
    const key = path[path.length - 1] ?? '';
    const label = (): string => [prefix, ctx, path.filter(p => !/^\d+$/.test(p)).slice(-2).join(' ')].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    if (typeof v === 'number' && Number.isFinite(v)) {
      out.push({ label: label(), value: v, unit: unitFor(key, parentUnit) });
    } else if (typeof v === 'string') {
      if (ID_KEY.test(key) || DATE_LIKE.test(v)) return;
      for (const n of extractNumbers(v.replace(/\d{4}-\d{2}-\d{2}/g, ' ').replace(/\b\d{1,2}:\d{2}\b/g, ' '))) {
        if (out.length >= MAX_FACTS_PER_RESULT) return;
        out.push({ label: `${label()} (text)`, value: n });
      }
    } else if (Array.isArray(v)) {
      v.forEach((x, i) => visit(x, [...path, String(i)], ctx, parentUnit));
    } else if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>;
      const c = contextOf(o);
      const merged = [ctx, ...c.split(' ').filter(w => w && !ctx.includes(w))].filter(Boolean).join(' ').trim();
      const u = typeof o.unit === 'string' ? o.unit : parentUnit;
      for (const [k, x] of Object.entries(o)) visit(x, [...path, k], c ? merged : ctx, u);
    }
  };
  visit(data, [], '');
  return out;
}

const fmt = (n: number): string => String(Math.round(n * 1000) / 1000);

/** Registers the numbers in one tool result. Returns the new facts and the `facts` map sent to the model. */
export function captureFacts(existing: Fact[], tool: string, input: unknown, data: unknown, turn: number, labelPrefix = ''): { facts: Fact[]; map: Record<string, string> } {
  const leaves = flatten(data, labelPrefix);
  let n = existing.length;
  const facts: Fact[] = [];
  const map: Record<string, string> = {};
  for (const l of leaves) {
    const id = `f${++n}`;
    const fact: Fact = { id, value: l.value, label: l.label || tool, ...(l.unit ? { unit: l.unit } : {}), source: { tool, input }, turn };
    facts.push(fact);
    map[id] = `${fact.label} = ${fmt(l.value)}${l.unit ? ` ${l.unit}` : ''}`;
  }
  return { facts, map };
}

/** A single fact (from the brief or a card), appended with the next id. */
export function addFact(existing: Fact[], value: number, label: string, tool: string, turn: number, unit?: string): Fact {
  return { id: `f${existing.length + 1}`, value, label, ...(unit ? { unit } : {}), source: { tool }, turn };
}

export const factText = (f: Fact): string => `${f.label} = ${fmt(f.value)}${f.unit ? ` ${f.unit}` : ''}`;

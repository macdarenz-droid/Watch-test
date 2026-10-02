import { describe, it, expect } from 'vitest';
import generated from '../src/tools.generated.json';
import { FORMATS } from '../src/anthropic';

const FORBIDDEN = ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minLength', 'maxLength', 'pattern'];
type Node = Record<string, unknown>;
function walk(s: unknown, visit: (n: Node) => void): void {
  if (Array.isArray(s)) { s.forEach(x => walk(x, visit)); return; }
  if (!s || typeof s !== 'object') return;
  const n = s as Node;
  visit(n);
  for (const [k, v] of Object.entries(n)) {
    if (k === 'enum') continue;
    if (k === 'properties' && v && typeof v === 'object') { Object.values(v).forEach(x => walk(x, visit)); continue; }
    walk(v, visit);
  }
}

const tools = generated.tools as Array<{ name: string; input_schema: Node; strict?: boolean }>;

describe('strict-schema lint (§8, §12.8)', () => {
  it('no forbidden keywords in any tool or output format', () => {
    for (const s of [...tools.map(t => t.input_schema), ...Object.values(FORMATS)]) walk(s, n => {
      for (const k of FORBIDDEN) expect(k in n).toBe(false);
      for (const k of ['minItems', 'maxItems']) if (k in n) expect([0, 1]).toContain(n[k]);
      if (n.type === 'object') expect(n.additionalProperties).toBe(false);
    });
  });
  it('counts strict tools and their optional parameters within the documented complexity budget', () => {
    const strict = tools.filter(t => t.strict);
    let optional = 0;
    for (const t of strict) walk(t.input_schema, n => {
      if (n.type !== 'object') return;
      const props = Object.keys((n.properties as object) ?? {});
      optional += props.filter(p => !((n.required as string[]) ?? []).includes(p)).length;
    });
    // Limits confirmed once against the structured-outputs docs (see COACHING-DECISIONS.md): at most 20 strict tools and 24 optional parameters in strict schemas per request.
    expect(strict.length).toBeLessThanOrEqual(20);
    expect(optional).toBeLessThanOrEqual(24);
  });
  it('keeps union-typed parameters (type arrays or anyOf) in strict tools under the API limit of 16', () => {
    // The API rejects a request with more than 16 (seen live: "limit: 16 parameters with unions").
    let unions = 0;
    for (const t of tools.filter(x => x.strict)) walk(t.input_schema, n => { if (Array.isArray(n.type) || 'anyOf' in n) unions++; });
    expect(unions).toBeLessThanOrEqual(12);
  });
});

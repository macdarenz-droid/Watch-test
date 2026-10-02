import { describe, it, expect } from 'vitest';
import { TOOLS, TOOL_BY_NAME, apiTools, COMPONENT_PARAMS, READ_TOOL_NAMES, STRICT_TOOLS } from '@/escobar/tools/schema';
import { SHOW_COMPONENT_IDS } from '@/core/models';

const FORBIDDEN = ['minimum', 'maximum', 'exclusiveMinimum', 'exclusiveMaximum', 'multipleOf', 'minLength', 'maxLength', 'pattern', 'format'];

function walk(schema: unknown, visit: (node: Record<string, unknown>, path: string) => void, path = ''): void {
  if (Array.isArray(schema)) { schema.forEach((s, i) => walk(s, visit, `${path}[${i}]`)); return; }
  if (!schema || typeof schema !== 'object') return;
  const node = schema as Record<string, unknown>;
  visit(node, path);
  for (const [k, v] of Object.entries(node)) {
    if (k === 'enum') continue;
    // Keys of `properties` are parameter names, not schema keywords.
    if (k === 'properties' && v && typeof v === 'object') { for (const [pk, pv] of Object.entries(v)) walk(pv, visit, `${path}.properties.${pk}`); continue; }
    walk(v, visit, `${path}.${k}`);
  }
}

describe('tool schema', () => {
  it('names are unique and every tool has a kind, status and description saying when to use it', () => {
    expect(new Set(TOOLS.map(t => t.name)).size).toBe(TOOLS.length);
    for (const t of TOOLS) {
      expect(t.status.length, t.name).toBeGreaterThan(3);
      expect(t.description.length, t.name).toBeGreaterThan(40);
      expect(['read', 'show', 'act', 'memory', 'meta']).toContain(t.kind);
    }
  });
  it('covers the catalogue in §8', () => {
    for (const n of ['get_overview', 'get_sessions', 'get_session', 'get_exercise_history', 'get_next_target', 'get_recovery', 'get_readiness', 'get_volume', 'get_records', 'get_insights', 'get_plan', 'get_body', 'get_health', 'get_heart_session', 'get_live_session', 'search_exercises', 'get_exercise', 'get_equipment', 'find_in_app', 'explain_method', 'lookup_knowledge', 'calculate', 'evaluate_plan', 'show', 'navigate', 'pin_card', 'propose_split', 'propose_program', 'propose_schedule', 'propose_goal', 'propose_today', 'propose_deload', 'propose_start_session', 'propose_checkin', 'propose_profile', 'propose_custom_exercise', 'propose_reminder', 'propose_setting', 'snooze_insight', 'propose_equipment_profile', 'propose_gym', 'escalate', 'remember', 'forget', 'recall']) expect(TOOL_BY_NAME[n], n).toBeTruthy();
  });
  it('uses no keyword the API rejects, and item counts only 0 or 1', () => {
    for (const t of TOOLS) walk(t.input_schema, (node, path) => {
      for (const k of FORBIDDEN) expect(k in node, `${t.name}${path}.${k}`).toBe(false);
      for (const k of ['minItems', 'maxItems']) if (k in node) expect([0, 1]).toContain(node[k]);
    });
  });
  it('every object is closed with explicit properties and valid required keys', () => {
    for (const t of TOOLS) walk(t.input_schema, (node, path) => {
      if (node.type !== 'object') return;
      expect(node.additionalProperties, `${t.name}${path}`).toBe(false);
      expect(typeof node.properties, `${t.name}${path}`).toBe('object');
      for (const r of (node.required as string[]) ?? []) expect(Object.keys(node.properties as object), `${t.name}${path} requires ${r}`).toContain(r);
    });
  });
  it('strict only on the small flat tools (grammar size limit); every strict tool is an action or memory tool', () => {
    for (const t of TOOLS) expect(!!t.strict, t.name).toBe(STRICT_TOOLS.has(t.name));
    for (const name of STRICT_TOOLS) expect(['act', 'memory']).toContain(TOOLS.find(t => t.name === name)?.kind);
  });
  it('gated tools are the health and body ones', () => {
    expect(TOOLS.filter(t => t.gate).map(t => `${t.name}:${t.gate}`).sort()).toEqual(['get_body:body', 'get_health:health', 'get_heart_session:health']);
  });
  it('show params cover every component', () => {
    for (const c of SHOW_COMPONENT_IDS) expect(COMPONENT_PARAMS[c], c).toBeTruthy();
  });
  it('the API subset drops app-only fields', () => {
    const api = apiTools();
    expect(api).toHaveLength(TOOLS.length);
    for (const t of api) expect(Object.keys(t).sort()).toEqual(expect.arrayContaining(['description', 'input_schema', 'name']));
    expect(api.some(t => 'kind' in t || 'status' in t || 'gate' in t)).toBe(false);
  });
  it('read tools for the brief are all read-only', () => {
    expect(READ_TOOL_NAMES).toContain('get_insights');
    expect(READ_TOOL_NAMES.every(n => TOOL_BY_NAME[n]!.kind === 'read')).toBe(true);
  });
});

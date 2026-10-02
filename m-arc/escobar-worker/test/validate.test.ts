import { describe, it, expect } from 'vitest';
import { validateTurn, stepsSinceUser, REPAIR_MARKER, MAX_SYSTEM_BYTES } from '../src/validate';
import { turn } from './helpers';

const v = (b: unknown) => validateTurn(b, JSON.stringify(b).length);
const reason = (b: unknown) => { const r = v(b); return r.ok ? 'ok' : r.message; };
const user = (text: string) => ({ role: 'user', content: [{ type: 'text', text }] });
const toolUse = (id: string, name = 'get_overview') => ({ role: 'assistant', content: [{ type: 'thinking', thinking: '', signature: 'sig' }, { type: 'tool_use', id, name, input: {} }] });
const toolResult = (id: string) => ({ role: 'user', content: [{ type: 'tool_result', tool_use_id: id, content: '{"data":{}}' }] });

describe('POST /v2/turn validation (§12.2)', () => {
  it('accepts a normal turn', () => expect(v(turn()).ok).toBe(true));
  it('refuses effort-only system messages (PL-06)', () => {
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: [], output_config: { effort: 'max' } }] }))).toBe('effort-only system messages are not accepted');
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: 'now: tue', output_config: { effort: 'max' } }] }))).toBe('effort-only system messages are not accepted');
  });
  it('caps system text at 48 KB, measured in bytes (PL-06)', () => {
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: 'x'.repeat(MAX_SYSTEM_BYTES) }] }))).toBe('ok');
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: 'x'.repeat(MAX_SYSTEM_BYTES + 1) }] }))).toMatch(/system text over 48 KB/);
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: 'é'.repeat(MAX_SYSTEM_BYTES / 2 + 1) }] }))).toMatch(/system text over 48 KB/);
  });
  it('user text blocks accept no cache_control (PL-12)', () => {
    expect(reason(turn({ messages: [{ role: 'user', content: [{ type: 'text', text: 'hi', cache_control: { type: 'ephemeral' } }] }] }))).toMatch(/unknown key cache_control/);
  });
  it('rejects unknown and blocked top-level keys', () => {
    expect(reason(turn({ extra: 1 }))).toMatch(/unknown key extra/);
    for (const k of ['profile', 'name', 'email', 'sessions']) expect(reason(turn({ [k]: 'x' }))).toMatch(/not accepted/);
  });
  it('checks protocol, mode, unit, tone and manifest', () => {
    expect(reason(turn({ protocol: 1 }))).toMatch(/protocol/);
    expect(reason(turn({ mode: 'poetry' }))).toMatch(/mode/);
    expect(reason(turn({ unit: 'stone' }))).toMatch(/unit/);
    expect(reason(turn({ tone: 'rude' }))).toMatch(/tone/);
    expect(reason(turn({ manifest: { hash: 'x' } }))).toMatch(/manifest/);
    expect(reason(turn({ manifest: { hash: 'x', body: { big: 'y'.repeat(41_000) } } }))).toMatch(/40 KB/);
  });
  it('the first message must be user; system placement is enforced', () => {
    expect(reason(turn({ messages: [{ role: 'assistant', content: [] }] }))).toMatch(/first message/);
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: 'b' }, user('c')] }))).toMatch(/last or followed by an assistant/);
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: 'b' }, toolUse('t1'), toolResult('t1')] }))).toBe('ok');
    // PL-06: effort-only system messages were accepted; the app never sends them, so they are refused.
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: [], output_config: { effort: 'high' } }] }))).toBe('effort-only system messages are not accepted');
    expect(reason(turn({ messages: [user('a'), { role: 'system', content: [], output_config: { effort: 'turbo' } }] }))).toMatch(/effort/);
  });
  it('user blocks are strict; assistant blocks pass through by type', () => {
    expect(reason(turn({ messages: [{ role: 'user', content: [{ type: 'text', text: 'hi', meta: 1 }] }] }))).toMatch(/unknown key meta/);
    expect(reason(turn({ messages: [{ role: 'user', content: [{ type: 'image_ref', id: 'x' }] }] }))).toMatch(/not allowed/);
    const withCitations = { role: 'assistant', content: [{ type: 'text', text: 'ok', citations: null }] };
    expect(reason(turn({ messages: [user('a'), withCitations, user('b')] }))).toBe('ok');
    expect(reason(turn({ messages: [user('a'), { role: 'assistant', content: [{ type: 'server_tool_use' }] }] }))).toMatch(/not allowed/);
  });
  it('tool_use names must exist and tool_results must match a preceding tool_use', () => {
    expect(reason(turn({ messages: [user('a'), toolUse('t1', 'rm_rf')] }))).toMatch(/unknown tool rm_rf/);
    expect(reason(turn({ messages: [user('a'), toolUse('t1'), toolResult('t2')] }))).toMatch(/unknown tool_use_id/);
    expect(reason(turn({ messages: [user('a'), toolUse('t1'), toolResult('t1')] }))).toBe('ok');
  });
  it('images: base64 jpeg/png/webp, 1.2 MB each, 2 per request', () => {
    const img = (data = 'AAAA') => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data } });
    expect(reason(turn({ messages: [{ role: 'user', content: [img(), { type: 'text', text: 'rack' }] }] }))).toBe('ok');
    expect(reason(turn({ messages: [{ role: 'user', content: [img(), img(), img()] }] }))).toMatch(/at most 2 images/);
    expect(reason(turn({ messages: [{ role: 'user', content: [img('A'.repeat(1_200_001))] }] }))).toMatch(/1.2 MB/);
    expect(reason(turn({ messages: [{ role: 'user', content: [{ type: 'image', source: { type: 'url', url: 'http://x' } }] }] }))).toMatch(/base64/);
  });
  it('size limits: 3 MB body, 400 KB text, 600 messages', () => {
    expect(validateTurn(turn(), 3_000_001).ok).toBe(false);
    expect(reason(turn({ messages: [user('x'.repeat(401_000))] }))).toMatch(/400 KB/);
    const many = Array.from({ length: 601 }, (_, i) => (i % 2 ? { role: 'assistant', content: [{ type: 'text', text: 'k' }] } : user('q')));
    expect(reason(turn({ messages: many }))).toMatch(/at most 600/);
  });
  it('step ceiling counts assistant messages since the last real user message', () => {
    const chain: unknown[] = [user('go')];
    for (let i = 0; i < 15; i++) { chain.push(toolUse(`t${i}`)); chain.push(toolResult(`t${i}`)); }
    const r = v(turn({ messages: chain }));
    expect(!r.ok && r.code).toBe('too_many_steps');
    const repaired = [...chain.slice(0, 5), { role: 'user', content: [{ type: 'text', text: REPAIR_MARKER }] }];
    expect(stepsSinceUser(repaired as never)).toBe(2);
    expect(stepsSinceUser([user('a'), toolUse('x'), user('b')] as never)).toBe(0);
  });
});

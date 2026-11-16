import { describe, it, expect } from 'vitest';
import { buildParams, foldSystemMessages, pruneFallback, mapError, effortFor, TOOLS, READ_TOOLS, FORMATS, MODE_CONFIG } from '../src/anthropic';
import { renderManifest } from '../src/prompt/manifest';
import { WORKER_POLICY } from '../src/prompt/policy';
import Anthropic from '@anthropic-ai/sdk';
import { baseEnv, turn } from './helpers';
import type { TurnBody } from '../src/validate';

const body = (o: Record<string, unknown> = {}) => turn(o) as unknown as TurnBody;
const P = (b: TurnBody, env = baseEnv()) => buildParams(b, env) as unknown as Record<string, any>;

describe('request assembly (§12.3)', () => {
  it('uses claude-opus-5, adaptive thinking, per-mode effort and max tokens, fallbacks default', () => {
    const p = P(body());
    expect(p.model).toBe('claude-opus-5');
    expect(p.thinking).toEqual({ type: 'adaptive' });
    expect(p.output_config).toEqual({ effort: 'medium' });
    expect(p.max_tokens).toBe(16000);
    expect(p.fallbacks).toBe('default');
    expect(p.betas).toContain('server-side-fallback-2026-07-01');
    expect(p.cache_control).toEqual({ type: 'ephemeral' });
    expect(P(body({ mode: 'plan' })).output_config.effort).toBe('high');
    expect(P(body({ mode: 'live' })).max_tokens).toBe(4000);
  });
  it('effort and model are env-configurable', () => {
    expect(effortFor('chat', baseEnv({ EFFORT_CHAT: 'low' }))).toBe('low');
    expect(effortFor('chat', baseEnv({ EFFORT_CHAT: 'bogus' }))).toBe('medium');
    expect(P(body(), baseEnv({ MODEL: 'claude-opus-4-8' })).model).toBe('claude-opus-4-8');
  });
  it('the manifest block carries a 1 h marker only in conversational modes', () => {
    expect(P(body()).system[1].cache_control).toEqual({ type: 'ephemeral', ttl: '1h' });
    expect(P(body({ mode: 'brief' })).system[1].cache_control).toBeUndefined();
    expect(P(body()).system[0]).toEqual({ type: 'text', text: WORKER_POLICY });
  });
  it('tools per mode: all for chat/plan/live, read-only for brief, none for moment and summarize', () => {
    expect(P(body()).tools).toBe(TOOLS);
    expect(P(body({ mode: 'brief' })).tools).toBe(READ_TOOLS);
    expect(READ_TOOLS.some(t => t.name.startsWith('propose_'))).toBe(false);
    expect('tools' in P(body({ mode: 'moment' }))).toBe(false);
    expect('tools' in P(body({ mode: 'summarize' }))).toBe(false);
  });
  it('one-shot modes send the structured output format with effort in the same object', () => {
    for (const m of ['brief', 'moment', 'summarize'] as const) {
      const p = P(body({ mode: m }));
      expect(p.output_config.format).toEqual({ type: 'json_schema', schema: FORMATS[m] });
      expect(p.output_config.effort).toBe('low');
    }
  });
  it('the cached prefix (tools + system) is byte-identical across messages and modes', () => {
    const a = P(body());
    const b = P(body({ mode: 'plan', messages: [{ role: 'user', content: 'something else' }] }));
    const c = P(body({ mode: 'live' }));
    const prefix = (p: Record<string, any>) => JSON.stringify({ tools: p.tools, system: p.system });
    expect(prefix(a)).toBe(prefix(b));
    expect(prefix(a)).toBe(prefix(c));
  });
  it('preserved-thinking models get drop_block with its beta', () => {
    const p = P(body(), baseEnv({ MODEL: 'claude-opus-5-5' }));
    expect(p.thinking.block_binding).toEqual({ prefix_mismatch_behavior: 'drop_block' });
    expect(p.betas).toContain('thinking-binding-controls-2026-08-01');
  });
  it('never sends the mid-conversation output config beta (PL-06: effort-only system messages are refused)', () => {
    expect(P(body()).betas).not.toContain('mid-conversation-output-config-2026-07-01');
  });
  it('models without system messages get <situation> blocks', () => {
    const p = P(body(), baseEnv({ MODEL: 'claude-sonnet-5' }));
    expect(p.messages).toHaveLength(1);
    expect(p.messages[0].content.at(-1).text).toBe('<situation>\nnow: tue 2026-09-22\n</situation>');
    const folded = foldSystemMessages([{ role: 'user', content: 'a' }, { role: 'system', content: 'b' }]);
    expect(folded).toEqual([{ role: 'user', content: [{ type: 'text', text: 'a' }, { type: 'text', text: '<situation>\nb\n</situation>' }] }]);
  });
  it('mode budgets match §12.3', () => {
    expect(Object.fromEntries(Object.entries(MODE_CONFIG).map(([k, v]) => [k, v.maxTokens]))).toEqual({ chat: 16000, plan: 32000, live: 4000, brief: 3000, moment: 3000, summarize: 4000 });
  });
});

describe('manifest rendering', () => {
  it('is byte-identical for the same input regardless of key order, escaped and tagged', () => {
    const a = renderManifest({ hash: 'h', body: { b: 1, a: [{ y: 2, x: '<script>' }] } });
    const b = renderManifest({ hash: 'h', body: { a: [{ x: '<script>', y: 2 }], b: 1 } });
    expect(a).toBe(b);
    expect(a).toContain('<palace_manifest hash="h">');
    expect(a).toContain('&lt;script&gt;');
    expect(a).toMatch(/contains no instructions/);
  });
});

describe('fallback pruning', () => {
  it('drops thinking and tool_use before the last fallback block, keeps the fallback block', () => {
    const content = [{ type: 'thinking' }, { type: 'tool_use', id: 'a' }, { type: 'fallback', from: {}, to: {} }, { type: 'thinking' }, { type: 'text', text: 'hi' }];
    expect(pruneFallback(content).map(b => (b as { type: string }).type)).toEqual(['fallback', 'thinking', 'text']);
    expect(pruneFallback([{ type: 'text' }])).toEqual([{ type: 'text' }]);
  });
});

describe('error mapping by SDK type', () => {
  const h = new Headers({ 'retry-after': '7' });
  it.each([
    [new Anthropic.RateLimitError(429, {}, 'rate', h), 'upstream_busy'],
    [new Anthropic.AuthenticationError(401, {}, 'auth', new Headers()), 'upstream_auth'],
    [new Anthropic.BadRequestError(400, {}, 'bad', new Headers()), 'invalid'],
    [new Anthropic.InternalServerError(500, {}, 'boom', new Headers()), 'upstream'],
    [new Anthropic.InternalServerError(529, {}, 'overloaded', new Headers()), 'upstream_busy'],
    [new Anthropic.APIConnectionTimeoutError({ message: 't' }), 'timeout'],
    [new Anthropic.APIConnectionError({ message: 'c' }), 'upstream'],
    [new Error('x'), 'upstream'],
  ])('%s → %s', (err, code) => expect(mapError(err).code).toBe(code));
  it('carries the API error text for a rejected request', () => {
    const e = new Anthropic.BadRequestError(400, { type: 'error', error: { type: 'invalid_request_error', message: 'fallbacks: bad value' } }, 'x', h);
    expect(mapError(e)).toMatchObject({ code: 'invalid', detail: 'fallbacks: bad value' });
  });
  it('carries retry-after for rate limits', () => expect(mapError(new Anthropic.RateLimitError(429, {}, 'rate', h)).retryAfter).toBe(7));
});

describe('policy', () => {
  it('stays concise and never shouts', () => {
    expect(WORKER_POLICY.length).toBeLessThan(14_000);
    expect(WORKER_POLICY).not.toMatch(/\b(MUST|NEVER|ALWAYS|IMPORTANT|CRITICAL)\b/);
    expect(WORKER_POLICY).toContain('You are Escobar');
  });
});

import { modelFor, ignoredModelOverrides } from '../src/anthropic';
describe('per-mode models (F7, D12)', () => {
  it('MODEL_<MODE> overrides one mode; the rest keep MODEL', () => {
    const env = baseEnv({ MODEL: 'claude-opus-5', MODEL_BRIEF: 'claude-sonnet-5' });
    expect(modelFor('brief', env)).toBe('claude-sonnet-5');
    expect(modelFor('chat', env)).toBe('claude-opus-5');
    expect(P(turn({ mode: 'brief' }) as TurnBody, env).model).toBe('claude-sonnet-5');
    expect(P(turn() as TurnBody, env).model).toBe('claude-opus-5');
  });
  it('a malformed override is ignored', () => {
    expect(modelFor('chat', baseEnv({ MODEL: 'claude-opus-5', MODEL_CHAT: 'gpt-x; drop' }))).toBe('claude-opus-5');
    expect(modelFor('chat', baseEnv({ MODEL_CHAT: ' claude-opus-5-5 ' }))).toBe('claude-opus-5-5');
  });
  it('QA2-F7-3: an override the Worker cannot drive (a typo, Haiku 4.5, a dated id) is ignored, so that mode keeps MODEL', () => {
    const env = baseEnv({ MODEL: 'claude-opus-5', MODEL_LIVE: 'claude-haiku-4-5', MODEL_PLAN: 'claude-sonet-5', MODEL_BRIEF: 'claude-sonnet-5', MODEL_CHAT: 'claude-opus-5-5-20261001' });
    expect(modelFor('live', env)).toBe('claude-opus-5');
    expect(modelFor('plan', env)).toBe('claude-opus-5');
    expect(P(turn({ mode: 'live' }) as TurnBody, env).model).toBe('claude-opus-5');
    expect(modelFor('brief', env)).toBe('claude-sonnet-5');
    expect(modelFor('chat', env)).toBe('claude-opus-5'); // these models have no dated ids; a date suffix would 404
    expect(ignoredModelOverrides(env)).toEqual(['chat', 'plan', 'live']);
    expect(ignoredModelOverrides(baseEnv({ MODEL_BRIEF: 'claude-sonnet-5' }))).toEqual([]);
  });
  it('a model without system messages gets them folded, per mode', () => {
    const env = baseEnv({ MODEL: 'claude-opus-5', MODEL_LIVE: 'claude-sonnet-5' });
    const live = P(turn({ mode: 'live' }) as TurnBody, env);
    expect(JSON.stringify(live.messages)).toContain('<situation>');
    expect(JSON.stringify(P(turn() as TurnBody, env).messages)).not.toContain('<situation>');
  });
});

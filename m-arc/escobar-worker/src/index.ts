/** marc-coach Worker entry: Escobar v2 (protocol 2). The Anthropic key lives in the ANTHROPIC_API_KEY secret. */
import Anthropic from '@anthropic-ai/sdk';
import { handle } from './handler';
import { handleErrors } from './errorsHandler';
import { dailyPurge } from './errorsStore';
import type { ClientLike, Env } from './anthropic';

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);
    if (url.pathname === '/errors' || url.pathname === '/errors/summary' || url.pathname === '/reports') return handleErrors(req, env, { now: () => Date.now() });
    return handle(req, env, {
      makeClient: e => new Anthropic({ apiKey: e.ANTHROPIC_API_KEY, maxRetries: 1 }) as unknown as ClientLike,
      now: () => Date.now(),
      requestId: () => crypto.randomUUID(),
      waitUntil: p => ctx.waitUntil(p),
    });
  },
  /** Daily cron (wrangler.toml [triggers]): deletes error and content reports past 90 days and old rate counters. */
  async scheduled(_c: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(dailyPurge(env.ERRORS_DB, Date.now()));
  },
};

export { QuotaCounter } from './quotaDO';
export { UpstreamRelay } from './upstreamRelay';

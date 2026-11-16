// Cloudflare entry: static files from ASSETS (with the app's security headers); /api, /s and /health go to one
// SQLite-backed Durable Object so every write has a single, consistent owner.
import { DurableObject } from 'cloudflare:workers'
import { handle, isDynamic, secure } from './app.ts'
import { durableSql } from './sql.ts'
import { Store } from './store.ts'

export interface Env {
  RELAY: DurableObjectNamespace<RelayStore>
  ASSETS: Fetcher
  OWNER_KEY?: string
  MAX_FILE_MB?: string
}

export class RelayStore extends DurableObject<Env> {
  store: Store
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env)
    this.store = new Store(durableSql(ctx.storage))
  }
  override fetch(req: Request): Promise<Response> {
    return handle(req, {
      store: this.store,
      ownerKey: this.env.OWNER_KEY,
      maxFileBytes: (Number(this.env.MAX_FILE_MB) || 25) * 1048576,
      ip: req.headers.get('cf-connecting-ip') ?? '',
    })
  }
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url)
    if (isDynamic(url.pathname)) return env.RELAY.get(env.RELAY.idFromName('main')).fetch(req)
    let res = await env.ASSETS.fetch(req)
    // Client-side routes (/p/…) get the app shell.
    if (res.status === 404 && (req.method === 'GET' || req.method === 'HEAD') && !/\.\w+$/.test(url.pathname))
      res = await env.ASSETS.fetch(new Request(new URL('/', url), req))
    return secure(res, url.protocol === 'https:')
  },
} satisfies ExportedHandler<Env>

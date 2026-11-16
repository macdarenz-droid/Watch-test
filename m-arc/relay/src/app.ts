// Platform-agnostic HTTP layer: owner API (/api), agent links (/s/<token>), health. Adapters: worker.ts, node.ts.
import { HttpError, Store, asKind, cleanName, permsOf, type Author, type FileMeta, type Link } from './store.ts'
import { agentRoute } from './agent.ts'
import { mcpRoute } from './mcp.ts'
import { isImage, isText } from '../public/shared.js'

export interface Options {
  store: Store
  ownerKey?: string
  maxFileBytes: number
  ip: string
}

export interface Ctx extends Options {
  req: Request
  url: URL
  https: boolean
}

const CSP_APP =
  "default-src 'self'; img-src 'self' data: blob:; media-src 'self' blob:; style-src 'self'; script-src 'self'; connect-src 'self'; " +
  "frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'none'"

/** Paths the app answers; everything else is a static file from public/. */
export const isDynamic = (path: string) => /^\/(api|s|\.well-known)(\/|$)/.test(path) || path === '/health' || path === '/robots.txt'

export function secure(res: Response, https: boolean): Response {
  const h = new Headers(res.headers)
  h.set('X-Content-Type-Options', 'nosniff')
  h.set('Referrer-Policy', 'no-referrer')
  h.set('X-Robots-Tag', 'noindex, nofollow')
  if (!h.has('X-Frame-Options')) h.set('X-Frame-Options', 'SAMEORIGIN')
  if (!h.has('Content-Security-Policy') && /text\/html/.test(h.get('Content-Type') ?? '')) h.set('Content-Security-Policy', CSP_APP)
  if (https) h.set('Strict-Transport-Security', 'max-age=31536000')
  return new Response(res.status === 204 || res.status === 304 ? null : res.body, { status: res.status, statusText: res.statusText, headers: h })
}

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })

const mb = (n: number) => `${Math.round(n / 1048576) || 1} MB`

/** Reads at most `max` bytes, whatever Content-Length says (or does not say, when chunked). */
export async function readBody(req: Request, max: number, what = 'Request body'): Promise<Uint8Array> {
  const tooBig = () => new HttpError(413, `${what} is larger than ${mb(max)}`)
  if (Number(req.headers.get('content-length') ?? 0) > max) throw tooBig()
  if (!req.body) return new Uint8Array(0)
  const reader = req.body.getReader()
  const parts: Uint8Array[] = []
  let n = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    n += value.byteLength
    if (n > max) {
      await reader.cancel().catch(() => {})
      throw tooBig()
    }
    parts.push(value)
  }
  const out = new Uint8Array(n)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.byteLength
  }
  return out
}

export async function readForm(req: Request, max: number): Promise<FormData> {
  const bytes = await readBody(req, max, 'Upload')
  return new Response(bytes, { headers: { 'Content-Type': req.headers.get('content-type') ?? '' } }).formData()
}

export async function readJson(req: Request, max = 1_048_576): Promise<Record<string, unknown>> {
  const text = new TextDecoder().decode(await readBody(req, max))
  if (!text) return {}
  try {
    const v = JSON.parse(text)
    return v && typeof v === 'object' && !Array.isArray(v) ? v : {}
  } catch {
    throw new HttpError(400, 'Body is not valid JSON')
  }
}

export const readBytes = (req: Request, max: number) => readBody(req, max, 'File')

// ── rate limits (per process / Durable Object instance) ─────────
const hits = new Map<string, { n: number; reset: number }>()
export function limited(key: string, max: number, windowMs: number, count = true): boolean {
  const now = Date.now()
  let e = hits.get(key)
  if (!e || e.reset < now) hits.set(key, (e = { n: 0, reset: now + windowMs }))
  if (hits.size > 5000) for (const [k, v] of hits) if (v.reset < now) hits.delete(k)
  if (count) e.n++
  return e.n > max
}

// ── owner session ───────────────────────────────────────────────
const COOKIE = 'relay_s'
const SESSION_DAYS = 30
const enc = new TextEncoder()
const b64url = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

async function hmac(key: string, msg: string) {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  return b64url(await crypto.subtle.sign('HMAC', k, enc.encode(msg)))
}
function same(a: string, b: string) {
  if (a.length !== b.length) return false
  let d = 0
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return d === 0
}
const digest = async (s: string) => b64url(await crypto.subtle.digest('SHA-256', enc.encode(s)))
const keyMatches = async (given: string, key: string) => same(await digest(given), await digest(key))

async function sessionCookie(key: string, https: boolean) {
  const exp = Date.now() + SESSION_DAYS * 86_400_000
  const value = `${exp}.${await hmac(key, `relay-session.${exp}`)}`
  return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}${https ? '; Secure' : ''}`
}

/** 'cookie' | 'bearer' when the request is the owner's. */
async function ownerVia(c: Ctx): Promise<'cookie' | 'bearer' | null> {
  const key = c.ownerKey
  if (!key) return null
  const auth = c.req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) {
    // Bearer guesses share the login limit, so the key cannot be brute-forced through any endpoint.
    if (limited(`login:${c.ip}`, 10, 600_000, false)) throw new HttpError(429, 'Too many attempts. Try again in a few minutes.')
    if (await keyMatches(auth.slice(7).trim(), key)) return 'bearer'
    limited(`login:${c.ip}`, 10, 600_000)
    return null
  }
  const m = (c.req.headers.get('cookie') ?? '').match(new RegExp(`(?:^|;\\s*)${COOKIE}=(\\d+)\\.([\\w-]+)`))
  if (m && Number(m[1]) > Date.now() && same(m[2] ?? '', await hmac(key, `relay-session.${m[1]}`))) return 'cookie'
  return null
}

// ── raw files (shared with agent links) ──────────────────────────
export function rawResponse(req: Request, f: FileMeta, data: Uint8Array, download: boolean): Response {
  const etag = `"${f.id}-${f.updated_at}"`
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers: { ETag: etag } })
  const text = isText(f.name, f.mime)
  const inlineOk = text || isImage(f.mime) || /^(audio|video)\//.test(f.mime) || f.mime === 'application/pdf'
  const pdf = f.mime === 'application/pdf'
  return new Response(data, {
    headers: {
      'Content-Type': text ? 'text/plain; charset=utf-8' : inlineOk ? f.mime : 'application/octet-stream',
      'Content-Length': String(data.byteLength),
      'Content-Disposition': `${download || !inlineOk ? 'attachment' : 'inline'}; filename*=UTF-8''${encodeURIComponent(f.name).replace(/['()*]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase())}`,
      'Content-Security-Policy': `default-src 'none'; img-src 'self' data:; media-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'self'${pdf ? '' : '; sandbox'}`,
      'Cache-Control': 'private, no-cache',
      ETag: etag,
    },
  })
}

// ── owner API ───────────────────────────────────────────────────
type Handler = (c: Ctx, ...p: string[]) => Promise<Response> | Response
const ok = () => json({ ok: true })
const linkOut = (l: Link) => ({ ...l, perms: permsOf(l) })

function owner(c: Ctx, b: Record<string, unknown>): Author {
  return { author: b.author ? cleanName(b.author, 'Author', 60) : 'Owner', kind: b.kind ? asKind(b.kind) : 'human', via: 'owner' }
}

const API: [string, RegExp, Handler][] = [
  ['GET', /^\/api\/pulse$/, c => json({ seq: c.store.seq() })],
  ['GET', /^\/api\/projects$/, c => json({ projects: c.store.projects() })],
  ['POST', /^\/api\/projects$/, async c => json({ project: c.store.createProject(await readJson(c.req)) }, 201)],
  ['GET', /^\/api\/projects\/([\w-]+)$/, (c, id) => {
    const project = c.store.project(id)
    return json({ project, info: c.store.info(project.id), folders: c.store.folders(project.id), links: c.store.links(project.id).map(linkOut) })
  }],
  ['PATCH', /^\/api\/projects\/(\w+)$/, async (c, id) => {
    const b = await readJson(c.req)
    const info = b.info && typeof b.info === 'object' ? { ...(b.info as Record<string, unknown>) } : undefined
    if (info?.stage !== undefined) c.store.setStage(id, owner(c, {}), info.stage)
    if (info) delete info.stage
    return json({ project: c.store.updateProject(id, { ...b, info }), info: c.store.info(id) })
  }],
  ['GET', /^\/api\/projects\/(\w+)\/dashboard$/, (c, id) => json(c.store.dashboard(id))],
  ['POST', /^\/api\/projects\/(\w+)\/items$/, async (c, id) => {
    const b = await readJson(c.req)
    const ref = String(b.ref ?? '').trim().toLowerCase()
    if (c.store.items(id).some(i => i.ref.toLowerCase() === ref)) throw new HttpError(409, `An item with ID “${String(b.ref).trim()}” already exists`)
    return json({ item: c.store.upsertItem(id, owner(c, {}), b).item }, 201)
  }],
  ['PATCH', /^\/api\/items\/(\w+)$/, async (c, id) => json({ item: c.store.upsertItem(c.store.item(id).project_id, owner(c, {}), await readJson(c.req), id).item })],
  ['DELETE', /^\/api\/items\/(\w+)$/, (c, id) => (c.store.deleteItem(id, owner(c, {})), ok())],
  ['POST', /^\/api\/projects\/(\w+)\/components$/, async (c, id) => {
    const b = await readJson(c.req)
    const name = String(b.name ?? '').trim().toLowerCase()
    if (c.store.components(id).some(x => x.name.toLowerCase() === name)) throw new HttpError(409, `A component named “${String(b.name).trim()}” already exists`)
    return json({ component: c.store.upsertComponent(id, owner(c, {}), b).component }, 201)
  }],
  ['PATCH', /^\/api\/components\/(\w+)$/, async (c, id) => {
    const cur = c.store.sql.get<{ project_id: string }>(`SELECT project_id FROM components WHERE id = ?`, id)
    if (!cur) throw new HttpError(404, 'Component not found')
    return json({ component: c.store.upsertComponent(cur.project_id, owner(c, {}), await readJson(c.req), id).component })
  }],
  ['DELETE', /^\/api\/components\/(\w+)$/, (c, id) => (c.store.deleteComponent(id, owner(c, {})), ok())],
  ['DELETE', /^\/api\/projects\/(\w+)$/, (c, id) => (c.store.deleteProject(id), ok())],
  ['POST', /^\/api\/projects\/(\w+)\/folders$/, async (c, id) => {
    const b = await readJson(c.req)
    const p = c.store.project(id)
    const parent = c.store.folder(String(b.parent_id ?? p.root_id))
    if (parent.project_id !== p.id) throw new HttpError(400, 'Parent folder is not in this project')
    return json({ folder: c.store.createFolder(parent.id, b.name) }, 201)
  }],
  ['PATCH', /^\/api\/folders\/(\w+)$/, async (c, id) => json({ folder: c.store.updateFolder(id, await readJson(c.req)) })],
  ['DELETE', /^\/api\/folders\/(\w+)$/, (c, id) => (c.store.deleteFolder(id), ok())],
  ['GET', /^\/api\/folders\/(\w+)\/messages$/, (c, id) => {
    c.store.folder(id)
    const before = Number(c.url.searchParams.get('before')) || undefined
    return json(c.store.messages(id, { before, limit: Number(c.url.searchParams.get('limit')) || 100 }))
  }],
  ['POST', /^\/api\/folders\/(\w+)\/messages$/, async (c, id) => {
    const b = await readJson(c.req)
    return json({ message: c.store.createMessage(id, owner(c, b), b) }, 201)
  }],
  ['PATCH', /^\/api\/messages\/(\w+)$/, async (c, id) => json({ message: c.store.updateMessage(id, (await readJson(c.req)).body) })],
  ['DELETE', /^\/api\/messages\/(\w+)$/, (c, id) => (c.store.deleteMessage(id), ok())],
  ['GET', /^\/api\/folders\/(\w+)\/files$/, (c, id) => (c.store.folder(id), json({ files: c.store.files(id) }))],
  ['POST', /^\/api\/folders\/(\w+)\/files$/, async (c, id) => {
    c.store.folder(id)
    const data = await readBytes(c.req, c.maxFileBytes)
    const q = c.url.searchParams
    const who = owner(c, { author: q.get('author') || undefined, kind: q.get('kind') || undefined })
    return json({ file: c.store.createFile(id, who, { name: q.get('name'), mime: c.req.headers.get('content-type') ?? undefined, data }) }, 201)
  }],
  ['GET', /^\/api\/files\/(\w+)$/, (c, id) => json({ file: c.store.file(id) })],
  ['PATCH', /^\/api\/files\/(\w+)$/, async (c, id) => json({ file: c.store.updateFile(id, await readJson(c.req)) })],
  ['DELETE', /^\/api\/files\/(\w+)$/, (c, id) => (c.store.deleteFile(id), ok())],
  ['GET', /^\/api\/files\/(\w+)\/raw$/, (c, id) => {
    const f = c.store.file(id)
    return rawResponse(c.req, f, c.store.read(f.id), c.url.searchParams.has('download'))
  }],
  ['PUT', /^\/api\/files\/(\w+)\/raw$/, async (c, id) => {
    c.store.file(id)
    return json({ file: c.store.writeFile(id, await readBytes(c.req, c.maxFileBytes), { author: 'Owner', kind: 'human', via: 'owner' }) })
  }],
  ['POST', /^\/api\/projects\/(\w+)\/links$/, async (c, id) => json({ link: linkOut(c.store.createLink(id, await readJson(c.req))) }, 201)],
  ['PATCH', /^\/api\/links\/(\w+)$/, async (c, id) => json({ link: linkOut(c.store.setLinkPerms(id, (await readJson(c.req)).perms)) })],
  ['DELETE', /^\/api\/links\/(\w+)$/, (c, id) => (c.store.deleteLink(id), ok())],
  ['GET', /^\/api\/search$/, c => {
    const q = (c.url.searchParams.get('q') ?? '').trim().slice(0, 100)
    return json(q.length < 2 ? { messages: [], files: [] } : c.store.search(q))
  }],
]

async function api(c: Ctx): Promise<Response> {
  const path = c.url.pathname
  const method = c.req.method
  if (path === '/api/login' && method === 'POST') {
    if (!c.ownerKey) throw new HttpError(503, 'OWNER_KEY is not set on the server')
    if (limited(`login:${c.ip}`, 10, 600_000, false)) throw new HttpError(429, 'Too many attempts. Try again in a few minutes.')
    const { key } = await readJson(c.req, 4096)
    if (typeof key !== 'string' || !(await keyMatches(key, c.ownerKey))) {
      limited(`login:${c.ip}`, 10, 600_000)
      throw new HttpError(401, 'That key is not right')
    }
    return json({ owner: true }, 200, { 'Set-Cookie': await sessionCookie(c.ownerKey, c.https) })
  }
  if (path === '/api/logout' && method === 'POST')
    return json({ ok: true }, 200, { 'Set-Cookie': `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${c.https ? '; Secure' : ''}` })

  const via = await ownerVia(c)
  if (path === '/api/me' && method === 'GET') return json({ owner: !!via, configured: !!c.ownerKey })
  if (!via) throw new HttpError(401, 'Sign in first')
  // A cross-site form can carry the cookie on a top-level POST but never a custom header.
  if (via === 'cookie' && method !== 'GET' && method !== 'HEAD' && c.req.headers.get('x-relay') !== '1')
    throw new HttpError(403, 'Missing x-relay header')

  for (const [m, re, h] of API) {
    if (m !== method) continue
    const match = path.match(re)
    if (match) return h(c, ...match.slice(1).map(s => s ?? ''))
  }
  throw new HttpError(404, 'No such endpoint')
}

export async function handle(req: Request, o: Options): Promise<Response> {
  const url = new URL(req.url)
  const c: Ctx = { ...o, req, url, https: url.protocol === 'https:' }
  const asJson = url.pathname.startsWith('/api') || /json/.test(req.headers.get('content-type') ?? '') || /json/.test(req.headers.get('accept') ?? '')
  try {
    let res: Response
    if (url.pathname === '/health') res = json({ ok: true, app: 'relay', owner: !!o.ownerKey })
    else if (url.pathname === '/robots.txt') res = new Response('User-agent: *\nDisallow: /\n', { headers: { 'Content-Type': 'text/plain' } })
    else if (url.pathname.startsWith('/api')) res = await api(c)
    // No OAuth: MCP clients probe these and must get a 404, never the app shell.
    else if (url.pathname.startsWith('/.well-known/')) throw new HttpError(404, 'Not found')
    else if (/^\/s\/[^/]+\/mcp\/?$/.test(url.pathname)) res = await mcpRoute(c)
    else res = await agentRoute(c)
    return secure(res, c.https)
  } catch (e) {
    const status = e instanceof HttpError ? e.status : 500
    const message = e instanceof HttpError ? e.message : 'Something went wrong on the server'
    if (!(e instanceof HttpError)) console.error(e)
    const res = asJson
      ? json({ error: message }, status)
      : new Response(`${status} — ${message}\n`, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
    return secure(res, c.https)
  }
}

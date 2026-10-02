// Node entry for local development and self-hosting: node:sqlite + node:http, same app as the Worker.
//   PORT=8787  DATA_DIR=./.data  OWNER_KEY=…  MAX_FILE_MB=25
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { DatabaseSync } from 'node:sqlite'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { Readable } from 'node:stream'
import { dirname, extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { handle, isDynamic, secure } from './app.ts'
import { nodeSql } from './sql.ts'
import { Store, newToken } from './store.ts'

const here = dirname(fileURLToPath(import.meta.url))
const pub = resolve(here, '../public')
const dataDir = resolve(process.env.DATA_DIR ?? join(here, '../.data'))
mkdirSync(dataDir, { recursive: true })

// Without OWNER_KEY, generate one once and keep it next to the data.
let ownerKey = process.env.OWNER_KEY
const keyFile = join(dataDir, 'owner-key')
if (!ownerKey) {
  if (!existsSync(keyFile)) writeFileSync(keyFile, newToken().replace('rl_', 'key_') + '\n', { mode: 0o600 })
  ownerKey = readFileSync(keyFile, 'utf8').trim()
}

const db = new DatabaseSync(join(dataDir, 'relay.db'))
db.exec('PRAGMA journal_mode = WAL')
const store = new Store(nodeSql(db))
const maxFileBytes = (Number(process.env.MAX_FILE_MB) || 25) * 1048576
const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json',
}

async function serveStatic(url: URL): Promise<Response> {
  let path: string
  try {
    path = decodeURIComponent(url.pathname)
  } catch {
    return new Response('Bad request', { status: 400 })
  }
  let file = normalize(join(pub, path))
  if (!file.startsWith(pub)) return new Response('Not found', { status: 404 })
  if (url.pathname.endsWith('/') || !extname(file)) file = join(pub, 'index.html')
  try {
    return new Response(await readFile(file), { headers: { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' } })
  } catch {
    return new Response('Not found', { status: 404, headers: { 'Content-Type': 'text/plain' } })
  }
}

const port = Number(process.env.PORT ?? 8787)
async function serve(req: IncomingMessage, res: ServerResponse) {
  let url: URL
  try {
    url = new URL(req.url ?? '/', `http://${req.headers.host ?? 'localhost'}`)
  } catch {
    res.writeHead(400).end('Bad request')
    return
  }
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) if (v !== undefined) headers.set(k, Array.isArray(v) ? v.join(', ') : v)
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  const request = new Request(url, {
    method: req.method,
    headers,
    body: hasBody ? (Readable.toWeb(req) as ReadableStream) : undefined,
    // @ts-expect-error Node needs duplex for streamed request bodies
    duplex: 'half',
  })
  const out = isDynamic(url.pathname)
    ? await handle(request, { store, ownerKey, maxFileBytes, ip: req.socket.remoteAddress ?? '' })
    : secure(await serveStatic(url), false)
  res.writeHead(out.status, Object.fromEntries(out.headers))
  if (out.body && req.method !== 'HEAD') res.end(Buffer.from(await out.arrayBuffer()))
  else res.end()
}

// Nothing a request does may take the process down.
createServer((req, res) => {
  serve(req, res).catch(err => {
    console.error(err)
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain' })
    res.end('Server error')
  })
}).listen(port, () => {
  console.log(`Relay on http://localhost:${port}`)
  if (!process.env.OWNER_KEY) console.log(`Owner key (from ${keyFile}): ${ownerKey}`)
})

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { DatabaseSync } from 'node:sqlite'
import { handle } from '../src/app.ts'
import { nodeSql, type Sql, type Val } from '../src/sql.ts'
import { Store } from '../src/store.ts'
import { isText, renderMarkdown } from '../public/shared.js'

/** node:sqlite with the Durable Object's limits: 100 bound parameters, LIKE patterns of 50 bytes. */
function durableLimits(sql: Sql): Sql {
  const check = (q: string, a: Val[]) => {
    if (a.length > 100) throw new Error(`too many SQL variables (${a.length})`)
    if (/\bLIKE\b/i.test(q)) for (const v of a) if (typeof v === 'string' && new TextEncoder().encode(v).byteLength > 50) throw new Error('LIKE pattern too complex')
  }
  return {
    ...sql,
    all: (q, ...a) => (check(q, a), sql.all(q, ...a)),
    get: (q, ...a) => (check(q, a), sql.get(q, ...a)),
    run: (q, ...a) => (check(q, a), sql.run(q, ...a)),
  }
}

const KEY = 'test-owner-key-0123456789'
let ipN = 0

interface Call { body?: unknown; raw?: BodyInit; type?: string; headers?: Record<string, string>; auth?: boolean }

function setup() {
  const store = new Store(durableLimits(nodeSql(new DatabaseSync(':memory:'))))
  const ip = `10.0.0.${++ipN}`
  const call = (method: string, path: string, o: Call = {}) => {
    const headers: Record<string, string> = { ...(o.auth === false ? {} : { authorization: `Bearer ${KEY}` }), ...o.headers }
    if (o.body !== undefined) headers['content-type'] = 'application/json'
    if (o.type) headers['content-type'] = o.type
    const body = o.raw ?? (o.body !== undefined ? JSON.stringify(o.body) : undefined)
    return handle(new Request('https://relay.test' + path, { method, headers, body }), { store, ownerKey: KEY, maxFileBytes: 1 << 20, ip })
  }
  const j = async (method: string, path: string, o: Call = {}) => {
    const res = await call(method, path, o)
    return { status: res.status, data: (await res.json()) as any }
  }
  return { store, call, j }
}

test('first run seeds M/ARC with the software folders and a welcome message', async () => {
  const { j } = setup()
  const { data } = await j('GET', '/api/projects')
  assert.equal(data.projects.length, 1)
  assert.equal(data.projects[0].slug, 'm-arc')
  const d = (await j('GET', '/api/projects/m-arc')).data
  const names = d.folders.map((f: any) => f.name).sort()
  for (const n of ['agents', 'claude', 'gpt', 'handoffs', 'docs', 'architecture', 'decisions', 'design', 'tasks', 'releases']) assert.ok(names.includes(n), n)
  const msgs = (await j('GET', `/api/folders/${d.project.root_id}/messages`)).data
  assert.equal(msgs.messages.length, 1)
})

test('owner auth: bearer, login cookie, x-relay header on cookie writes, rate limit', async () => {
  const { call, j } = setup()
  assert.equal((await call('GET', '/api/projects', { auth: false })).status, 401)
  assert.equal((await j('POST', '/api/login', { auth: false, body: { key: 'nope' } })).status, 401)
  const ok = await call('POST', '/api/login', { auth: false, body: { key: KEY } })
  assert.equal(ok.status, 200)
  const cookie = (ok.headers.get('set-cookie') ?? '').split(';')[0] ?? ''
  assert.match(ok.headers.get('set-cookie') ?? '', /HttpOnly; SameSite=Lax.*Secure/)
  assert.equal((await call('GET', '/api/projects', { auth: false, headers: { cookie } })).status, 200)
  assert.equal((await call('POST', '/api/projects', { auth: false, headers: { cookie }, body: { name: 'X' } })).status, 403)
  assert.equal((await call('POST', '/api/projects', { auth: false, headers: { cookie, 'x-relay': '1' }, body: { name: 'X' } })).status, 201)
  assert.equal((await call('GET', '/api/projects', { auth: false, headers: { cookie: cookie.replace(/.$/, 'x') } })).status, 401)
  for (let i = 0; i < 10; i++) await call('POST', '/api/login', { auth: false, body: { key: 'wrong' } })
  assert.equal((await call('POST', '/api/login', { auth: false, body: { key: KEY } })).status, 429)
})

test('folders: unique names, no moving into itself, recursive delete', async () => {
  const { j, store } = setup()
  const p = (await j('POST', '/api/projects', { body: { name: 'Side', template: 'empty' } })).data.project
  const a = (await j('POST', `/api/projects/${p.id}/folders`, { body: { name: 'a' } })).data.folder
  const b = (await j('POST', `/api/projects/${p.id}/folders`, { body: { name: 'b', parent_id: a.id } })).data.folder
  assert.equal((await j('POST', `/api/projects/${p.id}/folders`, { body: { name: 'A' } })).status, 409)
  assert.equal((await j('POST', `/api/projects/${p.id}/folders`, { body: { name: '..' } })).status, 400)
  assert.equal((await j('PATCH', `/api/folders/${a.id}`, { body: { parent_id: b.id } })).status, 400)
  await j('POST', `/api/folders/${b.id}/messages`, { body: { body: 'hi' } })
  await j('POST', `/api/folders/${b.id}/files?name=x.txt`, { raw: 'x', type: 'text/plain' })
  assert.equal((await j('DELETE', `/api/folders/${a.id}`)).status, 200)
  assert.equal(store.sql.get(`SELECT COUNT(*) AS n FROM messages WHERE folder_id = ?`, b.id)?.n, 0)
  assert.equal(store.sql.get(`SELECT COUNT(*) AS n FROM chunks WHERE file_id NOT IN (SELECT id FROM files)`)?.n, 0)
})

test('messages carry attachments; files dedupe names and stream back exactly', async () => {
  const { j, call } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const root = d.project.root_id
  const bytes = new Uint8Array(2_500_000 % (1 << 20)).map((_, i) => i % 251)
  const f1 = (await j('POST', `/api/folders/${root}/files?name=plan.md`, { raw: '# Plan', type: 'text/markdown' })).data.file
  const f2 = (await j('POST', `/api/folders/${root}/files?name=plan.md`, { raw: bytes, type: 'application/octet-stream' })).data.file
  assert.equal(f2.name, 'plan (2).md')
  const m = (await j('POST', `/api/folders/${root}/messages`, { body: { body: '', kind: 'gpt', author: 'GPT-5.6', file_ids: [f1.id] } })).data.message
  assert.equal(m.kind, 'gpt')
  assert.equal(m.files[0].id, f1.id)
  const back = new Uint8Array(await (await call('GET', `/api/files/${f2.id}/raw`)).arrayBuffer())
  assert.deepEqual(back, bytes)
  assert.equal((await j('POST', `/api/folders/${root}/messages`, { body: { body: '  ' } })).status, 400)
})

test('raw files never execute: html is text/plain, unknown types download, sandbox CSP', async () => {
  const { j, call } = setup()
  const root = (await j('GET', '/api/projects/m-arc')).data.project.root_id
  const html = (await j('POST', `/api/folders/${root}/files?name=x.html`, { raw: '<script>alert(1)</script>', type: 'text/html' })).data.file
  const bin = (await j('POST', `/api/folders/${root}/files?name=x.bin`, { raw: 'zz', type: 'application/x-evil' })).data.file
  const r1 = await call('GET', `/api/files/${html.id}/raw`)
  assert.equal(r1.headers.get('content-type'), 'text/plain; charset=utf-8')
  assert.match(r1.headers.get('content-security-policy') ?? '', /sandbox/)
  const r2 = await call('GET', `/api/files/${bin.id}/raw`)
  assert.equal(r2.headers.get('content-type'), 'application/octet-stream')
  assert.match(r2.headers.get('content-disposition') ?? '', /^attachment/)
  assert.equal(r2.headers.get('x-content-type-options'), 'nosniff')
  assert.equal(r2.headers.get('referrer-policy'), 'no-referrer')
})

test('read-only agent link: html, markdown, json, scope, no writes, revoke', async () => {
  const { j, call, store } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const gpt = d.folders.find((f: any) => f.name === 'gpt')
  const docs = d.folders.find((f: any) => f.name === 'docs')
  await j('POST', `/api/folders/${gpt.id}/messages`, { body: { body: 'secret-in-gpt' } })
  await j('POST', `/api/folders/${docs.id}/messages`, { body: { body: 'secret-in-docs' } })
  const outside = (await j('POST', `/api/folders/${docs.id}/files?name=d.txt`, { raw: 'd', type: 'text/plain' })).data.file
  const link = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'GPT-5.6', kind: 'gpt', folder_id: gpt.id } })).data.link
  assert.match(link.token, /^rl_[A-Za-z0-9]{32}$/)
  const s = `/s/${link.token}`
  const page = await call('GET', s, { auth: false, headers: { accept: 'text/html' } })
  const html = await page.text()
  assert.equal(page.status, 200)
  assert.match(page.headers.get('content-security-policy') ?? '', /script-src 'self'/)
  assert.ok(html.includes('secret-in-gpt') && !html.includes('secret-in-docs'))
  assert.ok(html.includes('read-only') && !html.includes('<form'))
  const md = await (await call('GET', s, { auth: false, headers: { accept: 'text/markdown' } })).text()
  assert.ok(md.includes('secret-in-gpt') && md.includes('read-only'))
  const tree = await (await call('GET', `${s}/tree.json`, { auth: false })).json() as any
  assert.deepEqual(tree.folders.map((f: any) => f.path), [''])
  assert.equal((await call('GET', `${s}/f/..%2Fdocs`, { auth: false })).status, 400)
  assert.equal((await call('GET', `${s}/context.md?folder=../docs`, { auth: false })).status, 400)
  assert.equal((await call('GET', `${s}/raw/${outside.id}/d.txt`, { auth: false })).status, 404)
  assert.equal((await call('POST', `${s}/messages`, { auth: false, body: { folder: '', body: 'x' } })).status, 403)
  assert.equal((await call('GET', '/api/projects', { auth: false, headers: { authorization: `Bearer ${link.token}` } })).status, 401)
  store.deleteLink(link.id)
  assert.equal((await call('GET', s, { auth: false })).status, 404)
})

test('write agent link: post JSON and form, put files by path, mkdir, context.md', async () => {
  const { j, call } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const link = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'Claude Code', kind: 'claude', can_write: true } })).data.link
  const s = `/s/${link.token}`
  const posted = await call('POST', `${s}/messages`, { auth: false, body: { folder: 'agents/claude', body: 'Phase 0 done', author: 'Claude · Opus' } })
  assert.equal(posted.status, 201)
  const pm = (await posted.json()) as any
  assert.equal(pm.message.author, 'Claude · Opus')
  assert.equal((await call('POST', `${s}/messages`, { auth: false, body: { folder: 'nope', body: 'x' } })).status, 404)
  const put1 = await call('PUT', `${s}/files/docs/PROJECT_STATE.md`, { auth: false, raw: '# State v1', type: 'text/markdown' })
  assert.equal(put1.status, 201)
  const put2 = await call('PUT', `${s}/files/docs/PROJECT_STATE.md`, { auth: false, raw: '# State v2', type: 'text/markdown' })
  assert.equal(put2.status, 200)
  const mk = await call('POST', `${s}/folders`, { auth: false, body: { path: 'agents/codex/notes' } })
  assert.equal(((await mk.json()) as any).folder.path, 'agents/codex/notes')
  const form = new FormData()
  form.set('folder', 'agents/codex')
  form.set('body', 'from a browser agent')
  form.append('file', new File(['hello'], 'hello.txt', { type: 'text/plain' }))
  const viaForm = await call('POST', `${s}/messages`, { auth: false, raw: form, headers: { accept: 'text/html' } })
  assert.equal(viaForm.status, 303)
  assert.match(viaForm.headers.get('location') ?? '', /\/f\/agents\/codex#m-/)
  const ctx = await (await call('GET', `${s}/context.md`, { auth: false })).text()
  assert.ok(ctx.includes('# State v2') && !ctx.includes('# State v1'))
  assert.ok(ctx.includes('Phase 0 done') && ctx.includes('from a browser agent') && ctx.includes('hello.txt'))
  const who = (await j('GET', `/api/projects/${d.project.id}`)).data.folders.find((f: any) => f.name === 'claude')
  const msgs = (await j('GET', `/api/folders/${who.id}/messages`)).data.messages
  assert.equal(msgs[0].via, link.id)
  assert.equal(msgs[0].kind, 'claude')
})

test('markdown is escaped except for the supported constructs', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n\n[x](javascript:alert(1)) <img src=x onerror=alert(1)>\n\n**b** _i_ `c<d>` https://example.com/a?b=1.')
  assert.ok(!html.includes('<script') && !html.includes('<img'))
  assert.ok(!/href="\s*javascript/i.test(html))
  assert.ok(renderMarkdown('[x](javascript:alert)').includes('href="#"'))
  assert.ok(html.includes('<strong>b</strong>') && html.includes('<em>i</em>') && html.includes('<code>c&lt;d&gt;</code>'))
  assert.ok(html.includes('href="https://example.com/a?b=1"'))
  const t = renderMarkdown('| a | b |\n|---|--:|\n| 1 | 2 |\n\n- [x] done\n  - nested\n1. one\n\n```js\nconst a = "<b>"\n```')
  assert.ok(t.includes('<table>') && t.includes('class="al-r"'))
  assert.ok(t.includes('checked') && t.includes('<ul><li>nested</li></ul>'))
  assert.ok(t.includes('data-lang="js"') && t.includes('&lt;b&gt;'))
})

test('Durable Object limits: hundreds of folders and messages, long searches', async () => {
  const { j, call, store } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const big = store.createFolder(d.project.root_id, 'big')
  for (let i = 0; i < 130; i++) {
    const f = store.createFolder(big.id, `f${i}`)
    store.createMessage(f.id, { author: 'a', kind: 'agent', via: 'owner' }, { body: `m${i}` })
  }
  const link = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'Codex', can_write: true } })).data.link
  const s = `/s/${link.token}`
  assert.equal((await call('GET', s, { auth: false })).status, 200)
  assert.equal((await call('GET', `${s}/tree.json`, { auth: false })).status, 200)
  const ctx = await call('GET', `${s}/context.md?messages=200`, { auth: false })
  assert.equal(ctx.status, 200)
  assert.ok((await ctx.text()).includes('m129'))
  assert.equal((await j('GET', `/api/folders/${big.id}/messages?limit=500`)).status, 200)
  assert.equal((await j('GET', `/api/search?q=${'x'.repeat(100)}`)).status, 200)
  assert.equal((await j('GET', `/api/search?q=${encodeURIComponent('é'.repeat(100))}`)).status, 200)
  assert.equal((await j('DELETE', `/api/folders/${big.id}`)).status, 200)
})

test('folder depth and path length are capped, and failed paths leave nothing behind', async () => {
  const { j, call, store } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const link = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'Codex', can_write: true } })).data.link
  const s = `/s/${link.token}`
  const before = store.folders(d.project.id).length
  assert.equal((await call('POST', `${s}/folders`, { auth: false, body: { path: Array(17).fill('a').join('/') } })).status, 400)
  assert.equal((await call('POST', `${s}/folders`, { auth: false, body: { path: Array(16).fill('a').join('/') } })).status, 201)
  assert.equal((await call('POST', `${s}/folders`, { auth: false, body: { path: Array(16).fill('a').join('/') + '/b/c/d/e/f/g/h/i/j' } })).status, 400)
  assert.equal(store.folders(d.project.id).length, before + 16)
})

test('bearer guesses are rate limited like logins; chunked bodies respect limits', async () => {
  const { call } = setup()
  for (let i = 0; i < 11; i++) assert.equal((await call('GET', '/api/projects', { auth: false, headers: { authorization: `Bearer guess${i}` } })).status, 401)
  assert.equal((await call('GET', '/api/projects')).status, 429)
  const { store } = setup()
  const chunked = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('x'.repeat(8192))); c.close() } })
  const res = await handle(new Request('https://relay.test/api/login', { method: 'POST', body: chunked, duplex: 'half' } as RequestInit),
    { store, ownerKey: KEY, maxFileBytes: 1 << 20, ip: 'chunked' })
  assert.equal(res.status, 413)
})

test('markdown stays fast and bounded on hostile input; file kinds', () => {
  for (const src of ['>'.repeat(20000) + 'x', ' *a'.repeat(33000), ' _a'.repeat(33000), '['.repeat(99000), '[a]('.repeat(24000), '**a *'.repeat(20000)]) {
    const t = performance.now()
    renderMarkdown(src)
    assert.ok(performance.now() - t < 500, src.slice(0, 12))
  }
  assert.equal(isText('a.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'), false)
  assert.equal(isText('a.svg', 'image/svg+xml'), false)
  assert.equal(isText('a.ts', 'application/octet-stream'), true)
})

test('MCP: handshake, tools by permission, post / write / fetch / search inside the link scope', async () => {
  const { j, call } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const agents = d.folders.find((f: any) => f.name === 'agents')
  const docs = d.folders.find((f: any) => f.name === 'docs')
  await j('POST', `/api/folders/${docs.id}/messages`, { body: { body: 'secret-in-docs' } })
  const outside = (await j('POST', `/api/folders/${docs.id}/files?name=d.txt`, { raw: 'd', type: 'text/plain' })).data.file
  const w = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'ChatGPT', kind: 'gpt', folder_id: agents.id, can_write: true } })).data.link
  const r = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'Claude.ai', kind: 'claude' } })).data.link
  let id = 0
  const rpc = async (t: string, method: string, params: unknown = {}) => {
    const res = await call('POST', `/s/${t}/mcp`, { auth: false, body: { jsonrpc: '2.0', id: ++id, method, params }, headers: { accept: 'application/json, text/event-stream' } })
    return (await res.json()) as any
  }
  const tool = async (t: string, name: string, args: unknown) => (await rpc(t, 'tools/call', { name, arguments: args })).result

  const init = await rpc(w.token, 'initialize', { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } })
  assert.equal(init.result.protocolVersion, '2025-06-18')
  assert.ok(init.result.capabilities.tools && init.result.instructions.includes('ChatGPT'))
  const note = await call('POST', `/s/${w.token}/mcp`, { auth: false, body: { jsonrpc: '2.0', method: 'notifications/initialized' } })
  assert.equal(note.status, 202)
  assert.equal(note.headers.get('access-control-allow-origin'), '*')

  const names = async (t: string) => (await rpc(t, 'tools/list')).result.tools.map((x: any) => x.name)
  assert.deepEqual(await names(r.token), ['overview', 'read_folder', 'search', 'fetch', 'dashboard'])
  // A write link from before permissions keeps post, files and folders; scoped to a folder it has no dashboard.
  assert.deepEqual(await names(w.token), ['overview', 'read_folder', 'search', 'fetch', 'post_message', 'write_file', 'append_file', 'create_folder'])

  const posted = await tool(w.token, 'post_message', { folder: 'gpt', body: 'Reviewed. **Ship it.**' })
  assert.match(posted.content[0].text, /Posted to \/gpt as ChatGPT/)
  const gpt = d.folders.find((f: any) => f.name === 'gpt')
  const msg = (await j('GET', `/api/folders/${gpt.id}/messages`)).data.messages.at(-1)
  assert.equal(msg.via, w.id)
  assert.equal(msg.kind, 'gpt')

  assert.match((await tool(w.token, 'write_file', { path: 'notes/STATE.md', content: 'v1' })).content[0].text, /^Created/)
  assert.match((await tool(w.token, 'write_file', { path: 'notes/STATE.md', content: 'v2' })).content[0].text, /^Replaced/)
  assert.equal(JSON.parse((await tool(w.token, 'fetch', { id: 'notes/STATE.md' })).content[0].text).text, 'v2')
  assert.match((await tool(w.token, 'overview', {})).content[0].text, /Reviewed\. \*\*Ship it/)
  assert.match((await tool(w.token, 'read_folder', { folder: 'gpt' })).content[0].text, /Ship it/)

  const found = async (t: string, q: string) => JSON.parse((await tool(t, 'search', { query: q })).content[0].text).results.length
  assert.equal(await found(w.token, 'secret-in-docs'), 0)
  assert.equal(await found(r.token, 'secret-in-docs'), 1)
  assert.equal((await tool(w.token, 'fetch', { id: `file:${outside.id}` })).isError, true)
  assert.equal((await tool(w.token, 'read_folder', { folder: '../docs' })).isError, true)

  assert.equal((await tool(r.token, 'post_message', { folder: '', body: 'x' })).isError, true)
  assert.equal((await rpc(w.token, 'tools/call', { name: 'nope', arguments: {} })).error.code, -32602)
  assert.equal((await rpc(w.token, 'resources/list')).error.code, -32601)
  assert.equal((await call('GET', `/s/${w.token}/mcp`, { auth: false })).status, 405)
  assert.equal((await call('POST', `/s/rl_${'x'.repeat(32)}/mcp`, { auth: false, body: { jsonrpc: '2.0', id: 1, method: 'ping' } })).status, 404)
  assert.equal((await call('GET', '/.well-known/oauth-protected-resource', { auth: false })).status, 404)
})

test('contract: every project has CONTRACT, PROJECT_STATE and LOG; agents get it; no version copies; append-only logs', async () => {
  const { j, call, store } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const root = d.project.root_id
  const names = (await j('GET', `/api/folders/${root}/files`)).data.files.map((f: any) => f.name)
  assert.deepEqual(names.slice(0, 3), ['CONTRACT.md', 'PROJECT_STATE.md', 'LOG.md'])
  const side = (await j('POST', '/api/projects', { body: { name: 'Side', template: 'empty' } })).data.project
  assert.ok(store.contract(side.id)?.includes('One file per topic'))
  assert.ok(['Low token use is the priority', 'Decide, don’t ask'.replace('’', "'"), 'No guessing', 'Review before moving on', 'Risk management'].every(r => store.contract(side.id)!.includes(r)))

  const link = (await j('POST', `/api/projects/${d.project.id}/links`, { body: { name: 'GPT', kind: 'gpt', can_write: true } })).data.link
  let id = 0
  const tool = async (name: string, args: unknown) => {
    const res = await call('POST', `/s/${link.token}/mcp`, { auth: false, body: { jsonrpc: '2.0', id: ++id, method: 'tools/call', params: { name, arguments: args } } })
    return ((await res.json()) as any).result
  }
  const init = await call('POST', `/s/${link.token}/mcp`, { auth: false, body: { jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2025-06-18' } } })
  assert.match(((await init.json()) as any).result.instructions, /One file per topic/)
  assert.match((await tool('overview', {})).content[0].text, /## Contract \(every agent follows this\)/)
  const ctx = await (await call('GET', `/s/${link.token}/context.md`, { auth: false })).text()
  assert.match(ctx, /## Contract/)
  assert.equal(ctx.split('One file per topic, kept current').length - 1, 1, 'the contract appears once')

  assert.equal((await tool('write_file', { path: 'docs/plan.md', content: 'v1' })).isError, undefined)
  for (const dup of ['docs/plan-v2.md', 'docs/plan final.md', 'docs/Plan (copy).md', 'docs/plan 2026-09-24.md'])
    assert.match((await tool('write_file', { path: dup, content: 'x' })).content[0].text, /would duplicate “plan\.md”/, dup)
  assert.equal((await tool('write_file', { path: 'docs/patch-1.md', content: 'a' })).isError, undefined)
  assert.equal((await tool('write_file', { path: 'docs/patch-1.2.md', content: 'b' })).isError, true)
  assert.equal((await tool('write_file', { path: 'docs/plan.md', content: 'v2' })).isError, undefined, 'updating the topic file is fine')
  assert.equal((await tool('write_file', { path: 'docs/api-notes.md', content: 'new topic' })).isError, undefined)
  assert.match((await tool('write_file', { path: 'CONTRACT.md', content: 'no rules' })).content[0].text, /owner/)
  assert.ok(store.contract(d.project.id)?.includes('One file per topic'))

  await tool('append_file', { path: 'LOG.md', text: '- 2026-09-24 10:00 UTC · GPT · docs/plan.md · first plan' })
  await tool('append_file', { path: 'LOG.md', text: '- 2026-09-24 10:05 UTC · GPT · docs/api-notes.md · notes' })
  const log = new TextDecoder().decode(store.read(store.fileByName(root, 'LOG.md')!.id))
  assert.match(log, /project files created\n- 2026-09-24 10:00 UTC · GPT · docs\/plan\.md · first plan\n- 2026-09-24 10:05 UTC/)
  const http = await call('POST', `/s/${link.token}/append/LOG.md`, { auth: false, raw: '- via http', type: 'text/plain' })
  assert.equal(http.status, 200)
  const owner = await j('POST', `/api/folders/${store.resolvePath(root, 'docs')!.id}/files?name=plan-v2.md`, { raw: 'owner may', type: 'text/markdown' })
  assert.equal(owner.status, 201, 'the owner is not restricted')

  // One contract for all projects: the owner edits it anywhere, every project and agent follows.
  const mine = store.fileByName(root, 'CONTRACT.md')!
  assert.equal((await j('PUT', `/api/files/${mine.id}/raw`, { raw: '# Contract\n\n- Rule edited once', type: 'text/markdown' })).status, 200)
  const sideCopy = store.fileByName(side.root_id, 'CONTRACT.md')!
  assert.equal(new TextDecoder().decode(store.read(sideCopy.id)), '# Contract\n\n- Rule edited once')
  assert.match(((await (await call('POST', `/s/${link.token}/mcp`, { auth: false, body: { jsonrpc: '2.0', id: 99, method: 'initialize', params: {} } })).json()) as any).result.instructions, /Rule edited once/)
  const later = (await j('POST', '/api/projects', { body: { name: 'Later', template: 'empty' } })).data.project
  assert.equal(new TextDecoder().decode(store.read(store.fileByName(later.root_id, 'CONTRACT.md')!.id)), '# Contract\n\n- Rule edited once')
})

test('dashboard: tracker items, architecture progress, stage, role permissions, logged changes', async () => {
  const { j, call } = setup()
  const d = (await j('GET', '/api/projects/m-arc')).data
  const pid = d.project.id
  const agents = d.folders.find((f: any) => f.name === 'agents')
  const link = async (body: object) => (await j('POST', `/api/projects/${pid}/links`, { body })).data.link
  const sup = await link({ name: 'Supervisor', kind: 'claude', role: 'supervisor' })
  const rev = await link({ name: 'Reviewer', kind: 'gpt', role: 'reviewer' })
  const scoped = await link({ name: 'Scoped', kind: 'gpt', folder_id: agents.id, can_write: true })
  assert.deepEqual(sup.perms, ['post', 'files', 'folders', 'items', 'progress'])
  assert.deepEqual(rev.perms, ['post', 'items'])

  // Owner: items with details, a unique ID, filters by kind/status in the dashboard.
  const add = await j('POST', `/api/projects/${pid}/items`, { body: { ref: 'P-1', title: 'Login screen', kind: 'patch', owner: 'Supervisor', fix: 'Null session', bugs: 'Crash on empty password' } })
  assert.equal(add.status, 201)
  assert.equal((await j('POST', `/api/projects/${pid}/items`, { body: { ref: 'p-1', title: 'Dup' } })).status, 409)
  assert.equal((await j('POST', `/api/projects/${pid}/items`, { body: { ref: 'P-2', title: 'x', status: 'nope' } })).status, 400)
  const edited = (await j('PATCH', `/api/items/${add.data.item.id}`, { body: { status: 'running', priority: 'high' } })).data.item
  assert.equal(edited.fields.fix, 'Null session')
  assert.equal(edited.status, 'running')

  // MCP: tools follow the role; supervisor keeps progress current; reviewer can't.
  let id = 0
  const rpc = async (t: string, method: string, params: unknown = {}) =>
    ((await (await call('POST', `/s/${t}/mcp`, { auth: false, body: { jsonrpc: '2.0', id: ++id, method, params } })).json()) as any).result
  const tool = async (t: string, name: string, args: unknown) => (await rpc(t, 'tools/call', { name, arguments: args }))
  const names = async (t: string) => (await rpc(t, 'tools/list')).tools.map((x: any) => x.name)
  assert.ok((await names(sup.token)).includes('update_progress'))
  assert.deepEqual(await names(rev.token), ['overview', 'read_folder', 'search', 'fetch', 'post_message', 'dashboard', 'update_item'])
  assert.ok(!(await names(scoped.token)).includes('dashboard'))
  assert.match((await tool(sup.token, 'update_progress', { component: 'Auth API', area: 'Backend', status: 'building', progress: 60 })).content[0].text, /Added Backend \/ Auth API: building, 60%/)
  await tool(sup.token, 'update_progress', { component: 'Web app', area: 'Frontend', status: 'done', progress: 10, stage: 'Build' })
  const bad = await tool(rev.token, 'update_progress', { stage: 'Released' })
  assert.ok(bad.isError && /Unknown tool|may not/.test(bad.content[0].text))
  assert.match(JSON.stringify(await tool(scoped.token, 'fetch', { id: 'item:P-1' })), /scoped to one folder/)

  // Playbook rules for agents: blocked needs a reason, done needs evidence.
  assert.match((await tool(rev.token, 'update_item', { ref: 'P-1', status: 'blocked' })).content[0].text, /Blocked needs a reason/)
  assert.match((await tool(rev.token, 'update_item', { ref: 'P-1', status: 'done' })).content[0].text, /Done needs evidence/)
  assert.match((await tool(rev.token, 'update_item', { ref: 'P-1', status: 'done', verification: 'PR #12, 14 tests' })).content[0].text, /Updated P-1/)
  assert.match((await tool(rev.token, 'update_item', { ref: 'BUG-1', title: 'Flaky upload', kind: 'bug' })).content[0].text, /Added BUG-1/)
  const card = JSON.parse((await tool(rev.token, 'fetch', { id: 'item:p-1' })).content[0].text)
  assert.match(card.text, /\*\*Evidence:\*\* PR #12/)

  // HTTP for coding agents, and the markdown view.
  assert.equal((await call('POST', `/s/${rev.token}/progress`, { auth: false, body: { stage: 'Integrate' } })).status, 403)
  assert.equal((await call('POST', `/s/${sup.token}/items`, { auth: false, body: { ref: 'F-1', title: 'Search', kind: 'feature' } })).status, 200)
  const md = await (await call('GET', `/s/${sup.token}/dashboard.md`, { auth: false })).text()
  assert.match(md, /\*\*Build\*\*/)
  assert.match(md, /\| Frontend \| Web app \| done \| 100% \|/)
  assert.match(md, /\| P-1 \| patch \| done \|/)

  // Owner view: counts, progress, activity; changes are logged in LOG.md for every agent.
  const dash = (await j('GET', `/api/projects/${pid}/dashboard`)).data
  assert.equal(dash.info.stage, 'Build')
  assert.equal(dash.progress.architecture, 80)
  assert.deepEqual([dash.counts.total, dash.counts.byStatus.done, dash.counts.openBugs], [3, 1, 1])
  assert.equal(dash.activity.length, 14)
  const log = await (await call('GET', `/s/${sup.token}/f/?format=md`, { auth: false })).text()
  assert.ok(log.includes('Dashboard: stage Build'))
  const logFile = (await j('GET', `/api/folders/${d.project.root_id}/files`)).data.files.find((f: any) => f.name === 'LOG.md')
  const logText = await (await call('GET', `/api/files/${logFile.id}/raw`)).text()
  for (const line of ['Owner · dashboard · added P-1', 'Reviewer · dashboard · P-1 running → done', 'Supervisor · dashboard · stage Define → Build', 'Backend / Auth API (building, 60%)'])
    assert.ok(logText.includes(line), line)

  // Owner changes permissions; a link without progress loses the tool at once.
  const patched = (await j('PATCH', `/api/links/${sup.id}`, { body: { perms: ['post', 'items'] } })).data.link
  assert.deepEqual(patched.perms, ['post', 'items'])
  assert.ok(!(await names(sup.token)).includes('update_progress'))
  assert.equal((await j('PATCH', `/api/links/${sup.id}`, { body: { perms: ['root'] } })).status, 400)
  const none = (await j('PATCH', `/api/links/${sup.id}`, { body: { perms: [] } })).data.link
  assert.equal(none.can_write, 0)
  assert.equal((await call('POST', `/s/${sup.token}/items`, { auth: false, body: { ref: 'X', title: 'x' } })).status, 403)

  // Stage and project links by the owner; bad stage refused; delete cleans up.
  assert.equal((await j('PATCH', `/api/projects/${pid}`, { body: { info: { stage: 'Nope' } } })).status, 400)
  const info = (await j('PATCH', `/api/projects/${pid}`, { body: { info: { repo: 'macdarenz-droid/M-arc', links: [{ label: 'Live', url: 'https://relay.test' }, { label: 'x', url: 'javascript:alert(1)' }] } } })).data.info
  assert.deepEqual([info.stage, info.repo, info.links.length], ['Build', 'macdarenz-droid/M-arc', 1])
  const comp = dash.components.find((c: any) => c.name === 'Auth API')
  assert.equal((await j('DELETE', `/api/components/${comp.id}`)).status, 200)
  assert.equal((await j('DELETE', `/api/items/${add.data.item.id}`)).status, 200)
  assert.equal((await j('GET', `/api/projects/${pid}/dashboard`)).data.counts.total, 2)
})

test('upgrade from the previous schema: dashboard tables, playbook in every project, unedited contract refreshed', async () => {
  const { DEFAULT_CONTRACT, CONTRACT_V1 } = await import('../src/contract.ts')
  const db = new DatabaseSync(':memory:')
  const sql = durableLimits(nodeSql(db))
  const first = new Store(sql)
  first.createProject({ name: 'Second' })
  const roots = first.sql.all<{ root_id: string }>(`SELECT root_id FROM projects`)
  // Put the database back the way the live one was: schema 2, contract v1, no playbook, no dashboard.
  db.exec(`DROP TABLE items; DROP TABLE components; ALTER TABLE links DROP COLUMN perms; ALTER TABLE projects DROP COLUMN info;
    UPDATE meta SET v = '2' WHERE k = 'schema'; DELETE FROM meta WHERE k = 'docs_rev'; INSERT INTO meta (k, v) VALUES ('docs_seeded', '1')`)
  db.prepare(`INSERT OR REPLACE INTO meta (k, v) VALUES ('contract', ?)`).run(CONTRACT_V1)
  const owner = { author: 'Owner', kind: 'human' as const, via: 'owner' }
  for (const r of roots) {
    const pb = first.fileByName(r.root_id, 'PLAYBOOK.md')!
    db.prepare(`DELETE FROM files WHERE id = ?`).run(pb.id)
    const c = first.fileByName(r.root_id, 'CONTRACT.md')!
    first.writeFile(c.id, new TextEncoder().encode(CONTRACT_V1))
  }
  const up = new Store(sql)
  assert.equal(up.sql.get<{ v: string }>(`SELECT v FROM meta WHERE k = 'schema'`)!.v, '3')
  for (const r of roots) {
    assert.equal(new TextDecoder().decode(up.read(up.fileByName(r.root_id, 'CONTRACT.md')!.id)), DEFAULT_CONTRACT)
    assert.ok(new TextDecoder().decode(up.read(up.fileByName(r.root_id, 'PLAYBOOK.md')!.id)).startsWith('# Agent Delivery Playbook'))
    assert.deepEqual(up.files(r.root_id).slice(0, 4).map(f => f.name), ['CONTRACT.md', 'PROJECT_STATE.md', 'LOG.md', 'PLAYBOOK.md'])
  }
  assert.equal(up.contract(), DEFAULT_CONTRACT)
  assert.deepEqual(up.dashboard(up.projects()[0]!.id).counts.total, 0)

  // The playbook is the owner's and workspace-wide, like the contract.
  const [a, b] = roots
  const pbA = up.fileByName(a!.root_id, 'PLAYBOOK.md')!
  const link = up.createLink(up.projects().find(p => p.root_id === a!.root_id)!.id, { name: 'GPT', can_write: true })
  assert.throws(() => up.writeFile(pbA.id, new TextEncoder().encode('x'), { author: 'GPT', kind: 'gpt', via: link.id }), /PLAYBOOK.md is the owner/)
  up.writeFile(pbA.id, new TextEncoder().encode('# Playbook\nmine'), owner)
  assert.equal(new TextDecoder().decode(up.read(up.fileByName(b!.root_id, 'PLAYBOOK.md')!.id)), '# Playbook\nmine')

  // An owner-edited contract is never replaced by an upgrade.
  up.writeFile(up.fileByName(a!.root_id, 'CONTRACT.md')!.id, new TextEncoder().encode('# Mine'), owner)
  db.exec(`DELETE FROM meta WHERE k = 'docs_rev'`)
  const again = new Store(sql)
  assert.equal(again.contract(), '# Mine')
  assert.equal(new TextDecoder().decode(again.read(again.fileByName(b!.root_id, 'CONTRACT.md')!.id)), '# Mine')
})

// Agent links: /s/<token>. Server-rendered HTML with no script (readable by any fetch tool, postable by browser agents),
// the same content as markdown for agents, JSON for tools, and path-based writes for agents that can send HTTP.
import { HttpError, can, cleanName, permsOf, segments, type Author, type FileMeta, type Folder, type FolderStat, type Item, type Link, type Message, type Perm, type Project, type Store } from './store.ts'
import { json, limited, rawResponse, readBytes, readForm, readJson, type Ctx } from './app.ts'
import { ITEM_FIELDS, KINDS, PERMS, STAGES, esc, fmtBytes, isText, renderMarkdown, roleOf } from '../public/shared.js'
import { CONTRACT } from './contract.ts'

export interface View {
  store: Store
  link: Link
  project: Project
  scope: Folder
  base: string
  tree: { f: FolderStat; path: string; depth: number }[]
}

const enc = (path: string) => path.split('/').map(encodeURIComponent).join('/')
export const folderUrl = (v: View, path: string) => (path ? `${v.base}/f/${enc(path)}` : v.base)
export const rawUrl = (v: View, f: FileMeta) => `${v.base}/raw/${f.id}/${encodeURIComponent(f.name)}`
export const when = (t: number) => new Date(t).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
const label = (path: string) => '/' + path
const decode = (s: string) => {
  try {
    return decodeURIComponent(s)
  } catch {
    throw new HttpError(400, 'Bad URL encoding')
  }
}

export function view(c: Ctx, token: string): View {
  const link = c.store.linkByToken(token)
  if (!link) throw new HttpError(404, 'This link is not valid, or it was revoked')
  const project = c.store.project(link.project_id)
  const scope = c.store.folder(link.folder_id)
  const all = c.store.folders(project.id)
  const kids = new Map<string, FolderStat[]>()
  for (const f of all) if (f.parent_id) kids.set(f.parent_id, [...(kids.get(f.parent_id) ?? []), f])
  const tree: View['tree'] = []
  const walk = (f: FolderStat, path: string, depth: number) => {
    tree.push({ f, path, depth })
    for (const k of kids.get(f.id) ?? []) walk(k, path ? `${path}/${k.name}` : k.name, depth + 1)
  }
  const root = all.find(f => f.id === scope.id)
  if (root) walk(root, '', 0)
  return { store: c.store, link, project, scope, base: `${c.url.origin}/s/${token}`, tree }
}

const node = (v: View, folderId: string) => v.tree.find(t => t.f.id === folderId)
export const pathOf = (v: View, folderId: string) => node(v, folderId)?.path ?? ''

export function folderAt(v: View, path: unknown): View['tree'][number] {
  const want = segments(path).join('/').toLowerCase()
  const hit = v.tree.find(t => t.path.toLowerCase() === want)
  if (!hit) throw new HttpError(404, `No folder “${want || '/'}” in this link`)
  return hit
}

// ── permissions ─────────────────────────────────────────────────
const PERM_LABEL = Object.fromEntries(PERMS) as Record<Perm, string>
/** "supervisor: post messages, add and edit files, …" or "read only". */
export const accessText = (l: Link) => {
  const p = permsOf(l)
  return p.length ? `${roleOf(p)} (may ${p.map(x => PERM_LABEL[x].toLowerCase()).join(', ')})` : 'read only'
}
export function need(v: View, p: Perm) {
  if (!can(v.link, p)) throw new HttpError(403, `This link may not ${PERM_LABEL[p].toLowerCase()}. The owner can allow it in Share.`)
}
/** The folder a write goes to. Missing folders are created only when the link may create folders. */
export function writeFolder(v: View, path: string): Folder {
  if (can(v.link, 'folders')) return v.store.ensurePath(v.scope.id, path)
  const f = v.store.resolvePath(v.scope.id, path)
  if (!f) throw new HttpError(404, `Folder “${path}” does not exist, and this link may not create folders.`)
  return f
}
/** The dashboard is project-wide: links shared at the project root, or allowed to update it, see it. */
export const seesDashboard = (v: View) => !v.scope.parent_id || can(v.link, 'items') || can(v.link, 'progress')
function needDashboard(v: View) {
  if (!seesDashboard(v)) throw new HttpError(403, 'This link is scoped to one folder; the project dashboard is not part of it.')
}

// ── dashboard for agents ────────────────────────────────────────
const cell = (s: string) => s.replace(/\s+/g, ' ').replace(/\|/g, '\\|').trim() || '—'

export function itemMd(it: Item): string {
  const fields = (ITEM_FIELDS as [string, string][]).filter(([k]) => it.fields[k]).map(([k, label]) => `**${label}:** ${it.fields[k]}`)
  return [
    `### ${it.ref} · ${it.title}`,
    `${it.kind} · ${it.status} · ${it.priority} priority${it.owner ? ` · owner ${it.owner}` : ''}${it.component ? ` · ${it.component}` : ''} · updated ${when(it.updated_at)} by ${it.updated_by}`,
    ...fields,
  ].join('\n\n')
}

export function dashboardMd(v: View, filter: { status?: unknown; kind?: unknown } = {}): string {
  needDashboard(v)
  const d = v.store.dashboard(v.project.id)
  const st = String(filter.status ?? '').toLowerCase()
  const kd = String(filter.kind ?? '').toLowerCase()
  const items = d.items.filter(i => (!st || i.status === st) && (!kd || i.kind === kd))
  const stage = STAGES.map(s => (s === d.info.stage ? `**${s}**` : s)).join(' › ')
  const pct = (n: number | null) => (n == null ? 'not set' : `${n}%`)
  const comps = d.components.length
    ? `| Area | Component | Status | Progress | Owner |\n|---|---|---|---|---|\n${d.components.map(c => `| ${cell(c.area)} | ${cell(c.name)} | ${c.status} | ${c.progress}% | ${cell(c.owner)} |`).join('\n')}`
    : '_No components yet. A supervisor adds them with update_progress._'
  const rows = items.slice(0, 300)
  const table = rows.length
    ? `| ID | Kind | Status | Priority | Owner | Title |\n|---|---|---|---|---|---|\n${rows.map(i => `| ${cell(i.ref)} | ${i.kind} | ${i.status}${i.status === 'blocked' && i.fields.blocked ? `: ${cell(i.fields.blocked).slice(0, 80)}` : ''} | ${i.priority} | ${cell(i.owner)} | ${cell(i.title)} |`).join('\n')}${items.length > rows.length ? `\n\n_${items.length - rows.length} more; filter by status or kind._` : ''}`
    : '_No items._'
  return [
    header(v, `${v.project.name} — dashboard`),
    `Stage: ${stage}\n\nArchitecture ${pct(d.progress.architecture)} · tracker ${pct(d.progress.tasks)} done (${d.counts.byStatus.done} of ${d.counts.total}) · ${d.counts.byStatus.blocked} blocked · ${d.counts.openBugs} open bugs${d.info.repo ? ` · repo ${d.info.repo}` : ''}`,
    `## Architecture\n${comps}`,
    `## Tracker${st || kd ? ` (${[st, kd].filter(Boolean).join(', ')})` : ''}: ${items.length} items (fetch "item:<ID>" for the full card)\n${table}`,
  ].join('\n\n') + '\n'
}

export function dashboardLine(v: View): string {
  if (!seesDashboard(v)) return ''
  const d = v.store.dashboard(v.project.id)
  return `Dashboard: stage ${d.info.stage} · architecture ${d.progress.architecture ?? '–'}% · ${d.counts.total} items, ${d.counts.byStatus.blocked} blocked, ${d.counts.openBugs} open bugs. Read it with the dashboard tool or ${v.base}/dashboard.md.`
}

export function findItem(v: View, ref: string): Item {
  needDashboard(v)
  const it = v.store.items(v.project.id).find(i => i.ref.toLowerCase() === ref.trim().toLowerCase())
  if (!it) throw new HttpError(404, `No item “${ref}”`)
  return it
}

export function updateItem(v: View, who: Author, a: Record<string, unknown>): string {
  need(v, 'items')
  if (!String(a.ref ?? '').trim()) throw new HttpError(400, 'Pass the item ID as ref, e.g. "P-12"')
  const { item, created } = v.store.upsertItem(v.project.id, who, a)
  return `${created ? 'Added' : 'Updated'} ${item.ref} “${item.title}”: ${item.kind}, ${item.status}, ${item.priority}${item.owner ? `, owner ${item.owner}` : ''}.`
}

export function updateProgress(v: View, who: Author, a: Record<string, unknown>): string {
  need(v, 'progress')
  const out: string[] = []
  if (a.stage !== undefined && a.stage !== '') {
    v.store.setStage(v.project.id, who, a.stage)
    out.push(`Stage is ${v.store.info(v.project.id).stage}.`)
  }
  if (a.component !== undefined || a.name !== undefined) {
    const { component: c, created } = v.store.upsertComponent(v.project.id, who, a)
    out.push(`${created ? 'Added' : 'Updated'} ${c.area ? c.area + ' / ' : ''}${c.name}: ${c.status}, ${c.progress}%.`)
  }
  if (!out.length) throw new HttpError(400, 'Pass a component (with status and/or progress) or a stage')
  return out.join(' ')
}

// ── markdown for agents ─────────────────────────────────────────
function howTo(v: View): string {
  const l = v.link
  const dash = seesDashboard(v) ? ` · dashboard: \`GET ${v.base}/dashboard.md\` (or \`.json\`)` : ''
  if (!permsOf(l).length)
    return `## How to use this link\nThis link is **read-only**. Read what you need, then answer in your chat; the person who shared it will post your reply here.\n\n- As an MCP server (read tools only): \`${v.base}/mcp\`\n- A folder as markdown: \`GET ${v.base}/f/<path>?format=md\`\n- Everything at once: \`GET ${v.base}/context.md\`${dash}\n- Raw files: the links in the file lists.\n`
  const lines = [
    `- Read a folder: \`GET ${v.base}/f/<path>?format=md\` · everything: \`GET ${v.base}/context.md\` · JSON index: \`GET ${v.base}/tree.json\`${dash}`,
    can(l, 'post') && `- Post a message: \`POST ${v.base}/messages\` with JSON \`{"folder": "<path>", "body": "<markdown>", "author": "<optional display name>"}\``,
    can(l, 'files') && `- Create or replace a file: \`PUT ${v.base}/files/<path>/<file name>\` with the raw content as the body. Update a topic's existing file; version copies (plan-v2, final, patch-1.2) are refused.`,
    can(l, 'files') && `- Append to a file (LOG.md after every change): \`POST ${v.base}/append/<path>/<file name>\` with the text as the body`,
    can(l, 'files') && `- Upload files: \`POST ${v.base}/files\` as multipart form data: field \`folder\`, one or more \`file\``,
    can(l, 'folders') && `- Create a folder: \`POST ${v.base}/folders\` with JSON \`{"path": "<path>"}\``,
    can(l, 'items') && `- Add or update a tracker item: \`POST ${v.base}/items\` with JSON \`{"ref": "P-12", "title": "…", "kind": "patch", "status": "running", "owner": "${l.name}"}\`; only the fields you send change. Blocked needs \`blocked\` (the reason and what unblocks it); done needs \`verification\` (the evidence).`,
    can(l, 'progress') && `- Update architecture progress or the stage: \`POST ${v.base}/progress\` with JSON \`{"component": "Auth API", "area": "Backend", "status": "building", "progress": 60}\` or \`{"stage": "Integrate"}\``,
    `- Tool-using apps (Claude, ChatGPT, Cursor, Claude Code): connect \`${v.base}/mcp\` as an MCP server and use its tools instead.`,
    can(l, 'post') && `- No HTTP tool? Use the form on ${v.base} in a browser, or answer in chat and the person will paste it.`,
  ].filter(Boolean)
  return `## How to use this link
You are **${l.name}** (${KINDS[l.kind]?.label ?? 'Agent'}), ${accessText(l)}. Paths are relative to this link's folder; \`""\` is its root.

${lines.join('\n')}
${can(l, 'post') ? `\n\`\`\`sh\ncurl -X POST ${v.base}/messages -H 'content-type: application/json' \\\n  -d '{"folder": "", "body": "Done: …"}'\n\`\`\`\n` : ''}`
}

export function msgMd(v: View, m: Message, withFolder: boolean): string {
  const where = withFolder ? ` · in ${label(pathOf(v, m.folder_id))}` : ''
  const files = m.files.length ? '\n\nAttachments: ' + m.files.map(f => `[${f.name}](${rawUrl(v, f)}) (${fmtBytes(f.size)})`).join(', ') : ''
  return `### ${m.author} (${KINDS[m.kind]?.label ?? m.kind}) · ${when(m.created_at)}${where}\n\n${m.body}${files}\n`
}

export const fileLine = (v: View, f: FileMeta, path = pathOf(v, f.folder_id)) =>
  `- [${path ? path + '/' : ''}${f.name}](${rawUrl(v, f)}) · ${fmtBytes(f.size)} · ${f.author} · ${when(f.updated_at)}`

export function treeMd(v: View): string {
  return v.tree
    .map(t => `${'  '.repeat(t.depth)}- ${t.depth ? t.f.name + '/' : '/'} — ${t.f.messages} messages, ${t.f.files} files`)
    .join('\n')
}

export function header(v: View, title: string): string {
  const scope = v.scope.parent_id ? ` · scope: ${v.scope.name}/` : ''
  return `# ${title}\n\nRelay · ${v.project.name} · link “${v.link.name}” · ${accessText(v.link)}${scope} · ${when(Date.now())}\n${v.project.description ? `\n> ${v.project.description}\n` : ''}`
}

const contractMd = (v: View) => {
  const c = v.store.contract(v.project.id)
  return c ? `## Contract (every agent follows this)\n\n${c.replace(/^# .*\n+/, '')}` : ''
}

export function folderMd(v: View, at: View['tree'][number], how = true): string {
  const { messages, more } = v.store.messages(at.f.id, { limit: 100 })
  const files = v.store.files(at.f.id)
  const subs = v.tree.filter(t => t.f.parent_id === at.f.id)
  return [
    header(v, `${v.project.name} ${label(at.path)}`),
    how ? contractMd(v) : '',
    how ? howTo(v) : '',
    how ? dashboardLine(v) : '',
    `## Folders\n${treeMd(v)}`,
    subs.length ? `## Subfolders\n${subs.map(s => `- [${s.f.name}/](${folderUrl(v, s.path)}?format=md)`).join('\n')}` : '',
    `## Thread ${label(at.path)}${more ? ' (latest 100)' : ''}\n\n${messages.map(m => msgMd(v, m, false)).join('\n') || '_No messages yet._'}`,
    `## Files in ${label(at.path)}\n${files.map(f => fileLine(v, f)).join('\n') || '_No files._'}`,
  ].filter(Boolean).join('\n\n') + '\n'
}

function contextMd(v: View, at: View['tree'][number], limit: number): string {
  const messages = v.store.recent(at.f.id, limit)
  const files = v.store.filesUnder(at.f.id)
  let budget = 256 * 1024
  const texts: string[] = []
  for (const f of [...files].sort((a, b) => b.updated_at - a.updated_at)) {
    // The contract is already at the top; don't spend tokens on it twice.
    if (f.folder_id === v.project.root_id && f.name.toLowerCase() === CONTRACT.toLowerCase()) continue
    if (!isText(f.name, f.mime) || f.size > 48 * 1024 || f.size > budget) continue
    budget -= f.size
    const body = new TextDecoder().decode(v.store.read(f.id))
    const fence = '`'.repeat(Math.max(3, ...[...body.matchAll(/`+/g)].map(m => m[0].length + 1)))
    texts.push(`### ${pathOf(v, f.folder_id) ? pathOf(v, f.folder_id) + '/' : ''}${f.name}\n\n${fence}\n${body}\n${fence}`)
  }
  return [
    header(v, `${v.project.name} — context${at.path ? ' ' + label(at.path) : ''}`),
    contractMd(v),
    howTo(v),
    dashboardLine(v),
    `## Folders\n${treeMd(v)}`,
    `## Latest ${messages.length} messages (oldest first)\n\n${messages.map(m => msgMd(v, m, true)).join('\n') || '_No messages yet._'}`,
    `## Files\n${files.map(f => fileLine(v, f)).join('\n') || '_No files._'}`,
    texts.length ? `## Text file contents (newest first, up to 48 KB each)\n\n${texts.join('\n\n')}` : '',
  ].filter(Boolean).join('\n\n') + '\n'
}

// ── HTML for people and browsing agents ─────────────────────────
function avatar(kind: string, author: string) {
  const g = KINDS[kind]?.glyph || (author.trim()[0] ?? '?').toUpperCase()
  return `<span class="av" data-kind="${esc(kind)}" aria-hidden="true">${esc(g)}</span>`
}

function msgHtml(v: View, m: Message, withFolder: boolean): string {
  const path = pathOf(v, m.folder_id)
  const where = withFolder ? ` <a class="s-where" href="${esc(folderUrl(v, path))}">${esc(label(path))}</a>` : ''
  const files = m.files.length
    ? `<ul class="s-atts">${m.files.map(f => `<li><a href="${esc(rawUrl(v, f))}">${esc(f.name)}</a> <span>${fmtBytes(f.size)}</span></li>`).join('')}</ul>`
    : ''
  return `<article class="s-msg" id="m-${m.id}"><header>${avatar(m.kind, m.author)}<strong>${esc(m.author)}</strong>${m.kind === 'human' ? '' : `<span class="kind" data-kind="${esc(m.kind)}">${esc(KINDS[m.kind]?.label ?? m.kind)}</span>`}<time datetime="${new Date(m.created_at).toISOString()}">${when(m.created_at)}</time>${where}</header><div class="md">${renderMarkdown(m.body)}</div>${files}</article>`
}

function page(v: View, title: string, body: string, md: string): Response {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="color-scheme" content="dark light"><title>${esc(title)} · Relay</title><link rel="icon" href="/favicon.svg"><link rel="stylesheet" href="/app.css"><link rel="alternate" type="text/markdown" href="${esc(md)}"></head><body class="share">${body}</body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })
}

function folderHtml(v: View, at: View['tree'][number]): Response {
  const { messages, more } = v.store.messages(at.f.id, { limit: 100 })
  const files = v.store.files(at.f.id)
  const crumbs = [`<a href="${esc(v.base)}">${esc(v.scope.parent_id ? v.scope.name : v.project.name)}</a>`]
  let acc = ''
  for (const seg of at.path ? at.path.split('/') : []) {
    acc = acc ? `${acc}/${seg}` : seg
    crumbs.push(`<a href="${esc(folderUrl(v, acc))}">${esc(seg)}</a>`)
  }
  const mdUrl = `${folderUrl(v, at.path)}?format=md`
  const w = can(v.link, 'post')
  const role = permsOf(v.link).length ? roleOf(permsOf(v.link)) : ''
  const note = `<section class="s-note"><strong>For AI agents</strong>${v.store.contract(v.project.id) ? `<p>Read the project contract first: it is at the top of <a href="${esc(v.base)}/context.md">context.md</a> and in the connector’s overview. One file per topic, update instead of making versions, log every change in LOG.md.</p>` : ''}<p>This page as markdown: <a href="${esc(mdUrl)}">${esc(mdUrl)}</a>. The whole ${v.scope.parent_id ? 'folder' : 'project'} in one document: <a href="${esc(v.base)}/context.md">context.md</a>. JSON index: <a href="${esc(v.base)}/tree.json">tree.json</a>. MCP server for Claude, ChatGPT and other tool-using apps: <code>${esc(v.base)}/mcp</code>.</p>${
    w
      ? `<p>Post with HTTP: <code>POST ${esc(v.base)}/messages</code> and JSON <code>{"folder": "${esc(at.path)}", "body": "…"}</code>; replace a file with <code>PUT ${esc(v.base)}/files/&lt;path&gt;/&lt;name&gt;</code>. Or use the form at the bottom.</p>`
      : `<p>This link ${role ? 'cannot post' : 'is read-only'}: answer in your chat and the person who shared it will post it here.</p>`
  }${seesDashboard(v) ? `<p>Project dashboard (stage, architecture progress, tracker): <a href="${esc(v.base)}/dashboard.md">dashboard.md</a> · <a href="${esc(v.base)}/dashboard.json">dashboard.json</a>.</p>` : ''}</section>`
  const tree = `<nav class="s-tree" aria-label="Folders">${v.tree
    .map(t => `<a class="d${Math.min(t.depth, 6)}${t.f.id === at.f.id ? ' on' : ''}" href="${esc(folderUrl(v, t.path))}">${esc(t.depth ? t.f.name : '/')}<span>${t.f.messages + t.f.files || ''}</span></a>`)
    .join('')}</nav>`
  const recent =
    at.f.id === v.scope.id
      ? v.store.recent(v.scope.id, 12, at.f.id)
      : []
  const fileRows = files
    .map(f => `<tr><td><a href="${esc(rawUrl(v, f))}">${esc(f.name)}</a></td><td>${fmtBytes(f.size)}</td><td>${esc(f.author)}</td><td>${when(f.updated_at)}</td></tr>`)
    .join('')
  const options = v.tree.map(t => `<option value="${esc(t.path)}"${t.f.id === at.f.id ? ' selected' : ''}>${esc(label(t.path))}</option>`).join('')
  const form = w
    ? `<form class="s-form" method="post" action="${esc(v.base)}/messages" enctype="multipart/form-data"><h2>Post</h2><div class="row"><label>Folder <select name="folder">${options}</select></label><label>As <input name="author" value="${esc(v.link.name)}" maxlength="60"></label></div><textarea name="body" rows="6" placeholder="Markdown…"></textarea><div class="row">${can(v.link, 'files') ? '<input type="file" name="file" multiple>' : '<span></span>'}<button type="submit">Post</button></div></form>`
    : ''
  const body = `<header class="s-head"><a class="s-brand" href="${esc(v.base)}"><span class="logo" aria-hidden="true"></span>Relay</a><nav class="crumbs">${crumbs.join('<i>/</i>')}</nav><span class="s-badge${role ? ' w' : ''}">${role ? role[0]!.toUpperCase() + role.slice(1) : 'Read only'} · ${esc(v.link.name)}</span></header>
<main class="s-main">${tree}<div class="s-col">${note}
<section><h2>Thread <span>${esc(label(at.path))}${more ? ' · latest 100' : ''}</span></h2>${messages.map(m => msgHtml(v, m, false)).join('') || '<p class="s-empty">No messages yet.</p>'}</section>
<section><h2>Files <span>${files.length}</span></h2>${fileRows ? `<div class="table"><table><thead><tr><th>Name</th><th>Size</th><th>By</th><th>Updated</th></tr></thead><tbody>${fileRows}</tbody></table></div>` : '<p class="s-empty">No files.</p>'}</section>
${recent.length ? `<section><h2>Recent in other folders</h2>${recent.map(m => msgHtml(v, m, true)).join('')}</section>` : ''}
${form}</div></main>`
  return page(v, `${v.project.name} ${label(at.path)}`, body, mdUrl)
}

const markdown = (text: string) => new Response(text, { headers: { 'Content-Type': 'text/markdown; charset=utf-8', 'Cache-Control': 'no-store' } })

// ── router ──────────────────────────────────────────────────────
export async function agentRoute(c: Ctx): Promise<Response> {
  const m = c.url.pathname.match(/^\/s\/([^/]+)(\/.*)?$/)
  if (!m) throw new HttpError(404, 'Not found')
  const v = view(c, m[1] ?? '')
  const rest = (m[2] ?? '').replace(/\/+$/, '')
  const method = c.req.method
  const accept = c.req.headers.get('accept') ?? ''
  const wantsMd = c.url.searchParams.get('format') === 'md' || /text\/markdown/.test(accept) || (!/text\/html/.test(accept) && /text\/plain/.test(accept))

  if (method === 'GET' || method === 'HEAD') {
    if (rest === '' || rest.startsWith('/f/') || rest === '/f') {
      const path = rest.startsWith('/f/') ? rest.slice(3).split('/').map(decode).join('/') : ''
      const at = folderAt(v, path)
      return wantsMd ? markdown(folderMd(v, at)) : folderHtml(v, at)
    }
    if (rest === '/context.md') {
      const limit = Math.min(Math.max(Number(c.url.searchParams.get('messages')) || 40, 1), 200)
      return markdown(contextMd(v, folderAt(v, c.url.searchParams.get('folder') ?? ''), limit))
    }
    if (rest === '/tree.json') {
      return json({
        project: { name: v.project.name, slug: v.project.slug, description: v.project.description },
        link: { name: v.link.name, kind: v.link.kind, can_write: !!v.link.can_write, perms: permsOf(v.link) },
        folders: v.tree.map(t => ({ path: t.path, messages: t.f.messages, files: t.f.files, last_at: t.f.last_at, url: folderUrl(v, t.path) })),
        files: v.store.filesUnder(v.scope.id).map(f => ({ path: pathOf(v, f.folder_id), name: f.name, size: f.size, mime: f.mime, author: f.author, updated_at: f.updated_at, url: rawUrl(v, f) })),
      })
    }
    if (rest === '/dashboard.md') return markdown(dashboardMd(v, { status: c.url.searchParams.get('status'), kind: c.url.searchParams.get('kind') }))
    if (rest === '/dashboard.json') {
      needDashboard(v)
      const { activity: _a, ...d } = v.store.dashboard(v.project.id)
      return json(d)
    }
    const raw = rest.match(/^\/raw\/(\w+)(?:\/.*)?$/)
    if (raw) {
      const f = v.store.file(raw[1] ?? '')
      if (!node(v, f.folder_id)) throw new HttpError(404, 'File not found')
      return rawResponse(c.req, f, v.store.read(f.id), c.url.searchParams.has('download'))
    }
    throw new HttpError(404, 'Not found')
  }

  if (!permsOf(v.link).length) throw new HttpError(403, 'This link is read-only')
  if (limited(`link:${v.link.id}`, 120, 60_000)) throw new HttpError(429, 'Too many writes. Slow down for a minute.')
  const who = (name: unknown): Author => ({ author: name ? cleanName(name, 'Author', 60) : v.link.name, kind: v.link.kind, via: v.link.id })
  const ctype = c.req.headers.get('content-type') ?? ''
  const isForm = /multipart\/form-data|application\/x-www-form-urlencoded/.test(ctype)

  if (method === 'POST' && rest === '/messages') {
    let fields: Record<string, unknown>
    let uploads: { name: string; mime: string; data: Uint8Array }[] = []
    if (isForm) {
      const form = await readForm(c.req, c.maxFileBytes + 1048576)
      fields = { folder: form.get('folder'), body: form.get('body'), author: form.get('author') }
      for (const f of form.getAll('file')) {
        if (typeof f === 'string' || !f.size) continue
        if (f.size > c.maxFileBytes) throw new HttpError(413, `${f.name} is larger than ${Math.round(c.maxFileBytes / 1048576)} MB`)
        uploads.push({ name: f.name, mime: f.type, data: new Uint8Array(await f.arrayBuffer()) })
      }
      uploads = uploads.slice(0, 20)
    } else fields = await readJson(c.req)
    need(v, 'post')
    if (uploads.length) need(v, 'files')
    const at = folderAt(v, fields.folder)
    const w = who(fields.author)
    const msg = v.store.sql.tx(() => {
      const ids = uploads.map(u => v.store.createFile(at.f.id, w, u).id)
      return v.store.createMessage(at.f.id, w, { body: fields.body, file_ids: ids })
    })
    if (isForm && !/json/.test(accept)) return new Response(null, { status: 303, headers: { Location: `${folderUrl(v, at.path)}#m-${msg.id}` } })
    return json({ message: { id: msg.id, folder: at.path, author: msg.author, created_at: msg.created_at, files: msg.files.map(f => f.name) }, url: folderUrl(v, at.path) }, 201)
  }

  if (method === 'POST' && rest.startsWith('/append/')) {
    const parts = rest.slice(8).split('/').map(decode)
    const name = cleanName(parts.pop(), 'File name', 200)
    const add = new TextDecoder().decode(await readBytes(c.req, 1048576))
    if (!add.trim()) throw new HttpError(400, 'Nothing to append')
    need(v, 'files')
    const folder = writeFolder(v, parts.join('/'))
    const { file, created } = v.store.appendFile(folder.id, who(c.url.searchParams.get('author')), name, add)
    return json({ file: { name: file.name, path: parts.join('/'), size: file.size }, created }, created ? 201 : 200)
  }

  if (method === 'PUT' && rest.startsWith('/files/')) {
    const parts = rest.slice(7).split('/').map(decode)
    const name = cleanName(parts.pop(), 'File name', 200)
    need(v, 'files')
    const data = await readBytes(c.req, c.maxFileBytes)
    const folder = writeFolder(v, parts.join('/'))
    const { file, created } = v.store.putFile(folder.id, who(c.url.searchParams.get('author')), { name, mime: ctype.split(';')[0] || undefined, data })
    const fresh = view(c, v.link.token)
    return json({ file: { name: file.name, path: pathOf(fresh, file.folder_id), size: file.size, url: rawUrl(fresh, file) }, created }, created ? 201 : 200)
  }

  if (method === 'POST' && rest === '/files') {
    need(v, 'files')
    if (!isForm) throw new HttpError(415, 'Send multipart/form-data with a "folder" field and "file" fields, or PUT /files/<path>/<name>')
    const form = await readForm(c.req, c.maxFileBytes + 1048576)
    const at = folderAt(v, form.get('folder'))
    const w = who(form.get('author'))
    const out: FileMeta[] = []
    for (const f of form.getAll('file').slice(0, 20)) {
      if (typeof f === 'string' || !f.size) continue
      if (f.size > c.maxFileBytes) throw new HttpError(413, `${f.name} is larger than ${Math.round(c.maxFileBytes / 1048576)} MB`)
      out.push(v.store.createFile(at.f.id, w, { name: f.name, mime: f.type, data: new Uint8Array(await f.arrayBuffer()) }))
    }
    if (!/json/.test(accept) && !out.length) throw new HttpError(400, 'No files in the upload')
    return json({ files: out.map(f => ({ name: f.name, path: at.path, size: f.size, url: rawUrl(v, f) })) }, 201)
  }

  if (method === 'POST' && rest === '/folders') {
    need(v, 'folders')
    const b = isForm ? Object.fromEntries((await readForm(c.req, 65536)).entries()) : await readJson(c.req, 65536)
    const f = v.store.ensurePath(v.scope.id, b.path)
    const fresh = view(c, v.link.token)
    return json({ folder: { path: pathOf(fresh, f.id), url: folderUrl(fresh, pathOf(fresh, f.id)) } }, 201)
  }

  if (method === 'POST' && (rest === '/items' || rest === '/progress')) {
    const b = await readJson(c.req, 65536)
    const w = who(b.author)
    const message = rest === '/items' ? updateItem(v, w, b) : updateProgress(v, w, b)
    return json({ ok: true, message })
  }

  throw new HttpError(405, 'Method not allowed here')
}

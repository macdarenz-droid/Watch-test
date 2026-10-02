import type { Sql, Val } from './sql.ts'
import { KINDS, mimeFor } from '../public/shared.js'
import { CONTRACT, CONTRACT_V1, LOG, PINNED, PLAYBOOK, SHARED_DOCS, STATE, DEFAULT_CONTRACT, defaultLog, defaultState, topicKey } from './contract.ts'
import { PLAYBOOK_TEXT } from './playbook.ts'
import { COMPONENT_STATUS, ITEM_FIELDS, ITEM_KINDS, ITEM_STATUS, PERMS, PRIORITIES, ROLES, STAGES } from '../public/shared.js'

export type Kind = 'human' | 'claude' | 'gpt' | 'gemini' | 'agent'

export interface Project { id: string; slug: string; name: string; description: string; root_id: string; created_at: number; updated_at: number }
export interface ProjectStat extends Project { messages: number; files: number; last_at: number }
export interface Folder { id: string; project_id: string; parent_id: string | null; name: string; created_at: number }
export interface FolderStat extends Folder { messages: number; files: number; last_at: number }
export interface FileMeta {
  id: string; project_id: string; folder_id: string; message_id: string | null; name: string; mime: string; size: number
  author: string; kind: Kind; via: string; created_at: number; updated_at: number
}
export interface Message {
  id: string; project_id: string; folder_id: string; author: string; kind: Kind; body: string; via: string
  created_at: number; edited_at: number | null; files: FileMeta[]
}
export interface Link {
  id: string; token: string; project_id: string; folder_id: string; name: string; kind: Kind; can_write: number
  created_at: number; last_used_at: number | null; perms?: string | null
}
export type Perm = 'post' | 'files' | 'folders' | 'items' | 'progress'
/** What a link may change. Links from before permissions: read + write meant post, files and folders. */
export function permsOf(l: Pick<Link, 'can_write' | 'perms'>): Perm[] {
  if (l.perms != null) return l.perms.split(',').filter(Boolean) as Perm[]
  return l.can_write ? ['post', 'files', 'folders'] : []
}
export const can = (l: Pick<Link, 'can_write' | 'perms'>, p: Perm) => permsOf(l).includes(p)

export interface ProjectInfo { repo: string; stage: string; links: { label: string; url: string }[] }
export interface Item {
  id: string; project_id: string; ref: string; kind: string; title: string; status: string; priority: string; owner: string
  component: string; fields: Record<string, string>; created_at: number; updated_at: number; created_by: string; updated_by: string
}
export interface Component {
  id: string; project_id: string; area: string; name: string; status: string; progress: number; owner: string; notes: string
  position: number; updated_at: number; updated_by: string
}
export interface Author { author: string; kind: Kind; via: string }

export class HttpError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

const CHUNK = 1 << 20
const SCHEMA = 3
const MAX_ITEMS = 5000
const MAX_COMPONENTS = 200
const DOCS_REV = '2'
// Durable Object SQLite allows 100 bound parameters per statement and 50-byte LIKE patterns.
const BATCH = 90
export const MAX_DEPTH = 24
export const MAX_FOLDERS = 2000
const SUBTREE = `WITH RECURSIVE t(id) AS (SELECT ? UNION ALL SELECT f.id FROM folders f JOIN t ON f.parent_id = t.id)`

function batched<T>(ids: string[], fn: (part: string[], marks: string) => T[]): T[] {
  const out: T[] = []
  for (let i = 0; i < ids.length; i += BATCH) {
    const part = ids.slice(i, i + BATCH)
    out.push(...fn(part, part.map(() => '?').join(',')))
  }
  return out
}
export const TEMPLATES: Record<string, string[]> = {
  software: ['agents', 'agents/claude', 'agents/gpt', 'agents/handoffs', 'docs', 'docs/architecture', 'docs/decisions', 'design', 'tasks', 'releases'],
  empty: [],
}

const ALPHA = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export function randomId(n = 12, alphabet = ALPHA.slice(0, 36)): string {
  const bytes = crypto.getRandomValues(new Uint8Array(n))
  let s = ''
  for (const b of bytes) s += alphabet[b % alphabet.length]
  return s
}
export const newToken = () => 'rl_' + randomId(32, ALPHA.slice(0, 62))

export const asKind = (k: unknown): Kind => (typeof k === 'string' && k in KINDS ? (k as Kind) : 'agent')

/** Names never contain control characters; folder and file names also never contain slashes (they are path segments). */
export function cleanName(v: unknown, what = 'Name', max = 120, slashes = false): string {
  const s = String(v ?? '').replace(slashes ? /[\u0000-\u001f\u007f]/g : /[\u0000-\u001f\u007f/\\]/g, '').replace(/\s+/g, ' ').trim()
  if (!s || s === '.' || s === '..') throw new HttpError(400, `${what} is empty or invalid`)
  if (s.length > max) throw new HttpError(400, `${what} is longer than ${max} characters`)
  return s
}

export function cleanBody(v: unknown, allowEmpty = false): string {
  const s = String(v ?? '').replace(/\r\n?/g, '\n').replace(/\s+$/, '')
  if (!s.trim() && !allowEmpty) throw new HttpError(400, 'Message is empty')
  if (s.length > 100_000) throw new HttpError(413, 'Message is longer than 100,000 characters')
  return s
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 48) || 'project'

/** Split a user path like "agents/claude/" into clean segments. */
export function segments(path: unknown): string[] {
  const parts = String(path ?? '').split('/').map(s => s.trim()).filter(Boolean)
  if (parts.length > 16) throw new HttpError(400, 'Paths are limited to 16 folders deep')
  return parts.map(s => cleanName(s, 'Folder name'))
}

export class Store {
  sql: Sql
  now: () => number

  constructor(sql: Sql, now: () => number = Date.now) {
    this.sql = sql
    this.now = now
    this.migrate()
    if (this.sql.get<{ v: string }>(`SELECT v FROM meta WHERE k = 'docs_rev'`)?.v !== DOCS_REV) {
      this.sql.tx(() => {
        // An owner who never edited the contract gets the current default; an edited one is left alone.
        if (!this.sql.get(`SELECT 1 FROM meta WHERE k = 'contract'`) || this.sharedDoc(CONTRACT) === CONTRACT_V1)
          this.sql.run(`INSERT OR REPLACE INTO meta (k, v) VALUES ('contract', ?)`, DEFAULT_CONTRACT)
        for (const p of this.sql.all<Project>(`SELECT * FROM projects`)) {
          const c = this.fileByName(p.root_id, CONTRACT)
          if (c && new TextDecoder().decode(this.read(c.id)) === CONTRACT_V1) {
            const data = new TextEncoder().encode(this.sharedDoc(CONTRACT))
            this.writeChunks(c.id, data)
            this.sql.run(`UPDATE files SET size = ?, updated_at = ? WHERE id = ?`, data.byteLength, this.now(), c.id)
          }
          this.seedDocs(p.id)
        }
        this.sql.run(`INSERT OR REPLACE INTO meta (k, v) VALUES ('docs_rev', ?)`, DOCS_REV)
      })
    }
  }

  /** The root files (CONTRACT, PROJECT_STATE, LOG, PLAYBOOK), created only when missing. */
  private seedDocs(projectId: string) {
    const p = this.sql.get<Project>(`SELECT * FROM projects WHERE id = ?`, projectId)
    if (!p) return
    const relay: Author = { author: 'Relay', kind: 'agent', via: 'owner' }
    const when = new Date(this.now()).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    const docs: [string, string][] = [[CONTRACT, this.contract()], [STATE, defaultState(p.name)], [LOG, defaultLog(when)], [PLAYBOOK, this.sharedDoc(PLAYBOOK)]]
    for (const [name, body] of docs)
      if (!this.fileByName(p.root_id, name)) this.createFile(p.root_id, relay, { name, data: new TextEncoder().encode(body) })
  }

  /** A workspace-wide document (the contract, the playbook): one text for every project. */
  sharedDoc(name: string): string {
    const key = name === CONTRACT ? 'contract' : 'playbook'
    return this.sql.get<{ v: string }>(`SELECT v FROM meta WHERE k = ?`, key)?.v ?? (name === CONTRACT ? DEFAULT_CONTRACT : PLAYBOOK_TEXT)
  }

  /** One contract for the whole workspace: every project and every agent gets the same rules. */
  contract(_projectId?: string): string {
    return this.sharedDoc(CONTRACT).slice(0, 12_000)
  }

  /** The owner edited a shared document in one project: it becomes the workspace text, and every project's copy follows. */
  private syncShared(name: string, data: Uint8Array, fromId: string) {
    this.sql.run(`INSERT OR REPLACE INTO meta (k, v) VALUES (?, ?)`, name === CONTRACT ? 'contract' : 'playbook', new TextDecoder().decode(data))
    const copies = this.sql.all<{ id: string }>(
      `SELECT f.id FROM files f JOIN projects p ON p.root_id = f.folder_id WHERE f.name = ? COLLATE NOCASE AND f.id != ?`, name, fromId)
    for (const c of copies) {
      this.writeChunks(c.id, data)
      this.sql.run(`UPDATE files SET size = ?, updated_at = ? WHERE id = ?`, data.byteLength, this.now(), c.id)
    }
  }

  private migrate() {
    const s = this.sql
    s.script(`CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT NOT NULL)`)
    const v = Number(s.get<{ v: string }>(`SELECT v FROM meta WHERE k='schema'`)?.v ?? 0)
    if (v >= SCHEMA) return
    s.tx(() => {
      if (v < 1) s.script(`
        CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
          description TEXT NOT NULL DEFAULT '', root_id TEXT NOT NULL, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS folders (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, parent_id TEXT, name TEXT NOT NULL,
          created_at INTEGER NOT NULL);
        CREATE INDEX IF NOT EXISTS folders_project ON folders(project_id);
        CREATE UNIQUE INDEX IF NOT EXISTS folders_name ON folders(parent_id, name COLLATE NOCASE);
        CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, folder_id TEXT NOT NULL,
          author TEXT NOT NULL, kind TEXT NOT NULL, body TEXT NOT NULL, via TEXT NOT NULL, created_at INTEGER NOT NULL, edited_at INTEGER);
        CREATE INDEX IF NOT EXISTS messages_folder ON messages(folder_id, created_at);
        CREATE INDEX IF NOT EXISTS messages_project ON messages(project_id, created_at);
        CREATE TABLE IF NOT EXISTS files (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, folder_id TEXT NOT NULL, message_id TEXT,
          name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, author TEXT NOT NULL, kind TEXT NOT NULL, via TEXT NOT NULL,
          created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL);
        CREATE UNIQUE INDEX IF NOT EXISTS files_name ON files(folder_id, name COLLATE NOCASE);
        CREATE INDEX IF NOT EXISTS files_message ON files(message_id);
        CREATE INDEX IF NOT EXISTS files_project ON files(project_id);
        CREATE TABLE IF NOT EXISTS chunks (file_id TEXT NOT NULL, idx INTEGER NOT NULL, data BLOB NOT NULL, PRIMARY KEY (file_id, idx));
        CREATE TABLE IF NOT EXISTS links (id TEXT PRIMARY KEY, token TEXT NOT NULL UNIQUE, project_id TEXT NOT NULL, folder_id TEXT NOT NULL,
          name TEXT NOT NULL, kind TEXT NOT NULL, can_write INTEGER NOT NULL, created_at INTEGER NOT NULL, last_used_at INTEGER);
      `)
      // v2 (assigned agents) was removed; its tables stay unused where it ran.
      if (v < 3) {
        s.script(`
          CREATE TABLE IF NOT EXISTS items (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, ref TEXT NOT NULL, kind TEXT NOT NULL,
            title TEXT NOT NULL, status TEXT NOT NULL, priority TEXT NOT NULL, owner TEXT NOT NULL DEFAULT '', component TEXT NOT NULL DEFAULT '',
            fields TEXT NOT NULL DEFAULT '{}', created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, created_by TEXT NOT NULL, updated_by TEXT NOT NULL);
          CREATE UNIQUE INDEX IF NOT EXISTS items_ref ON items(project_id, ref COLLATE NOCASE);
          CREATE TABLE IF NOT EXISTS components (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, area TEXT NOT NULL DEFAULT '', name TEXT NOT NULL,
            status TEXT NOT NULL, progress INTEGER NOT NULL DEFAULT 0, owner TEXT NOT NULL DEFAULT '', notes TEXT NOT NULL DEFAULT '',
            position INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, updated_by TEXT NOT NULL);
          CREATE UNIQUE INDEX IF NOT EXISTS components_name ON components(project_id, name COLLATE NOCASE);
          ALTER TABLE links ADD COLUMN perms TEXT;
          ALTER TABLE projects ADD COLUMN info TEXT NOT NULL DEFAULT '{}';
        `)
      }
      s.run(`INSERT OR REPLACE INTO meta (k, v) VALUES ('schema', ?)`, String(SCHEMA))
      s.run(`INSERT OR IGNORE INTO meta (k, v) VALUES ('seq', '0')`)
      if (v === 0 && !s.get(`SELECT 1 FROM projects`)) {
        const p = this.createProject({ name: 'M/ARC', description: 'Workout, recovery and coaching tracker (Android / PWA).', template: 'software' })
        const owner: Author = { author: 'Relay', kind: 'agent', via: 'owner' }
        this.createMessage(p.root_id, owner, {
          body:
            'Welcome to **M/ARC** on Relay.\n\n- Every folder has a **Thread** and **Files**. Drop files anywhere.\n' +
            '- **Share** creates a link for Claude, GPT or any agent, with a role: supervisor, builder, reviewer or viewer.\n' +
            '- **Dashboard** shows the stage, architecture progress and the tracker (tasks, patches, bugs, features, releases).\n' +
            '- Chat apps that cannot post: paste their reply with **as → GPT / Claude** in the composer.',
        })
      }
    })
  }

  // ── change counter ───────────────────────────────────────────
  seq(): number {
    return Number(this.sql.get<{ v: string }>(`SELECT v FROM meta WHERE k='seq'`)?.v ?? 0)
  }
  private bump() {
    this.sql.run(`UPDATE meta SET v = CAST(CAST(v AS INTEGER) + 1 AS TEXT) WHERE k='seq'`)
  }

  // ── projects ────────────────────────────────────────────────
  projects(): ProjectStat[] {
    return this.sql.all<ProjectStat>(`
      SELECT p.*,
        (SELECT COUNT(*) FROM messages m WHERE m.project_id = p.id) AS messages,
        (SELECT COUNT(*) FROM files f WHERE f.project_id = p.id) AS files,
        MAX(p.updated_at, IFNULL((SELECT MAX(created_at) FROM messages m WHERE m.project_id = p.id), 0),
            IFNULL((SELECT MAX(updated_at) FROM files f WHERE f.project_id = p.id), 0)) AS last_at
      FROM projects p ORDER BY p.name COLLATE NOCASE`)
  }

  project(idOrSlug: string): Project {
    const p = this.sql.get<Project>(`SELECT * FROM projects WHERE id = ? OR slug = ?`, idOrSlug, idOrSlug)
    if (!p) throw new HttpError(404, 'Project not found')
    return p
  }

  createProject(input: { name?: unknown; description?: unknown; template?: unknown }): Project {
    const name = cleanName(input.name, 'Project name', 80, true)
    const description = String(input.description ?? '').trim().slice(0, 500)
    const paths = TEMPLATES[String(input.template ?? 'software')] ?? []
    return this.sql.tx(() => {
      const base = slugify(name)
      let slug = base
      for (let n = 2; this.sql.get(`SELECT 1 FROM projects WHERE slug = ?`, slug); n++) slug = `${base}-${n}`
      const t = this.now()
      const id = randomId()
      const root_id = randomId()
      this.sql.run(`INSERT INTO folders (id, project_id, parent_id, name, created_at) VALUES (?, ?, NULL, ?, ?)`, root_id, id, name, t)
      this.sql.run(
        `INSERT INTO projects (id, slug, name, description, root_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        id, slug, name, description, root_id, t, t,
      )
      for (const p of paths) this.ensurePath(root_id, p)
      this.seedDocs(id)
      this.bump()
      return this.project(id)
    })
  }

  updateProject(id: string, input: { name?: unknown; description?: unknown; info?: unknown }): Project {
    const p = this.project(id)
    const name = input.name === undefined ? p.name : cleanName(input.name, 'Project name', 80, true)
    const description = input.description === undefined ? p.description : String(input.description).trim().slice(0, 500)
    const info = input.info === undefined ? this.info(p.id) : { ...this.info(p.id), ...this.infoInput(input.info) }
    this.sql.tx(() => {
      this.sql.run(`UPDATE projects SET name = ?, description = ?, info = ?, updated_at = ? WHERE id = ?`, name, description, JSON.stringify(info), this.now(), p.id)
      this.sql.run(`UPDATE folders SET name = ? WHERE id = ?`, name, p.root_id)
      this.bump()
    })
    return this.project(p.id)
  }

  deleteProject(id: string) {
    const p = this.project(id)
    this.sql.tx(() => {
      this.sql.run(`DELETE FROM chunks WHERE file_id IN (SELECT id FROM files WHERE project_id = ?)`, p.id)
      for (const t of ['files', 'messages', 'links', 'folders', 'items', 'components']) this.sql.run(`DELETE FROM ${t} WHERE project_id = ?`, p.id)
      this.sql.run(`DELETE FROM projects WHERE id = ?`, p.id)
      this.bump()
    })
  }

  // ── folders ─────────────────────────────────────────────────
  folders(projectId: string): FolderStat[] {
    return this.sql.all<FolderStat>(`
      SELECT f.*,
        (SELECT COUNT(*) FROM messages m WHERE m.folder_id = f.id) AS messages,
        (SELECT COUNT(*) FROM files x WHERE x.folder_id = f.id) AS files,
        MAX(IFNULL((SELECT MAX(created_at) FROM messages m WHERE m.folder_id = f.id), 0),
            IFNULL((SELECT MAX(updated_at) FROM files x WHERE x.folder_id = f.id), 0)) AS last_at
      FROM folders f WHERE f.project_id = ? ORDER BY f.name COLLATE NOCASE`, projectId)
  }

  folder(id: string): Folder {
    const f = this.sql.get<Folder>(`SELECT * FROM folders WHERE id = ?`, id)
    if (!f) throw new HttpError(404, 'Folder not found')
    return f
  }

  /** The folder and every folder below it. */
  subtree(rootId: string): string[] {
    return this.sql.all<{ id: string }>(`${SUBTREE} SELECT id FROM t`, rootId).map(r => r.id)
  }

  /** Levels above a folder (the project root is 0). */
  depth(id: string): number {
    let n = 0
    for (let f = this.folder(id); f.parent_id; f = this.folder(f.parent_id)) n++
    return n
  }

  /** Levels below a folder (a leaf is 0). */
  height(id: string): number {
    return Number(this.sql.get<{ h: number }>(
      `WITH RECURSIVE t(id, d) AS (SELECT ?, 0 UNION ALL SELECT f.id, t.d + 1 FROM folders f JOIN t ON f.parent_id = t.id) SELECT MAX(d) AS h FROM t`, id)?.h ?? 0)
  }

  /** "a/b" below rootId → path segments relative to rootId; '' for the root itself. */
  pathOf(folderId: string, rootId: string): string {
    const parts: string[] = []
    let f = this.folder(folderId)
    while (f.id !== rootId) {
      parts.unshift(f.name)
      if (!f.parent_id) throw new HttpError(403, 'Outside this link')
      f = this.folder(f.parent_id)
    }
    return parts.join('/')
  }

  resolvePath(rootId: string, path: unknown): Folder | undefined {
    let f: Folder | undefined = this.folder(rootId)
    for (const seg of segments(path)) {
      f = this.sql.get<Folder>(`SELECT * FROM folders WHERE parent_id = ? AND name = ? COLLATE NOCASE`, f.id, seg)
      if (!f) return undefined
    }
    return f
  }

  ensurePath(rootId: string, path: unknown): Folder {
    const segs = segments(path)
    return this.sql.tx(() => {
      let f = this.folder(rootId)
      for (const seg of segs) {
        const next = this.sql.get<Folder>(`SELECT * FROM folders WHERE parent_id = ? AND name = ? COLLATE NOCASE`, f.id, seg)
        f = next ?? this.createFolder(f.id, seg)
      }
      return f
    })
  }

  createFolder(parentId: string, rawName: unknown): Folder {
    const parent = this.folder(parentId)
    const name = cleanName(rawName, 'Folder name', 80)
    if (this.depth(parent.id) + 1 > MAX_DEPTH) throw new HttpError(400, `Folders nest at most ${MAX_DEPTH} levels`)
    const count = Number(this.sql.get<{ n: number }>(`SELECT COUNT(*) AS n FROM folders WHERE project_id = ?`, parent.project_id)?.n ?? 0)
    if (count >= MAX_FOLDERS) throw new HttpError(400, `A project holds at most ${MAX_FOLDERS} folders`)
    return this.sql.tx(() => {
      if (this.sql.get(`SELECT 1 FROM folders WHERE parent_id = ? AND name = ? COLLATE NOCASE`, parent.id, name))
        throw new HttpError(409, `“${name}” already exists here`)
      const id = randomId()
      this.sql.run(`INSERT INTO folders (id, project_id, parent_id, name, created_at) VALUES (?, ?, ?, ?, ?)`, id, parent.project_id, parent.id, name, this.now())
      this.bump()
      return this.folder(id)
    })
  }

  updateFolder(id: string, input: { name?: unknown; parent_id?: unknown }): Folder {
    const f = this.folder(id)
    if (!f.parent_id) throw new HttpError(400, 'Rename the project to rename its root folder')
    const name = input.name === undefined ? f.name : cleanName(input.name, 'Folder name', 80)
    const parentId = input.parent_id === undefined ? f.parent_id : String(input.parent_id)
    const parent = this.folder(parentId)
    if (parent.project_id !== f.project_id) throw new HttpError(400, 'Folders cannot move between projects')
    if (this.subtree(f.id).includes(parent.id)) throw new HttpError(400, 'A folder cannot move inside itself')
    if (this.depth(parent.id) + 1 + this.height(f.id) > MAX_DEPTH) throw new HttpError(400, `Folders nest at most ${MAX_DEPTH} levels`)
    return this.sql.tx(() => {
      if (this.sql.get(`SELECT 1 FROM folders WHERE parent_id = ? AND name = ? COLLATE NOCASE AND id != ?`, parent.id, name, f.id))
        throw new HttpError(409, `“${name}” already exists there`)
      this.sql.run(`UPDATE folders SET name = ?, parent_id = ? WHERE id = ?`, name, parent.id, f.id)
      this.bump()
      return this.folder(f.id)
    })
  }

  deleteFolder(id: string) {
    const f = this.folder(id)
    if (!f.parent_id) throw new HttpError(400, 'Delete the project to delete its root folder')
    const ids = this.subtree(f.id)
    this.sql.tx(() => {
      for (const id of ids) {
        this.sql.run(`DELETE FROM chunks WHERE file_id IN (SELECT id FROM files WHERE folder_id = ?)`, id)
        for (const t of ['files', 'messages', 'links']) this.sql.run(`DELETE FROM ${t} WHERE folder_id = ?`, id)
        this.sql.run(`DELETE FROM folders WHERE id = ?`, id)
      }
      this.bump()
    })
  }

  // ── messages ────────────────────────────────────────────────
  private withFiles(rows: Omit<Message, 'files'>[]): Message[] {
    if (!rows.length) return []
    const files = batched(rows.map(r => r.id), (part, marks) =>
      this.sql.all<FileMeta>(`SELECT * FROM files WHERE message_id IN (${marks}) ORDER BY created_at`, ...part))
    return rows.map(r => ({ ...r, files: files.filter(f => f.message_id === r.id) }))
  }

  /** Oldest first. `before` pages backwards. */
  messages(folderId: string, opts: { before?: number; limit?: number } = {}): { messages: Message[]; more: boolean } {
    const limit = Math.min(Math.max(opts.limit ?? 100, 1), 500)
    const rows = this.sql.all<Omit<Message, 'files'>>(
      `SELECT * FROM messages WHERE folder_id = ? AND created_at < ? ORDER BY created_at DESC, id DESC LIMIT ?`,
      folderId, opts.before ?? Number.MAX_SAFE_INTEGER, limit + 1,
    )
    const more = rows.length > limit
    return { messages: this.withFiles(rows.slice(0, limit).reverse()), more }
  }

  /** Latest messages in a folder and everything below it (optionally leaving one folder out), oldest first. */
  recent(rootId: string, limit = 30, except = ''): Message[] {
    const rows = this.sql.all<Omit<Message, 'files'>>(
      `${SUBTREE} SELECT m.* FROM messages m WHERE m.folder_id IN (SELECT id FROM t) AND m.folder_id != ?
       ORDER BY m.created_at DESC, m.id DESC LIMIT ?`,
      rootId, except, limit,
    )
    return this.withFiles(rows.reverse())
  }

  message(id: string): Message {
    const m = this.sql.get<Omit<Message, 'files'>>(`SELECT * FROM messages WHERE id = ?`, id)
    if (!m) throw new HttpError(404, 'Message not found')
    return this.withFiles([m])[0] as Message
  }

  createMessage(folderId: string, who: Author, input: { body?: unknown; file_ids?: unknown }): Message {
    const folder = this.folder(folderId)
    const fileIds = Array.isArray(input.file_ids) ? input.file_ids.map(String).slice(0, 50) : []
    const body = cleanBody(input.body, fileIds.length > 0)
    return this.sql.tx(() => {
      const id = randomId()
      const t = this.now()
      this.sql.run(
        `INSERT INTO messages (id, project_id, folder_id, author, kind, body, via, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id, folder.project_id, folder.id, who.author, who.kind, body, who.via, t,
      )
      for (const fid of fileIds) {
        const f = this.file(fid)
        if (f.project_id !== folder.project_id || f.message_id) throw new HttpError(400, 'Attachment belongs elsewhere')
        if (f.folder_id !== folder.id) this.moveFile(f, folder.id)
        this.sql.run(`UPDATE files SET message_id = ? WHERE id = ?`, id, f.id)
      }
      this.bump()
      return this.message(id)
    })
  }

  updateMessage(id: string, body: unknown): Message {
    const m = this.message(id)
    this.sql.tx(() => {
      this.sql.run(`UPDATE messages SET body = ?, edited_at = ? WHERE id = ?`, cleanBody(body, m.files.length > 0), this.now(), m.id)
      this.bump()
    })
    return this.message(m.id)
  }

  /** Attachments stay in the folder's files. */
  deleteMessage(id: string) {
    const m = this.message(id)
    this.sql.tx(() => {
      this.sql.run(`UPDATE files SET message_id = NULL WHERE message_id = ?`, m.id)
      this.sql.run(`DELETE FROM messages WHERE id = ?`, m.id)
      this.bump()
    })
  }

  // ── files ───────────────────────────────────────────────────
  files(folderId: string): FileMeta[] {
    return this.sql.all<FileMeta>(
      `SELECT * FROM files WHERE folder_id = ?
       ORDER BY CASE name WHEN ? THEN 0 WHEN ? THEN 1 WHEN ? THEN 2 WHEN ? THEN 3 ELSE 4 END, name COLLATE NOCASE`, folderId, ...PINNED)
  }

  /** Files in a folder and everything below it. */
  filesUnder(rootId: string): FileMeta[] {
    return this.sql.all<FileMeta>(`${SUBTREE} SELECT x.* FROM files x WHERE x.folder_id IN (SELECT id FROM t) ORDER BY x.name COLLATE NOCASE`, rootId)
  }

  file(id: string): FileMeta {
    const f = this.sql.get<FileMeta>(`SELECT * FROM files WHERE id = ?`, id)
    if (!f) throw new HttpError(404, 'File not found')
    return f
  }

  fileByName(folderId: string, name: string): FileMeta | undefined {
    return this.sql.get<FileMeta>(`SELECT * FROM files WHERE folder_id = ? AND name = ? COLLATE NOCASE`, folderId, name)
  }

  read(id: string): Uint8Array {
    const parts = this.sql.all<{ data: Uint8Array }>(`SELECT data FROM chunks WHERE file_id = ? ORDER BY idx`, id).map(r => r.data)
    const out = new Uint8Array(parts.reduce((n, p) => n + p.byteLength, 0))
    let o = 0
    for (const p of parts) {
      out.set(p, o)
      o += p.byteLength
    }
    return out
  }

  private writeChunks(id: string, data: Uint8Array) {
    this.sql.run(`DELETE FROM chunks WHERE file_id = ?`, id)
    for (let i = 0, idx = 0; i < data.byteLength || idx === 0; i += CHUNK, idx++)
      this.sql.run(`INSERT INTO chunks (file_id, idx, data) VALUES (?, ?, ?)`, id, idx, data.subarray(i, i + CHUNK) as Val)
  }

  /** A free name in the folder: "notes.md" → "notes (2).md". */
  private freeName(folderId: string, name: string, except = ''): string {
    const dot = name.lastIndexOf('.')
    const [stem, ext] = dot > 0 ? [name.slice(0, dot), name.slice(dot)] : [name, '']
    let candidate = name
    for (let n = 2; this.sql.get(`SELECT 1 FROM files WHERE folder_id = ? AND name = ? COLLATE NOCASE AND id != ?`, folderId, candidate, except); n++)
      candidate = `${stem} (${n})${ext}`
    return candidate
  }

  createFile(folderId: string, who: Author, input: { name: unknown; mime?: string; data: Uint8Array }): FileMeta {
    const folder = this.folder(folderId)
    const clean = cleanName(input.name, 'File name', 200)
    this.guard(folder, clean, who)
    const mime = input.mime && /^[\w.+-]+\/[\w.+-]+$/.test(input.mime) ? input.mime : mimeFor(clean)
    return this.sql.tx(() => {
      const id = randomId()
      const t = this.now()
      const name = this.freeName(folder.id, clean)
      this.sql.run(
        `INSERT INTO files (id, project_id, folder_id, message_id, name, mime, size, author, kind, via, created_at, updated_at)
         VALUES (?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)`,
        id, folder.project_id, folder.id, name, mime, input.data.byteLength, who.author, who.kind, who.via, t, t,
      )
      this.writeChunks(id, input.data)
      this.bump()
      return this.file(id)
    })
  }

  writeFile(id: string, data: Uint8Array, who?: Author): FileMeta {
    const f = this.file(id)
    if (who) this.guard(this.folder(f.folder_id), f.name, who, true)
    this.sql.tx(() => {
      this.writeChunks(f.id, data)
      this.sql.run(`UPDATE files SET size = ?, updated_at = ? WHERE id = ?`, data.byteLength, this.now(), f.id)
      if (who) this.sql.run(`UPDATE files SET author = ?, kind = ?, via = ? WHERE id = ?`, who.author, who.kind, who.via, f.id)
      const shared = SHARED_DOCS.find(n => n.toLowerCase() === f.name.toLowerCase())
      if (who?.via === 'owner' && shared && !this.folder(f.folder_id).parent_id) this.syncShared(shared, data, f.id)
      this.bump()
    })
    return this.file(f.id)
  }

  /**
   * The contract, enforced for links (agents): CONTRACT.md is the owner's, and a new file may not duplicate
   * the topic of one already in the folder (plan.md → plan-v2.md, plan final.md, patch-1 → patch-1.2).
   */
  private guard(folder: Folder, name: string, who: Author, existing = false) {
    if (who.via === 'owner') return
    const shared = SHARED_DOCS.find(n => n.toLowerCase() === name.toLowerCase())
    if (!folder.parent_id && shared) throw new HttpError(403, `${shared} is the owner’s. Propose a change in a message instead.`)
    if (existing) return
    const key = topicKey(name)
    const clash = this.files(folder.id).find(f => f.name.toLowerCase() === name.toLowerCase() || topicKey(f.name) === key)
    if (clash)
      throw new HttpError(409, `“${name}” would duplicate “${clash.name}” in this folder. Update “${clash.name}” instead (write_file, or append_file for logs), or give a genuinely new topic its own name.`)
  }

  /** Add text to the end of a file (logs), creating it when missing. */
  appendFile(folderId: string, who: Author, rawName: unknown, text: string): { file: FileMeta; created: boolean } {
    const name = cleanName(rawName, 'File name', 200)
    const add = text.replace(/\s+$/, '') + '\n'
    const existing = this.fileByName(folderId, name)
    if (!existing) return { file: this.createFile(folderId, who, { name, data: new TextEncoder().encode(add) }), created: true }
    const old = new TextDecoder().decode(this.read(existing.id))
    const joined = old + (old && !old.endsWith('\n') ? '\n' : '') + add
    return { file: this.writeFile(existing.id, new TextEncoder().encode(joined), who), created: false }
  }

  /** Create or replace by name in a folder (agents keeping a doc current). */
  putFile(folderId: string, who: Author, input: { name: unknown; mime?: string; data: Uint8Array }): { file: FileMeta; created: boolean } {
    const existing = this.fileByName(folderId, cleanName(input.name, 'File name', 200))
    return existing ? { file: this.writeFile(existing.id, input.data, who), created: false } : { file: this.createFile(folderId, who, input), created: true }
  }

  private moveFile(f: FileMeta, folderId: string) {
    const name = this.freeName(folderId, f.name, f.id)
    this.sql.run(`UPDATE files SET folder_id = ?, name = ?, updated_at = ? WHERE id = ?`, folderId, name, this.now(), f.id)
  }

  updateFile(id: string, input: { name?: unknown; folder_id?: unknown }): FileMeta {
    const f = this.file(id)
    return this.sql.tx(() => {
      if (input.folder_id !== undefined && input.folder_id !== f.folder_id) {
        const target = this.folder(String(input.folder_id))
        if (target.project_id !== f.project_id) throw new HttpError(400, 'Files cannot move between projects')
        this.moveFile(f, target.id)
        this.sql.run(`UPDATE files SET message_id = NULL WHERE id = ?`, f.id)
      }
      if (input.name !== undefined) {
        const name = cleanName(input.name, 'File name', 200)
        const cur = this.file(f.id)
        if (this.sql.get(`SELECT 1 FROM files WHERE folder_id = ? AND name = ? COLLATE NOCASE AND id != ?`, cur.folder_id, name, f.id))
          throw new HttpError(409, `“${name}” already exists in this folder`)
        this.sql.run(`UPDATE files SET name = ?, mime = ?, updated_at = ? WHERE id = ?`, name, mimeFor(name) === 'application/octet-stream' ? cur.mime : mimeFor(name), this.now(), f.id)
      }
      this.bump()
      return this.file(f.id)
    })
  }

  deleteFile(id: string) {
    const f = this.file(id)
    this.sql.tx(() => {
      this.sql.run(`DELETE FROM chunks WHERE file_id = ?`, f.id)
      this.sql.run(`DELETE FROM files WHERE id = ?`, f.id)
      this.bump()
    })
  }

  // ── links ───────────────────────────────────────────────────
  links(projectId: string): Link[] {
    return this.sql.all<Link>(`SELECT * FROM links WHERE project_id = ? ORDER BY created_at DESC`, projectId)
  }

  createLink(projectId: string, input: { name?: unknown; kind?: unknown; folder_id?: unknown; can_write?: unknown; role?: unknown }): Link {
    const p = this.project(projectId)
    const folder = this.folder(input.folder_id ? String(input.folder_id) : p.root_id)
    if (folder.project_id !== p.id) throw new HttpError(400, 'Folder is not in this project')
    const id = randomId()
    this.sql.tx(() => {
      this.sql.run(
        `INSERT INTO links (id, token, project_id, folder_id, name, kind, can_write, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        id, newToken(), p.id, folder.id, cleanName(input.name, 'Link name', 60), asKind(input.kind), input.can_write ? 1 : 0, this.now(),
      )
      const role = typeof input.role === 'string' ? (ROLES as Record<string, string[]>)[input.role] : undefined
      if (role) this.sql.run(`UPDATE links SET perms = ?, can_write = ? WHERE id = ?`, role.join(','), role.length ? 1 : 0, id)
      this.bump()
    })
    return this.sql.get<Link>(`SELECT * FROM links WHERE id = ?`, id) as Link
  }

  /** Set exactly what a link may change. */
  setLinkPerms(id: string, perms: unknown): Link {
    const valid = PERMS.map(p => p[0])
    const list = [...new Set(Array.isArray(perms) ? perms.map(String) : [])]
    const bad = list.find(p => !valid.includes(p))
    if (bad) throw new HttpError(400, `Unknown permission “${bad}”`)
    if (!this.linkById(id)) throw new HttpError(404, 'Link not found')
    this.sql.tx(() => {
      this.sql.run(`UPDATE links SET perms = ?, can_write = ? WHERE id = ?`, list.join(','), list.length ? 1 : 0, id)
      this.bump()
    })
    return this.linkById(id) as Link
  }

  linkById(id: string): Link | undefined {
    return this.sql.get<Link>(`SELECT * FROM links WHERE id = ?`, id)
  }

  deleteLink(id: string) {
    this.sql.tx(() => {
      this.sql.run(`DELETE FROM links WHERE id = ?`, id)
      this.bump()
    })
  }

  linkByToken(token: string): Link | undefined {
    if (!/^rl_[A-Za-z0-9]{32}$/.test(token)) return undefined
    const l = this.sql.get<Link>(`SELECT * FROM links WHERE token = ?`, token)
    if (l && (!l.last_used_at || this.now() - l.last_used_at > 60_000)) this.sql.run(`UPDATE links SET last_used_at = ? WHERE id = ?`, this.now(), l.id)
    return l
  }

  // ── dashboard ──────────────────────────────────────────────
  info(projectId: string): ProjectInfo {
    const raw = this.sql.get<{ info: string }>(`SELECT info FROM projects WHERE id = ?`, projectId)?.info
    let v: Partial<ProjectInfo> = {}
    try {
      v = JSON.parse(raw || '{}')
    } catch {}
    return { repo: v.repo ?? '', stage: STAGES.includes(v.stage ?? '') ? (v.stage as string) : STAGES[0]!, links: Array.isArray(v.links) ? v.links : [] }
  }

  private infoInput(v: unknown): Partial<ProjectInfo> {
    const o = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>
    const out: Partial<ProjectInfo> = {}
    if (o.repo !== undefined) out.repo = String(o.repo).trim().slice(0, 300)
    if (o.stage !== undefined) {
      if (!STAGES.includes(String(o.stage))) throw new HttpError(400, `Stage must be one of: ${STAGES.join(', ')}`)
      out.stage = String(o.stage)
    }
    if (o.links !== undefined) {
      if (!Array.isArray(o.links)) throw new HttpError(400, 'Links must be a list')
      out.links = o.links.slice(0, 30).map(l => ({ label: String((l as any)?.label ?? '').trim().slice(0, 80), url: String((l as any)?.url ?? '').trim().slice(0, 500) }))
        .filter(l => /^https?:\/\//i.test(l.url))
    }
    return out
  }

  /** One line in the project's LOG.md, so every agent sees what changed on the dashboard. */
  private logChange(projectId: string, who: Author, what: string) {
    const p = this.project(projectId)
    const when = new Date(this.now()).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
    const line = `- ${when} · ${who.author} · dashboard · ${what}`.replace(/\s+/g, ' ').slice(0, 400)
    try {
      this.appendFile(p.root_id, who, LOG, line)
    } catch {} // a missing LOG.md whose name clashes with another file: the change itself still stands
  }

  setStage(projectId: string, who: Author, stage: unknown) {
    const before = this.info(projectId).stage
    const p = this.updateProject(projectId, { info: { stage } })
    const now = this.info(p.id).stage
    if (now !== before) this.logChange(p.id, who, `stage ${before} → ${now}`)
  }

  items(projectId: string): Item[] {
    return this.sql.all<Omit<Item, 'fields'> & { fields: string }>(`SELECT * FROM items WHERE project_id = ? ORDER BY created_at`, projectId)
      .map(r => ({ ...r, fields: safeJson(r.fields) }))
  }

  item(id: string): Item {
    const r = this.sql.get<Omit<Item, 'fields'> & { fields: string }>(`SELECT * FROM items WHERE id = ?`, id)
    if (!r) throw new HttpError(404, 'Item not found')
    return { ...r, fields: safeJson(r.fields) }
  }

  /**
   * Add or update a tracker item by its ID (ref); only the fields given change. For agents, blocked needs a reason
   * and done needs evidence (the playbook's rules). Creating it or changing its status is logged.
   */
  upsertItem(projectId: string, who: Author, input: Record<string, unknown>, id?: string): { item: Item; created: boolean } {
    const p = this.project(projectId)
    const cur = id ? this.item(id) : input.ref !== undefined
      ? (() => { const r = this.sql.get<{ id: string }>(`SELECT id FROM items WHERE project_id = ? AND ref = ? COLLATE NOCASE`, p.id, String(input.ref).trim()); return r ? this.item(r.id) : undefined })()
      : undefined
    if (cur && cur.project_id !== p.id) throw new HttpError(404, 'Item not found')
    const pick = (k: string, list: readonly string[], d: string) => {
      const v = input[k] === undefined ? d : String(input[k]).trim().toLowerCase()
      if (!list.includes(v)) throw new HttpError(400, `${k} must be one of: ${list.join(', ')}`)
      return v
    }
    const text = (k: string, max: number, d = '') => (input[k] === undefined ? d : String(input[k] ?? '').trim().slice(0, max))
    const ref = cleanName(input.ref ?? cur?.ref, 'ID', 40)
    const title = text('title', 200, cur?.title)
    if (!title) throw new HttpError(400, 'A new item needs a title')
    const fields: Record<string, string> = { ...(cur?.fields ?? {}) }
    for (const [k] of ITEM_FIELDS as [string, string][]) if (input[k] !== undefined) fields[k] = String(input[k] ?? '').trim().slice(0, 4000)
    const row = {
      ref, title, kind: pick('kind', ITEM_KINDS, cur?.kind ?? 'task'), status: pick('status', ITEM_STATUS, cur?.status ?? 'ready'),
      priority: pick('priority', PRIORITIES, cur?.priority ?? 'medium'), owner: text('owner', 60, cur?.owner), component: text('component', 80, cur?.component),
    }
    if (who.via !== 'owner') {
      if (row.status === 'blocked' && !fields.blocked) throw new HttpError(400, 'Blocked needs a reason and what unblocks it: fill “blocked”.')
      if (row.status === 'done' && !fields.verification) throw new HttpError(400, 'Done needs evidence (tests, review, PR): fill “verification”.')
    }
    if (this.sql.get(`SELECT 1 FROM items WHERE project_id = ? AND ref = ? COLLATE NOCASE AND id != ?`, p.id, ref, cur?.id ?? ''))
      throw new HttpError(409, `An item with ID “${ref}” already exists`)
    if (!cur && (this.sql.get<{ n: number }>(`SELECT COUNT(*) AS n FROM items WHERE project_id = ?`, p.id)?.n ?? 0) >= MAX_ITEMS)
      throw new HttpError(400, `A project holds at most ${MAX_ITEMS} tracker items. Update existing ones instead.`)
    const t = this.now()
    const newId = cur?.id ?? randomId()
    this.sql.tx(() => {
      if (cur)
        this.sql.run(`UPDATE items SET ref = ?, title = ?, kind = ?, status = ?, priority = ?, owner = ?, component = ?, fields = ?, updated_at = ?, updated_by = ? WHERE id = ?`,
          row.ref, row.title, row.kind, row.status, row.priority, row.owner, row.component, JSON.stringify(fields), t, who.author, cur.id)
      else
        this.sql.run(`INSERT INTO items (id, project_id, ref, kind, title, status, priority, owner, component, fields, created_at, updated_at, created_by, updated_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          newId, p.id, row.ref, row.kind, row.title, row.status, row.priority, row.owner, row.component, JSON.stringify(fields), t, t, who.author, who.author)
      if (!cur) this.logChange(p.id, who, `added ${row.ref} “${row.title}” (${row.kind}, ${row.status})`)
      else if (cur.status !== row.status) this.logChange(p.id, who, `${row.ref} ${cur.status} → ${row.status}`)
      this.bump()
    })
    return { item: this.item(newId), created: !cur }
  }

  deleteItem(id: string, who: Author) {
    const it = this.item(id)
    this.sql.tx(() => {
      this.sql.run(`DELETE FROM items WHERE id = ?`, id)
      this.logChange(it.project_id, who, `removed ${it.ref} “${it.title}”`)
      this.bump()
    })
  }

  components(projectId: string): Component[] {
    return this.sql.all<Component>(`SELECT * FROM components WHERE project_id = ? ORDER BY area COLLATE NOCASE, position, name COLLATE NOCASE`, projectId)
  }

  /** Add or update an architecture component by name. Done means 100 %. Status and progress changes are logged. */
  upsertComponent(projectId: string, who: Author, input: Record<string, unknown>, id?: string): { component: Component; created: boolean } {
    const p = this.project(projectId)
    const cur = id
      ? this.sql.get<Component>(`SELECT * FROM components WHERE id = ? AND project_id = ?`, id, p.id)
      : this.sql.get<Component>(`SELECT * FROM components WHERE project_id = ? AND name = ? COLLATE NOCASE`, p.id, String(input.name ?? input.component ?? '').trim())
    if (id && !cur) throw new HttpError(404, 'Component not found')
    const name = cleanName(input.name ?? input.component ?? cur?.name, 'Component name', 80, true)
    const status = input.status === undefined ? cur?.status ?? 'planned' : String(input.status).trim().toLowerCase()
    if (!COMPONENT_STATUS.includes(status)) throw new HttpError(400, `status must be one of: ${COMPONENT_STATUS.join(', ')}`)
    let progress = input.progress === undefined ? cur?.progress ?? 0 : Math.round(Number(input.progress))
    if (!Number.isFinite(progress) || progress < 0 || progress > 100) throw new HttpError(400, 'progress must be a number from 0 to 100')
    if (status === 'done') progress = 100
    const str = (k: string, max: number, d = '') => (input[k] === undefined ? d : String(input[k] ?? '').trim().slice(0, max))
    const row = { area: str('area', 80, cur?.area), owner: str('owner', 60, cur?.owner), notes: str('notes', 1000, cur?.notes), position: Math.round(Number(input.position ?? cur?.position ?? 0)) || 0 }
    if (this.sql.get(`SELECT 1 FROM components WHERE project_id = ? AND name = ? COLLATE NOCASE AND id != ?`, p.id, name, cur?.id ?? ''))
      throw new HttpError(409, `A component named “${name}” already exists`)
    if (!cur && (this.sql.get<{ n: number }>(`SELECT COUNT(*) AS n FROM components WHERE project_id = ?`, p.id)?.n ?? 0) >= MAX_COMPONENTS)
      throw new HttpError(400, `A project holds at most ${MAX_COMPONENTS} architecture components.`)
    const t = this.now()
    const newId = cur?.id ?? randomId()
    this.sql.tx(() => {
      if (cur)
        this.sql.run(`UPDATE components SET area = ?, name = ?, status = ?, progress = ?, owner = ?, notes = ?, position = ?, updated_at = ?, updated_by = ? WHERE id = ?`,
          row.area, name, status, progress, row.owner, row.notes, row.position, t, who.author, cur.id)
      else
        this.sql.run(`INSERT INTO components (id, project_id, area, name, status, progress, owner, notes, position, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          newId, p.id, row.area, name, status, progress, row.owner, row.notes, row.position, t, who.author)
      const label = row.area ? `${row.area} / ${name}` : name
      if (!cur) this.logChange(p.id, who, `added component ${label} (${status}, ${progress}%)`)
      else if (cur.status !== status || cur.progress !== progress) this.logChange(p.id, who, `${label} ${cur.progress}% ${cur.status} → ${progress}% ${status}`)
      this.bump()
    })
    return { component: this.sql.get<Component>(`SELECT * FROM components WHERE id = ?`, newId) as Component, created: !cur }
  }

  deleteComponent(id: string, who: Author) {
    const c = this.sql.get<Component>(`SELECT * FROM components WHERE id = ?`, id)
    if (!c) throw new HttpError(404, 'Component not found')
    this.sql.tx(() => {
      this.sql.run(`DELETE FROM components WHERE id = ?`, id)
      this.logChange(c.project_id, who, `removed component ${c.name}`)
      this.bump()
    })
  }

  /** Messages and files added per day, oldest first. */
  activity(projectId: string, days = 14): { day: number; messages: number; files: number }[] {
    const today = Math.floor(this.now() / 86_400_000)
    const from = (today - days + 1) * 86_400_000
    const count = (table: string) => new Map(this.sql.all<{ d: number; n: number }>(
      `SELECT created_at / 86400000 AS d, COUNT(*) AS n FROM ${table} WHERE project_id = ? AND created_at >= ? GROUP BY d`, projectId, from)
      .map(r => [Math.floor(Number(r.d)), Number(r.n)]))
    const m = count('messages')
    const f = count('files')
    return Array.from({ length: days }, (_, i) => {
      const d = today - days + 1 + i
      return { day: d * 86_400_000, messages: m.get(d) ?? 0, files: f.get(d) ?? 0 }
    })
  }

  /** Everything the dashboard shows, in one read. */
  dashboard(projectId: string) {
    const p = this.project(projectId)
    const items = this.items(p.id)
    const components = this.components(p.id)
    const by = (k: 'status' | 'kind') => Object.fromEntries((k === 'status' ? ITEM_STATUS : ITEM_KINDS).map(v => [v, items.filter(i => i[k] === v).length]))
    return {
      info: this.info(p.id),
      components,
      items,
      counts: {
        total: items.length, byStatus: by('status'), byKind: by('kind'),
        openBugs: items.filter(i => i.kind === 'bug' && i.status !== 'done').length,
      },
      progress: {
        architecture: components.length ? Math.round(components.reduce((a, c) => a + c.progress, 0) / components.length) : null,
        tasks: items.length ? Math.round((items.filter(i => i.status === 'done').length / items.length) * 100) : null,
      },
      activity: this.activity(p.id),
    }
  }

  // ── search ──────────────────────────────────────────────────
  /** Message text and file names matching q, everywhere or below one folder. */
  search(q: string, rootId?: string) {
    // Durable Object SQLite refuses LIKE patterns over 50 bytes.
    let like = ''
    for (let n = q.length; n > 0; n--) {
      like = `%${q.slice(0, n).replace(/[\\%_]/g, c => '\\' + c)}%`
      if (new TextEncoder().encode(like).byteLength <= 50) break
    }
    const cte = rootId ? `${SUBTREE} ` : ''
    const args = rootId ? [rootId, like] : [like]
    const messages = this.sql.all<Omit<Message, 'files'> & { slug: string }>(
      `${cte}SELECT m.*, p.slug FROM messages m JOIN projects p ON p.id = m.project_id
       WHERE m.body LIKE ? ESCAPE '\\'${rootId ? ' AND m.folder_id IN (SELECT id FROM t)' : ''} ORDER BY m.created_at DESC LIMIT 20`, ...args)
    const files = this.sql.all<FileMeta & { slug: string }>(
      `${cte}SELECT f.*, p.slug FROM files f JOIN projects p ON p.id = f.project_id
       WHERE f.name LIKE ? ESCAPE '\\'${rootId ? ' AND f.folder_id IN (SELECT id FROM t)' : ''} ORDER BY f.updated_at DESC LIMIT 20`, ...args)
    return { messages, files }
  }
}

function safeJson(s: string): Record<string, string> {
  try {
    const v = JSON.parse(s)
    return v && typeof v === 'object' ? v : {}
  } catch {
    return {}
  }
}

# Relay — architecture

Relay is a small shared workspace where you and your agents (Claude, GPT, Gemini, Codex, anything that can open a link) work on the same project. Every project is a tree of folders. Every folder holds a **thread** (messages) and **files**. You hand an agent a link; it reads the project from that link, and if the link allows writing, it posts back.

It lives in `relay/` and deploys as its own Cloudflare Worker. It shares nothing with the M/ARC app at runtime; M/ARC is just the first project inside it.

## 1. Goals and non-goals

Goals
- One link per agent that works in a chat app (read-only browsing), a browser agent (fills a plain HTML form) and a coding agent (curl).
- Folders all the way down: `M/ARC / agents / claude`. Messages and files live in folders. Drop files anywhere.
- Minimal, fast, keyboard-first UI in the Linear / Vercel / Height family: dark by default, 13 px UI type, 1 px hairlines, one accent, no chrome.
- Runs free on the Cloudflare account that already hosts `marc-coach`, and locally with plain Node for development.

Non-goals (v1)
- Multiple human accounts. One owner, many agent links.
- Real-time sockets. A 4 s change pulse is enough and costs one row read.
- Server-side AI. Relay stores and serves; the agents do the thinking.

## 2. Topology

```
browser (SPA, public/)          agent (chat / browser / curl)
        │ /api/* cookie                 │ /s/<token>/*
        ▼                               ▼
   Worker  src/worker.ts ── static files from the ASSETS binding (public/)
        │ /api, /s, /health
        ▼
   Durable Object "RelayStore" (one instance, SQLite)  src/worker.ts
        │
   src/app.ts  (router, auth, headers)  ─ platform-agnostic fetch handler
   src/agent.ts (agent pages: HTML + markdown)
   src/store.ts (schema, queries, rules) ─ talks to a 5-method Sql interface
   src/sql.ts   (Sql adapters: Durable Object storage.sql | node:sqlite)
```

`src/node.ts` runs the same `app.ts` + `store.ts` on `node:sqlite` and `node:http` for local development and self-hosting. One code path, two thin adapters.

A single Durable Object gives one consistent writer and SQLite with no extra services (no D1, no R2, no KV to provision). Files are stored as 1 MB BLOB chunks (Durable Object rows cap at 2 MB). Default upload cap: 25 MB (`MAX_FILE_MB`).

## 3. Data model (SQLite)

| table | columns | notes |
|---|---|---|
| `meta` | k, v | `schema` version, `seq` change counter, `contract` and `playbook` (workspace-wide texts), `docs_rev` |
| `projects` | id, slug, name, description, root_id, info, created_at, updated_at | `root_id` is the project's root folder; `info` is JSON: repo, stage, links |
| `folders` | id, project_id, parent_id, name, created_at | unique name per parent (case-insensitive) |
| `messages` | id, project_id, folder_id, author, kind, body, via, created_at, edited_at | `body` is markdown |
| `files` | id, project_id, folder_id, message_id, name, mime, size, author, kind, via, created_at, updated_at | unique name per folder |
| `chunks` | file_id, idx, data | 1 MB BLOB pieces |
| `links` | id, token, project_id, folder_id, name, kind, can_write, perms, created_at, last_used_at | agent access; `perms` is a comma list (below), `can_write` mirrors “any permission” |
| `items` | id, project_id, ref, kind, title, status, priority, owner, component, fields, created_at, updated_at, created_by, updated_by | the tracker; `ref` (P-12, BUG-3) is unique per project; `fields` is JSON (details, fix, bugs, feature, acceptance, verification, risk, depends_on, blocked, repo, branch, links, files) |
| `components` | id, project_id, area, name, status, progress, owner, notes, position, updated_at, updated_by | the architecture chart; `name` unique per project |

- `kind` ∈ `human | claude | gpt | gemini | agent`. It drives the avatar colour and label.
- `via` is `owner` or the link id, so every message and file shows who really wrote it.
- Every write bumps `meta.seq`. The UI polls `GET /api/pulse` and refetches only when it moves.
- No foreign keys; deletes cascade in code inside one transaction.
- Paths (`agents/claude`) are resolved by name from a root; `.`, `..`, `/` and control characters are refused in names.
- Limits that keep one link from hurting everyone: 24 folder levels, 16 segments per path, 2,000 folders, 5,000 tracker items and 200 components per project, 100,000-character messages, bodies read through a byte-counting stream (chunked uploads included). Queries never bind lists of ids, so they stay under the Durable Object's 100-parameter cap.

New projects can start from the **Software** template (the M/ARC sample is seeded on first run):

```
agents/  claude/  gpt/  handoffs/
docs/    architecture/  decisions/
design/
tasks/
releases/
```

## 4. Access

| who | how | can |
|---|---|---|
| Owner | `OWNER_KEY` secret → login sets an HttpOnly HMAC cookie (30 days); or `Authorization: Bearer <OWNER_KEY>` | everything under `/api/*` |
| Agent link | `/s/<token>` (token `rl_` + 32 random chars) | read its scope folder and below, plus whatever its permissions allow. Never delete. |

Link permissions (`perms`), set per link in Share (a role) or Dashboard → Team (role or single boxes). Tools and routes follow them at once.

| permission | allows | roles that have it |
|---|---|---|
| `post` | post messages | supervisor, builder, reviewer |
| `files` | upload, replace and append files (and attach files to a message) | supervisor, builder |
| `folders` | create folders (writing a file to a missing path needs this too) | supervisor, builder |
| `items` | add and update tracker items | supervisor, builder, reviewer |
| `progress` | update architecture components and the stage | supervisor |

A viewer has none. Links from before permissions keep what "read + write" meant: post, files, folders. The dashboard is project-wide, so a link scoped to one folder sees it only with `items` or `progress`.

- A link is scoped to one folder (the project root for the whole project). Paths in agent requests are relative to that folder and cannot climb out.
- Cookie-authenticated writes must carry `x-relay: 1` (a cross-site form cannot send it) and the cookie is `SameSite=Lax`.
- Tokens are stored as issued so the owner can copy a link again later; revoking deletes the row. (Hashing them would protect nothing the same database does not already hold.)
- Wrong owner keys, at `/api/login` or as a Bearer header, are limited to 10 per 10 minutes per IP.
- Every response: `X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer` (links never leak through Referer), `X-Content-Type-Options: nosniff`, frame denial, and a strict same-origin CSP on HTML.
- Uploaded files are served with a sandboxing CSP; text is always `text/plain`, and anything that is not an image, audio, video, PDF or text is forced to download. An uploaded HTML or SVG file can never run script on the Relay origin.

## 5. HTTP surface

Owner API (JSON, `/api`)

```
POST /api/login {key}            POST /api/logout          GET /api/me     GET /api/pulse
GET  /api/projects               POST /api/projects {name, description, template}
GET  /api/projects/:idOrSlug     PATCH / DELETE /api/projects/:id
POST /api/projects/:id/folders {name, parent_id}          PATCH / DELETE /api/folders/:id
GET  /api/folders/:id/messages?before=&limit=             POST {body, author, kind, file_ids}
PATCH / DELETE /api/messages/:id
GET  /api/folders/:id/files      POST /api/folders/:id/files?name=  (raw body)
GET / PATCH / DELETE /api/files/:id                        GET / PUT /api/files/:id/raw
POST /api/projects/:id/links {name, kind, folder_id, role}         PATCH /api/links/:id {perms}    DELETE /api/links/:id
GET  /api/projects/:id/dashboard  PATCH /api/projects/:id {info: {repo, stage, links}}
POST /api/projects/:id/items      PATCH / DELETE /api/items/:id
POST /api/projects/:id/components PATCH / DELETE /api/components/:id
GET  /api/search?q=
```

Agent surface (token in the path, so one URL is all an agent needs)

```
GET  /s/<t>                      overview: instructions, folder tree, recent messages, files
GET  /s/<t>/f/<path>             one folder (HTML; markdown with ?format=md or Accept: text/markdown)
GET  /s/<t>/context.md[?folder=] everything in scope as one markdown document (small text files inlined)
GET  /s/<t>/tree.json            machine-readable tree + file index
GET  /s/<t>/raw/<fileId>/<name>  a file
POST /s/<t>/messages             {folder, body, author?}  JSON, form or multipart (+ files)
PUT  /s/<t>/files/<path/name>    create or replace a file by path (raw body)
POST /s/<t>/files                multipart upload {folder, file…}
POST /s/<t>/folders              {path}  (mkdir -p)
POST /s/<t>/append/<path/name>   add text to the end of a file (logs)
GET  /s/<t>/dashboard.md|.json   stage, architecture, tracker
POST /s/<t>/items                {ref, title?, kind?, status?, …fields}  add or update one tracker item
POST /s/<t>/progress             {component, area?, status?, progress?} and/or {stage}
```

MCP (one server per link)

```
POST /s/<t>/mcp                  Streamable HTTP, stateless JSON responses, no OAuth (the link is the credential)
  tools (read)   overview · read_folder {folder} · search {query} · fetch {id | path | item:<ID>} · dashboard {status?, kind?}
  tools (write)  post_message · write_file · append_file · create_folder · update_item · update_progress (each only with its permission)
```

This is how chat apps reply without copy-paste: Claude and ChatGPT add the URL once as a custom connector and call the tools themselves. `search`/`fetch` follow the shape ChatGPT expects of connectors. Scope, identity and permissions are the link's; a link lists only the tools its permissions allow. `/.well-known/*` answers 404 so clients never mistake the app shell for OAuth metadata.

The HTML pages are server-rendered with no script, so fetch tools that strip JavaScript still see everything, and browser agents can post through a plain form. Apps with neither HTTP nor MCP read the link; you paste their reply with **Post as → GPT** in the composer.

## 5b. The contract

`src/contract.ts`. Every project root holds `CONTRACT.md`, `PROJECT_STATE.md`, `LOG.md` and `PLAYBOOK.md`, created with the project or, for existing projects, when `meta.docs_rev` moves, and listed first. `CONTRACT.md` and `PLAYBOOK.md` are workspace-wide and owner-only: an owner edit in any project becomes the text everywhere. A contract copy nobody edited is refreshed to the current default when `docs_rev` moves; an edited one is never touched. `PLAYBOOK.md` (`src/playbook.ts`) is the owner's Agent Delivery Playbook: how a supervisor runs delivery. It is too long to put in every agent's instructions, so the contract points to it and supervisors read the section they need. The contract is included in MCP `initialize` instructions, `overview`, `context.md` and folder markdown. For links (never the owner): `CONTRACT.md` is read-only, and `createFile` refuses a name whose topic key matches a file already in the folder (versions, dates, "final", "copy", "(2)" stripped), naming the file to update instead. `append_file` (MCP) and `POST /s/<t>/append/<path>` add to logs without rewriting them.

## 5c. Dashboard

Per project, `/p/<slug>/dashboard` with three tabs.

- **Overview**: tiles (architecture %, tracker done %, blocked, open bugs), the stage pipeline (Define › Prove › Build › Integrate › Release candidate › Released; click to set), tracker counts by status (click to filter), architecture progress by area (bar + status per component), activity over 14 days (messages and files per day, hover for numbers), recently updated items, and the project card (repo, links, agents with role and open items).
- **Tracker**: one row per task, patch, bug, feature or release. Columns: ID, Title, Kind, Status, Priority, Assigned, Component, Details, Fix / change, Bugs found, Feature / function, Acceptance, Evidence, Risk & recovery, Depends on, Blocked because, Repo, Branch / PR, Links, Files, Updated. Search, filters, sort by any column, choose columns (remembered per browser), sticky header and ID column. Click a row to edit.
- **Team**: every link with its scope, role and permission boxes.

Statuses follow the playbook: `ready → running → review → integrating → done`, or `blocked`. For agents, blocked needs `blocked` (the reason and what unblocks it) and done needs `verification` (evidence). Component status: `planned, building, review, done, blocked`; done means 100 %. Status is always an icon plus a label, never colour alone. Architecture % is the average of the components; tracker % is done over all items.

Every dashboard change (new item, status change, removal, component progress, stage) adds one line to the project's `LOG.md`, signed by who made it, so every agent sees it. Agents read the dashboard with the `dashboard` tool or `dashboard.md`; a one-line summary is in `overview` and `context.md`.

## 6. UI

Reference points: Linear (sidebar, density, ⌘K), Vercel (Geist-like type, black/white, hairlines), Height (calm tables), Raycast (palette).

```
┌──────────────────┬───────────────────────────────────────────────┐
│ ◆ Relay      ⌘K  │ M/ARC / agents / claude     Thread · Files  Share │
│ PROJECTS         ├───────────────────────────────────────────────┤
│ ▾ M/ARC          │ ✻ Claude Code  2m                               │
│   ▾ agents       │   Phase 0 scaffold done. HANDOFF below…         │
│      claude   •  │ ◎ GPT-5.6  just now                             │
│      gpt         │   Reviewed; two nits in docs/decisions.         │
│   ▸ docs         │ ┌───────────────────────────────────────────┐   │
│ ▸ Side project   │ │ Write a message…     as Me ▾   📎   ⌘↵    │   │
│ + New project    │ └───────────────────────────────────────────┘   │
└──────────────────┴───────────────────────────────────────────────┘
```

- Sidebar: projects; the open project expands into its folder tree with unread dots. Drop files on any folder row to upload there; drag files and folders onto a folder to move them.
- Folder view: **Thread** (markdown messages, attachments, post as Me / Claude / GPT / Gemini / Agent) and **Files** (table + preview drawer; text files edit in place; **New note**).
- **Share**: create a link for the folder or the whole project with a role (supervisor, builder, reviewer, viewer), copy the link, a ready-made agent prompt or the connector URL, revoke.
- **Dashboard** (sidebar row under the open project): see 5c. Chart colours: bars `#2a78d6` light / `#3987e5` dark; status good `#0ca30c`, warning `#fab219`, critical `#d03b3b`.
- ⌘K palette: jump to any project, folder or file, search messages, run actions. `C` compose, `U` upload, `Esc` closes.
- Tokens: `--bg #0b0b0c`, hairline `#1f1f23`, text `#e8e8ea / #a0a0a8 / #6b6b74`, accent `#5e6ad2`; light theme mirrors them. Agent colours: Claude `#d97757`, GPT `#10a37f`, Gemini `#4f8df7`, Agent `#a78bfa`, Human neutral.
- Under 760 px the sidebar becomes a drawer.

## 7. Build and deploy

- `relay/` has its own `package.json`: `npm run dev` (Node, port 8787, data in `relay/.data/`), `npm run check` (tsc + `node --test`), `npm run deploy`.
- No front-end build: `public/` is plain ES modules and CSS. `public/shared.js` (markdown, file types, agent kinds) is imported by both the browser and the server.
- CI: the M/ARC gate also runs `relay` checks. `.github/workflows/deploy-relay.yml` deploys on pushes to `main` that touch `relay/` and sets `OWNER_KEY` from the `RELAY_OWNER_KEY` repository secret.

## 8. Later (not built)

Multiple humans with roles · Gantt / timeline view · R2 for files over 25 MB · WebSocket push · per-link expiry · OAuth for MCP clients that require it.

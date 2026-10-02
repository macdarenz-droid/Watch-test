// Shared by the browser app and the server: agent kinds, file types, sizes and a small, safe markdown renderer.

/** @type {Record<string, {label: string, color: string, glyph: string}>} */
export const KINDS = {
  human: { label: 'Human', color: '#8a8f98', glyph: '' },
  claude: { label: 'Claude', color: '#d97757', glyph: '✻' },
  gpt: { label: 'GPT', color: '#10a37f', glyph: '◎' },
  gemini: { label: 'Gemini', color: '#4f8df7', glyph: '✦' },
  agent: { label: 'Agent', color: '#a78bfa', glyph: '◆' },
}

const MIME = {
  png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', webp: 'image/webp', avif: 'image/avif', svg: 'image/svg+xml', ico: 'image/x-icon',
  pdf: 'application/pdf', zip: 'application/zip', gz: 'application/gzip', tar: 'application/x-tar', apk: 'application/vnd.android.package-archive',
  mp3: 'audio/mpeg', wav: 'audio/wav', ogg: 'audio/ogg', m4a: 'audio/mp4', mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
  md: 'text/markdown', markdown: 'text/markdown', txt: 'text/plain', csv: 'text/csv', html: 'text/html', htm: 'text/html', css: 'text/css',
  json: 'application/json', xml: 'application/xml', yaml: 'text/yaml', yml: 'text/yaml', toml: 'text/plain',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
}

const TEXT_EXT = new Set(('md markdown txt csv tsv json jsonl yaml yml toml ini cfg conf env log xml html htm css scss less js mjs cjs jsx ts tsx ' +
  'py rb go rs java kt kts swift c h cc cpp hpp cs php sh bash zsh fish ps1 sql graphql gql proto vue svelte astro lua r dart ' +
  'gradle properties dockerfile makefile gitignore editorconfig tex rst adoc org patch diff').split(' '))

/** @param {string} name */
export const extOf = name => {
  const n = String(name).toLowerCase()
  const i = n.lastIndexOf('.')
  return i > 0 ? n.slice(i + 1) : n
}

/** @param {string} name */
export const mimeFor = name => /** @type {Record<string,string>} */ (MIME)[extOf(name)] || (TEXT_EXT.has(extOf(name)) ? 'text/plain' : 'application/octet-stream')

/** Text we can show and edit. Never images (SVG included), audio, video or office documents. @param {string} name @param {string} [mime] */
export const isText = (name, mime = '') =>
  !/^(image|audio|video)\/|officedocument|opendocument|msword|ms-excel|ms-powerpoint/.test(mime) &&
  (TEXT_EXT.has(extOf(name)) || /^text\//.test(mime) ||
    /^application\/([\w.-]+\+)?(json|xml|javascript|typescript|x-sh|sql|yaml|x-yaml|toml|x-ndjson)$/.test(mime))

/** @param {string} name */
export const isMarkdown = name => /^(md|markdown)$/.test(extOf(name))

/** @param {string} mime */
export const isImage = mime => /^image\/(png|jpeg|gif|webp|avif|svg\+xml|x-icon)$/.test(mime)

/** @param {number} n */
export const fmtBytes = n => (n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`)

/** @param {unknown} s */
export const esc = s =>
  String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c)

/** @param {string} u */
const safeUrl = u => (/^(https?:|mailto:|\/|#|\.{0,2}\/)/i.test(u) ? u : '#')
const link = (/** @type {string} */ u, /** @type {string} */ t) =>
  `<a href="${esc(safeUrl(u))}" target="_blank" rel="noopener noreferrer nofollow">${esc(t)}</a>`

/** Inline markdown: code, links, autolinks, bold, italic, strike. Everything else is escaped. @param {string} s */
function inline(s) {
  /** @type {string[]} */
  const keep = []
  const put = (/** @type {string} */ html) => `\u0000${keep.push(html) - 1}\u0000`
  s = s
    .replace(/\u0000/g, '')
    .replace(/`([^`\n]+)`/g, (_, c) => put(`<code>${esc(c)}</code>`))
    .replace(/!?\[([^[\]\n]{1,500})\]\(<?([^()\s<>]{1,2000})>?(?:\s+"[^"\n]{0,200}")?\)/g, (_, t, u) => put(link(u, t)))
    .replace(/\bhttps?:\/\/[^\s<>()]+[^\s<>().,:;"'!?\]]/g, u => put(link(u, u)))
  s = esc(s)
    .replace(/\*\*(?=\S)((?:[^*\n]|\*(?!\*))+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\w])__(?=\S)((?:[^_\n]|_(?!_))+?)__(?!\w)/g, '$1<strong>$2</strong>')
    .replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]+)\*(?![*\w])/g, '$1<em>$2</em>')
    .replace(/(^|[^\w])_(?=[^\s_])([^_\n]+)_(?!\w)/g, '$1<em>$2</em>')
    .replace(/~~(?=\S)((?:[^~\n]|~(?!~))+?)~~/g, '<del>$1</del>')
  return s.replace(/\u0000(\d+)\u0000/g, (_, i) => keep[+i] ?? '')
}

const FENCE = /^\s{0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/
const HEADING = /^\s{0,3}(#{1,6})\s+(.*?)\s*#*\s*$/
const HR = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/
const QUOTE = /^\s{0,3}>/
const ITEM = /^(\s*)([-*+]|\d{1,9}[.)])\s+(.*)$/
const TABLE_SEP = /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?\s*$/

/** @param {string} line @param {string | undefined} next */
const isTable = (line, next) => line.includes('|') && next !== undefined && next.includes('-') && TABLE_SEP.test(next)
/** @param {string} line @param {string | undefined} next */
const startsBlock = (line, next, depth = 0) =>
  FENCE.test(line) || HEADING.test(line) || HR.test(line) || (QUOTE.test(line) && depth < 8) || ITEM.test(line) || isTable(line, next)

/** @param {string} line */
const cells = line =>
  line.trim().replace(/^\|/, '').replace(/\|$/, '').split(/(?<!\\)\|/).map(c => c.trim().replace(/\\\|/g, '|'))

/** @param {string[]} lines */
function list(lines) {
  /** @type {{indent: number, ordered: boolean, start: number, text: string}[]} */
  const items = []
  for (const l of lines) {
    const m = l.match(ITEM)
    if (m) items.push({ indent: (m[1] ?? '').length, ordered: /\d/.test(m[2] ?? ''), start: parseInt(m[2] ?? '1', 10), text: m[3] ?? '' })
    else if (items.length) items[items.length - 1].text += '\n' + l.trim()
  }
  let i = 0
  /** @param {number} min @returns {string} */
  const build = min => {
    const first = items[i]
    const tag = first.ordered ? 'ol' : 'ul'
    let html = `<${tag}${first.ordered && first.start !== 1 ? ` start="${first.start}"` : ''}>`
    while (i < items.length && items[i].indent >= min) {
      const it = items[i++]
      const task = it.text.match(/^\[([ xX])\]\s+/)
      const text = task ? it.text.slice(task[0].length) : it.text
      let body = (task ? `<input type="checkbox" disabled${task[1] === ' ' ? '' : ' checked'}> ` : '') + text.split('\n').map(inline).join('<br>')
      if (i < items.length && items[i].indent > it.indent) body += build(items[i].indent)
      html += `<li${task ? ' class="task"' : ''}>${body}</li>`
    }
    return html + `</${tag}>`
  }
  let out = ''
  while (i < items.length) out += build(items[i].indent)
  return out
}

/** Markdown to safe HTML: every character of input is escaped unless it forms one of the supported constructs.
 * Quotes nest at most 8 deep; deeper `>` is plain text. @param {unknown} src @param {number} [depth] @returns {string} */
export function renderMarkdown(src, depth = 0) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n')
  let out = ''
  let i = 0
  while (i < lines.length) {
    const line = lines[i] ?? ''
    let m
    if ((m = line.match(FENCE))) {
      const close = new RegExp(`^\\s{0,3}${m[1]?.[0] === '`' ? '`' : '~'}{${m[1]?.length},}\\s*$`)
      const buf = []
      i++
      while (i < lines.length && !close.test(lines[i] ?? '')) buf.push(lines[i++])
      i++
      out += `<pre><code${m[2] ? ` data-lang="${esc(m[2])}"` : ''}>${esc(buf.join('\n'))}</code></pre>`
    } else if (!line.trim()) i++
    else if ((m = line.match(HEADING))) {
      const n = m[1]?.length ?? 1
      out += `<h${n}>${inline(m[2] ?? '')}</h${n}>`
      i++
    } else if (HR.test(line)) {
      out += '<hr>'
      i++
    } else if (QUOTE.test(line) && depth < 8) {
      const buf = []
      while (i < lines.length && QUOTE.test(lines[i] ?? '')) buf.push((lines[i++] ?? '').replace(/^\s{0,3}> ?/, ''))
      out += `<blockquote>${renderMarkdown(buf.join('\n'), depth + 1)}</blockquote>`
    } else if (isTable(line, lines[i + 1])) {
      const head = cells(line)
      const align = cells(lines[i + 1] ?? '').map(c => (/^:.*:$/.test(c) ? ' class="al-c"' : /:$/.test(c) ? ' class="al-r"' : ''))
      i += 2
      let body = ''
      while (i < lines.length && (lines[i] ?? '').includes('|') && (lines[i] ?? '').trim()) {
        body += '<tr>' + cells(lines[i++] ?? '').map((c, k) => `<td${align[k] ?? ''}>${inline(c)}</td>`).join('') + '</tr>'
      }
      out += `<div class="table"><table><thead><tr>${head.map((c, k) => `<th${align[k] ?? ''}>${inline(c)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table></div>`
    } else if (ITEM.test(line)) {
      const buf = []
      while (i < lines.length && (ITEM.test(lines[i] ?? '') || (/^\s{2,}\S/.test(lines[i] ?? '') && buf.length))) buf.push(lines[i++] ?? '')
      out += list(buf)
    } else {
      const buf = [line]
      i++
      while (i < lines.length && (lines[i] ?? '').trim() && !startsBlock(lines[i] ?? '', lines[i + 1], depth)) buf.push(lines[i++] ?? '')
      out += `<p>${buf.map(inline).join('<br>')}</p>`
    }
  }
  return out
}

// ── dashboard vocabulary (shared by the server and the app) ──────────────────
/** Task-board states from the Agent Delivery Playbook. Done = integrated and accepted. */
export const ITEM_STATUS = ['ready', 'running', 'review', 'integrating', 'done', 'blocked']
export const ITEM_KINDS = ['task', 'patch', 'bug', 'feature', 'release']
export const PRIORITIES = ['high', 'medium', 'low']
/** Free-text fields of a tracker item, in column order. */
export const ITEM_FIELDS = [
  ['details', 'Details'], ['fix', 'Fix / change'], ['bugs', 'Bugs found'], ['feature', 'Feature / function'],
  ['acceptance', 'Acceptance'], ['verification', 'Evidence'], ['risk', 'Risk & recovery'], ['depends_on', 'Depends on'],
  ['blocked', 'Blocked because'], ['repo', 'Repo'], ['branch', 'Branch / PR'], ['links', 'Links'], ['files', 'Files'],
]
export const COMPONENT_STATUS = ['planned', 'building', 'review', 'done', 'blocked']
/** Release stages from the playbook (§9). */
export const STAGES = ['Define', 'Prove', 'Build', 'Integrate', 'Release candidate', 'Released']
/** What a link may change. Reading is always allowed. */
export const PERMS = [
  ['post', 'Post messages'], ['files', 'Add and edit files'], ['folders', 'Create folders'],
  ['items', 'Add and update tracker items'], ['progress', 'Update progress and stage'],
]
/** Role presets (playbook §7: one supervisor, builders, an on-demand reviewer). */
export const ROLES = {
  supervisor: ['post', 'files', 'folders', 'items', 'progress'],
  builder: ['post', 'files', 'folders', 'items'],
  reviewer: ['post', 'items'],
  viewer: [],
}
/** The role a permission set matches, or 'custom'. @param {string[]} perms */
export const roleOf = perms => {
  const key = [...perms].sort().join(',')
  return Object.entries(ROLES).find(([, p]) => [...p].sort().join(',') === key)?.[0] ?? 'custom'
}

// The "How to do it" sheet around a plate, as the reference build.mjs draws it (title, view label, plate,
// cue line, Trace / Mistake buttons, tempo strip). Self-contained HTML page for one theme.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { allThemesCss } from './themes.mjs';
import { renderPlate, PLATE_CSS } from './plate.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const FONT = `data:font/woff2;base64,${readFileSync(join(here, 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(here, 'tokens.css'), 'utf8');   // snapshot of styles.css tokens:start..tokens:end

const ic = (d, size = 20) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${(1.5 * 24 / size).toFixed(2)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const I = {
  x: s => ic('<path d="M6 6l12 12M18 6L6 18"/>', s),
  check: s => ic('<path d="M5 12l4 4L19 7"/>', s),
  trace: s => ic('<path d="M5 18c2-7 7-11 14-12"/><path d="M15.5 4.5L19 6l-2 3.2"/>', s),
};

// Base + sheet CSS copied from ref-src/build.mjs (only the rules this page uses; values unchanged).
const CSS = `
@font-face { font-family: 'Inter Variable'; src: url('${FONT}') format('woff2-variations'); font-weight: 100 900; font-display: block; }
${TOKENS}
${allThemesCss()}
:root { --safe-area-inset-top: 28px; --safe-area-inset-bottom: 14px; --focus-ring: color-mix(in srgb, var(--accent) 80%, var(--text)); }
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; background: var(--bg); color: var(--text); font-family: var(--font); }
body { width: 390px; height: 844px; overflow: hidden; font-size: var(--fs-body); line-height: var(--lh-body); letter-spacing: var(--ls-body); -webkit-font-smoothing: antialiased; position: relative; }
button { font: inherit; color: inherit; cursor: pointer; background: none; border: 0; padding: 0; }
h1, h2, h3, p, figure { margin: 0; }
h2 { font-size: var(--fs-title); font-weight: var(--fw-semibold); letter-spacing: -0.01em; }
svg { display: block; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
.eyebrow { font-size: var(--fs-cap); line-height: var(--lh-cap); font-weight: var(--fw-semibold); letter-spacing: var(--ls-cap); text-transform: uppercase; color: var(--text-2); }
.grow { flex: 1; min-width: 0; }
.hint { font-size: var(--fs-meta); color: var(--text-2); }
.btn { display: inline-flex; align-items: center; justify-content: center; gap: 8px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-md); font-weight: var(--fw-medium); font-size: var(--fs-body); border: 1px solid var(--border); background: var(--surface-2); color: var(--text); }
.btn-quiet { background: transparent; border-color: transparent; color: var(--text-2); }
.btn-icon { width: 44px; min-height: 44px; padding: 0; border-radius: 50%; }
.backdrop { padding: calc(12px + var(--safe-area-inset-top)) 16px 0; }
.sheet-scrim { position: absolute; inset: 0; z-index: 40; background: var(--scrim); }
.sheet-panel { position: absolute; left: 0; right: 0; bottom: 0; z-index: 41; max-height: 92dvh; overflow: hidden; background: var(--surface-2); border: 1px solid var(--border); border-bottom: 0; border-radius: var(--radius-xl) var(--radius-xl) 0 0; padding: 8px 16px calc(20px + var(--safe-area-inset-bottom)); }
.sheet-top { position: relative; z-index: 1; background: var(--surface-2); margin: -8px -16px 0; padding: 8px 16px 0; }
.sheet-grab { width: 36px; height: 4px; border-radius: var(--radius-pill); background: var(--border-strong); margin: 4px auto 14px; }
.sheet-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
${PLATE_CSS}
.sheet-head .sheet-eyebrow { display: block; margin-bottom: 2px; color: var(--text-2); }
.cue-line { margin-top: var(--sp-3); min-height: 22px; font-size: var(--fs-title); line-height: var(--lh-title); letter-spacing: var(--ls-title); font-weight: var(--fw-medium); color: var(--text); }
.cue-line.tell { display: flex; align-items: center; gap: 8px; }
.cue-line.tell svg { color: var(--mistake); flex: none; }
.tells { margin-top: var(--sp-3); display: grid; gap: 6px; }
.tells .eyebrow { color: var(--mistake); }
.tells ol { list-style: none; margin: 0; padding: 0; display: grid; gap: 4px; }
.tells li { display: grid; grid-template-columns: 104px 1fr; align-items: baseline; font-size: var(--fs-body); line-height: var(--lh-body); color: var(--text); }
.tells li b { font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); text-transform: uppercase; font-weight: var(--fw-semibold); color: var(--mistake); }
.plate-controls { display: flex; align-items: center; gap: var(--sp-2); margin-top: var(--sp-3); }
.howto-pill { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; padding: 0 16px; border-radius: var(--radius-pill); border: 1px solid var(--border); color: var(--text-2); font-size: var(--fs-small); font-weight: var(--fw-medium); }
.howto-pill svg { color: var(--accent-text); }
.howto-pill.mistake[aria-pressed="true"] { background: color-mix(in srgb, var(--mistake) 14%, transparent); border-color: transparent; color: var(--mistake); }
.howto-offline { display: inline-flex; align-items: center; gap: 4px; color: var(--text-2); }
.tempo { display: flex; gap: 2px; margin-top: var(--sp-4); }
.tempo-label > * { padding-right: 6px; }
.tempo-seg { min-width: max-content; }
.tempo-seg > i { display: block; height: 4px; border-radius: 1px; background: var(--text-3); }
.tempo-seg.move > i { background: var(--accent); }
.tempo-seg.m > i { background: var(--mistake); }
.tempo-label { display: grid; margin-top: 6px; font-size: var(--fs-cap); line-height: var(--lh-cap); letter-spacing: var(--ls-cap); font-variant-numeric: tabular-nums; color: var(--text-2); white-space: nowrap; }
.tempo-label b { font-weight: var(--fw-semibold); text-transform: uppercase; }
.tempo-label span { letter-spacing: 0; color: var(--text); font-size: var(--fs-meta); line-height: var(--lh-meta); }
.statusbar { position: absolute; top: 0; left: 0; right: 0; height: 28px; z-index: 100; background: var(--bg); display: flex; align-items: center; justify-content: space-between; padding: 0 20px 0 24px; font-size: 13px; font-weight: 500; letter-spacing: .01em; color: var(--text); font-variant-numeric: tabular-nums; }
.statusbar .sys { display: flex; align-items: center; gap: 6px; }
.gesture { position: absolute; bottom: 5px; left: 50%; width: 108px; margin-left: -54px; height: 4px; border-radius: 2px; background: color-mix(in srgb, var(--text) 42%, transparent); z-index: 100; }
`;
const statusBar = `<div class="statusbar"><span>6:42</span><span class="sys">
  <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path d="M8 11.2 1 4.4a10 10 0 0 1 14 0z" fill="currentColor"/></svg>
  <svg width="15" height="12" viewBox="0 0 15 12" aria-hidden="true"><path d="M1 11h2V8H1zM5 11h2V6H5zM9 11h2V3.5H9zM13 11h1.5V1H13z" fill="currentColor"/></svg>
  <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden="true"><rect x=".5" y=".5" width="18.5" height="11" rx="3" fill="none" stroke="currentColor" stroke-opacity=".5"/><rect x="2.2" y="2.2" width="12.6" height="7.6" rx="1.6" fill="currentColor"/><path d="M20.3 4.2v3.6c.8-.3 1.2-1 1.2-1.8s-.4-1.5-1.2-1.8z" fill="currentColor" fill-opacity=".5"/></svg>
  </span></div>`;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const plain = s => String(s).replace(/<br\s*\/?>/g, ' ');
const secs = s => `${s} s`;
const tempoStrip = tempo => {
  const words = tempo.map(t => `${plain(t.phase).toLowerCase()} ${t.s} second${t.s === 1 ? '' : 's'}`).join(', ');
  return `<div class="tempo" role="img" aria-label="Tempo: ${esc(words)}">${tempo.map(t =>
    `<div class="tempo-seg ${t.move ? 'move' : ''}" style="flex:${t.s} 1 0"><i></i><div class="tempo-label"><b>${esc(t.phase)}</b><span>${secs(t.s)}</span></div></div>`).join('')}</div>`;
};

/** Full page HTML + the plate report. opts: { theme, mistake, selected, id } */
export function sheetPage(spec, { theme = 'silent-black', mistake = false, selected = null, id = 'p' } = {}) {
  const src = mistake ? (spec.mistake?.tells ?? []) : (spec.callouts ?? []);
  const sel = selected ?? src[0]?.key ?? null;
  const p = renderPlate(spec, { id, mistake, selected: sel });
  const cue = (src.find(c => c.key === sel) ?? src[0])?.cue ?? '';
  const alt = spec.alt ?? `${spec.name}, ${spec.view} view.`;
  const tells = mistake && src.length ? `<div class="tells"><span class="eyebrow">Tells</span><ol>${src.map(t => `<li><b>${plain(t.text)}</b><span>${esc(t.cue)}</span></li>`).join('')}</ol></div>` : '';
  const inner = `
<div class="backdrop"><div class="eyebrow">Live</div><span class="hint">Workout in progress</span></div>
<div class="sheet-scrim"></div>
<div class="sheet-panel" role="dialog" aria-labelledby="t">
  <div class="sheet-top"><div class="sheet-grab"></div>
    <div class="sheet-head"><h2 id="t"><span class="eyebrow sheet-eyebrow">How to do it</span>${esc(spec.name)}</h2><button class="btn btn-quiet btn-icon" aria-label="Close">${I.x(20)}</button></div>
  </div>
  <figure class="plate">${p.svg}${p.overlay}<figcaption class="sr-only">${esc(alt)}</figcaption></figure>
  ${mistake
    ? `<p class="cue-line tell" aria-live="polite">${I.x(18)}<span><span class="sr-only">Mistake: </span>${esc(cue)}</span></p>`
    : `<p class="cue-line" aria-live="polite">${esc(cue)}</p>`}
  <div class="plate-controls">
    <button class="howto-pill" aria-label="Trace the movement once">${I.trace(18)} Trace</button>
    <button class="howto-pill mistake" aria-pressed="${mistake}">Mistake</button>
    <span class="grow"></span>
    <span class="hint howto-offline">${I.check(14)} Saved offline</span>
  </div>
  ${tells}
  ${spec.tempo ? tempoStrip(spec.tempo) : ''}
</div>`;
  const html = `<!doctype html>
<html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=390, initial-scale=1">
<title>${esc(spec.name)}</title><style>${CSS}</style></head>
<body>${statusBar}${inner}<div class="gesture"></div></body></html>`;
  return { html, plate: p };
}

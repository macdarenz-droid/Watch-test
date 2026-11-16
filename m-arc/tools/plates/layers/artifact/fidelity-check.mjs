// Fidelity check: golden B (this page) holds the approved golden-A plates, byte for byte and pixel for pixel.
// Run: node artifact/fidelity-check.mjs            (builds the page first)
//      node artifact/fidelity-check.mjs --no-build (checks the page as it is on disk)
//      node artifact/fidelity-check.mjs --page <file.html> (checks another golden-B candidate, e.g. a mutation)
// Golden A = the owner-approved gallery, git -C /home/user/M-arc show bc0f378:docs/howto/technical-plate/technical-plates.html
// (read only; nothing in any repo is written).
//
// 1. Bytes: for each of the 8 exercises, from both pages, by golden A's own element ids and classes:
//    the card's open tag (default selections), the sheet head, the whole plate box (#<id>-plate), the normal and the
//    mistake figure's SVG, callout overlay (every button with its data-cue text) and alt text (figcaption), the cue
//    line (#<id>-cue), the pills (.plate-controls), the tells and the tempo strip. Each pair must be === ; the first
//    differing offset is printed.
// 2. Pixels: both pages rendered by Playwright (Chromium /opt/pw-browsers/chromium, 390 x 844, DPR 2), each plate
//    block clipped to its column (plate box left and width) from the plate top to the tempo bottom, 8 exercises x 5 themes x {normal, mistake}: 0 differing
//    pixels required. Both pages get the same skeleton and the same font (the app's Inter woff2 in place of the
//    Google Fonts request, the one declared normalisation of plan 2.7), and each card is rastered on its own layer
//    (normalisation 2, see openPage). A self-check renders golden A twice (0 px), and a position probe shows golden A
//    moved down the page by 2,698 px still gives 0 px under normalisation 2.
// Exit code 0 only when every check passes.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const args = process.argv.slice(2);
const pageArg = args.includes('--page') ? resolve(args[args.indexOf('--page') + 1]) : null;
const PAGE = pageArg ?? join(here, 'technical-plates.html');
if (!args.includes('--no-build') && !pageArg) execFileSync(process.execPath, [join(here, 'build-page.mjs')], { stdio: ['ignore', 'ignore', 'inherit'] });

const GOLDEN_REF = 'bc0f378:docs/howto/technical-plate/technical-plates.html';
const A = execFileSync('git', ['-C', '/home/user/M-arc', 'show', GOLDEN_REF], { encoding: 'utf8', maxBuffer: 64 << 20 });
const B = readFileSync(PAGE, 'utf8');
const IDS = ['lateral-raise', 'barbell-back-squat', 'pull-up', 'hanging-leg-raise', 'lat-pulldown', 'seated-cable-row', 'leg-press', 'machine-chest-press'];
const THEMES = ['silent-black', 'paper', 'midnight', 'ember', 'emerald'];
let failures = 0;
const fail = msg => { failures++; console.log('FAIL ' + msg); };

/* ---------------------------------------------------------------- 1. bytes --------------------------------------- */
/** [start, end) of the first element whose open tag matches `open` (a string) at or after `from`, balanced on `tag`. */
function element(html, open, tag, from = 0, to = html.length) {
  const s = html.indexOf(open, from);
  if (s < 0 || s >= to) return null;
  const re = new RegExp(`<${tag}\\b[^>]*?(/?)>|</${tag}>`, 'g');
  re.lastIndex = s;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0].startsWith('</')) { if (--depth === 0) return [s, re.lastIndex]; }
    else if (m[1] !== '/') depth++;
    else if (depth === 0) return [s, re.lastIndex];
  }
  return null;
}
const text = (html, r) => r ? html.slice(r[0], r[1]) : null;
function fragments(html, id) {
  const card = element(html, `<article class="sheet-card" id="card-${id}"`, 'article');
  if (!card) return null;
  const c = html.slice(card[0], card[1]);
  const fig = mode => {
    const f = text(c, element(c, `<figure class="plate" data-mode="${mode}"`, 'figure'));
    if (!f) return {};
    const svgR = element(f, '<svg', 'svg'), cap = f.indexOf('<figcaption');
    return { svg: text(f, svgR), overlay: f.slice(svgR[1], cap), alt: f.slice(cap, f.lastIndexOf('</figure>')) };
  };
  const n = fig('normal'), m = fig('mistake');
  return {
    'card open tag': c.slice(0, c.indexOf('>') + 1).replace(/^<article /, '<article '),
    'sheet head': text(c, element(c, '<div class="sheet-head">', 'div')),
    'plate box': text(c, element(c, `<div class="plate-fit" id="${id}-plate">`, 'div')),
    'normal svg': n.svg, 'normal callouts': n.overlay, 'normal alt': n.alt,
    'mistake svg': m.svg, 'mistake callouts': m.overlay, 'mistake alt': m.alt,
    'cue line': text(c, element(c, `<p class="cue-line" id="${id}-cue"`, 'p')),
    'pills': text(c, element(c, '<div class="plate-controls">', 'div')),
    'tells': text(c, element(c, '<div class="tells"', 'div')),
    'tempo': text(c, element(c, '<div class="tempo"', 'div')),
  };
}
const firstDiff = (a, b) => { const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) if (a[i] !== b[i]) return i; return a.length === b.length ? -1 : n; };
const around = (s, i) => JSON.stringify(s.slice(Math.max(0, i - 40), i + 40));
console.log(`golden A: ${GOLDEN_REF} (${A.length} B); golden B: ${PAGE} (${B.length} B)`);
let fragN = 0;
for (const id of IDS) {
  const fa = fragments(A, id), fb = fragments(B, id);
  if (!fa) { fail(`${id}: card not in golden A`); continue; }
  if (!fb) { fail(`${id}: card not in golden B`); continue; }
  const bad = [];
  for (const [k, va] of Object.entries(fa)) {
    const vb = fb[k];
    if (va == null) { fail(`${id} / ${k}: missing in golden A (extractor)`); continue; }
    fragN++;
    if (vb == null) { fail(`${id} / ${k}: missing in golden B`); bad.push(k); continue; }
    const d = firstDiff(va, vb);
    if (d >= 0) { fail(`${id} / ${k}: first differing offset ${d} of ${va.length} (A) / ${vb.length} (B)\n     A ${around(va, d)}\n     B ${around(vb, d)}`); bad.push(k); }
  }
  console.log(`${bad.length ? 'FAIL' : 'PASS'} bytes ${id}: ${Object.keys(fa).length} fragments ${bad.length ? 'differ: ' + bad.join(', ') : '=== golden A'}`);
}
// The card count and the plate block count must match too (nothing extra drawn as a plate).
const count = (h, s) => h.split(s).length - 1;
for (const s of ['<figure class="plate"', '<div class="tempo"', '<div class="tells"', 'class="plate-callout']) {
  if (count(A, s) !== count(B, s)) fail(`count of ${s}: golden A ${count(A, s)}, golden B ${count(B, s)}`);
  else console.log(`PASS count ${s}: ${count(A, s)} in both`);
}

/* ---------------------------------------------------------------- 2. pixels -------------------------------------- */
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const tmp = join(root, 'verify', 'fidelity'); mkdirSync(tmp, { recursive: true });
const skeleton = body => `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${body}</body></html>`;
writeFileSync(join(tmp, 'golden-a.html'), skeleton(A));
writeFileSync(join(tmp, 'golden-b.html'), skeleton(B));
const WOFF2 = readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2'));
const FONT_CSS = `@font-face { font-family: 'Inter'; font-style: normal; font-weight: 100 900; font-display: block; src: url(https://fonts.gstatic.com/local/inter.woff2) format('woff2'); }`;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function openPage(file) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', reducedMotion: 'no-preference' });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://fonts.googleapis.com/')) return r.fulfill({ status: 200, contentType: 'text/css', body: FONT_CSS });
    if (u === 'https://fonts.gstatic.com/local/inter.woff2') return r.fulfill({ status: 200, contentType: 'font/woff2', body: WOFF2 });
    if (u.startsWith('file:')) return r.continue();
    return r.abort();
  });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  // Normalisation 2 (harness only, both pages alike): each card is rastered on its own compositing layer. Without it
  // Chromium's anti-aliasing of the plate depends on the card's absolute position in the document (raster tiles are
  // laid from the page origin): golden A itself changes by up to ~1 % of the block's pixels, max 26/255 on curve
  // edges, when a spacer is put above it. Golden B's cards sit lower on the page (its sheets are longer), so without
  // this the comparison would measure page length, not the plate. Proof in the report: fidelity-check --spacer-probe.
  await page.addStyleTag({ content: '.sheet-card { will-change: transform; }' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errs };
}
async function settle(page) {
  await page.evaluate(() => new Promise(res => {
    const t0 = performance.now();
    const tick = () => (!document.getAnimations().some(a => a.playState === 'running') || performance.now() - t0 > 4000) ? res() : requestAnimationFrame(tick);
    tick();
  }));
}
/** PNG of one plate block (plate top to tempo bottom, card width) in the given state. */
async function shot(page, id, theme, mode) {
  await page.evaluate(t => document.getElementById('theme-' + t).click(), theme);
  const mis = await page.$(`#${id}-mistake`);
  const pressed = mis ? await mis.getAttribute('aria-pressed') === 'true' : false;
  if (mis && pressed !== (mode === 'mistake')) await page.evaluate(i => document.getElementById(i + '-mistake').click(), id);
  if (!mis && mode === 'mistake') throw new Error(`${id}: no Mistake pill`);
  await page.evaluate(id => {
    const fit = document.getElementById(id + '-plate');
    window.scrollTo(0, fit.getBoundingClientRect().top + scrollY - 20);
    document.activeElement?.blur?.();
  }, id);
  await page.mouse.move(0, 0);
  await settle(page);
  const box = await page.evaluate(id => {
    const card = document.getElementById('card-' + id), fit = document.getElementById(id + '-plate'), tempo = card.querySelector('.tempo');
    const c = card.getBoundingClientRect(), a = fit.getBoundingClientRect(), b = tempo.getBoundingClientRect();
    // the golden block's own column (plan 2.7 L3: the .ht-golden box): the plate box's left and width (358 px at
    // 390), plate top to tempo bottom. The card's frame is left out: its bottom corners sit lower in golden B because
    // the new sections make the card longer, which is the card, not the plate block.
    const blk = { x: a.left, y: a.top, width: a.width, height: b.bottom - a.top };
    // everything in the block must lie inside that column
    for (const e of [card.querySelector('.cue-line'), card.querySelector('.plate-controls'), tempo]) {
      const r = e.getBoundingClientRect();
      if (r.left < blk.x - 0.01 || r.right > blk.x + blk.width + 0.01) throw new Error(id + ': block element outside the plate column: ' + e.className);
    }
    void c;
    return blk;
  }, id);
  const png = await page.screenshot({ clip: box, animations: 'disabled', caret: 'hide' });
  return { png, box };
}
/** Count differing pixels between two PNGs (decoded in the browser, exact RGBA compare). */
async function diffCount(page, a, b) {
  if (a.equals(b)) return 0;
  return page.evaluate(async ([a64, b64]) => {
    const load = src => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = 'data:image/png;base64,' + src; });
    const [ia, ib] = await Promise.all([load(a64), load(b64)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return -1;
    const px = img => { const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d'); g.drawImage(img, 0, 0); return g.getImageData(0, 0, c.width, c.height).data; };
    const da = px(ia), db = px(ib);
    let n = 0;
    for (let i = 0; i < da.length; i += 4) if (da[i] !== db[i] || da[i + 1] !== db[i + 1] || da[i + 2] !== db[i + 2] || da[i + 3] !== db[i + 3]) n++;
    return n;
  }, [a.toString('base64'), b.toString('base64')]);
}

const pa = await openPage(join(tmp, 'golden-a.html')), pb = await openPage(join(tmp, 'golden-b.html'));
// self-check: golden A against a second render of itself must give 0 px, or the harness itself is not deterministic
{
  const pa2 = await openPage(join(tmp, 'golden-a.html'));
  const x = await shot(pa.page, IDS[0], 'paper', 'normal'), y = await shot(pa2.page, IDS[0], 'paper', 'normal');
  const n = await diffCount(pa.page, x.png, y.png);
  if (n !== 0) fail(`self-check: golden A rendered twice differs by ${n} px`); else console.log('PASS pixels self-check: golden A rendered twice, 0 px');
  await pa2.ctx.close();
  writeFileSync(join(tmp, 'golden-a-moved.html'), skeleton(A.replace('<main id="sheets"', '<div style="height:2698px"></div><main id="sheets"')));
  const pa3 = await openPage(join(tmp, 'golden-a-moved.html'));
  const z = await shot(pa3.page, IDS[1], 'paper', 'normal'), x2 = await shot(pa.page, IDS[1], 'paper', 'normal');
  const n2 = await diffCount(pa.page, x2.png, z.png);
  if (n2 !== 0) fail(`position probe: golden A moved 2698 px down differs by ${n2} px`); else console.log('PASS pixels position probe: golden A moved 2,698 px down the page, 0 px');
  await pa3.ctx.close();
}
let shots = 0;
for (const id of IDS) {
  const res = [];
  for (const theme of THEMES) for (const mode of ['normal', 'mistake']) {
    const x = await shot(pa.page, id, theme, mode), y = await shot(pb.page, id, theme, mode);
    shots++;
    const sizeOk = x.box.width === y.box.width && Math.abs(x.box.height - y.box.height) < 0.01;
    const n = sizeOk ? await diffCount(pa.page, x.png, y.png) : -1;
    if (n !== 0) {
      writeFileSync(join(tmp, `${id}-${theme}-${mode}-A.png`), x.png); writeFileSync(join(tmp, `${id}-${theme}-${mode}-B.png`), y.png);
      fail(`${id} ${theme} ${mode}: ${n < 0 ? `region size differs (A ${JSON.stringify(x.box)}, B ${JSON.stringify(y.box)})` : n + ' differing px'} (saved in verify/fidelity/)`);
      res.push(`${theme}/${mode}:${n}`);
    }
  }
  console.log(`${res.length ? 'FAIL' : 'PASS'} pixels ${id}: 5 themes x {normal, mistake} ${res.length ? res.join(' ') : '0 px'}`);
  // leave both pages in normal mode for the next card
  for (const p of [pa.page, pb.page]) await p.evaluate(i => { const b = document.getElementById(i + '-mistake'); if (b && b.getAttribute('aria-pressed') === 'true') b.click(); }, id);
}
for (const [name, p] of [['golden A', pa], ['golden B', pb]]) if (p.errs.length) fail(`${name} page errors: ${p.errs.join(' | ')}`);
await browser.close();
console.log(`\n${failures ? 'FAILED' : 'PASSED'}: ${fragN} byte fragments (8 exercises), ${shots} pixel regions (8 x 5 themes x 2 states); ${failures} failure(s).`);
process.exit(failures ? 1 : 0);

// Golden-B state driver: opens every How-to layer state of technical-plates.html for all 8 exercises in all 5 app
// themes, checks each renders (present, visible, non-empty, inside the 390 px sheet, no page errors), and writes
// review screenshots (verify/states/<exercise>-<state>-<theme>.png) in Silent Black and Paper.
// Run: node artifact/shoot2.mjs [--all-shots]   (--all-shots: screenshots in all 5 themes, not just 2)
// States (plan S-2 condition 5): hand zoom, each posture zoom, handling mistakes, feel map at rest, playing, each row
// open, reduced motion, setup (all steps), risks and the disclaimer, plus the Mistake view's wrist line (push).
// LR-23 (owner 2026-09-30): no link, source list, evidence label or contact on any card, and the disclaimer is the last
// layer node, after the last red-flag box.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { CONTACT_RE, SOURCE_RE, SOURCE_CS_RE } from './copy-lint.mjs';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const outDir = join(root, 'verify', 'states'); mkdirSync(outDir, { recursive: true });
const wrap = join(outDir, 'page.html');
writeFileSync(wrap, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${readFileSync(join(here, 'technical-plates.html'), 'utf8')}</body></html>`);
const WOFF2 = readFileSync(join(root, 'engine', 'inter-latin-wght-normal.woff2'));
const IDS = ['lateral-raise', 'barbell-back-squat', 'pull-up', 'hanging-leg-raise', 'lat-pulldown', 'seated-cable-row', 'leg-press', 'machine-chest-press'];
const THEMES = ['silent-black', 'paper', 'midnight', 'ember', 'emerald'];
const SHOT_THEMES = process.argv.includes('--all-shots') ? THEMES : ['silent-black', 'paper'];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const problems = [], counts = {};
const bad = msg => problems.push(msg);
const count = k => { counts[k] = (counts[k] ?? 0) + 1; };
// joint red flags each sheet must show (golden-B review 2026-09-30: every shoulder-pinch, knee and elbow pain row links
// to its shared NHS block, not only the seated cable row's)
const FLAGS = { 'lateral-raise': ['wrist', 'shoulder'], 'barbell-back-squat': ['wrist', 'knee'], 'pull-up': ['wrist', 'shoulder', 'elbow'], 'hanging-leg-raise': ['wrist'],
  'lat-pulldown': ['wrist', 'shoulder'], 'seated-cable-row': ['wrist', 'shoulder'], 'leg-press': ['wrist', 'knee'], 'machine-chest-press': ['wrist', 'elbow'] };

async function open({ reduce = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://fonts.googleapis.com/')) return r.fulfill({ status: 200, contentType: 'text/css', body: "@font-face{font-family:'Inter';font-weight:100 900;font-display:block;src:url(https://fonts.gstatic.com/local/inter.woff2) format('woff2')}" });
    if (u === 'https://fonts.gstatic.com/local/inter.woff2') return r.fulfill({ status: 200, contentType: 'font/woff2', body: WOFF2 });
    return u.startsWith('file:') ? r.continue() : r.abort();
  });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(pathToFileURL(wrap).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  return { ctx, page, errs };
}
/** Visible, non-empty, inside the 390 px viewport width. */
const check = (page, sel, what) => page.evaluate(([sel, what]) => {
  const e = document.querySelector(sel);
  if (!e) return `${what}: missing (${sel})`;
  const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
  if (!r.width || !r.height || cs.display === 'none' || cs.visibility === 'hidden') return `${what}: not visible`;
  if (r.left < -0.5 || r.right > innerWidth + 0.5) return `${what}: outside the sheet (${r.left.toFixed(1)}..${r.right.toFixed(1)})`;
  const svgs = [...e.querySelectorAll('svg')].filter(s => s.getBoundingClientRect().width > 20);
  if (e.matches('.zx') && !svgs.length) return `${what}: no drawing`;
  return null;
}, [sel, what]);
const shot = async (page, sel, file) => {
  const el = page.locator(sel).first();
  await el.scrollIntoViewIfNeeded();
  await page.waitForTimeout(60);
  await el.screenshot({ path: join(outDir, file), animations: 'allow' });
};
const click = (page, sel) => page.evaluate(s => document.querySelector(s).click(), sel);
const settle = page => page.evaluate(() => new Promise(r => { const t0 = performance.now(); const f = () => (!document.getAnimations().some(a => a.playState === 'running' && !a.animationName?.startsWith?.('feel')) || performance.now() - t0 > 2000) ? r() : requestAnimationFrame(f); f(); }));

for (const theme of THEMES) {
  const { ctx, page, errs } = await open();
  await click(page, `#theme-${theme}`);
  const shots = SHOT_THEMES.includes(theme);
  for (const id of IDS) {
    const card = `#card-${id}`;
    // --- structure: every section once, one red-flag block per flag, one disclaimer
    const s = await page.evaluate(card => {
      const c = document.querySelector(card), n = q => c.querySelectorAll(q).length;
      return { chips: n('.zx-chip'), zooms: n('.zx'), grip: n('.grip'), mistakes: n('.hm'), feel: n('.feel'), rows: n('.fr'), setup: n('.setup'), steps: n('.st-list li'),
        risks: n('.risks'), riskItems: n('.rk-list li'), redflags: n('.redflag'), links: n('a[href]'), srcUi: n('.srcs,.src-cite,.src-ev,.src-key,.ev'), disclaimer: n('.ht-disclaimer'),
        disclaimerText: c.querySelector('.ht-disclaimer')?.textContent, also: n('.ht-also'), rfLinks: n('.rf-link'),
        blocks: [...c.querySelectorAll('.redflag')].map(e => e.id.replace(/^.*-redflag-/, '')).join(),
        linked: [...new Set([...c.querySelectorAll('.rf-link')].map(e => e.dataset.flag))].sort().join(),
        order: [...c.children].map(e => e.classList[0]).filter(Boolean).join(' > '),
        // LR-23: the disclaimer is the card's last node and comes after the last red-flag box
        discLast: c.lastElementChild?.matches('.ht-disclaimer') && [...c.querySelectorAll('.redflag')].every(r => r.compareDocumentPosition(c.querySelector('.ht-disclaimer')) & Node.DOCUMENT_POSITION_FOLLOWING),
        // every text node (hidden ones too, not style or script) and every aria-label, title and alt
        text: (() => { const w = document.createTreeWalker(c, NodeFilter.SHOW_TEXT), out = []; for (let t; (t = w.nextNode());) if (!t.parentElement.closest('style,script')) out.push(t.data);
          c.querySelectorAll('[aria-label],[title],[alt]').forEach(e => ['aria-label', 'title', 'alt'].forEach(k => e.hasAttribute(k) && out.push(e.getAttribute(k)))); return out.join(' \u2029 ').replace(/\s+/g, ' '); })(),
        labelWords: [...c.querySelectorAll('*')].filter(e => ['Measured', 'Mechanics', 'Coaching consensus', 'Weak for this use'].includes([...e.childNodes].filter(t => t.nodeType === 3).map(t => t.data).join('').trim())).length };
    }, card);
    if (theme === 'silent-black') counts[`structure ${id}`] = s;
    for (const k of ['grip', 'feel', 'setup', 'risks', 'disclaimer']) if (s[k] !== 1) bad(`${id}: ${k} x${s[k]}`);
    if (s.mistakes !== 3) bad(`${id}: ${s.mistakes} handling mistakes`);   // golden B compact copy (owner 2026-09-30): 3 per exercise, was 4
    if (!s.redflags || !s.riskItems) bad(`${id}: risks without items or red flag`);
    if (s.blocks !== FLAGS[id].join()) bad(`${id}: red-flag blocks ${s.blocks}, expected ${FLAGS[id]}`);
    if (s.linked !== [...FLAGS[id]].sort().join()) bad(`${id}: rows link to ${s.linked}, expected ${FLAGS[id]}`);
    if (s.disclaimerText !== 'General guidance, not medical advice. If something hurts, stop and get it checked.') bad(`${id}: disclaimer text "${s.disclaimerText}"`);
    if (s.links || s.srcUi) bad(`${id}: ${s.links} links and ${s.srcUi} source or evidence elements (LR-23: none)`);
    if (!s.discLast) bad(`${id}: the disclaimer is not the last node after the last red-flag box`);
    for (const re of [CONTACT_RE, SOURCE_RE, SOURCE_CS_RE]) if (re.test(s.text)) bad(`${id}: contact or source wording "${s.text.match(re)[0]}" (LR-23)`);
    if (s.labelWords) bad(`${id}: ${s.labelWords} evidence label words shown`);
    delete s.text;
    // --- closed-state sections
    for (const [sel, what] of [['.zx-chips-wrap', 'chips'], ['.grip', 'grip + handling mistakes'], ['.feel', 'feel (rest)'], ['.setup', 'setup'], ['.risks', 'risks'], ['.ht-disclaimer', 'disclaimer']]) {
      const p = await check(page, `${card} ${sel}`, `${id} ${theme} ${what}`); if (p) bad(p); else count(what);
    }
    if (shots) {
      await shot(page, `${card} .grip`, `${id}-grip-mistakes-${theme}.png`);
      await shot(page, `${card} .risks`, `${id}-risks-${theme}.png`);
    }
    // --- zooms: each chip opens its close-up in the plate box, the plate is hidden, close restores it
    const zooms = await page.evaluate(card => [...document.querySelectorAll(`${card} .zx-chip[data-zoom]`)].map(b => b.dataset.zoom), card);
    for (const z of zooms) {
      await click(page, `${card} .zx-chip[data-zoom="${z}"]`);
      await settle(page);
      const p = await check(page, `#${id}-zoom-${z}`, `${id} ${theme} zoom ${z}`); if (p) bad(p); else count(z === 'hand' ? 'hand zoom' : 'posture zoom');
      const plateHidden = await page.evaluate(id => document.getElementById(id + '-plate').hidden, id);
      if (!plateHidden) bad(`${id} ${theme} zoom ${z}: plate not hidden`);
      if (shots) await shot(page, `#${id}-zoom-${z}`, `${id}-zoom-${z}-${theme}.png`);
      // a second page (thumb options) where there is one
      const pages = await page.evaluate(sel => document.querySelectorAll(sel + ' .zx-page').length, `#${id}-zoom-${z}`);
      if (pages > 1 && shots) {
        await click(page, `#${id}-zoom-${z} .pager-btn[data-page="1"]`); await page.waitForTimeout(80);
        await shot(page, `#${id}-zoom-${z}`, `${id}-zoom-${z}-p2-${theme}.png`);
      }
      await click(page, `#${id}-zoom-${z}-close`);
      await settle(page);
      const back = await page.evaluate(id => !document.getElementById(id + '-plate').hidden, id);
      if (!back) bad(`${id} ${theme} zoom ${z}: plate not back after close`);
    }
    // --- Mistake view: the approved mistake stays on the plate; push exercises get the wrist line under the tempo
    await click(page, `#${id}-mistake`);
    const m = await page.evaluate(id => ({ fig: !document.querySelector(`#card-${id} .plate[data-mode="mistake"]`).hidden, also: document.getElementById(id + '-also') }), id);
    if (!m.fig) bad(`${id} ${theme}: Mistake does not show the approved mistake plate`);
    if (s.also) {
      const p = await check(page, `#${id}-also`, `${id} ${theme} wrist line`); if (p) bad(p); else count('mistake wrist line');
      if (shots) {
        await page.evaluate(id => { const c = document.getElementById('card-' + id); scrollTo(0, c.querySelector('.plate-fit').getBoundingClientRect().top + scrollY - 10); }, id);
        await page.waitForTimeout(100);
        const clip = await page.evaluate(id => { const c = document.getElementById('card-' + id).getBoundingClientRect(), a = document.getElementById(id + '-also').getBoundingClientRect(), f = document.getElementById(id + '-plate').getBoundingClientRect(); return { x: c.left, y: f.top - 8, width: c.width, height: a.bottom - f.top + 16 }; }, id);
        await page.screenshot({ path: join(outDir, `${id}-mistake-wristline-${theme}.png`), clip });
      }
      await click(page, `#${id}-also-hand`);
      await settle(page);
      const opened = await page.evaluate(id => { const z = document.querySelector(`#card-${id} .zx[data-zoom="hand"]`); return z && !z.hidden; }, id);
      if (!opened) bad(`${id} ${theme}: wrist line does not open the hand close-up`); else count('wrist line opens hand');
      await click(page, `#${id}-zoom-hand-close`); await settle(page);
      const restored = await page.evaluate(id => !document.querySelector(`#card-${id} .plate[data-mode="mistake"]`).hidden, id);
      if (!restored) bad(`${id} ${theme}: closing the hand close-up does not return to the Mistake view`);
      // Mistake, the wrist line, then the (now unpressed) Mistake pill: the close-up closes and the Mistake view shows
      await click(page, `#${id}-also-hand`); await settle(page);
      await click(page, `#${id}-mistake`); await settle(page);
      const mm = await page.evaluate(id => ({ pressed: document.getElementById(id + '-mistake').getAttribute('aria-pressed'), fig: !document.querySelector(`#card-${id} .plate[data-mode="mistake"]`).hidden,
        zoom: [...document.querySelectorAll(`#card-${id} .zx`)].some(z => !z.hidden) }), id);
      if (mm.pressed !== 'true' || !mm.fig || mm.zoom) bad(`${id} ${theme}: Mistake after the wrist line ${JSON.stringify(mm)}`); else count('mistake pill after wrist line');
    }
    await click(page, `#${id}-mistake`);
    // --- feel: at rest, playing (a frame mid-sweep), each row open
    if (shots) await shot(page, `${card} .feel`, `${id}-feel-rest-${theme}.png`);
    await page.evaluate(card => { const m = document.querySelector(`${card} [data-feel-map]`); m.scrollIntoView({ block: 'center' }); }, card);
    await page.waitForTimeout(700);
    await click(page, `${card} [data-feel-map]`);
    await page.waitForTimeout(1400);
    const playing = await page.evaluate(card => { const m = document.querySelector(`${card} [data-feel-map]`); const b = m.querySelector('.feel-band'); return { cls: m.classList.contains('is-playing'), anim: b ? b.getAnimations().length : -1 }; }, card);
    if (!playing.cls || playing.anim < 1) bad(`${id} ${theme}: shimmer not playing (${JSON.stringify(playing)})`); else count('feel playing');
    if (shots) await page.locator(`${card} [data-feel-map]`).screenshot({ path: join(outDir, `${id}-feel-playing-${theme}.png`), animations: 'allow' });
    // pause out of view: scroll far away, the running band is paused; back in view it resumes
    await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(150);
    const paused = await page.evaluate(card => [...document.querySelectorAll(`${card} [data-feel-map] .feel-band`)].map(b => b.style.animationPlayState), card);
    await page.evaluate(card => document.querySelector(`${card} [data-feel-map]`).scrollIntoView({ block: 'center' }), card); await page.waitForTimeout(150);
    const resumed = await page.evaluate(card => [...document.querySelectorAll(`${card} [data-feel-map] .feel-band`)].map(b => b.style.animationPlayState), card);
    if (!paused.length || paused.some(v => v !== 'paused') || resumed.some(v => v !== '')) bad(`${id} ${theme}: shimmer pause out of view ${JSON.stringify({ paused, resumed })}`); else count('feel pauses out of view');
    const more = await page.$(`${card} .fr-more`);
    if (more) await click(page, `${card} .fr-more`);
    const rows = await page.evaluate(card => [...document.querySelectorAll(`${card} .fr`)].map(r => r.dataset.row), card);
    for (const r of rows) {
      await click(page, `#${id}-row-${r}`);
      await page.waitForTimeout(40);
      const st = await page.evaluate(([id, r]) => { const b = document.getElementById(`${id}-row-${r}`); const body = document.getElementById(`${id}-row-${r}-body`); const map = document.querySelector(`#card-${id} [data-feel-map]`);
        return { exp: b.getAttribute('aria-expanded'), body: !body.hidden && body.getBoundingClientRect().height > 0, marked: b.hasAttribute('data-watch') || b.hasAttribute('data-pain'), focus: map.classList.contains('is-focus'), label: map.getAttribute('aria-label') === b.dataset.label }; }, [id, r]);
      if (st.exp !== 'true' || !st.body || st.focus !== st.marked || !st.label) bad(`${id} ${theme} row ${r}: ${JSON.stringify(st)}`); else count('feel row open');
      if (shots && r === rows[0]) await shot(page, `${card} .feel`, `${id}-feel-row-${r}-${theme}.png`);
    }
    // --- setup: all steps
    const stMore = await page.$(`${card} .st-more`);
    if (stMore) { await click(page, `${card} .st-more`); const hidden = await page.evaluate(card => document.querySelectorAll(`${card} .st-list li[hidden]`).length, card); if (hidden) bad(`${id} ${theme}: setup steps still hidden`); else count('setup all steps'); }
    if (shots) await shot(page, `${card} .setup`, `${id}-setup-all-${theme}.png`);
  }
  // page-level audit once per theme
  const a = await page.evaluate(() => {
    const vis = e => !!e.getClientRects().length && getComputedStyle(e).visibility !== 'hidden';
    const ids = new Set(), dup = [];
    document.querySelectorAll('[id]').forEach(e => { if (ids.has(e.id)) dup.push(e.id); ids.add(e.id); });
    const broken = [...document.querySelectorAll('[aria-labelledby],[aria-controls]')].flatMap(e => ['aria-labelledby', 'aria-controls'].flatMap(k => (e.getAttribute(k) || '').split(/\s+/).filter(Boolean).filter(i => !document.getElementById(i))));
    const small = [...document.querySelectorAll('#sheets button, #sheets summary')].filter(vis).filter(b => !b.classList.contains('plate-callout')).filter(b => { const r = b.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(b => b.id || b.className);
    const tabs = document.querySelectorAll('[role="tab"],[role="tablist"],[aria-selected]').length;
    const pagers = [...document.querySelectorAll('.pager-btn')].filter(b => !b.hasAttribute('aria-pressed')).length;
    const jump = document.querySelector('.pg-jump')?.getAttribute('href') ?? '';
    return { scrollW: document.documentElement.scrollWidth, dup: dup.slice(0, 5), broken: [...new Set(broken)].slice(0, 5), small: small.slice(0, 8), tabs, pagers, jump, jumpOk: !!document.querySelector(jump + '.zx-chip[data-zoom="hand"]') };
  });
  if (a.scrollW > 390) bad(`${theme}: page scrolls sideways (${a.scrollW})`);
  if (a.dup.length) bad(`${theme}: duplicate ids ${a.dup}`);
  if (a.broken.length) bad(`${theme}: broken aria refs ${a.broken}`);
  if (a.small.length) bad(`${theme}: targets under 44 px ${a.small}`);
  if (a.tabs || a.pagers) bad(`${theme}: close-up pagers use tab roles (${a.tabs}) or lack aria-pressed (${a.pagers})`);
  if (!a.jumpOk) bad(`${theme}: header link ${a.jump} does not point at the chest press Hand chip`);
  if (errs.length) bad(`${theme}: page errors ${errs.slice(0, 3).join(' | ')}`);
  await ctx.close();
}
// --- reduced motion: no band drawn, zooms open without scaling, the feel map is the resting state
{
  const { ctx, page, errs } = await open({ reduce: true });
  for (const theme of THEMES) {
    await click(page, `#theme-${theme}`);
    for (const id of IDS) {
      const card = `#card-${id}`;
      await click(page, `${card} [data-feel-map]`);
      const r = await page.evaluate(card => { const m = document.querySelector(`${card} [data-feel-map]`); return { playing: m.classList.contains('is-playing'), bands: [...m.querySelectorAll('.feel-band')].filter(b => getComputedStyle(b).display !== 'none').length }; }, card);
      if (r.playing || r.bands) bad(`${id} ${theme} reduced motion: shimmer ${JSON.stringify(r)}`); else count('feel reduced motion');
      await click(page, `${card} .zx-chip[data-zoom]`);
      const anims = await page.evaluate(() => document.getAnimations().filter(a => a.playState === 'running').length);
      if (anims) bad(`${id} ${theme} reduced motion: ${anims} animations on zoom open`);
      await click(page, `${card} .zx.zx:not([hidden]) .zx-close`);
      if (theme === 'paper' && id === 'machine-chest-press') await shot(page, `${card} .feel`, `${id}-feel-reduced-${theme}.png`);
    }
  }
  if (errs.length) bad(`reduced motion: page errors ${errs.slice(0, 3).join(' | ')}`);
  await ctx.close();
}
await browser.close();
const report = { problems, counts };
writeFileSync(join(outDir, 'report.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ problems, counts: Object.fromEntries(Object.entries(counts).filter(([k]) => !k.startsWith('structure'))) }, null, 1));
console.log('structure (silent-black):', JSON.stringify(Object.fromEntries(Object.entries(counts).filter(([k]) => k.startsWith('structure')).map(([k, v]) => [k.slice(10), v.order]))).slice(0, 600));
process.exit(problems.length ? 1 : 0);

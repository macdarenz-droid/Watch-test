// Fidelity harness (HT-1; HT-3 reuses it): serve a golden page offline with the app's Inter woff2, capture a
// block of it, and compare two captures pixel by pixel in the browser (canvas getImageData; no new dependency).
// Build and gate time only; never bundled.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const FONT = join(ROOT, 'node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2');
export const GOLDEN_PAGE = join(ROOT, 'tests/howto/golden/technical-plates.html');

/** The phone the plates were approved on: 390 x 844 CSS px at DPR 2 (plan 2.7, L3). */
export const DEVICE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 };

/** L3 pass rule (plan 2.7): no channel off by more than 1/255, at most 0.02 % of pixels off by exactly 1.
 * Changing it is a supervisor decision, never a builder fix. */
export const RULE = { maxChannelDelta: 1, maxOffByOneFraction: 0.0002 };

export const ORIGIN = 'http://golden.invalid';
const FONT_URL = `${ORIGIN}/__fidelity/inter-latin-wght-normal.woff2`;

/** The one declared normalisation: 'Inter Variable' from the app's woff2, declared as engine/sheet.mjs declares it. */
export const fontFaceCss = url => `@font-face { font-family: 'Inter Variable'; src: url('${url}') format('woff2-variations'); font-weight: 100 900; font-display: block; }`;

/**
 * Routes every request of a browser context: `pages` ({ '/path': bytes }) are served from ORIGIN, the Google Fonts
 * stylesheet request is answered with fontFaceCss (so the golden HTML bytes stay unchanged), the woff2 is served from
 * disk, and anything else is aborted and listed in the returned `blocked` array (the page must not need the network).
 */
export async function routeOffline(ctx, pages, font = FONT) {
  const blocked = [];
  const woff2 = readFileSync(font);
  await ctx.route('**/*', route => {
    const url = route.request().url();
    if (url === FONT_URL) return route.fulfill({ status: 200, contentType: 'font/woff2', body: woff2 });
    if (url.startsWith('https://fonts.googleapis.com/css')) return route.fulfill({ status: 200, contentType: 'text/css', body: fontFaceCss(FONT_URL) });
    if (url.startsWith(`${ORIGIN}/`)) {
      const body = pages[new URL(url).pathname];
      if (body !== undefined) return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body });
    }
    blocked.push(url);
    return route.abort();
  });
  return { blocked };
}

/** Fonts loaded, no animation or transition left, two frames painted. */
export async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().length === 0, null, { timeout: 5000 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** True only when 'Inter Variable' really loaded from the woff2 (a probe must fail when the font is missing). */
export const interLoaded = page => page.evaluate(() => [...document.fonts].some(f => f.family.replace(/["']/g, '') === 'Inter Variable' && f.status === 'loaded'));

/**
 * Scrolls `topSel` to the top of the viewport and returns the viewport clip from its top to the bottom of
 * `bottomSel`, across its own left edge and width. Throws when the block does not fit the viewport.
 */
export async function blockClip(page, topSel, bottomSel) {
  const c = await page.evaluate(([t, b]) => {
    const top = document.querySelector(t), bottom = document.querySelector(b);
    if (!top || !bottom) return null;
    window.scrollTo(0, top.getBoundingClientRect().top + window.scrollY);
    const r = top.getBoundingClientRect(), rb = bottom.getBoundingClientRect();
    return { x: r.left, y: r.top, width: r.width, height: rb.bottom - r.top, vh: window.innerHeight };
  }, [topSel, bottomSel]);
  if (!c) throw new Error(`blockClip: ${topSel} or ${bottomSel} not found`);
  if (c.y < 0 || c.y + c.height > c.vh) throw new Error(`blockClip: ${topSel}..${bottomSel} (${c.height} px from y ${c.y}) does not fit the ${c.vh} px viewport`);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  return { x: c.x, y: c.y, width: c.width, height: c.height };
}

/** PNG of a viewport clip. `shiftY` moves the clip (used only by the negative control). */
export const capture = (page, clip, shiftY = 0) => page.screenshot({ clip: { ...clip, y: clip.y + shiftY }, animations: 'disabled', caret: 'hide' });

/**
 * Decodes two PNGs in `page` (no colour conversion) and compares them channel by channel.
 * Returns { sameSize, width, height, total, off, off1, maxDelta, ink } where off counts pixels with any channel
 * different, off1 those whose largest channel difference is exactly 1, and ink the share of pixels in `a` that
 * differ from its top-left pixel (a blank capture has ink 0).
 */
export async function diffPng(page, a, b) {
  return page.evaluate(async ([a64, b64]) => {
    const decode = async s => {
      const blob = await (await fetch(`data:image/png;base64,${s}`)).blob();
      const bmp = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      const cv = new OffscreenCanvas(bmp.width, bmp.height), cx = cv.getContext('2d', { colorSpace: 'srgb' });
      cx.drawImage(bmp, 0, 0);
      return { w: bmp.width, h: bmp.height, d: cx.getImageData(0, 0, bmp.width, bmp.height).data };
    };
    const [A, B] = await Promise.all([decode(a64), decode(b64)]);
    let ink = 0;
    for (let i = 0; i < A.d.length; i += 4) if (A.d[i] !== A.d[0] || A.d[i + 1] !== A.d[1] || A.d[i + 2] !== A.d[2] || A.d[i + 3] !== A.d[3]) ink++;
    const total = A.w * A.h;
    if (A.w !== B.w || A.h !== B.h) return { sameSize: false, width: A.w, height: A.h, otherWidth: B.w, otherHeight: B.h, total, off: total, off1: 0, maxDelta: 255, ink: ink / total };
    let off = 0, off1 = 0, maxDelta = 0;
    for (let i = 0; i < A.d.length; i += 4) {
      const m = Math.max(Math.abs(A.d[i] - B.d[i]), Math.abs(A.d[i + 1] - B.d[i + 1]), Math.abs(A.d[i + 2] - B.d[i + 2]), Math.abs(A.d[i + 3] - B.d[i + 3]));
      if (m) { off++; if (m === 1) off1++; if (m > maxDelta) maxDelta = m; }
    }
    return { sameSize: true, width: A.w, height: A.h, total, off, off1, maxDelta, ink: ink / total };
  }, [a.toString('base64'), b.toString('base64')]);
}

/** The L3 pass rule. */
export const meetsRule = (d, rule = RULE) => d.sameSize && d.maxDelta <= rule.maxChannelDelta && d.off1 <= rule.maxOffByOneFraction * d.total;
/** The self-check rule: the golden against itself must be 0 px. */
export const identical = d => d.sameSize && d.off === 0;

/**
 * HT1-A5 self-check: the golden page, loaded twice in fresh contexts, captured per plate block (plate top to tempo
 * bottom) in every theme x {normal, mistake with the first tell}, must diff 0 px capture for capture. A built-in
 * negative control (the same block shifted 1 px) must fail the L3 rule, so a blind comparison cannot pass.
 * Returns { problems, captures, comparisons, control, ms }.
 */
export async function goldenSelfCheck(browser, { html = readFileSync(GOLDEN_PAGE), shiftSecondRun = 0 } = {}) {
  const t0 = Date.now(), problems = [];
  let control = null;
  // every (load, theme) pair is its own fresh context, run side by side; they share nothing but the browser
  const jobs = [0, 1].flatMap(run => [0, 1, 2, 3, 4].map(ti => ({ run, ti })));
  const loads = await Promise.all(jobs.map(async ({ run, ti }) => {
    const ctx = await browser.newContext({ ...DEVICE });
    const net = await routeOffline(ctx, { '/': html });
    const page = await ctx.newPage();
    page.on('pageerror', e => problems.push(`run ${run}: page error ${e.message}`));
    await page.goto(`${ORIGIN}/`);
    await settle(page);
    if (!(await interLoaded(page))) problems.push(`run ${run}: 'Inter Variable' did not load from the app woff2`);
    const themes = await page.$$eval('.seg', bs => bs.map(b => b.dataset.themeId));
    const cards = await page.$$eval('.sheet-card', cs => cs.map(c => c.dataset.ex));
    if (themes.length !== 5) problems.push(`run ${run}: ${themes.length} themes, expected 5`);
    if (cards.length !== 8) problems.push(`run ${run}: ${cards.length} plate cards, expected 8`);
    const shots = new Map();
    for (const theme of themes.slice(ti, ti + 1)) {
      await page.evaluate(t => document.getElementById(`theme-${t}`).click(), theme);
      await settle(page);
      for (const id of cards) {
        for (const mode of ['normal', 'mistake']) {
          if (mode === 'mistake') { await page.evaluate(i => document.getElementById(`${i}-mistake`).click(), id); await settle(page); }
          const geo = await page.evaluate(i => {
            const fit = document.getElementById(`${i}-plate`), fig = fit.querySelector(`.plate[data-mode="${fit.closest('.sheet-card').querySelector('.tells').hidden ? 'normal' : 'mistake'}"]`);
            return { fit: fit.getBoundingClientRect().width, zoom: getComputedStyle(fig).zoom, mode: fig.dataset.mode, pressed: fit.querySelector(`.plate[data-mode="${fig.dataset.mode}"] .plate-callout[aria-pressed="true"]`)?.dataset.key, first: fit.closest('.sheet-card').dataset[fig.dataset.mode === 'normal' ? 'selN' : 'selM'] };
          }, id);
          if (geo.fit !== 358 || geo.zoom !== '1') problems.push(`run ${run} ${theme} ${id}: .plate-fit is ${geo.fit} px at zoom ${geo.zoom}, expected 358 at 1`);
          if (geo.mode !== mode || geo.pressed !== geo.first) problems.push(`run ${run} ${theme} ${id}: showing ${geo.mode} with ${geo.pressed} selected, expected ${mode} with ${geo.first}`);
          const clip = await blockClip(page, `#${id}-plate`, `#card-${id} .tempo`);
          const key = `${theme}/${id}/${mode}`;
          shots.set(key, await capture(page, clip, run === 1 ? shiftSecondRun : 0));
          if (run === 0 && ti === 0 && !control) control = { key, png: await capture(page, clip, 1) };
          if (mode === 'mistake') { await page.evaluate(i => document.getElementById(`${i}-mistake`).click(), id); await settle(page); }
        }
      }
    }
    if (net.blocked.length) problems.push(`run ${run}: the page asked the network for ${net.blocked.join(', ')}`);
    return { run, shots, page };
  }));
  const runs = [0, 1].map(r => new Map(loads.filter(l => l.run === r).flatMap(l => [...l.shots])));
  const diffPage = loads[0].page;
  for (const l of loads.slice(1)) await l.page.context().close();
  let comparisons = 0;
  for (const [key, a] of runs[0]) {
    const b = runs[1].get(key);
    if (!b) { problems.push(`${key}: no second capture`); continue; }
    const d = await diffPng(diffPage, a, b);
    comparisons++;
    if (d.ink < 0.05) problems.push(`${key}: the capture is nearly blank (ink ${(d.ink * 100).toFixed(1)} %)`);
    if (!identical(d)) problems.push(`${key}: golden vs golden differs: ${JSON.stringify(d)}`);
  }
  const c = await diffPng(diffPage, runs[0].get(control.key), control.png);
  control = { key: control.key, off: c.off, maxDelta: c.maxDelta, fails: !meetsRule(c) };
  if (!control.fails) problems.push(`negative control: ${control.key} shifted 1 px still meets the L3 rule (${JSON.stringify(c)}), so the comparison is blind`);
  if (comparisons !== 80) problems.push(`${comparisons} comparisons, expected 80 (8 plates x 5 themes x 2 states)`);
  await diffPage.context().close();
  return { problems, captures: runs[0].size + runs[1].size, comparisons, control, ms: Date.now() - t0 };
}

// ---------------------------------------------------------------------------------------------------------------
// HT-3: the app side. The gate's own build (vite preview on `port`) with a seeded split, the How-to sheet opened from
// the real Train entry, and the comparisons against the golden page (plan 2.7: L2b, F3, L3, L4).

/** The 8 approved plates in gallery order (GOLDEN chromeId -> library id); HT_ORDER adds the two controls. */
export const HT_PLATES = [
  ['lateral-raise', 'lib_dumbbell_lateral_raise'], ['barbell-back-squat', 'lib_barbell_back_squat'], ['pull-up', 'lib_pull_up'],
  ['hanging-leg-raise', 'lib_hanging_leg_raise'], ['lat-pulldown', 'lib_lat_pulldown'], ['seated-cable-row', 'lib_seated_cable_row'],
  ['leg-press', 'lib_leg_press'], ['machine-chest-press', 'lib_machine_chest_press'],
];
/**
 * The gate's "no How-to" control (D-HT1): the first library id, in src/data/exercises.json order, for which hasHowTo()
 * is false (HOWTO_IDS read from the generated src/howto/ids.ts). Data-driven, so it moves on by itself when more
 * exercises get approved content, and the gate block never needs an edit for it.
 */
export function firstWithoutHowTo() {
  const lib = JSON.parse(readFileSync(join(ROOT, 'src/data/exercises.json'), 'utf8')).map(e => e.id);
  const m = readFileSync(join(ROOT, 'src/howto/ids.ts'), 'utf8').match(/export const HOWTO_IDS = \[([\s\S]*?)\] as const;/);
  if (!m) throw new Error('firstWithoutHowTo: no HOWTO_IDS in src/howto/ids.ts');
  const approved = new Set([...m[1].matchAll(/"([^"]+)"/g)].map(x => x[1]));
  const id = lib.find(i => !approved.has(i));
  if (!id) throw new Error('firstWithoutHowTo: every library exercise has a How-to');
  return id;
}
export const HT_NO_HOWTO = firstWithoutHowTo();
export const HT_CUSTOM = { id: 'custom_ht3_lateral', name: 'Cable Lateral Raise HT3', equipment: 'Cable', primary: ['side_delts'], secondary: [], stabilizers: [], aliases: [], pattern: 'isolation', defaultSets: 2, mode: 'weighted', role: 'accessory', custom: true };
export const HT_ORDER = [...HT_PLATES.map(p => p[1]), HT_NO_HOWTO, HT_CUSTOM.id];

/** Init script (runs in the page): theme plus a split holding the 8 plates, bench press and a custom exercise. */
export function htSeed([theme, ids, custom]) {
  localStorage.setItem('marc.theme', theme);
  const now = new Date().toISOString();
  if (localStorage.getItem('marc.state.v1')) return;
  localStorage.setItem('marc.state.v1', JSON.stringify({
    version: 1, createdAt: now, profile: { name: 'Marc', bodyWeightKg: 78, heightCm: 180, sex: 'male', birthYear: 1990 },
    goal: 'lean', splits: [{ id: 'sp1', name: 'Plates', color: '#6aa9ff', focus: [], createdAt: now, exercises: ids.map(exerciseId => ({ exerciseId, sets: 1 })) }],
    schedule: { sun: null, mon: null, tue: null, wed: null, thu: null, fri: null, sat: null },
    sessions: [], active: null, customExercises: [custom],
    preferences: { weightUnit: 'kg', restDefaultSec: 90, autoRest: false, haptics: true, reminders: { enabled: false, time: '17:30', style: 'silent' }, showSpark: true, watch: { autoConnectOnSession: false }, rest: { mode: 'time', heartTargetPct: 0.6, minSec: 30 } },
    body: [], health: { connected: false }, healthDays: [], weightLog: [], profileHistory: [],
    onboarding: { dismissedAt: [], completedAt: now }, checkIns: [], recoveryModel: { tauScale: {}, observations: {} }, freshMarks: [],
  }));
}

/** No animation of any kind left on the page (the sheet-in, scrim, theme and Trace ones included), two frames painted. */
export async function settleApp(page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => document.getAnimations().length === 0, null, { timeout: 8000 });
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
}

/** A fresh app context at `viewport` in `theme`, on the Train page with the seeded split started. */
export async function openAppTrain(browser, port, theme, { viewport = DEVICE.viewport, reducedMotion = 'no-preference', onError } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: DEVICE.deviceScaleFactor, reducedMotion });
  const page = await ctx.newPage();
  if (onError) page.on('pageerror', e => onError(e.message));
  await page.addInitScript(htSeed, [theme, HT_ORDER, HT_CUSTOM]);
  await page.goto(`http://localhost:${port}/`);
  await page.waitForSelector('.nav');
  await page.waitForFunction(() => !document.getElementById('launch'), null, { timeout: 5000 }).catch(() => {});
  await page.locator('nav.nav button', { hasText: 'Train' }).click();
  await page.getByRole('button', { name: /^Start / }).first().click();
  for (let i = 0; i < 2; i++) {
    await page.waitForTimeout(300);
    const skip = page.getByRole('button', { name: 'Skip', exact: true });
    if (await skip.isVisible().catch(() => false)) { await skip.click(); continue; }
    const start = page.getByRole('button', { name: /^Start / }).first();
    if (await start.isVisible().catch(() => false)) await start.click();
  }
  await page.locator('.card.exercise').first().waitFor({ state: 'visible', timeout: 5000 });
  return { ctx, page };
}

/** Opens exercise card `index` (seed order) if it is closed. */
export async function openCard(page, index) {
  const card = page.locator('.card.exercise').nth(index);
  const head = card.locator('.ex-head');
  if ((await head.getAttribute('aria-expanded')) !== 'true') await head.click();
  await card.locator('.why-toggle').waitFor({ state: 'visible', timeout: 5000 });
  await settleApp(page);
  return card;
}

/** Taps the card's How-to entry and waits for the sheet with its golden block, fully settled. */
export async function openHowTo(page, index) {
  const card = await openCard(page, index);
  await card.locator('button.ht-entry').click();
  await page.locator('dialog.sheet.ht .ht-golden figure[data-mode="normal"]').waitFor({ state: 'visible', timeout: 8000 });
  await settleApp(page);
  return card;
}

/** Closes the How-to sheet with Escape (the dialog's cancel, the same close as Back) and waits until it is gone. */
export async function closeHowTo(page) {
  await page.keyboard.press('Escape');
  await page.locator('dialog.sheet.ht').waitFor({ state: 'detached', timeout: 5000 });
  await settleApp(page);
}

/** A golden page context at `viewport` in `theme` (served offline as in HT-1). */
export async function openGolden(browser, theme, { viewport = DEVICE.viewport, reducedMotion = 'no-preference', html = readFileSync(GOLDEN_PAGE), onError } = {}) {
  const ctx = await browser.newContext({ viewport, deviceScaleFactor: DEVICE.deviceScaleFactor, reducedMotion });
  const net = await routeOffline(ctx, { '/': html });
  const page = await ctx.newPage();
  if (onError) page.on('pageerror', e => onError(e.message));
  await page.goto(`${ORIGIN}/`);
  await settle(page);
  await page.evaluate(t => document.getElementById(`theme-${t}`).click(), theme);
  await settle(page);
  return { ctx, page, net };
}

/** Selectors of the golden block in each page, keyed by the gallery chrome id. */
export const G = {
  golden: id => ({ fit: `#${id}-plate`, block: `#card-${id}`, tempo: `#card-${id} .tempo`, root: `#card-${id}` }),
  app: id => ({ fit: `#${id}-plate`, block: 'dialog.sheet.ht .ht-golden', tempo: 'dialog.sheet.ht .ht-golden .tempo', root: 'dialog.sheet.ht .ht-golden' }),
};

/**
 * The widths L3 asserts first, and the capture region: plate-fit top to tempo bottom, across the union of the block's
 * content box and the plate-fit box (the plate alone bleeds 9 px under 350 px). In the app, the sheet panel is scrolled
 * so the region sits below the sticky header; a region that does not fit is an error, never a cut.
 */
export async function region(page, sel, which) {
  const r = await page.evaluate(([s, which]) => {
    const fit = document.querySelector(s.fit), tempo = document.querySelector(s.tempo), block = document.querySelector(s.block);
    if (!fit || !tempo || !block) return null;
    const content = el => { const b = el.getBoundingClientRect(), cs = getComputedStyle(el); const l = parseFloat(cs.borderLeftWidth) + parseFloat(cs.paddingLeft), rr = parseFloat(cs.borderRightWidth) + parseFloat(cs.paddingRight); return { left: b.left + l, width: b.width - l - rr }; };
    let floor = 0;
    if (which === 'app') {
      const panel = fit.closest('.sheet-panel'), top = panel.querySelector('.sheet-top');
      floor = top.getBoundingClientRect().bottom;
      const delta = fit.getBoundingClientRect().top - floor;
      if (delta < 0 || tempo.getBoundingClientRect().bottom > innerHeight) panel.scrollTop += Math.max(delta, tempo.getBoundingClientRect().bottom - innerHeight);
      floor = top.getBoundingClientRect().bottom;
    } else window.scrollTo(0, fit.getBoundingClientRect().top + window.scrollY);
    const f = fit.getBoundingClientRect(), t = tempo.getBoundingClientRect();
    const c = which === 'app' ? (() => { const b = block.getBoundingClientRect(); return { left: b.left, width: b.width }; })() : content(block);
    const left = Math.min(c.left, f.left), right = Math.max(c.left + c.width, f.right);
    const fig = fit.querySelector(':scope > :not([hidden])');
    return { x: left, y: f.top, width: right - left, height: t.bottom - f.top, fitWidth: f.width, blockWidth: c.width, zoom: fig ? getComputedStyle(fig).zoom : null, floor, vh: innerHeight };
  }, [sel, which]);
  if (!r) throw new Error(`region: ${sel.fit} / ${sel.tempo} not found`);
  if (r.y < r.floor - 0.001 || r.y + r.height > r.vh + 0.001) throw new Error(`region: ${sel.fit}..${sel.tempo} (${r.height} px from y ${r.y}) does not fit between ${r.floor} and ${r.vh}`);
  await page.evaluate(() => new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res))));
  return r;
}

/** L2b: the computed properties compared node by node (plan 2.7), plus text-rendering ones, which only make it stricter. */
export const L2B_PROPS = [
  'fill', 'fill-opacity', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'stroke-linecap', 'stroke-linejoin', 'stroke-opacity',
  'opacity', 'display', 'visibility', 'color', 'background-color', 'background-image',
  'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'border-top-style', 'border-right-style', 'border-bottom-style', 'border-left-style',
  'border-top-left-radius', 'border-top-right-radius', 'border-bottom-left-radius', 'border-bottom-right-radius',
  'font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant-numeric', 'font-variant-ligatures', 'font-variant-caps',
  'font-feature-settings', 'font-variation-settings', 'font-optical-sizing', 'font-kerning', 'letter-spacing', 'word-spacing', 'line-height', 'text-transform',
  'text-rendering', '-webkit-font-smoothing', 'white-space', 'text-align', 'transform', 'zoom', 'pointer-events', 'mask', 'clip-path',
  'marker-start', 'marker-mid', 'marker-end', 'box-shadow', 'outline-style', 'filter', 'mix-blend-mode', 'isolation',
];
/** The same list on the `::before` of every element that has one (the callout highlight). */
export const L2B_BEFORE = ['content', 'background-color', 'opacity', 'top', 'right', 'bottom', 'left', 'border-top-left-radius', 'z-index'];

/**
 * Walks the golden block of one page (the elements from plate-fit to tempo; in the app the zoom slot is skipped by
 * name, and the golden's mistake figure is skipped while the app has not inserted its own yet) and returns, per element
 * in document order, its tag, its rect relative to the plate-fit's top-left, and the L2b properties.
 */
export function l2bWalk(page, sel, which, withMistake = true) {
  return page.evaluate(([s, which, props, before, withMistake]) => {
    const fit = document.querySelector(s.fit), root = document.querySelector(s.root);
    const o = fit.getBoundingClientRect();
    const tops = which === 'app' ? [...root.children].filter(e => !e.classList.contains('ht-zoom-slot'))
      : [...root.children].filter(e => !e.classList.contains('sheet-grab') && !e.classList.contains('sheet-head'));
    const out = [];
    const walk = (el, path) => {
      if (which === 'golden' && !withMistake && el.matches('.plate[data-mode="mistake"]')) return;
      const r = el.getBoundingClientRect(), cs = getComputedStyle(el);
      const row = { path, tag: el.tagName.toLowerCase(), rect: r.left === 0 && r.top === 0 && r.width === 0 && r.height === 0 ? 'none' : [r.left - o.left, r.top - o.top, r.width, r.height], css: props.map(p => cs.getPropertyValue(p)) };
      const b = getComputedStyle(el, '::before');
      if (b.content && b.content !== 'none' && b.content !== 'normal') row.before = before.map(p => b.getPropertyValue(p));
      out.push(row);
      [...el.children].forEach((c, i) => walk(c, `${path}>${c.tagName.toLowerCase()}[${i}]`));
    };
    tops.forEach((e, i) => walk(e, `${e.tagName.toLowerCase()}[${i}]`));
    return out;
  }, [sel, which, L2B_PROPS, L2B_BEFORE, withMistake]);
}

/** L2b compare: the same element list, every rect within ±0.01 px, every property exactly equal. Returns problems. */
export function l2bCompare(g, a, label, max = 12) {
  const bad = [];
  if (g.length !== a.length) bad.push(`${label}: ${a.length} elements in the app, ${g.length} in the golden`);
  for (let i = 0; i < Math.min(g.length, a.length) && bad.length < max; i++) {
    const x = g[i], y = a[i];
    if (x.tag !== y.tag) { bad.push(`${label} ${x.path}: <${y.tag}> in the app, <${x.tag}> in the golden`); break; }
    // an element with no box (defs, pattern children) has the all-zero viewport rect in both pages, or it is a mismatch
    const d = x.rect === 'none' || y.rect === 'none' ? [x.rect === y.rect ? 0 : 1] : x.rect.map((v, k) => Math.abs(v - y.rect[k]));
    if (d.some(v => v > 0.01)) bad.push(`${label} ${x.path}: rect ${JSON.stringify(y.rect)} vs golden ${JSON.stringify(x.rect)}`);
    x.css.forEach((v, k) => { if (v !== y.css[k] && bad.length < max) bad.push(`${label} ${x.path} ${L2B_PROPS[k]}: "${y.css[k]}" vs golden "${v}"`); });
    if (JSON.stringify(x.before) !== JSON.stringify(y.before)) bad.push(`${label} ${x.path}::before: ${JSON.stringify(y.before)} vs golden ${JSON.stringify(x.before)}`);
  }
  return bad;
}

/**
 * The origin of the raster layer the plate-fit paints into, found from Chromium's own layer tree (CDP LayerTree):
 * the nearest ancestor of `fitSel` that owns a compositing layer. A scroller's contents raster from its padding box
 * minus its scroll offset; any other layer from its border box; no layer means the document (root scroller). Which
 * element is composited depends on the Chromium build (build 1243 composites every overflow:auto scroller, so the
 * app's sheet panel; build 1194 composites only the modal dialog), so it is measured, never assumed.
 * Returns { x, y, el } in viewport coordinates, `el` a short name of the layer's element.
 */
export async function rasterOrigin(page, fitSel, known = null) {
  // one CDP session per page; a fresh one when the old one stops reporting (seen on CI 1243 after the golden page's reload)
  const open = async () => {
    if (page.__ht3cdp) await page.__ht3cdp.detach().catch(() => {});
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('DOM.enable'); await cdp.send('LayerTree.enable');
    cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) page.__ht3layers = e.layers; });
    page.__ht3cdp = cdp;
  };
  if (!page.__ht3cdp) await open();
  await page.__ht3cdp.send('DOM.enable'); await page.__ht3cdp.send('LayerTree.enable');
  // Chromium reports the layer tree when it changes: after two painted frames, a 1 px off-screen probe layer is added,
  // the tree read one frame later, and the probe removed. Layers are decided lazily (a dialog just opened may not have
  // its own yet), so the tree is read until two readings agree.
  const readOwners = async () => {
    await frames2(page);
    page.__ht3layers = null;
    // a loaded runner can take seconds to commit a frame: up to 5 tries of 2 s, each with a fresh probe size, and then
    // the same again on a fresh session
    for (let k = 0; !page.__ht3layers && k < 10; k++) {
      if (k === 5) await open();
      await page.evaluate(k => { document.getElementById('ht3-layer-probe')?.remove(); const i = document.createElement('i'); i.id = 'ht3-layer-probe'; i.style.cssText = `position:fixed;left:-10px;top:-10px;width:${1 + k}px;height:1px;will-change:transform`; document.body.append(i); }, k);
      for (let t = 0; !page.__ht3layers && t < 100; t++) await new Promise(r => setTimeout(r, 20));
    }
    await frames2(page);
    const layers = page.__ht3layers;
    await page.evaluate(() => document.getElementById('ht3-layer-probe')?.remove());
    if (!layers) throw new Error('rasterOrigin: no layer tree from Chromium');
    return new Set(layers.map(l => l.backendNodeId).filter(Boolean));
  };
  let owners = known ?? await readOwners();
  for (let k = 0; !known && k < 4; k++) { const again = await readOwners(); const same = again.size === owners.size && [...again].every(x => owners.has(x)); owners = again; if (same) break; }
  if (fitSel == null) return owners;   // layerOwners()
  const cdp = page.__ht3cdp;
  const { result } = await cdp.send('Runtime.evaluate', { expression: `(() => { const out = []; for (let e = document.querySelector(${JSON.stringify(fitSel)}); e; e = e.parentElement) out.push(e); return out; })()` });
  const { result: props } = await cdp.send('Runtime.getProperties', { objectId: result.objectId, ownProperties: true });
  const els = props.filter(p => /^\d+$/.test(p.name)).sort((a, b) => a.name - b.name);
  let depth = -1;
  for (const p of els) { const { node } = await cdp.send('DOM.describeNode', { objectId: p.value.objectId }); if (owners.has(node.backendNodeId)) { depth = +p.name; break; } }
  await cdp.send('Runtime.releaseObject', { objectId: result.objectId });
  return page.evaluate(([sel, depth]) => {
    if (depth < 0) return { x: -scrollX, y: -scrollY, el: 'document', self: false };
    let e = document.querySelector(sel); for (let k = 0; k < depth; k++) e = e.parentElement;
    const r = e.getBoundingClientRect(), cs = getComputedStyle(e), scroller = /(auto|scroll)/.test(cs.overflowY + cs.overflowX);
    const name = `${e.tagName.toLowerCase()}${e.id ? '#' + e.id : ''}${[...e.classList].map(c => '.' + c).join('')}`;
    return { ...(scroller ? { x: r.left + e.clientLeft - e.scrollLeft, y: r.top + e.clientTop - e.scrollTop } : { x: r.left, y: r.top }), el: name, self: depth === 0 };
  }, [fitSel, depth]);
}

/**
 * D-HT3-sections: hides (`display: none`, inline) or restores the How-to sheet's sections around a capture.
 * Returns the number of sections displayed: before hiding, or after restoring.
 */
export const SECTION_SEL = 'dialog.sheet.ht [data-section]';

/**
 * D-HT3-sections, the sheet-wide section bleed: every displayed section below the golden block must be exactly as wide
 * as golden B's sections, which sit in the gallery card's content box (358 / 328 / 308 px at 390 / 360 / 340; measured
 * equal to golden A's card content box, which is read here). Returns the problems.
 */
export async function sectionWidthProblems(appPage, goldPage, id) {
  const want = await goldPage.evaluate(id => { const c = document.getElementById(`card-${id}`), cs = getComputedStyle(c), r = c.getBoundingClientRect();
    return r.width - parseFloat(cs.borderLeftWidth) - parseFloat(cs.borderRightWidth) - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight); }, id);
  const got = await appPage.evaluate(sel => [...document.querySelectorAll(sel)].filter(e => getComputedStyle(e).display !== 'none').map(e => [e.dataset.section, e.getBoundingClientRect().width]), SECTION_SEL);
  return got.filter(([, w]) => Math.abs(w - want) > 0.01).map(([name, w]) => `section ${name} is ${w} px wide, golden B's sections are ${want}`);
}
export function hideSections(page, hide) {
  return page.evaluate(([sel, hide]) => {
    const els = [...document.querySelectorAll(sel)];
    const shown = () => els.filter(e => getComputedStyle(e).display !== 'none').length;
    if (hide) {
      const n = shown();
      for (const e of els) { e.dataset.ht3Display = e.style.display; e.style.display = 'none'; }
      return n;
    }
    for (const e of els) { if ('ht3Display' in e.dataset) { e.style.display = e.dataset.ht3Display; delete e.dataset.ht3Display; } }
    return shown();
  }, [SECTION_SEL, hide]);
}

/** The element ids (backendNodeId) that own a compositing layer, read until stable (see rasterOrigin). */
export const layerOwners = page => rasterOrigin(page, null);

/** The golden block's parts in each page, plate-fit to tempo (the app's zoom slot excluded), as selectors. */
const PARTS = ['.cue-line', '.plate-controls', '.tells', '.tempo'];
const partSels = (which, id) => (which === 'app'
  ? ['dialog.sheet.ht .ht-plate-fit', ...PARTS.map(p => `dialog.sheet.ht .ht-golden > ${p}`)]
  : [`#${id}-plate`, ...PARTS.map(p => `#card-${id} > ${p}`)]);

/**
 * Capture mode (D-HT3, the supervisor's fallback of 2026-09-30): every part of the golden block gets its own
 * compositing layer (`will-change: transform`, inline, removed after the capture), in both pages, at the same
 * sub-pixel position. Each part then rasterises from its own box, whatever layer Chromium gives the sheet around it
 * (build 1194: the dialog; build 1243: the scrolling panel), so the two pages rasterise alike in every build.
 * With `check`, each visible part must own its layer (read back from Chromium's layer tree); returns the problems.
 */
export async function ownLayers(page, which, id, on, check = false) {
  const sels = partSels(which, id);
  await page.evaluate(([sels, on]) => { for (const s of sels) { const e = document.querySelector(s); if (e) e.style.willChange = on ? 'transform' : ''; } }, [sels, on]);
  if (!on || !check) return [];
  const bad = [], owners = await layerOwners(page);
  for (const s of sels) {
    const shown = await page.evaluate(s => { const e = document.querySelector(s); return !!e && getComputedStyle(e).display !== 'none'; }, s);
    if (!shown) continue;
    const o = await rasterOrigin(page, s, owners);
    if (!o.self) bad.push(`${which} ${s} rasterises in ${o.el}, not its own layer`);
  }
  return bad;
}

/**
 * The golden card presented in a modal <dialog> (the dialog inherits #sheets' colour and font; its side padding is the
 * gallery group's 16 px gutter, moved by the sub-pixel difference), placed so the plate-fit sits at exactly the app's
 * viewport position (`at` = appOffset(), measured on every capture), with every block part on its own layer (ownLayers).
 * Only the capture changes: the card node, its markup and every style it inherits stay as they are. `extra` moves the
 * plate down; `own: false` (the controls) keeps the parts in the dialog's layer, where the raster phase shows.
 * Returns the layer problems (each part must own its layer).
 */
export async function presentGolden(page, id, at, extra = 0, paused = false, own = true) {
  const fitSel = `#${id}-plate`;
  const got = await page.evaluate(([id, at, extra]) => {
    const c = document.getElementById(`card-${id}`);
    let d = document.getElementById('ht3-present');
    if (!d) {
      d = document.createElement('dialog'); d.id = 'ht3-present';
      d.style.cssText = 'box-sizing:border-box;padding:0 16px;border:0;margin:0;inset:0 auto auto 0;width:100%;max-width:none;max-height:none;background:transparent;overflow:visible;color:inherit;font:inherit;letter-spacing:inherit';
      document.getElementById('sheets').append(d);
    }
    if (c.parentElement !== d) { c.before(Object.assign(document.createElement('i'), { id: 'ht3-home' })); d.append(c); }
    if (!d.open) d.showModal();
    Object.assign(d.style, { top: '0px', paddingTop: '0px', paddingLeft: '16px', paddingRight: '16px' });
    const f0 = document.getElementById(`${id}-plate`).getBoundingClientRect();
    const dx = at.x - f0.left;
    // `extra` moves the plate inside the dialog (its layer), not the dialog: that is what shows the raster phase
    Object.assign(d.style, { top: `${at.y - f0.top}px`, paddingTop: `${extra}px`, paddingLeft: `${16 + dx}px`, paddingRight: `${16 - dx}px` });
    const f = document.getElementById(`${id}-plate`).getBoundingClientRect();
    return { x: f.left, y: f.top };
  }, [id, at, extra]);
  if (got.x !== at.x || got.y !== at.y + extra) throw new Error(`presentGolden: the golden plate is at ${got.x},${got.y}, the app's at ${at.x},${at.y} (+${extra})`);
  const bad = own ? await ownLayers(page, 'golden', id, true, true) : [];
  if (paused) await frames2(page); else await settle(page);   // paused Trace animations never end, so wait for paint only
  return bad;
}

/** Puts the golden card back where it was (and its parts back in the card's layer). */
export async function unpresentGolden(page, paused = false) {
  await page.evaluate(() => {
    for (const e of document.querySelectorAll('#ht3-present [style*="will-change"]')) e.style.willChange = '';
    const d = document.getElementById('ht3-present'), home = document.getElementById('ht3-home');
    if (d && home) { home.replaceWith(d.querySelector('.sheet-card')); d.close(); }
  });
  if (paused) await frames2(page); else await settle(page);
}

/** The app plate-fit's viewport position (with its parts on their own layers), and whether the sheet scrolls. */
export async function appOffset(page) {
  return page.evaluate(() => {
    const p = document.querySelector('dialog.sheet.ht .sheet-panel'), f = p.querySelector('.ht-plate-fit').getBoundingClientRect();
    return { x: f.left, y: f.top, scrolls: p.scrollHeight > p.clientHeight };
  });
}

/** F3: the golden block's markup, serialised as it stands (wrapper classes mapped back, the zoom slot dropped). */
export function blockMarkup(page, which, id, withMistake = true) {
  return page.evaluate(([which, id, withMistake]) => {
    const els = which === 'app' ? [...document.querySelector('dialog.sheet.ht .ht-golden').childNodes]
      : (() => { const card = document.getElementById(`card-${id}`), fit = document.getElementById(`${id}-plate`); const out = []; for (let n = fit; n; n = n.nextSibling) out.push(n); return out; })();
    return els.filter(n => !(n.nodeType === 1 && n.classList.contains('ht-zoom-slot'))).map(n => {
      if (n.nodeType !== 1) return n.textContent;
      let h = n.outerHTML;
      if (which === 'golden') {
        if (n.id === `${id}-plate` && !withMistake) h = h.replace(/<figure class="plate" data-mode="mistake"[\s\S]*<\/figure>(?=<\/div>$)/, '');
        h = h.replace(/class="plate-fit"/g, 'class="ht-plate-fit"').replace(/<figure class="plate"/g, '<figure class="ht-plate"');
      }
      return h;
    }).join('').replace(/\n\s*$/, '');
  }, [which, id, withMistake]);
}

/** The taller viewport (supervisor, PR #106): under the Train page's own height (1,363 px at 390), so the app page
 * still scrolls and its sheet dialog keeps its own layer, as the golden page's does. */
export const TALL_H = 1300;
export const HT_THEMES = ['silent-black', 'paper', 'midnight', 'ember', 'emerald'];
/** Themes with the full matrix: every callout and tell, the Trace frames, the widths (plan 2.7 L3, L4). */
export const HT_FULL = ['silent-black', 'paper'];
const TEXT_PROPS = ['font-family', 'font-size', 'font-weight', 'font-style', 'letter-spacing', 'line-height', 'text-transform', 'color', 'display', 'margin-bottom'];

const frames2 = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

/** The traced figure's animations, as comparable data (target by its path inside the figure). */
const animList = (page, figSel) => page.evaluate(sel => {
  const fig = document.querySelector(sel);
  const path = el => { const p = []; for (let e = el; e && e !== fig; e = e.parentElement) p.unshift([...e.parentElement.children].indexOf(e)); return p.join('.'); };
  return fig.getAnimations({ subtree: true }).map(a => ({ target: path(a.effect.target), name: a.animationName, keyframes: a.effect.getKeyframes(), timing: a.effect.getTiming() }))
    .sort((x, y) => (x.target + x.name).localeCompare(y.target + y.name));
}, figSel);
/**
 * Freezes the traced figure at `t` ms: every Trace animation is set to t, its value written into the element's style
 * (commitStyles) and the animation cancelled, so the frame renders without compositor animation layers. The styles
 * are saved first for unfreeze(). `t` null: cancel only (the Trace is dropped, then unfreeze() resets it).
 */
const freezeAt = (page, figSel, t) => page.evaluate(([sel, t]) => {
  const as = document.querySelector(sel).getAnimations({ subtree: true });
  const saved = new Map();
  for (const a of as) if (!saved.has(a.effect.target)) saved.set(a.effect.target, a.effect.target.getAttribute('style'));
  window.__ht3Saved = saved;
  if (t != null) for (const a of as) { a.pause(); a.currentTime = t; a.commitStyles(); }
  for (const a of as) a.cancel();
  return as.length;
}, [figSel, t]);
/** Undoes freezeAt() and ends the Trace the way the gallery's endTrace() does (class and aria-pressed). */
const unfreeze = (page, figSel, id) => page.evaluate(([sel, id]) => {
  for (const [el, st] of window.__ht3Saved ?? []) { if (st == null) el.removeAttribute('style'); else el.setAttribute('style', st); }
  window.__ht3Saved = null;
  document.querySelector(sel).classList.remove('tracing');
  document.getElementById(`${id}-trace`).setAttribute('aria-pressed', 'false');
}, [figSel, id]);
const click = (page, sel) => page.evaluate(s => { const b = document.querySelector(s); if (!b) throw new Error(`no ${s}`); b.click(); }, sel);

/**
 * Gate block HT-3's fidelity run (card HT3-A5..A7, plan 2.7 L2b, F3, L3, L4): the app's How-to sheet against the
 * approved gallery, per theme in its own pair of contexts, run side by side. Returns { problems, stats }.
 * `mutate` (tests only) runs in every app page after the sheet opens, to prove a mutation fails.
 */
export async function ht3Fidelity(browser, port, { themes = HT_THEMES, full = HT_FULL, plates = HT_PLATES, widths = [360, 340], shards = 2, mutate = null } = {}) {
  const t0 = Date.now(), problems = [], stats = { t: { markup: 0, present: 0, capture: 0, diff: 0 }, pairs: 0, off1Max: 0, offMax: 0, tall: [], l2b: 0, f3: 0, anims: 0 };
  const run = async (theme, subset) => {
    const P = m => problems.push(`${theme} ${m}`);
    const app = await openAppTrain(browser, port, theme, { onError: m => P(`app page error: ${m}`) });
    let gold = await openGolden(browser, theme, { onError: m => P(`golden page error: ${m}`) });
    const figSel = { app: 'dialog.sheet.ht .ht-golden figure[data-mode="normal"]', golden: id => `#card-${id} .plate[data-mode="normal"]` };
    let width = DEVICE.viewport.width, withM = false;
    const both = async fn => { await Promise.all([fn(app.page, 'app'), fn(gold.page, 'golden')]); };
    const check = async (id, label, { markup = true } = {}) => {
      await settleApp(app.page);
      let tk = Date.now(); const lap = k => { const n = Date.now(); stats.t[k] += n - tk; tk = n; };
      // D-HT3-sections: the sections below the golden block (HT-6 on) are display:none for the whole check (L2b, F3
      // and the capture) and restored after; their DOM and stylesheets stay, so a CSS leak into the block still fails
      const secBefore = await hideSections(app.page, true);
      if (markup) {
        await unpresentGolden(gold.page);
        const [ga, aa] = await Promise.all([blockMarkup(gold.page, 'golden', id, withM), blockMarkup(app.page, 'app', id)]);
        stats.f3++;
        if (ga !== aa) { let i = 0; while (ga[i] === aa[i]) i++; P(`${id} ${label} F3: the block markup differs at char ${i}: app …${aa.slice(i - 40, i + 80)}… golden …${ga.slice(i - 40, i + 80)}…`); }
        const [gw, aw] = await Promise.all([l2bWalk(gold.page, G.golden(id), 'golden', withM), l2bWalk(app.page, G.app(id), 'app')]);
        stats.l2b++;
        for (const b of l2bCompare(gw, aw, `${id} ${label} L2b`)) P(b);
      }
      lap('markup');
      // when the sheet would scroll (its panel then sits at the fractional 92dvh line, where text snaps differently)
      // or the region does not fit, both pages are captured at the same width x TALL_H, where neither holds
      const fits = async () => { try { await region(app.page, G.app(id), 'app'); return true; } catch { return false; } };
      const scrolls = () => app.page.evaluate(() => { const p = document.querySelector('dialog.sheet.ht .sheet-panel'); return p.scrollHeight > p.clientHeight; });
      let tall = false;
      if ((await scrolls()) || !(await fits())) {
        tall = true; stats.tall.push(`${theme}/${id}/${label}@${width}`);
        await Promise.all([app.page.setViewportSize({ width, height: TALL_H }), gold.page.setViewportSize({ width, height: TALL_H })]);
        await settleApp(app.page);
        if ((await scrolls()) || !(await fits())) P(`${id} ${label}: the sheet still scrolls or the region does not fit at ${width}x${TALL_H}`);
      }
      const own = await ownLayers(app.page, 'app', id, true, true);
      const ao = await appOffset(app.page);
      own.push(...await presentGolden(gold.page, id, ao));
      stats.ownLayers = (stats.ownLayers ?? 0) + (own.length ? 0 : 1);
      for (const b of own) P(`${id} ${label}: ${b}`);
      lap('present');
      const [ra, rg] = await Promise.all([region(app.page, G.app(id), 'app'), region(gold.page, G.golden(id), 'golden')]);
      const exp = width === 390 ? 358 : null;
      if (ra.blockWidth !== rg.blockWidth || ra.fitWidth !== rg.fitWidth || ra.width !== rg.width || ra.height !== rg.height || ra.zoom !== rg.zoom || (exp && (ra.fitWidth !== exp || ra.zoom !== '1')))
        P(`${id} ${label} @${width}: widths differ: app .ht-golden ${ra.blockWidth} / .ht-plate-fit ${ra.fitWidth} (zoom ${ra.zoom}), region ${ra.width}x${ra.height}; golden card content ${rg.blockWidth} / .plate-fit ${rg.fitWidth} (zoom ${rg.zoom}), region ${rg.width}x${rg.height}`);
      else {
        const [a, g] = await Promise.all([capture(app.page, ra), capture(gold.page, rg)]);
        lap('capture');
        const d = await diffPng(gold.page, a, g);
        lap('diff');
        stats.pairs++; stats.offMax = Math.max(stats.offMax, d.off); stats.off1Max = Math.max(stats.off1Max, d.off1);
        if (d.ink < 0.05) P(`${id} ${label}: the capture is nearly blank (ink ${(d.ink * 100).toFixed(1)} %)`);
        if (!meetsRule(d) && process.env.HT3_DUMP && (stats.dumped = (stats.dumped ?? 0) + 1) <= 12) {   // diff images for a supervisor decision (plan: never a threshold fix)
          const { writeFileSync, mkdirSync } = await import('node:fs');
          mkdirSync(process.env.HT3_DUMP, { recursive: true });
          const f = `${process.env.HT3_DUMP}/${theme}-${id}-${label.replace(/[^\w@-]/g, '_')}-${width}`;
          writeFileSync(`${f}-app.png`, a); writeFileSync(`${f}-golden.png`, g);
          if (stats.dumped <= 2) {   // the compositing layers of both pages, for the diagnosis
            const layers = async pg => { const cdp = await pg.context().newCDPSession(pg); await cdp.send('LayerTree.enable');
              const ls = await new Promise(r => { cdp.on('LayerTree.layerTreeDidChange', e => { if (e.layers) r(e.layers); }); pg.evaluate(() => { document.body.style.outlineColor = document.body.style.outlineColor === 'red' ? 'blue' : 'red'; }); setTimeout(() => r([]), 2000); });
              const out = []; for (const l of ls) { let why = []; try { why = (await cdp.send('LayerTree.compositingReasons', { layerId: l.layerId })).compositingReasonIds; } catch { /* gone */ } out.push(`${l.offsetX},${l.offsetY} ${l.width}x${l.height} ${why.join('+')}`); } await cdp.detach(); return out; };
            writeFileSync(`${f}-layers.json`, JSON.stringify({ app: await layers(app.page), golden: await layers(gold.page), ra, rg, ao }, null, 1));
          }
        }
        if (!meetsRule(d)) P(`${id} ${label} @${width}${tall ? `x${TALL_H}` : ''} L3: ${d.off} px off (max ${d.maxDelta}/255, ${d.off1} off by 1, of ${d.total}); trace/mistake aria-pressed app ${await app.page.evaluate(i => [`${i}-trace`, `${i}-mistake`].map(x => document.getElementById(x)?.getAttribute('aria-pressed')).join('/'), id)} golden ${await gold.page.evaluate(i => [`${i}-trace`, `${i}-mistake`].map(x => document.getElementById(x)?.getAttribute('aria-pressed')).join('/'), id)}`);
      }
      await ownLayers(app.page, 'app', id, false);
      const secAfter = await hideSections(app.page, false);
      if (secAfter !== secBefore) P(`${id} ${label}: ${secBefore} sections were displayed before the capture, ${secAfter} after (not restored)`);
      if (tall) { await Promise.all([app.page.setViewportSize({ width, height: 844 }), gold.page.setViewportSize({ width, height: 844 })]); await settleApp(app.page); }
    };
    const keys = (mode) => app.page.$$eval(`dialog.sheet.ht .ht-golden figure[data-mode="${mode}"] .plate-callout`, bs => bs.map(b => b.dataset.key));
    for (const w of [390, ...(full.includes(theme) ? widths : [])]) {
      width = w;
      if (w !== 390) {   // the app reopens every sheet at S0; the golden page is opened afresh at this width so its cards are at S0 too
        await app.page.setViewportSize({ width: w, height: 844 });
        await gold.ctx.close();
        gold = await openGolden(browser, theme, { viewport: { width: w, height: 844 }, onError: m => P(`golden page error: ${m}`) });
      }
      for (const [id] of subset) {
        const index = HT_PLATES.findIndex(p => p[0] === id);
        await openHowTo(app.page, index);
        withM = false;
        if (mutate) await app.page.evaluate(mutate, id);
        for (const b of await sectionWidthProblems(app.page, gold.page, id)) P(`${id} @${w}: ${b}`);
        if (w === 390) {
          const txt = await Promise.all([
            app.page.$$eval('dialog.sheet.ht .sheet-head h2, dialog.sheet.ht .sheet-eyebrow', (els, props) => els.map(e => props.map(p => getComputedStyle(e).getPropertyValue(p))), TEXT_PROPS),
            gold.page.$$eval(`#card-${id} h3, #card-${id} .sheet-eyebrow`, (els, props) => els.map(e => props.map(p => getComputedStyle(e).getPropertyValue(p))), TEXT_PROPS),
          ]);
          if (txt[0].length !== 2 || JSON.stringify(txt[0]) !== JSON.stringify(txt[1])) P(`${id} L2b title/eyebrow text styles: app ${JSON.stringify(txt[0])} vs golden ${JSON.stringify(txt[1])}`);
        }
        await check(id, 'N');
        const deep = full.includes(theme) && w === 390;
        if (deep) {
          const nk = await keys('normal');
          for (const k of nk.slice(1)) { await both(p => click(p, `#${id}-n-${k}`)); await check(id, `N:${k}`); }
          await both(p => click(p, `#${id}-n-${nk[0]}`));
        }
        await both(p => click(p, `#${id}-mistake`)); withM = true;
        await check(id, 'M');
        if (deep) {
          const tk = await keys('mistake');
          for (const k of tk.slice(1)) { await both(p => click(p, `#${id}-m-${k}`)); await check(id, `M:${k}`); }
          // HT3-A6: snapshot, hide, change, show, restore; the plate must be back exactly (then L3 again)
          const r = await app.page.evaluate(() => {
            const g = document.querySelector('dialog.sheet.ht .ht-golden'), api = g.htPlateApi, fit = g.querySelector('.ht-plate-fit');
            const s = api.snapshot(); api.setPlateHidden(true);
            const hid = fit.hidden && fit.inert && !api.slot.hidden && api.slot === g.querySelector('.ht-zoom-slot');
            api.clearMistake(); const cleared = api.snapshot(); api.setPlateHidden(false); api.restore(s);
            return { s, hid, cleared, back: api.snapshot(), shown: !fit.hidden && !fit.inert && api.slot.hidden, keys: Object.keys(g).includes('htPlateApi') };
          });
          if (!r.hid || !r.shown || r.keys || JSON.stringify(r.back) !== JSON.stringify(r.s) || r.cleared.mode !== 'normal') P(`${id} A6 zoom slot API: ${JSON.stringify(r)}`);
          await check(id, 'M:after-hide-restore');
        }
        await both(p => click(p, `#${id}-mistake`)); withM = true;
        if (w === 390) {
          // L4: Trace. The animation lists first, then frames at 0.6 / 1.2 / 1.8 s (full themes) and the 2.4 s frame (every
          // theme). A frame is frozen, not merely paused: a running (or paused) opacity animation gets its own compositor
          // layer whose bounds depend on the page around the plate, which moves anti-aliasing by up to 6/255. freezeAt()
          // writes each animated value at t into the element (commitStyles) and cancels the animation, in both pages alike.
          await both(p => click(p, `#${id}-trace`));
          const [la, lg] = await Promise.all([animList(app.page, figSel.app), animList(gold.page, figSel.golden(id))]);
          stats.anims++;
          if (!la.length || JSON.stringify(la) !== JSON.stringify(lg)) P(`${id} L4: the Trace animations differ (app ${la.length}, golden ${lg.length}): ${JSON.stringify(la).slice(0, 300)} vs ${JSON.stringify(lg).slice(0, 300)}`);
          if (full.includes(theme)) {   // Trace ends by itself: once its animations have finished, .tracing goes within 1 s
            const ended = sel => document.querySelector(sel).classList.contains('tracing') === false;
            // measured from the animations' own finish (not a wall-clock guess), so a loaded CI runner cannot fake a failure
            await both(p => p.evaluate(sel => Promise.all(document.querySelector(sel).getAnimations({ subtree: true }).map(a => a.finished.catch(() => {}))), p === app.page ? figSel.app : figSel.golden(id)));
            await both((p, w) => p.waitForFunction(ended, w === 'app' ? figSel.app : figSel.golden(id), { timeout: 1000 }).catch(() => P(`${id} L4: Trace did not end by itself in the ${w} page`)));
            const pressed = await app.page.$eval(`#${id}-trace`, b => b.getAttribute('aria-pressed'));
            if (pressed !== 'false') P(`${id} L4: Trace is still aria-pressed=${pressed} after it ended`);
          } else { await both((p, w) => freezeAt(p, w === 'app' ? figSel.app : figSel.golden(id), null)); await both((p, w) => unfreeze(p, w === 'app' ? figSel.app : figSel.golden(id), id)); }
          await settleApp(app.page); await settle(gold.page);
          const shots = [];
          for (const t of full.includes(theme) ? [600, 1200, 1800, 2400] : [2400]) {
            // present first: moving the card node later would restart its cancelled CSS animations
            await presentGolden(gold.page, id, await appOffset(app.page));
            await both(p => click(p, `#${id}-trace`));
            await both((p, w) => freezeAt(p, w === 'app' ? figSel.app : figSel.golden(id), t));
            await check(id, `T@${t}`, { markup: false });
            if (t === 600 || t === 2400) shots.push(await capture(app.page, await region(app.page, G.app(id), 'app')));
            await both((p, w) => unfreeze(p, w === 'app' ? figSel.app : figSel.golden(id), id));
            await unpresentGolden(gold.page);
          }
          if (shots.length === 2 && (await diffPng(app.page, shots[0], shots[1])).off === 0) P(`${id} L4: the 0.6 s and 2.4 s Trace frames are identical, so the frame check sees no motion`);
          await settleApp(app.page); await settle(gold.page);
          // reduced motion: Trace shows the end state at once
          await both(p => p.emulateMedia({ reducedMotion: 'reduce' }));
          await both(p => p.waitForFunction(() => document.documentElement.getAttribute('data-motion') === 'reduce', null, { timeout: 5000 }));
          await both(p => click(p, `#${id}-trace`));
          await check(id, 'R:end', { markup: false });
          await both(p => p.emulateMedia({ reducedMotion: 'no-preference' }));
          await both(p => p.waitForFunction(() => document.documentElement.getAttribute('data-motion') !== 'reduce', null, { timeout: 5000 }));
        }
        await unpresentGolden(gold.page);
        await closeHowTo(app.page);
      }
    }
    await app.ctx.close(); await gold.ctx.close();
  };
  // the full themes carry most of the matrix, so their plates are split over `shards` context pairs each
  const jobs = themes.flatMap(t => { const n = full.includes(t) ? shards : 1; return [...Array(n)].map((_, k) => [t, plates.filter((_, i) => i % n === k)]).filter(([, ps]) => ps.length); });
  await Promise.all(jobs.map(([t, ps]) => run(t, ps).catch(e => problems.push(`${t}: ${e.message.split('\n')[0]} ${(e.stack || '').split('\n').filter(l => l.includes('harness.mjs')).slice(0, 3).join(' | ')}`))));
  stats.ms = Date.now() - t0;
  return { problems, stats };
}

/**
 * Gate block HT-3's sheet behaviour (card HT3-A1, A3, A8): the entry only where approved content exists, S0 on every
 * open, the mistake figure only after the first Mistake tap, the element budget, Back, Escape and drag-to-close, focus
 * back on the entry, 44 px targets, and no stored data. One theme, one context. Returns { problems, stats }.
 */
export async function ht3Behaviour(browser, port, theme = 'silent-black') {
  const problems = [], stats = {};
  const P = m => problems.push(`${theme} ${m}`);
  const { ctx, page } = await openAppTrain(browser, port, theme, { onError: m => P(`page error: ${m}`) });
  try {
    const keysBefore = await page.evaluate(() => Object.keys(localStorage).sort().join(','));
    const box = async loc => { const b = await loc.boundingBox(); return b ? [b.width, b.height] : null; };
    // HT3-A1: the controls. Bench press (no approved content) and the custom exercise show no entry.
    for (const [index, name] of [[HT_ORDER.indexOf(HT_NO_HOWTO), `${HT_NO_HOWTO} (no approved content)`], [HT_ORDER.indexOf(HT_CUSTOM.id), 'custom exercise']]) {
      const card = await openCard(page, index);
      if (await card.locator('.ht-entry').count()) P(`A1: the ${name} card has a How-to entry`);
    }
    for (const [index] of HT_PLATES.entries()) {
      const card = await openCard(page, index);
      const entry = card.locator('button.ht-entry');
      const n = await entry.count(), name = n === 1 ? (await entry.getAttribute('aria-label')) ?? (await entry.innerText()).trim() : null, b = n === 1 ? await box(entry) : null;
      if (n !== 1 || name !== 'How to do it' || !b || b[0] < 44 || b[1] < 44) P(`A1: ${HT_PLATES[index][1]}: ${n} entries, name ${JSON.stringify(name)}, box ${JSON.stringify(b)}`);
    }
    // HT3-A3: S0, the element budget, the mistake figure only after the first tap, the 44 px pills
    const id = HT_PLATES[0][0], dlg = 'dialog.sheet.ht';
    const s0 = async () => page.evaluate(([dlg, id]) => {
      const d = document.querySelector(dlg);
      if (!d) return null;
      return { els: d.querySelectorAll('*').length, mistakeFig: !!d.querySelector('.ht-plate[data-mode="mistake"]'), normalShown: !d.querySelector('.ht-plate[data-mode="normal"]').hidden,
        pressed: [...d.querySelectorAll('.ht-plate[data-mode="normal"] .plate-callout[aria-pressed="true"]')].map(b => b.dataset.key), mistakeOn: document.getElementById(`${id}-mistake`).getAttribute('aria-pressed'),
        eyebrow: d.querySelector('.sheet-head h2 .sheet-eyebrow')?.textContent, title: d.querySelector('.sheet-head h2')?.lastChild?.textContent, open: d.open };
    }, [dlg, id]);
    await openHowTo(page, 0);
    let st = await s0();
    stats.elementsS0 = st?.els;
    const firstKey = st?.pressed?.[0];
    if (!st || st.els > 700 || st.mistakeFig || !st.normalShown || st.pressed.length !== 1 || st.mistakeOn !== 'false' || st.eyebrow !== 'How to do it' || st.title !== 'Dumbbell Lateral Raise' || !st.open) P(`A3: the first open is not S0 within 700 elements: ${JSON.stringify(st)}`);
    for (const pill of [`#${id}-trace`, `#${id}-mistake`]) { const b = await box(page.locator(pill)); if (!b || b[0] < 44 || b[1] < 44) P(`A8: ${pill} is ${JSON.stringify(b)}, under 44x44`); }
    await page.locator(`#${id}-mistake`).click();
    if (!(await page.locator(`${dlg} .ht-plate[data-mode="mistake"]`).count())) P('A3: the first Mistake tap did not insert the mistake figure');
    await page.locator(`${dlg} .ht-plate[data-mode="mistake"] .plate-callout`).nth(1).click();
    if (await page.locator('.form-guide').count()) P('G7: a .form-guide element is inside the open How-to sheet');
    // Escape (the dialog's cancel) closes; focus goes back to the entry
    await closeHowTo(page);
    const focus = await page.evaluate(() => document.activeElement?.className);
    if (focus !== 'ht-entry') P(`A3: after closing, focus is on "${focus}", not the entry`);
    // reopen: S0 again (nothing remembered)
    await openHowTo(page, 0);
    st = await s0();
    if (!st || st.mistakeFig || !st.normalShown || st.mistakeOn !== 'false' || JSON.stringify(st.pressed) !== JSON.stringify([firstKey])) P(`A3: a second open is not S0: ${JSON.stringify(st)}`);
    // Back (Android back and the browser's back both pop the sheet's history entry)
    await page.goBack();
    await page.locator(dlg).waitFor({ state: 'detached', timeout: 5000 }).catch(() => P('A3: Back did not close the sheet'));
    await settleApp(page);
    // drag-to-close on the sheet's grab bar
    await openHowTo(page, 0);
    const g = await page.locator(`${dlg} .sheet-grab`).boundingBox();
    await page.mouse.move(g.x + g.width / 2, g.y + 2); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { await page.mouse.move(g.x + g.width / 2, g.y + 2 + i * 40); await page.waitForTimeout(16); }
    await page.mouse.up();
    await page.locator(dlg).waitFor({ state: 'detached', timeout: 5000 }).catch(() => P('A3: dragging the sheet down did not close it'));
    await settleApp(page);
    const keysAfter = await page.evaluate(() => Object.keys(localStorage).sort().join(','));
    if (keysAfter !== keysBefore) P(`no new saved data: localStorage keys ${keysBefore} became ${keysAfter}`);
  } finally { await ctx.close(); }
  return { problems, stats };
}

/**
 * The raster-phase controls for presentGolden (recorded in D-HT3): the golden card in a dialog at phase p and at
 * p + 128 CSS px must be 0 px apart (the tile period), and at p + 1 must fail the L3 rule (the phase matters, so
 * aligning it is not a blind spot). Returns problems.
 */
export async function presentControls(browser, theme = 'silent-black', id = HT_PLATES[2][0]) {
  const problems = [];
  const shots = [];
  for (const extra of [0, 128, 1]) {
    const { ctx, page } = await openGolden(browser, theme);
    await presentGolden(page, id, { x: 16, y: 100 }, extra, false, false);   // the parts stay in the dialog's layer: the raster phase must show
    shots.push({ png: await capture(page, await region(page, G.golden(id), 'golden')), page, ctx });
  }
  const d128 = await diffPng(shots[0].page, shots[0].png, shots[1].png), d1 = await diffPng(shots[0].page, shots[0].png, shots[2].png);
  if (!identical(d128)) problems.push(`${theme} present control: the golden at phase p and p+128 differs (${d128.off} px), so the 128 px period is wrong`);
  if (meetsRule(d1)) problems.push(`${theme} present control: the golden at phase p and p+1 meets the rule (${d1.off} px), so the phase check is blind`);
  for (const s of shots) await s.ctx.close();
  return { problems, d128: d128.off, d1: d1.off };
}

/** Test fixtures for D-HT3-sections: a tall section below the golden block, optionally carrying a CSS leak into it. */
export const fixtureSection = id => {   // runs in the app page (ht3Fidelity's `mutate`)
  const sheet = document.querySelector('dialog.sheet.ht .ht-golden').parentElement;
  const s = document.createElement('section'); s.dataset.section = 'ht3-fixture'; s.style.height = '900px';
  sheet.append(s);
  return id;
};
export const fixtureLeakSection = id => {
  const sheet = document.querySelector('dialog.sheet.ht .ht-golden').parentElement;
  const s = document.createElement('section'); s.dataset.section = 'ht3-leak'; s.style.height = '900px';
  const st = document.createElement('style'); st.textContent = '.ht p { word-spacing: 1px; }';
  s.append(st); sheet.append(s);
  return id;
};

/**
 * D-HT3-sections guards (supervisor ruling on PR #106), each run in gate block HT-3:
 *  1. with a tall section registered, the captures still run (sections hidden, the sheet fits) and every section is
 *     displayed again after each capture (a missed restore is a problem inside ht3Fidelity);
 *  2. a section whose CSS leaks into the golden block (`.ht p { word-spacing: 1px }`) must still fail L2b while the
 *     sections are hidden, so hiding never masks a leak;
 *  3. one S0 capture with the sections visible, on the normal 390 x 844 path: the sheet scrolls, the region is scrolled
 *     into view below the sticky header, and L3 must pass.
 * Returns { problems }.
 */
export async function ht3SectionGuards(browser, port, { fixture = fixtureSection, overlap = false } = {}) {
  const problems = [], lr = [HT_PLATES[0]];
  const one = { themes: ['silent-black'], full: [], plates: lr, widths: [] };
  const a = await ht3Fidelity(browser, port, { ...one, mutate: fixture });
  for (const p of a.problems) problems.push(`sections guard 1 (tall section registered): ${p}`);
  if (a.stats.pairs < 4) problems.push(`sections guard 1: only ${a.stats.pairs} pairs compared with a section registered`);
  const b = await ht3Fidelity(browser, port, { ...one, mutate: fixtureLeakSection });
  if (!b.problems.some(p => /L2b .*word-spacing/.test(p))) problems.push('sections guard 2: a section CSS leak into the golden block (.ht p word-spacing) was not caught by L2b while the sections were hidden');
  // 4: the sheet-wide section bleed: the fixture section is exactly golden B's section width at 390, 360 and 340
  for (const w of [390, 360, 340]) {
    const app = await openAppTrain(browser, port, 'silent-black', { viewport: { width: w, height: 844 } });
    const gold = await openGolden(browser, 'silent-black', { viewport: { width: w, height: 844 } });
    try {
      await openHowTo(app.page, 0);
      await app.page.evaluate(fixture, HT_PLATES[0][0]);
      const n = await app.page.evaluate(sel => document.querySelectorAll(sel).length, SECTION_SEL);
      if (!n) problems.push(`sections guard 4 @${w}: no section registered to measure`);
      for (const b of await sectionWidthProblems(app.page, gold.page, HT_PLATES[0][0])) problems.push(`sections guard 4 @${w}: ${b}`);
    } catch (e) { problems.push(`sections guard 4 @${w}: ${e.message.split('\n')[0]}`); }
    finally { await app.ctx.close(); await gold.ctx.close(); }
  }
  // 3: S0 with the sections visible, at 390 x 844, scrolled as the app scrolls
  const [id] = HT_PLATES[0];
  const app = await openAppTrain(browser, port, 'silent-black', { onError: m => problems.push(`sections guard 3: app page error: ${m}`) });
  const gold = await openGolden(browser, 'silent-black');
  try {
    await openHowTo(app.page, 0);
    await app.page.evaluate(fixture, id);
    if (overlap) await app.page.evaluate(() => { document.querySelector('[data-section="ht3-fixture"]').style.cssText += ';margin-top:-40px;position:relative;background:red'; });
    await settleApp(app.page);
    const ra = await region(app.page, G.app(id), 'app');   // scrolls the panel so the region sits below the sticky header
    const scrolled = await app.page.evaluate(() => { const p = document.querySelector('dialog.sheet.ht .sheet-panel'); return { scrolls: p.scrollHeight > p.clientHeight, shown: [...document.querySelectorAll('dialog.sheet.ht [data-section]')].filter(e => getComputedStyle(e).display !== 'none').length }; });
    if (!scrolled.scrolls || !scrolled.shown) problems.push(`sections guard 3: the sheet does not scroll with a visible section (${JSON.stringify(scrolled)})`);
    const own = await ownLayers(app.page, 'app', id, true, true);
    const at = await appOffset(app.page);
    own.push(...await presentGolden(gold.page, id, at));
    for (const o of own) problems.push(`sections guard 3: ${o}`);
    const rg = await region(gold.page, G.golden(id), 'golden');
    const r2 = await region(app.page, G.app(id), 'app');
    const d = await diffPng(gold.page, await capture(app.page, r2), await capture(gold.page, rg));
    if (!meetsRule(d)) problems.push(`sections guard 3: S0 with sections visible differs: ${d.off} px off (max ${d.maxDelta}/255)`);
    if (ra.y !== r2.y) problems.push('sections guard 3: the region moved between placement and capture');
  } catch (e) { problems.push(`sections guard 3: ${e.message.split('\n')[0]}`); }
  finally { await app.ctx.close(); await gold.ctx.close(); }
  return { problems };
}

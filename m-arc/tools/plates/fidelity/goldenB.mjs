// HT-4 (HT4-A6, critic fix 20): the golden-B page state driver. Layer cards (HT-5..HT-9) call this instead of
// writing their own Playwright; it never touches app code, only the built golden-B page (a Playwright reference for
// "does the app's rendering of this state match golden B", never the app itself).
//
// Refactored from the vendored, already-proven `tools/plates/layers/artifact/shoot2.mjs` (the S-2 state check) into
// reusable functions. A selector that matches nothing throws, naming the state - it never returns an empty capture
// (a card comparing an empty capture against another empty capture would read "0 px difference" for the wrong
// reason, the exact bug a fresh reviewer caught in V1-08, see builder gotchas).
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { buildLayerPage, cleanupMirror, makeMirror, sha256 } from '../layers.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..', '..');
const require = createRequire(join(ROOT, 'package.json'));

/** Same resolution as scripts/screenshot-gate.mjs's own browser launch: MARC_CHROMIUM if set, else Playwright's own
 *  bundled browser. Never a hardcoded sandbox-only path (bug found via CI: CI runners don't have /opt/pw-browsers). */
export const CHROME_PATH = process.env.MARC_CHROMIUM;
export const IDS = ['lateral-raise', 'barbell-back-squat', 'pull-up', 'hanging-leg-raise', 'lat-pulldown', 'seated-cable-row', 'leg-press', 'machine-chest-press'];
export const THEMES = ['silent-black', 'paper', 'midnight', 'ember', 'emerald'];
/** Joint red-flag blocks each card must show (golden-B review 2026-09-30). */
export const FLAGS = {
  'lateral-raise': ['wrist', 'shoulder'], 'barbell-back-squat': ['wrist', 'knee'], 'pull-up': ['wrist', 'shoulder', 'elbow'],
  'hanging-leg-raise': ['wrist'], 'lat-pulldown': ['wrist', 'shoulder'], 'seated-cable-row': ['wrist', 'shoulder'],
  'leg-press': ['wrist', 'knee'], 'machine-chest-press': ['wrist', 'elbow'],
};

const WOFF2 = () => readFileSync(join(ROOT, 'tools/plates/layers/engine/inter-latin-wght-normal.woff2'));

/** Builds the golden-B page fresh (from the vendored, hash-locked layers) into a scratch dir; returns its path. */
export async function buildScratchPage() {
  const mirror = makeMirror();
  const html = await buildLayerPage(mirror);
  cleanupMirror(mirror);
  const dir = mkdtempSync(join(tmpdir(), 'ht4-goldenb-page-'));
  const wrap = join(dir, 'page.html');
  writeFileSync(wrap, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body>${html.toString('utf8')}</body></html>`);
  return { dir, file: wrap };
}
export function cleanupScratchPage(dir) { rmSync(dir, { recursive: true, force: true }); }

/**
 * Opens the golden-B page in a fresh context at the app's phone viewport, on the given theme.
 * `reduce`: `data-motion="reduce"` (reduced motion). Returns { browser, ctx, page, errs }; caller closes `browser`.
 */
export async function openPage(pageFile, theme, { reduce = false, chromePath = CHROME_PATH } = {}) {
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ ...(chromePath ? { executablePath: chromePath } : {}) });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  const woff2 = WOFF2();
  await ctx.route('**/*', r => {
    const u = r.request().url();
    if (u.startsWith('https://fonts.googleapis.com/')) return r.fulfill({ status: 200, contentType: 'text/css', body: "@font-face{font-family:'Inter';font-weight:100 900;font-display:block;src:url(https://fonts.gstatic.com/local/inter.woff2) format('woff2')}" });
    if (u === 'https://fonts.gstatic.com/local/inter.woff2') return r.fulfill({ status: 200, contentType: 'font/woff2', body: woff2 });
    return u.startsWith('file:') ? r.continue() : r.abort();
  });
  const page = await ctx.newPage(), errs = [];
  page.on('pageerror', e => errs.push(String(e)));
  page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await page.goto(pathToFileURL(pageFile).href, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  if (theme) await page.evaluate(t => document.querySelector(`#theme-${t}`).click(), theme);
  return { browser, ctx, page, errs };
}

const clickSel = (page, sel) => page.evaluate(s => {
  const e = document.querySelector(s);
  if (!e) throw new Error(`selector matches nothing: ${s}`);
  e.click();
}, sel);

/** Fonts settled, animations quiet (or timed out at 2s - the shimmer only ever runs 2 passes, C12). */
const settle = page => page.evaluate(() => new Promise(r => {
  const t0 = performance.now();
  const f = () => (!document.getAnimations().some(a => a.playState === 'running') || performance.now() - t0 > 2000) ? r() : requestAnimationFrame(f);
  f();
}));

/**
 * Captures one named state: asserts the selector matches something visible, non-empty, inside the 390 px sheet,
 * then screenshots it. Throws, naming `state`, on a selector match failure - never returns an empty buffer.
 * `sel` may be a list of selectors (HT-4b: the risks section plus the disclaimer after it); every one must pass the
 * same checks, and the capture is the page area that spans all of them.
 */
export async function capture(page, sel, state) {
  const sels = Array.isArray(sel) ? sel : [sel];
  if (sels.length === 0) throw new Error(`${state}: no selector`);
  const problem = await page.evaluate(([sels, state]) => {
    for (const sel of sels) {
      const e = document.querySelector(sel);
      if (!e) return `${state}: selector matches nothing (${sel})`;
      const r = e.getBoundingClientRect(), cs = getComputedStyle(e);
      if (!r.width || !r.height || cs.display === 'none' || cs.visibility === 'hidden') return `${state}: not visible (${sel})`;
      if (r.left < -0.5 || r.right > innerWidth + 0.5) return `${state}: outside the 390px sheet (${sel})`;
    }
    return null;
  }, [sels, state]);
  if (problem) throw new Error(problem);
  const el = page.locator(sels[0]).first();
  await el.scrollIntoViewIfNeeded();
  await settle(page);
  if (sels.length === 1) return el.screenshot({ animations: 'allow' });
  const clip = await page.evaluate(sels => {
    const rs = sels.map(s => document.querySelector(s).getBoundingClientRect());
    const x = Math.min(...rs.map(r => r.left)), y = Math.min(...rs.map(r => r.top));
    const w = Math.max(...rs.map(r => r.right)) - x, h = Math.max(...rs.map(r => r.bottom)) - y;
    return { x: x + scrollX, y: y + scrollY, width: w, height: h };
  }, sels);
  return page.screenshot({ clip, fullPage: true, animations: 'allow' });
}

/** S2: opens the hand or a posture zoom by its chip key. */
export async function openZoom(page, id, key) {
  await clickSel(page, `#card-${id} .zx-chip[data-zoom="${key}"]`);
  await settle(page);
}
export async function closeZoom(page, id, key) {
  await clickSel(page, `#${id}-zoom-${key}-close`);
  await settle(page);
}
/** Handling-mistake row (the Mistake pill on the plate). */
export async function openMistake(page, id) { await clickSel(page, `#${id}-mistake`); await settle(page); }
/** Feel map at rest, playing (a frame mid-sweep), each row open. */
export async function playFeel(page, id) {
  await page.evaluate(sel => document.querySelector(sel).scrollIntoView({ block: 'center' }), `#card-${id} [data-feel-map]`);
  await page.waitForTimeout(700);
  await clickSel(page, `#card-${id} [data-feel-map]`);
  await page.waitForTimeout(1400);
}
/**
 * Opens one feel row. Compact-copy update (b3a90af): every feel row now shows (the visible count equals
 * FEEL_ROWS_MAX), so no ".fr-more" button exists on any of the 8 sheets - asserted here rather than silently
 * skipped, so a future content change that brings the button back is caught, not quietly worked around.
 */
export async function openFeelRow(page, id, row) {
  const more = await page.$(`#card-${id} .fr-more`);
  if (more) throw new Error(`${id}: ".fr-more" exists - every feel row should already show (compact-copy update)`);
  await clickSel(page, `#${id}-row-${row}`);
  await page.waitForTimeout(40);
}
/**
 * Asserts every setup step already shows. Compact-copy update (b3a90af): the visible count equals SETUP_MAX_STEPS,
 * so no ".st-more" button exists - the collapse code stays for a longer list, which the lint now forbids.
 */
export async function assertAllSetupStepsShown(page, id) {
  const more = await page.$(`#card-${id} .st-more`);
  if (more) throw new Error(`${id}: ".st-more" exists - every setup step should already show (compact-copy update)`);
  const hidden = await page.evaluate(c => document.querySelectorAll(`${c} .st-list li[hidden]`).length, `#card-${id}`);
  if (hidden) throw new Error(`${id}: ${hidden} setup step(s) still hidden`);
}

const setReduced = (page, on) => page.evaluate(v => { document.documentElement.dataset.motion = v ? 'reduce' : ''; }, on);

/**
 * Plays the feel-map shimmer for real (clearing reduced motion first, since feelmap.mjs's own click handler is a
 * no-op under reduced motion), then pauses its animation at a fixed `currentTime` so the capture is deterministic
 * regardless of wall-clock timing (finding 3, review PR #107: the shimmer's own ~5.5 s run time is a timing
 * question for the gate's animation probes, not this state). Restores reduced motion on `close`.
 */
export async function playFeelPaused(page, id, atMs = 1200) {
  await setReduced(page, false);
  const sel = `#card-${id} [data-feel-map]`;
  await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center' }), sel);
  await page.waitForTimeout(400);
  await clickSel(page, sel);
  const ok = await page.evaluate(([sel, atMs]) => {
    const bands = [...document.querySelectorAll(`${sel} .feel-band`)];
    if (!bands.length) return false;
    let paused = 0;
    for (const band of bands) for (const a of band.getAnimations()) { a.pause(); a.currentTime = atMs; paused++; }
    return paused > 0;
  }, [sel, atMs]);
  if (!ok) throw new Error(`${id}: feel-band animation not found to pause deterministically`);
}
export async function closeFeelPaused(page, id) {
  await setReduced(page, true);
  await page.evaluate(sel => { const m = document.querySelector(sel); m.classList.remove('is-playing'); }, `#card-${id} [data-feel-map]`);
}

/**
 * Under reduced motion (the default state, C11), attempting to play must draw no band at all: feelmap.mjs's own
 * click handler is a no-op under `reduce()`. Throws if a band is visible after trying.
 */
export async function assertReducedMotionNoShimmer(page, id) {
  await setReduced(page, true);
  const sel = `#card-${id} [data-feel-map]`;
  await clickSel(page, sel);
  const shown = await page.evaluate(s => {
    const band = document.querySelector(`${s} .feel-band`);
    return !!band && getComputedStyle(band).display !== 'none';
  }, sel);
  if (shown) throw new Error(`${id}: a feel-band is visible under reduced motion (C11)`);
}

/**
 * Every state the layer cards compare, for one exercise: hand zoom per key, posture zoom per chip, handling
 * mistake, feel map (rest, playing at a fixed frame, each row open), setup (every step already shown), risks with the
 * owner's disclaimer after it (HT-4b: no sources states since LR-23). `group`+`isBaseline` mark states sharing a
 * selector with a rest state, so selfCheck can assert the open state's capture actually differs from rest (finding 3:
 * a state that never opens anything captures the same pixels as rest and would otherwise pass unnoticed). Returns [{ name, selector, ... }].
 */
export async function statesFor(page, id) {
  const card = `#card-${id}`;
  const zoomKeys = await page.evaluate(c => [...document.querySelectorAll(`${c} .zx-chip[data-zoom]`)].map(b => b.dataset.zoom), card);
  const rows = await page.evaluate(c => [...document.querySelectorAll(`${c} .fr`)].map(r => r.dataset.row), card);
  const states = [
    { name: `${id}: chips`, selector: `${card} .zx-chips-wrap` },
    { name: `${id}: grip`, selector: `${card} .grip` },
    { name: `${id}: plate at rest`, selector: `#${id}-plate`, group: 'plate', isBaseline: true },
    { name: `${id}: plate mistake`, selector: `#${id}-plate`, group: 'plate', open: () => openMistake(page, id), close: () => clickSel(page, `#${id}-mistake`) },
    { name: `${id}: feel at rest`, selector: `${card} .feel`, group: 'feel', isBaseline: true },
    { name: `${id}: feel playing (paused mid-sweep)`, selector: `${card} .feel`, group: 'feel', open: () => playFeelPaused(page, id), close: () => closeFeelPaused(page, id) },
    { name: `${id}: setup (every step shown)`, selector: `${card} .setup`, open: () => assertAllSetupStepsShown(page, id) },
    { name: `${id}: risks`, selector: [`${card} .risks`, `${card} .ht-disclaimer`] },
  ];
  for (const z of zoomKeys) states.push({ name: `${id}: zoom ${z}`, selector: `#${id}-zoom-${z}`, open: () => openZoom(page, id, z), close: () => closeZoom(page, id, z) });
  for (const r of rows) states.push({ name: `${id}: feel row ${r}`, selector: `${card} .feel`, group: 'feel', open: () => openFeelRow(page, id, r) });
  return states;
}

/**
 * Self-check (HT4-A6): captures every state of `id` twice back to back and asserts 0 px difference between the two
 * captures (proves `capture` is deterministic and never silently returns an empty/blank buffer for two different
 * states), and - for every non-baseline state sharing a `group` with a baseline (plate/feel) - asserts its
 * capture actually differs from that group's rest capture (proves the state really opened something; a state that
 * silently no-ops would otherwise pass the 0 px self-check for the wrong reason, the V1-08 bug in builder gotchas).
 * Runs under reduced motion by default (deterministic); `playFeelPaused`/`assertReducedMotionNoShimmer` manage their
 * own motion setting. Also asserts C11 holds (a shimmer attempt under reduced motion draws nothing).
 * Returns the list of problem strings (empty = clean).
 */
export async function selfCheck(page, id) {
  await setReduced(page, true);
  const bad = [];
  const states = await statesFor(page, id);
  const baselineCaptures = {};
  for (const s of states) {
    if (s.open) await s.open();
    const a = await capture(page, s.selector, s.name);
    const b = await capture(page, s.selector, s.name);
    if (!a.equals(b)) bad.push(`${s.name}: two back-to-back captures differ (not deterministic)`);
    if (s.group) {
      if (s.isBaseline) baselineCaptures[s.group] = a;
      else if (baselineCaptures[s.group] && a.equals(baselineCaptures[s.group])) bad.push(`${s.name}: capture is identical to "${s.group}" at rest (the state did not really open)`);
    }
    if (s.close) await s.close();
  }
  try { await assertReducedMotionNoShimmer(page, id); } catch (e) { bad.push(e.message); }
  return bad;
}

// ---------------------------------------------------------------------------------------------
// HT4-A5 (review fix, blocker 1): golden B's crop specs never freely vary `poses` - every crop's poses.start/end
// either deep-equals one of golden-A's own three reference poses (start, end, end merged with mistake.pose) or is
// one of a short, explicit, owner-approved exception, pinned by literal deep-equal. Never a blanket "poses can
// vary" allowance (the flaw a fresh reviewer found in the first cut of this file, PR #107).
//
// Derived empirically from a real `node artifact/build-page.mjs` run (module-hook shim on engine/plate.mjs,
// tests/howto/goldenB-derivation.test.ts's captureRenderPlateCalls, moved here so both the fast unit test and the
// HT-4 gate block reuse the same capture code): of 48 total renderPlate calls, 11 use a poses.start/end that is not
// one of golden-A's three reference poses. 2 are Right crops (howto/render-*.mjs's cropSpec builds `z.right` from a
// {base, pose} merge-override, not a bare pose name) - both shoulder-position corrections the owner approved as
// design (PR #107 supervisor ruling). The other 9 are Wrong crops with `z.wrong.solid` set, where cropSpec draws
// the wrong form directly in poses.start/end (not via the separate `mistake` sub-pose field) - a legitimate design
// choice, not drift, and still pinned literally so a future unrelated one is caught.
//
// Round-2 review fix (blocker 2): the 24 calls that carry a `spec.mistake.pose` (every non-solid Wrong crop's own
// sub-pose) were not classified at all - `mistake` sat in the blanket CROP_WINDOW_FIELDS allowance, so a moved
// joint there passed silently. 21 of the 24 deep-equal golden-A's own mistake pose (either its literal, unmerged
// `mistake.pose`, for the untouched base '-n'/'-m' calls, or that same delta merged with `poses.end`, the form
// howto/render-*.mjs's own `poseOf` resolves a `{base, pose}` ref to before assigning it). The other 3 -
// `pull_up|top-wrong`, `lat_pulldown|pad-wrong`, `seated_cable_row|back-wrong` - each draw a crop-specific mistake
// distinct from the plate's own general mistake pose, a legitimate design choice, still pinned literally: see
// `ENUMERATED_MISTAKE_POSES` below (a separate table from this one - round-3 fix, see its own doc comment for why).
export const ENUMERATED_POSES = {
  "barbell_back_squat|bar-on-back-w": {"root":{"at":[0,0.918,0.022575272439632726],"tilt":8},"trunk":0,"neck":0,"plant":{"l":{"at":[0.19,0,0],"toe":[0.3420201433256687,0,0.9396926207859084],"pole":[0.24192189559966773,0,0.9702957262759965]},"r":{"at":[-0.19,0,0],"toe":[-0.3420201433256687,0,0.9396926207859084],"pole":[-0.24192189559966773,0,0.9702957262759965]}},"reach":{"l":{"at":[0.36,1.531676188242726,0.02],"pole":[0.45,-0.75,-0.6]},"r":{"at":[-0.36,1.531676188242726,0.02],"pole":[-0.45,-0.75,-0.6]}}},
  "barbell_back_squat|depth-w": {"root":{"at":[0,0.62,-0.2171966658748457],"tilt":28},"trunk":7,"neck":-7,"plant":{"l":{"at":[0.19,0,0],"toe":[0.3420201433256687,0,0.9396926207859084]},"r":{"at":[-0.19,0,0],"toe":[-0.3420201433256687,0,0.9396926207859084]}},"reach":{"l":{"at":[0.36,1.1397036108416705,0],"pole":[0.35,-1,0]},"r":{"at":[-0.36,1.1397036108416705,0],"pole":[-0.35,-1,0]}}},
  "pull_up|shoulders-right": {"root":{"at":[0,1.147,-0.02],"tilt":0},"trunk":0,"neck":0,"scap":{"elev":-3,"pro":-1},"hip":4,"knee":6,"ankle":-22,"reach":{"l":{"at":[0.31,2.25,0],"pole":[0.5,0,0.3]},"r":{"at":[-0.31,2.25,0],"pole":[-0.5,0,0.3]}}},
  "pull_up|shoulders-wrong": {"root":{"at":[0,1.047,-0.02],"tilt":0},"trunk":0,"neck":10,"scap":{"elev":8,"pro":1},"hip":4,"knee":6,"ankle":-22,"reach":{"l":{"at":[0.31,2.25,0],"pole":[0.5,0,0.3]},"r":{"at":[-0.31,2.25,0],"pole":[-0.5,0,0.3]}}},
  "hanging_leg_raise|pelvis-wrong": {"trunk":-10,"neck":5,"hip":102,"knee":5,"ankle":-25,"root":{"at":[0,1.1102,-0.1457],"tilt":12},"reach":{"l":{"at":[0.24,2.25,0],"pole":[0.5,0,-1]},"r":{"at":[-0.24,2.25,0],"pole":[-0.5,0,-1]}}},
  "hanging_leg_raise|shoulders-right": {"trunk":0,"neck":0,"hip":0,"knee":0,"ankle":-25,"root":{"at":[0,1.1411,0.0033],"tilt":0},"reach":{"l":{"at":[0.24,2.25,0],"pole":[0.5,0,-1]},"r":{"at":[-0.24,2.25,0],"pole":[-0.5,0,-1]}},"scap":{"elev":-3,"pro":-1}},
  "hanging_leg_raise|shoulders-wrong": {"trunk":0,"neck":10,"hip":0,"knee":0,"ankle":-25,"root":{"at":[0,1.031,-0.005],"tilt":0},"reach":{"l":{"at":[0.24,2.25,0],"pole":[0.5,0,-1]},"r":{"at":[-0.24,2.25,0],"pole":[-0.5,0,-1]}},"scap":{"elev":8,"pro":1}},
  "lat_pulldown|path-wrong": {"root":{"at":[0,0.5077264828473386,0.04999126630958272],"tilt":4},"trunk":4,"neck":32,"scap":{"elev":1,"pro":-1},"plant":{"l":{"at":[0.1,0,0.5]},"r":{"at":[-0.1,0,0.5]}},"reach":{"l":{"at":[0.34,1.0916185876939761,0.033042747581876614],"pole":[0.6,-1,-0.1]},"r":{"at":[-0.34,1.0916185876939761,0.033042747581876614],"pole":[-0.6,-1,-0.1]}}},
  "seated_cable_row|finish-wrong": {"root":{"at":[0,0.5410000000000001,-0.0002499999999999933],"tilt":0},"trunk":0,"neck":0,"scap":{"elev":3,"pro":0},"plant":{"l":{"at":[0.1,0.46,0.925],"normal":[0,0.3420201433256687,-0.9396926207859084],"toe":[0,1,0]},"r":{"at":[-0.1,0.46,0.925],"normal":[0,0.3420201433256687,-0.9396926207859084],"toe":[0,1,0]}},"reach":{"l":{"at":[0.075,0.905,0.21],"pole":[0.35,0.45,-1]},"r":{"at":[-0.075,0.905,0.21],"pole":[-0.35,0.45,-1]}}},
  "leg_press|foot-w": {"root":{"at":[0,0.5,0],"tilt":-60},"trunk":0,"neck":5,"reach":{"l":{"at":[0.25,0.53,0.1],"pole":[1,0.25,0]},"r":{"at":[-0.25,0.53,0.1],"pole":[-1,0.25,0]}},"plant":{"l":{"at":[0.17,0.9512141873993747,0.4955921852195438],"normal":[0,-0.24192189559966773,-0.9702957262759965],"toe":[0.25881904510252074,0.9372337011478935,-0.23367860690452677],"ref":"ball"},"r":{"at":[-0.17,0.9512141873993747,0.4955921852195438],"normal":[0,-0.24192189559966773,-0.9702957262759965],"toe":[-0.25881904510252074,0.9372337011478935,-0.23367860690452677],"ref":"ball"}}},
  "machine_chest_press|seat-height-w": {"root":{"at":[0,0.434466781271559,0.03565234545147697],"tilt":-5},"trunk":0,"neck":0,"scap":{"elev":-0.5,"pro":-2},"plant":{"l":{"at":[0.1,0,0.47]},"r":{"at":[-0.1,0,0.47]}},"reach":{"r":{"at":[-0.28,0.89,0.2],"pole":[-0.9,-0.1,-0.3]},"l":{"at":[0.28,0.89,0.2],"pole":[0.9,-0.1,-0.3]}}},
};

/**
 * Round-3 review fix (blocker 1): moved out of `ENUMERATED_POSES` into its own table. The two tables share the
 * "exId|optsId" key format, but not the same key SPACE - a non-solid Wrong crop's `poses.start`/`.end` (an ordinary
 * golden-A match, checked by `classifyPose`) and its own `spec.mistake.pose` (the crop-specific mistake, checked by
 * `classifyMistakePose`) are two different poses for the same crop key. Sharing one table let `classifyPose`
 * wrongly compare an unrelated `poses.start` value against the mistake pin under the same key and reject it (found
 * empirically: re-running validateCalls against the real 48 calls after the round-3 priority fix immediately
 * flagged all 3 of these keys' ordinary poses.start/end as "enumerated exception" mismatches - they were never
 * meant to be checked against this table at all).
 */
export const ENUMERATED_MISTAKE_POSES = {
  "pull_up|top-wrong": {"root":{"at":[0,1.635,-0.03],"tilt":-2},"trunk":-4,"neck":-20,"scap":{"elev":3,"pro":7},"hip":16,"knee":10,"ankle":-22,"reach":{"l":{"at":[0.31,2.25,0],"pole":[0.3,-1,0]},"r":{"at":[-0.31,2.25,0],"pole":[-0.3,-1,0]}}},
  "lat_pulldown|pad-wrong": {"root":{"at":[0,0.5772146132970393,0.027283355026593428],"tilt":-10},"trunk":-3,"neck":-6,"scap":{"elev":-2,"pro":-3},"plant":{"l":{"at":[0.1,0,0.5]},"r":{"at":[-0.1,0,0.5]}},"reach":{"l":{"at":[0.34,0.9623637128446966,0.07447552165860852],"pole":[0.2,-1,-0.45]},"r":{"at":[-0.34,0.9623637128446966,0.07447552165860852],"pole":[-0.2,-1,-0.45]}}},
  "seated_cable_row|back-wrong": {"root":{"at":[0,0.5462032174224859,-0.013340524179922257],"tilt":-8},"trunk":44,"neck":-10,"scap":{"elev":0,"pro":6},"plant":{"l":{"at":[0.1,0.46,0.925],"normal":[0,0.3420201433256687,-0.9396926207859084],"toe":[0,1,0]},"r":{"at":[-0.1,0.46,0.925],"normal":[0,0.3420201433256687,-0.9396926207859084],"toe":[0,1,0]}},"reach":{"l":{"at":[0.075,0.665,0.8],"pole":[0.25,-1,0]},"r":{"at":[-0.075,0.665,0.8],"pole":[-0.25,-1,0]}}},
};

const deepEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const mergeDeep = (a, b) => {
  if (b === undefined) return a;
  if (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
    const o = { ...a };
    for (const k of Object.keys(b)) o[k] = mergeDeep(a[k], b[k]);
    return o;
  }
  return b;
};

/**
 * Classifies one crop pose (a `spec.poses.start` or `spec.poses.end` value) against golden-A's own reference poses
 * for that exercise (`poses.start`, `poses.end`, `poses.end` merged with `mistake.pose` - the same mergeDeep
 * howto/render-*.mjs itself uses to build a crop's wrong pose). Returns 'golden' or 'enumerated', or a drift-problem
 * string naming the (exercise, crop) pair - never widened to a blanket allowance.
 *
 * Round-3 review fix (blocker 1): a key present in `ENUMERATED_POSES` is checked against its own pin FIRST and
 * ONLY - it never falls back to the golden-A check. The earlier order (golden-A first, enumeration as a fallback)
 * let an enumerated Wrong crop be silently redrawn as the correct golden-A form (or an enumerated Right crop
 * flattened back to a bare golden-A pose name) and still pass, since the redrawn pose then matched golden-A
 * directly - the enumerated pin was never actually exercised. A key NOT in the table still checks the golden-A
 * refs, exactly as before.
 */
export function classifyPose(exId, optsId, pose, goldenA) {
  const key = `${exId}|${optsId}`;
  if (Object.prototype.hasOwnProperty.call(ENUMERATED_POSES, key)) {
    return deepEqual(pose, ENUMERATED_POSES[key]) ? 'enumerated' : `${key}: pose differs from its pinned enumerated exception (${JSON.stringify(pose).slice(0, 200)})`;
  }
  const refs = [goldenA.poses?.start, goldenA.poses?.end];
  if (goldenA.mistake?.pose) refs.push(mergeDeep(goldenA.poses?.end, goldenA.mistake.pose));
  if (refs.some(r => r !== undefined && deepEqual(pose, r))) return 'golden';
  return `${key}: pose matches neither a golden-A reference pose nor its enumerated exception (${JSON.stringify(pose).slice(0, 200)})`;
}

/**
 * Classifies one crop's `spec.mistake.pose` (round-2 review fix, blocker 2; round-3 fix, blocker 1 - same enumerated-
 * first priority as `classifyPose` above, same reasoning, against its own `ENUMERATED_MISTAKE_POSES` table - not
 * `ENUMERATED_POSES`, which pins a different pose under the same crop key). Golden-A's own `mistake.pose` is
 * authored as a partial delta - the untouched base '-n'/'-m' calls carry it exactly as written, but a crop that
 * draws that same mistake through `howto/render-*.mjs`'s `poseOf` gets it pre-merged with `poses.end` before
 * assignment - so both the unmerged and the merged form of golden-A's own mistake pose are 'golden', not just one,
 * for a key NOT enumerated. Returns 'golden' or 'enumerated', or a drift-problem string - never a blanket allowance.
 */
export function classifyMistakePose(exId, optsId, pose, goldenA) {
  const key = `${exId}|${optsId}`;
  if (Object.prototype.hasOwnProperty.call(ENUMERATED_MISTAKE_POSES, key)) {
    return deepEqual(pose, ENUMERATED_MISTAKE_POSES[key]) ? 'enumerated' : `${key}: mistake pose differs from its pinned enumerated exception (${JSON.stringify(pose).slice(0, 200)})`;
  }
  const refs = [];
  if (goldenA.mistake?.pose) refs.push(goldenA.mistake.pose, mergeDeep(goldenA.poses?.end, goldenA.mistake.pose));
  if (refs.some(r => deepEqual(pose, r))) return 'golden';
  return `${key}: mistake pose matches neither golden-A's own mistake pose nor its enumerated exception (${JSON.stringify(pose).slice(0, 200)})`;
}

/**
 * Every captured renderPlate call's `spec.poses.start`/`spec.poses.end` and `spec.mistake.pose` (when the call
 * carries them at all - the base '-n'/'-m' calls reuse golden-A's own values untouched, and classify as 'golden'
 * trivially by the same checks) must classify as 'golden' or 'enumerated'. Returns the problems (empty = clean).
 */
export function validateCalls(calls, goldenASpecs) {
  const bad = [];
  for (const c of calls) {
    const exId = c.spec.id;
    const goldenA = goldenASpecs[exId];
    if (!goldenA) { bad.push(`call with unknown spec.id "${exId}"`); continue; }
    const optsId = c.opts?.id ?? '';
    const poses = c.spec.poses;
    if (poses) {
      for (const which of ['start', 'end']) {
        if (!(which in poses)) continue;
        const verdict = classifyPose(exId, optsId, poses[which], goldenA);
        if (verdict !== 'golden' && verdict !== 'enumerated') bad.push(verdict);
      }
    }
    if (c.spec.mistake?.pose) {
      const verdict = classifyMistakePose(exId, optsId, c.spec.mistake.pose, goldenA);
      if (verdict !== 'golden' && verdict !== 'enumerated') bad.push(verdict);
    }
  }
  return bad;
}

/**
 * Shims `engine/plate.mjs` in a mirror to record every real renderPlate call (spec + opts, functions stripped),
 * then runs `node artifact/build-page.mjs` for real. Moved here (from tests/howto/goldenB-derivation.test.ts, HT-4
 * review finding, blocker 4) so the ~8-14s live build is spawned once, reused by both a slow/gate-only proof and
 * `tools/screenshot-gate.mjs`'s HT-4 block - never by the fast `npm test` path.
 */
export async function captureRenderPlateCalls(mirror) {
  const real = join(mirror, 'engine', 'plate.real.mjs');
  renameSync(join(mirror, 'engine', 'plate.mjs'), real);
  const shim = `export * from './plate.real.mjs';
import { renderPlate as __real } from './plate.real.mjs';
import { writeFileSync } from 'node:fs';
globalThis.__RP_CALLS = [];
export function renderPlate(spec, opts) {
  globalThis.__RP_CALLS.push({ opts: opts ? { ...opts } : opts, spec: JSON.parse(JSON.stringify(spec, (k, v) => typeof v === 'function' ? undefined : v)) });
  return __real(spec, opts);
}
process.on('exit', () => writeFileSync(new URL('../rp-calls.json', import.meta.url), JSON.stringify(globalThis.__RP_CALLS)));
`;
  writeFileSync(join(mirror, 'engine', 'plate.mjs'), shim);
  await new Promise((resolve, reject) => {
    const c = spawn(process.execPath, ['build-page.mjs'], { cwd: join(mirror, 'artifact'), stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    c.stderr.on('data', d => { err += d; });
    c.on('error', reject);
    c.on('close', code => (code === 0 ? resolve() : reject(new Error(`build-page.mjs exited ${code}: ${err.slice(0, 2000)}`))));
  });
  return JSON.parse(readFileSync(join(mirror, 'rp-calls.json'), 'utf8'));
}

export const GOLDEN_JSON = join(ROOT, 'tests/howto/golden/GOLDEN.json');
export const VENDOR = join(ROOT, 'tools/plates/vendor');

/**
 * Golden-A's own default export for each of the 7 non-ref-src exercises, from a proper vendor mirror (font
 * present). Fast (no Playwright, no build-page.mjs spawn - just importing 7 small exercise modules), so both the
 * fast unit test and the HT-4 gate block use it directly.
 */
export async function loadGoldenASpecs() {
  const golden = JSON.parse(readFileSync(GOLDEN_JSON, 'utf8'));
  const plateEntries = golden.entries.filter(e => e.kind === 'plate');
  const g = await import(pathToFileURL(join(VENDOR, '..', 'golden.mjs')).href);
  const vendorMirror = g.makeMirror();
  try {
    const out = {};
    for (const p of plateEntries) {
      if (p.src === 'ref-src') continue;
      const mod = await import(pathToFileURL(join(vendorMirror, p.src)).href);
      out[p.slug.replace(/-/g, '_')] = JSON.parse(JSON.stringify(mod.default, (k, v) => (typeof v === 'function' ? undefined : v)));
    }
    return out;
  } finally {
    rmSync(vendorMirror, { recursive: true, force: true });
  }
}

/**
 * The only fields a crop-time renderPlate call may legitimately change from golden-A: camera framing (`camera`,
 * `seatDrop`, `datum`, `viewLabel`), what that framing repositions or hides (`equipment`, `ghosts`, `startParts`,
 * `marks`), and pure labels (`id`, `name`, `view`, `facing`). `poses` and `mistake.pose` are checked separately
 * (classifyPose/classifyMistakePose/validateCalls above) - `mistake` is NOT in this blanket allowance (round-2
 * review fix, blocker 2: it was, so a moved joint inside `mistake.pose` passed silently). `mistake`'s own non-pose
 * keys (`parts`, `guides`, `tells` - which parts a crop highlights, its overlay guides, not a pose) still vary
 * freely, checked below by stripping `.pose` before comparing. `tempo`, `alt`, `checks` and `callouts` are the
 * protected content fields, held to zero tolerance (byte-identical, or checks/callouts shrunk to empty).
 */
export const CROP_WINDOW_FIELDS = new Set([
  'camera', 'seatDrop', 'datum', 'viewLabel', 'equipment', 'ghosts', 'startParts', 'marks',
  'id', 'name', 'view', 'facing',
]);
export const PROTECTED_FIELDS = ['tempo', 'alt', 'checks', 'callouts'];

export function protectedFieldProblems(exId, call, goldenA) {
  const bad = [];
  for (const k of PROTECTED_FIELDS) {
    const goldenVal = JSON.stringify(goldenA[k]);
    const callVal = JSON.stringify(call.spec[k]);
    if (goldenVal === callVal) continue;
    const shrunkToEmpty = Array.isArray(call.spec[k]) && call.spec[k].length === 0;
    if (!shrunkToEmpty) bad.push(`${exId} ${JSON.stringify(call.opts)}: ${k} differs from golden-A and is not empty`);
  }
  for (const k of Object.keys(call.spec)) {
    // `mistake`'s non-pose keys (parts/guides/tells - which parts a crop highlights, its overlay guides) vary freely
    // like the rest of the crop window; `.pose` is checked separately by classifyMistakePose/validateCalls, never
    // here (round-2 review fix, blocker 2: `mistake` used to be a whole-field member of CROP_WINDOW_FIELDS, which
    // let `.pose` drift silently too - it no longer is, but its non-pose siblings still need the same free pass).
    if (PROTECTED_FIELDS.includes(k) || CROP_WINDOW_FIELDS.has(k) || k === 'poses' || k === 'mistake') continue;
    if (JSON.stringify(call.spec[k]) !== JSON.stringify(goldenA[k])) bad.push(`${exId} ${JSON.stringify(call.opts)}: unenumerated field "${k}" differs from golden-A (never widen the crop-key list to pass; the drift is real)`);
  }
  return bad;
}

const unesc = s => String(s).replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

/** normalSvg/normalOverlay/mistakeSvg/mistakeOverlay/alt/mistakeAlt, sliced from the built page, sha256-matched
 *  against GOLDEN.json's plate entries. This is what ships, so it needs no tolerance at all. */
export function fragmentProblems(html, plateEntries) {
  const bad = [];
  const NORM = /<figure class="plate" data-mode="normal">([\s\S]*?)<figcaption class="sr-only">([^<]*)<\/figcaption><\/figure>/;
  const MIS = /<figure class="plate" data-mode="mistake" hidden>([\s\S]*?)<figcaption class="sr-only">([^<]*)<\/figcaption><\/figure>/;
  const splitSvg = s => {
    const m = s.match(/^(<svg class="plate-svg"[^>]*>[\s\S]*?<\/svg>)([\s\S]*)$/);
    if (!m) throw new Error('no svg boundary found');
    return [m[1], m[2]];
  };
  for (const p of plateEntries) {
    const cardStart = html.indexOf(`id="card-${p.chromeId}"`);
    if (cardStart < 0) { bad.push(`${p.chromeId}: card not found in the built page`); continue; }
    const body = html.slice(cardStart);
    const nm = body.match(NORM), mm = body.match(MIS);
    if (!nm || !mm) { bad.push(`${p.chromeId}: normal/mistake figure not found`); continue; }
    const [nSvg, nOv] = splitSvg(nm[1]);
    const [mSvg, mOv] = splitSvg(mm[1]);
    const checks = [
      ['normalSvg', sha256(nSvg), p.fragments.normalSvg],
      ['normalOverlay', sha256(nOv), p.fragments.normalOverlay],
      ['mistakeSvg', sha256(mSvg), p.fragments.mistakeSvg],
      ['mistakeOverlay', sha256(mOv), p.fragments.mistakeOverlay],
      ['alt', sha256(unesc(nm[2])), p.fragments.alt],
      ['mistakeAlt', sha256(unesc(mm[2])), p.fragments.mistakeAlt],
    ];
    for (const [name, got, want] of checks) if (got !== want) bad.push(`${p.chromeId}: ${name} sha256 ${got} != golden-A ${want}`);
  }
  return bad;
}

/**
 * Round-2 review fix (Medium 4): the lateral raise draws its crops through ref-src/plate.mjs's own `arm()`, never
 * `engine/plate.mjs`'s `renderPlate` - `captureRenderPlateCalls`'s shim never sees them, so HT4-A5 proof 2 only
 * ever covers the 7 non-ref-src exercises (the gate line says so: "7 exercises with an untouched base-plate call").
 * Proof 1c pins `ref-src/plate.mjs` byte-for-byte and the `dumbbell_lateral_raise.howto.mjs` re-export, but neither
 * touches the Wrong-crop parameters `howto/render-dumbbell_lateral_raise.mjs` reads off the zoom itself (`z.wrong`)
 * - only one zoom, `top-height`, sets them (the other lateral-raise zooms use the standard `wrong: 'mistake'`
 * string ref, already covered by 1c's byte-identity). Pinned literally here, checked against the vendored
 * `exercises/dumbbell_lateral_raise.howto.mjs`'s own `zooms[].wrong` value - no Playwright, no live build (a plain
 * import), so both the fast unit test and the gate use it directly.
 */
export const LATERAL_RAISE_WRONG_CROPS = {
  'top-height': { abd: 118, hideInside: ['shcap.r', 'upper.r'] },
};

export async function validateLateralRaiseCrops(layersDir) {
  const mod = await import(pathToFileURL(join(layersDir, 'exercises', 'dumbbell_lateral_raise.howto.mjs')).href);
  const zooms = mod.default.zooms;
  const bad = [];
  for (const [key, want] of Object.entries(LATERAL_RAISE_WRONG_CROPS)) {
    const z = zooms.find(zz => zz.key === key);
    if (!z) { bad.push(`dumbbell_lateral_raise: zoom "${key}" not found`); continue; }
    if (JSON.stringify(z.wrong) !== JSON.stringify(want)) bad.push(`dumbbell_lateral_raise|${key}: wrong crop params ${JSON.stringify(z.wrong)} != pinned ${JSON.stringify(want)}`);
  }
  return bad;
}

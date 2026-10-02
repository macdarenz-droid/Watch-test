// Render one exercise plate: node engine/render.mjs <id> [--selected key] [--mistake-selected key] [--html]
// Loads exercises/<id>.mjs (default export = spec), renders out/<id>-dark.png, <id>-paper.png, <id>-mistake-dark.png
// (390 px wide, device scale 2, in the reference sheet chrome), and prints the label-collision report as JSON.
// Parallel-safe: each run uses its own temp folder and its own browser.
import { createRequire } from 'node:module';
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sheetPage } from './sheet.mjs';
import { SIZE } from './plate.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const args = process.argv.slice(2), id = args.find(a => !a.startsWith('--'));
const opt = k => { const i = args.indexOf(k); return i >= 0 ? args[i + 1] : null; };
if (!id) { console.error('usage: node engine/render.mjs <id> [--selected key] [--paper-selected key] [--mistake-selected key] [--html]'); process.exit(2); }
const spec = (await import(pathToFileURL(join(root, 'exercises', `${id}.mjs`)).href + `?t=${Date.now()}`)).default;
const outDir = join(root, 'out'); mkdirSync(outDir, { recursive: true });
const tmp = mkdtempSync(join(outDir, `.tmp-${id}-${process.pid}-`));

const require = createRequire('/home/user/M-arc/package.json');
const { chromium } = require('playwright');
const c0 = spec.callouts?.[0]?.key ?? null, c1 = spec.callouts?.[1]?.key ?? c0, t0 = spec.mistake?.tells?.[0]?.key ?? null;
const jobs = [
  { name: `${id}-dark`, theme: 'silent-black', scheme: 'dark', mistake: false, selected: opt('--selected') ?? c0 },
  { name: `${id}-paper`, theme: 'paper', scheme: 'light', mistake: false, selected: opt('--paper-selected') ?? c1 },
  { name: `${id}-mistake-dark`, theme: 'silent-black', scheme: 'dark', mistake: true, selected: opt('--mistake-selected') ?? t0 },
];
const overlap = (a, b) => a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const result = { id, renders: [] };
try {
  for (const j of jobs) {
    if (j.mistake && !spec.mistake) continue;
    const { html, plate } = sheetPage(spec, { theme: j.theme, mistake: j.mistake, selected: j.selected, id: j.mistake ? 'm' : 'p' });
    const file = join(tmp, `${j.name}.html`);
    writeFileSync(file, html);
    if (args.includes('--html')) writeFileSync(join(outDir, `${j.name}.html`), html);
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: j.scheme });
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(file).href);
    await page.evaluate(() => document.fonts.ready);
    // fit the viewport to the sheet (status bar + 68 px of backdrop above it), like a phone with the sheet open
    const ph = await page.evaluate(() => document.querySelector('.sheet-panel').getBoundingClientRect().height);
    await page.evaluate(h => { document.body.style.height = h + 'px'; }, Math.ceil(ph + 96));
    await page.setViewportSize({ width: 390, height: Math.ceil(ph + 96) });
    const m = await page.evaluate(() => {
      const pl = document.querySelector('.plate'), pb = pl.getBoundingClientRect(), k = 358 / pb.width;
      const labels = [...pl.querySelectorAll('.plate-callout, .plate-arc-label, .plate-meta')].map(el => {
        const rg = document.createRange(); rg.selectNodeContents(el); const b = rg.getBoundingClientRect();
        return { t: el.textContent, key: el.dataset.key ?? null, b: { x0: (b.left - pb.left) * k, y0: (b.top - pb.top) * k, x1: (b.right - pb.left) * k, y1: (b.bottom - pb.top) * k } };
      });
      const panel = document.querySelector('.sheet-panel');
      return { font: document.fonts.check('15px "Inter Variable"'), wide: document.documentElement.scrollWidth, panelFits: panel.scrollHeight <= panel.clientHeight, labels };
    });
    // browser-measured label boxes against: plate edge (8 px), each other, the drawn figure/equipment, key joints
    const issues = [];
    m.labels.forEach((a, i) => {
      if (a.b.x0 < 8 || a.b.y0 < 8 || a.b.x1 > SIZE - 8 || a.b.y1 > SIZE - 8) issues.push(`edge:${a.t}`);
      m.labels.slice(i + 1).forEach(c => { if (overlap(a.b, c.b)) issues.push(`overlap:${a.t}|${c.t}`); });
      if (!a.t.match(/view$/i)) { const hit = plate.occ.count(a.b.x0, a.b.y0, a.b.x1, a.b.y1); if (hit) issues.push(`figure:${a.t}:${hit}cells`); }
      for (const jn of plate.report.keyJoints) if (jn.p[0] > a.b.x0 - 3 && jn.p[0] < a.b.x1 + 3 && jn.p[1] > a.b.y0 - 3 && jn.p[1] < a.b.y1 + 3) issues.push(`joint:${a.t}|${jn.k}`);
    });
    if (!m.font) issues.push('font-not-loaded');
    if (m.wide > 390) issues.push(`horizontal-scroll:${m.wide}`);
    if (!m.panelFits) issues.push('sheet-overflows');
    const png = join(outDir, `${j.name}.png`);
    await page.screenshot({ path: png });
    await ctx.close();
    const rep = plate.report;
    result.renders.push({ png, theme: j.theme, mistake: j.mistake, selected: j.selected, browserIssues: issues, engineIssues: rep.issues,
      labels: m.labels.map(l => ({ t: l.t, box: Object.values(l.b).map(v => +v.toFixed(1)) })) });
    if (!j.mistake && !result.measure) Object.assign(result, { camera: rep.camera, measure: rep.measure, contacts: rep.contacts, checks: rep.checks, angles: rep.angles });
    if (j.mistake) Object.assign(result, { mistakeContacts: rep.contacts.mistake ?? [], mistakeAngles: rep.angles.mistake ?? null });
  }
} finally {
  await browser.close();
  rmSync(tmp, { recursive: true, force: true });
}
result.ok = result.renders.every(r => !r.browserIssues.length && !r.engineIssues.length);
console.log(JSON.stringify(result, null, 1));

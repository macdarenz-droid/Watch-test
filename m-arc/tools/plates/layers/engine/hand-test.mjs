// Hand renderer check: node engine/hand-test.mjs
// Renders the push pair (machine chest press, vertical handle), a pull pair (lat pulldown) and a hang pair (pull-up)
// to out/_hand-<name>-<theme>.png in Silent Black and Paper (358 px box, device scale 3), and prints the lever report.
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { allThemesCss } from './themes.mjs';
import { renderHandPair, HAND_CSS } from './hand.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..'), outDir = join(root, 'out');
mkdirSync(outDir, { recursive: true });
const FONT = `data:font/woff2;base64,${readFileSync(join(here, 'inter-latin-wght-normal.woff2')).toString('base64')}`;
const TOKENS = readFileSync(join(here, 'tokens.css'), 'utf8');

import { PAIRS } from './hand-pairs.mjs';
const THEMES = [['silent-black', 'dark', 'dark'], ['paper', 'light', 'paper']];
const only = process.argv[2];

const page = (svg, theme) => `<!doctype html><html lang="en" data-theme="${theme}"><head><meta charset="utf-8"><meta name="viewport" content="width=390">
<style>@font-face { font-family: 'Inter Variable'; src: url('${FONT}') format('woff2-variations'); font-weight: 100 900; font-display: block; }
${TOKENS}
${allThemesCss()}
*,*::before,*::after{box-sizing:border-box} html,body{margin:0;background:var(--surface-2);color:var(--text);font-family:var(--font);-webkit-font-smoothing:antialiased}
body{width:390px;padding:16px}
${HAND_CSS}</style></head><body><div class="hand-plate">${svg}</div></body></html>`;

const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const tmp = mkdtempSync(join(outDir, '.hand-'));
const result = {};
try {
  for (const [name, spec] of Object.entries(PAIRS)) {
    if (only && only !== name) continue;
    const { svg, report } = renderHandPair({ ...spec, uid: name });
    result[name] = report;
    for (const [theme, scheme, tag] of THEMES) {
      const file = join(tmp, `${name}-${tag}.html`);
      writeFileSync(file, page(svg, theme));
      const p = await browser.newPage({ viewport: { width: 390, height: 400 }, deviceScaleFactor: 3, colorScheme: scheme });
      await p.goto(pathToFileURL(file).href); await p.evaluate(() => document.fonts.ready);
      const wide = await p.evaluate(() => document.documentElement.scrollWidth);
      if (wide > 390) report.issues = [...(report.issues ?? []), `horizontal-scroll:${wide}`];
      await p.locator('.hand-plate').screenshot({ path: join(outDir, `_hand-${name}-${tag}.png`) });
      await p.close();
    }
  }
} finally { await browser.close(); rmSync(tmp, { recursive: true, force: true }); }
console.log(JSON.stringify(result, null, 1));

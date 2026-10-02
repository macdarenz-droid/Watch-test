// Debug helper: node engine/zoom.mjs <id> [mistake] -> out/<id>-zoom.png (the plate alone at 3x, dark theme)
import { createRequire } from 'node:module';
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { sheetPage } from './sheet.mjs';
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..');
const [id, mode, theme = 'silent-black'] = process.argv.slice(2);
const spec = (await import(pathToFileURL(join(root, 'exercises', `${id}.mjs`)).href)).default;
const { html } = sheetPage(spec, { mistake: mode === 'mistake', theme });
const tmp = mkdtempSync(join(root, 'out', `.zoom-${id}-`)), file = join(tmp, 'z.html');
writeFileSync(file, html);
const { chromium } = createRequire('/home/user/M-arc/package.json')('playwright');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3 });
await p.goto(pathToFileURL(file).href); await p.evaluate(() => document.fonts.ready);
await p.locator('.plate').screenshot({ path: join(root, 'out', `${id}-zoom${mode === 'mistake' ? '-m' : ''}.png`) });
await b.close(); rmSync(tmp, { recursive: true, force: true });

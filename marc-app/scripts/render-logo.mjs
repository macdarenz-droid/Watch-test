// Render the M/ARC logo for every theme: app icons (Silent Black goes to public/),
// per-theme icon sets under branding/, and one preview sheet.
// Run: node scripts/render-logo.mjs   (needs a built node_modules/.cache/logo.mjs, see package.json "logo")
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { THEMES, THEME_IDS } from '../node_modules/.cache/logo-themes.mjs';
import { markSvg, lockupSvg } from '../node_modules/.cache/logo-svg.mjs';

const browser = await chromium.launch({ ...(process.env.MARC_CHROMIUM ? { executablePath: process.env.MARC_CHROMIUM } : {}), args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 512, height: 512 }, deviceScaleFactor: 1 });

async function png(svg, size, out, bg = 'transparent') {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:${bg}">${svg}</body></html>`);
  await page.locator('svg').first().screenshot({ path: out, omitBackground: bg === 'transparent' });
}

mkdirSync('branding', { recursive: true });
for (const id of THEME_IDS) {
  const t = THEMES[id].tokens;
  const c = { ink: t.text, accent: t.accent, bg: t.bg };
  const dir = `branding/${id}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/mark.svg`, markSvg(c, { rounded: true }));
  writeFileSync(`${dir}/lockup.svg`, lockupSvg(c, 64));
  await png(markSvg(c, { rounded: true, size: 512, padding: 8 }), 512, `${dir}/icon-512.png`);
  await png(markSvg(c, { rounded: true, size: 192, padding: 8 }), 192, `${dir}/icon-192.png`);
  // Maskable: no rounding, artwork inside the 80% safe zone.
  await png(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="512" height="512"><rect width="64" height="64" fill="${t.bg}"/>${markSvg(c, { padding: 12 }).replace(/<svg[^>]*>|<\/svg>/g, '')}</svg>`, 512, `${dir}/icon-maskable-512.png`);
  await png(lockupSvg(c, 128), 128, `${dir}/lockup.png`, t.bg);
}

// Preview sheet: all five themes.
const rows = THEME_IDS.map(id => { const t = THEMES[id].tokens; const c = { ink: t.text, accent: t.accent, bg: t.bg }; return `
  <div style="background:${t.bg};color:${t.text};padding:28px 32px;display:flex;align-items:center;gap:28px;border-bottom:1px solid ${t.border}">
    ${markSvg(c, { rounded: true, size: 88, padding: 8 }).replace('<svg ', `<svg style="border:1px solid ${t.border};border-radius:20px" `)}
    ${lockupSvg(c, 56)}
    <div style="margin-left:auto;text-align:right;font:600 13px Inter,system-ui;color:${t.text2}">${THEMES[id].name}<br><span style="font-weight:400">after ${THEMES[id].inspiredBy}</span></div>
  </div>`; }).join('');
await page.setViewportSize({ width: 720, height: 5 * 144 });
await page.setContent(`<html><body style="margin:0;font-family:Inter,system-ui">${rows}</body></html>`);
await page.screenshot({ path: 'branding/preview.png', fullPage: true });
await browser.close();
console.log('rendered branding/ for', THEME_IDS.join(', '));

import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire('/home/user/M-arc/package.json');
const { chromium } = require('playwright');
const dir = new URL('./', import.meta.url).pathname;
const font = readFileSync(dir + 'inter-latin-wght-normal.woff2').toString('base64');
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage();
await p.setContent(`<style>@font-face{font-family:I;src:url(data:font/woff2;base64,${font}) format('woff2-variations');font-weight:100 900}
.c{font:600 11px I;letter-spacing:.06em;text-transform:uppercase;white-space:pre}.m{font:500 12px I;font-variant-numeric:tabular-nums;white-space:pre}</style><span class=c id=c></span><span class=m id=m></span>`);
await p.evaluate(() => document.fonts.ready);
const r = await p.evaluate(() => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -–.,°/%()\'+';
  const w = (id, s) => { const e = document.getElementById(id); e.textContent = s; return e.getBoundingClientRect().width; };
  const cap = {}, meta = {};
  for (const ch of chars) { cap[ch] = +(w('c', ch.repeat(20)) / 20).toFixed(3); }
  for (const ch of 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 -–.,°/%()\'+') meta[ch] = +(w('m', ch.repeat(20)) / 20).toFixed(3);
  return { cap, meta, check: [w('c', 'ELBOWS LEAD'), w('c', 'NO SHRUG')] };
});
console.log(JSON.stringify(r));
await b.close();

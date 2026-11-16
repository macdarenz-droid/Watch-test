// Stamp the service worker with the build time (so old caches are dropped) and the list of built
// assets, lazy chunks included (so they are installed with the app, ST-04).
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
const path = 'www/sw.js';
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
const assets = readdirSync('www/assets').sort().map(f => `./assets/${f}`);
const src = readFileSync(path, 'utf8');
if (!src.includes('/*__ASSETS__*/[]')) throw new Error('sw.js has no /*__ASSETS__*/[] marker');
writeFileSync(path, src.replace('__BUILD__', stamp).replace('/*__ASSETS__*/[]', JSON.stringify(assets)));
console.log('service worker cache:', `marc-${stamp}`, `· ${assets.length} assets`);

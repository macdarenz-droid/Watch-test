// Stamp the service worker cache name with the build time so old caches are dropped.
import { readFileSync, writeFileSync } from 'node:fs';
const path = 'www/sw.js';
const stamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
writeFileSync(path, readFileSync(path, 'utf8').replace('__BUILD__', stamp));
console.log('service worker cache:', `marc-${stamp}`);

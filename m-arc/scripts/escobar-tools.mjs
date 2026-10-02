// Regenerates escobar-worker/src/tools.generated.json from the app's single source of truth:
// src/escobar/tools/schema.ts (the API-facing tool subset) and src/escobar/context/modes.ts
// (the mode addenda). Run: npm run escobar:tools. tests/escobar/tools-sync.test.ts fails on drift.
import { build } from 'esbuild';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'node_modules/.cache/escobar-tools.mjs');
mkdirSync(dirname(OUT), { recursive: true });
await build({
  stdin: { contents: "export { apiTools } from './src/escobar/tools/schema.ts'; export { MODE_ADDENDUM } from './src/escobar/context/modes.ts';", resolveDir: ROOT, loader: 'ts' },
  bundle: true, format: 'esm', platform: 'node', outfile: OUT, logLevel: 'warning', alias: { '@': join(ROOT, 'src') },
});
const mod = await import(pathToFileURL(OUT).href + `?t=${Date.now()}`);
const json = JSON.stringify({ tools: mod.apiTools(), modes: mod.MODE_ADDENDUM }, null, 1) + '\n';
writeFileSync(join(ROOT, 'escobar-worker/src/tools.generated.json'), json);
console.log('wrote escobar-worker/src/tools.generated.json');

// Bundles the legacy-backup converter with the same __APP_VERSION__ as the app (from package.json).
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
await build({
  entryPoints: ['scripts/convert-legacy-backup.ts'],
  bundle: true, platform: 'node', format: 'esm', logLevel: 'warning',
  alias: { '@': './src' },
  define: { __APP_VERSION__: JSON.stringify(version) },
  outfile: 'node_modules/.cache/convert-backup.mjs',
});

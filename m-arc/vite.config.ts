import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string };

// The Capacitor Android project and the PWA both consume `www/`.
export default defineConfig({
  plugins: [preact()],
  base: './',
  // R7.2: one version source for the app, backups and Escobar.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    outDir: 'www',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
    assetsInlineLimit: 4096,
  },
  test: {
    // Timing budgets run alone (MARC_PERF=1) so parallel test files don't skew them.
    include: process.env.MARC_PERF ? ['tests/perf/**/*.test.ts'] : ['tests/**/*.test.ts'],
    exclude: process.env.MARC_PERF ? ['node_modules/**'] : ['node_modules/**', 'tests/perf/**'],
    environment: 'node',
  },
});

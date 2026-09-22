import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { fileURLToPath } from 'node:url';

// The Capacitor Android project and the PWA both consume `www/`.
export default defineConfig({
  plugins: [preact()],
  base: './',
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
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});

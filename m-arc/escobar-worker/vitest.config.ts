import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { 'cloudflare:workers': fileURLToPath(new URL('./test/cf-workers-stub.ts', import.meta.url)) } },
  test: { include: ['test/**/*.test.ts'], environment: 'node' },
});

import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { apiTools } from '@/escobar/tools/schema';
import { MODE_ADDENDUM } from '@/escobar/context/modes';

describe('Worker tool definitions stay in sync (§12.8)', () => {
  it('escobar-worker/src/tools.generated.json matches schema.ts and modes.ts (run npm run escobar:tools)', () => {
    const generated = JSON.parse(readFileSync(join(__dirname, '../../escobar-worker/src/tools.generated.json'), 'utf8'));
    expect(generated.tools).toEqual(JSON.parse(JSON.stringify(apiTools())));
    expect(generated.modes).toEqual(MODE_ADDENDUM);
  });
});

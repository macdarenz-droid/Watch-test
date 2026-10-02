import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { PALACE } from '@/escobar/palace/registry';

function sources(dir: string): string {
  return readdirSync(dir).map(f => join(dir, f)).map(p => (statSync(p).isDirectory() ? sources(p) : /\.tsx?$/.test(p) ? readFileSync(p, 'utf8') : '')).join('\n');
}
const SRC = sources(join(__dirname, '../../src'));

describe('palace anchors', () => {
  it('every anchor is rendered somewhere as a data-palace or palace attribute', () => {
    const missing = PALACE.map(p => p.target.anchor!).filter(a => !SRC.includes(`data-palace="${a}"`) && !SRC.includes(`palace="${a}"`));
    expect(missing).toEqual([]);
  });
});

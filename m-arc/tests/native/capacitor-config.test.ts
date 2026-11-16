/** F11: cold start with no white flash. capacitor.config.json sets the WebView background
 * so the native surface is dark before the first frame paints. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const config = JSON.parse(readFileSync(fileURLToPath(new URL('../../capacitor.config.json', import.meta.url)), 'utf8'));

describe('capacitor.config.json', () => {
  it('F11: sets the WebView background to Silent Black so no light frame shows before the app paints', () => {
    expect(config.backgroundColor).toBe('#08090a');
  });
});

/** PLAY-1: the in-app privacy policy (P1, P2 with D-LR23-4). P3 (the healthcare reminder) retired 2026-10-01
 * by owner decision (COPY-1, D-COPY1-medical): it moved to the store description, see docs/PLAY-SUBMISSION.md. */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import * as Settings from '@/slices/settings/Settings';
import { PRIVACY_POLICY_URL } from '@/slices/settings/Settings';
import { CONTACT_RE, SAFETY_LINE_RE, SOURCE_CS_RE, SOURCE_RE } from '../guards/no-contacts';

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../../${p}`, import.meta.url)), 'utf8');
const java = read('native/PermissionsRationaleActivity.java');
// The Play Console privacy policy field, as docs/PLAY-SUBMISSION.md records it (DOC-2).
const PLAY_CONSOLE_URL = read('docs/PLAY-SUBMISSION.md').match(/\*\*Privacy policy URL \(Play Console[^\n]*\n(https:\/\/\S+?)\s/)?.[1];

describe('PLAY-1', () => {
  it('A1: Settings links the Play Console privacy URL and exports no medical reminder', () => {
    expect(PLAY_CONSOLE_URL).toBe('https://macdarenz-droid.github.io/M-arc/privacy/');
    expect(PRIVACY_POLICY_URL).toBe(PLAY_CONSOLE_URL);
    expect((Settings as Record<string, unknown>).MEDICAL_LINE).toBeUndefined();
    expect(read('src/slices/settings/Settings.tsx')).not.toContain('healthcare professional');
  });

  it('A2: the Health Connect screen loads the same URL in a WebView', () => {
    expect(java).toContain(`static final String PRIVACY_POLICY_URL = "${PLAY_CONSOLE_URL}";`);
    expect(java).toMatch(/new WebView\(this\)/);
    expect(java).toMatch(/\.loadUrl\(PRIVACY_POLICY_URL\)/);
  });

  it('A2: a main-frame network or HTTP error keeps the summary on screen', () => {
    expect(java).toMatch(/onReceivedError\([^)]*\)\s*\{\s*if \(request\.isForMainFrame\(\)\) showFallback\(\);/);
    expect(java).toMatch(/onReceivedHttpError\([^)]*\)\s*\{\s*if \(request\.isForMainFrame\(\)\) showFallback\(\);/);
    // The WebView only replaces the summary once a page finished without an error.
    expect(java).toMatch(/onPageFinished\([^)]*\)\s*\{\s*if \(failed\) return;\s*web\.setVisibility\(View\.VISIBLE\);\s*fallback\.setVisibility\(View\.GONE\);/);
    expect(java).toMatch(/web\.setVisibility\(View\.INVISIBLE\);\s*web\.getSettings/);
    expect(java).toContain('M/ARC reads steps, sleep, heart rate, resting heart rate and active calories from Health Connect');
  });

  it('LR-23: the link label, the healthcare line and the Health Connect screen text carry no contact or source', () => {
    const label = read('src/slices/settings/Settings.tsx').match(/data-palace="settings\.privacy">([^<]+)<\/a>/)?.[1];
    expect(label).toBe('Privacy policy');
    const javaText = [...java.matchAll(/\.setText\("((?:[^"\\]|\\.)*)"\)/g)].map(m => m[1] ?? '');
    expect(javaText.length).toBe(2);
    for (const t of [label!, ...javaText]) {
      for (const re of [CONTACT_RE, SOURCE_RE, SOURCE_CS_RE, SAFETY_LINE_RE]) expect(t.match(re)?.[0], `${re} in "${t}"`).toBeUndefined();
    }
  });
});

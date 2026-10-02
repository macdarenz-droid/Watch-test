/**
 * COPY-1 (owner, 2026-10-01): UI copy never talks down to users or states the obvious, and the app explains
 * nothing unless Google Play requires it or the owner asked for it (D-COPY1-1). Labels that name a control or
 * show data stay. This pins every audit line this card removed or shortened, the corrected watch disclosure and
 * the footer rights line (D-COPY1-2).
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { RIGHTS_LINE } from '@/slices/settings/Settings';
import { CONTACT_RE, SAFETY_LINE_RE, SOURCE_CS_RE, SOURCE_RE } from './guards/no-contacts';

const read = (p: string) => readFileSync(fileURLToPath(new URL(`../${p}`, import.meta.url)), 'utf8');

/** Removed or shortened copy, per file: none of these may come back. */
const GONE: Record<string, string[]> = {
  'src/slices/settings/Settings.tsx': [
    'Each machine keeps its own entry unit',
    "Swaps today's reminder for your readiness",
    'Android may deliver the rest alert a little late',
    'an alert should arrive in 5 s',
    'Your choice stays on even if Android drops the queue',
    'Always on when your phone asks for less motion',
    "'Android haptics'",
    "'Browser vibration'",
    'Stays on while a workout is live',
    'See what was allowed and what was read',
    'Falls back to the timer if the signal drops',
    'a note to save a backup file',
    'A copy of saved data the app could not read at start',
    'Everything stays on this device',
    'Your history from the previous version was imported automatically',
    'Export a backup first if unsure',
  ],
  'src/slices/settings/Watch.tsx': [
    'Looking for broadcasting watches',
    'keep it close',
    'Remembered for auto-connect',
    'No Bluetooth address or heart-rate value ever leaves your phone',
  ],
  'src/native/watch.ts': ['M/ARC needs the', 'this Android version uses it for Bluetooth scans'],
  'src/slices/settings/Gyms.tsx': ['Each gym remembers the unit', 'standard plates and dumbbells'],
  'src/slices/today/Today.tsx': [
    'Recovery has started',
    'Today counts as a rest day',
    'Train anyway, or let today be recovery',
    'The coach learns from what you log',
    'Log a session and recovery shows up here',
    'Keep logging and rating effort',
    'Connect a watch or add a check-in to see your readiness',
  ],
  'src/slices/workout/Train.tsx': [
    'Your history keeps one unit for comparing progress',
    'Start from a simple template or build your own split',
    'Tap edit to add exercises',
    'optional, up to two',
    'It does not add exercises',
    'Only the template goes',
    'Anything with logged sets is still saved',
    'Session note (optional)',
    'You changed the exercises today',
    'The time since is not counted',
    'It counts as a record once you lift it again',
    'Warm-ups are kept but never counted',
    'No substitutes with the same primary muscle',
    "Feeds today's readiness",
    'Have a good session',
    'Timing-based advice',
  ],
  'src/brain/bodyweight.ts': ['Your body weight counts', 'Add your body weight in Settings'],
  'src/slices/history/History.tsx': [
    'Log a session from Train, or start one now',
    'tap the pill to switch',
    'a set where the muscle only helps counts',
    'Log two sessions of an exercise to see its trend',
    'The trend line appears after the second',
    'Records appear from your second session',
  ],
  'src/slices/history/progressTrend.ts': ['Trend follows', 'It is a guide, not a test'],
  'src/slices/body/Body.tsx': [
    'Tap a muscle for details',
    'Recovery time depends on sets, load and effort',
    'Shading follows effective sets',
    'Levels are a relative measure',
    'Not a medical measurement',
    'Trained muscles show here once fully recovered',
    'Use it if this muscle already feels ready',
    'Track the trend, not one reading',
    'Typically within 3 to 4 points of lab methods',
  ],
  'src/slices/coach/Coach.tsx': [
    'How the coach thinks',
    'Keep logging and rating effort',
    'Your goal sets rep targets',
    'Your splits keep their exercises',
    'Reminders and streaks follow this',
    'Set one so reminders and streaks know your rest days',
    'Create a split first, then assign it to days',
    'good or bad',
    'Sets and load are reduced across your plan',
    'unlocks',
  ],
  'src/escobar/palace/registry.ts': ["'coach.thinks'"],
  'src/brain/onboarding.ts': ['to unlock ${', 'unlocks: '],
  'src/escobar/ui/Hall.tsx': ['Your notes below still update', 'An AI coach that knows your training', 'When you and Escobar settle on a change'],
  'src/slices/profile/Profile.tsx': ['Calories, heart-rate zones, recovery time', 'Unlocks:', 'Your weekly target when no days are scheduled', 'Also counts as the load on bodyweight'],
  'src/slices/profile/Onboarding.tsx': [
    'It has been three months',
    'Your watch is connected. A few details',
    'The coach already learns from every set',
    'Without them the coach cannot show',
    'Takes about a minute',
    "Or leave blank if you're new",
    'Sets rep targets, rest suggestion and starter templates',
    'Nothing here is mandatory',
  ],
  'src/slices/workout/ExercisePicker.tsx': ['You can create it below', 'Decides what progress means', "Main lifts get your goal's main rep range"],
  'src/escobar/ui/EscobarSheet.tsx': [
    'I know every rep',
    'The rest of your history stays on the phone',
    'You can change these any time in Settings',
    'He can still point you around the app',
  ],
  'src/escobar/ui/SettingsSection.tsx': ['nothing else leaves the phone', 'Nothing leaves the phone', 'Leave empty for the built-in server'],
  'src/escobar/ui/MemoryScreen.tsx': ['When you tell Escobar something worth keeping'],
  'src/escobar/ui/Message.tsx': ['Ask again for a fresh one'],
  'src/app/ErrorBoundary.tsx': ['Reload to carry on', 'Save a copy first if unsure'],
  'src/errors/AskSheet.tsx': ['are ever included'],
  'native/PermissionsRationaleActivity.java': ['The full privacy policy shows here when you are online'],
  'src/native/notifications.ts': ['Back to it. Your next set is ready.', 'Rest alerts will look like this', 'A backup file keeps it safe'],
  'src/native/share.ts': ['save/share sheet opened', 'Choose where to save it', "Sharing isn't available here"],
};

/** The shortened lines that replace them. */
const NOW: Record<string, string[]> = {
  'src/slices/settings/Settings.tsx': [
    "'Lock the phone. Alert in 5 s.'",
    '{osReducedMotion() && <div class="hint">Set by your phone</div>}',
    "{hapticSupport() === 'none' && <div class=\"hint\">No vibration on this device</div>}",
    ": 'Sunday evening'}",
    '<p class="hint">Loaded from: {bootSource.value}.</p>',
    'Delete all sessions, splits and settings on this device?</p>',
  ],
  'src/slices/settings/Watch.tsx': [
    'No watch found. Turn on heart-rate broadcast on the watch, then scan again.',
    'Watch readings stay on this phone. Session heart rate goes to Escobar only if Share health data is on.',
  ],
  'src/slices/today/Today.tsx': ['0)} sets logged.</p>', "'No sessions yet.'", 'No strong signals right now.</p>', 'No readiness yet.</p>'],
  'src/slices/workout/Train.tsx': [
    'Empty split.</p>',
    '<Field label="Focus muscles (up to two)">',
    'Your history stays.</p>',
    'not marked done.</p>',
    '<Field label="Session note">',
    "Keep today's exercise changes for future sessions?",
    'min after your last set.</p>',
    'No substitutes found.</p>',
    'Nothing to flag.</p>',
    'Looks like you logged this after training.</p>',
  ],
  'src/slices/history/History.tsx': ['Sets with 0 reps are removed on save.</p>', 'No trends yet.', 'One session so far.</p>', 'No records yet.'],
  'src/slices/body/Body.tsx': ['Ready at {READY_PCT}%, full at {FULL_PCT}%.', 'None yet.</span>', 'US Navy tape-measure estimate.'],
  'src/slices/coach/Coach.tsx': ['training days a week.`', "'No schedule.'", 'No splits yet.', 'Nothing stood out this week.</p>', 'Through {active.endDay}.'],
  'src/escobar/ui/Hall.tsx': ['Escobar is offline.</p>', 'Nothing agreed yet.</p>'],
  'src/slices/profile/Onboarding.tsx': ['Still {formatLoad', 'Missing: {missing.join'],
  'src/slices/workout/ExercisePicker.tsx': ['Nothing matches.</p>'],
  'src/escobar/ui/MemoryScreen.tsx': ['Nothing yet.</p>'],
  'src/escobar/ui/Message.tsx': ['Out of date.</div>'],
  'src/app/ErrorBoundary.tsx': ['Your data is still on this device.</p>', 'Deletes every workout on this device.</p>'],
  'src/errors/AskSheet.tsx': ['Send anonymous error reports if something breaks?</p>'],
  'src/native/watch.ts': ["'Allow Location in Android settings to find your watch, then scan again.'", "'Allow Nearby devices in Android settings to find your watch, then scan again.'"],
  'src/native/notifications.ts': ["body: 'Next set.'", "body: 'Test'"],
  'src/native/share.ts': ["message: 'Downloaded'"],
};

describe('COPY-1: no explaining, no stating the obvious (D-COPY1-1)', () => {
  it.each(Object.entries(GONE))('%s carries none of the removed lines', (file, lines) => {
    const src = read(file);
    expect(lines.filter(l => src.includes(l))).toEqual([]);
  });
  it.each(Object.entries(NOW))('%s shows the shortened lines', (file, lines) => {
    const src = read(file);
    expect(lines.filter(l => !src.includes(l))).toEqual([]);
  });
  it('the Escobar empty state is the one short line', async () => {
    const { EMPTY_LINE } = await import('@/escobar/ui/EscobarSheet');
    expect(EMPTY_LINE).toBe('Ask me anything.');
  });
  it('lines Play or the owner require stay (research: disclosure, consent, Health Connect rationale)', () => {
    const sheet = read('src/escobar/ui/EscobarSheet.tsx');
    for (const l of ['this is what leaves your phone', 'It goes through your M/ARC server to Anthropic, the model provider.', 'Sleep, resting heart rate, heart rate during sessions.', 'Weight and body measurements.']) expect(sheet).toContain(l);
    expect(read('native/PermissionsRationaleActivity.java')).toContain('change Health Connect permissions at any time in Android settings.")');
    expect(read('src/slices/settings/Settings.tsx')).toContain('data-palace="settings.privacy">Privacy policy</a>');
  });
});

describe('COPY-1: the Settings footer rights line (D-COPY1-2)', () => {
  it('reads exactly as the owner asked, under the logo and above the version line', () => {
    expect(RIGHTS_LINE).toBe('© 2026 Marc Darenz. All rights reserved.');
    const footer = read('src/slices/settings/Settings.tsx').match(/<Logo height=\{30\} \/>(.*?)<span class="hint" data-palace="settings\.version">/)?.[1] ?? '';
    expect(footer).toContain('<p class="hint" style={{ textAlign: \'center\' }} data-palace="settings.rights">{RIGHTS_LINE}</p>');
    expect(footer.indexOf('data-palace="settings.rights"')).toBe(footer.indexOf('data-palace'));
  });
  it('carries no contact, source or safety wording (LR-23)', () => {
    for (const re of [CONTACT_RE, SOURCE_RE, SOURCE_CS_RE, SAFETY_LINE_RE]) expect(RIGHTS_LINE.match(re)?.[0], `${re}`).toBeUndefined();
  });
  it('has no medical reminder (D-COPY1-medical): moved to the store description, see docs/PLAY-SUBMISSION.md', () => {
    const src = read('src/slices/settings/Settings.tsx');
    expect(src).not.toContain('MEDICAL_LINE');
    expect(src).not.toContain('healthcare professional');
    expect(src).not.toContain('data-palace="settings.medical"');
  });
  it('the version line is the rights line\'s next sibling in the footer', () => {
    const footer = read('src/slices/settings/Settings.tsx').match(/<Logo height=\{30\} \/>(.*?)<\/div>/)?.[1] ?? '';
    const rightsEnd = footer.indexOf('</p>', footer.indexOf('data-palace="settings.rights"'));
    const versionStart = footer.indexOf('<span class="hint" data-palace="settings.version"');
    expect(rightsEnd).toBeGreaterThan(-1);
    expect(versionStart).toBeGreaterThan(rightsEnd);
    expect(footer.slice(rightsEnd + '</p>'.length, versionStart)).toBe('');
  });
});

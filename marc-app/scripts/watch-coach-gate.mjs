// Browser acceptance gate for watch-informed coaching. Run after npm run build.
// Fixtures use the real persisted app model and never bypass Coach calculations.
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const OUT = join(ROOT, 'screenshots', 'watch-coach');
const PORT = process.env.MARC_WATCH_GATE_PORT || '4175';
const URL = `http://localhost:${PORT}/`;
const themes = ['silent-black', 'paper', 'ember', 'emerald', 'midnight'];
const errors = [];
mkdirSync(OUT, { recursive: true });

function workout(id, daysAgo, averageBpm, splitId = 'push') {
  const start = new Date();
  start.setDate(start.getDate() - daysAgo);
  start.setHours(17, 0, 0, 0);
  const end = new Date(start.getTime() + 30 * 60_000);
  const press = splitId === 'push';
  return {
    id, splitId, splitName: press ? 'Push' : 'Pull',
    day: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`,
    startedAt: start.toISOString(), endedAt: end.toISOString(), durationSec: 1800,
    exercises: [{ exerciseId: press ? 'lib_machine_chest_press' : 'lib_lat_pulldown', name: press ? 'Machine Chest Press' : 'Lat Pulldown',
      sets: Array.from({ length: 3 }, (_, n) => ({ id: `${id}-set-${n}`, loggedAt: new Date(start.getTime() + (n + 1) * 5 * 60_000).toISOString(), kg: 50, reps: 8, effort: 'ideal' })) }],
    heartRate: {
      metricsVersion: 2, sampleCount: 1620, averageBpm, recordedPeakBpm: averageBpm + 18,
      capturedMs: 1_620_000, durationMs: 1_800_000, coveragePct: 90, gapCount: 0,
      firstSampleAt: start.toISOString(), lastSampleAt: new Date(end.getTime() - 1000).toISOString(),
    },
  };
}

function fixture(kind = 'ready') {
  const sessions = [workout('push-1', 14, 115), workout('pull-1', 12, 104, 'pull'), workout('push-2', 10, 118), workout('push-3', 6, 116), workout('push-latest', 1, 137)];
  if (kind === 'empty') for (const session of sessions) delete session.heartRate;
  if (kind === 'insufficient') sessions.splice(0, sessions.length - 1);
  if (kind === 'limited') {
    const last = sessions.at(-1).heartRate;
    Object.assign(last, { sampleCount: 720, capturedMs: 720_000, coveragePct: 40, gapCount: 8 });
  }
  if (kind === 'short') {
    Object.assign(sessions.at(-1).heartRate, { sampleCount: 60, capturedMs: 60_000, coveragePct: 3, gapCount: 1 });
  }
  if (kind === 'updated') sessions.at(-1).heartRate.averageBpm = 116;
  if (kind === 'deleted') sessions.pop();
  return {
    version: 1, createdAt: sessions[0].startedAt, profile: { name: 'Watch gate', bodyWeightKg: 78 }, goal: 'lean',
    splits: [
      { id: 'push', name: 'Push', color: '#c9a86c', createdAt: sessions[0].startedAt, focus: [], exercises: [{ exerciseId: 'lib_machine_chest_press', sets: 3 }] },
      { id: 'pull', name: 'Pull', color: '#5aa799', createdAt: sessions[0].startedAt, focus: [], exercises: [{ exerciseId: 'lib_lat_pulldown', sets: 3 }] },
    ],
    schedule: { sun: null, mon: 'push', tue: null, wed: 'pull', thu: null, fri: 'push', sat: null },
    sessions, active: null, customExercises: [], body: [], health: { connected: false },
    preferences: { weightUnit: 'kg', restDefaultSec: 90, autoRest: true, haptics: false, reminders: { enabled: false, time: '17:30', style: 'silent' }, showSpark: false },
  };
}

async function installNativeTraceFixture(page) {
  const initial = fixture('ready');
  const latest = initial.sessions.at(-1);
  const start = Date.parse(latest.startedAt);
  const samples = Array.from({ length: 1800 }, (_, second) => ({
    bpm: second === 0 ? 110 : second === 1799 ? 145 : second === 119 ? 159 : 137,
    receivedAtEpochMs: start + second * 1000,
    receivedAtElapsedMs: 10_000 + second * 1000,
    contactDetected: second < 120 || second > 124,
    source: 'ble-heart-rate',
  })).filter(sample => {
    const second = (sample.receivedAtEpochMs - start) / 1000;
    return second < 600 || second >= 900;
  });
  await page.addInitScript(({ sessions, tracedSessionId, traceSamples }) => {
    // Exercise Capacitor's actual registerPlugin/proxy path, replacing only the
    // device transport. This is not a physical Bluetooth or Android service test.
    const promiseMethods = names => names.map(name => ({ name, rtype: 'promise' }));
    const byId = Object.fromEntries(sessions.map(session => [session.id, session]));
    window.androidBridge = {};
    window.__watchNativeCalls = [];
    window.Capacitor = {
      PluginHeaders: [
        { name: 'HeartRateNative', methods: [
          ...promiseMethods(['getStatus', 'getSessionTrace', 'getSessionSummary', 'listDevices', 'reconnectRemembered', 'removeListener']),
          { name: 'addListener', rtype: 'callback' },
        ] },
        { name: 'LocalNotifications', methods: [
          ...promiseMethods(['createChannel', 'getPending', 'cancel', 'checkPermissions', 'removeListener']),
          { name: 'addListener', rtype: 'callback' },
        ] },
      ],
      nativeCallback: () => 'watch-gate-listener',
      nativePromise: async (plugin, method, options = {}) => {
        window.__watchNativeCalls.push({ plugin, method, sessionId: options.sessionId });
        if (plugin === 'LocalNotifications') {
          if (method === 'getPending') return { notifications: [] };
          if (method === 'checkPermissions') return { display: 'granted' };
          return {};
        }
        if (method === 'getStatus') return { available: true, state: 'lost', title: 'Saved recording', detail: 'Browser acceptance fixture' };
        if (method === 'listDevices') return { devices: [] };
        if (method === 'reconnectRemembered') return { started: false };
        const session = byId[options.sessionId];
        if (method === 'getSessionSummary') return { summary: session?.heartRate ?? { sampleCount: 0, gapCount: 0 } };
        if (method === 'getSessionTrace') return {
          sessionId: options.sessionId, version: 1,
          startedAtEpochMs: Date.parse(session.startedAt), endedAtEpochMs: Date.parse(session.endedAt),
          summary: session.heartRate, samples: options.sessionId === tracedSessionId ? traceSamples : [],
        };
        return {};
      },
    };
  }, { sessions: initial.sessions, tracedSessionId: latest.id, traceSamples: samples });
}

async function openFixture(browser, kind, theme = 'silent-black', width = 390, nativeTrace = false) {
  const context = await browser.newContext({ viewport: { width, height: width > 600 ? 900 : 844 }, deviceScaleFactor: 1, serviceWorkers: 'block' });
  const page = await context.newPage();
  const label = `${kind}/${theme}/${width}`;
  page.on('pageerror', error => errors.push(`${label}: ${error.message}`));
  page.on('console', message => { if (message.type() === 'error') errors.push(`${label}: ${message.text()}`); });
  await page.addInitScript(({ initial, selectedTheme }) => {
    // Apply fixture replacement after the previous document's pagehide save.
    const replacement = sessionStorage.getItem('watch-gate.next-state');
    if (replacement) {
      localStorage.setItem('marc.state.v1', replacement);
      sessionStorage.removeItem('watch-gate.next-state');
    }
    if (!localStorage.getItem('marc.state.v1')) localStorage.setItem('marc.state.v1', JSON.stringify(initial));
    localStorage.setItem('marc.theme', selectedTheme);
  }, { initial: fixture(kind), selectedTheme: theme });
  if (nativeTrace) await installNativeTraceFixture(page);
  await page.goto(`${URL}#coach`);
  await page.getByRole('heading', { name: 'What to do next' }).waitFor();
  return { context, page };
}

async function replaceFixture(page, kind) {
  await page.evaluate(initial => sessionStorage.setItem('watch-gate.next-state', JSON.stringify(initial)), fixture(kind));
  await page.reload();
  await page.getByRole('heading', { name: 'What to do next' }).waitFor();
}

async function noHorizontalOverflow(page, label) {
  const excess = await page.evaluate(() => ({ viewport: innerWidth, page: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
  assert.ok(excess.page <= excess.viewport + 1 && excess.body <= excess.viewport + 1, `${label}: horizontal overflow ${JSON.stringify(excess)}`);
}

const server = spawn(process.execPath, [join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', PORT, '--strictPort'], { cwd: ROOT, stdio: ['ignore', 'pipe', 'pipe'] });
let serverFailure = '';
server.stderr.on('data', chunk => { serverFailure += String(chunk); });
server.on('error', error => { serverFailure += error.message; });
process.on('exit', () => { try { server.kill(); } catch { /* server has exited */ } });
let browser;
try {
  for (let tries = 0; ; tries++) {
    if (server.exitCode != null) throw new Error(`Preview exited: ${serverFailure}`);
    try { if ((await fetch(URL)).ok) break; } catch { /* Wait for Vite to bind. */ }
    if (tries > 120) throw new Error(`Preview did not start: ${serverFailure}`);
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  browser = await chromium.launch({ ...(process.env.MARC_CHROMIUM ? { executablePath: process.env.MARC_CHROMIUM } : {}), args: ['--no-sandbox'] });

  for (const [kind, message] of [
    ['empty', /No heart-rate recording for this workout/],
    ['short', /Record at least 3 minutes/],
    ['limited', /covered 40%.*at least 70%/],
    ['insufficient', /0 of 3 prior comparable workouts/],
  ]) {
    const { context, page } = await openFixture(browser, kind);
    const panel = page.getByTestId('watch-insights');
    await panel.waitFor();
    assert.match(await panel.innerText(), message, `${kind}: explicit quality or baseline explanation`);
    assert.equal(await panel.getByLabel('Similar workout comparison').count(), 0, `${kind}: comparison withheld`);
    assert.equal(await page.getByRole('heading', { name: 'Pulse higher at similar recorded work' }).count(), 0, `${kind}: no physiological trend insight`);
    await noHorizontalOverflow(page, kind);
    await page.screenshot({ path: join(OUT, `${kind}.png`), fullPage: true });
    if (kind === 'empty') {
      await page.getByRole('button', { name: 'Today', exact: true }).click();
      assert.equal(await page.getByTestId('watch-insights').count(), 0, 'No recording: Today stays uncluttered');
    }
    await context.close();
  }

  const { context, page } = await openFixture(browser, 'ready');
  const panel = page.getByTestId('watch-insights');
  await panel.waitFor();
  assert.equal(await panel.getAttribute('data-state'), 'ready');
  assert.match(await panel.innerText(), /21 bpm higher.*116 bpm median across 3 comparable workouts/);
  await page.getByRole('heading', { name: 'Pulse higher at similar recorded work' }).waitFor();
  assert.match(await panel.getByLabel('Similar workout comparison').innerText(), /137[\s\S]*116[\s\S]*\+21/);
  assert.match(await panel.innerText(), /Logged effort: similar/);
  await panel.getByRole('img', { name: 'Average heart rate by recent workout; use the session buttons below for details' }).waitFor();

  // Inspect an earlier workout, then return to latest: selected evidence must change with it.
  const oldSession = fixture().sessions[0];
  await panel.getByRole('button', { name: `Inspect Push on ${oldSession.day}`, exact: true }).click();
  assert.equal(await panel.getByRole('button', { name: `Inspect Push on ${oldSession.day}`, exact: true }).getAttribute('aria-pressed'), 'true');
  assert.equal(await panel.getAttribute('data-state'), 'warming-up');
  assert.match(await panel.innerText(), /0 of 3 prior comparable workouts/);
  assert.equal(await panel.getByLabel('Similar workout comparison').count(), 0, 'Earlier session must not borrow future baseline');
  assert.match(await panel.locator('.hr-session-summary').innerText(), /115/, 'Selected summary follows the earlier workout');
  const latest = fixture().sessions.at(-1);
  await panel.getByRole('button', { name: `Inspect Push on ${latest.day}`, exact: true }).click();
  assert.equal(await panel.getAttribute('data-state'), 'ready');
  await panel.getByText('How watch insights work', { exact: true }).click();
  assert.match(await panel.innerText(), /data-quality rules, not health thresholds/);

  // Restoring or editing persisted history must recompute the derived insight after boot.
  await replaceFixture(page, 'updated');
  await page.getByRole('heading', { name: 'Pulse close to your usual range' }).waitFor();
  assert.match(await page.getByTestId('watch-insights').innerText(), /116 bpm, close to your 116 bpm median/);
  assert.equal(await page.getByRole('heading', { name: 'Pulse higher at similar recorded work' }).count(), 0);
  await replaceFixture(page, 'deleted');
  assert.equal(await page.getByTestId('watch-insights').getAttribute('data-state'), 'warming-up');
  assert.match(await page.getByTestId('watch-insights').innerText(), /2 of 3 prior comparable workouts/);
  assert.equal(await page.getByTestId('watch-insights').getByLabel('Similar workout comparison').count(), 0, 'Deleting latest recomputes baseline');
  await context.close();

  for (const theme of themes) {
    for (const width of [320, 390, 1280]) {
      const { context, page } = await openFixture(browser, 'ready', theme, width);
      assert.equal(await page.locator('html').getAttribute('data-theme'), theme);
      await page.getByTestId('watch-insights').waitFor();
      await noHorizontalOverflow(page, `${theme}/${width}/coach`);
      await page.screenshot({ path: join(OUT, `${theme}-${width}-coach.png`), fullPage: true });
      await page.getByRole('button', { name: 'Today', exact: true }).click();
      await page.getByTestId('watch-insights').waitFor();
      assert.equal(await page.getByTestId('watch-insights').getAttribute('data-state'), 'ready');
      await noHorizontalOverflow(page, `${theme}/${width}/today`);
      await page.screenshot({ path: join(OUT, `${theme}-${width}-today.png`), fullPage: true });
      await page.getByRole('button', { name: 'History', exact: true }).click();
      await page.getByRole('tab', { name: 'Stats', exact: true }).click();
      await page.getByTestId('watch-insights').waitFor();
      assert.equal(await page.getByTestId('watch-insights').getAttribute('data-state'), 'ready');
      await noHorizontalOverflow(page, `${theme}/${width}/stats`);
      await page.screenshot({ path: join(OUT, `${theme}-${width}-stats.png`), fullPage: true });
      await context.close();
    }
  }

  // The native transport fixture exercises the production async trace renderer,
  // range input, contact-loss discontinuities and missing-signal discontinuities.
  for (const theme of ['silent-black', 'paper']) {
    const { context, page } = await openFixture(browser, 'ready', theme, 320, true);
    const trace = page.getByTestId('watch-insights').locator('.watch-trace');
    const svg = trace.getByRole('img', { name: 'Workout heart rate in BPM over elapsed minutes, with breaks for missing signal' });
    await svg.waitFor();
    const path = await svg.locator('path').getAttribute('d');
    assert.equal((path.match(/M/g) || []).length, 3, 'Trace breaks for both bad contact and missing signal');
    assert.match(await trace.locator('[aria-live="polite"]').innerText(), /0\.0 min · 110 BPM/);
    const range = trace.getByRole('slider', { name: 'Explore workout heart rate' });
    await range.focus();
    await range.press('End');
    assert.match(await trace.locator('[aria-live="polite"]').innerText(), /30\.0 min · 145 BPM/);
    await range.press('Home');
    assert.match(await trace.locator('[aria-live="polite"]').innerText(), /0\.0 min · 110 BPM/);
    assert.equal(await page.evaluate(() => window.__watchNativeCalls.some(call => call.method === 'getSessionTrace' && call.sessionId === 'push-latest')), true);
    await noHorizontalOverflow(page, `${theme}/320/native-trace`);
    await page.locator('.hr-session-summary').screenshot({ path: join(OUT, `${theme}-320-native-trace.png`) });
    await context.close();
  }
  assert.deepEqual(errors, [], 'No browser errors');
  console.log('Watch Coach browser gate PASS: quality withholding, comparable-workout insight, selection, history updates/deletion, 5 themes × 3 widths × 3 views, mocked-native trace interaction and signal gaps; no browser errors.');
} finally {
  await browser?.close();
  server.kill();
}

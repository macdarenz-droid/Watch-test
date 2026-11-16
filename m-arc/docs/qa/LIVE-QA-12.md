# Live QA round 12: b4 phone features and launch animation, F11 + O1 + A4 (PR #24)

Checked PR #24 at 8b46ba6 with three reviewers: code, native and CI safety; UI and launch timing; and tests. A second agent tried to disprove every finding. 3 held up and 1 was rejected as already on main.

## What passes
- **CI and signing:**
  - build-apk.yml and release-apk.yml only add NativeUiPlugin checks;
  - MainActivity only registers the plugin;
  - prepare-android.sh only copies the file;
  - EXPECTED_SHA256, the signing steps, keystore handling and the watch lines are byte-for-byte the same as on main.
- **NativeUiPlugin.java:**
  - it runs on the UI thread;
  - the haptic map matches §3, with API-level guards;
  - a device without the vibrator primitives falls back safely;
  - unknown input is ignored;
  - the method names match the TypeScript side.
- **Keep-awake:** App.tsx releases it on finish, on discard, when the setting is turned off, and on unmount. No leak path found.
- **Web:** haptics and keep-awake do nothing and never throw.
- **O1 matches the spec:**
  - timings, tap to skip, and the hard cap;
  - the crash box removes #launch first;
  - it runs on cold start only;
  - pointer-events are off as soon as it starts leaving.
- **F11:** the background is Silent Black's `#08090a`. Paper users seeing one dark frame is accepted in the spec.
- **Checks run:** vitest (1,152) and typecheck.

Fix the items below. Each needs a test or gate probe that fails before and passes after, with the id in the commit message.

## High

**QA12-1 · On a real first install, the welcome sheet covers the launch animation and swallows the skip tap.**
- **Cause:** App.tsx:108 mounts OnboardingSheet straight away, and the Sheet calls `showModal()` on mount (primitives.tsx:63).
  - A modal `<dialog>` always paints in the browser's top layer, above any z-index, including #launch's.
  - With an empty profile (a real fresh install), the dialog is open at 0 ms, `elementFromPoint` at the centre is the DIALOG, and a tap never reaches #launch.
  - The gate's "launch skip (O1)" probe seeds a complete profile and clicks with `force`, so it never tested this path.
- **Fix:**
  1. In index.html, where `leave()` removes #launch (and on any path that never shows it), dispatch `window.dispatchEvent(new Event('marclaunchgone'))`.
  2. Add a signal `launchOverlayGone = signal(!document.getElementById('launch'))`, set to true on that event.
  3. Gate every auto-opening sheet on it, starting with OnboardingSheet at App.tsx:108. The welcome sheet then opens only after the launch animation has left.
- **Gate probe:** use an empty localStorage (a real first run) under full motion.
  - At 300 ms, the element at the centre is inside #launch, not inside `dialog[open]`.
  - A real `page.mouse.click` at the centre removes #launch within 300 ms.
  - After that, the onboarding dialog opens.
  - The existing probe keeps its seeded case, and this probe is added next to it.

## Medium

**QA12-2 · Nothing proves keep-awake comes back on for a second workout.**
- **Why it matters:** the only check is the gate's "keepAwake (A4)" block, and it runs one start → finish.
- **Evidence:** a one-shot mutation ("keepAwake(true) only once per app lifetime") still passes the full gate.
- **Fix:** extend the block. After finishing, start a second workout, then assert that `window.__keepAwakeCalls` ends `[…, false, true]`.

## Low

**QA12-3 · Nothing proves reduced motion really skips the drawing animation.**
- **Evidence:** removal is timer-based, so a mutation that always calls `beginElement()` still passes the gate and vitest.
- **Fix:** in a `reducedMotion: 'reduce'` context, right after load, assert:
  - `getComputedStyle(path).strokeDashoffset === '0'`;
  - `#launch-dot`'s `getAttribute('cx') === '30'` and `getAttribute('cy') === '50'` (read the attributes; animateMotion moves the dot with a transform).

## Rejected
- **"haptics.ts web fallback has no tests":** true, but it's the same on main (F4) and this PR didn't change it. Noted for item 8.

## Re-check at e54279b: all three fixed
An independent check ran in a throwaway worktree. Each app change was put back one at a time; each test fails before the fix and passes after it:

| id | fix commit | before the fix | at e54279b |
|---|---|---|---|
| QA12-1 | db8ce84 + e54279b | onboarding shown unconditionally: at 300 ms the centre is the dialog, a real click never removes #launch | pass: #launch is hit, removed, then onboarding opens |
| QA12-2 | 6de7e9d | "keep awake once per app lifetime" mutation: calls end `[…, false, false]` | pass: calls end `[…, false, true]` |
| QA12-3 | 4bb4b25 | "always animate" mutation under reduced motion: dash offset 99.1 px, dot has no cx/cy | pass: offset 0 px, dot at 30/50 |

- **No loosening.** Every removed gate line comes back unchanged, with only `launchGone(…)` added after `waitForSelector('.nav')`. On purpose, the O1 timing probe doesn't use it.
- **`launchGone` hides no bug.** It waits up to 5 s for #launch to be gone; index.html's own cap removes it at 4 s. If #launch stayed, the next click would fail hard.
- **Other sheets.** OnboardingSheet is the only sheet that opens itself at start-up. It covers the first-run, watch and weekly-review prompts, and the new gate covers all three.
- **Checks run:** `npm run check` and `npm run test:tz` (1,152 tests each), and the full gate: "Screenshot gate PASS".
- **Still to do before merge:** the one-line only-sore gate fix, a gate bug already on main (it dates a check-in in UTC, so it fails in CI from 12:00 to 24:00 UTC), and a green CI. This PR merges after item 2.
- **Update, 13:40Z: CI green at 3217b32.** That commit is the one-line only-sore fix: the check-in now uses the pinned local day. All three checks pass: guard, source-gate and android-gate. The source-gate ran 13:22–13:36Z, inside the 12:00–24:00Z window where the old line failed at e54279b, so CI shows the fix working. Ready to merge once item 2 has merged.
- **Merged as item 3, 14:47Z, at 4ffc679.**
  - 3ecbf3b brings in main b204c87 (item 2) as a clean merge commit.
  - 4ffc679 adds `launchGone(…)` after `waitForSelector('.nav')` in PR #25's new gate blocks: 9 lines, nothing else.
  - Against main, all 44 gate lines this PR removes are `waitForSelector('.nav')` lines that come back with `launchGone` added. Every other line removed outside the gate is this PR's own reviewed change.
  - CI on 4ffc679 is green (guard, source-gate, android-gate), and main b204c87 CI was green.

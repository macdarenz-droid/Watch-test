# Live QA round 5: UI polish batch 1 (PR #14 @ 8913d74)

Checked against docs/UI-POLISH-PLAN.md (F1–F5) by three reviewers:

- **Spec conformance.**
- **Test and gate integrity.** check, test:tz and the gate all pass, and nothing was loosened.
- **Before/after screenshots.** These covered 5 themes, 390 and 360 px widths, and Reduce motion.

Every medium was confirmed by a skeptic. At normal motion, static screens look identical to main, which is what the plan intends for batch 1. The problems are mostly under Reduce motion, plus one focus regression.

Fix each one with a test where one is possible. Put the id in the commit message.

## Medium

### QA5-1 · Sheet panel autofocus takes focus away from inputs that used to get it on open
- **Where:** src/ui/primitives.tsx:67 (and the Sheet effect at :55-58)
- **Scenario:** When a dialog opens with showModal(), the browser focuses the first [autofocus] element in tree order. The .sheet-panel now has autofocus and comes before its children, so it always wins. I checked this in Chromium: on main, 'New split' (Train.tsx:252) opens with the caret in the name input. On the PR head, document.activeElement is DIV.sheet-panel. The same thing happens to the 'Add exercise' search box (ExercisePicker.tsx:30) and the 'Add my details' body-weight field (Onboarding.tsx:74). Users now have to tap the field before they can type. This is a behaviour change that the spec did not ask for.
- **Fix:**

In src/ui/primitives.tsx, inside the Sheet useEffect, add two lines just before `if (!d.open) d.showModal();`. They drop the panel's autofocus when a child already asks for focus:
```ts
const panel = d.querySelector<HTMLElement>('.sheet-panel');
if (panel?.querySelector('[autofocus]')) panel.removeAttribute('autofocus');
if (!d.open) d.showModal();
```
Keep `tabIndex={-1} autofocus` on the panel in JSX, so sheets with no autofocus child still focus the panel. `querySelector` searches only descendants, so it never matches the panel itself.

### QA5-2 · Under reduce, .btn and the small controls give no press feedback at all
- **Note:** the two skeptics disagreed on whether this breaks the plan's rule, but they agreed on the fix. Apply it: an instant opacity change, with no movement.
- **Where:** src/ui/styles.css:118 (.btn:active) and :123 (.chip-btn/.watch-pill/.esc-live-btn/.seg button/.tab/.unit-pill/.esc-chip-x :active)
- **Scenario:** Under reduce, the token block sets --scale-press and --scale-press-sm to 1, and these rules use scale only. I probed it in Chromium with reducedMotion 'reduce' and the mouse held down on Train's 'Start …' button: the computed transform is matrix(1,0,0,1,0,0) and background and opacity do not change. The same holds for .tab (scale 1). On main, the OS-reduce setting still gave .btn an instant scale(.97). So every primary button (Start, Set, Finish, Done) now gives zero feedback for reduce users, both OS and in-app. This breaks the §1/F3 rule 'Movement becomes crossfades, never zero feedback'.
- **Fix:**

In src/ui/styles.css, add one line right after line 123 (the small-control :active rule):

```css
html[data-motion="reduce"] :is(.btn, .chip-btn, .watch-pill, .esc-live-btn, .seg button, .tab, .unit-pill, .esc-chip-x):active { opacity: .7; }
```

Optional: for a gentle fade on release instead of an instant snap back, also add `html[data-motion="reduce"] :is(.btn, .chip-btn, .watch-pill, .esc-live-btn, .seg button, .tab, .unit-pill, .esc-chip-x) { transition: opacity var(--dur-press) var(--ease-standard); }`. Leave it out if you want the smallest change. That rule would also replace the .btn background and border colour transitions under reduce.

### QA5-3 · With only the in-app toggle on, the active exercise loses its highlight and its name stays a dim frozen gradient
- **Where:** src/ui/styles.css:222-225
- **Scenario:** The static fallback is still inside @media (prefers-reduced-motion: reduce), but F3 says CSS keys only off html[data-motion=reduce]. Probe: OS no-preference with localStorage marc.motion='reduce', then start a session. .exercise.active has box-shadow:none (no accent ring). .exname has color:transparent over the frozen gradient, which is mostly text-3 (rgb(98,102,109) on #0f1011, about 3.2:1). The live card is no longer marked, and its title falls below 4.5:1. The OS setting path is fine because both selectors match there.
- **Fix:**

In src/ui/styles.css, replace lines 222-225 (the whole @media (prefers-reduced-motion: reduce) { ... } block) with:
html[data-motion="reduce"] .exercise.active { box-shadow: 0 0 0 1px var(--accent), 0 0 20px -4px var(--accent); }
html[data-motion="reduce"] .exercise.active .exname { color: var(--text); background: none; -webkit-background-clip: unset; background-clip: unset; }
The OS-setting path still works because motion.ts sets data-motion when the OS asks for reduced motion. The new selectors (0,3,1) and (0,4,1) beat the base rules at :214-219. They contain no time literals or 'infinite', so the token lint still passes.

### QA5-4 · Under reduce, views now slide and the toast jumps about 73px sideways (on main, OS reduce had no animation)
- **Where:** src/ui/styles.css:89 (.view) and :195 (.toast); the old line 22 (animation:none under OS reduce) was deleted and nothing replaced it
- **Scenario:** Tested with reducedMotion 'reduce' at 390px. .view now runs view-in 0.15s, a 6px translateY, where main had 'none 0s'. For the toast, 'Test haptic' shows the toast with left=195 from 0 to about 190ms, at opacity 0.4 to 0.99, and then it snaps to left=122. The view-in keyframe replaces translateX(-50%) during the animation. On main under OS reduce the toast appeared centred at 122 straight away. So reduce users, OS or in-app, now see the sideways jump and a slide. That contradicts 'movement becomes crossfades' and the §6 b1 device check 'nothing slides under reduce'.
- **Fix:**

In src/ui/styles.css, add this directly after line 196 (`.toast button { ... }`):

```css
/* F3 interim: view-in and the toast still carry a hard-coded translate until I9/F13, so under reduce they only fade. Remove when I9 and F13 land. */
@keyframes fade-in { from { opacity: 0; } }
:where(html[data-motion="reduce"]) :is(.view, .toast) { animation-name: fade-in; }
```

- **Specificity:** `:where()` keeps the rule at (0,1,0), and it sits later in the file than .view and .toast, so it beats them by source order. A later `.toast.leaving` (F13, (0,2,0)) or `.reveal` rule is not overridden. The suggested `html[data-motion="reduce"] :is(...)` at (0,2,1) would have turned F13's toast-out into a fade-in under reduce.
- **What stays:** duration and easing stay on their tokens, and the toast keeps translateX(-50%).
- **Why .sheet-panel is left out:** it is not a regression (sheets already slid under reduce on main), and I6 owns it.

### QA5-5 · No gate probes for the F1/F2/F3 acceptance checks, and every context now forces OS reduce, so the in-app toggle and live listener are never tested
- **Where:** scripts/screenshot-gate.mjs:71 (all contexts now use reducedMotion:'reduce'; no probe of data-motion, marc.motion, --dur-sheet, tap-highlight, focus or press anywhere in the file)
- **Scenario:** The spec lists these as 'Gate:' acceptance checks: `--dur-sheet` 320 ms, and 150 ms under reduce (F1); tap-highlight transparent, press changes, focus-visible ring, onboarding activeElement is `.sheet-panel` (F2); data-motion follows emulateMedia live, the Settings 'Reduce motion' toggle writes `marc.motion` and survives reload, the toggle is disabled and checked under OS reduce, `.toggle` transition is 0.2s under reduce (F3). None of these is in the gate or in vitest (motion.ts has no state-machine test). I ran each one by hand and all pass today: activeElement DIV.sheet-panel, tapHighlight rgba(0, 0, 0, 0), data-motion null→reduce→null live, toggle false→true, marc.motion='reduce', persists after reload, disabled+checked under OS reduce, toggle 0.2s. PulseLine's `--pulse-beat` animates and goes to 0 live. Because every gate context is OS-reduce, every Settings shot shows the disabled toggle. So a break in `setMotionPref`, `apply()` or the `mq` change listener, or in the PulseLine rAF restart, would still pass the gate. The pulse block is kept at no-preference 'so the PulseLine rAF path stays covered', but it only checks that `.pulse-edge` is visible. Also, the built CSS minifies `320ms` to `.32s`: `getPropertyValue('--dur-sheet')` returns `.32s`, so the spec's literal '320ms' string check would fail as written.
- **Fix:**

In `scripts/screenshot-gate.mjs`, F5 motion-smoke block: insert this between `await page.waitForTimeout(400);` and the `Later` click (:856-857). No existing assertion changes.

```js
const ms = v => parseFloat(v) * (v.trim().endsWith('ms') ? 1 : 1000); // build minifies 320ms to .32s
const mstate = () => page.evaluate(() => ({ attr: document.documentElement.dataset.motion ?? null, sheet: getComputedStyle(document.documentElement).getPropertyValue('--dur-sheet'), pref: localStorage.getItem('marc.motion') }));
const f2 = await page.evaluate(() => ({ panel: !!document.activeElement?.classList.contains('sheet-panel'), tap: getComputedStyle(document.documentElement).webkitTapHighlightColor }));
if (!f2.panel) errors.push(`${tag}: onboarding sheet did not focus .sheet-panel`);
if (f2.tap !== 'rgba(0, 0, 0, 0)') errors.push(`${tag}: html tap highlight is ${f2.tap}`);
await page.getByRole('button', { name: 'Later' }).click().catch(() => {}); await page.waitForTimeout(250);
let m = await mstate();
if (m.attr !== null || ms(m.sheet) !== 320) errors.push(`${tag}: expected full motion, got ${JSON.stringify(m)}`);
await page.emulateMedia({ reducedMotion: 'reduce' });
if (!(await page.waitForFunction(() => document.documentElement.dataset.motion === 'reduce', null, { timeout: 2000 }).then(() => true).catch(() => false))) errors.push(`${tag}: OS reduce did not set data-motion live`);
if (ms((await mstate()).sheet) !== 150) errors.push(`${tag}: --dur-sheet is not 150ms under reduce`);
if ((await page.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations === Infinity).length)) !== 0) errors.push(`${tag}: infinite animation on Today under reduce`);
await page.emulateMedia({ reducedMotion: 'no-preference' });
if (!(await page.waitForFunction(() => !document.documentElement.dataset.motion, null, { timeout: 2000 }).then(() => true).catch(() => false))) errors.push(`${tag}: data-motion stayed after OS reduce went off`);
await page.locator('[data-palace="today.settings"]').click(); await page.waitForTimeout(300);
await page.getByRole('switch', { name: 'Reduce motion' }).click(); await page.waitForTimeout(100);
m = await mstate();
if (m.attr !== 'reduce' || m.pref !== 'reduce') errors.push(`${tag}: Reduce motion toggle did not apply: ${JSON.stringify(m)}`);
const td = await page.locator('.toggle').first().evaluate(el => getComputedStyle(el).transitionDuration);
if (td !== '0.2s') errors.push(`${tag}: .toggle transition-duration under reduce is ${td}`);
await page.reload(); await page.waitForSelector('.nav');
m = await mstate();
if (m.attr !== 'reduce' || m.pref !== 'reduce') errors.push(`${tag}: Reduce motion did not survive reload`);
await page.evaluate(() => localStorage.removeItem('marc.motion'));
await page.reload(); await page.waitForSelector('.nav');
```

Then delete the now-duplicate `Later` click and `waitForTimeout(250)` that follow. Removing `marc.motion` and reloading keeps the rest of the block at full motion.

In the pulse block, after the `.pulse-edge` check (:801), add:

```js
const beats = await page.evaluate(async () => { const s = new Set(); for (let k = 0; k < 8; k++) { s.add(document.documentElement.style.getPropertyValue('--pulse-beat')); await new Promise(r => setTimeout(r, 60)); } return s.size; });
if (beats < 2) errors.push(`pulse ${theme}: --pulse-beat is not animating`);
```

### QA5-6 · The determinism shots include the boot import toast on a 3 s timer, so the sha1 check can flake
- **Where:** scripts/screenshot-gate.mjs:939-951 (determinism block, twiceMatch 'today' / 'history' / 'live train clock')
- **Scenario:** The legacy fixture shows 'Imported N sessions from the previous version' (main.tsx:46, 3000 ms, no action). I timed three runs with a MutationObserver. The toast appears at about 120 ms and leaves at about 3130 ms after navigation. The History pair ends at about 2250 ms, which is only about 0.9 s before the toast leaves. The Train pair starts at about 3690 ms, about 0.55 s after. The fixed waits alone put Train shot A at 2.8 s or later. On a slower CI runner (2x-DPR screenshots under load), History shot B lands after the toast is gone. On a faster runner, the toast leaves between Train A and B. Either way the gate fails with '… was not identical 300ms apart' with no real regression. F13's toast exit animation (b3) widens this window. It passed in all 9 runs here, but the margins are under 1 s.
- **Fix:**

In scripts/screenshot-gate.mjs, directly after line 939 (`await page.getByRole('button', { name: 'Later' }).click().catch(() => {});`) and before the `waitForTimeout(250)` at :940, add:
  await page.locator('.toast').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
The boot import toast (main.tsx:46, 3 s, no action) then leaves before the Today, History and Train pairs, and every shot shows the settled screen. Verified: under CPU contention, 4 out of 4 runs failed without this line and 4 out of 4 passed with it.

## Low

### QA5-7 · The share carousel ignores the in-app Reduce motion toggle
- **Where:** src/slices/share/ShareSheet.tsx:31-33 (carouselScroll)
- **Scenario:** carouselScroll still reads matchMedia directly. With the OS setting off and Settings › Reduce motion on, tapping a share dot scrolls smoothly (behavior:'smooth'). F3 replaced every other direct read with reduced(), and the lens says the share sheet is included.
- **Fix:**

`import { reduced } from '@/ui/motion';` then change the function to `if (reduced()) return 'auto'; try { return matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'; } catch { return 'smooth'; }`. The existing test in tests/share-native.test.ts still passes because there is no document in node. Add one case that stubs `document` with `{documentElement:{dataset:{motion:'reduce'}}}` plus a matchMedia function and expects 'auto'.

### QA5-8 · Focus ring is below 3:1 in the Midnight theme
- **Where:** src/ui/styles.css:73 and :237 (outline: 2px solid var(--accent))
- **Scenario:** The Midnight accent #635bff measures 3.31:1 against bg, 2.98:1 against surface-1 (cards and sheets, where most controls sit), 2.66:1 against surface-2 and 2.29:1 against surface-3. Keyboard focus in the Settings sheet or on a card therefore fails the ≥3:1 non-text contrast F2 requires. The other four themes pass, with Paper lowest at 3.05:1 on surface-3. Separately, .list-row{overflow:hidden} (styles.css:163) clips the right edge of the ring on trailing toggles.
- **Fix:**

Add a token `--focus-ring: color-mix(in srgb, var(--accent) 80%, var(--text));` and use `outline: 2px solid var(--focus-ring)` in both rules. I computed at least 3.16:1 on bg and surface-1/2/3 in all 5 themes (Midnight: 4.57/4.11/3.67/3.16). For the clipping, add `.list-row:has(:focus-visible) { overflow: visible; }`.

### QA5-9 · .set-kind's all:unset undoes the F2 user-select:none and its background transition
- **Where:** src/ui/styles.css:235 (.set-kind { all: unset; … }), which comes after the rules at :71-72 and :125
- **Scenario:** In Chromium the set-kind button computes to user-select:auto, -webkit-user-select:auto and transition 'all 0s'. A long-press on a set label (W/D/F/number) can still select text, which F2 set out to stop. The press also has no 100ms release fade.
- **Fix:**

Append to the .set-kind rule at :235, after all:unset: `-webkit-user-select: none; user-select: none; -webkit-touch-callout: none; transition: background-color var(--dur-press) var(--ease-standard);`

### QA5-10 · The token lint misses literals in several valid CSS forms, and its view-transition check never matches
- **Where:** tests/ui/styles.tokens.test.ts:52 (declaration regex needs a ';'), :73 (view-transition regex), :92-98 (infinite check), :13 (ALLOW)
- **Scenario:** I appended each of these to styles.css in turn and the lint stayed green (7/7): `.x { transition: opacity 200ms }` (last declaration with no semicolon), `.x{color:red; transition: opacity .2s }`, `.x{animation: esc-fade var(--dur-base); animation-iteration-count: infinite;}`, and `::view-transition-old(root){animation-duration:200ms}` without a semicolon. `/::view-transition-[\w-]+\s*\{/` cannot match the `(name)` form that every such pseudo-element uses, and it checks only transition/animation properties where the spec says 'any declaration'. ALLOW also gains exercise-breathe and exercise-shimmer, which the spec does not list; they are marked b1-only.
- **Fix:**

Use `new RegExp('(?:^|[{;\\s])(' + DECL_PROPS.join('|') + ')\\s*:\\s*([^;}]+)', 'g')`. Add `expect(/animation-iteration-count\s*:\s*infinite/.test(withoutTokens)).toBe(false)`. Change the view-transition regex to `/::view-transition(?:-[\w-]+)?(?:\([^)]*\))?\s*\{([^}]*)\}/g` and test the whole body with TIME_RE. Run the detectors on a few synthetic bad snippets so the lint's own detection is covered by tests.

### QA5-11 · Some controls still show no press feedback: Escobar menu items, trained or selected calendar days
- **Where:** src/ui/styles.css:128-129 (.esc-menu button in the surface-2 group); :282/:284 (.cal .day.trained/.selected override :129)
- **Scenario:** The .esc-menu panel is itself surface-2 (:352), so `.esc-menu button:active{background:var(--surface-2)}` is invisible. `.cal .day.trained` and `.cal .day.selected` have the same specificity as `.cal .day:active` (0,3,0) and come later, so pressing a trained day, the usual tap target, changes nothing. This misses the F2 goal that every control answers the thumb.
- **Fix:**

Move `.esc-menu button` from lines 128/129 into the surface-3 group at 131/132. Change the calendar selector to `.cal .day:active:not(.selected)` (specificity 0,4,0) so it beats .trained.

### QA5-12 · Share dots animate width, which is not a compositor property
- **Where:** src/ui/styles.css:502 (.share-dots button::before transition: width)
- **Scenario:** The share sheet's active dot grows from 6px to 18px by animating width, so layout runs on every frame. The §1 Compositor-only rule allows only transform, opacity, translate, scale and colours, and the lens includes the share sheet. The lint does not check property names, so this passes.
- **Fix:**

Keep ::before as a static 6px dot. Add `::after { content:''; position:absolute; inset:0; margin:auto; width:18px; height:6px; border-radius:3px; background:var(--accent); opacity:0; scale:.34 1; transition: opacity var(--dur-base) var(--ease-standard), scale var(--dur-base) var(--ease-standard); }` with `.on::after{opacity:1;scale:1}` and `.on::before{opacity:0}`, and give the button `position:relative`. Alternatively, list it as an explicit exception in the spec next to grid-template-rows.

### QA5-13 · The disabled 'Reduce motion' switch looks enabled
- **Where:** src/ui/styles.css:167 (no .toggle:disabled rule); src/slices/settings/Settings.tsx:166
- **Scenario:** With the OS reduce setting on, the switch is checked and disabled, but its computed opacity is 1 and its cursor is pointer. Taps do nothing and give no feedback, so a sighted user sees a switch that seems broken.
- **Fix:**

Add `.toggle:disabled { opacity: .45; cursor: default; }`, matching .btn:disabled.

### QA5-14 · When restFix is switched on, smoke step (2) still won't check the rest clock the spec asks for
- **Where:** scripts/screenshot-gate.mjs:905-913
- **Scenario:** The spec (F5.3 step 2) says `.rest .clock` equals the configured total or total−1s, and the bar fill is at most 10%. The code reads `rest.clock` but only asserts `fillPct`. The F6 bug this step exists for is a stale 'total+1s' with a full bar. When b2a sets `HAS.restFix = true`, a fix that corrects the bar but still shows total+1s on the first frame would pass.
- **Fix:**

In the evaluate, also return `total: document.querySelector('.rest .hint')?.textContent?.replace(/^Rest · /, '')` (RestBanner prints `Rest · ${formatClock(totalSec)}`). Then add `const sec = s => s.split(':').reduce((a, n) => a * 60 + Number(n), 0); if (rest && ![sec(rest.total), sec(rest.total) - 1].includes(sec(rest.clock))) errors.push(`${tag}: first-frame rest clock ${rest.clock}, expected ${rest.total} or 1 s less`);`

### QA5-15 · One screenshot is taken without settle(), against F5.2
- **Where:** scripts/screenshot-gate.mjs:609
- **Scenario:** `await page.locator('.exercise.active').first().screenshot({ path: `${OUT}/${theme}-plate-pill.png` })` is the only evidence shot without `settle(page)` before it. F5.2 says settle goes before every direct screenshot. It runs 150 ms after typing and right after clicking a card to expand it. Once I2 (b2b) animates card open and close, this shot can catch the card mid-expand in any of the 5 themes.
- **Fix:**

`await settle(page); await page.locator('.exercise.active').first().screenshot({ path: `${OUT}/${theme}-plate-pill.png` });`

### QA5-16 · New 2px-offset focus ring is clipped on toggles, row buttons and split tabs
- **Where:** src/ui/styles.css:73 (outline-offset: 2px) together with :163 (.list-row overflow: hidden), :202 (.tabs-strip padding: 2px 0 8px, overflow-x: auto), :355 (.esc-thread overflow-y: auto, padding 12px 0)
- **Scenario:** Focus with the keyboard or a switch device. Toggles and trailing buttons (Settings 'Manage', every Settings and Escobar toggle) sit flush with the right edge of .list-row, so the right side of the ring is cut off. Split tabs lose the top of the ring. Base's auto ring was drawn inside the control and showed in full. Shots: pb1-shots/focus/zz-toggle.png, zz-tab.png, zz-esc-toggle.png, grid-sb-b.png ('Manage').
- **Fix:**

(1) `.list-row { overflow: clip; overflow-clip-margin: 4px; }` in place of overflow: hidden. min-width: 0 is already set, so truncation still works. Checked: pb1-shots/focus/zz-settings-toggle-asis-vs-fixed.png. (2) `.tabs-strip { padding: 4px 4px 8px; margin: -2px -4px 0; }`. Checked: the tab positions do not change and the full ring shows (fix-tab.png). (3) `.esc-thread { padding: 12px 4px; margin-inline: -4px; }`, because the thread is a scroll container and clips too.

### QA5-17 · Theme switch: theme cards (and card-press cards, dock) fade 150ms behind the rest of the sheet
- **Where:** src/ui/styles.css:114, :128, :131 (new background-color transitions on .card-press, .theme-card, .esc-dock); theme applied at src/theme/engine.ts:45
- **Scenario:** In Settings, tap Paper while on Silent Black. The sheet panel turns #f7f6f3 at once, but the other theme cards go #0f1011 → grey → light over about 150ms. Samples at +2/27/72/120ms: 15,16,17 / 143,142,141 / 210,209,207 / 243,242,239. So on every theme switch the cards show a grey flash that base did not have. Shot: pb1-shots/press/crop-theme-mid.png.
- **Fix:**

In engine.ts, just before setAttribute('data-theme', id): `doc.documentElement.classList.add('theme-switching'); requestAnimationFrame(() => requestAnimationFrame(() => doc.documentElement.classList.remove('theme-switching')));`. Then add CSS `html.theme-switching *, html.theme-switching *::before, html.theme-switching *::after { transition: none !important; }`. I tested this by injecting it: the cards change on the same frame as the panel.

### QA5-18 · The new colour-only press states can't be seen in the dark themes
- **Where:** src/ui/styles.css:126 (.effort button/.set-kind :active → surface-2), :129 (.theme-card/.cal .day/.esc-menu button :active → surface-2)
- **Scenario:** Silent Black. Pressing an effort 'I' button or a set-kind cell changes the background from transparent on #0f1011 to #141516. That is about a 1.03:1 contrast step and cannot be seen in a dark gym. Ember, Emerald and Midnight have the same ~5-unit step. Paper is fine. The press check in the gate passes because the computed value changes, but the plan's aim, 'every control answers the thumb', is not met for the most frequent tap. Shot: pb1-shots/press/grid-sb-small.png (columns: base rest, base down, head rest, head down).
- **Fix:**

Use a neutral overlay instead of surface-2: `.effort button:active, .set-kind:active { background: color-mix(in srgb, var(--text) 10%, transparent); }` and `.theme-card:active, .cal .day:active, .esc-menu button:active { background: color-mix(in srgb, var(--text) 8%, var(--surface-1)); }`.

### QA5-19 · 'Test haptic' now sits under the Reduce motion row
- **Where:** src/slices/settings/Settings.tsx:166-167
- **Scenario:** In Settings > Feedback, the new Reduce motion row is placed between 'Haptic feedback' and its 'Test haptic' button. The button now reads as belonging to Reduce motion. Shot: pb1-shots/sb390/15b-feedback-section-head.png.
- **Fix:**

Swap lines 166 and 167 so the order is Haptic feedback row, Test haptic button, then the Reduce motion row.

## Re-check of the QA5 fixes (PR #14 @ b2d0b94)

All 19 fixes work for the user. This was checked in real Chromium under three settings: normal motion, OS reduce, and the in-app toggle only. At normal motion, static screens still match main. QA5-6 through QA5-9 and QA5-11 through QA5-18 are done. Four follow-ups remain, all small:

### QA5-1b … QA5-4b · The four fixes have no regression test
The b2d0b94 gate still passes against the old 8913d74 build, so undoing these fixes would go unnoticed.

**Fix:** paste this block into scripts/screenshot-gate.mjs just before `// F5: determinism`. It was verified to pass on b2d0b94 and to fail on 8913d74 with 6 errors, covering QA5-1 (both fields), QA5-2, QA5-3 and QA5-4 (view and toast).

```js
// QA5-1..4 guards: in-app Reduce motion only (OS no-preference) — the path the old code broke.
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  const tag = 'in-app reduce';
  page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
  await page.addInitScript(([legacyJson]) => { if (!localStorage.getItem('marc.state.v1')) localStorage.setItem('dailyTrackerPremium', legacyJson); localStorage.setItem('marc.theme', 'silent-black'); localStorage.setItem('marc.motion', 'reduce'); }, [JSON.stringify(legacy)]);
  await page.goto(`http://localhost:${PORT}/`);
  await page.waitForSelector('.nav'); await page.waitForTimeout(400);
  const closeSheet = async () => { await page.locator('dialog[open] [aria-label="Close"]').last().click(); await page.waitForTimeout(250); };
  // QA5-1: a sheet whose form has an autofocus field opens with the caret in it, not on the panel.
  await page.getByRole('button', { name: 'Add my details' }).click(); await page.waitForTimeout(300);
  if (!(await page.evaluate(() => !!document.activeElement?.matches('dialog[open] input[inputmode="decimal"]')))) errors.push(`${tag}: 'Add my details' did not focus its body-weight field`);
  await closeSheet();
  await page.locator('.toast').waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  // QA5-4: a view fades in without moving.
  const moved = await page.evaluate(async () => {
    const seen = new Set();
    [...document.querySelectorAll('nav.nav button')].find(b => /^(Train|Live)$/.test(b.textContent.trim())).click();
    for (const t0 = performance.now(); performance.now() - t0 < 250;) { await new Promise(r => requestAnimationFrame(r)); const v = document.querySelector('.view'); if (v) seen.add(getComputedStyle(v).transform); }
    return [...seen].filter(t => t !== 'none');
  });
  if (moved.length) errors.push(`${tag}: .view moves on entry: ${moved.slice(0, 2).join(' | ')}`);
  await page.waitForTimeout(200);
  await page.locator('[data-palace="train.new-split"]').click(); await page.waitForTimeout(300);
  if (!(await page.evaluate(() => !!document.activeElement?.matches('dialog[open] input[placeholder="e.g. Upper A"]')))) errors.push(`${tag}: 'New split' did not focus its name field`);
  await closeSheet();
  // QA5-2: a primary button dims while pressed (scale is 1 under reduce).
  const start = page.getByRole('button', { name: /^Start / }).first();
  const bb = await start.boundingBox();
  await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2); await page.mouse.down(); await page.waitForTimeout(200);
  const pressOp = await start.evaluate(e => getComputedStyle(e).opacity);
  await page.mouse.move(1, 1); await page.mouse.up(); await page.waitForTimeout(150);
  if (!(+pressOp < 1)) errors.push(`${tag}: pressing Start gave no feedback (opacity ${pressOp})`);
  // QA5-3: the active exercise keeps a static ring and a solid name colour.
  await start.click(); await page.waitForTimeout(300);
  if (await page.getByRole('button', { name: 'Skip', exact: true }).isVisible().catch(() => false)) { await page.getByRole('button', { name: 'Skip', exact: true }).click(); await page.waitForTimeout(300); }
  await page.getByRole('button', { name: /^Start / }).first().click(); await page.waitForTimeout(400);
  const ax = await page.evaluate(() => { const e = document.querySelector('.exercise.active'); const n = e?.querySelector('.exname'); return e && n && { ring: getComputedStyle(e).boxShadow, name: getComputedStyle(n).color }; });
  if (!ax || ax.ring === 'none' || ax.name === 'rgba(0, 0, 0, 0)') errors.push(`${tag}: active exercise lost its ring or name colour: ${JSON.stringify(ax)}`);
  // QA5-4: the toast stays centred while it fades in.
  await page.locator('nav.nav button', { hasText: 'Today' }).click(); await page.waitForTimeout(250);
  await page.locator('[data-palace="today.settings"]').click(); await page.waitForTimeout(300);
  const xs = await page.evaluate(async () => {
    [...document.querySelectorAll('dialog[open] button')].find(b => b.textContent.trim() === 'Test haptic').click();
    const s = new Set();
    for (const t0 = performance.now(); performance.now() - t0 < 400;) { await new Promise(r => requestAnimationFrame(r)); const t = document.querySelector('.toast'); if (t) s.add(Math.round(t.getBoundingClientRect().left)); }
    return [...s];
  });
  if (xs.length !== 1) errors.push(`${tag}: toast moved while appearing: left ${xs.join(' -> ')}`);
  await ctx.close();
}
```

### QA5-5b · Two F2/F3 probes are still missing from the gate
**Found:** scripts/screenshot-gate.mjs:803-809 and :887-915. The code matches the spec exactly and no existing assertion was removed or loosened. npm run gate on b2d0b94 PASSES (exit 0). I checked the probes can fail by running a cut-down gate (the pulse, motion-smoke and determinism blocks) on deliberately broken b2d0b94 builds. Each break was caught with the right message: (1) mq change listener removed gives 'OS reduce did not set data-motion live' plus the 150ms error; (2) PulseLine stopped after one frame gives '--pulse-beat is not animating'; (3) tap highlight removed; (4) setMotionPref not saving gives 'toggle did not apply' and 'did not survive reload'; (5) reduce --dur-sheet set to 320ms; (6) data-motion never cleared gives 'stayed after OS reduce went off'; (7) .toggle on --dur-enter gives '0.15s'; (8) panel autofocus and tabIndex removed trips the '.sheet-panel' focus check. Removing only the panel's autofocus is not caught, but Chromium falls back to focusing the panel anyway, so the result is the same. On 8913d74 these probes pass, as expected: they guard behaviour that already worked there. Gap (a): the spec's 'toggle disabled and checked under OS reduce' check is still missing, although the commit message says it was added. Fix, after :185 (Settings under OS reduce): `const rm = await page.getByRole('switch', { name: 'Reduce motion' }).evaluate(e => ({ d: e.disabled, c: e.getAttribute('aria-checked') })); if (!rm.d || rm.c !== 'true') errors.push(`${theme}: Reduce motion switch under OS reduce is ${JSON.stringify(rm)}, expected disabled+checked`);`. I checked the live values are disabled true and aria-checked 'true'. Gap (b): the check at :902 can never fail. Today has 0 infinite animations even at full motion; the live-session check in the QA5-3 note replaces it.

**Fix:**

(a) Apply the claim's snippet after scripts/screenshot-gate.mjs:185 as written.

(b) Keep :902 (it guards Today against a future loop). After :726 (`let firstFeedbackMs = await measureFeedback(page);`), in the Escobar block (reducedMotion 'reduce'), add:
const loops = await page.evaluate(() => document.getAnimations().filter(a => a.effect && a.effect.getTiming().iterations === Infinity).map(a => a.animationName));
if (loops.length) errors.push(`${tag}: infinite animation(s) while Thinking under reduce: ${loops.join(', ')}`);

(c) F2 probes: insert this new block before `// F5: determinism`:
{ const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true }); const page = await ctx.newPage(); const tag = 'F2 press/focus';
page.on('pageerror', e => errors.push(`${tag}: ${e.message}`));
await page.addInitScript(([legacyJson, t]) => { if (!localStorage.getItem('marc.state.v1')) localStorage.setItem('dailyTrackerPremium', legacyJson); localStorage.setItem('marc.theme', t); }, [JSON.stringify(legacy), 'silent-black']);
await page.goto(`http://localhost:${PORT}/`); await page.waitForSelector('.nav'); await page.waitForTimeout(400);
const onbRing = await page.evaluate(() => [...document.querySelectorAll('dialog[open] button')].filter(b => getComputedStyle(b).outlineStyle !== 'none').length);
if (onbRing) errors.push(`${tag}: ${onbRing} onboarding button(s) show a focus ring`);
await page.getByRole('button', { name: 'Later' }).click().catch(() => {}); await page.waitForTimeout(250);
const press = async (l, prop) => { const b = await l.boundingBox(); const read = () => l.evaluate((e, p) => getComputedStyle(e)[p], prop); const rest = await read(); await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); await page.waitForTimeout(120); const down = await read(); await page.mouse.up(); await page.waitForTimeout(250); const back = await read().catch(() => rest); if (down === rest || back !== rest) errors.push(`${tag}: press ${prop} rest=${rest} down=${down} +250ms=${back}`); };
await press(page.locator('.nav button svg').first(), 'opacity');
await page.locator('[data-palace="today.settings"]').click(); await page.waitForTimeout(400);
await press(page.locator('dialog[open] .seg button').first(), 'scale');
await press(page.locator('dialog[open] .theme-card').first(), 'backgroundColor');
await page.keyboard.press('Tab');
const kb = await page.evaluate(() => ({ cls: document.activeElement?.className, o: getComputedStyle(document.activeElement).outlineStyle }));
if (kb.o !== 'solid') errors.push(`${tag}: keyboard Tab focus ring is ${JSON.stringify(kb)}`);
await page.locator('dialog[open] .seg button').first().click(); await page.waitForTimeout(100);
const mc = await page.evaluate(() => ({ cls: document.activeElement?.className, o: getComputedStyle(document.activeElement).outlineStyle }));
if (mc.o !== 'none') errors.push(`${tag}: mouse click shows a focus ring ${JSON.stringify(mc)}`);
await page.keyboard.press('Escape'); await page.waitForTimeout(300);
await press(page.locator('.btn', { hasText: 'Take today off' }), 'transform');
await ctx.close(); }

This block runs in its own context, so clicking 'Take today off' cannot affect the determinism shots. My CSS breaks did not include a theme-card one, so I have not shown that the theme-card check can fail.

### QA5-10b · The token lint still misses a literal in a custom property inside a view-transition body
**Found:** 4404efd. The declaration regex, the (name) form of ::view-transition-*, and the animation-iteration-count longhand are fixed, with self-tests. I appended all 4 QA snippets to styles.css: each now fails the lint. What is left: tests/ui/styles.tokens.test.ts:86 still checks the view-transition body only through findDeclarations (transition/animation properties), not the whole body the spec asked for. `::view-transition-group(root){animation-name:x; --vt-d: 200ms}` still passes (checked: 11/11 green). Fix: replace line 86 with `if (TIME_RE.test(m[1] ?? '')) offenders.push((m[1] ?? '').trim());`. Nit: the self-test at about :117 copies the regex instead of sharing one const with :82, so the two can drift apart. No gate was loosened.

**Fix:**

tests/ui/styles.tokens.test.ts:86. Replace
`      for (const decl of findDeclarations(m[1] ?? '')) if (TIME_RE.test(decl.value)) offenders.push(decl.value);`
with
`      if (TIME_RE.test(m[1] ?? '')) offenders.push((m[1] ?? '').trim());`

Optional nit:
- Hoist `const VT_RE = /::view-transition(?:-[\w-]+)?(?:\([^)]*\))?\s*\{([^}]*)\}/g;` next to TIME_RE (:44). Use `new RegExp(VT_RE)` at :82 and :119 so each use gets a fresh lastIndex.
- Change :122 to `expect(TIME_RE.test(m![1]!)).toBe(true);`.
- Add a self-test that `TIME_RE.test('animation-name:x; --vt-d: 200ms')` is true.

### QA5-19b · "Test haptic" still reads as part of Reduce motion
**Found:** b2d0b94, Settings.tsx:165-167. The order matches the spec. But the only divider is still the Haptic row's border-bottom, which sits between 'Haptic feedback' and 'Test haptic'. No divider separates 'Test haptic' from 'Reduce motion': it is now the last row, and .list-row:last-child has border 0. So the button, flush under the rule, still groups visually with the row below it. The section also got 1px shorter (460 vs 462 device px). Seen in the Feedback section crop, 8913d74 vs head. Fix: order the rows Reduce motion, Haptic feedback, then the Test haptic Button. The Haptic plus Test haptic pair then renders exactly like main's, just moved down.

**Fix:**

In src/slices/settings/Settings.tsx, move the Reduce motion `<Row …label="Reduce motion" …>` line (now line 167) up above the Haptic feedback Row (line 165). The Feedback card then reads:
  1. Reduce motion Row
  2. Haptic feedback Row
  3. `<Button size="sm" …>Test haptic</Button>` (still the last child)
Reduce motion is then no longer the last child, so it gets its own divider. The Haptic plus Test haptic pair renders exactly like main (Haptic row, its rule, then the button flush under it at the bottom of the card), and the card height goes back to 213.17 CSS px. This is a one-line move; nothing else changes.

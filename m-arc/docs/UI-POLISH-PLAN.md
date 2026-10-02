# M/ARC UI polish plan

Base: origin/main b047fd5. Line refs are origin/main. "Gate" = scripts/screenshot-gate.mjs. "unverified" = not checked against code, a device or an opened source.

## 1. Goal and principles

Goal: make every tap, transition and gesture in M/ARC feel deliberate and consistent on an Android phone in a dark gym.
Means: one token system for motion, type and space; a semantic haptic vocabulary; safe gestures with visible twins; fixes for concrete visual bugs.
Constraint: no loosened gate assertion, no new runtime dependency except one bundled font file, no lost data.

- **Calm first.** Motion only where a state change matters. Anything done 10+ times per session (typing a set, tab taps, steppers, effort taps, set-kind taps, live clocks) gets at most a colour/opacity change of ≤150ms, or nothing. Delight is reserved for rare peaks: PR, rest done, finish.
- **One motion system.** Every duration, easing, shift distance and press scale comes from the `:root` tokens in src/ui/styles.css. After batch 1 no literal ms/s/cubic-bezier appears outside the token block, except the allowlisted infinite loops `esc-rot, esc-blink, esc-pulse, esc-lift, palace-glow, esc-spin`. A vitest lint enforces it (F1).
- **Compositor only.** Animate `transform`, `opacity`, `translate`, `scale`. Colour transitions ≤200ms are allowed. The one layout exception is `grid-template-rows 0fr/1fr` on a single card body. Never `transition: all`.
- **Re-triggerable things use transitions or WAAPI** (toast, rest bar, sheet drag, reorder, seg thumb). `@keyframes` only for one-shot enters. Exits run ~65% of their enter and use `--ease-exit`.
- **No animated element is centred with `translateX(-50%)`.** The `scale` property multiplies an existing transform translation (CSS Transforms 2 matrix order), so it drifts a transform-centred element sideways. `.rest`, `.esc-dock` (F1) and `.toast` (F13) are centred with `left:0;right:0;margin-inline:auto`.
- **Reduced motion** (OS setting OR the in-app toggle; both set `html[data-motion="reduce"]`) zeroes every shift/scale token (lengths become `0px`) and clamps durations to 150ms in / 100ms out. Movement becomes crossfades, never zero feedback. Haptics stay on. Information-carrying fills (rest bar, hold-to-confirm) keep running.
- **Haptics:** one semantic name per event, fired on the same frame as the visual change, only through src/native/haptics.ts. Frequent events get a tick or nothing. Tab taps and segmented view switchers are silent. The celebratory success fires once per exercise per session.
- **No gesture loses data.** Every destructive action has an Undo toast (5000ms, the pattern at History.tsx:148) or hold-to-confirm with a tap-twice twin for TalkBack/keyboard. Every gesture has a visible button twin. No horizontal gesture starts within `EDGE_IGNORE_PX` (32px, unverified tuning) of either screen edge. No swipe between bottom tabs.
- **Themes and contrast.** Colours only via theme tokens or `color-mix()` on them. No `#fff` on semantic fills. Text ≥4.5:1, checked by gate probes in all 5 themes. At most one high-luminance fill per screen (no `btn-solid` on the live screen).
- **Tests.** Vitest runs only `tests/**/*.test.ts` in a node environment (vite.config.ts:26-28; no jsdom/happy-dom in package.json). DOM behaviour is checked in the gate; logic is extracted into pure helpers with vitest tests under `tests/`.
- **Gate stays green without loosening.** Constraints this plan must respect: autoreg line 'for the next set' visible (gate:128); rest clock keeps ticking after switching to Today (:121-126); repeated toast restarts its timer (:159-163); 360px set row keeps 102.5 visible and page ≤360px (:190-211); sheet Close then waitForTimeout(200) (:247); r6 row width check (:279-280); plate-sense suspect chip after reps blur (:549-551); `.target-link` click (:557); palace entries resolve (:575-604); 'Thinking…' within 150ms (:669). New anchors reuse existing data-palace ids where possible.

## 2. Motion, type and spacing tokens

File: src/ui/styles.css, inserted right after line 2, between the markers `/* tokens:start */` and `/* tokens:end */` (the lint strips exactly this range). Theme colours and `--radius-sm/md/lg/xl` stay per `[data-theme]` in src/theme/themes.ts:253-256.

```css
/* tokens:start */
:root {
  /* durations */
  --dur-press: 100ms; --dur-fast: 150ms; --dur-base: 200ms; --dur-enter: 240ms; --dur-exit: 160ms;
  --dur-sheet: 320ms; --dur-sheet-exit: 200ms; --dur-spring: 310ms; --dur-bounce: 460ms;
  --stagger: 40ms; --delay-content: 60ms;
  /* easings */
  --ease-standard: cubic-bezier(.2,0,0,1);      /* M3 standard: colour, opacity, small moves */
  --ease-enter: cubic-bezier(.05,.7,.1,1);      /* M3 emphasized-decelerate */
  --ease-exit: cubic-bezier(.3,0,.8,.15);       /* M3 emphasized-accelerate, exits only */
  --ease-drawer: cubic-bezier(.32,.72,0,1);     /* Vaul, sheets */
  --ease-linear: linear;                        /* timers, progress, hold fill */
  --ease-spring: var(--ease-enter);             /* fallback when linear() is unsupported */
  --ease-spring-bounce: var(--ease-enter);
  /* distances and scales */
  --shift-sheet: 100%; --shift-md: 16px; --shift-sm: 8px;
  --scale-in: .96; --scale-press: .97; --scale-press-sm: .95; --scale-press-card: .985;
  --lift-scale: 1.02; --scale-pop: .9; --scale-swell: 1.02; --enter-opacity: 1;
  /* type: size / line-height / tracking */
  --fs-cap: 11px; --lh-cap: 14px; --ls-cap: .06em;
  --fs-meta: 12px; --lh-meta: 16px;
  --fs-small: 13px; --lh-small: 18px; --ls-small: -.003em;
  --fs-body: 15px; --lh-body: 20px; --ls-body: -.009em;
  --fs-title: 17px; --lh-title: 22px; --ls-title: -.013em;
  --fs-stat: 22px; --lh-stat: 26px; --ls-stat: -.018em;
  --fs-h1: 28px; --lh-h1: 34px; --ls-h1: -.021em; --fs-h1-narrow: 24px;
  --fs-display: 40px; --lh-display: 44px; --ls-display: -.022em;
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600;
  /* space */
  --sp-1: 4px; --sp-2: 8px; --sp-3: 12px; --sp-4: 16px; --sp-5: 24px; --sp-6: 32px;
  /* radius (theme radii stay in themes.ts) */
  --radius-xs: 4px; --radius-pill: 999px;
  /* elevation */
  --shadow-float: 0 1px 2px rgba(0,0,0,.5), 0 12px 32px -8px rgba(0,0,0,.6);
  --shadow-thumb: 0 1px 2px rgba(0,0,0,.25);
  --scrim: rgba(0,0,0,.5);
  /* layout */
  --nav-h: 58px; --float-gap: 12px;
  --inset-b: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px));
  --float-bottom: calc(var(--nav-h) + var(--float-gap) + var(--inset-b)); /* = 70px + inset, same as today */
  --rest-h: 0px; /* RestBanner writes the real value on <html> (I1) */
  /* layers */
  --z-dock: 19; --z-nav: 20; --z-rest: 25; --z-toast: 30;
}
[data-theme="paper"] {
  --shadow-float: 0 1px 2px rgba(0,0,0,.08), 0 12px 32px -8px rgba(0,0,0,.18);
  --shadow-thumb: 0 1px 2px rgba(0,0,0,.12);
}
@supports (transition-timing-function: linear(0, 1)) {
  :root {
    /* derived by the research agent's own simulation of M3 spring params, not published values: unverified, tune by eye */
    --ease-spring: linear(0,0.123,0.351,0.562,0.725,0.838,0.912,0.955,0.979,0.992,0.998,1,1.001,1.001,1);          /* ζ0.9 k700, use with --dur-spring */
    --ease-spring-bounce: linear(0,0.106,0.323,0.554,0.748,0.889,0.978,1.025,1.043,1.044,1.036,1.026,1.016,1.008,1.003,1,0.998,0.998,0.998,0.999,1); /* ζ0.7 k500, 4.5% overshoot, use with --dur-bounce */
  }
}
html[data-motion="reduce"] {
  --shift-sheet: 0px; --shift-md: 0px; --shift-sm: 0px;
  --scale-in: 1; --scale-press: 1; --scale-press-sm: 1; --scale-press-card: 1;
  --lift-scale: 1; --scale-pop: 1; --scale-swell: 1; --enter-opacity: 0;
  --dur-enter: 150ms; --dur-sheet: 150ms; --dur-exit: 100ms; --dur-sheet-exit: 100ms;
  --dur-spring: 150ms; --dur-bounce: 150ms; --stagger: 0ms; --delay-content: 0ms;
  --ease-spring: var(--ease-standard); --ease-spring-bounce: var(--ease-standard);
}
/* tokens:end */
```

Notes: reduce lengths are `0px`, not `0`, so `calc(var(--shift-sm) / 2)` stays a length. `html[data-motion]` (0,1,1) beats `:root` inside `@supports` (0,1,0). Inputs stay 16px. Weight 700 only on `.plate` and `.effort button`; 650 is removed. Nested radius = `max(var(--radius-xs), calc(outer - inset))`. Layers: bg (page) → surface-1 (cards) → surface-2 (sheets, esc panel) → surface-3 (floating: .rest, .esc-dock, .esc-menu, .esc-pop, cards inside sheets, seg thumb). Tracks use a neutral alpha (I16), not a surface.

JS mirrors, new src/ui/motion.ts:
- `DUR = {press:100, fast:150, base:200, enter:240, exit:160, sheet:320, sheetExit:200, spring:310, bounce:460, stagger:40, delayContent:60}`
- `REDUCED_DUR = {...DUR, enter:150, sheet:150, exit:100, sheetExit:100, spring:150, bounce:150, stagger:0, delayContent:0}`
- `durFor(k) = reduced() ? REDUCED_DUR[k] : DUR[k]` (use for every WAAPI duration)
- `EASE = {standard, enter, exit, drawer, linear}` as the same strings; `springEase()` reads `getComputedStyle(document.documentElement).getPropertyValue('--ease-spring')`.
- `reduced(): boolean`, `onReducedChange(cb): () => void` (F3).

Gesture constants, new src/ui/gesture.ts: `SLOP_PX 8; AXIS_RATIO 1.2; VELOCITY_WINDOW_MS 100; FLING_PX_PER_MS 0.4; SHEET_CLOSE_FRACTION 0.25; SCROLL_LOCK_MS 100; RUBBER_MAX_PX 24; LONG_PRESS_MS 400; REORDER_HOLD_MS 320 (below 400 on purpose); SWIPE_COMMIT_FRACTION 0.5; SWIPE_FLING_MIN_PX 32; AUTOSCROLL_EDGE_PX 72; AUTOSCROLL_MAX_PX 20; TOAST_SWIPE_PX 45; TOAST_FLING_PX_PER_MS 0.11; EDGE_IGNORE_PX 32; HOLD_CONFIRM_MS 800; SCRUB_HOLD_MS 150`. Values from AOSP ViewConfiguration/ItemTouchHelper, Vaul and Sonner as cited by the research agents (§8); EDGE_IGNORE_PX, AXIS_RATIO and SCRUB_HOLD_MS are M/ARC tuning choices (unverified).

## 3. Haptic map

API (src/native/haptics.ts, replaces light/medium/success/warning): `tick, confirm, reject, toggle(on), longPress, dragStart, drop, threshold(on), success, alert`. Per-class throttle replaces the global 35ms (haptics.ts:12): tick/threshold 40ms; confirm/reject/toggle/longPress/dragStart/drop 80ms; success ≤1 per 1000ms; alert never throttled. `setHapticsEnabled` unchanged.

Backends, in order:
1. NativeUi plugin (A4), used only when `isNative()` and `(globalThis as any).Capacitor?.Plugins?.NativeUi` exists (pattern of src/native/watch.ts:38); if the call rejects or resolves `{played:false}`, fall through to 2. `performHapticFeedback`: tick=CLOCK_TICK; confirm=CONFIRM (API 30+) else VIRTUAL_KEY; reject=REJECT (30+) else LONG_PRESS; toggle=TOGGLE_ON/OFF (34+) else CLOCK_TICK; longPress=LONG_PRESS; dragStart=DRAG_START (34+) else LONG_PRESS; drop=GESTURE_END (30+) else none; threshold=GESTURE_THRESHOLD_ACTIVATE/DEACTIVATE (34+) else CLOCK_TICK. success/alert: VibrationEffect.Composition when all primitives are supported (A4 step 3), otherwise `{played:false}`.
2. Capacitor fallback: tick, toggle, threshold → none (never `selection*`, a 100ms buzz); confirm/drop → impact Light; reject/dragStart/longPress → impact Medium; success → notification Success; alert → `Haptics.vibrate({duration:120})` twice, 220ms apart.
3. Web: confirm `navigator.vibrate(10)`; success `vibrate(20)`; alert `vibrate([120,220,120])`; all others none.

| Event | Call | Why |
|---|---|---|
| Set commit (session.ts:197) | confirm | The core act; one short, crisp acknowledgement |
| Exercise done (session.ts:256) | done ? confirm : tick | Undo done is a lighter reversal |
| Start session (session.ts:116) | confirm | Commitment moment |
| Finish (session.ts:407) | success | Session peak |
| Log past session (session.ts:458) | confirm | Save acknowledged |
| PR on a committed set (F9) | success at +120ms after the commit confirm, once per exercise per session | Distinct second pulse marks the peak; repeats would cheapen it |
| Rest reaches 0, page visible, web only (I1) | alert, once per rest | On native the scheduled 'Rest done' notification already vibrates (notifications.ts:66-79, channel :16) |
| Rest 3-2-1 s left, visible, not heart mode (I1) | tick | Countdown felt without looking |
| Rest −15/+15 | tick | Small adjustment |
| Reorder lift (reorder.ts:43) / slot change (:55) / drop | dragStart / tick / drop | Pick-up, pass, settle |
| Unit-pill long-press fire (primitives.tsx:146) | longPress | Confirms the hidden action fired |
| Toggle (primitives.tsx:33) | toggle(newValue) | On/off feel differs |
| Escobar detent change (I7) | tick | Snap point felt |
| Swipe-delete arm / disarm (A5) | threshold(true) / threshold(false) | Tells the finger the release will delete |
| Hold-to-confirm complete (F10) | confirm | The hold is done |
| Chart scrub index change (A6) | tick (40ms class throttle) | Detents while reading values |
| CommitNumber out-of-range revert (primitives.tsx:97) | reject | Explains why the value snapped back |
| Settings 'Test haptic' (Settings.tsx:163) | confirm | Shows the real everyday feel, not a 210ms buzz |
| Settings Reset (Settings.tsx:212, today `haptic.warning()`) | confirm | Not an alert; the confirm card already guards it |

Silent: bottom-nav tab taps (remove App.tsx:96 haptic), Segmented view switchers (role=tablist, primitives.tsx:28), theme pick (remove Settings.tsx:128 haptic), typing, effort taps, set-kind taps, 'Log as planned' (its commit fires confirm), sheet open/close/drag-dismiss, toast show/dismiss, accordion open/close, scroll, re-tap scroll-to-top, reveals, the Undo tap.

## 4. Batches

| Batch | Tasks | What the user notices |
|---|---|---|
| b1 Foundations | F1, F2, F3, F4, F5 | No tap flash; every control responds under the thumb; quiet navigation; one short confirm per logged set; a Reduce motion switch |
| b2a Logging and rest (PR 1) | F6, I1, A9, F7, A1, A8, F9, F8 | Rest banner starts right, glides, shows the next set, ticks 3-2-1; logged sets look logged; one-tap 'Log 60 kg × 8'; keyboard Next moves through the set; PR pill pops once; bigger live targets |
| b2b Live card (PR 2) | I2, I3, I4, F10, I5, A2 | Cards fold smoothly and auto-advance; calm active card; coach notes behind 'Why'; Undo for removals, hold to discard; tidy finish screen; sticky live header with progress line |
| b3 Sheets and toasts | I6, A3, I7, F13 | Sheets slide up and down, pull to dismiss; coach sheet follows the finger; toasts centred, swipe away, easy Undo |
| b4 Native | A4, F11, O1 | Crisp phone-native clicks; screen stays on during a workout; no white flash at launch; a thin, smooth logo animation at launch |
| b5 Navigation and lists | I9, I10, I11, A5 | Tabs keep their scroll; re-tap goes to top; sliding segment thumb; lifted drag-reorder with auto-scroll; swipe to delete a past session; swipe months |
| b6 Charts | I12, A6, O4 | Crisp trend line with labels; current week obvious; scrub a chart to read values; work-by-effort bars per exercise (also in Escobar) |
| b7 Visual system | I13, I14, I15, I16, I17, I18, I19 | Real typeface; readable small text; calmer colour; visible layers; one spacing rhythm; even icons; designed empty state |
| b8 Body tab (owner picks, §6b) | O2, O3 | Muscle panel as a clear recovery timeline with real dates; recovery list as a ring grid grouped by the day each muscle is ready |

Order inside a batch = order in the table. Cross-batch dependencies: I1 needs F1 re-centring; F5 smoke (2) needs F6, smoke (1) needs I6; I2 scroll-margin uses A2's `--live-top-h` (falls back to 0); A3/A5/A6/F13 use the `track()` added in A3 and the gate `touchDrag` helper added in A3; I14's contrast probe needs the Paper text-2 change in I14 before I16 lands.

## 5. Tasks

### Fix

#### F1 Motion/type/space/elevation tokens, literal migration, token lint — must, b1
- **User sees:** 10 durations and 5 easings for similar jobs, so presses, toggles and sheets each feel different → nothing looks different yet; every later change is consistent and tunable in one place.
- **Files:** src/ui/styles.css, src/ui/motion.ts (new), src/ui/gesture.ts (new), tests/ui/styles.tokens.test.ts (new).
- **Spec:**
  1. Insert the §2 block after styles.css:2. Create motion.ts (§2 mirrors; `reduced()` reads `document.documentElement.dataset.motion === 'reduce'`; every module-load DOM access guarded by `typeof document !== 'undefined' && typeof matchMedia === 'function'`, because tests import it in node) and gesture.ts (constants only; `track()` arrives in A3).
  2. Migrate: :20 `.view` → `view-in var(--dur-fast) var(--ease-standard)` (keyframe body changes in I9). :46 `.card-press` → `transform var(--dur-press) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)`. :49 `.btn` → `transform var(--dur-press) var(--ease-standard), background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)`. :84-85 `.toggle`/`::after` → `var(--dur-base) var(--ease-standard)`. :188 `.muscle` fill 400ms ease → `var(--dur-base) var(--ease-standard)`. :396 reorder → `transform var(--dur-base) var(--ease-standard)`. :106 sheet-in → `var(--dur-sheet) var(--ease-drawer)` (body stays 24px/.4 until I6). :111 toast `view-in 200ms ease` → `var(--dur-base) var(--ease-standard)`. :256 esc-panel height `220ms cubic-bezier(...)` → `var(--dur-base) var(--ease-standard)` (removed in I7). :358, :387 esc-fade and :389 plan-day → `var(--dur-enter) var(--ease-enter)`.
  3. `bottom: calc(70px + inset)` at :174 and :337 → `var(--float-bottom)`. z-index 19/20/25/30 at :337/:96/:174/:111 → `--z-dock/--z-nav/--z-rest/--z-toast`.
  4. Re-centre without transform (no visual change): `.rest{left:0;right:0;margin-inline:auto;transform:none}` (keeps `width:calc(100% - 32px);max-width:560px`, :174); `.esc-dock{left:0;right:0;margin-inline:auto;width:max-content;transform:none}` (:337).
  5. tests/ui/styles.tokens.test.ts reads src/ui/styles.css, removes the `tokens:start…tokens:end` range, and fails on: (a) a time literal `/\b\d*\.?\d+m?s\b/` in `transition`, `transition-duration`, `transition-delay`, `animation`, `animation-duration`, `animation-delay`, or any declaration inside a `::view-transition-*` rule, unless the declaration's animation name is in `ALLOW=['esc-rot','esc-blink','esc-pulse','esc-lift','palace-glow','esc-spin']`; (b) `cubic-bezier(` or `transition:\s*all`; (c) `infinite` outside ALLOW; (d) `DUR`/`REDUCED_DUR` in motion.ts ≠ the CSS token values (parse both blocks). I14 and I17 extend it.
- **Acceptance:** `npm test` passes including the lint. `git grep -n 'cubic-bezier(' HEAD -- src/ui/styles.css` matches only lines inside the token range. In the gate, `getComputedStyle(document.documentElement).getPropertyValue('--dur-sheet').trim()` is `320ms`, and `150ms` after setting `data-motion=reduce`. `.rest` and `.esc-dock` rects in gate shots equal origin/main (±1px). Gate passes in all 5 themes.
- **Risk:** Low. A mistyped `var()` name falls back silently to 0s; the lint catches literals, not typos, so the implementer runs the gate and eyeballs sheet, toast and toggle.

#### F2 Touch hygiene: no WebView tap flash, one press language, focus-visible rings — must, b1
- **User sees:** Android paints a grey/blue flash on taps, most controls feel dead, long-press selects label text, and the first sheet shows a thick white focus ring → no flash; every control answers the thumb the same way; keyboard focus is a thin accent ring.
- **Files:** src/ui/styles.css, src/ui/primitives.tsx (Sheet).
- **Spec:**
  - `html{-webkit-tap-highlight-color:transparent}`. `button,[role=button],.card-press,.list-row.pressable,.chip-btn,.seg button,.tab,.toggle,.set-kind,.nav button,.theme-card,.cal .day,.watch-pill{-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}`. Inputs, textarea, `.esc-thread` and message text stay selectable.
  - Press language (transitions; press-in is instant or fast, release slower):
    1. `.btn`: base `transition: transform var(--dur-base) var(--ease-standard), background-color var(--dur-fast) var(--ease-standard), border-color var(--dur-fast) var(--ease-standard)`; `.btn:active{transform:scale(var(--scale-press));transition-duration:var(--dur-press)}` (replaces :50 `scale(.97)`).
    2. Small controls `.chip-btn,.watch-pill,.esc-live-btn,.seg button,.tab,.unit-pill,.esc-chip-x`: same timing, `:active{transform:scale(var(--scale-press-sm))}` (.95).
    3. Frequent controls, no scale (Calm rule): `.effort button,.set-kind{transition:background-color var(--dur-press) var(--ease-standard)}` and `:active{background:var(--surface-2);transition:none}`.
    4. Surfaces: `.card-press,.theme-card,.cal .day,.esc-menu button` `:active{background:var(--surface-2);transition:none}`, release `background-color var(--dur-fast) var(--ease-standard)`; `.card-press:active` also `transform:scale(var(--scale-press-card))`. `.list-row.pressable,.esc-past,.esc-dock` already sit on surface-2 (:82, :323, :337), so their `:active` uses `var(--surface-3)`; `.esc-dock` gets no scale.
    5. `.nav button svg{transition:opacity var(--dur-press) var(--ease-standard)}` `.nav button:active svg{opacity:.6;transition:none}` (no scale).
  - `:hover`: `git grep -n ':hover' origin/main -- src/ui/styles.css` finds none, so there is nothing to wrap. Rule for later work: any new `:hover` goes inside `@media (hover:hover) and (pointer:fine)`.
  - Focus: `:where(button,[role=button],a,[tabindex]):focus-visible{outline:2px solid var(--accent);outline-offset:2px}` and `.set-kind:focus-visible{outline:2px solid var(--accent);outline-offset:1px}` (needed: `all:unset` at :153 beats the zero-specificity `:where()`). Keep the input `:focus` rule (:9). Sheet (primitives.tsx:49-73): `.sheet-panel` gets `tabIndex={-1}` and the `autofocus` attribute (confirm it renders), plus `.sheet-panel:focus{outline:none}`, so `showModal()` focuses the panel instead of the Close button and TalkBack starts at the sheet. No JS pressed class.
- **Acceptance:** Gate (390×844, hasTouch): during `mouse.down` the computed value differs from rest and returns within 250ms of `mouse.up` for: transform on `.seg button`, `.tab`, `.chip-btn`, `.btn`; background on `.effort button`, `.set-kind`, `.theme-card`, `.list-row.pressable`; opacity on `.nav button svg`. `html` computed `-webkit-tap-highlight-color` is `rgba(0, 0, 0, 0)`. Keyboard Tab to a `.btn` gives `outline-style: solid`; a mouse click gives none. Onboarding shot: `document.activeElement` is `.sheet-panel` and no button has an outline. All 5 themes pass.
- **Risk:** Low. `user-select:none` on `[role=button]` could block copying a label; only controls are listed.

#### F3 Reduced motion: crossfade, not kill; live listener; in-app 'Reduce motion' — must, b1
- **User sees:** with the OS setting on, every transition is removed (toggles jump) yet sheets still slide, and there is no in-app switch → movement becomes gentle ≤150ms fades that follow the OS live, plus Settings › Feedback › 'Reduce motion'.
- **Files:** src/ui/styles.css, src/ui/motion.ts, src/main.tsx, src/ui/PulseLine.tsx, src/escobar/ui/typewriter.ts, src/escobar/palace/navigate.ts, src/escobar/ui/Thinking.tsx, src/ui/primitives.tsx, src/slices/settings/Settings.tsx.
- **Spec:**
  - Delete styles.css:22. motion.ts: `mq = matchMedia('(prefers-reduced-motion: reduce)')`; pref in localStorage `marc.motion` (`'reduce'` | absent), read/written in try/catch, no stored-state schema change. `apply()` sets `document.documentElement.dataset.motion='reduce'` when `mq.matches || pref==='reduce'`, else deletes it; `mq.addEventListener('change', apply)`; `onReducedChange(cb)` subscribes; `setMotionPref(p)` writes and applies. `apply()` runs at module load (guarded, F1). Import `@/ui/motion` as the first import of src/main.tsx (the real entry; it imports App at main.tsx:2).
  - CSS keys only off `html[data-motion="reduce"]`. Convert every `@media (prefers-reduced-motion: no-preference){…}` block (styles.css:136-143, 244, 252, 356, 386, 395) to `html:not([data-motion="reduce"]) …` selectors, and move their `@keyframes` out of the blocks. This also turns off the loops under reduce (`.escobar-mark.thinking` :253, `.esc-caret` :254, `.esc-spin` :255, `.palace-spotlight` :245, `.esc-lift` :357, `.plan-chip.pending` :388); no separate `:is()` rule. Colour/opacity transitions ≤200ms stay under reduce.
  - Replace direct `matchMedia` reads with `reduced()`: PulseLine.tsx:13-20 (plus `onReducedChange` to restart/stop its rAF), typewriter.ts:12-13, navigate.ts:44, Thinking.tsx:31.
  - Toggle (primitives.tsx:32-34): add `disabled?: boolean` → `disabled` and `aria-disabled` attributes.
  - Settings.tsx, 'Feedback' section (palace `settings.haptics`), Row after 'Haptic feedback': label 'Reduce motion', hint 'Always on when your phone asks for less motion.', trailing `<Toggle checked={mq.matches || pref==='reduce'} disabled={mq.matches} onChange={v => setMotionPref(v ? 'reduce' : null)}/>`.
- **Acceptance:** Gate with `emulateMedia({reducedMotion:'reduce'})`: `html[data-motion=reduce]` exists; switching to `no-preference` mid-page removes it without reload; `document.getAnimations()` has no infinite animation on Today or the Escobar thinking state. Toggling Settings › Reduce motion sets localStorage `marc.motion` and the attribute, and both persist after reload. `.toggle` computed `transition-duration` under reduce is `0.2s` (not `0s`). (The sheet reduce check moved to I6.)
- **Risk:** Low-medium. A missed `@media` block keeps a loop running under reduce; the smoke check (F5 step 3) and the acceptance above catch it.

#### F4 Haptic vocabulary: semantic API, per-class throttle, silent frequent taps — must, b1
- **User sees:** every tab tap buzzes, a set commit feels like a tab tap, and 'Test haptic' plays a 210ms buzz → navigation is quiet, a logged set gives one short confirm, and only real moments (finish, PR, rest over) are felt strongly.
- **Files:** src/native/haptics.ts, src/app/App.tsx, src/slices/workout/session.ts, src/slices/workout/reorder.ts, src/slices/settings/Settings.tsx, src/ui/primitives.tsx, tests/native/haptics.test.ts (new).
- **Spec:** Rewrite haptics.ts per §3 (API, throttle classes, backend order; NativeUi only when `isNative()` and the plugin exists; a rejected NativeUi call falls back to Capacitor). Call sites: App.tsx:96 remove `void haptic.light()`. session.ts:116 `confirm()`; :197 `confirm()`; :256 `if (done) haptic.confirm(); else haptic.tick()`; :407 `success()`; :458 `confirm()`. reorder.ts:43 `dragStart()`; :55 `tick()`. Settings.tsx:128 remove; :163 `confirm()`; :212 `warning()` → `confirm()`. primitives.tsx Toggle (:33) `haptic.toggle(!checked)`; CommitNumber revert branch (:97) `haptic.reject()`. Segmented: no haptic (it has none today). Keep `light/medium/success/warning` exported as deprecated aliases (→ confirm/dragStart/success/alert) for one release so parallel branches compile.
- **Acceptance:** tests/native/haptics.test.ts (vitest, fake timers, mock `@capacitor/haptics`, `isNative()=true`): without NativeUi, `tick()` calls nothing, `confirm()` calls impact Light, two `confirm()` 50ms apart fire once, `success()` twice within 1s fires once. With a mocked `Capacitor.Plugins.NativeUi`: `confirm()` then `tick()` 50ms later calls `NativeUi.haptic` for both (`{type:'confirm'}`, `{type:'tick'}`); a rejecting `NativeUi.haptic` makes `confirm()` call impact Light. `git grep -nE 'haptic\.(light|medium|warning)\(' -- src` returns nothing outside haptics.ts; no haptic in the App.tsx nav handler or the Settings theme onClick.
- **Risk:** session.ts is a 'Gate B' warning file (docs/AGENT-RULES.md:25); the change is 5 call-site swaps, mention it in the PR. On Android ticks are silent until A4 ships (intended).

#### F5 Gate: deterministic shots and a full-motion smoke check — must, b1
- **User sees:** nothing. Screenshots stop catching sheets and toasts mid-animation, so the gate stays reliable as motion is added.
- **Files:** scripts/screenshot-gate.mjs.
- **Spec:**
  1. Add `reducedMotion:'reduce'` to every `browser.newContext({...})` except the pulse block (:717), which stays no-preference so the PulseLine rAF path stays covered.
  2. Shared helper `settle(page)`: `page.evaluate(() => Promise.race([Promise.all(document.getAnimations().filter(a => a.playState === 'running' && a.effect && a.effect.getComputedTiming().endTime <= 1000).map(a => a.finished.catch(() => {}))), new Promise(r => setTimeout(r, 1000))]))`. It ignores long-running animations such as the I1 rest bar (endTime = remaining rest) and paused ones. Call it in `shot()` (:65) and before every direct `page.screenshot` (:207, :237, :552, :560, :571, :609, :733).
  3. New block 'motion smoke', no-preference context, silent-black, with `const HAS = { restFix: false, sheetExit: false }` at the top of the block (F6 flips `restFix`, I6 flips `sheetExit`; a false flag logs 'skipped'). (1) `sheetExit`: open Settings (`today.settings`), click Close; at +60ms `dialog.sheet[open].closing` exists; by +400ms no `dialog.sheet[open]`. (2) `restFix`: start a session, fill and blur set 1; within 100ms `.rest .clock` equals the configured total or total−1s, and the bar fill is at ≤10% (before I1: computed width; after I1: translate matrix e ≤ −0.9·track width). (3) Always: `document.getAnimations().filter(a => a.effect.getTiming().iterations === Infinity)` contains only `CSSAnimation`s whose `animationName` is in the F1 ALLOW list.
  4. Determinism: Today and History are each shot twice 300ms apart in one run and their PNG sha1s must match. The live Train shot uses `mask: [page.locator('.rest .clock'), <LiveClock element rendered at Train.tsx:322; implementer confirms the selector>]` and is compared the same way.
- **Acceptance:** `npm run gate` passes; the sha1 pairs match; the smoke block logs its skips before b2a/b3 and passes after. Existing assertions unchanged.
- **Risk:** Low. Reduced motion only shortens the time before the existing `waitForTimeout(200)` steps.

#### F6 Rest banner shows the wrong time and a full bar on its first frame — must, b2a
- **User sees:** right after logging a set the banner reads 1:31 of 1:30 with a full bar, then jumps to empty → it appears at 1:30 with an empty bar.
- **Files:** src/slices/workout/Train.tsx, scripts/screenshot-gate.mjs (flip `HAS.restFix`).
- **Spec:** Root cause: `acquireTicker()` runs in `useEffect` (Train.tsx:862), after paint, so the first frame reads a stale `nowMs`; remaining = total+1 makes `pct` negative (:884), the invalid negative width is dropped, and the block `<i>` renders full width. In RestBanner: `const now = Math.max(nowMs.value, Date.now()); const remaining = Math.min(a.rest.totalSec, restRemainingSec(a, now) ?? 0);` (reading `nowMs.value` keeps the subscription) and `pct = a.rest.totalSec ? Math.max(0, Math.min(100, 100 - (remaining / a.rest.totalSec) * 100)) : 100`. Optional: `batch(() => { nowMs.value = Date.now(); })` at the start of `acquireTicker` in src/app/clock.ts, tested in the existing tests/clock.test.ts.
- **Acceptance:** Gate smoke (2) passes. Gate :121-126 still passes.
- **Risk:** Very low.

#### F7 Logged sets look logged; fields don't move while typing — must, b2a
- **User sees:** a logged set looks identical to an unlogged one, the 'lb' conversion line appears mid-typing and grows the row, and digits shift as you type → the moment a set logs, its fields recede and its number turns into a green check, so the next set to do is the brightest row; nothing moves while typing.
- **Files:** src/slices/workout/session.ts, src/slices/workout/Train.tsx, src/ui/primitives.tsx, src/ui/styles.css.
- **Spec:** session.ts:79 `export const isCommitted`. Set row (Train.tsx:502): add ` committed` when `isCommitted(set)`. Set-kind button (:503): when committed and the kind is not warmup/drop/failure, render `<IconCheck size={16}/>` instead of `j+1`, `aria-label={`Set ${j+1}, logged. Options`}`; when committed, colour `var(--positive)` for any kind. CSS: `.set-grid input{transition:background-color var(--dur-fast) var(--ease-standard),border-color var(--dur-fast) var(--ease-standard)}` `.set-grid.committed input:not(:focus){background:transparent;border-color:var(--border-subtle)}` (text colour unchanged). No scale or bounce; the haptic stays `confirm` via commitSet. WeightInput (primitives.tsx:128-): render `.weight-approx` whenever `displayUnit && displayUnit !== entryUnit`, content `other ?? ' '`, and `.weight-approx{min-height:16px}`. Tabular digits: `input[inputmode="decimal"],input[inputmode="numeric"]{font-variant-numeric:tabular-nums}` (covers WeightInput :151, CommitNumber :100 and the reps inputs). No WeightInput onCommit (reps blur already commits, Train.tsx:509 with session.ts:184-185). No SuspectChip change (it already needs `set.at`, Train.tsx:576).
- **Acceptance:** Gate live flow: after fill+blur of set 1, `.set-grid.committed` count is 1 and its `.set-kind` contains an `svg`; committed vs draft input computed background differs in all 5 themes; with display unit ≠ entry unit, typing the first digit into kg does not change the row's `getBoundingClientRect().height`; kg input computed `font-variant-numeric` is `tabular-nums`. Gate :549-551 still passes.
- **Risk:** Low. session.ts is a Gate B warning file (one-word export).

#### F8 Live-screen tap targets ≥44px and one bright button at most — must, b2a
- **User sees:** sweaty one-handed taps miss Finish, Pause, set numbers, ±Set and Done (32-40px), and two near-white pills glare on the black live screen → every live control is at least 44px tall to the finger; ±Set become a clean stepper pair; 'Done with exercise' is the one accent button.
- **Files:** src/ui/styles.css, src/slices/workout/Train.tsx.
- **Spec:** `.btn-icon` (:58) width/min-height 40→44. `.set-grid input` (:151) min-height 40→44. `.set-kind` (:153) min-height 32→44 (width unchanged). `.esc-live-btn` (:344) 40→44. New `.btn-sm.tap{min-height:44px}` on Finish (:327, variant `solid` → `default`) and the warm-up toggle (:484). '+ Set'/'− Set' (:539-540): icon-only `<Button variant="quiet" class="btn-icon" aria-label="Add set">` / `aria-label="Remove last set"` with IconPlus/IconMinus 20. 'Done with exercise'/'Undo done' (:542): default size; 'Done with exercise' variant `solid` → `primary`, 'Undo done' stays `default`. `.watch-pill` (:170): keep 36px visual, `position:relative`, `::before{content:'';position:absolute;inset:-4px 0}`. 'See substitutes' (:479) becomes `<button type="button" class="link-btn">` with `.link-btn{position:relative;color:inherit;text-decoration:underline;font:inherit}` `.link-btn::before{content:'';position:absolute;inset:-8px -4px}`. The plates link (:468) keeps class `target-link` (gate :557) and no hit extension (its parent `.hint.ellipsis` clips, and a vertical extension would steal header taps). Same `::before` pattern elsewhere: `.seg button` inset `-5px 0`; `.tab` `-3px 0`; `.chip-btn` `-4px 0`; `.esc-chip-x` `-12px`; `.esc-link,.esc-drawer-toggle,.esc-drawer-item` `-6px 0`.
- **Acceptance:** Gate on live Train at 390 and 360px: for Finish, Pause, `.set-kind`, Add set, Remove last set, Done with exercise, See substitutes, `elementFromPoint(cx, cy±21)` resolves to the control or a descendant (`.watch-pill` in the watch-stub block). Gate :190-211 (360px) and :279-280 (r6 width) pass. At 360px the live topbar row does not wrap (its height equals one control row).
- **Risk:** Low. The set row grows ≤4px (effort row is already 48px, :158).

#### F9 Record badge: fixed layout, only when earned, one real celebration — must, b2a
- **User sees:** the trophy sits stacked above 'Record', flickers while typing digits, and a PR feels like any set → a small 'PR' pill with an inline green trophy pops in once when the record set is logged, and the phone gives a distinct second pulse.
- **Files:** src/slices/workout/Train.tsx, src/slices/workout/celebrate.ts (new), src/ui/styles.css, tests/workout/celebrate.test.ts (new).
- **Spec:** CSS (:169): `.pr-badge{display:inline-flex;align-items:center;gap:var(--sp-1);padding:2px 8px;border-radius:var(--radius-pill);font-size:var(--fs-meta);font-weight:var(--fw-semibold);color:var(--text);background:color-mix(in srgb,var(--positive) 14%,transparent);border:1px solid color-mix(in srgb,var(--positive) 35%,transparent)}` `.pr-badge svg{color:var(--positive)}` `.pr-badge.pop{animation:pr-pop var(--dur-bounce) var(--ease-spring-bounce)}` `@keyframes pr-pop{from{opacity:0;scale:var(--scale-pop)}}`. No trophy tilt. Train.tsx:524: render only when `pr && isCommitted(set)`, content `<IconTrophy size={16}/> PR`. celebrate.ts: `const seen = new Set<string>(); export function celebrateOnce(key: string): boolean` (true the first time). EntryCard `useEffect` over the sets: for each committed PR set whose id is not in a per-card `seenRef`, add it and set a `pop` state keyed by set.id, cleared after `durFor('bounce')`; if `celebrateOnce(`${a.startedAt}|${entry.exerciseId}`)`, `setTimeout(() => haptic.success(), 120)`. Seed `seenRef` with already-committed PR set ids on mount so a remount (tab switch) does not replay.
- **Acceptance:** tests/workout/celebrate.test.ts: same key twice → true, false. Gate: typing a record kg without committing shows no `.pr-badge`; after blur-commit `.pr-badge.pop` has a running `pr-pop` animation; after switching tabs and back the badge has no `.pop`. Badge svg centre y within ±2px of the text centre. WCAG ratio of `.pr-badge` text vs its composited background ≥4.5 in all 5 themes.
- **Risk:** Low. `isLiveRecord` still computes; only display changes.

#### F10 No silent data loss: Undo for removals, Delete set, hold-to-confirm — must, b2b
- **User sees:** 'Remove from this session', '− Set' and removing a split exercise delete work instantly, a wrong middle set can't be removed, and Discard uses a grey system dialog → every removal shows 'Removed · Undo' for 5 seconds, any set can be deleted from its menu, and Discard is a red 'Hold to discard' button that fills as you hold (screen readers: tap twice).
- **Files:** src/slices/workout/session.ts, src/slices/workout/splits.ts, src/slices/workout/Train.tsx, src/ui/primitives.tsx, src/ui/gesture.ts, src/ui/styles.css, src/app/ErrorBoundary.tsx, src/slices/settings/Settings.tsx.
- **Spec:**
  - session.ts: `insertEntry(at, entry)` and `insertSet(entry, at, set)` via `patchActive`, clamping `at`; they restore the exact objects (ids included) so heart/fidelity links survive. splits.ts: `insertExerciseInSplit(id, at, se)` restoring the exact `{exerciseId, sets}` object.
  - Train.tsx:553 Remove: `const e = a.entries[index]; removeEntry(index); setMenu(false); showToast(`${e.name} removed`, 'Undo', () => insertEntry(index, e));`. 'Remove last set' (:540): capture the last set; after `removeSet`, if `hasEntry(set)`, `showToast(`Set ${n} removed`, 'Undo', () => insertSet(index, n-1, set))`. Set menu sheet (≈:559-565): `<Button variant="danger" disabled={entry.sets.length<=1}>Delete set</Button>` with the same toast. Split editor Remove (:279): capture `se` and `i`, then toast 'Removed' with Undo → `insertExerciseInSplit(split.id, i, se)`.
  - primitives.tsx `HoldButton({label, onConfirm, ms = HOLD_CONFIRM_MS, size})`: `.btn.btn-danger.hold` with `style={{'--hold-ms': `${ms}ms`}}`. CSS: `.hold{position:relative;overflow:hidden}` `.hold::before{content:'';position:absolute;inset:0;transform-origin:left;transform:scaleX(0);background:color-mix(in srgb,var(--negative) 22%,transparent);transition:transform var(--dur-fast) var(--ease-standard)}` `.hold.holding::before{transform:scaleX(1);transition:transform var(--hold-ms) var(--ease-linear)}`. pointerdown or keydown Space/Enter (ignore `e.repeat`) adds `holding` and starts a timer; pointerup/leave/cancel/keyup before `ms` removes it; on timeout `try { haptic.confirm() } catch {}` then `onConfirm()`. Twin for TalkBack/keyboard: a click with `e.detail === 0` arms an inline state (label 'Tap again to confirm', 3000ms window); a second such activation confirms. `aria-label={`${label}, press and hold`}`. The fill runs under reduce (it is information). No app-state imports beyond haptics.
  - Uses: Train.tsx:356 `<HoldButton label="Hold to discard" onConfirm={() => { discardSession(); setFinishing(false); }}/>`. ErrorBoundary.tsx:28 `confirm()` → `HoldButton label="Hold to delete everything"` calling the existing branch. Settings.tsx:206 rescue-copy delete → `HoldButton size="sm" label="Hold to delete"`.
- **Acceptance:** Gate: remove exercise 2 → toast with Undo → Undo → entries deep-equal the pre-remove state. 'Remove last set' on a committed last set → Undo restores it with the same id and `at`. Delete set 2 of 3 → 2 left → Undo → 3 in the original order. Split editor remove → Undo restores position and sets. Discard: a 300ms mouse hold does nothing, an 850ms hold discards. Keyboard: focus + Enter once shows 'Tap again to confirm', Enter again confirms. `git grep -n 'confirm(' -- src` has no `window.confirm`/bare `confirm(` call.
- **Risk:** Medium. session.ts is a Gate B warning file. The ErrorBoundary renders after a crash, so HoldButton must not depend on app state.

#### F11 Cold start without a white flash — should, b4
- **User sees:** on launch the WebView may paint a light frame before the dark app (unverified on device) → one dark surface from launch to first frame.
- **Files:** capacitor.config.json.
- **Spec:** Add `"backgroundColor": "#08090a"` (valid option: node_modules/@capacitor/cli/dist/declarations.d.ts:59-64, "Background color of the Capacitor Web View"). The Android launch window background is generated by scripts/prepare-android.sh and is not in the repo; leave it unless the owner sees a flash.
- **Acceptance:** `npm run build` and the build-apk workflow pass. Owner device check: cold start in Silent Black shows no light frame. Paper users see at most one dark frame (accepted).
- **Risk:** Very low.

#### F13 Toast: no sideways jump, soft exit, readable Undo, swipe away — must, b3
- **User sees:** every toast appears shifted right by half its width, snaps to centre, then vanishes in one frame, and Undo is a small low-contrast word → toasts rise gently in the centre, slide away when done or flicked, pause while touched, and Undo is easy to read and hit.
- **Files:** src/ui/styles.css, src/ui/primitives.tsx, scripts/screenshot-gate.mjs.
- **Spec:** styles.css:111: `.toast{left:0;right:0;margin-inline:auto;width:max-content;max-width:calc(100% - 32px);transform:none;bottom:calc(124px + var(--inset-b));z-index:var(--z-toast);touch-action:none;box-shadow:var(--shadow-float);transform-origin:50% 100%;animation:toast-in var(--dur-enter) var(--ease-enter)}` `@keyframes toast-in{from{opacity:0;transform:translateY(var(--shift-sm)) scale(var(--scale-in))}}` `.toast.leaving{animation:toast-out var(--dur-exit) var(--ease-exit) forwards}` `@keyframes toast-out{to{opacity:0;transform:translateY(calc(var(--shift-sm) / 2))}}` `.toast button{position:relative;min-height:32px;padding:0 4px;margin-left:var(--sp-2);color:inherit;font-weight:var(--fw-semibold);text-decoration:underline;text-underline-offset:3px}` `.toast button::before{content:'';position:absolute;inset:-8px}`. Toast (primitives.tsx:75-80): keep 3000/5000ms and App.tsx keying by id (gate :159-163; App.tsx:107). `leave()`: add `leaving`, call `dismiss.current()` after `durFor('exit')`. The timer calls `leave()`; pause it on pointerdown on the toast and while `document.hidden`, resuming with the remaining time. Swipe: `track()` (A3) on the toast, axis x, or y downward only; follow 1:1 via `style.transform`; dismiss at `|d| ≥ TOAST_SWIPE_PX` or `v ≥ TOAST_FLING_PX_PER_MS` (animate out in the drag direction over `durFor('exit')`), else animate back over `durFor('spring')` with `springEase()`. A tap within slop stays a click.
- **Acceptance:** Gate no-preference: at 16ms after `showToast` the toast centre x is within ±1px of the viewport centre; after the timeout `.toast.leaving` exists and no `.toast` remains within 250ms; the button box is ≥32px tall and `elementFromPoint` at centre ±21px hits it; WCAG ratio of `.toast button` vs the toast background ≥4.5 in all 5 themes; gate :159-163 passes; `touchDrag` (A3) 60px right dismisses; a vertical `touchDrag` down 60px dismisses.
- **Risk:** Low. Long messages wrap inside the 32px gutters via max-width.

### Improve

#### I1 Rest timer: slide in/out, continuous bar, 3-2-1 ticks, a 'Go' swell, never covers content — must, b2a
- **User sees:** the banner pops in and out, the bar jumps once a second, the ±15/Skip buttons are small, and the banner hides the last button and toasts → it rises in, the bar glides continuously, the phone ticks at 3-2-1, the card swells once and says Go, the buttons are thumb-sized, and content and toasts sit above it.
- **Files:** src/slices/workout/Train.tsx, src/ui/styles.css.
- **Spec:** RestBanner (Train.tsx:859-900); needs F1 re-centring and F6.
  1. Mount/exit: keep the last rest in a ref; when `a.rest` becomes null render with class `leaving` for `durFor('exit') + 40`ms, then null. `.rest{animation:rest-in var(--dur-enter) var(--ease-enter)}` `@keyframes rest-in{from{opacity:0;translate:0 var(--shift-md)}}` `.rest.leaving{animation:rest-out var(--dur-exit) var(--ease-exit) forwards}` `@keyframes rest-out{to{opacity:0;translate:0 var(--shift-sm)}}`.
  2. Bar: `.bar>i{width:100%;transform:translateX(-100%)}` for the rest bar (remove the inline width/background). Effect keyed on `[a.rest.endsAt, a.rest.totalSec, !!a.pausedAt, done]`: cancel the previous animation; `ms = a.rest.endsAt - Date.now()`; `p0 = 1 - ms / (a.rest.totalSec * 1000)`; `anim = i.animate([{transform:`translateX(${(p0-1)*100}%)`},{transform:'translateX(0)'}],{duration:Math.max(0, ms), easing:'linear', fill:'forwards'})`; if paused `anim.pause()`. Heart mode keeps the time-based bar. The bar moves under reduce. Track: `.rest .bar{background:color-mix(in srgb,var(--text) 12%,transparent)}` (surface-3 track would vanish on the surface-3 banner).
  3. Done: `.rest.done .bar>i{background:var(--positive)}` `.rest.done{border-color:var(--positive)}` with `transition:background-color var(--dur-base) var(--ease-standard),border-color var(--dur-base) var(--ease-standard)`. When `done` flips false→true with `document.visibilityState==='visible'`, once per `endsAt`: add class `go` for `durFor('bounce')` (`.rest.go{animation:rest-go var(--dur-bounce) var(--ease-spring-bounce)}` `@keyframes rest-go{50%{scale:var(--scale-swell)}}`; becomes a no-op under reduce), and `if (!isNative()) haptic.alert()` (native: the scheduled notification vibrates; see §7 Later).
  4. Ticks: visible, not heart mode, remaining crossing 3, 2, 1 → `haptic.tick()` once each (last ticked second in a ref).
  5. Buttons: replace `size="sm"` on −15/+15/Skip/OK with class `rest-btn{min-height:44px;padding:0 12px}`.
  6. Space: effect `document.documentElement.toggleAttribute('data-rest', !!a?.rest)`; a ResizeObserver on `.rest` writes `--rest-h` on `<html>`; remove both on unmount. `html[data-rest] .app{padding-bottom:calc(var(--float-bottom) + var(--rest-h) + var(--sp-5))}` `html[data-rest] .toast,html[data-rest] .esc-dock{bottom:calc(var(--float-bottom) + var(--rest-h) + var(--float-gap))}`.
  7. Elevation per I16: `.rest{background:var(--surface-3);border-top:1px solid var(--border-strong);box-shadow:var(--shadow-float)}`.
  8. Clock size: `.rest .clock{font-size:var(--fs-display);line-height:var(--lh-display);font-weight:var(--fw-semibold);font-variant-numeric:tabular-nums}` (read from a bench about 1m away).
- **Acceptance:** Gate no-preference: after commit `.rest` has a running `rest-in`; the bar animation's `getComputedTiming().duration` ≈ remaining ms (±50); after −15 the old animation is cancelled and a new one exists; at +5s the bar's translate progress matches the clock within 2%; after Skip `.rest.leaving` exists and `.rest` is gone by 250ms. At the bottom of the live page, 'Add exercise to this session' has `rect.bottom ≤ .rest rect.top − 8`; a toast during rest has `rect.bottom ≤ .rest rect.top`. −15/+15/Skip boxes ≥44px tall. Gate :121-126 passes. Owner device check: 3-2-1 ticks after A4; exactly one vibration at 0 with the app open (notification only).
- **Risk:** Medium. The WAAPI bar must be rebuilt on every rest mutation (adjustRest, pause/resume, stop) or it drifts from the text clock (the +5s check covers it). `data-rest` also lifts the dock on other tabs (Dock.tsx:18 hides it only on live Train).

#### I2 Exercise card: smooth open/close, chevron turn, auto-advance — must, b2b
- **User sees:** cards snap open and shut, and after 'Done with exercise' the next card opens off-screen with a jump → the finished card folds while the next unfolds, and the page glides so the next exercise sits just under the header.
- **Files:** src/slices/workout/Train.tsx, src/ui/styles.css.
- **Spec:** EntryCard (Train.tsx:422-). Replace `{open && (<div class="stack-sm" …>)}` (:473) with `<div class={`ex-body ${open?'open':''} ${settled?'settled':''}`}><div class="ex-body-inner">{(open||closing) && <div class="stack-sm" style={{marginTop:12}}>…</div>}</div></div>`. `closing` is true from open→false until `transitionend` on `.ex-body` (or `durFor('enter')+60`ms); `settled` is set on `transitionend` while open and cleared before closing. CSS: `.ex-body{display:grid;grid-template-rows:0fr;transition:grid-template-rows var(--dur-enter) var(--ease-standard)}` `.ex-body.open{grid-template-rows:1fr}` `.ex-body-inner{min-height:0;overflow:clip;overflow-clip-margin:6px}` `.ex-body.open.settled .ex-body-inner{overflow:visible}` (focus rings, the palace spotlight :243 and effort hit areas are not clipped at rest) `.ex-body-inner>*{opacity:0;transition:opacity var(--dur-fast) var(--ease-standard)}` `.ex-body.open .ex-body-inner>*{opacity:1;transition-delay:var(--delay-content)}` `html[data-motion="reduce"] .ex-body{transition:none}`. Chevron (:471): drop the inline transform; `.chev{transition:transform var(--dur-base) var(--ease-standard);color:var(--text-3)}` `.chev.up{transform:rotate(180deg)}`. Header div (:464): `tabIndex={0}`, Enter/Space → `onToggle`, class `ex-head` with the F2 surface press. Skipped: inline opacity .55 → class `.skipped{opacity:.55;transition:opacity var(--dur-base) var(--ease-standard)}`. Auto-advance (onDone, :335): after `setOpen(next)`, wait for the next card's `.ex-body` transitionend (or `durFor('enter')+60`), then `el.scrollIntoView({block:'start', behavior: reduced() ? 'auto' : 'smooth'})` on a wrapper `div[data-entry-index]`. `.exercise{scroll-margin-top:calc(var(--live-top-h, 0px) + var(--sp-3))}`. Focus nothing (no keyboard pop-up).
- **Acceptance:** Gate no-preference: clicking a header gives `.ex-body` a running `grid-template-rows` transition during 50-200ms; at 400ms the inner has content with opacity 1 and `overflow: visible`. After 'Done with exercise' on exercise 1, within 900ms the next card's top is within `[live-top-h, live-top-h + 40]` of the viewport top. Keyboard: focus header, Enter toggles. Gate reorder test passes.
- **Risk:** Medium. `grid-template-rows` animation needs Chromium 107+ (unverified on the owner's WebView; fallback is instant). One card animates at a time.

#### I3 Active exercise: calm static highlight; no paint-heavy loops — must, b2b
- **User sees:** the live exercise title shimmers grey (reads as disabled) and the card pulses a glow for the whole workout → the active card carries a steady accent hairline, and the phone runs cooler.
- **Files:** src/ui/styles.css, src/ui/PulseLine.tsx.
- **Spec:** Delete styles.css:127-148 (the comment at :127-129, the :130 rule, the exercise-breathe and exercise-shimmer keyframes and uses, and the reduced-motion glow fallback). New: `.exercise{transition:border-color var(--dur-base) var(--ease-standard)}` `.exercise.active{border-color:color-mix(in srgb,var(--accent) 45%,var(--border))}` `.exercise.active .exname{color:var(--text)}`. The card stays surface-1 (inputs are surface-2, :8, so a surface-2 card would erase draft fields). No accent dot. PulseLine.tsx:19-25: write `--pulse-beat` on the PulseLine root via a ref instead of `document.documentElement`, and on `.heart-bpm-icon` elements (:368) via a cached `querySelectorAll` refreshed every 1000ms; pause the rAF while `document.hidden`.
- **Acceptance:** On the live screen no `exercise-*` animation is in `document.getAnimations()`. `document.documentElement.style.getPropertyValue('--pulse-beat')` is `''` while PulseLine runs (gate pulse block). The active card's computed border colour ≠ an inactive card's in all 5 themes.
- **Risk:** Low.

#### I4 Live card hierarchy: coach prose behind 'Why', sets visible without scrolling — should, b2b
- **User sees:** four grey coach paragraphs sit above the sets, so set 1 starts halfway down → one actionable line (autoregulation or a recovery warning) stays; the rest opens under 'Why this target'.
- **Files:** src/slices/workout/Train.tsx, src/ui/styles.css.
- **Spec:** In the open body keep visible, in order: autoreg line (:477; gate :128), recovery warning (:478-480). Move `next.reason` (:475), `reasonCue` (:476) and `cue` (:481) into a disclosure: `<button type="button" class="link-btn why-toggle" aria-expanded={why}>Why this target <IconChevronDown size={16} class={`chev ${why?'up':''}`}/></button>` followed by the I2 `.ex-body/.ex-body-inner` pattern holding the three paragraphs. `why` is per-card `useState(false)`. `.why-toggle{color:var(--text-2);font-size:var(--fs-small);display:inline-flex;align-items:center;gap:var(--sp-1);text-decoration:none}`.
- **Acceptance:** Gate live (390×844): the first `.set-grid` top with Why collapsed is lower than with it expanded by at least the rendered height of the three paragraphs (>0), both measured in the same run. 'for the next set' still visible. Clicking 'Why this target' reveals text containing `next.reason`.
- **Risk:** Low. Coach copy is one tap further; one-line revert if the owner wants it back.

#### I5 Finish sheet and finish screen: styled note, correct plurals, calm reveal, Done always reachable — should, b2b
- **User sees:** the session note is a grey browser box, '1 exercises' appears, and Done is buried below a big body map (with the coach dock over it) → the note matches the app, the grammar is right, the screen settles in top to bottom, and Done is pinned at the bottom.
- **Files:** src/ui/styles.css, src/slices/workout/Train.tsx, src/slices/history/History.tsx, src/escobar/ui/Dock.tsx.
- **Spec:** styles.css:8-9: add `textarea` to the input/select rule and the `:focus` rule; `textarea{resize:none;min-height:88px;line-height:1.4;font-size:16px}`. Train.tsx:349-350: class `num` on both `<b>`. Plurals at Train.tsx:349, :809 and History.tsx:92: `${n} exercise${n===1?'':'s'}` and the same for 'set'. Reveal: FinishScreen `.view` gets class `reveal` (`.reveal{animation:none}`) and `.reveal>*:nth-child(-n+5){animation:reveal-in var(--dur-enter) var(--ease-enter) both}` with `.reveal>*:nth-child(2){animation-delay:var(--stagger)}` … `:nth-child(5){animation-delay:calc(var(--stagger) * 4)}`; `@keyframes reveal-in{from{opacity:0;translate:0 var(--shift-sm)}}`. No count-up. Done (:854): wrapper `.finish-done{position:sticky;bottom:calc(var(--float-bottom) + var(--sp-2));z-index:5;padding-top:var(--sp-3);background:linear-gradient(to top,var(--bg) 60%,transparent)}`; FinishScreen `.view` `padding-bottom:72px`. Remove `card-accent` from the hero card (:808). Dock: export `finishShowing` (computed from Train's `lastFinish || pendingTimeQuestion`) and return null in Dock when `tab === 'train' && finishShowing.value`. No haptic (finishSession fires success).
- **Acceptance:** Gate finish-sheet shot: textarea computed background equals the input background and border-radius equals `--radius-md`. After logging a 1-exercise past session, History has no '1 exercises' text. FinishScreen at 390×844: Done is inside the viewport without scrolling and no `.esc-dock` exists.
- **Risk:** Low.

#### I6 Sheets rise from the edge and leave the same way; sticky header; no scroll chaining — must, b3
- **User sees:** sheets fade-pop 24px, the dimmer flashes on, closing vanishes in one frame, and long sheets scroll their title and Close away → sheets slide up from the bottom edge and settle, the background dims smoothly, closing slides them down, and the title bar stays put (with a hairline once content scrolls under it).
- **Files:** src/ui/primitives.tsx, src/ui/styles.css, src/ui/sheetStack.ts, scripts/screenshot-gate.mjs (flip `HAS.sheetExit`).
- **Spec:** Sheet (primitives.tsx:49-73): `closingRef` and `requestClose()`: if closing, return; mark closing; add class `closing` to the dialog; `markClosing(id)` in sheetStack; `panel.animate([{transform:'translateY(0)',opacity:1},{transform:`translateY(${reduced()?0:panel.offsetHeight}px)`,opacity:reduced()?0:1}],{duration:durFor('sheetExit'),easing:EASE.exit,fill:'forwards'}).finished.then(() => close.current())`; without `Element.prototype.animate`, call `close.current()` directly. Route the X button, backdrop click, `onCancel` and the registered Back callback through `requestClose`. Parent-driven unmounts and `closeAllSheets` (:44-50) stay instant. sheetStack.ts: `Entry.closing: boolean`; `markClosing(id)`; `closeTopSheet` (:35-40) uses `sheetStack.value.findLast(e => !e.closing)` so Back during an exit closes the next sheet. CSS: `.sheet-panel{animation:sheet-in var(--dur-sheet) var(--ease-drawer);overscroll-behavior:contain;background:var(--surface-2)}` `@keyframes sheet-in{from{transform:translateY(var(--shift-sheet));opacity:var(--enter-opacity)}}` `.sheet::backdrop{background:var(--scrim);animation:scrim-in var(--dur-sheet) var(--ease-standard)}` `@keyframes scrim-in{from{opacity:0}}` `.sheet.closing::backdrop{animation:scrim-out var(--dur-sheet-exit) var(--ease-exit) forwards}` `@keyframes scrim-out{to{opacity:0}}`; remove the backdrop blur. Nested: at mount, if `openSheetCount.value > 1` add `nested` → `.sheet.nested::backdrop{background:transparent}`. Sticky head: wrap `.sheet-grab` + `.sheet-head` in `.sheet-top{position:sticky;top:-8px;z-index:1;background:var(--surface-2);margin:-8px -16px 0;padding:8px 16px 0}` `.sheet-top::after{content:'';position:absolute;left:0;right:0;bottom:0;height:1px;background:var(--border-subtle);opacity:0;transition:opacity var(--dur-fast) var(--ease-standard)}` `.sheet-top.scrolled::after{opacity:1}`; a passive scroll listener on the panel toggles `scrolled` when `scrollTop > 0`. `will-change:transform` on the panel only while an animation or drag runs.
- **Acceptance:** F5 smoke (1) passes. Gate no-preference: at 30ms after open the panel transform ty > 50px; at 400ms ty = 0. Under reduce: at 30ms ty = 0 and opacity < 1. Settings scrolled 800px: Close `rect.top ≥` panel `rect.top`, and `.sheet-top.scrolled` exists. Calling the registered Back callback adds `.closing`; calling Back twice during an exit closes the sheet below as well. Gate :247 passes under reduce (100ms exit).
- **Risk:** Medium. The sticky offset (−8px) depends on the panel padding at :106.

#### I7 Escobar sheet: slides in, follows the finger, flings between half and full — should, b3
- **User sees:** the coach sheet pops in, resizes only after you let go, and animates its height (janky) → it rises like other sheets, tracks the finger, and a flick sends it to full, half or closed.
- **Files:** src/escobar/ui/EscobarSheet.tsx, src/escobar/ui/back.ts, src/escobar/ui/Message.tsx, src/ui/styles.css.
- **Spec:** Replace the pointerup-only logic (EscobarSheet.tsx:187-195) with `track()` on `.esc-grab-zone` (`touch-action:none` already, :267). During drag and animation render the panel at full height (94dvh) with `transform:translateY(offset)` (offset = 32dvh in px when starting from half). At rest in half, render `.esc-half` (62dvh) with no transform (FLIP: swap the class and clear the transform in the same frame after `.finished`) so the composer stays on screen. Run the same FLIP whenever `ui.detent` changes programmatically (Composer onFocus :232 → full; `escobarToHalf` from :143, :213, Message.tsx:137). Release: `projected = y + v*200`; snap to the nearest of [full=0, half=H_full−H_half, closed=H_full]; from half, close only if `v ≥ 0.4` px/ms downward or `y ≥ half + 0.25·H_half`. Animate with `springEase()`: `durFor('spring')` for travel <200px, `durFor('bounce')` otherwise. `haptic.tick()` on a detent change only. Keep double-tap (:203). Remove the height transition (:256). Enter: `.esc-panel` uses `sheet-in`. Exit: export `requestEscobarClose()` (registered by EscobarSheet, same pattern as I6) and call it from back.ts:14 and EscobarSheet.tsx:194, :201, :208, :214 instead of writing `escobarUi.open=false`. Scrim: `.esc-sheet::backdrop{background:var(--scrim)}` with scrim-in/out (replaces rgba .45 at :263). Panel background surface-2.
- **Acceptance:** Gate (marc.dev=1): opening Escobar gives `.esc-panel` a running `sheet-in`; a fast 60px up drag on the grab zone ends at full (height ≈ 94dvh, no transform); a slow 30px down drag from full returns to full; a fast down flick from half closes with `.closing` first; Back closes with an exit; focusing the composer from half animates (running animation) instead of jumping. Gate Escobar block (:614-790) passes.
- **Risk:** Medium. The FLIP swap between fixed height and transform can flash one frame; verify with a 60fps trace on device (unverified).

#### I9 Tabs: quick crossfade, remember scroll per tab, re-tap scrolls to top — must, b5
- **User sees:** every tab tap slides content up 6px, and returning to Train mid-workout drops you at the top → tabs swap with a quick fade, each tab keeps its place, and tapping the current tab glides to the top.
- **Files:** src/ui/styles.css, src/app/router.ts, src/app/App.tsx.
- **Spec:** styles.css:20-21: `.view{animation:view-in var(--dur-fast) var(--ease-standard)}` `@keyframes view-in{from{opacity:0}}` (no transform). router.ts: add `navTap(t)` with a module `Map<Tab, number>`: if `t` is the current tab → `window.scrollTo({top:0, behavior: reduced() ? 'auto' : 'smooth'})`; else `memo.set(current, scrollY)`, switch, then `requestAnimationFrame(() => window.scrollTo(0, memo.get(t) ?? 0))`. Call it only from the nav (App.tsx:96). `go()` and its `scrollTo` top at :92 stay unchanged (used by palace navigate.ts:63, the notification tap main.tsx:64, apply.ts:133, back.ts:17, Today.tsx:66/:83). No swipe between tabs, no view transitions, no haptic.
- **Acceptance:** Gate: on live Train scroll to 700, nav Today, nav Train → `scrollY` within ±4 of 700 after 2 rAFs; re-tap Train → `scrollY` reaches 0 within 800ms. `view-in` keyframes contain only opacity. tests/escobar/palace.test.ts:82 passes.
- **Risk:** Low. Content height may differ on return; scrollTo clamps.

#### I10 Segmented thumb slides, toggles and chevrons move, split tabs snap into view, theme switch is one crossfade — should, b5
- **User sees:** the selected segment looks sunken and jumps, chevrons flip instantly, the selected split tab can be off-screen, and changing theme makes parts of the screen catch up at different speeds → a raised thumb glides to the chosen option, chevrons rotate, the active split tab scrolls into view, and themes swap in one fade.
- **Files:** src/ui/primitives.tsx, src/ui/styles.css, src/slices/workout/Train.tsx, src/slices/settings/Settings.tsx.
- **Spec:** Segmented (primitives.tsx:28): `.seg` gets `position:relative;gap:0` (:69); add `<span class="seg-thumb" aria-hidden style={{width:`calc((100% - 6px) / ${n})`, transform:`translateX(${i*100}%)`}}/>` (i = index of value). `.seg-thumb{position:absolute;top:3px;bottom:3px;left:3px;border-radius:max(var(--radius-xs),calc(var(--radius-md) - 3px));background:var(--surface-3);box-shadow:var(--shadow-thumb);transition:transform var(--dur-spring) var(--ease-spring)}` `[data-theme="paper"] .seg-thumb{background:var(--surface-1)}` `.seg button{position:relative;z-index:1;border-radius:max(var(--radius-xs),calc(var(--radius-md) - 3px));transition:color var(--dur-fast) var(--ease-standard)}` `.seg button[aria-pressed="true"]{color:var(--text)}`. Delete the selected background/shadow rule (:71) and add `.seg:not(:has(.seg-thumb)) button[aria-pressed="true"]{background:var(--surface-1)}` for the raw `.seg` markup at Settings.tsx:138, Gyms.tsx:36, Train.tsx:117. No haptic. Toggle (:84-87): thumb `transform var(--dur-base) var(--ease-standard)`, track `background-color var(--dur-fast) var(--ease-standard)`. `.esc-drawer` chevron (:303): `transition:transform var(--dur-base) var(--ease-standard)`. Split tabs (`.tabs-strip`, :118): `scroll-snap-type:x proximity`; `.tab{scroll-snap-align:center}`; on selection change the selected `.tab` calls `scrollIntoView({inline:'nearest',block:'nearest',behavior: reduced() ? 'auto' : 'smooth'})`. Theme (Settings.tsx:128): `const run = () => setTheme(id); if (!reduced() && 'startViewTransition' in document) document.startViewTransition(run); else { document.documentElement.setAttribute('data-theme-switching',''); run(); requestAnimationFrame(() => requestAnimationFrame(() => document.documentElement.removeAttribute('data-theme-switching'))); }`; `::view-transition-old(root),::view-transition-new(root){animation-duration:var(--dur-base);animation-timing-function:var(--ease-standard)}` `html[data-theme-switching] *{transition:none!important}`.
- **Acceptance:** Gate: History Log→Stats: `.seg-thumb` has a running transform transition; at 400ms the thumb rect matches the selected button rect (±1px), also for index 2 of a 3-option control. Thumb computed background ≠ track background in all 5 themes. The raw `.seg` in Settings still shows its selection. `document.startViewTransition` is called on theme change (spy). Toggle `transition-duration` includes `0.2s`.
- **Risk:** Low. Whether the root view-transition snapshot includes the top-layer Settings dialog is unverified; the `data-theme-switching` path is the fallback.

#### I11 Hold-to-reorder: lift with depth, auto-scroll at edges, settle on drop; unified long-press — should, b5
- **User sees:** a held exercise gives no sense of pick-up, can't be dragged past the visible screen, and jumps into place, while the unit pill needs a 550ms press → the card lifts with a shadow and a click, the list scrolls near the edges, the card settles into its slot, and long-press everywhere fires at 400ms.
- **Files:** src/slices/workout/reorder.ts, src/ui/styles.css, src/ui/primitives.tsx.
- **Spec:** reorder.ts: import `REORDER_HOLD_MS`/`SLOP_PX` from gesture.ts. `styleFor` uses the `translate` property (`translate: 0 ${dy}px`, and ±shift for siblings) instead of transform, because `scale` would multiply a transform translation; siblings `transition: translate var(--dur-base) var(--ease-standard)`; the dragged item `transition: scale var(--dur-fast) var(--ease-standard)` only (replaces the inline `transition:'none'`, :80). Lift: class `lifted`: `.reorder-item{position:relative}` `.reorder-item.lifted{scale:var(--lift-scale);z-index:3}` `.reorder-item::after{content:'';position:absolute;inset:0;border-radius:var(--radius-lg);box-shadow:var(--shadow-float);opacity:0;pointer-events:none;transition:opacity var(--dur-fast) var(--ease-standard)}` `.reorder-item.lifted::after{opacity:1}`. Auto-scroll each rAF while dragging: `edgeTop = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--live-top-h')) || 0`; `edgeBottom = min(.nav rect.top, .rest rect.top if present)`; depth = `AUTOSCROLL_EDGE_PX` − distance into the edge zone; if depth > 0, `scrollBy(0, ±AUTOSCROLL_MAX_PX * (depth / AUTOSCROLL_EDGE_PX) ** 2)` and add the scrolled delta to dy. Drop (finish, :61-66): record the item's visual top before `setDrag(null)`; after the commit render (rAF) measure the new top; `el.animate([{translate:`0 ${old-new}px`, scale: String(liftScale)},{translate:'0 0', scale:'1'}],{duration:durFor('spring'), easing:springEase()})`, then remove `lifted`; `haptic.drop()`. pointercancel animates back to the origin the same way. primitives.tsx:146: 550 → `LONG_PRESS_MS`; on fire `haptic.longPress()`.
- **Acceptance:** Gate reorder test passes. During a hold >320ms the item has `lifted` and computed scale `1.02` (`1` under reduce). Dragging the first exercise within 30px of the nav top for 1s increases `scrollY`. After drop the item has a running animation and its rect equals its slot (±1px) at 400ms. Unit-pill long-press fires at 400±50ms (gate, mouse down/up timing).
- **Risk:** Medium. FLIP assumes the item element persists across the reorder (keys at Train.tsx:334 are per exercise; verify).

#### I12 Charts read true: undistorted sparkline, labelled bars, current week obvious — should, b6
- **User sees:** the sparkline's end dot is an ellipse and steep lines look fat, bar values hide in tooltips touch screens never show, and the current week barely differs → crisp lines with a round end dot, min/max and date labels, the current week in accent with its value above it, and a faint average line.
- **Files:** src/ui/Sparkline.tsx, src/slices/history/History.tsx, src/ui/styles.css.
- **Spec:** Sparkline.tsx (shared with Escobar, `.esc-comp .sparkline` :318): new optional props `height = 56`, `labels = false`; read `clientWidth` in `useLayoutEffect` (first frame not empty), then a ResizeObserver; `viewBox 0 0 ${w} ${h}` in CSS px; remove `preserveAspectRatio='none'`; path stroke 2, round join/cap, `var(--accent)`; no area fill; end dot `r=3.5` accent over a halo `r=6.5` `var(--accent-soft)`. With `labels`: max/min at the right edge, first/last dates under the plot, `var(--fs-cap)` `.num` `var(--text-2)`. History passes `height={96} labels`. Volume bars (History.tsx:195-196, styles.css:408-410): remove `title` attributes; bars keep `height:%`; past bars `color-mix(in srgb,var(--text) 14%,transparent)`; current week `var(--accent)` with a value label (`var(--fs-meta)` `.num` text-2) above it; one dashed 1px `var(--border-strong)` average line with 'avg {value}' at the right (same numbers the chart already has); x labels first and last only; radius `var(--radius-xs) var(--radius-xs) 0 0`; gap `var(--sp-1)`. Progress fills (Body.tsx:65, :93; History.tsx:228) stay `width:%`, static.
- **Acceptance:** Gate History stats at 390 and 560px: the end-dot `getBBox()` width === height; no `[title]` in `.volume-bars`; the current-week bar background equals the accent; the Escobar sparkline renders at 56px with no labels.
- **Risk:** Low.

#### I13 Ship the real typeface (Inter variable, bundled offline) — should, b7
- **User sees:** the APK renders in Roboto, so tuned headings and numbers never look as designed → crisp Inter everywhere with tabular clocks, offline.
- **Files:** package.json, src/ui/styles.css (or src/app/App.tsx for a `?url` import), src/theme/themes.ts.
- **Spec:** `npm i @fontsource-variable/inter@5.3.0`. Do not import `wght.css`/`index.css` (they declare every subset, and scripts/sw-version.mjs:6 precaches every file in www/assets). Declare one face in styles.css: `@font-face{font-family:'Inter Variable';src:url('@fontsource-variable/inter/files/inter-latin-wght-normal.woff2') format('woff2-variations');font-weight:100 900;font-display:swap;unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}`; if Vite cannot resolve the bare path in CSS, import the file with `?url` in App.tsx and inject the face. Confirm the file name with `ls node_modules/@fontsource-variable/inter/files`. themes.ts:56 stack: `'Inter Variable', Inter, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`. No `cv11`.
- **Acceptance:** Build succeeds; exactly one `*.woff2` in www/assets, ≤50KB (latin wght is 48,256 B per jsDelivr). Gate on Today: `await document.fonts.ready; [...document.fonts].some(f => /Inter/.test(f.family) && f.status === 'loaded')` is true. The gate's offline service-worker test still passes and the font renders offline.
- **Risk:** Medium. See §7 Later on brand distinctness (Silent Black + Inter is close to Linear).

#### I14 Type scale, weights and small-text contrast — should, b7
- **User sees:** 15 font sizes (including 10, 10.5, 12.5, 15.5px), everything semibold, small grey text at ~3.3:1, and accent-coloured text below 4.5:1 → a clear ladder, weight only on real headings, all small and accent text readable under gym lights.
- **Files:** src/ui/styles.css, src/theme/themes.ts, tests/ui/styles.tokens.test.ts, scripts/screenshot-gate.mjs.
- **Spec:** `body{font-size:var(--fs-body);line-height:var(--lh-body);letter-spacing:var(--ls-body)}`; inputs/select/textarea 16px. Map: 10/10.5 → `--fs-cap` (.unit-tag :232, .esc-cite :298, .plan-chip-k :377, :349); 12.5 → `--fs-meta` (:301, :376, :383); 15.5 → `--fs-body` (:288); 14 → `--fs-body` (h3 :14, .btn :49, :214, :273, :290); 16 at :271 → `--fs-title`; h1 650 → 600 (:12); `.stat b` 650 → 600 (:74); 650 at :175 → 600; h1 at ≤380px → `--fs-h1-narrow` (:223). Weights: `--fw-medium` for .btn, .chip, .nav span, .tab, .seg button, .set-index/.set-kind, .toast, list titles; `--fw-semibold` for h1/h2/section titles/hero numbers; 700 only `.plate` and `.effort button`. Caps, one rule: `.eyebrow,.map-label,.insight-cat,.chain>div>span:first-child,.plan-chip-k{font-size:var(--fs-cap);line-height:var(--lh-cap);font-weight:var(--fw-semibold);letter-spacing:var(--ls-cap);text-transform:uppercase;color:var(--text-2)}`. Text under 13px uses `var(--text-2)`: .eyebrow, .hint (:168, today text-3), .stat span, non-committed .set-index/.set-kind, inactive .nav button, .weight-approx, .map-label, .unit-tag. `::placeholder{color:var(--text-3);opacity:1}`; text-3 only for placeholders, disabled items and decorative separators. themes.ts: Paper `text2` → `#5f5e5a` (5.11:1 on surface-3 #e6e4df, 6.49:1 on #fff). Accent text: `:root{--accent-text:color-mix(in srgb,var(--accent) 75%,var(--text))}` used by the autoreg line (Train.tsx:477), `.esc-link` and `.chip-accent` text; a theme that fails the probe gets a per-theme override in themes.ts. Lint (F1 test): `font-size` must be `var(--fs-*)` or `16px` on input/select/textarea.
- **Acceptance:** Lint passes. New gate contrast probe (all 5 themes): WCAG ratio of computed colour vs the nearest opaque ancestor background ≥4.5 for `.hint`, `.eyebrow`, `.set-kind`, the autoreg line, `.esc-link`, `.chip-accent`. `git grep -n '650' -- src/ui/styles.css` returns nothing. All gate shots pass (the 16→15px body change reflows every screen).
- **Risk:** Medium. Global reflow; the 360px checks are the main guard.

#### I15 Colour means one thing: tinted effort chips, no stripes, no gradient, neutral streak — should, b7
- **User sees:** white letters on bright green/blue/red effort circles (max effort looks like an error), amber means six things, and cards carry coloured left stripes and a gradient → selected effort is a soft tinted circle with a coloured ring, green means done or PR, amber means 'look at this', cards are clean with a small coloured category dot.
- **Files:** src/ui/styles.css, src/slices/today/Today.tsx, src/slices/history/History.tsx, src/slices/workout/Train.tsx.
- **Spec:** Effort (:165-167): `.effort button[aria-pressed="true"].easy{background:color-mix(in srgb,var(--positive) 22%,transparent);color:var(--text);border-color:color-mix(in srgb,var(--positive) 45%,transparent)}`, the same for `.ideal` with `--info` and `.max` with `--negative` (a self-tinted letter measures 2.78-4.19:1 in some themes). `.effort button` transitions background-color/color/border-color `var(--dur-press) var(--ease-standard)`. No `#fff` remains. `.set-kind.warmup` (:154) → `var(--text-2)`. Streak chip (Today.tsx:55): drop `tone='warning'`, flame in `var(--text-2)`. Records chip (History.tsx:257) `tone='positive'`. Remove `border-left` from `.insight` (:211), `.esc-proposal` (:310), `.esc-escalation` (:315), `.esc-turn` (:287). `.insight-cat::before{content:'';display:inline-block;width:6px;height:6px;border-radius:var(--radius-pill);background:var(--insight,var(--accent));margin-right:6px;vertical-align:middle}`. FinishScreen debrief cards (Train.tsx:833) get an `.insight-cat` label (they have none, and the stripe was their only cue). `.esc-turn`: padding-left 12px, no rule. `.esc-proposal`: background `var(--surface-2)` (inside `.esc-panel`: `var(--surface-3)`) with a 'Proposal' `.eyebrow`. `.esc-escalation`: leading 16px warning icon. `.card-accent` (:45): `background:var(--surface-1);border-color:var(--border)` plus `html:not([data-theme="paper"]) .card-accent{box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}`.
- **Acceptance:** `git grep -n '#fff' -- src/ui/styles.css` returns nothing; no `border-left` on the 4 selectors. Gate (all 5 themes): selected `.effort .easy/.ideal/.max` letter vs its composited background ≥4.5; background alpha < .3.
- **Risk:** Low.

#### I16 Elevation you can see in the dark — should, b7
- **User sees:** sheets, the rest banner and the coach dock use the same black as the cards under them, and tracks sit on the same colour as their layer → each layer is a step lighter with a fine top edge and a soft shadow, and every track stays visible.
- **Files:** src/ui/styles.css.
- **Spec:** surface-2: `.sheet-panel` (I6), `.esc-panel` (:264). surface-3 + `border-top:1px solid var(--border-strong)` + `box-shadow:var(--shadow-float)`: `.rest` (I1), `.esc-dock` (:337), `.esc-menu` (:272), `.esc-pop` (:301); `.toast` keeps its inverted background and uses `--shadow-float` (F13). `.sheet-panel .card:not(.card-quiet),.esc-panel .card:not(.card-quiet){background:var(--surface-3)}`. Cards (.card :43): border only, no box-shadow. Tracks: `.bar,.toggle:not([aria-checked="true"]){background:color-mix(in srgb,var(--text) 10%,transparent)}` `.seg{background:color-mix(in srgb,var(--text) 6%,transparent)}`. Replace remaining `var(--shadow)` uses with `var(--shadow-float)`; keep `--shadow` in themes.ts for compatibility.
- **Acceptance:** Gate silent-black: `.rest` background ≠ `.card`; `.sheet-panel` ≠ `.card`. All 5 themes: `.bar`, `.seg` and an off `.toggle` have a computed background ≠ their parent's. `git grep -n 'box-shadow' -- src/ui/styles.css` shows no literal rgba outside the token range and the `.card-accent` inset.
- **Risk:** Low. On Paper surface-2/3 are darker than surface-1 by design; that is the theme's ramp. Paper text-2 contrast depends on I14.

#### I17 Radius and spacing on one grid — nice, b7
- **User sees:** 18 spacing values (mostly an off-grid 10px) and fixed radii that look foreign on Emerald/Paper → one quiet rhythm and curves that nest cleanly in every theme.
- **Files:** src/ui/styles.css, src/slices/coach/Coach.tsx, src/slices/workout/Train.tsx, tests/ui/styles.tokens.test.ts.
- **Spec:** Radius: 3px (:192, :409) and 4px (:208, :232) → `var(--radius-xs)`; `.set-kind` 8px (:153) → `var(--radius-sm)`; `.esc-bubble` 18/18/6/18 (:284) → `var(--radius-lg) var(--radius-lg) var(--radius-xs) var(--radius-lg)`; `.esc-cite` 8px (:298) → `var(--radius-sm)`; `.theme-preview` (:207) → `max(var(--radius-xs), calc(var(--radius-lg) - 10px))`; `.sheet-grab` 2px (:108) → `var(--radius-pill)`; inline 4px at Train.tsx:820 → `var(--radius-xs)`; Coach.tsx:167 `borderRadius:5` on a 10×10 dot → `'50%'`. 999px → `var(--radius-pill)` (chips, tabs, toggles, toast, dots); 50% stays for circles. Spacing: `.section` margin-top 22 → `var(--sp-5)` (:39); `.topbar` margin 6/0/18 → `var(--sp-2) 0 var(--sp-4)` (:24); `.grid-2/.grid-3` gap 10 → `var(--sp-3)` (:37-38); `.row/.row-between` gap 10 → `var(--sp-2)` (:33-34); `.exercise` padding 12px 14px → `var(--sp-3) var(--sp-4)` (:125); `.wrap` 8 → `var(--sp-2)`. Lint: `border-radius` values must be built from `var(--radius-*)`, `0`, `50%`, `inherit`, with `calc()`/`max()` allowed around `var(--radius-*)` and multi-value shorthands allowed.
- **Acceptance:** Lint passes. Gate :190-211 passes. Emerald shot: `.set-kind` and `.esc-bubble` computed radii equal the theme tokens. No computed radius < 0 in any theme.
- **Risk:** Low (≤2px per rule).

#### I18 Icons: one optical stroke weight, decorative icons hidden from screen readers — nice, b7
- **User sees:** the same icon set renders from ~0.9px hairlines to 2.4px heavy strokes side by side → every icon has the same 1.5px visual weight at 16, 20 or 24px.
- **Files:** src/ui/icons.tsx, src/escobar/ui/Thinking.tsx, src/ui/styles.css, call sites.
- **Spec:** icons.tsx:5 `base()`: `stroke-width = (1.5*24/size).toFixed(2)`, round cap/join, `aria-hidden='true'` by default (callers can override). Snap sizes, explicit props and the defaults in icons.tsx (22 IconSun etc., 20 IconX/IconPlus, 18 Chevron/Check): 12/13/14 → 16; 18/22 → 20; 30/32/40 → 24. IconEscobar (26 at EscobarSheet.tsx:205, 28 at Hall.tsx:25) is a brand mark: excluded. `.nav button svg` (:100) 22px → 20px. Empty-state glyphs sit in `.empty-glyph{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;background:var(--surface-2)}`. Thinking.tsx:11 reuses `base()`. IconPlay: shift the triangle +1 unit in x (optical centre).
- **Acceptance:** `git grep -nE 'size=\{(12|13|14|18|22|30|32|40)\}' -- src` returns nothing; no default size outside {16,20,24} in icons.tsx except IconEscobar. Gate: rendered stroke (strokeWidth × renderedSize/24) is 1.5±0.05 for 3 sampled icons including a nav icon.
- **Risk:** Low. Chips with 12px icons grow 4px; check chip heights in shots.

#### I19 Empty and loading states that feel designed — nice, b7
- **User sees:** bare centred text or an icon floating in a card, and tapping the coach button on a slow phone shows nothing → an empty History shows a left-aligned line and a Start button, and the coach button shows a small spinner if loading takes longer than a moment.
- **Files:** src/ui/primitives.tsx, src/slices/history/History.tsx, src/escobar/ui/Dock.tsx, src/app/App.tsx, src/ui/pending.ts (new), tests/ui/pending.test.ts (new).
- **Spec:** Empty (primitives.tsx:103-105): prop `align: 'start' | 'center'` (default `'start'`), glyph wrapped in `.empty-glyph` (I18). History.tsx:76: remove the wrapping Card; `<Empty align="start" title="Your finished workouts land here.">` with one body line and `<Button variant="primary" onClick={() => { requestStart(split); go('train'); }}>Start {split.name}</Button>` as Today.tsx:83 does, using the split Today shows; with no split the label is 'Go to Train' and it only calls `go('train')`. No ghost rows. Train.tsx:196 stays centred (full-screen first run); Train.tsx:230 and ExercisePicker.tsx:41 are `<p>`, untouched. Loading: pending.ts `showAfter({delay:200, min:400})` (pure, fake-timer tested). EscobarMount (App.tsx:40-48) exposes a `loading` signal; the Dock button sets `aria-busy` and shows a 12px `.esc-spin` via `showAfter`. ThinkingLine is not delayed (gate :669 requires 'Thinking…' within 150ms).
- **Acceptance:** tests/ui/pending.test.ts: resolve at 150ms → never shown; resolve at 250ms → visible ≥400ms total. Gate with a fresh profile: History shows the Empty title and a button that lands on Train. Gate :669 passes.
- **Risk:** Low.

### Add

#### A1 'Log as planned': tap the next set's hint line to fill and log it — must, b2a
- **User sees:** every set needs two keyboard entries even when you did exactly the plan → under the next set to do, the hint line reads 'Last: 60 kg × 8 … Log 62.5 kg × 8 ✓'; tapping that line fills the set with exactly the shown values and logs it (green check, rest starts).
- **Files:** src/slices/workout/Train.tsx, src/ui/styles.css.
- **Spec:** Next-up = the first set j in the open card with `!isCommitted(set) && set.kind !== 'warmup'`, when `!isTimed && mode !== 'conditioning'` and the reps placeholder (`target?.reps ?? prev?.reps`, Train.tsx:509) is non-empty. Only for that set, the row under the grid (Train.tsx:520) renders as `<button type="button" class="row-between fill-row" data-palace="train.log-planned" aria-label={label}>` instead of `<div class="row-between">`: left the unchanged hint span (:521); right `<span class="num">{label}</span> <IconCheck size={16}/>` in `var(--text-2)`. `label` uses the input placeholder expressions exactly (kg :508, reps :509): `Log ${kgPh} ${unitLabel} × ${repsPh}`; bodyweight (`kgPh === 'bw'`) or empty kgPh → `Log ${repsPh} reps`. No 'tap to log' copy. onClick: `const kgNum = target?.kg ?? prev?.kg; const v = kgNum != null && set.kg == null && mode !== 'bodyweight' ? enteredLoad(kgToDisplay(kgNum, eu), eu) : null; setSet(index, j, { ...(v ? { kg: v.kg, entered: v.entered } : {}), ...(set.reps == null ? { reps: target?.reps ?? prev?.reps } : {}) }); commitSet(index, j);` (`enteredLoad` at src/core/units.ts:48). Typed values win. CSS: `.fill-row{position:relative;width:100%;text-align:left;font:inherit;color:inherit;transition:color var(--dur-press) var(--ease-standard)}` `.fill-row::before{content:'';position:absolute;inset:-2px 0 -6px}` (2px up to the set-grid edge, 6px into the 8px gap below; never over inputs, effort hit areas or the next row) `.fill-row:active{color:var(--text)}`. No min-height change: the line keeps the plain hint's height, so nothing jumps when next-up moves.
- **Acceptance:** Gate: fresh live exercise, click `.fill-row` → `.set-grid.committed` count 1, `.rest` visible, kg/reps values equal their former placeholders; set 2 now has `.fill-row`, set 1 does not. A set with typed reps keeps its reps. Probes (QA-R7-1 style, gate :78-94): `elementFromPoint(input centre x, input bottom − 2)` returns the input; points 1..8px below each effort button's bottom never hit `.fill-row`; points 7..10px below the `.fill-row` box never hit it. The next-up hint row height equals a plain hint row (±1px).
- **Risk:** Medium. Logs a set without typing; undo is editing it or 'Delete set' with Undo (F10, b2b). Displayed and logged values are the same expressions by construction.

#### A2 Sticky live header with session progress hairline — should, b2b
- **User sees:** the live clock, Pause and Finish scroll away with the list → a compact bar (clock left, controls right) stays at the top with the same frosted material as the bottom nav, and a thin line under it fills as you log working sets.
- **Files:** src/slices/workout/Train.tsx, src/ui/styles.css.
- **Spec:** Split the live topbar (Train.tsx:321-329): the eyebrow and `{split} · {done}/{n} done` line render in normal flow above (they scroll away); the sticky row `<div class="topbar live-top" data-palace="train.start">` holds `<LiveClock/>` with a leading 6px dot (`var(--accent)` live, `var(--text-2)` paused) and the controls row, plus `<div class="live-progress" aria-hidden><i class={p===1?'full':''} style={{transform:`scaleX(${p})`}}/></div>`. `planned = a.entries.filter(e => !e.skipped).flatMap(e => e.sets).filter(x => x.kind !== 'warmup'); p = planned.filter(x => isCommitted(x) && isWorkingSet(x)).length / (planned.length || 1)` (isWorkingSet needs hasEntry, brain/exposure.ts:35-37). CSS: `.live-top{position:sticky;top:var(--safe-area-inset-top, env(safe-area-inset-top,0px));z-index:10;margin-inline:-16px;padding:6px 16px;max-height:56px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:0 calc(-1 * var(--safe-area-inset-top, env(safe-area-inset-top,0px))) 0 var(--bg)}` (paints the status-bar strip when stuck) `.live-progress{position:absolute;left:0;right:0;bottom:0;height:2px;background:var(--border-subtle)}` `.live-progress i{display:block;height:100%;transform-origin:left;background:var(--accent);transition:transform var(--dur-base) var(--ease-standard),background-color var(--dur-base) var(--ease-standard)}` `.live-progress i.full{background:var(--positive)}`. A ResizeObserver on `.live-top` writes `--live-top-h` on `<html>` (I2, I11). Finish is `default` (F8).
- **Acceptance:** Gate: scroll live 600px → `.live-top` rect.top within [−1, 13] and height ≤56px; Finish clickable; after 1 of N planned working sets the `i` matrix a ≈ 1/N (±0.01); palace `train.start` resolves; shots in all 5 themes show no content bleeding through.
- **Risk:** Medium. The blur costs GPU while scrolling on low-end phones (unverified); fallback is a solid `var(--bg)`.

#### A3 Swipe down to dismiss any sheet — must, b3
- **User sees:** the handle on every sheet does nothing → pull a sheet down by its handle or title, or from the content when it is scrolled to the top; a flick or a pull past a quarter closes it, anything less springs back, and the dimmer lightens as you pull.
- **Files:** src/ui/gesture.ts, src/ui/primitives.tsx, src/ui/styles.css, scripts/screenshot-gate.mjs.
- **Spec:** gesture.ts `track(el, {axis, capture:'down'|'afterSlop', canStart(e), onStart, onMove(d, v), onEnd(d, v), onCancel})`: pointerdown records samples; slop `SLOP_PX`; axis lock needs `|primary| > AXIS_RATIO·|other|` after slop, otherwise abort (native scroll proceeds); velocity from samples within `VELOCITY_WINDOW_MS`; onMove coalesced in rAF; non-primary pointers ignored; abort on pointercancel and visibilitychange; starts within `EDGE_IGNORE_PX` of either screen edge are ignored for axis x; export `rubber(d) = RUBBER_MAX_PX * (1 - 1/(1 + d/80))`. Sheet grab zone = `.sheet-top` with `touch-action:none`, capture on pointerdown, skipped when `e.target.closest('button')`. Body drag: one non-passive `touchmove` listener on the panel, attached at mount; on the FIRST touchmove of a touch, if `panel.scrollTop <= 0 && dy > 0`, the target is not inside input/textarea/select/[contenteditable], `getSelection()` is empty and `Date.now() - lastScrollAt ≥ SCROLL_LOCK_MS`, call `preventDefault()` and start the drag; otherwise leave native scroll alone. Follow: `y = max(0, dy)` → `panel.style.transform = translateY(${y}px)`; `dy < 0` → `translateY(${-rubber(-dy)}px)`. Scrim: `dialog.style.setProperty('--scrim-o', String(1 - y/H))` with `.sheet::backdrop{opacity:var(--scrim-o,1)}` (::backdrop inheriting from its dialog needs Chromium 122+: unverified on device, harmless otherwise). Release: if `v ≥ FLING_PX_PER_MS` downward or `y ≥ SHEET_CLOSE_FRACTION·H` → animate y→H over `clamp((H-y)/max(v,0.001), 120, durFor('sheetExit'))` ms with `EASE.exit`, then `close.current()`; else animate to 0 over `durFor('spring')` with `springEase()`. No haptic. Gate helper `touchDrag(page, x0, y0, x1, y1, ms)` via `page.context().newCDPSession(page)` and `Input.dispatchTouchEvent` (touchStart, touchMove every 16ms, touchEnd), reused by A5, A6, F13.
- **Acceptance:** Gate: `touchDrag` on `.sheet-grab` down 40% of the panel height slowly → dialog closes; 10% → transform back to none within 450ms, dialog open; 60px in 100ms → closes. ExercisePicker scrolled to 300px: `touchDrag` down on the body scrolls the list, the sheet does not move. Starting on the search input never moves the sheet. Owner device check on Android.
- **Risk:** Medium-high. Gesture vs scroll on the real WebView; the Close button stays as the TalkBack twin.

#### A4 Native crisp haptics and keep the screen awake during a live workout (NativeUi plugin) — should, b4
- **User sees:** every vibration is a 43-120ms motor buzz, and the screen dims mid-set → taps feel like the phone's own keyboard clicks (respecting the system touch-feedback setting), peaks are crisp double clicks, and the screen stays on while a workout is live.
- **Files:** native/NativeUiPlugin.java (new), native/MainActivity.java, scripts/prepare-android.sh, .github/workflows/build-apk.yml, .github/workflows/release-apk.yml, src/native/haptics.ts, src/native/keepAwake.ts (new), src/app/App.tsx, src/slices/settings/Settings.tsx.
- **Spec:**
  1. NativeUiPlugin.java, package `com.mrcdrnzz.dailytracker`, `@CapacitorPlugin(name="NativeUi")`. `@PluginMethod haptic(call)`: `type = call.getString("type")`; on the UI thread `View v = getBridge().getWebView(); int c = map(type); if (c >= 0) v.performHapticFeedback(c);` resolve `{played: c >= 0}`. `map()` uses `Build.VERSION.SDK_INT` with the §3 constants and fallbacks, by `HapticFeedbackConstants` names (not ints).
  2. `@PluginMethod keepAwake(call)`: `on = call.getBoolean("on")`; on the UI thread add/clear `WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON`.
  3. success/alert: `@PluginMethod peak(call)` with `type` success|alert: if API ≥ 30 (VibrationEffect.Composition; API level unverified, the opened page does not state it) and `vibrator.areAllPrimitivesSupported(...)`: success = PRIMITIVE_CLICK, 60ms gap, PRIMITIVE_CLICK at scale .7; alert = PRIMITIVE_THUD twice, 150ms apart; resolve `{played:true}`; else `{played:false}` and haptics.ts falls back to Capacitor.
  4. MainActivity.java: `registerPlugin(NativeUiPlugin.class)` next to :10-11, before `super.onCreate`. prepare-android.sh:21: append NativeUiPlugin.java to the cp list. build-apk.yml:120: add `test -f "$PKG/NativeUiPlugin.java" || …`; :158 add the class to the check tuple; release-apk.yml:158: the same test line. Append only (shared with the watch agent, docs/AGENT-RULES.md:14).
  5. keepAwake.ts `set(on)`: native → `NativeUi.keepAwake({on})`; web → `navigator.wakeLock?.request('screen')`, released on off and re-acquired on visibilitychange (support in Android System WebView unverified; native covers the APK). App.tsx: `useEffect(() => { keepAwake(!!live && pref); return () => keepAwake(false); }, [live, pref])` with `live = !!state.value.active` (App.tsx:76), so switching tabs mid-rest keeps it.
  6. Settings Feedback section: Row 'Keep screen on during workouts', localStorage `marc.keepAwake` (try/catch), default on.
- **Acceptance:** build-apk workflow green (class check finds NativeUiPlugin). tests/native/haptics.test.ts: mocked `NativeUi` → `tick()` calls `NativeUi.haptic({type:'tick'})`; `success()` calls `NativeUi.peak({type:'success'})` and, on `{played:false}`, Capacitor notification Success. Owner device check: set commit feels like a key click; 'Test haptic' is short; PR and finish feel crisp; the screen stays on through a 5-minute rest with the app open, including after switching to Today.
- **Risk:** Medium. Shared CI files (append only). API-34 constant names must exist in compileSdk (build requires targetSdk ≥36, build-apk.yml:114-117).

#### A5 Swipe left to delete a History session (with Undo); swipe months in the calendar — nice, b5
- **User sees:** deleting a past session means opening it and finding Delete, and months change only with small arrows → sliding a session row left reveals a red zone that arms with a tick past halfway and deletes with Undo; the calendar pages months with a sideways swipe; the buttons still work.
- **Files:** src/slices/history/History.tsx, src/ui/gesture.ts, src/ui/styles.css.
- **Spec:** Extract the delete body of `remove()` (History.tsx:142-152) into `deleteSessionWithUndo(session)` and reuse it in the sheet. SessionCard row (:88) wrapped in `.swipe-row{position:relative;border-radius:var(--radius-lg);touch-action:pan-y;overflow:clip;overflow-clip-margin:8px}` with `.swipe-bg{position:absolute;inset:0;overflow:hidden;border-radius:inherit;background:color-mix(in srgb,var(--negative) 18%,var(--surface-1))}` holding a right-aligned IconTrash 20 in `var(--negative)`, scaling .6→1 and opacity 0→1 over 0..72px. `track()` axis x, capture after slop, `canStart: e => e.clientX > EDGE_IGNORE_PX && e.clientX < innerWidth - EDGE_IGNORE_PX`. Follow 1:1 to −W; rightward `rubber(dx)` ≤16px. Arm at `|dx| ≥ SWIPE_COMMIT_FRACTION·W` → `haptic.threshold(true)`, background 30% and icon scale 1.15 via `springEase()`; disarm below → `threshold(false)`. Commit if armed or (`v ≤ −0.4` px/ms and `|dx| ≥ SWIPE_FLING_MIN_PX`): row to `translateX(−W)` over `durFor('sheetExit')` `EASE.exit`, then `deleteSessionWithUndo`. Otherwise back over `durFor('spring')`. A click after a drag > slop is suppressed. Calendar (:57-66): `.cal{touch-action:pan-y}`, same `canStart`, axis x; commit at `|dx| ≥ 0.3W` or `|v| ≥ 0.4` → old grid out ∓W over `durFor('sheetExit')` `EASE.exit`, `shift(±1)` (:51), new grid from ±0.3W to 0 with opacity 0→1 over `durFor('enter')` `EASE.enter`, `haptic.tick()`; past the current month → rubber only. Reduce: no follow translate, commit by threshold, crossfade.
- **Acceptance:** Gate `touchDrag` on the first session row −70% W → row gone, toast 'Session deleted' with Undo, Undo restores the same id; −20% springs back, nothing deleted; a vertical `touchDrag` starting on a row scrolls the page with no horizontal move; a drag starting 20px from the right edge does nothing; calendar −40% W changes the month label by one; the palace spotlight ring on a row is not clipped.
- **Risk:** Medium. Axis lock 1.2 and the 32px edge are tuning choices (unverified); device check.

#### A6 Scrub charts with a finger to read exact values — should, b6
- **User sees:** no way to read a specific week's volume or a past set on touch → sliding a finger across the trend line or the weekly bars shows a thin guide and a readout above the chart ('62.5 kg × 5 · 12 Aug', '4,820 kg · wk of 4 Aug') with a light tick per point; letting go fades back to the latest value.
- **Files:** src/ui/Sparkline.tsx, src/slices/history/History.tsx, src/ui/styles.css.
- **Spec:** Sparkline prop `scrub` (only History passes it; Escobar's sparkline stays static); the volume bars get the same behaviour. Whole plot is the hit area with `touch-action:pan-y`. Start on 8px horizontal travel (axis x) or a `SCRUB_HOLD_MS` hold without movement. Index = nearest by x. Visual: 1px `var(--border-strong)` vertical rule and an r=4 dot (accent with a 2px `var(--bg)` ring) on the sparkline; non-selected bars `opacity:.45` with `transition:opacity var(--dur-fast) var(--ease-standard)`. Readout: a new `.chart-readout .num` line (`var(--fs-small)`, text-2) above each chart (History.tsx:243 for the sparkline; the Section aside at :237-243 is AskAbout and stays), showing the latest value at rest, using the chart's existing values and labels. `haptic.tick()` on each index change. Release: readout crossfades back over `var(--dur-fast)`. A11y: the chart gets `tabIndex=0`, `role="slider"`, `aria-valuemin=0`, `aria-valuemax={n-1}`, `aria-valuenow={index}`, `aria-valuetext={readout}`; ArrowLeft/Right move the index, Escape clears.
- **Acceptance:** Gate `touchDrag` across the sparkline 10%→90% → readout changes ≥3 times and returns to the latest value within 300ms of release; a vertical `touchDrag` on the chart scrolls the page; focus + ArrowLeft changes the readout and `aria-valuenow`.
- **Risk:** Low-medium. Start rule is a tuning choice (unverified); constants live in gesture.ts.

#### A8 Keyboard flow for logging a set — must, b2a
- **User sees:** after typing kg the keyboard's action key does nothing useful, and tapping a filled field puts the cursor after the old value → the key reads Next and moves kg → reps → the next set's kg (Done on the last one), and focusing a field selects its value so typing replaces it.
- **Files:** src/slices/workout/Train.tsx, src/ui/primitives.tsx.
- **Spec:** (A7 is intentionally unused: earlier drafts used 'A7' for A4.) Add `data-set-field` to the kg input (WeightInput, primitives.tsx:151, via a passthrough prop) and the reps input (Train.tsx:509). `enterKeyHint`: `'next'` on both, `'done'` on the reps input of the card's last set. onKeyDown Enter (not `e.isComposing`): `preventDefault()`, then focus the next `[data-set-field]` inside the same EntryCard root in DOM order; if none, `blur()` (reps blur commits, :509). `onFocus={e => (e.target as HTMLInputElement).select()}` on both (select() applies to text and number inputs; unverified in Android WebView, the gate checks it). No motion, no haptic. `src` has no `enterKeyHint` today (git grep).
- **Acceptance:** Gate live: focus set 1 kg, type 60, press Enter → reps focused; type 8, Enter → set 1 committed and set 2 kg focused; focusing a kg field holding 60 and typing 62.5 yields 62.5. Owner device check: Gboard shows Next/Done.
- **Risk:** Low. Enter on the last reps field blurs, which commits: same as tapping away.

#### A9 Rest banner shows the next set — should, b2a
- **User sees:** between sets you scroll back to find what to lift next → the rest banner's small line reads 'Next · 62.5 kg × 8'.
- **Files:** src/slices/workout/Train.tsx.
- **Spec:** `export const nextUpHint = signal<string | null>(null)`. The open EntryCard, in an effect over its sets, writes `${kgPh} ${unitLabel} × ${repsPh}` (the A1 values) for its next-up set, or null when none; it clears on unmount. RestBanner hint (:892): `done ? 'Rest done. Next set.' : showBpm ? … : nextUpHint.value ? `Next · ${nextUpHint.value}` : `Rest · ${formatClock(a.rest.totalSec)}``. Same element, no new motion.
- **Acceptance:** Gate: commit set 1 of an exercise with 3 planned sets → `.rest .hint` text equals `Next · ` + set 2's A1 label; when the open card has no uncommitted working set left → 'Rest · m:ss'.
- **Risk:** Low. Only the open card writes the signal; with no open card the old text shows.

## 6. Testing

While building (per batch, focused):
- b1: `npm test` (token lint, haptics test); gate blocks for the palace, onboarding and Settings; press checks (F2) on one theme; reduce toggle on/off.
- b2a: live-flow gate blocks (commit, rest, 360px, plate-sense); `tests/workout/celebrate.test.ts`; `tests/clock.test.ts` if clock.ts changed.
- b2b: live flow, reorder, finish sheet, history log; the undo round-trips.
- b3: motion smoke (flip `HAS.sheetExit`), Settings/Escobar blocks, toast restart; `touchDrag` cases.
- b4: `tests/native/haptics.test.ts`; build-apk workflow on the PR.
- b5: tab memo, seg thumb, reorder, History swipe.
- b6: History stats at 390/560; scrub.
- b7: contrast probes, lint (font-size, radius), all shots in 5 themes, offline font.

Full gate before each PR: `npm run check`, `npm run test:tz`, `MARC_CHROMIUM=/opt/pw-browsers/chromium npm run gate`. All must pass with no assertion loosened; log any new measurement (A1 row heights, I4 offsets) in the PR.

Manual device check (owner, Android phone, APK), per batch that touches it:
- Default settings, then OS 'Remove animations' on, then in-app Reduce motion on: every screen still gives feedback; nothing slides under reduce.
- Each of the 5 themes: live screen, rest banner, a sheet, a toast, History stats.
- Haptics: tab taps silent; set commit one short click (after A4); PR second pulse once; 3-2-1 ticks; exactly one vibration at rest 0 with the app open; 'Test haptic' short.
- Gestures (b3, b5): sheet pull from handle and from scrolled-top content; list scroll inside sheets never drags the sheet; toast swipe; History row swipe does not fire Android back; calendar swipe; reorder with auto-scroll.
- Keyboard (A8): Next/Done labels; the focused row stays above the keyboard.
- Screen stays on through a 5-minute rest (A4); cold start shows no white frame (F11).

## 6b. Owner picks (added 2026-09-25)

The owner chose these from rendered samples. Build them as written and don't redesign them. O1 goes in b4, after F11. O2 and O3 form **b8 Body tab**, after b7 so they use its type and colours. O3 is the owner's ring-grid pick (sample 1).

#### O1 Launch animation "Bar path", thin, no glow (owner pick B1) — must, b4
- **User sees:** on cold start, a thin M/ARC line draws itself. The accent dot glides down into the dip like a controlled rep, then the line rises out and "M/ARC" fades into focus. The animation takes 1.6 s, and a tap skips it. With Reduce motion on, the finished logo shows until the app is ready.
- **Reference:** artifact X93gWEa8SQvZyNUAQ1WizZ, variant B1. Copy its geometry and timings exactly.
- **Files:**
  - index.html: inline markup, style and script, so it paints before the bundle loads.
  - src/main.tsx: one call after `render`.
  - scripts/screenshot-gate.mjs: probes.
- **Spec:**
  - **Overlay.** Put `<div id="launch" aria-hidden="true">` in `<body>` before `#app`. It is `position:fixed; inset:0; z-index:2147483000`, and its background is the theme bg.
  - **Theme colours.** An inline script reads `localStorage['marc.theme']` in try/catch and picks bg/ink/accent from this map. Unknown or missing values use silent-black. The values match src/theme/themes.ts:
    - silent-black #08090a/#f7f8f8/#5e6ad2
    - paper #ffffff/#37352f/#2383e2
    - ember #07080a/#ffffff/#ff6363
    - emerald #0f0f0f/#ededed/#3ecf8e
    - midnight #0a2540/#f6f9fc/#635bff
    Add a unit test that reads themes.ts and asserts the map matches, so a theme edit can't drift.
  - **SVG.** `viewBox="0 0 180 320"`, `preserveAspectRatio="xMidYMid meet"`, filling the overlay. The contents are exactly the B1 build:
    - `<g class="settle">` wraps a `<g transform="translate(47 100) scale(1.34)">`.
    - The path is `M8 40H16L22 22L30 50L36 30L40 40H56` with `pathLength=100`, stroke = ink, `stroke-width=2.6`, round caps and joins, `stroke-dasharray=100` and `stroke-dashoffset=100`.
    - Two chained SMIL `<animate>` on `stroke-dashoffset`:
      - 100 → 45.93 over 0.72 s, `keySplines=".45 0 .25 1"`;
      - then 45.93 → 0 over 0.5 s, `keySplines=".35 0 .2 1"`, `begin="<id>.end"`.
    - A dot `<circle r=3.1 fill=accent>` with `<animateMotion>` along the same path: `keyPoints="0;0.5407"`, 0.72 s, the same spline, `fill=freeze`.
    - The word is `<text x=90 y=196 text-anchor=middle>`, `font: 500 17px Inter, system-ui, sans-serif`, `letter-spacing:1.2px`, reading `M<tspan fill=accent>/</tspan>ARC`.
    - No glow circle (that was B2).
  - **CSS.** `.settle` uses `transform-box: view-box; transform-origin: 50% 45%` and animation `settle 1600ms cubic-bezier(.16,1,.3,1)`, from `scale(.975)` and opacity 0, with opacity 1 at 12%. The word animates `reveal 700ms cubic-bezier(.22,1,.36,1) 1050ms both`, from `translateY(5px)` and `blur(5px)` at opacity 0. Start both SMIL animations with `beginElement()` from the inline script.
  - **Reduce motion.** Treat it as on when `matchMedia('(prefers-reduced-motion: reduce)').matches` or `localStorage['marc.motion']==='reduce'`, the same rule as src/ui/motion.ts `apply()`. Then:
    - no SMIL and no CSS animation;
    - `stroke-dashoffset=0`, the dot at `cx=30 cy=50`, the word at opacity 1.
  - **Exit.** src/main.tsx calls `window.__marcLaunchReady?.()` straight after `render(...)`. The overlay leaves when the app is ready AND 1750 ms have passed since the script started. Under reduce, 0 ms. A `pointerdown` on the overlay also ends the wait.
    - Leaving means: set `pointer-events:none`, fade opacity to 0 over 240 ms with `cubic-bezier(.3,0,.8,.15)` (100 ms under reduce), then `remove()`.
    - Hard cap: remove it 4000 ms after start whatever happens.
    - `window.__marcCrash` removes `#launch` first, so the error box is never hidden.
  - **When it shows.** Only on a cold start, which happens because index.html runs once. It never shows on resume.
  - **No hold.** Never block input once the app is ready: `pointer-events:none` is set before the fade starts.
- **Acceptance** (gate):
  - The existing contexts use `reducedMotion:'reduce'`. There, `#launch` is gone within 300 ms of `.nav` appearing, and the existing probes stay unchanged and pass.
  - New context with `reducedMotion:'no-preference'`. The inline script sets `window.__marcLaunchT0 = performance.now()`, and all times below are measured from it with `waitForFunction`:
    - `#launch svg path` exists;
    - at 250 ms, `getComputedStyle(path).strokeDashoffset` parses to a value strictly between 46 and 100. This was checked in Chromium on 2026-09-25: the computed style reflects SMIL, reading 75.3px at 250 ms;
    - at 1400 ms it is ≤ 1;
    - `#launch` is gone by 2400 ms;
    - in a fresh page, a click at 300 ms removes it by 700 ms.
  - Paper: with `marc.theme=paper` set before load, the overlay's computed background is `rgb(255, 255, 255)`.
  - Calling `__marcCrash('x')` removes `#launch`, and the crash box is visible.
  - Owner device check: smooth on a cold start, and no white frame in Silent Black.
- **Risk:** Low. The failure mode is an overlay that never leaves. The 4000 ms cap, the crash hook and `pointer-events:none` on ready cover it.
- **Note (BUG-34, 2026-09-30):** the line and dot now run on CSS animations (`stroke-dashoffset` keyframes and `offset-path`), not SMIL. Chromium starts SMIL only at the load event, after the bundle, so the first frame froze. Timings, curves and the end frame are unchanged. See D-BUG34-1 to D-BUG34-4 in docs/COACHING-DECISIONS.md.

#### O2 Muscle panel: recovery timeline (owner pick B) — must, b8
- **User sees:** today's panel is scattered: three stats, a long sentence with "2d to 3d", a duplicate "at a glance" line, and an exercise list that repeats itself. It becomes one clear panel:
  - a big % with a status pill;
  - a bar from "Trained" to "Full" with real dates;
  - four short facts;
  - two buttons;
  - "Logged / Try next" tabs.
- **Reference:** artifact Hw5r18ZiFcyAKkXLL7EsNa, option B.
- **Files:**
  - src/slices/body/Body.tsx `MuscleDetail` (:111-150 at f86a8b5);
  - src/ui/styles.css (new `.mtl-*` classes using tokens only);
  - scripts/screenshot-gate.mjs.
- **Spec:**
  - **Remove** the "{label} at a glance" row (:125), the grid-3 stats (:126-130), the sentence (:131-136) and the chips section (:144-147).
  - **Header row:**
    - `${r.pct}%` in large tabular numbers, then "recovered".
    - Right-aligned pill:
      - "Held back by soreness" (warning) when `r.soreToday && !r.hoursLeft`;
      - else "Recovering" (warning) when `r.recovering`;
      - else "Ready" (positive).
    - Never trained (`!r.lastTrainedAt`): show "—" and the pill "Not trained yet" (neutral).
  - **Timeline** (only when `r.lastTrainedAt`):
    - A 6 px track. The fill width is `r.pct%`, toned as today's Stat tone (:127). A 1 px tick sits at `READY_PCT%` (src/data/recovery.ts:61).
    - Below it is a three-column label row:
      - "Trained" + `formatDay(r.lastDay, {weekday:'short', day:'numeric'})`;
      - "Ready" + the window;
      - "Full" + the date.
    - Each date is the day key of now + hours, shown as "Today" if it is today, else as `formatDay(key, {weekday:'short', day:'numeric'})`.
    - Ready window from `r.readyInHours [lo, hi]`: "Mon 28 – Tue 29", or a single day when lo and hi fall on the same day.
    - Full from `r.fullInHours`.
    - If `readyInHours` is null and the muscle is recovering (the soreness case), Ready reads "When soreness eases". If it is not recovering, both read "Now".
  - **Facts** (a key/value list, keys in text-2):
    - "Last session": the most recently logged exercise for this muscle (`logged[0]`), then " · N sets". N counts that session's sets with `isWorkingSet` (src/brain/exposure.ts:34). Write "1 set" / "N sets".
    - "Level": `levels.level`.
    - "Accuracy": low → "Rough guess for now", medium → "Getting there", high → "Good". Add " · fitted to you" when `r.personalized`.
    - After the list comes the `r.drivers` text line, kept as today (:137).
  - **Actions row:**
    - "Mark as fresh" as a real secondary button, only when `r.recovering`. It uses the existing `markFresh` (:121), with the hint below: "Use it if this muscle already feels ready."
    - "Ask Escobar" button: reuse `AskAbout` with the same refTo. Style it as a button with that label if its current look is a small link; don't change its behaviour.
  - **Tabs:**
    - `Segmented` (src/ui/primitives.tsx:29) with the options `Logged · ${logged.length}` and `Try next · ${tryNext.length}`.
    - `tryNext` = `direct` minus the exercises in `logged`, capped at 10.
    - Default tab: Logged when `logged.length`, else Try next.
    - Logged rows, up to 6:
      - the name;
      - the hint `Best ${load} × ${reps} · ${n} ${n===1?'session':'sessions'}`, where Best is the history entry with the highest `topKg` (ties go to higher `topReps`). With no load, use the best `bestReps` reps or `bestDurationSec` s over history.
      - Trailing: `formatDay(last.day, {weekday:'short', day:'numeric'})`.
    - Try next rows:
      - the name, plus the equipment in text-2.
      - When a workout is live (`state.value.active`) and the exercise isn't in it: a trailing "Add" button that calls `addExerciseToSession(ex)` (src/slices/workout/session.ts:267) and shows the toast `Added ${name} to today's workout`.
      - When it's already in the workout: the hint "In workout".
      - No workout live: no button.
    - Empty states: "Nothing logged for this muscle yet." / "You already do every listed exercise for this muscle."
  - **Palace.** Keep `usePalaceFocus('body.muscle', …)` and the Sheet palace id. Add a palace attribute `body.muscle-tabs` on the Segmented wrapper.
- **Acceptance** (gate, 360 and 390 px, Silent Black and Paper):
  - Seeded data: a leg session on day −2, plus one older split squat session.
    - Glutes shows a % and a pill, and the timeline has three labels with real day names, none containing "d to".
    - Nothing overflows horizontally, and no text is clipped (`scrollWidth ≤ clientWidth` on each label).
    - Tabs read "Logged · 2" and "Try next · 8" for that seed.
    - No text says "at a glance", "1 sessions" or "Low confidence".
    - The Logged and Try next lists share no exercise.
  - With a live workout: tapping Add on a Try next row adds that entry to `state.active.entries`, and the row then shows "In workout".
  - Never-trained muscle: "Not trained yet", no timeline, and Try next is selected.
  - Unit tests for the date-window helper:
    - same day;
    - across midnight;
    - lo today and hi tomorrow;
    - null window.
- **Risk:** Low: display only. It reads no new data and writes only through the existing `markFresh` and `addExerciseToSession`.

#### O3 Recovery list: "Ready times" grouped by day (owner pick: ring grid sample 1, plain, no gradient) — must, b8
- **User sees:** the long "Recovering" list becomes one compact card. Rings sit in 2 columns, grouped Today · Sat 26, Tomorrow · Sun 27 and Later, each with a real ready window. A tap shows the details right under the finger.
- **Reference:** artifact TRgcJvWmJAqfY6Ved9i5ZX, sample 1. The owner declined the gradient styles (UCZw7QwjyCsHtiFnvU5rxw). Use the app's tokens, not the sample's colours.
- **Files:**
  - src/slices/body/Body.tsx: the recovery Sections, Body.tsx:57-76 at f86a8b5 (re-find them on current main).
  - src/core/dates.ts: a pure `readyWindow` helper.
  - src/ui/styles.css: `.rt-*` classes, tokens only.
  - tests/readyTimes.test.ts (new).
  - scripts/screenshot-gate.mjs.
- **Spec:**
  - **Sections.** Replace the "Recovering" and "Ready for hard work" Sections with one Section, "Ready times". The aside reads "Low confidence" (or "Medium confidence" / "High confidence") when every listed muscle shares that level, and "Mixed confidence" otherwise. Keep "Fully recovered" as it is. Keep palace id `body.recovering` on the new Section, and put `body.ready` on the Ready now row.
  - **Card.** The existing `.card`, with padding 0 4px 4px.
    - First row: "Ready now", with the count on the right, or "None yet". These are today's `readyOnly` muscles; their tiles show "Full by {time}" from fullInHours, or "Ready".
    - Then these groups, by the calendar day of latest = now + readyInHours[1] (a latest of exactly midnight counts as the day before): "Today · {Sat 26}", "Tomorrow · {Sun 27}", "Later".
    - Sore muscles with no window go in a final "Sore today" group, with the time "Not today".
    - Recovering muscles with no window that aren't sore go in Later, with the time taken from today's `${formatHours(hoursLeft)} left`.
  - **Group header.** 32px, label 13px 600 in text, count 13px in text-2.
  - **Lines.**
    - Lines of 2 tiles (grid 1fr 1fr). An odd last tile spans both columns, with its time right-aligned.
    - Between lines inside a group: a 1px border-subtle divider, inset 8px.
    - Sort: latest ascending, then earliest ascending, then pct descending, then name.
  - **Tile.**
    - A `<button>`: min-height 52, padding 0 6px 0 8px, gap 8, radius-sm. Ring 40.
    - Name 14/18 600 in text, wrapping to at most 2 lines (QA7-2); time 12/16 500 in text-2, no wrap; tabular numbers.
    - If any time, or any single word of a name, overflows (scrollWidth > clientWidth, or a name taller than 2 lines), the card switches to one column. Watch this with a ResizeObserver.
  - **Ring.**
    - SVG 40, r 17, stroke 4, track `var(--surface-3)`.
    - Arc from 12 o'clock clockwise, `stroke-dasharray = C·min(pct,90)/90` (C = 106.81), so a full circle means 90% (ready). At ≥90 draw a full circle.
    - Colours: ≥90 `var(--positive)`, 75–89 `var(--warning)`, <75 `var(--text-2)`.
    - Ready tick: `rect x19 y0 w2 h6` in `var(--text)`. Not drawn at ≥90, or when sore.
    - Sore: dashed track in text-2 (`3.2 2.14`), no arc.
    - Number centred, 13px 600, no % sign.
  - **Times.** A pure helper, unit-tested:
    - 12-hour clock, lowercase am/pm, "midnight"/"noon", separator " – ".
    - Earliest rounds to the nearest hour; latest rounds up.
    - Today and Tomorrow tiles show hours only: "2 – 5 pm", "6 pm – midnight", "9 pm – 3 am".
    - Later tiles show days only: "Mon – Tue".
    - Detail text: "Ready Sat 26, 7 – 8 am" or "Ready Sat 26, 9 pm – Sun 27, 3 am".
  - **Tap.**
    - The tile gets surface-3. A strip opens directly under that line, spanning both columns, with a 12×6 caret pointing at the tapped ring (left 28px, or 50% + 28px for the right column).
    - The strip is one button: surface-3, radius-md, padding 10 36 10 12.
      - Row 1: the name (15/20 600), and on the right in text-2 "{90−pct}% to go", "Ready" or "Sore today".
      - Row 2: "Ready …" (14/20 500).
      - Row 3: "Full {day, time} · {Level} confidence" (12/16, text-2).
      - A chevron on the right.
    - Tapping the strip calls `setSelected(muscle)`, which opens the O2 muscle panel.
    - Tapping the same tile closes the strip. Only one is open at a time.
    - Keep the tapped tile under the finger: measure its top before and after the change, then `window.scrollBy` the difference.
    - While a strip is open, freeze the order. The minute recompute updates numbers only.
    - Motion: grid-template-rows 0fr→1fr over var(--dur-base) var(--ease-enter), with content fading over var(--dur-fast). Under `html[data-motion="reduce"]`, use the clamped tokens.
  - **Accessibility.** Tiles carry aria-expanded and aria-controls, and the label "{name}, {pct} percent, ready {window}".
- **Acceptance:**
  - Gate at 360 and 390 px, in Paper and Silent Black, with seeded data:
    - the groups and counts equal the helper's output;
    - no text is clipped and there is no horizontal scroll;
    - a tap opens the strip under the tapped line, and the tile moves ≤2px;
    - tapping the strip opens the muscle panel;
    - the palace targets `body.recovering` and `body.ready` still resolve.
  - Unit tests for the helper: same day; across midnight; an end at exactly midnight; later days; a null window; sore.
- **Risk:** Low: display only, with no data changes.

#### O4 Exercise progress: "Work done, by effort" chart (owner pick: progress option 2) — must, b6
- **User sees:** under the existing trend line, a bar per session showing the kg lifted on that exercise, split into Easy, Right and Max. It shows whether you're doing more work, and whether you're pushing harder or easier. Escobar draws the same chart when asked about an exercise.
- **Reference:** artifact Fg7CqN85hUcvjoAvVUrxzU, option 2. Use the app's tokens.
- **Files:**
  - src/ui/EffortBars.tsx (new; one component, shared with Escobar);
  - src/slices/history/History.tsx (Exercise progress card);
  - src/escobar/tools/show.ts (`lift_trend` gains the per-session effort split);
  - src/escobar/ui/components/index.tsx (LiftTrend renders EffortBars under its sparkline);
  - src/ui/styles.css;
  - tests/effortBars.test.ts;
  - scripts/screenshot-gate.mjs.
- **Data** (pure helper, unit-tested): `effortSplit(history, mode, bwAt)`.
  - Per session (the same last 12 as the trend), take the working sets only (`isWorkingSet`).
  - Split kg into easy, ideal, max and unrated, using `LoggedSet.effort` (models.ts:90). `kind: 'failure'` counts as max (models.ts:102).
  - kg = load × reps. For bodyweight and assisted exercises use the F13 effective load (`effectiveLoadKg`, src/brain/bodyweight.ts:61). With no body weight saved, those sets count as 0 kg, which is the same rule as Stats.
  - Timed, distance and carry exercises with no kg: count working sets instead, and label the axis "sets".
- **Chart:**
  - Stacked bars, easy at the bottom, then right, then max, then unrated on top.
  - Colours: easy `var(--text-2)`, right `var(--accent)`, max `var(--warning)`, unrated a hatched fill (`--text-3` stripes) with a `--text-2` outline; each at least 3:1 against the card in both themes (amended 2026-09-26 by QA13-6: `--text-3` and `--surface-3` measured below 3:1). Legend: "Easy · Right · Max", plus "Not rated" only when some sets are unrated.
  - The total sits above each bar in tabular numbers, as "2,250" or "2.7t" when ≥10,000. Dates below, e.g. "3 Sept".
  - Bars are 38px wide at 390 px, scaled to the widest session. With more than 8 sessions, scroll horizontally inside the card, never the page, and open scrolled to the latest.
  - The tallest bar is 120 px, with no y-axis.
  - One summary line under it: "Most work: 2,700 kg on 19 Sept." plus "Latest session had no max sets." when that's true.
  - Tapping a bar selects it and shows that session's sets, the same text as the history rows. Once A6 lands, a finger scrub works the same way.
  - Units follow the kg/lb setting.
- **Escobar:**
  - `lift_trend` adds `effort: [{day, easy, ideal, max, unrated}]` (numbers only; no body weight unless `sharing.body`, per BODY_KEYS).
  - LiftTrend draws EffortBars under the sparkline at 120 px, with no tap.
  - The existing fact labels stay unchanged, so the verifier can still ground numbers.
- **Acceptance:**
  - Unit tests: the owner's Leg Press sessions give totals 2,250 / 2,050 / 2,700 / 2,385, split as in the artifact; failure counts as max; unrated sets are shown; bodyweight sets with and without a saved body weight; a timed exercise counts sets.
  - Gate at 360 and 390 px, Paper and Silent Black: no page scroll, labels don't overlap, a tap selects a bar, and the Escobar lift_trend card shows the bars.
  - With `sharing.body` off, lift_trend output has no body-weight-derived numbers.
- **Risk:** Low. Read-only display. Totals must match Stats (the same working-set and body weight rules), and a test covers that.

## 7. Not doing and Later

Not doing:
- Swipe between bottom tabs: Material says bottom-nav content should not swipe, and it fights the Android back gesture.
- Swipe-to-delete on live set rows: rows are full of inputs and effort buttons; 'Delete set' with Undo (F10) covers it.
- Animating the set commit (check bounce, row flash, digit roll): 15-40 times per session; colour change plus a crisp confirm is the premium choice.
- Rolling digits on live clocks, bpm or rest: frequent and informational; tabular-nums only.
- Count-up of finish-screen numbers: the user saw the same numbers a second earlier in the finish sheet.
- Bars growing in on each visit (`@starting-style`): History/Body remount per tab visit, so it would replay constantly.
- Sparkline gradient area fill: carries no data.
- Trophy tilt on PR: decoration; the pop and the haptic carry the moment.
- Accent dot on the active exercise: third signal for one state.
- Tick on segmented controls: they are view switchers (tabs), which stay silent.
- Skeletons or ghost rows (Today/History/Body, empty History): data is local and renders under 100ms; ghost rows read as 'loading'.
- Pull-to-refresh: offline-first, nothing to refresh.
- Confetti, particles, sounds: off-brand for a calm app.
- Motion/gesture libraries (motion, sortablejs, use-gesture): 12-48KB gzip each; WAAPI + CSS linear() + a ~150-line gesture.ts do the job.
- Changing toast lifetimes to 4000ms: 3000/5000 is fine and the gate asserts restart behaviour.
- Weight-entry accessory bar above the keyboard: visualViewport positioning in Android WebView is unreliable (unverified); A1 and A8 remove most typing.

Later:
- PulseLine repaints a box-shadow blur and opacity through a CSS variable every rAF while the watch streams (styles.css:365): replace with a WAAPI opacity loop (duration 60000/bpm, re-keyed on bpm) on a pre-blurred layer; needs an ALLOW entry for a named JS animation.
- Native rest-done: if the owner check shows no vibration at 0 with the app open, cancel the scheduled notification while visible (`cancelRestDone()`) and reschedule on visibilitychange→hidden, then fire `alert` in-app on native too.
- Keep the focused set row above the keyboard with visualViewport (`scrollIntoView({block:'nearest'})` after resize) if the device check shows it hidden.
- Gate pass at 360px with Android font scale 1.3 (whether the APK WebView follows system font size is unverified).
- Brand distinctness (owner decision): Silent Black #08090a/#f7f8f8/#5e6ad2 plus Inter is close to Linear's public look (unverified comparison). Give M/ARC one owned signature (default-theme accent or a display treatment for the rest clock and PR numbers) before further polish.
- Convert the raw `.seg` markups (Settings.tsx:138, Gyms.tsx:36, Train.tsx:117) to `<Segmented>` and drop the `:has()` fallback.
- Changing body `overscroll-behavior` none→contain (Android stretch; WebView effect unverified).
- Predictive back-to-home at root (needs an Android 16 device test that the live session survives backgrounding).
- Rest notification with ±15/Skip actions and a lock-screen countdown (native feature ticket).
- Share card image of a finished workout (new feature).
- Streak milestones and a weekly streak (product logic; owner).
- Replacing the Today greeting h1 with the day's job (copy decision; owner).
- Card overuse (80 `<Card>` uses) and a Today layout rework (broad redesign; after this pass, with owner screenshots).

## 8. Sources

Opened (by the critics in this pass):
- https://www.w3.org/TR/css-transforms-2/ — individual `translate`/`rotate`/`scale` compose before `transform`; `scale` multiplies a transform translation.
- https://data.jsdelivr.com/v1/packages/npm/@fontsource-variable/inter@5.3.0 — file list; latin wght woff2 48,256 B; latin opsz 72,920 B.
- https://developer.android.com/develop/ui/views/haptics/custom-haptic-effects — VibrationEffect.Composition primitives and `areAllPrimitivesSupported`.

Local, verified: node_modules/@capacitor/cli/dist/declarations.d.ts:59-64 (`backgroundColor` option).

Cited by the research agents; URLs not reopened in this pass, so the values are treated as tuning constants (unverified):
- M3 motion easing and duration tokens — https://m3.material.io/styles/motion/easing-and-duration/tokens-specs
- AOSP ViewConfiguration (touch slop, long-press timeout) — https://cs.android.com/android/platform/superproject/+/main:frameworks/base/core/java/android/view/ViewConfiguration.java
- AndroidX ItemTouchHelper (swipe threshold, auto-scroll) — https://cs.android.com/androidx/platform/frameworks/support/+/androidx-main:recyclerview/recyclerview/src/main/java/androidx/recyclerview/widget/ItemTouchHelper.java
- HapticFeedbackConstants — https://developer.android.com/reference/android/view/HapticFeedbackConstants
- Vaul drawer constants — https://github.com/emilkowalski/vaul/blob/main/src/constants.ts
- Sonner toast swipe constants — https://github.com/emilkowalski/sonner/blob/main/src/index.tsx

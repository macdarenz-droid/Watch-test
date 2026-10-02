# M/ARC on `origin/main` @ `f1e514a` (2026-10-01): what is there today

This covers main only, read from a `git archive` snapshot. Open PRs are counted only as open issues.

## 1. Features a user can use today

App name "M/ARC", package `com.mrcdrnzz.dailytracker`, version 37.1.0 (`capacitor.config.json`, `package.json`). It has 5 tabs: Today, Train, History, Body and Escobar (`src/app/router.ts:8-15`). Every item below has a UI caller in `src/slices/**` or `src/app/App.tsx`.

**Workout logging (live)**: `src/slices/workout/Train.tsx`, `src/core/sessionLogging.ts`
- 5 resistance modes: `weighted | bodyweight | assisted | duration | conditioning` (`src/core/models.ts:13`).
  - "Holds" are the `duration` mode.
  - Carries and sleds are conditioning moves that progress by distance or time (`src/core/exercises.ts:8-17`, `distanceM` at `models.ts:92`).
- Set kinds: warmup, drop and failure (`models.ts:106`). Effort rating is easy/ideal/max (`models.ts:4`).
- Also in the live session: notes, pause/resume, skip, substitute an exercise (`brain/substitute.ts`), reorder, live retargeting (`brain/retarget.ts`) and live record badges.
- Rest uses a timer or heart rate (`models.ts:242`). The screen can stay awake (`native/keepAwake.ts`).
- You can enter past sessions afterwards (retro entry) and edit them later (`History.tsx` SessionEditor).
- **Supersets are not supported.** The word appears only in an advice line (`brain/coach/post.ts:152`).

**Plans and splits**
- Up to 7 splits (`slices/workout/splits.ts:9`).
- 7 built-in templates: Push, Pull, Legs, Upper, Lower, Full body A and B (`src/data/templates.ts`).
- Weekly schedule, goal sheet and custom exercises (`ExercisePicker.tsx`).
- Gyms with equipment profiles that know which loads are really available: plates, pin steps, kg or lb per gym (`models.ts:34-53`, `Gyms.tsx`).

**Progression and targets**
- Each set gets a target based on its mode, history, goal, readiness, recovery, deload and equipment (`brain/progression.ts`, `retarget.ts`, `deload.ts`, `e1rm.ts`).
- The app suggests deloads and you accept them (`Coach.tsx`, `Train.tsx`).

**Recovery and readiness**
- Per-muscle recovery model that slowly tunes itself to you (`brain/recovery.ts`, `RecoveryModel` at `models.ts:316`).
- Readiness comes from sleep, a check-in, heart data and training load (`brain/readiness.ts`, `slices/readiness/checkIn.ts`).
- Shown on Today, Train and Coach.
- Two of the audit's 4 most serious bugs (P1) are still open here: SCI-01 and SCI-02 (see section 3).

**Body map**
- Muscle map with 3 views: recovery, levels and this week (`router.ts` BODY_VIEWS, `ui/MuscleMap.tsx`).
- A sheet for each muscle, and a body-fat estimate (`Body.tsx`, `core/bodyfat.ts`).

**History, stats and charts**
- Calendar, session log with edit and swipe-delete with Undo, weekly volume chart, exercise trends, records, energy estimates (`History.tsx`, `history/volumeChart.ts`, `progressTrend.ts`, `brain/prs.ts`, `ui/Sparkline.tsx`).
- Share cards rendered as PNG images on the phone (`slices/share/*`).

**Built-in rule coach (works offline)**
- Notes before, during and after a workout, plus a weekly review (`src/brain/coach/{pre,live,post,weeklyReview,rules}.ts`, 24 rule ids in `rules.ts`).
- It decides which notes to show first. Notes can be snoozed or marked helpful.

**Escobar, the AI coach (online, optional)**
- **Off by default**. Sharing of health and body data is also off by default (`models.ts:445-475`).
- Runs through a Cloudflare Worker to the Claude API. The Worker's default model is `claude-opus-5` and can be changed by setting (`escobar-worker/src/anthropic.ts:39`). Which model is live now is not verified.
- 6 modes: chat, plan, live, brief, moment, summarize (`prompt/modes.ts:3`).
- 45 tools (`src/escobar/tools/schema.ts`):
  - about 20 read tools (sessions, records, recovery, readiness, health, heart, volume and more);
  - `calculate`, `lookup_knowledge`, `navigate` / `find_in_app`, `show` / `pin_card`;
  - `remember` / `recall` / `forget`;
  - 17 `propose_*` tools (split, program, today, deload, goal, gym, reminder, settings and more), which change nothing until the user taps Apply.
- Memory: at most 60 items, with a Memory screen to see and delete them (`models.ts:478`, `escobar/ui/MemoryScreen.tsx`). Up to 4 pinned cards. Photos stay out of localStorage (`escobar/images.ts`).
- Answers are checked against the user's own numbers (`escobar/verify.ts`).
- **Crisis check before sending**: `safetySignals()` runs a word-pattern check on the user's text before any network call (`loop.ts:435-437`, `verify.ts:171-217`).
  - It shows a safety card (`ui/Escalation.tsx:14`). It does not block the message, which is still sent.
  - Its false positives and misses (BUG-35 #152) are still open.
- **Limits per day** (`escobar-worker/src/quota.ts:11`):
  - per device: 80 turns, 400 steps, 400k output tokens;
  - per IP: 300 turns;
  - for everyone together: 20k steps and 3M output tokens;
  - plus per-minute rate limits per device and per IP (`handler.ts:119-125`).
  - Since AUD-3 (#145) the Worker reserves the allowance before the paid call.
- When offline it answers locally by pointing to where things are in the app (`loop.ts:439`).

**How-to sheets**
- **8 of 153 exercises** have one: lateral raise, back squat, pull-up, hanging leg raise, lat pulldown, seated cable row, leg press, machine chest press (`src/howto/ids.ts`, `coverage.ts` statuses).
- They are offline SVG illustrations ("plates"), not video. Each loads only when opened (`howto/generated/*.ts`, about 839 KB).
- The entry point is in Train: `Train.tsx:774`.

**Exercise library**: 153 exercises (`src/data/exercises.json`), plus custom exercises.

**Watch, heart rate and Health Connect**
- Heart rate from a Bluetooth LE device that sends standard heart-rate data, kept running by a foreground service (`native/watch/*.java`, `src/native/watch.ts`). There is a Watch sheet.
- Health Connect reads steps, sleep, resting heart rate, workout heart rate and calories (`native/HealthConnectNativePlugin.java`, `src/native/health.ts`).
- **There is no Wear OS or Huawei watch app on main**: `native/wear/`, `wearEngine.ts` and `WatchLab.tsx` are absent.

**Themes**: 5 (silent-black, paper, ember, emerald, midnight) in `src/theme/themes.ts`.

**Units**: kg or lb per gym (`Settings.tsx:167`, `core/units.ts`).

**Backup and restore**
- JSON backup and restore, CSV export, a "rescue file", weekly backup reminder on the phone, reset (`slices/settings/backup.ts`, `exportCsv.ts`, `Settings.tsx:224-242`).
- One-time import from the old single-file app (README).

**Offline**
- The app saves locally (localStorage `marc.state.v1`, with a backup key and copies of corrupt data in `core/store.ts:17-23`).
- PWA service worker at `public/sw.js`. Everything except Escobar works offline.

**Onboarding**: `slices/profile/Onboarding.tsx`, `brain/onboarding.ts`.

**Notifications**: training reminders (time, style, readiness summary, exact-alarm permission), rest-done alerts and backup reminders (`Settings.tsx:175-182`, `native/notifications.ts`).

**Accessibility**
- 107 `aria-*` attributes in the `.tsx` files. A reduced-motion switch that follows the phone's setting (`ui/motion.ts`, `Settings.tsx:191`). Haptics on/off.
- Audit UI-09 found that some goal, exercise, watch and reorder actions cannot be done by keyboard (fix in open PRs).
- English only (`index.html` `lang="en"`, no translation code found).

**Error reports**: anonymous, opt-in, sent to the Worker (`Settings.tsx:242`, `escobar-worker/src/errors*.ts`).

## 2. What most gym apps have and M/ARC does not

- No accounts, login or cloud sync. Data lives on one device and moves only by backup file.
- No iOS app (no `@capacitor/ios`). Android 8.0+ only (`scripts/prepare-android.sh:13`, minSdk 26).
  - A PWA build exists, but whether it is hosted anywhere is not verified.
- No social features: no feed, friends or leaderboards (no matches found).
- No exercise videos. Illustrated How-to covers 8 of 153 exercises (5%).
- No nutrition or macro tracking. Calories are only estimated for workouts.
- No supersets or circuits as a logging type. No standalone plate calculator screen (equipment profiles cover loadable weights instead).
- No template marketplace or shared programs. Only the 7 built-in templates plus AI-proposed programs.
- Wearables: only Bluetooth heart rate and Health Connect. No Wear OS, Apple Watch, Garmin or Huawei app on main.
- No translations. Not in any app store yet (section 4).

## 3. How it is built

**Stack**
- Preact 10 with Signals, TypeScript 5.7, Vite 7, Capacitor 8.5 for Android.
- 10 runtime dependencies and 8 dev dependencies (`package.json`). The lockfile holds 278 packages.
- Native Java: a heart-rate service, the Health Connect plugin, `MainActivity` (`native/`).

**Backend**
- Cloudflare Worker `escobar-worker/` (about 4,600 lines): Anthropic SDK 0.128, a Durable Object for quotas, rate limits, and D1 storage for error reports.
- Deploys automatically on merge to main (`deploy-worker.yml`).
- `relay/` is a separate agent workspace and not part of the app.

**Code size**
- `src`: 26,288 lines of TS/TSX plus 966 lines of CSS (generated How-to files are 237 lines but about 839 KB).
- Data: `exercises.json` 2,810 lines, `knowledge.json` 1,383 lines.
- Tests: 22,369 lines.

**Tests**
- 161 test files: 151 app, 9 Worker, 1 Relay.
- Roughly 2,000 `it` / `test` calls: about 1,840 app (349 Escobar, 236 How-to), about 141 Worker, about 19 Relay. The Codex audit counted 152 Worker tests.
- The app suite runs in 3 time zones (`test:tz`) and also runs timing budget tests (`tests/perf`).

**CI** (8 workflows in `.github/workflows`)
- `build-apk.yml` "M/ARC gate", on every push, 3 jobs:
  - `source-gate`: Worker checks, typecheck, tests, build;
  - `visual-gate-tz`: the visual gate again in the Pacific/Auckland time zone;
  - `android-gate`: a debug APK signed with the permanent key.
- `agent-guard.yml`: enforces `docs/AGENT-RULES.md`.
- `release-apk.yml`: on demand only.
- `play-bundle.yml`: unsigned App Bundle (AAB).
- `deploy-worker.yml`, `deploy-relay.yml`, and two one-off Play key jobs.

**Visual gate**
- `scripts/screenshot-gate.mjs`, 6,376 lines, Playwright.
- Starts from data in the old app's format, walks every screen in all 5 themes, takes 51 screenshots and has about 768 `errors.push` checks.

**Signing**: one permanent key (SHA-256 `05:66:9A:…:F1:F5`) kept in GitHub secrets (README).

**Bundle size** (Codex audit): main JS 640 KB (190 KB compressed), with a warning that one chunk is over 500 KB.

**Known open issues**
- Codex audit (32 findings: 4 P1, 28 P2; `codex-audit.md` "Findings at a glance"). P1s:
  - SEC-01 (quota): **fixed on main** (AUD-3, `7477b5d`).
  - SEC-03: switching the coach off does not stop a reply already in progress.
  - SCI-01: assisted-exercise progress trains the recovery model the wrong way.
  - SCI-02: 4-hour sleep every night can still give a perfect readiness score.
  - The 3 still-open P1s, and every finding except SEC-01, are **not fixed on main**. Fix PRs AUD-1, 2 and 4 to 12 are in review or building (HANDOVER §8.2). AUD-20 has not started. DEV-01 was closed by the owner ("skip").
- Improvement audit (`improvement-audit.md`): 21 more findings (20 P2, 1 P3).
  - Examples: weights from another gym prescribed during a live workout (ENG-01), substituting an exercise erases already logged sets (UI-R01), Undo affects the wrong conversation (IMP-E02), Reset is undone by a health read still in progress (IMP-N02).
  - All parked by the owner.
- Other open lanes:
  - How-to sheets HT-5 to HT-10 (open).
  - Library rollout to all 153 exercises (LIB lane, later).
  - BUG-34, BUG-35, COPY-1, ESC-REPORT app (#130).

## 4. Release status

**It is not on Google Play.**
- `docs/RELEASE-READINESS.md:79-91`: the pipeline builds only an *unsigned* App Bundle. Still needed from the owner:
  - Play developer account;
  - Play App Signing choice and the upload-key step;
  - a **closed test with 12 testers for 14 days**;
  - GitHub Pages for the privacy policy (PR #93);
  - the Play Console forms.
- The upload certificate is not on main (`.github/play/` is absent). Whether the upload-key job has run is not verified.
- Owner steps that block the store upload (`RELEASE-READINESS.md:63-70`):
  - a test on a real phone;
  - a spending cap on the AI key;
  - approval of screenshots and the age rating.
- `docs/PLAY-SUBMISSION.md` holds only draft answers for the forms. Its privacy URL points to a site deployed by hand from another branch; whether that site is live is not verified.
- Today the app reaches users only as sideloaded APKs: a debug APK from each gate run, or `release-apk.yml` on demand, which per `RELEASE-READINESS.md:48` had never run as of 2026-09-30.

**Not verified:** the live Worker's model and settings, whether the PWA is hosted, and any behaviour on a real device.
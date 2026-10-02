# Coaching implementation progress

Resume from this file, `docs/COACHING-DECISIONS.md` and `docs/COACHING-PLAN.md`. Never re-derive finished work — check "Items done" first.

**Phase order**: P0 → P0-P → P1-R → P2-C → P1 → P2 → P3 → P4.
**Layer order inside a phase**: data model → brain → native → UI → gate. Commit at each layer, push at end of phase.

PR: https://github.com/macdarenz-droid/M-arc/pull/2 (kept open across all phases; checklist updated after each phase).

## Phase P0 (Close the loops) — DONE
Native health plugin compiles into the APK (CI copy + manifest patch), `health.ts` bridge fixed, `DailyHealth`/`healthDays` added, auto-sync on boot/pageshow/session-start, insights use the minute-quantised clock, profile gained `birthYear`.

## Phase P0-P (Profile and goal) — DONE
Onboarding sheet + profile dashboard, `profileHistory`, weight log, `profile.changed` insight, goal rewritten as a full policy object (role-based main/accessory ranges, low-range e1RM step-down, rest suggestion, starter templates per goal).

## Phase P1-R (Recovery v2) — DONE

Sections read: 6.11 (recovery model), F3.1, 6.12.1 (data gaps), 6.17 (logging fidelity).

### Layer: data model — done, commit 7638f50
- `core/models.ts`: `LoggedSet.at/restSec/fidelity/flags`; `Session.logging: SessionLogging`, `day` now derives from `trainedAt`; `CheckIn` (soreness-only for now, other fields optional), `RecoveryModel`, `FreshMark`.
- `core/store.ts`: backfills `logging` via `legacySessionLogging()` for any session saved before the field existed.
- `data/muscles.ts`: `recoveryFactor` per muscle (τ_base prior).
- `brain/fidelity.ts` (new): `classifySetFidelity`, `isCompressed`, `liveSessionLogging`/`retroSessionLogging`/`legacySessionLogging`, plausibility checks (`implausibleLoad`/`implausibleReps`/`unitSuspect`/`futureTime`/`isDuplicateSession`).

### Layer: brain — done, commits 43c0fa3, 766b189
- `data/recovery.ts` (new): the model's full parameter table.
- `core/exercises.ts`: `exerciseDamage()`/`setDamage()` (damage factor, same code-derived pattern as `roleOf()`).
- `brain/recovery.ts` rewritten: impulse-response model (per-set impulse → per-session-per-muscle dose+τ → fast+slow decay stacked over 7 days → pct vs personal reference dose), ready@90%/full@97% both solved numerically with a ±15% display band, systemic (whole-body) factor from sleep/resting-HR/session-RPE load ratio (capped 1.25x, gated on real history — see decisions), soreness cap, "Mark as fresh" override, `calibrateTauScale`/`calibrateAfterSession`.
- `coach/rules.ts`: new `recovery.scheduled-conflict` rule (F3.1), doesn't require `personalized`.
- Verified against the plan's own worked example (ready ~24/34/47h, full ~55/77h, 8 max sets ~75h) — matches almost exactly once each scenario's own history defines its reference dose.
- Tests: `tests/fidelity.test.ts` (21), `tests/recovery.test.ts` rewritten (20, including the 36h-apart stacking test, 120h cap, 7-day floor, soreness cap, fresh-mark override, calibration bounds/direction).

### Layer: native — N/A (no native code needed)

### Layer: UI — done, commit 47b8ccb
- `session.ts`: `commitSet` records `at`/`restSec`/`fidelity`; auto-rest restarts only on a live commit; `finishSession` builds `logging` and derives day/timing from `trainedAt`; `resolveSessionTiming()` (patches a compressed session after the time question); `logPastSession()` (timer-free entry); `calibrateAfterSession` wired in.
- `Train.tsx`: "When did you train?" sheet on a compressed finish; "Log a past session" button + entry grid (no timer, no rest banner).
- `Body.tsx`: three-state recovery map (Recovering / Ready for hard work / Fully recovered), ready-in-hours range + confidence per muscle, drivers + "Mark as fresh" in the muscle sheet, whole-body systemic line.
- **Found and fixed two real bugs via manual Playwright verification** (not just unit tests): (1) the systemic training-load ratio spiked to >1.25x for any brand-new account's very first session (fixed by requiring real history — see decisions); (2) the time-question sheet's default start time could land in the future when the reminder-time guess hadn't happened yet today, which the model correctly zeroed out to "100% recovered" (fixed the default, not the model).

### Layer: gate — done, commit bc28b8c
- `npm run check`: **PASS** (typecheck, 114/114 tests across 13 files, build).
- `npm run gate`: **PASS** — 5/5 themes. The scripted finish is fast enough to be "compressed" every run, so the time-question sheet is exercised and screenshotted for real on every gate run (not a synthetic fixture); "Log a past session" is exercised and screenshotted; Body's existing screenshot slot now shows the three-state map.

### P1-R report
- **Built**: see layer sections above.
- **Tested**: `npx vitest run tests/fidelity.test.ts tests/recovery.test.ts` → 41 passed. `npm run check` → 114/114, clean build. `npm run gate` → 5/5 themes PASS, screenshots visually confirmed (time-question sheet, past-session grid, three-state Body map with a legitimate "whole body" line on the legacy fixture's ~29 days of history).
- **Decided by research**: none requiring external sources this phase (the recovery model's constants come straight from the plan's own formulas, verified by reproducing its worked examples numerically).
- **Scoped down (recorded in COACHING-DECISIONS.md)**: `exerciseDamageScale` calibration axis omitted (no distinct trigger/test named); full 6.17.4 gating matrix / `tests/gating.test.ts` deferred to the phases that build the gated features; History tags and the post-session debrief deferred to P2-C (explicitly assigned there by section 7); foreground/background gap distinction collapsed into one rule.
- **Needs device check**: none new (pure web/TS/UI).
- **Depends on this for later phases**: P2-C's `metrics.ts` and post-session debrief will read `Session.logging` and the fidelity gating; P3's readiness card extends the same `healthDays`-based systemic-factor pattern; P4's deload state reads `recoveryModel`/calibration observations.

## Phase P2-C (Coach v2) — DONE

Sections read: 6.12 (CoachContext v2, insight shape, cadences), 6.13 (insight catalogue), section 7 (P2-C row).

### Layer: data model — folded into the brain commits (no separate commit)
- `core/models.ts`: `AppState.weeklyReviewDismissedWeek?: string` (Monday key of the week already reviewed).
- `brain/recovery.ts`: `trainingAgeMonths`/`ageOf` changed from module-private to exported, for `weeklyReviewInsights`'s `trainingAgeMonths` input and `Coach.tsx`'s `WhatCoachCanSee`.

### Layer: brain — done, commits d142028, 6a91163, 9839a5b
- `brain/e1rm.ts` (new): `effectiveOneRm` (effort-aware e1RM: RIR by label, easy +3/ideal +2/max +0, plus an optional personal bias), `e1rmWeight`, `roundToStep`, `isRealChange` (two-typical-error threshold), `loadForReps` (Epley inverted). `history.ts`'s `bestE1rm` and `prs.ts`'s strength-record threshold (1% → the plan's 2.5%) now use it.
- `brain/effortBias.ts` (new): `rirObservations`/`effortBiasByLabel` — pairs a max-effort set with a non-max set at the same load within 14 days to learn a personal RIR bias per effort label, gated on 3+ pairs.
- `brain/coach/weeklyReview.ts` (new): sets-vs-band (fractional hard sets), frequency per muscle, e1RM trend, progress vs. training age, rep-range mix, failure share, staleness, adherence, weight trend vs. the goal's band; `weekHasEnoughData()` (≥5 logged days this week) gates the whole set; `weeklyReviewInsights(input, limit=6)`.
- `brain/coach/pre.ts` (new): `workingLoadTarget`, `warmupRamp`, `mastersDefaults`, `preSessionInsights(input, limit=3)`.
- `brain/coach/post.ts` (new): `recordsInsight`, `effortMixInsight`, `restAndDensityInsight` and `durationDriftInsight` (the last two gated on `session.logging.timingTrusted`), `postSessionInsights(input, limit=4)`.
- `brain/coach/live.ts` (new): `autoregulationSuggestion` — after a main lift's first live-committed set, easy at/above target reps suggests more load (2.5% step after 3+ sessions of history, else flat 2.5 kg); missing target by 2+ reps at max effort suggests less, advising ideal effort for the rest.
- `brain/coach/rules.ts`: `Insight` gained the v2 fields (`kind`, `cadence` — now includes `'live'` — `evidence`, `numbers`, `drivers`, `unlocks`, `validUntil`) as optional additions; two new now-cadence rules, `progress.plateau-lever` and `readiness.effort-calibration`.
- Tests: `tests/e1rm.test.ts` (10), `tests/effortBias.test.ts` (6), `tests/weeklyReview.test.ts` (13), `tests/pre.test.ts` (6), `tests/post.test.ts` (10), `tests/live.test.ts` (8), `tests/coach.test.ts` (+4 for the two new rules).

### Layer: native — N/A (no native code needed)

### Layer: UI — done, commits 3ce4016, a72e4c6
- `Train.tsx`: starting a split shows a `PreSessionSheet` (load target, warm-up ramp, masters note) before the timer starts; `EntryCard` shows the autoregulation line under a main lift's open exercise, in the accent colour, once its first set is committed live; the finish screen appends a `Debrief` section built from `postSessionInsights()`.
- `Coach.tsx`: `WeeklyReviewCard` (top item as a teaser, opens a sheet with the rest, "Dismiss until next week" keyed to the Monday date so it reappears next week) and `WhatCoachCanSee` (sets logged, effort-rated share, live-logged share, Health Connect, today's check-in, profile completeness, weigh-in count — each with what it unlocks).
- Manually verified via Playwright (not just unit tests, since these are UI-driven, evidence-gated features): the pre-session sheet with no history ("Nothing to flag"); the post-session debrief with 4 rated sets (effort-mix row); the weekly review card and its sheet after 5 sessions logged across the current week (also confirmed `WhatCoachCanSee` renders further down the same page); the autoregulation line in both directions (easy → "Try 52.5 kg for the next set", max miss → "Drop to 50 kg and keep the rest at ideal effort") against a fixture with 5 prior sessions of real history.

### Layer: gate — done, commits 900af9a, a72e4c6
- Extended the silent-black walkthrough: screenshots the pre-session sheet; logs 4 rated sets (first one easy at the placeholder target, to exercise autoregulation; the mix still lands in the "healthy spread" branch so the existing debrief assertion holds); screenshots the live session (now asserted to contain an autoregulation "for the next set" line) and the finish screen (now asserted to contain a `Debrief` section).
- New fixture pass: a fresh profile logs 5 past sessions across the current calendar week via the existing "Log a past session" flow, then screenshots the Coach page (asserted to show "Weekly review") and the opened weekly-review sheet.
- `npm run check`: **PASS** (typecheck, 171/171 tests across 19 files, build). `npm run gate`: **PASS** — 5/5 themes, all new assertions hold, no page errors.

### P2-C report
- **Built**: see layer sections above — effort-aware e1RM, effort-calibration foundation, weekly review, pre-session brief, post-session debrief, in-session autoregulation, "What the coach can see".
- **Tested**: `npx vitest run` → 171/171 passed across 19 files (added `e1rm`, `effortBias`, `weeklyReview`, `pre`, `post`, `live`, plus 4 new `coach.test.ts` cases). `npm run check` → clean typecheck, 171/171, clean build. `npm run gate` → 5/5 themes PASS; screenshots visually confirmed for the pre-session sheet, the post-session debrief, the weekly-review card + sheet, and the autoregulation line (both the "add load" and "ease off" branches, the latter landing on a real plateau-detected 40 kg target from the legacy fixture's history).
- **Decided by research**: none requiring external sources this phase (e1RM RIR-by-effort mapping, record threshold, and autoregulation's formula all came straight from the plan's own tables).
- **Scoped down (recorded in COACHING-DECISIONS.md)**: insight feedback/snooze (F3.6) deferred to P4 — the plan assigns it to both phases in scope prose, but only P4's Done-when has a concrete test for it; the "watch" row in "What the coach can see" omitted until P1 builds WatchBridge; the post-session debrief is recomputed live rather than persisted to a new `Session.debrief` field (no second reader yet).
- **Needs device check**: none new (pure web/TS/UI; autoregulation and the debrief were both verified against realistic history via Playwright, not a real watch or phone).
- **Depends on this for later phases**: P1's live-HR work will add a `watch` row to "What the coach can see" and HR-aware rows to the post-session debrief; P2's HR-guided rest and effort-mismatch rules extend `coach/live.ts`'s cadence; P4's deload state will suppress `autoregulationSuggestion` on a back-off day (no-op today since `deload` doesn't exist yet) and builds the F3.6 feedback/snooze mechanism this phase deliberately deferred.

## Phase P1 (Live HR / WatchBridge) — DONE

Sections read: 6.2, 6.3 (WatchBridge/native BLE), F0.4, F1.1, F1.6, 6.10 (energy + profile sheet on first connect), section 7 (P1 row). Ported from `macdarenz-droid/Watch-test`'s Java (read-only; that repo was never modified).

### Layer: data model — done, commit 88e7a49
- `core/models.ts`: `SetHeart` (peak/end/restStart/hrr60), `SessionHeart` (source/deviceName/samples/avg/max/min/hrr60Median/zoneSec/energy/coverage), `SessionEnergy` (gross/active/low/high/minutes/source/profileSnapshot — frozen at finish, never recomputed from a later profile edit), `Profile.hrMaxOverride`/`restingHrOverride`, `Preferences.watch` (autoConnectOnSession/deviceAddress/deviceName). `LoggedSet.heart?`/`Session.heart?`.

### Layer: brain — done, commits beb5b05, 916b9e5
- `brain/heart.ts` (new): `hrMax` (override → validated observed max, decaying toward Tanaka past 12 months → Tanaka → 190), `observedHrMaxFromSeries` (5+ point plateau within 3bpm, reached by a ramp, <=220bpm), `downsampleToBuckets` (raw samples → 5s-bucket medians, contact=true only), `bestObservedHrMax` (aggregates across stored session series), `restingHr` (override → 7-day Health Connect median → null, no session inference), `zones` (Karvonen boundaries at 50/60/70/80/90% HRR), `signalQuality` (coverage), `setHeartFromWindow` (per-set peak/end/HRR60), `sessionHeartSummary` (the finish-card aggregate; `restingHrBpm` nullable — see decisions).
- `brain/energy.ts` (new): Mifflin-St Jeor BMR, Keytel gross kcal/min, `sessionEnergy` (heart-rate integration), `energyFromWatch`/`energyFromHealthConnect` (pure, the latter has no native caller yet — see decisions), `pickEnergy` (Health Connect > watch > heart rate), `dailyActiveKcal`, `weeklyEnergy`.
- Tests: `tests/heart.test.ts` (25), `tests/energy.test.ts` (18), `tests/heartStore.test.ts` (5).

### Layer: native — done, commit 72f27db; real compile verified by CI
- `native/watch/core/{HeartRateMeasurement,LiveSession}.java`: ported verbatim from Watch-test's Android-free `sensor-core`; compiles standalone with `javac` (checked directly in this environment, no Android SDK needed since they have zero Android dependency).
- `native/watch/{WatchService,DeviceScanner}.java`: ported from Watch-test, repackaged, notification points at M/ARC's `MainActivity`.
- `native/watch/WatchBridgePlugin.java` (new): the `@CapacitorPlugin(name="WatchBridge")` adapter matching the plan's exact TS contract (isSupported/permissionState/requestPermissions/startScan/stopScan/connect/disconnect/status, watchStatus/watchMeasurement/watchDevice events).
- `native/MainActivity.java`, `native/patch_manifest.py`, both CI workflows updated and verified against a synthetic manifest (idempotent, correct attributes) since this environment has no Android SDK to run a real `cap sync`.
- **This branch's own push triggered the real GitHub Actions Gradle build** (`android-gate` job, run 35739430443): "Build debug APK" succeeded — the actual, non-simulated compile check for every Android-dependent file in this layer passed.
- **Needs device check**: real BLE connection to a broadcasting watch, permission prompts on real API levels (31+/<=30/33+) — nothing further to verify without hardware; the code path has no substitute for an actual watch broadcast.

### Layer: UI — done, commits 036c489, 7f3aa85
- `native/watch.ts`, `core/heartStore.ts`, `slices/workout/heart.ts`: plugin wrapper + signals, the separate `marc.heart.v1` store (LRU 60), live-only in-memory capture wired into `session.ts` (`startSession`/`commitSet`/`finishSession`/`discardSession`), `main.tsx` boots both.
- `Train.tsx`: live pill (bpm + freshness dot, hidden on web) opening the new `slices/settings/Watch.tsx` `WatchSheet` (scan/connect/disconnect/auto-connect, shared with Settings); per-set "peak N" badge; finish screen "Heart" card.
- `History.tsx`: session card heart/kcal line. `Settings.tsx`: "Health" section renamed "Watch and health", gains a Watch row. `Onboarding.tsx`/`brain/onboarding.ts`/`profile.ts`/`selectors.ts`: the watch-connects-for-the-first-time trigger.
- **Manually verified end to end via Playwright** with a stubbed WatchBridge plugin (see decisions for the `CapacitorCustomPlatform` technique that made this possible against the real bundled `@capacitor/core`): pill appears and reaches LIVE with a real bpm reading, scan finds a device, connecting works, the onboarding-on-first-connect sheet fires correctly, the per-set peak badge renders, the finish screen's Heart card renders with real numbers. Zero console/page errors. Also reconfirmed (as in every prior phase) that the plain web-fallback path — no watch plugin at all — still produces zero errors through a full log-session-finish-history-settings walkthrough.
- **Found and fixed one real bug this way**: `sessionHeartSummary` was gated entirely on having a resting HR, so the whole Heart card silently disappeared whenever Health Connect had no history yet, even though avg/max/HRR60 don't need one — fixed to make `restingHrBpm` nullable and only skip the zone bar (see decisions).

### Layer: gate — done, commit 27eea4d
- Extends the walkthrough with a watch-stub fixture (plain, non-touch context — see decisions): stubs `WatchBridge` and reports the platform native via `CapacitorCustomPlatform`, then scans, connects, screenshots the watch sheet and the LIVE pill, logs a live set (asserts a peak badge), finishes (asserts a Heart card on the finish screen).
- `npm run check`: **PASS** (typecheck, 223/223 tests across 22 files, build). `npm run gate`: **PASS** — 5/5 themes plus the watch-stub fixture, all assertions hold, no page errors.

### P1 report
- **Built**: see layer sections above — WatchBridge Capacitor plugin (ported from Watch-test), heart-rate and energy brain modules, live capture wiring, live pill, per-set peaks, finish/History heart cards, Watch settings sheet, onboarding-on-first-connect.
- **Tested**: `npx vitest run` → 223/223 across 22 files. `npm run check` → clean. `npm run gate` → 5/5 themes + watch stub, PASS. The real GitHub Actions Gradle build (triggered by pushing the native commit) compiled every native file successfully — not a local simulation, the actual CI check section 7 names.
- **Decided by research**: none requiring new external sources (the heart/energy formulas came from the plan's own tables; the `CapacitorCustomPlatform` mechanism was found by reading `@capacitor/core`'s own bundled source directly, cited in the decisions log).
- **Scoped down (recorded in COACHING-DECISIONS.md)**: native `SharedPreferences` device-remembering skipped (AppState already the single source of truth); Health Connect's `readRange`/`energyFromHealthConnect` native call site skipped (the plan's own hardware note says this source is unreachable on the verified watch/Huawei-Health pairing today); `restTarget`/`rmssd`/`hrrTrend` deferred to P2/P3 per section 7's own phase assignment.
- **Needs device check**: real BLE connection to a broadcasting watch and the runtime permission prompts on real Android API levels — the one thing no environment available here can substitute for. Everything else (native compile, plugin contract, UI wiring, degraded-without-a-watch behaviour) was verified by other means as described above.
- **Depends on this for later phases**: P2's HR-guided rest and effort-mismatch/drift rules read `latestMeasurement`/`SetHeart`/`SessionHeart` this phase built; P3's readiness baselines read `healthDays` the same way P0 already established; P4's deload state is independent of this phase.

## Phase P2 (HR coaching) — DONE

Sections read: 6.4 (`restTarget`, `heart.effort-mismatch`/`heart.drift`), F1.2-F1.5, section 7 (P2 row).

### Layer: data model — done, commit 2afc601
- `core/models.ts`: `Preferences.rest: { mode: 'time'|'heart'; heartTargetPct; minSec }` (default `mode: 'time'`), `RestState.preSetBpm?`/`effort?`.

### Layer: brain — done, commit 15b12af
- `brain/heart.ts`: `minRestSec` (60/90/120 easy/ideal/max, applied uniformly — see decisions), `restReadyBpm`/`restTarget` (3 consecutive settled samples + the effort's minimum time, 300s hard cap), `effortMismatch` (session-relative, only the "easy but near-max" direction the plan's template actually describes), `intraSessionDrift` (3+ same-load sets, rising peak HR + shrinking HRR60).
- `coach/rules.ts`: `heart.effort-mismatch` (110) and `heart.drift` (130, alert) added to the always-on `RULES`, reading the most recent session.
- Tests: 13 new cases in `tests/heart.test.ts` (38 total in that file), 4 new cases in `tests/coach.test.ts`.

### Layer: native — N/A (no new native surface; reuses P1's WatchBridge stream)

### Layer: UI — done, commit 10b2c3e
- `session.ts`: `startRest` captures `preSetBpm`/`effort` at the moment auto-rest starts (from `slices/workout/heart.ts`'s new `latestLiveBpm()`).
- `Train.tsx`'s `RestBanner`: in heart mode with a LIVE stream and a resting-HR source, shows "150 → 103" and ends via `restTarget()`; falls back to the ordinary timer display/behaviour the instant the stream isn't LIVE or heart mode isn't selected — the original timer duration stays the ceiling either way.
- `Settings.tsx`: a "Rest ends by heart rate" toggle appears once a watch is actually connected.
- Manually verified via Playwright with the stubbed-watch technique from P1: heart mode shows the bpm-target banner correctly; forcing the stub's freshness to STALE correctly falls back to the plain timer. Zero errors either way.

### Layer: gate — done, commit d2b5f3a
- Watch-stub fixture now seeds a week of `restingHr` history and `rest.mode: 'heart'`, screenshots the rest banner after a live commit, and asserts the "N → N" heart-guided text appears.
- `npm run check`: **PASS** (typecheck, 239/239 tests across 22 files, build). `npm run gate`: **PASS** — 5/5 themes plus the watch-stub fixture, all assertions hold.

### P2 report
- **Built**: HR-guided rest (target bpm, 3-sample settling, effort-based minimum, 300s cap, timer-ceiling and STALE fallback), `heart.effort-mismatch` and `heart.drift` coach rules, Settings toggle.
- **Tested**: `npx vitest run` → 239/239 across 22 files. `npm run check` → clean. `npm run gate` → 5/5 themes + watch stub, PASS, including a real heart-mode rest screenshot.
- **Decided by research**: none (thresholds either came from the plan's own numbers/examples or are recorded as implementation-detail choices with no plan text to contradict).
- **Scoped down (recorded in COACHING-DECISIONS.md)**: F1.5 (conditioning zone targets, two new record kinds) deferred — not in this phase's literal Done-when, and would need new raw-series plumbing into `prs.ts`/`progression.ts` that doesn't exist; `heart.overreaching`/`heart.hrr-trend`/`data.watch`/`data.health` deferred (unclaimed by any phase's Done-when, and `heart.overreaching` needs P3's not-yet-built readiness module).
- **Needs device check**: the actual HR-guided rest experience on a real broadcasting watch (does 0.6 of reserve / +12bpm feel right in practice) — everything else (the decision logic, the UI fallback, the gate) was verified by other means.
- **Depends on this for later phases**: P3's readiness work will add `heart.overreaching` once its baselines exist; P4's deload state is independent.

## Phase P3 (Readiness) — DONE

Sections read: 6.4's `brain/readiness.ts` bullet, F2.1-F2.5, section 7 (P3 row).

### Layer: data model — folded into the brain commit (no separate commit)
- `core/models.ts`: `DailyHealth.rmssd?/lnRmssd?/rmssdAt?` (F2.3, unpopulated — dormant on the GT6).

### Layer: brain — done, commit 77ceea3
- `brain/readiness.ts` (new): `readinessBaselines` (7d/28d resting HR, 14d sleep median, 7d lnRMSSD mean/SD/CV), `readiness()` — weighted, renormalising, self-report-led score across check-in (0.35)/sleep (0.25)/target-muscle recovery (0.15)/resting-HR (0.10)/HRV (0.10)/acute load (0.05); bands green>=67/amber 34-66/red<=33; `loadAdvice`; never scores from zero inputs (null); "calibrating" until 14 days of check-ins or sleep. Several sub-formulas the plan names but doesn't fully specify (bedtime regularity, the check-in 3-way combination, hysteresis) are approximated or deferred — see decisions.
- `progression.ts`: `suggestNext()` gains an optional `ProgressionContext` (readiness, recoveryPct); 'reduce' holds and drops a set, 'no_increase'/recoveryPct<60 skips the increase branch.
- `recovery.ts`: exported `avg`/`stddev`/`clamp`/`sessionRpeLoad` (were private) for reuse.
- Tests: `tests/readiness.test.ts` (10), 4 new cases in `tests/progression.test.ts`, 2 new cases in `tests/coach.test.ts` (`readiness.today` rule).

### Layer: native — N/A (HRV native read deferred, see decisions)

### Layer: UI — done, commit 7d7dacd
- `Train.tsx`: a "Quick check-in" sheet (F2.2) — sleep quality, mood, and soreness per muscle in today's scheduled split — shows once per day before the pre-session brief, skippable; `suggestNext()` call sites now pass `{ readiness, recoveryPct }`.
- `Today.tsx`: a "Readiness" card above "This week" (band, score, drivers, load advice) or a quiet connect/check-in prompt. `coach/rules.ts`: `readiness.today` (450 red / 380 amber / 120 green on Mondays).
- `app/selectors.ts`: `todayCheckIn`/`todayReadiness` computed once, shared by Train, Today and the coach rules.
- **Found and fixed a real bug via manual testing**: `readiness()`'s target-muscle fallback (every muscle when nothing scheduled) combined with `recoveryStatus()`'s 100%-for-untrained-muscles default was silently padding the recovery sub-score toward green regardless of how bad other inputs were — caught by a failing unit test, fixed by leaving target muscles (and the sub-score) empty when nothing is scheduled. Also added a raw-rating fallback so a first-ever check-in with no history to z-score against still contributes to a (calibrating) score instead of nothing.

### Layer: gate — done, commit 06ad508
- New fixture: 28 days of health data (resting HR elevated the last 7), plus a "two-for-two clean top" exercise history that would otherwise suggest an increase. Asserts a real "Red · calibrating" tier renders on Today, and Train holds the load ("Add one step" does not appear) once readiness is red.
- Fixed the check-in sheet's new interruption of the existing "Start" flow in three places (the silent-black theme pass, the watch-stub fixture, and the new readiness fixture) — all previously assumed the pre-session sheet appears immediately after "Start", which the check-in sheet now sits in front of on any day without one.
- `npm run check`: **PASS** (typecheck, 254/254 tests across 23 files, build). `npm run gate`: **PASS** — 5/5 themes plus all supplementary fixtures.

### P3 report
- **Built**: readiness score and baselines, the progression readiness/recovery hook, the check-in sheet, the Today readiness card, the `readiness.today` insight.
- **Tested**: `npx vitest run` → 254/254 across 23 files. `npm run check` → clean. `npm run gate` → 5/5 themes + all fixtures, PASS, including a real red-readiness-holds-the-load screenshot.
- **Decided by research**: none requiring new external sources (the readiness formula's precisely-specified parts came straight from the plan; underspecified parts were extended from the plan's own analogous formulas or existing primitives, recorded in COACHING-DECISIONS.md).
- **Scoped down (recorded in COACHING-DECISIONS.md)**: F2.3 (HRV reading flow) and F2.5 (resting-HR/HRR trend sparklines, `overreachingFlag`) deferred — not in this phase's Done-when, and F2.3 is verifiably dead code on the only hardware this build targets; band hysteresis deferred (needs new persisted state, untested by Done-when).
- **Needs device check**: none new — HRV is the one input that would need real hardware, and it's already correctly inert (never populated) on the verified watch.
- **Depends on this for later phases**: P4's deload state can read `readiness()`'s band/loadAdvice the same way `suggestNext()` now does; a future phase adding a real HRV-capable device would only need to populate `DailyHealth.lnRmssd`, since `readiness()` already knows what to do with it.

## Phase P4 (Programming) — DONE

Sections read: F3.1-F3.8, section 7 (P4 row: "Each rule tested; deload changes Train targets for 7 days and closes itself; snoozed insights hide for 7 days"). F3.1 (scheduled-split conflict) was already done in P1-R (`recovery.scheduled-conflict`); this phase covers F3.2 through F3.8.

### Layer: data model — done, commit 1b0577a
- `core/models.ts`: `Deload{startDay,endDay,reason,setFactor,loadFactor}`, `InsightFeedback{id,day,verdict}`; `AppState.deload: Deload | null`, `AppState.insightFeedback: InsightFeedback[]`, both defaulted in `freshState()`.
- `core/store.ts`: `normalize()` defaults both fields for states saved before this phase.
- `brain/coach/rules.ts`: `CoachContext` gains `deload`/`feedback`; `coachInsights()` filters out any insight whose id was snoozed within the last 7 days (F3.6). Fixed the resulting ~17 missing-property errors at every `CoachContext` call site (`tests/helpers.ts`'s shared `baseCoachExtras`, `app/selectors.ts`'s one production call site).

### Layer: brain — done, commits 83b8037, 674f0b1
- `data/volume.ts` (new): the 5-level set-count bands (F3.2), with per-muscle offsets for lower back (lower) and side delts/calves (higher).
- `brain/volume.ts` (new): `volumeBands(levelIndex, muscle)` (reuses `trainingLevels()`'s 7-level scale, clamped to Advanced past index 4 — plan gives no bands past it); `muscleVolumeStatus()` — this week's effective sets vs. the 4-week median and the band, `'under'|'in'|'over'|'unknown'`.
- `brain/deload.ts` (new): `deloadTrigger()` — reuses `plateauStatus()`/`effortDrift()`/`weeklyMuscleSets()` rather than a fresh e1RM-window comparator (see decisions); fires on 2+ main lifts plateaued/declining, OR effort drifting harder on 2+ lifts with 3-weeks-rising volume, OR a muscle over its band for 2 weeks running, OR readiness red on 3+ of the last 5 days.
- `brain/progression.ts`: `suggestNext()`'s `ProgressionContext` gains `deload?: Deload | null`; a new branch right after the `gap > 28` reentry check returns `mode: 'deload'` with sets ×`setFactor` and load ×`loadFactor` (fixed at 0.6/0.9 — see decisions), reasoned as "Lighter week, day N of 7." Never reaches `duration` mode (that mode returns earlier in the function, predating this phase).
- `brain/coach/rules.ts`: `readinessHistory()` (private) recomputes readiness for each of the last 5 days for the readiness-red trigger; `deloadOffer()` (exported) — gates on an already-active, unexpired deload, else delegates to `deloadTrigger()`. New `programming.volume` rule surfaces `muscleVolumeStatus()` for muscles the user actually trains in some split.
- `brain/coach/pre.ts`: `warmupSets(e1rm)` extracted from the existing `warmupRamp()` (P2-C) so both the pre-session text and Train's new rows (F3.4) compute the same 50/70/85% ramp.
- `brain/substitute.ts` (new): `substitutesFor(exercise, custom)` (F3.7) — LIBRARY/custom exercises sharing a primary muscle, ranked by matching pattern then equipment group.
- `brain/readiness.ts`: `readinessSummaryText(r)` (F3.8) — a one-line band/score/advice summary for the optional morning notification.
- `app/selectors.ts`: `coachContext` computed shared by `insights`/`deloadSuggestion`; `activeDeload` (read-time-gated on `endDay`, "closes itself" with no mutation needed).
- Tests: `tests/volume.test.ts` (7), `tests/deload.test.ts` (4), `tests/substitute.test.ts` (2), plus new cases in `tests/progression.test.ts` (deload context, 2), `tests/coach.test.ts` (insight feedback/snooze, `deloadOffer`, `programming.volume` — 7), `tests/pre.test.ts` (`warmupSets`, 1), `tests/readiness.test.ts` (`readinessSummaryText`, 1).

### Layer: native — N/A (no native surface in this phase)

### Layer: UI — done, commits 005c95f, 45cd9ae, 383445e, e1a30b5, 2c4507f, c01b875
- `Coach.tsx`: `DeloadCard` (F3.3) — the coach's offer ("Take a lighter week") or the active week's status ("Day N of 7"), wired to `acceptDeload()`; Helpful/Not now buttons on every insight card wired to `saveInsightFeedback()` (F3.6); a short "Earlier this month" feedback log.
- `slices/coach/coach.ts` (new): `acceptDeload(reason)`, `saveInsightFeedback(id, verdict)` mutations.
- `Body.tsx`/`ui/styles.css`: the "This week" view's bars gain a faint `.range` overlay for each muscle's volume-landmark band (F3.2), colored by `muscleVolumeStatus()`.
- `Train.tsx`: `EntryCard` gets a collapsed "Show warm-up" disclosure above the working sets (F3.4, `warmupSets()`); a one-line `pickCue(...,'coach')` cue under the target, seeded by day+exercise (F3.5); a "Still recovering (N%)" line with a "See substitutes" link when the exercise's primary muscle is below 60% (F3.7); a "Substitute exercise" action in the exercise menu opening `SubstituteSheet` (`substitutesFor()`), wired to the new `substituteEntry()` mutation in `session.ts` (blanks the entry's sets — a different exercise's numbers aren't comparable). `FinishScreen` gets a "Worth knowing" card with a `pickCue(...,'learn')` cue for the session's main lift (F3.5). All `suggestNext()` call sites (Train x2, Coach's `InsightSheet`) now pass `activeDeload.value` through.
- `core/models.ts`/`Settings.tsx`/`native/notifications.ts`/`slices/settings/reminders.ts`: `Reminders.readinessSummary?: boolean` (F3.8, off by default); `syncTrainingReminders()` swaps *today's* notification body for `readinessSummaryText()` when the toggle is on (every day beyond today keeps the plain body — see decisions); `resyncReminders()` (already called on app boot/`pageshow` since P0) now passes today's readiness through.
- Manually verified every UI piece end to end in Playwright (deload offer → accept → Train target discount; insight snooze → log; volume band overlay's DOM percentages; warm-up rows expand/collapse with correct kg; both coach cues render through a full log-set-and-finish flow; recovering hint → substitute sheet → live swap; the F3.8 Settings toggle, off by default, flips on tap — actual on-device notification delivery needs a real Android build to observe, noted below).

### Layer: gate — done (folded into each UI commit; no new fixture needed)
- No new 5-theme fixture was added: every P4 screen (Coach, Body, Train) was already covered by the existing gate fixtures, and none of this phase's changes altered the gate's assumed flow (unlike P1's watch stub or P3's check-in sheet, which each blocked an existing fixture and needed a fix). `npm run gate` re-run and confirmed passing (5/5 themes) after every UI commit in this phase.
- `npm run check`: **PASS** (typecheck, 279/279 tests across 26 files, build) as of the final P4 commit.

### P4 report
- **Built**: F3.2 (volume bands, `muscleVolumeStatus`, Body overlay, coach insight), F3.3 (deload trigger/state, progression hook, Coach card), F3.4 (warm-up rows), F3.5 (in-session + finish-screen cues), F3.6 (insight feedback/snooze, log), F3.7 (exercise substitution), F3.8 (optional morning readiness notification). F3.1 was already done in P1-R.
- **Tested**: `npx vitest run` → 279/279 across 26 files. `npm run check` → clean. `npm run gate` → 5/5 themes, PASS. Every new UI surface additionally walked through in Playwright (see Layer: UI above for specifics).
- **Decided by research**: none requiring new external sources this phase — every resolution extended an already-built primitive (`plateauStatus`, `effortDrift`, `trainingLevels`, the existing cue-rotation seed convention, the existing 60%-recovery threshold) or picked the overlap between two conflicting plan passages (deload's set/load factors). All recorded in COACHING-DECISIONS.md.
- **Scoped down (recorded in COACHING-DECISIONS.md)**: `deloadTrigger()`'s HRV coefficient-of-variation condition (dead code on the GT6, same reasoning as P3's HRV deferrals); F3.7's "an insight suggests balance work" trigger path (the concrete recovering-muscle path is built; wiring the balance insight to a specific substitute needs a real design decision about which exercise it means, not a mechanical gap).
- **Needs device check**: F3.8's actual on-device notification — the web preview always reports "Reminders need the Android app," so the readiness-summary body swap is verified by a pure-function unit test (`readinessSummaryText`) and by the Settings toggle's UI behavior, not by seeing a real delivered notification.
- **Depends on this for later phases**: none pending — this was the last phase in the plan's P0→P4 sequence.

## Every phase complete
P0, P0-P, P1-R, P2-C, P1, P2, P3, P4 are all DONE. The standing autonomous-loop instruction's stop condition (every phase complete) is met.

# Escobar v2

Spec: `docs/ESCOBAR-ARCHITECTURE.md`. Branch: `claude/escobar-v2-implementation-eidx64` (from `claude/marc-coaching-implementation-0lk6ax`). Decisions: `docs/COACHING-DECISIONS.md` → "## Escobar v2".

## EV0: Foundations
- data: `EscobarState` in `core/models.ts` (+ `freshEscobar()`), `core/escobarState.ts` `normalizeEscobar`, `escobar/types.ts`, `escobar/store.ts` (conversation store, caps, size guard, image pruning, backup/restore/reset wiring in Settings). Tests: `tests/escobar/state.test.ts`, `tests/escobar/store.test.ts`.

## EVU: Plate Sense
- data: `LoadUnit`, `EquipmentProfile`, `Gym`, `UnitsState` (`AppState.units`, `freshUnits`), `LoggedSet.entered`, `Session.gymId`; `normalizeUnits`; `core/units.ts` round-trip fix (`displayToKg` 3 decimals, `setLoadIn`, `formatSetLoad`, `enteredLoad`, `approxIn`). Tests: `tests/plate-sense.test.ts` (round trip 2.5–500 lb and 0.5–300 kg).
- brain: `brain/units.ts` (`defaultProfile`, `resolveProfile`, `loadableValues`, `loadableNear`, `plateBreakdown`, `formatPerSide`, `inferGym`); `suggestNext` snaps with `ctx.equipment` and scales with `ctx.loadFactor` (`Suggestion.unit/value`); `warmupSets(e1rm, equipment?)`; `autoregulationSuggestion` `equipment`; `fidelity.suspectAlternative`. Tests in `tests/plate-sense.test.ts`.
- UI: `WeightInput` (entry unit, display unit, pill, long-press, `≈` reading, `{kg, entered}`), Train entry card (per-entry profile, snapped targets and warm-ups, plate sheet from the barbell target, slip chip), gym chip + `GymSheet` on Train idle (with `inferGym` pre-select), `startSession`/`finishSession`/`logPastSession` stamp `gymId`, past-session and History editor inputs, History `lb` tags, Settings "Show weights in" + `settings/Gyms.tsx`; `slices/workout/units.ts` mutations.
- gate: Plate Sense fixture in 5 themes (`<theme>-plate-suspect.png`, `-plate-sheet.png`, `-plate-pill.png`), asserting the gym chip, slip chip, `≈ kg` reading, plate sheet and lb pill.

## EV1: Palace
- data: `escobar/palace/registry.ts` (69 entries, `findInApp`), `escobar/knowledge/methodIds.ts`, `app/router.ts` (`openPanel`, `PanelId`, `showPanel`/`closePanel`, aliases, `bodyView`, `historySeg`), `escobar/palace/focus.ts`. Tests: `tests/escobar/palace.test.ts`.
- UI: `data-palace` anchors across Today, Train, History, Body, Coach, Settings, Profile, Watch; `Section`/`Row`/`Sheet` `palace` prop; `openSheets` counter; `escobar/palace/navigate.ts` (`goTo`, `spotlight`, aria-live), `.palace-spotlight` (static under reduced motion); panels lifted to `openPanel` (goal, schedule, weekly-review, checkin, muscle, session, watch, memory placeholder) and rendered in `App.tsx`; `usePalaceFocus` on every tab and panel; dev hooks (`marc.dev`). Tests: `tests/escobar/palace-anchors.test.ts`.
- gate: palace block in `scripts/screenshot-gate.mjs`: every registry id → `__palace.goTo` → anchor visible (69/69, silent-black); spotlight screenshots for body.recovering, settings.gyms, history.records in 5 themes.

## EV2: Tools and brain additions
- brain: `weeklyVolumeHistory` (`brain/weekly.ts`), `brain/plan.ts` `evaluatePlan`/`hasBlockingIssues`, exported `readinessSeries` (`brain/coach/rules.ts`), `recoveryPctFor` moved to `brain/recovery.ts`; `ProgressionContext.loadFactor` (landed in EVU). Tests: `tests/plan.test.ts`, fixtures `tests/fixtures/plans.ts`.
- brain (perf): memoised `normalizeName`, name → exercise per custom list, day-key parsing; exported method constants (readiness, heart, fidelity, e1rm, warm-up, progression, plateau, balance, weekly review, `data/deload.ts`).
- ai: `escobar/tools/{context,schema,read,calc,plan,actions,show,executor}.ts`, `escobar/{ledger,hash}.ts`, `escobar/knowledge/{cards,methods}.ts` + `src/data/knowledge.json` (47 cards), `escobar/context/{brief,manifest,modes}.ts`. Tests: `tests/escobar/{read,calc,ledger,schema,actions,executor,knowledge,brief,show}.test.ts` (167 new; fixtures in `tests/escobar/fixtures.ts`).

## EV3: Worker v2
- worker: `escobar-worker/` (`src/{index,handler,anthropic,validate,quota}.ts`, `src/prompt/{policy,modes,manifest}.ts`, `src/tools.generated.json`, `wrangler.toml` name `marc-coach`, README), `scripts/escobar-tools.mjs` (`npm run escobar:tools`), app test `tests/escobar/tools-sync.test.ts`, CI step in `build-apk.yml`. Worker tests: `test/{validate,anthropic,handler,schema}.test.ts` (48).
- Deployed 2026-09-23 through `.github/workflows/deploy-worker.yml`; `/health` answers `protocol: 2`, `model: claude-opus-5`, `key: true`.

## EV4: Loop, transport and verification
- ai: `escobar/transport.ts` (SSE parser, HTTP transport, health), `escobar/verify.ts` (directives, stream buffer, grounding, repair text, safety signals), `escobar/loop.ts` (staging, steps and budgets, tool execution in block order, orphan closing, retry, repair round, abort/background/timeout, history window, offline reply, photos), `escobar/state.ts` (signals, proxy URL, prices). `Conversation` gains `proposals`, `briefLines`, `userTurns`. Tests: `tests/escobar/{transport,verify,loop}.test.ts` (40), including a full 6-step mocked conversation.

## EV5: Chat UI and presence
- UI: `escobar/ui/{EscobarSheet,Composer,Message,Citation,Escalation,Dock,Hall,AskAbout,SettingsSection,open,prompts}.tsx|ts`, `escobar/ui/components/index.tsx` (lift_trend + summary cards), `escobar/{session,apply,images}.ts`, `escobar/mock/transport.ts` (dev-only chunk), `native/photo.ts`, `ui/Sparkline.tsx`, `IconEscobar`/`IconSend`/`IconCamera`/`IconStop`; Coach tab relabelled Escobar with the Hall above its sections; ask-about on insights, readiness, History exercise progress, muscle sheet, pre/post session; live-mode button in the Train topbar; Settings → Escobar. Tests: `tests/escobar/ui.test.ts`.
- gate: nav clicks use `nav.nav button` + `hasText`; other lookups `exact: true`. Escobar block in 5 themes: dock on Today, Hall, explainer, empty state, mock conversation at 390 and 360 px (lift_trend, citation, chips, proposal), citation popover, Apply, drawer, Stop, offline palace answer; "Thinking…" ≤ 150 ms; no writes to `marc.escobar.v1`.
- deploy: `.github/workflows/deploy-worker.yml` (push-triggered on this branch); `/health` reports `key`.

# M/ARC QA and regression audit

Base: `claude/escobar-v2-implementation-eidx64` at `e34076f` (the branch of CI run [35853038794](https://github.com/macdarenz-droid/M-arc/actions/runs/35853038794), green on both jobs). `main` is `245c26a`.
Date: 2026-09-23. This is a read-only audit: no source file was changed.
The implementation plan built from this audit is [`REMEDIATION-PLAN.md`](REMEDIATION-PLAN.md). The full text of every finding (evidence, failure scenario, fix, test, verifier correction) is in [`qa/findings.json`](qa/findings.json).

---

## 1. Method

| Step | What was done |
|---|---|
| Baseline | `npm ci`, `tsc`, `vitest`, `vite build`, Worker `tsc` + `vitest`, `npm run gate` (Playwright, 5 themes), all run locally on `e34076f`. |
| Line-by-line audit | 6 auditors, each owning one partition and reading every line of it: **state** (core, data, theme, app shell, SW), **brain** (29 files), **escobar** client (53 files), **ui** (slices, ui, native TS), **platform** (Worker, Java/Python native, workflows, scripts), **regression** (diff vs `main`, v36 parity, unmerged branches, test coverage, docs drift). |
| Coverage | 181 files listed with their line counts. 156 were read in full. The rest are large JSON data files (checked by script: ids, muscle refs, aliases, cue reachability), the 36k-line `legacy/v36/index.html` (grepped per feature), and other branches (diffed). |
| Repro | 60 findings were **executed** (numeric scripts, TZ switches, Java executor simulation, Worker handler harness), not only read. |
| Verification | 3 adversarial verifiers re-checked every medium+ finding and tried to refute it. Result: 104 confirmed, 2 uncertain, 0 refuted. They lowered 14 severities, corrected 45 fixes, and found 2 new issues (VX-01, VX-02). Low findings (53) were not verified. |
| Spot check | I independently re-read 6 of the highest-impact claims (Health Connect executor deadlock, Navy formula, `commitSet` re-commit, commented-out `QUOTA` binding, frozen `nowMs`, `isExactNotification` default in plugin 8.3.1). All six hold. |
| Plan review | An independent reviewer checked every file, symbol and line reference in `REMEDIATION-PLAN.md` against `e34076f`, plus the Cloudflare, Capacitor and Health Connect API usage. Its 40 corrections are merged into the plan. |
| Follow-up | Signing certificates extracted from five CI APKs, plus a one-off cache export run, revealed PL-19: every build is signed with a new random key. |
| Research | Competitor feature matrix (Hevy, Strong, Fitbod, Alpha Progression, JEFIT, RP, Boostcamp, Liftosaur, Gravl), Android 15/16/17 and Play changes, training science behind the coach models. |

## 2. Baseline (all green, which is why these bugs went unnoticed)

| Check | Result |
|---|---|
| `tsc --noEmit` | clean |
| `vitest run` | **589 / 589** passed (47 files) |
| `escobar-worker`: `tsc` + `vitest` | clean, **50 / 50** (4 files) |
| `vite build` | OK. `index-*.js` 462 KB (128 KB gz), `session-*.js` 148 KB, `EscobarSheet-*.js` 36 KB |
| `npm run gate` | PASS: 5 themes, 122 screenshots, no page errors. Locally it needs `MARC_CHROMIUM=/opt/pw-browsers/chromium`. |
| CI run 35853038794 | source-gate + android-gate success (debug APK built) |

Green CI does not mean correct here. The unit tests cover pure brain functions, and the gate drives happy paths. None of them exercise persistence failure, restore, clock and timezone behaviour, native threading, Worker abuse, or multi-step Escobar races.

## 3. Headline problems (fix first)

1. **Open AI relay on the owner's key (PL-01, critical).** The `QUOTA` KV binding is commented out, so daily caps never apply. Device ids are self-minted, and requests without an `Origin` header are accepted. Anyone can spend the Anthropic key without limit.
2. **Health Connect never returns data (PL-03, high).** `readRecords` passes its own single-thread executor as the callback executor and then blocks on a latch. Every read times out after 20 s and resolves as empty. Once that is fixed, "today" steps and calories turn out to be raw 48 h sums (PL-04), and calories are 1000× too large (VX-01).
3. **Crash box can wipe every workout (ST-02 / RG-01, high).** The boot error overlay stays armed after boot. Any later unhandled rejection shows "could not start … your saved workouts are untouched" above a button that runs `localStorage.clear()`.
4. **Unreadable saved state is silently replaced (ST-01).** Boot falls back to a fresh state, and after one edit both the main and backup keys hold the fresh data.
5. **Every blur re-commits a set (UI-01, high).** Timing, rest and fidelity are rewritten, and the rest timer restarts. Enough blurs flag a genuinely live session as "compressed".
6. **Exact-alarm prompt mid-workout (UI-02, high).** In `@capacitor/local-notifications` 8.3.1, `isExactNotification` defaults to true. On Android 12+ without the exact-alarm grant, every `schedule()` opens the system "Alarms & reminders" screen: each rest start, each ±15 s tap, and each reminder resync.
7. **The coach states wrong numbers users act on.** Body fat uses metric constants on inch values (BR-01). "Ready in" is measured from training instead of from now (BR-02). Readiness gives opposite bands in Train and in Coach (BR-03). The plateau threshold is 1.5 %/week instead of 1.5 % over 8 weeks (BR-04). Abandoned lifts trigger decline and deload offers forever (BR-05). Volume is "under" for every muscle each Monday (BR-07). The pre-session load ignores goal, deload and gym units (BR-08).
8. **Escobar's Undo corrupts state (ES-03/04/05).** Undo restores whole state slices, including the live session, at any later time. After a reload it does nothing but is still reported as "undone". Applying a programme discards a running workout.
9. **The clock is frozen when no timer runs (ST-05 / VX-02).** Recovery, readiness and insights are computed at boot time or at the last tick. While a timer runs they are recomputed every second (ST-07 / BR-23 / UI-10), about 30–120 ms of work per tick.
10. **Every CI build is signed with a new random key (PL-19, found in follow-up).** Five debug APKs, five different signing fingerprints. Gradle never uses the cached or committed keystore (`1E:13…`, PL-02). The key registered with Huawei (`05:A0…A6:E8`) existed only inside one CI run and is gone, and no new build can install as an update without an uninstall, which wipes local data.

## 4. Totals

| Severity | Count | | Phase | Items |
|---|---|---|---|---|
| critical | 1 | | R0 Worker and CI secrets | 9 |
| high | 25 | | R1 Data safety | 19 |
| medium | 73 | | R2 Live session, clock, time zones, performance | 33 |
| low | 63 | | R3 Coach numbers | 31 |
| **total** | **162** | | R4 Escobar integrity | 29 |
| | | | R5 Android and PWA platform | 19 |
| | | | R6 Parity restores | 4 |
| | | | R7 Cleanup, CI, docs | 18 |

Severities are the final, verifier-adjusted values.

## 5. Feature status map

| Area | Working | Partial | Broken / stub / dead |
|---|---|---|---|
| Persistence | | debounced save, legacy import, restore | quarantine missing (ST-01), multi-tab overwrite (ST-19) |
| App shell | theme switch, router | crash handler (ST-02), panels (ST-14) | clock and selectors (ST-05..07), service worker / offline PWA (ST-03/04) |
| Train | timer, pause, splits editor, Plate Sense | rest banner (UI-03), finish/time question (UI-04), past session (UI-13) | set commit (UI-01) |
| Heart | zones, energy | live capture (UI-07/08), HRmax (BR-12) | |
| History | calendar, stats, records | edit/delete (UI-12, UI-24) | |
| Body | map, levels | recovery times (BR-02) | body fat (BR-01) |
| Coach | next-session progression, records, substitutes, cues, plan evaluator | weekly review (BR-13..16), post debrief (BR-20), autoregulation (BR-18) | readiness (BR-03), volume (BR-07), balance (BR-17), plateau lever (BR-04), effort calibration (BR-10/11), pre-session brief (BR-08/09) |
| Escobar | SSE transport, ledger/citations, palace navigation, brief, mock transport | loop (ES-09/10/20), read tools (ES-01/21), show (ES-15), photos (ES-13), privacy gates (ES-12), memory (ES-30) | undo (ES-03/04), today override (ES-02), plan mode (ES-17), offline latch (ES-08), store vs reset (ES-07), pins/proactive/brief (stubs, ES-26) |
| Native | haptics, photo pick, watch FGS type | watch plugin threading (PL-08), notifications (UI-02) | Health Connect sync (PL-03/04), HC diagnose (dead) |
| Worker | `/health`, SSE relay, validation, error mapping | CORS (not access control), per-device rate limit | quotas (PL-01), disconnect abort (PL-05) |
| CI | gate, debug APK, signed release, tools-sync | deploy-worker (PL-11), release versioning (PL-17) | a new random signing key on every build (PL-19); committed keystore unused (PL-02) |

## 6. Regression analysis

### 6.1 Against `main` (v37 as shipped)
| ID | Regression | Status |
|---|---|---|
| RG-02 | lb users' history logged before Plate Sense now shows off by 0.1–0.3 lb (225 → 224.9). Display rounding went from 0.5 lb to 0.1 lb, with no backfill of `entered`. 82 of 100 sample values change. | confirmed, medium |
| RG-04 | 30 functional/home exercises exist on the Escobar line but were dropped by revert `4d8ff4e`. Ids logged on a side-branch build resolve to nothing. | uncertain, low (only matters if that build was installed) |
| RG-03 | Escobar-line carry-over is not implemented: `coach.askThread` import (spec §6.3, decision 12). | confirmed, medium |
| RG-05 | `resolveSessionTiming` moves a session without re-sorting, so "last session" logic picks the wrong one. | confirmed, medium |
| RG-07 / UI-03 | The rest countdown freezes on other tabs. This predates v37 and still exists. | confirmed |
| RG-09, RG-10 | The copy contradicts the new models (recovery "only widens"; editor "loads are in kg"). | low |

### 6.2 Against v36 (legacy single-file app)
README claims "everything the old app did is here". These are missing:
- **Period export** as Visual PNG or Excel (RG-17). Only a JSON backup exists.
- **Rest alert "Test 5s"** and the **Health Connect diagnostic** (RG-18). The owner's 2026-09-23 "Could not read" report could not be diagnosed on the device.
- **Day Off / Rest Day** marking, excluded from the score (RG-19).
- **Debugger** ("Mark Bug Now", debug bundle): not ported.

These carried over correctly: fully-recovered list, live PR badge, haptic test, reminder health re-check, exact rest alert (now broken by UI-02), "show earlier weeks", APK byte parity, legacy `dailyTrackerPremium` import.

### 6.3 Unmerged branches (all fork from `245c26a`, none in the base)
| Branch | Size | Worth porting | Superseded |
|---|---|---|---|
| `claude/phase-9-readiness-preference-ckw91g` | 168 commits | near-miss records, chronic-skip rule, effort repair on finish, weekly volume chart, lift trajectory, 30 exercises, session notes | AskSheet, the planners, the old proxy (replaced by Escobar v2 and escobar-worker) |
| `claude/smartwatch-connector-integration-j42yb5` | 181 commits | `allowBackup` decision (96285d1), dex-level native class CI check (d69b22e) | native HR recorder DB (replaced by WatchBridge) |
| `claude/coach-brain` | 14 commits | backtest harness for coach rules (cbb29a7) | detectors and planners (replaced by the rules and Escobar tools) |

### 6.4 Test coverage gaps (critical write paths with no test)
- `core/store.ts`: persistence (`persistNow` rotation, backup-key fallback, quota handling). Tests import the store only to seed state.
- `slices/workout/session.ts`: `commitSet`, `finishSession`, `logPastSession`, `resolveSessionTiming` have zero test hits.
- Restore/backup parsing in `Settings.tsx` has none.
- `app/selectors.ts` (the clock) has none.
- `escobar/session.ts` (races, reset, offline latch) has none. `escobar/apply.ts` undo semantics are only touched through `ui.test.ts`.
- `native/notifications.ts`, `slices/workout/heart.ts`, `escobar/images.ts`, `brain/bodyfat.ts`, `brain/trend.ts`, and `escobar-worker/src/quota.ts` have none.
- Screenshot gate: fixture dates use UTC (`toISOString().slice(0,10)`), so it fails before 10:00 in UTC+10. About 120 fixed `waitForTimeout` calls. It never exercises backup/restore, reset, History edit/delete, Health sync, or post-boot errors (RG-14, PL-18).

### 6.5 Docs drift
`README.md` and `docs/ARCHITECTURE.md` describe the pre-coaching v37 app: 24/48/72 h recovery, "+1 %" records, 8 state keys, no Escobar or Worker (RG-11). `core` imports `brain/fidelity`, which breaks the documented downward-only layering (RG-12).

## 7. Improvement research (condensed)

### 7.1 Competitor matrix: gaps that matter for a local-first solo-dev app
| Feature | Who has it | M/ARC | Value | Effort |
|---|---|---|---|---|
| Supersets / circuits | Hevy, Strong, JEFIT, Fitbod, Liftosaur | missing | high | M |
| Set types (warm-up, drop, failure) | Strong, Hevy, Liftosaur | missing | high | S |
| Exercise and session notes (sticky setup note) | Strong, Hevy, Liftosaur | missing | high | S |
| CSV import from Strong / Hevy | Hevy, Liftosaur, others | missing | high | M |
| Lock-screen live workout / rest (Android 16 Live Updates) | Hevy | missing | high | M |
| CSV export | Strong, Hevy, JEFIT | missing (v36 had it) | medium | S |
| Automatic backup | all (cloud) | manual JSON only | medium | M |
| Write sessions to Health Connect | Hevy, Strong, Fitbod, JEFIT | missing | medium | S–M |
| Mesocycles / blocks | RP, Alpha Progression, Liftosaur | partial (reactive deload only) | high | L |
| Home-screen widget | Hevy, Strong, Fitbod | missing | medium | M |
| Body measurements + progress photos | Strong, Hevy, JEFIT | partial | medium | M |
| Exercise demo links | Fitbod, JEFIT, Hevy, RP | missing | medium | S (link-out) |
| **Ahead of competitors** | | Plate Sense, recovery model, readiness, live BLE HR with HR-guided rest, Escobar grounded coach | | |

### 7.2 Platform changes affecting this app
| Topic | Impact | Action |
|---|---|---|
| Play target API 36 (deadline 31 Aug 2026) | Capacitor 8 already targets 36, so every API-36 behaviour below applies | CI assertion `targetSdkVersion >= 36` |
| Predictive back (API 36) | No back handling at all. Back exits the app from any sheet, including Escobar and the live editor. | `@capacitor/app` backButton: close sheet/panel, then Today, then minimise |
| Edge-to-edge enforced (Android 16) | `env(safe-area-inset-*)` is wrong on WebView < 140 | Use Capacitor SystemBars `--safe-area-inset-*` with `env()` fallback; theme-aware bar icons |
| Exact alarms (Android 14+) | Denied by default. The plugin prompts on every schedule (UI-02). | Reminders inexact; precise rest alerts opt-in from Settings; never `USE_EXACT_ALARM` |
| FGS types (Android 14+) | `connectedDevice` needs BLUETOOTH_CONNECT at start, or it throws | Guard start, catch `SecurityException` / `ForegroundServiceStartNotAllowedException` |
| Health Connect history | Only 30 days before the first grant, which starves the 28/60-day baselines | Optional `READ_HEALTH_DATA_HISTORY`; consider `WRITE_EXERCISE` |
| Android 16 Live Updates | Lock-screen chip parity with Hevy | Promoted ongoing notification with chronometer (P2) |
| Adaptive icon | CI copies a full-bleed 512 px PNG as the foreground, so it gets cropped. No monochrome layer. | Padded foreground + monochrome layer |

### 7.3 Training science behind the models
| Model | Evidence | Verdict |
|---|---|---|
| e1RM (Epley + RIR, ≤10 reps, noise gate) | Nuzzo 2024 meta-regression: exercise type is the main moderator | keep; optional per-pattern correction later |
| Effort labels → RIR | Halperin 2022: people under-predict reps left by about 1, less so near failure | keep 3 levels; consider default +1 bias on easy/high-rep sets |
| Weekly set volume bands | Pelland 2025/26: diminishing returns, no upper harm threshold, fractional counting fits best | keep fractional counting; soften "over band" wording; do not deload on over-band alone |
| Proximity to failure | Robinson 2024: matters for hypertrophy, not strength | consistent with goal RIR bands |
| Rest | Singer 2024: small benefit above 60 s, plateau near 90 s | raise the HR-guided rest floor for ideal/max main lifts to 60–90 s |
| Recovery time course | 72–120 h after damaging sessions, multi-joint slower | structure fine; add performance-based calibration later |
| Deload | Coleman 2024 RCT; practitioner surveys | keep reactive and optional (current ×0.6 sets / ×0.9 load is fine) |
| Autoregulation | 2025 network meta-analysis: APRE/RPE/VBT beat fixed % | supports current approach; APRE mode optional |

Sources for every row, the full competitor matrix and all 20 research recommendations are in [`qa/research.json`](qa/research.json). Per-area feature lists, module maps (purpose, exports, unused exports) and file coverage are in [`qa/areas.json`](qa/areas.json).

## 8. Finding register

Sorted by phase, then severity. "unverified-low" means low severity and not put through the verifier; confirm it by reading the cited line before changing anything.

| ID | Sev | Verdict | Cat | Location | Finding | Phase |
|---|---|---|---|---|---|---|
| PL-01 | critical | confirmed | security | `escobar-worker/wrangler.toml:33` | Escobar Worker is an unauthenticated open relay to the Anthropic key; quotas disabled in production | R0 |
| PL-19 | high | confirmed | build-ci | `.github/workflows/build-apk.yml:148` | Debug APKs are signed with a new random key on every CI run; the cached/committed keystore is never used | R0 |
| PL-05 | medium | confirmed | perf | `escobar-worker/src/handler.ts:77` | Client disconnect never aborts the upstream model stream | R0 |
| PL-06 | medium | confirmed | spec-drift | `escobar-worker/src/validate.ts:136` | decision-review: client-authored system messages and effort escalation accepted verbatim | R0 |
| PL-07 | medium | confirmed | spec-drift | `escobar-worker/src/handler.ts:93` | decision-review: quota accounting undercounts — tool_use-terminated turns and intermediate steps are free; concurrent turns lose updates | R0 |
| PL-02 | low (was critical) | confirmed | security | `.github/workflows/build-apk.yml:157` | Private Android debug signing key (PKCS12, password 'android') committed in the gate workflow | R0 |
| PL-11 | low | unverified-low | build-ci | `.github/workflows/deploy-worker.yml:8` | decision-review: Worker deploy triggers only from the feature branch and is not gated by the full gate | R0 |
| PL-12 | low | unverified-low | bug | `escobar-worker/src/validate.ts:44` | Validator lets clients add cache_control to user text blocks (app never does), exceeding the 4-breakpoint limit | R0 |
| PL-14 | low | unverified-low | bug | `escobar-worker/src/handler.ts:59` | Worker reads the full body before any size check and measures size in UTF-16 units | R0 |
| ES-07 | high | confirmed | data-integrity | `src/escobar/session.ts:75` | Reset everything / Restore backup are undone by the in-memory store signal | R1 |
| RG-01 | high | confirmed | data-integrity | `index.html:49` | Global crash overlay fires after boot and its reset wipes all workouts | R1 |
| ST-01 | high (was critical) | confirmed | data-integrity | `src/core/store.ts:83` | Unreadable saved state is overwritten by fresh state; after one edit both keys are gone | R1 |
| ST-02 | high | confirmed | data-integrity | `index.html:49` | Global crash handler fires for any error after boot and offers 'Reset app data' while saying data is untouched | R1 |
| UI-05 | high | confirmed | bug | `src/slices/body/Body.tsx:115` | MuscleDetail crashes the app on an unknown muscle id from Escobar navigation | R1 |
| RG-02 | medium (was high) | confirmed | regression | `src/core/units.ts:13` | lb users' pre-Plate-Sense history now displays off by 0.1-0.3 lb | R1 |
| RG-08 | medium | confirmed | data-integrity | `src/slices/settings/Settings.tsx:37` | Heart-rate series are not backed up, restored, cleared on reset or deleted with a session | R1 |
| RG-15 | medium | confirmed | test-gap | `src/slices/workout/session.ts:160` | Critical write paths have no unit tests | R1 |
| ST-10 | medium | confirmed | bug | `src/core/store.ts:92` | Full-state backup copy doubles storage use, and a failed backup write reports 'Could not save' even though main saved | R1 |
| ST-11 | medium | confirmed | data-integrity | `src/core/store.ts:22` | normalize/replaceState accept invalid enums and malformed sessions, which get persisted and crash on every boot | R1 |
| ST-14 | medium | confirmed | bug | `src/app/App.tsx:58` | Muscle panel renders with an unvalidated param, so a bad Escobar navigate param crashes the render | R1 |
| ST-15 | medium | confirmed | bug | `src/app/App.tsx:39` | Lazy Escobar sheet import has no error handling | R1 |
| ST-19 | medium | confirmed | data-integrity | `src/core/store.ts:76` | Two PWA tabs overwrite each other's data (last writer wins) | R1 |
| UI-06 | medium (was high) | confirmed | data-integrity | `src/slices/settings/Settings.tsx:54` | Restore backup overwrites all data immediately with no confirmation or undo | R1 |
| UI-14 | medium | confirmed | data-integrity | `src/slices/settings/Settings.tsx:37` | Heart series are never backed up, restored or deleted (restoreHeart/deleteSeries have zero callers) | R1 |
| UI-15 | medium | confirmed | data-integrity | `src/slices/settings/Settings.tsx:53` | Restore accepts structurally broken sessions and resurrects a stale active session | R1 |
| ES-29 | low | unverified-low | bug | `src/escobar/palace/navigate.ts:64` | navigate tool params passed to router without validation | R1 |
| ST-09 | low (was medium) | confirmed | bug | `src/core/migrate.ts:231` | Legacy import for an lb user keeps a kg gym, so entry unit is kg | R1 |
| ST-21 | low | unverified-low | data-integrity | `src/core/heartStore.ts:12` | Heart series are never deleted with their session, never backed up, and reads are not shape-checked | R1 |
| ST-05 | high | confirmed | logic | `src/app/selectors.ts:31` | Recovery, readiness and coach 'now' freeze whenever no session or rest timer is ticking | R2 |
| UI-01 | high | confirmed | bug | `src/slices/workout/session.ts:76` | Every blur re-commits an already-committed set: overwrites timing, restarts rest, flips fidelity | R2 |
| UI-02 | high | confirmed | bug | `src/native/notifications.ts:42` | Local notifications default to exact alarms: Android 12+/14 opens the 'Alarms & reminders' settings screen on every schedule | R2 |
| UI-04 | high | confirmed | bug | `src/slices/workout/Train.tsx:616` | Time question fallback mixes UTC date with local time: session filed on the wrong day | R2 |
| VX-02 | high | found-by-verifier | bug | `src/app/selectors.ts:18` | Recovery and insights use a stale clock whenever no session is running (nowMs only advances while ticking) | R2 |
| BR-15 | medium | confirmed | bug | `src/brain/coach/weeklyReview.ts:104` | adherenceRate derives weekday with UTC parse: wrong day west of UTC | R2 |
| BR-23 | medium | confirmed | perf | `src/brain/recovery.ts:195` | Recovery is O(S^2) (systemicFactor per session) and recomputed every second in sessions | R2 |
| PL-09 | medium | confirmed | ux | `native/patch_manifest.py:24` | SCHEDULE_EXACT_ALARM declared but never checked or requested; rest-done alerts inexact on Android 14+ | R2 |
| RG-05 | medium | confirmed | bug | `src/slices/workout/session.ts:216` | resolveSessionTiming moves a session in time without re-sorting sessions | R2 |
| RG-06 | medium | confirmed | perf | `src/app/selectors.ts:31` | insights, recovery and readiness recompute every second while the ticker runs | R2 |
| RG-07 | medium | confirmed | bug | `src/slices/workout/Train.tsx:766` | Rest countdown freezes on other tabs after leaving Train (pre-existing) | R2 |
| ST-06 | medium | confirmed | bug | `src/app/selectors.ts:20` | setTicking is a single boolean, so leaving Train mid-rest freezes the rest countdown | R2 |
| ST-07 | medium | confirmed | perf | `src/app/selectors.ts:32` | recoveryStatus re-runs every second during a live session (~38 ms/call on desktop at 400 sessions) | R2 |
| ST-08 | medium | confirmed | bug | `src/core/dates.ts:17` | dayMs cache is never invalidated on timezone change, so addDays can return the same day and weekdays go wrong | R2 |
| UI-03 | medium (was high) | confirmed | bug | `src/slices/workout/Train.tsx:766` | Rest banner countdown freezes when leaving the Train tab | R2 |
| UI-09 | medium | confirmed | perf | `src/app/selectors.ts:31` | Recovery/coach selectors depend on the per-second clock: recompute every second while ticking, frozen otherwise | R2 |
| UI-10 | medium | confirmed | perf | `src/slices/workout/Train.tsx:309` | LiveSession re-renders every EntryCard with full history scans every second | R2 |
| UI-11 | medium | confirmed | data-integrity | `src/slices/workout/splits.ts:37` | deleteSplit silently discards the live session that uses the split | R2 |
| UI-12 | medium | confirmed | data-integrity | `src/slices/history/History.tsx:128` | History edit/delete never revisits the persisted recovery calibration | R2 |
| UI-13 | medium | confirmed | bug | `src/ui/primitives.tsx:136` | Numeric/date inputs accept negatives, huge values, comma decimals and empty dates | R2 |
| UI-17 | medium | confirmed | ux | `src/slices/today/Today.tsx:76` | Today 'Start' skips the daily check-in and pre-session brief that Train's Start shows | R2 |
| UI-23 | medium | uncertain | ux | `src/ui/styles.css:152` | Set-grid load input clips values at 360px and is unusable at 320px | R2 |
| BR-25 | low | unverified-low | bug | `src/brain/fidelity.ts:55` | UTC-parse date handling: resting-HR window, age, weeklyEnergy, midnight_crossing | R2 |
| BR-29 | low | unverified-low | logic | `src/brain/weekly.ts:70` | Recency logic relies on array order of sessions | R2 |
| BR-32 | low | unverified-low | redundancy | `src/brain/coach/rules.ts:311` | week-grade rule computes a full weekSummary (all records) only to test for zero sessions | R2 |
| ES-25 | low | unverified-low | bug | `src/escobar/apply.ts:183` | Proposal expiry compares a local-day expiresOn with the UTC date | R2 |
| ST-18 | low | unverified-low | bug | `src/core/dates.ts:8` | dayKey() parses 'YYYY-MM-DD' as UTC, returning the previous day west of UTC | R2 |
| UI-19 | low | unverified-low | logic | `src/slices/workout/session.ts:142` | Adjusting or starting rest while paused schedules a notification and is lost on resume | R2 |
| UI-22 | low | unverified-low | data-integrity | `src/slices/profile/Profile.tsx:33` | Profile numeric fields write state and profile history on every keystroke with no range checks | R2 |
| UI-24 | low | unverified-low | logic | `src/slices/history/History.tsx:127` | Saving an edited session with all sets cleared leaves an empty session in history | R2 |
| UI-27 | low | unverified-low | bug | `src/slices/workout/Train.tsx:262` | Split and gym renames are only saved on blur and lost when the sheet is closed | R2 |
| UI-28 | low | unverified-low | bug | `src/ui/primitives.tsx:78` | Toast auto-dismiss timer restarts on every App re-render | R2 |
| UI-31 | low | unverified-low | logic | `src/slices/workout/session.ts:89` | Heart-guided rest is scheduled with the effort of the set before the user rates it | R2 |
| BR-01 | high | confirmed | bug | `src/brain/bodyfat.ts:9` | Navy body-fat uses the centimetre formula constants on inch values | R3 |
| BR-02 | high | confirmed | bug | `src/brain/recovery.ts:298` | readyInHours / fullInHours are hours since training but shown as hours from now | R3 |
| BR-04 | high | confirmed | spec-drift | `src/brain/coach/rules.ts:327` | Plateau lever and staleness treat <1.5% PER WEEK as flat (spec: ±1.5% over 8/6 weeks) | R3 |
| BR-05 | high | confirmed | logic | `src/brain/deload.ts:33` | Abandoned lifts keep producing decline/plateau insights and deload offers forever | R3 |
| BR-07 | high | confirmed | logic | `src/brain/volume.ts:37` | Volume status judges the partial current week: every trained muscle is 'under' on Monday | R3 |
| BR-08 | high | confirmed | logic | `src/brain/coach/pre.ts:91` | Pre-session load target hardcodes 8 reps and ignores goal, deload, readiness and equipment | R3 |
| BR-03 | medium (was high) | confirmed | logic | `src/brain/coach/rules.ts:83` | Readiness computed with different check-in histories at each call site (contradictory bands) | R3 |
| BR-06 | medium (was high) | confirmed | logic | `src/brain/trend.ts:45` | Assisted exercises: less assistance (progress) is read as declining | R3 |
| BR-09 | medium | confirmed | spec-drift | `src/brain/coach/pre.ts:48` | decision-review: warm-up ramp at 85% of e1RM is heavier than the working load | R3 |
| BR-10 | medium (was high) | confirmed | bug | `src/brain/coach/rules.ts:368` | Effort-calibration insight promises an e1RM adjustment that is never applied | R3 |
| BR-11 | medium | confirmed | logic | `src/brain/effortBias.ts:26` | RIR observations counted per set pair: one session pair satisfies the '3 pairs' minimum | R3 |
| BR-12 | medium | confirmed | bug | `src/brain/heart.ts:63` | Observed HRmax returns the first plateau (warm-up/rest), not the highest; not max'd with Tanaka | R3 |
| BR-13 | medium | confirmed | logic | `src/brain/coach/weeklyReview.ts:249` | Weekly pace labels a falling lift as 'a typical pace, keep the current approach' | R3 |
| BR-14 | medium | confirmed | bug | `src/brain/coach/weeklyReview.ts:122` | Weight-trend rate uses lagging EWMA minus first raw entry: underestimates the rate | R3 |
| BR-16 | medium | confirmed | spec-drift | `src/brain/coach/weeklyReview.ts:33` | Weekly hard sets count stabilisers (0.25) and secondaries at 0.55; spec says 1/0.5/0 | R3 |
| BR-17 | medium | confirmed | logic | `src/brain/balance.ts:28` | Upper/lower balance sums every muscle a set touches, inflating upper body | R3 |
| BR-18 | medium | confirmed | bug | `src/brain/coach/live.ts:132` | Autoregulation without equipment rounds the 2.5% step back to the same load | R3 |
| BR-19 | medium | confirmed | logic | `src/brain/readiness.ts:191` | Readiness load sub-score is 0 for every new user training 3x in week one | R3 |
| BR-20 | medium | confirmed | logic | `src/brain/coach/post.ts:245` | Rest/density insight mixes exercises: 'reps fell' across different lifts | R3 |
| BR-26 | medium | confirmed | logic | `src/brain/coach/rules.ts:409` | 'post' heart insights (effort mismatch, drift) stay on Today indefinitely | R3 |
| BR-27 | medium | confirmed | redundancy | `src/brain/coach/rules.ts:165` | Plateau and plateau-lever both fire for the same lift with different actions | R3 |
| BR-28 | medium | confirmed | ux | `src/brain/progression.ts:173` | Brain copy hardcodes 'kg' regardless of preferences.weightUnit | R3 |
| ST-12 | medium | confirmed | bug | `src/data/muscles.ts:84` | classifyMuscleText maps 'Lower back' to mid_back and the app's own labels 'Rear/Front shoulders' to side_delts | R3 |
| ST-13 | medium | confirmed | logic | `src/core/exercises.ts:127` | findExercise's fuzzy substring fallback maps generic or unknown names to an arbitrary library exercise | R3 |
| BR-21 | low | unverified-low | ux | `src/brain/prs.ts:50` | Strength record text prints an unrounded previous e1RM | R3 |
| BR-22 | low (was medium) | confirmed | logic | `src/brain/weekly.ts:35` | Week grade needs at least 3 sessions even when 1-2 days are planned | R3 |
| BR-24 | low | unverified-low | bug | `src/brain/units.ts:143` | plateBreakdown is greedy while loadableValues is exact; custom plate sets show unreachable totals | R3 |
| BR-31 | low | unverified-low | logic | `src/brain/recovery.ts:183` | Recovery 'top driver' is simply the last set and shows a muscle-wide set count under one exercise | R3 |
| RG-09 | low | unverified-low | docs-drift | `src/slices/coach/Coach.tsx:95` | Coach copy says recovery 'only ever widens' but calibration can shrink it | R3 |
| ST-17 | low | unverified-low | dead-code | `src/data/coachCues.json:1` | 27 of 422 coach cues can never be selected | R3 |
| UI-18 | low (was medium) | confirmed | ux | `src/slices/profile/Profile.tsx:89` | Body weight and body-fat inputs are kg/cm only regardless of the lb preference | R3 |
| ES-01 | high | confirmed | bug | `src/escobar/tools/read.ts:185` | capJson drops the NEWEST sessions from get_exercise_history | R4 |
| ES-03 | high | confirmed | data-integrity | `src/escobar/apply.ts:29` | Undo restores whole state slices at any later time (incl. `active`), wiping unrelated edits | R4 |
| ES-04 | high | confirmed | bug | `src/escobar/apply.ts:197` | Undo after reload is a silent no-op reported as 'undone'; undo map keyed only by proposalId collides across conversations | R4 |
| ES-05 | high | confirmed | data-integrity | `src/escobar/apply.ts:65` | propose_program(replaceExisting) and propose_split(delete) silently discard a live session | R4 |
| ES-06 | high | confirmed | bug | `src/escobar/session.ts:192` | New/Past/Reset conversation during a running turn re-activates and re-persists the old conversation | R4 |
| ES-02 | medium (was high) | confirmed | bug | `src/escobar/apply.ts:84` | propose_today is applied but never used: Train/startSession ignore escobar.todayOverride | R4 |
| ES-08 | medium (was high) | confirmed | bug | `src/escobar/session.ts:160` | One network error latches Escobar offline; later messages never reach the Worker | R4 |
| ES-09 | medium | confirmed | bug | `src/escobar/loop.ts:383` | Concurrent send (Hall chip / openAndSend while a turn runs) breaks Stop and status | R4 |
| ES-10 | medium | confirmed | bug | `src/escobar/loop.ts:316` | Error/abort during the repair round marks an answered message 'Not sent' and leaves the answer unrendered | R4 |
| ES-11 | medium | confirmed | logic | `src/escobar/verify.ts:147` | Crisis pre-screen fires on common gym phrases ('hurt myself', 'end it') | R4 |
| ES-12 | medium | confirmed | security | `src/escobar/tools/show.ts:97` | Sharing toggles not honoured by explain_method, show(readiness_gauge) and replayed history | R4 |
| ES-13 | medium | confirmed | spec-drift | `src/escobar/ui/Composer.tsx:13` | Composer allows 3 photos but the Worker rejects more than 2 images per request | R4 |
| ES-14 | medium | confirmed | bug | `src/escobar/loop.ts:115` | History window halves once by message count; long conversations exceed the Worker's 400 KB text limit | R4 |
| ES-15 | medium | confirmed | logic | `src/escobar/tools/show.ts:60` | lift_trend first/best cover only the last 12 sessions, not the requested window | R4 |
| ES-16 | medium | confirmed | bug | `src/escobar/verify.ts:101` | Unverified-number marking never matches bullet items | R4 |
| ES-17 | medium | confirmed | spec-drift | `src/escobar/ui/open.ts:123` | Plan mode is unreachable | R4 |
| ES-19 | medium | confirmed | data-integrity | `src/escobar/store.ts:117` | Size guard can drop the active conversation; history then silently stops saving | R4 |
| ES-20 | medium | confirmed | bug | `src/escobar/loop.ts:284` | Decisions made while a turn is running are wiped before being reported | R4 |
| ES-21 | medium | confirmed | logic | `src/escobar/tools/read.ts:367` | get_live_session / get_equipment compute targets differently from Train | R4 |
| RG-03 | medium | confirmed | spec-drift | `src/core/escobarState.ts:101` | decision-review: Escobar-line data not carried over (askThread import §6.3 unimplemented, readiness[] and session notes orphaned) | R4 |
| ES-18 | low (was medium) | confirmed | logic | `src/escobar/palace/registry.ts:138` | find_in_app/offline guide match keywords as substrings ('pr', 'ai', 'bar') | R4 |
| ES-22 | low (was medium) | confirmed | perf | `src/escobar/ui/components/index.tsx:292` | Show components re-run summarize() on every streamed delta | R4 |
| ES-23 | low | unverified-low | security | `src/escobar/context/brief.ts:81` | User/model strings interpolated unsanitised into the system-channel brief | R4 |
| ES-26 | low | unverified-low | ux | `src/escobar/ui/SettingsSection.tsx:42` | Misleading stubs: Proactive notes toggle does nothing; pinned cards never rendered or expired; memory panel read-only | R4 |
| ES-27 | low | unverified-low | ux | `src/escobar/ui/Citation.tsx:39` | Citation popover cannot be closed by tapping its chip again | R4 |
| ES-28 | low | unverified-low | perf | `src/escobar/images.ts:7` | images.ts opens a new IndexedDB connection per call and keeps all photos in memory forever | R4 |
| ES-30 | low | unverified-low | data-integrity | `src/escobar/session.ts:102` | Memory cap silently evicts oldest items (incl. injuries); memory ids can collide | R4 |
| ES-31 | low | unverified-low | logic | `src/escobar/context/brief.ts:100` | Brief quality: unrounded training age, stale 'pending' proposals forever | R4 |
| ES-32 | low | unverified-low | spec-drift | `src/escobar/apply.ts:45` | decision-review: goal changes attributed to 'user'; explain_method copies literals | R4 |
| PL-03 | high | confirmed | bug | `native/HealthConnectNativePlugin.java:183` | Health Connect reads deadlock: callback executor is the same single thread that blocks on the latch | R5 |
| PL-04 | high | confirmed | logic | `native/HealthConnectNativePlugin.java:236` | Health Connect 'today' steps and active calories are raw 48-hour sums with no data-origin dedupe | R5 |
| VX-01 | high | found-by-verifier | bug | `native/HealthConnectNativePlugin.java:285` | Health Connect active calories are sent as small calories but stored and shown as kcal (1000x) | R5 |
| PL-08 | medium | confirmed | bug | `native/watch/WatchBridgePlugin.java:134` | Watch plugin methods mutate main-thread-only service/scanner state from Capacitor's plugin thread | R5 |
| PL-10 | medium | confirmed | docs-drift | `native/PermissionsRationaleActivity.java:30` | Health Connect rationale says data stays on device, but Escobar sends health data to Anthropic | R5 |
| ST-03 | medium (was high) | confirmed | bug | `public/sw.js:8` | Service worker serves stale index cache-first, deletes old assets on activate, and caches 404/error responses | R5 |
| ST-04 | medium | confirmed | bug | `scripts/sw-version.mjs:4` | Build assets are not precached, so the PWA cannot start offline after a single visit | R5 |
| ST-16 | medium | confirmed | bug | `src/main.tsx:33` | Reminder and Health Connect resync on resume uses 'pageshow', which does not fire when the Android app returns from background | R5 |
| UI-07 | medium | confirmed | bug | `src/slices/workout/heart.ts:34` | Heart capture effect re-pushes the same reading on every state change: heart-guided rest ends early | R5 |
| UI-08 | medium | confirmed | bug | `src/slices/workout/heart.ts:37` | After an app restart mid-session heart samples use epoch seconds as session time | R5 |
| UI-21 | medium | confirmed | ux | `src/slices/settings/Watch.tsx:22` | Watch sheet stays 'Scanning…' forever and gives no feedback on denied permission | R5 |
| PL-13 | low | unverified-low | perf | `native/watch/WatchBridgePlugin.java:209` | Scanner floods the JS bridge: every scan result re-emits every known device | R5 |
| PL-15 | low | unverified-low | dead-code | `native/watch/WatchService.java:248` | Dead native/Worker code with zero callers | R5 |
| PL-16 | low | unverified-low | build-ci | `native/patch_manifest.py:50` | patch_manifest.py skips existing entries without enforcing required attributes | R5 |
| RG-18 | low (was medium) | confirmed | regression | `src/slices/settings/Settings.tsx:110` | v36 diagnostics missing: rest-alert 'Test 5s' and Health Connect diagnostic | R5 |
| RG-20 | low | unverified-low | security | `native/patch_manifest.py:22` | Android auto-backup not disabled for health data; CI does not verify compiled native classes | R5 |
| ST-20 | low | unverified-low | ux | `index.html:17` | Theme tokens exist only after the JS bundle runs, so the first paint is unthemed (white flash on dark themes) | R5 |
| ST-25 | low | unverified-low | a11y | `index.html:5` | Manifest/viewport: zoom disabled, fixed dark theme colour, no manifest id | R5 |
| UI-16 | low (was medium) | confirmed | ux | `src/native/health.ts:70` | Health Connect permission is re-requested on every boot, resume and session start after a denial | R5 |
| RG-17 | medium | confirmed | regression | `src/slices/settings/Settings.tsx:127` | v36 period export (Visual PNG / Excel) missing | R6 |
| RG-04 | low (was medium) | uncertain | regression | `src/data/exercises.json:1` | 30 library exercises removed by the Phase E revert; sessions/splits using them lose identity | R6 |
| RG-19 | low | unverified-low | regression | `src/slices/today/Today.tsx:81` | v36 'Day Off / Rest Day' (excluded from score) not available | R6 |
| UI-20 | low (was medium) | confirmed | spec-drift | `src/slices/workout/Train.tsx:394` | decision-review: 'conditioning' mode promises further/longer progress but the UI can only log load x reps | R6 |
| BR-30 | low | unverified-low | dead-code | `src/brain/e1rm.ts:32` | Dead exports and unwired spec foundations | R7 |
| ES-24 | low | unverified-low | dead-code | `src/escobar/verify.ts:62` | Dead code and duplicated logic in the escobar partition | R7 |
| PL-17 | low | unverified-low | build-ci | `.github/workflows/release-apk.yml:37` | Release versioning hard-codes the 37 prefix and skips the gate | R7 |
| PL-18 | low | unverified-low | test-gap | `scripts/screenshot-gate.mjs:29` | Screenshot gate fixtures are timezone-dependent and include a tight 150 ms timing assertion | R7 |
| RG-10 | low | unverified-low | ux | `src/slices/history/History.tsx:155` | Session editor hint says loads are in kg although inputs now use unit pills | R7 |
| RG-11 | low | unverified-low | docs-drift | `docs/ARCHITECTURE.md:7` | README and ARCHITECTURE describe the pre-coaching app | R7 |
| RG-12 | low | unverified-low | docs-drift | `src/core/store.ts:4` | core imports brain (upward layer dependency) contrary to documented layering | R7 |
| RG-13 | low | unverified-low | dead-code | `src/data/recovery.ts:28` | Dead exports and duplicated damage constants | R7 |
| RG-14 | low | unverified-low | test-gap | `scripts/screenshot-gate.mjs:29` | Screenshot gate is timezone- and timing-dependent and misses key flows | R7 |
| RG-16 | low | unverified-low | build-ci | `src/slices/settings/Settings.tsx:23` | APP_VERSION unchanged at 37.0.0 across storage-shape changes | R7 |
| ST-22 | low | unverified-low | dead-code | `src/core/store.ts:123` | Dead exports and duplicated constants | R7 |
| ST-23 | low | unverified-low | build-ci | `scripts/convert-legacy-backup.ts:19` | App version is hard-coded in three places and scripts/ is not typechecked | R7 |
| ST-24 | low | unverified-low | bug | `src/core/units.ts:12` | lb display rounds to 0.1, so 0.25-lb loads and steps display wrong | R7 |
| UI-25 | low | unverified-low | ux | `src/slices/history/History.tsx:155` | Misleading unit text: editor says 'Loads are in kg here'; stats volume always metric tonnes | R7 |
| UI-26 | low | unverified-low | a11y | `src/ui/PulseLine.tsx:36` | Screen-reader live regions announce every second (HeartBpm, RestBanner) | R7 |
| UI-29 | low | unverified-low | redundancy | `src/native/share.ts:22` | share.pickFile never resolves on cancel and duplicates photo.ts pickFile | R7 |
| UI-30 | low | unverified-low | bug | `src/slices/coach/Coach.tsx:208` | WeeklyReviewCard calls a hook after an early return | R7 |
| UI-32 | low | unverified-low | dead-code | `src/ui/primitives.tsx:43` | Dead exports and CSS with zero references | R7 |

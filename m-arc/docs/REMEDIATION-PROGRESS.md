# Remediation progress
Resume from this file and docs/REMEDIATION-PLAN.md. Never re-derive finished work.
Branch: claude/marc-r0-remediation-ast5xs (from claude/marc-regression-architecture-gegkbq, escobar 138edd6 merged) · Baseline: 589 app tests / 50 worker tests

## Owner answers
D1: done (R0.0, key 05:66:9A…F1:F5) · D2–D15: default

## Owner actions (collected; STOP once at the end)
- [x] R0 + R0.9 Worker deployed from main (PR #4 merge, run 35880696979 green; its /health step requires protocol 2, key, quotas and relay)
- [ ] R0.9 (PL-20): the affected user on the failing Wi-Fi opens https://marc-coach.mmarcdarenz.workers.dev/cdn-cgi/trace (expect colo=HKG) and sends Escobar a message
- [ ] R7.5 (D7): confirm, then move `legacy/v36/` to a tag and delete the folder
- [ ] R5: device checks listed under Phase R5
- [ ] R0: if the deploy fails because Durable Objects are unavailable, run `npx wrangler kv namespace create QUOTA` and bind `QUOTA` in wrangler.toml
- [ ] R0.0: keep the encrypted key backup → add the new fingerprint in AppGallery Connect → backup, uninstall, reinstall, restore → delete SECRETS_WRITE_TOKEN and the `marc-debug-signing-v1` caches

## Phase R0 — done (agent side); owner deploy pending
### Layer: worker — done, commit f7c2ff6 — IDs: PL-01, PL-05, PL-06, PL-07, PL-12, PL-14
- QuotaCounter Durable Object (sync kv), quota.ts DO → KV → none, recordStep every step, RATE_IP, 413/byte checks, effort-only system messages refused, 48 KB system cap, policy sentence, abort on disconnect, one log line per step.
- PL-06: validate.test.ts and anthropic.test.ts assertions that accepted effort-only messages updated (they encoded the bug).
### Layer: CI — done, commit f863b6b — IDs: PL-11, PL-19/PL-02 (R0.8)
- deploy-worker.yml: push to main (paths filter kept) + workflow_dispatch; `npx --no-install wrangler deploy` with wrangler 4.136.3 pinned exactly in escobar-worker/package.json + lockfile; /health step fails unless protocol 2, key:true and quotas:true.
- release-apk.yml: MARC_ANDROID_* replaced by MARC_SIGNING_KEYSTORE_B64 / MARC_SIGNING_STORE_PASSWORD, alias `marc`, same EXPECTED_SHA256 assertion as build-apk.yml, keystore grep added. Signing step of build-apk.yml untouched.
- `wrangler deploy --dry-run` bundles and lists QUOTA_DO, RATE, RATE_IP (local check, no deploy).
### Layer: tests — done, commit 149e7e7 — worker 50 → 66
- New test/quota.test.ts: 5 concurrent DO adds sum exactly; alarm cleanup; scope mapping; DO → messages; tool_use step = steps 1 / turns 0; rotating device ids from one IP → 429 via RATE_IP; per-IP daily cap; one log line, no device id/content; health quotas:true.
- handler.test.ts: content-length 3_000_001 → 413 without reading the body or making the client; UTF-8 byte size; cancelled body aborts the model stream within 50 ms (mutation-checked: fails without the fix).
- validate.test.ts: effort-only refused; 48 KB system cap in bytes; cache_control on user text refused.
### Layer: gate — done
- `npm run check`: 589 passed · worker `npm ci && npm run check`: 66 passed · `npm run build && npm run gate`: PASS (5 themes, legacy import, escobar, palace).

### R0 report
- Built: QuotaCounter DO (sync kv, per UTC day, 3-day alarm cleanup) with KV fallback; RATE_IP; per-IP and global-output daily caps; every step recorded; abort on disconnect (enable_request_signal + writer.closed); 413 on content-length and UTF-8 bytes; effort-only system messages refused; 48 KB system cap; policy sentence; one log line per step; deploy on main + dispatch with wrangler 4.136.3 pinned and quotas:true health check; release-apk.yml on MARC_SIGNING_* with the fingerprint assertion.
- Tested: see layers above.
- Decided by research: DO with synchronous kv (no await between read and write); abort detection via writer.closed instead of waiting for the 10 s heartbeat; brief cap 48 KB (BRIEF_CAP 3000 chars × UTF-8 ≤ 12 KB, so 48 KB is the larger bound).
- Needs device check: Escobar chat still streams after deploy; a closed chat stops billing (watch `wrangler tail` for the step log with stop_reason null).
- Next dependency: R1 (store hardening) is independent of R0 and can start now. Two consecutive APKs signed 05:66… are produced by CI on this branch's push (build-apk.yml unchanged).
(skipped / not reproduced: none)

## Phase R1 — done
### Layer: core/store — done, commit 4f4cc86 — IDs: ST-01, ST-10, ST-11, ST-19, RG-02, ST-09
- Quarantine to `marc.state.v1.corrupt` (main) and `marc.state.v1.backup.corrupt` (backup, when source is fresh/legacy); `bootRecovered` signal; `rescueRaw()` / `deleteRescueCopy()`.
- persistNow: main write first, quota → drop backup + retry once; backup = previous good raw on the first save of each local day (`marc.state.v1.backupDay`), best-effort.
- `repairState()` exported (deep repair + dropped count); normalize = repair + fill + RG-02 lb backfill (raw has no `units`, lb user).
- storage listener for other tabs; toast when the local active session differs.
- convertLegacy: lb → lb gym (ST-09) and the same lb backfill (decided: v36 loads carry the same 0.25 kg rounding; the round-trip check makes it a no-op otherwise).
### Layer: app shell (crash containment) — done, commit ab5f71d — IDs: ST-02, RG-01, ST-15, ST-14, UI-05, ES-29
- index.html: `__marcBooted` gate, plain copy, "Save a copy of my data" (inline rescue, duplicated from src/core/rescue.ts on purpose), reset needs confirm().
- main.tsx: ErrorBoundary around App, booted flag, late error/rejection toast throttled to 10 s. New src/app/ErrorBoundary.tsx, src/core/rescue.ts.
- Lazy import catches: App EscobarMount, ui/open.ts, SettingsSection reset, Composer attach.
- router.validatePanelParams + showPanel refuses a panel without its required param; goTo validates view/seg; executor navigate keeps only view/seg/muscle/exerciseId/sessionId and rejects a bad muscle; MuscleDetail guards itself.
### Layer: settings + Escobar store listener — done, commit bcf1c04 — IDs: UI-06, UI-15, ST-21, RG-08, UI-14, ES-07, RG-15 (tests in the next layer)
- src/core/version.ts is the one APP_VERSION (Settings and escobar/session import it).
- src/slices/settings/backup.ts: buildBackup (schema 2, escobar, heart), parseBackup (v37 wrapper / bare state / legacy / error; repairState + dropped count; active kept only if under 12 h).
- Settings: confirm card before restore ("Replace N sessions … with M sessions from <date>?"), health reset, escobar + heart restore, Undo restores all three; cancelRestDone, haptics, resyncReminders after. Reset everything clears heart, images, marc.health.asked too. Rescue row: save rescue file / delete rescue copy.
- heartStore: read() plain-object check, restoreHeart sanitizes [number, number] pairs, clearHeart(); History delete removes the series and Undo restores it.
- escobar/store onStoreReplaced (clearStore, restoreEscobar); escobar/session subscribes: stops the loop, bumps `epoch`, reloads; a turn from an older epoch persists nothing.
### Layer: tests + gate — done — app 589 → 615
- New: tests/store.test.ts (quarantine survives 2 edits, backup throw → saveError null, quota retry, daily restore point, deep repair + dropped count, storage event without writing, other-tab toast, lb backfill 225 lb, kg/units unchanged), tests/backup.test.ts, tests/router.test.ts, tests/escobar/session-reset.test.ts (fails on the pre-fix session.ts).
- Extended: migrate (lb gym), escobar/executor (navigate keys, bad muscle hint).
- persistNow: after a quota retry the same save skips the restore-point write (found by the quota test).
- Gate (silent-black): post-boot rejection + throw → no crash screen; export → reset → restore round trip 27 → 0 → 27.

### R1 report
- Built: store quarantine + rescue file, daily restore point, deep repair, multi-tab sync, lb backfill, lb legacy gym; crash overlay rescue + boot gate, ErrorBoundary, late-error toast, lazy-import catches, panel param validation; version.ts, backup.ts (schema 2 with heart), confirmed restore with Undo, full reset, heart delete/undo, Escobar store-replaced listener with epoch.
- Tested: app `npm run check` 615 passed; worker 66 passed; gate PASS incl. round trip.
- Decided by research/judgement: two quarantine keys (main `.corrupt`, backup `.backup.corrupt`), rescue row downloads main first; legacy lb import also gets the lb backfill; restore confirm is an inline card like the existing reset confirm.
- Needs device check: rescue file download inside the Android WebView (ErrorBoundary uses the share sheet first; the pre-bundle overlay falls back to clipboard); restore file picker on Android.
- Next dependency: R2 (clock module) builds on R1's store test harness.
(skipped / not reproduced: none)

## Phase R2 — done
### Layer: clock and dates — done, commit d217c48 — IDs: ST-05, ST-06, ST-07, UI-03, UI-09, RG-06, RG-07, VX-02, ST-08, ST-16, ST-18, BR-15, BR-25, ES-25, UI-04
- New src/app/clock.ts: today, nowMs, minuteNow, refreshClock (tz signature → resetDayCache), always-on 60 s interval, ref-counted acquireTicker. setTicking deleted; selectors re-export; recovery/coachContext read minuteNow.
- main.tsx: visible → refreshClock + resyncReminders + syncAndStoreHealth; pageshow removed.
- dayKey passes day keys through; adherenceRate uses weekdayOf and skips an unfinished today; fidelity/session midnight_crossing on local days; restingHr addDays; energy age parseDay; apply.ts todayKey; Train fallback day via dayKey. formatTimeOfDay + formatLocalStamp; Settings/Coach/Profile hints local.
- `npm run test:tz` added (+ CI step in build-apk.yml and release-apk.yml). UTC-assuming tests fixed: heart Tanaka (local mid-year), fidelity midnight (local times), recovery soreness cap (dayKey). adherenceRate and energy-age tests pass after the code fix.
### Layer: session write paths — done, commit 5ef1ffb — IDs: UI-01, UI-31, RG-05, BR-29, UI-11, UI-24, UI-12, UI-19, R2.8
- Commit-once (status/at guard), addSet carries load/reps only, emptied committed set drops its commit; setRestEffort + Train effort button (UI-31).
- R2.8 ids: ActiveSession.id kept as Session.id, entry/set ids on every creation path, substitution = new entry id, status dropped at finish; normalize backfills ids for a loaded active only; setSetById / commitSetById({actionAt}) / removeEntryById, index functions wrap them.
- sortByStart in finish, logPastSession, resolveSessionTiming; daysSinceLastSession uses max day; post/rules sort before slice.
- deleteSplit keeps active; History editor: empty save → remove with Undo; rebuildRecoveryModel (linear: recent window + carried last summary; calibrateAfterSession got an optional prevSummary) on save/remove/undo.
- Paused rest: adjustRest changes pausedRemainingSec; startRest while paused stores it; resume keeps effort/preSetBpm.
- tests/reorder.test.ts updated for R2.8 (sets now carry ids) and now also asserts ids survive reorder.
### Layer: UI — done, commit b466dc0 — IDs: UI-13, UI-22, UI-27, UI-28, UI-17, UI-23
- src/core/parse.ts (parseLoad/Reps/DurationSec/Minutes; comma decimal; ranges). WeightInput type=text inputMode=decimal via parseLoad. Train reps/duration, History editor, TimeQuestion/PastSession durations use the parsers; Save disabled on missing day/time, bad duration, future past-session start; logPastSession null → toast.
- New CommitNumber primitive (local text, commit on blur/Enter, range-checked): Profile + Onboarding birth year (1900..now−10) and height (100..250).
- Split rename and gym rename commit on sheet close and Enter. Toast keeps onDismiss in a ref, deps [message, action]. Today Start → requestStart + go('train') (check-in/pre-session sheets). ≤380 px set-grid CSS.
### Layer: notifications — done, commit f022161 — IDs: UI-02, PL-09, RG-18 (test alert part)
- notifications.ts: cached exactOk from checkExactNotificationSetting (boot + resume); rest alert isExactNotification: exactOk; training reminders isExactNotification: false; requestExactAlarm only from a Settings tap. No USE_EXACT_ALARM.
- Settings → Reminders (native only): "Precise rest alerts" row when not granted; "Test rest alert (5 s)".
### Layer: performance — done, commit 0ccadfa — IDs: BR-23, UI-10, BR-32
- recovery: systemicFactor memoised per day inside sessionMuscleDoses; muscleDoses() + recoveryAt() exported, recoveryStatus = recoveryAt(muscleDoses()); readinessSeries builds doses once.
- history: exerciseHistory cached per (sessions array, custom array, id) in WeakMaps; returns a copy.
- Train: LiveClock is the only nowMs reader on the live screen; EntryCard memoises suggestNext, best, autoreg, priorE1rm and per-set prev/PR (deps: sessions, custom, units, goal, gym, entry, today, readiness, deload, recoveryPct; never profile).
- rules week-grade: sessions.length === 0 check without weekSummary.
### Layer: tests + gate — done — app 615 → 641 (also under TZ=America/New_York and Asia/Manila)
- New: tests/clock.test.ts (refcount, 30 ticks → recovery once, minute interval without ticker, TZ change + refresh; the TZ test fails with a no-op resetDayCache), tests/session.test.ts (commit-once, draft on empty, addSet carry, R2.8 ids/substitution/commitSetById/actionAt/backfill, sorted resolve/logPast, deleteSplit keeps active, order-independent rebuild, paused rest, perf), tests/parse.test.ts, tests/notifications.test.ts (mocked plugin).
- Perf (this container, median of 5 after warm-up, 600 sessions): recoveryStatus 42 ms (budget 60), coachInsights 51 ms (budget 150), rebuildRecoveryModel 249 ms (budget 500). Needed: systemicFactor gets a 28-day session window (+2-day margins); calibration asks recovery for pct only (`pctOnly`).
- Gate: `.set-grid input` selectors (load input is text now); rest clock still ticks on Today after a commit; 360 px live screen with 102.5 typed: input not clipped and page not wider than 360. Found and fixed: at ≤380 px the exercise card's button row forced the page to 387 px (row wraps now; grid columns minmax(0, …)).

### R2 report
- Built: clock module + resume refresh; time-zone-safe day keys and local time hints; TZ matrix in CI; commit-once sets and stable live ids with id-based mutators; sorted history everywhere; recovery rebuild on history edits; paused-rest fixes; input parsers and text load entry; commit-on-blur profile fields; rename commits; toast timer; Today start via check-in; exact-alarm handling with Settings row and test alert; perf (dose reuse, per-day systemic factor, history cache, isolated live clock, memoised entry cards); narrow-phone layout.
- Tested: `npm run check` 641; `npm run test:tz` 641 × 2; worker 66; gate PASS.
- Decided by research/judgement: rebuild uses a recent window plus carried last summaries (linear) and finish uses the same window, so live and rebuilt models agree on the recovery prediction; `pctOnly` for calibration; history cache returns copies.
- Needs device check: exact-alarm flow on Android 14+ (Allow row, test alert while locked); comma-decimal entry on the Android keyboard; 360 px phones.
- Next dependency: R3 (coach numbers) reads the new clock/selectors.
(skipped / not reproduced: none)

## Phase R3 — done
### Layer: brain — done, commits efd7e36, 7cfbd73, b94c159, d30da88 — IDs: BR-01, BR-02, BR-03, BR-19, BR-05, BR-06, BR-04, BR-27, BR-07, BR-16, BR-17, D9, BR-08, BR-09, BR-10, BR-11, BR-12, BR-13, BR-14, BR-22, BR-18, BR-20, BR-21, BR-26, BR-31, BR-24, BR-28
### Layer: UI and Escobar wiring — done — IDs: ST-12, ST-13, ST-17, UI-18, RG-09 (+ Train/Escobar call sites for BR-08/BR-09, History for BR-22/BR-28)
### Layer: tests + gate — done — app 641 → 681
- One test per row in the existing files, plus new tests/bodyfat, trend, muscles, exercises, cues (every cue reachable).
- Tests updated because they asserted a fixed bug: weeklyReview hardSetsThisWeek (easy counted half, BR-16); isStale gained a `today` argument (BR-04).
- Perf budgets moved to tests/perf and run alone (`MARC_PERF=1`, part of `npm test`): in the full parallel run recoveryStatus measured 53–58 ms against 60, i.e. contention, not the code (alone: 42 ms).
- Gate: onboarding weight selector (the field is text now). PASS.

### R3 report
- Built: the 21 rows of plan §R3 (see COACHING-DECISIONS.md "Remediation R3").
- Tested: `npm run check` 681 + 2 perf; `npm run test:tz` 681 × 2; worker 66; gate PASS.
- Decided by research/judgement: balance upper = mean of push and pull (the finding's own balanced fixture); plateau-lever's 6-session bar replaces the trend-confidence check; legacy import keeps name mapping via an equipment-agreeing partial match (all gate fixtures unchanged); reason-cue mapping from suggestion mode (reasonKeyFor).
- Needs device check: Body fat inches entry; lb body weight entry; mindset note on Today on an odd day.
- Next dependency: R4 (Escobar integrity) reads these brain outputs.
(skipped / not reproduced: none)

## R0 follow-ups (2026-09-23)
### CI perf budgets — done, commit cdffb8c
- CI run 35875534453 (older head, perf tests still in session.test.ts) failed rebuildRecoveryModel 539/500 and recoveryStatus 75/60. tests/perf-budget.ts times a fixed seeded 200k sort (median of 5; REFERENCE_MS 26 here); scale = max(1, measured/26); each budget asserts time < budget × scale and logs measured, scale and limit.
### R0.9 Upstream location (PL-20) — done
- src/upstreamRelay.ts `UpstreamRelay` DO (env.UPSTREAM.get(idFromName('us'), { locationHint: 'enam' })) runs the step and streams SSE back with an internal `_step` result; src/upstream.ts `localStep`/`relayStep`; the handler keeps validation, quotas, abort, retry, logging and uses the relay when bound. wrangler: UPSTREAM binding + migration v2 new_sqlite_classes ["UpstreamRelay"]. /health adds `relay`.
- mapError: 403 → `upstream_region` ("Escobar isn't available on this network right now. Try mobile data.", the plan's wording), 401 → `upstream_auth`; both pass `detail`. Upstream errors log `{requestId, code, detail, colo}`; the step line includes `colo`.
- App: `upstream_region` in transport ErrorCode and EscobarSheet's message map.
- deploy-worker.yml health check now also requires relay:true.
- Tests: worker 66 → 71 (relay path pinned to 'us'/'enam', no edge client; 403 via relay → upstream_region + detail + colo log; 401/403 split; disconnect aborts the relay's model stream < 50 ms); app transport test. Two exact-shape assertions gained the new `relay`/`colo` fields.

### How the Worker gets deployed
deploy-worker.yml runs on a push to `main` touching `escobar-worker/**`, or from "Run workflow". GitHub only shows "Run workflow" for a workflow that exists on the default branch, and `main` (245c26a) does not have this version. So:
1. Open a pull request from `claude/marc-r0-remediation-ast5xs` into `main` and merge it. The merge is a push to main that touches `escobar-worker/`, so "Deploy Escobar Worker" runs by itself (it needs the existing `CLOUDFLARE_API_TOKEN` secret, and `CLOUDFLARE_ACCOUNT_ID` if the token sees several accounts). It fails unless /health shows protocol 2, key, quotas and relay.
2. Without merging: on a computer, `cd escobar-worker && npm ci && CLOUDFLARE_API_TOKEN=… npx wrangler deploy` from this branch.
Pushing to `claude/escobar-v2-implementation-eidx64` would still deploy that branch's older Worker (its own workflow), without the relay: don't use it for this.

## Phase R4 — done
### Layer: apply/undo — done — IDs: ES-03, ES-04, ES-05, ES-02
- Undo is a targeted inverse per kind (table in plan §R4.1); `active` is never restored; an inverse that can no longer apply throws UndoUnavailable → "Undo is no longer available." and nothing is recorded. Undo map keyed `${conversationId}:${proposalId}`; `appliedAt` stored; `undoOpen()` = applied < 8 s ago and an inverse exists; ProposalCard hides Undo after the window (timer re-render).
- Live-session guards: programme replace and deleting the trained split are ToolErrors; fingerprints include the active split; the programme applier refuses while a session runs (no more `active: null`).
- Today override: `plannedExercises(split, override)` applies swap/remove/add/sets/load at startSession and in the Train preview; entries carry `loadFactor` into suggestNext; finishSession clears it. Step 1 (disable, then re-enable) was folded into this single push since nothing ships between the two.
- ProfileChange.source gains 'escobar' (used by the appliers).
### Layer: session and loop ownership — done — IDs: ES-06, ES-09, ES-10, ES-20, ES-11, ES-08, ES-17, ES-30 (toast), ES-31
- session: loop callbacks touch signals only while their loop is active (others save quietly, same epoch only); resetConversations bumps epoch; busy guard returns 'Escobar is still answering.' and keeps the text as the draft; after send, signals only if the loop is still current.
- loop: a new send aborts a running one; only the latest send sets idle; controller cleared only if still ours; notSent = !userCommitted; an unfinished repair renders the first answer with its unverified marks; decisions recorded during a turn stay queued.
- online: back-off only (60 s), done/refusal/step_limit/cut_off set online; checkOnline reschedules after the back-off; window 'online' clears it; health needs key:true ("Escobar isn't set up yet.").
- plan mode: isPlanRequest (word-bounded regex) in ui/prompts.ts; plan sticks per conversation; live wins in a session.
- memory: eviction skips injury/equipment/agreement; executor throws 'memory is full' when nothing can go; ids are time + random.
- tests/escobar/transport health fixture gains key:true (ES-08 changed the contract).
### Layer: privacy and limits — done — IDs: ES-12, ES-23, ES-13, ES-14, ES-16, ES-11 (render), ES-32 (pending expiry, months)
- context.redactDrivers (resting HR / HRV / sleep drivers) in get_readiness and show readiness_gauge; explainMethod drops health keys (restingHr*, healthDaysLogged, zone*FromBpm, non-Tanaka hrMax) and body keys (restingKcalPerDay) when sharing is off; toRequestMessages replays get_health / get_heart_session / show heart_session (health off) and get_body / show body_trend (body off) as denied.
- brief `one()` (single line, no ⟦⟧, ≤140) on every name, reason, title and memory; actions strip newlines from reasons; months rounded; expired proposals are not pending.
- Photos: Composer 2 per message; at most the 2 newest unsent photos inline per request; decisions log line fixed (D3).
- History window: estimated on the request form, keeps cutting at clean user turns until it fits (≤ 60k est. tokens, ≤ 400 entries); a trim forces a full brief. The existing window test's data was resized (ES-16 re-checks after the cut) and a new test covers repeated trimming.
- Verification: sentences drop leading list markers (both sides); the chips directive is removed before grounding; new CRISIS pattern (plan §R4.8).
### Layer: tools — done, commit c758e76 — IDs: ES-01, ES-15, ES-21, BR-18
- capJson `{ dropFrom }`; get_exercise_history newest first (schema + tools.generated.json regenerated); get_body drops from the start.
- lift_trend: first/last/best over the whole window, 12 points spread evenly (`sampleEvenly`).
- `progressionCtxFor(ctx, exerciseId, gymId?)` → readiness, recoveryPct, deload, equipment, loadFactor; used by get_next_target, get_live_session (autoregulation gets equipment for weighted lifts), get_equipment and show exercise_card.
### Layer: store, search, constants — done — IDs: ES-18, ES-30, ES-32
- fitToBudget never drops the active conversation: `trimOldest` cuts at the first plain user message after the midpoint, sets `trimmed`, shifts rollingSummary.upTo.
- Word-bounded keyword/title matching in palace/registry and knowledge/cards.
- explain_method constants come from the brain: E1RM_MAX_REPS / E1RM_FULL_WEIGHT_REPS, BIAS_MIN_OBSERVATIONS / BIAS_CAP_REPS, READINESS_CALIBRATING_DAYS, DELOAD_TRIGGER. The effort-calibration copy no longer claims the bias changes strength estimates (it doesn't, per the plan).
### Layer: UI — done — IDs: ES-22, ES-26, ES-27, ES-28, RG-03
- Proactive toggle hidden. Pinned cards on Today via ShowComponent (lazy chunk, only when pins exist), `until >= today`, Unpin. MemoryScreen (delete per item, Forget everything with confirm) replaces MemoryPlaceholder. ShowComponent memoised. Citation popover ignores taps inside itself. images.ts: one memoised IndexedDB handle (reset on failure/close); sent photos leave memory (`imagesSent` dep).
- R4.11: first enable imports `coach.askThread` as "Earlier conversation" (text only, leading assistant turns dropped, same-role turns merged) and sets legacyImported.
### Layer: tests — done — app 684 → 736
- New: tests/escobar/session.test.ts (5), apply.test.ts (7), privacy.test.ts (3). Extended: verify (30-phrase crisis table), read (newest first under the cap, capJson ends), show (52-week lift_trend, sampleEvenly), store (active trim, trimOldest, carry-over), palace and knowledge (whole-word matching), loop (sent photos evicted), knowledge (constants equal the brain's).
- The phrase table found 'self-harming' missed by the plan's CRISIS (`self[- ]?harm\b`); now `self[- ]?harm\w*`.
### Layer: gate — done
- Screenshot gate: Apply → Undo within the window ("Undone"); in a second theme Undo is gone after 8 s.
- `npm run check`: 736 passed (+ perf 3) · `npm run test:tz`: 736 × 3 zones · worker `npm ci && npm run check`: 71 passed · `npm run build && npm run gate`: PASS.

## Phase R5 — done (agent side); device checks pending
### Layer: native Java — commits f96f91c, 1st R5 native commit — IDs: PL-03, PL-04, VX-01, PL-08, PL-13, PL-15, PL-10, PL-16, RG-20 (D2)
- Health Connect: results delivered on `callbackExecutor` (cached pool), never on the single `executor` blocked on the latch; today's steps and active calories from two aggregates (local midnight → now), kcal = small calories / 1000; sleep/HR stay on the 48 h read; diagnose total in kcal.
- WatchBridge: startScan/stopScan/connect/disconnect/status/diagnostics run on the main thread; `DeviceScanner.scanning` volatile; one `watchDevices { devices }` event, throttled to 500 ms with a trailing emit; status emitted after the scan starts. WatchService: SecurityException / IllegalStateException on the FGS start → state `paused` with a reason.
- Rationale text (PL-10, "M/ARC", backup sentence per D2). patch_manifest enforces attributes on existing entries (idempotent, checked on a pre-seeded manifest); allowBackup left at default (D2).
### Layer: TS bridges — commit ad7e1b1 — IDs: VX-01, UI-16, ST-16, PL-04, PL-13, UI-21, UI-08, research (back, safe area)
- health.ts: kcalGuard (also heals stored healthDays and health.activeCalories on load), all-granted-failed → null, `lastHealthError`, `syncHealth({ prompt })` (only Settings prompts); `backgroundHealthSync` on cold start, resume and session start: connected only, 10-min throttle.
- watch.ts: `watchDevices` batch (old per-device event kept one release), `watchDiagnostics`, state `paused`. heart.ts: dedupe by receivedAtEpochMs, `state.peek().active`, time base = active.startedAt (sessionStartMs removed).
- Back: `ui/sheetStack.ts` (Sheet registers its onClose; `openSheets` derived), web history entries per sheet with popstate close and `go()` unwinding them first; `native/back.ts` Escobar → sheet → panel → Today → minimise, via `@capacitor/app` 8.1.1.
- Safe area: every inset is `var(--safe-area-inset-X, env(safe-area-inset-X, 0px))`; SystemBars style from the theme bg luminance (paper → light bars).
### Layer: UI — IDs: UI-07, UI-08, UI-16, RG-18, ST-03, ST-04, ST-20, ST-25
- Watch sheet: scanning from the plugin state (local flag reset in `finally`), empty result and permission hints, Forget watch whenever an address is saved, Copy watch diagnostics. Settings: Connect/Sync prompt, "Last sync failed → Details" opens the Health diagnostic sheet (permission, missing, failed, values, Open permissions).
- Found while building the gate: the PWA never registered its service worker, because `@capacitor/core` defines `window.Capacitor` on the web too; `main.tsx` now uses `isNative()`. Cache lookups use `ignoreVary` (module scripts carry Origin; `Vary: Origin` hid the installed bundle offline).
- sw.js: navigations network-first (cached under the URL and index.html), other GETs cache-first and kept only when ok+basic, failures are Response.error(); ASSETS stamped by sw-version.mjs (fails without the marker); activate carries /assets/ into the new cache. "App updated · Reload" toast on controllerchange unless a session runs. index.html: first-paint colours per theme, id validated, no maximum-scale. Manifest id "./".
### Layer: CI — IDs: RG-20, PL-16, research
- Both workflows: dex check for HealthConnectNativePlugin and WatchBridgePlugin before signing, targetSdk/compileSdk ≥ 36, `"@capacitor/app"` in the plugin list, sw.js stamped. Signing steps untouched; agent guard passes.
### Layer: tests — app 736 → 755
- health-bridge (kcal guard, all-failed null, prompt:false never requests, stored values healed), watch (batch), heart-capture (dedupe, peek, restart time base), back (order), theme (index.html colours = THEMES, no maximum-scale, bar style).
- Gate: offline reload renders; "build B" (new cache, old Escobar chunk deleted from the server) still opens Escobar in the old tab.
### Needs device check (owner)
- Health Connect numbers vs the Health Connect app (steps, active kcal); no 20 s stall on sync.
- Watch scan/connect stress; FGS start with Bluetooth denied shows "paused".
- Back gesture on 3-button and gesture navigation; edge-to-edge bars on Android 15/16 per theme.
### Layer: gate — done
- `npm run check`: 755 passed · worker 71 passed · `npm run build && npm run gate`: PASS (incl. service worker offline reload and build-B carry-over).

## Phase R6 — done (agent side)
### Layer: data model — IDs: RG-04 (D5), RG-19 (D4), F1, F2, F5
- `LoggedSet.kind` ('warmup' | 'drop' | 'failure'); `LoggedExercise.note`, `Session.note`, active entry `note`; `AppState.exerciseNotes` (≤ 200 chars, normalize `{}`), `daysOff` (valid, unique, sorted, ≤ 400, normalize `[]`), `lastBackupAt`; `Preferences.backupReminder`.
- 30 phase-9 exercises appended to exercises.json (153 total); DURATION_NAMES / CONDITIONING_NAMES ported verbatim.
### Layer: brain — IDs: F2, RG-19, RG-17
- `hasEntry` (filled in) decides what is kept and committed: `finishSession`, `commitSet` (a warm-up commits but never starts auto-rest), the un-commit check, `logPastSession`, the History editor, CSV. `isWorkingSet = hasEntry && kind !== 'warmup'` stays for counting (exposure, volume, recovery, e1RM, records, progression, weekly review, coach rules, Train/Coach counters, Escobar tools). `effortLabel`: failure = max (exposure, recovery, summaries). Records drop `drop` sets (both sides). Template save counts non-warm-up sets; suggestNext plans non-warm-up sets.
- Days off: `trainingStreak(…, daysOff)`, `adherenceRate(…, daysOff)`, `plannedThisWeek(schedule, daysOff, today)` as weekSummary's target (selectors, History, Escobar read/show/brief); training reminders skip days off.
- `sessionsToCsv(sessions, unit, from, to)` (RFC 4180, `setLoadIn`, exercise note on its first set, session note as its own row). Escobar get_exercise_history carries `setupNote`.
### Layer: UI — IDs: RG-17, RG-19, UI-20, F1, F2, F5, F8, F9
- Settings → Your data: Export CSV (90 days / all), "Last backup: N days ago" (stamped on export), Weekly backup reminder (native; Sunday 19:00, inexact, id 880101, tap opens Settings at Your data; taps route by `extra.type`).
- Today: "Take today off" (toast Undo) and a Day off state with Train anyway / Undo.
- Live card: setup note under the name (edit in Options, plus today's note), set-number button opens Normal / warm-up / drop / to failure, Log warm-ups in the warm-up disclosure, conditioning distance (1–1000 m) and seconds inputs. Finish: effort repair (≤ 12 unrated working sets, Skip) and a session note.
- History: session and exercise notes, setup note, W/D/F tags; Stats: 12-week volume bars in the display unit.
### Layer: tests — app 755 → 769
- exposure (kinds, warm-ups add no weekly sets), prs (warm-up/drop never a record), e1rm (warm-up ignored, failure = max), session (2 warm-ups + 3 working = 5 stored / 3 counted, no rest on warm-up, notes, farmer's carry distance), r6-features (CSV rows/quoting/filter, days off in streak/adherence/target, normalize, library modes, notes).
### Layer: gate — done
- Screenshot gate: day-off state on Today, setup note under the exercise name, logged warm-ups (W) in the live card, CSV row in Settings; page width checked. `npm run check`: 769 passed · worker 71 · `npm run build && npm run gate`: PASS.

## Phase R7 — done (agent side)
### Layer: deletions — commit 1aea4ca — IDs: ST-22, RG-13, BR-30, ES-24, UI-32, PL-15
- Removed after `grep -rnw` showed zero callers: store computeds, `hoursSince`, `withinDaysOfSession`/`withinDays`, `energyFromWatch`, `pickEnergy`, `dailyActiveKcal`, `weeklyEnergy`, `e1rmWeight`, `isRealChange` (and their tests: 769 → 760), `brain/index.ts`, `Bar`, `Ring` + `.ring`, `IconClock/Spark/Moon/Heart`, `REST_STEP`, `profile.setName`, `show.weeklyTotals`, `read.weeklySetsFor/e1rmOf`, `actions.equipmentGroupOf`, `context.plannedPerWeek/displayUnit`, `selectors.plannedPerWeek`, worker `MODE_ADDENDUM`, Java `LiveSession` average/min/max/total/lastReceivedAt, `batteryReceivedAt`, `HealthConnectNativePlugin.diagnose` (R5 uses `lastHealthError`), `.watch-pill .dot.live`. The watch branch uses none of them. Kept `energyFromHealthConnect`, `isDuplicateSession`, `retroSessionLogging`.
- `loadImage` is now used: sent-photo thumbnails load from IndexedDB (the R4 eviction had left them as a "Photo" placeholder). explain_method no longer claims 7–10 rep sets weigh half.
### Layer: dedupe — commits 81a3ad2, prepare-android — IDs: ST-23, RG-16, ES-24, RG-12, UI-29
- `DAMAGE_*` from data/recovery; `DirectiveBuffer` in the loop; `titleFrom()` and `withPendingDecision()` shared by loop/store/apply; RestBanner on `restRemainingSec`; `native/filePicker.ts` (null on cancel) for backups and photos; `core/sessionLogging.ts` (re-exported by brain/fidelity); `APP_VERSION = __APP_VERSION__` from package.json via Vite `define` and `scripts/build-convert.mjs` (the converter imports it too); version 37.1.0 (D13); esbuild a direct devDependency; `scripts/**/*.ts` in tsconfig.
- `scripts/prepare-android.sh` generates the Android project for both workflows (the release icon background had drifted to #06131B).
### Layer: CI and gate — IDs: PL-17, PL-18, RG-14
- Release: version name `<package.json>.<run>`, code `major × 1,000,000 + run`; a green "M/ARC gate" run on the SHA is required (`actions: read`, `gh run list`), else the gate runs in the release job; action majors aligned up (checkout@v6, setup-node@v6, setup-java@v5; agent-guard.yml is the supervisor's and keeps checkout@v4). CI on the R5/R6 pushes failed because the new dex check ran before "Build debug APK"; fixed by moving it after the build.
- Gate: local-date fixtures, `visible()` (locator.waitFor, 5 s) for every "should appear" check, one retry of the 150 ms first-feedback check on a fresh page, console errors fail the pulse pass; CI runs the gate a second time with `TZ=Pacific/Auckland`.
- Adaptive icon: `render-logo.mjs --android` renders the padded foreground (mark inside the 66/108 safe zone) and a monochrome layer per density into `native/res/`, with `mipmap-anydpi-v26` XML; `prepare-android.sh` copies them.
### Layer: copy, a11y, hooks — IDs: UI-25, RG-10, UI-26, UI-30, ST-24
- Editor hint and `k lb` volume for lb users; `HeartBpm` role=img; RestBanner announces "Rest done" once through a polite live region; `Row` activates on Enter/Space; `Segmented` sets `aria-selected`; effort buttons get a 44 px tall hit area (sideways it stops at the 4 px gap); `WeeklyReviewCard` calls its hook before returning. ST-24: lb display stays at 0.1 (decision).
### Layer: docs — RG-11
- README and docs/ARCHITECTURE.md rewritten to match the code (layers incl. escobar/, escobar-worker/, assets/; impulse-response recovery; 2.5 % records with effort-aware Epley; progression inputs; the full AppState key list and side stores; workflows on every branch).

## QA fixes (docs/qa/LIVE-QA.md on claude/marc-regression-architecture-gegkbq, 104 items; section W is the watch agent's)
Order: high → medium → low. Each fix has a test that fails before and passes after.

### QA-R0-1, QA-R0-2 (HIGH), QA-R0-3, QA-R0-4, QA-R0-5 — Worker. **Live only after the owner merges to main** (deploy-worker.yml)
- Every billed step is recorded: finished, refused (the API's own output count), and cut short by a hang-up, a timeout or a mid-stream error (output estimated from what was streamed). An error before any output is not billed and not counted. A step with no final message ends the turn.
- The per-IP daily cap now counts steps as well as turns (`MAX_STEPS_PER_IP`, default 1500), so tool-call-only turns from rotating device ids stop.
- IPv6 callers are keyed by their /64 for RATE_IP and the daily IP counters.
- A body without content-length is read in chunks and refused as soon as it passes 3 MB (no second TextEncoder copy).
- The relay spreads turns over 8 objects (`us-0`…`us-7`, all `enam`) by device, instead of one.
- Tests updated for the new contract (not loosened): the IP row now carries `steps`; the relay test expects the device's shard name.
- Not changed, by decision: requests with no Origin and self-minted device ids (QA-R0-1 part 3). The plan drops signed device ids (D15); the IP /64 key and the steps cap are what limit rotation.
### QA-R1-1, QA-R1-2, QA-R1-3 (medium)
- Quarantine with storage full moves the unreadable raw (removes the source key first, then writes the `.corrupt` copy), so boot is flagged and the data survives.
- `repairState` needs a session start time: a missing or malformed day is derived from it, and a session with neither is dropped (counted in `dropped`). Covers boot, restore and other-tab loads.
### QA-R2a-1, QA-R2a-2 (medium), QA-R6-13 (low)
- Health Connect part: already fixed by R5 (`backgroundHealthSync`: connected only, `prompt: false`, 10-min throttle). Notifications: `ensurePermission({ prompt })` only requests on a Settings tap (reminder controls, backup-reminder toggle); launch, resume, day-off and schedule edits only check. No more prompt on first launch either.
### QA-R2b-1 (medium)
- An emptied committed set is a draft while empty but keeps `at`, `restSec`, `fidelity` and `heart`; refilled, it is committed again with its original timing and rest is not restarted. The R2 session test that asserted the emptied set loses its time was updated for this contract (named in the test).
### QA-R2b-2, QA-R2b-4 (medium)
- Already fixed by R4.1 (c00fb27): split delete has a targeted inverse that never touches `active`, and deleting the split being trained is a ToolError. Regression test added for the QA scenario (fails at origin/main, where the applier snapshots `active`).
### QA-R2b-3, QA-R2b-5 (medium), QA-R2b-6 (low)
- finishSession predicts from the whole history again (one call, ~40 ms at 600 sessions), so it judges against the number the app showed.
- The rebuild's window covers the 28-day load ratio and layoff novelty (29 days, and at least F_ref sessions), anchors training age to the first session when none is set, and calibrates the sessions finishSession calibrates (everything but a session typed in afterwards: retro without `compressed`), including pre-logging `legacy` saves.
- `calibrateAfterSession` only runs the recovery prediction when some exercise has a max-effort comparison. Perf fixture rebuild: 34 ms (budget 500 ms, unchanged). Worst case measured: 600 sessions with every exercise at max effort, 0.7 s, only on a History save.
### QA-R2d-1 (medium)
- Recovery and readiness selectors read one computed per state field (`sessions`, `profile`, `healthDays`, …), so edits to the live session (a new `active`) leave them untouched and EntryCard's memos survive typing.
### QA-R3a-1, QA-R3a-5 (medium), QA-R3a-8 (low)
- 'under' needs the last two completed weeks to be full training weeks (3+ sessions, `FULL_WEEK_SESSIONS`) and both below the band. A first week, a first week back, or part weeks read 'in'. Two R3 volume tests that encoded the first-week 'under' were updated (named in the test) and a full-week case added.
- get_volume and volume_bars send `lastWeekSets` (and get_volume says what status is judged on). Body's this-week bar colours by this week's own count against the band.
### QA-R3a-2 (medium)
- `liftTrend(history, mode)` in brain/trend.ts: weighted uses the strength estimate, bodyweight best reps, duration longest hold, assisted the assistance load inverted. get_exercise_history and lift_trend pass the lift's mode to plateauStatus and use liftTrend.
### QA-R3a-3, QA-R3a-4 (medium)
- Upper = push + pull again (plan row 9), compared after dividing by `UPPER_PER_LOWER` (1.5): an even upper/lower split and a full-body week are both balanced; neglecting either region is still flagged. The shown ratio is the plain set ratio. COACHING-DECISIONS updated.
### QA-R3a-6, QA-R3a-7 (medium)
- `plateauStatus` looks only at sessions since the last break over 28 days (`sinceLastBreak`), so a comeback is not judged on months-old sessions (coach plateau notes and the deload trigger).
- The plateau lever needs its 6+ sessions to span at least 42 days of the 56 it looks at (`PLATEAU_MIN_SPAN_DAYS`); two weeks of a 3x/week lift no longer reads as flat.
### QA-R4a-1, QA-R4a-2, QA-R4a-3 (medium), QA-R4a-8 (low)
- `dropLoop()` (new/select/reset conversation and store replaced) stops the turn and sets loopView idle, pendingUser null, lastTurn null and the safety cards empty: the stopped loop is no longer allowed to touch the UI, so the switch does it.
- Plan mode is persisted through `updateConversation`, so the running loop's copy is plan too and a follow-up stays in plan mode.
### QA-R4a-4 (medium)
- `changedFromPlan(active, split)` compares the session with what was planned for today (the split shaped by today's Escobar adjustment), for both the finish prompt and `changedTemplate`. A one-day swap or skip from Escobar no longer offers "Keep the change for future sessions?".
### QA-R4b-1 (medium)
- `prepare()` runs the one-time carry-over when Escobar is already on, so users who enabled it in an earlier build get "Earlier conversation" once; `legacyImported` stops a second import.
### QA-R5a-1 (medium)
- A sync merges into the day already stored: a field a later sync could not read (or read as empty) keeps the earlier value. A partial failure sets `lastHealthError` (Settings shows its message and the Details row); the sync reports success only when nothing failed.
### QA-R6-1 (medium), QA-R6-7 (low)
- `backupAgeDays` compares the local day the backup was made with today (the stamp is UTC): no more -1 in the evening west of UTC or +1 in the morning east of it (tested under the 3-zone run). Tests added for the reminder (id, Sunday 19:00, inexact, cancel when off) and tap routing by `extra.type`.
### QA-R6-2 (medium)
- `volumeChartWeeks` returns oldest week first (weeklyVolumeHistory lists this week first); the chart and its 'this week' header read the right week.
### QA-R6-3 (medium), QA-R6-11 (low)
- `firstWorkingSet()` (brain/exposure): the live card's autoregulation tip and Escobar's live view start from the first non-warm-up set; Escobar plans and counts only working sets.
### QA-R1-4 (low)
- The lb backfill runs inside `repairState` (it sees the raw state), so restore gets it too.
### QA-R1-5 (low)
- With both copies kept aside, the rescue file holds both (crash-screen rescue format), so 'Delete rescue copy' after saving loses nothing.
### QA-R1-6 (low)
- Panel params keep an exerciseId that is in the person's history even when the library no longer has it.

### QA-R1-7 (low)
- Reset everything goes through `resetState`, which drops the daily restore point before saving, so the wiped history cannot come back from it.

### QA-R7-1 (medium)
- `.effort` rows are 44 px tall, so a button's 44 px hit area no longer reaches into the next row. The gate checks the point just below each row's Max button in the effort repair sheet. (The CSS and gate lines landed in the QA-R1-4 commit by mistake.)

### QA-R1-8 (low)
- The error card adds "Reset app data" (behind a confirm, with a note to save a copy first). It uses the same wipe as the start-up crash screen, so a state that crashes on every render no longer traps the person.

### QA-R1-9 (low)
- A reset or restore of Escobar's store bumps `marc.escobar.v1.replaced`. Other tabs listen for it (and for a removed store or a cleared storage) and drop what they hold, so their next save cannot write the old conversations back.

### QA-R2c-1, QA-R2c-4 (low)
- "Test rest alert" calls `testRestAlert()`. It uses its own notification id (880002), so it no longer cancels a live rest's alert. It asks for permission (it is a tap), and when notifications are refused the toast says so instead of promising an alert. The Health Connect diagnostic part of R2c-1 was done in R5 (`lastHealthError`).

### QA-R2c-2, QA-R2d-2 (low, same root cause)
- `resolveSessionTiming` ignores an unparseable time (the session stays as saved at finish) and returns false. "When did you train?" Skip and close with a cleared day or time use the guess the sheet opened with.

### QA-R2d-4 (low)
- On load, a live set with the same commit time (or id) as the set before it is treated as a copy made by the previous version's "+ Set". It keeps its typed values and loses the copied commit time, rest, heart data, status and id, so committing it works normally.

### QA-R3a-9 (low)
- When today's soreness rating holds a muscle below ready after the model's own ready time has passed, the status has `soreToday` and no ready time. Body says "sore today" or "Held back by today's soreness rating", not "ready in under 1h".

### QA-R3a-10 (low)
- `navyBodyFat` moved from `brain/` to `core/bodyfat.ts` (pure math, no brain dependencies), so the store's repair can use it. Readings without `formula: 'navy-cm'` are recomputed once on load from their stored tape numbers and the profile's sex and height, then marked. New readings are saved with the mark. A reading that cannot be recomputed keeps its number.

### QA-R3b-1 (low)
- Without an equipment profile, live autoregulation rounds on the 2.5 kg grid strictly past the target in the direction it advises: a drop from 44.9 or 45.359 kg is 42.5 kg, never 45. Escobar's live-session tool already passes the gym's equipment (R4.7).

### QA-R2c-3 (low)
- Every toast has its own id and `<Toast>` is keyed by it, so the same message shown twice restarts its timer. Gate: "Test haptic" tapped twice 2 s apart; the second toast must still be showing 2.2 s later.

### QA-R2d-3 (low)
- The Finish sheet's duration is its own small component that reads the ticking clock, so it keeps counting while the sheet is open. Gate: the value changes over 2 s.

### QA-R3b-2, QA-R3b-5 (low, same root cause: coach text did not know the display unit)
- `CoachContext`, the weekly review input and the pre-session input take `unit`, filled from preferences by the app and by Escobar.
- In the person's unit now: record "up from" values (`formatRecordValue`), the effort-calibration note, the weight-updated note, the weekly weight trend, and the fallback load target.
- Escobar's `get_records`, `records_list`, `get_session_debrief` and exercise detail pass the unit too; load records carry `unit`.
- (The Finish-sheet `Elapsed` component for QA-R2d-3 landed in this commit's Train.tsx.)

### QA-R3b-3 (low)
- A name that contains a library name matches it only when the extra words name no other movement: a word from any library name ("calf", "raise") means a different exercise. So "Hack Squat Calf Raise" is no longer filed under Hack Squat, while "Hack Squat heavy" still is. This applies to the import path with equipment too.

### QA-R3b-4 (low)
- Train asks `warmupOffer()`, which returns null when the ramp is empty (a working set on the empty bar), so no "Show warm-up" toggle opens an empty list.

### QA-R3b-6 (low)
- A watch max older than 12 months still decays toward the age estimate but never below it, so heart zones no longer drop about 10 bpm on the day the reading turns a year old.

### QA-R3b-7 (low)
- Today's quote comes from `sparkIndexForDay`, which steps once per quote day (the even days of the year). Every quote now comes round within a year. With days since 1970, the parity was locked to the mindset days, so only half the quotes ever showed.

### QA-R3b-8 (low)
- A plateau suggestion keeps the load, so its reason cue is "confirm" (repeatability), not "reduce".

### QA-R4a-5, QA-R4a-9 (low, same root cause)
- "Before you start" builds its brief from `todaySplit()`, the split with today's Escobar change applied. Removed exercises are not quoted, swapped-in ones are, and each target gets the same `loadFactor` as the set rows.

### QA-R4a-10 (low)
- `plannedExercises`: a swap to an exercise already in the split drops the one swapped out, so the session and the Splits preview have one entry per exercise.

### QA-R4a-6 (low)
- A network error in `send()` now also calls `checkOnline()`. Inside the 60 s back-off that schedules a re-check for when it ends, so the Coach tab's Escobar box comes back without reopening the sheet.

### QA-R4a-7 (low)
- The finding is test coverage. The code was already correct; the skeptic confirmed this by running it. Added loop tests: an error during the repair keeps the first answer, marked, with `notSent: false` (ES-11/ES-10), and a decision recorded mid-turn stays queued and reaches the next brief (ES-20). These tests pass before and after, as expected for a coverage item.
- Also: the health check's reason (for example "Escobar isn't set up yet.") is kept in `offlineReason` and shown in the offline notice.

### QA-R4a-11 (low)
- Undo on "adjust today" says "Undo is no longer available" once a session of that split has started since the change was applied (live or finished). It no longer reports "Undone" while the running session keeps the change.

### QA-R4b-8 (low)
- "What Escobar knows" shows the saved date as the phone's day (`dayKey(createdAt)`), not the UTC date in the timestamp.

### QA-R4b-7 (low)
- `trimOldest` shifts proposal cards with their messages and drops the cards whose message was cut, so after a restart no card vanishes or lands under the wrong answer.

### QA-R4b-4 (low)
- `fitToBudget` keeps at least 250 KB (`MIN_STORE_ROOM_BYTES`) for Escobar even when the main state and heart store fill the 4 MB total. The active conversation is trimmed, not dropped, for people with years of history.
- Test updated: "size guard counts the main state and heart store against 4 MB" now uses 50 k-character conversations instead of 20 k, so they are above the new floor. Its assertions are unchanged.

### QA-R4b-9 (low)
- `windowMessages` serialises each message once and sizes each candidate cut from suffix sums. The count is the same as `JSON.stringify` of the slice. The fixture from the finding (300 short turns, then 40 × 12 KB) takes 1.8 ms, down from 188 ms. New perf budget: 40 ms.
- Note: the existing `recoveryStatus(600)` budget (60 ms) measures 53–58 ms on this machine, with one 62.7 ms outlier. It measured the same before today's changes, so this is headroom, not a regression. Flag it if CI goes red on it.

### QA-R4b-5 (low)
- Escobar's live-session tool gives autoregulation advice only for weighted main lifts, like Train. An assisted pull-up no longer gets "Try 22.5 kg", which would mean more help.

### QA-R4b-3 (low)
- When a step of the turn sends a trimmed window, the turn's first commit no longer writes this turn's brief lines back, so the next brief is full, including for turns without tools. While a chat stays over the window, each turn therefore gets a full brief (the plan's "force a full brief after any trim").

### QA-R4b-2 (low)
- When a sharing switch is off, replayed tool results that were not already denied are scrubbed of health keys (heart numbers, resting-HR baselines, sleep, watch, HR drivers) or body keys (body weight, body fat), in both `data` and the `facts` map. This covers get_readiness, get_session, the live session, readiness_gauge, session_summary and explain_method. Replayed briefs lose their readiness drivers or `weight N kg`. Training data stays.
- Also fixed test typing from the QA-R4b-3 and QA-R4b-9 commits: assistant fixtures are cast to `StoredMessage`.

### QA-R4b-6 (low)
- Test coverage only; the guards were already correct.
  - The old coach chat import runs once on enable, sets `legacyImported`, and a second enable adds nothing.
  - Undo after a workout started on a split Escobar created, or on a programme he applied, is refused and the split stays (apply.ts guards at the create and programme undos).
- These tests pass before and after.

### QA-R5a-2, QA-R5b-1, QA-R5b-6 (low, same root cause)
- The watch sheet reads `needsLocation` from `watchPermissionState()`, on open and on each scan, and shows `watchPermissionHint()`. It names Location on Android 8–11 and Nearby devices on 12+.
- Not done here: forwarding the scanner's "Bluetooth is off" message from `native/watch/WatchBridgePlugin.java`. That is native Java outside this finding's scope, and it needs a device check.
- **Needs device check:** Android 11 phone → deny Location → the hint names Location.

### QA-R5a-3 (low)
- `syncHealth` notes the day when the reads start. If midnight passed before they finished, the "since midnight" aggregates (steps, active calories) are dropped from that sync instead of being stored under the new day. Sleep and heart rate use windows and are kept.

### QA-R5a-4 (low)
- Decided by research: a full total for a past day needs a native read of yesterday's aggregates (HealthConnectNativePlugin, Java), which can't be checked here without a device. Instead, Escobar's `get_health` now labels each day's steps and calories with `totalsAsOf` (the last sync's time that day) and a note, so the coach no longer treats partial totals as full ones.
- **Next dependency / owner decision:** add a native "yesterday" aggregate read if full past-day totals matter.

### QA-R6-4, QA-R6-10, QA-R6-12 (low, same root cause)
- `plannedThisWeek` returns null when nothing is scheduled on any weekday. `weekSummary` aims for 3 only then. A week whose planned days were all taken off has a target of 0: a session makes it a Strong week, and none makes it "Rest week".
- Escobar's `get_overview` `week.planned` uses `plannedThisWeek`, so days off are left out.
- Test updated (it asserted the old encoding): the BR-22 "week grade uses the planned days" case passes null for "no schedule" instead of 0.

### QA-R5b-2, QA-R5b-5 (low, same defect)
- The manifest `id` is `./index.html`, which resolves to the same URL as `start_url`. That is the identity existing installs already have, and Chromium's recommendedId. `./` changed it.
- **Needs device check:** an older install is not offered again as a second app.

### QA-R5b-3 (low)
- On activate, the service worker carries over only the previous build's own `/assets/` files, marked `x-marc-carried`, and never carries a carried file again. The cache holds at most two builds. Test: 10 simulated deploys with the real `sw.js` leave 8 entries instead of 40. The gate's build-B carry-over check still passes.

### QA-R5b-4 (low)
- On `controllerchange`, `pageIsCurrent()` checks whether the page's own entry script is one of the new build's files, rather than a carried one. "App updated · Reload" shows only when it is not. The first launch after a deploy (network-first, already current) no longer shows it.

### QA-R6-5 (low)
- A conditioning lift logged by distance or time progresses by distance (+5 m, or +10 m from 100 m) or time (+5 s) at the same load. It repeats after a max effort or a long gap, and in a lighter week it keeps the distance at a lighter load. New mode `distance`. It never shows "1 reps".
- Train: a loaded carry uses the gym's equipment unit and the unit flip, and "Last:" shows load · distance (or time).

### QA-R6-6, QA-R6-8, QA-R6-9 (low)
- R6-6's remaining call sites:
  - The autoregulation tip and Escobar's live plan were fixed in QA-R6-3/11 (`firstWorkingSet`).
  - The negative backup age was fixed by `backupAgeDays` (local day).
  - The other two are R6-8 and R6-9 below.
- R6-8: the "Last:" hints use each row's place among the working sets (`workingIndex`). Warm-up rows get none, so the first working set shows last time's first set.
- R6-9: the kg/lb slip chip uses `setUnitSuspect`, which never flags a warm-up or a drop set.

### QA-R7-2, QA-R7-3 (low, same gap)
- `setDamage` reads `DAMAGE_HEAVY_MAIN` instead of the literal 1.15, so changing the constant changes the model. Test: the constant mocked to 1.5 gives 1.5.

### QA-R7-4 (low)
- `.watch-pill` uses `var(--text)`; `--text-1` was never defined. New test: every `var()` in the stylesheet is a theme token, is defined in the sheet, or is one of the named inline properties.

### QA-R7-5 (low)
- Plan R7.4 kept lb display at 0.1. That stays for everything off the quarter-pound grid. A value that lands on .25 or .75 lb (1.25 lb add-ons) keeps its two decimals, so 26.25 lb no longer shows as 26.3 and warm-up ramps don't round one step up and the next down. Typed values still convert back exactly.

### Perf headroom (follow-up to the QA-R4b-9 note)
- `npm run check` failed once on `recoveryStatus(600)` at 60.4 ms against its 60 ms budget. The budget stays as it is. The code got faster instead:
  - `sessionRpeLoad` is remembered per session object (sessions are never mutated), so the per-day acute:chronic windows stop recomputing it about 40 times per session.
  - `recoveryAt` drops doses older than the lookback once, before the bisection.
- `recoveryStatus(600)` now takes 30–33 ms, down from 53–60, and the dose build 29 ms, down from 56.

## R8 (owner order: F7 → F6 → F10; F4 skipped; F11 waits for the owner's Health Connect confirmation)

### F7 — per-mode model routing (D12). Design note
- **What:** the Worker reads `MODEL_CHAT`, `MODEL_PLAN`, `MODEL_LIVE`, `MODEL_BRIEF`, `MODEL_MOMENT` and `MODEL_SUMMARIZE`, each falling back to `MODEL`. Per D12, `MODEL` stays `claude-opus-5` and no override is set; the owner chooses.
  - A malformed override (anything that is not a model id) is ignored.
  - `/health` lists each mode's model.
  - System-message folding and the learned "no system role" set are per model, so a mode on a model without mid-conversation system messages gets `<situation>` blocks.
- **App:** each step is priced by the model that ran it (each fallback attempt by its own model since QA2-F7-1; an attempt that declined before output is not billed), and the day's `usage.costUsd` adds those up. Settings shows it, and days recorded before this fall back to the old estimate. Dated ids use their alias's price. Haiku 4.5 and Fable 5 were added to the table.
- **Prices checked on 2026-09-23** against platform.claude.com/docs/en/about-claude/pricing ($/MTok input · output · cache hit):

  | Model | Input | Output | Cache hit |
  |---|---|---|---|
  | Opus 5.5 | 4 | 20 | 0.20 |
  | Opus 5 | 5 | 25 | 0.50 |
  | Sonnet 5 | 2 | 10 | 0.20 |
  | Haiku 4.5 | 1 | 5 | 0.10 |
  | Fable 5.1 | 10 | 50 | 0.25 |

  The Sonnet 5 introductory price is now standard, so the planned rise to $3/$15 is cancelled.
- **Recommendation for the owner (decided by research, not applied):**
  - `MODEL = claude-opus-5-5`. It is cheaper than Opus 5 on every line (−20 % input and output, −60 % cache reads), and the Worker already handles its preserved thinking.
  - `MODEL_BRIEF`, `MODEL_MOMENT` and `MODEL_SUMMARIZE` = `claude-sonnet-5`. These are short structured-JSON modes, at half Opus 5.5's price.
  - Keep chat, plan and live on Opus.
  - Haiku 4.5 is not recommended: the Worker sends adaptive thinking and effort, which were not verified on it.
  - Switching models inside one conversation (chat ↔ live) loses the prompt cache for that step. Keep chat, plan and live on one model.
- **Needs owner action:** set the vars in `escobar-worker/wrangler.toml` (or the dashboard) and merge to main to deploy. Worker changes are live only after that merge.

### F6 — supersets and circuits. Design note
- **Data:**
  - `SplitExercise.group?: string`, and the same `group?` on a live entry and a finished session exercise.
  - Exercises that share a group are adjacent. `normalizeGroups()` enforces that after every split edit and in state repair: a label that is not adjacent to its previous use is split, and a group of one loses its label.
  - Two exercises make a superset, three or more a circuit. Letters (A, B …) are given in order for display.
- **Editor:** each row but the last has a link button, "Superset with the next exercise", that joins or splits that pair. Moving or removing rows re-normalizes.
- **Live session:**
  - Entries copy `group` at start. Today's Escobar changes keep it on a swap and drop it for an added exercise.
  - Grouped cards show a bracket and "Superset A · 1 of 2".
  - **Rest rule:** `restDueAfter(entries, entryIndex, setId)` is a pure function in `session.ts`. After a working set in a group, auto-rest starts only when that round (the set's place among the entry's working sets) is committed for every exercise in the group that has that round. Otherwise the next exercise follows with no rest. Warm-ups never start rest, as before.
- **Kept:**
  - "Save as template" and the finished session keep the groups.
  - The brain is unaffected: exposure, recovery and records read sets, not groups.
- **Not in scope:**
  - Escobar's split tools do not read or write groups, so an Escobar split update drops them.
  - CSV export has no group column.
  - Both are noted for later.

### QA-R7-1 follow-up (supervisor re-check)
- The first R7-1 fix (44 px rows, which landed in the QA-R1-4 commit 14f0046) was only checked on the Finish sheet. The supervisor was right about the "Log a past session" rows: they touch, so a tap 7–8 px below set 1 still reached set 2. The new gate check reproduced this: `row 0 easy +7px, +8px`.
- Fix: `.effort` rows are 48 px tall, so the 44 px hit area stays inside its row with 2 px to spare. The gate now runs the elementFromPoint check (1–8 px below every effort button must hit its own row or no effort row) on the past-session sheet as well as the Finish sheet.

## QA round 2 (docs/qa/LIVE-QA-2.md and docs/qa/FIX-GUIDE.md on claude/marc-regression-architecture-gegkbq)

The supervisor re-checked the QA commits: 79 of 96 were fully fixed, plus QA-R7-1. For the 2 high and 13 medium items still open, the supervisor wrote and verified the fixes (`docs/qa/fixes/ALL.patch`, including the four required follow-ups and the effort inset). `git apply` was blocked here, so the owner had them applied by hand, exactly as in the patch. Each has a test that fails without its source change; I re-checked this per group.

- **QA2-FA-1, QA2-FA-2, QA2-FA-3, QA2-FA-4 (Worker):** a step cut short before the API reports usage is charged 200 output tokens per second it ran (`CUT_SHORT_TOKENS_PER_SEC`), capped at `max_tokens`, or streamed characters / 3 if more. An error after a thinking-only phase is counted. Owner default: a normal cancel is over-counted about 2–4× against the daily cap.
- **QA2-F7-3 (Worker):** `MODEL_<MODE>` must be an exact id in `MODE_MODELS` (models that take adaptive thinking and effort). Anything else is ignored: that mode keeps `MODEL`, `/health` lists it under `ignoredModels`, and the deploy check fails.
- **QA2-FB-1:** the error card's reset calls `stopSaving()` before wiping, so the unload save cannot write the crashing state back.
- **QA2-FB-2:** Escobar's reminder Apply resyncs with `prompt: true`, like the Settings toggle.
- **QA2-FC-4:** assisted `liftTrend` follows the assistance (inverted), then best reps. It no longer uses the e1RM of the assistance.
- **QA2-FC-1:** the History exercise card's trend, sparkline and hint follow the lift mode (`progressTrend.ts`). Weighted lifts are unchanged (owner default).
- **QA2-FC-2, QA2-FC-3:** the plateau lever and the weekly e1RM review use only the sessions since the last break (`sinceLastBreak`).
- **QA2-FD-1:** a new card's id is past the highest id kept, so a trim can't cause a repeat.
- **QA2-F7-4, QA2-F7-1, QA2-F7-2 (app cost):**
  - Cache writes are priced at 1.25× (5-minute) or 2× (1-hour) the input rate.
  - Each fallback attempt is priced by its own model, and an attempt that declined before output is skipped.
  - The price table is complete.
  - Only an exact id or `alias-YYYYMMDD` matches a price; an unknown id gets the dearest rates.
- **QA-R7-1 (again):** the effort `::before` inset is -8px, so the hit area is 44 px tall; the rows are 48 px.
- **Worker changes (QA2-FA, QA2-F7-3) go live only when the owner merges to main.**
- The 32 low items in LIVE-QA-2.md come next, each with a test.

### QA round 2, low items

#### QA2-FA-6 (Worker)
- `billed()` no longer counts a step that stalled or was cancelled before any output. A step still counts if it produced thinking (`modelOutput`), text or tools, finished, or refused.
- Test: two stalled requests with `MAX_TURNS_PER_DEVICE=2` record nothing, and a third request still gets through.
- Live only after the owner merges to main.

#### QA2-FA-5 (Worker)
- The relay shard hash is seeded with a random value picked when each Worker instance starts. It uses FNV-1a with a murmur3 finalizer, so a caller cannot work out which device ids land on which shard, or aim a burst at a chosen group of members. The relay holds no state, so a device may use another shard in another instance.
- Test: under 64 seeds, one id lands on all 8 shards, and two ids that differ only in their last character do not stay on the same shard. The first version, without the finalizer, failed this test, which is why the finalizer was added.
- Live only after the owner merges to main.

#### QA2-FB-3, QA2-FB-6 (same root cause)
- `syncBackupReminder` returns whether the reminder is scheduled and sets `backupReminderScheduled`. When the switch reads on but nothing could be scheduled, Settings says "Not set: notifications are off for M/ARC." and offers "Allow notifications", which asks, because it is a tap. The untrue "shown as off" comment is gone.
- **Needs device check:** a new Android 13+ install shows this line until notifications are allowed.

#### QA2-FB-4
- `scheduleRestDone` checks permission first and never lets the plugin ask on its own, so a rest timer no longer brings up the permission dialog mid-workout. The Settings test alert still asks, because it is a tap.

#### QA2-FB-5
- A committed set that is still empty when its field loses focus (`commitSetById` on blur) gives up its commit: its time, rest, fidelity and heart data are cleared. When it is filled for real later, it gets its own time and starts rest.
- Clearing and retyping within the same field still keeps the original commit (QA-R2b-1, test unchanged).

#### QA2-FC-5
- A muscle held back by today's soreness after the model's own time has no full-recovery time either (`fullInHours` is null). Today says "sore today" instead of "under 1h", the muscle sheet no longer adds "fully recovered in about under 1h", and Escobar's `get_recovery` marks it `soreToday`.

#### QA2-FC-6
- When a max-effort first set misses on the lightest load the equipment can make (the empty 20 kg or 45 lb bar), the live tip no longer says "Drop to 20 kg". It says to stay at the bar, rest a little longer and stop each set a rep short of max. Above the bar it still drops a step.

#### QA2-FC-7
- Equipment words (every word of the library's equipment names, singular and plural) no longer count as another movement when a longer name contains a library name. "Leg Press Machine", "Cable Lat Pulldown", "Hip Thrust Barbell" and the others map to their library exercises again. "Hack Squat Calf Raise" is still a different exercise.

#### QA2-FC-8
- The upper/lower balance note adds "A balanced week has about 1.5× as much upper body work as lower body work, since upper covers both push and pull." That way a "1.3×" lower-body lead reads as the lopsided week it is (`Imbalance.context`).

#### QA2-FC-9
- `reasonKeyFor` takes the suggestion's first set note. The "Change it up" plateau (a new rep range or a lighter week) gets the lighter-week ("reduce") cue again. The "keep this load" plateau keeps the repeatability ("confirm") cue from QA-R3b-8.

#### QA2-FD-2, QA2-FD-7, QA2-FD-9
- "Save for future" builds the split with `templateFromSession`, which keeps the person's own changes and leaves out Escobar's one-day ones:
  - An exercise only Escobar brought in today (an add, or a swap's target) is not saved.
  - One Escobar took out today stays at its place.
- A swap of an exercise to itself is refused by `propose_today` and is a no-op in `plannedExercises`. The QA-R4a-10 rule (a swap onto an exercise already present drops the source) had turned it into a removal.

#### QA2-FD-3
- A health check that fails again schedules the next one for when its back-off ends, so the Coach tab box recovers without reopening the sheet. It keeps checking only while Escobar is on, at most once a minute.

#### QA2-FD-6, QA2-FD-10
- An answer that arrives, and a dropped one, both clear `offlineReason`, so the offline notice no longer repeats an old "Escobar isn't set up yet." after a connection drop.

#### QA2-FD-4, QA2-FD-8, QA2-FD-11, QA2-FD-12
- **Health sharing off:** the replayed brief drops the whole driver group after "advice X". The brackets are matched, because the check-in driver has its own. No health driver survives and no stray ")" is left, which matches the live brief.
- **Body sharing off:** "weight 80.5 [f13] kg", as real briefs tag it, is removed too.
- **explain_method results:** the personal keys that `knowledge/methods.ts` drops live are scrubbed on replay, in `data` and `facts`: `restingHrBaseline`, `healthDaysLogged`, `zoneNFromBpm` for health; `restingKcalPerDay` for body.

#### QA2-FD-5
- Escobar's `recall` gives a memory's `since` as the phone's day, and Past conversations label rows with the local day (`dayKey`), matching the memory screen. The test fails without the fix under Asia/Manila (`npm run test:tz`).

#### QA2-FE-2, QA2-FE-7, QA2-FE-8
- A loaded carry's target snaps to the gym's equipment like a weighted lift: "70 lb · 45 m", not "31.751 kg · 45 m". Without equipment, the load is rounded to the half kilo.
- The distance/time branch is for carries and sleds only: a distance, or a time with no reps. Burpees, box jumps and wall balls logged with reps and seconds keep their rep goal ("16 reps").

#### QA2-FE-3, QA2-FE-4, QA2-FE-5
- `flagsForSet` (Escobar's `get_session`) uses `setUnitSuspect`, so a warm-up or drop set is never flagged as a kg/lb slip.
- Escobar's set output includes `kind`, and `get_sessions` counts working sets only.
- Escobar's `loadOf` uses the app's `kgToDisplay`, so 26.25 lb reads as 26.25 there too.

#### QA2-FE-1
- A day records `totalsSyncedAt`, the time its steps or active calories were last read. A later sync that failed them keeps it, and Escobar's `totalsAsOf` uses it. A full past-day total still needs the native "yesterday" read, which remains an owner decision (QA-R5a-4).
- Test updated, not loosened: the full-summary shape test now also expects `totalsSyncedAt`.

#### QA2-FE-6
- A sync that read only some data is marked `partial`. Settings titles its row "Last Health Connect sync was partial" instead of "failed", with the same Details.

#### QA2-F7-5, QA2-F7-6
- Fixed by the supervisor's W2 patch in round 2: each fallback attempt is priced by its own model, an attempt that declined before output is not billed, the price table is complete, and unknown ids get the dearest rates. Tests are in `tests/escobar/loop.test.ts`.

#### QA2-FA-5 follow-up: the Worker deploy failed (Cloudflare error 10021)
- The first FA-5 fix made the shard seed with `crypto.getRandomValues` at module load. Workers forbid random values in global scope, so "Deploy Escobar Worker" failed on the PR #7 merge and the upload was rejected. The Worker from PR #6 kept serving; nothing was down.
- Fix: the seed is made on first use (`instanceSeed()`). New test: loading the Worker (`src/index`) makes no random values, and the first shard choice makes exactly one. It fails on the old code.

## F12 — share cards

Built from the design study "M/ARC Share Sheet, round 3" (claude.ai artifact EY1LvnQv4mjiXwSgB4aHum), limited to what the handoff asked for: the Poster, Sticker (with the muscle body map) and Receipt styles; This workout, Week, Month, 3 months, Year and All time; Story 9:16 and Square 1:1; and Photo, Save and Share. The study's other three styles (Muscle map, Consistency, Progress) and its colour swatches were not asked for. The swatches were a demo of the five themes: the cards take the active theme's tokens instead.

### Where it opens
- **Finish screen:** "Share workout", above the Debrief. Shown only when the session has sets. Opens on This workout.
- **History → Log:** a share icon on every session card. Opens on that session. The sheet renders outside the card, so taps inside it don't fold the card.
- **History → Stats:** a share icon in the top bar, shown once there is a session. Opens on Week, with all six period chips. Here "This workout" is the newest session.

### Numbers (no new formulas)
- `src/slices/share/cardData.ts` is pure and tested. Sets and volume come from `workingTotals`: the working-set loop that `weekSummary` and `weeklyVolumeHistory` already ran, moved into one exported function. Both now call it, and their results are unchanged.
- Records come from `allRecords` in the person's unit, filtered to the period. The e1RM "strength" records come with them.
- Muscle sets come from `effectiveSetsByMuscle`. The receipt's top set and load come from `summarizeSets` and `setLoadIn`, so a load typed in lb reads exactly as typed.
- Time is the sum of `durationSec`. A session with no recorded time shows "—", not "0 m".
- Periods: Week is Monday to today, like `weekSummary`, and the tests check that the two agree. Month is from the 1st, 3 months from the 1st of the month two months back, and Year from 1 January, each to today. All time runs from the first session.
- Wording only: the poster's comparison line ("≈ 3 hippos") is not a training number. It divides the kg total by the weight of a real thing.
  - **Library:** `src/data/weights.ts` holds 34 things in 7 groups: gym kit, animals, a dinosaur, vehicles, space, landmarks and objects. Each weight is a published figure, with its source in `note`; living things use a typical adult.
  - **Gym kit follows the unit:** kg lifters see red 25 kg plates and 20 kg bars, lb lifters see 45 lb plates and bars.
  - **Readable counts only:** a thing qualifies when the total is at least 0.95 of it and the count is at most 200 (`MAX_COMPARE_COUNT`). So a light workout gets pandas or plates, and a big year gets whales, jets or the Statue of Liberty.
  - **No repeats (owner ask):** each card shuffles the qualifying things by its own period, dates and total. Saving or sharing a Poster records its thing in `marc.share.seen` on the device, and the next card picks one not shown yet. Only when every option has had a turn does the one shown longest ago come back. The card on screen keeps its line, so the preview doesn't change after sharing.

### Drawing and export
- `src/slices/share/cards.ts` draws each card as one standalone SVG on a 360-wide grid (360×640 story, 360×360 square).
  - The sheet shows it as an `<img>` from a blob URL.
  - Save and Share draw that same SVG onto a canvas at 3× and encode a PNG: 1080×1920 or 1080×1080. What you see is what you share.
- Theme tokens are resolved to plain colours in JS (`mix`, `alpha`), because an SVG drawn as an image has no access to the page's CSS variables.
  - The sticker's body map uses the app's `bodyMuscles` paths, lit by effective sets with the MuscleMap's shade rule, including its brachialis and rotator-cuff aliases.
  - Over a photo, and on the see-through sticker, text is white on a dark scrim or shadow.
- Fonts: SVG images can't use web fonts, so the cards use system fonts: the theme's font stack, a condensed family for the big numbers (Roboto Condensed on Android) and a monospace family for the receipt. If a condensed font is missing, a long big number is squeezed to fit.
- **No new dependency.** Canvas, SVG and Blob are built in, and `@capacitor/filesystem` and `@capacitor/share` were already installed.
- **Own chunk:** the sheet and card code (27 kB, 14 kB gzipped) load the first time Share is tapped (`src/slices/share/lazy.tsx`, like Escobar's sheet). The service worker pre-caches that chunk, so sharing works offline. Adding it to the main bundle would have grown it by 30 kB. The main bundle was already over Vite's 500 kB warning before F12 (522 kB on main, 526 kB now).

### Photo, Save, Share
- **Photo:** uses `src/native/photo.ts`. It now takes optional `maxDimension` and `targetChars`, and the defaults are unchanged, so Escobar's composer behaves as before. Cards ask for a 1920 px photo, since it fills a 1080×1920 image and never leaves the phone. Tap again to remove it.
- **Save:**
  - Android: `@capacitor/filesystem` writes the PNG to Documents/M-ARC.
  - Web: a download.
- **Share:**
  - Android: `@capacitor/share` with the file from the app cache.
  - Web: the Web Share API with the file where `navigator.canShare({ files })` allows it. Otherwise a download. Cancelling is not an error.
- The sheet has its own status line. The app toast would sit behind the open dialog.
- The chosen style is remembered per device (`marc.share.style`).

### Palace
- New entries: `train.share` (targets Start, like `train.finish`), `history.session-share` and `history.share`. The anchors test and the gate's goTo check cover them.

### Tests
- `tests/share-cards.test.ts`:
  - Every period in kg and in lb: range, sessions, sets, volume, time, records and muscle sets, each equal to the brain function's own result.
  - Week equals `weekSummary`.
  - One workout with a bench press typed as 135 lb: it reads "@135" in lb, it is a record, and its detail is "135 lb × 8".
  - Number wording, and that each style × size is a standalone SVG at export size with no CSS variables left.
  - The comparison library: unique ids, every thing reachable, counts from 1 to 200 in words, gym kit in the right unit, and no repeat until every option has had a turn. Names are escaped, and a long name is cut before its sets and load.
- **Gate:**
  - Screenshots of the sheet from a History session and from Stats, in all five themes: `<theme>-share-session.png`, `<theme>-share-stats.png`.
  - From the finish screen in silent-black: `silent-black-share-finish.png`. That walk is the only one that finishes a session.
  - Stats must open on Week.
  - All three cards must draw.
  - Save must download a PNG of exactly 1080×1920 and 1080×1080, over 5 kB.

### Risks and mitigations
- **Android 8–10 Save:** Documents needs a storage permission, or legacy storage on Android 10. Both are now declared (QA4-3). Save asks for the permission. If the write still fails, it opens the share sheet instead ("Choose where to save it"), so the card is never lost. Android 11+ writes directly. **Needs a check on a real device:** Save and Share on the APK (Android 11+, and one older phone if available).
- **Web Share on desktop browsers:** most cannot share files, so they fall back to a download, with a status line saying so.
- **Big photos:** limited to 1920 px and about 2.2 MB of JPEG before they enter the SVG. Each preview is a blob URL, revoked when it changes or the sheet closes.
- **System fonts differ by phone:** the layout keeps room for wider fallbacks, and the big number has a fit guard.

### QA round 4 on share cards (docs/qa/LIVE-QA-4.md, "Share cards", QA4-1 … QA4-15)
One commit per id. Each has a test that fails without its fix (unit tests in `tests/share-qa4.test.ts`, `tests/share-native.test.ts` and `tests/android-manifest.test.ts`, and gate checks for the layout).
- **QA4-1:** assisted exercises add sets but no volume, because their kg is the machine's help. `workingTotals` takes `custom`, and Stats (`weekSummary`, `weeklyVolumeHistory`) and the card pass it, so they stay equal. The receipt reads "3×10 @40 assist · 3 sets".
- **QA4-1b:** Escobar's `compare_periods` now uses `workingTotals`, so it agrees with Stats and the card. For an assisted lift, `lift_trend`'s volume is its reps, not kg. The card's top assisted set is the one with the least help, and a set with no help prints no load.
- **QA4-2:** carries, sleds and holds read "3×40 m @32" or "3×60s @20". A line with no volume is "BW" only when nothing was loaded; otherwise it is "—".
- **QA4-3:** `patch_manifest.py` declares WRITE/READ_EXTERNAL_STORAGE capped at API 29, and `requestLegacyExternalStorage` for Android 10. The new test runs the real script. This supersedes the "manifest off limits" note in the risks above: Android 8–10 Save now asks for the permission and writes to Documents, with the share-sheet fallback kept. The signing steps are untouched.
- **QA4-4:** the saved file name adds the local time to the second, and on a workout card the session id (`cardFileName`).
- **QA4-5:** the action bar is sticky and covers the panel's bottom padding and safe area. The status line floats above it. The gate checks 360×640 and 390×844 with 0, 24 and 48 px insets.
- **QA4-6:** "3×5 @80" only when every working set was the same. A ramp reads "3 sets, top 5@80".
- **QA4-7:** records carry `sessionId`, and a workout card shows only its own records.
- **QA4-8:** Share buttons need a working set (`hasWorkingSets`), and a 0-set card can't be saved. The set counts on the finish screen and in History are unchanged.
- **QA4-9:** with no loaded volume, the poster and sticker headline "sets done", and the receipt has no TOTAL LIFTED line.
- **QA4-10:** period time gets "+" when a session in the period has no duration.
- **QA4-11:** `Cache/MARC Share` is cleared before each new card is written.
- **QA4-12:** the PNG of the card on screen is drawn ahead of the tap (`share/png.ts`). A NotAllowedError keeps the card and says "Ready, tap Share again".
- **QA4-13:** a failed chunk load shows "Could not load sharing." with a Reload button.
- **QA4-14:** the carousel jumps instead of gliding under Reduce motion.
- **QA4-15:** the dots and the size toggle are 44 px tap targets, and the gate checks every sheet control.

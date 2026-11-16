## TRIAGE: audit P2s @ cd3c921

**Baseline.** `git diff 168e5ec cd3c921` changes only 7 docs/rules files. App, native, Worker and test code match the audited snapshot, so every cited line still applies on main. Repros run on main as a scratch vitest file (not committed): SCI-03 (chest `pct 100, ready true` with soreness 5), SCI-04 (pull-up 9 reps, plank 35 s, carry 25 m, all 3 sets, while bench drops to 2 sets), SCI-06 (`systemicFactor` = 1.1 for a falling RHR), SCI-07 (five readings 10 min apart give a max of 200), DATA-01 (`insightFeedback:{}` accepted as a non-array; `active.entries:[null]` makes `parseBackup` throw `TypeError`). I confirmed the other findings by reading the cited lines on main.
P1s (SEC-01, SEC-03, SCI-01, SCI-02) are skipped because AUD-1..3 already cover them. **Priority:** high = wrong or lost data, or a broken promise; med = a wrong result in edge cases; low = polish or portability.

| ID | verdict | impact | priority | owner decision? | card |
|---|---|---|---|---|---|
| DATA-01 | CONFIRMED (repro) | A restored backup with a bad list crashes Home on every launch, and a null entry crashes Restore. | high | no (validation only) | AUD-4 |
| DATA-02 | CONFIRMED (code) | After a reset or "Delete conversations", a second open tab writes the deleted data back. | high | no, if fixed without a new tombstone key; a new key needs owner approval | AUD-4 |
| REL-01 | CONFIRMED (code, sw.js:45-48) | When the host returns 5xx, the cached offline app is not served and the user sees the error page. | med | no | AUD-5 |
| SCI-03 | CONFIRMED (repro) | Soreness rated 5/5 still shows the muscle as 100 % and ready when it has no log or an old fresh mark. | high | no | AUD-6 |
| SCI-04 | CONFIRMED (repro) | On a red-readiness day the coach says ease off, yet pull-ups, assisted, holds and carries still go up with every set kept. | high | no | AUD-8 |
| SCI-05 | CONFIRMED (code, history.ts:67, prs.ts:125) | Assisted trends follow the easiest set, and an easier session can be celebrated as a rep record. | med | no | AUD-8 |
| SCI-06 | CONFIRMED (repro) | A lower resting HR slows recovery estimates by 10 %, as if it were a warning sign. | med | no | AUD-6 |
| SCI-07 | CONFIRMED (repro) | Scattered HR readings can set a false max HR, which skews zones and heart summaries. | med | no | AUD-7 |
| SCI-08 | CONFIRMED (code, progression.ts:349) | A substitute's first target treats the working weight as a 1RM, ignoring how many reps were done. | med | no | AUD-8 |
| SCI-09 | CONFIRMED (code, exposure.ts:10 vs :13) | The plan check counts secondary sets at 0.55 but the logged week counts them at 0.5, so a verdict can flip at a band edge. | med | no | AUD-9 |
| SCI-10 | CONFIRMED (evidence gap) | Calories show fixed ±25 % / ±10 % bands as if they were measured accuracy. | low | **yes** (visible claim) | owner decision |
| SCI-11 | CONFIRMED (evidence gap) | Recovery and readiness copy states causes and confidence that the model has not validated. | low | **yes** (visible claims) | owner decision |
| UI-01 | CONFIRMED (code, session.ts:526, Train.tsx:883) | "Skip today" after logging sets silently drops those sets at Finish. | high | no (the finish sheet already promises logged sets are saved) | AUD-10 |
| UI-02 | CONFIRMED (code, History.tsx:224-231 deps `[session.id]`) | Undo after a swipe-delete restores the session as it was before an edit. | high | no | AUD-11 |
| UI-03 | CONFIRMED (code, Train.tsx:1127-1135) | Past-session logging cannot enter seconds or metres for holds and carries. | med | no | AUD-10 |
| UI-04 | CONFIRMED (code, History.tsx:305-307) | The History editor cannot fix a carry's distance and hides its load when a time is set. | med | no | AUD-11 |
| UI-05 | CONFIRMED (code, session.ts:582-608) | The "When did you train?" fix accepts a future date. | high | no | AUD-10 |
| UI-06 | CONFIRMED (code, Train.tsx:658-659, units.ts:29,39) | kg/lb taps in a live workout can change another gym's settings. | high | no | AUD-10 |
| UI-07 | CONFIRMED (code, Body.tsx:370) | A muscle at 90-96 % shows "Full: Now" while the ready-times card shows hours left. | med | no | AUD-6 |
| UI-08 | CONFIRMED (code, Onboarding.tsx:77) | Onboarding shows Male as selected but saves no sex unless the user taps it. | high | no (Profile already shows unset) | AUD-12 |
| UI-09 | CONFIRMED (code) | Keyboard and switch users cannot pick a goal, add an exercise, pick a substitute or select a watch. | med | partly: new visible Move up/down controls for reorder need owner OK | AUD-12 (+ AUD-10 for Train.tsx:952) |
| UI-10 | CONFIRMED (code, ErrorBoundary.tsx:78; HoldButton uses the opposite test) | TalkBack users cannot use the crash-screen reset. | high | no | AUD-5 |
| UI-11 | CONFIRMED (code, progressTrend.ts, History.tsx:479,507) | Carry progress plots a flat load line, and holds read "kg × 0 reps". | med | no | AUD-11 |
| UI-12 | CONFIRMED (code, Coach.tsx:143 vs Train.tsx:598) | The insight's "Next session" target can be heavier than today's live target. | med | no | AUD-8 |
| NAT-01 | CONFIRMED (code, watch.ts:52-66, heart.ts:47-49) | A watch that goes silent stays LIVE, and old readings can end a heart-guided rest. | med | no | AUD-7 |
| NAT-02 | CONFIRMED (code, heart.ts:30-43 has no pause check) | Paused time adds heart samples, calories and zone minutes to the workout. | high | no, if samples are skipped while `pausedAt` is set; a saved pause list needs approval | AUD-7 |
| NAT-03 | CONFIRMED (code, health.ts:59) | A nap can replace the night's sleep, and yesterday's resting HR is saved again as today's. | high | no (`DailyHealth.restingHrAt` already exists in models.ts:366) | AUD-7 |
| DEV-01 | CONFIRMED (Coach.tsx/coach.ts, Profile.tsx/profile.ts, POSIX `TZ=` script) | Typecheck, build and tz tests fail unchanged on Windows; CI on Linux is fine. | low | **yes**: supervisor/owner decides whether Windows is supported (touches App.tsx and package.json) | none yet |
| OBS-ENDPOINT | CONFIRMED (code, escobarState.ts:78-80) | A crafted backup can switch on the coach, turn on sharing and point it at another server (http allowed). | med | **yes** (which settings are portable) | owner decision |
| OBS-PHOTOS | CONFIRMED (code, images.ts; only `clearImages` deletes from disk) | Photos from pruned conversations stay on disk with no limit. | low | no | AUD-4 |
| OBS-LB | CONFIRMED (code, migrate.ts:238 runs before :261) | Legacy lb sets show 224.9 lb instead of 225 lb. | low | no | AUD-4 |
| OBS-TONNE | CONFIRMED (code, EffortBars.tsx:50-52) | A 22,046 lb total shows as "22t". | low | no | AUD-11 |
| OBS-LABELS | CONFIRMED (code) | Several reps, time and select fields have no screen-reader name. | low | no | split: AUD-10 (Train), AUD-11 (History), AUD-8 (Coach.tsx:194), AUD-12 (Settings.tsx:178-179) |
| OBS-EFFORTLABEL | CONFIRMED (code, weeklyReview.ts:55-58, post.ts:43-46) | Restored "failure" sets without an effort are left out of the failure-share tips. | low | no | AUD-9 |
| OBS-THRESH | CONFIRMED (code, weeklyReview.ts:248 `> 0.5`, :347 `0.15`) | The weekly review uses fixed limits that disagree with the goal policies. | low | no (use the goal policies) | AUD-9 |
| OBS-DRIFT | CONFIRMED (code, effort.ts:12-25) | "Harder at the same load" can fire after a planned load increase. | low | no | AUD-9 |
| OBS-WEIGHT | CONFIRMED (code, weeklyReview.ts:113-117, 369) | Weigh-ins from months ago still drive a current weight-trend tip. | med | no | AUD-9 |
| OBS-KNOW | CONFIRMED (provenance gap) | knowledge.json cites titles only, with no DOI/PMID and no claim limits. | low | **yes** (content) | owner decision |

### Cards

**AUD-4: Restore, reset and coach-storage integrity.** Findings: DATA-01, DATA-02, OBS-PHOTOS, OBS-LB. Model: claude-opus-5-5.
- **write_scope:** `src/core/store.ts` (repair or validation and the `storage` listener; no new saved fields), `src/slices/settings/backup.ts`, `src/core/migrate.ts`, `src/escobar/store.ts`, `src/escobar/images.ts`, `src/escobar/session.ts` (`resetConversations` only), plus tests.
- **Acceptance tests:**
  - A backup with `insightFeedback:{}` or `profileHistory:{}` is repaired or rejected, and Home selectors plus the Escobar brief run on it.
  - `active.entries:[null]` returns the normal invalid-file error instead of throwing.
  - A `storage` event `{key:null}` followed by `flushSave()` does not bring back the old profile.
  - "Delete conversations" notifies the other tab, and that tab's next save keeps the store empty.
  - Pruning a conversation deletes its image IDs from IndexedDB.
  - A legacy lb import of 102 kg shows 225 lb.
- **Collisions:** #131 BUG-32 and AUD-2 (SEC-03) both edit `src/escobar/session.ts`; merge after them. The `profileHistory` crash is fixed at the repair boundary, not in `brief.ts`, so #132 is not touched.

**AUD-5: Offline and crash recovery paths.** Findings: REL-01, UI-10. Model: claude-sonnet-5.
- **write_scope:** `public/sw.js`, `src/app/ErrorBoundary.tsx`, `tests/pwa.test.ts`, `tests/error-boundary.test.ts`.
- **Acceptance tests:**
  - A navigation that gets a 503 or 500 with a cached index serves the index.
  - A rejected fetch still serves the index; with no cached index the 5xx passes through.
  - On the crash screen a `detail:0` click arms, and a second one confirms.
  - A `detail:1` click does not arm (pointer users hold), matching HoldButton.
- **Collisions:** #137 COPY-1 edits only text in ErrorBoundary.tsx, so expect a trivial merge.

**AUD-6: Recovery status correctness.** Findings: SCI-03, SCI-06, UI-07. Model: claude-opus-5-5.
- **write_scope:** `src/brain/recovery.ts` (`recoveryAt` early-return branch and `systemicFactor` only), `src/slices/body/Body.tsx` (MuscleDetail full text), plus tests.
- **Acceptance tests:**
  - With no history and soreness 5 on chest, chest is below READY_PCT and not ready.
  - A fresh mark older than today's soreness check-in does not override the soreness.
  - 21 days at 60 bpm then 7 at 50 bpm gives `systemicFactor` 1.0, while the mirror case (a rise) is still 1.1.
  - A muscle at `pct 90` with `fullInHours > 0` shows a time, not "Now".
- **Collisions:** AUD-3 (SCI-01) also edits `recovery.ts` (calibration); start after AUD-3 merges. #137 COPY-1 edits only text in Body.tsx.

**AUD-7: Heart and Health Connect inputs.** Findings: SCI-07, NAT-01, NAT-02, NAT-03. Model: claude-opus-5-5.
- **write_scope:** `src/brain/heart.ts` (`observedHrMaxFromSeries` and the drift run), `src/brain/energy.ts`, `src/slices/workout/heart.ts`, `src/native/watch.ts`, `src/native/health.ts`, `src/slices/settings/health.ts`, `native/HealthConnectNativePlugin.java`, plus tests. `native/wear/**` and `wearEngine.ts` are not touched.
- **Acceptance tests:**
  - The series `[[0,200],[600,201],…,[2400,200]]` gives `null`.
  - The same values 5 s apart, after a ramp, give 200.
  - After 120 s with no events, status leaves LIVE.
  - `recentLiveBpms` ignores samples from before the current rest.
  - The audit's pause script (09:00-10:00 with a 50-min pause) saves about 10 min of samples, energy and zones, not 60.
  - Night 23:00-06:00 plus a nap 14:00-14:30 gives the night's minutes.
  - The same resting-HR record synced on two mornings is not counted as a new day (use `restingHrAt`).
- **Collisions:** #137 COPY-1 edits only text in `src/native/watch.ts`. SCI-10 (energy bands) is held for an owner decision and is not in this card.

**AUD-8: Targets and records across modes.** Findings: SCI-04, SCI-05, SCI-08, UI-12. Model: claude-opus-5-5.
- **write_scope:** `src/brain/progression.ts`, `src/brain/substitute.ts`, `src/brain/trend.ts`, `src/brain/prs.ts`, `src/slices/coach/Coach.tsx` (:143 target context, :194 select label), plus tests. Leave `brain/history.ts` alone, because AUD-3 owns it: compute the least-assisted set inside trend.ts.
- **Acceptance tests:**
  - With context `{loadAdvice:'reduce', recoveryPct:10}`, pull-up, assisted, plank and carry targets do not go up and drop a set, as bench does.
  - Assisted 40→26 kg (hard set) with back-offs 50→64 kg trends upward.
  - 20 kg assist × 8 then 60 kg assist × 9 gives no `best_reps`.
  - 60 kg × 3 and 60 kg × 10 bench give different dumbbell substitute targets, chosen from `menu.rungsKg`.
  - The Coach insight target equals the live target for the same day's context.
- **Collisions:** #137 COPY-1 edits only text in Coach.tsx. AUD-3 may touch progression inputs; merge `main` after it.

**AUD-9: Weekly review and plan volume rules.** Findings: SCI-09, OBS-EFFORTLABEL, OBS-THRESH, OBS-DRIFT, OBS-WEIGHT. Model: claude-opus-5-5.
- **write_scope:** `src/brain/plan.ts`, `src/brain/coach/weeklyReview.ts`, `src/brain/coach/post.ts`, `src/brain/effort.ts`, `src/brain/coach/rules.ts` (effort-drift rule only), plus tests.
- **Acceptance tests:**
  - 3 × 6 bench sets give the same triceps and front-delt sets in the plan and in the logged week.
  - A 12-set week of `kind:'failure'` sets with no effort gives failureShare > 0.
  - The weekly failure and rep-mix limits come from the goal policy.
  - Effort drift with a rising load reports neither "harder at the same load" nor "stable".
  - A weight log whose last entry is more than 28 days before today gives no trend tip.
- **Collisions:** none with the open PRs.

**AUD-10: Live workout, finish and past logging.** Findings: UI-01, UI-03, UI-05, UI-06, plus the Train.tsx parts of UI-09 and OBS-LABELS. Model: claude-opus-5-5.
- **write_scope:** `src/slices/workout/session.ts`, `src/slices/workout/Train.tsx`, `src/slices/workout/units.ts`, plus tests.
- **Acceptance tests:**
  - Commit 60 × 8, Skip today, Finish: the set is saved, and the finish counters match the saved session.
  - `resolveSessionTiming` with a future start returns false and the sheet stays open.
  - With gym B made active during gym A's session, a kg→lb flip changes A, not B.
  - A past session's plank saves `durationSec:60` and a carry saves `distanceM`.
  - The substitute list (:952) is reachable by keyboard, and the live reps and hold inputs have accessible names.
- **Collisions:** #137 COPY-1 edits Train.tsx heavily (text only); merge it first.

**AUD-11: History editing and stats.** Findings: UI-02, UI-04, UI-11, OBS-TONNE, plus the History.tsx part of OBS-LABELS. Model: claude-sonnet-5.
- **write_scope:** `src/slices/history/History.tsx`, `src/slices/history/progressTrend.ts`, `src/brain/bodyweight.ts` (stat readout), `src/ui/EffortBars.tsx`, plus tests.
- **Acceptance tests:**
  - Edit 60→65, Save, swipe-delete, Undo: the session comes back with 65.
  - A carry with 32 kg, 40 m and 35 s shows and edits all three, and deleting it uses an explicit action.
  - Four carries of 20/40/60/80 m give a rising distance trend.
  - A hold's readout shows seconds.
  - A total of 22,046 lb does not render as "t".
- **Collisions:** #137 COPY-1 edits History.tsx, progressTrend.ts and bodyweight.ts (text only); merge it first.

**AUD-12: Onboarding and keyboard access.** Findings: UI-08, UI-09 (outside Train.tsx), plus the Settings part of OBS-LABELS. Model: claude-sonnet-5.
- **write_scope:** `src/slices/profile/Onboarding.tsx`, `src/ui/primitives.tsx` (`Card` with `onClick` becomes role=button, focusable, Enter/Space), `src/slices/workout/ExercisePicker.tsx`, `src/slices/settings/Settings.tsx` (reminder time and style labels only), plus a gate probe in `scripts/screenshot-gate.mjs` (add-only block). `Watch.tsx` and `Coach.tsx` are covered through `Card` without editing them.
- **Acceptance tests:**
  - Fresh onboarding saved untouched leaves sex unset and shows no segment selected.
  - A gate probe tabs to a GoalSheet choice and an Add-exercise result and activates each with Enter.
- **Owner OK still needed:** visible Move up/down controls for reorder. They are not included until the owner approves.
- **Collisions:** #137 COPY-1 edits Onboarding.tsx, Settings.tsx and ExercisePicker.tsx (text only). Settings.tsx's Watch-lab row is owned by the watch agent; do not touch it.

**Merge order and overlaps.** AUD-6 and AUD-8 wait for AUD-3. AUD-4 waits for AUD-2 and #131. AUD-10, AUD-11 and AUD-12 merge `main` after #137. No two cards share a write path.

**Owner decisions with no card yet:**
- SCI-10, SCI-11 and OBS-KNOW: which claims and bands to show. They touch AUD-3/6/7/9 files, so sequence them after those cards.
- OBS-ENDPOINT: should the proxy URL, coach-on and sharing flags be restored from a backup?
- DEV-01: is Windows a supported dev platform?
- UI-09: reorder Move controls.

### Not reproduced / design
- **SEC-02: DESIGN.** docs/PRIVACY-POLICY.md:30 (still on main) says words already in the conversation keep being sent after sharing is turned off.
- **OBS-DEPLOY (workflow_dispatch has no branch guard): DESIGN.** deploy-worker.yml:6 documents "from main only, or on demand (plan D14)", and only people with write access can dispatch it. An optional `github.ref` guard is the supervisor's call (`.github` is add-only), and any change to the Worker deploy is the owner's.
- **OBS-SCRUB (error message scrubbing): NOT REPRODUCED.** The audit itself found no flow that leaks unquoted personal text, and app messages are fixed strings.
- **OBS-STALE (`resolveSessionTiming` does not rebuild the recovery model): NOT REPRODUCED.** No fixture showed a changed model, and the audit says so too.
- **OBS-HOWTO (8 of 153 guides shipped): DESIGN.** This is the HT rollout state, not a defect.
- **OBS-BODYFAT ("within 3 to 4 points" line): FIXED in open PR #137** (COPY-1 removes the line). Not on main yet.

---
_Generated by [Claude Code](https://claude.ai/code)_
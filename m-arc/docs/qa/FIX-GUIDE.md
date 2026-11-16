# Fix guide: verified patches for the round-2 high and medium items

Written by the supervisor (Claude) for the remediation agent. Each patch was made in a clean worktree at **3a65b2f**. Every fix has a test that **failed before and passes after**, and the full suites were green: vitest 844–852 tests, the Worker check 88 tests, and tsc clean with the branch's own `npm ci`. An independent reviewer then applied each patch to a fresh worktree and tried to break it. All five patches apply together, in the order below, with `git apply --3way`.

## How to apply

```sh
git fetch origin claude/marc-regression-architecture-gegkbq
for p in W1 B C D W2; do git show origin/claude/marc-regression-architecture-gegkbq:docs/qa/fixes/$p.patch | git apply --3way --index || break; done
# then make the REQUIRED FOLLOW-UP changes below (the reviewer rejected 4 fixes as incomplete), run npm run check + escobar-worker check, commit per group with the QA2 ids
```

If your branch has moved (F6), resolve any `--3way` conflicts by keeping both sides. D and W2 both touch `src/escobar/loop.ts`.


## W1 — Worker spend accounting (thinking tokens on cut-short steps) and F7 Worker model validation  (patch `docs/qa/fixes/W1.patch`)

### QA2-FA-1, QA2-FA-2, QA2-FA-3, QA2-FA-4 — fixed

**Root cause.** When a step is cut short (hang-up, idle timeout or mid-stream error) the API never reports its usage. handler.ts then estimated billed output as ceil(outChars/3), and outChars counts only the text and tool input that pass through emit. Thinking never passes through emit: runStep sends one {t:'thinking'} marker and drops thinking_delta. On the production models, thinking.display defaults to "omitted", so the API streams each thinking block as a single empty thinking_delta plus a signature. Counting thinking characters would therefore still record 0 in production, and the stream carries no running token count. Separately, billed() only treated text or tool output as 'output started' (emittedAny), so an API error after a thinking-only phase was not counted at all (QA2-FA-3a). Still true at 3a65b2f: re-run, the edge path recorded out:6, the relay path out:6, a hang-up during thinking out:0, and a thinking-only error left no row.

**Change (in the patch).**

escobar-worker/src/handler.ts:
1. New exported constant CUT_SHORT_TOKENS_PER_SEC = 200, with a comment on why it exists. The rate is set above the output speed of any model a mode can use, so the estimate cannot fall below the real bill.
2. The step() wrapper in handle() records stepStart = deps.now() for each step. On the systemRole retry the clock restarts.
3. emit() sets a new modelOutput flag on the first 'thinking', 'text' or 'tool' event. The relay forwards these events too, so the flag works on both the edge and relay paths.
4. Recording condition changes from billed(res) to billed(res) || modelOutput, so an API error after thinking is counted (QA2-FA-3a). An error before any output is still not counted.
5. New estimate for a cut-short step: min(params.max_tokens, max(ceil(outChars/3), ceil(ranSec * CUT_SHORT_TOKENS_PER_SEC))), where ranSec = (deps.now() - stepStart)/1000. Finished steps and refusals still use the API's usage.
The time is measured at the edge, so the relay protocol does not change. README documents the charge.
Not changed: the KV fallback's missing IP steps cap from QA2-FA-1. The skeptic showed it does not affect users: KV is commented out, QUOTA_DO is bound, and the code never falls back to KV while the DO is bound.

**Test.** escobar-worker/test/quota.test.ts, describe 'thinking the caller never sees is counted when a step is cut short (QA2-FA-1..4)': 'a hang-up right after the answer starts counts the minute of hidden thinking, so the output cap trips' (edge; MAX_OUTPUT_PER_DEVICE=1000, statuses 200 then 429); 'the same through the US relay' (real UpstreamRelay); 'a hang-up while the model is still thinking is counted by how long it thought'; "the estimate never passes the step's max_tokens" (live mode, 4000); 'an API error after a thinking-only phase is counted too (QA2-FA-3)'. Each mock stream emits an empty thinking_delta, as the API does with display omitted, and advances an injected clock. Before the fix the rows were out:6 (edge), out:6 (relay), out:0 and undefined; after the fix they are 60*rate, 60*rate, 45*rate, 4000 and 30*rate. Repeated 8 times with no flakes. (failed before: True, passes after: True)

**Notes.** Only a live API run can check whether 200 tok/s stays above real output speed. I chose a time-based estimate rather than counting thinking characters because the default display 'omitted' streams no thinking text (platform.claude.com thinking docs: 'no thinking text is streamed. Each thinking block streams a thinking_delta with an empty thinking string, then its signature_delta'). Tuning note for the owner: a legitimate cancel is charged about 200 tokens per second of running time, capped at max_tokens (chat 16k, plan 32k, live 4k). This over-counts a normal cancel by roughly 2-4x, compared with never counting thinking before. One alternative I did not use: the SDK lists a beta 'thinking-token-count-2026-05-13' that adds a running estimated_tokens to omitted thinking deltas. Its support per model is not documented, so sending it on every request risks a 400 on all turns.

### QA2-F7-3 — fixed — ⚠ REVIEW: INCOMPLETE, apply the follow-up

**Root cause.** At 3a65b2f, modelFor (anthropic.ts:93-98) accepted any override matching /^claude-[a-z0-9.-]{2,60}$/, so a typo like 'claude-sonet-5' or 'claude-haiku-4-5' passed. buildParams always sends thinking {type:'adaptive'} and output_config.effort. Per the extended-thinking docs, Haiku 4.5 returns 400 on type adaptive, and an unknown id gets a 404. mapError turns both into 'The request was not accepted.' on every turn in that mode. /health showed the unusable model, and the deploy check did not look at models.

**Change (in the patch).**

escobar-worker/src/anthropic.ts:
- Replaced the MODEL_ID regex with an allowlist, MODE_MODELS. It holds the current models that take adaptive thinking and effort from low to max: claude-opus-5-5, claude-opus-5, claude-opus-4-8, claude-opus-4-7, claude-sonnet-5, claude-fable-5-1, claude-fable-5, claude-mythos-5-1, claude-mythos-5. A dated snapshot of one of them (alias-YYYYMMDD) is also accepted.
- modelFor uses MODEL_<MODE> only when it is in that set. Otherwise that mode keeps MODEL, so turns keep working.
- New export ignoredModelOverrides(env) returns the modes whose override is set but ignored.

escobar-worker/src/handler.ts: /health adds ignoredModels, listing mode names only so a mis-pasted secret is never echoed.

.github/workflows/deploy-worker.yml: the post-deploy health check also requires '"ignoredModels":[]', so a bad override turns the deploy red.

wrangler.toml and README document the rule. An empty-string override counts as unset. MODEL itself is still unvalidated (D12: leave MODEL unchanged).

**Test.** escobar-worker/test/anthropic.test.ts: 'QA2-F7-3: an override the Worker cannot drive (a typo, Haiku 4.5) is ignored, so that mode keeps MODEL'. Before the fix it failed with "expected 'claude-haiku-4-5' to be 'claude-opus-5'". escobar-worker/test/handler.test.ts: 'health names the modes whose model override was ignored (QA2-F7-3), without echoing the value'. The existing 'health answers protocol 2' toEqual now also expects ignoredModels: []; the assertion is extended, not loosened. I checked the workflow grep by hand: it accepts '[]' and rejects '["live"]'. (failed before: True, passes after: True)

**Notes.** The allowlist is a small product trade-off: a model released later needs one line added to MODE_MODELS before a mode can use it. Until then it is ignored, and /health plus the deploy check flag it. Not verified, and outside this item: whether server-side fallbacks:'default' (beta server-side-fallback-2026-07-01, sent on every request) is accepted on the non-Opus-5 and non-Fable entries. The docs name only claude-opus-4-8 and claude-opus-5 as fallback targets. The owner should run one live smoke turn per mode after switching models, for example the recommended MODEL_BRIEF=claude-sonnet-5.

### ⚠ REQUIRED FOLLOW-UP for QA2-F7-3

**Reviewer found.** The allowlist still lets in a well-formed model id that cannot work, which is the root cause of this item. usableOverride strips any -\d{8} suffix before the lookup: MODE_MODELS.has(v.replace(/-\d{8}$/, '')). None of the allowlisted models has a dated snapshot id. The claude-api model table lists the Full ID as '-' for opus-5-5, opus-5, opus-4-8, opus-4-7, sonnet-5, fable-5/5-1 and mythos-5/5-1, and says 'never append date suffixes'. So every dated id this accepts gets a 404. I ran a probe against the patched code: MODEL_LIVE='claude-sonnet-5-20260101' and MODEL_LIVE='claude-opus-5-19990101' are both returned by modelFor('live'), and ignoredModelOverrides gives []. /health then reports ignoredModels:[], the new deploy grep passes, and every live turn fails with 'The request was not accepted.' That is exactly the failure QA2-F7-3 describes. The input is plausible: Haiku 4.5 does have a dated id (claude-haiku-4-5-20251001), REMEDIATION-PROGRESS says the app prices 'dated ids' by their alias, and an owner could append a date the same way. A dated id also misses the exact-match PRESERVED_THINKING and SYSTEM_MESSAGE_MODELS sets. For example, 'claude-opus-5-5-2026xxxx' would be sent without the thinking-binding beta. The new test makes this worse: it asserts that the made-up 'claude-opus-5-5-20261001' is usable. The rest of the fix is solid. Reverting modelFor to the old regex makes both new tests fail ('expected claude-haiku-4-5 to be claude-opus-5' and 'expected [] to deeply equal [live]'). /health echoes only mode names. The existing health toEqual was extended, not loosened.

**Do this on top of the patch.** escobar-worker/src/anthropic.ts: accept exact ids only, with `const usableOverride = (v: string): boolean => MODE_MODELS.has(v);`. Remove the sentence 'A dated snapshot of one of these (claude-opus-5-20260901) is accepted.' from the MODE_MODELS comment and write instead that these ids have no dated snapshots, so a date suffix is ignored like any other unknown id. escobar-worker/test/anthropic.test.ts, in the QA2-F7-3 test: change `expect(modelFor('chat', env)).toBe('claude-opus-5-5-20261001')` to `.toBe('claude-opus-5')`, and change `expect(ignoredModelOverrides(env)).toEqual(['plan', 'live'])` to `.toEqual(['chat', 'plan', 'live'])`. Rename the test to include 'a dated id'. Keep the ' claude-opus-5-5 ' trimmed case, which is in the existing F7 test. README, wrangler.toml, handler /health and deploy-worker.yml stay as they are.


## B — Reset from the error screen; notification permission paths; backup reminder  (patch `docs/qa/fixes/B.patch`)

### QA2-FB-1, QA-R1-8 — fixed

**Root cause.** The error card's 'Reset app data' (src/app/ErrorBoundary.tsx, confirmReset -> resetAppData -> location.reload) clears localStorage while the app store is still set to save. On unload, main.tsx's pagehide and visibilitychange('hidden') handlers call flushSave -> persistNow. persistNow (store.ts) writes the in-memory crashing state back to marc.state.v1 with no check. Because the wipe also removed the backup-day key and the saved raw differs from lastGoodRaw, it also rewrites marc.state.v1.backup and backupDay. A persistSoon timer still pending at reset time does the same. The crashing workout data comes back, but the chats and photos are gone. The problem is still present at 3a65b2f: resetAppData only calls storage.clear() plus the IndexedDB wipe.

**Change (in the patch).**

src/core/store.ts: new export stopSaving(). It clears the pending saveTimer and sets storageRef = null, so any later persistNow/flushSave/persistSoon returns early (the existing `if (!storageRef) return false` guard) without writing and without setting saveError.
src/app/ErrorBoundary.tsx: import stopSaving from '@/core/store'. resetAppData() calls stopSaving() first, before storage.clear() and the IndexedDB wipe. The doc comment now says saving stops first so the unload save cannot write the crashing state back.
Nothing else changes. main.tsx listeners, persistNow and the index.html crash screen are untouched. Keeping the ErrorBoundary wipe identical to the index.html one (every key plus the photo DB) is unchanged.

**Test.** tests/error-boundary.test.ts > 'the error card (QA-R1-8)' > 'QA2-FB-1: the save on unload does not write the crashing state back after the reset'. It uses an in-memory Storage: initStore with a saved state, then update() to leave a pending save, then resetAppData(st, undefined), then advance fake timers 1 s, then flushSave() to stand for pagehide. It expects STATE_KEY, BACKUP_KEY and BACKUP_DAY_KEY to be null and storage length 0. Before the fix it failed: marc.state.v1 held the 'crash again' state. (failed before: True, passes after: True)

**Notes.** Residual, not in scope and left unchanged. (1) The index.html start-up crash screen reset has the same shape, but it only shows before __marcBooted. At that point main.tsx has not yet registered the pagehide/visibilitychange flushSave listeners, except for a synchronous throw late in main.tsx's try block, which is very unlikely. If the owner wants that closed too, main.tsx could expose stopSaving on globalThis for the index.html handler. (2) If an Escobar turn is streaming when the error card shows, the visibilitychange abort could still save that one conversation to marc.escobar.v1 after the wipe. That is harmless: it is not the crashing workout state.

### QA2-FB-2 — fixed

**Root cause.** The propose_reminder applier (src/escobar/apply.ts) called syncReminders(), which is resyncReminders() with no options. The launch/resume no-prompt policy from QA-R2a-2 / QA-R6-13 (commit 276d686) made prompt default to false. As a result, ensurePermission (native/notifications.ts) only checks. When Android has not granted notifications yet, the result is 'On, but Android has not allowed notifications yet.' and 0 schedule calls, while the card says 'Reminders updated'. Tapping Apply is the person's own explicit action, the same as the Settings reminder toggle, which passes { prompt: true }. The problem is still present at 3a65b2f (apply.ts:184).

**Change (in the patch).**

src/escobar/apply.ts, APPLIERS.propose_reminder: replace `syncReminders();` after the update() with `void resyncReminders({ prompt: true });`, plus a one-line comment (QA2-FB-2: Apply is the person's own tap, like the Settings reminder toggle, so it may ask for notification permission).
Unchanged on purpose: the Undo inverse of propose_reminder still calls syncReminders() (no prompt), because undo restores the earlier setting and does not ask for reminders. propose_programme and propose_schedule keep calling syncReminders() without a prompt, since the resyncReminders doc says schedule edits never ask.
When reminders are turned off, syncTrainingReminders returns 'Off' before ensurePermission, so prompt: true never asks in that case.

**Test.** tests/escobar/apply-reminders.test.ts (new file; @capacitor/local-notifications mocked via vi.hoisted with checkPermissions 'prompt' and requestPermissions 'granted'; getPending mirrors what was scheduled; isNative mocked true) > 'reminders turned on through Escobar (QA2-FB-2)' > 'Apply is the person's tap: it asks for notification permission and schedules the reminders'. It runs decide(propose_reminder {enabled:true,time:'23:59'}, 'apply') and expects: applied with 'Reminders updated'; reminders.enabled true; reminderHealth.queued > 0; requestPermissions called once; schedule called once; reminderHealth.ok true. Before the fix it failed (queued stayed 0, no permission request). After the fix it passes. It was also run under TZ America/New_York, Asia/Manila and Pacific/Kiritimati. (failed before: True, passes after: True)

**Notes.** The existing QA-R2a-2 test in tests/notifications.test.ts still passes: launch and resume never ask.


## C — Coach numbers: assisted/bodyweight trends, plateau windows  (patch `docs/qa/fixes/C.patch`)

### QA2-FC-4 — fixed

**Root cause.** Still present at 3a65b2f. For assisted lifts, liftTrend (src/brain/trend.ts:46-49) took the trend of bestE1rm || topKg and flipped it. The e1RM of the assistance load goes up with more reps, so more reps at the same assistance was flipped to 'down'. That contradicts plateauStatus ('progressing') and liftTrend's own doc comment, which says the trend follows the assistance load. get_exercise_history (read.ts:189) and summarize('lift_trend') (show.ts:71) passed the wrong direction on, and the chip showed 'Dipping'.

**Change (in the patch).**

src/brain/trend.ts, liftTrend(): in the 'assisted' branch, stop using bestE1rm. Build help = trend(recent.map(h => topKg)).
- If help.direction is 'up' or 'down', return help with the direction inverted and slopePerWeek negated: less assistance is up.
- Otherwise, when the assistance is flat or unknown, return the trend of bestReps, the same tie-break plateauStatus uses. If reps is 'unknown' while help is 'flat', return help, so the result stays 'flat' (as plateauStatus says 'plateaued').
- Weighted, bodyweight and duration branches are unchanged. The doc comment now says: 'with it flat, the best reps, as in plateauStatus'.
- No caller changes: read.ts and show.ts already pass the mode.

**Test.** tests/trend.test.ts, describe 'liftTrend for assisted work (QA2-FC-4)':
- 'more reps at the same assistance is up, as plateauStatus says': 20 kg, reps 3,3,4,4,5,5,6,6 gives 'up'; falling reps gives 'down'. Failed before with 'down' vs 'up'.
- Guards (passed before and after): 'less assistance is up and more is down, whatever the reps do' and 'same assistance and same reps is flat'.
tests/escobar/read.test.ts: 'assisted lifts in Escobar (QA-R3a-2) > more reps at the same assistance reads as up, not down (QA2-FC-4)'. End to end, getExerciseHistory trend.direction and summarize('lift_trend').trend are 'up'. Failed before with 'down' vs 'up'. (failed before: True, passes after: True)

**Notes.** Not changed here: the lift_trend chart points for assisted lifts (show.ts, metric e1rm = bestE1rm || topKg of the assistance) are drawn as logged, so the line falls as the person needs less help while the chip now says 'Rising'. This was not in the reported items.

### QA2-FC-1 — fixed — ⚠ REVIEW: INCOMPLETE, apply the follow-up

**Root cause.** Still present at 3a65b2f. The History > Stats > Exercise progress card built its own trend, trend(hist.map(h => bestE1rm || volume)) at src/slices/history/History.tsx:215, and ignored the lift's mode. With assistance going 40 to 12 kg it gave 'down', shown as 'Slipping' (History.tsx:246). Hold lifts such as the plank have e1RM 0 and volume 0, so they always showed 'Early'.

**Change (in the patch).**

New pure helper src/slices/history/progressTrend.ts, following the volumeChart.ts pattern: progressTrend(hist, mode).
- Assisted, bodyweight and duration lifts use liftTrend(hist, mode), the same measure Escobar reports for this card.
- Weighted (and conditioning) lifts keep the card's existing expression, trend(bestE1rm || volume), unchanged. I did not switch weighted to liftTrend (bestE1rm || topKg): for high-rep accessories (sets over 10 reps have no e1RM) that would turn 'Improving' into 'Steady' when reps rise at the same load.
- History.tsx: the `trend` import is replaced by `progressTrend`, `modeOf` comes from '@/brain/history', and line 215 is now `const t = progressTrend(hist, modeOf(exercise, s.customExercises));`.
- The label and tone mapping is unchanged. modeOf('') safely returns 'weighted' when no exercise exists (checked).

**Test.** tests/progress-trend.test.ts, describe 'the Exercise progress card trend follows the lift mode (QA2-FC-1)':
- 'an assisted lift needing less help is improving, not slipping': 40 to 12 kg over 8 weekly sessions gives 'up'; rising assistance gives 'down'.
- 'a hold getting longer is improving, not early': plank 30 to 100 s gives 'up'.
- Guard: 'weighted lifts keep the strength score, and volume for sets over 10 reps'.
How the failure was shown: I first moved the card's original expression unchanged into the helper and wired History to it. Against that, the assisted test failed ('down' vs 'up') and the plank test failed ('unknown' vs 'up'). Then I applied the fix. (failed before: True, passes after: True)

**Notes.** Owner decision on weighted lifts. I left them unchanged on purpose, because moving them to liftTrend would lose rep progress on sets over 10 reps. Options: (a) as done, weighted unchanged; (b) weighted to liftTrend as well, for full agreement with Escobar. I recommend (a).
Two things still differ between the card and the new trend, both out of scope:
- The card hint 'Trend uses an estimated one-rep strength score from sets of 10 reps or fewer' does not describe the assisted, bodyweight or hold trend.
- The Sparkline still draws bestE1rm || topKg || bestReps, so for assisted lifts the line falls as the lift improves.

### QA2-FC-2, QA2-FC-3 — fixed

**Root cause.** One root cause, still present at 3a65b2f. The progress.plateau-lever rule (src/brain/coach/rules.ts:342) took every session from the last 56 days and never called sinceLastBreak, unlike plateauStatus (trend.ts:75). Sessions from before a break of more than 28 days therefore counted:
- FC-2: 4 sessions, a 40-day break, then 3 sessions reached the 6-session bar.
- FC-3: one stray session 31 days before two weeks of training stretched the first-to-last span past PLATEAU_MIN_SPAN_DAYS (42).

**Change (in the patch).**

src/brain/coach/rules.ts:
- Import sinceLastBreak from '../trend'.
- In progress.plateau-lever: `const recent = sinceLastBreak(hist).filter(h => daysBetween(h.day, ctx.today) <= 56);`, with the comment 'QA2-FC-2/3: like plateauStatus, only the sessions since the last long break count.'
The 6-session check, the 42-day span check, flatOver and the lever choice are unchanged. The other data the rule uses cannot reach back past the break once the post-break sessions pass the 6-session, 42-day bar:
- recentSessions, the last 6 sessions with the lift;
- isStale, a 42-day window;
- weekSets, last completed week.

**Test.** tests/coach.test.ts, describe 'plateau needs time and ignores the time before a break (QA-R3a-6, QA-R3a-7)':
- 'the plateau lever is not judged on sessions from before a five-week break (QA2-FC-2)': the exact QA run (Jul 29-Aug 5, then Sep 14-18, today Sep 19) now gives no lever. A positive control checks that 8 flat weeks after an older break still fire the lever.
- 'one stray session a month before two weeks of training does not make a plateau (QA2-FC-3)': Aug 7, then Sep 7-18 rising 0.25 kg per session, with 1 and with 3 sets. No lever.
Both failed before (lever fired: expected false, got true). The existing test 'progress.plateau-lever > fires with a volume lever...' still passes. (failed before: True, passes after: True)

**Notes.** Remaining edge, by design of COMEBACK_GAP_DAYS = 28: a stray session 22 to 28 days before about two weeks of training is not a break, so it can still stretch the span to 42 days or more. Closing it would need a 'sessions in at least N distinct weeks' rule, which is a product decision. The spec comment says 'span six of the eight weeks'. I did not change this.

### ⚠ REQUIRED FOLLOW-UP for QA2-FC-2

**Reviewer found.** The plateau-lever change is correct, but another call site has the same root cause and gives the same kind of advice from sessions before the break. The per-exercise loop in weeklyReviewInsights (src/brain/coach/weeklyReview.ts:239-243) runs e1rmTrend over the whole exerciseHistory without sinceLastBreak, and one comeback session is enough for isActive to pass. Probes at the patched head:
(1) The exact FC-2 run: bench 100x5x3 on Jul 29, Jul 31, Aug 3 and Aug 5, then Sep 14, 16 and 18, today Sep 19. weeklyReviewInsights returns weekly:e1rm 'Bench: flat / Bench has not moved in recent sessions / Add a set, add load, or change the rep range for two weeks'. Escobar getInsights (read.ts:298) returns this weeklyReview on every call, and the Coach weekly-review sheet uses the same function.
(2) QA-R3a-6's own months-away run: declining Jan 5 to Feb 23, one session on Sep 21, today Sep 23. It returns 'Bench: flat' and 'Squat: flat' with 'The stimulus has stopped changing'.
(3) Someone rebuilding after the break: 6 sessions at 100 kg from Jul 27 to Aug 7, then 10 sessions from Sep 14 to 25 rising 85 to 94 kg, today Sep 26. It returns 'Bench: falling, trending down at about 1.4% a week. Worth a lighter week before pushing again. Ease off max effort for a week' while the lift is climbing.
The doc comment on COMEBACK_GAP_DAYS says a break starts the history over 'for plateau and trend'.
Not blocking, noted for FC-3: a stray session 21 to 28 days earlier is not a break under the 28-day rule. It can still stretch 3 to 4 weeks of flat or slowly rising training (+0.15 kg a session) past the 42-day span, and the lever then fires. That follows the app's COMEBACK_GAP_DAYS policy, so I approved FC-3. Separately, weekly:e1rm has no minimum span, so 7 sessions over 2 weeks rising 0.25 kg a session read 'Bench: flat / Add a set'. That is a separate follow-up against the e1RM-trend spec row (at least 4 points over at least 4 weeks).

**Do this on top of the patch.** Keep the rules.ts change and its tests. Also, in src/brain/coach/weeklyReview.ts, change the import to `import { sinceLastBreak, trend } from '../trend';`. In weeklyReviewInsights' per-exercise loop, use `const hist = sinceLastBreak(exerciseHistory(sessions, id, custom));`, with the comment 'QA2-FC-2: a comeback is judged only on the sessions since the break, as in plateauStatus'. This also covers the pace note (hist.length >= 6) and isStale in that loop. isActive is unaffected, because the last session is always kept.
Add tests in tests/weeklyReview.test.ts:
(a) The FC-2 sessions with today 2026-09-19 give no weekly:e1rm for bench.
(b) 6 sessions at 100x5x3 from Jul 27 to Aug 7, then 10 sessions from Sep 14 to 25 at (85+i)x5x3, today Sep 26: the weekly:e1rm title is 'Bench: rising' (it is 'Bench: falling' now).
I checked this one-line change: probes (1) and (2) return [], probe (3) returns 'Bench: rising', and the full vitest suite passes.

### ⚠ REQUIRED FOLLOW-UP for QA2-FC-1

**Reviewer found.** The trend label is fixed, but the same card still draws the lift without its mode, and after the patch it contradicts itself for exactly the lifts the fix targets. The Sparkline just above the tile plots hist.slice(-12).map(h => h.bestE1rm || h.topKg || h.bestReps) (History.tsx:241). For an assisted lift that is the e1RM of the assistance.
- Fix's own scenario (assistance 40 to 12 kg): the card now shows a green 'Improving' next to a line that falls the whole way.
- Plank: 'Improving' next to a flat line at 0.
- The hint below still says 'Trend uses an estimated one-rep strength score from sets of 10 reps or fewer'. That is false for the assisted, bodyweight and duration modes that are now sent to liftTrend.
Before the patch the line and the label at least agreed. The bodyweight switch from volume to best reps matches Escobar's liftTrend and the best-reps PRs, so that part is fine.

**Do this on top of the patch.** Keep progressTrend and the History wiring.
- In src/slices/history/progressTrend.ts, also export progressValue(h, mode): assisted gives -h.topKg, so the line rises as help falls (or plot topKg and say 'lower is better' in the hint); bodyweight gives h.bestReps; duration gives h.bestDurationSec; weighted and conditioning keep the current h.bestE1rm || h.topKg || h.bestReps.
- In History.tsx, hoist `const mode = modeOf(exercise, s.customExercises)`, pass it to progressTrend, and draw `<Sparkline points={hist.slice(-12).map(h => progressValue(h, mode))} />`.
- Make the hint depend on the mode. Assisted: 'Trend follows the assistance: less help is progress; with the same help, more reps.' Bodyweight: 'Trend follows your best reps.' Duration: 'Trend follows your longest hold.' Weighted keeps the current sentence.
- Extend tests/progress-trend.test.ts: for the 40 to 12 kg assisted history, the progressValue series is increasing (last > first); for the plank, it equals 30..100.


## D — Escobar: suggestion ids after trimming  (patch `docs/qa/fixes/D.patch`)

### QA2-FD-1 — fixed

**Root cause.** The bug is still present at 3a65b2f. src/escobar/loop.ts:476 passed `proposalCount: proposals.length` to executeTool, and executor.ts:183/199 builds the new id as `p${proposalCount+1}`. Since 7958d6d (QA-R4b-7), trimOldest (store.ts:152) drops cards whose message was cut. After a trim, the number of cards kept can be lower than the highest id kept, so a new card repeats an existing id. For example, with p2 and p3 kept, the new card becomes p3. decide() (apply.ts:237) then finds the older card first, and withDecision (apply.ts:231) marks both cards.

**Change (in the patch).**

src/escobar/loop.ts: added a module-level helper next to toolUses/textOf:
  const proposalsIssued = (proposals: ProposalRecord[]): number =>
    proposals.reduce((n, p) => Math.max(n, Number(/^p(\d+)$/.exec(p.id)?.[1] ?? 0)), proposals.length);
The tool loop in EscobarLoop.send now passes `proposalCount: proposalsIssued(proposals)` instead of `proposals.length`. This keeps the ExecEnv contract ('proposals issued so far') and the executor unchanged. The loop already appends each new card to `proposals` before the next tool runs, so several cards in one step still get consecutive ids. Ids never repeat a card the conversation still holds, so Apply, Dismiss and Undo act only on the card that was tapped. Without a trim the numbering is exactly as before: the highest suffix equals the count.

**Test.** tests/escobar/loop.test.ts, describe 'suggestion ids after a trim (QA2-FD-1)' > 'a new card never takes the id of a card that survived the trim, so Apply or Dismiss acts on the card tapped'. It drives the real EscobarLoop: turn 1 proposes p1 (propose_goal), turn 2 proposes p2 (propose_goal) and p3 (propose_deload). It then applies trimOldest and checks that p1 is gone and p2, p3 remain. A third turn proposes 'Take a lighter week' and the test expects ids ['p2','p3','p4']. Finally decide(conv, fresh.id, 'dismiss') must mark only the new card, giving statuses ['awaiting','awaiting','dismissed'], and must record the new card's title in pendingDecisions. Before the fix it failed with received ids ['p2','p3','p3']. (failed before: True, passes after: True)

**Notes.** The fix is in loop.ts only. store.ts, the executor and apply.ts are untouched. Residual risk, not changed: if a trim drops every card, numbering restarts at p1. No card the app holds can collide then, so Apply cannot hit the wrong card. The only effect is that an old brief line still in the window, or an unreported pendingDecision, could name the same id as the new card. That confuses the model at most and has no functional effect. If the owner wants ids strictly monotonic for a conversation's whole life, the next step is a persisted high-water mark on Conversation (e.g. proposalSeq) that trimOldest keeps. I did not add it, to keep the fix minimal. No migration is needed for stored duplicate ids: 7958d6d, the commit that introduced the trim-drops-cards behaviour, is only on claude/marc-r0-remediation-ast5xs. It is not in origin/main or any tag, so no shipped store holds duplicates.


## W2 — F7 app cost estimate (cache writes, unknown models, fallback turns)  (patch `docs/qa/fixes/W2.patch`)

### QA2-F7-4, QA2-F7-1, QA2-F7-2 — fixed

**Root cause.** Still present at 3a65b2f. estimateCost (src/escobar/state.ts) had no term for cache writes, and the loop (src/escobar/loop.ts, per-step usage block after `const final = r.final!`) never read cache_creation_input_tokens or the TTL breakdown `cache_creation`. The Worker writes the cache on most turns (1h mark on the policy and manifest, 5m automatic caching on messages), so the Settings figure left out the biggest line on the bill. Example: Opus 5 with 50 in, 300 out and a 20k 1h write was recorded as $0.00775; the real cost is $0.20775.

**Change (in the patch).**

src/escobar/state.ts: estimateCost takes two optional fields, `cacheWrite5mTokens` and `cacheWrite1hTokens`, and adds them at 1.25x and 2x the model's input price. Those multipliers apply to every model on the official pricing page (checked 2026-09-24).
src/escobar/loop.ts, per-iteration block: cacheWrite1hTokens = it.cache_creation?.ephemeral_1h_input_tokens ?? 0, and cacheWrite5mTokens = max(it.cache_creation?.ephemeral_5m_input_tokens ?? 0, (it.cache_creation_input_tokens ?? 0) - cacheWrite1hTokens). A write with no TTL breakdown is priced at the 5-minute rate rather than dropped. Both fields are passed to estimateCost.
src/escobar/types.ts: Usage gets an optional `cache_creation?: { ephemeral_5m_input_tokens?, ephemeral_1h_input_tokens? } | null`, which is what the API and SDK return.
The day token counters and the Settings 'k in' text are unchanged; only costUsd now includes writes.

**Test.** tests/escobar/loop.test.ts > 'cost by the model that answered (F7)' > 'QA2-F7-4: cache writes are priced at the 1-hour and 5-minute write rates'. Checks 1h 20k = 0.20775, 5m 20k = 0.13275, and a write with no breakdown = 0.13275. Before the fix it failed with 0.00775 vs 0.20775. (failed before: True, passes after: True)

**Notes.** QA2-F7-2's evidence also covers the Worker accepting any well-formed claude-* id (a typo, or Haiku 4.5 with adaptive thinking and effort). That Worker validation belongs to W1 (QA2-F7-3) and is not in this patch. The part of QA2-F7-2 confirmed for W2 (cost accuracy: cache writes and fallback turns) is fixed here and in the next entry. The design note in docs/REMEDIATION-PROGRESS.md (F7 'App:' bullet) still says 'each step is priced by final.model'. I left it alone because W1 may edit the lines next to it; the owner or merger should update it.

### QA2-F7-1, QA2-F7-2 — fixed

**Root cause.** Still present at 3a65b2f. The loop priced every usage.iterations entry at final.model's rate and counted every entry. Official docs (refusals-and-fallback, Billing and rate limits) say an attempt that declined before any output is reported in iterations but not billed. Every attempt that produced output is billed at the rates of the model that ran it, and each iteration carries its own `model` (the SDK types BetaMessageIterationUsage.model is Model|null and BetaFallbackMessageIterationUsage.model is Model). Result: a fallback turn (Opus 5.5 declined 535/0, then Opus 4.8 served 412/264) was recorded as 947 input tokens and $0.011335; the real figures are 412 and $0.00866.

**Change (in the patch).**

src/escobar/loop.ts, per-iteration block: iterate with `for (const [i, it] of its.entries())` and `continue` past an entry that is not the last and has no output tokens (`i < its.length - 1 && !it.output_tokens`). Such an entry is a declined-before-output attempt. Completed sampling iterations always produce output, and the serving, last entry is always counted.
Price each billed entry with its own model: `typeof it.model === 'string' ? it.model : final.model`. The iteration element type gets `model?: string | null`.
Token counters skip the unbilled attempt too, so the day's input reads 412, not 947. A mid-output decline is still counted in full at the declining model's rates, as the docs say.

**Test.** tests/escobar/loop.test.ts > 'cost by the model that answered (F7)' > 'QA2-F7-1: a fallback turn prices each attempt by its own model and skips the unbilled declined attempt'. Pre-output decline: inputTokens 412 and cost 0.00866. Mid-output decline (535/40 on Opus 5.5): inputTokens 947 and cost 0.00294 + 0.00866. It failed before the fix (947 vs 412). Mutation checks: pricing at final.model gives 0.012335 vs 0.0116, and removing the skip gives 947 vs 412; both fail the test. (failed before: True, passes after: True)

**Notes.** Out of scope and not changed: when the whole fallback chain refuses, the Worker emits a 'refusal' event without usage, so the app records nothing. A mid-stream refusal is still billed (input plus partial output). That belongs to the refusal accounting line (QA-R0-3), not the estimate.

### QA2-F7-1 — needs_owner — ⚠ REVIEW: INCOMPLETE, apply the follow-up

**Root cause.** priceFor (src/escobar/state.ts) fell back to Opus 5 prices ($5/$25) for any id missing from PRICES. The table lacked several models the API serves, so claude-mythos-5-1 and claude-mythos-5 were priced $5/$25 against a real $10/$50, and claude-sonnet-4-6 $5/$25 against $3/$15. Opus 4.7/4.6/4.5 and Sonnet 4.5 were missing too.

**Change (in the patch).**

src/escobar/state.ts: PRICES gains claude-mythos-5-1 (10/50/0.25), claude-mythos-5 (10/50/1), claude-opus-4-7, claude-opus-4-6, claude-opus-4-5 (5/25/0.5), claude-sonnet-4-6 and claude-sonnet-4-5 (3/15/0.3). Existing rows keep their order; the new ones are appended. All prices come from platform.claude.com/docs/en/about-claude/pricing, checked 2026-09-24. Retired ids are deliberately left out, so a 'claude-opus-4' key cannot capture future claude-opus-4-x ids.
priceFor: an id with no matching key now uses UNKNOWN_PRICE = the dearest rates in the table (10/50/1) instead of Opus 5, so the estimate never reads below the bill. The default when no model is given at all stays claude-opus-5, for legacy days.

**Test.** tests/escobar/loop.test.ts > 'cost by the model that answered (F7)' > 'QA2-F7-1: every model the API serves has its own price; an unknown id is never priced below the dearest one'. Checks per-MTok input and output for mythos-5-1, mythos-5, sonnet-4-6, dated sonnet-4-5, opus-4-7, opus-4-6, dated opus-4-5, and an unknown id (10/50), plus cache-read rates. It failed before the fix (mythos-5-1 gave [5,25] vs [10,50]). (failed before: True, passes after: True)

**Notes.** Completing the table fixes every concrete case in the evidence and needs no decision. Pricing ids that are not in the table (a future model) is a product choice. Options: (a) keep Opus 5 prices, which reads low for dearer models (the old behaviour); (b) use the dearest known rates, which never reads below the bill but can read up to 5x high for a cheap new model; (c) store a 'priced: unknown' flag and show 'cost unknown' in Settings, the most honest option but it needs model, normalizer and UI changes. Recommended and implemented: (b), because the figure is labelled 'about' and D12 says the owner verifies prices before picking a model, so an over-estimate prompts adding the row. The 'no model gives $5' sub-case cannot happen through the Worker (it always sends model), so it is unchanged.

### ⚠ REQUIRED FOLLOW-UP for QA2-F7-1

**Reviewer found.** The PRICES additions are correct: every value matches the live pricing page. The stated guarantee does not hold, though. The change says 'an id with no matching key now uses UNKNOWN_PRICE ... so the estimate never reads below the bill'. But priceFor still matches any key the id starts with plus '-', so it cannot tell a date suffix from a minor version. Probed in the patched tree: estimateCost for 'claude-sonnet-5-5' gives [2,10] per MTok (Sonnet 5 rates) and 'claude-opus-5-6' gives [5,25] (Opus 5 rates), where the dearest rates, [10,50], were expected. The new 'claude-mythos-5' key likewise captures 'claude-mythos-5-2'. These successor ids are the most likely next ones, after the claude-opus-5 -> claude-opus-5-5 precedent. The same prefix capture already existed for 'claude-opus-5', 'claude-sonnet-5', 'claude-fable-5' and 'claude-mythos-5'; the patch handles it only for the retired 'claude-opus-4' key. The test checks only 'claude-something-9', which matches no prefix, so it cannot catch this.

**Do this on top of the patch.** In src/escobar/state.ts priceFor, accept a key only on an exact match or an 8-digit date suffix: `const key = Object.keys(PRICES).find(k => model === k || (model.startsWith(`${k}-`) && /^\d{8}$/.test(model.slice(k.length + 1))));` then `return key ? PRICES[key]! : UNKNOWN_PRICE;`. Update the doc comment to say a dated id (alias-YYYYMMDD) uses its alias's price and any other id is unknown. In the 'every model the API serves...' test, add `expect(perMTok('claude-sonnet-5-5')).toEqual([10, 50]); expect(perMTok('claude-opus-5-6')).toEqual([10, 50]);` and keep the existing dated-id asserts. Tried in the review worktree: all 25 loop tests pass, 'claude-opus-5-5-20260901', 'claude-opus-5-20260901' and 'claude-haiku-4-5-20251001' still resolve to their alias prices, and the two new asserts fail on the current patch.


## Owner defaults applied (the owner can change these later)

- **W1 cut-short estimate:** a cancelled answer is charged about 200 output tokens per second it ran, capped at max_tokens. Hidden thinking can no longer escape the caps. The trade-off is that a normal cancel is over-counted about 2–4× against the daily cap.
- **W2 unknown model price:** an id not in the table is priced at the dearest known rates, so the Settings figure never reads below the bill.
- **C weighted lifts:** the History trend is unchanged for weighted lifts; the mode-aware trend covers assisted, bodyweight and timed lifts.

## Low items

The 32 low items are in `docs/qa/LIVE-QA-2.md`, each with evidence and most with a suggested fix. Fix them after the patches, a test for each, with the QA2 id in the commit message.

## Update 2026-09-24: the follow-ups are done and verified

The four REQUIRED FOLLOW-UP changes and the 44 px effort inset are now in `docs/qa/fixes/F.patch`, which applies on top of W1, B, C, D and W2. `docs/qa/fixes/ALL.patch` is the whole set as one patch against **3a65b2f**.

The complete set was verified in a clean worktree at 3a65b2f with the branch's own `npm ci`:
- `tsc`: clean.
- vitest: 863 of 863 tests passed, including under `TZ=America/New_York` and `TZ=Asia/Manila`.
- `MARC_PERF=1`: 3 of 3 passed.
- Worker check: 88 of 88 passed.
- `npm run build`: OK.
- `npm run gate`: **PASS** (5 themes, past-session effort cross-row check included).

The follow-up tests fail without their source change.

Follow-up details:
- **QA2-F7-3:** `usableOverride` accepts exact ids only, and the test now expects a dated id to be ignored.
- **QA2-F7-1:** `priceFor` accepts an exact id or `alias-YYYYMMDD` only. `claude-sonnet-5-5` and `claude-opus-5-6` are priced as unknown, and `claude-haiku-4-5-20251001` resolves to Haiku.
- **QA2-FC-2:** `weeklyReviewInsights` runs its e1RM loop on `sinceLastBreak(...)`. New tests: a comeback gives no "flat" note, and a rebuild reads "rising".
- **QA2-FC-1:** new `progressValue` and `progressHint` in `progressTrend.ts`. The sparkline and hint follow the mode: assisted is plotted as negated assistance, bodyweight as reps, a hold as seconds.
- **QA-R7-1:** `.effort button::before { inset: -8px -2px; }` gives 44 px tall. It stays -2px sideways so it doesn't overlap the next button in the 4 px gap. The review's -3px would have overlapped.

Apply everything in one step:
```sh
git fetch origin claude/marc-regression-architecture-gegkbq
git show origin/claude/marc-regression-architecture-gegkbq:docs/qa/fixes/ALL.patch | git apply --3way --index
```
If `git apply` is blocked, make the same edits by hand from the patch, then run the checks above.

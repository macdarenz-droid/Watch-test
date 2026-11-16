# M/ARC coaching analysis and architecture plan

Scope: `macdarenz-droid/M-arc` at commit `245c26a` (v37, green gate) and `macdarenz-droid/Watch-test` at `8e07499`. Read-only analysis. No code was changed. This document is written to be handed to an implementing model; every claim carries a file and line so it can be re-checked.

---

## How to use this document (for the implementing agent)

**Read first**: section 0 (the five breaks), section 7 (phases and acceptance criteria), section 8 (decisions; where Marc has not answered, take the option marked "recommended"). Then read the section 6 parts for the phase you are on. Sections 1 to 5 explain the current code and can be skimmed.

**Order of work**: P0 (close the loops) → P0-P (profile, onboarding, goal) → P1-R (recovery v2, set timestamps, logging fidelity) → P2-C (coach v2 and the catalogue rows that need only sets) → P1 (watch bridge) → P2 (HR coaching) → P3 (readiness) → P4 (programming). P0-P, P1-R and P2-C need no native code and can start in parallel with P1.

**Ground rules that come from the repo and must not change**: `brain/` stays pure and never imports `ui/`, `slices/` or `native/`; screens change state only through `update()`; rules are objects in `RULES`; copy is plain words with no "algorithm", "model", "score" or version numbers; every new brain module ships with vitest tests; `npm run check` and `npm run gate` must stay green on every push; state stays `version: 1` with defaults supplied by `normalize()`. Watch-test remains untouched unless decision 3 says otherwise; the M/ARC plugin is a copy of its Java.

**Every line number in this document refers to commit `245c26a`**; re-check before editing, since files will move as phases land.

**Definition of done for a phase**: the acceptance criteria in section 7, the tests named in the relevant 6.x subsection, and gate screenshots for any new screen in all five themes.

**Suggested first prompt for the coding agent**: "Read `docs/COACHING-PLAN.md`. Implement phase P0 exactly as specified in sections 6.6, 6.7 and 6.12.1, taking the recommended option for every decision in section 8 unless told otherwise. Keep `npm run check` and `npm run gate` green. Open one PR per phase with the acceptance criteria from section 7 as the checklist."

---

## 0. Executive summary

**The watch data is not connected to the coach. It is not even connected to the app.** Four independent breaks sit between the heart-rate stream and the coaching brain, and all four have to be closed before any "smart" coaching feature is possible:

| # | Break | Where | Effect today |
|---|---|---|---|
| L1 | The Health Connect native plugin is **never compiled into the APK**. CI generates a fresh Android project and never copies `native/*.java` nor runs `native/patch_manifest.py`. | `.github/workflows/build-apk.yml:80-133`, `release-apk.yml:87-154` | `Capacitor.Plugins.HealthConnectNative` is undefined at runtime, so `healthAvailable()` is false inside the Android app. The Settings card shows "Available in the Android app" with no Sync button. Health permissions are absent from the manifest. |
| L2 | The JS bridge calls **methods that do not exist** on the plugin. | `src/native/health.ts:27-28` calls `requestPermissions()` / `readToday()`; the Java exposes `isAvailable`, `openPermissions`, `readSummary`, `diagnose` (`native/HealthConnectNativePlugin.java:66,75,160,244`) | Even with L1 fixed, `readHealth()` returns `{connected:false}` because `p.readToday` is undefined. There is also no in-app permission request: `openPermissions` only opens the system screen (`:81-83`), so the first sync would resolve zeros and the user is never prompted. The legacy v36 app called `readSummary()` correctly (`legacy/v36/index.html:5036`); the rebuild broke it. |
| L3 | **Field names mismatch** and the permission-denied shape is misread. | TS reads `restingHeartRate` (`health.ts:29`); Java returns `restingHR` and `workoutHR` (`HealthConnectNativePlugin.java:229-230`). Java returns `{needsPermission:true, steps:0, ...}` when denied (`:148-157`). | Resting HR would be lost, and a denied read would be stored as a successful sync of zeros. |
| L4 | **The coach never reads health data.** `CoachContext` is `{sessions, splits, schedule, custom, today, now}`. | `src/brain/coach/rules.ts:35-42`; `state.health` is read only by `Settings.tsx:99` for the "Last sync" label; restore wipes it (`Settings.tsx:43`) | Sleep, resting HR, steps, calories and heart rate have zero influence on recovery, readiness, insights or progression. |
| L5 | **Watch-test is a separate app** (`com.marc.watchtest`, plain Android, no Capacitor) with no bridge to M/ARC (`com.mrcdrnzz.dailytracker`). | `Watch-test/app/build.gradle:6`, `M-arc/capacitor.config.json` | The real-time BLE heart rate you just built never reaches M/ARC. Watch-test also never writes `HeartRateRecord` to Health Connect (read-only permissions, no `insertRecords`), so Health Connect cannot act as the bridge either. `Watch-test/docs/INTEGRATION.md` already sketches the intended bridge; nothing on the M/ARC side consumes it. |

Everything else in this document builds on closing L1 to L5. Section 6 gives the architecture; section 7 gives the phased plan with acceptance criteria.

**On how sessions are logged:** the app assumes every set is logged as it happens. Users who log late or at home would poison every timing-based insight and shift the recovery clock by hours. Section 6.17 adds a logging-fidelity classifier, a "when did you train?" step, a past-session flow, and a matrix stating which computations may use which data.

**On the training goal:** the goal (lean, growth, strength and muscle, strength) is a rep-range selector and nothing more. It reaches one function, `repRange()` in `progression.ts:41-45`; the coach rules, balance, volume, rest default, templates and cues never see it, the goal's `rir` field is read nowhere, and the Coach sheet's claim that the goal "changes the effort window" is false today. Two logic faults follow from it: under the strength goal every exercise, including lateral raises and curls, is prescribed 1 to 5 reps, and the step-down rule can never fire because "below a range that starts at 1" is impossible. Section 6.16 has the full audit and the fix.

**On recovery specifically:** the app can beat the watch, but not for the reason first assumed. A watch's "recovery time" is a whole-body estimate from heart rate (EPOC), and heart rate barely moves on heavy, low-rep sets, so it under-counts exactly the sessions that need the most recovery. What the watch lacks is what M/ARC already logs per set: which muscle, how many sets, how heavy relative to the user's best, and how close to failure. The research pass (Appendix C) shows heart rate during the set does **not** improve a per-muscle estimate and should stay a systemic modifier. Section 6.11 replaces the current linear 24/48/72 h fill with an evidence-based impulse-response model that stacks sessions, scales with volume, effort, load and exercise type, and calibrates itself from the user's next-session performance.

---

## 1. How the app works today (coaching data flow)

### 1.1 Inputs the coach can see

| Input | Model | Captured where | Used by coach? |
|---|---|---|---|
| Sets: `kg`, `reps`, `effort` (easy / ideal / max), `durationSec`, `distanceM` | `LoggedSet` (`core/models.ts:30-36`) | Live session `Train.tsx:241-263`, commit on blur `session.ts:61-68` | Yes, everything derives from this |
| Session: split, day, start/end, duration | `Session` (`models.ts:44-54`) | `finishSession` (`session.ts:125-159`) | Day and end time drive recovery; duration is display only |
| Splits + up to two focus muscles | `Split` (`models.ts:61-69`) | Split editor | Focus rule and balance softening |
| Weekly schedule | `schedule` | Coach tab | Streak, reminders, "scheduled today". **Not** used by any coach rule |
| Goal (lean / growth / strength_muscle / strength) | `GoalId` (`data/goals.ts`) | Coach tab | Only `repRange()` in progression. The `rir` field (`goals.ts:13`) is never read anywhere |
| Profile: name, body weight, height, sex | `Profile` (`models.ts:104-109`) | Settings, body-fat sheet | Only body-fat estimate. No age or birth year, so no HRmax estimate is possible today |
| Body-fat readings | `BodyMeasurement[]` | Body tab | Display only |
| Health snapshot: sleep, resting HR, steps, active kcal | `HealthSnapshot` (`models.ts:119-126`) | Settings Sync button (broken, L1 to L3) | **No** |
| Live heart rate, RR intervals, contact, energy, battery | none in M/ARC | Watch-test only | **No** |

### 1.2 The brain (`src/brain/`), in dependency order

1. **exposure.ts**: roles (primary 1.0 / secondary 0.55 / stabiliser 0.25), effort multipliers (0.9 / 1.0 / 1.1), weekly effective sets (primary 1, secondary 0.5), session emphasis percentages, cumulative levels.
2. **recovery.ts**: window 24 to 72 h from the last touch of each muscle, scaled by role-weighted effort; `personalWiden()` widens up to 1.4x but only with 11+ touches and 5 short-rest plus 5 full-rest samples (`recovery.ts:64-82`). `pct`, `hoursLeft`, `personalized`, `recovering`.
3. **history.ts**: per-exercise session summaries (top load, top reps, e1RM from sets of 10 or fewer, effort coverage, `hasMax`, `allEasy`).
4. **prs.ts**: six record kinds; first session is a baseline; live record badge.
5. **trend.ts**: recency-weighted regression (4+ points), `plateauStatus` on the last 8 sessions (needs 7).
6. **progression.ts** `suggestNext()`: start light, re-entry after 28 days, confirm effort, reduce, plateau, increase (two clean tops or all easy), confirm, hold, reps, duration. Produces a target string, reason, confidence and a set plan. **Ignores recovery state, schedule, health, and the goal's RIR window.**
7. **effort.ts**: effort drift over the last 6 sessions.
8. **balance.ts**: push vs pull, upper vs lower over 3 weeks with gates.
9. **weekly.ts**: week summary and grade (count of workouts only), schedule-aware streak, gap.
10. **coach/rules.ts**: nine rules → `Insight {category, priority, title, noticed, means, action}`; `coachInsights()` runs all, drops exercise insights whose primary muscle has a recovery insight, sorts by priority, dedupes, keeps 3.
11. **coach/cues.ts**: 422 cues (266 coach, 146 learn, 10 mindset) ranked by exercise → pattern → muscle → equipment → general, rotated by hash.

### 1.3 Where coaching is surfaced

| Screen | What the coach shows | Source |
|---|---|---|
| Today | Top insight, recovery snapshot (4 muscles), week grade, streak, daily quote | `Today.tsx:97-123` |
| Train (split list) | Per-exercise next target and reason | `Train.tsx:83-88` |
| Train (live) | Next target, set-by-set plan, "Last:" hint, live record badge, rest timer with fixed seconds | `Train.tsx:221-262`, `session.ts:95-100` |
| Finish screen | Muscle emphasis map and top 5 muscles | `Train.tsx:286-307` |
| Coach | 3 insights with Noticed / Means / Do-next sheet, goal, schedule, one cue for the first exercise of the last session, "how the coach thinks" | `Coach.tsx` |
| Body | Recovery map, recovering list, fully recovered list, levels, this week, body fat | `Body.tsx` |
| History → Stats | Per-muscle weekly sets vs previous week, e1RM trend, records | `History.tsx:148-204` |
| Notifications | Rest done, training-day reminder | `native/notifications.ts` |

### 1.4 The "readiness" category exists in name only

`Category` includes `readiness` (`rules.ts:20`) but the only rule that emits it is `readiness.effort-drift` (`rules.ts:139-148`), which needs 6 sessions with 18+ rated sets per exercise before it says anything. There is no daily readiness, no sleep, no resting HR, no check-in.

---

## 2. Watch data connection audit (detail for L1 to L5)

### L1: native plugin is not in the build

`build-apk.yml` step "Configure Android project" (lines 87-118) does `rm -rf android`, `npx cap add android`, patches `minSdkVersion`, runs `cap sync`, creates the package directory (`mkdir -p "$PKG"`, line 102) and copies launcher icons. It never copies `native/MainActivity.java` (which is the only place `registerPlugin(HealthConnectNativePlugin.class)` happens), `native/HealthConnectNativePlugin.java`, `native/PermissionsRationaleActivity.java`, and never runs `native/patch_manifest.py` (which adds the four `android.permission.health.*` permissions, `POST_NOTIFICATIONS`, `SCHEDULE_EXACT_ALARM`, and the rationale activity alias). `grep -n "native\|\.java\|patch_manifest" .github/workflows/*.yml` returns only the step title on line 120. The plugin verification (line 133) only checks `LocalNotifications Filesystem Share Haptics` in `capacitor.plugins.json`, and a locally registered plugin would not appear in that file anyway.

Consequence: the default Capacitor `MainActivity` is compiled, so the plugin class is absent. `healthAvailable()` (`health.ts:19-21`) returns false in the APK. Also `SCHEDULE_EXACT_ALARM` and `POST_NOTIFICATIONS` are not being declared by this script either, so notification behaviour is relying on whatever `@capacitor/local-notifications` merges in.

### L2 and L3: bridge method and field mismatch

```ts
// src/native/health.ts:8-12, 27-29
readToday?: () => Promise<{ sleepMinutes?, restingHeartRate?, steps?, activeCalories? }>
await p.requestPermissions?.();      // Java has openPermissions (opens the system screen; does not request)
const r = await p.readToday();       // Java has readSummary
restingHr: r.restingHeartRate        // Java returns restingHR, workoutHR, heartRateTime, sleepEndTime, stepsTime
```

The Java `readSummary` reads a 2-day window and returns the **latest** resting HR sample, the **latest** HR sample (`workoutHR`), the most recent sleep session length, summed steps and summed active calories with timestamps (`HealthConnectNativePlugin.java:170-236`). When permission is missing it resolves (not rejects) `permissionOnlyResult()` with zeros (`:148-157`). Also note there is no permission request flow in the plugin: `openPermissions` only opens the system management screen; on Android 14 the proper flow is `requestPermissions()` with the health permission strings through the Activity result API, which the plugin does not implement. The legacy app used the same plugin shape and read `restingHR` / `workoutHR` (`legacy/v36/index.html:5036-5072`).

### L4: health never reaches the brain

`grep -rn "health" src` shows `state.health` is used only in `Settings.tsx:43,99`. `CoachContext` (`rules.ts:35-42`), `recoveryStatus()` (`recovery.ts:84`) and `suggestNext()` (`progression.ts:59`) take no health, profile or readiness input. `HealthSnapshot` stores a single latest value, not a daily history, so baselines (7-day resting HR, sleep average) cannot be computed even after L1 to L3 are fixed.

### L5: Watch-test is an island

Watch-test is a good, cautious BLE adapter: serialised GATT queue, CCCD ack before "subscribed", 3 retries, foreground `connectedDevice` service, freshness LIVE / DELAYED / STALE from monotonic time, contact-flag handling, RR intervals in ms, 900-point ring buffer, no fake data (`WatchService.java`, `sensor-core/LiveSession.java`, `HeartRateMeasurement.java`). It has no persistence, no export of readings, no intent or content provider. `docs/INTEGRATION.md` recommends exactly the right bridge: move `WatchService` behind a Capacitor plugin, emit `watchMeasurement` and status events separately, associate samples with an active workout id, keep Health Connect as a separate route.

### Also lost in the v37 rebuild

The legacy v36 single-file app kept `state.health = {connected, provider, sourceMode, lastSync, sleepMinutes, restingHR, workoutHR, steps}` (`legacy/v36/index.html:3187`) and surfaced HR / sleep / steps / kcal on its dashboard (`:19351`); its source contains readiness, HRV, RPE/RIR, MEV/MRV, fatigue and journal vocabulary. `core/migrate.ts` (`LegacyRoot`, lines 22-42) imports workouts, splits, schedule, notifications, units, profile and body-comp only. Whatever health or readiness history the old app held is dropped on import. This is acceptable if it was only a cache of Health Connect, but it means v37 starts from zero for baselines.

---

## 3. Assessment of the current coaching features

### 3.1 What is genuinely good (keep)

- Plain-words insight shape (noticed / means / action) with priorities and a dedupe pass; rules as data.
- Recovery model that only widens with evidence; never fabricates precision.
- Progression that refuses to increase on max effort or missing effort; re-entry after long gaps; step sizes by load band; explicit confidence.
- Records that exclude baseline sessions and volume; live record badge.
- Balance rule with evidence gates and focus softening.
- Schedule-aware streak (the legacy handoff flagged calendar streaks as a poor fit; v37 fixed it).
- Cue library of 422 items with a sensible ranking.
- Persistence: single key, debounce, backup key, legacy read-only import, flush on hide.

### 3.2 Weaknesses and gaps (each is a candidate change)

| Id | Finding | Evidence | Why it matters |
|---|---|---|---|
| W1 | Recovery insight only fires when `personalized` is true | `rules.ts:75`; `recovery.ts:65,70,76,79` | `personalized` needs 11+ touches, 5 short-rest and 5 full-rest samples, **and** short-rest volume below 94% of full-rest volume. A user who rests adequately or whose volume does not drop never meets it. For most users the Coach tab never shows a recovery insight, while Today and Body already show the muscle at 30%. |
| W2 | No rule looks at today's scheduled split against recovery | `schedule` is in `CoachContext` but unused by any rule | The single most useful pre-session insight ("Legs is scheduled, quads are 45% recovered, swap to Pull or go light") is missing. |
| W3 | `insights` computed uses `Date.now()` not `nowMs` / `today` | `selectors.ts:31`; `selectors.ts:15-20` | Time-based insights do not refresh while the app is open; `recovery` (line 28) uses `nowMs`, but `nowMs` only ticks while a session or rest is active (`setTicking`), so recovery percentages on Today are also frozen outside a session until a state write or midnight. |
| W4 | Progression ignores recovery, schedule, readiness, and the goal's RIR window | `progression.ts:59`; `goals.ts:13` unused | A "small load increase" is suggested even when the muscle is 40% recovered. |
| W5 | Rest timer is a fixed number of seconds | `session.ts:95-100` | Live HR makes an HR-guided rest possible; it is the most tangible use of the watch. |
| W6 | Cues surfaced once, for the first exercise of the last session, only on the Coach tab | `Coach.tsx:28-30`; `Train.tsx` never calls `pickCue`; `cues.ts:53` `recent` is never passed | 422 cues, almost none seen in context, and the "not twice in a row" promise relies on the hash alone because nothing records which cues were shown. |
| W7 | Week grade is a workout count | `weekly.ts:35-38` | No per-muscle volume coaching, no comparison to the user's own baseline except in the focus rule. |
| W8 | No deload / lighter-week state | plateau rule says "one lighter week" but nothing tracks it | The user cannot act on the advice inside the app; next session still suggests increases. |
| W9 | No warm-up guidance | `suggestNext` gives working sets only | Cheap to add from `next.kg`. |
| W10 | No insight feedback, dismiss, snooze, or log | `Coach.tsx` | Same three cards can sit for weeks; no way to learn what the user finds useful. |
| W11 | Effort scale is 3 levels | `EFFORTS` in `Train.tsx:22-26` | Fine for the model, but per-set HR could validate mis-rated efforts. |
| W12 | Duration / conditioning progression is naive | `progression.ts:77-81,90-94` | HR zones are the right target for carries, sled and planks. |
| W13 | Profile has no age or birth year | `models.ts:104-109` | Needed for any HRmax or kcal estimate fallback. |
| W14 | Only 2 coach-rule tests; recovery rule, plateau rule, focus, gap, priority filter, `personalWiden`, `effortDrift`, `plateauStatus` are untested | `tests/balance-weekly.test.ts`, no `coach.test.ts` | Any rule change is unguarded. |
| W15 | Restore wipes health; no daily health history | `Settings.tsx:43`; `HealthSnapshot` | Baselines impossible. |
| W16 | Health sync is a manual button in Settings | `Settings.tsx:99` | Must be automatic on app open / session start for coaching to use it. |

---

## 4. New features to add (prioritised)

Priority: **P0** unblock, **P1** highest coaching value per effort, **P2** strong value, **P3** nice to have. Each feature lists inputs, the brain function, and the surface.

### P0. Close the loops (nothing else works without these)

- **F0.1 Compile the native plugin in CI** and patch the manifest (L1).
- **F0.2 Fix the health bridge** to call `readSummary`, map `restingHR` / `workoutHR` / `sleepMinutes` / `steps` / `activeCalories` and the timestamps, treat `needsPermission` as not connected, add a real permission request (L2, L3).
- **F0.3 Store daily health history** (`healthDays[]`) and sync automatically on app open and on session start (L4 part 1, W15, W16).
- **F0.4 Bring the BLE adapter into M/ARC** as a Capacitor plugin ported from Watch-test (L5). Watch-test remains the standalone hardware-verification app.

### P1. Live heart rate inside the session

- **F1.1 Session HR capture**: while a session is active and the watch is connected, keep a downsampled series and per-set aggregates: peak HR during the set, HR at set end, HR 60 s after set end (HRR60), rest-start HR. Surface: live pill in the Train topbar (bpm, freshness dot), per-set "peak 142" after commit, finish screen card (avg, max, HRR, time in zones, active calories as a range with a burn curve), History card line "avg 118 bpm · ~310 kcal". Calories follow the design in 6.10.
- **F1.2 HR-guided rest**: rest ends when HR drops to a personal target (default: below 60% of heart-rate reserve, or within 10 bpm of the pre-set baseline, whichever is higher), with the existing time as a ceiling and a minimum of 30 s. Rest banner shows "128 → 105". Falls back to the timer when the stream is DELAYED / STALE. Setting: rest mode `time` | `heart`.
- **F1.3 Effort validation rule** (`heart.effort-mismatch`): after 5+ sets with both effort and peak HR, flag consistent mismatches ("you rated Easy on sets that hit 92% of your session max"). Low priority insight; never overrides the user's rating.
- **F1.4 Intra-session fatigue rule** (`heart.drift`): same exercise, same load, peak HR rising 8+ bpm per set and HRR60 shrinking → "you are fatiguing; finish the main lift, trim accessories".
- **F1.5 Conditioning targets**: for `duration` / `conditioning` modes, progression targets become time in a zone ("8 min in zone 2"), and two new record kinds: longest time in zone, lower average HR at the same load.
- **F1.6 Personal HRmax**: max observed bpm across sessions (with contact = true and LIVE freshness), with Tanaka `208 − 0.7 × age` as the fallback from `profile.birthYear`, and a manual override.

### P2. Daily readiness

- **F2.1 Readiness score** (0-100, green / amber / red, with reasons): resting HR today vs 7-day and 28-day baseline, sleep last night vs 14-day median, RMSSD (if RR available) vs 7-day lnRMSSD baseline, recovery percent of the muscles in today's scheduled split, yesterday's load, and the optional check-in. Missing inputs lower confidence rather than the score. Surface: Today card ("Readiness: amber. Slept 5h 40m, resting HR +6 over your usual. Keep loads, skip the increase today"), Coach insight, and a `readiness` input into `suggestNext` (red → no increases, suggest hold or minus one set; amber → no increases on lifts the user rated max last time).
- **F2.2 Pre-session check-in** (optional, 3 taps): sleep quality, soreness, mood 1-5. Stored per day. Feeds readiness. Shown as a sheet when starting a session if not done today.
- **F2.3 HRV reading flow**: 60 to 120 s seated still reading from the watch's RR intervals, with artifact filtering, before a session or in the morning. Only offered when the watch sends RR intervals. **Verified: the GT6 broadcast does not (Appendix E), so this flow is built behind the "RR present" check and stays hidden on the GT6.** It remains for chest straps and other watches that do send RR.
- **F2.4 Systemic recovery modifier from health**: the evidence says one bad night does not delay strength recovery, so single-night sleep never moves the muscle map. Only multi-day signals do: a 7-day mean sleep under 6.5 h slows all muscles' recovery by 10 %, an HRV or resting-HR 7-day mean outside the 28-day baseline by more than 0.5 SD slows it by 10 %, and a 7-day to 28-day training-load ratio above 1.3 slows it by up to 25 %; combined cap 1.25x. Shown as a separate "whole body" line under the muscle map, never folded silently into a muscle's percentage. Details in 6.11.
- **F2.5 Resting HR trend and HRR trend** in History → Stats (sparklines) with an insight when resting HR is elevated 3 days running (overreaching or illness flag).

### P3. Programming intelligence (no watch needed, but readiness makes them better)

- **F3.1 Scheduled-split conflict rule** (`recovery.scheduled-conflict`, fixes W1 and W2): if today's split has a primary muscle that is not yet "ready for hard work" (under 90 %, see 6.11), suggest a reorder, a swap to another split, or an easy session; under 60 % the wording is firmer. Does not require `personalized`. Never says "blocked": trained lifters can train at partial recovery without harming gains, so the copy is about lowered readiness and where to put the hard sets.
- **F3.2 Volume landmarks per muscle**: weekly effective sets vs the user's own 4-week median and a level-based band (New 4-8, Beginner 6-10, Developing 8-14, Established 10-18, Advanced 12-20). Insight when a trained muscle is far under or over its band. Body → This week gets the band as a faint range on each bar.
- **F3.3 Deload state**: trigger when (a) two or more main lifts plateaued or declining, or (b) effort drift harder on 2+ lifts with rising weekly volume for 3 weeks, or (c) readiness red for 3 of the last 5 days. Coach offers "Take a lighter week"; accepting sets `deload = {startDay, endDay, reason}`; progression then targets minus 30 to 40% sets and minus 10% load with `mode: 'deload'`; a week later the coach closes it and returns to normal targets.
- **F3.4 Warm-up sets** for weighted main lifts from the next target: 50% × 8, 70% × 5, 85% × 2 (rounded to the load step), shown collapsed above the working sets.
- **F3.5 Cues in the live session**: `pickCue(exercise, 'coach')` for the open exercise (one line under the target), `learn` cue on the finish screen. Track shown cues per exercise to rotate.
- **F3.6 Insight feedback**: "Helpful / Not now" on each insight card. Helpful hides the card for the rest of the day, Not now for 7 days, each with an Undo toast; hidden notes sit behind one "N notes hidden" row with Show again (COACH-FB replaced the "Earlier this month" log).
- **F3.7 Exercise substitution** when a muscle is recovering or an insight suggests balance work: pick from `LIBRARY` by pattern and equipment group with the same primary muscle.
- **F3.8 Morning coach notification** (optional, off by default): readiness summary at the reminder time on training days.

---

## 5. Improvements to existing features (concise list)

1. `rules.ts:75`: drop the `personalized` requirement or add a second, lower-priority non-personalised recovery rule gated on the scheduled split (F3.1).
2. `selectors.ts:31`: pass `now: nowMs.value - (nowMs.value % 60_000)` and `today.value` so insights refresh with time.
3. `progression.ts`: accept an optional `context: { readiness?, recoveryPct?, deload? }` and add modes `deload` and `hold_readiness`; use `GOAL.rir` in the increase rule (no increase when the last session's `hasMax` is true already does this; for `growth` allow increase after one clean top).
4. `weekly.ts` grade: include volume vs last week and planned days (`plannedPerWeek` is already passed).
5. `Coach.tsx` cue: choose from the exercises in today's scheduled split, not the first exercise of the last session.
6. `Settings.tsx`: Health section becomes "Watch and health" with connection state, last sync, auto-sync toggle, forget device; do not wipe `health` on restore, wipe only the connection flag.
7. `models.ts` Profile: add `birthYear`, `hrMaxOverride`, `restingHrOverride`.
8. Tests: add `tests/coach.test.ts` covering every rule, the priority filter and the dedupe; add `recovery.personalWiden`, `effortDrift`, `plateauStatus` tests; add tests for every new brain module.
9. CI plugin check: verify the native Java files exist in `android/app/src/main/java/com/mrcdrnzz/dailytracker/` and the manifest contains the health and Bluetooth permissions; do not rely on `capacitor.plugins.json` for locally registered plugins.
10. `history.ts` / `core/units.ts`: e1RM must include reps in reserve from the effort label (easy +3, ideal +2, max +0) and down-weight sets of 7 to 10 reps; expose a personal typical error so changes under two typical errors are reported as "about the same".
11. `weekly.ts` streak: report adherence as a 28-day rate and "weeks on plan" with one free miss per 4 weeks; keep the schedule-aware streak as a secondary number, never reset to zero for one miss.
12. `data/goals.ts` and `progression.ts`: accessory ranges for every goal, explicit main-lift role, low-range step-down via e1RM drop, `rir` used in copy and rules (6.16).
13. Visual gate (`scripts/screenshot-gate.mjs`): add a fixture with `healthDays` and a session with `heart` so the new cards are screenshotted in all five themes; add a `readiness` screenshot.

---

## 6. Architecture design for implementation

Everything below follows the existing rules in `docs/ARCHITECTURE.md`: `brain/` stays pure and takes plain data; screens read signals and change state through `update()`; copy is plain words; rules are objects in `RULES`.

### 6.1 Data model changes (`src/core/models.ts`)

Keep `version: 1`. `normalize()` in `core/store.ts` already spreads `freshState()` under saved state, so new top-level arrays and objects need only a default in `freshState()` and a line in `normalize()`; no migration bump.

```ts
// Heart rate captured during a session. Series live in a separate store (6.3); only aggregates live here.
export interface SetHeart {
  peakBpm: number;      // highest bpm from set start to set end
  endBpm: number;       // bpm at commit
  restStartBpm?: number;
  hrr60?: number;       // endBpm - bpm 60 s after commit, if a LIVE sample existed
}
export interface SessionHeart {
  source: 'ble';
  deviceName?: string;
  samples: number;      // valid samples (contact true, bpm > 0)
  avgBpm: number; maxBpm: number; minBpm: number;
  hrr60Median?: number;
  zoneSec: [number, number, number, number, number]; // seconds in zones 1-5
  energy?: SessionEnergy; // see 6.10
  coverage: number;     // 0-1 share of session time with LIVE samples
}
// LoggedSet gains: heart?: SetHeart
// Session gains: heart?: SessionHeart

export interface DailyHealth {
  day: string;                    // local YYYY-MM-DD
  restingHr?: number; restingHrAt?: string;
  latestHr?: number; latestHrAt?: string;
  sleepMinutes?: number; sleepEndAt?: string;
  steps?: number; activeCalories?: number; spo2?: number;
  rmssd?: number; lnRmssd?: number; rmssdAt?: string; rmssdSource?: 'watch' | 'manual';
  source: 'health_connect' | 'watch' | 'manual';
  syncedAt: string;
}
export interface CheckIn { day: string; sleepQuality: 1|2|3|4|5; soreness: 1|2|3|4|5; mood: 1|2|3|4|5; note?: string }
export interface Deload { startDay: string; endDay: string; reason: string; setFactor: number; loadFactor: number }
export interface InsightFeedback { id: string; day: string; verdict: 'helpful' | 'snoozed' }

export interface SessionEnergy {
  grossKcal: number;    // total burn during the session, including resting metabolism
  activeKcal: number;   // gross minus resting metabolism for the same minutes (comparable to the watch and Health Connect)
  low: number; high: number; // activeKcal band, ±25 % for the heart-rate formula, ±10 % for a device source
  minutes: number;
  source: 'heart_rate' | 'watch_energy' | 'health_connect';
}

// Profile gains: birthYear?: number; sex (already exists, but becomes editable in Settings); hrMaxOverride?: number; restingHrOverride?: number
// Preferences gains:
//   rest: { mode: 'time' | 'heart'; heartTargetPct: number /* 0.6 default, share of heart-rate reserve */ ; minSec: number /* 30 */ }
//   watch: { autoConnectOnSession: boolean; deviceAddress?: string; deviceName?: string }
//   healthAutoSync: boolean
//   coachNotifications: boolean
// AppState gains: healthDays: DailyHealth[] (cap 180, oldest dropped), checkIns: CheckIn[] (cap 180), deload: Deload | null, insightFeedback: InsightFeedback[] (cap 200)
// HealthSnapshot stays as the "latest" mirror for Settings, filled from the newest DailyHealth.
```

### 6.2 Native: `WatchBridge` Capacitor plugin (port of Watch-test)

Files under `native/` (copied into the Android project by CI, see 6.7):

- `native/MainActivity.java`: also `registerPlugin(WatchBridgePlugin.class)`.
- `native/watch/WatchBridgePlugin.java` (`@CapacitorPlugin(name = "WatchBridge")`): thin adapter over `WatchService`; binds the service; forwards listener callbacks as events.
- `native/watch/WatchService.java`, `DeviceScanner.java`: copied from Watch-test with package changed to `com.mrcdrnzz.dailytracker.watch`; the notification opens M/ARC's `MainActivity`.
- `native/watch/core/HeartRateMeasurement.java`, `LiveSession.java`: copied verbatim from `sensor-core` (already Android-free).
- `native/patch_manifest.py`: add `BLUETOOTH_SCAN` (`neverForLocation`), `BLUETOOTH_CONNECT`, legacy `BLUETOOTH` / `BLUETOOTH_ADMIN` / `ACCESS_FINE_LOCATION` with `maxSdkVersion=30`, `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_CONNECTED_DEVICE`, the `<service android:name=".watch.WatchService" android:foregroundServiceType="connectedDevice" android:exported="false"/>`, and `<uses-feature android:name="android.hardware.bluetooth_le" android:required="false"/>`.

Plugin contract (TypeScript side in `src/native/watch.ts`):

```ts
interface WatchDevice { address: string; name: string; advertisesHeartRate: boolean; paired: boolean; rssi: number }
type WatchState = 'unsupported' | 'permission' | 'idle' | 'scanning' | 'connecting' | 'connected' | 'reconnecting' | 'stopped';
type Freshness = 'LIVE' | 'DELAYED' | 'STALE' | 'WAITING' | 'CHECK_FIT' | 'DISCONNECTED';
interface WatchStatus { state: WatchState; freshness: Freshness; deviceName?: string; battery?: number; message: string }
interface WatchMeasurement { bpm: number; contact: boolean | null; rrMs: number[]; energyKj: number | null; receivedAtEpochMs: number; receivedAtElapsedMs: number }

// methods
isSupported(): Promise<{ supported: boolean }>
permissionState(): Promise<{ granted: boolean; needsLocation: boolean }>
requestPermissions(): Promise<{ granted: boolean }>          // BLUETOOTH_SCAN/CONNECT or FINE_LOCATION on API <= 30, plus POST_NOTIFICATIONS
startScan({ timeoutMs }): Promise<void>; stopScan(): Promise<void>   // emits 'watchDevice' events
connect({ address }): Promise<void>; disconnect(): Promise<void>
status(): Promise<WatchStatus>
// events: 'watchMeasurement' (WatchMeasurement), 'watchStatus' (WatchStatus), 'watchDevice' (WatchDevice)
```

Web fallback: `isSupported()` false; the UI hides the connect controls and shows "Live heart rate needs the Android app", the same pattern as haptics.

Verified device behaviour to code against (Appendix E): the watch advertises as "HUAWEI WATCH HR-xxxx" while broadcasting; the Heart Rate Service `0x180D` exposes `0x2A37` as **notify only** (properties 16) and `0x2A38` body sensor location (read); packets arrive about once a second; the Battery Service `0x180F` supports read and notify; there is no `0x2A39` control point, no RR intervals and no energy field. Connection took about 1.5 s from "Connecting" to "Connected".

Behaviour rules carried over from Watch-test: connection state and freshness are separate; freshness uses monotonic time; a connected link is not a live reading; no synthetic data; up to three reconnects; the foreground service stops on explicit disconnect, Bluetooth off, permission loss, or unsupported service. New: remember the last device address in plugin `SharedPreferences`; `autoConnectOnSession` calls `connect` with it when `startSession()` runs.

### 6.3 Web: live heart stream and storage

- `src/native/watch.ts`: plugin wrapper plus signals `watchStatus`, `latestMeasurement`, and a `startWatchListeners()` called from `main.tsx`.
- `src/core/heartStore.ts`: separate localStorage key `marc.heart.v1` = `{ [sessionId]: Array<[tSec, bpm]> }`, downsampled to one point per 5 s (median of the window, contact = true only). Cap 60 sessions by LRU, drop the oldest. The main state key must not carry series (a 60 min session at 1 Hz is ~40 KB; 200 sessions would exceed the localStorage budget). `finishSession` writes the series once; `discardSession` deletes it. Export backup includes it under a `heart` key; restore accepts it.
- `src/slices/workout/heart.ts` (live only): subscribes to `latestMeasurement`; keeps an in-memory ring for the active session (survives tab switches, not restarts; on restart the series before the restart is lost, which is acceptable and stated in the UI); records set marks from `commitSet` (`setStart` = first input or previous commit, `setEnd` = commit) and computes `SetHeart`; drives HR-guided rest by calling `stopRest()` when the target is met; on `finishSession` computes `SessionHeart` via `brain/heart.ts` and stores the series.

### 6.4 Brain additions (all pure, all tested)

`src/brain/heart.ts`

- `hrMax(profile, observedMax?)`: `hrMaxOverride` → observed max (a plateau of ≥ 5 consecutive LIVE, contact = true seconds within 3 bpm, value ≤ 220, preceded by a ramp; only accepted if ≥ 150) → Tanaka `208 − 0.7 × age` → 190 when no age. Observed max decays back toward Tanaka if not re-approached in 12 months. Returns `{ bpm, source }` and the UI labels it "observed", never "true max".
- `restingHr(healthDays, profile)`: override → 7-day median of `restingHr` → lowest `avgBpm` floor is not used (do not infer resting HR from sessions).
- `zones(hrMax, restingHr)`: Karvonen heart-rate reserve boundaries at 50 / 60 / 70 / 80 / 90 %.
- `restTarget(preSetBpm, restingHr, hrMax, effort)`: `readyBpm = min(preSetBpm + 12, restingHr + 0.35 × (hrMax − restingHr))`; ready when three consecutive valid samples are at or below `readyBpm` **and** elapsed ≥ `minRest(effort)` (60 s easy, 90 s ideal, 120 s max for main lifts), hard cap 300 s, then the timer takes over. Record `timeToReadySec` per set; a rising slope across the session is the fatigue signal for `heart.drift`. The 0.35 and +12 constants are heuristics from the HR-determined-rest literature (Appendix B) and must be tuned on the GT6.
- `signalQuality(series, sessionSec)`: a second is valid when a packet arrived in the last 3 s, contact is not false, 30 ≤ bpm ≤ 220 and |Δbpm| ≤ 15 from the previous sample. `quality = validSec / sessionSec`. Session analytics need ≥ 0.8; HRR60 and rest thresholds need ≥ 0.95 inside their 60 s window. The UI says "watch signal weak" instead of showing numbers below these gates.
- `sessionHeartSummary(series, sets, zones, kcalInput?)`: avg / max / min, zone seconds, coverage, HRR60 median (HRR60 = peak − median of samples 55 to 65 s after set end, counted only when peak ≥ resting + 0.6 × reserve), Keytel kcal shown as a range of ±25 % (male: `(−55.0969 + 0.6309·HR + 0.1988·kg + 0.2017·age) / 4.184` per minute; female: `(−20.4022 + 0.4472·HR − 0.1263·kg + 0.074·age) / 4.184`), only when sex, weight and age exist; else `kcal` undefined.
- `rmssd(rrMs[])`: reject RR outside 300 to 2000 ms; mark an interval as artifact when it differs more than 20 % (or 250 ms) from the local median of its 11 neighbours and interpolate it; the reading is invalid when more than 5 % were corrected or fewer than 30 intervals remain; compute over the last 60 s after a 60 s stabilisation. Return `{ rmssd, lnRmssd, accepted, corrected }` or null. Store `lnRmssd`; display `rmssd`.
- `hrrTrend(sessions)`: recency-weighted trend of `hrr60Median` (uses `trend()` from `trend.ts`).

`src/brain/readiness.ts`

- `readinessBaselines(healthDays, today)`: 7-day and 28-day medians for resting HR, 14-day median sleep, 7-day mean and SD of `lnRmssd`, coefficient of variation.
- `readiness(input: { today, healthDays, checkIn?, recovery: MuscleRecovery[], scheduledSplit?, splitsMeta, sessions })`: `score = 100 × Σ(wᵢ·sᵢ) / Σ(wᵢ over available inputs)` with each `sᵢ` in [0, 1]. Start weights (tune later), **subjective first, sensors supporting**: check-in 0.35 (soreness of today's target muscles, sleep quality, mood, each as a z-score against the user's own 14-day distribution), sleep hours 0.25 (sub-score: 60 % last night vs 14-night need, 25 % three-night debt, 15 % bedtime regularity), recovery of today's target muscles 0.15 (from 6.11), resting-HR deviation 0.10 (`s = clamp(1 − delta/10, 0, 1)`), HRV z-score 0.10 (only with clean RR data and ≥ 14 values; `s = clamp(0.5 + z/3, 0, 1)`), acute load 0.05 (7-day sets vs 28-day mean). Self-report leads because it tracks training strain more sensitively and consistently than heart-rate measures (Saw 2016), and daily HRV correlates weakly with lifting performance. Missing inputs renormalise the weights; they never count as zero. Bands: green ≥ 67, amber 34-66, red ≤ 33, with hysteresis (a band change needs two consecutive days), and the "back off" advice fires only when two or more inputs are worse than 1 SD. Shows "calibrating" until 14 days of check-ins or sleep exist. Readiness never cancels a session; it shifts the effort target and the back-off volume. `confidence` from the count of present inputs. `loadAdvice`: `'normal' | 'no_increase' | 'reduce'` with a plain-words reason list naming the drivers. Never produces a score with zero inputs: returns `null` and the UI says "Connect a watch or add a check-in".
- `overreachingFlag(healthDays, weeklyVolume)`: amber when today's resting HR ≥ 7-day mean + 5 bpm or > 1.5 × 28-day SD; red when ≥ 8 bpm or amber on 3 consecutive days; or lnRMSSD z < −1.0, or two consecutive days below −0.5; or the weekly lnRMSSD coefficient of variation falls more than 30 % against its 4-week median while the mean is flat or falling and weekly volume rises (needs 3 to 4 readings a week). Baselines are kept per data source and never mixed.

`src/brain/volume.ts`

- `volumeBands(levelIndex, muscle)`: bands by level as listed in F3.2, with per-muscle offsets (lower for lower back, higher for side delts and calves). Treat these as starting ranges: RP revised its landmarks substantially in 2023-24, so keep them in `data/` where they can be edited, and personalise from performance and soreness feedback.
- `muscleVolumeStatus(sessions, today, custom)`: this week's effective sets vs 4-week median and band → `'under' | 'in' | 'over' | 'unknown'` per muscle with numbers.

`src/brain/deload.ts`

- `deloadTrigger(sessions, today, custom, healthDays, readinessHistory)`: returns `{ suggest: boolean; reason: string }` when any holds: a main lift's 7-day best e1RM ≤ 95 % of its 28-day best while effort stayed the same or got harder; no e1RM improvement over 3 consecutive sessions on 2+ main lifts; a muscle's weekly sets above its band for 2 weeks; readiness red on 3 of the last 5 days; or the HRV coefficient-of-variation collapse above. Prescription: sets × 0.5 to 0.6, load × 0.85 to 0.9, effort target easy, same frequency, 7 days. e1RM uses Epley `kg × (1 + reps/30)` with effort-adjusted reps (max +0, ideal +1.5, easy +3).
- `deloadTargets(suggestion: Suggestion, deload)`: multiplies sets and load.

`src/brain/progression.ts` changes

- New optional last parameter `ctx?: { readiness?: ReadinessResult | null; recoveryPct?: number; deload?: Deload | null; goalRir?: [number, number] }`.
- Order after `reentry`: if `deload` active → `mode: 'deload'` with reduced targets and reason "Lighter week, day N of 7". If `readiness?.loadAdvice === 'reduce'` → `mode: 'hold'` with minus one set and reason from readiness. If `'no_increase'` → skip the `increase` branch (fall through to `confirm` / `hold`). If `recoveryPct != null && recoveryPct < 60` → skip `increase` and say why.
- For `conditioning` / `duration` with zones available → target time in zone (F1.5).

`src/brain/recovery.ts` changes

- Replaced by the impulse-response model in 6.11. The exported `MuscleRecovery` shape is kept and extended so `Today.tsx`, `Body.tsx`, `MuscleMap` and the coach rules keep compiling.

`src/brain/coach/rules.ts` changes

- `CoachContext` gains `profile`, `goal`, `healthDays`, `checkIn`, `readiness`, `scheduledSplit`, `deload`, `watch: { connected: boolean; lastSessionHadHeart: boolean }`, `feedback: InsightFeedback[]`.
- New rules (id, priority): `readiness.today` (450 when red, 380 amber, 120 green with a positive note once a week), `recovery.scheduled-conflict` (420), `deload.suggest` (410), `heart.overreaching` (430), `heart.effort-mismatch` (110), `heart.drift` (post-session only, 130), `heart.hrr-trend` (115), `volume.landmark` (140 under, 160 over), `data.watch` (60: "Connect your watch to unlock HR-guided rest and readiness" until the first session with heart data), `data.health` (55: "Allow Health Connect to use sleep and resting HR").
- `coachInsights()`: after dedupe, drop ids snoozed in the last 7 days; `limit` stays 3 on Today and becomes 5 on the Coach tab.

### 6.5 Surfaces

- **Train live**: topbar pill (bpm + freshness dot + tap to open the watch sheet); each set row gets `peak` after commit; the rest banner shows `current → target` in heart mode and a small "timer" fallback label when not LIVE; warm-up rows (F3.4) collapsed above set 1; a one-line coach cue under the target (F3.5).
- **Finish screen**: "Heart" card (avg, max, HRR60, zone bar, kcal if available, coverage note "watch was live for 92 % of the session"); a `learn` cue.
- **Today**: "Readiness" card above "This week" when `readiness` is not null; otherwise a quiet card with the connect / check-in prompt; the check-in sheet.
- **Coach**: readiness insight, watch and health status row, insight feedback buttons, "Earlier" log, deload banner when active.
- **History**: session card "avg 121 bpm · max 158"; Stats gets "Resting heart rate" and "Recovery after sets" sparklines from `healthDays` and `sessions[].heart`.
- **Body**: MuscleDetail copy mentions when the window was widened by sleep or resting HR.
- **Settings**: "Watch and health" section: connect / forget, auto-connect on session start, rest mode and target, Health Connect permission and auto-sync, sync now, diagnostics export (reuse Watch-test's redacted diagnostics text); Profile gains birth year, sex (moved out of the body-fat sheet so it is set once), HRmax / resting HR overrides, and a one-line note under the fields: "Used for calories, heart-rate zones and recovery. Stays on this device." The first time a watch connects, a sheet asks for whichever of body weight, height, birth year and sex is still empty.

### 6.6 Health Connect bridge fix (`src/native/health.ts`)

```ts
interface HealthPlugin {
  isAvailable(): Promise<{ available: boolean; apiLevel: number; needsPermission: boolean }>;
  openPermissions(): Promise<{ opened: boolean }>;
  requestPermissions?(): Promise<{ granted: boolean }>;   // add to the Java plugin (Activity result with health permission strings)
  readSummary(): Promise<{ needsPermission: boolean; steps: number; sleepMinutes: number; restingHR: number; workoutHR: number; activeCalories: number; heartRateTime?: string; stepsTime?: string; activeCaloriesTime?: string; sleepEndTime?: string }>;
  diagnose(): Promise<unknown>;
}
export async function syncHealth(): Promise<DailyHealth | null>  // maps to DailyHealth for today; returns null when needsPermission or unavailable; 0 values become undefined
```

Java changes: add `requestPermissions` using `ActivityResultContracts.RequestMultiplePermissions` equivalent (`requestPermissionForAlias` pattern in Capacitor 5+), add `READ_OXYGEN_SATURATION` and `READ_HEART_RATE_VARIABILITY` (Health Connect has a `HeartRateVariabilityRmssdRecord`; Huawei Health may not write it, so treat as optional), and read the last 7 days so that `healthDays` can be backfilled on first sync.

### 6.7 CI changes (`.github/workflows/build-apk.yml` and `release-apk.yml`)

After `npx cap sync android` and `mkdir -p "$PKG"`:

```bash
cp native/MainActivity.java native/HealthConnectNativePlugin.java native/PermissionsRationaleActivity.java "$PKG/"
mkdir -p "$PKG/watch/core" && cp native/watch/*.java "$PKG/watch/" && cp native/watch/core/*.java "$PKG/watch/core/"
python3 native/patch_manifest.py android/app/src/main/AndroidManifest.xml
```

Verification step: `test -f "$PKG/HealthConnectNativePlugin.java"`, `test -f "$PKG/watch/WatchBridgePlugin.java"`, `grep -q 'android.permission.health.READ_HEART_RATE' android/app/src/main/AndroidManifest.xml`, `grep -q 'BLUETOOTH_CONNECT'`, `grep -q 'foregroundServiceType="connectedDevice"'`. Keep the existing byte-parity checks. Add the Java sources to the release workflow identically. Consider a `javac`-free sanity check by building; Gradle already compiles them, so a missing import fails the build, which is what we want.

### 6.8 Tests to add (vitest, pure)

- `tests/health-bridge.test.ts`: `readSummary` → `DailyHealth` mapping, `needsPermission`, zeros → undefined.
- `tests/heart.test.ts`: `hrMax` sources, `zones`, `restTarget` clamps, `rmssd` artifact filter and minimum count, Keytel kcal, `sessionHeartSummary` zones and coverage, HRR60 with missing samples.
- `tests/readiness.test.ts`: baselines with gaps, weight redistribution when inputs are missing, tiers, `loadAdvice`, null with no inputs, `overreachingFlag`.
- `tests/volume.test.ts`, `tests/deload.test.ts`.
- `tests/progression.test.ts`: new cases for readiness red / amber, recovery < 60, deload, conditioning zone target.
- `tests/coach.test.ts`: every rule fires and stays quiet, priority ordering, recovery filter, snooze filter, scheduled-conflict without personalization.
- `tests/recovery.test.ts`: widening by sleep and resting HR, cap 1.25, never shrinks.
- `tests/heartStore.test.ts`: downsampling, LRU cap, export and restore round trip.
- Gate: extend the fixture and screenshot list (readiness card, live pill with a stubbed `window.Capacitor.Plugins.WatchBridge` that emits a few events, finish heart card).

### 6.9 Privacy and copy

Carry Watch-test's stance into M/ARC: no internet permission is added; readings stay on the device; diagnostics never include bpm values or addresses; the rationale activity text lists heart rate and Bluetooth; Settings explains what the watch is used for in one sentence. All coaching copy stays plain words: "resting heart rate is up", not "autonomic".

### 6.10 Energy: user profile and active calories

**What the profile must hold.** Heart rate alone cannot give calories; the formula needs sex, body weight and age, and the resting-metabolism correction also needs height. So the profile carries `bodyWeightKg`, `heightCm`, `sex`, `birthYear`. Weight and height already exist; `sex` exists but is only written by the body-fat sheet (`Body.tsx:119`); `birthYear` is new. When any of the four is missing the energy functions return `null` and the UI shows "Add your profile to see calories" with a link to Settings, never a number.

`src/brain/energy.ts` (pure, tested)

- `age(profile, today)`: from `birthYear`; null when absent.
- `bmrKcalPerDay(profile)`: Mifflin-St Jeor. Male `10·kg + 6.25·cm − 5·age + 5`; female `10·kg + 6.25·cm − 5·age − 161`. `restingKcalPerMin = bmr / 1440`.
- `grossKcalPerMin(bpm, profile)`: Keytel 2005 without VO₂max (Appendix B), clamped at 0.
- `sessionEnergy(series, profile, quality)`: integrate `grossKcalPerMin` over each valid minute of the 5-second series (interpolate gaps ≤ 5 s; longer gaps take the session's median rate while `quality ≥ 0.8`; below 0.5 return null). `activeKcal = grossKcal − restingKcalPerMin × minutes`, floored at 0. Band ±25 %. `source: 'heart_rate'`.
- `energyFromWatch(startKj, endKj)`: the BLE energy field is a cumulative kJ counter that can reset or wrap; use it only when both ends exist and `end ≥ start`; `activeKcal = (end − start) / 4.184`; band ±10 %; `source: 'watch_energy'`.
- `energyFromHealthConnect(activeKcalInRange)`: from a new `readRange(start, end)` plugin method that aggregates `ActiveCaloriesBurnedRecord` over the session window (the current `readSummary` sums two whole days, which is useless per session). Band ±10 %; `source: 'health_connect'`.
- `pickEnergy(candidates)`: precedence Health Connect for the session window → watch energy field → heart-rate formula. One source per session, never summed. **Verified on the GT6 (Appendix E): the packets carry no energy field, and Huawei Health currently shares steps but no active calories to Health Connect, so in practice the heart-rate formula will be the working source until that sharing changes; the finish card must say "estimated from heart rate".** The chosen source is shown in the finish card ("from your watch" / "estimated from heart rate").
- `dailyActiveKcal(healthDays, day)` and `weeklyEnergy(sessions, weekStart)` for the charts.

**Surfaces**

- **Train live**: running active-kcal counter next to the bpm pill, updated per minute from the same integration; hidden until the profile is complete.
- **Finish screen**: "About 280 to 380 kcal" as the stat, a burn curve (kcal per minute over the session, drawn from the stored 5-second series) under the heart-rate trace, and the source line.
- **History**: session card shows `~310 kcal`; Stats gets a weekly active-calorie bar beside volume, and a 4-week trend.
- **Today**: "Active today" only when Health Connect provides a daily total; the app cannot know about activity outside sessions and must not pretend to.
- **Coach**: no rule reasons from calories. One data nudge (`data.profile`, priority 58): "Add birth year and sex to unlock calories and heart-rate zones".

**Reliability order**: the heart-rate formula is the least reliable of the three sources during lifting, because straining raises heart rate without a matching rise in oxygen use; it exists so the number is never blank, and the coach never reasons from it.

**Copy rules**: always "about" and a range; whole numbers; "estimate" in the hint; gross vs active explained once in the finish card hint ("Active calories leave out what your body burns at rest, so they match your watch").

**Tests**: `tests/energy.test.ts` for Mifflin-St Jeor, Keytel per sex, active never above gross, null on missing profile, gap interpolation and the quality thresholds, kJ wrap and reset handling, source precedence, weekly aggregation.

### 6.11 Muscle recovery model v2 (impulse-response, per muscle)

**Why the current model is weak.** `recovery.ts` takes the last day a muscle was trained, averages the effort of that day, maps it to a 24 to 72 h window, and fills the percentage linearly. It ignores how many sets were done (one easy set and eight sets to failure at "ideal" average land in the same window), how heavy the work was relative to the user, exercise type, novelty, muscle differences, and it resets fatigue on the next session instead of adding to it. The linear fill also misstates the shape: most recovery happens in the first six hours, while high-volume, failure or eccentric-heavy work leaves deficits past 48 to 72 h.

**What the research supports (Appendix C).** Proximity to failure is the largest single driver (failure roughly doubles recovery time at equal volume). Volume extends recovery beyond 72 h while heavy low-rep work stopped short of failure recovers within a day. Eccentric emphasis and long-muscle-length work add 30 to 50 %. Arms and hamstrings are more damage-prone than quads; small-muscle "fast recovery" is folklore. Trained lifters recover roughly twice as fast as novices, and a new exercise costs about 1.3x the first times. Sessions stack additively but do not compound. Heart rate, HRV and resting HR recover in about 24 h and do not track muscle recovery, so they belong in a systemic layer. Soreness peaks later than strength loss and is a poor readiness marker; a perceived-recovery rating is a good one. One bad night of sleep does not delay strength recovery; multi-day debt does, modestly.

**Model.** Everything below lives in `src/brain/recovery.ts` (rewritten) plus a small parameter table in `src/data/recovery.ts`, all pure and tested.

1. **Per-set impulse for each muscle the exercise touches**
   `L = r × e × v × x × n`
   - `r` role: primary 1.0, secondary 0.5, stabiliser 0.25 (reuse `rolesFor()`).
   - `e` effort: easy 0.55, ideal 1.0, max 2.0 (from the −8 / −13 / −25 % velocity-loss ratio). Unrated sets count as ideal and lower the confidence label; they never count as easy or max, as today.
   - `v` set size and relative load: `repFactor` ≤ 5 reps 0.8, 6-10 1.0, 11+ 1.2, times `clamp(kg / recentTopKg, 0.7, 1.15)` for weighted work (1.0 for bodyweight and timed work). Sets beyond the sixth hard set for the same muscle in one session are weighted 0.7 (diminishing but still growing cost).
   - `x` exercise damage factor from a new optional `damage` field in `exercises.json`: 1.3 for eccentric or lengthened-position movements (Romanian and stiff-leg deadlift, Nordic and glute-ham curl, good morning, deficit deadlift, Bulgarian split squat, lunges, incline and preacher curls, flyes, pullovers, sissy squat, any "tempo" or "pause" variant), 1.15 for main-pattern lifts done at 5 reps or fewer (heavy strength work), 0.8 for short-range machine or concentric-dominant work (leg extension, sled push and pull, calf machines), 1.0 otherwise. No exercise-name penalty for deadlifts: at equal volume their time course matches squat and bench.
   - `n` novelty: 1.3 on the first exposure to an exercise, 1.15 on the second, 1.0 after; also 1.3 when the muscle has not been trained for 28+ days (repeated-bout effect).
2. **Session dose per muscle**: `A = Σ L` for that session. Its time constant is `τ = τ_base(m) × effortStretch × volumeStretch × priors × systemic`, where `effortStretch` is the impulse-weighted mix of max 1.4 / ideal 1.0 / easy 0.7 (failure lengthens recovery, not just its size), `volumeStretch = clamp(sqrt(hardSetEquivalents / 3), 0.8, 1.6)` (3 sets 1.0, 1 set 0.8, 8 sets 1.6), and `τ_base(m) = 18 h × muscleFactor(m)`.
   - `muscleFactor` in `data/muscles.ts`: quads 1.0; hamstrings, adductors 1.2; chest, upper chest, lats, biceps, triceps, brachialis, lower back 1.1; delts, traps, mid back, glutes, abductors, rotator cuff 1.0; calves, forearms, abs, obliques, core, hip flexors 0.8. These are small priors; calibration does the rest.
   - `priors`: training age under 6 months 1.5, 6 to 24 months 1.2, over 2 years 1.0 (from `profile.trainingSince`, falling back to the first session date); age +5 % per decade over 40, cap 1.3, and the coach never cites age in copy below 60 because no trial supports an age rule for 40 to 59; sex prior 1.0 by default (one small study found slower lower-body recovery in women, a 2025 review found no consistent difference), learnable only. All bounded and overwritten by calibration.
   - `systemic` (day-level, from 6.4 readiness inputs): 7-day mean sleep under 6.5 h 1.1; HRV or resting-HR 7-day mean more than 0.5 SD outside the 28-day baseline 1.1; 7-day to 28-day training-load ratio above 1.3 up to 1.25; product capped at 1.25. A single bad night or one low HRV reading changes nothing.
3. **Decay, two components**: `residual(t) = A × (0.35 × e^(−t / 6 h) + 0.65 × e^(−t / τ))`. Fast metabolic and neural recovery in hours, slower damage recovery in days.
4. **Stacking**: keep every impulse from the last 7 days per muscle and sum their residuals: `F_m(t) = Σ residual_i(t)`. Training at 70 % recovered pushes the percentage down and extends time to ready; it does not multiply the new session's damage. Store impulses, not a single number, so calibration can recompute with a new `τ`.
5. **Percentage**: `pct = 100 × (1 − F_m(t) / F_ref(m))`, clipped 0 to 100, where `F_ref(m)` is the rolling median dose of that muscle's last eight sessions (minimum one ordinary 3-set ideal session), so a light session shows partially recovered rather than "destroyed", and an ordinary hard session lands near 0 % immediately. Hard floor: 100 % after 7 days. Time-to-ready is capped at 120 h so stacking cannot produce absurd windows.
6. **Thresholds**: `ready` (ready for hard work) at ≥ 90 %, `full` at ≥ 97 %. With `τ_base = 18 h`: an ordinary 3-set easy session is ready at about 24 h, ideal at about 34 h and full at about 55 h, max at about 47 h and full at about 77 h, eight max sets ready at about 75 h. These reproduce the 24 / 48 / 72 h intuition while separating "can train productively" from "fully recovered".
7. **Check-in and override**: a per-muscle soreness prompt (chips for muscles trained in the last 48 h, 1 to 5) caps a muscle at 60 % for the day when soreness is 4 or 5 and counts as a calibration observation ("still sore at the next session" means `τ` was too short). A "Mark as fresh" override on the muscle sheet, as Fitbod, RP and JuggernautAI provide, sets the residual to zero and is logged as an observation. Soreness alone never marks a muscle unrecovered, and no soreness never implies ready.
8. **Calibration (two-sided, bounded, slow)**: after each session, for each primary muscle, compare performance at matched effort (e1RM, or reps at the same load for bodyweight) with the predicted percentage at session start. Performance down 5 % or more while predicted ≥ 85 % → `τ_scale(m) × 1.1`. Performance held or improved while predicted ≤ 65 % → `τ_scale(m) × 0.92`. Bound 0.7 to 1.6. Store `recoveryModel: { tauScale: Record<MuscleId, number>; observations: Record<MuscleId, number>; exerciseDamageScale: Record<string, number> }` in `AppState`. The existing `personalWiden()` idea survives as this loop, made two-sided. Confidence label: 0 to 2 observations low, 3 to 7 medium, 8+ high.
9. **Heart rate**: never touches `τ` or `A` per muscle. It feeds the systemic layer only: Edwards TRIMP from the live stream (minutes in 50-60 / 60-70 / 70-80 / 80-90 / 90-100 % HRmax weighted 1 to 5) or, without a watch, a session-RPE proxy (max / ideal / easy share weighted 10 / 7 / 4 × minutes), into ATL (7-day) and CTL (42-day) exponentially weighted averages and the 7-to-28-day ratio used by `systemic`. Between-set heart-rate recovery is a within-session readiness marker (6.4), not a recovery input.

**Output shape** (extends `MuscleRecovery`, keeps every existing field):

```ts
export interface MuscleRecovery {
  muscle: MuscleId; pct: number; hoursLeft: number; windowHours: number; lastTrainedAt: string | null; lastDay: string | null;
  personalized: boolean; recovering: boolean;              // unchanged, so Today, Body and MuscleMap keep working
  ready: boolean;                                            // pct >= 90
  readyInHours: [number, number] | null;                    // range: tau × 0.85 to tau × 1.15 solved for 90 %
  fullInHours: number | null;                               // solved for 97 %
  confidence: 'low' | 'medium' | 'high';
  drivers: Array<{ text: string; hours: number }>;          // top two: "+18 h: 3 sets to failure", "+6 h: high volume (8 sets)"
  systemicFactor: number;                                   // 1.0 to 1.25, shown once under the map
  peak?: boolean;                                           // soft 48 to 72 h band after a hard session, display only
}
```

**Surfaces**: the Body recovery view shows the same map with two legend states (ready at 90 %, full at 97 %), each muscle row shows "ready in 14 to 26 h · medium confidence" and its top driver, the muscle sheet lists the contributing sessions and has "Mark as fresh"; one line under the map reads "Whole body: recovering 10 % slower this week (sleep 6.1 h average)" when `systemicFactor > 1`. Today keeps the compact map. Coach rules read `ready` instead of `pct < 60`.

**Data changes**: `exercises.json` gains optional `damage` (default 1.0) on the listed exercises; `data/muscles.ts` gains `recoveryFactor`; `Profile` gains `trainingSince?: string`; `CheckIn` gains `soreness: Partial<Record<MuscleId, 1|2|3|4|5>>`; `AppState` gains `recoveryModel`. `normalize()` supplies defaults; no version bump.

**Tests** (`tests/recovery.test.ts`, rewrite): single ordinary session ready at about 24 / 34 / 47 h for easy / ideal / max; eight max sets reach about 75 h; two sessions 36 h apart leave more fatigue than either alone; the 7-day floor and 120 h cap; novelty and damage factors; unrated sets count as ideal with low confidence; calibration bounds and direction; systemic factor cap; soreness cap and override; `F_ref` prevents a one-set session from showing 0 %.

**Copy rules**: always a range and a confidence word; name the drivers; "ready for hard work" and "fully recovered" as two states; never "blocked"; weekly hard sets are the main lever the coach points to.

### 6.12 Coach context v2: what the coach sees, what it computes, and how it speaks

The coach can only be as precise as the data it is handed. Today it receives sessions, splits, schedule and custom exercises (`rules.ts:35-42`) and nothing else. This section defines the complete relay from every logged input to the coach, the derived metrics computed once and shared, the insight shape that carries confidence, and the cadence at which the coach speaks. The insight catalogue with evidence thresholds is in 6.13 (from the research pass in Appendix D).

**6.12.1 Data gaps to close first (without these, several insights are impossible)**

| Gap | Today | Change |
|---|---|---|
| Sets have no time | `LoggedSet` (`models.ts:30-36`) has no timestamp; `commitSet` (`session.ts:61-68`) records nothing | Add `at?: string` (commit time) and `restSec?: number` (seconds since the previous commit in this session, capped at 600) to `LoggedSet`, written by `commitSet`. This unlocks rest-interval analysis, time per exercise and per muscle, session density, and pairing sets with the heart-rate series. **A timestamp is only as good as the way the set was logged**: 6.17 classifies every set and session by logging fidelity and decides which computations may use its timing. |
| The session day and time are the logging time | `finishSession` sets `day: dayKey(now)` and `endedAt: now` (`session.ts:138-140`); `startedAt` is when "Start" was tapped | A user who logs at home after midnight files the session on the wrong day, and the recovery clock starts hours late. 6.17 separates `trainedAt` from `loggedAt`. |
| Body weight is a single value | `profile.bodyWeightKg` | Add `weightLog: Array<{ day: string; kg: number }>` (cap 400), written from Settings and from a small "Weigh-in" row on Today once a week; Health Connect `WeightRecord` if present. Keeps `bodyWeightKg` as the latest value. |
| Training age unknown | nothing | `profile.trainingSince?: string` (asked once, defaults to the first session date). |
| Age and sex only partly present | `birthYear` new in 6.1, `sex` only via body-fat sheet | Editable in Settings (6.10); the profile sheet on first watch connect. |
| Per-muscle time | not derivable | Derived from set timestamps: the time between the first and last set of an exercise, attributed by role weight. |

**6.12.2 The relay: `CoachContext` v2**

Built once per state change in `selectors.ts` (using `nowMs` and `today`, fixing W3) and passed to every rule. Nothing in `brain/` reads the store directly.

```ts
export interface CoachContext {
  // raw, as today
  sessions: Session[]; splits: Split[]; schedule: Record<Weekday, string | null>; custom: Exercise[]; today: string; now: number;
  // profile and goal
  profile: Profile; goal: Goal; trainingAgeMonths: number | null; age: number | null;
  // daily signals
  healthDays: DailyHealth[]; checkIns: CheckIn[]; todayCheckIn: CheckIn | null; weightLog: WeightEntry[];
  // model outputs (computed in brain/, memoised in selectors)
  recovery: MuscleRecovery[]; readiness: ReadinessResult | null; deload: Deload | null; volume: MuscleVolumeStatus[];
  metrics: Metrics;                 // 6.12.3, derived once
  // situational
  scheduledSplit: Split | null; activeSession: ActiveSession | null; lastSession: Session | null; lastSessionIsNew: boolean;
  watch: { connected: boolean; lastSessionCoverage: number | null }; profileComplete: { weight: boolean; height: boolean; age: boolean; sex: boolean };
  feedback: InsightFeedback[];
}
```

**6.12.3 Derived metrics: `src/brain/metrics.ts`**

Pure, computed from `sessions`, `healthDays`, `weightLog`, `profile`; every value carries `n` (samples) and a `window` so rules can gate on evidence. All are cheap and memoised in one selector.

- **Per exercise**: e1RM series and 4-week slope (from `trend.ts`), best e1RM, relative strength `e1RM / bodyweight`, rep-range mix vs the goal's range, failure share (share of sets rated max), average rest before sets (needs `restSec`), sessions per week, staleness (weeks the exercise has been in the split unchanged), progression mode history.
- **Per muscle**: weekly effective sets (existing) and 4-week median, sessions per week (frequency), failure share, minutes of work per week (from timestamps and role weights), tonnage, last trained, recovery state, soreness reports.
- **Per session**: duration, work time vs rest time, density (working sets per 10 min), average rest, sets, tonnage, failure share, heart summary and TRIMP when present, time of day, adherence flags (planned vs done exercises, skipped).
- **Across sessions**: adherence to schedule (planned days done, last 4 weeks), streak, gap, session-length trend, time-of-day pattern, weekly tonnage trend, ACWR (7-day vs 28-day load), variety (distinct exercises per muscle).
- **Body**: weight trend (7-day median, weekly rate as percent of bodyweight), body-fat trend, BMI (display only, never advice).
- **Health**: resting-HR 7- and 28-day baselines and trend, sleep 14-day mean and 3-night debt, HRV baseline, HRR60 trend, steps average.
- **Personal relations** (only with enough samples, see 6.13): sleep vs next-day performance ratio, readiness vs performance, rest length vs reps on the same load, time of day vs performance.

**6.12.4 Insight shape v2 (extends `Insight`, keeps every current field)**

```ts
export interface Insight {
  id: string; category: Category; priority: number; title: string; noticed: string; means: string; action: string; exerciseId?: string; muscle?: MuscleId;
  kind: 'alert' | 'progress' | 'plan' | 'praise' | 'tip' | 'data';   // drives colour and where it may appear
  cadence: 'now' | 'pre' | 'post' | 'weekly';                          // 6.12.5
  evidence: { n: number; window: string; confidence: 'low' | 'medium' | 'high' };  // "based on 12 sessions over 6 weeks"
  numbers?: Array<{ label: string; value: string }>;                   // the two or three figures behind the claim, for the sheet
  drivers?: string[];                                                  // plain-words reasons, in order
  unlocks?: string;                                                    // for 'data' insights: what turning this on enables
  validUntil?: string;                                                 // day key; weekly items expire
}
```

Rules declare `minEvidence` and never emit below it; the sheet shows the numbers and the confidence word; ranges are used wherever a model estimate is involved. The coach speaks in one voice and never uses the words "algorithm", "model" or "score" in copy; it says what it saw, what it means and one thing to do.

**6.12.5 Cadence: when the coach speaks**

Three rule sets share the context and the insight shape but run at different moments, each with its own limit, so the Coach tab stops being a static list of three cards.

- **Pre-session brief** (`cadence: 'pre'`, shown as a sheet when a session starts, limit 3): readiness and its drivers, muscles in today's split that are not ready, target adjustments already applied to the plan (hold, reduce, deload), warm-up for the first main lift, one cue for the first exercise, last time's numbers for the top lift.
- **Post-session debrief** (`cadence: 'post'`, replaces the finish screen's bottom half, limit 4): records, what moved vs last time per lift, effort and rest pattern, heart summary and calories, one thing to change next time, and a praise line when adherence or a record deserves it. Stored with the session so History can show it.
- **Weekly review** (`cadence: 'weekly'`, generated on the first app open of a new week, pinned at the top of Coach until dismissed, limit 6): sessions planned vs done, per-muscle sets vs bands and vs last week, records, failure share, average rest, sleep and resting-HR averages, weight trend vs goal, readiness average, next week's one recommendation. Also delivered as an optional notification (F3.8).
- **Now** (`cadence: 'now'`, Today's single card and the Coach list, limit 3 and 5): the existing rules plus readiness, scheduled conflict, overreaching, deload, volume and data nudges.
- **In-session** (`cadence: 'live'`, one line under the open exercise, limit 1): autoregulation after the first working set of a main lift (easy at target reps → suggest +2.5 %; missed by two at max → −5 % and cap at ideal), suppressed on a back-off day.
- **Monthly review** (`cadence: 'monthly'`, first open of a new month, a longer page in Coach): per-lift e1RM change over 4 and 12 weeks, sets per muscle vs band with soreness, adherence, weight trend, one decision per muscle for the next block (+10 % if rising and tolerated, hold if flat, −20 % if marker-flagged). Never a linear projection.

Selection within a cadence: priority, then dedupe by target, then drop snoozed ids, then at most one `praise` and one `data` item per list. A `data` item is the only kind allowed when the coach has nothing else to say, and it must name what it unlocks.

**6.12.6 Showing the coach's eyes (accuracy the user can see)**

- **"What the coach can see"** card on the Coach tab: sets (always), effort ratings (percent rated, last 3 sessions), set timing, watch (connected, coverage last session), Health Connect (last sync, sleep and resting HR present), check-in (today), profile (weight, height, age, sex), weigh-ins. Each missing row says what it unlocks in one line ("Add birth year: calories, heart zones, age-adjusted recovery").
- **Insight sheet**: Noticed, Means, Do next (as today), then "Based on" (numbers, n and window, confidence), then "Why" (drivers), then the feedback row (Helpful, Not now).
- **Train**: every target shows its reason and, where the reason is a model, the confidence word; the rest banner shows why the target is what it is in heart mode.
- **Body**: recovery rows show ranges, confidence and the top driver (6.11).

**Tests**: `tests/metrics.test.ts` for every derived metric with `n` and `window`; `tests/coach-cadence.test.ts` for selection limits, snooze, one praise and one data item, expiry; each rule's `minEvidence` gate.

### 6.13 Insight catalogue: what the coach can say, from what, and when

Each row is one rule object in `RULES` (or one metric in `metrics.ts`). Columns: inputs, trigger and formula, minimum evidence before it may fire, the statement template, and the boundary the coach must never cross. Templates use the two tiers from the research: a **general** statement ("in studies…", available from day one) and a **personal** statement ("in your data…", unlocked by the minimum). Full sources in Appendix D. Every derived number is rounded (e1RM to 2.5 kg) and every estimate carries a range.

**Foundations used by many rows**

- **e1RM**: Epley `kg × (1 + effectiveReps / 30)` with `effectiveReps = reps + RIR` (easy +3, ideal +2, max +0); only sets of 10 reps or fewer, sets of 7 to 10 weighted 0.5; daily e1RM is the best set; trend is the median of the last three sessions. Change is "real" only above two typical errors (personal TE from consecutive-session differences, default 4 %, so about 5 to 8 %). Replaces the current `estimatedOneRm` usage in `history.ts`, which ignores effort.
- **RIR bias**: when two sets of the same exercise at the same load within 14 days differ by one being max, `impliedRIR = reps(max) − reps(other)`; after 3 pairs, shift the label's assumed RIR by the mean bias, capped ±3, recalibrated every 8 weeks. Newer lifters under-estimate reps in reserve by 3 to 4; the coach adjusts silently and explains gently, never "your ratings are wrong".
- **Hard sets and fractional sets**: only ideal and max sets count fully (easy 0.5), primary 1.0, secondary 0.5, stabiliser 0.
- **Fidelity gate**: every row below also obeys the matrix in 6.17.4. Rows that read rest, density, duration, per-set heart data or time under load require `timingTrusted` sessions and `live` sets; rows that read only content accept every logging mode.
- **Within-person relation engine** (one function for sleep, steps, soreness, mood, weight, readiness vs performance): outcome de-trended by its 28-day rolling mean; binned mean difference or Spearman with a 2,000-resample bootstrap 90 % CI; floor n ≥ 15 paired observations to show anything, ≥ 20 to name a direction ("looks like"), ≥ 40 with the CI excluding zero for "consistently"; at least 5 observations per bin; a pre-registered list of inputs (sleep hours, soreness, resting HR, steps, weight trend, readiness) to avoid fishing; at most one new personal pattern per week; wording "a pattern in your data, not proof of cause".

**Pre-session brief** (`cadence: 'pre'`)

| Insight | Inputs | Trigger and formula | Minimum | Says | Never says |
|---|---|---|---|---|---|
| Readiness line | check-in, sleep, target-muscle recovery, resting HR, HRV | 6.4 score; "back off" only if two inputs worse than 1 SD | 14 days of check-ins or sleep; before that raw values with "no baseline yet" | "Sleep 5 h 40 (your usual 7 h 10) and quads at 60 %. Plan: keep top sets at ideal, skip the max set on squats." or "All signals normal. Train as planned." | that readiness predicts today's 1RM; illness or overtraining from one morning |
| Muscles in today's split | recovery v2, split | any primary muscle under 90 % | none (defaults labelled "typical") | "Chest and triceps fresh. Front delts at 70 % after Tuesday's pressing: start overhead work lighter or put it last." | "do not train it"; percent as measured damage |
| Sleep-adjusted expectation | sleep, check-in, planned max sets | two nights > 1.5 h under the 14-night median, or one night < 5 h, and a compound lift with a planned max set | 14 nights | "Two short nights. Compound lifts may feel one or two reps harder; pick the load for ideal effort, not the planned number." | a percentage strength loss; a rest day |
| Working-load target | e1RM trend, goal reps | `load = e1RM_trend / (1 + (n + 2) / 30)`, shown ±2.5 % | 3 sessions with sets ≤ 10 reps at ideal or max in 6 weeks | "Bench e1RM trending 100 → 103 kg. For 5 at ideal, 85 to 87 kg should land right." | a single kg as "your 1RM"; targets from sets over 10 reps or timed sets |
| Soreness swap or trim | per-muscle soreness, last session performance | soreness ≥ 4 **and** last-session e1RM or reps ≥ 5 % below the median of the prior three | one check-in and two sessions of the muscle | "Hamstrings very sore and last RDLs were two reps down. Swap to leg curls today, or do 2 sets instead of 4." Soreness alone: inform only. | injury or damage; a week-long cut from one sore day |
| Warm-up ramp | e1RM, first main lift | 50 % × 8, 70 % × 5, 85 % × 2, rounded to the load step | e1RM exists | "Ramp: 40 × 8, 55 × 5, 70 × 2, then your working sets." | that skipping it is dangerous (it is a small cost) |
| Masters defaults (60+) | age | age ≥ 60 at onboarding | profile | "Guidelines for 60+: 2 to 3 sessions a week, 2 to 3 sets per muscle group, about 2 min rest, load steps of 5 % or less; about 1.0 to 1.2 g protein per kg a day, 1.6 if building muscle." | any age rule for 40 to 59; medical advice |
| What the coach can see | all | completeness of today's inputs; ask for the one missing input with the highest marginal value | always | "Seeing: sets, sleep, resting HR. Missing: today's check-in, so soreness-based swaps are off. 20 seconds to add it." | more than one ask a day; a Health Connect nag more than monthly; that advice is unreliable without a watch |

**In-session** (`cadence: 'live'`)

| Insight | Inputs | Trigger and formula | Minimum | Says | Never says |
|---|---|---|---|---|---|
| Autoregulation after set 1 | effort, reps, target | easy at ≥ target reps → `load × 1.025`; max and reps < target − 1 → `load × 0.95`, cap remaining sets at ideal | a target exists; steps of 2.5 % after 3 sessions, else 2.5 kg | "That felt easy at 80. Try 82.5 for the next set." / "Missed two at max. Drop 5 % for the rest." | an increase on a back-off day; prompts on isolation or timed sets |
| Rest reminder (heart mode) | HR, rest target | 6.4 | LIVE stream | "128 → 105. Ready in about 40 s." | HR as set intensity |

**Post-session debrief** (`cadence: 'post'`)

| Insight | Inputs | Trigger and formula | Minimum | Says | Never says |
|---|---|---|---|---|---|
| Headline with one number | tonnage, split history | tonnage vs median of the last 5 sessions of the split; report only if `|Δ| ≥ 5 %`; standout = set with the highest e1RM relative to trend or a rep record | 3 sessions of the split ("usual"); else absolute numbers | "Upper day done: 8,420 kg, 6 % above your usual. Standout: 5 at 90 on bench, a rep record." | that more tonnage is better on a planned light or deload day |
| Records in three tiers | load, reps, effort | e1RM record if > previous best by ≥ 2.5 % from ≤ 10 reps at ideal or max; rep record at a load; load record | a prior e1RM within 8 weeks; older → "best since <date>" | "Deadlift e1RM about 165 kg, up from 160 three weeks ago (from 3 at 150 at max)." | records from easy sets, > 10 reps, timed or distance sets |
| Effort mix | effort | shares of easy / ideal / max; flag > 50 % max for two sessions of a split, or > 60 % easy across a week | one session; "your usual" after 3 | "Effort mix: 20 % easy, 55 % ideal, 25 % max. Good for growth: stopping one to three reps short grows muscle nearly as well as failure with less fatigue." Strength goal: "Max on the main lift is fine; 60 % max on accessories adds fatigue without strength." | that a set "was" 2 RIR; that novices should chase failure on compounds |
| Rest and density | set timestamps, reps | median rest on compounds; flag when < 90 s **and** reps fell ≥ 25 % first to last set (strength goal: < 120 s) | 3 timestamped sessions; ≥ 4 timestamped working sets | "Median rest before squat sets 75 s (your usual 150 s). Reps fell 8 → 5. On heavy compounds 2 to 3 min keeps reps up." | that 60 to 90 s is "wrong" for an untrained user or for isolation and machine work; judging supersets |
| Duration drift | duration, timestamps | `|Δ| ≥ 20 %` vs the median of the last 5 sessions of the split; attribute to idle gaps > 4 min or to added sets | 5 sessions of the split | "Ran 84 min, 20 over your usual. Most of it was 4 to 5 min gaps between accessory sets. Short on time? Superset the last two." | that long sessions are bad in themselves ("cortisol") |
| Heart cost | HR series, age | avg, peak, minutes above 80 % HRmax, Edwards TRIMP, HRR60 after the hardest set; compare to "your recent" | ≥ 70 % stream coverage; 5 HR sessions for comparisons; HRmax Tanaka ±10 until an observed max | "Average 118, peak 162 on the last squat set. 12 min above 80 % of estimated max. Dropped 28 bpm in the minute after your hardest set, in line with recent sessions." | ranking sessions by HR or TRIMP; a low-HR session as "easy"; the clinical 12 bpm cutoff; health risk |
| Active calories | HR, profile, watch energy, Health Connect | 6.10 | profile complete | "About 280 to 380 kcal (estimated from heart rate)." | calories as a nutrition instruction; reasoning from calories |
| Progress-framed praise | records, adherence, effort vs plan | best true statement in priority: record > planned sessions kept > effort matched to a back-off day > volume target met; one line, no exclamation stacking | a trend needs 3 points; a behaviour any time | "Third week with both leg sessions done, and squat e1RM is up 6 kg since. That consistency is doing the work." | praising max effort on a day the brief said back off; appearance |

**Weekly review** (`cadence: 'weekly'`, only when ≥ 5 logged days exist in the week window)

| Insight | Inputs | Trigger and formula | Minimum | Says | Never says |
|---|---|---|---|---|---|
| Sets per muscle vs band | hard sets, roles, goal, training age | fractional hard sets Monday to Sunday; bands < 4 low, 4-9 maintenance, 10-20 productive, > 20 high (check recovery); top of band scaled down under 1 year of training; spike if > 1.5 × 4-week mean | a full week with ≥ 3 sessions; "low" only after 2 weeks | "Chest 14 hard sets, back 8, hamstrings 4. Hamstrings sit under the range that drives growth; add one RDL set to each lower day." | a fixed "optimal" number; counting easy sets, warm-ups or stabilisers; "more is always better" for advanced users |
| Frequency per muscle | sessions with ≥ 2 primary sets | flag only `freq = 1` and weekly sets ≥ 12 for 2 weeks (strength goal: `freq = 1` on the goal lift with ≥ 8 sets) | 2 weeks | "All 16 quad sets landed on Monday. Splitting across two days keeps set quality up; consider moving leg press to Thursday." | that once a week "does not build muscle" |
| e1RM trend per main lift | e1RM series, body weight | robust slope over 42 days; rising if > +2.5 %, falling if < −2.5 %, else flat; range = min to max of the last 3 e1RMs; relative strength `e1RM / BW^0.67` when weight logged | ≥ 4 points over ≥ 4 weeks from sets ≤ 10 reps; else "building history" | "Squat: rising, +3 kg over 5 weeks (140 to 146). Bench: flat for 6 weeks. Deadlift: not enough heavy sets to judge." | "plateau" from 2 flat weeks; comparing variations as one lift |
| Progress vs training age | e1RM slope, training age | reference bands: year 1 about 2-4 %/month early falling to about 1 %/month; years 2-3 0.5-1 %/month; 3+ years 0.2-0.5 %/month; say on track / faster / slower only when the 90 % CI excludes the band | novice 6 sessions over 3 weeks; intermediate 8 weeks; advanced 12 weeks | "Bench e1RM up 6 % in 8 weeks, a normal pace for a first year. Expect it to slow to a few percent a quarter." | "+2.5 kg every session" as evidence; a cause without the relation engine; a returning lifter measured against a novice curve |
| Rep-range mix vs goal | reps, effort, goal | shares 1-5 / 6-12 / 13+; strength goal: flag if 1-5 share of main-lift sets < 15 %; growth goal: flag only if 13+ share > 70 % **and** those sets are easy | a full week vs the prior 4-week mix | "70 % of sets were 13+ reps. For strength, heavy sets drive 1RM; add one 3-5 rep top set on each main lift." | that high reps "don't build muscle"; a superior "hypertrophy zone" |
| Failure share | effort | `max sets / working sets` per muscle and overall; comment when > 50 % on compounds for 2 weeks, or > 70 % with a strength goal | 1 week with ≥ 12 working sets | "About 60 % of your sets were max. Failure adds at most a little growth, no strength, and more fatigue. Save it for the last set of isolation work." | that failure is necessary or harmful |
| Staleness | e1RM slope, load, effort | slope within ±1.5 % for 6 weeks **and** load unchanged **and** effort ideal or max; also flag the opposite: > 50 % new exercises each week for 3 weeks | 6 weeks | "Incline dumbbell press: same 4 × 10 at 30 kg for 7 weeks. Add a rep, add 2 kg, or swap for a block. Changing everything each session does not help." | "muscle confusion"; a promise that a swap restarts growth |
| Adherence | planned vs done | rolling 28-day rate; flag < 60 % with a scheduling question; acknowledge ≥ 85 %; "weeks on plan" with one free miss per 4 weeks replaces the daily streak | a declared plan and 2 weeks | "3 of 4 planned this week, 12 of 16 over the month (75 %). The missed one is usually Thursday legs. Would Saturday fit better?" | a streak reset to zero for one miss; "habit formed" at 21 or 66 days |
| Body-weight trend vs goal | weight log, goal | EWMA `trend = 0.1 × w + 0.9 × trend`; weekly rate as % of body weight; loss 0.5-1 % ok, > 1 % fast; gain 0.25-0.5 % ok (advanced > 0.25 % fast) | ≥ 7 weigh-ins over 14 days for a trend; 3 weeks for a rate; "unclear" when weekly SD > 1 % and n < 3 weeks | "Trend weight 78.4 kg, down 0.6 % a week over 3 weeks, inside the range that keeps muscle while losing fat. Daily swings of 1 to 2 kg are mostly water." | intake or expenditure from weight; muscle or fat change from the scale; BMI as a verdict |
| Sleep average and regularity | sleep, e1RM | mean and bedtime SD; add the personal link only via the relation engine | 5 of 7 nights; the link needs its own minimum | "Average sleep 6 h 45 (your need about 7 h 30), bedtime varied by 1 h 40. Across 22 sessions your top sets ran about 3 % higher after 7 h or more (looks like)." | causation; wearable stage "quality" |
| Resting-HR trend | daily resting HR | 7-day mean vs 42- or 60-day baseline; flag when above `baseline + max(0.5 × SD, 3 bpm)` for 3 days; "improving" when the 8-week slope is negative | 21 days with ≥ 4 values a week | "Resting HR averaged 58 this week against your usual 53. That often follows a hard week, short sleep or the start of illness. Nothing to do if you feel fine; if it stays up 3 more days, ease the week." | diagnosis; "lower means recovered today"; population norms |
| Overreaching per muscle | e1RM, soreness, resting HR, sleep, mood | markers: (a) performance down two sessions running at ideal or max, (b) soreness ≥ 3 at the next session for 2 weeks, (c) 7-day resting HR ≥ +3 bpm or sleep −45 min, (d) mood ≤ 2 on 4 of 7 days; fire on ≥ 2; cut that muscle's sets 30 % | 3 weeks of sessions, 10 days of check-ins; RHR marker needs 14 days | "Quads: down two sessions in a row despite max effort, soreness not clearing, resting HR up 4. Cut quad sets by a third next week; keep the rest." | "overtraining syndrome"; firing on soreness alone or during a reported illness or trip |
| Deload recommendation | e1RM, effort, soreness, resting HR, tonnage | reactive only: (a) ≥ 2 main lifts down ≥ 3 % over 3 weeks at ideal or max, (b) failure share ≥ 40 % for 2 weeks, (c) soreness ≥ 3 on 10 of 14 days, (d) 7-day resting HR ≥ +3 bpm, (e) tonnage per session down ≥ 10 % at similar effort; fire on ≥ 2; deload = sets × 0.5, loads 60-70 % of recent top, 5 to 7 days, retest | 4 weeks of main lifts and 2 weeks of check-ins | "Over 3 weeks squat and bench e1RM down 4 %, max sets up to 45 %, soreness above 3 on 9 of 14 days, resting HR +4. Suggest a lighter week: same lifts, half the sets, easy effort, then retest." | a calendar deload as evidence-based; that it will grow muscle; a deload for a novice on linear progress |
| Readiness vs performance | readiness, e1RM | Spearman daily and weekly; weak < 0.3, moderate 0.3-0.5, strong > 0.5, as words | ≥ 30 paired days; weekly view after 8 weeks | "Over 8 weeks your morning readiness explained little of day-to-day squat performance. Your weekly average did track your weekly e1RM. Use it for the week, not the day." | skipping on low readiness when the user's own link is weak; injury prediction |

**Ad hoc** (`cadence: 'now'`)

| Insight | Inputs | Trigger and formula | Minimum | Says | Never says |
|---|---|---|---|---|---|
| Plateau with one lever | e1RM, sets, effort, weight, sleep, staleness | slope within ±1.5 % over 8 weeks with ≥ 6 heavy sessions; levers ranked: sets < 10 → add volume; failure share > 50 % with ≥ 10 sets → reduce effort; weight trend ≤ −1 kg → note diet; sleep < 6.5 h → sleep; stale ≥ 6 weeks → swap; show only the top one | 8 weeks | "Overhead press flat for 8 weeks. Volume is 6 sets a week while effort is mostly max. Most likely lever: add 3 to 4 sets at ideal across two days." | several levers at once; "plateau" at 3 weeks |
| Heart-rate recovery trend | HRR60 series | monthly median of HRR60 for sets with peak ≥ 75 % HRmax; report a change ≥ 5 bpm | ≥ 20 valid sets over ≥ 8 weeks | "After your hardest set, heart rate now drops about 30 bpm in the first minute, up from 22 three months ago. Faster recovery usually reflects improving conditioning." | mortality or heart health; population norms |
| HR at a fixed load | per-set peak HR, load, reps | same exercise within 5 % load and 2 reps; 4-week mean vs the earlier 4 weeks; flag ≥ 5 bpm | ≥ 6 comparable sets over ≥ 4 weeks | "At 80 × 8 on leg press your peak is now 148 vs 156 six weeks ago; identical work is getting easier for your heart." | HR as lifting intensity |
| Steps as recovery context | steps, split | yesterday ≥ 1.8 × 14-day median and a lower-body split today; adds 10 % to lower-body fatigue in 6.11 | 14 days of steps | "22,000 steps yesterday, double your norm. Legs may feel heavier than the model expects; treat the first squat set as the test." | active calories as accurate or as a nutrition instruction |
| Strength placement (optional, see decision 12) | e1RM, sex, body weight | compare `e1RM / BW` with a named public table for sex and weight class; show as a band with the source | 2 qualifying sets in 2 sessions within 14 days; "estimate" until a ≤ 5-rep max set exists | "Your 100 kg squat sits around the intermediate band for a 75 kg man on [table], roughly the middle of people who log their lifts." | "weak or strong for your genetics"; a health metric; mixing tables; an invented age adjustment |
| Sex and cycle (what is supported) | sex | population statements only | none | "Women and men gain muscle at the same relative rate, and women often gain upper-body strength faster in relative terms." If cycle data is logged: "Pooled studies show at most a trivial dip around the early follicular phase and huge person-to-person variation, so I won't change your programme by phase. After a few cycles I can look at your own pattern." | higher reps or shorter rests "for women"; sex-specific recovery windows; phase-based programming |
| Effort calibration | RIR bias | after 3 pairs, bias ≥ 2 reps | 3 pairs | "You logged ideal at 60 × 8, then hit 60 × 12 at max two sessions later. You had more in reserve than you thought, which is normal early on; I'll treat your ideal sets as a little easier when estimating your max." | "your ratings are wrong"; precise %1RM from labels |

**Boundaries the coach never crosses** (checked in tests as forbidden phrases and forbidden rule outputs): calories or "fat burned" as facts; intake or energy balance from weight; muscle gain from the scale; HR or TRIMP as set intensity or session quality; HRV or resting HR as muscle recovery; the 12 bpm clinical HRR cutoff or any health-risk language; ACWR as injury risk; calendar deloads as evidence-based; menstrual-phase programming; age or sex as limits on what the user can lift; BMI in coaching language; a personal pattern from under 15 paired observations; causal language for correlations; more than one action per insight; deficit or guilt framing.

**Novice vs advanced verbosity**: under 1 year of training the coach shows the simpler set (adherence, effort mix, records, readiness, muscles today, load targets); density, heart cost, readiness-vs-performance, staleness and strength placement are opt-in until then. Thresholds and vocabulary (five readiness words, the three effort words, the volume band names, rising / flat / falling) are fixed and published on the "How the coach thinks" screen; they never change silently.

### 6.14 Onboarding: the "help the coach know you" sheet and the profile dashboard

**Why.** Every accuracy gain in this plan depends on four profile facts (body weight, height, birth year, sex), a goal, a training-since date and a weigh-in habit. Today a fresh install silently defaults to the "lean" goal (`models.ts:154`), never asks for any profile field, and hides weight and height in a Settings sheet. The coach then reasons from defaults without saying so.

**Trigger.** A `profileComplete` selector marks each field present or missing. The sheet appears when: the state is fresh or legacy-imported and the profile is incomplete (first launch); a returning user still has a required field missing and has not dismissed the sheet in the last 14 days (at most 3 dismissals, then only the "What the coach can see" row keeps asking); a watch connects for the first time (6.10); or 90 days have passed since the last profile review ("still accurate?" pass, see 6.15). State: `onboarding: { completedAt?: string; dismissedAt: string[]; lastReviewAt?: string }`.

**Sheet copy (plain words, one screen).**

> **Help the coach know you**
> The coach already learns from every set you log. A few details about you make its advice fit you: calories, heart-rate zones, recovery time and strength trends all depend on them.
> Takes about a minute. Everything stays on this phone.
> [Add my details]  [Later]

For a returning user with partial data the second line becomes: "Two details are missing: birth year and height. Without them the coach cannot show calories or heart-rate zones." For the 90-day review: "It has been three months since you checked your details. Still 75 kg and training four days a week?"

**Profile dashboard** (`src/slices/profile/Profile.tsx`, reachable from the sheet, from Settings, from the "What the coach can see" card and from the Today greeting when incomplete). One screen with a completeness bar ("5 of 7 details") and sections; every field states what it unlocks and when it was last updated:

| Section | Fields | Unlocks (shown under the field) |
|---|---|---|
| About you | birth year, sex, height | calories, heart-rate zones, age-adjusted recovery, relative strength |
| Body | current weight with a weigh-in log (date, kg) and a "Weigh in" button; body-fat readings link | active calories, relative strength trend, weight trend against your goal |
| Training | goal (the four cards from Coach), training since (month and year, or "I'm new"), planned days per week (pre-fills the schedule), preferred session length | rep targets and rest defaults, progress-rate expectations, adherence, volume bands |
| Watch and health | connect watch, Health Connect permission, auto-sync | heart-rate rest, session cost, readiness, resting heart rate and sleep trends |
| Check-ins | daily check-in on or off, per-muscle soreness on or off | readiness, soreness-based swaps, recovery calibration |

Rules: nothing is mandatory to use the app; "Later" always works; required-for-coach fields are marked "needed for: …"; the Settings Profile section becomes a link to this dashboard so there is one place to edit. Weight entered here also goes to `weightLog`. A typo guard asks once when a new weight differs more than 10 % from the last.

**Tests**: sheet shows on fresh state and not after completion; dismissal count and 14-day suppression; 90-day review trigger; completeness selector; typo guard; gate screenshots of the sheet and the dashboard in all five themes.

### 6.15 Profile history: recording changes, propagating them, and telling the user what changed

**The requirement.** When a user changes a fact about themselves (75 kg in June, 70 kg in September; a new goal; a corrected height; a new training-since date), the app must (a) keep the history, (b) use the new value everywhere the current state is computed and the historical value where the past is described, and (c) either give feedback on what the change means or, at minimum, confirm which computations now follow the new input.

**Data.**

```ts
export type ProfileField = 'bodyWeightKg' | 'heightCm' | 'birthYear' | 'sex' | 'goal' | 'trainingSince' | 'plannedDays' | 'weightUnit' | 'restDefaultSec';
export interface ProfileChange { at: string; field: ProfileField; from: unknown; to: unknown; source: 'user' | 'onboarding' | 'health_connect' | 'migration' }
// AppState gains: profileHistory: ProfileChange[] (cap 500). Weight changes are also appended to weightLog.
```

`src/brain/profile.ts` (pure): `profileAt(state, day)` rebuilds the profile as it was on a given day by replaying `profileHistory`; `ageAt(profile, day)`; `weightAt(weightLog, day)` (nearest earlier weigh-in, else the first); `profileDiff(history, sinceDay)` for the feedback rule.

**Propagation contract.** Every derived value in the app is a Preact `computed` over `state`, so a profile change re-derives readiness, recovery priors, zones, targets and metrics automatically; there is no cache to invalidate. Two exceptions are stored, not derived, and are deliberately frozen: a finished session's `energy` (computed with the weight, age and sex valid that day; recomputing history when the user updates their weight would rewrite the past) and its `heart` summary. Each `SessionEnergy` therefore carries `profileSnapshot: { kg, age, sex }` so History can say "estimated with 75 kg at the time". The implementer wires each field to its consumers from this table and the test suite asserts it:

| Field | Uses the **current** value | Uses the value **valid at the time** |
|---|---|---|
| bodyWeightKg | live calorie counter, next target for bodyweight lifts (relative), readiness (none), strength placement, weight-trend rule | relative-strength trend per session, historical calories (frozen) |
| heightCm | resting metabolism in the live counter, body-fat estimate | frozen in past energy |
| birthYear | HRmax and zones, recovery age prior, masters defaults | frozen in past energy; HRR comparisons use the zones of the day |
| sex | calorie formula, recovery prior (neutral by default), strength placement table | frozen in past energy |
| goal | rep ranges, rest default suggestion, heavy-share and failure-share targets, volume band for main lifts, weight-rate target, templates offered | rules that judge a past week use the goal active that week (`profileAt(weekStart)`) |
| trainingSince | progress-rate bands, recovery training-age prior, novice mode | historical bands for past reviews |
| plannedDays | adherence denominator, streak, reminders | adherence of past weeks uses the plan then |

**Feedback rule** (`profile.changed`, cadence now, priority 260, `validUntil` 7 days, at most one per field per change). Templates:

- Weight: "You updated your weight to 70 kg, down 5 kg (6.7 %) since 12 June. Squat is now 1.9× body weight, up from 1.7×. Calories, heart-rate zones and recovery now use 70 kg." If the change is larger than 5 % with no weigh-ins between: "A weekly weigh-in lets the coach show the trend, not just the jump." If it conflicts with the goal (growth goal, weight down 3 kg): an observation, never a scolding: "Weight is down while your goal is growth. If that is intended, keep going; if not, the weekly review will watch the rate."
- Goal: "Goal changed to Strength. Main lifts now target 1 to 5 reps, accessories 6 to 12. Suggested rest 150 s (tap to apply). Weekly target for each main lift: 3 to 10 hard sets. Your splits keep their exercises."
- Birth year or height: "Now using age 34: estimated max heart rate 184, zones updated."
- Training since: "Set to January 2023 (about 2 years 8 months). Progress expectations now use the intermediate range."

**Confirmation on save** (the minimum guarantee): a toast on the dashboard, "Saved. The coach now uses 70 kg for calories, zones, recovery and strength trends", listing only the consumers of the field that changed; and the "What the coach can see" card shows "updated today" beside the field.

**Tests**: `profileAt` replay; frozen session energy vs live recompute; each field's consumer list (a table-driven test that flips the field and asserts which selectors change and which do not); the feedback templates; the typo guard; migration writes a `migration` history row for the goal so onboarding asks about it.

### 6.16 Goal audit: what the goal does today, what is wrong, and how it should link the app

**Findings** (from the code at `245c26a`):

| # | Finding | Evidence | Effect |
|---|---|---|---|
| G1 | The goal reaches exactly one function | `grep goal src`: `progression.ts:41-45` (`repRange`) and display in `Coach.tsx`, `Train.tsx:95`; nothing in `rules.ts`, `balance.ts`, `weekly.ts`, `exposure.ts`, `templates.ts`, `cues.ts`, `session.ts` | The goal changes rep targets and nothing else |
| G2 | `rir` is never read | `data/goals.ts:13`; no other reference in `src/` | The Coach sheet says "Your goal changes rep targets and the effort window" (`Coach.tsx:83`); the second half is untrue |
| G3 | Only one goal has an accessory range | `goals.ts:18-21`: `accessoryReps` exists for `strength_muscle` only | Under `strength` (1-5) a lateral raise, curl or leg extension is prescribed 1 to 5 reps; under `growth` a squat and a curl get the same 6 to 15 |
| G4 | Main-lift detection is a regex on pattern names | `progression.ts:43` matches `squat|hinge|horizontal_push|vertical_push|vertical_pull|horizontal_pull`; library patterns include `incline_push` (4 exercises), `lunge` (3), `single_leg_squat` (2), `hip_extension` (3) | Incline presses are treated as accessories; every custom exercise has `pattern: 'other'` and is always an accessory |
| G5 | The step-down rule cannot fire for low rep ranges | `progression.ts:105`: `belowAtMax = hasMax && topReps < range[0]`; with `strength` `range[0] = 1` | A failing lifter under the strength goal is never told to take a step down |
| G6 | Rest default ignores the goal | `freshState` `restDefaultSec: 90` (`models.ts:163`); no goal-based suggestion | Strength work benefits from 2 to 3 min rests; the app keeps 90 s for every goal |
| G7 | Templates, volume, failure share, frequency and balance ignore the goal | `templates.ts` (one PPL set), no volume or failure rules yet | "Strength" users get a bodybuilding split by default and no heavy-set guidance |
| G8 | "Lean muscle" has no body-side meaning | nothing reads `goal` outside progression | A goal named for definition never looks at weight trend or body fat |
| G9 | Default goal is set silently | `models.ts:154` `goal: 'lean'`; legacy `trainingProgram` copied only if it is already a valid id (`migrate.ts:226`), otherwise silently `lean` | Users who never opened the Coach tab are on a goal they did not choose |
| G10 | e1RM ignores effort | `core/units.ts:19-21` | Already listed as improvement 10; it also makes goal-aware progress statements noisier |

What is right: the double-progression logic itself (reps first, then load), the refusal to increase on max effort or missing effort, re-entry after 28 days, and the 10 % cap on load jumps are goal-neutral and sound. The four rep ranges are defensible against the load meta-analyses (hypertrophy similar from about 6 to 30 reps near failure; strength needs heavy sets).

**Fix: make the goal a small policy object that every goal-aware rule reads** (`data/goals.ts`):

```ts
export interface Goal {
  id: GoalId; name: string; tagline: string; bestFor: string;
  mainReps: [number, number];        // lean 6-12, growth 6-15, strength_muscle 4-8, strength 1-5 (unchanged)
  accessoryReps: [number, number];   // NEW for every goal: lean 8-15, growth 8-20, strength_muscle 8-12, strength 6-12
  rir: [number, number];             // now used: the effort target shown in copy and by the effort-mix rule
  restDefaultSec: number;            // lean 90, growth 90, strength_muscle 120, strength 150 (suggested on goal change, never applied silently)
  heavyShareMin?: number;            // strength 0.40, strength_muscle 0.25 of main-lift sets at ≤ 5 reps (weekly rep-mix rule)
  failureShareCap: number;           // strength 0.30 on main lifts, strength_muscle 0.40, growth 0.50, lean 0.50
  mainLiftWeeklySets?: [number, number]; // strength 3-10 direct hard sets per main lift per week
  weightRatePctPerWeek?: [number, number]; // lean −1.0..−0.5, growth +0.25..+0.5, strength_muscle 0..+0.25, strength −0.25..+0.25
  templates: SplitTemplateKey[];     // strength: full-body A/B or upper/lower with main lifts first; others: PPL
}
```

- **Main vs accessory** becomes an explicit `role: 'main' | 'accessory'` on each library exercise (`exercises.json`), derived once from the pattern list `squat, single_leg_squat, lunge, hip_hinge, hip_extension (barbell hip thrust only), horizontal_push, incline_push, vertical_push, vertical_pull, horizontal_pull` and hand-checked; the custom-exercise picker gains a "Main lift or accessory" choice (G4). `repRange()` reads the role.
- **Step-down for low ranges** (G5): when `mainReps[0] ≤ 2`, the reduce trigger becomes "e1RM at max effort down ≥ 5 % on two consecutive sessions" instead of "reps under the range"; the existing rule stays for ranges starting at 4 or more. Test both.
- **RIR in copy and rules** (G2): the Coach goal card reads "1 to 5 reps on main lifts, 6 to 12 on accessories, aim for 1 to 3 reps left"; the effort-mix and failure-share rules use `failureShareCap` and `rir`; the `increase` fast-track (`allEasy`) is unchanged.
- **Rest default** (G6): on goal change the feedback insight offers "Apply 150 s rest" as a one-tap action; Settings shows the goal's suggestion beside the current value.
- **Goal-aware coach rules** (G1, G7, G8) reuse the catalogue in 6.13: rep-range mix vs goal (`heavyShareMin`), failure share (`failureShareCap`), frequency suggestion for the goal lift, volume band for main lifts (`mainLiftWeeklySets`), rest adequacy threshold by goal (120 s for strength goals, 60 s otherwise), weight trend vs `weightRatePctPerWeek` from the weight log, and for `lean` a monthly body-fat reminder that links to the existing estimate. Balance stays goal-neutral.
- **Templates** (G7): `templates.ts` gains a strength-oriented pair (Full body A: squat, bench, row, plus two accessories; Full body B: deadlift, overhead press, pulldown, plus two) and an upper/lower pair; `addTemplates()` offers the set named in the goal; PPL stays for lean and growth.
- **Ask the goal** (G9): the onboarding dashboard (6.14) asks it; a legacy import writes a `migration` history row so the coach's first data nudge is "Confirm your goal"; the Today card for a fresh state says "Goal: not set" instead of implying lean.
- **Copy**: the Coach sheet line becomes "Your goal sets rep targets, effort target, rest suggestion, weekly heavy-set and volume guidance and the weight trend the coach watches. It does not change your exercises."

**Linked-feature check after the fix** (what must agree with the goal, asserted by `tests/goal.test.ts` for each of the four goals): `suggestNext` ranges for a main lift, an accessory, a bodyweight and a timed exercise; the step-down path; the rest suggestion; the effort-mix rule's cap; the rep-mix rule's heavy share; the volume band for main lifts; the weight-trend rule's target band; the templates offered; the Coach card and Train hint copy. A goal change must produce exactly one `profile.changed` insight and recompute every target on the Train screen.

### 6.17 Logging fidelity: recognising how a session was logged and gating every computation on it

**The problem.** The app has one way to record a workout: tap Start, log sets as they happen, tap Finish. Many users do not log that way. They log a few sets late while resting, or the whole session at home an hour later, or from memory the next morning. Today all of those produce a session whose `startedAt`, `endedAt`, `durationSec` and (after 6.12.1) set timestamps describe the *logging*, not the *training*. A session logged at home in four minutes would show 5-second rests, a 4-minute duration, a recovery clock starting three hours late, and, if the watch happened to be on, no heart data. The plan's timing-based insights (rest, density, duration drift, per-set heart peaks, per-muscle minutes) would be wrong with confidence.

**The principle.** Content data (which exercise, kg, reps, effort) is trustworthy in every logging mode, with a small memory penalty for retrospective entry. Timing data (when, how long, how much rest, which heart-rate samples belong to which set) is trustworthy only when the set was logged as it happened. So the app must (1) know how each set and session was logged, (2) let the user say when they actually trained, and (3) let every computation declare which fidelities it accepts.

**6.17.1 Data**

```ts
export type SetFidelity = 'live' | 'delayed' | 'retro' | 'edited';
export type SetFlag = 'implausible_load' | 'implausible_reps' | 'unit_suspect' | 'duplicate' | 'future_time';
// LoggedSet gains: at?: string; restSec?: number; fidelity?: SetFidelity; flags?: SetFlag[]
export interface SessionLogging {
  mode: 'live' | 'mixed' | 'retro' | 'legacy';
  trainedAt: string;            // when training started; from the timer, or from the user in the retro flow, or the schedule time, or 17:00 local
  trainedEndAt: string;         // from the timer or the user's duration
  loggedAt: string;             // when Finish (or Save) was tapped
  timeSource: 'timer' | 'user' | 'schedule' | 'default';
  liveShare: number;            // share of sets with fidelity 'live'
  timingTrusted: boolean;       // mode live and liveShare ≥ 0.7 and no burst pattern
  contentConfidence: 'high' | 'medium' | 'low';
  flags: string[];              // 'compressed', 'burst', 'midnight_crossing', 'edited_later', 'implausible_sets:3' ...
}
// Session gains: logging: SessionLogging. `day` is derived from trainedAt, never from loggedAt. `durationSec` is trainedEndAt − trainedAt.
```

**6.17.2 Classifier** (`src/brain/fidelity.ts`, pure, tested). Runs at `commitSet` (per set) and at `finishSession` (per session), and again for any set edited in History.

Per set, from the gap since the previous commit in the same session:

- `live`: the gap is plausible for real training, 20 s to 12 min (a rest, a set, or an exercise change), **or** it is the first set and the session timer had been running at least 30 s.
- `delayed`: the set is part of a burst, three or more commits within 15 s, or a gap under 20 s after the previous set of the same exercise (nobody finishes a working set, rests and finishes another in 19 s), or the set was committed more than 12 min after the previous one while the app was in the background the whole time (the user caught up). Content is kept; timing is not trusted for this set and its neighbours.
- `retro`: every set of a session created through the "Log a past session" flow, or a live session the finish flow converted (below).
- `edited`: any set whose kg, reps, effort or duration changed in the History editor after the session ended; `editedAt` recorded. Content is trusted (the user corrected it); the set's timing is not.

Per session:

- `compressed` when `loggedDuration < workingSets × 40 s` (twenty sets in under 13 min is not a workout) or when 60 % or more of commits are in bursts.
- `mode = 'live'` when not compressed and `liveShare ≥ 0.7`; `'mixed'` when `liveShare` 0.3 to 0.7 (typical: started live, finished at home); `'retro'` when compressed, or created through the past-session flow; `'legacy'` for every session imported from v36 (no set timestamps exist; `trainedAt` from the legacy record, times approximate).
- `midnight_crossing` when `trainedAt` and `loggedAt` fall on different local days; `day` follows `trainedAt`.
- Plausibility flags per set (scenario 4 and honest mistakes): `implausible_load` when kg exceeds the exercise's best by more than 25 % in one step or exceeds 500 kg; `implausible_reps` when reps exceed 50 (or 30 for a main lift at a load above 70 % of e1RM); `unit_suspect` when a value is within 5 % of 2.2× or 0.45× the previous load for that exercise (kg and lb mixed); `duplicate` when a whole session matches another on the same day; `future_time` when `at` is after now. Flagged sets stay in history but are marked and excluded from records and trends until confirmed.

**6.17.3 Flows the user sees**

- **Finish a compressed live session**: instead of saving silently, the finish sheet says "Looks like you logged this after training. When did you train?" with a start-time picker (defaulting to the scheduled time for that day, else 17:00), a duration slider (default the user's median live duration, else 60 min) and "I trained just now" for the rare genuine short session. The session becomes `retro` with `timeSource: 'user'`. Never blocks: "Skip" saves with `timeSource: 'schedule'` or `'default'` and a wider uncertainty.
- **Log a past session** (new button in Train beside Start): choose the split, the day, start time and duration, then the same set-entry grid without the timer or rest banner; every set is `retro`. Sets are committed together on Save; `restSec` and `at` are not written.
- **Caught-up sets mid-session** (scenario 2): nothing to ask; the classifier marks the burst as `delayed`. The rest banner, when auto-rest is on, does not restart on a delayed commit (otherwise catching up on three sets starts three rest timers); it restarts only on a `live` commit.
- **History**: a small tag on the session card, "logged later" or "partly logged later", and "times approximate" in the detail; edited sets show a pencil mark.
- **Coach**: the debrief says what it could and could not judge: "Logged after training, so I can't comment on rests or session length. Sets, loads and effort count as usual." The "What the coach can see" card adds a Timing row: "3 of your last 5 sessions were logged live."
- **Plausibility**: at entry, a one-time inline question for a flagged set, "180 kg on curls, is that right?" with Keep and Fix; on save with unit suspicion, "That looks like pounds. Convert to kg?". Never a lecture; the app assumes a typo, not a lie.

**6.17.4 Which computations accept which fidelity** (the gating matrix; each metric and rule declares this in code and the tests assert it)

| Computation | live | delayed | retro | edited | legacy | Notes |
|---|---|---|---|---|---|---|
| Sets, reps, load, effort; volume; weekly sets; balance; levels | yes | yes | yes | yes | yes | Content is always used. Retro and legacy lower `contentConfidence` to medium; the coach adds "logged later" to copy when a claim rests mainly on them |
| e1RM, trends, progression targets | yes | yes | yes | yes | yes | Retro sets weighted 0.8 in the trend fit; flagged sets excluded until confirmed |
| Records | yes | yes | yes, marked "logged later" | yes | yes | A record from a flagged set is held as unconfirmed until the load is repeated |
| Recovery model impulses (6.11) | yes | yes | yes, using `trainedAt` | yes | yes | Time anchor is `trainedEndAt`; for `timeSource` schedule or default the recovery row shows a ± band ("ready in 20 to 34 h, times approximate") and the coach avoids hour-precise copy |
| Rest intervals, rest adequacy rule | yes | no | no | no | no | Session needs `timingTrusted`; the rule needs ≥ 4 live sets on the exercise |
| Session density, idle time, duration drift, per-muscle minutes, time under load | yes | partial | no | no | no | Only `timingTrusted` sessions enter the personal medians; a `mixed` session contributes its live stretch only |
| Per-set heart data (peak, HRR60, effort-mismatch, drift) | yes | no | no | no | no | A delayed set cannot be paired with its heart-rate window; the sample stays in the session series |
| Session heart summary, zones, TRIMP, active calories | yes | yes | no | yes | no | Session-level, so set timing does not matter; needs stream coverage ≥ 0.7 |
| HR-guided rest, in-session autoregulation | yes | no | n/a | n/a | n/a | Only reacts to a `live` commit |
| Readiness, check-in, sleep, resting HR rules | yes | yes | yes | yes | yes | Independent of set timing |
| Adherence, streak, gap, schedule conflict | yes | yes | yes, on `trainedAt` day | yes | yes | Never on the logging day |
| Within-person relations (sleep vs performance) | yes | yes | yes | yes | no | Outcome is content; the night before is taken relative to `trainedAt` |
| Personal calibration of recovery τ | yes | yes | no | no | no | Needs a trustworthy time since the last hard session |
| Fixed-load HR comparison, HRR trend | yes | no | no | no | no | |

**6.17.5 Scenarios the app must recognise** (each is a classifier test case and a gate screenshot where a flow changes)

| # | Scenario | What the app records | What it computes and says |
|---|---|---|---|
| 1 | Logs every set as it happens, watch on | `mode live`, `liveShare ≈ 1`, `timingTrusted` | Everything, including rests, density, per-set heart peaks and HR-guided rest. Debrief has the full set of numbers |
| 2 | Trains live but catches up: logs bench while already on leg press | The bench sets land as a burst → `delayed`; leg-press sets `live`; `mode live` or `mixed` | Content counts fully. Rest and density for bench are skipped; per-set heart peaks for bench are dropped; session heart summary and calories stay. Debrief: "Rests judged on 9 of 14 sets" |
| 3 | Logs the whole session at home from memory | Compressed → finish sheet asks when they trained → `retro`, `timeSource user` | Sets, loads, effort, records (marked), recovery clock from the user's time, adherence on the right day. No rest, density or heart-set data. Debrief says so in one line |
| 3b | Same, but skips the question | `retro`, `timeSource schedule` (or `default` 17:00) | As above, with a wider recovery band and "times approximate" |
| 4 | Enters implausible numbers (typo, unit mix-up, or deliberate) | Flags on the sets; inline check once | Flagged sets excluded from records and trends until confirmed; kept in history; the coach never accuses, it asks once |
| 5 | Starts live, finishes at home | `mixed` | Live stretch feeds timing metrics; the rest is content-only |
| 6 | App killed or phone dies mid-session, resumes later | `active` survives (as today); the gap before resume is `delayed` for the next set | Timer excludes the dead gap only if the user confirms a pause; otherwise the session is `mixed` and rest metrics skip the gap |
| 7 | Session crosses midnight or is logged after midnight | `midnight_crossing`; `day` from `trainedAt` | Streak, adherence and weekly volume file it on the training day |
| 8 | Two sessions the same day, or an accidental duplicate | Second identical session flagged `duplicate` | Coach asks "Keep both?"; duplicates excluded from volume until answered |
| 9 | Imported from v36 | `legacy`, no set times | Content and recovery (approximate times) only; no timing insights ever come from legacy sessions |
| 10 | Edits a set days later in History | `edited`, `editedAt` | Content updated everywhere; that set's timing no longer trusted; the session may drop from `timingTrusted` |
| 11 | Watch connected but not worn, or stream mostly STALE | Coverage below 0.7 | Session heart summary withheld ("watch signal weak"); rests fall back to the timer; calories from another source or none |
| 12 | Travelling across time zones | `at` stored as ISO with offset; `day` computed in the device zone at `trainedAt` | Recovery and streak stay consistent; a one-line note in History if the zone changed |

**6.17.6 Copy rules.** The word for a non-live session is "logged later", never "unreliable" or "invalid". When a computation is skipped the coach names it in one clause and moves on. The app never asks the user to prove anything; plausibility prompts assume a slip. Fidelity is visible (a tag, a card row) but never scored or ranked.

**6.17.7 Tests.** `tests/fidelity.test.ts`: every row of 6.17.5 as a fixture (commit times in, classification out); per-set gap thresholds; compression rule; burst detection; midnight crossing; duplicate; unit suspicion at 2.2× and 0.45×; edited marking. `tests/gating.test.ts`: for each computation in 6.17.4, a table-driven test feeding a session of each fidelity and asserting whether the metric is produced. Gate screenshots: the "when did you train?" sheet, the past-session entry screen, a History card with the tag, and a debrief that names what it skipped.

---

## 7. Phased plan with acceptance criteria

| Phase | Scope | Done when |
|---|---|---|
| **P0 Unblock** (F0.1, F0.2, F0.3, W15, W16, W3, W13) | CI copies and patches; `health.ts` rewritten; `DailyHealth` history; auto sync on `pageshow` and `startSession`; `insights` uses `nowMs`; profile birth year | APK from CI shows a Sync button in Settings on Android 14, a sync fills today's `DailyHealth`, `npm run check` and the gate stay green, new mapping tests pass |
| **P0-P Profile and goal** (6.14, 6.15, 6.16) | Onboarding sheet and profile dashboard, `profileHistory` and `profileAt`, weight log, `profile.changed` feedback and save confirmation, goal policy object with accessory ranges for every goal, explicit main-lift role, low-range step-down fix, rest suggestion, goal-specific templates, goal asked at onboarding | Fresh install shows the sheet; completing it fills the profile and the goal; changing weight or goal produces one feedback insight and the Train targets update; `tests/goal.test.ts` passes for all four goals; the gate screenshots the sheet, the dashboard and a goal-change insight |
| **P1-R Recovery v2** (6.11, F3.1, 6.12.1, 6.17) | Set timestamps and rest seconds in `commitSet`, the fidelity classifier, `trainedAt` separate from `loggedAt`, the "when did you train?" finish sheet and the "Log a past session" flow, plausibility flags, weight log, `trainingSince`; rewrite `recovery.ts` as the impulse-response model, parameter tables, `recoveryModel` calibration state, per-muscle soreness in the check-in, "Mark as fresh", Body and Today copy, scheduled-conflict rule | Pure brain work with no native dependency, so it can ship right after P0: tests in 6.11, 6.17.7 pass, a compressed live session triggers the time question and files on the training day, a past session can be logged without a timer, the map shows ready and full states with ranges and confidence, stacking two sessions 36 h apart lowers the percentage, the gate screenshots the new Body rows |
| **P1 Live HR** (F0.4, F1.1, F1.6, 6.2, 6.3, 6.10) | WatchBridge plugin, `watch.ts`, `heartStore`, live pill, per-set peaks, finish card with active calories and burn curve, History line, profile sheet on first connect | On a GT6 broadcast, the live pill reaches LIVE inside a session, a finished session stores `SessionHeart` and a series, restart does not crash without a watch, web build unaffected |
| **P2 HR coaching** (F1.2, F1.3, F1.4, F1.5) | HR-guided rest, effort mismatch, drift, conditioning zones, two new record kinds | Rest ends when the target is met with the timer as ceiling; falls back when STALE; rules have tests; gate has a heart-mode rest screenshot |
| **P2-C Coach v2** (6.12, 6.13) | `CoachContext` v2 and `metrics.ts`; insight shape with evidence; cadences (pre, live, post, weekly, monthly); the catalogue rows that need only sets, timestamps, profile and weight (load targets, records in tiers, effort mix, rest and density, duration drift, sets vs band, frequency, e1RM trend, progress vs training age, rep mix, failure share, staleness, adherence, weight trend, plateau lever, effort calibration, warm-up, masters defaults, autoregulation); "What the coach can see"; feedback and snooze | Every catalogue row has a test for firing, staying quiet below its minimum, and its forbidden phrases; the pre-session sheet and post-session debrief render in the gate; weekly review appears on the first open of a new week once the week reached the user's planned sessions (at least 2) (changed from "≥ 5 logged days" by ADAPT-4, supervisor approval 2026-09-28) |
| **P3 Readiness** (F2.1 to F2.5, 6.4 readiness, recovery widening, progression hooks, the health and HR catalogue rows) | Baselines, check-in, HRV flow, readiness card, insight, `suggestNext` context | With 7 days of health data the Today card shows a tier with reasons; red readiness removes load increases in Train; no watch → check-in alone yields a low-confidence tier |
| **P4 Programming** (F3.1 to F3.8, W1, W7, W8, W9, W10) | Scheduled conflict, volume bands, deload state, warm-ups, cues in session, feedback, substitutions, optional morning notification | Each rule tested; deload changes Train targets for 7 days and closes itself; snoozed insights hide for 7 days |

Suggested order inside each phase: models → brain + tests → native → UI → gate. Keep each PR under about 600 lines so the visual gate stays reviewable.

---

## 8. Decisions for Marc before coding starts

**Status (22 September 2026): Marc accepted the recommended option for every item below. Item 16 is resolved by hardware evidence (Appendix E): the GT6 broadcast carries no RR intervals, so HRV is dormant and readiness runs on the check-in, sleep and resting heart rate.** The implementing agent should not re-ask these.

1. **Rest mode default**: `time` (safe) or `heart` when a watch is connected. Recommendation: `time` by default, with a one-time prompt to try heart mode after the first session with LIVE coverage above 80 %.
2. **Where the HR series lives**: separate localStorage key (simple, ~6 KB per hour, 60-session cap) or Capacitor Filesystem (unbounded, more code). Recommendation: localStorage key now, Filesystem later if needed.
3. **Watch-test's future**: keep as the hardware verification app (recommended) and make the M/ARC plugin a copy, or move the source into M/ARC and archive Watch-test.
4. **HRmax source**: observed max with Tanaka fallback (recommended) or 220 − age.
5. **Readiness weights**: start with the weights in 6.4 and tune after two weeks of real data; do not expose sliders to users.
6. **Auto-connect**: on session start only (recommended) or on app open.
7. **Deload acceptance**: coach suggests and the user accepts (recommended) or automatic.
8. **Calorie source precedence**: Health Connect for the session window, then the watch's energy field, then the heart-rate formula (recommended), or heart-rate formula always for consistency across sessions.
9. **Recovery thresholds and copy**: ready at 90 % and full at 97 % (recommended), or a single 100 % state as today. Also whether the per-muscle soreness chips are shown on every session start or only when a muscle trained in the last 48 h is in today's split (recommended).
10. **Strength placement table**: ship the relative-strength trend only (no external table, recommended first), or bundle a public bodyweight-multiple table (ExRx-style heuristics, free to reproduce) or license Strength Level data; whichever is chosen must be named in the copy.
11. **Notifications policy**: push only the pre-session brief on planned days and the weekly review (recommended), or in-app only.
12. **Novice mode**: hide the advanced insight set until one year of training age (recommended) or show everything from day one.
13. **Required-for-coach fields**: weight, height, birth year and sex all marked "needed" (recommended), or only weight and birth year.
14. **Goal change side effects**: rest default offered as a one-tap action (recommended) or applied automatically; templates offered (recommended) or splits left untouched.
15. **Fidelity thresholds and defaults**: ask "when did you train?" when the session is compressed (recommended) or always on Finish; default the training time to the schedule slot (recommended) or to 17:00; whether flagged records are hidden until repeated (recommended) or shown with a mark.
16. **HRV**: resolved. Verified on 22 September 2026 with Watch-test on the GT6 (Appendix E): the heart-rate packets contain no RR intervals and no energy field. HRV inputs stay in the code behind the "RR present" check but are dormant; readiness weights renormalise without HRV (check-in 0.35, sleep 0.25, target-muscle recovery 0.15, resting HR 0.10, acute load 0.05, each divided by 0.90).

---

## 9. Verification notes

An independent skeptic re-read the files for each of the nine code-level findings above (C1 to C9 in its report). Seven were confirmed as written. Two were confirmed with corrections, which are already folded in:

- The recovery-insight gate (W1) is stricter than "11 touches and 5 + 5 samples": it also needs short-rest volume below 94 % of full-rest volume, so for many users the insight never fires.
- `state.health` is also merged by `normalize()` in `core/store.ts:23`, and `goal` does reach the coach through `suggestNext` (rep ranges) even though it is absent from `CoachContext`. Health and heart-rate data remain unused everywhere.

The goal audit in 6.16 was done directly from the code (`grep goal src`, the pattern list in `exercises.json`, `progression.ts`, `migrate.ts:226`, `units.ts`) without agents.

A third research pass (two agents: evidence for each insight the inputs can support, and how the best coaching products deliver insights) produced 6.13 and Appendix D. Where it disagreed with the first pass, the later evidence won: readiness now leads with the check-in and sleep rather than HRV (6.4), the sex prior in the recovery model was dropped to 1.0 and the age prior made small and silent below 60 (6.11), deloads are reactive only, and heart-rate calories are labelled the least reliable of the three sources (6.10).

A second research pass (two agents: recovery physiology, and how products and sports-science models compute recovery) produced Appendix C and the model in 6.11; its two independent recommendations agreed on the impulse-response shape, the effort and volume factors, the systemic-only role of heart rate, and bounded two-sided calibration.

The skeptic also surfaced the extra loops now included above: no CI check could ever catch L1 to L3; the plugin has no in-app permission request; `HealthSnapshot` has no history or timestamps although the Java already emits them; Watch-test never writes heart rate to Health Connect; `nowMs` only ticks during a session; `pickCue` never receives `recent`; `Today` shows only the top insight, so readiness needs a priority above 250 to ever appear there (assigned 380 to 450 in 6.4).

---

## Appendix A. Research behind the features (sources)

Each entry is one to two lines; the URLs are the sources the research pass read. Treat thresholds as starting points to tune on the GT6.

1. **HR-guided rest.** A controlled bench-press study found HR-determined rest gave more total reps (55.1 vs 39.5) and a slower set-to-set decline than fixed 60 s; meta-analyses favour ≥ 2 min rests for strength, so HR should extend rest, never shorten it below evidence-based minimums. Wrist optical HR lags 5 to 15 s and drops out on grip, so require contact = true and three valid packets before "ready". https://www.researchgate.net/publication/307726380_Heart_Rate_Determined_Rest_Intervals_In_Hypertrophy-Type_Resistance_Training , https://pubmed.ncbi.nlm.nih.gov/26605807/ , https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full
2. **HRR60.** Cole et al. 1999 (NEJM): HRR60 ≤ 12 bpm predicts about 4× mortality; ≥ 18 normal, 22 to 30+ good. Compare like with like (same exercise, similar peak) and trend the personal median. https://www.nejm.org/doi/pdf/10.1056/NEJM199910283411804 , https://www.gehealthcare.com/en-us/insights/article/heart-rate-recovery-and-risk-understanding-this-powerful-marker
3. **Ultra-short HRV (RMSSD, lnRMSSD).** 60 s lnRMSSD after 60 s stabilisation is valid (ICC 0.92 to 0.97, Flatt and Esco); 7-day rolling lnRMSSD with a ±0.5 SD smallest worthwhile change over a 60-day window is how HRV4Training and Elite HRV score readiness. Wrist PPG RMSSD error can approach 30 % with motion; only accept still readings and never act on one day. The GT6 broadcast may not carry RR intervals at all; check flag bit 4 per packet. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6175275/ , https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0138921 , https://help.elitehrv.com/article/355-what-is-the-hrv-7-day-rolling-average-and-coefficient-of-variation , https://www.bluetooth.com/wp-content/uploads/Files/Specification/HTML/HRS_v1.0/out/en/index-en.html
4. **HRV coefficient of variation as an overreaching detector.** Plews et al. 2012: a falling weekly lnRMSSD CV preceded non-functional overreaching; in lifters the CV tracked load and volume. Needs 3 to 4 readings a week. https://pubmed.ncbi.nlm.nih.gov/22367011/ , https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6315923/ , https://elitehrv.com/improving-hrv-data-interpretation-coefficient-variation
5. **Resting HR deviation.** +5 bpm over the 7-day mean is the common "needs recovery" flag, +10 typical of overtraining; Oura and Garmin use the same idea. Nightly mean HR beats a spot value; keep baselines per source. https://runnersconnect.net/overtraining-resting-heart-rate/ , https://support.ouraring.com/hc/en-us/articles/360057791533-Readiness-Contributors , https://www.garmin.com/en-US/blog/fitness/why-your-body-battery-may-struggle-to-charge-when-you-start-to-get-sick/
6. **Sleep and strength.** Craven et al. 2022 meta-analysis: acute sleep loss impairs performance, with maximal strength in compound lifts reduced when motivation is not facilitated; total deprivation cut maximal strength about 8 to 12 %. Garmin Training Readiness uses last night plus a 3-night history; Oura uses a 2-week Sleep Balance. Weight duration and regularity over stage minutes. https://link.springer.com/article/10.1007/s40279-022-01706-y , https://pubmed.ncbi.nlm.nih.gov/29422383/ , https://www8.garmin.com/manuals/webhelp/GUID-F41EAFB3-6CC9-42DE-9C6C-9E358DBB0671/EN-US/GUID-C21BE0C8-A08E-4DA1-B6C6-2E0E2DDDB372.html
7. **Composite readiness.** Whoop Recovery is HRV-dominant with RHR, sleep and respiratory rate, banded green 67-100 / yellow 34-66 / red 0-33; Garmin Training Readiness adds recovery time and acute load; Polar Nightly Recharge scores ANS charge −10 to +10 against a 28-day baseline; JuggernautAI drops sets when self-reported readiness is under 3 of 5. Show "calibrating" until 7 valid days and always name the drivers. https://www.whoop.com/us/en/thelocker/how-does-whoop-recovery-work-101/ , https://developer.whoop.com/docs/whoop-101/ , https://support.polar.com/us-en/nightly-recharge-recovery-measurement , https://www.garagegymreviews.com/juggernautai-review
8. **Subjective check-in as fallback.** JuggernautAI (1-5 sleep, soreness, motivation, calories, per-muscle fatigue) and RP Hypertrophy (soreness, pump, performance) auto-adjust volume from it; a PeerJ 2021 systematic review finds RPE/RIR autoregulation practical and at least as effective as fixed loading. Keep it under 15 s and skippable. https://peerj.com/articles/10663/ , https://fitbod.me/blog/muscle-recovery/
9. **Effort-first autoregulation.** Helms 2018 and Graham and Cleather 2019: RPE/RIR-regulated groups gained 1RM at least as much as percentage-based groups; Zourdos 2016 RIR-based RPE correlates with bar velocity. Easy/Ideal/Max maps to about 3+ / 1-2 / 0 RIR. Lifters overshoot RIR far from failure, so trust Max labels more than Easy. Readiness should shift the effort target, never replace the user's label. https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2018.00247/full , https://pmc.ncbi.nlm.nih.gov/articles/PMC4961270/ , https://www.strongerbyscience.com/reps-in-reserve/
10. **Volume landmarks and deloads.** RP landmarks (MV 4-6, MEV about 6-8, revised down to roughly 4-6 for many muscles in 2023-24, MAV 12-20, MRV 20-25+ hard sets a week) with fractional credit 0.5 for secondary movers; deload on e1RM drop with unchanged or higher effort, multi-session stalls, or exceeding MRV; typical deload halves sets and cuts load 10 to 20 %. https://arvo.guru/resources/volume-landmarks , https://thestrengthequation.com/post/volume-landmarks.html , https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2022.1073223/full , https://www.athletedata.health/guides/when-to-deload
11. **HR during lifting is a fatigue signal, not an intensity signal.** HR at matched lifting intensity differs by body position alone (97 vs 123 bpm) and Valsalva or isometric pressor responses dominate; cardiovascular drift raises HR 5 to 11 % over 15 to 55 min, half of it from fluid loss. So HR-based features must never re-rate a set; drift and time-to-ready are the right uses. https://pubmed.ncbi.nlm.nih.gov/9694416/ , https://pubmed.ncbi.nlm.nih.gov/34717912/ , https://www.nature.com/articles/s41598-025-19817-7 , https://pubmed.ncbi.nlm.nih.gov/36351198/
12. **Karvonen zones for conditioning.** ACSM: moderate 40/50 to 70 % of heart-rate reserve, vigorous 70 to 90 %; the only lifting-adjacent place where HR is the correct intensity metric. Judge zone adherence on 30 s averages. https://www.physiotutors.com/wiki/karvonen-formula/ , https://www.topendsports.com/fitness/karvonen-formula.htm
13. **Keytel 2005 kcal.** R² 0.734 without VO₂max, built on steady-state cycling and treadmill in 18 to 45-year-olds; over-reads for intermittent lifting, so show a range and never sum with the watch's cumulative kJ. https://www.researchgate.net/publication/7777759_Prediction_of_energy_expenditure_from_heart_rate_monitoring_during_submaximal_exercise
14. **HRmax.** Tanaka 2001 (`208 − 0.7 × age`, SD about 10 bpm) beats 220 − age, especially over 40; measured max still varies ±10 bpm, so an observed plateau wins. Lifting rarely reaches true max, so observed is a floor. https://www.ncbi.nlm.nih.gov/pmc/articles/PMC5862813/ , https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2021.695950/full
15. **Signal quality.** Wrist optical HR accuracy degrades with dynamic and gripping movement; Huawei's HR Data Broadcasts documentation gives no guarantee of RR intervals or continuous delivery. Gate every feature on quality and say "signal weak" rather than showing bad numbers. https://consumer.huawei.com/ca/support/content/en-us15827504/ , https://onlinelibrary.wiley.com/doi/10.1080/17461391.2021.2023656 , https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0268361 , https://pmc.ncbi.nlm.nih.gov/articles/PMC11951816/
16. **Per-muscle freshness with readiness (Fitbod pattern).** Fitbod keeps a 0 to 100 % recovery per muscle from logged sets, treats 48 to 72 h as not fresh, allows manual override and swaps to lighter exercises for fatigued muscles; RP and JuggernautAI scale next-session volume from soreness. Keep the user override so the model never blocks a session. https://help.fitbod.me/hc/en-us/articles/360006269014-Muscle-Recovery

## Appendix B. Formulas and thresholds to implement (starting values)

| Name | Formula | Notes |
|---|---|---|
| BLE 0x2A37 parse | `flags = b0`; bpm = `flags & 1 ? u16(b1..2) : b1`; contact supported `flags & 4`, detected `flags & 2`; energy `flags & 8` → u16 kJ cumulative; RR `flags & 16` → remaining u16 values, `ms = raw × 1000 / 1024`, oldest first | Already implemented in `sensor-core/HeartRateMeasurement.java`; `contactSupported && !contactDetected` is an invalid sample |
| RR artifact filter | reject RR outside 300-2000 ms; artifact if `|RR − localMedian(11)| > 0.20 × localMedian` or > 250 ms → interpolate; invalid if corrected > 5 % or n < 30 | Kubios-style; ultra-short studies discard > 5 % corrected |
| RMSSD | `sqrt(mean((RR[i+1] − RR[i])²))` over the last 60 s of clean RR after 60 s stabilisation; `lnRMSSD = ln(RMSSD)` | Seated or supine, still; store the log |
| HRV baseline and z | `base7 = mean(lnRMSSD, 7 d)`; `sd60 = sd(lnRMSSD, 60 d, min 14 values)`; `z = (today − base7) / sd60`; SWC = 0.5 × sd60; green |z| ≤ 0.5, amber −1.0 ≤ z < −0.5, red z < −1.0 or 2 days below −0.5 | z > +1.5 with elevated RHR is also amber (saturation); need ≥ 7 valid days |
| lnRMSSD weekly CV | `100 × sd(7 d) / mean(7 d)`; flag if CV falls > 30 % vs the 4-week median CV with flat or falling mean and rising weekly volume | needs 3 to 4 readings a week |
| Resting HR deviation | `delta = today − mean(7 d)`; amber if delta ≥ 5 or > 1.5 × sd(28 d); red if ≥ 8-10 or amber 3 days running | prefer nightly mean HR; baseline per source |
| HRR60 | `peak − median(HR at 55..65 s after set end)`, only if `peak ≥ RHR + 0.6 × (HRmax − RHR)` and contact valid; personal flag if `< median − 1.5 × MAD` | < 12 poor, 12-17 below average, ≥ 18 normal, 22-30+ good |
| Rest ready | `readyHR = min(preSetHR + 12, RHR + 0.35 × (HRmax − RHR))`; ready when 3 consecutive valid samples ≤ readyHR and elapsed ≥ 60 / 90 / 120 s (easy / ideal / max, main lifts); cap 300 s; record `timeToReady` | tune 0.35 and +12 on device |
| HRmax | `Tanaka = 208 − 0.7 × age`; `used = max(Tanaka, observed)` where observed is a ≥ 5 s plateau within 3 bpm, contact valid, ≤ 220; decay to Tanaka if not re-approached in 12 months | 220 − age under-predicts after 40 |
| Karvonen zones | `THR(p) = RHR + p × (HRmax − RHR)`; Z1 40-50 %, Z2 50-60 %, Z3 60-70 %, Z4 70-80 %, Z5 80-90 %+ | conditioning and rest thresholds only |
| Mifflin-St Jeor BMR | male `10·kg + 6.25·cm − 5·age + 5`; female `10·kg + 6.25·cm − 5·age − 161` kcal/day; resting kcal/min = BMR / 1440; `active = gross − resting × minutes` | needs weight, height, age, sex |
| Keytel kcal | male kJ/min `= −55.0969 + 0.6309·HR + 0.1988·kg + 0.2017·age`; female `= −20.4022 + 0.4472·HR − 0.1263·kg + 0.074·age`; `kcal = Σ(kJ/min) / 4.184`, clamp negatives to 0; show ±25 % | over-reads for lifting; one source per session |
| Sleep sub-score | `need = mean(14 nights, default 7 h)`; `s_dur = clamp(last / need, 0, 1.1)`; `s_debt = clamp(1 − Σ⁺(need − dur, 3 nights) / 3 h, 0, 1)`; `regularity = 1 − clamp(sd(bedtime, 7 nights) / 90 min, 0, 1)`; `score = 100 × (0.6·s_dur + 0.25·s_debt + 0.15·regularity)` | stages optional, low weight |
| Readiness | `100 × Σ(wᵢ·sᵢ) / Σ(wᵢ available)`; weights check-in 0.35 (soreness of target muscles, sleep quality, mood as personal z-scores), sleep hours 0.25, target-muscle recovery 0.15, RHR 0.10 (`clamp(1 − delta/10)`), HRV 0.10 (`clamp(0.5 + z/3)`, only with clean RR), acute load 0.05; green ≥ 67, amber 34-66, red ≤ 33; hysteresis 2 days; "back off" only when 2+ inputs worse than 1 SD | renormalise on missing inputs; never zero; self-report leads (Saw 2016) |
| Readiness → plan | green: progression allowed, top set ideal→max, +1 optional set if under band; amber: hold load, target ideal, drop the last set, no records; red: load × 0.85 on main lifts or skip accessories, target easy; 3 red days → rest or deload | explain the driver in the coach copy |
| Deload trigger | `e1RM_7d_best ≤ 0.95 × e1RM_28d_best` with effort same or harder; or no e1RM gain in 3 sessions; or sets/week > MRV; or readiness red ≥ 3 days; or CV collapse. Deload: sets × 0.5, load × 0.85-0.90, effort easy, same frequency | e1RM Epley `kg × (1 + reps/30)`, effort-adjusted reps max +0 / ideal +1.5 / easy +3 |
| Volume landmarks | MV 4-6, MEV ~6-8 (RP now ~4-6 for many), MAV 12-20, MRV 20-25+ sets/muscle/week; primary 1.0, secondary 0.5; +1-2 sets/week across a 4-5 week block, deload week 5 | keep in `data/`, personalise |
| Drift and fatigue | `drift% = 100 × (mean preSetHR of the last 3 sets − mean of the first 3) / first 3`, only if session ≥ 20 min and ≥ 6 sets; flag if > 8 % or `timeToReady` slope > +10 s per set | recommend hydration and longer rest, not load cuts |
| Signal quality | valid second: packet within 3 s, contact not false, 30 ≤ bpm ≤ 220, |Δ| ≤ 15; `quality = validSec / sessionSec`; analytics ≥ 0.8, HRR and rest thresholds ≥ 0.95 in their window; RR only while still with ≤ 5 % artifacts | log dropouts to debug the GT6 broadcast |

## Appendix C. Research behind the recovery model (sources)

1. **Proximity to failure roughly doubles recovery time.** Morán-Navarro et al. 2017: 3×5 and 6×5 of a 10RM recovered by 24 h; 3×10 to failure was still impaired at 48 h. Refalo et al. 2023: velocity loss after 6 sets at 75 % 1RM was −25 % (failure), −13 % (1 RIR), −8 % (3 RIR), roughly linear in RIR. https://link.springer.com/article/10.1007/s00421-017-3725-7 , https://pmc.ncbi.nlm.nih.gov/articles/PMC9908800/ , https://pubmed.ncbi.nlm.nih.gov/30036284/
2. **Volume extends recovery beyond 72 h; heavy low-rep work does not.** Bartolomei et al. 2017: 8×10 left isometric strength impaired at 72 h while 8×3 heavy showed no deficit at 24 to 72 h. Pareja-Blanco 2019: squats at 80 % 1RM with 20 % velocity loss (about 3 reps) recovered within 6 h; 60 % with 40 % loss (about 12 reps) was still down at 48 h. https://link.springer.com/article/10.1007/s00421-017-3598-9 , https://pmc.ncbi.nlm.nih.gov/articles/PMC6473797/ , https://pubmed.ncbi.nlm.nih.gov/30844990/
3. **Eccentric and long-length work prolongs recovery.** Eccentric-accentuated bench still impaired at 48 h (Bartolomei 2019); maximal isometric work at long muscle length still −25 to −32 % at 24 to 48 h while short-length work left no deficit. https://pubmed.ncbi.nlm.nih.gov/31531133/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC11286269/
4. **Compound is not slower for the local muscle.** After 8×10RM, elbow flexors recovered by 24 h after rows but were still −8.4 % after preacher curls (Soares 2015). Squat, bench and deadlift show the same time course at equal set volume. https://pubmed.ncbi.nlm.nih.gov/25807025/ , https://csep.ca/2019/06/19/time-course-of-recovery-is-similar-for-the-back-squat-bench-press-and-deadlift-in-well-trained-males-2/
5. **Muscle differences.** With identical maximal eccentric work, arms and hamstrings showed more strength loss, CK and soreness than quads (Chen 2011); the "small muscles recover fastest" claim has no controlled support. https://link.springer.com/article/10.1007/s00421-010-1648-7
6. **Training status and novelty.** Trained men returned to baseline by day 3 after 10×6 maximal eccentrics while untrained were still −40 % (Newton 2008); a prior bout protects the untrained strongly, the trained little (Falvo 2009). https://pubmed.ncbi.nlm.nih.gov/18550979/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC2783719/
7. **Sex and age.** After 5×5 + AMRAP squats, men recovered by 48 h and women were still −14 % at 72 h (Davies 2018, n = 19, so a small prior only); older adults typically take longer, confounded by activity. https://pmc.ncbi.nlm.nih.gov/articles/PMC6206044/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC10317890/
8. **Sleep.** 48 h total sleep deprivation did not delay strength recovery after damaging exercise (Dattilo 2020); chronic 1 to 2 h restriction reduces multi-joint force and adaptation. https://pubmed.ncbi.nlm.nih.gov/31469710/ , https://pubmed.ncbi.nlm.nih.gov/35708888/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC11390164/
9. **HRV and resting HR do not track muscle recovery.** lnRMSSD was back to baseline the next morning while jump power and bar velocity were still suppressed at 48 h, with no correlation between the two (Flatt 2019; Thamm 2019). https://pmc.ncbi.nlm.nih.gov/articles/PMC6835520/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC6888606/
10. **Watch recovery time is an unvalidated EPOC estimate with an endurance bias.** Firstbeat's own material and independent analyses; heavy leg sessions barely register. https://www.firstbeat.com/en/science-and-physiology/epoc-and-training-effect/ , https://the5krunner.com/garmin-features/training/recovery-time/ , https://fellrnr.com/wiki/Firstbeat
11. **Soreness is a poor readiness marker; perceived recovery is a good one.** Soreness peaks at 24 to 48 h and does not scale with strength loss; a 0 to 10 Perceived Recovery Status score correlated r = 0.84 with jump height across 72 h. https://pubmed.ncbi.nlm.nih.gov/12453160/ , https://journals.humankinetics.com/downloadpdf/view/journals/ijspp/17/6/article-p886.pdf , https://pubmed.ncbi.nlm.nih.gov/21804429/
12. **Curve shape and stacking.** Recovery is steepest in the first 6 h then slow (Pareja-Blanco 2019 tables); consecutive-day full-body sessions in trained men did not worsen recovery (EJAP 2021); Busso's variable-dose model shows recent load lengthens recovery. https://link.springer.com/article/10.1007/s00421-021-04777-3 , https://pubmed.ncbi.nlm.nih.gov/12840641/
13. **Product models.** Fitbod: 0 to 100 % per muscle from sets, reps and load over 24 to 72 h with a 7-day floor and manual override. Whoop Strength Trainer uses tonnage, not HR, for muscular load. Polar routes strength through RPE × minutes. RP scores soreness, performance and pump per muscle weekly; JuggernautAI lowers the day's load for sore muscles. https://fitbod.me/blog/muscle-recovery/ , https://www.whoop.com/us/en/thelocker/how-whoop-measures-muscular-load/ , https://www.polar.com/img/static/whitepapers/pdf/polar-training-load-pro-white-paper.pdf , https://rpstrength.com/blogs/articles/training-volume-landmarks-muscle-growth
14. **Impulse-response models.** Banister fitness-fatigue: fatigue τ 5 to 15 days, fitness 40 to 50 days, poorly identifiable parameters, hence bounded nudges rather than regression. Open-source per-muscle designs converge on 1.0 / 0.5 / 0.25 role credit and a range-plus-confidence display. https://pmc.ncbi.nlm.nih.gov/articles/PMC1974899/ , https://www.trainingpeaks.com/learn/articles/the-science-of-the-performance-manager/ , https://github.com/Panopticon-AB/IronForge/issues/537
15. **Coach rules of thumb consistent with the data.** At least 48 h between hard sessions for the same muscle; 8+ sets need 72 h+; non-failure heavy work recovers in about a day; rest days after the highest-volume, closest-to-failure sessions. https://www.strongerbyscience.com/training-back-to-back/ , https://www.strongerbyscience.com/training-frequency/

## Appendix D. Research behind the insight catalogue (sources)

1. **e1RM formulas and error.** Epley and Brzycki are within about ±5 % for sets of 2 to 10 reps and drift to ±15-20 % above 10; typical error of 1RM-type measures in trained adults is 2-5 %, so changes below two typical errors are noise. https://www.unm.edu/~rrobergs/478RMStrengthPrediction.pdf , https://pubmed.ncbi.nlm.nih.gov/10907753/
2. **Reps in reserve accuracy.** Lifters under-predict reps to failure by 2.6 to 3.4 reps (SEM), by about 0.5 with more than 36 months of experience and about 3.9 in the first six months (Steele 2017); accuracy improves close to failure (Remmert 2023). Reps at a given % 1RM vary between people by about 2.5 reps at 80 % and 4.4 at 60 % (Nuzzo 2024), so never infer % 1RM from reps alone. https://peerj.com/articles/4105/ , https://pubmed.ncbi.nlm.nih.gov/37036795/ , https://pmc.ncbi.nlm.nih.gov/articles/PMC10933212/
3. **Strength standards.** Strength Level bands are percentiles of about 46 million self-reported lifts; ExRx bands are coaching heuristics (male deadlift untrained 1.0×, novice 1.5×, intermediate 2.0×, advanced 2.75× body weight; female 0.7 / 1.0 / 1.4 / 1.85×); none is peer-reviewed, so "compared with people who log their lifts" is the only honest framing. Allometric scaling `load / BW^0.67` (Jaric 2002) and DOTS or IPF GL for powerlifting totals. https://strengthlevel.com/strength-standards , https://exrx.net/Testing/WeightLifting/StrengthStandards , https://pubmed.ncbi.nlm.nih.gov/12141882/ , https://www.powerlifting.sport/fileadmin/ipf/data/ipf-formula/Models-Evaluation-I-2020.pdf
4. **Progression by training age.** Steele et al. 2023 (n = 14,690): strength follows a linear-log curve, roughly 30-50 % gain in the first year then near-plateau by one to two years; sex, weight and age had minimal interaction. Latella 2020 (1,897 powerlifters): similar gain rates by sex, slower in the strongest quartile. https://www.tandfonline.com/doi/abs/10.1080/02701367.2022.2070592 , https://journals.lww.com/nsca-jscr/Fulltext/2020/09000/Long_Term_Strength_Adaptation__A_15_Year_Analysis.2.aspx
5. **Rest intervals.** Schoenfeld 2016: 3 min vs 1 min gave more strength and thickness in trained men. Grgic 2017: over 2 min to maximise strength in trained lifters, 60-120 s enough when untrained. Singer 2024 Bayesian meta-analysis: small hypertrophy benefit above 60 s, nothing detectable beyond about 90 s. https://pubmed.ncbi.nlm.nih.gov/26605807/ , https://www.frontiersin.org/journals/sports-and-active-living/articles/10.3389/fspor.2024.1429789/full
6. **Load, rep range and goal.** Lopez 2021 network meta-analysis: hypertrophy similar across loads when sets approach failure; strength superior with heavy and moderate loads. Schoenfeld 2017 low vs high load agrees. https://pubmed.ncbi.nlm.nih.gov/33433148/ , https://pubmed.ncbi.nlm.nih.gov/28834797/
7. **Proximity to failure.** Grgic 2022: no significant difference for strength or hypertrophy. Refalo 2023: trivial hypertrophy advantage for failure (ES 0.19). Robinson 2024 meta-regression: hypertrophy rises toward failure with diminishing returns, strength unaffected by RIR. Refalo 2024 RCT: similar quad growth at 1-2 RIR with less fatigue. https://pubmed.ncbi.nlm.nih.gov/33497853/ , https://pubmed.ncbi.nlm.nih.gov/36334240/ , https://pubmed.ncbi.nlm.nih.gov/38970765/ , https://www.tandfonline.com/doi/full/10.1080/02640414.2024.2321021
8. **Weekly volume and frequency.** Schoenfeld 2017: each extra weekly set adds about 0.37 % hypertrophy, 10+ sets beat under 5. Pelland 2024/25 (67 studies): diminishing returns with no clear plateau for hypertrophy, much steeper for strength, fractional counting of indirect sets at 0.5 predicted best. Iversen 2021: about 4 sets per muscle a week as a time-efficient minimum. Schoenfeld 2019 and Grgic 2018: frequency does not change hypertrophy at equal volume, gives a little more strength. https://pubmed.ncbi.nlm.nih.gov/27433992/ , https://sportrxiv.org/index.php/server/preprint/view/460 , https://pubmed.ncbi.nlm.nih.gov/34125411/ , https://pubmed.ncbi.nlm.nih.gov/30558493/ , https://pubmed.ncbi.nlm.nih.gov/29470825/
9. **Session duration and density.** No trial links total session length to outcomes independently of volume and rest; time efficiency comes from set count, rest length and supersets (Iversen 2021). Judge only idle time and rushed rests with visible rep drop-off. https://pubmed.ncbi.nlm.nih.gov/34125411/
10. **Sleep and performance.** Craven 2022 meta-analysis (77 studies): sleep of 6 h or less lowers next-day performance by about 7.6 % overall, but maximal strength only about 2.9 %, strength-endurance about 9.9 %, skill about 21 %; evening tests worse than morning. Knowles 2018: single-night deprivation barely affects strength; consecutive restricted nights reduce multi-joint force. https://pmc.ncbi.nlm.nih.gov/articles/PMC9584849/ , https://pubmed.ncbi.nlm.nih.gov/29422383/
11. **Within-person statistics.** Pooling users inflates correlations (Bland and Altman 1995); confidence intervals for r shrink with 1/√n, so about 45 observations are needed before even a strong correlation has a ±0.1 interval (Hopkins). Hence n ≥ 15 to show anything, ≥ 20 for a direction, ≥ 40 for "consistently", and one new personal pattern a week. https://www.bmj.com/content/310/6977/446 , https://www.sportsci.org/resource/stats/sscorr.html , https://www.sportsci.org/resource/stats/precision.html
12. **Sex.** Roberts, Nuckols and Krieger 2020: no sex difference in hypertrophy, women gain upper-body relative strength faster. Nuzzo 2024: sex, age and training status barely change reps at % 1RM. McNulty 2020 and Elliott-Sale 2020: menstrual-cycle phase effects are trivial with large heterogeneity, so no phase-based programming. https://journals.lww.com/nsca-jscr/fulltext/2020/05000/sex_differences_in_resistance_training__a.30.aspx , https://pubmed.ncbi.nlm.nih.gov/32661839/ , https://pubmed.ncbi.nlm.nih.gov/32666247/
13. **Age.** Fragala 2019 NSCA position statement (65+): 2-3 days a week, 2-3 sets per muscle group, about 2 min rest, gradual progression; PROT-AGE 1.0-1.2 g/kg protein, Morton 2018 about 1.6 g/kg for gains. No trial supports different rules for 40 to 59. Warm-up improves performance in about 79 % of outcomes (Fradkin 2010). https://journals.lww.com/nsca-jscr/fulltext/2019/08000/resistance_training_for_older_adults__position.1.aspx , https://pubmed.ncbi.nlm.nih.gov/23867520/ , https://pubmed.ncbi.nlm.nih.gov/28698222/ , https://journals.lww.com/nsca-jscr/fulltext/2010/01000/effects_of_warming_up_on_physical_performance__a.21.aspx
14. **Body weight.** Helms 2014: 0.5-1 % a week loss preserves muscle; Iraki 2019: 0.25-0.5 % a week gain for novices and intermediates; daily water swings of about 1-2 kg dominate single readings (Bhutani 2017), so use an EWMA trend. https://pubmed.ncbi.nlm.nih.gov/24864135/ , https://www.mdpi.com/2075-4663/7/7/154 , https://physoc.onlinelibrary.wiley.com/doi/full/10.14814/phy2.13336
15. **Resting HR, HRR and fixed-load HR.** Buchheit 2014: use 7-day averages against a personal baseline with the individual's coefficient of variation; a falling resting HR or HR at a fixed submaximal load reflects aerobic adaptation, a rise is ambiguous without load and wellness context. Cole 1999's 12 bpm cutoff came from graded treadmill tests and does not transfer to sets. Bell 2020: only sustained performance decline reliably marks overreaching in resistance training. https://www.frontiersin.org/journals/physiology/articles/10.3389/fphys.2014.00073/full , https://www.nejm.org/doi/full/10.1056/NEJM199910283411804 , https://shura.shu.ac.uk/26176/
16. **Subjective measures lead.** Saw 2016 systematic review: self-report reflects acute and chronic training load more sensitively and consistently than objective measures (HR, HRV, hormones). Daily HRV or readiness correlates weakly with 1RM performance; weekly means track it. https://pubmed.ncbi.nlm.nih.gov/26423706/ , https://hrvtraining.com/2013/10/15/reviewing-hrv-rpe-1rm-and-grip-strength-data-over-6-weeks/
17. **Deloads and ACWR.** Coleman 2024 RCT: a pre-planned mid-block deload gave similar hypertrophy but less strength than continuous training, so deloads should be reactive. Impellizzeri 2020: the acute:chronic workload ratio has no sound basis as injury risk. https://peerj.com/articles/16777/ , https://pubmed.ncbi.nlm.nih.gov/32502973/
18. **Staleness and variation.** Baz-Valle 2019: random exercise variation gave similar strength and size to a fixed programme; Kassiano 2022: planned variation can help, excessive rotation hinders. https://pubmed.ncbi.nlm.nih.gov/35438660/
19. **Presentation precedents.** Garmin Morning Report and Training Readiness (contributors listed); Oura Readiness Contributors and Advisor wording; Whoop Weekly Performance Assessment (needs 5 days) and Monthly Performance Assessment; Strava Athlete Intelligence one-line summaries; Peloton Strive Score vs personal average; JuggernautAI readiness-driven set trims; RP feedback-driven volume. https://the5krunner.com/2022/06/28/garmin-morning-report/ , https://support.ouraring.com/hc/en-us/articles/360057791533-Readiness-Contributors , https://www.whoop.com/eu/en/thelocker/new-weekly-performance-assessment/ , https://www.whoop.com/us/en/thelocker/monthly-performance-assessment/ , https://support.strava.com/en-us/articles/15401629-athlete-intelligence-on-strava , https://www.garagegymreviews.com/juggernautai-review
20. **Behaviour change.** Self-determination theory: informational, competence-affirming feedback sustains motivation; progress-affirming notifications outperformed deficit framing on 90-day adherence; Duolingo's streak freeze raised daily actives; habit automaticity took a median 66 days (18 to 254) and one missed day did not derail it (Lally 2010); implementation intentions raise goal attainment (d about 0.65). Push more than 5 times a week drives opt-outs. https://www.sciencedirect.com/science/article/pii/S1071581920300513 , https://blog.duolingo.com/how-duolingo-streak-builds-habit , https://www.surrey.ac.uk/news/does-it-really-take-66-days-form-habit-we-asked-expert-dr-pippa-lally , https://goalsandprogress.com/implementation-intentions-gollwitzer-how-to/ , https://academic.oup.com/abm/article/52/6/446/4733473

## Appendix E. Hardware facts verified on the GT6 (22 September 2026)

Source: Watch-test 0.1.0 on a Samsung SM-F766B running Android 16 (SDK 36), connected to "HUAWEI WATCH HR-1D5" over direct Bluetooth; a screenshot of the live dashboard and the exported diagnostics file (no addresses or values included). Watch-test is Marc's calibration app for the watch link and stays the reference for hardware checks.

| Fact | Evidence | Consequence for the plan |
|---|---|---|
| Standard heart-rate stream works, live, about 1 Hz | "LIVE", "Received 0s ago", 71 to 75 packets, last packet interval 0.9 to 1.0 s, a smooth two-minute trace with no gaps | HR-guided rest, per-set peaks and HRR60 have second-level resolution; the 5-second downsampled series in 6.3 is adequate |
| `0x2A37` is notify only; `0x2A38` present; no `0x2A39` | properties 16 on `2A37`; `2A38` read; no control point listed | Subscribe with notifications, never indications; no energy-expended reset is possible |
| No RR intervals in the packets | "RR INTERVAL: Not included in the latest packet" | HRV from the watch is dormant on the GT6 (decision 16); readiness weights renormalise; the RMSSD flow stays behind a runtime check |
| No energy field in the packets | "BROADCAST ENERGY: Not included in the latest heart-rate packet" | Calories come from Health Connect if shared, else from the heart-rate formula (6.10) |
| Battery service works | 84 % read at 21:51:55; `0x2A19` properties 18 (read and notify) | Show battery in the watch sheet; warn under 15 % before a session |
| Huawei proprietary services are present but unused | services `0x3802`, `0xFE86` (characteristics `FE01`, `FE02`, `FE05`, `FE06`) and a vendor UUID | Ignore; no private protocol is touched, as in Watch-test's privacy stance |
| Health Connect on this phone shares steps, not active calories | Steps 5,092 "Today · shared total"; Active calories "No shared calories today"; sleep and blood-oxygen tiles were below the screenshot edge (unverified) | The steps-as-recovery-context row can fire; the calorie precedence falls through to heart rate; sleep and resting HR sharing must be checked once P0 ships (the plan's readiness copy already handles their absence) |
| Contact flag | Not visible; the dashboard showed LIVE rather than "CHECK WATCH FIT", so either contact was detected or the flag is unsupported | The signal-quality gate treats an absent flag as "not false"; verify on the first M/ARC session by taking the watch off for ten seconds |
| Connection latency | Disconnected → Connecting → Checking watch → Connected in about 1.5 s | Auto-connect on session start (decision 6) will not delay the first set |
| Phone platform | Android 16, SDK 36 | Platform Health Connect (API 34+ path in the plugin) applies; the CI's `minSdkVersion 26` and the Watch-test manifest permissions remain valid; compile against SDK 35 or 36 |

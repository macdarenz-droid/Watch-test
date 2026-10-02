# Adaptive coach: audit and plan (ADAPT-1)

Owner goal (2026-09-28): "The app should adjust/adapt to the user's needs and performance, not keep giving hardcoded assumptions and logic on what a user should do."

Base: `origin/main` 6608f1a. Every file:line below was read at that commit by an auditor and then re-checked by a second, independent verifier who traced the path to the screen (probe scripts were run for the numeric claims). Where the verifier corrected an auditor, the corrected version is the one written here. Open PRs checked for overlap: #59 (BUG-19), #61 (BUG-18), #63 (LT-1), #64 (BUG-21). Queued card BUG-24 (from D-B18 on PR #61) is also checked: held sets still reach `calibrateAfterSession` and `loggedLoads`. Review r1 (PR #65) added the findings marked "(r1)"; the cited lines are unchanged on `main` b0b2259.

**Paths:** `data/*.ts` means `src/data/*.ts`; a bare `*.ts` in the brain means `src/brain/*.ts`, `coach/*` means `src/brain/coach/*`; `knowledge/methods.ts` is `src/escobar/knowledge/methods.ts`; `read.ts`, `show.ts`, `actions.ts` are under `src/escobar/tools/`.

**The typical user we judge against:** logs gym sessions on a phone, 2 to 4 sessions a week, rates effort on some sets and not others, misses whole weeks, often has no watch.

**Data classes used below:** EXISTING = computed from data the app already stores. NEW = needs a new stored field (**owner approval**, AGENTS.md). ASK = one question to the user, stored in an existing field.

Contents: 1. What already adapts · 2. Supervisor claims checked · 3. Findings by area (A to F) · 4. What must stay fixed · 5. Owner decisions needed · 6. References · PART A (for the owner) · PART B (build cards)

---

## 1. What already adapts (keep; gaps in §3)

| Mechanism | Where | Learns from | Gap |
|---|---|---|---|
| Effort bias (BR-10) | `effortBias.ts:23-82` | same-load max vs non-max pairs within 14 days, per label, 3+ pairs, capped ±3 reps; the coach rule works per exercise (`rules.ts:444-447`), Escobar's `methods.ts:116` pools the main lifts | Used only in coach wording (`rules.ts:447`, `knowledge/methods.ts:117`). Owner decision D11 keeps it out of e1RM. Labels that decide actions (live "add load", deload drift) read the label at face value: D-4. |
| Readiness baselines | `readiness.ts:57-61, 152-172, 183-189, 219-224` | check-ins z-scored against the user's last 30 days; sleep need = personal 14-night median; HRV z-score vs personal 7-day mean | An at-mean check-in scores 0.5, so normal days can read amber: B-1. |
| Learned recovery speed (BUG-17) | `recovery.ts:395-469`, clamp `data/recovery.ts:70-71` | per primary muscle, next-session max-rated e1RM vs predicted recovery | Rarely fires for the typical user; the planner does not read it: B-5, C-6. |
| Recovery priors | `recovery.ts:70-79, 94-98, 119-128, 139-144, 176, 183-184, 241-247` | training age, birth year, own chronic load, own RHR spread, own typical dose, novelty/layoff | none found |
| Observed HR max (BR-12) | `heart.ts:21-35, 57-73, 163-172` | highest validated plateau, never below Tanaka, decays after 12 months | Live heart-guided rest does not pass it: D-2. |
| Equipment profiles; load menu (LT-1) | `units.ts:44-57` `resolveProfile` (per exercise and gym); logged loads as rungs only in PR #63 (not merged) | the user's own equipment; PR #63 adds logged loads | LT-2..5 queued. |
| Logged loads stay loadable (BUG-11) | `progression.ts:115-128, 160-163` | loads the user already used | `loggedLoads` still counts held (implausible) sets: BUG-24. |
| Lighter weeks skipped in targets (BUG-15) | `progression.ts:227-237` | user's own deload sessions | none |
| Effort drift | `effort.ts:12-25` | user's own rating trend per lift | none |
| Planned week / adherence | `weekly.ts:87-94`, `weeklyReview.ts:90-103` | user's schedule and days off | Without a schedule it falls back to 3, ignoring `plannedDays`: C-8, F-1. |
| Specialisation target, duration drift, records | `rules.ts:286-290`, `post.ts:107-113`, `post.ts:15-37` | user's own median weeks, sessions and bests | none |
| Live step size | `live.ts:32` | 2.5 % of target after 3 sessions of history | LT-3 reworks it. |
| Pre-set heart baseline (BUG-21, PR #64) | PR #64 `preSetBpmFromWindow` | user's own pre-set trough | still uses population HR max: D-2. |

## 2. Supervisor's first-pass claims, checked

| Claim | Verdict |
|---|---|
| Volume bands are set by level only (`volume.ts:11-15`, `data/volume.ts:8-21`) | **Confirmed.** Level is a lifetime score of sets weighted by role and effort (`exposure.ts:60-78, 136-155`) that never reads `trainingSince`, never decays and never reads the user's response. C-1, C-2. |
| `FULL_WEEK_SESSIONS = 3` hides "under" for twice-a-week users (`volume.ts:9`) | **Confirmed** by probe: 2 sessions a week at 4-5 hamstring sets reads "in"; the same sets over 3 sessions read "under". C-3. |
| Planner's `MIN_RECOVERY_HOURS = 48` ignores learned recovery (`plan.ts:43`) | **Corrected.** The constant is dead code (read nowhere). The real rule, `plan.ts:133-139`, only compares back-to-back weekdays with 3+ direct sets each and writes a literal 24 h; the text at `:140` hard-codes "48 h". The point stands: the planner never reads `tauScale`. C-6. |
| `WORK_SEC_PER_SET = 45` instead of logged durations (`plan.ts:36`) | **Confirmed, and wider:** `plan.ts:146` also uses the goal's rest, not the user's rest setting, logged rest or logged session length. C-7. |
| Fixed `READINESS_WEIGHTS` and the 67/33 cutoffs (`readiness.ts:64-66`) | **Confirmed.** Nothing tunes them. The cutoffs cause a real harm (B-1); the weights are a lower priority (B-2). |
| Fixed `DELOAD_TRIGGER` (`deload.ts:42`) | **Confirmed.** `minHistoryDays` and `beginnerMonths` are fixed on purpose (owner decision D-A1(6)). The rest: A-7. |
| `MIN_REST_SEC` by effort only (`heart.ts:175`) | **Confirmed** (`heart.ts:175-178`; an unrated set counts as "ideal"). The values are research floors and stay (§4); only the unrated fallback should change (D-5). After BUG-21 it applies to accessories only. |

## 3. Findings

Each finding: **where** (file:line, value) · **harm** (typical user) · **rule** (what it learns, from which signal) · **data** · **basis** · **min data → fallback** · **bounds** · **effort / impact** (S/M/L; H/M/L = how much a user feels it) · **overlap**.

### A. Progression

**A-1 Rating under half your sets freezes the load.** (2 of 3 rated, 0.67, still increases.)
- where: `progression.ts:335` `if (coverage < 0.5 && hist.length >= 2)` → mode `confirm_effort`; the increase path also needs `:360` `effortCoverage > 0`. The same 0.5 line drives the "rate your sets" nag (`rules.ts:350`, E-8).
- harm (probe): a user who rates 1 of 3 sets gets "Keep the load and rate each set" every session; 3×12 at 40 kg never goes up.
- rule: when coverage is low, judge from reps: all working sets at or above the range top, at most 1 rep lost from set 1 to the last, on 2 sessions → allow one standard step. Keep asking for ratings, but stop holding the load.
- data: EXISTING (`LoggedSet.reps/effort/kind`). basis: ACSM 2009 "2-for-2" (LOAD-AWARE-TARGETS §1); COACHING-PLAN App. D 2 (novices rate RIR poorly, Steele 2017); [Halperin 2022].
- min data → fallback: 2 sessions of the lift → today's gate.
- bounds: one standard step at most (never the fast track); a max-rated set still blocks.
- S-M / **H**. overlap: BUG-18 (#61) keeps the gate; LT-2 runs after it. Gap: the freeze.

**A-2 Fixed effort→RIR table in every strength estimate.** Merged into D-4 (verifier M-4): the per-label bias is already learned (`effortBias.ts:67-82`); using it in e1RM is ruled out by owner decision D11 (`REMEDIATION-PLAN.md:70`). Only the owner can reopen that (§5).

**A-3 One plateau line and one noise level for every lifter.**
- where: `trend.ts:68` `PLATEAU_FLAT_TOTAL = 0.015`; `data/recovery.ts:80` `CALIBRATION_TYPICAL_ERROR = 0.04`; `prs.ts:70` `× 1.025`; `progression.ts:71` `× 0.95` (strength goal only).
- harm: a 3-year lifter gaining 1 % in 8 weeks (real for them) reads "plateaued"; two such lifts trigger an unneeded lighter week. A noisy logger's ±6 % swings can still flip plateau vs progressing.
- rule: per-lift typical error from scatter around the trend (last 12 sessions); plateau line = max(1.5 %, 2 × TE/√n); expected pace scaled by training age.
- data: EXISTING. basis: COACHING-PLAN App. D 1 (TE 2-5 %, changes under 2 TE are noise), App. D 4.
- min data → fallback: 8 sessions of the lift → constants. bounds: plateau line 1-4 %, TE 2-6 %.
- M / M. overlap: BUG-14's evidence bar stays (§4).

**A-4 Return after a break: 26 days off can still earn an increase; 5 months off returns to the old load.**
- where: `progression.ts:50` `REENTRY_DAYS = 28`; `trend.ts:78` `COMEBACK_GAP_DAYS = 28`.
- harm (probe): 2 × 40×12, then 26 days off → target 42.5 kg. After 156 days off → the old 40 kg.
- rule: no increase on the first session after 14+ days off; beyond 8 weeks, a return cut scaled by gap length; later, learn the cut from the user's own past comebacks (e1RM on return vs before).
- data: EXISTING. basis: [Bosquet 2013] (loss grows with the length of the break), [Hwang 2017] (2 weeks: strength kept), [Ogasawara 2013] (3-week breaks recovered quickly).
- min data → fallback: first-session rule needs none; learned cut needs 2 past comebacks → a fixed cut of 10 % beyond 8 weeks off (design value, no study gives an exact figure; the builder records it in `COACHING-DECISIONS.md`).
- bounds: return load 70-100 % of the last working load.
- S / M. overlap: BUG-18 only changes which load is the base.

**A-9 (r1) The step-down needs a "max" rating two sessions in a row.**
- where: `progression.ts:343-346` `belowAtMax = r.hasMax && r.topReps < range[0]`; `stepDown` needs it on the last two sessions (strength ranges use `e1rmDownAtMax`, also max-only).
- harm: an inconsistent rater whose reps fall under the range bottom (40 kg, range 8-12, reps 6 and 5) but who doesn't tap "max" never gets a lighter target; the load is held, or (under 50 % rated) they are asked to rate.
- rule: reps under the range bottom on 2 sessions in a row count as the step-down signal when the last set is unrated; "max" stays sufficient on its own. Same function and same user as A-1.
- data: EXISTING. basis: LOAD-AWARE-TARGETS §2 (sized step-down); ACSM 2009.
- min data → fallback: 2 sessions → today's rule. bounds: one step down (LT-2 later sizes it); an "easy"-rated set never triggers it.
- S / M. overlap: LT-2 sizes the step, not the trigger. **In ADAPT-3.**

**A-5 Load jumps don't remember how past jumps went.** `progression.ts:54-60, 348`. LT-2 already replaces the step with per-goal caps (D-A3), earn-the-rung and sized step-downs. Gap only: after 2 jumps on a lift that fell below the range bottom, prefer "earn" first. EXISTING; bounds: D-A3 caps. M / M. **Wait for LT-2.**

**A-6 Holds, carries and bodyweight moves progress by a fixed amount with no ceiling.** `progression.ts:252` (+5 s), `:275` (+5/10 m), `:312` (+1 rep forever). Plank 20→25 s is +25 %, 120→125 s is +4 %; push-ups climb past the goal's range with no "harder variation" hint. Rule: step as a share of the user's best; past range top + 5, suggest a harder variation. EXISTING; bounds hold 5-15 s, distance 5-20 m. basis: unverified. S / L. After V1.

**A-7 Lighter-week trigger counts stalled lifts, not a share; cooldown and dose fixed.** `deload.ts:42` (`stalledLifts: 2`, `cooldownDays: 28`); `data/deload.ts:3-4` (0.6 sets, 0.9 load; builder decision P4 within plan ranges). 2 of 8 lifts stalled gets the same offer as 2 of 2. Rule: trigger on max(2, 40 % of active main lifts); after a lighter week with no e1RM rebound, suggest a program change instead of another deload. Data: (a) EXISTING; (b) a history of past lighter weeks is NEW (`AppState.deload` holds one). basis: COACHING-PLAN App. D 17, [Coleman 2024], [Bell 2023]. Bounds: cooldown 21-42 days, factors inside the plan ranges. M / M. After V1.

**A-10 (r1) The over-band lighter-week trigger uses the level band, so it inherits C-2.** `deload.ts:114-122`: any muscle above its level band's top for 2 completed weeks plus one stalled main lift → lighter-week offer. A 3-year lifter new to the app (band 4-8) doing 9+ chest sets with one stalled lift gets an offer they don't need. Fixed by ADAPT-5's level seed (acceptance V9). EXISTING. S / M.

**A-8 A first-time lift starts from an equipment default.** `progression.ts:240-243`. LT-5 covers substitutions; gap = brand-new lifts: estimate from a related logged lift × pattern ratio, capped at 80 %. EXISTING. M / L. After LT-5.

### B. Recovery and readiness

**B-1 An ordinary day can read amber and block the load increase.**
- where: `readiness.ts:65-66` (67/33); the check-in part maps the user's own average to 0.5 (`:168-171`, `clamp(0.5 ± z/3)`), and below 3 past check-ins `rawFallback` (`:166`) also scores 3/3/3 as 0.5; weight 0.35 (`:64`); band `:269`; amber → `no_increase` (`:273`, no calibrating check) → gate `progression.ts:364`. The hold text at `:375` ("Readiness is middling today…") is only the fallback for `ctx.readiness.reason`.
- calibration (r1): `calibrating` (`:275-277`) needs 14 **distinct check-in days in the last 30** (or 14 sleep nights). A no-watch user who checks in 2-3 times a week has 9-13 days, so they stay "calibrating" for good. Any fix gated on 14 days would never reach them.
- harm (verifier's probe, with a real 4-week history): average check-in + target muscle 100 % recovered → 68 green. The same check-in 3 days after the last push day (chest 90 %) → **65 amber, no increase**; 2 days after (78 %) → 62 amber. With fewer than 3 sessions in 28 days (no load input) an average day **cannot** reach green (max 65). Skipping the check-in reads green. So for a user who trains each muscle twice a week, checking in honestly on a normal day costs the progression.
- rule, in two steps: (1) **from 3 past check-ins** (the existing z-score minimum), score each check-in part as `clamp(0.75 ± z/3, 0, 1)` instead of `clamp(0.5 ± z/3)`, where z is the existing z-score against the user's own **mean** (`zScore`, `readiness.ts:57-61`), so the user's usual answer maps to "normal" (0.75; with the verifier's inputs, check-in 0.35 + recovery 0.15 + load 0.05, an average day then scores 78 at 78 % recovery and 81 at 90 %, instead of 62 and 65); a 3/3/3 first check-in (`rawFallback`) also maps to normal. The builder records the 0.75 centre and the z/3 slope in `COACHING-DECISIONS.md`. (2) **Later (after V1, r2):** band against the user's own score distribution. Not in ADAPT-2: `readiness()` scores one day and has four callers (`app/selectors.ts:41`, `coach/rules.ts:120, 655`, `escobar/tools/context.ts:69`); past scores need `readinessSeries` (`coach/rules.ts:645-661`); and a percentile cutoff makes about 1 day in 4 amber by construction. If built, the cutoff may only loosen: `clamp(p25, 33, 67)`, check-in days only.
- data: EXISTING (`checkIns`, `healthDays`; `readinessSeries`). basis: COACHING-PLAN 6.4, App. A 7 (bands on a personal baseline), [Saw 2016] (self-report leads).
- min data → fallback: step 1 from 3 check-ins (before that, the re-centred raw rating), with the fixed 67/33 bands. The 14-day `calibrating` flag keeps its label meaning; it no longer decides whether an average day can be green.
- bounds: "reduce" still needs corroboration (D-B16, `:272`); the 67/33 cutoffs stay; the centre only moves the check-in part (0.5 → 0.75), never the bands.
- S / **H**. overlap: none (BUG-16 did load-only and corroboration).
- side note (verifier M-3): the comment at `readiness.ts:147` says 14 days; the code uses 30 (`:136`).

**B-9 (r1) Coming back after missed weeks reads as a load spike.**
- where: `recovery.ts:119-127` `acuteChronicRatio` (7-day load vs the 28-day mean, zero weeks included), threshold `data/recovery.ts:48` `SYSTEMIC_LOAD_RATIO = 1.3`; used by the whole-body factor (`recovery.ts:147`, up to ×1.25) and the readiness load part (`readiness.ts:231-232`, 0 at 1.5, "load" driver under 0.5).
- harm (probe, 3 sessions a week of the same work): steady → 1.00; one missed week, then an ordinary week → **1.33** (small: factor ×1.015, load score 0.85); two missed weeks, then an ordinary week → **2.00** (every muscle's recovery slowed ×1.25, load score 0 with the "training load is up" driver). The user did less, not more.
- rule: compare the acute week with the user's usual trained week (median load of the last 4 trained weeks, skipping empty weeks), or cap the ratio at the level of the user's highest steady week. A true jump above the usual week still counts.
- data: EXISTING. basis: COACHING-PLAN 6.11 point 9 and App. D 17 (ACWR is weak evidence; Gabbett's 1.3 is a population line).
- min data → fallback: 3 trained weeks in the last 8 → today's ratio. bounds: 1.3 threshold and the 1.25 caps unchanged.
- S / M. overlap: none. **In ADAPT-2** (same readiness path, same typical user).

**B-10 (r1) The 60 % recovery hold uses the population model.** `progression.ts:52` `RECOVERY_HOLD_PCT = 60`, gate `:364`. Probe (Mon/Thu full body, established profile): the target muscles sit at 97-99 % after "ideal" weeks and 93-98 % after "max" weeks on the next session, so the hold almost never fires for a twice-a-week user; it matters for 3-4 day splits that hit a muscle on consecutive days, where B-5's calibration gaps leave the model at the population speed. No card: it improves as B-5 lands. Stays fixed as a safety floor (§4).

**B-2 Readiness weights never tune.** `readiness.ts:64` ("start weights, tune later", plan 6.4). Rule: regress next-session performance on each sub-score, nudge ±30 %, check-in weight stays largest. EXISTING. Needs 30+ sessions with 2+ inputs; App. D 16 says daily readiness predicts 1RM weakly, so the signal is noisy. L / L-M. **After V1.**

**B-3 Resting-HR part uses a fixed 10 bpm though the personal spread is computed.** `readiness.ts:212-214` `1 - delta/10`, driver at +5; `restingHr28dSd` (`:46`) is read nowhere else. Rule: z = delta / max(sd, 1.5), driver at z ≥ 1 (the recovery model already does this, `recovery.ts:141-143`). EXISTING; 14 days of RHR → /10. S / L (watch users only). PR #64 does not touch `readiness.ts`.

**B-4 Whole-body sleep slowdown at a fixed 6.5 h.** `data/recovery.ts:44`, used `recovery.ts:137`. A habitual 6.2 h sleeper is slowed ×1.1 forever; an 8.5 h sleeper at 6.7 h gets nothing. Rule: 7-day mean below personal 28-day median − 60 min, plus an absolute floor (value unverified). EXISTING; 14 nights → 6.5 h. basis: App. A 6. S / L-M. After V1.

**B-5 Learned recovery (BUG-17) rarely fires for the typical user.**
- where: `recovery.ts:434, 436` (both sessions need a max-rated set), `:438` (pair under 7 days apart; exactly weekly skips), `:440` (primary muscles), `e1rm.ts:12/16` (no e1RM above 10 reps or without load).
- gaps: (1) inconsistent raters almost never give a max/max pair; (2) once-a-week splits never calibrate; (3) bodyweight lifts never calibrate (plan 6.11 point 8 asks for reps at the same load); (4) soreness 4-5 and "Mark as fresh" are not observations (plan 6.11 point 7); (5) sets over 10 reps give no e1RM, so most lean/growth accessory work never calibrates.
- rule: add ideal/ideal pairs at the same load (reps change), bodyweight reps at the same load, and soreness / fresh-mark observations with a smaller weight; keep the 2×TE gate.
- data: EXISTING (`CheckIn.soreness`, `FreshMark`, `RecoveryModel`). basis: plan 6.11 points 7-8; App. C 11.
- bounds: existing 0.7-1.6 clamp, ×1.1/×0.92 steps, decay. M / M. After V1.
- overlap (r1): **BUG-24** (queued, from D-B18 on PR #61) removes held (implausible) sets from `calibrateAfterSession` and `loggedLoads`. Widening calibration before BUG-24 lands would feed more held sets into `tauScale`, so ADAPT-7 waits for BUG-24.

**B-6 Soreness cap at a fixed rating of 4.** `data/recovery.ts:67-68`, `recovery.ts:349`. A user who always rates legs 4 is capped at 60 % every time. Rule: cap at the user's own 80th percentile for that muscle (min 3). EXISTING; 10 ratings → 4. S / L. After V1.

**B-7 Training-load proxy moves with rating habits.** `recovery.ts:107-108` `{easy:4, ideal:7, max:10}`; rating more sets "max" raises acute load ~43 % with no change in training. Rule: unrated sets at the user's median effort; cap week-to-week change caused by coverage. EXISTING. S / L. After V1. BUG-19 fixes the duration half.

**B-8 Balance note ignores a deliberate split and returns after every snooze.** `balance.ts:26, 33, 80`; snooze 7 days (`rules.ts:574`). Rule: after 2 snoozes, ask once "Is this on purpose?" → sets `Split.focus` or a long mute. EXISTING + ASK. basis: unverified. S / L. Folded into E-7.

### C. Volume and planning

**C-1 The volume band never learns from the user's response.**
- where: `data/volume.ts:8-14` `[[4,8],[6,10],[8,14],[10,18],[12,20]]`; `volume.ts:11-15`.
- path: Body "This week" bars (`Body.tsx:39`), coach `programming.volume` (`rules.ts:310-322`), Escobar `get_volume`/`show`, `evaluatePlan` (blocks at 1.5 × top, `plan.ts:97-104`; `actions.ts:153-154` refuses the plan).
- harm: a Developing user (chest 8-14) progresses 1 %/week on 16 sets for 6 weeks and is told "over your usual range… trim a set or two".
- rule: every 4 weeks, per muscle, look at its main lifts: progressing at or above the top with effort not rising → raise the top one step (+2); stalled with effort rising at in-band volume → lower it. Recomputed from history each time, so no stored field is needed.
- data: EXISTING. basis: COACHING-PLAN 6.4 ("personalise from performance and soreness feedback", never built), App. B "Volume landmarks… personalise"; [Pelland 2025] (diminishing but positive returns, no single right number); [Damas 2019], [Hammarström 2020] (large individual differences in response to volume).
- min data → fallback: 2 full 4-week windows with 2+ active main lifts for the muscle → level band.
- bounds: level top −2 to ×1.3, never above 25 sets (App. B); `OVERSHOOT_BLOCK` stays.
- M / H. **After V1** (needs C-2 first; noisy for inconsistent raters).

**C-2 Level is a lifetime set score (weighted by role and effort, `exposure.ts:60-78`): an experienced lifter new to the app is "New".**
- where: `exposure.ts:136-155` (`LEVELS`, `trainingLevels`), never reads `Profile.trainingSince` (`models.ts:265`), never decays.
- harm (probe): a 3-year lifter who sets `trainingSince` gets band 4-8 everywhere. Escobar's stock push/pull/legs twice a week is **blocked on 8 muscles** (chest 15.3 sets vs block 12, triceps 21.9, biceps 21.9…), so Escobar must cut it. An Advanced user back after 8 months keeps 12-20.
- rule: seed the level from `trainingSince` (12-36 months → at least Developing; 36+ → at least Established); decay the score after long breaks (last 26 weeks, or a half-life; value unverified, so **later**, not in ADAPT-5).
- data: EXISTING (+ ASK: onboarding already asks training age, plan 6.14). basis: COACHING-PLAN 6.13 "Sets per muscle vs band" (lists training age as an input).
- min data → fallback: works from session 1 when `trainingSince` is set → lifetime count.
- bounds: seed capped at Established; decay at most 2 levels.
- S / **H**. overlap: none (BUG-17 uses training age for recovery only).

**C-3 A "full week" is fixed at 3 sessions.** `volume.ts:9`, used `:47, :55`. A twice-a-week user can never get "under" (probe: 4-5 hamstring sets/week reads "in"; the same with a 3rd session reads "under"). Rule: full week = the user's planned count (`plannedThisWeek` → `Profile.plannedDays` → 8-week median), floor 2. EXISTING. basis: plan 6.13 row wording ("≥ 3 sessions"; intent was to skip partial weeks). S / M.

**C-4 The weekly review has its own fixed one-week band.** `weeklyReview.ts:27-32` (under 4 / 10 / 20). A New user with 3 hard sets in one week gets "under its usual range" from the review (via Escobar `read.ts:317`) while Body shows "in". Rule: reuse `muscleVolumeStatus`, one band everywhere. EXISTING. basis: plan 6.13 ("low" after 2 weeks), BR-16 (one count). S / M.

**C-5 The weekly review needs 5 logged days in the current week.** `weeklyReview.ts:171` `WEEKLY_REVIEW_DAYS = 5`, `:174-179`; card gated at `Coach.tsx:208-211`. A 3-a-week user **never sees the weekly review**; on Monday (week start) the week is empty. Rule: review the week just ended; enough = its sessions reached the user's planned count (C-3), floor 2. EXISTING. basis: the 5 is the plan's own acceptance line (COACHING-PLAN §7 P2-C, line 887), so the plan line changes too (§5). S / **H**.

**C-6 The planner's recovery check is a fixed adjacent-day rule.** `plan.ts:42` (3 sets), `:43` (dead), `:133-139` (literal 24 h), `:140` text. A slow-recovering user (quads `tauScale` 1.5) with 8 hard quad sets Mon and Wed gets no warning; a fast one with 3+3 sets Mon/Tue does. Rule: predict recovery % on the second day with `recoveryAt` (`recovery.ts:316`) and the user's `tauScale`; warn under the "ready" tier; every pair of days; delete the dead constant. EXISTING. basis: plan 6.11, App. C 1, 2, 15; [Morán-Navarro 2017]. Warn only, never block. M / M.

**C-7 Session length from a fixed 45 s per set and the goal's rest.** `plan.ts:36, 146`. A strength user (goal rest 150 s) with 36 sets is estimated at 117 min though their logged sessions take 75 min. Rule: seconds per working set = median of `durationSec / working sets` over the last trusted sessions → median logged rest + work → `preferences.restDefaultSec` + 45. EXISTING. Needs BUG-19 (true rest and duration). 4 live sessions → formula with the user's rest setting. Bounds 60-300 s per set; the 120-min block stays. S / M.

**C-8 Week target defaults to 3 without a schedule.** `weekly.ts:53, 63`. A user with `plannedDays` = 2 and no schedule always reads "Building momentum — one or two more sessions". Rule: `plannedThisWeek ?? plannedDays ?? 8-week median ?? 3`. EXISTING. S / M.

### D. Effort and heart

**D-1 The rest timer is one number for every exercise.** `session.ts:171` `startRest(preferences.restDefaultSec, …)` (default 90, `models.ts:541`). A user resting ~180 s on squats and ~60 s on curls taps every set. Rule: per exercise, the median logged rest of the last 3 sessions' live sets, shown with its source ("your usual 3:00"); only when it differs from the setting by 30 s+; main lifts never under the goal's floor. EXISTING (`LoggedSet.restSec`). basis: [Schoenfeld 2016], [Grgic 2017] (longer rest helps trained lifters on main lifts). 3 sessions of the exercise → setting. Bounds 45-300 s; main ≥ 90 s (120 s strength). Needs BUG-19. M / H. (F-6 is the same finding.)

**D-2 Live heart-guided rest ignores the observed HR max.** `Train.tsx:1171` `hrMax(s.profile).bpm` (no observed max), while `slices/workout/heart.ts:78` passes it. PR #64 keeps the same for drift. A 40-year-old with Tanaka 180 and an observed 192 gets a ready line 4 bpm too low. Rule: one selector with the observed max for live rest, drift and summary. EXISTING. S / L. **Gap in BUG-21**: note on PR #64 rather than a new card.

**D-3 Heart "ready" line fixed at +12 bpm / 35 % of reserve.** `heart.ts:180-181`. PR #64 notes "to be tuned on the GT6". Rule: learn from the user's recovery curve on sets whose next set met its target (needs LT-3's stored target). EXISTING + LT-3. basis: unverified. L / L. **After V1**, after a real-watch check.

**D-4 The learned effort bias only changes wording (includes A-2).** Bias computed per label (`effortBias.ts:67-82`), used only in copy. Action-deciding reads take labels at face value: `live.ts:54, 77` ("easy" → add load), `effort.ts:14` → deload drift (`deload.ts:109`), `exposure.ts:11` (recovery dose). A user whose "ideal" is really 5 reps in reserve (bias +3) never rates "easy", so live "room to add load" never fires. Rule: where a label decides an action (not e1RM), shift it by the learned bias: "ideal" with bias ≥ +2 counts as "easy" for the live add-load trigger; never shift "max". EXISTING. basis: plan 6.13 "RIR bias" (line 598: "the coach adjusts silently") and its copy (line 665); [Helms 2016], [Zourdos 2016], [Halperin 2022]. Min 3 pairs (`BIAS_MIN_OBSERVATIONS`) → face value; the plan's 8-week recalibration is not built (all history is used). Bounds ±3 (`BIAS_CAP_REPS`). M / M. D11 unchanged (not in e1RM). After V1.

**D-5 Unrated sets are assumed "ideal".** `heart.ts:174-177`, `exposure.ts:53-56`. Unrated sets already count as hard sets (only "easy" is left out, `exposure.ts:115`); what is understated is the recovery dose and the accessory heart-rest minimum. Rule: impute from the same exercise's rated sets in the same slot; never shown as the user's rating, never 'easy' for a rest minimum, never into e1RM. EXISTING. basis: unverified. M / L. After V1.

**D-6 (r1) The effort-drift deload trigger is effectively off for inconsistent raters.** `effort.ts:16` needs 4 of the last 6 sessions rated and 8 rated sets, else `unknown`; `deload.ts:109-111` counts only `harder`. A user who rates in 3 of 6 sessions never feeds trigger (b), so their lighter-week offer rests on plateau and readiness only. Rule: once A-1's rep rule exists, count "reps falling at the same load across 3 sessions" as a harder signal when ratings are missing. EXISTING. basis: plan 6.13 (effort drift), App. D 17. Min 4 sessions → `unknown`. Bounds: the gate stays for rated users (§4 effort-drift row); the rep signal only adds evidence. M / L. After V1 (with D-4 in ADAPT-7).

### E. Coach rules

**Cross-cutting (verified by grep of `src` and `escobar-worker`):** `Goal.failureShareCap`, `mainLiftWeeklySets` and `heavyShareMin` (`data/goals.ts:25-29`) are read by no app or Worker code (only `tests/goal.test.ts:19` reads `failureShareCap`). COACHING-PLAN 6.16 says the effort-mix, failure-share and main-lift volume rules must use them. E-1 to E-4 hard-code numbers instead.

**E-1 The plateau lever calls volume "low" below a fixed 10 sets, from last week only.** `rules.ts:420` (last completed week), `:425` `weekSets < 10`. Probe: a missed last week gives 0 sets, so the lever says "about 0 hard sets… add 3 to 4 sets" even when the usual week is in band. Rule: median of the last 3-4 trained weeks vs the muscle's band (and `mainLiftWeeklySets` for main lifts). EXISTING. basis: plan 6.13 "Plateau with one lever", 6.16 G7; [Schoenfeld 2017]. 3 trained weeks → 10. Bounds 4-20 sets. S / M.

**E-2 The plateau lever's failure share is a fixed 0.5.** `rules.ts:426`. A strength user at 40 % max sets (goal cap 0.3) is never told effort is the lever. Rule: `failureShareCap` of the goal (needs the goal in `CoachContext`, `rules.ts:71-88`: the context has `profile` and `profileHistory`, but the current goal is `AppState.goal`, not a `Profile` field, so it must be passed in by `app/selectors.ts:55` and `escobar/tools/context.ts:78`). EXISTING. basis: 6.16. S / M.

**E-3 The after-session effort mix ignores the goal and fires on one session.** `post.ts:47` `max <= 0.5 && easy <= 0.6`, `:57` `max > 0.5`, `:52` copy; also Escobar `read.ts:174`. A strength user at 45 % max gets "healthy spread" (cap 0.3). One noisy session fires the tip; plan 6.13 asks for 2 sessions of the split. Rule: cap from `failureShareCap`, easy check from `goal.rir`, fire only when the previous session of the split repeats it (pass prior sessions in). EXISTING. S / M.

**E-4 The rest tip treats only goal 'strength' as strength and ignores the user's timer.** `post.ts:92` `isStrengthGoal ? 120 : 90`, `:100` copy; callers `Train.tsx:1059` and `read.ts:174` pass `goal === 'strength'`. A strength_muscle user (goal rest 120 s) resting 100 s with reps falling 8→5 gets no tip. Rule: threshold = the goal's `restDefaultSec`; when auto-rest is on and the setting is below it, name the setting. EXISTING. basis: 6.13 "Rest and density", 6.16 G6; [Schoenfeld 2016]. S / M.

**E-5 Pre-session fallback target assumes 8 reps.** `pre.ts:125`. Rare path (only when `targetFor` has no load). Rule: the goal's main reps. EXISTING. S / L. Fold into LT-2.

**E-6 "N days since your last session" ignores days off and the user's rhythm.** `rules.ts:332-339` (fires at 7); `CoachContext` has no `daysOff`. A user on a marked 10-day holiday is nagged on day 7. Rule: skip days off; fire at max(7, 2 × usual gap). EXISTING. basis: 6.13 "Adherence" (never a reset for one miss); [Hwang 2017]. S / M.

**E-7 A snooze always lasts 7 days.** `rules.ts:573-575`. "Rate your sets", balance and similar notes return weekly forever. Rule: 7 → 14 → 28 days on repeated snoozes of the same id; alerts exempt. EXISTING (`insightFeedback`). basis: notification burden (general practice; unverified). S / M.

**E-8 "Rate your sets" at a fixed 50 % forever.** `rules.ts:348-350`. Must change together with A-1's gate (`progression.ts:335`), or the nag stops while targets stay held (verifier). Rule: once A-1's rep fallback exists, nag only when an exercise's rep pattern is ambiguous; after 2 snoozes offer "rate only your last set" (ASK). EXISTING. S / M.

**E-9 The green-readiness note shows only on Mondays.** `rules.ts:501`. A Tue/Thu/Sat lifter never sees it on a training day. Rule: first scheduled training day of the week. EXISTING. S / L.

**E-10 The 60+ note repeats every session.** `pre.ts:88-99`. Lowest priority (it never displaces a load target), but repeats forever. Rule: first 3 sessions after age is known. EXISTING. S / L. After V1.

**E-11 Substitutes ranked by library match, not by what the user already lifts.** `substitute.ts:7-12`; also Escobar's top 3 (`show.ts:187`). Rule: logged history first, then pattern, then equipment. EXISTING. S / M. LT-5 adds the starting load, not the ranking.

**E-12 Cues ignore training age and repeat.** `cues.ts:53` `recent` is never passed. Rule: pass recent cue ids; tag cues by level. EXISTING. M / L. After V1.

### F. User preferences and the AI coach

Profile fields and who reads them (grep, verified): `plannedDays` is read only by the Escobar brief (`brief.ts:110`), `actions.ts:227`, `apply.ts:164` and `profile.ts:41`, **never by coaching logic**; `Profile.tsx:70` shows `?? 3` when unset. `preferences.restDefaultSec` drives only the timer. `escobar.memory` (injury, equipment, preference) reaches only the AI.

**F-1 Planned days per week is asked for but no rule reads it.** `models.ts:267`. It is the signal C-3, C-5, C-8 and E-6 need. The Profile screen should show "not set" instead of 3. EXISTING. basis: plan 6.14 ("unlocks adherence, volume bands"). M / M.

**F-2 The default goal is never questioned.** `data/goals.ts:60` `DEFAULT_GOAL = 'lean'`; the brief shows it as if chosen. Rule: when `profileHistory` has no user/onboarding goal row, say "goal: default, not chosen" in the brief and show a one-time "Confirm your goal" note. EXISTING + ASK. basis: plan 6.16 G9. S / M.

**F-3 Escobar's plan mode asks what the profile already knows; session length has no home.** `escobar/context/modes.ts:10` already says "unless memory answers them"; the gap is the profile. Rule: "unless the profile or memory answers them". Storing a preferred session length is NEW (§5). S (prompt) / M.

**F-4 `evaluate_plan` grades on fixed timing and recovery.** `escobar/tools/plan.ts:8` passes only goal, custom, sessions, today. Same fixes as C-6 and C-7 (the user's rest, own durations, `tauScale`). A 24-set strength plan reads 78 min; with the user's own 60 s rest it would be 42. EXISTING. M / M.

**F-5 Injuries and "don't have that" told to Escobar never reach the app's own advice.** `models.ts:385-399` free-text memory; no brain file reads it. Train still adds load to the painful lift and offers it as a substitute. Rule: a structured "avoid" record (exercise or muscle, until date) that holds targets, flags the brief and filters substitutes; can only hold or reduce. **NEW data (§5)**. Interim with no new data: tell Escobar's policy to use `propose_today` (swap/remove) when an injury memory exists. M-L / H.

**F-6 Rest timer one length for all.** Same as D-1.

**F-7 The AI brief lacks the effort target, rest setting and rating coverage.** `brief.ts:105-114`. Rule: add `goal rir`, `rest setting`, `effort ratings x % of recent sets` with fact ids. EXISTING; these lines are derived from data already stored and already sent in other forms, but they do change what is sent to the AI provider, so the card must say so and add no new kind of data. S / L.

**Missed by the auditors, found by the verifiers (included above):** `plannedDays` unread (F-1); an at-mean check-in is 0.5, so no-load-input users can't reach green (B-1); `read.ts:174` second strength-goal caller (E-4); the shared 0.5 line (A-1/E-8); `readiness.ts:147` comment drift. **Review r1 added:** A-9 (step-down needs "max"), A-10 (over-band lighter week on the level band), B-9 (missed weeks read as a load spike), B-10 (60 % recovery hold), D-6 (effort-drift gate), and BUG-24's overlap with B-5. Side note: `plan.ts:85` counts secondary sets at 0.55 while the weekly count uses 0.5 (`exposure.ts:10,13`), so a planned and a logged week count the same muscle differently.

## 4. What must stay fixed, and why

| Fixed value | Where | Why it stays |
|---|---|---|
| Lighter-week history and beginner gates (28 days, 3 months) | `deload.ts:42` | Owner decision D-A1(6). |
| Heart rate never shortens a main lift's rest; the timer is the floor | D-A1(4), PR #64 | Owner decision. |
| Drift 8 %, effort-mismatch rule, no load cut from heart rate | D-A1(5, 7), App. B | Owner decision. |
| Effort bias stays out of e1RM | D11 (`REMEDIATION-PLAN.md:70`) | Owner decision: applying it moves records and progression retroactively. |
| Warm-ups 50/70/85 % | `pre.ts:51-52`, D10 | Owner decision; cheap, and noisy data must not thin them. |
| Per-goal jump caps (10 / 12.5 / 15 / 20 %) | D-A3 | The upper bound for any learned step. |
| `MIN_REST_SEC` 60/90/120 | `heart.ts:175` | Research floors ([Grgic 2017], [Schoenfeld 2016]); now accessories only. |
| Recovery clamp 0.7-1.6, ×1.1/×0.92 steps, 2×TE noise gate | `data/recovery.ts:70-81` | Keeps noisy data from running away (plan 6.11 point 8). A learned TE may replace 4 % within 2-6 %, never remove the gate. |
| Systemic caps 1.25; READY 90 %, FULL 97 % | `data/recovery.ts:49-50, 61-62` | Safety caps and definitions the whole UI reads. |
| Soreness cap only lowers recovery | `data/recovery.ts:67` | Direction of safety (the threshold may adapt, B-6). |
| Load never leads readiness; "reduce" needs corroboration | `readiness.ts:258-261, 272-273` | D-B16, App. B "self-report leads". |
| No increase on lighter-week, amber/red or cut days | `progression.ts:201-202` | Plan 6.13, BUG-15. B-1 changes when a day is amber, not this rule. |
| e1RM limits: 10 reps max, Epley | `e1rm.ts:10-12` | Formula validity ([Reynolds 2006]: error grows with reps). |
| Plateau evidence bar (6+ sessions over 42+ days), active lift 42 days | `trend.ts:65-67`, `history.ts:58` | Minimum-evidence rules (BUG-14). |
| Data-trust guards (load > 500 kg or > 1.25 × best; live-gap and burst windows) | `fidelity.ts:94-95, 12-20` | Logging trust, not preference. |
| Plan safety caps: 120 min, 1.5 × band top, 6 sets per exercise; ~25 sets per muscle ceiling | `plan.ts:37, 40, 45`; App. B | Adapt the band they multiply, never the multipliers. |
| Effort-drift minimums: 4 of the last 6 sessions rated, 8 rated sets | `effort.ts:16` | They keep inconsistent raters from *triggering* a deload on noisy ratings; D-6 only adds a rep-based signal. |
| Effort-bias bounds: 3 pairs minimum, ±3 cap | `effortBias.ts:11-12` | Plan 6.13 bounds on learning. |
| Coaching behaviour thresholds (failure share > 50 %, adherence 60/85 %, reps fell 25 %, duration +20 %) | `weeklyReview.ts:229, 304, 313`; `post.ts:91, 113` | Learning them from the same behaviour would silence the note. The user's data sets the baseline, not the trigger. |
| Never an increase on the first session after a long break | `progression.ts:50`, `rules.ts:337-339` | Safety. What stays fixed is "no increase"; the return **load** is not fixed: A-4 / ADAPT-3 adds a cut after 8+ weeks and extends "no increase" down to 14 days. |
| Recovery hold under 60 % | `progression.ts:52, 364` | Safety floor; it gets more personal as B-5 calibrates the model, the number itself stays (B-10). |
| Masters (60+) content, focus bump cap +3 sets, Escobar input bounds, safety escalation | `pre.ts:88-99`, `rules.ts:289-290`, `actions.ts`, Worker policy | Research-fixed or safety. |
| Published formulas: Mifflin-St Jeor, Keytel, Tanaka, Karvonen zones | `energy.ts`, `heart.ts:86-88` | Definitions; personal inputs already feed them. |

## 5. Owner decisions needed (nothing below is built until approved)

1. **New stored data** (AGENTS.md: "new kinds of saved data need the owner's approval"):
   - F-5 structured "avoid" record (exercise or muscle, until date, reason) so injuries told to Escobar hold targets and filter substitutes. Highest value of the three.
   - F-3 preferred session length (asked once).
   - A-7(b) a history of past lighter weeks.
2. **Plan text change:** C-5 replaces COACHING-PLAN §7 P2-C's "≥ 5 logged days" with "the week reached the user's planned sessions (at least 2)". The supervisor may approve a plan edit; flagged here because it changes an acceptance line.
3. **D11 stays** unless the owner reopens it (applying the effort bias to strength estimates). This plan does not need it.

## 6. References

Plan sections are in `docs/COACHING-PLAN.md` (6.4, 6.11, 6.13, 6.14, 6.16, App. A-D). Studies (found by a research pass; the four marked ✓ were opened directly, the rest were confirmed from indexed PubMed/journal listings but not opened, because PubMed blocked automated fetches):

- [Bell 2023] Bell L et al. Integrating deloading into strength and physique sports training programmes: an international Delphi consensus approach. Sports Med Open 9:87. doi:10.1186/s40798-023-00633-0
- [Bosquet 2013] Bosquet L et al. Effect of training cessation on muscular performance: a meta-analysis. Scand J Med Sci Sports 23(3):e140-9. Strength loss grows with the length of the break.
- [Coleman 2024] ✓ Coleman M et al. Gaining more from doing less? The effects of a one-week deload period during supervised resistance training. PeerJ 12:e16777. doi:10.7717/peerj.16777
- [Damas 2019] Damas F et al. Myofibrillar protein synthesis and muscle hypertrophy individualized responses to systematically changing resistance training variables in trained young men. J Appl Physiol 127(3):806-815. doi:10.1152/japplphysiol.00350.2019
- [Grgic 2017] Grgic J et al. The effects of short versus long inter-set rest intervals in resistance training on measures of muscle hypertrophy: a systematic review. Eur J Sport Sci. PMID 28641044.
- [Halperin 2022] Halperin I et al. Accuracy in predicting repetitions to task failure in resistance exercise: a scoping review and exploratory meta-analysis. Sports Med. People misjudge reps in reserve, more so far from failure.
- [Hammarström 2020] Hammarström D et al. Benefits of higher resistance-training volume are related to ribosome biogenesis. J Physiol 598(3):543-565. doi:10.1113/JP278455
- [Helms 2016] Helms ER et al. Application of the repetitions in reserve-based rating of perceived exertion scale for resistance training. Strength Cond J 38(4):42-49. doi:10.1519/SSC.0000000000000218
- [Hwang 2017] Hwang PS et al. Resistance training-induced elevations in muscular strength in trained males are maintained after two weeks of detraining. J Strength Cond Res.
- [Larsen 2021] ✓ Larsen S et al. Effects of subjective and objective autoregulation methods… a systematic review. PeerJ 9:e10663. doi:10.7717/peerj.10663
- [Morán-Navarro 2017] Morán-Navarro R et al. Time course of recovery following resistance training leading or not to failure. Eur J Appl Physiol 117(12):2387-2399.
- [Ogasawara 2013] Ogasawara R et al. Comparison of muscle hypertrophy following 6-month of continuous and periodic strength training. Eur J Appl Physiol 113(4):975-985.
- [Pelland 2025] ✓ Pelland JC et al. The resistance training dose response: meta-regressions exploring the effects of weekly volume and frequency on muscle hypertrophy and strength gains. Sports Med. doi:10.1007/s40279-025-02344-w
- [Reynolds 2006] ✓ Reynolds JM et al. Prediction of one repetition maximum strength from multiple repetition maximum testing and anthropometry. J Strength Cond Res 20(3):584-592. doi:10.1519/R-15304.1
- [Saw 2016] Saw AE et al. Monitoring the athlete training response: subjective self-reported measures trump commonly used objective measures. Br J Sports Med 50(5):281-291. PMID 26423706.
- [Schoenfeld 2016] Schoenfeld BJ et al. Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. J Strength Cond Res. PMID 26605807.
- [Schoenfeld 2017] Schoenfeld BJ et al. Dose-response relationship between weekly resistance training volume and increases in muscle mass. J Sports Sci 35(11):1073-1082. PMID 27433992.
- [Zourdos 2016] Zourdos MC et al. Novel resistance training-specific rating of perceived exertion scale measuring repetitions in reserve. J Strength Cond Res 30(1):267-275. PMID 26049792.
- Also used by the plan already: Steele 2017 (App. D 2), Greig 2020 autoregulation review (autoregulation matched or beat fixed loading).

Values marked "unverified" above (sleep floor, volume-decay half-life, cue tagging, snooze back-off, heart ready-line learning, effort imputation) have no study behind them; builders must record the chosen value and why in `COACHING-DECISIONS.md`.

---

## PART A. For the owner (plain words)

**What already learns from you:** how you rate effort (wording only), your normal sleep, mood and soreness, how fast each muscle recovers (BUG-17), your real top heart rate, and the weights you use.

**What would help most, ranked by how much you would feel it:**
1. **A normal day shouldn't block progress.** Checking in honestly a few days after training can read "amber", which stops the weight going up. Coming back after missed weeks also reads as "too much load". Fix: judge "normal" against your own average from your first few check-ins.
2. **Rating only some sets shouldn't freeze your weights.** Today, if you rate fewer than half your sets, the app keeps the weight the same forever, and never lowers it unless you tap "max". Fix: judge from your reps when ratings are missing.
3. **Use the days per week you told us.** A twice-a-week lifter is never told a muscle is under-trained, and a three-a-week lifter never sees the weekly review (it needs 5 days). Fix: use your planned days.
4. **Know an experienced lifter is experienced.** Today everyone new to the app counts as a beginner, so a normal push/pull/legs plan gets blocked. Fix: start from the training age you enter.
5. **Coach notes that fit your goal.**
6. **After Version 1:** a rest timer per exercise, from how long you really rest, and snoozes that back off.

**What stays fixed on purpose:** safety limits (biggest weight jump, rest floors, "no increase on a hard day", no weight cut from heart rate), your earlier decisions (D-A1, D10, D11), and research formulas. They protect you from noisy data.

**Your decisions:** saving injuries you tell Escobar so the app itself avoids those lifts (new saved data); saving a preferred session length; keeping a history of lighter weeks.

---

## PART B. Build cards

Version 1 order: coaching correctness first (ADAPT-2 to ADAPT-5), then the form guide for the owner's 15 exercises, then error reports, then QA, the 50 simulated users and release. ADAPT-6 and ADAPT-7 wait until after Version 1.

**Common to every card:**
- **base:** the latest `origin/main` at dispatch (this doc was checked against b0b2259).
- **read_first:** `AGENTS.md`, this doc's findings for the card, and the COACHING-PLAN sections they cite.
- **design_reference:** this doc (the finding IDs in the card title); no new UI design except ADAPT-4's one Profile label.
- **connectivity:** offline and local; no network call, no new provider, no new stored data. No card adds a new kind of data sent to the AI provider. ADAPT-2 to ADAPT-4 change the values in Escobar tool results (readiness via `escobar/tools/context.ts:69` and `show.ts:124`, the weekly review via `read.ts:317`, volume); ADAPT-5 adds one derived brief line (V8) and the rest tip in `read.ts:174`.
- **verification:** unit tests (vitest), which fail on `main` before the change and pass after, with each test's bite proved by a mutation listed in the PR; then `npm run check`, `npm run test:tz` and the gate on the merged head. ADAPT-4 adds a gate probe for its Profile label. No card needs a real phone.
- **risk_and_recovery:** each change sits behind the fallback named in its finding (today's constant until the minimum data exists), so reverting the card's commit restores today's behaviour; nothing is migrated.
- **return:** a PR titled with the card ID, listing the head commit, changed paths, the evidence per criterion, the mutations, and a `COACHING-DECISIONS.md` entry for every value the card chose.

### ADAPT-2 Readiness judges "normal" against the user (B-1, B-3, B-9) — Version 1
- **outcome:** an ordinary day for this user reads green from their first check-ins, not after 14; only a genuinely worse day, or a real load jump, holds the load. Coming back after missed weeks is not a spike. (B-1 step 2, personal percentile bands, is after V1.)
- **write_scope:** `src/brain/readiness.ts`, `src/brain/recovery.ts` (`acuteChronicRatio` only), readiness and recovery tests (add-only blocks), `docs/COACHING-DECISIONS.md` (one entry). **reserved_paths:** `progression.ts` (read only), `calibrateAfterSession` (BUG-24, ADAPT-7), everything the watch agent owns.
- **depends_on:** none (BUG-16, BUG-17 merged). PR #64 does not touch these files.
- **acceptance (tests):**
  - R1: 20 check-in days, all 3/3/3 (soreness 2), today the same, 4 weeks of sessions, target muscle 90 % recovered → `green`, advice `normal` (fails on `main`: 65 amber, `no_increase`).
  - R2: same, no sessions in the last 28 days, 100 % recovered → `green` (fails on `main`: at most 65).
  - R3 (the typical user): **10 check-in days in the last 30** (2-3 a week), no watch, today average, 4 weeks of sessions, 90 % recovered → not amber from the check-in alone: `green` (fails on `main`: 65 amber; `calibrating` stays true).
  - R4: first-ever check-in 3/3/3, 4 weeks of sessions, 90 % recovered → `green` (fails on `main`: `rawFallback` 0.5 → amber).
  - R5 (failure path): today 2 SD worse than the user's own mean on sleep and soreness → `amber` or `red`; `reduce` still needs corroboration (D-B16 tests unchanged).
  - R6: resting HR +4 bpm with a personal SD of 1 → driver "resting heart rate is up"; +6 bpm with SD 5 → no driver (fails on `main` both ways: fixed 10 bpm, driver at +5).
  - R7: 3 sessions a week, two missed weeks, an ordinary return week → no load driver and no whole-body slowdown (fails on `main`: ratio 2.00, ×1.25, load score 0).
  - R8 (failure path): a return week at 1.6 × the usual trained week → the load driver still fires.
  - Existing readiness, recovery, progression and deload tests pass unchanged.
- **risk:** more green days means more increases; mitigated by the unchanged 67/33 bands, the per-muscle 60 % hold, the goal caps, and R5/R8.

### ADAPT-3 Progression without perfect ratings, and after breaks (A-1, A-9, E-8, A-4) — Version 1
- **outcome:** users who rate only some sets still progress and still get a lighter target when reps fall; a break of 2+ weeks never earns an increase on the first session back; a long break returns lighter.
- **write_scope:** `src/brain/progression.ts`, `src/brain/coach/rules.ts` (effort-missing rule only), their tests (add-only), `docs/COACHING-DECISIONS.md`. **reserved_paths:** `e1rm.ts`, `effortBias.ts`, `loggedLoads` (BUG-24).
- **depends_on:** BUG-18 (PR #61) merged first (same function); before LT-2.
- **acceptance (tests):**
  - P1: 2 sessions of 3×12 at 40 kg (range 8-12), 1 of 3 sets rated "ideal", no rep drop → `increase` by one standard step (fails on `main`: `confirm_effort`).
  - P2 (failure path): same with reps 12, 10, 8 → no increase (ambiguous; asks to rate).
  - P3: a max-rated set in the last session → no increase (unchanged).
  - P4: 40 kg, range 8-12, top reps 6 then 5 on two sessions, (a) 2 of 3 sets rated "ideal" and the last set unrated, and (b) 1 of 3 rated (coverage under 0.5) → `reduce` by one step in both (fails on `main`: (a) needs "max" twice; (b) `confirm_effort` at `:335` returns first, so the rep rule must run before that gate).
  - P5 (failure path): reps under the range on one session only, or an "easy"-rated last set → no step-down.
  - P6: 2 × 40×12 then 26 days off → 40 kg, no increase (fails on `main`: 42.5).
  - P7: 156 days off → 36 kg or the nearest rung below (the 10 % cut beyond 8 weeks, inside 70-100 %) (fails on `main`: 40).
  - P8: the "rate your sets" note does not fire for a lift P1's rep rule already decided (fails on `main`).
  - All existing progression tests pass.
- **risk:** increases for lifters who stop short with little effort; mitigated by the range top on every set, two sessions, one step.

### ADAPT-4 The user's own week (C-3, C-5, C-8, F-1, E-6, E-9) — Version 1
- **outcome:** the app uses the days per week the user planned; twice-a-week lifters get volume feedback; 3-a-week lifters see the weekly review.
- **write_scope:** `src/brain/volume.ts`, `weekly.ts`, `coach/weeklyReview.ts`, `coach/rules.ts` (gap and green-readiness rules), `src/app/selectors.ts` and `src/escobar/tools/context.ts` `coachCtx` (pass `plannedDays` and `daysOff` into `CoachContext`; smallest wiring, called out), `src/slices/profile/Profile.tsx` (show "not set"), tests (add-only), `scripts/screenshot-gate.mjs` (add-only block ADAPT-4). **reserved_paths:** `docs/COACHING-PLAN.md` (the supervisor edits the line).
- **depends_on:** the supervisor's approval of the COACHING-PLAN §7 P2-C line change (§5 item 2), recorded before merge.
- **acceptance (tests):**
  - W1: `plannedDays` 2, two sessions a week, 4 hamstring sets a week for 3 weeks → `under` (fails on `main`: `in`).
  - W2: no schedule, `plannedDays` 2, 2 sessions this week → grade "strong" (fails on `main`: "Building momentum").
  - W3: 3 sessions in the week just ended, planned 3 → weekly review available on Monday (fails on `main`: needs 5 days in the current week).
  - W4 (failure path): 1 session in a 3-planned week → no review; volume not judged "under" for that week.
  - W5: a 10-day marked holiday → no "days since your last session" note on day 7 (fails on `main`).
  - W6: schedule Tue/Thu/Sat → green-readiness note on Tuesday (fails on `main`: Monday only).
  - W7: nothing set → today's behaviour (fallback 3).
  - G1 (gate probe): Profile shows "not set" for planned days when unset (fails on `main`: shows 3).
- **risk:** a user who sets 1 planned day gets "full weeks" too easily; floor 2.

### ADAPT-5 Volume that fits the lifter and one band everywhere (C-2 seed, A-10, C-4, E-1, E-2, E-3, E-4, F-2) — Version 1
- **outcome:** experienced lifters start at their level; every screen and the lighter-week trigger use the same band; coach notes read the goal's own numbers.
- **write_scope:** `src/brain/exposure.ts` (level seed only), `coach/weeklyReview.ts` (band), `coach/rules.ts` (plateau lever), `coach/post.ts` (effort mix, rest tip), `src/slices/workout/Train.tsx:1059` and `src/escobar/tools/read.ts:174` (pass the goal, one line each), `src/escobar/context/brief.ts` (goal not chosen), `src/app/selectors.ts` and `src/escobar/tools/context.ts` (pass the goal into `CoachContext`, one line each), tests (add-only). **reserved_paths:** `data/goals.ts` values, `deload.ts` (read only; A-10 is fixed through the level).
- **depends_on:** ADAPT-4 (full-week rule used by the shared band).
- **acceptance (tests):**
  - V1: `trainingSince` 36 months ago, no sessions → level ≥ Established for every muscle; the stock push/pull/legs ×2 passes `evaluatePlan` with **no `volume_far_over` block on any muscle** (fails on `main`: blocked on 8 muscles).
  - V2 (failure path): `trainingSince` unset → today's level.
  - V3: New user, 3 chest sets in one 3-session week → weekly review and Body agree (fails on `main`).
  - V4: last week missed, usual week 8 sets in band → plateau lever does not say "low volume" (fails on `main`: "about 0 hard sets").
  - V5: strength goal, 40 % max sets over 6 sessions on a stalled lift → failure-share lever fires (fails on `main`: 0.5 line).
  - V6: strength_muscle goal, median rest 100 s, reps 8→5 → rest tip fires in Train and in Escobar (fails on `main`).
  - V7: effort-mix tip does not fire on one session; fires when the previous session of the split repeats it.
  - V8: default goal never chosen → the brief says "goal: default, not chosen" (fails on `main`). This line is derived from data already stored (`profileHistory`); it adds no new kind of data sent to the AI provider.
  - V9: `trainingSince` 36 months ago, 9 chest sets for 2 weeks, one stalled main lift → no over-band lighter-week offer (fails on `main`: offered on band 4-8).
- **out of scope:** C-2's decay after long breaks (no study gives a half-life; later, with C-1).
- **risk:** higher bands for users who overstate training age; capped at Established, and the over-band note and plan block still apply.

### ADAPT-6 Timing from the user's own logs (D-1/F-6, C-7, C-6, F-4) — after Version 1
- **outcome:** rest timer per exercise from logged rest; plan length and recovery warnings from the user's own data and learned recovery speed.
- **write_scope:** `src/slices/workout/session.ts` (timer length), `src/brain/plan.ts`, `src/escobar/tools/plan.ts`, tests. **reserved_paths:** heart rest logic (BUG-21), `heart.ts`.
- **depends_on:** BUG-19 (PR #59) and BUG-21 (PR #64) merged.
- **acceptance (tests):** T1: 3 sessions of squats with ~180 s logged rest, setting 90 → timer 180 with "your usual" source (fails on `main`). T2 (failure path): fewer than 3 sessions → setting. T3: a main lift never below the goal floor. T4: 36-set strength plan with logged 75-min sessions → estimate within 15 % of 75 (fails on `main`: 117). T5: `tauScale` 1.5 on quads, 8 sets Mon and Wed → recovery warning (fails on `main`); `tauScale` 0.7 with 3+3 sets Mon/Tue → no warning (fails on `main`). T6: the dead `MIN_RECOVERY_HOURS` removed with no other change.
- **risk:** a user who pauses mid-rest teaches a long timer; BUG-19's pause removal and the 300 s cap.

### ADAPT-7 Personal noise, labels and recovery evidence (A-3, D-4, D-6, B-5, E-7, E-11) — after Version 1
- **outcome:** plateau and PR lines scale to each lifter's own noise; the learned effort bias changes actions (not e1RM); recovery learning and the drift trigger work for typical raters; snoozes back off; substitutes favour lifts the user knows.
- **write_scope:** `trend.ts`, `live.ts`, `effort.ts`, `recovery.ts` (calibration only), `coach/rules.ts` (snooze), `substitute.ts`, tests. **reserved_paths:** `e1rm.ts` (D11).
- **depends_on:** **BUG-24** merged (held sets out of `calibrateAfterSession` and `loggedLoads`), LT-3 (`live.ts`) and LT-5 (`substitute.ts`).
- **acceptance (tests):** N1: ±1 % scatter gaining 1 % in 8 weeks → not "plateaued" (fails on `main`). N2 (failure path): ±6 % scatter with a 1.5 % fitted change → not "progressing". N3: "ideal" bias +3 over 4 pairs → live "room to add load" fires on an ideal set; "max" never shifted. N4: ideal/ideal same-load pairs move `tauScale` within the clamp (fails on `main`: needs max/max); a held set never moves it. N5: reps falling at the same load over 3 sessions with 3 of 6 sessions rated → drift `harder` (fails on `main`: `unknown`). N6: same id snoozed twice → hidden 14 days (fails on `main`: 7); alerts unaffected. N7: a substitute logged 12 times ranks above an unlogged one with the same pattern (fails on `main`).
- **risk:** learned lines hide real stalls; bounded 1-4 %, plateau evidence bar unchanged.

**Not carded (fold into existing work):** D-2 (observed HR max in live rest) → gap for BUG-21 / PR #64; E-5 → LT-2; A-5 → LT-2; A-8 → LT-5; B-8 → ADAPT-7's snooze back-off; B-10 → improves with B-5, no change. **Later, research or owner first:** B-1 step 2 (personal bands), B-2, B-4, B-6, B-7, C-1 and C-2's decay (after ADAPT-5), D-3 (needs a real-watch check), D-5, A-6, A-7, E-10, E-12, F-3, F-5, F-7 (when carded, it must state that its brief lines are derived from stored data, like V8).

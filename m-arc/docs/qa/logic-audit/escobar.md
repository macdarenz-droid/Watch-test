# Logic audit · Escobar coach tools, context and the Worker (`escobar`)

Rules judged: 74 · verdicts: {"correct": 44, "questionable": 26, "wrong": 4}. Part of `qa/LOGIC-AUDIT.md` (QA-L1, 2026-09-27).

## Findings

### ESCOBAR-F1 · Body weight and heart data reach the model through coach-note text when sharing is off
- Severity **high** · status **confirmed** · where `src/brain/coach/rules.ts:356,484,510; src/brain/coach/weeklyReview.ts:344; src/escobar/context/brief.ts:101; src/escobar/tools/read.ts:303-311; src/escobar/loop.ts:119-160`
- What the code does: Insight titles and text carry gated numbers: 'Weight updated to X kg', 'Trend weight X kg, down Y% a week', 'hit N% of your session's hardest peak heart rate', 'rose about N bpm per set'. The brief's top_insights line and get_insights send them. loop.ts removes data only by key name, so the numbers inside text pass through.
- What is correct: With body or health sharing off, leave out or redact insights built from gated data (profile weight change, weekly weight trend, heart mismatch and drift) in the brief, get_insights and get_session notes. Spec §8.6: 'The brief also drops gated fields'; §20 data minimisation; §24.15 sharing defaults off.
- Evidence: researcher-privacy-probe.test.ts (body off): 'top_insights: profile-changed:weight:... "Weight updated to 91.3 kg"'. checker-probes.test.ts M1b (body off, after toRequestMessages redaction): 'Trend weight 90.1 kg, down 0.77% a week'. checker-probes.test.ts M1 (health off, after redaction): 'You rated a set Easy that hit 100% of your session's hardest peak heart rate'.
- User impact: A person who kept body and health sharing off still has their weight and heart data sent to the AI service.
- Source: PROBE, D-ESC §8.6/§20, CODE

### ESCOBAR-F2 · Minor flag misses 17-year-olds whose birthday is still to come this year
- Severity **high** · status **confirmed** · where `src/brain/recovery.ts:79-81; src/escobar/context/brief.ts:105,128`
- What the code does: Age = this year minus birth year. Someone born in (this year - 18) counts as 18 all year, so no 'minor: true' line is sent even while they are 17. The Worker policy's under-18 rule (no maximal-effort programming) only fires on that line.
- What is correct: With only a birth year, treat the person as possibly under 18 when this year - birthYear <= 18 (spec §19: under 18 -> minor: true).
- Evidence: checker-probes.test.ts R61/M2: birthYear 2008 in 2026 -> 'brief profile: ... age 18 | minor: (absent)'. escobar-worker/src/prompt/policy.ts:23: 'If the brief says minor: true, don't give maximal-effort programming'.
- User impact: Some 17-year-olds can get maximal-effort programming that the safety rules forbid for minors.
- Source: D-ESC §15/§19, CODE

### ESCOBAR-F3 · Day-bound proposals applied the next day land on the wrong day
- Severity **medium** · status **confirmed** · where `src/escobar/tools/actions.ts:94,97,302,391; src/escobar/apply.ts:115,125,142,248-251; src/slices/coach/coach.ts:52-55`
- What the code does: Every proposal expires at today+1 and is stale only when expiresOn < apply day. The today-override fingerprint has no day; the check-in fingerprint is null. On Apply, the override and check-in are saved to the apply day (todayKey()), and the lighter week starts on the apply day. Nothing else is re-checked.
- What is correct: Store the proposal's day for propose_today, propose_checkin and propose_deload, and mark them stale on any other day (§10.4: override valid only when day === today). Other kinds may keep today+1 (§10.1).
- Evidence: escobar-probes.test.ts: Tue override applied Wed -> todayOverride.day = TODAY+1; deload preview 'Ends' = TODAY+6 but saved endDay = TODAY+7. checker-probes.test.ts: 'check-in proposed 2026-09-22 saved on 2026-09-23'.
- User impact: Tapping Apply on yesterday's card can change today's session, save yesterday's sleep and soreness as today's, and end the lighter week a day later than the card said.
- Source: D-ESC §10.1/§10.4

### ESCOBAR-F4 · Assisted lifts: 'best', top set and e1RM use assistance kg
- Severity **medium** · status **confirmed** · where `src/escobar/tools/show.ts:70,87,143; src/escobar/tools/read.ts:147,203; src/brain/history.ts:32,47`
- What the code does: topKg and bestE1rm ignore the lift's mode. For assisted lifts, lift_trend 'best' is the most assistance (the weakest session), get_sessions topLifts and session_summary 'top' pick the most-assisted set, and get_exercise_history gives an e1rm computed from assistance kg.
- What is correct: For assisted lifts the best set is the least assistance (more reps break a tie), and e1rm is null for lifts that are not weighted (BR-06: less assistance is progress; e1RM rules skip non-weighted lifts).
- Evidence: escobar-probes.test.ts: assistance 40->30->20 kg gives lift_trend best = 40 and a falling e1rm. checker-probes.test.ts: get_sessions topLifts '[{"exercise":"Assisted Pull-Up","kg":40,...}]' when the session had 40 and 20; get_exercise_history e1rm 53.3.
- User impact: The coach can call the weakest assisted pull-up session the best one and quote a meaningless strength estimate.
- Source: D-DEC BR-06, CODE

### ESCOBAR-F5 · calculate e1rm adds 2 reps in reserve when effort is missing, and does not say so
- Severity **medium** · status **confirmed** · where `src/escobar/tools/calc.ts:39-49; src/brain/e1rm.ts:17; src/escobar/tools/schema.ts:73-74; src/data/knowledge.json (e1rm_formulas)`
- What the code does: No effort counts as 'ideal' (RIR 2). The result and formula text do not state the RIR used, and the e1rm_formulas card describes plain Epley. load_for_reps accepts up to 15 reps, while e1rm refuses more than 10.
- What is correct: With no effort, ask for it or use RIR 0 (plain Epley, validated on reps to failure at 10 or fewer), and return the RIR used. Give both ops the same 1-10 rep limit, or flag results above 10 reps as less reliable.
- Evidence: escobar-probes.test.ts: 100 kg x 5 with no effort -> 123.3; plain Epley -> 116.7 (+5.7%). load_for_reps {e1rm:100, reps:15} -> 66.7 accepted. The plan (COACHING-PLAN.md:216) sets RIR by label but gives no default for a missing label.
- User impact: A person who says they did 100 kg for 5 to failure is told their max is about 123 kg instead of about 117 kg, which could lead to too heavy an attempt.
- Source: LESUER, D-PLAN

### ESCOBAR-F6 · get_live_session times are wrong while the session is paused
- Severity **medium** · status **confirmed** · where `src/escobar/tools/read.ts:395,413`
- What the code does: elapsedMin subtracts only pausedMs, not the running pause. restSecLeft uses endsAt and ignores pausedRemainingSec, so it reads 0 while the app keeps the rest frozen.
- What is correct: Use the same formulas as the Train screen: elapsed subtracts (now - pausedAt) while paused (session.ts:123-125), and rest left = pausedRemainingSec while paused (session.ts:359).
- Evidence: live-pause-probe.test.ts: started 60 min ago, paused for the last 30: app elapsed 30 min, tool elapsedMin 60; app keeps 90 s of rest, tool restSecLeft 0.
- User impact: While paused, the coach reports a longer workout and 'rest is over' when the Train screen shows otherwise.
- Source: CODE

### ESCOBAR-F7 · Recovery 'at' times are echoed in UTC without a Z, and past times are accepted
- Severity **medium** · status **confirmed** · where `src/escobar/tools/read.ts:232-240; src/escobar/tools/show.ts:93-102`
- What the code does: 'at' is echoed as toISOString().slice(0,16): a UTC time with the Z removed, while the brief's 'now' line is local time. There is no lower bound on 'at', and recovery counts every session, including ones logged after 'at'.
- What is correct: Echo local time with its offset (or keep the Z). Refuse an 'at' before now, or count only sessions before 'at'.
- Evidence: TZ=Asia/Manila tz-probe.test.ts: input '2026-09-23T08:00:00' (local) -> at '2026-09-23T00:00'; recovery_map 'now' -> '2026-09-22T10:00' while local time is 18:00. recovery-past-probe.test.ts: at 2026-09-10 -> hamstrings 61%, 54 h left, lastDay 2026-09-19 (after 'at'); at 2001-01-01 is accepted.
- User impact: Outside UTC, the coach can quote 'ready by' clock times that are off by the time-zone offset (8 hours in Manila).
- Source: D-ESC

### ESCOBAR-F8 · Spending guards let requests through when they fail
- Severity **medium** · status **confirmed** · where `escobar-worker/src/quota.ts:47; escobar-worker/src/handler.ts:119,125,129,188`
- What the code does: If the quota Durable Object throws, checkQuota returns ok. If either rate-limit binding throws, the request is allowed. The quota check (before the call) and the count (after each step) are separate, so parallel requests all pass the check before any is counted. The KV-fallback weaknesses in the claim are real in code but not active: wrangler.toml:51-52 binds QUOTA_DO and the KV binding is commented out (lines 70-73).
- What is correct: Fail closed for new turns when the quota store errors (or fall back to KV). Keep the burst limits as the second line of defence, noting Cloudflare calls that binding permissive, per location and eventually consistent.
- Evidence: checker-worker.test.ts: checkQuota with a Durable Object whose check() throws -> 'quota check failed: Error: DO down' then '{"ok":true}'. Self-minted device ids are kept by decision (REMEDIATION-PROGRESS.md:249), so the IP and global caps are the real bounds.
- User impact: During a quota-store outage or a burst of parallel requests, use can run past the owner's daily caps on the paid AI key.
- Source: CF-RL, D-REM, CODE

### ESCOBAR-F9 · No daily budget for input tokens
- Severity **medium** · status **confirmed** · where `escobar-worker/src/quota.ts:10-18,66-70; escobar-worker/src/quotaDO.ts:8-41; escobar-worker/src/handler.ts:179-188`
- What the code does: Quotas count steps, turns and output tokens only. input_tokens and cache writes are logged (handler.ts:180) but never counted or capped.
- What is correct: Record input tokens (plus cache writes) per step in the quota Durable Object, with per-device and global daily caps.
- Evidence: checker-worker.test.ts: the Durable Object add() receives only '{"steps":1,"out":500,"turns":1}'. Rough estimate from the spec's own numbers (§11.4 history up to ~60k tokens; §21 $5 per million input tokens): the 20,000 global steps could send ~1.2 billion input tokens a day (~$6,000 uncached, ~$600 at cache-read price), against ~$75 for the 3M output-token cap. This is an estimate, not a measurement.
- User impact: Abuse or a runaway client could cost the owner far more than the output-token cap suggests.
- Source: D-ESC §11.4/§21, CODE

### ESCOBAR-F10 · Knowledge cards: protein_timing contradicts its source; some statement numbers can never be verified
- Severity **medium** · status **confirmed** · where `src/data/knowledge.json (protein_timing, bmi_limits, units_and_plates, steps_neat); src/escobar/tools/executor.ts:156; src/escobar/verify.ts:126-127`
- What the code does: protein_timing says 3-5 meals of about 0.4 g/kg reach the daily target, but 3 x 0.4 = 1.2 g/kg, below the protein_intake card's 1.6. Only a card's 'numbers' become citable facts, so numbers that appear only in the statement get flagged: bmi_limits 24.9; units_and_plates 25, 15, 1.25, 35; steps_neat 60 (missed by the earlier passes). units_and_plates cites IWF, but 1.25 kg is an IPF change plate.
- What is correct: protein_timing: at least 4 meals of about 0.4 g/kg (Schoenfeld & Aragon 2018). Put every number from each statement in 'numbers'. Cite IPF for 1.25 kg, or list the IWF discs.
- Evidence: escobar-probes.test.ts: missing statement numbers 'bmi_limits:24.9 steps_neat:60 units_and_plates:25 units_and_plates:15 units_and_plates:1.25 units_and_plates:35'; protein_timing per meal x meals low = 1.2.
- User impact: The coach can recommend 3 protein meals that fall short of the person's own 1.6 g/kg target, and correct numbers it cites get marked 'unverified'.
- Source: SA2018, IWF-IPF

### ESCOBAR-F11 · get_session flags normal sets as implausible after a light day, and flags assisted and bodyweight sets
- Severity **medium** · status **confirmed** · where `src/escobar/tools/read.ts:177-178; src/brain/fidelity.ts:93-96,144-153`
- What the code does: The 'recent best' passed to flagsForSet is only the previous session's top kg, for every lift mode, with isHeavyMainLift=false. Train uses the highest top kg of the last 3 sessions, and only for weighted lifts (Train.tsx:133-137,564). No app code writes stored set flags, so 'replacing saved flags' has no practical effect.
- What is correct: Use the same reference as Train (the maximum top kg over recent sessions), only for weighted lifts, and the lift's real role.
- Evidence: checker-probes.test.ts R9: bench 100 -> 60 (light day) -> 80 kg: 80 kg gets '["implausible_load"]'. Assisted pull-up 20 -> 40 kg of help: '["implausible_load"]'.
- User impact: The coach can tell a person that a normal set looks like a logging mistake.
- Source: CODE

### ESCOBAR-F12 · Heart zones in get_heart_session may not match the zones the session was bucketed with
- Severity **medium** · status **confirmed** · where `src/escobar/tools/read.ts:372-373,380-381; src/slices/workout/heart.ts:76-78; src/brain/heart.ts:20-31`
- What the code does: When the session finished, zone seconds were bucketed with hrMax(profile, observed max). The tool reports floors from hrMax(profile, null, now), so from Tanaka or an override, and it computes age at 'now', not on the session date.
- What is correct: Store the max and resting heart rate used for bucketing with the session, and report those.
- Evidence: checker-probes.test.ts: rest 60, Tanaka 183 -> floors [122,134,146,158,171]; observed 195 -> [128,141,155,168,182]. Under BR-12 an observed max is used whenever it is above Tanaka, so this happens for anyone whose watch recorded a higher plateau.
- User impact: The minutes shown per zone can belong to different bpm ranges than the ones the coach quotes.
- Source: TANAKA, D-DEC BR-12, CODE

### ESCOBAR-F13 · BMI for under-18s is given with adult cut-offs only
- Severity **medium** · status **confirmed** · where `src/escobar/tools/calc.ts:31-34; src/escobar/tools/read.ts:338; src/data/knowledge.json (bmi_limits); src/escobar/tools/actions.ts:224`
- What the code does: The app accepts birth years down to this year - 10. BMI (calculate bmi, get_body) has no age input or caveat, and the only BMI card gives adult bands (18.5-24.9, 25, 30). The Worker policy has no BMI rule for minors.
- What is correct: For ages 5-19, give no adult category: say the adult bands do not apply, or use BMI-for-age. Give the age with the BMI result.
- Evidence: Code trace (missing logic): no BMI category or age check anywhere in src/escobar or the Worker policy (grep 'bmi' in escobar-worker/src/prompt returns nothing). WHO and CDC use age- and sex-specific percentiles before 19.
- User impact: A teenager could be called 'overweight' by adult standards, a risk next to the disordered-eating safety rules.
- Source: WHO-BMI-AGE, CDC-TEEN

### ESCOBAR-F14 · lift_trend e1RM chart mixes in top kg for sets over 10 reps
- Severity **medium** · status **confirmed** · where `src/escobar/tools/show.ts:70`
- What the code does: The e1rm metric uses bestE1rm, or topKg when there is no e1RM (every set over 10 reps). One series mixes two measures, so moving from 10 to 11-12 reps (inside the Lean-muscle 6-12 range) draws a big false drop.
- What is correct: Leave out the point, or use a separate series, when there is no e1RM.
- Evidence: checker-probes.test.ts R56: 100 kg x 5 then 100 kg x 12 (a stronger performance) -> points [123.3, 100].
- User impact: The default strength chart can show a drop when the person actually got stronger.
- Source: CODE

### ESCOBAR-F15 · Today's readiness can show two different scores in one answer
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:258-259,267; src/escobar/tools/show.ts:115-124; src/brain/coach/rules.ts:604`
- What the code does: Today's value is computed at the real time (readinessToday), but history[0] and readiness_history's today point are computed at 23:59:59. The check-in window is the same for both (readiness.ts:118), so only the time differs.
- What is correct: The history value for today equals readinessToday.
- Evidence: readiness-probe.test.ts, two-week fixture at 08:00: today 72, history[0] 73, gauge 72, readiness_history today 73. Six-month fixture: all 63.
- User impact: The coach can quote 72 and 73 for the same day, which looks careless.
- Source: CODE

### ESCOBAR-F16 · propose_program accepts guessed exercise names and more than 6 sets
- Severity **low** · status **confirmed** · where `src/escobar/tools/actions.ts:74-75; src/brain/plan.ts:60-64`
- What the code does: planDraftArg resolves exercises with fuzzy findExercise and rounds sets with no upper limit. evaluatePlan only warns above 6 sets. propose_split refuses both (actions.ts:41,51).
- What is correct: Exact ids only, and whole-number sets 1-6, as in propose_split (ST-13: Escobar's writes use exact ids; schema: sets 1-6).
- Evidence: escobar-probes.test.ts: 'Hack' -> lib_hack_squat; 9 sets on bench accepted. The card shows the resolved name and set count (actions.ts:156), which limits the harm.
- User impact: A programme can be saved with an exercise the model guessed or an unusually high set count, though the card shows both.
- Source: D-DEC ST-13, D-ESC

### ESCOBAR-F17 · propose_today: the scheduled-split check never runs, and adding an exercise already in the split is ignored
- Severity **low** · status **confirmed** · where `src/escobar/tools/actions.ts:184,193; src/escobar/tools/schema.ts:161; src/slices/workout/session.ts:94`
- What the code does: The 'not today's split' check needs input.explicit === false, but 'explicit' is not in the tool schema, so any split is accepted. 'add' accepts an exercise already in the split; the card says 'add 3 sets', but Train skips the add.
- What is correct: Add an 'explicit' flag and require the scheduled split unless it is set (§10.2). Refuse an add of an exercise already in the split.
- Evidence: escobar-probes.test.ts: Legs accepted on a Pull day. checker-probes.test.ts R38: preview 'add 3 sets' for Lat Pulldown, but the planned list still has Lat Pulldown once, with 3 sets.
- User impact: A card can promise an extra exercise that never appears in the session.
- Source: D-ESC §10.2

### ESCOBAR-F18 · Loose checks: soreness with no level, impossible trainingSince, unknown insight ids
- Severity **low** · status **confirmed** · where `src/escobar/tools/actions.ts:226,312-326; src/escobar/tools/executor.ts:192-197`
- What the code does: A soreness item with no level passes, previews 'undefined of 5', and saves nothing useful. trainingSince accepts '2026-13' and '2031-01'. snooze_insight accepts any id, answers applied: true, and saves a feedback record.
- What is correct: Soreness level must be a whole number 1-5. trainingSince must be a real month, no later than now. Refuse insight ids that get_insights does not produce.
- Evidence: escobar-probes.test.ts and checker-probes.test.ts: preview 'undefined of 5'; trainingAgeMonths('2026-13') = 0 and ('2031-01') = 0, so the person is treated as a novice (recovery.ts:73-76); snooze of 'no_such_insight' -> applied: true.
- User impact: A typo can quietly reset training age to zero, and the card can confirm a soreness rating that was never saved.
- Source: D-ESC §10.2

### ESCOBAR-F19 · get_body: kg per week is approximate, and 'weeks' does not set the trend or body-fat window
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:336-344; src/brain/coach/weeklyReview.ts:112-131`
- What the code does: kgPerWeek = trendKg x rounded %/100, where % is relative to the mean, not trendKg. The trend always uses the 28 days before the last weigh-in. bodyFat is the last 6 readings, however old.
- What is correct: kgPerWeek = slope x 7. Describe the trend as the last 28 days of weigh-ins. Limit bodyFat to the window.
- Evidence: escobar-probes.test.ts: kgPerWeek -0.69 vs fitted slope -0.70. checker-probes.test.ts: weeks=4 returns bodyFat '[{"day":"2025-09-22","pct":25}]'.
- User impact: Small rate errors, and a year-old body-fat reading can be presented as recent.
- Source: D-DEC BR-14, CODE

### ESCOBAR-F20 · Per-set heart rows have the wrong set number
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:383`
- What the code does: set = i + 1 counts only the sets that have heart data, warm-ups included.
- What is correct: Use the set's position in the exercise (label warm-ups).
- Evidence: escobar-probes.test.ts: heart data only on the third set -> perSet[0].set = 1.
- User impact: The coach can point the person to the wrong set.
- Source: CODE

### ESCOBAR-F21 · volume_bars ignores its weeks parameter
- Severity **low** · status **confirmed** · where `src/escobar/tools/show.ts:111; src/escobar/tools/schema.ts:55`
- What the code does: intIn(params.weeks) is checked and its result thrown away. The chart always shows this week.
- What is correct: Use weeks, or remove it from the schema.
- Evidence: checker-probes.test.ts: weeks 1 and weeks 8 return identical output.
- User impact: A request for several weeks of volume silently shows only this week.
- Source: CODE

### ESCOBAR-F22 · A changes-only brief never reports a line that disappeared
- Severity **low** · status **confirmed** · where `src/escobar/context/brief.ts:139`
- What the code does: Only lines that exist this turn are sent. If 'minor: true' stops applying, it just vanishes, and the model keeps the old value until the next full brief (up to 4 turns). This errs on the cautious side for 'minor'.
- What is correct: On a changes-only turn, send removed lines as 'key: none'.
- Evidence: escobar-probes.test.ts: previous lines had minor 'true'; the next changes-only brief (full=false) has no 'minor' text.
- User impact: For a few messages the coach may still treat the person as a minor after that stopped applying.
- Source: D-ESC §11.2

### ESCOBAR-F23 · Memory in the brief: text cut at 140 of 200 characters, and injuries can be pushed out
- Severity **low** · status **confirmed** · where `src/escobar/context/brief.ts:52-58,64,124; src/core/models.ts:457-458`
- What the code does: one() cuts every memory item to 140 characters with no '…', though items may be 200. Injury, equipment and agreement items are sorted together newest first and capped at 12, so with more than 12 (memory holds up to 60), older injuries drop out.
- What is correct: Allow 200 characters (or mark the cut). Put every live injury first, then equipment, then the rest (§11.2: injuries and equipment always included).
- Evidence: checker-probes.test.ts: a 177-character injury note loses its ending 'but fine with light weight'; 1 old injury + 12 newer equipment items -> brief keeps 12 equipment, 0 injuries.
- User impact: The coach can miss the end of an injury note, or the injury itself.
- Source: D-ESC §11.2/§17

### ESCOBAR-F24 · explain_method misdescribes what happens to unrated sets
- Severity **low** · status **confirmed** · where `src/escobar/knowledge/methods.ts:80; src/brain/progression.ts:249-251`
- What the code does: The summary says missing effort ratings only lower confidence. The code holds the load (confirm_effort) when fewer than half of recent sets are rated and there are 2+ sessions.
- What is correct: Say that the load is held until recent sets are rated.
- Evidence: Code trace: progression.ts:249 'if (coverage < 0.5 && hist.length >= 2) return { mode: 'confirm_effort', ... Keep the load'. get_next_target's own reason states the real rule, which limits the harm.
- User impact: The coach's 'how it works' answer can contradict why the load did not go up.
- Source: CODE

### ESCOBAR-F25 · get_next_target assumes 3 sets for a lift with no history
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:215; src/brain/progression.ts:162`
- What the code does: plannedSets defaults to 3. It matters only when the lift has no history, because setCount = last session's sets || plannedSets. Train passes the split's sets (Train.tsx:270,901). The claim that red-readiness and deload set plans differ for logged lifts is refuted.
- What is correct: Default to the split entry's sets (or today's override), else the exercise's defaultSets.
- Evidence: checker-probes.test.ts R11: logged lift: tool 3 sets, Train 3; first-time lift in a 5-set entry: tool 3, Train 5.
- User impact: For a new exercise, the coach can quote a different set count from the Train screen.
- Source: CODE

### ESCOBAR-F26 · plate_breakdown formula text says 'greedy'; the code picks the fewest plates
- Severity **low** · status **confirmed** · where `src/escobar/tools/calc.ts:72; src/brain/units.ts:141-171`
- What the code does: The tool tells the model 'greedy per side from the heaviest plate', but plateBreakdown is a fewest-plates search for the largest per-side load at or under the target (BR-24).
- What is correct: Formula text: 'fewest plates per side for the largest load at or under (total - bar) / 2'.
- Evidence: checker-probes.test.ts: plates 25/20/15, 90 kg -> '20 + 15 kg' (greedy would give 25 + nothing), with formula 'greedy per side from the heaviest plate'.
- User impact: The coach may explain plate loading wrongly, though the plates it lists are right.
- Source: D-DEC BR-24

### ESCOBAR-F27 · Impossible dates like 2026-02-31 pass the date checks
- Severity **low** · status **confirmed** · where `src/escobar/tools/read.ts:97-101; src/escobar/tools/calc.ts:20-24; src/escobar/tools/show.ts:44-49`
- What the code does: Only the YYYY-MM-DD shape is checked. Date maths rolls impossible dates over.
- What is correct: Reject dates that do not exist on the calendar, with the same error.
- Evidence: checker-probes.test.ts: days_between 2026-02-28 -> 2026-02-31 = 3. get_readiness day 2026-09-31 -> 'day cannot be in the future' (a misleading error).
- User impact: A mistyped date gives a silently wrong answer.
- Source: D-ESC

### ESCOBAR-F28 · Changing a split without 'focus' clears its focus
- Severity **low** · status **confirmed** · where `src/escobar/tools/actions.ts:121,142; src/escobar/apply.ts:76`
- What the code does: focus defaults to [] on modify, so a change to exercises alone also removes the focus. The card does show a 'Focus: X -> none' row.
- What is correct: On modify, a missing focus keeps the current one; an explicit [] clears it.
- Evidence: checker-probes.test.ts R34: preview '[... {"label":"Focus","before":"Lats","after":"none"}]', input.focus [].
- User impact: A person approving a set change can lose their split's focus muscles without meaning to.
- Source: D-ESC

### ESCOBAR-F29 · An equipment-profile proposal can be applied to a gym deleted after it was made
- Severity **low** · status **confirmed** · where `src/escobar/tools/actions.ts:102; src/slices/workout/units.ts:90-97`
- What the code does: The fingerprint covers only the profile tables. Deleting a gym with no profiles leaves them unchanged, so Apply writes a profile for a gym that no longer exists.
- What is correct: Include the gym ids in the fingerprint, or re-check that the gym exists at Apply.
- Evidence: checker-probes.test.ts R33: after deleteGym('gym_b'), Apply -> 'applied', gyms 'gym_default', byEquipment keys 'gym_b'.
- User impact: Invisible leftover data; no wrong numbers.
- Source: D-ESC §10.1

### ESCOBAR-F30 · IP bucketing: a home /56 spans 256 buckets, and IPv4-mapped addresses share one
- Severity **low** · status **confirmed** · where `escobar-worker/src/handler.ts:63-70`
- What the code does: IPv6 is grouped by /64, while home users usually get a /56, so one subscriber can spread over 256 IP buckets. Every '::ffff:a.b.c.d' address maps to '0:0:0:0::/64'. It is not verified that Cloudflare ever sends that form: CF-Connecting-IP carries the real client address, and Pseudo IPv4 is off by default. Shared-NAT effects on the 300-turn IP cap were not measured.
- What is correct: Key the daily IP counters by /56 (keep /64 for the burst limit if wanted), and map IPv4-mapped addresses to their IPv4 address.
- Evidence: checker-worker.test.ts (function loaded from the Worker source): '::ffff:1.2.3.4' and '::ffff:5.6.7.8' -> '0:0:0:0::/64'; 2001:db8:aa:1::1 and 2001:db8:aa:2::1 (same /56) -> two buckets. The global caps still bound the total.
- User impact: A determined abuser with a /56 can get 256 times the per-IP allowance; normal users are not affected.
- Source: RIPE690, CF-PSEUDO, D-REM

### ESCOBAR-F31 · The Worker's read-tool list is copied by hand with no sync test
- Severity **low** · status **confirmed** · where `escobar-worker/src/anthropic.ts:56-57`
- What the code does: The list matches READ_TOOL_NAMES today, but no committed test compares them. escobar-worker/test/anthropic.test.ts:37-38 only checks that no propose_ tool is in it.
- What is correct: A committed test comparing it with src/escobar/tools/schema.ts READ_TOOL_NAMES (§8 generated-data sync).
- Evidence: escobar-probes.test.ts 'matches the app list' passes on 5f282d7.
- User impact: A future read tool could silently be missing from the daily brief mode.
- Source: D-ESC §8

## Not covered

- docs/ESCOBAR-ARCHITECTURE.md: only sections 8-17 (lines 301-700) were read. Sections 0-7 and 18-25 (moments, safety, privacy, cost, Plate Sense) were not.
- escobar-worker/src/tools.generated.json: only the tool count (45) and strict flags were checked. Drift against schema.ts relies on the existing tests/escobar/tools-sync.test.ts, which was not re-run.
- src/escobar/palace/registry.ts (find_in_app scoring and palace ids) was not read.
- src/escobar/loop.ts and src/escobar/verify.ts were read only where the tools call them (fact ledger threading, k: grounding). The repair round and number matching were not audited.
- Brain functions the tools call (recoveryStatus, readiness, suggestNext, muscleVolumeStatus, weekSummary, plateBreakdown, resolveProfile/loadableNear, coachInsights, weeklyReviewInsights, postSessionInsights, autoregulationSuggestion) were not audited; they belong to other areas.
- Worker tests (escobar-worker/test/*) were not run: escobar-worker has no node_modules in this checkout. The ipBucket check used a verbatim copy of the function.
- Knowledge-card numbers were checked against the cited sources from memory; the sources were not fetched online.

## Sources

- **D-ESC** docs/ESCOBAR-ARCHITECTURE.md (owner-approved spec): §8 tools, §10 proposals (10.1 lifecycle, 10.2 validation, 10.4 today override), §11.2 brief, §12 Worker, §14 grounding, §17 memory, §19 safety, §20 privacy, §21 cost, §24 decisions — /home/user/marc-main/docs/ESCOBAR-ARCHITECTURE.md
- **D-DEC** docs/COACHING-DECISIONS.md: EV2/EV3 decisions (lines 341-367) and Remediation R3 (lines 403-424: BR-03, BR-06 assisted lifts, BR-12 HRmax, BR-14 weight trend, BR-24 min-plate DP, ST-13 exact ids for writes) — /home/user/marc-main/docs/COACHING-DECISIONS.md
- **D-REM** docs/REMEDIATION-PLAN.md R0.1-R0.9 (quota DO, KV fallback 'soft', RATE_IP, relay) and REMEDIATION-PROGRESS.md QA-R0 lines 241-249, 532-533 (IPv6 /64, 8 relay shards, no-Origin kept by decision) — /home/user/marc-main/docs/REMEDIATION-PLAN.md; /home/user/marc-main/docs/REMEDIATION-PROGRESS.md
- **D-PLAN** docs/COACHING-PLAN.md line 216: e1RM includes RIR from the effort label (easy +3, ideal +2, max +0); no rule for unrated sets — /home/user/marc-main/docs/COACHING-PLAN.md:216
- **LESUER** LeSuer et al. 1997, J Strength Cond Res 11(4): accuracy of 7 1-RM prediction equations from repetitions to fatigue (<=10 reps) — https://journals.lww.com/nsca-jscr/abstract/1997/11000/the_accuracy_of_prediction_equations_for.1.aspx
- **TANAKA** Tanaka, Monahan, Seals 2001, JACC 37(1):153-156: HRmax = 208 - 0.7 x age — https://www.jacc.org/doi/abs/10.1016/s0735-1097(00)01054-8
- **SA2018** Schoenfeld & Aragon 2018, JISSN: 0.4 g/kg/meal across a minimum of four meals to reach at least 1.6 g/kg/day — https://pubmed.ncbi.nlm.nih.gov/29497353/
- **WHO-BMI-AGE** WHO Growth reference 5-19 years, BMI-for-age (adult cut-offs 25/30 are reached only at 19 years) — https://www.who.int/tools/growth-reference-data-for-5to19-years/indicators/bmi-for-age
- **CDC-TEEN** CDC Child and Teen BMI categories (age- and sex-specific percentiles, not adult cut-offs) — https://www.cdc.gov/bmi/child-teen-calculator/bmi-categories.html
- **CF-RL** Cloudflare Workers Rate Limiting binding docs: a unique limit per Cloudflare location; 'permissive, eventually consistent, and intentionally designed to not be used as an accurate accounting system' — https://developers.cloudflare.com/workers/runtime-apis/bindings/rate-limit/
- **CF-PSEUDO** Cloudflare Pseudo IPv4 docs: default Off; CF-Connecting-IP carries the real client address; Overwrite mode puts a Class E IPv4 hashed from the IPv6 address — https://developers.cloudflare.com/network/pseudo-ipv4/
- **CF-DO-LOC** Cloudflare Durable Objects data location: location hints are best effort and only used when the object is first created — https://developers.cloudflare.com/durable-objects/reference/data-location/
- **RIPE690** RIPE-690 BCOP: IPv6 end-user prefixes longer than /56 strongly discouraged; /56 residential, /48 business — https://www.ripe.net/publications/docs/ripe-690/
- **POUND** International yard and pound agreement (1959): 1 lb = exactly 0.45359237 kg — https://en.wikipedia.org/wiki/International_yard_and_pound
- **BELL2024** Bell et al. 2024, Sports Med Open: deloads last 6.4 +/- 1.7 days every 5.6 +/- 2.3 weeks; volume and load both reduced — https://sportsmedicine-open.springeropen.com/articles/10.1186/s40798-024-00691-y
- **IWF-IPF** IWF Technical and Competition Rules 2020 (change discs 2.5, 2, 1.5, 1, 0.5 kg) vs IPF Technical Rules (1.25 kg change plates) — https://iwf.sport/wp-content/uploads/downloads/2020/01/IWF_TCRR_2020.pdf; https://www.powerlifting.sport/fileadmin/ipf/data/rules/technical-rules/english/IPF_Technical_Rules_Book_2021docx.pdf
- **PROBE** Researcher probe (throwaway, passes on 5f282d7): with body sharing off, 'Weight updated to 91.3 kg' reaches the brief's top_insights line and the redacted get_insights result — /home/user/marc-main/tests/qa-scratch/escobar/researcher-privacy-probe.test.ts
- **CODE** Code read on main 5f282d7 (researcher's own checks): brain/units.ts:147-171 plateBreakdown is a min-plate DP; brain/readiness.ts:118 keeps check-ins 1-30 days before 'today'; brain/history.ts:29-45 bestE1rm is mode-agnostic; brain/recovery.ts:79-81 age = year difference; brain/coach/rules.ts:332-360 and 472-510 insight prose carries weight and bpm; escobar/loop.ts:119-160 scrubs by key name only; escobar-worker/src/quota.ts:47 DO error returns ok; slices/workout/heart.ts:76-77 zones use the observed max — /home/user/marc-main (paths as listed)
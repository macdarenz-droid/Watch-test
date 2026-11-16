# Idea LD (idea 66): after a lively pre-entry hour, enter LATER - looked first, then PRE-REGISTRATION (pushed before any code or run)
Sim clock Tue 2015-05-26 01:00 London. END 2015-05-26.
## Where it comes from
- The biggest split I have ever measured in A2 (ET's print, 96 days): after a QUIET hour before entry (07:00-08:00 range under 30 pips) A2 made +30.20R
  on 53 days; after a LIVELY one +6.51R on 43 days. PH2 holds that on paper as "half size". ET showed entering EARLIER on lively days is worse.
  What nobody has asked: on lively days, is the first hour after 08:00 a shake-out that a LATER entry steps over?
- Known against it: a single entry at 08:30 / 09:00 on ALL days keeps only 81% / 61% of A2's net (SI). Delay is expensive in general. The idea needs
  delay to be cheap, or a gain, exactly on lively days and not on quiet ones.
## Looked first (my own trade tables; no new count except three hand sums, shown)
- Stop times of my 14 funded full stops: 08:16, 08:18 | 09:04, 09:06, 09:08, 09:19, 09:30, 09:40, 09:51 | 10:0x, 10:33, 10:40 | 11:10, 11:15. Two before
  09:00, seven between 09:00 and 10:00. A 09:00 entry does not dodge a stop by its clock time; it changes the stop LEVEL (40 pips from the 09:00 price).
- Three recent lively-hour stops worked by hand from my walk prints (these three days are therefore contaminated and are dropped):
  05-18 buy: 09:00 price 1.13904, new stop about 1.1350, morning low 1.13666 -> survives; noon 1.14172 -> about +0.6R instead of -1.03R.
  05-20 sell: 09:00 price 1.10999, new stop about 1.1140, morning high 1.11279 -> survives; noon 1.10923 -> about +0.2R instead of -1.00R.
  05-15 buy: 09:00 price 1.13852, new stop about 1.1345, later low 1.13457 by my H1 print... not certain it survives; noon 1.13583 -> about -0.7R or -1R.
  Three days, picked because they hurt. They say "maybe"; they are exactly the kind of evidence SA taught me to distrust.
## Hypothesis
On days with a lively pre-entry hour (07:00-08:00 range >= 30 pips, known at 08:00), entering later than 08:00 earns more than entering at 08:00,
because the first hour is a shake-out there; on quiet days it does not.
## Variants (3; quiet days = A2 unchanged; lively days = the same signal, a market order at the later time, 40 pip stop from the bid then, out 12:00)
- LD1: lively -> enter 08:15. LD2: lively -> enter 08:30. LD3: lively -> enter 09:00.
## Data and contamination
All A2 days before 2015-05-26 without 05-15, 05-18, 05-20 (worked by hand above). Known: SI's all-day figures; my live record of the last two weeks,
which is where the idea was born - so the from-03-02 half is not clean, and I say so. The before-03-02 half had few lively days (17% of days).
## Kill lines (variant against A2 on the decision set; one failure kills)
- K1: net R at least 2.0R above A2.
- K2: not behind A2 in either half (before 03-02; from 03-02).
- K3: max drawdown at most 0.5R above A2's; worst 10 in a row at most 0.5R worse.
- K4: still ahead of A2 without its 3 best difference-days.
- K5 the mechanism: on lively days the late entry must have FEWER full stops than the 08:00 entry and a higher average R; AND the same delay applied to
  QUIET days (control, computed beside) must do worse than it does on lively days. If delay helps quiet days as much, the story is wrong.
- Sample: lively days must number at least 30 in the decision set (they should: 43 of 96 on 05-19).
Hand-check before totals: 05-18 at 09:00 against my hand sum above (about +0.6R), and the 08:00 part must reproduce engine A2.
A survivor gets a forward paper tag only (it would sit beside PH2, not replace it).
My guess (I cannot guess these; kept to show it): LD1 about level, LD2 about 1R behind, LD3 about 2R behind; killed on K1.

## Mechanics hand-check (`python bt/late_lively.py 2015-05-26 2015-05-15,2015-05-18,2015-05-20 --check 2015-05-18`)
The 08:00 part reproduces engine A2 on every day (0.000R). 05-18 at 09:00: entry 1.13915, stop 1.13504, out 12:00 @1.14173 = +0.64R; my hand sum said
"new stop about 1.1350, about +0.6R". At 08:30: +0.52R. At 08:15: stopped 09:05, -1.03R.

## Results (run once; `python bt/late_lively.py 2015-05-26 2015-05-15,2015-05-18,2015-05-20`; figures copied from the print)
DECISION SET: 97 days. A2 +37.45R (before 03-02 +19.56R, from 03-02 +17.89R), max DD 3.28R, worst 10 in a row -1.70R.
Lively days 42 (6 before 03-02, 36 from 03-02): A2 +0.180R each, 12 full stops. Quiet days 55: A2 +0.543R each, 6 full stops.
| variant | net R (vs A2) | before 03-02 | from 03-02 | max DD | worst 10 | lively days: late vs 08:00 (avg R) | full stops late vs 08:00 | better / worse | CONTROL quiet days: late vs 08:00 |
|---|---|---|---|---|---|---|---|---|---|
| LD1 08:15 | +29.88 (-7.57) | -0.26 | -7.31 | 6.01R | -3.99 | -0.000 vs +0.180 | 14 vs 12 | 11 / 19 | +0.471 vs +0.543 (-0.072 a day) |
| LD2 08:30 | +31.75 (-5.70) | +0.17 | -5.87 | 5.53R | -4.48 | +0.045 vs +0.180 | 13 vs 12 | 14 / 20 | +0.444 vs +0.543 (-0.099 a day) |
| LD3 09:00 | +32.67 (-4.78) | +0.87 | -5.66 | 4.20R | -2.71 | +0.066 vs +0.180 | 12 vs 12 | 15 / 17 | +0.320 vs +0.543 (-0.224 a day) |
Kill lines: K1, K2, K3, K4, K5 FAIL for all three (sample line passes: 42 lively days). VERDICT: all KILLED. No tag.
Reported only, all 100 days (the three hand-worked days back in): LD1 -7.57R, LD2 -4.15R, LD3 -1.62R against A2. Even with the days that
inspired it, the best version loses.

## My guess against what happened
"LD1 about level, LD2 about 1R behind, LD3 about 2R behind": 7.57R, 5.70R and 4.78R behind. The order was even the wrong way round.

## What I learned
- A later entry on lively days does not step over a shake-out. It has as many or MORE full stops (14 / 13 / 12 against 12) and a lower average. The three
  mornings I worked by hand were three of the 15 it helps; it hurts 17 to 20 others. SA's lesson again: the days that hurt are the days I count.
- One part of the story did hold, and I write it because it is true and small: at 09:00 the delay costs half as much per day on lively days (-0.114R) as on
  quiet ones (-0.224R). Lively mornings do give some of the first hour back. Not enough to pay for the wait.
- THE IMPORTANT SIDE FINDING, which I had not seen this clearly: of the 42 lively days, 6 are before 03-02 and 36 after. "Lively against quiet" is
  very nearly "March-May against January-February". So the big split I quoted at the top (+0.54R quiet, +0.18R lively) cannot tell me whether a lively
  hour before entry hurts A2, or whether A2 has simply earned less since March and those months happen to be the lively ones. PH's own test had a line
  for this; I re-read it tomorrow before the call. For PH2 on paper it means: its first look must compare lively and quiet days INSIDE the same months,
  or it will only re-discover the calendar. I add that sentence to PH2's rules file now, as a reading rule; it changes no threshold.
- Entry time, both directions, all days and lively days only: closed. 08:00 stays.
Counts: ideas 66, variants 185 (LD1 LD2 LD3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.

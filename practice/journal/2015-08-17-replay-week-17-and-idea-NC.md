# Replay of my worst losing week (week 17, Mon 04-20 .. Fri 04-24) + idea NC (idea 138; coach 08-17)
Written Mon 2015-08-17 evening (clock Mon 08-17 22:00 London; no new data), before any count or outcome.

## Why week 17
By R it is my worst week, live and on A2's engine list: 5 live trades at 0.31 lots, -3.07R, -$394.94 (W26 -2.43R, W24 -2.29R). Week 24
was replayed on 06-18; week 17 never.

## Bar by bar (M15 charts, previous day 12:00 -> trade day 20:00; trade list; London time)
| day | A2 | the hour before the bell (07:00-08:00) | what happened | R | tag |
|---|---|---|---|---|---|
| Mon 04-20 | buy | jumped about 30 pips UP (with A2) | bought near the top; fell; stopped 09:40 | -1.00 | VALID |
| Tue 04-21 | buy | fell about 60 pips DOWN through yesterday's low (against A2) | bought near the bottom; flat to noon, rose after | -0.04 | VALID |
| Wed 04-22 | sell | rose about 35 pips UP (against A2) | sold; rose 40 more to 10:30; back to entry by noon | -0.02 | VALID |
| Thu 04-23 | sell | fell about 30 pips DOWN to a new low (with A2) | sold near the bottom; V-turn; stopped 09:51 | -1.00 | VALID |
| Fri 04-24 | buy | jumped about 70 pips UP (with A2) | bought near the top; drifted down; stopped 11:10 | -1.00 | VALID |
All five VALID (call before the bell, 08:00 market, stop never moved, noon or stop). 0 trade mistakes. (Process mistake P5 of 04-24 was
about paper tags, not these trades.)

## What a better trader would have done
On Mon, Thu and Fri he would have seen that the move A2 wanted had already happened in the hour before the bell, and not paid the top
(bottom) of it. On Tue and Wed, where A2 bought (sold) INTO the hour's move, he would have done what A2 did, and lost nothing.
CLEAREST LESSON: the three full stops are the three mornings where A2 entered at the end of a pre-bell run in its own direction.

## What I already know that touches it (stated before the test)
- H (January): "no chase" by where the price sat in yesterday's range: killed ("helps in a box, hurts in a trend").
- NM/NA: the whole night (00:00-08:00) against A2: killed twice. Different window and different sign.
- LM (05-07), a description written AFTER that test, never a rule: on 35 lively mornings to 05-06, A2 made +0.338R where it faded the
  hour and +0.005R where it chased it. That is the same idea seen on part of the same days: CONTAMINATION, declared.
- PH2: half size after any lively hour (range), on paper with its own gate. NC uses the hour's NET direction relative to A2, not its range.

## Idea NC: no chase of the pre-bell hour (an A2 filter; it changes only which days A2 trades)
Hour move = open of the 08:00 candle minus open of the 07:00 candle, signed by A2's side (positive = the hour ran A2's way).
Rule: skip A2's trade when the hour moved at least X pips A2's way. Everything else is A2.
ORDER OF WORK: step 1 counts only for X = 10, 15, 20 (skipped days, before / from 04-07). Step 2: X = the LARGEST grid value that skips
at least 15% of A2's days and at least 25 days in all. Step 3 one run on the engine's A2 list (history before 2015-08-18).
THE THREE VARIANTS (named now): NC1 (judged) skip at the chosen X; NC2 (dose) skip at the next larger X (or 25 if the chosen is 20);
NC0 (control) skip when the hour moved X or more AGAINST A2 (if any big pre-bell hour hurts, NC0 does as well as NC1 and the "chase"
story is wrong).
Power, stated up front (once-a-day): about 160 A2 days; a skipped group of 25-50 days has an error of about +-0.3R to +-0.4R on its average.
ANY PASS IS PROVISIONAL (plan section 9): it could only become a paper tag on A2 for a forward count, never a live rule now.
## Kill lines (four, all must pass, for NC1)
K1 the skipped days' average under A2 is below zero AND at least 0.30R below the kept days' average.
K2 the same sign (skipped below kept) before 04-07 AND from 04-07.
K3 NC1's skipped-minus-kept gap larger than NC0's (chasing is the problem, not any big hour).
K4 label shuffle (10,000) of NC1's gap: p < 0.10.
My guess: K1 passes (the week told me so), K2 fails: chasing paid in the trend months (H's "hurts in a trend").

## Step 1, counts only (tool `python bt/no_chase_hour.py 2015-08-18 count`; no outcomes)
160 A2 days (01-06..08-17). Skipped days (hour ran A2's way): X 10: 41 = 26% (14 before 04-07, 27 from); X 15: 33 = 21% (11 / 22);
X 20: 24 = 15% (7 / 17); X 25: 16 = 10%. Control skips (ran against): 53 / 37 / 24 / 14.
## Step 2, by the line written first: largest X skipping 15%+ AND 25+ days = **X = 15** (X = 20 has 24 days). NC1 = 15, NC2 = 20, NC0 = against at 15.
My eye against the tool on week 17 (net 07:00 -> 08:00 open, signed by A2): Mon +13.5 (I wrote "jumped about 30": that was the hour's
range, not its net), Tue -36.9, Wed -29.0, Thu +21.6, Fri +60.6. So at X = 15, NC1 would have skipped Thu and Fri, not Mon. Written before
the run so I cannot pretend the rule saw all three.
Note on the before-04-07 part: only 11 skipped days there; K2's first half rests on 11 trades.

## Step 3, result (one run: `test 15 20`)
Tool: `python bt/no_chase_hour.py 2015-08-18 test 15 20` (A2 engine list, 160 days before 08-18).
| variant | skipped: n, avg, net | kept: n, avg, net | gap (kept - skipped) | before 04-07 (skipped n) | from 04-07 (skipped n) |
|---|---|---|---|---|---|
| NC1 skip when the hour ran A2's way >= 15 (JUDGED) | 33, -0.068, -2.25 | 127, +0.238, +30.17 | +0.306 | +0.245 (11) | +0.265 (22) |
| NC2 the same at >= 20 | 24, -0.030, -0.71 | 136, +0.211, +28.63 | +0.240 | +0.433 (7) | +0.052 (17) |
| NC0 skip when the hour ran AGAINST A2 >= 15 (control) | 37, +0.177, +6.56 | 123, +0.174, +21.36 | -0.004 | +0.059 (12) | -0.125 (25) |
NC1 shuffle p 0.068. A2 on all 160 days +27.92R; with NC1 +30.17R.
NC1: K1 PASS (skipped -0.068R, gap +0.306R) | K2 PASS (+0.245 / +0.265) | K3 PASS (NC0's gap -0.004) | K4 PASS (p 0.068).
**BY THE LINES WRITTEN FIRST, NC1 PASSES. THE PASS IS PROVISIONAL (plan section 9), AND IT IS FRAGILE. Said in full:**
1. POST-HOC (not pre-written; computed after the run because two skipped days are the very days of this replay): with the five week-17
   days removed, skipped 31 avg -0.007R, kept 124 avg +0.252R, gap +0.259R, shuffle p 0.110. That is K1 FAIL (not below zero, gap under
   0.30) and K4 FAIL (p over 0.10). The pass rests on Thu 04-23 and Fri 04-24, the days that gave me the idea.
2. The dose goes the WRONG way: skipping only the bigger runs (20+) gives a SMALLER gap (+0.240R; +0.052R from 04-07). A real "do not
   chase" effect should grow with the chase.
3. Contamination declared before the run: LM's May description saw the same thing on part of these days.
4. Multiple looks: this is idea 138. A pass at p 0.068 is what about one idea in fifteen would show by luck.
5. Before 04-07 the skipped group is 11 days.
What a provisional pass allows (plan section 9): at most a pre-registered forward count on lived days, NC1 frozen (X = 15), as a paper
tag on A2's paper call (no money is affected: A2 is on paper). It would be a second paper line beside SW1's shadow, and EN2 is waiting
for its turn. My coach decides whether NC1 gets a forward count, and when. I start nothing. My own view: weakest kind of pass; if it gets
a slot it should be judged on at least 30 forward skip days with the same four lines, which at about one skip a week is about 7 months.
Counts: idea 138; variants 368-370.

# New idea: a separate AFTERNOON trade in the rule's direction. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RUN
Clock Tue 2015-04-28 01:00 London (end of released data). All lived history 01-06 .. 04-27 (explicit end date 2015-04-28); costs on; London time.
Coach, 04-27: "next test should be a new idea, not another re-run."

## Where it comes from - and why I distrust it
My journal, five times in thirteen days: "the buy/sell was right about the day and the morning paid nothing; the move came after noon"
(04-09, 04-16, 04-21, 04-22, 04-27). Each time I closed at 12:00 by the rule and watched 60 to 110 pips go my way in New York hours.
Why I distrust it: (1) it comes from a losing stretch, which is exactly when everything I did not do looks good; (2) I have tested the afternoon three times as an EXIT
(hold to 13:00 / 16:00, runner past noon) and it lost every time; (3) on the 17 April trades the afternoon went my way on 8 - a coin; (4) the night test on 04-22 taught
me that the 3-day signal pays in London's morning and nowhere else I have looked.
What is new: this is not an exit. It is a SECOND, separate trade with its own entry, its own 40 pip stop and its own result, taken after the morning trade is closed
and (in the main variant) only after a particular kind of morning. I have never tested an afternoon entry in the rule's direction. (Idea N faded London's move in the
afternoon - the opposite bet - and died forward.)

## Base rates first (my method rule of 04-23), counted before writing the test - occurrences only, no afternoon results looked at
80 A2 mornings to 04-27. Morning result a SCRATCH (between -0.3R and +0.3R, not stopped): 21 (Jan 3, Feb 6, Mar-now 12). Morning WIN above +0.3R: 37 (12 / 8 / 17).
Morning LOSS below -0.3R: 22 (4 / 6 / 12).
The five days that gave me the idea are REMOVED from every number: 04-09, 04-16, 04-21, 04-22, 04-27 (three of them are scratches, one a small win, one a stop).
Sample, plainly: the scratch version has 21 cases, 18 after the removal - too few to mean much (average known to about +-0.48R). The every-day version has 80 (75).
I therefore make the every-day version the one that carries the weight, and the scratch version must beat IT to count for anything.

## Hypothesis
After London's morning, New York trades in the direction of my 3-day signal often enough that a separate afternoon trade in that direction has a positive expectancy of
its own - and this is stronger after a morning in which the signal's direction has not yet been paid (a scratch) than after a morning win.

## Variants (123, 124, 125; ideas -> 46), no others afterwards. Same for all: market order at 13:30 London in the direction of that day's 3-day signal, stop 40 pips,
no target, close at market at 17:00 London, $125 risk, costs on. At most one afternoon trade a day; never while the morning trade is open (it is always closed by 12:00).
- AF2 (the base rate, 80 days): every A2 day.
- AF1 (the idea): only after a scratch morning (A2 result between -0.3R and +0.3R, not stopped).
- AF3 (the contrast): only after a morning win above +0.3R.
(Clock note: US clocks moved on 03-08 and London's on 03-29, so between those dates 13:30 London is an hour after the US morning data instead of at it. One fixed London time; I do not tune it.)

## KILL TEST (explicit) for a stand-alone setup. The five inspiring days are removed from every number and shown separately. The build can only kill; a survivor gets
a cost-stress run and a forward PAPER tag (100 forward trades, at least +0.15R per trade at two standard errors). Nothing here can change what I trade.
A variant survives only if ALL:
  K1. average R per trade at least +0.15R;
  K2. net R positive in each of the three periods (January, February, March-to-now);
  K3. net R still positive without its three best trades;
  K4. maximum drawdown at most 5R and the worst 10 trades in a row not worse than -4R;
  K5. independence from A2: correlation with A2's morning R at most +0.30, and net R not negative on the days A2's morning lost;
  K6. (AF1 and AF3 only) its average must be at least 0.10R above AF2's - the condition has to add something to "every afternoon".
My guess, written now: AF2 is about zero (between -0.10R and +0.10R per trade); AF1 without its inspiring days is no better than AF2; AF3 is the worst of the three
(after a morning that already ran, the afternoon gives some back - that is why the noon exit works). No survivor. If AF2 is clearly positive in all three periods
I will be surprised, because the exit tests said the opposite on the same hours.

# RESULTS (kill test above pushed in commit 07786e0 before any code; one run: `python bt/afternoon.py 2015-04-28 2015-04-09,2015-04-16,2015-04-21,2015-04-22,2015-04-27`)
80 A2 days 01-06..04-27, costs on, R of $125. The five inspiring days are out of every number.

## Mechanics checked by hand on two days that are NOT inspiring days, before the totals
- 04-10 (sell day): 13:30 open bid 1.05846 -> sold 1.05845, stop 1.06246; the 13:30-17:00 high is 1.06352 -> stopped 14:45, -1.00R. Engine = candles.
- 04-17 (buy day): 13:30 open 1.08205 -> bought 1.08216, stop 1.07805; the low is 1.07335 -> stopped in the first five minutes, -1.02R (the 110 pip drop after my +1.70R
  morning that my journal of that day describes). Engine = candles.

## Totals
| | trades | win rate | avg R (+- 2 SE) | net R | full stops | max DD | worst 10 | Jan | Feb | Mar-now | without best 3 | corr with A2's morning | net on A2's losing days |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| AF2 every day | 75 | 39% | -0.106 (+-0.26) | -7.94 | 32 | 11.41R | -9.53R | -4.94 (19) | +3.26 (20) | -6.26 (36) | -16.35 | 0.00 | -7.86 (27 days) |
| AF1 after a scratch morning | 18 | 50% | +0.092 (+-0.60) | +1.65 | 8 | 4.26R | -1.63R | -0.65 (3) | +3.86 (6) | -1.56 (9) | -5.50 | +0.12 | -2.17 (6 days) |
| AF3 after a morning win | 36 | 36% | -0.108 (+-0.38) | -3.90 | 14 | 6.28R | -6.28R | -1.55 (12) | -0.36 (8) | -1.99 (16) | -11.57 | -0.06 | n/a |
The five inspiring days, shown only: 04-09 +2.40, 04-16 -1.02, 04-21 +1.08, 04-22 +0.24, 04-27 +1.33 = +4.03R in five afternoons.

## Kill lines applied
| line | AF2 | AF1 | AF3 |
|---|---|---|---|
| K1 avg >= +0.15R | FAIL (-0.11) | FAIL (+0.09) | FAIL (-0.11) |
| K2 positive in each period | FAIL | FAIL (only February) | FAIL (negative in all three) |
| K3 positive without best 3 | FAIL | FAIL (-5.50) | FAIL |
| K4 DD <= 5R, worst 10 >= -4R | FAIL (DD 11.4R) | PASS | FAIL |
| K5 independent of A2 | FAIL (-7.86R on A2's losing days) | FAIL (-2.17R) | PASS |
| K6 at least 0.10R above AF2 | - | PASS (+0.20) | FAIL |
VERDICT: NO SURVIVOR. An afternoon trade in my rule's direction loses money: 75 afternoons, 39% winners, 32 full stops, -7.94R. Idea closed. No tag. A2 unchanged.

## My guess against what happened
"AF2 about zero, between -0.10R and +0.10R": -0.106R - at the edge of my range, on the losing side. "AF1 no better than AF2": it is 0.20R better on 18 trades with a noise
band of +-0.60R, and all of it is six February afternoons. "AF3 the worst": equal worst with AF2. Close enough; the direction of every guess was right.

## What I learned
- The five afternoons I wrote about in my journal made +4.03R. The other seventy-five made -7.94R. My memory was accurate about what happened on those five days and
  completely wrong about what they meant. I remembered the afternoons I had been made to watch; I had no reason to remember the forty-six that lost.
- It is the same answer as the three exit tests and the night test, now for a separate entry: the 3-day signal has an edge between 08:00 and 12:00 London and has
  none at 13:30. With 32 full stops in 75 trades the afternoon is where a 40 pip stop gets run over - the New York open moves further and in both directions.
  "Hold past noon" would not have been the fix for last week; it would have been a second way to lose.
- Useful for the next losing stretch: when the urge is "the move came after I got out", the sentence to write is "75 afternoons, -0.11R each, 43% of them a full stop".
- The scratch-morning version (+0.09R on 18 trades) is not evidence of anything, and I am not parking it: its whole profit is February, and it loses on the days
  A2 loses.
- Method note: this is the first idea I built with the base rate (AF2) and a contrast (AF3) inside the test from the start. It made the result easy to read:
  the idea did not fail against zero, it failed against "every afternoon".
Counts: ideas 46, variants 125.

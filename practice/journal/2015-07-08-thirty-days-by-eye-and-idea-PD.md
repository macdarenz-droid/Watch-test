# The last 30 days by eye (D1 / H4 / H1), three observations, and one of them as a new setup: idea PD, fade the first touch of yesterday's extreme. KILL TEST WRITTEN BEFORE THE SETUP CODE
Clock Thu 2015-07-09 01:00 London (end of released data). A2 is on paper since yesterday (rule alarm); the funded account is flat.
Coach 07-08: "by eye, go through the last 30 days of charts on D1/H4/H1 and write 3 fresh observations about how the market moves now, then turn the
best one into a new setup with 100+ historical cases and a kill test."
July goal: a worked case before every pushed number or rule; every file write read back.
Charts: `python chart.py --tf D1 --n 45`, `--tf H4 --n 180`, `--tf H1 --n 360` (to the clock). What follows is read off the pictures; prices are approximate.

## What the last 30 days look like
D1: a box. Low about 1.082 (05-27), up to about 1.1436 (06-18), back to about 1.0916 (07-07). Inside it the big days do not line up: a 200 pip
day up (06-03) and the next but one is down; 06-08 up big, then four small days; 06-23 down 210, then three small days; 06-29 up from a gap, then
two days down. In May, just before, six red days stood in a row; in this window I cannot find three.
H4: long wicks at both ends. The tops of 06-10, 06-18 and 06-29 and the lows of 06-05, 06-29 and 07-07 are single candles that poke out and close back.
H1: long flat stretches (06-24 to 06-26: three days inside 50 pips) and then the whole day's move in two or three hours; two weekend gaps (06-29,
07-06), both filled within a day or two.

## Three observations
1. BIG DAYS ARE NOT FOLLOWED. After a day with a body of about 100 pips or more, the next day is small or goes the other way. (About 7 such days in
   the window - far too few to be a setup; and it is the mirror of GA, where the morning after a wide day was A2's best group in the first months.)
2. NEW EXTREMES ARE REJECTED. When the price reaches yesterday's high or low it tends to turn there rather than run: the H4 wicks. The box is made
   of failed breaks.
3. THE MOVE COMES IN A BURST AFTER A FLAT STRETCH, at no hour I can name in advance. (Idea MH tested "big follows big": true as description, no side.
   Idea BS / EF: the quiet-before-the-storm picture failed three times. Not again.)
THE BEST ONE: 2. It has a side (against the touch), a level known in advance (yesterday's extreme), it happens on most days - and it is the opposite
of what paid in January to March, which is exactly why it has to be tested on those months too and not only on the box I have been looking at.

## Sample, counted WITHOUT outcomes (python over history)
Days that start (00:00 London) inside yesterday's London-day range and touch yesterday's high or low between 00:00 and 20:00:
83 of 103 days BEFORE 06-08, and 17 of 21 days in the 30 days I looked at (06-08 .. 07-08). 100 cases in all; 83 of them never looked at for this idea.
The 17 in the window I studied are the inspiring days: shown, never judged.

## THE SETUP (fixed now)
Yesterday's London day = 22:00 to 22:00. YH, YL = its high and low. Today, if the 00:00 London open is inside (YL, YH):
the FIRST touch of either level between 00:00 and 20:00 London is faded with a resting order AT the level: sell at YH (filled when the bid reaches
it), buy at YL (filled when the ask reaches it). Stop 30 pips beyond the entry, never moved. One trade a day; the other level is ignored afterwards.
Variants (3): PD1 no target, out at 21:00 London.   PD2 target 30 pips (1R), else out at 21:00.
PD3 confirmation: no resting order; after the touch, wait for the first full clock hour that CLOSES back inside the range, enter at the next hour's
open (only if that open is before 20:00), stop 30 pips, out at 21:00.
Costs on: spread 1.0 pip, slippage 0.1 on market and stop exits; R = result / 30 pips. STRESS: 2.0 + 0.5.
Worked case by hand (Tue 07-07, in the studied window, so a mechanics check and not evidence): yesterday's low 1.09690; 00:00 open 1.10546, inside;
the ask first reaches 1.09690 in the 09:45 London bar (bid low 1.09611) -> BUY 1.09690, stop 1.09390; the 13:00 bar trades under 1.09390 -> stopped:
about -1.00R for PD1 and PD2. (The day's low came later, 1.09163, and the evening rallied to 1.1017 - the wick I saw on the chart; the fade at
the first touch was 50 pips early.) That my own example loses is noted and not hidden.

## Kill test (judged set: the 83 cases before 06-08; one failure kills the variant)
- K1: average at least +0.10R a trade after costs.
- K2: positive in BOTH parts of the judged set: before 04-07 (the months of the long fall) and from 04-07 to 06-05.
- K3: net positive without its three best trades.
- K4: max drawdown 8R or less.
- K5: at stressed costs still at least +0.05R a trade.
- K6 sample: at least 60 judged trades.
- K7 independence: correlation of its daily R with A2's daily R not above +0.30.
Worked case for the lines: 83 trades, 45 at about -1.03R and 38 at an average of +1.4R = +6.9R = +0.08R a trade: K1 FAILS. With no target the
winners have to average about +1.4R at a 46% hit rate just to reach the line.
A survivor: a PAPER setup, logged every day beside A2's paper line, judged on forward days before anything else; the account stays flat until a
restart rule exists. Killed: second setups tried 13, none alive, said plainly.
Worked expectation: before 04-07 a fade of yesterday's low in a market falling 1,200 pips loses (the breaks RAN there: that was A2's money): negative.
From 04-07 to 06-05 about zero to slightly positive. In the 30 days I looked at: positive, because I looked. KILLED on K2 and K1.
Counts when run: idea 100, variants 280-282.

## Mechanics check (setup and kill test pushed first in commit 32d9eee; `python bt/prev_day_fade.py 2015-07-09 --check 2015-07-07`)
PD1 and PD2: touch 09:45, BUY 1.09690, stopped 13:00 at 1.09389, -1.00R: exactly the hand-worked case. PD3: entered after the 10:00 hour closed
back inside, stopped 11:30, -1.00R.

## RESULTS (one run: `python bt/prev_day_fade.py 2015-07-09`; costs on; figures copied from the print)
| variant | JUDGED trades (before 06-08) | avg R | net | wins | stopped | before 04-07 | 04-07 .. 06-05 | without 3 best | max DD | stressed avg | corr with A2 | the studied 30 days (not judged) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| PD1 fade at the touch, out 21:00 | 83 | -0.405 | -33.59R | 20% | 76% | 43: -0.411 | 40: -0.397 | -46.98R | 33.59R | -0.422 | -0.17 | 16: -0.484 |
| PD2 with a 30 pip target | 83 | -0.379 | -31.48R | 30% | 66% | 43: -0.213 | 40: -0.557 | -34.48R | 31.48R | -0.438 | +0.02 | 16: -0.325 |
| PD3 after an hour closes back inside | 60 | -0.217 | -13.00R | 30% | 65% | 29: -0.166 | 31: -0.264 | -25.35R | 14.88R | -0.233 | -0.24 | 13: +0.186 |
Kill lines: K1 (avg >= +0.10R) FAIL, K2 (both parts positive) FAIL, K3 FAIL, K4 (DD <= 8R) FAIL, K5 FAIL for all three; K6 (sample) and K7 (independence) pass.
VERDICT: all three KILLED - and not narrowly. Second setups tried: 13, none alive.

## Expectation against the run
"Before 04-07 negative": yes. "From 04-07 to 06-05 about zero to slightly positive": WRONG - it is the WORSE half for PD2 (-0.56R) and as bad for
PD1 (-0.40R). "In the 30 days I looked at: positive, because I looked": WRONG TOO - at the touch it loses there as well (-0.48R, -0.33R); only the
confirmation variant is positive there (+0.19R on 13 trades).

## What I take from it - the observation was wrong, and how wrong is the finding
- I looked at thirty days of charts and saw wicks: extremes poked and rejected. The count says: when the price first touches yesterday's high or
  low, it goes 30 pips BEYOND it before 21:00 three times in four (76% of 83 cases), in the falling months and in the box months alike - and in
  the very thirty days in which I "saw" the rejections. My eye kept the three or four big wicks at the turning points of the month and did not
  see the dozens of ordinary days on which the level simply gave way. This is the same lesson as the weekend gaps ("both filled") and the busy
  hours of the best days, at larger size: A PICTURE IS THE DAYS I REMEMBER.
- That is the most useful thing I have learned about the market this week, and it is the opposite of what I set out to show.
- THE TEMPTATION, named before I do anything with it: if fading the touch loses 0.4R a trade, FOLLOWING it should win. A rule read off the
  mirror of a failed test is the most over-fitted object there is: I have now seen every one of these 100 days through it, and "the other side of
  a 30 / 30 bracket" is not even the same trade (a stop order filled in a fast market, with slippage where it hurts; the fade's 66% stops are not
  66% clean targets). I do NOT run it on this history as a test - the answer is already on this page, turned inside out.
- What can be done honestly with it, and only this: write the following-the-break setup down NOW with fixed rules, record its history figures
  as a DESCRIPTION labelled "seen in the mirror, not evidence", and let FORWARD days judge it on paper with lines written before the first one.
  That is a proposal for the next brick, for the coach to accept or not; it is not started today (one test at a time).
Counts: ideas 100, variants 282 (PD1, PD2, PD3). Adopted trading ideas: 0. A2 on paper since 07-08; the account is flat.
July: numbers corrected after a push: 1; file errors found late: 0.

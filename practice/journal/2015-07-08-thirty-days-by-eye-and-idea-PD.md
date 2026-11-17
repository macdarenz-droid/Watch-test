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

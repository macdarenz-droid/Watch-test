# Idea RC: trades that ran far and came back - and is a different fixed exit time better than 12:00? HYPOTHESIS, WORKED CASES AND KILL LINES BEFORE ANY CODE
Clock Fri 2015-06-19 01:00 London (end of released data). After funded day 60. Coach 06-18 (to earn Fri 06-19): "your trades that ran far then came
back. what share of A2 trades reach +1R before the clock exit, and does a pre-written exit at a fixed time earlier or later beat the current clock?
hypothesis and kill line first, max 3 variants, costs on."
June goal: every number and every test rule gets one worked case before it is pushed. All figures below are from tool prints already in my journal.

## What is already known, said first (so this is not a silent re-run)
- LATER clocks were tested on 05-28 (idea XT, 103 trades): 12:30 / 13:00 / 13:25 = -2.59R / -5.94R / -9.52R against A2. All killed.
- EARLIER clocks (10:00, 11:00) were tested only on January-February in the first weeks (idea X), never on all history. LK3 (06-12) closed at 11:00
  ONLY trades 20+ pips up: forward +0.92R, build -6.76R. The 05-01 LK study: the hour 11:00-12:00 added +0.18R per in-profit trade.
- NEVER measured: the share of trades that reach +1R, and what the clock does to exactly those trades.
So the new parts are (1) the +1R count and (2) an unconditional earlier clock on all 118 days. One later clock is re-run on today's history beside them.

## Part 1 - the count (description, no kill line; definitions fixed now)
"+1R" = the trade's best open result reaches +40 pips or more at any time before its exit (M5 bars, closeable side: `journal/mfe-mae-log.csv` rule).
To be printed: how many of all A2 trades reach +1R; of those, the result at 12:00 (average; how many end at +1R or more, between 0 and +1R, at or
below 0); the same split for trades that never reach +1R.
Worked cases from my walk notes: 06-10 best +86.3 pips, closed -0.14R: "reached +1R, ended at or below 0". 06-18 best +72.6, closed +1.20R: "reached, ended >= +1R".
06-17 best +8.2: "never reached". My guess, written now: about 45% of trades reach +1R; of those about 60% still end at +1R or more, about 10% end at or below 0.

## Part 2 - the test. HYPOTHESIS: a fixed exit time other than 12:00 London gives more R than 12:00 on all history
Variants (3; same signal, 08:00 entry, 40 pip stop, costs on, all days to END 2015-06-19; own loop of bt/exit_clock.py, whose 12:00 version must reproduce engine A2):
- RC1: close at 11:00.   RC2: close at 11:30.   RC3: close at 12:30 (= XT1, re-run on 15 more days).
Worked cases (from the walk prints, live fills; the engine may differ by a few hundredths):
- Thu 06-18, BUY 1.13475, noon +1.20R: the 11:00 bar opens about 1.14184 -> +70.9 pips -> about +1.73R (RC1 better by about 0.5R); the 11:30 bar opens about
  1.13926 -> +45.1 pips -> about +1.10R (RC2 worse by about 0.1R).
- Wed 06-10, BUY 1.13002, noon -0.14R: the 11:00 bar opens 1.13001 -> about 0.00R (RC1 better by about 0.14R).
- Tue 06-16, SELL 1.13153, noon +1.60R: at 11:00 +62.7 pips -> about +1.57R (RC1 about the same).
Kill lines (each variant against A2; one failure kills it):
- K1: net R at least 1.0R above A2.
- K2: ahead of A2 both before 03-02 and from 03-02.
- K3: improved days >= worsened days, and still ahead without its single best day.
- K4: max drawdown not larger than A2's.
- K5 (the BD lesson): on the best days (A2 >= +1.60R) it gives back no more than 1.0R in total.
- K6 (the coach's group): on the trades that reach +1R it is ahead of A2 in total.
A survivor: a paper line beside the daily trade, judged on forward days; the live exit stays 12:00 whatever comes out (coach 05-26; plan section 5).
Worked expectation, written now: RC3 fails as XT1 did (about -2.6R). RC1: three fresh memories say "better"; the 05-01 study says the last hour pays
+0.18R per in-profit trade, about 60 such trades -> I expect RC1 about -5R and RC2 about -2R. All three killed on K1; RC1 also on K5.
Counts when run: idea 85, variants 236-238 (RC1, RC2 new; RC3 a re-run of XT1).

## Mechanics check (lines pushed first in commit 49ae20f; `python bt/ran_came_back.py 2015-06-19 --check DATE`)
The 12:00 version of the loop against engine A2: largest difference per day 0.000R on 118 days.
06-18: A2 +1.22R (engine); RC1 +1.77R (worked about +1.73R); RC2 +1.12R (worked about +1.10R). 06-10: RC1 -0.00R (worked about 0.00R). 06-16: RC1 +1.56R (worked about +1.57R).

## PART 1 - THE COUNT (118 A2 trades to 06-18, +36.57R; figures copied from the print)
| group | trades | total at 12:00 | avg | end at +1R or more | end between 0 and +1R | end at or below 0 |
|---|---|---|---|---|---|---|
| REACH +1R (best open >= 40 pips) | 50 (42%) | +64.54R | +1.29R | 34 (68%) | 14 (28%) | 2 (4%) |
| never reach +1R | 68 (58%) | -27.97R | -0.41R | 0 | 22 (32%) | 46 (68%) |
- Give-back of the 50 reachers (best minus the noon result): median 14 pips, 75th percentile 29 pips, largest 125 pips.
- Reached +1R and ended at or below zero: TWO trades in 118 - 03-12 (-0.12R) and 06-10 (-0.14R).
- When the best price of a reacher came: before 10:00 13; 10:00-10:59 10; 11:00 or later 27 of 50.
My guesses: 45% reach (42%); 60% of them still end at +1R or more (68%); 10% end at or below zero (4%). The picture is BETTER than the one in my head.

## PART 2 - THE TEST (one run; costs on; all 118 days; figures copied from the print)
A2: +36.57R, max drawdown 4.92R; before 03-02 +19.56R, from 03-02 +17.01R; best days 15 (+32.51R); reachers 50 (+64.54R).
| variant | net | vs A2 | before 03-02 / from 03-02 | better / worse days | max DD | on the 15 best days | on the 50 reachers | on the 68 others |
|---|---|---|---|---|---|---|---|---|
| RC1 close 11:00 | +28.54R | -8.03R | -4.64 / -3.39 | 36 (+12.12R) / 56 (-20.14R) | 5.83R | -6.64R | -6.50R | -1.53R |
| RC2 close 11:30 | +27.61R | -8.96R | -3.34 / -5.62 | 31 (+6.70R) / 56 (-15.62R) | 5.24R | -3.72R | -6.10R | -2.86R |
| RC3 close 12:30 | +33.55R | -3.02R | -0.94 / -2.08 | 38 (+9.71R) / 48 (-12.73R) | 4.67R | -3.43R | -3.63R | +0.61R |
| line | RC1 | RC2 | RC3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL | FAIL | FAIL |
| K2 ahead in both periods | FAIL | FAIL | FAIL |
| K3 improved >= worsened, ahead without best day | FAIL | FAIL | FAIL |
| K4 drawdown not larger | FAIL | FAIL | PASS |
| K5 gives back <= 1.0R on the best days | FAIL | FAIL | FAIL |
| K6 ahead on the trades that reach +1R | FAIL | FAIL | FAIL |
VERDICT: all three KILLED. 12:00 stays. No paper line.

## Expectation against the run
RC3: guessed about -2.6R, got -3.02R. RC1: guessed about -5R, got -8.03R. RC2: guessed about -2R, got -8.96R - far off: I thought half an hour
costs half of an hour; it costs as much as the whole hour, behind in both periods. "All killed on K1, RC1 also on K5": yes, and more lines than that.

## The answer to the coach's two questions
1. What share reach +1R before the clock? 42% (50 of 118). Those 50 trades made +64.54R; the other 68 lost 27.97R. Of the 50, 34 still close at +1R
   or more, 14 close smaller but positive, and 2 - two - close at or below zero. "Ran far and came back" is how last Wednesday felt; in the record
   it is one trade in sixty. The median reacher gives back 14 pips of its best. And 27 of the 50 make their best price in the LAST hour.
2. Does an earlier or later fixed clock beat 12:00? No, on every line. Closing at 11:00 or 11:30 costs about 8-9R of 36.6R, in both halves, with a
   deeper drawdown, and most of it (6.1-6.5R) is taken from exactly the trades that reach +1R - the group the idea was meant to protect. 12:30 costs 3R.
   Earlier is worse than later. With XT's 13:00 and 13:25: six fixed clocks around noon have now been run on all history, and 12:00 is the top of the hill
   on both sides - a hill, not a spike, which is what I asked of the lookback in idea LB too.
- Why an early clock feels right and is wrong: on 06-18 the price at 11:00 was better than at noon by half an R, and I remember that. There were 36
  such days against 56 the other way. The last hour is where the reachers are still reaching.
- What this does NOT say: that noon is right for every future market. It was chosen in January on 19 trades; five months later it is still the
  best of what I have tried. A hill found on the same data it is tested on is flattered; the forward days since 03-02 (-3.39R / -5.62R / -2.08R
  for the three alternatives) are the part I trust.
Counts: ideas 85, variants 238 (RC1, RC2 new; RC3 = XT1 re-run on 118 days). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today).

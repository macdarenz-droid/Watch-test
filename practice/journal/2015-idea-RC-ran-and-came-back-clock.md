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

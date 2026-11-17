# Replay of my last 20 trades for their EXITS (study), then one observation as a rule: idea BE, break-even after a first push. KILL LINES WRITTEN BEFORE THE TEST
Clock Fri 2015-07-03 01:00 London (end of released data). After funded day 70. Coach 07-02: "study how your exits behave. replay your last 20 trades by
eye and note where a better trader would have managed differently, then turn one observation into a testable exit rule."
July goal: a worked case before every pushed number or rule; every file write read back.

## The replay (trades 51-70, 06-05 .. 07-02; M15 charts by `bt/week_charts.py`, the first ten already replayed on 06-18; best / worst open result from `bt/mfe_mae.py 2015-07-03`, engine)
| day | side | result | best open (when) | worst open | what a better trader would have done with the EXIT |
|---|---|---|---|---|---|
| 06-05 | buy | -0.66R noon | +31.7 (08:55) | -31.2 | banked or protected the +32; it bled away all morning |
| 06-08 | sell | stop | 0.0 | -47.6 | nothing: wrong from the first minute |
| 06-09 | buy | stop | +11.0 (08:00) | -41.2 | nothing |
| 06-10 | buy | -0.14R noon | +86.3 (09:05) | -19.5 | banked the spike (the +80 question: GB1, parked at 15 cases) |
| 06-11 | buy | stop | 0.0 | -49.8 | nothing |
| 06-12 | sell | +0.85R | +66.9 (09:50) | -29.1 | held, as I did (gave back 33) |
| 06-15 | sell | +0.23R | +19.8 (11:00) | -34.0 | nothing |
| 06-16 | sell | +1.59R | +75.1 (10:50) | -15.5 | held, as I did |
| 06-17 | sell | +0.14R | +8.2 (11:55) | -34.0 | nothing |
| 06-18 | buy | +1.22R | +72.6 (11:00) | -1.5 | held |
| 06-19 | buy | stop | 0.0 | -43.4 | nothing |
| 06-22 | buy | stop | 0.0 | -51.6 | nothing |
| 06-23 | buy | stop 11:05 | +14.6 (08:30) | -45.6 | nothing I can name |
| 06-24 | sell | -0.12R noon | +17.3 (11:20) | -38.0 | nothing |
| 06-25 | sell | -0.15R noon | +38.0 (10:30) | -35.9 | protected the +38 before the 11:15 candle took it |
| 06-26 | sell | -0.15R noon | +9.2 | -22.4 | nothing |
| 06-29 | sell | stop 11:55 | +34.1 (09:00) | -48.9 | NOT let a +34 trade become a full stop |
| 06-30 | buy | +0.49R | +41.1 (11:05) | -31.3 | held (it was +35, back under the entry, then +41) |
| 07-01 | sell | stop 10:10 | +28.7 (09:15) | -47.3 | NOT let a +29 trade become a full stop |
| 07-02 | sell | +0.08R | +26.5 (09:15) | -10.5 | banked or protected the +26 |
Twenty trades, -4.77R (engine). 8 full stops: 5 of them were never more than 15 pips in profit - no exit rule touches those; that is the direction.
THE ONE THING THAT REPEATS ON THE EXIT SIDE: six trades were +25 pips or more at some point and ended at about zero or worse (06-05, 06-10, 06-25,
06-29, 07-01, 07-02; together -2.87R), two of them as FULL stops. A better trader does not let a trade that has been +30 pips lose 40.
Against it, in the same twenty: 06-30 was +35, went back under its entry and then made +0.49R; and four winners (06-12, 06-16, 06-18 and 06-30)
needed room. Whether they would have survived a stop at the entry is exactly what a test is for.

## What is already known about break-even stops (disclosed)
- X1 (break-even after +20 pips): tested in the first weeks on JANUARY and FEBRUARY only: +0.70R / +0.25R a trade against A2's +0.78R / +0.23R. Never on the months since.
- PM3 (break-even after +1R = 40 pips): all history to April and forward to June: about nothing (+0.07R on 2 changed days). GB3 (after +80): changes nothing.
- AD2 (an add plus break-even) lost. My note of 04-15: "break-even has now hurt three times; lever closed."
So I expect a kill. The reason to test anyway: the lever was closed on a market that ran; the last 60 days do not run, and the level between
+20 and +40, where my six cases sit, has never been run on anything after February.

## HYPOTHESIS: moving the stop to the entry once the trade has been +X pips makes A2 better
Rule: A2 as it is; once the best open result reaches +X pips (closeable side), the stop goes to the entry price from the next bar; noon as usual.
Variants (3): BE1 X = 25; BE2 X = 30; BE3 X = 20 (X1, re-run on all history).
JUDGED SET: all A2 days BEFORE 06-05 (the twenty replayed trades are the inspiring days and are shown separately, never judged). END 2015-07-03; costs on.
Worked cases, by hand from my walk prints (these four are in the replayed twenty, so they are mechanics checks, not evidence):
- 07-01 sell 1.11250: best +28.7 at 09:15 -> BE1 on (BE2: 28.7 is under 30, NOT on; BE3 on) -> the 09:45 candle's rise takes the stop at the entry:
  about 0.00R instead of -1.00R for BE1 and BE3; BE2 stays -1.00R.
- 06-29 sell 1.10930: best +34.1 at 09:00 -> all three on -> stopped at the entry at about 10:30: about 0.00R instead of -1.00R.
- 06-30 buy 1.11654: +35.5 in the second candle -> all three on -> the 09:00 hour's low 1.11638 is under the entry: out at about 0.00R instead of +0.49R.
- 07-02 sell 1.10755: best +26.5 -> BE1 and BE3 on; the price is back above the entry by 10:30: about 0.00R instead of +0.08R; BE2 unchanged.
Kill lines (each variant against A2 on the judged set; one failure kills it):
- K1: net R at least 1.0R above A2.
- K2: ahead of A2 both before 03-02 and from 03-02 (to 06-04).
- K3: improved days >= worsened days, and still ahead without its best day.
- K4: max drawdown not larger than A2's.
- K5 (the BD lesson): on the best days (A2 >= +1.60R) it gives back no more than 1.0R in total.
A survivor: a paper count beside the daily trade, judged on forward days from 07-03 (never the replayed twenty); the live exit does not change.
Worked expectation: on the replayed twenty all three look good (that is why I saw it): about +2R to +3R. On the judged set I expect what January and
February showed in small: a few saved losers against more winners cut at the entry before they run - net between -3R and 0: KILLED on K1, K3, probably K5.
Counts when run: idea 96, variants 268-270 (BE1, BE2 new; BE3 = X1 re-run on all history).

## Mechanics check (replay and kill lines pushed first in commit 0bdb0c9; `python bt/break_even.py 2015-07-03 --check DATE`)
07-01: BE1 and BE3 out at the entry 09:55 (0.00R), BE2 still -1.00R. 06-29: all three out at the entry (0.00R). 06-30: all three out at the entry
08:50 (0.00R instead of +0.49R). 07-02: BE1 and BE3 out at the entry 09:35 (0.00R), BE2 unchanged +0.08R. All four as worked by hand.

## RESULTS (one run: `python bt/break_even.py 2015-07-03`; costs on; figures copied from the print)
A2: 128 days +31.63R. JUDGED SET (108 days before 06-05): +36.39R, max drawdown 4.54R, 15 best days. The replayed twenty: -4.76R.
| variant | JUDGED: vs A2 | before 03-02 | 03-02 .. 06-04 | changed days: better / worse | without best day | max DD (A2 4.54R) | on the 15 best days | the replayed twenty (NOT judged) |
|---|---|---|---|---|---|---|---|---|
| BE1 break-even after +25 | -3.87R | -1.28R | -2.59R | 15: 5 (+2.17R) / 10 (-6.05R) | -4.89R | 5.57R | 0.00R | +2.37R |
| BE2 after +30 | -3.60R | +0.17R | -3.77R | 11: 3 (+0.98R) / 8 (-4.58R) | -4.11R | 5.57R | 0.00R | +1.45R |
| BE3 after +20 (X1) | -6.88R | -1.12R | -5.76R | 22: 7 (+2.66R) / 15 (-9.56R) | -7.91R | 6.20R | -1.65R | +2.37R |
| line | BE1 | BE2 | BE3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL | FAIL | FAIL |
| K2 ahead in both periods | FAIL | FAIL | FAIL |
| K3 improved >= worsened, ahead without best day | FAIL | FAIL | FAIL |
| K4 drawdown not larger | FAIL | FAIL | FAIL |
| K5 gives back <= 1.0R on the best days | PASS | PASS | FAIL |
VERDICT: all three KILLED. No paper count.

## Expectation against the run
"On the replayed twenty about +2R to +3R": +2.37R, +1.45R, +2.37R. "On the judged set between -3R and 0, killed on K1, K3, probably K5": -3.6R to
-6.9R - a little worse than my range; K1-K4 fail; K5 passes for the two wider ones (the best days do not come back to their entry after +25).

## What I take from it
- The same rule is +2.4R on the twenty trades I replayed and -3.9R on the 108 before them. That is the whole lesson in one row: twenty trades
  looked at by eye show me the two full stops a break-even would have saved, and not the ten days elsewhere on which a trade went +25, came back
  through its entry and then made its money. For every loser saved there are two winners cut (5 better, 10 worse).
- It is the FH study again from the exit side (04-09: "winners take their heat first and make their best price late"): a trade that returns to its
  entry after +25 pips is more often a winner taking a breath than a loser turning.
- Break-even has now been run at +20, +25, +30, +40 and +80 on all history: every level loses or does nothing. The lever is closed, this time on
  all the data and with the months since April included (-2.6R to -5.8R there, worse than before March). I will not open it a sixth time.
- What a better trader would have done with my last twenty exits, then? On the evidence: nothing systematic. He would have protected six trades
  and the same hand would have cost him more elsewhere. The exits that looked bad were the price of the exits that paid.
- The exit side as a whole, for the record: targets (+60, +80), trails (20 / 30 / 40 / 60 / 80), break-even (five levels), partials, adds, locks
  at 10:00 and 11:00, time-decay stops, close-stops, clocks from 10:00 to 13:25: about fifty definitions. GB1 (trail 40 from +80) is the only one
  not dead, and it waits for its fifteen cases (3 so far).
Counts: ideas 96, variants 270 (BE1, BE2 new; BE3 = X1 re-run on all history). Adopted trading ideas: 0. July: file or number errors found later
than the turn that made them: 0.

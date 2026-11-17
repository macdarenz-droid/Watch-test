# How big moves start (study), then one observation as a rule: idea MH, the momentum hour. STUDY ON JAN-MAR ONLY; RULE AND KILL LINES WRITTEN BEFORE THE TEST CODE
Clock Wed 2015-06-24 01:00 London (end of released data). After funded day 63. Coach 06-23: "for the next second-setup try, pick one that gives 100+
cases in your history so the test can actually answer. study first how the big moves on your charts start (what the hour before looked like), then
turn one observation into a rule."
June goal: every number and every test rule gets one worked case before it is pushed.

## The study (`python bt/big_moves.py 2015-01-06 2015-04-01`; hourly bars 12:00-20:59 London, when A2 is flat; JANUARY TO MARCH ONLY - April to June not looked at)
549 hourly bars on 61 days; median hourly body 10 pips, 90th percentile 33.
BIG hours (body of 30 pips or more): 69 (12.6% of hours); 42 of them between 13:00 and 15:59.
| what the hour BEFORE a big hour looked like | before big hours | all hours |
|---|---|---|
| went the same way as the big hour | 59% (64% for 40+ pip hours) | 46% |
| its range (median) | 35 pips | 25 pips |
| its body was 20+ pips | 39% | 23% |
| it was narrow (under the median range for its clock hour) | 33% | 50% by definition |
The other way round - what a rule can use (the hour before is known; what does the next hour do?):
| the hour before | cases | next hour same direction | next hour mean, with that direction | next hour 30+ pip body |
|---|---|---|---|---|
| any | 549 | 46% | -0.4 pips | 13% |
| body 20+ pips | 127 | 50% | +2.8 pips | 21% |
| body 40+ pips | 34 | 53% | +7.5 pips | 32% |
| narrow (range < 0.6 x its median) | 64 | 42% | -1.6 pips | 6% |
| closed outside the 3 hours before it AND body 20+ pips | 76 | 50% | +5.1 pips | 24% |
What I see: (1) big moves do NOT come out of quiet hours - the quiet-before-the-storm picture in my head is wrong for the third time (BS coil,
VL, now this): after a narrow hour a big one is HALF as likely as usual. (2) Big follows big: movement clusters. (3) Direction is a coin by count
(50%) but not by size: the continuations are larger than the reversals (+5 pips on average after a breaking 20+ pip hour, median about 0). If there is
an edge it is in a few large continuations, like A2's.

## THE RULE (one observation: a 20+ pip hour that closes outside the three hours before it tends to be followed, on average, by more of the same)
Signal hour: a full clock hour starting 11:00 .. 19:00 London on a weekday whose body (close - open) is 20 pips or more in size AND whose close is
beyond the highest high (up) / lowest low (down) of the three clock hours before it. Entry: market at the open of the next hour (12:00 .. 20:00), in
the signal's direction. Stop: 30 pips from the entry, never moved. No target. One position at a time: a signal while a trade is open is skipped.
A2 is flat at every possible entry time (it closes at 12:00).
Variants (3) = how long it is held: MH1 one hour; MH2 two hours; MH3 until 21:00.
Costs on (1.0 + 0.1); R = result / 30 pips.
Worked cases, by hand from the hourly bars of Fri 2015-03-06 (study period; winter, London = UTC):
- 11:00 hour: 1.09705 -> 1.09387, body -31.8, close under the lows of 08:00-10:59 -> SELL at 12:00 open 1.09390; stop 30 pips above; the 12:00 hour's
  high 1.09713 (ask 1.09723) takes it: -1.00R.
- 12:00 hour: body +31.6 but its close 1.09706 is NOT above the highs of 09:00-11:59 (1.10002): no signal.
- 13:00 hour: 1.09706 -> 1.08955, body -75.1, close under 1.09298 -> SELL at 14:00 open 1.08954; MH1: out at the 15:00 open 1.08551 + spread
  = about +39 pips = about +1.30R. MH2: the 15:00 hour's high 1.08882 does not reach the stop (1.09253); out at the 16:00 open 1.08601 = about +34 pips = about +1.14R.
- 14:00 hour: body -37.9, close 1.08575 under 1.08709 -> for MH1 (flat again at 15:00): SELL at 15:00 open 1.08551, stop about 1.08850; the 15:00
  hour's high 1.08882 takes it: -1.00R. For MH2 the 14:00 trade is still open: signal skipped.
  So 03-06: MH1 -1.00 +1.30 -1.00 = about -0.70R; MH2 -1.00 +1.14 = about +0.14R. (My best A2 day of March is a small loser for MH1: honest warning.)

## Kill lines (stand-alone second setup; all history 01-06 .. END 2015-06-24; UNSEEN = from 04-01, never looked at in the study)
- K1: average at least +0.10R a trade after costs on all history.
- K2: on the UNSEEN months alone, average at least +0.05R a trade.
- K3: net positive without its three best trades (the idea lives on a tail; it must not be three trades).
- K4: max drawdown 8R or less.
- K5: at stressed costs (2.0 + 0.5) still at least +0.05R a trade on all history.
- K6 sample: at least 100 trades in all and at least 40 unseen.
- K7 independence: correlation of its daily R with A2's daily R not above +0.30.
Worked case for the lines: 150 trades at +0.10R = +15R (K1 pass at the line); unseen 70 trades at +0.02R -> K2 FAIL.
A survivor: a paper line (never live; two trades on one day would need the plan's two-trade buffer). Killed: second setups tried 12.
Worked expectation, written now: the study says about +5 pips an hour before costs on 76 cases, so about +0.13R for MH1 in January-March if the stop does
not eat it (it will eat some: the next hour's median range is 35 pips against a 30 pip stop). My own record says what happens next: N1 passed its
build and died forward. I expect the study months near +0.05R to +0.10R and the unseen months near zero: KILLED on K2, probably K1. MH3 worst (afternoon reversals).
Counts when run: idea 88, variants 245-247.

## Mechanics check (rule pushed first in commit 67dbf83; `python bt/momentum_hour.py 2015-06-24 --check 2015-03-06`)
MH1: 12:00 sell -> stop 12:50 -1.00R | 14:00 sell -> 15:00 +1.30R | 15:00 sell -> stop 15:40 -1.00R = -0.70R. MH2: -1.00R, +1.14R = +0.13R.
Exactly the hand-worked day (hand: -0.70R and about +0.14R). MH3 on that day: -1.00R, +1.49R.

## RESULTS (one run: `python bt/momentum_hour.py 2015-06-24`; 168 signals on 94 days; costs on; figures copied from the print)
| variant | trades | avg R | net | wins | full stops | STUDY months Jan-Mar | UNSEEN Apr-Jun | without 3 best | max DD | stressed avg | corr with A2 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| MH1 hold 1 hour | 168 | +0.017 | +2.82 | 48% | 17% | 77 trades, +0.094R, +7.21 | 91 trades, -0.048R, -4.39 | -6.06 | 9.19R | -0.055 | -0.01 |
| MH2 hold 2 hours | 146 | -0.016 | -2.32 | 42% | 29% | 65, +0.093R, +6.05 | 81, -0.103R, -8.37 | -15.16 | 12.53R | -0.099 | +0.05 |
| MH3 hold to 21:00 | 114 | +0.124 | +14.18 | 45% | 45% | 49, +0.404R, +19.81 | 65, -0.087R, -5.64 | -3.98 | 9.91R | -0.046 | +0.02 |
By month, net R: MH1 +3.8 -0.5 +3.8 | -1.8 -5.2 +2.6. MH2 +2.9 +0.5 +2.7 | -4.9 -4.3 +0.9. MH3 +2.4 +2.9 +14.5 | -0.9 -6.9 +2.1.
| line | MH1 | MH2 | MH3 |
|---|---|---|---|
| K1 average >= +0.10R, all history | FAIL | FAIL | PASS (+0.124) |
| K2 UNSEEN months >= +0.05R | FAIL (-0.048) | FAIL (-0.103) | FAIL (-0.087) |
| K3 positive without 3 best trades | FAIL | FAIL | FAIL |
| K4 max DD <= 8R | FAIL | FAIL | FAIL |
| K5 stressed >= +0.05R | FAIL | FAIL | FAIL |
| K6 sample 100 / 40 unseen | PASS | PASS | PASS |
| K7 correlation with A2 <= +0.30 | PASS | PASS | PASS |
VERDICT: all three KILLED. No paper line. Second setups tried: 12, none alive.

## Expectation against the run
"Study months near +0.05 to +0.10R": MH1 +0.094R, MH2 +0.093R - yes; MH3 +0.404R - far above my guess, and I had called it the worst. "Unseen months
near zero": -0.05R to -0.10R: a little worse than zero. "Killed on K2, probably K1": K2 for all three; MH3 passes K1 on the strength of March alone.

## What this test answered - and this time it could
- The sample was there: 168 signals, 91 to 65 trades in months the study never saw. The answer is clear: what the study found in January-March
  (+0.09R to +0.40R a trade) is NOT there in April-June (-0.05R to -0.10R). The observation was true of the months I looked at and of nothing else.
- MH3 is the lesson in one row: +14.18R on all history, K1 passed, +14.5R of it in March - the month of the dollar's biggest afternoons - and
  -5.64R in the 65 trades since. Without three trades it is negative; at a slightly wider spread it is negative. Had I studied all six months and
  tested on the same six, I would be writing "+0.12R a trade, 114 trades, independent of A2" and asking for a paper tag. Keeping April-June unseen
  is the only reason I know better. That is the method I keep for every second-setup try from now on: study on one part, judge on the other.
- "Big follows big" stays true as a description (movement clusters; the quiet-before-the-storm picture is wrong). It does not give a side.
  Knowing that the next hour will be large is not knowing which way.
- Independence is cheap: all three are uncorrelated with A2 (-0.01 to +0.05). A coin is also uncorrelated with A2.
- On the coach's aim: 12 second setups, none alive. What they have in common: each was a pattern I SAW first and then measured. The one rule that
  works, A2, was not seen on a chart either; it came out of a plain comparison of closes and survived five months forward. If there is a second
  one, I expect it to look as dull as that - and to need an unseen period to prove itself, as this one did not.
Counts: ideas 88, variants 247 (MH1, MH2, MH3). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today).

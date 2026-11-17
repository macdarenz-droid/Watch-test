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

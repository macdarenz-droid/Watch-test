# Exit / management on A2, loss side: tighten the stop after the first hour. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RESULT
Clock Fri 2015-05-08 01:00 London (end of released data). All lived history 01-06 .. 05-07 (explicit end 2015-05-08); costs on; London time.
Coach, 05-07: "6 kills on filters in a row - next one, try an exit or trade-management idea on A2 rather than another entry filter."

## Why this one (and what I said a week ago)
On 05-01 I wrote that the exit side was closed at 29 definitions and that I would rather say so than invent a 30th. The coach asks for one more, so I looked for the
part of the exit I have honestly not tested instead of renaming an old one:
- Winner side: target, trail, partial, break-even, add, late lock, bank at 11:00 - all tested, all cost money. Closed.
- Loss side: wider stops, tighter stop from the START (30 pips = more leverage), stop on a candle close, structural stops, a 09:00 exit on the trade's P&L - tested.
  A loss-CUT late in the morning was dropped on 04-30 for lack of sample (7-9 trades are 20+ pips under water AT 10:00 or 11:00).
- Not tested: the same size and the same 40 pip stop for the first hour, and then a TIGHTER stop for the rest of the morning - a stop that decays with time.
  The idea: in the first hour the market needs room (my winners take their heat early - first-hour study, 04-09); after that, a trade that still goes 20-25 pips
  against my entry is more likely to be a loser than a winner having a wobble, and the last 15-20 pips to the full stop are money I can keep.
  It aims at the one number that got worse live: the average loss (-0.71R live against -0.46R in the backtest months).

## Sample, counted before writing the test (states only: how often price trades that far against the entry after the given hour, with the trade still open; no outcomes)
88 A2 trades. Still open at 09:00: 86; from then to noon price goes 20+ pips against the entry on 35 of them, 25+ pips on 30. Open at 10:00: 78; 20+ pips against on 23, 25+ on 20.
So a stop tightened at 09:00 touches 30-35 trades - enough to read. One tightened at 10:00 touches 20-23 - thinner, and I say so.

## Hypothesis
After the first hour, trades that go 20-25 pips against my entry mostly go on to lose; cutting them there lowers the average loss by more than it costs in winners
that would have recovered, so net R rises - in the backtest months and in the live months.

## Variants (145, 146, 147; ideas -> 54), no others afterwards. Entry, size and the first hour exactly A2 (40 pip stop from the bid at 08:00); 12:00 exit as A2.
- TD1: at 09:00 London the stop is moved to 25 pips from my entry (if price is already beyond that, the trade is closed at the 09:00 open).
- TD2: at 09:00 the stop is moved to 20 pips from my entry.
- TD3: at 10:00 the stop is moved to 20 pips from my entry.

## KILL TEST (explicit). Same-trade comparison per day, engine, full costs. The build can only kill; a survivor gets a forward PAPER tag (100 forward trades,
at least +0.10R per trade better than A2 at two standard errors) - never a live change from a backtest.
A variant survives only if ALL:
  K1. net R over all history higher than A2's by at least 1.0R;
  K2. ahead of A2 in the backtest months (to 02-27) AND in the live months (from 03-02), each separately;
  K3. on the days it changes, at least as many are improved as worsened, and no single day makes more than half of the total gain;
  K4. maximum drawdown and the worst 10 trades in a row not worse than A2's;
  K5. its average losing trade is at least 0.05R smaller than A2's (that is what it is for).
My guess, written now: it does what it says to the average loss (K5 passes) and pays for it with recoverers: the mornings that dip 20-30 pips after 09:00 and still
finish up (04-28 went -12 at 09:3x; 05-05 went -25.3 at 09:3x and made +0.85R - TD1 and TD2 would have cut that one at a loss). Net within +-1.5R of A2; K1 fails;
TD2 the worst of the three. No survivor.

# RESULTS (kill test above pushed in commit c415271 before any code; one run: `python bt/ab_lock.py TD1,TD2,TD3 2015-05-08 none`; figures copied from its output)
88 A2 days 01-06..05-07, engine, full costs, per day.

## Mechanics checked on two days I walked by hand, before the totals
- 05-05 (buy 1.10916): worst price after 09:00 is -25.3 pips at 09:30. TD1 (stop 25 pips = 1.10666) is hit by 0.3 of a pip: -0.63R. TD2 (1.10716) is hit at 09:20: -0.50R.
  TD3 (20 pips from 10:00; worst after 10:00 is -9.3) is not hit: +0.87R like A2. Engine = my walk.
- 04-23 (sell 1.06859, a full stop for A2): TD1 out at 1.07110 (-0.63R), TD2 at 1.07060 (-0.50R); TD3's tighter stop starts at 10:00, after A2's stop was hit: -1.00R.

## Totals
| | net R | vs A2 | backtest months | live months | max DD | worst 10 | days changed | better / worse | average losing day | stop exits |
|---|---|---|---|---|---|---|---|---|---|---|
| A2 | +36.98 | - | +19.56 | +17.42 | 3.28R | -1.70R | - | - | -0.607R (32 days) | 14 |
| TD1: 25 pips from 09:00 | +33.10 | -3.88 | -3.72 | -0.16 | 3.17R | -1.29R | 29 | 12 (+4.19R) / 17 (-8.05R) | -0.616R (36 days) | 32 |
| TD2: 20 pips from 09:00 | +32.78 | -4.20 | -3.68 | -0.52 | 2.70R | -1.80R | 33 | 13 (+5.06R) / 20 (-9.28R) | -0.533R (40 days) | 37 |
| TD3: 20 pips from 10:00 | +32.30 | -4.68 | -3.94 | -0.74 | 3.58R | -1.74R | 22 | 6 (+2.07R) / 16 (-6.77R) | -0.643R (36 days) | 33 |

## Kill lines applied
| line | TD1 | TD2 | TD3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | FAIL (-3.88) | FAIL (-4.20) | FAIL (-4.68) |
| K2 ahead in both periods | FAIL (behind in both) | FAIL | FAIL |
| K3 improved >= worsened, no day > half the gain | FAIL (12 / 17, no gain) | FAIL (13 / 20) | FAIL (6 / 16) |
| K4 max DD and worst 10 not worse | PASS | FAIL (worst 10 -1.80) | FAIL |
| K5 average losing day at least 0.05R smaller | FAIL (-0.616 vs -0.607: LARGER) | PASS (-0.533) | FAIL (-0.643) |
VERDICT: NO SURVIVOR. Idea closed, no tag. The exit stays "40 pip stop, whole position, out 12:00 London".

## My guess against what happened
"K5 passes": only for TD2; for TD1 and TD3 the average loss got BIGGER. "Net within +-1.5R of A2": it is 3.9R to 4.7R behind - much worse than I thought.

## What I learned
- The surprise is in the list of changed days. The tightened stop did save about 0.37R on each full stop it caught (01-19, 03-02, 03-27, 04-07, 04-08, 04-20, 04-23, 04-24...).
  But more often it took a trade that A2 closed at noon for a SMALL loss or a scratch (-0.02, -0.16, -0.24, -0.25, -0.32, -0.34...) and turned it into a fixed -0.63R -
  and a few times it cut a winner (05-05 +0.87R, 01-20, 03-17).
- So the noon exit is already my loss-cutter. Most of my losing mornings are not full stops; they are trades that wander 20-30 pips against me and are closed at
  noon at -0.2R to -0.5R. A tighter stop does not shorten those losses, it lengthens them. That is why the average losing day did not improve (TD1: -0.616R on 36
  losing days against -0.607R on 32).
- The live "-0.71R average loss" that I wanted to fix is made of more full stops (22% of live trades), not of slow losers - and a full stop is saved by 0.37R at
  most by this rule, at the price of everything above.
- Exit and management side: 32 definitions now. Loss side and winner side both say the same thing: the 40 pip stop and the noon clock are each doing a job that
  every refinement undoes. I said on 05-01 I had nothing left here; this was the one corner I had not looked into, and it is closed too.
Counts: ideas 54, variants 147.

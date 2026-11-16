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

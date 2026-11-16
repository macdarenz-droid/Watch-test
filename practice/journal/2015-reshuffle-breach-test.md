# Reshuffle test: how often does each risk size breach vs pass in 2 months? KILL TEST LINES WRITTEN FIRST (nothing has been run)
Clock Fri 2015-03-27 00:00 UTC (end of released data). Coach's instructions: goal stays 1-2 months; do not pick risk off 4-8 start weeks; keep 0.5% until the forward test's
22 remaining trades are done (21 now); then let THIS test decide; write the kill test explicitly before running.

## My trade list as it stands (sim/trades.csv, 53 live trades, R = result / amount risked, costs inside)
- 53 trades, 35 wins (66%), avg +0.49R.
- Worst day: -1.00R (one full stop plus slippage; the same on six days: 01-19, 01-27, 02-20, 03-02, 03-09, 03-19). In dollars the worst was -$193.64 (03-19, at 0.75%).
- Worst losing streak: 3 trades in a row, -1.82R (02-18 to 02-20). Worst peak-to-valley drawdown: the same 1.82R.
- What the limits mean against that: at 1.00% risk my worst day is -1.0% of a 5% daily limit, and my worst streak is -1.8% of a 10% max. The list itself is far from both.
  That is exactly why a reshuffle is needed: the question is how bad an UNLUCKY ORDER of the same trades can get, and how bad it gets if the edge is not there.

## What will be run (bt/reshuffle_breach.py), 1,000 reshuffled orders per cell, fixed seed, sizes 0.50% / 0.75% / 1.00% in both phases
- A reshuffle = my own trades in a random order, one per trading day, 42 trading days (2 months). Full two-phase challenge: +8% then +5% (balance resets), minimum 5 trading days
  per phase, my brakes on (-4% -> 0.5% until a new phase high; -6% -> I stop).
- Counted per size: PASSED both phases within 42 days; BREACHED the 5% daily limit (a single day's loss >= 5%); BREACHED the 10% max (phase balance <= -10%); stopped by my -6% brake.
  Also the same counts with the brakes switched OFF, so the raw breach risk is visible.
- Three lists, because the full list flatters the rule:
  L1 "full": all 53 live trades, shuffled without replacement (first 42 of each order).
  L2 "forward only": the trades from 03-02 on (19 today), drawn with replacement.
  L3 "zero edge": the February trades shifted to average 0R, drawn with replacement. (The pessimistic picture my coach told me to trust more.)
- One built-in fact, stated before the run: with one trade a day and a hard stop, a single day cannot lose more than about 1.03 x the risk, so the 5% DAILY breach count
  must come out 0 at every size. To breach the daily limit one day would need a 5R loss at 1.00% (a 200 pip gap through my stop). The sim cannot produce that; real life could
  only on a held weekend or an event - both of which I am flat for by rule. I will report the 0 and not present it as a finding.

## KILL TEST - the explicit lines (applied to today's run as a rehearsal, and binding when the forward test completes)
A size is DEAD (cannot be used) if ANY of:
  K1. it breaches the 10% max or the 5% daily limit in even 1 of 1,000 reshuffles of L1 (brakes on);
  K2. on L3 (zero edge) it breaches in more than 5 of 1,000 (0.5%) with brakes on, or in more than 30 of 1,000 (3%) with brakes OFF;
  K3. on L3 (zero edge) my -6% brake stops it in more than 100 of 1,000 (10%) within the 42 days.
Among the sizes that are not dead, the size is CHOSEN as the SMALLEST one that passes both phases within 42 days in at least 500 of 1,000 reshuffles of L2 (forward only);
if none reaches 500, the largest size that is not dead.
Two locks around that choice, both binding:
  L-A. Nothing changes before A2's forward test is complete (40 unseen trades). If that test FAILS (average below +0.10R or drawdown above 8R), the size goes to 0 - I stop trading
       the rule for money - whatever this table says.
  L-B. When the forward test is complete I re-run this exact script on the list as it then stands, and THAT run decides. Today's run is a rehearsal: it shows where the lines
       fall now and cannot move attempt #2 off 0.5%.
What I already know and cannot un-know (so the lines are not secretly fitted): my earlier single-phase reshuffles put the zero-edge brake-stop chance near 3% (0.75%) and 8% (1.00%)
within 40 days, and the true-breach chance with brakes at 0. So I expect K3 to leave all three sizes alive and the choice to turn on the 500-of-1,000 line.
My guess for the rehearsal: 0.50% passes well under 500 of 1,000 on L2; 0.75% is near the line; 1.00% clears it. No breach anywhere with the brakes on.

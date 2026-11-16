# Funded survival test: does 0.50% survive two years? KILL TEST LINES WRITTEN FIRST (nothing has been run)
Clock Fri 2015-03-27 21:00 UTC (weekend; end of released data). The size was chosen this morning from the 42-day reshuffle numbers; this test asks the funded question, which is
a different one: not "do I reach a target in two months" but "is the account still alive after two years, and how often does my own stop end it".

## What will be run (bt/funded_sim.py): 1,000 reshuffled orders per cell, 500 trading days (about two years), one trade a day, fixed seed
- Funded rules: max loss line at -10% of the starting $25,000 (static); one trade a day (the daily 5% line cannot be reached: worst day is one stop).
- My funded brakes: half size at 3% below the high-water mark (until a new high-water); STOP at 5% below the high-water mark.
- My payout policy, every 10 trading days: half of the profit above $25,000 until the balance holds a $1,000 buffer, then everything above $26,000; no payout while a brake is on;
  the high-water mark resets after a payout.
- Sizes: 0.25%, 0.50% (chosen), 0.75%. (Sizing policies on my own trade results; no rule variant; variant count stays 56.)
- Lists (my own R results, drawn with replacement): L1 full (54 live trades), L2 forward only (20), L3 February at realistic costs (+0.18R: my planning edge), L4 zero edge, L5 -0.10R.
- Counted: account BREACHED (-10% line); trading ended by my -5% stop; survived all 500 days; median total payout requested and my 80% of it; share of calendar months (21 days) that lose money.
- Also the same with the brakes OFF, to see the raw breach risk.
One thing true by construction, stated before the run: with the brakes ON a breach is impossible in this simulation, because my stop (5% below high-water, never lower than $23,750
at the start) is always reached before the $22,500 line when losses come one stop at a time. So "breach with brakes" must read 0 everywhere; it is not a finding. What CAN take the
account in real life is a gap through a stop - which is why I am flat by noon, at weekends and over news - or me not obeying the brake.

## KILL LINES (binding on the funded size from the next trade)
0.50% is CUT to 0.25% if ANY of:
  S1. on L3 (February at realistic costs) my -5% stop ends trading in more than 100 of 1,000 two-year runs (10%);
  S2. on L1 (full) or L2 (forward) my -5% stop ends trading in more than 20 of 1,000 (2%);
  S3. with the brakes OFF, L3 breaches the -10% line in more than 10 of 1,000 (1%) - meaning the size would only be safe because of the brakes.
If 0.25% also fails S1, I do not trade the funded account until the rule's forward test is complete, and say so.
Nothing in this test can RAISE the size (0.75% is shown for comparison only).
L4 and L5 are reported as the cost of being wrong about the edge: I expect my stop to end most of those runs - that is what it is for - and I want to know after how many days.
My guess: 0.50% passes S2 and S3 easily and S1 with some room (a 5% drawdown from high-water needs roughly 14R of net losses with the half-size brake).

# RESULTS (run after commit 0536d00). 1,000 reshuffled two-year runs (500 trading days) per cell. Sizing policies on my own results; variant count stays 56.

| Trade list (drawn with replacement) | Risk | Breached the -10% line | Ended by my -5% stop | Alive after 2 years | Median payout requested over 2 years (my 80%) | Losing months | Median day my stop hit | Brakes OFF: breached |
|---|---|---|---|---|---|---|---|---|
| L1 full, 54 trades (+0.46R) | 0.25% | 0 | 0 | 1,000 | 55% of $25k ($11,080) | 2% | - | 0 |
| | 0.50% | 0 | 0 | 1,000 | 112% ($22,358) | 2% | - | 0 |
| | 0.75% | 0 | 2 | 998 | 168% ($33,528) | 2% | 221 | 0 |
| L2 forward only, 20 trades (+0.50R) | 0.25% | 0 | 0 | 1,000 | 61% ($12,122) | 1% | - | 0 |
| | 0.50% | 0 | 1 | 999 | 123% ($24,493) | 2% | 299 | 0 |
| | 0.75% | 0 | 7 | 993 | 183% ($36,549) | 2% | 173 | 0 |
| L3 February at realistic costs (+0.18R) | 0.25% | 0 | 0 | 1,000 | 22% ($4,448) | 12% | - | 0 |
| | 0.50% | 0 | 0 | 1,000 | 44% ($8,772) | 13% | - | 0 |
| | 0.75% | 0 | 6 | 994 | 64% ($12,821) | 13% | 343 | 0 |
| L4 zero edge | 0.25% | 0 | 149 | 851 | 2% ($330) | 52% | 373 | 12 |
| | 0.50% | 0 | 655 | 345 | 2% ($392) | 56% | 231 | 341 |
| | 0.75% | 0 | 907 | 93 | 2% ($399) | 57% | 156 | 635 |
| L5 -0.10R | 0.25% | 0 | 958 | 42 | 0% | 76% | 234 | 806 |
| | 0.50% | 0 | 999 | 1 | 0% | 78% | 108 | 990 |
| | 0.75% | 0 | 1,000 | 0 | 0% | 78% | 64 | 999 |
"Breached with brakes on" is 0 everywhere by construction, as stated before the run - not a finding.

## Kill lines, applied
- S1 (February-at-realistic-costs list: my -5% stop in more than 100 of 1,000): 0.50% = 0 -> PASS.
- S2 (full or forward list: my stop in more than 20 of 1,000): 0 and 1 -> PASS.
- S3 (brakes OFF, February-at-realistic-costs list: breach in more than 10 of 1,000): 0 -> PASS. With a real edge the size does not lean on the brakes at all.
=> 0.50% STAYS as the funded size. Nothing here can raise it; 0.75% is shown only for comparison (and it is the first size where my stop starts appearing on real-edge lists).

## What the table says that I need to keep in front of me
- If the edge is what February at realistic costs says (+0.18R), 0.50% keeps the account alive in 1,000 of 1,000 two-year runs, with about one losing month in eight,
  and pays out roughly $8,800 to me over two years (about $370 a month). At the blended edge it is about $22,000. Somewhere in that range is "steady monthly profit".
- If the edge is ZERO, the brakes are the account: without them 341 of 1,000 runs breach at 0.50%; with them none do, and my stop ends trading in 655 runs after a median of
  231 trading days (11 months), having cost 5%. If the edge is slightly negative the stop arrives after about 108 days (five months).
  So the honest worst case of this plan is: I lose 5% of the account over five to eleven months and stop. The account survives.
- That worst case only holds if I obey the brake the day it triggers. The brake is now the most important rule I have, above the entry rule.
- The earlier catch comes first: A2's forward test (20 of 40 trades). If the edge is zero or negative, that test should say so within the next 20 trades, months before the
  account brake would.
- Limits, as always: reshuffling assumes independent days and that 20-54 past results describe the future; real losing days cluster; a gap through a stop is not in the model.

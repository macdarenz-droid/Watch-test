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

# Phase 2 size test: reshuffle my own trade results at 0.75% - decision rule written BEFORE the run
Clock Tue 2015-03-10 00:00 UTC (end of released data). No price data and no strategy variant involved (counts stay 15 ideas / 32 variants): input is only my own live results in sim/trades.csv.

## What will be computed (bt/phase2_sim.py, 20,000 reshuffles per cell, fixed seed)
- A reshuffle = draw one trade result per day, with replacement, from a set of my own R results (R = result / amount risked, costs inside).
- Phase 2 rules: start $25,000, pass at +5% (when at least 5 trading days are logged), breach at -10% total. Daily limit cannot be hit (one trade a day, worst day = one stop).
- My own plan rules are modelled too: brake to 0.5% risk at -4% until a new phase high; stop trading at -6% ("stopped by my brake" - a failure for me even though it is not a breach).
- Sizes: 0.50%, 0.75% (current), 1.00%. Horizons: 20, 40, 60 trading days (1, 2, 3 months). Outputs: pass %, stopped-by-brake %, breach %, median trading days to pass.
- Four pictures of my edge, because I do not know which is true:
  A. all 40 live trades (Jan-Mar, +0.41R avg) - optimistic: it contains January;
  B. February only (20 trades, +0.23R) - my out-of-sample month;
  C. February shifted to ZERO average - "the rule has no edge";
  D. February shifted to -0.10R - "slightly negative", which my data cannot rule out.
- Also from where I actually stand today: phase 2 balance -0.75% after one loss.

## Decision rule - what would make me change the size (fixed now)
KEEP 0.75% unless one of these fires:
1. CUT to 0.50% if, at 0.75%, picture B (February edge) shows more than 5% chance of being stopped by my brake or breaching within 60 days;
   or picture C (zero edge) shows more than 1% chance of a true 10% breach within 60 days.
2. RAISE to 1.00% only if ALL of: (a) picture B pass chance within 40 days is at least 70% at 1.00% and at least 15 points above 0.75%; (b) picture C breach chance at 1.00% within
   60 days is at most 1% with the brakes on; (c) the A2 forward test is complete and passed (40 unseen trades averaging >= +0.10R). Today (c) is 6 of 40, so a raise is impossible now
   whatever the numbers say - I write (a) and (b) down so I know what I would need later.
3. If neither fires: no change. A long median time to pass is NOT a reason to raise size; it is a fact to plan around.
Not allowed as reasons: today's loss, the feeling that $188 stings, or wanting to be done sooner.
Nothing above has been run.

# Idea LF: my half-size / full-size ladder against flat sizing - drawdown, recovery time, and what each costs. PRE-REGISTERED BEFORE ANY CODE
Clock Tue 2015-07-07 01:00 London (end of released data). After funded day 72 (half size day 1). Coach 07-06: "position sizing math. test on your history
how your half-size/full-size ladder affects drawdown and recovery time vs flat sizing, pre-registered, max 3 variants."
July goal: a worked case before every pushed number or rule; every file write read back.

## What is already known (so this adds, not repeats)
- SZ (05-05): restoring full size earlier, or dropping the half step, fails: the step cut my own-stop odds from 49% to 15% at the planning edge (then with a 5% stop).
- WS / GD / SG / ST: the 7% stop; the guard caps a dead edge at about -5%; 0.50% beats 0.75% and 1.00%; no breach from today's state.
NOT measured before: RECOVERY - how long the ladder keeps me under water compared with flat sizing, from a fresh start and from where I stand
today (half size on, $832 under the high-water), and what the ladder costs in payouts.

## The three policies (variants; everything else identical: A2's trade list, real-fill extras, the 7% stop, the payout rule, the firm's lines)
- LF1 THE LADDER (live rule): 0.50%; half size (0.25%) from a close 3% under the high-water until a new high-water.
- LF2 FLAT FULL: 0.50% always (no half step).
- LF3 FLAT HALF: 0.25% always.
Method: the machinery of bt/sizing_growth.py with the half step as a switch. 2,000 runs x 500 trading days, plain and 5-day-block draws, true edges
+0.18R (planning), +0.10R, 0.00R. Two starting states: FRESH (balance 0%, high-water 0%) and NOW (balance -2.302% = $24,424.59, high-water +1.028% = $25,256.94).
Measured: my own 7% stop reached (%); breach (%); median maximum drawdown (% of $25,000, from the high-water); median longest stretch under water
(days); my median payout; and from NOW: the share of runs that make a NEW HIGH-WATER within 60 / 120 / 250 days and the median day of it.

## Worked cases (arithmetic, before any run)
From NOW the high-water is $832.35 away and my stop line $935.64 away.
- LADDER / FLAT HALF: $62.50 a trade -> 13.3R up to the high-water, 15.0R down to the stop. At +0.18R a trade the drift alone needs about 74 trades.
- FLAT FULL: $125 a trade -> 6.7R up, 7.5R down. Drift alone: about 37 trades. Twice as fast up - and twice as fast down.
So I expect: recovery within 250 days at +0.18R: flat full clearly more often than the ladder in the EARLY months (60 and 120 days), and the stop
reached about twice as often. With a standard deviation of about 1.05R a trade, 13R of net progress in 250 trades (drift 45R +- 17R) is very likely
if the edge is +0.18R; 6.7R in 60 trades (drift 11R +- 8R) is only likely for flat full.

## Lines the LADDER (the live rule) must pass to stay justified - one failure and I put the question to the coach (no live change by me)
- K1 protection: at 0.00R and at +0.10R, from both states, the ladder reaches my own stop at least 5 percentage points LESS often than flat full.
- K2 depth: the ladder's median maximum drawdown is smaller than flat full's at every edge (FRESH state).
- K3 price: at +0.18R from FRESH, my median payout under the ladder is at least 80% of flat full's.
- K4 recovery: from NOW at +0.18R, the ladder makes a new high-water within 250 days in at least 60% as many runs as flat full does.
- K5 against flat half: at +0.18R from FRESH the ladder pays at least 25% more than flat half (otherwise permanent half size would be the simpler rule),
  and at 0.00R it does not reach the stop more than 10 points more often than flat half.
MECHANICS REGRESSION: with the half step ON at 0.50% the new script must reproduce `python bt/sizing_growth.py 2015-07-07 0.090 1.122 0.50 0.18`
(own stop, breach, lowest balance, payout) exactly.
Worked expectation: K1 pass (flat full reaches the stop far more often when the edge is small). K2 pass. K3: pass, near 85-90%. K4: pass (ladder
about 75-85% of flat full's 250-day recovery). K5: pass. The ladder stays. The numbers I do not know and want: the recovery clock from NOW.
Counts when run: idea 98, variants 274-276.

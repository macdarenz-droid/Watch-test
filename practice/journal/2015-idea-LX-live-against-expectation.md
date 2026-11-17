# Idea LX: are my live funded results inside the normal range of what the backtest said to expect? THE CHECK AND THE WORRY LINES, WRITTEN BEFORE THE NUMBERS ARE COMPUTED
Clock Fri 2015-06-26 01:00 London (end of released data). After funded day 65. Coach 06-25: "compare your live funded results for your main setup (R per
trade, win rate, trade count) with what your backtest said to expect. is live inside the normal range? write the check and what would make you worried."
June goal: every number and every test rule gets one worked case before it is pushed.

## What is compared with what (fixed now)
- LIVE: my 65 funded trades as traded (03-27 .. 06-25), R from my journal rows: 31 wins, +2.47R (tool), so about +0.04R a trade and 48% wins.
- EXPECTATION A, "what the backtest said": the engine's A2 trades BEFORE funding (01-06 .. 03-26, 58 days). That is the record I had when the account started.
- EXPECTATION B, "what I planned with": the same list shifted so that its average is +0.18R - the planning edge written in the plan since March
  (the backtest marked down for costs and for being the place where the rule was found).
- EXPECTATION Z: the same list shifted to an average of 0.00R - a rule with no edge. Not an expectation; the thing I must be able to tell apart from live.
Method: 20,000 random draws of 65 trades (with replacement) from each list; where do my live figures fall? "Inside the normal range" = between the
2.5th and the 97.5th percentile of the draws. Three figures: average R per trade, win rate, share of full stops (R at or under -0.95).
Trade count: one trade every weekday is the rule; expected 65 for 65 weekdays with a London morning; checked against the engine's day list.

## Reading lines, written before the run
- L1: live inside the 95% range of A (the raw backtest) on average R and on win rate? If NOT: I say plainly that live is OUTSIDE what the backtest said
  to expect, and that the backtest overstated the rule. No softening.
- L2: live inside the 95% range of B (the planning edge)? If not: the plan's own number is wrong and the size test (SG) has to be read at a lower edge.
- L3: can live be told apart from Z (no edge)? If live sits inside Z's 95% range, I say so: 65 trades do not show that the rule works.
- L4: trade count 65 of 65.
Worked case by arithmetic (one A2 trade has a standard deviation of about 1.1R): the average of 65 trades is known to about 1.1 / sqrt(65) = 0.14R,
so a 95% range is about +-0.27R around the list's mean. A: the 58 pre-funding days average about +0.53R (seen in the PZ print) -> range about +0.26R
to +0.80R -> my +0.04R is OUTSIDE (L1 fails). B: +0.18R -> about -0.09R to +0.45R -> INSIDE (L2 holds). Z: 0.00R -> about -0.27R to +0.27R -> INSIDE
(L3: cannot be told apart). That is my expectation of the result; the tool will give the exact percentiles.

## WHAT WOULD MAKE ME WORRIED (written now; the numbers marked [tool] are filled from the same run and then frozen)
Worry is not a rule change. A worry line that is crossed means: I write it up the same day, tell the coach, and we decide; trading goes on by the
plan, and the money is protected by the size rule (half size at 3%, stop at 7%) whatever the cause.
- W1 the average: my LIVED average (all lived trades from 03-02, as traded) falls below the 2.5th percentile of what a +0.18R rule gives for that number
  of trades: [tool: thresholds for 100, 150, 200 trades]. Today: +0.16R at 84 trades.
- W2 the win rate: lived win rate below the 2.5th percentile of B for that number of trades [tool]. Today 54% (45 of 84).
- W3 the stops: lived share of full stops above the 97.5th percentile of B [tool]. Today 32% (27 of 84).
- W4 the drawdown: deeper than 8.55R (the 95th percentile written on 06-24), or a losing run of 8 or more.
- W5 the costs: my fills worse than the engine's by more than 0.15R a trade over the last 40 trades (today -0.08R over 84).
- W6 me: any trade mistake (a skipped day, a moved stop, a wrong size, a close before 12:00 by choice). One is enough to stop and write.
NOT a worry: a losing week or month, five or six losses in a row, a drawdown inside the written range, a month below zero. Those are in the range by construction.
Counts when run: idea 90, variants 251-252 (two expectation lists; the zero list is a reference).

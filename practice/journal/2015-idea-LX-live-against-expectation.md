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

## RESULTS (lines pushed first in commit 6944e6e; one run: `python bt/live_vs_expect.py 2015-06-26`; 20,000 draws of 65; figures copied from the print)
LIVE funded, as traded: 65 trades (03-27 .. 06-25), net +2.51R from the journal rows (the tool's unrounded total is +2.47R), average +0.039R,
31 wins (47.7%), 24 full stops (36.9%), standard deviation 1.03R.
Pre-funding backtest list (A): 58 trades, average +0.531R, 67.2% wins, 10.3% full stops, standard deviation 1.05R.
| against | average R: 95% range, live percentile | win rate: 95% range, live percentile | full stops: 95% range, live percentile |
|---|---|---|---|
| A, the raw pre-funding backtest | +0.288 .. +0.785R; live +0.039R at 0.0 -> OUTSIDE | 55.4% .. 78.5%; live 47.7% at 0.1 -> OUTSIDE | 3.1% .. 18.5%; live 36.9% at 100.0 -> OUTSIDE |
| B, the planning edge +0.18R | -0.066 .. +0.440R; at 13.6 -> INSIDE | 35.4% .. 60.0%; at 51.1 -> INSIDE | 3.1% .. 18.5%; at 100.0 -> OUTSIDE |
| Z, zero edge | -0.251 .. +0.259R; at 62.9 -> INSIDE | 32.3% .. 56.9%; at 72.5 -> INSIDE | 9.2% .. 26.2%; at 100.0 -> OUTSIDE |
| line | reading |
|---|---|
| L1 inside the raw backtest's range? | NO, on all three figures. Not one draw in 20,000 from the pre-funding record averaged as little as my funded trades. |
| L2 inside the planning edge's range? | YES on average R and win rate (13th and 51st percentile). NO on full stops. |
| L3 told apart from no edge? | NO. My 65 funded trades sit in the middle of what a rule with zero edge produces (63rd percentile). |
| L4 trade count | 65 engine days, 65 journal trades, none missing, none extra. |
My worked case said: A outside, B inside, Z not told apart. All three as worked. What I did NOT work beforehand: the full-stop share, which is outside all three lists.

## The answer to the coach, plainly
- Is live inside the normal range of what the backtest said? NO. January to March said +0.53R a trade with two wins in three and one full stop in
  ten. Funded live is +0.04R with fewer than half winning and more than one full stop in three. That is not bad luck inside the backtest's range;
  the backtest described a better rule than the one I have traded since 03-27. I found the rule on part of those months; that is the simplest reason.
- Is live inside what I PLANNED with? Yes for the average and the win rate: +0.04R is the 14th percentile of a +0.18R rule - low, not alarming.
- Can I show from the funded account that the rule works? No. 65 trades cannot tell +0.18R from zero; the coach wrote that on 06-02 and this is
  the same statement with my own numbers in it. (The whole lived record from 03-02 is +0.16R on 84 trades, also inside both.)
- The one thing that fits NO version of the backtest is the shape of my losses: 37% full stops against 10%. I first wrote this down on 04-28
  ("the direction call fails harder, not more often") and the plan has carried "one trade in three is a full stop" since; my sizing sims use the
  real loss side. It is known. It is still the single largest difference between what I tested and what I trade, and I should say it every time.

## WORRY LINES, now with their numbers (frozen today; W = write it up the same day and tell the coach; never a rule change by itself)
| lived trades | W1 lived average below | W2 lived win rate below | (for scale: zero edge would average above this only 2.5% of the time) |
|---|---|---|---|
| 84 (today: +0.16R, 54%) | -0.037R | 38.1% | +0.225R |
| 100 | -0.019R | 39.0% | +0.205R |
| 150 | +0.015R | 40.0% | +0.169R |
| 200 | +0.038R | 41.5% | +0.147R |
| 300 | +0.065R | 42.7% | +0.118R |
- W1 and W2: not crossed (lived +0.16R and 54% at 84 trades).
- W3 (full stops above the 97.5th percentile of list B: 16.7% at 84 trades): CROSSED TODAY, at 32% - and by this line it has been crossed since
  April. As written: I report it to the coach now. My own reading: the line was drawn from a list that has almost no full stops, so it measures
  "live is unlike the backtest's loss side", which is true and already in the plan, rather than "something new is going wrong". I do NOT redraw it
  myself after seeing the result. Question to the coach: keep W3 as a standing known difference, or replace it with a line from the lived record
  (for example: full stops above 45% over the last 40 trades)?
- W4 drawdown beyond 8.55R or a losing run of 8: not crossed (4.11R, 5 in a row). W5 fills worse than the engine by more than 0.15R a trade: not crossed (-0.08R).
- W6 a trade mistake: none in 65.
- The last column is the other side of the same table: to be able to say "this is not zero" I need the lived average above about +0.15R at 200
  trades or +0.12R at 300. Today's +0.16R at 84 trades is not there. That is about five more months of trading the plan unchanged.
Counts: ideas 90, variants 252 (two expectation lists). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today).

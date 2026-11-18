# Drawdown-goal test (flagged after the dead-Asia filter) - written before any run
Clock Thu 2015-03-12 00:00 UTC (end of released data). Jan-Feb only (END <= 2015-03-01); March is not used.

## The question
Three filters (F1, W1, Q) ended the same way: fewer trades, about the same total, smaller drawdown. I judged them on profit and killed them. Different goal now, stated up front:
"Does any filter give a genuinely smoother ride - more profit per unit of drawdown - than A2?" A smoother ride would matter because drawdown, not profit, is what limits my size.

## The trap I can already see
A rule that takes fewer trades has a smaller drawdown automatically. Skip 10 trades at RANDOM and the worst losing run also shrinks. So "drawdown fell" proves nothing by itself.
The fair question: is the filter's profit-to-drawdown better than what RANDOMLY skipping the same number of trades would give?

## Variants (max 3). No new rule definitions: these are existing variants scored on a new goal. I count them again as 3 extra looks (variants 36, 37, 38; ideas -> 17), because every
re-scoring of the same two months is another chance to fool myself.
- DD1 = Q3 (skip when the Asia range is under 0.8 x its 5-day average)
- DD2 = Q1 (skip when the Asia range is under 20 pips)
- DD3 = F1 (5-day efficiency >= 0.5 -> trade every day; else no-chase 0.6)
(W1 "no Friday" is left out: it already has its own forward test.)

## Measure
Score = net R divided by max drawdown in R, on the trade sequence in date order, Jan+Feb together, on the days the variant can be computed (A2 scored on the same days).
Random benchmark: 10,000 random filters that skip the SAME NUMBER of A2 trades on those days; each gets the same score. Fixed seed.

## Kill test (fixed now)
Gate 1 - Jan-Feb, decides whether it is even worth carrying forward. A variant survives only if ALL:
  (a) its score beats the 90th percentile of the 10,000 random filters with the same number of skips;
  (b) its net R is at least 85% of A2's net R on the same days (a smooth ride that gives up the profit is no use);
  (c) (a) still holds when January's biggest day (01-23) is removed from both.
  Not surviving = closed for good as a drawdown tool.
Gate 2 - forward only, for survivors: paper-tag on unseen days. After 40 unseen A2 signal days, adopt only if: max drawdown of the kept trades <= 70% of A2's on the same days;
  net R >= 85% of A2's; at least 50% of trades kept. Only then would I ask whether a bigger size is justified, as a separate pre-registered question.
What I already know (so nobody is fooled, including me): I have seen each variant's Jan and Feb drawdown and net R - line (b) is a formality. What I have NOT seen is the random benchmark;
(a) and (c) are the real test. Both months are contaminated; that is why even a pass only earns a paper tag.
My guess: at most one clears the random benchmark; most of the "smoothness" is just having fewer trades.
Nothing above has been run.

# RESULTS (run after commit c07c8fe). 3 re-scored variants (counted as 36, 37, 38; ideas 17). Costs on, $125 risk. Jan+Feb in date order (bt/dd_goal.py); March not used.
Score = net R / max drawdown. Random benchmark = 10,000 filters skipping the same number of A2 trades at random.

| Variant | Days | A2: trades / net R / max DD / score | Filter: trades (skipped) / net R / max DD / score | Net R vs A2 | Random filters: median / 90th pct score | Filter beats | Same without 01-23 |
|---|---|---|---|---|---|---|---|
| DD1 = Q3 (Asia < 0.8 x 5-day avg) | from 01-13 | 34 / +14.53 / 1.86R / 7.8 | 19 (15) / +15.48 / 0.65R / 23.6 | 107% | 5.6 / 11.5 | 99% of random | 98% |
| DD2 = Q1 (Asia < 20 pips) | all | 39 / +19.43 / 1.86R / 10.5 | 30 (9) / +19.68 / 1.33R / 14.8 | 101% | 9.0 / 13.8 | 93% of random | 92% |
| DD3 = F1 (efficiency + no-chase) | from 01-12 | 35 / +15.87 / 1.86R / 8.5 | 25 (10) / +15.42 / 1.50R / 10.3 | 97% | 7.1 / 12.0 | 82% of random | 83% |
(The trap was real: random skipping alone cuts the median score only a little, but its 90th percentile is 12-14 - a filter needs to beat THAT, not A2's 8-10.)

## Gate 1, line by line
- DD1 (Q3): beats the 90th percentile (99%), keeps the profit (107%), still beats it without 01-23 (98%) -> SURVIVES.
- DD2 (Q1): beats it narrowly (93%; 92% without 01-23), keeps the profit (101%) -> SURVIVES, barely.
- DD3 (F1): 82% -> FAILS. F1's smoothness is no more than fewer trades would give by luck. Closed as a drawdown tool (its old profit tag keeps running until its own 40 days).

## How much to believe it
- Two of three "survived", and both are the same idea (a dead Asia night) in two spellings. That idea was found by looking at these very trades, and this is my third pass over them.
  Beating 99% of random on data that chose the rule is what a chosen rule does. It earns a paper tag and nothing else, exactly as written.
- What it suggests, if it is real: the trades after a dead night are not losers on average, but they are where the losing RUNS sit (01-19, 02-18, 02-19, 02-20, 02-27).

## Gate 2 - forward paper tags start now (Q3 and Q1), and the first eight unseen days are already known mechanically
| Day | Asia range | 5-day avg | Q3 tag | Q1 tag | A2 result |
|---|---|---|---|---|---|
| 03-02 | 22.7 | 20.3 | trade | trade | -1.00R |
| 03-03 | 24.6 | 17.9 | trade | trade | +1.12R |
| 03-04 | 21.6 | 19.0 | trade | trade | +1.17R |
| 03-05 | 55.6 | 20.3 | trade | trade | +0.02R |
| 03-06 | 17.7 | 28.3 | SKIP | SKIP | +2.12R |
| 03-09 | 23.3 | 28.4 | trade | trade | -1.01R |
| 03-10 | 51.9 | 28.6 | trade | trade | +1.73R |
| 03-11 | 51.4 | 34.0 | trade | trade | +1.93R |
First forward evidence goes AGAINST it: the one day both tags skip is my best forward day (+2.12R); both losers are kept. Forward so far: A2 +6.09R, max DD 1.01R; Q3 = Q1 = +3.97R (65% of A2),
max DD 1.01R (100% of A2). Needs <= 70% of A2's drawdown and >= 85% of its net R after 40 days. Eight days decide nothing, but this is what out-of-sample looks like next to in-sample.
A2 keeps trading every day for real; nothing changes.

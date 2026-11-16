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

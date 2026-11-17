# Idea BS2: do A2's buys do worse than its sells? (idea 113; coach 07-27: test the 9-of-10-buys lean, prereg first)
Written Mon 2015-07-27 22:00 London, before any code.

## Where the lean comes from (already seen, so it cannot be the test)
Replay 07-24: 9 of my 10 "worst" funded trades were buys. Checked the same day on all 73 funded trades (03-27..07-07): buys 35 trades
-2.81R (16 full stops), sells 38 trades +1.33R (12 full stops). A difference of about 0.12R a trade. The "10 worst" order was pennies.

## Hypothesis
A2's buys earn less than its sells by more than chance.
What I hold against it before testing: I have no market reason why the SIDE should matter. If it shows, the likelier story is the big
picture (EURUSD fell from January to mid-March, so sells sat with the larger move), which is a regime, not a property of buying.

## Sample: only A2 engine trades OUTSIDE the 73 funded ones
Part P (before funding): 01-06..03-26. Part Q (paper days after the alarm): 07-08..07-27. I may have seen by-side tables for January-
March months ago; I do not remember any, and say so.

## Measures (two, no more)
BS2a (judged): mean R of sells minus mean R of buys on P and Q together; one-sided shuffle of the side labels, 10,000 times.
BS2b: full-stop rate of buys minus full-stop rate of sells, same shuffle.
Cases first: buys and sells in P and in Q. Under 15 buys or 15 sells in all -> not judgeable -> lean dismissed.
Power, written first: about 70 trades, spread about 1.2R -> the difference has an error of about 0.3R. Only a difference of 0.5R or
more can reach p < 0.05. The funded lean was 0.12R. So unless the unseen part is much more lopsided, this test will say "no".
That is the honest prior: a 0.12R lean on 73 trades is ordinary noise.

## Kill lines
K1 sells minus buys above zero with p < 0.05 on P+Q. K2 the same sign in January-February and in March (01-06..02-27 / 03-02..03-26),
so that it is not one month. K3 the same sign in Q (14 paper days: reported, too few to judge alone).
Any of K1, K2 fails -> the lean is DISMISSED and I stop looking at sides. All pass -> a paper tag at most (count buys and sells apart);
never "sells only": that would be a bet on the direction of the euro, not a rule.
My guess: sells better in January-February by a lot (the fall), not in March or Q; K2 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/buys_sells.py 2015-07-28 count` (no outcomes).
- P (01-06..03-26): 58 trades, 22 buys, 36 sells. Q (07-08..07-27): 14 trades, 5 buys, 9 sells. P+Q: 72 trades, 27 buys, 45 sells. Judgeable.
- Worked check: the engine's list for the funded span has 35 buys and 38 sells, the same as my own trade list of 73 funded trades.

## Result (one run)

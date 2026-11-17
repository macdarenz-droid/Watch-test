# Idea FD: can a forward re-test let LM2 earn the probation slot, and how long must it be? (idea 119; coach 08-04)
Written Tue 2015-08-04 evening (clock still Tue 08-04 22:00 London), before any code.

## The honest starting point
Coach: pick the idea with the best case on unseen days and "test it so it can earn the probation slot". That idea is LM2 (fade a lively
pre-bell hour): +0.203R on 35 mornings to 05-06, +0.186R on 38 unseen mornings 05-07..07-24, stressed +0.144R, the chase -0.22R and
-0.21R. But I cannot backtest it again: every lived day up to 07-24 has been used on it, and it FAILED two of its own lines there
(three trades carried it; drawdown 5.40R). Since then there are 7 days with 3 lively mornings, and I know A2's results on them.
Running LM2 again on old days with easier lines would be moving the goalposts. So the slot can only be earned FORWARD, on mornings
from 08-05 on. What I can test today, on data I already have, is the DESIGN of that forward test: how many mornings, which lines,
and whether such a test can tell a real +0.19R from nothing at all. If it cannot, I should know before spending weeks on it.

## Forward kill lines to be examined (the same family LM2 was judged on, written before the run)
On the next N lively mornings from 08-05 (rule frozen as in bt/lively_fade_oos.py):
F1 average >= +0.10R after costs. F2 net above zero without its best two trades. F3 max drawdown <= 5R. F4 the fade's average above
the chase's on the same mornings. PASS = all four.

## Method (fixed now)
Pool: LM2's 73 lived trades (35 + 38), each a pair (fade R, chase R), resampled by morning with replacement, 20,000 runs per case.
Three worlds: REAL = the pool as it is (fade about +0.19R). COIN = fade shifted to mean 0.00R and chase shifted to mean 0.00R.
LOSER = fade shifted to -0.10R, chase to +0.05R.
Three designs, no more: N = 20, 30, 40 mornings.

## Kill line for the DESIGN (written first)
A design is usable only if it passes a COIN in at most 15% of runs AND passes the REAL pool in at least 50%. I take the smallest
usable N. If none is usable, the answer is "no forward test of 40 mornings or fewer can earn the slot honestly", and I report the
best trade-off to my coach instead of running a test that cannot decide.
My guess: N = 20 lets a coin through too often (about 25%); N = 40 is usable.
Worked case first: the pool must be 73 trades with the two sample means I already published (+0.204R on 35 by this script, +0.186R on 38).

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

## Facts and worked case (tool `python bt/forward_design.py 2015-08-05 facts`, before the runs)
Pool: 73 lively mornings 01-19..07-24. To 05-06: 35, fade +0.204R, chase -0.224R. 05-07..07-24: 38, fade +0.186R, chase -0.213R.
The published figures. All 73: fade +0.195R (spread 1.08R), chase -0.218R.

## Result (one run)
Tool: `python bt/forward_design.py 2015-08-05 test` (20,000 runs per cell). PASS = F1 and F2 and F3 and F4.
| design | REAL pool (fade +0.19R) passes | a COIN passes | a LOSER (-0.10R) passes |
|---|---|---|---|
| N = 20 mornings (about 6 weeks) | 45.8% | 17.5% | 9.2% |
| N = 30 (about 9 weeks) | 53.0% | 18.4% | 8.1% |
| N = 40 (about 12 weeks) | 54.7% | 16.1% | 6.1% |
Single lines at N = 40, REAL / COIN: F1 average 71% / 27%; F2 without best two 66% / 23%; F3 drawdown 66% / 28%; F4 beats the chase 92% / 50%.
**BY THE LINE WRITTEN FIRST NO DESIGN IS USABLE**: every one lets a coin through more than 15% of the time (N = 40 misses by 1.1
points), and N = 20 also fails the 50% line for the real pool. My guess (N = 40 usable) was wrong, narrowly.
What this says, plainly:
1. If LM2's edge is exactly what my 73 mornings show, a 40-morning forward test passes it only about one time in two, and passes a
   pure coin one time in six. Longer does not help much (30 -> 40 mornings: 53% -> 55%): with a spread of 1.08R a +0.19R edge is simply
   hard to see in a few dozen trades. This is the 07-21 step-back lesson with numbers on it.
2. So "pass its own kill line on lived days" is, for a once-a-day setup of this strength, closer to a coin flip than to a proof,
   whichever way it falls. A pass would be weak evidence; a fail would be weak evidence too.
3. That is an argument FOR small size and AGAINST waiting: the information arrives at the same slow speed on paper or live, and at
   $15.63 a trade the live version costs at worst about $220 (PS). But that argument is the one I made yesterday and my coach has
   ruled on it: lived-day pass first. I do not reopen it; I report the numbers that bear on it.
4. I do not lower my 15% line after seeing 16.1%.
WHAT I PUT TO MY COACH (I start nothing):
 Option 1: run the forward re-test anyway at N = 40 with F1-F4 as written, knowing a coin passes 16% and the real thing 55%; it would
   run beside SW1's shadow (two paper lines; my coach's rule is one at a time) or replace it (SW1 is 0 for 3, -3.08R).
 Option 2: accept that for this kind of setup the lived-day test and the probation are the same 40 trades, and let the probation at
   $15.63 BE the lived-day test (kill lines C4). That is my proposal of 08-04 again, so I only list it.
 Option 3: neither; LM2 waits for SW1 to finish, as ruled on 07-28.
Limits: mornings resampled as independent; the "real" world assumes my 73 mornings are the truth, which is the optimistic case.
Counts: idea 119; variants 329-331.

COACH'S ANSWER, 08-05: "if no forward test of 40 mornings or fewer can tell it from a coin, LM2 is closed for good, no shadow. route C stays
empty until something earns it." LM2 IS CLOSED FOR GOOD.

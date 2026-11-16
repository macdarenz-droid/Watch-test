# After the 40-trade alarm: does 0.50% still stand on the live record? DECISION LINES WRITTEN BEFORE THE RUN
Clock Fri 2015-04-24 22:00 London (weekend, end of released data).

## Why this is the weekend's test, and why there is no new idea
- It was scheduled long ago: "when the A2 forward test completes, re-run the survival sims with the forward trades", and the coach's line from March: "keep 0.5% until the
  forward trades are done, then let that test decide". The 40th live trade was today; the alarm passed (40 trades, +12.64R, +0.32R each, max drawdown 3.07R).
- I have just had five losses in a row and my first losing week (-3.07R). Any new filter I thought of this weekend would be drawn from those five days, and the last two
  reviews showed me what that produces. Coach, today: no rule changes off a losing week. So: no new idea. The honest question after a losing week is not "what should I
  skip" but "is my size still safe on what I have actually lived" - and that has a pre-written test.
- bt/reshuffle_breach.py was built for challenge attempt #2, which was cancelled on 03-27. Its question (pass a +8% phase) no longer exists. I do not re-run it and say so.

## What is run
1. bt/funded_sim.py as on 03-27 (1,000 two-year reshuffles, sizes 0.25 / 0.50 / 0.75%, brakes ON and OFF), where "L2 forward only" is now my 40 live trades as traded.
2. bt/risk_size.py as on 04-10 (2,000 runs, 0.5 / 1.0 / 1.5%, lines S1-S5) with the A2 list to today (80 trades instead of 69).
3. One correction in both scripts, made BEFORE the run and because of today's payout: after a payout the high-water mark is lowered by the amount paid, not reset to the
   balance. For 0.50% I print the old reading beside it, so I can see what the hole was worth.
These are sizing runs on my own results; no rule variant, no new idea. Counts stay 45 ideas / 122 variants.

## DECISION LINES (explicit, written now)
  D1. Any breach with brakes ON, at 0.50%, in any list -> size is cut to 0.25% from Monday.
  D2. On my 40 live trades (the best evidence I have), at 0.50% with brakes ON, my own -5% stop is reached in more than 10% of the two-year runs -> cut to 0.25% from Monday.
  D3. A RAISE is not on the table whatever the numbers say: it needs 1.0% to pass all five lines of the 04-10 test at the planning edge, and the planning edge (+0.18R)
      has not changed. If 1.0% happens to pass on the longer list I report it and do nothing.
  D4. Otherwise 0.50% stays, brakes unchanged.
Also reported: what the losing week did to the numbers (live average +0.46R a week ago, +0.32R now; planning edge +0.18R).
My guess: D1 and D2 are not triggered (the stop is reached in a few percent of runs on the live list); the corrected high-water rule makes my stop slightly MORE frequent
than the old reading; 1.0% still fails at the planning edge. 0.50% stays.

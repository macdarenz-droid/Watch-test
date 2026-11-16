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
Also reported: what the losing week did to the numbers (live average +0.45R a week ago [first written as +0.46 from memory; the tally says +15.73R / 35], +0.32R now; planning edge +0.18R).
My guess: D1 and D2 are not triggered (the stop is reached in a few percent of runs on the live list); the corrected high-water rule makes my stop slightly MORE frequent
than the old reading; 1.0% still fails at the planning edge. 0.50% stays.

# RESULTS (decision lines above pushed before the run; `python bt/funded_sim.py`, `python bt/risk_size.py 2015-04-25`, and the same with HW_RESET=1 for the old reading)

## 1. Funded survival, 1,000 two-year reshuffles, corrected high-water rule (breached / ended by my -5% stop / alive, brakes ON; breached with brakes OFF)
| list | 0.25% | 0.50% | 0.75% | 0.50% brakes OFF |
|---|---|---|---|---|
| L1 all my live trades since January, 74 (+0.37R) | 0 / 0 / 1000 | 0 / 0 / 1000 | 0 / 33 / 967 | 0 breached |
| L2 the 40 forward trades (+0.32R) | 0 / 0 / 1000 | 0 / 11 / 989 | 0 / 162 / 838 | 0 breached |
| L3 February at realistic costs (+0.18R) | 0 / 0 / 1000 | 0 / 0 / 1000 | 0 / 20 / 980 | 0 breached |
| L4 zero edge | 0 / 157 / 843 | 0 / 676 / 324 | 0 / 936 / 64 | 339 breached |
| L5 -0.10R | 0 / 959 / 41 | 0 / 999 / 1 | 0 / 1000 / 0 | 990 breached |
On the 40 live trades at 0.50%: median two-year payout about 71% of the account ($14,283 to me), 9% of months negative.
Old high-water reading on the same list: stop reached 5 times instead of 11.

## 2. Risk size on the A2 list to today (79 trades, +0.41R; without January 60 trades, +0.29R), plain reshuffle, 0.50% only (1.0% and 1.5% are in the script output)
| scenario | breach, brakes OFF | max DD 95th pct | my -5% stop reached, brakes ON | 5th-pct month |
|---|---|---|---|---|
| E1 full list (+0.41R) | 0.0% | 3.9% | 0.1% | +$108 |
| E2 without January (+0.29R) | 0.0% | 4.9% | 0.4% | -$138 |
| E3 planning edge (+0.18R, whole list shifted down) | 0.4% | 8.1% | 14.2% (block reshuffle 4.8%) | -$491 |
1.0% at the planning edge: breach 14.5% with brakes off, own stop 92.9% with brakes on. 1.5%: breach 51.4%.

## Decision lines applied
- D1 (any breach with brakes ON at 0.50%): none, in any list of either script -> not triggered.
- D2 (on the 40 live trades, own stop in more than 10% of runs at 0.50%): 1.1% -> not triggered.
- D3 (raise): 1.0% fails by a wide margin at the planning edge -> not on the table, as written.
- D4: 0.50% STAYS. Brakes unchanged.

## What the losing week did
A week ago (04-17) the live average was +0.45R on 35 trades; now +0.32R on 40. The backtest-plus-live A2 list went from +0.46R (69 trades, 04-10) to +0.41R (79).
The planning edge stays +0.18R; live is still above it, and the gap is far inside the +-0.34R I can measure.

## What I did NOT expect, said plainly: the high-water correction matters in the simulations
- With the old reading (high-water reset to the balance at every payout) a drawdown was forgotten each time a payout fell inside it - every 10 trading days in the
  simulation. My 04-10 risk-size table was computed that way. It said: at the planning edge, 0.50% reaches my own -5% stop in 5.5% of two-year runs.
- Same script today: old reading on the longer list 8.4% (the losing week alone moved it from 5.5%); CORRECTED reading 14.2% (plain) / 4.8% (block).
  The 95th-percentile drawdown at the planning edge is 8.1%, not the 7.0% I reported on 04-10.
- So the honest statement about 0.50% is worse than the one I made two weeks ago: IF my true edge is only the planning +0.18R AND losses come in the order a plain
  reshuffle gives, then about one two-year run in seven ends with my own brake stopping me at -5%. Never a breach: with brakes on the lowest balance in any run was -5.3%.
- The two ways I have of writing "planning edge" disagree a lot: February's own trades at realistic costs (L3) -> stop reached 0 times in 1,000; the whole list shifted
  down to +0.18R (E3) -> 14%. Same average, different shape (February had many small losses; the shifted list has many full stops). I do not know which shape the
  future has. The live record so far looks more like E3: 25% of my live trades are full stops.
- My 04-10 line S4 ("own stop in at most 5% of runs at the planning edge") is now failed by 0.50% clearly, not narrowly. That test's rule was "if no size is acceptable,
  0.50% stays", and today's lines say the same. But I do not want to hide behind my own wording: the alternative is 0.25%, which the first table shows almost never
  reaches the stop even at zero edge for a long time, and which halves the income (about $185 a month to me at the planning edge instead of $370).
QUESTION FOR MY COACH (the decision lines say 0.50% stays, and that is what I trade on Monday unless told otherwise): stay at 0.50%, accepting roughly a 1-in-7 chance over
two years of being stopped by my own -5% brake if the edge is only the planning number - or cut to 0.25% until the live book is bigger? My own view: stay. Being
stopped by the brake costs the account nothing but a pause and a review with you, a breach has not appeared in any run with brakes on, and the live record is above the
planning edge. But it is a survival question and I would rather it were decided than assumed.
No new idea, no variant: counts stay 45 ideas / 122 variants.

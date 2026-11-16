# Funded risk size: 0.5% vs 1.0% vs 1.5%. HYPOTHESIS AND KILL TEST WRITTEN BEFORE THE RUN
Clock Fri 2015-04-10 22:00 London (weekend, end of released data). Coach's brick: leave entries alone; study sizing from my A2 trade history with Monte Carlo reshuffles;
report breach odds, worst drawdown and monthly P&L spread; pick a size with cushion.

## What already exists (so I do not repeat it)
- bt/funded_sim.py (03-27): 0.25 / 0.50 / 0.75% on my live trade list, 1,000 two-year reshuffles. 0.50% passed and has been the funded size since.
- Coach's standing line from the challenge: "keep 0.5% until the forward trades are done, then let that test decide" (A2 forward alarm test: 30 of 40 trades done).
  I keep that: whatever this test says, NO size increase takes effect before that 40-trade test is complete and passes its lines. This test can only name the candidate.
- New here: sizes 1.0% and 1.5% (never simulated for the funded account), the A2 engine list on ALL history (69 trades, 01-06..04-10, full costs) instead of the mixed
  live list, a streak-keeping reshuffle next to the plain one, worst drawdown and the monthly P&L spread as explicit outputs.

## Method (fixed now)
- Trade list: A2 from the engine, all history to the clock (explicit end 2015-04-11), R per trade. No price data in the simulation itself.
- Edge scenarios (the size must survive my uncertainty about the edge, which is +-0.25R on this many trades):
  E1 full list as it is | E2 without January (February to now only: my worse two-thirds) | E3 "planning edge": full list shifted down so its average is +0.18R |
  E4 zero edge (shifted to 0.00R) | E5 losing (-0.10R).
- Two reshuffles, 2,000 runs each of 500 trading days (two years, one trade per day), fixed seed:
  plain (each day drawn at random from the list) and BLOCK (runs of 5 consecutive real trades drawn together, so real losing streaks stay intact).
- Account rules: static max loss -10% of $25,000; daily loss 5% (one trade a day with a fixed stop loses at most about 1R = the risk size, so the daily line cannot be
  reached at these sizes except by a gap through the stop - I state that, I cannot simulate it); payouts per my plan every 10 trading days.
- Each size is run twice: firm rules only (brakes OFF), and with my brakes ON (half size from -3% below high-water, stop trading at -5%).
- Outputs per size and scenario: breach odds; odds of reaching my -5% stop; max drawdown from high-water (median, 95th percentile, worst of 2,000);
  monthly P&L (21 trading days) 5th / 50th / 95th percentile in $ and share of losing months; median total payout requested.

## Hypothesis
At 0.50% I am far from the line; with the measured edge, 1.0% would roughly double the monthly income and still almost never breach. 1.5% is too big for an edge
I only know to +-0.25R.

## Sizes tested: 0.5%, 1.0%, 1.5% (three, no others afterwards; counted as idea 36, variants 93-95)

## KILL TEST (explicit). A size is ACCEPTABLE only if ALL of these hold, in BOTH reshuffles:
  S1. brakes OFF, breach odds over two years <= 1% in each real-edge scenario E1, E2, E3;
  S2. brakes ON, breach odds = 0 in ALL five scenarios (if the edge is gone, the worst case must be "lose about 5% and stop", never the account);
  S3. brakes OFF, E3: the 95th percentile of max drawdown is <= 6% (4% of cushion to the line in a bad-but-plausible two years);
  S4. brakes ON, E3: my -5% stop is reached in <= 5% of runs (a size that keeps stopping me out of a working rule is too big);
  S5. brakes OFF, E3: the 5th-percentile month is not worse than -4% (-$1,000).
DECISION RULE: the candidate is the LARGEST acceptable size. Cushion: if that size passes any line by less than a quarter of the limit, step down one size.
If no size is acceptable, 0.50% stays (it is the size in use and the smallest of the three) and I say which line it failed.
If the candidate is above 0.50%: it is written into the plan as "from the day the 40-trade forward test passes", not before.
My guess, written now: 1.5% fails S1, S3 and S5; 1.0% fails S3 (two years at +0.18R with 1R sd should contain a 10R+ drawdown often) and probably S1; 0.50% is the answer again,
possibly failing S3 narrowly itself. If so the honest reading is "the size is limited by how badly I know my edge, not by the firm's rules".

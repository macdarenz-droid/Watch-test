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

## RESULTS (run once after the lines above were pushed: `python bt/risk_size.py 2015-04-11`; seed fixed; 2,000 runs x 500 days per cell)
Trade list: 69 A2 trades, avg +0.462R, sd 1.03R, worst -1.03R. Without January: 50 trades, avg +0.340R. Amounts in % of $25,000; months in $ (account P&L before the 80% split).
"Stop" = my own -5% brake ends trading. OFF = firm rules only; ON = my brakes.

### Plain reshuffle
| scenario | size | breach OFF | max DD OFF: median / 95th pct / worst | month $: 5th pct / median / 95th pct | losing months | stop ON | breach ON |
|---|---|---|---|---|---|---|---|
| E1 full (+0.46R) | 0.5% | 0.0% | 1.8 / 2.6 / 4.1% | +287 / +1,195 / +2,193 | 1% | 0.0% | 0 |
| | 1.0% | 0.0% | 3.6 / 5.2 / 9.2% | +575 / +2,391 / +4,386 | 1% | 2.1% | 0 |
| | 1.5% | 0.1% | 5.4 / 8.1 / 13.7% | +862 / +3,586 / +6,579 | 1% | 38.6% | 0 |
| E2 no January (+0.34R) | 0.5% | 0.0% | 2.0 / 2.9 / 5.0% | +42 / +885 / +1,762 | 4% | 0.0% | 0 |
| | 1.0% | 0.0% | 4.0 / 6.3 / 12.8% | +85 / +1,770 / +3,524 | 4% | 7.5% | 0 |
| | 1.5% | 1.1% | 6.1 / 10.1 / 14.8% | +137 / +2,658 / +5,286 | 4% | 61.7% | 0 |
| E3 planning (+0.18R) | 0.5% | 0.2% | 3.8 / 7.0 / 11.6% | -451 / +456 / +1,453 | 21% | 5.5% | 0 |
| | 1.0% | 10.8% | 7.7 / 12.2 / 16.5% | -840 / +934 / +2,908 | 20% | 82.6% | 0 |
| | 1.5% | 42.7% | 11.5 / 15.3 / 18.3% | -1,066 / +1,476 / +4,388 | 18% | 100.0% | 0 |
| E4 zero edge | 0.5 / 1.0 / 1.5% | 57.9 / 94.8 / 99.6% | - | - | - | 87.9 / 99.9 / 100% | 0 / 0 / 0 |
| E5 -0.10R | 0.5 / 1.0 / 1.5% | 99.1 / 100 / 100% | - | - | - | 99.9 / 100 / 100% | 0 / 0 / 0 |

### Block reshuffle (runs of 5 real consecutive trades kept together)
| scenario | size | breach OFF | max DD OFF: median / 95th pct / worst | month $: 5th pct / median / 95th pct | losing months | stop ON | breach ON |
|---|---|---|---|---|---|---|---|
| E1 full | 0.5 / 1.0 / 1.5% | 0 / 0 / 0% | 95th pct 1.9 / 3.8 / 5.8% | median +1,199 / +2,399 / +3,598 | 1% | 0.0 / 0.1 / 7.8% | 0 |
| E2 no January | 0.5 / 1.0 / 1.5% | 0 / 0 / 0% | 95th pct 2.0 / 4.0 / 6.1% | median +882 / +1,763 / +2,645 | 2% | 0.0 / 0.2 / 14.1% | 0 |
| E3 planning | 0.5% | 0.1% | 3.2 / 5.8 / 10.9% | -384 / +460 / +1,355 | 19% | 1.9% | 0 |
| | 1.0% | 4.2% | 6.3 / 11.1 / 14.7% | -742 / +931 / +2,715 | 19% | 65.9% | 0 |
| | 1.5% | 26.2% | 10.1 / 14.5 / 19.2% | -993 / +1,442 / +4,104 | 18% | 99.7% | 0 |
| E4 zero / E5 -0.10R | all | 51-100% | - | - | - | 84-100% | 0 |
With brakes ON the lowest balance in any run of any cell was -6.2% (1.5%), -5.8% (1.0%), -5.4% (0.5%): the brakes do their job at every size.
(Month figures for E4/E5 are left out on purpose: with most runs breached they describe survivors only.)
My real blocks are less streaky than chance (block drawdowns are SMALLER than plain ones), so the plain reshuffle is the stricter one here.

## Kill lines applied
| line | 0.5% | 1.0% | 1.5% |
|---|---|---|---|
| S1 breach OFF <= 1% in E1, E2, E3 | PASS (0 / 0 / 0.2%) | FAIL (E3 10.8% plain, 4.2% block) | FAIL (E2 1.1%, E3 42.7%) |
| S2 breach ON = 0 everywhere | PASS | PASS | PASS |
| S3 E3 95th pct max DD <= 6% | FAIL plain 7.0% (block 5.8% passes) | FAIL 12.2% | FAIL 15.3% |
| S4 E3 stop ON <= 5% | FAIL plain 5.5% (block 1.9% passes) | FAIL 82.6% | FAIL 100% |
| S5 E3 5th pct month >= -$1,000 | PASS (-$451) | PASS (-$840) | FAIL (-$1,066) |
VERDICT: NO SIZE IS ACCEPTABLE on all five lines. By the decision rule 0.50% STAYS. It fails S3 (7.0% against 6%) and S4 (5.5% against 5%), both narrowly, both only in the
plain reshuffle, both only if my true edge is the planning +0.18R. 1.0% and 1.5% fail by a wide margin. My guess was right, including the narrow S3 miss at 0.50%.

## What I learned
- If the measured edge (+0.34 to +0.46R) is real, even 1.5% never breaches in two years. If the edge is the planning +0.18R, 1.0% breaches in about 1 run in 10 and
  1.5% in 4 of 10. The whole difference between "safe" and "account gone" is 0.25R of edge - exactly the width of my uncertainty on this many trades.
  So the size is limited by how badly I know my edge, not by the firm's rules. More trades are the only thing that widens it.
- 0.50% is not comfortable either: at the planning edge two years contain a 7% drawdown in 1 run of 20, and my -5% stop takes me out of a working rule in about 1 run of 20.
  That is the price of the brake, and I keep paying it: with brakes ON nothing ever breached, at any size, at any edge, even a losing one.
- Bigger size does not pay under my own brakes when the edge is modest: at +0.18R, 1.0% with brakes pays out LESS than 0.50% in the plain reshuffle (28% vs 40% of the
  account over two years) because the stop ends most runs early.
- What to expect at 0.50%, account P&L per month before the split: about +$460 (planning edge) to +$890 (February-to-now edge); one month in five negative at the planning
  edge; a bad month is about -$450. My 80%: roughly $370 to $710 a month. The +$1,195 of the full list has January in it and I do not plan with it.
- Different from the 03-27 test, honestly: that one found the -5% stop in 0 of 1,000 at "February realistic"; this one finds 5.5% at "+0.18R". Same average, different list:
  here the whole 69-trade list is shifted down by 0.28R, which makes more losing days than February really had. I do not know which shape is nearer the truth; the stricter one
  is the one I plan with.
- Limits: 69 trades; reshuffles assume tomorrow's trades come from the same list; gaps through the stop and the 5% daily line are not simulated (one trade a day at
  0.5% cannot reach it without a gap of several hundred pips).

## Decision
Funded size stays 0.50% ($125, 0.31 lots), brakes unchanged (-3% half size, -5% stop). No candidate for an increase. The A2 forward test (30 of 40 trades) still decides
nothing upward on its own: a raise needs BOTH that test passed AND a re-run of this script where 1.0% passes S1-S5 - which needs the planning edge itself to be higher,
i.e. many more forward trades. I do not go below 0.50% either: 0.25% was tested on 03-27, and the two narrow misses here are in the one pessimistic scenario with the brake as backstop.
Counts: ideas 36, variants 95.

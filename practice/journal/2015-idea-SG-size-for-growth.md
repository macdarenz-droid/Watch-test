# Idea SG: what risk per trade gives the best growth while breach odds stay tiny over two years? LINES, WORKED CASES AND EXPECTATION WRITTEN BEFORE ANY CODE
Clock Thu 2015-06-18 01:00 London (end of released data). After funded day 59. Coach 06-17: "one test of position sizing math: what risk per trade
gives the best growth while keeping breach odds tiny over 2 years." The one-page plan was rewritten first (journal/PLAN-v2-funded-one-page.md).
June goal: every number and every test rule gets one worked case before it is pushed.

## What is already known (so this is not a re-run)
04-10 risk-size test: 0.5 / 1.0 / 1.5% with the old 5% stop, 69 trades: 0.50% stayed. 05-18 idea WS: the 7% stop chosen. 06-02 idea GD: at 0.50% the
guard caps a dead edge at about 5-6%. What has NOT been asked: with the rules as they are today (half at 3%, stop at 7%, payout rule), 116 trades and
my real state, how do GROWTH and risk trade off between sizes. That is this test.

## Method (machinery of bt/guard_dead_edge.py, unchanged except that the risk per trade is a parameter)
- 2,000 two-year runs (500 trading days) for each size, drawn from the engine's A2 list to END 2015-06-18, shifted to a chosen true edge, real-fill
  extras added to full stops (jump days included), plain reshuffle AND 5-day blocks. Start = my real state: balance +0.090%, high-water +1.122% of $25,000.
- All money rules on: half size from 3% under the high-water, stop trading at 7% under, payouts every 10 trading days by the plan's rule, high-water
  lowered by payouts. Firm's lines: balance at or under -10% = breach; a day's loss of 5% or more of the balance = breach (added to the machinery; with one trade a day it needs a 5R jump at 1.0%).
- VARIANTS (3): risk 0.50% (today), 0.75%, 1.00%. The 3% / 7% lines stay in percent, so a bigger size means fewer trades of room.
- True-edge scenarios: 0.00R (dead), +0.10R (lower part of my band), +0.18R (planning), +0.20R (lived average today).
- GROWTH is measured as MY money: 80% of the median total payout over the two years, in dollars. A run that reaches my 7% stop keeps what it was paid before.

## Lines a bigger size must pass to be worth proposing (in BOTH draws; one failure kills that size)
- S1 breach: 0.5% of runs or fewer at every edge, the dead edge included, and no run below -9%.
- S2 my own 7% stop at the planning edge (+0.18R): reached in 5% of runs or fewer.
- S3 small edge: at +0.10R still trading after 300 days in at least 85% of runs (GD's line).
- S4 growth: my median payout at +0.18R at least 25% above the 0.50% figure. (More risk for less than a quarter more money is not worth a rule.)
- S5 one bad day: the worst day seen in my history (real-fill stop, about 3.1R) times the size is at most 2.5% - half the firm's daily line, because
  116 days cannot have shown me the worst jump there is.
Worked cases for the lines: S5 by arithmetic now - DC found the worst day at 1.54% at 0.50%, so 0.75% gives about 2.31% (pass) and 1.00% about 3.08% (FAIL):
1.00% is dead on S5 before the simulation unless the tool's worst-day figure differs. S4: if 0.50% pays me a median $6,000, 0.75% must pay at least $7,500.
S2: 100 of 2,000 runs stopped = 5.0% = pass; 101 = fail.
MECHANICS REGRESSION before the run: at 0.50% the new script must give the same own-stop and breach percentages as
`python bt/guard_dead_edge.py 2015-06-18 0.090 1.122 0.18` (same seeds).

## What a pass would and would not mean (decision rule, written now)
Nothing live changes from this test whatever it prints. The plan says size changes only by a trigger written in advance, and the coach's rule of 06-02 says
A2 stays at the planned size until the edge is judged on a few hundred lived trades. If 0.75% passes all five lines, the output is a PROPOSAL to the
coach for a written trigger (which lived-trade count and which lived average would unlock it). If it fails, 0.50% is confirmed and the question is closed
until the edge is known better. If 0.50% itself fails S1-S3 from today's state, I say so and ask the coach.

## Worked expectation
Growth at a positive edge is roughly proportional to the size as long as the stop is not met; my stop is met far more often with a bigger size
(GD: a trailing line is met more often than I guess). Guesses: own stop at +0.18R: 0.50% about 2%, 0.75% about 8%, 1.00% about 18%. Median payout to me
at +0.18R: 0.50% about $6,000 over two years, 0.75% about $8,500, 1.00% about $10,000. At the dead edge the stop is reached in about 70% / 85% / 92%.
Verdict I expect: 0.75% passes S1, S3, S4, S5 and FAILS S2; 1.00% fails S2 and S5. 0.50% stays.
Counts when run: idea 84, variants 233-235.

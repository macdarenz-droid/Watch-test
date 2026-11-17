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

## Mechanics regression (lines pushed first in commit e660b54)
`python bt/guard_dead_edge.py 2015-06-18 0.090 1.122 0.18`: own stop 3.2% (plain) / 1.1% (block), breached 0.0%, lowest -6.20% / -6.34%.
`python bt/sizing_growth.py 2015-06-18 0.090 1.122 0.50 0.18`: 3.2% / 1.1%, 0.00%, -6.20% / -6.34%. Identical.

## A CORRECTION TO THE PUSHED TEXT, COUNTED (June correction 2)
In S5 I wrote "the worst day seen in my history (real-fill stop, about 3.1R)". That label is wrong. The tool's worst REAL-fill day is -1.33R. The
3.07R (1.54% at 0.50%) is idea DC's HYPOTHETICAL jump day: the biggest single minute of the history (81.7 pips, 01-15) landing on my stop. The worked
numbers in S5 (2.31% and 3.08%) were made from the 3.07R figure, so the line is applied as worked - with the jump day, the stricter reading - and not
re-pointed at the milder 1.33R after seeing the tool. The arithmetic was right; the description of what the number is was not, and it was pushed.
Cause: I wrote a rule's description from memory and checked only its arithmetic. Also stated: the simulation contains real-fill extras but NOT the
hypothetical jump day (idea TS added those separately); S5 is the only place the jump day enters.

## RESULTS (one run: `python bt/sizing_growth.py 2015-06-18 0.090 1.122`; 2,000 runs x 500 days from my real state; figures copied from the print; plain / block)
List: 117 engine trades to 06-17. Breached: 0.00% for every size at every edge, lowest balance of any run -7.05%.
| true edge | risk | own 7% stop reached | still trading after 300 days | MY median payout in 2 years | 10th - 90th pct (plain) | median account result |
|---|---|---|---|---|---|---|
| 0.00R | 0.50% | 75.9% / 72.9% | 46.5% / 53.1% | $341 / $301 | $0 - $1,735 | -3.3% |
| 0.00R | 0.75% | 95.3% / 94.5% | 15.3% / 19.4% | $263 / $243 | $0 - $1,931 | -3.4% / -3.6% |
| 0.00R | 1.00% | 99.4% / 99.4% | 4.0% / 5.9% | $208 / $165 | $0 - $2,019 | -3.3% / -3.6% |
| +0.10R | 0.50% | 19.1% / 14.4% | 89.8% / 92.7% | $2,514 / $2,713 | $528 - $5,577 | +12.2% / +12.9% |
| +0.10R | 0.75% | 60.1% / 49.2% | 59.7% / 68.1% | $2,492 / $2,925 | $129 - $6,993 | +11.2% / +14.0% |
| +0.10R | 1.00% | 88.3% / 83.2% | 27.6% / 35.6% | $1,686 / $2,020 | $0 - $7,907 | +6.4% / +8.0% |
| +0.18R | 0.50% | 3.2% / 1.1% | 98.2% / 99.6% | $6,037 / $6,327 | $3,071 - $9,679 | +31.2% / +32.7% |
| +0.18R | 0.75% | 21.8% / 16.1% | 87.2% / 90.3% | $7,782 / $8,130 | $2,444 - $12,828 | +40.5% / +42.6% |
| +0.18R | 1.00% | 56.9% / 45.1% | 60.1% / 70.5% | $7,565 / $8,645 | $478 - $15,583 | +37.6% / +44.5% |
| +0.20R | 0.50% | 1.8% / 0.7% | 99.1% / 99.7% | $7,074 / $7,415 | $3,997 - $10,746 | +36.7% / +38.5% |
| +0.20R | 0.75% | 16.0% / 10.2% | 90.5% / 94.0% | $9,245 / $9,666 | $3,916 - $14,414 | +48.1% / +50.5% |
| +0.20R | 1.00% | 47.0% / 36.6% | 68.7% / 76.8% | $9,897 / $10,919 | $1,000 - $17,588 | +50.8% / +56.2% |
| line | 0.50% | 0.75% | 1.00% |
|---|---|---|---|
| S1 breach <= 0.5%, no run under -9% | PASS | PASS | PASS |
| S2 own stop at +0.18R <= 5% | PASS (3.2 / 1.1) | FAIL (21.8 / 16.1) | FAIL (56.9 / 45.1) |
| S3 at +0.10R trading after 300 days >= 85% | PASS (89.8 / 92.7) | FAIL (59.7 / 68.1) | FAIL (27.6 / 35.6) |
| S4 my median payout at +0.18R >= 1.25x | base | PASS (x1.28) | PASS (x1.25) |
| S5 jump day x size <= 2.5% | PASS (1.53%) | PASS (2.30%) | FAIL (3.07%) |
VERDICT: 0.75% killed on S2 and S3; 1.00% killed on S2, S3 and S5. 0.50% passes its own lines from today's state. 0.50% STAYS. No proposal.

## Expectation against the run
Own stop at +0.18R: guessed 2% / 8% / 18%; got 3.2% / 21.8% / 56.9% (plain). Right at 0.50%, far too low above it - the same miss as in GD: a trailing
line is met much more often than I guess, and I guessed low again after writing that sentence. Payouts at +0.18R: guessed $6,000 / $8,500 / $10,000; got
$6,037 / $7,782 / $7,565: the bigger sizes pay LESS than proportional because so many runs end at my stop. Dead edge: guessed 70 / 85 / 92%; got 76 / 95 / 99%.
Verdict guessed "0.75% fails S2 only": it also fails S3.

## The answer to the coach's question, in plain words
- Breach odds are tiny at every size I tested - not because the size is safe but because my own 7% stop stands 3% in front of the firm's line. So "breach"
  does not choose the size. What chooses it is how often I stop MYSELF with a rule that still works.
- At the planning edge half as much risk again buys 28% more median payout and multiplies the odds of ending at my own stop by about seven (3% -> 22%).
  At +0.10R - well inside what my 78 trades allow - the bigger sizes pay me NO more at the median ($2,514 against $2,492 and $1,686) and end the account
  in 60% and 88% of runs instead of 19%. With a dead edge all three lose the same 3.3%; the bigger size only gets there sooner.
- So the size with the best growth that I can actually keep is the one I have: 0.50%. The spread at 1.00% ($478 to $15,583) is a coin, not a plan.
- What is NOT tested: anything under 0.50% (three variants were allowed; 19% own-stop odds at +0.10R says a smaller size would not be silly if my edge
  is at the low end - a question for the coach, not a fourth run), and a different stop line for a different size (the 7% line was chosen for 0.50%; WS is closed).
- When could it change: only when the edge is known better. The lived average is +0.20R +-0.24R; if after a few hundred lived trades the LOWER end of
  the band is still above about +0.18R, the 0.75% row would read like today's 0.50% row at +0.10R... I cannot work that case from this table, so I
  do not write a trigger from it. No trigger is written today.
Counts: ideas 84, variants 235 (three sizes). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 2 (the S5 label, today).

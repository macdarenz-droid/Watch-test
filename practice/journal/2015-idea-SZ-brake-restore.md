# One change to how I size A2: WHEN do I go back to full size after the half-size trigger? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY CODE OR RUN
Clock Tue 2015-05-05 01:00 London (end of released data).
Coach, 05-04: "5 kills in a row on new filters - next test go back to your best idea A2 and test one change to how you size or manage it, hypothesis + kill test first."

## Why this change and not another
- Management: 29 exit and management definitions are tested and closed (the last on 05-01). I have nothing honest left there.
- Size level: 0.5 / 1.0 / 1.5% tested on 04-10 and re-run on 04-24; 0.50% stays.
- Size by signal: "bigger on stretched signals" is the mirror of the XS test and I already know its answer (the stretched group was WORSE than the rest in the
  backtest months), so running it would be theatre. "Half size after a lively hour" is PH2, on paper.
- What I have never tested is the size RULE itself. I wrote it on 04-27 from common sense: half size from 3% under the high-water mark "until a new high-water mark",
  stop at 5%. The level of the step and the stop were looked at in the survival runs; the RESTORE condition never was. "Until a new high-water" could keep me at half size
  for months while the rule is working again - or it could be exactly what keeps the stop from being reached. I do not know.

## Why this has to be a simulation, said plainly
In my 80 live trading days (27 of them on the funded account) the account has never been 3% under its high (funded deepest: 1.63%). [Corrected 05-05: I first wrote "88 lived trading days" from memory; my trade log has 80. Logged as process mistake P4.] The real sequence of my trades cannot test a rule that has never fired.
So this is 2,000 two-year reshuffles of my own trade results - the same tool as the size tests - comparing restore rules on the SAME shuffled sequences.
A reshuffle is not new evidence about the edge; it is arithmetic on a rule under stated assumptions. I count it as one idea with three variants.

## Hypothesis
Returning to full size once half of the hole is repaired (drawdown back under 1.5%) earns clearly more over two years than waiting for a new high-water mark,
without making my own -5% stop noticeably more likely - in the scenarios where the rule has an edge AND in the one where it has none.

## The current rule and the variants (138, 139, 140; ideas -> 51), no others afterwards. Everything else identical: 0.50% full size, half size 0.25%, the -3% step,
the -5% stop, payouts every 10 trading days by my plan (half of what is above the start until +4%, then everything above +4%; none while at half size; the high-water
mark lowered by a payout), 500 trading days, 2,000 runs, fixed seed, the same draws for every rule.
- SZ0 (current): after the -3% step, half size until a NEW HIGH-WATER mark.
- SZ1: half size until the drawdown is back under 1.5%.
- SZ2: half size only while the drawdown is 3% or more (full size again as soon as it is under 3%).
- SZ3: no half-size step at all: full size until the -5% stop. (What the step is worth.)
Trade lists: L = my 46 live trades as traded (+0.34R; the best evidence); P = planning edge (all A2 engine trades shifted to an average of +0.18R);
Z = zero edge (the same list shifted to 0.00R).

## KILL TEST (explicit). A variant survives only if ALL:
  K1. median total payout over two years at least 5% higher than SZ0's, on list L AND on list P;
  K2. my own -5% stop is reached at most 0.5 percentage points more often than under SZ0 on list L, and at most 1.0 point more often on list P;
  K3. if the edge is gone (list Z): the stop is reached at most 2 points more often than under SZ0 and the median day of the stop is not more than 10% earlier;
  K4. the lowest balance in any run of any list is not below -5.5% of the start (the stop must still do its job).
A survivor does NOT change my size rule by itself: the rule was written with my coach on 04-27 and "no rule changes" applies to my own tests. A survivor becomes a
written proposal with these tables; the coach decides.
Also reported: share of trading days spent at half size under each rule.
My guess, written now: with an edge, the -3% step is rarely reached at 0.50% (a few percent of days at half size), so the restore condition moves the payout by one
or two percent - under my 5% line. SZ1 and SZ2 fail K1. SZ3 raises the stop odds at the planning edge by more than a point and fails K2. No survivor: the rule stays as written.

# RESULTS (kill test above pushed in commit 0a415bd before any code; mechanics checked on a hand-made sequence; one run: `python bt/brake_rule.py 2015-05-05`)
2,000 two-year runs at 0.50%, the same draws for every rule. Amounts in % of the account.

## Mechanics check before the run (`--check`: seven full stops, then twelve +1R winners)
SZ0 goes to half size at -3.00% and stays there (no new high-water in the sequence); SZ1 returns to full size after the balance is back above -1.50%; SZ2 as soon as it
is back above -3.00%; SZ3 never halves and reaches -3.50% instead of -3.25%. Each path matches the rule as written.

## Results
| list | rule | own -5% stop reached | median day of the stop | median two-year payout | lowest balance in any run | days at half size |
|---|---|---|---|---|---|---|
| L: my 46 live trades (+0.34R) | SZ0 current: until a new high-water | 0.2% | 378 | 79.5% | -4.18% | 6.9% |
| | SZ1: until drawdown < 1.5% | 0.3% (+0.1) | 378 | 80.6% (+1.5%) | -4.37% | 4.2% |
| | SZ2: only while drawdown >= 3% | 0.6% (+0.4) | 360 | 81.4% (+2.5%) | -4.29% | 1.9% |
| | SZ3: no half-size step | 5.3% (+5.1) | 263 | 81.9% (+3.0%) | -5.16% | 0% |
| P: planning edge (+0.18R) | SZ0 | 14.8% | 245 | 35.0% | -5.30% | 30.1% |
| | SZ1 | 17.2% (+2.3) | 258 | 37.1% (+5.7%) | -5.30% | 21.2% |
| | SZ2 | 23.8% (+8.9) | 258 | 39.2% (+11.8%) | -5.30% | 12.4% |
| | SZ3 | 48.7% (+33.8) | 226 | 38.3% (+9.2%) | -5.56% | 0% |
| Z: zero edge | SZ0 | 92.3% | 138 | 1.8% | -5.35% | 64.9% |
| | SZ1 | 96.2% (+3.8) | 135 | 1.9% | -5.35% | 54.5% |
| | SZ2 | 98.6% (+6.3) | 117 | 1.9% | -5.35% | 38.9% |
| | SZ3 | 99.6% (+7.3) | 88 | 2.0% | -5.70% | 0% |

## Kill lines applied
| line | SZ1 | SZ2 | SZ3 |
|---|---|---|---|
| K1 payout at least +5% on L AND on P | FAIL (L +1.5%; P +5.7%) | FAIL (L +2.5%; P +11.8%) | FAIL (L +3.0%; P +9.2%) |
| K2 stop at most +0.5 pt on L, +1.0 pt on P | FAIL (P +2.3) | FAIL (P +8.9) | FAIL (L +5.1, P +33.8) |
| K3 zero edge: stop at most +2 pts, stop day at most 10% earlier | FAIL (+3.8) | FAIL (+6.3; 15% earlier) | FAIL (+7.3; 36% earlier) |
| K4 lowest balance not below -5.5% | PASS | PASS | FAIL (-5.70%) |
VERDICT: NO SURVIVOR. The size rule stays exactly as written on 04-27: half size from -3% until a NEW HIGH-WATER mark, stop at -5%.

## My guess against what happened
"The restore condition moves the payout by one or two percent" - right on the live list (+1.5%, +2.5%), wrong at the planning edge (+5.7%, +11.8%): when the edge is
thin I am at half size on 30% of all days, so the rule matters much more than I thought. "SZ3 fails K2": by a mile.

## What I learned
- The half-size step is the most valuable line in my plan, and I had never measured it. At the planning edge it takes the chance of being stopped out by my own -5%
  rule from 49% of two-year runs to 15%; on my live trades from 5.3% to 0.2%. Its price: about 3% of the median payout on the live list and 9% at the planning edge
  (and the MEAN payout at the planning edge is actually higher with the step: 34.7% against 34.4%, because fewer runs die).
- "Until a new high-water mark" is not too strict. Restoring early buys 1.5% to 6% more payout and gives back 2 to 4 points of stop-out risk exactly in the scenarios
  where I most need the protection (thin edge, no edge). It fails my lines in both directions that matter. I keep the strict version, now for a measured reason
  instead of common sense.
- If the edge is gone, every rule ends at the stop; the current one takes longest to get there (median day 138 against 88 without the step) - 50 more trading days
  in which to notice. That is what a brake is for.
- An uncomfortable number to keep in view: at the planning edge I would spend 30% of my days at half size. If the live edge drifts down toward +0.18R, "0.50%" is
  in practice closer to 0.42% on average. Income expectations in the plan should be read with that in mind.
- Limits: reshuffles assume independent days drawn from the lists I have; the lists are 46 (live) and 85 (A2 engine) trades [first written as 87, from memory; P4]; the payout policy is modelled every 10 trading days.
Counts: ideas 51, variants 140.

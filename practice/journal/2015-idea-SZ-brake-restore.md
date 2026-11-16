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
In 88 lived trading days the account has never been 3% under its high (deepest: 1.63%). The real sequence of my trades cannot test a rule that has never fired.
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

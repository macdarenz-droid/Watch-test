# Working backwards from "both phases in ~40 trading days" - which lever is cheapest? + ONE pre-registered test (written before any run)
Clock Thu 2015-03-26 00:00 UTC (end of released data).

## 1. The arithmetic
Both phases = +8% then +5% = 13% of $25,000. In R that depends only on the risk per trade:
| Risk per trade (both phases) | R needed for both phases | Avg R per trade needed in 40 trades (5 a week x 8 weeks) | ...in 60 trades | ...in 80 trades |
|---|---|---|---|---|
| 0.50% | 26.0R | +0.65R | +0.43R | +0.33R |
| 0.50% then 0.75% (attempt 1) | 22.7R | +0.57R | +0.38R | +0.28R |
| 0.75% | 17.3R | +0.43R | +0.29R | +0.22R |
| 1.00% | 13.0R | +0.33R | +0.22R | +0.16R |
What I have: A2, one valid setup a day = 5 trades a week. Avg R: February +0.23R (+0.18R at realistic costs), all 52 live trades +0.49R, forward since 03-02 +0.65R (trend-heavy).
So the product "trades per week x avg R" I can count on is between 0.9R a week (February) and about 2.5R a week (the blend). Forty days at 0.5% needs 3.25R a week.
At 0.5% the goal needs every week to be a January week. That is the wall the start-week test showed (best case 44-45 days, and only for starts that got January).

## 2. The three levers, priced with my own results
| Lever | What it would take | What my tests say | Cost |
|---|---|---|---|
| More valid setups per week | a second setup with its own positive expectancy, in other hours | 3 searches (B, M, N): B is the same bet; M failed; N1 passed in-sample and is 4 trades, -2.34R forward | HIGH: needs a new edge I have not found in 56 variants; months of forward tagging before a cent |
| Bigger average winner | a better exit or management | 13 exit variants (A3, E1, T1-2, X1-3, Z1-3, V1-3, ET10-13, S50-80): none survived; noon and 40 pips are near the best in every month | HIGH: every door tried, all shut |
| Risk per trade | nothing new - the same trades, sized up | never breached in 52 live trades or any of 8 start weeks; worst point ever -1.4% against a 10% limit; my brakes stop a dead rule at -6% | LOW to move, but it is paid in safety, and it multiplies whatever the edge really is - including zero |
Honest ranking: risk is the cheapest lever by far, BECAUSE the other two are not available, not because it is free. It does not make the rule better. It converts unused drawdown room
into speed. The only thing that makes that responsible is evidence that the edge is real - the forward test (18 of 40 trades so far) - and brakes that cap the damage if it is not.

## 3. The test: how much risk does the 40-day goal actually require, and what does the history say it would have cost? (3 sizing policies; no new rule, variant count stays 56)
bt/start_weeks.py again - the full rulebook from each Monday 01-05..02-23, data to 03-25, costs on, brakes on (-4% -> 0.5%, -6% -> stop), finishing size on - at:
- R75: 0.75% in both phases.   - R100: 1.00% in both phases.   - R125: 1.25% in both phases.
(Reference rows already known: 0.5%/0.75% and 0.5%/0.5% - 0 of 4 decided starts within 42 days.)

## Kill test / decision rule (fixed now)
A size "delivers the goal on this history" only if ALL:
  (a) at least half of the decided starts pass both phases within 42 trading days;
  (b) no start is stopped by my -6% brake or breaches;
  (c) no start ever touches the -4% brake (the brake is for emergencies, not part of the plan).
The answer is the SMALLEST size that delivers. Then two more locks before any of it touches money, both already written in earlier tests and not reopened here:
  - the size must pass the pessimistic reshuffle (zero-edge true breach <= 1% within 60 days with brakes; February-edge brake/breach <= 5%), re-run for that size if it is above 1.00%;
  - A2's forward test must be complete and passed (40 unseen trades averaging >= +0.10R). Until then attempt #2 stays at 0.5% exactly as my coach set it.
If NO size up to 1.25% delivers, the goal is out of reach for this rule by sizing alone, and I say so.

## What this test cannot do, written first
These eight windows are the best-case sample for this question: January, February and a trend-heavy March. More risk will look good on them almost by construction.
So this test can only tell me the MINIMUM size the goal would have needed on a friendly history. It cannot tell me that size is safe on an unfriendly one - the reshuffle and the
forward test are what stand between this table and my account.
My guess: 0.75% gets 2 of the 4 or 5 decided starts home in time (borderline); 1.00% gets all of them; no start touches a brake at any of the three sizes.
Nothing above has been run.

# RESULTS (run after commit d1a9acc). Full rulebook from each Monday 01-05..02-23, data to 03-25, costs on, brakes and finishing size on. 3 sizing policies; variant count stays 56.

| Risk (both phases) | Both phases within 1 month | Within 2 months (42 trading days) | Trading days to pass both, per start (01-05 ... 02-23) | Breach / -6% brake | Touched the -4% brake | Worst point of any start |
|---|---|---|---|---|---|---|
| 0.50% (reference, earlier test) | 0 of 8 | 0 of 4 decided | 49, 51, then not yet | 0 | 0 | -0.93% |
| 0.75% | 0 of 8 | 2 of 4 decided (4 undecided) | 26, 40, 46, then not yet (phase 2 at +1.2% to +4.2%) | 0 | 0 | -1.00% |
| 1.00% | 1 of 8 | 6 of 6 decided (2 undecided, both in phase 2 at +4.6%) | 14, 37, 38, 41, 36, 31, not yet, not yet | 0 | 0 | -1.87% |
| 1.25% | 2 of 8 | 8 of 8 | 14, 10, 35, 40, 35, 30, 27, 22 | 0 | 0 | -1.67% |
Phase 1 alone at 0.75%: 13, 10, 35, 33, 28, 25, 26, 21 trading days (every start finished phase 1). At 1.00%: 8, 10, 22, 30, 25, 22, 20, 15.

## Decision rule, applied
- 0.75%: (a) at least half of the decided starts within 42 days: 2 of 4 = exactly half -> yes, on the line; (b) no brake-stop or breach -> yes; (c) never touched the -4% brake -> yes.
  So by the rule the SMALLEST size that delivers the goal on this history is 0.75%.
- It is the weakest possible pass: the two starts that make it are the two that got all of January; the two decided starts that miss took 46 days and "not yet at 43".
  1.00% is the first size where the answer does not depend on having started in early January (6 of 6, slowest 41 days).
- The other two locks (written before, not reopened): 0.75% already passed the pessimistic reshuffle on 03-09; 1.00% passed its safety lines there but failed the "+15 points" line.
  A2's forward test is 18 of 40 trades. So: NOTHING changes in the account today. Attempt #2 stays at 0.5%, as my coach set it.

## What I now know about the wall
- It is a sizing wall, not a rule wall. The same trades that took 49-51 days at 0.5% take 26-46 at 0.75% and 14-41 at 1.00%, and in none of 8 x 3 runs did the account ever stand
  more than 1.9% under water. The rulebook has been using about a fifth of the room the challenge gives it.
- That is exactly the kind of sentence that gets accounts blown up, so the other half in the same breath: every one of these windows is January-to-March 2015, a period in which
  the rule made money. On such a history more size always looks free. The reshuffle with a zero edge says what it costs when the period is not friendly:
  my -6% brake ends the attempt about 9 times in 100 at 0.75% and 15 in 100 at 1.00% within 60 days (no breach, because the brake comes first).
- So the honest plan for the goal "both phases in about two months" is: 0.75% once the rule has earned it forward (40 unseen trades at +0.10R or better), with the brakes,
  0.50% inside the last 4R of a target, and no promise shorter than "about two months if the months are ordinary, three if they are flat".
- Cheapest lever: risk. Not because it is good, but because setups-per-week and bigger winners are both shut after 56 variants. If a second setup ever passes forward (N1 is
  at 4 trades, -2.34R), that would be the better lever: it adds R without adding risk per trade.

## For my coach to decide (I am not doing either by myself)
1. Whether attempt #2 should move from 0.5% to 0.75% when the forward test completes (22 more trades), or stay at 0.5% to the end as a pure "same rules" proof.
2. Whether the goal itself should read "about two to three months without breaching" for this rulebook.

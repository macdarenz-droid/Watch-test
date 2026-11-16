# Idea WS (idea 60): is the wider personal stop the right one of the two? - PRE-REGISTRATION (pushed before any code or count)
Sim clock Fri 2015-05-15 22:00 London. END 2015-05-16 (history to the clock).
Coach 05-15: "your personal stop is too tight for your size, not that size must drop - pick one (wider personal stop or smaller size), write why, and stick
with it for 20 live days before judging." I PICKED this morning, before the trade and before any simulation: personal stop 7% under the high-water, size
0.50% (reasons in the plan, section brakes). That choice is fixed for funded days 36-55 and this test cannot un-pick it for a better-looking number.
What the test is for: (a) SAFETY - a wider own stop moves me closer to the firm's line; that must be checked now, not after 20 days; (b) to put the road
not taken (smaller size) beside it once, honestly, so that the review after day 55 has a baseline that was written before the 20 days.
Did I look first (coach 05-12)? Yes, at the thing this is about: the runs of TS. In the clean TS run the lowest balance of any run was -5.7% with the stop
at -5%: runs end just past my own line, never near -10%. And the live record: deepest drawdown so far -1.63%, three full stops this week (-0.92% now).
## Definitions (bt/wider_stop.py; the TS machinery unchanged: same list, shift, seeds, corrected tail, payout rule, half size from 3% under the high-water)
- REF: stop 5%, size 0.50% (the plan until yesterday).
- WS1: stop 7%, size 0.50% (my choice).
- WS2: stop 5%, size 0.40% (the road not taken; 0.40% is the size that held my old 1.25% line in DC).
- WS3: stop 7%, size 0.40% (both at once - only to see whether I left safety on the table; not a candidate).
Each under T1 (real fills: my planning base from now) and T2 (plus a -3.07R jump day per 92 days, always against me); T3 for the safety line only.
## Hand-worked BEFORE the run (the P7 routine)
- Regression: REF must print exactly the clean TS figures: own stop 20.5% (T1) and 43.9% (T2), payout 31.6% and 19.9%, plain. Anything else = a bug; stop.
- Floor: the high-water never goes below 0 (a payout takes at most half of a balance under +4%), and near the stop I am at half size. So the lowest
  balance any run can show is: WS1 -7 - 3.07 x 0.25 = -7.77%; REF -5.77%; WS2 -5 - 3.07 x 0.20 = -5.61%; WS3 -7.61%. A print below these = a bug; stop.
  That floor already says the firm's -10% line cannot be reached in this model with a 7% stop: K1 is checked anyway.
## Kill lines for my choice WS1 (worse of plain and block)
- K1 SAFETY: account line breached in at most 1.0% of runs under T1, T2 and T3, and no run below -9%. If K1 fails, the 7% stop is withdrawn at once and I
  tell the coach - safety comes before the 20-day hold.
- K2 IT DOES ITS JOB: under T2 the own stop is reached at least 10 percentage points less often than REF.
- K3 NOT DOMINATED: WS2 must not beat WS1 on BOTH own-stop odds and median payout, under T1 and under T2. If the smaller size is better on everything,
  I chose wrong; I then say so to the coach and still hold the choice for the 20 days he set, unless he says otherwise.
Limits: same as TS - one jump observation, reshuffles, planning edge +0.18R by my own choice. A simulation of my own stop is partly a tautology: a wider
stop is hit less often by construction; K2 only asks whether "less" is big enough to matter, K3 whether it costs more than the alternative.
My guess, written now: WS1 own stop under T2 about 27% (K2 pass), payout a little above REF; WS2 own stop about 33%, payout about 80% of REF's (K3 pass);
lowest balance about -7.6%.

## Hand-checks against the print
- Regression (`python bt/wider_stop.py 2015-05-15 | grep REF`): T1 own stop 20.5%, payout 31.6%; T2 43.9%, 19.9% - exactly the clean TS figures. The pre-registration
  named END 2015-05-16 for the test and quoted the 05-15 figures for the regression; so the regression was run on END 2015-05-15 and the test on 05-16 (94 trades,
  today's stop included). Said here so the two ENDs are not a surprise.
- Floors: WS1 lowest -7.73% (floor -7.77%); REF -5.75% (-5.77%); WS2 -5.56% (-5.61%); WS3 -7.23% (-7.61%). No print below its floor.

## Results (run once; `python bt/wider_stop.py 2015-05-16`; figures copied from the print; all breached 0.0%)
| scenario | variant | own stop plain / block | median payout plain / block | lowest balance plain / block | days at half size plain / block |
|---|---|---|---|---|---|
| T1 real fills | REF 5%, 0.50 | 19.7% / 9.6% | 31.8% / 33.7% | -5.22% / -5.08% | 30% / 27% |
| T1 | WS1 7%, 0.50 (my choice) | 1.6% / 0.2% | 32.8% / 34.2% | -6.94% / -6.38% | 36% / 29% |
| T1 | WS2 5%, 0.40 | 6.2% / 2.3% | 28.3% / 29.4% | -5.08% / -4.61% | 25% / 19% |
| T1 | WS3 7%, 0.40 | 0.2% / 0.1% | 28.4% / 29.4% | -6.14% / -6.36% | 27% / 19% |
| T2 + jump 1/92 | REF | 43.5% / 31.6% | 20.5% / 22.8% | -5.38% / -5.75% | 34% / 35% |
| T2 | WS1 | 7.4% / 4.0% | 23.2% / 24.2% | -7.30% / -7.04% | 48% / 44% |
| T2 | WS2 | 20.2% / 12.9% | 19.6% / 20.9% | -5.56% / -5.42% | 35% / 32% |
| T2 | WS3 | 2.3% / 0.7% | 20.3% / 21.1% | -7.02% / -7.23% | 41% / 36% |
| T3 + jump 2/92 | REF | 67.0% / 57.0% | 11.1% / 12.6% | -5.46% / -5.67% | 33% / 36% |
| T3 | WS1 | 20.3% / 13.0% | 15.2% / 15.6% | -7.59% / -7.73% | 55% / 55% |
| T3 | WS2 | 40.3% / 32.4% | 12.5% / 13.3% | -5.24% / -5.46% | 39% / 39% |
| T3 | WS3 | 7.7% / 4.5% | 13.6% / 13.9% | -7.14% / -7.10% | 52% / 50% |

## Kill lines for WS1
| line | result | verdict |
|---|---|---|
| K1 safety: breached <= 1.0% in T1-T3, no run below -9% | 0.0%; lowest -7.73% | PASS |
| K2 own stop under T2 at least 10 points under REF | 36.1 points plain, 27.6 block | PASS |
| K3 not dominated by the smaller size | WS2 is worse than WS1 on own stop AND on payout in all four cases | PASS |
VERDICT: WS1 passes all three. The choice I made this morning stands, and it is the better of the two roads in this model: the wider stop cuts the own-stop
odds more than the smaller size does (T2: 7.4% against 20.2%) and pays more (23.2% against 19.6%), because the size is what earns.

## My guess against what happened
"WS1 own stop under T2 about 27%": 7.4%. "WS2 about 33%": 20.2%. "Lowest about -7.6%": -7.73%. For three tests I underestimated the tail; here I
overestimated the stop odds by a factor of three. My feel for these numbers is poor in both directions: the tool, not the guess.

## What I must not read into it
- It is partly a tautology: a line further away is touched less often. The real content is K3 (the wider stop beats the smaller size) and K1 (no run within
  2% of the firm's line).
- The price is in the last column: under T2 I would spend 44-48% of all days at half size (REF 34-35%), and a run that does end, ends 2% lower.
- NOT tested: the case where my edge is gone (zero edge). There a wider stop simply loses 2% more before it says stop. That is the true cost of this choice
  and it is why the A2 alarm at 100 live trades stays the separate judge of the edge.
- The firm's line: lowest -7.73% is 2.27% away from -10% in a model whose worst day is -1.54% at full size and -0.77% at half. Enough in the model; a day
  worse than anything in 94 days of history is not in it.
## Decision
Nothing changes from this morning: personal stop 7% under the high-water ($23,574.70 today), size 0.50%, half size from 3% under. Fixed for funded days
36-55 (1 done). The review after day 55 uses this table as its baseline. No judging before then.
Counts: ideas 60, variants 168 (WS1 WS2 WS3; REF is a re-run). Tested and kept: the wider personal stop - a risk-rule change chosen at the coach's
direction and checked, not an edge. Trading ideas adopted: still 0. On paper: UN3, PH2, MB1.

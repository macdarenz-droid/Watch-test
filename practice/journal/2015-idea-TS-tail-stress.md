# Idea TS (idea 59): does my funded plan survive the tail I measured in DC? - looked first, then PRE-REGISTRATION (pushed before any code or count of the test)
Sim clock Fri 2015-05-15 01:00 London. END 2015-05-15. Coach 05-14: keep size; the 1.25% line is my own buffer. This test does not reopen the size. It asks a
different thing: every survival simulation I have run (risk-size, SZ, forward-40) drew from a trade list whose worst day is -1.03R. DC showed a badly filled
stop is about -1.10R and that a jump minute could cost about -3R. My sims have the up-tail (01-15 +2.08R, 03-06 +2.11R are in the list) and no down-tail.

## Looked first (coach 05-12: look before testing) - `bt/day_cushion.py` tables, the 16 stop days and the jump day minute by minute
- The 16 engine stops, filled at the worst price of their minute: 0.6 to 13.7 pips beyond the stop; 13 of 16 within 4.2 pips. The two bad ones (03-19: 13.7,
  05-12: 9.2) were both stopped at 08:18-08:19 London, in the first 20 minutes. The opening minutes are where a stop fills worst. (2 cases; a note, not a rule.)
- The jump day 01-15, minute by minute: 1.17523 at 09:30 -> low 1.15675 at 09:35 (185 pips in 6 minutes), then back to 1.16866 at 09:37.
  I was SHORT that morning: it was my +2.08R day. A buyer's stop 40 pips under 1.1752 would have been touched in the 09:31 minute (low 1.17048) and filled
  there, about 7 pips beyond the stop - not 185 pips. So the open risk (b) I wrote in DC ("five jump minutes in a row understate it") is smaller than I
  feared: a stop is triggered in the FIRST minute that reaches it; the later minutes do not add. What I cannot measure: a minute with no price at all.
- The big-minute days were my good days: 01-15 +2.08R, 03-06 +2.11R, 01-22 +1.19R, 04-03 +0.07R, 02-06 -0.19R (the afternoon jumps came after my noon exit).
  The tail has paid me so far. That is the luck this test is meant to take out.

## Hypothesis
At 0.50% with my size rule (half at -3% from the high-water, stop at -5%) and my payout rule, the plan still holds when the down-tail is put in: stops as
badly filled as DC1 measured, plus a jump day of -3.07R now and then. "Holds" is defined by the kill lines.
## Method (bt/tail_stress.py; the engine A2 list to END, shifted to my planning edge +0.18R; 2,000 runs x 500 days; plain and 5-trade blocks; same seed for
all scenarios; the sim is the corrected one from bt/risk_size.py, brakes ON, 0.50%)
- T0: the list as it is (base).
- T1: after the shift, every full stop (R <= -0.95) is replaced by a random one of the 16 worst-in-the-minute results of DC1 (average -1.10R).
- T2: T1, and each day with chance 1/92 the day's result is replaced by -3.07R (one jump day per 92 days, every one of them landing on my stop - harsher
  than history, where the one jump day in 92 paid me).
- T3: T2 with the chance doubled (2/92).
The edge is NOT re-shifted after the tail is added: the tail is allowed to eat the +0.18R.
## Kill lines for "the plan holds" (worse of plain and block)
- K1: the account line (-10%) is breached in at most 1.0% of runs in each of T1, T2, T3.
- K2: under T2 my own -5% stop is reached at most 5 percentage points more often than in T0.
- K3: under T2 the median total payout is at least 80% of T0's.
If a line fails: no size change by me. It becomes a written proposal to the coach, with the numbers.
Limits said now: one jump day in 92 is one observation, so "1/92" is a guess with a wide error; T3 is there because of that. Reshuffles ignore that bad
days cluster beyond 5-day blocks.
My guess, written now: breach 0% everywhere (K1 pass); T2 own-stop odds about 8 points above T0 (K2 FAIL); payout about 75% of T0 (K3 FAIL).

## Results (run once; `python bt/tail_stress.py 2015-05-15`; figures copied from the print)
List: 93 A2 trades, avg +0.393R, shifted to +0.180R; 16 full stops; DC1 results avg -1.096R, worst -1.33R; jump day -3.07R.
| scenario | reshuffle | list avg | account line breached | own -5% stop | median payout | lowest balance, any run | worst single day | days at half size |
|---|---|---|---|---|---|---|---|---|
| T0 base | plain | +0.180R | 0.0% | 13.4% | 36.0% | -5.1% | -0.62% | 27% |
| T1 stops replaced by DC1 | plain | +0.203R | 0.0% | 5.1% | 43.9% | -4.7% | -0.67% | 20% |
| T2 + jump 1/92 (5.4 a run) | plain | +0.167R | 0.0% | 22.9% | 30.9% | -5.4% | -1.54% | 29% |
| T3 + jump 2/92 (10.8 a run) | plain | +0.132R | 0.0% | 45.6% | 20.1% | -5.7% | -1.54% | 34% |
| T0 base | block | +0.182R | 0.0% | 5.5% | 38.3% | -4.8% | -0.62% | 22% |
| T1 | block | +0.205R | 0.0% | 2.4% | 45.5% | -4.6% | -0.67% | 14% |
| T2 | block | +0.169R | 0.0% | 14.2% | 33.4% | -5.3% | -1.54% | 28% |
| T3 | block | +0.134R | 0.0% | 34.9% | 21.8% | -5.6% | -1.54% | 35% |
Kill lines by the letter: K1 PASS (0.0% breached) | K2 FAIL (own stop +9.6 points under T2) | K3 PASS (86% of T0).

## A FLAW IN MY OWN METHOD, found in the result (process mistake P7)
T1 made the list BETTER (+0.180R -> +0.203R; own-stop odds down from 13.4% to 5.1%). A stress cannot improve things, so the construction is wrong:
shifting the list to +0.18R takes 0.213R off every trade, so a full stop in the shifted list is already about -1.24R. Replacing those with DC1's results
(average -1.096R) made the stops MILDER. I wrote "after the shift" into the pre-registration without working one number by hand; a single line of arithmetic
would have shown it. The rule "hand-check the mechanics before totals" was skipped because this was "only a simulation". Logged as P7.
What that does to the lines (no re-run: three variants are used and the run was the run):
- T1 is VOID as a stress. What it does show: my planning-edge sims have always carried stops of about -1.24R, harsher than the badly filled stop DC1
  measured (-1.10R). The badly-filled-stop part of the tail was already inside my planning.
- T2 and T3 sit on top of the eased T1, so they UNDERSTATE. K2 fails even so, so the failure is safe to read. K3's "PASS at 86%" is not: against T1
  (its real base) T2's payout is 30.9 / 43.9 = 70% plain and 33.4 / 45.5 = 73% block. Honest reading: K3 FAILS too.
- K1 does not depend on the flaw: the lowest balance in 16,000 two-year runs is -5.7%.

## Verdict: the claim "the plan holds with the down-tail in" is KILLED on K2 (and on K3, read honestly)
## My guess against what happened
Breach 0%: right. Own stop +8 points: +9.5 plain, +8.7 block (understated). Payout 75%: 86% by the letter, 70-73% honestly. Close - but I did not foresee the flaw.

## What it means, said plainly
- The firm's line is not the thing at risk. With a jump against me every 92 days for two years, or twice that, no run got near -10%: my own -5% stop ends
  the run first, and one day never cost more than 1.54%. The coach's reading of DC stands: keep the size.
- What the tail threatens is my OWN stop. One jump day costs 3R at once = about a third of the way from a fresh high to half size. At one a quarter, the
  chance of hitting my -5% stop inside two years goes from about 13% to about 23% at the planning edge; at two a quarter, to about 46%.
- These jump rates are deliberately one-sided: in my 92 days the one morning jump PAID me. A fair coin would halve them. I do not know the true rate; one
  observation cannot tell me.
- Nothing here asks for a rule change. A smaller size would cut payouts for a risk that ends at my own stop, not at the account. No size trigger was reached.
- For the coach, as a note and not a proposal: my -5% stop is the line most likely to end this account's trading, and the plan says "stop" without saying
  what happens after. That sentence should exist before I ever need it. I will write it into the plan only if the coach wants it.
Counts: ideas 59, variants 162 (T1 T2 T3; T1 void). Adopted: 0. Process mistakes: 7.

# CLEAN RE-RUN (coach 05-14: "fix the method flaw, rerun TS cleanly with the same pre-registered kill lines, no changes to them") - METHOD FIX pushed before the run
Sim clock unchanged: Fri 2015-05-15 01:00 London. END 2015-05-15. Hypothesis, scenarios T0-T3, seeds, list, size rule and kill lines K1-K3: exactly as above.
The one thing fixed is HOW a badly filled stop is put into the shifted list:
- Wrong (first run): after the shift, a full stop was REPLACED by a DC1 result. The shift had already moved stops to about -1.23R, so they got milder.
- Right: a badly filled stop is the SAME stop plus the extra slippage DC1 measured. For each of the 16 stop days the extra is (worst-in-the-minute R minus
  engine R). In the shifted list every full stop (R <= -0.95) gets one of those 16 extras ADDED, drawn at random. The jump day stays "the day's result is
  replaced by -3.07R", as pre-registered.
Hand-worked BEFORE the run (the P7 fix; `bt/day_cushion.py` tables, arithmetic shown):
- 16 extras: average -0.0797R, between -0.003R and -0.305R. List: 93 trades, mean +0.3934R, shift 0.2134R, 16 full stops, shifted stops average -1.229R.
- Expected T1 list average = 0.180 + (16 / 93) x (-0.0797) = +0.166R. It must be BELOW +0.180R; if the run prints anything above, the method is wrong again.
- Expected T2 = 0.1663 x 91/92 - 3.07 / 92 = +0.131R. Expected T3 = 0.1663 x 90/92 - 2 x 3.07 / 92 = +0.096R.
  (The first run's T2 and T3 were +0.167R and +0.132R: the flaw had hidden about 0.036R of tail.)
- Each scenario must be worse than the one before on the own-stop line, or I stop and look before reading the kill lines.
Counting: T1 T2 T3 corrected are the same three definitions re-run at the coach's direction; I count them as 3 more variants anyway (162 -> 165), idea count stays 59.
My guess, written now: K1 pass (0% breached); own stop under T2 about +14 points plain (K2 FAIL); payout about 75% of T0 (K3 FAIL).

## CLEAN RE-RUN: results (run once; `python bt/tail_stress.py 2015-05-15`; figures copied from the print; `OLD_FLAWED=1` reproduces the first run exactly)
Hand-check against the print: T1 list average +0.166R (hand +0.166), T2 +0.131R (hand +0.131), T3 +0.096R (hand +0.096) - plain reshuffle. Every scenario is
worse than the one before on the own-stop line. The method now does what the pre-registration meant.
| scenario | reshuffle | list avg | account line breached | own -5% stop | median payout | lowest balance, any run | worst single day | days at half size |
|---|---|---|---|---|---|---|---|---|
| T0 base | plain | +0.180R | 0.0% | 13.4% | 36.0% | -5.1% | -0.62% | 27% |
| T1 badly filled stops | plain | +0.166R | 0.0% | 20.5% | 31.6% | -5.2% | -0.77% | 30% |
| T2 + jump 1/92 (5.4 a run) | plain | +0.131R | 0.0% | 43.9% | 19.9% | -5.6% | -1.54% | 34% |
| T3 + jump 2/92 (10.8 a run) | plain | +0.096R | 0.0% | 67.0% | 10.6% | -5.6% | -1.54% | 32% |
| T0 base | block | +0.182R | 0.0% | 5.5% | 38.3% | -4.8% | -0.62% | 22% |
| T1 | block | +0.168R | 0.0% | 9.3% | 33.8% | -5.3% | -0.77% | 27% |
| T2 | block | +0.133R | 0.0% | 30.7% | 22.3% | -5.5% | -1.54% | 35% |
| T3 | block | +0.098R | 0.0% | 56.1% | 12.5% | -5.7% | -1.54% | 36% |

## Kill lines (unchanged), clean run
| line | result | verdict |
|---|---|---|
| K1 account line breached <= 1.0% in T1, T2, T3 | 0.0% everywhere | PASS |
| K2 own -5% stop under T2 at most 5 points above T0 | +30.5 points plain (13.4% -> 43.9%), +25.2 block | FAIL |
| K3 T2 median payout >= 80% of T0 | 55% plain (19.9 / 36.0), 58% block | FAIL |
VERDICT (clean): the claim "the plan holds with the down-tail in" is KILLED on K2 and K3. Same verdict as the flawed run, but the size of the failure is
three times what the flawed run showed (+9.6 points there, +30.5 here). The flaw had been hiding most of it.

## My guess against what happened (clean run)
K1 pass: right. Own stop "+14 points": +30.5. Payout "75%": 55%. I underestimated the tail again, for the third test in a row.

## What it means, said plainly
- The firm's account line is still not at risk: 0 of 16,000 runs breached, lowest balance -5.7%, worst day -1.54%. My own -5% stop catches every run first.
  The coach's decision on size stands and nothing here argues against it.
- My own stop is much closer than I thought. At the planning edge, badly filled stops alone lift the chance of reaching it in two years from 13% to 21%;
  with one 3R jump against me per 92 days it is 44%, with two it is 67%. The payout I can expect falls to about half.
- WHY it is so sensitive: the tail takes the average from +0.180R to +0.131R. My plan is thin enough that 0.05R of edge roughly triples the chance of my own
  stop. That is the real finding. It is about how little edge the planning number holds, more than about jumps.
- What softens it, and how much I can lean on each: (a) my live average is +0.31R, not +0.18R - but the planning edge is deliberately low and I chose it;
  (b) the jump rate is one-sided on purpose; the one morning jump in my 92 days paid me +2.08R - but one observation proves no rate;
  (c) T1 alone (no jumps, just real fills) is the part I am surest of, and that part costs 7 points plain, 4 points block.
- NO rule or size change: no trigger of the size rule was reached, and the kill-line consequence I wrote was "a proposal to the coach", nothing more.
- PROPOSAL TO THE COACH (not acted on): (1) keep 0.50% and the size rule; (2) let me write the missing sentence in the plan - what happens after my own
  -5% stop (stop trading, written review, coach decides the restart) - because this test says that day is a real possibility, not a remote one;
  (3) from now my planning figures use the T1 list (real fills) as the base, so the quoted own-stop odds are 21% / 9%, not 13% / 5.5%.
Counts: ideas 59, variants 165 (T1 T2 T3 corrected counted again). Adopted: 0. Process mistakes: 7 (P7 fixed by this re-run; its routine - one hand-worked
line before any simulation is pushed - was used here and caught nothing wrong).

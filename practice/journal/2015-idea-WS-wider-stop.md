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

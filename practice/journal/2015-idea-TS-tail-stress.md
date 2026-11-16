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

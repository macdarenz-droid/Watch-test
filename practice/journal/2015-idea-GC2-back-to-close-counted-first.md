# Idea GC2: the night's move faded at the bell, with the sample counted first (idea 128; coach 08-12: next backtest)
Written Wed 2015-08-12 22:00 London, before any count or outcome.

## Is this allowed? Said first
GC (08-11) was killed FOR SAMPLE: 73 cases at a 20-pip night against a pre-written minimum of 80. Its `test` was never run, so no
outcome of this idea has been seen by me in any form. Re-registering it with the threshold chosen by a rule written BEFORE the count is
the fix GC's own file named ("count the cases before choosing thresholds"). It is not a re-cut after seeing results, because there are
no results. I keep everything else of GC unchanged.
What I HAVE seen that touches it: A2's paper mornings after big nights (07-28 fell on after a falling night; 08-11 and 08-12 went WITH
a strong night... no: 08-11 turned AGAINST a -48-pip night, 08-12 went WITH a +39-pip night). Mixed, and about A2, not GC.

## Hypothesis (GC's, unchanged)
The move from yesterday's 22:00 close to the 08:00 bell is partly taken back during the London morning, toward yesterday's close.

## Rule (GC's, unchanged except N)
Night move = open of the 08:00 candle minus yesterday's 22:00 London close. If |night| >= N: 08:00 market order back toward yesterday's
close, target = yesterday's close, stop 30 pips, out 12:00.
## Order of work
Step 1 counts only for N = 10, 15, 20. Step 2: N = the LARGEST grid value with 120+ trades and 50+ from 04-07; none -> killed for sample,
no outcome run. Step 3 one run.
THE THREE VARIANTS (named now): GC2-1 (judged) the chosen N; GC2-2 (dose) the next larger N on the grid (or 30 if the chosen one is 20);
GC2-0 (control) GC2-1's days traded WITH the night, stop 30, target the same distance beyond, out 12:00.
## Kill lines (four, all must pass, for GC2-1)
K1 average >= +0.10R after costs (1.0 + 0.1). K2 net above zero before 04-07 AND from 04-07. K3 stressed (2.0 + 0.5) average above zero.
K4 GC2-1 minus GC2-0 above zero, sign-flip p < 0.05.
My guess (GC's): positive after 04-07, negative before; K2 fails.

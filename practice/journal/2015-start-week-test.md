# "One pass isn't proof": my full rulebook started on every possible week of Jan-Feb - kill test written before any run
Clock Wed 2015-03-25 00:00 UTC (end of released data).

## What is run (bt/start_weeks.py)
The full rulebook, mechanically, costs on (1.0 pip spread + 0.1 slippage), as a fresh $25,000 two-phase challenge started on each Monday of January and February 2015:
01-05, 01-12, 01-19, 01-26, 02-02, 02-09, 02-16, 02-23 (8 starts). Each run trades forward through all the history I have lived (to Tue 03-24).
- Rule: A2 frozen (08:00 with the 3-day trend, stop 40 pips, out 12:00, one trade a day, every day).
- Challenge: phase 1 +8%, phase 2 +5% (balance resets to $25,000), minimum 5 trading days per phase, 5% daily and 10% max loss (floating included: the stop caps a day at about -1R).
- My sizing and brakes: finishing size 0.10 lots when the target is within 0.25R; brake to 0.5% at -4% of the phase start; stop trading at -6% (counted as a FAIL for me).
- Two sizings (2 policy runs; no new rule definition, variant count stays 56):
  P-A "as I traded attempt 1": 0.5% in phase 1, 0.75% in phase 2.
  P-B "as attempt 2 is set": 0.5% in both phases.
Reported per start: phase 1 day, both-phases day (in trading days and calendar days), passed within 1 month (21 trading days) / 2 months (42 trading days), lowest point, breach or brake.
Then: pass share within 1 and 2 months, breach rate, median days.

## What this can and cannot show (written first)
- The eight starts are NOT eight independent trials. They are eight windows cut from the same ~57 trading days and they share most of their trades. Eight passes would still be
  "the rule worked in early 2015". This is a check for one specific illusion: that my pass depended on WHEN I started.
- Late starts run out of data: a start on 02-23 has only 22 trading days to 03-24. A start is counted for "within 2 months" only if it has 42 trading days of data or has
  already passed; otherwise it is reported as UNDECIDED, not as a fail.
- January is in-sample, February contaminated, March lived-forward. No part of the rulebook is being chosen here, so there is nothing to fit - but there is nothing clean about the period either.

## Kill test (fixed now)
1. Safety: if ANY start hits the 10% or 5% limits, or my -6% brake -> the sizing in my plan is wrong; cut to 0.5% everywhere (if P-B is the one that fails: stop and review the rule).
2. The coach's goal ("both phases within 1-2 months"): of the starts that are decided for the 2-month window, at least HALF must pass both phases within 42 trading days.
   If fewer than half do, I stop describing 1-2 months as what this rulebook delivers and write the honest horizon into the plan.
   If NONE does, the rulebook at this size cannot meet the goal at all, and I say so plainly. (This test alone cannot justify a bigger size: the size tests decide that.)
3. Start-date luck: if my actual start (Mon 01-12, both phases in 50 trades) is the fastest or second-fastest of the decided starts, I record that my 10 weeks were a lucky draw of the calendar.

## My guess, written first
Phase 1 at 0.5% needs 16R. January gave about 15R, February 4.6R, March so far about 10R. So only a start in the first half of January can pass both phases within two months;
starts from 01-26 on will still be inside phase 1 when two months are up. I expect: within 1 month 0 of 8; within 2 months 1 or 2 of the 3-4 decided starts; no breach anywhere.
If so, line 2 is on a knife-edge and line 3 fires.
Nothing above has been run.

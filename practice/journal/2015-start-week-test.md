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

# RESULTS (run after commit c713832). Mechanical A2 + my sizing/brakes/finishing size, costs on, 8 start weeks, data to Tue 03-24. 2 policy runs; variant count stays 56.

## P-A: 0.5% in phase 1, 0.75% in phase 2 (as I traded attempt 1)
| Start (Monday) | Trading days of data | Phase 1 passed | Both phases passed | Within 1 month (21 days) | Within 2 months (42 days) | Lowest point |
|---|---|---|---|---|---|---|
| 01-05 | 56 | day 25 (02-09) | day 44 = 61 calendar days (03-06) | no | no (by 2 trading days) | 0.00% |
| 01-12 (my real start) | 52 | day 27 (02-17) | day 45 = 61 calendar days (03-13) | no | no (by 3 trading days) | -1.40% |
| 01-19 | 47 | day 40 (03-13) | not yet: phase 2 at +2.8% after 47 days | no | no | -0.67% |
| 01-26 | 42 | not yet | not yet: phase 1 at +7.8% after 42 days | no | no | -0.35% |
| 02-02 | 37 | not yet | phase 1 at +7.8% after 37 days | no | undecided | -0.22% |
| 02-09 | 32 | not yet | phase 1 at +7.5% after 32 days | no | undecided | 0.00% |
| 02-16 | 27 | not yet | phase 1 at +6.3% after 27 days | no | undecided | -0.16% |
| 02-23 | 22 | not yet | phase 1 at +6.3% after 22 days | no | undecided | 0.00% |
## P-B: 0.5% in both phases (as attempt 2 is set)
Same phase 1 column. Both phases: 01-05 start day 49 (68 calendar days, 03-13); 01-12 start day 51 (71 calendar days, 03-23); 01-19 start phase 2 at +1.9% after 47 days; the rest as above.

| Summary | P-A | P-B |
|---|---|---|
| Passed both within 1 month | 0 of 8 | 0 of 8 |
| Passed both within 2 months | 0 of 4 decided (4 undecided, all still in phase 1) | 0 of 4 decided |
| Breach (5% daily / 10% max) | 0 of 8 | 0 of 8 |
| Stopped by my -6% brake | 0 of 8 | 0 of 8 |
| Lowest point of any start | -1.40% | -0.93% |
| Trading days to pass both, starts that have passed | 44 and 45 (median 44.5) | 49 and 51 (median 50) |
| Trading days to pass phase 1 alone | 25, 27, 40; five starts not yet after 22-42 days | same |

## Kill test, line by line
1. Safety: PASS. No start came near a limit or my brake; the worst any start ever stood was 1.4% under water. The rulebook does not breach.
2. The goal "both phases within 1-2 months": FAIL, and the strict version of fail - NONE of the decided starts passes both phases within 42 trading days. The best two miss by 2 and 3
   trading days (61 calendar days), and they are the two starts that got all of January's trend. Every start from 01-19 on is slower; four of eight have not even finished phase 1.
   As written beforehand: this rulebook at this size cannot be described as a 1-2 month plan, and I say so plainly. This test does not justify a bigger size.
3. Start-date luck: FIRES. My real start (01-12) is the second-fastest of the eight. A start one week later is still in phase 2 today; two weeks later, still in phase 1.
   My ten weeks were close to the best the calendar offered.

## Three things I did not expect
- The mechanical rulebook from MY start date passes phase 1 on 02-17 (day 27). I passed it on 03-06 (day 39). The whole difference is my one discretionary skip (01-22, +1.18R):
  with it the balance crosses $27,000 on 02-17; without it I was $154 short that day, and then the four February losses came. One skipped trade cost me not 1.2R but 12 trading days.
  That is the strongest argument for "no skips" I have, and it is in my own account history.
- Speed is almost all January. Starts in February sit at +6.3% to +7.8% of phase 1 after 22-37 days - not failing, just slow, carried by March's trend runs.
- The lowest point of any start is tiny (-1.4%). The risk in this plan is not blowing up; it is taking a long time.

## What changes
- The plan's horizon line is rewritten: phase 1 about 5-8 weeks or more, both phases about 2 to 3.5 months, at 0.5% / 0.75%. "1-2 months" is retired as a description of this rulebook.
- Attempt #2 (started 03-24 at 0.5%) should be expected to take 2-4 months. Nothing about its rules or size changes.
- Reminder of what this was: eight overlapping windows of the same 57 days, half of them built or studied on. It removes one illusion (that my pass was typical) and proves nothing else.

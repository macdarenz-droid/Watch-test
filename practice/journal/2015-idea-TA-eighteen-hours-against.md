# Idea TA: skip A2 when the last 18 hours ran against it (idea 156; from journal/2015-09-04-replay-11-worst-paper-days.md, lesson [A],
# 6 of 11). Written Fri 2015-09-04 22:00 London, before any count or outcome.
OVERLAP stated first: NA (idea 103, killed twice) = skip when the NIGHT (00:00 -> 08:00 open) ran 15+ pips against A2. TA's window starts
at 14:00 the day before, so it adds yesterday's afternoon and evening - the part of the picture I saw on 07-08, 07-10, 08-25.
REPEAT LINE: if 70%+ of TA1's skipped days are also NA skip days (night <= -15 signed), TA is NA again -> killed as a repeat, no run.

## Rule (an A2 filter; London time)
move18 = (08:00 open - 14:00 open the previous weekday), signed by A2's side. Skip A2 when move18 <= -X.
ORDER OF WORK: counts for X = 20 / 30 / 40 / 50. X = the LARGEST that skips at least 15% of A2's days and at least 25 days. None -> killed.
EXPECTED SAMPLE: A2 follows the 3-day close, so its side is usually WITH the recent move; against by 30+ pips maybe 15-25% of days.
THE THREE VARIANTS (named now): TA1 (judged) X chosen; TA2 (dose) the next larger X (60 if the chosen is 50); TA0 (control) skip when
move18 >= +X (the last 18 hours ran WITH A2 by X).
Power: a skipped group of 25-50 days has an error of about +-0.3R to +-0.4R on its average. ANY PASS IS PROVISIONAL (a forward count
at most, with the coach's word; one paper line at a time is the rule, and three are running).
## KILL LINES (four, all must pass, for TA1). R = the engine's A2 R after costs: spread 1.0 + slippage 0.1 pips.
K1 the skipped days' A2 average below zero AND at least 0.30R below the kept days' average.
K2 the same sign (skipped below kept) before 04-07 AND from 04-07.
K3 TA1's kept-minus-skipped gap larger than TA0's.
K4 label shuffle (10,000) of TA1's gap: p < 0.10.
Plus the REPEAT line (checked on counts, before the run).
My guess: it fails K2 like NA did (the trend months paid A2 for buying dips), or it is NA again.

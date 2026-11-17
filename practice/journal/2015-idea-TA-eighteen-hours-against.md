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

## Counts and worked cases (tool output pasted by this command; before outcomes)
    A2 days with both candles: 173 (2015-01-06..2015-09-04)
    X = 20: skip 47 = 27% (before 2015-04-07 16, from 31) | also NA skip days (night <= -15): 29 = 62% | control skip 75
    X = 30: skip 36 = 21% (before 2015-04-07 12, from 24) | also NA skip days (night <= -15): 23 = 64% | control skip 61
    X = 40: skip 27 = 16% (before 2015-04-07 7, from 20) | also NA skip days (night <= -15): 16 = 59% | control skip 51
    X = 50: skip 22 = 13% (before 2015-04-07 5, from 17) | also NA skip days (night <= -15): 13 = 59% | control skip 40
    day    R  side   m18    na  late
    2015-07-08 -1.0    -1 -85.8 -10.0  True
    2015-07-10 -1.0    -1 -59.8 -25.0  True
    2015-08-25 -1.03     1 19.1 -29.3  True
    2015-08-26 -1.03     1 23.0 -31.9  True
    2015-09-01 -1.0    -1 -56.5 -65.1  True
    2015-07-24 -1.03     1 25.7 6.4  True
BY THE RULE WRITTEN FIRST: X = 40 (largest with 15%+ and 25+: 27 days, 7 / 20). TA1 = 40, TA2 = 50 (22 days), TA0 = with A2 >= 40.
REPEAT LINE: 16 of 27 (59%) are NA skip days -> under 70% -> TA goes on.
Worked cases against my eye: of the six lesson-[A] days, TA skips 07-08 (-85.8), 07-10 (-59.8), 09-01 (-56.5); it KEEPS 08-25 (+19.1),
08-26 (+23.0), 07-24 (+25.7): on those three the 18-hour NET ran with A2; what I saw was lower highs inside it, not a net move against.
So the rule catches 3 of my 6. Written before the run; the rule is not changed.
One run next: `python bt/eighteen_hours.py 2015-09-05 test 40 50`.

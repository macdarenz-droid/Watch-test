# Idea NP: skip A2 when it would enter at the night's far edge on its own side (idea 155; coach 09-04: next hypothesis from my own
# losing-trade review). Written Fri 2015-09-04 22:00 London, before any count or outcome.
SOURCE: journal/2015-08-11-review-A2-last-10-paper-losers.md: #2 "sold the bottom of a night-long fall", #8 "sold the low of a night
rally"; #3 and #4 "bought the top of a lively pre-bell rise / into a pre-bell spike". In each, the 08:00 open sat at the edge of the
00:00-08:00 range in A2's own direction: A2 bought the night's high or sold its low.
OVERLAP (stated first): NC (skip when the 07:00-08:00 hour ran 15+ pips A2's way; forward now) uses the hour's NET move; NA/NM (night
AGAINST A2) are the opposite sign; H (January) used YESTERDAY's range. NP uses the POSITION of the 08:00 open inside the whole night's
range. REPEAT LINE: if 70%+ of NP1's skipped days are also NC1 skip days (hour >= +15), NP is NC again -> killed as a repeat, no run.

## Rule (an A2 filter; London time)
pos = (08:00 open - night low) / (night high - night low), night = 00:00-08:00 London (M5 bid), turned to A2's side (for a sell, 1 - pos).
Skip A2 when pos >= 1 - Q (the open is in the outer Q of the night on A2's side).
ORDER OF WORK: counts for Q = 0.10 / 0.15 / 0.20 / 0.25. Q = the SMALLEST that skips at least 15% of A2's days and at least 25 days
(the most extreme version that still has a sample). None -> killed for sample.
EXPECTED SAMPLE: about 170 A2 days; the open sits at a night extreme often after a one-way night: my guess Q = 0.10 skips ~15-20%.
THE THREE VARIANTS (named now): NP1 (judged) Q chosen; NP2 (dose) the next SMALLER Q on the grid (or 0.05 if the chosen is 0.10);
NP0 (control) skip when the open is in the outer Q on the OTHER side (A2 enters at the night's far opposite edge).
Power: a skipped group of 25-50 days has an error of about +-0.3R to +-0.4R on its average. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for NP1). R = the engine's A2 R after costs: spread 1.0 + slippage 0.1 pips.
K1 the skipped days' A2 average below zero AND at least 0.30R below the kept days' average.
K2 the same sign (skipped below kept) before 04-07 AND from 04-07.
K3 NP1's kept-minus-skipped gap larger than NP0's.
K4 label shuffle (10,000) of NP1's gap: p < 0.10.
Plus the REPEAT line above (checked on counts, before the run).
My guess: killed by the repeat line, or K2 (chasing paid in the trend months).

## Counts (tool output pasted by this command; before outcomes)
    A2 days with both candles: 174 (2015-01-06..2015-09-04)
    Q = 0.10: skip 14 = 8% (before 2015-04-07 5, from 9) | also NC1 skip days (hour >= +15): 12 = 86% | control skip 17
    Q = 0.15: skip 19 = 11% (before 2015-04-07 7, from 12) | also NC1 skip days (hour >= +15): 17 = 89% | control skip 28
    Q = 0.20: skip 27 = 16% (before 2015-04-07 8, from 19) | also NC1 skip days (hour >= +15): 23 = 85% | control skip 38
    Q = 0.25: skip 37 = 21% (before 2015-04-07 13, from 24) | also NC1 skip days (hour >= +15): 29 = 78% | control skip 57
    day     R  side  pos  hour  late
    2015-07-21 -0.74    -1 0.22  -7.3  True
    2015-08-04 -0.53    -1 0.29   1.5  True
    2015-07-22 -1.03     1 0.75  21.7  True
    2015-07-24 -1.03     1 0.84  15.3  True
BY THE RULE WRITTEN FIRST: Q = 0.20 (smallest with 15%+ and 25+: 27 days). REPEAT LINE: 23 of 27 (85%) are also NC1 skip days -> 70%+
-> KILLED AS A REPEAT OF NC (idea 155), no outcome run, variants not counted. NC1 is already being judged forward; NP adds nothing.
The review's own cases do not even fit: 07-21 and 08-04 ("sold the bottom / the low") had the open at pos 0.22 and 0.29 on A2's side -
the NEAR edge, not the far one; 07-22 and 07-24 at 0.75 and 0.84, inside the range. My words in the review described the hour (NC's
ground), not the night's range. Two reviews in a row (SQ, NP) where my eye's description did not survive the tool's first count.

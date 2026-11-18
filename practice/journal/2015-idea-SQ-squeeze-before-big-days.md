# Idea SQ: big days start out of compression (H1 of journal/2015-09-02-three-hypotheses-from-two-months.md; idea 153; coach 09-03)
Written Thu 2015-09-03 22:00 London, before any count or outcome. My own sighting: the 08-20 -> 08-24 rise began out of four small-body
days (08-14..08-19) on the D1 chart; the late-July tight cluster also preceded the 08-10..08-12 rise.
Overlap: ND (breakout after one narrow day, Q x median) was killed for sample at 17-46 trades; QW (quiet week -> next week) found
persistence, not expansion (weekly scale, rank correlation +0.094); VL (A2 by range thirds) found no order. Nobody tested the DAILY
"narrowest of 5" claim on the next day's size.

## PART A - the trade form (as listed on 09-02), counted FIRST
NR5 day = yesterday's London-day range is the smallest of the last five London days (yesterday and the four before). Trade: the first M5
close beyond yesterday's high or low between 08:00 and 16:00, follow, stop 25, out 20:00. EXPECTED: ~20% of days, minus no-break days ->
~30-35 trades. LINE: under 80 trades (or under 35 from 04-07) -> KILLED FOR SAMPLE, no outcome run (plan, once-a-day rule).

## PART B - the claim itself, a volatility study (runs only if Part A is killed for sample; written now, before either count)
Measure for each London day D: ratio(D) = range(D) / median range of the 20 London days before D (all in pips, bid, 22:00-22:00).
THE THREE VARIANTS (named now): SQ1 (judged) days after an NR5 day; SQ2 (dose) days after an NR7 day (smallest of 7); SQ0 (control) days
after a WR5 day (yesterday the WIDEST of five) - if compression leads to expansion, SQ0 should show the opposite or nothing.
EXPECTED SAMPLE: SQ1 ~20% of ~170 days = ~34 days; SQ2 ~14% = ~24; SQ0 ~34. Weak power stated: with ~34 days the error on a mean ratio is
roughly +-0.15 (my guess from typical spread; the tool will print the real one).
KILL LINES (all four must pass, for SQ1; no R and no costs here - it is a size study, not a trade):
K1 SQ1's mean ratio >= 1.15 AND at least 0.15 above the mean ratio of all other days.
K2 SQ1's mean ratio above the other days' mean in BOTH periods (before 04-07 and from 04-07).
K3 label shuffle (10,000): SQ1's gap over the other days, p < 0.10.
K4 SQ1's share of BIG days (ratio >= 1.5) larger than the other days' share.
A pass is a description of volatility only; it is not a setup and changes nothing on paper or live without a separate pre-registered test.
My guess: Part A dies for sample; Part B shows a small expansion (ranges mean-revert to their median, so a narrow day is followed by a
wider one simply by regression) - K1 may pass by that alone; K3 and K2 decide.
NOTE on regression: a narrow day is below its median by definition; the NEXT day is measured against the same kind of median, so
regression does not automatically lift the next ratio above 1 - but day-to-day correlation of range (quiet follows quiet) pulls it down.

## PART A count (tool output pasted by this command)
    days 155 (2015-01-30..2015-09-03) | NR5 days 42 | with a break 08:00-16:00 (= PART A trades): 29 | from 2015-04-07: 21
    PART A sample line (80+ and 35+ from 04-07): FAIL -> killed for sample, no outcome run
PART A: KILLED FOR SAMPLE (29 trades, 21 from 04-07), no outcome run. As expected on 09-02 (~30-35).

## Worked case for PART B (tool check lines, before the run)
    day  ratio  nr5   nr7   wr5  late   yhi  ylo  rng  prng
    2015-08-17  0.642 True False False  True 1.119 1.11 66.1  90.9
    2015-08-18  0.741 True True False  True 1.112 1.106 76.3  66.1
    2015-08-19  1.202 False False False  True 1.109 1.102 116.4  76.3
    2015-08-20  1.341 False False True  True 1.113 1.102 137.4 116.4
    2015-08-21  1.466 False False True  True 1.124 1.111 159.5 137.4
READ: my chart sighting does not match the rule. 08-17 and 08-18 came after NR5 days and were SMALL themselves (ratio 0.64, 0.74); the
day before the 08-20 rise (08-19) was the WIDEST of five (08-20 is a WR5-follow day, ratio 1.34). I saw small BODIES on 08-14..08-18;
the rule measures RANGES. The expansion came two to three days after compression, not the next day. Written before Part B's run; Part B
is run as registered (next day only), not changed to fit this.
One run next: `python bt/squeeze.py 2015-09-04 runB`.

## PART B result (one run; tool output pasted by this command; a size study, no costs apply)
    SQ1 after NR5: n 42 (before 2015-04-07 15, from 27) | mean ratio 1.014 (+-0.19) vs others 1.161 | gap -0.147 | before -0.044 / from -0.210 | one-sided p 0.9401 | big days (>= 1.5) 10% vs 24%
    SQ2 after NR7: n 29 (before 2015-04-07 9, from 20) | mean ratio 1.011 (+-0.15) vs others 1.147 | gap -0.136 | before -0.147 / from -0.133 | one-sided p 0.8912 | big days (>= 1.5) 10% vs 22%
    SQ0 after WR5 (control): n 34 (before 2015-04-07 10, from 24) | mean ratio 1.216 (+-0.20) vs others 1.095 | gap +0.121 | before +0.138 / from +0.115 | one-sided p 0.1311 | big days (>= 1.5) 29% vs 17%
    (a size study: ranges in pips, bid; no costs apply) KILL LINES SQ1: K1 FAIL | K2 FAIL | K3 FAIL | K4 FAIL
Kill lines, each value against its threshold (SQ1), read from the lines above:
K1 mean ratio >= 1.15 AND >= 0.15 above others: 1.014 vs 1.161, gap -0.147 -> FAIL.
K2 above others in both periods: -0.044 / -0.210 -> FAIL.
K3 shuffle p < 0.10: 0.940 -> FAIL.
K4 bigger share of big days: 10% vs 24% -> FAIL.
VERDICT: KILLED on all four (idea 153; variants SQ1 SQ2 SQ0 counted; part A killed for sample, not run). The claim is backwards on this
history: after a narrow day the next day is SMALLER than usual, after a wide day it is WIDER (SQ0 +0.121, p 0.13, both periods). Ranges
persist day to day, the same thing QW saw week to week. 'Big moves start out of compression' was a story I read from bodies on a chart.

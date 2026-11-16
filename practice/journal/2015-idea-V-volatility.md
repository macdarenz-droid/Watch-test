# Volatility: how the London morning relates to recent range (Jan-Feb) + ONE stop/size test (written before any run)
Clock Thu 2015-03-19 00:00 UTC (end of released data). Jan-Feb only; March not used. 35 days have a 5-day range history.

## The study
My stop is a fixed 40 pips. Daily ranges are not fixed: the 5-day average daily range ran from 82 to 226 pips (mean 131; January 149, February 117).
The London morning (08:00-12:00 UTC): range mean 65 pips, median 56, from 33 to 210; net move (open to noon, either way) about 31 pips.
| The morning's size compared with... | Correlation with the morning's range | ...with the morning's net move |
|---|---|---|
| the 5-day average daily range | +0.04 | -0.06 |
| yesterday's daily range | +0.39 | +0.39 |
| today's Asia range (00-07) | +0.29 | +0.36 |

| Days grouped by 5-day average range | Days | Avg 5-day range | Avg morning range | Avg morning net move | A2: trades / win / avg R / full stops | 40 pips as a share of the daily range |
|---|---|---|---|---|---|---|
| Quiet third | 12 | 94 | 71 | 38 | 12 / 58% / +0.52 / 1 | 0.42 |
| Middle third | 11 | 124 | 51 | 21 | 11 / 64% / +0.27 / 0 | 0.32 |
| Wild third | 12 | 173 | 72 | 35 | 12 / 67% / +0.55 / 2 | 0.23 |

What it says (35 days - small):
1. The size of the London morning has NO relation to the 5-day average range (+0.04). Quiet weeks and wild weeks had the same average morning (71 vs 72 pips).
   The extra range of wild weeks happened outside my window (the US session and the evening - like last night).
2. It has a modest relation to YESTERDAY's range (+0.39) and to this morning's Asia range (+0.29 to +0.36): volatility that is one day old, not one week old.
3. A2 did about equally well in quiet and wild weeks (+0.52R vs +0.55R); full stops were rare everywhere (3 in 35).
So the textbook idea "scale the stop to the average range" has little to stand on for a four-hour morning trade. If anything matters it is yesterday's range.

## The test: idea V "stop or size by volatility" (ideas -> 21). Entries and exit time exactly A2 (08:00, 3-day trend, close 12:00, costs on).
Hypothesis: adapting the stop (or the size) to recent volatility gives a better ride - more net R per unit of drawdown - than a fixed 40 pips, without giving up profit.
Variants (48, 49, 50), no others afterwards. Multipliers are set so the AVERAGE stop stays about 40 pips: the test only changes how the 40 is spread across days.
- V1: stop = 0.30 x the 5-day average daily range, limited to 25-70 pips; same $125 risk (so smaller size when the stop is wider).
- V2: stop = 0.32 x yesterday's daily range, limited to 25-70 pips; same $125 risk.
- V3: stop stays 40 pips; SIZE = normal x (131 / the 5-day average range), limited to 0.6x-1.5x (smaller in wild weeks, bigger in quiet ones). Results in units of the normal $125.
(Days without a 5-day history use plain A2.)

Kill tests (fixed now) - judged on drawdown AS WELL AS R, as my coach asked. Score = net R / max drawdown.
Build - January: a variant survives only if score >= 1.25 x A2's score AND net R >= 95% of A2's net R. Highest score among survivors = the candidate.
Check - February (CONTAMINATED), all three shown, only the candidate claimed: the same two lines against A2's February numbers.
(Same trades as A2 in every variant, so there is no "fewer trades" illusion to guard against here.)
What a pass earns: a forward paper tag. It cannot change my stop or size.

## My prediction, written first
From the study: V1 and V3 use the measure that has nothing to do with the morning, so they should just add noise (V1 may even be worse: wider stops in January's wild weeks where
A2 was rarely stopped anyway, so it only shrinks the winners in R). V2 has a real, if modest, relation behind it and is the only one I give a chance.
Both months are contaminated; the multipliers come from the two-month averages.
Nothing above has been run.

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

# RESULTS of idea V (run after commit f6838ac). V1/V2/V3 = variants 48/49/50; ideas 21. Costs on, same entries and noon exit as A2. Jan-Feb only, one month per run (bt/ab_score.py); March not used.
(A2 reads +14.89R / +4.67R here instead of +14.79R / +4.64R because this run sizes lots to three decimals instead of two; same trades. All rows use the same rounding.)

| Month | Rule | Trades | Win rate | Avg R | Net R (vs A2) | Max DD | Score = net R / max DD (vs A2) | Full stops | Worst trade |
|---|---|---|---|---|---|---|---|---|---|
| Jan (build) | A2: fixed 40 pips | 19 | 74% | +0.78 | +14.89 | 1.34R | 11.1 | 2 | -1.00R |
| Jan (build) | V1: stop 0.30 x 5-day avg range | 19 | 74% | +0.85 | +16.13 (108%) | 1.33R | 12.1 (1.09x) | 2 | -1.01R |
| Jan (build) | V2: stop 0.32 x yesterday's range | 19 | 74% | +0.71 | +13.41 (90%) | 1.75R | 7.6 (0.69x) | 3 | -1.01R |
| Jan (build) | V3: 40 pips, size by volatility | 19 | 74% | +0.86 | +16.32 (110%) | 1.23R | 13.3 (1.19x) | 2 | -0.91R |
| Feb (CONTAMINATED) | A2: fixed 40 pips | 20 | 55% | +0.23 | +4.67 | 1.87R | 2.5 | 1 | -1.03R |
| Feb (CONTAMINATED) | V1 | 20 | 50% | +0.19 | +3.80 (81%) | 2.18R | 1.7 (0.70x) | 3 | -1.05R |
| Feb (CONTAMINATED) | V2 | 20 | 50% | +0.17 | +3.46 (74%) | 2.06R | 1.7 (0.67x) | 4 | -1.05R |
| Feb (CONTAMINATED) | V3 | 20 | 55% | +0.24 | +4.86 (104%) | 2.53R | 1.9 (0.77x) | 1 | -1.42R |

## Build (January): NO SURVIVOR
Needed a score 1.25x A2's with at least 95% of its net R. V1 1.09x, V3 1.19x (both a little better, neither enough), V2 0.69x (worse on both R and drawdown).
## February, for the record: all three are WORSE than the fixed stop on drawdown and score
- V1 and V2 tighten the stop in a quiet market (to 25-35 pips) and get stopped 3-4 times instead of once: the morning's wiggle does not shrink when the daily range does - which is
  exactly what the study said (correlation +0.04).
- V3 keeps the stop but trades bigger in quiet weeks, so its worst trade becomes -1.42R and the drawdown grows from 1.87R to 2.53R.

## Against my prediction
I gave V2 (yesterday's range) the only chance because it had the one real correlation (+0.39). It was the worst of the three in both months. A correlation of 0.39 between yesterday's
range and this morning's range is not enough to place a stop by: it moved the stop the wrong way about as often as the right way.

## Verdict: closed. The fixed 40 pip stop and fixed 0.75% size stay.
- For a four-hour London trade the morning's own noise is fairly constant (about 65 pips of range) whatever the week's average range is doing. A fixed stop is the right shape for it.
- The risk that volatility does bring - evenings like 03-18, 400 pips in three hours - is not handled by a wider stop at all. It is handled by not being in the market: flat at noon.
- Small comfort on record: A2 did equally well in quiet and wild weeks (+0.52R / +0.55R), so a wild week is not a reason to stand aside or to shrink.
- Counts: ideas 21, variants 50.

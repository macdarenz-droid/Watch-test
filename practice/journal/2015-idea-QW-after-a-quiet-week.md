# Idea QW: volatility after a quiet week (idea 111; coach 07-23: something not studied). Written Thu 2015-07-23 22:00 London, before any code.
Not studied before: VL looked at A2's results by the last days' ranges; the 07-14 study found big DAYS follow big days. Never weeks.

## Hypothesis (one, and it can be wrong in two directions)
Quiet persists: after a quiet week the next week is quiet too. (Trader folklore says the opposite, "quiet before the storm". My only
evidence, the daily clustering of 07-14, points to persistence, so that is what I state.)

## Measures (fixed now)
Week range = highest high minus lowest low from the week's first candle to its last, in pips. Only weeks with 5 trading days.
- QW1 (judged): rank correlation (Spearman) between a week's range and the NEXT week's range, all pairs of consecutive full weeks.
- QW2: a week is QUIET when its range is under the median of the 4 weeks before it. Next week's range divided by that same median,
  averaged after quiet weeks against after the other weeks.
- QW3: the same as QW1 on weeks cut Wednesday-to-Tuesday (a second, shifted cut of the same days: a check, not new data).
Three measures, no more. No trade, so no costs; this is a fact about the market, and I say at the end whether any rule could use it.

## Cases before outcomes
Count full weeks, consecutive pairs and quiet weeks first. About 28 weeks exist. Under 20 pairs -> not judgeable.
Power, written first: with about 26 pairs a rank correlation has to be around +0.26 or more to reach a one-sided p of 0.10.
A true but mild persistence (say +0.15) will NOT show. So this test can find a strong effect or nothing.

## Kill line
Persistence is KILLED if QW1's correlation is at or under +0.20, or its one-sided permutation p (10,000 shuffles) is 0.10 or more.
If QW1 is at or under -0.20 with p <= 0.10 the other way: the folklore (expansion after quiet) is what the data say, and I report that.
Anything between: "no relation I can see in 28 weeks", which is an answer.
Whatever comes out is a description. It opens no route and changes no rule.
My guess: weak positive, around +0.2, not past the line.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/quiet_week.py 2015-07-24 count` (no outcomes).
- Full Mon-Fri weeks: 28 (01-05..07-13), 27 consecutive pairs. Wed-Tue weeks: 28, 27 pairs. QW2: 23 weeks have a 4-week median and a
  next week: 11 quiet, 12 other. Judgeable by my line (>= 20 pairs).
- Worked case: the first full week, Mon 01-05 .. Fri 01-09, range 221.9 pips (high minus low of the whole week).

## Result (one run)
Tool: `python bt/quiet_week.py 2015-07-24 test`. Week ranges in order (pips): 222 411 565 325 242 172 171 220 401 444 556 285 314 468 328
240 471 325 336 447 190 493 302 247 280 324 299 369. Median week 324 pips.
| measure | cases | result | one-sided p, persistence | p, expansion |
|---|---|---|---|---|
| QW1 Mon-Fri weeks, rank correlation with the next week (JUDGED) | 27 pairs | +0.094 | 0.32 | 0.68 |
| QW3 Wed-Tue weeks (shifted cut, same days) | 27 pairs | +0.201 | 0.15 | 0.85 |
| QW2 next week / 4-week median: after QUIET weeks | 11 | 0.83 (median 0.75); again under the median 8 of 11 | | |
| QW2 the same after OTHER weeks | 12 | 1.35 (median 1.10); under the median 4 of 12 | | |
**BY THE LINE WRITTEN FIRST: PERSISTENCE IS KILLED** (QW1 +0.094, line above +0.20 with p < 0.10). The folklore is not supported either:
no sign of expansion after quiet (after 11 quiet weeks only 3 next weeks were above the median).
Honest reading: 1. In 28 weeks I can see no relation between one week's range and the next that I could defend. 2. QW2 leans toward
persistence (8 of 11 against 4 of 12) and QW3 is right at +0.20; I wrote that a mild persistence would not show at this sample, and
this is what "would not show" looks like. I do not promote the lean: QW1 was the judged measure and it failed. 3. The daily clustering
of 07-14 (big day after big day) does not carry up to weeks in any way I can measure. 4. No rule could use this even if it were true:
it is about size, and none of my tests found a way to earn from size without direction (BK).
Counts: idea 111; variants 307-309.

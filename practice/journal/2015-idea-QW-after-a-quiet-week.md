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

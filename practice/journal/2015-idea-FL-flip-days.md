# One lesson from the 20-trade review -> one test: the first day after the signal flips. HYPOTHESIS AND KILL TEST WRITTEN FIRST (nothing has been run)
Clock Thu 2015-04-09 01:00 London (end of released data). Build = ALL lived history 01-06 .. 04-08 (explicit end date = the clock), shown by period; costs on; London time.

## The lesson
In my last 20 trades, three of the four full stops came on the first day after the 3-day trend signal changed side (03-19, 03-27, 04-08). On those mornings the rule has just
switched from selling to buying or back - usually because one big day (a spike, a squeeze) dragged the close across the level it is compared with - and the market has not
yet shown that it means it.

## What I already know (method rule: count the feature on ALL history before testing anything from a review)
From my own live results, counted by hand before writing this: there have been 12 flip days so far. The six in January-February made +2.29R (five winners);
the six in March-April made -2.62R (three full stops). Together about -0.03R per flip day, against about +0.45R per trade overall.
So the feature does NOT agree with itself across the two halves of my history. By my own method rule that is a warning that the review showed me a recent streak, not a trait.
I test it anyway, once, properly, because it is the cleanest observation in the review (defined by the rule's own signal, no threshold) - and I say now that I expect it to fail
the consistency line.

## Hypothesis
A fresh flip of the 3-day signal is unreliable on its first day; the A2 trade on that day has clearly lower expectancy than on other days, in every part of my history.
Skipping it (or waiting for the signal to hold a second day) raises avg R without lowering net R.

## Variants (87, 88, 89; ideas -> 34), no others afterwards. Everything else exactly A2.
- FL1: no trade on the first day after the signal changes side.
- FL2: no trade on the first TWO days after it changes side.
- FL3: on the first day after a change, trade the OLD side (the signal must hold for two days before I follow it).

## KILL TEST (explicit). The build can only kill; a survivor gets a forward paper tag (a filter: no adoption question before 200 forward trades).
A variant survives only if ALL:
  K1. on all history its avg R per A2 signal day (a skipped day counts 0R) is at least A2's + 0.05R;
  K2. the days it changes (skips, or trades the other way) are WORSE under A2 than the days it leaves alone, by at least 0.3R on average;
  K3. consistency: that is true in at least 2 of the 3 periods (January, February, March-to-now), and in no period are the changed days better than the others by more than 0.3R;
  K4. it changes at least 10 days and leaves at least 60% of the days alone.
My guess: K3 fails for FL1 and FL2 (January-February flip days were winners); FL3 fails K1 (trading the old side after a real turn is how 01-27 and 03-17 would go wrong).

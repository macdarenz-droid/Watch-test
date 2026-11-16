# Process changes (coach, 2015-04-07) + a second-setup test on the WIDENED build. HYPOTHESIS AND KILL TEST WRITTEN FIRST (nothing has been run)
Clock Wed 2015-04-08 01:00 London (end of released data).

## Two process notes from my coach, and what I change
1. "Builds on January only are ~20 days: too small to trust either way. Widen the build to all the history you have before judging."
   Agreed, and it follows from my own sample-size note (19 trades can only see a gap above 1R). From today the BUILD is every lived day before the clock (01-06 .. 04-07 today,
   65 A2 trade days), always shown month by month so one month cannot carry the result. Consequences I accept with it:
   - there is no "clean check month" any more - March and April are build like the rest; a research script is given the clock date as its explicit end;
   - the build still only KILLS or lets through; whatever survives goes to a forward paper tag under the sample-size rule (200 forward trades for a filter, 100 for a same-trade
     change or a stand-alone setup). Nothing is adopted from a backtest.
   - variants closed on January alone stay closed. I am not re-running 83 old variants on the wider build: that would be a sweep under another name.
2. "Max 3 variants per idea; the 16-exit scale-out test was a sweep."
   For the record, so the count is honest both ways: the scale-out test ran 3 variants (SO40, SO20, SO40BE). "16" was my running total of exit variants across six separate
   exit ideas since January. But the point stands and I take it: six ideas on one lever, each with its own three variants, IS a sweep in slow motion.
   So: the exit/stop lever is CLOSED. I open no further exit or stop idea unless something new is learned forward (not from another look at the same days).
   Same for entry-time and entry-price. What is left open is what the plan actually lacks: a second, different setup.

## The test: idea RF "fade the edge of the box" - a stand-alone second setup (ideas -> 33)
Where it comes from: A2 is a trend rule and earns about nothing in sideways weeks (February; the last two weeks). Every filter that helped in a box hurt in a trend.
Instead of filtering A2, a separate setup that only exists in a box: when the last five closes have gone nowhere (my efficiency measure under 0.5, already defined for F1)
and London opens near the top or bottom of the last five days' range, trade BACK toward the middle. Different logic from A2 (mean reversion, not trend) and it can disagree with it.
Not from a "best N vs worst N" look. What I know that biases me: February's box (1.127-1.145) turned at its edges several times, so I expect February to flatter this.

Setup (London time; one trade a day; stop 40 pips; $125; close 12:00; costs on):
at 08:00, if the 5-day efficiency is below 0.5 AND the 08:00 price sits in the top Q of the range of the previous five trading days -> SELL; in the bottom Q -> BUY; otherwise no trade.
Variants (84, 85, 86), no others afterwards: RF25 (Q = 25%), RF15 (Q = 15%), RF33 (Q = 33%).

## KILL TEST (explicit) - build = ALL lived history 01-06 .. 04-07, shown by month
A variant survives only if ALL:
  K1. at least 15 trades on the build;
  K2. avg R >= +0.20R after costs;
  K3. net R still above 0 with its best trade removed;
  K4. not negative in more than one of the calendar months in which it trades at least 3 times;
  K5. independence from A2 on shared days: correlation of daily R <= +0.30, and on A2's losing days its net R >= 0.
No survivor -> the three variants are closed. A survivor is NOT traded: it earns a forward paper tag, judged at 100 forward trades (avg >= +0.15R at two standard errors,
drawdown <= 4R, K5 again), and it cannot touch the funded account or its size before that plus a separate risk question (two positions, one daily loss budget).
My guess: enough trades only for RF33; February good, January and March bad (fading edges inside what was really a trend); K4 or K2 fails.

# RESULTS of idea RF (run after the pre-registration commit). RF25/RF15/RF33 = variants 84/85/86; ideas 33. Build = all lived history 01-06 .. 04-07 (A2: 66 trade days, +0.47R avg).
Costs on, $125 risk, London time (bt/range_fade.py, explicit end date = the clock).

| Variant | Trades | Win rate | Avg R | Net R | Max DD | Net R without its best trade | By month (trades, net R) | Same side as A2 / opposite | Corr with A2 |
|---|---|---|---|---|---|---|---|---|---|
| RF25: fade the outer 25% of the 5-day range in a crooked week | 9 | 22% | -0.60 | -5.36 | 5.54R | -5.70 | Feb 5: -1.99 / Mar 3: -3.04 / Apr 1: -0.33 | 1 / 8 | -0.48 |
| RF15: outer 15% | 2 | 0% | -1.02 | -2.03 | 2.03R | -1.03 | Mar 2: -2.03 | 0 / 2 | - |
| RF33: outer 33% | 16 | 19% | -0.49 | -7.88 | 7.88R | -8.22 | Jan 1: -0.04 / Feb 10: -4.34 / Mar 3: -3.04 / Apr 2: -0.47 | 3 / 13 | -0.25 |

## Kill test, applied
- K1 (at least 15 trades): only RF33 has them.
- K2 (avg R at least +0.20R): -0.60, -1.02, -0.49 -> all FAIL, badly.
- K3, K4: negative with or without the best trade, negative in every month it traded.
=> NO SURVIVOR. Closed. Not a setup; nothing to tag.

## What I learned - and my guess was wrong in the useful direction
- I expected February to flatter this (the box "turned at its edges"). It lost 4.3R in 10 February trades. The box did turn at its edges - in the NEW YORK afternoon.
  In the London morning price arriving at the edge of a five-day range kept going, at least until noon.
- On 13 of RF33's 16 days it stood on the opposite side to A2, and A2 won 9 of those. The London morning is a continuation window even inside a sideways market:
  that is one more piece of evidence about WHY the frozen rule works, from a test built to do the opposite of it.
- So "A2 is a trend rule that earns nothing in a box" needs correcting in my own head: it earned +0.23R per trade in February, and the mirror-image rule lost twice that.
  A2 is a London-morning continuation rule; trend months just make the continuation bigger.
- A second setup is still missing. Mean reversion in the same window is now ruled out; the earlier search ruled out the Asia break (same bet), the ignition candle and the
  NY fade (dead forward). If a second setup exists for me it is in a different window with different logic, and I have no observation yet that points at one. I will not invent
  one to have something to test.
- Counts: ideas 33, variants 86.

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

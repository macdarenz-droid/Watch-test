# Idea RG: the signal no longer picks the safe side - a regime change, or noise? PERIODS AND KILL TEST WRITTEN BEFORE ANY CODE
Clock Fri 2015-06-26 22:00 London (end of released data). After funded day 66. Coach 06-26: "test whether that's a regime change or noise. split your
history into periods, write the kill test first, max 3 variants."
June goal: every number and every test rule gets one worked case before it is pushed.

## What is measured (fixed now)
From idea CO's control (both sides traded from the 08:00 open, 40 pip stop, noon exit, costs on), one number per day:
SIDE ADVANTAGE = R of my side minus R of the other side. It is what the signal is worth that morning over a coin.
Worked case from CO's table: before funding my side averaged +0.531R and the other side -0.467R -> side advantage +0.998R a day; on the funded days
+0.037R and -0.055R -> +0.092R a day. Wed 06-23: -1.03R against +1.08R -> -2.11R for that day.
All 124 A2 days to END 2015-06-27.

## The two stories
- NOISE: the side advantage has ONE true average over the whole history; the months differ only by the luck of which days fell in them.
  If so, the best estimate of what the signal is worth is the average of ALL days, and the first months were lucky and the last months unlucky.
- REGIME CHANGE: the true average was high early and is low now. If so, the best estimate of what the signal is worth today is the recent one.
The test asks one thing: if the days were dealt into the periods at random, how often would the periods differ as much as they do? (A permutation
test: 20,000 random re-orderings of the same 124 daily numbers; p = the share of re-orderings with a statistic at least as large as the real one.)

## Variants (3) = three ways of splitting, chosen before any run and none of them fitted to the picture
- RG1 halves: the first 62 days against the last 62. Statistic: first-half mean minus second-half mean.
  (Not the funding date and not "May-June": I have seen where the weak months are; a split chosen there would flatter the regime story.)
- RG2 calendar pairs: Jan-Feb / Mar-Apr / May-Jun. Statistic: the largest pair mean minus the smallest.
- RG3 a slide: the correlation between the side advantage and the day's number (1..124). Statistic: that correlation, tested as "more negative than chance".
Also printed, not judged: the same three with 5-day blocks kept together (in case neighbouring days are alike), and the stop asymmetry
(other side stopped minus my side stopped) by period.

## Kill test for the claim "REGIME CHANGE, not noise"
- K1: RG1 p < 0.05.   K2: RG2 p < 0.05.   K3: RG3 p < 0.05.
- Three looks at one question: the claim SURVIVES only if at least TWO of the three pass AND the smallest p is under 0.017 (0.05 / 3).
  Otherwise it is KILLED: "cannot be told from noise on 124 days".
Worked case for the lines (arithmetic): the side advantage of one day has a standard deviation of about 2R (two results of about 1R each that move
against each other). Halves of 62 days: the difference of two means is known to about 2 x sqrt(2 / 62) = 0.36R. If the first half averages about
+1.0R and the second about +0.1R, the difference 0.9R is 2.5 of those: p about 0.01 -> K1 passes. A difference of 0.5R would give p about 0.16 -> fail.

## What each outcome means - written now; NO live rule changes from either (coach: not until a test says so)
- SURVIVES (regime change): the honest expectation for A2 is the recent one, about a coin's - lower than my planning edge of +0.18R. Then the size
  test (SG) and the money guard (GD) are to be read on their low rows (+0.10R, 0.00R), which they already contain: at zero edge the guard ends the
  account's trading at about -5% in about three runs out of four. I would ask the coach one question: whether to write a monitor now ("the side
  advantage over the last 60 trades") with a line at which A2 goes to paper, instead of waiting for the lived average to cross W1.
- KILLED (noise): the best estimate is the whole record, the monthly picture is luck both ways, and the instruction of 06-02 stands exactly as it
  is: planned size, judge after a few hundred lived trades.
Either way a test on 124 days decides between stories, not between futures: a real regime can end, and noise can look like a regime.
Worked expectation, written now: halves about +1.0R against about +0.1R -> p about 0.01; the slide clearly negative; the calendar pairs significant.
I expect the claim to SURVIVE - and I do not like it.
Counts when run: idea 92, variants 256-258.

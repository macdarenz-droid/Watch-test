# Idea RG: the signal no longer picks the safe side - a regime change, or noise? PERIODS AND KILL TEST WRITTEN BEFORE ANY CODE
Clock Fri 2015-06-26 22:00 London (end of released data). After funded day 66. Coach 06-26: "test whether that's a regime change or noise. split your
history into periods, write the kill test first, max 3 variants."
June goal: every number and every test rule gets one worked case before it is pushed.

## What is measured (fixed now)
From idea CO's control (both sides traded from the 08:00 open, 40 pip stop, noon exit, costs on), one number per day:
SIDE ADVANTAGE = R of my side minus R of the other side. It is what the signal is worth that morning over a coin.
Worked case from CO's table: before funding my side averaged +0.531R and the other side -0.467R -> side advantage +0.998R a day; on the funded days
+0.037R and -0.055R -> +0.092R a day. Tue 06-23: -1.03R against +1.08R -> -2.11R for that day.
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

## Mechanics check (kill test pushed first in commit 2cf34dd; a weekday label in the worked case corrected there: 06-23 was a Tuesday)
My side against the engine's A2: largest difference per day 0.000R on 124 days. `--check 2015-06-23`: -1.03R against +1.08R = -2.11R, as worked.
Side advantage over all 124 days: mean +0.513R a day, standard deviation 1.80R (I had worked with about 2R).

## RESULTS (one run: `python bt/regime_or_noise.py 2015-06-27`; 20,000 re-orderings per test; figures copied from the print)
| period | days | side advantage a day | my side | the other side | stop asymmetry (other stopped minus mine, per day) |
|---|---|---|---|---|---|
| first half 01-06 .. 04-01 | 62 | +0.982R | | | +0.39 |
| last half 04-02 .. 06-26 | 62 | +0.044R | | | -0.02 |
| Jan-Feb | 39 | +0.898R | +0.502R | -0.396R | +0.33 |
| Mar-Apr | 44 | +0.718R | +0.373R | -0.345R | +0.30 |
| May-Jun | 41 | -0.073R | -0.071R | +0.002R | -0.07 |
By month: Jan +1.30 (19 days) | Feb +0.52 (20) | Mar +1.12 (22) | Apr +0.31 (22) | May -0.07 (21) | Jun -0.08 (20).
| variant | statistic | permutation p | p with 5-day blocks | kill line |
|---|---|---|---|---|
| RG1 halves, first minus last | +0.938R | 0.0019 | 0.0014 | K1 PASS |
| RG2 calendar pairs, largest minus smallest | +0.970R | 0.0404 | 0.0247 | K2 PASS |
| RG3 slide (correlation with the day number, sign turned) | 0.263 | 0.0009 | 0.0005 | K3 PASS |
Three of three pass; the smallest p (0.0009) is far under the multiple-looks line (0.0167).
VERDICT: the claim "REGIME CHANGE, not noise" SURVIVES its kill test. Dealt at random into the two halves, the same 124 days would differ this much
about once in 500 times.

## Expectation against the run
"Halves about +1.0R against +0.1R, p about 0.01": +0.98R against +0.04R, p 0.002. "The slide clearly negative, the pairs significant": yes, yes.
"I expect the claim to survive - and I do not like it": it did.

## What it means, said as plainly as I can
- The 3-day signal was worth about +0.9R a morning over a coin from January to about mid-April, and it has been worth about nothing since: in May and June
  my side made -0.07R a day and the other side 0.00R. That fall is not the luck of which days fell where. It is the first time in 92 ideas that
  a test of mine has come out against the rule itself rather than against a change to it.
- What the test does NOT establish, and I will not let the word "regime" claim more than it has earned:
  (1) WHY. It could be the market (the euro fell one way for three months and has gone sideways since - I wrote on 04-17 that I had not yet traded
  anything but a falling market); it could be that the rule was partly FOUND on early January, so that month is flattered (but February and March
  were traded with the rule frozen and were +0.52R and +1.12R a day over the coin, so selection is not the whole story).
  (2) THE FUTURE. Two periods are not a law. A sideways market can start trending again and the signal's worth with it; or not. 124 days cannot say
  which state is the usual one for this rule - only that the state changed.
  (3) That the edge is zero now. 41 days at -0.07R with a standard deviation of 1.8R are known to about +-0.56R. "About a coin" is the centre, not a proof.
- As written BEFORE the run for this outcome: the honest expectation for A2 today is the recent one, not the planning edge of +0.18R. The size test
  and the money guard already carry that case: at a zero edge the guard stops the account at about -5% in roughly three two-year runs out of
  four (GD, SG). So the account is protected against exactly this; what is not protected is my time and the payouts I planned with.
- NO LIVE RULE CHANGES. The coach's instruction is "not until a test says so", and this test says what has happened, not what to do. Monday is
  SELL or BUY by the 22:00 closes, 0.31 lots, 40 pips, noon.

## The question this puts to the coach (I do not decide it)
I trade a rule whose advantage over a coin has been absent for two months, with a size rule that limits the cost of finding out to about 5%.
Three honest ways to go on, none of them adopted:
(a) As now: full plan, judged by the worry lines W1 (lived average) and the size rule. Cost if the edge is gone: slow - W1 at 150 trades is months away.
(b) Write a MONITOR now, before more data: the side advantage over the last 60 trades (today: about -0.07R a day on the last 41, +0.04R on the last 62),
    with a line fixed in advance at which A2 goes to PAPER (traded in the journal, not in the account) until the monitor recovers. It would have to be
    tested on history first like any rule (does a monitor like that help or just whipsaw?) - that is a backtest I can do next, kill line first.
(c) Half size until the monitor recovers: a size change, and the plan says size changes only by a trigger written in advance - so it too needs writing and testing first.
My own leaning is (b) as the NEXT TEST, not as an action: it is the first idea in a long time that would change what I do for a reason found by a test
rather than by a feeling, and it must earn that with its own kill line. Until the coach says otherwise I trade (a).
Counts: ideas 92, variants 258 (RG1, RG2, RG3). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today; a weekday
label in this file's worked case was fixed before the results were written - a label, not a number, said here anyway).

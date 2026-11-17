# Idea BK: night-box breakout on the day after a big-range day (idea 104; coach 07-14; route B hunt)
Written Tue 2015-07-14 22:00 London, before any code. From the study: big days follow big days (65% vs 38%); size, not direction.

## Hypothesis
After a big day the next day is more likely to travel far, so leaving the night's box in London should carry on; after a normal day it should not.

## Rule (London time; one trade a day at most)
- BIG DAY flag (same as in the study): yesterday's London-day range (22:00->22:00) is above the median of the last 10 London-day ranges (yesterday included).
- Box = high and low of 00:00-08:00. From 08:00 to 12:00: the first M5 candle that CLOSES outside the box -> market order at the next
  candle's open in that direction, stop 40 pips, close 20:00. No close outside by 12:00 -> no trade.
- BK1 (judged): only after a BIG day. BK0 (control): the same trade after NOT-big days. BK2 (dose): yesterday's range above 1.3 x that median.
Three variants, no more. Costs on (1.0 + 0.1 pips); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count flag days and breakout days (a close outside the box is a fact, not a result) for each variant, before and from 04-07.
BK1 under 40 trades in all or under 15 from 04-07 -> not judgeable, killed for sample.
No clean held-out part exists (the clustering fact was read on all of Jan-Jun; breakout results were never looked at). So both regimes must pass.

## Kill lines for BK1 (all must pass)
K1 average >= +0.10R after costs. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best two trades.
K4 BK1's average at least 0.15R above BK0's (else the big-day flag adds nothing). K5 stressed average above zero. K6 max drawdown <= 6R.
K7 dose: BK2's average >= BK1's.
Pass = route B step B1 candidate, then 40 forward paper trades. Fail = killed, no fourth variant. Idea 104 on the same six months: a lone pass could be luck.

## Counts and worked case (tool, before the outcome run)

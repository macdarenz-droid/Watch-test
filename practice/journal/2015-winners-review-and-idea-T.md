# Review of my 5 biggest winners + ONE new hypothesis (written before any run)
Clock Fri 2015-02-27 22:00 UTC, unchanged. Charts: M15, yesterday + trade day, entry marked (bt/loser_charts.py on history). No new candles.

## The five (live, rule A2)
| # | Day | Side | R | Worst point against me (pips) | Best point for me (pips) | Position after the first hour (09:00) | Yesterday | Where I entered |
|---|---|---|---|---|---|---|---|---|
| 9 | Fri 01-23 | sell | +4.27 | 10 | 176 | +74 pips | big down day (-270) | low in yesterday's range ("chasing") |
| 26 | Tue 02-17 | buy | +2.14 | 15 | 96 | 0 pips (flat) | down day | bottom third, after a dip |
| 4 | Thu 01-15 | sell | +2.06 | 1 | 210 | +18 pips | flat | middle |
| 2 | Tue 01-13 | sell | +1.39 | 0 | 64 | +29 pips | down then bounce | upper part, after a bounce |
| 1 | Mon 01-12 | sell | +1.34 | 0 | 66 | +39 pips | up day (bounce) | at yesterday's high |

## What they share, by eye
1. They worked AT ONCE. Price never went more than 15 pips against me (three of five: 0-1 pip), and four of five were clearly in profit one hour in. On the chart each is a
   single clean leg starting within minutes of 08:00 - no back-and-forth first.
2. Before 08:00 nothing had happened yet: Asia was a flat shelf (26-59 pips) and the 07:00-08:00 hour stayed INSIDE that shelf in all five. The day's move started after I was in.
3. The move came out of the shelf in my direction and kept going until noon; the noon exit caught most of it (best point 64-210 pips, banked 54-171).
4. What they do NOT share: entry location (one at yesterday's high, one chasing at the low, three in between) and yesterday's direction (mixed). That fits the dead ideas D/H: location is not the thing.
5. Honest caveats: four of the five are January sells in the big downtrend; #4 and #9 are the two shock days I tagged as luck. "Biggest winners work immediately" is partly true by
   definition (a trade that goes 170 pips my way by noon has usually started by 09:00). The real question is the other side: do trades that are NOT working after an hour go on to lose?
   My losers' best point averaged only 14 pips and their worst 33 - which suggests yes, but I have never measured the 09:00 state of any trade except these five.

## ONE hypothesis: idea T "it works at once or it doesn't" (an EXIT change; every earlier idea was an entry filter)
A2 entries exactly as frozen (every day, 08:00, with the 3-day trend, SL 40, $125). New: a one-hour check.
Hypothesis: a trade that is not working after the first hour has negative expectancy for the remaining three hours, so closing it at the check raises avg R and lowers drawdown.
Variants (2, both counted: variants 16 and 17; ideas -> 9). No other check times or thresholds will be tried.
- T1: at 09:00, if the open result is below zero (after spread), close at market. Otherwise hold to 12:00 as before.
- T2: at 09:00, if the open result is worse than -10 pips (-0.25R), close at market. Otherwise hold to 12:00.
Known in advance and NOT designed around: T1 would have closed my #26 (flat at 09:00, later +2.14R). That is the cost side of the rule and it stays in the test.

Build - January only (same trades for both rules, so avg R compares directly). A variant survives only if ALL: avg R >= A2 avg R + 0.05R; max drawdown <= A2's;
the trades it closed early would have averaged < 0R from 09:00 to 12:00 (i.e. cutting them was right on average); it cuts at least 4 trades.
If both survive: take the higher avg R. If none: dead; the less-bad one goes to February once, for information only.

Check - February, one run of the chosen variant. Pass only if ALL: avg R >= A2 avg R + 0.15R; max drawdown <= A2's; early-closed trades would have averaged < 0R afterwards.

Contamination label, in advance: February is NOT clean. One of the five winners (#26) is a February trade, and I know my February losers' best/worst points from the loser review.
What is new: the 09:00 state has never been measured. A February pass would be weaker than an unseen month; a fail is a real fail.
Leave-out note: on the four January winners the rule does nothing (all in profit at 09:00), so removing them cannot flatter it; #26 is where it should hurt and it stays IN.
Nothing above has been run.

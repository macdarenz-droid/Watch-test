# Is my best idea a trend rule, or just "sell the euro in early 2015"? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Fri 2015-04-17 22:00 London (weekend, end of released data). All lived history 01-06 .. 04-17 (explicit end date 2015-04-18); costs on; London time.

## Why this, and why now
Coach, 04-17: the last test had 7 cases; the next one needs enough trades to mean something (30+) or must say plainly why it cannot.
Everything I have tested lately touched a small corner of the rule (10 stop days, 6 rejection days, 33 "+1R" days). The one thing a better trader would ask about
their best idea before anything else uses ALL the trades: where does the money come from? My whole history sits inside one big move: EURUSD has fallen from about 1.20
at the start of January to 1.05-1.08 now. A rule that sells more often than it buys in a falling market makes money whether or not it has any skill.
If A2 only earns on the sell side, then what I own is a bet on the euro's direction with a 40 pip stop - and it will stop paying the month the big trend ends,
with nothing in my tests able to warn me. That matters more for a two-year funded account than any stop or exit detail.

## Counted before writing the test (occurrences only; no results looked at for this count)
74 signal days: 47 sells, 27 buys. Using a longer trend instead of "the side": last close against the close 10 trading days earlier -> 39 days with it, 26 against,
9 undefined (my history starts 01-02, so longer lookbacks lose the first weeks; 20 days leaves 55 days, 40 days leaves 35).
SAMPLE, said plainly: the comparison uses all 74 trades, but the smaller group is 27 (buys) or 26 (against the 10-day trend) - just under 30. With a spread of about 1.03R
per trade, the average of 27 trades is known to about +-0.40R (two standard errors) and the DIFFERENCE between the two groups to about +-0.50R. So this test can see a
big dependence (buys losing while sells win) and cannot see a small one. I cannot make the sample bigger: it is every trade I have.

## What I already know (contamination, honestly)
I know the last five buys by heart (04-03 +0.07, 04-06 +0.27, 04-07 -1.03, 04-16 -1.03, 04-17 +1.70) and remember three good March buys (03-23, 03-24, 03-25).
I have never added the two sides up. The forward-vs-backtest note of 03-2x counted buys and sells but did not compare their results.

## Hypothesis
A2 is two-sided: its buys (trades against the year's big move) have a real positive expectancy of their own, not much lower than its sells.

## KILL TEST for the hypothesis (explicit). "Killed" = A2's edge depends on the big trend.
The hypothesis survives only if ALL:
  D1. buys average at least +0.10R per trade (the same floor as my rule alarm);
  D2. buys average at least one third of what sells average;
  D3. buys are net positive in at least 2 of the 3 periods (January, February, March-to-now);
  D4. the same three lines hold when "buy/sell" is replaced by "against/with the 10-day trend" (so the answer does not rest on my knowing which way the year went).
Reported, not a kill line: the difference between the groups against its +-0.50R noise band.

## Variants (108, 109, 110; ideas -> 41), no others afterwards - what one WOULD do if the hypothesis is killed. Everything else exactly A2.
- SD1: sells only. (Hindsight: it knows the year fell. Shown as the upper bound of the dependence, can never be a rule.)
- SD2: trade only when the 3-day signal agrees with the 10-day trend (last close vs the close 10 trading days earlier); days where the 10-day trend is undefined are traded as A2.
- SD3: as SD2 but the disagreeing days are traded at HALF size instead of skipped.
Filter kill test, as for all my filters (a skipped day counts 0R; build can only kill; survivor = forward paper tag, no adoption question before 200 forward trades):
  K1. avg R per signal day at least A2's + 0.05R;  K2. the days it changes are worse under A2 than the others by at least 0.3R;
  K3. that is true in at least 2 of 3 periods and in no period are the changed days better by more than 0.3R;  K4. it changes at least 10 days and leaves at least 60% alone
  (SD1 changes 27 of 74 = 36%; SD2/SD3 change 26).

## What follows from each outcome - written now so I cannot choose afterwards
- Hypothesis survives: nothing changes; one sentence in the plan ("the edge is on both sides on 74 trades; the smaller side is known to +-0.40R").
- Hypothesis killed, no variant survives: no rule change. The plan gets a RISK line: "the edge so far comes from the sell side of one falling market", and I add one
  number to the weekly journal: running R of buys and of sells, so I see it if the dependence grows.
- Hypothesis killed and SD2 or SD3 survives: forward paper tag for that variant; plan RISK line as above.
My guess, written now: sells about +0.55R, buys about +0.25R; the hypothesis survives D1-D3 narrowly and the difference (about 0.3R) is inside the noise band; D4 the same.
No variant passes K2. If buys come out negative I will be surprised, and it would be the most important thing I have learned since January.

# RESULTS (kill lines above pushed in commit c02bcc7 before the script existed; labels checked on three days; one run: `python bt/two_sided.py 2015-04-18`)
74 A2 trades 01-06..04-17, engine, full costs. The euro closed 1.2002 on 01-02 and 1.0805 on 04-17 (checked from the tool; -1,197 pips over my whole history).

## By side
| | trades | win rate | avg R | net R | Jan (n, avg) | Feb (n, avg) | Mar-now (n, avg) |
|---|---|---|---|---|---|---|---|
| Sells | 47 | 72% | +0.614 | +28.84 | 15, +0.86 | 9, +0.43 | 23, +0.52 |
| Buys | 27 | 56% | +0.243 | +6.56 | 4, +0.49 | 11, +0.07 | 12, +0.32 |
Difference sells - buys: +0.37R per trade; two standard errors +-0.48R -> inside the noise.

## By the 10-day trend (9 early days undefined, left out)
| | trades | win rate | avg R | net R | Jan | Feb | Mar-now |
|---|---|---|---|---|---|---|---|
| With the 10-day trend | 39 | 59% | +0.405 | +15.80 | 6, +0.38 | 9, +0.12 | 24, +0.52 |
| Against it | 26 | 69% | +0.345 | +8.96 | 4, +0.49 | 11, +0.32 | 11, +0.31 |
Difference with - against: +0.06R per trade; two standard errors +-0.52R -> nothing.

## Kill lines for the hypothesis "A2 is two-sided"
| line | by side (buys) | D4: by 10-day trend (against) |
|---|---|---|
| D1 smaller group averages >= +0.10R | PASS (+0.243) | PASS (+0.345) |
| D2 at least one third of the other group | PASS (+0.243 vs +0.205 needed) | PASS (+0.345 vs +0.135) |
| D3 net positive in >= 2 of 3 periods | PASS (3 of 3: +1.98, +0.77, +3.81) | PASS (3 of 3) |
THE HYPOTHESIS SURVIVES. On my history A2 makes money on both sides, in all three periods, whichever way I define "against".

## The three variants (what I would have done had it been killed)
| | changes | avg R / signal day (A2 +0.478) | net R | max DD (A2 2.03) | gap others - changed | K1 | K2 | K3 | K4 |
|---|---|---|---|---|---|---|---|---|---|
| SD1 sells only (hindsight) | 27 days | +0.390 | +28.84 | 1.35 | +0.37 | FAIL | PASS | PASS | PASS |
| SD2 skip when against the 10-day trend | 26 days | +0.357 | +26.45 | 1.60 | +0.21 (Feb -0.20) | FAIL | FAIL | FAIL | PASS |
| SD3 half size when against | 26 days | +0.418 | +30.93 | 1.52 | +0.21 (Feb -0.20) | FAIL | FAIL | FAIL | PASS |
NO SURVIVOR. Skipping or halving the "against" trades throws away trades that earn +0.24 to +0.35R each.

## My guess against what happened
"Sells about +0.55R, buys about +0.25R, difference inside the noise, hypothesis survives narrowly, no variant passes K2": sells +0.61, buys +0.24, survives.
Two misses: it did not survive "narrowly" on D4 (against-trend trades are as good as with-trend ones), and SD1 does pass K2 and K3 - the buys ARE visibly the weaker side.

## What I learned - and what I must not over-read
- The comfortable answer: A2 is not just "short the euro". 27 buys in a market that fell 1,200 pips made +6.56R, positive in every period. The rule buys the bounces
  inside the fall and gets paid for them. The 10-day split says the same thing more strongly: against-trend trades +0.35R, with-trend +0.41R.
- The uncomfortable part, said plainly: 81% of my net R (28.84 of 35.41) came from sells. Buys win 56% against 72% and earn 0.37R less per trade. That difference is
  inside the noise band (+-0.48R) - which means I cannot say the sides differ, and equally cannot say they are the same. In February, the one month where buys
  outnumbered sells (11 to 9), buys made +0.07R per trade, 36% winners. If the next year is mostly February-type buys, my +0.18R planning edge is about right and the
  +0.46R of the last weeks is not.
- So the planning number stays +0.18R, and now I can say WHY it is the right kind of pessimism: it is roughly what the weaker side has earned.
- The sample, plainly: 27 and 26 trades in the smaller groups. A dependence of less than about 0.5R per trade is invisible at this size. This test rules out the
  disaster case (buys losing money); it does not prove independence from the big trend. Only a period in which the euro RISES for months can show that, and I have not
  lived one. I will know more when the 10-day trend has been up for 40 or so trades.
- Per the outcome rules I wrote beforehand: hypothesis survives -> nothing changes; one sentence goes into the plan. I add, on my own account and as tracking only, the
  running R of buys and sells to the weekly journal line, because 81 / 19 is worth watching even though the test passed.
Counts: ideas 41, variants 110.

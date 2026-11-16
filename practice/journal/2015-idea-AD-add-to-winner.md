# One new hypothesis from my own journal: ADD to the trade at +1R instead of banking it. PRE-REGISTERED ONLY - NOTHING HAS BEEN RUN
Clock Thu 2015-04-16 01:00 London (end of released data). Written the day after the partial test; to be run only when my coach says so.

## The observation it comes from (my journal, not a book)
journal/2015-idea-PM-partial-breakeven.md, the look I took before the totals: 33 of 71 trades reach +1R before noon, and 25 of those 33 are ABOVE +1R at noon
(10 of 10 in January, 4 of 6 in February, 11 of 17 in March-to-now); only 5 come back to the entry price. Banking half at +1R therefore cost 15% of the profit.
The same fact, read the other way: a trade that has reached +1R is the one moment in my morning where I know something I did not know at 08:00. If selling half there
loses money, buying a little more there might make it. Supporting notes from other journals: winners keep making new best prices late in the first hour
(first-hour study); trailing stops, targets and scale-outs all lost for the same reason - the mornings that pay keep going until noon.

## What I already know, said first (this is NOT a clean idea)
- It is the mirror of PM2, and I have seen PM2's numbers. Over 71 days, halving the position at +1R gave up about 5.1R net (-7.43R on 25 days, +2.35R on 8). An extra half
  position opened at +1R earns roughly that amount, less one more spread. So I already know the build will show MORE net R. A test that I know will pass a line is not a test
  of that line. Net R on the build is therefore NOT a kill line below; it is reported and nothing else.
- What I do not know, and what the test is for: what the add does to the BAD stretches. An add raises the money at risk exactly when the trade has gone 40 pips - and five
  times in 33 the trade then came all the way back. On those days I turn a small result into a real loss. A funded account is judged on its worst stretch, not its total.
- January (10 of 10 ran on) is the month this would have loved. It cannot count as evidence. February and March-to-now are judged separately.
- Rules of the account: one position plus the add = 0.50% + 0.25% at risk at most, far inside the 3% rule; the daily line is not in reach.
- It breaks my plan's "one trade, never touched" simplicity. Even a survivor only earns a paper tag; the plan (PLAN-v2-funded-one-page.md) does not change.

## Hypothesis
Adding half a position when the trade is +1R, with the add protected so that a full come-back cannot make the day worse than about -0.5R, raises net R in February and in
March-to-now separately WITHOUT deepening the maximum drawdown or the worst 10-day stretch.

## Variants (102, 103, 104 when run; idea 39), no others afterwards. Entry, direction, first position (0.31 lots, 40 pip stop) and the 12:00 exit exactly A2.
The add is opened at market on the 5-minute bar AFTER the one in which price first trades 40 pips beyond my fill (I cannot act inside a bar), pays its own spread and slippage, and is closed at noon with the rest.
- AD1: add half size (0.155 lots); the add's stop is my original entry price (about 40 pips behind the add); the first position keeps its original stop.
- AD2: as AD1, and when the add is opened the first position's stop also moves to the original entry price (break-even). Worst case after the add: about -0.5R for the day.
- AD3: as AD2, but the add is a quarter size (0.08 lots). Same shape, half the extra risk - to see whether any effect scales or is one or two days.
Results per DAY, in R of the $125 (so an add can make a day bigger than its "R" at entry suggests; that is the point of counting it this way).

## What I will look at before the totals
The 5 come-back days and the 6 days that reached +1R but closed between 0 and +1R: each one's result under A2 and under each variant, by hand against the 5-minute candles
for at least two of them (one come-back, one run-on), as in the PM test. And how late the add is filled relative to the +1R touch (the "next bar" rule costs something).

## KILL TEST (explicit). The build can only kill. A survivor earns a forward PAPER tag only: 100 forward trades, at least +0.10R per trade better than A2 at two standard
errors, with a maximum drawdown not above A2's over the same trades. No rule change, no size change.
A variant survives the build only if ALL:
  K1. maximum drawdown over all history not above A2's (2.03R on the last run; taken fresh from the same run);
  K2. worst 10-day stretch not worse than A2's;
  K3. worst single day not worse than -1.10R;
  K4. in February AND in March-to-now, each separately: net R above A2's by at least 5%, and maximum drawdown inside the period not above A2's;
  K5. on the days where the add was opened and the trade did NOT finish above +1R (the come-back and give-back days), the variant's total is not more than 1.5R worse than
      A2's total on those same days (the price of being wrong must be small and visible).
Reported, not a kill line: net R over all history and January (known to favour it).
My guess, written now: AD1 fails K1 or K3 (a come-back day with the original stop still in place can reach about -1.5R). AD2 gives up some run-on days to the break-even
stop (as PM3 did on 03-24 and 03-30) but probably passes the drawdown lines; it lives or dies on K4 in February, where only 6 days reached +1R - one or two days will
decide it, and I will say so if they do. AD3 follows AD2 at half the effect. If AD2 survives, the honest sentence is: "in-sample, mirror of a known result, 33 adds,
paper tag", not "found something".

# RESULTS (run 04-16 on the coach's go; kill lines above were pushed in commit 39facc2 before any code for the add existed)
`python bt/ab_add.py AD1,AD2,AD3 2015-04-16` - 72 days 01-06..04-15, engine, full costs, per day in R of the $125. One run, no variant changed afterwards.

## Mechanics checked by hand on two days BEFORE the totals were printed
- 03-24 (come-back day), buy 1.09531: first 5-minute candle 40 pips beyond my fill is 08:35; the add is bought at the 08:40 open, bid 1.09952 + spread and slippage =
  1.09963, stop at my entry 1.09531. Price touches the entry by 0.1 pip at 09:45: add -43.3 pips x 0.156 lots = -$67.55 = -0.54R. First position: A2 holds to noon +0.73R;
  with break-even it is taken out at 09:45 for 0.00R. Day: A2 +0.73R, AD1 +0.19R, AD2 -0.54R, AD3 -0.27R. Engine = candles.
- 04-13 (run-on day), sell 1.06059: +40 first traded in the 08:55 candle; add sold at the 09:00 open 1.05648; closed with the rest at noon 1.05275: +37.3 pips x 0.156 =
  +$58.19 = +0.47R. Day: A2 +1.96R, AD1 and AD2 +2.43R, AD3 +2.19R. Engine = candles.
- What the check showed: the add is filled on average 3.0 pips beyond the +40 level (worst case 90.6 pips, a spike bar), so its stop is about 43 pips away and a stopped
  add costs -0.54R, not -0.50R. 32 adds in 72 days (the 33rd "+1R day" of the PM test, 02-19, touched +39.6 pips and gets no add).

## The look before the totals: the 7 days where the add was opened and A2 did NOT finish above +1R (A2 -> variant)
| day | A2 | AD1 | AD2 | AD3 |
|---|---|---|---|---|
| 02-09 | +0.78 | +0.66 | +0.66 | +0.72 |
| 03-12 | -0.12 | -0.68 | -0.57 | -0.28 |
| 03-24 | +0.73 | +0.19 | -0.54 | -0.27 |
| 03-25 | +0.91 | +0.98 | +0.98 | +0.94 |
| 03-30 | +0.85 | +0.38 | -0.46 | -0.23 |
| 04-01 | +0.09 | -0.38 | -0.47 | -0.24 |
| 04-09 | +0.33 | -0.03 | -0.03 | +0.15 |
| sum, variant minus A2 | - | -2.44R | -3.99R | -2.77R |
The add was stopped out on 4 of the 32 days. On the 25 days that finished above +1R the add earned +6.35R (half size) / +3.17R (quarter).

## Totals
| | win days | avg R / day | net R (vs A2) | max DD | worst 10 days | worst day | sd | Jan | Feb | Mar-now (net, DD) |
|---|---|---|---|---|---|---|---|---|---|---|
| A2 | 67% | +0.482 | +34.70 | 2.03 | -1.37 | -1.03 | 1.04 | +14.89 | +4.67 | +15.14, DD 2.03 |
| AD1 add half, add's stop at entry | 64% | +0.536 | +38.61 (111%) | 2.34 | -2.30 | -1.03 | 1.23 | +16.78 (113%) | +5.62 (120%) | +16.22 (107%), DD 2.34 |
| AD2 + first position to break-even | 61% | +0.515 | +37.05 (107%) | 3.28 | -3.25 | -1.03 | 1.24 | +16.78 (113%) | +5.62 (120%) | +14.66 (97%), DD 3.28 |
| AD3 as AD2, quarter add | 62% | +0.487 | +35.10 (101%) | 2.78 | -2.78 | -1.03 | 1.14 | +15.83 (106%) | +5.14 (110%) | +14.12 (93%), DD 2.78 |

## Kill lines applied
| line | AD1 | AD2 | AD3 |
|---|---|---|---|
| K1 max DD not above A2's (2.03R) | FAIL (2.34) | FAIL (3.28) | FAIL (2.78) |
| K2 worst 10 days not worse than A2's (-1.37R) | FAIL (-2.30) | FAIL (-3.25) | FAIL (-2.78) |
| K3 worst day >= -1.10R | PASS (-1.03) | PASS | PASS |
| K4 Feb AND Mar-now: net +5% and DD not above A2's | FAIL (Mar-now DD 2.34 > 2.03; nets +20% and +7% were fine) | FAIL (Mar-now 97%, DD 3.28) | FAIL (Mar-now 93%, DD 2.78) |
| K5 cost on the not-above-1R days <= 1.5R | FAIL (-2.44R) | FAIL (-3.99R) | FAIL (-2.77R) |
VERDICT: NO SURVIVOR. All three fail four of five lines. Idea closed, no paper tag. A2 and the plan unchanged.
Reported as promised, not a result: net R rose 11% / 7% / 1% - the known mirror of the partial test.

## My guesses against what happened
- AD1 "fails K1 or K3": it failed K1 (and K2, K4, K5); K3 passed - no day got worse than a normal stop, because on the come-back days the first position still made its noon result.
- AD2 "probably passes the drawdown lines": WRONG, and wrong in an instructive way. Break-even on the first position made things worse, not safer: on 03-24 and 03-30 it
  threw away +0.73R and +0.85R that the unprotected position kept, and the add lost on top. Its drawdown is the deepest of the three (3.28R).
- AD3 "follows AD2 at half the effect": yes for the gain; the damage from the break-even stop is not halved, so it is the worst trade-off of the three (+1% net, DD +37%).
- "February will decide it": no - February was fine for all three (5 adds). March-to-now decided it: 7 of the 17 adds there were on days that did not finish above +1R.

## What I learned
- More profit and a worse account. The add earns +0.2R on three days out of four and loses half an R on the fourth - and the losing adds cluster. Four of them
  (03-24, 03-30, 04-01, and 04-09 small) fell inside three weeks, the same weeks that held my normal stops. A2's worst 10 days are -1.37R; with the add -2.30R to -3.25R.
  For a funded account that is the wrong direction, whatever the total says.
- Partial and add are the same bet with opposite signs, and BOTH fail my lines: the partial because it sells the edge (-15% net, same drawdown), the add because it buys
  variance (+11% net, +15% to +60% drawdown). Between them sits the plain position, and it is the best of the three on net R per unit of drawdown: 17.1 for A2 against
  16.5 (AD1), 11.3 (AD2), 12.6 (AD3), 13.5 (PM1).
- Third time a break-even stop has hurt (X1, PM3, AD2). A stop at my entry price is hit by noise about as often as the stop 40 pips away, and it takes out trades that
  are fine at noon. I should stop expecting "protection" from it.
- The observation was real (25 of 33 run on) and still not tradeable for me: the 8 that do not run on cost about as much per day as the 25 give, and they come together.
- Honest limits: 72 days, 32 adds, 4 stopped adds; mirror of a known result; the "next bar" fill is my engine's assumption. A fail in-sample on drawdown lines I set
  beforehand, by wide margins, is clear enough.
Counts: ideas 39, variants 104.

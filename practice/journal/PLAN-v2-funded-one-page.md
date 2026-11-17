# TRADING PLAN v2 - FUNDED, one page (as of Thu 2015-04-16 01:00 London sim time)
Replaces journal/PLAN-v2-one-page.md (challenge version, 03-12). Details: journal/FUNDED-PLAN.md, journal/FUNDED-TRACKER.md. Account: FundedNext funded $25,000;
5% daily loss, 10% max loss (floating counts, line $22,500), max 3% risk open, no target, 80% split, payout every 14 days. Goal: steady monthly profit, safe payouts, NEVER breach.

## 1. The rule (A2, frozen since 2015-01-09; all times London)
EURUSD only. 07:00: look at D1 / H4 / H1 and WRITE the call (bias, levels, plan, risk), committed before the entry bar. Direction = last 22:00 close vs the 22:00 close
three trading days earlier (lower -> sell, higher -> buy; any gap, even 1 pip). 08:00: market order. Stop 40 pips from the fill, never moved. No target, no partial,
no break-even. 12:00: close at market. One trade every weekday, no skips, no second trade. Flat by noon, flat over weekends.

## 2. Size
0.50% of $25,000 = $125 per trade = 0.31 lots. Fixed. Not raised after wins, not raised to "make back" a loss.
Why: risk-size test 04-10 - at the edge I plan with (+0.18R) 1.0% breaches about 1 two-year run in 10, 0.50% about 1 in 500; with my brakes nothing breached at any size.
Re-run 04-24 (80 trades, corrected high-water rule): on my 40 live trades 0.50% is stopped by my own -5% brake in 1.1% of two-year runs; at the planning edge in about 14% (never a breach).
A raise needs BOTH the 40-trade forward test passed (33 done) AND a re-run of that test in which the bigger size passes all five lines. Neither is close.

## 3. Daily stop, and the stops behind it (the two brakes are the ONLY size triggers - written out as a mechanical size rule on 04-27, journal/2015-W18-funded.md)
- DAILY: one trade, one stop. The worst planned day is -1R = -$125 (-0.5%), ten times inside the firm's 5% daily line. After the trade is closed - win, loss or stop -
  I am done for the day. No re-entry, no "second chance", no afternoon trade. A day can only be worse than -1R through a gap past the stop; I cannot prevent that, the size covers it.
- (Tested 05-05: restoring full size earlier, or dropping the half-size step, fails - the step cuts my own-stop odds from 49% to 15% at the planning edge. "Until a new high-water" stays.)
- BRAKE 1: balance 3% below the high-water mark (now $24,657.75) -> half size ($62.50) until a new high-water.
- BRAKE 2: balance 5% below the high-water mark (now $24,149.34) -> stop trading, full review, restart only with my coach.
- BRAKE 2, CHANGED 2015-05-15 (coach: "your personal stop is too tight for your size - pick one, write why, stick with it for 20 live days before judging"):
  my choice is the WIDER PERSONAL STOP: balance 7% below the high-water mark ($23,574.70 on 05-15; $23,510.81 after the 06-05 payout) -> stop trading, written review, restart only with my coach.
  Size stays 0.50%; half size from 3% under the high-water as before. The old 5% line above is retired from today.
  Why the stop and not the size: (1) idea TS: no run in 16,000 got below -5.7% and no day cost more than 1.54%, so the firm's line ($22,500 = -10%) was never
  near; the thing being hit was my own line. (2) Between -3% and -5% I trade half size: that is only about 16 half-size stops of room, and one jump day uses 3
  of them. (3) A smaller size cuts the payout in every scenario, including the ones with no jump; a wider stop costs nothing unless I am already deep.
  (4) At -7% there is still 3% to the firm's line: 24 half-size stops, or 4 jump days at half size. What I give up: if my edge is gone, I find out 2% later.
  Fixed for 20 live days: funded days 36 to 55. No judging, no second change before the review after day 55. The check of this choice by simulation is in
  journal/2015-idea-WS-wider-stop.md.
- RULE ALARM: PASSED 04-24 - 40 forward trades, +12.64R, +0.32R each, max drawdown 3.07R (lines: >= +0.10R, <= 8R). Next alarm look at 100 live trades, same lines.

## 4. Payout plan (dates every 14 days from 03-27: 04-10 done, 04-24, 05-08, ...)
On the payout date, after the day's trade, on the tracker balance: below $26,000 -> request HALF of what is above $25,000; at or above $26,000 -> request everything above
$26,000 (the $1,000 buffer stays). No request while a brake is on. After a payout the high-water mark is lowered by the amount paid out (corrected 04-24; never reset to the balance while in a drawdown). I keep 80% of what is requested.
So far (to 06-05, from the tracker's ledger): 4 payouts on 5 dates, $68.82 + $56.88 + $349.14 + $0 + $68.70 = $543.54 requested, $434.83 mine. Half-cents are rounded DOWN. (Unknown to me: whether the firm has a minimum payout amount.)

## 5. What counts as a mistake
TRADE MISTAKE (tag "my mistake"; the trade's R is then my fault, not the market's) - any ONE of:
  no written, committed call before 08:00 and I traded anyway | wrong side versus the rule | wrong size (not 0.31 lots at full size / 0.16 at half) | stop not 40 pips, or
  moved, or removed | entry not at 08:00 or exit not at 12:00 by my own choice | a skipped day | a second trade | trading with a brake ignored | holding past noon or over a weekend.
NOT a mistake: a loss on a trade that followed every line above. That is "valid setup, market disagreed", and the rule does not change for it. A win on a rule-break is still a mistake.
PROCESS MISTAKE (separate tally; something wrong AROUND the trade that did not change it): call written late or after seeing extra candles; clock/time-zone slips; a research
script touching data it should not; a test run before its kill test is pushed; more than 3 variants; numbers written from memory instead of from the tool; journal or tracker not
updated the same day; result not tagged before anything else.
Score so far (funded): 14 trades, 14 valid (9 wins, 5 valid losses), 0 trade mistakes, 2 process mistakes (P1 DST slip 03-30, P2 research script 04-03). [04-17: 15 trades, 0 trade mistakes, 3 process mistakes - P3 a journal number in the wrong time zone.]

## 6. What I expect, honestly
| Sample (A2, full costs) | Trades | Win rate | Avg R |
|---|---|---|---|
| January (where the rule came from) | 19 | 74% | +0.78 |
| February (frozen rule) | 20 | 55% | +0.23 |
| March to now, traded forward one day at a time | 33 | 70% | +0.46 |
Planning number: +0.18R. On 72 trades my average is only known to about +-0.25R. At 0.50%: roughly +$460 (planning edge) to +$890 (February-to-now edge) a month on the
account before the split; about one month in five negative at the planning edge; a bad month about -$450. Drawdowns of 3-4% will happen and are not a signal to change anything. (04-29, from the live loss side: about one trade in four is a full stop; a run of six losses is a once-in-a-few-months event; about 5R of drawdown inside two months is the 95th percentile.)
Where it comes from (04-17, 74 trades): both sides earn - sells +0.61R (47), buys +0.24R (27), each positive in all three periods - but 81% of the net R is sells in a market that
fell 1,200 pips. The smaller side is known only to +-0.40R. I have not yet traded a rising market; +0.18R is about what the weaker side has earned.
PAPER LINE, not a basis for any live rule until live days confirm it (coach 05-06) - 05-06, 86 trades: with the 10-day trend UP the rule earned +0.375R on 29 trades (buys +0.30R on 19), with it DOWN +0.307R on 48. It has not needed a falling euro so far; 29 trades, longest up stretch three weeks.

**Worst case of a day and my own buffer (05-14, from idea DC and the coach):** one trade a day: the firm's 5% daily limit is the line; 0.50% stays (normal stop about 1.1R, worst case seen in history about 3R = 1.54%). Two trades in one day (none exists live): the second trade is sized so that "A2 worst case + its worst case" <= 2.0% of the balance (bt/day_cushion.py on the then history). This is the only place my 1.25%-type buffer sizes anything.

**How A2 is judged (coach, 2015-06-02, after idea AL):** "100 trades can't separate a small edge from noise, so don't decide from the alarm alone; keep A2 at the planned size, use the drawdown/breach guard as the real safety rule, and judge the edge after a few hundred lived trades over 2-3 years." So: (1) A2 stays at 0.50%; (2) the SAFETY rule is the money rule - half size at 3% under the high-water, stop trading at 7% under (review after funded day 55), account line $22,500; (3) the alarm at 100 live trades is still read on that day (average, drawdown, error band) but no decision is taken from it alone; (4) the edge is judged on a few hundred lived trades: I write the lived average with its error band at every month-end review and at every 50th lived trade.

## 7. What is closed, so I do not reopen it on a bad day (76 ideas, 213 variants, no trading idea adopted; personal stop widened to 7% on 05-15; MB1 on paper only; worst case of one day from idea DC: normal stop about 1.1R, jump day seen in history about 3R = 1.5%)
Entry filters from chart reading (no-chase, first break, night against me (twice), gap size (small and large), round numbers, flip day, rejection day, dead Asia, Friday): the losers I look at have more winning twins.
Exits (tighter / wider / structural stop, break-even, trail, target, runner, scale-out, partial at +1R, add at +1R, stop on a candle close, late profit lock, time-decay stop, 09:00 checks, other exit hours): 32 definitions, none beats noon. The noon exit is already my loss-cutter: most losing mornings end at -0.2 to -0.5R. The hour 11:00-12:00 adds +0.18R per in-profit trade.
Entry time and price (07:00, 09:00, +-1h, limit orders, split entries 08:00 + 08:30 / 09:00); lookback 2 / 5 / 10; second setups tried (Asia break, ignition candle, NY fade, range fade, night continuation, afternoon trade in the rule's direction, night fade, direction of a lively pre-entry hour, midday-box breakout at 13:25 - the last one positive under cost stress but period-unstable with 6-7R drawdowns; parked). Size above 0.50%.
Ruled out about myself: discretionary skips and rules made from one replayed day.
KEEP IN MIND (XS test 04-29, coach: do not filter winners away): the most STRETCHED signals (3-day gap >= 1.25 average days' range) are my best trades, 24 at +0.625R each.
"It is extended, be careful" is not supported by my record; skipping them would have cost 15R of 34R.

## 8. How I work
One live day at a time. Result tagged before anything else. One honest test earns the next day: hypothesis and explicit kill test pushed BEFORE the run, max 3 variants, all lived
history with an explicit end date, shown by period; the build can only kill; a survivor earns a forward paper tag (100-200 forward trades), never a rule change.
Paper tags running: UN3, PH2 (F1 / FR1, Q3 / Q1 closed at their day-40 gates, 05-06). Everything counted in STATE.md.

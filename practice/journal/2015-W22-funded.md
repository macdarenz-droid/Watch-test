# Journal - FUNDED ACCOUNT, week of 2015-05-25 (W22). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
Start of week (from the tool, 05-22): tracker balance $24,884.45 (sim $25,359.29 minus $474.84 paid out), high-water $25,349.14, drawdown -1.83% (the deepest so far; 3.69R under the equity high). Last two weeks -1.85R, -1.84R. No payout date this week (next Fri 06-05).
SIZE RULE: half size from a day's close at or below 3% under the high-water ($24,588.67) until a new high-water; STOP at 7% under ($23,574.70; fixed for funded days 36-55; 6 done).
NORMAL WORST (written 05-19, from 20,000 reshuffles of my own trades, 56 trades): 6 losses in a row; about 5.9R of drawdown. I am at 3 in a row and 3.69R. Coach 05-25: "that's exactly why you wrote it down. stay the course."
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades. Every figure comes from a tool print.
Friday 05-29 is the last trading day of May: the month-end review is due on the first live day of June.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 05-25 call, written 07:00 London (06:00 UTC), before the entry bar.** Friday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-25` and the bar prints.
  D1 (London days): Wed 05-20 close 1.10937 (0.35); Thu 05-21 close 1.11117 (0.31); Fri 05-22 high 1.12083 low 1.10023 close 1.10074 (0.02, range 206.0):
      it took my stop at 1.1193 in the morning, made the 3-day high at 1.12083, then fell 206 pips and closed on the low - the 3-day high AND the 3-day low in
      one day. My sell was right about the day and wrong about the morning. The noon clock would not have saved it either: -0.81R at 12:00.
  H4 (UTC bars): Fri 12:00 bar 1.11767 -> 1.10023 (close 1.10329); 16:00 bar low 1.10030; Sunday bar low 1.09644; tonight 00:00 bar 1.09712-1.10012; 04:00 bar 1.09771-1.09905.
  H1: the night (00:00-07:00 London): open 1.10016, high 1.10095, low 1.09712, last 1.09863: range 38.3 pips (ratio 0.93), net -15.3 pips - a slightly falling night, with my side.
  M15: six small candles 1.0977-1.0990; last close 1.09863. Quiet.
  Bias: SELL. 22:00 London closes: 05-22 1.10074 vs 05-19 1.11493 = -142 pips (3-day gap -141.9). Gap / ADR5 0.94: just under stretched.
  UN3 PAPER TAG (never live): 5-day gap -441 pips -> SELL; agree: paper TRADES. Forward day 25, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 17.
  MB1 PAPER TAG (never live, forward day 9): morning direction written at 12:00, before 13:25.
  Levels: night low 1.09712 (Sunday low 1.09644); Fri low 1.10023 (now above the price); night high 1.10095.
  Rejection-day check: for a sell, Friday would need the 3-day low (True) AND a close in the top third; it closed at 0.02. Not a rejection day.
  10-day-trend paper line: DOWN (1.10074 vs 05-08 1.12015); the sell is with it.
  SIZE RULE: tracker balance $24,884.45, high-water $25,349.14, drawdown -1.83%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
      One more full stop today leaves the balance near $24,759, still above trigger 1; two more would be near it. The rule decides, on the day's close, not me.
  Monday: five losing Mondays in a row before this one. MO said it was a streak (Mondays +0.397R in the 14 before). The plan, without a second thought.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: three stops in a row and I am selling a market that has already fallen 480... correction, I have not computed that - a market at its low of the month. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.09854-1.10067 = 21.3 pips -> PH2 paper: QUIET, paper full size (decided before the order). Price 1.10039: the hour rose 18 pips; night against me by 2.3 pips (counted); entry 17.6 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.10439).
  08:15 London: filled SELL 1.10038, stop 1.10439 (40.1 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +35.7 (low 1.09671), worst -3.5, last +29.5 pips. In profit for the first time in four days and I notice the wish to bank it. No target; the clock is noon. Hands off.
  10:00 London: second hour best +43.8 (low 1.09590), worst +26.2, last +29.9 pips. No call; hands off.
  11:00 London: third hour best +34.7, worst +17.0, last +26.4 pips. A 17 pip range. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.09763, +$85.25 (from the trade list). MB1 paper (forward day 9), written before 13:25: open 08:00 1.10039, open 12:00 1.09752 -> morning DOWN by 28.7 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Result from the tool tomorrow.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 60 | 35 | +14.00 | +0.23 | 3.69R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 24 days, 6 disagree days of 30 | - | A2 on the disagree days +1.42R; on the agree days -2.11R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 16 days, 14 lively days of 60 | - | A2 on the lively days -1.69R (7 full-stop mornings), on the 2 quiet days -0.54R; PH2 about -1.38R vs A2 -2.24R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41).
Loss tags, all live trades: valid loss 38 (-25.74R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Fri 2015-05-22:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 60 | 60 |
| Win rate | 64% | 58% | 58% |
| Avg R | +0.50 | +0.23 | +0.24 |
| +- 2 standard errors | 0.33 | 0.27 | 0.28 |
| Net R | +19.56 | +14.00 | +14.14 |
| Avg win / avg loss | +1.04 / -0.46 | +0.96 / -0.79 | +0.98 / -0.80 |
| Full stops | 3 (8%) | 18 (30%) | 18 (30%) |
| Max drawdown | 1.87R | 3.69R | 3.75R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 32, +0.32 | 32, +0.33 |
| Buys: n, avg R | 15, +0.18 | 28, +0.13 | 28, +0.13 |
Live minus backtest: -0.27R per trade (noise band +-0.43R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.00R. As traded vs engine on the same days: -0.14R over 60 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 60 done, avg +0.23R, max DD 3.69R. Planning edge +0.18R: live is +0.05R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 14 (-0.07R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 10 trades +0.48R; trend DOWN 3 trades -3.00R (look at 40 up-trend trades). MB1 paper from 05-13: 8 days, kept 2 trades (-0.24R); removed 5 (+8.05R); no break 1. +80 pip trades from 05-22: 0 of 15.
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 3.69R (now). Now: 3 in a row, 3.69R under the high.

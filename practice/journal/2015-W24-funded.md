# Journal - FUNDED ACCOUNT, week of 2015-06-08 (W24). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED. No figure without a tool print or a
python line behind it. Numbers or rules corrected after a push in June so far: 0 (May: 5). One test earns one day; one at a time (coach 06-04).
Start of week (from the tool after the 06-05 payout): tracker balance $25,068.71 (sim $25,612.25 minus $543.54 paid out), high-water $25,280.44, drawdown -0.84% (1.71R under the equity high). Last week +1.74R. No payout date this week (next Fri 06-19).
SIZE RULE = the real safety rule (coach 06-02): half size from a day's close at or below 3% under the high-water ($24,522.03) until a new high-water; STOP at 7% under ($23,510.81; fixed for funded days 36-55; 16 done - the review falls after Fri 06-12).
A2 is judged on a few hundred lived trades, not on the alarm alone. Lived average +0.23R +-0.26R at 70 lived trades.
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades, 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 543.54 25280.44`.
Coach 06-08: enough entry tweaks; the next backtest takes a different part of the plan - trade management or which days to sit out.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 06-08 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-08`, `./look.sh` or a bar print. Friday's tag stands: VALID LOSS.
  D1 (London days): Wed 06-03 close 1.12740 (0.95, range 205.6); Thu 06-04 close 1.12375 (0.10, range 157.6); Fri 06-05 high 1.12801 low 1.10495 close 1.11124
      (0.27, range 230.6): after my noon exit it fell 230 pips from the morning high to 1.10495 and closed 60 pips off the low. A new 3-day low.
      Four days in a row with a range of 150 pips or more.
  H4 (UTC bars): Fri 12:00 bar 1.12767 -> 1.10495 -> 1.11084; 16:00 bar 1.10942-1.11365; Sunday bar 1.10945-1.11111; tonight 00:00 bar low 1.10842; 04:00 bar up to 1.11219.
  H1: the night (00:00-07:00 London): open 1.11081, high 1.11219, low 1.10842, last 1.11219: range 37.7 pips (ratio 1.01), net +13.8 pips - a slightly rising night, against my side.
  M15: rising for two hours from 1.1096; the last candle closed on its high, 1.11219, the high of the night.
  Bias: SELL. 22:00 London closes: 06-05 1.11124 vs 06-02 1.11504 = -38 pips (3-day gap -38.0). The signal FLIPPED to sell (flip day). Gap / ADR5 0.20: a small signal.
  UN3 PAPER TAG (never live): 5-day gap +129 pips -> BUY; 3-day says SELL -> DISAGREE: paper SKIPS. Forward day 35, disagree day 9 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 27.
  MB1 PAPER TAG (never live, forward day 19; kept drawdown 4.00R, early-close line 6R): morning direction written at 12:00, before 13:25.
  Levels: night high 1.11219; Fri afternoon high 1.11365; night low 1.10842; Fri low 1.10495.
  Rejection-day check: for a sell, Friday would need the 3-day low (True) AND a close in the top third; it closed at 0.27. Not a rejection day.
  10-day-trend paper line: UP (1.11124 vs 05-22 1.10074); the sell is against it.
  SIZE RULE: tracker balance $25,068.71, high-water $25,280.44, drawdown -0.84%; trigger 1 (half size) $24,522.03 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,510.81.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: a small flip signal, against UN3 and the 10-day trend, into a night closing on its high. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 70 | 40 | +15.99 | +0.23 | 4.45R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 34 days, 8 disagree days of 30 | - | A2 on the disagree days +1.93R; on the agree days -0.63R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 26 days, 21 lively days of 60 | - | A2 on the lively days -0.30R (9 full-stop mornings), on the 5 quiet days +0.06R; PH2 about -0.08R vs A2 -0.26R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51).
Loss tags, all live trades: valid loss 43 (-29.84R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Fri 2015-06-05:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 70 | 70 |
| Win rate | 64% | 57% | 57% |
| Avg R | +0.50 | +0.23 | +0.23 |
| +- 2 standard errors | 0.33 | 0.26 | 0.26 |
| Net R | +19.56 | +15.99 | +16.17 |
| Avg win / avg loss | +1.04 / -0.46 | +1.00 / -0.79 | +1.01 / -0.81 |
| Full stops | 3 (8%) | 21 (30%) | 21 (30%) |
| Max drawdown | 1.87R | 4.45R | 4.54R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 37, +0.29 | 37, +0.29 |
| Buys: n, avg R | 15, +0.18 | 33, +0.16 | 33, +0.17 |
Live minus backtest: -0.27R per trade (noise band +-0.42R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.01R. As traded vs engine on the same days: -0.19R over 70 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 70 done, avg +0.23R, max DD 4.45R. Planning edge +0.18R: live is +0.05R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 19 (+3.50R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 13 trades +1.71R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 18 days, kept 7 trades (-1.87R, DD 4.00R); removed 10 (+8.03R); no break 1. +80 pip trades from 05-22: 2 of 15 (06-02 no difference; 06-04 noon +2.95R vs trail +2.48R). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.45R (06-01). Now: 1 in a row, 1.71R under the high.

# Journal - FUNDED ACCOUNT, week of 2015-05-11 (W20). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
Start of week (from the tool, 05-08): tracker balance $25,349.14 (sim $25,823.98 minus $474.84 paid out) = the high-water mark, drawdown 0.00%. Last week +1.01R. No payout date this week (next Fri 05-22).
SIZE RULE (the only size triggers): half size from a day's close at or below 3% under the high-water (today $24,588.67) until a new high-water; stop at 5% under (today $24,081.68).
Paper tags, never live: UN3 (call at 07:00), PH2 (decided at 08:00, written before the order). Every figure comes from a tool print: bt/call_numbers.py, bt/walk_numbers.py, bt/daily_numbers.py.
Coach, 05-11: quality over count - the next test starts with ten charts looked at and written up BEFORE any pre-registration.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 05-11 call, written 07:00 London (06:00 UTC), before the entry bar.** Friday's tag stands: VALID WIN. Figures from `python bt/call_numbers.py 2015-05-11` and the bar prints.
  D1 (22:00-22:00 London days): Wed 05-06 high 1.13700 low 1.11750 close 1.13459 (0.88); Thu 05-07 high 1.13916 low 1.12373 close 1.12662 (0.19, range 154.3);
      Fri 05-08 high 1.12880 low 1.11790 close 1.12015 (0.21, range 109.0). Two days closing near their lows after the 1.13916 high.
  H4 (UTC bars): Friday 12:00 bar high 1.12880, low 1.11790; the week opened at 1.11975; tonight's 00:00 bar fell from 1.11958 to 1.11435 (low 1.11332).
  H1: the night (00:00-07:00 London): open 1.11971, high 1.12025, low 1.11332, last 1.11453: range 69.3 pips (ratio 1.54), net -51.8 pips. A falling night; the low was at 04:xx London.
  M15: last four candles 1.11351-1.11535; last close 1.11453.
  Bias: BUY - by 17 pips. 22:00 London closes: 05-08 1.12015 vs 05-05 1.11848 (3-day gap +16.7). Third day on the buy side; one more down day flips it.
  UN3 PAPER TAG (never live): 5-day gap +7 pips -> BUY; 3-day says BUY -> agree: paper TRADES. Forward day 15 (3 disagree days of 30 so far).
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 7.
  Levels: night low 1.11332; Fri low 1.11790 (price is under it); night high 1.12025; Fri high 1.12880.
  Rejection-day check (parked observation): Friday closed at 0.21 of its range but did not make the 3-day high (False). 'Closed against me', not a rejection day.
  10-day-trend paper line: UP (1.12015 vs 04-24 1.08706); today's buy is with it. Stretch: gap / ADR5 = 0.12 (a small signal).
  Worry: third down day, a night that fell 52 pips, price under Friday's low, and a 17 pip signal. The rule says buy.
  Funded check / SIZE RULE: tracker balance $25,349.14 = the high-water, drawdown 0.00%. Trigger 1 at $24,588.67, trigger 2 at $24,081.68: neither reached -> FULL size.
  Plan: BUY 08:00 London, SL 40 pips under the bid at 08:00, out 12:00 London, 0.31 lots ($125 = 0.50%). Worst case about -$131 -> drawdown about -0.5%. One trade, stop not moved.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 50 | 32 | +17.70 | +0.35 | 3.23R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 14 days, 3 disagree days of 30 | - | A2 on the disagree days -0.39R; on the agree days +3.38R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 6 days, 5 lively days of 60 | - | A2 on the lively days +0.99R (1 full-stop morning), on the 1 quiet day +0.46R; PH2 +0.95R vs A2 +1.45R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31).
Loss tags, all live trades: valid loss 31 (-18.72R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Fri 2015-05-08:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 50 | 50 |
| Win rate | 64% | 64% | 64% |
| Avg R | +0.50 | +0.35 | +0.36 |
| +- 2 standard errors | 0.33 | 0.29 | 0.29 |
| Net R | +19.56 | +17.70 | +17.89 |
| Avg win / avg loss | +1.04 / -0.46 | +0.95 / -0.71 | +0.96 / -0.72 |
| Full stops | 3 (8%) | 11 (22%) | 11 (22%) |
| Max drawdown | 1.87R | 3.23R | 3.28R |
| Worst 10 trades in a row | +0.56R | -1.66R | -1.70R |
| Sells: n, avg R | 24, +0.70 | 26, +0.45 | 26, +0.45 |
| Buys: n, avg R | 15, +0.18 | 24, +0.25 | 24, +0.26 |
Live minus backtest: -0.15R per trade (noise band +-0.44R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): +0.12R. As traded vs engine on the same days: -0.20R over 50 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 50 done, avg +0.35R, max DD 3.23R. Planning edge +0.18R: live is +0.17R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 8 (+4.29R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 3 trades +1.16R; trend DOWN 0 trades (look at 40 up-trend trades).

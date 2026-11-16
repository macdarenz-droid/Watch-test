# Journal - FUNDED ACCOUNT, week of 2015-05-18 (W21). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
Start of week (from the tool, 05-15): tracker balance $25,114.78 (sim $25,589.62 minus $474.84 paid out), high-water $25,349.14, drawdown -0.92%. Last week -1.85R (three full stops). PAYOUT DATE this Friday 05-22.
SIZE RULE: half size from a day's close at or below 3% under the high-water (today $24,588.67) until a new high-water; STOP at 7% under (today $23,574.70; changed 05-15, fixed for funded days 36-55; day 36 done).
Paper tags, never live: UN3 (call at 07:00), PH2 (decided at 08:00, before the order), MB1 (morning direction written at 12:00, before 13:25). Every figure comes from a tool print.
Coach, 05-18: no more risk-plan tests for now; the next backtest is about finding or improving an ENTRY edge, starting from my own A2 losers and winners.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 05-18 call, written 07:00 London (06:00 UTC), before the entry bar.** Friday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-18` and the bar prints.
  D1 (London days): Wed 05-13 close 1.13536 (0.84); Thu 05-14 high 1.14447 low 1.13406 close 1.14097 (0.66); Fri 05-15 high 1.14669 low 1.13239 close 1.14484
      (0.87, range 143.0): after stopping me at 09:30 it fell to 1.13239, then rallied 143 pips to a new 3-day high in the afternoon. Fourth rising close.
  H4 (UTC bars): Fri 12:00 bar 1.13334 -> 1.14279 (low 1.13239, high 1.14506); 16:00 bar high 1.14669; Sunday bar 1.14469 -> 1.14440; tonight 00:00 bar down to 1.14190; 04:00 bar low 1.14175.
  H1: the night (00:00-07:00 London): open 1.14401, high 1.14450, low 1.14175, last 1.14376: range 27.5 pips (ratio 0.56, a quiet night), net -2.5 pips - flat.
  M15: dip to 1.14175 at 06:30 London, last candle back up 1.14261 -> 1.14376.
  Bias: BUY. 22:00 London closes: 05-15 1.14484 vs 05-12 1.12127 = +236 pips (3-day gap +235.7). Gap / ADR5 1.82: stretched (my best group over all history).
  UN3 PAPER TAG (never live): 5-day gap +247 pips -> BUY; agree: paper TRADES. Forward day 20, disagree days 5 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 12.
  MB1 PAPER TAG (never live, forward day 4): morning direction written at 12:00, before 13:25.
  Levels: night high 1.14450; Fri high 1.14669; night low 1.14175; Fri evening low 1.14121.
  Rejection-day check: Friday made the 3-day high (True) and closed at 0.87, not in the bottom third. Not a rejection day. 10-day trend: UP; the buy is with it.
  SIZE RULE: tracker balance $25,114.78, high-water $25,349.14, drawdown -0.92%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: three stops last week, two of them buys into this same up-move. The signal is the same and so is the plan. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 55 | 34 | +15.84 | +0.29 | 3.23R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 19 days, 5 disagree days of 30 | - | A2 on the disagree days -0.75R; on the agree days +1.89R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 11 days, 10 lively days of 60 | - | A2 on the lively days -0.86R (4 full-stop mornings), on the 1 quiet day +0.46R; PH2 about +0.03R vs A2 -0.40R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36).
Loss tags, all live trades: valid loss 34 (-21.73R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Fri 2015-05-15:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 55 | 55 |
| Win rate | 64% | 62% | 62% |
| Avg R | +0.50 | +0.29 | +0.29 |
| +- 2 standard errors | 0.33 | 0.27 | 0.28 |
| Net R | +19.56 | +15.84 | +16.00 |
| Avg win / avg loss | +1.04 / -0.46 | +0.93 / -0.75 | +0.94 / -0.76 |
| Full stops | 3 (8%) | 14 (25%) | 14 (25%) |
| Max drawdown | 1.87R | 3.23R | 3.28R |
| Worst 10 trades in a row | +0.56R | -1.66R | -1.70R |
| Sells: n, avg R | 24, +0.70 | 28, +0.40 | 28, +0.40 |
| Buys: n, avg R | 15, +0.18 | 27, +0.17 | 27, +0.17 |
Live minus backtest: -0.21R per trade (noise band +-0.43R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): +0.05R. As traded vs engine on the same days: -0.16R over 55 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 55 done, avg +0.29R, max DD 3.23R. Planning edge +0.18R: live is +0.11R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 11 (+2.93R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 8 trades -0.69R; trend DOWN 0 trades (look at 40 up-trend trades). MB1 paper from 05-13: 3 days, kept 0 trades; removed 2 (+3.23R); no break 1.

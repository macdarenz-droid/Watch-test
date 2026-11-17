# Journal - FUNDED ACCOUNT, week of 2015-06-01 (W23). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call, coach 06-01): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED. In a call or a note: no
figure without a tool print or a python line behind it. Count of numbers or rules corrected after a push in June so far: 0 (May: 5).
Start of week (from the tool, 05-29): tracker balance $24,914.52 (sim $25,389.36 minus $474.84 paid out), high-water $25,349.14, drawdown -1.71% (3.45R under the equity high). May -2.00R (review: journal/2015-05-month-end-review.md; coach: normal variance, no rule changes off one month). PAYOUT DATE this Friday 06-05.
SIZE RULE: half size from a day's close at or below 3% under the high-water ($24,588.67) until a new high-water; STOP at 7% under ($23,574.70; fixed for funded days 36-55; 11 done).
NORMAL WORST (written 05-19): 6 losses in a row; about 5.9R of drawdown. Live worst so far: 6 in a row (April), 3.69R (05-22).
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades, 80+ pip pre-entry hours.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 06-01 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-01`, `./look.sh` or a bar print taken at 07:00 with the full night in the feed (the partial print of the cut-off release was thrown away). Friday's tag stands: VALID LOSS.
  D1 (London days): Wed 05-27 close 1.09038 (0.77); Thu 05-28 close 1.09474 (0.88); Fri 05-29 high 1.10062 low 1.09258 close 1.09831 (0.71, range 80.4): a
      third rising close and a new 3-day high. The fall of May has turned up from the 1.0819 low.
  H4 (UTC bars): Fri 12:00 bar high 1.10062; 16:00 bar 1.09728-1.09978; Sunday bar down to 1.09521; tonight 00:00 bar low 1.09304; 04:00 bar 1.09490-1.09676.
  H1: the night (00:00-07:00 London): open 1.09681, high 1.09688, low 1.09304, last 1.09542: range 38.4 pips (ratio 0.94), net -13.9 pips - a slightly falling night, against my side.
  M15: 1.0957-1.0968, then one candle down to 1.09523; last close 1.09542.
  Bias: BUY. 22:00 London closes: 05-29 1.09831 vs 05-26 1.08719 = +111 pips (3-day gap +111.2). The signal FLIPPED to buy (flip day). Gap / ADR5 1.24: stretched.
  UN3 PAPER TAG (never live): 5-day gap -24 pips -> SELL; 3-day says BUY -> DISAGREE: paper SKIPS. Forward day 30, disagree day 7 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 22.
  MB1 PAPER TAG (never live, forward day 14; kept drawdown 4.00R, early-close line 6R): morning direction written at 12:00, before 13:25.
  Levels: night low 1.09304; Fri low 1.09258; night high 1.09688; Fri high 1.10062.
  Rejection-day check: for a buy, Friday would need the 3-day high (True) AND a close in the bottom third; it closed at 0.71. Not a rejection day.
  10-day-trend paper line: DOWN (1.09831 vs 05-15 1.14484); today's buy is against it.
  SIZE RULE: tracker balance $24,914.52, high-water $25,349.14, drawdown -1.71%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Monday, first trade of June, after a losing month: the plan, the same size. Month-end review: done on 05-29 before the last test, as the coach ordered.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: a flip day against the 10-day trend and against UN3. FL says flip days are ordinary. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 65 | 38 | +14.25 | +0.22 | 3.69R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 29 days, 6 disagree days of 30 | - | A2 on the disagree days +1.42R; on the agree days -1.86R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 21 days, 17 lively days of 60 | - | A2 on the lively days -3.04R (8 full-stop mornings), on the 4 quiet days +1.06R; PH2 about -0.46R vs A2 -2.00R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46).
Loss tags, all live trades: valid loss 40 (-27.20R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Fri 2015-05-29:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 65 | 65 |
| Win rate | 64% | 58% | 58% |
| Avg R | +0.50 | +0.22 | +0.22 |
| +- 2 standard errors | 0.33 | 0.26 | 0.26 |
| Net R | +19.56 | +14.25 | +14.38 |
| Avg win / avg loss | +1.04 / -0.46 | +0.93 / -0.79 | +0.94 / -0.80 |
| Full stops | 3 (8%) | 19 (29%) | 19 (29%) |
| Max drawdown | 1.87R | 3.69R | 3.75R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 37, +0.29 | 37, +0.29 |
| Buys: n, avg R | 15, +0.18 | 28, +0.13 | 28, +0.13 |
Live minus backtest: -0.28R per trade (noise band +-0.42R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.01R. As traded vs engine on the same days: -0.14R over 65 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 65 done, avg +0.22R, max DD 3.69R. Planning edge +0.18R: live is +0.04R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 17 (+1.63R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 10 trades +0.48R; trend DOWN 8 trades -2.75R (look at 40 up-trend trades). MB1 paper from 05-13: 13 days, kept 5 trades (-3.24R, DD 4.00R); removed 7 (+8.64R); no break 1. +80 pip trades from 05-22: 0 of 15. Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 3.69R (05-22). Now: 1 in a row, 3.45R under the high.

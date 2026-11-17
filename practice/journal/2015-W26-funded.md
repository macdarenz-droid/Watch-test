# Journal - FUNDED ACCOUNT, week of 2015-06-22 (W26). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED. No figure without a tool print or a
python line behind it. Numbers or rules corrected after a push in June so far: 3 (06-12 a stale paid-out label; 06-17 a wrong label on a test line; 06-18 "85 ideas" for 84; May: 5). One test earns one day; one at a time (coach 06-04).
Start of week (from the tool after the 06-19 payout): tracker balance $25,023.51 (sim $25,590.55 minus $567.04 paid out), high-water $25,256.94, drawdown -0.92% (1.83R under the equity high). Last week +2.16R. No payout date this week (next Fri 07-03).
SIZE RULE = the real safety rule (coach 06-02): half size from a day's close at or below 3% under the high-water ($24,499.23) until a new high-water; STOP at 7% under ($23,488.95).
A2 is judged on a few hundred lived trades, not on the alarm alone. Lived average +0.20R +-0.24R at 80 lived trades.
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 567.04 25256.94`.
Coach 06-22: A2 has been filtered enough. Next brick: from my own chart notes, 3 ideas for a SECOND setup that trades on days A2 doesn't, pick the best, prereg with a kill line, max 3 variants, costs on.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F62 | Mon 06-22 08:00 | buy | 0.31 | 1.13957 | 1.13546 | 1.13545 (stop, 08:32) | -1.00 | -$127.72 | VALID LOSS (valid setup, market disagreed) | after a weekend gap up and a rising night; never in profit; stopped in the third candle, 74 pips down within the hour; price at 12:00 London 1.13430 (11.6 pips beyond the stop); PH2 paper quiet, full size; UN3 agree; MB1 paper day 29: removed, +0.73R |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 06-22 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-22`, `./look.sh` or a bar print. Friday's tag stands: VALID LOSS.
  Coach 06-22: see the header. Nothing live changes.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  D1 (London days): Wed 06-17 close 1.13372 (0.86); Thu 06-18 close 1.13600 (0.28); Fri 06-19 high 1.13992 low 1.12920 close 1.13487 (0.53, range 107.2):
      down in my morning to 1.1292, back up in the afternoon to a close in the middle. A lower close than Thursday's.
  Weekend: Friday's last 1.13487; Sunday's first bar opened 1.13771: a gap UP of about 28 pips. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar 1.12964-1.13524; 16:00 bar up to 1.13659; Sunday bar 1.13575-1.13780; tonight 00:00 bar up to 1.13854; 04:00 bar up to 1.14034, last 1.14024 (on its high).
  H1: the night (00:00-07:00 London): open 1.13601, high 1.14034, low 1.13585, last 1.14024: range 44.9 pips (ratio 1.30), net +42.3 pips - a rising night, WITH a buy.
  M15: the last candle rose 8 pips to the night's high.
  Bias: BUY. 22:00 London closes: 06-19 1.13487 vs 06-16 1.12471 = +102 pips (3-day gap +101.6). Gap / ADR5 0.85. Third buy.
  UN3 PAPER TAG (never live): 5-day gap +84 pips (83.9) -> BUY; agree: paper TRADES. Forward day 45, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 37.
  MB1 PAPER TAG (never live, forward day 29): morning direction written at 12:00, before 13:25. Kept drawdown 5.63R; early-close line 6R.
  Levels: night high 1.14034; Thu high 1.14364 (the month's high); night low 1.13585; Fri low 1.12920.
  Rejection-day check: for a buy, Friday did not make the 3-day high. Not a rejection day. 10-day trend: UP (1.13487 vs 06-05 1.11124); the buy is WITH it.
  SIZE RULE (the real safety rule): tracker balance $25,023.51, high-water $25,256.94, drawdown -0.92%; trigger 1 (half size) $24,499.23 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,488.95.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: buying 55 pips above Friday's close after a gap and a rising night. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.13798-1.14035 = 23.7 pips -> PH2 paper: QUIET, paper full size (decided before the order). Price 1.13946; night with me by 34.5 pips (not counted); entry 7.8 pips better than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.13546).
  08:15 London: filled BUY 1.13957, stop 1.13546 (41.1 pips from the fill). First candle down to 1.13768, close 1.13855: about -10 pips. Hands off.
  09:00 London: STOPPED in the 08:30 London candle (low 1.13441, 10.5 pips through my level); the next candle fell to 1.13215. Never in profit. Sim balance from the tool $25,462.83. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.13430 = 52.7 pips under my entry, 11.6 pips beyond the stop; morning low 1.13120 (42.6 pips through). Without the stop about -1.28R at noon: the stop SAVED about 0.28R today. A real loss. MB1 paper (forward day 29), written before 13:25: open 08:00 about 1.13946, price at 12:00 about 1.1343 -> morning DOWN by about 52 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: June goal read before the call; size rule read, no
     trigger, full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved, one trade,
     nothing after the stop. Process: clean. All figures from `python bt/daily_numbers.py 567.04 25256.94`, the walk prints, the trade list and python lines.
     Result: bought 1.13957, stop 1.13546 (41.1 pips from the fill, risk $127.41), STOPPED 08:32 London @1.13545, -$127.72 = -1.00R.
     Never in profit; stopped in the third candle; the fourth fell another 33 pips. Price at 12:00 London 1.13430 (11.6 pips beyond the stop; about -1.28R
     at noon without it): the stop saved about 0.28R. A real loss.
     Tracker balance $24,895.79 (sim $25,462.83 minus $567.04 paid out), high-water $25,256.94, drawdown -1.43%.
     SIZE RULE after the day: trigger 1 (half size) $24,499.23 NOT reached -> FULL size tomorrow; $396.56 away. Trigger 2 $23,488.95.
     Funded totals from the tool: 62 trades, 31 wins, 31 valid losses, +3.75R (March +0.97R, April +4.17R, May -2.00R, June +0.61R in 16 trades).
     Two full stops in a row; 2.83R under the equity high (1.83 + 1.00). Lived average +0.18R +-0.24R at 81 lived trades (tool).
     How it feels: ordinary. Two stops after five wins. Same size tomorrow.
     Paper tags: UN3 agreed, same -1.00R (agree days -1.83R in 34 trades; disagree days +2.01R in 11; n = 11 of 30).
     PH2 (paper, forward day 37): quiet (23.7) -> paper full size, same -1.00R. Tally: 37 days, 27 lively (live -1.61R, 12 full-stop mornings),
     10 quiet (+0.25R, 4 full-stop mornings); PH2 total about -0.54R against A2's -1.38R (Friday's figures minus 1.00).
     MB1 (paper, forward day 29; `python bt/morning_box.py 2015-06-23 --check 2015-06-22`): open 08:00 1.13946, open 12:00 1.13428 -> morning -51.8 pips (DOWN, large);
     the box broke UP -> against -> REMOVED: +0.73R. Twenty-nine forward days: kept 10 (-4.87R, DD 5.63R), removed 17 (+10.96R), no break 2.
     Night count: the night was WITH me (+34.5 pips) -> not counted (25 trades, +2.47R). 10-day-trend paper line: trend UP 24 trades, +0.59R; trend DOWN 10 trades, -2.24R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (4 of 10).
     END OF RELEASED DATA (clock Tue 06-23 01:00 London).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 81 | 45 | +14.86 | +0.18 | 4.85R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 45 days, 11 disagree days of 30 | - | A2 on the disagree days +2.01R; on the agree days -1.83R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 37 days, 27 lively days of 60 | - | A2 on the lively days -1.61R (12 full-stop mornings), on the 10 quiet days +0.25R; PH2 about -0.54R vs A2 -1.38R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59) | 06-18 +1.20 (funded 60) | 06-19 -1.00 (funded 61) | 06-22 -1.00 (funded 62).
Loss tags, all live trades: valid loss 49 (-34.99R, from the tool) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 81 | 81 |
| Win rate | 64% | 56% | 56% |
| Avg R | +0.50 | +0.18 | +0.18 |
| +- 2 standard errors | 0.33 | 0.24 | 0.24 |
| Net R | +19.56 | +14.86 | +14.96 |
| Avg win / avg loss | +1.04 / -0.46 | +0.97 / -0.81 | +0.99 / -0.82 |
| Full stops | 3 (8%) | 26 (32%) | 26 (32%) |
| Max drawdown | 1.87R | 4.85R | 4.92R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 42, +0.30 | 42, +0.30 |
| Buys: n, avg R | 15, +0.18 | 39, +0.06 | 39, +0.06 |
Live minus backtest: -0.32R per trade (noise band +-0.41R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.05R. As traded vs engine on the same days: -0.10R over 81 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 81 done, avg +0.18R, max DD 4.85R. Planning edge +0.18R: live is +0.00R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 25 (+2.47R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 24 trades +0.59R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 29 days, kept 10 trades (-4.87R, DD 5.63R); removed 17 (+10.96R); no break 2. +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.85R (06-11). Now: 2 in a row, 2.83R under the high.

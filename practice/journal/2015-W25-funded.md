# Journal - FUNDED ACCOUNT, week of 2015-06-15 (W25). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED. No figure without a tool print or a
python line behind it. Numbers or rules corrected after a push in June so far: 1 (06-12: a stale paid-out label in STATE; May: 5). One test earns one day; one at a time (coach 06-04).
Start of week (from the tool, 06-12): tracker balance $24,777.93 (sim $25,321.47 minus $543.54 paid out), high-water $25,280.44, drawdown -1.99% (4.00R under the equity high). Last week -2.29R. PAYOUT DATE this week: Fri 06-19 (rule applied exactly as written).
SIZE RULE = the real safety rule (coach 06-02): half size from a day's close at or below 3% under the high-water ($24,522.03) until a new high-water; STOP at 7% under ($23,510.81; reviewed and kept 06-11).
A2 is judged on a few hundred lived trades, not on the alarm alone. Lived average +0.18R +-0.25R at 75 lived trades.
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 543.54 25280.44`.
Coach 06-15: enough forward re-tests of killed ideas (LK is dead twice). Next test: something new from my own notes - 3 fresh hypotheses about how my best A2 days START, pick the strongest, prereg with a kill line, max 3 variants.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F57 | Mon 06-15 08:00 | sell | 0.31 | 1.12277 | 1.12678 | 1.12183 (12:00 close) | +0.23 | +$29.14 | VALID WIN | very small signal against the 10-day trend, after a weekend gap down; -34.0 pips at 09:00 (6 from the stop), best +19.8, closed by the clock at +9.4; PH2 paper lively, half size; UN3 DISAGREE (paper skips); MB1 paper day 24: removed, +1.28R |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 06-15 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-15`, `./look.sh` or a bar print. Friday's tag stands: VALID WIN.
  Coach 06-15: see the header. Nothing live changes.
  D1 (London days): Wed 06-10 close 1.13237 (0.50); Thu 06-11 close 1.12573 (0.50); Fri 06-12 high 1.12965 low 1.11512 close 1.12648 (0.78, range 145.3):
      a new 3-day low in my morning, then all of it bought back and a close near the top. A slightly higher close than Thursday's.
  Weekend: Friday's last 1.12648; Sunday's first bar opened 1.12102: a gap DOWN of about 55 pips. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar 1.11974 -> 1.12965, close 1.12773; 16:00 bar back to 1.12541; Sunday bar 1.12086-1.12310; tonight 00:00 bar down to 1.11949, close 1.12172; 04:00 bar down to 1.11891, last 1.11922.
  H1: the night (00:00-07:00 London): open 1.12270, high 1.12283, low 1.11891, last 1.11922: range 39.2 pips (ratio 0.80), net -34.8 pips - a falling night, WITH a sell.
  M15: four falling candles since 06:00 London; the last one closes on the night's low (1.11891).
  Bias: SELL. 22:00 London closes: 06-12 1.12648 vs 06-09 1.12822 = -17 pips (3-day gap -17.4). Gap / ADR5 0.11: a very small signal.
  UN3 PAPER TAG (never live): 5-day gap +152 pips (152.4) -> BUY; DISAGREE: paper SKIPS. Forward day 40, disagree day 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 32.
  MB1 PAPER TAG (never live, forward day 24): morning direction written at 12:00, before 13:25.
  Levels: night low 1.11891; Fri low 1.11512; night high 1.12283; Fri close 1.12648 (the gap's upper edge); Fri high 1.12965.
  Rejection-day check: for a sell, Friday made the 3-day low (True) AND closed at 0.78, in the top third: a REJECTION day by my old note. Written, not a rule: A2 has no skips.
  10-day trend: UP (1.12648 vs 05-29 1.09831); the sell is AGAINST it (counted).
  SIZE RULE (the real safety rule): tracker balance $24,777.93, high-water $25,280.44, drawdown -1.99%; trigger 1 (half size) $24,522.03 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,510.81.
  One win behind me after five losses. Same size, same rules; Friday changes nothing.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling after a weekend gap down and a falling night, on a very small signal. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.11902-1.12350 = 44.8 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.12278: the hour took back the whole falling night (last candle 1.11947-1.12350); night against me by 0.8 pips (counted); entry 35.6 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.12678).
  08:15 London: filled SELL 1.12277, stop 1.12678 (40.1 pips from the fill). First candle up to 1.12461, close 1.12417: -14.9 pips, worst -19.3. Hands off.
  09:00 London: an hour of going nowhere above my entry: worst -21.7 pips (high 1.12484), best +3.8, last -7.3. Still in. Next look 10:00.
  10:00 London: the 09:00 candle went to 1.12607, 34.0 pips against me and 6.1 pips (bid) from the stop, then back: last -10.9. Under water all hour. The stop is where it was. Next look 11:00.
  11:00 London: a slow slide back through my entry: best +14.6, last +10.3 pips. One hour left; I close at 12:00 by the clock.
  12:00 London: closed by the clock. SELL 1.12277 -> 1.12183 (trade list), +$29.14. MB1 paper (forward day 24), written before 13:25: open 08:00 about 1.12278, price at 12:00 about 1.1218 -> morning DOWN by about 10 pips (small morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Mon result, TAG FIRST: VALID WIN (valid setup, plan followed to the bell). Checked: June goal read before the call; size rule read, no trigger, full
     size; call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade.
     All figures from `python bt/daily_numbers.py 543.54 25280.44`, the walk prints, the trade list and python lines.
     Result: sold 1.12277, stop 1.12678 (40.1 pips from the fill, risk $124.31), closed 12:00 London @1.12183, +$29.14 = +0.23R.
     The honest part: at 09:00 London the price was 34.0 pips against me, 6.1 pips (bid) from the stop. A small win that was nearly a full loss.
     Best +19.8 pips. After noon the price rose 57 pips (1.12753 at the end of the day): the noon clock again.
     Tracker balance $24,807.07 (sim $25,350.61 minus $543.54 paid out), high-water $25,280.44, drawdown -1.87%.
     SIZE RULE after the day: trigger 1 (half size) $24,522.03 NOT reached -> FULL size tomorrow; $285.04 away. Trigger 2 $23,510.81.
     Funded totals from the tool: 57 trades, 28 wins, 29 valid losses, +2.83R (March +0.97R, April +4.17R, May -2.00R, June -0.32R in 11 trades).
     Drawdown in R: 3.77R under the equity high (4.00 - 0.23). Lived average +0.18R +-0.25R at 76 lived trades (tool).
     How it feels: calm. Two wins that both sat within 11 pips of the stop: I notice that I count them as "back on track" and they are not evidence.
     Paper tags: UN3 DISAGREED (paper skipped +0.23R): disagree days 11 of 30, A2 on them +2.01R (11 trades); agree days -2.77R in 29.
     PH2 (paper, forward day 32): lively (44.8) -> paper half = +0.12R against the live +0.23R. Tally: 32 days, 26 lively (live -3.21R, 12 full-stop
     mornings), 6 quiet (+0.91R); PH2 total about -0.68R against A2's -2.32R (Friday's figures plus today's).
     MB1 (paper, forward day 24; `python bt/morning_box.py 2015-06-16 --check 2015-06-15`): open 08:00 1.12278, open 12:00 1.12172 -> morning -10.6 pips (DOWN, small);
     the box broke UP -> against -> REMOVED: +1.28R. Twenty-four forward days: kept 9 (-3.87R, DD 4.63R), removed 14 (+10.77R), no break 1.
     Night count: against me by 0.8 pips -> live trade 22 of the count (22 trades, +1.73R). 10-day-trend paper line: trend UP 19 trades, -0.35R; trend DOWN 10 trades, -2.24R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (4 of 10).
     END OF RELEASED DATA (clock Tue 06-16 01:00 London).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 76 | 42 | +13.93 | +0.18 | 4.85R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 40 days, 11 disagree days of 30 | - | A2 on the disagree days +2.01R; on the agree days -2.77R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 32 days, 26 lively days of 60 | - | A2 on the lively days -3.21R (12 full-stop mornings), on the 6 quiet days +0.91R; PH2 about -0.68R vs A2 -2.32R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57).
Loss tags, all live trades: valid loss 47 (-32.98R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 76 | 76 |
| Win rate | 64% | 55% | 55% |
| Avg R | +0.50 | +0.18 | +0.18 |
| +- 2 standard errors | 0.33 | 0.25 | 0.25 |
| Net R | +19.56 | +13.93 | +14.05 |
| Avg win / avg loss | +1.04 / -0.46 | +0.97 / -0.79 | +0.99 / -0.81 |
| Full stops | 3 (8%) | 24 (32%) | 24 (32%) |
| Max drawdown | 1.87R | 4.85R | 4.92R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 40, +0.27 | 40, +0.27 |
| Buys: n, avg R | 15, +0.18 | 36, +0.09 | 36, +0.09 |
Live minus backtest: -0.32R per trade (noise band +-0.41R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.05R. As traded vs engine on the same days: -0.13R over 76 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 76 done, avg +0.18R, max DD 4.85R. Planning edge +0.18R: live is +0.00R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 22 (+1.73R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 19 trades -0.35R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 24 days, kept 9 trades (-3.87R, DD 4.63R); removed 14 (+10.77R); no break 1. +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.85R (06-11). Now: 0 in a row, 3.77R under the high.

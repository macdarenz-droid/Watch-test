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
| F63 | Tue 06-23 08:00 | buy | 0.31 | 1.12659 | 1.12238 | 1.12237 (stop, 11:07) | -1.00 | -$130.82 | VALID LOSS (valid setup, market disagreed) | a 3 pip signal after a 90 pip falling night (the price 55 pips under the close the signal was read from); best +14.6, held by 1.2 pips at 10:45, stopped 11:07; price at 12:00 London 1.12201 (3.7 pips beyond the stop); PH2 paper half size; UN3 agree; MB1 paper day 30: kept, -0.03R |

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

- **Tue 06-23 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-23`, `./look.sh` or a bar print. Yesterday's tag stands: VALID LOSS.
  Coach 06-23: right to kill WG, 15 weekends cannot prove anything either way. Next second-setup try: one that gives 100+ cases in my history. Study
      first how the big moves on my charts start (what the hour before looked like), then turn one observation into a rule.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  D1 (London days): Thu 06-18 close 1.13600 (0.28); Fri 06-19 close 1.13487 (0.53); Mon 06-22 high 1.14102 low 1.13120 close 1.13402 (0.29, range 98.2):
      down in my morning, up to 1.1410 in the afternoon, back down by the evening. Third close in a row a little lower than the one before.
  H4 (UTC bars): Mon 12:00 bar up to 1.14102; 16:00 bar back to 1.13210; 20:00 bar flat; tonight 00:00 bar 1.13450 -> low 1.12549, close 1.12646: a 90 pip fall in the night; 04:00 bar 1.12601-1.12828, last 1.12826.
  H1: the night (00:00-07:00 London): open 1.13416, high 1.13472, low 1.12549, last 1.12826: range 92.3 pips (ratio 2.58: the widest night for a long time), net -59.0 pips - a falling night, AGAINST a buy.
  M15: a slow lift off the low for three hours: 1.1260 -> 1.1283.
  Bias: BUY. 22:00 London closes: 06-22 1.13402 vs 06-17 1.13372 = +3 pips (3-day gap +3.0). Gap / ADR5 0.03: the smallest signal there is. The rule says any gap counts.
      The price now is 55 pips UNDER the close the signal was read from: the night has already erased it. Idea FS (06-08) looked at exactly this - a
      signal read at 07:00 instead of 22:00 - and it did not beat the 22:00 reading. The rule is the 22:00 closes. BUY.
  UN3 PAPER TAG (never live): 5-day gap +58 pips (57.6) -> BUY; agree: paper TRADES. Forward day 46, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 38.
  MB1 PAPER TAG (never live, forward day 30): morning direction written at 12:00, before 13:25. Kept drawdown 5.63R; early-close line 6R.
  Levels: night low 1.12549; Fri low 1.12920 (now above the price); Mon low 1.13120; night high 1.13472.
  Rejection-day check: for a buy, Monday did not make the 3-day high. Not a rejection day. 10-day trend: UP (1.13402 vs 06-08 1.12906); the buy is WITH it.
  SIZE RULE (the real safety rule): tracker balance $24,895.79, high-water $25,256.94, drawdown -1.43%; trigger 1 (half size) $24,499.23 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,488.95.
  Two stops in a row behind me. Same size.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: a 3 pip signal against a 90 pip night. This is the kind of morning on which I most want to skip - and BD's line is in front of me. Written, not a rule.
  08:00 London Tue: pre-entry hour 1.12409-1.12833 = 42.4 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.12638: a new low for the night (1.12409) in the hour before the bell; night against me by 77.8 pips (counted); entry 18.8 pips better than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.12238).
  08:15 London: filled BUY 1.12659, stop 1.12238 (42.1 pips from the fill). First candle 1.12603-1.12747, close 1.12700. Hands off.
  09:00 London: a quiet hour around my entry: best +14.6, worst -7.0, last -6.8 pips. Next look 10:00.
  10:00 London: down through the pre-bell low: worst -34.7 pips (low 1.12312, 7.4 pips above the stop), last -27.4. Under water all hour. The stop is where it was. Next look 11:00.
  11:00 London: still in, by 1.2 pips: the 10:45 candle went to 1.12250 against my stop at 1.12238. Last -30.5 pips. One hour left. The stop stays; the close is at 12:00 by the clock if the stop is not taken first.
  12:00 London: STOPPED at 11:07 London (the 11:00 candle's low 1.12203, 3.5 pips through my level). Price at 12:00 (bid, tool) 1.12201 = 45.8 pips under my entry, 3.7 pips beyond the stop; morning low 1.12189. Without the stop about -1.09R at noon: the stop cost nothing. A real loss. Sim balance $25,332.01. MB1 paper (forward day 30), written before 13:25: open 08:00 about 1.12638, price at 12:00 about 1.1220 -> morning DOWN by about 44 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Tue result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: June goal read before the call; size rule read, no
     trigger, full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved (it held by
     1.2 pips at 10:45 and I left it), one trade, nothing after the stop. Process: clean.
     All figures from `python bt/daily_numbers.py 567.04 25256.94`, the walk prints, the trade list and python lines.
     Result: bought 1.12659, stop 1.12238 (42.1 pips from the fill, risk $130.51), STOPPED 11:07 London @1.12237, -$130.82 = -1.00R.
     Best +14.6 pips in the first 45 minutes, then lower step by step. Price at 12:00 London 1.12201 (3.7 pips beyond the stop; about -1.09R at noon
     without it). A real loss. The day ended at 1.11745, about 90 pips under my entry.
     The 3 pip signal against a 90 pip night lost. It is one case; idea FS tested the general question on all history and the 22:00 reading held.
     I traded it at full size because that is the rule, and I would do the same tomorrow.
     Tracker balance $24,764.97 (sim $25,332.01 minus $567.04 paid out), high-water $25,256.94, drawdown -1.95%.
     SIZE RULE after the day: trigger 1 (half size) $24,499.23 NOT reached -> FULL size tomorrow. It is $265.74 away: two more full stops (about $255)
     would leave about $10 of room; the rule reads the close and I neither cut early nor delay it. Trigger 2 $23,488.95.
     Funded totals from the tool: 63 trades, 31 wins, 32 valid losses, +2.75R (March +0.97R, April +4.17R, May -2.00R, June -0.39R in 17 trades).
     AGAINST THE WRITTEN NUMBER (05-19): three full stops in a row (written normal worst: 6); 3.83R under the equity high (written 95th pct 5.92R;
     deepest lived 4.85R). Inside the range. Lived average +0.17R +-0.24R at 82 lived trades (tool).
     How it feels: tired of stops, and aware that last week's five wins felt just as meaningful. Same size tomorrow.
     Paper tags: UN3 agreed, same -1.00R (agree days -2.83R in 35 trades; disagree days +2.01R in 11; n = 11 of 30).
     PH2 (paper, forward day 38): lively (42.4) -> paper half = -0.50R against the live -1.00R. Tally: 38 days, 28 lively (live -2.61R, 13 full-stop
     mornings), 10 quiet (+0.25R, 4 full-stop mornings); PH2 total about -1.04R against A2's -2.38R (yesterday's figures plus today's).
     MB1 (paper, forward day 30; `python bt/morning_box.py 2015-06-24 --check 2015-06-23`): open 08:00 1.12648, open 12:00 1.12202 -> morning -44.6 pips (DOWN, large);
     the box broke DOWN -> with -> KEPT: -0.03R. Thirty forward days: kept 11 (-4.90R, DD 5.66R = 5.63 + 0.03), removed 17 (+10.96R), no break 2.
     Its early-close lines: kept DD above 6R (now 5.66R); net below -3R at 20 kept (11 kept, -4.90R); average below 0 at 40. Not reached.
     Night count: against me by 77.8 pips -> live trade 26 of the count (26 trades, +1.47R). 10-day-trend paper line: trend UP 25 trades, -0.41R; trend DOWN 10 trades, -2.24R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (42.4; 4 of 10).
     END OF RELEASED DATA (clock Wed 06-24 01:00 London).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 82 | 45 | +13.85 | +0.17 | 4.85R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 46 days, 11 disagree days of 30 | - | A2 on the disagree days +2.01R; on the agree days -2.83R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 38 days, 28 lively days of 60 | - | A2 on the lively days -2.61R (13 full-stop mornings), on the 10 quiet days +0.25R; PH2 about -1.04R vs A2 -2.38R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59) | 06-18 +1.20 (funded 60) | 06-19 -1.00 (funded 61) | 06-22 -1.00 (funded 62) | 06-23 -1.00 (funded 63).
Loss tags, all live trades: valid loss 50 (-35.99R, from the tool) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 82 | 82 |
| Win rate | 64% | 55% | 55% |
| Avg R | +0.50 | +0.17 | +0.17 |
| +- 2 standard errors | 0.33 | 0.24 | 0.24 |
| Net R | +19.56 | +13.85 | +13.93 |
| Avg win / avg loss | +1.04 / -0.46 | +0.97 / -0.81 | +0.99 / -0.82 |
| Full stops | 3 (8%) | 27 (33%) | 27 (33%) |
| Max drawdown | 1.87R | 4.85R | 4.92R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 42, +0.30 | 42, +0.30 |
| Buys: n, avg R | 15, +0.18 | 40, +0.04 | 40, +0.04 |
Live minus backtest: -0.33R per trade (noise band +-0.41R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.06R. As traded vs engine on the same days: -0.07R over 82 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 82 done, avg +0.17R, max DD 4.85R. Planning edge +0.18R: live is -0.01R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 26 (+1.47R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 25 trades -0.41R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 30 days, kept 11 trades (-4.90R, DD 5.66R); removed 17 (+10.96R); no break 2. +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.85R (06-11). Now: 3 in a row, 3.83R under the high.

## 06-22 research after funded day 62 (coach: 3 ideas from my notes for a second setup, pick the best, prereg, max 3 variants): journal/2015-idea-WG-weekend-gap-second-setup.md.
Three ideas written with their samples counted without outcomes (weekend gap 17 cases; late-day move 58, no side in my notes; 13:30 candle 12); the weekend
gap picked; its two inspiring weekends hand-worked first (-1.00R and -0.10R) and dropped; rules and kill lines K1-K7 pushed before the code; the
simulator matched the hand-worked cases; one run. 15 judged weekends: +0.087R / -0.018R / +0.022R a trade by deadline; negative at a 3 pip Sunday
spread; correlation with A2 +0.02. All killed (K1, K5). Second setups tried: 11, none alive. Counts: 87 ideas, 244 variants. June corrections after a push: 3.

## 06-23 research after funded day 63 (coach: a second-setup try with 100+ cases; study how big moves start, one observation as a rule):
journal/2015-idea-MH-momentum-hour-second-setup.md. Study on January-March only (549 afternoon hours): big hours follow wide hours going the same way,
not quiet ones. Rule from one line of it: follow a 20+ pip hour that closes outside the three hours before; hand-worked day and kill lines K1-K7 (with
April-June as an unseen period) pushed before the code; the simulator matched the hand-worked day; one run, 168 signals. Study months +0.09R to +0.40R
a trade; unseen months -0.05R to -0.10R: all three killed. The unseen split is what caught it (MH3 was +14.18R on all history). Second setups tried:
12, none alive. Counts: 88 ideas, 247 variants. June corrections after a push: 3.

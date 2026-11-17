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
| F47 | Mon 06-01 08:00 | buy | 0.31 | 1.09392 | 1.08982 | 1.08981 (stop, 09:38) | -1.00 | -$127.41 | VALID LOSS (valid setup, market disagreed) | flip day; +14.2 pips in the first candle, then down; low 1.08915 = 6.7 pips through the stop; price at 12:00 London 1.09225 (-16.7 from entry, 24.3 ABOVE the stop; -0.41R at noon without it): a poke; quiet pre-entry hour (26.7): PH2 paper full size; UN3 DISAGREE (paper skips); MB1 paper day 14: break UP against the morning, removed, -1.00R |
| F48 | Tue 06-02 08:00 | buy | 0.31 | 1.09563 | 1.09151 | 1.10185 (12:00 close) | +1.51 | +$192.82 | VALID WIN | small signal; +36 and back to -8 in the first hour, a wide range, then +82.3 pips at the best in the last hour; closed +62.2; first +80 pip trade of the counts-only line (trail 80/40 would have closed at the same noon price); PH2 paper half size; UN3 DISAGREE (paper skips a +1.51R winner); MB1 paper day 15: kept, +2.37R |
| F49 | Wed 06-03 08:00 | buy | 0.31 | 1.11695 | 1.11286 | 1.11285 (stop, 08:11) | -1.00 | -$127.10 | VALID LOSS (valid setup, market disagreed) | the morning after a 278 pip day; the first 5-minute candle fell 32 pips; stopped in 11 minutes, never in profit; price at 12:00 London 1.11214 (-48.1 from entry, 7.2 beyond the stop): a real stop; PH2 paper half size; UN3 agree; MB1 paper day 16: kept, -1.00R |

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
  08:00 London Mon: pre-entry hour 1.09346-1.09613 = 26.7 pips -> PH2 paper: QUIET, paper full size (decided before the order). Price 1.09382: night against me by 29.9 pips (counted); entry 16.0 pips better than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.08982).
  08:15 London: filled BUY 1.09392, stop 1.08982 (41.0 pips from the fill). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +14.2, worst -34.8 (low 1.09044, 6.2 pips from the stop), last -32.8 pips: three falling candles after a first pop. Nothing to do; the stop is the stop. No call.
  10:00 London: STOPPED in the 09:30 London candle (low 1.08953, 2.9 pips through my level). Sim balance from the tool $25,261.95. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.09225 = 16.7 pips under my entry and 24.3 pips ABOVE my stop; the morning low was 1.08915, 6.7 pips through my level. Without the stop about -0.41R at noon instead of -1.00R (python): a poke, the stop cost about 0.6R. Written, not a case for anything: SA priced wider stops on all history. MB1 paper (forward day 14), written before 13:25: open 08:00 1.09381, price at 12:00 1.09225 -> morning DOWN by about 16 pips (small morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: June goal read before the call; size rule read, no trigger,
     full size; call committed at 07:00 London on a complete print; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved, one
     trade, nothing after the stop. Process: clean. Numbers corrected after a push in June: 0.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints, the trade list and python lines.
     Result: bought 1.09392, stop 1.08982 (40 pips under the bid at the order; 41.0 from the fill, risk $127.10), STOPPED 09:38 London @1.08981, -$127.41 = -1.00R.
     Tracker balance $24,787.11 (sim $25,261.95 minus $474.84 paid out), high-water $25,349.14, drawdown -2.22%: a NEW DEEPEST (was -1.83% on 05-22).
     Size rule after the day: trigger 1 (half size) $24,588.67 NOT reached -> full size tomorrow. It is $198.44 away: one more full stop leaves about $70 of
     room, a second one triggers half size on that day's close. The rule decides on the close; I only read it. Trigger 2 (stop trading) $23,574.70.
     Funded totals from the log: 47 trades, 24 wins, 23 valid losses, +2.14R (March +0.97R, April +4.17R, May -2.00R, June -1.00R in 1 trade).
     AGAINST THE WRITTEN NUMBER (05-19: normal worst 6 losses in a row, about 5.9R): 2 in a row; 4.45R under the equity high (trade list) - a new live maximum
     drawdown (was 3.69R). Above the median worst case (3.09R), inside the 95th percentile (5.92R). The A2 alarm's lines (at 100 live trades: average
     >= +0.10R, max DD <= 8R) read +0.20R and 4.45R at 66 trades. Coach, 06-01: May was normal variance, no rule changes off one month. None made.
     How it feels: tired of stops, and aware that the half-size trigger is close. That awareness must not touch tomorrow's size: full, by the rule.
     Price at 12:00 London (stop-day routine): bid 1.09225 = 16.7 pips under my entry, 24.3 pips ABOVE the stop; morning low 1.08915 (6.7 pips through).
     About -0.41R at noon without the stop: a poke that cost about 0.6R.
     Paper tags: UN3 - seventh forward DISAGREE day - paper skips a -1.00R trade (disagree days: +1.42R after six, now +0.42R in 7; agree days -1.86R in 23; n = 7 of 30).
     PH2 (paper, forward day 22): QUIET hour (26.7) -> paper full size = -1.00R, same as live. Tally: 22 days, 17 lively (live -3.04R, 8 full-stop mornings),
     5 quiet (+0.06R, 2 full-stop mornings); PH2 total about -1.46R against A2's -3.00R.
     MB1 (paper, forward day 14; `python bt/morning_box.py 2015-06-02 --check 2015-06-01`): open 08:00 1.09381, open 12:00 1.09225 -> morning -15.6 pips (DOWN, small);
     the box broke UP -> against -> REMOVED; that trade lost -1.00R. Fourteen forward days: kept 5 (-3.24R, DD 4.00R), removed 8 (+7.64R), no break 1.
     Night count: against me by 29.9 pips -> live trade 18 of the count (running: 18 trades, +0.63R). 10-day-trend paper line: trend DOWN: 9 trades, -3.75R; trend UP: 10 trades, +0.48R.
     +80 pip trades: none (0 of 15). 80+ pip pre-entry hours: none (4 of 10).
     Payout date Friday 06-05: the balance is under $25,000; as it stands the request is $0.
     END OF RELEASED DATA (clock Tue 06-02 01:00 London).

- **Tue 06-02 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-02`, `./look.sh` or a bar print. Yesterday's tag stands: VALID LOSS.
  Coach 06-02, written into the plan before this call: do not decide from the alarm alone; A2 stays at the planned size; the drawdown / breach guard is the
      real safety rule; the edge is judged after a few hundred lived trades over 2-3 years. My question of yesterday is answered. Nothing in today's trade changes.
  D1 (London days): Thu 05-28 close 1.09474 (0.88); Fri 05-29 close 1.09831 (0.71); Mon 06-01 high 1.09885 low 1.08873 close 1.09259 (0.38, range 101.2): a
      lower close after three rising ones; neither a 3-day high nor a 3-day low. After stopping me it fell to 1.08873, rose to 1.09790 and came back.
  H4 (UTC bars): Mon 12:00 bar 1.08873-1.09790; 16:00 bar 1.09043-1.09429; tonight 00:00 bar 1.09159-1.09346; 04:00 bar high 1.09440.
  H1: the night (00:00-07:00 London): open 1.09281, high 1.09440, low 1.09159, last 1.09325: range 28.1 pips (ratio 0.69), net +4.4 pips - flat.
  M15: 1.0922-1.0944, last candle down to 1.09325.
  Bias: BUY. 22:00 London closes: 06-01 1.09259 vs 05-27 1.09038 = +22 pips (3-day gap +22.1). Gap / ADR5 0.22: a small signal.
  UN3 PAPER TAG (never live): 5-day gap -51 pips -> SELL; 3-day says BUY -> DISAGREE: paper SKIPS. Forward day 31, disagree day 8 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 23.
  MB1 PAPER TAG (never live, forward day 15; kept drawdown 4.00R, early-close line 6R): morning direction written at 12:00, before 13:25.
  Levels: night high 1.09440; Mon high 1.09885; night low 1.09159; Mon low 1.08873.
  Rejection-day check: Monday made neither the 3-day high nor the 3-day low. Not a rejection day. 10-day trend: DOWN (1.09259 vs 05-18 1.13141); the buy is against it.
  SIZE RULE (the real safety rule): tracker balance $24,787.11, high-water $25,349.14, drawdown -2.22%; trigger 1 (half size) $24,588.67 not reached ->
      FULL size, 0.31 lots. It is $198.44 away. Trigger 2 (stop) $23,574.70.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: a small signal, against UN3 and the 10-day trend, after two stops, with the half-size line close. None of that is in the rule. Written, not a rule.
  08:00 London Tue: pre-entry hour 1.09181-1.09627 = 44.6 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.09551: the hour dipped and rallied; night with me by 27.0 pips (not counted); entry 22.6 pips worse than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.09151).
  08:15 London: filled BUY 1.09563, stop 1.09151 (41.2 pips from the fill). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +36.3 (high 1.09926), worst -8.2, last -7.0 pips: up 36 in half an hour, all of it given back in the next half. No call; hands off.
  10:00 London: second hour best +27.3, worst -9.9, last +25.8 pips: back up. No call; hands off.
  11:00 London: third hour best +38.0 (high 1.09943), worst +4.3, last +25.8 pips. A wide two-way range above my entry. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.10185, +$192.82 (from the trade list). The last hour did it: +41 pips at 11:00, +82.3 at the best. MB1 paper (forward day 15), written before 13:25: open 08:00 1.09552, open 12:00 1.10186 -> morning UP by 63.4 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Tue result, TAG FIRST: VALID WIN (valid setup, followed the plan). Checked: June goal read before the call; coach's judging rule written into the plan
     before the call; size rule read, no trigger, full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; BUY 0.31 at
     08:00, stop never moved, no early exit, closed 12:00, one trade; a note before every advance. Process: clean. Numbers corrected after a push in June: 0.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints, the trade list and an engine line.
     Result: bought 1.09563, stop 1.09151 (40 pips under the bid at the order; 41.2 from the fill, risk $127.72), closed 12:00 London @1.10185, +$192.82 = +1.51R.
     Tracker balance $24,979.93 (sim $25,454.77 minus $474.84 paid out), high-water $25,349.14, drawdown -1.46%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 48 trades, 25 wins, 23 valid losses, +3.65R (March +0.97R, April +4.17R, May -2.00R, June +0.51R in 2 trades). This week: -1.00, +1.51 = +0.51R.
     Against the written number: 0 losses in a row, 2.94R under the equity high (trade list); live maximum 4.45R (yesterday).
     Yesterday I wrote that the half-size line was close and that this must not touch today's size. It did not. Had I cut size on a feeling, this trade
     pays half. The rule exists so that I do not have to be right about such mornings.
     The last hour again: +41 pips at 11:00, +82 at the best, +62 at the close. XT said the move ends near noon; today it ended ON noon.
     +80 PIP TRADES (counts-only, case 1 of 15): best +82.3 pips; noon paid +1.55R on the engine; an 80 / 40 trail would have woken at +80, never been
     touched, and closed at the same noon price: +1.55R. No difference today.
     Paper tags: UN3 - eighth forward DISAGREE day - paper skips a +1.51R winner (disagree days +1.93R in 8; agree days -1.86R in 23; n = 8 of 30).
     PH2 (paper, forward day 23): lively (44.6) -> paper half = about +0.76R against the live +1.51R. Tally: 23 days, 18 lively (live -1.53R, 8 full-stop
     mornings), 5 quiet (+0.06R); PH2 total about -0.70R against A2's -1.49R.
     MB1 (paper, forward day 15; `python bt/morning_box.py 2015-06-03 --check 2015-06-02`): morning +63.4 pips (UP, large); the box broke UP -> with -> KEPT:
     +2.37R. Fifteen forward days: kept 6 (-0.87R, DD 4.00R), removed 8 (+7.64R), no break 1.
     Night count: with me today, not counted (18 trades, +0.63R). 10-day-trend paper line: trend DOWN: 10 trades, -2.24R (today's buy was against it); trend UP: 10 trades, +0.48R.
     80+ pip pre-entry hours: none (4 of 10).
     Payout date Friday 06-05: the balance is $20.07 under $25,000 tonight (python: 25000 - 24979.93); the trades of Wed-Fri decide.
     END OF RELEASED DATA (clock Wed 06-03 01:00 London).

- **Wed 06-03 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-03`, `./look.sh` or a bar print. Yesterday's tag stands: VALID WIN.
  Coach 06-03: the safety checks (alarm, costs, money guard) are done; enough health checks. The next backtest tries to make A2 itself better: one idea, kill line first, variants counted.
  D1 (London days): Fri 05-29 close 1.09831 (0.71); Mon 06-01 close 1.09259 (0.38); Tue 06-02 high 1.11942 low 1.09159 close 1.11504 (0.84, range 278.3): the
      widest day in my records. After my noon exit at 1.10185 it ran another 175 pips to 1.11942. New 3-day high.
  H4 (UTC bars): Tue 08:00 bar 1.09464 -> 1.10301; 12:00 bar to 1.11942, close 1.11282; 16:00 bar 1.11258-1.11883; tonight 00:00 bar 1.11341-1.11752; 04:00 bar high 1.11882.
  H1: the night (00:00-07:00 London): open 1.11510, high 1.11882, low 1.11341, last 1.11753: range 54.1 pips (ratio 1.50), net +24.3 pips - a rising night, with my side.
  M15: up from 1.1161 to 1.11882, last two candles easing to 1.11753.
  Bias: BUY. 22:00 London closes: 06-02 1.11504 vs 05-28 1.09474 = +203 pips (3-day gap +203.0). Gap / ADR5 1.54: stretched.
  UN3 PAPER TAG (never live): 5-day gap +278 pips -> BUY; agree: paper TRADES. Forward day 32, disagree days 8 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 24.
  MB1 PAPER TAG (never live, forward day 16): morning direction written at 12:00, before 13:25.
  Levels: night high 1.11882; Tue high 1.11942; night low 1.11341; Tue evening low 1.11258.
  Rejection-day check: Tuesday made the 3-day high (True) and closed at 0.84, not in the bottom third. Not a rejection day.
  10-day-trend paper line: UP by a hair (1.11504 vs 05-19 1.11493); the buy is with it.
  SIZE RULE (the real safety rule): tracker balance $24,979.93, high-water $25,349.14, drawdown -1.46%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: the day after the widest day I have seen; the morning after 03-18's spike was a full stop in 15 minutes. One case. Written, not a rule.
  08:00 London Wed: pre-entry hour 1.11542-1.11896 = 35.4 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.11686: night with me by 17.6 pips (not counted); entry 6.7 pips better than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.11286).
  08:15 London: filled BUY 1.11695 and STOPPED at 08:11 @1.11285 (from the trade list), -$127.10. The first 5-minute candle fell 32 pips (1.11684 -> 1.11363), the third reached 1.11227. Eleven minutes: my fastest stop. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.11214 = 48.1 pips under my entry, 7.2 pips beyond the stop: a REAL stop (about -1.18R at noon without it, by python). MB1 paper (forward day 16), written before 13:25: open 08:00 1.11684, price at 12:00 1.11214 -> morning DOWN by about 47 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Wed result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: June goal read before the call; size rule read, no trigger,
     full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved, one trade, nothing
     after the stop. Process: clean. Numbers corrected after a push in June: 0.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the trade list, bar prints and python lines.
     Result: bought 1.11695, stop 1.11286 (40 pips under the bid at the order; 40.9 from the fill, risk $126.79), STOPPED 08:11 London @1.11285, -$127.10 = -1.00R.
     Tracker balance $24,852.83 (sim $25,327.67 minus $474.84 paid out), high-water $25,349.14, drawdown -1.96%.
     Size rule after the day: trigger 1 (half size) $24,588.67 not reached ($264.16 away) -> full size tomorrow. Trigger 2 (stop) $23,574.70.
     Funded totals from the log: 49 trades, 25 wins, 24 valid losses, +2.65R (March +0.97R, April +4.17R, May -2.00R, June -0.50R in 3 trades). This week: -1.00, +1.51, -1.00 = -0.50R.
     Against the written number: 1 loss in a row, 3.95R under the equity high (trade list); live maximum 4.45R; normal worst 6 in a row and about 5.9R.
     Price at 12:00 London (stop-day routine): bid 1.11214 = 48.1 pips under my entry, 7.2 pips beyond the stop. A REAL stop; about -1.18R at noon without it.
     What it was: the morning after the widest day in my records, and the market gave back 50 pips at the open. I wrote 03-19 into the worry line this
     morning: the morning after a huge day, stopped in 15 minutes then, 11 now. Two cases. It goes to the backtest as a question, not into the rule.
     Paper tags: UN3 agreed, same -1.00R (agree days -2.86R in 24 trades; disagree days +1.93R in 8; n = 8 of 30).
     PH2 (paper, forward day 24): lively (35.4) -> paper half = -0.50R against the live -1.00R. Tally: 24 days, 19 lively (live -2.53R, 9 full-stop mornings),
     5 quiet (+0.06R); PH2 total about -1.20R against A2's -2.49R.
     MB1 (paper, forward day 16; `python bt/morning_box.py 2015-06-04 --check 2015-06-03`): open 08:00 1.11684, open 12:00 1.11214 -> morning -47.0 pips (DOWN, large);
     the box broke DOWN -> with -> KEPT: -1.00R. Sixteen forward days: kept 7 (-1.87R, DD 4.00R), removed 8 (+7.64R), no break 1.
     Night count: with me today, not counted (18 trades, +0.63R). 10-day-trend paper line: trend UP: 11 trades, -0.52R; trend DOWN: 10 trades, -2.24R.
     +80 pip trades: none today (1 of 15). 80+ pip pre-entry hours: none (4 of 10).
     Payout date Friday 06-05: the balance is under $25,000; as it stands the request is $0.
     END OF RELEASED DATA (clock Thu 06-04 01:00 London).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 68 | 39 | +13.75 | +0.20 | 4.45R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 32 days, 8 disagree days of 30 | - | A2 on the disagree days +1.93R; on the agree days -2.86R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 24 days, 19 lively days of 60 | - | A2 on the lively days -2.53R (9 full-stop mornings), on the 5 quiet days +0.06R; PH2 about -1.20R vs A2 -2.49R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49).
Loss tags, all live trades: valid loss 42 (-29.20R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Wed 2015-06-03:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 68 | 68 |
| Win rate | 64% | 57% | 57% |
| Avg R | +0.50 | +0.20 | +0.20 |
| +- 2 standard errors | 0.33 | 0.25 | 0.26 |
| Net R | +19.56 | +13.75 | +13.88 |
| Avg win / avg loss | +1.04 / -0.46 | +0.95 / -0.80 | +0.96 / -0.81 |
| Full stops | 3 (8%) | 21 (31%) | 21 (31%) |
| Max drawdown | 1.87R | 4.45R | 4.54R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 37, +0.29 | 37, +0.29 |
| Buys: n, avg R | 15, +0.18 | 31, +0.10 | 31, +0.10 |
Live minus backtest: -0.30R per trade (noise band +-0.42R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.03R. As traded vs engine on the same days: -0.13R over 68 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 68 done, avg +0.20R, max DD 4.45R. Planning edge +0.18R: live is +0.02R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 18 (+0.63R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 11 trades -0.52R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 16 days, kept 7 trades (-1.87R, DD 4.00R); removed 8 (+7.64R); no break 1. +80 pip trades from 05-22: 1 of 15 (no difference). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.45R (06-01). Now: 1 in a row, 3.95R under the high.

## 06-01 research after funded day 47: idea AL, can my alarm tell a dead edge from a live one? (journal/2015-idea-AL-alarm-power.md). Worked predictions
for every kill line pushed first; one run of 20,000 futures appended to my 66 real trades. With the edge gone from today the alarm at 100 trades still
passes 47% of the time; with the planning edge it fails 20% of the time (the drawdown line, because I stand 4.45R down). K1 passes barely, K2 and K3 fail:
it is not a judge. The run differed from my worked table only where the pre-registration said it would (the drawdown half); reason found before the
verdict. Alarm unchanged; the size rule is the protection; a question goes to the coach. Counts: 71 ideas, 198 variants. June corrections after a push: 0.

## 06-02 research after funded day 48 (coach: the drawdown / breach guard is the real safety rule): idea GD, the guard when the edge is gone or small
(journal/2015-idea-GD-guard-under-dead-edge.md). Worked predictions and a regression against WS pushed first; regression exact; one run from my real
state. Edge gone: never near the firm's line (lowest -6.9%), stopped in about 70% of two-year runs around day 230 at a cost of about 5%. Edge -0.10R:
stopped 99%, half within six months. Edge +0.10R: still trading after 300 days in 9 runs of 10. All three kill lines pass; nothing changes. My worked
figure for the zero edge (42%) missed the run (68-73%) because a trailing stop is met more often than a fixed one; reason written before the verdict.
Counts: 72 ideas, 201 variants. June corrections after a push: 0.

## 06-03 research after funded day 49 (coach: one idea to make A2 itself better): journal/2015-06-03-two-forgotten-gates-and-a-leverage-look.md.
(1) I began with a tighter stop at the same $ risk, worked it on the MFE / MAE log, then read my own March notes before pre-registering: it is leverage
(same pips, 1.33 times the lots), not management. Stopped at the look; 3 looks counted; nothing run. (2) Reading the record I found two forward kill tests
of March that were never judged: idea W "no Friday" and the N1 paper tag. Applied both by their written lines on lived days: W killed (first 8 unseen
Fridays +5.64R, 2 losers), N1 killed at its 20-trade gate (all five lines fail). Process mistake P10 (missed gates), fixed in the gates list.
Nothing adopted; the coach's brief is still open for a new idea tomorrow. Counts: 73 ideas, 204 variants; process mistakes 10.

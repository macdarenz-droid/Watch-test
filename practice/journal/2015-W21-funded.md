# Journal - FUNDED ACCOUNT, week of 2015-05-18 (W21). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
Start of week (from the tool, 05-15): tracker balance $25,114.78 (sim $25,589.62 minus $474.84 paid out), high-water $25,349.14, drawdown -0.92%. Last week -1.85R (three full stops). PAYOUT DATE this Friday 05-22.
SIZE RULE: half size from a day's close at or below 3% under the high-water (today $24,588.67) until a new high-water; STOP at 7% under (today $23,574.70; changed 05-15, fixed for funded days 36-55; day 36 done).
Paper tags, never live: UN3 (call at 07:00), PH2 (decided at 08:00, before the order), MB1 (morning direction written at 12:00, before 13:25). Every figure comes from a tool print.
Coach, 05-18: no more risk-plan tests for now; the next backtest is about finding or improving an ENTRY edge, starting from my own A2 losers and winners.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F37 | Mon 05-18 08:00 | buy | 0.31 | 1.14178 | 1.13769 | 1.13768 (stop, 09:08) | -1.00 | -$127.10 | VALID LOSS (valid setup, market disagreed) | first hour to 3.1 pips from the stop, stopped in the second (low 1.13666, 10.3 pips through); price at 12:00 London 1.14172 = 0.6 pips under entry, 40.3 ABOVE the stop: NOT a real stop, a poke; PH2 paper half size; UN3 agree; MB1 paper day 4: break DOWN against a flat morning, removed, +0.86R |
| F38 | Tue 05-19 08:00 | sell | 0.31 | 1.13038 | 1.13441 | 1.12163 (12:00 close) | +2.17 | +$271.25 | VALID WIN | flip day, small signal; the first M15 candle fell 90 pips (a jump, on my side); best +142.6 pips at 08:45, closed +87.5; no target, held to noon; PH2 paper half size; UN3 DISAGREE (paper skips my biggest winner of the month); MB1 paper day 5: first KEPT trade, +0.76R |

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
  08:00 London Mon: pre-entry hour 1.14166-1.14468 = 30.2 pips -> PH2 paper: LIVELY (just over the 30 pip line), paper half size (decided before the order). Price 1.14169, the low of the hour: night against me by 23.2 pips (counted); entry 20.7 pips better than at 07:00. Order: BUY 0.31, stop 40 pips below the bid (1.13769).
  08:15 London: filled BUY 1.14178, stop 1.13769 (40.9 pips from the fill). First candle read from the tool. Call for the hour: none that matters; 1.1417 is the night low area I bought at. Hands off.
  09:00 London: first hour best +7.8, worst -37.8 (low 1.13800: 3.1 pips from the stop), last -27.4 pips. Third morning in a row that drops about 38 pips in the first hour of a buy. I notice the pattern and I notice that I want a rule for it; that is for the backtest, not for now. Hands off.
  10:00 London: STOPPED in the 09:00 London candle (low 1.13666). Sim balance from the tool $25,462.52. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.14172 = 0.6 pips under my entry and 40.3 pips ABOVE my stop. NOT a real stop: the morning low 1.13666 went 10.3 pips through it and the price came all the way back. Without the stop this is a scratch. With it, -1.00R. The stop is the rule; this is what it costs on such a morning (the 04-22 / 05-11 kind). MB1 paper (forward day 4), written before 13:25: open 08:00 1.14167, price at 12:00 1.14172 -> morning about +0.5 pips, as good as flat (small morning). By the rule the sign decides: UP if the tool's 12:00 open is above 1.14167, else DOWN; the tool's figure rules, I do not pick.
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size; call committed at 07:00
     London; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved, one trade, nothing after the stop. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: bought 1.14178, stop 1.13769 (40 pips under the bid at the order; 40.9 from the fill, risk $126.79), STOPPED 09:08 London @1.13768, -$127.10 = -1.00R.
     Tracker balance $24,987.68 (sim $25,462.52 minus $474.84 paid out), high-water $25,349.14, drawdown -1.43%.
     Size rule after the day: trigger 1 (half size) $24,588.67 not reached -> full size tomorrow (about 3 full stops away). Trigger 2 (stop) $23,574.70.
     Funded totals from the log: 37 trades, 20 wins, 17 valid losses, +3.74R (March +0.97R, April +4.17R, May -1.40R in 12 trades). This week: -1.00R.
     Last six trades: -1.00, -1.00, +0.64, +0.51, -1.00, -1.00 = -2.85R, four full stops. Inside what the streak check of 04-28 called normal (six losses in a
     row happened there); the forward max DD is still 3.23R. No rule changes off a losing run.
     Price at 12:00 London (stop-day routine, from the tool): bid 1.14172 = 0.6 pips under my entry, 40.3 pips ABOVE the stop. NOT a real stop: the low 1.13666
     was 10.3 pips through it and by noon the trade would have been a scratch. Of my last four stops, three were real (05-12, 05-15 and 05-11 by price at noon)
     and this one was a poke. One poke does not argue for a wider stop: E (30 pips), sstop, CS and TD are all closed, and the 40 pips is frozen.
     What I saw, for the backtest and not for the rule: three buy mornings in a row (Thu, Fri, Mon) fell 38-40 pips in the first hour after 08:00.
     Paper tags: UN3 agreed, the paper line takes the same -1.00R (agree days +0.89R in 15 trades; disagree days -0.75R in 5; n = 5 of 30).
     PH2 (paper, forward day 12): lively (30.2) -> paper half = -0.50R against the live -1.00R. Tally: 12 days, 11 lively (live -1.86R, 5 full-stop mornings),
     1 quiet (+0.46R); PH2 total about -0.47R against A2's -1.40R (from the trade list).
     MB1 (paper, forward day 4; `python bt/morning_box.py 2015-05-19 --check 2015-05-18`): open 08:00 1.14167, open 12:00 1.14174 -> morning +0.7 pips (UP by
     the sign rule, as written before 13:25); the box broke DOWN -> against -> REMOVED; that trade made +0.86R. Four forward days: kept 0, removed 3
     (+4.23, -1.00, +0.86 = +4.09R), no break 1. Still no kept trade. A 0.7 pip "morning direction" deciding a trade is thin; it is the frozen rule and I log it.
     Night count: against me by 23.2 pips -> live trade 12 of the count (running: 12 trades, +1.93R). 10-day-trend paper line: trend UP: 9 trades, -1.69R.
     END OF RELEASED DATA (clock Tue 05-19 01:00 London).

- **Tue 05-19 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-19`, `python bt/streak_check.py 2015-05-19` and the bar prints.
  D1 (London days): Thu 05-14 close 1.14097 (0.66); Fri 05-15 high 1.14669 close 1.14484 (0.87); Mon 05-18 high 1.14492 low 1.12987 close 1.13141 (0.10, range
      150.5): after my noon the price fell 115 pips, closed at the bottom and made the 3-day low. A full reversal day after four rising closes.
  H4 (UTC bars): Mon 12:00 bar 1.14054 -> 1.13541; 16:00 bar low 1.12987; tonight 00:00 bar low 1.12853; 04:00 bar 1.12988-1.13210.
  H1: the night (00:00-07:00 London): open 1.13150, high 1.13264, low 1.12853, last 1.13162: range 41.1 pips (ratio 1.02), net +1.2 pips - down to a new low and back, flat.
  M15: four small candles 1.13015-1.13210; last close 1.13162.
  Bias: SELL. 22:00 London closes: 05-18 1.13141 vs 05-13 1.13536 = -39 pips (3-day gap -39.5). The signal FLIPPED to sell (flip day). Gap / ADR5 0.27: a small signal.
  UN3 PAPER TAG (never live): 5-day gap +160 pips -> BUY; 3-day says SELL -> DISAGREE: paper SKIPS. Forward day 21, disagree day 6 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 13.
  MB1 PAPER TAG (never live, forward day 5): morning direction written at 12:00, before 13:25.
  Levels: night low 1.12853; Mon low 1.12987; night high 1.13264; Mon afternoon 1.13589.
  Rejection-day check: for a sell, Monday would need the 3-day low (True) AND a close in the top third; it closed at 0.10. Not a rejection day.
  10-day-trend paper line: UP (1.13141 vs 05-04 1.11454); the sell is against it.
  SIZE RULE: tracker balance $24,987.68, high-water $25,349.14, drawdown -1.43%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  THE STREAK AGAINST THE BACKTEST (coach 05-19: check it and write the number down). Where I am: 2 losses in a row; 4 full stops in the last 6 trades; 2.85R
      under my equity high (-1.00 -1.00 +0.64 +0.51 -1.00 -1.00). The worst of the live record so far: 6 losses in a row and a 3.23R drawdown (April).
      What "normal worst" is for 56 trades, from 20,000 reshuffles (figures from the print):
      - backtest list (Jan-Feb, 39 trades): longest losing run median 3, 95th percentile 6; max drawdown median 2.03R, 95th percentile 3.72R.
      - all 95 A2 trades (the fairer list, it has the live stops in it): longest run median 4, 95th percentile 6; max drawdown median 3.09R, 95th percentile 5.92R.
      THE NUMBER: up to 6 losses in a row and up to about 5.9R of drawdown (about 3% of the account at 0.50%) is inside the normal range of my own trades.
      Today I am at 2 in a row and 2.85R: under the MEDIAN worst case. Nothing unusual has happened. Outside the range would be: 7 or more in a row, or more
      than 5.9R under the high. The half-size trigger (3% under the high-water) sits almost exactly on that 95th percentile: the plan already has this number in it.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: a small signal on a flip day, against UN3 and the 10-day trend, after two stops. SG and FL say neither small signals nor flip days are worse. I take the trade.
  08:00 London Tue: pre-entry hour 1.12778-1.13162 = 38.4 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.13041: the hour fell to a new low 1.12778 and bounced 26 pips; night with me by 10.9 pips (not counted); entry 12.1 pips worse than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.13441).
  08:15 London: filled SELL 1.13038, stop 1.13441 (40.3 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: the first candle fell 90 pips (1.13043 -> 1.12125): a jump, and it was on my side. First hour best +142.6, worst -1.5, last +120.3 pips = about +3R open. I want to close it now, badly, after four stops. The plan has no target: 33 exit definitions, none beat the noon clock; 'don't let a big win change' anything. Stop stays at 1.13441. Had I been long, this candle is the DC/TS jump day. Hands off until 12:00.
  10:00 London: second hour best +136.3, worst +107.3, last +107.4 pips: drifting back up 15 pips from the low. Still about +2.7R. No call; the clock is the exit. Hands off.
  11:00 London: third hour best +120.9, worst +93.2, last +99.3 pips. A range 1.1182-1.1210 since 09:00. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.12163, +$271.25 (from the trade list). MB1 paper (forward day 5), written before 13:25: open 08:00 1.13039, open 12:00 1.12152 -> morning DOWN by 88.7 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Tue result, TAG FIRST: VALID WIN (valid setup, followed the plan). Checked: size rule read, no trigger, full size; call with the streak number committed
     at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, no early exit at +3R open, closed 12:00, one trade;
     a note before every advance. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: sold 1.13038, stop 1.13441 (40.3 pips, risk $124.93), closed 12:00 London @1.12163, +$271.25 = +2.17R. My biggest funded win.
     Tracker balance $25,258.93 (sim $25,733.77 minus $474.84 paid out), high-water $25,349.14 (not a new high), drawdown -0.36%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 38 trades, 21 wins, 17 valid losses, +5.91R (March +0.97R, April +4.17R, May +0.77R in 13 trades). This week: -1.00, +2.17 = +1.17R.
     LUCK, said plainly: about 2R of this came from one 15-minute candle of 90 pips that began two minutes after my fill. I did nothing to deserve the timing.
     It is the same kind of minute I stress-tested last week as a -3R day; this time I was on the right side of it, as on 01-15. One trade took the month from
     -1.40R to +0.77R. That is what a 55% setup with a fat right tail looks like, in both directions - and why yesterday's losing run was not a reason to
     touch anything. A big win changes the size as little as four stops did: 0.31 lots tomorrow.
     What the noon exit cost: best was +142.6 pips, I closed at +87.5. Every lock and trail I tested (LK, TR, PM) would have kept more TODAY and less overall.
     Paper tags: UN3 - sixth forward DISAGREE day - paper skips a +2.17R winner (disagree days: -0.02, -1.00, +0.63, -1.00, +0.64, +2.17 = +1.42R; n = 6 of 30).
     The disagree days were "working" for UN3 a week ago (-1.39R after four); now A2 is ahead on them. This is why its look is at 30.
     PH2 (paper, forward day 13): lively (38.4) -> paper half = about +1.09R against the live +2.17R. Tally: 13 days, 12 lively (live +0.31R, 5 full-stop
     mornings), 1 quiet (+0.46R); PH2 total about +0.62R against A2's +0.77R.
     MB1 (paper, forward day 5; `python bt/morning_box.py 2015-05-20 --check 2015-05-19`): morning -88.7 pips (DOWN, large); the box broke DOWN -> WITH the
     morning -> first KEPT trade: +0.76R. Five forward days: kept 1 (+0.76R, large morning), removed 3 (+4.09R), no break 1. One trade.
     Night count: with me today, not counted (12 trades, +1.93R). 10-day-trend paper line: trend UP: 10 trades, +0.48R (today's sell was against it).
     END OF RELEASED DATA (clock Wed 05-20 01:00 London).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 57 | 35 | +17.01 | +0.30 | 3.23R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 21 days, 6 disagree days of 30 | - | A2 on the disagree days +1.42R; on the agree days +0.89R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 13 days, 12 lively days of 60 | - | A2 on the lively days +0.31R (5 full-stop mornings), on the 1 quiet day +0.46R; PH2 about +0.62R vs A2 +0.77R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38).
Loss tags, all live trades: valid loss 35 (-22.73R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Tue 2015-05-19:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 57 | 57 |
| Win rate | 64% | 61% | 61% |
| Avg R | +0.50 | +0.30 | +0.30 |
| +- 2 standard errors | 0.33 | 0.28 | 0.28 |
| Net R | +19.56 | +17.01 | +17.16 |
| Avg win / avg loss | +1.04 / -0.46 | +0.96 / -0.76 | +0.98 / -0.77 |
| Full stops | 3 (8%) | 15 (26%) | 15 (26%) |
| Max drawdown | 1.87R | 3.23R | 3.28R |
| Worst 10 trades in a row | +0.56R | -1.66R | -1.70R |
| Sells: n, avg R | 24, +0.70 | 29, +0.46 | 29, +0.46 |
| Buys: n, avg R | 15, +0.18 | 28, +0.13 | 28, +0.13 |
Live minus backtest: -0.20R per trade (noise band +-0.43R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): +0.06R. As traded vs engine on the same days: -0.14R over 57 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 57 done, avg +0.30R, max DD 3.23R. Planning edge +0.18R: live is +0.12R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 12 (+1.93R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 10 trades +0.48R; trend DOWN 0 trades (look at 40 up-trend trades). MB1 paper from 05-13: 5 days, kept 1 trade (+0.76R); removed 3 (+4.09R); no break 1.
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst so far: 6 in a row, 3.23R.

## 05-18 research after funded day 37 (coach: an entry edge, starting from my own A2 losers and winners): the last 12 losers beside the last 12 winners at
entry time (journal/2015-losers-winners-table-and-idea-MO.md). Nothing separates them except the weekday (5 Mondays among the losers, none among the winners).
Idea MO pre-registered with my expectation of a kill and run once: without the 24 table days Mondays are +0.397R (14 trades, 9 wins) against +0.485R for
Tuesday-Friday; both variants killed. The five losing Mondays were a streak. A2 and size unchanged. Counts: 61 ideas, 170 variants.

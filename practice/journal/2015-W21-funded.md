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
| F39 | Wed 05-20 08:00 | sell | 0.31 | 1.10830 | 1.11231 | 1.11232 (stop, 09:04) | -1.00 | -$124.62 | VALID LOSS (valid setup, market disagreed) | sold after a 54 pip pre-entry hour; stopped by a bid high 4.8 pips through my level; price at 12:00 London 1.10923 (-9.3 from entry, 30.8 INSIDE the stop): NOT a real stop, the second poke in three days; PH2 paper half size; UN3 agree; MB1 paper day 6: second kept trade, -1.00R |
| F40 | Thu 05-21 08:00 | sell | 0.31 | 1.11007 | 1.11408 | 1.11409 (stop, 08:16) | -1.00 | -$124.62 | VALID LOSS (valid setup, market disagreed) | never in profit; first candle -37.5 pips, stopped in the second; price at 12:00 London 1.11645 (-63.8 from entry, 23.7 beyond the stop): a real stop; the most stretched signal I have traded (2.55); PH2 paper half size; UN3 agree; MB1 paper day 7: break DOWN against the morning, removed, 0.00R |
| F41 | Fri 05-22 08:00 | sell | 0.31 | 1.11529 | 1.11932 | 1.11933 (stop, 10:40) | -1.00 | -$125.24 | VALID LOSS (valid setup, market disagreed) | never more than +5.9 pips in profit; a 30 pip range above my entry, then one 24 pip candle to the stop; price at 12:00 London 1.11854 (-32.5 from entry, 7.8 inside the stop; -0.81R at noon without it); QUIET pre-entry hour (23.9): PH2 paper full size; UN3 agree; MB1 paper day 8: break DOWN against the morning, removed, +3.96R; PAYOUT DATE: nothing to request |

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

- **Wed 05-20 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID WIN. Figures from `python bt/call_numbers.py 2015-05-20` and the bar prints.
  D1 (London days): Fri 05-15 close 1.14484 (0.87); Mon 05-18 high 1.14492 low 1.12987 close 1.13141 (0.10); Tue 05-19 high 1.13264 low 1.11184 close 1.11493
      (0.15, range 208.0): the widest day I have traded, second close at the bottom, new 3-day low. 330 pips down from Friday's close in two days.
  H4 (UTC bars): Tue 08:00 bar 1.11665-1.12166; 12:00 bar down to 1.11184; 16:00 and 20:00 bars flat 1.1131-1.1159; tonight 00:00 bar low 1.11220; 04:00 bar low 1.10982.
  H1: the night (00:00-07:00 London): open 1.11469, high 1.11522, low 1.10982, last 1.10993: range 54.0 pips (ratio 1.44), net -47.6 pips - a falling night, with my side.
  M15: quiet 1.1130-1.1146 until the last candle, which fell 44 pips (1.11431 -> 1.10993) to a new low just before 07:00.
  Bias: SELL. 22:00 London closes: 05-19 1.11493 vs 05-14 1.14097 = -260 pips (3-day gap -260.4). Gap / ADR5 1.66: stretched (my best group over all history).
  UN3 PAPER TAG (never live): 5-day gap -63 pips -> SELL; agree: paper TRADES. Forward day 22, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 14.
  MB1 PAPER TAG (never live, forward day 6): morning direction written at 12:00, before 13:25.
  Levels: night low 1.10982; Tue low 1.11184 (now above the price); night high 1.11522.
  Rejection-day check: for a sell, Tuesday would need the 3-day low (True) AND a close in the top third; it closed at 0.15. Not a rejection day.
  10-day-trend paper line: now DOWN (1.11493 vs 05-05 1.11848); the sell is with it. First DOWN-trend day of the count.
  SIZE RULE: tracker balance $25,258.93, high-water $25,349.14, drawdown -0.36%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  After a +2.17R day: same 0.31 lots, same plan. I notice I feel clever this morning; yesterday's candle was luck and is written down as luck.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling 510 pips... correction, I have not computed that; selling far below Friday's close after two wide down days and a 44 pip drop a minute ago. Stretched signals have been my best. Written, not a rule.
  08:00 London Wed: pre-entry hour 1.10621-1.11158 = 53.7 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.10831: the hour fell to 1.10621 and bounced 21 pips; night with me by 63.8 pips (not counted); entry 16.2 pips worse than at 07:00. I am selling after a fall, the mirror of last week's 'bought the top'. Order: SELL 0.31, stop 40 pips above the bid (1.11231).
  08:15 London: filled SELL 1.10830, stop 1.11231 (40.1 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +14.5, worst -23.6, last -17.9 pips: drifting up since 08:30, lows rising. No call; the stop and the clock. Hands off.
  10:00 London: STOPPED in the 09:00 London candle (bid high 1.11267, 4.6 pips through my level). Sim balance from the tool $25,609.15. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.10923 = 9.3 pips against my entry and 30.8 pips INSIDE my stop. NOT a real stop: the morning's highest bid was 1.11279, 4.8 pips through my level, and the price came back. At noon this trade would have been about -0.25R. The second poke in three days (05-18 was the first). Two cases; every wider-stop and close-stop variant is closed (S, SS, CS); I write it and leave it. MB1 paper (forward day 6), written before 13:25: open 08:00 1.10831, price at 12:00 1.10923 -> morning UP by about 9 pips (small morning) -> only an UP break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Wed result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size (unchanged after the
     +2.17R day); call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, one trade, nothing after
     the stop. Process: one slip of the pen in the call ("510 pips", a number I had not computed) struck out in the same sentence before the commit; no figure of
     record touched. Not counted as a process mistake: it never left the draft uncorrected. Said here anyway.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: sold 1.10830, stop 1.11231 (40.1 pips, risk $124.31), STOPPED 09:04 London @1.11232, -$124.62 = -1.00R.
     Tracker balance $25,134.31 (sim $25,609.15 minus $474.84 paid out), high-water $25,349.14, drawdown -0.85%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 39 trades, 21 wins, 18 valid losses, +4.91R (March +0.97R, April +4.17R, May -0.24R in 14 trades). This week: -1.00, +2.17, -1.00 = +0.17R.
     Price at 12:00 London (stop-day routine, from the tool): bid 1.10923 = 9.3 pips against my entry, 30.8 pips INSIDE the stop. NOT a real stop. The morning's
     highest bid was 1.11279: my level was passed by 4.8 pips. At noon the trade would have been about -0.25R.
     Stops of the last eight days by this routine: 05-11 real, 05-12 real, 05-15 real, 05-18 poke, 05-20 poke. The two pokes cost about 0.75R each against
     the noon price; the three real ones were saved from -0.95R, -1.76R and -1.43R... correction: I have not computed those three; the routine recorded
     the noon distances 38.1, 70.5 and 57.3 pips against entry, i.e. about -0.95R, -1.76R and -1.43R at noon without a stop (pips / 40). So over these five
     the stop cost about 1.5R on the pokes and saved about 1.2R on the real ones: about even, five cases. S, SS and CS said the same over all history.
     CORRECTION, same day, after the push (process mistake P8): the three lines above were arithmetic done in my head. Computed from the recorded noon
     distances and each day's stop distance: without a stop the five trades would have been at noon 05-11 -0.93R, 05-12 -1.76R, 05-15 -1.39R, 05-18 -0.01R,
     05-20 -0.23R. So the stop COST 0.99R and 0.77R on the two pokes (1.76R, not "about 1.5R"), SAVED 0.76R and 0.39R on two real ones (1.15R, not "about
     1.2R") and cost 0.07R on 05-11: net cost 0.67R over the five, not "about even". The drift of the sentence was right, the numbers were not from a tool.
     Paper tags: UN3 agreed, the paper line takes the same -1.00R (agree days -0.11R in 16 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 14): lively (53.7) -> paper half = -0.50R against the live -1.00R. Tally: 14 days, 13 lively (live -0.69R, 6 full-stop mornings),
     1 quiet (+0.46R); PH2 total about +0.12R against A2's -0.24R.
     MB1 (paper, forward day 6; `python bt/morning_box.py 2015-05-21 --check 2015-05-20`): open 08:00 1.10831, open 12:00 1.10928 -> morning +9.7 pips (UP, small);
     the box broke UP -> with the morning -> KEPT: -1.00R. Six forward days: kept 2 (+0.76, -1.00 = -0.24R; 1 large, 1 small morning), removed 3 (+4.09R), no break 1.
     Night count: with me today, not counted (12 trades, +1.93R). 10-day-trend paper line: trend DOWN today (first): 1 trade, -1.00R; trend UP: 10 trades, +0.48R.
     END OF RELEASED DATA (clock Thu 05-21 01:00 London).

- **Thu 05-21 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-21` and the bar prints.
  D1 (London days): Mon 05-18 close 1.13141 (0.10); Tue 05-19 high 1.13264 low 1.11184 close 1.11493 (0.15, range 208.0); Wed 05-20 high 1.11522 low 1.10621
      close 1.10937 (0.35, range 90.1): a third lower close and a new 3-day low, but the smallest range of the three and a close off the bottom.
  H4 (UTC bars): Wed 12:00 bar 1.10760-1.11451; 16:00 bar 1.10702-1.11429 (two wide two-way bars); tonight 00:00 bar up 1.11014 -> 1.11210; 04:00 bar 1.11158-1.11296.
  H1: the night (00:00-07:00 London): open 1.10956, high 1.11296, low 1.10921, last 1.11170: range 37.5 pips (ratio 0.94), net +21.4 pips - a rising night, against my side.
  M15: six small candles 1.1116-1.1128, drifting down from 1.11282; last close 1.11170.
  Bias: SELL. 22:00 London closes: 05-20 1.10937 vs 05-15 1.14484 = -355 pips (3-day gap -354.7). Gap / ADR5 2.55: the most stretched signal I have traded.
  UN3 PAPER TAG (never live): 5-day gap -260 pips -> SELL; agree: paper TRADES. Forward day 23, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 15.
  MB1 PAPER TAG (never live, forward day 7): morning direction written at 12:00, before 13:25.
  Levels: night high 1.11296; Wed afternoon highs 1.11429-1.11451; night low 1.10921; Wed low 1.10621.
  Rejection-day check: for a sell, Wednesday would need the 3-day low (True) AND a close in the top third; it closed at 0.35. Not a rejection day (close, not there).
  10-day-trend paper line: DOWN (1.10937 vs 05-06 1.13459); the sell is with it.
  SIZE RULE: tracker balance $25,134.31, high-water $25,349.14, drawdown -0.85%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: third sell day in a falling market that stopped falling yesterday afternoon and rose overnight. Stretched signals are my best group; written, not a rule.
  08:00 London Thu: pre-entry hour 1.10797-1.11170 = 37.3 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.11008: the hour fell 37 pips and bounced 21; night against me by 5.2 pips (counted); entry 16.2 pips worse than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.11408).
  08:15 London: filled SELL 1.11007, stop 1.11408 (40.1 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: STOPPED in the second M15 candle (bid high 1.11434); the first candle had already gone 37.5 pips against me. Never in profit. Sim balance from the tool $25,484.53. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.11645 = 63.8 pips against my entry, 23.7 pips beyond the stop: a REAL stop (about -1.59R at noon without it, by python). MB1 paper (forward day 7), written before 13:25: open 08:00 1.11008, price at 12:00 1.11645 -> morning UP by about 64 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Thu result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size; call committed at 07:00
     London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, one trade, nothing after the stop. Process: the 08:15 note
     was written after the first candle's print, as always; clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints, the trade list and python lines.
     Result: sold 1.11007, stop 1.11408 (40.1 pips, risk $124.31), STOPPED 08:16 London @1.11409, -$124.62 = -1.00R.
     Tracker balance $25,009.69 (sim $25,484.53 minus $474.84 paid out), high-water $25,349.14, drawdown -1.34%.
     Size rule after the day: trigger 1 (half size) $24,588.67 not reached -> full size tomorrow. Trigger 2 (stop) $23,574.70.
     Funded totals from the log: 40 trades, 21 wins, 19 valid losses, +3.90R (March +0.97R, April +4.17R, May -1.24R in 15 trades). This week: -1.00, +2.17, -1.00, -1.00 = -0.84R.
     Price at 12:00 London (stop-day routine, from the tool): bid 1.11645 = 63.8 pips against my entry, 23.7 pips beyond the stop. A REAL stop; about -1.59R at noon without it.
     The streak against the number I wrote on 05-19: 2 losses in a row; 2.69R under the equity high (trade list); last nine trades -1 -1 +0.64 +0.51 -1 -1 +2.17 -1 -1.
     Normal worst is 6 in a row and about 5.9R. Inside. Six full stops in nine trades feels like more than it is: the nine sum to -2.68R.
     "Most stretched = best trades" met its most stretched day and lost. One trade; the group is 24+ trades. Noted against my own favourite sentence.
     Paper tags: UN3 agreed, the paper line takes the same -1.00R (agree days -1.11R in 17 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 15): lively (37.3) -> paper half = -0.50R against the live -1.00R. Tally: 15 days, 14 lively (live -1.69R, 7 full-stop mornings),
     1 quiet (+0.46R); PH2 total about -0.38R against A2's -1.24R.
     MB1 (paper, forward day 7; `python bt/morning_box.py 2015-05-22 --check 2015-05-21`): open 08:00 1.11008, open 12:00 1.11644 -> morning +63.6 pips (UP, large);
     the box broke DOWN -> against -> REMOVED; that trade made 0.00R. Seven forward days: kept 2 (-0.24R), removed 4 (+4.09R), no break 1.
     Night count: against me by 5.2 pips -> live trade 13 of the count (running: 13 trades, +0.93R). 10-day-trend paper line: trend DOWN: 2 trades, -2.00R; trend UP: 10 trades, +0.48R.
     PAYOUT DATE TOMORROW (Fri 05-22): rule read tonight. After Friday's trade, on the tracker balance: below $26,000 -> half of what is above $25,000; nothing
     at or below $25,000; none while a size trigger is on. Tonight the balance is $25,009.69: as it stands the request would be $4.85 (half of $9.69, by python
     tomorrow, not from this line). Friday's trade decides.
     END OF RELEASED DATA (clock Fri 05-22 01:00 London).

- **Fri 05-22 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-22` and the bar prints.
  D1 (London days): Tue 05-19 close 1.11493 (0.15, range 208.0); Wed 05-20 high 1.11522 low 1.10621 close 1.10937 (0.35); Thu 05-21 high 1.11813 low 1.10797
      close 1.11117 (0.31, range 101.6): the first higher close after three falling ones; neither a 3-day high nor a 3-day low. The fall has paused for two days.
  H4 (UTC bars): Thu 08:00 bar high 1.11813; 12:00 bar 1.11050-1.11476; 16:00 and 20:00 bars drifting to 1.11010; tonight 00:00 bar up 1.11092 -> 1.11463; 04:00 bar high 1.11524.
  H1: the night (00:00-07:00 London): open 1.11080, high 1.11524, low 1.11069, last 1.11461: range 45.5 pips (ratio 1.15), net +38.1 pips - a rising night, against my side.
  M15: flat 1.1139-1.1147, then a last candle 1.11338-1.11522 that closed where it began (1.11461).
  Bias: SELL. 22:00 London closes: 05-21 1.11117 vs 05-18 1.13141 = -202 pips (3-day gap -202.4). Gap / ADR5 1.46: stretched.
  UN3 PAPER TAG (never live): 5-day gap -298 pips -> SELL; agree: paper TRADES. Forward day 24, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 16.
  MB1 PAPER TAG (never live, forward day 8): morning direction written at 12:00, before 13:25.
  Levels: night high 1.11524; Thu high 1.11813; night low 1.11069; Thu low 1.10797.
  Rejection-day check: Thursday made neither the 3-day low nor the 3-day high. Not a rejection day. 10-day trend: DOWN (1.11117 vs 05-07 1.12662); the sell is with it.
  SIZE RULE: tracker balance $25,009.69, high-water $25,349.14, drawdown -1.34%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  PAYOUT DATE today. Rule (read again before the day): after today's trade, on the tracker balance; below $26,000 -> half of what is above $25,000; nothing
      at or below $25,000; none while a size trigger is on. Balance now $25,009.69. The payout does not touch the trade: same size, same stop, same clock.
  FRIDAY GATES (list read): A2 alarm 59 / 100; UN3 6 / 30 disagree days; PH2 14 / 60 lively days; night count 13 / 40; up-trend line 10 / 40; MB1 2 / 100 kept;
      +80 pip trades 0 / 15; personal stop held 5 of 20 days; payout today. None due except the payout.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade. The release ends at 22:00 London.
  Worry: fourth sell day; the last two were stopped and the night rose 38 pips. Normal worst is 6 in a row; I am at 2. I take the trade.
  08:00 London Fri: pre-entry hour 1.11461-1.11700 = 23.9 pips -> PH2 paper: QUIET, paper full size (decided before the order; only the second quiet day since 05-01). Price 1.11532: night against me by 45.2 pips (counted); entry 7.1 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.11932).
  08:15 London: filled SELL 1.11529, stop 1.11932 (40.3 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: a quiet first hour: best +5.9, worst -17.0, last -6.7 pips. No call; hands off.
  10:00 London: second hour best +1.3, worst -24.4 (high 1.11763), last -17.3 pips. A 30 pip range above my entry all morning. No call; the stop and the clock. Hands off.
  11:00 London: STOPPED in the 10:30-10:45 London candles (bid high 1.11955, 3.3 pips through my level after a 24 pip push in one candle). Sim balance from the tool $25,359.29. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.11854 = 32.5 pips against my entry, 7.8 pips inside the stop; the morning's highest bid was 1.12083, 15.1 pips through my level. Without the stop about -0.81R at noon instead of -1.00R (python). Neither a clean poke nor a clean real stop: the stop cost about 0.2R today. MB1 paper (forward day 8), written before 13:25: open 08:00 1.11530, price at 12:00 1.11854 -> morning UP by about 32 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Fri result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size; payout rule and Friday
     gates read in the 07:00 call, committed before the entry bar; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, one
     trade, nothing after the stop. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints, the trade list and python lines.
     Result: sold 1.11529, stop 1.11932 (40.3 pips, risk $124.93), STOPPED 10:40 London @1.11933, -$125.24 = -1.00R.
     Tracker balance $24,884.45 (sim $25,359.29 minus $474.84 paid out), high-water $25,349.14, drawdown -1.83%: the DEEPEST of the funded account (was -1.63% on 04-27).
     Size rule after the day: trigger 1 (half size) $24,588.67 not reached -> full size Monday; it is $295.78 away, a little over two full stops.
     Trigger 2 (stop trading, 7% under the high-water) $23,574.70.
     PAYOUT (fourth payout date), by the rule as written: tracker balance after today's trade $24,884.45 is not above $25,000 -> NOTHING to request. Requested $0.
     High-water unchanged ($25,349.14: it moves down only by a payout). Total paid out stays $474.84 ($379.87 mine). Next payout date Fri 06-05.
     Funded totals from the log: 41 trades, 21 wins, 20 valid losses, +2.90R (March +0.97R, April +4.17R, May -2.24R in 16 trades).
     WEEK W21: -1.00, +2.17, -1.00, -1.00, -1.00 = -1.84R in 5 trades, -$230.33. Four full stops and one jump candle. Two losing weeks in a row (-1.85R, -1.84R).
     THE STREAK AGAINST THE NUMBER (written 05-19: normal worst for 56 trades is 6 losses in a row and about 5.9R): now 3 in a row and 3.69R under the equity
     high (trade list) - a new live maximum drawdown (was 3.23R), above the MEDIAN worst case (3.09R), inside the 95th percentile (5.92R). Last ten trades:
     -1 -1 +0.64 +0.51 -1 -1 +2.17 -1 -1 -1 = -3.68R, seven full stops in ten. Not outside the range. The A2 alarm's own lines (at 100 live trades: avg >= +0.10R,
     max DD <= 8R) read +0.23R and 3.69R today. No rule changes off a losing week; the size rule is the only thing allowed to react, and it has not triggered.
     How it feels, written because the journal asks for the emotion: flat and a little sick of the 08:00 candle. That is a reason to follow the list, not to edit it.
     Price at 12:00 London (stop-day routine, from the tool): bid 1.11854 = 32.5 pips against my entry, 7.8 pips inside the stop; highest bid 1.12083 (15.1 pips
     through). About -0.81R at noon without the stop: the stop cost about 0.2R today.
     Paper tags: UN3 agreed, the paper line takes the same -1.00R (agree days -2.11R in 18 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 16): QUIET hour (23.9) -> paper FULL size = -1.00R, same as live. Tally: 16 days, 14 lively (live -1.69R, 7 full-stop mornings),
     2 quiet (+0.46, -1.00 = -0.54R, 1 full-stop morning); PH2 total about -1.38R against A2's -2.24R.
     MB1 (paper, forward day 8; `python bt/morning_box.py 2015-05-23 --check 2015-05-22`): open 08:00 1.11530, open 12:00 1.11854 -> morning +32.4 pips (UP, large);
     the box broke DOWN -> against -> REMOVED; that trade made +3.96R. Eight forward days: kept 2 (-0.24R), removed 5 (+4.23, -1.00, +0.86, 0.00, +3.96 = +8.05R),
     no break 1. So far the filter keeps the losers and removes the winners - the opposite of its backtest. Eight days, seven trades; its rules say look at 40
     kept trades and I hold to that. But I write it plainly: nothing in the forward record supports MB1 yet.
     Night count: against me by 45.2 pips -> live trade 14 of the count (running: 14 trades, -0.07R). 10-day-trend paper line: trend DOWN: 3 trades, -3.00R; trend UP: 10 trades, +0.48R.
     +80 pip trades (counts-only): none today (0 of 15).
     END OF RELEASED DATA (clock Fri 05-22 22:00 London).

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

## 05-18 research after funded day 37 (coach: an entry edge, starting from my own A2 losers and winners): the last 12 losers beside the last 12 winners at
entry time (journal/2015-losers-winners-table-and-idea-MO.md). Nothing separates them except the weekday (5 Mondays among the losers, none among the winners).
Idea MO pre-registered with my expectation of a kill and run once: without the 24 table days Mondays are +0.397R (14 trades, 9 wins) against +0.485R for
Tuesday-Friday; both variants killed. The five losing Mondays were a streak. A2 and size unchanged. Counts: 61 ideas, 170 variants.

## 05-19 research after funded day 38: idea ET, is my 08:00 entry late? (journal/2015-idea-ET-earlier-entry.md). What I already knew against it was added up
first; kill lines pushed; one run. Entry at 07:00 / 07:30 / 07:45: 8.91R / 3.70R / 4.56R behind A2, deeper drawdowns, worse on exactly the lively hours the
idea was about. All killed. Profile by entry time: 07:00 76% | 07:30 90% | 07:45 88% | 08:00 100% | 08:30 81% | 09:00 61%. Counts: 62 ideas, 173 variants.

## 05-20 research after funded day 39 (coach: the exit side): idea SA, the 40 pip stop re-tested on all history (journal/2015-idea-SA-stop-all-history.md).
My 12 live stop notes read first (8 real, 4 pokes of 10 pips or less), the four poke days dropped, kill lines pushed, one run. Stop 50 / 60 / 80 pips at
the same $ risk: 9.60R / 15.99R / 21.52R behind A2, behind in both periods; with the poke days back in still 6.43R behind at 50 pips. Losing days do get
smaller and pokes do disappear - and every winner shrinks. All killed; the stop stays 40 pips. Counts: 63 ideas, 176 variants; process mistakes 8 (P8 today).

## 05-21 research after funded day 40 (coach: one exit rule on A2 - target, trail or time): idea TW, a wide trailing stop for big mornings
(journal/2015-idea-TW-wide-trail.md). Trail chosen and the sample counted (23 of 98 trades reach +60 pips, 10 reach +80) before any result; kill lines
pushed; mechanics worked by hand on 05-19; one run with 05-19 dropped. 60/40: +0.44R on 4 days (killed). 60/30: -2.81R, it cut my best day from +4.30R to
+1.41R (killed). 80/40: +1.10R on 3 days, none worse - too thin by my own sample line, no tag. Exit unchanged. A counts-only line for +80 pip trades starts.
Counts: 64 ideas, 179 variants.

## 05-22 research after funded day 41: idea LB, the 3-day lookback on all history (journal/2015-idea-LB-lookback-hill.md). Challenger lines and the
hill-or-spike reading pushed before any code; signals of two days worked by hand from my own calls; one run. Lookback 2 / 4 / 5 days keep 55% / 78% / 87%
of A2's net, all positive in both halves, with deeper drawdowns; none is a challenger. By my pre-written rule the shape is "unclear" (lookback 2 is five
points under my hill line), nowhere near a spike. A2 unchanged. Counts: 65 ideas, 182 variants.

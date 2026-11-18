# Journal - FUNDED ACCOUNT, week of 2015-05-11 (W20). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
Start of week (from the tool, 05-08): tracker balance $25,349.14 (sim $25,823.98 minus $474.84 paid out) = the high-water mark, drawdown 0.00%. Last week +1.01R. No payout date this week (next Fri 05-22).
SIZE RULE (the only size triggers): half size from a day's close at or below 3% under the high-water (today $24,588.67) until a new high-water; stop at 5% under (today $24,081.68).
Paper tags, never live: UN3 (call at 07:00), PH2 (decided at 08:00, written before the order). Every figure comes from a tool print: bt/call_numbers.py, bt/walk_numbers.py, bt/daily_numbers.py.
Coach, 05-11: quality over count - the next test starts with ten charts looked at and written up BEFORE any pre-registration.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F32 | Mon 05-11 08:00 | buy | 0.31 | 1.11921 | 1.11512 | 1.11511 (stop, 10:33) | -1.00 | -$127.10 | VALID LOSS (valid setup, market disagreed) | never more than +0.4 pips in profit; held 1.0 and 2.7 pips above the stop twice, stopped by a 4.3 pip poke; price at 12:00 London 1.11540 (-38.1 from entry); lively pre-entry hour WITH me (55.3 pips): PH2 paper half size; UN3 agree |
| F33 | Tue 05-12 08:00 | sell | 0.31 | 1.11837 | 1.12238 | 1.12239 (stop, 08:18) | -1.00 | -$124.62 | VALID LOSS (valid setup, market disagreed) | stopped in the second M15 candle (a 40 pip candle); price at 12:00 London 1.12532 (-70.5 from entry, 30.4 beyond the stop): a real stop; lively pre-entry hour (34.7): PH2 paper half size; UN3 DISAGREE (paper skips) |
| F34 | Wed 05-13 08:00 | sell | 0.31 | 1.12518 | 1.12920 | 1.12261 (12:00 close) | +0.64 | +$79.67 | VALID WIN | best +48.5 pips at 10:00, closed +25.7; lively pre-entry hour (42.3): PH2 paper half size; UN3 DISAGREE (paper skips a winner); MB1 paper day 1: break UP against the morning, removed, it made +4.23R |
| F35 | Thu 05-14 08:00 | buy | 0.31 | 1.14125 | 1.13714 | 1.14336 (12:00 close) | +0.51 | +$65.41 | VALID WIN | bought after a 59 pip pre-entry hour; worst -37.6 pips (3.5 from the stop) in the first hour, then recovered; PH2 paper half size; UN3 agree; MB1 paper day 2: break DOWN against the morning, removed, -1.00R |
| F36 | Fri 05-15 08:00 | buy | 0.31 | 1.14156 | 1.13745 | 1.13744 (stop, 09:30) | -1.00 | -$127.72 | VALID LOSS (valid setup, market disagreed) | bought the top of a 44 pip pre-entry hour; 1.3 pips from the stop in the first hour, stopped in the second; price at 12:00 London 1.13583 (-57.3 from entry, 16.2 beyond the stop): a real stop; PH2 paper half size; UN3 agree; MB1 paper day 3: no box break, no trade |

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
  08:00 London note (before the order; figures from bt/entry_numbers.py): the hour before entry rallied in four rising M15 candles from 1.11410 to 1.11963; last 1.11912.
     I buy 45.9 pips WORSE than the 07:00 price, after a lively hour that ran MY way - the 'chase after a lively hour' case of last week's post-hoc note (14 cases at
     +0.005R). It is a parked description, not a rule; I buy.
     PH2 (paper): pre-entry hour high 1.11963, low 1.11410 = 55.3 pips -> LIVELY (paper half size). The live trade is FULL size.
     Night count: 00:00 open 1.11971 -> 1.11912 = against my side by 5.9 pips (count no. 9). Order: BUY 0.31 at market, stop 1.11912 - 0.00400 = 1.11512. Next look 08:15.
  08:15 note (bt/walk_numbers.py): filled 1.11921, stop 1.11512 (40.9 pips). First M15 went straight against me: best +0.4, worst -17.7, close -16.7. Stop stays. Next look 09:00.
  09:00 note: first hour: four falling M15 candles; worst -39.9 (low 1.11522, ONE pip above my stop at 1.11512), last -34.4. Never in profit by more than 0.4 pips.
     The pre-entry rally has been taken back completely. Stop stays 1.11512; it is one pip away and I leave it exactly where it is. Next look 10:00.
  10:00 note: second hour: still in. Worst -38.2 (low 1.11539, 2.7 pips above the stop), best -15.1, last -23.8. Two tests of the 1.1152-1.1154 area, both held by
     a pip or two. Nothing to do; the stop is where the rule put it. Next look 11:00.
  11:00 note: STOPPED. The 10:30 London candle went to 1.11469, 4.3 pips through the stop (1.11512), and came back to 1.11627 in the same candle. Done for the day,
     no second trade. I advance to noon only to record the price at my exit time.
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size (PH2's paper line said half; the
     live trade was full); call with the walk and paper lines committed at 07:00 London, PH2's range written at 08:00 before the order; a note before each advance;
     entry 08:00 London, 0.31 lots, BUY per the trend rule, one trade, stop never moved - including the hour it sat one pip from price - no second trade. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, `bt/walk_numbers.py` and the noon / afternoon print.
     Result: bought 1.11921, stop 1.11512 (40.9 pips, risk $126.79), STOPPED 10:33 London @1.11511, -$127.10 = -1.00R.
     Tracker balance $25,222.04 (sim $25,696.88 minus $474.84 paid out), high-water $25,349.14, drawdown -0.50%.
     Size rule after the day: trigger 1 at $24,588.67, trigger 2 at $24,081.68: not reached -> full size tomorrow.
     Funded totals from the log: 32 trades, 18 wins, 14 valid losses, +5.59R (March +0.97R, April +4.17R, May +0.45R in 7 trades).
     Price at 12:00 London (stop-day routine, from the tool): 1.11540 = 38.1 pips below my entry and 2.8 pips ABOVE my stop. So the stop was taken by a 4.3 pip poke
     and price was back above it at noon - but only just: without the stop I would have closed at about -0.93R instead of -1.00R. After noon the best price was still
     17.2 pips under my entry and the low 61.1 pips under it. A loser either way; not a 'robbed by a wick' day.
     What happened: I bought after a 55 pip rally in the hour before entry; every M15 candle of the first hour fell; the low of that hour was one pip above my stop.
     Paper tags: UN3: agree day, paper trades = -1.00R.
     PH2 (paper, forward day 7): lively hour -> paper half size = -0.50R against the live -1.00R. A full-stop morning (worst -45.2 pips).
     Tally: 7 forward days, 6 lively (live -0.01R, 2 full-stop mornings) and 1 quiet (+0.46R); PH2 total +0.45R against A2's +0.45R.
     The parked post-hoc description 'lively hour that ran MY way before entry' (14 cases at +0.005R when I wrote it): today was such a morning and lost. I note it
     and leave it parked: it was chosen after seeing results, and one more case chosen the same way proves nothing.
     Night count: against me by 5.9 pips -> live trade 9 of the count (running: 9 trades, +3.29R). 10-day-trend paper line: trend UP: 4 trades, +0.16R.
     END OF RELEASED DATA (clock Tue 05-12 01:00 London).
- **Tue 05-12 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-12` and the bar prints.
  D1 (22:00-22:00 London days): Thu 05-07 high 1.13916 low 1.12373 close 1.12662 (0.19); Fri 05-08 high 1.12880 low 1.11790 close 1.12015 (0.21);
      Mon 05-11 high 1.12065 low 1.11310 close 1.11546 (0.31, range 75.5). Three falling days from the 1.13916 high, each with a lower high and a lower low.
  H4 (UTC bars): Monday 08:00 bar low 1.11380, 12:00 bar low 1.11310, 16:00 bar 1.11332-1.11697; tonight's 00:00 bar 1.11457 -> 1.11554, 04:00 bar high 1.11896.
  H1: the night (00:00-07:00 London): open 1.11487, high 1.11896, low 1.11343, last 1.11761: range 55.3 pips (ratio 1.05), net +27.4 pips - a rising night.
  M15: after the 1.11896 high at 06:0x London, four small candles 1.11720-1.11868; last close 1.11761.
  Bias: SELL. 22:00 London closes: 05-11 1.11546 vs 05-06 1.13459 = -191 pips (3-day gap -191.3). The signal flipped to sell after three buy days.
  UN3 PAPER TAG (never live): 5-day gap +9 pips -> BUY; 3-day says SELL -> DISAGREE: paper SKIPS. Forward day 16, disagree day 4 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 8.
  Levels: night high 1.11896; Mon high 1.12065; night low 1.11343; Mon low 1.11310.
  Rejection-day check (parked observation): for a sell, Monday would need the 3-day low (True) AND a close in the top third; it closed at 0.31. Not a rejection day.
  10-day-trend paper line: UP (1.11546 vs 04-27 1.08909); today's sell is against it. Stretch: gap / ADR5 = 1.39 - a stretched signal (my best group over all history).
  Worry: selling into a night that rose 27 pips, with my paper filter saying skip. Written; not a rule.
  Funded check / SIZE RULE: tracker balance $25,222.04, high-water $25,349.14, drawdown -0.50%. Trigger 1 at $24,588.67, trigger 2 at $24,081.68: neither reached -> FULL size.
  Plan: SELL 08:00 London, SL 40 pips above the bid at 08:00, out 12:00 London, 0.31 lots ($125 = 0.50%). Worst case about -$131 -> drawdown about -1.0%. One trade, stop not moved.
  08:00 London note (before the order; figures from bt/entry_numbers.py): the hour before entry ranged 1.11671-1.12018 and ended at 1.11838. I sell 7.7 pips BETTER
     than the 07:00 price.
     PH2 (paper): pre-entry hour high 1.12018, low 1.11671 = 34.7 pips -> LIVELY (paper half size). The live trade is FULL size.
     Night count: 00:00 open 1.11487 -> 1.11838 = against my side by 35.1 pips (count no. 10). Order: SELL 0.31 at market, stop 1.11838 + 0.00400 = 1.12238. Next look 08:15.
  08:15 note (bt/walk_numbers.py): filled 1.11837, stop 1.12238 (40.1 pips). First M15: best +6.4, worst -9.2, close -9.1. Stop stays. Next look 09:00.
  09:00 note: STOPPED in the 08:15 London candle, which rose from 1.11919 to 1.12319 (worst -49.2 for me; stop 1.12238). Twenty minutes in the trade. Done for the
     day, no second trade. I advance to noon only to record the price at my exit time.
  -> Tue result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size (UN3's paper line said skip,
     PH2's said half; the live trade was a full-size sell); call with the walk and paper lines committed at 07:00 London, PH2's range written at 08:00 before the order;
     entry 08:00 London, 0.31 lots, SELL per the trend rule, one trade, stop never moved, no second trade. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, `bt/walk_numbers.py` and the noon / afternoon print.
     Result: sold 1.11837, stop 1.12238 (40.1 pips, risk $124.31), STOPPED 08:18 London @1.12239, -$124.62 = -1.00R.
     Tracker balance $25,097.42 (sim $25,572.26 minus $474.84 paid out), high-water $25,349.14, drawdown -0.99%.
     Size rule after the day: trigger 1 at $24,588.67, trigger 2 at $24,081.68: not reached -> full size tomorrow. (Trigger 1 is four full stops away.)
     Funded totals from the log: 33 trades, 18 wins, 15 valid losses, +4.59R (March +0.97R, April +4.17R, May -0.55R in 8 trades). This week: -1.00, -1.00 = -2.00R.
     Price at 12:00 London (stop-day routine, from the tool): bid 1.12532 = 70.5 pips against my entry, 30.4 pips beyond the stop. A REAL stop. The morning's high was
     1.12787 at 10:45; the afternoon stayed between 1.12057 and 1.12666.
     What happened: +6.4 pips in the first candle, then one M15 candle of 40 pips straight up through the stop. The night had risen, the hour before entry was lively,
     the 10-day trend was up, UN3 said skip. Last Wednesday the same list of warnings preceded +0.63R. Two cases, one each way.
     Paper tags: UN3 - fourth forward DISAGREE day - paper skips a -1.00R trade (disagree days so far: -0.02, -1.00, +0.63, -1.00 = -1.39R; n = 4 of 30).
     PH2 (paper, forward day 8): lively hour -> paper half size = -0.50R against the live -1.00R. A full-stop morning (worst -54.3 pips in the first hour).
     Tally: 8 forward days, 7 lively (live -1.01R, 3 full-stop mornings) and 1 quiet (+0.46R); PH2 total -0.05R against A2's -0.55R.
     Both paper lines are 'working' this week. That is exactly the situation their rules were written for: n = 4 of 30 and 7 of 60. Nothing changes.
     Night count: against me by 35.1 pips -> live trade 10 of the count (running: 10 trades, +2.29R). 10-day-trend paper line: trend UP: 5 trades, -0.84R.
     END OF RELEASED DATA (clock Wed 05-13 01:00 London).

- **Wed 05-13 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-13` and the bar prints.
  D1 (London days): Fri 05-08 high 1.12880 low 1.11790 close 1.12015 (0.21); Mon 05-11 high 1.12065 low 1.11310 close 1.11546 (0.31); Tue 05-12 high 1.12787
      low 1.11343 close 1.12127 (0.54, range 144.4): a wide up day that gave back about half. Tuesday made neither the 3-day high nor the 3-day low.
  H4 (UTC bars): Tue 08:00 bar high 1.12787; 12:00 bar 1.12225-1.12666; 16:00 bar down to 1.12105; tonight 00:00 bar 1.12187 -> 1.12395; 04:00 bar high 1.12548.
  H1: the night (00:00-07:00 London): open 1.12155, high 1.12548, low 1.12128, last 1.12372: range 42.0 pips (ratio 0.72), net +21.7 pips - a rising night again.
  M15: six small candles under 1.12548, then the last one fell 1.12469 -> 1.12372.
  Bias: SELL. 22:00 London closes: 05-12 1.12127 vs 05-07 1.12662 = -53 pips (3-day gap -53.5). Gap / ADR5 0.39: not stretched.
  UN3 PAPER TAG (never live): 5-day gap +28 pips -> BUY; 3-day says SELL -> DISAGREE: paper SKIPS. Forward day 17, disagree day 5 of 30. Live trade at full size.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 9.
  MB1 PAPER TAG (never live, first forward day): morning direction written at 12:00 London, before 13:25.
  Levels: night high 1.12548; Tue high 1.12787; night low 1.12128; Tue afternoon low 1.12057.
  Rejection-day check: Tuesday did not make the 3-day low or high. Not a rejection day. 10-day-trend paper line: UP (1.12127 vs 04-28 1.09802); the sell is against it.
  SIZE RULE: tracker balance $25,097.42, high-water $25,349.14, drawdown -0.99%; trigger 1 at $24,588.67 not reached -> FULL size, 0.31 lots.
  DAILY-LOSS CUSHION (coach: check after two valid losses in a row): one trade a day, risk $125; my worst live loss is -1.03R, about $129. The daily limit is 5%:
      $1,250 counted on the starting $25,000 (the most careful base; I am not certain which base the firm uses, so I take the smallest). One full stop uses about a
      tenth of it. There is no second trade, so one day cannot lose more than one stop plus slippage. Account line $22,500 is $2,597 under the tracker balance: about
      20 full stops; my own brakes come first (half size 4 stops from here, stop trading at $24,081.68). Two losses do not change the size: the rule's trigger does.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: same list as yesterday (night up, UN3 skip, trend up) and yesterday that list was right. One each way last week. Written; not a rule. I take the trade.
  MB1, how long before I would trust it (coach): it kept 32 trades on 91 A2 days of history, about 0.35 a day. First look is 100 forward kept trades: roughly 285
      trading days, about 13 months (around mid 2016). Interim look at 40 kept trades (early-close lines only): roughly 115 trading days, about late October 2015.
      These are estimates from the history rate, not dates. Before 100 forward kept trades: paper only, whatever it shows.
  08:00 London Wed: pre-entry hour 1.12238-1.12661 = 42.3 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.12520: night against me by 36.5 pips (counted), entry 14.8 pips better than at 07:00. Correction to the cushion line: README says the daily limit is 5% of the START-OF-DAY balance, so about $1,255 on the tracker balance $25,097.42 (not $1,250); one stop is still about a tenth. Order: SELL 0.31, stop 40 pips above the bid (about 1.12920).
  08:15 London: filled SELL 1.12518, stop 1.12920 (40.2 pips). First candle: bid 1.12472, a few pips for me. Call for the next 45 minutes: no opinion that matters; the hour 07-08 spiked to 1.12661 and that is the level to watch. Hands off.
  09:00 London: first hour flat: best +14.0, worst -10.5, last 0.0 pips (from the tool). A box 1.1237-1.1261. No call; the plan is the clock. Hands off.
  10:00 London (written after reading the walk print; one note for the hour): see next line for figures.
     (10:00 figures, added at 11:00 - I advanced with a placeholder note, a small sloppiness, said here): second hour best +31.0, worst -5.9, last +24.1 pips.
  11:00 London: third hour best +48.5 (low 1.12023), worst +4.4, last +22.3 pips. It bounced 44 pips from the low back to 1.12464 and I still hold +22. No target, no trailing: 33 exit definitions say leave it. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.12261, +$79.67 (from the trade list). MB1 paper (first forward day), written before 13:25: open 08:00 1.12519, open 12:00 1.12250 -> morning DOWN by 26.9 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Wed result, TAG FIRST: VALID WIN (valid setup, followed the plan). Checked: size rule read, no trigger, full size; call with the cushion check and paper lines
     committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade.
     Process: one sloppiness - I advanced the 10:00 hour with a placeholder note and filled its figures at 11:00. No effect on the trade; said in the note. Not hidden.
     All figures from `python bt/daily_numbers.py 474.84 25349.14` and the walk prints.
     Result: sold 1.12518, stop 1.12920 (40.2 pips, risk $124.62), closed 12:00 London @1.12261, +$79.67 = +0.64R.
     Tracker balance $25,177.09 (sim $25,651.93 minus $474.84 paid out), high-water $25,349.14, drawdown -0.68%. Triggers $24,588.67 / $24,081.68: not reached -> full size.
     Funded totals from the log: 34 trades, 19 wins, 15 valid losses, +5.23R (March +0.97R, April +4.17R, May +0.09R in 9 trades). This week: -1.00, -1.00, +0.64 = -1.37R.
     The same warning list as Tuesday (night up, lively hour, UN3 skip, trend up): Tuesday -1.00R, today +0.64R. That list is not information yet.
     Paper tags: UN3 - fifth forward DISAGREE day - paper skips a +0.64R winner (disagree days: -0.02, -1.00, +0.63, -1.00, +0.64 = -0.75R; n = 5 of 30).
     PH2 (paper, forward day 9): lively -> paper half = +0.32R against the live +0.64R. Tally: 9 days, 8 lively (live -0.37R, 3 full-stop mornings), 1 quiet (+0.46R);
     PH2 total +0.27R against A2's +0.09R.
     MB1 (paper, forward day 1; `python bt/morning_box.py 2015-05-14 --check 2015-05-13`): morning -26.9 pips (DOWN); the box broke UP -> against the morning ->
     REMOVED by MB1. That removed trade made +4.23R. On its first forward day the filter threw away the biggest box trade I have seen. One day; it goes in the table
     exactly as it is. It is also what reason 2 of my doubts said: the difference lives in a few big trades, and they can fall on either side.
     Night count: against me by 36.5 pips -> live trade 11 of the count (running: 11 trades, +2.93R). 10-day-trend paper line: trend UP: 6 trades, -0.20R.
     END OF RELEASED DATA (clock Thu 05-14 01:00 London).

- **Thu 05-14 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID WIN. Figures from `python bt/call_numbers.py 2015-05-14` and the bar prints.
  D1 (London days): Mon 05-11 close 1.11546 (0.31); Tue 05-12 high 1.12787 low 1.11343 close 1.12127 (0.54); Wed 05-13 high 1.13827 low 1.12023 close 1.13536
      (0.84, range 180.4): the widest day of the three, closed near its high and made the 3-day high. All of it came AFTER my noon exit (the 12:00 UTC H4 bar
      1.12317 -> 1.13717). My sell was closed +0.64R an hour before a 160 pip rally against it. The noon clock did that, not me.
  H4 (UTC bars): Wed 12:00 bar high 1.13827; 16:00 bar back to 1.13400; tonight 00:00 bar 1.13469 -> 1.13707; 04:00 bar high 1.13798.
  H1: the night (00:00-07:00 London): open 1.13526, high 1.13798, low 1.13406, last 1.13776: range 39.2 pips (ratio 0.73), net +25.0 pips - a rising night, with my side.
  M15: dip to 1.13600 at 06:00-06:30 London, then two rising candles to 1.13798; last close 1.13776.
  Bias: BUY. 22:00 London closes: 05-13 1.13536 vs 05-08 1.12015 = +152 pips (3-day gap +152.1). Gap / ADR5 1.15: stretched (my best group over all history).
  UN3 PAPER TAG (never live): 5-day gap +8 pips -> BUY; agree: paper TRADES. Forward day 18, disagree days 5 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 10.
  MB1 PAPER TAG (never live, forward day 2; coach: one day is one day): morning direction written at 12:00, before 13:25. Day 1 was a removed +4.23R; it proves nothing either way.
  Levels: night high 1.13798; Wed high 1.13827; night low 1.13406; Wed evening low 1.13400.
  Rejection-day check: for a buy, Wednesday would need the 3-day high (True) AND a close in the bottom third; it closed at 0.84. Not a rejection day.
  10-day-trend paper line: UP (1.13536 vs 04-29 1.11280); the buy is with it.
  SIZE RULE: tracker balance $25,177.09, high-water $25,349.14, drawdown -0.68%; trigger 1 at $24,588.67 not reached -> FULL size, 0.31 lots.
  WHEN MY OWN 1.25% BUFFER BITES (coach 05-14; written into the plan today): with ONE trade a day the firm's 5% daily limit is the line and 0.50% stays (worst
      case seen 1.54%). The buffer is for a day with TWO trades: the losses of both add up inside the same 5% day, even if they are never open together (A2 is
      flat at 12:00, a box trade would start after 13:25). Only for that case I size: the second trade must keep "A2 worst case + its own worst case" <= 2.0%
      of the balance on the then history. Today no second trade exists (MB1 is paper), so the rule sizes nothing.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: buying 15 pips under yesterday's high after a 180 pip day. Stretched signals have been my best; written, not a rule.
  08:00 London Thu: pre-entry hour 1.13628-1.14222 = 59.4 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.14114: the hour ran 34 pips away from me, above yesterday's high; night with me by 58.8 pips (not counted as against). I am buying after a spike, like 04-24 and 05-11, both full stops. The rule has no skip. Order: BUY 0.31, stop 40 pips below the bid (about 1.13714).
  08:15 London: filled BUY 1.14125, stop 1.13714 (41.1 pips from the fill). First candle high 1.14286, close 1.14221. Call for the hour: none that matters; 1.1422 (the pre-entry high) is the level. Hands off.
  09:00 London: first hour best +18.1, worst -37.6 (low 1.13749, 3.5 pips from the stop), last -22.3 pips. The spike is being sold. I want to do nothing and that is the plan: the stop is where it is, the clock is noon. No call.
  10:00 London: second hour best +4.6, worst -33.5, last -9.1 pips. Survived twice within 8 pips of the stop. A TD-style tighter stop (25 pips from 09:00) would have taken me out at -0.63R in this hour: noted, already tested, not a rule. Hands off.
  11:00 London: third hour best +22.4 (new high 1.14349), worst -14.0, last +7.6 pips. Back above my entry. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.14336, +$65.41 (from the trade list). MB1 paper (forward day 2), written before 13:25: open 08:00 1.14114, open 12:00 1.14337 -> morning UP by 22.3 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Thu result, TAG FIRST: VALID WIN (valid setup, followed the plan). Checked: size rule read, no trigger, full size; call committed at 07:00 London; PH2's
     range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved, closed 12:00, one trade; a note before every advance. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14` and the walk prints.
     Result: bought 1.14125, stop 1.13714 (40 pips under the bid at the order; 41.1 from the fill, risk $127.41), closed 12:00 London @1.14336, +$65.41 = +0.51R.
     Tracker balance $25,242.50 (sim $25,717.34 minus $474.84 paid out), high-water $25,349.14, drawdown -0.42%. Triggers $24,588.67 / $24,081.68: not reached -> full size.
     Funded totals from the log: 35 trades, 20 wins, 15 valid losses, +5.74R (March +0.97R, April +4.17R, May +0.60R in 10 trades). This week: -1.00, -1.00, +0.64, +0.51 = -0.85R.
     Luck, said plainly: the low of the first hour was 3.5 pips from my stop. Four pips more and this is -1.03R and "bought the spike, third time". The trade
     was valid either way; the result was a coin that landed well. A 25 pip stop from 09:00 (TD1) would have lost 0.63R here.
     Paper tags: UN3 agreed (agree days now +2.89R in 13 trades; disagree days -0.75R in 5; n = 5 of 30).
     PH2 (paper, forward day 10): lively (59.4) -> paper half = about +0.26R against the live +0.51R. Tally: 10 days, 9 lively (live +0.14R, 3 full-stop
     mornings), 1 quiet (+0.46R); PH2 total about +0.53R against A2's +0.60R.
     MB1 (paper, forward day 2; `python bt/morning_box.py 2015-05-15 --check 2015-05-14`): morning +22.3 pips (UP); the box broke DOWN -> against -> REMOVED;
     that trade lost -1.00R. Two forward days: kept 0 trades; removed 2 (+4.23, -1.00 = +3.23R). Still nothing: no kept trade yet.
     Night count: with me today, not counted (running: 11 trades, +2.93R). 10-day-trend paper line: trend UP: 7 trades, +0.31R.
     END OF RELEASED DATA (clock Fri 05-15 01:00 London).

- **Fri 05-15 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID WIN. Figures from `python bt/call_numbers.py 2015-05-15` and the bar prints.
  D1 (London days): Tue 05-12 close 1.12127 (0.54); Wed 05-13 high 1.13827 low 1.12023 close 1.13536 (0.84); Thu 05-14 high 1.14447 low 1.13406 close 1.14097
      (0.66, range 104.1): third rising close, new 3-day high. Thursday afternoon fell 100 pips from 1.14356 to 1.13435 and came all the way back by 22:00.
  H4 (UTC bars): Thu 12:00 bar 1.14254 -> low 1.13435 -> 1.13676; 16:00 bar back to 1.14084; tonight 00:00 bar 1.14022-1.14184; 04:00 bar down to 1.13803.
  H1: the night (00:00-07:00 London): open 1.14040, high 1.14184, low 1.13803, last 1.13832: range 38.1 pips (ratio 0.72), net -20.8 pips - a falling night, against my side.
  M15: four falling candles in a row from 1.14147 to the night low 1.13803; last close 1.13832.
  Bias: BUY. 22:00 London closes: 05-14 1.14097 vs 05-11 1.11546 = +255 pips (3-day gap +255.1). Gap / ADR5 2.08: very stretched (my best group over all history).
  UN3 PAPER TAG (never live): 5-day gap +144 pips -> BUY; agree: paper TRADES. Forward day 19, disagree days 5 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 11.
  MB1 PAPER TAG (never live, forward day 3): morning direction written at 12:00, before 13:25.
  Levels: night high 1.14184; Thu high 1.14447; night low 1.13803; Thu afternoon low 1.13435.
  Rejection-day check: Thursday made the 3-day high (True) and closed at 0.66, not in the bottom third. Not a rejection day. 10-day trend: UP; the buy is with it.
  PERSONAL STOP CHANGED TODAY (coach 05-15; written in the plan before this call): 7% under the high-water instead of 5%. Size unchanged. Fixed for funded days 36-55.
  SIZE RULE: tracker balance $25,242.50, high-water $25,349.14, drawdown -0.42%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) now $23,574.70.
  FRIDAY GATES (list read): A2 alarm 54 / 100; UN3 5 / 30 disagree days; PH2 9 / 60 lively days; night count 11 / 40; up-trend line 7 / 40; MB1 0 / 100 kept; payout next Fri 05-22. None due.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade. The release ends at 22:00 London today.
  Worry: the last hour fell 35 pips straight; buying into that. Written, not a rule.
  08:00 London Fri: pre-entry hour 1.13711-1.14154 = 44.3 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.14145: the hour dipped to 1.13711 and rallied 44 pips to its high; I buy the top of the hour again (31.3 pips worse than at 07:00). Night with me by 10.5 pips (not counted). Order: BUY 0.31, stop 40 pips below the bid (1.13745).
  08:15 London: filled BUY 1.14156, stop 1.13745 (41.1 pips from the fill). First candle read from the tool before this note. Call for the hour: none that matters; hands off.
  09:00 London: first hour best +5.1, worst -39.8 (low 1.13758: 1.3 pips from the stop), last -30.4 pips. Bought the top of the hour and it fell 40 pips at once. Yesterday 3.5 pips, today 1.3. Nothing to do: the stop is the stop. No call.
  10:00 London: STOPPED in the 09:30 London candle (low 1.13580). Balance read from the tool: sim $25,589.62. One trade a day: done. I only watch to noon for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.13583 = 57.3 pips under my entry, 16.2 pips beyond the stop: a REAL stop. MB1 paper (forward day 3), written before 13:25: open 08:00 1.14145, price at 12:00 1.13583 -> morning DOWN by about 56 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures and result from the tool afterwards.
  -> Fri result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: plan change (personal stop 7%) written and pushed before the
     call; size rule read, no trigger, full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never
     moved, one trade, no second trade after the stop. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: bought 1.14156, stop 1.13745 (40 pips under the bid at the order; 41.1 from the fill, risk $127.41), STOPPED 09:30 London @1.13744, -$127.72 = -1.00R.
     Tracker balance $25,114.78 (sim $25,589.62 minus $474.84 paid out), high-water $25,349.14, drawdown -0.92%.
     Size rule after the day: trigger 1 (half size) $24,588.67 not reached -> full size Monday. Trigger 2 (stop, 7% from today) $23,574.70.
     Funded totals from the log: 36 trades, 20 wins, 16 valid losses, +4.74R (March +0.97R, April +4.17R, May -0.40R in 11 trades).
     WEEK W20: -1.00, -1.00, +0.64, +0.51, -1.00 = -1.85R in 5 trades, -$234.36. Three full stops in one week. No rule changes off a losing week.
     Price at 12:00 London (stop-day routine, from the tool): bid 1.13583 = 57.3 pips under my entry, 16.2 pips beyond the stop. A REAL stop.
     What happened: the hour before entry dipped 12 pips under the night low and rallied 44; I bought its top and the next candles took all of it back.
     Thursday the same picture stopped 3.5 pips short of my stop and paid +0.51R; today it went through. Two days, one each way - and exactly the pair that
     shows why I must not read Thursday as skill.
     Paper tags: UN3 agreed, so the paper line takes the same -1.00R (agree days +1.89R in 14 trades; disagree days -0.75R in 5; n = 5 of 30).
     PH2 (paper, forward day 11): lively (44.3) -> paper half = -0.50R against the live -1.00R. Tally: 11 days, 10 lively (live -0.86R, 4 full-stop mornings),
     1 quiet (+0.46R); PH2 total about +0.03R against A2's -0.40R. Lively days are 10 of 11 this month: the 30 pip line is not separating anything in May.
     MB1 (paper, forward day 3; `python bt/morning_box.py 2015-05-16 --check 2015-05-15`): morning -56.2 pips (DOWN); the 13:25-14:30 window stayed inside the
     12:00-13:25 box (box low 1.13239, window low 1.13241): NO box trade. Three forward days: kept 0, removed 2 (+3.23R), no break 1.
     Night count: with me today, not counted (11 trades, +2.93R). 10-day-trend paper line: trend UP: 8 trades, -0.69R.
     END OF RELEASED DATA (clock Fri 05-15 22:00 London).

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

## 05-12 research (before the next day), the slow way: ten seeded random A2 charts written up, base rates counted, then the midday-box breakout BX1/BX2/BX3 pre-registered and run (journal/2015-ten-charts-and-idea-BX.md) - no survivor by the kill test (fails the period line and the drawdown line), though it is the first second setup to pass the average, the cost stress and independence. Parked, no tag. Rule A2 and size 0.50% unchanged. Ideas 56, variants 153.

## 05-12 research after funded day 33 (coach: scroll the losers of the last 3 killed ideas first): 24 charts of the last 8 losers of BX1, SI1, TD1 written up
(journal/2015-review-losers-of-3-killed-ideas-and-idea-MB.md), then idea MB pre-registered (K1-K8) and run once: MB1 (box break only with the morning) passes all
eight lines on the set without the inspiring days (30 trades, +0.695R +-0.65); MB2 and MB3 killed. MB1 goes on PAPER (journal/MB1-paper-tag-rules.md) with five
written reasons not to trust it. A2 and the live size: unchanged. Counts: 57 ideas, 156 variants.

## 05-13 research after funded day 34 (coach: check the daily-loss cushion): idea DC pre-registered and run once (journal/2015-idea-DC-daily-cushion.md).
A stop filled at the worst price of its minute: worst -1.33R (pass). The biggest morning minute in history (81.7 pips) on my stop: -3.07R = 1.54% of the balance -
my own 1.25% line FAILS; the firm's 5% daily limit still has more than 3x cushion. Size unchanged (no trigger); proposal written for the coach.
MB1's possible size cut to about 0.09% in its rules. Counts: 58 ideas, 159 variants.

## 05-14 research after funded day 35: idea TS, tail stress of the funded plan (journal/2015-idea-TS-tail-stress.md). Looked at the 16 stop days and the jump
day minute by minute first, then kill lines, then one run. Account line never breached (lowest -5.7% in any run); my own -5% stop is reached about 9 points more
often with a jump day per 92 days: K2 fails, the claim "the plan holds with the tail in" is killed. Found a flaw in my own method in the result (T1 eased the
stops instead of worsening them): process mistake P7, T1 void, no re-run. Size and rules unchanged. Counts: 59 ideas, 162 variants; process mistakes 7.

## 05-14 research, second part (coach: a test with a voided part earns no day; fix the flaw and re-run with the same kill lines): TS clean re-run.
Method fix and hand-worked expected averages pushed before the run; the print matched them (+0.166 / +0.131 / +0.096R). K1 PASS (0.0% breached), K2 FAIL
(own -5% stop 13.4% -> 43.9% under one jump per 92 days), K3 FAIL (payout 55% of base). Same verdict, three times the size the flawed run showed.
Size and rules unchanged; proposal to the coach written. Counts: 59 ideas, 165 variants.

## 05-15 research after funded day 36: idea WS (journal/2015-idea-WS-wider-stop.md). The choice (stop 7%, size 0.50%) was made and written before the trade;
the simulation was pre-registered with hand-worked regression and floor figures, both matched, then run once. WS1 passes safety (0.0% breached, lowest
-7.73%), cuts the own-stop odds under a jump day per 92 from 43.5% to 7.4%, and beats the smaller size (0.40%: 20.2%, lower payout) in all four cases.
Held for funded days 36-55. Counts: 60 ideas, 168 variants.

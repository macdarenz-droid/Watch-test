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

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 52 | 32 | +15.69 | +0.30 | 3.23R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 16 days, 4 disagree days of 30 | - | A2 on the disagree days -1.39R; on the agree days +2.38R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 8 days, 7 lively days of 60 | - | A2 on the lively days -1.01R (3 full-stop mornings), on the 1 quiet day +0.46R; PH2 -0.05R vs A2 -0.55R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33).
Loss tags, all live trades: valid loss 33 (-20.73R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Tue 2015-05-12:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 52 | 52 |
| Win rate | 64% | 62% | 62% |
| Avg R | +0.50 | +0.30 | +0.30 |
| +- 2 standard errors | 0.33 | 0.29 | 0.29 |
| Net R | +19.56 | +15.69 | +15.86 |
| Avg win / avg loss | +1.04 / -0.46 | +0.95 / -0.74 | +0.96 / -0.75 |
| Full stops | 3 (8%) | 13 (25%) | 13 (25%) |
| Max drawdown | 1.87R | 3.23R | 3.28R |
| Worst 10 trades in a row | +0.56R | -1.66R | -1.70R |
| Sells: n, avg R | 24, +0.70 | 27, +0.39 | 27, +0.39 |
| Buys: n, avg R | 15, +0.18 | 25, +0.20 | 25, +0.21 |
Live minus backtest: -0.20R per trade (noise band +-0.44R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): +0.07R. As traded vs engine on the same days: -0.17R over 52 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 52 done, avg +0.30R, max DD 3.23R. Planning edge +0.18R: live is +0.12R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 10 (+2.29R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 5 trades -0.84R; trend DOWN 0 trades (look at 40 up-trend trades).

## 05-12 research (before the next day), the slow way: ten seeded random A2 charts written up, base rates counted, then the midday-box breakout BX1/BX2/BX3 pre-registered and run (journal/2015-ten-charts-and-idea-BX.md) - no survivor by the kill test (fails the period line and the drawdown line), though it is the first second setup to pass the average, the cost stress and independence. Parked, no tag. Rule A2 and size 0.50% unchanged. Ideas 56, variants 153.

# Journal - FUNDED ACCOUNT, week of 2015-05-25 (W22). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
Start of week (from the tool, 05-22): tracker balance $24,884.45 (sim $25,359.29 minus $474.84 paid out), high-water $25,349.14, drawdown -1.83% (the deepest so far; 3.69R under the equity high). Last two weeks -1.85R, -1.84R. No payout date this week (next Fri 06-05).
SIZE RULE: half size from a day's close at or below 3% under the high-water ($24,588.67) until a new high-water; STOP at 7% under ($23,574.70; fixed for funded days 36-55; 6 done).
NORMAL WORST (written 05-19, from 20,000 reshuffles of my own trades, 56 trades): 6 losses in a row; about 5.9R of drawdown. I am at 3 in a row and 3.69R. Coach 05-25: "that's exactly why you wrote it down. stay the course."
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades. Every figure comes from a tool print.
Friday 05-29 is the last trading day of May: the month-end review is due on the first live day of June.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F42 | Mon 05-25 08:00 | sell | 0.31 | 1.10038 | 1.10439 | 1.09763 (12:00 close) | +0.69 | +$85.25 | VALID WIN | never more than 3.5 pips against me; best +43.8 pips at 09:30, closed +27.5; quiet pre-entry hour (21.3): PH2 paper full size; UN3 agree; MB1 paper day 9: break UP against the morning, removed, -0.35R |
| F43 | Tue 05-26 08:00 | sell | 0.31 | 1.08895 | 1.09298 | 1.09078 (12:00 close) | -0.45 | -$56.73 | VALID LOSS (valid setup, market disagreed) | sold the low of a 54 pip pre-entry hour; never more than +3.5 pips in profit; worst -26.3; closed by the clock at -18.3 pips; PH2 paper half size; UN3 agree; MB1 paper day 10: break DOWN against a small up morning, removed, +0.94R |
| F44 | Wed 05-27 08:00 | sell | 0.31 | 1.09189 | 1.09589 | 1.08825 (12:00 close) | +0.91 | +$112.84 | VALID WIN | flat for two and a half hours (never more than 6.8 pips against me), broke down at 10:30; best +45.9 pips, closed +36.4; quiet pre-entry hour (29.7): PH2 paper full size; UN3 agree; MB1 paper day 11: third kept trade, -1.00R |
| F45 | Thu 05-28 08:00 | sell | 0.31 | 1.09338 | 1.09745 | 1.09296 (12:00 close) | +0.10 | +$13.02 | VALID WIN (a scratch) | a 30 pip range around the entry all morning: best +22.9, worst -17.9, closed +4.2 pips; rejection day (8th case of the parked count); PH2 paper half size; UN3 agree; MB1 paper day 12: fourth kept trade, -1.00R |
| F46 | Fri 05-29 08:00 | sell | 0.31 | 1.09284 | 1.09684 | 1.09685 (stop, 09:01) | -1.00 | -$124.31 | VALID LOSS (valid setup, market disagreed) | sold near the low of a 40 pip pre-entry hour; four rising candles; stopped by a bid high 5.3 pips through my level; price at 12:00 London 1.09589 (-30.5 from entry, 9.5 inside the stop; -0.76R at noon without it); small signal (gap / ADR5 0.25); PH2 paper half size; UN3 agree; MB1 paper day 13: fifth kept trade, -1.00R |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance
- **Mon 05-25 call, written 07:00 London (06:00 UTC), before the entry bar.** Friday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-25` and the bar prints.
  D1 (London days): Wed 05-20 close 1.10937 (0.35); Thu 05-21 close 1.11117 (0.31); Fri 05-22 high 1.12083 low 1.10023 close 1.10074 (0.02, range 206.0):
      it took my stop at 1.1193 in the morning, made the 3-day high at 1.12083, then fell 206 pips and closed on the low - the 3-day high AND the 3-day low in
      one day. My sell was right about the day and wrong about the morning. The noon clock would not have saved it either: -0.81R at 12:00.
  H4 (UTC bars): Fri 12:00 bar 1.11767 -> 1.10023 (close 1.10329); 16:00 bar low 1.10030; Sunday bar low 1.09644; tonight 00:00 bar 1.09712-1.10012; 04:00 bar 1.09771-1.09905.
  H1: the night (00:00-07:00 London): open 1.10016, high 1.10095, low 1.09712, last 1.09863: range 38.3 pips (ratio 0.93), net -15.3 pips - a slightly falling night, with my side.
  M15: six small candles 1.0977-1.0990; last close 1.09863. Quiet.
  Bias: SELL. 22:00 London closes: 05-22 1.10074 vs 05-19 1.11493 = -142 pips (3-day gap -141.9). Gap / ADR5 0.94: just under stretched.
  UN3 PAPER TAG (never live): 5-day gap -441 pips -> SELL; agree: paper TRADES. Forward day 25, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 17.
  MB1 PAPER TAG (never live, forward day 9): morning direction written at 12:00, before 13:25.
  Levels: night low 1.09712 (Sunday low 1.09644); Fri low 1.10023 (now above the price); night high 1.10095.
  Rejection-day check: for a sell, Friday would need the 3-day low (True) AND a close in the top third; it closed at 0.02. Not a rejection day.
  10-day-trend paper line: DOWN (1.10074 vs 05-08 1.12015); the sell is with it.
  SIZE RULE: tracker balance $24,884.45, high-water $25,349.14, drawdown -1.83%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
      One more full stop today leaves the balance near $24,759, still above trigger 1; two more would be near it. The rule decides, on the day's close, not me.
  Monday: five losing Mondays in a row before this one. MO said it was a streak (Mondays +0.397R in the 14 before). The plan, without a second thought.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: three stops in a row and I am selling a market that has already fallen 480... correction, I have not computed that - a market at its low of the month. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.09854-1.10067 = 21.3 pips -> PH2 paper: QUIET, paper full size (decided before the order). Price 1.10039: the hour rose 18 pips; night against me by 2.3 pips (counted); entry 17.6 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.10439).
  08:15 London: filled SELL 1.10038, stop 1.10439 (40.1 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +35.7 (low 1.09671), worst -3.5, last +29.5 pips. In profit for the first time in four days and I notice the wish to bank it. No target; the clock is noon. Hands off.
  10:00 London: second hour best +43.8 (low 1.09590), worst +26.2, last +29.9 pips. No call; hands off.
  11:00 London: third hour best +34.7, worst +17.0, last +26.4 pips. A 17 pip range. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.09763, +$85.25 (from the trade list). MB1 paper (forward day 9), written before 13:25: open 08:00 1.10039, open 12:00 1.09752 -> morning DOWN by 28.7 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Mon result, TAG FIRST: VALID WIN (valid setup, followed the plan). Checked: size rule read, no trigger, full size; call committed at 07:00 London; PH2's
     range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, no early exit, closed 12:00, one trade; a note before every advance.
     Process: one sentence in the call started with an uncomputed number and was struck out in the same line before the commit (the second time this
     month). No figure of record touched; but it is a habit now, so from tomorrow the Worry line carries no numbers at all unless they come from the print.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: sold 1.10038, stop 1.10439 (40.1 pips, risk $124.31), closed 12:00 London @1.09763, +$85.25 = +0.69R.
     Tracker balance $24,969.70 (sim $25,444.54 minus $474.84 paid out), high-water $25,349.14, drawdown -1.50%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 42 trades, 22 wins, 20 valid losses, +3.59R (March +0.97R, April +4.17R, May -1.55R in 17 trades). This week: +0.69R.
     The streak ended at 3 losses in a row; 3.01R under the equity high (trade list); the live maximum stays 3.69R. Normal worst: 6 in a row, about 5.9R.
     A Monday won after five lost. It proves as little as the five did.
     Paper tags: UN3 agreed (agree days -1.42R in 19 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 17): QUIET hour (21.3) -> paper full size = +0.69R, same as live. Tally: 17 days, 14 lively (live -1.69R, 7 full-stop mornings),
     3 quiet (+0.46, -1.00, +0.69 = +0.15R); PH2 total about -0.69R against A2's -1.55R.
     MB1 (paper, forward day 9; `python bt/morning_box.py 2015-05-26 --check 2015-05-25`): morning -28.7 pips (DOWN, large); the box broke UP -> against ->
     REMOVED; that trade lost -0.35R. Nine forward days: kept 2 (-0.24R), removed 6 (+7.70R), no break 1.
     Night count: against me by 2.3 pips -> live trade 15 of the count (running: 15 trades, +0.62R). 10-day-trend paper line: trend DOWN: 4 trades, -2.31R; trend UP: 10 trades, +0.48R.
     +80 pip trades (counts-only): none today (best +43.8); 0 of 15.
     END OF RELEASED DATA (clock Tue 05-26 01:00 London).

- **Tue 05-26 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID WIN. Figures from `python bt/call_numbers.py 2015-05-26` and the bar prints.
  Coach 05-26, taken into the call: 66 ideas and 185 variants are a lot of looks at the same history, so a backtest win on it is weaker than it looks; A2
      stays as it is unless something beats it on my lived forward days too. The "lively days are mostly March-May" finding is one year of data: a NOTE, not
      a rule (the sentence I added to PH2's file yesterday is relabelled as a note today; PH2's thresholds were never touched).
  D1 (London days): Thu 05-21 close 1.11117 (0.31); Fri 05-22 high 1.12083 low 1.10023 close 1.10074 (0.02, range 206.0); Mon 05-25 high 1.10095 low 1.09590
      close 1.09766 (0.35, range 50.5): a small holiday-quiet day, a lower close and a new 3-day low.
  H4 (UTC bars): Mon 12:00, 16:00, 20:00 bars flat 1.0967-1.0991; tonight 00:00 bar down 1.09683 -> 1.09427 (low 1.09311); 04:00 bar low 1.09278.
  H1: the night (00:00-07:00 London): open 1.09783, high 1.09798, low 1.09278, last 1.09327: range 52.0 pips (ratio 1.20), net -45.6 pips - a falling night, with my side.
  M15: stepped down 1.0948 -> 1.09278, then three small candles; last close 1.09327.
  Bias: SELL. 22:00 London closes: 05-25 1.09766 vs 05-20 1.10937 = -117 pips (3-day gap -117.1). Gap / ADR5 0.89.
  UN3 PAPER TAG (never live): 5-day gap -337 pips -> SELL; agree: paper TRADES. Forward day 26, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 18.
  MB1 PAPER TAG (never live, forward day 10): morning direction written at 12:00, before 13:25.
  Levels: night low 1.09278; Mon low 1.09590 (now above the price); night high 1.09798.
  Rejection-day check: for a sell, Monday would need the 3-day low (True) AND a close in the top third; it closed at 0.35. Not a rejection day.
  10-day-trend paper line: DOWN (1.09766 vs 05-11 1.11546); the sell is with it.
  SIZE RULE: tracker balance $24,969.70, high-water $25,349.14, drawdown -1.50%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling at a new low after a night that already fell. Written, not a rule.
  08:00 London Tue: pre-entry hour 1.08859-1.09398 = 53.9 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.08898: the hour fell 54 pips and sits on its low; night with me by 88.5 pips (not counted); entry 42.9 pips worse than at 07:00. I sell the bottom of the hour; the rule has no skip. Order: SELL 0.31, stop 40 pips above the bid (1.09298).
  08:15 London: filled SELL 1.08895, stop 1.09298 (40.3 pips). First candle read from the tool. No call that matters; hands off.
  09:00 London: first hour best +3.5, worst -26.3, last -11.3 pips: a bounce off the hour's low, as every time I enter on the edge of a lively hour. No call; hands off.
  10:00 London: second hour best +2.2, worst -17.6, last -3.0 pips. A range just above my entry. No call; hands off.
  11:00 London: third hour best -2.2, worst -24.4, last -22.7 pips. Never in profit by more than 3.5 pips all morning. One hour left; close at 12:00 or the stop, whichever comes.
  12:05 London: closed at 12:00 @1.09078, -$56.73 (from the trade list): a noon loss, not a stop. MB1 paper (forward day 10), written before 13:25: open 08:00 1.08896, open 12:00 1.09067 -> morning UP by 17.1 pips (small morning) -> only an UP break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Tue result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size; call committed at 07:00
     London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade; a note before every advance;
     the Worry line carried no numbers. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: sold 1.08895, stop 1.09298 (40.3 pips, risk $124.93), closed 12:00 London @1.09078, -$56.73 = -0.45R. The noon clock did its job as the loss-cutter.
     Tracker balance $24,912.97 (sim $25,387.81 minus $474.84 paid out), high-water $25,349.14, drawdown -1.72%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 43 trades, 22 wins, 21 valid losses, +3.13R (March +0.97R, April +4.17R, May -2.01R in 18 trades). This week: +0.69, -0.45 = +0.23R.
     Against the written number: 1 loss in a row, 3.46R under the equity high (trade list); live maximum 3.69R; normal worst 6 in a row and about 5.9R.
     Paper tags: UN3 agreed (agree days -1.87R in 20 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 18): lively (53.9) -> paper half = -0.23R against the live -0.45R. Tally: 18 days, 15 lively (live -2.14R, 7 full-stop mornings),
     3 quiet (+0.15R); PH2 total about -0.92R against A2's -2.01R.
     MB1 (paper, forward day 10; `python bt/morning_box.py 2015-05-27 --check 2015-05-26`): morning +17.1 pips (UP, small); the box broke DOWN -> against ->
     REMOVED; that trade made +0.94R. Ten forward days: kept 2 (-0.24R), removed 7 (+8.64R), no break 1.
     Night count: with me today, not counted (15 trades, +0.62R). 10-day-trend paper line: trend DOWN: 5 trades, -2.76R; trend UP: 10 trades, +0.48R.
     +80 pip trades (counts-only): none today; 0 of 15.
     END OF RELEASED DATA (clock Wed 05-27 01:00 London).

- **Wed 05-27 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID LOSS. Figures from `python bt/call_numbers.py 2015-05-27` and the bar prints.
  D1 (London days): Fri 05-22 close 1.10074 (0.02); Mon 05-25 close 1.09766 (0.35, range 50.5); Tue 05-26 high 1.09810 low 1.08633 close 1.08719 (0.07, range
      117.7): after my noon exit it rose to 1.09401 and then fell 67 pips to close near the low. Third lower close, new 3-day low.
  H4 (UTC bars): Tue 12:00 bar 1.09401 -> 1.08757; 16:00 bar low 1.08633; tonight 00:00 bar 1.08650-1.08893; 04:00 bar up to 1.09160.
  H1: the night (00:00-07:00 London): open 1.08860, high 1.09160, low 1.08650, last 1.09069: range 51.0 pips (ratio 1.12), net +20.9 pips - a rising night, against my side.
  M15: five rising candles from 1.08756 to 1.09160, the last one back to 1.09069.
  Bias: SELL. 22:00 London closes: 05-26 1.08719 vs 05-21 1.11117 = -240 pips (3-day gap -239.8). Gap / ADR5 2.12: stretched.
  UN3 PAPER TAG (never live): 5-day gap -277 pips -> SELL; agree: paper TRADES. Forward day 27, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 19.
  MB1 PAPER TAG (never live, forward day 11; does not hold on lived days, 05-26 check): morning direction written at 12:00, before 13:25.
  Levels: night high 1.09160; Tue afternoon high 1.09401; night low 1.08650; Tue low 1.08633.
  Rejection-day check: for a sell, Tuesday would need the 3-day low (True) AND a close in the top third; it closed at 0.07. Not a rejection day.
  10-day-trend paper line: DOWN (1.08719 vs 05-12 1.12127); the sell is with it.
  SIZE RULE: tracker balance $24,912.97, high-water $25,349.14, drawdown -1.72%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: the night has been rising for three hours into my sell. Written, not a rule.
  08:00 London Wed: pre-entry hour 1.08993-1.09290 = 29.7 pips -> PH2 paper: QUIET by 0.3 pips, paper full size (decided before the order; the line is 30 and the tool says 29.7, I do not round). Price 1.09189: night against me by 32.9 pips (counted); entry 12.0 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.09589).
  08:15 London: filled SELL 1.09189, stop 1.09589 (40.0 pips). First candle: best +13.1, close +11.8 pips. No call that matters; hands off.
  09:00 London: first hour best +17.0, worst -6.8, last -1.2 pips. Flat. No call; hands off.
  10:00 London: second hour best +9.1, worst -5.0, last -1.8 pips. A 14 pip range around my entry. No call; hands off.
  11:00 London: third hour best +24.5 (low 1.08934), worst -6.8, last +16.0 pips: it broke the range downward at 10:30. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.08825, +$112.84 (from the trade list). MB1 paper (forward day 11), written before 13:25: open 08:00 1.09190, open 12:00 1.08814 -> morning DOWN by 37.6 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Wed result, TAG FIRST: VALID WIN (valid setup, followed the plan). Checked: size rule read, no trigger, full size; call committed at 07:00 London; PH2's
     range written at 08:00 before the order (29.7 pips = quiet, not rounded up); SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade; a note before
     every advance; no numbers in the Worry line. Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: sold 1.09189, stop 1.09589 (40.0 pips, risk $124.00), closed 12:00 London @1.08825, +$112.84 = +0.91R.
     Tracker balance $25,025.81 (sim $25,500.65 minus $474.84 paid out), high-water $25,349.14, drawdown -1.28%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 44 trades, 23 wins, 21 valid losses, +4.04R (March +0.97R, April +4.17R, May -1.10R in 19 trades). This week: +0.69, -0.45, +0.91 = +1.14R.
     Against the written number: 0 losses in a row, 2.55R under the equity high (trade list); live maximum 3.69R.
     The whole result came in the last 90 minutes: at 10:15 I was at +0.8 pips. An exit at 10:00 or 11:00 would have had almost nothing. The clock again.
     Paper tags: UN3 agreed (agree days -0.96R in 21 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 19): QUIET hour (29.7) -> paper full size = +0.91R, same as live. Tally: 19 days, 15 lively (live -2.14R, 7 full-stop mornings),
     4 quiet (+1.06R); PH2 total about -0.01R against A2's -1.10R.
     MB1 (paper, forward day 11; `python bt/morning_box.py 2015-05-28 --check 2015-05-27`): morning -37.6 pips (DOWN, large); the box broke DOWN -> with ->
     KEPT: -1.00R. Eleven forward days: kept 3 (+0.76, -1.00, -1.00 = -1.24R, DD 2.00R), removed 7 (+8.64R), no break 1.
     Night count: against me by 32.9 pips -> live trade 16 of the count (running: 16 trades, +1.53R). 10-day-trend paper line: trend DOWN: 6 trades, -1.85R; trend UP: 10 trades, +0.48R.
     +80 pip trades (counts-only): none today (best +45.9); 0 of 15.
     END OF RELEASED DATA (clock Thu 05-28 01:00 London).

- **Thu 05-28 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID WIN. Figures from `python bt/call_numbers.py 2015-05-28` and the bar prints.
  D1 (London days): Mon 05-25 close 1.09766 (0.35); Tue 05-26 close 1.08719 (0.07); Wed 05-27 high 1.09290 low 1.08192 close 1.09038 (0.77, range 109.8):
      after my noon exit it fell to a new low 1.08192 and then came back 85 pips to close in the top quarter. A new 3-day low and a close near the high.
  H4 (UTC bars): Wed 12:00 bar 1.08192-1.09107 (close 1.08864); 16:00 bar up to 1.09075; tonight 00:00 bar 1.08899-1.09200; 04:00 bar high 1.09269.
  H1: the night (00:00-07:00 London): open 1.09039, high 1.09269, low 1.08899, last 1.09189: range 37.0 pips (ratio 0.82), net +15.0 pips - a slightly rising night, against my side.
  M15: 1.0907-1.0927, the last candle back from the high to 1.09189.
  Bias: SELL. 22:00 London closes: 05-27 1.09038 vs 05-22 1.10074 = -104 pips (3-day gap -103.6). Gap / ADR5 0.88.
  UN3 PAPER TAG (never live): 5-day gap -190 pips -> SELL; agree: paper TRADES. Forward day 28, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 20.
  MB1 PAPER TAG (never live, forward day 12): morning direction written at 12:00, before 13:25.
  Levels: night high 1.09269; Wed high 1.09290; night low 1.08899; Wed low 1.08192.
  Rejection-day check (parked observation, never a rule): for a sell, Wednesday made the 3-day low (True) AND closed in the top third (0.77): a REJECTION day.
      The plan trades it at full size like any other; I note it for the count.
  10-day-trend paper line: DOWN (1.09038 vs 05-13 1.13536); the sell is with it.
  SIZE RULE: tracker balance $25,025.81, high-water $25,349.14, drawdown -1.28%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: yesterday the sellers were rejected at the low and the night is rising. Written, not a rule.
  08:00 London Thu: pre-entry hour 1.09019-1.09475 = 45.6 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.09345: the hour dipped and then rose to a new high above yesterday's; night against me by 30.6 pips (counted); entry 15.6 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.09745).
  08:15 London: filled SELL 1.09338, stop 1.09745 (40.7 pips from the fill). First candle (from the tool): low 1.09147, closed back at 1.09310. No call that matters; hands off.
  09:00 London: first hour best +22.9, worst -11.9, last -8.6 pips: it went my way for 30 minutes and gave it all back. No call; hands off.
  10:00 London: second hour best +12.7, worst -17.9 (high 1.09507), last -7.7 pips. A 30 pip range around my entry, highs creeping up. No call; hands off.
  11:00 London: third hour best +6.7, worst -10.4, last -0.8 pips. Flat. One hour left; close at 12:00 whatever it shows.
  12:05 London: closed at 12:00 @1.09296, +$13.02 (from the trade list): a scratch. MB1 paper (forward day 12), written before 13:25: open 08:00 1.09339, open 12:00 1.09285 -> morning DOWN by 5.4 pips (small morning) -> only a DOWN break of the 12:00-13:25 box counts. Result from the tool tomorrow.
  -> Thu result, TAG FIRST: VALID WIN, a scratch (valid setup, followed the plan). Checked: size rule read, no trigger, full size; call committed at 07:00
     London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade; a note before every advance.
     Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints and the trade list.
     Result: sold 1.09338, stop 1.09745 (40 pips above the bid at the order; 40.7 from the fill, risk $126.17), closed 12:00 London @1.09296, +$13.02 = +0.10R.
     Tracker balance $25,038.83 (sim $25,513.67 minus $474.84 paid out), high-water $25,349.14, drawdown -1.22%. Triggers $24,588.67 / $23,574.70: not reached -> full size.
     Funded totals from the log: 45 trades, 24 wins, 21 valid losses, +4.15R (March +0.97R, April +4.17R, May -1.00R in 20 trades). This week: +0.69, -0.45, +0.91, +0.10 = +1.24R.
     Against the written number: 0 losses in a row, 2.45R under the equity high (trade list); live maximum 3.69R.
     Paper tags: UN3 agreed (agree days -0.86R in 22 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 20): lively (45.6) -> paper half = about +0.05R against the live +0.10R. Tally: 20 days, 16 lively (live -2.04R, 7 full-stop
     mornings), 4 quiet (+1.06R); PH2 total about +0.04R against A2's -1.00R.
     MB1 (paper, forward day 12; `python bt/morning_box.py 2015-05-29 --check 2015-05-28`): morning -5.4 pips (DOWN, small); the box broke DOWN -> with ->
     KEPT: -1.00R. Twelve forward days: kept 4 (+0.76, -1.00, -1.00, -1.00 = -2.24R, DD 3.00R), removed 7 (+8.64R), no break 1. Its early-close lines
     (net below -3R after 20 kept; kept DD above 6R) are not reached. Still upside down.
     Night count: against me by 30.6 pips -> live trade 17 of the count (running: 17 trades, +1.63R). 10-day-trend paper line: trend DOWN: 7 trades, -1.75R; trend UP: 10 trades, +0.48R.
     +80 pip trades: none (0 of 15). 80+ pip pre-entry hours: none (4 of 10). Rejection-day count: +0.10R today.
     Tomorrow, Fri 05-29, is the last trading day of May and a Friday: gates list; the month-end review is due on the first live day of June.
     END OF RELEASED DATA (clock Fri 05-29 01:00 London).

- **Fri 05-29 call, written 07:00 London (06:00 UTC), before the entry bar.** Yesterday's tag stands: VALID WIN (scratch). Figures from `python bt/call_numbers.py 2015-05-29` and the bar prints.
  D1 (London days): Tue 05-26 close 1.08719 (0.07); Wed 05-27 low 1.08192 close 1.09038 (0.77); Thu 05-28 high 1.09584 low 1.08671 close 1.09474 (0.88,
      range 91.3): a second rising close off the 1.0819 low; neither a 3-day high nor a 3-day low. After my noon exit it dipped to 1.08671 and rallied 90 pips.
  H4 (UTC bars): Thu 12:00 bar 1.08671-1.09281; 16:00 bar up to 1.09584; 20:00 bar high 1.09742; tonight 00:00 bar 1.09513-1.09645; 04:00 bar low 1.09427.
  H1: the night (00:00-07:00 London): open 1.09691, high 1.09691, low 1.09427, last 1.09507: range 26.4 pips (ratio 0.59, quiet), net -18.4 pips - a slightly falling night, with my side.
  M15: drifted down from 1.0965 to 1.09427, last two candles back to 1.09507.
  Bias: SELL. 22:00 London closes: 05-28 1.09474 vs 05-25 1.09766 = -29 pips (3-day gap -29.2). Gap / ADR5 0.25: a small signal, almost gone.
  UN3 PAPER TAG (never live): 5-day gap -164 pips -> SELL; agree: paper TRADES. Forward day 29, disagree days 6 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 21.
  MB1 PAPER TAG (never live, forward day 13): morning direction written at 12:00, before 13:25.
  Levels: night high 1.09691; Thu evening high 1.09742; night low 1.09427; Thu low 1.08671.
  Rejection-day check: Thursday made neither the 3-day low nor the 3-day high. Not a rejection day. 10-day trend: DOWN (1.09474 vs 05-14 1.14097); the sell is with it.
  SIZE RULE: tracker balance $25,038.83, high-water $25,349.14, drawdown -1.22%; trigger 1 (half size) $24,588.67 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,574.70.
  FRIDAY GATES (list read): A2 alarm 64 / 100; UN3 6 / 30 disagree days; PH2 16 / 60 lively days; night count 17 / 40; up-trend line 10 / 40; MB1 4 / 100 kept
      (early-close lines not reached); +80 pip trades 0 / 15; 80+ pip pre-entry hours 4 / 10; personal stop held 10 of 20 days; next payout date Fri 06-05.
      None due. LAST TRADING DAY OF MAY: the month-end review is written after today's trade, before the next test (coach 05-29), with one process goal for June.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade. The release ends at 22:00 London.
  Worry: a small signal after two rising days. SG says small signals are no worse. Written, not a rule.
  08:00 London Fri: pre-entry hour 1.09260-1.09665 = 40.5 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.09284, near the low of the hour: night with me by 40.7 pips (not counted); entry 22.3 pips worse than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.09684).
  08:15 London: filled SELL 1.09284, stop 1.09684 (40.0 pips). First candle: worst -16.1, close -14.1 pips: a bounce off the hour's low. No call that matters; hands off.
  09:00 London: first hour best +1.6, worst -35.1, last -35.1 pips: four rising candles, closing on its high 4.9 pips from my stop. I expect the stop. Nothing to do: it is where it is. No call.
  10:00 London: STOPPED in the 09:00 London candle (bid high 1.09737, 5.3 pips through my level). Sim balance from the tool $25,389.36. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (bid, from the tool) 1.09589 = 30.5 pips against my entry, 9.5 pips inside the stop; the morning's highest bid was 1.09901, 21.7 pips through my level. Without the stop about -0.76R at noon instead of -1.00R (python): the stop cost about a quarter of an R. MB1 paper (forward day 13), written before 13:25: open 08:00 1.09285, price at 12:00 1.09589 -> morning UP by about 30 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Fri result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: size rule read, no trigger, full size; call and Friday gates
     committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, one trade, nothing after the stop.
     Process: clean.
     All figures from `python bt/daily_numbers.py 474.84 25349.14`, the walk prints, the trade list and python lines.
     Result: sold 1.09284, stop 1.09684 (40.0 pips, risk $124.00), STOPPED 09:01 London @1.09685, -$124.31 = -1.00R.
     Tracker balance $24,914.52 (sim $25,389.36 minus $474.84 paid out), high-water $25,349.14, drawdown -1.71%. Triggers $24,588.67 / $23,574.70: not reached -> full size Monday.
     Funded totals from the log: 46 trades, 24 wins, 22 valid losses, +3.14R (March +0.97R, April +4.17R, May -2.00R in 21 trades: the month is complete).
     WEEK W22: +0.69, -0.45, +0.91, +0.10, -1.00 = +0.24R in 5 trades, +$30.07.
     Against the written number: 1 loss in a row, 3.45R under the equity high (trade list); live maximum 3.69R; normal worst 6 in a row and about 5.9R.
     Price at 12:00 London (stop-day routine): bid 1.09589 = 30.5 pips against my entry, 9.5 pips inside the stop; highest bid 1.09901 (21.7 pips through).
     About -0.76R at noon without the stop: the stop cost about a quarter of an R.
     Paper tags: UN3 agreed, same -1.00R (agree days -1.86R in 23 trades; disagree days +1.42R in 6; n = 6 of 30).
     PH2 (paper, forward day 21): lively (40.5) -> paper half = -0.50R against the live -1.00R. Tally: 21 days, 17 lively (live -3.04R, 8 full-stop mornings),
     4 quiet (+1.06R); PH2 total about -0.46R against A2's -2.00R.
     MB1 (paper, forward day 13; `python bt/morning_box.py 2015-05-30 --check 2015-05-29`): open 08:00 1.09285, open 12:00 1.09590 -> morning +30.5 pips (UP, large);
     the box broke UP -> with -> KEPT: -1.00R. Thirteen forward days: kept 5 (+0.76 and four full stops = -3.24R, DD 4.00R), removed 7 (+8.64R), no break 1.
     Its early-close lines: kept DD above 6R (now 4.00R); net below -3R at 20 kept trades (5 kept so far); average below 0 at 40. Not reached; two more
     kept stops would reach the drawdown line.
     Night count: with me today, not counted (17 trades, +1.63R). 10-day-trend paper line: trend DOWN: 8 trades, -2.75R; trend UP: 10 trades, +0.48R.
     +80 pip trades: none (0 of 15). 80+ pip pre-entry hours: none (4 of 10).
     MAY IS COMPLETE: the month-end review (journal/2015-05-month-end-review.md) is written now, before any new test, as the coach asked.
     END OF RELEASED DATA (clock Fri 05-29 22:00 London).

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

## 05-25 research after funded day 42: idea LD, enter later after a lively pre-entry hour (journal/2015-idea-LD-late-entry-lively.md). Three recent
mornings worked by hand first, declared and dropped; kill lines with a quiet-day control pushed; one run. 08:15 / 08:30 / 09:00 on lively days: 7.57R /
5.70R / 4.78R behind A2, with as many or more full stops. All killed. Side finding: 36 of the 42 lively days are from March on, so "lively against quiet"
is nearly "March-May against January-February"; a reading rule for PH2's first look was added to its file. Counts: 66 ideas, 185 variants.

## 05-26 research after funded day 43 (coach: my single best idea on my lived days only, costs on): MB1 chosen by rule (the only idea of 66 that passed
its kill test), lines and consequences pushed first, one run (journal/2015-MB1-lived-days-check.md). Lived days 03-02..05-26: kept 21 trades at +0.213R
(+0.141R at triple costs) against A2's +0.232R; kept minus removed +0.191R. Two of four lines fail by a hair: the claim "holds on lived days" is dead.
Backtest +0.695R became +0.213R on the days I lived. MB1 stays on paper under its own rules; A2 unchanged. Counts: 66 ideas, 186 variants.

## 05-27 research after funded day 44 (coach's brick: my 10 worst losing trades replayed by eye; valid loss or mistake; change a rule only for a repeated
mistake): journal/2015-ten-worst-losers-replay.md. Selection rule and questions pushed before the charts; ten charts read; every observation then counted
on all 102 A2 days. Result: 10 valid losses, 0 mistakes of mine; six would be the same trade for anyone; 2 pokes. The chart "mistakes" (chasing the hour,
the falling knife) are not losing groups on all history. One repeat without a winner: a pre-entry hour of 60+ pips (4 cases, 0 wins, -3.18R; two of the
ten worst). Four cases: no rule change; a counts-only line, look at 10. Counts: 67 ideas, 186 variants.

## 05-27 research, second part (coach: the replay was study and earns no day; test the blind spot properly): idea BH, no trade after a big pre-entry hour
(journal/2015-idea-BH-big-pre-hour.md). What I already knew stated; kill lines with a sample line and a neighbour line pushed; two days hand-checked; one
run on all 102 days, costs on. At 60+ pips: 4 skipped trades, 0 wins, -3.18R, rule +3.18R above A2 - and KILLED: move the line to 50 pips and the skipped
group wins (+0.115R in 14; the ten mornings at 50-59 pips made +4.79R), and 4 trades is under my sample line of 10. No rule, no tag. A flawed reading rule
of mine logged as P9. Counts: 68 ideas, 189 variants; process mistakes 9.

## 05-28 research after funded day 45 (coach: MFE and MAE of every A2 trade, then one exit idea, kill line first): journal/2015-mfe-mae-study-and-idea-XT.md.
Log of all 103 trades written (journal/mfe-mae-log.csv). Reading: full stops are wrong from the first minute (MFE median 6 pips), winners take 10-20 pips
of heat, +30 almost never comes back, and half the winners make their best price in the last hour. From that last fact one idea: a later exit clock.
Pre-registered, 12:00 version checked against A2, one run: 12:30 / 13:00 / 13:25 keep 93% / 83% / 73% of A2's net, behind in both halves, and trades in
profit at noon get worse with more time. All killed; noon stays. Counts: 69 ideas, 192 variants.

## 05-29 MAY MONTH-END REVIEW written before any new test (journal/2015-05-month-end-review.md): 21 trades, 52% wins, -2.00R, -$252.34 (-0.99%); worst day
-0.50%; deepest drawdown -1.83% (3.69R, inside the written normal range); 21 valid tags, 0 trade mistakes; payouts $349.14 on 05-08 and $0 on 05-22;
6 process mistakes, 5 of one species. June process goal: every number and every test rule gets one worked case before it is pushed (target: 0 corrections
after a push; May had 5).

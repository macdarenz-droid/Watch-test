# Journal - FUNDED ACCOUNT, week of 2015-06-29 (W27). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call until the month-end review on Wed 07-01): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED.
Numbers or rules corrected after a push in June so far: 3 (06-12 a stale paid-out label; 06-17 a wrong label on a test line; 06-18 "85 ideas" for 84; May: 5). One test earns one day; one at a time.
Start of week (from the tool, 06-26): tracker balance $24,711.65 (sim $25,278.69 minus $567.04 paid out), high-water $25,256.94, drawdown -2.16% (4.26R under the equity high, 6 losses in a row). Last week -2.43R. PAYOUT DATE this week: Fri 07-03. Month-end review: Wed 07-01.
SIZE RULE = the real safety rule (coach 06-02): half size from a day's close at or below 3% under the high-water ($24,499.23) until a new high-water; STOP at 7% under ($23,488.95).
WORRY LINES (frozen 06-25, in STATE's gates list): W1 lived average, W2 lived win rate, W3 full-stop share (crossed, reported), W4 drawdown beyond 8.55R or a losing run of 8, W5 fills, W6 a trade mistake.
RG (06-26): the signal's advantage over a coin has been about zero since mid-April and that is not noise. Coach 06-29: "don't change live rules off one test. write
a pre-set rule for what you'd do when the side advantage fades (e.g. a rolling check that cuts size or pauses), backtest it on your history first with a kill
test, then use your lived days as the out-of-sample check. survival first, funded account matters more than any one setup."
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 567.04 25256.94`.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F67 | Mon 06-29 08:00 | sell | 0.31 | 1.10930 | 1.11333 | 1.11334 (stop, 11:55) | -1.00 | -$125.24 | VALID LOSS (valid setup, market disagreed) | after a 158 pip weekend gap down, a 5 pip signal, a 101 pip pre-entry hour (case 5: 0 wins); best +34.1 at 09:00, stopped five minutes before the bell by 8.6 pips, back inside the stop at 12:00 (-0.78R without it); the day closed 125 pips above my sell; PH2 paper half size; UN3 agree; MB1 paper day 34: no break |
| F68 | Tue 06-30 08:00 | buy | 0.31 | 1.11654 | 1.11243 | 1.11852 (12:00 close) | +0.48 | +$61.38 | VALID WIN | flip day against the 10-day trend, the morning after the gap day; FULL size by the size rule read word for word; +35.5 then -31.3 (9.8 pips from the stop) then +41.1, closed by the clock at +19.8; the losing run ends at 7; PH2 paper half size; UN3 DISAGREE (paper skips); MB1 paper day 35: kept, -1.00R -> MB1 CLOSED (kept DD 6.66R); MO paper day 1: MO1 off, MO3 on |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 06-29 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-29`, `./look.sh` or a bar print. Friday's tag stands: VALID LOSS.
  Coach 06-29: see the header. Nothing live changes today.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  Streak against the written numbers (06-24): 6 losses in a row (= lived worst; 95th percentile 7); 4.26R under the high (95th percentile 8.55R). A seventh
      loss is AT the edge of the 95% range; an eighth is worry line W4, written up and sent to the coach the same day.
  D1 (London days): Wed 06-24 close 1.12040 (0.62); Thu 06-25 close 1.12045 (0.69); Fri 06-26 high 1.12197 low 1.11301 close 1.11625 (0.36, range 89.6):
      flat in my morning, down in the afternoon to a new 3-day low, a close in the lower half.
  WEEKEND: Friday's last 1.11625; Sunday's first bar opened 1.10049: a gap DOWN of about 158 pips - by far the largest weekend gap in my history (median
      about 14 pips). Sunday evening low 1.09545; since then back up: last 1.10170, about 145 pips under Friday's close. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar down to 1.11301; 16:00 bar back to 1.11697; Sunday bar 1.10049 -> low 1.09545, close 1.09743; tonight 00:00 bar up to 1.10325, close 1.10146; 04:00 bar 1.09851-1.10276, last 1.10170.
  H1: the night (00:00-07:00 London): open 1.09901, high 1.10325, low 1.09692, last 1.10170: range 63.3 pips (ratio 1.32), net +26.9 pips - a rising night after the gap, against a sell.
  M15: the last candle swung 1.09851-1.10202 (35 pips) and closed where it opened: nervous.
  Bias: SELL. 22:00 London closes: 06-26 1.11625 vs 06-23 1.11677 = -5 pips (3-day gap -5.2). Gap / ADR5 0.05: the smallest kind of signal. Fourth sell. The rule says any gap counts.
      (The price at 08:00 will be about 145 pips under the close the signal was read from. The signal is the 22:00 closes; idea FS.)
  UN3 PAPER TAG (never live): 5-day gap -186 pips (-186.2) -> SELL; agree: paper TRADES. Forward day 50, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 42.
  MB1 PAPER TAG (never live, forward day 34): morning direction written at 12:00, before 13:25. Kept drawdown 5.66R; early-close line 6R.
  Levels: night high 1.10325; Sunday's open 1.10049; night low 1.09692; Sunday's low 1.09545; Friday's close 1.11625 (the gap's upper edge, 145 pips above).
  Rejection-day check: for a sell, Friday made the 3-day low (True) and closed at 0.36, not in the top third. Not a rejection day. 10-day trend: DOWN (1.11625 vs 06-12 1.12648); the sell is WITH it.
  SIZE RULE (the real safety rule): tracker balance $24,711.65, high-water $25,256.94, drawdown -2.16%; trigger 1 (half size) $24,499.23 not reached on a close -> FULL size, 0.31 lots. Trigger 2 (stop) $23,488.95.
      A full stop today leaves about $85 above the line. On a morning like this a stop can be filled worse than 1R (idea DC: a jump day about 3R = 1.5%);
      that would put tonight's close under the line and tomorrow at half size. The rule reads the close; today's size is not cut in advance.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling 150 pips under Friday after a gap that is already being bought back, on a 5 pip signal, on the seventh morning of a losing run, three days
      after a test said my side is a coin's side. Every part of me wants to stand aside. That is exactly the day the rule "no skips" was written for,
      and the coach's instruction is that a pre-set rule comes first and is tested first. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.10106-1.11119 = 101.3 pips -> PH2 paper: LIVELY, paper half size (decided before the order). An 80+ pip pre-entry hour: case 5 of my counts-only line (the four before: 0 wins, -3.18R). Price 1.10933: 76 pips higher than at 07:00, the gap being bought back fast; night against me by 103.2 pips (counted). The count is a count; the rule is the rule. Order: SELL 0.31, stop 40 pips above the bid (1.11333).
  08:15 London: filled SELL 1.10930, stop 1.11333 (40.3 pips from the fill). First candle 1.10732-1.10964, close 1.10792: +13.1 pips. Hands off.
  09:00 London: in profit all hour: best +33.7 (low 1.10583), worst -4.4, last +21.1 pips. Nothing to do. Next look 10:00.
  10:00 London: +34 at 09:00, then the 09:30 candle rose 39 pips: worst -32.8 (high 1.11248, 7.5 pips from the stop), last -26.1. The stop is where it was. Next look 11:00.
  11:00 London: back to my entry: an hour around 1.1093, last -3.1 pips. One hour left; close at 12:00 by the clock.
  12:00 London: STOPPED at 11:55 London, five minutes before the bell: the 11:45 candle went to 1.11409 (8.6 pips through my level) and closed back at 1.11236. Price at 12:00 about 31.6 pips against my entry, INSIDE the stop: without the stop about -0.78R at noon; the stop cost about 0.22R today. (My close order at 12:00 found no position; nothing was traded after the stop.) MB1 paper (forward day 34), written before 13:25: open 08:00 about 1.10933, price at 12:00 about 1.1124 -> morning UP by about 30 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: June goal read before the call; size rule read, no
     trigger, full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, one trade,
     nothing after the stop (the account tool shows no position; the trade list ends with this trade). Process: clean.
     All figures from `python bt/daily_numbers.py 567.04 25256.94`, the walk prints, the trade list and python lines.
     Result: sold 1.10930, stop 1.11333 (40.3 pips from the fill, risk $124.93), STOPPED 11:55 London @1.11334, -$125.24 = -1.00R.
     Best +34.1 pips at 09:00. Stopped five minutes before the bell by 8.6 pips; at 12:00 the price was back inside the stop (about -0.78R without it).
     Then the day went on up: 1.12181 at the end, 125 pips above my sell. The gap of 158 pips was almost closed in a day; I was on the wrong side of that.
     Tracker balance $24,586.41 (sim $25,153.45 minus $567.04 paid out), high-water $25,256.94, drawdown -2.65%: a NEW DEEPEST (was -2.41% on 06-11).
     SIZE RULE after the day (the real safety rule): trigger 1 (half size) $24,499.23 NOT reached on the close -> FULL size tomorrow. It is $87.18 away:
     one more full stop (about $125) puts the close under the line and the day after is traded at HALF size (0.16 lots) until a new high-water.
     I do not cut early and I do not delay it. Trigger 2 (stop trading) $23,488.95.
     Funded totals from the tool: 67 trades, 31 wins, 36 valid losses, +1.32R (March +0.97R, April +4.17R, May -2.00R, June -1.82R in 21 trades).
     AGAINST THE WRITTEN NUMBERS (06-24), as I said on Friday I would read them: SEVEN losses in a row - a new lived worst, and AT the 95th
     percentile of the reshuffled record (7). 5.27R under the equity high (tool) - a new lived maximum (was 4.85R); the median worst is 4.52R, the 95th
     percentile 8.55R. So: the run is at the edge of the normal range, the drawdown is inside it. One more loss is worry line W4 (a run of 8): written
     up and sent to the coach the same day. I do not move that line tonight.
     Lived average +0.14R +-0.23R at 86 lived trades (tool).
     How it feels: bad. Seven. And a morning I did not want to trade, traded, and lost. The loss does not make the wish to skip right: the count of
     80+ pip pre-entry hours is now 5 cases, 0 wins - five, of the ten I said I would look at. I look at ten.
     Paper tags: UN3 agreed, same -1.00R (agree days -4.26R in 39 trades; disagree days +2.01R in 11; n = 11 of 30).
     PH2 (paper, forward day 42): lively (101.3) -> paper half = -0.50R against the live -1.00R. Tally: 42 days, 30 lively (live -3.76R, 14 full-stop
     mornings), 12 quiet (-0.03R, 4 full-stop mornings); PH2 total about -1.90R against A2's -3.81R (Friday's figures plus today's).
     MB1 (paper, forward day 34; `python bt/morning_box.py 2015-06-30 --check 2015-06-29`): open 08:00 1.10931, open 12:00 1.11235 -> morning +30.4 pips (UP, large);
     NO break of the box between 13:25 and 14:30 -> no trade. Thirty-four forward days: kept 11 (-4.90R, DD 5.66R), removed 20 (+12.58R), no break 3.
     Night count: against me by 103.2 pips -> live trade 28 of the count (28 trades, +0.34R). 10-day-trend paper line: trend UP 25 trades, -0.41R; trend DOWN 14 trades, -3.67R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: CASE 5 of 10 (101.3 pips): 0 wins, -4.18R.
     WORRY LINES: W1 lived average +0.14R at 86 (line -0.037R): no. W2 win rate 52%: no. W3: crossed and reported (33% full stops). W4: run 7 (line 8),
     drawdown 5.27R (line 8.55R): NOT crossed, one loss away on the run. W5 fills -0.07R: no. W6: no trade mistake.
     END OF RELEASED DATA (clock Tue 06-30 01:00 London).

- **Tue 06-30 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-30`, `./look.sh`, `python bt/side_monitor.py 2015-06-30 --state` or a bar print. Yesterday's tag stands: VALID LOSS.
  Coach 06-30: MO is good work and keeping it paper-only is right. 7 in a row and the half-size trigger is close: follow the written sizing rule exactly,
      no revenge sizing and no skipping valid setups. Next backtest: the daily and weekly stop rules against my worst historical streaks - breach risk if this continues.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  SIZE RULE, READ WORD FOR WORD (plan section 2): "HALF size (0.16 lots) from a day's CLOSE at or below 3% under the high-water mark, until a new high-water."
      Last close (tool, 06-29): tracker balance $24,586.41. Line: $24,499.23. $24,586.41 is ABOVE the line by $87.18 -> the trigger is NOT on ->
      TODAY IS FULL SIZE, 0.31 lots. Not 0.16 because I am nervous (that would be skipping half a valid setup); not more than 0.31 to get anything back.
      After today's close the same sentence is read again: a close at or under $24,499.23 -> tomorrow 0.16 lots, and it stays 0.16 until a new high-water ($25,256.94).
  Streak against the written numbers (06-24): 7 losses in a row = AT the 95th percentile; 5.27R under the high (95th percentile 8.55R). An eighth loss
      today is worry line W4: written up and sent to the coach today, and trading goes on by the plan.
  D1 (London days): Thu 06-25 close 1.12045 (0.69); Fri 06-26 close 1.11625 (0.36); Mon 06-29 high 1.12783 low 1.09545 close 1.12356 (0.87, range 323.8
      with the weekend gap inside it): opened 158 pips lower, and bought all day to a close 73 pips ABOVE Friday's. The gap is filled and more.
  H4 (UTC bars): Mon 08:00 bar 1.10579-1.11409; 12:00 bar up to 1.12048; 16:00 bar high 1.12783, close 1.12440; 20:00 bar back to 1.12181; tonight 00:00 bar down to 1.11820; 04:00 bar 1.11810-1.12016, last 1.11841.
  H1: the night (00:00-07:00 London): open 1.12159, high 1.12245, low 1.11810, last 1.11841: range 43.5 pips (ratio 0.84), net -31.8 pips - a falling night, AGAINST a buy.
  M15: the last candle fell 14 pips to the night's low.
  Bias: BUY. 22:00 London closes: 06-29 1.12356 vs 06-24 1.12040 = +32 pips (3-day gap +31.6). Gap / ADR5 0.20. FLIP DAY after four sells.
  UN3 PAPER TAG (never live): 5-day gap -105 pips (-104.6) -> SELL; DISAGREE: paper SKIPS. Forward day 51, disagree day 12 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 43.
  MB1 PAPER TAG (never live, forward day 35): morning direction written at 12:00, before 13:25. Kept drawdown 5.66R; early-close line 6R.
  MO PAPER RULE (never live; day 1 of 60): MO1 (40 days) monitor -0.086R -> A2 would be on PAPER today. MO3 (60 days) monitor +0.011R -> A2 as usual.
  Levels: night low 1.11810; Mon 12:00 open about 1.1108; night high 1.12245; Mon high 1.12783.
  Rejection-day check: for a buy, Monday made the 3-day high (True) and closed at 0.87, not in the bottom third. Not a rejection day. 10-day trend: DOWN (1.12356 vs 06-15 1.12826); the buy is AGAINST it (counted).
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: an eighth loss and the half-size line, both one stop away. Neither changes what I do at 08:00. Written, not a rule.
  08:00 London Tue: pre-entry hour 1.11594-1.11989 = 39.5 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.11643: a new low for the night in the hour before the bell; night against me by 51.6 pips (counted); entry 19.8 pips better than at 07:00. Order: BUY 0.31 (FULL size by the size rule), stop 40 pips below the bid (1.11243).
  08:15 London: filled BUY 1.11654, stop 1.11243 (41.1 pips from the fill). First candle 1.11550-1.11790, close 1.11724. Hands off.
  09:00 London: up to 1.12009 (+35.5) in the second candle and back to my entry: last +2.6 pips. Nothing to do. Next look 10:00.
  10:00 London: lower in the second half of the hour: worst -29.6 pips (low 1.11358, 11.5 pips above the stop), last -24.6. The stop is where it was. Next look 11:00.
  11:00 London: a low at 1.11341 (9.8 pips above the stop) at 10:00, then back up: last +20.8 pips (1.11862). One hour left; close at 12:00 by the clock.
  12:00 London: closed by the clock. BUY 1.11654 -> 1.11852 (trade list), +$61.38. Best +41.1 at 11:00, worst -31.3 at 10:00. MB1 paper (forward day 35), written before 13:25: open 08:00 about 1.11643, price at 12:00 about 1.1185 -> morning UP by about 21 pips (large morning) -> only an UP break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Tue result, TAG FIRST: VALID WIN (valid setup, plan followed to the bell). Checked: June goal read before the call; the size rule read word for
     word and applied as written (trigger not on at the last close -> FULL size; no revenge size, no skip, no early half); call committed at 07:00
     London; PH2's range written at 08:00 before the order; BUY 0.31 at 08:00, stop never moved (it held by 9.8 pips at 10:00), closed 12:00, one trade.
     All figures from `python bt/daily_numbers.py 567.04 25256.94`, the walk prints, the trade list and python lines.
     Result: bought 1.11654, stop 1.11243 (41.1 pips from the fill, risk $127.41), closed 12:00 London @1.11852, +$61.38 = +0.48R.
     Best +41.1 pips at 11:00; worst -31.3 at 10:00. The losing run ends at SEVEN. It was 10 pips from being eight.
     Tracker balance $24,647.79 (sim $25,214.83 minus $567.04 paid out), high-water $25,256.94, drawdown -2.41% (deepest -2.65% on 06-29).
     SIZE RULE after the day, the same sentence read again: close $24,647.79 against the line $24,499.23 -> ABOVE by $148.56 -> the trigger is NOT on
     -> FULL size tomorrow, 0.31 lots. Trigger 2 (stop) $23,488.95.
     Funded totals from the tool: 68 trades, 32 wins, 36 valid losses, +1.80R (March +0.97R, April +4.17R, May -2.00R, June -1.34R in 22 trades).
     JUNE IS COMPLETE: 22 trades, 8 wins, -1.34R, -$174.53. The month-end review is written on the first live day of July (Wed 07-01), before any test.
     Against the written numbers: the run ended at 7 (95th percentile 7; W4's line is 8: NOT crossed). 4.79R under the equity high (5.27 - 0.48).
     Lived average +0.15R +-0.23R at 87 lived trades (tool).
     How it feels: relief, and I know what relief is worth: Friday 06-12 felt the same and was followed by five wins and then seven losses.
     Paper tags: UN3 DISAGREED (paper skipped a +0.48R day): disagree days 12 of 30, A2 on them +2.49R (12 trades); agree days -4.26R in 39.
     PH2 (paper, forward day 43): lively (39.5) -> paper half = +0.24R against the live +0.48R. Tally: 43 days, 31 lively (live -3.28R, 14 full-stop
     mornings), 12 quiet (-0.03R, 4 full-stop mornings); PH2 total about -1.66R against A2's -3.33R (yesterday's figures plus today's).
     MB1 (paper, forward day 35; `python bt/morning_box.py 2015-07-01 --check 2015-06-30`): open 08:00 1.11643, open 12:00 1.11853 -> morning +21.0 pips (UP, large);
     the box broke UP -> with -> KEPT: -1.00R. Kept: 12 trades, -5.90R, drawdown 6.66R (5.66 + 1.00).
     MB1 IS CLOSED TODAY BY ITS OWN EARLY-CLOSE LINE, written 05-12: "forward DD of the kept trades above 6R at any time". 6.66R is above 6R. Final
     forward record, 35 days: kept 12 trades -5.90R; removed 20 trades +12.58R; no break 3. The idea that passed its build on 05-12 lost on its
     kept side and won on the side it removed: the opposite of its claim. Closed for good; no MB1 line in the call from tomorrow. Second setups alive: 0.
     MO PAPER RULE (day 1 of 60): MO1 had A2 on paper today (monitor -0.086R): paper R 0.00 against A2's +0.48R. MO3 as usual: +0.48R.
     For tomorrow (tool): MO1 monitor -0.095R -> paper; MO3 monitor +0.078R -> as usual.
     Night count: against me by 51.6 pips -> live trade 29 of the count (29 trades, +0.82R). 10-day-trend paper line: a buy on a trend-DOWN day: trend UP 25 trades, -0.41R; trend DOWN 15 trades, -3.19R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (5 of 10).
     PROCESS MISTAKE P11, FOUND TODAY AND FIXED: when I opened journal/MB1-paper-tag-rules.md to read its early-close line, the file had two lines.
     Since 06-15 my daily append line opened each paper-tag file for writing BEFORE reading it, so every day it wrote only that day's row: the
     rules text and all earlier rows of UN3, PH2 and MB1 were gone from the working files for eleven trading days. Nothing was lost for good (every
     version is in git): I restored the three files from the last good commit (06-12) and re-appended each day's row from its own commit; 94, 89 and
     58 lines again, checked by eye. No gate was missed (the early-close lines were also carried in STATE) and no number was wrong, but for eleven
     days I could not have re-read a paper tag's rules if I had needed to, and I did not notice. Cause: a one-line shortcut never tested. Fix: rows are
     appended with append mode, and the file's line count is printed after every append. June process mistakes: 2 (P10 a missed gate, P11 this).
     END OF RELEASED DATA (clock Wed 07-01 01:00 London).

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 87 | 46 | +12.90 | +0.15 | 5.27R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 51 days, 12 disagree days of 30 | - | A2 on the disagree days +2.49R; on the agree days -4.26R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 43 days, 31 lively days of 60 | - | A2 on the lively days -3.28R (14 full-stop mornings), on the 12 quiet days -0.03R; PH2 about -1.66R vs A2 -3.33R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59) | 06-18 +1.20 (funded 60) | 06-19 -1.00 (funded 61) | 06-22 -1.00 (funded 62) | 06-23 -1.00 (funded 63) | 06-24 -0.13 (funded 64) | 06-25 -0.15 (funded 65) | 06-26 -0.15 (funded 66) | 06-29 -1.00 (funded 67) | 06-30 +0.48 (funded 68).
Loss tags, all live trades: valid loss 54 (-37.42R, from the tool) | my mistake 0. Process mistakes (funded): 11 (P11 06-30).

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 87 | 87 |
| Win rate | 64% | 53% | 53% |
| Avg R | +0.50 | +0.15 | +0.15 |
| +- 2 standard errors | 0.33 | 0.23 | 0.23 |
| Net R | +19.56 | +12.90 | +12.99 |
| Avg win / avg loss | +1.04 / -0.46 | +0.96 / -0.77 | +0.98 / -0.78 |
| Full stops | 3 (8%) | 28 (32%) | 28 (32%) |
| Max drawdown | 1.87R | 5.27R | 5.40R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 46, +0.24 | 46, +0.24 |
| Buys: n, avg R | 15, +0.18 | 41, +0.05 | 41, +0.05 |
Live minus backtest: -0.35R per trade (noise band +-0.40R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.09R. As traded vs engine on the same days: -0.09R over 87 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 87 done, avg +0.15R, max DD 5.27R. Planning edge +0.18R: live is -0.03R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 29 (+0.82R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 25 trades -0.41R; trend DOWN 15 trades -3.19R (look at 40 up-trend trades). MB1 paper: CLOSED 06-30 by its early-close line (kept 12 trades -5.90R, DD 6.66R; removed 20, +12.58R; no break 3; 35 forward days). MO paper rule from 06-30: day 1 of 60 (MO1 0.00R, MO3 +0.48R, A2 +0.48R). +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 5 of 10 (0 wins, -4.18R).
Normal worst, re-read 06-24 (bt/streak_check.py 2015-06-24, all 121 engine A2 trades reshuffled over 82 trades): longest losing run median 4, 95th pct 7; max drawdown median 4.52R, 95th pct 8.55R. Live worst: 7 in a row (06-19 .. 06-29), 5.27R (06-29). Now: 0 in a row (the run ended at 7 on 06-30), 4.79R under the high.

## 06-29 research after funded day 67 (coach: a pre-set rule for when the side advantage fades, backtest first with a kill test, lived days as the
out-of-sample check; survival first): idea MO (journal/2015-idea-MO-side-advantage-monitor.md). Rule (rolling average of the side advantage below zero
-> A2 on paper / half size), three variants, four tests (real history and three worlds built from my own days) and the out-of-sample judging rule pushed
before any code; the rolling function hand-checked; one run. Real history: +1.10R for the 40-day pause (five days off, all June), 0.00R for the
60-day one. Built worlds: alive keeps 96-99% of A2's R; dead halves the drawdown but still loses 19R; switch +11 to +13R. MO1 and MO3 pass all four
lines; the half-size variant fails. NOTHING LIVE: both run on paper from 06-30 and are judged after 60 lived days. The survival rule stays the size
rule. Counts: 93 ideas, 261 variants. June corrections after a push: 3.

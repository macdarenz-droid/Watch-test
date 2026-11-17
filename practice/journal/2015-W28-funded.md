# Journal - FUNDED ACCOUNT, week of 2015-07-06 (W28). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. All times London.
>>> HALF SIZE IS ON (size rule, trigger 1): 0.16 lots = 0.25% = $62.50 a trade, every day, from Mon 07-06 until the tracker balance makes a new high-water (above $25,256.94).
    It came on by the rule on the close of Fri 07-03 ($24,489.07, $10.16 under $24,499.23). Coach 07-06: "that's the system working, not a failure."
JULY PROCESS GOAL (in front of every call): A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
July so far: numbers corrected after a push: 1 (07-03, a unit); file errors found late: 0.
Start of week (from the tool, 07-03): tracker balance $24,489.07 (sim $25,056.11 minus $567.04 paid out), high-water $25,256.94, drawdown -3.04% (6.07R under the equity high). Last week -1.80R.
SIZE RULE: half size until a new high-water ($767.87 away); STOP TRADING at 7% under the high-water ($23,488.95; $1,000.12 away). No payout request while half size is on (next date Fri 07-17).
WORRY LINES (frozen 06-25): W1 lived average, W2 lived win rate, W3 full-stop share (crossed, reported), W4 drawdown beyond 8.55R or a losing run of 8, W5 fills, W6 a trade mistake.
Paper, never live: UN3 (07:00), PH2 (08:00, before the order), MO1 / MO3 monitor (07:00; day 5 of 60 on Monday). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 567.04 25256.94`. R is always result / amount risked, so a half-size stop is still -1.00R (-$62.50).
Coach 07-06: next brick - position sizing math: how the half-size / full-size ladder affects drawdown and recovery time against flat sizing, pre-registered, max 3 variants.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F72 | Mon 07-06 08:00 | sell | 0.16 (HALF) | 1.10556 | 1.10958 | 1.10959 (stop, 09:01) | -1.00 | -$64.48 | VALID LOSS (valid setup, market disagreed) | first half-size day; after a 116 pip weekend gap down; the ask touched the stop by 0.6 pips at 09:01, then the morning fell: best +32.2, +23 at noon (+0.57R without the stop): a poke; PH2 paper half; UN3 agree; MO paper day 5: MO1 off, MO3 on |
| F73 | Tue 07-07 08:00 | buy | 0.16 (rule v3) | 1.10278 | 1.09869 | 1.09868 (stop, 09:24) | -1.00 | -$65.60 | VALID LOSS (valid setup, market disagreed) | a 3 pip flip signal against a 180 pip five-day fall; never 6 pips in profit; stopped in the 09:15 candle, 82 pips against at the worst; at the stop level at noon; size rule v3 written before the call; PH2 paper quiet; UN3 DISAGREE (paper skips); MO paper day 6: both monitors off |
| (paper) | Wed 07-08 08:00 | sell | NO LIVE TRADE (rule alarm) | 1.10146 paper | 1.10546 | paper stop 08:5x | (-1.00 paper) | $0 | NO LIVE TRADE - BY RULE | A2 on paper day 1: stopped by a spike 5.4 pips through, back inside by noon; account flat and unchanged |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 07-06 call, written 07:00 London (06:00 UTC), before the entry bar.** JULY GOAL read first. Figures from `python bt/call_numbers.py 2015-07-06`, `./look.sh`, `python bt/side_monitor.py 2015-07-06 --state` or a bar print. Friday's tag stands: VALID LOSS.
  Coach 07-06: see the header. WD killed properly; half size from Monday by my rule.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  SIZE RULE, read word for word: "HALF size (0.16 lots) from a day's CLOSE at or below 3% under the high-water mark, until a new high-water." The trigger
      came on at Friday's close. The balance ($24,489.07) is not above the high-water ($25,256.94) -> TODAY IS HALF SIZE: 0.16 LOTS. Not 0.31 because
      it is "only ten dollars"; not zero because it is a Monday after a gap. Trigger 2 (stop trading) $23,488.95.
  D1 (London days): Wed 07-01 close 1.10523 (0.08); Thu 07-02 close 1.10832 (0.57); Fri 07-03 high 1.11177 low 1.10650 close 1.11092 (0.84, range 52.7):
      a small day closing near its high. Second higher close.
  WEEKEND: Friday's last 1.11092; Sunday's first bar opened 1.09932: a gap DOWN of about 116 pips - the second big gap in two weekends. Sunday evening
      low 1.09690; since then bought back: last 1.10682, about 41 pips under Friday's close. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar 1.10790-1.11081; 16:00 bar low 1.10650, close 1.11059; Sunday bar 1.09932 -> low 1.09690, close 1.09945; tonight 00:00 bar up to 1.10566, close 1.10363; 04:00 bar 1.10109-1.10880, last 1.10682.
  H1: the night (00:00-07:00 London): open 1.10217, high 1.10880, low 1.09915, last 1.10682: range 96.5 pips (ratio 2.59: a wild night), net +46.5 pips - rising, AGAINST a sell.
  M15: the last two candles rose 60 pips (1.1026 -> 1.1088) and gave 20 back.
  Bias: SELL. 22:00 London closes: 07-03 1.11092 vs 06-30 1.11445 = -35 pips (3-day gap -35.3). Gap / ADR5 0.24. Fourth sell.
  UN3 PAPER TAG (never live): 5-day gap -53 pips (-53.3) -> SELL; agree: paper TRADES. Forward day 55, disagree days 12 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 47.
  MO PAPER RULE (never live; day 5 of 60): MO1 (40 days) monitor -0.227R -> A2 would be on PAPER today. MO3 (60 days) monitor +0.022R -> A2 as usual.
  Levels: night high 1.10880; Fri close 1.11092 (the gap's upper edge); Fri high 1.11177; night low 1.09915; Sunday's low 1.09690.
  Rejection-day check: for a sell, Friday did not make the 3-day low. Not a rejection day. 10-day trend: DOWN (1.11092 vs 06-19 1.13487); the sell is WITH it.
  Plan: SELL 0.16 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: last Monday's picture again - a gap down being bought back, and I sell into it. Last Monday lost. One case. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.10426-1.10743 = 31.7 pips -> PH2 paper: LIVELY, paper half of its own unit (decided before the order). Price 1.10558; night against me by 34.1 pips (counted); entry 12.4 pips worse than at 07:00. Order: SELL 0.16 (HALF size by the size rule), stop 40 pips above the bid (1.10958).
  08:15 London: filled SELL 0.16 @1.10556, stop 1.10958 (40.2 pips from the fill; risk about $64). First candle 1.10448-1.10645, close 1.10499. Hands off.
  09:00 London: rising since the second candle: worst -28.4 (high 1.10830), last -26.8 pips, 11.8 from the stop. The stop is where it was. Next look 10:00.
  10:00 London: STOPPED in the 09:00 London candle: bid high 1.10954, the ask reached my stop at 1.10958 by 0.6 pips; by 09:45 the price was 30 pips lower again (last -7.8 from my entry). Sim balance from the tool $24,991.63. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (walk print) 23.0 pips BELOW my sell: the stop was taken by 0.6 pips at 09:01 and the morning then went my way (best +32.2).
  -> Mon result, TAG FIRST: VALID LOSS (valid setup, market disagreed for one minute; not a mistake). Checked: July goal read before the call; size rule
     read word for word, HALF size 0.16 lots as the rule says; call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.16
     at 08:00, stop never moved, one trade, nothing after the stop. Process: clean.
     All figures from `python bt/daily_numbers.py 567.04 25256.94`, the walk prints, the trade list and python lines.
     Result: sold 0.16 @1.10556, stop 1.10958 (40.2 pips from the fill, risk $64.32), STOPPED 09:01 London @1.10959, -$64.48 = -1.00R.
     The ask touched my stop by 0.6 pips (bid high 1.10954); without the stop the trade was about +0.57R at noon. The stop cost about 1.57R of
     result today - the third poke in six trading days (06-29, 07-01, 07-06). The direction was right again and the money was not made.
     I write the count because it is true, and next to it what I know: CS (close-stop) killed twice, SA (wider and tighter stops) killed, BD's table
     (the stop cost 4.5R and saved 4.9R over 27 stop days). Three pokes in six days is a week, not a test.
     Tracker balance $24,424.59 (sim $24,991.63 minus $567.04 paid out), high-water $25,256.94, drawdown -3.30%: a NEW DEEPEST (was -3.04%).
     SIZE RULE after the day: half size stays ON until a new high-water (above $25,256.94; $832.35 away). Tomorrow 0.16 lots.
     Trigger 2 (stop trading) $23,488.95: $935.64 away = about 14 half-size full stops in a row.
     Funded totals from the tool: 72 trades, 33 wins, 39 valid losses, -0.48R (March +0.97R, April +4.17R, May -2.00R, June -1.34R, July -2.28R in 4).
     The funded account's R total is below zero for the first time. In money: $24,424.59 + $567.04 paid out = $24,991.63, $8.37 under the start.
     Against the written numbers (06-24): 7.07R under the equity high (tool; R counted per trade whatever the size) - a new lived maximum; median worst
     4.52R, 95th percentile 8.55R: inside, and W4's line is 8.55R: two more full stops would cross it. Losing run 2.
     Lived average +0.12R +-0.22R at 91 lived trades (tool).
     WORRY LINES: W1 +0.12R at 91 (line about -0.03R; -0.019R at 100): no. W2 52% (line about 38%): no. W3 crossed, reported (33% full stops).
     W4 drawdown 7.07R (line 8.55R), run 2 (line 8): no. W5 -0.09R: no. W6 none.
     How it feels: the first half-size day, stopped by half a pip, on a morning that then paid. I notice that half size made it easier to watch.
     That is not a reason for half size; it is a note about me.
     Paper tags: UN3 agreed, same -1.00R (agree days -6.54R in 43 trades; disagree days +2.49R in 12; n = 12 of 30).
     PH2 (paper, forward day 47): lively (31.7) -> paper half = -0.50R against the live -1.00R (both in units of a full trade's R). Tally: 47 days,
     33 lively (live -4.20R, 15 full-stop mornings), 14 quiet (-1.39R, 5 full-stop mornings); PH2 total about -3.48R against A2's -5.61R.
     MO PAPER RULE (day 5 of 60): MO1 had A2 on paper (monitor -0.227R): 0.00R today, running 0.00R. MO3 as usual: -1.00R, running -1.80R. A2 running -1.80R.
     For tomorrow (tool): MO1 monitor -0.188R -> paper; MO3 monitor -0.034R -> PAPER too (its first off day).
     Night count: against me by 34.1 pips -> live trade 32 of the count (32 trades, -0.46R). 10-day-trend paper line: trend UP 25 trades, -0.41R; trend DOWN 19 trades, -5.47R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (5 of 10).
     END OF RELEASED DATA (clock Tue 07-07 01:00 London).

- **Tue 07-07 call, written 07:00 London (06:00 UTC), before the entry bar.** JULY GOAL read first. Figures from `python bt/call_numbers.py 2015-07-07`, `./look.sh`, `python bt/side_monitor.py 2015-07-07 --state` or a bar print. Yesterday's tag stands: VALID LOSS.
  Coach 07-07: on LF my own kill lines decide; a switch is written with its start date before the next live day; never back and forth mid-drawdown;
      survival beats income. Then the next backtest: something new about the market, not sizing again.
  SIZE RULE v3, DECIDED AND WRITTEN BEFORE THIS CALL (journal/2015-07-07-size-rule-v3-decision.md), starts today: the size is 0.16 lots ($62.50, 0.25%)
      on every trade, as the base size; it no longer returns to 0.31 at a new high-water; stop trading at 7% under the high-water as before. Today's
      order is the same under the old rule and the new: 0.16 lots.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  D1 (London days): Thu 07-02 close 1.10832 (0.57); Fri 07-03 close 1.11092 (0.84); Mon 07-06 high 1.10954 low 1.09690 close 1.10556 (0.69, range 126.4
      with the gap inside it): opened 116 pips lower, back to 1.1095 in my morning, down to 1.1002, up again: a close 54 pips under Friday's.
  H4 (UTC bars): Mon 08:00 bar 1.10954 / 1.10083; 12:00 bar up to 1.10846; 16:00 bar 1.10912 / 1.10403; 20:00 bar flat; tonight 00:00 bar down to 1.10256; 04:00 bar 1.10272-1.10416, last 1.10414.
  H1: the night (00:00-07:00 London): open 1.10546, high 1.10561, low 1.10256, last 1.10414: range 30.5 pips (ratio 0.70), net -13.2 pips - slightly down, against a buy.
  M15: the last candle rose 11 pips.
  Bias: BUY. 22:00 London closes: 07-06 1.10556 vs 07-01 1.10523 = +3 pips (3-day gap +3.3). Gap / ADR5 0.03: the smallest kind of signal. FLIP DAY after four sells. The rule says any gap counts.
  UN3 PAPER TAG (never live): 5-day gap -180 pips (-180.0) -> SELL; DISAGREE: paper SKIPS. Forward day 56, disagree day 13 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 48.
  MO PAPER RULE (never live; day 6 of 60): MO1 monitor -0.188R -> A2 would be on PAPER today. MO3 monitor -0.034R -> on PAPER too (its first off day).
  Levels: night low 1.10256; Mon low 1.09690; night high 1.10561; Mon high 1.10954.
  Rejection-day check: for a buy, Monday did not make the 3-day high. Not a rejection day. 10-day trend: DOWN (1.10556 vs 06-22 1.13402); the buy is AGAINST it (counted).
  Account: tracker balance $24,424.59, high-water $25,256.94, drawdown -3.30%; stop-trading line $23,488.95 ($935.64 away).
  Plan: BUY 0.16 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: a 3 pip signal against a 180 pip five-day fall; both monitors would have me on paper. Paper lines are paper. Written, not a rule.
  08:00 London Tue: pre-entry hour 1.10180-1.10448 = 26.8 pips -> PH2 paper: QUIET, paper full unit (decided before the order). Price 1.10269: a new low for the night before the bell; night against me by 27.7 pips (counted); entry 14.5 pips better than at 07:00. Order: BUY 0.16 (size rule v3), stop 40 pips below the bid (1.09869).
  08:15 London: filled BUY 0.16 @1.10278, stop 1.09869 (40.9 pips from the fill; risk about $65). First candle 1.10185-1.10328, close 1.10287. Hands off.
  09:00 London: lower candle by candle through 1.1000: worst -29.1 (low 1.09987), last -21.1 pips, 11.8 from the stop. The stop is where it was. Next look 10:00.
  10:00 London: STOPPED in the 09:15 London candle (low 1.09780, 8.9 pips through my level); the price went on down to 1.09610. Never more than 6 pips in profit. Sim balance from the tool $24,926.03. One trade a day: done. I watch to noon only for the stop-day routine.
  12:00 London: price (walk print) 41.7 pips under my entry, at the stop level; morning low 1.09463 (81.6 pips against). Without the stop about -1.02R
  at noon: the stop cost nothing. A real loss.
  -> Tue result, TAG FIRST: VALID LOSS (valid setup, market disagreed; not a mistake). Checked: July goal read before the call; size rule v3 written and
     pushed before the call, 0.16 lots; call committed at 07:00 London; PH2's range written at 08:00 before the order; BUY 0.16 at 08:00, stop never
     moved, one trade, nothing after the stop. Process: clean.
     All figures from `python bt/daily_numbers.py 567.04 25256.94`, the walk prints, the trade list and python lines.
     Result: bought 0.16 @1.10278, stop 1.09869 (40.9 pips from the fill, risk $65.44), STOPPED 09:24 London @1.09868, -$65.60 = -1.00R.
     Never more than 6 pips in profit; the 3 pip signal against a 180 pip five-day fall was wrong all morning.
     Tracker balance $24,358.99 (sim $24,926.03 minus $567.04 paid out), high-water $25,256.94, drawdown -3.56%: a NEW DEEPEST (was -3.30%).
     SIZE (rule v3): 0.16 lots tomorrow, as every day. Stop-trading line $23,488.95: $870.04 away = about 13 full stops in a row at this size.
     Funded totals from the tool: 73 trades, 33 wins, 40 valid losses, -1.48R (March +0.97R, April +4.17R, May -2.00R, June -1.34R, July -3.28R in 5).
     Losing run 3. Drawdown in R as traded: 8.08R under the equity high (tool) - a new lived maximum.
     >>> A GATE, READ TODAY BECAUSE IT IS CROSSED: the old RULE ALARM (plan, written in March; looked at 100 live trades: average >= +0.10R AND max
     drawdown <= 8R). At 92 lived trades: average +0.10R (at the line), max drawdown 8.08R - OVER its 8R line. The look is formally due at 100 trades,
     eight trading days away; the drawdown half cannot un-happen, so I report it NOW rather than in eight days. What it is and is not: the coach's
     rule of 06-02 says "don't decide from the alarm alone ... use the drawdown / breach guard as the real safety rule"; the guard is on and has
     been acted on (half size, then v3). My own newer line W4 (drawdown beyond 8.55R, from the reshuffled record) is NOT crossed: 8.08R. One more
     full stop crosses that too. Live minus backtest is now -0.40R a trade, at the very edge of the noise band (+-0.40R).
     Lived average +0.10R +-0.22R at 92 lived trades (tool).
     WORRY LINES: W1 +0.10R at 92 (line about -0.03R; -0.019R at 100): no. W2 51% (line about 38%): no. W3 crossed, reported (34% full stops).
     W4 drawdown 8.08R (line 8.55R), run 3 (line 8): NOT crossed, one full stop away. W5 -0.06R: no. W6 none.
     How it feels: numb rather than bad. Ten losses in the last twelve trades. I made one real decision today and it was made before the bell, on
     paper, by a line I wrote before I knew the answer. That is the part I can stand behind.
     Paper tags: UN3 DISAGREED (paper skipped a -1.00R day): disagree days 13 of 30, A2 on them +1.49R (13 trades); agree days -6.54R in 43.
     PH2 (paper, forward day 48): quiet (26.8) -> paper full unit, same -1.00R. Tally: 48 days, 33 lively (live -4.20R, 15 full-stop mornings),
     15 quiet (-2.39R, 6 full-stop mornings); PH2 total about -4.48R against A2's -6.61R.
     MO PAPER RULE (day 6 of 60): BOTH monitors had A2 on paper today: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.00R (running -2.80R).
     For tomorrow (tool): MO1 monitor -0.171R -> paper; MO3 monitor -0.048R -> paper.
     Night count: against me by 27.7 pips -> live trade 33 of the count (33 trades, -1.46R). 10-day-trend paper line: a buy on a trend-DOWN day: trend UP 25 trades, -0.41R; trend DOWN 20 trades, -6.47R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (5 of 10).
     END OF RELEASED DATA (clock Wed 07-08 01:00 London).

- **Wed 07-08 call, written 07:00 London (06:00 UTC), before the entry bar.** JULY GOAL read first. Figures from `python bt/call_numbers.py 2015-07-08`, `./look.sh`, `python bt/side_monitor.py 2015-07-08 --state` or a bar print. Yesterday's tag stands: VALID LOSS.
  Coach 07-08: size rule v3 written before the trade was the right way. The 8R drawdown alarm is crossed: report it honestly in the plan and FOLLOW WHAT
      IT SAYS. A2's edge has faded per RG, so the next brick: by eye, the last 30 days on D1 / H4 / H1, three fresh observations about how the market
      moves now, the best one turned into a new setup with 100+ historical cases and a kill test.
  >>> THE RULE ALARM (written March: "if it averages below +0.10R or its drawdown passes 8R, I stop trading the rule for money"): drawdown 8.08R at 92
      lived trades. CROSSED. Decision written and pushed before this call (journal/2015-07-08-rule-alarm-A2-stops-for-money.md):
      A2 IS NOT TRADED FOR MONEY FROM TODAY. IT CONTINUES ON PAPER, call and walk as always. The funded account is flat.
  PAPER call for A2 (paper day 1):
  D1 (London days): Fri 07-03 close 1.11092 (0.84); Mon 07-06 close 1.10556 (0.69); Tue 07-07 high 1.10584 low 1.09163 close 1.10107 (0.66, range 142.1):
      down 140 pips to 1.0916 by the afternoon, then about 100 pips back in the evening. A lower close.
  H4 (UTC bars): Tue 08:00 bar down to 1.09462; 12:00 bar low 1.09163; 16:00 bar up to 1.10517, close 1.10173; tonight 00:00 bar down to 1.09743; 04:00 bar up to 1.10175, last 1.10077.
  H1: the night (00:00-07:00 London): open 1.10045, high 1.10175, low 1.09743, last 1.10077: range 43.2 pips (ratio 1.05), net +3.2 pips - down 30 and back: flat.
  Bias (paper): SELL. 22:00 London closes: 07-07 1.10107 vs 07-02 1.10832 = -72 pips (3-day gap -72.5). Gap / ADR5 0.67. Flip from yesterday's buy.
  UN3 PAPER TAG: 5-day gap -134 pips (-133.8) -> SELL; agree. Forward day 57, disagree days 13 of 30.
  PH2 PAPER TAG: decided at 08:00. Forward day 49.
  MO PAPER RULE (day 7 of 60): MO1 monitor -0.171R -> paper; MO3 monitor -0.048R -> paper. (From today the live rule and both monitors say the same thing.)
  Levels: night high 1.10175; Tue evening high 1.10517; night low 1.09743; Tue low 1.09163.
  10-day trend: DOWN (1.10107 vs 06-23 1.11677); the paper sell is with it.
  PAPER plan: SELL at 08:00 London, stop 40 pips above the bid, close 12:00. No order in the account. The walk is written as on a live day.
  08:00 London Wed (PAPER): pre-entry hour 1.09996-1.10309 = 31.3 pips -> PH2 paper: LIVELY. Price 1.10146; night against the sell by 10.1 pips. PAPER order: SELL at 1.10146, stop 1.10546. NO ORDER IN THE ACCOUNT (rule alarm).
  09:00 London (PAPER): the paper sell is STOPPED in the 08:45 candle (high 1.10590, 5.4 pips through 1.10546). Paper -1.00R. Account untouched: balance from the tool $24,926.03 (sim), no position. I watch to noon for the routine.
  12:00 London (PAPER): price 2.4 pips in the paper sell's favour, back inside the stop: the 08:45 candle's spike was a poke (without the stop about +0.06R).
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE. The rule alarm was crossed and A2 is not traded for money (decision written and pushed before the
     call). That is not a skipped day: a skip is my choice against the plan; this is the plan. Checked: July goal read; alarm report and plan status
     pushed before 07:00; paper call committed before the bell; no order placed; the trade list ends with yesterday's trade (#230); sim balance unchanged.
     PAPER A2, day 1 (engine, `python bt/coin_control.py 2015-07-09 --check 2015-07-08`): sell, stopped 08:5x, -1.00R; the other side -0.11R.
     Account: tracker balance $24,358.99 (sim $24,926.03 minus $567.04 paid out), unchanged; high-water $25,256.94; drawdown -3.56%; FLAT.
     Funded totals unchanged: 73 trades, 33 wins, 40 valid losses, -1.48R. Trade tags: 73 valid, 0 my mistake.
     For the record and without reading anything into one day: the first morning the alarm kept me out was a full stop.
     How it feels: strange to watch the bell without an order. Lighter than I expected, and a little ashamed of being lighter.
     Paper lines (all in units of a full trade's R): A2 PAPER running from 07-08: 1 day, -1.00R.
     UN3 agreed, -1.00R (agree days -7.54R in 44; disagree days +1.49R in 13; n = 13 of 30). PH2 (day 49): lively (31.3) -> half = -0.50R; tally 49 days,
     34 lively (-5.20R, 16 full-stop mornings), 15 quiet (-2.39R, 6); PH2 about -4.98R against A2's -7.61R.
     MO PAPER RULE (day 7 of 60): both monitors had A2 off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.00R (running -3.80R).
     For tomorrow (tool): MO1 -0.235R -> paper; MO3 -0.105R -> paper.
     The counts-only lines of LIVE trades (night-against 33 of 40, 10-day trend, +80 pip trades 3 of 15, 80+ pip pre-entry hours 5 of 10) are FROZEN while
     A2 is on paper: they were defined on live trades. They resume if A2 returns to money; they are not continued on paper trades.
     END OF RELEASED DATA (clock Thu 07-09 01:00 London).

- **Thu 07-09 call, written 07:00 London (06:00 UTC), before the entry bar.** JULY GOAL read first. Figures from `python bt/call_numbers.py 2015-07-09`, `./look.sh`, `python bt/side_monitor.py 2015-07-09 --state` or a bar print. Yesterday: NO LIVE TRADE BY RULE (paper -1.00R).
  Coach 07-09: respecting the alarm was right; a funded trader cannot sit flat forever: the pre-set return-to-live rule with a date BEFORE trading today.
      Then, as the next backtest: not the mirror of PD on the same data; a different behaviour from the 30-day read, cases counted before outcomes, kill lines first.
  >>> RETURN-TO-LIVE RULE written and pushed before this call (journal/2015-07-09-return-to-live-rule.md). Route A: A2 back at 0.16 lots on or after
      Mon 09-21 if the MO monitor has passed its judging lines AND the 40-day monitor is at or above +0.30R that morning. Route B: a new setup after a
      passed pre-registered test AND 40 forward paper trades averaging at least +0.10R with a drawdown of 6R or less AND the coach's agreement.
      Review day: Mon 2015-09-21. TODAY BY THAT RULE: the monitor is -0.235R -> A2 ON PAPER. NO ORDER IN THE ACCOUNT.
  PAPER call for A2 (paper day 2):
  D1 (London days): Mon 07-06 close 1.10556 (0.69); Tue 07-07 close 1.10107 (0.66); Wed 07-08 high 1.10927 low 1.09743 close 1.10758 (0.86, range 118.4):
      up 118 pips from the night's low to a close near the high. A higher close.
  H4 (UTC bars): Wed 08:00 bar 1.10059-1.10602; 12:00 bar up to 1.10927; 16:00 bar 1.10405-1.10861; tonight 00:00 bar 1.10629-1.10802; 04:00 bar up to 1.11146, last 1.10989.
  H1: the night (00:00-07:00 London): open 1.10753, high 1.11146, low 1.10629, last 1.10989: range 51.7 pips (ratio 1.11), net +23.6 pips - rising, against a paper sell.
  Bias (paper): SELL. 22:00 London closes: 07-08 1.10758 vs 07-03 1.11092 = -33 pips (3-day gap -33.4). Gap / ADR5 0.32.
  UN3 PAPER TAG: 5-day gap +24 pips (23.5) -> BUY; DISAGREE: paper SKIPS. Forward day 58, disagree day 14 of 30.
  PH2 PAPER TAG: decided at 08:00. Forward day 50.
  MO PAPER RULE (day 8 of 60): MO1 monitor -0.235R -> paper; MO3 monitor -0.105R -> paper.
  Levels: night high 1.11146; Wed high 1.10927 (already passed in the night); night low 1.10629; Wed low 1.09743.
  10-day trend: DOWN (1.10758 vs 06-24 1.12040); the paper sell is with it.
  PAPER plan: SELL at 08:00 London, stop 40 pips above the bid, close 12:00. No order in the account.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 92 | 47 | +9.62 | +0.10 | 8.08R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 56 days, 13 disagree days of 30 | - | A2 on the disagree days +1.49R; on the agree days -6.54R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 48 days, 33 lively days of 60 | - | A2 on the lively days -4.20R (15 full-stop mornings), on the 15 quiet days -2.39R; PH2 about -4.48R vs A2 -6.61R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59) | 06-18 +1.20 (funded 60) | 06-19 -1.00 (funded 61) | 06-22 -1.00 (funded 62) | 06-23 -1.00 (funded 63) | 06-24 -0.13 (funded 64) | 06-25 -0.15 (funded 65) | 06-26 -0.15 (funded 66) | 06-29 -1.00 (funded 67) | 06-30 +0.48 (funded 68) | 07-01 -1.00 (funded 69) | 07-02 +0.08 (funded 70) | 07-03 -0.36 (funded 71) | 07-06 -1.00 (funded 72, half size) | 07-07 -1.00 (funded 73, 0.16 lots).
Loss tags, all live trades: valid loss 58 (-40.79R, from the tool) | my mistake 0. Process mistakes (funded): 11 (P11 06-30).

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 92 | 92 |
| Win rate | 64% | 51% | 51% |
| Avg R | +0.50 | +0.10 | +0.11 |
| +- 2 standard errors | 0.33 | 0.22 | 0.22 |
| Net R | +19.56 | +9.62 | +9.68 |
| Avg win / avg loss | +1.04 / -0.46 | +0.94 / -0.77 | +0.96 / -0.78 |
| Full stops | 3 (8%) | 31 (34%) | 31 (34%) |
| Max drawdown | 1.87R | 8.08R | 8.21R |
| Worst 10 trades in a row | +0.56R | -4.88R | -4.94R |
| Sells: n, avg R | 24, +0.70 | 50, +0.17 | 50, +0.18 |
| Buys: n, avg R | 15, +0.18 | 42, +0.02 | 42, +0.02 |
Live minus backtest: -0.40R per trade (noise band +-0.40R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.13R. As traded vs engine on the same days: -0.06R over 92 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 92 done, avg +0.10R, max DD 8.08R. Planning edge +0.18R: live is -0.08R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 33 (-1.46R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 25 trades -0.41R; trend DOWN 20 trades -6.47R (look at 40 up-trend trades). MB1: CLOSED 06-30. MO paper rule from 06-30: day 6 of 60 (MO1 0.00R, MO3 -1.80R, A2 -2.80R). +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 5 of 10 (0 wins, -4.18R).
Normal worst, re-read 06-24 (bt/streak_check.py 2015-06-24, all 121 engine A2 trades reshuffled over 82 trades): longest losing run median 4, 95th pct 7; max drawdown median 4.52R, 95th pct 8.55R. Live worst: 7 in a row (06-19 .. 06-29), 8.08R (07-07, now). Now: 3 in a row, 8.08R under the high. SIZE RULE v3: 0.16 lots. The old alarm's 8R drawdown line is crossed (reported 07-07); W4's 8.55R is not.

## 07-06 research after funded day 72 (coach: position sizing math - the half / full ladder against flat sizing, drawdown and recovery time): idea LF
(journal/2015-idea-LF-ladder-against-flat.md). Three policies (ladder, flat full, flat half), lines K1-K5 for the ladder, worked arithmetic and a regression
pushed before the code; regression exact; one run, 2,000 x 500 days from a fresh start and from today's state. The ladder cuts the odds of ending at
my own stop from about 23% to 2% at the planning edge (65% to 18% at +0.10R) for 21% of the income and a longer time under water (121 days against 70).
From today: a new high-water within 60 / 120 / 250 days in 40 / 79 / 96% of runs at +0.18R, median day 70. The ladder fails two of its five lines:
price (79% against 80%) and, the real one, that permanent half size is 16 points safer at a zero edge. Question put to the coach; nothing changes
(and nothing would until the next high-water). Counts: 98 ideas, 276 variants. July corrections after a push: 1.

## 07-07 after funded day 73: (1) BEFORE the call: SIZE RULE v3 decided by my own kill line K5 of idea LF and pushed with its start date (today):
0.16 lots as the base size, no return to 0.31 at a new high-water (journal/2015-07-07-size-rule-v3-decision.md). (2) The old rule alarm's 8R drawdown
line crossed (8.08R), reported the same day. (3) One test about the market (coach: not sizing again): idea WM (journal/2015-idea-WM-where-in-the-day.md):
has the 3-day direction moved to another part of the day? The CO control run for windows 04-08, 12-16, 16-20 against 08-12; kill lines pushed first;
mechanics exact; one run. Second half of the history: -0.02R (my window), +0.05R, -0.12R, -0.21R: all killed. It did not move; it went.
Counts: 99 ideas, 279 variants. July corrections after a push: 1.

## 07-08: (1) BEFORE the call: the rule alarm reported and followed - A2 is not traded for money from today; on paper; the account is flat
(journal/2015-07-08-rule-alarm-A2-stops-for-money.md). (2) The coach's brick: the last 30 days by eye on D1 / H4 / H1, three observations, the best one
("new extremes are rejected") as a setup: fade the first touch of yesterday's high or low (journal/2015-07-08-thirty-days-by-eye-and-idea-PD.md). Sample
counted without outcomes (83 judged cases + 17 in the studied window), a hand-worked case, kill lines K1-K7 pushed before the code; the simulator
matched the hand case; one run. -0.405R / -0.379R / -0.217R a trade; three first touches in four go 30 pips beyond; negative in every part, the
studied 30 days included. KILLED: the observation was wrong. The mirror is not tested on the same history; proposed as a forward-only paper line.
Counts: 100 ideas, 282 variants; second setups tried 13, none alive. July corrections after a push: 1.

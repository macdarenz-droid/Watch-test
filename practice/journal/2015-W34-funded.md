# Week 34 (Mon 2015-08-17 .. Fri 08-21), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. SW1 shadow 6 of 20 (-5.36R), trade 7 open. EN2 forward count waiting. Next payout date Fri 08-28.
Pending this week: MPG's outcome run (pre-registered and counted 08-17 before the call; run after Monday is journaled).

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-17 08:00 | buy | NO LIVE TRADE (monitor -0.342R) | paper | paper | paper clock exit | (-0.32 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 29 |
| (paper) | Tue 08-18 08:00 | sell | NO LIVE TRADE (monitor -0.300R) | paper | paper | paper clock exit | (+0.23 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 30 |
| (paper) | Wed 08-19 08:00 | sell | NO LIVE TRADE (monitor -0.234R) | paper | paper | paper clock exit | (+0.64 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 31 |
| (paper) | Thu 08-20 08:00 | buy | NO LIVE TRADE (monitor -0.196R) | paper | paper | paper clock exit | (+1.01 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 32; SW1 shadow trade 7 clock exit (+0.34R net) |

## Mon 08-17
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-17`:
- 3-day gap +66.3 pips -> A2 side BUY. 5-day gap +143.2 -> UN3 agree. Night 00:00-07:00: 1.10821-1.11051, last 1.10962 (range 23.0, net -8.8).
- Friday's London day: 1.10978-1.11887, close 1.11079 (range 90.9; closed near its low).
- Monitor for today -0.342R (MO1), -0.147R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 7: open (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20). Nothing to do.
- How I feel: fine. Mistake to avoid: running MPG's outcomes before this day is booked.
  08:00 London (PAPER): pre-entry hour 1.10931-1.11122 = 19.1 pips (PH2 quiet: full unit on paper). A2 paper BUY near 1.10973 (engine fixes the fill), paper stop about 1.10573. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +11.6, worst -34.9 (5 pips from the paper stop), last +6.8. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 11 pips against (best +21.2, worst -34.9, last -10.9).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.342R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 29 (engine, `python bt/coin_control.py 2015-08-18 --check 2015-08-17`): buy, clock exit, -0.32R; the other side +0.26R.
     A2 paper running from 07-08: 29 days, -1.33R.
     SW1 SHADOW trade 7: still OPEN (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20); last price 1.10777. Running -5.36R (6 of 20 done).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: a small paper loss. MPG's outcomes can run now that this is written.
     Paper lines: UN3 agreed, -0.32R (agree days -9.81R in 67; disagree +3.43R in 18; day 85). PH2 (day 77): quiet (19.1) -> full = -0.32R;
     47 lively days -8.43R, 21 full-stop mornings; 30 quiet +0.51R; PH2 about -3.70R against A2's -7.94R.
     MO PAPER RULE (day 35 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.32R (running -4.13R).
     For Tuesday (tool): MO1 -0.300R -> paper; MO3 -0.186R -> paper.

## Tue 08-18
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-18`:
- 3-day gap -79.7 pips -> A2 side SELL. 5-day gap +59.2 -> UN3 DISAGREE (disagree day 19 of 30). Night 00:00-07:00: 1.10515-1.10819, last 1.10577 (range 30.4, net -18.5).
- Monday's London day: 1.10588-1.11249, close 1.10777 (range 66.1); it made the 3-day low.
- Monitor for today -0.300R (MO1), -0.186R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- NC1 (provisional, NOT a line yet; coach not asked to start it): for the record only, I note at 08:00 whether the hour ran 15+ pips A2's way.
- SW1 shadow trade 7: open (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20). Nothing to do.
- How I feel: fine.
  08:00 London (PAPER): pre-entry hour 1.10531-1.10746 = 21.5 pips (PH2 quiet: full unit on paper); net about +15 pips UP, i.e. AGAINST the sell (NC1 for the record: no skip; the tool fixes the exact figure). A2 paper SELL near 1.10731 (engine fixes the fill), paper stop about 1.11131. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +9.1, worst -21.7, last -3.4. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 10 pips ahead (best +16.7, worst -21.7, last +9.5).
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.300R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 30 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-19 --check 2015-08-18`): sell, clock exit, +0.23R; the other side -0.29R.
     A2 paper running from 07-08: 30 days, -1.10R.
     NC1, for the record only (not a running line): the hour ran -15.2 pips (against the sell; tool `bt/no_chase_hour.py ... check`): no skip.
     SW1 SHADOW trade 7: still OPEN (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20); last price 1.10216, 14 pips above its stop. Running -5.36R (6 of 20).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: fine. The shadow's stop is close; if it goes tomorrow, SW1 is closed by its own line.
     Paper lines: UN3 DISAGREED (day 86): disagree days +3.66R in 19; agree days -9.81R in 67. PH2 (day 78): quiet (21.5) -> full = +0.23R;
     47 lively days -8.43R, 21 full-stop mornings; 31 quiet +0.74R; PH2 about -3.47R against A2's -7.71R.
     MO PAPER RULE (day 36 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.23R (running -3.90R).
     For Wednesday (tool): MO1 -0.234R -> paper; MO3 -0.163R -> paper.

## Wed 08-19
Coach 08-19: write the kill lines out in full before the results in every report (they are in each pre-registration file already; from now
the report also lists every line with its threshold before the table, and each line's value against it after).
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-19`:
- 3-day gap -127.5 pips -> A2 side SELL. 5-day gap -20.0 -> UN3 agree. Night 00:00-07:00: 1.10256-1.10594, last 1.10581 (range 33.8, net +32.4, against the sell).
- Tuesday's London day: 1.10175-1.10938, close 1.10216 (range 76.3); it made the 3-day low.
- Monitor for today -0.234R (MO1), -0.163R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 shadow trade 7: open (buy 1.11272, stop 1.10072, target 1.13672, clock 12:00 Thu 08-20). The night rose away from its stop. Nothing to do.
- How I feel: fine.
  08:00 London (PAPER): pre-entry hour 1.10558-1.10724 = 16.6 pips (PH2 quiet: full unit on paper). A2 paper SELL near 1.10659 (engine fixes the fill), paper stop about 1.11059. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +15.5, worst -7.6, last +11.5. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 26 pips ahead (best +34.5, worst -7.6, last +25.7).
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.234R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 31 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-20 --check 2015-08-19`): sell, clock exit, +0.64R; the other side -0.70R.
     A2 paper running from 07-08: 31 days, -0.46R.
     SW1 SHADOW trade 7: still OPEN (buy 1.11272, stop 1.10072, target 1.13672); clock exit 12:00 tomorrow. Last price 1.11198. Running -5.36R (6 of 20).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: the paper record is back near zero (-0.46R) and the 40-day monitor has climbed from -0.43R to -0.20R in three weeks. Still far from +0.60R.
     Paper lines: UN3 agreed, +0.64R (agree days -9.17R in 68; disagree +3.66R in 19; day 87). PH2 (day 79): quiet (16.6) -> full = +0.64R;
     47 lively days -8.43R, 21 full-stop mornings; 32 quiet +1.38R; PH2 about -2.83R against A2's -7.07R.
     MO PAPER RULE (day 37 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.64R (running -3.26R).
     For Thursday (tool): MO1 -0.196R -> paper; MO3 -0.173R -> paper.

## Thu 08-20
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-20`:
- 3-day gap +11.9 pips -> A2 side BUY. 5-day gap -37.6 -> UN3 DISAGREE (disagree day 20 of 30). Night 00:00-07:00: 1.11147-1.11484, last 1.11272 (range 33.7, net +11.7).
- Wednesday's London day: 1.10178-1.11342, close 1.11198 (range 116.4); it made the 3-day high.
- Monitor for today -0.196R (MO1), -0.173R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 shadow trade 7: open (buy 1.11272, stop 1.10072, target 1.13672); its clock exit is 12:00 today. Not managed.
- How I feel: fine.
  08:00 London (PAPER): pre-entry hour 1.11189-1.11378 = 18.9 pips (PH2 quiet: full unit on paper). A2 paper BUY near 1.11351 (engine fixes the fill), paper stop about 1.10951. SW1 shadow untouched (clock exit at noon). No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +9.5, worst -27.9, last +7.4. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 41 pips ahead (best +41.9, worst -27.9, last +41.5).
  -> Thu result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.196R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 32 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-21 --check 2015-08-20`): buy, clock exit, +1.01R; the other side -1.00R (stopped).
     A2 paper running from 07-08: 32 days, +0.55R. The paper record is above zero for the first time since the alarm.
     SW1 SHADOW trade 7 (tool `bt/sw1_shadow.py 2015-08-21`): buy 1.11272 (Thu 08-13) -> CLOCK EXIT 1.11765 at 12:00 Thu 08-20, +0.40R, 7 nights,
     financing -0.058R, net +0.34R. Its first winner. Running -5.02R after 7 of 20 (max DD 5.36R; early-close line 6R). Next entry Fri 08:00:
     Thu close 1.12400 vs 08-06 close 1.09240 = +316.0 pips -> BUY.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: A2's paper line crossed zero today. Not a signal: the gate is the 40-day monitor at +0.60R (today -0.139R), not a running total.
     Paper lines: UN3 DISAGREED (day 88): disagree days +4.67R in 20; agree days -9.17R in 68. PH2 (day 80): quiet (18.9) -> full = +1.01R;
     47 lively days -8.43R, 21 full-stop mornings; 33 quiet +2.39R; PH2 about -1.82R against A2's -6.06R.
     MO PAPER RULE (day 38 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +1.01R (running -2.25R).
     For Friday (tool): MO1 -0.139R -> paper; MO3 -0.144R -> paper.

## Forward tally

## 08-17 test: idea MPG, the moving-average pullback with a count grid (journal/2015-idea-MPG-moving-average-pullback-counted.md)
Pre-registered and counted before the call; outcome run after the day was journaled. MPG1 145 trades +0.011R, stressed -0.092R: killed.
Dose line (steep trends, 41 trades) +0.399R: a hint, not promoted. Ideas 137, variants 367.

## 08-17 evening: replay of week 17 + idea NC (journal/2015-08-17-replay-week-17-and-idea-NC.md)
Worst week: 5 valid trades, -3.07R; the full stops followed a pre-bell hour that had already run A2's way. NC1 (skip those days, X 15) PASSES
all four lines (gap +0.306R, p 0.068) - provisional and fragile: without the inspiring week gap +0.259R, p 0.11; dose the wrong way.
Forward count only with the coach's word. Ideas 138, variants 370.

## 08-18 test: idea UD, the 13:30 London candle (journal/2015-idea-UD-the-1330-candle.md)
R after costs (1.0 + 0.1 pips). Follow: 123 trades -0.130R; fade control -0.083R. Killed on all four lines. Ideas 139, variants 373.

## 08-19 test: idea TH, three hourly candles in a row (journal/2015-idea-TH-three-hours-in-a-row.md)
R after costs (1.0 + 0.1). Following a 35+ pip three-hour run: 167 trades -0.264R, both periods; bigger runs worse. Fade +0.000R. Killed.
Ideas 140, variants 376.

## 08-20 test: idea MG, the round-number magnet (journal/2015-idea-MG-round-number-magnet.md)
R after costs (1.0 + 0.1). Toward the nearer 00 level: 81 trades -0.067R; away from it -0.065R; the same trade. Killed. Ideas 141, variants 379.

# Journal - FUNDED ACCOUNT, week of 2015-06-15 (W25). Plan: journal/PLAN-v2-funded-one-page.md. Tracker: journal/FUNDED-TRACKER.md. Size 0.50% = $125 = 0.31 lots. All times London.
JUNE PROCESS GOAL (in front of every call): EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED. No figure without a tool print or a
python line behind it. Numbers or rules corrected after a push in June so far: 2 (06-12: a stale paid-out label in STATE; 06-17: a wrong label on a test line; May: 5). One test earns one day; one at a time (coach 06-04).
Start of week (from the tool, 06-12): tracker balance $24,777.93 (sim $25,321.47 minus $543.54 paid out), high-water $25,280.44, drawdown -1.99% (4.00R under the equity high). Last week -2.29R. PAYOUT DATE this week: Fri 06-19 (rule applied exactly as written).
SIZE RULE = the real safety rule (coach 06-02): half size from a day's close at or below 3% under the high-water ($24,522.03) until a new high-water; STOP at 7% under ($23,510.81; reviewed and kept 06-11).
A2 is judged on a few hundred lived trades, not on the alarm alone. Lived average +0.18R +-0.25R at 75 lived trades.
Paper tags, never live: UN3 (07:00), PH2 (08:00, before the order), MB1 (12:00, before 13:25). Counts-only: night-against, 10-day trend, +80 pip trades (GB1, judged at 15), 80+ pip pre-entry hours.
Bookkeeping command this week: `python bt/daily_numbers.py 543.54 25280.44`.
Coach 06-15: enough forward re-tests of killed ideas (LK is dead twice). Next test: something new from my own notes - 3 fresh hypotheses about how my best A2 days START, pick the strongest, prereg with a kill line, max 3 variants.

## Funded trades
| F# | Entry (London) | Side | Lots | Entry | Stop | Exit | R | $ | Tag | Note |
|---|---|---|---|---|---|---|---|---|---|---|
| F57 | Mon 06-15 08:00 | sell | 0.31 | 1.12277 | 1.12678 | 1.12183 (12:00 close) | +0.23 | +$29.14 | VALID WIN | very small signal against the 10-day trend, after a weekend gap down; -34.0 pips at 09:00 (6 from the stop), best +19.8, closed by the clock at +9.4; PH2 paper lively, half size; UN3 DISAGREE (paper skips); MB1 paper day 24: removed, +1.28R |
| F58 | Tue 06-16 08:00 | sell | 0.31 | 1.13153 | 1.13553 | 1.12514 (12:00 close) | +1.60 | +$198.09 | VALID WIN | sold into a 40 pip spike up in the last candle before the bell (night against me by 38.8 pips, 59 pip pre-entry hour, against the 10-day trend); -15.5 at the worst, best +75.1, closed by the clock at +63.9; PH2 paper half size; UN3 agree; MB1 paper day 25: kept, -1.00R |
| F59 | Wed 06-17 08:00 | sell | 0.31 | 1.12592 | 1.12992 | 1.12536 (12:00 close) | +0.14 | +$17.36 | VALID WIN | a 10 pip signal; -34.0 pips at 09:00 (6 from the stop), under water most of the morning, closed by the clock at +5.6; the evening rose 110 pips above my sell (flat since noon); PH2 paper quiet, full size; UN3 agree; MB1 paper day 26: no break |

## Daily calls - each written at 07:00 London and committed before the entry bar; then a note before every advance

- **Mon 06-15 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-15`, `./look.sh` or a bar print. Friday's tag stands: VALID WIN.
  Coach 06-15: see the header. Nothing live changes.
  D1 (London days): Wed 06-10 close 1.13237 (0.50); Thu 06-11 close 1.12573 (0.50); Fri 06-12 high 1.12965 low 1.11512 close 1.12648 (0.78, range 145.3):
      a new 3-day low in my morning, then all of it bought back and a close near the top. A slightly higher close than Thursday's.
  Weekend: Friday's last 1.12648; Sunday's first bar opened 1.12102: a gap DOWN of about 55 pips. Not in the 22:00 closes, so not in my signal.
  H4 (UTC bars): Fri 12:00 bar 1.11974 -> 1.12965, close 1.12773; 16:00 bar back to 1.12541; Sunday bar 1.12086-1.12310; tonight 00:00 bar down to 1.11949, close 1.12172; 04:00 bar down to 1.11891, last 1.11922.
  H1: the night (00:00-07:00 London): open 1.12270, high 1.12283, low 1.11891, last 1.11922: range 39.2 pips (ratio 0.80), net -34.8 pips - a falling night, WITH a sell.
  M15: four falling candles since 06:00 London; the last one closes on the night's low (1.11891).
  Bias: SELL. 22:00 London closes: 06-12 1.12648 vs 06-09 1.12822 = -17 pips (3-day gap -17.4). Gap / ADR5 0.11: a very small signal.
  UN3 PAPER TAG (never live): 5-day gap +152 pips (152.4) -> BUY; DISAGREE: paper SKIPS. Forward day 40, disagree day 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 32.
  MB1 PAPER TAG (never live, forward day 24): morning direction written at 12:00, before 13:25.
  Levels: night low 1.11891; Fri low 1.11512; night high 1.12283; Fri close 1.12648 (the gap's upper edge); Fri high 1.12965.
  Rejection-day check: for a sell, Friday made the 3-day low (True) AND closed at 0.78, in the top third: a REJECTION day by my old note. Written, not a rule: A2 has no skips.
  10-day trend: UP (1.12648 vs 05-29 1.09831); the sell is AGAINST it (counted).
  SIZE RULE (the real safety rule): tracker balance $24,777.93, high-water $25,280.44, drawdown -1.99%; trigger 1 (half size) $24,522.03 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,510.81.
  One win behind me after five losses. Same size, same rules; Friday changes nothing.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling after a weekend gap down and a falling night, on a very small signal. Written, not a rule.
  08:00 London Mon: pre-entry hour 1.11902-1.12350 = 44.8 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.12278: the hour took back the whole falling night (last candle 1.11947-1.12350); night against me by 0.8 pips (counted); entry 35.6 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.12678).
  08:15 London: filled SELL 1.12277, stop 1.12678 (40.1 pips from the fill). First candle up to 1.12461, close 1.12417: -14.9 pips, worst -19.3. Hands off.
  09:00 London: an hour of going nowhere above my entry: worst -21.7 pips (high 1.12484), best +3.8, last -7.3. Still in. Next look 10:00.
  10:00 London: the 09:00 candle went to 1.12607, 34.0 pips against me and 6.1 pips (bid) from the stop, then back: last -10.9. Under water all hour. The stop is where it was. Next look 11:00.
  11:00 London: a slow slide back through my entry: best +14.6, last +10.3 pips. One hour left; I close at 12:00 by the clock.
  12:00 London: closed by the clock. SELL 1.12277 -> 1.12183 (trade list), +$29.14. MB1 paper (forward day 24), written before 13:25: open 08:00 about 1.12278, price at 12:00 about 1.1218 -> morning DOWN by about 10 pips (small morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Mon result, TAG FIRST: VALID WIN (valid setup, plan followed to the bell). Checked: June goal read before the call; size rule read, no trigger, full
     size; call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade.
     All figures from `python bt/daily_numbers.py 543.54 25280.44`, the walk prints, the trade list and python lines.
     Result: sold 1.12277, stop 1.12678 (40.1 pips from the fill, risk $124.31), closed 12:00 London @1.12183, +$29.14 = +0.23R.
     The honest part: at 09:00 London the price was 34.0 pips against me, 6.1 pips (bid) from the stop. A small win that was nearly a full loss.
     Best +19.8 pips. After noon the price rose 57 pips (1.12753 at the end of the day): the noon clock again.
     Tracker balance $24,807.07 (sim $25,350.61 minus $543.54 paid out), high-water $25,280.44, drawdown -1.87%.
     SIZE RULE after the day: trigger 1 (half size) $24,522.03 NOT reached -> FULL size tomorrow; $285.04 away. Trigger 2 $23,510.81.
     Funded totals from the tool: 57 trades, 28 wins, 29 valid losses, +2.83R (March +0.97R, April +4.17R, May -2.00R, June -0.32R in 11 trades).
     Drawdown in R: 3.77R under the equity high (4.00 - 0.23). Lived average +0.18R +-0.25R at 76 lived trades (tool).
     How it feels: calm. Two wins that both sat within 11 pips of the stop: I notice that I count them as "back on track" and they are not evidence.
     Paper tags: UN3 DISAGREED (paper skipped +0.23R): disagree days 11 of 30, A2 on them +2.01R (11 trades); agree days -2.77R in 29.
     PH2 (paper, forward day 32): lively (44.8) -> paper half = +0.12R against the live +0.23R. Tally: 32 days, 26 lively (live -3.21R, 12 full-stop
     mornings), 6 quiet (+0.91R); PH2 total about -0.68R against A2's -2.32R (Friday's figures plus today's).
     MB1 (paper, forward day 24; `python bt/morning_box.py 2015-06-16 --check 2015-06-15`): open 08:00 1.12278, open 12:00 1.12172 -> morning -10.6 pips (DOWN, small);
     the box broke UP -> against -> REMOVED: +1.28R. Twenty-four forward days: kept 9 (-3.87R, DD 4.63R), removed 14 (+10.77R), no break 1.
     Night count: against me by 0.8 pips -> live trade 22 of the count (22 trades, +1.73R). 10-day-trend paper line: trend UP 19 trades, -0.35R; trend DOWN 10 trades, -2.24R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (4 of 10).
     END OF RELEASED DATA (clock Tue 06-16 01:00 London).

- **Tue 06-16 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-16`, `./look.sh` or a bar print. Yesterday's tag stands: VALID WIN.
  Coach 06-16: BS was an honest kill; the by-product matters: if a few best days carry most of my R, my job is never to miss them. Next test: what would
      make me skip or exit early on one of those days? Check that none of my current rules cuts them.
  D1 (London days): Thu 06-11 close 1.12573 (0.50); Fri 06-12 close 1.12648 (0.78); Mon 06-15 high 1.12944 low 1.11891 close 1.12826 (0.89, range 105.3):
      down in my morning, then bought all afternoon to a close near the high. Third higher close in a row, each inside last Wednesday's range.
  H4 (UTC bars): Mon 08:00 bar 1.12341 -> 1.12113; 12:00 bar up to 1.12658; 16:00 bar high 1.12944, close 1.12834; tonight 00:00 bar 1.12622-1.12797; 04:00 bar 1.12681-1.12831, last 1.12797.
  H1: the night (00:00-07:00 London): open 1.12765, high 1.12831, low 1.12622, last 1.12797: range 20.9 pips (ratio 0.43: a dead night), net +3.2 pips - flat.
  M15: 1.1268-1.1282 for two hours.
  Bias: SELL. 22:00 London closes: 06-15 1.12826 vs 06-10 1.13237 = -41 pips (3-day gap -41.1). Gap / ADR5 0.31. Third sell in a row.
  UN3 PAPER TAG (never live): 5-day gap -8 pips (-8.0) -> SELL; agree: paper TRADES. Forward day 41, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 33.
  MB1 PAPER TAG (never live, forward day 25): morning direction written at 12:00, before 13:25.
  Levels: night high 1.12831; Mon high 1.12944; Fri high 1.12965; night low 1.12622; Mon low 1.11891.
  Rejection-day check: for a sell, Monday did not make the 3-day low. Not a rejection day. Monday closed at 0.89, against a sell (the "closed against me" group, which earned more than average in RV).
  10-day trend: UP (1.12826 vs 06-01 1.09259); the sell is AGAINST it (counted).
  SIZE RULE (the real safety rule): tracker balance $24,807.07, high-water $25,280.44, drawdown -1.87%; trigger 1 (half size) $24,522.03 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,510.81.
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: selling under a double top (Fri and Mon highs) after an afternoon that bought everything back; a dead night says nothing. Written, not a rule.
  08:00 London Tue: pre-entry hour 1.12591-1.13184 = 59.3 pips -> PH2 paper: LIVELY, paper half size (decided before the order). Price 1.13153: the last candle before the bell jumped 40 pips UP through Monday's and Friday's highs; night against me by 38.8 pips (counted); entry 35.6 pips better than at 07:00. Selling into a spike feels wrong and is the rule. Order: SELL 0.31, stop 40 pips above the bid (1.13553).
  08:15 London: filled SELL 1.13153, stop 1.13553 (40.0 pips from the fill). First candle 1.13047-1.13298, close 1.13166: -2.3 pips, worst -15.5. Hands off.
  09:00 London: the spike came straight back: best +36.0 pips in the 08:30 candle (low 1.12783), last +23.0. Nothing to do. Next look 10:00.
  10:00 London: down through the night low (1.12622): best +60.2, last +57.3 pips, the hour closing near its low. Not at +80. The plan is the noon clock; the urge to bank is noted and LK2 answered it on Friday. Next look 11:00.
  11:00 London: lower step by step: best +75.1 pips (low 1.12392), last +62.7. Still under +80: no trail case yet; if it gets there the count takes it, the trade does not change. One hour left; close at 12:00 by the clock.
  12:00 London: closed by the clock. SELL 1.13153 -> 1.12514 (trade list), +$198.09. Best +75.1, never +80. MB1 paper (forward day 25), written before 13:25: open 08:00 about 1.13153, price at 12:00 about 1.1250 -> morning DOWN by about 65 pips (large morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Tue result, TAG FIRST: VALID WIN (valid setup, plan followed to the bell). Checked: June goal read before the call; size rule read, no trigger, full
     size; call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved, closed 12:00, one trade.
     All figures from `python bt/daily_numbers.py 543.54 25280.44`, the walk prints, the trade list and python lines.
     Result: sold 1.13153, stop 1.13553 (40.0 pips, risk $124.00), closed 12:00 London @1.12514, +$198.09 = +1.60R. Worst -15.5 pips in the first candle.
     The start, for the coach's question: a 40 pip spike AGAINST me in the last candle before the bell, a night against me by 38.8 pips, a 59 pip
     pre-entry hour, a sell against the 10-day trend, and my own worry line. Every one of those is a reason I have once wanted to skip for. +1.60R.
     Best +75.1 pips: under +80, not a case for the trail count (3 of 15).
     Tracker balance $25,005.16 (sim $25,548.70 minus $543.54 paid out), high-water $25,280.44, drawdown -1.09%.
     SIZE RULE after the day: trigger 1 (half size) $24,522.03 NOT reached -> FULL size tomorrow; $483.13 away. Trigger 2 $23,510.81.
     Funded totals from the tool: 58 trades, 29 wins, 29 valid losses, +4.42R (March +0.97R, April +4.17R, May -2.00R, June +1.28R in 12 trades).
     Drawdown in R: 2.17R under the equity high (3.77 - 1.60). Lived average +0.20R +-0.25R at 77 lived trades (tool).
     "Don't let a big win change your size": 0.31 lots tomorrow, as today. How it feels: good, and I distrust it as much as last Thursday's heaviness.
     Paper tags: UN3 agreed, same +1.60R (agree days -1.17R in 30 trades; disagree days +2.01R in 11; n = 11 of 30).
     PH2 (paper, forward day 33): lively (59.3) -> paper half = +0.80R against the live +1.60R. Tally: 33 days, 27 lively (live -1.61R, 12 full-stop
     mornings), 6 quiet (+0.91R); PH2 total about +0.12R against A2's -0.72R (yesterday's figures plus today's).
     MB1 (paper, forward day 25; `python bt/morning_box.py 2015-06-17 --check 2015-06-16`): open 08:00 1.13154, open 12:00 1.12503 -> morning -65.1 pips (DOWN, large);
     the box broke DOWN -> with -> KEPT: -1.00R. Twenty-five forward days: kept 10 (-4.87R, DD 5.63R = 4.63 + 1.00), removed 14 (+10.77R), no break 1.
     Its early-close lines: kept DD above 6R (now 5.63R: one more kept stop closes it); net below -3R at 20 kept (10 kept, -4.87R); average below 0 at 40.
     Night count: against me by 38.8 pips -> live trade 23 of the count (23 trades, +3.33R). 10-day-trend paper line: trend UP 20 trades, +1.25R; trend DOWN 10 trades, -2.24R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (59.3; 4 of 10).
     END OF RELEASED DATA (clock Wed 06-17 01:00 London).

- **Wed 06-17 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-17`, `./look.sh` or a bar print. Yesterday's tag stands: VALID WIN.
  Coach 06-17: good audit, rules are clean. Next brick: trading plan v2 on one page (A2 rules, size rule, daily stop, payout rule, what I never do), then
      one test of position sizing math: what risk per trade gives the best growth while keeping breach odds tiny over 2 years.
  Plan line read (BD): 15 days of 116 made the profit; the only way to lose them is not to trade the day or not to hold it to 12:00.
  D1 (London days): Fri 06-12 close 1.12648 (0.78); Mon 06-15 close 1.12826 (0.89); Tue 06-16 high 1.13298 low 1.12048 close 1.12471 (0.34, range 125.0):
      a new 3-day high in the first minutes of London, then 125 pips down and a close in the lower half. A lower close after three higher ones.
  H4 (UTC bars): Tue 08:00 bar 1.12914 -> 1.12331; 12:00 bar low 1.12048, close 1.12367; 16:00 and 20:00 bars flat around 1.1240; tonight 00:00 bar up to 1.12670; 04:00 bar back to 1.12455, last 1.12479.
  H1: the night (00:00-07:00 London): open 1.12465, high 1.12670, low 1.12385, last 1.12479: range 28.5 pips (ratio 0.74), net +1.4 pips - up 20 and back: flat.
  M15: the last candle fell 10 pips to 1.12455.
  Bias: SELL. 22:00 London closes: 06-16 1.12471 vs 06-11 1.12573 = -10 pips (3-day gap -10.2). Gap / ADR5 0.08: a very small signal. Fourth sell in a row.
  UN3 PAPER TAG (never live): 5-day gap -35 pips (-35.1) -> SELL; agree: paper TRADES. Forward day 42, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 34.
  MB1 PAPER TAG (never live, forward day 26): morning direction written at 12:00, before 13:25. Its kept drawdown is 5.63R; the early-close line is 6R.
  Levels: night low 1.12385; Tue low 1.12048; night high 1.12670; Tue high 1.13298.
  Rejection-day check: for a sell, Tuesday did not make the 3-day low. Not a rejection day. 10-day trend: UP (1.12471 vs 06-02 1.11504); the sell is AGAINST it (counted).
  SIZE RULE (the real safety rule): tracker balance $25,005.16, high-water $25,280.44, drawdown -1.09%; trigger 1 (half size) $24,522.03 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,510.81.
  Three wins behind me; the size is 0.31 lots as on every day ("don't let a big win change your size").
  Plan: SELL 0.31 at 08:00 London, stop 40 pips above the bid, never moved, close 12:00. One trade.
  Worry: a 10 pip signal after three wins; nothing in it that I can use. Written, not a rule.
  08:00 London Wed: pre-entry hour 1.12415-1.12649 = 23.4 pips -> PH2 paper: QUIET, paper full size (decided before the order). Price 1.12592; night against me by 12.7 pips (counted); entry 11.3 pips better than at 07:00. Order: SELL 0.31, stop 40 pips above the bid (1.12992).
  08:15 London: filled SELL 1.12592, stop 1.12992 (40.0 pips). First candle up to 1.12780, close 1.12667: -8.5 pips, worst -19.8. Hands off.
  09:00 London: a 20 pip band above my entry all hour: best +3.3, worst -19.8, last -11.8 pips. Still in. Next look 10:00.
  10:00 London: the 09:00 candle went to 1.12922: 34.0 pips against me, 6.0 pips (bid) from the stop; then all the way back: last -3.9. The stop is where it was. Next look 11:00.
  11:00 London: sideways 5 to 19 pips under water; last -7.2. One hour left; close at 12:00 by the clock.
  12:00 London: closed by the clock. SELL 1.12592 -> 1.12536 (trade list), +$17.36. MB1 paper (forward day 26), written before 13:25: open 08:00 about 1.12592, price at 12:00 about 1.1253 -> morning DOWN by about 6 pips (small morning) -> only a DOWN break of the 12:00-13:25 box counts. Exact figures from the tool afterwards.
  -> Wed result, TAG FIRST: VALID WIN (valid setup, plan followed to the bell; a scratch in size). Checked: June goal read before the call; size rule
     read, no trigger, full size; call committed at 07:00 London; PH2's range written at 08:00 before the order; SELL 0.31 at 08:00, stop never moved,
     closed 12:00, one trade. All figures from `python bt/daily_numbers.py 543.54 25280.44`, the walk prints, the trade list and python lines.
     Result: sold 1.12592, stop 1.12992 (40.0 pips, risk $124.00), closed 12:00 London @1.12536, +$17.36 = +0.14R.
     The honest part: at 09:00 London 34.0 pips against me, 6.0 pips (bid) from the stop. Third day in four that the stop held by 6 to 11 pips.
     After the bell: the price ended the day at 1.13631, about 110 pips ABOVE my sell. Flat at noon is why that evening is not in my account.
     Tracker balance $25,022.52 (sim $25,566.06 minus $543.54 paid out), high-water $25,280.44, drawdown -1.02%.
     SIZE RULE after the day: trigger 1 (half size) $24,522.03 NOT reached -> FULL size tomorrow; $500.49 away. Trigger 2 $23,510.81.
     Funded totals from the tool: 59 trades, 30 wins, 29 valid losses, +4.56R (March +0.97R, April +4.17R, May -2.00R, June +1.42R in 13 trades).
     Drawdown in R: 2.03R under the equity high (2.17 - 0.14). Lived average +0.20R +-0.24R at 78 lived trades (tool).
     How it feels: flat. Four wins in a row, three of them a few pips from being losses; the count of wins says less than it seems to.
     Paper tags: UN3 agreed, same +0.14R (agree days -1.03R in 31 trades; disagree days +2.01R in 11; n = 11 of 30).
     PH2 (paper, forward day 34): quiet (23.4) -> paper full size, same +0.14R. Tally: 34 days, 27 lively (live -1.61R, 12 full-stop mornings),
     7 quiet (+1.05R); PH2 total about +0.26R against A2's -0.58R (yesterday's figures plus today's).
     MB1 (paper, forward day 26; `python bt/morning_box.py 2015-06-18 --check 2015-06-17`): open 08:00 1.12593, open 12:00 1.12525 -> morning -6.8 pips (DOWN, small);
     NO break of the box between 13:25 and 14:30 -> no trade. Twenty-six forward days: kept 10 (-4.87R, DD 5.63R), removed 14 (+10.77R), no break 2.
     Night count: against me by 12.7 pips -> live trade 24 of the count (24 trades, +3.47R). 10-day-trend paper line: trend UP 21 trades, +1.39R; trend DOWN 10 trades, -2.24R.
     +80 pip trades: none (3 of 15). 80+ pip pre-entry hours: none (4 of 10).
     END OF RELEASED DATA (clock Thu 06-18 01:00 London).

- **Thu 06-18 call, written 07:00 London (06:00 UTC), before the entry bar.** June goal read first: every figure below is from `python bt/call_numbers.py 2015-06-18`, `./look.sh` or a bar print. Yesterday's tag stands: VALID WIN.
  Coach 06-18: plan v2 and SG done properly, keep 0.50%. Next brick: replay my worst week (week 24, the 5-loss run) by eye on the charts, write what a
      better trader would have done each day, and only turn it into a test if a mistake repeats.
  Plan line read (BD): the only way to lose the best days is not to trade the day or not to hold it to 12:00.
  D1 (London days): Mon 06-15 close 1.12826 (0.89); Tue 06-16 close 1.12471 (0.34); Wed 06-17 high 1.13578 low 1.12065 close 1.13372 (0.86, range 151.3):
      flat in my morning, a low in the afternoon, then about 150 pips up in the evening to a new 3-day high. The highest close since 06-10.
  H4 (UTC bars): Wed 12:00 bar down to 1.12247; 16:00 bar 1.12065 -> 1.13578, close 1.13421; 20:00 bar up to 1.13702; tonight 00:00 bar 1.13506-1.13718; 04:00 bar high 1.13756, last 1.13541.
  H1: the night (00:00-07:00 London): open 1.13412, high 1.13756, low 1.13387, last 1.13541: range 36.9 pips (ratio 1.06), net +12.9 pips - up a little, holding the evening's gain.
  M15: the last candle fell 15 pips from 1.13695 to 1.13515.
  Bias: BUY. 22:00 London closes: 06-17 1.13372 vs 06-12 1.12648 = +72 pips (3-day gap +72.4). Gap / ADR5 0.54. FLIP DAY after four sells.
  UN3 PAPER TAG (never live): 5-day gap +13 pips (13.5) -> BUY; agree: paper TRADES. Forward day 43, disagree days 11 of 30.
  PH2 PAPER TAG (never live): decided at 08:00. Forward day 35.
  MB1 PAPER TAG (never live, forward day 27): morning direction written at 12:00, before 13:25. Kept drawdown 5.63R; early-close line 6R.
  Levels: night high 1.13756; Wed 06-10 high 1.13865 (the top of the last two weeks); night low 1.13387; Wed low 1.12065.
  Rejection-day check: for a buy, Wednesday made the 3-day high (True) and closed at 0.86, not in the bottom third. Not a rejection day. 10-day trend: UP (1.13372 vs 06-03 1.12740); the buy is WITH it.
  SIZE RULE (the real safety rule): tracker balance $25,022.52, high-water $25,280.44, drawdown -1.02%; trigger 1 (half size) $24,522.03 not reached -> FULL size, 0.31 lots. Trigger 2 (stop) $23,510.81.
  Plan: BUY 0.31 at 08:00 London, stop 40 pips below the bid, never moved, close 12:00. One trade.
  Worry: buying 30 pips under the two-week high, where last week's three buys failed. Written, not a rule.

## Forward tally of the rule (unseen data only, from 03-02)
| Rule | Trades | Wins | Net R | Avg R | Max DD | Note |
|---|---|---|---|---|---|---|
| A2 as traded (R = result / amount risked) | 78 | 44 | +15.67 | +0.20 | 4.85R | 40-trade alarm PASSED 04-24; next alarm look at 100 live trades; real statement at 200 |
| F1 paper tag | 35 (12 skips) | 23 | +18.51 | +0.53 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| FR1 (tracked only to judge F1) | 32 (15 skips) | 21 | +15.36 | +0.48 | 1.28R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q3 dead-Asia tag (drawdown goal) | 26 (21 skips) | 15 | +6.06 | +0.23 | 1.01R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| Q1 dead-Asia tag (drawdown goal) | 43 (4 skips) | 25 | +12.32 | +0.29 | 3.23R | CLOSED 05-06 at its day-40 gate (journal/2015-paper-tag-gates-day40.md); no longer updated |
| UN3 paper tag (never live; rules: journal/UN3-paper-tag-rules.md; forward from 04-21) | 42 days, 11 disagree days of 30 | - | A2 on the disagree days +2.01R; on the agree days -1.03R | - | - | first look only at 30 disagree days AND 200 forward days |
| PH2 paper tag (never live; rules: journal/PH2-paper-tag-rules.md; forward from 05-01) | 34 days, 27 lively days of 60 | - | A2 on the lively days -1.61R (12 full-stop mornings), on the 7 quiet days +1.05R; PH2 about +0.26R vs A2 -0.58R | - | - | first look only at 200 forward days AND 60 lively days |
Days: ... 04-03 +0.07 (funded 6) | 04-06 +0.27 (funded 7) | 04-07 -1.00 (funded 8) | 04-08 -1.00 (funded 9) | 04-09 +0.33 (funded 10) | 04-10 +1.62 (funded 11) | 04-13 +1.94 (funded 12) | 04-14 -0.62 (funded 13) | 04-15 +1.48 (funded 14) | 04-16 -1.00 (funded 15) | 04-17 +1.70 (funded 16) | 04-20 -1.00 (funded 17) | 04-21 -0.04 (funded 18) | 04-22 -0.02 (funded 19) | 04-23 -1.00 (funded 20) | 04-24 -1.00 (funded 21) | 04-27 -0.16 (funded 22) | 04-28 +1.61 (funded 23) | 04-29 +0.32 (funded 24) | 04-30 +1.83 (funded 25) | 05-01 +0.44 (funded 26) | 05-04 -1.00 (funded 27) | 05-05 +0.85 (funded 28) | 05-06 +0.63 (funded 29) | 05-07 +0.07 (funded 30) | 05-08 +0.46 (funded 31) | 05-11 -1.00 (funded 32) | 05-12 -1.00 (funded 33) | 05-13 +0.64 (funded 34) | 05-14 +0.51 (funded 35) | 05-15 -1.00 (funded 36) | 05-18 -1.00 (funded 37) | 05-19 +2.17 (funded 38) | 05-20 -1.00 (funded 39) | 05-21 -1.00 (funded 40) | 05-22 -1.00 (funded 41) | 05-25 +0.69 (funded 42) | 05-26 -0.45 (funded 43) | 05-27 +0.91 (funded 44) | 05-28 +0.10 (funded 45) | 05-29 -1.00 (funded 46) | 06-01 -1.00 (funded 47) | 06-02 +1.51 (funded 48) | 06-03 -1.00 (funded 49) | 06-04 +2.87 (funded 50) | 06-05 -0.64 (funded 51) | 06-08 -1.00 (funded 52) | 06-09 -1.00 (funded 53) | 06-10 -0.14 (funded 54) | 06-11 -1.00 (funded 55) | 06-12 +0.85 (funded 56) | 06-15 +0.23 (funded 57) | 06-16 +1.60 (funded 58) | 06-17 +0.14 (funded 59).
Loss tags, all live trades: valid loss 47 (-32.98R, from the log) | my mistake 0. Process mistakes (funded): 4.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 78 | 78 |
| Win rate | 64% | 56% | 56% |
| Avg R | +0.50 | +0.20 | +0.20 |
| +- 2 standard errors | 0.33 | 0.24 | 0.25 |
| Net R | +19.56 | +15.67 | +15.79 |
| Avg win / avg loss | +1.04 / -0.46 | +0.97 / -0.79 | +0.98 / -0.81 |
| Full stops | 3 (8%) | 24 (31%) | 24 (31%) |
| Max drawdown | 1.87R | 4.85R | 4.92R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 42, +0.30 | 42, +0.30 |
| Buys: n, avg R | 15, +0.18 | 36, +0.09 | 36, +0.09 |
Live minus backtest: -0.30R per trade (noise band +-0.41R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.03R. As traded vs engine on the same days: -0.12R over 78 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 78 done, avg +0.20R, max DD 4.85R. Planning edge +0.18R: live is +0.02R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 24 (+3.47R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 21 trades +1.39R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 26 days, kept 10 trades (-4.87R, DD 5.63R); removed 14 (+10.77R); no break 2. +80 pip trades from 05-22: 3 of 15 (net trail +0.82R). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.85R (06-11). Now: 0 in a row, 2.03R under the high.

## 06-15 research after funded day 57 (coach: 3 fresh hypotheses about how my best A2 days START, the strongest pre-registered, max 3 variants): idea BS
(journal/2015-idea-BS-how-best-days-start.md). Notes re-read; three hypotheses known at 08:00: a break-out start, a coil start, a busy start (volume,
never used before). Look at the 15 best days against base rates counted without outcomes: break-out nothing (33% against 37%); coil the wrong way (best
days follow WIDE days: idea GA, known); busy hour 3 of 13 against 11%: picked by default, said so. Kill lines pushed first; one run with the 15 best
dropped from both sides: busy-hour days are 0.23R to 0.41R WORSE than the rest, the sign flips between the periods: killed on four lines, not turned
into a filter (it is PH again). By-product: the 15 best days are +32.51R of A2's +33.61R. Counts: 82 ideas, 231 variants. June corrections after a push: 1.

## 06-16 research after funded day 58 (coach: what would make me skip or exit early on a best day? check that no current rule cuts them): idea BD, an audit
(journal/2015-idea-BD-do-my-rules-cut-best-days.md). Six checks with alarm lines and worked cases pushed first; one run. Stop: 27 stop days, no hidden
best day (best at noon without it +1.14R). Size rule: never on. Calendar: no hole in 116 weekdays. Me: 7 lived best days, all full size to 12:00,
within 0.08R of the engine. No alarm; nothing changes. Price list of the things I want to do, on the 15 best days: partial -8.8R, lively-hour half size
-6.5R, +80 target -4.1R, 10:00 lock -3.4R, UN3 skip -2.2R: one line in the plan. A parser miss raised a false calendar alarm (five rows written in an
older format); fixed, said in the journal. Counts: 83 ideas, 232 variants. June corrections after a push: 1.

## 06-17 after funded day 59 (coach: plan v2 on one page, then one test of position sizing math): (1) the plan rewritten on one page
(journal/PLAN-v2-funded-one-page.md: the trade, the size rule, the daily stop, the payout rule, what I never do; no rule changed; long version archived).
(2) Idea SG, size for growth (journal/2015-idea-SG-size-for-growth.md): lines S1-S5, worked cases and a regression pushed before the code; one run,
2,000 two-year runs from my real state at 0.50 / 0.75 / 1.00%. No size breaches - my 7% stop stands in front of the firm's line - so the size is chosen
by how often I stop myself: at +0.18R 3% / 22% / 57%, for a median payout to me of $6,037 / $7,782 / $7,565; at +0.10R the bigger sizes pay nothing more.
0.75% and 1.00% killed; 0.50% stays; no trigger written. One correction counted: a test line's label called a hypothetical jump day (3.07R) a
real fill (the worst real fill is 1.33R); the line was applied as worked, the stricter way. Counts: 84 ideas, 235 variants. June corrections after a push: 2.

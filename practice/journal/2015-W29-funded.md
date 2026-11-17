# Week 29 (Mon 2015-07-13 .. Fri 07-17), funded account. A2 ON PAPER (rule alarm 07-08; return-to-live rule 07-09). Account FLAT.
JULY GOAL: A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
Size rule v3 (0.16 lots) applies only if a route of the return rule opens. Payout date Fri 07-17 ($0 unless balance > $25,000).

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 07-13 08:00 | buy | NO LIVE TRADE (monitor -0.227R) | paper | paper | paper stop | (-1.03 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 4: stopped; 132 pips against within two hours |
| (paper) | Tue 07-14 08:00 | sell | NO LIVE TRADE (monitor -0.302R) | paper | paper | paper stop | (-1.00 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 5: stopped before 10:00 |
| (paper) | Wed 07-15 08:00 | sell | NO LIVE TRADE (monitor -0.433R) | paper | paper | paper clock exit | (-0.48 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 6: within 5 pips of the stop, out at noon |
| (paper) | Thu 07-16 08:00 | sell | NO LIVE TRADE (monitor -0.425R) | paper | paper | paper clock exit | (+1.09 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 7: winner on paper, not traded by rule |
| (paper) | Fri 07-17 08:00 | sell | NO LIVE TRADE (monitor -0.308R) | paper | paper | paper clock exit | (+0.05 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 8: flat morning; payout date $0 |

## Mon 07-13
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-13`:
- 3-day gap +141.2 pips -> A2 side BUY. 5-day gap +42.7 -> UN3 agree. Night 00:00-07:00: 1.11101-1.11518, last 1.11425 (range 41.7, net +22.9).
- Friday's London day: 1.10304-1.12157, close 1.11519 (range 185.3).
- Monitor for today -0.227R (MO1), -0.166R (MO3) -> BOTH PAPER. Return rule: route A closed until 09-21; route B: no tested setup. NO ORDER.
- Paper plan: buy at the 08:00 open, stop 40 pips below the bid, out 12:00. Paper risk 1R. I do nothing in the account.
- How I feel: calm; three paper days so far -0.61R, not my money. Mistake to avoid: placing an order out of habit.
  08:00 London (PAPER): pre-entry hour 1.11211-1.11968 = 75.7 pips (PH2 lively: half size on paper), a 70-pip jump up in the last 20 minutes. Paper BUY near 1.11863 (last price; the engine fixes the exact fill), paper stop about 1.11463. No order in the account. Before advancing: I expect nothing; a buy after a spike often gives back, and that is the rule's business.
  10:00 London (PAPER): the price fell 132 pips from the paper entry within two hours (best +10.5, worst -132.3, last -124.3): the paper buy is stopped. Account untouched. Before advancing to noon: nothing to manage.
  12:00 London (PAPER): stopped long before noon; day's last price 1.10006 (about 186 pips under the paper entry).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.227R -> paper). Checked: July goal read; call committed before the bell; no order;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 4 (engine, `python bt/coin_control.py 2015-07-14 --check 2015-07-13`): buy, stopped, -1.03R; the other side +2.95R.
     A2 paper running from 07-08: 4 days, -1.64R (-1.00, +1.39, -1.00, -1.03).
     Account: tracker $24,358.99 (sim $24,926.03 minus $567.04 paid out); FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: relief that it was paper, and I distrust the relief: one saved loss proves nothing about the monitor.
     Paper lines: UN3 agreed, -1.03R (agree days -9.57R in 46; disagree +2.88R in 14; day 60). PH2 (day 52): lively (75.7) -> half = -0.52R;
     37 lively days -5.84R, 18 full-stop mornings; 15 quiet -2.39R; PH2 about -5.30R against A2's -8.25R.
     MO PAPER RULE (day 10 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.03R (running -4.44R).
     For Tuesday (tool): MO1 -0.302R -> paper; MO3 -0.188R -> paper.

## Tue 07-14
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-14`:
- 3-day gap -75.2 pips -> A2 side SELL. 5-day gap -55.0 -> UN3 agree. Night 00:00-07:00: 1.09740-1.10129, last 1.09962 (range 38.9, net -10.5).
- Monday's London day: 1.09954-1.11968, close 1.10006 (range 201.4, closed at its low).
- Monitor for today -0.302R (MO1), -0.188R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- Paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00. I do nothing in the account.
- How I feel: calm. Mistake to avoid: reading yesterday's saved loss as proof of anything.
  08:00 London (PAPER): pre-entry hour 1.09653-1.10025 = 37.2 pips (PH2 lively: half on paper). Paper SELL near 1.09785 (last price; engine fixes the fill), paper stop about 1.10185. No order. Before advancing: nothing to do but watch.
  10:00 London (PAPER): best +12.2, worst -60.7, last -48.8 pips: the paper sell is stopped. Account untouched. Nothing to manage.
  12:00 London (PAPER): stopped before 10:00; day's last price 1.10083.
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.302R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 5 (engine, `python bt/coin_control.py 2015-07-15 --check 2015-07-14`): sell, stopped, -1.00R; the other side +1.04R.
     A2 paper running from 07-08: 5 days, -2.64R (-1.00, +1.39, -1.00, -1.03, -1.00).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: flat. Three paper stops in a row would have been -$187 at 0.16 lots; I note it and do not count it as skill.
     Paper lines: UN3 agreed, -1.00R (agree days -10.57R in 47; disagree +2.88R in 14; day 61). PH2 (day 53): lively (37.2) -> half = -0.50R;
     38 lively days -6.84R, 19 full-stop mornings; 15 quiet -2.39R; PH2 about -5.80R against A2's -9.25R.
     MO PAPER RULE (day 11 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.00R (running -5.44R).
     For Wednesday (tool): MO1 -0.433R -> paper; MO3 -0.222R -> paper.

## Wed 07-15
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-15`:
- 3-day gap -27.3 pips -> A2 side SELL. 5-day gap -2.4 -> UN3 agree. Night 00:00-07:00: 1.09867-1.10127, last 1.09974 (range 26.0, net -15.0).
- Tuesday's London day: 1.09653-1.10832, close 1.10083 (range 117.9).
- Monitor for today -0.433R (MO1), -0.222R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- Paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00. I do nothing in the account.
- How I feel: calm, a little bored; boredom is when I would invent a trade. I will not.
  08:00 London (PAPER): pre-entry hour 1.09907-1.10267 = 36.0 pips (PH2 lively: half on paper). Paper SELL near 1.10015 (last price; engine fixes the fill), paper stop about 1.10415. No order. Before advancing: watch only.
  10:00 London (PAPER): best +13.8, worst -35.0 (5 pips from the paper stop), last -27.1. Still open on paper. Before advancing to noon: the stop is not mine to move, not even on paper.
  12:00 London (PAPER): closed by the clock about 19 pips against (walk: best +13.8, worst -35.0, last -19.0). The afternoon fell 50 pips: after my exit, not my business.
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.433R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 6 (engine, `python bt/coin_control.py 2015-07-16 --check 2015-07-15`): sell, clock exit, -0.48R; the other side +0.42R.
     A2 paper running from 07-08: 6 days, -3.12R (-1.00, +1.39, -1.00, -1.03, -1.00, -0.48).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: nothing much. Four paper losses in a row.
     Paper lines: UN3 agreed, -0.48R (agree days -11.05R in 48; disagree +2.88R in 14; day 62). PH2 (day 54): lively (36.0) -> half = -0.24R;
     39 lively days -7.32R, 19 full-stop mornings; 15 quiet -2.39R; PH2 about -6.04R against A2's -9.73R.
     MO PAPER RULE (day 12 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -0.48R (running -5.92R).
     For Thursday (tool): MO1 -0.425R -> paper; MO3 -0.237R -> paper.

## Thu 07-16
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-16`:
- 3-day gap -203.4 pips -> A2 side SELL. 5-day gap -127.3 -> UN3 agree. Night 00:00-07:00: 1.09108-1.09626, last 1.09243 (range 51.8, net -34.4, with the sell).
- Wednesday's London day: 1.09299-1.10355, close 1.09485 (range 105.6); it made the 3-day low.
- Monitor for today -0.425R (MO1), -0.237R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- Paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00. I do nothing in the account.
- How I feel: steady. Yesterday's test said "warning"; that makes sitting out easier, which is a feeling, not evidence.
  08:00 London (PAPER): pre-entry hour 1.09180-1.09482 = 30.2 pips (PH2 lively: half on paper). Paper SELL near 1.09318 (last price; engine fixes the fill), paper stop about 1.09718. No order. Before advancing: watch only.
  10:00 London (PAPER): best +34.5, worst -17.4, last +26.8. Open on paper. Before advancing to noon: the clock decides, not me.
  12:00 London (PAPER): closed by the clock about 44 pips ahead (walk: best +51.5, worst -31.8, last +43.8).
  -> Thu result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.425R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 7 (engine, `python bt/coin_control.py 2015-07-17 --check 2015-07-16`): sell, clock exit, +1.09R; the other side -1.03R (stopped).
     A2 paper running from 07-08: 7 days, -2.03R (-1.00, +1.39, -1.00, -1.03, -1.00, -0.48, +1.09).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: a paper winner I did not get paid for. About $68 at 0.16 lots. The rule cost me that today and saved more this week; neither proves it.
     Paper lines: UN3 agreed, +1.09R (agree days -9.96R in 49; disagree +2.88R in 14; day 63). PH2 (day 55): lively (30.2) -> half = +0.55R;
     40 lively days -6.23R, 19 full-stop mornings; 15 quiet -2.39R; PH2 about -5.49R against A2's -8.64R.
     MO PAPER RULE (day 13 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +1.09R (running -4.83R).
     For Friday (tool): MO1 -0.308R -> paper; MO3 -0.163R -> paper. Friday is a payout date: balance under $25,000 -> $0.

## Fri 07-17 (payout date)
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-07-17`:
- 3-day gap -127.5 pips -> A2 side SELL. 5-day gap -162.5 -> UN3 agree. Night 00:00-07:00: 1.08756-1.09035, last 1.08843 (range 27.9, net +4.8).
- Thursday's London day: 1.08553-1.09626, close 1.08731 (range 107.3); it made the 3-day low.
- Monitor for today -0.308R (MO1), -0.163R (MO3) -> BOTH PAPER. Route A closed until 09-21; route B: no tested setup. NO ORDER.
- Paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00. I do nothing in the account.
- Payout date: tracker balance $24,358.99 is under $25,000 -> request $0, by my payout rule. Logged after the close.
- How I feel: fine. Mistake to avoid: wanting yesterday's paper winner back.
  08:00 London (PAPER): pre-entry hour 1.08800-1.08963 = 16.3 pips (PH2 quiet: full unit on paper). Paper SELL near 1.08853 (last price; engine fixes the fill), paper stop about 1.09253. No order. Before advancing: watch only.
  10:00 London (PAPER): best +5.7, worst -22.6, last -5.9. A dull morning so far. Before advancing to noon: the clock decides.
  12:00 London (PAPER): closed by the clock about flat (walk: best +13.6, worst -22.6, last +2.8).
  -> Fri result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.308R -> paper). Checked: call committed before the bell; no order; trade list
     still ends with #230 of 07-07; sim balance $24,926.03 unchanged.
     PAPER A2, day 8 (engine, `python bt/coin_control.py 2015-07-18 --check 2015-07-17`): sell, clock exit, +0.05R; the other side -0.11R.
     A2 paper running from 07-08: 8 days, -1.98R (-1.00, +1.39, -1.00, -1.03, -1.00, -0.48, +1.09, +0.05).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     PAYOUT DATE (eighth): balance $24,358.99 is not above $25,000 -> request $0. Totals unchanged: $567.04 requested, $453.63 mine. Next date Fri 07-31.
     THE WEEK (W29): no live trade on any day, by rule. Paper A2: -1.03, -1.00, -0.48, +1.09, +0.05 = -1.37R. Five tests/studies (NA, big-days study,
     BK, LR, MC): all killed or warning; no rule changed. No trade mistake, no process mistake found.
     How it feels: a week without an order. Less itch than I expected; the itch shows up as wanting a new setup to pass.
     Paper lines: UN3 agreed, +0.05R (agree days -9.91R in 50; disagree +2.88R in 14; day 64). PH2 (day 56): quiet (16.3) -> full = +0.05R;
     40 lively days -6.23R, 19 full-stop mornings; 16 quiet -2.34R; PH2 about -5.44R against A2's -8.59R.
     MO PAPER RULE (day 14 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.05R (running -4.78R).
     For Monday (tool): MO1 -0.260R -> paper; MO3 -0.119R -> paper.
     FRIDAY GATES LIST READ (07-17): payout $0 (done). Return rule: review day Mon 09-21; route A monitor -0.260R (needs +0.30R and MO's judging);
     route B: no setup has passed a test (16 tried). MO day 14 of 60. UN3 14 of 30 disagree days / 64 of 200. PH2 40 of 60 lively / 56 of 200.
     Live-trade counts frozen. Month-end review: first trading day of August.
     END OF RELEASED DATA (clock Fri 07-17 22:00 London; weekend).

## Forward tally

## 07-13 research: all 31 A2 losses since May by eye -> idea NA (journal/2015-idea-NA-night-against-second-review.md)
All 31 valid (market, not mistake). Repeating picture: the night against me. One filter (skip at 15+ pips against), pre-May first:
skipped 24 days made +6.75R, Jan-Feb the skipped days were the better ones -> K1, K2 fail, KILLED (second time). Lived days not looked at.
Idea 103, variant 289.

## 07-14 study: how the 20 biggest days start (journal/2015-07-14-study-how-big-days-start.md)
By eye: flat box before the move. Counted: wrong (15% of big days against 27% of other days). Only difference: the day before was above its
10-day median range on 65% against 38%. Size, not direction. Nothing tested; no idea counted.

## 07-14 test: idea BK, night-box breakout after a big day (journal/2015-idea-BK-breakout-after-big-day.md)
BK1 50 trades +0.141R, but -3.67R from 04-07; control after normal days +0.144R; DD 9.66R. KILLED (K2, K4, K6, K7). Idea 104, variants 292.

## 07-15 test: idea LR, losing runs normal or warning (journal/2015-idea-LR-losing-runs-normal-or-warning.md)
Window 04-07..07-15: 72 trades, longest run 7, DD 11.34R. Healthy A2 resampled 20,000 times: that drawdown never, a 7-run in 1.54%.
WARNING SIGN by the line written first. A2 stays on paper; nothing else changes. Idea 105, variants 294.

## 07-16 test: idea MC, what changed + morning-chop on/off (journal/2015-idea-MC-morning-chop-on-off.md)
Facts: day size unchanged; moves no longer hold (whip mornings 6% -> 23%). On/off rule by the last 10 mornings: inside Jan-Apr the gap is
+0.16R and OFF days still earned +0.27R. KILLED at step 1; lived months not run. Idea 106, variants 297.

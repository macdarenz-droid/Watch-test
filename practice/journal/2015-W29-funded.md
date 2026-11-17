# Week 29 (Mon 2015-07-13 .. Fri 07-17), funded account. A2 ON PAPER (rule alarm 07-08; return-to-live rule 07-09). Account FLAT.
JULY GOAL: A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
Size rule v3 (0.16 lots) applies only if a route of the return rule opens. Payout date Fri 07-17 ($0 unless balance > $25,000).

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 07-13 08:00 | buy | NO LIVE TRADE (monitor -0.227R) | paper | paper | paper stop | (-1.03 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 4: stopped; 132 pips against within two hours |
| (paper) | Tue 07-14 08:00 | sell | NO LIVE TRADE (monitor -0.302R) | paper | paper | paper stop | (-1.00 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 5: stopped before 10:00 |

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

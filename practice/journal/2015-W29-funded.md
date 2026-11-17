# Week 29 (Mon 2015-07-13 .. Fri 07-17), funded account. A2 ON PAPER (rule alarm 07-08; return-to-live rule 07-09). Account FLAT.
JULY GOAL: A WORKED CASE BEFORE EVERY PUSHED NUMBER OR TEST RULE, AND EVERY FILE WRITE READ BACK IN THE SAME COMMAND.
Size rule v3 (0.16 lots) applies only if a route of the return rule opens. Payout date Fri 07-17 ($0 unless balance > $25,000).

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 07-13 08:00 | buy | NO LIVE TRADE (monitor -0.227R) | paper | paper | paper stop | (-1.03 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 4: stopped; 132 pips against within two hours |

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

## Forward tally

## 07-13 research: all 31 A2 losses since May by eye -> idea NA (journal/2015-idea-NA-night-against-second-review.md)
All 31 valid (market, not mistake). Repeating picture: the night against me. One filter (skip at 15+ pips against), pre-May first:
skipped 24 days made +6.75R, Jan-Feb the skipped days were the better ones -> K1, K2 fail, KILLED (second time). Lived days not looked at.
Idea 103, variant 289.

# Week 35 (Mon 2015-08-24 .. Fri 08-28), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. SW1 shadow 7 of 20 (-5.02R), trade 8 open. EN2 and NC1 forward counts wait for the coach. Payout date Fri 08-28.
Coach 08-21 on RS: "RS1 flipped from losing to winning across your two halves, that's why K2 exists." Noted.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-24 08:00 | buy | NO LIVE TRADE (monitor -0.151R) | paper | paper | paper clock exit | (+0.62 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 34; SW1 shadow trade 8 hit its target (+1.96R net) |

## Mon 08-24
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-24`:
- 3-day gap +361.2 pips -> A2 side BUY. 5-day gap +274.9 -> UN3 agree. Night 00:00-07:00: 1.13692-1.14983, last 1.14361 (range 129.1, net +45.0):
  the widest night in my record that I can remember (not checked against the record), and a 3-day gap of 3.25 days' ranges.
- Friday's London day: 1.12292-1.13887, close 1.13828 (range 159.5; closed at 96% of its range); it made the 3-day high.
- Monitor for today -0.151R (MO1), -0.127R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00. On a 129-pip night a 40-pip stop is small: I note it; the rule stands.
- SW1 shadow trade 8: open (buy 1.12814, stop 1.11614, target 1.15214, clock 12:00 Fri 08-28); the night's high 1.14983 is 23 pips under its target.
- How I feel: alert. A wild night is exactly when a flat account is comfortable, and exactly when I must not start trading on the side.
  08:00 London (PAPER): pre-entry hour 1.14202-1.14733 = 53.1 pips (PH2 lively: half on paper), net about +29 pips WITH the buy (NC1, for the record only: it would skip at 15+). A2 paper BUY near 1.14650 (engine fixes the fill), paper stop about 1.14250. SW1 shadow untouched. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +35.0, worst -12.4, last +6.6. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper buy closed by the clock about 26 pips ahead (best +40.0, worst -12.4, last +26.2). The afternoon ran on to 1.16176.
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.151R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 34 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-25 --check 2015-08-24`): buy, clock exit, +0.62R; the other side -1.00R (stopped).
     A2 paper running from 07-08: 34 days, +0.14R.
     NC1, for the record only (not a running line): the hour ran +28.7 pips with the buy; NC1 would have skipped a +0.62R day.
     SW1 SHADOW trade 8 (tool `bt/sw1_shadow.py 2015-08-25`): buy 1.12814 (Fri) -> TARGET 1.15214 at 12:40 Mon, +1.99R, 3 nights, financing -0.025R,
     net +1.96R. Running -3.06R after 8 of 20 (max DD 5.36R; early-close line 6R).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: a very wide day (Monday's last price 1.16176 against Friday's close 1.13828: +234.8 pips, both from the tools; I first wrote "about 330 pips above Friday's 12:00 level", a figure I had not read from any tool, corrected the same evening) and I was flat. No regret is allowed and none is felt: a 40-pip
     stop in that night's range was a coin, and the rule said paper.
     Paper lines: UN3 agreed, +0.62R (agree days -9.58R in 70; disagree +4.67R in 20; day 90). PH2 (day 82): lively (53.1) -> half = +0.31R;
     48 lively days -7.81R, 21 full-stop mornings; 34 quiet +1.36R; PH2 about -2.54R against A2's -6.47R.
     MO PAPER RULE (day 40 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.62R (running -2.66R).
     For Tuesday (tool): MO1 -0.067R -> paper; MO3 -0.076R -> paper.

## Forward tally

## 08-24 test: idea FH, the 07:00-08:00 hour with the night (journal/2015-idea-FH-the-frankfurt-hour.md)
R after costs (1.0 + 0.1). Follow the night in the hour before the bell: 106 trades +0.048R, negative after 04-07, negative at stressed costs.
Killed on all four lines. Ideas 143, variants 385.

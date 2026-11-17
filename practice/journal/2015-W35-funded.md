# Week 35 (Mon 2015-08-24 .. Fri 08-28), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL: READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. SW1 shadow 7 of 20 (-5.02R), trade 8 open. EN2 and NC1 forward counts wait for the coach. Payout date Fri 08-28.
Coach 08-21 on RS: "RS1 flipped from losing to winning across your two halves, that's why K2 exists." Noted.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Mon 08-24 08:00 | buy | NO LIVE TRADE (monitor -0.151R) | paper | paper | paper clock exit | (+0.62 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 34; SW1 shadow trade 8 hit its target (+1.96R net) |
| (paper) | Tue 08-25 08:00 | buy | NO LIVE TRADE (monitor -0.067R) | paper | paper | paper stop | (-1.03 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 35; SW1 shadow trade 9 stopped (-1.01R) |
| (paper) | Wed 08-26 08:00 | buy | NO LIVE TRADE (monitor -0.175R) | paper | paper | paper stop | (-1.03 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 36; SW1 shadow trade 10 stopped (-1.01R) |
| (paper) | Thu 08-27 08:00 | sell | NO LIVE TRADE (monitor -0.232R) | paper | paper | paper clock exit | (+1.05 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 37; SW1 shadow trade 11 stopped: SW1 CLOSED by its 6R line; EN2 forward count starts Fri 08-28 |

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

## Tue 08-25
STATE.md now opens with "WHAT MUST CHANGE BEFORE A LIVE TRADE" (coach 08-25): routes A, B, C with today's readings; earliest live trade Mon 09-21.
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-25`:
- 3-day gap +497.8 pips -> A2 side BUY. 5-day gap +539.9 -> UN3 agree. Night 00:00-07:00: 1.15252-1.15992, last 1.15690 (range 74.0, net -28.3).
- Monday's London day: 1.13692-1.17139, close 1.16176 (range 344.7: the widest London day in this record by the tool's numbers I have seen).
- Monitor for today -0.067R (MO1), -0.076R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 SHADOW trade 9 (tool `bt/sw1_shadow.py 2015-08-25 signal`): Mon close 1.16176 vs 08-10 close 1.10185 = +599.1 pips -> paper BUY at the
  08:00 open, stop 120 below, target 240 above, else out 12:00 Tue 09-01. Running -3.06R after 8 of 20.
- How I feel: a 345-pip day yesterday; today's 40-pip stop is a small target inside that. The rule does not change with the weather.
  08:00 London (PAPER): pre-entry hour 1.15476-1.15779 = 30.3 pips (PH2 lively: half on paper), net about flat. A2 paper BUY near 1.15680 (engine fixes the fill), paper stop about 1.15280. SW1 shadow BUY at the same open, stop about 1.14480, target about 1.18080. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +3.1, worst -55.4: through the paper stop. Nothing to manage.
  12:00 London (PAPER): the A2 paper buy was stopped before 10:00 (worst -55.4 pips in the first two hours).
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.067R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 35 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-26 --check 2015-08-25`): buy, stopped, -1.03R; the other side +1.78R.
     A2 paper running from 07-08: 35 days, -0.89R.
     SW1 SHADOW trade 9 (tool `bt/sw1_shadow.py 2015-08-26`): buy 1.15680 -> STOPPED 1.14479 at 15:15 the same day, -1.01R, 0 nights, net -1.01R.
     Running -4.07R after 9 of 20 (max DD 5.36R; early-close line 6R). Next entry Wed 08:00 (signal below).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: the monitor fell back to -0.175R in one day. That is exactly why the gate is +0.60R on a 40-day average and not "near zero".
     Paper lines: UN3 agreed, -1.03R (agree days -10.61R in 71; disagree +4.67R in 20; day 91). PH2 (day 83): lively (30.3) -> half = -0.52R;
     49 lively days -8.33R, 22 full-stop mornings; 34 quiet +1.36R; PH2 about -3.06R against A2's -7.50R.
     MO PAPER RULE (day 41 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.03R (running -3.69R).
     For Wednesday (tool): MO1 -0.175R -> paper; MO3 -0.166R -> paper.

## Wed 08-26
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-26`:
- 3-day gap +274.1 pips -> A2 side BUY. 5-day gap +492.5 -> UN3 agree. Night 00:00-07:00: 1.14715-1.15609, last 1.14748 (range 89.4, net -53.9, against the buy).
- Tuesday's London day: 1.13968-1.16218, close 1.15141 (range 225.0). ADR5 196.6 pips: the five-day average range is about twice its July level (my reading of earlier calls; not re-checked).
- Monitor for today -0.175R (MO1), -0.166R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips below, out 12:00.
- SW1 SHADOW trade 10 (tool `bt/sw1_shadow.py 2015-08-26 signal`): Tue close 1.15141 vs 08-11 close 1.10416 = +472.5 pips -> paper BUY at the
  08:00 open, stop 120 below, target 240 above, else out 12:00 Wed 09-02. Running -4.07R after 9 of 20.
- How I feel: steady.
  08:00 London (PAPER): pre-entry hour 1.14650-1.15043 = 39.3 pips (PH2 lively: half on paper), net about +22 with the buy. A2 paper BUY near 1.14970 (engine fixes the fill), paper stop about 1.14570. SW1 shadow BUY at the same open, stop about 1.13770, target about 1.17370. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper buy best +22.2, worst -25.7, last -23.6. Before advancing to noon: clock only.
  12:00 London (PAPER): the A2 paper buy was stopped before noon (16 candles: best +22.2, worst -79.4).
  -> Wed result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.175R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 36 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-27 --check 2015-08-26`): buy, stopped, -1.03R; the other side +1.86R.
     A2 paper running from 07-08: 36 days, -1.92R.
     SW1 SHADOW trade 10 (tool `bt/sw1_shadow.py 2015-08-27`): buy 1.14968 -> STOPPED 1.13767 at 13:30 the same day, -1.01R, net -1.01R. Running
     -5.07R after 10 of 20; drawdown from the start 5.07R (max 5.36R); the early-close line (6R) is 0.93R away.
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: A2 and the slow shadow both bought into a falling market and were both stopped. Both by rule, both on paper.
     Paper lines: UN3 agreed, -1.03R (agree days -11.64R in 72; disagree +4.67R in 20; day 92). PH2 (day 84): lively (39.3) -> half = -0.52R;
     50 lively days -8.85R, 23 full-stop mornings; 34 quiet +1.36R; PH2 about -3.58R against A2's -8.53R.
     MO PAPER RULE (day 42 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.03R (running -4.72R).
     For Thursday (tool): MO1 -0.232R -> paper; MO3 -0.178R -> paper.

## Range check before Thursday's call (coach 08-26: "check it with numbers before it shapes any call")
On 08-26 I wrote the 5-day average range was "about twice its July level (my reading; not re-checked)". Checked now, history before 08-27:
| | median London-day range (22:00 -> 22:00) | median 08:00-12:00 range | A2 full-stop share (engine) |
|---|---|---|---|
| July (23 days) | 117.1 pips | 59.4 pips | 39% |
| August to 08-26 (18 days) | 116.2 pips | 52.5 pips | 17% |
| last 10 days | 126.9 (mean 159.5) | 52.9 | - |
The remark was TRUE ONLY for the last-5-day mean (ADR5 227.2 pips), and three days carry it (08-24: 344.7, 08-25: 225.0, 08-26: 269.5). The typical August day is
the same size as July's, and the London MORNING, the only window A2 trades, is narrower. My eye read the last three days as the month. The
remark had not shaped a call (A2's rule has no range input), and it is now replaced by these numbers. (Correction after a push: August tally.)
What bigger ranges would mean for stop and risk, said before anything changes:
- Money at risk per trade does not grow with ranges: the stop is a fixed 40 pips and the size is fixed in dollars ($15.63 under route C / the
  first 40 trades of route A), so a full stop costs the same. What grows is (a) how OFTEN a 40-pip stop is hit and (b) the chance of a fill
  beyond the stop on a jump. This month (a) went the other way (17% full stops) and (b) did not show: the stopped paper trades on the two
  wildest days filled at -1.03R, the normal cost.
- So nothing to change. My plan closes stop sizes (S50/S60/S80 tested in spring); a change would need a pre-registered test on lived days and
  my coach's word. What I WILL do: the August review on 09-01 reports full-stop share and the worst fill per trade, and I keep "a range
  number in a call only if it came from a tool".

## Thu 08-27
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-27`:
- 3-day gap -70.2 pips -> A2 side SELL. 5-day gap +192.8 -> UN3 DISAGREE (disagree day 21 of 30). Night 00:00-07:00: 1.13220-1.13569, last 1.13520 (range 34.9, net +14.5).
- Wednesday's London day: 1.12914-1.15609, close 1.13126 (range 269.5); it made the 3-day low. ADR5 227.2 pips (tool), carried by three wide days.
- Monitor for today -0.232R (MO1), -0.178R (MO3) -> BOTH PAPER. Route A closed until 09-21 (gate +0.60R); routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1 SHADOW trade 11 (tool `bt/sw1_shadow.py ... signal`): Wed close 1.13126 vs 08-12 close 1.11574 = +155.2 pips -> paper BUY at the 08:00 open,
  stop 120 below, target 240 above, else out 12:00 Thu 09-03. Running -5.07R after 10 of 20; 0.93R from its close line.
- How I feel: fine. The range remark is checked and written above; no range number enters a call unless it came from a tool.
  08:00 London (PAPER): pre-entry hour 1.13284-1.13644 = 36.0 pips (PH2 lively: half on paper), net about -22 with the sell. A2 paper SELL near 1.13299 (engine fixes the fill), paper stop about 1.13699. SW1 shadow BUY at the same open, stop about 1.12099, target about 1.15699. No order.
  10:00 London (PAPER; window 07:00-08:45 UTC): A2 paper sell best +51.9, worst -11.8, last +46.7. Before advancing to noon: clock only.
  12:00 London (PAPER; 16 candles, 08:00-12:00): A2 paper sell closed by the clock about 43 pips ahead (best +53.2, worst -11.8, last +42.6).
  -> Thu result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.232R -> paper). VALID: no order placed. Checked: call committed before the bell;
     trade list still ends with #230 of 07-07; sim balance $24,926.03 unchanged. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 37 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-08-28 --check 2015-08-27`): sell, clock exit, +1.05R; the other side -1.03R (stopped).
     A2 paper running from 07-08: 37 days, -0.87R.
     SW1 SHADOW trade 11 (tool `bt/sw1_shadow.py 2015-08-28`): buy 1.13297 -> STOPPED 1.12096 at 15:55 the same day, -1.01R. Running -6.08R after 11 of 20:
     the running drawdown is above 6R -> BY ITS LINE E1 (written 07-20), SW1 IS CLOSED FOR GOOD. Record: 11 trades, 2 winners (+0.34R, +1.96R),
     9 losers, -6.08R including -0.22R of assumed financing (I first wrote -0.18R without reading it; the rows sum to -0.216R, corrected the same evening). It is never reopened.
     EN2 FORWARD COUNT: by its rule (written 08-13) it starts on the first weekday after SW1's shadow closes = FRI 2015-08-28. From tomorrow its
     signals are computed by `python bt/en2_forward.py 2015-08-28 END` after each day; no verdict before 120 trades; early close at an 8R drawdown.
     NC1: still waits for my coach's word (one line at a time: EN2 is that line now).
     Account: tracker $24,358.99; FLAT; high-water $25,256.94; drawdown -3.56%.
     How it feels: SW1 dying by its own rule is the system working, not a failure. The slow trend follower bought every big up-move this month
     after it had happened; that is the same lesson as TH and RS0, seen live on paper.
     Paper lines: UN3 DISAGREED (day 93): disagree days +5.72R in 21; agree days -11.64R in 72. PH2 (day 85): lively (36.0) -> half = +0.53R;
     51 lively days -7.80R, 23 full-stop mornings; 34 quiet +1.36R; PH2 about -3.05R against A2's -7.48R.
     MO PAPER RULE (day 43 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +1.05R (running -3.67R).
     For Friday (tool): MO1 -0.185R -> paper; MO3 -0.209R -> paper. Friday is a payout date: balance under $25,000 -> $0.

## Fri 08-28 (payout date)
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-28`:
- 3-day gap -371.8 pips -> A2 side SELL. 5-day gap +5.8 -> UN3 DISAGREE (disagree day 22 of 30). Night 00:00-07:00: 1.12319-1.12682, last 1.12567 (range 36.3, net +14.8, against the sell).
- Thursday's London day: 1.12030-1.13644, close 1.12458 (range 161.4, close position 0.27); it made the 3-day low. ADR5 232.0 (tool). 10-day trend UP.
- Monitor for today -0.185R (MO1), -0.209R (MO3) -> BOTH PAPER. Route A closed until 09-21; routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- SW1: closed for good 08-27. EN2 forward count: day 1 today (signals read after the day with `bt/en2_forward.py 2015-08-28 END`).
- YM: frozen near miss; forward check written this morning, NOT started (coach's word needed). I do not note YM's side today.
- Payout date: balance $24,926.03 sim / tracker $24,358.99 is under $25,000 -> $0 expected.
- How I feel: fine. A 372-pip 3-day fall after a 500-pip rise: the signal swung hard. The rule does not change with the weather.

## Forward tally

## 08-24 test: idea FH, the 07:00-08:00 hour with the night (journal/2015-idea-FH-the-frankfurt-hour.md)
R after costs (1.0 + 0.1). Follow the night in the hour before the bell: 106 trades +0.048R, negative after 04-07, negative at stressed costs.
Killed on all four lines. Ideas 143, variants 385.

## 08-25 test: idea ND, breakout after a narrow day (journal/2015-idea-ND-narrow-day-breakout.md)
Counts 17/30/46 at Q 0.7/0.8/0.9: under 80, killed for sample, outcomes unseen. My slip: skipped the paper frequency check; now a plan rule. Idea 144.

## 08-25 evening test: idea WN, skip A2 after a wide night, from my 08-24 note (journal/2015-idea-WN-wide-night-skip.md)
R after costs. A2 after a wide night +0.108R (37 days) vs the rest +0.085R; the sign flips at 04-07. Killed on all four lines.
The note was a feeling, not a fact. Ideas 145, variants 388.

## 08-26 test: idea SH, each hour repeats yesterday's same hour (journal/2015-idea-SH-same-hour-tomorrow.md)
R after costs. 653 one-hour trades: -0.014R (+-0.08); against -0.098R. Killed on all four lines. Ideas 146, variants 391.

Thu 08-27 evening, backtest idea 147 YM (08:00 open vs yesterday's midpoint as direction; prereg pushed first, counts and worked case pushed
before the run). R after costs 1.0 + 0.1. YM1 169 trades +0.113R, +7.78R / +11.25R, stressed +0.063R; control -0.105R; difference p 0.123:
K1-K3 pass, K4 FAILS -> KILLED. Ideas 147, variants 394. YM2 (+0.161R / 84) a hint only.

Thu 08-27 late, idea 148 XD (follow yesterday's 3-day range break; from my call notes): prereg pushed first; counts 113 trades but 104 of 113
(92%) on A2's side -> KILLED ON COUNTS (disguise line 70%), no outcome run. Ideas 148, variants 394.

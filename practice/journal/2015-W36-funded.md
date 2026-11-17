# Week 36 (Mon 2015-08-31 .. Fri 09-04), funded account. A2 ON PAPER (alarm 07-08; return rule 07-09, gate +0.60R). Account FLAT.
AUGUST GOAL (closes at the 09-01 review): READ A TOOL'S OWN HEADER LINE BEFORE WRITING ANY NUMBER FROM IT, AND SEE "script reached its end" BEFORE EVERY COMMIT.
Routes B and C empty. Paper forward counts (no money): EN2 (from 08-28), YM1 and NC1 (from 08-31, coach 08-28). August month-end review Tue 09-01.
Next payout date Fri 09-11.

## Funded trades
| # | time (London) | side | lots | entry | stop | exit | R | $ | tag | note |
|---|---|---|---|---|---|---|---|---|---|---|
| (paper) | Tue 09-01 08:00 | sell | NO LIVE TRADE (monitor -0.177R) | paper | paper | paper stop | (-1.00 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 40; YM1 day 2 DISAGREE (buy -0.32R); NC1 kept |
| (paper) | Mon 08-31 08:00 | sell | NO LIVE TRADE (monitor -0.203R) | paper | paper | paper clock exit | (+0.31 paper) | $0 | NO LIVE TRADE - BY RULE | A2 paper day 39; NC1 day 1 = SKIP tag; YM1 day 1 agree |

## Mon 08-31
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-08-31`:
- 3-day gap -334.1 pips -> A2 side SELL. 5-day gap -202.8 -> UN3 agree. Night 00:00-07:00: 1.11970-1.12624, last 1.12503 (range 65.4, net +52.6, against the sell).
- Friday's London day: 1.11559-1.13097, close 1.11800 (range 153.8, close position 0.16); it made the 3-day low. ADR5 230.9 (tool). 10-day trend UP.
- Monitor for today -0.203R (MO1), -0.211R (MO3) -> BOTH PAPER. Route A closed until 09-21; routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- Forward counts (paper): YM1 day 1 and NC1 day 1 - both read from their tools at 08:00 / after the day; EN2 after the day.
- How I feel: fine; three new paper lines at once, so I read each from its tool and write nothing from memory.
  08:00 London (PAPER): pre-entry hour 1.12236-1.12535 = 29.9 pips (just under 30: PH2 quiet, full), net -27.2 = WITH the sell (ran A2's way).
     NC1 (paper tag, frozen X = 15): the hour ran ~27 pips A2's way -> NC1 would SKIP. Tool confirms after the day: hour +27.2 signed, skip True.
     A2 paper SELL near 1.12236 (engine fixes the fill), paper stop about 1.12636. No order.
  10:00 London (PAPER; 8 candles, 07:00-08:45 UTC): best +22.2, worst -5.8, last +22.2. Stop 34.2 pips away at the worst.
  12:00 London (PAPER; 16 candles, 08:00-12:00): clock exit about +12.7 (best +26.0, worst -5.8).
  -> Mon result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.203R -> paper). VALID: no order placed. Checked: call committed before the bell (dc91692);
     sim balance $24,926.03 unchanged, trading days 73. Trade mistakes 0; process mistakes 0. (The feed had normal London candles on 08-31.)
     PAPER A2, day 39 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-09-01 --check 2015-08-31`): sell, clock exit, +0.31R; the other side -0.37R.
     A2 paper running from 07-08: 39 days, -1.56R.
     NC1 FORWARD day 1 (`python bt/no_chase_hour.py 2015-09-01 check 2015-08-31`): hour +27.2 A2's way -> SKIP day 1 of 30; A2 on that day +0.31R
       (a skip that would have missed a winner). NC0 (hour 15+ against): no.
     YM1 FORWARD day 1 (`python bt/ym_forward.py 2015-09-01 forward 2015-08-31`): SELL, AGREE with A2; YM1 +0.31R, YM0 -0.37R, stressed +0.27R.
       1 of 80; disagree days 0 of 25.
     EN2 FORWARD (`python bt/en2_forward.py 2015-08-28 2015-09-01`): 0 trades so far.
     Paper lines: UN3 agreed (day 95): agree days -11.33R in 73; disagree days +4.72R in 22. PH2 (day 87): quiet (29.9) -> full = +0.31R;
     51 lively -7.80R; 36 quiet +0.67R; PH2 about -3.74R against A2's -8.17R.
     MO PAPER RULE (day 45 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 +0.31R (running -4.36R).
     For Tuesday (tool): MO1 -0.177R -> paper; MO3 -0.183R -> paper. Tuesday 09-01: August month-end review.
     How it feels: calm. First NC1 skip tag was a winner; one day says nothing.

## 08-31 evening test: idea 150 HL, skip A2 against the daily lows/highs (journal/2015-idea-HL-against-the-daily-structure.md)
From my W06 note ("sold into higher lows"). Prereg, counts (N = 1 by rule, 50 skips) and worked case pushed before the run. R = engine A2 after
costs 1.0 + 0.1: skipped days +0.212R vs kept +0.121R, gap -0.091R, p 0.71 -> KILLED on all four lines. Ideas 150, variants 400.

## Tue 09-01
07:00 London PAPER CALL (written before the bell). Numbers from `bt/call_numbers.py 2015-09-01`:
- 3-day gap -102.7 pips -> A2 side SELL. 5-day gap -407.7 -> UN3 agree. Night 00:00-07:00: 1.12150-1.12815, last 1.12789 (range 66.5, net +61.0, against the sell).
- Monday's London day: 1.11693-1.12624, close 1.12099 (range 93.1, close position 0.44); no 3-day extreme. ADR5 180.6 (tool). 10-day trend UP.
- Monitor for today -0.177R (MO1), -0.183R (MO3) -> BOTH PAPER. Route A closed until 09-21; routes B and C empty. NO ORDER.
- A2 paper plan: sell at the 08:00 open, stop 40 pips above, out 12:00.
- Forward counts (paper): EN2, YM1 day 2, NC1 day 2 - read from their tools after the day. NC1's K2 forward reading written into the plan this morning (coach).
- How I feel: fine. Second morning running with a 60-pip night against the sell.
  08:00 London (PAPER): pre-entry hour 1.12766-1.12984 = 21.8 pips (quiet: PH2 full), net about +4 against the sell. A2 paper SELL near 1.12830
     (engine fixes the fill), paper stop about 1.13230. NC1: hour about 4 pips AGAINST A2 -> kept (tool after the day: -4.1). No order.
  10:00 London (PAPER; 8 candles, 07:00-08:45 UTC): best +19.1 (first 15 minutes), worst -50.0 -> the paper stop was reached in the 07:45 UTC
     candle (high 1.13320); price then came all the way back (last +6.7). Stopped first: the comeback does not count.
  -> Tue result, TAG FIRST: NO LIVE TRADE - BY RULE (monitor -0.177R -> paper). VALID: no order placed. Checked: call committed before the bell (069cfb5);
     sim balance $24,926.03 unchanged, trading days 73. Trade mistakes 0; process mistakes 0.
     PAPER A2, day 40 (engine, costs on 1.0 + 0.1; `python bt/coin_control.py 2015-09-02 --check 2015-09-01`): sell, STOPPED, -1.00R; the other side -0.32R.
     A2 paper running from 07-08: 40 days, -2.56R.
     NC1 FORWARD day 2 (tool): hour -4.1 (against A2) -> KEPT; NC0 no. Skip days 1 of 30.
     YM1 FORWARD day 2 (`python bt/ym_forward.py 2015-09-02 forward 2015-08-31`): BUY, DISAGREE with A2 -> YM1 -0.32R, YM0 -1.00R, stressed -0.37R.
       2 of 80, net -0.01R; disagree days 1 (net -0.32R), agree days 1 (+0.31R).
     EN2 FORWARD (tool): 0 trades so far.
     Paper lines: UN3 agreed (day 96): agree days -12.33R in 74; disagree days +4.72R in 22. PH2 (day 88): quiet (21.8) -> full = -1.00R;
     51 lively -7.80R; 37 quiet -0.33R; PH2 about -4.74R against A2's -9.17R.
     MO PAPER RULE (day 46 of 60): both off: MO1 0.00R (running 0.00R), MO3 0.00R (running -1.80R); A2 -1.00R (running -5.36R).
     For Wednesday (tool): MO1 -0.143R -> paper; MO3 -0.165R -> paper.
     How it feels: a stop by 10 pips, then the price came back to the entry by 10:00. The stop is the rule; noted, not acted on.

## 09-01 evening: August month-end review (journal/2015-08-month-end-review.md) and YN exits (journal/2015-YN-exits-and-management.md)
Review: 0 live trades, 21 valid days flat by rule, A2 paper August +1.94R (9 of 21 stopped), gate re-check +0.60R = 1.8% (stands), YM1 2 of 80,
NC1 1 skip of 30, EN2 0; August goal: 3 numbers corrected after a push; and the review itself had 2 memory numbers, corrected after its push
(September correction 1).
YN exits (coach: best near miss, exits not entries): out 10:00 / 16:00 / break-even at +20 all KILLED against base (R after costs 1.0 + 0.1).
YN's own 13 unseen trades since its test lost ~3.9R: +0.070R -> +0.032R. Ideas 151, variants 403.

## Wed 09-02
07:00 London PAPER CALL (written before the bell). Tool lines, printed and written by this same command:
    London day 2015-08-28 high 1.13097 low 1.11559 close 1.118 close position 0.16 range 153.8
    London day 2015-08-31 high 1.12624 low 1.11693 close 1.12099 close position 0.44 range 93.1
    London day 2015-09-01 high 1.1332 low 1.12082 close 1.13131 close position 0.85 range 123.8
    yesterday made the 3-day high: True | the 3-day low: False
    night 00:00-07:00 London: open 1.12981 high 1.13005 low 1.12606 last 1.12847 | range 39.9 | net -13.4
    3-day gap 67.3 | 5-day gap -201.0 | ADR5 160.3 | gap / ADR5 0.42 | 10-day trend: UP (1.13131 vs 2015-08-18 1.10216)
    MO1 N=40 pause: monitor for the NEXT day after 2015-09-01 = -0.143R -> PAUSE (paper) | last 5 monitors: 08-26:
    MO3 N=60 pause: monitor for the NEXT day after 2015-09-01 = -0.165R -> PAUSE (paper) | last 5 monitors: 08-26:
- A2 side BUY (3-day gap +67.3). UN3 DISAGREE (disagree day 23 of 30) (5-day gap -201.0).
- Both monitors under +0.60R -> PAPER. Route A closed until 09-21; routes B and C empty. INACTIVITY: 57 calendar days since 07-07, start-date
  question with the coach; both readings say no live trade today (plan section 9). NO ORDER.
- A2 paper plan: buy at the 08:00 open, stop 40 pips, out 12:00.
- Forward counts (paper): EN2, YM1 day 3, NC1 day 3 - from their tools after the day.
- How I feel: fine.

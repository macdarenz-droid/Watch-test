# FUNDED ACCOUNT - month-end review, May 2015 (written Fri 05-29 after the last trade of the month, before any new test; coach 05-29)
Sim clock Fri 2015-05-29 22:00 London. Every figure from a tool print of today: bt/daily_numbers.py 474.84 25349.14, the trade list (sim/trades.csv),
bt/live_vs_bt.py 2015-05-30, and git for the counts at the end of April (commit fba3d75).

## The month in numbers
| | May 2015 | April 2015 (for scale) |
|---|---|---|
| Trades | 21 | 22 |
| Wins / losses | 11 / 10 | 11 / 11 |
| Win rate | 52% | 50% |
| Net R | -2.00R | +4.17R |
| P&L | -$252.34 (-0.99% of the $25,516.00 I started the month with) | +$517.39 |
| Average R per trade | -0.095R | +0.189R |
| Average win / average loss | +0.68R / -0.95R | +1.02R / -0.65R |
| Full stops / noon losers | 9 / 1 | 6 / 5 |
| Best day | Tue 05-19: +2.17R, +$271.25 | - |
| Worst day | Mon 05-04: -$128.34 (-0.50%); every losing day but one was a full stop of about -$125 | -0.52% |
| Deepest drawdown | -1.83% (Fri 05-22; 3.69R under the equity high, a new live maximum) | -1.63% |
| Drawdown at month end | -1.71% (3.45R under the high) | 0.00% |
| Buys / sells | 9 trades -1.68R / 12 trades -0.32R | - |
| Weeks | W18 (1 day) +0.44 | W19 +1.01 | W20 -1.85 | W21 -1.84 | W22 +0.24 | - |
| Trade tags | 21 valid (11 wins, 10 "valid setup, market disagreed"), 0 my mistake | 22 valid, 0 mistake |
| Process mistakes | 6 (P4 05-05, P5 05-06, P6 05-06, P7 05-14, P8 05-20, P9 05-27) | 2 |
| Balance (tracker) | $25,516.00 -> $24,914.52 (after -$252.34 trading and a $349.14 payout) | -> $25,516.00 |
My first losing month on the funded account.

## Payout check
- 05-08 (third date): balance $25,698.28 -> requested $349.14 (half of what was above $25,000), $279.31 mine. High-water lowered by the payout to $25,349.14.
- 05-22 (fourth date): balance $24,884.45, not above $25,000 -> $0, by the rule as written.
- Total since the start: $474.84 requested, $379.87 mine. May alone: $349.14 requested, $279.31 mine - more than April's two payouts together, in a losing month,
  because the rule paid out at the high on 05-08. The rule did its job: it took money off the table before the drawdown, and it asked for nothing in it.
- Next date Fri 06-05: tonight the balance is $24,914.52, $85.48 under $25,000. Unless the first week of June brings it back above, the request is $0 again.
- Rule unchanged. No payout while a size trigger is on; none is on.

## Was May inside what I should expect? (numbers, not feelings)
- The written normal range (05-19, from reshuffles of my own trades): up to 6 losses in a row and about 5.9R of drawdown for 56 trades. May's worst: 3 in
  a row, 3.69R. Inside. The half-size trigger ($24,588.67) was never reached; the nearest was $295.78 away on 05-22.
- At my planning edge (+0.18R) 21 trades should make about +3.8R; I made -2.00R. Without the one jump candle of 05-19 the month is -4.17R. So May was a bad
  month by about 6R against plan - and one lucky candle wide. I say both halves of that sentence.
- What changed against April is the LOSS side again: 9 full stops in 21 trades (43%) against 6 in 22, and almost no small noon losers (1 against 5).
  The average loss went from -0.65R to -0.95R; the average win shrank from +1.02R to +0.68R (best three days +3.93R against +5.47R).
- Live record since 03-02: 65 trades, 58% wins, +0.22R a trade (+-0.26), max drawdown 3.69R; full stops 29% of trades against 8% in the January-February
  backtest. The A2 alarm (at 100 live trades: average >= +0.10R, drawdown <= 8R) reads +0.22R and 3.69R with 35 trades to go. +0.22R is above the planning
  edge and its error band now touches zero from above (+0.22 - 0.26). I do not know that the edge is still there. I know the rule that judges it.

## Did I trade the plan?
- 21 of 21: call written and committed at 07:00 London before the entry bar, entry 08:00, 0.31 lots, 40 pip stop never moved, noon exit, one trade, no skip.
- Size unchanged after the +2.17R day and after each of the nine stops. No rule of A2 changed in the month.
- One risk-plan change, at the coach's direction and written before the trade of 05-15: personal stop from 5% to 7% under the high-water, held for funded
  days 36-55 (11 done). Checked by simulation (WS): safer against my own stop, never near the firm's line.
- Emotion log, honestly: 05-19 I wanted to bank +3R at 09:00 and did not; 05-22 "flat and a little sick of the 08:00 candle"; 05-25 the wish to bank
  a small win after three stops. None of them moved a hand.

## The process mistakes - where the month was weak
Six in one month against two in April, and five of the six are one species: a number or a rule written without the tool or without one case worked by hand.
P4 two counts from memory; P6 two uncomputed statements; P7 a simulation method not hand-checked (one scenario void, a re-run needed); P8 head arithmetic in
a result note; P9 a reading rule that compared R across stop sizes. (P5 was different: three paper gates applied a week late; fixed by the Friday list,
which has not missed since.) None touched a trade or a figure of record. All were found by me, most the same hour. That is the good half. The bad half:
the fix I wrote each time was local, and the same species came back four times.

## Research in May (for the record; nothing adopted)
- Ideas 48 -> 69, variants 131 -> 192: 21 ideas and 61 variants in 21 trading days. Trading ideas adopted: 0.
- Every number of the rule re-tested on all history and none moved: lookback 3 days (LB), entry 08:00 (ET, LD), stop 40 pips (SA), exit 12:00 (XT, TW).
  Both clocks are tops of hills. The MFE / MAE log says why management ideas die: stops are wrong from the first minute, winners need 10-20 pips of room.
- Risk side: DC and TS priced the down-tail (worst day seen about 1.5%; my own stop, not the firm's line, is what a jump threatens); WS widened it.
- Paper tags at month end: UN3 6 of 30 disagree days (A2 +1.42R on them - against the tag so far); PH2 17 of 60 lively days (lively -3.04R, quiet +1.06R -
  with the tag so far, one month); MB1 5 kept trades -3.24R, 7 removed +8.64R (upside down; dead on lived days by the 05-26 check; its early-close
  lines not reached).
- The coach's warning of 05-26 is the lesson of the month: 66+ looks at one history make any backtest win weak. MB1's +0.695R became +0.213R on lived days.

## ONE process goal for June
EVERY NUMBER AND EVERY TEST RULE GETS ONE WORKED CASE BEFORE IT IS PUSHED.
- In a pre-registration: each kill line and each reading rule is worked once on one real day or one hand sum, and that worked line is IN the file I push.
- In a day note: no figure without a tool print or a python line behind it; no sentence with "about" and a number that the tool did not give.
- How I will know: the count of process mistakes of this species (a number or rule corrected after a push) in June. Target 0. May had 5.
  I count it in the June review, and I report the count to the coach whatever it is.
(Not a goal, a consequence: fewer, slower tests. 21 ideas in a month is how five unworked lines got through.)

## June plan - nothing else changes
A2 as frozen; 0.50% = 0.31 lots; half size at 3% under the high-water ($24,588.67 today), personal stop 7% under ($23,574.70) until the review after funded
day 55; payouts every 14 days from 06-05 by the written rule; paper tags and counts-only lines by their own files; Friday gates list every Friday;
A2's alarm at 100 live trades (65 done).

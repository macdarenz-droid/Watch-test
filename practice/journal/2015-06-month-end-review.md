# JUNE 2015 - month review, funded account (one page). Written Wed 2015-07-01 after funded day 69, before any July test.
Figures from `python bt/daily_numbers.py 567.04 25256.94`, the tracker's daily log, `bt/coin_control.py`, `bt/regime_or_noise.py` and a python line over history to 06-30.

## The month in numbers
| | June | (May) |
|---|---|---|
| Trades | 22 (one every weekday, none skipped) | 21 |
| Wins / losses | 8 / 14 (36% wins) | 11 / 10 |
| Net R | -1.34R | -2.00R |
| $ | -$174.53 | -$252.34 |
| Full stops | 9 of 22 (41%) | 9 of 21 |
| Best / worst day | +2.87R (+$366.11, 06-04) / -1.00R (-$130.82 = -0.53% of the day's balance, 06-23) | |
| Deepest drawdown in the month | -2.65% (06-29; 5.27R under the equity high, 7 losses in a row 06-19 .. 06-29) | -2.22% |
| Trade tags | 22 valid, 0 my mistake | 21 / 0 |
| Process mistakes | 2 (P10 a missed gate, P11 truncated paper-tag files) | 6 |
| Payouts | 2 dates: $68.70 (06-05) + $23.50 (06-19) = $92.20 requested, $73.76 mine | $349.14 |
| Size rule | never on; closest: the 06-29 close, $87 above the half-size line (and 07-01: $24 above) | never on |
Funded account since 03-27: 68 trades to 06-30, +1.80R; balance $24,647.79 on 06-30; $567.04 paid out in all.
The month in one line: -1.3R with two good stretches (06-02 .. 06-04, 06-12 .. 06-18) and three bad ones; every trade taken, every stop left alone.

## Valid versus mistake
All 22 trades followed the plan: call committed before the bell, 0.31 lots, 40 pip stop never moved, noon exit, one trade. On 06-29 and 06-30 I
wrote that I wanted to skip and did not. The losses are the market's, the process mistakes are mine: a gate I forgot (06-03) and a helper line that
silently emptied three files for eleven days (found 06-30).
JUNE GOAL ("a worked case before every pushed number or test rule"), measured as I said I would: numbers or rules corrected after a push: 3
(06-12 a stale label, 06-17 a wrong description on a test line, 06-18 a count typed from memory) against 5 in May. Better, not zero. The worked
case caught three more BEFORE a push (VL's day window, the wrong "gap fill" memory in WG, the weekday label in RG). What it did not catch: P11,
because that was not a number but a write I never read back.
JULY GOAL (set in today's call): the June rule stays, and after every write to a file I read back the line count and the last row in the same command.
(Its first catch came within hours: this very file was not written the first time - a failed directory change - and the read-back showed it.)

## What changed in the market (python over history; engine A2; the signal is "right about the morning" when 08:00 -> 12:00 goes my way)
| month | euro, first open -> last close | month's high-low | London-day range | morning range | signal flips | signal right about the morning | A2 | A2's stop rate / a coin's | side advantage a day |
|---|---|---|---|---|---|---|---|---|---|
| Jan | 1.1932 -> 1.1285 (-647 pips) | 1009 | 140 | 77 | 4 | 79% | +14.89R | 11% / 32% | +1.30R |
| Feb | 1.1311 -> 1.1197 (-114) | 358 | 115 | 53 | 5 | 55% | +4.67R | 5% / 18% | +0.52R |
| Mar | 1.1181 -> 1.0731 (-450) | 778 | 167 | 66 | 4 | 77% | +12.21R | 18% / 41% | +1.12R |
| Apr | 1.0731 -> 1.1224 (+493) | 746 | 139 | 69 | 5 | 59% | +4.21R | 27% / 34% | +0.31R |
| May | 1.1224 -> 1.0983 (-241) | 648 | 128 | 65 | 5 | 57% | -2.03R | 43% / 40% | -0.07R |
| Jun | 1.0980 -> 1.1144 (+164) | 549 | 152 | 72 | 7 | 41% | -1.40R | 41% / 36% | -0.08R |
- The days are as big as they were (London-day range 152 pips in June against 140 in January; mornings 72 against 77). What is gone is the DIRECTION:
  the euro fell about 1,200 pips from January to the end of March and has gone up 493, down 241, up 164 since - three months that cancel.
- The signal flipped 7 times in June (4-5 before) and was right about the morning 41% of the time (79%, 55%, 77% in the first three months).
- My stop rate against a coin's - the monthly row I promised on 06-25: 41% against 36% in June. Second month at or above the coin.
- So the plain reading: A2 is a rule that pays when a multi-week move is under way and the last three days point along it. From January to March
  that was almost every week. Since April the market has made the same-sized days inside a range, and three days of direction no longer say
  anything about the next morning. I wrote on 04-17 that I had only ever traded a falling market; this is the answer to that sentence.
- What I do not know: whether the range is the exception or the fall was. One half-year cannot say.

## Decisions and standing lines (nothing new decided here)
- A2 unchanged, 0.50%, size rule exactly as written; worry lines W1-W6 read: only W3 crossed (reported). RG's finding stands; MO runs on paper (day 2 of 60).
- Closed in June: MB1 (its own early-close line), GB2 / GB3, LK twice, every filter and second setup tried (12, none alive).
- Open paper lines: UN3 (12 of 30 disagree days), PH2 (31 of 60 lively days), GB1 (3 of 15), MO1 / MO3 (2 of 60), the counts.

## The next backtest, picked from this review
The table says the signal's worth went with the market's direction at the scale of weeks. MO watches my own RESULTS, which is slow (a 40-day average).
The review suggests a more direct thing to ask: is there a measure of the MARKET, known at 07:00, that says "a multi-week move is under way",
and does the side advantage follow it? One candidate, the plainest: how straight the last N days were - the net move over N days divided by the sum
of the daily ranges. The trap is obvious and I name it now: ANY measure that was high from January to March and low since will "explain" one change.
So the test must ask more than that: does the measure sort the days INSIDE each half of the history, where the calendar cannot help it?
Kill lines first, as always.

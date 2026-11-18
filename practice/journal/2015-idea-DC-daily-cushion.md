# Idea DC (idea 58): does 0.50% leave a daily-loss cushion in the WORST case? - PRE-REGISTRATION (pushed before any code or count)
Coach 05-13: "two valid losses in a row: check your sizing still leaves daily-loss cushion." Sim clock Thu 2015-05-14 01:00 London. END 2015-05-14.
What I already know (from the log): one trade a day, risk $125 = 0.50%; worst live loss -1.03R; the daily limit is 5% of the start-of-day balance (README).
That is the cushion on a NORMAL stop. What I have never measured is the abnormal stop: a minute that jumps through my stop and fills far beyond it.
This is a stress test of a size, not a search for an edge. No new entry, no filter.
Did I look at losers first (coach 05-12)? The relevant losers are my 13 live full stops; I walked each of them bar by bar when they happened and the worst
recorded is -1.03R. None was a jump. So the pictures cannot answer this; only a count over every minute of history can.
Hypothesis: with one A2 trade a day at 0.50% and a 40 pip stop, no day can cost more than 1.25% of the balance (a quarter of the daily limit), even when
the stop fills at the worst price of the minute that touched it, and even if the biggest minute ever seen in my trading window lands on my stop.
Measurements (M1 bid candles, London time, all A2 days before 2015-05-14; 3 variants):
- DC1 "worst in the minute": every A2 stop day re-filled at the extreme of the M1 candle that first touched the stop (sells: that candle's high + spread +
  slippage; buys: its low - slippage). Report the worst day and the average extra loss per stop.
- DC2 "biggest minute": the largest M1 high-low range between 08:00 and 12:00 London on any weekday in history, whether I was stopped or not.
  Hypothetical worst day = -(40 + that range + 1.1) / 40 R.
- DC3 "two trades in one day" (only for the MB1 paper file; MB1 is NOT live): DC2's loss at 0.50% plus the same construction for a 30 pip stop in
  12:00-17:00 London at 0.25%.
Kill lines for the claim "0.50% leaves cushion":
- K1: DC1 worst day not below -1.50R (0.75% of the balance).
- K2: DC2 hypothetical worst day not below -2.50R (1.25%).
- K3: DC3 not above 2.0% of the balance in one day (reported for the MB1 file; a failure is written into MB1's promotion rule, it cannot change A2).
If K1 or K2 fails: I do NOT change the size myself (size changes only by pre-written triggers). I report it and put a size proposal to the coach.
Known limit, said now: 4.5 months of minutes. The worst minute of the next two years is not in there. A pass means "no problem seen", not "safe".
Mechanics hand-check before totals: one live stop day (05-12) against the sim's own fill (1.12239 at 08:18 London).
My guess, written now: DC1 worst about -1.2R; biggest morning minute 40-60 pips -> DC2 about -2.3R, a narrow pass; DC3 about 1.7%.

## Mechanics hand-check (`python bt/day_cushion.py 2015-05-14 --check 2015-05-12`)
05-12: sell 1.11837, stop 1.12238; first M1 candle touching the stop: 08:18 London, high 1.12319. The sim filled my real stop at 1.12239 at 08:18: same minute.
Worst fill in that minute 1.12330 = 9.2 pips beyond the stop = -1.23R instead of -1.00R.

## Results (run once; `python bt/day_cushion.py 2015-05-14`; figures copied from the print)
92 A2 days, 16 engine stop days, all 16 found on M1. Engine worst day -1.03R.
| measurement | result | as % of balance at 0.50% | line | verdict |
|---|---|---|---|---|
| DC1 stop filled at the worst price of its minute | worst day -1.33R (03-19, 13.7 pips beyond the stop); average 3.9 pips beyond; average stop day -1.10R (engine -1.02R) | 0.67% | >= -1.50R | PASS |
| DC2 biggest minute 08:00-12:00 London | 81.7 pips (01-15 09:35); 99.9th percentile of 22,560 minutes: 24.3 pips; hypothetical worst day -3.07R | 1.54% | >= -2.50R | FAIL |
| DC3 A2 worst + a 30 pip afternoon stop at 0.25% | biggest minute 12:00-17:00: 124.3 pips (04-03 13:30); 30 pip stop worst -5.18R = 1.29%; both in one day | 2.83% | <= 2.0% | FAIL |
The five biggest morning minutes are all 01-15, 09:34 to 09:38, one after another. The four biggest afternoon days are different days, all at 13:30-13:44.

## My guess against what happened
DC1 "about -1.2R": -1.33R, close. Biggest morning minute "40-60 pips": 81.7. DC2 "about -2.3R, narrow pass": -3.07R, FAIL. DC3 "about 1.7%": 2.83%.
I underestimated the tail every time. That is the lesson of this test more than any single number.

## What it means, said plainly
- The claim as I wrote it ("no day can cost more than 1.25%") is FALSE on my own history. One minute in 4.5 months was big enough to cost about 1.54%.
- Against the firm's real limit the answer to the coach's question is still yes: 1.54% against a 5% daily limit is more than 3 times cushion, and an ordinary
  stop (0.50% to 0.67%) is 7 to 10 times. Two valid losses in a row change nothing here: each day starts a new 5%.
- What I had wrong was my own picture: "a stop costs 1R". A normal stop costs about 1.10R when filled badly, and a jump day could cost 3R. My size rule's
  triggers ($24,588.67 half size, $24,081.68 stop) are counted in closed balance, so one jump day from just above trigger 1 could land near trigger 2.
  It could not reach the account line: that is 10% away.
- Weakness of the measure, both ways: (a) one minute's range overstates a fill, because a stop fills somewhere inside the candle, not at its end; (b) five
  jump minutes in a row on 01-15 mean one minute UNDERSTATES what a stop could meet if the market has no price for several minutes. I did not test (b):
  three variants are used. It stays written as an open risk.
- 4.5 months of minutes. A pass on K1 means "no problem seen".

## Decision (as pre-written: I do not change the size myself)
- Size stays 0.50%. No trigger of the size rule was reached, and no rule changes off a losing week.
- PROPOSAL TO THE COACH (not acted on): keep 0.50%; the plan now states the worst case honestly ("normal stop about 1.1R; jump day seen in history about 3R =
  1.5%"). If the coach wants the 1.25% line held, the size that holds it is 0.40% (1.25 / 3.07 = 0.41). I do not ask for that: the real limit has 3x cushion.
- MB1 (paper): K3 failed, so as written this goes into its promotion rule: the afternoon has jump minutes of 100 pips or more around 13:30 on four different days
  in history; a 30 pip stop there could cost about 5R. Any future proposal for MB1 must keep "A2 worst + MB1 worst" at or under 2.0% of the balance on the then
  history: today that would be about 0.09% (0.46 / 5.18), not the 0.25% I wrote yesterday.
Counts: ideas 58, variants 159 (DC1 DC2 DC3). Adopted: 0. On paper: UN3, PH2, MB1.

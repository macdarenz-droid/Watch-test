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

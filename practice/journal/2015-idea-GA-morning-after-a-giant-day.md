# Idea GA (idea 74): no A2 trade on the morning after an unusually wide day - PRE-REGISTRATION with worked cases (pushed before the script is written or run)
Sim clock Thu 2015-06-04 01:00 London. END 2015-06-04. Coach 06-03: one idea to make A2 itself better, kill line first, variants counted.
## Where it comes from
My two fastest stops: 03-19 (15 minutes; the morning after the 400 pip evening of 03-18) and 06-03 (11 minutes; the morning after the 278 pip day of
06-02). I wrote the first into this morning's worry line before the second happened. Two cases, both seen: they are the inspiring days and are DROPPED.
## Hypothesis
After a day whose London-day range was at least 1.5 times the average range of the five days before it, the next morning has no A2 edge: the market is
digesting, the 3-day signal is mostly that one day, and my 40 pip stop sits inside the after-shocks.
Known against it, stated: XS found that my most stretched signals are my BEST trades (+0.625R in 24), and a giant day usually makes a stretched signal.
The honest prior is "no effect, or the opposite".
## Definition (known at 07:00, before the entry)
ratio = yesterday's London-day range (22:00 to 22:00, as in bt/call_numbers.py) / the average range of the five London days before yesterday.
WORKED CASE (June goal), 06-03 by a python line from my own call figures: yesterday 278.3 pips; the five before 117.7, 109.8, 91.3, 80.4, 101.2 (mean
100.08) -> ratio 2.78. The counting script printed 2.78 for 06-03 and 2.82 for 03-19.
## Variants (3; A2 unchanged on all other days; a skipped day = 0R)
- GA1: no trade when ratio >= 1.5. GA2: >= 1.3 (neighbour below). GA3: >= 2.0 (neighbour above).
## Sample, counted WITHOUT results before this push
103 A2 days have a ratio (the first days of January have no five-day history). ratio >= 1.3 on 26 days, >= 1.5 on 12, >= 1.75 on 8, >= 2.0 on 6.
With the two inspiring days dropped GA1 skips 10 trades: exactly my sample line. Thirty cannot be reached. Said now: a pass could only earn a
forward paper tag, and only after the lived-days table.
## Kill lines (decision set = all A2 days before 2015-06-04 without 03-19 and 06-03, costs on; written for GA1; one failure kills)
- K1: the skipped trades average -0.50R or worse.
  [WORKED: if the ratio means nothing, 10 A2 trades average about +0.31R with a standard error of 0.33R; an average of -0.50R or worse would come up by
   chance in about 0.7% of cases. So K1 is a hard line on purpose; under "no effect" I expect it to FAIL.]
- K2: the filter costs no money: net R of GA1 >= A2's net R and max drawdown not larger.
- K3 neighbours: the skipped groups of GA2 (>= 1.3) and GA3 (>= 2.0) both average below 0R. (BH died here.)
- K4 sample: at least 10 skipped trades in the decision set. [WORKED: 12 - 2 = 10 -> expect PASS, on the line]
- K5 lived days (coach's bar): the skipped trades that are lived days (from 03-02) average below 0R, and GA1 is not behind A2 on lived days.
Reported beside: the same with the two inspiring days back in; the skipped days listed one by one.
Hand-check before totals: the ratio of two days against a hand sum (06-03 above; one more from the print).
My guess: under my own prior K1 fails and GA1 is killed; the skipped group will be about as good as any other A2 day.

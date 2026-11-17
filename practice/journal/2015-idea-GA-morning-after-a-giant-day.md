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

## Mechanics hand-check (`python bt/giant_day.py 2015-06-04 2015-03-19,2015-06-03 --check 2015-06-03,2015-05-20`)
06-03: yesterday 278.3 pips; five days before 117.7, 109.8, 91.3, 80.4, 101.2 (mean 100.08) -> ratio 2.78: the worked case to the digit.
05-20: yesterday 208.0; five before 144.4, 180.4, 104.1, 143.0, 150.5 (mean 144.48) -> ratio 1.44: the same ranges my 07:00 calls recorded on those days.

## Results (run once; `python bt/giant_day.py 2015-06-04 2015-03-19,2015-06-03`; costs on; figures copied from the print)
DECISION SET: 101 A2 days with a ratio, the two inspiring days dropped. A2 net +31.91R, +0.316R a trade, max DD 4.54R; from 03-02 +15.94R.
| variant | skipped | wins | avg R of skipped | net of skipped | full stops | lived days among them (avg) | rule net (vs A2) | lived days: rule vs A2 |
|---|---|---|---|---|---|---|---|---|
| GA1 ratio >= 1.5 | 10 | 6 | +0.817 | +8.17 | 2 | 3 (+0.948R) | +23.74 (-8.17) | +13.09 vs +15.94 |
| GA2 ratio >= 1.3 | 24 | 15 | +0.600 | +14.40 | 4 | 13 (+0.500R) | +17.51 (-14.40) | +9.44 vs +15.94 |
| GA3 ratio >= 2.0 | 4 | 2 | +1.041 | +4.17 | 1 | 1 (-1.003R) | +27.74 (-4.17) | +16.94 vs +15.94 |
GA1's skipped days (ratio: result): 01-16 2.31 +1.11 | 01-19 1.53 -1.00 | 01-23 2.34 +4.30 | 01-26 1.57 +0.31 | 02-04 1.95 -0.24 | 02-23 1.58 +1.09 |
02-27 2.09 -0.23 | 03-09 2.09 -1.00 | 03-11 1.59 +1.97 | 04-30 1.83 +1.88.
Reported only, all 103 days (the two inspiring days back in): GA1 skips 12 trades averaging +0.509R and is 6.11R behind A2; GA2 12.34R behind; GA3 2.11R behind.

## Kill lines for GA1 (decision set)
| line | worked expectation | result | verdict |
|---|---|---|---|
| K1 skipped trades average -0.50R or worse | under "no effect" about +0.31R; expect FAIL | +0.817R | FAIL |
| K2 costs no money | - | -8.17R against A2 | FAIL |
| K3 neighbours' skipped groups below 0R | - | +0.600R and +1.041R | FAIL |
| K4 at least 10 skipped trades | 10, on the line | 10 | PASS |
| K5 lived skipped trades below 0R and rule not behind on lived days | - | +0.948R; rule 2.85R behind | FAIL |
VERDICT: GA1 KILLED on four lines. No tag.

## My guess against what happened
"K1 fails; the skipped group about as good as any other A2 day": it failed, and the skipped group is not "as good" - it is my BEST group: +0.82R a
trade against +0.32R, at every threshold. The idea was not just empty, it pointed the wrong way.

## What I learned
- The morning after a wide day is where A2 earns most: 01-23 (+4.30R, my best day ever) followed a day 2.34 times its recent range; 03-11 and 04-30
  too. My two fastest stops (03-19, 06-03) are the two failures of a group that otherwise made +8.17R in 10 trades. I remembered the two that hurt.
- This is XS again from another side ("most stretched = best trades"), and the coach's sentence of 04-29: do not filter the winners away. A filter built
  on my worst mornings keeps removing my best ones, because the same condition - a market that has just moved a lot - produces both.
- Three thresholds, one answer, both halves: no "maybe". It took one counted sample, one worked expectation and one run to kill, and the worked
  expectation ("under no effect expect about +0.31R, K1 fails") told me beforehand how hard the line was.
- For tomorrow morning: the worry line may still name what I see; it carries no weight. After a giant day the rule's record is better than usual.
Counts: ideas 74, variants 207 (GA1 GA2 GA3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Numbers or rules corrected after a push in June: 0.

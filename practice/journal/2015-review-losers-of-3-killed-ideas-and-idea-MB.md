# Review: the losing trades of my last 3 killed ideas (BX, SI, TD), by eye - then idea MB
Coach 05-12: "before testing, scroll the losing trades of your last 3 killed ideas by eye and write what they had in common. quality over count."
Sim clock: Wed 2015-05-13 01:00 London. History used: everything before 2015-05-13 (END 2015-05-13).

## How I picked the charts (rule written into bt/losers3.py before drawing)
The LAST 8 losing days of each idea's first variant (BX1, SI1, TD1), no picking. `python bt/losers3.py 2015-05-13 chart` -> list + 3 pictures (M15, 06:00-18:00 London).
Base rates from the tool: BX1 74 trades, 42 losing (-35.12R), 32 winning (+46.83R). SI1 91 days, 36 losing (-17.47R), 55 winning (+46.00R).
TD1 91 days, 38 losing (-24.05R), 53 winning (+55.76R).
Weakness of this rule, said plainly: "last 8" puts all 24 charts between 04-22 and 05-12, the same three weeks as my live losing run. It is one market mood.

## What I saw (written from the pictures, before any count)
SI1 and TD1 (16 charts, but only 9 different days):
- E4. They are A2's losing days. 7 of the 8 dates are the same in both lists, and 6 of 8 in each are plain A2 losers. Neither idea made a new kind of loser;
  both only re-priced the mornings that were already lost. On 04-23, 04-24, 05-12 nothing I do after 08:00 matters: both halves -1.00, tightened stop or not.
- E5. On 5 of the 8 the hour 07:00-08:00 had already made a big move (04-22, 04-24, 05-04, 05-11, 05-12). On 04-24 and 05-11 it was WITH me and I bought the top of
  it; on 04-22, 05-04, 05-12 it was against me. That is the PH observation again (on paper as PH2). Nothing new.
- E6. When the later action mattered, it happened near the worst price of the morning: TD's tightened stop was hit close to the extreme on 04-22 (09:40), 04-27
  (09:25) and 05-05 (09:30, a day A2 WON +0.87R); SI's 09:00 half did worse than the 08:00 half on 04-22, 04-27, 05-07 and better on 05-04, 05-11.
BX1 (8 charts):
- E1. 6 of the 8 losing breaks went AGAINST the direction the morning (08:00 -> 12:00) had travelled: 04-28, 04-30, 05-01, 05-04, 05-06, 05-12. Only 05-05 and
  05-08 were breaks with the morning. This is the one thing in the pictures I had not seen or counted before.
- E2. 3 of 8 had the direction right and were knocked out by one candle (05-01 and 05-05 by a spike at 15:00, 05-06 inside the entry candle); 04-30 was about
  70 pips in profit and gave all of it back before 17:00. I am NOT turning this into a rule: BX2 (wider stop) is already dead, and a profit target is a guess.
- E3. On 6 of the 8 the morning had been a good A2 trade (+0.45R to +1.88R). The afternoon box after a morning that already travelled is a different animal
  from a quiet morning's box.

## What the three sets of losers have in common
- C1. In all three I act LATE: after a move has already been made (BX after the whole morning; SI's second half and TD's tighter stop after the first hour).
  On the losing days the late action bought or sold close to the end of that move.
- C2. The same dates carry the losses in all three lists. A new management rule cannot change which days are bad; it only moves the price I pay on them.
  This is the fourth time I have written that sentence (PM, LK, TD, SI). For A2 I believe it now: 32 exit definitions + split entry, all closed.
- C3. Winners beside losers (my method rule): I have NOT yet looked at whether BX's winners were with or against the morning. Until that count exists, E1 is
  a story from 8 pictures of three weeks. It is testable, so it becomes the test.

## Idea MB (idea 57): the afternoon box break only WITH the morning's direction - PRE-REGISTRATION (pushed before any code or count)
Honesty first: this conditions a parked idea (BX, 3 variants used, failed K3 periods and K5 drawdown). I count it as a NEW idea with its own 3 variants, and I
say plainly that it is the 4th-6th look at the same 74 trades: the chance of a lucky split is real. It is also second-setup attempt number 10.
Hypothesis: a first break of the 12:00-13:25 London box between 13:25 and 14:30 pays when it goes the way the morning went, and does not pay when it goes
against it. Why it could be true: the morning's travel shows who is in control of the day; a break against it is a correction that the day's side buys/sells.
Why it could be false: 8 pictures from three weeks; AF showed my 3-day direction has no afternoon edge; BX is known only to +-0.33R.
Mechanics: exactly BX1 (bt/box_break.py: first break, 30 pip stop, flat 17:00, same fills, worst case inside the entry candle). Only the filter is new:
- MB1: take the break only if its side equals the sign of (12:00 open - 08:00 open), bid, London time.
- MB2: as MB1, and the morning must have travelled at least 20 pips (|12:00 open - 08:00 open| >= 20 pips).
- MB3: take the break only if its side equals the sign of (12:00 open - 00:00 open): the day so far.
Data: all A2 days before END 2015-05-13. Contamination: the 16 dates of the BX1 chart list are the inspiring days... correction, 8 dates (04-28, 04-30, 05-01,
05-04, 05-05, 05-06, 05-08, 05-12). They are DROPPED for the decision (dropping them removes 6 "against" losers, which works against my hypothesis: fine).
The undropped numbers are reported beside, not used.
Kill lines (each variant, on the dropped set; one failure kills it):
- K1 average >= +0.15R per trade.
- K2 stressed costs (3.0 pip spread, 1.0 slippage): average >= +0.05R.
- K3 positive in each period: Jan, Feb, Mar-now.
- K4 positive without its best 3 trades.
- K5 max drawdown <= 5R and worst 10 trades in a row >= -4R.
- K6 independent of A2: correlation with A2's R <= 0.30 and net >= 0 on A2's losing days.
- K7 at least 30 trades (50 cannot be reached: BX1 has 74 trades in all and the filter keeps about half; said before running).
- K8 the split itself: the trades the filter REMOVES must average at least 0.20R less than the trades it keeps, and less in both halves
  (before 03-02 and from 03-02). If the removed trades are as good as the kept ones, the filter is noise whatever K1-K7 say.
Hand-check before totals: two days' filter values against the candles (one kept, one removed).
A survivor gets a forward PAPER tag only; nothing touches A2 or the live size.
My guess, written now: kept about +0.30R, removed about 0.00R; MB1 passes K8 on the whole set but fails K3 or K5 because half of 74 trades is too few to be
positive in three periods. I expect no survivor.

## Mechanics hand-check (before totals; `python bt/morning_box.py 2015-05-13 --check 2015-04-28,2015-05-05`)
- 04-28: open 08:00 1.08740, open 12:00 1.09414 -> morning +67.4 pips; break DOWN -> MB1 remove. The chart shows the same (08:00 near 1.0875, noon near 1.094).
- 05-05: open 00:00 1.11456, 08:00 1.10905, 12:00 1.11266 -> morning +36.1, day so far -19.0; break UP -> MB1 keep, MB2 keep, MB3 remove. Chart agrees.

## Results (run once; `python bt/morning_box.py 2015-05-13`; every figure copied from the print)
DECISION SET: all A2 days before 2015-05-13 without the 8 inspiring days. BX1 there: 66 trades, +0.293R each, +19.33R.
| variant | kept n | win | avg R (2 se) | net | max DD | worst 10 | Jan / Feb / Mar-now | without best 3 | stressed avg | corr A2 / on A2 losing days | REMOVED n, avg | kept minus removed: before 03-02 / from 03-02 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| MB1 with the morning | 30 | 50% | +0.695 (+-0.65) | +20.86 | 4.58R | -1.31 | +1.64 (7) / +12.50 (6) / +6.72 (17) | +8.61 | +0.592 | +0.01 / +5.32 | 36, -0.043 | +1.088 vs +0.051 / +0.395 vs -0.109 |
| MB2 morning >= 20 pips | 16 | 31% | +0.120 (+-0.74) | +1.93 | 5.02R | -3.24 | +3.65 (5) / 0.00 (0) / -1.72 (11) | -5.63 | +0.019 | +0.08 / +0.65 | 50, +0.348 | +0.730 vs +0.490 / -0.157 vs +0.228 |
| MB3 with the day so far | 29 | 45% | +0.581 (+-0.66) | +16.85 | 5.21R | -3.82 | +2.28 (9) / +10.71 (4) / +3.86 (16) | +4.60 | +0.481 | +0.11 / -1.72 | 37, +0.067 | +0.999 vs +0.128 / +0.241 vs +0.025 |
Reported only, all days (8 inspiring days back in): MB1 32 trades +0.589R, net +18.86R, DD 4.58R, removed 42 trades -0.170R; MB2 18 trades -0.004R; MB3 30 trades +0.528R, DD 5.21R.
Base rate for E1 (all 74 trades): losers against the morning 25 of 42; winners against the morning 17 of 32; all trades against 42 of 74.

## Kill lines applied (decision set)
| line | MB1 | MB2 | MB3 |
|---|---|---|---|
| K1 avg >= +0.15R | PASS | FAIL | PASS |
| K2 stressed avg >= +0.05R | PASS | FAIL | PASS |
| K3 every period positive | PASS | FAIL | PASS |
| K4 without best 3 | PASS | FAIL | PASS |
| K5 DD <= 5R, worst 10 >= -4R | PASS | FAIL | FAIL (DD 5.21R) |
| K6 independent of A2 | PASS | PASS | FAIL (-1.72R on A2's losing days) |
| K7 >= 30 trades | PASS (30: exactly on the line) | FAIL | FAIL (29) |
| K8 removed trades clearly worse, both halves | PASS | FAIL | PASS |
VERDICT: MB2 and MB3 KILLED. MB1 passes all eight lines I wrote before running. By my own rules that makes it a FORWARD PAPER TAG and nothing more.
It is the first of 57 ideas to pass its kill test. That alone is a reason for suspicion, not for joy.

## My guess against what happened
"kept about +0.30R, removed about 0.00R": removed -0.043R (right), kept +0.695R (more than twice my guess). "MB1 fails K3 or K5": wrong, it passed both.
"No survivor": wrong.

## Why I do not trust it yet (written the same hour, before it can grow on me)
1. THE DOSE GOES THE WRONG WAY. My reason was "the morning shows who controls the day". Then a bigger morning should be a better signal. MB2 says the opposite:
   with-morning breaks after a morning of 20 pips or more made +1.93R in 16 trades; so the other 14 MB1 trades - mornings that had travelled LESS than 20 pips -
   made +18.93R (20.86 - 1.93, arithmetic from the table, not a new run). The profit sits where my explanation is weakest. Either the real thing is something
   else (a quiet morning, then the afternoon goes) or it is luck. I do not know which, and I will not run a 4th variant to find out: that is the forward tag's job.
2. The win rate hardly moves: 50% kept, 47% removed. Losers are against the morning 25 of 42 (60%), winners 17 of 32 (53%), everything 57%. What I "saw" in
   the 8 pictures (6 of 8 against) is mostly the base rate. The whole difference is the SIZE of a few kept winners (Feb: 6 trades, +12.50R).
3. 30 trades, known to +-0.65R: the true average could be +0.05R. K7 passed on the line.
4. It is the 4th to 6th cut of the same 74 trades, picked after looking at charts of them. Dropping the 8 days helps, it does not make the rest unseen:
   I knew BX1's totals and its good February before I wrote the filter.
5. Still on the other side: positive in all three periods and in both halves, positive without its best 3, positive at triple cost, no link to A2's results.
   None of my 56 dead ideas could say that.

## What I learned from the slow way
- Looking at the losers of three ideas together showed me something the single reviews had not: I always act late, and SI/TD only re-price A2's bad days.
- The eye found a pattern (6 of 8 against the morning) that was mostly a base rate (57%). The count, not the picture, has to carry the claim. Winners beside
  losers: always.
- One passing kill test after 56 failures is what chance alone would also give me now and then. The honest name for MB1 is "candidate".
Counts: ideas 57, variants 156 (MB1 MB2 MB3). Second setups tried: 10; alive on paper: 1 (MB1); adopted: 0.

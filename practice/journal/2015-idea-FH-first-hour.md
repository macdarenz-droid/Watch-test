# The first hour of my trades: losers vs winners. STUDY, then HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RULE IS RUN
Clock Fri 2015-04-10 01:00 London (end of released data). All lived history 01-06 .. 04-09 (explicit end date = the clock); London time.

## The study (descriptive only: `python bt/first_hour.py 2015-04-10`; no rule, no exit tested; features saved in bt/first_hour_features.csv)
All 68 A2 trades. For each one, the hour 08:00-09:00 London measured from my entry price (bid candles, costs ignored): fav = best pips for me, adv = worst pips against me,
c9 = pips at 09:00, loc = where the 09:00 price sits inside the hour's range (1 = at my best, 0 = at my worst), f15 = pips after 15 minutes,
peak_min / worst_min = the minute of the hour when my best / worst price was made. Medians:

| final result | n | net R | fav | adv | c9 | hour range | loc | f15 | peak_min | worst_min |
|---|---|---|---|---|---|---|---|---|---|---|
| full stop | 9 | -9.11 | 4.4 | 32.9 | -25.0 | 37.8 | 0.2 | -20.1 | 0 | 40 |
| small loss | 14 | -4.35 | 12.1 | 11.7 | -3.2 | 30.1 | 0.5 | +3.0 | 10 | 27.5 |
| small win | 22 | +7.56 | 17.6 | 9.5 | +2.6 | 28.5 | 0.6 | +5.1 | 40 | 5 |
| big win (>= 1R) | 23 | +36.15 | 27.0 | 4.0 | +18.4 | 32.7 | 0.8 | +2.0 | 45 | 0 |

Winners (45) vs losers (23): in profit at 09:00 69% vs 26% | best price made in the LAST 20 minutes of the hour 60% vs 9% | worst price made in the first 15 minutes 64% vs 30% |
first 15 minutes in my favour 64% vs 39%. Only 2 of 68 trades were stopped inside the first hour.

What I see:
1. The first 15 minutes say little (big winners: +2 pips median; small losers: +3). The start of the hour does not separate anything.
2. What separates is the ORDER inside the hour. A winner takes its heat first (worst price in the first minutes) and is making new best prices at the end of the hour.
   A loser does it the other way round: its best price comes in the first 5-10 minutes and the rest of the hour goes against it.
3. Full stops are almost never in doubt: best price at minute 0, already -25 pips at 09:00.

## Honest warnings before I turn this into a rule
- Part of this is circular: the first hour is INSIDE the result. A trade that is +18 at 09:00 is more likely to finish up simply because it starts 18 pips ahead.
  The only thing a rule can use is whether the 09:00 picture predicts the REST of the morning (09:00 -> 12:00). The table above does not show that, on purpose: that is the test.
- I have tested the nearest thing before: idea T (close at 09:00 if below zero / below -10 pips), killed, with the finding "the 09:00 state does not predict 09-12"
  (January; T2 also February). T used the P&L LEVEL at 09:00. What is new here is the ORDER of best and worst inside the hour - but the two are surely correlated.
- The exit lever was closed on 04-07 (16 exit variants, none survived). I open it once more because the coach set this study; these are exit variants 17-19.
- The thresholds below are clock splits (first quarter, last 20 minutes, bottom third), not fitted - but I chose them after seeing the medians above. That is in-sample by construction.

## Hypothesis
A trade whose best price of the first hour came early and which then spent the rest of the hour going against me has shown that the morning's buyers/sellers are not on my side;
from 09:00 to 12:00 such a trade loses on average. Closing it at 09:00 raises avg R per trade without raising the drawdown.

## Variants (90, 91, 92; ideas -> 35), no others afterwards. Entry, size, stop and the 12:00 exit exactly A2. The check is made once, at 09:00 London, on the 12 closed M5 candles 08:00-08:55.
- FH1: close at 09:00 if my best price of the hour was made in its first 15 minutes (candles 08:00, 08:05, 08:10).
- FH2: close at 09:00 unless my best price of the hour was made in its last 20 minutes (candles 08:40 .. 08:55).
- FH3: close at 09:00 if the 09:00 price sits in the worst third of the hour's range for me (loc < 1/3).

## KILL TEST (explicit). The build can only kill; a survivor gets a forward paper tag (same-trade change: 100 forward trades, >= +0.10R per trade, >= 2 SE).
A variant survives only if ALL:
  K1. on all history its avg R per trade is at least A2's + 0.05R (engine, full costs);
  K2. on the days it closes early, what it gives up is a LOSS: A2's result on those days minus the variant's result is negative, by at least 0.15R per closed day on average
      (this is the "does the first hour predict the rest" line);
  K3. consistency: variant net R >= A2 net R in at least 2 of the 3 periods (January, February, March-to-now), and in no period more than 1R behind;
  K4. max drawdown not above A2's, and it closes early on at least 10 days.
Also reported, not a kill line: how many of the closed days idea T1 (below zero at 09:00) would have closed too. If almost all, this is T under another name.
My guess: FH2 closes too many winners and fails K1 and K3; FH1 and FH3 come out within +-0.05R of A2 and fail K1 - the same answer as T.

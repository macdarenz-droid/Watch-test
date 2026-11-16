# Review of Jan-Feb 2015 (clock stopped at Fri 2015-02-27 22:00 UTC; no new candles used)

## 1. My current rules, exactly (rule A2)
1. Instrument EURUSD, one trade per weekday, never more.
2. 07:00 UTC: read D1/H4/H1, write the call. Trend = last trading day's 22:00 UTC close minus the 22:00 close three trading days before it. Up -> buy, down -> sell. No minimum size of gap.
3. 08:00 UTC: market order in the trend direction. Stop 40 pips from the 08:00 bid. No target.
4. 12:00 UTC: close at market whatever the result. Never hold into NY, never over a weekend.
5. Size 0.31 lots = $125 at the stop = 0.5% of $25k. Own max daily loss = that one trade.
6. A skip was allowed if "trend unclear" (used once, 01-22, cost ~+1.1R); not used since.

## 2. Every live trade (S = sell, B = buy, result in R; $125 = 1R)
Jan: #1S+1.34 #2S+1.39 #3S+1.12 #4S+2.06 #5S+1.10 #6S-1.00 #7S+0.18 #8S-0.51 #9S+4.27 #10S+0.31 #11S-0.99 #12B+0.28 #13B+0.52 #14B-0.02
Feb: #15S-0.34 #16B+0.15 #17B-0.24 #18B+1.08 #19B-0.19 #20S+0.77 #21S+1.26 #22S+0.40 #23B+0.34 #24B-0.34 #25B-0.32 #26B+2.14 #27B-0.47 #28B-0.36 #29B-1.02 #30S+1.09 #31S+0.19 #32S+0.73 #33S+0.01 #34S-0.23
Total 34 trades, 21 wins (62%), +14.70R, avg +0.43R. Winners avg +0.99R, losers avg -0.46R. Dates/prices: weekly journals and sim/trades.csv. Context numbers per trade: bt/review_features.csv.

## 3. The 13 losers by eye (bt/loser_charts.py: M15, yesterday + trade day, entry marked)
- #14 #17 #19 #24 #25 #27 #28 (7 buys): yesterday had ALREADY gone up; I bought near yesterday's high, at or just after its peak. #24 #25 #28 were bought on top of an 07-08 spike straight into
  the 1.1443-50 ceiling. #17 #19 #27 were bought while price had been bleeding down from yesterday's peak all night. In all seven the morning never went more than ~25-40 pips my way.
- #6 #11 #15 (sells): Asia sat flat near its high and price was already rising into 08:00; I sold a market that had stopped falling a day earlier (#11) or was at a floor (#15).
- #8 #29 #34: no clear picture (mid-range chop; #34 quiet morning after a breakdown day).
- What they share, measured: 9 of 13 came the day after a move in my direction; 10 of 13 were entered in the far half of yesterday's range (I was chasing). Average best move my way was only 14 pips.
  Only 3 of 13 hit the full stop - most losers are small noon exits, the stop is not the problem.
- Winners look different on the chart (#1 #2 #13 #18 #21 #26 #30): entry after price had pulled BACK against the trend (sold after a bounce, bought after a dip).
- Numbers on my 34 trades (in-sample, small): after a pullback day 15 trades, 73% win, +0.54R avg. After a day already my way 19 trades, 53%, +0.35R - and only +0.13R without the one +4.27R trade.
- Also checked: first London hour direction makes no difference (+0.42 vs +0.46R). Holding to 16:00 instead of noon would have LOST 191 pips over 34 trades -> keep the noon exit.
  Buys 14 trades +0.11R avg vs sells 20 trades +0.66R: that is the market (Jan fell), not a rule.
- Idea C (my replay idea) had this backwards: it kept the "chasing" trades and skipped the pullback ones. Dropped.

## 4. New hypotheses (written before running them)
- D "pullback day": the London trend leg pays when yesterday closed against the trend; after a day that already went my way I am buying the top. D1 = A2, only if yesterday's close-to-close move was against the trend.
- E "tighter stop": winners rarely go far against me first (worst winner 29 pips), so a 30 pip stop at the same $125 (0.42 lots) should lift R per trade. E1 = A2 with SL 30.
- DE = D1 + E1 together. That is my 3 variants for this round.

## 5. Before vs after, Jan-Feb 2015, mechanical backtest, costs on (1.0 pip spread + 0.1 slippage), $125 risk
| Rule | Trades | Win rate | Avg R | Net R | Max drawdown | Jan avg R (n) | Feb avg R (n) |
|---|---|---|---|---|---|---|---|
| BEFORE A2 (current) | 39 | 64% | +0.50 | +19.43 | 1.86R | +0.78 (19) | +0.23 (20) |
| D1 pullback day | 14 | 71% | +0.55 | +7.72 | 1.38R | +0.62 (5) | +0.51 (9) |
| E1 stop 30 | 39 | 64% | +0.61 | +23.72 | 2.91R | +1.04 (19) | +0.20 (20) |
| DE both | 14 | 71% | +0.75 | +10.51 | 1.54R | +0.91 (5) | +0.66 (9) |
(Backtest has 39 trades vs my 34 live: it includes the week of 01-05 that I only watched and the one day I skipped.)

## 6. Honest verdict: NOT a genuine improvement yet
- D1: avg R +0.55 vs +0.50 is nothing on 14 trades. It fixes February (same +4.6R from 9 trades instead of 20) but throws away January's trend days (+11.7R skipped). Net R falls 60%.
- E1: all of the gain is January (bigger size on the trend winners); February got slightly worse and drawdown rose from 1.86R to 2.91R. The 30 was read off these same trades = curve fit.
- DE has the best avg R and a lower drawdown, but 14 trades, both rules born from these exact trades, and less than half of A2's total profit. I would not bet a challenge on it.
- What I do believe more now: my losers are "chasing" entries in a sideways market, and the rule earns in a trend no matter where I enter. One rule cannot be right for both;
  the missing piece is telling a trend from a box BEFORE 08:00.
- Next hypothesis, written down but NOT run (I have used my 3 variants): F "regime": when the 3-day close gap is large (a trend) trade every day as A2; when it is small (a box) trade only after a pullback day.
  It needs its own count, a threshold fixed before testing, and above all months I have not seen.
- Counts: ideas 5 (A, B, C, D, E), variants 10.

## 7. Out-of-sample check: A and B exactly as frozen in January, run on February (no tweaks)
Frozen = the six definitions written on 01-09 in bt/ideas.py (A1 A2 A3, B1 B2 B3). No new variants: count stays 5 ideas / 10 variants. Costs on (1.0 pip spread + 0.1 slippage), $125 risk.
The only code change since January is the Sunday-candle fix (data handling, not a rule): January numbers are identical with and without it; February A2 would read +0.86R with the bug, +4.64R without (= my live result).

| Variant | Jan trades | Jan win | Jan avg R | Jan max DD | Feb trades | Feb win | Feb avg R | Feb max DD | Avg R kept |
|---|---|---|---|---|---|---|---|---|---|
| A1 London trend, in 07:00, out 12:00 | 19 | 68% | +0.56 | 3.02R | 20 | 50% | +0.18 | 2.17R | 32% |
| A2 same, in 08:00 (traded rule) | 19 | 74% | +0.78 | 1.33R | 20 | 55% | +0.23 | 1.86R | 29% |
| A3 SL40 TP60, hold to 16:00 | 19 | 53% | +0.30 | 3.06R | 20 | 40% | +0.00 | 3.07R | 0% |
| B1 Asia break w/ trend, SL30, out 12:00 | 13 | 69% | +0.76 | 2.10R | 13 | 54% | +0.32 | 1.05R | 42% |
| B2 same, TP45, out 16:00 | 13 | 62% | +0.53 | 2.10R | 14 | 57% | +0.34 | 1.71R | 64% |
| B3 same, SL40, out 12:00 | 13 | 77% | +0.64 | 1.02R | 13 | 54% | +0.23 | 1.02R | 36% |

Did it fall apart? Not into losses - all six stayed >= 0 after costs - but every one lost most of its edge (A kept ~30%, A3 none, B kept 36-64%). With 13-20 trades a month,
+0.2 to +0.3R per trade is not distinguishable from zero. So: January's numbers were mostly January.

### Why, from the charts (H4 Jan-Feb chart + measured from history; nothing changed in the rules)
| | Jan | Feb |
|---|---|---|
| Picture on H4 | staircase down 1.20 -> 1.11, each bounce fails under the last low | flat box 1.127-1.150 for four weeks, two false breakouts up, real break only on the last Thursday |
| Avg day range | 140 pips | 115 pips |
| Avg 08-12 range | 77 pips | 53 pips |
| Avg 08-12 move WITH my trend rule | +34 pips, right 79% of days | +11 pips, right 55% of days |
| Avg 12-21 move with my trend rule | -30 pips (NY gave it back) | +5 pips (nothing) |
1. The rule is a trend rule and February had no trend: my "trend" (3-day close change) flipped 4 times in Feb and half its signals were under 35 pips = noise.
2. The London morning itself shrank by a third, and its drift with my signal fell from +34 to +11 pips. My fixed costs (1.1 pips) and 40 pip stop did not shrink with it.
3. In January NY reversed the morning (-30 pips), so "out at noon" was a real edge. In February NY did nothing on average: the noon exit neither helped nor hurt.
4. B kept more of its edge than A (it only trades when price actually breaks the Asia range, so it sat out 6-7 dead days). That is one month and 13 trades - noted, not concluded.
What I am NOT doing: changing anything on this evidence. Two months = one trend sample and one box sample. The traded rule stays A2 as frozen.

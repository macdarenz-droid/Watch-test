# STATE

| Field | Value |
|---|---|
| Sim clock | Fri 2015-02-27 22:00 UTC (END OF RELEASED DATA - waiting for coach) |
| Phase | Challenge #1, phase 1 ACTIVE: balance $26,836.44 (+7.35%), target $27,000 (+$163.56 = 1.3R to go), 34 trading days, no breach |
| Current strategy | Rule A2 "London trend": 07:00 UTC write call; trend = yesterday's 22:00 close vs close 3 trading days earlier; 08:00 market order with trend; SL 40 pips; close 12:00 UTC; 1 trade/day; flat at weekend |
| Risk | $125/trade = 0.5% (0.31 lots x 40 pips). Own max daily loss 0.5% (1 trade/day). Reason: unproven rule; 20 straight losses to hit max loss |
| Ideas tried | 5 (A London trend-follow, B Asia-range breakout with trend, C yesterday-midpoint filter [dropped], D pullback-day filter, E 30 pip stop) |
| Variants tested | 10 (A1 A2 A3, B1 B2 B3, C1, D1, E1, DE). A and B at the 3-variant cap; review round used its 3 |
| Challenge attempts | 1 (active) |
| Last updated (real date) | 2026-11-16 |

## Results (costs on: 1.0 pip spread + 0.1 slippage)
| Period | Trades | Win rate | Avg R | Net R | Max drawdown | Notes |
|---|---|---|---|---|---|---|
| LIVE Jan (01-12..01-30) A2 | 14 | 71% | +0.72 | +10.04 (+$1,257) | 1.33R | one big downtrend; 2 shock-day trades = +6.3R |
| LIVE Feb (02-02..02-27) A2 | 20 | 55% | +0.23 | +4.64 (+$580) | 2.17R | box market; one coin-flip day = +2.14R |
| LIVE total | 34 | 62% | +0.43 | +14.69 (+$1,836) | 2.17R | |
| Backtest Feb only (out-of-sample) A1 / A2 / A3 | 20 each | 50 / 55 / 40% | +0.18 / +0.23 / +0.00 | +3.60 / +4.64 / +0.10 | 2.2 / 1.9 / 3.1R | A2 = live exactly |
| Backtest Feb only B1 / B2 / B3 | 13 / 14 / 13 | 54 / 57 / 54% | +0.32 / +0.34 / +0.23 | +4.10 / +4.79 / +2.98 | 1.1 / 1.7 / 1.0R | |
| Backtest Feb only C1 (A2 + midpoint filter) | 13 | 38% | -0.08 | -1.04 | 1.5R | skipped 7 trades worth +5.68R: failing |
| Backtest Jan+Feb A1 / A2 / A3 | 39 each | 59 / 64 / 46% | +0.37 / +0.50 / +0.15 | +14.24 / +19.43 / +5.88 | 3.7 / 1.9 / 4.2R | Jan part is in-sample |
| Backtest Jan+Feb B1 / B2 / B3 | 26 / 27 / 26 | 62 / 59 / 65% | +0.54 / +0.43 / +0.44 | +14.02 / +11.69 / +11.35 | 2.6 / 2.1 / 1.4R | Jan part is in-sample |
| Backtest Jan+Feb D1 (A2 only after a pullback day) | 14 | 71% | +0.55 | +7.72 | 1.38R | Jan +0.62 (5), Feb +0.51 (9); skips Jan trend days |
| Backtest Jan+Feb E1 (A2, SL 30) | 39 | 64% | +0.61 | +23.72 | 2.91R | gain is all Jan; Feb +0.20; stop fitted in-sample |
| Backtest Jan+Feb DE (D1 + E1) | 14 | 71% | +0.75 | +10.51 | 1.54R | best avg R, 14 trades, in-sample |
| Backtest Jan+Feb C1 | 25 | 56% | +0.40 | +10.09 | 1.5R | |
(Jan-only backtest numbers recorded earlier were made before a Sunday-candle bug fix in bt/ideas.py; the Jan+Feb rows above are the corrected ones.)

## Honest read
- Jan = trend month, rule paid +0.72R/trade. Feb = box month, +0.23R/trade and most of that is one coin-flip trade. Real edge is unknown and may be ~0 outside trends.
- Feb was a true out-of-sample month for A and B: all positive, none convincingly. 20 trades is far too few.
- My by-eye replay idea (C) is failing its first test. My discretion still has no proven value; I followed the rule 20/20 in Feb.
- Phase 1 is 1.3R from done, built mostly on January. Passing it would not prove the rule works.

## Review round (journal/2015-review-jan-feb.md)
- Losers share: 9 of 13 came the day after a move already in my direction, 10 of 13 entered in the far half of yesterday's range (chasing, mostly buys at the box top). Only 3 hit the full stop.
- Verdict: D1 / E1 / DE are NOT a genuine improvement (tiny samples, in-sample, D halves net R, E raises drawdown). Traded rule stays A2.

## Jan (in-sample) vs Feb (out-of-sample), frozen A and B, avg R: A1 +0.56 -> +0.18 | A2 +0.78 -> +0.23 | A3 +0.30 -> 0.00 | B1 +0.76 -> +0.32 | B2 +0.53 -> +0.34 | B3 +0.64 -> +0.23
- None negative, all lost 36-100% of the edge. Cause seen on charts: Jan = trend (08-12 drift with signal +34 pips, 79% right), Feb = box (+11 pips, 55%). Full table: journal/2015-review-jan-feb.md section 7. Nothing changed.

## Next step
1. Waiting for the coach. No March data. Clock stays at 2015-02-27 22:00.
2. If allowed another round on Jan-Feb: idea F "regime" (A2 every day when the 3-day gap is large, pullback-day only when small), threshold fixed before running, max 3 variants.
3. When data resumes: `git fetch origin main && git merge --no-edit FETCH_HEAD`; trade A2 at $125 unless a tested rule has replaced it; log D1/DE as paper tags on each trade.
Tools: look.sh, trade_a.py, bt/ideas.py [names] [--since=YYYY-MM-DD], bt/review.py (trade context), bt/loser_charts.py (trade charts). Tests: `python -m pytest -q`.

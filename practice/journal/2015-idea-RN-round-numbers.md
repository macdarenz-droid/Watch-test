# Round numbers: does a "00" level just ahead of the entry leave the trade no room? HYPOTHESIS AND KILL TEST WRITTEN FIRST (nothing has been run)
Clock Tue 2015-04-07 01:00 London (end of released data). January only for the build (explicit end date 2015-02-01); costs on; London time.

## Where it comes from
Round numbers were on my beginner's list in week 1 (support and resistance) and they are all over my calls: 1.2000 in the first week, 1.1500, 1.1000 four times in March
(03-18, 03-24, 03-25, 03-26 - the last one a failed breakout I bought into), 1.0800, 1.0500. I have written them down as "levels" every day and never tested whether they matter.
Idea Z tested walls made by PRICE (old highs and lows) and found they are almost never within reach. A round number is a wall made by the NUMBER, and one is never more than
50 pips away. Not a "best N vs worst N" idea: the feature exists on every trade.

## Hypothesis
When a big round number (a "00" level, or a "50") lies a short distance AHEAD of my entry in the trade direction, the morning leg tends to stall there, so those trades have lower
expectancy; skipping them raises avg R without lowering net R. Counter-case: in a trend the market goes through round numbers without noticing (1.1500, 1.1200, 1.0800 all broke
within a morning), so the filter only throws away ordinary trades.

## Variants (81, 82, 83; ideas -> 32), no others afterwards. Everything else exactly A2.
- RN00-15: no trade if a "00" level (x.x000, x.x100, ...) lies within 15 pips ahead of the 08:00 price in my direction.
- RN00-25: the same within 25 pips.
- RN50-15: no trade if a "00" or a "50" level lies within 15 pips ahead.

## KILL TEST (explicit). By my sample-size rule the January build can only KILL a filter; it cannot confirm one.
Build (January, 19 trades) - a variant survives only if ALL:
  B1. kept avg R >= A2's avg R + 0.05R;
  B2. the trades it skips average LESS than the trades it keeps;
  B3. it skips at least 3 trades and keeps at least 60%.
No survivor -> closed. A survivor is NOT run on February or March and is NOT adopted: it earns only a forward paper tag, with no adoption question before 200 forward trades
(kept-minus-skipped at least 0.3R, at least two standard errors); an interim look at 40 days can kill it.
My guess: RN00 variants skip fewer than 3 January trades (a 15-25 pip window in front of a level 100 pips apart catches few days) and fail B3; RN50-15 skips more, and its
skipped trades are ordinary winners.

# RESULTS of idea RN (run after the pre-registration commit). RN00-15 / RN00-25 / RN50-15 = variants 81/82/83; ideas 32. January only, costs on, $125 risk (bt/ab_drop.py, explicit end date).

| Rule | Trades | Win rate | Avg R | Net R | Max DD | Kept | Skipped: n / win / avg R |
|---|---|---|---|---|---|---|---|
| A2 (before) | 19 | 74% | +0.78 | +14.89 | 1.34R | - | - |
| RN00-15: skip if a "00" level is within 15 pips ahead | 17 | 71% | +0.78 | +13.24 | 1.34R | 89% | 2 / 100% / +0.83 |
| RN00-25: skip if a "00" level is within 25 pips ahead | 15 | 67% | +0.73 | +10.91 | 1.34R | 79% | 4 / 100% / +1.00 |
| RN50-15: skip if a "00" or "50" level is within 15 pips ahead | 11 | 82% | +1.07 | +11.74 | 1.00R | 58% | 8 / 62% / +0.39 |
Skipped by RN00-25: 01-08 +1.14, 01-14 +1.13, 01-22 +1.19, 01-29 +0.53 (four winners). Skipped by RN50-15: 01-12 +1.35, 01-13 +1.40, 01-14 +1.13, 01-19 -1.00, 01-21 -0.51,
01-28 +0.28, 01-29 +0.53, 01-30 -0.02.

## Kill test, applied
- RN00-15: B3 fails (skips only 2), and both skipped trades were winners.
- RN00-25: B1 fails (kept +0.73 < A2), B2 fails (the skipped trades, +1.00R, are better than the kept ones). With a "00" level just ahead the trade won four times of four:
  in January the market went THROUGH the big figures.
- RN50-15: B1 and B2 pass (kept +1.07R vs skipped +0.39R), B3 fails: it keeps 58% of the trades, the line is 60%. One trade short. I am not moving the line.
=> NO SURVIVOR. Closed. Nothing was run on February or March.

## Reading it
- The pure round-number idea ("00" levels stop the morning) is plainly wrong for January: those trades were the better half.
- RN50-15 is the one I must be most careful with, because it "almost" passed. By my own sample-size rule a kept-minus-skipped gap of 0.68R on 19 trades is inside the noise
  (on 19 trades only a gap above about 1.0R stands out), it only appears when I widen the idea from "00" to "00 or 50", and it throws away 42% of the trades.
  Three variants gave three different stories; that is what noise looks like. A near-miss on a build month earns nothing.
- Round numbers stay in my calls as landmarks to describe the chart. No rule.
- Counts: ideas 32, variants 83.

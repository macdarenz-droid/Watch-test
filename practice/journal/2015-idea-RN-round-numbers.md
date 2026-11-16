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

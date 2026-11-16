# Replay by eye - worst week (W05, 01-26..01-30: 5 trades, +0.09R) - written Sat 01-31, clock stopped

Honest note: I have no net-losing week yet. W05 is my worst week and holds my fastest stop-out (#11). Charts: H1 n=120, H4 n=62 (chart.py).

## What the chart shows that my 07:00 notes missed
- H4: the fall ended with a long-tailed spike to 1.1098 on Sunday night, then three green H4 candles in a row. The down move was already answered before I sold.
- Mon 26 (H1): stair-steps up all day, every dip held above the last one. I sold into it (#10) and was paid +0.31R by luck, not by reading.
- Tue 27: Asia went flat right at the top of Monday's rise (buyers not giving anything back), then one 110 pip candle up at 08:00-09:00. I sold at 08:00, stopped in 14 min (#11, -1R).
- Wed-Fri: lower highs 1.1422 -> 1.1382 -> 1.1368 -> 1.1364 above a floor at 1.1262-1.1272 = a narrowing range. My rule flipped to "buy" on Wed,
  two days AFTER the bounce started and just as it stalled. #14 was a buy 10 pips under three days of highs: no room to my upside.

## What a better trader would have done
1. Mon/Tue: no sells while H1 keeps making higher lows. Wait for a break below the last swing low (1.1224 on Tue) before selling again. Cost of waiting: zero.
2. Read where price sits inside yesterday's range before entering: selling in the UPPER half of an up day is selling strength.
3. Wed-Fri: call it a range and either stand aside or only trade from the edges (1.1265 / 1.1375), never from the middle.
4. Same $125 risk on every trade regardless - that part I did right; the week cost nothing because size was small and exits were at noon.
Caveat: all of this is hindsight on one week. "Better trader" here = my guess, not something I have tested.

## One testable question for when data resumes (will count as idea C, variant 1)
Does rule A2 do better if I skip trades where the 08:00 price is on the WRONG side of yesterday's range midpoint
(sell only below yesterday's mid, buy only above it)?
- By-eye check on trades I looked at (in-sample, incomplete, NOT a backtest): would have skipped losers #6 and #11, kept loser #8, and skipped winner #1 (+1.34R). Mixed.
- So I expect nothing; the test is on months I have not seen. Pass mark written now: on >= 40 new trades, avg R of kept trades must beat unfiltered A2
  by >= +0.15R AND skipped trades must average <= 0. Otherwise drop it.

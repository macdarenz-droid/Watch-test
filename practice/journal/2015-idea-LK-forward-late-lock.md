# Idea LK forward: the late profit lock, re-tested on forward days only. HYPOTHESIS, WORKED CASES AND KILL LINES WRITTEN BEFORE ANY RUN
Clock Fri 2015-06-12 22:00 London (end of released data). Written after funded day 56. One test (coach 06-04: one at a time).
June goal: every number and every test rule gets one worked case before it is pushed. The worked cases are below, from bar prints.

## Why this one
Today's trade was +66.9 pips at its best and +34.2 at the bell; Wednesday's was +86 and closed at -6. The +80 question is GB1's and is parked at 15 cases
(coach 06-12: no live change before). The ordinary give-back, under +80, is a different and older question: idea LK, tested on 05-01 on all history to
04-30 and killed (-1.59R / -1.79R / -6.19R against A2). Its three definitions have sat frozen in bt/ideas.py since then. Re-testing a frozen definition
on the days since is the honest way (coach 06-10). It is NOT a new look at old history: only days from 05-01 count.
What I know against it, stated: the build said the hour 11:00-12:00 ADDS +0.18R per in-profit trade; 29 exit definitions before it failed; CS and PM
failed their forward re-tests too. What speaks for it: nothing but two fresh memories. I expect a kill.

## The frozen definitions (unchanged since 05-01; engine hours are London)
- LK1: at 11:00, if the trade is 20+ pips in profit, the stop goes to entry + half of the open profit; then noon as usual.
- LK2: the same check at 10:00.
- LK3: at 11:00, if the trade is 20+ pips in profit, close at market.
Forward days: 05-01 .. 06-12 (explicit END 2015-06-13), 31 trading days. Costs on. `NAMES=LK1,LK2,LK3 FWD0=2015-05-01 python bt/cs_forward.py 2015-06-13`.
Disclosed: I have lived all 31 days and know A2's results on them; I have not run LK on any of them.

## Worked cases (by hand from M5 bar prints; spread 1.0 pip, so a sell is bought back at bid + 1.0)
Fri 06-12, SELL 1.12191, A2 +0.85R (closed 1.11849):
- LK2: 10:00 London bar opens bid 1.11668 -> ask 1.11678 -> open profit 51.3 pips (>= 20) -> stop to 1.12191 - 25.65 pips = about 1.11935.
  The ask reaches it in the 11:05 London bar (bid high 1.11931 -> ask 1.11941). Out at about +25.6 pips = about +0.64R: WORSE than noon by about 0.21R.
- LK1: 11:00 London bar opens bid 1.11780 -> ask 1.11790 -> open profit 40.1 pips -> stop to 1.12191 - 20.05 pips = about 1.11991.
  The 11:10 bar's ask (1.11987) misses it by half a pip; the 11:15 bar (bid high 1.12033) takes it. Out at about +20 pips = about +0.50R: WORSE by about 0.35R.
- LK3: closes at the 11:00 open, ask 1.11790 -> +40.1 pips = about +1.00R: BETTER by about 0.15R.
Wed 06-10, BUY 1.13002, A2 -0.14R (the day that started this):
- LK2: 10:00 London bar opens bid 1.13184 -> open profit 18.2 pips, UNDER 20 -> no lock. LK1 / LK3: 11:00 bar opens 1.13001 -> -0.1 pips -> no lock.
  All three leave the day unchanged at -0.14R. The rule I remembered as the answer to Wednesday would not have touched Wednesday.

## Kill lines (each variant against A2 on the forward days, costs on; one failure kills it) - the same five as the CS and PM forward tests
- K1: net R at least 1.0R above A2.                          [worked: 06-12 gives LK1 -0.35R, LK2 -0.21R, LK3 +0.15R; 06-10 gives 0]
- K2: improved days >= worsened days, and still ahead of A2 without its single best day.
- K3: max drawdown on the forward days not larger than A2's.
- K4: at stressed costs (2.0 pip spread, 0.5 slippage) not behind A2 at the same costs.
- K5 sample: at least 10 changed days.
A survivor: at most a forward paper tag. The live exit stays "whole position, 40 pip stop, 12:00" whatever comes out.

## Worked expectation, written now
31 days; about 14 wins; perhaps 10 trades are 20+ pips up at 11:00. LK1 and LK2 change only the days where the half-lock is hit: 3 to 7 days each
(K5 FAIL expected). The big days (05-19, 06-02, 06-04) ran into noon, so a half-lock set at 10:00 or 11:00 costs little there unless they dipped.
My guess: LK1 about -0.5R, LK2 about -1.0R, LK3 between -1.5R and +0.5R against A2. All three FAIL K1. No survivor.
If one passes all five, I will say so and it becomes a paper line; I will not explain it away.
Counts when run: idea 81, variants 226-228 (three re-runs of frozen definitions).

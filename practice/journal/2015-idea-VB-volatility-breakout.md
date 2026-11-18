# Idea VB: daily volatility breakout from last night's close (idea 158). Route B hunt (a new setup), not a change to A2.
Written Tue 2015-09-08 22:00 London, before any code, count or outcome. New chat session; process read from STATE and the journals.
Searched STATE and the journals ("volatility breakout", "Williams", "open plus", "x yesterday's range"): never tested. Nearest relatives, all
killed: BK (night-BOX break after a big day), MB / BX / QB (session-box breaks), XD (3-day range break at 08:00), ND (narrow-day break).
None of them measured the break from LAST NIGHT'S CLOSE in units of YESTERDAY'S RANGE.

## Hypothesis
A day that travels half of yesterday's range away from last night's close during London / New York hours is a day with a real push, and
the push carries on to the evening. Against it, stated: five follow-the-move rules made all their profit before 04-07 and died after it;
SQ showed ranges persist but direction does not; "noon is the top of the hill" for A2. Honest prior: killed on K2 (from 04-07).

## Rule (London time; M5 candles; one trade a day at most)
- Anchor = the last price at 22:00 London last night (the London-day close). Yr = yesterday's London-day range (22:00 -> 22:00), in pips.
- Levels: UP = anchor + k x Yr, DOWN = anchor - k x Yr.
- If any candle between 22:00 and 08:00 touched either level (high >= UP or low <= DOWN): NO TRADE (the move was spent in the night).
- Else the first M5 candle from 08:00 to 15:55 that touches a level -> market order at the NEXT candle's open, on that level's side
  (touches UP -> buy, DOWN -> sell; a candle touching both -> no trade). Stop 40 pips, close 20:00. $125 = 1R.
- THE THREE VARIANTS (named now, no fourth): VB1 (judged) k = 0.5 | VB2 (dose) k = 0.7 | VB0 (control) VB1's signals traded the other way.
- Costs on: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5. END = 2015-09-09 (all lived days to Tue 09-08).

## Counts before outcomes (facts, not results)
Sample line: VB1 under 80 trades in all, or under 40 from 04-07 -> KILLED FOR SAMPLE, no outcome run.
Repeat line: 85% or more of VB1's trades on A2's side of that day -> KILLED AS A REPEAT of A2 (as XD was at 92%), no outcome run.
One worked case from the tool (levels, touch time, side) before the run.

## KILL LINES for VB1 (ALL must pass; all R after costs 1.0 + 0.1)
K1 average >= +0.10R.
K2 net above zero before 04-07 AND from 04-07.
K3 net above zero without its best two trades.
K4 average at stressed costs (2.0 + 0.5) above zero.
K5 max drawdown <= 6R.
K6 sign-flip test on VB1's trades (10,000 flips, seed 58): p < 0.10 with a positive average.
Pass = route B step B1 candidate (then 40 forward paper trades and the coach's word). Fail = killed, no fourth variant.
My guess: about 80-90 trades, a small plus before 04-07, a minus after; killed on K1 and K2.

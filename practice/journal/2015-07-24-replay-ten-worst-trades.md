# Replay of my 10 worst funded trades (coach 07-24). Written Fri 2015-07-24 22:00 London (weekend). A STUDY: no test, no idea counted, no rule touched.
Source: sim/trades.csv from 03-27 (73 funded trades, 40 losses, 28 full stops); charts bt/loss_grid.py (M15, evening before -> 13:00).
"Worst" needs a caveat first: all 10 are the same thing, a full stop at 0.31 lots, -$127.41 to -$130.82 (-1.00R each). The order inside
them is pennies of stop distance. There is no outlier loss in my record: no jump through a stop, no oversize, no second trade.

| # | day | side | stopped after | what the chart shows | tag | what a better trader would have done |
|---|---|---|---|---|---|---|
| 1 | Mon 04-20 | buy | 100 min | night drifting down under yesterday's range; small bounce into the bell, then down | VALID | nothing inside the rule; by eye he might not buy a falling night |
| 2 | Thu 04-23 | sell | 111 min | sold the low of a pre-hour drop; V-turn, +80 pips against | VALID | not sell the bottom of a fresh spike; or wait for the hour to settle |
| 3 | Fri 04-24 | buy | 190 min | bought the top of a 70-pip pre-hour spike; held an hour, then all back | VALID | not chase the spike |
| 4 | Mon 05-04 | buy | 66 min | pre-hour spike up, collapse at the bell | VALID | not chase the spike |
| 5 | Fri 05-15 | buy | 90 min | pre-hour whip down and back up to the high; fell 60 | VALID | stand aside after a whip hour |
| 6 | Mon 06-01 | buy | 98 min | falling since the evening; fell on | VALID | not buy a falling night |
| 7 | Tue 06-09 | buy | 38 min | at the top of an overnight rally; the turn had begun in the pre-hour | VALID | not buy the first pullback of a turn |
| 8 | Thu 06-11 | buy | 55 min | falling since the evening; fell on | VALID | not buy a falling night |
| 9 | Mon 06-22 | buy | 32 min | at the night's high after a rally; 70 pips down in 30 minutes | VALID | nothing visible before; a fast stop is the rule working |
| 10 | Tue 06-23 | buy | 187 min | clear downtrend overnight; the 3-day signal was a day late | VALID | not buy a falling night |
Tags checked against the trade list, not only the tracker: each entry at 08:00 London, 0.31 lots, stop 41-42 pips from the fill (40 from
the bid + spread), never moved, exit at the stop with 0.1 pip slippage. 10 of 10 VALID. 0 mistakes.

## What the "better trader" column adds up to, and why I do not act on it
- 4 x "do not buy a falling night" = idea ON / NM / NA: tested twice, killed twice; before May those nights EARNED +6.75R.
- 4 x "do not chase a pre-hour spike / whip" = PH2: on paper since April; 42 lively mornings -8.29R against 19 quiet -1.39R so far
  (gate at 60 lively mornings). It is the one line here still open, and it stays on paper until its gate.
- 2 x nothing visible.
So the better trader in my head is hindsight twice over: he knows which falling nights keep falling. Every one of his rules I have
already tested, and the charts of my WINNERS show the same pictures (BS, PZ, DH).
- 9 of the 10 are buys. Checked against all funded trades before believing it: full stops are 16 buys and 12 sells; buys 35 trades
  -2.81R, sells 38 trades +1.33R. A lean, 73 trades, and the "10 worst" order is pennies. Not tested; written down so I do not start
  believing it.
- Time to the stop: 32 to 190 minutes, median of all 28 full stops 87 minutes. The losers were wrong early, as in every replay before.

## What a better trader would REALLY have done differently
Not the entries. He would have noticed sooner that the rule's side had stopped winning (mid-April by RG; I measured it on 06-26 and
stopped on 07-08), and he would have been at 0.16 lots sooner (I switched 07-07). 7 of these 10 are from 05-04 on; at 0.16 lots they
would have cost half. That lesson is already in the plan: the MO monitor, the alarm, size v3, the gate at +0.60R. Nothing new to write.

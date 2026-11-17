# A second setup: three ideas from my chart notes, one picked, pre-registered. Idea WG: fade the weekend gap. WRITTEN BEFORE ANY CODE
Clock Tue 2015-06-23 01:00 London (end of released data). After funded day 62. Coach 06-22: "from your own chart notes, write 3 ideas for a second setup
that trades on days A2 doesn't, pick the best, prereg it with a kill line, max 3 variants, costs on. a second uncorrelated setup is how you get steadier months."
June goal: every number and every test rule gets one worked case before it is pushed.
A fact first: A2 trades EVERY weekday, so there is no day it doesn't trade. I read the brief as: a setup that trades at TIMES when A2 is flat
(A2 is in the market 08:00-12:00 London only) and whose results do not move with A2's.

## Already tried as second setups (10, none alive; so none of these is proposed again)
Asia-range break; ignition candle; fade of the London morning in NY (N1: passed the build, KILLED on its forward gate); range fade; night continuation;
afternoon trade in the 3-day direction; night fade; direction of a lively pre-entry hour; midday-box break at 13:25 (BX); the same only with the morning
(MB1: on paper, kept trades -4.87R in 29 forward days, one stop from its early-close line).

## Three ideas from my notes, with their sample counted WITHOUT outcomes (python over history to 06-22)
- A "weekend gap": my Monday calls of 06-15 and 06-22 both carry a line "Weekend: ... a gap of about 55 / 28 pips. Not in the 22:00 closes, so not in my
  signal", and both Mondays later traded back through Friday's close. Idea: fade the gap toward Friday's close. Trades Sunday 22:00 onward: A2 is flat.
  Sample: 25 weekends; |gap| >= 10 pips on 17, >= 15 on 12, >= 20 on 8, >= 30 on 3 (median gap 13.8 pips).
- B "late day": notes of big evenings (03-18, 06-17, 06-18). Idea: at 17:00 follow (or fade) the 12:00-17:00 move, out 21:00. Sample is there (|move| >= 40 pips on
  58 of 121 days) but my notes do not even agree on the direction: 06-17's evening continued, 06-18's reversed. An idea without a side is a search, not a hypothesis.
- D "the 13:30 candle": 06-05 ("a single candle fell about 170 pips") and four jump days in the MB1 notes. Idea: after a 13:30-13:45 move of 40+ pips, follow it to 17:00.
  Sample: 12 days in 121 (20 at 30+ pips). And it is BX's neighbour: the same half hour, a different trigger.
PICK: A. It is the only one of the three that comes with a side and a reason I can state before testing (a gap is a price nobody traded; Friday's
close is the last price many did), and it is the furthest from anything tried. Its weakness is plain: 17 cases at the most. This test can kill it
or earn it a paper line; it cannot prove it. A year of weekends is about 50.

## Hand-worked first: the two weekends that gave me the idea (M5 prints; they are DROPPED from the judged set, as inspiring days always are)
Mechanics as defined below (entry at the open of the second M5 bar; stop = the gap's size from the entry; target = Friday's last close).
- Sun 06-21: Friday's last 1.13487, Sunday opens 1.13771: gap +28.4 -> SELL at the 22:05 open 1.13752; stop 28.4 pips above = 1.14036; target 1.13487.
  Night high 1.14035 at Mon 07:00 on the BID = 1.14045 on the ask: STOPPED before any fill: -1.00R. (The gap did fill - at about 08:35, after the stop.)
- Sun 06-14: Friday's last 1.12648, Sunday opens 1.12102: gap -54.6 -> BUY at the 22:05 open 1.12135 + spread = 1.12145; stop 54.6 pips below = 1.11599; target 1.12648.
  To Mon 07:45: low 1.11891 (no stop), high 1.12310 (no fill), last 1.12093 -> out at about -5 pips = about -0.10R. To 12:00: last 1.12172 -> about +0.05R.
  To 21:00: high 1.12944 at 20:05 -> target filled: about +0.92R.
So the two memories behind the idea are -1.00R and -0.10R under the first variant. "Both Mondays traded back through Friday's close" was true and
useless: one after my stop, one after twenty hours. I write the test anyway, because it was asked and because two cases are two cases.

## HYPOTHESIS: after a weekend gap of 10 pips or more, the price comes back to Friday's close before it goes the gap's size further
Rules: Friday's last M5 close = F. First M5 bar after the weekend opens at O. Gap = O - F. If |gap| >= 10 pips: at the open of the SECOND bar trade
toward F (gap up -> sell). Stop = max(|gap|, 15) pips from the entry. Target = F. If neither is touched by the deadline: close at market.
If stop and target fall in the same M5 bar: the stop counts. R = result / stop distance. One trade per weekend.
Costs on: spread 1.0 pip + 0.1 slippage as everywhere; STRESS 3.0 + 1.0 (a Sunday open is thin; my feed's spread column shows more than a pip there).
Variants (3) = the deadline: WG1 Monday 07:45 London (flat before A2's bell: no overlap in time at all); WG2 Monday 12:00; WG3 Monday 21:00.
Judged set: every weekend to END 2015-06-23 with |gap| >= 10 pips, without 06-14 and 06-21: 15 weekends expected.

## Kill lines (stand-alone setup; one failure kills the variant)
- K1: average at least +0.20R a trade after costs.
- K2: net positive without its best trade.
- K3: net positive in both halves of the judged list (by date).
- K4: max drawdown 4R or less.
- K5: at stressed costs still at least +0.10R a trade.
- K6 sample: at least 12 judged trades.
- K7 independence: correlation with A2's result on the same Monday not above +0.30 (WG1 cannot overlap in time; WG2 and WG3 can).
Worked case for the lines: 15 trades with 9 targets at about +0.9R and 6 stops at -1.1R = +1.5R = +0.10R a trade: K1 FAIL. To pass K1 with stop
and target about equal I need about 2 fills in 3 after costs.
A survivor: a PAPER line noted every Monday (never live; two trades in one day would also need the plan's two-trade buffer). Not a survivor: closed.
Worked expectation, written now: my guess is that a gap fills before the stop about half the time; at 1 : 1 less costs that is about -0.05R to -0.10R
a trade. WG1 about -0.1R (many time exits near zero); WG3 near 0. All three killed on K1. If so: second setups tried 11, none alive, and I say so.
Counts when run: idea 87, variants 242-244. Ideas B and D are written here and NOT tested: not counted as variants.

## Mechanics check (rules pushed first in commit 046fef6; `python bt/weekend_gap.py 2015-06-23 --check SUNDAY`)
06-21: all three variants stopped Mon 07:00, -1.00R (hand: -1.00R). 06-14: WG1 time exit -0.10R (hand about -0.10R); WG2 +0.05R (hand about +0.05R);
WG3 target +0.92R (hand about +0.92R). The simulator does what I worked by hand.

## RESULTS (one run: `python bt/weekend_gap.py 2015-06-23`; 25 weekends, 17 with a gap of 10+ pips, 2 inspiring ones dropped -> 15 judged; figures from the print)
| variant | trades | avg R | net | targets / stops / time exits | without best | first half / second half | max DD | stressed avg (3.0 + 1.0) | corr with A2's Monday |
|---|---|---|---|---|---|---|---|---|---|
| WG1 deadline Mon 07:45 | 15 | +0.087 | +1.31 | 8 / 5 / 2 | +0.39 | +0.31 / +1.00 | 1.50R | -0.125 | +0.02 |
| WG2 deadline Mon 12:00 | 15 | -0.018 | -0.27 | 8 / 6 / 1 | -1.19 | -1.26 / +1.00 | 2.32R | -0.222 | +0.05 |
| WG3 deadline Mon 21:00 | 15 | +0.022 | +0.34 | 8 / 6 / 1 | -0.58 | -0.66 / +1.00 | 2.32R | -0.182 | +0.05 |
| line | WG1 | WG2 | WG3 |
|---|---|---|---|
| K1 average >= +0.20R | FAIL (+0.087) | FAIL | FAIL |
| K2 positive without best trade | PASS | FAIL | FAIL |
| K3 both halves positive | PASS | FAIL | FAIL |
| K4 max DD <= 4R | PASS | PASS | PASS |
| K5 stressed >= +0.10R | FAIL (-0.125) | FAIL | FAIL |
| K6 at least 12 trades | PASS | PASS | PASS |
| K7 correlation with A2 <= +0.30 | PASS (+0.02) | PASS | PASS |
The two dropped weekends (not judged): WG1 -0.10R and -1.00R; with them WG1 would be +0.21R in 17 trades = +0.01R a trade.
VERDICT: all three KILLED. No paper line. Second setups tried: 11, none alive (MB1 still on paper, near its early-close line).

## Expectation against the run
"A gap fills before the stop about half the time": 8 of 15. "WG1 about -0.1R": +0.087R - a little better than I guessed, not enough. "WG3 near 0": +0.02R.
"All killed on K1": yes.

## What I take from it
- The idea is not nonsense: 8 targets against 5 stops before Monday's bell, and it is as independent of A2 as a setup can be (correlation +0.02,
  no overlap in time). That is exactly what the coach asked a second setup to be.
- It is also not an edge I can show: +0.087R a trade is +1.3R in five and a half months, the whole of it disappears at a Sunday-night spread of 3
  pips (-0.125R), and the two weekends that made me think of it lose 1.10R between them. With targets of 10-25 pips the cost is a tenth to a
  quarter of the prize. A setup whose profit is smaller than a plausible error in its costs is not a setup.
- Longer deadlines do not help: the same 8 targets, one more stop. What fills, fills overnight.
- What my notes got wrong: "both Mondays traded back through Friday's close" described where the price went, not what a trade with a stop would have
  done. The hand-worked cases showed that before a line of code was written - the worked-case rule again.
- The sample: 15. I said before the run that this test could only kill or earn a paper line. It killed, by the lines as written. I do not keep
  a paper line for a +0.09R idea that fails its cost line; one near-dead paper setup (MB1) is enough to carry.
- On the coach's aim, honestly: after 11 tries I have no second setup. Steadier months will not come from this account's research soon; they come,
  if they come, from A2's sample growing. Ideas B (late day) and D (13:30 candle) are written above, untested, if the coach wants one of them next.
Counts: ideas 87, variants 244 (WG1, WG2, WG3). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today).

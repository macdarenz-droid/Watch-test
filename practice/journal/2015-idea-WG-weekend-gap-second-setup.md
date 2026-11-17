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

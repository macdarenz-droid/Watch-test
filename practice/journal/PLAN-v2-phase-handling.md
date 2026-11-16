# Plan v2 addendum: the last bit of phase 1, and phase 2 (written Thu 2015-03-05 07:00 UTC, BEFORE today's trade)

## Where I am
Phase 1: balance $26,997.64, target $27,000, $2.36 to go. 37 trading days (minimum 5: met long ago). No breach; worst day -0.5%.

## 1. The last bit of phase 1
Fact that drives it: in phase 1, profit above the target is worth nothing (phase 2 restarts at $25,000). A loss is worth what it always is. So near the target the bet is lopsided:
full size risks $125 to win $2.36 of useful money.
Rule ("finishing size", applies whenever the target is within $31 = 0.25R of my standard risk):
- The SIGNAL and the trade are unchanged: A2 direction, 08:00 market, 40 pip stop, close 12:00, one trade a day. No target order, no early close, no second trade.
- Only the size changes: 0.10 lots ($1 per pip, $40 at the stop = 0.16%). Any A2 win of about 2.4 pips or more finishes the phase; a full stop costs $40 instead of $125.
- Why not smaller (0.01 lots): it would need +24 pips, which cuts my chance to finish today for no benefit. Why not full size: it adds $85 of risk and adds nothing I can keep.
- Why not a tiny take-profit to "grab" the $2.36: that would be a new exit rule invented for one trade. My exit tests just showed exits are where I fool myself. The trade is A2 or nothing.
- If today loses: balance about $26,957; tomorrow is a normal A2 day at the normal $125 (the gap is then above $31).
- For my records the forward tally stays in R (result divided by the amount risked), so the A2 forward test is not distorted by the smaller size.

## 2. Phase 2 (starts when the sim shows phase 2; balance $25,000; target +5% = $26,250; daily limit 5%; max loss 10% = $22,500; minimum 5 trading days)
| Item | Rule | Why |
|---|---|---|
| Strategy | A2 exactly as frozen | 13 ideas / 26 variants tested, none beats it on a month it was not built on; forward tally so far +1.29R in 3 trades (says nothing yet) |
| Risk per trade | 0.75% = $187.50 = 0.47 lots x 40 pips | risk math: at a February-sized edge +5% (6.7R) takes about 29 trades; breach chance ~0.2% over two months even if the edge is zero; a 3R disaster day = 2.25%, under half the daily limit |
| Daily stop | one trade a day, so the worst planned day is one full stop = -0.77% ($191). After any loss: done for the day | daily limit 5% leaves 6x cushion; my only untested behaviour would be a second trade, so there is none |
| Brakes | 4% below the phase start ($24,000): back to 0.5% until a new phase equity high. 6% below ($23,500): stop, review, restart only with the coach | keeps 4% between me and the 10% line; I would stop long before the limit, not at it |
| Minimum trading days | 5 are required; 6.7R at my pace is 15-30 trades, so the minimum should take care of itself | no slowing down or speeding up to fit a calendar |
| If the target is hit before day 5 (two outsized winners could do it) | keep taking the A2 signal at 0.01 lots (about $4 risk) until 5 trading days are logged | the profit is already made; the remaining days are only a rule to satisfy, so I risk almost nothing on them |
| Finishing size | when the target is within $47 (0.25R of the phase 2 risk): 0.10 lots, same as above | same lopsided-bet logic |
| Weekends / news | flat at 12:00 UTC every day, never over a weekend | unchanged; both sim gaps and both news spikes so far happened while I was flat |
| Size increase to 1% | only after A2 passes its forward test (40 unseen trades averaging >= +0.10R) | my edge estimate rests on too few trades to pay for less cushion |
| Stop trading for money | A2 forward test fails (avg < +0.10R after 40 unseen trades, or drawdown > 8R) | plan v2, unchanged |

## 3. What I will not do
- No size above plan because phase 1 "worked". Phase 1 took 37 trades and most of it was January.
- No rule tweaks carried into phase 2 from ideas that failed their tests, however good they looked in one month.

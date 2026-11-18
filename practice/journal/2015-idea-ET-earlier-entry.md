# Idea ET (idea 62): is my 08:00 entry late? - looked first, then PRE-REGISTRATION (pushed before any code or count of the test)
Sim clock Wed 2015-05-20 01:00 London. END 2015-05-20. Coach 05-18: an entry edge, from my own losers and winners; no risk-plan tests.
## Where it comes from (things already in my journal, no new count)
- The hour before my entry has become the lively one: 30+ pips on 17% of days in Jan-Feb, 57% in Mar-Apr (XS), 12 of 13 days in May (PH2 tally).
- Entering LATER is known to be worse, and steeply: a single entry at 08:30 keeps 81% of A2's net, at 09:00 only 61% (SI, all history). So about two fifths
  of what A2 earns is made between 08:00 and 09:00. If the edge is that front-loaded, the honest question is whether it starts BEFORE 08:00 now.
- The clock-shift test of 03-31 (January and March only) said 08:00 beat 07:00. That was before the lively hours came.
- Against it, from the table I looked at on 05-18 (24 days, column "pre" = the 07:00-08:00 move in my direction): losers sum about +24 pips, winners about
  -42 pips, together about -18 pips in 24 days. On those days a 07:00 entry would have had the same price as 08:00, give or take a pip, plus one more hour of
  stop risk. I add those up here on purpose: I have seen them, they are contamination, and they say "no gain".
## Hypothesis
Since the pre-entry hour became lively, part of A2's edge is made before 08:00 London: entering at 07:45, 07:30 or 07:00 earns more than 08:00.
## Variants (3; signal, 40 pip stop from the bid at the entry, one trade, exit 12:00 London all unchanged; bt/earlier_entry.py reuses part() of bt/split_entry.py)
- ET1: entry 07:00 London. ET2: entry 07:30. ET3: entry 07:45.
## Data and contamination
All A2 days before 2015-05-20, nothing dropped: the 24 table days are most of the period the hypothesis is about, and what I saw of them argues AGAINST
it, so keeping them cannot flatter it. Known beside: Jan and March results of a 07:00 entry from 03-31 (worse than 08:00).
## Kill lines (each variant against A2 on the same days; one failure kills)
- K1: net R at least 2.0R above A2.
- K2: not behind A2 in either half (before 03-02; from 03-02).
- K3: max drawdown at most 0.5R larger than A2's; worst 10 trades in a row at most 0.5R worse.
- K4: still ahead of A2 without its 3 best difference-days.
- K5 the mechanism: on days with a lively pre-entry hour (07:00-08:00 range >= 30 pips) the variant must beat A2, and that must be where the gain is
  (gain on lively days > gain on quiet days). If the gain sits on quiet days, my story is wrong even if the total is up.
Hand-check before totals: one day, each part's entry price and stop against the bars, and the 08:00 part must reproduce engine A2 (the script's own check).
A survivor gets a forward paper tag only.
My guess, written now: ET1 about 3R BEHIND A2, ET2 and ET3 within 1.5R of A2 either way; nothing passes K1. If so I will have the whole profile
(07:00 ... 09:00) and can stop asking whether 08:00 is the right minute.

## Mechanics hand-check (`python bt/earlier_entry.py 2015-05-20 --check 2015-05-19`)
The 08:00 part reproduces engine A2 on every day (largest difference 0.000R). 05-19, sell: ET1 enters 1.13161 at 07:00 (my call that morning read the 07:00
price as 1.13162), stop 1.13562, out 12:00 @1.12163 (my live exit price) = +2.49R; ET2 1.12852 = +1.72R; ET3 1.12904 = +1.85R. Pre-entry hour 38.4 pips, as in my 08:00 note.

## Results (run once; `python bt/earlier_entry.py 2015-05-20`; figures copied from the print)
A2: 96 days, net +36.71R, max DD 3.28R, worst 10 in a row -1.70R; before 03-02 +19.56R, from 03-02 +17.16R; lively days 43 (+6.51R), quiet days 53 (+30.20R).
| variant | net R (vs A2) | wins | full stops | max DD | worst 10 | before 03-02 (vs A2) | from 03-02 (vs A2) | diff without best 3 days | gain on lively / quiet days | days better / worse |
|---|---|---|---|---|---|---|---|---|---|---|
| ET1 07:00 | +27.80 (-8.91) | 56% | 27 | 5.07R | -4.40 | +14.33 (-5.22) | +13.47 (-3.69) | -12.62 | -4.84 / -4.07 | 31 / 45 |
| ET2 07:30 | +33.01 (-3.70) | 56% | 22 | 6.12R | -3.05 | +16.26 (-3.30) | +16.75 (-0.40) | -7.69 | -2.27 / -1.43 | 35 / 44 |
| ET3 07:45 | +32.16 (-4.56) | 58% | 21 | 5.35R | -4.07 | +16.32 (-3.24) | +15.84 (-1.32) | -6.43 | -2.21 / -2.35 | 31 / 44 |
Kill lines: K1, K2, K3, K4, K5 all FAIL for all three. VERDICT: no survivor, no tag. The entry stays a market order at 08:00 London.

## My guess against what happened
"ET1 about 3R behind": 8.91R behind. "ET2 and ET3 within 1.5R either way": 3.70R and 4.56R behind. Right direction, too small again.

## What I learned
- 08:00 is not late. Every earlier minute earns less, in both halves, and with a much deeper drawdown (5.1R to 6.1R against 3.28R) and 5 to 11 more full
  stops than A2's 16: the extra hour mostly adds stop risk, as the 24-day table had already hinted.
- The mechanism fails on its own ground (K5): on LIVELY pre-entry hours, where I thought I was arriving late, the early entry is 2.2R to 4.8R worse.
  The lively hour is not my edge starting early; more often it is the move my 08:00 entry then gets a better price against.
- The whole profile by entry time, now on all history (the 08:30 and 09:00 figures are from SI on 05-08, a slightly shorter history):
  07:00 76% of A2's net | 07:30 90% | 07:45 88% | 08:00 100% | 08:30 81% | 09:00 61%.
  08:00 is the top of a hill, not a spike: half an hour either side keeps 81-90%. That is what a real effect should look like, and it is the most useful
  thing in this test: the minute I trade is the best one I have measured AND its neighbours still work. I can stop asking whether 08:00 is the right minute.
- Printed beside, and it agrees with PH: A2 makes +6.51R on 43 lively-hour days (+0.15R each) and +30.20R on 53 quiet ones (+0.57R each). PH2 stays the
  paper line for that; nothing new to test here.
Counts: ideas 62, variants 173 (ET1 ET2 ET3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1.

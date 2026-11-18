# Review: A2's last 10 PAPER losers, by eye, valid vs mistake (coach 08-11: "a2 paper is bleeding"). Written Tue 2015-08-11 22:00 London.
A study, not a test: no idea counted, no rule touched. Source: the engine's A2 list (14 paper losers since 07-08; the last 10 below),
charts from bt/loss_grid.py (M15, evening before -> 13:00), journal/A2-paper-record.md, the week files' call commits.

## What "valid" means for a paper day (so the tag is not a feeling)
VALID = (1) the call was committed before the 08:00 bell (commit "paper call before the bell" exists for each date); (2) the side in my
record equals the engine's A2 side (checked with `bt/coin_control.py ... --check`, column "mine True"); (3) no order was placed;
(4) the R in my record is the engine's. A MISTAKE would be any of those broken, or a hand-made number.

| # | day | side | R | how it lost (by eye) | tag |
|---|---|---|---|---|---|
| 1 | Wed 07-15 | sell | -0.48 | rose 35 pips after the bell, 5 pips from the stop, then came back to the clock | VALID (note: 10:00 note figures were P12-affected, corrected 07-27) |
| 2 | Tue 07-21 | sell | -0.74 | sold the bottom of a night-long fall; the morning rose all the way to noon | VALID (P12 note, corrected) |
| 3 | Wed 07-22 | buy | -1.03 | bought the top of a lively pre-bell rise (34 pips); drifted down, stopped 11:25 | VALID (P12 note, corrected) |
| 4 | Fri 07-24 | buy | -1.03 | bought into a pre-bell spike up (32 pips); 60 pips down in 30 minutes, stopped 08:30 | VALID (P12 note, corrected) |
| 5 | Tue 07-28 | buy | -0.67 | a steady fall since the evening carried on through the morning | VALID |
| 6 | Thu 07-30 | buy | -0.11 | a 0.6-pip signal on a flat morning: a coin, lost the spread | VALID |
| 7 | Fri 07-31 | sell | -0.68 | dipped, then rose 60 pips into noon | VALID |
| 8 | Tue 08-04 | sell | -0.53 | sold the low of a night rally; the morning kept rising | VALID |
| 9 | Fri 08-07 | sell | -0.32 | quiet morning drifting up, 6 pips from the stop at its worst | VALID |
| 10 | Mon 08-10 | buy | -0.80 | rose 18 pips, then fell 50 by noon | VALID |
Sides re-checked against the engine today for 07-21, 07-22, 07-24, 07-31: all "mine True". Calls: one before-the-bell commit per date.
**10 of 10 VALID. 0 trade mistakes.** One process mistake touches four of them (P12, the walk-note window 07-13..07-27): the notes'
best/worst figures, never the side, the tag or the R. Already counted and corrected on 07-27.

## What the 10 have in common
- Only 2 of 10 were full stops (07-22, 07-24); 8 went to the clock. The paper record does not bleed through stops; it bleeds through
  mornings that drift the wrong way a little: average loss of the 10 = -0.64R.
- In 6 of 10 the morning went the opposite way to A2's side from the bell and kept going (07-15, 07-21, 07-28, 07-31, 08-04, 08-10).
  That is the 3-day direction being wrong about the next four hours: the RG finding, live on paper.
- 2 of 10 were entries after a lively pre-bell hour in A2's direction (07-22, 07-24): PH2's ground, on paper with its own gate.
- 1 was a falling night under a buy (07-28): tested twice (ON, NA) and killed; today's +1.66R morning had the same picture.

## What a better trader would have done
Nothing different on any single morning that I have not already tested and killed. He would have done what the rule already did:
stopped trading A2 for money on 07-08. The bleed is on paper; the account has lost $0 since 07-07. If A2 had been live at 0.16 lots,
these 10 would have cost about 6.4R x $62.50 = about $400; at the probation size, about $100.
A2 paper since 07-08 after today: 25 days, -2.58R; monitor -0.395R; gate +0.60R. Nothing in these 10 days changes a line.

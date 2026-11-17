# Idea LM2 out of sample: fade the lively hour before the bell (idea 112; coach 07-24: the single most promising idea; route B hunt)
Written Fri 2015-07-24 22:00 London (weekend), before any code or run.

## Why this one
- Tested ONCE, on 05-07 (journal/2015-idea-LM-lively-morning.md), data to 05-06, then never run again. LM2: 35 lively mornings, 51% wins,
  +0.203R (+-0.34), net +7.11R, DD 3.11R, positive in both periods, positive without its best 3. It passed five lines and failed one:
  K5 "beats A2 on the same mornings by 0.15R" (A2 made +0.205R there). That line asked whether it should REPLACE A2. A2 is off now;
  as a stand-alone setup the question is different.
- Market reason, from my own counts: a move made in the thin hour before London proper is given back (chasing it lost 0.22R a trade in
  May); 4 of my 10 worst trades (replay 07-24) were entries after such a spike; since June mornings go both ways far more often (MC facts).
- It does not use A2's 3-day direction at all.
- Every lively morning from 05-07 on has never been seen through it. Contamination, stated: I HAVE seen A2's results on those mornings
  (PH2 tally: 42 lively days from 05-01, A2 -8.29R). Where A2 was the fade side that is the same trade, so I know indirectly it was no
  feast. I have not seen LM2's own number.

## The rule, UNCHANGED from May (London time)
Lively morning = the 07:00-08:00 range is 30+ pips. At 08:00: market order AGAINST the hour's net move (07:00 open to 08:00 open),
stop 40 pips, out 12:00, one trade. A net move of zero -> no trade. Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.
ONE variant (LM2). LM1 (with the hour) is printed beside it as the control, not as a candidate. Variant cap: these two, nothing else.
Judged ONLY on lively mornings 05-07..07-24.

## Cases before outcomes, and a mechanics check that needs no new outcome
Count the unseen lively mornings first, by half (05-07..06-15, 06-16..07-24). Under 25 -> not judgeable -> stays dead.
Mechanics: my new script must reproduce May's published figure on days to 05-06 (35 trades, net +7.11R) before I look at anything new.

## Kill lines (May's thresholds where they exist; all must pass on the unseen mornings)
U1 average >= +0.15R. U2 net above zero in each half. U3 net above zero without its best 3 trades. U4 max drawdown <= 5R.
U5 stressed average above zero. U6 LM2's average above LM1's (the fade must beat the chase, as in May; a sign check, no p-value:
I wrote on 07-17 that a p-value line needs a sample that can pass it, and about 40 trades cannot).
Power, written first: about 40 trades, spread about 1.1R -> error on the average about 0.17R. A rule with NO edge clears U1 about one
time in five; with U2-U5 on top, less, I guess under one in ten, but that is a guess, not a computed number.
A pass = route B step B1 (a pre-registered rule passing on a never-seen part), nothing more: then the 40 forward paper trades of B2
(about 3 months at this rate of lively mornings) and my coach's word (B3). A fail = dead for good, as with BX2.
My guess: positive but under +0.15R; U1 fails.

## Counts and mechanics (tool, before the unseen outcomes)
Tool: `python bt/lively_fade_oos.py 2015-07-25 count` / `old` (no unseen outcome).
- Unseen lively mornings 05-07..07-24: 38 (22 before 06-16, 16 from); the hour went up on 19 and down on 19. Judgeable (>= 25).
  Cross-check: my PH2 tally has 42 lively days from 05-01; 4 of them are 05-01..05-06. Same 38.
- Mechanics on the May sample: 35 trades, net +7.15R, +0.204R a trade. May's journal: 35 trades, +7.11R, +0.203R. Same trades; the
  0.04R is a rounding difference between the two scripts that I have not traced (about 0.001R a trade). Stated, not hidden.
- Worked case, today Fri 07-24: pre-bell hour 1.09637-1.09957 (32.0 pips), net up (07:00 open near 1.0975, 08:00 open near 1.0991) ->
  LM2 SELLS at 08:00, stop 40 above. The engine's "other side" of A2's paper buy today was +0.87R, so the tool must show sell, +0.87R.

## Result (one run)

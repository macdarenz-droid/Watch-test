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

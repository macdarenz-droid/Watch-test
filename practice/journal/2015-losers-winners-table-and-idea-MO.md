# A2's last 12 losers beside its last 12 winners, at entry time - then idea MO (Mondays)
Coach 05-18: "next backtest should be about finding or improving an entry edge, starting from your own A2 losers and winners."
Sim clock Tue 2015-05-19 01:00 London. END 2015-05-19.

## The look (`python bt/wl_table.py 2015-05-19`; selection rule written into the script: the LAST 12 losing and LAST 12 winning days, no picking)
Only things I can know at 08:00: weekday, side, age of the signal (days in a row it has pointed this way), run (22:00 closes in a row in my direction),
where the entry sits in yesterday's range (pos_y), the hour before entry in my direction (pre), the night in my direction.
| | losers (12, 04-16..05-18) | winners (12, 04-15..05-14) |
|---|---|---|
| buys | 9 | 9 |
| median signal age | 2.0 | 2.5 |
| median run of closes | 2.0 | 2.0 |
| median pos_y / beyond yesterday's extreme | 0.54 / 2 | 0.58 / 1 |
| median hour before entry, my direction | -9.9 pips | -11.4 pips |
| median night, my direction | -7.9 pips | -2.8 pips |
| flip days (age 1) | 4 | 3 |
| hour before entry 20+ pips WITH me | 4 | 3 |
| MONDAYS | 5 (04-20, 04-27, 05-04, 05-11, 05-18) | 0 |
What I see, written before any count on the rest of history:
- At entry time the two groups are the same trade. Age, run, place in yesterday's range, the hour before, the night: the medians sit on top of each other.
  This is the sixth review that ends here (FH, ON, XS, PH, the BX/SI/TD review, this one). The entry has nothing left that I can see at 08:00.
- "I bought the top of the hour" (my live notes of 05-14 and 05-15): 4 losers and 3 winners had the hour running 20+ pips with me. A feeling, not a pattern.
- The one thing that is not the same: every one of the last five Mondays lost, and no Monday is among the last 12 winners.
- What I already know against it, and say before testing: on 04-08 I grouped 34 Jan-Feb trades by weekday. Mondays: 7 trades, 4 wins, +0.26R each, positive
  in both months (Jan +0.65R, Feb +1.20R net). I wrote then: "ten looks at 34 trades - something will always stand out". Five Mondays in a row is a
  1-in-32 event for a coin; I have looked at many such splits. My honest prior: a streak.
- Why test it anyway: it is the only thing the table offers, it has a mechanism I can state, and a clean kill removes it from my head on Monday mornings.

## Idea MO (idea 61) - PRE-REGISTRATION (pushed before any code or count beyond the table above)
Hypothesis: A2's Monday trades have no edge. Mechanism: the signal is the Friday 22:00 close against three closes back; at Monday 08:00 it is 58 hours
old instead of 10, and the Sunday-night market has moved on without it.
Variants (2, not 3 - I have no honest third):
- MO1: A2 Tuesday to Friday only (no Monday trade).
- MO2: A2 with Mondays kept only when the weekend move (Friday 22:00 close -> Monday 08:00 open, bid) is in the signal's direction: the signal refreshed.
Data: all A2 days before END 2015-05-19. Contamination, all stated: (1) the 24 table days are the inspiring days and are DROPPED for the decision (that
removes all five losing Mondays; if the hypothesis is real it must show on the Mondays before 04-15); (2) I already know Jan-Feb Mondays were +0.26R on
7 trades in the old engine: so I expect this to fail and say so; (3) W "no Friday" was the same kind of idea and is still pending with no evidence.
Kill lines (decision set = history without the 24 table days; one failure kills):
- K1: the Monday trades average 0R or less AND at least 0.30R below the Tuesday-Friday average.
- K2: Mondays below Tuesday-Friday in both halves (before 03-02; from 03-02).
- K3: the filter does not cost money: net R of the variant >= A2's net R, and max DD not larger.
- K4: at least 12 Monday trades in the decision set. (30 cannot be reached: history has about 20 Mondays and 5 are dropped. Said plainly: whatever comes
  out, a dozen Mondays is a thin book, and a survivor would only get a forward paper tag.)
- MO2 extra: the kept Mondays must average above the removed Mondays by 0.30R or more, else "refreshed" means nothing.
Reported beside, not used: the same numbers with the 24 days back in.
Hand-check before totals: two Mondays - the weekday, the weekend move and its sign against the bars.
My guess, written now: on the decision set Mondays make about +0.2R each; K1 fails; both variants killed; the five losing Mondays were a streak.

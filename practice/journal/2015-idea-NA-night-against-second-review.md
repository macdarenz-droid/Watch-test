# Idea NA: night against me, second losers review (idea 103; coach 07-13: every A2 loss since May by eye -> one pre-set filter,
# pre-May history first, then lived days). Written Mon 2015-07-13 22:00 London, before any code or run.

## 1. Review (study): 31 A2 losses 05-04..07-13 (24 full stops), small M15 charts, bt/loss_grid.py
Market vs mistake: all 31 entries were rule-valid (26 live with tag VALID in the tracker, 5 paper/engine). No mistake of mine to filter.
By eye, two pictures repeat:
A. NIGHT AGAINST: the price moved against my side from midnight to the entry and London carried on. I count about 15 of 31
   (05-12, 05-18, 05-22, 06-01, 06-08, 06-11, 06-19, 06-23, 06-24, 06-29, 07-03, 07-06, 07-07, 07-10, and half of 05-29).
B. SPIKE WITH ME just before the entry, then straight back (05-04, 05-11, 05-15, 06-03, 06-10, 06-22, 07-13 ...). This is PH2's
   ground (lively pre-hour), already a paper tag with its own gate. Not touched.
Honest history of A: I found the same picture in my review of 15 losers 02-27..04-22 (idea ON) and tested it (ON, NM): gap +0.55R on
all history then, but only +0.19R on the un-reviewed part -> killed. Base rate then: night against on 37 of 77 mornings, and those
mornings held 19 of 49 WINNERS too. So: seen twice in two separate loss sets, but a loss review alone always shows it (about half of
all mornings have it). My method rule from April: winners beside the losers and the base rate first. And my April note: no look at
the live night-against count before 40 of them.

## 2. ONE filter (no variants): NA = skip the A2 trade when (open 08:00 - open 00:00 London), signed by my side, is -15 pips or worse.
This is NM2 of April, unchanged; no new threshold from the charts above.
Worked case to check with the tool before the run: Fri 07-10, sell; my 08:00 note said the night was against by 24.5 pips -> NA skips.

## 3. Order of the test and kill lines
Step 0 (facts only): count NA days pre-May (01-05..04-30) and from 05-01; share of all A2 days.
Step 1, PRE-MAY (independent of this review; but I have run NM2 on most of it before, so it is a re-run, not a fresh test):
 K1 the skipped days average at least 0.30R WORSE under A2 than the kept days, and the skipped days average below zero.
 K2 the same sign (skipped worse than kept) in Jan-Feb and in Mar-Apr separately.
 K3 it skips at least 10 days and at most 40% of days.
 Any fail -> KILLED again, and no look at the lived days' outcomes (my April rule stands; the coach's order was "pre-May first, then").
Step 2, only after a pass: lived days 05-01..07-13, reported as CONTAMINATED (the picture was found there): skipped vs kept average,
 and the feature's share among winners against losers. A pass in both = a paper tag with 30 forward cases, never a live rule now.

## 4. Counts and worked case (tool, before any outcome): `python bt/night_filter.py 2015-07-14 count` / `check 2015-07-10`
- Worked case 07-10: sell, night -25.0 pips against (tool; my live note said 24.5 from the last price) -> NA skips. As expected.
- Mechanics: my skipped days equal the days the engine's NM2 leaves out: 0 differences.
- Pre-May: 83 A2 days, NA on 24 = 29%. From 05-01: 52 days, NA on 24 = 46%. (Nights against me became more frequent; a fact, no outcome.)

## 5. Result

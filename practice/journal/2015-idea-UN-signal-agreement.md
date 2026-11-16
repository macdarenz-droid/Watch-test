# When my direction signal's neighbours disagree with it: is the trade weaker? HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Tue 2015-04-21 01:00 London (end of released data). All lived history 01-06 .. 04-20 (explicit end date 2015-04-21); costs on; London time.

## Why this one, and what I counted before choosing it
The coach asked for a test with enough trades to mean something (30+), or a plain statement of why not. A2's direction comes from ONE number: the last 22:00 close
against the close 3 trading days earlier. In January I checked that lookbacks 2 and 5 also make money (idea L) - the "3" is not a lucky number. What I never asked is
what happens on the days when those neighbours point the OTHER way. A better trader would call such a morning "no clear direction".
Counted first (occurrences only, no results looked at):
- A majority vote of the 2-, 3- and 5-day signals differs from my 3-day signal on 3 days out of 76. THREE cases: that version cannot be tested, and I say so plainly
  rather than run it. (The 3-day signal is the middle one; it can only be outvoted when 2 and 5 agree against it.)
- The three signals are NOT unanimous on 25 of 76 days (6 in January, 9 in February, 10 in March-to-now); unanimous on 51. That split uses every trade and the smaller
  group is 25 - under 30, so the average of the smaller group is known to about +-0.41R (two standard errors at 1.03R per trade) and the difference between the groups
  to about +-0.50R. It can show a large effect and cannot show a small one. It is the largest sample this question can have on my history.

## What I already know (contamination, honestly)
- Flip days (the first day after the 3-day signal changes) earned about the same as other days (FL test) - many disagreement days are days around a flip.
- Trades against the 10-day trend earned +0.35R (SD test). Lookback 10 by itself was bad; 2 and 5 were positive but lower than 3 in January.
- All of that says: disagreement among lookbacks has not looked like a warning so far. So my prior is that this fails. I run it because it is the one question about the
  signal itself that I have not asked, and because it has the sample.

## Hypothesis
On mornings when the 2-, 3- and 5-day signals do not all agree, A2's direction is unreliable: those trades have clearly lower expectancy than unanimous days, in every
part of my history.

## Variants (111, 112, 113; ideas -> 42), no others afterwards. Everything else exactly A2. Derived from A2's own daily results (a skipped day = 0R, a half-size day = half its R).
- UN1: no trade unless the 2-, 3- and 5-day signals all agree.
- UN2: half size on the days they do not all agree.
- UN3: no trade when the 3-day and the 5-day signal disagree (the 2-day one ignored as too jumpy).

## KILL TEST (explicit; the same lines as for every filter). The build can only kill; a survivor gets a forward paper tag (no adoption question before 200 forward trades).
A variant survives only if ALL:
  K1. avg R per A2 signal day at least A2's + 0.05R;
  K2. the days it changes are WORSE under A2 than the days it leaves alone, by at least 0.3R on average;
  K3. that is true in at least 2 of the 3 periods (January, February, March-to-now), and in no period are the changed days better than the others by more than 0.3R;
  K4. it changes at least 10 days and leaves at least 60% of the days alone.
My guess, written now: disagreement days earn about +0.3R against about +0.5R for unanimous days; the gap is under 0.3R and flips sign in at least one period; all three fail K1 and K2.

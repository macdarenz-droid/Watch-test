# Idea DT: the second test of the day's high or low fails (idea 126; coach 08-11: hypothesis + kill line + min sample check first)
Written Tue 2015-08-11 evening (clock Tue 08-11 22:00 London; no new day yet), before any outcome.

## Searched first (lesson from FB): STATE.md for "double top", "retest", "second test": nothing. Related but different:
PD (fade the FIRST touch of YESTERDAY's extreme, killed), FB (retracted, = PD3), RT (round numbers, killed). Never: a SECOND touch of
TODAY's extreme after a pullback.

## Hypothesis
When the London morning makes the day's high (or low), pulls back, and returns to it, the second test fails more often than not and the
price turns away (a "double top"), because the first test already showed sellers there. Against it: the regime facts say moves come back
since April; before April they carried. I expect the split again.

## ORDER OF WORK (GC lesson): step 1 counts only, at a grid of thresholds, NO outcomes; step 2 fix the thresholds from the counts and
write them here; step 3 one outcome run.
Setup, London time: the day's extreme so far (from 07:00) is set before 11:00. Then a pullback of at least P pips from it. Then, between
11:00 and 15:00, the first M5 candle whose high comes within 3 pips of that high (or low within 3 pips of that low) = the retest.
Entry: next candle's open, AWAY from the extreme (sell at a retested high). Stop 25 pips. Out 2 hours after entry.
Grid for step 1: P = 15, 20, 30 pips.

## Minimum sample and kill lines (fixed now, before any count)
MIN SAMPLE: the judged variant needs 120+ trades and 50+ from 04-07. I choose P as the LARGEST grid value that still meets it (a bigger
pullback makes a cleaner pattern); if none meets it, the idea is killed for sample with no outcome run.
Three variants, no others: DT1 (judged) the chosen P; DT2 (dose) the next larger P on the grid (or 40 if the chosen one is 30);
DT0 (control) DT1's signals traded THROUGH the extreme (a break), same stop and exit.
Kill lines for DT1 (four, all must pass): K1 average >= +0.10R after costs (1.0 + 0.1). K2 net above zero before 04-07 AND from 04-07.
K3 stressed average (2.0 + 0.5) above zero. K4 DT1 minus DT0 above zero, sign-flip p < 0.05.
My guess: a coin minus costs, positive only after 04-07.

## Step 1, counts only (tool `python bt/retest_extreme.py 2015-08-12 count`; no outcomes)
| P (pullback) | trades | before 04-07 | from 04-07 | retests of a high / of a low |
|---|---|---|---|---|
| 15 | 127 | 54 | 73 | 57 / 70 |
| 20 | 117 | 46 | 71 | 53 / 64 |
| 30 | 79 | 30 | 49 | 34 / 45 |
| 40 | 59 | 24 | 35 | 23 / 36 |
## Step 2, thresholds fixed by the line written before the count
Largest P with 120+ trades and 50+ from 04-07: **P = 15** (127 / 73). So DT1 = P 15 (judged), DT2 = P 20 (the next larger), DT0 = break on DT1's signals.
How the code reads my rule, said before any outcome: the "retest" is the first M5 candle from 11:00 whose high comes within 3 pips of the
morning's high, INCLUDING a candle that goes through it; entry is at the next open whatever that candle did. (A branch meant to drop
days that break the extreme before retesting never fires, because a candle above the extreme is also within 3 pips of it. I keep the
rule as coded and say so, rather than edit it now.) One trade a day: the first retest of either side.
Worked case Tue 08-11: the morning high 1.10491 (from 07:00 to 11:00, after the +82-pip A2 paper morning); pulled back 15+; the 12:40
candle came back within 3 pips -> DT1 SELLS at the 12:45 open, stop 25 above, out 14:45. Today's close was 1.10416, near that high,
so I expect a small result either way.

## Step 3, result (one run: `test 15 20`)

# Idea ND: the day after a narrow day breaks out (idea 144; coach 08-25: next backtest). Written Tue 2015-08-25 22:00 London, before any count or outcome.
Searched ("narrow", "nr4", "inside day", "small day", "quiet day"): BS used "nr4" as one FEATURE of A2's best days (killed); QW tested weeks
(quiet week -> next week, killed); BK traded the night-box break the day after a BIG day. Never: the break of a NARROW day's own range the next day.

## Hypothesis
A narrow London day is a pause; the next day's first break of that day's high or low starts a move that carries on.
Against it: MB2 (afternoon break of the morning range) and BK (night box after a big day) both lost: breaks did not carry past the stop.
And my findings say entering after a move loses; here the entry is at the break of a level, not after a long run, so it is a fair new question.

## Rule (London time, one trade a day)
Narrow = yesterday's London-day range (22:00 -> 22:00) <= Q x the median of the 10 London-day ranges before it.
Today, 08:00-16:00: the first M5 candle that CLOSES beyond yesterday's high (low) -> market order at the next M5 open in that direction,
stop 30, out 20:00.
## Order of work: step 1 counts only for Q = 0.7, 0.8, 0.9. Step 2: Q = the SMALLEST (narrowest) grid value with 80+ trades and 35+ from
04-07 (once-a-day line); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): ND1 (judged) the chosen Q; ND2 (dose) the next smaller Q (or 0.6 if the chosen is 0.7); ND0 (control) ND1's
signals faded.
Power (once-a-day): about +-0.2R at 80-120 trades; a no-edge rule clears +0.10R about one time in four. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for ND1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 ND1's average R >= +0.10R.
K2 ND1's net R above zero BOTH before 04-07 AND from 04-07.
K3 ND1's average R at stressed costs above zero.
K4 ND1 minus ND0, trade by trade, above zero with sign-flip p < 0.10.
My guess: positive before 04-07, negative after (K2 fails), like MB2.
Also found after pushing the above (read before any count): BS (06-15) noted A2's 15 best days followed a NARROW day only 2 times in 15
(base 32%) - "best days follow WIDE days". That is about A2's direction, not about a narrow-day break, but it is a hint against ND, declared.

## Step 1, counts only (tool `python bt/narrow_day.py 2015-08-26 grid`)
107 days with a break of yesterday's range 08:00-16:00 (01-21..08-24). Q = 0.7: 17 trades (7 / 10). Q = 0.8: 30 (11 / 19). Q = 0.9: 46 (12 / 34).
## Step 2: no grid value meets 80+. KILLED FOR SAMPLE, `test` NOT run, outcomes unseen.
MY DESIGN SLIP: after CS (08-12) I wrote "a once-a-day condition must hold on about 55% of days to reach 80, checked on paper before
writing the rule". A "narrow day" (under 0.9 of the median) holds on well under half of the days by construction; even with no filter only
107 days have a break at all. I skipped my own paper check. No number is wrong; one pre-registration was wasted. The check is now the first
line of every once-a-day pre-registration: "expected share of days, from the definition, before any count".
Counts: idea 144 (killed for sample); variants none run.

# Idea MB2: the afternoon break of the morning's range (idea 127; coach 08-11: best idea, hypothesis + kill line + min sample first)
Written Tue 2015-08-11 evening (clock Tue 08-11 22:00 London; no new day yet), before any count or outcome.

## Why this is my best idea now
Three "level holds" ideas died the same way (PD: 76% of first touches of yesterday's extreme ran 30+ pips beyond; RT: round numbers
went through; DT: half the retests of the day's extreme were full stops for the fade). The one thing they agree on: levels that are
watched break. Their break CONTROLS were a coin (RT +0.034R, DT -0.003R) - but each was a by-product on someone else's signals, never a
rule built for the break. Searched STATE.md ("morning range", "07:00-11:00", "afternoon break"): only a study of the morning range's
size (03-xx), never its break as a trade. Not BK (the 00:00-08:00 box after a big day) and not BX (the 12:00-13:25 box, dead).

## Hypothesis
When the price leaves the London morning's range (07:00-11:00) in the afternoon, it carries on in the direction of the break.

## ORDER OF WORK: counts first at a grid, a pre-written rule picks the threshold, one outcome run.
Rule (London time, one trade a day): morning range = high and low of 07:00-11:00. Break = the first M5 candle between 11:00 and 15:00
that CLOSES at least B pips beyond the range. Entry at the next open in the break's direction, stop 25 pips, out at 17:00.
Grid for the count: B = 0, 3, 6 pips.
MIN SAMPLE (fixed now): the judged variant needs 120+ trades and 50+ from 04-07. Pick the LARGEST B on the grid that meets it (a cleaner
break); none -> killed for sample, no outcome run.
Three variants, no others: MB1 (judged) the chosen B; MB2 (dose) the chosen B and a morning range under its 20-day median (a break out
of a quieter morning should carry better if the idea is right); MB0 (control) MB1's signals faded back into the range.
## Kill lines for MB1 (four, all must pass)
K1 average >= +0.10R after costs (1.0 + 0.1). K2 net above zero before 04-07 AND from 04-07. K3 stressed (2.0 + 0.5) average above zero.
K4 MB1 minus MB0 above zero, sign-flip p < 0.05.
My guess: a coin, positive before 04-07 and negative after, like every follow rule.

## Step 1, counts only (tool `python bt/morning_break.py 2015-08-12 count`; no outcomes)
| B (pips beyond, on a close) | trades | before 04-07 | from 04-07 | up / down | quieter-than-median morning |
|---|---|---|---|---|---|
| 0 | 125 | 55 | 70 | 55 / 70 | 59 |
| 3 | 119 | 52 | 67 | 54 / 65 | 56 |
| 6 | 109 | 50 | 59 | 49 / 60 | 51 |
## Step 2, threshold fixed by the line written before the count
Largest B with 120+ trades and 50+ from 04-07: **B = 0** (125 / 70); B = 3 has 119, one short. So MB1 = any M5 close beyond the
range; MB2 = the same on the 59 quieter mornings; MB0 = fade.
Worked case Tue 08-11: morning range 85.9 pips (07:00-11:00, the +82-pip A2 paper morning; not a quieter one); the first close above the
morning high came at 13:10 -> MB1 BUYS at the 13:15 open, stop 25 below, out 17:00. DT's hand check today showed the price at 1.10708
by 14:45 (the fade's stop) and 1.10633 at 14:45 for the break; today's last price 1.10416 is lower: I expect a modest result, sign unclear.

## Step 3, result (one run: `test 0`)

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
Tool: `python bt/morning_break.py 2015-08-12 test 0`. Hand check 08-11: the break bought 1.10563 at 13:15, out 17:00 at 1.10409, -0.62R; the
fade sold 1.10551 and was stopped at 1.10803, -1.01R. ("Modest, sign unclear": it was -0.62R.)
| variant | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| MB1 break of the morning range (JUDGED) | 125 | 32% | -0.117 (+-0.27) | -14.60 | 78 | -1.99 | -12.61 | -0.196 |
| MB2 the same, quieter mornings only | 59 | 41% | +0.195 (+-0.45) | +11.50 | 32 | +13.56 | -2.06 | +0.135 |
| MB0 fade on MB1's signals (control) | 125 | 38% | +0.013 (+-0.26) | +1.67 | 69 | -6.58 | +8.25 | -0.047 |
MB1 minus MB0 -0.130R (sign-flip p 0.56). MB1: all four kill lines FAIL. **MB2 (the idea) IS KILLED.**
What I learned: 1. "Watched levels break" is true as a description (PD, RT, DT) and not tradable as a follow: the afternoon break of
the morning range lost -0.117R, mostly after 04-07, with 78 full stops in 125. A level breaking is not the same as a move carrying on
past the break by more than my stop.
2. MB2 (+0.195R on 59 quieter mornings) is the dose line, not the judged rule: all its profit is before 04-07 (+13.56R) and it is
negative after (-2.06R); the error bar is +-0.45R. Same shape as every follow rule. Not promoted, not re-cut.
3. The fade control lost before 04-07 and made money after: the regime split a seventh time.
Counts: idea 127; variants 350-352; second setups tried 28, none alive.

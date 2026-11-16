# Daily loss stop and per-trade risk for "the last 3.x R" - the math, and ONE pre-registered test (written before any run)
Clock Tue 2015-03-24 00:00 UTC (end of released data).

## First, what changed since the question was asked
The brick was: "3.x R to go in phase 2 - what risk finishes in ~2 weeks with the lowest breach odds?" This morning's trade (+2.52R) finished phase 2. So the answer can no longer
steer this phase. I am doing the work anyway, exactly as asked, for two reasons: it tells me whether the size I actually carried through the last stretch (0.75%) was the right one
or just the one that happened to win, and the same situation - a few R short of a target - will come back in any next account.
The numbers are set at the state I was in when the question was put: balance $25,770.80 (+3.08%), $479.20 to the target, 10 trading days done.

## The fixed facts
- Limits: 5% daily loss (floating counts) and 10% total, both on $25,000. From +3.08% the breach line (-10%) is 13.1% of the account away; a daily breach needs -$1,289 in one day.
- My structure: one trade a day, flat by noon, stop 40 pips. So my DAILY LOSS STOP is one trade's risk - there is no second trade to stop. Worst day = risk x 1.03 (slippage).
- My own brakes: -4% from the phase start -> 0.5%; -6% -> stop. From +3.08% those are 7.1% and 9.1% away.
- Distance to the target in R depends on the size:
| Risk per trade | $ at the stop | R still needed | Worst day | Full stops in a row to my first brake | ...to the 10% breach | Daily limit used by one stop |
|---|---|---|---|---|---|---|
| 0.50% | $125.00 | 3.83R | -0.51% | 14 | 26 | 10% |
| 0.75% | $187.50 | 2.56R | -0.77% | 9 | 17 | 15% |
| 1.00% | $250.00 | 1.92R | -1.03% | 7 | 13 | 21% |
- "About two weeks" = 10 trading days = 10 trades. Average R needed over 10 trades: 0.38R at 0.50%, 0.26R at 0.75%, 0.19R at 1.00%.
  My planning edge for an ordinary month is +0.18R (February at realistic costs); February at sim costs +0.23R; March forward so far +0.50R (two trend runs).
- First reading, before any simulation: at 0.50% two weeks needs a better-than-February month; at 0.75% it needs February plus a little; at 1.00% February is enough.
  Breach is not the constraint at any of them (13+ full stops in a row; my worst run ever is three). The real trade-off is time against how hard a ZERO-edge rule hits my brake.

## The test: one question, three sizes (3 policy runs on my own results; no price data and no rule variant, so the variant count stays 56)
Reshuffle my own trade results (20,000 paths per cell, one trade a day, brakes on, finishing size ignored) from the state above, at 0.50%, 0.75% and 1.00%.
Pictures of the edge, as in the phase 2 size test, plus the lived month: February (+0.23R), February at realistic costs (-0.05R per trade), March forward (the 16 lived trades),
zero edge, and -0.10R.
Outputs: chance to finish within 10 and within 20 trading days; chance my -6% brake stops me within 60 days; chance of a true 10% breach.

## Decision rule (fixed now)
"The right size for the last stretch" = the SMALLEST of the three that satisfies both:
  (1) on the February-at-realistic-costs picture it finishes within 10 trading days at least 50% of the time, or failing that for every size, within 20 days at least 70% of the time;
  (2) on the zero-edge picture my -6% brake is hit at most 3% of the time within 60 days, and the true breach chance is 0%.
If no size satisfies both, the answer is the smallest size that satisfies (2), and "about two weeks" was not a goal I could responsibly aim at.
Then I compare the answer with the 0.75% I actually used and say plainly whether I was right, lucky, or too small.
What this can change: the size rule for the end of a phase in any NEXT account. It cannot rewrite what already happened.

My guess: 1.00% is the only size that reaches 50% in two weeks on a realistic February; 0.75% reaches the 70%-in-20-days line; so the rule will name 0.75%, and "two weeks" was optimistic.
Nothing above has been run.

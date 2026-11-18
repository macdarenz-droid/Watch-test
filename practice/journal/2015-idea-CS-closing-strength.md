# Idea CS: yesterday's close near its extreme points the next morning (idea 131; coach 08-12: a FRESH once-a-day idea under the new sample rule)
Written Wed 2015-08-12 evening (clock Wed 08-12 22:00 London; no new day yet), before any count or outcome.

## Fresh? Searched first
STATE.md "close position", "closing strength", "outer quarter": only PZ (06-24), which filtered A2 by where the 08:00 PRICE sat in
yesterday's range on A2's side, and was killed on held-out days. CS is not an A2 filter and not the 08:00 price: it takes its DIRECTION
from where YESTERDAY'S CLOSE sat in yesterday's range, with no 3-day signal at all. Not GC/GC2/NR (those were about the size of a move).
Every London morning since 01-05 has been seen through A2, so CS shares days with A2; I report how often their sides agree.

## Hypothesis
A London day that closes in the top (bottom) part of its own range shows buyers (sellers) in charge at the close; the next London
morning carries on that way. (Beginner's background: "a strong close" is in every basic chart lesson; no source I can cite.)

## Rule (London time, one trade a day)
Close position = (yesterday's 22:00 close - yesterday's low) / (yesterday's high - low), London day 22:00 -> 22:00.
If close position >= 1 - Q: BUY at 08:00; if <= Q: SELL. Stop 40 pips, out 12:00 (A2's frame, so the costs and the morning are comparable).
## Order of work: step 1 counts only for Q = 0.10, 0.15, 0.20, 0.25. Step 2: Q = the SMALLEST (strictest) value with 80+ trades and 35+
from 04-07 (the once-a-day line, plan section 9); none -> killed for sample. Step 3 one run.
THE THREE VARIANTS (named now): CS1 (judged) the chosen Q; CS2 (dose) the next stricter Q on the grid (or 0.05 if the chosen is 0.10);
CS0 (control) CS1's days traded the other way.
## Power, stated up front (sample rule): at about 80-100 trades the error on the average is about +-0.22R; a rule with no edge clears +0.10R
about one time in four. A PASS HERE IS PROVISIONAL: it only earns a pre-registered forward count on lived days, never route C directly.
## Kill lines (four, all must pass, for CS1)
K1 average >= +0.10R after costs (1.0 + 0.1). K2 net above zero before 04-07 AND from 04-07. K3 stressed (2.0 + 0.5) average above zero.
K4 CS1 minus CS0 above zero, sign-flip p < 0.10 (one-day-a-day sample; looser than the intraday 0.05, written now).
A2 IN DISGUISE: if 80%+ of CS1's trades are on A2's side, a pass is void (it would be A2's old edge again).
My guess: positive before 04-07, negative after, like every follow rule; K2 fails.

## Step 1, counts only (tool `python bt/closing_strength.py 2015-08-13 count`; no outcomes)
158 days. Q = 0.10: 22 trades (10 / 12). Q = 0.15: 47 (19 / 28). Q = 0.20: 64 (26 / 38). Q = 0.25: 78 (30 / 48).
Same side as A2: 17 of 21, 35 of 46, 48 of 63, 55 of 77 (71-81%: at or near my 80% "A2 in disguise" line at every Q).
## Step 2: no grid value meets 80+ trades (Q = 0.25 has 78). KILLED FOR SAMPLE, `test` NOT run, outcomes unseen.
I do not add Q = 0.30 after seeing 78. Two facts make the kill cheap anyway: a "strong close" is mostly A2's own direction (3 in 4 trades),
and the closes are lopsided (46 sells to 32 buys at Q = 0.25), so CS would largely have been A2 again.
Lesson for the next once-a-day idea: its condition must hold on at least about 55% of the 158 days to reach 80, and it must not be A2's
3-day direction in another form. I check both on paper BEFORE writing the rule.
Counts: idea 131 (killed for sample); variants none run.

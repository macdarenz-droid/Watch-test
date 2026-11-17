# Idea WN: skip A2 after a very wide night (idea 145; coach 08-25: "next backtest from your own journal notes")
Written Tue 2015-08-25 evening (clock Tue 08-25 22:00 London; no new day), before any count or outcome.

## From my notes
Mon 08-24 (week 35 file): "a 40-pip stop in that night's range was a coin". The night had a 129-pip range. Recent paper days with wide nights:
08-24 (129 pips, A2 +0.62R), 08-25 (74, stopped -1.03R), 08-21 (66, stopped -1.03R), 08-11 (72, +1.66R): mixed by eye; four days prove nothing.
Searched ("asia range", "night range", "wide night"): Q (January) skipped A2 after a DEAD (small) Asia session; G1, K used the Asia range's
break. Never: skip after a WIDE night. PH2 halves A2 after a lively 07:00-08:00 hour; WN uses 00:00-07:00 only, so the two do not share a window.

## Frequency check, on paper first (plan rule)
WN is a filter: it changes which A2 days trade. A2 trades every weekday, so the kept days are always 80+; the question is whether enough
days are SKIPPED to judge them: at least 25 days and 15% of A2's days, decided by the counts below.

## Hypothesis
After a night much wider than usual, the London morning is noisy enough that a fixed 40-pip stop is hit more often, and A2 does worse.

## Rule (an A2 filter; everything else is A2, costs on)
Night range = high minus low of 00:00-07:00 London. Wide = night range >= W x the median night range of the 20 trading days before.
Skip A2's trade on wide-night days.
## Order of work: step 1 counts only for W = 1.3, 1.5, 1.8. Step 2: W = the LARGEST grid value that skips at least 15% of A2's days and 25+
days. Step 3 one run on the engine's A2 list (history before 2015-08-26).
THE THREE VARIANTS (named now): WN1 (judged) skip at the chosen W; WN2 (dose) skip at the next larger W (or 2.0 if the chosen is 1.8);
WN0 (control) skip the same SHARE of the NARROWEST nights instead (if any unusual night hurts, WN0 does as well as WN1 and the idea is wrong).
Power (once-a-day filter): a skipped group of 25-40 days has an error of about +-0.3R to +-0.4R on its average. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for WN1). All R after costs: spread 1.0 + slippage 0.1 pips (the engine's A2 list).
K1 the skipped days' average R is below zero AND at least 0.30R below the kept days' average.
K2 skipped below kept BOTH before 04-07 AND from 04-07.
K3 WN1's kept-minus-skipped gap larger than WN0's.
K4 label shuffle (10,000) of WN1's gap: p < 0.10.
My guess: no difference: K1 fails. A2 made +0.62R on the widest night of all.

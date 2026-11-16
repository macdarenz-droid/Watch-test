# Backtest test: idea X "A2 has only one exit" - 3 exit/management variants (written before any run)
Clock Thu 2015-03-05 00:00 UTC (end of released data). Backtest on Jan-Feb only (END <= 2015-03-01 in every command); March is not used.

## The question (new, not another cut of February)
A2's exit is the bluntest part of the rule: a 40 pip stop that never moves and a clock at 12:00. Exits tried so far: A3 (07:00 entry, TP 60, hold to 16:00), E1 (stop 30),
T1/T2 (close at 09:00 if not working). Never tried: protecting a winner, letting a winner run past noon, or capping a winner.
What I already know and must not pretend I don't: my live winners' best point averaged 60 pips but I banked about 40 (noon exit gives some back); losers' best point averaged 14 pips;
holding EVERY trade from 12:00 to 16:00 would have lost 191 pips over 34 trades; yesterday (03-04, unseen month, NOT used here) the move continued after noon.

## Three variants (variants 24, 25, 26; ideas -> 13). Entries exactly A2 (08:00, 3-day trend, $125, initial stop 40 pips, costs on).
- X1 PROTECT (break-even): once price has moved 20 pips (+0.5R) my way, the stop moves to my entry price. Exit otherwise unchanged (12:00).
  Hypothesis: trades that reach +0.5R and come all the way back are common enough that not letting them become losers adds more than the winners it shakes out.
- X2 EXTEND (runner): at 12:00, if the trade is at least +40 pips (+1R) in profit, do not close: move the stop to lock +20 pips and hold until 16:00 (or the stop). Everything else closes at 12:00.
  Hypothesis: the days that are already +1R by noon are trend days and keep going in NY; the days that are not, are not worth holding (that is the -191 pips).
- X3 CAP (target): take profit at +60 pips (+1.5R); otherwise unchanged (12:00).
  Hypothesis: the morning move often peaks before noon and gives back; banking at +1.5R beats the clock.
One number each (20 / 40 / 60 pips), chosen as round multiples of my stop before looking at any result. No second values, no combinations, no rescue.

## Kill tests (fixed now)
Build - January: a variant survives only if avg R >= A2's avg R + 0.05R AND max drawdown <= A2's + 0.25R. The survivor with the highest January avg R is THE candidate.
No survivor -> no candidate; the idea's three variants are closed.
Check - February (CONTAMINATED): all three are run (I want the full table), but only the candidate can be claimed. It passes only if avg R >= A2's + 0.15R, net R >= A2's, max drawdown <= A2's.
Also reported, not used for the verdict: how many trades each rule touched and what it did to them, so I can see WHY it helped or hurt.

## Labels and guesses, in advance
- February is contaminated (traded it, studied its trades' best/worst points). A pass there is weaker than an unseen month; a fail is a real fail.
- My guesses: X1 hurts (shaken out of winners that dip back to entry before going); X2 hurts in January (NY reversed the morning there) and maybe helps February; X3 hurts January
  (it caps 01-15 and 01-23, my two biggest days). If so, nothing survives the build. I run it because I have been wrong about most guesses so far.
Nothing above has been run.

# RESULTS of idea X (run after commit 14a9b3c). X1/X2/X3 = variants 24/25/26; ideas 13. Costs on, $125 risk, same entries as A2. Jan-Feb only, one month per run (bt/ab_exit.py); March not used.

| Month | Rule | Trades | Win rate | Avg R | Net R | Max DD | Trades it changed (better / worse) | Net effect |
|---|---|---|---|---|---|---|---|---|
| Jan (build) | A2: stop 40, out 12:00 (before) | 19 | 74% | +0.78 | +14.79 | 1.33R | - | - |
| Jan (build) | X1 protect: stop to entry after +20 pips | 19 | 63% | +0.70 | +13.38 | 1.33R | 3 (1 / 2) | -1.41R |
| Jan (build) | X2 extend: >= +40 pips at noon runs to 16:00, +20 locked | 19 | 74% | +0.81 | +15.33 | 1.33R | 10 (4 / 6) | +0.54R |
| Jan (build) | X3 cap: take profit +60 pips | 19 | 74% | +0.64 | +12.18 | 1.33R | 7 (4 / 3) | -2.62R |
| Feb (CONTAMINATED) | A2 (before) | 20 | 55% | +0.23 | +4.64 | 1.86R | - | - |
| Feb (CONTAMINATED) | X1 protect | 20 | 45% | +0.25 | +4.94 | 1.03R | 4 (2 / 2) | +0.30R |
| Feb (CONTAMINATED) | X2 extend | 20 | 55% | +0.09 | +1.74 | 1.86R | 4 (0 / 4) | -2.90R |
| Feb (CONTAMINATED) | X3 cap | 20 | 55% | +0.24 | +4.74 | 1.86R | 3 (2 / 1) | +0.10R |

## Build (January): NO SURVIVOR
Needed +0.05R per trade over A2. X1 -0.08R, X3 -0.14R, X2 +0.03R (short of the bar). No candidate -> the three variants are closed; nothing can be claimed from February.

## What each one actually did (the useful part)
- X1 protect: in January it turned a +1.12R winner (01-14) and a +0.31R winner into zero and saved one tiny loser: winners here DO dip back to the entry before going.
  In February it saved two losers (02-18, 02-19 -> 0) and killed two small winners: +0.30R and a lower drawdown (1.03R vs 1.86R). Opposite sign in the two months. Not a rule.
- X2 extend: ten January trades were +1R by noon; four exploded in NY (01-15 +2.06 -> +4.72R, 01-16 +1.10 -> +3.43R) and six fell back to the +20 lock (01-23: +4.27 -> +2.45R).
  Net +0.54R in the trend month. In February all four runners fell back: -2.90R. So "already +1R at noon" does NOT mean the day keeps trending; in a box it means the move is done.
  My guess was the wrong way round in both months.
- X3 cap: cost 2.62R in January (it sells 01-15 and 01-23 at +1.5R), about nothing in February. A fixed target only removes the days that pay for the rest.
- Same story as every entry filter: what helps in the trend month hurts in the box month and vice versa. The noon clock is the one exit that was acceptable in both.

## Verdict
- Not adopted: A2 keeps its single exit (stop 40, out at 12:00). Variants X1, X2, X3 closed; the idea "manage the trade better" stays open.
- Yesterday's unseen day (03-04, +60 pips more after noon) is one runner that would have paid. One day, noted in the forward journal, not evidence.
- Counts: ideas 13, variants 26.

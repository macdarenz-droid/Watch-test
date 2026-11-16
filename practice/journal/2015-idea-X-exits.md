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

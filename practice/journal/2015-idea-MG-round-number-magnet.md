# Idea MG: is the London morning pulled toward the nearest 00 level? (idea 141; coach 08-20: next backtest)
Written Thu 2015-08-20 22:00 London, before any count or outcome.
Searched ("magnet", "toward the level", "round number"): RN (January) used 00 levels AHEAD of A2 as a skip filter (19 trades, nothing);
RT (08-06) traded the FIRST TOUCH of a 50-pip level (the bounce lost, the break was a coin): it told me levels are not walls. Never asked:
is the price drawn TOWARD a 00 level it has not reached yet? MG is that. A once-a-day idea under the 80 rule.

## Hypothesis
Many orders are said to sit at round numbers (background, no source I can cite). If so, a 00 level a short way off attracts the morning's price.

## Rule (London time, one trade a day)
At 08:00, nearest 00 level (1.xx00) above and below the 08:00 open; take the nearer one if its distance d is inside the window [5, W] pips.
Market order TOWARD it, target = the level, stop 30, out 12:00.
## Order of work: step 1 counts only for W = 20, 30, 40 (and the share of trades on A2's side, for the disguise check). Step 2: W = the
SMALLEST grid value with 80+ trades and 35+ from 04-07 (the tightest "near" that can be judged); none -> killed for sample. If the chosen W
has 70%+ of its trades on A2's side or on A2's opposite side, it is A2 or its mirror in disguise: killed before any outcome. Step 3 one run.
THE THREE VARIANTS (named now): MG1 (judged) the chosen W; MG2 (dose) the next SMALLER W on the grid (or 15 if the chosen is 20): a nearer
level should pull harder; MG0 (control) MG1's days traded AWAY from the level (target the same distance beyond).
Power, stated up front (once-a-day): about +-0.2R on the average at 80-120 trades; a no-edge rule clears +0.10R about one time in four.
ANY PASS IS PROVISIONAL (plan section 9).
## KILL LINES (four, all must pass, for MG1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 MG1's average R >= +0.10R.
K2 MG1's net R above zero BOTH before 04-07 AND from 04-07.
K3 MG1's average R at stressed costs above zero.
K4 MG1 minus MG0, trade by trade, above zero with sign-flip p < 0.10.
My guess: a coin (the target is close, so wins are small and stops are big): K1 fails.

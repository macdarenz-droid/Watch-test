# Idea XD: follow the side where yesterday broke the 3-day range (idea 148; coach 08-27: next backtest from my own journal notes)
Written Thu 2015-08-27 22:00 London (clock unchanged), before any count or outcome.
FROM MY NOTES: every paper call since 08-14 writes "it made the 3-day high / low" (W34 Mon 08-17, Tue 08-18 lows; Wed 08-19, Thu 08-20 highs;
W35 Fri 08-21 high, Wed 08-26 low). I never asked whether the next morning goes on in that direction.
Searched ("3-day high", "3-day low", "3-day extreme", "new 3-day"): only FB (a FADE of a failed break, retracted before code as a re-cut of PD3).
PD faded first touches of yesterday's extreme (killed); its mirror was set aside for forward use. XD is different: no touch today, the
signal is yesterday's break as of the close, entered at 08:00.
EXPECTED SAMPLE FIRST (plan rule for once-a-day ideas: 80+ trades, 35+ from 04-07): in the 6 W34-W35 calls with the line, 6 of 9 days
made a 3-day extreme (one side only) -> about 2/3 of ~169 days = ~110 for XD1. XD2 (held the break) may land under 80; if so it is reported
as too small. DISGUISE: a 3-day high usually comes with a rising 3-day close (A2's signal): counted before outcomes; 70%+ on A2's side -> killed.

## Hypothesis
A break of the 3-day range brings in new buyers (sellers) and the next London morning continues it. Background, no source I can cite.
Against it: chasing after a move has happened lost ~0.2R in TH, RS0, FX0, LM1, UD; follow rules split at 04-07.

## Rule (London time; London day 22:00-22:00; one trade a day)
Up-break: yesterday's high > the highest high of the two London days before. Down-break: yesterday's low < their lowest low.
Up only -> BUY at 08:00; down only -> SELL; both or neither -> no trade. Stop 40, out 12:00 (A2's frame).
THE THREE VARIANTS (named now): XD1 (judged) every one-sided break day; XD2 (dose) only when yesterday also closed in the half of its range on
the break side (close position >= 0.5 toward the break); XD0 (control) XD1's days the other way.
Power (once-a-day): about +-0.19R on ~110 trades; a no-edge rule clears +0.10R roughly one time in six. ANY PASS IS PROVISIONAL.
## KILL LINES (four, all must pass, for XD1). All R after costs: spread 1.0 + slippage 0.1 pips (engine default); stressed 2.0 + 0.5.
K1 XD1's average R >= +0.10R.
K2 XD1's net R above zero BOTH before 04-07 AND from 04-07.
K3 XD1's average R at stressed costs above zero.
K4 XD1 minus XD0, trade by trade, above zero with sign-flip p < 0.10.
Plus the sample line (80+ / 35+ from 04-07) and the disguise line (under 70% on A2's side), both checked on counts before the run.
My guess: disguise (killed on counts) or the usual chase loss.

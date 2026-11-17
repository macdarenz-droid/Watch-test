# Idea EN: the hourly engulfing candle (idea 130; coach 08-12: best idea, hypothesis + kill line + min sample first)
Written Wed 2015-08-12 evening (clock Wed 08-12 22:00 London; no new day yet), before any count or outcome.
No answer yet on the 120 question, so the line stands and I look only at setups that can trade several times a day.

## Why
Searched STATE.md for "engulf", "candle pattern", "pin bar", "reversal candle", "hammer": nothing. In 129 ideas I have never tested a
candlestick pattern, although "a candle that swallows the one before" is the first reversal picture every beginner's chart lesson shows
(general background, no source I can cite). My own counts add a reason: since April moves come back (MC, AR); an hour that reverses and
closes beyond the whole previous hour is that, seen on one chart.
Against it: every "it comes back" idea in the London hours paid about zero after costs (SF, MF, FX), and DT lost.

## Rule (London time; H1 candles; signal candles 07:00-16:00; one position at a time)
Bullish engulfing = previous H1 candle closed down, this one closed up, its body covers the previous body (open <= previous close, close
>= previous open). Bearish: the mirror. Entry: next H1 open in the engulfing direction, stop 20 pips, out 2 hours after entry.
THE THREE VARIANTS (named now): EN1 (judged) every engulfing as defined; EN2 (dose) only when this candle's range is at least 1.5 x the
previous candle's range (a stronger swallow); EN0 (control) EN1's signals traded the other way.
MIN SAMPLE: EN1 needs 120+ trades and 50+ from 04-07; else killed for sample with no outcome run. No grid: nothing to choose.
## Kill lines (four, all must pass, for EN1)
K1 average >= +0.10R after costs (1.0 + 0.1 = 5.5% of a 20-pip risk). K2 net above zero before 04-07 AND from 04-07.
K3 stressed (2.0 + 0.5) average above zero. K4 EN1 minus EN0 above zero, sign-flip p < 0.05.
My guess: a coin minus costs, about -0.05R.

## Counts (tool `python bt/engulfing.py 2015-08-13 count`; no outcomes)
EN1: 241 trades (105 before 04-07, 136 from) on 138 days; 132 bullish, 109 bearish; the 5 busiest days hold 19. EN2: 116 (48 / 68) on 96 days.
EN1 meets the minimum (120 / 50). EN2 is the dose line and is reported, not judged.
Worked case Wed 08-12: the 08:00 H1 candle was a bullish engulfing (the morning of the +83-pip A2 paper buy) -> EN1 BUYS at the 09:00
open, stop 20 below, out 11:00. My A2 walk had +55.9 pips at 10:00 and +68.9 at noon from 1.10745, so the 09:00-11:00 window should be
a winner unless 09:00 was near the morning's top. Two more signals that day (11:00, 14:00), both bullish.

## Result (one run)

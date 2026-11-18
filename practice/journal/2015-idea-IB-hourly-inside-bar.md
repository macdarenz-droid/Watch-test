# Idea IB: the hourly inside bar breaks out (idea 134; coach 08-13: next backtest). Written Thu 2015-08-13 22:00 London, before any count or outcome.
Searched with short words ("inside", "mother", "nr4", "pattern", "engulf"): only EN (engulfing, killed; EN2 now a forward count) and BS's
"nr4" as a day feature. No inside-bar rule ever. NOT built from EN2's numbers: a different pattern (contraction, then a break), and its
direction comes from the break, not from a reversal hour.

## Hypothesis
An hour that stays inside the previous hour's range is a pause; the first break of the previous ("mother") hour's range in the next two
hours carries on. Against it: watched levels break but did not carry past a 25-pip stop (MB2), and chasing short bursts lost (SF, FX, LM).

## Rule (London time; H1 candles; inside candle 07:00-15:00; one position at a time)
Inside = this H1 candle's high <= the previous candle's high and its low >= the previous candle's low. Then, within the next 2 hours, the
first M5 candle that CLOSES beyond the mother candle's high (low) -> market at the next M5 open in that direction, stop 20, out 2 hours later.
THE THREE VARIANTS (named now): IB1 (judged) every inside hour; IB2 (dose) only when the inside candle's range is <= 50% of the mother's
(a tighter pause); IB0 (control) IB1's signals traded the other way.
MIN SAMPLE (several trades a week): 120+ trades and 50+ from 04-07, else killed for sample with no outcome run.
## Kill lines (four, all must pass, for IB1)
K1 average >= +0.10R after costs (1.1 pips = 5.5% of a 20-pip risk). K2 net above zero before 04-07 AND from 04-07.
K3 stressed (2.0 + 0.5) average above zero. K4 IB1 minus IB0 above zero, sign-flip p < 0.05.
My guess: a coin minus costs (about -0.06R), negative after 04-07.

## Counts (tool `python bt/inside_bar.py 2015-08-14 count`; no outcomes)
IB1: 131 trades (57 before 04-07, 74 from) on 97 days; 64 up, 67 down; 5 busiest days hold 10. Meets 120 / 50.
IB2: 25 trades (14 / 11): far too few to say anything; reported as the dose line only.
Worked case, today Thu 08-13: the 10:00 H1 candle was inside the 09:00 one; the first M5 close below the 09:00 low came at 12:30 ->
IB1 SELLS at the 12:35 open, stop 20 above, out 14:35. Today's last price 1.11491 is above the A2 paper entry of 1.11272, so the
afternoon rose: I expect a loss, likely a stop.

## Result (one run)
Tool: `python bt/inside_bar.py 2015-08-14 test`. Hand check 08-13: IB1 sold 1.11053 at 12:35, out 14:35 at 1.10963, +0.45R; the control was
stopped at 1.10853, -1.06R. MY WORKED GUESS WAS WRONG: I reasoned from the day's 22:00 price that the afternoon rose; it fell first and rose
after 14:35. A worked case has to be read from the candles in the window, not from the day's last price. Noted as a method slip, not a mistake
in any number.
| variant | trades | wins | avg R | net | stops | before 04-07 | from 04-07 | stressed avg |
|---|---|---|---|---|---|---|---|---|
| IB1 follow the break of the mother hour (JUDGED) | 131 | 41% | -0.026 (+-0.21) | -3.35 | 57 | +2.10 | -5.45 | -0.109 |
| IB2 tight inside hour | 25 | 48% | -0.058 (+-0.44) | -1.46 | 10 | -2.28 | +0.82 | -0.142 |
| IB0 against IB1's signals (control) | 131 | 41% | -0.128 (+-0.20) | -16.77 | 61 | -7.82 | -8.95 | -0.218 |
IB1 minus IB0 +0.102R (sign-flip p 0.59). IB1: all four kill lines FAIL. **IB IS KILLED.**
What I learned: the break of an inside hour is a coin minus costs (-0.026R), the same as every break and burst I have tested. Fading it is
worse (-0.128R). A 20-pip stop with 1.1 pips of cost starts every trade 5.5% behind; a pattern needs a real edge to beat that, and this one
has none I can see.
Counts: idea 134; variants 359-361; second setups tried 31, none alive.

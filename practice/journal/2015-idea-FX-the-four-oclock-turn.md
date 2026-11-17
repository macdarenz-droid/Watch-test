# Idea FX: does the 15:30-16:00 London move turn around after 16:00? (idea 123; coach 08-07: next backtest)
Written Fri 2015-08-07 22:00 London (weekend), before any code.

## Why this window
Windows I have tested: night (NF), pre-bell hour (LM), 08:00-12:00 (A2 and its family), 10:00-12:00 (MF), 12:00-17:00 (BX, AF),
17:00-21:00 (EV, EF). Never the half hour around 16:00. My general background, with NO source I can cite here: a widely used
benchmark rate for currencies is said to be set around 16:00 London, and orders are said to bunch into it. I do not rely on that being
true; the test only asks whether the price moves and then comes back around that time. If it does nothing, it does nothing.

## Hypothesis
A clear move in the half hour before 16:00 London is partly taken back in the hour after.

## Rule (London time, one trade a day, weekdays)
Move = open of the 16:00 M5 candle minus open of the 15:30 candle.
- FX1 (judged): |move| >= 10 pips -> at 16:00 market order AGAINST it, stop 20 pips, out 17:00.
- FX2 (dose): |move| >= 20 pips.
- FX0 (control): the FOLLOW trade on FX1's days.
Three variants, no more. Costs on (1.1 pips = 5.5% of a 20-pip risk, a heavy handicap, stated first); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count FX1 / FX2 days before and from 04-07. Under 80 FX1 trades or under 35 from 04-07 -> not judgeable -> killed for sample.
Power: about 100 trades, spread about 1R -> about +-0.2R on the average; with 100+ the fade-minus-follow p-value means something.

## Kill lines for FX1 (all must pass)
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best 3 trades.
K4 fade minus follow above zero with sign-flip p < 0.05. K5 stressed average above zero. K6 max drawdown <= 6R. K7 dose: FX2 >= FX1.
Pass = eligible for route C after my coach's word (probation $15.63 a trade, 0.08 lots at 20 pips). Fail = killed.
My guess: about zero, then minus costs (-0.06R); K1 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/four_oclock.py 2015-08-08 count` / `check DATE` (no outcomes).
- 156 days with the candles (01-02..08-07); median |move| 11.1 pips. FX1 (>= 10): 83 days (40 before 04-07, 43 from; 46 up, 37 down).
  FX2 (>= 20): 34 days (17 / 17). Judgeable by my line (80 / 35), just.
- Worked case, today Fri 08-07: 15:30 open 1.08847, 16:00 open 1.09383, move +53.6 pips (a big half hour) -> FX1 SELLS at 16:00, stop 20
  pips above (about 1.0958), out 17:00. Today's last price was 1.09647, above that stop, so unless it fell first and rose after 17:00,
  this is a full stop for the fade and a winner for the follow.

## Result (one run)
Tool: `python bt/four_oclock.py 2015-08-08 test`. Hand check 08-07: the fade sold 1.09382 at 16:00 and was stopped at 1.09584, -1.01R; the
follow bought 1.09394, out 17:00 at 1.09564, +0.85R. As I wrote first.
| variant | trades | wins | avg R | net | full stops | before 04-07 | from 04-07 | without best 3 | stressed avg | max DD |
|---|---|---|---|---|---|---|---|---|---|---|
| FX1 fade, move >= 10 (JUDGED) | 83 | 51% | -0.035 (+-0.18) | -2.89 | 26 | +5.04 | -7.93 | -7.79 | -0.113 | 14.43R |
| FX2 fade, move >= 20 | 34 | 53% | +0.106 (+-0.30) | +3.62 | 9 | +1.37 | +2.24 | -1.00 | +0.027 | 3.73R |
| FX0 follow on FX1's days (control) | 83 | 36% | -0.220 (+-0.18) | -18.25 | 26 | -11.84 | -6.41 | -23.87 | -0.300 | 20.01R |
Fade minus follow +0.185R (sign-flip p 0.28). FX1: K1-K6 FAIL, K7 pass. **FX IS KILLED.**
What I learned: 1. The fade itself is a coin minus costs (-0.035R; positive before 04-07, negative after). 2. The CHASE of the
15:30-16:00 move lost -0.220R, negative in both periods: the same shape as chasing a lively pre-bell hour (LM1 -0.22R twice). That is
now three windows where following a short burst loses (pre-bell hour, 15-minute spike: -0.04R, half hour before 16:00). It is a
lesson about what not to do, never a rule to trade: every "fade the burst" version I have tested paid about zero after costs.
3. FX2 (+0.106R on 34) is the dose line, not the judged rule; 34 trades with an error of +-0.30R, positive in both periods but
-1.00R without its best three. I do not promote it and I do not re-cut FX around it: that would be choosing the threshold after seeing it.
Counts: idea 123; variants 341-343; second setups tried 25, none alive.

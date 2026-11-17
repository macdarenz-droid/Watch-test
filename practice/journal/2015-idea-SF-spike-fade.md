# Idea SF: fade a sharp 15-minute spike (idea 120; coach 08-05: a fresh idea from my charts with enough trades to actually judge)
Written Wed 2015-08-05 22:00 London, before any code.

## Why this shape
FD taught me that a once-a-day setup cannot be told from a coin in months. To be judgeable an idea has to trade several times a
week at least. From my chart notes the candidate is the SPIKE: "a 70-pip jump up in the last 20 minutes" then 132 pips down (07-13),
the V-turn of 04-23, the pre-bell spikes that are given back (the LM finding, +0.19R fade / -0.22R chase on 73 mornings, closed as a
setup because it trades too rarely to judge). The same picture at any hour of the day gives many more cases.

## Hypothesis
A single 15-minute candle that travels unusually far is partly taken back within the next hour.
What I hold against it: MH (06-23) studied big HOURLY moves and found they tend to carry on, and my last three "it comes back"
guesses were wrong twice (SR, EV). So the control is the follow trade, and I expect to be told which way it leans.

## Rule (London time; M15 candles built from M5; signals 07:00-20:00 only; one position at a time)
Spike = an M15 candle with range >= 25 pips and body (|close - open|) >= 15 pips.
- SF1 (judged): at the next candle's open, market order AGAINST the spike's direction, stop 20 pips, out at the open of the 5th
  candle after the spike (one hour in the trade). New spikes while a trade is open are skipped.
- SF2 (dose): range >= 35 pips, body >= 20.
- SF0 (control): the FOLLOW trade on SF1's signals.
Three variants, no more. Costs on (1.0 + 0.1 pips = 5.5% of the 20-pip risk per trade, so the bar is high); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count SF1 and SF2 trades (signals taken, after the one-position rule) before and from 04-07, and on how many different days.
Under 150 SF1 trades or under 60 from 04-07 -> not judgeable -> killed for sample.
Honest caveat written first: spikes come in clusters on a few wild days (01-15, 01-22, 03-18 ...), so the trades are less independent
than their count says. I report the share of trades on the 5 busiest days and the result without those days.

## Kill lines for SF1 (all must pass)
K1 average >= +0.10R after costs. K2 net above zero before 04-07 AND from 04-07. K3 net above zero without its best 5 trades AND
without the 5 busiest days. K4 fade minus follow above zero with sign-flip p < 0.05 (this sample can carry a p-value).
K5 stressed average above zero. K6 max drawdown <= 8R (several trades a day; wider than my usual 6R, fixed now). K7 dose SF2 >= SF1.
Pass = a pre-registered rule that passed on lived days = eligible for route C by my coach's line, at $15.63 scaled to the 20-pip stop
(0.08 lots), after my coach's word. Fail = killed.
Power: about 300 trades, spread about 1R -> error about 0.06R; a no-edge rule clears +0.10R about one time in twenty.
My guess: about zero or slightly negative after costs (-0.05R); K1 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/spike_fade.py 2015-08-06 count` / `check 2015-07-13` (no outcomes).
- SF1: 409 trades (157 before 04-07, 252 from) on 136 different days; the 5 busiest days hold 37 of them (06-10: 8, 06-29: 8, 01-27: 7,
  03-23: 7, 04-16: 7); 214 up spikes, 195 down. SF2: 179 trades (72 / 107) on 93 days. Judgeable by my line (150 / 60).
- Worked case Mon 07-13 (four signals that day): the 07:45 candle rose 64.7 pips (body +52.4) -> SF1 SELLS at the 08:00 open, stop 20
  pips above, out at the 09:00 open. That is the minute my A2 paper buy went in and was stopped by 08:05 as the price fell 132 pips, so
  this one should be a large winner for the fade (several R, since the stop is 20 pips and there is no target) and a full stop for the follow.

## Result (one run)

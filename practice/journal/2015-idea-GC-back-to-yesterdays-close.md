# Idea GC: at the bell, trade the night's move back toward yesterday's close (idea 125; coach 08-11: next backtest, 3 variants named up front)
Written Tue 2015-08-11 22:00 London, before any code. Searched STATE.md for "yesterday's close", "gap fill", "night move", "fade the night":
the night was only ever used as an A2 FILTER (NM, ON, NA) or traded DURING the night (NF, AR). Never faded at 08:00 as its own rule.

## Hypothesis
The move from yesterday's 22:00 close to the 08:00 bell is partly taken back during the London morning, toward yesterday's close.
Reason from my own counts: the night returns part of the previous day's move 63% of the time (NF); since April moves come back (MC, AR).
Against it: today's A2 paper buy came after a 48-pip falling night and the morning went the other way (+82 pips); NA showed nights
against A2's side were not a useful signal before May.

## Rule (London time, one trade a day, weekdays)
Night move = open of the 08:00 candle minus yesterday's 22:00 London close.
THE THREE VARIANTS, named now and no others:
- GC1 (judged): |night| >= 20 pips -> 08:00 market order back toward yesterday's close, target = yesterday's close, stop 30 pips, out 12:00.
- GC2 (dose): |night| >= 30 pips, same exits.
- GC0 (control): GC1's days traded WITH the night, stop 30, target the same distance beyond, out 12:00.
Costs on (1.0 + 0.1); stressed 2.0 + 0.5. $125 = 1R.

## Cases before outcomes
Count GC1 / GC2 days before and from 04-07. Under 80 GC1 trades or under 35 from 04-07 -> not judgeable -> killed.

## Kill lines (four, all must pass, for GC1)
K1 average >= +0.10R. K2 net above zero before 04-07 AND from 04-07. K3 stressed average above zero. K4 GC1 minus GC0 above zero, sign-flip p < 0.05.
Pass = eligible for route C after my coach's word. Fail = killed.
My guess: positive after 04-07, negative before (K2 fails), like AR.

## Counts and worked case (tool, before outcomes)

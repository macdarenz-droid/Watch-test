# Search for a second, independent setup - idea N "New York fades the London morning" (written before any run)
Clock Fri 2015-03-13 00:00 UTC (end of released data). Jan-Feb only (END <= 2015-03-01); March is not used.

## Why
The whole plan is one rule in one four-hour window. A second setup only helps if it (1) makes money by itself and (2) does not lose on the same days as A2.
A copy of A2 (like idea B) adds risk, not safety.

## Where it comes from: my own chart notes, not a new look at the data
- W02 (01-08): "Pattern 4 days running: London 07-12 UTC extends the trend, NY (13-17) bounces back part of it."
- W03: "NY bounced 55 pips after my exit"; "At 13:00 NY spiked UP 90 pips then fell back"; and the same note on 01-16, 01-26, 02-09, 02-10, 02-20.
- Measured later: in January the 12:00-21:00 move went AGAINST my morning direction by 30 pips on average; holding A2 trades from 12:00 to 16:00 lost 191 pips over 34 trades.
- Different time (afternoon, after A2 is flat) and different logic (fade a move that has already happened, instead of following a trend).
Other notes I considered and dropped: weekend gap fill (8 weekends = too few), "old floor becomes ceiling" (I cannot write it as a rule without judgement), fading news spikes (stop is inside the spike).

## The setup
At the entry hour, measure how far price has travelled since 08:00 UTC. If it has moved at least X pips, trade AGAINST that move: market order, stop 40 pips, $125 risk,
close at the exit hour, one trade a day, costs on. If the morning moved less than X: no trade.
Hypothesis: a London morning that has already travelled gets partly given back in the New York afternoon, often enough to pay after costs.
Variants (39, 40, 41; ideas -> 18), no others afterwards:
- N1: X = 30 pips, enter 13:00, exit 17:00.
- N2: X = 50 pips, enter 13:00, exit 17:00.
- N3: X = 30 pips, enter 12:00, exit 16:00 (the exact hours A2 leaves empty).

## Kill tests (fixed now)
Build - January: a variant survives only if: at least 8 trades; avg R >= +0.20R; net R still above 0 without its best trade. Highest avg R among survivors = the candidate.
Check - February (CONTAMINATED), all three shown, only the candidate can be claimed: at least 6 trades; avg R >= +0.10R; net R above 0 without its best trade.
Independence (the overlap check, reported for all three, REQUIRED for the candidate, Jan+Feb together):
  - of the days the setup loses, at most 50% are also A2 losing days;
  - correlation between its daily R and A2's daily R on days both trade is at most +0.30.
What a pass earns: a forward paper tag as a possible second setup. Not money, and not a second position: adding it to the plan would need its own risk question first.

## Honesty notes, in advance
- Contaminated: the idea is built from January afternoons I watched live, and I already know the January "NY against my morning" average (-30 pips) and February's (+5 pips).
  So I expect January to pass and February to be about nothing. A January-only pass is exactly what my notes would produce.
- Known danger: 13:30 UTC news. In this sim a stop fills at its price; in real life a fade position entered at 13:00 can be jumped. A pass here would still owe that question.
- The independence numbers have never been computed. Because N trades against the morning and A2 mostly trades with it, I expect them to lose on different days - if N makes money at all.
Nothing above has been run.

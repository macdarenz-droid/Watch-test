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

# RESULTS of idea N (run after commit 1ed6797). N1/N2/N3 = variants 39/40/41; ideas 18. Costs on, $125 risk, stop 40. Jan-Feb only (bt/ny_fade.py); March not used.

| Month | Variant | Trades | Win rate | Avg R | Net R | Max DD | Net R without its best trade |
|---|---|---|---|---|---|---|---|
| Jan (build) | N1: morning moved >= 30 pips, fade 13:00-17:00 | 15 | 47% | +0.42 | +6.31 | 3.45R | +0.93 (best +5.37R on 01-22) |
| Jan (build) | N2: >= 50 pips, 13:00-17:00 | 7 | 57% | +1.07 | +7.49 | 1.00R | +2.12 |
| Jan (build) | N3: >= 30 pips, 12:00-16:00 | 11 | 55% | +0.39 | +4.32 | 2.04R | -0.83 |
| Feb (CONTAMINATED) | N1 | 9 | 78% | +0.43 | +3.85 | 1.02R | +2.48 |
| Feb (CONTAMINATED) | N2 | 3 | 100% | +0.93 | +2.80 | 0R | +1.76 |
| Feb (CONTAMINATED) | N3 | 7 | 57% | +0.18 | +1.24 | 1.12R | +0.13 |
(A2 for scale: Jan 19 trades +0.78R, max DD 1.33R; Feb 20 trades +0.23R, max DD 1.86R.)

## Build (January)
- N1 SURVIVES: 15 trades, +0.42R, still +0.93R without its one giant trade. N2 fails on count (7 trades, needed 8). N3 fails: negative without its best trade.
- Candidate: N1.
## Check (February, contaminated) - N1
9 trades (needed 6), +0.43R (needed +0.10R), +2.48R without its best trade: PASSES the profit lines. Not what I predicted ("about nothing in February").

## Independence - the overlap check (Jan+Feb together)
| Variant | Its losing days | ...that were also A2 losing days | Correlation of daily R with A2 | What it made on A2's LOSING days | What it made on A2's WINNING days |
|---|---|---|---|---|---|
| N1 | 10 | 4 (40%) | +0.31 on 23 shared days | -0.83R in 6 trades | +10.56R in 17 trades |
| N2 | 3 | 1 (33%) | +0.33 on 9 | -1.00R in 1 | +10.86R in 8 |
| N3 | 8 | 1 (12%) | -0.06 on 17 | -1.02R in 1 | +5.82R in 16 |
N1 against the two lines: losing-day overlap 40% (limit 50%): passes. Correlation +0.31 (limit +0.30): FAILS, by 0.01.

## Verdict: N1 does NOT pass as an independent second setup. Not tagged, not adopted. I am not rounding 0.31 down.
- The miss is thin, but the table says the same thing in plain numbers: all of N1's profit came on days when A2 ALSO won (+10.56R), and on A2's six losing days it lost a little (-0.83R).
  It does not lose on the same days much more than chance - but it does not earn on A2's bad days either. It is a second way to be paid on the same active days, not a cushion for the quiet ones.
- Why that makes sense: N1 only trades when the morning travelled 30+ pips, and those are the mornings A2 tends to win. On A2's dead mornings N1 has no trade at all (15 of 39 days).
- Its own risk is worse than A2's: January drawdown 3.45R, and a third of its two-month profit is one afternoon (01-22, +5.37R, a news crash I could not have counted on).
- What is genuinely new: this is the first thing in 41 variants that was positive in BOTH months on its own profit test, in hours when A2 is flat. That is worth more than a shrug,
  and less than a setup: it comes from January afternoons I watched, and February is contaminated.
- I am not rescuing it with another threshold or other hours. N2 (bigger mornings only) looks even better per trade, on 10 trades in two months - which is how a mirage looks.

## What I would ask my coach (not doing it on my own)
Whether to pre-register a forward-only paper tag for N1 with profit AND "what it does on A2's losing days" as the questions. It costs nothing, uses no Jan-Feb data, and being mechanical
it can be computed for any unseen day after the fact. Until told, nothing is tagged.
Counts: ideas 18, variants 41.

# N1 FORWARD PAPER TAG - kill test, written Fri 2015-03-13 00:00 UTC sim time, BEFORE the first forward day (coach approved: paper only, no real money)
What is tagged: N1 exactly as defined above (at 13:00 UTC, if price is 30+ pips away from the 08:00 price, trade against that move; stop 40 pips; close 17:00; one a day; costs on:
1.0 pip spread + 0.1 slippage, via the same backtest engine on closed candles, computed the morning after).
Start: the first day I have not seen, Fri 03-13. The March days already behind me (03-02..03-12) are NOT counted: I watched those afternoons before N1 existed.

When I judge: not before 20 forward N1 trades AND at least 8 forward days on which A2 lost. Whichever comes later. No peeking verdicts before that; the running numbers are just a tally.
N1 passes only if ALL of these hold at that point:
1. Profit: avg R >= +0.20R after costs (about half of what Jan-Feb showed, +0.42R; I expect shrinkage).
2. Not one trade: net R still above 0 with its best trade removed.
3. Own risk: max drawdown <= 4R.
4. On A2's losing days (the reason to want a second setup): N1's net R over those days >= 0R, counting its no-trade days as 0. It does not have to rescue A2; it must not add to the hole.
5. Independence: at most 50% of N1's losing days are also A2 losing days, and the correlation of daily R on shared days <= +0.30.
Fails any line -> killed, no second threshold, no other hours.
Hard limits whatever happens: N1 is never traded with money and cannot change A2's size, brakes or plan until it has passed AND a separate, pre-registered risk question
(how two setups share one daily loss budget, and the 13:30 news risk the sim cannot show) has been answered.

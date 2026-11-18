# Does a one-hour shift of the trading window matter? KILL LINES WRITTEN FIRST (nothing has been run)
Clock Tue 2015-03-31 00:00 UTC (end of released data).

## Why this test
Yesterday London went to summer time and I had to decide whether my rule lives in UTC or in London time (decision: London time; see journal/2015-W14-funded.md). I cannot test
summer-time data - I have lived one day of it. But I CAN measure the thing the decision turns on, in the winter data where UTC and London were the same:
how much worse (or better) is the rule if the whole 08:00-12:00 window is moved by one hour? Reading A (stay on UTC) is exactly "trade 09:00-13:00 London" in winter terms.
If a one-hour shift changes nothing, the clock decision is harmless either way. If the 08:00-12:00 London window is clearly the best, getting the clock wrong would have cost real R,
and the decision was worth making carefully.

## What is run (winter-time days only, when UTC = London: 01-05 .. 03-27). Entries by the same 3-day trend rule, stop 40 pips, $125, costs on.
- A2 (reference): enter 08:00, exit 12:00.
- C+1 (variant 57): enter 09:00, exit 13:00 - what "Reading A" means in London terms.
- C-1 (variant 58): enter 07:00, exit 11:00 - the shift the other way.
- C9 (variant 59): enter 09:00, exit 12:00 - late entry, same exit (if I simply forgot the clock change for the entry only).
Ideas -> 24. January = build. March lived days 03-02..03-27 (20 trades) = the clean check, use #2 (clock shift). February shown, labelled contaminated.

## KILL LINES (explicit)
K1. If C+1 has an avg R at least 0.05R ABOVE A2 in BOTH January and clean March: my decision is in doubt - the later window may simply be better. I then report it to my coach,
    keep trading London time meanwhile (one decision per clock change), and pre-register a forward comparison. I do NOT switch on a backtest.
K2. If C+1 is within 0.10R of A2 (either side) in both January and March: the clock choice is not important; note it and stop worrying about it.
K3. If C+1 is more than 0.10R BELOW A2 in both January and March: the 08:00-12:00 London window is where the edge is; reading the rule in London time was necessary,
    and every backtest tool I use on summer months must use London time (a to-do, not a variant).
Anything mixed (different answers in January and March): no conclusion; say so.
No variant here can be adopted: this is a measurement of sensitivity, not a search for a better window.

## My guess, written first
K3. A1 (07:00 entry, noon exit) was already worse than A2; 13:00 exits were the worst hour in March; so I expect both shifted windows to lose 0.1-0.3R per trade.
What I already know that could bias me: the exit-time test (10/11/13:00 exits with the 08:00 entry) and A1. I have never run a 09:00 entry or a shifted window.

# RESULTS (run after commit bcafa08). CP1/CM1/C9 = variants 57/58/59; ideas 24. Winter-time days only (UTC = London), costs on, $125 risk (bt/ab_score.py).

| Data | Window (London time) | Trades | Win rate | Avg R | Net R (vs A2) | Max DD | Full stops |
|---|---|---|---|---|---|---|---|
| January (BUILD) | 08:00-12:00 (A2) | 19 | 74% | +0.78 | +14.89 | 1.34R | 2 |
| January | 09:00-13:00 (shift +1h = "Reading A") | 19 | 68% | +0.36 | +6.89 (46%) | 1.53R | 2 |
| January | 07:00-11:00 (shift -1h) | 19 | 68% | +0.44 | +8.27 (56%) | 3.04R | 5 |
| January | 09:00-12:00 (late entry only) | 19 | 79% | +0.63 | +11.92 (80%) | 1.00R | 1 |
| MARCH lived days 03-02..03-27 (CLEAN check, use #2) | 08:00-12:00 (A2) | 20 | 70% | +0.51 | +10.22 | 1.51R | 4 |
| March | 09:00-13:00 | 20 | 65% | +0.25 | +5.07 (50%) | 2.25R | 5 |
| March | 07:00-11:00 | 20 | 60% | +0.40 | +8.08 (79%) | 3.41R | 6 |
| March | 09:00-12:00 | 20 | 70% | +0.38 | +7.50 (73%) | 2.03R | 4 |
| February (contaminated, reference) | 08:00-12:00 (A2) | 20 | 55% | +0.23 | +4.67 | 1.87R | 1 |
| February | 09:00-13:00 | 20 | 65% | +0.22 | +4.37 (94%) | 2.49R | 3 |
| February | 07:00-11:00 | 20 | 55% | +0.13 | +2.65 (57%) | 1.69R | 3 |
| February | 09:00-12:00 | 20 | 55% | +0.22 | +4.37 (94%) | 2.31R | 2 |

## Kill lines, applied
- K1 (the shifted +1h window at least 0.05R ABOVE A2 in both January and March): no - it is 0.42R and 0.26R BELOW.
- K2 (within 0.10R of A2 in both): no.
- K3 (more than 0.10R BELOW A2 in both January and clean March): YES. -0.42R in January, -0.26R in March.
=> K3: the 08:00-12:00 LONDON window is where the edge is. Reading my rule in London time was necessary, not cosmetic: on this evidence, staying on UTC through the summer
   (trading 09:00-13:00 London) would have roughly halved the result (46% and 50% of A2's net R) with more drawdown.
- The shift the other way (07:00-11:00) is also worse in every month and triples the drawdown in January (five full stops: it enters into the first-hour fake).
- Entering an hour late with the same exit keeps 73-80% of the profit: the first hour after 08:00 carries real R.
- This is the second time the clean March days agree with a choice made on 01-09 (the exit hour was the first). The window is not a knife-edge - every shifted window is still
  positive in every month - but 08:00-12:00 London is the peak in all three.

## The to-do K3 created, done today
- bt/ideas.py now relabels every candle with LONDON wall-clock time before any rule is applied, so "08:00" in every backtest and paper-tag tool means 08:00 London all year.
  Checked: January, February and March-to-03-27 results are identical to before (winter: London = UTC), and the tool's trade for 03-30 is the one I took live (+0.85R vs +0.84R).
- look.sh now prints the daily closes at 22:00 London (the FX day's close) with the trend gap and the side.
- trade_a.py takes UTC times: while summer time lasts the live command is `--entry 07:00 --exit 11:00`, and the call is written at 06:00 UTC (07:00 London).
- Paper tags run through the same tools, so they are on London time from 03-30 as well (N1: fade at 13:00 London of the move since 08:00 London).
  Caveat recorded: N1's five forward trades of 03-13..03-27 were taken at 13:00 UTC while the US was already on summer time, i.e. one hour later in New York terms than in the
  months it was built on. Its tally stands as lived; the caveat is part of its record.
- Counts: ideas 24, variants 59. March check uses: 2 (exit time, clock shift).

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

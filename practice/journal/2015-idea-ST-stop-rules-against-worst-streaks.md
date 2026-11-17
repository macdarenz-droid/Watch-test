# Idea ST: my daily and weekly stop rules against my worst streaks - what is the breach risk if this continues? LINES AND WORKED LADDER WRITTEN BEFORE ANY CODE
Clock Wed 2015-07-01 01:00 London (end of released data). After funded day 68. Coach 06-30: "test your daily and weekly stop rules against your worst
historical streaks so you know breach risk if this continues."
June goal: every number and every test rule gets one worked case before it is pushed.

## The rules as they are (one honest fact first)
- DAILY: one trade, one 40 pip stop, 0.50% at full size; after the trade the day is over. The firm's daily line is 5% of the day's starting balance.
- WEEKLY: I HAVE NO WEEKLY STOP RULE. The plan has never had one. The worst week the rules allow is five full stops: about -2.5% at full size.
  What does the job of a weekly or monthly stop is the SIZE RULE: half size from a close at or under 3% below the high-water, stop trading at 7% below.
- The firm's max-loss line: $22,500 (10% of $25,000).
State today (tool, 06-30): tracker balance $24,647.79 (-1.409% of $25,000); high-water $25,256.94 (+1.028%); half-size line $24,499.23; stop line $23,488.95.

## "If this continues": three stress tests (3 variants)
- ST1 THE LADDER (arithmetic, no chance in it): from today, nothing but full stops, each at the real-fill size of my record. How many to each line, and
  how far from $22,500 am I when my own rule stops me - also if the last stop is a jump day (idea DC: 3.07R)?
- ST2 THE SLIDE (2,000 runs x 500 days from today's state; the machinery of idea GD: engine A2 list shifted to a chosen edge, real-fill extras on full
  stops, half size at 3%, stop at 7%, payout rule): true edge 0.00R (a coin), -0.10R (about what May-June has been) and -0.20R (twice as bad).
- ST3 THE SLIDE WITH JUMPS: the same, and every full stop has a 1 in 20 chance of being a jump day of -3.07R instead (my history has shown one
  such minute in 125 mornings, on a winning side; 1 in 20 of the stop days is several times more often than I have seen).
For each: share of runs that breach $22,500 or lose 5% in a day; share that reach my own 7% stop; the lowest balance of any run; the worst single day.

## Worked ladder (ST1), by hand now
A full stop at full size costs about $127 (0.31 lots, a 40 pip stop filled about a pip worse); at half size (0.16 lots) about $65.
- Stop 1: $24,647.79 - 127 = about $24,521: above $24,499.23 by about $22 -> still full size.
- Stop 2: about $24,394: under the line -> HALF size from the next day.
- From $24,394 to the stop line $23,488.95 is about $905 = 14 half-size stops (14 x 65 = $910): stop 16 in a row closes at about $23,484 -> TRADING STOPS.
- Distance to the firm's line then: about $984 (3.9% of $25,000). If that last stop is a jump day (3.07R at half size = about $192 instead of $65):
  about $23,357, still about $857 above $22,500.
- To breach from there in ONE morning at half size ($1.6 a pip) the price would have to jump about 535 pips through my stop. The largest
  single minute in my history is 81.7 pips; the largest six minutes 185 pips (01-15).
- The firm's DAILY line (5%, about $1,230): at full size ($3.1 a pip) that is about 400 pips in one morning with a 40 pip stop in the way.
For scale: my worst lived run is 7 losses with 4 full stops in it (06-19 .. 06-29). The ladder needs 16 FULL stops in a row.

## Kill lines for the claim "with my rules as written, the breach risk is negligible even if this continues"
- K1 (ST1): when my own stop ends the ladder, the balance is at least $625 (2.5%) above $22,500 - also with a jump day as the last stop.
- K2 (ST2): breach in 0.5% of runs or fewer at every edge, the -0.20R one included; no run under -9% of $25,000.
- K3 (ST3): with jump days breach in 1% of runs or fewer; no run under -9.5%.
- K4 (daily): the worst single day of any run in ST2 and ST3 is under 2.5% of the balance (half the firm's daily line).
MECHANICS REGRESSION before the run: without jumps, the new script must reproduce `python bt/guard_dead_edge.py 2015-07-01 -1.409 1.028 0.0,-0.10` exactly (same seeds).
What each outcome means, written now: if all four hold, the answer to the coach is "breach risk is negligible; what is NOT negligible is that my
own stop ends the account's trading" - with the odds and the time printed. If one fails, I say which rule let it through and put a fix to the coach
(a weekly stop is the obvious candidate) - as a proposal, tested first. No live rule changes from this test either way.
Worked expectation: K1 as worked ($984 / $857). ST2: breach 0% at all three edges; my own stop reached in about 75% of runs at 0.00R, about 99% at
-0.10R (median after about 120 days) and at -0.20R (sooner); lowest balance about -7%. ST3: breach 0%, lowest about -7.5%; worst day about 1.6% (a
jump at full size = 3.07 x 0.5%). All four lines hold.
Counts when run: idea 94, variants 262-264.

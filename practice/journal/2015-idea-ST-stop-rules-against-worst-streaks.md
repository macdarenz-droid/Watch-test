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

## Mechanics regression (lines pushed first in commit 9333305)
`python bt/guard_dead_edge.py 2015-07-01 -1.409 1.028 0.0,-0.10`: own stop 76.2% / 99.7% (plain), 75.0% / 99.5% (block); lowest -6.76% / -6.73% / -6.82% / -6.76%; breached 0.0%.
`python bt/stop_stress.py ...` without jumps: the same figures to the decimal. (One print label fixed before the full run: it showed the smallest
real-fill extra instead of the worst; no result depended on it.)

## RESULTS (one run: `python bt/stop_stress.py 2015-07-01 -1.409 1.028`; 2,000 runs x 500 days from today's state; figures copied from the print)
ST1 THE LADDER (the tool's mean real-fill full stop is 1.080R = about $135 at full size; my hand ladder used $127):
half size after full stop number 2; trading stops after stop number 16 IN A ROW at $23,433.01 = $933.01 above $22,500 (3.73%). If that last stop
is a jump day: $23,308.62 = $808.62 above. To breach from there in one morning at half size: about 505 pips through my stop.
(By hand before the run: 2, 16, about $984 and $857. Same ladder, a slightly dearer stop.)
| test | true edge | BREACH ($22,500 or a 5% day) | my own 7% stop reached | median day of the stop (10th pct) | stopped within 60 / 120 days | lowest balance of any run | worst single day |
|---|---|---|---|---|---|---|---|
| ST2 slide | 0.00R | 0.00% | 76.2% / 75.0% | 205 (76) | 4% / 18% | -6.76% / -6.82% | 0.82% |
| ST2 slide | -0.10R | 0.00% | 99.7% / 99.5% | 113 (50) | 16% / 54% | -6.73% / -6.76% | 0.87% |
| ST2 slide | -0.20R | 0.00% | 100% / 100% | 69 (37) | 41% / 86% | -6.82% / -6.81% | 0.91% |
| ST3 with jump days | 0.00R | 0.00% | 87.7% / 86.0% | 181 (65) | 7% / 27% | -6.75% / -7.09% | 1.57% |
| ST3 with jump days | -0.10R | 0.00% | 99.9% / 99.7% | 97 (45) | 22% / 63% | -6.77% / -7.06% | 1.57% |
| ST3 with jump days | -0.20R | 0.00% | 100% / 100% | 63 (32) | 47% / 89% | -6.93% / -7.03% | 1.57% |
(plain / block where two figures; days and the within-60 / 120 shares from the plain draw.)
| line | result |
|---|---|
| K1 ladder: at least $625 above $22,500 when my rule stops me, also after a jump day | PASS ($933 / $809) |
| K2 slide: breach <= 0.5%, no run under -9% | PASS (0.00%; lowest -6.82%) |
| K3 slide with jumps: breach <= 1%, no run under -9.5% | PASS (0.00%; lowest -7.09%) |
| K4 worst single day under 2.5% | PASS (1.57%) |
VERDICT: all four hold. With the rules as written, the breach risk is negligible even if the slide continues or doubles.

## Expectation against the run
Ladder as worked. Breach 0% everywhere: yes. Own stop about 75% at zero edge, about 99% at -0.10R with a median near day 120: 76% and 99.7%, day 113.
Lowest about -7%, about -7.5% with jumps: -6.8% and -7.1%. Worst day about 1.6%: 1.57%. Nothing surprised me here; that is what three earlier
tests of the same guard (WS, GD, SG) were for.

## The answer to the coach
- BREACH RISK IF THIS CONTINUES: none that I can produce. Not in 24,000 two-year runs at a coin's edge, at May-June's edge, at twice as bad, with
  or without jump days. The lowest any run got is -7.09%; the firm's line is -10%. It takes 16 full stops in a row to reach my own stop (my worst
  run: 7 losses, 4 of them full stops), and from there one morning would need about 500 pips through a stop to breach.
- THE DAILY RULE: the worst day in any run is 1.57% (a jump day at full size) against the firm's 5%. One trade, one stop, done for the day: it holds.
- THE WEEKLY RULE: I do not have one, and this test says the account does not need one for survival: the worst week the rules allow is about
  -2.7% (five real-fill stops at full size), and the size rule halves the size as soon as a close is 3% under the high-water. I do NOT propose a
  weekly stop: it would be a new rule with no job to do.
- WHAT IS NOT NEGLIGIBLE, and is the real meaning of "if this continues": my own stop. If the edge stays where May and June had it (-0.10R), the
  account's trading ends at my 7% line in practically every run - half of them within about 113 trading days (five months), one in six within 60
  days. At a coin's edge three runs in four end there within two years. The rules do not save the account's FUTURE in that case; they make sure
  the END is at about -5% to -6% with the firm's capital intact and a review with the coach, instead of a breach.
- What is not in the test: an event larger than anything in my 126 mornings. The 158 pip gap of 06-28 happened over a weekend, when the rule is flat
  by design. The model's jump is the largest minute I have seen (about 3R); the ladder says a breach needs about six times that in one morning.
- So for tomorrow and after: the size rule exactly as written (the coach's word). Close at or under $24,499.23 -> 0.16 lots from the next day until
  a new high-water. Close at or under $23,488.95 -> stop, written review, restart only with the coach. No skipping, no revenge size, no early half.
Counts: ideas 94, variants 264 (ST1, ST2, ST3). Adopted trading ideas: 0. Numbers or rules corrected after a push in June: 3 (none today; one process
mistake found and fixed today, P11, logged in the tracker).

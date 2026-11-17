# AUGUST 2015 - month review, funded account (one page). Written Tue 2015-09-01 22:00 London (coach 09-01), after 09-01 was booked.
Figures from tools, read this evening: `python bt/daily_numbers.py 567.04 25256.94`, journal/A2-paper-record.md (engine rows),
`GATE_SEED=901 python bt/gate_check.py 2015-09-02 test`, the YM1 / NC1 / EN2 forward tools, STATE.md counts. All R after costs (1.0 + 0.1).

## The month in numbers
| | August | (July) |
|---|---|---|
| live trades | 0 (flat by rule all 21 weekdays, 08-03..08-31) | 5 |
| live result | 0.00R, $0 | -3.28R, -$288.80 |
| tracker balance | $24,358.99 -> $24,358.99 (sim $24,926.03; $567.04 paid out earlier) | $24,647.79 -> $24,358.99 |
| drawdown under the high-water ($25,256.94) | -3.56% all month (unchanged since 07-07) | -2.41% -> -3.56% |
| distance to my stop-trading line ($23,488.95) / the firm's line ($22,500) | $870.04 / $1,858.99 | same |
| worst day (live) | none | -0.50% |
| tags | 21 days NO LIVE TRADE - BY RULE, all VALID; 0 trade mistakes | 5 valid / 0 mistakes |
| process mistakes (P-log) | 0 new entries (total stays 12) - but see the goal tally below | 1 (P12) |
| payouts | 2 dates (08-14, 08-28): $0 each | 3 dates, $0 each |
| A2 on paper (engine), August | 21 days, +1.94R, 12 wins, 9 stopped; worst -1.03R; deepest dip inside the month 2.47R; other side -2.30R | 18 days -3.50R |
| A2 paper since 07-08 | 39 days to 08-31: -1.56R (40 days -2.56R after 09-01) | |
A2 engine by month: Jan +14.89, Feb +4.67, Mar +12.21, Apr +4.21, May -2.03, Jun -1.40, Jul -6.81, Aug +1.94 (paper). The first
positive month since April, at 9 full stops in 21 (43%).
Full-stop share: my 08-27 range check said 17% up to then; the four stops of 08-21..08-28 moved August to 9 of 21. The 08-27 number was
true for its window only; I write it here so it is not quoted again as August's.

## Was sitting out right?
August's paper A2 made +1.94R, about $121 at 0.16 lots (or $30 at route C's $15.63): sitting out cost a little this month. The rule
said sit, and the rule's gate (40-day monitor >= +0.60R) read between -0.07R and -0.23R every morning of the month. It was not close.

## Paper lines, read at month-end (tools)
- Route A: monitor for 09-02 -0.143R (gate +0.60R; earliest 09-21). MO day 46 of 60: MO1 0.00R vs A2 -5.36R since 06-30 (A1 on track).
- GATE RE-CHECK (new seed 901, no-edge pool now 106 days): +0.60R opens for a no-edge rule on 1.8% of single mornings (line 5%);
  healthy pool passes 92.5%. THE GATE STANDS (the 5% point is +0.47R).
- YM1 forward (from 08-31): 2 of 80, net -0.01R; 1 agree day +0.31R, 1 disagree day -0.32R (YM0 -1.00R that day).
- NC1 forward (from 08-31): 2 days, 1 skip of 30 (08-31: A2 +0.31R on the skipped day), 1 kept (09-01: A2 -1.00R). K2 forward reading
  written 09-01 (halves of the forward skip days).
- EN2 forward (from 08-28): 0 trades in 3 days.
- SW1 shadow: CLOSED 08-27 by its 6R line (11 trades, -6.08R incl. -0.22R financing).
- UN3 day 96: disagree days +4.72R in 22 (of 30), agree days -12.33R in 74. PH2 day 88: lively 51 -7.80R, quiet 37 -0.33R.

## August's tests (STATE.md: 150 ideas, 400 variants in all)
About 30 ideas this month (from 121 to 150), every one killed or not judgeable. Kept findings: entering after a move has happened loses
~0.2R at every scale (TH, RS0, UD, FX0); round numbers neither pull nor push (MG, RT); hourly candle patterns are dead (EN1, IB, PN);
once-a-day ideas often fail the 80-day sample (ND, CS, GC2, NR) or are A2 again (XD). Near misses: NC1 (provisional pass, now forward),
YM1 (K4 p 0.123, now forward), YN (+0.070R across 04-07). Hints, not results: EN2 (forward), MPG2, QB2.

## August process goal: "read a tool's own header line before writing any number from it; see 'script reached its end' before every commit"
- Numbers corrected after a push: 3 (08-24 "330 pips" -> +234.8; 08-27 "range about twice July" -> true only for the 5-day mean, carried
  by three days; 08-27 SW1 financing -0.18R -> -0.22R). All three were written from memory, not from a tool line - the exact failure the
  goal was written for. I did not log them as P-entries (July's review counted corrections separately too); I say plainly that each
  was a process slip.
- Design slips: 2 (MP's slope fixed by feel -> re-registered as MPG; ND registered without the frequency check -> plan rule added 08-25).
- Scripts that stopped halfway: 0 seen (every booking script printed "script reached its end" before its commit).
- Verdict: the commit check worked; the "header line" half did not stop memory numbers, because the slip is writing without opening a tool.
SEPTEMBER PROCESS GOAL: NO NUMBER IN ANY NOTE, CALL OR REPORT UNLESS THE SAME COMMAND THAT WRITES IT PRINTS IT FROM A TOOL OR A FILE.
Report at the September review: numbers corrected after a push.

## September, stated plainly
Flat by rule until at least 09-21 (route A), and route A needs +0.60R, which the monitor has not been near since early July. Routes B
and C are empty. Work: the daily paper call; EN2, YM1, NC1 forward counts (paper, no money until they pass and my coach agrees);
coach 09-01: the next research is NOT a new entry - my best near miss's exits and management.
Still open with my coach: does the firm have an inactivity rule? (asked since 07-09).

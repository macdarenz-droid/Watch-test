# RETURN-TO-LIVE RULE - pre-set, written Thu 2015-07-09 before the 07:00 London call and before any order. In force from today.
Coach 07-09: "respecting your 8R alarm was the right call, but a funded trader can't sit flat forever: before trading thu, write your pre-set
return-to-live rule (what paper record or new tested setup brings money back, at what size) with a date."

## Where I stand
A2 is off money since 07-08 by its own alarm (max drawdown 8.08R; line 8R). The account is flat at $24,358.99. A2 runs on paper every day.
What I know: its advantage over a coin has been about zero since mid-April (RG), in every part of the day (WM). What I do not know: whether that lasts.
Money comes back by ONE of two routes, each with its evidence written here before a single further day is seen. Nothing else brings it back - not a
good paper week, not boredom, not a hunch.

## ROUTE A - A2 itself comes back
Evidence required, ALL of:
 A1. The MO monitor has reached its judging day and PASSED its lines as written on 06-29 (60 lived days from 06-30 = Mon 2015-09-21; over those 60
     days MO1's R not more than 1.0R below A2-always's, and A2 below +0.10R a day on the days MO1 had it off). A monitor that failed its own
     out-of-sample check cannot be the thing that switches money back on.
 A2. On the morning in question the 40-day monitor (average of my side's R minus the other side's over the last 40 completed A2 days, paper or
     live; `python bt/side_monitor.py DATE --state`) stands at or above +0.30R. Not zero: zero is a coin. +0.30R is about one standard error
     (1.8R / sqrt(40) = 0.28R) above a coin and a third of what the signal was worth from January to March.
 A3. At least 40 of those 40 days lie after the alarm (07-08): the window must be made of days I did not trade for money. First possible: Tue 2015-09-01.
EARLIEST DATE for route A: MON 2015-09-21 (A1's date; A3 is then already met).
What then happens: from that morning A2 is traded for money again at 0.16 LOTS (size rule v3), every weekday, with all its rules. It goes back to
paper on any morning the 40-day monitor is below 0.00R (MO1's own rule), and returns again only at +0.30R or above.
Worked case of A2: today the monitor is -0.235R (tool). If it stood at +0.31R on 09-21 with MO passed: live at 0.16 lots that morning. At +0.29R: paper.

## ROUTE B - a new setup earns it
Evidence required, ALL of:
 B1. A pre-registered test: hypothesis, rules, cases counted before outcomes, kill lines pushed before the code, max 3 variants, costs on - PASSED on
     history that includes a part never looked at for that idea.
 B2. Then at least 40 FORWARD PAPER TRADES of that exact setup, called before they happen, with: average at least +0.10R after costs; maximum
     drawdown 6R or less; positive without its best two trades; no trade mistake in the paper record. These lines are written here, before any
     setup exists, so that no setup gets lines made for it.
 B3. The coach has seen the paper record and agreed.
EARLIEST DATE for route B: 40 forward paper trades after a setup passes B1. No setup has passed B1 (13 tried). At one trade a day that is two months
after the day one does; it cannot be before September either.
Size: 0.16 lots (v3) if the stop is 40 pips; for another stop distance the same $62.50 of risk. If A2 (route A) and a new setup could both be open
in one day, the two together risk at most 0.50% and the second waits for its own written two-trade line.

## THE DATE
MON 2015-09-21 is the review day whatever happens. On it I write, with the numbers: route A open or not; route B's state; the paper record of A2 since
07-08. If neither route is open, the question to the coach that day is plain: go on with paper and research, or give the account back.
Interim reading without decisions: each month-end review (first live day of August and September).

## What the rule is NOT
- Not a promise that money comes back. If the edge stays gone and nothing new is found, the honest end is a flat account that lost $74 in three and
  a half months and kept its capital.
- Not negotiable on a good day. If the monitor reads +0.29R on the morning of 09-21 after a run of paper winners, A2 stays on paper.
- UNKNOWN, asked again: whether the firm requires a minimum of activity on a funded account. If the coach tells me it does, the smallest order the
  platform accepts, in A2's direction with A2's stop and clock, tagged "activity trade", meets it; that would be bookkeeping, not a return.

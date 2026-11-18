# Idea DF: "big days are not followed" - fade yesterday's direction. CASES COUNTED BEFORE OUTCOMES; KILL LINES BEFORE THE CODE
Clock Fri 2015-07-10 01:00 London (end of released data). A2 on paper (day 2); account flat; return-to-live rule written 07-09.
Coach 07-09: "don't test the mirror on the same data; instead pick a different market behaviour from your 30-day read, count cases before outcomes,
kill lines first."
July goal: a worked case before every pushed number or rule; every file write read back.

## The behaviour (observation 1 of the 30-day read, journal/2015-07-08-thirty-days-by-eye-and-idea-PD.md)
"BIG DAYS ARE NOT FOLLOWED: after a day with a body of about 100 pips or more, the next day is small or goes the other way."
Warning to myself, from yesterday: observation 2 of the same read ("new extremes are rejected") was the OPPOSITE of the truth, also inside the
thirty days I had looked at. I treat this one as equally likely to be a picture of the days I remember.
It is also the opposite of A2's idea at a one-day scale (A2 follows three days of direction), and A2 earned from January to March. So I expect
this to lose there. The honest question is whether it does anything in the months since.

## Cases, counted WITHOUT outcomes (python; "body" = 22:00 London close minus the previous 22:00 close)
133 days have a yesterday's body; its median size is 54.7 pips, the 75th percentile 98.6.
| yesterday's body at least | judged cases (before 06-08) | in the studied window (06-08 .. 07-09), shown, not judged | total |
|---|---|---|---|
| any size | 110 | 23 | 133 |
| 40 pips | 72 | 13 | 85 |
| 80 pips | 38 | 6 | 44 |
(100 pips: 30 judged cases - too few to carry a setup; that is why the thresholds are these.)

## THE SETUP (fixed now)
At 08:00 London, trade AGAINST the direction of yesterday's body. Stop 40 pips from the entry, never moved. No target. Out at 21:00 London. One trade a day.
Variants (3) = a dose check on "big": DF1 every day; DF2 only after a body of 40+ pips; DF3 only after 80+ pips.
Costs on (1.0 + 0.1); R = result / 40 pips; STRESS 2.0 + 0.5.
Worked case by hand (Wed 07-08, in the studied window: a mechanics check, not evidence): Tuesday's body 1.10107 - 1.10556 = -44.9 pips (down) -> BUY at
08:00: bid 1.10146 + spread = about 1.10157; stop about 1.09746. After 08:00 the low was 1.10059 (the day's low 1.09743 came in the night, before
the entry): not stopped. Out at 21:00 at about 1.10704 -> +54.7 pips = about +1.37R. DF1 and DF2 trade it (44.9 >= 40); DF3 does not.

## Kill test (judged set: before 06-08; one failure kills the variant)
- K1: average at least +0.10R a trade after costs.
- K2: positive in BOTH parts: before 04-07 and from 04-07 to 06-05.
- K3: net positive without its three best trades.
- K4: max drawdown 8R or less.
- K5: at stressed costs still at least +0.05R a trade.
- K6 sample: at least 60 judged trades. (DF3 has 38: it CANNOT pass; it is in the table only as the top of the dose.)
- K7 dose (the observation says BIG days): DF2's average is not below DF1's, and DF3's not below DF2's. If the effect does not grow with the size
  of the day, "big days are not followed" is not what the data says, whatever the averages are.
Worked case for the lines: 110 trades at 45% winners averaging +1.2R and 55% losers averaging -0.8R = +0.10R: K1 passes at the line. With a 40 pip
stop and a 13-hour hold I expect about 45-50% full stops, so the winners must average about +1.3R.
A survivor: a paper setup under ROUTE B of the return rule (40 forward paper trades, lines already written). Killed: 14 second setups, none alive.
Worked expectation: before 04-07 negative (the days followed each other: that was the fall). 04-07 .. 06-05 about zero. No dose. KILLED on K1, K2, K7.
Counts when run: idea 101, variants 283-285.

## Mechanics check (cases and kill lines pushed first in commit 40d0387; `python bt/day_fade.py 2015-07-10 --check 2015-07-08`)
Yesterday's body -44.9 pips -> BUY 1.10156, out at 21:00 at 1.10701, +1.36R (hand: about +1.37R).
One slip of mine on the way, caught before any result: for the stressed-cost run I GUESSED the engine's parameter names and the script failed; I then
read the real signature (as bt/ideas.py uses it) instead of guessing. No number came from the wrong call. The rule I broke for a minute is my
oldest one: never invent what a tool takes; look.

## RESULTS (one run: `python bt/day_fade.py 2015-07-10`; costs on; figures copied from the print)
| variant | JUDGED trades (before 06-08) | avg R | net | wins | full stops | before 04-07 | 04-07 .. 06-05 | without 3 best | max DD | stressed avg | corr with A2 | the studied window (NOT judged) |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| DF1 every day | 109 | -0.016 | -1.76R | 39% | 57% | 65: +0.120 | 44: -0.217 | -14.22R | 16.24R | -0.054 | -0.05 | 24: +0.181 |
| DF2 body >= 40 pips | 72 | -0.076 | -5.46R | 38% | 58% | 42: +0.068 | 30: -0.277 | -17.16R | 16.17R | -0.114 | -0.16 | 13: +0.530 |
| DF3 body >= 80 pips | 38 | -0.141 | -5.37R | 34% | 61% | 23: +0.263 | 15: -0.762 | -14.99R | 14.59R | -0.179 | -0.27 | 6: +0.397 |
Kill lines: K1 (avg >= +0.10R) FAIL x3; K2 (both parts positive) FAIL x3; K3, K4, K5 FAIL x3; K6 sample PASS, PASS, FAIL (38);
K7 dose FAIL: -0.016 -> -0.076 -> -0.141: the bigger the day, the WORSE the fade.
VERDICT: all three KILLED. Second setups tried: 14, none alive.

## Expectation against the run
"Before 04-07 negative": WRONG - it is slightly positive there (+0.07R to +0.26R). "04-07 .. 06-05 about zero": WRONG - it is the bad part
(-0.22R to -0.76R). "No dose": right, and worse than none. "Killed on K1, K2, K7": yes. Two of my three period guesses were wrong; I do not
know this market's periods as well as I talk about them.

## What I take from it
- "Big days are not followed" is TRUE of the thirty days I looked at (+0.53R a trade after 40+ pip days, 13 trades) and FALSE of the two months
  just before them (-0.28R, 30 trades). The sign changes from period to period: +, -, +. That is not a behaviour of the market; it is the
  last month. A setup built on it would have been built on thirteen trades I had already seen.
- Two observations from the same 30-day read, two tests: one was the opposite of the truth everywhere (PD), one was true only where I had looked
  (DF). The method that caught both is the same: count the cases first, keep the looked-at days out of the judged set, write the lines before.
  My eye is not an instrument. The count is.
- Something the three period columns say across both tests, as a note and not a finding: the months flip. What follows through in one two-month
  stretch reverses in the next. A2 (follow three days) had January to March; the fade had the last month; neither has the next one promised.
  A setup that needs the regime to hold is a bet on the regime, and I have no way yet to know it in advance (EF).
- Next, if the coach wants a third behaviour from the read: the only one left untested is the weekend gap of the two big weekends, and WG said what
  15 weekends can say. I would rather the next brick came from somewhere other than my eye.
Counts: ideas 101, variants 285 (DF1, DF2, DF3). Adopted trading ideas: 0. A2 on paper (2 days, +0.39R); account flat.
July: numbers corrected after a push: 1; file errors found late: 0.

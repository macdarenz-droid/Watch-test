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

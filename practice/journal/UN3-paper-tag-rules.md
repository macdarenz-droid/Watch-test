# UN3 paper tag: what it is, how it is logged, and its PROMOTION RULE - written Tue 2015-04-21 07:00 London, before its first paper day
Coach, 04-21: "UN3 failed K1, so it does not touch your live rules. You can log it as paper only if you write its call before each live day starts and never move it
into live because of a few good paper days. Decide its promotion rule now, in writing."

## What UN3 is
On a morning when the 3-day signal (last 22:00 London close vs the close 3 trading days earlier) and the 5-day signal (vs the close 5 trading days earlier) point in
DIFFERENT directions, the paper version does not take the A2 trade. Otherwise it is A2. Build result (journal/2015-idea-UN-signal-agreement.md): 15 such days in 75,
A2 made -0.03R per trade on them against +0.58R on the rest; it FAILED my pre-registered profit line (K1). It is not a survivor. It is a parked observation with a tally.

## What it may and may not do
- LIVE RULE: A2, every weekday, unchanged. A UN3 "disagree" morning is traded live exactly like any other. Skipping or shrinking a live trade because of UN3 is a
  TRADE MISTAKE under my plan (a skipped day), whatever the result.
- PAPER ONLY: one line in the daily tally. No money, no size, no effect on brakes or payouts.

## How it is logged (so it cannot be fitted afterwards)
- Its call is written in the 07:00 London call, BEFORE the entry bar, every live day: "UN3: 5-day gap x pips -> BUY/SELL; 3-day says BUY/SELL -> agree (paper trades) /
  DISAGREE (paper skips)". The line comes from look.sh, which computes it from the same closes as the rule. A day with no UN3 line in the call does not count for the tag
  in either direction, and is logged as a process mistake.
- Forward counting starts today, Tue 2015-04-21. The 75 build days (including the 6 live disagreement days already inside them) NEVER count toward promotion.
- Paper result of a disagree day = 0R; of an agree day = the live A2 result as traded. Tally columns: forward days, disagree days, A2's R on the disagree days,
  A2's R on the agree days, UN3 net R and max drawdown beside A2's.
- The definition is frozen: lookbacks 3 and 5, 22:00 London closes, skip (not half size). No second version, no threshold, no "except when".

## PROMOTION RULE (decided now)
There is NO look at promotion before BOTH of these have happened:  (a) 30 forward disagree days,  AND  (b) 200 forward trading days since 04-21.
(About one disagree day a week: that is roughly ten months away. Until then the tally is information, not evidence, and I will write "n = x of 30" next to it every week.)
At that point UN3 may be PROPOSED to my coach - not adopted - only if ALL of these hold on the forward days alone:
  P1. A2's average R on the disagree days is at most +0.10R per trade;
  P2. the gap (agree-day average minus disagree-day average) is at least +0.30R AND at least two standard errors;
  P3. the gap is still at least +0.15R after removing the three worst disagree days (it must not be three stop-outs);
  P4. the gap is positive in at least 3 of the 4 consecutive quarters of the forward period (by calendar order of trades);
  P5. over the same forward days UN3's net R is at least 95% of A2's and its maximum drawdown is not above A2's.
If all five hold: I write a one-page proposal with the forward table and my coach decides. A change to the live rule needs the coach's written yes. Nothing else promotes it.
A few good paper days, a good month, a painful live loss on a disagree day, or a drawdown on the funded account are NOT reasons, and "it would have saved me today"
is to be written in the journal as a feeling, like every other such thought.

## KILL RULE (also decided now)
- At the same first look (30 forward disagree days and 200 forward days): if P1 or P2 fails, the tag is CLOSED and the idea is dead. No extension, no second look.
- Early close: if after the first 15 forward disagree days A2 has made +5R or more on them (an average above +0.33R), the build picture is gone; closed then.
- If I ever catch myself changing a live trade because of it: the tag is closed that day and the trade is tagged a mistake.

## Running tally (updated in the weekly journal; forward from 2015-04-21 only)
| as of | forward days | disagree days (of 30) | A2 R on disagree days | A2 R on agree days | UN3 net R / max DD | A2 net R / max DD |
|---|---|---|---|---|---|---|
| Tue 2015-04-21 | 1 | 0 | - | -0.04R (1 trade) | -0.04R / 0.04R | -0.04R / 0.04R |
| Wed 2015-04-22 | 2 | 1 | -0.02R (1 trade) | -0.04R (1 trade) | -0.04R / 0.04R | -0.06R / 0.06R |
| Thu 2015-04-23 | 3 | 2 | -1.02R (2 trades) | -0.04R (1 trade) | -0.04R / 0.04R | -1.06R / 1.06R |
| Fri 2015-04-24 | 4 | 2 | -1.02R (2 trades) | -1.04R (2 trades) | -1.04R / 1.04R | -2.06R / 2.06R |
| Mon 2015-04-27 | 5 | 2 | -1.02R (2 trades) | -1.20R (3 trades) | -1.20R / 1.20R | -2.22R / 2.22R |
| Tue 2015-04-28 | 6 | 2 | -1.02R (2 trades) | +0.41R (4 trades) | +0.41R / 1.20R | -0.61R / 2.22R |
| Wed 2015-04-29 | 7 | 2 | -1.02R (2 trades) | +0.73R (5 trades) | +0.73R / 1.20R | -0.29R / 2.22R |
| Thu 2015-04-30 | 8 | 2 | -1.02R (2 trades) | +2.56R (6 trades) | +2.56R / 1.20R | +1.54R / 2.22R |
| Fri 2015-05-01 | 9 | 2 | -1.02R (2 trades) | +3.00R (7 trades) | +3.00R / 1.20R | +1.98R / 2.22R |
| Mon 2015-05-04 | 10 | 2 | -1.02R (2 trades) | +2.00R (8 trades) | +2.00R / 1.20R | +0.98R / 2.22R |
| Tue 2015-05-05 | 11 | 2 | -1.02R (2 trades) | +2.85R (9 trades) | +2.85R / 1.20R | +1.83R / 2.22R |
| Wed 2015-05-06 | 12 | 3 | -0.39R (3 trades) | +2.85R (9 trades) | +2.85R / 1.20R | +2.46R / 2.22R |
| Thu 2015-05-07 | 13 | 3 | -0.39R (3 trades) | +2.92R (10 trades) | +2.92R / 1.20R | +2.53R / 2.22R |
| Fri 2015-05-08 | 14 | 3 | -0.39R (3 trades) | +3.38R (11 trades) | +3.38R / 1.20R | +2.99R / 2.22R |
| Mon 2015-05-11 | 15 | 3 | -0.39R (3 trades) | +2.38R (12 trades) | +2.38R / 1.20R | +1.99R / 2.22R |
| Tue 2015-05-12 | 16 | 4 | -1.39R (4 trades) | +2.38R (12 trades) | +2.38R / 1.20R | +0.99R / 2.22R |
| Wed 2015-05-13 | 17 | 5 | -0.75R (5 trades) | +2.38R (12 trades) | +2.38R / 1.20R | +1.63R / 2.22R |
| Thu 2015-05-14 | 18 | 5 | -0.75R (5 trades) | +2.89R (13 trades) | +2.89R / 1.20R | +2.14R / 2.22R |
| Fri 2015-05-15 | 19 | 5 | -0.75R (5 trades) | +1.89R (14 trades) | +1.89R / 1.20R | +1.13R / 2.22R (from the trade list) |
| Mon 2015-05-18 | 20 | 5 | -0.75R (5 trades) | +0.89R (15 trades) | +0.89R / 2.00R | +0.13R / 2.86R (from the trade list) |
| Tue 2015-05-19 | 21 | 6 | +1.42R (6 trades) | +0.89R (15 trades) | +0.89R / 2.00R | +2.30R / 2.86R (from the trade list) |
| Wed 2015-05-20 | 22 | 6 | +1.42R (6 trades) | -0.11R (16 trades) | -0.11R / 3.00R | +1.30R / 2.86R (from the trade list) |
| Thu 2015-05-21 | 23 | 6 | +1.42R (6 trades) | -1.11R (17 trades) | -1.11R / 4.00R | +0.30R / 2.86R (from the trade list) |
| Fri 2015-05-22 | 24 | 6 | +1.42R (6 trades) | -2.11R (18 trades) | -2.11R / 5.00R | -0.70R / 3.69R (from the trade list) |
| Mon 2015-05-25 | 25 | 6 | +1.42R (6 trades) | -1.42R (19 trades) | -1.42R / 5.00R | -0.02R / 3.69R (from the trade list) |
| Tue 2015-05-26 | 26 | 6 | +1.42R (6 trades) | -1.87R (20 trades) | -1.87R / 5.00R | -0.47R / 3.69R (from the trade list) |
| Wed 2015-05-27 | 27 | 6 | +1.42R (6 trades) | -0.96R (21 trades) | -0.96R / 5.00R | +0.44R / 3.69R (from the trade list) |
| Thu 2015-05-28 | 28 | 6 | +1.42R (6 trades) | -0.86R (22 trades) | -0.86R / 5.00R | +0.54R / 3.69R (from the trade list) |
| Fri 2015-05-29 | 29 | 6 | +1.42R (6 trades) | -1.86R (23 trades) | -1.86R / 5.00R | -0.46R / 3.69R (from the trade list) |
| Mon 2015-06-01 | 30 | 7 | +0.42R (7 trades) | -1.86R (23 trades) | -1.86R / 5.00R | -1.46R / 4.45R (from the trade list) |
| Tue 2015-06-02 | 31 | 8 | +1.93R (8 trades) | -1.86R (23 trades) | -1.86R / 5.00R | +0.05R / 4.45R (from the trade list) |
| Wed 2015-06-03 | 32 | 8 | +1.93R (8 trades) | -2.86R (24 trades) | -2.86R / 5.75R | -0.96R / 4.45R (from the trade list) |
| Thu 2015-06-04 | 33 | 8 | +1.93R (8 trades) | +0.01R (25 trades) | +0.01R / 5.75R | +1.92R / 4.45R (from the trade list) |
| Fri 2015-06-05 | 34 | 8 | +1.93R (8 trades) | -0.63R (26 trades) | -0.63R / 5.75R | +1.28R / 4.45R (from the trade list) |
| Mon 2015-06-08 | 35 | 9 | +0.93R (9 trades) | -0.63R (26 trades) | -0.63R / 5.75R | +0.28R / 4.45R (from the trade list) |
| Tue 2015-06-09 | 36 | 9 | +0.93R (9 trades) | -1.63R (27 trades) | -1.63R / 5.75R | -0.73R / 4.45R (from the trade list) |
| Wed 2015-06-10 | 37 | 9 | +0.93R (9 trades) | -1.77R (28 trades) | -1.77R / 5.75R | -0.86R / 4.45R (from the trade list) |
| Thu 2015-06-11 | 38 | 9 | +0.93R (9 trades) | -2.77R (29 trades) | -2.77R / 5.75R | -1.87R / 4.85R (from the trade list) |
| Fri 2015-06-12 | 39 | 10 | +1.78R (10 trades) | -2.77R (29 trades) | -2.77R / 5.75R | -1.02R / 4.85R (yesterday's figures plus 0.85) |
| Mon 2015-06-15 | 40 | 11 | +2.01R (11 trades) | -2.77R (29 trades) | -2.77R / 5.75R | -0.79R / 4.85R (Friday's figures plus 0.23) |
| Tue 2015-06-16 | 41 | 11 | +2.01R (11 trades) | -1.17R (30 trades) | -1.17R / 5.75R | +0.81R / 4.85R (yesterday's figures plus 1.60) |
| Wed 2015-06-17 | 42 | 11 | +2.01R (11 trades) | -1.03R (31 trades) | -1.03R / 5.75R | +0.95R / 4.85R (yesterday's figures plus 0.14) |
| Thu 2015-06-18 | 43 | 11 | +2.01R (11 trades) | +0.17R (32 trades) | +0.17R / 5.75R | +2.15R / 4.85R (yesterday's figures plus 1.20) |
| Fri 2015-06-19 | 44 | 11 | +2.01R (11 trades) | -0.83R (33 trades) | -0.83R / 5.75R | +1.15R / 4.85R (yesterday's figures minus 1.00) |
| Mon 2015-06-22 | 45 | 11 | +2.01R (11 trades) | -1.83R (34 trades) | -1.83R / 5.75R | +0.15R / 4.85R (Friday's figures minus 1.00) |
| Tue 2015-06-23 | 46 | 11 | +2.01R (11 trades) | -2.83R (35 trades) | -2.83R / 5.75R | -0.85R / 4.85R (yesterday's figures minus 1.00) |
| Wed 2015-06-24 | 47 | 11 | +2.01R (11 trades) | -2.96R (36 trades) | -2.96R / 5.75R | -0.98R / 4.85R (yesterday's figures minus 0.13) |
| Thu 2015-06-25 | 48 | 11 | +2.01R (11 trades) | -3.11R (37 trades) | -3.11R / 5.75R | -1.13R / 4.85R (yesterday's figures minus 0.15) |
| Fri 2015-06-26 | 49 | 11 | +2.01R (11 trades) | -3.26R (38 trades) | -3.26R / 5.75R | -1.28R / 4.85R (yesterday's figures minus 0.15) |
| Mon 2015-06-29 | 50 | 11 | +2.01R (11 trades) | -4.26R (39 trades) | -4.26R / drawdown to be recomputed at the gate | -2.28R / 5.27R (Friday's figures minus 1.00) |
| Tue 2015-06-30 | 51 | 12 | +2.49R (12 trades) | -4.26R (39 trades) | -4.26R / drawdown to be recomputed at the gate | -1.80R / 5.27R (yesterday's figures plus 0.48) |
| Wed 2015-07-01 | 52 | 12 | +2.49R (12 trades) | -5.26R (40 trades) | -5.26R / drawdown to be recomputed at the gate | -2.80R / 5.80R (yesterday's figures minus 1.00) |
| Thu 2015-07-02 | 53 | 12 | +2.49R (12 trades) | -5.18R (41 trades) | -5.18R / drawdown to be recomputed at the gate | -2.72R / 5.80R (yesterday's figures plus 0.08) |
| Fri 2015-07-03 | 54 | 12 | +2.49R (12 trades) | -5.54R (42 trades) | -5.54R / drawdown to be recomputed at the gate | -3.08R / 6.07R (yesterday's figures minus 0.36) |
| Mon 2015-07-06 | 55 | 12 | +2.49R (12 trades) | -6.54R (43 trades) | -6.54R / drawdown to be recomputed at the gate | -4.08R / 7.07R (Friday's figures minus 1.00) |
| Tue 2015-07-07 | 56 | 13 | +1.49R (13 trades) | -6.54R (43 trades) | -6.54R / drawdown to be recomputed at the gate | -5.08R / 8.08R (yesterday's figures minus 1.00) |
| Wed 2015-07-08 (A2 on paper) | 57 | 13 | +1.49R (13 trades) | -7.54R (44 trades) | -7.54R / drawdown to be recomputed at the gate | -6.08R (A2 incl. paper day) |
| Thu 2015-07-09 (A2 on paper) | 58 | 14 | +2.88R (14 trades) | -7.54R (44 trades) | -7.54R / drawdown to be recomputed at the gate | -4.69R (A2 incl. paper days) |
| Fri 2015-07-10 (A2 on paper) | 59 | 14 | +2.88R (14 trades) | -8.54R (45 trades) | -8.54R / drawdown to be recomputed at the gate | -5.69R (A2 incl. paper days) |
| Mon 2015-07-13 (A2 on paper) | 60 | 14 | +2.88R (14 trades) | -9.57R (46 trades) | -9.57R / drawdown to be recomputed at the gate | -6.72R (A2 incl. paper days) |
| Tue 2015-07-14 (A2 on paper) | 61 | 14 | +2.88R (14 trades) | -10.57R (47 trades) | -10.57R / drawdown to be recomputed at the gate | -7.72R (A2 incl. paper days) |
| Wed 2015-07-15 (A2 on paper) | 62 | 14 | +2.88R (14 trades) | -11.05R (48 trades) | -11.05R / drawdown to be recomputed at the gate | -8.20R (A2 incl. paper days) |
| Thu 2015-07-16 (A2 on paper) | 63 | 14 | +2.88R (14 trades) | -9.96R (49 trades) | -9.96R / drawdown to be recomputed at the gate | -7.11R (A2 incl. paper days) |
| Fri 2015-07-17 (A2 on paper) | 64 | 14 | +2.88R (14 trades) | -9.91R (50 trades) | -9.91R / drawdown to be recomputed at the gate | -7.06R (A2 incl. paper days) |
| Mon 2015-07-20 (A2 on paper) | 65 | 14 | +2.88R (14 trades) | -9.87R (51 trades) | -9.87R / drawdown to be recomputed at the gate | -7.02R (A2 incl. paper days) |
| Tue 2015-07-21 (A2 on paper) | 66 | 14 | +2.88R (14 trades) | -10.61R (52 trades) | -10.61R / drawdown to be recomputed at the gate | -7.76R (A2 incl. paper days) |
| Wed 2015-07-22 (A2 on paper; DISAGREE) | 67 | 15 | +1.85R (15 trades) | -10.61R (52 trades) | -10.61R / drawdown to be recomputed at the gate | -8.79R (A2 incl. paper days) |
| Thu 2015-07-23 (A2 on paper; DISAGREE) | 68 | 16 | +3.50R (16 trades) | -10.61R (52 trades) | -10.61R / drawdown to be recomputed at the gate | -7.14R (A2 incl. paper days) |
| Fri 2015-07-24 (A2 on paper) | 69 | 16 | +3.50R (16 trades) | -11.64R (53 trades) | -11.64R / drawdown to be recomputed at the gate | -8.17R (A2 incl. paper days) |
| Mon 2015-07-27 (A2 on paper) | 70 | 16 | +3.50R (16 trades) | -10.69R (54 trades) | -10.69R / drawdown to be recomputed at the gate | -7.22R (A2 incl. paper days) |
| Tue 2015-07-28 (A2 on paper) | 71 | 16 | +3.50R (16 trades) | -11.36R (55 trades) | -11.36R / drawdown to be recomputed at the gate | -7.89R (A2 incl. paper days) |
| Wed 2015-07-29 (A2 on paper) | 72 | 16 | +3.50R (16 trades) | -11.26R (56 trades) | -11.26R / drawdown to be recomputed at the gate | -7.79R (A2 incl. paper days) |
| Thu 2015-07-30 (A2 on paper) | 73 | 16 | +3.50R (16 trades) | -11.37R (57 trades) | -11.37R / drawdown to be recomputed at the gate | -7.90R (A2 incl. paper days) |
| Fri 2015-07-31 (A2 on paper) | 74 | 16 | +3.50R (16 trades) | -12.05R (58 trades) | -12.05R / drawdown to be recomputed at the gate | -8.58R (A2 incl. paper days) |
| Mon 2015-08-03 (A2 on paper; DISAGREE) | 75 | 17 | +4.23R (17 trades) | -12.05R (58 trades) | -12.05R / drawdown to be recomputed at the gate | -7.85R (A2 incl. paper days) |
| Tue 2015-08-04 (A2 on paper) | 76 | 17 | +4.23R (17 trades) | -12.58R (59 trades) | -12.58R / drawdown to be recomputed at the gate | -8.38R (A2 incl. paper days) |
| Wed 2015-08-05 (A2 on paper) | 77 | 17 | +4.23R (17 trades) | -12.47R (60 trades) | -12.47R / drawdown to be recomputed at the gate | -8.27R (A2 incl. paper days) |

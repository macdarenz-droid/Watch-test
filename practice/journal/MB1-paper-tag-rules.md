# MB1 paper tag - rules written 2015-05-12 (sim clock Wed 05-13 01:00 London), before its first forward day
Source: journal/2015-review-losers-of-3-killed-ideas-and-idea-MB.md. PAPER ONLY. It never touches A2, the live size or the account.
## The paper rule (frozen)
- Box = high and low (bid) of 12:00-13:25 London. First break between 13:25 and 14:30 London. Stop 30 pips, flat 17:00. Fills as in bt/box_break.py (BX1).
- Take the break only if its side equals the sign of (12:00 open - 08:00 open), bid. Morning exactly 0.0: no trade.
## How it is logged
- At 12:00 London, after my A2 trade is closed, I write in the day's journal: "MB1 paper: morning UP/DOWN by x pips -> only an UP/DOWN break counts" - before the
  clock passes 13:25. The result is read the next day from `python bt/morning_box.py END --check DATE` (never from memory) and added to the table below.
- The REMOVED breaks (against the morning) are logged beside it, and each kept trade is marked small morning (< 20 pips) or large: that is the open question.
## First look and promotion (written now, cannot be moved)
- First look: 100 forward KEPT trades (my standing rule for a stand-alone setup). An interim look at 40 applies only the early-close lines.
- To pass at 100: avg >= +0.15R; at 3.0 pip spread and 1.0 slippage >= +0.05R; max DD <= 6R; kept minus removed >= +0.20R; positive without its best 3.
- Early close: forward DD of the kept trades above 6R at any time; or net below -3R after the first 20 kept trades; or at 40 kept trades an average below 0.
- A pass is NOT a live trade. It is a proposal to the coach: quarter size (0.25%), second trade of the day, open risk checked against the 3% rule.
- Added 05-13 from idea DC (K3 failed; written into DC's pre-registration before its result; it only tightens): the size in any proposal must keep
  'A2 worst day + MB1 worst day' <= 2.0% of the balance on the then history (bt/day_cushion.py). On 05-13 that means about 0.09%, not 0.25%.
- Forward days needed (coach 05-13): about 285 trading days for 100 kept trades at the history rate of 0.35 a day (roughly mid 2016); 40 kept about late October 2015.
- A few good paper days change nothing. A bad A2 week changes nothing. No re-scoring, no new variant of it while the tag runs.
## Lived-days check, 2015-05-26 (coach-directed; journal/2015-MB1-lived-days-check.md; lines written first)
DOES NOT HOLD ON LIVED DAYS: 03-02..05-26 kept 21 trades +0.213R (stressed +0.141R) against A2 +0.232R on the same days; kept minus removed +0.191R (line was +0.20R); on the 10 true forward days kept 2 (-0.24R), removed 7 (+8.64R). The tag continues under the rules above (no early-close line reached); it is no longer described as 'the idea that passed'.

## Forward tally (from Wed 2015-05-13)
| date | morning (pips) | break | kept / removed | R | kept total (n, R, DD) | removed total (n, R) | small / large morning (kept) |
|---|---|---|---|---|---|---|---|
| Wed 2015-05-13 | -26.9 | UP | removed | +4.23 | 0, 0.00R, 0.00R | 1, +4.23R | - |
| Thu 2015-05-14 | +22.3 | DOWN | removed | -1.00 | 0, 0.00R, 0.00R | 2, +3.23R | - |
| Fri 2015-05-15 | -56.2 | none | no box trade | - | 0, 0.00R, 0.00R | 2, +3.23R | - |
| Mon 2015-05-18 | +0.7 | DOWN | removed | +0.86 | 0, 0.00R, 0.00R | 3, +4.09R | - |
| Tue 2015-05-19 | -88.7 | DOWN | KEPT | +0.76 | 1, +0.76R, 0.00R | 3, +4.09R | 0 small / 1 large |
| Wed 2015-05-20 | +9.7 | UP | KEPT | -1.00 | 2, -0.24R, 1.00R | 3, +4.09R | 1 small / 1 large |
| Thu 2015-05-21 | +63.6 | DOWN | removed | +0.00 | 2, -0.24R, 1.00R | 4, +4.09R | 1 small / 1 large |
| Fri 2015-05-22 | +32.4 | DOWN | removed | +3.96 | 2, -0.24R, 1.00R | 5, +8.05R | 1 small / 1 large |
| Mon 2015-05-25 | -28.7 | UP | removed | -0.35 | 2, -0.24R, 1.00R | 6, +7.70R | 1 small / 1 large |
| Tue 2015-05-26 | +17.1 | DOWN | removed | +0.94 | 2, -0.24R, 1.00R | 7, +8.64R | 1 small / 1 large |
| Wed 2015-05-27 | -37.6 | DOWN | KEPT | -1.00 | 3, -1.24R, 2.00R | 7, +8.64R | 1 small / 2 large |
| Thu 2015-05-28 | -5.4 | DOWN | KEPT | -1.00 | 4, -2.24R, 3.00R | 7, +8.64R | 2 small / 2 large |
| Fri 2015-05-29 | +30.5 | UP | KEPT | -1.00 | 5, -3.24R, 4.00R | 7, +8.64R | 2 small / 3 large |
| Mon 2015-06-01 | -15.6 | UP | removed | -1.00 | 5, -3.24R, 4.00R | 8, +7.64R | 2 small / 3 large |
| Tue 2015-06-02 | +63.4 | UP | KEPT | +2.37 | 6, -0.87R, 4.00R | 8, +7.64R | 2 small / 4 large |
| Wed 2015-06-03 | -47.0 | DOWN | KEPT | -1.00 | 7, -1.87R, 4.00R | 8, +7.64R | 2 small / 5 large |
| Thu 2015-06-04 | +119.3 | DOWN | removed | +1.39 | 7, -1.87R, 4.00R | 9, +9.03R | 2 small / 5 large |
| Fri 2015-06-05 | -25.1 | UP | removed | -1.00 | 7, -1.87R, 4.00R | 10, +8.03R | 2 small / 5 large |
| Mon 2015-06-08 | -0.5 | UP | removed | +1.24 | 7, -1.87R, 4.00R | 11, +9.27R | 2 small / 5 large |
| Tue 2015-06-09 | -30.6 | DOWN | KEPT | -1.00 | 8, -2.87R, 4.00R | 11, +9.27R | 2 small / 6 large |
| Wed 2015-06-10 | -4.6 | UP | removed | -1.00 | 8, -2.87R, 4.00R | 12, +8.27R | 2 small / 6 large |
| Thu 2015-06-11 | -32.3 | DOWN | KEPT | -1.00 | 9, -3.87R, 4.63R | 12, +8.27R | 2 small / 7 large |
| Fri 2015-06-12 | -35.4 | UP | removed | +1.22 | 9, -3.87R, 4.63R | 13, +9.49R | 2 small / 7 large |
| Mon 2015-06-15 | -10.6 | UP | removed | +1.28 | 9, -3.87R, 4.63R | 14, +10.77R | 2 small / 7 large |
| Tue 2015-06-16 | -65.1 | DOWN | KEPT | -1.00 | 10, -4.87R, 5.63R | 14, +10.77R | 2 small / 8 large |
| Wed 2015-06-17 | -6.8 | none | no break | - | 10, -4.87R, 5.63R | 14, +10.77R | 2 small / 8 large |
| Thu 2015-06-18 | +50.2 | DOWN | removed | -1.00 | 10, -4.87R, 5.63R | 15, +9.77R | 2 small / 8 large |
| Fri 2015-06-19 | -44.2 | UP | removed | +0.46 | 10, -4.87R, 5.63R | 16, +10.23R | 2 small / 8 large |
| Mon 2015-06-22 | -51.8 | UP | removed | +0.73 | 10, -4.87R, 5.63R | 17, +10.96R | 2 small / 8 large |
| Tue 2015-06-23 | -44.6 | DOWN | KEPT | -0.03 | 11, -4.90R, 5.66R | 17, +10.96R | 2 small / 9 large |
| Wed 2015-06-24 | +3.8 | DOWN | removed | +0.45 | 11, -4.90R, 5.66R | 18, +11.41R | 2 small / 9 large |
| Thu 2015-06-25 | +4.9 | DOWN | removed | -0.08 | 11, -4.90R, 5.66R | 19, +11.33R | 2 small / 9 large |
| Fri 2015-06-26 | +4.9 | DOWN | removed | +1.25 | 11, -4.90R, 5.66R | 20, +12.58R | 2 small / 9 large |
| Mon 2015-06-29 | +30.4 | none | no break | - | 11, -4.90R, 5.66R | 20, +12.58R | 2 small / 9 large |
| Tue 2015-06-30 | +21.0 | UP | KEPT | -1.00 | 12, -5.90R, 6.66R | 20, +12.58R | 2 small / 10 large |
CLOSED 2015-06-30 by the early-close line above (forward DD of the kept trades above 6R at any time: 6.66R). Final forward record, 35 days: kept 12 trades -5.90R; removed 20 trades +12.58R; no break 3. No further rows.
(File restored 06-30 from git after process mistake P11: rows 06-15 .. 06-29 re-appended from their own commits.)

# How my trades behave after entry: MFE / MAE of every A2 trade - then one exit idea (XT)
Coach 05-28: "study how your trades are managed after entry. take every A2 trade so far and log the max favourable and max adverse move before exit,
then write one testable exit idea from what you see (kill line first)."
Sim clock Fri 2015-05-29 01:00 London. END 2015-05-29.

## The log
`python bt/mfe_mae.py 2015-05-29` -> journal/mfe-mae-log.csv: 103 engine A2 trades (costs on), one row each: result, exit, MFE (best open profit in pips)
with its time, MAE (worst open loss) with its time, give-back. Measured on M5 candles against the fill, on the side I could close at.
63 winners, 40 losers (21 full stops, 19 noon losers).

## What the log shows (figures copied from the print)
| question | answer |
|---|---|
| How far do winners go? (MFE, 10 / 25 / 50 / 75 / 90th percentile) | 19 / 32 / 49 / 68 / 98 pips |
| How much of it do I keep? | result 4 / 13 / 36 / 55 / 79 pips; give-back from the best 3 / 6 / 12 / 22 / 33 pips; median share of the MFE kept 0.65 |
| How much heat do winners take first? (MAE) | -24 / -17 / -11 / -4 / -2 pips; worse than -10 on 36 of 63, worse than -20 on 12, worse than -30 on 2 |
| Were my full stops ever in profit? (MFE of the 21) | 0 / 1 / 6 / 8 / 18 pips; in profit by 10+ on 5 of 21, by 20+ on 1 |
| Noon losers (19): MFE and MAE | MFE 2 / 9 / 13 / 24 / 38; MAE -34 / -32 / -30 / -26 / -22 |
| Losers that were first in profit | by 10+ pips 17 of 40; by 15+ 13; by 20+ 8; by 30+ 3 |
| Once a trade has been +20 / +30 / +40 | 64 / 54 / 44 trades; final average +0.91R / +1.09R / +1.28R; ended as losers 8 / 3 / 1; as full stops 1 / 0 / 0 |
| When do winners make their best price? | 08:00 hour 8, 09:00 hour 9, 10:00 hour 15, 11:00 hour 31 of 63 |
| When do the full stops come? | 08:00 hour 4, 09:00 hour 10, 10:00 hour 4, 11:00 hour 3 of 21 |
| Has it changed since March? | winners' median MFE 56 -> 49 pips; median give-back 13 -> 12 pips: no |

## What I read in it
1. My full stops are wrong from the first minute: three quarters of them were never 8 pips in profit. Nothing done AFTER entry can rescue them - no
   break-even move, no early profit lock. (PM, X1 and LK said so; now I see why.)
2. My winners need room: more than half go 10+ pips against me first and one in five goes 20+. That is why every tighter or earlier stop (E, TD, CS) cost
   more than it saved. Only 2 of 63 winners ever went beyond -30.
3. Once a trade has been +30 pips it has never ended as a full stop and only 3 of 54 ended as losers: there is almost nothing to "protect".
4. The give-back is small in the middle (median 12 pips) and lives in the tail (TW: four trades).
5. THE ONE THING THAT POINTS SOMEWHERE: half of my winners (31 of 63) make their best price in the LAST hour before my exit, and only 17 in the first
   two hours. The move is very often still going when the clock closes it. The clock I exit on was chosen on January and checked by month up to
   March (10:00 / 11:00 / 13:00, whole hours, all worse than noon). It has never been run on all history, and never on a half-hour grid.

## Idea XT (idea 69): a later exit clock - PRE-REGISTRATION (pushed before any code or run of it)
Hypothesis: because my winners are still extending at noon, closing a little later earns more: the profile of net R by exit time has its top after 12:00.
Known against it, stated: exit 13:00 was worse than noon in January, February and clean March (+0.56 / +0.23 / +0.27R against +0.78 / +0.23 / +0.46R
a trade); the afternoon trade in my direction from 13:30 loses (AF, -0.11R); LK found the hour 11:00-12:00 adds +0.18R to trades in profit - that
hour is real; whether the next one is, the old monthly figures say no. The biggest minutes in my history are at 13:30 (DC): one variant stops before it.
Variants (3; A2 exactly - signal, 08:00 entry, 40 pip stop - only the closing time changes):
- XT1: close 12:30 London. XT2: close 13:00. XT3: close 13:25 (before the 13:30 minute).
Data: all A2 days before 2015-05-29, costs on, nothing dropped (the study above is an aggregate; no single days inspired this).
Kill lines (each variant against A2; one failure kills):
- K1: net R at least 2.0R above A2.
- K2: not behind A2 in either half (before 03-02; from 03-02) - the from-03-02 half is my lived days, the coach's bar.
- K3: max drawdown at most 0.5R above A2's; worst 10 in a row at most 0.5R worse.
- K4: still ahead of A2 without its 3 best difference-days.
- K5 the mechanism: the extra time must pay on the trades that are IN PROFIT at 12:00 (average change > 0 for that group). If the gain comes from
  losers recovering instead, the study's reading is wrong.
Reported beside: the same split for trades under water at noon; extra full stops after 12:00; the whole profile 12:00 / 12:30 / 13:00 / 13:25.
Hand-check before totals (P7/P9 routine): the 12:00 version of the new code must reproduce engine A2 on every day; one day's later exit price read
against the M5 bar by hand.
My guess (I cannot guess these; kept to show it): XT1 about level, XT2 about 2R behind, XT3 about 3R behind; all killed on K1.

## Mechanics hand-check (`python bt/exit_clock.py 2015-05-29 --check 2015-05-27`)
- The 12:00 version of the new code reproduces engine A2 on all 103 days (largest difference 0.000R).
- 05-27, a sell: the M5 bar opening at 12:30 has bid 1.08839; closing a sell costs the spread (1.0 pip) and slippage (0.1): 1.08850. Script: XT1 exit 1.08850,
  +0.85R. 13:00 bar open 1.08614 -> 1.08625 (+1.41R); 13:25 bar open 1.08537 -> 1.08548 (+1.60R). By hand and by script the same.

## Results (run once; `python bt/exit_clock.py 2015-05-29`; costs on; figures copied from the print)
A2: 103 days, net +34.95R, max DD 3.75R, worst 10 in a row -3.75R; before 03-02 +19.56R, from 03-02 +15.39R. Still open at 12:00: 82 trades
(63 in profit, 19 under water).
| close at | net R | share of A2 | vs A2: before 03-02 / from 03-02 | max DD | worst 10 | days better / worse | full stops after 12:00 | in profit at noon (63): change per trade | under water at noon (19): change per trade | diff without best 3 days |
|---|---|---|---|---|---|---|---|---|---|---|
| 12:00 (A2) | +34.95 | 100% | - | 3.75R | -3.75 | - | - | - | - | - |
| XT1 12:30 | +32.36 | 93% | -0.94 / -1.65 | 3.92R | -3.65 | 34 / 43 | 1 | -0.052R (24 better, 35 worse) | +0.035R | -4.67 |
| XT2 13:00 | +29.01 | 83% | -4.32 / -1.62 | 4.52R | -3.51 | 32 / 49 | 6 | -0.039R (25 better, 37 worse) | -0.183R | -8.88 |
| XT3 13:25 | +25.43 | 73% | -5.11 / -4.40 | 5.28R | -3.78 | 29 / 53 | 9 | -0.090R (23 better, 40 worse) | -0.201R | -13.34 |

## Kill lines
| line | XT1 | XT2 | XT3 |
|---|---|---|---|
| K1 at least +2.0R above A2 | FAIL (-2.59) | FAIL (-5.94) | FAIL (-9.52) |
| K2 not behind in either half | FAIL (behind in both) | FAIL | FAIL |
| K3 DD and worst 10 within 0.5R | PASS | FAIL | FAIL |
| K4 ahead without its 3 best days | FAIL | FAIL | FAIL |
| K5 the extra time pays on trades in profit at noon | FAIL (-0.052R a trade) | FAIL | FAIL |
VERDICT: all three KILLED. The exit stays 12:00 London.

## My guess against what happened
"XT1 about level, XT2 about 2R behind, XT3 about 3R behind": 2.59R, 5.94R and 9.52R behind. Right order, three times too kind.

## What I learned
- The study's most suggestive fact - half my winners make their best price in the last hour - does NOT mean the move continues after noon. Of the 63
  trades in profit at 12:00, 35 to 40 are worse off half an hour to an hour and a half later and only 23 to 25 better. The last hour before noon is
  where the morning's move ends, not where it is cut short. The eye read "still going"; the count says "arriving".
- Staying longer also costs on the loss side: 6 more full stops by 13:00, 9 by 13:25, and the trades under water at noon lose another 0.18R to 0.20R.
- The profile of A2's net by exit time, all history: 12:00 100% | 12:30 93% | 13:00 83% | 13:25 73% (and the old monthly runs had 11:00 and 10:00
  below noon). With ET's entry profile (07:30 90% | 08:00 100% | 08:30 81%) both clocks of the rule are the top of a hill on all 103 days. January's
  choice of 08:00 -> 12:00 has now survived five months it never saw.
- What the MFE / MAE log is good for, since it did not give me an exit rule: it explains WHY the 33 exit ideas died. Stops are wrong from the first
  minute (nothing after entry can save them); winners need 10 to 20 pips of room (so nothing tighter works); a trade that has been +30 almost never comes
  back (so there is nothing to protect); and the move ends near noon (so there is nothing to wait for). The management of A2 is: put it on, leave it alone.
- The log stays in the journal folder (journal/mfe-mae-log.csv) and I refresh it at each month-end review.
Counts: ideas 69, variants 192 (XT1 XT2 XT3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Process mistakes: 9.

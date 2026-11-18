# Idea FS (idea 76): a fresher direction signal for A2 - PRE-REGISTRATION with worked cases (pushed before the script is written or run)
Sim clock Fri 2015-06-05 22:00 London. END 2015-06-06. Coach: one idea to make A2 itself better, kill line first, variants counted; one test, one day.
## The idea
A2 decides its direction from last night's 22:00 London close against the close three trading days earlier. By the time I enter at 08:00 that close is
ten hours old, and the night has traded since. Every other number of the rule has been re-tested on all history (lookback, entry minute, stop, exit
clock); the END POINT of the signal never has. Fresher version: use the price at 07:00 London today - the moment I write the call - instead of last
night's close.
Known against it, stated: on the days where a neighbour signal pointed the other way, A2 was the one that made money (LB: +8.94R against -6.32R on 16 days
for the 2-day lookback); the night trade in my direction earns nothing (NT: 0.00R) and nights tend to give back part of the day's move (NF). So the
night's news may be noise, and adding it to the signal may make it worse. Honest prior: no gain; maybe a loss.
## Variants (3; entry 08:00, 40 pip stop, exit 12:00, size - all A2; only the DIRECTION changes; own simulator of bt/confirm_entry.py at X = 0, whose stop days equal the engine's)
- FS1: sign of (07:00 price today - 07:00 price three trading days ago): same lookback, both ends at 07:00.
- FS2: sign of (07:00 price today - the 22:00 close three trading days back that A2 uses): only the near end is refreshed.
- FS3: A2's direction, but NO TRADE when FS2 points the other way (the night has cancelled the signal).
## WORKED CASES (June goal; python line from figures in my own 07:00 calls)
06-05: A2: close 06-04 1.12375 against close 06-01 1.09259 = +312 pips -> BUY. FS1: 07:00 today 1.12200 against 07:00 on 06-02 1.09325 = +288 pips -> BUY.
FS2: 1.12200 against 1.09259 = +294 pips -> BUY. All three agree; the script must print these three figures for 06-05.
Expectation worked from what I know: the signals can only differ when the 3-day gap is small against the night's move. My small-signal days
(gap / ADR5 under about 0.3) are roughly a quarter of all days, and a night moves 20 to 50 pips; so I expect the direction to differ on roughly 10 to 20
of 108 days. On those days, if the night carries no information, the variant is a coin against A2 - and SG showed small-signal days are ordinary A2
days (positive), so a coin that flips some of them should LOSE a little. Expected: FS1 and FS2 one to three R behind A2.
## Kill lines (FS2 is the main variant; against A2 on the same simulator, all A2 days before 2015-06-06, costs on; one failure kills)
- K1: net R at least 2.0R above A2.                                                [worked expectation: 1R to 3R BEHIND -> expect FAIL]
- K2: not behind A2 before 03-02 and at least +1.0R ahead on lived days.
- K3: max drawdown at most 0.5R larger than A2's.
- K4 where it differs: at least 10 days with a different direction, and on those days the variant's net is above 0R and above A2's net on them.
  [worked: 10 to 20 such days expected; the sample line may bind]
- K5 neighbour: FS1 not more than 1.0R behind A2.
FS3 (the filter) is judged by its own short line: the trades it removes must average below 0R and number at least 10; otherwise killed.
A survivor gets the lived-days table and then at most a forward paper tag.
My guess = the worked expectation: killed on K1.

## Mechanics hand-check (`python bt/fresh_signal.py 2015-06-06 --check 2015-06-05`)
06-05: A2 +312 pips BUY; FS1 1.12200 against 1.09325 = +288 BUY; FS2 1.12200 against 1.09259 = +294 BUY. The worked case to the pip.
Baseline: A2 on this simulator makes +35.50R on 109 days (engine +35.73R, the R-unit difference found in CF); the stop days are identical to the engine's.

## Results (run once; `python bt/fresh_signal.py 2015-06-06`; costs on; figures copied from the print)
A2: 109 days, net +35.50R, max DD 4.44R; before 03-02 +19.47R, from 03-02 +16.02R.
| variant | net R (vs A2) | before 03-02 | lived days | max DD | days with a different direction (lived) | variant / A2 on those days |
|---|---|---|---|---|---|---|
| FS1 07:00 against 07:00 three days ago | +32.28 (-3.22) | -2.90 | -0.32 | 4.32R | 9 (5) | -2.73R / +0.48R |
| FS2 07:00 against A2's far close | +36.64 (+1.14) | +0.88 | +0.26 | 3.77R | 3 (2) | +0.31R / -0.83R |
| FS3 no trade when FS2 disagrees | +36.33 (+0.83) | - | - | 3.77R | removes 3 trades averaging -0.277R | - |
FS2's three differing days (variant / A2): 02-18 +0.42 / -0.46 | 05-06 -1.00 / +0.64 | 05-11 +0.89 / -1.00.
FS1's nine: 01-13 -1.00 / +1.40 | 02-12 -0.40 / +0.33 | 02-18 +0.42 / -0.46 | 02-19 -1.00 / -0.35 | 03-18 -0.35 / +0.30 | 05-06 -1.00 / +0.64 |
05-11 +0.89 / -1.00 | 05-13 -1.00 / +0.64 | 05-29 +0.71 / -1.00.

## Kill lines for FS2
| line | worked expectation | result | verdict |
|---|---|---|---|
| K1 net at least +2.0R above A2 | 1R to 3R behind | +1.14R | FAIL |
| K2 not behind before 03-02 and +1.0R ahead on lived days | - | +0.88R; +0.26R | FAIL (lived lead under 1.0R) |
| K3 max drawdown within 0.5R of A2's | - | 3.77R against 4.44R | PASS |
| K4 at least 10 differing days, variant positive and ahead on them | 10 to 20 days | 3 days | FAIL (sample) |
| K5 neighbour FS1 not more than 1.0R behind | - | -3.22R | FAIL |
FS3's own line (removed trades below 0R and at least 10 of them): 3 trades -> FAIL.
VERDICT: all three KILLED. No tag. A2's signal stays "last 22:00 close against the close three trading days earlier".

## Worked expectation against the run
I expected the direction to differ on 10 to 20 days and the variants to sit 1R to 3R behind. It differs on 3 days (FS2) and 9 (FS1); FS1 is 3.22R
behind, FS2 1.14R ahead on three trades. My count of differing days was too high by a factor of three for the main variant: I reasoned from "a quarter of
days have a small gap" and forgot that the night must move MORE than the gap AND against it. A miss in an expectation, written before the run and
compared after; no pushed figure of record needed correcting.

## What I learned
- The end point of the signal hardly matters: refreshing it to 07:00 changes the direction on 3 days in 109. The 3-day direction is not a
  knife-edge that the night keeps flipping; when I write the call at 07:00 the answer is almost always the one last night's close already gave.
- Moving BOTH ends to 07:00 (FS1) changes 9 days and loses on 6 of them. As with the lookback neighbours (LB), where the versions disagree A2 is
  more often the one that is right. Small evidence, same direction as before.
- So there is nothing to gain and nothing to fear here. The signal's last untested part is closed: lookback (LB), end point (FS), entry minute
  (ET, LD), entry order (LE, CF), stop (SA), exit clock (XT), exit management (33 definitions, TW). Every part of A2 has now been moved on all history.
  None of the moves beats it by my lines.
- For the coach's brief ("make A2 itself better"): three honest attempts this week (GA, CF, FS), three kills. My candid reading after 76 ideas: A2
  is a simple rule sitting on a local top in every direction I can push it. Whatever makes its results better or worse from here is the market's
  regime (the stop rate), not a parameter I have left to turn.
Counts: ideas 76, variants 213 (FS1 FS2 FS3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Numbers or rules corrected after a push in June: 0.

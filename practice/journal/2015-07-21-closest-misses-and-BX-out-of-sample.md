# Step back: my 5 closest misses, and one honest re-test (coach 07-21). Written Tue 2015-07-21 22:00 London, before any code or run.

## The 5 closest misses (from STATE.md, 108 ideas)
| idea | what it was | how close | why it died | market reason, honestly |
|---|---|---|---|---|
| BX (05-11) | follow the first break of the 12:00-13:25 box in 13:25-14:30, flat 17:00 | BX2: 63 trades +0.227R, passed average, cost stress (3.0+1.0), without-best-3, independence from A2 (corr ~0) | not positive in every period (Jan -2.13R), drawdown 5.90R over my 5R line | the day's biggest hour starts 13:00-15:00 on 43% of days (07-14 study) and big hours are mostly not taken back; no direction forecast needed |
| SW1 (07-17) | 10-day direction held up to 5 days | 5 of 6 lines; positive both sides of 04-07 | cannot be told from a coin (p 0.44, 39 trades) | slow trend; on paper shadow now (1 trade, -1.01R) |
| WG (06-22) | fade the weekend gap to Friday's close | +0.087R, independent of A2 | 15 cases; profit smaller than a plausible error in the Sunday spread | gaps close; but the cost is the unknown |
| GB1 (06-11) | trail the stop once +80 pips ahead | +1.10R on 3 days | 3 cases; a hint | none beyond "big days give back" |
| MB1 (05) | small-morning filter | looked like +12R kept | dose the wrong way; closed by its forward drawdown line 06-30 | none that survived |
(WO, BK, DH, DF all had positive all-history averages and one date, 04-07, that ended them: not near misses, the same miss.)

## The pick: BX
Most believable reason of the five, the only one that does not lean on A2's direction, and the only one with a real gift: it was run
ONCE, on data to 05-11, then frozen. Every day from 05-12 has never been seen through it. That is a true out-of-sample part, the thing
my history almost never gives me.

## Its single honest version: BX2, UNCHANGED, judged ONLY on 05-12..07-21
BX2 = first touch of the 12:00-13:25 box edge between 13:25 and 14:30 London; stop at the other side of the box; boxes over 60 pips
skipped; flat 17:00; own small simulator in bt/box_break.py with spread 1.0 + slip 0.1 (code untouched since May; I call its functions).
One variant. I chose BX2 from three because its stop sits where the idea is wrong; that choice used the May results, which is exactly why
only the unseen days count.

## Kill lines (the May thresholds where they exist), all must pass on the unseen days
O1 average >= +0.15R. O2 stressed (3.0 spread + 1.0 slip) average >= +0.05R. O3 net above zero without its best 3 trades.
O4 max drawdown <= 5R and worst 10 trades in a row >= -4R. O5 correlation with A2's daily R <= 0.30.
O6 net above zero in each half of the unseen days (05-12..06-15 and 06-16..07-21).
Sample: under 25 trades -> not judgeable -> stays dead.
Power, written first: about 35 trades with a spread near 1.2R give an error of about 0.2R on the average. A rule with NO edge passes O1
about one time in four. So a pass here is weak: it would only make BX2 a candidate for route B step B1, and the 40 forward paper
trades of B2 plus the coach's word (B3) are the real gate. A fail = dead for good, no further re-test.
My guess: the average is positive but under +0.15R; O1 or O4 fails.

## Counts and worked case (tool, before outcomes)
Tool: `python bt/box_break_oos.py 2015-07-22 count` / `facts 2015-07-21`. The wrapper loads box_break.py's definitions byte for byte and does
not run its results table (three import attempts failed on my wrapper's own plumbing before this; no outcome was printed in any of them).
- Unseen A2 days 05-12..07-21: 51. BX2 trades: 43 (22 before 06-16, 21 from); 8 days without a trade (no break, or a box over 60 pips). Judgeable.
- Worked case, today Tue 07-21: box 12:00-13:25 = 1.08561-1.08786 (22.5 pips, 17 candles). The afternoon went up, so by the rule the first
  touch of 1.08786 in 13:25-14:30 is a BUY at about 1.08797 (edge + 1.0 spread + 0.1 slip), stop 1.08561 (risk about 23.6 pips), flat 17:00.
  If the tool shows a different side or stop, the tool or my reading is wrong and I stop.

## Result (one run)
Tool: `python bt/box_break_oos.py 2015-07-22 test 2015-07-21`. Worked case 07-21: BUY, not stopped, +1.99R at 17:00: side and mechanics as I wrote them first.
| BX2, unseen days 05-12..07-21 | value | line | |
|---|---|---|---|
| trades / wins / stops | 43 / 44% / 18 (15 ups, 28 downs) | >= 25 | judgeable |
| average | +0.176R (+-0.42) | O1 >= +0.15R | PASS |
| stressed average (3.0 + 1.0) | +0.019R | O2 >= +0.05R | **FAIL** |
| net without best 3 | -3.24R (net +7.59R) | O3 > 0 | **FAIL** |
| max drawdown / worst 10 in a row | 5.32R / -4.13R | O4 <= 5R and >= -4R | **FAIL** (both, narrowly) |
| correlation with A2 | +0.05 | O5 <= 0.30 | PASS |
| halves | +4.71R (22) / +2.87R (21) | O6 both > 0 | PASS |
**BX2 FAILS three of six lines on the unseen days. By what I wrote first it is dead for good: no further re-test, no shadow.**
What I learned:
1. The most interesting number in six weeks: on days it had never seen, the frozen rule made +0.176R a trade, close to May's +0.227R,
   positive in both halves, and it has nothing to do with A2. The average did not fall apart out of sample. That is rare in my log.
2. And it is still not tradable as written: three trades are more than the whole profit (-3.24R without them), the +-0.42R error bar
   covers zero, and with a stop of about 25 pips a 3-pip spread eats nearly all of it. The same three weaknesses as in May. An edge that
   lives in three trades out of 43 is what luck looks like too, and my power note said a no-edge rule passes O1 one time in four.
3. Step-back lesson: my near misses are near for the same reason: a small positive average with a wide error bar. Six months of
   one pair cannot separate +0.15R from zero for anything that trades once a day. More ideas on this history will keep producing
   "almost"; what separates them is forward time, which is what the return rule and the 09-21 review are for.
Counts: idea 109 (a re-test of BX, counted); variant 304; second setups tried stays 18, none alive.

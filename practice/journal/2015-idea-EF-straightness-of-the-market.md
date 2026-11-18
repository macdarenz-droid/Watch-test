# Idea EF: does the straightness of the market, known at 07:00, tell me when the signal is worth something? KILL LINES WRITTEN BEFORE ANY CODE
Clock Thu 2015-07-02 01:00 London (end of released data). After funded day 69 and the June review (journal/2015-06-month-end-review.md), from which this test is picked.
July goal: a worked case before every pushed number or rule; every file write read back.

## Why, and the trap
June's review: the days are as big as ever; what went is the direction over weeks, and with it the signal's worth. MO (on paper) watches my own
results and needs 40 days to notice. A measure of the MARKET would be faster - if it works.
THE TRAP: my history has one change, in spring. ANY number that was high from January to March and low afterwards will line up with the side
advantage across that change, including numbers that mean nothing. So "it correlates over the whole history" is worthless here and is not a kill line.
The only honest question 126 days allow: INSIDE the first half, and INSIDE the second half, do the straighter days have the better side advantage?
The calendar cannot help a measure there. (Already tried in the same family: F1 "straight week" paper tag, closed 05-06 at its gate; idea R's regime
detectors on January-February only; XS found two-week choppiness unchanged between Jan-Feb and Mar-Apr. None was tested inside halves against the side advantage.)

## The measure (fixed now)
STRAIGHTNESS over N days, at 07:00 on day t = |22:00 close of day t-1 minus the 22:00 close N trading days before it| divided by the sum of the
London-day ranges of those N days. 1 = a straight line; near 0 = a lot of movement that went nowhere.
Variants (3): EF1 N = 10; EF2 N = 20; EF3 N = 40.
Worked case (07-01, N = 10; closes and ranges from my daily calls): |1.11445 - 1.12471| = 102.6 pips; the ten London-day ranges 151.3 + 106.2 + 107.2
+ 98.2 + 212.1 + 80.3 + 73.9 + 89.6 + 323.8 + 131.1 = 1373.7 pips; straightness = 0.075. A market that moved 1,374 pips to get 103 pips.
What is sorted: the SIDE ADVANTAGE of each day (my side's R minus the other side's; idea CO's control), all A2 days to END 2015-07-02.

## The test
Halves by date, as in idea RG (first half of the days / second half). Inside each half the days are split at that half's own median straightness into
STRAIGHT and CROOKED. Statistic: mean side advantage of the straight days minus that of the crooked days, inside each half, and the two pooled
(weighted by days). Chance: 20,000 re-orderings of the side advantages INSIDE each half (so the halves' own levels stay where they are).
Kill lines (each variant; one failure kills it):
- K1: straight minus crooked is POSITIVE inside the first half AND inside the second half.
- K2: pooled inside-half difference at least +0.30R a day.
- K3: within-half permutation p < 0.05.
- K4 sample: at least 15 days in each of the four groups.
Three looks: the claim "straightness tells me when the signal works" survives only if a variant passes all four AND its p is under 0.017.
Printed beside, NOT a kill line (the trap, shown): the plain correlation over the whole history.
Worked case for the lines: first half straight +1.3R / crooked +0.7R (+0.6); second half straight +0.2R / crooked -0.1R (+0.3); pooled +0.45R: K1, K2
pass; with a standard deviation of 1.8R and about 31 days a group the pooled difference is known to about 1.8 x sqrt(4 / 124) = 0.32R, so +0.45R gives
p about 0.08: K3 FAILS. To pass K3 the inside-half difference must be about +0.6R or more. This test can only see a strong effect.
What each outcome means: SURVIVES -> a market-based monitor is worth writing as a pre-set paper rule beside MO (tested like MO first). KILLED -> the
change in spring is, as far as I can measure, a date and not a condition I can read from the chart; MO (my own results) stays the only instrument, slow as it is.
No live rule changes either way.
Worked expectation: the whole-history correlation will be clearly positive for N = 20 and 40 (the trap). Inside the halves I expect small differences of
mixed sign: all three KILLED on K1 or K3; EF3 also on K4 (the first half keeps only about 22 days after 40 are used up).
Counts when run: idea 95, variants 265-267.

## Mechanics check (kill lines pushed first in commit 385e07c; `python bt/straightness.py 2015-07-02 --check 2015-07-01`)
My side against the engine's A2: largest difference per day 0.000R on 127 days. 07-01: straightness over 10 days 0.075 (hand: 0.075); side advantage -0.60R (as logged).

## RESULTS (one run: `python bt/straightness.py 2015-07-02`; halves 01-06 .. 04-02 / 04-03 .. 07-01; 20,000 within-half re-orderings; figures copied from the print)
| variant | half | STRAIGHT days: n, side advantage | CROOKED days: n, side advantage | difference | pooled | p | whole-history correlation |
|---|---|---|---|---|---|---|---|
| EF1 N=10 | first | 27, +0.804R | 27, +0.750R | +0.054R | | | |
| | second | 32, +0.367R | 32, -0.294R | +0.660R | +0.383R | 0.1195 | +0.14 |
| EF2 N=20 | first | 22, +1.254R | 22, +0.374R | +0.880R | | | |
| | second | 32, -0.164R | 32, +0.238R | -0.402R | +0.120R | 0.3616 | +0.15 |
| EF3 N=40 | first | 12, +1.010R | 12, +1.109R | -0.099R | | | |
| | second | 32, +0.185R | 32, -0.112R | +0.297R | +0.189R | 0.3161 | +0.13 |
| line | EF1 | EF2 | EF3 |
|---|---|---|---|
| K1 positive inside BOTH halves | PASS | FAIL | FAIL |
| K2 pooled at least +0.30R | PASS (+0.383) | FAIL | FAIL |
| K3 within-half p < 0.05 | FAIL (0.12) | FAIL | FAIL |
| K4 15 days in every group | PASS | PASS | FAIL (12) |
VERDICT: all three KILLED. Straightness of the last 10, 20 or 40 days does not sort my days inside the halves in any way I can tell from chance.

## Expectation against the run
"Whole-history correlation clearly positive for N = 20 and 40": WRONG - it is weak everywhere (+0.13 to +0.15). I had expected the trap to look
tempting; it does not even do that. "Inside the halves small differences of mixed sign, all killed, EF3 also on sample": yes (EF2 has the two halves
pointing opposite ways by 0.9R and 0.4R - that is what noise at 22-32 days a group looks like).

## What I take from it
- The answer I wrote down for a kill: the change in spring is, as far as I can measure, a DATE and not a condition I can read off the chart at 07:00.
  The review's sentence "A2 pays when a multi-week move is under way" describes the two periods; a 10-, 20- or 40-day straightness number does not
  turn that description into something that sorts days.
- The one row that leans the right way (EF1 inside the second half: +0.37R on the straighter days, -0.29R on the crooked ones) fails its line at
  p = 0.12 and is one of three looks; in the first half the same measure shows nothing (+0.05R). I do not keep it as a paper line: three near-misses
  kept "just in case" are how a journal fills with noise. Written here; not revisited unless a new, different reason appears.
- So the instruments for a fading edge remain the ones I have: MO on paper (slow, results-based, judged at 60 lived days), the worry lines, and the
  size rule, which is the only one of them that is live and the only one the account needs to survive.
- 95 ideas. The useful ones this month were not the ones that tried to improve the rule: BD (nothing cuts the best days), LX / CO / RG (what
  actually happened to the edge), SG / ST (what the size rule does). The next test should come from that side again.
Counts: ideas 95, variants 267 (EF1, EF2, EF3). Adopted trading ideas: 0. July: numbers or files found wrong later than the turn that made them: 0
(one missing file caught by the read-back within the same turn-pair and committed with a plain message).

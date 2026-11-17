# Idea BS: how do my best A2 days START? Three hypotheses, a look at the 15 best days, one pre-registered test. WRITTEN BEFORE THE TEST IS RUN
Clock Tue 2015-06-16 01:00 London (end of released data). After funded day 57. Coach 06-15: "go through your journal and charts, write 3 fresh
hypotheses about how your best A2 days start, pick the strongest, prereg it with a kill line, max 3 variants."
June goal: every number and every test rule gets one worked case before it is pushed. Worked cases below, from the tool.
Note on scope: this is a which-days question; the coach closed day-filter tests on 06-09 "for a while" and opens this one himself today.

## What my own notes say (the funded winners of +1.4R or more, read again)
04-10 "27 pip drop in the hour before entry"; 04-17 "new weekly high"; 04-28 "dead 18 pip night"; 04-30 "lively pre-entry hour (51 pips)"; 05-19 "the first
M15 candle fell 90 pips"; 06-02 "+36 and back to -8 in the first hour"; 06-04 "the second morning after a wide day; quiet first hour". Most of what
I wrote is about what happened AFTER the entry (already killed: T, FH, M, CF). A start has to be known at 08:00.

## Three hypotheses (all facts known at 08:00 London; none of these three has been cut this way before)
- A "break-out start": the 07:00-08:00 hour already trades beyond the 00:00-07:00 range in my direction. (Idea G looked only at the hour breaking AGAINST me.)
- B "coil start": yesterday was a narrow day (smallest London-day range of the last four) and today expands.
- C "busy start": the 07:00-08:00 hour is busy - tick volume at least 1.3 times its own 10-day mean. I have never used the volume column at all.
Worked cases of the facts (`python bt/best_start.py 2015-06-16 check DATE` style, printed): Fri 06-12 (my sell; pre-hour low 1.12155 under the night low
1.12218): A yes; yesterday / 5-day ratio 0.86; volume ratio 0.91. Mon 06-15 (my sell; pre-hour high 1.12350 over the night high 1.12283): A no, broke
AGAINST; ratio 0.84; volume 1.02. Both match what I walked.

## The look (study, not a test: `python bt/best_start.py 2015-06-16 study`; the 15 best of 115 A2 days; base rates counted on all days WITHOUT outcomes)
| fact | among the 15 best | base rate, all 115 days |
|---|---|---|
| A new night extreme my way in 07-08 | 5 of 15 (33%) | 37% |
| (the hour breaks against me) | 4 of 15 (27%) | 35% |
| B yesterday the narrowest of four | 2 of 15 (13%) | 32% |
| (yesterday's range under 0.8 of the five before) | 1 of 14 | 30% |
| C pre-hour volume >= 1.3 x | 3 of 13 (23%) | 12 of 105 (11%) |
- A: nothing. My best days do not start with a break my way more often than any day.
- B: WRONG WAY ROUND. Best days come after WIDE days (median ratio 1.24 against 0.97), not narrow ones. And that is not new: idea GA (06-03) already
  found the morning after a wide day to be A2's best group. I do not re-test a known result under a new name.
- C: the only one that leans the right way - and it is 3 days (03-10, 03-11, 04-17). Also counted before choosing: volume is mostly the lively hour
  again (correlation with the pre-hour range 0.59; 25 of the 28 days at 1.15x or more are 30+ pip hours), and idea PH already has that on paper, where the lively
  days are -3.21R in 26 lived days.
Said plainly: none of the three is strong. "Pick the strongest" = C, by default. I test it because it was asked and written, and I expect a kill.

## The test of C (inspiring days removed: the 15 best days are dropped from BOTH sides; days without a 10-day volume mean dropped; costs on; all history to END 2015-06-16)
Variants (three thresholds = one dose check, fixed now from counts only): BS1 volume ratio >= 1.30 (12 days on all history); BS2 >= 1.15 (28); BS3 >= 1.05 (46).
Each compares A2's result on the yes days with the no days.
Kill lines (one failure kills the variant):
- K1: yes days average at least 0.25R more than no days.
- K2: the difference is positive both before 03-02 and on the lived days from 03-02.
- K3 sample: at least 20 yes days and 20 no days.
- K4 "best days" claim: days of +1.0R or more are at least 1.5 times as frequent among the yes days as overall.
- K5: K1 also at stressed costs (2.0 pip spread, 0.5 slippage).
Worked case for the lines: if 25 yes days average +0.30R and 65 no days +0.05R, K1 passes (+0.25); if 4 of 25 yes days (16%) are +1R days against 10% overall, K4 passes (1.6).
A survivor becomes a counts-only line in the daily call; nothing live changes (A2 has no skips; coach 05-26: only what also beats A2 on lived days counts).
Worked expectation, written now: BS1 has about 9 yes days after the drop -> K3 FAIL. BS2 and BS3: the lively hour was good before March and bad since, so
I expect a difference near zero that changes sign between the periods -> K1 and K2 FAIL. No survivor.
Counts when run: idea 82, variants 229-231.

## Mechanics check (pre-registration pushed first in commit d1efca7)
03-11 (`check`): sell, volume ratio 1.78, yesterday ratio 1.46, no break either way: a yes day for all three variants, as in the study table.

## RESULTS (one run: `python bt/best_start.py 2015-06-16 test`; figures copied from the print)
115 A2 days, +33.61R. The 15 best days dropped (+32.51R) and the 8 early days without a 10-day volume mean dropped -> 92 days, -4.82R (-0.052R a day);
days of +1R or more among them: 11 (12%).
| variant | yes days: n, avg R, win | no days: n, avg R, win | difference | before 03-02 (yes / no, diff) | lived (yes / no, diff) | stressed diff | +1R days among yes (lift) |
|---|---|---|---|---|---|---|---|
| BS1 volume >= 1.30x | 9, -0.381, 22% | 83, -0.017, 53% | -0.365 | 1 / 26, +0.631 | 8 / 57, -0.449 | -0.361 | 0 (0.00) |
| BS2 >= 1.15x | 25, -0.350, 28% | 67, +0.059, 58% | -0.409 | 4 / 23, +0.375 | 21 / 44, -0.554 | -0.399 | 2 (0.67) |
| BS3 >= 1.05x | 41, -0.181, 41% | 51, +0.051, 57% | -0.232 | 8 / 19, +0.150 | 33 / 32, -0.313 | -0.246 | 5 (1.02) |
| line | BS1 | BS2 | BS3 |
|---|---|---|---|
| K1 yes at least +0.25R above no | FAIL | FAIL | FAIL |
| K2 positive in both periods | FAIL | FAIL | FAIL |
| K3 20 / 20 days | FAIL (9) | PASS | PASS |
| K4 +1R days 1.5x as frequent | FAIL | FAIL | FAIL |
| K5 K1 at stressed costs | FAIL | FAIL | FAIL |
VERDICT: KILLED, all three, and the wrong way round: without my best 15 days a busy pre-entry hour is a WORSE start, not a better one. No counts line.

## Worked expectation against the run
BS1 fails the sample line (9 yes days): as written. BS2 / BS3: I wrote "a difference near zero that changes sign between the periods". The sign change
is there (+0.38 / +0.15 before March, -0.55 / -0.31 on the lived days); "near zero" was wrong: it is -0.41R and -0.23R. I under-guessed the size.

## What I take from it, and what I do NOT do with it
- The three busy days among my best 15 were exactly that: three days. On the other 92 the busy hour loses. A feature read off the best days and
  the same feature on ordinary days pointed in opposite directions. That is what "the losers I look at have winning twins" looks like from the other side.
- I do NOT turn it round into "skip busy hours". That is idea PH with a different ruler (25 of 28 busy days are lively hours), PH already has its
  paper tag with its own gate (60 lively days AND 200 days), and the sign flips between the two periods here just as it did there. No new line, no new tag.
- The number that matters most came out as a by-product, and I had never printed it this way: A2 is +33.61R on 115 days; its 15 best days are +32.51R.
  The other 100 days together make about +1.1R. (On the 92 days of this test: -4.82R.) My whole edge is thirteen percent of my days, and nothing I can
  see at 08:00 - not a break, not a coil, not volume - tells me which they are. That is why every filter kills winners, why targets and locks cost
  (they cut exactly those days), and why "no skips, hold to noon" is the rule. It is also why the edge is so hard to measure: it is a count of rare days.
- Not luck-proof either way: 15 days carrying everything is also what a lucky run with no edge would look like. The coach's line stands: judged
  after a few hundred lived trades.
Counts: ideas 82, variants 231 (BS1, BS2, BS3). Hypotheses A and B were looked at on the 15 best days only and not tested: not counted as variants,
written here so they are not forgotten. Adopted trading ideas: 0. On paper: UN3, PH2, MB1; forward count with a judging rule: GB1 (3 of 15).
Numbers or rules corrected after a push in June: 1 (none today).

# The one weakness from the April review: trading a SMALL 3-day signal at full size. HYPOTHESIS AND KILL TEST WRITTEN BEFORE ANY RUN
Clock Fri 2015-04-24 01:00 London (end of released data). All lived history 01-06 .. 04-23 (explicit end date 2015-04-24); costs on; London time.
Source: journal/2015-04-month-end-review-so-far.md, weakness 4.

## What I already know - said first
- Idea GAP (04-02): skip when the 3-day gap is under 25 pips / under 50 pips / under 0.25 x the 5-day average daily range. JANUARY ONLY: 3 to 5 skipped days, all winners
  (+0.94R to +1.07R each). No survivor. January cannot count again here: its answer is known and it had almost no small-gap days.
- This week's four losing days had gaps of +151, +54, -25, -80 pips: only two of them are "small" by any of the definitions below. And 04-15 (gap -5 pips) made +1.48R.
  So the week that made me look does not even fit the idea cleanly. I say that now so that I cannot pretend otherwise later.
- Counted today, occurrences only (no results): 77 signal days. Gap under 25 pips: 13 (Jan 3, Feb 7, Mar-now 3). Under 50 pips: 21 (5 / 9 / 7).
  Under 0.25 x ADR5: 16 (3 / 7 / 6). Under 0.50 x ADR5: 29 (6 / 11 / 12). Median gap 116 pips, median ratio 0.77.
- Sample, plainly: the largest version has 29 days, 23 of them outside January. The average of 23 trades is known to about +-0.43R. This can show a large effect only.

## Hypothesis
When the 3-day gap is small against the market's normal daily movement, the signal is noise: outside January those trades have clearly lower expectancy than
large-gap trades, in February and in March-to-now separately.

## Variants (120, 121, 122; ideas -> 45), no others afterwards. Everything else exactly A2; derived from A2's own daily results (skip = 0R, half size = half the R).
- SG1: no trade when the gap is under 50 pips. (= GAP50 re-run on ALL history; flagged as a re-run of a January-only definition, as the coach's 04-07 note asks.)
- SG2: no trade when the gap is under 0.50 x the 5-day average daily range. (New threshold: half a normal day. The 29-day version.)
- SG3: half size on the SG2 days.

## KILL TEST (explicit). The build can only kill; a survivor gets a forward paper tag (no adoption question before 200 forward trades).
A variant survives only if ALL:
  K1. avg R per A2 signal day at least A2's + 0.05R (all history);
  K2. the days it changes are worse under A2 than the days it leaves alone by at least 0.3R (all history);
  K3. THE DECISIVE LINE: that gap is at least +0.3R in February AND in March-to-now, each separately (January is known and is only reported);
  K4. it changes at least 10 days and leaves at least 60% of the days alone.
My guess, written now: small-gap days earn a little less than the others (about 0.2R), the gap is under 0.3R in at least one of the two months, K1 fails for all three
(removing trades that still earn something lowers the average per signal day). No survivor - and April's last four days stay what they look like: a range week.

# RESULTS (kill test above pushed in commit 02d2733 before the script existed; labels checked on three days against my daily signal lines; one run: `python bt/small_signal.py 2015-04-24`)
78 A2 trades 01-06..04-23, engine, full costs.

## 3-day gap under 50 pips, or not
| | trades | win rate | avg R | net R | Jan | Feb | Mar-now |
|---|---|---|---|---|---|---|---|
| Large gap (50+) | 57 | 56% | +0.356 | +20.31 | 14, +0.68 | 11, +0.08 | 32, +0.31 |
| Small gap (< 50) | 21 | 81% | +0.619 | +12.99 | 5, +1.07 | 9, +0.42 | 7, +0.56 |
Small-gap trades are BETTER by 0.26R (noise +-0.46R), in all three periods.

## Gap under half the 5-day average daily range, or not
| | trades | win rate | avg R | net R | Jan | Feb | Mar-now |
|---|---|---|---|---|---|---|---|
| Large (>= half a day) | 49 | 57% | +0.412 | +20.17 | 13, +0.80 | 9, -0.03 | 27, +0.37 |
| Small (< half a day) | 29 | 72% | +0.453 | +13.14 | 6, +0.75 | 11, +0.45 | 12, +0.31 |
No difference (0.04R); in February the small-signal days were the ones that made the money (+4.97R against -0.30R).

## Variants and kill lines
| | changes | avg R / signal day (A2 +0.427) | net R (A2 +33.31) | max DD (A2 2.10) | gap all | Jan | Feb | Mar-now | K1 | K2 | K3 | K4 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SG1 skip when gap < 50 pips (GAP50 re-run) | 21 days | +0.260 | +20.31 | 2.29 | -0.26 | -0.39 | -0.33 | -0.25 | FAIL | FAIL | FAIL | PASS |
| SG2 skip when gap < half a normal day | 29 days | +0.259 | +20.17 | 2.31 | -0.04 | +0.05 | -0.49 | +0.07 | FAIL | FAIL | FAIL | PASS |
| SG3 half size on those days | 29 days | +0.343 | +26.74 | 2.06 | -0.04 | same | | | FAIL | FAIL | FAIL | PASS |
VERDICT: NO SURVIVOR. Not close: skipping small signals would have cost 13R of 33R and made the drawdown deeper. A2 unchanged. No tag.

## My guess against what happened
I guessed "small-gap days earn about 0.2R LESS". They earn 0.26R MORE (under 50 pips) or the same (relative version). Wrong direction. The January finding
("the skipped days were all winners") was not a January oddity: it holds in February and in March-to-now.

## What I learned
- A small 3-day gap is not a weak signal for this rule. 21 trades with a gap under 50 pips: 81% winners, +0.62R each. A plausible reason, as a guess only: a small gap
  means the last three days went nowhere, so I am not chasing an extended move; the rule's worst trades are the ones entered after a big move has already happened
  (checked after writing this, because my first draft quoted five dates "all with gaps of 150+ pips" from memory and that was WRONG:
  the gaps on my 12 full-stop days are 210, 371, 15, 142, 332, 334, 70, 159, 65, 81, 151, 80 pips - six of twelve are 142 or more, one is under 50; the median stop
  day has a gap of 147 pips against 116 for all days. A lean, not a pattern). I am NOT turning that into "skip large gaps" - that would be the mirror of a
  failed test on the same data, chosen after seeing it.
- So weakness 4 of the April review was not a weakness of the rule. The last four days lost 2.07R with gaps of 151, 54, 25 and 80 pips; nothing about their size
  explains it. It was a range week.
- The second time this month that the answer to "what did my recent losers have in common" is "something my winners have even more of".
- What the April review leaves as the real, untestable-for-now weaknesses: the month is one week (regime, which I cannot see in advance), and the income is small
  (size, which is capped by how badly I know my edge). Both are answered only by more live trades. I will say that in the final April review rather than invent a fifth test for it.
Counts: ideas 45, variants 122 (SG1 is a re-run of GAP50 on the full history, marked as such).

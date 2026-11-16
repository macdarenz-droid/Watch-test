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

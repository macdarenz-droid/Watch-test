# Idea WD: does A2 behave differently by weekday? PRE-REGISTERED, STRICT ABOUT SMALL SAMPLES. WRITTEN BEFORE ANY CODE
Clock Fri 2015-07-03 22:00 London (end of released data). After funded day 71 (half size from Monday, by the rule). Coach 07-03: "day-of-week. check
whether your setup behaves differently by weekday on your history, pre-register it, max 3 variants, and be strict about small samples."
July goal: a worked case before every pushed number or rule; every file write read back.

## What I have already seen (disclosed, because it is the same data)
- Idea W (March): "no Friday" - passed its build on January-February, put on a forward gate, KILLED at the gate (judged late, P10).
- Idea MO (05-18): Mondays, two variants - killed.
- The PZ review (06-24) printed winners / losers by weekday for the 64 funded days: Mon 5 / 8, Tue 6 / 7, Wed 7 / 6, Thu 7 / 5, Fri 6 / 7. Nothing in it.
So I have looked at single weekdays three times and found nothing that lasted. This test asks the general question once, properly, and then closes it.

## Why small samples are the whole problem here
129 A2 days make about 26 of each weekday. One weekday's average R is known to about 1.05 / sqrt(26) = 0.21R. Five such averages will differ by chance:
the gap between the best and the worst of five noisy averages is typically about 0.5R when there is NO weekday effect at all. Picking the best or
worst day afterwards and testing it against the rest is how weekday "edges" are made. So:
- ONE statistic per variant, covering all five days at once: the spread of the five weekday averages (largest minus smallest).
- Its chance level by re-dealing the weekday labels 20,000 times over the same days (a permutation test). No pairwise looks, no "Fridays against the rest".

## HYPOTHESIS: A2's result depends on the weekday
Variants (3) = three things that could depend on it, all days to END 2015-07-04, costs on:
- WD1: A2's R per day.   WD2: the side advantage per day (my side minus the other side; idea CO's control).   WD3: the full-stop rate.
Kill lines (the claim "the weekday matters"; one failure kills it):
- K1: WD1's spread has permutation p < 0.05.
- K2: the best and the worst weekday by A2's average R are the SAME two days in the first half of the history and in the second half.
- K3 sample: every weekday has at least 20 days.
- K4 three looks: the smallest of the three p values is under 0.017.
Worked case for the lines: averages Mon +0.05, Tue +0.30, Wed +0.45, Thu +0.35, Fri +0.10 -> spread 0.40R -> by the arithmetic above that is
ordinary for five noisy averages -> p around 0.5 -> K1 FAILS. To pass, the spread has to be about 0.9R or more (for instance one weekday at -0.3R
and another at +0.6R), and then K2 asks whether the same two days hold the ends in both halves.
What each outcome means: KILLED -> weekday is closed for good; no weekday note in the call. SURVIVES -> a count in the call for the two extreme days,
judged again on the next 100 forward days; never a skip (BD: a skipped day costs 2.2R on average) and never a size change.
Worked expectation: spread of A2's weekday averages between 0.3R and 0.6R, p between 0.3 and 0.8; the best and worst days differ between the halves.
KILLED on K1, K2 and K4.
Counts when run: idea 97, variants 271-273.

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

## Mechanics check (kill lines pushed first in commit bb03eeb)
The spread function by hand on ten made-up days (Mon 0.5, Tue -1.0, Wed 0.75, Thu 0.5, Fri 1.0 -> 2.0): the script printed 2.0 before the run.
My side against the engine's A2: largest difference per day 0.000R on 129 days. Days per weekday: Mon 25, Tue 26, Wed 26, Thu 26, Fri 26.

## RESULTS (one run: `python bt/weekday.py 2015-07-04`; 20,000 re-dealings of the weekday labels; figures copied from the print)
| variant | Mon | Tue | Wed | Thu | Fri | spread | typical spread with NO weekday effect | permutation p |
|---|---|---|---|---|---|---|---|---|
| WD1 A2's R a day | -0.074 | +0.518 | +0.277 | +0.272 | +0.206 | 0.593R | 0.473R | 0.2669 |
| WD2 side advantage a day | -0.077 | +0.844 | +0.705 | +0.696 | +0.228 | 0.921R | 0.821R | 0.3383 |
| WD3 full-stop rate | 44.0% | 19.2% | 15.4% | 19.2% | 26.9% | 28.6 points | 19.2 points | 0.1118 |
A2's R by weekday, first half: Mon +0.28, Tue +0.79, Wed +0.57, Thu +0.32, Fri +0.50 (best Tue, worst Mon); second half: Mon -0.40, Tue +0.24,
Wed -0.01, Thu +0.23, Fri -0.09 (best Tue, worst Mon).
| line | result |
|---|---|
| K1 WD1 spread p < 0.05 | FAIL (0.27) |
| K2 same best and same worst weekday in both halves | PASS (Tuesday best, Monday worst, both halves) |
| K3 at least 20 days per weekday | PASS (25-26) |
| K4 smallest p under 0.017 | FAIL (0.11) |
VERDICT: the claim "the weekday matters" is KILLED on K1 and K4. Weekday is closed; no weekday note in the call.

## Expectation against the run
Spread "between 0.3R and 0.6R": 0.59R. p "between 0.3 and 0.8": 0.27, just under my range. "The best and worst days differ between the halves": WRONG -
they are the same two days in both halves.

## Strict about the small sample - including about the part that tempts me
- The five averages differ by 0.59R; five weekdays with no effect at all differ by 0.47R on these very days. One time in four chance alone does better
  than what I see. That is the answer.
- The tempting part: Monday is the worst day in BOTH halves and has 44% full stops against 15-27% on the other days. I say plainly what that is worth:
  (1) K2 was a line the claim had to pass, not evidence for it: "same best and same worst in both halves" happens by chance one time in twenty
  (1/5 x 1/4), and I ran three variants. (2) Monday is 25 days: 11 full stops against about 6 expected - five mornings. (3) I have looked at Mondays
  before (idea MO, 05-18) and killed it; a weekday I keep coming back to is a weekday I have chosen. (4) What would I do with it? Skip Mondays: BD says
  one day in eight is a best day and nothing at 08:00 tells me which; 06-15, a Monday, was the first of five winning days.
  So Monday is written here as an observation with its numbers and is NOT carried as a count, a paper line or a thought at 07:00 on Monday morning -
  which matters this particular weekend, because Monday is my first half-size day and I would like a reason to be glad of it.
- Weekday has now been asked three ways (Friday, Monday, all five at once). Closed for good unless the coach reopens it with more data: at 26 days a
  weekday this test can only see a spread of about 0.9R; a real effect of 0.3R would need roughly four times the history.
Counts: ideas 97, variants 273 (WD1, WD2, WD3). Adopted trading ideas: 0. July: numbers corrected after a push: 1 (07-03, a unit); file errors found late: 0.

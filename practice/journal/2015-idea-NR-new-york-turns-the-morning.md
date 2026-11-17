# Idea NR: New York turns the London morning (idea 129; coach 08-12: best idea, hypothesis + kill line + min sample first)
Written Wed 2015-08-12 evening (clock Wed 08-12 22:00 London; no new day yet), before any count or outcome.

## Why this is my best idea now (searched first)
Two old notes of mine point the same way and were never tested as a rule: (03-xx review) "the afternoon went against me"; (05-xx, BX)
"6 of 8 BX losers were breaks against the morning; base rate 57%" - i.e. on 57% of days the early-afternoon box broke AGAINST the
morning's direction. Searched STATE.md for "fade the morning", "against the morning", "morning move", "13:00 fade": nothing else.
Windows already tested and not this one: 10:00-12:00 (MF), 12:00-17:00 boxes (BX), 13:30 with the 3-day direction (AF), 16:00-17:00 (FX),
17:00-21:00 (EV, EF). NR asks one new thing: does the New York session take back the London morning's move?
Against it: AF (13:30 in the 3-day direction, 75 trades) lost -0.11R; if mornings usually go with the 3-day direction, that already
hints the afternoon goes against both. Same shape, so I expect NR to show the 04-07 split like everything else.

## Rule (London time, one trade a day)
Morning move = open of the 13:00 candle minus open of the 08:00 candle. If |move| >= N pips: at 13:00 market order AGAINST it, stop 30,
out 17:00.
## Order of work: step 1 counts only for N = 20, 30, 40; step 2 N = the LARGEST grid value with 120+ trades and 50+ from 04-07 (none ->
killed for sample, no outcome); step 3 one run.
THE THREE VARIANTS (named now): NR1 (judged) the chosen N; NR2 (dose) the next larger N on the grid (or 50 if the chosen is 40);
NR0 (control) NR1's days traded WITH the morning.
## Kill lines (four, all must pass, for NR1)
K1 average >= +0.10R after costs (1.0 + 0.1). K2 net above zero before 04-07 AND from 04-07. K3 stressed (2.0 + 0.5) average above zero.
K4 NR1 minus NR0 above zero, sign-flip p < 0.05.
My guess: positive after 04-07, negative before (K2 fails).

## Step 1, counts only (tool `python bt/ny_turn.py 2015-08-13 count`)
159 days (01-02..08-12); median |morning move| 33.4 pips. N = 20: 102 days (45 before 04-07, 57 from). N = 30: 85 (37 / 48). N = 40: 72 (30 / 42).
## Step 2: no grid value meets 120+ trades. KILLED FOR SAMPLE, `test` NOT run, outcomes unseen.
A STRUCTURAL FACT I SHOULD HAVE SEEN BEFORE THE LAST TWO PRE-REGISTRATIONS: the history holds 159 weekdays. A once-a-day setup reaches
120 trades only if its condition holds on 75% of days or more. GC2 and NR (and GC) all needed a move of some size, so all failed the
count. My 120 line (set after FD) therefore rules out almost every once-a-day idea with a condition, on this history. Two honest ways
on, for my coach to choose; I change nothing myself:
 (a) keep 120 and test only setups that can trade several times a day (SF, RT, DT, MB2 were of that kind; all killed on outcomes); or
 (b) allow once-a-day ideas at 80+ trades with the weaker power stated in each file (about +-0.22R; a no-edge rule clears +0.10R about
     one time in four), knowing a pass there is weak evidence and could only lead to a forward count, never to route C directly.
Counts: idea 129 (killed for sample); variants none run.

## CORRECTION, written Wed 2015-08-12 evening (found while searching for the next idea): NR WAS NOT NEW
Idea N (January, journal/2015-idea-N-second-setup.md, bt/ny_fade.py), variant N1: "fade the London morning in NY: if price moved >= 30
pips since 08:00, trade against it, 13:00-17:00": Jan 15 trades +0.42R, Feb 9 trades +0.43R; failed independence from A2 (correlation
+0.31); not adopted. NR is that idea with a different stop and a counted threshold. My search for NR used "fade the morning" and "against
the morning" and missed the wording "Fade the London morning". No outcome of NR was run, so no number is wrong; the claim "never tested
as a rule" in NR's file was wrong. NR's count stays as idea 129 (it was registered and counted), marked here as a repeat of N.
Habit, tightened: search with SHORT key words in several forms (e.g. "fade", "morning", "NY", "13:00") and read the hits, not one phrase.

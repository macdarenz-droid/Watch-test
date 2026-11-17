# Idea GB (idea 80): the give-back after +80 pips - build on all history first, then a forward judging rule - PRE-REGISTRATION with worked cases
(pushed before any run of it)
Sim clock Fri 2015-06-12 01:00 London. Coach 06-11: "your +80 pip giveback is now 3 cases: don't change anything live off 3, but that's your most
promising management question. write the hypothesis and kill line, test it on all your history first (max 3 variants), then judge it on forward days."
## What I already know (stated first, because it is a lot)
- TW (05-21): a trail of 40 pips once the trade is 80 pips in profit (TW3) was +1.10R ahead of A2 on all history to 05-21 with 05-19 dropped - on only
  3 changed days, none worse. I called it too thin and started a counts-only line on 05-22.
- That line so far (3 cases): 06-02 no difference; 06-04 noon better by 0.47R; 06-10 trail better by 1.29R. Net +0.82R for the trail.
- Sample: 10 of the 98 A2 trades to 05-21 ever reached +80 pips. It cannot be made bigger; it is said now.
## Hypothesis
Once a trade is 80 pips (about 2R) in profit, managing it actively earns more than holding it blind to noon.
## Variants (3; A2 unchanged until the trade has been +80 pips; costs on)
- GB1: from +80 pips the stop trails 40 pips behind the best price (= TW3, frozen since 05-21; engine trail=(80, 40)).
- GB2: take the whole position off at +80 pips (engine tp=80).
- GB3: from +80 pips the stop goes to break-even (engine be=80): never let a +2R trade become a loser.
## STAGE 1 - BUILD: all A2 days before 2015-05-22 (the day the forward count began), 05-19 dropped as TW's inspiring day. Build only kills.
WORKED CASES (June goal; python line from my own trade tables):
- 06-10 (forward, for the mechanics; A2 -0.14R): GB1 stop at 1.13465 -> +46.2 pips = +1.10R; GB2 +1.90R; GB3 out at the entry, about 0.00R.
- 06-04 (forward; A2 +2.87R): GB1 stop at 1.13398 -> +99.5 pips = +2.42R; GB2 +1.95R; GB3 unchanged +2.87R.
- 01-23 (build; A2 +4.30R, my best day): GB2 would pay about +2.0R: a cut of about 2.3R on one trade.
The script's check must show the 06-10 and 06-04 figures (to the few hundredths between my R unit and the engine's).
Kill lines of the build (each variant against A2; one failure and it is NOT carried forward):
- K1: net R at least 1.0R above A2.                              [worked: GB1 known +1.10R; GB2 loses 2.3R on 01-23 alone -> expect FAIL; GB3 unknown, near 0]
- K2 the fat tail is not for sale: no single day more than 1.0R worse than A2.   [worked: GB2 fails on 01-23]
- K3: improved days >= worsened days.
- K4 sample: at least 8 changed days.                            [worked: GB1 has 3 -> expect FAIL as a sample; said before running]
Honest expectation: no variant passes all four. If so, stage 1 ends with "no rule can be built from this history" and ONE definition is carried
forward as the question to count: the one with no K2 failure and the best net (I expect GB1).
## STAGE 2 - FORWARD JUDGING RULE (written now, cannot be moved)
- The forward set is every live trade from 05-22 that reaches +80 pips open. Today: 3 cases. The look is at 15 cases, as written on 05-21.
- At 15 cases the carried definition goes to the coach as a PROPOSAL only if: it is at least 2.0R ahead of the noon exit over the 15; better on at
  least 9 of them; still ahead without its best case; and never more than 1.0R worse on a single case. Otherwise the question is closed for good.
- Until then: nothing live changes. Three cases are three cases.
My guess = the worked expectation: GB1 fails only the sample line, GB2 fails K1 and K2, GB3 changes almost nothing; GB1 is carried forward.

## Mechanics check against the worked cases (`python bt/giveback.py 2015-06-12 --check DATE`; the engine's R unit, a few hundredths from mine)
06-10: A2 -0.14R | GB1 +1.15R (worked +1.10R) | GB2 +1.97R (worked +1.90R) | GB3 0.00R (worked about 0.00R).
06-04: A2 +2.95R | GB1 +2.48R (worked +2.42R) | GB2 +1.97R (worked +1.95R) | GB3 +2.95R (unchanged, as worked).
01-23: A2 +4.30R | GB2 +1.99R: the cut of 2.3R on my best day, as worked.

## STAGE 1 RESULTS - BUILD (run once; `python bt/giveback.py 2015-06-12`; costs on; figures copied from the print)
Build set: 97 A2 days before 05-22 without 05-19; A2 net +32.52R.
| variant | build net vs A2 | changed days | better / worse | worst single day | the changed days (A2 -> variant) |
|---|---|---|---|---|---|
| GB1 trail 40 from +80 | +1.10R | 3 | 3 (+1.10R) / 0 | none worse | 01-15 +2.08 -> +2.72; 03-11 +1.97 -> +2.01; 04-30 +1.88 -> +2.30 |
| GB2 target +80 | -2.91R | 9 | 4 (+0.39R) / 5 (-3.30R) | -2.30R (01-23) | 01-15, 01-23, 02-17, 03-06, 03-11, 03-23, 04-13, 04-17, 04-30 |
| GB3 break-even from +80 | 0.00R | 0 | 0 / 0 | - | none: in 97 days no trade that had been +80 pips ever came back to its entry |
The dropped day 05-19 (not counted): A2 +2.18R; GB1 +2.56R; GB2 +1.99R; GB3 +2.18R.

## Build kill lines
| line | GB1 | GB2 | GB3 |
|---|---|---|---|
| K1 at least +1.0R above A2 | PASS (+1.10) | FAIL (-2.91) | FAIL (0.00) |
| K2 no day more than 1.0R worse | PASS | FAIL (-2.30R on 01-23) | PASS |
| K3 improved >= worsened | PASS (3 / 0) | FAIL (4 / 5) | PASS (nothing changed) |
| K4 at least 8 changed days | FAIL (3) | PASS (9) | FAIL (0) |
STAGE 1 VERDICT: no variant passes all four lines; no rule can be built from this history. As written before the run, ONE definition is carried forward
as the question to count: GB1 (no fat-tail failure, the best net). GB2 is dead - a target sells the tail (01-23). GB3 is dead as a rule and alive as
a fact: until 06-10 a trade that had been +80 pips had NEVER come back to its entry. Yesterday's -0.14R was the first of its kind in 112 days.

## The forward cases so far (printed beside, NOT judged - stage 2 looks at 15)
From 05-22: 3 trades have reached +80 pips. GB1 against the noon exit: 06-02 no difference (+1.55R both); 06-04 -0.47R (+2.48R against +2.95R);
06-10 +1.29R (+1.15R against -0.14R). Net +0.83R on the engine (my counts-only line says +0.82R in the as-traded unit).
For the record only: GB2 (dead) would stand at +1.55R on the same three, all of it 06-10.

## Worked expectation against the run
"GB1 fails only the sample line, GB2 fails K1 and K2, GB3 changes almost nothing; GB1 is carried forward." Exactly that (GB2 also failed K3).
It was not a hard forecast: I knew GB1's build figure from TW. The new facts are GB2's nine days and GB3's zero.

## What I take from it
- The coach is right that this is my most promising management question, and the build says precisely how promising: a wide trail has been better on
  5 of the 6 changed trades it has ever touched (3 build, 05-19, 06-10; worse on 06-04), for about +2.3R in total over five months. Not a single
  day of real damage. And six trades.
- What makes it different from every killed exit: it only acts after the trade is already +2R, so it never touches the ordinary winners (the partial's
  disease) and never the losers (the close-stop's). What keeps it out of the rule: a sample that cannot be argued with.
- STAGE 2, as written before the run and unchanged: the forward count at 15 cases; a proposal to the coach only if GB1 is at least 2.0R ahead of
  noon over the 15, better on at least 9, still ahead without its best case, never more than 1.0R worse on one case. At the present rate (3 cases in
  14 trading days - a wide-range stretch; 10 in the 98 days before) that is two to eight months away. Nothing live changes before then.
Counts: ideas 80, variants 225 (GB1 = TW3 re-run, GB2, GB3). Adopted trading ideas: 0. On paper: UN3, PH2, MB1. Forward count with a written judging
rule: GB1 (3 of 15). Numbers or rules corrected after a push in June: 0.

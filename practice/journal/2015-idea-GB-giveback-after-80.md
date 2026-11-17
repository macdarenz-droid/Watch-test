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

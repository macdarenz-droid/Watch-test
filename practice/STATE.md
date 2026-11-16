# STATE

| Field | Value |
|---|---|
| Sim clock | Tue 2015-03-10 00:00 UTC (END OF RELEASED DATA; one day at a time - each finished backtest test earns the next day) |
| Phase | Challenge #1: PHASE 1 PASSED Fri 2015-03-06 (39 trades, $27,083.04 = +8.33%). PHASE 2 ACTIVE: balance $24,811.53 (-0.75%), target $26,250, 1 trading day (min 5), brakes at $24,000 / $23,500, max loss line $22,500 |
| Current strategy | Rule A2 "London trend": 07:00 UTC write call; trend = yesterday's 22:00 close vs close 3 trading days earlier; 08:00 market order with trend; SL 40 pips; close 12:00 UTC; 1 trade/day; flat at weekend |
| Risk | PHASE 2 (journal/PLAN-v2-phase-handling.md): $187.50 = 0.75% per trade (0.47 lots x 40 pips; `python trade_a.py sell/buy --risk 187.5`), 1 trade/day (worst day -0.77%); brakes: balance <= $24,000 -> back to 0.5% ($125); <= $23,500 -> stop and review; target hit before 5 trading days -> 0.01 lots until 5 logged; finishing size 0.10 lots when the target is within $47 |
| Ideas tried | 15 (A London trend-follow, B Asia-range breakout with trend, C yesterday-midpoint filter [dropped], D pullback-day filter, E 30 pip stop, H no-chase filter [killed], F efficiency regime [not adopted], G don't-fight-the-first-break [killed], T one-hour check exit [killed], K first-break direction [killed], L lookback 2/5/10 [no improvement; A2 robust], W no-Friday [pending forward test], X exits: break-even / runner / target [no survivor], R regime detectors [no survivor], Q dead-Asia filter [Q3 killed on Feb check]) |
| Variants tested | 32 (A1 A2 A3, B1 B2 B3, C1, D1, E1, DE, H1 H2 H3, F1, G1, T1 T2, K1 K2, L1 L2 L3, W1, X1 X2 X3, R1 R2 R3, Q1 Q2 Q3). A and B at the 3-variant cap; review round used its 3 |
| Challenge attempts | 1 (active) |
| Last updated (real date) | 2026-11-16 |

## Results (costs on: 1.0 pip spread + 0.1 slippage)
| Period | Trades | Win rate | Avg R | Net R | Max drawdown | Notes |
|---|---|---|---|---|---|---|
| LIVE Jan (01-12..01-30) A2 | 14 | 71% | +0.72 | +10.04 (+$1,257) | 1.33R | one big downtrend; 2 shock-day trades = +6.3R |
| LIVE Feb (02-02..02-27) A2 | 20 | 55% | +0.23 | +4.64 (+$580) | 1.86R | box market; one coin-flip day = +2.14R |
| LIVE total Jan-Feb | 34 | 62% | +0.43 | +14.69 (+$1,836) | 1.86R | |
| LIVE March = FORWARD TALLY (unseen data, from 03-02) A2, in R = result / amount risked | 6 | 67% | +0.40 | +2.43 | 1.01R | 03-02 -1.00 (valid), 03-03 +1.12, 03-04 +1.17, 03-05 +0.02, 03-06 +2.12 (phase 1 passed), 03-09 -1.01 (phase 2 day 1, valid setup, market disagreed; stop missed by 2.4 pips). A2 forward kill test: 6 of 40. F1 tag identical. Friday tag 1/8: +2.12R |
| Backtest Feb only (out-of-sample) A1 / A2 / A3 | 20 each | 50 / 55 / 40% | +0.18 / +0.23 / +0.00 | +3.60 / +4.64 / +0.10 | 2.2 / 1.9 / 3.1R | A2 = live exactly |
| Backtest Feb only B1 / B2 / B3 | 13 / 14 / 13 | 54 / 57 / 54% | +0.32 / +0.34 / +0.23 | +4.10 / +4.79 / +2.98 | 1.1 / 1.7 / 1.0R | |
| Backtest Feb only C1 (A2 + midpoint filter) | 13 | 38% | -0.08 | -1.04 | 1.5R | skipped 7 trades worth +5.68R: failing |
| Backtest Jan+Feb A1 / A2 / A3 | 39 each | 59 / 64 / 46% | +0.37 / +0.50 / +0.15 | +14.24 / +19.43 / +5.88 | 3.7 / 1.9 / 4.2R | Jan part is in-sample |
| Backtest Jan+Feb B1 / B2 / B3 | 26 / 27 / 26 | 62 / 59 / 65% | +0.54 / +0.43 / +0.44 | +14.02 / +11.69 / +11.35 | 2.6 / 2.1 / 1.4R | Jan part is in-sample |
| Backtest Jan+Feb D1 (A2 only after a pullback day) | 14 | 71% | +0.55 | +7.72 | 1.38R | Jan +0.62 (5), Feb +0.51 (9); skips Jan trend days |
| Backtest Jan+Feb E1 (A2, SL 30) | 39 | 64% | +0.61 | +23.72 | 2.91R | gain is all Jan; Feb +0.20; stop fitted in-sample |
| Backtest Jan+Feb DE (D1 + E1) | 14 | 71% | +0.75 | +10.51 | 1.54R | best avg R, 14 trades, in-sample |
| Backtest Jan+Feb C1 | 25 | 56% | +0.40 | +10.09 | 1.5R | |
(Jan-only backtest numbers recorded earlier were made before a Sunday-candle bug fix in bt/ideas.py; the Jan+Feb rows above are the corrected ones.)

## Honest read
- Jan = trend month, rule paid +0.72R/trade. Feb = box month, +0.23R/trade and most of that is one coin-flip trade. Real edge is unknown and may be ~0 outside trends.
- Feb was a true out-of-sample month for A and B: all positive, none convincingly. 20 trades is far too few.
- My by-eye replay idea (C) is failing its first test. My discretion still has no proven value; I followed the rule 20/20 in Feb.
- Phase 1 is 1.3R from done, built mostly on January. Passing it would not prove the rule works.

## Review round (journal/2015-review-jan-feb.md)
- Losers share: 9 of 13 came the day after a move already in my direction, 10 of 13 entered in the far half of yesterday's range (chasing, mostly buys at the box top). Only 3 hit the full stop.
- Verdict: D1 / E1 / DE are NOT a genuine improvement (tiny samples, in-sample, D halves net R, E raises drawdown). Traded rule stays A2.

## Jan (in-sample) vs Feb (out-of-sample), frozen A and B, avg R: A1 +0.56 -> +0.18 | A2 +0.78 -> +0.23 | A3 +0.30 -> 0.00 | B1 +0.76 -> +0.32 | B2 +0.53 -> +0.34 | B3 +0.64 -> +0.23
- None negative, all lost 36-100% of the edge. Cause seen on charts: Jan = trend (08-12 drift with signal +34 pips, 79% right), Feb = box (+11 pips, 55%). Full table: journal/2015-review-jan-feb.md section 7. Nothing changed.

## Idea H "no chase" (journal/2015-idea-H-no-chase.md; hypothesis + kill test committed before the run)
- Build on Jan: all three thresholds FAILED (kept avg R +0.48..+0.58 vs A2 +0.78; the skipped "chasing" trades were Jan's best). Feb check of H1 only: +0.50 avg (10 trades) vs A2 +0.23 (20), passes the Feb test.
- Verdict: killed by the build rule; Feb was not truly unseen. Finding: "don't chase" helps in a box and hurts in a trend. Traded rule stays A2.

## Audit (journal/2015-audit-feb-and-next-hypothesis.md)
- Feb is NOT unused: clean only for the live trades, frozen A/B and C1. D, E, H are in-sample on both months. H2/H3 were run on Feb by my own scripting error (recorded). No unseen data is left.
- All 13 live losses tagged: 13 "valid setup, market disagreed", 0 "my mistake" (34/34 trades followed every execution rule). One real mistake: the 01-22 skip.
- Idea F1 (5-day efficiency >= 0.5 -> A2 every day, else A2 + no-chase 0.6) RUN once: gate 1 pass (Jan 67% straight, Feb 85% crooked). Jan build +0.84R (13) vs A2 +0.75R (15); Feb (contaminated) +0.37R (12) vs +0.23R (20); both months net R 15.42 vs 15.87, max DD 1.50R vs 1.86R. Skipped trades averaged ~0. NOT adopted; paper tag only for gate 2.

## Idea G (journal/2015-replay-worst-days-and-idea-G.md; replay of #6 01-19 and #29 02-20, hypothesis + kill test committed before the run)
- G1 = A2, skip when 07:00-08:00 broke the Asia range against my direction. Jan build: +0.80R (13) vs A2 +0.78R (19); without the inspiring day 01-19: +0.80 vs +0.88 -> FAIL.
  Feb (contaminated): +0.36R (14) vs +0.23R (20); without 02-20: +0.36 vs +0.30, skipped trades +0.12R -> FAIL. Killed. The gain was only the two days it was built from.
- Method rule kept: any idea born from a replay is judged with its inspiring day(s) removed. Use bt/ab.py VARIANT START END [--drop=DATE] to run one variant on one month only.

## Idea T (journal/2015-winners-review-and-idea-T.md; review of 5 biggest winners, hypothesis + kill test committed before the run)
- Winners share: tiny adverse move (0-15 pips), in profit within the first hour, quiet Asia shelf before. Idea T = close at 09:00 if not working.
- T1 (below zero): Jan +0.66R vs A2 +0.78R, FAIL. T2 (worse than -10 pips): Jan +0.78 vs +0.78, FAIL; Feb (contaminated, T2 only) +0.25 vs +0.23, FAIL. Killed. 09:00 state does not predict 09-12.
- Use bt/ab_exit.py VARIANTS START END for exit variants (one month at a time).

## Challenge arithmetic (bt/pass_math.py, journal/PLAN-v2.md)
- +8% = 16R at 0.5%. Needed: 1 month +0.80R/trade (87% wins at my payoff), 2 months +0.40R (60%). Have: live +0.43R (62%), Jan +0.72R (71%), Feb out-of-sample +0.23R (55%).
- Bootstrap pass odds for phase 1 on a Feb-sized edge: 0.5% risk 9% in 2 months / 69% in 4; 0.75% risk 42% / 91%; breach ~0%. With zero edge at 0.75%: breach 0.2% in 2 months.
- Plan v2: rule A2 unchanged; risk 0.75% from phase 2 with brakes; rule-level kill test (next 40 unseen trades avg < +0.10R or drawdown > 8R -> stop trading it for money).

## Idea K (journal/2015-idea-K-direction.md; weakest part of plan v2 = direction signal; hypothesis + kill test committed before the run)
- K = take the side of the first break of the Asia range instead of the 3-day trend. Jan build: K1 +0.12R, K2 +0.20R vs A2 +0.78R -> FAIL. Feb (contaminated, K2 only): +0.08R vs +0.23R -> FAIL. Killed.
- Finding: the 3-day trend direction beats the raw break in both months; it stays. Use bt/ab_rule.py VARIANTS START END [--drop=DATE] for rules with their own entries.

## Risk math (bt/risk_math.py, journal/2015-risk-math.md)
- Replay of my 34 real trades: final +7.35 / +11.02 / +14.69 / +22.04% at 0.5 / 0.75 / 1 / 1.5%; worst day -0.51 / -0.77 / -1.02 / -1.54%; max DD incl. floating 1.02 / 1.53 / 2.04 / 3.05%.
- At a Feb-sized edge (+0.23R, 95% range -0.10..+0.56) +8% takes ~69 / 46 / 35 / 23 trades. If the edge is really -0.10R, 2-month breach chance is 0 / 2.4 / 12.7 / 38%.
- Chosen: 0.75% (cushion over speed): ~2.3 months at +0.23R. 1.0% is the smallest size that makes 2 months on expectation but its safety depends on an edge I cannot prove.
- Correction: live max closed drawdown is 1.86R (3 losses, 02-18..02-20), not 2.17R as I wrote in W08/W09 (I had added four losers that were not consecutive).

## Loss tags and next change (journal/2015-loss-tags-and-next-change.md)
- 13 losses: 13 "valid setup, market disagreed" (-6.03R), 0 "my mistake". No pattern lost in BOTH months -> no rule change allowed; plan v2 stands.
- Only repeat-loss group: Fridays (last 5 in a row lost, -1.80R; but Jan Fridays +5.35R). Next change to test = "no Friday trade" (idea W, would be variant 20): WRITTEN, NOT RUN.
  Forward-only kill test on 8 unseen Fridays (net <= 0R, >= 5 losers, Mon-Thu avg > 0, still <= 0 without the worst Friday). Not testable on Jan-Feb (result already known from my trade list).

## Idea L (journal/2015-idea-L-lookback.md; pre-registered, earned the next day)
- Lookback 2 / 5 / 10 instead of 3. Jan build: +0.49 / +0.49 / +0.03R vs A2 +0.75R on the same days -> no candidate, improvement dead.
- Robustness test PASS: neighbours 2 and 5 positive in both months (Feb +0.14 / +0.26R vs A2 +0.23R). 10-day lookback fails both months (+0.03 / -0.14R). Edge = short-term direction. Rule unchanged.
- Use bt/ab_same.py VARIANTS START END (always END <= 2015-03-01 for Jan-Feb work: history now contains March days).

## Idea W "no Friday" (journal/2015-loss-tags-and-next-change.md, results section)
- Jan-Feb table (in-sample both months): Jan W1 +0.66R (15) vs A2 +0.78R (19), skipped Fridays +4.92R; Feb (contaminated) W1 +0.40R (16) vs +0.23R (20), skipped Fridays -1.78R. As predicted; no evidence.
- Kill test as written is forward-only: 8 unseen Fridays. Status 0/8 -> PENDING, not adopted, not killed. A2 trades Fridays for real meanwhile.

## Idea X exits (journal/2015-idea-X-exits.md; pre-registered)
- X1 break-even after +20 pips: Jan +0.70R, Feb +0.25R. X2 runner (>= +40 pips at noon holds to 16:00): Jan +0.81R, Feb +0.09R. X3 target +60 pips: Jan +0.64R, Feb +0.24R. A2: +0.78 / +0.23R.
- No variant clears the January build (+0.05R needed). Each helps one month and hurts the other. Exit unchanged: stop 40, out 12:00.

## Idea R regime detectors (journal/2015-idea-R-regime.md; pre-registered)
- R1 new 5-day closing extreme, R2 yesterday's range >= 5-day average, R3 A2's last 5 trades net > 0. None recognises the months (TREND share Jan/Feb: 44/30, 47/45, 100/85%).
- January build: no survivor (R1 gap +0.03R; R2 +0.44R but -0.11R without 01-23; R3 no BOX days). Feb: R1 and R3 wrong sign. Conclusion: regime is not readable from simple daily numbers at 07:00; plan v2 does not depend on it.

## Idea Q dead-Asia filter (journal/2015-idea-Q-asia-life.md; all 39 A2 trades reviewed on M15 cut at the entry, bt/entry_charts.py; pre-registered)
- Skip A2 when the Asia range is dead: Q1 < 20 pips, Q2 < 25 pips, Q3 < 0.8 x its 5-day average. Jan build: Q1 skips 0, Q2 skips 2 (fail); Q3 survives (+1.14R on 10 vs A2 +0.71R on 14).
- Feb check (contaminated): Q3 +0.46R on 9 vs A2 +0.23R on 20, drawdown 0.65R vs 1.86R, but skipped trades +0.05R (needed <= 0) and keeps only 45% (needed 60%) -> KILLED. Net R not higher.
- Pattern noted (F1, W, Q): these filters remove zero-ish trades - same total, fewer trades, smaller drawdown. Not an improvement in profit.

## Phase 2 size test (bt/phase2_sim.py, journal/2015-phase2-size-test.md; decision rule committed before the run)
- 20,000 reshuffles of my own results, brakes on. At 0.75%: all-40-trades edge -> pass 69% in 20 days / 97% in 40, median 15 days; Feb edge -> 30% / 77%, median 26; zero edge -> 13% pass, 3% brake-stop in 40 days; no true breach in any picture with brakes (1.2% at zero edge without them).
- From today (-0.75%): Feb edge 69% within 40 days, median 30 days. Rule applied: no cut, no raise (1.00% adds only +10 points; forward test 6/40) -> KEEP 0.75% with brakes. Re-run at 20 and 40 forward trades.

## Loss tags (running count, all live trades): valid setup, market disagreed 15 (-8.04R) | my mistake 0.

## Next step
1. Day 03-09 traded (phase 2 day 1, -1.01R); size test finished (keep 0.75%). When the next day (Tue 03-10) is released: `git fetch origin main && git merge --no-edit FETCH_HEAD`; `./look.sh 3 0 9`; write the call in journal/2015-W11.md;
   `python trade_a.py sell|buy` (A2; PHASE 2 sizing `--risk 187.5` = 0.47 lots; check `python sim.py account` and the brakes before sizing); tag any loss; paper-tag F1 and Fridays (idea W).
2. Keep backtesting on Jan-Feb only (never load March into a test: pass END <= 2015-03-01). Each test: hypothesis + kill test committed first, max 3 variants, counted, February labelled contaminated.
3. Open idea: trend vs box before 08:00. Forward tests running (tally table at the end of journal/2015-W11.md): A2 kill test (6/40 trades, +2.43R), F1 paper tag (6 days, same), Friday tag (1/8: +2.12R).
Tools: look.sh, trade_a.py, bt/ab.py (filters), bt/ab_exit.py (exits), bt/ab_rule.py and bt/ab_same.py (own entries/direction), bt/pass_math.py, bt/risk_math.py, bt/review.py, bt/loser_charts.py. Tests: `python -m pytest -q`.

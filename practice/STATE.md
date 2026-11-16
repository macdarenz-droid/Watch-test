# STATE

| Field | Value |
|---|---|
| Sim clock | Fri 2015-04-17 21:00 UTC = 22:00 London, weekend (END OF RELEASED DATA; one live day at a time until ~Mar 2017; quality over speed: one honest piece of work earns the next day). London on summer time (UTC+1) |
| Phase | FUNDED ACCOUNT ($25k FundedNext) since Fri 2015-03-27 - see FUNDED SCOREBOARD below. Sim label "challenge #3" = the funded account; MY tracker is journal/FUNDED-TRACKER.md; this week's journal journal/2015-W16-funded.md |
| Current strategy | Rule A2 unchanged, IN LONDON TIME (decision 2015-03-30, journal/2015-W14-funded.md; confirmed by the clock-shift test): 07:00 London call; trend = last 22:00 London close vs the close 3 trading days earlier; 08:00 London market order; SL 40 pips; close 12:00 London; 1 trade/day, no skips. In UTC during summer time: call 06:00, entry 07:00, exit 11:00. FUNDED PLAN: journal/FUNDED-PLAN.md |
| Risk | FUNDED: 0.50% = $125 = 0.31 lots. COMMANDS: `python sim.py advance --until DATE T06:00` (= 07:00 London in summer time; T07:00 in winter), `./look.sh 3 0 9`, WRITE THE CALL (before 08:00 London, or no trade that day), then `python trade_a.py buy/sell --risk 125 --london` (08:00 -> 12:00 London, converted automatically). Funded brakes: 3% below high-water (or <= $24,250) -> 0.25% (`--risk 62.5`); 5% below (or <= $23,750) -> STOP + review. Payouts every 14 days: half of profit above $25,000 until a $1,000 buffer, then all above $26,000; none while a brake is on |
| Ideas tried | 41 (A London trend-follow, B Asia-range breakout with trend, C yesterday-midpoint filter [dropped], D pullback-day filter, E 30 pip stop, H no-chase filter [killed], F efficiency regime [not adopted], G don't-fight-the-first-break [killed], T one-hour check exit [killed], K first-break direction [killed], L lookback 2/5/10 [no improvement; A2 robust], W no-Friday [pending forward test], X exits: break-even / runner / target [no survivor], R regime detectors [no survivor], Q dead-Asia filter [Q3 killed on Feb check], M ignition-candle setup [no survivor], DD drawdown-goal re-scoring [Q3, Q1 to forward tag; F1 fails], N NY-fades-London second setup [N1 profitable both months, fails independence by 0.01; forward paper tag], Z bank-at-the-wall take-profit [almost never fires; closed], Y week-open side / Monday range [Y3 survives Jan, killed on Feb], V stop/size by volatility [no survivor; worse in Feb], E-time exit hour 10/11/13 [noon best in Jan, Feb and clean March], S wider stop 50/60/80 [no survivor; loses 14-53% of net R], clock shift +1h/-1h/late entry [08:00-12:00 London is the peak in Jan and clean March], NM night-must-agree filter [no survivor on the January build; backwards], LE limit entry instead of market [no survivor: higher win rate, lower profit], FR robustness of F1's two numbers [F1 NOT robust], TR trailing stops [no survivor: -2.2R to -6.2R in January], GAP skip small 3-day gaps [no survivor: the skipped days were all winners], SS structure stops behind the night's extreme [no survivor: more R but 2-4x the drawdown = leverage], SO scale-out half at +40/+20 [no survivor: 65-78% of the profit, same drawdown], RN round numbers ahead [no survivor; "00" levels were winners; 50-level version one trade short and inside noise], RF range-fade second setup [no survivor: -0.5R per trade, even in February], FL flip days of the trend signal [no survivor: flip days earn about the same as other days; recent streak only], FH first-hour shape exit at 09:00 [no survivor: weak starters earn +0.08 to +0.33R from 09:00 to 12:00; it is idea T again], RS funded risk size 0.5/1.0/1.5% [no size passes all five lines; 0.50% stays; 1.0% breaches 1 run in 10 at the planning edge], RV yesterday-closed-against-me / rejection day [no survivor: those days earn +0.60R, above average; rejection day = 6 cases, parked], PM partial at +1R / break-even on ALL history [no survivor: 83-85% of net R, same drawdown; BE-only deepens the worst stretch], AD add at +1R [no survivor: +1% to +11% net R but drawdown 2.3-3.3R vs 2.0R and worst 10 days twice as deep], CS stop on a candle close [no survivor: 0 of 7 clean stop-outs were wicks; losses get bigger], SD two-sided check [hypothesis SURVIVES: buys +0.24R (27), sells +0.61R (47), both positive in all periods; sells-only / with-10-day-trend-only variants fail]) |
| Variants tested | 110 (105 definitions incl. SD1 SD2 SD3, CS1 CS2 CS3, AD1 AD2 AD3, PM3 new + PM1 PM2 = SO40BE SO40 re-run on all history at the coach's request, RV1 RV2 RV3, RS 0.5/1.0/1.5%, FH1 FH2 FH3, FL1 FL2 FL3, N1 N2 N3, Z1 Z2 Z3, Y1 Y2 Y3, V1 V2 V3, ET10 ET11 ET13, S50 S60 S80, CP1 CM1 C9, NM1 NM2 NM3, LE5 LE10 LE10x, FR1 FR2 FR3, TR20 TR30 TR40, GAP25 GAP50 GAPR, SSA SSH SSN, SO40 SO20 SO40BE, RN00_15 RN00_25 RN50_15, RF25 RF15 RF33:A1 A2 A3, B1 B2 B3, C1, D1, E1, DE, H1 H2 H3, F1, G1, T1 T2, K1 K2, L1 L2 L3, W1, X1 X2 X3, R1 R2 R3, Q1 Q2 Q3, M1 M2 M3) + 3 re-scored for the drawdown goal (DD1=Q3, DD2=Q1, DD3=F1). A and B at the 3-variant cap; review round used its 3 |
| Challenge attempts | #1 PASSED both phases (no breach). #2 cancelled by coach (3 trades). Now FUNDED (not an attempt) |
| Last updated (real date) | 2026-11-16 |

## FUNDED SCOREBOARD (update after every funded day; source of truth: journal/FUNDED-TRACKER.md)
| Item | Value (after funded day 16, Fri 2015-04-17) |
|---|---|
| Funded trades | 16 (10 wins, 6 valid losses) |
| Total R | +4.61R (March +0.98R in 3 trades; April +3.63R in 13 trades) |
| Balance | $25,508.71 (sim shows $25,577.53; tracker = sim - $68.82 paid out) |
| High-water mark | $25,508.71 |
| Drawdown now / deepest | 0.00% / -1.00% (first brake -3% = $24,743.45; stop -5% = $24,233.27; account line $22,500) |
| Payouts taken | 1 ($68.82 requested on Fri 2015-04-10, $55.06 mine at 80%). Next payout date Fri 2015-04-24 |
| Trade tags | 16 valid, 0 my mistake |
| Process mistakes | 3 (P1 DST slip 03-30; P2 research script touched March 04-03; P3 04-08 journal note read a UTC hour as London, found 04-17) |

## Results (costs on: 1.0 pip spread + 0.1 slippage)
| Period | Trades | Win rate | Avg R | Net R | Max drawdown | Notes |
|---|---|---|---|---|---|---|
| LIVE Jan (01-12..01-30) A2 | 14 | 71% | +0.72 | +10.04 (+$1,257) | 1.33R | one big downtrend; 2 shock-day trades = +6.3R |
| LIVE Feb (02-02..02-27) A2 | 20 | 55% | +0.23 | +4.64 (+$580) | 1.86R | box market; one coin-flip day = +2.14R |
| LIVE total Jan-Feb | 34 | 62% | +0.43 | +14.69 (+$1,836) | 1.86R | |
| LIVE = FORWARD TALLY (unseen data, from 03-02) A2, in R = result / amount risked | 28 | 68% | +0.37 | +10.28 | 2.00R | ... 04-06 +0.27 (funded 7), 04-07 -1.00 (funded 8), 04-08 -1.00 (funded 9; both valid losses, clean process). Early alarm at 40 trades (28 done); real statement at 200. Paper tags: F1 21 trades +11.26R (not robust; FR1 19 trades +7.95R); Q3 16 trades +4.25R, Q1 26 trades +8.09R |
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

## Idea M ignition candle (journal/2015-idea-M-ignition.md; study of the 5 biggest Jan-Feb days on H1; pre-registered; bt/ignite.py)
- Setup: first H1 candle 07-16 UTC closing beyond the prior day's range with body >= 40 / 60 pips, follow it (stop 40; exit 20:00 or +4h). Judged without the 5 inspiring days.
- Jan build: M1/M3 = 3 other triggers, 3 full stops (-1.01R avg); M2 = no other trigger. Feb: 2 triggers in the month. No survivor. Big days are only obvious afterwards; A2 is already in before the big hour.

## Drawdown-goal test (journal/2015-idea-DD-drawdown-goal.md; pre-registered; bt/dd_goal.py)
- Score = net R / max DD vs 10,000 random filters skipping the same number of trades (Jan+Feb). Q3 beats 99% of random (23.6 vs 90th pct 11.5), Q1 93%, F1 82% (fails).
- Q3 and Q1 survive gate 1 -> forward PAPER TAGS only (look.sh now prints the Asia line). Gate 2 after 40 unseen days: DD <= 70% of A2's, net R >= 85%, keeps >= 50%.
- First 8 forward days go against it: both skip only 03-06 (+2.12R, best day); Q tags +3.97R vs A2 +6.09R, same drawdown.

## Idea N second setup (journal/2015-idea-N-second-setup.md; from my own chart notes; pre-registered; bt/ny_fade.py)
- Fade the London morning in NY: if price moved >= X pips since 08:00, trade against it. N1 (30 pips, 13:00-17:00): Jan 15 trades +0.42R (DD 3.45R), Feb 9 trades +0.43R - passes both profit tests.
- Overlap with A2 (Jan+Feb): 40% of N1's losing days were A2 losing days (ok), correlation +0.31 (limit +0.30) -> FAILS independence. All its profit came on A2's winning days (+10.56R); -0.83R on A2's losing days.
- Not tagged, not adopted. Open question for the coach: allow a forward-only paper tag for N1?

## N1 forward paper tag (kill test at the end of journal/2015-idea-N-second-setup.md; coach approved, paper only)
- From 03-13. Judge at >= 20 N1 trades AND >= 8 A2-losing days: avg R >= +0.20R, > 0 without best trade, DD <= 4R, net >= 0R on A2's losing days, losing-day overlap <= 50%, corr <= +0.30.
- Compute each morning: `python bt/ny_fade.py 2015-03-13 2100-01-01 --overlap | grep -A1 N1`. It can never touch A2's sizing before passing plus a separate risk question.

## Cost stress test (journal/2015-cost-stress-test.md; pre-registered; bt/cost_stress.py; scenario runs, not variants)
- A2 with spread+slippage 1.5+0.3 / 2.0+0.5 / 3.0+1.0 pips: Jan +0.76 / +0.74 / +0.69R (base +0.78); Feb +0.18 / +0.16 / +0.11R (base +0.23). Positive everywhere: not a cost artifact.
- Decision rule: Feb under 2.0+0.5 = +0.156R vs line +0.15R -> plan stands, narrowly. Planning edge for a box month is now +0.18R (realistic costs), not +0.23R.

## Idea Z bank at the wall (journal/2015-replay-worst-stretch-and-idea-Z.md; M15 replay of 02-18..02-20; pre-registered)
- TP 2 pips in front of a standing N-day extreme (>= 2 days old) at least 10 pips beyond entry. Jan: Z1/Z2 never fire; Z3 (any age, control) cuts 01-23 from +4.27R to +0.69R. Feb: Z1 changes 2 trades, one is the inspiring day.
- No survivor; fires ~2 times in 39 trades = cannot be tested or matter. Habit kept: note in the 07:00 call whether a multi-day level sits inside the stop distance in front of the trade.
- US clocks changed 03-08: US data now 12:30 UTC, market closes Fri 21:00 UTC; look.sh closes line misses Fridays (use the D1 close).

## Idea Y weekly extremes (journal/2015-idea-Y-weekly-extremes.md; study of 8 weeks; pre-registered)
- Study: the end a week starts from was made on Monday 6 of 8 weeks; the other end on Friday 5 of 8; weekly lows formed in NY (after my exit) 6 of 8.
- Y1 week-open side as direction: Jan +0.69R, Feb 0.00R (fails). Y2 outside Monday's range: 7 / 5 trades (fails). Y3 A2 only when agreeing with the week-open side: Jan +1.17R on 12 (survives), Feb +0.15R on 13 with the skipped trades at +0.39R -> KILLED.
- The 3-day rule again beats an obvious alternative direction. Habit only: note the week's open and Monday's range in the 07:00 call.

## Idea V volatility (journal/2015-idea-V-volatility.md; study + pre-registered test; bt/ab_score.py)
- Study (35 days): London-morning range (mean 65 pips) is unrelated to the 5-day average daily range (corr +0.04); modest relation to yesterday's range (+0.39) and the Asia range (+0.29). A2 equally good in quiet and wild weeks.
- V1 stop = 0.30 x 5-day range, V2 stop = 0.32 x yesterday's range, V3 size by volatility; judged on net R / max DD. Jan: 1.09x / 0.69x / 1.19x of A2's score (needed 1.25x). Feb: 0.70x / 0.67x / 0.77x. No survivor.
- Fixed 40 pips and fixed size stay. Evening shocks (03-18: 400 pips after 18:00 UTC) are handled by being flat at noon, not by the stop.
- NOTE for Thu 03-19: the 3-day rule will say BUY by ~300+ pips after the spike; expect a wild market; plan is unchanged (0.47 lots, 40 pips).

## DATA STATUS (journal/2015-clean-data-and-idea-E-exit-time.md)
- January = in-sample (build only). February = contaminated (reference only, no verdicts). March lived days (03-02 onward, traded forward) = clean of builds = THE out-of-sample check.
- March check uses so far: 1 (exit time). Each use spends it for that idea. 14 trades: can reject, cannot confirm. Write hypotheses from Jan-Feb notes, not March memories.
- Run March checks with a window like `2015-03-01 2015-03-20` (END = the clock); Jan build `2015-01-01 2015-02-01`.

## Last stretch of phase 2 + exit-time test (same file; pre-registered)
- Need +3.63R: avg +0.36R over 10 trades (59% wins at my payoff) or +0.18R over 20 (47%). Reshuffle from here: Feb-sized edge 69% within 20 days, median 14; zero edge 22%; brake-stop 0-2% (18% if -0.10R).
- Exit hour 10:00 / 11:00 / 13:00 vs 12:00: Jan +0.42 / +0.62 / +0.56 vs +0.78R; clean March +0.33 / +0.34 / +0.27 vs +0.46R; Feb +0.01 / +0.15 / +0.23 vs +0.23R. No survivor: noon is best everywhere, including the clean month. Exit unchanged.

## Forward vs backtest + idea S wider stop (journal/2015-forward-vs-backtest-and-idea-S.md; bt/edge_compare.py; pre-registered)
- March forward (15) vs Jan+Feb backtest (39): win 73% vs 64%, avg R +0.50 vs +0.50, median +0.30 vs +0.31, MFE 40 vs 43 pips, MAE 16 vs 18, banked 50% vs 46% of MFE. Same edge, a blend of my two months (52nd percentile of Jan+Feb samples; 92nd vs Feb alone).
- One difference: full stops 3 of 15 (20%) vs 3 of 39 (8%), so avg loser -0.79R vs -0.46R. All six stop-outs ever: never more than 8 pips in profit, gone within ~2 hours.
- Idea S: stop 50 / 60 / 80 at the same $ risk. Jan build: 77% / 62% / 47% of A2's net R, score 0.81x / 0.68x / 0.63x -> no survivor. 40 pips is not too tight (30 was worse too). Stop unchanged.
- March check uses: 1 (exit time). March is NOT clean for idea S (it came from March trades).

## Last-stretch risk test (journal/2015-risk-for-the-last-stretch.md; decision rule committed before the run; bt/last_stretch.py)
- From +3.08% with $479 to go: finish within 10 days at a realistic February edge 23% / 44% / 57% at 0.50 / 0.75 / 1.00%; zero-edge brake chance 0.04% / 1.15% / 3.72%; no true breach anywhere. Daily stop = one trade (10-21% of the 5% limit).
- Rule as written: no size gives two weeks AND safety -> answer 0.50%; "about two weeks" was not a responsible aim. I actually carried 0.75% and finished in one trade on a +2.52R day (luck in timing).
- Carried forward: never size for a deadline; 0.50% inside the last 4R of a target; risk goes down near the target, never up.

## Start-week test (journal/2015-start-week-test.md; kill test committed before the run; bt/start_weeks.py)
- Full rulebook started on each Monday 01-05..02-23 (8 overlapping windows, data to 03-24): passed both within 1 month 0 of 8; within 2 months 0 of 4 decided (best: 44 and 45 trading days = 61 calendar days); breach 0, brake-stop 0, worst low -1.4%.
- Goal "1-2 months": FAIL (strict). Honest horizon: phase 1 5-8+ weeks, both phases 2-3.5 months. My real start (01-12) was the second-fastest of eight = calendar luck.
- My one skip (01-22) cost 12 trading days: mechanically phase 1 passes on 02-17, I passed it on 03-06. No skips, ever.

## Levers + risk-step test (journal/2015-levers-and-risk-step-test.md; decision rule committed before the run; `python bt/start_weeks.py 0.75,0.75 1.0,1.0 1.25,1.25`)
- Both phases = 26R at 0.5%, 17.3R at 0.75%, 13R at 1.0%. In 40 trades that needs +0.65 / +0.43 / +0.33R per trade; I can count on +0.18R (Feb, realistic costs) to ~+0.5R (blend). Levers: more setups (none found), bigger winners (13 exit variants failed), risk (cheapest).
- Start weeks passing both phases within 42 trading days: 0.5% 0 of 4 decided; 0.75% 2 of 4 (borderline); 1.00% 6 of 6; 1.25% 8 of 8. No breach, no brake touch, worst low -1.9% at any size. Friendly history: minimum size only, not proof of safety.
- Rule's answer: 0.75% is the smallest size that delivers; allowed only after A2's forward test passes (18/40). Attempt #2 stays at 0.5%. Coach to decide: move to 0.75% after the forward test, or keep 0.5% as the pure proof.

## Reshuffle breach test (journal/2015-reshuffle-breach-test.md; explicit kill lines K1-K3 + locks committed before the run; bt/reshuffle_breach.py)
- My list: 53 trades, worst day -1.00R, worst streak 3 trades / -1.82R. 1,000 reshuffled orders, 42 days, two phases, sizes 0.50 / 0.75 / 1.00%.
- Passed both phases: full list 24 / 783 / 979; forward-only list 409 / 862 / 955; zero-edge list 0 / 1 / 7. Breaches with brakes on: 0 everywhere. Zero-edge brake-stops 4 / 30 / 70; raw breaches without brakes 0 / 4 / 13.
- Kill lines: all three sizes alive; smallest size with >= 500 of 1,000 on the forward list = 0.75%. REHEARSAL ONLY: attempt #2 stays at 0.5% until the forward test completes, then re-run and let that run decide. If the forward test fails, size goes to 0.
- Journal hygiene: when replacing the tally in a week file use the LAST "## Forward tally" (rindex); a first-match cut on 03-25 removed a section (restored from git).

## FUNDED survival test (journal/2015-funded-survival-test.md; kill lines S1-S3 committed before the run; bt/funded_sim.py)
- 1,000 two-year reshuffles: at 0.50% my -5% stop ends trading in 0 (Feb realistic edge) / 0 (full list) / 1 (forward list) of 1,000; no breach even with brakes off on real-edge lists. Kill lines pass -> 0.50% STAYS.
- If the edge is zero: stop reached in 655 of 1,000 (median day 231), breach 0 with brakes but 341 without; at -0.10R the stop comes after ~108 days. Worst case of the plan = lose 5% and stop; only if I obey the brake.
- Expected over 2 years at 0.50%: my 80% is about $8,800 (Feb realistic edge) to about $22,000 (blend); about 1 losing month in 8 at the Feb edge.

## Clock decision + clock-shift test (journal/2015-W14-funded.md, journal/2015-clock-shift-test.md; kill lines committed before the run)
- London went to summer time 03-29. Decision before trading: the rule is in LONDON time (same moment of the day as all earlier trades). CONFIRMED by coach 03-31: London time consistently from now on; call always written before the entry bar opens; the 03-30 DST slip is PROCESS mistake P1 (not a trade mistake), logged in FUNDED-TRACKER.
- Test on winter data: shifting the window +1h (09-13 London = "stay on UTC") gives Jan +0.36R vs +0.78R and clean March +0.25R vs +0.51R -> K3: the 08-12 London window is the peak; London-time reading necessary. -1h and late-entry are worse too.
- Tools: bt/ideas.py relabels candles to London wall-clock (winter results identical); look.sh prints 22:00 London closes with the gap and side. March check uses: 2.

## Best 5 vs worst 5 + idea NM (journal/2015-best-worst-and-idea-NM.md; bt/best_worst.py, bt/ab_drop.py; kill lines committed before the run)
- Best and worst trades look alike at 08:00 on everything measurable; they separate in the first hour after entry (already tested twice, T1/T2: failed). One at-entry difference in the ten: the 00:00->08:00 move.
- NM: skip A2 when the night moved against my side (any / 15+ pips / require 5+ with). January build without the inspiring days: no survivor; NM2's skipped trades were 6 winners of 6 (+0.99R). Backwards. March NOT run (uses stay 2).
- Method rule added: before pre-registering anything from "best N vs worst N", state the feature and count it on ALL build-month trades first.

## Idea LE limit entry (journal/2015-idea-LE-limit-entry.md; kill lines committed before the run; bt/limit_entry.py)
- Limit 5 / 10 pips better than the 08:00 London price (fallback market at 08:30, or no trade). January build: net R 13.52 / 13.81 / 8.44 vs A2 14.89; win rate up to 79% but profit down. No survivor. March NOT run (clean-month uses stay 2). Entry stays a market order at 08:00 London.

## F1 robustness test (journal/2015-idea-FR-robustness.md; kill lines committed before the run)
- F1 was my most promising idea (forward 18 trades +12.42R, DD 1.01R vs A2 22 trades +12.10R, DD 1.50R). Neighbours: FR1 (no-chase 0.5), FR2 (0.7), FR3 (efficiency 0.6).
- March lived days net R: A2 12.21 | F1 12.54 | FR1 9.11 | FR2 12.54 | FR3 11.81. January avg R: A2 +0.75 | F1 +0.85 | FR1 +0.75 | FR2 +0.81 | FR3 +0.51. R1 and R3 fail -> F1 NOT ROBUST (03-23 was traded at 0.598 vs limit 0.600).
- All four keep a drawdown at or below A2's. F1 stays a paper tag; extra gate-2 condition: at day 40 FR1 must be within 1R of A2 forward (now -3.10R) or F1 closes as parameter luck. Track FR1 forward: `python bt/ab_drop.py F1,FR1 2015-03-01 <clock date>`.

## Idea TR trailing stop (journal/2015-idea-TR-trailing-stop.md; kill lines committed before the run)
- Trail 20 pips once +20 / 30 once +30 / 20 once +40. January build: +0.46 / +0.67 / +0.61R vs A2 +0.78R; drawdown unchanged. No survivor; March NOT run (clean-month uses stay 2). Exit side closed from every direction: 40 pips, noon London stays.

## Idea GAP signal strength (journal/2015-idea-GAP-signal-strength.md; kill lines committed before the run)
- Skip A2 when the 3-day close gap is small (< 25 / < 50 pips / < a quarter of the daily range). January build: kept +0.75 / +0.68 / +0.75R vs A2 +0.78R; the skipped small-gap days were 5 winners of 5. No survivor; March NOT run (uses stay 2).
- Journal habit changed: "coin flip" is retired from my calls; the gap is written as a number only.

## SAMPLE-SIZE RULE (journal/2015-sample-size-rule.md; written 04-03 at the coach's request)
- R per trade has sd 1.02: an average is known to +/-0.46R on 19 trades, +/-0.25R on 64, +/-0.14R on 200. A filter needs ~80 trades to show a 0.5R kept-vs-skipped gap, ~220 for 0.3R, ~500 for 0.2R. Same-trade changes (exit/stop/entry) need 22-100 trades for +0.10R.
- RULE: the January build can only KILL. Filters: no trust and no change to the funded rule before 200 forward trades (gap >= 0.3R, >= 2 SE). Same-trade changes: 100 forward trades (>= +0.10R, >= 2 SE). Funded size is set for the bottom of my edge range; no paper tag can raise it.
- Process mistake P2 (04-03): a research script ran old exit variants over all months incl. March. Guard: every research script gets an explicit end date. It showed E1 (30-pip stop) +0.12R/trade vs A2 over 64 trades - which the SS test below explains as leverage.

## Idea SS structure stop (journal/2015-idea-SS-structure-stop.md; kill lines committed before the run; January only)
- Stop 5 pips beyond the Asia / 07-08 hour / whole-night extreme, same $ risk: net R 22.4 / 33.1 / 22.2 vs A2 14.9, but drawdown 2.58 / 5.24 / 2.58R vs 1.34R and 6-8 full stops vs 2 -> score 0.78x / 0.57x / 0.77x. No survivor: it is leverage (tighter stop = bigger position), bought at a worse exchange rate than plain size. Stop stays 40 pips.

## Idea SO scale-out (journal/2015-idea-SO-scale-out.md; kill test committed before the run; January only; bt/ab_day.py)
- Half off at +40 / +20 pips (and +40 with the runner's stop to entry): net R 78% / 65% / 78% of A2's, drawdown 1.34 / 1.18 / 1.34R vs 1.34R, score 0.78x / 0.73x / 0.78x. No survivor. Exit side complete: 16 exit variants tested, none beats "40 pips, whole position, out 12:00 London".
- Funded ledger to date (every trade tagged, balance, drawdown) is in journal/2015-W14-funded.md and matches sim/trades.csv.

## Idea RN round numbers (journal/2015-idea-RN-round-numbers.md; kill test committed before the run; January only)
- Skip A2 when a "00" (or "00/50") level lies 15-25 pips ahead. "00" versions: skipped trades were all winners (2 of 2, 4 of 4). "00 or 50" within 15 pips: kept +1.07R vs skipped +0.39R but keeps 58% (line 60%) and the gap is inside noise for 19 trades. No survivor. Round numbers remain landmarks in the calls only.

## PROCESS CHANGES 2015-04-07 (coach) + idea RF (journal/2015-idea-RF-range-fade.md)
- BUILD = ALL lived history before the clock (not January only), shown by month; research scripts get the clock date as explicit end. No clean check month any more: the build only kills; survivors go to forward paper tags under the sample-size rule. Old variants are NOT re-run on the wider build.
- Max 3 variants per idea (kept). The exit/stop lever (six ideas, 16 variants over time) and entry time/price are CLOSED: no new idea there unless something new is learned forward. Open: a second, different setup.
- RF range fade (crooked week, fade the outer 25/15/33% of the 5-day range at 08:00 London): 9 / 2 / 16 trades, -0.60 / -1.02 / -0.49R, negative in every month incl. February. Killed. Finding: the London morning is a continuation window even in a box; A2 stood opposite on 13 of 16 days and won 9.

## Review of A2's last 20 trades by eye (journal/2015-review-last-20-trades.md; bt/last20.py; 04-09; no test run)
- 03-12..04-08: 13 wins, +4.25R, +0.21R per trade, 4 full stops: a February-type box stretch, right on the planning edge (+0.18R). Real winners were still extending after 10:30; losers and scratches peaked in the first 50 minutes. Afternoon went against me 12 of 20 days: noon stays.
- Observations parked, NOT tested: (a) 3 of the 4 stops were on the first day after a signal flip (flip days -2.62R in 6 here, +2.29R in 6 in Jan-Feb: 12 cases, not trustable); (b) the 3 mornings with a 60+ pip hour before entry were all losers.
- Flip-day feature tested 04-09 as idea FL: no survivor (below). Observation (b) stays parked: 3 cases only.

## Idea FL flip days (journal/2015-idea-FL-flip-days.md; from the 20-trade review; kill test committed before the run; all history to 04-08; bt/ab_period.py)
- Skip the first day after the 3-day signal flips / skip the first two / trade the old side: avg R per signal day +0.370 / +0.312 / +0.320 vs A2 +0.447 (67 days, net +29.93R, DD 2.03R). All fail K1, K2, K3. No survivor, closed.
- A2 on the 14 flip days: +0.37R each vs +0.47R on the other 53. By period the flip days were better in Jan (+1.92 vs +0.57) and Feb (+0.40 vs +0.18), worse only in Mar-now (-0.44 vs +0.59): a streak, not a trait. My earlier hand count (12 days) was short by two January-February days.
- Tool: `python bt/ab_period.py VARIANTS END` = variant vs A2 per signal day, split Jan / Feb / Mar-now, explicit end date.

## Idea FH first hour (journal/2015-idea-FH-first-hour.md; coach-set study of losers vs winners in the first hour; kill test committed before the run; all history to 04-09; bt/first_hour.py, bt/ab_exit_period.py)
- Study (68 trades): winners take their heat first and make their best price late in the hour (60% in the last 20 minutes vs 9% of losers); losers peak in the first 5-10 minutes. Circular: the first hour is inside the result.
- Close at 09:00 if best price in first 15 min / not in last 20 min / 09:00 in my worst third: avg R +0.348 / +0.322 / +0.424 vs A2 +0.445; the part given up was a GAIN (+0.33 / +0.23 / +0.08R per closed day). All fail K1, K2, K3. No survivor. 19 of FH1's 20 closed days are T1 days: it is idea T again.
- Exit side: 19 exit variants tested, none beats A2's. The lever stays CLOSED.

## Funded risk-size test (journal/2015-funded-risk-size-test.md; kill lines S1-S5 + decision rule committed before the run; bt/risk_size.py END)
- 69 A2 trades (+0.46R; +0.34R without January), 2,000 x 500-day reshuffles (plain and 5-trade blocks), edge scenarios full / no January / planning +0.18R / zero / -0.10R, brakes ON and OFF.
- Breach odds, brakes OFF, at the planning edge: 0.5% 0.2% | 1.0% 10.8% | 1.5% 42.7%. At the measured edge none breaches. Brakes ON: zero breaches anywhere, lowest balance -5.4% at 0.50%.
- 0.50% at the planning edge: 95th pct max DD 7.0% (line 6%), own stop reached 5.5% (line 5%) -> narrow FAIL on S3, S4 in the plain reshuffle; 1.0% and 1.5% fail widely. No acceptable size -> 0.50% STAYS by the decision rule.
- Expect at 0.50%: account +$460 to +$890 per month before the split, 1 month in 5 negative at the planning edge, bad month about -$450. Size is limited by how badly I know the edge (+-0.25R), not by the firm's rules.

## Replay of week 04-06..04-10 + idea RV (journal/2015-replay-W15-and-idea-RV.md; kill test committed before the run; all history to 04-13 without the inspiring day 04-07; bt/week_charts.py, bt/ab_period.py with DROP)
- Replay: Tuesday's buy came the morning after a rejection day (new high, close on the low); Wednesday stopped by 2.3 pips; Thursday's move came after noon. Only Tuesday was untested.
- Skip after "yesterday closed in the far third against the signal" / skip only after a rejection day / trade the other side: avg R per signal day +0.410 / +0.510 / +0.326 vs A2 +0.505. No survivor.
- The 11 "closed against me" days earn +0.60R each (others +0.49R): buying the dip inside the trend is where the rule earns (idea D again). Rejection days: 6 cases, 4 losers; parked observation, about 20 cases a year, not testable.
- Eight chart-reading filters in a row (H, G, NM, GAP, RN, FL, FH, RV) have failed the same way: the losers I look at have more winning twins than losing ones.

## Idea PM partial at +1R + break-even, ALL history (journal/2015-idea-PM-partial-breakeven.md; coach's brick; prior January result disclosed; kill test committed before the run; bt/ab_manage.py VARIANTS END [--days]; two days hand-checked on M5)
- 33 of 71 days reach +1R before noon; 25 of those are above +1R at noon, 5 runners come back to entry (0 in Jan, 1 in Feb, 4 in Mar-now; two of the five by under a pip).
- Half at +1R + runner to BE / half at +1R only / whole position to BE after +1R: net R 83% / 85% / 95% of A2's (+33.21R), max DD 2.03 / 2.03 / 2.31R (A2 2.03R), score 0.83x / 0.85x / 0.84x. No survivor.
- February alone favours the partial (103%, DD 1.03 vs 1.87R) on one day; Feb + Mar-now together 87-90% with the same drawdown. A partial cannot touch a drawdown (days that never reach +1R). For a calmer curve the tool is a smaller size.
- Exit side: 20 exit definitions tested, none beats A2's. Lever CLOSED again.

## PLAN v2 FUNDED, one page (journal/PLAN-v2-funded-one-page.md, 04-16): rule, size, daily stop (one trade, -1R, done for the day), brakes, payout plan, what counts as a trade mistake vs a process mistake, expectations, what is closed. Replaces the challenge one-pager.

## Idea AD add at +1R (journal/2015-idea-AD-add-to-winner.md; from the PM look; kill lines K1-K5 pushed 04-16 before any code; run on the coach's go; bt/ab_add.py VARIANTS END; two days hand-checked on M5)
- Add half at +1R (stop at my entry) / same + first position to break-even / quarter add + break-even: net R 111% / 107% / 101% of A2's (+34.70R), max DD 2.34 / 3.28 / 2.78R (A2 2.03R), worst 10 days -2.30 / -3.25 / -2.78R (A2 -1.37R). All fail K1, K2, K4, K5. No survivor, no paper tag.
- 32 adds in 72 days, 4 stopped; the 7 days that did not finish above +1R cost 2.4-4.0R and cluster in March-April. More profit, worse account. Net R per unit of drawdown: A2 17.1, AD1 16.5, PM1 13.5.
- Break-even stop has now hurt three times (X1, PM3, AD2). Management lever (partial, add, break-even) CLOSED.

## Idea CS stop on a candle close (journal/2015-idea-CS-close-stop.md; kill lines pushed before any code; bt/ab_cstop.py VARIANTS END DROP; two days hand-checked on M5)
- 10 stop-outs in 73 trades; 3 inspiring days removed, 7 clean. Exit on a 5-min / 15-min close beyond the 40 pip level (hard stop 60 / 60 / 50): 0 of 7 improved; -0.87 / -1.31 / -0.81R vs A2. No survivor, no paper tag.
- On 9 of 10 stop-outs a candle closed beyond the level: the hard stop was the best exit. "Stopped by a pip then right" happened ONCE (04-16), not three times: 04-08 would have lost 0.7R at noon anyway (my journal note was wrong: P3), 03-09 was a real break.
- Routine change (note-taking only): on a stop-out day the result line gives the price at 12:00 London and its distance from my entry, read from the engine.

## Idea SD is A2 two-sided? (journal/2015-idea-SD-two-sided.md; kill lines D1-D4 + consequences pushed before the script; bt/two_sided.py END [--check]; uses all 74 trades)
- Euro 1.2002 (01-02) -> 1.0805 (04-17). Sells 47 trades +0.614R (72% wins, +28.84R); buys 27 trades +0.243R (56%, +6.56R), positive in Jan, Feb, Mar-now. Difference +0.37R, noise band +-0.48R.
- By the 10-day trend: with 39 trades +0.405R, against 26 trades +0.345R. Hypothesis "two-sided" SURVIVES D1-D4. Sells-only / skip-against / half-size-against all fail K1: no survivor.
- Not over-read: 81% of net R is from sells; February buys +0.07R (11 trades). Planning edge +0.18R stays. Smaller group 26-27 trades: a dependence under ~0.5R is invisible. Tracking only: running R of buys and sells in the weekly journal.

## Loss tags (running count, all live trades): valid setup, market disagreed 24 (-14.53R) | my mistake 0. PROCESS mistakes (funded): 1 (P1, 03-30 DST slip: call written at the entry time).

## Next step
1. FUNDED, one live day at a time. When the next day (Mon 04-20) is released: `git fetch origin main && git merge --no-edit FETCH_HEAD`; `python sim.py advance --until DATE T06:00` (= 07:00 London in summer time); `./look.sh 3 0 9`; write the call in the week's funded journal (journal/2015-W16-funded.md) AND COMMIT IT BEFORE 08:00 London; at each month's first day write the month-end check (P&L, drawdown, tag counts); check brakes in FUNDED-TRACKER; LIVE DAY WALKED BAR BY BAR since 04-17 (coach): D1/H4/H1/M15 notes in the call, then sim.py advance in steps (08:00 order with --sl, 08:15, 09:00, 10:00, 11:00, 12:00 close) with a note written before each advance; `python trade_a.py buy|sell --risk 125 --london`; TAG the result valid/mistake FIRST; update journal/FUNDED-TRACKER.md (daily log + status line; payout on the dates) AND the FUNDED SCOREBOARD in this file; paper tags (F1/FR1 via `python bt/ab_drop.py F1,FR1 2015-03-01 <clock date>`, Q3/Q1 from look.sh); forward tally. When replacing a tally in a file, cut at the LAST "## Forward tally".
2. Forward tests running: A2 forward test (35/40, +15.73R) - when it completes re-run bt/reshuffle_breach.py and bt/funded_sim.py; F1 (28 days; plus FR1 tracked beside it), Q3/Q1. Friday tag and N1 are CLOSED (04-03).
3. Research rules: hypothesis + explicit kill lines committed first, max 3 variants per idea, BUILD = all lived history before the clock shown by month (explicit end date), build only kills, survivors -> forward paper tag (200 trades filter / 100 same-trade or stand-alone), inspiring days removed (bt/ab_drop.py), a feature from "best N vs worst N" is counted on all build-month trades before it is pre-registered, everything counted. A reshuffle does not count as the day's test: it must be a new rule test. One honest test earns the next day.
Tools: look.sh, trade_a.py, bt/*.py (ab, ab_exit, ab_rule, ab_same, ab_score, regime, ignite, ny_fade, dd_goal, cost_stress, edge_compare, phase2_sim, last_stretch, start_weeks, reshuffle_breach, funded_sim, pass_math, risk_math, review, loser_charts, entry_charts). Tests: `python -m pytest -q`.

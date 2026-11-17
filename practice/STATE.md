# STATE

| Field | Value |
|---|---|
| Sim clock | Thu 2015-06-04 00:00 UTC = 01:00 London (END OF RELEASED DATA; one live day at a time until ~Mar 2017; quality over speed: one honest piece of work earns the next day). London on summer time (UTC+1) |
| Phase | FUNDED ACCOUNT ($25k FundedNext) since Fri 2015-03-27 - see FUNDED SCOREBOARD below. Sim label "challenge #3" = the funded account; MY tracker is journal/FUNDED-TRACKER.md; this week's journal journal/2015-W20-funded.md |
| Current strategy | Rule A2 unchanged, IN LONDON TIME (decision 2015-03-30, journal/2015-W14-funded.md; confirmed by the clock-shift test): 07:00 London call; trend = last 22:00 London close vs the close 3 trading days earlier; 08:00 London market order; SL 40 pips; close 12:00 London; 1 trade/day, no skips. In UTC during summer time: call 06:00, entry 07:00, exit 11:00. FUNDED PLAN: journal/FUNDED-PLAN.md |
| Risk | FUNDED: 0.50% = $125 = 0.31 lots. COMMANDS: `python sim.py advance --until DATE T06:00` (= 07:00 London in summer time; T07:00 in winter), `./look.sh 3 0 9`, WRITE THE CALL (before 08:00 London, or no trade that day), then `python trade_a.py buy/sell --risk 125 --london` (08:00 -> 12:00 London, converted automatically). Funded brakes: 3% below high-water (or <= $24,250) -> 0.25% (`--risk 62.5`); 5% below (or <= $23,750) -> STOP + review. Payouts every 14 days: half of profit above $25,000 until a $1,000 buffer, then all above $26,000; none while a brake is on |
| Ideas tried | 74 (GA no trade the morning after an unusually wide day: killed - the skipped mornings are A2's BEST group, +0.82R in 10; tighter stop at the same $ risk: stopped at the look, it is leverage not management - 3 log looks, not run; W 'no Friday' and the N1 tag KILLED by their March forward tests on 06-03; GD the money guard under a dead or small edge: never near the firm's line, stops a dead edge in about 70% of two-year runs at a cost of about 5%, keeps a +0.10R edge trading - claim survives, no change; AL can my alarm at 100 live trades judge the edge: passes 47% of the time with a dead edge, fails 20% with a live one - claim dead, alarm unchanged, question to the coach; CL A2 on lived days under 1.5x / 2x / 3x costs: +0.201R / +0.180R / +0.134R, health check passed, break-even 8.9 pips; XT later exit clock 12:30 / 13:00 / 13:25 from the MFE/MAE study: 93% / 83% / 73% of A2's net, killed; noon is the top of the hill; BH no trade after a 60+ pip pre-entry hour: killed on the neighbour line - at 50+ pips the skipped group WINS - and too thin, 4 trades; replay of my 10 worst losers: 10 valid losses, 0 mistakes of mine; one repeating blind spot = pre-entry hour of 60+ pips, 4 cases 0 wins, counts-only line, no rule change; LD later entry after a lively pre-entry hour: 4.8R to 7.6R behind A2, killed; side finding: lively days are almost all March-May; LB lookback 2 / 4 / 5 on all history: 55% / 78% / 87% of A2's net, all positive in both halves, none a challenger; reading 'unclear' by my own line; TW wide trail for big mornings: 60/40 and 60/30 killed, 80/40 +1.10R on 3 changed days = too thin, counts-only line; SA stop 50 / 60 / 80 pips on all history: 9.6R to 21.5R behind A2, killed; the pokes are real but smaller than the price; ET earlier entry 07:00 / 07:30 / 07:45: all behind A2 by 3.7R to 8.9R, killed; 08:00 is the top of the hill; MO Mondays: five losing Mondays in a row were a streak, both variants killed; WS wider personal stop 7%: chosen at the coach's direction 05-15, passes K1-K3, beats the smaller size, held for funded days 36-55; TS tail stress of the funded plan, clean re-run 05-14: account line 0% breached, own -5% stop 13.4% -> 43.9% with a jump day per 92: claim killed, no change, proposal to coach; DC daily-cushion stress test: worst case 1.54% a day, own 1.25% line failed, size unchanged, proposal to coach; MB box break with the morning: MB1 on paper; passed its backtest kill test but does NOT hold on lived days (05-26 check); A London trend-follow, B Asia-range breakout with trend, C yesterday-midpoint filter [dropped], D pullback-day filter, E 30 pip stop, H no-chase filter [killed], F efficiency regime [not adopted], G don't-fight-the-first-break [killed], T one-hour check exit [killed], K first-break direction [killed], L lookback 2/5/10 [no improvement; A2 robust], W no-Friday [pending forward test], X exits: break-even / runner / target [no survivor], R regime detectors [no survivor], Q dead-Asia filter [Q3 killed on Feb check], M ignition-candle setup [no survivor], DD drawdown-goal re-scoring [Q3, Q1 to forward tag; F1 fails], N NY-fades-London second setup [N1 profitable both months, fails independence by 0.01; forward paper tag], Z bank-at-the-wall take-profit [almost never fires; closed], Y week-open side / Monday range [Y3 survives Jan, killed on Feb], V stop/size by volatility [no survivor; worse in Feb], E-time exit hour 10/11/13 [noon best in Jan, Feb and clean March], S wider stop 50/60/80 [no survivor; loses 14-53% of net R], clock shift +1h/-1h/late entry [08:00-12:00 London is the peak in Jan and clean March], NM night-must-agree filter [no survivor on the January build; backwards], LE limit entry instead of market [no survivor: higher win rate, lower profit], FR robustness of F1's two numbers [F1 NOT robust], TR trailing stops [no survivor: -2.2R to -6.2R in January], GAP skip small 3-day gaps [no survivor: the skipped days were all winners], SS structure stops behind the night's extreme [no survivor: more R but 2-4x the drawdown = leverage], SO scale-out half at +40/+20 [no survivor: 65-78% of the profit, same drawdown], RN round numbers ahead [no survivor; "00" levels were winners; 50-level version one trade short and inside noise], RF range-fade second setup [no survivor: -0.5R per trade, even in February], FL flip days of the trend signal [no survivor: flip days earn about the same as other days; recent streak only], FH first-hour shape exit at 09:00 [no survivor: weak starters earn +0.08 to +0.33R from 09:00 to 12:00; it is idea T again], RS funded risk size 0.5/1.0/1.5% [no size passes all five lines; 0.50% stays; 1.0% breaches 1 run in 10 at the planning edge], RV yesterday-closed-against-me / rejection day [no survivor: those days earn +0.60R, above average; rejection day = 6 cases, parked], PM partial at +1R / break-even on ALL history [no survivor: 83-85% of net R, same drawdown; BE-only deepens the worst stretch], AD add at +1R [no survivor: +1% to +11% net R but drawdown 2.3-3.3R vs 2.0R and worst 10 days twice as deep], CS stop on a candle close [no survivor: 0 of 7 clean stop-outs were wicks; losses get bigger], SD two-sided check [hypothesis SURVIVES: buys +0.24R (27), sells +0.61R (47), both positive in all periods; sells-only / with-10-day-trend-only variants fail], UN signal agreement 2/3/5-day [no survivor by the kill test; UN3 (3-day vs 5-day disagree, 15 days at -0.03R) passes K2-K4, fails K1: paper tag only, rules written 04-21], NT night continuation 00:00-07:00 second setup [no survivor: with the 3-day signal 0.00R; with yesterday's move -0.21R in all periods; the mirror (fade) is noted, not tested], ON one-way night against me, from the review of the last 15 losers [no survivor: fails on the un-reviewed period; 12 of 15 losers share it and so do 19 winners], SG small 3-day signal, from the April review [no survivor: small-gap days are BETTER (+0.62R, 81% wins) in all three periods], AF separate afternoon trade 13:30-17:00 in the rule's direction [no survivor: -0.11R on 75 afternoons, 32 full stops; the 5 remembered afternoons made +4.03R, the other 75 -7.94R], XS stretched signal as the cause of the worse loss side [explanation dead: ratio 1.38, mix explains 21% of the rise; the most stretched signals are the best trades], PH lively hour before entry (07:00-08:00 range 30+ pips) [no survivor by the kill test: full-stop ratio 3.12 and stable gap +0.43R in both periods, but explains 46% (<50%) and every variant fails the profit line; count only], LK late profit lock at 11:00 / 10:00 / bank at 11:00 [no survivor: -1.6R / -1.8R / -6.2R; the last hour ADDS +0.18R per in-profit trade], NF night fade 00:00-07:00 [no survivor: +0.03R, negative at a 2.5 pip spread; the 'mirror arithmetic' (+0.13R) was wrong because both sides pay the stop], SZ size rule: when to restore full size after the -3% step [no survivor: 'until a new high-water' stays; the half-size step cuts own-stop odds from 49% to 15% at the planning edge], UP health check by 10-day trend direction [hypothesis SURVIVES: up-trend days 29 trades +0.375R, down-trend 48 trades +0.307R; buys positive in a rising trend], LM direction of a lively pre-entry hour [no survivor: following it -0.22R (35 trades); fading it +0.20R = the same as A2 on those mornings], TD time-decay stop (25 / 20 pips from 09:00, 20 from 10:00) [no survivor: -3.9R to -4.7R; the noon exit is already the loss-cutter], SI split entry 08:00 + 08:30 / 09:00 [no survivor: 80-90% of net R AND a deeper drawdown; a single 09:00 entry keeps only 36% of the live profit], BX midday-box breakout 13:25-14:30 [no survivor: +0.17 to +0.34R, positive under cost stress and independent of A2, but fails the period line and the drawdown line; three trades make the profit]) |
| Variants tested | 207 (193 definitions + re-runs + 3 log looks at 25 / 30 / 35 pip stops, incl. GA1 GA2 GA3, G0 Gm Gs guard scenarios, AL1 AL2 AL3 alarm rules, C15 C2 C3 cost scenarios on lived days, XT1 XT2 XT3, BH1 BH2 BH3, MB1 on lived days only, LD1 LD2 LD3, LB2 LB4 LB5, TW1 TW2 TW3, S50 S60 S80 on all history, ET1 ET2 ET3, MO1 MO2, WS1 WS2 WS3, T1 T2 T3 of TS and their corrected re-run, DC1 DC2 DC3, MB1 MB2 MB3, BX1 BX2 BX3, SI1 SI2 SI3, TD1 TD2 TD3, LM1 LM2 LM3, the UP split, SZ1 SZ2 SZ3, NF1 NF2 NF3, LK1 LK2 LK3, PH1 PH2 PH3, XS1 XS2 XS3, AF1 AF2 AF3, SG2 SG3 new + SG1 = GAP50 re-run on all history, ON2 ON3 new + ON1 = NM1 re-run on all history, NT1 NT2 NT3, UN1 UN2 UN3, SD1 SD2 SD3, CS1 CS2 CS3, AD1 AD2 AD3, PM3 new + PM1 PM2 = SO40BE SO40 re-run on all history at the coach's request, RV1 RV2 RV3, RS 0.5/1.0/1.5%, FH1 FH2 FH3, FL1 FL2 FL3, N1 N2 N3, Z1 Z2 Z3, Y1 Y2 Y3, V1 V2 V3, ET10 ET11 ET13, S50 S60 S80, CP1 CM1 C9, NM1 NM2 NM3, LE5 LE10 LE10x, FR1 FR2 FR3, TR20 TR30 TR40, GAP25 GAP50 GAPR, SSA SSH SSN, SO40 SO20 SO40BE, RN00_15 RN00_25 RN50_15, RF25 RF15 RF33:A1 A2 A3, B1 B2 B3, C1, D1, E1, DE, H1 H2 H3, F1, G1, T1 T2, K1 K2, L1 L2 L3, W1, X1 X2 X3, R1 R2 R3, Q1 Q2 Q3, M1 M2 M3) + 3 re-scored for the drawdown goal (DD1=Q3, DD2=Q1, DD3=F1). A and B at the 3-variant cap; review round used its 3 |
| Challenge attempts | #1 PASSED both phases (no breach). #2 cancelled by coach (3 trades). Now FUNDED (not an attempt) |
| Last updated (real date) | 2026-11-16 |

## FUNDED SCOREBOARD (update after every funded day; source of truth: journal/FUNDED-TRACKER.md)
| Item | Value (after funded day 49, Wed 2015-06-03; figures from `python bt/daily_numbers.py PAID HIGH_WATER`) |
|---|---|
| Funded trades | 49 (25 wins, 24 valid losses) |
| Total R | +2.65R from the log (March +0.97R in 3; April +4.17R in 22; May -2.00R in 21; June -0.50R in 3) |
| Balance | $24,852.83 (sim shows $25,327.67; tracker = sim - $474.84 paid out) |
| High-water mark | $25,349.14 ($25,698.28 on 05-08, lowered by the $349.14 payout; moves up with new highs, down only by a payout) |
| Drawdown now / deepest | -1.96% / -2.22% (deepest 06-01: 4.45R under the equity high; now 3.95R) (first brake -3% = $24,588.67; stop -5% = $24,081.68; account line $22,500) |
| Payouts taken | 3: $68.82 (04-10) + $56.88 (04-24) + $349.14 (05-08) = $474.84 requested, $379.87 mine at 80%. Payout date Fri 05-22: $0 (balance $24,884.45, not above $25,000). Next payout date Fri 2015-06-05 |
| Trade tags | 49 valid, 0 my mistake |
| Process mistakes | 10 (P10 06-03: two forward gates of March - idea W and the N1 tag - never put on the gates list, judged 40 and 28 days late, both killed; P9 05-27 idea BH: a reading rule compared R across different stop sizes, not hand-worked first; P8 05-20 head arithmetic in a result note, corrected the same day; P7 05-14 idea TS: stress method not hand-checked before the run, T1 void; P1 DST slip 03-30; P2 research script touched March 04-03; P3 04-08 journal note read a UTC hour as London; P4 05-05 two counts written from memory; P5 day-40 gates of F1 / Q3 / Q1 applied 7 trading days late, found 05-06; P6 05-06 two uncomputed statements in a day note) |

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
- Kill test as written is forward-only: 8 unseen Fridays. APPLIED 06-03 (40 days late, P10): the first 8 unseen Fridays made +5.64R with 2 losers -> KILLED (lines 1, 2, 4 fail). All 13 Fridays to 05-29: +3.53R. CLOSED.

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
- JUDGED 06-03 (28 days late, P10) at its gate, the 20th forward trade (05-06): average +0.06R, -1.86R without its best trade, DD 4.53R, -1.70R on A2's losing days, overlap 56% -> all five lines fail -> KILLED. CLOSED. (Today, 32 trades: +0.17R, DD 4.53R - two lines still fail; not re-judged.)

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

## Idea UN signal agreement (journal/2015-idea-UN-signal-agreement.md; counts, limits and kill test pushed before the script; bt/signal_agree.py END [--check])
- Majority vote of 2/3/5-day signals differs from A2 on 3 days: untestable, not run. All three agree (51 trades, +0.50R) vs not (24, +0.38R): nothing. UN1 skip / UN2 half size: fail K1-K3.
- 3-day vs 5-day: agree 60 trades +0.58R; DISAGREE 15 trades -0.03R (gap 0.61R, noise +-0.47R, same sign in all 3 periods; 4 of 11 stops are in these 15 days). UN3 skip: net +34.81 vs +34.38, DD 1.34 vs 2.03R.
- UN3 passes K2, K3, K4 and FAILS K1 (+0.006R per signal day, needs +0.05R): NOT a survivor, no tag awarded. 15 days, third of three variants, effect rests on 4 stops. COACH 04-21: paper only, call written before each live day, never live on a few good days. Rules + PROMOTION RULE (first look only at 30 forward disagree days AND 200 forward days; P1-P5; coach decides) in journal/UN3-paper-tag-rules.md; look.sh prints the UN3 line; forward from 04-21: 32 days, 8 disagree (A2 +1.93R on them).

## Idea NT night continuation (journal/2015-idea-NT-night-continuation.md; stand-alone kill lines K1-K5 pushed before any code; bt/night.py END [--check DATES]; 76 nights per variant)
- Dropped first, plainly: "why are live losses deeper" (22% vs 8% full stops is under two standard errors; volatility is not clearly higher live; V already tested) - look again at 100 live trades.
- Market at 00:00 London, stop 30, out 07:00: with the 3-day signal -0.01R (49% wins); with the 1-day direction -0.21R; with the NY afternoon -0.21R (both negative in Jan, Feb, Mar-now, DD 17-19R). All fail K1-K3, K5. No survivor.
- Learned: A2's edge is London's morning, not "the trend" - the same signal at midnight is a coin. Nights tend to give back part of yesterday's move (63%, about 0.2R). PARKED observation: the fade would be about +0.13R after costs (under my +0.15R line, on the sim's doubtful midnight spread). Not tested; needs the coach's word and its own kill test with a cost stress.

## Review of A2's last 15 losers + idea ON (journal/2015-review-last-15-losers-and-idea-ON.md; coach's brick; bt/losers15.py, bt/week_charts.py, bt/night_against.py END [--check]; kill test pushed before the script)
- 15 losers 02-27..04-22 (-9.92R, 8 full stops) looked at one by one. Shared by eye: the night ran against the trade and London carried on; the full stops were never in doubt (best +2 to +18 pips).
- Base rate: the night (00:00 -> 08:00) ends against my side on 37 of 77 mornings; one-way against on 20. Those days hold 12 of the 15 reviewed losers AND 19 of 49 winners.
- Skip when against / skip when one-way against / half size: gap all history +0.55 / +0.41R, but on the part NOT reviewed (01-06..02-26) +0.19 / +0.03R -> all fail K1 and the decisive K3. No survivor, no tag.
- METHOD RULE added: a losers review is always done with the same number of winners from the same weeks beside it, and the base rate of every feature on all days is written first.
- Count only (not a tag): live trades after a night against me, from 04-23; no look before 40 of them.

## April month-end review so far + idea SG (journal/2015-04-month-end-review-so-far.md, journal/2015-idea-SG-small-signal.md; kill test pushed before the script; bt/small_signal.py END [--check])
- April 04-01..04-23: 17 trades, 8 wins, +1.56R, +$186.62; 5 full stops; W16 +3.50R, the other 12 days -1.94R; buys -1.01R (7), sells +2.57R (10); deepest drawdown -1.05%; 0 trade mistakes, 2 process mistakes; payout 1 taken ($68.82), next 04-24.
- Chosen weakness: trading small 3-day signals at full size (week 17: -2.07R). Test on all 78 trades: gap < 50 pips = 21 trades at +0.62R (81% wins) vs +0.36R for the rest, better in all three periods; relative version no difference. SG1-SG3 fail K1-K3. No survivor.
- Real open weaknesses, not testable now: the month is one week (regime), income is small (size capped by how badly I know the edge). Final April review on the first live day of May.

## 40-trade alarm PASSED + survival re-runs (journal/2015-forward-40-and-sims.md; decision lines D1-D4 pushed before the run; no new idea after a losing week)
- 40 live trades 03-02..04-24: 24 wins, +12.64R, +0.32R each, max DD 3.07R -> alarm (avg >= +0.10R, DD <= 8R) passed. Week W17: -3.07R, five losses in a row, all valid.
- funded_sim on the 40 live trades at 0.50%: 0 breached / 11 stopped by my -5% brake / 989 alive of 1,000. No decision line triggered -> 0.50% STAYS.
- HIGH-WATER CORRECTION (04-24): after a payout the high-water is lowered by the payout, not reset (plan + both scripts; HW_RESET=1 gives the old reading). With it, risk_size at the planning edge (+0.18R, shifted list) reaches my own -5% stop in 14.2% of two-year runs at 0.50% (block 4.8%; old reading 8.4%; 04-10 table said 5.5%). Never a breach with brakes on.
- COACH 04-27: decision lines did not trigger -> 0.50% stays; no size cut off one bad week. SIZE RULE written 04-27 (journal/2015-W18-funded.md): the ONLY size triggers are the brakes (-3% from high-water -> half size until a new high-water; -5% -> stop); checked in every morning's call; applying one late/early/not at all is a trade mistake.

## Idea AF afternoon trade (journal/2015-idea-AF-afternoon.md; new idea; base rates and stand-alone kill lines K1-K6 pushed before any code; bt/afternoon.py END DROP [--check])
- Market 13:30 London in the day's 3-day direction, stop 40, out 17:00; five inspiring days (04-09, 04-16, 04-21, 04-22, 04-27) removed. Every day: 75 trades, 39% wins, -0.106R, 32 full stops, DD 11.4R. After a scratch morning: 18 trades, +0.09R (all February). After a morning win: 36 trades, -0.108R. No survivor.
- The 3-day signal's edge is 08:00-12:00 London only (morning yes; night 0.00R; afternoon -0.11R). For the next "the move came after I got out": 75 afternoons, -0.11R each, 43% full stops.
- Method: first test built with the base rate and a contrast inside it from the start.

## Streak check (journal/2015-streak-check.md; coach 04-28; inside/outside line written before the numbers; bt/streak_check.py END)
- Backtest Jan-Feb: longest losing run 3, max DD 1.87R, never a 6+ run. Live: run of 6 (-3.23R), max DD 3.23R. Reshuffles of the backtest list over 42 trades: 6+ run 4.9% (line 5% -> just OUTSIDE), DD >= 3.23R 7.6% (inside); against all A2 trades 7.4% / 26.3%.
- What changed (one thing): mornings going 40+ pips AGAINST my entry: 7.7% in Jan-Feb, 26.2% live (Mar 23%, Apr 30%). Morning range unchanged (65 vs 66 pips); winners unchanged (+1.03R, 60%); losers the same share (40% vs 36%) but deeper (-0.69R vs -0.46R). The direction call fails harder, not more often.
- The plan already holds it (planning edge +0.18R vs live +0.34R; sims use the real loss side). Expectation now: 1 trade in 4 is a full stop; a 6-loss run every few months; about 5R of drawdown inside two months is the 95th percentile (4.94R). Keep trading the plan; no change.

## Idea XS: why did full-stop mornings rise 8% -> 26%? (journal/2015-idea-XS-stretched-signal.md; coach's brick; feature-only comparison first; lines E1-E3, K1-K4 pushed before any result; bt/stretched.py END [--check])
- Features that changed between Jan-Feb and Mar-Apr: 3-day gap (median 63 -> 147 pips; gap >= 1 day's range on 28% -> 55% of days), pre-entry hour range (30+ pips on 17% -> 57%), Asia range (30 -> 39). NOT changed: two-week choppiness (so that idea was dropped untested).
- Stretched-signal explanation: full-stop mornings 20.6% (stretched) vs 14.9% (others), ratio 1.38; live the others are WORSE (31.6% vs 21.7%); the mix explains 21% of the rise -> E1, E2, E3 fail. Skip / half size / skip at 1.0: fail K1-K3; gap >= 1.25 days = my best trades (+0.625R, 24 trades).
- The rise is inside ORDINARY signals (1 of 28 -> 6 of 19). Cause unknown; 3/39 vs 11/42 is about 2.3 standard errors. Last untouched candidate (parked, not run): the livelier hour before entry.

## Idea PH lively hour before entry (journal/2015-idea-PH-pre-entry-hour.md; pre-registered before touching any result; bt/pre_hour.py END [--check])
- Feature: 07:00-08:00 London range 30+ pips: 6 of 39 backtest days, 24 of 43 live days. Quiet-hour mornings: 52 trades +0.572R (69% wins; +0.565 backtest, +0.583 live). Lively-hour mornings: 30 trades +0.146R (50% wins; +0.150 / +0.144). Gap 0.43R, noise +-0.47R.
- Full-stop mornings: lively 9 of 30 (30%) vs quiet 5 of 52 (9.6%), ratio 3.12 (live 2.11). E1, E2 PASS; E3 FAIL (explains 46% of the rise, needed 50%). Backtest averages on the live mix give +0.33R = the live average.
- PH1 skip (87% of net R, DD 1.87): fails K1, K5. PH2 half size (94%, DD 1.87) and PH3 skip at 40+ (93%): fail K1 only. NO SURVIVOR, no tag awarded. Six backtest lively days; roughly the twelfth split of the same trades.
- COACH 05-01: PH2 is a paper tag, same discipline as UN3. Rules + PROMOTION RULE (first look at 200 forward days AND 60 lively days; P1-P6; coach decides) in journal/PH2-paper-tag-rules.md. Its line is written in the 08:00 note before the order ('decided at 08:00' in the 07:00 call). Forward from 05-01: 24 days, 19 lively (-2.53R live, 9 full-stop mornings), 5 quiet (+0.06R); PH2 about -1.20R vs A2 -2.49R.
- KEEP (coach): most-stretched signals are my best trades (+0.625R on 24); do not filter winners away - PH1 would remove 15 winners.

## Idea LK late profit lock (journal/2015-idea-LK-late-lock.md; coach: exits/management on A2; kill lines pushed before any code; bt/ab_lock.py VARIANTS END DROP; two days hand-checked)
- Loss-cut idea dropped for lack of sample (7-9 trades are 20+ pips under water at 10:00 / 11:00). Winner side: 36 trades are 20+ pips up at 11:00.
- At 11:00 stop to half the open profit / the same at 10:00 / bank at 11:00 (04-30 removed): -1.59 / -1.79 / -6.19R vs A2 (+34.10R). All fail K1-K3. No survivor.
- The hour 11:00-12:00 adds +0.18R per in-profit trade (20 of 34 better at noon). The inspiring day (04-30) would not have been changed by LK1.
- Exit/management side: 29 definitions tested, none beats the noon exit. CLOSED unless the live record changes character.

## Ten random charts + idea BX midday-box breakout (journal/2015-ten-charts-and-idea-BX.md; coach: slow down, 10 charts first; seeded draw; base rates; kill lines K1-K7 incl. cost stress pushed before any code; bt/box_break.py END [--check], own simulator hand-checked on two days)
- Charts: nothing new visible before the entry; the biggest move of the day often starts after noon. Base rates: biggest hour is 13:00 on 22% of days; afternoon range > morning on 65 of 89; the 13:25-14:30 window leaves the 12:00-13:25 box on 70 of 89 days (both sides on 11).
- Follow the first break, flat 17:00: BX1 (30 pip stop) 73 trades +0.174R, stressed +0.085R, DD 7.41R, Feb +11.41R / Mar-now -2.20R; BX2 (box stop) 63 trades +0.227R, DD 5.90R, Jan -2.13R; BX3 (box <= 30) 37 trades +0.343R. All pass K1, K2, K4, K6; all FAIL K3 (periods) and K5 (drawdown). No survivor, no tag.
- Parked as the one stand-alone observation that survived costs and is independent of A2 (corr about 0). Three trades make the profit; known to +-0.33R. Second setups tried: 9, none alive.

## Review of the losers of BX, SI, TD + idea MB (journal/2015-review-losers-of-3-killed-ideas-and-idea-MB.md; coach: scroll the losers first; last 8 losers each, 24 charts; kill lines K1-K8 pushed before any code; bt/losers3.py END [chart]; bt/morning_box.py END [--check])
- By eye: SI and TD only re-price A2's losing days (7 of 8 dates shared); I always act late; 6 of 8 BX losers were breaks against the morning (base rate turned out 57%, losers 60%, winners 53%).
- BX1 only with the morning (12:00 open vs 08:00 open), 8 inspiring days dropped: MB1 30 trades +0.695R (+-0.65), net +20.86R, DD 4.58R, all periods positive, stressed +0.592R, removed 36 trades -0.043R: PASSES K1-K8. MB2 (morning >= 20 pips) 16 trades +0.120R: killed. MB3 (day so far) fails K5, K6, K7.
- NOT trusted: the dose goes the wrong way (the 14 small-morning trades made +18.93R of it), win rate 50% vs 47%, 30 trades, 4th-6th cut of the same 74 trades. PAPER TAG ONLY (journal/MB1-paper-tag-rules.md): written at 12:00 London each live day, result from the tool next day. Second setups tried: 10; on paper 1; adopted 0.

## Idea DC daily-loss cushion (journal/2015-idea-DC-daily-cushion.md; coach 05-13; kill lines pushed before any code; bt/day_cushion.py END [--check])
- Stop filled at the worst price of its minute: worst day -1.33R, average stop -1.10R (PASS). Biggest morning minute in history 81.7 pips (01-15) -> hypothetical worst day -3.07R = 1.54% (my 1.25% line FAILS; the firm's 5% limit keeps 3x cushion). Afternoon minutes up to 124.3 pips: A2 + MB1 at 0.25% could cost 2.83% (FAIL) -> MB1 proposal size capped at about 0.09%.
- Size stays 0.50% (no trigger reached). Proposal to the coach only. Lesson: I underestimated the tail in every guess; a stop is about 1.1R, not 1R.

## Idea TS tail stress of the funded plan (journal/2015-idea-TS-tail-stress.md; stop days and the jump day looked at first; kill lines pushed before code; bt/tail_stress.py END)
- Planning edge +0.18R, 0.50%, size rule ON, 2,000 x 500 days: base own -5% stop 13.4% plain / 5.5% block. With a -3.07R jump day per 92 days (always against me): 22.9% / 14.2%; two per 92: 45.6% / 34.9%. Account line breached 0.0% in every scenario; lowest balance of any run -5.7%; worst day -1.54%. K1 PASS, K2 FAIL, K3 pass by the letter but honestly a fail (70-73% of payout).
- FLAW (P7): T1 replaced stops after the shift and made them milder; T1 void; the planning list already carries stops of about -1.24R. No re-run.
- CLEAN RE-RUN (coach; method fix + hand-worked list averages pushed before the run; `OLD_FLAWED=1` = first run): T1 real fills: own stop 20.5% plain / 9.3% block, payout 31.6% / 33.8%. T2 jump 1/92: 43.9% / 30.7%, payout 19.9% / 22.3%. T3: 67.0% / 56.1%. Breach 0.0% everywhere, lowest -5.7%. K1 PASS, K2 FAIL (+30.5 points), K3 FAIL (55%). The flaw had hidden two thirds of the failure.
- Meaning: the firm's line is not at risk; my own -5% stop is, and 0.05R of edge roughly triples its odds. Size and rules unchanged. Proposal to the coach: write what happens after my own stop; quote planning odds from the T1 list.

## Idea WS wider personal stop (journal/2015-idea-WS-wider-stop.md; choice made and written in the plan BEFORE the simulation; regression and floor figures hand-worked before the run; bt/wider_stop.py END)
- Stop 7% at 0.50% (WS1) against stop 5% at 0.50% (REF), stop 5% at 0.40% (WS2), stop 7% at 0.40% (WS3). Real fills (T1): own stop 1.6% vs 19.7% vs 6.2%; payout 32.8% vs 31.8% vs 28.3%. With a jump day per 92 (T2): own stop 7.4% vs 43.5% vs 20.2%; payout 23.2% vs 20.5% vs 19.6%. Breached 0.0% everywhere; lowest balance of any WS1 run -7.73%.
- K1 safety PASS, K2 PASS, K3 not dominated PASS. Cost: 44-48% of days at half size under T2; a zero-edge case was not tested (there the wider stop loses 2% more). Held for funded days 36-55; this table is the baseline of the review after day 55.

## Last 12 losers beside last 12 winners + idea MO Mondays (journal/2015-losers-winners-table-and-idea-MO.md; coach 05-18: entry edge from my own losers and winners; bt/wl_table.py END; kill lines pushed before any code; bt/mondays.py END [--check])
- Table: age of signal, run of closes, place in yesterday's range, hour before entry, night: medians the same in both groups. Only difference: 5 Mondays among the losers, 0 among the winners.
- Decision set (24 table days dropped): Mondays 14 trades, 9 wins, +0.397R vs Tue-Fri +0.485R; from 03-02 Mondays +0.529R vs +0.398R. MO1 (no Mondays) costs 5.56R; MO2 (Mondays only with the weekend move) kept -0.019R (6) vs removed +0.709R (8). Both KILLED on K1, K2, K3. The five losing Mondays were a streak.
- Sixth review ending the same way: at 08:00 a winner and a loser look alike. About 16 entry filters on A2, none adopted.

## Idea ET earlier entry (journal/2015-idea-ET-earlier-entry.md; from the lively pre-entry hours; what I knew against it added up first; kill lines K1-K5 pushed before any code; bt/earlier_entry.py END [--check])
- 96 days, A2 +36.71R (DD 3.28R). Entry 07:00: +27.80R (DD 5.07R, 27 stops); 07:30: +33.01R (DD 6.12R); 07:45: +32.16R (DD 5.35R). Behind A2 in both halves; on lively pre-entry hours the early entry is 2.2R-4.8R WORSE. All five kill lines fail for all three.
- Profile of A2's net by entry time: 07:00 76% | 07:30 90% | 07:45 88% | 08:00 100% | 08:30 81% | 09:00 61% (last two from SI). 08:00 is the top of a hill with working neighbours. The entry minute is settled.

## Idea SA the stop distance on all history (journal/2015-idea-SA-stop-all-history.md; coach 05-20: exit side; my 12 live stop notes read first: 8 real, 4 pokes; kill lines K1-K5 pushed before the run; bt/ab_lock.py S50,S60,S80 END DROP)
- Decision set (93 days, four poke days dropped): A2 +39.77R; S50 +30.18R, S60 +23.78R, S80 +18.25R; behind in both periods; 53-58 days worse for 17-27 better. Only K5 passes (average losing day -0.66R -> -0.57 / -0.49 / -0.35R; stop exits 19 -> 14 / 10 / 3).
- All 97 days: S50 +29.28R vs A2 +35.71R (82% / 67% / 51% of A2's net; January said 77% / 62% / 47%). The four poke days give S50 back 3.17R and it is still 6.43R behind. Stop stays 40 pips. Exit side closed again.

## Idea TW wide trail (journal/2015-idea-TW-wide-trail.md; coach 05-21: one exit rule; trail chosen over target and time before any result; sample counted first; kill lines K1-K5 pushed before the run; bt/ab_lock.py TW1,TW2,TW3 END 2015-05-19)
- Sample: 23 of 98 trades ever reach +60 pips, 10 reach +80. TW1 (once +60, trail 40): +0.44R on 4 changed days, live half behind. TW2 (60 / 30): -2.81R, cut 01-23 from +4.30R to +1.41R. TW3 (80 / 40): +1.10R on 3 changed days, none worse; fails K3 (one day is most of it) and K5 (10 changed days needed).
- Verdict: two killed, TW3 too thin; no tag; exit unchanged. The 55 pips given back on 05-19 are worth about a third of an R a month as a rule, known from four cases; 10 pips of setting separate free from costly.

## Idea LB the 3-day lookback on all history (journal/2015-idea-LB-lookback-hill.md; challenger lines and the hill-or-spike reading pushed before any code; bt/lookback_hill.py END [--check])
- 99 days, A2 +33.70R (DD 3.75R). Lookback 2: +18.44R (55%), 4: +26.31R (78%, DD 7.60R), 5: +29.23R (87%, DD 6.60R); all positive in both halves; all fail K1-K4. On opposite-direction days A2 was the right one (+8.94R vs -6.32R on 16 days against the 2-day signal).
- Reading by the pre-written rule: UNCLEAR (hill needed 60% for lookback 2; it kept 55%); nowhere near a spike. 3 days is the best member of a working family. With ET, SA, TW and LB every number of the rule has been re-tested on all history and none moved.

## Idea LD later entry on lively days (journal/2015-idea-LD-late-entry-lively.md; three hand-worked days declared and dropped; kill lines with a quiet-day control pushed before any code; bt/late_lively.py END DROP [--check])
- 97 days: after a lively pre-entry hour enter 08:15 / 08:30 / 09:00 instead of 08:00: -7.57R / -5.70R / -4.78R against A2; as many or more full stops (14 / 13 / 12 vs 12); all five kill lines fail. With the inspiring days back in still -1.62R at best.
- Side finding: 36 of 42 lively days are from 03-02 on. The lively / quiet split (+0.18R vs +0.54R) is nearly a March-May / January-February split: PH2's first look must compare inside the same months (reading rule added to its file).

## MB1 on lived days only (journal/2015-MB1-lived-days-check.md; coach 05-26: many looks make a backtest win weaker; best idea chosen by rule = the only one that passed its kill test; lines and consequences pushed before the script; bt/mb1_lived.py END [--check])
- Lived days 03-02..05-26 (62 A2 days, A2 +0.232R a trade): MB1 kept 21 trades, 38% wins, +0.213R (stressed +0.141R), DD 4.58R; removed 34 at +0.021R. L1 PASS, L2 FAIL (kept minus removed +0.191R, line +0.20R), L3 FAIL (below A2), L4 PASS. Claim "holds on lived days" DEAD, narrowly.
- Inside its build (03-02..05-12): kept +0.248R vs removed -0.293R. True forward (10 days): kept 2 (-0.24R), removed 7 (+8.64R). Backtest said +0.695R; lived days say +0.213R. MB1 stays on paper under its own rules; no longer "the one that passed". New habit: lived-days table BEFORE any paper tag.

## Replay of my 10 worst losers (journal/2015-ten-worst-losers-replay.md; coach 05-27; selection rule and questions pushed before any chart; bt/week_charts.py; base rates on all 102 days beside every observation)
- All ten are full stops taken by the rule: 10 valid losses, 0 execution mistakes. On six a better trader takes the same trade; 2 are pokes (03-09, 04-16).
- What looked like mistakes on the chart (buying the top of the hour, the falling knife, entry beyond yesterday's extreme) are not losing groups on all history (+0.04R / +0.22R / -0.14R in 16 / 17 / 10 trades).
- The one repeat with no winner: a pre-entry hour of 60+ pips (03-19: 115, 04-24: 83; all history 4 cases, 0 wins, -3.18R). Not PH2's 30 pip line: 45-60 pip mornings make +0.42R. No rule change (4 cases); counts-only line, look at 10.

## Idea BH big pre-entry hour (journal/2015-idea-BH-big-pre-hour.md; coach 05-27: test the blind spot of the replay; prior knowledge stated; kill lines incl. sample and neighbours pushed before any code; bt/big_pre_hour.py END [--check]; costs on)
- 102 days, A2 +34.84R. No trade at 60+ pips: skips 4 trades (0 wins, -3.18R, all lived days), rule +38.02R, DD unchanged: K1 PASS, K2 PASS. Neighbours: 70+ = the same four trades; 50+ skips 14 trades that average +0.115R (the ten between 50 and 59 pips made +4.79R, 7 wins): K3 FAIL. Sample 4 < 10: K4 FAIL.
- KILLED and too thin: the 60 pip line is a number. Mechanism reading flawed (P9); in pips the wide stop was worse on 2 of the 4 days. Counts-only line continues at 80+ pips.

## MFE / MAE study + idea XT later exit clock (journal/2015-mfe-mae-study-and-idea-XT.md; coach 05-28; log of all 103 A2 trades in journal/mfe-mae-log.csv via bt/mfe_mae.py END; kill lines K1-K5 pushed before any code; bt/exit_clock.py END [--check], its 12:00 version reproduces engine A2)
- Log: winners' MFE median 49 pips, they keep 65% of it (give-back median 12); winners' MAE median -11, worse than -20 on 12 of 63, worse than -30 on 2; full stops' MFE median 6 pips (never 8 in profit on three quarters); after +30 pips only 3 of 54 end as losers; 31 of 63 winners make their best price in the 11:00 hour.
- XT: close 12:30 / 13:00 / 13:25: -2.59R / -5.94R / -9.52R against A2, behind in both halves; trades in profit at noon get WORSE with more time (-0.04R to -0.09R each); 6 to 9 extra full stops. All killed. Exit-time profile 12:00 100% | 12:30 93% | 13:00 83% | 13:25 73%: noon is the top, like 08:00 for the entry.
- Reading of the log: stops are wrong from minute one, winners need 10-20 pips of room, +30 rarely comes back, the move ends near noon. Put it on, leave it alone.

## Idea CL costs on lived days (journal/2015-idea-CL-costs-on-lived-days.md; first test under the June goal: a worked case for every kill line in the pushed pre-registration; bt/costs_lived.py END [--check])
- Lived days from 03-02 (65 trades): normal +0.221R; 1.5 / 0.3 pips +0.201R; double 2.0 / 0.5 +0.180R (worked prediction +0.175R); triple 3.0 / 1.0 +0.134R (predicted +0.125R); max DD 3.75R -> 4.10R -> 4.68R; no extra full stops. K1-K4 PASS.
- The lived edge is not a cost artefact: break-even at 8.9 pips of extra round-trip cost. A health check; nothing changes. The open question is the size of the edge (+-0.26R), not costs.

## Idea AL power of the A2 alarm (journal/2015-idea-AL-alarm-power.md; June goal: a worked prediction for every kill line in the pushed pre-registration; bt/alarm_power.py END)
- My 66 real live trades + 34 reshuffled future trades at a true edge of 0.00 / -0.10 / +0.18R: the alarm as written (avg of 100 >= +0.10R, max DD <= 8R) PASSES 47.3% / 29.0% / 79.7%. K1 PASS (fails 52.7% with a dead edge), K2 FAIL, K3 FAIL: it cannot be called a judge. The drawdown half binds because I stand 4.45R down (3.55R of room).
- No rule on 34 trades can separate 0 from +0.18R (about 154 trades needed for 10% false alarm, 80% power). The alarm stays as written; the size rule is what protects the account. Question to the coach: which judge after trade 100.

## Idea GD the guard under a dead or small edge (journal/2015-idea-GD-guard-under-dead-edge.md; coach 06-02: the guard is the real safety rule; worked predictions and a regression against WS pushed before the run; bt/guard_dead_edge.py END BAL0 HW0 [edges])
- From my real state (1.48% under the high-water), 2,000 x 500 days, plain / block: edge 0.00R: breached 0.0%, own 7% stop reached 72.8% / 67.5% (median day about 230), result when stopped about -5%, lowest balance -6.88%; edge -0.10R: stopped 99%, median day 122, about -5.6%; edge +0.10R: still trading after 300 days 91.0% / 93.7%, median two-year result about +13%; edge +0.18R: stopped 1.8% / 0.8%.
- K1 safety PASS, K2 PASS, K3 PASS. The guard caps a dead edge at about 5-6% of the account without needing to know the edge; the price is time. My worked 42% for the zero edge missed (run 68-73%): a trailing stop is met far more often than a fixed barrier.

## 06-03: a leverage look stopped, two March gates closed (journal/2015-06-03-two-forgotten-gates-and-a-leverage-look.md)
- Tighter stop at the same $ risk (35 / 30 / 25 pips): a crude line on the MFE / MAE log says +4.64R / +10.62R / +20.10R - and my own March notes say why: leverage (E1). In pips at the same lots a 30 pip stop is worth about -0.8R. Not pre-registered, not run; 3 looks counted.
- W 'no Friday' and the N1 paper tag judged by their written forward lines: both KILLED (P10: never on the gates list). The coach's brief - one NEW idea to make A2 better - is still open for the next test.

## Idea GA the morning after a giant day (journal/2015-idea-GA-morning-after-a-giant-day.md; coach 06-03: one idea to make A2 better; sample counted without results; worked cases; kill lines K1-K5 pushed before the script; bt/giant_day.py END DROP [--check])
- Ratio = yesterday's range / average of the five days before. No trade at ratio >= 1.5 (two inspiring days dropped): skips 10 trades that made +0.817R each (+8.17R); at >= 1.3: 24 trades +0.600R; at >= 2.0: 4 trades +1.041R. K1, K2, K3, K5 FAIL. KILLED.
- The morning after a wide day is A2's best group (01-23 +4.30R, 03-11, 04-30); my two fastest stops are its two failures. Same lesson as XS: a filter built on my worst mornings removes my best ones.

## Idea SI split entry (journal/2015-idea-SI-split-entry.md; trade management; kill lines K1-K5 pushed before any code; bt/split_entry.py END [--check]; its 08:00 part reproduces engine A2 exactly)
- Half 08:00 + half 09:00 / half 08:00 + half 08:30 / thirds: net 80% / 90% / 81% of A2's (+37.45R), max DD 3.62 / 3.99 / 3.98R (A2 3.28R), worst 10 days -2.54 / -2.18 / -2.45R (A2 -1.70R). All fail K1-K4. No survivor.
- Single entries, reported only: 08:30 keeps 81% (live 73%), 09:00 keeps 61% (live 36%). The first hour after 08:00 carries much of the edge; splitting is the same bet, later.
- Dropped untested: the payout buffer (a tautology in simulation with a trailing stop).

## Idea TD time-decay stop (journal/2015-idea-TD-time-decay-stop.md; coach: exit/management; sample counted first; kill lines K1-K5 pushed before any code; bt/ab_lock.py VARIANTS END none)
- Stop tightened to 25 / 20 pips from 09:00, or 20 pips from 10:00 (touches 29 / 33 / 22 days of 88): net -3.88 / -4.20 / -4.68R vs A2 (+36.98R); worse on 17 / 20 / 16 days; average losing day not improved except TD2. All fail K1-K3. No survivor.
- Why: most losing mornings are small noon exits (-0.2 to -0.5R); a tighter stop turns them into fixed -0.5 / -0.63R. The noon exit is already the loss-cutter.
- Exit/management side: 32 definitions tested, none beats A2's. CLOSED.

## Idea LM lively-morning direction (journal/2015-idea-LM-lively-morning.md; new stand-alone idea; kill lines K1-K6 pushed before any code; bt/lively_morning.py END [--check])
- 35 lively mornings (pre-entry hour 30+ pips; 6 backtest, 29 live). With the hour's direction: -0.223R, 14 full stops. Against it: +0.203R, passes K1-K4 but equals A2 on the same mornings (+0.205R) -> fails K5. With it if 20+ pips net: -0.034R on 22. No survivor.
- Post-hoc description only (not a variant): on lively mornings A2 = the fade on 21 (+0.338R each) and = the chase on 14 (+0.005R each). Parked with its count; PH2 on paper covers all lively mornings.
- Second setups tried: 8, none alive.

## SCHEDULED GATES (added 05-06 after P5; check this list every Friday; last read Fri 05-29: none due)
- PERSONAL STOP changed 05-15 to 7% under the high-water (was 5%; coach: pick one and hold 20 live days): fixed for funded days 36-55 (14 done); review after day 55, not before. Size 0.50% and the half-size step at 3% unchanged.
- MB1 (paper, from 05-13): first look at 100 forward kept trades (7 done after 16 forward days: -1.87R, DD 4.00R; removed 8: +7.64R; no break 1; about 285 trading days needed at the history rate of 0.35 kept trades a day, roughly mid 2016); interim early-close look at 40. Early close: kept DD > 6R; net < -3R after 20 kept; avg < 0 at 40.
- HOW A2 IS JUDGED (coach 06-02): not from the alarm alone; planned size stays; the drawdown / breach guard (half size 3%, stop 7%, account line) is the real safety rule; the edge is judged after a few hundred lived trades over 2-3 years; lived average with its error band written at every month-end and every 50th lived trade (next: trade 100).
- A2 rule alarm: next look at 100 live trades (68 done; +0.20R avg, max DD 4.45R): avg >= +0.10R, max DD <= 8R.
- UN3: first look at 30 forward disagree days AND 200 forward days from 04-21 (8 / 32 done). Early close if A2 makes +5R on the first 15 disagree days.
- PH2: first look at 60 forward lively days AND 200 forward days from 05-01 (19 / 24 done). Early close after 40 lively days if they are not below the quiet days.
- Night-against count: look at 40 such live trades (18 done). Buys/sells: tracking only. 10-day-trend direction: PAPER LINE from 05-06 (coach: the up-trend result of 29 trades is not to change live rules until live days confirm it); look at 40 live up-trend trades (10 done).
- Counts-only from 05-22: live trades that reach +80 pips open, noon result beside an 80 / 40 trail (history: 4 cases in 98 trades, all better with the trail, about +1.5R). Look at 15 cases (1 done: 06-02 no difference). No rule.
- Counts-only from 05-27 (wording corrected after idea BH: the four cases are all 80+ pips; 50-59 pip mornings WIN): live days with a pre-entry hour of 80 pips or more, with A2's result (history: 4 cases, 0 wins, -3.18R: 03-12, 03-19, 03-27, 04-24). Look at 10 cases (4 done); then a proposal to the coach only if still no winner or below -0.5R a trade. A2 trades them at full size meanwhile.
- Every forward test ever written is either on this list or marked CLOSED in its own section (checked 06-03 after P10: W closed, N1 closed, F1 / FR1 / Q3 / Q1 closed 05-06; open: UN3, PH2, MB1 and the counts-only lines above).
- Payout dates: every 14 days from 03-27 (05-22: balance under $25,000, $0 requested; next Fri 06-05). Month-end review: first live day of each month.

## Paper-tag gates at forward day 40 (journal/2015-paper-tag-gates-day40.md; applied late on 05-06 = process mistake P5; numbers of 04-24 from the engine)
- F1: +14.70R vs A2 +12.72R (beats it), but FR1 is 1.45R behind A2 (limit 1R) -> CLOSED as parameter luck, as written on 04-01. Q3: 41% of A2's net, DD 99% -> CLOSED. Q1: 83% of net, DD 100% -> CLOSED.
- Not hidden: F1 and FR1 had a max DD of 1.28R against A2's 3.12R. Those were not F1's lines; no re-scoring. The daily call now carries only UN3 and PH2.

## Idea UP rising-trend health check (journal/2015-idea-UP-rising-trend.md; promised 04-17; kill lines U1-U4 pushed before any result; bt/trend_dir.py END [--check])
- 10-day trend UP: 29 trades, 69% wins, +0.375R, +10.87R (buys 19: +0.301R; sells 10: +0.515R). DOWN: 48 trades, 54%, +0.307R (buys 18: +0.152R; sells 30: +0.401R). Both halves of the up days positive. Hypothesis SURVIVES U1-U4.
- Not over-read: 29 trades, longest up stretch three weeks. Buys are the weaker side in both regimes (inside noise).

## Idea SZ size rule: restore condition (journal/2015-idea-SZ-brake-restore.md; coach: one change to how I size; why a simulation stated; kill lines pushed before any code; bt/brake_rule.py END [--check])
- 2,000 two-year reshuffles at 0.50%, same draws: current rule (half size from -3% until a new high-water) vs restore at drawdown < 1.5% / only while >= 3% / no half step.
- Live list: own -5% stop 0.2% / 0.3% / 0.6% / 5.3%; median payout +0% / +1.5% / +2.5% / +3.0%. Planning edge: stop 14.8% / 17.2% / 23.8% / 48.7%; payout +0% / +5.7% / +11.8% / +9.2%; 30% of days at half size under the current rule. All variants fail K1 or K2 and K3. No survivor: the rule of 04-27 stays.
- The half-size step is the most valuable line in the plan (49% -> 15% own-stop odds at the planning edge for about 9% of median payout).

## Idea NF night fade (journal/2015-idea-NF-night-fade.md; the parked 04-22 observation; contamination stated; kill lines K1-K6 incl. cost stress pushed before any code; bt/night_fade.py END [--check])
- Against yesterday's 1-day direction / against the NY afternoon / only when both agree; 00:00-07:00 London, stop 30: +0.032 / +0.016 / +0.069R on 84 / 84 / 58 nights; at a 2.5 pip spread -0.03 / -0.05 / +0.02R; Mar-now negative in all three. Fail K1-K4, K6. No survivor; parked item removed.
- The mirror of a losing trade is not a winning trade once both have stops: NT2 + NF1 lose 0.18R a night together (0.07R costs + 0.10R whipsaw). Never again "the mirror would make about X" without running it.
- Second setups tried: 7, none alive. The one edge on record: the 3-day direction, 08:00-12:00 London.

## May 2015 review (journal/2015-05-month-end-review.md): 21 trades, 11 wins (52%), -2.00R, -$252.34 (-0.99%): first losing funded month; 9 full stops; best day 05-19 +2.17R (one jump candle; without it -4.17R); worst day -$128.34 (-0.50%); deepest drawdown -1.83% (3.69R, inside the written normal range of 6 losses / 5.9R); payouts $349.14 requested on 05-08 ($279.31 mine), $0 on 05-22; 21 valid tags, 0 trade mistakes; 6 process mistakes, 5 of one species. Research: ideas 48 -> 69, variants 131 -> 192, 0 adopted.
## JUNE PROCESS GOAL (one): every number and every test rule gets one worked case before it is pushed; measured by the count of numbers or rules corrected after a push (May 5, target 0), reported in the June review.

## April 2015 FINAL review (journal/2015-04-month-end-review-final.md): 22 trades, 11 wins, +4.17R, +$517.39 (+2.07%); 6 full stops; deepest drawdown -1.63% (six losses in a row), closed in 8 days; 2 payouts ($125.70 requested, $100.56 mine); 0 trade mistakes, 2 process mistakes. From May: a number written from memory and corrected later is logged as a process mistake.

## LIVE vs BACKTEST, running (coach 04-20; `python bt/live_vs_bt.py END`; updated after every live day; the live column is the real out-of-sample)
As of live day Wed 2015-06-03:
| | Backtest Jan-Feb (engine) | LIVE from 03-02 (as traded) | Engine on the live days |
|---|---|---|---|
| Trades | 39 | 68 | 68 |
| Win rate | 64% | 57% | 57% |
| Avg R | +0.50 | +0.20 | +0.20 |
| +- 2 standard errors | 0.33 | 0.25 | 0.26 |
| Net R | +19.56 | +13.75 | +13.88 |
| Avg win / avg loss | +1.04 / -0.46 | +0.95 / -0.80 | +0.96 / -0.81 |
| Full stops | 3 (8%) | 21 (31%) | 21 (31%) |
| Max drawdown | 1.87R | 4.45R | 4.54R |
| Worst 10 trades in a row | +0.56R | -3.69R | -3.75R |
| Sells: n, avg R | 24, +0.70 | 37, +0.29 | 37, +0.29 |
| Buys: n, avg R | 15, +0.18 | 31, +0.10 | 31, +0.10 |
Live minus backtest: -0.30R per trade (noise band +-0.42R) -> inside the noise. Live vs February alone (+0.23R, 20 trades): -0.03R. As traded vs engine on the same days: -0.13R over 68 trades (fills and rounding).
Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): 68 done, avg +0.20R, max DD 4.45R. Planning edge +0.18R: live is +0.02R above it.
Counts only: live trades after a night (00:00->08:00) against my side, from 04-23: 18 (+0.63R; look at 40). 10-day-trend direction, paper line from 05-06: trend UP 11 trades -0.52R; trend DOWN 10 trades -2.24R (look at 40 up-trend trades). MB1 paper from 05-13: 16 days, kept 7 trades (-1.87R, DD 4.00R); removed 8 (+7.64R); no break 1. +80 pip trades from 05-22: 1 of 15 (no difference). Pre-entry hour 80+ pips: 4 of 10 (0 wins, -3.18R).
Normal worst for 56 trades (bt/streak_check.py 2015-05-19, all 95 A2 trades reshuffled): longest losing run median 4, 95th pct 6; max drawdown median 3.09R, 95th pct 5.92R. Live worst: 6 in a row (April), 4.45R (06-01). Now: 1 in a row, 3.95R under the high.

## Loss tags (running count, all live trades): valid setup, market disagreed 42 (-29.20R from the log) | my mistake 0. PROCESS mistakes (funded): 1 (P1, 03-30 DST slip: call written at the entry time).

## Next step
1. FUNDED, one live day at a time. When the next day (Thu 06-04) is released (journal/2015-W23-funded.md; June process goal at the top of it) (journal/2015-W22-funded.md) (journal/2015-W21-funded.md): `git fetch origin main && git merge --no-edit FETCH_HEAD`; `python sim.py advance --until DATE T06:00` (= 07:00 London in summer time); `./look.sh 3 0 9`; write the call in the week's funded journal (journal/2015-W20-funded.md) AND COMMIT IT BEFORE 08:00 London; at each month's first day write the month-end check (P&L, drawdown, tag counts); check brakes in FUNDED-TRACKER; AT 07:00 run `python bt/call_numbers.py DATE`; DURING THE WALK `python bt/walk_numbers.py buy|sell ENTRY STOP N`; AFTER THE DAY run `python bt/daily_numbers.py PAID_OUT HIGH_WATER_BEFORE` and copy every bookkeeping figure from its output (coach 05-05: read numbers from the tool, every time); LIVE DAY WALKED BAR BY BAR since 04-17 (coach): D1/H4/H1/M15 notes in the call, then sim.py advance in steps (08:00 order with --sl, 08:15, 09:00, 10:00, 11:00, 12:00 close) with a note written before each advance; `python trade_a.py buy|sell --risk 125 --london`; TAG the result valid/mistake FIRST; update journal/FUNDED-TRACKER.md (daily log + status line; payout on the dates) AND the FUNDED SCOREBOARD in this file; paper tags (F1/FR1 via `python bt/ab_drop.py F1,FR1 2015-03-01 <clock date>`, Q3/Q1 from look.sh); forward tally. When replacing a tally in a file, cut at the LAST "## Forward tally".
2. MB1 paper line: at 12:00 London write the morning direction (12:00 open - 08:00 open) in the journal before 13:25; next day `python bt/morning_box.py END --check DATE` and fill journal/MB1-paper-tag-rules.md.
2b. Forward tests running: A2 40-trade alarm PASSED 04-24 (40 trades, +12.64R, +0.32R each, max DD 3.07R; sims re-run in journal/2015-forward-40-and-sims.md); F1 (plus FR1 tracked beside it), Q3/Q1, UN3 (paper, from 04-21; its call goes in every 07:00 call), PH2 (paper, from 05-01; 'decided at 08:00' in the call, range and verdict in the 08:00 note before the order). Friday tag and N1 are CLOSED (04-03).
3. Research rules: hypothesis + explicit kill lines committed first, max 3 variants per idea, BUILD = all lived history before the clock shown by month (explicit end date), build only kills, survivors -> forward paper tag (200 trades filter / 100 same-trade or stand-alone), inspiring days removed (bt/ab_drop.py), a feature from "best N vs worst N" is counted on all build-month trades before it is pre-registered, everything counted. A reshuffle does not count as the day's test: it must be a new rule test. One honest test earns the next day.
Tools: look.sh, trade_a.py, bt/*.py (ab, ab_exit, ab_rule, ab_same, ab_score, regime, ignite, ny_fade, dd_goal, cost_stress, edge_compare, phase2_sim, last_stretch, start_weeks, reshuffle_breach, funded_sim, pass_math, risk_math, review, loser_charts, entry_charts). Tests: `python -m pytest -q`.

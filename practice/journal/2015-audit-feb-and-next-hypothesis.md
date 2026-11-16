# Audit: did February stay unused? + loss tags + ONE new hypothesis (written before any run of it)
Clock still Fri 2015-02-27 22:00 UTC. Costs on everywhere (1.0 pip spread + 0.1 slippage). Risk $125 = 1R.

## 1. Did February genuinely stay unused? NO.
| Use of February | Clean? |
|---|---|
| Traded live, bar by bar, on A2 frozen in January (20 trades, +4.64R) | Clean forward test |
| Frozen A1 A2 A3 B1 B2 B3 run on Feb | Clean out-of-sample: definitions fixed on 01-09, nothing chosen from Feb. The only clean backtest evidence I own |
| C1 run on Feb | C came from a January-week replay, so Feb was unseen for it - and it failed there (-0.08R). Clean fail |
| Loser review | NOT clean: 9 of the 13 losers I studied by eye are February trades; the "chasing" lesson and the pos / yesterday numbers were measured on Jan+Feb together |
| D1, E1, DE | NOT clean: born from that review and run on both months at once. E's 30 pips was read off the same trades |
| H1 on Feb | NOT clean: threshold family came from the review. Its Feb +0.50R vs +0.23R is in-sample, not validation |
| H2, H3 on Feb | I pre-registered that these would NOT be run on February. Today, while building the table below, my script ran all 13 variants on both months and printed them.
  That breaks my own pre-registration. No decision used them (H was already killed), but February is now fully spent for idea H. My error, recorded. |
Conclusion: for anything invented after the review, Jan AND Feb are both in-sample. I have no unseen data left. Nothing new can be validated until unseen months exist.

## 2. All 13 counted variants, by month (ideas 6: A B C D E H)
| Variant | What it is | Jan trades / win / avg R / max DD | Feb trades / win / avg R / max DD | Status of the Feb number |
|---|---|---|---|---|
| A1 | London trend, in 07:00, out 12:00, SL40 | 19 / 68% / +0.56 / 3.02R | 20 / 50% / +0.18 / 2.17R | out-of-sample |
| A2 | same, in 08:00 (TRADED) | 19 / 74% / +0.78 / 1.33R | 20 / 55% / +0.23 / 1.86R | out-of-sample + live |
| A3 | SL40 TP60, hold to 16:00 | 19 / 53% / +0.30 / 3.06R | 20 / 40% / +0.00 / 3.07R | out-of-sample |
| B1 | Asia-range break with trend, SL30, out 12:00 | 13 / 69% / +0.76 / 2.10R | 13 / 54% / +0.32 / 1.05R | out-of-sample |
| B2 | same, TP45, out 16:00 | 13 / 62% / +0.53 / 2.10R | 14 / 57% / +0.34 / 1.71R | out-of-sample |
| B3 | same, SL40, out 12:00 | 13 / 77% / +0.64 / 1.02R | 13 / 54% / +0.23 / 1.02R | out-of-sample |
| C1 | A2 + trade only on trend side of yesterday's midpoint | 12 / 75% / +0.93 / 0.51R | 13 / 38% / -0.08 / 1.52R | out-of-sample, FAILED, dropped |
| D1 | A2 only after a pullback day | 5 / 80% / +0.62 / 1.00R | 9 / 67% / +0.51 / 1.38R | in-sample |
| E1 | A2 with SL30 | 19 / 74% / +1.04 / 1.46R | 20 / 55% / +0.20 / 2.18R | in-sample |
| DE | D1 + E1 | 5 / 80% / +0.91 / 1.01R | 9 / 67% / +0.66 / 1.54R | in-sample |
| H1 | A2 + no-chase, T=0.6 | 12 / 75% / +0.58 / 1.00R | 10 / 70% / +0.50 / 1.50R | in-sample; failed Jan build, KILLED |
| H2 | T=0.7 | 13 / 77% / +0.55 / 1.00R | 13 / 69% / +0.41 / 1.50R | in-sample; run on Feb by my error; KILLED |
| H3 | T=0.8 | 16 / 69% / +0.48 / 1.33R | 16 / 62% / +0.30 / 1.50R | in-sample; run on Feb by my error; KILLED |
Reading it with 13 tries in mind: with this many variants on two months, the best-looking in-sample line (DE, +0.66R in Feb on 9 trades) is what luck alone would produce.
The only numbers that mean something are the six frozen out-of-sample ones: +0.00 to +0.34R per trade on 13-20 trades each = positive, small, not provable.

## 3. Every loss tagged
Definition fixed first: "my mistake" = I broke a written rule (wrong direction vs the trend rule, wrong time, wrong size, wrong stop, moved stop, late/early exit, extra trade).
"valid setup, market disagreed" = taken exactly by the rules and it lost. Hindsight ("I was chasing") is NOT a mistake - that rule did not exist and failed its test when I wrote it.
Checked against sim/trades.csv by script: 34 of 34 trades entered at 08:00, 0.31 lots, 40 pip stop, exit at 12:00 or by stop, max 1 per day; direction matched the trend rule every day
(the mechanical backtest reproduces my February exactly).
| # | Date | Side | R | Exit | Tag |
|---|---|---|---|---|---|
| 6 | Mon 01-19 | sell | -1.00 | stop | valid setup, market disagreed |
| 8 | Wed 01-21 | sell | -0.51 | noon | valid setup, market disagreed |
| 11 | Tue 01-27 | sell | -0.99 | stop | valid setup, market disagreed |
| 14 | Fri 01-30 | buy | -0.02 | noon | valid setup, market disagreed |
| 15 | Mon 02-02 | sell | -0.34 | noon | valid setup, market disagreed |
| 17 | Wed 02-04 | buy | -0.24 | noon | valid setup, market disagreed |
| 19 | Fri 02-06 | buy | -0.19 | noon | valid setup, market disagreed |
| 24 | Fri 02-13 | buy | -0.34 | noon | valid setup, market disagreed |
| 25 | Mon 02-16 | buy | -0.32 | noon | valid setup, market disagreed |
| 27 | Wed 02-18 | buy | -0.47 | noon | valid setup, market disagreed |
| 28 | Thu 02-19 | buy | -0.36 | noon | valid setup, market disagreed |
| 29 | Fri 02-20 | buy | -1.02 | stop | valid setup, market disagreed |
| 34 | Fri 02-27 | sell | -0.23 | noon | valid setup, market disagreed |
13 of 13 valid, 0 mistakes, -6.03R. My one real mistake in two months was not a loss: the discretionary skip on 01-22 (missed about +1.1R).
What this means: my losses are the rule's losses. There is no execution leak to fix; if results are to improve, the RULE has to be better, and that needs clean data.

## 4. ONE hypothesis, written before any run (idea F "straight or crooked"; will be variant 14 when first run)
Observation it rests on (already measured): the no-chase filter cost 7.9R in the trend month and removed ten worthless trades in the box month.
Hypothesis: whether chasing is fine depends on how STRAIGHT the last week's path was, and that can be measured before 08:00.
Measure (never computed on any data yet): efficiency E = |close[-1] - close[-6]| / sum of the five |daily close-to-close changes| between them, on 22:00 UTC closes of full trading days.
E = 1 means five days straight in one direction; E near 0 means back-and-forth.
Rule F (one variant, one fixed number, no alternatives): A2 exactly as frozen; if E >= 0.5 trade every day (trend: chasing allowed);
if E < 0.5 apply the no-chase filter H1 (no trade when 08:00 price is in the far 40% of yesterday's range in my direction).
0.5 is chosen as the plain midpoint before looking at any E value; I will not try other thresholds or other lookbacks.

Kill test, in two gates:
- Gate 1 (Jan-Feb, a test of the MEASURE only, since both months are in-sample for the edge): F is dead immediately unless E >= 0.5 on at least 60% of January's trade days
  AND E < 0.5 on at least 60% of February's trade days. If it cannot tell my one trend month from my one box month, there is nothing to carry forward. Passing gate 1 proves nothing about profit.
- Gate 2 (unseen months only, the real test): F is paper-tagged on every A2 signal day as I trade forward; nothing is evaluated before 40 new signal days. Adopt only if ALL hold:
  F avg R >= A2 avg R + 0.15R on the same days; trades F skipped average <= 0R; F max drawdown <= A2's; F keeps >= 60% of A2's trades.
  Otherwise killed and I do not rescue it with a second threshold.
Until gate 2 is decided the traded rule stays A2 at $125.
Nothing in this section has been run.

## 5. Run notes for idea F, written before the run
- Coach allowed up to 3 variants. I pre-registered ONE (E >= 0.5, 5-day lookback, H1 filter) and "no other thresholds", so I run one: F1 = variant 14. Ideas -> 7.
- E needs six earlier daily closes, so it does not exist before Mon 01-12. Days without E are left out for BOTH A2 and F1 (same days compared). Decided now, before seeing any E.
- Order: gate 1 (does E label Jan straight / Feb crooked), build on January, then February ONCE. February is CONTAMINATED for this idea (the no-chase half was shaped on it): not validation.

## 6. RESULTS of idea F (variant 14 = F1; ideas 7, variants 14). Costs on, $125 risk. Same days for both rules (01-12 onward).
### Gate 1 - does the measure tell my trend month from my box month? PASS
January: E >= 0.5 on 10 of 15 trade days (67%, needed 60%). February: E < 0.5 on 17 of 20 (85%, needed 60%).

### Before vs after
| Period | Rule | Trades | Win rate | Avg R | Net R | Max DD |
|---|---|---|---|---|---|---|
| Jan (build) | A2 before | 15 | 73% | +0.75 | +11.23 | 1.33R |
| Jan (build) | F1 after | 13 | 77% | +0.84 | +10.97 | 1.33R |
| Feb (CONTAMINATED, not validation) | A2 before | 20 | 55% | +0.23 | +4.64 | 1.86R |
| Feb (CONTAMINATED, not validation) | F1 after | 12 | 58% | +0.37 | +4.46 | 1.50R |
| Both | A2 before | 35 | 63% | +0.45 | +15.87 | 1.86R |
| Both | F1 after | 25 | 68% | +0.62 | +15.42 | 1.50R |
Trades F1 skipped: Jan 2 (avg +0.13R: 01-28 +0.28, 01-30 -0.02); Feb 8 (avg +0.02R: -0.24 -0.19 +0.77 +0.34 -0.34 -0.36 +0.19 +0.01).

### Honest reading
- F1 fixes what killed H: it no longer throws away January's trend trades (it kept 01-16 and 01-23). That part of the idea works as designed.
- But it adds nothing: it removes 10 trades worth +0.44R in total, i.e. trades that averaged zero. Avg R rises only because the divisor shrinks; net R is slightly LOWER in both months.
  Drawdown 1.86R -> 1.50R is the one real difference, on 35 trades.
- Even on contaminated February it would miss my own bar: +0.14R per trade better (needed +0.15) and skipped trades averaged +0.02R (needed <= 0).
- The premise underneath is NOT supported: A2 was no better on "straight" days than "crooked" ones (Jan +0.72R vs +0.81R; Feb +0.06R on 3 days vs +0.26R on 17).
  E recognises the month, but does not pick the good days. So I still cannot tell trend from box in a way that pays.
- Verdict: NOT a genuine improvement. Not adopted. Per the pre-registration F1 passed gate 1, so it stays alive only as a paper tag for gate 2 on unseen months; I expect it to fail there.
- Where two months and 14 variants leave me: one frozen rule family with a small positive out-of-sample result (+0.2 to +0.3R per trade, unproven), zero execution mistakes,
  and no filter that survives its own test. More filters cut from these same 39 days would just be fitting. Stopped here; no new candles.

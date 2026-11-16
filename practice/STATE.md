# STATE

| Field | Value |
|---|---|
| Sim clock | Fri 2015-01-30 22:00 UTC (END OF RELEASED DATA - waiting for coach) |
| Phase | Challenge #1, phase 1 ACTIVE: balance $26,256.74 (+5.03%), target $27,000 (+$743 to go), 14 trading days, no breach |
| Current strategy | Rule A2 "London trend": 07:00 UTC write call; trend = yesterday's 22:00 close vs close 3 days earlier; 08:00 market order with trend; SL 40 pips; close 12:00 UTC; 1 trade/day; flat at weekend |
| Risk | $125/trade = 0.5% (0.31 lots x 40 pips). Own max daily loss 0.5% (1 trade/day). Reason: untested beginner rule; 20 straight losses to hit max loss |
| Ideas tried | 2 (A London trend-follow, B Asia-range breakout with trend) |
| Variants tested | 6 (A1 A2 A3, B1 B2 B3) - at the 3-per-idea cap for both |
| Challenge attempts | 1 (active) |
| Last updated (real date) | 2026-11-16 |

## Results (costs on: 1.0 pip spread + 0.1 slippage)
| Period | Trades | Win rate | Avg R | Net R | Max drawdown | Notes |
|---|---|---|---|---|---|---|
| LIVE sim 01-12..01-30 rule A2 | 14 | 71% | +0.72 | +10.04 (+$1,257) | 1.33R | 2 shock-day trades = +6.3R (luck tag); rest +3.7R in 12 |
| Backtest A1 (07:00 entry, out 12:00) Jan 2015 | 19 | 68% | +0.56 | +10.64 | 3.02R | mechanical, no skip |
| Backtest A2 (08:00 entry, out 12:00) Jan 2015 | 19 | 74% | +0.78 | +14.79 | 1.33R | the traded rule; includes 4 trades from the week I only watched and the 1 day I skipped live |
| Backtest A3 (SL40 TP60, hold to 16:00) | 19 | 53% | +0.30 | +5.78 | 3.06R | |
| Backtest B1 (Asia break, SL30, out 12:00) | 13 | 69% | +0.76 | +9.92 | 2.10R | |
| Backtest B2 (SL30 TP45, out 16:00) | 13 | 62% | +0.53 | +6.89 | 2.10R | |
| Backtest B3 (SL40, out 12:00) | 13 | 77% | +0.64 | +8.37 | 1.02R | |
| Paper calls W01-W02 (direction of day) | 6 | 83% | - | - | - | one trend, not evidence |

## Honest read
- One month, one giant downtrend (1.21 -> 1.11). Every variant of both ideas "works" = the month was the edge, not the rule. Looks like luck until other months agree.
- Backtests ran on history I had already lived (walk-forward each time), but the rule was born inside this same month: in-sample.
- My discretion: 1 skip (cost ~+1.1R), doubts right 1, wrong 2. No proven value -> follow the rule.
- Learned basics: pip/spread cost vs hourly range, Asia quiet / London trend leg / NY reversals and news spikes (13:30 & 19:00 UTC), weekend gaps (-50 pips twice), old lows turn into ceilings.

## Next step
1. `git pull origin main`; `python sim.py advance --until 2015-02-02T07:00`; `./look.sh`; journal call (new file journal/2015-W06.md); `python trade_a.py sell|buy|skip`.
2. Keep rule A2 and $125 risk unchanged until phase 1 resolves or 20 more trades. Phase 1 needs ~+6R more.
3. Queued ideas (new idea C = a different trend filter / Asia-against-trend skip) only after >= 2 more months lived; backtest on lived history only.
Tools: look.sh (multi-TF view), trade_a.py (executes the written plan), bt/ideas.py (backtests). Run tests with `python -m pytest -q` (plain `pytest` uses a different interpreter here).

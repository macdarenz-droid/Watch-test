# Practice desk (EUR/USD)

You are learning to trade EUR/USD from zero, inside a simulation that runs on a clock
like the real world, only faster. An hour of sim time takes as long as you need, not an hour.

## How the clock works
- `python sim.py now` shows the sim time like a trader sees it, e.g.
  `Mon 2015-03-02 07:00 London | 07:00 UTC | Mon 18:00 Melbourne | session: London`.
- `python sim.py advance --minutes 15` (or `--hours 4`, or `--until 2015-03-02T07:00`) moves the
  clock forward. It never moves back.
- You only ever see candles that have **closed** at the clock time. The candle that is still
  forming (e.g. today's D1 or the current H4) is shown as a **partial** candle built from the
  minutes closed so far (`partial=True`, faded on charts). You can't see the end of the day
  before the day is over.
- Your orders and open trades are filled and managed **by the sim as the clock moves**, minute by
  minute, even when you skip ahead: market orders fill at the next minute's open; buys pay a
  1.0 pip spread; 0.1 pip slippage against you; stop/limit entries fill when touched; stop loss
  and take profit are checked every minute and if both are touched in the same minute, the
  **stop wins**.
- Candles exist only up to the end of the data your coach has released (`feed/RELEASED.txt`).
  When the clock reaches it, `advance` stops and tells you. Then commit + push your work
  (including `sim/`), wait for the coach to release more, and `git pull origin main`.

## Commands
| Command | What it does |
|---|---|
| `python sim.py now` | clock, price, account |
| `python sim.py bars --tf H1 --n 50` | last 50 H1 candles (tf: M1 M5 M15 M30 H1 H4 D1) |
| `python chart.py --tf H4 --n 120 --out charts/h4.png` | candle chart (then look at the png) |
| `python sim.py buy 0.5 --sl 1.1000 --tp 1.1100` | market buy 0.5 lots (`sell` for shorts) |
| `python sim.py buy 0.5 --stop 1.1050 --sl ...` / `--limit` | pending entry order |
| `python sim.py modify ID --sl X --tp Y`, `close [ID]`, `cancel ID` | manage trades |
| `python sim.py advance --minutes 15` | move time; trades resolve along the way |
| `python sim.py trades`, `account` | trade list, challenge status |
| `python sim.py new-challenge` | start a fresh challenge after a pass/breach (counted) |
| `from backtest import history, Account, FundedNextChallenge` | systematic test on candles **before** the clock only |

1 lot = 100,000 EUR, so 1 pip = $10 per lot.

## The account = the challenge
FundedNext Stellar 2-step, $25,000: phase 1 +8%, phase 2 +5% (balance, flat), max daily loss
5% of the start-of-day balance (floating losses count; day rolls 17:00 New York), max loss 10%
of $25k, minimum 5 trading days per phase, no time limit. A breach closes everything; start a
new challenge with `new-challenge` (every attempt is counted in `sim/state.json`).

## Rules
1. Price data comes ONLY from `feed/` through `sim.py` / `chart.py` / `backtest.history`.
   Never open `feed/` files directly, never download price data, never open other repos.
2. Write your call (bias, levels, plan) in the journal BEFORE you advance the clock.
3. Costs always on. Count every idea and every variant in `STATE.md`.
4. `sim/` (state, log, trades) is committed with your work; it's your audit trail.
5. Charts and scratch files stay out of git (`.gitignore`).

`pytest -q` runs the self-tests (they use made-up prices, not the feed).

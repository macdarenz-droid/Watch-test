# FUNDED TRACKER - $25,000 FundedNext funded account (start Fri 2015-03-27). Rule A2, 0.50% per trade. Lines: daily -5%, max loss $22,500. My brakes: half size at -3% from high-water, stop at -5%.
Payout dates (every 14 days): 04-10, 04-24, 05-08, 05-22, ...   Split 80%.   R = result / amount risked.

## Daily log
| Funded day | Date | Side | Lots | R | $ P&L | Balance | High-water | Drawdown from high-water | Month-to-date R | Tag | Payout |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | Fri 2015-03-27 | sell | 0.31 | -1.00 | -122.45 | 24,877.55 | 25,000.00 | -0.49% | -1.00 | valid setup, market disagreed | - (next date 04-10) |
| 2 | Mon 2015-03-30 | sell | 0.31 | +0.84 | +105.09 | 24,982.64 | 25,000.00 | -0.07% | -0.16 | valid (win) | - |
| 3 | Tue 2015-03-31 | sell | 0.31 | +1.14 | +141.67 | 25,124.31 | 25,124.31 | 0.00% | +0.98 | valid (win) | - |
| 4 | Wed 2015-04-01 | sell | 0.31 | +0.09 | +11.47 | 25,135.78 | 25,135.78 | 0.00% | +0.09 (April) | valid (win) | - |
| 5 | Thu 2015-04-02 | sell | 0.31 | -0.25 | -30.69 | 25,105.09 | 25,135.78 | -0.12% | -0.16 (April) | valid setup, market disagreed | - |
| 6 | Fri 2015-04-03 | buy | 0.31 | +0.07 | +9.30 | 25,114.39 | 25,135.78 | -0.09% | -0.09 (April) | valid (win) | - |
| 7 | Mon 2015-04-06 | buy | 0.31 | +0.27 | +33.79 | 25,148.18 | 25,148.18 | 0.00% | +0.18 (April) | valid (win) | - |
| 8 | Tue 2015-04-07 | buy | 0.31 | -1.00 | -127.10 | 25,021.08 | 25,148.18 | -0.51% | -0.82 (April) | valid setup, market disagreed | - |
| 9 | Wed 2015-04-08 | sell | 0.31 | -1.00 | -124.31 | 24,896.77 | 25,148.18 | -1.00% | -1.82 (April) | valid setup, market disagreed | - |
| 10 | Thu 2015-04-09 | sell | 0.31 | +0.33 | +41.54 | 24,938.31 | 25,148.18 | -0.83% | -1.49 (April) | valid (win) | - |
| 11 | Fri 2015-04-10 | sell | 0.31 | +1.62 | +199.33 | 25,137.64 (25,068.82 after payout) | 25,148.18 -> reset 25,068.82 | -0.04% -> 0.00% | +0.13 (April) | valid (win) | - |
| 12 | Mon 2015-04-13 | sell | 0.31 | +1.94 | +243.04 | 25,311.86 (sim 25,380.68) | 25,311.86 | 0.00% | +2.07 (April) | valid (win) | - |
| 13 | Tue 2015-04-14 | sell | 0.31 | -0.62 | -76.88 | 25,234.98 (sim 25,303.80) | 25,311.86 | -0.30% | +1.45 (April) | valid setup, market disagreed | - |
| 14 | Wed 2015-04-15 | sell | 0.31 | +1.48 | +185.38 | 25,420.36 (sim 25,489.18) | 25,420.36 | 0.00% | +2.93 (April) | valid (win) | - |
| 15 | Thu 2015-04-16 | buy | 0.31 | -1.00 | -127.10 | 25,293.26 (sim 25,362.08) | 25,420.36 | -0.50% | +1.93 (April) | valid setup, market disagreed | - |

## Monthly summary
| Month | Trades | Wins | Net R | $ P&L | Worst day | Deepest drawdown | Valid / mistake tags | Payouts requested | My 80% |
|---|---|---|---|---|---|---|---|---|---|
| Mar 2015 (from 03-27) | 3 | 2 | +0.98 | +124.31 | -0.49% | -0.49% | 3 valid / 0 mistake (process mistakes: 1) | 0 | 0 |

## Payout ledger
| Date | Balance before | Requested | My 80% | Balance after | Note |
|---|---|---|---|---|---|
| Fri 2015-04-10 | 25,137.64 | 68.82 (half of the $137.64 above $25,000; buffer not built yet) | 55.06 | 25,068.82 | first payout date; high-water reset to 25,068.82; sim balance stays 25,137.64 (offset -68.82). Unknown: whether the firm has a minimum payout amount |

## Process mistakes log (separate from trade tags; a process mistake is something I did wrong AROUND a trade)
| # | Date | What happened | Effect on the trade | Fix |
|---|---|---|---|---|
| P1 | Mon 2015-03-30 | London had moved to summer time on 03-29 and I did not check: I advanced the sim clock to 07:00 UTC (= 08:00 London) as on every winter day, so the call was written AT the entry time instead of before the entry bar opened | none on the order (side, time, size and stop were the rule's; tagged VALID as a trade) - but I had seen one more hour of candles than my process allows when writing the notes | coach ruling 03-31: London time from now on, call always before the entry bar; trade_a.py --london converts for me; no written call before 08:00 London = no trade that day |
| P2 | Fri 2015-04-03 | While computing how many trades a test needs, my script printed the paired difference vs A2 for five old exit/stop variants over ALL lived months, March included. For three of them (X1 break-even, TR30 trailing, E1 30-pip stop) March had deliberately NOT been run | none on any trade or decision; but the clean month is now spent for those three variants, and I have seen that E1 averaged +0.12R per trade better than A2 over 64 trades | research scripts must take an explicit end date (2015-02-01 for builds) - no script may default to "all history"; logged; E1 handled in the open (journal/2015-sample-size-rule.md) |
| P3 | Wed 2015-04-08 (found 04-17) | In the journal's result note I wrote "by noon it was back at 1.0843": a UTC hour read as a London hour. At 12:00 London price was 1.0872 | none on the trade (it was already stopped) - but the note made a valid loss look like "right side, robbed by 2 pips", and that story helped me choose a test | on a stop-out day the result line must give the price at 12:00 London and its distance from my entry, read from the engine |
Earlier record-keeping slips, for completeness (challenge stage, none changed a trade): invented backtest numbers in STATE once (fixed the same turn); H2/H3 run on February against my
pre-registration; worst losing run overstated as -2.17R (was -1.86R); a journal edit on 03-25 cut out a section (restored from git on 03-26).

## Status line (update every day)
After funded day 15 (04-16): tracker balance $25,293.26 (sim $25,362.08 minus $68.82 paid out) | high-water $25,420.36 | drawdown -0.50% (deepest so far -1.00%; first brake at -3% = $24,657.75, stop at -5% = $24,149.34, account line $22,500) | funded total +2.91R in 15 trades (9 wins, 6 valid losses) | March: +0.98R in 3 trades | April MTD: +1.93R (12 trades, 7 wins) | TRADE tags: 15 valid, 0 my mistake | PROCESS mistakes: 3 | payouts 1: $68.82 requested, $55.06 mine | next payout date Fri 04-24.

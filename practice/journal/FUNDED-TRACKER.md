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

## Monthly summary
| Month | Trades | Wins | Net R | $ P&L | Worst day | Deepest drawdown | Valid / mistake tags | Payouts requested | My 80% |
|---|---|---|---|---|---|---|---|---|---|
| Mar 2015 (from 03-27) | 3 | 2 | +0.98 | +124.31 | -0.49% | -0.49% | 3 valid / 0 mistake (process mistakes: 1) | 0 | 0 |

## Payout ledger
| Date | Balance before | Requested | My 80% | Balance after | Note |
|---|---|---|---|---|---|

## Process mistakes log (separate from trade tags; a process mistake is something I did wrong AROUND a trade)
| # | Date | What happened | Effect on the trade | Fix |
|---|---|---|---|---|
| P1 | Mon 2015-03-30 | London had moved to summer time on 03-29 and I did not check: I advanced the sim clock to 07:00 UTC (= 08:00 London) as on every winter day, so the call was written AT the entry time instead of before the entry bar opened | none on the order (side, time, size and stop were the rule's; tagged VALID as a trade) - but I had seen one more hour of candles than my process allows when writing the notes | coach ruling 03-31: London time from now on, call always before the entry bar; trade_a.py --london converts for me; no written call before 08:00 London = no trade that day |
| P2 | Fri 2015-04-03 | While computing how many trades a test needs, my script printed the paired difference vs A2 for five old exit/stop variants over ALL lived months, March included. For three of them (X1 break-even, TR30 trailing, E1 30-pip stop) March had deliberately NOT been run | none on any trade or decision; but the clean month is now spent for those three variants, and I have seen that E1 averaged +0.12R per trade better than A2 over 64 trades | research scripts must take an explicit end date (2015-02-01 for builds) - no script may default to "all history"; logged; E1 handled in the open (journal/2015-sample-size-rule.md) |
Earlier record-keeping slips, for completeness (challenge stage, none changed a trade): invented backtest numbers in STATE once (fixed the same turn); H2/H3 run on February against my
pre-registration; worst losing run overstated as -2.17R (was -1.86R); a journal edit on 03-25 cut out a section (restored from git on 03-26).

## Status line (update every day)
After funded day 6 (04-03, end of week 14): balance $25,114.39 | high-water $25,135.78 | drawdown -0.09% (brake at -3%, stop at -5%, account line $22,500) | March: +0.98R in 3 trades | April MTD: -0.09R (3 trades, 2 wins) | TRADE tags: 6 valid (4 wins, 2 losses "valid setup, market disagreed"), 0 my mistake | PROCESS mistakes: 2 (P1 DST slip, P2 research script touched March) | payouts 0 | next payout date 04-10.

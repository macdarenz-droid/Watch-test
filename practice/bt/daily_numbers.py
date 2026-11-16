"""Print the day's bookkeeping numbers from my trade log, so nothing in the journal is added up by hand.
usage: python bt/daily_numbers.py PAID_OUT_TOTAL HIGH_WATER_BEFORE_TODAY   (e.g. 125.70 25571.80)"""
import sys, os, pandas as pd, numpy as np
paid, hw0 = float(sys.argv[1]), float(sys.argv[2])
t = pd.read_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim", "trades.csv"), parse_dates=["entry_time", "exit_time"])
t["risk"] = (t.sl - t.entry).abs() * t.lots * 1e5; t["R"] = t.pnl / t.risk; t["pips_stop"] = (t.sl - t.entry).abs() * 1e4
f = t[t.entry_time >= "2015-03-27"]; l = t[t.entry_time >= "2015-03-02"]; last = t.iloc[-1]
print(f"LAST TRADE {last.entry_time.date()} side {int(last.side)} entry {last.entry:.5f} sl {last.sl:.5f} exit {last.exit:.5f} @{last.exit_time.strftime('%H:%M')} UTC {last.reason} | stop distance {last.pips_stop:.1f} pips | risk ${last.risk:.2f} | pnl ${last.pnl:+.2f} | R {last.R:+.2f}")
simbal = 25000 + f.pnl.sum(); bal = simbal - paid; hw = max(hw0, bal); dd = 100 * (bal - hw) / hw
print(f"FUNDED: sim balance ${simbal:,.2f} | tracker balance ${bal:,.2f} (paid out ${paid:.2f}) | high-water ${hw:,.2f}{' (NEW)' if bal > hw0 else ''} | drawdown {dd:.2f}% | trigger 1 (-3%) ${hw*0.97:,.2f} | trigger 2 (-5%) ${hw*0.95:,.2f}")
print(f"FUNDED totals: {len(f)} trades, {int((f.R>0).sum())} wins, {int((f.R<=0).sum())} losses, {f.R.sum():+.2f}R | by month: " + " | ".join(f"{m}: {len(g)} trades {int((g.R>0).sum())} wins {g.R.sum():+.2f}R ${g.pnl.sum():+.2f}" for m, g in f.groupby(f.entry_time.dt.strftime('%Y-%m'))))
wk = f[f.entry_time.dt.isocalendar().week == last.entry_time.isocalendar().week]; print(f"THIS WEEK: " + " ".join(f"{r:+.2f}" for r in wk.R) + f" = {wk.R.sum():+.2f}R in {len(wk)} trades, ${wk.pnl.sum():+.2f}")
eq = l.R.cumsum(); mdd = (eq.cummax().clip(lower=0) - eq).max(); losses = t[t.R <= 0]
print(f"FORWARD (from 03-02): {len(l)} trades, {int((l.R>0).sum())} wins, {l.R.sum():+.2f}R, avg {l.R.mean():+.2f}R, max DD {mdd:.2f}R | all live losses in the log: {len(losses)} ({losses.R.sum():+.2f}R)")

"""Running LIVE vs BACKTEST table for A2 (coach, 04-20). Backtest = engine A2 on the days before I traded forward one day at a time (01-06..02-27).
Live = my own trade log (sim/trades.csv) from 03-02, as traded, R = result / amount risked. Third column = the engine on the same live days (execution check).
usage: python bt/live_vs_bt.py END [--md]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; LIVE0 = "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): e = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
E = e.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), stop=("reason", lambda x: (x == "sl").any()))
t = pd.read_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim", "trades.csv"), parse_dates=["entry_time"]); t = t[t.entry_time >= LIVE0]
t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5); t["tag"] = t.entry_time.dt.strftime("%Y-%m-%d"); L = t.set_index("tag")[["R", "side"]].assign(stop=(t.reason == "sl").values)
cols = [("Backtest Jan-Feb (engine)", E[E.index < LIVE0]), ("LIVE from 03-02 (as traded)", L), ("Engine on the live days", E[E.index >= LIVE0])]
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
rows = [("Trades", lambda x: f"{len(x)}"), ("Win rate", lambda x: f"{100*(x.R>0).mean():.0f}%"), ("Avg R", lambda x: f"{x.R.mean():+.2f}"), ("+- 2 standard errors", lambda x: f"{2*x.R.std(ddof=1)/np.sqrt(len(x)):.2f}"),
        ("Net R", lambda x: f"{x.R.sum():+.2f}"), ("Avg win / avg loss", lambda x: f"{x.R[x.R>0].mean():+.2f} / {x.R[x.R<=0].mean():+.2f}"), ("Full stops", lambda x: f"{int(x.stop.sum())} ({100*x.stop.mean():.0f}%)"),
        ("Max drawdown", lambda x: f"{dd(x.R):.2f}R"), ("Worst 10 trades in a row", lambda x: f"{x.R.rolling(10).sum().min():+.2f}R"),
        ("Sells: n, avg R", lambda x: f"{int((x.side<0).sum())}, {x.R[x.side<0].mean():+.2f}"), ("Buys: n, avg R", lambda x: f"{int((x.side>0).sum())}, {x.R[x.side>0].mean():+.2f}")]
bt, lv = cols[0][1].R, cols[1][1].R; diff = lv.mean() - bt.mean(); se = np.sqrt(lv.var(ddof=1)/len(lv) + bt.var(ddof=1)/len(bt))
feb = E[(E.index >= "2015-02-01") & (E.index < LIVE0)].R
print("| | " + " | ".join(c for c, _ in cols) + " |\n|---|---|---|---|")
for name, f in rows: print(f"| {name} | " + " | ".join(f(x) for _, x in cols) + " |")
print(f"Live minus backtest: {diff:+.2f}R per trade (noise band +-{2*se:.2f}R) -> {'inside the noise' if abs(diff) <= 2*se else 'OUTSIDE the noise'}. Live vs February alone ({feb.mean():+.2f}R, {len(feb)} trades): {lv.mean()-feb.mean():+.2f}R. "
      f"As traded vs engine on the same days: {lv.sum()-cols[2][1].R.sum():+.2f}R over {len(lv)} trades (fills and rounding).")
print(f"Rule alarm (40 live trades: avg >= +0.10R, max DD <= 8R): {len(lv)} done, avg {lv.mean():+.2f}R, max DD {dd(lv):.2f}R. Planning edge +0.18R: live is {lv.mean()-0.18:+.2f}R above it.")

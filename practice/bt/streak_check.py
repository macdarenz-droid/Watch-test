"""Is my live losing run / drawdown inside the normal range of the backtest? Reshuffles of the A2 engine lists. usage: python bt/streak_check.py END"""
import sys, io, contextlib, os, itertools
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; LIVE0 = "2015-03-02"; N = 20000
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): e = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
E = e.groupby("tag").agg(R=("R", "sum"), stop=("reason", lambda x: (x == "sl").any()))
t = pd.read_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim", "trades.csv"), parse_dates=["entry_time"]); t = t[t.entry_time >= LIVE0]
t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5); L = pd.DataFrame({"R": t.R.values, "stop": (t.reason == "sl").values})
bt = E[E.index < LIVE0]; allA = E
def run_len(r): return max((len(list(g)) for k, g in itertools.groupby(r <= 0) if k), default=0)
def dd(r): eq = np.cumsum(r); return (np.maximum.accumulate(np.maximum(eq, 0)) - eq).max()
def desc(n, x): return f"{n}: {len(x)} trades | losers {100*(x.R<=0).mean():.0f}% | full stops {100*x.stop.mean():.0f}% | avg loss {x.R[x.R<=0].mean():+.2f}R | avg win {x.R[x.R>0].mean():+.2f}R | avg {x.R.mean():+.2f}R | longest losing run {run_len(x.R.values)} | max DD {dd(x.R.values):.2f}R"
print(desc("Backtest Jan-Feb", bt)); print(desc("LIVE as traded   ", L)); print(desc("All A2 (engine)  ", allA))
n = len(L); ev_run, ev_dd = run_len(L.R.values), dd(L.R.values)
print(f"event in {n} live trades: losing run {ev_run}, max drawdown {ev_dd:.2f}R")
rng = np.random.default_rng(7)
for name, lst in (("backtest list (Jan-Feb)", bt.R.values), ("all A2 trades", allA.R.values), ("live list itself", L.R.values)):
    S = rng.choice(lst, size=(N, n)); runs = np.array([run_len(s) for s in S]); dds = np.array([dd(s) for s in S])
    print(f"reshuffles of the {name}: losing run >= {ev_run}: {100*(runs>=ev_run).mean():.1f}% | max DD >= {ev_dd:.2f}R: {100*(dds>=ev_dd).mean():.1f}% | median longest run {int(np.median(runs))}, 95th pct {int(np.percentile(runs,95))} | median max DD {np.median(dds):.2f}R, 95th pct {np.percentile(dds,95):.2f}R")

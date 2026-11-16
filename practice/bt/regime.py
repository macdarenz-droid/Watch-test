"""Idea R: do simple detectors, computed from daily data finished BEFORE the trade day, separate A2's good days from its bad ones?
usage: python bt/regime.py START END   (one month window; nothing after END is loaded)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
a, b = sys.argv[1], sys.argv[2]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): T = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
T["day"] = T.entry_time.dt.date
g = m5.groupby("day"); cl = g["close"].last(); rng = g["high"].max() - g["low"].min(); days = list(cl.index)
lab = {"R1": {}, "R2": {}, "R3": {}}
for d in T.day:
    i = days.index(d)
    if i >= 5:
        c = cl.iloc[i-5:i]; lab["R1"][d] = bool(c.iloc[-1] >= c.max() or c.iloc[-1] <= c.min())
    if i >= 6:
        lab["R2"][d] = bool(rng.iloc[i-1] >= rng.iloc[i-6:i-1].mean())
    prev = T[T.day < d].R.tail(5)
    if len(prev) == 5: lab["R3"][d] = bool(prev.sum() > 0)
W = T[T.entry_time >= pd.Timestamp(a, tz="UTC")]
def st(x): return f"n={len(x):2d} win={100*(x.R>0).mean() if len(x) else 0:3.0f}% avg={x.R.mean() if len(x) else float('nan'):+.2f} net={x.R.sum():+6.2f}"
print(a, "..", b, "| A2 all:", st(W))
for k in ("R1", "R2", "R3"):
    x = W[W.day.isin(lab[k].keys())].copy(); x["trend"] = x.day.map(lab[k]); tr, bx = x[x.trend], x[~x.trend]
    gap = tr.R.mean() - bx.R.mean() if len(tr) and len(bx) else float("nan")
    big = x.R.idxmax(); y = x.drop(index=big); gap2 = y[y.trend].R.mean() - y[~y.trend].R.mean()
    print(f"  {k}: labelled {len(x)} days, TREND on {100*len(tr)/len(x):.0f}% | TREND {st(tr)} | BOX {st(bx)} | gap {gap:+.2f}R | gap without biggest day ({str(x.entry_time[big])[5:10]} {x.R[big]:+.2f}) {gap2:+.2f}R")

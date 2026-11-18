"""Idea UP: A2 by the DIRECTION of the 10-day trend (last 22:00 close vs the close 10 trading days earlier). Health check with kill lines U1-U4.
usage: python bt/trend_dir.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
g = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first")); cl = m5.groupby("day")["close"].last(); ds = [str(d) for d in cl.index]
def big(d):
    i = ds.index(d); return np.nan if i - 11 < 0 else (1.0 if cl.iloc[i-1] > cl.iloc[i-11] else -1.0)
g["big"] = [big(d) for d in g.index]
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; i = ds.index(d); print(d, "prev close", round(cl.iloc[i-1], 5), "| 10 back", ds[i-11], round(cl.iloc[i-11], 5), "| big", g.big[d], "| side", int(g.side[d]))
    print("days", len(g), "up", int((g.big > 0).sum()), "down", int((g.big < 0).sum()), "undefined", int(g.big.isna().sum()), "| history low", round(m5.low.min(), 5), "on", m5.loc[m5.low.idxmin(), "day"]); sys.exit()
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f}" if len(x) else "n= 0"
U, D = g[g.big > 0], g[g.big < 0]; se = np.sqrt(U.R.var(ddof=1)/len(U) + D.R.var(ddof=1)/len(D))
print(f"A2 to {END}: {st(g.R)}"); print(f"10-day trend UP  : {st(U.R)} | buys {st(U.R[U.side>0])} | sells {st(U.R[U.side<0])}"); print(f"10-day trend DOWN: {st(D.R)} | buys {st(D.R[D.side>0])} | sells {st(D.R[D.side<0])}")
print(f"difference down - up: {D.R.mean()-U.R.mean():+.3f}R (two standard errors +-{2*se:.2f}R)")
h = len(U) // 2; a, b = U.R.iloc[:h], U.R.iloc[h:]; print(f"up-trend days in date order: first {len(a)} ({U.index[0]}..{U.index[h-1]}): {st(a)} | last {len(b)} ({U.index[h]}..{U.index[-1]}): {st(b)}")
print("up-trend days by month: " + " | ".join(f"{m}: {st(x)}" for m, x in U.R.groupby(U.index.str[:7])))
u1 = U.R.mean() >= 0.10; u2 = U.R.mean() >= D.R.mean() / 3; u3 = a.sum() > 0 and b.sum() > 0; u4 = U.R[U.side > 0].sum() > 0
print(f"U1 avg >= +0.10: {'PASS' if u1 else 'FAIL'} | U2 >= a third of down-trend avg ({D.R.mean()/3:+.3f}): {'PASS' if u2 else 'FAIL'} | U3 both halves positive: {'PASS' if u3 else 'FAIL'} | U4 buys on up-trend days net positive: {'PASS' if u4 else 'FAIL'} -> hypothesis {'SURVIVES' if u1 and u2 and u3 and u4 else 'KILLED'}")

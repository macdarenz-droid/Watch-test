"""Before/after for an EXIT variant vs A2 on ONE month window (same entries). usage: python bt/ab_exit.py T1[,T2] START END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
def st(t):
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f}"
ks, a, b = sys.argv[1].split(","), sys.argv[2], sys.argv[3]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
A = get("A2"); print(a, "..", b); print("  A2 ", st(A))
for k in ks:
    V = get(k); m = A.merge(V, on="entry_time", suffixes=("_a", "_v")); cut = m[(m.exit_time_v < m.exit_time_a)]
    rest = cut.R_a - cut.R_v
    print(f"  {k} ", st(V), f"| cut early: {len(cut)}, what they did 09:00->exit under A2: avg {rest.mean():+.2f}R sum {rest.sum():+.2f}R")
    print("     cut:", " ".join(f"{str(r.entry_time)[5:10]} {r.R_v:+.2f}(A2 {r.R_a:+.2f})" for r in cut.itertuples()))

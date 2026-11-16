"""Variants with their own direction vs A2 on the SAME days, ONE month window. usage: python bt/ab_same.py L1,L2,L3 START END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
def st(t):
    if len(t) == 0: return "n= 0"
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f}"
ks, a, b = sys.argv[1].split(","), sys.argv[2], sys.argv[3]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
A = get("A2"); print(a, "..", b, "| A2 all days:", st(A))
for k in ks:
    V = get(k); As = A[A.entry_time.isin(V.entry_time)].reset_index(drop=True)
    m = As.merge(V, on="entry_time", suffixes=("_a", "_v")); diff = m[m.side_a != m.side_v]
    print(f"  {k}  {st(V)} | A2 same days {st(As)} | days with a different side: {len(diff)} (on those: {k} {diff.R_v.sum():+.2f}R, A2 {diff.R_a.sum():+.2f}R)")

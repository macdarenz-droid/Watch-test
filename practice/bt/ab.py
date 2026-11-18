"""Before/after for ONE variant vs A2 on ONE month window (so I never touch a month by accident).
usage: python bt/ab.py G1 2015-01-01 2015-02-01 [--drop=2015-01-19]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
def st(t):
    if len(t) == 0: return "n= 0"
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f}"
k, a, b = sys.argv[1:4]; drop = [x.split("=")[1] for x in sys.argv[4:] if x.startswith("--drop=")]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]      # nothing after the window is even loaded
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
A, V = get("A2"), get(k)
def show(tag, A, V):
    sk = A[~A.entry_time.isin(V.entry_time)]
    print(tag); print("  A2     ", st(A)); print(f"  {k}     ", st(V)); print("  skipped", st(sk), " ".join(f"{str(r.entry_time)[5:10]}{r.R:+.2f}" for r in sk.itertuples()))
show(f"{a} .. {b}", A, V)
for d in drop:
    f = lambda t: t[t.entry_time.dt.strftime("%Y-%m-%d") != d].reset_index(drop=True)
    show(f"  without {d}", f(A), f(V))

"""Filter variants vs A2 on ONE window with a LIST of days removed from the judging. usage: python bt/ab_drop.py NM1,NM2 START END --drop=2015-01-15,2015-01-19"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
ks, a, b = sys.argv[1].split(","), sys.argv[2], sys.argv[3]; drop = next((x.split("=")[1].split(",") for x in sys.argv[4:] if x.startswith("--drop=")), [])
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    t = t[t.entry_time >= pd.Timestamp(a, tz="UTC")]; return t[~t.entry_time.dt.strftime("%Y-%m-%d").isin(drop)].reset_index(drop=True)
def st(t):
    if len(t) == 0: return "n= 0"
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max(); return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f}"
A = get("A2"); print(a, "..", b, "without", ",".join(d[5:] for d in drop) or "-"); print("  A2  ", st(A))
for k in ks:
    V = get(k); sk = A[~A.entry_time.isin(V.entry_time)]
    print(f"  {k} kept {st(V)} ({100*len(V)/len(A):.0f}% kept) | skipped {st(sk)}"); print("      skipped:", " ".join(f"{str(r.entry_time)[5:10]}{r.R:+.2f}" for r in sk.itertuples()))

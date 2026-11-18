"""Same-trade EXIT variant vs A2, all history with an explicit end date, split by period. "Changed" = the variant's result differs from A2's that day.
usage: python bt/ab_exit_period.py FH1,FH2,FH3 END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
ks, b = sys.argv[1].split(","), sys.argv[2]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t.groupby("tag").R.sum()
A = get("A2"); T1 = get("T1"); per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
P = pd.Series(A.index.map(per), index=A.index)
print(f"A2 to {b}: n={len(A)} avg={A.mean():+.3f} net={A.sum():+.2f} dd={dd(A):.2f} | " + " ".join(f"{p} {A[P==p].sum():+.2f}" for p in ("Jan", "Feb", "Mar-now")))
t1 = set(A.index[(T1 - A).abs() > 1e-9])
for k in ks:
    V = get(k).reindex(A.index); assert V.notna().all()
    ch = A.index[(V - A).abs() > 1e-9]; gave = (A[ch] - V[ch])
    print(f"{k}: avg={V.mean():+.3f} (vs A2 {V.mean()-A.mean():+.3f}) net={V.sum():+.2f} dd={dd(V):.2f} | closed early {len(ch)} days: A2 there {A[ch].mean():+.2f}, variant {V[ch].mean():+.2f}, given up (A2 - variant) {gave.mean():+.3f}R/day, sum {gave.sum():+.2f} | of these also closed by T1: {len(set(ch) & t1)}")
    print("     net by period (variant vs A2): " + " | ".join(f"{p} {V[P==p].sum():+.2f} vs {A[P==p].sum():+.2f} ({V[P==p].sum()-A[P==p].sum():+.2f}, {int((P[ch]==p).sum())} closed)" for p in ("Jan", "Feb", "Mar-now")))
    big = gave.sort_values(); print("     biggest given up: " + " ".join(f"{d[5:]}{v:+.2f}" for d, v in big.tail(4).items()) + " | biggest saved: " + " ".join(f"{d[5:]}{v:+.2f}" for d, v in big.head(4).items()))

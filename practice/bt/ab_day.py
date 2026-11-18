"""Variants that may open several positions a day vs A2, compared PER DAY, on ONE window with an explicit end date. usage: python bt/ab_day.py SO40,SO20 START END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
ks, a, b = sys.argv[1].split(","), sys.argv[2], sys.argv[3]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    t = t[t.entry_time >= pd.Timestamp(a, tz="UTC")]; return t.groupby("tag").R.sum().sort_index()
def st(r):
    eq = r.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max(); return len(r), 100 * (r > 0).mean(), r.mean(), r.sum(), dd, r.sum() / dd, r.std(ddof=1)
A = get("A2"); sa = st(A); print(a, "..", b)
print(f"  A2      days={sa[0]} win={sa[1]:.0f}% avg={sa[2]:+.2f} net={sa[3]:+.2f} dd={sa[4]:.2f} score={sa[5]:.1f} sd/day={sa[6]:.2f}")
for k in ks:
    V = get(k); sv = st(V); d = (V - A)
    print(f"  {k:7s} days={sv[0]} win={sv[1]:.0f}% avg={sv[2]:+.2f} net={sv[3]:+.2f} ({100*sv[3]/sa[3]:.0f}% of A2) dd={sv[4]:.2f} score={sv[5]:.1f} ({sv[5]/sa[5]:.2f}x A2) sd/day={sv[6]:.2f} | days changed {int((d.abs()>0.005).sum())}: better {int((d>0.005).sum())}, worse {int((d<-0.005).sum())}")

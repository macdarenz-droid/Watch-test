"""Same-entry variants vs A2 judged on net R AND drawdown (score = net R / max DD), ONE month window. usage: python bt/ab_score.py V1,V2,V3 START END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
ks, a, b = sys.argv[1].split(","), sys.argv[2], sys.argv[3]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
def st(t):
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max(); return len(t), 100 * (t.R > 0).mean(), t.R.mean(), t.R.sum(), dd, t.R.sum() / dd, int((t.reason == "sl").sum()), t.R.min()
A = st(get("A2")); print(a, "..", b)
print(f"  A2  n={A[0]} win={A[1]:.0f}% avg={A[2]:+.2f} net={A[3]:+.2f} dd={A[4]:.2f} score={A[5]:.1f} stops={A[6]} worst trade={A[7]:+.2f}")
for k in ks:
    V = st(get(k)); print(f"  {k}  n={V[0]} win={V[1]:.0f}% avg={V[2]:+.2f} net={V[3]:+.2f} ({100*V[3]/A[3]:.0f}% of A2) dd={V[4]:.2f} score={V[5]:.1f} ({V[5]/A[5]:.2f}x A2) stops={V[6]} worst trade={V[7]:+.2f}")

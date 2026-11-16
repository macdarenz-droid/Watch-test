"""Before/after for variants with their OWN entries vs A2, ONE month window. usage: python bt/ab_rule.py K1,K2 START END [--drop=DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
def st(t):
    if len(t) == 0: return "n= 0"
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f}"
ks, a, b = sys.argv[1].split(","), sys.argv[2], sys.argv[3]; drop = [x.split("=")[1] for x in sys.argv[4:] if x.startswith("--drop=")]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
def get(n):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
    return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
f = lambda t: t[~t.entry_time.dt.strftime("%Y-%m-%d").isin(drop)].reset_index(drop=True)
print(a, "..", b)
for k in ["A2"] + ks:
    t = get(k); print(f"  {k} ", st(t), ("| without " + ",".join(drop) + ": " + st(f(t))) if drop else "")
    if k != "A2": print("     ", " ".join(f"{str(r.entry_time)[5:10]}{'B' if r.side>0 else 'S'}{r.R:+.2f}" for r in t.itertuples()))

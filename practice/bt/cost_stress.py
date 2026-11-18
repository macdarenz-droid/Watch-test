"""A2 under worse trading costs. Jan-Feb only, one month per block. Not rule variants: same trades, different (spread, slippage) in pips."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history
m5all = ideas.days(history("M5"))
def st(t):
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.3f} net={t.R.sum():+6.2f} dd={dd:.2f} full stops={int((t.reason=='sl').sum())}"
for a, b in (("2015-01-01", "2015-02-01"), ("2015-02-01", "2015-03-01")):
    m5 = m5all[m5all.time < pd.Timestamp(b, tz="UTC")]; print(a, "..", b)
    for name, c in (("base 1.0+0.1", None), ("C1 1.5+0.3", (1.5, 0.3)), ("C2 2.0+0.5", (2.0, 0.5)), ("C3 3.0+1.0", (3.0, 1.0))):
        with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, costs=c, **ideas.VARIANTS["A2"])
        print(f"   {name:13s}", st(t[t.entry_time >= pd.Timestamp(a, tz="UTC")]))

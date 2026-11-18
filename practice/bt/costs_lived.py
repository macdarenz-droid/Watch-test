"""Idea CL: engine A2 under worse costs, on lived days (from 03-02) and on the backtest days beside. usage: python bt/costs_lived.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; LIVE0 = "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def raw(c):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, costs=c, **ideas.VARIANTS["A2"])
    return t.set_index("tag")
SC = (("normal 1.0/0.1", (1.0, 0.1)), ("C15 1.5/0.3", (1.5, 0.3)), ("C2 2.0/0.5", (2.0, 0.5)), ("C3 3.0/1.0", (3.0, 1.0))); T = {n: raw(c) for n, c in SC}
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for n, t in T.items(): r = t.loc[d]; print(f"{d} {n}: entry {r.entry:.5f} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} {r.R:+.2f}R")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
base = T["normal 1.0/0.1"]; out = {}
for lab, sel in (("LIVED DAYS from 03-02", lambda t: t[t.index >= LIVE0]), ("backtest days before 03-02 (reported)", lambda t: t[t.index < LIVE0])):
    print(lab)
    for n, t in T.items():
        x = sel(t); b = sel(base); st = int((x.reason == "sl").sum()); out[(lab[:5], n[:3])] = (x.R.mean(), dd(x.R), st - int((b.reason == "sl").sum()))
        print(f"   {n}: trades {len(x)} win {100*(x.R>0).mean():.0f}% avg {x.R.mean():+.3f}R net {x.R.sum():+.2f} dd {dd(x.R):.2f} full stops {st} (sells {int(((x.reason=='sl')&(x.side<0)).sum())}, buys {int(((x.reason=='sl')&(x.side>0)).sum())}) | vs normal {x.R.mean()-b.R.mean():+.3f}R a trade")
a0 = out[("LIVED", "nor")][0]; print(f"break-even extra round-trip cost on lived days: {a0*40:.1f} pips ({a0:+.3f}R x 40)")
c2, c3 = out[("LIVED", "C2 ")], out[("LIVED", "C3 ")]
print("KILL LINES: K1 lived avg at double >= +0.10R: %s | K2 lived avg at triple > 0: %s | K3 DD at double <= 8R: %s | K4 at most 3 extra full stops at double: %s" % tuple("PASS" if x else "FAIL" for x in (c2[0] >= 0.10, c3[0] > 0, c2[1] <= 8, c2[2] <= 3)))

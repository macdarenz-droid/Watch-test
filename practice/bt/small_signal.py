"""Idea SG: A2 on small-signal days (3-day close gap under 50 pips / under half the 5-day average daily range). Variants derived from A2's own daily R.
usage: python bt/small_signal.py END [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
g = t.groupby("tag").agg(R=("R", "sum"))
cl = m5.groupby("day")["close"].last(); hi = m5.groupby("day")["high"].max(); lo = m5.groupby("day")["low"].min(); ds = [str(d) for d in cl.index]
def feat(d):
    i = ds.index(d); gap = abs(cl.iloc[i-1] - cl.iloc[i-4]) * 1e4 if i >= 4 else np.nan
    adr = np.mean([(hi.iloc[k] - lo.iloc[k]) * 1e4 for k in range(i-5, i)]) if i >= 5 else np.nan
    return gap, adr
ff = [feat(d) for d in g.index]; g["gap"] = [a for a, _ in ff]; g["adr"] = [b for _, b in ff]; g["rel"] = g.gap / g.adr
g["s50"] = g.gap < 50; g["srel"] = g.rel < 0.5
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); g["per"] = g.index.map(per); PS = ("Jan", "Feb", "Mar-now")
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        i = ds.index(d); print(d, "prev close", round(cl.iloc[i-1], 5), "3 back", round(cl.iloc[i-4], 5), f"| gap {g.gap[d]:.0f} pips | 5-day avg range {g.adr[d]:.0f} | ratio {g.rel[d]:.2f} | under 50: {bool(g.s50[d])} | under half a day: {bool(g.srel[d])}")
    print("days:", len(g), "| gap < 50:", int(g.s50.sum()), "| gap < 0.5 x ADR5:", int(g.srel.sum()), "| undefined:", int(g.gap.isna().sum()), int(g.adr.isna().sum())); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f}" if len(x) else "n= 0"
print(f"A2 to {END}: {st(g.R)} dd={dd(g.R):.2f}")
for title, m in (("gap under 50 pips", g.s50), ("gap under half the 5-day average daily range", g.srel)):
    a, b = g.R[~m], g.R[m]; se = np.sqrt(a.var(ddof=1)/len(a) + b.var(ddof=1)/len(b))
    print(f"--- {title}\n  large : {st(a)}\n  small : {st(b)}\n  gap large - small: {a.mean()-b.mean():+.3f}R (two standard errors +-{2*se:.2f}R)")
    for p in PS: print(f"     {p:8s} large: {st(g.R[~m & (g.per==p)])} | small: {st(g.R[m & (g.per==p)])} | gap {g.R[~m & (g.per==p)].mean()-g.R[m & (g.per==p)].mean():+.2f}")
for name, V, ch in (("SG1 skip when the gap is under 50 pips", g.R.where(~g.s50, 0.0), g.s50), ("SG2 skip when under half a normal day", g.R.where(~g.srel, 0.0), g.srel), ("SG3 half size on those days", g.R.where(~g.srel, g.R / 2), g.srel)):
    gap = g.R[~ch].mean() - g.R[ch].mean(); gp = {p: g.R[~ch & (g.per==p)].mean() - g.R[ch & (g.per==p)].mean() for p in PS}
    k1 = V.mean() >= g.R.mean() + 0.05; k2 = gap >= 0.3; k3 = gp["Feb"] >= 0.3 and gp["Mar-now"] >= 0.3; k4 = ch.sum() >= 10 and (~ch).mean() >= 0.6
    print(f"{name}: avg/signal day {V.mean():+.3f} (A2 {g.R.mean():+.3f}) net {V.sum():+.2f} dd {dd(V):.2f} | changes {int(ch.sum())} days ({100*(~ch).mean():.0f}% left alone) | gap all {gap:+.2f} | Jan {gp['Jan']:+.2f} Feb {gp['Feb']:+.2f} Mar-now {gp['Mar-now']:+.2f}"
          f" | K1 {'PASS' if k1 else 'FAIL'} K2 {'PASS' if k2 else 'FAIL'} K3 {'PASS' if k3 else 'FAIL'} K4 {'PASS' if k4 else 'FAIL'}")

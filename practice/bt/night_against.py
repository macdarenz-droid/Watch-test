"""Idea ON: A2 on mornings when the night (00:00 -> 08:00 London) went against my side / one-way against my side. Variants derived from A2's own daily R.
usage: python bt/night_against.py END [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; SPLIT = "2015-02-27"       # the reviewed losers start here; everything before was not reviewed
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
g = t.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
def night(d):
    x = m5[(m5.time.dt.date == pd.Timestamp(d).date()) & (m5.time.dt.hour < 8)]
    net = (x.close.iloc[-1] - x.open.iloc[0]) / 1e-4; rng = (x.high.max() - x.low.min()) / 1e-4
    return net, rng
nn = [night(d) for d in g.index]; g["net"] = [a for a, _ in nn]; g["rng"] = [b for _, b in nn]
g["against"] = g.net * g.side < 0; g["oneway"] = g.against & (g.net.abs() >= 0.5 * g.rng)
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        x = m5[(m5.time.dt.date == pd.Timestamp(d).date()) & (m5.time.dt.hour < 8)]
        print(d, "side", int(g.side[d]), "| 00:00 open", round(x.open.iloc[0], 5), "07:55 close", round(x.close.iloc[-1], 5), "| night high", round(x.high.max(), 5), "low", round(x.low.min(), 5),
              f"| net {g.net[d]:+.1f} range {g.rng[d]:.1f} | against {bool(g.against[d])} one-way {bool(g.oneway[d])}")
    print("days:", len(g), "| against:", int(g.against.sum()), "| one-way against:", int(g.oneway.sum())); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f}" if len(x) else "n= 0"
early = g.index < SPLIT; L15 = set(g.R[g.R <= 0].tail(15).index)
print(f"A2 to {END}: {st(g.R)} dd={dd(g.R):.2f} | not reviewed (before {SPLIT}): {st(g.R[early])} | reviewed stretch: {st(g.R[~early])}")
for title, m in (("night against my side (any)", g.against), ("night ONE-WAY against my side", g.oneway)):
    a, b = g.R[~m], g.R[m]; se = np.sqrt(a.var(ddof=1)/len(a) + b.var(ddof=1)/len(b))
    print(f"--- {title}\n  others : {st(a)}\n  these  : {st(b)}\n  gap others - these: {a.mean()-b.mean():+.3f}R (two standard errors +-{2*se:.2f}R)")
    print(f"     NOT reviewed (01-06..02-26): others {st(g.R[~m & early])} | these {st(g.R[m & early])} | gap {g.R[~m & early].mean()-g.R[m & early].mean():+.2f}")
    print(f"     reviewed stretch (02-27..)  : others {st(g.R[~m & ~early])} | these {st(g.R[m & ~early])} | gap {g.R[~m & ~early].mean()-g.R[m & ~early].mean():+.2f}")
    print(f"     of the 15 reviewed losers these days contain {sum(d in L15 for d in g.index[m])}; of ALL {int((g.R>0).sum())} winners they contain {int((g.R[m]>0).sum())}; of all {int((g.R<=0).sum())} losers {int((g.R[m]<=0).sum())}")
for name, V, ch in (("ON1 skip when the night is against me", g.R.where(~g.against, 0.0), g.against), ("ON2 skip when one-way against me", g.R.where(~g.oneway, 0.0), g.oneway), ("ON3 half size when one-way against me", g.R.where(~g.oneway, g.R / 2), g.oneway)):
    gap = g.R[~ch].mean() - g.R[ch].mean(); gap_e = g.R[~ch & early].mean() - g.R[ch & early].mean()
    k1 = V.mean() >= g.R.mean() + 0.05; k2 = gap >= 0.3; k3 = gap_e >= 0.3; k4 = ch.sum() >= 10 and (~ch).mean() >= 0.6
    print(f"{name}: avg/signal day {V.mean():+.3f} (A2 {g.R.mean():+.3f}) net {V.sum():+.2f} dd {dd(V):.2f} | changes {int(ch.sum())} days ({100*(~ch).mean():.0f}% left alone) | gap all {gap:+.2f}, not-reviewed part {gap_e:+.2f}"
          f" | K1 {'PASS' if k1 else 'FAIL'} K2 {'PASS' if k2 else 'FAIL'} K3 {'PASS' if k3 else 'FAIL'} K4 {'PASS' if k4 else 'FAIL'}")

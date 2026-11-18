"""Idea VL: do A2's results change with the SIZE of the prior days' ranges? (journal/2015-idea-VL-volatility-level.md; kill lines written first.)
Features known at 08:00, in pips (London-day range = high - low from 22:00 London the evening before to 22:00, as in the daily call): V1 adr5 = mean of the previous 5 days; V2 y1 = yesterday; V3 adr10 = mean of the previous 10.
usage: python bt/vol_level.py END counts   -> tercile cut points and counts only, NO outcomes
       python bt/vol_level.py END test     -> the pre-registered test
       python bt/vol_level.py END check DATE"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END, MODE = sys.argv[1], sys.argv[2]; PIP = 1e-4; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def a2(costs=None):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, costs=costs, **ideas.VARIANTS["A2"])
    return t.groupby("tag").R.sum(), t.groupby("tag").reason.agg(lambda x: (x == "sl").any())
a, stop = a2(); rng = {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]      # London day as in look.sh / call_numbers: 22:00 the evening before -> 22:00
    if len(x) > 100 and d.weekday() < 5: rng[d] = (x.high.max() - x.low.min()) / PIP
rng = pd.Series(rng); rows = []
for ds in a.index:
    y = rng[rng.index < pd.Timestamp(ds, tz="UTC")]
    rows.append(dict(tag=ds, adr5=y.iloc[-5:].mean() if len(y) >= 5 else np.nan, y1=y.iloc[-1] if len(y) >= 1 else np.nan, adr10=y.iloc[-10:].mean() if len(y) >= 10 else np.nan))
F = pd.DataFrame(rows).set_index("tag"); F["R"] = a; F["stop"] = stop
if MODE == "check": print(F.loc[sys.argv[3], ["adr5", "y1", "adr10"]].round(1).to_string()); sys.exit()
CUTS = {c: (F[c].quantile(1/3), F[c].quantile(2/3)) for c in ("adr5", "y1", "adr10")}
if MODE == "counts":
    for c in CUTS: print(f"{c}: days with a value {int(F[c].notna().sum())} of {len(F)} | min {F[c].min():.0f} median {F[c].median():.0f} max {F[c].max():.0f} | tercile cuts {CUTS[c][0]:.1f} / {CUTS[c][1]:.1f} pips")
    print("corr adr5-y1", round(F.adr5.corr(F.y1), 2), "| adr5-adr10", round(F.adr5.corr(F.adr10), 2)); sys.exit()
CUTS = {"adr5": (float(sys.argv[3]), float(sys.argv[4])), "y1": (float(sys.argv[5]), float(sys.argv[6])), "adr10": (float(sys.argv[7]), float(sys.argv[8]))}   # the cuts written in the pre-registration
LIVE0 = "2015-03-02"; print(f"A2 to {END}: {len(F)} days {F.R.sum():+.2f}R avg {F.R.mean():+.3f} | full stops {int(F.stop.sum())} ({F.stop.mean():.0%})")
for n, c in (("V1 5-day mean range", "adr5"), ("V2 yesterday's range", "y1"), ("V3 10-day mean range", "adr10")):
    G = F[F[c].notna()]; lo, hi = CUTS[c]; g = {"LOW": G[G[c] < lo], "MID": G[(G[c] >= lo) & (G[c] < hi)], "HIGH": G[G[c] >= hi]}
    print(f"{n} (cuts {lo:.1f} / {hi:.1f} pips; {len(G)} days):")
    for k, x in g.items(): print(f"   {k}: {len(x)} days | avg {x.R.mean():+.3f}R | net {x.R.sum():+.2f} | win {(x.R > 0).mean():.0%} | full stops {x.stop.mean():.0%} | avg win {x.R[x.R > 0].mean():+.2f} avg loss {x.R[x.R <= 0].mean():+.2f} | days >= +1.6R: {int((x.R >= 1.6).sum())}")
    L_, Hh = g["LOW"].R, g["HIGH"].R; d = Hh.mean() - L_.mean(); se = np.sqrt(Hh.var(ddof=1) / len(Hh) + L_.var(ddof=1) / len(L_))
    def diff(m): return G[m & (G[c] >= hi)].R.mean() - G[m & (G[c] < lo)].R.mean()
    de, dl = diff(G.index < LIVE0), diff(G.index >= LIVE0); mid = g["MID"].R.mean()
    print(f"   HIGH minus LOW {d:+.3f}R (2 standard errors {2*se:.3f}) | before {LIVE0}: {de:+.3f} ({int(((G.index < LIVE0) & (G[c] >= hi)).sum())} / {int(((G.index < LIVE0) & (G[c] < lo)).sum())} days) | lived: {dl:+.3f} ({int(((G.index >= LIVE0) & (G[c] >= hi)).sum())} / {int(((G.index >= LIVE0) & (G[c] < lo)).sum())} days) | every group positive: {all(x.R.mean() > 0 for x in g.values())}")
    K = [abs(d) >= 0.30, de * dl > 0 and de * d > 0, min(L_.mean(), Hh.mean()) <= mid <= max(L_.mean(), Hh.mean()), abs(d) >= 2 * se]
    print("   KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))

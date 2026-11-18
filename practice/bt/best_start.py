"""Study + test for idea BS (how my best A2 days START; coach 06-15). Entry-time facts only, known at 08:00 London.
A  brk  = the 07:00-08:00 hour trades beyond the 00:00-07:00 range in MY direction (sell: a new night low; buy: a new night high). brk_against = the other side.
B  nr4  = yesterday's London-day range is the smallest of the last 4 London days; yr = yesterday's range / mean of the 5 before it.
C  vol  = tick volume of 07:00-08:00 / its mean over the previous 10 trading days.
usage: python bt/best_start.py END study      -> the 15 best days with their facts + base rates of the facts on ALL days (counts only, NO outcomes)
       python bt/best_start.py END test       -> the pre-registered test (inspiring days dropped)
       python bt/best_start.py END check DATE -> one day's facts"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; MODE = sys.argv[2]; PIP = 1e-4; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def a2(costs=None):
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, costs=costs, **ideas.VARIANTS["A2"])
    return t.set_index("tag")
t = a2(); vcol = [c for c in m5.columns if c.lower().startswith("vol")][0]
rng, pv = {}, {}
for ds in t.index:
    d = pd.Timestamp(ds, tz="UTC"); x = m5[(m5.time >= d + 7 * H) & (m5.time < d + 8 * H)]; pv[d] = x[vcol].sum()
dd = sorted(set(m5.time.dt.normalize()))
for d in dd:
    x = m5[(m5.time >= d) & (m5.time < d + 22 * H)]
    if len(x) > 100 and d.weekday() < 5: rng[d] = (x.high.max() - x.low.min()) / PIP
rng = pd.Series(rng); pv = pd.Series(pv); rows = []
for ds, r in t.iterrows():
    d = pd.Timestamp(ds, tz="UTC"); s = int(r.side)
    n = m5[(m5.time >= d) & (m5.time < d + 7 * H)]; p = m5[(m5.time >= d + 7 * H) & (m5.time < d + 8 * H)]
    up, dn = p.high.max() > n.high.max(), p.low.min() < n.low.min()
    y = rng[rng.index < d]; pvp = pv[pv.index < d]
    rows.append(dict(tag=ds, side="B" if s > 0 else "S", R=r.R, brk=bool(up if s > 0 else dn), brk_against=bool(dn if s > 0 else up),
                     nr4=bool(len(y) >= 4 and y.iloc[-1] == y.iloc[-4:].min()), yr=y.iloc[-1] / y.iloc[-6:-1].mean() if len(y) >= 6 else np.nan,
                     vol=pv[d] / pvp.iloc[-10:].mean() if len(pvp) >= 10 else np.nan))
F = pd.DataFrame(rows).set_index("tag")
if MODE == "check":
    print(F.loc[sys.argv[3]].to_string()); sys.exit()
BEST = F.sort_values("R", ascending=False).head(15)
if MODE == "study":
    print("THE 15 BEST A2 DAYS before", END); print(BEST.round(2).to_string())
    print(f"\nBASE RATES on ALL {len(F)} days (counts only): brk {F.brk.mean():.0%} | brk_against {F.brk_against.mean():.0%} | both {(F.brk & F.brk_against).mean():.0%} | nr4 {F.nr4.mean():.0%} | yr<0.8 {(F.yr < 0.8).mean():.0%} | vol>=1.3 {(F.vol >= 1.3).mean():.0%} | vol median {F.vol.median():.2f} | yr median {F.yr.median():.2f}")
    print(f"BEST 15: brk {BEST.brk.sum()} | brk_against {BEST.brk_against.sum()} | nr4 {BEST.nr4.sum()} | yr<0.8 {(BEST.yr < 0.8).sum()} | vol>=1.3 {(BEST.vol >= 1.3).sum()} (of {BEST.vol.notna().sum()} with a volume ratio) | vol median {BEST.vol.median():.2f} | yr median {BEST.yr.median():.2f}")
    sys.exit()
# ---- test: variants are masks; inspiring days (the 15 best) dropped
G = F.drop(BEST.index); G = G[G.vol.notna()]; S = a2((2.0, 0.5)).R.reindex(G.index); LIVE0 = "2015-03-02"
V = {"BS1 pre-hour volume >= 1.30 x its 10-day mean": G.vol >= 1.30, "BS2 >= 1.15": G.vol >= 1.15, "BS3 >= 1.05": G.vol >= 1.05}; TH = {"BS1": 1.30, "BS2": 1.15, "BS3": 1.05}
big = G.R >= 1.0
print(f"ALL {len(F)} days {F.R.sum():+.2f}R | 15 best dropped ({BEST.R.sum():+.2f}R), days without a 10-day volume mean dropped -> {len(G)} days, {G.R.sum():+.2f}R, avg {G.R.mean():+.3f}, days of +1R or more: {int(big.sum())} ({big.mean():.0%})")
for n, m in V.items():
    a, b = G[m], G[~m]; e, l = G.index < LIVE0, G.index >= LIVE0
    d_all = a.R.mean() - b.R.mean(); d_e = G[m & e].R.mean() - G[~m & e].R.mean(); d_l = G[m & l].R.mean() - G[~m & l].R.mean(); d_s = S[m].mean() - S[~m].mean()
    lift = (big[m].mean() / big.mean()) if big.mean() else np.nan
    print(f"{n}: yes {len(a)} days avg {a.R.mean():+.3f} win {(a.R>0).mean():.0%} net {a.R.sum():+.2f} | no {len(b)} days avg {b.R.mean():+.3f} win {(b.R>0).mean():.0%} net {b.R.sum():+.2f} | diff {d_all:+.3f}")
    print(f"     before {LIVE0}: yes {int((m&e).sum())} / no {int((~m&e).sum())} diff {d_e:+.3f} | lived: yes {int((m&l).sum())} / no {int((~m&l).sum())} diff {d_l:+.3f} | stressed diff {d_s:+.3f} | +1R days among yes {int(big[m].sum())} ({big[m].mean():.0%}), lift {lift:.2f} | among the 15 dropped: {int((BEST.vol >= TH[n[:3]]).sum())} of {int(BEST.vol.notna().sum())}")
    K = [d_all >= 0.25, d_e > 0 and d_l > 0, len(a) >= 20 and len(b) >= 20, lift >= 1.5, d_s >= 0.25]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))

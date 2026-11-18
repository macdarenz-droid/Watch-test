"""Idea NA (journal/2015-idea-NA-night-against-second-review.md): skip A2 when open(08:00) - open(00:00) London, signed by my side, <= -15 pips.
usage: python bt/night_filter.py END count | check DATE | pre | lived"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
def eng(n):
    with contextlib.redirect_stdout(io.StringIO()): return ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
t = eng("A2"); nm2 = set(eng("NM2").tag)
t["night"] = [((op[pd.Timestamp(d, tz="UTC") + 8 * H] - op[pd.Timestamp(d, tz="UTC")]) / PIP * s) for d, s in zip(t.tag, t.side)]
t["na"] = t.night <= -15; pre = t[t.tag < "2015-05-01"]; liv = t[t.tag >= "2015-05-01"]
if MODE == "check": r = t[t.tag == sys.argv[3]].iloc[0]; print(f"{r.tag} side {r.side} night {r.night:+.1f} pips -> NA skip {bool(r.na)}"); sys.exit()
if MODE == "count":
    print(f"pre-May A2 days {len(pre)}: NA {int(pre.na.sum())} = {pre.na.mean():.0%} | from 05-01: {len(liv)} days, NA {int(liv.na.sum())} = {liv.na.mean():.0%}")
    print(f"mechanics: my skipped days vs engine NM2's missing days: differ on {len(set(t.tag[t.na]) ^ (set(t.tag) - nm2))} days"); sys.exit()
def rep(x, name):
    s, k = x[x.na], x[~x.na]; print(f"{name}: days {len(x)} | skipped {len(s)} avg {s.R.mean():+.3f} net {s.R.sum():+.2f} | kept {len(k)} avg {k.R.mean():+.3f} net {k.R.sum():+.2f} | gap {k.R.mean() - s.R.mean():+.3f}"); return s, k
if MODE == "pre":
    s, k = rep(pre, "PRE-MAY"); a = rep(pre[pre.tag < "2015-03-01"], "  Jan-Feb"); b = rep(pre[pre.tag >= "2015-03-01"], "  Mar-Apr")
    K = [k.R.mean() - s.R.mean() >= 0.30 and s.R.mean() < 0, a[1].R.mean() > a[0].R.mean() and b[1].R.mean() > b[0].R.mean(), len(s) >= 10 and len(s) <= 0.4 * len(pre)]
    print("KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
if MODE == "lived":
    rep(liv, "LIVED 05-01.."); w, l = liv[liv.R > 0], liv[liv.R <= 0]; print(f"NA share among winners {int(w.na.sum())}/{len(w)} | among losers {int(l.na.sum())}/{len(l)}")

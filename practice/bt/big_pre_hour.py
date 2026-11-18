"""Idea BH: A2 with no trade when the pre-entry hour (07:00-08:00 London) ranged >= 60 (BH1) / 50 (BH2) / 70 (BH3) pips. Costs on (engine default).
Mechanism reading: the skipped days of BH1 under the 80 pip stop variant S80. usage: python bt/big_pre_hour.py END [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def raw(n):
    with contextlib.redirect_stdout(io.StringIO()): return ideas.run(n, m5, ret=True, **ideas.VARIANTS[n])
ta = raw("A2"); a = ta.groupby("tag").R.sum(); stop = ta.groupby("tag").reason.agg(lambda x: (x == "sl").any()); s80 = raw("S80").groupby("tag").R.sum()
pre = {}
for d in a.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=7)) & (m5.time < dd_ + pd.Timedelta(hours=8))]; pre[d] = (x.high.max() - x.low.min()) / PIP
pre = pd.Series(pre)
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","): print(f"{d}: pre-entry hour range {pre[d]:.1f} pips | A2 {a[d]:+.2f}R")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
late = a.index >= "2015-03-02"
print(f"A2 to {END}, costs on: {len(a)} days net {a.sum():+.2f} avg {a.mean():+.3f} dd {dd(a):.2f} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f}")
res = {}
for k, th in (("BH1", 60), ("BH2", 50), ("BH3", 70)):
    sk = pre >= th; v = a.where(~sk, 0.0); s = a[sk]; res[k] = s
    print(f"{k} (no trade at {th}+ pips): skipped {int(sk.sum())} trades: wins {int((s>0).sum())}, avg {s.mean():+.3f}, net {s.sum():+.2f}, full stops {int(stop[sk].sum())}; lived days among them {int((sk & late).sum())} (avg {a[sk & late].mean():+.3f}) | rule net {v.sum():+.2f} ({v.sum()-a.sum():+.2f} vs A2) dd {dd(v):.2f} | before 03-02 {v[~late].sum():+.2f} | from 03-02 {v[late].sum():+.2f}")
    print("     skipped days: " + " ".join(f"{d[5:]}:{pre[d]:.0f}p:{a[d]:+.2f}" for d in s.index))
s1 = res["BH1"]; sk1 = pre >= 60; v1 = a.where(~sk1, 0.0)
K = [s1.mean() <= -0.50, v1.sum() >= a.sum() and dd(v1) <= dd(a) + 1e-9, res["BH2"].mean() < 0 and res["BH3"].mean() < 0, len(s1) >= 10]
print("KILL LINES for BH1: K1 skipped avg <= -0.50R: %s | K2 costs no money: %s | K3 neighbours below 0: %s | K4 sample >= 10: %s" % tuple("PASS" if x else "FAIL" for x in K))
m = pd.DataFrame({"A2 40 pips": a[sk1], "S80 80 pips": s80.reindex(a.index)[sk1]}); print("MECHANISM (the BH1 days at an 80 pip stop, same $ risk):"); print(m.round(2).to_string()); g = m["S80 80 pips"].mean() - m["A2 40 pips"].mean()
print(f"   average A2 {m['A2 40 pips'].mean():+.3f}R, S80 {m['S80 80 pips'].mean():+.3f}R, difference {g:+.3f}R -> reading: {'noise' if g >= 0.30 else 'direction'}")

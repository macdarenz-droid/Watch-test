"""Idea PH: does a lively hour before entry (07:00-08:00 London range >= 30 pips) explain the rise in full-stop mornings? Explanation lines E1-E3 and filter variants.
usage: python bt/pre_hour.py END [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; LIVE0 = "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
rows = []
for r in t.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), entry=("entry", "first")).reset_index().itertuples():
    d = pd.Timestamp(r.tag, tz="UTC"); pre = m5[(m5.time >= d + pd.Timedelta(hours=7)) & (m5.time < d + pd.Timedelta(hours=8))]; x = m5[(m5.time >= d + pd.Timedelta(hours=8)) & (m5.time < d + pd.Timedelta(hours=12))]
    adv = ((r.entry - x.low.min()) if r.side > 0 else (x.high.max() + 0.0001 - r.entry)) / 1e-4
    rows.append(dict(d=r.tag, R=r.R, adv=adv, pre=(pre.high.max() - pre.low.min()) / 1e-4))
g = pd.DataFrame(rows).set_index("d"); g["fs"] = g.adv >= 40; g["live"] = g.index >= LIVE0; g["lv"] = g.pre >= 30; g["lv40"] = g.pre >= 40
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        dd_ = pd.Timestamp(d, tz="UTC"); pre = m5[(m5.time >= dd_ + pd.Timedelta(hours=7)) & (m5.time < dd_ + pd.Timedelta(hours=8))]
        print(d, f"07:00-08:00 high {pre.high.max():.5f} low {pre.low.min():.5f} -> range {g.pre[d]:.1f} pips | lively(30) {bool(g.lv[d])} (40) {bool(g.lv40[d])}")
    print("days", len(g), "| lively 30+:", int(g.lv.sum()), "| 40+:", int(g.lv40.sum())); sys.exit()
def rate(x): return f"{int(x.fs.sum())} of {len(x)} = {100*x.fs.mean():.1f}%" if len(x) else "no days"
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f}"
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"A2 to {END}: {st(g.R)} dd={dd(g.R):.2f}")
print(f"FIRST LINE (average R, as promised): lively-hour mornings {st(g.R[g.lv])} | quiet-hour mornings {st(g.R[~g.lv])} | 40+ pips: {st(g.R[g.lv40])}")
print(f"full-stop mornings: all {rate(g)} | backtest months {rate(g[~g.live])} | live months {rate(g[g.live])}")
print("PART 1 - explanation")
S, O = g[g.lv], g[~g.lv]; r1 = S.fs.mean() / O.fs.mean() if O.fs.mean() > 0 else float("nan")
print(f"  all history: lively {rate(S)} | quiet {rate(O)} | ratio {r1:.2f}")
out = {}
for nm, m in (("backtest months", ~g.live), ("live months", g.live)):
    s, o = g[m & g.lv], g[m & ~g.lv]; rr = (s.fs.mean() / o.fs.mean()) if (len(s) and len(o) and o.fs.mean() > 0) else float("nan"); out[nm] = rr
    print(f"  {nm}: lively {rate(s)} | quiet {rate(o)} | ratio {rr:.2f} | share of days lively {100*(m & g.lv).sum()/m.sum():.0f}%")
b, l = g[~g.live], g[g.live]; rise = l.fs.mean() - b.fs.mean(); pred = (S.fs.mean() - O.fs.mean()) * (l.lv.mean() - b.lv.mean())
print(f"  accounting: (lively rate - quiet rate) x (change in share of lively days) = ({100*S.fs.mean():.1f}% - {100*O.fs.mean():.1f}%) x ({100*l.lv.mean():.0f}% - {100*b.lv.mean():.0f}%) = {100*pred:.1f} points of the {100*rise:.1f}-point rise -> {100*pred/rise:.0f}%")
e1 = r1 >= 2; e2 = (not np.isnan(out["live months"])) and out["live months"] >= 1.5; e3 = pred / rise >= 0.5
print(f"  E1 ratio >= 2: {'PASS' if e1 else 'FAIL'} | E2 live-months ratio >= 1.5: {'PASS' if e2 else 'FAIL'} | E3 explains >= half: {'PASS' if e3 else 'FAIL'}")
print("PART 2 - variants")
for name, V, ch in (("PH1 skip when the pre-entry hour ranged 30+ pips", g.R.where(~g.lv, 0.0), g.lv), ("PH2 half size on those days", g.R.where(~g.lv, g.R / 2), g.lv), ("PH3 skip when it ranged 40+ pips", g.R.where(~g.lv40, 0.0), g.lv40)):
    gap = g.R[~ch].mean() - g.R[ch].mean(); gl = g.R[~ch & g.live].mean() - g.R[ch & g.live].mean(); gb = g.R[~ch & ~g.live].mean() - g.R[ch & ~g.live].mean()
    k1 = V.mean() >= g.R.mean() + 0.05; k2 = gap >= 0.3; k3 = gl >= 0.3; k4 = ch.sum() >= 10 and (~ch).mean() >= 0.6; k5 = V.sum() >= 0.9 * g.R.sum()
    print(f"  {name}: avg/signal day {V.mean():+.3f} (A2 {g.R.mean():+.3f}) net {V.sum():+.2f} ({100*V.sum()/g.R.sum():.0f}%) dd {dd(V):.2f} | changes {int(ch.sum())} ({100*(~ch).mean():.0f}% left alone) | gap all {gap:+.2f}, live {gl:+.2f}, backtest {gb:+.2f} | full-stop mornings removed {int(g.fs[ch].sum())} of {int(g.fs.sum())}, winners removed {int((g.R[ch]>0).sum())} of {int((g.R>0).sum())}"
          f" | K1 {'PASS' if k1 else 'FAIL'} K2 {'PASS' if k2 else 'FAIL'} K3 {'PASS' if k3 else 'FAIL'} K4 {'PASS' if k4 else 'FAIL'} K5 {'PASS' if k5 else 'FAIL'}")

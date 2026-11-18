"""Idea XS: do stretched 3-day signals (gap >= k x 5-day average daily range) explain the rise in full-stop mornings? Explanation lines E1-E3 and filter variants.
usage: python bt/stretched.py END [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; LIVE0 = "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
cl = m5.groupby("day")["close"].last(); hi = m5.groupby("day")["high"].max(); lo = m5.groupby("day")["low"].min(); ds = [str(d) for d in cl.index]
rows = []
for r in t.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), entry=("entry", "first")).reset_index().itertuples():
    i = ds.index(r.tag); d = pd.Timestamp(r.tag, tz="UTC"); x = m5[(m5.time >= d + pd.Timedelta(hours=8)) & (m5.time < d + pd.Timedelta(hours=12))]
    adv = ((r.entry - x.low.min()) if r.side > 0 else (x.high.max() + 0.0001 - r.entry)) / 1e-4
    gap = abs(cl.iloc[i-1] - cl.iloc[i-4]) * 1e4 if i >= 4 else np.nan; adr = np.mean([(hi.iloc[k] - lo.iloc[k]) * 1e4 for k in range(i-5, i)]) if i >= 5 else np.nan
    rows.append(dict(d=r.tag, R=r.R, adv=adv, gap=gap, adr=adr))
g = pd.DataFrame(rows).set_index("d"); g["rel"] = g.gap / g.adr; g["fs"] = g.adv >= 40; g["live"] = g.index >= LIVE0; g["st"] = g.rel >= 1.0; g["st125"] = g.rel >= 1.25
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","): print(d, f"gap {g.gap[d]:.0f} | ADR5 {g.adr[d]:.0f} | ratio {g.rel[d]:.2f} | stretched(1.0) {bool(g.st[d])} (1.25) {bool(g.st125[d])}")
    print("days", len(g), "| stretched 1.0:", int(g.st.sum()), "| 1.25:", int(g.st125.sum()), "| undefined ratio:", int(g.rel.isna().sum())); sys.exit()
def rate(x): return f"{int(x.fs.sum())} of {len(x)} = {100*x.fs.mean():.1f}%" if len(x) else "no days"
print(f"A2 to {END}: {len(g)} days | full-stop mornings: all {rate(g)} | backtest months {rate(g[~g.live])} | live months {rate(g[g.live])}")
print("PART 1 - explanation")
S, O = g[g.st], g[~g.st]; print(f"  all history: stretched {rate(S)} | others {rate(O)} | ratio {S.fs.mean()/O.fs.mean():.2f}" if O.fs.mean() > 0 else "  ratio undefined")
ratios = {}
for nm, m in (("backtest months", ~g.live), ("live months", g.live)):
    s, o = g[m & g.st], g[m & ~g.st]; rr = (s.fs.mean() / o.fs.mean()) if (len(s) and len(o) and o.fs.mean() > 0) else float("nan"); ratios[nm] = (rr, int(s.fs.sum()), int(o.fs.sum()))
    print(f"  {nm}: stretched {rate(s)} | others {rate(o)} | ratio {rr:.2f} | share of days stretched {100*(m & g.st).sum()/m.sum():.0f}%")
b = g[~g.live]; l = g[g.live]; rs, ro = b[b.st].fs.mean(), b[~b.st].fs.mean(); mix = l.st.mean(); pred = rs * mix + ro * (1 - mix); rise = l.fs.mean() - b.fs.mean()
print(f"  accounting: backtest rates ({100*rs:.1f}% stretched, {100*ro:.1f}% others) on the live mix ({100*mix:.0f}% stretched) predict {100*pred:.1f}% full-stop mornings; actual live {100*l.fs.mean():.1f}%, backtest {100*b.fs.mean():.1f}% -> the mix explains {100*(pred-b.fs.mean())/rise:.0f}% of the rise")
e1 = S.fs.mean() >= 2 * O.fs.mean(); e2 = all((not np.isnan(v[0])) and v[0] >= 1.5 for v in ratios.values()); e3 = (pred - b.fs.mean()) / rise >= 0.5
print(f"  E1 ratio >= 2: {'PASS' if e1 else 'FAIL'} | E2 ratio >= 1.5 inside both periods: {'PASS' if e2 else 'FAIL'} | E3 mix explains >= half: {'PASS' if e3 else 'FAIL'}")
print("PART 2 - variants")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def st(x): return f"n={len(x):2d} win={100*(x>0).mean():3.0f}% avg={x.mean():+.3f} net={x.sum():+6.2f}"
print(f"  A2: {st(g.R)} dd={dd(g.R):.2f} | stretched(1.0): {st(g.R[g.st])} | others: {st(g.R[~g.st])} | stretched(1.25): {st(g.R[g.st125])}")
for name, V, ch in (("XS1 skip when gap >= 1.25 x ADR5", g.R.where(~g.st125, 0.0), g.st125), ("XS2 half size on those days", g.R.where(~g.st125, g.R / 2), g.st125), ("XS3 skip when gap >= 1.0 x ADR5", g.R.where(~g.st, 0.0), g.st)):
    gap = g.R[~ch].mean() - g.R[ch].mean(); gb = g.R[~ch & ~g.live].mean() - g.R[ch & ~g.live].mean(); gl = g.R[~ch & g.live].mean() - g.R[ch & g.live].mean()
    k1 = V.mean() >= g.R.mean() + 0.05; k2 = gap >= 0.3; k3 = gb >= 0.3 and gl >= 0.3; k4 = ch.sum() >= 10 and (~ch).mean() >= 0.6
    print(f"  {name}: avg/signal day {V.mean():+.3f} (A2 {g.R.mean():+.3f}) net {V.sum():+.2f} dd {dd(V):.2f} | changes {int(ch.sum())} ({100*(~ch).mean():.0f}% left alone) | gap all {gap:+.2f}, backtest {gb:+.2f}, live {gl:+.2f} | full-stop mornings removed {int(g.fs[ch].sum())} of {int(g.fs.sum())}"
          f" | K1 {'PASS' if k1 else 'FAIL'} K2 {'PASS' if k2 else 'FAIL'} K3 {'PASS' if k3 else 'FAIL'} K4 {'PASS' if k4 else 'FAIL'}")

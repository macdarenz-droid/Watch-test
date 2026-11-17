"""Idea BD: does any rule I trade by cut one of my best A2 days? (journal/2015-idea-BD-do-my-rules-cut-best-days.md, checks C1-C6 written first.)
Best day = engine A2 result >= +1.60R. usage: python bt/best_day_audit.py END"""
import sys, io, contextlib, os, re, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4; H = pd.Timedelta(hours=1); BEST_R = 1.60; HERE = os.path.dirname(os.path.abspath(__file__))
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
def run(n, **over):
    kw = dict(ideas.VARIANTS[n]); kw.update(over)
    with contextlib.redirect_stdout(io.StringIO()): t = ideas.run(n, m5, ret=True, **kw)
    return t
A = run("A2"); a = A.groupby("tag").R.sum(); best = a[a >= BEST_R].sort_values(ascending=False)
print(f"A2 to {END}: {len(a)} days, {a.sum():+.2f}R | best days (>= +{BEST_R:.2f}R): {len(best)}, {best.sum():+.2f}R | the rest: {len(a)-len(best)} days, {a.sum()-best.sum():+.2f}R")
# C1 the stop
N = run("A2", sl=400).set_index("tag"); st = A[A.reason == "sl"].set_index("tag")
ns = ((N.exit - N.entry) * N.side / PIP / 40).reindex(st.index)
hid = ns[ns >= BEST_R]
print(f"\nC1 STOP: {len(st)} full-stop days, as traded {st.R.sum():+.2f}R | the same days at noon without a stop {ns.sum():+.2f}R (avg {ns.mean():+.2f}, worst {ns.min():+.2f}, best {ns.max():+.2f})")
print(f"   positive at noon without the stop: {int((ns > 0).sum())} ({ns[ns > 0].sum():+.2f}R) | worse than -1R: {int((ns < -1).sum())} ({ns[ns < -1].sum():+.2f}R) | hidden best days (>= +{BEST_R}R): {len(hid)} " + " ".join(f"{d[5:]}:{v:+.2f}" for d, v in hid.items()))
print("   the five best no-stop results: " + " ".join(f"{d[5:]}:{v:+.2f}" for d, v in ns.sort_values(ascending=False).head(5).items()))
print(f"   ALARM C1: {'YES' if len(hid) >= 2 or ns.sum() > 0 else 'no'}")
# C2 the size rule on the engine history at 0.50%
eq = a.cumsum(); ddR = (eq.cummax().clip(lower=0) - eq); print(f"\nC2 SIZE RULE on the engine history: max drawdown {ddR.max():.2f}R = {ddR.max()*0.5:.2f}% at 0.50% a trade (line 3% = 6R) on {ddR.idxmax()} | days closed at or under -3%: {int((ddR >= 6).sum())}")
# funded log
rows = []
for f in sorted(glob.glob(os.path.join(HERE, "..", "journal", "*-funded.md"))):
    for l in open(f):
        m = re.match(r"\| F(\d+) \| \w+ (\d\d-\d\d) [^|]* \| (\w+) \| ([\d.]+) \| [\d.]+ \| [\d.]+ \| ([^|]*) \| ([+-][\d.]+) \|", l)
        if m: rows.append(dict(n=int(m[1]), tag="2015-" + m[2], side=m[3], lots=float(m[4]), exit=m[5].strip(), R=float(m[6])))
L = pd.DataFrame(rows).drop_duplicates("n").set_index("tag"); F0 = L.index.min()
print(f"   funded log: {len(L)} trades {F0}..{L.index.max()}, lots used: {sorted(L.lots.unique())} | trades not at the full size of their time (0.31; 0.47 never on funded): {int((~L.lots.isin([0.31])).sum())}")
# C3 holes
wd = sorted({d for d in m5.time.dt.normalize().unique() if d.weekday() < 5 and len(m5[(m5.time >= d + 8 * H) & (m5.time < d + 12 * H)]) >= 40})
wds = [d.strftime("%Y-%m-%d") for d in wd]; first = a.index.min()
h1 = [d for d in wds if d >= first and d not in a.index]; h2 = [d for d in a.index if d >= F0 and d not in L.index]; h3 = [d for d in L.index if d not in a.index]
print(f"\nC3 HOLES: weekdays with a London morning from {first}: {len([d for d in wds if d >= first])} | without an engine trade: {h1} | engine trade from {F0} without a funded trade: {h2} | funded trade without an engine trade: {h3}")
print(f"   ALARM C3: {'YES' if h1 or h2 else 'no'}")
# C4 me
bl = best[best.index >= F0]; cmp_ = pd.DataFrame({"engine": bl, "log": L.R.reindex(bl.index), "lots": L.lots.reindex(bl.index), "exit": L.exit.reindex(bl.index)}); cmp_["diff"] = cmp_.log - cmp_.engine
print(f"\nC4 ME: best days from {F0}: {len(bl)}"); print(cmp_.round(2).to_string())
bad = cmp_[(cmp_["diff"].abs() > 0.15) | (cmp_.lots != 0.31) | (~cmp_.exit.astype(str).str.contains("12:00"))]
print(f"   ALARM C4: {'YES ' + ' '.join(bad.index) if len(bad) else 'no'} | best days in the log total {cmp_.log.sum():+.2f}R against the engine's {cmp_.engine.sum():+.2f}R")
# C5 paper tags
days = m5.time.dt.normalize(); t3 = ideas.trend_map(m5, 3); t5 = ideas.trend_map(m5, 5); k = {pd.Timestamp(x).strftime("%Y-%m-%d"): x for x in t3}
def pre(d):
    d = pd.Timestamp(d, tz="UTC"); p = m5[(m5.time >= d + 7 * H) & (m5.time < d + 8 * H)]; return (p.high.max() - p.low.min()) / PIP
dis = pd.Series({d: t3[k[d]] != t5.get(k[d], t3[k[d]]) for d in a.index if d in k}); liv = pd.Series({d: pre(d) >= 30 for d in a.index})
bd = best.index
print(f"\nC5 PAPER TAGS on the {len(best)} best days: UN3 would SKIP {int(dis.reindex(bd).sum())} ({best[dis.reindex(bd).fillna(False).values].sum():+.2f}R lost): " + " ".join(d[5:] for d in bd if dis.get(d, False)))
print(f"   PH2 would HALVE {int(liv.reindex(bd).sum())} ({best[liv.reindex(bd).values].sum()/2:+.2f}R lost): " + " ".join(d[5:] for d in bd if liv[d]))
print(f"   base rates on all {len(a)} days: disagree {dis.mean():.0%}, lively {liv.mean():.0%} | among the best days: disagree {dis.reindex(bd).mean():.0%}, lively {liv.reindex(bd).mean():.0%}")
# C6 killed exits
for n in ("LK2", "GB2", "PM1"):
    v = run(n).groupby("tag").R.sum().reindex(a.index); d = (v - a)
    print(f"C6 {n}: on the best days {v[bd].sum():+.2f}R against A2 {best.sum():+.2f}R = {d[bd].sum():+.2f}R | on all other days {d.drop(bd).sum():+.2f}R | all days {d.sum():+.2f}R")
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print("\nCHECK", d, "A2", round(a[d], 2), "| no stop", round(float(((N.exit - N.entry) * N.side / PIP / 40)[d]), 2), "| disagree", bool(dis.get(d)), "| lively", bool(liv[d]), round(pre(d), 1))

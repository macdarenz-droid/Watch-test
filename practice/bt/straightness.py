"""Idea EF (journal/2015-idea-EF-straightness-of-the-market.md; kill lines written first): straightness of the last N days (|net 22:00-close move| / sum of
London-day ranges) against the side advantage (my side's R minus the other side's; loop of bt/coin_control.py), INSIDE each half of the history.
usage: python bt/straightness.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL, NP = 125.0, 40, 20000; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first")); rows = []; cl, rg = {}, {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) > 100 and d.weekday() < 5: cl[d] = x.close.iloc[-1]; rg[d] = (x.high.max() - x.low.min()) / PIP
cl, rg = pd.Series(cl), pd.Series(rg)
def straight(ds, N):
    d = pd.Timestamp(ds, tz="UTC"); c = cl[cl.index < d]; r = rg[rg.index < d]
    return abs(c.iloc[-1] - c.iloc[-1 - N]) / PIP / r.iloc[-N:].sum() if len(c) > N else np.nan
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + 8 * H) & (m5.time <= dd_ + 12 * H)]; r = {}
    for side in (1, -1):
        acct = Account()
        for _, bar in x.iterrows():
            if bar.time == dd_ + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d)
            if acct.positions and bar.time >= dd_ + 12 * H: acct.close()
            acct.on_bar(bar)
        r[side] = acct.trades[-1]["pnl"] / RISK
    s = int(A.side[d]); rows.append(dict(tag=d, mine=r[s], adv=r[s] - r[-s], e10=straight(d, 10), e20=straight(d, 20), e40=straight(d, 40)))
D = pd.DataFrame(rows).set_index("tag"); n = len(D); D["half"] = (np.arange(n) >= n // 2).astype(int)
print(f"mechanics: my side against engine A2, largest difference per day {(D.mine - A.R).abs().max():.3f}R | {n} days | halves {D.index[0]}..{D.index[n//2-1]} / {D.index[n//2]}..{D.index[-1]}")
if "--check" in sys.argv: print(D.loc[sys.argv[sys.argv.index("--check") + 1]].round(3).to_string()); sys.exit()
rng = np.random.default_rng(17); P = []
for name, c in (("EF1 N=10", "e10"), ("EF2 N=20", "e20"), ("EF3 N=40", "e40")):
    G = D[D[c].notna()].copy(); G["hi"] = False
    for h in (0, 1): g = G[G.half == h]; G.loc[g.index, "hi"] = g[c] >= g[c].median()
    def stat(adv):
        out = []; w = []
        for h in (0, 1):
            m = (G.half == h).values; a = adv[m]; hi = G.hi.values[m]; out.append(a[hi].mean() - a[~hi].mean()); w.append(m.sum())
        return out, float(np.average(out, weights=w))
    real, pooled = stat(G.adv.values); k = 0; cnt = [[int((G.hi & (G.half == h)).sum()), int((~G.hi & (G.half == h)).sum())] for h in (0, 1)]
    for _ in range(NP):
        x = G.adv.values.copy()
        for h in (0, 1): m = (G.half == h).values; x[m] = rng.permutation(x[m])
        k += stat(x)[1] >= pooled
    p = (k + 1) / (NP + 1); P.append(p); med = [G[G.half == h][c].median() for h in (0, 1)]
    print(f"{name}: {len(G)} days with a value | median straightness first half {med[0]:.3f}, second half {med[1]:.3f} | whole-history correlation with the side advantage {G[c].corr(G.adv):+.2f} (the trap, not a line)")
    for h in (0, 1):
        g = G[G.half == h]; print(f"   {'first' if h == 0 else 'second'} half: STRAIGHT {cnt[h][0]} days side advantage {g[g.hi].adv.mean():+.3f}R (my side {g[g.hi].mine.mean():+.3f}) | CROOKED {cnt[h][1]} days {g[~g.hi].adv.mean():+.3f}R (my side {g[~g.hi].mine.mean():+.3f}) | difference {real[h]:+.3f}R")
    K = [real[0] > 0 and real[1] > 0, pooled >= 0.30, p < 0.05, min(min(c_) for c_ in cnt) >= 15]
    print(f"   pooled inside-half difference {pooled:+.3f}R | within-half permutation p = {p:.4f} | KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)) + f" -> {'SURVIVES (if p < 0.017)' if all(K) else 'KILLED'}")

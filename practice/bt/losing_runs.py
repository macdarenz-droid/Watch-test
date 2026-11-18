"""Idea LR (journal/2015-idea-LR-losing-runs-normal-or-warning.md): losing runs and drawdown of A2 since 04-07 against resamples of healthy A2 (01-05..04-06) and of all trades.
usage: python bt/losing_runs.py END facts | test"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END, MODE = sys.argv[1], sys.argv[2]; MID = "2015-04-07"; N = 20000
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
R = t.groupby("tag").R.sum(); ref, win = R[R.index < MID].values, R[R.index >= MID]
def runs(r):
    out, c = [], 0
    for x in r:
        if x < 0: c += 1
        else:
            if c: out.append(c)
            c = 0
    if c: out.append(c)
    return out
def stats(r):
    q = runs(r); eq = np.cumsum(r); dd = (np.maximum.accumulate(np.maximum(eq, 0)) - eq).max()
    return max(q) if q else 0, sum(1 for z in q if z >= 5), dd
if MODE == "facts":
    q = runs(win.values); print(f"healthy pool {len(ref)} trades ({R.index[0]}..04-06) | window {len(win)} trades ({win.index[0]}..{win.index[-1]}) | losing runs in the window (lengths in order): {q}")
    c = 0
    for x in win.values[::-1]:
        if x < 0: c += 1
        else: break
    print(f"current run of losses at the end: {c}"); sys.exit()
obs = stats(win.values); print(f"OBSERVED window {len(win)} trades: avg {win.mean():+.3f}R | losses {(win < 0).mean():.0%} | longest run {obs[0]} | runs of 5+: {obs[1]} | max drawdown {obs[2]:.2f}R")
rng = np.random.default_rng(11)
for name, pool in (("healthy A2 (01-05..04-06)", ref), ("all trades (soft test)", R.values)):
    S = np.array([stats(rng.choice(pool, len(win))) for _ in range(N)]); S100 = np.array([stats(rng.choice(pool, 100)) for _ in range(N)])
    print(f"{name}: pool {len(pool)} trades avg {pool.mean():+.3f}R losses {(pool < 0).mean():.0%}")
    print(f"   per 100 trades: a run of 5+ in {(S100[:, 0] >= 5).mean():.1%} of resamples | of 10+ in {(S100[:, 0] >= 10).mean():.2%} | max drawdown median {np.median(S100[:, 2]):.2f}R, 95% under {np.percentile(S100[:, 2], 95):.2f}R, worst {S100[:, 2].max():.2f}R")
    print(f"   against the window ({len(win)} trades): longest run >= {obs[0]} in {(S[:, 0] >= obs[0]).mean():.2%} | runs of 5+ >= {obs[1]} in {(S[:, 1] >= obs[1]).mean():.2%} | drawdown >= {obs[2]:.2f}R in {(S[:, 2] >= obs[2]).mean():.2%}")

"""Idea SW, kill line K4 as WRITTEN: for every SW1 entry day, the opposite side as a stand-alone trade with the same stop, target and time exit.
(bt/slow_a2.py's mirror ran its own sequence and shared only 17 entry days; that did not match the pre-written line.) usage: python bt/slow_a2_mirror.py END"""
import sys, os, io, contextlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.argv = [sys.argv[0], sys.argv[1], "none"]
with contextlib.redirect_stdout(io.StringIO()): import slow_a2 as sw
import numpy as np, pandas as pd
from backtest import Account, PIP
H = pd.Timedelta(hours=1)
def single(day, side, S, K):
    d = pd.Timestamp(day, tz="UTC"); i = sw.D.index(d); end = (sw.D[i + K] if i + K < len(sw.D) else pd.Timestamp("2100-01-01", tz="UTC")) + 12 * H; acct = Account(); started = False
    for bar in sw.REC:
        t = bar["time"]
        if t < d + 8 * H: continue
        if not started: acct.market(side, round(125.0 / (S * 10), 3), sl=bar["open"] - side * S * PIP, tp=bar["open"] + side * 2 * S * PIP, tag="m"); started = True
        elif not acct.positions: break
        if acct.positions and t >= end: acct.close()
        acct.on_bar(bar)
    return acct.trades[-1]["pnl"] / 125.0 if acct.trades and not acct.positions else np.nan
for k, a in sw.VAR.items():
    T = sw.run(*a); T = T[T.why != "open at END"].reset_index(drop=True)
    same = np.array([single(r.day, int(r.side), a[1], a[2]) for r in T.itertuples()]); opp = np.array([single(r.day, -int(r.side), a[1], a[2]) for r in T.itertuples()])
    diff = T.R.values - opp; ok = ~np.isnan(diff); rng = np.random.default_rng(3); p = (np.abs((rng.choice([-1, 1], (10000, ok.sum())) * diff[ok]).mean(1)) >= abs(diff[ok].mean())).mean()
    late = (T.day >= sw.MID).values
    print(f"{k}: {int(ok.sum())} entry days | mechanics: stand-alone same side vs the run, max diff {np.nanmax(np.abs(same - T.R.values)):.4f}R | my side avg {T.R.mean():+.3f} | opposite side avg {np.nanmean(opp):+.3f} | difference {diff[ok].mean():+.3f}R, sign-flip p {p:.4f} | difference before {sw.MID}: {np.nanmean(diff[~late]):+.3f} | from: {np.nanmean(diff[late]):+.3f}")

"""Idea FD (journal/2015-idea-FD-forward-design-for-LM2.md): pass rates of a forward re-test of LM2 over N lively mornings, resampling LM2's 73 lived (fade R, chase R) pairs.
Lines: F1 avg >= +0.10R, F2 net > 0 without best two, F3 max DD <= 5R, F4 fade avg > chase avg. usage: python bt/forward_design.py END facts | test"""
import sys, io, contextlib, os
END, MODE = sys.argv[1], sys.argv[2]; here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here); sys.argv = [sys.argv[0], END, "none"]
src = open(os.path.join(here, "lively_fade_oos.py")).read(); ns = {"__name__": "lf_defs", "__file__": os.path.join(here, "lively_fade_oos.py")}
with contextlib.redirect_stdout(io.StringIO()): exec(src[:src.index('if MODE == "count"')], ns)     # definitions and the list of lively mornings only
import numpy as np, pandas as pd
F, trade = ns["F"], ns["trade"]; F = F[F.day <= "2015-07-24"].reset_index(drop=True)
fade = np.array([trade(x.day, -x.hour)[0] for x in F.itertuples()]); chase = np.array([trade(x.day, x.hour)[0] for x in F.itertuples()]); old = (F.day < "2015-05-07").values
if MODE == "facts": print(f"pool {len(F)} mornings ({F.day.iloc[0]}..{F.day.iloc[-1]}) | to 05-06: {int(old.sum())} fade avg {fade[old].mean():+.3f} chase {chase[old].mean():+.3f} | 05-07..07-24: {int((~old).sum())} fade avg {fade[~old].mean():+.3f} chase {chase[~old].mean():+.3f} | all: fade {fade.mean():+.3f} (spread {fade.std(ddof=1):.2f}) chase {chase.mean():+.3f}"); sys.exit()
rng = np.random.default_rng(55); RUNS = 20000
worlds = {"REAL (pool as it is)": (fade, chase), "COIN (both 0.00R)": (fade - fade.mean(), chase - chase.mean()), "LOSER (fade -0.10R, chase +0.05R)": (fade - fade.mean() - 0.10, chase - chase.mean() + 0.05)}
for N in (20, 30, 40):
    out = []
    for name, (f, c) in worlds.items():
        idx = rng.integers(0, len(f), (RUNS, N)); x = f[idx]; y = c[idx]; eq = np.cumsum(x, axis=1); dd = (np.maximum.accumulate(np.maximum(eq, 0), axis=1) - eq).max(1); s = np.sort(x, axis=1)
        f1 = x.mean(1) >= 0.10; f2 = (x.sum(1) - s[:, -2:].sum(1)) > 0; f3 = dd <= 5; f4 = x.mean(1) > y.mean(1); p = f1 & f2 & f3 & f4
        out.append(f"{name}: PASS {p.mean():.1%} (F1 {f1.mean():.0%}, F2 {f2.mean():.0%}, F3 {f3.mean():.0%}, F4 {f4.mean():.0%})")
    print(f"N = {N}: " + " | ".join(out))

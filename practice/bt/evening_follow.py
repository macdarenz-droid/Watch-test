"""Idea EF (journal/2015-idea-EF-evening-follow-unseen.md): reuses bt/evening_fade.py's definitions (byte for byte) and judges the FOLLOW only on days EV never traded:
25 <= |move| < 60 (all history) plus |move| >= 60 after 2015-07-29. usage: python bt/evening_follow.py END count | check DATE | test"""
import sys, os, io, contextlib
END, MODE = sys.argv[1], sys.argv[2]; ARG = sys.argv[3] if len(sys.argv) > 3 else None; here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here); sys.argv = [sys.argv[0], END, "none"]
src = open(os.path.join(here, "evening_fade.py")).read(); ns = {"__name__": "ev_defs", "__file__": os.path.join(here, "evening_fade.py")}
with contextlib.redirect_stdout(io.StringIO()): exec(src[:src.index('def dd(q)')], ns)   # definitions incl. trade(); the count and check blocks are skipped because MODE is 'none'
import numpy as np, pandas as pd
F, trade, MID = ns["F"], ns["trade"], ns["MID"]; a = F.move.abs()
J = F[((a >= 25) & (a < 60)) | ((a >= 60) & (F.day > "2015-07-29"))].reset_index(drop=True); J2 = J[(J.move.abs() >= 40) & (J.move.abs() < 60)]
if MODE == "count": print(f"days with candles {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | EF1 judged {len(J)} (before {MID}: {int((~J.late).sum())}, from: {int(J.late.sum())}; of them |move| >= 60 after 07-29: {int((J.move.abs() >= 60).sum())}) | EF2 {len(J2)} | EV's 51 days excluded: {int(((a >= 60) & (F.day <= '2015-07-29')).sum())}"); sys.exit()
if MODE == "check": r = F[F.day == ARG].iloc[0]; print(r.to_string(), "| judged:", bool(((abs(r.move) >= 25) and (abs(r.move) < 60)) or (abs(r.move) >= 60 and r.day > "2015-07-29"))); sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
res = {}
for name, X, sg in (("EF1 follow, judged days", J, 1), ("EF2 follow, 40-60 pip days", J2, 1), ("EF0 fade on EF1's days (control)", J, -1)):
    X = X.reset_index(drop=True); R = pd.Series([trade(r.day, sg * int(np.sign(r.move)))[0] for r in X.itertuples()]); W = [trade(r.day, sg * int(np.sign(r.move)))[1] for r in X.itertuples()]
    Rs = pd.Series([trade(r.day, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; res[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | without best 3 {R.sum() - R.nlargest(3).sum():+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd(R):.2f}R")
    if name.startswith("EF1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, R.sum() - R.nlargest(3).sum() > 0, None, Rs.mean() >= 0.05, dd(R) <= 6.0, None]
K[3] = res["EF1"].mean() > res["EF0"].mean(); K[6] = res["EF2"].mean() >= res["EF1"].mean()
print("KILL LINES EF1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

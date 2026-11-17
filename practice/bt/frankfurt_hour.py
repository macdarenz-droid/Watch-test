"""Idea FH (journal/2015-idea-FH-the-frankfurt-hour.md), built from bt/ny_to_london.py. Night = open(07:00) - open(00:00) the same day; 07:00 market with it (follow) or against (control), stop 20, out 08:00. R after costs 1.0 + 0.1. Was: Idea YN (journal/2015-idea-YN-yesterdays-new-york-for-the-morning.md): yesterday's NY move = open(17:00) - open(13:00) of the previous trading day, London time.
If |move| >= N: 08:00 market against it (fade) or with it (follow), stop 40, out 12:00. usage: python bt/ny_to_london.py END count | check DATE [x] | test N1 N2"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 20; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag").side
rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4 or d not in op.index or d + 7 * H not in op.index or d + 8 * H not in op.index: continue
    mv = (op[d + 7 * H] - op[d]) / PIP; ds = d.strftime("%Y-%m-%d")
    if mv != 0: rows.append(dict(day=ds, prev="-", ny=mv, fade=-int(np.sign(mv)), a2=int(a2[ds]) if ds in a2.index else 0, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |NY move| {F.ny.abs().median():.1f} pips")
    for N in (10, 20, 30): X = F[F.ny.abs() >= N]; k = (X.a2 != 0).sum(); print(f"N = {N}: {len(X)} trades | before {MID}: {int((~X.late).sum())} | from: {int(X.late.sum())} | follow side = A2's side on {int((-X.fade == X.a2).sum())} of {k} ({(-X.fade == X.a2).sum() / k:.0%})")
    sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 7 * H) & (m5.time <= d + 8 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 8 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: print("follow:", trade(r.day, -r.fade), "| fade:", trade(r.day, r.fade))
    sys.exit()
N1, N2 = int(sys.argv[3]), int(sys.argv[4]); keep = {}; rng = np.random.default_rng(32)
for name, N, sg in ((f"FH1 follow the night, >= {N1}", N1, -1), (f"FH2 follow, >= {N2}", N2, -1), (f"FH0 fade, >= {N1} (control)", N1, 1)):
    X = F[F.ny.abs() >= N].reset_index(drop=True); res = [trade(r.day, sg * r.fade) for r in X.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r.day, sg * r.fade, (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("FH1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["FH1"] - keep["FH0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) FH1 minus FH0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES FH1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

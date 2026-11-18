"""Idea FX (journal/2015-idea-FX-the-four-oclock-turn.md): move = open(16:00) - open(15:30) London. FX1 |move| >= 10 -> 16:00 market against it, stop 20, out 17:00.
FX2 |move| >= 20. FX0 = follow on FX1's days. usage: python bt/four_oclock.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 20; H = pd.Timedelta(hours=1); HH = pd.Timedelta(minutes=30); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    a, b, c = d + 15 * H + HH, d + 16 * H, d + 17 * H
    if d.weekday() > 4 or a not in op.index or b not in op.index or c not in op.index: continue
    mv = (op[b] - op[a]) / PIP; ds = d.strftime("%Y-%m-%d")
    if mv != 0: rows.append(dict(day=ds, o1530=op[a], o16=op[b], move=mv, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |move| {F.move.abs().median():.1f} pips")
    for n, thr in (("FX1 >= 10", 10), ("FX2 >= 20", 20)): m = F.move.abs() >= thr; print(f"{n}: {int(m.sum())} days | before {MID}: {int((m & ~F.late).sum())} | from: {int((m & F.late).sum())} | up {int((m & (F.move > 0)).sum())} down {int((m & (F.move < 0)).sum())}")
    sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 16 * H) & (m5.time <= d + 17 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 17 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: print("fade:", trade(r.day, -int(np.sign(r.move))), "| follow:", trade(r.day, int(np.sign(r.move))))
    sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
keep = {}; rng = np.random.default_rng(16)
for name, thr, sg in (("FX1 fade, move >= 10", 10, -1), ("FX2 fade, move >= 20", 20, -1), ("FX0 follow on FX1's days", 10, 1)):
    J = F[F.move.abs() >= thr].reset_index(drop=True); res = [trade(r.day, sg * int(np.sign(r.move))) for r in J.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r.day, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in J.itertuples()]); lt = J.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | without best 3 {R.sum() - R.nlargest(3).sum():+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd(R):.2f}R")
    if name.startswith("FX1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, R.sum() - R.nlargest(3).sum() > 0, None, Rs.mean() > 0, dd(R) <= 6.0, None]
diff = (keep["FX1"] - keep["FX0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05; K[6] = keep["FX2"].mean() >= keep["FX1"].mean()
print(f"fade minus follow {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES FX1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

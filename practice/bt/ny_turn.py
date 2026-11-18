"""Idea NR (journal/2015-idea-NR-new-york-turns-the-morning.md): move = open(13:00) - open(08:00) London. If |move| >= N: 13:00 market against it (fade) or with it
(follow), stop 30, out 17:00. usage: python bt/ny_turn.py END count | check N DATE [x] | test N1 N2"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4 or any(d + k * H not in op.index for k in (8, 13, 17)): continue
    mv = (op[d + 13 * H] - op[d + 8 * H]) / PIP; ds = d.strftime("%Y-%m-%d")
    if mv != 0: rows.append(dict(day=ds, o8=op[d + 8 * H], o13=op[d + 13 * H], move=mv, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |move| {F.move.abs().median():.1f} pips")
    for N in (20, 30, 40): m = F.move.abs() >= N; print(f"N = {N}: {int(m.sum())} days | before {MID}: {int((m & ~F.late).sum())} | from: {int((m & F.late).sum())} | up {int((m & (F.move > 0)).sum())} down {int((m & (F.move < 0)).sum())}")
    sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 13 * H) & (m5.time <= d + 17 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 17 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[4]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 5: print("fade:", trade(r.day, -int(np.sign(r.move))), "| follow:", trade(r.day, int(np.sign(r.move))))
    sys.exit()
N1, N2 = int(sys.argv[3]), int(sys.argv[4]); keep = {}; rng = np.random.default_rng(29)
for name, N, sg in ((f"NR1 fade, move >= {N1}", N1, -1), (f"NR2 fade, move >= {N2}", N2, -1), (f"NR0 follow, move >= {N1}", N1, 1)):
    J = F[F.move.abs() >= N].reset_index(drop=True); res = [trade(r.day, sg * int(np.sign(r.move))) for r in J.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r.day, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in J.itertuples()]); lt = J.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("NR1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["NR1"] - keep["NR0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"NR1 minus NR0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES NR1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

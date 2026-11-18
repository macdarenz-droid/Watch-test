"""Idea EV (journal/2015-idea-EV-evening-fade.md): day move = open(17:00) - open(08:00) London. EV1 |move| >= 60 -> 17:00 market against it, stop 30, out 21:00.
EV2 |move| >= 100. EV0 = follow on EV1's days. usage: python bt/evening_fade.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4 or d + 8 * H not in op.index or d + 17 * H not in op.index or d + 21 * H not in op.index: continue
    mv = (op[d + 17 * H] - op[d + 8 * H]) / PIP
    if mv != 0: rows.append(dict(day=d.strftime("%Y-%m-%d"), o8=op[d + 8 * H], o17=op[d + 17 * H], move=mv, late=d.strftime("%Y-%m-%d") >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days with 08:00, 17:00 and 21:00 candles: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |move| {F.move.abs().median():.0f} pips")
    for n, thr in (("EV1 >= 60", 60), ("EV2 >= 100", 100)): m = F.move.abs() >= thr; print(f"{n}: {int(m.sum())} days | before {MID}: {int((m & ~F.late).sum())} | from: {int((m & F.late).sum())} | day up {int((m & (F.move > 0)).sum())} down {int((m & (F.move < 0)).sum())}")
    sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 17 * H) & (m5.time <= d + 21 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 21 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: print("fade:", trade(r.day, -int(np.sign(r.move))), "| follow:", trade(r.day, int(np.sign(r.move))))
    sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
avg = {}; rng = np.random.default_rng(17)
for name, thr, sg in (("EV1 fade, move >= 60", 60, -1), ("EV2 fade, move >= 100", 100, -1), ("EV0 follow on EV1's days", 60, 1)):
    J = F[F.move.abs() >= thr].reset_index(drop=True); R = pd.Series([trade(r.day, sg * int(np.sign(r.move)))[0] for r in J.itertuples()]); W = [trade(r.day, sg * int(np.sign(r.move)))[1] for r in J.itertuples()]
    Rs = pd.Series([trade(r.day, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in J.itertuples()]); avg[name[:3]] = R.mean(); a, b = R[~J.late], R[J.late]
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {W.count('sl')} | before {MID}: {len(a)} net {a.sum():+.2f} | from: {len(b)} net {b.sum():+.2f} | without best 2 {R.sum() - R.nlargest(2).sum():+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd(R):.2f}R")
    if name.startswith("EV1"): K = [R.mean() >= 0.10, a.sum() > 0 and b.sum() > 0, R.sum() - R.nlargest(2).sum() > 0, None, Rs.mean() >= 0.05, dd(R) <= 6.0, None]; R1 = R
    if name.startswith("EV0"): diff = (R1 - R).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); print(f"   fade minus follow {diff.mean():+.3f}R, sign-flip p {p:.4f}")
K[3] = avg["EV1"] > avg["EV0"]; K[6] = avg["EV2"] >= avg["EV1"]; print("KILL LINES EV1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

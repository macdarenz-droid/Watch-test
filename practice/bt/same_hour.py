"""Idea SH (journal/2015-idea-SH-same-hour-tomorrow.md): for each hour H = 08..16 London, yesterday's move in H (open H+1 - open H); if |move| >= X: at today's H open
trade that way (or against: control), stop 20, out at H+1. R after costs 1.0 + 0.1; stressed 2.0 + 0.5. usage: python bt/same_hour.py END grid | check DATE [x] | test X1 X2"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 20; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5]; rows = []
for i in range(1, len(days)):
    d, p = days[i], days[i - 1]
    for h in range(8, 17):
        if all(t in op.index for t in (p + h * H, p + (h + 1) * H, d + h * H, d + (h + 1) * H)):
            mv = (op[p + (h + 1) * H] - op[p + h * H]) / PIP; ds = d.strftime("%Y-%m-%d")
            if mv != 0: rows.append(dict(day=ds, h=h, t_in=d + h * H, t_out=d + (h + 1) * H, move=mv, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "grid":
    print(f"day-hours {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |yesterday's hour move| {F.move.abs().median():.1f} pips")
    for X in (5, 10, 15): m = F.move.abs() >= X; print(f"X = {X}: {int(m.sum())} trades | before {MID}: {int((m & ~F.late).sum())} | from: {int((m & F.late).sum())}")
    sys.exit()
def trade(r, side, costs=None):
    x = m5[(m5.time >= r.t_in) & (m5.time <= r.t_out)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= r.t_out: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    X = F[(F.day == sys.argv[3]) & (F.move.abs() >= 10)]; print(X[["h", "move"]].round(1).to_string(index=False))
    if len(sys.argv) > 4 and len(X): r = X.iloc[0]; s = int(np.sign(r.move)); print(f"first (hour {r.h}) -> with:", trade(r, s), "| against:", trade(r, -s))
    sys.exit()
X1, X2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(46)
for name, X, sg in ((f"SH1 repeat yesterday's hour, |move| >= {X1:g}", X1, 1), (f"SH2 repeat, |move| >= {X2:g}", X2, 1), (f"SH0 against, |move| >= {X1:g} (control)", X1, -1)):
    J = F[F.move.abs() >= X].reset_index(drop=True); res = [trade(r, sg * int(np.sign(r.move))) for r in J.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in J.itertuples()]); lt = J.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("SH1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["SH1"] - keep["SH0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) SH1 minus SH0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES SH1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

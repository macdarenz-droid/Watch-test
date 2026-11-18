"""Idea UD (journal/2015-idea-UD-the-1330-candle.md): move = close - open of the 13:30-13:45 London candle (from M5). If |move| >= X: 13:45 market with it (follow)
or against (fade), stop 25, out 15:45. R after costs: 1.0 + 0.1 pips (engine default); stressed 2.0 + 0.5. usage: python bt/candle_1330.py END count | check DATE [x] | test X1 X2"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 25; H = pd.Timedelta(hours=1); Mn = pd.Timedelta(minutes=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; rows = []
for d in sorted(set(m5.time.dt.normalize())):
    if d.weekday() > 4: continue
    c = m5[(m5.time >= d + 13 * H + 30 * Mn) & (m5.time < d + 13 * H + 45 * Mn)]
    if len(c) < 3 or m5[(m5.time >= d + 15 * H + 45 * Mn)].empty: continue
    mv = (c.close.iloc[-1] - c.open.iloc[0]) / PIP; ds = d.strftime("%Y-%m-%d")
    if mv != 0: rows.append(dict(day=ds, move=mv, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "count":
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | median |move| {F.move.abs().median():.1f} pips")
    for X in (5, 10, 15): m = F.move.abs() >= X; print(f"X = {X}: {int(m.sum())} days | before {MID}: {int((m & ~F.late).sum())} | from: {int((m & F.late).sum())}")
    sys.exit()
def trade(day, side, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 13 * H + 45 * Mn) & (m5.time <= d + 15 * H + 45 * Mn)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 15 * H + 45 * Mn: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: s = int(np.sign(r.move)); print("follow:", trade(r.day, s), "| fade:", trade(r.day, -s))
    sys.exit()
X1, X2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(39)
for name, X, sg in ((f"UD1 follow, |move| >= {X1:g}", X1, 1), (f"UD2 follow, |move| >= {X2:g}", X2, 1), (f"UD0 fade, |move| >= {X1:g} (control)", X1, -1)):
    J = F[F.move.abs() >= X].reset_index(drop=True); res = [trade(r.day, sg * int(np.sign(r.move))) for r in J.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r.day, sg * int(np.sign(r.move)), (2.0, 0.5))[0] for r in J.itertuples()]); lt = J.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("UD1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["UD1"] - keep["UD0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1 pips; stressed 2.0 + 0.5) UD1 minus UD0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES UD1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

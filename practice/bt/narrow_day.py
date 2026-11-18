"""Idea ND (journal/2015-idea-ND-narrow-day-breakout.md): yesterday's London-day range <= Q x median of the 10 before it; today 08:00-16:00 the first M5 close
beyond yesterday's high/low -> next M5 open with it (or faded: control), stop 30, out 20:00. R after costs 1.0 + 0.1; stressed 2.0 + 0.5.
usage: python bt/narrow_day.py END grid | check DATE [x] | test Q1 Q2"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 30; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; times = set(m5.time); D = {}
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if d.weekday() < 5 and len(x) >= 200: D[d] = (x.high.max(), x.low.min())
days = list(D); rg = pd.Series({d: (D[d][0] - D[d][1]) / PIP for d in days}); med = rg.shift(1).rolling(10).median(); rows = []
for i in range(1, len(days)):
    d, p = days[i], days[i - 1]
    if not np.isfinite(med[p]): continue
    hi, lo = D[p]; w = m5[(m5.time >= d + 8 * H) & (m5.time < d + 16 * H)]; x = w[(w.close > hi) | (w.close < lo)]
    if x.empty or x.time.iloc[0] + M not in times or d + 20 * H not in times: continue
    b = x.iloc[0]; ds = d.strftime("%Y-%m-%d")
    rows.append(dict(day=ds, ratio=rg[p] / med[p], t_in=b.time + M, side=1 if b.close > hi else -1, late=ds >= MID))
F = pd.DataFrame(rows)
if MODE == "grid":
    print(f"days with a break of yesterday's range 08:00-16:00: {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]})")
    for Q in (0.7, 0.8, 0.9): X = F[F.ratio <= Q]; print(f"Q = {Q}: {len(X)} trades | before {MID}: {int((~X.late).sum())} | from: {int(X.late.sum())}")
    sys.exit()
def trade(r, side, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= r.t_in) & (m5.time <= d + 20 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 20 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: print("break:", trade(r, r.side), "| fade:", trade(r, -r.side))
    sys.exit()
Q1, Q2 = float(sys.argv[3]), float(sys.argv[4]); keep = {}; rng = np.random.default_rng(44)
for name, Q, sg in ((f"ND1 with the break, Q {Q1:g}", Q1, 1), (f"ND2 with the break, Q {Q2:g}", Q2, 1), (f"ND0 fade the break, Q {Q1:g} (control)", Q1, -1)):
    X = F[F.ratio <= Q].reset_index(drop=True); res = [trade(r, sg * r.side) for r in X.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * r.side, (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("ND1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["ND1"] - keep["ND0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.10
print(f"(R after costs 1.0 + 0.1; stressed 2.0 + 0.5) ND1 minus ND0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES ND1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

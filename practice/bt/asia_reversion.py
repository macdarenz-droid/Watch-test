"""Idea AR (journal/2015-idea-AR-asia-reversion.md): first M5 close 00:00-05:00 London at least D pips from the 00:00 open -> next open, trade back toward it
(target = the 00:00 open, stop S), else out 06:00. AR1 D=15 S=15 | AR2 D=20 S=20 | AR0 = AR1's signals followed, stop 15, target 15 beyond.
usage: python bt/asia_reversion.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK = 125.0; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
def signals(D):
    out = []
    for d in sorted(set(m5.time.dt.normalize())):
        if d.weekday() > 4 or d not in op.index or d + 6 * H not in op.index: continue
        x = m5[(m5.time >= d) & (m5.time < d + 5 * H)]; o0 = op[d]; far = x[(x.close - o0).abs() >= D * PIP]
        if far.empty or far.time.iloc[0] + M not in op.index: continue
        b = far.iloc[0]; out.append(dict(day=d.strftime("%Y-%m-%d"), o0=o0, t_sig=b.time, t_in=b.time + M, dir=int(np.sign(b.close - o0)), late=d.strftime("%Y-%m-%d") >= MID))
    return pd.DataFrame(out)
S1, S2 = signals(15), signals(20)
if MODE == "count":
    for n, S in (("AR1 D=15", S1), ("AR2 D=20", S2)): print(f"{n}: {len(S)} nights | before {MID}: {int((~S.late).sum())} | from: {int(S.late.sum())} | departures up {int((S.dir > 0).sum())} down {int((S.dir < 0).sum())}")
    sys.exit()
def trade(r, side, sl, tp_px, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= r.t_in) & (m5.time <= d + 6 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (sl * 10), 3), sl=bar["open"] - side * sl * PIP, tp=tp_px(bar["open"], side), tag="x")
        if acct.positions and bar["time"] >= d + 6 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
VAR = {"AR1 back to midnight, D=15 S=15": (S1, -1, 15, lambda r: (lambda e, s: r.o0)), "AR2 back to midnight, D=20 S=20": (S2, -1, 20, lambda r: (lambda e, s: r.o0)),
       "AR0 follow AR1's signals, S=15, target 15 beyond": (S1, 1, 15, lambda r: (lambda e, s: e + s * 15 * PIP))}
if MODE == "check":
    r = S1[S1.day == sys.argv[3]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 4: print("AR1:", trade(r, -r.dir, 15, VAR["AR1 back to midnight, D=15 S=15"][3](r)), "| AR0:", trade(r, r.dir, 15, VAR["AR0 follow AR1's signals, S=15, target 15 beyond"][3](r)))
    sys.exit()
keep = {}; rng = np.random.default_rng(24)
for name, (S, sg, sl, tpf) in VAR.items():
    res = [trade(r, sg * r.dir, sl, tpf(r)) for r in S.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * r.dir, sl, tpf(r), (2.5, 0.5))[0] for r in S.itertuples()]); lt = S.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | targets {W.count('tp')} stops {W.count('sl')} time {len(W) - W.count('tp') - W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed (2.5+0.5) avg {Rs.mean():+.3f}")
    if name.startswith("AR1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["AR1"] - keep["AR0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"AR1 minus AR0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES AR1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

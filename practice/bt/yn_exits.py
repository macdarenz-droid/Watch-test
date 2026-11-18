"""YN exits (journal/2015-YN-exits-and-management.md). Entry = YN1 frozen (bt/ny_to_london.py, N = 20: fade yesterday's 13:00-17:00 London move
at 08:00, stop 40). Variants change only the exit: base out 12:00; E1 out 10:00; E2 out 16:00; E3 break-even after a closed M5 candle shows +20.
usage: python bt/yn_exits.py END check DATE | run"""
import sys, os
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "ny_to_london.py")).read()
argv = sys.argv; sys.argv = [argv[0], argv[1], "none"]; exec(src[:src.index('if MODE == "count":')]); sys.argv = argv; MODE = argv[2]
N = 20; X = F[F.ny.abs() >= N].reset_index(drop=True)
def trade2(day, side, out_h=12, be=None, costs=None):
    d = pd.Timestamp(day, tz="UTC"); x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + out_h * H)]
    acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account(); moved = False
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: pid = acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + out_h * H: acct.close()
        acct.on_bar(bar)
        if be and acct.positions and not moved:
            p = acct.positions[0]; gain = (bar["high"] - p.entry) / PIP if side > 0 else (p.entry - (bar["low"] + bar["spread"])) / PIP
            if gain >= be: acct.modify(p.id, sl=p.entry); moved = True
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
V = (("base YN1 out 12:00", 12, None), ("E1 out 10:00", 10, None), ("E2 out 16:00", 16, None), ("E3 break-even at +20, out 12:00", 12, 20))
if MODE == "check":
    r = X[X.day == argv[3]].iloc[0]; print(r.to_string())
    if len(argv) > 4: [print(n, trade2(r.day, r.fade, h, b)) for n, h, b in V]
    sys.exit()
print(f"YN1 days {len(X)} ({X.day.iloc[0]}..{X.day.iloc[-1]}); before {MID}: {int((~X.late).sum())}, from: {int(X.late.sum())}")
rng = np.random.default_rng(51); lt = X.late.values; base = None
for name, h, b in V:
    R = pd.Series([trade2(r.day, r.fade, h, b)[0] for r in X.itertuples()]); Rs = pd.Series([trade2(r.day, r.fade, h, b, (2.0, 0.5))[0] for r in X.itertuples()])
    dd = (R.cumsum().cummax() - R.cumsum()).max()
    line = f"{name}: avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | wins {(R > 0).mean():.0%} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f} | max DD {dd:.2f}R"
    if base is None: base = R; print(line); continue
    df = (R - base).values; p = (np.abs((rng.choice([-1, 1], (10000, len(df))) * df).mean(1)) >= abs(df.mean())).mean()
    K = [R.mean() >= 0.10 and R.mean() >= base.mean() + 0.05, df[~lt].sum() > 0 and df[lt].sum() > 0, Rs.mean() > 0, df.mean() > 0 and p < 0.10]
    print(line + f" | minus base {df.mean():+.3f}R (before {df[~lt].sum():+.2f}, from {df[lt].sum():+.2f}), p {p:.4f} | " + " ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
print("(all R after costs 1.0 + 0.1; stressed 2.0 + 0.5) script reached its end")

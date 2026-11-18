"""Idea MB2 (journal/2015-idea-MB-morning-range-break.md): morning range 07:00-11:00 London; first M5 CLOSE 11:00-15:00 at least B pips beyond it -> next open,
follow (break) or fade, stop 25, out 17:00. MB2 adds: morning range under its 20-day median. usage: python bt/morning_break.py END count | check B DATE [x] | test B"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 25; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; times = set(m5.time); mr = {}
for d in sorted(set(m5.time.dt.normalize())):
    a = m5[(m5.time >= d + 7 * H) & (m5.time < d + 11 * H)]
    if d.weekday() < 5 and len(a) >= 40: mr[d] = (a.high.max(), a.low.min())
rng_s = pd.Series({d: (h - l) / PIP for d, (h, l) in mr.items()}); med20 = rng_s.shift(1).rolling(20).median()
def signals(B):
    out = []
    for d, (hi, lo) in mr.items():
        b = m5[(m5.time >= d + 11 * H) & (m5.time < d + 15 * H)]
        if len(b) < 40 or d + 17 * H not in times: continue
        x = b[(b.close >= hi + B * PIP) | (b.close <= lo - B * PIP)]
        if x.empty or x.time.iloc[0] + M not in times: continue
        r = x.iloc[0]; out.append(dict(day=d.strftime("%Y-%m-%d"), t_in=r.time + M, side=1 if r.close > hi else -1, mrange=rng_s[d], quiet=bool(rng_s[d] < med20[d]) if np.isfinite(med20[d]) else False, late=d.strftime("%Y-%m-%d") >= MID))
    return pd.DataFrame(out)
if MODE == "count":
    for B in (0, 3, 6):
        S = signals(B); print(f"B = {B}: {len(S)} trades | before {MID}: {int((~S.late).sum())} | from: {int(S.late.sum())} | up {int((S.side > 0).sum())} down {int((S.side < 0).sum())} | with a quieter-than-median morning: {int(S.quiet.sum())}")
    sys.exit()
def trade(r, side, costs=None):
    d = pd.Timestamp(r.day, tz="UTC"); x = m5[(m5.time >= r.t_in) & (m5.time <= d + 17 * H)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= d + 17 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    S = signals(int(sys.argv[3])); r = S[S.day == sys.argv[4]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 5: print("break:", trade(r, r.side), "| fade:", trade(r, -r.side))
    sys.exit()
B = int(sys.argv[3]); S = signals(B); keep = {}; rng = np.random.default_rng(27)
for name, X, sg in ((f"MB1 break, B={B}", S, 1), (f"MB2 break, B={B}, quieter morning", S[S.quiet], 1), ("MB0 fade on MB1's signals", S, -1)):
    X = X.reset_index(drop=True); res = [trade(r, sg * r.side) for r in X.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * r.side, (2.0, 0.5))[0] for r in X.itertuples()]); lt = X.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("MB1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["MB1"] - keep["MB0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"MB1 minus MB0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES MB1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

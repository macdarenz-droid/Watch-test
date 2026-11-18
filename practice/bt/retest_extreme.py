"""Idea DT (journal/2015-idea-DT-retest-of-the-days-extreme.md): day's extreme (from 07:00 London) set before 11:00; pullback >= P pips; first M5 candle in 11:00-15:00
within 3 pips of that extreme = retest. Next open: away from the extreme (fade) or through it (break), stop 25, out 2 hours later. One trade a day (the first retest
of either side). usage: python bt/retest_extreme.py END count | check P DATE [x] | test P1 P2"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 25; H = pd.Timedelta(hours=1); M = pd.Timedelta(minutes=5); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; times = set(m5.time)
def signals(P):
    out = []
    for d in sorted(set(m5.time.dt.normalize())):
        if d.weekday() > 4: continue
        a = m5[(m5.time >= d + 7 * H) & (m5.time < d + 11 * H)]; b = m5[(m5.time >= d + 11 * H) & (m5.time < d + 15 * H)]
        if len(a) < 40 or len(b) < 40: continue
        hi, lo = a.high.max(), a.low.min(); cands = []
        for side, ext in ((1, hi), (-1, lo)):           # side +1 = the extreme is a high
            seen = pd.concat([a[a.time > (a.time[a.high.idxmax()] if side > 0 else a.time[a.low.idxmin()])], b])
            run = (ext - seen.low.cummin()) / PIP if side > 0 else (seen.high.cummax() - ext) / PIP
            if side > 0 and (b.high > ext).any() and b.time[b.high > ext].iloc[0] < b.time.iloc[0]: pass
            for i, bar in enumerate(seen.itertuples()):
                if bar.time < d + 11 * H: continue
                if (side > 0 and bar.high > ext) or (side < 0 and bar.low < ext):                        # broke the extreme before a retest: no pattern
                    if not ((side > 0 and bar.high >= ext - 3 * PIP) or (side < 0 and bar.low <= ext + 3 * PIP)): break
                if run.iloc[i] >= P and ((side > 0 and bar.high >= ext - 3 * PIP) or (side < 0 and bar.low <= ext + 3 * PIP)):
                    if bar.time + M in times: cands.append((bar.time, side, ext))
                    break
        if cands:
            t, side, ext = min(cands); out.append(dict(day=d.strftime("%Y-%m-%d"), t_sig=t, t_in=t + M, t_out=t + M + 2 * H, ext=ext, side=side, late=d.strftime("%Y-%m-%d") >= MID))
    return pd.DataFrame(out)
if MODE == "count":
    for P in (15, 20, 30, 40):
        S = signals(P); print(f"P = {P}: {len(S)} trades | before {MID}: {int((~S.late).sum())} | from: {int(S.late.sum())} | retests of a high {int((S.side > 0).sum())}, of a low {int((S.side < 0).sum())}")
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
    P = int(sys.argv[3]); S = signals(P); r = S[S.day == sys.argv[4]].iloc[0]; print(r.to_string())
    if len(sys.argv) > 5: print("fade:", trade(r, -r.side), "| break:", trade(r, r.side))
    sys.exit()
P1, P2 = int(sys.argv[3]), int(sys.argv[4]); keep = {}; rng = np.random.default_rng(26)
for name, S, sg in ((f"DT1 fade, P={P1}", signals(P1), -1), (f"DT2 fade, P={P2}", signals(P2), -1), (f"DT0 break on DT1's signals", signals(P1), 1)):
    res = [trade(r, sg * r.side) for r in S.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * r.side, (2.0, 0.5))[0] for r in S.itertuples()]); lt = S.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("DT1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["DT1"] - keep["DT0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"DT1 minus DT0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES DT1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

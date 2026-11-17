"""Idea SF (journal/2015-idea-SF-spike-fade.md): M15 spike (range >= A pips, body >= B pips), signals 07:00-20:00 London. Next candle's open: market against it (fade)
or with it (follow), stop 20 pips, out at the open of the 5th candle after the spike. One position at a time. SF1 A=25 B=15 | SF2 A=35 B=20 | SF0 follow on SF1.
usage: python bt/spike_fade.py END count | check DATE | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 20; MID = "2015-04-07"; Q = pd.Timedelta(minutes=15)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")].reset_index(drop=True)
g = m5.set_index("time").resample("15min").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna().reset_index()
g["rng"] = (g.high - g.low) / PIP; g["body"] = (g.close - g.open) / PIP; times = set(m5.time)
def signals(A, B):
    s = g[(g.rng >= A) & (g.body.abs() >= B) & (g.time.dt.hour >= 7) & (g.time.dt.hour < 20) & (g.time.dt.weekday < 5)]; out = []; busy_until = None
    for r in s.itertuples():
        t_in, t_out = r.time + Q, r.time + 5 * Q
        if t_in not in times or t_out not in times: continue
        if busy_until is not None and t_in < busy_until: continue          # one position at a time (the earlier trade may run to its time exit)
        out.append(dict(t_sig=r.time, t_in=t_in, t_out=t_out, dir=int(np.sign(r.body)), rng=r.rng, body=r.body, day=r.time.strftime("%Y-%m-%d"))); busy_until = t_out
    return pd.DataFrame(out)
S1, S2 = signals(25, 15), signals(35, 20)
if MODE == "count":
    for n, S in (("SF1 range>=25 body>=15", S1), ("SF2 range>=35 body>=20", S2)):
        d = S.day.value_counts(); print(f"{n}: trades {len(S)} | before {MID}: {int((S.day < MID).sum())} | from: {int((S.day >= MID).sum())} | on {S.day.nunique()} different days | the 5 busiest days hold {int(d.head(5).sum())} trades ({', '.join(f'{k[5:]}:{v}' for k, v in d.head(5).items())}) | up spikes {int((S.dir > 0).sum())} down {int((S.dir < 0).sum())}")
    sys.exit()
bars = m5.set_index("time")
def trade(r, side, costs=None):
    x = m5[(m5.time >= r.t_in) & (m5.time <= r.t_out)]; acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for i, bar in enumerate(x.to_dict("records")):
        if i == 0: acct.market(side, round(RISK / (SL * 10), 3), sl=bar["open"] - side * SL * PIP, tag="x")
        if acct.positions and bar["time"] >= r.t_out: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1].to_dict())
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
if MODE == "check":
    X = S1[S1.day == sys.argv[3]]; print(X[["t_sig", "dir", "rng", "body", "t_in", "t_out"]].round(1).to_string(index=False))
    if len(sys.argv) > 4 and len(X): r = X.iloc[0]; print("first signal -> fade:", trade(r, -r.dir), "| follow:", trade(r, r.dir))
    sys.exit()
def dd(q): eq = q.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
rng_ = np.random.default_rng(71); keep = {}
for name, S, sg in (("SF1 fade", S1, -1), ("SF2 fade (bigger spikes)", S2, -1), ("SF0 follow on SF1's signals", S1, 1)):
    J = S.copy(); J["R"] = [trade(r, sg * r.dir)[0] for r in J.itertuples()]; J["why"] = [trade(r, sg * r.dir)[1] for r in J.itertuples()]; J["Rs"] = [trade(r, sg * r.dir, (2.0, 0.5))[0] for r in J.itertuples()]
    R = J.R.reset_index(drop=True); late = (J.day >= MID).values; top = J.day.value_counts().head(5).index; nb = J[~J.day.isin(top)].R; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | full stops {int((J.why == 'sl').sum())} | before {MID}: {R[~late].sum():+.2f} | from: {R[late].sum():+.2f} | without best 5 {R.sum() - R.nlargest(5).sum():+.2f} | without the 5 busiest days {nb.sum():+.2f} ({len(nb)} trades) | stressed avg {J.Rs.mean():+.3f} | max DD {dd(R):.2f}R")
    if name.startswith("SF1"): K = [R.mean() >= 0.10, R[~late].sum() > 0 and R[late].sum() > 0, (R.sum() - R.nlargest(5).sum() > 0) and nb.sum() > 0, None, J.Rs.mean() > 0, dd(R) <= 8.0, None]
diff = (keep["SF1"] - keep["SF0"]).values; p = (np.abs((rng_.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05; K[6] = keep["SF2"].mean() >= keep["SF1"].mean()
print(f"fade minus follow {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES SF1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

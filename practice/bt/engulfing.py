"""Idea EN (journal/2015-idea-EN-hourly-engulfing.md): H1 engulfing (body covers the previous opposite body), signal candles 07:00-16:00 London; next H1 open in its
direction (or against: control), stop 20, out 2 hours after entry. One position at a time. EN2: range >= 1.5 x previous range. usage: python bt/engulfing.py END count | check DATE [x] | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 20; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; times = set(m5.time)
g = m5.set_index("time").resample("1h").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna().reset_index()
def signals(strong):
    out = []; busy = None
    for i in range(1, len(g)):
        p, c = g.iloc[i - 1], g.iloc[i]
        if c.time - p.time != H or c.time.weekday() > 4 or not (7 <= c.time.hour <= 16): continue
        bull = p.close < p.open and c.close > c.open and c.open <= p.close and c.close >= p.open
        bear = p.close > p.open and c.close < c.open and c.open >= p.close and c.close <= p.open
        if not (bull or bear): continue
        if strong and (c.high - c.low) < 1.5 * (p.high - p.low): continue
        t_in = c.time + H; t_out = t_in + 2 * H
        if t_in not in times or t_out not in times or (busy is not None and t_in < busy): continue
        out.append(dict(day=c.time.strftime("%Y-%m-%d"), t_sig=c.time, t_in=t_in, t_out=t_out, dir=1 if bull else -1, late=c.time.strftime("%Y-%m-%d") >= MID)); busy = t_out
    return pd.DataFrame(out)
S1, S2 = signals(False), signals(True)
if MODE == "count":
    for n, S in (("EN1 every engulfing", S1), ("EN2 range >= 1.5x", S2)): dc = S.day.value_counts(); print(f"{n}: {len(S)} trades | before {MID}: {int((~S.late).sum())} | from: {int(S.late.sum())} | on {S.day.nunique()} days | bullish {int((S.dir > 0).sum())} bearish {int((S.dir < 0).sum())} | 5 busiest days hold {int(dc.head(5).sum())}")
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
    X = S1[S1.day == sys.argv[3]]; print(X[["t_sig", "dir", "t_in", "t_out"]].to_string(index=False))
    if len(sys.argv) > 4 and len(X): r = X.iloc[0]; print("first -> with:", trade(r, r.dir), "| against:", trade(r, -r.dir))
    sys.exit()
keep = {}; rng = np.random.default_rng(30)
for name, S, sg in (("EN1 with the engulfing", S1, 1), ("EN2 strong engulfing only", S2, 1), ("EN0 against EN1's signals (control)", S1, -1)):
    S = S.reset_index(drop=True); res = [trade(r, sg * r.dir) for r in S.itertuples()]; R = pd.Series([z[0] for z in res]); W = [z[1] for z in res]
    Rs = pd.Series([trade(r, sg * r.dir, (2.0, 0.5))[0] for r in S.itertuples()]); lt = S.late.values; keep[name[:3]] = R
    print(f"{name}: trades {len(R)} | wins {(R > 0).mean():.0%} | avg {R.mean():+.3f}R (+-{2 * R.std(ddof=1) / np.sqrt(len(R)):.2f}) | net {R.sum():+.2f} | stops {W.count('sl')} | before {MID}: {R[~lt].sum():+.2f} | from: {R[lt].sum():+.2f} | stressed avg {Rs.mean():+.3f}")
    if name.startswith("EN1"): K = [R.mean() >= 0.10, R[~lt].sum() > 0 and R[lt].sum() > 0, Rs.mean() > 0, None]
diff = (keep["EN1"] - keep["EN0"]).values; p = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(diff.mean())).mean(); K[3] = diff.mean() > 0 and p < 0.05
print(f"EN1 minus EN0 {diff.mean():+.3f}R, sign-flip p {p:.4f}"); print("KILL LINES EN1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

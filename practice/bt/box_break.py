"""Idea BX: follow the first break of the 12:00-13:25 London box between 13:25 and 14:30; flat at 17:00. Own small simulator on M5 bid candles (described in the journal):
buy fills at max(box high, bar open) + spread + slippage; sell fills at min(box low, bar open) - slippage; a stop touched in the entry bar counts (worst case);
stops fill at the stop price with slippage against me; 17:00 exit at the bar's open with slippage. R = result in pips / stop distance in pips.
BX1 stop 30 pips; BX2 stop on the other side of the box (skip boxes > 60 pips); BX3 = BX1 only when the box is <= 30 pips.
usage: python bt/box_break.py END [--check DATE,DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").R.sum()
def one(d, k, spread, slip, verbose=False):
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=12)) & (m5.time <= dd_ + pd.Timedelta(hours=17))]
    box = x[x.time < dd_ + pd.Timedelta(hours=13, minutes=25)]; win = x[(x.time >= dd_ + pd.Timedelta(hours=13, minutes=25)) & (x.time < dd_ + pd.Timedelta(hours=14, minutes=30))]
    if len(box) < 12 or win.empty: return None
    H, L = box.high.max(), box.low.min(); bw = (H - L) / PIP
    if k == "BX3" and bw > 30: return None
    if k == "BX2" and bw > 60: return None
    side = 0
    for b in win.itertuples():
        up, dn = b.high >= H, b.low <= L
        if not (up or dn): continue
        if up and dn: side = 1 if abs(b.open - H) <= abs(b.open - L) else -1      # both edges inside one candle: take the edge nearer the open first
        else: side = 1 if up else -1
        t0 = b.time
        if side > 0: fill = max(H, b.open) + spread * PIP + slip * PIP; stop = (L if k == "BX2" else fill - 30 * PIP)          # stop is a BID level for a long
        else: fill = min(L, b.open) - slip * PIP; stop = (H if k == "BX2" else fill + 30 * PIP)                                # stop is an ASK level for a short
        break
    if side == 0: return None
    risk = abs(fill - stop) / PIP; res = None
    for b in x[x.time >= t0].itertuples():
        if b.time >= dd_ + pd.Timedelta(hours=17): res = ((b.open - slip * PIP) - fill) / PIP if side > 0 else (fill - (b.open + spread * PIP + slip * PIP)) / PIP; reason = "17:00"; tx = b.time; break
        if side > 0 and b.low <= stop: res = ((stop - slip * PIP) - fill) / PIP; reason = "stop"; tx = b.time; break
        if side < 0 and b.high + spread * PIP >= stop: res = (fill - (stop + slip * PIP)) / PIP; reason = "stop"; tx = b.time; break
    if res is None: return None
    if verbose: print(f"   {k}: box {L:.5f}-{H:.5f} ({bw:.1f} pips) | break {'UP' if side>0 else 'DOWN'} in the {t0.strftime('%H:%M')} candle | fill {fill:.5f} stop {stop:.5f} (risk {risk:.1f} pips) | out {reason} at {tx.strftime('%H:%M')} | {res:+.1f} pips = {res/risk:+.2f}R")
    return dict(tag=d, R=res / risk, stop=reason == "stop", side=side)
def run(k, spread=1.0, slip=0.1):
    rows = [r for r in (one(d, k, spread, slip) for d in A.index) if r]; return pd.DataFrame(rows).set_index("tag")
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=13, minutes=20)) & (m5.time <= dd_ + pd.Timedelta(hours=14))]
        print(d, "candles around the window (bid):"); print(x[["time", "open", "high", "low", "close"]].assign(time=x.time.dt.strftime("%H:%M")).round(5).to_string(index=False))
        p17 = m5[m5.time == dd_ + pd.Timedelta(hours=17)].open.iloc[0]; print(f"   17:00 open (bid) {p17:.5f}")
        for k in ("BX1", "BX2", "BX3"):
            if one(d, k, 1.0, 0.1, verbose=True) is None: print(f"   {k}: no trade")
        one(d, "BX1", 3.0, 1.0, verbose=True)
    sys.exit()
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); PS = ("Jan", "Feb", "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"A2 days to {END}: {len(A)}")
for k in ("BX1", "BX2", "BX3"):
    t = run(k); r = t.R; rs = run(k, 3.0, 1.0).R; P = pd.Series(r.index.map(per), index=r.index); top3 = r.nlargest(3).sum(); m = pd.concat([r, A], axis=1, keys=["n", "a"]).dropna()
    corr = np.corrcoef(m.n, m.a)[0, 1]; onloss = m.n[m.a < 0].sum(); pp = {p: r[P == p].sum() for p in PS}; w10 = r.rolling(10).sum().min(); se = r.std(ddof=1) / np.sqrt(len(r))
    print(f"{k}: n={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} (+-{2*se:.2f}) net={r.sum():+.2f} stops={int(t.stop.sum())} ({100*t.stop.mean():.0f}%) dd={dd(r):.2f} worst10={w10:+.2f} | " + " ".join(f"{p} {v:+.2f} ({int((P==p).sum())})" for p, v in pp.items()) +
          f" | without best 3: {r.sum()-top3:+.2f} | STRESSED (3.0 spread, 1.0 slip): avg {rs.mean():+.3f} net {rs.sum():+.2f} | corr with A2 {corr:+.2f}, net on A2's losing days {onloss:+.2f} ({int((m.a<0).sum())}) | ups {int((t.side>0).sum())} downs {int((t.side<0).sum())}")
    k1 = r.mean() >= 0.15; k2 = rs.mean() >= 0.05; k3 = all(v > 0 for v in pp.values()); k4 = r.sum() - top3 > 0; k5 = dd(r) <= 5 and w10 >= -4; k6 = corr <= 0.30 and onloss >= 0; k7 = len(r) >= 50
    print(f"     KILL LINES: K1 avg >= +0.15: {'PASS' if k1 else 'FAIL'} | K2 stressed avg >= +0.05: {'PASS' if k2 else 'FAIL'} | K3 all periods positive: {'PASS' if k3 else 'FAIL'} | K4 without best 3: {'PASS' if k4 else 'FAIL'} | K5 dd, worst10: {'PASS' if k5 else 'FAIL'} | K6 independence: {'PASS' if k6 else 'FAIL'} | K7 >= 50 trades: {'PASS' if k7 else 'FAIL'}")

"""Idea MH: the momentum hour (journal/2015-idea-MH-momentum-hour-second-setup.md; rule and kill lines written first).
Signal: clock hour starting 11..19 London, |body| >= 20 pips, close beyond the high/low of the 3 clock hours before. Entry next hour's open, stop 30 pips,
hold 1 hour / 2 hours / to 21:00. One position at a time. usage: python bt/momentum_hour.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4; H = pd.Timedelta(hours=1); BODY, SL, UNSEEN = 20, 30, "2015-04-01"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")].reset_index(drop=True)
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.groupby("tag").R.sum()
h = m5.set_index("time").resample("1h").agg(open=("open", "first"), high=("high", "max"), low=("low", "min"), close=("close", "last"), n=("open", "size")).dropna()
h = h[h.n >= 10]; sig = []
for t in h.index:
    if t.weekday() >= 5 or not (11 <= t.hour <= 19): continue
    prev = [t - k * H for k in (1, 2, 3)]
    if not all(p in h.index for p in prev) or (t + H) not in h.index: continue
    b = h.loc[t]; body = (b.close - b.open) / PIP; hi = h.loc[prev].high.max(); lo = h.loc[prev].low.min()
    if body >= BODY and b.close > hi: sig.append((t + H, 1))
    if body <= -BODY and b.close < lo: sig.append((t + H, -1))
def run(hold, sp=1.0, sl=0.1):
    out = []; free = pd.Timestamp("2000-01-01", tz="UTC")
    for t0, side in sig:
        if t0 < free: continue
        dl = t0 + hold * H if hold else t0.normalize() + 21 * H
        x = m5[(m5.time >= t0) & (m5.time <= dl)]
        if x.empty or x.time.iloc[0] != t0: continue
        entry = x.open.iloc[0] + (sp + sl) * PIP if side > 0 else x.open.iloc[0] - sl * PIP; stop = entry - side * SL * PIP; px = None
        for _, b in x.iterrows():
            if b.time >= dl: px = b.open - sl * PIP if side > 0 else b.open + (sp + sl) * PIP; why = "time"; break
            if side > 0 and b.low <= stop: px, why = stop - sl * PIP, "stop"; break
            if side < 0 and b.high + sp * PIP >= stop: px, why = stop + sl * PIP, "stop"; break
        if px is None: b = x.iloc[-1]; px = b.close - sl * PIP if side > 0 else b.close + (sp + sl) * PIP; why = "end"
        free = b.time if why != "stop" else b.time + pd.Timedelta(minutes=5)
        out.append(dict(day=t0.strftime("%Y-%m-%d"), at=t0.strftime("%H:%M"), side=side, entry=entry, exit=px, why=why, out=b.time.strftime("%H:%M"), R=(px - entry) * side / (SL * PIP)))
    return pd.DataFrame(out)
V = {"MH1 hold 1 hour": 1, "MH2 hold 2 hours": 2, "MH3 hold to 21:00": 0}
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for k, v in V.items():
        T = run(v); T = T[T.day == d]; print(k + ": " + " | ".join(f"{r.at} {'B' if r.side > 0 else 'S'} {r.entry:.5f} -> {r.why} {r.out} {r.exit:.5f} {r.R:+.2f}R" for r in T.itertuples()) + f" || day {T.R.sum():+.2f}R")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"signals to {END}: {len(sig)} on {len(set(t.date() for t, _ in sig))} days")
for k, v in V.items():
    T = run(v); S = run(v, sp=2.0, sl=0.5); u = T.day >= UNSEEN; daily = T.groupby("day").R.sum(); c = daily.corr(a2.reindex(daily.index))
    print(f"{k}: {len(T)} trades on {T.day.nunique()} days | avg {T.R.mean():+.3f}R | net {T.R.sum():+.2f} | wins {(T.R > 0).mean():.0%} | full stops {(T.why == 'stop').mean():.0%} | avg win {T.R[T.R > 0].mean():+.2f} | STUDY months: {int((~u).sum())} trades avg {T.R[~u].mean():+.3f} net {T.R[~u].sum():+.2f} | UNSEEN from {UNSEEN}: {int(u.sum())} trades avg {T.R[u].mean():+.3f} net {T.R[u].sum():+.2f}")
    print(f"     without its 3 best trades {T.R.sum() - T.R.nlargest(3).sum():+.2f} | max DD {dd(T.R):.2f}R | stressed avg {S.R.mean():+.3f} | corr of daily R with A2 {c:+.2f} | by month: " + " ".join(f"{m}:{x:+.1f}" for m, x in T.groupby(T.day.str[:7]).R.sum().items()))
    K = [T.R.mean() >= 0.10, T.R[u].mean() >= 0.05, T.R.sum() - T.R.nlargest(3).sum() > 0, dd(T.R) <= 8.0, S.R.mean() >= 0.05, len(T) >= 100 and u.sum() >= 40, not (c > 0.30)]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))

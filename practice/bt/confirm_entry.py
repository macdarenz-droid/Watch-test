"""Idea CF: A2 entered by a stop order X pips beyond the 08:00 bid (window 08:00-10:00), stop 40 pips from the trigger level, out 12:00 London.
Own M5 simulator; X = 0 must reproduce engine A2. usage: python bt/confirm_entry.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"), stop=("reason", lambda x: (x == "sl").any()))
DAY = {d: m5[(m5.time >= pd.Timestamp(d, tz="UTC") + pd.Timedelta(hours=8)) & (m5.time <= pd.Timestamp(d, tz="UTC") + pd.Timedelta(hours=12))] for d in A.index}
def one(d, X, sp=1.0, sl=0.1):
    x = DAY[d]; s = int(A.side[d]); dd_ = pd.Timestamp(d, tz="UTC"); B = x.open.iloc[0]; trig = B + s * X * PIP; pos = None
    for b in x.itertuples():
        if b.time >= dd_ + pd.Timedelta(hours=12):
            if pos is None: return dict(tag=d, R=0.0, why="no entry", fill=np.nan, exit=np.nan, t="")
            ex = b.open - sl * PIP if s > 0 else b.open + (sp + sl) * PIP; return dict(tag=d, R=(ex - pos[0]) * s / pos[2], why="noon", fill=pos[0], exit=ex, t=pos[3])
        if pos is None:
            if b.time >= dd_ + pd.Timedelta(hours=10): continue
            hit = b.high >= trig if s > 0 else b.low <= trig
            if not hit: continue
            lvl = max(trig, b.open) if s > 0 else min(trig, b.open); fill = lvl + (sp + sl) * PIP if s > 0 else lvl - sl * PIP; stp = trig - s * 40 * PIP; pos = (fill, stp, abs(fill - stp), b.time.strftime("%H:%M"))
        stopped = b.low <= pos[1] if s > 0 else b.high + sp * PIP >= pos[1]
        if stopped:
            ex = pos[1] - sl * PIP if s > 0 else pos[1] + sl * PIP; return dict(tag=d, R=(ex - pos[0]) * s / pos[2], why="stop", fill=pos[0], exit=ex, t=pos[3])
    return dict(tag=d, R=0.0, why="no entry", fill=np.nan, exit=np.nan, t="")
def run(X, sp=1.0, sl=0.1): return pd.DataFrame([one(d, X, sp, sl) for d in A.index]).set_index("tag")
C0 = run(0); eng = A.R; print(f"regression: X = 0 against engine A2: stop days identical {bool(((C0.why == 'stop') == A.stop).all())}; largest difference per day {(C0.R - eng).abs().max():.3f}R (R unit: mine divides by the fill-to-stop distance, the engine by 40 pips); sums {C0.R.sum():+.2f} vs {eng.sum():+.2f}")
a = C0.R      # baseline = my own X = 0 run, same R unit as the variants (decided after the regression print, before any variant total was seen)
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for X in (0, 5, 10, 15): r = one(d, X); print(f"{d} X={X}: {r['why']} | entered {r['t']} fill {r['fill']:.5f} exit {r['exit']:.5f} | {r['R']:+.2f}R (A2 {a[d]:+.2f}R)")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
late = a.index >= "2015-03-02"; S0 = run(0, 2.0, 1.0).R
print(f"A2: {len(a)} days net {a.sum():+.2f} dd {dd(a):.2f} full stops {int(A.stop.sum())} | before 03-02 {a[~late].sum():+.2f} | from 03-02 {a[late].sum():+.2f} | at stressed costs (2.0 / 1.0) {S0.sum():+.2f}")
out = {}
for k, X in (("CF1", 5), ("CF2", 10), ("CF3", 15)):
    c = run(X); r = c.R; df = r - a; s = run(X, 2.0, 1.0).R; out[k] = (df.sum(), df[~late].sum(), df[late].sum(), int((c.why == "stop").sum()), dd(r), s.sum() - S0.sum())
    ne = c.why == "no entry"
    print(f"{k} +{X} pips: net {r.sum():+.2f} ({df.sum():+.2f} vs A2) | before 03-02 {df[~late].sum():+.2f} | from 03-02 {df[late].sum():+.2f} | entered {int((~ne).sum())}, no entry {int(ne.sum())} (A2 on those days: {a[ne].sum():+.2f}R, of which full stops {int(A.stop[ne].sum())}, winners {int((a[ne]>0).sum())}) | full stops {int((c.why=='stop').sum())} (new ones on days A2 was not stopped: {int(((c.why=='stop')&~A.stop).sum())}) | dd {dd(r):.2f} | win {100*(r>0).mean():.0f}% | stressed vs A2 stressed {s.sum()-S0.sum():+.2f}")
c2 = out["CF2"]; K = [c2[0] >= 2.0, c2[1] >= 0 and c2[2] >= 1.0, c2[3] <= int(A.stop.sum()) - 5 and c2[4] <= dd(a) + 1e-9, out["CF1"][0] >= -1.0 and out["CF3"][0] >= -1.0, c2[5] >= 0]
print("KILL LINES for CF2: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))

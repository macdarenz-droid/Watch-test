"""SW1 PAPER SHADOW (journal/SW1-paper-shadow-rules.md): SW1 exactly as tested (10-day direction, 08:00 entry if flat, stop 120, target 240, out 12:00 on the
5th trading day), started FLAT on 2015-07-20. Financing ASSUMPTION: 1.0 pip per calendar night held (22:00 London; Fri-Mon = 3), charged whatever the side.
usage: python bt/sw1_shadow.py END [signal]   'signal' prints only the direction for the next entry from the last closed day."""
import sys, os, io, contextlib
END = sys.argv[1]; SIG = len(sys.argv) > 2; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.argv = [sys.argv[0], END, "none"]
with contextlib.redirect_stdout(io.StringIO()): import slow_a2 as sw
import pandas as pd, numpy as np
START = pd.Timestamp("2015-07-20", tz="UTC"); H = pd.Timedelta(hours=1); FIN = 1.0; S = 120
if SIG:
    c = sw.cl; print(f"last closed London day {c.index[-1].strftime('%a %m-%d')} close {c.iloc[-1]:.5f} vs 10 days earlier ({c.index[-11].strftime('%m-%d')}) {c.iloc[-11]:.5f}: gap {(c.iloc[-1] - c.iloc[-11]) / 1e-4:+.1f} pips -> {'BUY' if c.iloc[-1] > c.iloc[-11] else 'SELL'}"); sys.exit()
sw.REC = [b for b in sw.REC if b["time"] >= START]; T = sw.run(10, S, 5)
if T.empty: print("no shadow trade yet"); sys.exit()
tot = 0.0
for r in T.itertuples():
    e = pd.Timestamp(r.day, tz="UTC") + 8 * H
    if r.why == "open at END": print(f"OPEN: {r.day} {'BUY' if r.side > 0 else 'SELL'} at {r.open8:.5f} (10-day gap {r.gap:+.1f}), stop {r.open8 - r.side * S * 1e-4:.5f}, target {r.open8 + r.side * 2 * S * 1e-4:.5f}"); continue
    x = pd.Timestamp(r.exit_time); nights = sum(1 for k in range(0, 40) if e < e.normalize() + pd.Timedelta(days=k) + 22 * H <= x); fin = nights * FIN / S; tot += r.R - fin
    print(f"{r.day} {'BUY' if r.side > 0 else 'SELL'} {r.open8:.5f} -> {r.why} {r.exit:.5f} at {x.strftime('%m-%d %H:%M')} | {r.R:+.2f}R | nights {nights} financing -{fin:.3f}R | net {r.R - fin:+.2f}R | running {tot:+.2f}R")

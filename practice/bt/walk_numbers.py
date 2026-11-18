"""Distances of the last N M15 candles from my fill, for the intraday notes. usage: python bt/walk_numbers.py buy|sell ENTRY STOP N"""
import sys, subprocess
side, e, sl, n = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), int(sys.argv[4]); s = 1 if side == "buy" else -1; spr = 0.0 if s > 0 else 0.0001
out = subprocess.run([sys.executable, "sim.py", "bars", "--tf", "M15", "--n", str(n)], capture_output=True, text=True).stdout.strip().splitlines()[-(n+1):-1]
rows = [l.split() for l in out]; f = lambda px: s * (px + spr - e) * 1e4
for r in rows:
    o, h, l, c = map(float, r[2:6]); best = f(h) if s > 0 else f(l); worst = f(l) if s > 0 else f(h)
    print(f"  {r[1][:5]} UTC  high {h:.5f} low {l:.5f} close {c:.5f} | best {best:+.1f} worst {worst:+.1f} close {f(c):+.1f} pips")
hs = max(float(r[3]) for r in rows); ls = min(float(r[4]) for r in rows); last = float(rows[-1][5])
best = f(hs) if s > 0 else f(ls); worst = f(ls) if s > 0 else f(hs)
print(f"  WINDOW: {n} M15 candles = {n*15} minutes, {rows[0][1][:5]}..{rows[-1][1][:5]} UTC (candle open times). Use 8 for 08:00-10:00, 16 for 08:00-12:00.")
print(f"  over these {n}: best {best:+.1f} | worst {worst:+.1f} | last {f(last):+.1f} | stop distance from fill {abs(e-sl)*1e4:.1f} | worst-to-stop {(abs(e-sl)*1e4 + worst):.1f} pips left")

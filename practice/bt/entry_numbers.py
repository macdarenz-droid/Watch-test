"""Figures for the 08:00 note. usage: python bt/entry_numbers.py buy|sell NIGHT_OPEN PRICE_AT_0700"""
import sys, subprocess
side, op, p7 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]); s = 1 if side == "buy" else -1
out = subprocess.run([sys.executable, "sim.py", "bars", "--tf", "M15", "--n", "4"], capture_output=True, text=True).stdout.strip().splitlines()[-5:-1]
for l in out: print(" ", l[:60])
rows = [l.split() for l in out]; hi = max(float(r[3]) for r in rows); lo = min(float(r[4]) for r in rows); last = float(rows[-1][5]); rng = (hi - lo) * 1e4
print(f"  pre-entry hour high {hi:.5f} low {lo:.5f} = {rng:.1f} pips -> PH2: {'LIVELY (paper half size)' if rng >= 30 else 'quiet (paper full size)'} | last {last:.5f}")
print(f"  night 00:00 open {op:.5f} -> {last:.5f}: {s*(last-op)*1e4:+.1f} pips for my side ({'with me' if s*(last-op) >= 0 else 'AGAINST me -> counted'}) | vs 07:00 price {p7:.5f}: entry is {s*(p7-last)*1e4:+.1f} pips better(+)/worse(-) | stop {last - s*0.0040:.5f}")

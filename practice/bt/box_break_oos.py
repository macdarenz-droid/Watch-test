"""BX2 out of sample (journal/2015-07-21-closest-misses-and-BX-out-of-sample.md): bt/box_break.py's own functions, untouched, on days from 2015-05-12 only.
usage: python bt/box_break_oos.py END count | facts DATE | test"""
import sys, os, io, contextlib
END, MODE = sys.argv[1], sys.argv[2]; ARG = sys.argv[3] if len(sys.argv) > 3 else None
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.argv = [sys.argv[0], END]
import types; bb = types.SimpleNamespace(); src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "box_break.py")).read()
ns = {"__name__": "box_break_defs", "__file__": os.path.join(os.path.dirname(os.path.abspath(__file__)), "box_break.py")}; exec(src[:src.index('if "--check" in sys.argv:')], ns); bb.one, bb.A, bb.m5 = ns["one"], ns["A"], ns["m5"]   # definitions only, byte for byte; the results table is not run
import pandas as pd, numpy as np
START, HALF = "2015-05-12", "2015-06-16"; days = [d for d in bb.A.index if d >= START]
if MODE == "facts":
    d = pd.Timestamp(ARG, tz="UTC"); x = bb.m5[(bb.m5.time >= d + pd.Timedelta(hours=12)) & (bb.m5.time < d + pd.Timedelta(hours=13, minutes=25))]
    print(f"{ARG}: box 12:00-13:25 high {x.high.max():.5f} low {x.low.min():.5f} = {(x.high.max() - x.low.min()) / 1e-4:.1f} pips ({len(x)} candles)"); sys.exit()
T = pd.DataFrame([dict(r, day=d) for d in days for r in [bb.one(d, "BX2", 1.0, 0.1)] if r]); 
if MODE == "count": print(f"unseen A2 days {days[0]}..{days[-1]}: {len(days)} | BX2 trades {len(T)} | first half (before {HALF}) {int((T.day < HALF).sum())} | second half {int((T.day >= HALF).sum())} | days without a trade {len(days) - len(T)}"); sys.exit()
S = pd.DataFrame([dict(r, day=d) for d in days for r in [bb.one(d, "BX2", 3.0, 1.0)] if r]); r = T.set_index("day").R; a = bb.A.reindex(r.index)
dd = lambda q: ((q.cumsum().cummax().clip(lower=0)) - q.cumsum()).max(); w10 = r.rolling(10).sum().min(); corr = np.corrcoef(r, a)[0, 1]; h1, h2 = r[r.index < HALF], r[r.index >= HALF]
print(f"BX2 UNSEEN {days[0]}..{days[-1]}: trades {len(r)} | wins {(r > 0).mean():.0%} | avg {r.mean():+.3f}R (+-{2 * r.std(ddof=1) / np.sqrt(len(r)):.2f}) | net {r.sum():+.2f} | stops {int(T.stop.sum())} | ups {int((T.side > 0).sum())} downs {int((T.side < 0).sum())}")
print(f"   first half {len(h1)}: {h1.sum():+.2f} | second half {len(h2)}: {h2.sum():+.2f} | without best 3 {r.sum() - r.nlargest(3).sum():+.2f} | max DD {dd(r):.2f}R | worst 10 in a row {w10:+.2f} | stressed avg {S.R.mean():+.3f} | corr with A2 {corr:+.2f}")
K = [r.mean() >= 0.15, S.R.mean() >= 0.05, r.sum() - r.nlargest(3).sum() > 0, dd(r) <= 5 and w10 >= -4, corr <= 0.30, h1.sum() > 0 and h2.sum() > 0]
print("   KILL LINES: " + " | ".join(f"O{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)) + f" | judgeable (>= 25 trades): {len(r) >= 25}")
if ARG: print(T[T.day == ARG].to_string(index=False))

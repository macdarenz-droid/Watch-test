"""Idea AL: operating characteristics of my A2 alarm. Real live trades so far + N-to-100 future trades reshuffled from the engine A2 list shifted to a true
average (0, -0.10, +0.18). AL1 = all 100: avg >= +0.10R and max DD <= 8R; AL2 = the new trades avg >= 0; AL3 = the new trades avg >= +0.10R.
usage: python bt/alarm_power.py END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; RUNS = 20000
t = pd.read_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "sim", "trades.csv"), parse_dates=["entry_time"]); t["R"] = t.pnl / ((t.sl - t.entry).abs() * t.lots * 1e5)
live = t[(t.entry_time >= "2015-03-02") & (t.entry_time < END)].R.values; n = 100 - len(live)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): a = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
r = a.groupby("tag").R.sum().values
print(f"live trades {len(live)} sum {live.sum():+.2f} avg {live.mean():+.3f} | to come {n} | engine list {len(r)} trades sd {r.std(ddof=1):.3f}")
def maxdd(M): eq = M.cumsum(axis=1); return (np.maximum.accumulate(np.maximum(eq, 0), axis=1) - eq).max(axis=1)
res = {}
for name, mu in (("Z0 edge 0.00R", 0.0), ("Zm edge -0.10R", -0.10), ("Zp edge +0.18R", 0.18)):
    rng = np.random.default_rng(61); F = rng.choice(r - r.mean() + mu, size=(RUNS, n)); ALL = np.hstack([np.tile(live, (RUNS, 1)), F])
    avg_ok = ALL.mean(axis=1) >= 0.10; dd_ok = maxdd(ALL) <= 8.0; p1 = (avg_ok & dd_ok).mean(); p2 = (F.mean(axis=1) >= 0).mean(); p3 = (F.mean(axis=1) >= 0.10).mean(); res[name[:2]] = (p1, p2, p3)
    print(f"{name}: AL1 passes {100*p1:.1f}% (average half alone {100*avg_ok.mean():.1f}%, drawdown half alone {100*dd_ok.mean():.1f}%) | AL2 passes {100*p2:.1f}% | AL3 passes {100*p3:.1f}% | new trades' mean of means {F.mean():+.3f}")
k1 = 1 - res["Z0"][0] >= 0.50; k2 = 1 - res["Zm"][0] >= 0.80; k3 = res["Zp"][0] >= 0.90
print(f"KILL LINES (AL1): K1 fails >= 50% at zero edge (fails {100*(1-res['Z0'][0]):.1f}%): {'PASS' if k1 else 'FAIL'} | K2 fails >= 80% at -0.10R (fails {100*(1-res['Zm'][0]):.1f}%): {'PASS' if k2 else 'FAIL'} | K3 passes >= 90% at +0.18R ({100*res['Zp'][0]:.1f}%): {'PASS' if k3 else 'FAIL'}")

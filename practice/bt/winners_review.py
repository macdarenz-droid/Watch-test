"""Review of my funded-day winners (coach 06-24): what do they share at entry? Entry-time facts of bt/wl_table.py (age, run, pos_y, pre, night) + side + weekday.
STUDY = funded days only (from 2015-03-27). The days before are NOT printed here: they are the held-out days for the test.
usage: python bt/winners_review.py END study | python bt/winners_review.py END test LO HI | python bt/winners_review.py END check DATE"""
import sys, io, contextlib, os, runpy
import numpy as np, pandas as pd
END, MODE = sys.argv[1], sys.argv[2]; args = sys.argv[3:]; here = os.path.dirname(os.path.abspath(__file__)); F0 = "2015-03-27"
sys.argv = ["wl_table.py", END]
with contextlib.redirect_stdout(io.StringIO()): F = runpy.run_path(os.path.join(here, "wl_table.py"), run_name="lib")["F"]
if MODE == "check": print(F.loc[args[0]].to_string()); sys.exit()
S = F[F.index >= F0]; W, L = S[S.R > 0], S[S.R <= 0]
if MODE == "study":
    print(f"FUNDED days {F0}..{S.index.max()} (engine A2): {len(S)} | winners {len(W)} ({W.R.sum():+.2f}R) | losers {len(L)} ({L.R.sum():+.2f}R)")
    def row(name, fw, fl): print(f"   {name:<58} winners {fw:>6} | losers {fl:>6}")
    pc = lambda m: f"{m.mean():.0%}"
    row("sells", pc(W.side == "S"), pc(L.side == "S"))
    row("flip day (age 1)", pc(W.age == 1), pc(L.age == 1)); row("age 3 or more", pc(W.age >= 3), pc(L.age >= 3))
    row("run >= 1 (yesterday closed my way)", pc(W.run >= 1), pc(L.run >= 1)); row("run >= 2", pc(W.run >= 2), pc(L.run >= 2))
    row("pre-entry hour moved my way (pre > 0)", pc(W.pre > 0), pc(L.pre > 0)); row("pre-entry hour my way by 10+ pips", pc(W.pre >= 10), pc(L.pre >= 10)); row("pre-entry hour against by 10+ pips", pc(W.pre <= -10), pc(L.pre <= -10))
    row("night my way (night > 0)", pc(W.night > 0), pc(L.night > 0))
    row("pos_y median (1 = yesterday's extreme my way)", f"{W.pos_y.median():.2f}", f"{L.pos_y.median():.2f}")
    for lo, hi in ((-9, 0.25), (0.25, 0.5), (0.5, 0.75), (0.75, 1.0), (1.0, 9)):
        row(f"pos_y in [{lo}, {hi})", f"{int(((W.pos_y >= lo) & (W.pos_y < hi)).sum())}", f"{int(((L.pos_y >= lo) & (L.pos_y < hi)).sum())}")
    row("weekday Mon/Tue/Wed/Thu/Fri", "/".join(str(int((W.wd == d).sum())) for d in ("Mon", "Tue", "Wed", "Thu", "Fri")), "/".join(str(int((L.wd == d).sum())) for d in ("Mon", "Tue", "Wed", "Thu", "Fri")))
    print(f"HELD-OUT days before {F0}: {int((F.index < F0).sum())} (nothing about them printed)")
    sys.exit()
lo, hi = float(args[0]), float(args[1])
def rep(G, name):
    m = (G.pos_y >= lo) & (G.pos_y < hi); a, b = G[m], G[~m]
    d = a.R.mean() - b.R.mean(); se = np.sqrt(a.R.var(ddof=1) / len(a) + b.R.var(ddof=1) / len(b))
    print(f"{name}: IN the zone {len(a)} days avg {a.R.mean():+.3f}R win {(a.R > 0).mean():.0%} net {a.R.sum():+.2f} | OUTSIDE {len(b)} days avg {b.R.mean():+.3f}R win {(b.R > 0).mean():.0%} net {b.R.sum():+.2f} | difference {d:+.3f}R (2 standard errors {2*se:.3f})")
    return d, se, len(a), len(b), (a.R > 0).mean() - (b.R > 0).mean()
print(f"trait: pos_y in [{lo}, {hi})")
d1, s1, n1, m1, w1 = rep(F[F.index >= F0], "FUNDED days (where the trait was found)")
d0, s0, n0, m0, w0 = rep(F[F.index < F0], "HELD-OUT days before " + F0)
K = [d0 >= 0.20, w0 > 0, n0 >= 10 and m0 >= 15, d0 >= 0.5 * d1]
print("KILL LINES (held-out days): " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))

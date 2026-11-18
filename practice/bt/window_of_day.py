"""Idea WM (journal/2015-idea-WM-where-in-the-day.md; kill lines written first): the side advantage of the 3-day signal (signal side's R minus the other
side's, 40 pip stop, 4-hour hold, costs on) for windows starting 04:00, 08:00 (reference = A2), 12:00, 16:00 London, by half of the history.
usage: python bt/window_of_day.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL, NP = 125.0, 40, 20000; Hh = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
def window(H):
    rows = []
    for d in A.index:
        dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + H * Hh) & (m5.time <= dd_ + (H + 4) * Hh)]; r = {}
        if x.empty or x.time.iloc[0] != dd_ + H * Hh or x.time.iloc[-1] < dd_ + (H + 4) * Hh - pd.Timedelta(minutes=5): rows.append(dict(tag=d, mine=np.nan, adv=np.nan)); continue
        for side in (1, -1):
            acct = Account()
            for _, bar in x.iterrows():
                if bar.time == dd_ + H * Hh: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag=d)
                if acct.positions and bar.time >= dd_ + (H + 4) * Hh: acct.close()
                acct.on_bar(bar)
            if acct.positions: acct.close(); acct.on_bar(x.iloc[-1])
            r[side] = acct.trades[-1]["pnl"] / RISK if acct.trades else np.nan
        s = int(A.side[d]); rows.append(dict(tag=d, mine=r[s], adv=r[s] - r[-s]))
    return pd.DataFrame(rows).set_index("tag")
W = {H: window(H) for H in (8, 12, 16, 4)}; n = len(A); half = pd.Series(np.arange(n) >= n // 2, index=A.index)
print(f"mechanics: the 08:00 window's signal side against engine A2: largest difference per day {(W[8].mine - A.R).abs().max():.3f}R | {n} days | halves {A.index[0]}..{A.index[n//2-1]} / {A.index[n//2]}..{A.index[-1]}")
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(d, "side", int(A.side[d]), "| " + " | ".join(f"{H:02d}:00 mine {W[H].mine[d]:+.2f} adv {W[H].adv[d]:+.2f}" for H in (4, 8, 12, 16))); sys.exit()
rng = np.random.default_rng(13); P = {}
for name, H in (("reference 08:00-12:00 (A2)", 8), ("WM1 12:00-16:00", 12), ("WM2 16:00-20:00", 16), ("WM3 04:00-08:00", 4)):
    v = W[H].adv; a1 = v[~half].dropna(); a2 = v[half].dropna(); q = len(a2) // 2; x = a2.values
    k = sum((x * rng.choice([-1.0, 1.0], size=len(x))).mean() >= x.mean() for _ in range(NP)); p = (k + 1) / (NP + 1); P[H] = p
    mine2 = W[H].mine[half].dropna()
    print(f"{name}: FIRST half {len(a1)} days side advantage {a1.mean():+.3f}R | SECOND half {len(a2)} days {a2.mean():+.3f}R (signal side {mine2.mean():+.3f}R a trade; sd {a2.std(ddof=1):.2f}) | its quarters {a2.iloc[:q].mean():+.3f} / {a2.iloc[q:].mean():+.3f} | sign-flip p = {p:.4f}")
    if H != 8:
        K = [a2.mean() >= 0.30, p < 0.05, a2.iloc[:q].mean() > 0 and a2.iloc[q:].mean() > 0, a1.mean() < a2.mean()]
        print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)) + f" -> {'passes all four (survives only if p < 0.0125)' if all(K) else 'KILLED'}")

"""Idea SQ (journal/2015-idea-SQ-squeeze-before-big-days.md). London days 22:00-22:00 (label = (t + 2h) day), weekdays, 200+ M5 bars.
usage: python bt/squeeze.py END countA | check DATE | runB"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1); MID = "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
lab = (m5.time + 2 * H).dt.normalize(); D = m5.assign(lab=lab).groupby("lab").agg(hi=("high", "max"), lo=("low", "min"), n=("open", "size"))
D = D[(D.index.weekday < 5) & (D.n >= 200)].copy(); D["rng"] = (D.hi - D.lo) / PIP
rows = []
for i in range(20, len(D)):
    d = D.index[i]; prev = D.rng.iloc[i - 1]
    rows.append(dict(day=d.strftime("%Y-%m-%d"), ratio=D.rng.iloc[i] / D.rng.iloc[i - 20:i].median(), nr5=prev <= D.rng.iloc[i - 5:i].min(), nr7=prev <= D.rng.iloc[i - 7:i].min(),
                     wr5=prev >= D.rng.iloc[i - 5:i].max(), late=d.strftime("%Y-%m-%d") >= MID, yhi=D.hi.iloc[i - 1], ylo=D.lo.iloc[i - 1], rng=D.rng.iloc[i], prng=prev))
F = pd.DataFrame(rows)
if MODE == "check": print(F[F.day == sys.argv[3]].round(3).to_string(index=False)); sys.exit()
if MODE == "countA":
    X = F[F.nr5]; nb = 0; bl = 0
    for r in X.itertuples():
        d = pd.Timestamp(r.day, tz="UTC"); w = m5[(m5.time >= d + 8 * H) & (m5.time < d + 16 * H)]
        if ((w.close > r.yhi) | (w.close < r.ylo)).any(): nb += 1; bl += r.late
    print(f"days {len(F)} ({F.day.iloc[0]}..{F.day.iloc[-1]}) | NR5 days {len(X)} | with a break 08:00-16:00 (= PART A trades): {nb} | from {MID}: {bl}")
    print("PART A sample line (80+ and 35+ from 04-07):", "PASS" if nb >= 80 and bl >= 35 else "FAIL -> killed for sample, no outcome run"); sys.exit()
rng = np.random.default_rng(53)
for name, col in (("SQ1 after NR5", "nr5"), ("SQ2 after NR7", "nr7"), ("SQ0 after WR5 (control)", "wr5")):
    m = F[col].values; a, b = F.ratio[m], F.ratio[~m]; g = a.mean() - b.mean()
    ga = F.ratio[m & ~F.late].mean() - F.ratio[~m & ~F.late].mean(); gb = F.ratio[m & F.late].mean() - F.ratio[~m & F.late].mean()
    c = 0
    for _ in range(10000):
        p_ = rng.permutation(m); c += (F.ratio[p_].mean() - F.ratio[~p_].mean()) >= g
    p = c / 10000; big_a, big_b = (a >= 1.5).mean(), (b >= 1.5).mean()
    print(f"{name}: n {m.sum()} (before {MID} {(m & ~F.late).sum()}, from {(m & F.late).sum()}) | mean ratio {a.mean():.3f} (+-{2 * a.std(ddof=1) / np.sqrt(len(a)):.2f}) vs others {b.mean():.3f} | gap {g:+.3f} | before {ga:+.3f} / from {gb:+.3f} | one-sided p {p:.4f} | big days (>= 1.5) {big_a:.0%} vs {big_b:.0%}")
    if col == "nr5": K = [a.mean() >= 1.15 and g >= 0.15, ga > 0 and gb > 0, p < 0.10, big_a > big_b]
print("(a size study: ranges in pips, bid; no costs apply) KILL LINES SQ1: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

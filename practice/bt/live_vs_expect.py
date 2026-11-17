"""Idea LX (journal/2015-idea-LX-live-against-expectation.md; lines written first): my funded trades as traded against draws from the pre-funding
backtest (A), the same list at the planning edge +0.18R (B) and at zero edge (Z). usage: python bt/live_vs_expect.py END"""
import sys, io, contextlib, os, re, glob
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; F0 = "2015-03-27"; HERE = os.path.dirname(os.path.abspath(__file__)); N = 20000
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a = t.groupby("tag").R.sum(); pre = a[a.index < F0].values; eng_f = a[a.index >= F0]
rows = {}
for f in sorted(glob.glob(os.path.join(HERE, "..", "journal", "*-funded.md"))):
    for l in open(f):
        m = re.match(r"\| F(\d+) \| \w+ (\d\d-\d\d) [^|]* \| (\w+) \| ([\d.]+) \| [\d.]+ \| [\d.]+ \| ([^|]*) \| ([+-][\d.]+) \|", l)
        if m: rows[int(m[1])] = ("2015-" + m[2], float(m[6]))
L = pd.Series({d: r for d, r in rows.values()}).sort_index(); live = L.values; n = len(live)
st = lambda x: (np.mean(x), np.mean(x > 0), np.mean(x <= -0.95))
print(f"LIVE funded as traded: {n} trades {L.index.min()}..{L.index.max()} | net {live.sum():+.2f}R | avg {live.mean():+.3f}R | wins {int((live > 0).sum())} ({(live > 0).mean():.1%}) | full stops {int((live <= -0.95).sum())} ({(live <= -0.95).mean():.1%}) | sd {live.std(ddof=1):.2f}R")
print(f"TRADE COUNT: weekdays with an engine A2 trade from {F0}: {len(eng_f)} | funded trades in my journal: {n} | missing: {[d for d in eng_f.index if d not in L.index]} | extra: {[d for d in L.index if d not in eng_f.index]}")
print(f"pre-funding backtest list (A): {len(pre)} trades | avg {pre.mean():+.3f}R | wins {(pre > 0).mean():.1%} | full stops {(pre <= -0.95).mean():.1%} | sd {pre.std(ddof=1):.2f}R")
rng = np.random.default_rng(11)
def draws(lst, k): x = rng.choice(lst, size=(N, k)); return x.mean(1), (x > 0).mean(1), (x <= -0.95).mean(1)
lv = st(live)
for name, lst in (("A raw pre-funding backtest", pre), ("B planning edge +0.18R", pre - pre.mean() + 0.18), ("Z zero edge", pre - pre.mean())):
    d = draws(lst, n); out = []
    for i, lab in enumerate(("avg R", "win rate", "full stops")):
        lo, hi = np.percentile(d[i], [2.5, 97.5]); pc = (d[i] <= lv[i]).mean() * 100
        out.append(f"{lab}: 95% range {lo:+.3f} .. {hi:+.3f}, live {lv[i]:+.3f} at percentile {pc:.1f} -> {'INSIDE' if lo <= lv[i] <= hi else 'OUTSIDE'}")
    print(f"{name} (list avg {lst.mean():+.3f}, wins {(lst > 0).mean():.1%}, stops {(lst <= -0.95).mean():.1%}), {N} draws of {n}:\n   " + "\n   ".join(out))
B = pre - pre.mean() + 0.18; print("WORRY THRESHOLDS from list B (planning edge), by number of lived trades:")
for k in (84, 100, 150, 200, 300):
    d = draws(B, k); print(f"   {k} trades: W1 average below {np.percentile(d[0], 2.5):+.3f}R | W2 win rate below {np.percentile(d[1], 2.5):.1%} | W3 full stops above {np.percentile(d[2], 97.5):.1%} | (a zero-edge rule's average would be above {np.percentile(draws(pre - pre.mean(), k)[0], 97.5):+.3f}R only 2.5% of the time)")

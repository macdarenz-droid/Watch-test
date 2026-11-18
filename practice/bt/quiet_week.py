"""Idea QW (journal/2015-idea-QW-after-a-quiet-week.md): week range vs the next week's range. London time, history only, no trades.
usage: python bt/quiet_week.py END count | test"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
END, MODE = sys.argv[1], sys.argv[2]; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5 and len(m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]) >= 200]
def weeks(start_wd):
    out = []; i = 0
    while i < len(days):
        if days[i].weekday() != start_wd: i += 1; continue
        blk = days[i:i + 5]
        if len(blk) == 5 and (blk[-1] - blk[0]).days == (4 if start_wd == 0 else 6):
            x = m5[(m5.time >= blk[0] - 2 * H) & (m5.time < blk[-1] + 22 * H)]; out.append(dict(start=blk[0], rng=(x.high.max() - x.low.min()) / PIP)); i += 5
        else: i += 1
    return pd.DataFrame(out)
def pairs(W, gap): return [(W.rng[i], W.rng[i + 1], W.start[i]) for i in range(len(W) - 1) if (W.start[i + 1] - W.start[i]).days == 7]
def rho(a, b): return np.corrcoef(pd.Series(a).rank(), pd.Series(b).rank())[0, 1]
W = weeks(0); P = pairs(W, 7); W2 = weeks(2); P2 = pairs(W2, 7)
W["med4"] = W.rng.shift(1).rolling(4).median(); W["quiet"] = W.rng < W.med4; W["next_ratio"] = W.rng.shift(-1) / W.med4; Q = W.dropna(subset=["med4", "next_ratio"])
if MODE == "count":
    print(f"full Mon-Fri weeks {len(W)} ({W.start.iloc[0].strftime('%m-%d')}..{W.start.iloc[-1].strftime('%m-%d')}) | consecutive pairs {len(P)} | Wed-Tue weeks {len(W2)}, pairs {len(P2)} | weeks with a 4-week median and a next week: {len(Q)}, quiet {int(Q.quiet.sum())}, other {int((~Q.quiet).sum())}")
    print("first full week:", W.start.iloc[0].strftime("%a %Y-%m-%d"), "range", round(W.rng.iloc[0], 1), "pips"); sys.exit()
rng = np.random.default_rng(4)
for name, PP in (("QW1 Mon-Fri weeks", P), ("QW3 Wed-Tue weeks", P2)):
    a = np.array([p[0] for p in PP]); b = np.array([p[1] for p in PP]); r = rho(a, b); sh = np.array([rho(a, rng.permutation(b)) for _ in range(10000)])
    print(f"{name}: pairs {len(PP)} | rank correlation {r:+.3f} | one-sided p (persistence) {(sh >= r).mean():.4f} | one-sided p (expansion) {(sh <= r).mean():.4f} | median week range {np.median(a):.0f} pips")
q, o = Q[Q.quiet], Q[~Q.quiet]
print(f"QW2: after QUIET weeks ({len(q)}): next week / 4-week median = {q.next_ratio.mean():.2f} (median {q.next_ratio.median():.2f}); next week again under the median on {int((q.next_ratio < 1).sum())} | after OTHER weeks ({len(o)}): {o.next_ratio.mean():.2f} (median {o.next_ratio.median():.2f}); under the median on {int((o.next_ratio < 1).sum())}")
print("week ranges in order:", " ".join(f"{x:.0f}" for x in W.rng))

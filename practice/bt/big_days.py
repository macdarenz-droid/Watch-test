"""Study: the 20 largest London-day ranges (22:00 -> 22:00) in a window; the hours before each day's biggest hour. History only.
usage: python bt/big_days.py START END list | grid OUT1.png OUT2.png | facts
purple line = start of the day's biggest H1 bar (by range); dotted = previous London day's high/low; x = London hours from previous 12:00 to 22:00."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, PIP
START, END, MODE = sys.argv[1], sys.argv[2], sys.argv[3]; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
rows = []
for d in sorted(set(m5.time.dt.normalize())):
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) < 200 or d.weekday() > 4: continue
    h1 = x.set_index("time").resample("1h").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna(); hr = (h1.high - h1.low) / PIP; b = hr.idxmax()
    pre = x[x.time < b]; pre4 = x[(x.time >= b - 4 * H) & (x.time < b)]; pre1 = x[(x.time >= b - H) & (x.time < b)]
    rows.append(dict(day=d, rng=(x.high.max() - x.low.min()) / PIP, big_h=b.hour, big_rng=hr.max(), big_dir=np.sign(h1.close[b] - h1.open[b]),
                     pre4=(pre4.high.max() - pre4.low.min()) / PIP if len(pre4) else np.nan, pre1=(pre1.high.max() - pre1.low.min()) / PIP if len(pre1) else np.nan,
                     pre4net=(pre4.close.iloc[-1] - pre4.open.iloc[0]) / PIP if len(pre4) else np.nan, day_before=len(pre) and (pre.high.max() - pre.low.min()) / PIP))
F = pd.DataFrame(rows); F["prev_rng"] = F.rng.shift(1); F["med10"] = F.rng.shift(1).rolling(10).median()
W = F[F.day >= pd.Timestamp(START, tz="UTC")]; TOP = W.nlargest(20, "rng").sort_values("day")
if MODE == "list":
    print(f"{len(W)} London days {START}..{END}; median range {W.rng.median():.0f}; 20th largest {TOP.rng.min():.0f}")
    print(TOP.assign(day=TOP.day.dt.strftime("%a %m-%d")).round(1).to_string(index=False))
if MODE == "facts":
    N = W.drop(TOP.index)
    for nm, f in (("biggest hour starts 13:00-15:00", lambda X: X.big_h.between(13, 15)), ("biggest hour 08:00-10:00", lambda X: X.big_h.between(8, 10)),
                  ("4h before the biggest hour: range <= 35 pips", lambda X: X.pre4 <= 35), ("4h before: range <= 50", lambda X: X.pre4 <= 50),
                  ("biggest hour goes WITH the 4h before (net)", lambda X: np.sign(X.pre4net) == X.big_dir), ("previous day's range > its 10-day median", lambda X: X.prev_rng > X.med10),
                  ("hour before the biggest hour >= 25 pips", lambda X: X.pre1 >= 25)):
        print(f"{nm}: top20 {int(f(TOP).sum())}/20 = {f(TOP).mean():.0%} | other days {int(f(N).sum())}/{len(N)} = {f(N).mean():.0%}")
if MODE == "grid":
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    for out, part in ((sys.argv[4], TOP.iloc[:10]), (sys.argv[5], TOP.iloc[10:])):
        fig, axes = plt.subplots(3, 4, figsize=(20, 12.6)); axes = axes.ravel()
        for ax, (_, r) in zip(axes, part.iterrows()):
            d = r.day; prev = m5[m5.time < d - 2 * H].time.dt.normalize().iloc[-1]
            g = m5[(m5.time >= d - 12 * H) & (m5.time < d + 22 * H)].set_index("time").resample("30min").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna().reset_index()
            for i, b in g.iterrows():
                c = "#26a69a" if b.close >= b.open else "#ef5350"; ax.plot([i, i], [b.low, b.high], color=c, lw=0.8); ax.plot([i, i], [b.open, b.close], color=c, lw=2.6)
            y = m5[(m5.time >= prev - 2 * H) & (m5.time < prev + 22 * H)]; ax.axhline(y.high.max(), color="gray", ls=":", lw=0.9); ax.axhline(y.low.min(), color="gray", ls=":", lw=0.9)
            j = g.index[(g.time.dt.hour == r.big_h) & (g.time.dt.minute == 0) & (g.time >= d - 2 * H)]
            if len(j): ax.axvline(j[0], color="purple", lw=1.2)
            tk = [i for i, tt in enumerate(g.time) if tt.minute == 0 and tt.hour % 4 == 0]; ax.set_xticks(tk); ax.set_xticklabels([g.time[i].strftime("%H") for i in tk], fontsize=8); ax.grid(alpha=0.25)
            ax.set_title(f"{d.strftime('%a %m-%d')} range {r.rng:.0f}, biggest hour {int(r.big_h)}:00 ({r.big_rng:.0f} pips)", fontsize=11)
        fig.tight_layout(); fig.savefig(out, dpi=50); print(out)

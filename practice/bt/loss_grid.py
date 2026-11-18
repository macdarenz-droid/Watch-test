"""Small-panel M15 charts of chosen A2 days (previous day 16:00 London -> trade day 13:00), for by-eye review. History only.
usage: python bt/loss_grid.py OUT.png DATE [DATE ...]  blue = 08:00 entry, red dashed = stop, orange = 07:00, black = 12:00, dotted = previous day high/low."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from backtest import history
out, dates = sys.argv[1], sys.argv[2:]; H = pd.Timedelta(hours=1)
m5 = ideas.days(history("M5"))
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
n = len(dates); rows = (n + 3) // 4; fig, axes = plt.subplots(rows, 4, figsize=(20, 4.2 * rows)); axes = axes.ravel()
for ax, ds in zip(axes, dates):
    d = pd.Timestamp(ds, tz="UTC"); r = t[t.tag == ds].iloc[0]; prev = m5[m5.time < d].time.dt.normalize().iloc[-1]
    x = m5[(m5.time >= prev + 16 * H) & (m5.time < d + 13 * H)].set_index("time")
    g = x.resample("15min").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna().reset_index()
    for i, b in g.iterrows():
        c = "#26a69a" if b.close >= b.open else "#ef5350"; ax.plot([i, i], [b.low, b.high], color=c, lw=0.8); ax.plot([i, i], [b.open, b.close], color=c, lw=2.6)
    y = m5[(m5.time >= prev - 2 * H) & (m5.time < prev + 22 * H)]; ax.axhline(y.high.max(), color="gray", ls=":", lw=0.9); ax.axhline(y.low.min(), color="gray", ls=":", lw=0.9)
    for hh, col in ((7, "orange"), (12, "black")):
        j = g.index[g.time == d + hh * H]
        if len(j): ax.axvline(j[0], color=col, lw=1.0)
    ie = g.index[g.time == d + 8 * H][0]; ax.plot(ie, r.entry, marker="^" if r.side > 0 else "v", color="blue", ms=10); ax.axhline(r.sl, color="red", lw=0.8, ls="--")
    lo, hi = min(g.low.min(), r.sl), max(g.high.max(), r.sl); ax.set_ylim(lo - 0.0005, hi + 0.0005)
    tk = [i for i, tt in enumerate(g.time) if tt.minute == 0 and tt.hour % 4 == 0]; ax.set_xticks(tk); ax.set_xticklabels([g.time[i].strftime("%H") for i in tk], fontsize=8); ax.grid(alpha=0.25)
    ax.set_title(f"{d.strftime('%a %m-%d')} {'BUY' if r.side > 0 else 'SELL'} {r.R:+.2f}R", fontsize=11)
fig.tight_layout(); fig.savefig(out, dpi=50); print(out)

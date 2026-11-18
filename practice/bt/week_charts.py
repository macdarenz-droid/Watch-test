"""M15 charts of the A2 trades on chosen days (previous day 12:00 London -> trade day 20:00 London), London time, from history only.
usage: python bt/week_charts.py OUT.png DATE [DATE ...]   Lines: orange = 07:00 call, blue marker = 08:00 entry, black = 12:00 exit, red dashed = stop, dotted = previous day's high/low."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from backtest import history
out, dates = sys.argv[1], sys.argv[2:]
m5 = ideas.days(history("M5"))
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
fig, axes = plt.subplots(len(dates), 1, figsize=(17, 6.2 * len(dates))); axes = [axes] if len(dates) == 1 else axes
for ax, ds in zip(axes, dates):
    d = pd.Timestamp(ds, tz="UTC"); r = t[t.tag == ds].iloc[0]
    prev = m5[m5.time < d].time.dt.normalize().iloc[-1]
    x = m5[(m5.time >= prev + pd.Timedelta(hours=12)) & (m5.time < d + pd.Timedelta(hours=20))].set_index("time")
    g = x.resample("15min").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna().reset_index()
    for i, b in g.iterrows():
        c = "#26a69a" if b.close >= b.open else "#ef5350"
        ax.plot([i, i], [b.low, b.high], color=c, lw=0.8); ax.plot([i, i], [b.open, b.close], color=c, lw=3.2)
    y = m5[(m5.time >= prev) & (m5.time < d)]; ax.axhline(y.high.max(), color="gray", ls=":", lw=0.9); ax.axhline(y.low.min(), color="gray", ls=":", lw=0.9)
    for hh, col in ((7, "orange"), (12, "black")):
        j = g.index[g.time == d + pd.Timedelta(hours=hh)]
        if len(j): ax.axvline(j[0], color=col, lw=1.0)
    ie = g.index[g.time == d + pd.Timedelta(hours=8)][0]; ax.plot(ie, r.entry, marker="^" if r.side > 0 else "v", color="blue", ms=12); ax.axhline(r.sl, color="red", lw=0.8, ls="--")
    tk = [i for i, tt in enumerate(g.time) if tt.minute == 0 and tt.hour % 2 == 0]; ax.set_xticks(tk); ax.set_xticklabels([g.time[i].strftime("%H") for i in tk], fontsize=8); ax.grid(alpha=0.25)
    ax.set_title(f"{d.strftime('%a %m-%d')} {'BUY' if r.side > 0 else 'SELL'} {r.R:+.2f}R  (London hours; orange 07:00, blue entry 08:00, black 12:00, red = stop, dotted = previous day high/low)", fontsize=11)
fig.tight_layout(); fig.savefig(out, dpi=60); print(out)

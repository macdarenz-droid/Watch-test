"""Draw M15 charts of chosen live trades (prev day 00:00 -> trade day 16:00) from history only."""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import pandas as pd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from backtest import history
from review import load
def draw(ids, out, m15):
    t = load(); t = t[t.n.isin(ids)]
    fig, axes = plt.subplots(2, 4, figsize=(22, 9)); axes = axes.ravel()
    for ax, r in zip(axes, t.itertuples()):
        d = r.entry_time.normalize(); days = sorted(set(m15.time[m15.time < d].dt.normalize()))
        y0 = days[-1] if m15[(m15.time >= days[-1]) & (m15.time < d)].shape[0] > 30 else days[-2]
        g = m15[(m15.time >= y0) & (m15.time < d + pd.Timedelta(hours=16))].reset_index(drop=True)
        for i, b in g.iterrows():
            c = "#26a69a" if b.close >= b.open else "#ef5350"
            ax.plot([i, i], [b.low, b.high], color=c, lw=0.7); ax.plot([i, i], [b.open, b.close], color=c, lw=2.6)
        y = g[g.time < d]; ax.axhline(y.high.max(), color="gray", ls=":", lw=0.8); ax.axhline(y.low.min(), color="gray", ls=":", lw=0.8)
        for hh, col in ((0, "silver"), (7, "orange"), (12, "black")):
            j = g.index[g.time == d + pd.Timedelta(hours=hh)]; 
            if len(j): ax.axvline(j[0], color=col, lw=0.8)
        ie = g.index[g.time == r.entry_time][0]; ax.plot(ie, r.entry, marker="^" if r.side > 0 else "v", color="blue", ms=11)
        ax.axhline(r.sl, color="red", lw=0.6, ls="--")
        ax.set_title(f"#{r.n} {d.strftime('%a %m-%d')} {'BUY' if r.side>0 else 'SELL'} {r.R:+.2f}R", fontsize=11); ax.set_xticks([])
    for ax in axes[len(t):]: ax.axis("off")
    fig.suptitle("dotted = yesterday high/low | orange = 07:00, black = 12:00 UTC | blue = my entry | red dashed = stop", fontsize=10)
    fig.tight_layout(); fig.savefig(out, dpi=70); print(out)
if __name__ == "__main__":
    m15 = history("M15")
    draw([6, 8, 11, 14, 15, 17, 19], "../charts/losers1.png", m15); draw([24, 25, 27, 28, 29, 34], "../charts/losers2.png", m15)
    draw([1, 2, 5, 13, 18, 21, 26, 30], "../charts/winners.png", m15)

"""M15 charts of every mechanical A2 trade (Jan-Feb only), drawn ONLY UP TO THE ENTRY (previous day 07:00 -> 08:00 entry), so I look at what was visible at the decision.
Lines: grey = 00:00, orange = 07:00; dotted = Asia (00-07) high/low; blue arrow = entry and side. Title: date, side, result (known - this is a review)."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from backtest import history
END = pd.Timestamp("2015-03-01", tz="UTC")
m5 = ideas.days(history("M5")); m5 = m5[m5.time < END]
with contextlib.redirect_stdout(io.StringIO()): T = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
m15 = history("M15"); m15 = m15[m15.time < END]
def draw(tr, out, cols, title):
    rows = -(-len(tr) // cols); fig, axes = plt.subplots(rows, cols, figsize=(4.4 * cols, 3.1 * rows)); axes = axes.ravel()
    for ax, r in zip(axes, tr.itertuples()):
        d = r.entry_time.normalize(); prevdays = sorted(set(m15.time[m15.time < d].dt.normalize()))
        y0 = prevdays[-1] if (m15[(m15.time >= prevdays[-1]) & (m15.time < d)].shape[0] > 30) else prevdays[-2]
        g = m15[(m15.time >= y0 + pd.Timedelta(hours=7)) & (m15.time < r.entry_time)].reset_index(drop=True)
        for i, b in g.iterrows():
            c = "#26a69a" if b.close >= b.open else "#ef5350"
            ax.plot([i, i], [b.low, b.high], color=c, lw=0.7); ax.plot([i, i], [b.open, b.close], color=c, lw=2.4)
        asia = g[(g.time >= d) & (g.time < d + pd.Timedelta(hours=7))]
        if len(asia): ax.axhline(asia.high.max(), color="gray", ls=":", lw=0.8); ax.axhline(asia.low.min(), color="gray", ls=":", lw=0.8)
        for hh, col in ((0, "silver"), (7, "orange")):
            j = g.index[g.time == d + pd.Timedelta(hours=hh)]
            if len(j): ax.axvline(j[0], color=col, lw=0.8)
        ax.plot(len(g) - 1, r.entry, marker="^" if r.side > 0 else "v", color="blue", ms=10)
        ax.set_title(f"{d.strftime('%a %m-%d')} {'BUY' if r.side>0 else 'SELL'} {r.R:+.2f}R", fontsize=10); ax.set_xticks([]); ax.tick_params(labelsize=7)
    for ax in axes[len(tr):]: ax.axis("off")
    fig.suptitle(title, fontsize=10); fig.tight_layout(); fig.savefig(out, dpi=60); plt.close(fig); print(out, len(tr))
S = T.sort_values("R"); worst, best = S.head(5), S.tail(5).iloc[::-1]
draw(pd.concat([best, worst]), "../charts/entry_best_worst.png", 5, "TOP ROW: best 5 A2 trades | BOTTOM ROW: worst 5 - chart ends at the 08:00 entry")
rest = T[~T.index.isin(best.index) & ~T.index.isin(worst.index)]
draw(rest.iloc[:15], "../charts/entry_rest1.png", 5, "other A2 trades (1) - chart ends at the 08:00 entry"); draw(rest.iloc[15:], "../charts/entry_rest2.png", 5, "other A2 trades (2)")
print("best:", " ".join(f"{str(r.entry_time)[5:10]}{r.R:+.2f}" for r in best.itertuples()), "| worst:", " ".join(f"{str(r.entry_time)[5:10]}{r.R:+.2f}" for r in worst.itertuples()))

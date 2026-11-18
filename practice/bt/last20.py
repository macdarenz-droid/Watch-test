"""Chart review: the last N mechanical A2 trades (= my live trades), M15, London time, previous afternoon -> 17:00 on the trade day; entry, stop and noon marked. Explicit end date."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from backtest import history
END = pd.Timestamp(sys.argv[1], tz="UTC"); N = int(sys.argv[2]) if len(sys.argv) > 2 else 20
m5 = ideas.days(history("M5")); m5 = m5[m5.time < END]
with contextlib.redirect_stdout(io.StringIO()): T = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
T = T.tail(N).reset_index(drop=True); M = m5.set_index("time")
m15 = history("M15"); m15["time"] = m15["time"].dt.tz_convert("Europe/London").dt.tz_localize(None).dt.tz_localize("UTC"); m15 = m15[m15.time < END]
rows = []
for part in range(0, N, 10):
    fig, axes = plt.subplots(2, 5, figsize=(24, 8))
    for ax, r in zip(axes.ravel(), T.iloc[part:part+10].itertuples()):
        d = r.entry_time.normalize(); x = m15[(m15.time >= d - pd.Timedelta(hours=10)) & (m15.time < d + pd.Timedelta(hours=17))].reset_index(drop=True)
        for i, b in x.iterrows():
            c = "#26a69a" if b.close >= b.open else "#ef5350"; ax.plot([i, i], [b.low, b.high], color=c, lw=0.7); ax.plot([i, i], [b.open, b.close], color=c, lw=2.2)
        for hh, col in ((0, "silver"), (8, "blue"), (12, "black")):
            j = x.index[x.time == d + pd.Timedelta(hours=hh)]
            if len(j): ax.axvline(j[0], color=col, lw=0.8)
        j = x.index[x.time == r.entry_time]; ax.plot(j[0], r.entry, marker="^" if r.side > 0 else "v", color="blue", ms=10); ax.axhline(r.sl, color="red", ls="--", lw=0.6)
        ax.set_title(f"{d.strftime('%a %m-%d')} {'BUY' if r.side>0 else 'SELL'} {r.R:+.2f}R", fontsize=10); ax.set_xticks([]); ax.tick_params(labelsize=7)
    fig.suptitle("London time. grey 00:00, blue 08:00 entry, black 12:00 exit, red dashed = stop. Chart runs to 17:00", fontsize=10); fig.tight_layout()
    fig.savefig(os.path.join(os.path.dirname(__file__), "..", "charts", f"last20_{part//10+1}.png"), dpi=60); plt.close(fig)
for r in T.itertuples():
    d = r.entry_time.normalize(); h = M[(M.index >= r.entry_time) & (M.index < d + pd.Timedelta(hours=12))]; pm = M[(M.index >= d + pd.Timedelta(hours=12)) & (M.index < d + pd.Timedelta(hours=17))]
    pre = M[(M.index >= d + pd.Timedelta(hours=7)) & (M.index < d + pd.Timedelta(hours=8))]; s = r.side
    mfe = ((h.high.max() - r.entry) if s > 0 else (r.entry - h.low.min())) * 1e4; mae = ((r.entry - h.low.min()) if s > 0 else (h.high.max() - r.entry)) * 1e4
    tm = (h.high.idxmax() if s > 0 else h.low.idxmin()).strftime("%H:%M")
    rows.append(f"{d.strftime('%m-%d %a')} {'B' if s>0 else 'S'} R{r.R:+.2f} pre{(pre.close.iloc[-1]-pre.open.iloc[0])*1e4*s:+.0f} mfe{mfe:.0f}@{tm} mae{mae:.0f} noon{(h.close.iloc[-1]-r.entry)*1e4*s:+.0f} pm{(pm.close.iloc[-1]-pm.open.iloc[0])*1e4*s:+.0f} {r.reason}")
print("\n".join(rows)); print(f"last {N}: wins {int((T.R>0).sum())}, net {T.R.sum():+.2f}R, avg {T.R.mean():+.2f}R, full stops {int((T.reason=='sl').sum())}")

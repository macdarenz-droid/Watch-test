"""Best 5 and worst 5 mechanical A2 trades of my whole lived history (London clock): chart (previous afternoon -> London noon, entry marked) and what was measurable at the entry."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np, matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
from backtest import history
m5 = ideas.days(history("M5"))
with contextlib.redirect_stdout(io.StringIO()): T = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
M = m5.set_index("time"); g = m5.groupby("day"); HI, LO = g.high.max(), g.low.min(); days = list(HI.index); rows = []
for r in T.itertuples():
    d = r.entry_time.normalize(); i = days.index(d.date()); y = days[i-1]
    asia = M[(M.index >= d) & (M.index < d + pd.Timedelta(hours=7))]; h7 = M[(M.index >= d + pd.Timedelta(hours=7)) & (M.index < d + pd.Timedelta(hours=8))]
    hold = M[(M.index >= r.entry_time) & (M.index < r.exit_time)]; first = M[(M.index >= d + pd.Timedelta(hours=8)) & (M.index < d + pd.Timedelta(hours=9))]
    s = r.side; e = h7.close.iloc[-1]
    rows.append(dict(day=d.strftime("%m-%d %a"), side="B" if s > 0 else "S", R=round(r.R, 2),
        pre_move=round((h7.close.iloc[-1] - h7.open.iloc[0]) * 1e4 * s), pre_rng=round((h7.high.max() - h7.low.min()) * 1e4),
        asia_move=round((asia.close.iloc[-1] - asia.open.iloc[0]) * 1e4 * s), asia_rng=round((asia.high.max() - asia.low.min()) * 1e4),
        night_total=round((e - asia.open.iloc[0]) * 1e4 * s), pos_y=round(((e - LO[y]) / (HI[y] - LO[y])) if s > 0 else 1 - (e - LO[y]) / (HI[y] - LO[y]), 2),
        first_hr=round((first.close.iloc[-1] - first.open.iloc[0]) * 1e4 * s), mfe=round(((hold.high.max() - r.entry) if s > 0 else (r.entry - hold.low.min())) * 1e4),
        mae=round(((r.entry - hold.low.min()) if s > 0 else (hold.high.max() - r.entry)) * 1e4), t=r.entry_time, entry=r.entry, sidev=s))
F = pd.DataFrame(rows); F.drop(columns=["t", "entry", "sidev"]).to_csv(os.path.join(os.path.dirname(__file__), "best_worst_features.csv"), index=False)
S = F.sort_values("R"); worst, best = S.head(5), S.tail(5).iloc[::-1]
pd.set_option("display.width", 220)
print("BEST 5\n", best.drop(columns=["t", "entry", "sidev"]).to_string(index=False)); print("WORST 5\n", worst.drop(columns=["t", "entry", "sidev"]).to_string(index=False))
print(f"\nall {len(F)} trades: full stops {int((F.R <= -0.95).sum())}:", " ".join(F[F.R <= -0.95].day))
m15 = history("M15"); m15["time"] = m15["time"].dt.tz_convert("Europe/London").dt.tz_localize(None).dt.tz_localize("UTC")
fig, axes = plt.subplots(2, 5, figsize=(24, 8))
for ax, r in zip(axes.ravel(), pd.concat([best, worst]).itertuples()):
    d = r.t.normalize(); x = m15[(m15.time >= d - pd.Timedelta(hours=12)) & (m15.time < d + pd.Timedelta(hours=12))].reset_index(drop=True)
    for i, b in x.iterrows():
        c = "#26a69a" if b.close >= b.open else "#ef5350"; ax.plot([i, i], [b.low, b.high], color=c, lw=0.7); ax.plot([i, i], [b.open, b.close], color=c, lw=2.4)
    for hh, col in ((0, "silver"), (7, "orange"), (8, "blue")):
        j = x.index[x.time == d + pd.Timedelta(hours=hh)]
        if len(j): ax.axvline(j[0], color=col, lw=0.8)
    j = x.index[x.time == r.t]; ax.plot(j[0], r.entry, marker="^" if r.sidev > 0 else "v", color="blue", ms=10)
    ax.set_title(f"{r.day} {'BUY' if r.sidev>0 else 'SELL'} {r.R:+.2f}R", fontsize=10); ax.set_xticks([]); ax.tick_params(labelsize=7)
fig.suptitle("TOP: best 5 | BOTTOM: worst 5. London time. grey 00:00, orange 07:00, blue 08:00 entry; chart runs to London noon", fontsize=10); fig.tight_layout()
fig.savefig(os.path.join(os.path.dirname(__file__), "..", "charts", "best_worst.png"), dpi=62)

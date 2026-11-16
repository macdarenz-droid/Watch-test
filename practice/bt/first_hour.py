"""Study only (no rule tested): how A2 trades look in their FIRST HOUR (08:00-09:00 London), winners vs losers by the final result.
usage: python bt/first_hour.py END   (explicit end date = the clock)"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
if "--cols" in sys.argv: print(t.columns.tolist()); print(t.tail(3).to_string()); sys.exit()
rows = []
for _, r in t.iterrows():
    d = m5[m5.day.astype(str) == str(r.tag)]
    h = d[(d.time.dt.hour == 8)]
    if h.empty: continue
    s = 1 if r.side in (1, "buy", "long") else -1
    e = h.iloc[0].open
    fav = (h.high.max() - e) / 1e-4 if s == 1 else (e - h.low.min()) / 1e-4          # best pips in my favour in hour 1 (bid candles, costs ignored)
    adv = (e - h.low.min()) / 1e-4 if s == 1 else (h.high.max() - e) / 1e-4          # worst pips against
    c9 = s * (h.iloc[-1].close - e) / 1e-4                                            # pips at 09:00
    rng = (h.high.max() - h.low.min()) / 1e-4
    loc = (c9 + adv) / rng if rng else np.nan                                          # where 09:00 sits in the hour's range, 1 = at my best, 0 = at my worst
    f15 = s * (h.iloc[2].close - e) / 1e-4 if len(h) >= 3 else np.nan                 # first 15 minutes
    ipk = (h.high.values.argmax() if s == 1 else h.low.values.argmin()) * 5           # minute of my best price in hour 1
    iwk = (h.low.values.argmin() if s == 1 else h.high.values.argmax()) * 5           # minute of my worst price
    rows.append(dict(day=r.tag, R=r.R, fav=fav, adv=adv, c9=c9, rng=rng, loc=loc, f15=f15, peak_min=ipk, worst_min=iwk, stopped1h=adv >= 40))
f = pd.DataFrame(rows); f.to_csv(os.path.join(os.path.dirname(os.path.abspath(__file__)), "first_hour_features.csv"), index=False)
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now")
f["per"] = f.day.map(per); f["grp"] = np.where(f.R <= -0.9, "full stop", np.where(f.R <= 0, "small loss", np.where(f.R < 1, "small win", "big win >=1R")))
pd.set_option("display.width", 250)
cols = ["fav", "adv", "c9", "rng", "loc", "f15", "peak_min", "worst_min"]
print(f"A2 trades to {END}: {len(f)} | stopped inside the first hour: {int(f.stopped1h.sum())}")
print("MEDIANS by final result:"); g = f.groupby("grp")[cols].median().round(1); g.insert(0, "n", f.groupby("grp").size()); g.insert(1, "netR", f.groupby("grp").R.sum().round(2)); print(g.reindex(["full stop", "small loss", "small win", "big win >=1R"]).to_string())
w = f[f.R > 0]; l = f[f.R <= 0]
print(f"winners n={len(w)} vs losers n={len(l)} (medians): " + " | ".join(f"{c} {w[c].median():.1f} vs {l[c].median():.1f}" for c in cols))
print("share of trades with: in profit at 09:00  W %.0f%% L %.0f%% | best price in last 20 min of the hour  W %.0f%% L %.0f%% | worst price in first 15 min  W %.0f%% L %.0f%% | first 15 min in my favour  W %.0f%% L %.0f%%" % (
    100*(w.c9 > 0).mean(), 100*(l.c9 > 0).mean(), 100*(w.peak_min >= 40).mean(), 100*(l.peak_min >= 40).mean(), 100*(w.worst_min < 15).mean(), 100*(l.worst_min < 15).mean(), 100*(w.f15 > 0).mean(), 100*(l.f15 > 0).mean()))

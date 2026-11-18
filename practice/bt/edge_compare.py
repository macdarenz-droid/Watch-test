"""Am I living the same edge? Mechanical A2 trades (costs on) by period, with MAE/MFE in pips from M5 during the hold. History before the clock only."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
m5 = ideas.days(history("M5"))
with contextlib.redirect_stdout(io.StringIO()): T = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
M = m5.set_index("time"); rows = []
for r in T.itertuples():
    h = M[(M.index >= r.entry_time) & (M.index < r.exit_time)]
    if h.empty: h = M[(M.index >= r.entry_time)].iloc[:1]
    mfe = ((h.high.max() - r.entry) if r.side > 0 else (r.entry - h.low.min())) * 1e4; mae = ((r.entry - h.low.min()) if r.side > 0 else (h.high.max() - r.entry)) * 1e4
    d = r.entry_time.normalize(); am = M[(M.index >= d + pd.Timedelta(hours=8)) & (M.index < d + pd.Timedelta(hours=12))]
    rows.append(dict(t=r.entry_time, side=r.side, R=r.R, mfe=mfe, mae=mae, stop=r.reason == "sl", amr=(am.high.max() - am.low.min()) * 1e4, pips=r.R * 40))
D = pd.DataFrame(rows)
def per(x): return "Jan (in-sample)" if x < pd.Timestamp("2015-02-01", tz="UTC") else ("Feb (contaminated)" if x < pd.Timestamp("2015-03-01", tz="UTC") else "Mar forward (lived)")
D["p"] = D.t.map(per)
def stats(g):
    w, l = g[g.R > 0], g[g.R <= 0]
    return pd.Series(dict(n=len(g), win=round(100 * (g.R > 0).mean()), avgR=round(g.R.mean(), 2), avg_win=round(w.R.mean(), 2), avg_loss=round(l.R.mean(), 2), medianR=round(g.R.median(), 2),
        MFE=round(g.mfe.mean()), MAE=round(g.mae.mean()), MFE_win=round(w.mfe.mean()), MAE_win=round(w.mae.mean()), MFE_loss=round(l.mfe.mean()), MAE_loss=round(l.mae.mean()),
        stops=int(g.stop.sum()), buys=int((g.side > 0).sum()), am_range=round(g.amr.mean()), kept=round(100 * g.pips.sum() / g.mfe.sum()), big=int((g.R >= 1).sum()), scratch=int((g.R.abs() < 0.25).sum())))
S = D.groupby("p", sort=False).apply(stats); JF = stats(D[D.p != "Mar forward (lived)"]); JF.name = "Jan+Feb together"
pd.set_option("display.width", 250); print(pd.concat([S, JF.to_frame().T]).T.to_string())
mar = D[D.p == "Mar forward (lived)"]; jf = D[D.p != "Mar forward (lived)"].R.values; rng = np.random.default_rng(2)
sims = rng.choice(jf, size=(20000, len(mar))).mean(1); print(f"\nMarch avg R {mar.R.mean():+.2f} on {len(mar)} trades sits at the {100*(sims < mar.R.mean()).mean():.0f}th percentile of {len(mar)}-trade samples drawn from Jan+Feb; vs Feb-only: {100*(rng.choice(D[D.p=='Feb (contaminated)'].R.values, size=(20000, len(mar))).mean(1) < mar.R.mean()).mean():.0f}th")
print("March trades:", " ".join(f"{str(r.t)[5:10]}{'B' if r.side>0 else 'S'}{r.R:+.2f}(mfe{r.mfe:.0f}/mae{r.mae:.0f})" for r in mar.itertuples()))

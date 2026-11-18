"""MFE / MAE log of every A2 trade (engine, costs on): the best and the worst open result in pips between entry and exit, and when the best came.
MFE and MAE are measured on M5 bid candles against the fill, on the side I could actually close at (sells: ask = bid + 1.0 pip spread).
Writes journal/mfe-mae-log.csv. usage: python bt/mfe_mae.py END"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4; SP = 1.0 * PIP
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
rows = []
for r in t.itertuples():
    x = m5[(m5.time >= r.entry_time) & (m5.time < r.exit_time)] if r.reason != "sl" else m5[(m5.time >= r.entry_time) & (m5.time <= r.exit_time)]
    if r.side > 0: fav = (x.high - r.entry) / PIP; adv = (x.low - r.entry) / PIP
    else: fav = (r.entry - (x.low + SP)) / PIP; adv = (r.entry - (x.high + SP)) / PIP
    stop_pips = abs(r.entry - r.sl) / PIP; res = (r.exit - r.entry) * r.side / PIP
    rows.append(dict(date=r.tag, side="buy" if r.side > 0 else "sell", R=round(r.R, 2), result_pips=round(res, 1), exit=r.reason, exit_time=r.exit_time.strftime("%H:%M"),
                     mfe=round(max(fav.max(), 0), 1), mfe_time=x.time[fav.idxmax()].strftime("%H:%M"), mae=round(min(adv.min(), 0), 1), mae_time=x.time[adv.idxmin()].strftime("%H:%M"),
                     mae_before_mfe=round(min(adv[x.time <= x.time[fav.idxmax()]].min(), 0), 1), live=r.tag >= "2015-03-02"))
L = pd.DataFrame(rows); L["giveback"] = (L.mfe - L.result_pips).round(1)
if __name__ == "__main__":
    out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "journal", "mfe-mae-log.csv"); L.to_csv(out, index=False); print("written", os.path.normpath(out), len(L), "trades")
    W, Lo, St = L[L.R > 0], L[L.R <= 0], L[L.exit == "sl"]; q = lambda s: " / ".join(f"{s.quantile(p):.0f}" for p in (0.1, 0.25, 0.5, 0.75, 0.9))
    print(f"ALL {len(L)}: winners {len(W)}, losers {len(Lo)} (full stops {len(St)}, noon losers {len(Lo)-len(St)})")
    print(f"MFE pips (10/25/50/75/90th pct): winners {q(W.mfe)} | noon losers {q(Lo[Lo.exit!='sl'].mfe)} | full stops {q(St.mfe)}")
    print(f"MAE pips: winners {q(W.mae)} | noon losers {q(Lo[Lo.exit!='sl'].mae)}")
    print(f"winners: result {q(W.result_pips)} | give-back from the best {q(W.giveback)} | share of MFE kept, median {(W.result_pips/W.mfe).median():.2f}")
    print("winners' MAE (heat taken before winning): worse than -10: %d, -20: %d, -30: %d of %d" % ((W.mae < -10).sum(), (W.mae < -20).sum(), (W.mae < -30).sum(), len(W)))
    print("losers (all %d) that were first in profit by 10+: %d, 15+: %d, 20+: %d, 30+: %d | full stops first in profit by 10+: %d, 20+: %d of %d" % (len(Lo), (Lo.mfe >= 10).sum(), (Lo.mfe >= 15).sum(), (Lo.mfe >= 20).sum(), (Lo.mfe >= 30).sum(), (St.mfe >= 10).sum(), (St.mfe >= 20).sum(), len(St)))
    print("MFE reached by ALL trades: " + " | ".join(f">={k}: {(L.mfe>=k).sum()}" for k in (10, 20, 30, 40, 60, 80, 100)))
    for k in (20, 30, 40):
        g = L[L.mfe >= k]; print(f"   trades that reached +{k}: {len(g)} -> final avg {g.R.mean():+.2f}R, ended as losers {int((g.R<=0).sum())}, as full stops {int((g.exit=='sl').sum())}, median final {g.result_pips.median():+.0f} pips")
    hr = pd.to_datetime(W.mfe_time, format="%H:%M").dt.hour; print("hour in which winners made their best price: " + " | ".join(f"{h}:00 {int((hr==h).sum())}" for h in (8, 9, 10, 11)))
    hs = pd.to_datetime(St.exit_time, format="%H:%M").dt.hour; print("hour of the full stops: " + " | ".join(f"{h}:00 {int((hs==h).sum())}" for h in (8, 9, 10, 11)))
    print("by period: before 03-02 winners' median MFE %.0f, give-back %.0f | from 03-02 winners' median MFE %.0f, give-back %.0f" % (W[~W.live].mfe.median(), W[~W.live].giveback.median(), W[W.live].mfe.median(), W[W.live].giveback.median()))

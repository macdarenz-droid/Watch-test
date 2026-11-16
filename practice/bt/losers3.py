"""Review before the next idea (coach 05-12): the LOSING trades of my last 3 killed ideas (BX1 box break, SI1 split entry, TD1 time-decay stop), listed and drawn.
Selection rule written before looking: the LAST 8 losing days of each idea before END (no picking). M15 candles 06:00-18:00 London of the trade day.
usage: python bt/losers3.py END [chart]"""
import sys, io, contextlib, os, runpy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import pandas as pd, numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]
def load(f):
    sys.argv = [f, END]
    with contextlib.redirect_stdout(io.StringIO()): g = runpy.run_path(os.path.join(here, f))
    sys.argv = argv0; return g
bx = load("box_break.py"); si = load("split_entry.py"); ideas = bx["ideas"]; m5 = bx["m5"]; PIP = 1e-4
with contextlib.redirect_stdout(io.StringIO()):
    ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"]); td = ideas.run("TD1", m5, ret=True, **ideas.VARIANTS["TD1"])
A = ta.set_index("tag"); T = td.set_index("tag")
B = pd.DataFrame([r for r in (bx["one"](d, "BX1", 1.0, 0.1) for d in A.index) if r]).set_index("tag")
S = pd.DataFrame({"R": si["V"]["SI1 half 08:00 + half 09:00"], "r8": si["R"]["0800"], "r9": si["R"]["0900"]})
sets = {"BX1": B.R, "SI1": S.R, "TD1": T.R}
wd = lambda d: pd.Timestamp(d).strftime("%a")
for k, r in sets.items():
    L = r[r < 0]; print(f"\n{k}: {len(r)} trades, {len(L)} losing ({L.sum():+.2f}R), {int((r>0).sum())} winning ({r[r>0].sum():+.2f}R). LAST 8 LOSERS:")
    for d in L.index[-8:]:
        a = A.loc[d]; extra = ""
        if k == "BX1": extra = f"break {'UP' if B.side[d]>0 else 'DOWN'}, {'stopped' if B.stop[d] else 'out 17:00'}; A2 that morning {'BUY' if a.side>0 else 'SELL'} {a.R:+.2f}R"
        if k == "SI1": extra = f"A2 {'BUY' if a.side>0 else 'SELL'}; 08:00 half {S.r8[d]:+.2f}R, 09:00 half {S.r9[d]:+.2f}R; A2 whole {a.R:+.2f}R"
        if k == "TD1": extra = f"A2 {'BUY' if a.side>0 else 'SELL'}; TD1 out {T.exit_time[d].strftime('%H:%M')} ({T.reason[d]}); A2 {a.R:+.2f}R out {a.exit_time.strftime('%H:%M')} ({a.reason})"
        print(f"   {d} {wd(d)} {r[d]:+.2f}R | {extra}")
if len(sys.argv) > 2:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    for k, r in sets.items():
        ds = list(r[r < 0].index[-8:]); fig, axes = plt.subplots(4, 2, figsize=(17, 17)); 
        for ax, ds_ in zip(axes.ravel(), ds):
            d = pd.Timestamp(ds_, tz="UTC"); a = A.loc[ds_]
            x = m5[(m5.time >= d + pd.Timedelta(hours=6)) & (m5.time < d + pd.Timedelta(hours=18))].set_index("time")
            g = x.resample("15min").agg({"open": "first", "high": "max", "low": "min", "close": "last"}).dropna().reset_index()
            for i, b in g.iterrows():
                c = "#26a69a" if b.close >= b.open else "#ef5350"; ax.plot([i, i], [b.low, b.high], color=c, lw=0.9); ax.plot([i, i], [b.open, b.close], color=c, lw=4)
            ix = lambda hh, mm=0: (d + pd.Timedelta(hours=hh, minutes=mm) - g.time[0]) / pd.Timedelta(minutes=15)
            ax.axvline(ix(8), color="blue", lw=0.9); ax.axvline(ix(12), color="black", lw=0.9)
            ax.plot(ix(8), a.entry, marker="^" if a.side > 0 else "v", color="blue", ms=11); ax.plot([ix(8), ix(12)], [a.sl, a.sl], color="red", ls="--", lw=0.9)
            if k == "SI1": ax.axvline(ix(9), color="purple", lw=0.9, ls=":")
            if k == "TD1": ns = a.entry - a.side * 25 * PIP; ax.plot([ix(9), ix(12)], [ns, ns], color="magenta", ls="--", lw=1.1)
            if k == "BX1":
                bxx = x[(x.index >= d + pd.Timedelta(hours=12)) & (x.index < d + pd.Timedelta(hours=13, minutes=25))]; H, L_ = bxx.high.max(), bxx.low.min()
                ax.plot([ix(12), ix(17)], [H, H], color="gray", lw=1); ax.plot([ix(12), ix(17)], [L_, L_], color="gray", lw=1); ax.axvline(ix(13, 25), color="orange", lw=0.9); ax.axvline(ix(17), color="black", lw=0.9, ls=":")
                e = (H + 1.1 * PIP) if B.side[ds_] > 0 else (L_ - 0.1 * PIP); s_ = e - B.side[ds_] * 30 * PIP; ax.plot([ix(13, 25), ix(17)], [s_, s_], color="magenta", ls="--", lw=1.1)
            tk = [i for i, tt in enumerate(g.time) if tt.minute == 0]; ax.set_xticks(tk); ax.set_xticklabels([g.time[i].strftime("%H") for i in tk], fontsize=8); ax.grid(alpha=0.25)
            ax.set_title(f"{k} {d.strftime('%a %m-%d')} {r[ds_]:+.2f}R (A2 {'BUY' if a.side>0 else 'SELL'} {a.R:+.2f}R)", fontsize=11)
        fig.tight_layout(); out = f"charts/losers3_{k}.png"; fig.savefig(out, dpi=55); print(out)

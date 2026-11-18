"""Idea WG: fade the weekend gap toward Friday's last close (journal/2015-idea-WG-weekend-gap-second-setup.md; rules and kill lines written first).
Own small simulator on M5 bid bars. usage: python bt/weekend_gap.py END [--check SUNDAY_DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4; H = pd.Timedelta(hours=1); MIN_GAP, MIN_STOP = 10, 15; DROP = ("2015-06-14", "2015-06-21")
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")].reset_index(drop=True)
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.groupby("tag").R.sum()
opens = [i for i in m5.index[1:] if m5.time[i] - m5.time[i - 1] > pd.Timedelta(hours=30)]
def trade(i, dl_h, dl_m, sp=1.0, sl=0.1):
    F = m5.close[i - 1]; O = m5.open[i]; gap = (O - F) / PIP
    if abs(gap) < MIN_GAP or i + 1 >= len(m5): return None
    side = -1 if gap > 0 else 1; e = m5.loc[i + 1]; mon = (m5.time[i].normalize() + pd.Timedelta(days=1)); dl = mon + pd.Timedelta(hours=dl_h, minutes=dl_m)
    S = max(abs(gap), MIN_STOP) * PIP
    entry = e.open + (sp + sl) * PIP if side > 0 else e.open - sl * PIP            # buy at the ask, sell at the bid
    stop = entry - side * S; x = m5[(m5.index >= i + 1) & (m5.time <= dl)]
    for _, b in x.iterrows():
        if b.time >= dl:                                                               # deadline: close at this bar's open
            px = b.open - sl * PIP if side > 0 else b.open + (sp + sl) * PIP; why = "time"; break
        if side > 0:
            if b.low <= stop: px, why = stop - sl * PIP, "stop"; break
            if b.high >= F: px, why = F, "target"; break
        else:
            if b.high + sp * PIP >= stop: px, why = stop + sl * PIP, "stop"; break
            if b.low + sp * PIP <= F: px, why = F, "target"; break
    else: px = x.close.iloc[-1]; why = "end"
    return dict(sun=m5.time[i].strftime("%Y-%m-%d"), mon=mon.strftime("%Y-%m-%d"), gap=round(gap, 1), side=side, entry=entry, stop=stop, target=F, exit=px, why=why, when=b.time.strftime("%a %H:%M"), R=(px - entry) * side / S)
V = {"WG1 to Mon 07:45": (7, 45), "WG2 to Mon 12:00": (12, 0), "WG3 to Mon 21:00": (21, 0)}
def table(dl, **c): return pd.DataFrame([t for t in (trade(i, *dl, **c) for i in opens) if t])
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for k, dl in V.items():
        r = table(dl).set_index("sun").loc[d]; print(f"{d} {k}: gap {r.gap:+.1f} side {int(r.side)} entry {r.entry:.5f} stop {r.stop:.5f} target {r.target:.5f} -> {r.why} {r.when} @{r.exit:.5f} {r.R:+.2f}R")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
print(f"weekends to {END}: {len(opens)} | with |gap| >= {MIN_GAP} pips: {len(table(V['WG1 to Mon 07:45']))} | inspiring weekends dropped from judging: {DROP}")
for k, dl in V.items():
    T = table(dl); ins = T[T.sun.isin(DROP)]; J = T[~T.sun.isin(DROP)].reset_index(drop=True); S = table(dl, sp=3.0, sl=1.0); S = S[~S.sun.isin(DROP)]
    h = len(J) // 2; c = J.R.corr(a2.reindex(J.mon).reset_index(drop=True))
    print(f"{k}: judged {len(J)} trades | avg {J.R.mean():+.3f}R | net {J.R.sum():+.2f} | wins {(J.R > 0).mean():.0%} | targets {int((J.why == 'target').sum())} stops {int((J.why == 'stop').sum())} time exits {int((J.why == 'time').sum())} | without best {J.R.sum() - J.R.max():+.2f} | halves {J.R[:h].sum():+.2f} / {J.R[h:].sum():+.2f} | dd {dd(J.R):.2f} | stressed avg {S.R.mean():+.3f} | corr with A2's Monday {c:+.2f}")
    print("     trades: " + " ".join(f"{r.sun[5:]}:{r.gap:+.0f}:{r.why[0]}{r.R:+.2f}" for r in J.itertuples()) + " || dropped: " + " ".join(f"{r.sun[5:]}:{r.R:+.2f}" for r in ins.itertuples()))
    K = [J.R.mean() >= 0.20, J.R.sum() - J.R.max() > 0, J.R[:h].sum() > 0 and J.R[h:].sum() > 0, dd(J.R) <= 4.0, S.R.mean() >= 0.10, len(J) >= 12, not (c > 0.30)]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if x else 'FAIL'}" for i, x in enumerate(K)))

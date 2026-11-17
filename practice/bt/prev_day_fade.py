"""Idea PD (journal/2015-07-08-thirty-days-by-eye-and-idea-PD.md; setup and kill test written first): fade the first touch of yesterday's London-day
high / low (00:00-20:00 London), stop 30 pips, out 21:00. PD1 no target; PD2 target 30 pips; PD3 only after a clock hour closes back inside.
Judged on cases before 2015-06-08. Own small simulator on M5 bid bars. usage: python bt/prev_day_fade.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4; H = pd.Timedelta(hours=1); SL = 30; CUT, MID = "2015-06-08", "2015-04-07"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")].reset_index(drop=True)
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.groupby("tag").R.sum(); hl = {}
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5]
for d in days:
    x = m5[(m5.time >= d - 2 * H) & (m5.time < d + 22 * H)]
    if len(x) > 100: hl[d] = (x.high.max(), x.low.min())
ks = sorted(hl)
def manage(x, side, entry, sp, sl, tp):
    stop = entry - side * SL * PIP; tgt = entry + side * tp * PIP if tp else None
    for _, b in x.iterrows():
        if side > 0:
            if b.low <= stop: return stop - sl * PIP, "stop", b.time
            if tgt and b.high >= tgt: return tgt, "target", b.time
        else:
            if b.high + sp * PIP >= stop: return stop + sl * PIP, "stop", b.time
            if tgt and b.low + sp * PIP <= tgt: return tgt, "target", b.time
    b = x.iloc[-1]; return (b.close - sl * PIP if side > 0 else b.close + (sp + sl) * PIP), "time", b.time
def run(variant, sp=1.0, sl=0.1):
    out = []
    for i in range(1, len(ks)):
        d = ks[i]; yh, yl = hl[ks[i - 1]]; x = m5[(m5.time >= d) & (m5.time < d + 21 * H)]
        if x.empty or not (yl < x.open.iloc[0] < yh): continue
        w = x[x.time < d + 20 * H]; up = w[w.high >= yh]; dn = w[w.low + sp * PIP <= yl]
        tu = up.time.iloc[0] if len(up) else None; td = dn.time.iloc[0] if len(dn) else None
        if tu is None and td is None: continue
        side = -1 if (td is None or (tu is not None and tu <= td)) else 1; t0 = tu if side < 0 else td; lvl = yh if side < 0 else yl
        if variant in ("PD1", "PD2"):
            rest = x[x.time > t0]; entry = lvl
            if rest.empty: continue
            # the touch bar itself can also take the stop: check it first (conservative: the bar's far end against me)
            tb = x[x.time == t0].iloc[0]; stop = entry - side * SL * PIP
            if (side < 0 and tb.high + sp * PIP >= stop) or (side > 0 and tb.low <= stop): px, why, tt = (stop + side * -1 * sl * PIP if side > 0 else stop + sl * PIP), "stop", t0
            else: px, why, tt = manage(rest, side, entry, sp, sl, SL if variant == "PD2" else None)
        else:
            hrs = x.set_index("time").resample("1h").agg(open=("open", "first"), close=("close", "last")).dropna(); h0 = t0.floor("h")
            ok = hrs[(hrs.index >= h0) & ((hrs.close < yh) if side < 0 else (hrs.close > yl))]
            if ok.empty: continue
            te = ok.index[0] + H; rest = x[x.time >= te]
            if rest.empty or te >= d + 20 * H: continue
            entry = rest.open.iloc[0] - sl * PIP if side < 0 else rest.open.iloc[0] + (sp + sl) * PIP; px, why, tt = manage(rest, side, entry, sp, sl, None)
        out.append(dict(day=d.strftime("%Y-%m-%d"), side=side, at=t0.strftime("%H:%M"), entry=entry, exit=px, why=why, out=tt.strftime("%H:%M"), R=(px - entry) * side / (SL * PIP)))
    return pd.DataFrame(out)
V = ("PD1", "PD2", "PD3")
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for v in V:
        T = run(v); T = T[T.day == d]; print(v + ": " + ("no trade" if T.empty else " | ".join(f"touch {r.at} {'BUY' if r.side > 0 else 'SELL'} {r.entry:.5f} -> {r.why} {r.out} {r.exit:.5f} {r.R:+.2f}R" for r in T.itertuples())))
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
for v, name in zip(V, ("PD1 fade at the touch, out 21:00", "PD2 the same with a 30 pip target", "PD3 after an hour closes back inside")):
    T = run(v); S = run(v, sp=2.0, sl=0.5); J = T[T.day < CUT].reset_index(drop=True); SJ = S[S.day < CUT]; st = T[T.day >= CUT]; e = J.day < MID
    daily = J.groupby("day").R.sum(); c = daily.corr(a2.reindex(daily.index))
    print(f"{name}: JUDGED {len(J)} trades | avg {J.R.mean():+.3f}R | net {J.R.sum():+.2f} | wins {(J.R > 0).mean():.0%} | stops {(J.why == 'stop').mean():.0%} | before {MID}: {int(e.sum())} trades avg {J.R[e].mean():+.3f} net {J.R[e].sum():+.2f} | {MID}..06-05: {int((~e).sum())} trades avg {J.R[~e].mean():+.3f} net {J.R[~e].sum():+.2f}")
    print(f"     without its 3 best {J.R.sum() - J.R.nlargest(3).sum():+.2f} | max DD {dd(J.R):.2f}R | stressed avg {SJ.R.mean():+.3f} | corr with A2 {c:+.2f} || the studied 30 days (NOT judged): {len(st)} trades avg {st.R.mean():+.3f} net {st.R.sum():+.2f}")
    K = [J.R.mean() >= 0.10, J.R[e].sum() > 0 and J.R[~e].sum() > 0, J.R.sum() - J.R.nlargest(3).sum() > 0, dd(J.R) <= 8.0, SJ.R.mean() >= 0.05, len(J) >= 60, not (c > 0.30)]
    print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))

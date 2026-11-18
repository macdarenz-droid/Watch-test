"""Idea DC: worst-case cost of one day at 0.50%. DC1 stop days re-filled at the extreme of the M1 candle that first touched the stop; DC2 biggest M1 range
08:00-12:00 London on any weekday; DC3 the same for a 30 pip stop 12:00-17:00 at 0.25% added to DC2. usage: python bt/day_cushion.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4; SP, SL = 1.0, 0.1
cut = lambda x: x[x.time < pd.Timestamp(END, tz="UTC")]
m5 = cut(ideas.days(history("M5"))); m1 = cut(ideas.days(history("M1")))
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
t = t.set_index("tag"); stops = t[t.reason == "sl"]
rows = []
for d, r in stops.iterrows():
    dd_ = pd.Timestamp(d, tz="UTC"); x = m1[(m1.time >= dd_ + pd.Timedelta(hours=8, minutes=1)) & (m1.time < dd_ + pd.Timedelta(hours=12))]
    hit = x[(x.high + SP * PIP >= r.sl)] if r.side < 0 else x[x.low <= r.sl]
    if hit.empty: rows.append(dict(tag=d, note="no M1 touch")); continue
    b = hit.iloc[0]; fill = b.high + (SP + SL) * PIP if r.side < 0 else b.low - SL * PIP
    dist = abs(r.entry - r.sl) / PIP; loss = abs(fill - r.entry) / PIP
    rows.append(dict(tag=d, side=int(r.side), entry=r.entry, sl=r.sl, t=b.time.strftime("%H:%M"), hi=b.high, lo=b.low, fill=fill, engR=r.R, worstR=-loss / dist, beyond=loss - dist))
S = pd.DataFrame(rows).set_index("tag")
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(S.loc[d].to_string()); sys.exit()
ok = S.dropna(subset=["worstR"])
print(f"A2 days to {END}: {len(t)} | engine stop days: {len(stops)} | with an M1 touch: {len(ok)} | engine worst day {t.R.min():+.2f}R")
print(f"DC1 worst-in-the-minute: worst day {ok.worstR.min():+.2f}R on {ok.worstR.idxmin()} | average fill {ok.beyond.mean():.1f} pips beyond the stop, largest {ok.beyond.max():.1f} | average stop day {ok.worstR.mean():+.2f}R (engine {ok.engR.mean():+.2f}R)")
print("     three worst: " + "; ".join(f"{d} {r.worstR:+.2f}R ({r.beyond:.1f} pips beyond, {r.t})" for d, r in ok.nsmallest(3, "worstR").iterrows()))
wk = m1[m1.time.dt.weekday < 5]; hh = wk.time.dt.hour; rng = (wk.high - wk.low) / PIP
def big(a, b):
    r = rng[(hh >= a) & (hh < b)]; top = r.nlargest(5); return r, [(wk.time[i].strftime("%m-%d %H:%M"), round(v, 1)) for i, v in top.items()]
rm, topm = big(8, 12); ra, topa = big(12, 17)
w2 = -(40 + rm.max() + SP + SL) / 40; w3 = -(30 + ra.max() + SP + SL) / 30
print(f"DC2 biggest minute 08:00-12:00 London: {rm.max():.1f} pips; top 5 {topm}; minutes counted {len(rm)}; 99.9th percentile {rm.quantile(0.999):.1f} | hypothetical worst day {w2:+.2f}R = {abs(w2)*0.5:.2f}% of the balance")
print(f"DC3 biggest minute 12:00-17:00 London: {ra.max():.1f} pips; top 5 {topa}; 99.9th percentile {ra.quantile(0.999):.1f} | 30 pip stop worst {w3:+.2f}R = {abs(w3)*0.25:.2f}% at 0.25% | both in one day {abs(w2)*0.5+abs(w3)*0.25:.2f}%")
print(f"KILL LINES: K1 DC1 worst >= -1.50R: {'PASS' if ok.worstR.min() >= -1.5 else 'FAIL'} | K2 DC2 >= -2.50R: {'PASS' if w2 >= -2.5 else 'FAIL'} | K3 both <= 2.0%: {'PASS' if abs(w2)*0.5+abs(w3)*0.25 <= 2.0 else 'FAIL'}")

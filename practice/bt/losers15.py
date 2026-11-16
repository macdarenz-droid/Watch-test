"""Facts for the eye review of A2's last N losing trades (R <= 0): read from the engine and the M5 candles, London time. usage: python bt/losers15.py END [N]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; N = int(sys.argv[2]) if len(sys.argv) > 2 else 15
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
L = t[t.R <= 0].tail(N); print("dates:", " ".join(L.tag))
print("day        side   R    exit   pre-hr  best  worst  best@   noon   17:00  (pips from entry, + = my way; pre-hr = 07:00->08:00 move, + = my way)")
rows = []
for r in L.itertuples():
    d = pd.Timestamp(r.tag, tz="UTC"); s = r.side; x = m5[(m5.time >= d + pd.Timedelta(hours=7)) & (m5.time < d + pd.Timedelta(hours=17, minutes=5))]
    pre = x[x.time < d + pd.Timedelta(hours=8)]; am = x[(x.time >= d + pd.Timedelta(hours=8)) & (x.time < d + pd.Timedelta(hours=12))]
    f = lambda px: s * (px - r.entry) / 1e-4
    prehr = s * (pre.close.iloc[-1] - pre.open.iloc[0]) / 1e-4; best = (f(am.high.max()) if s > 0 else f(am.low.min())); worst = (f(am.low.min()) if s > 0 else f(am.high.max()))
    bt_ = am.time.iloc[(am.high.values.argmax() if s > 0 else am.low.values.argmin())].strftime("%H:%M")
    noon = f(x[x.time == d + pd.Timedelta(hours=12)].open.iloc[0]); p17 = x[x.time == d + pd.Timedelta(hours=17)]; e17 = f(p17.open.iloc[0]) if len(p17) else np.nan
    rows.append(dict(day=r.tag, side=s, R=r.R, stop=r.reason == "sl", prehr=prehr, best=best, worst=worst, noon=noon, e17=e17))
    print(f"{r.tag} {'BUY ' if s>0 else 'SELL'} {r.R:+.2f} {r.exit_time.strftime('%H:%M')}{'*' if r.reason=='sl' else ' '} {prehr:+6.0f} {best:+6.0f} {worst:+6.0f}  {bt_}  {noon:+6.0f} {e17:+6.0f}")
f = pd.DataFrame(rows)
print(f"\n{len(f)} losers: net {f.R.sum():+.2f}R | full stops {int(f.stop.sum())} | buys {int((f.side>0).sum())} sells {int((f.side<0).sum())}")
print(f"pre-entry hour went MY way (so I entered at a worse price) on {int((f.prehr>0).sum())}; against me on {int((f.prehr<0).sum())} | median pre-hour move {f.prehr.median():+.0f}")
print(f"best price before noon: >= +20 pips on {int((f.best>=20).sum())}, >= +10 on {int((f.best>=10).sum())}, under +10 on {int((f.best<10).sum())}")
print(f"at 17:00 London price was on MY side of the entry on {int((f.e17>0).sum())} of {int(f.e17.notna().sum())}; >= +30 pips my way on {int((f.e17>=30).sum())}; noon -> 17:00 moved my way on {int(((f.e17-f.noon)>0).sum())}")

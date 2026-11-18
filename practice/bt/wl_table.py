"""Look-first table (coach 05-18: start from my own A2 losers and winners): the LAST 12 losing and LAST 12 winning A2 days before END, entry-time facts only.
age = days in a row the 3-day signal has pointed this way (1 = flip day); run = 22:00 London closes in a row in my direction before today;
pos_y = where the 08:00 price sits in yesterday's London-day range, measured in my direction (1 = at the extreme I am trading toward, >1 = beyond it);
pre = net move of 07:00-08:00 in my direction (pips); night = 00:00->08:00 in my direction (pips). usage: python bt/wl_table.py END [all]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
END = sys.argv[1]; PIP = 1e-4
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): t = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
t = t.set_index("tag"); day = m5.time.dt.normalize()
def at(d, hh):
    x = m5[(m5.time >= d + pd.Timedelta(hours=hh)) & (m5.time < d + pd.Timedelta(hours=hh + 1))]; return x.open.iloc[0] if len(x) else np.nan
cl = {}                       # 22:00 London closes by date (last bar before 22:00)
for d in sorted(day.unique()):
    x = m5[(m5.time >= d) & (m5.time < d + pd.Timedelta(hours=22))]
    if len(x) and d.weekday() < 5: cl[d] = x.close.iloc[-1]
cl = pd.Series(cl); rows = []; prev_side = None; age = 0
for ds, r in t.iterrows():
    d = pd.Timestamp(ds, tz="UTC"); s = int(r.side); age = age + 1 if s == prev_side else 1; prev_side = s
    c = cl[cl.index < d]; run = 0
    for k in range(1, 8):
        if len(c) > k and (c.iloc[-k] - c.iloc[-k - 1]) * s > 0: run += 1
        else: break
    yd = c.index[-1]; y = m5[(m5.time >= yd - pd.Timedelta(hours=2)) & (m5.time < yd + pd.Timedelta(hours=22))]; yh, yl = y.high.max(), y.low.min()
    p8, p7, p0 = at(d, 8), at(d, 7), at(d, 0)
    pos = (p8 - yl) / (yh - yl) if s > 0 else (yh - p8) / (yh - yl)
    rows.append(dict(tag=ds, wd=d.strftime("%a"), side="B" if s > 0 else "S", R=r.R, age=age, run=run, pos_y=pos, pre=(p8 - p7) * s / PIP, night=(p8 - p0) * s / PIP))
F = pd.DataFrame(rows).set_index("tag")
if __name__ == "__main__":
    pd.set_option("display.width", 200); f = lambda x: x.round(2).to_string()
    if len(sys.argv) > 2: print(f(F)); sys.exit()
    L = F[F.R < 0].tail(12); W = F[F.R > 0].tail(12)
    print("LAST 12 LOSERS"); print(f(L)); print("LAST 12 WINNERS"); print(f(W))
    for n, g in (("losers", L), ("winners", W)): print(f"{n}: median age {g.age.median():.1f} | median run {g.run.median():.1f} | median pos_y {g.pos_y.median():.2f} | pos_y > 1: {(g.pos_y>1).sum()} | median pre {g.pre.median():+.1f} | median night {g.night.median():+.1f} | buys {(g.side=='B').sum()}")

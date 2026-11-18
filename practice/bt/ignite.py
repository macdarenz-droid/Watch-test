"""Idea M 'ignition candle': first H1 candle (07:00-16:00 UTC) that closes beyond the prior trading day's high/low with body >= B pips in that direction.
Enter at the next hour's open, SL 40 pips, $125 risk, one trade/day, costs on (backtest.Account on M5 bars).
usage: python bt/ignite.py START END   (one month window; nothing at or after END is loaded)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd
from backtest import history, Account, PIP
a, b = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40
INSPIRING = {"2015-01-15", "2015-01-22", "2015-01-23", "2015-01-27", "2015-02-03"}
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(b, tz="UTC")]
g = m5.groupby("day"); HI, LO = g["high"].max(), g["low"].min(); days = list(HI.index)
def run(B, exit_h=20, hold=None):
    acct = Account()
    for d, x in m5.groupby("day"):
        i = days.index(d)
        if i == 0: continue
        ph, pl = HI.iloc[i-1], LO.iloc[i-1]; x = x[x.time.dt.date == d]; done = False; out_at = None
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute
            if not done and mnt == 0 and 8 <= h <= 17:                     # the H1 candle that just closed is hour h-1 (07:00..16:00)
                c = x[(x.time.dt.hour == h - 1)]
                if len(c) == 12:
                    o, cl = c.open.iloc[0], c.close.iloc[-1]; body = (cl - o) / PIP
                    side = 1 if (cl > ph and body >= B) else (-1 if (cl < pl and -body >= B) else 0)
                    if side:
                        acct.market(side, round(RISK / (SL * 10), 2), sl=bar.open - side * SL * PIP, tag=str(d)); done = True
                        out_at = (h + hold) if hold else exit_h
            if acct.positions and out_at is not None and h >= min(out_at, 21) and mnt == 0: acct.close(); out_at = None
            acct.on_bar(bar)
        if acct.positions: acct.close()
    t = pd.DataFrame(acct.trades)
    if t.empty: return t
    t["R"] = t.pnl / RISK; return t[t.entry_time >= pd.Timestamp(a, tz="UTC")].reset_index(drop=True)
def st(t):
    if len(t) == 0: return "n= 0"
    eq = t.R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
    best = t.R.max(); return f"n={len(t):2d} win={100*(t.R>0).mean():3.0f}% avg={t.R.mean():+.2f} net={t.R.sum():+6.2f} dd={dd:.2f} | net without best ({best:+.2f}) {t.R.sum()-best:+.2f}"
print(a, "..", b)
for k, kw in (("M1", dict(B=40)), ("M2", dict(B=60)), ("M3", dict(B=40, hold=4))):
    t = run(**kw)
    if t.empty: print(f"  {k} no trades"); continue
    r = t[~t.entry_time.dt.strftime("%Y-%m-%d").isin(INSPIRING)]
    print(f"  {k} ALL (flattered): {st(t)}"); print(f"  {k} without the 5 inspiring days: {st(r)}")
    print("     ", " ".join(f"{str(x.entry_time)[5:13]}h{'B' if x.side>0 else 'S'}{x.R:+.2f}{'*' if str(x.entry_time)[:10] in INSPIRING else ''}" for x in t.itertuples()))

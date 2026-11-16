"""Idea SI: split the A2 entry in time. Each part: market order at its time in A2's direction, stop 40 pips from the bid at that time, close 12:00 London; total risk $125.
SI1 = half 08:00 + half 09:00; SI2 = half 08:00 + half 08:30; SI3 = thirds 08:00 / 08:30 / 09:00. Per-day R of all parts, compared with A2.
usage: python bt/split_entry.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL, LIVE0 = 125.0, 40, "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").agg(R=("R", "sum"), side=("side", "first"))
def part(hh, mm):          # a full-size A2-style trade entered at hh:mm, R per day (0 lots rounding: R is scale-free)
    acct = Account()
    for d in A.index:
        dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=hh, minutes=mm)) & (m5.time <= dd_ + pd.Timedelta(hours=12))]
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute
            if h == hh and mnt == mm: acct.market(int(A.side[d]), round(RISK / (SL * 10), 3), sl=bar.open - A.side[d] * SL * PIP, tag=d)
            if acct.positions and h >= 12: acct.close()
            acct.on_bar(bar)
        assert not acct.positions, d
    t = pd.DataFrame(acct.trades); t["R"] = t.pnl / RISK; return t.set_index("tag")
P = {"0800": part(8, 0), "0830": part(8, 30), "0900": part(9, 0)}
chk = (P["0800"].R.reindex(A.index) - A.R).abs().max(); print(f"check: my 08:00 part against the engine's A2, largest difference per day: {chk:.3f}R")
R = {k: v.R.reindex(A.index) for k, v in P.items()}; assert all(r.notna().all() for r in R.values())
V = {"SI1 half 08:00 + half 09:00": (R["0800"] + R["0900"]) / 2, "SI2 half 08:00 + half 08:30": (R["0800"] + R["0830"]) / 2, "SI3 thirds 08:00 / 08:30 / 09:00": (R["0800"] + R["0830"] + R["0900"]) / 3}
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]
    for k, v in P.items(): r = v.loc[d]; print(f"   {d} part {k}: side {int(r.side)} entry {r.entry:.5f} sl {r.sl:.5f} exit {r.exit:.5f} @{r.exit_time.strftime('%H:%M')} {r.reason} R {r.R:+.2f}")
    for k, v in V.items(): print(f"   {k}: {v[d]:+.2f}R (A2 {A.R[d]:+.2f}R)")
    sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def w10(r): return r.rolling(10).sum().min()
a = A.R; live = a.index >= LIVE0
def line(n, r): return f"{n}: net {r.sum():+.2f} ({100*r.sum()/a.sum():.0f}%) dd {dd(r):.2f} score {r.sum()/dd(r):.1f} ({r.sum()/dd(r)/(a.sum()/dd(a)):.2f}x) worst10 {w10(r):+.2f} worst day {r.min():+.2f} sd {r.std(ddof=1):.2f} | backtest net {r[~live].sum():+.2f} ({100*r[~live].sum()/a[~live].sum():.0f}%) dd {dd(r[~live]):.2f} (A2 {dd(a[~live]):.2f}) | live net {r[live].sum():+.2f} ({100*r[live].sum()/a[live].sum():.0f}%) dd {dd(r[live]):.2f} (A2 {dd(a[live]):.2f})"
print(line("A2 (whole position at 08:00)", a)); print(line("single entry at 08:30 (reported only)", R["0830"])); print(line("single entry at 09:00 (reported only)", R["0900"]))
for k, r in V.items():
    print(line(k, r))
    k1 = r.sum() >= 0.95 * a.sum(); k2 = r.sum() / dd(r) >= 1.15 * a.sum() / dd(a)
    k3 = all(r[m].sum() >= 0.90 * a[m].sum() and dd(r[m]) <= dd(a[m]) + 1e-9 for m in (~live, live)); k4 = w10(r) >= w10(a) - 1e-9; k5 = r.min() >= a.min() - 0.05
    print(f"     KILL LINES: K1 net >= 95%: {'PASS' if k1 else 'FAIL'} | K2 score >= 1.15x: {'PASS' if k2 else 'FAIL'} | K3 both periods (net >= 90%, dd not above): {'PASS' if k3 else 'FAIL'} | K4 worst10 not worse: {'PASS' if k4 else 'FAIL'} | K5 worst day: {'PASS' if k5 else 'FAIL'}")

"""Idea LM: on mornings with a lively pre-entry hour (07:00-08:00 London range >= 30 pips), trade the hour's own direction (LM1), against it (LM2), or with it only
if the hour moved >= 20 pips net (LM3). Market 08:00 London, stop 40, close 12:00, $125 risk, costs on. Compared with A2 on the same mornings.
usage: python bt/lively_morning.py END [--check DATE]"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END = sys.argv[1]; RISK, SL, LIVE0 = 125.0, 40, "2015-03-02"
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
A = ta.groupby("tag").R.sum(); feat = {}
for d in A.index:
    dd_ = pd.Timestamp(d, tz="UTC"); pre = m5[(m5.time >= dd_ + pd.Timedelta(hours=7)) & (m5.time < dd_ + pd.Timedelta(hours=8))]
    feat[d] = ((pre.high.max() - pre.low.min()) / PIP, (pre.close.iloc[-1] - pre.open.iloc[0]) / PIP)
def run(k):
    acct = Account()
    for d in A.index:
        rng, net = feat[d]
        if rng < 30 or net == 0: continue
        if k == "LM3" and abs(net) < 20: continue
        side = (1 if net > 0 else -1) * (-1 if k == "LM2" else 1)
        dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=8)) & (m5.time <= dd_ + pd.Timedelta(hours=12))]
        for _, bar in x.iterrows():
            h, mnt = bar.time.hour, bar.time.minute
            if h == 8 and mnt == 0: acct.market(side, round(RISK / (SL * 10), 2), sl=bar.open - side * SL * PIP, tag=d)
            if acct.positions and h >= 12: acct.close()
            acct.on_bar(bar)
        assert not acct.positions, d
    t = pd.DataFrame(acct.trades); t["R"] = t.pnl / RISK; return t
if "--check" in sys.argv:
    d = sys.argv[sys.argv.index("--check") + 1]; print(d, f"pre-entry hour range {feat[d][0]:.1f} pips, net {feat[d][1]:+.1f} pips | A2 that morning {A[d]:+.2f}R")
    for k in ("LM1", "LM2", "LM3"):
        t = run(k); r = t[t.tag == d]
        print(f"   {k}:", "no trade" if r.empty else f"side {int(r.side.iloc[0])} entry {r.entry.iloc[0]:.5f} sl {r.sl.iloc[0]:.5f} exit {r.exit.iloc[0]:.5f} @{r.exit_time.iloc[0].strftime('%H:%M')} {r.reason.iloc[0]} R {r.R.iloc[0]:+.2f}")
    print("lively mornings:", sum(1 for v in feat.values() if v[0] >= 30), "of", len(feat), "| with a net move of 20+ pips:", sum(1 for v in feat.values() if v[0] >= 30 and abs(v[1]) >= 20)); sys.exit()
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
lv = [d for d in A.index if feat[d][0] >= 30]; print(f"A2 to {END}: {len(A)} mornings, {len(lv)} lively | A2 on the lively mornings: n={len(lv)} avg={A[lv].mean():+.3f} net={A[lv].sum():+.2f}")
for k in ("LM1", "LM2", "LM3"):
    t = run(k); r = t.set_index("tag").R; live = r.index >= LIVE0; top3 = r.nlargest(3).sum(); a = A[r.index]; se = r.std(ddof=1) / np.sqrt(len(r))
    print(f"{k}: n={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} (+-{2*se:.2f}) net={r.sum():+.2f} stops={int((t.reason=='sl').sum())} dd={dd(r):.2f} | backtest months {r[~live].sum():+.2f} ({int((~live).sum())}) live months {r[live].sum():+.2f} ({int(live.sum())}) | without best 3: {r.sum()-top3:+.2f} | A2 on the same mornings: avg {a.mean():+.3f} -> difference {r.mean()-a.mean():+.3f}")
    k1 = r.mean() >= 0.15; k2 = r[~live].sum() > 0 and r[live].sum() > 0; k3 = r.sum() - top3 > 0; k4 = dd(r) <= 5; k5 = r.mean() - a.mean() >= 0.15; k6 = len(r) >= 20
    print(f"     KILL LINES: K1 avg >= +0.15: {'PASS' if k1 else 'FAIL'} | K2 both periods positive: {'PASS' if k2 else 'FAIL'} | K3 positive without best 3: {'PASS' if k3 else 'FAIL'} | K4 dd <= 5R: {'PASS' if k4 else 'FAIL'} | K5 beats A2 there by 0.15R: {'PASS' if k5 else 'FAIL'} | K6 at least 20 trades: {'PASS' if k6 else 'FAIL'}")

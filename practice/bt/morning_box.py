"""Idea MB: BX1 (bt/box_break.py, unchanged) taken only when the break goes with the morning. MB1 side == sign(12:00 open - 08:00 open);
MB2 = MB1 and |morning| >= 20 pips; MB3 side == sign(12:00 open - 00:00 open). Bid, London time. Decision on the set without the 8 inspiring days.
usage: python bt/morning_box.py END [--check DATE,DATE]"""
import sys, io, contextlib, os, runpy
import pandas as pd, numpy as np
END = sys.argv[1]; here = os.path.dirname(os.path.abspath(__file__)); argv0 = sys.argv[:]; PIP = 1e-4
DROP = ["2015-04-28", "2015-04-30", "2015-05-01", "2015-05-04", "2015-05-05", "2015-05-06", "2015-05-08", "2015-05-12"]
sys.argv = ["box_break.py", END]
with contextlib.redirect_stdout(io.StringIO()): bx = runpy.run_path(os.path.join(here, "box_break.py"))
sys.argv = argv0; m5, A, one = bx["m5"], bx["A"], bx["one"]
def op(d, hh):
    dd_ = pd.Timestamp(d, tz="UTC"); x = m5[(m5.time >= dd_ + pd.Timedelta(hours=hh)) & (m5.time < dd_ + pd.Timedelta(hours=hh + 1))]; return x.open.iloc[0], x.time.iloc[0].strftime("%H:%M")
def trades(spread, slip):
    rows = []
    for d in A.index:
        r = one(d, "BX1", spread, slip)
        if not r: continue
        o0, o8, o12 = op(d, 0)[0], op(d, 8)[0], op(d, 12)[0]; r["morn"] = (o12 - o8) / PIP; r["day"] = (o12 - o0) / PIP; rows.append(r)
    t = pd.DataFrame(rows).set_index("tag")
    t["MB1"] = np.sign(t.morn) == t.side; t["MB2"] = t.MB1 & (t.morn.abs() >= 20); t["MB3"] = np.sign(t.day) == t.side; return t
T = trades(1.0, 0.1); TS = trades(3.0, 1.0)
if "--check" in sys.argv:
    for d in sys.argv[sys.argv.index("--check") + 1].split(","):
        (o0, t0), (o8, t8), (o12, t12) = op(d, 0), op(d, 8), op(d, 12)
        if d not in T.index: print(f"{d}: open {t8} {o8:.5f} | open {t12} {o12:.5f} | morning {(o12-o8)/PIP:+.1f} pips | NO box trade (no break of the 12:00-13:25 box between 13:25 and 14:30)"); continue
        r = T.loc[d]
        print(f"{d}: open {t0} {o0:.5f} | open {t8} {o8:.5f} | open {t12} {o12:.5f} | morning {r.morn:+.1f} pips, day so far {r.day:+.1f} pips | break {'UP' if r.side>0 else 'DOWN'} {r.R:+.2f}R | MB1 {'keep' if r.MB1 else 'remove'} MB2 {'keep' if r.MB2 else 'remove'} MB3 {'keep' if r.MB3 else 'remove'}")
    sys.exit()
per = lambda d: "Jan" if d < "2015-02-01" else ("Feb" if d < "2015-03-01" else "Mar-now"); PS = ("Jan", "Feb", "Mar-now")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
def report(t, ts, label):
    print(f"\n=== {label}: BX1 all {len(t)} trades avg {t.R.mean():+.3f} net {t.R.sum():+.2f} ===")
    for k in ("MB1", "MB2", "MB3"):
        r = t.R[t[k]]; o = t.R[~t[k]]; rs = ts.R[ts[k]]; P = pd.Series(r.index.map(per), index=r.index); pp = {p: r[P == p].sum() for p in PS}; top3 = r.nlargest(3).sum()
        m = pd.concat([r, A], axis=1, keys=["n", "a"]).dropna(); corr = np.corrcoef(m.n, m.a)[0, 1]; onloss = m.n[m.a < 0].sum(); w10 = r.rolling(10).sum().min(); se = r.std(ddof=1) / np.sqrt(len(r))
        h = lambda s, late: s[(s.index >= "2015-03-02") == late]
        print(f"{k}: KEPT n={len(r)} win={100*(r>0).mean():.0f}% avg={r.mean():+.3f} (+-{2*se:.2f}) net={r.sum():+.2f} dd={dd(r):.2f} worst10={w10:+.2f} | " + " ".join(f"{p} {v:+.2f} ({int((P==p).sum())})" for p, v in pp.items()) +
              f" | without best 3 {r.sum()-top3:+.2f} | stressed avg {rs.mean():+.3f} | corr A2 {corr:+.2f}, on A2 losing days {onloss:+.2f}\n     REMOVED n={len(o)} win={100*(o>0).mean():.0f}% avg={o.mean():+.3f} net={o.sum():+.2f} | kept-removed: all {r.mean()-o.mean():+.3f}; before 03-02 {h(r,False).mean():+.3f} vs {h(o,False).mean():+.3f} ({len(h(r,False))}/{len(h(o,False))}); from 03-02 {h(r,True).mean():+.3f} vs {h(o,True).mean():+.3f} ({len(h(r,True))}/{len(h(o,True))})")
        K = [r.mean() >= 0.15, rs.mean() >= 0.05, all(v > 0 for v in pp.values()), r.sum() - top3 > 0, dd(r) <= 5 and w10 >= -4, corr <= 0.30 and onloss >= 0, len(r) >= 30,
             r.mean() - o.mean() >= 0.20 and h(r, False).mean() > h(o, False).mean() and h(r, True).mean() > h(o, True).mean()]
        print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if v else 'FAIL'}" for i, v in enumerate(K)))
report(T.drop(DROP), TS.drop(DROP), f"DECISION SET (to {END}, 8 inspiring days dropped)"); report(T, TS, "reported only: all days")
L = T[T.R < 0]; print(f"\nbase rate for E1: BX1 losers against the morning {int((~L.MB1).sum())} of {len(L)}; winners against the morning {int((~T.MB1[T.R>0]).sum())} of {int((T.R>0).sum())}; all trades against {int((~T.MB1).sum())} of {len(T)}")

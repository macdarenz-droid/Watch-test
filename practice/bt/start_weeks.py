"""Full rulebook (A2 + sizing + brakes + finishing size) as a fresh 2-phase $25k challenge started on each Monday of Jan-Feb 2015. Mechanical A2, costs on. History before the clock only."""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
m5 = ideas.days(history("M5"))
with contextlib.redirect_stdout(io.StringIO()): T = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
T["d"] = T.entry_time.dt.tz_localize(None).dt.normalize(); T = T[["d", "R"]].reset_index(drop=True); LAST = T.d.iloc[-1]
STARTS = pd.to_datetime(["2015-01-05", "2015-01-12", "2015-01-19", "2015-01-26", "2015-02-02", "2015-02-09", "2015-02-16", "2015-02-23"])
def challenge(start, risk1, risk2):
    x = T[T.d >= start]; phase, bal, td, n, low, p1, brake = 1, 25000.0, 0, 0, 0.0, None, False; peak = bal; touched = False
    for r in x.itertuples():
        base = (risk1 if phase == 1 else risk2) * 250.0; tgt = 27000.0 if phase == 1 else 26250.0
        risk = 125.0 if brake else base
        if tgt - bal <= 0.25 * base: risk = 40.0                       # finishing size 0.10 lots
        bal += r.R * risk; td += 1; n += 1; low = min(low, (bal - 25000) / 250); peak = max(peak, bal)
        if bal <= 22500: return dict(res="BREACH", n=n, day=r.d, p1=p1, low=low)
        if bal <= 23500: return dict(res="BRAKE-STOP", n=n, day=r.d, p1=p1, low=low)
        touched = touched or bal <= 24000
        brake = (bal <= 24000) or (brake and bal < peak)
        if bal >= tgt and td >= 5:
            if phase == 1: p1 = (n, r.d); phase, bal, td, brake, peak = 2, 25000.0, 0, False, 25000.0
            else: return dict(res="PASSED", n=n, day=r.d, p1=p1, low=low, touched=touched)
    return dict(res="running", n=n, day=LAST, p1=p1, low=low, bal=bal, phase=phase, touched=touched)
POL = [(f"{a}% / {b}%", float(a), float(b)) for a, b in (x.split(",") for x in sys.argv[1:])] or [("P-A: 0.5% phase 1, 0.75% phase 2", 0.5, 0.75), ("P-B: 0.5% both phases", 0.5, 0.5)]
for name, r1, r2 in POL:
    print(name); rows = []
    for s in STARTS:
        o = challenge(s, r1, r2); avail = int((T.d >= s).sum())
        p1 = f"{o['p1'][0]} days ({o['p1'][1].strftime('%m-%d')})" if o["p1"] else "-"
        if o["res"] == "PASSED": both = f"{o['n']} trading days / {(o['day'] - s).days + 1} calendar ({o['day'].strftime('%m-%d')})"
        elif o["res"] == "running": both = f"not yet: phase {o['phase']} at {100*(o['bal']-25000)/25000:+.1f}% after {o['n']} days"
        else: both = o["res"]
        in1 = "yes" if o["res"] == "PASSED" and o["n"] <= 21 else ("no" if avail >= 21 or o["res"] != "running" else "undecided")
        in2 = "yes" if o["res"] == "PASSED" and o["n"] <= 42 else ("no" if avail >= 42 or o["res"] not in ("running",) and o["res"] != "PASSED" else ("no" if o["res"] == "PASSED" else "undecided"))
        rows.append(dict(start=s.strftime("%m-%d"), days_of_data=avail, phase1=p1, both=both, in1=in1, in2=in2, low=f"{o['low']:+.2f}%", lowv=o['low'], brake4=o.get('touched', False), n=o["n"] if o["res"] == "PASSED" else np.nan, res=o["res"]))
    D = pd.DataFrame(rows); pd.set_option("display.width", 250); print(D.drop(columns=["n", "res", "lowv"]).to_string(index=False))
    d1 = D[D.in1 != "undecided"]; d2 = D[D.in2 != "undecided"]
    print(f"  within 1 month: {int((d1.in1=='yes').sum())} of {len(d1)} decided | within 2 months: {int((d2.in2=='yes').sum())} of {len(d2)} decided ({len(D)-len(d2)} undecided) | breach or brake-stop: {int(D.res.isin(['BREACH','BRAKE-STOP']).sum())} of {len(D)} | median trading days to pass both (passed starts only): {D.n.median()} | worst low {D.lowv.min():+.2f}% | starts touching the -4% brake: {int(D.brake4.sum())}")

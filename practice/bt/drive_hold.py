"""Idea DH (journal/2015-idea-DH-drive-and-hold.md; rule and kill lines pushed first). London time.
drive = open(20:00) - open(12:00) of the previous trading day, pips. kept = (open(08:00 today) - that 12:00 open) / drive.
DH1 |drive|>=30 & kept>=0.5 | DH2 |drive|>=50 & kept>=0.5 | DH3 |drive|>=30. 08:00 market in the drive's direction, stop 40, out 12:00.
usage: python bt/drive_hold.py END count | check DATE | test"""
import sys, io, contextlib, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history, Account, PIP
END, MODE = sys.argv[1], sys.argv[2]; RISK, SL = 125.0, 40; H = pd.Timedelta(hours=1)
INSP = ["2015-06-04", "2015-03-23", "2015-05-19", "2015-03-06", "2015-03-11", "2015-04-13", "2015-04-30", "2015-04-17", "2015-03-10", "2015-04-28", "2015-04-10", "2015-06-16"]
m5 = ideas.days(history("M5")); m5 = m5[m5.time < pd.Timestamp(END, tz="UTC")]; op = m5.set_index("time").open
with contextlib.redirect_stdout(io.StringIO()): ta = ideas.run("A2", m5, ret=True, **ideas.VARIANTS["A2"])
a2 = ta.set_index("tag")
days = [d for d in sorted(set(m5.time.dt.normalize())) if d.weekday() < 5 and d + 12 * H in op.index and d + 8 * H in op.index]
rows = []
for i in range(1, len(days)):
    d, p = days[i], days[i - 1]
    if p + 20 * H not in op.index: continue
    o12, o20, o8 = op[p + 12 * H], op[p + 20 * H], op[d + 8 * H]; drive = (o20 - o12) / PIP
    if drive == 0: continue
    ds = d.strftime("%Y-%m-%d")
    rows.append(dict(day=ds, prev=p.strftime("%m-%d"), o12=o12, o20=o20, o8=o8, drive=drive, kept=(o8 - o12) / (o20 - o12), side=1 if drive > 0 else -1,
                     a2side=int(a2.side[ds]) if ds in a2.index else 0, part="P1" if ds < "2015-03-02" else "P2" if ds < "2015-04-07" else "P3", insp=ds in INSP))
F = pd.DataFrame(rows)
V = {"DH1": (F.drive.abs() >= 30) & (F.kept >= 0.5), "DH2": (F.drive.abs() >= 50) & (F.kept >= 0.5), "DH3": F.drive.abs() >= 30}
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(r.to_string()); print({k: bool(v[F.day == sys.argv[3]].iloc[0]) for k, v in V.items()})
    if len(sys.argv) < 5: sys.exit()
if MODE == "count":
    print(f"days with facts: {len(F)} ({F.day.iloc[0]} .. {F.day.iloc[-1]}); by part {F.part.value_counts().sort_index().to_dict()}")
    for k, v in V.items():
        J = F[v & ~F.insp]; print(f"{k}: all {int(v.sum())} | judged (inspiring dropped) {len(J)} | by part {J.part.value_counts().sort_index().to_dict()} | same side as A2 {int((J.side == J.a2side).sum())} of {int((J.a2side != 0).sum())}")
    I = F[F.insp]; v = V["DH1"]
    print(f"inspiring 12: with facts {len(I)}; DH1 in A2's direction {int((v & F.insp & (F.side == F.a2side)).sum())}; DH1 against A2 {int((v & F.insp & (F.side != F.a2side)).sum())}")
    A = F[(F.a2side != 0) & (F.day >= '2015-03-02') & (F.day < '2015-07-01')]; va = v[A.index]
    print(f"BASE RATE Mar-Jun: A2 days {len(A)}; DH1 in A2's direction {int((va & (A.side == A.a2side)).sum())} = {(va & (A.side == A.a2side)).mean():.0%}; DH1 against A2 {int((va & (A.side != A.a2side)).sum())}")
    print(I[["day", "prev", "drive", "kept", "side", "a2side"]].round(2).to_string()); sys.exit()
def trade(d, side, costs):
    x = m5[(m5.time >= d + 8 * H) & (m5.time <= d + 12 * H)]
    acct = Account(spread=costs[0] * PIP, slippage=costs[1] * PIP) if costs else Account()
    for _, bar in x.iterrows():
        if bar.time == d + 8 * H: acct.market(side, round(RISK / (SL * 10), 3), sl=bar.open - side * SL * PIP, tag="x")
        if acct.positions and bar.time >= d + 12 * H: acct.close()
        acct.on_bar(bar)
    if acct.positions: acct.close(); acct.on_bar(x.iloc[-1])
    t = acct.trades[-1]; return t["pnl"] / RISK, t["reason"], t["entry"], t["exit"]
def run(costs=None):
    R, O, W = [], [], []
    for _, r in F.iterrows():
        d = pd.Timestamp(r.day, tz="UTC"); a = trade(d, r.side, costs); b = trade(d, -r.side, costs); R.append(a[0]); O.append(b[0]); W.append(a[1])
    return np.array(R), np.array(O), W
F["R"], F["other"], F["why"] = run(); F["Rs"] = run((2.0, 0.5))[0]
if MODE == "check":
    r = F[F.day == sys.argv[3]].iloc[0]; print(f"trade: {'BUY' if r.side > 0 else 'SELL'} -> {r.why} {r.R:+.2f}R (other side {r.other:+.2f}R); engine A2 that day: side {r.a2side} {a2.R[r.day]:+.2f}R"); sys.exit()
m = F[(F.a2side != 0)]; same = m[m.side == m.a2side]; print(f"MECHANICS: on {len(same)} days where my side = A2's side, max |my R - engine A2 R| = {(same.R - a2.R.reindex(same.day).values).abs().max():.4f}")
def dd(r): eq = r.cumsum(); return (eq.cummax().clip(lower=0) - eq).max()
rng = np.random.default_rng(7); avg = {}
for k, v in V.items():
    J = F[v & ~F.insp].reset_index(drop=True); avg[k] = J.R.mean(); P = {p: J[J.part == p] for p in ("P1", "P2", "P3")}
    diff = (J.R - J.other).values; obs = diff.mean(); pv = (np.abs((rng.choice([-1, 1], (10000, len(diff))) * diff).mean(1)) >= abs(obs)).mean()
    ag = J[J.side == J.a2side]; dg = J[(J.side != J.a2side) & (J.a2side != 0)]
    print(f"{k}: judged {len(J)} | avg {J.R.mean():+.3f}R | net {J.R.sum():+.2f} | wins {(J.R > 0).mean():.0%} | full stops {(J.why == 'sl').mean():.0%} | " + " | ".join(f"{p}: {len(x)} net {x.R.sum():+.2f} avg {x.R.mean():+.3f}" for p, x in P.items()))
    print(f"     without best 2 {J.R.sum() - J.R.nlargest(2).sum():+.2f} | side minus other {obs:+.3f}R p {pv:.4f} | stressed avg {J.Rs.mean():+.3f} | max DD {dd(J.R):.2f}R | with A2: {len(ag)} avg {ag.R.mean():+.3f} | against A2: {len(dg)} avg {dg.R.mean():+.3f} | inspiring days (NOT judged): {int((v & F.insp).sum())} net {F[v & F.insp].R.sum():+.2f}")
    if k == "DH1":
        K = [J.R.mean() >= 0.10, P["P1"].R.sum() > 0 and P["P3"].R.sum() > 0, J.R.sum() - J.R.nlargest(2).sum() > 0, obs > 0 and pv < 0.05, J.Rs.mean() > 0, dd(J.R) <= 6.0]
        print("     KILL LINES: " + " | ".join(f"K{i+1} {'PASS' if z else 'FAIL'}" for i, z in enumerate(K)))
print(f"K7 dose: DH3 {avg['DH3']:+.3f} -> DH1 {avg['DH1']:+.3f} -> DH2 {avg['DH2']:+.3f}: {'PASS' if avg['DH2'] >= avg['DH1'] >= avg['DH3'] else 'FAIL'}")

"""Idea RB (journal/2015-idea-RB-back-to-paper-line.md): return rule as a state machine on resampled days. Gate: 40-day mean side advantage >= +0.60R -> live;
exit: mean < X -> paper. X = 0.00 (written), +0.20, +0.30. usage: python bt/exit_line_check.py END facts | test"""
import sys, io, contextlib, os
END, MODE = sys.argv[1], sys.argv[2]; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.argv = [sys.argv[0], END, "--state"]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "side_monitor.py")).read(); ns = {"__name__": "sm_defs", "__file__": os.path.join(os.path.dirname(os.path.abspath(__file__)), "side_monitor.py")}
with contextlib.redirect_stdout(io.StringIO()): exec(src[:src.index("D = pd.DataFrame(rows).set_index(\"tag\")")] + "D = pd.DataFrame(rows).set_index(\"tag\")", ns)
import numpy as np
D = ns["D"]; MID = "2015-04-07"; flat = D[D.index >= MID]; old = D[D.index < MID]
if MODE == "facts": print(f"days {len(D)} | last-40 mean advantage {D.adv.iloc[-40:].mean():+.3f}R | no-edge pool {len(flat)} days: adv mean {flat.adv.mean():+.3f}, my R mean {flat.mine.mean():+.3f} | healthy pool {len(old)} days: adv mean {old.adv.mean():+.3f}, my R mean {old.mine.mean():+.3f}"); sys.exit()
rng = np.random.default_rng(31); N, L, GATE = 5000, 250, 0.60
def sim(adv, mine, X):
    idx = rng.integers(0, len(adv), (N, L)); A = adv[idx]; Mn = mine[idx]; c = np.cumsum(np.insert(A, 0, 0, axis=1), axis=1); roll = (c[:, 40:] - c[:, :-40]) / 40   # roll[:, j] = mean of days j..j+39 -> known before day j+40
    live_share, r_live, spells, after_first = [], [], [], []
    for i in range(N):
        live = False; n = 0; r = 0.0; sp = []; cur = 0; first = None
        for j in range(L - 40):
            m = roll[i, j]
            if not live and m >= GATE: live = True; cur = 0; first = j if first is None else first
            elif live and m < X: live = False; sp.append(cur)
            if live: n += 1; cur += 1; r += Mn[i, j + 40]
        if live: sp.append(cur)
        live_share.append(n / (L - 40)); r_live.append(r); spells += sp
        if first is not None: after_first.append(n / (L - 40 - first))
    return np.mean(live_share), np.mean(r_live), (np.mean(spells) if spells else 0), (np.mean(after_first) if after_first else float("nan")), np.mean([s > 0 for s in live_share])
za, zm = (flat.adv - flat.adv.mean()).values, (flat.mine - flat.mine.mean()).values
for X in (0.00, 0.20, 0.30):
    a = sim(za, zm, X); b = sim(old.adv.values, old.mine.values, X)
    print(f"exit {X:+.2f}R | NO-EDGE: live {a[0]:.1%} of days, gets in at all in {a[4]:.0%} of runs, live spell {a[2]:.0f} days on average, R while live {a[1]:+.2f} per 210 days | HEALTHY: live {b[0]:.1%} of all days, {b[3]:.1%} of days after its first entry, R while live {b[1]:+.1f}")

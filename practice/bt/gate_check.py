"""Idea RA (journal/2015-idea-RA-is-route-A-gate-strong-enough.md): how often does route A's gate (40-day mean side advantage >= +0.30R) open by luck?
usage: python bt/gate_check.py END facts | test"""
import sys, io, contextlib, os
END, MODE = sys.argv[1], sys.argv[2]; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__))); sys.argv = [sys.argv[0], END, "--state"]
src = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "side_monitor.py")).read(); ns = {"__name__": "sm_defs", "__file__": os.path.join(os.path.dirname(os.path.abspath(__file__)), "side_monitor.py")}
with contextlib.redirect_stdout(io.StringIO()): exec(src[:src.index("D = pd.DataFrame(rows).set_index(\"tag\")")] + "D = pd.DataFrame(rows).set_index(\"tag\")", ns)   # the daily series only, byte for byte
import numpy as np
D = ns["D"]; adv = D.adv; MID = "2015-04-07"; flat = adv[adv.index >= MID]; old = adv[adv.index < MID]
if MODE == "facts":
    print(f"days {len(adv)} ({adv.index[0]}..{adv.index[-1]}) | last-40 mean (monitor for the next morning) {adv.iloc[-40:].mean():+.3f}R | pool from {MID}: {len(flat)} days mean {flat.mean():+.3f} sd {flat.std(ddof=1):.2f} | pool before: {len(old)} days mean {old.mean():+.3f} sd {old.std(ddof=1):.2f}"); sys.exit()
SEED = int(os.environ.get('GATE_SEED', 21)); rng = np.random.default_rng(SEED); N = 20000; print('seed', SEED)
def single(pool, thr): return (rng.choice(pool, (N, 40)).mean(1) >= thr).mean()
def sixty(pool, thr):
    x = rng.choice(pool, (N, 100)); c = np.cumsum(np.insert(x, 0, 0, axis=1), axis=1); roll = (c[:, 40:] - c[:, :-40]) / 40; return (roll[:, :60] >= thr).any(1).mean()
zero = (flat - flat.mean()).values
print(f"NO-EDGE pool ({len(zero)} days, mean 0.000, sd {zero.std(ddof=1):.2f}): gate +0.30R opens on a single morning {single(zero, 0.30):.1%} | at least once in 60 mornings {sixty(zero, 0.30):.1%}")
print(f"HEALTHY pool ({len(old)} days, mean {old.mean():+.3f}): single morning {single(old.values, 0.30):.1%} | in 60 mornings {sixty(old.values, 0.30):.1%}")
for thr in (0.40, 0.50, 0.60, 0.70, 0.80):
    print(f"   threshold +{thr:.2f}R: no-edge single {single(zero, thr):.1%}, in 60 mornings {sixty(zero, thr):.1%} | healthy single {single(old.values, thr):.1%}, in 60 {sixty(old.values, thr):.1%} | half-edge (healthy pool shifted to +0.30R mean) single {single(old.values - old.mean() + 0.30, thr):.1%}")
q = np.quantile(rng.choice(zero, (N, 40)).mean(1), 0.95); print(f"threshold with exactly 5% no-edge single-morning openings: +{q:.2f}R")

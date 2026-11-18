"""EN2 forward count (journal/EN2-forward-count-rules.md): bt/engulfing.py's own code (byte for byte), EN2 signals on or after START only.
usage: python bt/en2_forward.py START END"""
import sys, os, io, contextlib
START, END = sys.argv[1], sys.argv[2]; here = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, here); sys.argv = [sys.argv[0], END, "none"]
src = open(os.path.join(here, "engulfing.py")).read(); ns = {"__name__": "en_defs", "__file__": os.path.join(here, "engulfing.py")}
with contextlib.redirect_stdout(io.StringIO()): exec(src[:src.index("keep = {}")], ns)
import pandas as pd, numpy as np
S = ns["S2"]; S = S[S.day >= START].reset_index(drop=True)
if S.empty: print(f"EN2 forward from {START} to {END}: 0 trades"); sys.exit()
R = pd.Series([ns["trade"](r, r.dir)[0] for r in S.itertuples()]); eq = R.cumsum(); dd = (eq.cummax().clip(lower=0) - eq).max()
print(f"EN2 forward from {START} to {END}: {len(R)} trades | net {R.sum():+.2f}R | running max DD {dd:.2f}R (early-close line 8R) | no verdict before 120")

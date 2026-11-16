"""Candlestick chart of what you can see at the clock. Usage:
python chart.py --tf H1 --n 120 --out charts/h1.png   (charts/ is git-ignored)"""
import argparse
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from sim import Sim, label


def plot(df, path, title=""):
    fig, ax = plt.subplots(figsize=(14, 6))
    w = 0.6
    for i, r in enumerate(df.itertuples()):
        c = "#26a69a" if r.close >= r.open else "#ef5350"
        a = 0.4 if r.partial else 1.0
        ax.vlines(i, r.low, r.high, color=c, linewidth=1, alpha=a)
        ax.add_patch(plt.Rectangle((i - w / 2, min(r.open, r.close)), w,
                                   max(abs(r.close - r.open), 1e-6), color=c, alpha=a))
    n = len(df)
    if n:
        ticks = list(range(0, n, max(1, n // 10)))
        ax.set_xticks(ticks)
        ax.set_xticklabels([df["time"].iloc[i].strftime("%m-%d %H:%M") for i in ticks],
                           rotation=30, ha="right", fontsize=8)
        ax.set_xlim(-1, n)
    ax.set_title(title, fontsize=9)
    ax.grid(alpha=0.3)
    fig.tight_layout()
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, dpi=100)
    plt.close(fig)
    return path


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--tf", default="H1"); ap.add_argument("--n", type=int, default=120)
    ap.add_argument("--out", default="charts/chart.png")
    a = ap.parse_args()
    s = Sim()
    df = s.bars(a.tf, a.n)
    print(plot(df, a.out, f"EURUSD {a.tf} (bid, UTC) | {label(s.clock)} | faded = still forming"))

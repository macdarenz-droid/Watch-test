"""Study for a second setup (coach 06-23): how do the big hourly moves on my charts START - what did the hour before look like?
H1 bars built from M5 (London clock), weekdays. STUDY PERIOD ONLY (default 2015-01-06 .. 2015-03-31) so that the later months stay unseen for a test.
usage: python bt/big_moves.py START END [FIRST_HOUR LAST_HOUR]   (hours = London hour of the bar that might be big; default 12..20, when A2 is flat)"""
import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import ideas, pandas as pd, numpy as np
from backtest import history
START, END = sys.argv[1], sys.argv[2]; H0, H1_ = (int(sys.argv[3]), int(sys.argv[4])) if len(sys.argv) > 4 else (12, 20); PIP = 1e-4
m5 = ideas.days(history("M5")); m5 = m5[(m5.time >= pd.Timestamp(START, tz="UTC")) & (m5.time < pd.Timestamp(END, tz="UTC"))]
h = m5.set_index("time").resample("1h").agg(open=("open", "first"), high=("high", "max"), low=("low", "min"), close=("close", "last"), n=("open", "size")).dropna()
h = h[(h.n >= 10) & (h.index.weekday < 5)]
h["body"] = (h.close - h.open) / PIP; h["rng"] = (h.high - h.low) / PIP; h["hour"] = h.index.hour
p = h.shift(1)
prev_time = pd.Series(h.index, index=h.index).shift(1); cont = (h.index - prev_time) == pd.Timedelta(hours=1)
h["pbody"], h["prng"] = p.body, p.rng; h["p3hi"] = h.high.shift(1).rolling(3).max(); h["p3lo"] = h.low.shift(1).rolling(3).min()
x = h[cont & (h.hour >= H0) & (h.hour <= H1_)].dropna(); med = x.groupby("hour").rng.transform("median"); pmed = x.groupby("hour").prng.transform("median")
print(f"hours {H0}:00-{H1_}:59 London, {START}..{END}: {len(x)} hourly bars on {x.index.normalize().nunique()} days | |body| median {x.body.abs().median():.0f}, 90th pct {x.body.abs().quantile(.9):.0f}, 95th {x.body.abs().quantile(.95):.0f} pips | range median {x.rng.median():.0f}")
for B in (30, 40):
    big = x[x.body.abs() >= B]; s = np.sign(big.body)
    print(f"\nBIG hours (|body| >= {B} pips): {len(big)} ({len(big)/len(x):.1%} of hours) | by clock hour: " + " ".join(f"{k}h:{v}" for k, v in big.hour.value_counts().sort_index().items()))
    print(f"   the hour BEFORE: went the same way {((big.pbody * s) > 0).mean():.0%} (all hours: {((x.pbody * np.sign(x.body)) > 0).mean():.0%}) | its |body| median {big.pbody.abs().median():.0f} (all {x.pbody.abs().median():.0f}) | its range median {big.prng.median():.0f} (all {x.prng.median():.0f}) | narrow (under the median range for its clock hour) {(big.prng < pmed[big.index]).mean():.0%} | itself >= 20 pips body {(big.pbody.abs() >= 20).mean():.0%} (all {(x.pbody.abs() >= 20).mean():.0%})")
    print(f"   the big hour opened outside the previous 3 hours' range: {((big.open > big.p3hi) | (big.open < big.p3lo)).mean():.0%} | closed outside it: {((big.close > big.p3hi) | (big.close < big.p3lo)).mean():.0%}")
print("\nTHE OTHER WAY ROUND (what a rule could use): given the hour before, what does the NEXT hour do?")
def nxt(m, name):
    y = x[m]; s = np.sign(y.pbody); f = y.body * s
    print(f"   {name}: {len(y)} cases | next hour in the SAME direction {(f > 0).mean():.0%}, mean {f.mean():+.1f} pips, median {f.median():+.1f} | next hour |body| >= 30: {(y.body.abs() >= 30).mean():.0%} | next hour range median {y.rng.median():.0f}")
nxt(x.pbody.abs() >= 0, "any hour before (base)")
for T in (15, 20, 30, 40): nxt(x.pbody.abs() >= T, f"hour before |body| >= {T} pips")
nxt(x.prng < 0.6 * pmed, "hour before NARROW (range < 0.6 x median for its clock hour)")
nxt(x.prng > 1.6 * pmed, "hour before WIDE (range > 1.6 x median)")
pb = ((p.close > h.high.shift(2).rolling(3).max()) | (p.close < h.low.shift(2).rolling(3).min())).reindex(x.index).fillna(False)
nxt(pb, "hour before CLOSED outside the 3 hours before it (a break)")
nxt(pb & (x.pbody.abs() >= 20), "break AND |body| >= 20")

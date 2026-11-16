"""Practice simulator: an accelerated real-time clock + a demo/challenge account.

Your whole view of the market goes through this file. The clock is a timestamp
that only moves forward. You see only candles that have CLOSED at the clock time;
the candle that is still forming is shown as a partial candle built from the
1-minute candles closed so far (flag partial=True). Orders and open trades are
filled and managed by the account as the clock moves, on the 1-minute path:
- market orders fill at the open of the next 1-minute candle (+1.0 pip spread for buys,
  0.1 pip slippage against you),
- stop/limit entry orders fill when price touches them (gaps fill at the worse open),
- stop loss and take profit are checked every minute; if both are touched in the same
  minute, the STOP is assumed.
Prices are BID. Ask = bid + 1.0 pip. Times are UTC inside the files.

State lives in sim/state.json, every action is appended to sim/log.jsonl.
Price candles come only from feed/ (released month by month by your coach).

CLI:  python sim.py now | advance --minutes 15 | advance --until 2015-03-02T07:00 |
      bars --tf H1 --n 50 | buy 0.5 --sl 1.1000 --tp 1.1100 | sell ... |
      buy 0.5 --stop 1.1050 ... | sell 0.5 --limit 1.1080 ... | modify ID --sl X --tp Y |
      close [ID] | cancel ID | account | trades | new-challenge
"""
from __future__ import annotations

import argparse
import gzip
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

import numpy as np
import pandas as pd

ROOT = Path(__file__).resolve().parent
FEED = ROOT / "feed"
SIMDIR = ROOT / "sim"
UTC = timezone.utc
NY, LON, MEL = ZoneInfo("America/New_York"), ZoneInfo("Europe/London"), ZoneInfo("Australia/Melbourne")
PIP = 0.0001
SPREAD = 1.0 * PIP
SLIP = 0.1 * PIP
CONTRACT = 100_000
TF_MIN = {"M1": 1, "M5": 5, "M15": 15, "M30": 30, "H1": 60, "H4": 240, "D1": 1440}
SIZE, TARGETS, DAILY, MAXLOSS, MIN_DAYS = 25_000.0, (0.08, 0.05), 0.05, 0.10, 5


def _ts(x) -> pd.Timestamp:
    t = pd.Timestamp(x)
    return t.tz_localize("UTC") if t.tzinfo is None else t.tz_convert("UTC")


# ---------------------------------------------------------------- feed
def released_months(feed: Path = FEED) -> list[str]:
    return sorted(p.name[:7] for p in feed.glob("????-??.csv.gz"))


def _read_month(feed: Path, m: str) -> pd.DataFrame:
    with gzip.open(feed / f"{m}.csv.gz", "rt") as f:
        d = pd.read_csv(f)
    d["time"] = pd.to_datetime(d["time"], utc=True)
    return d


class Feed:
    """Loads 1-minute candles, never past the clock month."""

    def __init__(self, feed: Path = FEED):
        self.feed, self._cache = Path(feed), {}

    def m1(self, start: pd.Timestamp, end: pd.Timestamp) -> pd.DataFrame:
        """1-minute candles with open time in [start, end)."""
        months = [m for m in released_months(self.feed)
                  if f"{start:%Y-%m}" <= m <= f"{end:%Y-%m}"]
        parts = []
        for m in months:
            if m not in self._cache:
                self._cache[m] = _read_month(self.feed, m)
            d = self._cache[m]
            parts.append(d[(d["time"] >= start) & (d["time"] < end)])
        if not parts:
            return pd.DataFrame(columns=["time", "open", "high", "low", "close", "spread", "volume"])
        return pd.concat(parts, ignore_index=True)

    def data_end(self) -> pd.Timestamp | None:
        """Close time of the last released 1-minute candle (the hard ceiling)."""
        ms = released_months(self.feed)
        if not ms:
            return None
        d = _read_month(self.feed, ms[-1])
        return d["time"].iloc[-1] + pd.Timedelta(minutes=1)


# ---------------------------------------------------------------- time labels
def session(t: pd.Timestamp) -> str:
    ny = t.tz_convert(NY)
    wd, h = ny.weekday(), ny.hour  # market closed Fri 17:00 NY -> Sun 17:00 NY
    if wd == 5 or (wd == 4 and h >= 17) or (wd == 6 and h < 17):
        return "market closed (weekend)"
    lon = t.tz_convert(LON)
    x = lon.hour + lon.minute / 60
    if x < 8:
        return "Asia (Tokyo/Sydney)"
    if x < 13:
        return "London"
    if x < 16.5:
        return "London + New York overlap"
    if x < 22:
        return "New York"
    return "late New York / rollover"


def label(t) -> str:
    t = _ts(t)
    lon, mel = t.tz_convert(LON), t.tz_convert(MEL)
    return (f"{lon:%a %Y-%m-%d %H:%M} London | {t:%H:%M} UTC | {mel:%a %H:%M} Melbourne"
            f" | session: {session(t)}")


def server_day(t: pd.Timestamp) -> str:
    """Broker day rolls at 17:00 New York."""
    return (t.tz_convert(NY) + timedelta(hours=7)).strftime("%Y-%m-%d")


# ---------------------------------------------------------------- bars
def resample(m1: pd.DataFrame, tf: str) -> pd.DataFrame:
    if m1.empty:
        return m1.assign(partial=pd.Series(dtype=bool))
    if tf == "M1":
        return m1.assign(partial=False)
    g = m1.set_index("time").resample(f"{TF_MIN[tf]}min", label="left", closed="left")
    r = pd.DataFrame({"open": g["open"].first(), "high": g["high"].max(), "low": g["low"].min(),
                      "close": g["close"].last(), "spread": g["spread"].mean(),
                      "volume": g["volume"].sum()}).dropna(subset=["open"]).reset_index()
    r["partial"] = False
    return r


def bars(clock, tf: str = "H1", n: int = 200, partial: bool = True, feed: Feed | None = None) -> pd.DataFrame:
    """Last n candles of timeframe tf as of the clock. Only closed candles, plus (if
    partial=True) the still-forming candle built from closed 1-minute candles."""
    if tf not in TF_MIN:
        raise ValueError(f"tf must be one of {list(TF_MIN)}")
    clock, feed = _ts(clock), feed or Feed()
    span = pd.Timedelta(minutes=TF_MIN[tf] * (n + 2)) * (7 / 5) + pd.Timedelta(days=4)
    m1 = feed.m1(clock - span, clock)           # every row here closed by the clock
    r = resample(m1, tf)
    if not r.empty:
        last_open = r["time"].iloc[-1]
        if last_open + pd.Timedelta(minutes=TF_MIN[tf]) > clock:   # still forming
            if partial:
                r.loc[r.index[-1], "partial"] = True
            else:
                r = r.iloc[:-1]
    out = r.iloc[-n:].reset_index(drop=True)
    assert out.empty or (out["time"].iloc[-1] < clock)
    return out


# ---------------------------------------------------------------- account
def _new_state(clock) -> dict:
    return {"clock": _ts(clock).isoformat(), "next_id": 1, "orders": [], "positions": [],
            "challenge": _new_challenge(1, clock), "attempts": []}


def _new_challenge(n, t) -> dict:
    return {"attempt": n, "phase": 1, "status": "active", "reason": "", "balance": SIZE,
            "phase_start": _ts(t).isoformat(), "day": None, "sod_balance": SIZE,
            "trading_days": [], "low_equity": SIZE}


class Sim:
    def __init__(self, simdir: Path = SIMDIR, feed: Path = FEED):
        self.dir, self.feed = Path(simdir), Feed(feed)
        self.path = self.dir / "state.json"
        self.s = json.loads(self.path.read_text()) if self.path.exists() else _new_state("2015-01-01")

    # -- persistence
    def save(self):
        self.dir.mkdir(exist_ok=True)
        self.path.write_text(json.dumps(self.s, indent=1))

    def log(self, action: str, **kw):
        self.dir.mkdir(exist_ok=True)
        rec = {"real_utc": datetime.now(UTC).isoformat(timespec="seconds"),
               "clock": self.s["clock"], "action": action, **kw}
        with open(self.dir / "log.jsonl", "a") as f:
            f.write(json.dumps(rec, default=str) + "\n")

    @property
    def clock(self) -> pd.Timestamp:
        return _ts(self.s["clock"])

    @property
    def ch(self) -> dict:
        return self.s["challenge"]

    # -- views
    def bars(self, tf="H1", n=200, partial=True):
        self.log("bars", tf=tf, n=n)
        self.save()
        return bars(self.clock, tf, n, partial, self.feed)

    def price(self):
        b = self.feed.m1(self.clock - pd.Timedelta(days=4), self.clock)
        return None if b.empty else float(b["close"].iloc[-1])

    def equity(self, bid=None) -> float:
        bid = self.price() if bid is None else bid
        if bid is None:
            return self.ch["balance"]
        return self.ch["balance"] + sum(self._pnl(p, bid if p["side"] > 0 else bid + SPREAD)
                                        for p in self.s["positions"])

    @staticmethod
    def _pnl(p, px):
        return (px - p["entry"]) * CONTRACT * p["lots"] * p["side"]

    # -- orders
    def order(self, side: int, lots: float, sl=None, tp=None, stop=None, limit=None, tag=""):
        if self.ch["status"] != "active":
            raise RuntimeError(f"challenge is {self.ch['status']}; run new-challenge first")
        if lots <= 0 or side not in (1, -1) or (stop is not None and limit is not None):
            raise ValueError("bad order")
        kind = "stop" if stop is not None else "limit" if limit is not None else "market"
        o = {"id": self.s["next_id"], "side": side, "lots": float(lots), "kind": kind,
             "price": stop if stop is not None else limit, "sl": sl, "tp": tp, "tag": tag,
             "placed": self.s["clock"]}
        self.s["next_id"] += 1
        self.s["orders"].append(o)
        self.log("order", **o)
        self.save()
        return o["id"]

    def close(self, pid=None):
        self.s["orders"].append({"id": self.s["next_id"], "kind": "close", "target": pid,
                                 "placed": self.s["clock"]})
        self.s["next_id"] += 1
        self.log("close", target=pid)
        self.save()

    def cancel(self, oid):
        self.s["orders"] = [o for o in self.s["orders"] if o["id"] != oid]
        self.log("cancel", id=oid)
        self.save()

    def modify(self, pid, sl=None, tp=None):
        for p in self.s["positions"] + self.s["orders"]:
            if p["id"] == pid:
                if sl is not None:
                    p["sl"] = sl
                if tp is not None:
                    p["tp"] = tp
        self.log("modify", id=pid, sl=sl, tp=tp)
        self.save()

    def new_challenge(self):
        self._flatten(self.clock, self.price(), "new challenge")
        self.s["attempts"].append({k: self.ch[k] for k in
                                   ("attempt", "phase", "status", "reason", "balance", "phase_start")})
        self.s["challenge"] = _new_challenge(self.ch["attempt"] + 1, self.clock)
        self.s["orders"] = []
        self.log("new_challenge", attempt=self.ch["attempt"])
        self.save()

    # -- clock
    def advance(self, minutes: float = 0, until=None) -> str:
        """Move the clock forward, processing every 1-minute candle on the way."""
        t0 = self.clock
        t1 = _ts(until) if until is not None else t0 + pd.Timedelta(minutes=minutes)
        t1 = t1.floor("min")
        if t1 <= t0:
            raise ValueError("the clock only moves forward")
        note = ""
        end = self.feed.data_end()
        if end is None or t1 > end:
            t1 = max(t0, end) if end is not None else t0
            note = ("END OF RELEASED DATA: commit + push sim/ and your journal, then wait for "
                    "your coach to release more and run `git pull origin main`.")
        if t1 > t0:
            m1 = self.feed.m1(t0, t1)
            for r in m1.itertuples(index=False):
                self._on_m1(r)
            self.s["clock"] = t1.isoformat()
        self.log("advance", frm=t0.isoformat(), to=self.s["clock"], note=note)
        self.save()
        return note

    def _fill_px(self, side, o):  # market fill against you
        return o + SPREAD + SLIP if side > 0 else o - SLIP

    def _open_pos(self, od, px, t):
        p = {k: od[k] for k in ("id", "side", "lots", "sl", "tp", "tag")}
        p.update(entry=round(px, 6), entry_time=t.isoformat())
        self.s["positions"].append(p)
        self.ch["trading_days"] = sorted(set(self.ch["trading_days"]) | {server_day(t)})
        self.log("filled", id=p["id"], px=p["entry"], t=p["entry_time"])

    def _exit(self, p, px, t, reason):
        pnl = self._pnl(p, px)
        self.ch["balance"] += pnl
        self.s["positions"].remove(p)
        rec = {**p, "exit": round(px, 6), "exit_time": t.isoformat(), "pnl": round(pnl, 2),
               "reason": reason, "attempt": self.ch["attempt"], "phase": self.ch["phase"]}
        new = not (self.dir / "trades.csv").exists()
        pd.DataFrame([rec]).to_csv(self.dir / "trades.csv", mode="a", header=new, index=False)
        self.log("exit", **rec)

    def _flatten(self, t, bid, reason):
        for p in list(self.s["positions"]):
            if bid is None:
                self._exit(p, p["entry"], t, reason)
            else:
                self._exit(p, bid - SLIP if p["side"] > 0 else bid + SPREAD + SLIP, t, reason)

    def _on_m1(self, r):
        t, o, h, l, c = r.time, r.open, r.high, r.low, r.close
        ch = self.ch
        day = server_day(t)
        if day != ch["day"]:
            ch["day"], ch["sod_balance"] = day, ch["balance"]
        if ch["status"] != "active":
            return
        # 1) orders
        for od in list(self.s["orders"]):
            if od["kind"] == "close":
                for p in [p for p in self.s["positions"] if od["target"] in (None, p["id"])]:
                    self._exit(p, o - SLIP if p["side"] > 0 else o + SPREAD + SLIP, t, "close")
                self.s["orders"].remove(od)
                continue
            s, k, px = od["side"], od["kind"], od["price"]
            ao, ah, al = o + SPREAD, h + SPREAD, l + SPREAD     # ask path
            fill = None
            if k == "market":
                fill = self._fill_px(s, o)
            elif s > 0 and k == "stop" and ah >= px:
                fill = max(ao, px) + SLIP
            elif s > 0 and k == "limit" and al <= px:
                fill = min(ao, px)
            elif s < 0 and k == "stop" and l <= px:
                fill = min(o, px) - SLIP
            elif s < 0 and k == "limit" and h >= px:
                fill = max(o, px)
            if fill is not None:
                self.s["orders"].remove(od)
                self._open_pos(od, fill, t)
        # 2) stops / targets, stop first
        for p in list(self.s["positions"]):
            if p["side"] > 0:
                if p["sl"] is not None and l <= p["sl"]:
                    self._exit(p, min(o, p["sl"]) - SLIP, t, "sl")
                elif p["tp"] is not None and h >= p["tp"]:
                    self._exit(p, max(o, p["tp"]), t, "tp")
            else:
                if p["sl"] is not None and h + SPREAD >= p["sl"]:
                    self._exit(p, max(o + SPREAD, p["sl"]) + SLIP, t, "sl")
                elif p["tp"] is not None and l + SPREAD <= p["tp"]:
                    self._exit(p, min(o + SPREAD, p["tp"]), t, "tp")
        # 3) challenge rules (floating losses count, worst point of the minute)
        worst = ch["balance"] + sum(self._pnl(p, l if p["side"] > 0 else h + SPREAD)
                                    for p in self.s["positions"])
        ch["low_equity"] = min(ch["low_equity"], worst)
        if worst <= ch["sod_balance"] * (1 - DAILY):
            return self._fail(t, c, f"daily loss limit on server day {day}")
        if worst <= SIZE * (1 - MAXLOSS):
            return self._fail(t, c, "max loss limit")
        tgt = SIZE * (1 + TARGETS[ch["phase"] - 1])
        if not self.s["positions"] and ch["balance"] >= tgt and len(ch["trading_days"]) >= MIN_DAYS:
            self.log("phase_passed", phase=ch["phase"], balance=ch["balance"])
            if ch["phase"] == len(TARGETS):
                ch["status"], ch["reason"] = "passed", f"both phases passed {t:%Y-%m-%d}"
            else:
                ch.update(phase=ch["phase"] + 1, balance=SIZE, sod_balance=SIZE,
                          trading_days=[], phase_start=t.isoformat(), low_equity=SIZE)

    def _fail(self, t, c, reason):
        self._flatten(t, c, "breach")
        self.s["orders"] = []
        self.ch["status"], self.ch["reason"] = "failed", reason
        self.log("breach", reason=reason)

    # -- summary
    def summary(self) -> str:
        ch, px = self.ch, self.price()
        lines = [f"clock: {label(self.clock)}",
                 f"last price (bid): {px if px is not None else '-'}",
                 f"challenge #{ch['attempt']} phase {ch['phase']} {ch['status']} {ch['reason']}".rstrip(),
                 f"balance {ch['balance']:.2f}  equity {self.equity(px):.2f}  start-of-day {ch['sod_balance']:.2f}"
                 f"  trading days {len(ch['trading_days'])}"]
        for p in self.s["positions"]:
            lines.append(f"  pos #{p['id']} {'BUY' if p['side'] > 0 else 'SELL'} {p['lots']} @ {p['entry']}"
                         f" sl {p['sl']} tp {p['tp']} {p['tag']}")
        for o in self.s["orders"]:
            lines.append(f"  order #{o['id']} {o}")
        return "\n".join(lines)


# ---------------------------------------------------------------- CLI
def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sp = ap.add_subparsers(dest="cmd", required=True)
    sp.add_parser("now"); sp.add_parser("account"); sp.add_parser("trades"); sp.add_parser("new-challenge")
    a = sp.add_parser("advance"); a.add_argument("--minutes", type=float, default=0)
    a.add_argument("--hours", type=float, default=0); a.add_argument("--until")
    b = sp.add_parser("bars"); b.add_argument("--tf", default="H1"); b.add_argument("--n", type=int, default=30)
    for side in ("buy", "sell"):
        o = sp.add_parser(side); o.add_argument("lots", type=float)
        for k in ("sl", "tp", "stop", "limit"):
            o.add_argument(f"--{k}", type=float)
        o.add_argument("--tag", default="")
    m = sp.add_parser("modify"); m.add_argument("id", type=int)
    m.add_argument("--sl", type=float); m.add_argument("--tp", type=float)
    c = sp.add_parser("close"); c.add_argument("id", type=int, nargs="?")
    x = sp.add_parser("cancel"); x.add_argument("id", type=int)
    args = ap.parse_args(argv)
    sim = Sim()
    if args.cmd == "advance":
        note = sim.advance(args.minutes + 60 * args.hours, args.until)
        print(sim.summary())
        if note:
            print(note)
    elif args.cmd == "bars":
        print(sim.bars(args.tf, args.n).to_string(index=False))
        print(label(sim.clock))
    elif args.cmd in ("buy", "sell"):
        oid = sim.order(1 if args.cmd == "buy" else -1, args.lots, args.sl, args.tp, args.stop, args.limit, args.tag)
        print(f"order #{oid} queued (fills from the next minute)")
    elif args.cmd == "modify":
        sim.modify(args.id, args.sl, args.tp)
    elif args.cmd == "close":
        sim.close(args.id)
        print("close queued (next minute open)")
    elif args.cmd == "cancel":
        sim.cancel(args.id)
    elif args.cmd == "new-challenge":
        sim.new_challenge()
        print(sim.summary())
    elif args.cmd == "trades":
        p = sim.dir / "trades.csv"
        print(pd.read_csv(p).tail(30).to_string(index=False) if p.exists() else "no trades yet")
    else:
        print(sim.summary())


if __name__ == "__main__":
    main()
